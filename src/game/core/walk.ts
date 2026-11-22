/**
 * Une vie jouée à pied (fiches 0020, 0022 et 0030) : le moteur, le temps d'un chapitre, les gestes du joueur
 * et ce que les villageois lui disent.
 *
 * Pendant un chapitre, une saison se joue à la vitesse de la marche. Au début de chaque saison, on sait déjà ce que
 * chacun va récolter et verser : on rejoue la partie sur une copie (`replay`) et on calcule la saison d'avance.
 * Ni la récolte du joueur ni ce que font les autres villageois avant les sanctions ne dépendent de ce que le
 * joueur décide pendant la saison ; la prévision est donc exacte (testé). Le hasard du moteur n'est jamais touché.
 * À la fin de la saison, le moteur calcule la vraie saison avec la ligne de conduite du joueur.
 *
 * Entre deux chapitres, le temps file ; seuls les moments graves l'arrêtent, par une carte.
 *
 * Pas de Phaser ni de DOM ici. Les textes sont des clés de traduction : l'interface les traduit.
 */
import type { TextKey } from '../../i18n';
import {
  Simulation,
  isAdult,
  mean,
  replay,
  type Composition,
  type LastActions,
  type PlayerConduct,
  type SimConfig,
  type SimParams,
  type Villager,
} from '../../sim';
import { villagerName } from '../../vie/names';
import { buildVillageMap, type VillageMap } from './villageMap';
import { hasGiven } from './walkChoreo';

/**
 * Le rythme d'une vie jouée. Ces nombres ne touchent pas le moteur, mais ils décident quand le joueur peut agir
 * et changer d'avis : ils sont affichés dans le jeu (« Le rythme de la vie »).
 */
export const LIFE_PACING = {
  /** Durée d'une saison jouée à pied, en millisecondes. */
  seasonMs: 75_000,
  /** Âges de début des chapitres. Le premier dure jusqu'à la fin de la première année adulte. */
  chapterAges: [15, 25, 35, 45, 55],
  /** Durée d'un chapitre adulte, en années. */
  chapterYears: 1,
  /** Nombre de lancers possibles à l'étang : 5 lancers = pêcher le maximum, 0 = ne pas pêcher. */
  maxCasts: 5,
  /** Délai minimal, en saisons, avant qu'une même carte revienne. */
  cooldown: 8,
  /** Décennies racontées après la mort. */
  epilogueDecades: 5,
} as const;

export interface Line {
  key: TextKey;
  vars?: Record<string, string | number>;
}

export interface CardChoice {
  /** Identifiant pour l'interface : « conduct » ouvre la ligne de conduite, « replay » et « new » relancent. */
  id: string;
  label: Line;
  run?: () => void;
}

export interface Card {
  id: string;
  title: Line;
  /** Le villageois qui parle, s'il y en a un. */
  speaker?: number;
  lines: Line[];
  choices: CardChoice[];
}

export interface TalkAction {
  label: Line;
  /** Explication sous le bouton (coût, conditions). */
  help?: Line;
  run: () => void;
}

export interface Talk {
  id: number;
  name: string;
  relation: Line | null;
  lines: Line[];
  actions: TalkAction[];
}

export interface SeasonSummary {
  season: number;
  ageYears: number;
  adult: boolean;
  harvest: number;
  contributed: number;
  received: number;
  caught: number;
  fines: number;
  wealth: number;
  lines: Line[];
}

export type LifePhase = 'chapter' | 'between' | 'dead' | 'over';

export interface LifeSettings {
  seed: number;
  size: number;
  composition: Composition;
  params: Partial<SimParams>;
}

type Forecast = Pick<LastActions, 'harvest' | 'share' | 'contributed' | 'effort'>;

const SEASONS: TextKey[] = ['life.season.0', 'life.season.1', 'life.season.2', 'life.season.3'];

/** Arrondi pour les répliques : un chiffre après la virgule au plus. */
const r1 = (x: number) => Math.round(x * 10) / 10;

export class WalkSession {
  readonly sim: Simulation;
  readonly config: SimConfig;
  readonly settings: LifeSettings;
  readonly playerId: number;
  readonly parentId: number | null;
  phase: LifePhase = 'chapter';
  chapter = 0;
  /** Temps écoulé dans la saison en cours, en millisecondes. */
  clock = 0;
  map: VillageMap;
  /** Cartes en attente : la première est affichée ; le temps ne passe pas tant qu'il en reste. */
  readonly cards: Card[] = [];
  /** Bilan de la dernière saison calculée, pour le joueur. */
  summary: SeasonSummary | null = null;
  /** Niveau de l'étang avant et après la dernière saison (fraction de la capacité), pour l'animation. */
  pondBefore = 1;
  pondNow = 1;

  /** Ce que chacun récoltera et versera cette saison (prévision exacte, voir plus haut). */
  private forecast = new Map<number, Forecast>();
  /** Sacs que le joueur a versés cette saison (null : pas encore passé au grenier). */
  given: number | null = null;
  /** Lancers du joueur cette saison (null : pas encore passé à l'étang). */
  casts: number | null = null;
  /** Villageois que le joueur veut sanctionner cette saison. */
  readonly wantsToSanction = new Set<number>();

  private readonly lastCard = new Map<string, number>();
  private childAnswer: 'yes' | 'later' | 'never' | null = null;
  private childAskedChapter = -1;
  private readonly knownChildren = new Set<number>();
  private decade: Line[] = [];
  /** Parts versées par les voisins au chapitre précédent, pour dire ce qui a changé. */
  private previousShares = new Map<number, number>();
  private previousAge = 0;
  private metParent = false;
  private deathAge = 0;
  private deathWealth = 0;
  private starved = false;

  constructor(settings: LifeSettings) {
    this.settings = settings;
    const conduct: PlayerConduct = { share: 'neighbors', restraint: 'neighbors', children: false };
    this.config = { seed: settings.seed, size: settings.size, composition: settings.composition, params: settings.params, life: { conduct } };
    this.sim = new Simulation(this.config);
    this.playerId = this.sim.state.controlledId!;
    this.parentId = this.player?.parentId ?? null;
    this.map = buildVillageMap(this.houseCount());
    this.pondBefore = this.pondNow = this.pondLevel();
    this.computeForecast();
    this.cards.push(this.openingCard());
  }

  // --- Lecture ---

  get p(): SimParams {
    return this.sim.state.params;
  }

  get player(): Villager | undefined {
    return this.sim.controlled;
  }

  get conduct(): PlayerConduct | null {
    return this.sim.state.conduct;
  }

  get progress(): number {
    return Math.min(1, this.clock / LIFE_PACING.seasonMs);
  }

  get ageYears(): number {
    const v = this.player;
    return v ? Math.floor(v.ageSeasons / this.p.seasonsPerYear) : this.deathAge;
  }

  /** Saison de l'année qui se joue (0 = printemps). */
  get seasonOfYear(): number {
    return this.sim.state.season % this.p.seasonsPerYear;
  }

  get seasonName(): Line {
    return { key: SEASONS[this.seasonOfYear] ?? 'life.season.0' };
  }

  get playerAdult(): boolean {
    const v = this.player;
    return !!v && isAdult(v, this.p);
  }

  /** Sacs récoltés par le joueur cette saison (0 s'il est encore enfant). */
  get sacks(): number {
    const f = this.forecast.get(this.playerId);
    return f ? Math.round(f.harvest) : 0;
  }

  /** Ce qu'un villageois récolte et verse cette saison, d'après la prévision. */
  forecastOf(id: number): Forecast | undefined {
    return this.forecast.get(id);
  }

  byId(id: number | null): Villager | undefined {
    return id === null ? undefined : this.sim.state.villagers.find((v) => v.id === id);
  }

  adults(): Villager[] {
    return this.sim.state.villagers.filter((v) => isAdult(v, this.p));
  }

  /** Les voisins que le joueur observe (ceux qui forment sa croyance quand le voisinage du moteur est actif). */
  observed(): Villager[] {
    const k = this.p.observedNeighbors;
    if (k <= 0) return [];
    return this.sim.neighbors(this.playerId, k).filter((v) => v.id !== this.playerId);
  }

  /** Les villageois qui observent le joueur. */
  observers(): Villager[] {
    const k = this.p.observedNeighbors;
    if (k <= 0 || !this.player) return [];
    return this.adults().filter((v) => v.id !== this.playerId && this.sim.neighbors(v.id, k).some((n) => n.id === this.playerId));
  }

  homeOf(id: number): number {
    return this.byId(id)?.home ?? 0;
  }

  relation(v: Villager): Line | null {
    const name = villagerName(v.id);
    if (v.id === this.playerId) return null;
    if (v.id === this.parentId) return { key: 'life.rel.parent', vars: { name } };
    if (v.parentId === this.playerId) return { key: 'life.rel.child', vars: { name } };
    if (v.parentId !== null && v.parentId === this.parentId) return { key: 'life.rel.sibling', vars: { name } };
    if (this.player && this.player.parentId !== null && v.id === this.byId(this.player.parentId)?.parentId)
      return { key: 'life.rel.grandparent', vars: { name } };
    if (this.player && v.home === this.player.home) return { key: 'life.rel.household', vars: { name } };
    return null;
  }

  // --- Le temps ---

  /** Fait passer le temps d'une saison à pied. Renvoie vrai si une saison vient d'être calculée. */
  tick(dtMs: number): boolean {
    if (this.phase !== 'chapter' || this.cards.length > 0) return false;
    this.clock += dtMs;
    if (this.clock < LIFE_PACING.seasonMs) return false;
    this.endSeason();
    return true;
  }

  /** Dormir chez soi : la saison se termine tout de suite. */
  sleep(): void {
    if (this.phase !== 'chapter' || this.cards.length > 0) return;
    this.endSeason();
  }

  /**
   * Après une carte : entre deux chapitres, le temps repart. Sauf si le joueur veut d'abord changer sa ligne de
   * conduite : l'interface appelle `fastForward` quand il a fini.
   */
  resolve(choice?: CardChoice): void {
    this.cards.shift();
    choice?.run?.();
    if (choice?.id === 'conduct') return;
    if (this.cards.length === 0 && this.phase === 'between') this.fastForward();
  }

  // --- Gestes et décisions ---

  canGive(): boolean {
    return this.phase === 'chapter' && this.given === null && this.sacks > 0;
  }

  /** Porter n sacs au grenier : fixe la part versée, qui devient la ligne de conduite. */
  give(n: number): void {
    if (!this.canGive()) return;
    const sacks = this.sacks;
    const k = Math.max(0, Math.min(sacks, Math.round(n)));
    this.given = k;
    this.setConduct({ share: k / sacks });
  }

  canFish(): boolean {
    return this.phase === 'chapter' && this.casts === null && this.playerAdult;
  }

  /** Lancer sa ligne n fois : fixe l'effort de pêche (n / maxCasts), qui devient la ligne de conduite. */
  fish(n: number): void {
    if (!this.canFish()) return;
    const k = Math.max(0, Math.min(LIFE_PACING.maxCasts, Math.round(n)));
    this.casts = k;
    this.setConduct({ restraint: 1 - k / LIFE_PACING.maxCasts });
  }

  setConduct(change: Partial<PlayerConduct>): void {
    const current = this.conduct;
    if (!current) return;
    this.sim.act({ kind: 'conduct', conduct: { ...current, ...change } });
  }

  setRules(granary: boolean, pond: boolean): void {
    this.sim.act({ kind: 'rules', granary, pond });
  }

  // --- Ce que disent les villageois ---

  talk(id: number): Talk | null {
    const v = this.byId(id);
    if (!v || v.id === this.playerId) return null;
    const name = villagerName(v.id);
    const t = this.progress;
    const lines: Line[] = [];
    const actions: TalkAction[] = [];
    const p = this.p;
    const f = this.forecast.get(v.id);

    if (v.id === this.parentId && !this.metParent && this.player && !this.playerAdult) {
      this.metParent = true;
      lines.push({ key: 'life.talk.parentIntro1' }, { key: 'life.talk.parentIntro2' });
    }

    if (!isAdult(v, p)) {
      const parent = this.byId(v.parentId);
      lines.push(parent ? { key: 'life.talk.child', vars: { name, parent: villagerName(parent.id) } } : { key: 'life.talk.orphan', vars: { name } });
      lines.push({ key: 'life.talk.childWork', vars: { age: p.adultAge } });
      return { id, name, relation: this.relation(v), lines, actions };
    }

    if (f && f.harvest > 0) {
      const h = Math.round(f.harvest);
      const g = Math.round(f.contributed);
      lines.push({ key: hasGiven(v.id, t) ? 'life.talk.gave' : 'life.talk.willGive', vars: { harvest: h, given: g } });
    }
    if (v.last.harvest > 0) lines.push({ key: 'life.talk.caughtLast', vars: { caught: r1(v.last.caught) } });
    lines.push({ key: 'life.talk.wealth', vars: { wealth: Math.round(v.wealth) } });
    if (v.hungerSeasons > 0) lines.push({ key: 'life.talk.hungry', vars: { n: v.hungerSeasons } });
    const fines = v.last.sanctionsReceived + v.last.pondSanctionsReceived;
    if (fines > 0) lines.push({ key: 'life.talk.fined', vars: { lost: fines * p.sanctionFine } });
    if (this.sim.state.chief?.id === v.id) lines.push({ key: rulesKey(p.sanctionsEnabled, p.pondSanctionsEnabled, 'life.talk.chief') });

    // Le voisinage : qui voit qui, dit par les villageois.
    const k = p.observedNeighbors;
    if (k > 0 && this.player) {
      const theySee = this.sim.neighbors(v.id, k).filter((n) => n.id !== v.id);
      const seesPlayer = theySee.some((n) => n.id === this.playerId);
      const me = this.player;
      if (seesPlayer && isAdult(me, p) && me.last.harvest > 0) {
        lines.push({ key: 'life.talk.seesYou', vars: { given: Math.round(me.last.contributed), harvest: Math.round(me.last.harvest) } });
      } else if (seesPlayer) {
        lines.push({ key: 'life.talk.seesYouYoung' });
      }
      if (this.observed().some((n) => n.id === v.id)) lines.push({ key: 'life.talk.youSee', vars: { name } });
    }

    // Sanctionner, au cas par cas, face au villageois (fiche 0022) : seulement si le village l'autorise.
    if (this.phase === 'chapter' && this.playerAdult && f && !this.wantsToSanction.has(v.id)) {
      const others = [...this.forecast.entries()].filter(([oid, o]) => oid !== this.playerId && o.harvest > 0);
      const avgShare = mean(others.map(([, o]) => o.share));
      if (p.sanctionsEnabled && f.share < avgShare - p.sanctionGap) {
        actions.push({
          label: { key: 'life.talk.sanction', vars: { name } },
          help: { key: 'life.talk.sanctionHelp', vars: { cost: p.sanctionCost, fine: p.sanctionFine } },
          run: () => {
            if (this.sim.act({ kind: 'sanction', targetId: v.id, domain: 'granary' })) this.wantsToSanction.add(v.id);
          },
        });
      }
    }

    return { id, name, relation: this.relation(v), lines, actions };
  }

  // --- Les étapes d'une vie ---

  private houseCount(): number {
    return this.sim.state.villagers.reduce((m, v) => Math.max(m, v.home), 0) + 1;
  }

  private pondLevel(): number {
    const s = this.sim.state;
    return s.pondCapacity > 0 ? s.pondStock / s.pondCapacity : 0;
  }

  /** Rejoue la partie sur une copie et calcule la saison qui commence, pour savoir d'avance ce que chacun récolte. */
  private computeForecast(): void {
    this.forecast.clear();
    if (!this.player) return;
    const copy = replay(this.config, this.sim.state.journal, this.sim.state.season);
    const adults = new Set(this.adults().map((v) => v.id));
    copy.step();
    for (const v of copy.state.villagers) {
      if (!adults.has(v.id)) continue;
      this.forecast.set(v.id, { harvest: v.last.harvest, share: v.last.share, contributed: v.last.contributed, effort: v.last.effort });
    }
  }

  private chapterEndSeason(): number {
    const spy = this.p.seasonsPerYear;
    if (this.chapter === 0) return (this.p.adultAge + LIFE_PACING.chapterYears) * spy;
    return ((LIFE_PACING.chapterAges[this.chapter] ?? 0) + LIFE_PACING.chapterYears) * spy;
  }

  private endSeason(): void {
    this.advance();
    this.clock = 0;
    this.given = null;
    this.casts = null;
    this.wantsToSanction.clear();
    if (this.phase !== 'chapter') return;
    const v = this.player;
    if (v && v.ageSeasons >= this.chapterEndSeason()) {
      this.endChapter();
      return;
    }
    this.computeForecast();
  }

  /** Calcule une saison et en tire le récit. */
  private advance(): void {
    const sim = this.sim;
    const before = new Map(sim.state.villagers.map((v) => [v.id, { age: v.ageSeasons, life: v.lifespanYears }]));
    const me = this.player;
    const wealthBefore = me?.wealth ?? 0;
    const houses = this.houseCount();
    this.pondBefore = this.pondLevel();
    sim.step();
    this.pondNow = this.pondLevel();
    if (this.houseCount() !== houses) this.map = buildVillageMap(this.houseCount());

    const lines = this.familyNews(before);
    const v = this.player;
    if (!v) {
      const b = before.get(this.playerId);
      this.deathAge = Math.floor((me?.ageSeasons ?? 0) / this.p.seasonsPerYear);
      this.starved = !!b && (b.age + 1) / this.p.seasonsPerYear < b.life;
      this.deathWealth = wealthBefore;
      this.die();
      return;
    }
    lines.push(...this.villageNews(before));
    this.summary = this.summarize(v, lines);
    if (this.phase === 'between') this.decade.push(...lines);
    this.graveMoments(v);
  }

  private summarize(v: Villager, news: Line[]): SeasonSummary {
    const l = v.last;
    const adult = l.harvest > 0;
    const fines = l.sanctionsReceived + l.pondSanctionsReceived;
    const lines: Line[] = [];
    const season = SEASONS[(this.sim.state.season - 1) % this.p.seasonsPerYear] ?? 'life.season.0';
    if (adult) {
      lines.push({
        key: 'life.summary.adult',
        vars: { harvest: r1(l.harvest), given: r1(l.contributed), received: r1(l.received), caught: r1(l.caught) },
      });
    } else {
      const parent = this.byId(this.parentId);
      lines.push(parent ? { key: 'life.summary.child', vars: { parent: villagerName(parent.id) } } : { key: 'life.summary.alone' });
    }
    if (fines > 0) lines.push({ key: 'life.summary.fined', vars: { n: fines, lost: fines * this.p.sanctionFine } });
    if (l.sanctionsGiven > 0) lines.push({ key: 'life.summary.sanctioned', vars: { n: l.sanctionsGiven, cost: l.sanctionsGiven * this.p.sanctionCost } });
    for (const o of this.sim.state.playerSanctions) {
      if (!o.applied) lines.push({ key: 'life.summary.sanctionRefused', vars: { name: villagerName(o.targetId) } });
    }
    if (v.hungerSeasons > 0) lines.push({ key: 'life.summary.hungry', vars: { n: v.hungerSeasons, max: this.p.starvationSeasons } });
    lines.push(...news);
    return {
      season: this.sim.state.season,
      ageYears: this.ageYears,
      adult,
      harvest: l.harvest,
      contributed: l.contributed,
      received: l.received,
      caught: l.caught,
      fines,
      wealth: v.wealth,
      lines: [{ key: season }, ...lines],
    };
  }

  /** Naissances et morts dans la famille. */
  private familyNews(before: Map<number, { age: number; life: number }>): Line[] {
    const out: Line[] = [];
    const s = this.sim.state;
    const now = new Set(s.villagers.map((v) => v.id));
    const spy = this.p.seasonsPerYear;
    const age = this.player ? Math.floor(this.player.ageSeasons / spy) : this.deathAge;
    for (const [id, b] of before) {
      if (now.has(id) || id === this.playerId) continue;
      if (id !== this.parentId && !this.knownChildren.has(id)) continue;
      const died = Math.floor((b.age + 1) / spy);
      const starved = (b.age + 1) / spy < b.life;
      const key = id === this.parentId ? (starved ? 'life.news.parentStarved' : 'life.news.parentDied') : starved ? 'life.news.childStarved' : 'life.news.childDied';
      out.push({ key, vars: { name: villagerName(id), age: died, you: age } });
      this.knownChildren.delete(id);
    }
    for (const v of s.villagers) {
      if (!before.has(v.id) && v.parentId === this.playerId) {
        this.knownChildren.add(v.id);
        out.push({ key: 'life.news.birth', vars: { name: villagerName(v.id), you: age } });
      }
    }
    return out;
  }

  /** Sécheresses, nouveaux venus, chefs. */
  private villageNews(before: Map<number, unknown>): Line[] {
    const out: Line[] = [];
    const s = this.sim.state;
    const history = s.history;
    const age = this.ageYears;
    if (history.at(-1)?.drought && !history.at(-2)?.drought) out.push({ key: 'life.news.drought', vars: { you: age } });
    if (history.at(-1)?.arrivals) {
      const names = s.villagers.filter((v) => !before.has(v.id) && v.parentId === null).map((v) => villagerName(v.id));
      if (names.length > 0) out.push({ key: 'life.news.arrivals', vars: { n: names.length, names: names.join(', '), you: age } });
    }
    const e = s.chiefEvent;
    if (e && e.chiefId !== this.playerId) {
      out.push({ key: `life.news.chief.${e.path}` as TextKey, vars: { name: villagerName(e.chiefId), k: this.p.chiefCandidates, you: age } });
      if (e.rules) out.push({ key: rulesKey(e.rules.granary, e.rules.pond, 'life.rules') });
    }
    return out;
  }

  private cooled(id: string): boolean {
    const last = this.lastCard.get(id);
    return last === undefined || this.sim.state.season - last >= LIFE_PACING.cooldown;
  }

  private push(card: Card): void {
    this.lastCard.set(card.id, this.sim.state.season);
    this.cards.push(card);
  }

  /** Les moments graves : une sanction reçue, la faim, un enfant possible, la place de chef. */
  private graveMoments(v: Villager): void {
    const p = this.p;
    const l = v.last;
    const changeOrKeep: CardChoice[] = [
      { id: 'conduct', label: { key: 'life.card.changeConduct' } },
      { id: 'keep', label: { key: 'life.card.keep' } },
    ];

    if ((l.sanctionsReceived > 0 || l.pondSanctionsReceived > 0) && this.cooled('sanctioned')) {
      const adults = this.adults();
      const pond = l.sanctionsReceived === 0;
      const lines: Line[] = pond
        ? [{ key: 'life.card.sanctionedPond', vars: { effort: r1(l.effort), avg: r1(mean(adults.map((a) => a.last.effort))) } }]
        : [{ key: 'life.card.sanctionedGranary', vars: { given: r1(l.contributed), harvest: r1(l.harvest), avg: Math.round(mean(adults.map((a) => a.last.share)) * 10) } }];
      lines.push({ key: 'life.card.sanctionedCost', vars: { lost: (l.sanctionsReceived + l.pondSanctionsReceived) * p.sanctionFine, cost: p.sanctionCost } });
      this.push({ id: 'sanctioned', title: { key: 'life.card.sanctionedTitle' }, speaker: l.punishedBy[0], lines, choices: changeOrKeep });
    }

    if (v.hungerSeasons > 0 && this.cooled('hunger')) {
      this.push({
        id: 'hunger',
        title: { key: 'life.card.hungerTitle' },
        lines: [{ key: 'life.card.hunger', vars: { n: v.hungerSeasons, max: p.starvationSeasons, need: p.consumption } }],
        choices: changeOrKeep,
      });
    }

    const age = v.ageSeasons / p.seasonsPerYear;
    const fertile = age >= p.fertileAgeMin && age <= p.fertileAgeMax;
    const askAgain = this.childAnswer === null || (this.childAnswer === 'later' && this.childAskedChapter !== this.chapter);
    if (fertile && v.wealth >= p.birthWealthThreshold && askAgain) {
      this.childAskedChapter = this.chapter;
      const answer = (a: 'yes' | 'later' | 'never') => () => {
        this.childAnswer = a;
        this.setConduct({ children: a === 'yes' });
      };
      this.push({
        id: 'child',
        title: { key: 'life.card.childTitle' },
        lines: [{ key: 'life.card.child', vars: { wealth: Math.round(v.wealth), endowment: p.birthEndowment, upkeep: p.childConsumption, adult: p.adultAge } }],
        choices: [
          { id: 'yes', label: { key: 'life.card.childYes' }, run: answer('yes') },
          { id: 'later', label: { key: 'life.card.childLater' }, run: answer('later') },
          { id: 'never', label: { key: 'life.card.childNever' }, run: answer('never') },
        ],
      });
    }

    const e = this.sim.state.chiefEvent;
    if (e && e.chiefId === this.playerId) {
      const set = (g: boolean, pd: boolean) => () => this.setRules(g, pd);
      this.push({
        id: 'chief',
        title: { key: 'life.card.chiefTitle' },
        lines: [{ key: `life.card.chief.${e.path}` as TextKey, vars: { k: p.chiefCandidates, years: p.chiefTermYears } }, { key: 'life.card.chiefRules' }],
        choices: [
          { id: 'none', label: { key: 'life.rules.none' }, run: set(false, false) },
          { id: 'granary', label: { key: 'life.rules.granary' }, run: set(true, false) },
          { id: 'pond', label: { key: 'life.rules.pond' }, run: set(false, true) },
          { id: 'both', label: { key: 'life.rules.both' }, run: set(true, true) },
        ],
      });
    }
  }

  private openingCard(): Card {
    const parent = this.byId(this.parentId);
    return {
      id: 'opening',
      title: { key: 'life.open.title', vars: { age: this.ageYears } },
      lines: [
        { key: 'life.open.home', vars: { parent: parent ? villagerName(parent.id) : '—', n: this.sim.state.villagers.length } },
        { key: 'life.open.adult', vars: { age: this.p.adultAge } },
        { key: 'life.open.goal' },
      ],
      choices: [{ id: 'go', label: { key: 'life.open.go' } }],
    };
  }

  private endChapter(): void {
    const next = LIFE_PACING.chapterAges[this.chapter + 1];
    this.previousShares = new Map(this.observedAround().map((v) => [v.id, v.last.share]));
    this.previousAge = this.ageYears;
    this.decade = [];
    this.phase = 'between';
    this.cards.push({
      id: 'chapterEnd',
      title: { key: 'life.between.title' },
      lines: [next === undefined ? { key: 'life.between.last' } : { key: 'life.between.next', vars: { age: next } }, ...this.conductLines()],
      choices: [
        { id: 'conduct', label: { key: 'life.card.changeConduct' } },
        { id: 'go', label: { key: next === undefined ? 'life.between.goLast' : 'life.between.go' } },
      ],
    });
  }

  /** La ligne de conduite, dite en clair, pour rappeler ce qui s'appliquera pendant que le temps file. */
  conductLines(): Line[] {
    const c = this.conduct;
    if (!c) return [];
    const share: Line = c.share === 'neighbors' ? { key: 'life.conduct.shareNeighbors' } : { key: 'life.conduct.shareValue', vars: { sacks: Math.round(c.share * 10) } };
    const fish: Line =
      c.restraint === 'neighbors'
        ? { key: 'life.conduct.fishNeighbors' }
        : { key: 'life.conduct.fishValue', vars: { casts: Math.round((1 - c.restraint) * LIFE_PACING.maxCasts), max: LIFE_PACING.maxCasts } };
    return [share, fish, { key: c.children ? 'life.conduct.childrenYes' : 'life.conduct.childrenNo' }];
  }

  /** Les voisins dont on compare la conduite d'un chapitre à l'autre : ceux que le joueur observe, sinon ses deux plus proches. */
  private observedAround(): Villager[] {
    const k = Math.max(2, this.p.observedNeighbors);
    return this.sim.neighbors(this.playerId, k).filter((v) => v.id !== this.playerId && isAdult(v, this.p));
  }

  /** Entre deux chapitres : le temps file jusqu'au prochain, à une carte ou à la mort. */
  fastForward(): void {
    if (this.phase !== 'between' || this.cards.length > 0) return;
    const nextAge = LIFE_PACING.chapterAges[this.chapter + 1];
    const target = nextAge === undefined ? Infinity : nextAge * this.p.seasonsPerYear;
    while (this.phase === 'between' && this.cards.length === 0) {
      const v = this.player;
      if (!v) break;
      if (v.ageSeasons >= target) {
        this.startChapter(this.chapter + 1);
        break;
      }
      this.advance();
    }
  }

  private startChapter(k: number): void {
    this.chapter = k;
    this.phase = 'chapter';
    this.clock = 0;
    this.given = null;
    this.casts = null;
    const v = this.player!;
    const lines: Line[] = [];
    if (this.decade.length > 0) lines.push(...this.decade.slice(-8));
    else lines.push({ key: 'life.chapter.quiet' });
    lines.push({ key: 'life.chapter.state', vars: { wealth: Math.round(v.wealth), n: this.sim.state.villagers.length, pond: Math.round(this.pondLevel() * 100) } });
    // Ce qui a changé autour de toi : les voisins se comparent à ce qu'ils faisaient au chapitre précédent.
    for (const n of this.observedAround()) {
      const before = this.previousShares.get(n.id);
      const now = Math.round(n.last.share * 10);
      if (before === undefined) lines.push({ key: 'life.chapter.newNeighbor', vars: { name: villagerName(n.id), now } });
      else lines.push({ key: 'life.chapter.neighbor', vars: { name: villagerName(n.id), now, before: Math.round(before * 10), age: this.previousAge } });
    }
    const grown = this.sim.state.villagers.filter((c) => c.parentId === this.playerId && isAdult(c, this.p));
    for (const c of grown) lines.push({ key: 'life.chapter.grownChild', vars: { name: villagerName(c.id), now: Math.round(c.last.share * 10) } });
    this.decade = [];
    this.cards.push({ id: 'chapter', title: { key: 'life.open.title', vars: { age: this.ageYears } }, lines, choices: [{ id: 'go', label: { key: 'life.open.go' } }] });
    this.computeForecast();
  }

  private die(): void {
    this.phase = 'dead';
    const heirs = this.sim.state.villagers.filter((v) => v.parentId === this.playerId);
    const lines: Line[] = [{ key: this.starved ? 'life.death.starved' : 'life.death.old', vars: { age: this.deathAge } }];
    lines.push(
      heirs.length > 0
        ? { key: 'life.death.heirs', vars: { wealth: Math.round(this.deathWealth), n: heirs.length } }
        : { key: 'life.death.noHeirs', vars: { wealth: Math.round(this.deathWealth) } },
    );
    this.cards.push({ id: 'death', title: { key: 'life.death.title' }, lines, choices: [{ id: 'epilogue', label: { key: 'life.death.go' }, run: () => this.epilogue() }] });
  }

  /** Après la mort : ce que deviennent la lignée et le village, décennie par décennie. */
  private epilogue(): void {
    const sim = this.sim;
    const adultsNow = () => sim.state.villagers.filter((v) => isAdult(v, this.p));
    const startShare = Math.round(mean(adultsNow().map((v) => v.last.share)) * 10);
    const lines: Line[] = [];
    for (let d = 1; d <= LIFE_PACING.epilogueDecades && !sim.state.extinct; d++) {
      sim.runYears(10);
      const lineage = sim.state.villagers.filter((v) => v.isPlayer);
      const lineageAdults = lineage.filter((v) => isAdult(v, this.p));
      const share = Math.round(mean(adultsNow().map((v) => v.last.share)) * 10);
      const pond = Math.round(this.pondLevel() * 100);
      if (lineage.length === 0) lines.push({ key: 'life.epilogue.noLineage', vars: { years: d * 10, n: sim.state.villagers.length, share, start: startShare, pond } });
      else
        lines.push({
          key: 'life.epilogue.lineage',
          vars: {
            years: d * 10,
            n: sim.state.villagers.length,
            heirs: lineage.length,
            heirShare: lineageAdults.length > 0 ? Math.round(mean(lineageAdults.map((v) => v.last.share)) * 10) : '—',
            share,
            start: startShare,
            pond,
          },
        });
    }
    if (sim.state.extinct) lines.push({ key: 'life.epilogue.extinct' });
    lines.push({ key: 'life.epilogue.question' });
    this.pondBefore = this.pondNow = this.pondLevel();
    this.map = buildVillageMap(this.houseCount());
    this.phase = 'over';
    this.cards.push({
      id: 'epilogue',
      title: { key: 'life.epilogue.title' },
      lines,
      choices: [
        { id: 'replay', label: { key: 'life.epilogue.replay' } },
        { id: 'new', label: { key: 'life.epilogue.new' } },
      ],
    });
  }
}

/** La clé qui dit quelles sanctions sont autorisées, avec un préfixe : `${prefix}.none`, `.granary`, `.pond`, `.both`. */
function rulesKey(granary: boolean, pond: boolean, prefix: string): TextKey {
  const k = granary && pond ? 'both' : granary ? 'granary' : pond ? 'pond' : 'none';
  return `${prefix}.${k}` as TextKey;
}

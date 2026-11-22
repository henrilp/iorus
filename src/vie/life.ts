/**
 * Prototype « une vie » (fiche 0020, brouillon docs/MOMENTS.md) : la logique, sans DOM, pour pouvoir la tester.
 *
 * Le joueur vit cinq chapitres (15, 25, 35, 45 et 55 ans). Pendant un chapitre, le temps avance saison par saison ;
 * entre deux chapitres, il file, et seuls les moments graves l'arrêtent. Chaque moment ne présente que des décisions
 * que le moteur sait exécuter (`Simulation.act`) ; ses répliques sont tirées de l'état du moteur.
 *
 * Tout ce qui règle le rythme (âges des chapitres, délais entre deux moments) est dans `PACING`, affiché sur la page :
 * ces nombres ne touchent pas le moteur, mais ils décident quand le joueur peut changer d'avis.
 */
import { Simulation, isAdult, mean, type Composition, type PlayerConduct, type SimParams, type Villager } from '../sim';
import { villagerName } from './names';

export const PACING = {
  /** Âges de début des chapitres. Le premier dure jusqu'à la fin de la première année adulte. */
  chapterAges: [15, 25, 35, 45, 55],
  /** Durée d'un chapitre adulte, en années. */
  chapterYears: 1,
  /** Délai minimal, en saisons, avant qu'un même moment revienne. */
  cooldown: { hunger: 8, sanctioned: 8, childOffer: 8, cheater: 4, hungryNeighbor: 4 },
  /** Saisons de suite sous la moyenne avant qu'un voisin soit signalé. */
  cheaterStreak: 2,
  /** Nombre de voisins dont on parle quand le voisinage du moteur est désactivé. */
  shownNeighbors: 2,
  /** Décennies racontées après la mort. */
  epilogueDecades: 5,
};

export type Stance<T> = { label: string; value: T };

/** Les mots de la ligne de conduite et la valeur que reçoit le moteur (choix du prototype, affichés à côté des mots). */
export const SHARE_STANCES: Stance<number | 'neighbors'>[] = [
  { label: 'presque rien', value: 0.1 },
  { label: 'un peu', value: 0.3 },
  { label: 'comme mes voisins', value: 'neighbors' },
  { label: 'beaucoup', value: 0.7 },
];
export const RESTRAINT_STANCES: Stance<number | 'neighbors'>[] = [
  { label: 'tout ce que je peux', value: 0 },
  { label: 'avec un peu de retenue', value: 0.4 },
  { label: 'comme mes voisins', value: 'neighbors' },
  { label: 'très peu', value: 0.8 },
];

export interface LifeSettings {
  seed: number;
  size: number;
  composition: Composition;
  params: Partial<SimParams>;
}

export interface Choice {
  label: string;
  run: () => void;
}

/** Un moment : une scène, avec ses choix. Sans choix, c'est un récit qu'on referme avec « Continuer ». */
export interface Moment {
  id: string;
  title: string;
  speaker?: string;
  lines: string[];
  choices: Choice[];
}

export type LogKind = 'season' | 'story' | 'choice' | 'chapter' | 'death' | 'epilogue';
export interface LogEntry {
  kind: LogKind;
  text: string;
}

export type Phase = 'chapter' | 'between' | 'dead' | 'over';

const SEASON_NAMES = ['Printemps', 'Été', 'Automne', 'Hiver'];
const num = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const fmt = (x: number) => num.format(x);
/** Une part (0 à 1) dite en sacs sur 10. */
const sacks = (share: number) => `${Math.round(share * 10)} sac${Math.round(share * 10) > 1 ? 's' : ''} sur 10`;
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function stanceLabel(stances: Stance<number | 'neighbors'>[], value: number | 'neighbors'): string {
  return stances.find((s) => s.value === value)?.label ?? (typeof value === 'number' ? sacks(value) : String(value));
}

/** Les mots de la ligne de conduite, dits au joueur (« je peux » devient « tu peux »). */
function toYou(label: string): string {
  return label.replace('je peux', 'tu peux').replace('mes voisins', 'tes voisins');
}

interface Snapshot {
  ageYears: number;
  wealth: number;
  population: number;
  pond: number;
  meanShare: number;
  shares: Map<number, number>;
}

export class LifeSession {
  readonly sim: Simulation;
  readonly settings: LifeSettings;
  readonly playerId: number;
  readonly parentId: number | null;
  phase: Phase = 'chapter';
  chapter = 0;
  readonly log: LogEntry[] = [];
  /** Moments en attente : le premier est affiché, le temps ne repart que quand la file est vide. */
  readonly moments: Moment[] = [];

  private readonly lastShown = new Map<string, number>();
  private readonly shareStreak = new Map<number, number>();
  private readonly pondStreak = new Map<number, number>();
  /** Parts versées sur les quatre dernières saisons, par villageois, pour comparer d'un chapitre à l'autre. */
  private readonly recentShares = new Map<number, number[]>();
  private snapshot: Snapshot | null = null;
  private decade: string[] = [];
  private childAnswer: 'never' | null = null;
  private reachedBirthWealth = false;
  private askedFirstHarvest = false;
  private deathAge = 0;
  private deathWealth = 0;
  private starved = false;

  constructor(settings: LifeSettings) {
    this.settings = settings;
    const conduct: PlayerConduct = { share: 'neighbors', restraint: 'neighbors', children: false };
    this.sim = new Simulation({ ...settings, life: { conduct } });
    this.playerId = this.sim.state.controlledId!;
    this.parentId = this.player?.parentId ?? null;
    this.queueArrival();
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

  get ageYears(): number {
    const v = this.player;
    return v ? v.ageSeasons / this.p.seasonsPerYear : this.deathAge;
  }

  private byId(id: number | null): Villager | undefined {
    return id === null ? undefined : this.sim.state.villagers.find((v) => v.id === id);
  }

  private adults(): Villager[] {
    return this.sim.state.villagers.filter((v) => isAdult(v, this.p));
  }

  /** Les voisins dont on parle : ceux que le joueur observe, ou les plus proches si chacun voit tout le village. */
  neighbors(k = Math.max(this.p.observedNeighbors, PACING.shownNeighbors)): Villager[] {
    return this.sim.neighbors(this.playerId, k).filter((v) => v.id !== this.playerId);
  }

  private children(): Villager[] {
    return this.sim.state.villagers.filter((v) => v.parentId === this.playerId);
  }

  private relation(v: Villager): string {
    if (v.id === this.parentId) return `${villagerName(v.id)}, ton parent`;
    if (v.parentId === this.playerId) return `${villagerName(v.id)}, ton enfant`;
    return villagerName(v.id);
  }

  /** Fin du chapitre en cours, en saisons d'âge. */
  private chapterEnd(): number {
    const spy = this.p.seasonsPerYear;
    if (this.chapter === 0) return (this.p.adultAge + PACING.chapterYears) * spy;
    return ((PACING.chapterAges[this.chapter] ?? 0) + PACING.chapterYears) * spy;
  }

  // --- Décisions du joueur ---

  setConduct(change: Partial<PlayerConduct>, quiet = false): void {
    const current = this.conduct;
    if (!current) return;
    const next = { ...current, ...change };
    if (!this.sim.act({ kind: 'conduct', conduct: next })) return;
    if (quiet) return;
    const age = Math.floor(this.ageYears);
    if (change.share !== undefined) this.note('choice', `À ${age} ans, tu choisis de verser ${toYou(stanceLabel(SHARE_STANCES, next.share))} au grenier.`);
    if (change.restraint !== undefined) this.note('choice', `À ${age} ans, tu choisis de pêcher ${toYou(stanceLabel(RESTRAINT_STANCES, next.restraint))}.`);
    if (change.children !== undefined)
      this.note('choice', next.children ? `À ${age} ans, tu veux des enfants.` : `À ${age} ans, tu ne veux pas d’enfant.`);
  }

  private note(kind: LogKind, text: string): void {
    this.log.push({ kind, text });
  }

  /** Referme le moment affiché avec le choix donné (ou sans choix pour un récit). */
  resolve(choice?: Choice): void {
    const m = this.moments.shift();
    if (!m) return;
    choice?.run();
  }

  // --- Le temps ---

  /** Pendant un chapitre : une saison. */
  nextSeason(): void {
    if (this.phase !== 'chapter' || this.moments.length > 0) return;
    if (this.beforeFirstHarvest()) return;
    this.advance();
    if (this.phase !== 'chapter') return;
    // Devenu adulte : la première récolte et la première pêche passent avant tout autre moment.
    if (this.beforeFirstHarvest()) return;
    this.chapterMoments();
    const v = this.player;
    if (v && v.ageSeasons >= this.chapterEnd()) this.endChapter();
  }

  /** Entre deux chapitres : le temps file jusqu'au prochain chapitre, à un moment grave ou à la mort. */
  fastForward(): void {
    if (this.phase !== 'between' || this.moments.length > 0) return;
    const nextAge = PACING.chapterAges[this.chapter + 1];
    if (nextAge === undefined) return;
    const target = nextAge * this.p.seasonsPerYear;
    while (this.phase === 'between' && this.moments.length === 0) {
      const v = this.player;
      if (!v) break;
      if (v.ageSeasons >= target) {
        this.startChapter(this.chapter + 1);
        break;
      }
      this.advance();
      if (this.phase === 'between') this.cardMoments();
    }
  }

  /** Après la mort : ce que deviennent la lignée et le village, décennie par décennie. */
  epilogue(): void {
    if (this.phase !== 'dead' || this.moments.length > 0) return;
    const sim = this.sim;
    const startShare = this.snapshotNow().meanShare;
    for (let d = 1; d <= PACING.epilogueDecades && !sim.state.extinct; d++) {
      sim.runYears(10);
      const adults = this.adults();
      const lineage = sim.state.villagers.filter((v) => v.isPlayer);
      const lineageAdults = adults.filter((v) => v.isPlayer);
      const pond = sim.state.pondCapacity > 0 ? sim.state.pondStock / sim.state.pondCapacity : 0;
      const lineageText =
        lineage.length === 0
          ? 'plus aucun de tes descendants n’est en vie'
          : `${plural(lineage.length, 'descendant')} en vie` +
            (lineageAdults.length > 0 ? `, qui versent en moyenne ${sacks(mean(lineageAdults.map((v) => v.last.share)))}` : '');
      this.note(
        'epilogue',
        `${d * 10} ans après ta mort : ${sim.state.villagers.length} villageois, ${lineageText}. ` +
          `Au village, on verse en moyenne ${sacks(mean(adults.map((v) => v.last.share)))} (${sacks(startShare)} à ta mort). ` +
          `L’étang est à ${Math.round(pond * 100)} %.`,
      );
    }
    if (sim.state.extinct) this.note('epilogue', 'Le village s’est éteint.');
    this.note('epilogue', 'Qu’est-ce qui reste d’une vie : tes enfants, ton exemple, l’étang ?');
    this.phase = 'over';
  }

  /** Calcule une saison et en tire le récit. */
  private advance(): void {
    const sim = this.sim;
    const before = new Map(sim.state.villagers.map((v) => [v.id, { age: v.ageSeasons, life: v.lifespanYears, hunger: v.hungerSeasons }]));
    const playerBefore = this.player;
    const wealthBefore = playerBefore?.wealth ?? 0;
    sim.step();
    this.track(before);

    const v = this.player;
    if (!v) {
      this.deathAge = Math.floor((playerBefore?.ageSeasons ?? 0) / this.p.seasonsPerYear);
      const b = before.get(this.playerId);
      this.starved = !!b && (b.age + 1) / this.p.seasonsPerYear < b.life;
      this.deathWealth = wealthBefore;
      this.die();
      return;
    }
    if (v.wealth >= this.p.birthWealthThreshold) this.reachedBirthWealth = true;
    if (this.phase === 'chapter') this.note('season', this.seasonText(v));
    this.sanctionOutcomes();
  }

  /** Naissances et morts dans la famille, séries sous la moyenne, parts récentes. */
  private track(before: Map<number, { age: number; life: number; hunger: number }>): void {
    const s = this.sim.state;
    const now = new Set(s.villagers.map((v) => v.id));
    const spy = this.p.seasonsPerYear;
    for (const [id, b] of before) {
      if (now.has(id) || id === this.playerId) continue;
      const known = id === this.parentId || this.wasChild(id);
      if (!known) continue;
      const age = Math.floor((b.age + 1) / spy);
      const cause = (b.age + 1) / spy >= b.life ? '' : ', faute de nourriture';
      const who = id === this.parentId ? `${villagerName(id)}, ton parent,` : `${villagerName(id)}, ton enfant,`;
      this.event(`${who} meurt à ${age} ans${cause}.`);
      this.knownChildren.delete(id);
    }
    for (const v of s.villagers) {
      if (!before.has(v.id) && v.parentId === this.playerId) {
        this.knownChildren.add(v.id);
        this.event(`Naissance de ${villagerName(v.id)}, ton enfant, quand tu avais ${Math.floor(this.ageYears)} ans.`);
      }
    }

    const adults = this.adults();
    const avgShare = mean(adults.map((v) => v.last.share));
    const avgRestraint = mean(adults.map((v) => 1 - v.last.effort));
    for (const v of adults) {
      this.shareStreak.set(v.id, v.last.share < avgShare - this.p.sanctionGap ? (this.shareStreak.get(v.id) ?? 0) + 1 : 0);
      this.pondStreak.set(v.id, 1 - v.last.effort < avgRestraint - this.p.sanctionGap ? (this.pondStreak.get(v.id) ?? 0) + 1 : 0);
      const list = this.recentShares.get(v.id) ?? [];
      list.push(v.last.share);
      if (list.length > spy) list.shift();
      this.recentShares.set(v.id, list);
    }
    for (const id of this.recentShares.keys()) if (!now.has(id)) this.recentShares.delete(id);
  }

  private readonly knownChildren = new Set<number>();
  private wasChild(id: number): boolean {
    return this.knownChildren.has(id);
  }

  /** Un événement de la vie : dit sur le moment pendant un chapitre, gardé pour l'ouverture du suivant sinon. */
  private event(text: string): void {
    if (this.phase === 'chapter') this.note('story', text);
    else this.decade.push(text);
  }

  private seasonText(v: Villager): string {
    const s = this.sim.state;
    const season = SEASON_NAMES[(s.season - 1) % SEASON_NAMES.length];
    // L'âge pendant la saison écoulée (on vieillit à sa fin).
    const head = `${season}, ${Math.floor((v.ageSeasons - 1) / this.p.seasonsPerYear)} ans.`;
    const parts: string[] = [head];
    const l = v.last;
    if (!isAdult(v, this.p) || (l.harvest === 0 && l.share === 0)) {
      const parent = this.byId(this.parentId);
      if (parent && isAdult(parent, this.p)) {
        parts.push(
          `${villagerName(parent.id)}, ton parent, a récolté ${fmt(parent.last.harvest)} et versé ${sacks(parent.last.share)} au grenier.`,
        );
      }
      parts.push(`Ta réserve : ${fmt(v.wealth)}.`);
      return parts.join(' ');
    }
    const kids = this.children().filter((c) => !isAdult(c, this.p)).length;
    parts.push(
      `Tu as récolté ${fmt(l.harvest)} et versé ${fmt(l.contributed)} au grenier (${sacks(l.share)}). ` +
        `Le grenier t’a rendu ${fmt(l.received)}. Tu as pêché ${fmt(l.caught)}. ` +
        `Après les repas (${fmt(this.p.consumption)}${kids > 0 ? `, et ${fmt(kids * this.p.childConsumption)} pour ${plural(kids, 'enfant')}` : ''}), ta réserve est de ${fmt(v.wealth)}.`,
    );
    const ns = this.neighbors().filter((n) => isAdult(n, this.p));
    if (ns.length > 0) {
      parts.push(`Tes voisins ${ns.map((n) => `${villagerName(n.id)} (${sacks(n.last.share)})`).join(', ')}.`);
    }
    const fines = l.sanctionsReceived + l.pondSanctionsReceived;
    if (fines > 0) parts.push(`Tu as reçu ${plural(fines, 'amende')} : ${fmt(fines * this.p.sanctionFine)} de perdu.`);
    return parts.join(' ');
  }

  private sanctionOutcomes(): void {
    for (const o of this.sim.state.playerSanctions) {
      const name = villagerName(o.targetId);
      const what = o.domain === 'granary' ? 'versé' : 'retenu sa pêche';
      this.note(
        'story',
        o.applied
          ? `Tu as sanctionné ${name}, qui perd ${fmt(this.p.sanctionFine)} ; ça t’a coûté ${fmt(this.p.sanctionCost)}.`
          : `${name} a ${what} assez cette saison, ou avait déjà reçu toutes ses amendes : ta sanction n’a pas eu lieu.`,
      );
    }
  }

  // --- Chapitres ---

  private endChapter(): void {
    this.snapshot = this.snapshotNow();
    this.decade = [];
    if (this.chapter + 1 >= PACING.chapterAges.length) {
      // Après le dernier chapitre, le temps file jusqu'à la mort.
      this.phase = 'between';
      this.note('chapter', `Fin du dernier chapitre. Le temps passe jusqu’à la fin de ta vie.`);
      return;
    }
    this.phase = 'between';
    this.note('chapter', `Fin du chapitre. Les années passent jusqu’à tes ${PACING.chapterAges[this.chapter + 1]} ans.`);
  }

  /** Passe le temps après le dernier chapitre. */
  fastForwardToEnd(): void {
    if (this.phase !== 'between' || this.moments.length > 0 || this.chapter + 1 < PACING.chapterAges.length) return;
    while (this.phase === 'between' && this.moments.length === 0) {
      this.advance();
      if (this.phase === 'between') this.cardMoments();
    }
  }

  get isLastChapter(): boolean {
    return this.chapter + 1 >= PACING.chapterAges.length;
  }

  private snapshotNow(): Snapshot {
    const adults = this.adults();
    const s = this.sim.state;
    return {
      ageYears: Math.floor(this.ageYears),
      wealth: this.player?.wealth ?? 0,
      population: s.villagers.length,
      pond: s.pondCapacity > 0 ? s.pondStock / s.pondCapacity : 0,
      meanShare: mean(adults.map((v) => v.last.share)),
      shares: new Map([...this.recentShares].map(([id, list]) => [id, mean(list)])),
    };
  }

  private startChapter(index: number): void {
    this.chapter = index;
    this.phase = 'chapter';
    const age = PACING.chapterAges[index]!;
    this.note('chapter', `Chapitre ${index + 1} : ${age} ans.`);
    const then = this.snapshot;
    const now = this.snapshotNow();
    if (!then) return;

    const lines = [...this.decade];
    lines.push(`Ta réserve est passée de ${fmt(then.wealth)} à ${fmt(now.wealth)}.`);
    lines.push(`Le village compte ${now.population} habitants ; il en avait ${then.population}.`);
    lines.push(`L’étang est à ${Math.round(now.pond * 100)} % ; il était à ${Math.round(then.pond * 100)} %.`);
    this.decade = [];
    this.push({ id: 'decade', title: `${age} ans : dix ans ont passé`, lines, choices: [] });

    const around: string[] = [];
    for (const n of this.neighbors(Math.max(this.p.observedNeighbors, 4)).filter((v) => isAdult(v, this.p))) {
      const share = now.shares.get(n.id);
      if (share === undefined) continue;
      const before = then.shares.get(n.id);
      if (before !== undefined) {
        around.push(`${this.relation(n)} : « Je verse ${sacks(share)}. J’en versais ${Math.round(before * 10)} quand tu avais ${then.ageYears} ans. »`);
      } else {
        const parent = this.byId(n.parentId);
        const origin = parent ? `, enfant de ${villagerName(parent.id)},` : '';
        around.push(`${villagerName(n.id)}${origin} vit maintenant près de chez toi : « Je verse ${sacks(share)}. »`);
      }
    }
    around.push(`Au village, on verse en moyenne ${sacks(now.meanShare)} ; c’était ${sacks(then.meanShare)} quand tu avais ${then.ageYears} ans.`);
    this.push({ id: 'around', title: 'Ce qui a changé autour de toi', lines: around, choices: [] });

    if (index >= 3) {
      const grown = this.children().filter((c) => isAdult(c, this.p)).slice(0, 3);
      if (grown.length > 0) {
        const lines2 = grown.map((c) => {
          const ns = this.sim.neighbors(c.id, 2).filter((n) => isAdult(n, this.p));
          const range = ns.length > 0 ? ` Autour de moi, on en verse ${ns.map((n) => Math.round(n.last.share * 10)).join(' et ')}.` : '';
          return `${villagerName(c.id)} : « Je verse ${sacks(c.last.share)}.${range} »`;
        });
        this.push({ id: 'children', title: 'Tes enfants adultes', lines: lines2, choices: [] });
      }
    }
  }

  private die(): void {
    this.phase = 'dead';
    const kids = this.children();
    const lines = [`Ta vie s’arrête à ${this.deathAge} ans${this.starved ? ', faute de nourriture' : ''}.`];
    lines.push(
      kids.length > 0
        ? `Ta réserve, ${fmt(this.deathWealth)}, est partagée entre tes ${plural(kids.length, 'enfant')} en vie.`
        : `Ta réserve, ${fmt(this.deathWealth)}, est perdue : tu n’as pas d’enfant en vie.`,
    );
    lines.push(`Ta lignée compte ${plural(this.sim.state.villagers.filter((v) => v.isPlayer).length, 'descendant')} en vie.`);
    if (this.decade.length > 0) lines.unshift(...this.decade);
    this.decade = [];
    this.note('death', lines.join(' '));
    this.push({ id: 'death', title: 'La fin', lines, choices: [] });
  }

  // --- Moments ---

  private push(m: Moment): void {
    this.moments.push(m);
    this.lastShown.set(m.id, this.sim.state.season);
    // Les récits restent dans le journal de la vie ; pour un moment à choix, c'est le choix qui y reste.
    if (m.choices.length === 0 && m.id !== 'death') this.note('story', [m.speaker, ...m.lines].filter(Boolean).join(' '));
  }

  private ready(id: string, cooldown: number): boolean {
    const last = this.lastShown.get(id);
    return last === undefined || this.sim.state.season - last >= cooldown;
  }

  private queueArrival(): void {
    const parent = this.byId(this.parentId);
    const name = parent ? villagerName(parent.id) : 'personne';
    this.push({
      id: 'arrival',
      title: `${this.p.playerStartAge} ans`,
      lines: [
        `Tu as ${this.p.playerStartAge} ans. Tu vis chez ${name}, ton parent, dans un village de ${this.sim.state.villagers.length} habitants.`,
        `Chaque saison, les adultes récoltent, versent une part de leur récolte au grenier commun, pêchent à l’étang et mangent sur leur réserve. Ce qui est versé au grenier est multiplié par ${fmt(this.p.granaryMultiplier)}, puis partagé à parts égales entre tous les adultes, qu’ils aient versé ou non.`,
        `À ${this.p.adultAge} ans, tu récolteras toi-même. D’ici là, ${name} te nourrit.`,
      ],
      choices: [],
    });
  }

  /** La première récolte et la première pêche, juste avant la première saison adulte. */
  private beforeFirstHarvest(): boolean {
    const v = this.player;
    if (this.askedFirstHarvest || !v || v.ageSeasons < this.p.adultAge * this.p.seasonsPerYear) return false;
    this.askedFirstHarvest = true;
    const parent = this.byId(this.parentId);
    const around = this.neighbors(6).filter((n) => isAdult(n, this.p));
    const shares = around.map((n) => Math.round(n.last.share * 10));
    const range = shares.length > 0 ? `Les voisins, entre ${Math.min(...shares)} et ${Math.max(...shares)}.` : '';
    const speaker = parent && isAdult(parent, this.p) ? parent : around[0];
    this.push({
      id: 'first-harvest',
      title: `${this.p.adultAge} ans : ta première récolte`,
      speaker: speaker ? this.relation(speaker) : undefined,
      lines: [
        speaker ? `« Cette saison, j’ai versé ${sacks(speaker.last.share)} au grenier. ${range} »` : range,
        `Tout ce qui est versé est multiplié par ${fmt(this.p.granaryMultiplier)} puis partagé entre les ${this.adults().length} adultes. Tu manges ${fmt(this.p.consumption)} par saison ; une récolte en donne environ ${fmt(this.p.baseHarvest)}.`,
        'Combien vas-tu verser ?',
      ],
      choices: SHARE_STANCES.map((st) => ({ label: `Verser ${st.label}`, run: () => this.setConduct({ share: st.value }) })),
    });
    const fisher = around.find((n) => n.id !== speaker?.id) ?? speaker;
    const pond = this.sim.state.pondStock / this.sim.state.pondCapacity;
    this.push({
      id: 'first-fishing',
      title: 'Ta première pêche',
      speaker: fisher ? this.relation(fisher) : undefined,
      lines: [
        fisher ? `« J’ai pêché ${fmt(fisher.last.caught)} cette saison. L’étang est à ${Math.round(pond * 100)} %. »` : '',
        'Plus on est nombreux à pêcher beaucoup, plus l’étang se vide ; il se repeuple d’autant mieux qu’il reste du poisson.',
        'Comment vas-tu pêcher ?',
      ],
      choices: RESTRAINT_STANCES.map((st) => ({ label: `Pêcher ${st.label}`, run: () => this.setConduct({ restraint: st.value }) })),
    });
    return true;
  }

  /** Moments graves : ils arrêtent le temps, pendant un chapitre comme entre deux. */
  private cardMoments(): boolean {
    const v = this.player;
    if (!v || !isAdult(v, this.p)) return false;
    const p = this.p;
    const c = PACING.cooldown;
    const kids = this.children().filter((k) => !isAdult(k, p)).length;

    if (v.hungerSeasons > 0 && this.ready('hunger', c.hunger)) {
      this.push({
        id: 'hunger',
        title: 'Tu as faim',
        lines: [
          `Il te reste ${fmt(v.wealth)}. Tu manges ${fmt(p.consumption)} par saison${kids > 0 ? `, et tes enfants ${fmt(kids * p.childConsumption)}` : ''}.`,
          `Tu as eu faim ${plural(v.hungerSeasons, 'saison')} de suite. Après ${p.starvationSeasons} saisons de faim d’affilée, on meurt.`,
          `Tu verses ${this.conductText('share')} au grenier et tu pêches ${this.conductText('restraint')}.`,
        ],
        choices: [
          { label: 'Verser presque rien', run: () => this.setConduct({ share: 0.1 }) },
          { label: 'Pêcher tout ce que je peux', run: () => this.setConduct({ restraint: 0 }) },
          { label: 'Ne rien changer', run: () => undefined },
        ],
      });
      return true;
    }

    const fines = v.last.sanctionsReceived + v.last.pondSanctionsReceived;
    if (fines > 0 && this.ready('sanctioned', c.sanctioned)) {
      const punisher = this.byId(v.last.punishedBy[0] ?? null);
      const adults = this.adults();
      const granary = v.last.sanctionsReceived > 0;
      const avg = granary ? mean(adults.map((a) => a.last.share)) : mean(adults.map((a) => 1 - a.last.effort));
      const mine = granary ? v.last.share : 1 - v.last.effort;
      const what = granary
        ? `Tu as versé ${sacks(mine)} ; en moyenne, on en verse ${Math.round(avg * 10)}.`
        : `Tu as pêché bien plus que les autres : ta retenue est de ${sacks(mine)}, celle des autres de ${Math.round(avg * 10)} en moyenne.`;
      this.push({
        id: 'sanctioned',
        title: 'Une sanction',
        speaker: punisher ? this.relation(punisher) : undefined,
        lines: [
          `« ${what} Je t’ai fait perdre ${fmt(p.sanctionFine)}, ça m’a coûté ${fmt(p.sanctionCost)}. »`,
          `Cette saison, tu as reçu ${plural(fines, 'amende')} : ${fmt(fines * p.sanctionFine)} de perdu.`,
        ],
        choices: [
          {
            label: granary ? 'Verser comme mes voisins' : 'Pêcher comme mes voisins',
            run: () => this.setConduct(granary ? { share: 'neighbors' } : { restraint: 'neighbors' }),
          },
          { label: 'Ne rien changer', run: () => undefined },
        ],
      });
      return true;
    }

    const age = v.ageSeasons / p.seasonsPerYear;
    const fertile = age >= p.fertileAgeMin && age <= p.fertileAgeMax;
    if (fertile && !this.conduct?.children && this.childAnswer !== 'never' && v.wealth >= p.birthWealthThreshold && this.ready('child-offer', c.childOffer)) {
      this.push({
        id: 'child-offer',
        title: 'Tu pourrais avoir un enfant',
        lines: [
          `Ta réserve : ${fmt(v.wealth)}. Un enfant prend ${fmt(p.birthEndowment)} à sa naissance, puis ${fmt(p.childConsumption)} par saison jusqu’à ses ${p.adultAge} ans.`,
          `Si tu en veux, il en viendra peut-être un chaque année, tant que ta réserve dépasse ${fmt(p.birthWealthThreshold)} et que tu as moins de ${p.fertileAgeMax} ans.`,
        ],
        choices: [
          { label: 'Je veux des enfants', run: () => this.setConduct({ children: true }) },
          { label: 'Pas maintenant', run: () => this.note('choice', `À ${Math.floor(age)} ans, tu remets les enfants à plus tard.`) },
          {
            label: 'Jamais',
            run: () => {
              this.childAnswer = 'never';
              this.note('choice', `À ${Math.floor(age)} ans, tu décides de ne pas avoir d’enfant.`);
            },
          },
        ],
      });
      return true;
    }
    return false;
  }

  private conductText(which: 'share' | 'restraint'): string {
    const c = this.conduct;
    if (!c) return '';
    return toYou(which === 'share' ? stanceLabel(SHARE_STANCES, c.share) : stanceLabel(RESTRAINT_STANCES, c.restraint));
  }

  /** Après une saison de chapitre : un moment grave d'abord, sinon au plus un moment lié à ce que le joueur voit. */
  private chapterMoments(): void {
    if (this.cardMoments()) return;
    const v = this.player;
    if (!v || !isAdult(v, this.p)) return;
    const p = this.p;
    const c = PACING.cooldown;
    const adults = this.adults();
    const ns = this.neighbors().filter((n) => isAdult(n, p));
    const witness = (exclude: Villager) => {
      const parent = this.byId(this.parentId);
      if (parent && parent.id !== exclude.id && isAdult(parent, p)) return parent;
      return ns.find((n) => n.id !== exclude.id);
    };

    // Un voisin verse nettement moins que les autres, ou pêche nettement plus.
    if (this.ready('cheater', c.cheater)) {
      const avgShare = mean(adults.map((a) => a.last.share));
      const avgRestraint = mean(adults.map((a) => 1 - a.last.effort));
      const granaryCheat = ns.find((n) => (this.shareStreak.get(n.id) ?? 0) >= PACING.cheaterStreak);
      const pondCheat = ns.find((n) => (this.pondStreak.get(n.id) ?? 0) >= PACING.cheaterStreak);
      const cheat = granaryCheat ?? pondCheat;
      if (cheat) {
        const granary = cheat === granaryCheat;
        const w = witness(cheat);
        const name = villagerName(cheat.id);
        // « Moi aussi » n'est proposé que si le joueur n'en est pas déjà là.
        const choices: Choice[] = [];
        if (granary && this.conduct?.share !== 0.1) {
          choices.push({ label: 'Verser presque rien moi aussi', run: () => this.setConduct({ share: 0.1 }) });
        }
        if (!granary && this.conduct?.restraint !== 0) {
          choices.push({ label: 'Pêcher tout ce que je peux moi aussi', run: () => this.setConduct({ restraint: 0 }) });
        }
        choices.push({ label: 'Ne rien changer', run: () => undefined });
        const allowed = granary ? p.sanctionsEnabled : p.pondSanctionsEnabled;
        if (allowed) {
          choices.push({
            label: `Sanctionner ${name} (ça te coûte ${fmt(p.sanctionCost)}, ${name} perd ${fmt(p.sanctionFine)})`,
            run: () => {
              if (this.sim.act({ kind: 'sanction', targetId: cheat.id, domain: granary ? 'granary' : 'pond' })) {
                this.note('choice', `À ${Math.floor(this.ageYears)} ans, tu décides de sanctionner ${name} à la saison suivante.`);
              }
            },
          });
        }
        const line = granary
          ? `« ${name} a versé ${sacks(cheat.last.share)} ces dernières saisons ; en moyenne, on en verse ${Math.round(avgShare * 10)}. ${name} a reçu sa part du grenier comme nous. »`
          : `« ${name} pêche bien plus que les autres depuis plusieurs saisons : ${fmt(cheat.last.caught)} cette saison. Sa retenue est de ${sacks(1 - cheat.last.effort)}, celle des autres de ${Math.round(avgRestraint * 10)} en moyenne. »`;
        this.push({
          id: 'cheater',
          title: granary ? `${name} verse peu` : `${name} pêche beaucoup`,
          speaker: w ? this.relation(w) : undefined,
          lines: [line, allowed ? '' : 'Au village, les sanctions ne sont pas d’usage.'].filter(Boolean),
          choices,
        });
        return;
      }
    }

    // Un voisin a faim.
    const hungry = ns.find((n) => n.hungerSeasons > 0);
    if (hungry && this.ready('hungry-neighbor', c.hungryNeighbor)) {
      const gain = (5 * p.granaryMultiplier) / Math.max(1, adults.length);
      this.push({
        id: 'hungry-neighbor',
        title: `${villagerName(hungry.id)} a faim`,
        speaker: this.relation(hungry),
        lines: [
          `« Je n’ai plus rien depuis ${plural(hungry.hungerSeasons, 'saison')}. »`,
          `Si tu verses 5 de plus au grenier, ${villagerName(hungry.id)} en reçoit ${fmt(gain)}, comme chacun des ${adults.length} adultes.`,
        ],
        choices: [
          { label: 'Verser beaucoup', run: () => this.setConduct({ share: 0.7 }) },
          { label: 'Ne rien changer', run: () => undefined },
        ],
      });
      return;
    }

    // Pas assez pour un enfant, aux chapitres de 25 et 35 ans.
    const id = `poor-${this.chapter}`;
    const age = v.ageSeasons / p.seasonsPerYear;
    if ((this.chapter === 1 || this.chapter === 2) && !this.reachedBirthWealth && age >= p.fertileAgeMin && !this.lastShown.has(id)) {
      const peer = adults.find(
        (a) => a.id !== v.id && Math.abs(a.ageSeasons - v.ageSeasons) <= 5 * p.seasonsPerYear && this.sim.state.villagers.some((k) => k.parentId === a.id),
      );
      const kids = peer ? this.sim.state.villagers.filter((k) => k.parentId === peer.id).length : 0;
      this.push({
        id,
        title: 'Pas assez pour un enfant',
        speaker: peer ? this.relation(peer) : undefined,
        lines: [
          peer ? `« J’ai ${plural(kids, 'enfant')}. »` : '',
          `Ta réserve : ${fmt(v.wealth)}. Il faut ${fmt(p.birthWealthThreshold)} pour pouvoir avoir un enfant.`,
          `Tu verses ${this.conductText('share')} au grenier.`,
        ].filter(Boolean),
        choices: [
          { label: 'Verser presque rien pour amasser', run: () => this.setConduct({ share: 0.1 }) },
          { label: 'Ne rien changer', run: () => undefined },
        ],
      });
      return;
    }

    // L'étang baisse (une fois par chapitre).
    const pond = this.sim.state.pondStock / this.sim.state.pondCapacity;
    const pid = `pond-${this.chapter}`;
    if (pond < 0.5 && !this.lastShown.has(pid)) {
      const fisher = ns[0];
      this.push({
        id: pid,
        title: 'L’étang baisse',
        speaker: fisher ? this.relation(fisher) : undefined,
        lines: [
          fisher ? `« J’ai pêché ${fmt(fisher.last.caught)} cette saison. »` : '',
          `L’étang est à ${Math.round(pond * 100)} % de ce qu’il peut porter. Tu pêches ${this.conductText('restraint')}.`,
        ].filter(Boolean),
        choices: RESTRAINT_STANCES.map((st) => ({ label: `Pêcher ${st.label}`, run: () => this.setConduct({ restraint: st.value }) })),
      });
    }
  }
}

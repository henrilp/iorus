import { clamp01, granaryShare, pondRestraint, sanctionProbability } from './behavior';
import { bins10, gini, mean } from './metrics';
import { DEFAULT_PARAMS, type SimParams } from './params';
import { Rng } from './rng';
import type {
  Composition,
  JournalEntry,
  PlayerAction,
  PlayerConduct,
  SanctionDomain,
  SeasonMetrics,
  SimConfig,
  SimState,
  Traits,
  Villager,
} from './types';

const emptyLast = () => ({
  harvest: 0,
  share: 0,
  contributed: 0,
  received: 0,
  effort: 0,
  caught: 0,
  sanctionsGiven: 0,
  sanctionsReceived: 0,
  pondSanctionsReceived: 0,
  punishedBy: [] as number[],
});

export class Simulation {
  readonly state: SimState;
  private readonly rng: Rng;
  private sanctionsThisSeason = 0;
  private pondSanctionsThisSeason = 0;
  /** Intentions de modération de la saison, gardées pour la mise à jour des croyances. */
  private readonly restraints = new Map<number, number>();
  /** Sanction voulue par le joueur pour la saison suivante, au plus une par domaine. */
  private readonly pendingSanctions = new Map<SanctionDomain, number>();
  /** Ce que le joueur a réellement fait, pour estimer les traits qu'il transmet (fiche 0022). */
  private readonly record = { seasons: 0, share: 0, restraint: 0, neighbors: 0 };

  constructor(config: SimConfig) {
    const params: SimParams = { ...DEFAULT_PARAMS, ...config.params };
    this.rng = new Rng(config.seed);
    const pondCapacity = params.pondCapacityPerVillager * config.size;
    this.state = {
      params,
      season: 0,
      villagers: [],
      pondStock: pondCapacity,
      pondCapacity,
      nextId: 0,
      history: [],
      extinct: false,
      droughtLeft: 0,
      controlledId: null,
      conduct: null,
      journal: [],
      playerSanctions: [],
    };

    // En mode observateur, le villageois du joueur remplace le premier villageois ; quand il vit sa vie, il naît à part.
    const observer = config.player !== undefined && config.life === undefined;
    const traits = initialTraits(config.composition, config.size, this.rng);
    if (observer && config.player && traits.length > 0) traits[0] = { ...config.player };
    traits.forEach((tr, i) => {
      const isPlayer = observer && i === 0;
      // Le villageois du joueur est un nouvel arrivant, jeune adulte.
      const ageYears = isPlayer ? params.fertileAgeMin : this.rng.range(params.adultAge, params.initialMaxAge);
      const v = this.createVillager(tr, null, i);
      v.ageSeasons = Math.floor(ageYears * params.seasonsPerYear);
      v.wealth = params.startingWealth;
      v.isPlayer = isPlayer;
      this.state.villagers.push(v);
    });
    if (config.life) this.startLife(config.life.conduct);
  }

  /**
   * Le joueur commence sa vie enfant d'un villageois de départ assez âgé pour l'avoir eu en âge fertile.
   * Il hérite de ses traits comme tout enfant ; ils seront remplacés par ce qu'il fera réellement.
   */
  private startLife(conduct: PlayerConduct): void {
    const s = this.state;
    const p = s.params;
    const age = (v: Villager) => v.ageSeasons / p.seasonsPerYear;
    const candidates = s.villagers.filter(
      (v) => age(v) >= p.fertileAgeMin + p.playerStartAge && age(v) <= p.fertileAgeMax + p.playerStartAge,
    );
    const oldest = s.villagers.reduce<Villager | undefined>((a, v) => (!a || v.ageSeasons > a.ageSeasons ? v : a), undefined);
    const parent = candidates.length > 0 ? this.rng.pick(candidates) : oldest;
    if (!parent) return;
    const child = this.createVillager(this.inherit(parent), parent.id, parent.home);
    child.ageSeasons = Math.floor(p.playerStartAge * p.seasonsPerYear);
    child.wealth = p.birthEndowment;
    child.isPlayer = true;
    s.villagers.push(child);
    s.controlledId = child.id;
    s.conduct = { ...conduct };
  }

  /**
   * Une décision du joueur, valable à partir de la saison suivante. Elle est inscrite au journal :
   * graine, réglages et journal suffisent à rejouer la même vie (fiche 0022).
   * Renvoie faux si la décision n'est pas possible (pas de joueur, cible absente, sanctions non autorisées).
   */
  act(action: PlayerAction): boolean {
    const s = this.state;
    const p = s.params;
    if (s.controlledId === null) return false;
    if (action.kind === 'conduct') {
      s.conduct = { ...action.conduct };
    } else {
      const allowed = action.domain === 'granary' ? p.sanctionsEnabled : p.pondSanctionsEnabled;
      const target = s.villagers.find((v) => v.id === action.targetId);
      if (!allowed || !target || target.id === s.controlledId || !this.isAdult(target)) return false;
      this.pendingSanctions.set(action.domain, target.id);
    }
    s.journal.push({ season: s.season, action: structuredClone(action) });
    return true;
  }

  /** Le villageois conduit par le joueur, s'il vit encore. */
  get controlled(): Villager | undefined {
    const id = this.state.controlledId;
    return id === null ? undefined : this.state.villagers.find((v) => v.id === id);
  }

  /**
   * Les k villageois adultes les plus proches de `id` sur l'anneau des maisons, alternativement après et avant lui.
   * Sert à la mise à jour des croyances quand `observedNeighbors` > 0, et à l'affichage.
   */
  neighbors(id: number, k: number): Villager[] {
    const adults = this.state.villagers.filter((v) => this.isAdult(v) || v.id === id);
    const ring = [...adults].sort((a, b) => a.home - b.home || a.id - b.id);
    const j = ring.findIndex((v) => v.id === id);
    if (j < 0) return [];
    const out: Villager[] = [];
    const n = ring.length;
    for (let d = 1; out.length < Math.min(k, n - 1); d++) {
      const after = ring[(j + d) % n];
      if (after && after.id !== id && !out.includes(after)) out.push(after);
      if (out.length >= Math.min(k, n - 1)) break;
      const before = ring[(((j - d) % n) + n) % n];
      if (before && before.id !== id && !out.includes(before)) out.push(before);
    }
    return out;
  }

  /** Simule une saison. */
  step(): SeasonMetrics {
    const s = this.state;
    const p = s.params;
    s.season += 1;
    let deaths = 0;
    let births = 0;

    const adults = s.villagers.filter((v) => this.isAdult(v));
    for (const v of s.villagers) v.last = emptyLast();
    s.playerSanctions = [];
    this.startDrought();
    const drought = s.droughtLeft > 0;

    if (adults.length > 0) {
      this.produceAndShare(adults);
      this.fish(adults);
      this.sanctionsThisSeason = p.sanctionsEnabled
        ? this.sanction(adults, 'granary', (v) => v.last.share, (v) => (v.last.sanctionsReceived += 1))
        : 0;
      this.pondSanctionsThisSeason = p.pondSanctionsEnabled
        ? this.sanction(adults, 'pond', (v) => this.restraints.get(v.id) ?? 0, (v) => (v.last.pondSanctionsReceived += 1))
        : 0;
      this.incomes = new Map(adults.map((v) => [v.id, this.seasonIncome(v)]));
      for (const v of adults) {
        v.yearIncome += this.incomes.get(v.id) ?? 0;
        v.yearSeasons += 1;
      }
      this.eat();
      this.updateBeliefs(adults);
      this.recordPlayer();
      s.villagers.forEach((v) => {
        v.fearGranary = v.fearGranary * p.fearDecay + v.last.sanctionsReceived * p.sanctionFine;
        v.fearPond = v.fearPond * p.fearDecay + v.last.pondSanctionsReceived * p.sanctionFine;
      });
    } else {
      this.sanctionsThisSeason = 0;
      this.pondSanctionsThisSeason = 0;
      this.incomes = new Map();
    }
    this.pendingSanctions.clear();
    if (s.droughtLeft > 0) s.droughtLeft -= 1;

    this.regrowPond();

    for (const v of s.villagers) v.ageSeasons += 1;
    deaths += this.removeDead();

    if (s.season % p.seasonsPerYear === 0) {
      births += this.reproduce();
      this.imitate();
    }

    s.extinct = s.villagers.length === 0;
    const metrics = this.measure(births, deaths, drought);
    s.history.push(metrics);
    return metrics;
  }

  /** Simule n saisons sans rendu. */
  run(seasons: number): SeasonMetrics[] {
    const out: SeasonMetrics[] = [];
    for (let i = 0; i < seasons && !this.state.extinct; i++) out.push(this.step());
    return out;
  }

  runYears(years: number): SeasonMetrics[] {
    return this.run(years * this.state.params.seasonsPerYear);
  }

  // --- Étapes d'une saison ---

  /**
   * Au début de chaque année, hors sécheresse, une sécheresse peut commencer (fiche 0024).
   * Rien n'est tiré quand la probabilité est nulle : le reste de la partie ne change pas.
   */
  private startDrought(): void {
    const s = this.state;
    const p = s.params;
    const newYear = (s.season - 1) % p.seasonsPerYear === 0;
    if (p.droughtProbability > 0 && newYear && s.droughtLeft === 0 && this.rng.chance(p.droughtProbability)) {
      s.droughtLeft = p.droughtSeasons;
    }
  }

  private produceAndShare(adults: Villager[]): void {
    const p = this.state.params;
    const landFactor = Math.min(1, p.farmlandCapacity / adults.length);
    const weather = this.state.droughtLeft > 0 ? 1 - p.droughtSeverity : 1;
    let pot = 0;
    for (const v of adults) {
      const harvest = Math.max(0, p.baseHarvest * landFactor * weather * (1 + this.rng.normal(0, p.harvestNoise)));
      const conduct = this.conductOf(v);
      const share = conduct ? chosen(conduct.share, v.beliefShare) : granaryShare(v, p, this.rng);
      v.last.harvest = harvest;
      v.last.share = share;
      v.last.contributed = share * harvest;
      pot += v.last.contributed;
    }
    const payout = (pot * p.granaryMultiplier) / adults.length;
    for (const v of adults) {
      v.last.received = payout;
      v.wealth += v.last.harvest - v.last.contributed + payout;
    }
  }

  /**
   * Pêche selon le modèle de Schaefer : la prise est proportionnelle à l'effort et au stock.
   * Moins il reste de poissons, plus il faut d'effort pour en attraper un.
   */
  private fish(adults: Villager[]): void {
    const s = this.state;
    const p = s.params;
    this.restraints.clear();
    const density = s.pondCapacity > 0 ? s.pondStock / s.pondCapacity : 0;
    const catches = adults.map((v) => {
      const conduct = this.conductOf(v);
      const restraint = conduct ? chosen(conduct.restraint, v.beliefRestraint) : pondRestraint(v, p, this.rng);
      this.restraints.set(v.id, restraint);
      v.last.effort = 1 - restraint;
      return p.maxCatch * v.last.effort * density;
    });
    // Garde-fou : on ne peut pas pêcher plus de poissons qu'il n'y en a.
    const total = catches.reduce((a, b) => a + b, 0);
    const scale = total > s.pondStock && total > 0 ? s.pondStock / total : 1;
    adults.forEach((v, i) => {
      const caught = (catches[i] ?? 0) * scale;
      v.last.caught = caught;
      v.wealth += caught;
      s.pondStock -= caught;
    });
    s.pondStock = Math.max(0, s.pondStock);
  }

  private incomes = new Map<number, number>();

  /** Ce que l'adulte a gagné cette saison, sanctions comprises, avant les repas. */
  private seasonIncome(v: Villager): number {
    const p = this.state.params;
    const l = v.last;
    return (
      l.harvest - l.contributed + l.received + l.caught -
      l.sanctionsGiven * p.sanctionCost -
      (l.sanctionsReceived + l.pondSanctionsReceived) * p.sanctionFine
    );
  }

  /**
   * Sanctions informelles dans un domaine (grenier ou pêche) : sont ciblés ceux dont la coopération
   * (part versée, ou modération à l'étang) est nettement inférieure à la moyenne.
   * Les sanctions sont graduées : un fautif reçoit au plus une amende par tranche de `sanctionGap`
   * sous la moyenne. Sinon tous ceux qui veulent sanctionner tombent sur le même, et l'amende grossit
   * avec la taille du village au lieu de grandir avec la faute (fiche 0021).
   */
  private sanction(
    adults: Villager[],
    domain: SanctionDomain,
    cooperation: (v: Villager) => number,
    mark: (target: Villager) => void,
  ): number {
    const p = this.state.params;
    const avg = mean(adults.map(cooperation));
    const targets = adults.filter((v) => cooperation(v) < avg - p.sanctionGap);
    const remaining = new Map(targets.map((t) => [t.id, Math.floor((avg - cooperation(t)) / p.sanctionGap)]));
    let count = 0;
    const punish = (punisher: Villager, target: Villager) => {
      remaining.set(target.id, (remaining.get(target.id) ?? 0) - 1);
      punisher.wealth -= p.sanctionCost;
      target.wealth -= p.sanctionFine;
      punisher.last.sanctionsGiven += 1;
      target.last.punishedBy.push(punisher.id);
      mark(target);
      count += 1;
    };

    // La sanction voulue par le joueur passe en premier, aux mêmes conditions que celles des villageois.
    const wanted = this.pendingSanctions.get(domain);
    const player = this.controlled;
    if (wanted !== undefined && player && this.isAdult(player)) {
      const target = targets.find((t) => t.id === wanted);
      const applied = !!target && (remaining.get(target.id) ?? 0) > 0 && player.wealth >= p.sanctionCost;
      if (target && applied) punish(player, target);
      this.state.playerSanctions.push({ targetId: wanted, domain, applied });
    }

    if (targets.length === 0) return count;
    // Ceux qui sont prêts à sanctionner cette saison (au plus une sanction chacun). Le joueur ne sanctionne jamais de lui-même.
    const willing = adults.filter(
      (punisher) =>
        punisher.id !== this.state.controlledId &&
        punisher.wealth >= p.sanctionCost &&
        targets.some((t) => t.id !== punisher.id) &&
        this.rng.chance(sanctionProbability(punisher, p)),
    );
    // Tour par tour, pour que les fautifs se partagent les sanctionneurs quand ils sont peu nombreux.
    let progress = true;
    while (progress && willing.length > 0) {
      progress = false;
      for (const target of targets) {
        if ((remaining.get(target.id) ?? 0) <= 0) continue;
        const candidates = willing.filter((w) => w.id !== target.id);
        if (candidates.length === 0) continue;
        const punisher = this.rng.pick(candidates);
        willing.splice(willing.indexOf(punisher), 1);
        punish(punisher, target);
        progress = true;
      }
    }
    return count;
  }

  /** Les adultes mangent sur leur réserve ; les enfants sur celle de leur parent, ou la leur s'ils sont orphelins. */
  private eat(): void {
    const s = this.state;
    const p = s.params;
    const byId = new Map(s.villagers.map((v) => [v.id, v]));
    for (const v of s.villagers) {
      if (this.isAdult(v)) {
        v.wealth -= p.consumption;
        continue;
      }
      const parent = v.parentId === null ? undefined : byId.get(v.parentId);
      const payer = parent && this.isAdult(parent) && parent.wealth >= p.childConsumption ? parent : v;
      payer.wealth -= p.childConsumption;
    }
    for (const v of s.villagers) {
      if (v.wealth < 0) {
        v.wealth = 0;
        v.hungerSeasons += 1;
      } else {
        v.hungerSeasons = 0;
      }
    }
  }

  private updateBeliefs(adults: Villager[]): void {
    const p = this.state.params;
    const n = adults.length;
    if (n < 2) return;
    const restraint = (v: Villager) => this.restraints.get(v.id) ?? 0;
    const lr = p.beliefLearningRate;
    // Chacun observe ses voisins, ou tout le village si le voisinage est désactivé ou plus grand que le village (fiche 0023).
    const local = p.observedNeighbors > 0 && p.observedNeighbors < n - 1;
    const totalShare = adults.reduce((a, v) => a + v.last.share, 0);
    const totalRestraint = adults.reduce((a, v) => a + restraint(v), 0);
    const observed = local ? new Map(adults.map((v) => [v.id, this.neighbors(v.id, p.observedNeighbors)])) : undefined;
    for (const v of adults) {
      const seen = observed?.get(v.id);
      const othersShare = seen ? mean(seen.map((o) => o.last.share)) : (totalShare - v.last.share) / (n - 1);
      const othersRestraint = seen ? mean(seen.map(restraint)) : (totalRestraint - restraint(v)) / (n - 1);
      v.beliefShare = (1 - lr) * v.beliefShare + lr * othersShare;
      v.beliefRestraint = (1 - lr) * v.beliefRestraint + lr * othersRestraint;
    }
  }

  /**
   * Les traits du villageois du joueur ne décident de rien pour lui : ils sont tenus à jour à partir de ce qu'il fait.
   * Disposition : moyenne de sa part versée et de sa modération sur toutes ses saisons adultes.
   * Influençabilité : part de ses choix « comme mes voisins ». Ce sont eux que ses enfants héritent et que les autres imitent.
   */
  private recordPlayer(): void {
    const v = this.controlled;
    const conduct = this.state.conduct;
    if (!v || !conduct || !this.isAdult(v)) return;
    const r = this.record;
    r.seasons += 1;
    r.share += v.last.share;
    r.restraint += this.restraints.get(v.id) ?? 0;
    r.neighbors += (conduct.share === 'neighbors' ? 1 : 0) + (conduct.restraint === 'neighbors' ? 1 : 0);
    v.disposition = clamp01((r.share + r.restraint) / (2 * r.seasons));
    v.influence = clamp01(r.neighbors / (2 * r.seasons));
  }

  /** La ligne de conduite du joueur, si ce villageois est le sien. */
  private conductOf(v: Villager): PlayerConduct | null {
    return v.id === this.state.controlledId ? this.state.conduct : null;
  }

  private regrowPond(): void {
    const s = this.state;
    const growth = s.params.pondGrowth * s.pondStock * (1 - s.pondStock / s.pondCapacity);
    s.pondStock = Math.min(s.pondCapacity, s.pondStock + growth);
  }

  // --- Générations ---

  private removeDead(): number {
    const s = this.state;
    const p = s.params;
    const dead = s.villagers.filter(
      (v) => v.hungerSeasons >= p.starvationSeasons || v.ageSeasons / p.seasonsPerYear >= v.lifespanYears,
    );
    if (dead.length === 0) return 0;
    const deadIds = new Set(dead.map((v) => v.id));
    s.villagers = s.villagers.filter((v) => !deadIds.has(v.id));
    if (s.controlledId !== null && deadIds.has(s.controlledId)) s.controlledId = null;
    // Héritage : la réserve va aux enfants vivants, sinon elle est perdue.
    for (const d of dead) {
      const heirs = s.villagers.filter((v) => v.parentId === d.id);
      for (const h of heirs) h.wealth += d.wealth / heirs.length;
    }
    return dead.length;
  }

  private reproduce(): number {
    const s = this.state;
    const p = s.params;
    const parents = s.villagers.filter((v) => {
      const age = v.ageSeasons / p.seasonsPerYear;
      // Le joueur peut refuser d'avoir des enfants ; il ne peut pas en forcer un.
      if (v.id === s.controlledId && !s.conduct?.children) return false;
      return age >= p.fertileAgeMin && age <= p.fertileAgeMax && v.wealth >= p.birthWealthThreshold;
    });
    let births = 0;
    for (const parent of parents) {
      if (!this.rng.chance(p.birthProbability)) continue;
      const child = this.createVillager(this.inherit(parent), parent.id, parent.home);
      child.isPlayer = parent.isPlayer;
      child.wealth = p.birthEndowment;
      parent.wealth -= p.birthEndowment;
      s.villagers.push(child);
      births += 1;
    }
    return births;
  }

  /**
   * Apprentissage social : on rapproche sa disposition de celle de ceux qui réussissent mieux que soi.
   * La réussite est le revenu moyen par saison de l'année écoulée, pas la réserve accumulée,
   * qui reflète surtout l'âge et l'héritage (fiche 0014).
   * L'influençabilité, elle, ne change pas au cours de la vie.
   */
  private imitate(): void {
    const p = this.state.params;
    const adults = this.state.villagers.filter((v) => this.isAdult(v));
    if (adults.length >= 2) {
      const income = (v: Villager) => (v.yearSeasons > 0 ? v.yearIncome / v.yearSeasons : undefined);
      const before = new Map(adults.map((v) => [v.id, { d: v.disposition, income: income(v) }]));
      for (const v of adults) {
        // Le joueur décide lui-même de sa conduite : il n'imite personne, mais on peut l'imiter.
        if (v.id === this.state.controlledId) continue;
        if (!this.rng.chance(p.imitationProbability)) continue;
        const model = this.rng.pick(adults);
        const m = before.get(model.id);
        const own = before.get(v.id)?.income;
        // Un adulte depuis moins d'une saison n'a pas encore de revenu à comparer.
        if (!m || model.id === v.id || m.income === undefined || own === undefined || m.income <= own) continue;
        v.disposition = clamp01(v.disposition + p.imitationRate * (m.d - v.disposition));
      }
    }
    for (const v of this.state.villagers) {
      v.yearIncome = 0;
      v.yearSeasons = 0;
    }
  }

  // --- Outils ---

  private isAdult(v: Villager): boolean {
    return isAdult(v, this.state.params);
  }

  /** Traits d'un enfant : ceux de son parent, chacun avec une petite variation. */
  private inherit(parent: Villager): Traits {
    const p = this.state.params;
    return {
      disposition: clamp01(parent.disposition + this.rng.normal(0, p.inheritanceNoise)),
      influence: clamp01(parent.influence + this.rng.normal(0, p.inheritanceNoise)),
    };
  }

  private createVillager({ disposition, influence }: Traits, parentId: number | null, home: number): Villager {
    const p = this.state.params;
    return {
      id: this.state.nextId++,
      disposition,
      influence,
      // On suppose au départ que les autres nous ressemblent.
      beliefShare: disposition,
      beliefRestraint: disposition,
      fearGranary: 0,
      fearPond: 0,
      wealth: 0,
      ageSeasons: 0,
      // Personne ne meurt de vieillesse avant l'âge adulte.
      lifespanYears: Math.max(p.adultAge, this.rng.normal(p.lifeExpectancy, p.lifeExpectancySd)),
      hungerSeasons: 0,
      yearIncome: 0,
      yearSeasons: 0,
      parentId,
      home,
      isPlayer: false,
      last: emptyLast(),
    };
  }

  private measure(births: number, deaths: number, drought: boolean): SeasonMetrics {
    const s = this.state;
    const p = s.params;
    const adults = s.villagers.filter((v) => this.isAdult(v));
    const pond = s.pondCapacity > 0 ? s.pondStock / s.pondCapacity : 0;
    return {
      season: s.season,
      year: Math.floor((s.season - 1) / p.seasonsPerYear),
      population: s.villagers.length,
      adults: adults.length,
      meanWealth: mean(adults.map((v) => v.wealth)),
      wealthGini: gini(adults.map((v) => v.wealth)),
      incomeGini: gini([...this.incomes.values()]),
      pond,
      pondDepleted: pond < p.pondDepletedThreshold,
      meanShare: mean(adults.map((v) => v.last.share)),
      meanDisposition: mean(s.villagers.map((v) => v.disposition)),
      meanInfluence: mean(s.villagers.map((v) => v.influence)),
      dispositionBins: bins10(s.villagers.map((v) => v.disposition)),
      drought,
      sanctions: this.sanctionsThisSeason + this.pondSanctionsThisSeason,
      pondSanctions: this.pondSanctionsThisSeason,
      births,
      deaths,
    };
  }
}

/** La valeur choisie par le joueur, ou sa croyance s'il a choisi de faire comme ses voisins. */
function chosen(value: number | 'neighbors', belief: number): number {
  return clamp01(value === 'neighbors' ? belief : value);
}

/**
 * Rejoue une vie : mêmes graine et réglages, puis chaque choix du journal avant la saison qui suit celle où il a été fait.
 * Donne exactement la même partie que l'originale (fiche 0002).
 */
export function replay(config: SimConfig, journal: JournalEntry[], seasons: number): Simulation {
  const sim = new Simulation(config);
  let next = 0;
  for (let i = 0; i < seasons && !sim.state.extinct; i++) {
    while (next < journal.length && journal[next]!.season === sim.state.season) sim.act(journal[next++]!.action);
    sim.step();
  }
  return sim;
}

/** Un villageois est adulte (il travaille, verse au grenier et pêche) à partir de `adultAge`. */
export function isAdult(v: Villager, p: SimParams): boolean {
  return v.ageSeasons >= p.adultAge * p.seasonsPerYear;
}

const clampTraits = (t: Traits): Traits => ({ disposition: clamp01(t.disposition), influence: clamp01(t.influence) });

function initialTraits(c: Composition, size: number, rng: Rng): Traits[] {
  switch (c.mode) {
    case 'uniform':
      return Array.from({ length: size }, () => clampTraits(c));
    case 'twoGroups': {
      const nA = Math.round(size * clamp01(c.shareA));
      return Array.from({ length: size }, (_, i) => clampTraits(i < nA ? c.groupA : c.groupB));
    }
    case 'mix':
      return Array.from({ length: size }, () =>
        clampTraits({
          disposition: rng.normal(c.mean.disposition, c.spread.disposition),
          influence: rng.normal(c.mean.influence, c.spread.influence),
        }),
      );
  }
}

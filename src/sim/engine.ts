import { clamp01, granaryShare, pondRestraint, sanctionProbability } from './behavior';
import { gini, mean } from './metrics';
import { DEFAULT_PARAMS, type SimParams } from './params';
import { Rng } from './rng';
import type { Composition, SeasonMetrics, SimConfig, SimState, Traits, Villager } from './types';

const emptyLast = () => ({
  harvest: 0,
  share: 0,
  contributed: 0,
  received: 0,
  caught: 0,
  sanctionsGiven: 0,
  sanctionsReceived: 0,
});

export class Simulation {
  readonly state: SimState;
  private readonly rng: Rng;
  private sanctionsThisSeason = 0;
  /** Intentions de modération de la saison, gardées pour la mise à jour des croyances. */
  private readonly restraints = new Map<number, number>();

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
    };

    const traits = initialTraits(config.composition, config.size, this.rng);
    if (config.player && traits.length > 0) traits[0] = { ...config.player };
    traits.forEach((tr, i) => {
      const isPlayer = i === 0 && config.player !== undefined;
      // Le villageois du joueur est un nouvel arrivant, jeune adulte.
      const ageYears = isPlayer ? params.fertileAgeMin : this.rng.range(params.adultAge, params.initialMaxAge);
      const v = this.createVillager(tr, null);
      v.ageSeasons = Math.floor(ageYears * params.seasonsPerYear);
      v.wealth = params.startingWealth;
      v.isPlayer = isPlayer;
      this.state.villagers.push(v);
    });
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

    if (adults.length > 0) {
      this.produceAndShare(adults);
      this.fish(adults);
      const sanctions = p.sanctionsEnabled ? this.sanction(adults) : 0;
      this.eat();
      this.updateBeliefs(adults);
      s.villagers.forEach((v) => {
        v.fear = v.fear * p.fearDecay + v.last.sanctionsReceived * p.sanctionFine;
      });
      this.sanctionsThisSeason = sanctions;
    } else {
      this.sanctionsThisSeason = 0;
    }

    this.regrowPond();

    for (const v of s.villagers) v.ageSeasons += 1;
    deaths += this.removeDead();

    if (s.season % p.seasonsPerYear === 0) {
      births += this.reproduce();
      this.imitate();
    }

    s.extinct = s.villagers.length === 0;
    const metrics = this.measure(births, deaths);
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

  private produceAndShare(adults: Villager[]): void {
    const p = this.state.params;
    const landFactor = Math.min(1, p.farmlandCapacity / adults.length);
    let pot = 0;
    for (const v of adults) {
      const harvest = Math.max(0, p.baseHarvest * landFactor * (1 + this.rng.normal(0, p.harvestNoise)));
      const share = granaryShare(v, p, this.rng);
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

  private fish(adults: Villager[]): void {
    const s = this.state;
    const p = s.params;
    this.restraints.clear();
    const desires = adults.map((v) => {
      const restraint = pondRestraint(v, p, this.rng);
      this.restraints.set(v.id, restraint);
      return p.maxCatch * (1 - restraint);
    });
    const totalDesire = desires.reduce((a, b) => a + b, 0);
    const catchable = s.pondStock * p.maxCatchableShare;
    const scale = totalDesire > catchable && totalDesire > 0 ? catchable / totalDesire : 1;
    adults.forEach((v, i) => {
      const caught = (desires[i] ?? 0) * scale;
      v.last.caught = caught;
      v.wealth += caught;
      s.pondStock -= caught;
    });
    s.pondStock = Math.max(0, s.pondStock);
  }

  private sanction(adults: Villager[]): number {
    const p = this.state.params;
    const avgShare = mean(adults.map((v) => v.last.share));
    const targets = adults.filter((v) => v.last.share < avgShare - p.sanctionGap);
    if (targets.length === 0) return 0;
    let count = 0;
    for (const punisher of adults) {
      if (punisher.wealth < p.sanctionCost) continue;
      const candidates = targets.filter((t) => t.id !== punisher.id);
      if (candidates.length === 0) continue;
      if (!this.rng.chance(sanctionProbability(punisher, p))) continue;
      const target = this.rng.pick(candidates);
      punisher.wealth -= p.sanctionCost;
      target.wealth -= p.sanctionFine;
      punisher.last.sanctionsGiven += 1;
      target.last.sanctionsReceived += 1;
      count += 1;
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
    const totalShare = adults.reduce((a, v) => a + v.last.share, 0);
    const totalRestraint = adults.reduce((a, v) => a + (this.restraints.get(v.id) ?? 0), 0);
    const lr = p.beliefLearningRate;
    for (const v of adults) {
      const othersShare = (totalShare - v.last.share) / (n - 1);
      const othersRestraint = (totalRestraint - (this.restraints.get(v.id) ?? 0)) / (n - 1);
      v.beliefShare = (1 - lr) * v.beliefShare + lr * othersShare;
      v.beliefRestraint = (1 - lr) * v.beliefRestraint + lr * othersRestraint;
    }
  }

  private regrowPond(): void {
    const s = this.state;
    const growth = s.params.pondGrowth * s.pondStock * (1 - s.pondStock / s.pondCapacity);
    const restock = s.params.pondRestock * s.pondCapacity;
    s.pondStock = Math.min(s.pondCapacity, s.pondStock + growth + restock);
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
      return age >= p.fertileAgeMin && age <= p.fertileAgeMax && v.wealth >= p.birthWealthThreshold;
    });
    let births = 0;
    for (const parent of parents) {
      if (!this.rng.chance(p.birthProbability)) continue;
      const child = this.createVillager(
        {
          disposition: clamp01(parent.disposition + this.rng.normal(0, p.inheritanceNoise)),
          influence: clamp01(parent.influence + this.rng.normal(0, p.inheritanceNoise)),
        },
        parent.id,
      );
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
   * L'influençabilité, elle, ne change pas au cours de la vie.
   */
  private imitate(): void {
    const p = this.state.params;
    const adults = this.state.villagers.filter((v) => this.isAdult(v));
    if (adults.length < 2) return;
    const before = new Map(adults.map((v) => [v.id, { d: v.disposition, w: v.wealth }]));
    for (const v of adults) {
      if (!this.rng.chance(p.imitationProbability)) continue;
      const model = this.rng.pick(adults);
      const m = before.get(model.id);
      if (!m || model.id === v.id || m.w <= v.wealth) continue;
      v.disposition = clamp01(v.disposition + p.imitationRate * (m.d - v.disposition));
    }
  }

  // --- Outils ---

  private isAdult(v: Villager): boolean {
    const p = this.state.params;
    return v.ageSeasons >= p.adultAge * p.seasonsPerYear;
  }

  private createVillager({ disposition, influence }: Traits, parentId: number | null): Villager {
    const p = this.state.params;
    return {
      id: this.state.nextId++,
      disposition,
      influence,
      // On suppose au départ que les autres nous ressemblent.
      beliefShare: disposition,
      beliefRestraint: disposition,
      fear: 0,
      wealth: 0,
      ageSeasons: 0,
      // Personne ne meurt de vieillesse avant l'âge adulte.
      lifespanYears: Math.max(p.adultAge, this.rng.normal(p.lifeExpectancy, p.lifeExpectancySd)),
      hungerSeasons: 0,
      parentId,
      isPlayer: false,
      last: emptyLast(),
    };
  }

  private measure(births: number, deaths: number): SeasonMetrics {
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
      gini: gini(adults.map((v) => v.wealth)),
      pond,
      pondDepleted: pond < p.pondDepletedThreshold,
      meanShare: mean(adults.map((v) => v.last.share)),
      meanDisposition: mean(s.villagers.map((v) => v.disposition)),
      meanInfluence: mean(s.villagers.map((v) => v.influence)),
      sanctions: this.sanctionsThisSeason,
      births,
      deaths,
    };
  }
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

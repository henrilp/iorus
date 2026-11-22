/**
 * Outils communs aux vérifications du moteur (tests Vitest et outil de robustesse).
 */
import { Simulation } from '../sim/engine';
import { mean } from '../sim/metrics';
import type { SimParams } from '../sim/params';
import type { SeasonMetrics, SimConfig } from '../sim/types';

export const SEEDS = [1, 2, 3, 4, 5];
export const SEASONS_PER_YEAR = 4;

export type Metric = keyof Pick<SeasonMetrics, 'meanShare' | 'pond' | 'meanDisposition' | 'population' | 'adults'>;

/** Une condition mesurée : la vérification tient si `value` est du bon côté de `threshold`. */
export interface Condition {
  label: string;
  value: number;
  op: '<' | '>';
  threshold: number;
}

export function holds(c: Condition): boolean {
  return c.op === '<' ? c.value < c.threshold : c.value > c.threshold;
}

/** Marge signée : positive si la condition tient, d'autant plus grande qu'elle tient largement. */
export function margin(c: Condition): number {
  return c.op === '<' ? c.threshold - c.value : c.value - c.threshold;
}

/**
 * Contexte d'une vérification : les paramètres imposés à toutes ses parties (pour la robustesse)
 * et les graines. Les parties sont mises en cache : le moteur étant déterministe,
 * une même configuration donne toujours le même historique, et une partie plus longue
 * contient les plus courtes.
 */
export class CheckContext {
  private cache = new Map<string, SeasonMetrics[][]>();

  constructor(
    readonly params: Partial<SimParams> = {},
    readonly seeds: number[] = SEEDS,
  ) {}

  /** Lance la même configuration sur plusieurs graines pour ne pas tester un coup de chance. */
  runs(config: Omit<SimConfig, 'seed'>, years: number): SeasonMetrics[][] {
    // Les paramètres propres à la vérification (par exemple activer les sanctions) l'emportent.
    const merged = { ...config, params: { ...this.params, ...config.params } };
    const key = JSON.stringify(merged);
    const seasons = years * (merged.params.seasonsPerYear ?? SEASONS_PER_YEAR);
    const cached = this.cache.get(key);
    if (cached && cached.every((h) => h.length >= seasons || h.at(-1)?.population === 0)) {
      return cached.map((h) => h.slice(0, seasons));
    }
    const runs = this.seeds.map((seed) => new Simulation({ seed, ...merged }).runYears(years));
    this.cache.set(key, runs);
    return runs;
  }
}

/** Moyenne, sur les graines, d'un indicateur moyenné sur une plage de saisons [from, to[. */
export function avgOver(runs: SeasonMetrics[][], key: Metric, from: number, to: number): number {
  return mean(runs.map((h) => mean(h.slice(from, to).map((m) => m[key]))));
}

/** Plage de saisons couvrant les années [fromYear, toYear[. */
export function years(fromYear: number, toYear: number): [number, number] {
  return [fromYear * SEASONS_PER_YEAR, toYear * SEASONS_PER_YEAR];
}

/** Une vérification : un fait stylisé ou une hypothèse de calibrage, mesuré dans un contexte donné. */
export interface Check {
  id: string;
  title: string;
  /** Référence dans la littérature, ou raison du choix pour une hypothèse. */
  basis?: string;
  run(ctx: CheckContext): Condition[];
}

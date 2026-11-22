import { Simulation } from '../engine';
import { mean } from '../metrics';
import type { SeasonMetrics, SimConfig } from '../types';

export const SEEDS = [1, 2, 3, 4, 5];

/** Lance la même configuration sur plusieurs graines pour ne pas tester un coup de chance. */
export function runSeeds(config: Omit<SimConfig, 'seed'>, years: number): SeasonMetrics[][] {
  return SEEDS.map((seed) => new Simulation({ seed, ...config }).runYears(years));
}

/** Moyenne, sur les graines, d'un indicateur moyenné sur une plage de saisons [from, to[. */
export function avgOver(
  runs: SeasonMetrics[][],
  key: keyof Pick<SeasonMetrics, 'meanShare' | 'pond' | 'meanDisposition' | 'population'>,
  from: number,
  to: number,
): number {
  return mean(runs.map((h) => mean(h.slice(from, to).map((m) => m[key]))));
}

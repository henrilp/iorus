/**
 * L'étang peut-il s'éteindre ?
 *
 * Avec la pêche de Schaefer (fiche 0010), le stock ne peut tendre vers zéro que si
 * l'effort total dépasse croissance × capacité ÷ pêche maximale. La capacité valant
 * [pondCapacityPerVillager] × taille de départ, ce seuil, exprimé en adultes qui ne se modèrent pas du tout,
 * vaut ρ × taille de départ avec ρ = [pondGrowth] × [pondCapacityPerVillager] ÷ [maxCatch].
 *
 * La grille fait varier ρ (par la pêche maximale, ce qui laisse inchangée la pêche durable maximale
 * croissance × capacité ÷ 4) pour plusieurs croissances. Si les lignes se ressemblent d'une colonne
 * à l'autre, c'est ρ, et non chaque paramètre séparément, qui décide du sort de l'étang.
 * Le village de généreux sert de témoin : là où lui aussi épuise l'étang, l'extinction est
 * inscrite dans les chiffres et ne dit rien des comportements.
 */
import { avgOver, CheckContext, SEASONS_PER_YEAR } from '../checks/helpers';
import { EGOISTS, FREE_RIDERS, GENEROUS } from '../checks/stylizedFacts';
import { mean } from '../sim/metrics';
import { DEFAULT_PARAMS } from '../sim/params';
import type { Composition } from '../sim/types';

export const POND_RATIOS = [0.75, 1, 1.5, 2, 3, 3.75, 5];
export const POND_GROWTHS = [0.15, 0.3, 0.6];
export const POND_SCENARIOS: { label: string; composition: Composition }[] = [
  { label: 'égoïstes (disposition 0,05)', composition: EGOISTS },
  { label: '15 % de profiteurs', composition: FREE_RIDERS },
  // Témoin : si même des généreux épuisent l'étang, l'extinction vient des chiffres, pas des comportements.
  { label: 'généreux (disposition 0,9), témoin', composition: GENEROUS },
];
const SIZE = 30;
const YEARS = 100;
const LAST = [80 * SEASONS_PER_YEAR, YEARS * SEASONS_PER_YEAR] as const;

export interface PondCell {
  ratio: number;
  growth: number;
  maxCatch: number;
  /** Étang moyen des 20 dernières années, en fraction de la capacité. */
  pond: number;
  /** Nombre de graines où l'étang est épuisé en moyenne sur les 20 dernières années. */
  depleted: number;
  seeds: number;
  /** Adultes moyens des 20 dernières années, et seuil d'extinction ρ × taille en adultes sans modération. */
  adults: number;
  threshold: number;
}

export function pondGrid(composition: Composition, seeds: number[]): PondCell[] {
  const cells: PondCell[] = [];
  for (const ratio of POND_RATIOS) {
    for (const growth of POND_GROWTHS) {
      const maxCatch = (growth * DEFAULT_PARAMS.pondCapacityPerVillager) / ratio;
      const runs = new CheckContext({ pondGrowth: growth, maxCatch }, seeds).runs({ size: SIZE, composition }, YEARS);
      const perSeedPond = runs.map((h) => mean(h.slice(...LAST).map((m) => m.pond)));
      cells.push({
        ratio,
        growth,
        maxCatch,
        pond: mean(perSeedPond),
        depleted: perSeedPond.filter((p) => p < DEFAULT_PARAMS.pondDepletedThreshold).length,
        seeds: seeds.length,
        adults: avgOver(runs, 'adults', ...LAST),
        threshold: ratio * SIZE,
      });
    }
  }
  return cells;
}

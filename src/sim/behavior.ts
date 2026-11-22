import type { SimParams } from './params';
import type { Rng } from './rng';
import type { Villager } from './types';

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/**
 * Le cœur du modèle : un mélange entre ce que le villageois ferait seul (sa disposition)
 * et ce qu'il croit que font les autres, dosé par son influençabilité.
 * La pente < 1 traduit le biais observé : on rend un peu moins que ce qu'on voit.
 *
 * À influençabilité égale, une disposition plus haute donne toujours au moins autant
 * (le coefficient de la disposition, 1 − influençabilité, n'est jamais négatif).
 */
export function conditionalChoice(
  disposition: number,
  influence: number,
  belief: number,
  params: Pick<SimParams, 'conditionalSlope'>,
): number {
  return (1 - influence) * disposition + influence * params.conditionalSlope * belief;
}

/** Part de la récolte versée au grenier commun. */
export function granaryShare(v: Villager, params: SimParams, rng: Rng): number {
  const base = conditionalChoice(v.disposition, v.influence, v.beliefShare, params);
  // La peur des sanctions pousse à s'aligner sur ce que font les autres.
  const fearFactor = Math.min(1, v.fear / params.fearSaturation);
  const deterred = base + Math.max(0, v.beliefShare - base) * fearFactor;
  return clamp01(deterred + rng.normal(0, params.behaviorNoise));
}

/** Modération à l'étang : 1 = ne pêche pas, 0 = pêche le maximum. */
export function pondRestraint(v: Villager, params: SimParams, rng: Rng): number {
  const base = conditionalChoice(v.disposition, v.influence, v.beliefRestraint, params);
  return clamp01(base + rng.normal(0, params.behaviorNoise));
}

/** Probabilité de sanctionner un villageois qui contribue nettement moins que les autres. */
export function sanctionProbability(v: Villager, params: SimParams): number {
  return v.disposition * params.sanctionPropensity;
}

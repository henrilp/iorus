/**
 * Balayage un paramètre à la fois : chaque paramètre numérique du moteur est multiplié
 * par plusieurs facteurs autour de sa valeur de base (borné par les limites du registre),
 * les autres restant à leur valeur de base. Pour chaque variation, on revérifie
 * tous les faits stylisés et toutes les hypothèses de calibrage.
 *
 * La base est soit les valeurs par défaut du moteur, soit la configuration du jeu (fiche 0029).
 */
import { CALIBRATION_HYPOTHESES } from '../checks/calibrationHypotheses';
import { type Check, CheckContext, type Condition, holds, margin } from '../checks/helpers';
import { STYLIZED_FACTS } from '../checks/stylizedFacts';
import { DEFAULT_PARAMS, type SimParams } from '../sim/params';
import { PARAM_SPECS, type ParamStatus } from '../sim/paramSpec';

export const DEFAULT_FACTORS = [0.5, 0.75, 1.5, 2];

/**
 * Paramètres numériques exclus du balayage, avec la raison (affichée dans le rapport).
 * Ceux qui n'ont d'effet que si une option est active sont balayés quand la base l'active (voir `ACTIVE_WITH`).
 */
export const EXCLUDED: Partial<Record<keyof SimParams, string>> = {
  seasonsPerYear: 'change le sens de tous les paramètres « par saison » ; le faire varier seul ne teste rien de cohérent',
  pondDepletedThreshold: 'sert seulement à l’indicateur « étang épuisé », sans effet sur la simulation',
  observedNeighbors: 'vaut 0 (tout le village) par défaut, et une variation proportionnelle de 0 reste 0 ; à balayer à part si le voisinage devient la règle (fiche 0023)',
  playerStartAge: 'sans effet sur les vérifications, qui se jouent sans joueur',
  droughtProbability: 'vaut 0 (jamais) par défaut, et une variation proportionnelle de 0 reste 0 (fiche 0024)',
  droughtSeasons: 'sans effet tant que les sécheresses sont désactivées',
  droughtSeverity: 'sans effet tant que les sécheresses sont désactivées',
  arrivalProbability: 'vaut 0 (jamais) par défaut, et une variation proportionnelle de 0 reste 0 (fiche 0025)',
  arrivalSize: 'sans effet tant que les arrivées sont désactivées',
  chiefTermYears: 'sans effet tant que le village n’a pas de chef (fiche 0026)',
  chiefCandidates: 'sans effet tant que le village n’a pas de chef (fiche 0027)',
};

export interface CheckOutcome {
  check: Check;
  kind: 'fait' | 'hypothèse';
  conditions: Condition[];
  ok: boolean;
  /** Plus petite marge parmi les conditions : négative si la vérification casse. */
  margin: number;
}

export interface Variation {
  param: keyof SimParams;
  status: ParamStatus;
  factor: number;
  value: number;
  outcomes: CheckOutcome[];
}

export const ALL_CHECKS: { check: Check; kind: 'fait' | 'hypothèse' }[] = [
  ...STYLIZED_FACTS.map((check) => ({ check, kind: 'fait' as const })),
  ...CALIBRATION_HYPOTHESES.map((check) => ({ check, kind: 'hypothèse' as const })),
];

export function evaluate(params: Partial<SimParams>, seeds: number[]): CheckOutcome[] {
  const ctx = new CheckContext(params, seeds);
  return ALL_CHECKS.map(({ check, kind }) => {
    const conditions = check.run(ctx);
    return {
      check,
      kind,
      conditions,
      ok: conditions.every(holds),
      margin: Math.min(...conditions.map(margin)),
    };
  });
}

/** Les paramètres exclus parce qu'une option est désactivée : ils redeviennent balayables quand la base active l'option. */
export const ACTIVE_WITH: Partial<Record<keyof SimParams, keyof SimParams>> = {
  observedNeighbors: 'observedNeighbors',
  droughtProbability: 'droughtProbability',
  droughtSeasons: 'droughtProbability',
  droughtSeverity: 'droughtProbability',
  arrivalProbability: 'arrivalProbability',
  arrivalSize: 'arrivalProbability',
  chiefTermYears: 'chiefEnabled',
  chiefCandidates: 'chiefEnabled',
};

/** Les exclusions qui valent pour une base donnée. */
export function exclusions(base: Partial<SimParams> = {}): [keyof SimParams, string][] {
  return (Object.entries(EXCLUDED) as [keyof SimParams, string][]).filter(([k]) => {
    const option = ACTIVE_WITH[k];
    return !(option && base[option]);
  });
}

export function sweepableParams(base: Partial<SimParams> = {}): (keyof SimParams)[] {
  const excluded = new Set(exclusions(base).map(([k]) => k));
  return (Object.keys(DEFAULT_PARAMS) as (keyof SimParams)[]).filter(
    (k) => typeof DEFAULT_PARAMS[k] === 'number' && !excluded.has(k),
  );
}

/** Valeur de base d'un paramètre : celle de la base si elle le fixe, sinon la valeur par défaut. */
export function baseValue(param: keyof SimParams, base: Partial<SimParams> = {}): number | boolean {
  return base[param] ?? DEFAULT_PARAMS[param];
}

/** Valeur variée d'un paramètre, bornée par le registre et arrondie s'il est entier. */
export function variedValue(param: keyof SimParams, factor: number, base: Partial<SimParams> = {}): number {
  const spec = PARAM_SPECS[param];
  let v = (baseValue(param, base) as number) * factor;
  if (spec.min !== undefined) v = Math.max(spec.min, v);
  if (spec.max !== undefined) v = Math.min(spec.max, v);
  if (spec.step !== undefined && spec.step >= 1) v = Math.round(v);
  return v;
}

export function sweep(
  params: (keyof SimParams)[],
  factors: number[],
  seeds: number[],
  onProgress?: (done: number, total: number) => void,
  base: Partial<SimParams> = {},
): Variation[] {
  const out: Variation[] = [];
  const jobs = params.flatMap((param) => factors.map((factor) => ({ param, factor })));
  jobs.forEach(({ param, factor }, i) => {
    const value = variedValue(param, factor, base);
    const seen = out.some((o) => o.param === param && o.value === value);
    if (value !== baseValue(param, base) && !seen) {
      out.push({
        param,
        status: PARAM_SPECS[param].status,
        factor,
        value,
        outcomes: evaluate({ ...base, [param]: value }, seeds),
      });
    }
    onProgress?.(i + 1, jobs.length);
  });
  return out;
}

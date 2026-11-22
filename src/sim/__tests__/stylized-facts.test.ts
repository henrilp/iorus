/**
 * Faits stylisés : le moteur doit reproduire qualitativement des comportements
 * observés dans les expériences et la théorie (voir docs/SPEC-v1.md).
 * Chaque test tourne sur plusieurs graines.
 */
import { describe, expect, test } from 'vitest';
import { avgOver, runSeeds } from './helpers';

const SEASONS_PER_YEAR = 4;
/** Influençabilité par défaut : la majorité des gens observés sont des coopérateurs conditionnels (à sourcer). */
const INFLUENCE = 0.7;
/** 15 % de profiteurs purs (rien pour le groupe, insensibles aux autres) parmi des coopérateurs conditionnels. */
const freeRiders = {
  mode: 'twoGroups',
  shareA: 0.15,
  groupA: { disposition: 0, influence: 0 },
  groupB: { disposition: 0.6, influence: INFLUENCE },
} as const;

describe('faits stylisés', () => {
  test('village généreux : la contribution reste élevée et l’étang tient', () => {
    const runs = runSeeds({ size: 30, composition: { mode: 'uniform', disposition: 0.9, influence: INFLUENCE } }, 50);
    const lastDecade = [40 * SEASONS_PER_YEAR, 50 * SEASONS_PER_YEAR] as const;
    expect(avgOver(runs, 'meanShare', ...lastDecade)).toBeGreaterThan(0.7);
    expect(avgOver(runs, 'pond', ...lastDecade)).toBeGreaterThan(0.5);
  });

  test('passager clandestin : sans sanction, la contribution décline au fil des saisons', () => {
    const runs = runSeeds({ size: 30, composition: freeRiders }, 10);
    const start = avgOver(runs, 'meanShare', 0, 4);
    const end = avgOver(runs, 'meanShare', 36, 40);
    expect(end).toBeLessThan(start - 0.1);
  });

  test('sanctions : la contribution se maintient nettement mieux', () => {
    const without = runSeeds({ size: 30, composition: freeRiders }, 10);
    const withSanctions = runSeeds({ size: 30, composition: freeRiders, params: { sanctionsEnabled: true } }, 10);
    const endWithout = avgOver(without, 'meanShare', 36, 40);
    const endWith = avgOver(withSanctions, 'meanShare', 36, 40);
    expect(endWith).toBeGreaterThan(endWithout + 0.1);
  });

  test('tragédie des communs : un village d’égoïstes épuise l’étang', () => {
    const runs = runSeeds({ size: 30, composition: { mode: 'uniform', disposition: 0.05, influence: INFLUENCE } }, 100);
    for (const h of runs) expect(h.some((m) => m.pondDepleted)).toBe(true);
    expect(avgOver(runs, 'pond', 90 * SEASONS_PER_YEAR, 100 * SEASONS_PER_YEAR)).toBeLessThan(0.1);
  });

  test('invasion : sans sanction, une minorité de profiteurs gagne la population au fil des générations', () => {
    const runs = runSeeds({ size: 30, composition: freeRiders }, 200);
    const startDisposition = avgOver(runs, 'meanDisposition', 0, 1);
    const endDisposition = avgOver(runs, 'meanDisposition', 190 * SEASONS_PER_YEAR, 200 * SEASONS_PER_YEAR);
    expect(endDisposition).toBeLessThan(startDisposition - 0.2);
  });

  test('invasion contenue : avec sanctions, la disposition moyenne tient', () => {
    const without = runSeeds({ size: 30, composition: freeRiders }, 200);
    const withSanctions = runSeeds({ size: 30, composition: freeRiders, params: { sanctionsEnabled: true } }, 200);
    const range = [190 * SEASONS_PER_YEAR, 200 * SEASONS_PER_YEAR] as const;
    expect(avgOver(withSanctions, 'meanDisposition', ...range)).toBeGreaterThan(
      avgOver(without, 'meanDisposition', ...range) + 0.2,
    );
  });
});

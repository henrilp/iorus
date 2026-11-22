/**
 * Hypothèses de calibrage : ce ne sont pas des faits observés, mais des choix de conception
 * assumés. Ils sont testés pour qu'aucune modification des paramètres ne les change par accident.
 * Chacun doit être décrit dans la note des paramètres concernés (src/sim/paramSpec.ts).
 */
import { describe, expect, test } from 'vitest';
import { avgOver, runSeeds } from './helpers';

const SEASONS_PER_YEAR = 4;

describe('hypothèses de calibrage', () => {
  test('ne rien partager n’est pas une condamnation arithmétique : un village d’égoïstes survit, plus petit qu’un village généreux', () => {
    // Choix : un adulte qui ne partage rien couvre ses besoins avec un petit surplus
    // (récolte > consommation). Sinon, la mort des égoïstes serait inscrite dans un chiffre,
    // pas produite par leur comportement. Voir la note de baseHarvest et consumption.
    const egoists = runSeeds({ size: 30, composition: { mode: 'uniform', disposition: 0.05, influence: 0.7 } }, 100);
    const generous = runSeeds({ size: 30, composition: { mode: 'uniform', disposition: 0.9, influence: 0.7 } }, 100);
    for (const h of egoists) expect(h.at(-1)?.population ?? 0).toBeGreaterThan(0);
    const range = [90 * SEASONS_PER_YEAR, 100 * SEASONS_PER_YEAR] as const;
    expect(avgOver(egoists, 'population', ...range)).toBeLessThan(avgOver(generous, 'population', ...range));
  });
});

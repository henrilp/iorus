/**
 * Transparence : rien dans le moteur ne doit échapper à ce qui est montré au joueur.
 */
import { describe, expect, test } from 'vitest';
import { DEFAULT_PARAMS, type SimParams } from '../params';
import { PARAM_SPECS } from '../paramSpec';
import { RULES } from '../rules';

const keys = Object.keys(DEFAULT_PARAMS) as (keyof SimParams)[];

describe('transparence', () => {
  test('chaque paramètre apparaît dans au moins une règle affichée', () => {
    const mentioned = new Set(RULES.flatMap((r) => r.params));
    expect(keys.filter((k) => !mentioned.has(k))).toEqual([]);
  });

  test('les paramètres cités dans les formules sont bien déclarés pour leur règle', () => {
    for (const rule of RULES) {
      const inFormula = [...(rule.formula ?? '').matchAll(/\[(\w+)\]/g)].map((m) => m[1]);
      for (const name of inFormula) {
        expect(keys, `paramètre inconnu [${name}] dans la règle ${rule.id}`).toContain(name);
        expect(rule.params, `[${name}] cité dans la formule de ${rule.id} mais absent de ses params`).toContain(name);
      }
    }
  });

  test('chaque valeur par défaut est dans les bornes affichées', () => {
    for (const k of keys) {
      const spec = PARAM_SPECS[k];
      const value = DEFAULT_PARAMS[k];
      if (typeof value !== 'number') continue;
      if (spec.min !== undefined) expect(value, k).toBeGreaterThanOrEqual(spec.min);
      if (spec.max !== undefined) expect(value, k).toBeLessThanOrEqual(spec.max);
    }
  });

  test('les valeurs proposées au joueur sont dans les bornes et comprennent la valeur par défaut', () => {
    for (const k of keys) {
      const presets = PARAM_SPECS[k].presets;
      if (!presets) continue;
      const spec = PARAM_SPECS[k];
      expect(presets.map((p) => p.value), k).toContain(DEFAULT_PARAMS[k]);
      for (const { value } of presets) {
        if (spec.min !== undefined) expect(value, k).toBeGreaterThanOrEqual(spec.min);
        if (spec.max !== undefined) expect(value, k).toBeLessThanOrEqual(spec.max);
      }
    }
  });
});

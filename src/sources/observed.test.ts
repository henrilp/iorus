import { describe, expect, test } from 'vitest';
import { OBSERVED, observed } from './observed';

describe('faits observés affichables', () => {
  test('chaque fait dit où se trouve son chiffre, le cite, et a ses deux langues', () => {
    for (const f of OBSERVED) {
      expect(f.reference, f.id).not.toBe('');
      expect(f.where, f.id).not.toBe('');
      expect(f.quote.split(' ').length, `${f.id} : citation trop longue`).toBeLessThanOrEqual(20);
      expect(f.text.fr && f.text.en, f.id).toBeTruthy();
    }
  });

  test('les identifiants sont uniques', () => {
    expect(new Set(OBSERVED.map((f) => f.id)).size).toBe(OBSERVED.length);
  });

  test('un fait dont la source n’est pas vérifiée ne peut pas être affiché', () => {
    const unverified = OBSERVED.find((f) => f.status !== 'verifie');
    if (unverified) expect(() => observed(unverified.id)).toThrow();
    expect(observed('dictateur-don-moyen').status).toBe('verifie');
  });
});

/** Traduit les conditions d'une vérification en assertions Vitest (même seuil, même sens). */
import { expect } from 'vitest';
import { CheckContext, type Check } from './helpers';

export function expectCheck(check: Check, ctx: CheckContext = new CheckContext()): void {
  for (const c of check.run(ctx)) {
    if (c.op === '<') expect(c.value, c.label).toBeLessThan(c.threshold);
    else expect(c.value, c.label).toBeGreaterThan(c.threshold);
  }
}

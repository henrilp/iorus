/**
 * La règle de comportement, testée villageois par villageois.
 */
import { describe, expect, test } from 'vitest';
import { conditionalChoice } from '../behavior';
import { DEFAULT_PARAMS } from '../params';

const grid = Array.from({ length: 21 }, (_, i) => i / 20);

describe('règle de comportement', () => {
  test('à influençabilité et croyance égales, plus de disposition ne donne jamais moins', () => {
    for (const influence of grid) {
      for (const belief of grid) {
        for (let k = 1; k < grid.length; k++) {
          const lower = conditionalChoice(grid[k - 1]!, influence, belief, DEFAULT_PARAMS);
          const higher = conditionalChoice(grid[k]!, influence, belief, DEFAULT_PARAMS);
          expect(higher, `influence ${influence}, croyance ${belief}`).toBeGreaterThanOrEqual(lower);
        }
      }
    }
  });

  test('à disposition et influençabilité égales, croire les autres plus généreux ne fait jamais donner moins', () => {
    for (const disposition of grid) {
      for (const influence of grid) {
        for (let k = 1; k < grid.length; k++) {
          const lower = conditionalChoice(disposition, influence, grid[k - 1]!, DEFAULT_PARAMS);
          const higher = conditionalChoice(disposition, influence, grid[k]!, DEFAULT_PARAMS);
          expect(higher).toBeGreaterThanOrEqual(lower);
        }
      }
    }
  });

  test('influençabilité 0 : on agit selon sa seule disposition, quoi que fassent les autres', () => {
    for (const disposition of grid) {
      for (const belief of grid) {
        expect(conditionalChoice(disposition, 0, belief, DEFAULT_PARAMS)).toBeCloseTo(disposition);
      }
    }
  });

  test('influençabilité 1 : on suit les autres, avec le biais à la baisse, quelle que soit sa disposition', () => {
    for (const disposition of grid) {
      for (const belief of grid) {
        expect(conditionalChoice(disposition, 1, belief, DEFAULT_PARAMS)).toBeCloseTo(
          DEFAULT_PARAMS.conditionalSlope * belief,
        );
      }
    }
  });
});

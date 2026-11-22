/**
 * Hypothèses de calibrage : ce ne sont pas des faits observés, mais des choix de conception
 * assumés. Elles sont définies dans src/checks/calibrationHypotheses.ts et testées ici
 * pour qu'aucune modification des paramètres ne les change par accident.
 */
import { describe, test } from 'vitest';
import { CALIBRATION_HYPOTHESES } from '../../checks/calibrationHypotheses';
import { expectCheck } from '../../checks/expectChecks';

describe('hypothèses de calibrage', () => {
  for (const hypothesis of CALIBRATION_HYPOTHESES) test(hypothesis.title, () => expectCheck(hypothesis));
});

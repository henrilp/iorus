/**
 * Faits stylisés : le moteur doit reproduire qualitativement des comportements
 * observés dans les expériences et la théorie (voir docs/SPEC-v1.md).
 * Les faits et leurs seuils sont définis dans src/checks/stylizedFacts.ts,
 * pour que l'outil de robustesse vérifie exactement les mêmes.
 */
import { describe, test } from 'vitest';
import { expectCheck } from '../../checks/expectChecks';
import { CheckContext } from '../../checks/helpers';
import { STYLIZED_FACTS } from '../../checks/stylizedFacts';

describe('faits stylisés', () => {
  const ctx = new CheckContext();
  for (const fact of STYLIZED_FACTS) test(fact.title, () => expectCheck(fact, ctx));
});

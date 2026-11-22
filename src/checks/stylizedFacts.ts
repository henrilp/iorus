/**
 * Faits stylisés : le moteur doit reproduire qualitativement des comportements
 * observés dans les expériences et la théorie (voir docs/SPEC-v1.md).
 * Ce fichier ne contient que des faits observés ; les choix de conception
 * vont dans calibrationHypotheses.ts.
 *
 * Chaque fait est défini une seule fois ici. Il est vérifié avec les paramètres par défaut
 * par stylized-facts.test.ts, et sous des paramètres modifiés par l'outil de robustesse.
 */
import { avgOver, type Check, years } from './helpers';

/** Influençabilité par défaut : la majorité des gens observés sont des coopérateurs conditionnels (à sourcer). */
export const INFLUENCE = 0.7;
const SIZE = 30;

/** 15 % de profiteurs purs (rien pour le groupe, insensibles aux autres) parmi des coopérateurs conditionnels. */
export const FREE_RIDERS = {
  mode: 'twoGroups',
  shareA: 0.15,
  groupA: { disposition: 0, influence: 0 },
  groupB: { disposition: 0.6, influence: INFLUENCE },
} as const;
export const EGOISTS = { mode: 'uniform', disposition: 0.05, influence: INFLUENCE } as const;
export const GENEROUS = { mode: 'uniform', disposition: 0.9, influence: INFLUENCE } as const;

export const STYLIZED_FACTS: Check[] = [
  {
    id: 'genereux',
    title: 'village généreux : la contribution reste élevée et l’étang tient',
    run: (ctx) => {
      const runs = ctx.runs({ size: SIZE, composition: GENEROUS }, 50);
      return [
        { label: 'part versée, années 40-50', value: avgOver(runs, 'meanShare', ...years(40, 50)), op: '>', threshold: 0.7 },
        { label: 'étang, années 40-50', value: avgOver(runs, 'pond', ...years(40, 50)), op: '>', threshold: 0.5 },
      ];
    },
  },
  {
    id: 'passager-clandestin',
    title: 'passager clandestin : sans sanction, la contribution décline au fil des saisons',
    basis: 'Fehr et Gächter (2000, Tableau 3 ; 2002, p. 138), voir src/sources/observed.ts',
    run: (ctx) => {
      const runs = ctx.runs({ size: SIZE, composition: FREE_RIDERS }, 10);
      const start = avgOver(runs, 'meanShare', 0, 4);
      const end = avgOver(runs, 'meanShare', 36, 40);
      return [{ label: 'part versée : année 10 − année 1', value: end - start, op: '<', threshold: -0.1 }];
    },
  },
  {
    id: 'sanctions',
    title: 'sanctions : la contribution se maintient nettement mieux',
    basis: 'Fehr et Gächter (2000, Tableau 3 ; 2002, p. 138)',
    run: (ctx) => {
      const without = ctx.runs({ size: SIZE, composition: FREE_RIDERS }, 10);
      const withSanctions = ctx.runs({ size: SIZE, composition: FREE_RIDERS, params: { sanctionsEnabled: true } }, 10);
      return [
        {
          label: 'part versée en année 10 : avec − sans sanctions',
          value: avgOver(withSanctions, 'meanShare', 36, 40) - avgOver(without, 'meanShare', 36, 40),
          op: '>',
          threshold: 0.1,
        },
      ];
    },
  },
  {
    id: 'tragedie-des-communs',
    title: 'tragédie des communs : en accès libre, un village d’égoïstes surexploite l’étang',
    // Hardin (1968), Gordon (1954) : en accès libre, chacun pêche pour soi et le stock tombe
    // sous le niveau qui donne la plus grande pêche durable (la moitié de la capacité en croissance logistique),
    // et bien plus bas qu'avec des pêcheurs modérés. Surexploitation ne veut pas dire extinction.
    basis: 'Hardin (1968), Gordon (1954)',
    run: (ctx) => {
      const egoists = ctx.runs({ size: SIZE, composition: EGOISTS }, 100);
      const generous = ctx.runs({ size: SIZE, composition: GENEROUS }, 100);
      return [
        {
          label: 'plus haut, sur les graines, du minimum de l’étang chez les égoïstes',
          value: Math.max(...egoists.map((h) => Math.min(...h.map((m) => m.pond)))),
          op: '<',
          threshold: 0.5,
        },
        {
          label: 'étang, années 40-60 : généreux − égoïstes',
          value: avgOver(generous, 'pond', ...years(40, 60)) - avgOver(egoists, 'pond', ...years(40, 60)),
          op: '>',
          threshold: 0.2,
        },
      ];
    },
  },
  {
    id: 'sanctions-surpeche',
    title: 'sanctions de la surpêche : l’étang est mieux préservé',
    // Ostrom, Walker et Gardner : la possibilité de sanctionner réduit la surexploitation d'une ressource commune,
    // mais coûte presque autant qu'elle rapporte. Lu dans la version de conférence de 1991 ; chiffres de 1992 non vérifiés.
    basis: 'Ostrom, Walker et Gardner (version de 1991, p. 34 ; article de 1992 non vérifié)',
    run: (ctx) => {
      const without = ctx.runs({ size: SIZE, composition: FREE_RIDERS }, 60);
      const withSanctions = ctx.runs({ size: SIZE, composition: FREE_RIDERS, params: { pondSanctionsEnabled: true } }, 60);
      return [
        {
          label: 'étang, années 40-60 : avec − sans sanctions',
          value: avgOver(withSanctions, 'pond', ...years(40, 60)) - avgOver(without, 'pond', ...years(40, 60)),
          op: '>',
          threshold: 0.05,
        },
      ];
    },
  },
  {
    id: 'invasion',
    title: 'invasion : sans sanction, une minorité de profiteurs gagne la population au fil des générations',
    run: (ctx) => {
      const runs = ctx.runs({ size: SIZE, composition: FREE_RIDERS }, 200);
      const start = avgOver(runs, 'meanDisposition', 0, 1);
      const end = avgOver(runs, 'meanDisposition', ...years(190, 200));
      return [{ label: 'disposition moyenne : années 190-200 − départ', value: end - start, op: '<', threshold: -0.2 }];
    },
  },
  {
    id: 'invasion-contenue',
    title: 'invasion contenue : avec les sanctions du grenier et de la pêche, la disposition moyenne tient',
    // Avec les seules sanctions du grenier, l'invasion est freinée mais pas contenue depuis que les sanctions
    // sont graduées (fiche 0021) : l'ancien résultat venait de l'accumulation des amendes sur un même fautif.
    run: (ctx) => {
      const without = ctx.runs({ size: SIZE, composition: FREE_RIDERS }, 200);
      const withSanctions = ctx.runs(
        { size: SIZE, composition: FREE_RIDERS, params: { sanctionsEnabled: true, pondSanctionsEnabled: true } },
        200,
      );
      return [
        {
          label: 'disposition moyenne, années 190-200 : avec − sans sanctions',
          value: avgOver(withSanctions, 'meanDisposition', ...years(190, 200)) - avgOver(without, 'meanDisposition', ...years(190, 200)),
          op: '>',
          threshold: 0.2,
        },
      ];
    },
  },
];

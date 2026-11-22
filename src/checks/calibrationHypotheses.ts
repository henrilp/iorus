/**
 * Hypothèses de calibrage : ce ne sont pas des faits observés, mais des choix de conception
 * assumés. Elles sont vérifiées pour qu'aucune modification des paramètres ne les change par accident.
 * Chacune doit être décrite dans la note des paramètres concernés (src/sim/paramSpec.ts).
 */
import { avgOver, type Check, years } from './helpers';
import { EGOISTS, GENEROUS } from './stylizedFacts';

export const CALIBRATION_HYPOTHESES: Check[] = [
  {
    id: 'egoistes-survivent',
    title: 'ne rien partager n’est pas une condamnation arithmétique : un village d’égoïstes survit, plus petit qu’un village généreux',
    // Choix : un adulte qui ne partage rien couvre ses besoins avec un petit surplus
    // (récolte > consommation). Sinon, la mort des égoïstes serait inscrite dans un chiffre,
    // pas produite par leur comportement. Voir la note de baseHarvest et consumption.
    basis: 'note de baseHarvest et consumption',
    run: (ctx) => {
      const egoists = ctx.runs({ size: 30, composition: EGOISTS }, 100);
      const generous = ctx.runs({ size: 30, composition: GENEROUS }, 100);
      return [
        {
          label: 'plus petite population finale des égoïstes, sur les graines',
          value: Math.min(...egoists.map((h) => h.at(-1)?.population ?? 0)),
          op: '>',
          threshold: 0,
        },
        {
          label: 'population, années 90-100 : généreux − égoïstes',
          value: avgOver(generous, 'population', ...years(90, 100)) - avgOver(egoists, 'population', ...years(90, 100)),
          op: '>',
          threshold: 0,
        },
      ];
    },
  },
];

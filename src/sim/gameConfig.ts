/**
 * La configuration du jeu : les réglages que le jeu applique par-dessus les valeurs par défaut du moteur (fiche 0029).
 *
 * Le moteur garde ses valeurs par défaut, celles des faits stylisés de toujours ; le jeu active en plus les options
 * construites pour une vie jouée. L'outil de robustesse revérifie tous les faits avec cette configuration.
 */
import type { SimParams } from './params';

export const GAME_PARAMS: Partial<SimParams> = {
  /** Chacun observe ses deux voisins (fiche 0023). */
  observedNeighbors: 2,
  /** Environ deux sécheresses dans une vie de 45 ans (fiche 0024). */
  droughtProbability: 0.04,
  /** Une ou deux arrivées de nouveaux venus dans une vie (fiche 0025). */
  arrivalProbability: 0.03,
  /** Un chef décide des sanctions (fiches 0026 et 0027). */
  chiefEnabled: true,
};

/**
 * Ce que les vérifications imposent pour éprouver la configuration du jeu : tout, sauf le chef.
 * Les faits sur les sanctions comparent un village avec et sans sanctions fixées d'avance ; un chef qui les change
 * en cours de partie rendrait la comparaison vide.
 */
export const GAME_CHECK_PARAMS: Partial<SimParams> = { ...GAME_PARAMS, chiefEnabled: false };

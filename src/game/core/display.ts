/**
 * Réglages de l'affichage du jeu. Ils ne touchent pas la simulation : ils disent seulement
 * à quel rythme on la regarde. Les nombres qui influencent la simulation, eux, sont tous
 * dans `src/sim/params.ts`.
 */

/** Durée d'une saison à la vitesse ×1, en millisecondes. */
export const SEASON_MS = 4000;

/** Vitesses proposées. 0 = pause. */
export const SPEEDS = [0, 1, 4, 32] as const;
export type Speed = (typeof SPEEDS)[number];

/** À partir de cette vitesse, les villageois ne marchent plus : on ne voit que les niveaux. */
export const NO_WALK_SPEED: Speed = 32;

/** Au plus tant de saisons calculées par image : une longue absence de l'onglet ne fige pas la page. */
export const MAX_SEASONS_PER_TICK = 8;

/** Durées proposées, en années. `null` = jusqu'à ce que le joueur arrête. */
export const DURATIONS: (number | null)[] = [100, 300, null];
export const DEFAULT_DURATION = 300;

/** « Passer 10 ans ». */
export const SKIP_YEARS = 10;

/** Bornes de la taille du village dans le réglage (spec v1). */
export const SIZE_MIN = 10;
export const SIZE_MAX = 60;
export const SIZE_DEFAULT = 30;

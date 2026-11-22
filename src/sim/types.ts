import type { SimParams } from './params';

export interface Villager {
  id: number;
  /** 0 = tout pour soi (I), 1 = tout pour le groupe (Us). Fixée à la naissance, bouge seulement par imitation. */
  disposition: number;
  /**
   * 0 = agit selon sa seule disposition, sans regarder les autres ;
   * 1 = règle entièrement sa conduite sur ce qu'il croit que font les autres.
   * Fixée à la naissance (héritée du parent avec une petite variation).
   */
  influence: number;
  /** Part de récolte que le villageois croit que les autres versent au grenier. */
  beliefShare: number;
  /** Modération que le villageois croit que les autres ont à l'étang (1 = personne ne pêche). */
  beliefRestraint: number;
  /** Mémoire des sanctions reçues pour avoir peu versé au grenier. */
  fearGranary: number;
  /** Mémoire des sanctions reçues pour avoir trop pêché. */
  fearPond: number;
  wealth: number;
  /** Âge en saisons. */
  ageSeasons: number;
  /** Âge (en années) auquel il mourra de vieillesse. */
  lifespanYears: number;
  hungerSeasons: number;
  /** Revenu cumulé depuis le début de l'année (récolte gardée, part du grenier, pêche, sanctions). Remis à zéro après l'imitation. */
  yearIncome: number;
  /** Saisons passées adulte depuis le début de l'année, pour ramener le revenu à une moyenne par saison. */
  yearSeasons: number;
  parentId: number | null;
  isPlayer: boolean;
  /** Dernière saison : ce qu'il a fait (pour la fiche et le rendu). */
  last: LastActions;
}

export interface LastActions {
  harvest: number;
  share: number;
  contributed: number;
  received: number;
  /** Effort de pêche : 1 − modération. */
  effort: number;
  caught: number;
  sanctionsGiven: number;
  /** Sanctions reçues pour le grenier. */
  sanctionsReceived: number;
  /** Sanctions reçues pour la pêche. */
  pondSanctionsReceived: number;
}

export interface Traits {
  disposition: number;
  influence: number;
}

export type Composition =
  | ({ mode: 'uniform' } & Traits)
  | { mode: 'twoGroups'; shareA: number; groupA: Traits; groupB: Traits }
  | { mode: 'mix'; mean: Traits; spread: Traits };

export type PlayerProfile = Traits;

export interface SimConfig {
  seed: number;
  size: number;
  composition: Composition;
  player?: PlayerProfile;
  params?: Partial<SimParams>;
}

export interface SeasonMetrics {
  season: number;
  year: number;
  population: number;
  adults: number;
  meanWealth: number;
  /** Stock de l'étang en fraction de sa capacité. */
  pond: number;
  pondDepleted: boolean;
  /** Part moyenne de la récolte versée au grenier par les adultes. */
  meanShare: number;
  meanDisposition: number;
  meanInfluence: number;
  /** Répartition des dispositions de toute la population en 10 tranches de 0,1 (parts qui somment à 1). */
  dispositionBins: number[];
  /** Inégalités de patrimoine : Gini des réserves des adultes (âge et héritage compris). */
  wealthGini: number;
  /** Inégalités de revenu : Gini de ce que chaque adulte a gagné cette saison, avant les repas. */
  incomeGini: number;
  /** Sanctions de la saison, grenier et pêche confondus. */
  sanctions: number;
  pondSanctions: number;
  births: number;
  deaths: number;
}

export interface SimState {
  params: SimParams;
  season: number;
  villagers: Villager[];
  pondStock: number;
  pondCapacity: number;
  nextId: number;
  history: SeasonMetrics[];
  extinct: boolean;
}

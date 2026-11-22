/**
 * Paramètres du moteur. Chaque valeur est provisoire tant que sa source
 * n'est pas vérifiée dans docs/SOURCES.md.
 */
export interface SimParams {
  seasonsPerYear: number;

  // Économie
  /** Récolte d'un adulte quand les terres suffisent à tout le monde. */
  baseHarvest: number;
  /** Variation aléatoire de la récolte (écart relatif). */
  harvestNoise: number;
  /** Nombre d'adultes que les champs peuvent occuper à plein rendement. */
  farmlandCapacity: number;
  /** Multiplicateur du grenier commun (1 < r < nombre d'adultes). */
  granaryMultiplier: number;
  /** Nourriture mangée par un adulte chaque saison. */
  consumption: number;
  /** Nourriture d'un enfant par saison, prise sur la réserve du parent (ou la sienne s'il est orphelin). */
  childConsumption: number;
  startingWealth: number;
  /** Âge maximal des villageois au lancement (les âges sont tirés entre l'âge adulte et celui-ci). */
  initialMaxAge: number;

  // Environnement
  /** Capacité de l'étang, en poissons par villageois de départ. */
  pondCapacityPerVillager: number;
  /** Taux de croissance logistique de l'étang, par saison. */
  pondGrowth: number;
  /** Pêche maximale d'un villageois par saison. */
  maxCatch: number;
  /** En dessous de cette fraction de la capacité, l'étang est épuisé. */
  pondDepletedThreshold: number;

  // Comportement
  /**
   * Pente de la coopération conditionnelle : un coopérateur conditionnel
   * rend un peu moins que ce qu'il voit les autres faire.
   */
  conditionalSlope: number;
  /** Poids donné aux nouvelles observations dans les croyances. */
  beliefLearningRate: number;
  /** Petite variation aléatoire des choix (personne n'est une machine). */
  behaviorNoise: number;

  // Sanctions
  sanctionsEnabled: boolean;
  /** Sanctions contre la surpêche, avec les mêmes coût, perte, écart et propension. */
  pondSanctionsEnabled: boolean;
  /** Coût payé par celui qui sanctionne. */
  sanctionCost: number;
  /** Perte infligée au villageois sanctionné. */
  sanctionFine: number;
  /** Écart sous la moyenne à partir duquel on peut être sanctionné. */
  sanctionGap: number;
  /** Probabilité de sanctionner pour une disposition de 1. */
  sanctionPropensity: number;
  /** Mémoire des sanctions reçues (décroissance par saison). */
  fearDecay: number;
  /** Peur à partir de laquelle on s'aligne complètement sur les autres. */
  fearSaturation: number;

  // Générations
  adultAge: number;
  lifeExpectancy: number;
  lifeExpectancySd: number;
  /** Saisons de famine consécutives avant la mort. */
  starvationSeasons: number;
  fertileAgeMin: number;
  fertileAgeMax: number;
  birthWealthThreshold: number;
  birthProbability: number;
  /** Nourriture que le parent donne à l'enfant à la naissance. */
  birthEndowment: number;
  /** Variation de disposition entre parent et enfant. */
  inheritanceNoise: number;
  /** Probabilité annuelle de se comparer à un autre villageois. */
  imitationProbability: number;
  /** Fraction de l'écart de disposition comblée en imitant. */
  imitationRate: number;
}

export const DEFAULT_PARAMS: SimParams = {
  seasonsPerYear: 4,

  baseHarvest: 10,
  harvestNoise: 0.15,
  farmlandCapacity: 40,
  granaryMultiplier: 1.6,
  consumption: 8,
  childConsumption: 3,
  startingWealth: 20,
  initialMaxAge: 50,

  pondCapacityPerVillager: 50,
  pondGrowth: 0.3,
  maxCatch: 4,
  pondDepletedThreshold: 0.05,

  conditionalSlope: 0.9,
  beliefLearningRate: 0.4,
  behaviorNoise: 0.04,

  sanctionsEnabled: false,
  pondSanctionsEnabled: false,
  sanctionCost: 1,
  sanctionFine: 3,
  sanctionGap: 0.1,
  sanctionPropensity: 0.3,
  fearDecay: 0.8,
  fearSaturation: 3,

  adultAge: 16,
  lifeExpectancy: 60,
  lifeExpectancySd: 8,
  starvationSeasons: 4,
  fertileAgeMin: 18,
  fertileAgeMax: 45,
  birthWealthThreshold: 40,
  birthProbability: 0.25,
  birthEndowment: 20,
  inheritanceNoise: 0.05,
  imitationProbability: 0.1,
  imitationRate: 0.3,
};

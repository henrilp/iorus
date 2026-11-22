/**
 * Registre des paramètres du moteur : la source unique de ce qui est montré au joueur
 * (labo, « Comment ça marche ? ») et de ce qui reste à sourcer.
 *
 * Le type `Record<keyof SimParams, ParamSpec>` oblige à décrire chaque paramètre :
 * en oublier un fait échouer la compilation.
 */
import type { SimParams } from './params';

export interface Text {
  fr: string;
  en: string;
}

/**
 * - `source` : valeur vérifiée dans une publication.
 * - `a-sourcer` : la littérature donne une valeur ou une forme, pas encore vérifiée.
 * - `hypothese` : choix de conception (équilibre du jeu, lisibilité), sans source directe.
 */
export type ParamStatus = 'source' | 'a-sourcer' | 'hypothese';

export type ParamGroup = 'time' | 'economy' | 'environment' | 'behavior' | 'sanctions' | 'generations';

export interface ParamSpec {
  group: ParamGroup;
  label: Text;
  help: Text;
  unit?: Text;
  min?: number;
  max?: number;
  step?: number;
  status: ParamStatus;
  /** Justification du choix, ou piste de source. */
  note?: Text;
  /**
   * Valeurs proposées au joueur dans les réglages simples, parmi lesquelles la valeur par défaut.
   * Le paramètre reste réglable librement dans le labo.
   */
  presets?: { label: Text; value: number }[];
}

export const GROUPS: { id: ParamGroup; label: Text }[] = [
  { id: 'economy', label: { fr: 'Économie', en: 'Economy' } },
  { id: 'environment', label: { fr: 'Environnement (l’étang)', en: 'Environment (the pond)' } },
  { id: 'behavior', label: { fr: 'Comportement', en: 'Behaviour' } },
  { id: 'sanctions', label: { fr: 'Sanctions', en: 'Sanctions' } },
  { id: 'generations', label: { fr: 'Générations', en: 'Generations' } },
  { id: 'time', label: { fr: 'Temps', en: 'Time' } },
];

export const STATUS_LABELS: Record<ParamStatus, Text> = {
  source: { fr: 'sourcé', en: 'sourced' },
  'a-sourcer': { fr: 'à sourcer', en: 'to be sourced' },
  hypothese: { fr: 'hypothèse', en: 'assumption' },
};

const FOOD: Text = { fr: 'nourriture', en: 'food' };
const PER_SEASON: Text = { fr: 'nourriture / saison', en: 'food / season' };
const YEARS: Text = { fr: 'ans', en: 'years' };
const SEASONS: Text = { fr: 'saisons', en: 'seasons' };
const PROBA: Text = { fr: 'probabilité', en: 'probability' };
const FRACTION: Text = { fr: 'fraction', en: 'fraction' };

const BALANCE_NOTE: Text = {
  fr: 'Choisi avec la récolte et la consommation pour qu’un adulte qui ne partage rien couvre ses besoins avec un petit surplus, et que le partage crée un surplus nettement plus grand. Une consommation supérieure à la récolte rendrait la survie impossible sans grenier : ce serait une thèse cachée dans un chiffre.',
  en: 'Chosen together with harvest and consumption so that an adult who shares nothing covers their needs with a small surplus, while sharing creates a much larger one. A consumption above the harvest would make survival impossible without the granary: a thesis hidden in a number.',
};

export const PARAM_SPECS: Record<keyof SimParams, ParamSpec> = {
  // --- Temps ---
  seasonsPerYear: {
    group: 'time',
    label: { fr: 'Saisons par an', en: 'Seasons per year' },
    help: {
      fr: 'Nombre de saisons dans une année. Récolte, pêche et repas ont lieu chaque saison ; naissances et imitation une fois par an. Le changer modifie le sens de tous les paramètres « par saison ».',
      en: 'Number of seasons in a year. Harvest, fishing and meals happen every season; births and imitation once a year. Changing it changes the meaning of every “per season” parameter.',
    },
    unit: SEASONS,
    min: 1,
    max: 12,
    step: 1,
    status: 'hypothese',
  },

  // --- Économie ---
  baseHarvest: {
    group: 'economy',
    label: { fr: 'Récolte de base', en: 'Base harvest' },
    help: {
      fr: 'Ce que produit un adulte en une saison quand il y a assez de champs pour tout le monde.',
      en: 'What an adult produces in one season when there is enough farmland for everyone.',
    },
    unit: PER_SEASON,
    min: 1,
    max: 50,
    step: 0.5,
    status: 'hypothese',
    note: BALANCE_NOTE,
  },
  harvestNoise: {
    group: 'economy',
    label: { fr: 'Aléa de la récolte', en: 'Harvest randomness' },
    help: {
      fr: 'Écart type relatif de la récolte : 0,15 veut dire qu’une récolte varie typiquement de ±15 % autour de sa valeur attendue.',
      en: 'Relative standard deviation of the harvest: 0.15 means a harvest typically varies by ±15% around its expected value.',
    },
    unit: FRACTION,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  farmlandCapacity: {
    group: 'economy',
    label: { fr: 'Capacité des champs', en: 'Farmland capacity' },
    help: {
      fr: 'Nombre d’adultes que les champs occupent à plein rendement. Au-delà, la récolte de chacun baisse en proportion : c’est ce qui empêche la population de croître sans limite.',
      en: 'Number of adults the fields can employ at full yield. Beyond it, everyone’s harvest drops proportionally: this is what keeps the population from growing without limit.',
    },
    unit: { fr: 'adultes', en: 'adults' },
    min: 5,
    max: 300,
    step: 1,
    status: 'hypothese',
  },
  granaryMultiplier: {
    group: 'economy',
    label: { fr: 'Multiplicateur du grenier', en: 'Granary multiplier' },
    help: {
      fr: 'Ce qui est versé au grenier est multiplié par ce nombre, puis réparti à parts égales entre tous les adultes. Tant qu’il est supérieur à 1 et inférieur au nombre d’adultes, il y a dilemme : le groupe gagne à ce que chacun verse, mais chacun gagne à ne pas verser.',
      en: 'What goes into the granary is multiplied by this number, then shared equally among all adults. As long as it is above 1 and below the number of adults, there is a dilemma: the group gains when everyone contributes, but each individual gains by not contributing.',
    },
    min: 1,
    max: 5,
    step: 0.1,
    status: 'source',
    note: {
      fr: '1,6 est la valeur de l’expérience de référence : groupes de 4, chacun récupère 0,4 de ce qu’il verse (Fehr et Gächter, 2000, American Economic Review 90(4), p. 980–994). Ici, avec 30 adultes ou plus, chacun ne récupère que 1,6/30 de son propre versement : le dilemme est beaucoup plus fort qu’en laboratoire.',
      en: '1.6 is the value of the reference experiment: groups of 4, each gets back 0.4 of what they contribute (Fehr and Gächter, 2000, American Economic Review 90(4), pp. 980–994). Here, with 30 adults or more, each gets back only 1.6/30 of their own contribution: the dilemma is much stronger than in the lab.',
    },
  },
  consumption: {
    group: 'economy',
    label: { fr: 'Consommation d’un adulte', en: 'Adult consumption' },
    help: {
      fr: 'Nourriture mangée par un adulte chaque saison. Si sa réserve ne suffit pas, il a faim.',
      en: 'Food eaten by an adult every season. If their reserve is not enough, they go hungry.',
    },
    unit: PER_SEASON,
    min: 0,
    max: 50,
    step: 0.5,
    status: 'hypothese',
    note: BALANCE_NOTE,
  },
  childConsumption: {
    group: 'economy',
    label: { fr: 'Consommation d’un enfant', en: 'Child consumption' },
    help: {
      fr: 'Nourriture mangée par un enfant chaque saison, prise sur la réserve de son parent (ou sur la sienne s’il est orphelin ou si le parent n’a plus rien). Les enfants ne travaillent pas.',
      en: 'Food eaten by a child every season, taken from their parent’s reserve (or their own if orphaned or if the parent has nothing left). Children do not work.',
    },
    unit: PER_SEASON,
    min: 0,
    max: 50,
    step: 0.5,
    status: 'hypothese',
  },
  startingWealth: {
    group: 'economy',
    label: { fr: 'Réserve de départ', en: 'Starting reserve' },
    help: {
      fr: 'Nourriture que possède chaque villageois au lancement de la partie.',
      en: 'Food each villager owns when the game starts.',
    },
    unit: FOOD,
    min: 0,
    max: 500,
    step: 1,
    status: 'hypothese',
  },
  initialMaxAge: {
    group: 'generations',
    label: { fr: 'Âge maximal au départ', en: 'Maximum starting age' },
    help: {
      fr: 'Au lancement, l’âge de chaque villageois est tiré au hasard entre l’âge adulte et cette valeur.',
      en: 'At launch, each villager’s age is drawn at random between adulthood and this value.',
    },
    unit: YEARS,
    min: 16,
    max: 90,
    step: 1,
    status: 'hypothese',
  },

  // --- Environnement ---
  pondCapacityPerVillager: {
    group: 'environment',
    label: { fr: 'Taille de l’étang', en: 'Pond size' },
    help: {
      fr: 'Nombre maximal de poissons dans l’étang, par villageois présent au départ. La capacité est fixée au lancement et ne grandit pas avec la population.',
      en: 'Maximum number of fish in the pond, per villager present at the start. Capacity is set at launch and does not grow with the population.',
    },
    unit: { fr: 'poissons / villageois', en: 'fish / villager' },
    min: 0,
    max: 500,
    step: 5,
    status: 'hypothese',
    presets: [
      { label: { fr: 'Grand étang', en: 'Large pond' }, value: 50 },
      { label: { fr: 'Petit étang', en: 'Small pond' }, value: 20 },
    ],
    note: {
      fr: 'Aucune source : la taille de l’étang est un choix de scénario, laissé au joueur. Ce qui décide si l’étang peut s’éteindre est le rapport croissance × taille ÷ pêche maximale, comparé à la taille que le village atteint. Avec le grand étang (50), il ne s’éteint dans aucun des villages testés. Avec le petit étang (20), un village d’égoïstes ou une minorité de 15 % de profiteurs l’épuise, alors que des villageois coopératifs le gardent entre un tiers et deux tiers de sa capacité : l’extinction y vient des comportements, pas des chiffres. Voir les décisions 0013 et 0016.',
      en: 'No source: pond size is a scenario choice left to the player. What decides whether the pond can die out is the ratio growth × size ÷ maximum catch, compared with the size the village reaches. With the large pond (50), it dies out in none of the villages tested. With the small pond (20), a village of egoists or a 15% minority of free riders depletes it, while cooperative villagers keep it between a third and two thirds of its capacity: there, extinction comes from behaviour, not from the numbers. See decisions 0013 and 0016.',
    },
  },
  pondGrowth: {
    group: 'environment',
    label: { fr: 'Croissance de l’étang', en: 'Pond growth' },
    help: {
      fr: 'Vitesse à laquelle les poissons se reproduisent (croissance logistique) : rapide quand l’étang est à moitié plein, lente quand il est presque vide ou presque plein. La pêche durable maximale vaut croissance × capacité ÷ 4 par saison, atteinte quand l’étang est à moitié plein. Avec la pêche de Schaefer, l’étang ne s’éteint que si l’effort total du village dépasse croissance × capacité ÷ pêche maximale.',
      en: 'How fast fish reproduce (logistic growth): fast when the pond is half full, slow when it is nearly empty or nearly full. Maximum sustainable catch is growth × capacity ÷ 4 per season, reached when the pond is half full. With Schaefer fishing, the pond only dies out if the village’s total effort exceeds growth × capacity ÷ maximum catch.',
    },
    unit: { fr: 'par saison', en: 'per season' },
    min: 0,
    max: 1,
    step: 0.05,
    status: 'a-sourcer',
    note: {
      fr: 'La croissance logistique et la prise proportionnelle à l’effort et au stock forment le modèle standard des ressources halieutiques (Schaefer, 1954) ; la valeur choisie est une hypothèse. Voir la décision 0010.',
      en: 'Logistic growth and a catch proportional to effort and stock form the standard fish-stock model (Schaefer, 1954); the chosen value is an assumption. See decision 0010.',
    },
  },
  maxCatch: {
    group: 'environment',
    label: { fr: 'Pêche maximale', en: 'Maximum catch' },
    help: {
      fr: 'Ce que pêche en une saison un villageois qui ne se modère pas du tout, quand l’étang est plein. Sa prise baisse avec le stock : à moitié plein, il en attrape moitié moins (modèle de Schaefer). Un poisson vaut une unité de nourriture.',
      en: 'What a villager who shows no restraint at all catches in one season when the pond is full. Their catch falls with the stock: half full, they catch half as much (Schaefer model). One fish is worth one unit of food.',
    },
    unit: PER_SEASON,
    min: 0,
    max: 30,
    step: 0.5,
    status: 'hypothese',
  },
  pondDepletedThreshold: {
    group: 'environment',
    label: { fr: 'Seuil « étang épuisé »', en: '“Depleted pond” threshold' },
    help: {
      fr: 'En dessous de cette fraction de sa capacité, l’étang est compté comme épuisé. C’est un indicateur pour les courbes et les tests : il ne change rien à la simulation.',
      en: 'Below this fraction of its capacity, the pond counts as depleted. It is an indicator for charts and tests: it changes nothing in the simulation.',
    },
    unit: FRACTION,
    min: 0,
    max: 0.5,
    step: 0.01,
    status: 'hypothese',
  },

  droughtProbability: {
    group: 'environment',
    label: { fr: 'Sécheresses', en: 'Droughts' },
    help: {
      fr: 'Probabilité qu’une sécheresse commence au début d’une année. 0 : jamais.',
      en: 'Probability that a drought starts at the beginning of a year. 0: never.',
    },
    unit: PROBA,
    min: 0,
    max: 1,
    step: 0.01,
    status: 'hypothese',
    note: {
      fr: 'Désactivées par défaut : le modèle validé par les faits stylisés n’en a pas. Le prototype d’une vie propose 0,04 par an, environ deux sécheresses dans une vie de 45 ans, pour qu’on en rencontre une ou deux (fiche 0024). Ce n’est pas une fréquence observée.',
      en: 'Off by default: the model validated by the stylised facts has none. The life prototype offers 0.04 per year, about two droughts in a 45-year life, so that one meets one or two (decision 0024). This is not an observed frequency.',
    },
    presets: [
      { label: { fr: 'Jamais', en: 'Never' }, value: 0 },
      { label: { fr: 'Parfois (environ deux par vie)', en: 'Sometimes (about two per life)' }, value: 0.04 },
    ],
  },
  droughtSeasons: {
    group: 'environment',
    label: { fr: 'Durée d’une sécheresse', en: 'Length of a drought' },
    help: {
      fr: 'Nombre de saisons pendant lesquelles les champs donnent moins.',
      en: 'Number of seasons during which fields yield less.',
    },
    unit: SEASONS,
    min: 1,
    max: 40,
    step: 1,
    status: 'hypothese',
    note: {
      fr: 'Une année entière : assez pour qu’une réserve faible ne suffise plus, pas assez pour vider un village (fiche 0024).',
      en: 'A whole year: long enough for a small reserve to run out, not long enough to empty a village (decision 0024).',
    },
  },
  droughtSeverity: {
    group: 'environment',
    label: { fr: 'Force d’une sécheresse', en: 'Strength of a drought' },
    help: {
      fr: 'Part de la récolte perdue pendant une sécheresse. 0,5 : les champs donnent moitié moins.',
      en: 'Share of the harvest lost during a drought. 0.5: fields yield half as much.',
    },
    unit: FRACTION,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
    note: {
      fr: 'Moitié moins : une récolte de 10 tombe à 5, sous ce que mange un adulte (8). Ne pas partager ne suffit plus ; il faut puiser dans sa réserve, le grenier ou l’étang (fiche 0024).',
      en: 'Half as much: a harvest of 10 drops to 5, below what an adult eats (8). Not sharing is no longer enough; one must draw on one’s reserve, the granary or the pond (decision 0024).',
    },
  },

  // --- Comportement ---
  conditionalSlope: {
    group: 'behavior',
    label: { fr: 'Pente de la coopération conditionnelle', en: 'Conditional cooperation slope' },
    help: {
      fr: 'Quand un villageois suit les autres (selon son influençabilité), il fait ce qu’il croit qu’ils font, multiplié par cette pente. En dessous de 1, il rend un peu moins que ce qu’il voit : c’est ce qui fait décliner la coopération dans un groupe sans règles.',
      en: 'When a villager follows others (according to their susceptibility to influence), they do what they believe others do, multiplied by this slope. Below 1, they give back a little less than they see: this is what makes cooperation decline in a group without rules.',
    },
    min: 0,
    max: 1.5,
    step: 0.05,
    status: 'hypothese',
    note: {
      fr: 'La forme est sourcée, la valeur non. Fischbacher et Gächter (2010, American Economic Review 100(1), p. 550 et 554) observent que la plupart des gens contribuent en fonction des autres mais un peu moins qu’eux (« sous la diagonale »). La pente moyenne qu’ils mesurent, tous profils confondus, passagers clandestins compris, est de 0,425 (p. 552). Ici, la pente ne s’applique qu’à la part influencée du comportement, les profiteurs étant représentés par une disposition basse : elle n’est donc pas directement comparable. 0,9 décrit des suiveurs plutôt fidèles ; aucune source ne donne la pente des seuls coopérateurs conditionnels. Avec 0,675, le village généreux verse nettement moins (voir la décision 0017).',
      en: 'The shape is sourced, the value is not. Fischbacher and Gächter (2010, American Economic Review 100(1), pp. 550 and 554) observe that most people contribute according to others but a little less than them (“below the diagonal”). The average slope they measure across all profiles, free riders included, is 0.425 (p. 552). Here, the slope applies only to the influenced part of behaviour, free riders being represented by a low disposition, so it is not directly comparable. 0.9 describes fairly faithful followers; no source gives the slope of conditional cooperators alone. With 0.675, the generous village contributes markedly less (see decision 0017).',
    },
  },
  beliefLearningRate: {
    group: 'behavior',
    label: { fr: 'Vitesse d’ajustement des croyances', en: 'Belief learning rate' },
    help: {
      fr: 'Poids donné à ce qu’on vient d’observer quand on révise ce qu’on croit des autres. 0 : on ne change jamais d’avis ; 1 : on ne retient que la dernière saison.',
      en: 'Weight given to what was just observed when updating what we believe about others. 0: never change one’s mind; 1: only remember the last season.',
    },
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  observedNeighbors: {
    group: 'behavior',
    label: { fr: 'Voisins observés', en: 'Observed neighbours' },
    help: {
      fr: 'Nombre de voisins sur lesquels chacun se fait une idée de ce que font les autres, au grenier comme à l’étang. Les plus proches sur l’anneau des maisons, alternativement d’un côté et de l’autre. 0 : chacun voit tout le village.',
      en: 'Number of neighbours from whom each villager forms an idea of what others do, at the granary and the pond. The closest on the ring of houses, alternately on either side. 0: everyone sees the whole village.',
    },
    min: 0,
    max: 20,
    step: 1,
    status: 'hypothese',
    note: {
      fr: 'Désactivé par défaut (0) : le modèle validé par les faits stylisés est celui où chacun voit tout le village. Le prototype d’une vie l’active pour que l’influence du joueur se voie là où elle agit. Sa valeur décide de la force de l’influence locale : elle devra être choisie pour ce que la recherche dit de la taille des réseaux qu’on observe, pas pour rendre le joueur plus puissant (fiche 0023).',
      en: 'Off by default (0): the model validated by the stylised facts is the one where everyone sees the whole village. The life prototype turns it on so that the player’s influence shows where it acts. Its value sets the strength of local influence: it must be chosen for what research says about the size of observed networks, not to make the player more powerful (decision 0023).',
    },
    presets: [
      { label: { fr: 'Tout le village', en: 'The whole village' }, value: 0 },
      { label: { fr: '2 voisins', en: '2 neighbours' }, value: 2 },
      { label: { fr: '6 voisins', en: '6 neighbours' }, value: 6 },
    ],
  },
  behaviorNoise: {
    group: 'behavior',
    label: { fr: 'Part d’imprévisibilité', en: 'Unpredictability' },
    help: {
      fr: 'Petite variation aléatoire ajoutée à chaque choix (écart type) : personne ne se comporte comme une machine.',
      en: 'Small random variation added to every choice (standard deviation): nobody behaves like a machine.',
    },
    min: 0,
    max: 0.3,
    step: 0.01,
    status: 'hypothese',
  },

  // --- Sanctions ---
  sanctionsEnabled: {
    group: 'sanctions',
    label: { fr: 'Sanctions entre villageois', en: 'Sanctions between villagers' },
    help: {
      fr: 'Autorise un villageois à payer pour faire perdre de la nourriture à un autre qui contribue nettement moins que la moyenne au grenier. La surpêche a sa propre option de sanction.',
      en: 'Allows a villager to pay to make another one, who contributes clearly less than average to the granary, lose food. Overfishing has its own sanction option.',
    },
    status: 'hypothese',
  },
  pondSanctionsEnabled: {
    group: 'sanctions',
    label: { fr: 'Sanctions contre la surpêche', en: 'Sanctions against overfishing' },
    help: {
      fr: 'Autorise un villageois à payer pour faire perdre de la nourriture à un autre qui pêche nettement plus que la moyenne (dont la modération est nettement inférieure). Mêmes coût, perte, écart toléré et propension que pour le grenier ; une mémoire de la peur distincte.',
      en: 'Allows a villager to pay to make another one, who fishes clearly more than average (whose restraint is clearly lower), lose food. Same cost, fine, tolerated gap and propensity as for the granary; a separate memory of fear.',
    },
    status: 'hypothese',
    note: {
      fr: 'Dans les expériences sur les ressources communes, la possibilité de sanctionner réduit la surexploitation (Ostrom, Walker et Gardner, 1992, à vérifier) ; la surveillance et les sanctions graduées font partie des principes d’Ostrom pour gérer un commun (1990). Voir la décision 0011.',
      en: 'In common-pool resource experiments, the possibility of sanctioning reduces overuse (Ostrom, Walker and Gardner, 1992, to be checked); monitoring and graduated sanctions are among Ostrom’s design principles for managing a commons (1990). See decision 0011.',
    },
  },
  sanctionCost: {
    group: 'sanctions',
    label: { fr: 'Coût d’une sanction', en: 'Cost of a sanction' },
    help: {
      fr: 'Ce que paie celui qui sanctionne.',
      en: 'What the punisher pays.',
    },
    unit: FOOD,
    min: 0,
    max: 20,
    step: 0.5,
    status: 'hypothese',
    note: {
      fr: 'L’échelle est un choix : une sanction coûte une unité de nourriture, soit un dixième d’une récolte. Le rapport avec la perte infligée, lui, est sourcé (voir la perte infligée).',
      en: 'The scale is a choice: a sanction costs one unit of food, a tenth of a harvest. Its ratio to the loss inflicted is sourced (see the loss inflicted).',
    },
  },
  sanctionFine: {
    group: 'sanctions',
    label: { fr: 'Perte infligée', en: 'Fine' },
    help: {
      fr: 'Ce que perd le villageois sanctionné.',
      en: 'What the punished villager loses.',
    },
    unit: FOOD,
    min: 0,
    max: 50,
    step: 0.5,
    status: 'source',
    note: {
      fr: 'Trois fois le coût payé par celui qui sanctionne, comme dans Fehr et Gächter (2002, Nature 415, p. 137) : « Each point assigned cost the punished member 3 MUs and the punishing member 1 MU ».',
      en: 'Three times the cost paid by the punisher, as in Fehr and Gächter (2002, Nature 415, p. 137): “Each point assigned cost the punished member 3 MUs and the punishing member 1 MU”.',
    },
  },
  sanctionGap: {
    group: 'sanctions',
    label: { fr: 'Écart toléré', en: 'Tolerated gap' },
    help: {
      fr: 'On ne peut être sanctionné que si sa coopération est inférieure à la moyenne d’au moins cet écart : sa part versée au grenier, ou sa modération à l’étang (0,1 = 10 points). Il sert aussi à graduer les sanctions : au plus une amende par tranche de cet écart sous la moyenne (à 0, plus aucune limite).',
      en: 'One can only be punished if one’s cooperation is below average by at least this gap: one’s share given to the granary, or one’s restraint at the pond (0.1 = 10 points). It also grades sanctions: at most one fine per step of this gap below average (at 0, no limit at all).',
    },
    unit: FRACTION,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  sanctionPropensity: {
    group: 'sanctions',
    label: { fr: 'Propension à sanctionner', en: 'Propensity to punish' },
    help: {
      fr: 'Probabilité, chaque saison, qu’un villageois de disposition 1 sanctionne quelqu’un quand il y a une cible. Elle est multipliée par la disposition : un villageois de disposition 0 ne sanctionne jamais.',
      en: 'Probability, each season, that a villager with disposition 1 punishes someone when there is a target. It is multiplied by the disposition: a villager with disposition 0 never punishes.',
    },
    unit: PROBA,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
    note: {
      fr: 'Simplification : dans les expériences, certains sanctionnent aussi les généreux (punition antisociale, Herrmann, Thöni et Gächter 2008). Ce n’est pas modélisé en v1.',
      en: 'Simplification: in experiments, some people also punish generous contributors (antisocial punishment, Herrmann, Thöni and Gächter 2008). Not modelled in v1.',
    },
  },
  fearDecay: {
    group: 'sanctions',
    label: { fr: 'Mémoire des sanctions', en: 'Memory of sanctions' },
    help: {
      fr: 'Part de la « peur » d’être sanctionné qui reste d’une saison à l’autre (une peur pour le grenier, une pour la pêche). 0,8 : la peur s’estompe de 20 % par saison sans nouvelle sanction.',
      en: 'Share of the “fear” of being punished that carries over from one season to the next. 0.8: fear fades by 20% per season without a new sanction.',
    },
    unit: FRACTION,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  fearSaturation: {
    group: 'sanctions',
    label: { fr: 'Seuil de dissuasion', en: 'Deterrence threshold' },
    help: {
      fr: 'Niveau de peur (en nourriture perdue récemment) à partir duquel un villageois s’aligne complètement sur ce que font les autres. En dessous, il s’aligne en partie.',
      en: 'Fear level (in food recently lost) at which a villager fully aligns with what others do. Below it, they partly align.',
    },
    unit: FOOD,
    min: 0.1,
    max: 50,
    step: 0.5,
    status: 'hypothese',
  },

  // --- Générations ---
  adultAge: {
    group: 'generations',
    label: { fr: 'Âge adulte', en: 'Adult age' },
    help: {
      fr: 'Âge à partir duquel on travaille, verse au grenier, pêche, sanctionne et mange sur sa propre réserve.',
      en: 'Age from which one works, contributes to the granary, fishes, punishes and eats from one’s own reserve.',
    },
    unit: YEARS,
    min: 1,
    max: 30,
    step: 1,
    status: 'hypothese',
  },
  lifeExpectancy: {
    group: 'generations',
    label: { fr: 'Espérance de vie', en: 'Life expectancy' },
    help: {
      fr: 'Âge moyen de mort de vieillesse. Chaque villageois tire son âge de mort à la naissance, jamais avant l’âge adulte.',
      en: 'Average age of death from old age. Each villager draws their age of death at birth, never before adulthood.',
    },
    unit: YEARS,
    min: 20,
    max: 100,
    step: 1,
    status: 'hypothese',
  },
  lifeExpectancySd: {
    group: 'generations',
    label: { fr: 'Variabilité de l’espérance de vie', en: 'Life expectancy spread' },
    help: {
      fr: 'Écart type de l’âge de mort autour de l’espérance de vie.',
      en: 'Standard deviation of the age of death around life expectancy.',
    },
    unit: YEARS,
    min: 0,
    max: 30,
    step: 1,
    status: 'hypothese',
  },
  starvationSeasons: {
    group: 'generations',
    label: { fr: 'Résistance à la faim', en: 'Starvation tolerance' },
    help: {
      fr: 'Nombre de saisons de faim consécutives avant de mourir. Une saison où l’on mange à sa faim remet le compteur à zéro.',
      en: 'Number of consecutive hungry seasons before dying. A season with enough food resets the counter.',
    },
    unit: SEASONS,
    min: 1,
    max: 20,
    step: 1,
    status: 'hypothese',
  },
  fertileAgeMin: {
    group: 'generations',
    label: { fr: 'Début de l’âge fertile', en: 'Start of fertile age' },
    help: {
      fr: 'Âge à partir duquel on peut avoir un enfant. C’est aussi l’âge du villageois du joueur à son arrivée.',
      en: 'Age from which one can have a child. It is also the player’s villager’s age on arrival.',
    },
    unit: YEARS,
    min: 1,
    max: 60,
    step: 1,
    status: 'hypothese',
  },
  fertileAgeMax: {
    group: 'generations',
    label: { fr: 'Fin de l’âge fertile', en: 'End of fertile age' },
    help: {
      fr: 'Âge après lequel on n’a plus d’enfant.',
      en: 'Age after which one no longer has children.',
    },
    unit: YEARS,
    min: 1,
    max: 80,
    step: 1,
    status: 'hypothese',
  },
  birthWealthThreshold: {
    group: 'generations',
    label: { fr: 'Réserve nécessaire pour un enfant', en: 'Reserve needed for a child' },
    help: {
      fr: 'Réserve minimale pour avoir un enfant cette année.',
      en: 'Minimum reserve to have a child this year.',
    },
    unit: FOOD,
    min: 0,
    max: 500,
    step: 1,
    status: 'hypothese',
  },
  birthProbability: {
    group: 'generations',
    label: { fr: 'Probabilité d’avoir un enfant', en: 'Probability of having a child' },
    help: {
      fr: 'Chaque année, probabilité qu’un adulte fertile et assez riche ait un enfant. Simplification : un enfant n’a qu’un parent.',
      en: 'Each year, probability that a fertile and wealthy enough adult has a child. Simplification: a child has only one parent.',
    },
    unit: PROBA,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  birthEndowment: {
    group: 'generations',
    label: { fr: 'Dot de naissance', en: 'Birth endowment' },
    help: {
      fr: 'Nourriture que le parent donne à l’enfant à sa naissance.',
      en: 'Food the parent gives the child at birth.',
    },
    unit: FOOD,
    min: 0,
    max: 500,
    step: 1,
    status: 'hypothese',
  },
  inheritanceNoise: {
    group: 'generations',
    label: { fr: 'Variation des traits à la naissance', en: 'Trait variation at birth' },
    help: {
      fr: 'L’enfant reçoit la disposition et l’influençabilité de son parent, chacune plus une petite variation aléatoire (écart type). Le jeu ne dit pas si cette transmission est génétique ou éducative.',
      en: 'The child gets their parent’s disposition and susceptibility to influence, each plus a small random variation (standard deviation). The game does not say whether this transmission is genetic or educational.',
    },
    min: 0,
    max: 0.5,
    step: 0.01,
    status: 'hypothese',
  },
  imitationProbability: {
    group: 'generations',
    label: { fr: 'Probabilité d’imiter', en: 'Imitation probability' },
    help: {
      fr: 'Chaque année, probabilité qu’un adulte se compare à un autre adulte tiré au hasard, et rapproche sa disposition de la sienne si celui-ci a gagné davantage au cours de l’année. L’influençabilité n’est pas imitée.',
      en: 'Each year, probability that an adult compares themselves with another randomly drawn adult, and moves their disposition towards theirs if the other earned more over the year. Susceptibility to influence is not imitated.',
    },
    unit: PROBA,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  imitationRate: {
    group: 'generations',
    label: { fr: 'Force de l’imitation', en: 'Imitation strength' },
    help: {
      fr: 'Part de l’écart de disposition comblée quand on imite quelqu’un. 1 : on adopte entièrement sa disposition.',
      en: 'Share of the disposition gap closed when imitating someone. 1: one fully adopts their disposition.',
    },
    unit: FRACTION,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  playerStartAge: {
    group: 'generations',
    label: { fr: 'Âge du joueur au début de sa vie', en: 'Player’s age at the start of their life' },
    help: {
      fr: 'Quand le joueur vit une vie, son villageois commence à cet âge, enfant d’un villageois de départ. Sans effet en mode observateur.',
      en: 'When the player lives a life, their villager starts at this age, as the child of a starting villager. No effect in observer mode.',
    },
    unit: YEARS,
    min: 0,
    max: 60,
    step: 1,
    status: 'hypothese',
    note: {
      fr: 'Un an avant l’âge adulte : le temps de découvrir le village chez son parent avant la première récolte (fiche 0020).',
      en: 'One year before adulthood: time to discover the village at one’s parent’s home before the first harvest (decision 0020).',
    },
  },
};

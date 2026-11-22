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
    status: 'a-sourcer',
    note: {
      fr: '1,6 est une valeur classique des expériences de biens publics à 4 joueurs (chacun récupère 0,4 de ce qu’il verse). Ici, avec 30 adultes, chacun ne récupère que 1,6/30 de son propre versement : le dilemme est beaucoup plus fort qu’en laboratoire.',
      en: '1.6 is a classic value in 4-player public goods experiments (each gets back 0.4 of what they contribute). Here, with 30 adults, each gets back only 1.6/30 of their own contribution: the dilemma is much stronger than in the lab.',
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
  },
  pondGrowth: {
    group: 'environment',
    label: { fr: 'Croissance de l’étang', en: 'Pond growth' },
    help: {
      fr: 'Vitesse à laquelle les poissons se reproduisent (croissance logistique) : rapide quand l’étang est à moitié plein, lente quand il est presque vide ou presque plein. La pêche durable maximale vaut croissance × capacité ÷ 4 par saison.',
      en: 'How fast fish reproduce (logistic growth): fast when the pond is half full, slow when it is nearly empty or nearly full. Maximum sustainable catch is growth × capacity ÷ 4 per season.',
    },
    unit: { fr: 'par saison', en: 'per season' },
    min: 0,
    max: 1,
    step: 0.05,
    status: 'a-sourcer',
    note: {
      fr: 'La croissance logistique est le modèle standard des ressources halieutiques (modèle de Schaefer) ; la valeur choisie est une hypothèse.',
      en: 'Logistic growth is the standard model for fish stocks (Schaefer model); the chosen value is an assumption.',
    },
  },
  maxCatch: {
    group: 'environment',
    label: { fr: 'Pêche maximale', en: 'Maximum catch' },
    help: {
      fr: 'Ce que pêche en une saison un villageois qui ne se modère pas du tout. Un poisson vaut une unité de nourriture.',
      en: 'What a villager who shows no restraint at all catches in one season. One fish is worth one unit of food.',
    },
    unit: PER_SEASON,
    min: 0,
    max: 30,
    step: 0.5,
    status: 'hypothese',
  },
  maxCatchableShare: {
    group: 'environment',
    label: { fr: 'Part pêchable par saison', en: 'Catchable share per season' },
    help: {
      fr: 'Part maximale du stock que le village peut pêcher en une saison. Si tout le monde veut plus, chacun reçoit au prorata de ce qu’il voulait.',
      en: 'Maximum share of the stock the village can catch in one season. If everyone wants more, each gets a share proportional to what they wanted.',
    },
    unit: FRACTION,
    min: 0,
    max: 1,
    step: 0.05,
    status: 'hypothese',
  },
  pondRestock: {
    group: 'environment',
    label: { fr: 'Poissons venus de la rivière', en: 'Fish from the river' },
    help: {
      fr: 'Poissons qui arrivent chaque saison de l’extérieur, en fraction de la capacité. Sans eux, un étang vidé ne pourrait jamais renaître, même si plus personne ne pêche.',
      en: 'Fish arriving from outside every season, as a fraction of capacity. Without them, an emptied pond could never recover, even if nobody fished any more.',
    },
    unit: FRACTION,
    min: 0,
    max: 0.1,
    step: 0.001,
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
    status: 'a-sourcer',
    note: {
      fr: 'Fischbacher, Gächter et Fehr (2001) observent que la plupart des participants contribuent en fonction des autres, mais un peu moins qu’eux (biais intéressé). Valeur à vérifier.',
      en: 'Fischbacher, Gächter and Fehr (2001) find that most participants contribute according to others, but a little less (self-serving bias). Value to be checked.',
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
      fr: 'Autorise un villageois à payer pour faire perdre de la nourriture à un autre qui contribue nettement moins que la moyenne au grenier. Les sanctions ne portent pas sur la pêche.',
      en: 'Allows a villager to pay to make another one, who contributes clearly less than average to the granary, lose food. Sanctions do not apply to fishing.',
    },
    status: 'hypothese',
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
    status: 'a-sourcer',
    note: {
      fr: 'Le rapport 1 pour 3 entre coût et perte vient des expériences de Fehr et Gächter (2000, 2002). À vérifier.',
      en: 'The 1-to-3 ratio between cost and fine comes from Fehr and Gächter’s experiments (2000, 2002). To be checked.',
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
    status: 'a-sourcer',
    note: {
      fr: 'Voir le coût d’une sanction.',
      en: 'See cost of a sanction.',
    },
  },
  sanctionGap: {
    group: 'sanctions',
    label: { fr: 'Écart toléré', en: 'Tolerated gap' },
    help: {
      fr: 'On ne peut être sanctionné que si sa part versée au grenier est inférieure à la moyenne d’au moins cet écart (0,1 = 10 points de récolte).',
      en: 'One can only be punished if one’s share given to the granary is below average by at least this gap (0.1 = 10 points of harvest).',
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
      fr: 'Part de la « peur » d’être sanctionné qui reste d’une saison à l’autre. 0,8 : la peur s’estompe de 20 % par saison sans nouvelle sanction.',
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
      fr: 'Chaque année, probabilité qu’un adulte se compare à un autre adulte tiré au hasard, et rapproche sa disposition de la sienne s’il est plus riche que lui. L’influençabilité n’est pas imitée.',
      en: 'Each year, probability that an adult compares themselves with another randomly drawn adult, and moves their disposition towards theirs if they are richer. Susceptibility to influence is not imitated.',
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
};

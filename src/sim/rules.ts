/**
 * Les règles du moteur, dans l'ordre où elles s'exécutent, écrites pour être lues.
 * Ce texte doit décrire exactement src/sim/engine.ts et src/sim/behavior.ts :
 * toute modification du moteur s'accompagne d'une modification ici.
 * Un test vérifie que chaque paramètre apparaît dans au moins une règle.
 */
import type { SimParams } from './params';
import type { Text } from './paramSpec';

export type RulePhase = 'setup' | 'season' | 'year';

export interface Rule {
  id: string;
  phase: RulePhase;
  title: Text;
  text: Text;
  /** Formule en notation lisible ; les noms entre crochets sont des paramètres. */
  formula?: string;
  params: (keyof SimParams)[];
}

export const PHASES: { id: RulePhase; label: Text }[] = [
  { id: 'setup', label: { fr: 'Au lancement', en: 'At launch' } },
  { id: 'season', label: { fr: 'Chaque saison, dans cet ordre', en: 'Every season, in this order' } },
  { id: 'year', label: { fr: 'À la fin de chaque année', en: 'At the end of every year' } },
];

export const RULES: Rule[] = [
  // --- Lancement ---
  {
    id: 'population',
    phase: 'setup',
    title: { fr: 'La population de départ', en: 'The starting population' },
    text: {
      fr: 'Chaque villageois reçoit deux traits, selon la composition choisie (tous pareils, deux groupes, ou un mélange tiré au hasard autour d’une moyenne). Sa disposition va de 0 (tout pour soi, I) à 1 (tout pour le groupe, Us) : c’est ce qu’il ferait s’il ne regardait personne. Son influençabilité va de 0 (il ne regarde pas les autres) à 1 (il règle entièrement sa conduite sur eux). Son âge est tiré au hasard entre l’âge adulte et l’âge maximal de départ, et il reçoit la réserve de départ. Il tire aussi son âge de mort, jamais avant l’âge adulte. Hypothèse de départ : chacun croit que les autres lui ressemblent (sa croyance initiale sur les autres est égale à sa propre disposition).',
      en: 'Each villager gets two traits, according to the chosen composition (all alike, two groups, or a random mix around an average). Their disposition goes from 0 (all for oneself, I) to 1 (all for the group, Us): what they would do if they watched nobody. Their susceptibility to influence goes from 0 (ignores others) to 1 (fully adjusts to them). Their age is drawn at random between adulthood and the maximum starting age, and they get the starting reserve. They also draw their age of death, never before adulthood. Starting assumption: everyone believes others are like them (their initial belief about others equals their own disposition).',
    },
    formula: 'âge ~ uniforme([adultAge], [initialMaxAge]) ; âge de mort = max([adultAge], normale([lifeExpectancy], [lifeExpectancySd])) ; croyances = disposition',
    params: ['adultAge', 'initialMaxAge', 'startingWealth', 'lifeExpectancy', 'lifeExpectancySd'],
  },
  {
    id: 'player',
    phase: 'setup',
    title: { fr: 'Le villageois du joueur', en: 'The player’s villager' },
    text: {
      fr: 'S’il est inclus, il remplace le premier villageois. Il arrive jeune adulte, au début de l’âge fertile, avec la disposition et l’influençabilité issues de l’intro (sa réciprocité mesure son influençabilité). Ses descendants sont marqués pour qu’on puisse suivre sa lignée.',
      en: 'If included, they replace the first villager. They arrive as a young adult, at the start of fertile age, with the disposition and susceptibility to influence measured in the intro (their reciprocity measures their susceptibility). Their descendants are marked so their lineage can be followed.',
    },
    params: ['fertileAgeMin'],
  },
  {
    id: 'pond-setup',
    phase: 'setup',
    title: { fr: 'L’étang', en: 'The pond' },
    text: {
      fr: 'L’étang commence plein. Sa capacité est fixée au lancement selon la taille du village de départ, et ne change plus ensuite, même si la population grandit.',
      en: 'The pond starts full. Its capacity is set at launch from the size of the starting village, and never changes afterwards, even if the population grows.',
    },
    formula: 'capacité = [pondCapacityPerVillager] × taille de départ',
    params: ['pondCapacityPerVillager'],
  },

  // --- Saison ---
  {
    id: 'harvest',
    phase: 'season',
    title: { fr: '1. La récolte', en: '1. The harvest' },
    text: {
      fr: 'Chaque adulte récolte. S’il y a plus d’adultes que de places dans les champs, la récolte de chacun baisse en proportion. Une part de hasard s’y ajoute. Les enfants ne récoltent pas.',
      en: 'Every adult harvests. If there are more adults than places in the fields, everyone’s harvest drops proportionally. Some randomness is added. Children do not harvest.',
    },
    formula: 'récolte = max(0, [baseHarvest] × min(1, [farmlandCapacity] ÷ adultes) × (1 + normale(0, [harvestNoise])))',
    params: ['baseHarvest', 'farmlandCapacity', 'harvestNoise'],
  },
  {
    id: 'share',
    phase: 'season',
    title: { fr: '2. Combien verser au grenier', en: '2. How much to give to the granary' },
    text: {
      fr: 'C’est le cœur du modèle. Le villageois mélange ce qu’il ferait seul (sa disposition) et ce qu’il croit que font les autres, un peu moins qu’eux (coopération conditionnelle). Son influençabilité dose le mélange : à 0 il ne suit que sa disposition, à 1 il ne fait que suivre les autres. À influençabilité égale, plus de disposition donne toujours au moins autant. S’il a été sanctionné récemment, la peur le pousse à s’aligner sur ce que font les autres. Enfin, une petite part d’imprévisibilité s’ajoute.',
      en: 'This is the heart of the model. The villager mixes what they would do alone (their disposition) and what they believe others do, a little less than them (conditional cooperation). Their susceptibility to influence sets the mix: at 0 they only follow their disposition, at 1 they only follow others. For equal susceptibility, a higher disposition always gives at least as much. If recently punished, fear pushes them to align with what others do. Finally, a little unpredictability is added.',
    },
    formula:
      'base = (1 − influençabilité) × disposition + influençabilité × [conditionalSlope] × croyance ; peur = min(1, mémoire des sanctions ÷ [fearSaturation]) ; part = base + max(0, croyance − base) × peur + normale(0, [behaviorNoise]), bornée entre 0 et 1',
    params: ['conditionalSlope', 'fearSaturation', 'behaviorNoise'],
  },
  {
    id: 'granary',
    phase: 'season',
    title: { fr: '3. Le grenier commun', en: '3. The common granary' },
    text: {
      fr: 'Tout ce qui a été versé est multiplié, puis réparti à parts égales entre tous les adultes, qu’ils aient versé ou non. C’est là que naît le passager clandestin : celui qui ne verse rien reçoit autant que les autres.',
      en: 'Everything given is multiplied, then shared equally among all adults, whether they contributed or not. This is where the free rider is born: whoever gives nothing receives as much as the others.',
    },
    formula: 'chacun reçoit = [granaryMultiplier] × total versé ÷ adultes ; réserve += récolte − versement + reçu',
    params: ['granaryMultiplier'],
  },
  {
    id: 'fishing',
    phase: 'season',
    title: { fr: '4. La pêche', en: '4. Fishing' },
    text: {
      fr: 'Chaque adulte décide de sa modération selon la même logique que le grenier : sa disposition, ce qu’il croit de la modération des autres, et son influençabilité pour doser les deux. Il veut pêcher d’autant plus qu’il se modère peu. Si le village veut plus que ce que l’étang permet en une saison, chacun reçoit au prorata.',
      en: 'Each adult decides how much restraint to show with the same logic as the granary: their disposition, what they believe about others’ restraint, and their susceptibility to influence to weigh the two. The less restraint, the more they want to fish. If the village wants more than the pond allows in a season, each gets a proportional share.',
    },
    formula:
      'modération = (1 − influençabilité) × disposition + influençabilité × [conditionalSlope] × croyance sur la modération + normale(0, [behaviorNoise]) ; envie = [maxCatch] × (1 − modération) ; si Σ envies > stock × [maxCatchableShare], chacun reçoit envie × (stock × [maxCatchableShare]) ÷ Σ envies',
    params: ['maxCatch', 'maxCatchableShare', 'conditionalSlope', 'behaviorNoise'],
  },
  {
    id: 'sanctions',
    phase: 'season',
    title: { fr: '5. Les sanctions (si elles sont autorisées)', en: '5. Sanctions (if allowed)' },
    text: {
      fr: 'Peuvent être sanctionnés les adultes qui ont versé nettement moins que la moyenne. Chaque adulte qui a de quoi payer peut, avec une probabilité qui grandit avec sa disposition, sanctionner l’un d’eux tiré au hasard (au plus un par saison). Il paie un coût, l’autre perd davantage. Simplification : personne ne sanctionne les généreux, alors que les expériences observent aussi ce comportement.',
      en: 'Adults who gave clearly less than average can be punished. Each adult who can afford it may, with a probability that grows with their disposition, punish one of them drawn at random (at most one per season). They pay a cost, the other loses more. Simplification: nobody punishes generous people, although experiments also observe this behaviour.',
    },
    formula:
      'cibles = adultes dont part < moyenne − [sanctionGap] ; probabilité de sanctionner = disposition × [sanctionPropensity] ; sanctionneur −[sanctionCost], sanctionné −[sanctionFine]',
    params: ['sanctionsEnabled', 'sanctionGap', 'sanctionPropensity', 'sanctionCost', 'sanctionFine'],
  },
  {
    id: 'meals',
    phase: 'season',
    title: { fr: '6. Les repas', en: '6. Meals' },
    text: {
      fr: 'Chaque adulte mange sur sa réserve. Chaque enfant mange sur la réserve de son parent si celui-ci est vivant, adulte et en a les moyens, sinon sur la sienne. Une réserve qui passe sous zéro est ramenée à zéro (pas de dette) et compte comme une saison de faim ; une saison sans faim remet le compteur à zéro.',
      en: 'Each adult eats from their reserve. Each child eats from their parent’s reserve if the parent is alive, adult and can afford it, otherwise from their own. A reserve falling below zero is reset to zero (no debt) and counts as a hungry season; a season without hunger resets the counter.',
    },
    formula: 'adulte : réserve −= [consumption] ; enfant : réserve du parent (ou la sienne) −= [childConsumption]',
    params: ['consumption', 'childConsumption'],
  },
  {
    id: 'beliefs',
    phase: 'season',
    title: { fr: '7. Ce qu’on croit des autres', en: '7. What we believe about others' },
    text: {
      fr: 'Chaque adulte révise ce qu’il croit de la générosité des autres au grenier et de leur modération à l’étang, à partir de la moyenne de ce qu’ils viennent de faire. À l’étang, chacun voit l’effort des autres (combien ils voulaient pêcher), pas seulement leur prise.',
      en: 'Each adult updates what they believe about others’ generosity at the granary and their restraint at the pond, from the average of what others just did. At the pond, everyone sees others’ effort (how much they wanted to fish), not just their catch.',
    },
    formula: 'croyance = (1 − [beliefLearningRate]) × croyance + [beliefLearningRate] × moyenne des autres',
    params: ['beliefLearningRate'],
  },
  {
    id: 'fear',
    phase: 'season',
    title: { fr: '8. La mémoire des sanctions', en: '8. Memory of sanctions' },
    text: {
      fr: 'La peur d’être sanctionné s’estompe avec le temps et grandit avec chaque sanction reçue.',
      en: 'The fear of being punished fades over time and grows with every sanction received.',
    },
    formula: 'mémoire = mémoire × [fearDecay] + sanctions reçues × [sanctionFine]',
    params: ['fearDecay', 'sanctionFine'],
  },
  {
    id: 'pond-growth',
    phase: 'season',
    title: { fr: '9. L’étang se repeuple', en: '9. The pond restocks' },
    text: {
      fr: 'Les poissons se reproduisent selon une croissance logistique, et quelques poissons arrivent de la rivière. Un étang très bas se repeuple très lentement.',
      en: 'Fish reproduce following logistic growth, and a few fish arrive from the river. A very low pond restocks very slowly.',
    },
    formula: 'stock = min(capacité, stock + [pondGrowth] × stock × (1 − stock ÷ capacité) + [pondRestock] × capacité)',
    params: ['pondGrowth', 'pondRestock'],
  },
  {
    id: 'death',
    phase: 'season',
    title: { fr: '10. Vieillir et mourir', en: '10. Ageing and dying' },
    text: {
      fr: 'Tout le monde vieillit d’une saison. On meurt de faim après trop de saisons de faim consécutives, ou de vieillesse à l’âge tiré à la naissance. La réserve d’un mort est partagée à parts égales entre ses enfants vivants ; s’il n’en a pas, elle est perdue.',
      en: 'Everyone ages by one season. One dies of hunger after too many consecutive hungry seasons, or of old age at the age drawn at birth. A dead villager’s reserve is shared equally among their living children; if they have none, it is lost.',
    },
    formula: 'mort si saisons de faim ≥ [starvationSeasons] ou âge ≥ âge de mort ; une année = [seasonsPerYear] saisons',
    params: ['starvationSeasons', 'seasonsPerYear'],
  },

  // --- Année ---
  {
    id: 'births',
    phase: 'year',
    title: { fr: 'Les naissances', en: 'Births' },
    text: {
      fr: 'Un adulte en âge fertile et assez riche a une chance d’avoir un enfant. L’enfant reçoit la disposition et l’influençabilité de son parent, chacune avec une petite variation, et une dot prise sur la réserve du parent. Simplification : un enfant n’a qu’un parent.',
      en: 'A fertile and wealthy enough adult has a chance of having a child. The child receives their parent’s disposition and susceptibility to influence, each with a small variation, and an endowment taken from the parent’s reserve. Simplification: a child has only one parent.',
    },
    formula:
      'si [fertileAgeMin] ≤ âge ≤ [fertileAgeMax] et réserve ≥ [birthWealthThreshold] : probabilité [birthProbability] ; trait de l’enfant = trait du parent + normale(0, [inheritanceNoise]), pour la disposition comme pour l’influençabilité ; dot = [birthEndowment]',
    params: ['fertileAgeMin', 'fertileAgeMax', 'birthWealthThreshold', 'birthProbability', 'inheritanceNoise', 'birthEndowment'],
  },
  {
    id: 'imitation',
    phase: 'year',
    title: { fr: 'L’imitation', en: 'Imitation' },
    text: {
      fr: 'Un adulte peut se comparer à un autre adulte tiré au hasard. Si l’autre est plus riche, il rapproche sa disposition de la sienne. C’est le seul moyen pour une disposition de changer au cours d’une vie ; l’influençabilité, elle, reste fixe. Ce mécanisme imite la réussite, pas la vertu : si les profiteurs s’enrichissent, on les imite.',
      en: 'An adult may compare themselves with another randomly drawn adult. If the other is richer, they move their disposition towards theirs. This is the only way a disposition changes during a lifetime; susceptibility to influence stays fixed. This mechanism imitates success, not virtue: if free riders get rich, they are imitated.',
    },
    formula: 'avec probabilité [imitationProbability] : si le modèle est plus riche, disposition += [imitationRate] × (disposition du modèle − disposition)',
    params: ['imitationProbability', 'imitationRate'],
  },
  {
    id: 'indicators',
    phase: 'year',
    title: { fr: 'Les indicateurs', en: 'Indicators' },
    text: {
      fr: 'Mesurés à la fin de chaque saison, sans effet sur la simulation. Les inégalités sont mesurées par l’indice de Gini des réserves des adultes : 0 si tout le monde a la même chose, proche de 1 si une seule personne a presque tout. L’étang est dit épuisé sous un seuil de sa capacité.',
      en: 'Measured at the end of every season, with no effect on the simulation. Inequality is measured by the Gini index of adults’ reserves: 0 if everyone has the same, close to 1 if one person has almost everything. The pond is called depleted below a threshold of its capacity.',
    },
    formula: 'étang épuisé si stock < [pondDepletedThreshold] × capacité',
    params: ['pondDepletedThreshold'],
  },
];

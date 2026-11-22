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
      fr: 'Chaque villageois reçoit deux traits, selon la composition choisie (tous pareils, deux profils de départ, ou un mélange tiré au hasard autour d’une moyenne ; les « profils » ne sont pas des groupes : personne ne sait à quel profil appartient l’autre, et les profils se mélangent dès la première génération). Sa disposition va de 0 (tout pour soi, I) à 1 (tout pour le groupe, Us) : c’est ce qu’il ferait s’il ne regardait personne. Son influençabilité va de 0 (il ne regarde pas les autres) à 1 (il règle entièrement sa conduite sur eux). Son âge est tiré au hasard entre l’âge adulte et l’âge maximal de départ, et il reçoit la réserve de départ. Il tire aussi son âge de mort, jamais avant l’âge adulte. Hypothèse de départ : chacun croit que les autres lui ressemblent (sa croyance initiale sur les autres est égale à sa propre disposition).',
      en: 'Each villager gets two traits, according to the chosen composition (all alike, two starting profiles, or a random mix around an average; “profiles” are not groups: nobody knows which profile anyone else belongs to, and profiles blend from the first generation). Their disposition goes from 0 (all for oneself, I) to 1 (all for the group, Us): what they would do if they watched nobody. Their susceptibility to influence goes from 0 (ignores others) to 1 (fully adjusts to them). Their age is drawn at random between adulthood and the maximum starting age, and they get the starting reserve. They also draw their age of death, never before adulthood. Starting assumption: everyone believes others are like them (their initial belief about others equals their own disposition).',
    },
    formula: 'âge ~ uniforme([adultAge], [initialMaxAge]) ; âge de mort = max([adultAge], normale([lifeExpectancy], [lifeExpectancySd])) ; croyances = disposition',
    params: ['adultAge', 'initialMaxAge', 'startingWealth', 'lifeExpectancy', 'lifeExpectancySd'],
  },
  {
    id: 'player',
    phase: 'setup',
    title: { fr: 'Le villageois du joueur', en: 'The player’s villager' },
    text: {
      fr: 'Deux façons de l’inclure. En observateur, il remplace le premier villageois : il arrive jeune adulte, au début de l’âge fertile, avec la disposition et l’influençabilité issues de l’intro (sa réciprocité mesure son influençabilité), et suit ensuite la règle commune. Quand le joueur vit sa vie, il naît à part : enfant d’un villageois de départ assez âgé pour l’avoir eu en âge fertile, il commence à un âge choisi, avec la dot de naissance comme réserve et les traits de son parent, à une petite variation près. Ses choix remplacent alors la règle commune (voir les étapes 2, 4 et 5, et les naissances). Ses traits ne décident plus de rien pour lui : ils sont tenus à jour à partir de ce qu’il fait réellement, et ce sont eux que ses enfants héritent et que les autres imitent. Ses choix sont inscrits dans un journal : la graine, les réglages et le journal redonnent exactement la même vie. Dans les deux cas, ses descendants sont marqués pour qu’on puisse suivre sa lignée.',
      en: 'Two ways to include them. As an observer, they replace the first villager: they arrive as a young adult, at the start of fertile age, with the disposition and susceptibility to influence measured in the intro (their reciprocity measures their susceptibility), then follow the common rule. When the player lives their life, they are born separately: as the child of a starting villager old enough to have had them while fertile, they start at a chosen age, with the birth endowment as their reserve and their parent’s traits, give or take a small variation. Their choices then replace the common rule (see steps 2, 4 and 5, and births). Their traits no longer decide anything for them: they are kept up to date from what they actually do, and they are what their children inherit and what others imitate. Their choices are written to a journal: seed, settings and journal give back exactly the same life. In both cases, their descendants are marked so their lineage can be followed.',
    },
    formula:
      'vie jouée : âge de départ = [playerStartAge] ; parent tiré parmi les villageois âgés de [fertileAgeMin] + [playerStartAge] à [fertileAgeMax] + [playerStartAge] (sinon le plus âgé) ; réserve = [birthEndowment] ; disposition = moyenne, sur ses saisons adultes, de (part versée + modération) ÷ 2 ; influençabilité = part de ses choix « comme mes voisins »',
    params: ['fertileAgeMin', 'fertileAgeMax', 'playerStartAge', 'birthEndowment'],
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
      fr: 'Chaque adulte récolte. S’il y a plus d’adultes que de places dans les champs, la récolte de chacun baisse en proportion. Une part de hasard s’y ajoute. Les enfants ne récoltent pas. Si les sécheresses sont activées, une sécheresse peut commencer au début de chaque année, sauf pendant une sécheresse ; elle dure quelques saisons, pendant lesquelles les champs de tous donnent moins. Personne ne sait d’avance quand elle viendra ni combien de temps elle durera.',
      en: 'Every adult harvests. If there are more adults than places in the fields, everyone’s harvest drops proportionally. Some randomness is added. Children do not harvest. If droughts are enabled, a drought may start at the beginning of each year, except during a drought; it lasts a few seasons, during which everyone’s fields yield less. Nobody knows in advance when it will come or how long it will last.',
    },
    formula:
      'sécheresse : au début de chaque année, avec probabilité [droughtProbability], pour [droughtSeasons] saisons ; récolte = max(0, [baseHarvest] × min(1, [farmlandCapacity] ÷ adultes) × (1 − [droughtSeverity] pendant une sécheresse) × (1 + normale(0, [harvestNoise])))',
    params: ['baseHarvest', 'farmlandCapacity', 'harvestNoise', 'droughtProbability', 'droughtSeasons', 'droughtSeverity'],
  },
  {
    id: 'share',
    phase: 'season',
    title: { fr: '2. Combien verser au grenier', en: '2. How much to give to the granary' },
    text: {
      fr: 'C’est le cœur du modèle. Le villageois mélange ce qu’il ferait seul (sa disposition) et ce qu’il croit que font les autres, un peu moins qu’eux (coopération conditionnelle). Son influençabilité dose le mélange : à 0 il ne suit que sa disposition, à 1 il ne fait que suivre les autres. À influençabilité égale, plus de disposition donne toujours au moins autant. S’il a été sanctionné récemment, la peur le pousse à s’aligner sur ce que font les autres. Enfin, une petite part d’imprévisibilité s’ajoute. Quand le joueur vit sa vie, son villageois ne suit pas cette règle : il verse la part de sa ligne de conduite, ou, s’il a choisi de faire comme ses voisins, ce qu’il croit qu’ils versent, sans imprévisibilité ni peur.',
      en: 'This is the heart of the model. The villager mixes what they would do alone (their disposition) and what they believe others do, a little less than them (conditional cooperation). Their susceptibility to influence sets the mix: at 0 they only follow their disposition, at 1 they only follow others. For equal susceptibility, a higher disposition always gives at least as much. If recently punished, fear pushes them to align with what others do. Finally, a little unpredictability is added. When the player lives their life, their villager does not follow this rule: they give the share of their line of conduct, or, if they chose to do as their neighbours do, what they believe their neighbours give, with no unpredictability and no fear.',
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
      fr: 'Chaque adulte décide de sa modération selon la même logique que le grenier : sa disposition, ce qu’il croit de la modération des autres, et son influençabilité pour doser les deux ; la peur des sanctions contre la surpêche le pousse à s’aligner. Son effort de pêche vaut 1 − modération. Sa prise est proportionnelle à son effort et au stock (modèle de Schaefer) : moins il reste de poissons, plus il faut d’effort pour en attraper un. On ne peut jamais pêcher plus que le stock. Le villageois du joueur, quand il vit sa vie, prend la modération de sa ligne de conduite, de la même façon qu’au grenier.',
      en: 'Each adult decides how much restraint to show with the same logic as the granary: their disposition, what they believe about others’ restraint, and their susceptibility to influence to weigh the two; fear of sanctions against overfishing pushes them to align. Their fishing effort is 1 − restraint. Their catch is proportional to their effort and to the stock (Schaefer model): the fewer fish remain, the more effort it takes to catch one. One can never catch more than the stock. The player’s villager, when living their life, takes the restraint of their line of conduct, as at the granary.',
    },
    formula:
      'modération = (1 − influençabilité) × disposition + influençabilité × [conditionalSlope] × croyance sur la modération, puis alignement par la peur ([fearSaturation]) + normale(0, [behaviorNoise]) ; prise = [maxCatch] × (1 − modération) × stock ÷ capacité',
    params: ['maxCatch', 'conditionalSlope', 'fearSaturation', 'behaviorNoise'],
  },
  {
    id: 'sanctions',
    phase: 'season',
    title: { fr: '5. Les sanctions (si elles sont autorisées)', en: '5. Sanctions (if allowed)' },
    text: {
      fr: 'Deux domaines, autorisés séparément : le grenier (ceux qui ont versé nettement moins que la moyenne) et la pêche (ceux dont la modération est nettement inférieure à la moyenne). Dans chaque domaine, chaque adulte qui a de quoi payer est prêt, avec une probabilité qui grandit avec sa disposition, à sanctionner l’un des fautifs (au plus un par domaine et par saison). Les sanctions sont graduées : un fautif reçoit au plus une amende par tranche d’écart toléré sous la moyenne, si bien que la peine grandit avec la faute et non avec la taille du village. Les fautifs se partagent les sanctionneurs prêts, chacun tiré au hasard. Le sanctionneur paie un coût, l’autre perd davantage. Un sanctionneur peut lui-même être ciblé. Les sanctions ont lieu après la récolte et la pêche, avant les repas : une amende peut donc faire basculer quelqu’un dans la faim (sa réserve est ramenée à zéro, il n’y a pas de dette). Elles ne changent le comportement que par la peur (étapes 2, 4 et 8). Limite assumée : personne ne sanctionne les généreux, alors que les expériences observent aussi ce comportement. Quand le joueur vit sa vie, son villageois ne sanctionne jamais de lui-même ; il peut vouloir sanctionner un villageois précis, au plus une fois par domaine et par saison. Sa sanction passe avant celles des autres, aux mêmes conditions : la cible doit être nettement sous la moyenne cette saison-là et ne pas avoir reçu toutes ses amendes, et il doit avoir de quoi payer. Sinon, elle n’a pas lieu.',
      en: 'Two domains, allowed separately: the granary (those who gave clearly less than average) and fishing (those whose restraint is clearly below average). In each domain, each adult who can afford it is willing, with a probability that grows with their disposition, to punish one of the offenders (at most one per domain and per season). Sanctions are graduated: an offender receives at most one fine per step of tolerated gap below average, so the penalty grows with the offence, not with the size of the village. Offenders share the willing punishers, each drawn at random. The punisher pays a cost, the other loses more. A punisher can be targeted by someone else. Sanctions happen after harvest and fishing, before meals: a fine can therefore push someone into hunger (their reserve is reset to zero, there is no debt). They change behaviour only through fear (steps 2, 4 and 8). Accepted limit: nobody punishes generous people, although experiments also observe this behaviour. When the player lives their life, their villager never punishes on their own; they may want to punish one specific villager, at most once per domain and per season. Their sanction comes before the others’, under the same conditions: the target must be clearly below average that season and not have received all their fines, and the player must be able to pay. Otherwise it does not happen.',
    },
    formula:
      'grenier si [sanctionsEnabled], pêche si [pondSanctionsEnabled] : cibles = adultes dont la coopération < moyenne − [sanctionGap] ; probabilité d’être prêt à sanctionner = disposition × [sanctionPropensity] ; amendes au plus = partie entière((moyenne − coopération) ÷ [sanctionGap]) par cible ; pour chaque amende : sanctionneur −[sanctionCost], sanctionné −[sanctionFine]',
    params: ['sanctionsEnabled', 'pondSanctionsEnabled', 'sanctionGap', 'sanctionPropensity', 'sanctionCost', 'sanctionFine'],
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
      fr: 'Chaque adulte révise ce qu’il croit de la générosité des autres au grenier et de leur modération à l’étang, à partir de la moyenne de ce qu’ils viennent de faire. À l’étang, chacun voit l’effort des autres (combien ils voulaient pêcher), pas seulement leur prise. Par défaut, chacun voit tout le village. Si le nombre de voisins observés est réglé au-dessus de zéro, chacun ne voit que ses voisins : les plus proches sur l’anneau des maisons, alternativement d’un côté et de l’autre. Les villageois y sont rangés par maison, et un enfant prend la maison de son parent : il s’installe à côté de lui.',
      en: 'Each adult updates what they believe about others’ generosity at the granary and their restraint at the pond, from the average of what others just did. At the pond, everyone sees others’ effort (how much they wanted to fish), not just their catch. By default, everyone sees the whole village. If the number of observed neighbours is set above zero, each villager only sees their neighbours: the closest on the ring of houses, alternately on either side. Villagers are ordered by house there, and a child takes their parent’s house: they settle next to them.',
    },
    formula:
      'croyance = (1 − [beliefLearningRate]) × croyance + [beliefLearningRate] × moyenne des autres ; « les autres » = tout le village si [observedNeighbors] = 0 (ou plus grand que le village), sinon ses [observedNeighbors] voisins',
    params: ['beliefLearningRate', 'observedNeighbors'],
  },
  {
    id: 'fear',
    phase: 'season',
    title: { fr: '8. La mémoire des sanctions', en: '8. Memory of sanctions' },
    text: {
      fr: 'La peur d’être sanctionné s’estompe avec le temps et grandit avec chaque sanction reçue. Il y a deux peurs distinctes : une pour le grenier, une pour la pêche.',
      en: 'The fear of being punished fades over time and grows with every sanction received. There are two separate fears: one for the granary, one for fishing.',
    },
    formula: 'pour chaque domaine : mémoire = mémoire × [fearDecay] + sanctions reçues dans ce domaine × [sanctionFine]',
    params: ['fearDecay', 'sanctionFine'],
  },
  {
    id: 'pond-growth',
    phase: 'season',
    title: { fr: '9. L’étang se repeuple', en: '9. The pond restocks' },
    text: {
      fr: 'Les poissons se reproduisent selon une croissance logistique. Un étang très bas se repeuple lentement, mais il se repeuple si l’on pêche peu, puisque la prise baisse avec le stock.',
      en: 'Fish reproduce following logistic growth. A very low pond restocks slowly, but it does restock if fishing is light, since the catch falls with the stock.',
    },
    formula: 'stock = min(capacité, stock + [pondGrowth] × stock × (1 − stock ÷ capacité))',
    params: ['pondGrowth'],
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
      fr: 'Un adulte en âge fertile et assez riche a une chance d’avoir un enfant. L’enfant reçoit la disposition et l’influençabilité de son parent, chacune avec une petite variation, et une dot prise sur la réserve du parent. Simplification : un enfant n’a qu’un parent. Quand le joueur vit sa vie, il peut refuser d’avoir des enfants ; s’il les accepte, la même règle s’applique à lui, sans pouvoir en forcer un.',
      en: 'A fertile and wealthy enough adult has a chance of having a child. The child receives their parent’s disposition and susceptibility to influence, each with a small variation, and an endowment taken from the parent’s reserve. Simplification: a child has only one parent. When the player lives their life, they can refuse to have children; if they accept, the same rule applies to them, and they cannot force one.',
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
      fr: 'Un adulte peut se comparer à un autre adulte tiré au hasard. Si l’autre a gagné plus que lui cette année, il rapproche sa disposition de la sienne. On compare ce que chacun gagne, pas ce qu’il a amassé, qui dépend surtout de l’âge et de l’héritage. C’est le seul moyen pour une disposition de changer au cours d’une vie ; l’influençabilité, elle, reste fixe. Ce mécanisme imite la réussite, pas la vertu : si les profiteurs gagnent plus, on les imite. Le villageois du joueur, quand il vit sa vie, n’imite personne, puisqu’il décide lui-même ; les autres peuvent l’imiter.',
      en: 'An adult may compare themselves with another randomly drawn adult. If the other earned more than them this year, they move their disposition towards theirs. What each earns is compared, not what they have amassed, which mostly depends on age and inheritance. This is the only way a disposition changes during a lifetime; susceptibility to influence stays fixed. This mechanism imitates success, not virtue: if free riders earn more, they are imitated. The player’s villager, when living their life, imitates no one, since they decide for themselves; others may imitate them.',
    },
    formula: 'revenu = revenus de l’année (récolte gardée + part du grenier + pêche − sanctions) ÷ saisons passées adulte ; avec probabilité [imitationProbability] : si revenu du modèle > le sien, disposition += [imitationRate] × (disposition du modèle − disposition) ; puis les revenus de l’année repartent de zéro',
    params: ['imitationProbability', 'imitationRate'],
  },
  {
    id: 'indicators',
    phase: 'year',
    title: { fr: 'Les indicateurs', en: 'Indicators' },
    text: {
      fr: 'Mesurés à la fin de chaque saison, sans effet sur la simulation. Deux mesures d’inégalités par l’indice de Gini (0 : tout le monde pareil ; proche de 1 : une personne a presque tout). Les inégalités de revenu portent sur ce que chaque adulte a gagné dans la saison : elles reflètent les comportements. Les inégalités de patrimoine portent sur les réserves accumulées : elles reflètent surtout l’âge et l’héritage, même dans un village de villageois identiques (Gini d’environ 0,6), car la nourriture ne se perd pas. La répartition des dispositions est mesurée par tranches de 0,1. L’étang est dit épuisé sous un seuil de sa capacité.',
      en: 'Measured at the end of every season, with no effect on the simulation. Two inequality measures using the Gini index (0: everyone alike; close to 1: one person has almost everything). Income inequality covers what each adult earned during the season: it reflects behaviour. Wealth inequality covers accumulated reserves: it mostly reflects age and inheritance, even in a village of identical villagers (Gini around 0.6), because food never spoils. The distribution of dispositions is measured in bands of 0.1. The pond is called depleted below a threshold of its capacity.',
    },
    formula: 'étang épuisé si stock < [pondDepletedThreshold] × capacité',
    params: ['pondDepletedThreshold'],
  },
];

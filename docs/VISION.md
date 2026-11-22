# I or Us — Vision

Ce document décrit le jeu complet tel qu'on l'imagine à long terme. Il sert de boussole : la première version (voir [SPEC-v1.md](SPEC-v1.md)) n'en réalise qu'une petite partie.

## L'intention

I or Us est une fable philosophique jouable dans le navigateur. Elle explore une tension que chacun porte en soi : l'élan de se préserver soi-même (I) et l'élan de préserver le groupe (Us).

Le joueur règle ce mélange dans une population, lance le temps, et observe ce qui en émerge : richesse, inégalités, état de la nature, règles collectives.

Le jeu cherche à faire réfléchir, jamais à convaincre.

- Aucune étiquette politique dans le jeu. Les personnages ont des comportements (garder, partager, tricher, sanctionner, surexploiter), pas des opinions. Le lien avec la politique, le joueur le fait lui-même.
- Pas de victoire ni de défaite. Seulement des conséquences visibles.
- À la fin d'une partie, des questions plutôt qu'une morale.
- Aucun argument d'autorité. Les règles du moteur s'appuient sur des observations réelles du comportement humain, et ces sources sont consultables par le joueur curieux, mais jamais brandies.

## La grille de lecture (en coulisse)

Chaque individu porte deux élans contradictoires : se préserver soi (I) et préserver le groupe (Us). Leur dosage varie d'un individu à l'autre.

Le moteur traduit ce dosage en une **disposition** de départ. Le comportement réel s'ajuste ensuite à ce que l'individu voit autour de lui, car la recherche montre que la plupart des gens sont des **coopérateurs conditionnels** : ils coopèrent tant que les autres coopèrent. C'est précisément ce qui rend le passager clandestin si destructeur : il fait basculer les conditionnels.

## Trois échelles

La même règle de base (je garde ou je partage) se joue à trois échelles. Plus tard, la caméra permettra de zoomer de l'une à l'autre.

1. **Interpersonnel** : deux personnes face à face (dilemme du prisonnier répété). C'est l'échelle de l'introduction « joue d'abord toi-même ».
2. **Village** : un groupe gère un pot commun et une ressource partagée (jeu des biens publics, tragédie des communs). C'est là qu'apparaît le passager clandestin.
3. **Société** : plusieurs villages, des classes sociales, des institutions et des règles votées.

## Trois systèmes

- **Économie** : production, contribution au pot commun, redistribution, accumulation, héritage, puis émergence de classes.
- **Environnement** : ressources renouvelables qui peuvent s'effondrer (étang, forêt), pollution qui pénalise tout le monde, y compris ceux qui ne polluent pas.
- **Politique** : sanctions informelles (punir un tricheur à ses frais), puis règles votées (impôt, redistribution, quotas, sanctions officielles), dont le résultat dépend du mélange de dispositions dans la population.

## Le temps

- Un curseur de vitesse, de la saison observée en détail à des siècles accélérés.
- Un mode **générations** : les individus naissent, vieillissent et meurent. Les dispositions se transmettent (par les parents et par l'imitation de ceux qui réussissent). On voit si une minorité de profiteurs envahit une population généreuse, ou l'inverse quand existent des sanctions.

## « Joue d'abord toi-même »

Avant de régler la population, le joueur vit quelques petites scènes au village : partager une récolte, pêcher dans l'étang commun, rendre service à un voisin qui ne l'a pas aidé la fois précédente.

Le jeu en tire un portrait **non jugeant** : jamais de score moral ni de pourcentage d'égoïsme. On décrit sa manière de jouer en la situant parmi les stratégies observées dans les populations réelles (« tu as rendu ce qu'on t'a donné, comme environ la moitié des gens dans les expériences »). Toutes les stratégies sont présentées comme des stratégies, pas comme des défauts.

Le joueur devient ensuite un villageois parmi les autres : « voyons ce que donne un village de gens comme toi ».

## Catastrophes et interventions (plus tard)

Le joueur pourra déclencher des événements en cours de partie : sécheresse, épidémie, crise économique, arrivée d'étrangers, découverte d'une ressource. Ils servent à observer la résilience des différents mélanges.

## Un moteur fondé sur des observations

- **Règles sourcées, résultats émergents.** Les règles micro (combien on contribue, comment on réagit aux tricheurs, l'effet des sanctions) sont calibrées sur des études et des méta-analyses. Les résultats macro (classes, effondrement écologique, institutions) ne sont pas programmés : ils émergent de la simulation, et le jeu le dit clairement.
- Un panneau **« Comment ça marche ? »** liste chaque règle, son paramètre et sa source.
- Le moteur doit reproduire des **faits stylisés** connus (par exemple : sans sanction, les contributions au pot commun déclinent au fil des tours ; avec des sanctions possibles, elles se maintiennent). Ces faits servent de tests automatiques.

Pistes de sources, citées de mémoire, **à vérifier une par une** avant d'en tirer un chiffre :

- Fehr & Gächter (2000, 2002) : coopération et punition altruiste dans les jeux de biens publics.
- Fischbacher, Gächter & Fehr (2001) : la majorité des participants sont des coopérateurs conditionnels.
- Herrmann, Thöni & Gächter (2008) : punition antisociale et différences entre sociétés.
- Ledyard (1995), Zelmer (2003) : synthèses et méta-analyse des jeux de biens publics.
- Engel (2011) : méta-analyse du jeu du dictateur.
- Balliet et collègues (2011) : méta-analyse sur les sanctions et la coopération.
- Axelrod (1984) : stratégies du dilemme du prisonnier répété.
- Ostrom (1990) : gestion des communs par les communautés.

## Forme

- Pixel art chaleureux en vue de dessus, dans l'esprit des jeux de village cosy. Graphismes originaux ou packs libres de droits, jamais de reprise des graphismes, personnages ou univers d'un jeu existant.
- Bilingue français / anglais dès le départ.
- Une partie courte (quelques minutes) doit déjà montrer quelque chose ; on peut ensuite rejouer en changeant un seul paramètre pour comparer.

## Feuille de route indicative

1. **v1 — Le village** : intro interpersonnelle, un village, un pot commun, un étang, sanctions informelles activables, générations, bilingue, questions de fin. Voir [SPEC-v1.md](SPEC-v1.md).
2. **v2 — La société** : plusieurs villages, héritage et classes visibles, pollution, vote de règles.
3. **v3 — Le zoom** : passage fluide entre les trois échelles, catastrophes déclenchables, panneau des sources complet.

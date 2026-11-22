# I or Us — Spec v1 « Le village »

Première version jouable. Objectif : savoir si le cœur du jeu est intéressant à regarder avant d'ajouter la société, le zoom et les catastrophes (voir [VISION.md](VISION.md)).

## Périmètre

Dans la v1 :

- Une intro « joue d'abord toi-même » (échelle interpersonnelle).
- Un écran de réglage de la population.
- Un seul village avec un pot commun (le grenier) et une ressource partagée (l'étang).
- Des sanctions informelles activables.
- Les générations, avec un temps accélérable.
- Des questions en fin de partie.
- Le bilingue français / anglais.

Hors v1 : plusieurs villages, classes visibles, pollution, vote de règles, catastrophes, zoom entre échelles, panneau des sources complet (une version simple suffit).

## Parcours du joueur

1. **Écran titre** : I or Us, choix de langue (détectée depuis le navigateur, modifiable).
2. **Intro « Avant le village »** : environ six petites scènes, trois minutes au total. Un bouton permet de passer l'intro ; on joue alors avec un villageois moyen.
3. **Portrait** : une carte qui décrit la manière de jouer du joueur, sans jugement.
4. **Réglage** : composition de la population et options.
5. **Simulation** : le village vit, le joueur observe et contrôle le temps.
6. **Fin** : courbes récapitulatives, questions ouvertes, « rejouer en changeant un paramètre ».

## L'intro « Avant le village »

Le joueur incarne un nouvel arrivant. Il interagit avec trois villageois qui suivent des stratégies différentes : un généreux constant, un réciproque (il rend ce qu'on lui donne), un profiteur. Le joueur ne connaît pas ces stratégies à l'avance.

Scènes envisagées (contenu exact à écrire) :

- **Partager une récolte** avec un voisin dans le besoin. On mesure la générosité spontanée (jeu du dictateur).
- **Échanges répétés** avec un même voisin, sur trois ou quatre tours. On mesure la réciprocité : est-ce qu'il répond à ce que l'autre a fait (dilemme du prisonnier répété) ?
- **Remplir le grenier commun** avec les trois villageois, sur trois tours, en voyant ce que les autres ont mis. On mesure la contribution et son ajustement aux autres (jeu des biens publics).
- **Pêcher dans l'étang**, sachant que le poisson se renouvelle lentement. On mesure la modération dans un bien commun.
- **Le profiteur a encore pris sans donner** : le joueur peut dépenser un peu pour le sanctionner. On mesure la propension à sanctionner.

Chaque scène est une petite situation narrative avec deux à quatre choix, jamais une question abstraite.

### Le portrait

Le jeu décrit le joueur selon quatre dimensions : générosité spontanée, réciprocité, modération, sanction.

Règles d'écriture :

- Jamais de score moral, de pourcentage d'égoïsme ni de mot péjoratif.
- Chaque trait est situé parmi les comportements observés, par exemple : « Tu as ajusté ta part à celle des autres, comme environ la moitié des gens dans les expériences. » Les chiffres affichés viennent des entrées vérifiées de `src/sources/observed.ts` (voir « Sources » plus bas). Attention : la coopération conditionnelle porte sur un pot commun, pas sur le fait de rendre à quelqu'un ce qu'il a donné.
- Une phrase rappelle que le comportement dépend du contexte et n'est pas une identité figée.
- Ces mesures deviennent les deux traits du villageois du joueur : la générosité spontanée donne sa disposition, la réciprocité son influençabilité.

## Le modèle du village

Cette section donne l'esprit du modèle. Le détail exact (ordre des étapes, formules, valeurs par défaut, statut de chaque paramètre) fait foi dans `src/sim/rules.ts` et `src/sim/paramSpec.ts`, visibles dans le labo ; il n'est pas recopié ici pour ne pas diverger. Les raisons des choix sont dans [docs/decisions/](decisions/README.md).

### Le villageois

| Attribut | Description |
|---|---|
| `disposition` | Entre 0 (tout pour soi, I) et 1 (tout pour le groupe, Us) : ce que le villageois ferait s'il ne regardait personne. Fixée à la naissance, ne bouge ensuite que par imitation. |
| `influence` | Influençabilité, entre 0 (ne regarde pas les autres) et 1 (règle entièrement sa conduite sur eux). Fixée à la naissance. |
| `belief` | Ce que le villageois croit que les autres font (moyenne glissante des contributions observées). |
| `wealth` | Réserve de nourriture. |
| `age`, `parentId` | Pour les générations et les lignées. |
| `isPlayer` | Vrai pour le villageois issu du portrait, puis pour sa descendance. |

### Règle de comportement

Deux traits indépendants décident du comportement. La disposition dit ce que le villageois ferait seul ; l'influençabilité dit à quel point il règle sa conduite sur ce qu'il croit que font les autres.

- La part versée au grenier vaut `share = (1 − influence) × disposition + influence × conditionalSlope × belief`, bornée entre 0 et 1.
- `conditionalSlope` (0,9 par défaut) traduit le biais observé : quand on suit les autres, on rend un peu moins que ce qu'on voit.
- Toutes les combinaisons ont un sens : un égoïste peu influençable est un passager clandestin pur ; un généreux peu influençable est un coopérateur inconditionnel ; un villageois très influençable est un coopérateur conditionnel qui suit le groupe vers le haut comme vers le bas.
- À influençabilité égale, une disposition plus haute ne donne jamais moins (testé villageois par villageois).
- La même logique règle la modération à l'étang.

Ce modèle à deux traits remplace une première version à un seul trait, qui faisait parfois donner davantage à un villageois plus égoïste : voir les décisions [0004](decisions/0004-comportement-a-un-seul-trait.md) et [0005](decisions/0005-deux-traits-disposition-influencabilite.md).

### Le cycle d'une saison (quatre saisons par an)

1. **Travail** : chaque adulte produit une récolte (valeur de base plus un léger aléa).
2. **Grenier** : chacun verse une part de sa récolte au pot commun. Le total est multiplié par `r` (avec 1 < r < nombre de villageois), puis réparti à parts égales entre tous. C'est le dilemme : collectivement on gagne à contribuer, individuellement on gagne à ne pas le faire.
3. **Étang** : chacun pêche avec un effort qui dépend de sa modération ; sa prise est proportionnelle à son effort et au stock (modèle de Schaefer), donc plus le poisson se fait rare, plus il est dur à attraper. Le stock se renouvelle selon une croissance logistique (vite quand il est à mi-niveau, lentement quand il est presque vide ou presque plein). En dessous d'un seuil, l'étang est déclaré épuisé (simple indicateur). Voir la décision [0010](decisions/0010-peche-de-schaefer.md).
4. **Sanctions** (deux options indépendantes, grenier et pêche) : un villageois peut payer un coût pour faire perdre davantage à un villageois qui a versé nettement moins que la moyenne au grenier, ou dont la modération à l'étang est nettement inférieure à la moyenne (rapport de l'ordre de 1 pour 3 dans les expériences, à vérifier). L'écart à la moyenne décide qui peut être ciblé, et combien d'amendes il peut recevoir : les sanctions sont graduées, la peine grandit avec la faute et non avec le nombre de sanctionneurs. La probabilité de sanctionner dépend de la disposition du sanctionneur. Les sanctions n'agissent sur le comportement que par la peur, une par domaine. Voir les décisions [0007](decisions/0007-sanctions-limitees-au-grenier.md), [0011](decisions/0011-sanctions-de-la-surpeche.md) et [0021](decisions/0021-sanctions-graduees.md).
5. **Repas** : chaque adulte mange une quantité fixe ; chaque enfant mange sur la réserve de son parent (ou la sienne s'il est orphelin) et ne travaille pas. Une réserve négative est ramenée à zéro (pas de dette) ; plusieurs saisons de faim consécutives tuent.
6. **Mise à jour des croyances** à partir de ce qui a été observé.

### Les générations (une fois par an)

- **Vieillissement et mort** : espérance de vie avec un aléa, mort prématurée en cas de famine prolongée. La réserve d'un mort va à ses enfants vivants, sinon elle est perdue.
- **Naissances** : un adulte dont la réserve dépasse un seuil a une probabilité d'avoir un enfant. L'enfant hérite de la disposition et de l'influençabilité du parent, chacune avec une petite variation aléatoire, et d'une part de sa réserve.
- **Imitation** : chaque année, un villageois peut rapprocher sa disposition de celle d'un voisin qui a gagné davantage au cours de l'année (apprentissage social biaisé par la réussite). La réussite se mesure au revenu, pas à la réserve, qui reflète surtout l'âge et l'héritage (voir [0014](decisions/0014-imitation-du-revenu.md)). Seul ce mécanisme fait évoluer une disposition au cours d'une vie. L'influençabilité, elle, n'est pas imitée : elle reste fixe. On distingue ainsi l'influence à court terme (je verse moins cette saison parce que les autres versent peu) de l'influence à long terme (ma disposition change parce que je copie ceux qui réussissent).
- La population est limitée de fait par la nourriture disponible et par la capacité des champs.
- Choix de calibrage : un adulte qui ne partage rien couvre ses besoins avec un petit surplus, le partage en crée un bien plus grand. Voir la décision [0006](decisions/0006-premier-calibrage.md).

### Ce que l'on mesure

Population, richesse moyenne, inégalités de revenu et de patrimoine (indice de Gini), stock de l'étang, part moyenne contribuée au grenier, disposition et influençabilité moyennes, répartition des dispositions par tranches de 0,1, sanctions par domaine. Les inégalités de patrimoine reflètent surtout l'âge et l'héritage, celles de revenu les comportements : voir la décision [0012](decisions/0012-mesures-honnetes.md).

## Réglages du joueur

- **Taille du village** : de 10 à 60 villageois, 30 par défaut.
- **Composition**, en trois modes, chacun réglant la disposition et l'influençabilité :
  - « Tous pareils » : un curseur I/Us et un curseur d'influençabilité.
  - « Deux profils de départ » : part de chaque profil, et les deux traits de chacun. Ce ne sont pas des groupes : personne ne sait à quel profil appartient l'autre, et les profils se mélangent dès la première génération.
  - « Mélange » : moyenne et dispersion de chaque trait.
- L'influençabilité par défaut vaut 0,7 : la plupart des gens observés en laboratoire sont des coopérateurs conditionnels (à sourcer).
- **L'étang** : grand ou petit. Avec le grand, l'étang ne meurt jamais ; avec le petit, un village qui pêche sans retenue peut le vider, des villageois qui se modèrent le gardent. Voir la décision [0016](decisions/0016-taille-de-l-etang-au-choix.md).
- **Inclure mon villageois** : oui par défaut si l'intro a été jouée.
- **Sanctions entre villageois** : pour le grenier et contre la surpêche, chacune autorisée ou non.
- **Durée** : en années, 100 ou 300 (par défaut, environ dix générations), ou « jusqu'à ce que je m'arrête ». La génération n'est pas une unité du moteur, d'où les années (décision [0019](decisions/0019-squelette-du-jeu.md)).
- **Graine** : affichée et modifiable, pour rejouer exactement la même partie.

Le réglage dit « I/Us » côté joueur. Dans le jeu, aucun libellé politique.

## L'écran de simulation

- **Carte en pixel art**, vue de dessus : maisons, champs, grenier, étang. Les villageois marchent vers le champ, le grenier et l'étang selon la saison. Les saisons changent l'apparence.
- **Les traits (disposition, influençabilité) ne sont pas affichés par défaut.** Un clic sur un villageois ouvre sa fiche : nom, âge, réserve, ce qu'il a fait les dernières saisons, son parent.
- **Signes visuels** : niveau du grenier, poissons visibles dans l'étang, maisons vides quand la population baisse, petite icône lors d'une sanction.
- **Contrôle du temps** : pause, ×1, ×4, ×32, et « passer 10 ans » (calcul sans animation). Le moteur calcule une saison d'un coup ; l'écran la raconte ensuite (champ, grenier, étang, sanctions, retour). À ×32, les villageois ne marchent plus et seuls les niveaux bougent.
- **Panneau de courbes**, repliable : population, inégalités de revenu et de patrimoine, stock de l'étang, contribution moyenne, traits moyens et répartition des dispositions.
- **Lignée du joueur** : un repère discret permet de suivre son villageois puis ses descendants.

## Fin de partie

La partie se termine quand le village s'éteint, quand la durée choisie est atteinte, ou quand le joueur l'arrête.

L'écran de fin affiche :

- les courbes de toute la partie ;
- trois questions ouvertes choisies selon ce qui s'est passé, par exemple : « Qui s'en est le mieux sorti, et à quel prix pour les autres ? », « Qu'est-ce qui a fait basculer le grenier ? », « Que se serait-il passé sans les sanctions ? » ;
- un bouton « Rejouer en changeant un seul paramètre », qui garde la même graine pour comparer.

Pas de conclusion, pas de morale.

## « Comment ça marche ? » (version simple)

Une page accessible depuis le menu explique chaque règle en une ou deux phrases, avec sa source quand elle existe. Elle précise que les règles individuelles s'appuient sur des observations, et que ce qui arrive au village en découle sans être programmé.

## Sources

Chaque paramètre du moteur porte un statut dans `src/sim/paramSpec.ts` : `source` (vérifié dans une publication), `a-sourcer` (la littérature donne une valeur ou une forme, pas encore vérifiée) ou `hypothese` (choix de conception). Quand une source est vérifiée, on passe le statut à `source` et on met la référence complète dans la note du paramètre. Le fichier `docs/SOURCES.md` initialement prévu n'est plus nécessaire (décision [0003](decisions/0003-transparence-totale-du-moteur.md)).

Tous les paramètres sont visibles avec leur statut. En revanche, aucun chiffre n'est présenté au joueur comme un fait observé (par exemple dans le portrait : « comme la moitié des gens ») tant que sa source n'est pas vérifiée. Les faits observés que le jeu peut afficher sont rangés dans `src/sources/observed.ts`, avec la référence, l'endroit dans la source, une citation et un statut ; le jeu n'affiche que les entrées vérifiées (décision [0017](decisions/0017-premieres-sources-verifiees.md)). Pistes de départ dans [VISION.md](VISION.md).

## Le labo

À côté du jeu (`jeu/`), `index.html` est un labo de mise au point du moteur, sans graphismes, publié sur GitHub Pages. Il a trois onglets : les réglages essentiels ; tous les paramètres, avec recherche, valeur par défaut, statut, justification et règles qui les utilisent ; les règles du moteur, dans l'ordre, avec leurs formules et une figure de la règle de comportement. Un bandeau signale tout paramètre modifié par rapport aux valeurs par défaut. Le futur « Comment ça marche ? » du jeu lira les mêmes registres.

## Technique

- **Stack** : TypeScript, Vite, Phaser 4 (décision [0018](decisions/0018-phaser-4.md)), Vitest.
- **Séparation stricte** :
  - `src/sim/` contient le moteur, en TypeScript pur, sans aucun import de Phaser ni du DOM. Il est déterministe : PRNG à graine, même graine et mêmes réglages donnent exactement le même résultat. Il expose `step()` (une saison) et `run(n)` (sans rendu).
  - `src/game/` contient le jeu, servi par la page `jeu/index.html` (décision [0019](decisions/0019-squelette-du-jeu.md)). Phaser ne dessine que le village (`src/game/scenes/`) ; le réglage, les commandes du temps, la fiche d'un villageois et les autres écrans à base de texte sont en HTML par-dessus le canevas (`src/game/ui/`), plus accessible et plus simple à traduire. La logique qui ne dessine pas (temps, plan du village, chorégraphie d'une saison) vit dans `src/game/core/`, sans Phaser ni DOM, et elle est testée. Le jeu lit l'état du moteur sans jamais le modifier ; la vitesse ne décide que du nombre de saisons calculées, jamais de leur contenu.
  - `src/i18n/` contiendra `fr.json` et `en.json` pour les textes du jeu. Aucun texte en dur dans le code. Les textes qui décrivent le modèle (paramètres, règles) vivent, eux, dans les registres de `src/sim/`, déjà en français et en anglais.
  - `src/lab/` contient le labo.
- **Graphismes** : packs pixel art libres de droits (licence vérifiée et notée dans `assets/LICENSES.md`) ou sprites originaux. Aucun élément repris d'un jeu existant.
- **Hébergement** : GitHub Pages, déployé par une GitHub Action à chaque push sur `main`.

## Tests du moteur

En plus des faits stylisés ci-dessous, le moteur a des tests de comportement individuel (plus de disposition ne donne jamais moins), de transparence (chaque paramètre apparaît dans une règle affichée) et d'hypothèses de calibrage (choix assumés, séparés des faits observés).

### Faits stylisés

Le moteur doit reproduire qualitativement ces comportements. Chacun est un test Vitest ; les faits 2 à 8 sont définis une seule fois dans `src/checks/stylizedFacts.ts`, avec leurs seuils, pour que l'outil de robustesse vérifie exactement les mêmes.

1. **Déterminisme** : même graine et mêmes réglages donnent un état identique après 100 saisons.
2. **Village généreux** : 100 % de dispositions hautes. La contribution reste élevée, l'étang ne s'épuise pas.
3. **Passager clandestin** : une majorité de villageois coopératifs et influençables plus 10 à 20 % de profiteurs purs (disposition basse, insensibles aux autres), sans sanctions. La contribution moyenne décline au fil des saisons.
4. **Sanctions** : même population avec sanctions. La contribution se maintient nettement mieux qu'au test 3.
5. **Tragédie des communs** : 100 % de dispositions basses. L'étang est surexploité : il tombe sous la moitié de sa capacité et bien plus bas qu'avec des pêcheurs modérés (surexploitation, pas forcément extinction).
6. **Invasion** : sur plusieurs générations sans sanctions, une petite minorité de profiteurs progresse dans une population de coopérateurs influençables (à confirmer : ce résultat dépend du calibrage, c'est justement ce que le jeu explore).
7. **Sanctions de la surpêche** : avec une minorité de profiteurs, l'étang est mieux préservé quand la surpêche peut être sanctionnée.
8. **Invasion contenue** : avec les sanctions du grenier et de la pêche, la disposition moyenne résiste nettement mieux à l'invasion du test 6. Ce n'est pas un fait observé mais un résultat du modèle ; les sanctions du grenier seules ne font que freiner l'invasion (décision [0021](decisions/0021-sanctions-graduees.md)).

### Robustesse

Un fait reproduit avec les valeurs par défaut ne dit pas grand-chose si ces valeurs sont des hypothèses. `pnpm robustness` produit un rapport qui dit, pour chaque fait stylisé et chaque hypothèse de calibrage, sous quelles variations des paramètres il tient ou casse, et explore à quelles conditions l'étang peut s'éteindre. La méthode et ses limites sont décrites dans la fiche [0013](decisions/0013-outil-de-robustesse.md). Un résultat montré au joueur comme une conséquence du modèle doit tenir sous ces variations, ou être présenté comme dépendant d'une hypothèse.

## À vérifier à la main (recette)

- L'intro se joue en environ trois minutes. Le portrait ne contient aucun mot jugeant et chaque chiffre affiché a une source vérifiée.
- Changer de langue traduit tous les écrans, y compris le portrait et les questions de fin.
- Avec les réglages du test 3, on voit à l'œil le grenier se vider au fil des saisons.
- « Passer 10 ans » donne le même résultat que de laisser tourner à ×32.
- « Rejouer en changeant un paramètre » garde la graine et ne change que ce paramètre.
- Le jeu tourne de façon fluide avec 60 villageois sur un portable récent.

## Questions ouvertes

- Ce qui reste à faire dans le modèle et ce qui est reporté après la première version jouable : voir la décision [0015](decisions/0015-modele-v1-fige.md).
- Les noms des quatre traits du portrait et leur formulation exacte, en français et en anglais.
- Les valeurs par défaut de `r`, `k`, `m`, de la croissance de l'étang et de l'espérance de vie (à calibrer, puis à régler pour qu'une partie de 10 générations reste lisible).
- Le villageois du joueur est-il repérable par défaut, ou seulement sur demande ?
- Le choix du pack graphique.

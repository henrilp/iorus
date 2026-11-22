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
- Chaque trait est situé parmi les comportements observés : « Tu as rendu ce qu'on t'a donné, comme environ la moitié des gens dans les expériences. » Les chiffres affichés doivent venir d'une source vérifiée (voir « Sources » plus bas).
- Une phrase rappelle que le comportement dépend du contexte et n'est pas une identité figée.
- Ces mesures deviennent les paramètres du villageois du joueur.

## Le modèle du village

### Le villageois

| Attribut | Description |
|---|---|
| `disposition` | Entre 0 (tout pour soi, I) et 1 (tout pour le groupe, Us). Fixée à la naissance. |
| `belief` | Ce que le villageois croit que les autres font (moyenne glissante des contributions observées). |
| `wealth` | Réserve de nourriture. |
| `age`, `parentId` | Pour les générations et les lignées. |
| `isPlayer` | Vrai pour le villageois issu du portrait, puis pour sa descendance. |

### Règle de comportement

La disposition donne le comportement de départ ; le comportement réel s'ajuste ensuite à ce que le villageois observe (coopération conditionnelle).

- La part contribuée au grenier vaut `share = a(disposition) + b(disposition) × belief`, bornée entre 0 et 1.
- Disposition proche de 0 : la part reste proche de 0 quoi que fassent les autres (passager clandestin).
- Disposition proche de 1 : la part reste élevée quoi que fassent les autres (coopérateur inconditionnel).
- Disposition intermédiaire : le villageois suit à peu près ce que font les autres, avec un léger biais à la baisse (coopérateur conditionnel). La littérature observe ce biais.
- La même logique règle la modération à l'étang : plus la disposition est basse et plus les autres surpêchent, plus on pêche.

Les fonctions `a` et `b` et le biais sont à calibrer sur les sources.

### Le cycle d'une saison (quatre saisons par an)

1. **Travail** : chaque adulte produit une récolte (valeur de base plus un léger aléa).
2. **Grenier** : chacun verse une part de sa récolte au pot commun. Le total est multiplié par `r` (avec 1 < r < nombre de villageois), puis réparti à parts égales entre tous. C'est le dilemme : collectivement on gagne à contribuer, individuellement on gagne à ne pas le faire.
3. **Étang** : chacun pêche. Le stock se renouvelle selon une croissance logistique (il repousse vite quand il est à mi-niveau, lentement quand il est presque vide ou presque plein). En dessous d'un seuil, l'étang est déclaré épuisé.
4. **Sanctions** (si l'option est active) : après avoir vu les contributions, un villageois peut payer un coût `k` pour retirer `m` à un villageois qui a peu contribué (rapport de l'ordre de 1 pour 3 dans les expériences, à vérifier). La probabilité de sanctionner dépend de la disposition et de l'écart observé.
5. **Consommation** : chacun mange une quantité fixe. Une réserve négative affaiblit puis tue le villageois.
6. **Mise à jour des croyances** à partir de ce qui a été observé.

### Les générations (une fois par an)

- **Vieillissement et mort** : espérance de vie avec un aléa, mort prématurée en cas de famine prolongée.
- **Naissances** : un adulte dont la réserve dépasse un seuil a une probabilité d'avoir un enfant. L'enfant hérite de la disposition du parent avec une petite variation aléatoire, et d'une part de sa réserve.
- **Imitation** : chaque année, un villageois peut rapprocher sa disposition de celle d'un voisin plus prospère (apprentissage social biaisé par la réussite). Seul ce mécanisme fait évoluer une disposition au cours d'une vie.
- La population est limitée de fait par la nourriture disponible.

### Ce que l'on mesure

Population, richesse moyenne, inégalités (indice de Gini), stock de l'étang, part moyenne contribuée au grenier, disposition moyenne, nombre de sanctions.

## Réglages du joueur

- **Taille du village** : de 10 à 60 villageois, 30 par défaut.
- **Composition**, en trois modes :
  - « Tous pareils » : un curseur I/Us unique.
  - « Deux groupes » : proportion de chaque groupe et curseur I/Us de chacun.
  - « Mélange » : moyenne et dispersion.
- **Inclure mon villageois** : oui par défaut si l'intro a été jouée.
- **Sanctions entre villageois** : autorisées ou non.
- **Durée** : nombre de générations (10 par défaut) ou « jusqu'à ce que je m'arrête ».
- **Graine** : affichée et modifiable, pour rejouer exactement la même partie.

Le réglage dit « I/Us » côté joueur. Dans le jeu, aucun libellé politique.

## L'écran de simulation

- **Carte en pixel art**, vue de dessus : maisons, champs, grenier, étang. Les villageois marchent vers le champ, le grenier et l'étang selon la saison. Les saisons changent l'apparence.
- **La disposition n'est pas affichée par défaut.** Un clic sur un villageois ouvre sa fiche : nom, âge, réserve, ce qu'il a fait les dernières saisons, son parent.
- **Signes visuels** : niveau du grenier, poissons visibles dans l'étang, maisons vides quand la population baisse, petite icône lors d'une sanction.
- **Contrôle du temps** : pause, ×1, ×4, ×32, et « passer 10 ans » (calcul sans animation).
- **Panneau de courbes**, repliable : population, richesse et Gini, stock de l'étang, contribution moyenne, disposition moyenne.
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

Le fichier `docs/SOURCES.md` (à créer) liste chaque paramètre du moteur avec sa valeur, sa source et un statut (« vérifié » ou « à vérifier »). Aucun chiffre n'est affiché au joueur tant que sa source n'est pas vérifiée. Pistes de départ dans [VISION.md](VISION.md).

## Technique

- **Stack** : TypeScript, Vite, Phaser 3, Vitest.
- **Séparation stricte** :
  - `src/sim/` contient le moteur, en TypeScript pur, sans aucun import de Phaser ni du DOM. Il est déterministe : PRNG à graine, même graine et mêmes réglages donnent exactement le même résultat. Il expose `step()` (une saison) et `run(n)` (sans rendu).
  - `src/game/` contient les scènes Phaser (titre, intro, réglage, village, fin) ; elles lisent l'état du moteur sans jamais le modifier directement.
  - `src/i18n/` contient `fr.json` et `en.json`. Aucun texte en dur dans le code.
- **Graphismes** : packs pixel art libres de droits (licence vérifiée et notée dans `assets/LICENSES.md`) ou sprites originaux. Aucun élément repris d'un jeu existant.
- **Hébergement** : GitHub Pages, déployé par une GitHub Action à chaque push sur `main`.

## Tests du moteur (faits stylisés)

Le moteur doit reproduire qualitativement ces comportements. Chacun est un test Vitest.

1. **Déterminisme** : même graine et mêmes réglages donnent un état identique après 100 saisons.
2. **Village généreux** : 100 % de dispositions hautes. La contribution reste élevée, l'étang ne s'épuise pas.
3. **Passager clandestin** : une majorité de conditionnels plus 10 à 20 % de dispositions basses, sans sanctions. La contribution moyenne décline au fil des saisons.
4. **Sanctions** : même population avec sanctions. La contribution se maintient nettement mieux qu'au test 3.
5. **Tragédie des communs** : 100 % de dispositions basses. L'étang s'épuise.
6. **Invasion** : sur plusieurs générations sans sanctions, une petite minorité de dispositions basses progresse dans une population de conditionnels (à confirmer : ce résultat dépend du calibrage, c'est justement ce que le jeu explore).

## À vérifier à la main (recette)

- L'intro se joue en environ trois minutes. Le portrait ne contient aucun mot jugeant et chaque chiffre affiché a une source vérifiée.
- Changer de langue traduit tous les écrans, y compris le portrait et les questions de fin.
- Avec les réglages du test 3, on voit à l'œil le grenier se vider au fil des saisons.
- « Passer 10 ans » donne le même résultat que de laisser tourner à ×32.
- « Rejouer en changeant un paramètre » garde la graine et ne change que ce paramètre.
- Le jeu tourne de façon fluide avec 60 villageois sur un portable récent.

## Questions ouvertes

- Les noms des quatre traits du portrait et leur formulation exacte, en français et en anglais.
- Les valeurs par défaut de `r`, `k`, `m`, de la croissance de l'étang et de l'espérance de vie (à calibrer, puis à régler pour qu'une partie de 10 générations reste lisible).
- Imitation et héritage ensemble dès la v1, ou un seul des deux ?
- Le villageois du joueur est-il repérable par défaut, ou seulement sur demande ?
- Le choix du pack graphique.

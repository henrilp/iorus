# 0019. Le squelette du jeu : une page à part, l'interface en HTML, le village en Phaser, une saison racontée après coup

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Le modèle de la v1 est figé ([0015](0015-modele-v1-fige.md)). On commence le jeu par un squelette : un écran de réglage, le village avec des formes provisoires qui lisent le moteur, et le contrôle du temps. Le but est de savoir si le village est intéressant à regarder avant de choisir des graphismes. Plusieurs choix d'architecture se posent, et certains s'écartent de la spec.

## Options envisagées

Où publier le jeu :

1. Remplacer le labo à la racine du site : le labo disparaîtrait, alors qu'il reste l'outil de mise au point et la vitrine des registres.
2. Une deuxième page (`jeu/`) à côté du labo : les deux restent publiés, et le labo ne charge pas Phaser.

Comment faire le réglage et les commandes :

1. Des scènes Phaser, comme le prévoyait la spec : curseurs, cases et champs seraient à réécrire dans le canevas, mal lisibles au clavier et par les lecteurs d'écran, et plus pénibles à traduire.
2. Du HTML par-dessus le canevas : les contrôles natifs du navigateur, accessibles et faciles à traduire ; Phaser ne dessine que le village.

Comment animer une saison :

1. Faire avancer le moteur pendant l'animation, étape par étape : il faudrait découper `step()` et la vitesse pourrait changer la partie.
2. Calculer la saison d'un coup avec `step()`, puis la raconter : les villageois vont au champ, au grenier, à l'étang, puis rentrent ; le grenier se remplit, l'étang change de couleur, les sanctionnés portent une marque. L'écran montre toujours la saison qui vient d'être calculée.

## Décision

Pour les trois questions, l'option 2.

- `jeu/index.html` est une deuxième page Vite ; `index.html` reste le labo.
- Le réglage, le bandeau du temps et la fiche d'un villageois sont en HTML (`src/game/ui/`). Phaser ne dessine que le village (`src/game/scenes/`).
- La logique du jeu qui ne dessine pas (le temps, le plan du village, l'attribution des maisons, la chorégraphie d'une saison) vit dans `src/game/core/`, sans Phaser ni DOM, et elle est testée.
- La vitesse ne décide que du nombre d'appels à `step()` par image, jamais de leur contenu. « Passer 10 ans » et ×32 donnent donc le même état, comme toute suite de changements de vitesse ; c'est testé.
- L'aléa visuel (où chacun se place au champ ou sur la rive) est une fonction fixe de l'identifiant du villageois. Il ne tire jamais dans le `Rng` du moteur, sinon l'affichage changerait la partie.
- La durée d'une partie se règle en années (100, 300, ou sans limite ; 300 par défaut, environ dix générations) plutôt qu'en générations. Une génération n'est pas une unité du moteur : la définir ajouterait un nombre qui ne correspond à rien dans la simulation.
- Chaque adulte a sa maison, chaque enfant vit chez son parent. La maison d'un mort reste debout, vide : c'est le signe visible d'une population qui baisse.
- Les textes du jeu sont dans `src/i18n/fr.json` et `en.json` dès le squelette. Un test vérifie que les deux langues ont les mêmes clés et les mêmes variables.

## Conséquences

- La spec est mise à jour : réglage en HTML, durée en années, page `jeu/`.
- À ×32, il n'y a plus de marche : on ne voit que les niveaux. À ×1, une saison dure quatre secondes ; ces rythmes d'affichage sont réunis dans `src/game/core/display.ts`. Ils ne touchent pas la simulation et ne sont donc pas dans le registre des paramètres.
- Les morts de la saison sont déjà retirés de l'état quand on la raconte : ils disparaissent au début de l'animation au lieu de la fin. C'est acceptable pour un squelette ; un rendu plus fidèle demanderait de garder un instantané d'avant la saison.
- Le moteur ne dit pas qui a sanctionné qui, seulement combien de sanctions chacun a reçues. La marque se pose sur le sanctionné ; montrer le geste entre deux villageois demanderait d'enrichir `last` dans le moteur.
- La règle « est adulte » est exportée par le moteur (`isAdult`) pour que le jeu ne la recopie pas.
- Encore absents du squelette : le panneau de courbes, les noms des villageois, la lignée du joueur (il faut l'intro), l'écran de fin et ses questions.

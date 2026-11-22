# 0018. Phaser 4 plutôt que Phaser 3

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

La fiche [0002](0002-moteur-pur-deterministe.md) et la spec prévoyaient Phaser 3 pour le rendu, et le dépôt dépendait de `phaser@^3.90`. Au moment d'écrire la première scène, la version stable de Phaser est la 4 (4.2.1, publiée en juillet 2026) ; la branche 3 ne reçoit plus que des corrections.

## Options envisagées

1. Rester sur Phaser 3 : la version prévue et la plus documentée, mais il faudrait migrer un jour, quand des scènes, des sprites et des effets existeront.
2. Passer à Phaser 4 maintenant : aucune scène n'existe encore, la migration ne coûte rien. Les objets dont le squelette a besoin (formes, graphismes, tweens, échelle du canevas) gardent la même interface.

## Décision

Option 2 : `phaser@4.2.1`. Le choix se fait avant la première scène, quand il ne coûte rien.

## Conséquences

- Une partie de la documentation et des exemples en ligne visent encore Phaser 3 ; vérifier l'API de la version 4 (types dans `node_modules/phaser/types`) avant de suivre un exemple.
- Le moteur (`src/sim/`) n'est pas concerné : il n'importe pas Phaser.
- Phaser pèse environ 1,4 Mo (370 ko compressés). Il n'est chargé que par la page du jeu, pas par le labo (voir [0019](0019-squelette-du-jeu.md)).

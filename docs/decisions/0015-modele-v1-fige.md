# 0015. Le modèle de la v1 est figé : ce qui reste, ce qui est reporté

- Statut : Acceptée, en partie remplacée par [0028](0028-la-nourriture-se-perd.md) (la nourriture qui se perd)
- Date : 2026-11-22

## Contexte

Le but est maintenant d'avancer sur le jeu : l'intro et le visuel. Chaque mécanisme ajouté au moteur rend le modèle plus difficile à comprendre pour le joueur, et demande de nouveaux paramètres à sourcer. Il fallait trier ce qui reste dans le modèle, en fonction de ce dont le jeu a besoin. La règle : le modèle doit rester compréhensible ; on affinera plus tard.

Trois chantiers étaient ouverts : l'outil de robustesse, la nourriture qui ne se perd jamais, et un mécanisme qui soutienne la coopération (réputation ou exclusion du grenier).

## Options envisagées

1. Terminer les trois chantiers avant de commencer le jeu : le modèle serait plus fidèle, mais plus long à expliquer, et le jeu attendrait.
2. Ne garder que ce dont le jeu a besoin pour la v1, et reporter le reste avec ses raisons.

## Décision

Option 2.

Fait :

- L'outil de robustesse ([0013](0013-outil-de-robustesse.md)).
- L'imitation compare les revenus de l'année, pas les réserves ([0014](0014-imitation-du-revenu.md)). Pour le joueur, la règle tient en une phrase : on copie le voisin qui a gagné plus que soi cette année.

À faire, parce que le jeu en a besoin :

- L'abondance de l'étang. Avec la taille par défaut, l'étang ne meurt jamais : le jeu ne peut pas montrer un effondrement causé par les comportements. Plutôt que de choisir une valeur pour obtenir ce résultat, la taille de l'étang devient un réglage du joueur ([0016](0016-taille-de-l-etang-au-choix.md)).
- Les sources de l'intro. Le portrait situe le joueur parmi les comportements observés (« comme la moitié des gens ») : chaque chiffre doit être vérifié avant d'être affiché. La même recherche doit sourcer la pente de la coopération conditionnelle, le paramètre de comportement le plus influent selon l'outil de robustesse.

Reporté :

- La nourriture qui se perd (ou un plafond de réserve). Son effet le plus gênant, fausser l'imitation, est corrigé par [0014](0014-imitation-du-revenu.md). Il reste l'inégalité de patrimoine, déjà présentée comme reflétant surtout l'âge et l'héritage ([0012](0012-mesures-honnetes.md)). La corriger ajouterait un paramètre à sourcer et changerait les naissances et la survie. À reprendre après une première version jouable.
- La réputation, ou l'exclusion du grenier. La v1 a déjà un contrepoids aux profiteurs : les sanctions, qui suffisent à un équilibre stable quand elles portent sur le grenier et la pêche. L'exclusion est par nature une règle collective : sa place est en v2, avec les règles votées. La reporter garde la v1 lisible.
- La reformulation du fait « tragédie des communs », qui repose sur un pic de population (voir [0013](0013-outil-de-robustesse.md)), et l'étude des interactions entre paramètres dans l'outil de robustesse.

## Conséquences

- Après le réglage de l'étang et les sources de l'intro, le travail passe au jeu. On commence par le visuel : un squelette Phaser (réglage, village avec des formes provisoires qui lisent le moteur, contrôle du temps), parce que la v1 sert d'abord à savoir si le village est intéressant à regarder. L'intro suit ; ses scènes peuvent s'écrire en parallèle, en français et en anglais.
- Toute proposition de nouveau mécanisme dans le moteur avant la première version jouable doit expliquer pourquoi le jeu ne peut pas s'en passer.

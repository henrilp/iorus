# 0005. Deux traits : disposition et influençabilité

- Statut : Acceptée
- Date : 2026-11-22
- Remplace : [0004](0004-comportement-a-un-seul-trait.md)

## Contexte

Le modèle à un seul trait mélangeait deux idées dans un curseur et produisait des incohérences (voir [0004](0004-comportement-a-un-seul-trait.md)). Il fallait que plus de disposition « Us » donne toujours au moins autant de générosité, sans perdre la coopération conditionnelle.

## Options envisagées

1. Garder un seul trait avec deux bornes qui montent avec la disposition : un plancher (ce qu'on donne même si personne ne donne) et un plafond (ce qu'on donne si tout le monde donne), la croyance situant entre les deux. C'est monotone et ça garde l'axe unique, mais la dépendance aux autres reste liée à la disposition.
2. Deux traits indépendants, proposés par Henri : la disposition (ce qu'on ferait seul) et l'influençabilité (à quel point on règle sa conduite sur ce qu'on croit que font les autres).

## Décision

Option 2. Règle : `part = (1 − influençabilité) × disposition + influençabilité × pente × croyance`, et la même logique pour la modération à l'étang.

Trois choix l'accompagnent :

- L'influençabilité est fixée à la naissance et héritée du parent avec une petite variation, comme la disposition. On peut ainsi observer si la sélection favorise les influençables ou les têtus.
- Elle n'est pas imitée : l'imitation ne touche que la disposition (voir [0008](0008-imitation-de-la-reussite.md)). On distingue l'influence à court terme (je verse moins cette saison parce que les autres versent peu) de l'influence à long terme (ma disposition change parce que je copie ceux qui réussissent).
- Sa valeur par défaut est 0,7 dans les réglages, puisque la majorité des gens observés sont des coopérateurs conditionnels (à sourcer). Dans l'introduction, la réciprocité mesurée chez le joueur donnera son influençabilité.

## Conséquences

- La monotonie est garantie par construction (le coefficient de la disposition n'est jamais négatif) et testée villageois par villageois dans `behavior.test.ts`.
- Chaque combinaison a un sens : égoïste peu influençable = passager clandestin pur ; généreux peu influençable = coopérateur inconditionnel ; très influençable = coopérateur conditionnel, qui suit le groupe vers le haut comme vers le bas.
- L'axe I/Us reste central dans l'interface ; l'influençabilité dit seulement à quel point le contexte social module ces instincts. Elle colle mieux à la recherche, qui distingue ces types plutôt que de les ranger sur un seul axe.
- De nouvelles questions deviennent explorables. Un village de généreux influençables est-il plus fragile face aux profiteurs qu'un village de généreux têtus ? Observé dès la mise en place : sans sanctions, quand les profiteurs envahissent le village, l'influençabilité moyenne s'effondre aussi (d'environ 0,58 à 0,1 en deux siècles), parce que la lignée des profiteurs, insensibles aux autres, l'emporte.
- Un généreux influençable hérite en partie du biais à la baisse des autres : le village généreux verse désormais environ 0,73 au lieu de 0,88. Les faits stylisés passent toujours sans changement de seuil, mais deux marges sont minces (0,73 pour un seuil de 0,7 ; un déclin de 0,12 pour un seuil de 0,1). Un recalibrage pourrait les faire basculer.

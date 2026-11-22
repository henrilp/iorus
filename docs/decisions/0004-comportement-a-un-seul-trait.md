# 0004. Un seul trait I/Us, le suivi des autres dosé par la distance au centre

- Statut : Remplacée par [0005](0005-deux-traits-disposition-influencabilite.md)
- Date : 2026-11-22

## Contexte

La grille d'Henri place chaque individu sur un axe entre l'instinct individuel (I) et l'instinct collectif (Us). La recherche en économie expérimentale montre par ailleurs que la plupart des gens sont des coopérateurs conditionnels : ils coopèrent tant que les autres coopèrent, en rendant un peu moins qu'ils ne voient (Fischbacher, Gächter et Fehr, 2001, à vérifier). Il fallait un modèle qui garde l'axe unique tout en intégrant cette conditionnalité.

## Options envisagées

1. Un comportement fixe, proportionnel à la disposition : il ignore la conditionnalité, qui est le phénomène central du passager clandestin.
2. Un seul trait, la disposition d, dont la distance au centre dose le suivi des autres : `poids = |2d − 1|`, puis `part = poids × d + (1 − poids) × pente × croyance`. Les extrêmes agissent seuls, le centre suit les autres.

## Décision

Option 2, retenue pour la première version du moteur.

## Conséquences

La figure de la règle, ajoutée au labo (voir [0003](0003-transparence-totale-du-moteur.md)), a révélé un défaut : le poids étant symétrique autour de 0,5, la générosité n'augmente pas toujours avec la disposition. Quand les autres donnent peu, un villageois à 0,25 donne plus qu'un villageois à 0,5, parce qu'il reste à moitié accroché à sa propre valeur alors que le second suit les autres jusqu'à zéro. Quand tout le monde donne beaucoup, un villageois à 0,75 plafonne en dessous d'un villageois à 0,5. Plus de « Us » ne voulait donc pas toujours dire plus de générosité, ce qui contredit le sens même du curseur.

Les tests ne l'avaient pas vu, parce qu'ils comparaient des villages entiers et non des individus. La cause : un seul curseur portait deux idées, le niveau de générosité et la dépendance aux autres. Cette fiche est remplacée par [0005](0005-deux-traits-disposition-influencabilite.md).

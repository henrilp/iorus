# 0016. La taille de l'étang est un réglage du joueur : grand ou petit

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

L'outil de robustesse ([0013](0013-outil-de-robustesse.md)) a montré que l'étang ne peut s'éteindre que si ρ = croissance × capacité par villageois ÷ pêche maximale est assez bas comparé à la taille que le village atteint. Avec les valeurs par défaut (ρ = 3,75), il ne s'éteint jamais : le jeu ne peut pas montrer qu'un village peut vider son étang par son comportement. Mais choisir une valeur pour obtenir un effondrement serait raisonner par le résultat, et aucune des trois valeurs n'est sourcée.

## Options envisagées

1. Changer la valeur par défaut pour que l'étang puisse mourir : c'est raisonner par le résultat, et cela cache le choix dans un chiffre.
2. Laisser tel quel : l'étang devient un décor qui ne meurt jamais, et la moitié du sujet (le bien commun naturel) disparaît du jeu.
3. Proposer au joueur deux scénarios explicites, en jouant sur l'un des trois paramètres :
   - la pêche maximale : elle change aussi la part du poisson dans l'alimentation quand l'étang est plein, donc toute l'économie ;
   - la croissance : avec 0,12, l'extinction reste rare (une partie sur cinq chez les égoïstes) ;
   - la taille de l'étang : c'est le réglage le plus facile à comprendre (« un petit étang »), et celui qui donne le contraste le plus net entre comportements.

## Décision

Option 3, sur la taille de l'étang : « Grand étang » (50 poissons par villageois de départ, la valeur par défaut, inchangée) ou « Petit étang » (20, soit ρ = 1,5). Les deux valeurs sont déclarées dans le registre (`presets` de `pondCapacityPerVillager`) avec leur justification ; la taille reste réglable librement dans le labo. Un test vérifie que les valeurs proposées sont dans les bornes et comprennent la valeur par défaut.

Mesures sur cinq graines, village de 30, années 80 à 100 (étang en fraction de la capacité) :

| Village | Grand étang | Petit étang | Petit étang, sanctions de la surpêche |
|---|---|---|---|
| Égoïstes (0,05) | 0,60 | épuisé dans 5 parties sur 5 | épuisé dans 5 sur 5 |
| 15 % de profiteurs | 0,59 | épuisé dans 5 sur 5 | 0,14, épuisé dans 2 sur 5 |
| Conditionnels (0,5) | 0,75 | 0,35 | 0,36 |
| Généreux (0,9) | 0,89 | 0,70 | 0,73 |

Avec le petit étang, l'extinction vient des comportements : des villageois coopératifs le gardent, des égoïstes le vident. Ce n'est pas une condamnation arithmétique.

## Conséquences

- La spec ajoute ce réglage à ceux du joueur. Dans le jeu, il pourra s'appeler simplement « l'étang : grand ou petit », avec une phrase d'explication.
- La valeur par défaut ne change pas : les faits stylisés et le rapport de robustesse sont inchangés.
- Le choix proposé par défaut au joueur dans le jeu (grand ou petit) reste à décider quand on construira l'écran de réglage.

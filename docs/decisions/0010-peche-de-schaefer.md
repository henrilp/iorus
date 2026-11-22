# 0010. La pêche suit le modèle de Schaefer

- Statut : Acceptée
- Date : 2026-11-22
- Remplace en partie : [0006](0006-premier-calibrage.md) (les poissons venus de la rivière)

## Contexte

L'étang mourait dans presque toutes les parties dès que la population dépassait 60 à 70 villageois, quel que soit le mélange de dispositions. Une variable qui finit toujours à zéro n'apprend rien au joueur et suggère que l'environnement est condamné de toute façon.

Le diagnostic, mesuré année par année, a montré que la modération individuelle ne se dégradait pas : un villageois moyen pêchait environ 2,3 par saison du début à la fin. Deux mécanismes faisaient mourir l'étang :

- La population doublait, et la prise totale dépassait ce que l'étang peut renouveler.
- Une fois l'étang vide, il ne renaissait jamais. Dans l'ancienne règle, chacun pêchait ce qu'il voulait tant qu'il restait du poisson (au plus la moitié du stock par saison) : le dernier poisson s'attrapait aussi facilement que le premier. Le village raflait donc chaque saison tout ce qui repoussait, y compris les « poissons venus de la rivière » ajoutés en [0006](0006-premier-calibrage.md) pour contourner ce problème.

## Options envisagées

1. Garder l'ancienne règle et régler les paramètres (étang plus grand, pêche plus faible) jusqu'à ce que l'étang survive. C'est raisonner par le résultat.
2. Appliquer le modèle standard de la littérature halieutique (Schaefer, 1954) : la prise est proportionnelle à l'effort et au stock. Moins il reste de poissons, plus il faut d'effort pour en attraper un.

## Décision

Option 2. Prise d'un villageois = pêche maximale × effort × stock ÷ capacité, avec effort = 1 − modération. Les « poissons venus de la rivière » sont supprimés : ils compensaient un défaut qui n'existe plus. La part maximale pêchable par saison est supprimée aussi ; il reste seulement le garde-fou « pas plus que le stock ».

Aucune valeur de paramètre n'a été changée.

## Conséquences

- L'étang s'éteint seulement si l'effort total du village dépasse croissance × capacité ÷ pêche maximale (environ 112 villageois sans aucune modération avec les valeurs actuelles). Avec les valeurs par défaut, il ne s'éteint plus. Il se stabilise à un niveau qui dépend des comportements, sur cinq graines et sans réglage : environ 0,86 de sa capacité avec des généreux, 0,68 avec des conditionnels, 0,48 avec des égoïstes (minimum entre 0,41 et 0,44).
- Le fait stylisé « tragédie des communs » a été reformulé. Il affirmait que les égoïstes épuisent l'étang, alors que cet effondrement venait de l'ancienne règle. Il dit maintenant, comme la littérature (Hardin 1968, Gordon 1954), qu'en accès libre le stock tombe sous la moitié de la capacité (le niveau de pêche durable maximale) et bien plus bas qu'avec des pêcheurs modérés. Surexploitation ne veut pas dire extinction.
- Point à surveiller : que l'étang puisse ou non s'éteindre dépend désormais du rapport entre la pêche maximale et la croissance, deux hypothèses non sourcées. C'est exactement ce que l'outil de robustesse prévu devra explorer, plutôt que de choisir une valeur pour obtenir un effondrement.

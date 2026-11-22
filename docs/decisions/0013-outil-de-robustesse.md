# 0013. Un outil de robustesse : chaque fait est revérifié quand on fait varier les paramètres

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Les faits stylisés étaient vérifiés avec les seules valeurs par défaut, alors que presque tous les paramètres sont des hypothèses ou restent à sourcer. Un fait qui ne tient que pour une valeur précise d'un paramètre non sourcé n'est pas un résultat du modèle : c'est un résultat du calibrage. La fiche [0010](0010-peche-de-schaefer.md) a laissé une question ouverte du même ordre : que l'étang puisse s'éteindre ou non dépend de la pêche maximale et de la croissance, deux valeurs non sourcées.

Il fallait un moyen de savoir quels résultats tiennent et lesquels dépendent d'une hypothèse, sans régler les paramètres pour obtenir un résultat voulu.

## Options envisagées

1. Balayer chaque paramètre entre les bornes du registre. Ces bornes sont celles des curseurs du labo, pas des valeurs plausibles (consommation de 0 à 50, par exemple) : beaucoup de faits casseraient pour des raisons triviales, et le rapport serait illisible.
2. Faire varier un paramètre à la fois par des facteurs fixes autour de sa valeur par défaut (×0,5, ×0,75, ×1,5, ×2), bornés par le registre. C'est simple, lisible et rapide (environ 80 secondes), mais cela ne voit pas les interactions entre paramètres, et le même facteur ne veut pas dire la même chose pour tous les paramètres.
3. Un échantillonnage global (hypercube latin, indices de Sobol) : cette méthode voit les interactions, mais elle demande des milliers de parties pour plus de 30 paramètres, et son résultat est plus dur à lire et à expliquer.
4. Donner pour chaque paramètre une plage plausible tirée de la littérature. Ce serait l'idéal, mais il faudrait plus de trente nouvelles valeurs, la plupart non sourcées.

Où vérifier les faits : les recopier dans l'outil (ils divergeraient des tests), ou les définir une seule fois et les faire vérifier par les deux.

Comment lancer l'outil : dans le labo (visible, mais lent dans le navigateur et plus de code d'interface), ou en ligne de commande.

## Décision

Option 2, en ligne de commande (`pnpm robustness`), avec un rapport Markdown.

- Les faits stylisés et les hypothèses de calibrage sont définis une seule fois, avec leurs scénarios et leurs seuils, dans `src/checks/`. Les tests Vitest et l'outil vérifient exactement les mêmes. Les seuils n'ont pas changé.
- Deux paramètres sont exclus du balayage, avec leur raison écrite dans le rapport : `seasonsPerYear` (il change le sens de tous les paramètres « par saison ») et `pondDepletedThreshold` (il ne sert qu'à un indicateur).
- Une seconde partie explore l'extinction de l'étang. En régime stationnaire, la pêche de Schaefer donne stock ÷ capacité = 1 − effort total ÷ (ρ × taille de départ), avec ρ = croissance × capacité par villageois ÷ pêche maximale (3,75 par défaut). La grille fait varier ρ par la pêche maximale (ce qui laisse inchangée la pêche durable maximale), pour trois croissances et trois villages : égoïstes, 15 % de profiteurs, et des généreux comme témoin.
- L'outil s'exécute par le module de Vite (`runnerImport`), sans dépendance supplémentaire.

L'option 4 reste la bonne direction : à mesure que des sources sont vérifiées, les facteurs pourront être remplacés par des plages propres à chaque paramètre.

## Premiers résultats

Sur cinq graines, aucune valeur par défaut n'a été changée.

- Avec les valeurs par défaut, tout tient, mais certaines marges sont minces : 0,03 pour le village généreux, 0,02 pour le passager clandestin. Cette fragilité vient autant des seuils des tests que du modèle.
- Le fait le plus robuste est l'invasion des profiteurs sans sanction : il ne casse que sous des démographies extrêmes (âge adulte ×2, espérance de vie ×0,5, fin de la fertilité ×0,5). Les paramètres des sanctions (coût, perte, écart, mémoire) ne cassent rien, sauf une propension ×0,5, qui fait perdre de justesse le maintien de la disposition (marge −0,02).
- Le fait le moins robuste est la tragédie des communs (23 variations sur 127). Il casse dès que l'étang est plus abondant par rapport à la pression de pêche (capacité ou croissance plus fortes, pêche maximale plus faible) ou que le village est plus petit (récolte plus faible, champs plus petits, consommation plus forte). Avec les valeurs par défaut, l'étang des égoïstes ne passe sous la moitié de sa capacité qu'autour de l'année 45, au pic de population (environ 63 adultes), puis se stabilise entre 0,55 et 0,65. Le fait repose donc sur un pic démographique, pas sur un régime établi.
- La pente de la coopération conditionnelle (`conditionalSlope`, à sourcer) est le paramètre de comportement le plus influent. À ×0,75 (0,675), le village généreux ne reste plus au-dessus de 0,7 de part versée, et l'effet des sanctions passe sous son seuil. Au-dessus de 1, valeur contraire au biais observé, le déclin du passager clandestin disparaît. La sourcer est prioritaire.
- L'hypothèse « les égoïstes survivent » casse exactement là où elle doit casser : sans gain au grenier (multiplicateur 1), ou quand la consommation atteint la récolte.
- L'étang : avec ρ par défaut (3,75), il ne s'éteint dans aucun des villages testés. Pour ρ entre 1 et 1,5 environ (jusqu'à 2 quand la croissance est forte), les égoïstes et même 15 % de profiteurs l'épuisent, alors que les généreux le gardent entre 0,5 et 0,7 de sa capacité : dans cette zone, l'extinction vient des comportements. En dessous de ρ = 0,75, avec une croissance forte, même les généreux l'épuisent : l'extinction y est inscrite dans les chiffres. D'une croissance à l'autre, les lignes se ressemblent : c'est ρ, plus que chaque paramètre séparément, qui décide.

## Conséquences

- Avant de changer une règle ou une valeur par défaut, on lance l'outil avant et après. Un résultat qui ne tient que pour une valeur d'un paramètre non sourcé doit être présenté comme tel.
- Le choix de ρ n'est pas tranché ici. Le fixer dans la zone où l'étang peut mourir pour obtenir un effondrement serait raisonner par le résultat. Cela demandera une fiche à part, appuyée sur des sources ou assumée comme un réglage proposé au joueur.
- Le fait « tragédie des communs » mérite d'être revu. En accès libre, Gordon (1954) explique la surexploitation par l'arrivée de nouveaux pêcheurs tant que la pêche rapporte. Ici, l'effort de chacun plafonne à 1 et rien ne fait entrer d'effort : la surexploitation dépend seulement du rapport entre la taille du village et ρ.
- Limites : cinq graines (une marge proche de zéro relève du bruit), pas d'interactions entre paramètres, des facteurs identiques pour tous les paramètres. Certaines variations sont peu plausibles : une pente au-dessus de 1, une espérance de vie adulte de 30 ans. `runnerImport` est une API de Vite encore expérimentale, à surveiller lors des mises à jour.

# 0027. Les chemins du chef rééquilibrés : le revenu plutôt que la réserve, et un tirage parmi les trois premiers

- Statut : Acceptée
- Date : 2026-11-22
- Remplace en partie : [0026](0026-le-chef.md) (comment le chef est choisi sur le chemin tiré)

## Contexte

La fiche [0026](0026-le-chef.md) tire l'un de trois chemins (la personne la plus âgée, la plus riche, la plus généreuse au grenier dans l'année) et prend le tout premier du chemin. Mesuré sur le prototype, ce choix avantage nettement la générosité : un joueur qui verse « beaucoup » devient chef dans 29 vies sur 40, un joueur qui verse « presque rien » dans 13 sur 40. Le jeu disait donc, sans le vouloir, que donner mène plus sûrement au pouvoir.

Deux causes. Une part fixe de 0,7 dépasse presque tous les villageois du moteur, qui suivent la moyenne de leurs voisins : le joueur généreux est presque toujours le premier de son chemin. La réserve, elle, est disputée par les anciens et les héritiers, et dépend des enfants : un joueur qui ne partage pas n'en est pas souvent le premier.

## Options envisagées

Mesurées sur 100 vies par conduite (sauf mention), village mélangé de 30, 2 voisins observés, enfants acceptés. Le nombre est celui des vies où le joueur devient chef au moins une fois, pour les conduites « presque rien », « un peu », « comme mes voisins », « beaucoup ».

1. **Mesurer la générosité par rapport aux voisins** plutôt qu'en part absolue : sans effet, le joueur généreux dépasse aussi ses voisins (sur 40 vies : 5, 11, 8, 29).
2. **Tirer le chef parmi les premiers du chemin**, en gardant la réserve : l'écart se réduit sans disparaître (trois premiers avec générosité relative : 9, 14, 16, 36 ; cinq premiers : 12, 10, 12, 23), et le joueur devient rarement chef.
3. **Le revenu de l'année plutôt que la réserve**, en prenant le premier : le revenu est le miroir de la générosité (ce qu'on garde, plus ce que rend le grenier, plus la pêche), mais l'aléa de la récolte pèse plus que l'écart de part : 23, 10, 15, 64.
4. **Le revenu de l'année, et un tirage parmi les trois premiers de chaque chemin** : 22, 13, 13, 27.
5. **Un mandat plus court**, pour plus de successions : le joueur devient chef plus souvent, mais l'écart reste (cinq premiers et réserve, mandat de 5 ans : 22, 26, 23, 38).

## Décision

Option 4. Les chemins sont l'âge, le revenu moyen par saison dans l'année et la part moyenne versée dans l'année. Le chef est tiré au sort parmi les premiers du chemin tiré : un nouveau paramètre, `chiefCandidates` (3, statut `hypothese`), en donne le nombre. Le revenu remplace la réserve, ce qui est aussi la mesure de la réussite que l'imitation utilise déjà ([0014](0014-imitation-du-revenu.md)), et retire l'avantage de l'âge et de l'héritage. Le reste de 0026 ne change pas.

Les textes du prototype disent le tirage : « Berimi devient chef, par tirage au sort parmi les 3 personnes les plus âgées du village. »

## Conséquences

- **Les faits stylisés et la robustesse ne bougent pas** : le chef reste désactivé par défaut. L'outil de robustesse ne fait pas varier ce paramètre et le dit.
- **L'équilibre ne tient que dans le village mélangé, avec des enfants.** Même mesure, 100 vies par conduite :

  | Village | Enfants | presque rien | un peu | comme mes voisins | beaucoup |
  |---|---|---|---|---|---|
  | mélangé | acceptés | 22 | 13 | 13 | 27 |
  | mélangé | refusés | 21 | 10 | 22 | 49 |
  | 15 % de profiteurs | acceptés | 14 | 8 | 10 | 32 |
  | 15 % de profiteurs | refusés | 16 | 8 | 10 | 42 |

  Avec des profiteurs, le joueur qui ne partage pas dispute les premières places du revenu à des villageois qui ne partagent pas non plus, alors que personne ne dispute au joueur généreux celles de la générosité : le chemin est encombré par ceux qui font comme lui. C'est la composition du village qui parle, pas la règle, mais le joueur ne le voit pas. Sans enfant, le joueur généreux ne connaît plus la faim et vit plus longtemps : il traverse plus de successions. L'écart s'est réduit sans disparaître ; il est à garder en tête dans les textes de fin, qui ne doivent pas en tirer de leçon.
- **Les extrêmes deviennent chefs plus souvent que les modérés** (un peu, comme mes voisins), quel que soit le côté : être le premier d'un chemin est plus facile quand on s'écarte des autres.
- **Le joueur devient chef dans une vie sur quatre à une sur trois** quand il s'écarte des autres, une sur huit environ sinon. Le levier le plus durable d'après [0020](0020-une-vie-puis-l-histoire.md) reste donc rare, et sa rareté dépend de la conduite.

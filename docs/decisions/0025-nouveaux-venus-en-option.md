# 0025. Des nouveaux venus, en option : tirés comme les villageois de départ, sans choix d'accueil

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

La proposition [0020](0020-une-vie-puis-l-histoire.md) retient deux événements extérieurs pour la v1 : une sécheresse ([0024](0024-secheresse-en-option.md)) et l'arrivée de nouveaux villageois. Le moteur n'a aucune arrivée : la population ne change que par les naissances et les morts.

C'est le sujet le plus chargé du jeu. Le brouillon [MOMENTS.md](../MOMENTS.md) l'avait laissé de côté pour cette raison : selon la façon dont on le modélise, le moment dirait quelque chose de ceux qui arrivent, et ce serait un tract ([0001](0001-fable-sans-etiquette-politique.md)).

## Options envisagées

1. **Des nouveaux venus tirés comme les villageois de départ.** Mêmes traits possibles, selon la composition choisie au réglage, même tranche d'âge, même réserve, même croyance de départ (« les autres me ressemblent »). Le moteur ne leur prête rien de particulier ; ce qui arrive ensuite vient des mêmes règles que pour tous.
2. **Des nouveaux venus aux traits différents** (plus ou moins coopératifs que le village). Le moteur affirmerait que les gens venus d'ailleurs se comportent autrement : c'est exactement l'étiquette que le jeu s'interdit, et aucun chiffre sourcé ne le justifierait.
3. **Un choix d'accueil** donné au joueur ou au chef (les laisser s'installer ou non). Le joueur arbitrerait entre le village et des inconnus présentés comme une charge ou une ressource ; le moment ne poserait plus la question de I et Us mais une question politique toute faite. À reconsidérer seulement avec les règles votées de la v2, si on trouve une forme qui ne désigne personne.
4. **Des départs aussi** (des villageois qui partent quand ils ont faim). Une règle de plus, avec son seuil à justifier ; elle viendra peut-être avec la famine, pas ici.
5. **Activer les arrivées par défaut.** Changerait les faits stylisés et reviendrait sur [0015](0015-modele-v1-fige.md).

## Décision

Option 1, désactivée par défaut. Deux paramètres au statut `hypothese` : la probabilité, à la fin de chaque année, que des nouveaux venus s'installent (`arrivalProbability`, 0 par défaut : jamais) et leur nombre (`arrivalSize`, 5). Pour une composition à deux profils, chaque nouveau venu est du premier profil avec la probabilité de sa part (au départ, la part est exacte ; ici, elle n'est vraie qu'en moyenne). Leurs maisons s'ajoutent au bout de l'anneau des maisons ([0023](0023-voisinage-en-option.md)). L'étang ne grandit pas avec eux, comme pour les naissances. Rien n'est tiré quand la probabilité est nulle : la partie reste exactement la même qu'avant (testé). Le moteur compte les arrivées dans ses mesures.

Le prototype d'une vie propose 0,03 par an, une ou deux arrivées dans une vie. Il les raconte sans choix : un récit pendant un chapitre, une ligne de la décennie sinon. Le texte dit « des personnes venues d'ailleurs », donne leurs noms, et rappelle qu'elles suivront les mêmes règles que tout le monde. Il ne dit rien de leurs traits, et ne relie pas leur arrivée à la récolte ou à l'étang, même quand les champs se partagent entre plus d'adultes : ce lien, s'il existe dans une partie, le joueur le voit ou non dans les chiffres de chaque saison, comme pour une naissance.

## Conséquences

- **Les faits stylisés et la robustesse ne bougent pas**, puisque les arrivées sont désactivées par défaut. L'outil de robustesse ne fait pas varier ces deux paramètres et le dit dans son rapport.
- **Les nouveaux venus pèsent comme une naissance d'adultes** : plus de bras, plus de parts du grenier, plus de pêcheurs, et des champs partagés quand le village dépasse leur capacité. Le moteur ne distingue jamais un nouveau venu d'un villageois né sur place, et le jeu ne doit pas le faire non plus dans ses textes ou ses courbes.
- **Leurs noms ne les distinguent pas.** Les noms du prototype venaient de l'identifiant : des nouveaux venus arrivés ensemble partageaient la même fin de nom, comme un clan, et les derniers venus avaient des noms plus longs. Les identifiants sont maintenant mélangés et tous les noms ont trois syllabes.
- **Le mot « étranger » n'est pas employé** dans le jeu : « nouveaux venus », « personnes venues d'ailleurs ». La fiche et le code gardent « nouveaux venus ».
- **Avec deux profils, l'arrivée peut déplacer le mélange par hasard** (cinq tirages à 15 % de profiteurs donnent parfois deux profiteurs, souvent aucun). C'est le même tirage que pour le village de départ ; il ne faut pas lui donner de sens.
- **Si on veut un jour un choix d'accueil**, il faudra une nouvelle fiche, et la relecture de 0001.

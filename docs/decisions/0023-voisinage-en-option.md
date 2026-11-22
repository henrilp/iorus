# 0023. Le voisinage, en option : chacun peut n'observer que ses voisins sur l'anneau des maisons

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Dans le moteur, chacun se fait une idée de ce que font les autres à partir de la moyenne de tout le village. Les mesures de la proposition [0020](0020-une-vie-puis-l-histoire.md) montrent que l'influence d'un joueur y est presque invisible (0,03 sur la part versée par les autres dans un village de 30), et qu'elle devient visible chez ses voisins si chacun n'observe que quelques villageois (0,20 avec deux voisins fixes). Le prototype en texte d'une vie ([0022](0022-le-joueur-conduit-son-villageois.md)) doit pouvoir le montrer.

Changer la règle pour tous reviendrait sur le gel du modèle ([0015](0015-modele-v1-fige.md)) et demanderait de revérifier tous les faits stylisés et la robustesse. On veut pouvoir éprouver le voisinage sans changer le modèle validé.

## Options envisagées

1. **Ne rien changer** : chacun voit tout le village. Le prototype ne montrerait pas l'effet de l'exemple.
2. **Le voisinage pour tous, tout de suite.** Revient sur 0015 avant même de savoir si une vie jouée est intéressante.
3. **Un anneau trié par identifiant**, comme dans les mesures de 0020. Simple, mais un enfant reçoit un nouvel identifiant et se retrouve loin de son parent : la lignée du joueur ne serait pas son voisinage.
4. **Un anneau des maisons, l'enfant à côté de son parent.** Chaque villageois a une maison sur l'anneau ; un enfant prend celle de son parent et se range juste après lui.
5. **Les vraies maisons du plan du jeu** (`src/game/core/layout.ts`). Le moteur n'a aucune notion d'espace et ne doit pas dépendre du jeu ([0002](0002-moteur-pur-deterministe.md)).
6. **Des villageois observés tirés au hasard à chaque saison.** Mesuré dans 0020 : l'influence locale est bien plus faible (0,10 avec deux villageois observés), et il n'y a plus de voisins à qui parler.

## Décision

Option 4, en option. Un nouveau paramètre, `observedNeighbors` (statut `hypothese`), donne le nombre de voisins observés. À 0, sa valeur par défaut, chacun voit tout le village et le moteur se comporte exactement comme avant (testé). Au-dessus de 0, chaque adulte révise ses croyances à partir de ses voisins : les adultes les plus proches sur l'anneau des maisons, alternativement après et avant lui. S'il y a moins d'adultes que de voisins demandés, on revient à tout le village.

Les maisons de départ sont numérotées dans l'ordre des villageois ; un enfant prend la maison de son parent. Le prototype propose 2 voisins par défaut, ou 6, ou tout le village.

## Conséquences

- **Les faits stylisés et la robustesse ne bougent pas**, puisque le voisinage est désactivé par défaut. L'outil de robustesse ne le fait pas varier (une variation proportionnelle de 0 reste 0) et le dit dans son rapport.
- **Le nombre de voisins décide de la force de l'influence locale** (0,20 avec deux voisins, 0,09 avec six dans un village de 30, d'après 0020). Il devra être choisi pour ce que la recherche dit de la taille des réseaux qu'on observe, pas pour rendre le joueur plus puissant.
- **Seules les croyances deviennent locales.** Les sanctions comparent toujours chacun à la moyenne de tout le village, et l'imitation tire toujours son modèle dans tout le village. Des sanctions limitées à ce qu'on a vu, le secret et le poids du statut restent à décider (0020).
- **L'anneau n'est pas le plan du village.** Si le jeu dessine les maisons, il devra placer les villageois dans l'ordre de l'anneau, ou le moteur devra recevoir un vrai voisinage.
- **Si le voisinage devient la règle par défaut**, il faudra une nouvelle fiche, revérifier les faits stylisés et le balayer dans l'outil de robustesse.

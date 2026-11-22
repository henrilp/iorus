# 0030. Une vie à pied : les maisons sur l'anneau du moteur, la saison prévue sur une copie, des gestes qui fixent la ligne de conduite

- Statut : Proposée
- Date : 2026-11-22

## Contexte

La fiche [0020](0020-une-vie-puis-l-histoire.md) propose que le joueur vive une vie au village, à pied pendant cinq chapitres, et que le temps file entre deux. Le prototype en texte (`vie/`, fiche [0022](0022-le-joueur-conduit-son-villageois.md)) a éprouvé les moments ; l'étape suivante prévue par 0020 est de pouvoir se déplacer dans le village, faire les gestes au grenier et à l'étang, et parler aux villageois.

Trois difficultés se posent avant d'écrire le moindre geste :

- **Où sont les voisins.** Le moteur fait observer à chacun ses voisins sur l'anneau des maisons (`Villager.home`, fiche [0023](0023-voisinage-en-option.md)). Le jeu de l'observateur range ses maisons en spirale autour d'un centre (`src/game/core/layout.ts`) : les maisons voisines à l'écran ne sont pas les voisins du moteur. Si le joueur se promène et regarde « ses voisins », il faut que ce soient les mêmes.
- **Un geste dans une saison calculée d'un coup.** Le joueur doit voir sa récolte en sacs avant de décider combien en porter au grenier. Or le moteur calcule la récolte et la part versée dans le même `step()`, et une décision du joueur (`act`) vaut pour le `step()` suivant.
- **Le rythme.** Une saison à pied doit laisser le temps de marcher, sans faire durer une vie des heures (0020 vise des saisons d'environ une minute).

## Options envisagées

Où mettre la vie à pied :

1. Une nouvelle page à côté du jeu : une page de plus à publier et à tenir à jour, pour le même canevas.
2. Remplacer le village de l'observateur : on perdrait le bac à sable que 0020 garde pour après une première vie.
3. Un accueil sur la page `jeu/` qui propose les deux : vivre une vie, ou régler un village et le regarder.

Où placer les maisons :

1. Garder la spirale de l'observateur : les voisins à l'écran ne sont pas ceux du moteur.
2. Donner au moteur une vraie géographie : c'est un changement de modèle, déjà écarté par 0023.
3. Poser les maisons sur un cercle, dans l'ordre de l'anneau du moteur : les voisins du moteur sont les maisons d'à côté. Un enfant prend la maison de son parent (règle du moteur) : chaque emplacement est la maison d'une famille, avec une petite maison de plus par adulte.

Comment montrer la récolte avant le geste :

1. Couper `step()` en deux, la récolte d'un côté et le reste de la saison de l'autre. Mais la récolte et la part de chaque villageois sont tirées l'une après l'autre dans le hasard du moteur : séparer les deux change l'ordre des tirages, donc toutes les parties, et demande de revérifier faits stylisés et robustesse pour une raison d'affichage.
2. Faire valoir le geste pour la saison suivante : on porterait des sacs qui ne comptent pas, ce qui contredit le geste.
3. Prévoir la saison sur une copie : au début de chaque saison, on rejoue la partie (`replay`, avec la graine, les réglages et le journal) et on calcule la saison d'avance. Rien de ce que le moteur tire avant la récolte du joueur, ni ce que font les autres villageois avant les sanctions, ne dépend de ce que le joueur décide pendant la saison : la prévision de sa récolte et des parts des autres est exacte. Le hasard du moteur n'est jamais touché. Le geste fixe ensuite sa ligne de conduite, et le vrai `step()` la suit.

## Décision

L'accueil (option 3), les maisons sur l'anneau du moteur (option 3), la saison prévue sur une copie (option 3).

- **Le moteur ne change pas.** Ni règle, ni paramètre, ni ordre des tirages : `rules.ts`, les faits stylisés et l'outil de robustesse ne bougent pas. La vie à pied utilise la configuration du jeu (`GAME_PARAMS`, fiche [0029](0029-configuration-du-jeu.md)) et la conduite du joueur de 0022.
- **Le plan.** Le grenier commun est au milieu d'une place, les maisons font le cercle autour, un chemin en fait le tour ; deux trouées mènent au champ (au nord) et à l'étang (à l'est). Une maison dont plus personne ne vit reste debout, vide. Le plan est recalculé quand des nouveaux venus ajoutent des maisons à l'anneau. Une petite carte montre tout le village.
- **La journée des villageois.** Même cycle que l'observateur (champ, grenier, étang, retour), le long du chemin. Ce qu'un villageois porte au grenier et s'il lance sa ligne viennent de la prévision : au-dessus de sa tête s'affiche « versé / récolté » quand il dépose sa part. Le partage du grenier, les prises exactes et les sanctions ne se savent qu'à la fin de la saison, quand le moteur l'a calculée.
- **Les gestes.** Au grenier, la récolte s'affiche en sacs (un sac par unité de nourriture, arrondi) ; le joueur choisit combien il en porte, et sa part versée est sacs portés / sacs récoltés. À l'étang, il lance sa ligne de 0 à 5 fois ; son effort de pêche est lancers / 5. Le geste fixe sa ligne de conduite jusqu'au prochain changement ; s'il ne va pas au grenier ou à l'étang, sa ligne de conduite s'applique (0020 : oublier n'est pas un choix). Les valeurs reçues par le moteur sont écrites à côté du geste.
- **Les paroles.** Un villageois ne dit que ce que le moteur sait de lui : sa récolte et ce qu'il verse cette saison, sa prise de la saison passée, sa réserve, sa faim, une amende reçue, et, avec le voisinage, s'il voit ce que fait le joueur (« la saison dernière, tu as versé 4 sacs sur 10 »). Sanctionner se décide face au villageois visé, seulement si le village l'autorise et s'il verse nettement moins que les autres cette saison ; le moteur l'applique aux conditions de 0022.
- **Le rythme** est réuni dans `LIFE_PACING` (`src/game/core/walk.ts`) et affiché dans l'aide : une saison de 75 secondes à pied, le temps arrêté pendant une conversation ou un geste, la possibilité de rentrer dormir pour finir la saison, les chapitres de 0020 (15, 25, 35, 45 et 55 ans, le premier jusqu'à la fin de la première année adulte), 5 lancers au plus, et un délai de 8 saisons avant qu'une même carte revienne.
- **Toute la vie, pas seulement le premier chapitre.** Entre deux chapitres, le temps file ; seules des cartes l'arrêtent : une sanction reçue, la faim, un enfant possible (oui, pas maintenant, jamais), le village qui te choisit comme chef (les règles à poser). Chaque chapitre s'ouvre sur ce qui s'est passé en dix ans et sur ce qui a changé chez les voisins. À la mort, une chronique de cinquante ans, puis la question de 0020. Une vraie question n'a pas de réponse mise en avant ; seul « continuer » est un bouton principal.
- **Les graphismes** sont de petites formes en pixels dessinées au lancement (`src/game/scenes/art.ts`) : aucune image à charger, aucune licence à suivre, rien de repris d'un jeu existant. Les variations (teintes des habits, place des arbres) viennent de l'identifiant, jamais du hasard du moteur.
- **Bilingue** dès maintenant : tous les textes de la vie à pied sont dans `src/i18n/`.

## Conséquences

- **Ce qui est vérifié par les tests** (`src/game/core/walk.test.ts`) : la prévision est exacte quoi que décide le joueur ; les sacs portés et les lancers donnent la part et l'effort annoncés ; le premier chapitre finit à la fin de la première année adulte ; une vie jouée à pied se rejoue exactement depuis son journal ; une vie va jusqu'à la chronique ; deux maisons qui se suivent sur l'anneau sont proches à l'écran.
- **La vie à pied dépend de la décision ouverte de 0029.** Elle montre l'influence du joueur par ses deux voisins observés ; avec cette configuration, trois faits stylisés cassent. Si le nombre de voisins change, ce que disent les villageois change avec lui, sans rien à réécrire.
- **La prévision coûte un rejeu complet** au début de chaque saison à pied : environ 40 ms à 55 ans dans un village de 80 habitants. Si cela gêne, on pourra garder une copie qui avance en même temps que la partie.
- **Les sacs sont arrondis, le moteur non.** Le bilan de la saison donne les nombres du moteur : 4 sacs portés sur 9 peuvent faire 3,8 versés. C'est exact et dit dans l'aide, mais peut surprendre.
- **Moins de moments que le prototype en texte.** Un voisin qui verse moins (moment 7), un voisin qui a faim (9), pas assez pour un enfant (10) et l'étang qui baisse (11) ne sont pas des cartes : ils passent par ce que disent les villageois et par les gestes. Sanctionner à l'étang n'est pas encore proposé face au villageois. À éprouver en jouant.
- **Le bac à sable reste ouvert d'emblée**, depuis l'accueil, alors que 0020 le réservait pour après une première vie. C'est l'outil de mise au point du jeu ; on fermera l'accès quand la vie sera validée.
- **La durée reste à mesurer.** Huit saisons de 75 secondes pour le premier chapitre, dont quatre à 15 ans sans geste : rentrer dormir permet d'abréger. 0020 prévoyait de mesurer la durée sur le premier chapitre.
- **Les maisons du bas de l'anneau sont vues de dos** (leur porte donne vers le chemin, donc au nord) : un choix de dessin, sans effet sur la partie.
- La page `jeu/` garde le village de l'observateur tel quel ; le prototype en texte `vie/` reste le banc d'essai des moments.

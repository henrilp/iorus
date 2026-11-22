# 0022. Le joueur conduit son villageois : ses choix remplacent la règle commune, et un journal permet de rejouer sa vie

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

La proposition [0020](0020-une-vie-puis-l-histoire.md) fait vivre une vie au joueur. Pour l'éprouver, on construit d'abord un prototype en texte (page `vie/`, brouillon [MOMENTS.md](../MOMENTS.md)). Il faut que le moteur accepte les décisions du joueur : jusqu'ici, son villageois suivait la règle commune avec les traits mesurés par l'intro (mode observateur).

Les moments du brouillon demandent quatre choses au moteur : que le joueur décide de sa part et de sa modération, qu'il puisse sanctionner un villageois précis, qu'il puisse refuser d'avoir des enfants, et qu'il commence sa vie à 15 ans chez un parent. Le moteur doit rester déterministe ([0002](0002-moteur-pur-deterministe.md)) et sans constante cachée ([0003](0003-transparence-totale-du-moteur.md)).

## Options envisagées

1. **Traduire les choix en traits** (disposition, influençabilité) et laisser la règle commune décider. Le joueur ne déciderait pas vraiment : sa part varierait avec ses croyances, l'aléa et la peur, et un choix « verser un peu » ne donnerait pas un peu.
2. **Les choix remplacent la règle commune pour son villageois.** Sa part et sa modération sont celles qu'il a choisies, ou sa croyance s'il a choisi « comme mes voisins », sans aléa ni peur.
3. **Option 2, mais avec la peur.** Une sanction reçue pousserait sa part vers celle des autres, comme pour tout villageois. Mais c'est justement la décision qu'on veut laisser au joueur : le moment « une sanction » lui demande s'il change de conduite.
4. **Des mots de la ligne de conduite comme paramètres du moteur** (« un peu » = 0,3 dans le registre). Le moteur recevrait des mots plutôt que des nombres ; le futur geste au grenier (un nombre de sacs) ne passerait plus par là.

## Décision

Option 2.

- **La conduite.** `Simulation.act` reçoit une ligne de conduite : une part (0 à 1, ou « comme mes voisins »), une modération (de même), et l'acceptation ou non des enfants. Elle vaut à partir de la saison suivante, sans aléa ni peur.
- **La sanction.** Le joueur ne sanctionne jamais de lui-même. Il peut vouloir sanctionner un villageois précis, au plus une fois par domaine et par saison, seulement si ce domaine de sanctions est autorisé. Sa sanction passe avant celles des autres, aux conditions des autres : la cible doit être sous la moyenne moins l'écart toléré cette saison-là, ne pas avoir reçu toutes ses amendes ([0021](0021-sanctions-graduees.md)), et il doit pouvoir payer. Sinon elle n'a pas lieu, et le moteur le dit.
- **Les enfants.** Le joueur peut refuser d'avoir des enfants ; s'il les accepte, la règle commune s'applique, sans pouvoir en forcer un.
- **Le début de la vie.** Le villageois du joueur naît en plus du village de départ, enfant d'un villageois assez âgé pour l'avoir eu en âge fertile, à un âge réglable (`playerStartAge`, 15 ans, statut `hypothese`), avec la dot de naissance pour réserve et les traits de son parent à une petite variation près.
- **Ses traits.** Ils ne décident plus de rien pour lui, mais ses enfants en héritent et les autres l'imitent. Ils sont tenus à jour à partir de ce qu'il fait réellement : sa disposition est la moyenne, sur ses saisons adultes, de sa part et de sa modération ; son influençabilité, la part de ses choix « comme mes voisins ». Il n'imite personne, puisqu'il décide.
- **Le journal.** Chaque décision acceptée est inscrite avec la saison où elle a été prise. `replay(config, journal, saisons)` redonne exactement la même partie (testé).
- **Les mots de la ligne de conduite** (« presque rien », « un peu », « beaucoup »…) restent dans le prototype, avec la valeur que reçoit le moteur affichée à côté de chaque mot. C'est une entrée du joueur, comme la position d'un curseur, pas une règle du moteur : l'option 4 est écartée.

Le mode observateur (`config.player`) ne change pas : le jeu actuel l'utilise.

## Conséquences

- **Les faits stylisés et l'outil de robustesse ne bougent pas** : ils se jouent sans joueur. Le rapport de robustesse est identique avant et après ce changement.
- **Le joueur garde un avantage sur les villageois** : il ne fait pas d'erreur et ne cède pas à la peur. Une comparaison entre sa lignée et les autres devra le dire.
- **Un profiteur qui ne cède jamais est écrasé par les sanctions graduées.** Avec les sanctions du grenier et de la pêche, un joueur qui garde tout et pêche le maximum reçoit jusqu'à six amendes par saison, soit 18 de perdu pour une récolte d'environ 10 : dans deux graines sur les trois essayées, il meurt de faim avant 21 ans. Ce n'est pas un défaut du prototype : la règle 0021 plafonne les amendes par tranche d'écart, et un villageois réel céderait à la peur bien avant. Mais le joueur, lui, peut s'obstiner, et c'est une conséquence très visible d'une règle (l'écart toléré de 0,1 comme unité de peine) qui n'est pas sourcée. À surveiller sur le prototype.
- **L'estimation des traits du joueur est une hypothèse.** Un joueur qui fait « comme ses voisins » dans un village chiche reçoit une disposition basse, alors qu'il aurait peut-être versé davantage ailleurs. C'est cohérent avec « ce qu'il a réellement fait », mais ce n'est pas la seule lecture possible.
- **Le moteur garde qui a sanctionné qui** à chaque saison (`last.punishedBy`), pour que le moment « une sanction » donne la parole à un villageois réel. C'est un relevé, sans effet sur la simulation.
- **Le rythme des moments n'est pas dans le moteur.** Âges des chapitres et délais entre deux moments sont des réglages du prototype (`PACING` dans `src/vie/life.ts`), affichés sur la page : ils décident quand le joueur peut changer d'avis.

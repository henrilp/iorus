# 0020. Une vie, puis l'histoire : le joueur vit une vie au village, puis regarde ce qu'il en reste

- Statut : Proposée
- Date : 2026-11-22

## Contexte

Le moteur existe, le squelette du jeu aussi ([0019](0019-squelette-du-jeu.md)). La spec prévoit une intro de petites scènes, un portrait, puis un village qu'on règle et qu'on regarde. Deux faiblesses : le village regardé est passif (on contemple le dilemme sans le vivre), et l'intro est coupée du village (on y choisit, puis on devient un observateur tout-puissant dont le villageois pèse 1 sur 30).

Avant de proposer une autre structure, on a mesuré ce que pèse une seule vie dans le moteur. Mesures exploratoires, hors dépôt : 40 à 60 graines, mêmes graines pour toutes les conditions, village mélangé (disposition 0,5, influençabilité 0,7) ou avec 15 % de profiteurs, 10 ou 30 villageois au départ, valeurs par défaut sauf mention.

- **De son vivant, un villageois influence vraiment les autres.** Un joueur qui verse 80 % au lieu de 20 % fait monter la part versée par les autres de 0,08 (village de 10) ou 0,03 (village de 30), dans toutes les graines. C'est l'effet des influençables, mais il est trop faible pour se voir à l'œil dans un grand village. Le village grossit d'ailleurs vite (de 10 à environ 70 habitants, de 30 à environ 90).
- **Après sa mort, son exemple ne laisse rien.** Sans enfants, les écarts sont nuls dès 60 ans. Rejouer la même graine en changeant ses choix ne montre plus qu'un village qui diverge au hasard.
- **Sa lignée laisse peu de chose.** Le joueur chiche s'enrichit et laisse des dizaines de descendants ; le généreux n'en laisse presque aucun, parce qu'il n'accumule jamais la réserve nécessaire. Cette asymétrie tient quand on divise ou double chacun des paramètres de naissance, d'imitation et de réserve : elle vient du dilemme, pas du calibrage. Mais les enfants, influençables, s'alignent sur le village : l'écart de part versée entre les deux lignées n'est que de 0,08 dans un village de 10 et 0,02 dans un village de 30.
- **Des règles qui lui survivent laissent une trace forte.** Un chef qui installe les sanctions (grenier et pêche) à l'année 10 change durablement le village, si les règles restent après lui : part versée de 0,37 contre 0,14 entre 150 et 200 ans dans le village mélangé de 30, de 0,47 contre 0,05 avec 15 % de profiteurs, dans toutes les graines. C'est cinq à dix fois l'effet de la lignée. Si les règles meurent avec lui, l'effet s'efface en un siècle environ.
- **Ces règles coûtent.** Pendant leur installation, la réserve moyenne baisse de 8 à 11 et le village mélangé de 30 perd environ 5 habitants. Et le moteur sanctionne sans fin, environ un adulte sur dix à chaque saison, parce que la cible est relative (nettement sous la moyenne) : il y a toujours quelqu'un sous la moyenne.
- **Observer ses voisins plutôt que tout le village concentre l'influence sans l'augmenter.** Dans le moteur, chacun voit la moyenne de tous les autres. Si chacun ne voit que quelques villageois, l'influence du joueur sur le village entier ne change pas (environ 0,08 dans un village de 10, 0,03 dans un village de 30). Mais elle se concentre sur ceux qui le voient : avec deux voisins fixes, la part versée par ces voisins monte de 0,20, dans toutes les graines, que le village compte 10 ou 30 villageois au départ. Ceux qui ne le voient pas ne bougent que de 0,02 à 0,03 : l'influence s'atténue avec la distance au lieu de se répandre. Tirer au hasard les villageois observés à chaque saison apporte beaucoup moins (0,10 avec deux villageois observés). La pente du village ne change pas, et l'effet reste nul après la mort. Limite : le voisinage mesuré est un anneau trié par identifiant, pas les maisons.

## Options envisagées

1. **Observateur (la spec actuelle)** : on règle, on lance, on regarde. Simple à faire, mais on ne vit pas le dilemme, et l'intro reste coupée du reste.
2. **Chapitres guidés** : une suite d'expériences courtes (« et si quelques-uns ne jouaient pas comme toi ? »), avec une prédiction avant chacune. Bon pour comprendre, mais l'ordre des chapitres raconte déjà une morale (des profiteurs, puis des sanctions qui sauvent le grenier), et le joueur reste extérieur.
3. **Esprit du lieu** : le joueur n'incarne personne mais intervient (révéler, déclencher des événements). On retombe vite dans un jeu de gestion avec un but implicite, et chaque intervention est un mécanisme à sourcer.
4. **Une vie, puis l'histoire** : le joueur incarne un villageois toute une vie, sans but donné, puis, à sa mort, regarde sans pouvoir agir ce que deviennent sa descendance et le village.

Promesse de fin écartée : « le village devient égoïste et s'autodétruit, ou généreux et résilient ». Le moteur ne la tient pas (aucun village ne s'est éteint dans ces mesures ; un village égoïste survit, plus pauvre), et régler le moteur pour qu'il la tienne serait programmer une morale ([0001](0001-fable-sans-etiquette-politique.md)).

## Décision

Option 4, proposée, à valider par un prototype.

**Pendant la vie.**

- On commence à 15 ans, avant l'âge adulte du moteur (16 ans) : la première année se passe chez un parent, le temps de découvrir le village.
- Aucun but n'est donné. On peut s'enrichir, avoir des enfants, aider le village, ou rien de tout cela.
- Le joueur fixe une **ligne de conduite** pour son villageois (part versée au grenier, retenue à l'étang, sanctionner ou non), qui s'applique saison après saison et qu'il peut changer à tout moment. Le jeu ne le sollicite qu'aux moments qui comptent : une naissance, une famine, un voisin qui triche, un événement.
- Chaque villageois observe ses voisins, pas tout le village : ce qu'il croit des autres se forme sur ce qu'il voit autour de sa maison. L'influence du joueur devient alors visible là où elle agit, chez ses voisins, quelle que soit la taille du village, et elle s'atténue avec la distance. Le joueur voit ce que ses choix font aux autres par la conduite de ses voisins plutôt que par un chiffre global.
- Aucun score de disposition n'est affiché : ce serait un score moral. La disposition transmise aux enfants est estimée en coulisse à partir de ce que le joueur a réellement fait.
- On peut devenir chef. Le pouvoir du chef est d'installer ou de retirer des règles, à commencer par les sanctions qui existent déjà, plutôt qu'un surcroît d'influence. C'est le levier que les mesures montrent comme le plus durable.
- Quelques événements extérieurs, tirés de la graine. Pour la v1, un ou deux seulement, les moins coûteux : l'arrivée d'étrangers (de nouveaux villageois) et une sécheresse (un choc sur la récolte).

**Après la mort.**

- Le temps s'accélère et le joueur ne peut plus rien faire. Une chronique en phrases suit sa lignée et le village.
- La fin ne conclut pas. Elle pose la question de ce qui reste d'une vie : ses enfants, son exemple ou ses règles. La réponse honnête du moteur est surtout les règles, à condition qu'elles survivent à celui qui les a posées.
- On peut revivre une vie dans le même village. La comparaison porte sur ce qui est fiable : le sort du joueur, sa descendance, et les règles laissées. Le reste diverge par hasard et doit être présenté comme tel.

**Ce qui reste du parcours de la spec.** Le portrait non jugeant se fait à la mort, à partir de la vie jouée. Le réglage libre de la population devient un bac à sable, ouvert après une première vie. Les scènes prévues pour l'intro deviennent des moments de la jeunesse du joueur ; celles qui sortent du modèle (partager avec un voisin dans le besoin, échanges répétés à deux) restent du récit et ne nourrissent pas ses traits.

## Conséquences

- **Le moteur doit accepter des choix du joueur** à la place de la règle de comportement de son villageois (part versée, retenue, sanctionner, et peut-être avoir un enfant). La partie devient : graine, réglages et journal des choix ; rejouer ce journal doit redonner la même partie ([0002](0002-moteur-pur-deterministe.md)). Il faudra une fiche à part et la mise à jour de `rules.ts`.
- **Changer les règles en cours de partie** (le chef qui installe les sanctions) demande que le moteur l'expose proprement, au lieu de modifier ses paramètres entre deux saisons comme l'ont fait les mesures.
- **Le chef pose des questions de modèle** : comment on le devient (par la richesse, la confiance ?), et qui lui succède. Sans chefs non joueurs, les règles n'ont plus personne pour les défendre ou les abolir après la mort du joueur. C'est la porte vers les règles votées, prévues en v2.
- **Le jeu suggère maintenant que les sanctions marchent.** Avant de bâtir le chef dessus, il faut :
  - corriger les sanctions sans fin : dans les expériences, elles deviennent rares une fois la coopération installée (à sourcer) ;
  - montrer leurs coûts ;
  - garder en tête que le moteur n'a pas de sanctions antisociales (des tricheurs qui punissent les coopérateurs, Herrmann, Thöni et Gächter, 2008, à vérifier), un oubli qui flatte les sanctions.
- **Le moteur doit connaître le voisinage.** Il n'a aujourd'hui aucune notion d'espace ; le plan du village n'existe que dans le jeu (`src/game/core/layout.ts`). Il faut décider qui est voisin de qui (les maisons, et où vont les enfants), et ajouter au registre le nombre de voisins observés, au statut `hypothese`. C'est un changement de règle, donc une fiche à part, la mise à jour de `rules.ts`, et la revérification des faits stylisés et de l'outil de robustesse. Ce changement revient en partie sur le gel du modèle ([0015](0015-modele-v1-fige.md)), parce que le jeu ne peut pas montrer l'influence du joueur sans lui.
- **Le voisinage ouvre la suite sans la décider** : le secret (tricher sans être vu, donner en secret), des sanctions limitées à ce qu'on a vu (qui pourraient corriger les sanctions sans fin), et le poids du statut (un riche ou un chef plus regardé). Pour la v1, seule l'observation des voisins est proposée ; le secret et le statut restent à décider, le second avec le chef. La réputation individuelle demande des interactions à deux, que le moteur n'a pas : elle reste reportée.
- **Des réglages qui pèsent sur le récit** : le nombre de voisins observés décide de la force de l'influence locale (0,20 avec deux voisins, 0,09 avec six dans un village de 30). Il devra être choisi pour ce que la recherche en dit, pas pour rendre le joueur plus puissant, et sa valeur dite comme une hypothèse.
- **Les mesures restent à intégrer à l'outil de robustesse** si la décision est acceptée : un résultat montré au joueur doit tenir sous les variations des paramètres.
- **À vérifier avec un prototype** : que la ligne de conduite par défaut et les sollicitations rares suffisent à rendre une vie intéressante en une dizaine de minutes.
- Si la proposition est acceptée, la spec est réécrite (parcours du joueur, intro, écran de simulation, fin de partie).

# 0029. La configuration du jeu en un seul endroit, revérifiée par l'outil de robustesse

- Statut : Acceptée (le mécanisme) ; les valeurs restent à trancher, voir Conséquences
- Date : 2026-11-22

## Contexte

Le voisinage ([0023](0023-voisinage-en-option.md)), la sécheresse ([0024](0024-secheresse-en-option.md)), les nouveaux venus ([0025](0025-nouveaux-venus-en-option.md)) et le chef ([0026](0026-le-chef.md), [0027](0027-chemins-du-chef-equilibres.md)) sont désactivés par défaut dans le moteur, pour que les faits stylisés restent ceux de toujours. Le prototype d'une vie les active, avec des valeurs écrites dans son propre code. Les faits n'étaient donc vérifiés que pour un village qui n'a rien de tout cela, alors que le joueur en verra un autre.

## Options envisagées

1. **Activer ces options par défaut dans le moteur.** Le moteur et le jeu ne feraient qu'un, mais les faits stylisés vérifieraient alors un village aux événements tirés au hasard, et le labo perdrait son village de référence.
2. **Une configuration du jeu à part, lue par le jeu, le prototype et l'outil de robustesse.** Le moteur garde ses valeurs de référence ; la configuration du jeu dit ce que le joueur verra, et l'outil revérifie les faits avec elle.
3. **Laisser chaque page choisir ses valeurs.** C'est la situation actuelle : rien ne garantit que ce qui est montré a été vérifié.

## Décision

Option 2. `src/sim/gameConfig.ts` définit `GAME_PARAMS`, les réglages que le jeu applique par-dessus les valeurs par défaut du moteur : 2 voisins observés, sécheresses à 0,04 par an, nouveaux venus à 0,03 par an, un chef. Ce sont les valeurs que le prototype utilisait ; il les lit désormais là.

`pnpm robustness` ajoute une section « Avec la configuration du jeu » : les mêmes vérifications, avec la configuration du jeu comme base, et le même balayage autour d'elle. Les paramètres exclus parce qu'une option était désactivée (le nombre de voisins, la fréquence, la durée et la force des sécheresses, la fréquence et la taille des arrivées) y sont balayés.

Le chef est la seule option que les vérifications n'appliquent pas (`GAME_CHECK_PARAMS`) : les faits sur les sanctions comparent un village avec et sans sanctions fixées d'avance, et un chef qui les change en cours de partie rendrait la comparaison vide. Aucune vérification ne porte encore sur le chef lui-même.

## Conséquences

- **Avec la configuration du jeu, quatre faits sur sept cassent.** Avec 5 graines, comme les tests :

  | Fait | Valeurs par défaut | Configuration du jeu | Casse sous |
  |---|---|---|---|
  | F1 village généreux | tient (0,02) | tient (0,02) | 3 / 154 variations |
  | F2 passager clandestin | tient (0,02) | **casse (−0,03)** | 151 / 154 |
  | F3 sanctions | tient (0,03) | **casse (−0,02)** | 151 / 154 |
  | F4 tragédie des communs | tient (0,03) | **casse (−0,01)** | 97 / 154 |
  | F5 sanctions de la surpêche | tient (0,08) | **casse (−0,02)** | 90 / 154 |
  | F6 invasion | tient (0,26) | tient (0,26) | 2 / 154 |
  | F7 invasion contenue | tient (0,27) | tient (0,29) | 4 / 154 |
  | H1 un village d'égoïstes survit | tient (18,7) | tient (27,7) | 7 / 154 |

- **Le voisinage en est la cause principale.** Mesuré option par option (5 graines) : le voisinage seul casse F2, F3 et F5 ; la sécheresse seule, ou les arrivées seules, cassent F4, qui était déjà le fait le plus fragile. Avec 2 voisins, la contribution décline toujours sans sanction, mais moins vite : de 0,07 en dix ans au lieu des 0,10 que demande le seuil. Un profiteur n'influence que ceux qui le voient : la contagion reste locale, et la différence que font les sanctions rétrécit avec elle.
- **C'est le même mécanisme qui rend l'exemple du joueur visible.** Écart de part versée chez les deux voisins du joueur selon qu'il verse 0,8 ou 0,2 (40 graines, village mélangé) : 0,21 avec 2 voisins observés, 0,15 avec 4, 0,11 avec 6, 0,08 avec 10, 0,03 quand chacun voit tout le village. Avec 10 voisins, les faits tiennent de justesse (marges de 0,00 à 0,02, 10 graines) ; avec 4 ou 6, F2 et F3 cassent encore.
- **Trois voies, à trancher par Henri :**
  1. Garder 2 voisins et dire que, dans le jeu, la contagion des profiteurs est plus lente que dans les expériences de laboratoire. Les seuils des faits ne changent pas ; le rapport les montre cassés, et un texte du jeu ne doit pas présenter ces faits comme reproduits.
  2. Passer à 10 voisins : les faits tiennent, mais l'exemple du joueur ne se voit presque plus chez ses voisins (0,08).
  3. Revoir la définition des faits F2 et F3 pour un village où chacun voit quelques voisins. Dans les expériences citées, les groupes comptent quatre personnes : chacun observe trois autres, ce qui ressemble plus au voisinage qu'à un village de 30 où chacun voit tout le monde. Ce serait changer un seuil ou un scénario : cela demande l'accord explicite d'Henri et une source vérifiée.
- **La tragédie des communs casse sous presque toute configuration avec des événements.** La reformuler, prévu par [0015](0015-modele-v1-fige.md), devient nécessaire.
- **Les tests ne vérifient pas la configuration du jeu.** Un test qui la vérifierait échouerait aujourd'hui ; l'ajouter fait partie de la voie choisie.
- **L'outil de robustesse est plus long** : environ huit minutes et demie au lieu de trois. `--only sweep`, `--only game` et `--only pond` en lancent une seule partie.
- **Le jeu (`jeu/`) n'utilise pas encore cette configuration** : son squelette reste en mode observateur, avec les valeurs par défaut du moteur. Il devra la lire quand il passera à la vie jouée.

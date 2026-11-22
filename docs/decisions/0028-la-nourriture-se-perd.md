# 0028. La nourriture se perd : 2 % de la réserve chaque saison

- Statut : Acceptée
- Date : 2026-11-22
- Remplace en partie : [0015](0015-modele-v1-fige.md) (qui reportait la nourriture qui se perd)

## Contexte

Dans le moteur, la nourriture ne se perd jamais. La fiche [0015](0015-modele-v1-fige.md) avait reporté la question : son effet le plus gênant, fausser l'imitation, était corrigé par [0014](0014-imitation-du-revenu.md), et l'inégalité de patrimoine était déjà présentée comme reflétant surtout l'âge et l'héritage ([0012](0012-mesures-honnetes.md)).

Le prototype d'une vie ([0020](0020-une-vie-puis-l-histoire.md), [0022](0022-le-joueur-conduit-son-villageois.md)) rend la question gênante pour le jeu :

- les réserves montent à plusieurs centaines (130 à 230 à 45 ans selon la conduite), alors qu'il en faut 40 pour avoir un enfant ;
- le choix entre enfants et générosité ne se sent que dans les villages chiches ;
- une sécheresse ([0024](0024-secheresse-en-option.md)) pèse peu sur qui a amassé ;
- refuser les enfants permet d'amasser sans limite.

## Options envisagées

Mesures hors dépôt, mêmes graines pour toutes les conditions.

1. **Ne rien changer.** Le prototype ne montrerait l'arbitrage principal d'une vie que dans certains villages.
2. **Une part de la réserve perdue chaque saison**, après les repas. Plus la réserve est grosse, plus elle perd, comme un grenier qui s'abîme. Mesuré à 1, 2, 3, 5 et 10 % par saison :
   - jusqu'à 3 %, tous les faits stylisés tiennent avec les valeurs par défaut ; à 3 %, la marge de la tragédie des communs tombe à 0,01 ; à 5 %, ce fait casse ; à 10 %, trois faits cassent ;
   - dans l'outil de robustesse (127 variations), la tragédie des communs casse sous 23 variations sans perte, 31 avec 2 %, 40 avec 3 % ; les autres faits ne bougent presque pas.
3. **Un plafond de réserve** (100 ou 60). Les faits tiennent avec de bonnes marges, et l'effet sur les vies est proche de 2 à 3 % de perte. Mais un plafond est un mur sans équivalent concret (où va le surplus ?), et il frappe d'un coup au lieu de grandir avec la réserve.
4. **Une perte plus forte, pour un effet plus visible.** Elle casse les faits : ce serait régler le modèle pour le récit.

## Décision

Option 2, à 2 % par saison (environ 8 % par an), au statut `a-sourcer` : les pertes de stockage des céréales dans les greniers traditionnels sont de cet ordre de grandeur, à vérifier dans une source. La perte s'applique à tous, après les repas et le compte de la faim, à la réserve qui reste. Elle est active par défaut : c'est un changement du modèle de tous, pas une option du prototype.

## Conséquences

- **Le village.** Village mélangé de 30, années 150 à 200, 10 graines : 80 habitants au lieu de 89, réserve moyenne de 40 au lieu de 65 ; les 10 % les plus riches ont plus de 127 au lieu de 211. Aucun village ne s'éteint. Dans un village de villageois identiques, l'inégalité de patrimoine tombe de 0,57 à 0,43 (indice de Gini) : moins d'accumulation par l'âge.
- **Les vies jouées** (40 vies par conduite, réglages du prototype, enfants acceptés, joueur qui ne change jamais de conduite) : la réserve à 45 ans tombe de 130 à 230 à 30 à 50, autour du seuil de 40. Le joueur qui verse « presque rien » a 3,4 enfants au lieu de 4,3 ; celui qui verse « beaucoup », 1,8 au lieu de 2,6. L'écart entre les deux grandit : l'arbitrage se sent dans tous les villages.
- **L'outil de robustesse, avec la perte intégrée** (131 variations, dont celles de la perte elle-même) : tous les faits tiennent avec les valeurs par défaut. La tragédie des communs casse sous 31 variations au lieu de 23 ; la marge du fait « sanctions » passe de 0,06 à 0,03 ; l'hypothèse « un village d'égoïstes survit » garde une marge large (18,7 au lieu de 28,8).
- **La tragédie des communs devient plus fragile.** C'était déjà le fait le plus fragile, parce qu'il repose sur un pic de population (0015). La perte réduit la population et donc la pression sur l'étang.
- **Les mesures du chef sont à refaire.** La fiche [0027](0027-chemins-du-chef-equilibres.md) avait été mesurée sans perte. Avec la perte, 100 vies par conduite, village mélangé avec enfants : le joueur devient chef dans 12 vies (presque rien), 14 (un peu), 15 (comme mes voisins), 34 (beaucoup) ; avec 15 % de profiteurs : 11, 4, 10, 39. L'avantage du chemin de la générosité revient. Une partie vient du banc de mesure lui-même : un joueur qui ne change jamais de conduite et qui ne partage pas meurt souvent de faim, parce que les chefs finissent par autoriser des sanctions qui l'écrasent ([0022](0022-le-joueur-conduit-son-villageois.md)), et traverse donc moins de successions. À reprendre avec des vies jouées par un humain.
- **La mort de faim est fréquente chez les joueurs obstinés**, avec ou sans perte : un joueur qui garde une conduite tranchée et ne change jamais d'avis meurt de faim dans plus de la moitié des vies. À regarder en jouant.
- **Le seuil de naissance (40) et la dot (20) restent inchangés.** Ils ont été choisis sans perte ; avec elle, ils deviennent contraignants pour la première fois. S'ils doivent bouger, ce sera une autre fiche.

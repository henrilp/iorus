# 0012. Des mesures qui ne trompent pas : revenus et patrimoine, répartition, profils

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Trois indicateurs du labo pouvaient faire tirer de fausses conclusions sur I/Us :

- Les inégalités (Gini des réserves) étaient fortes partout, de 0,5 à 0,7, même dans un village de généreux. Le diagnostic l'a confirmé : même sans aucun hasard et avec des enfants gratuits, un village de villageois identiques garde un Gini de 0,61. Les réserves s'accumulent sans limite avec l'âge (la nourriture ne se perd jamais) et l'héritage arrive d'un coup. La courbe mesurait le cycle de vie, pas les comportements, et le lien entre richesse et disposition était quasi nul.
- Les courbes ne montraient que des moyennes. Une disposition moyenne de 0,5 peut venir d'un village homogène ou d'un village coupé en deux.
- Le réglage « deux groupes » laissait croire à une identité de groupe. Or personne ne sait à quel groupe appartient l'autre, personne ne traite les siens différemment, et les deux profils se mélangent dès la première génération.

## Options envisagées

1. Garder les mesures et ajouter des avertissements.
2. Corriger les mesures : séparer les inégalités de revenu de celles de patrimoine, montrer la répartition des dispositions, renommer ce qui est trompeur.
3. Changer le modèle pour que le patrimoine reflète les comportements (nourriture qui se perd, plafond de réserve). C'est peut-être juste, mais ce serait une décision de modèle à sourcer à part, pas une correction de mesure.

## Décision

Option 2.

- Deux courbes d'inégalités : revenus de la saison (récolte gardée, part du grenier, pêche, sanctions, avant les repas), qui reflètent les comportements ; patrimoine, présenté comme reflétant surtout l'âge et l'héritage.
- Une carte de chaleur de la répartition des dispositions dans le temps (tranches de 0,1).
- « Deux groupes » devient « deux profils de départ », avec une explication de ce que ce n'est pas.

## Conséquences

- Le Gini des revenus est bas partout (0,03 à 0,07 en régime établi) : dans ce modèle, les comportements créent peu d'écarts de revenus une fois la population stabilisée. Les écarts viennent surtout des périodes de transition, par exemple pendant une invasion.
- La question de fond reste ouverte : faut-il que la nourriture se perde, ou que les réserves soient plafonnées ? Elle demandera sa propre fiche, appuyée sur des sources.
- Une vraie notion de groupe (coopérer davantage avec les siens, « altruisme de clocher », Choi et Bowles 2007, à vérifier) est un thème naturel de la v2, avec plusieurs villages.

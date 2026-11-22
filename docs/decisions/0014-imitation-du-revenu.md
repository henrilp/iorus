# 0014. L'imitation compare les revenus, pas les réserves

- Statut : Acceptée
- Date : 2026-11-22
- Remplace en partie : [0008](0008-imitation-de-la-reussite.md) (« plus riche » au sens de la réserve)

## Contexte

L'imitation (fiche [0008](0008-imitation-de-la-reussite.md)) faisait copier la disposition d'un adulte « plus riche », c'est-à-dire qui avait une plus grande réserve. Or la fiche [0012](0012-mesures-honnetes.md) a montré que les réserves reflètent surtout l'âge et l'héritage : la nourriture ne se perd jamais, et un village de villageois identiques a un Gini de patrimoine d'environ 0,6. Le seul mécanisme qui fait évoluer les dispositions au cours d'une vie copiait donc en partie les vieux et les héritiers, pas ceux à qui leur comportement réussit. Le fait stylisé de l'invasion reposait sur ce mécanisme.

## Options envisagées

1. Garder la réserve. C'est simple, mais la mesure de la réussite est bruitée par l'âge et l'héritage.
2. Comparer le revenu de la dernière saison. C'est un revenu, mais une seule saison est très bruitée par l'aléa des récoltes.
3. Comparer le revenu moyen par saison de l'année écoulée, l'imitation ayant lieu une fois par an. C'est ce que mesure l'apprentissage biaisé par la réussite dans la littérature (Boyd et Richerson, 1985 ; à vérifier) : on compare des gains, pas des stocks.
4. Une moyenne glissante des revenus, avec une mémoire réglable. C'est plus souple, mais cela ajoute un paramètre non sourcé.
5. Faire perdre une partie des réserves chaque saison, pour que la réserve finisse par refléter les revenus. C'est une décision de modèle à sourcer à part (pertes après récolte) : elle touche aussi les naissances et la survie, pas seulement l'imitation.

## Décision

Option 3. Le revenu est le même que celui de l'indicateur d'inégalités de revenu : récolte gardée, part du grenier, pêche, moins les sanctions données et reçues, avant les repas. Chaque adulte cumule ses revenus de l'année et le nombre de saisons passées adulte. À l'imitation, on compare les revenus moyens par saison, puis les compteurs repartent de zéro. Un adulte depuis moins d'une saison n'imite pas et ne sert pas de modèle. Aucun paramètre n'est ajouté, et aucune valeur n'est changée. La suite des tirages aléatoires est identique.

L'option 5 reste ouverte ; elle demandera sa propre fiche.

## Conséquences

Mesuré avec l'outil de robustesse ([0013](0013-outil-de-robustesse.md)), sur cinq graines, avec 15 % de profiteurs et 200 ans :

- Le modèle devient un peu plus pessimiste, comme prévu : les profiteurs gagnent plus que les autres, et l'imitation les sélectionne désormais plus nettement.
  - Sans sanction, l'invasion est un peu plus rapide : disposition moyenne de 0,20 vers l'an 50 (contre 0,24 avant), 0,03 à la fin (contre 0,05).
  - Avec les seules sanctions du grenier, l'invasion n'est plus arrêtée, mais ralentie : la disposition descend de 0,48 à 0,37 en deux siècles, alors qu'elle se stabilisait vers 0,46.
  - Avec les deux sanctions, l'équilibre tient : environ 0,56 (contre 0,59), part versée 0,45, étang 0,76.
- Tous les tests passent, sans changement de seuil. Le fait « invasion contenue » perd de la marge (0,14 contre 0,21) et devient sensible aux paramètres des sanctions. Il casse désormais si l'amende est divisée par deux, si l'écart toléré est divisé ou multiplié par deux, ou si les choix sont plus bruités (13 variations sur 127, contre 8). C'est cohérent avec ce mécanisme : les sanctions ne contiennent l'invasion que si elles rendent le profit moins rentable que la coopération, ce qui dépend de leur taille. Avant, cette dépendance était masquée par le bruit de l'âge et de l'héritage.
- Les autres faits bougent peu. Les cassures les plus proches du bruit, dues à l'âge de départ ou à l'écart des espérances de vie, disparaissent.
- La fiche 0008 reste valable pour l'essentiel : l'imitation copie la réussite, pas la vertu, et seulement la disposition. Seule la mesure de la réussite change.

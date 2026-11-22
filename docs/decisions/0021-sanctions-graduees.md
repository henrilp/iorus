# 0021. Des sanctions graduées : la peine grandit avec la faute, pas avec la taille du village

- Statut : Acceptée
- Date : 2026-11-22
- Remplace en partie : [0007](0007-sanctions-limitees-au-grenier.md) et [0011](0011-sanctions-de-la-surpeche.md) (le nombre d'amendes qu'un fautif peut recevoir)

## Contexte

Les mesures de la fiche [0020](0020-une-vie-puis-l-histoire.md) ont montré que le moteur sanctionne sans fin : environ un adulte sur dix à chaque saison, pendant deux siècles, alors que dans les expériences les sanctions deviennent rares une fois la coopération installée (à sourcer).

Diagnostic (village mélangé de 30 au départ, sanctions du grenier et de la pêche, années 100 à 150, 10 graines) :

- Moins d'une cible par saison au grenier (0,8), mais 4,4 amendes reçues par saison. Tous ceux qui sont prêts à sanctionner tombent sur le même fautif, qui reçoit en moyenne cinq à six amendes de 3, soit plus qu'une récolte (10). C'est un lynchage, et il grossit avec la taille du village : plus il y a de sanctionneurs, plus la peine est lourde, à faute égale.
- 99 % des cibles ne l'auraient pas été sans l'aléa de comportement : elles passent tout juste sous le seuil (0,116 sous la moyenne pour un écart toléré de 0,1).
- Une seule amende porte déjà la peur à son maximum (amende 3, saturation 3). Les suivantes n'apprennent rien au fautif : elles ne font que l'appauvrir, jusqu'à la faim.

Dans les expériences de biens publics, la sanction reçue grandit avec l'écart à la moyenne des autres (Fehr et Gächter, 2002, à vérifier). Ostrom (1990) range les sanctions graduées parmi les principes des communs gérés durablement. Dans ces expériences, les groupes comptent quatre personnes : un fautif a au plus trois sanctionneurs, quelle que soit la faute.

## Options envisagées

1. **Au plus une amende par fautif, par domaine et par saison.** Supprime le lynchage, et ne change rien à la peur. Mais une amende de 3 ne compense pas ce que gagne un profiteur pur (environ 4,5 par saison) : avec les seules sanctions du grenier, la disposition moyenne ne gagne plus que 0,11 face à l'invasion des profiteurs.
2. **Des sanctions graduées : au plus une amende par tranche d'écart toléré sous la moyenne.** Un fautif juste sous le seuil reçoit une amende ; un profiteur pur, à 0,45 sous la moyenne, peut en recevoir quatre. La peine suit la faute, comme dans les expériences, et ne dépend plus du nombre de sanctionneurs. Aucun nouveau paramètre : l'écart toléré sert d'unité.
3. **Une amende proportionnelle à l'écart**, plutôt qu'un nombre d'amendes : plus fidèle dans la forme, mais il faut un nouveau paramètre (la pente) et changer le rapport coût / amende des expériences.
4. **Un plafond fixe, par exemple trois amendes**, comme dans un groupe de quatre : c'est un nombre de plus, sans lien avec la faute, choisi pour faire tenir un résultat.
5. **Sanctionner sur la réputation** (ce qu'on a observé de quelqu'un sur plusieurs saisons) plutôt que sur une saison : l'aléa compterait moins. Mais c'est la réputation, reportée par [0015](0015-modele-v1-fige.md).
6. **Un seuil absolu** au lieu d'un écart à la moyenne : sans appui dans les expériences, où l'on sanctionne par rapport aux autres.

## Décision

Option 2. Les sanctionneurs prêts (même probabilité qu'avant, au plus une sanction chacun par domaine) se répartissent entre les fautifs, tour par tour, chacun tiré au hasard ; un fautif reçoit au plus partie entière(écart sous la moyenne ÷ écart toléré) amendes. Avec un écart toléré de 0, il n'y a plus de limite.

## Conséquences

- **Le lynchage disparaît.** En régime établi, 0,87 amende par saison au grenier au lieu de 4,4, soit une par fautif. Les sanctions restent permanentes mais rares : environ 1,5 % des adultes par saison. Elles visent presque toujours un écart passager, dû à l'aléa ; c'est la « main qui tremble » des expériences, où la sanction ne disparaît jamais tout à fait.
- **Les sanctions du grenier ne contiennent plus l'invasion des profiteurs ; elles la freinent.** Sur 20 graines, la disposition moyenne après 200 ans gagne 0,19 avec les seules sanctions du grenier (0,34 avant cette fiche). Elle gagne 0,48 avec les sanctions du grenier et de la pêche. L'ancien résultat tenait surtout à l'accumulation des amendes : les profiteurs étaient ruinés, pas dissuadés.
- **Le fait stylisé « invasion contenue » change de scénario.** Il teste désormais les deux sanctions ensemble, avec le même seuil (0,2). Ce changement a été validé par Henri. Ce fait n'a pas de source : c'est un résultat du modèle, et la spec le dit.
- Les autres faits tiennent avec les valeurs par défaut. Robustesse avant et après : voir la section ci-dessous.
- Les chiffres de la fiche [0020](0020-une-vie-puis-l-histoire.md) sur les règles laissées par un chef ont été remesurés avec cette règle.
- L'écart toléré pèse maintenant deux fois : il décide qui peut être ciblé, et combien d'amendes un fautif peut recevoir. Le registre le dit.
- Restent ouvertes : les sanctions antisociales ([0007](0007-sanctions-limitees-au-grenier.md)), et des sanctions limitées à ce que chacun a vu, si le voisinage proposé par [0020](0020-une-vie-puis-l-histoire.md) est adopté.

## Robustesse

`pnpm robustness` avant et après (5 graines, 127 variations d'un paramètre à la fois) :

| Vérification | Avant : marge, casse sous | Après : marge, casse sous |
|---|---|---|
| F3, sanctions du grenier : la contribution se maintient | 0,05, 4 variations | 0,06, 4 variations |
| F5, sanctions de la surpêche : l'étang est mieux préservé | 0,08, 8 variations | 0,07, 11 variations |
| F7, invasion contenue, grenier seul | 0,14, 13 variations | −0,02 : casse avec les valeurs par défaut, et sous 100 variations |
| F7, invasion contenue, grenier et pêche (nouveau scénario) | — | 0,27, 6 variations |

Les autres vérifications ne changent pas. F5 devient un peu plus fragile : il casse en plus quand l'écart toléré double, quand l'âge adulte ou le début de l'âge fertile est multiplié par 1,5, et quand la pente de la coopération conditionnelle est divisée par deux, toujours de peu (au plus 0,03 sous le seuil). Il ne casse plus quand cette pente double.

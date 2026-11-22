# 0006. Premier calibrage : survivre sans partager est possible, les enfants coûtent, l'étang peut renaître

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

La toute première calibration du moteur avait trois défauts, découverts en faisant tourner des scénarios types :

- La consommation (11) dépassait la récolte (10). Sans grenier commun, la survie était arithmétiquement impossible : la mort d'un village d'égoïstes était inscrite dans un chiffre, pas produite par leur comportement. C'était une thèse cachée, contraire à [0001](0001-fable-sans-etiquette-politique.md).
- Les enfants ne mangeaient pas. La population croissait sans coût jusqu'à épuiser l'étang, même dans un village généreux.
- Un étang vidé ne pouvait jamais renaître : la croissance logistique part de zéro, même quand plus personne ne pêche.

## Options envisagées

1. Garder la consommation au-dessus de la récolte, avec l'argument « seul, on ne survit pas ». C'est défendable (chez les chasseurs-cueilleurs, le partage sert d'assurance contre les mauvaises saisons), mais ça impose la conclusion au lieu de la laisser émerger.
2. Faire en sorte qu'un adulte qui ne partage rien couvre ses besoins avec un petit surplus, tandis que le partage crée un surplus bien plus grand. Les écarts entre villages viennent alors des comportements (grenier, pêche), pas d'un seuil de survie.

## Décision

Option 2, avec ces valeurs (toutes au statut « hypothèse ») :

- récolte 10, consommation d'un adulte 8 ;
- les enfants mangent 3 par saison, sur la réserve de leur parent (ou la leur s'ils sont orphelins), et ne travaillent pas ;
- la réserve d'un mort va à ses enfants vivants, sinon elle est perdue ;
- étang de 50 poissons par villageois de départ, pêche maximale de 4, et des poissons venus de la rivière (0,5 % de la capacité par saison) pour qu'un étang laissé en paix puisse renaître.

Le test « un village d'égoïstes survit, plus petit qu'un village généreux » a d'abord été rangé par erreur parmi les faits stylisés. Henri l'a relevé : ce n'est pas un fait observé, c'est un choix. Il a été déplacé dans `calibration-hypotheses.test.ts`, qui accueille désormais les choix de conception testés.

## Conséquences

- Un village d'égoïstes survit mais reste plus petit qu'un village généreux et finit par vider l'étang. Le contraste vient des mécanismes.
- Le choix reste une hypothèse : il est justifié dans la note des paramètres `baseHarvest` et `consumption`, visible dans le labo. Si les sources disent le contraire, on change l'hypothèse et le test avec, par une nouvelle fiche.
- Problème connu : au-delà de 60 à 70 villageois, l'étang s'épuise presque toujours, même avec des sanctions, puisqu'elles ne portent pas sur la pêche (voir [0007](0007-sanctions-limitees-au-grenier.md)). Ce point de calibrage reste à revoir.

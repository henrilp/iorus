# Décisions

Chaque fiche explique une décision importante : le problème, les options envisagées, ce qui a été choisi et pourquoi, et ce que ça implique. Le code dit ce qui est ; ces fiches disent pourquoi c'est ainsi et pas autrement.

Le format s'inspire des ADR (Architecture Decision Records, Michael Nygard) dans leur variante MADR, qui garde la trace des options écartées. C'est ce qu'un lecteur critique voudra voir.

## Règles

- Une fiche par décision, numérotée dans l'ordre (`NNNN-titre-court.md`).
- Une fiche acceptée ne se réécrit pas. Seule sa ligne de statut peut changer. Pour changer d'avis, on écrit une nouvelle fiche qui la remplace, et on met à jour le statut de l'ancienne (« Remplacée par NNNN »).
- La fiche est écrite au moment de la décision, dans le même commit que le changement, et ajoutée à l'index ci-dessous.
- Quand écrire une fiche : voir [AGENTS.md](../../AGENTS.md).

## Modèle

```markdown
# NNNN. Titre de la décision

- Statut : Proposée | Acceptée | Remplacée par [NNNN](NNNN-titre.md)
- Date : AAAA-MM-JJ

## Contexte

Le problème, les contraintes, ce qui a déclenché la décision.

## Options envisagées

1. Option A : ce qu'elle implique, pour et contre.
2. Option B : …

## Décision

L'option retenue et la raison principale.

## Conséquences

Ce qui devient plus facile, plus difficile, ce qu'il faudra surveiller.
```

## Index

| N° | Décision | Statut |
|---|---|---|
| [0001](0001-fable-sans-etiquette-politique.md) | Une fable sans étiquette politique ni argument d'autorité | Acceptée |
| [0002](0002-moteur-pur-deterministe.md) | Un moteur pur, déterministe et séparé du rendu | Acceptée, en partie remplacée par 0018 |
| [0003](0003-transparence-totale-du-moteur.md) | Transparence totale du moteur : registres, statuts, aucune constante cachée | Acceptée |
| [0004](0004-comportement-a-un-seul-trait.md) | Un seul trait I/Us, le suivi des autres dosé par la distance au centre | Remplacée par 0005 |
| [0005](0005-deux-traits-disposition-influencabilite.md) | Deux traits : disposition et influençabilité | Acceptée |
| [0006](0006-premier-calibrage.md) | Premier calibrage : survivre sans partager est possible, les enfants coûtent, l'étang peut renaître | Acceptée, en partie remplacée par 0010 |
| [0007](0007-sanctions-limitees-au-grenier.md) | En v1, des sanctions informelles limitées au grenier | Acceptée, en partie remplacée par 0011 |
| [0008](0008-imitation-de-la-reussite.md) | L'imitation copie la réussite, et seulement la disposition | Acceptée, en partie remplacée par 0014 |
| [0009](0009-publication-publique-adresse-anonyme.md) | Dépôt public, signé avec l'adresse anonyme GitHub | Acceptée |
| [0010](0010-peche-de-schaefer.md) | La pêche suit le modèle de Schaefer | Acceptée |
| [0011](0011-sanctions-de-la-surpeche.md) | Sanctions contre la surpêche, sur le modèle de celles du grenier | Acceptée |
| [0012](0012-mesures-honnetes.md) | Des mesures qui ne trompent pas : revenus et patrimoine, répartition, profils | Acceptée |
| [0013](0013-outil-de-robustesse.md) | Un outil de robustesse : chaque fait est revérifié quand on fait varier les paramètres | Acceptée |
| [0014](0014-imitation-du-revenu.md) | L'imitation compare les revenus, pas les réserves | Acceptée |
| [0015](0015-modele-v1-fige.md) | Le modèle de la v1 est figé : ce qui reste, ce qui est reporté | Acceptée |
| [0016](0016-taille-de-l-etang-au-choix.md) | La taille de l'étang est un réglage du joueur : grand ou petit | Acceptée |
| [0017](0017-premieres-sources-verifiees.md) | Premières sources vérifiées : les chiffres de l'intro et quatre paramètres | Acceptée |
| [0018](0018-phaser-4.md) | Phaser 4 plutôt que Phaser 3 | Acceptée |
| [0019](0019-squelette-du-jeu.md) | Le squelette du jeu : une page à part, l'interface en HTML, le village en Phaser, une saison racontée après coup | Acceptée |
| [0020](0020-une-vie-puis-l-histoire.md) | Une vie, puis l'histoire : le joueur vit une vie au village, puis regarde ce qu'il en reste | Proposée |

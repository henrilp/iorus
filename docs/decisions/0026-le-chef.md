# 0026. Le chef, en option : trois chemins tirés au hasard, et des règles qui lui survivent

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

D'après les mesures de la proposition [0020](0020-une-vie-puis-l-histoire.md), installer des règles qui survivent au joueur est le levier le plus durable d'une vie : les sanctions installées à l'année 10 changent encore le village un siècle et demi plus tard, si elles restent. 0020 en tire un chef dont le pouvoir est d'installer ou de retirer les sanctions, et laisse ouvertes deux questions : comment on devient chef, et ce que font les chefs qui ne sont pas le joueur. Sans eux, les règles n'ont plus personne pour les défendre ou les abolir.

Chaque façon de devenir chef porte une thèse. Si c'est la richesse, le jeu dit que le pouvoir revient à ceux qui ne partagent pas ; si c'est la générosité, il dit que la vertu est récompensée ([0001](0001-fable-sans-etiquette-politique.md)).

## Options envisagées

Pour devenir chef :

1. **Un seul chemin** : l'aîné, le plus riche, le plus généreux, ou un tirage au sort parmi les aînés. Chacun est simple. Les deux premiers sont neutres en apparence, mais le joueur ne serait presque jamais l'aîné d'un village de 90. Les deux suivants portent une thèse. Le tirage au sort est neutre et ne dit rien de personne.
2. **Plusieurs chemins, tirés au hasard à chaque succession** : la personne la plus âgée, la plus riche, ou celle qui a versé la plus grande part de sa récolte dans l'année. Aucun chemin n'est la voie vers le pouvoir ; le joueur peut y arriver en amassant comme en donnant.
3. **Une élection par les villageois.** Il faudrait une règle de vote (sur quoi chacun vote-t-il ?) : c'est la porte des règles votées de la v2, pas ce qu'on veut ici.

Pour les chefs qui ne sont pas le joueur :

4. **Ils décident selon leur disposition** : à son arrivée, un chef autorise chaque domaine de sanctions avec une probabilité égale à sa disposition. C'est la même logique que la propension à sanctionner, qui grandit avec la disposition (Fehr et Gächter, à vérifier). Pas de nouveau paramètre.
5. **Ils ne touchent à rien** : les règles du joueur deviendraient éternelles, ce qui flatte son effet.
6. **Les règles tombent à chaque nouveau chef** : les règles mourraient avec celui qui les a posées.

## Décision

Options 2 et 4, désactivées par défaut. Un paramètre `chiefEnabled` (faux par défaut, statut `hypothese`) donne un chef au village, et `chiefTermYears` (10 ans) fixe la durée du mandat. À la fin de l'année, si la place est libre (au début, à la mort du chef, ou à la fin de son mandat), on tire un chemin, et le chef est l'adulte qui l'occupe. Un chef non joueur décide aussitôt ; ses règles restent jusqu'au chef suivant. Le joueur choisi comme chef décide lui-même, quand il veut pendant son mandat, et peut être choisi à nouveau. Les options de sanctions du réglage ne valent alors qu'au départ, jusqu'au premier chef.

Le prototype d'une vie active le chef par défaut. Il raconte chaque nouveau chef et ses règles ; si c'est le joueur, une carte arrête le temps, rappelle ce que coûte une sanction et ce qui est autorisé, et lui demande quelles sanctions autoriser. Il peut ensuite changer d'avis depuis le panneau des règles.

## Conséquences

- **Les faits stylisés et la robustesse ne bougent pas**, puisque le chef est désactivé par défaut. L'outil de robustesse ne fait pas varier son mandat et le dit.
- **Les chemins ne sont pas aussi faciles l'un que l'autre pour le joueur.** Mesuré sur le prototype (40 vies, village mélangé de 30, 2 voisins observés, enfants acceptés) : un joueur qui verse « beaucoup » devient chef dans 29 vies sur 40, presque toujours comme le plus généreux ; un joueur qui verse « presque rien », dans 13 sur 40, comme le plus riche ; « un peu » ou « comme mes voisins », dans 9 et 10 sur 40. Le plus généreux est facile à devenir parce que les villageois du moteur suivent la moyenne de leurs voisins et qu'une part fixe de 0,7 les dépasse presque tous ; le plus riche est disputé par les anciens et les héritiers. Le jeu dit donc, sans le vouloir, que donner mène plus sûrement au pouvoir. Pistes, à décider : tirer le chef parmi les premiers de chaque chemin plutôt que prendre le premier, ou mesurer la générosité par rapport à ce que versent les voisins.
- **Un joueur sans enfant devient plus facilement le plus riche** : rien ne part en dots ni en repas, et la nourriture ne se perd pas. Dans la même mesure avec les enfants refusés, un joueur qui verse « comme ses voisins » devient chef dans 35 vies sur 40.
- **Les règles changent maintenant au fil de la partie.** Le moteur modifie `sanctionsEnabled` et `pondSanctionsEnabled` dans son état ; les courbes du labo et du jeu qui supposeraient des règles fixes doivent les relire à chaque saison.
- **Le chef n'a pas d'autre pouvoir.** Un grenier qui stocke, des quotas de pêche ou l'accueil des nouveaux venus seraient des règles nouvelles, et la dernière poserait les questions écartées par [0025](0025-nouveaux-venus-en-option.md).
- **Un chef ne sanctionne pas plus qu'un autre** et ne peut pas être visé autrement : son pouvoir ne porte que sur les règles. Le poids du statut (un chef plus regardé, plus imité) reste à décider (0020).

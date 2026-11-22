# 0024. La sécheresse, en option : une année où les champs donnent moitié moins, tirée de la graine

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

La proposition [0020](0020-une-vie-puis-l-histoire.md) prévoit un ou deux événements extérieurs pendant une vie, à commencer par une sécheresse, le moins coûteux. Le brouillon [MOMENTS.md](../MOMENTS.md) en fait un moment grave (15) : les champs donnent moins, et le joueur choisit entre puiser dans sa réserve, verser moins, ou pêcher davantage au risque de vider l'étang. Le moteur n'a aucun événement de ce genre, et son modèle est figé ([0015](0015-modele-v1-fige.md)).

## Options envisagées

1. **Un choc sur la récolte, tiré de la graine** : au début de chaque année, une sécheresse peut commencer avec une probabilité donnée, et dure un nombre fixe de saisons pendant lesquelles la récolte de tous est réduite d'une part fixe.
2. **Une sécheresse écrite pour le joueur**, à un âge choisi. Ce serait un événement d'auteur, placé pour produire un effet, et chaque vie en aurait une au même moment : contraire à l'esprit de 0020, où les événements sont tirés de la graine.
3. **Une sécheresse qui touche aussi l'étang** (croissance du poisson réduite). Plus réaliste peut-être, mais elle retirerait au joueur le seul recours qui fait l'arbitrage du moment : pêcher davantage. C'est un choix de modèle à part, à faire s'il se justifie.
4. **Une récolte qui varie d'année en année selon une météo continue.** Plus riche, mais il faut une forme et des paramètres de plus, et une suite de mauvaises années est plus difficile à lire qu'une sécheresse qui commence et qui finit.
5. **Activer les sécheresses par défaut.** Changerait tous les faits stylisés et reviendrait sur 0015.

## Décision

Option 1, désactivée par défaut. Trois paramètres, au statut `hypothese` : la probabilité qu'une sécheresse commence au début d'une année (`droughtProbability`, 0 par défaut : jamais), sa durée (`droughtSeasons`, 4 saisons, une année) et sa force (`droughtSeverity`, 0,5 : les champs donnent moitié moins). Une sécheresse ne peut pas commencer pendant une autre. Rien n'est tiré quand la probabilité est nulle : la partie reste exactement la même qu'avant (testé). Le moteur signale chaque saison de sécheresse dans ses mesures.

Le prototype d'une vie propose 0,04 par an, environ deux sécheresses dans une vie de 45 ans, et un moment grave quand une sécheresse commence : il arrête le temps, montre ce que les champs ont donné, ce que mange la famille et la réserve, et propose de verser moins, de pêcher davantage, de verser davantage ou de ne rien changer. Personne ne sait d'avance combien de temps elle durera, et le jeu ne le dit pas.

## Conséquences

- **Les faits stylisés et la robustesse ne bougent pas**, puisque les sécheresses sont désactivées par défaut. L'outil de robustesse ne fait pas varier ces trois paramètres et le dit dans son rapport.
- **La force de 0,5 met la récolte sous ce que mange un adulte** (5 contre 8) : ne pas partager ne suffit plus, il faut puiser dans sa réserve, le grenier ou l'étang. C'est voulu pour que le moment pèse, mais ce n'est pas une valeur observée.
- **Le grenier n'amortit rien de lui-même.** Il ne fait que partager ce qui est versé, sans réserve commune : si chacun verse moins pendant la sécheresse, le grenier rend moins à tous. Un grenier qui stocke d'une année sur l'autre serait une règle nouvelle, à envisager avec le chef et les règles du village.
- **Avec le grand étang, la sécheresse se rattrape facilement** en pêchant ; avec le petit, elle peut vider l'étang. Le prototype laisse le choix de l'étang au joueur.
- **Si les sécheresses deviennent la règle par défaut** dans le jeu, il faudra une nouvelle fiche, revérifier les faits stylisés et balayer ces paramètres.

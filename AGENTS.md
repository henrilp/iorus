# I or Us — consignes pour les agents IA

Ce fichier est le point d'entrée de toute session d'IA sur ce dépôt. Il dit quoi lire, quels principes ne se négocient pas, et comment garder une trace des décisions.

## Le projet en deux phrases

I or Us est une fable philosophique jouable dans le navigateur sur la tension entre se préserver soi (I) et préserver le groupe (Us). On règle une population, on lance le temps, on observe ce qui émerge ; le jeu fait réfléchir sans imposer de conclusion.

Il en existe aujourd'hui le moteur de simulation (`src/sim/`), un outil de robustesse en ligne de commande (`src/robustness/`) et un labo de mise au point sans graphismes (`index.html`, `src/lab/`), publié sur https://henrilp.github.io/iorus/. Le jeu (Phaser 4) en est au squelette : réglage, village en formes provisoires et contrôle du temps (`jeu/index.html`, `src/game/`), publié sur https://henrilp.github.io/iorus/jeu/.

## À lire, dans cet ordre

1. [docs/VISION.md](docs/VISION.md) : l'intention à long terme.
2. [docs/SPEC-v1.md](docs/SPEC-v1.md) : ce qu'on construit maintenant.
3. [docs/decisions/README.md](docs/decisions/README.md) : l'index des décisions et leur raison d'être. Lire les fiches liées au sujet traité avant de proposer de changer quoi que ce soit dans ce domaine.
4. `src/sim/rules.ts` et `src/sim/paramSpec.ts` : la source de vérité du modèle (chaque règle avec sa formule, chaque paramètre avec son rôle, ses bornes, son statut et sa justification).

## Principes non négociables

- **Fable, pas tract.** Aucune étiquette politique dans le jeu ni dans ses textes (pas de gauche, droite, libéral, etc.). Les villageois ont des comportements, pas des opinions. Pas de victoire, pas de morale : des conséquences et des questions. Voir [0001](docs/decisions/0001-fable-sans-etiquette-politique.md).
- **Pas d'argument d'autorité.** Les sources sont consultables, jamais brandies. Aucun chiffre n'est présenté au joueur comme un fait observé tant que sa source n'est pas vérifiée : les textes du jeu ne citent que les entrées vérifiées de `src/sources/observed.ts`.
- **Transparence totale du moteur.** Voir [0003](docs/decisions/0003-transparence-totale-du-moteur.md).
  - Aucune constante cachée : tout nombre qui influence la simulation est un paramètre de `src/sim/params.ts`, décrit dans `src/sim/paramSpec.ts` (rôle, unité, bornes, statut `source` / `a-sourcer` / `hypothese`, justification).
  - Tout comportement du moteur est décrit dans `src/sim/rules.ts`, dans l'ordre d'exécution, avec sa formule. Modifier `engine.ts` ou `behavior.ts` sans mettre à jour `rules.ts` dans le même commit est une erreur.
  - Les textes du registre sont en français et en anglais.
- **Faits observés et hypothèses sont séparés.** `src/checks/stylizedFacts.ts` ne contient que des comportements observés dans la recherche ; les choix de conception testés vont dans `src/checks/calibrationHypotheses.ts`. Ces définitions (scénarios et seuils) sont vérifiées par les tests Vitest et par l'outil de robustesse : ne pas les dupliquer ailleurs. Ne jamais assouplir un seuil pour faire passer un changement sans le dire explicitement à Henri.
- **Moteur pur et déterministe.** `src/sim/` n'importe ni Phaser ni le DOM ; tout l'aléa passe par `Rng` (même graine et mêmes réglages donnent la même partie). Voir [0002](docs/decisions/0002-moteur-pur-deterministe.md). Le jeu ne tire jamais dans ce `Rng` pour l'affichage, et la vitesse ne change que le nombre de saisons calculées ([0019](docs/decisions/0019-squelette-du-jeu.md)).

## Décisions : quand et comment écrire une fiche

Écrire une fiche dans `docs/decisions/` (format décrit dans son README) quand on :

- change une règle du modèle ou la forme d'un comportement ;
- change la valeur par défaut d'un paramètre de façon à modifier les résultats visibles, ou en change le statut ;
- fait un choix d'architecture, d'outillage ou de publication difficile à défaire ;
- écarte une option qu'un lecteur pourrait raisonnablement proposer (« pourquoi pas X ? »).

Une fiche acceptée ne se réécrit pas : seule sa ligne de statut peut changer (« Remplacée par NNNN »). Pour changer d'avis, on écrit une nouvelle fiche qui la remplace. La fiche est écrite au moment de la décision, dans le même commit que le changement, et ajoutée à l'index.

## Documentation

- `VISION.md` change rarement ; `SPEC-v1.md` est modifiée sur place pour rester vraie.
- La spec décrit l'esprit du modèle et renvoie au registre pour le détail exact : ne pas y recopier les formules ni les valeurs, elles divergeraient.
- Après tout changement, vérifier que README, spec et fiches de décision restent cohérents avec le code.
- Avant de proposer un changement de modèle ou de valeur par défaut, lancer `pnpm robustness` avant et après : un résultat qui ne tient que pour une valeur précise d'un paramètre non sourcé doit être présenté comme tel.

## Commandes

```bash
pnpm install
pnpm dev        # labo sur http://localhost:5173, jeu sur http://localhost:5173/jeu/
pnpm test       # tous les tests du moteur
pnpm robustness # quels faits tiennent quand on fait varier les paramètres (rapport Markdown)
pnpm typecheck
pnpm build
```

## Git et publication

- `main` est déployée automatiquement sur GitHub Pages à chaque push : faire valider le diff par Henri avant tout commit ou push.
- Les commits sont signés avec l'adresse anonyme GitHub (configurée dans ce dépôt). Ne jamais committer avec une adresse personnelle ni ajouter de secret. Voir [0009](docs/decisions/0009-publication-publique-adresse-anonyme.md).
- Pas de réécriture d'historique sur `main` sans accord explicite.

## Langue

Documentation, commentaires et messages de commit en français. Le jeu est bilingue français / anglais.

# I or Us

Une fable philosophique jouable dans le navigateur sur la tension entre se préserver soi (I) et préserver le groupe (Us).

On règle le mélange de ces deux élans dans la population d'un village, on lance le temps, et on observe ce qui en émerge : richesse, inégalités, état de la nature, règles collectives. Pas de victoire, pas de morale : seulement des conséquences, et des questions.

- [Vision](docs/VISION.md) : le jeu complet, à long terme.
- [Spec v1](docs/SPEC-v1.md) : la première version jouable, « Le village ».

## Développement

```bash
pnpm install
pnpm dev      # labo du moteur sur http://localhost:5173
pnpm test     # tests du moteur, dont les faits stylisés
pnpm build
```

Le moteur de simulation vit dans `src/sim/`, sans aucune dépendance au rendu. La page `index.html` est pour l'instant un labo qui trace les indicateurs d'une partie complète.

Le site est déployé sur GitHub Pages à chaque push sur `main` (activer Pages avec la source « GitHub Actions » dans les réglages du dépôt).

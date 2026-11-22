# I or Us

Une fable philosophique jouable dans le navigateur sur la tension entre se préserver soi (I) et préserver le groupe (Us).

On règle le mélange de ces deux élans dans la population d'un village, on lance le temps, et on observe ce qui en émerge : richesse, inégalités, état de la nature, règles collectives. Pas de victoire, pas de morale : seulement des conséquences, et des questions.

- [Vision](docs/VISION.md) : le jeu complet, à long terme.
- [Spec v1](docs/SPEC-v1.md) : la première version jouable, « Le village ».
- [Décisions](docs/decisions/README.md) : pourquoi le modèle est ainsi et pas autrement.
- Labo en ligne : https://henrilp.github.io/iorus/
- Prototype en texte d'une vie : https://henrilp.github.io/iorus/vie/
- Squelette du jeu : https://henrilp.github.io/iorus/jeu/
- Pour les agents IA : [AGENTS.md](AGENTS.md).

## Développement

```bash
pnpm install
pnpm dev      # labo du moteur sur http://localhost:5173, prototype d'une vie sur /vie/, jeu sur /jeu/
pnpm test     # tests du moteur, dont les faits stylisés
pnpm robustness > robustesse.md   # quels faits tiennent quand on fait varier les paramètres
pnpm build
```

Le moteur de simulation vit dans `src/sim/`, sans aucune dépendance au rendu. La page `index.html` est un labo qui trace les indicateurs d'une partie complète ; `vie/index.html` est un prototype en texte d'une vie au village (code dans `src/vie/`, fiches 0020 et 0022) ; `jeu/index.html` est le jeu (Phaser 4, code dans `src/game/`), pour l'instant un squelette en formes provisoires.

Le site est déployé sur GitHub Pages à chaque push sur `main` (activer Pages avec la source « GitHub Actions » dans les réglages du dépôt).

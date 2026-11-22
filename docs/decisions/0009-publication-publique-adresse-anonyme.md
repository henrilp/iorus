# 0009. Dépôt public, signé avec l'adresse anonyme GitHub

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Le labo doit être déployé sur GitHub Pages, ce qui suppose un dépôt public sur un compte gratuit. Un code ouvert sert aussi le principe de transparence ([0003](0003-transparence-totale-du-moteur.md)). Mais les premiers commits portaient l'adresse e-mail personnelle d'Henri, qui serait devenue visible et collectée par des robots. Et supprimer un dépôt après coup n'efface pas les copies (clones, archives comme Software Heritage ou GH Archive).

## Options envisagées

1. Rester privé et déployer ailleurs (Netlify, Cloudflare Pages, qui acceptent un dépôt privé) : ça protège tout, mais ça cache le code, contre l'esprit du projet.
2. Publier tel quel : simple, mais l'adresse personnelle fuit durablement.
3. Réécrire l'historique avec l'adresse anonyme fournie par GitHub, puis supprimer et recréer le dépôt pour qu'aucun ancien commit ne reste consultable par son identifiant, et seulement ensuite le rendre public.

## Décision

Option 3, appliquée le 22/11/2026, avant toute publication. Les commits sont signés `10577775+henrilp@users.noreply.github.com`, configuré dans ce dépôt. Le dépôt `henrilp/iorus` a été recréé public, avec Pages déployé par GitHub Actions à chaque push sur `main`.

## Conséquences

- L'ancien identifiant de commit renvoie « introuvable » chez GitHub, et aucune trace de l'adresse personnelle ne subsiste dans l'historique.
- Tout push sur `main` publie le site : les diffs sont validés par Henri avant commit ou push.
- À faire par Henri dans ses réglages GitHub (rubrique Emails) : activer « Keep my email addresses private » et « Block command line pushes that expose my email », pour que GitHub refuse tout futur push portant l'adresse personnelle.
- Aucun contenu du dépôt ne prend position politiquement ([0001](0001-fable-sans-etiquette-politique.md)) : la publication n'expose pas Henri sur ce terrain.

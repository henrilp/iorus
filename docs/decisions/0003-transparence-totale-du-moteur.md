# 0003. Transparence totale du moteur : registres, statuts, aucune constante cachée

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Le jeu interpellera des gens qui voudront vérifier que ses conclusions sont honnêtes. Henri l'a formulé ainsi : il faut pouvoir montrer toutes les entrailles du jeu. Le premier labo ne montrait que quelques réglages. Des paramètres décisifs, comme la récolte (10) et la consommation (8), étaient invisibles, et deux constantes étaient même codées en dur (l'âge maximal au départ, un plancher d'espérance de vie).

Une première calibration avait d'ailleurs caché une thèse dans un chiffre (voir [0006](0006-premier-calibrage.md)). Ce genre de biais ne se voit que si tout est exposé.

## Options envisagées

1. Documenter le modèle dans un fichier Markdown à part (le `docs/SOURCES.md` initialement prévu). C'est simple, mais il diverge du code à la première modification.
2. Un registre dans le code, source unique de tout ce qui est montré : chaque paramètre décrit (rôle, unité, bornes, valeur par défaut, statut, justification) et chaque règle écrite dans l'ordre d'exécution avec sa formule. Le labo et le futur « Comment ça marche ? » le lisent directement, et des tests empêchent les oublis.

## Décision

Option 2.

- `src/sim/paramSpec.ts` : le type `Record<keyof SimParams, ParamSpec>` oblige à décrire chaque paramètre (la compilation échoue sinon). Chaque paramètre porte un statut : `source` (vérifié dans une publication), `a-sourcer` (la littérature donne une valeur ou une forme, pas encore vérifiée), `hypothese` (choix de conception).
- `src/sim/rules.ts` : les 16 étapes du moteur, au lancement, chaque saison et chaque année, avec texte et formule ; les paramètres cités entre crochets.
- Tests de transparence : chaque paramètre apparaît dans au moins une règle ; les formules ne citent que des paramètres existants et déclarés ; les valeurs par défaut respectent leurs bornes.
- Le labo a trois onglets (réglages, tous les paramètres avec recherche, règles du moteur) et un bandeau qui liste tout paramètre modifié, pour qu'aucune capture d'écran ne cache un réglage.
- Les textes du registre sont bilingues.

## Conséquences

- Le fichier `docs/SOURCES.md` n'est plus prévu : quand une source est vérifiée, on passe le statut à `source` et on met la référence complète dans la note du paramètre.
- Toute modification du moteur s'accompagne de la mise à jour de `rules.ts` dans le même commit. Le texte doit décrire exactement le code.
- L'honnêteté est mesurable : au 22/11/2026, 0 paramètre sourcé, 5 à sourcer, 32 hypothèses. Le labo l'affiche.
- La transparence a immédiatement servi : la figure de la règle de comportement a révélé un défaut du modèle (voir [0004](0004-comportement-a-un-seul-trait.md)).
- Les simplifications assumées (par exemple, personne ne sanctionne les généreux) sont écrites dans les règles, pas cachées.

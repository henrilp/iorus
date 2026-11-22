# 0017. Premières sources vérifiées : les chiffres de l'intro et quatre paramètres

- Statut : Acceptée
- Date : 2026-11-22

## Contexte

Le portrait de l'intro situe le joueur parmi les comportements observés (« comme environ la moitié des gens »). Aucun chiffre ne peut être montré au joueur comme un fait observé tant que sa source n'est pas vérifiée ([0001](0001-fable-sans-etiquette-politique.md), [0003](0003-transparence-totale-du-moteur.md)). La fiche [0015](0015-modele-v1-fige.md) a aussi fait de la pente de la coopération conditionnelle une priorité : c'est le paramètre de comportement le plus influent selon l'outil de robustesse.

Les sources ont été lues dans leur texte intégral ou leur résumé officiel. Les citations ont été recoupées dans les textes extraits.

## Options envisagées

Pour ranger les chiffres de l'intro :

1. Les écrire directement dans les textes du jeu : la source se perd, et rien n'empêche d'afficher un chiffre non vérifié.
2. Rétablir un fichier `docs/SOURCES.md` : c'est lisible, mais rien ne le relie au code qui affiche les chiffres.
3. Un registre dans le code (`src/sources/observed.ts`), comme ceux des paramètres et des règles. Chaque entrée porte une phrase bilingue, la référence, l'endroit dans la source, une citation, un statut et ses limites. Le jeu passe par `observed(id)`, qui refuse un fait non vérifié.

Pour la pente de la coopération conditionnelle (0,9, statut « à sourcer ») :

1. La ramener à la valeur mesurée (0,425).
2. Garder 0,9 et passer le statut à « hypothèse », en écrivant ce que disent les sources.

## Décision

Option 3 pour l'intro. Le registre contient le don moyen et la répartition au jeu du dictateur (Engel 2011), la part de coopérateurs conditionnels et de passagers clandestins, et le fait qu'on donne un peu moins que les autres (Fischbacher, Gächter et Fehr 2001 ; Fischbacher et Gächter 2010). Il contient aussi le déclin sans sanction et la propension à sanctionner (Fehr et Gächter 2000, 2002). Le résultat d'Ostrom, Walker et Gardner reste « non vérifié » : seule la version de conférence de 1991 a été lue, pas l'article de 1992.

Pour la pente : option 2. Le 0,425 de Fischbacher et Gächter (2010) est une moyenne sur tous les profils, passagers clandestins compris. Dans le modèle, la pente ne s'applique qu'à la part influencée du comportement, et les profiteurs sont représentés par une disposition basse. Les deux nombres ne mesurent donc pas la même chose : remplacer l'un par l'autre serait une erreur de lecture. Aucune source lue ne donne la pente des seuls coopérateurs conditionnels. La forme (« sous la diagonale ») est sourcée, la valeur 0,9 est un choix : son statut devient « hypothèse ».

Trois autres statuts changent, sans changement de valeur :

- Multiplicateur du grenier (1,6) : « sourcé ». C'est le dispositif de Fehr et Gächter (2000) : groupes de 4, rendement marginal de 0,4. La note rappelle que le dilemme est bien plus fort dans un village de 30 adultes.
- Perte infligée par une sanction : « sourcé ». Elle vaut trois fois le coût (Fehr et Gächter 2002, p. 137).
- Coût d'une sanction : « hypothèse ». Son échelle (un dixième de récolte) est un choix ; seul le rapport avec la perte est sourcé.

## Conséquences

- Les scènes de l'intro et le portrait ne peuvent citer que les entrées vérifiées du registre. Deux réserves à respecter en écrivant :
  - La coopération conditionnelle porte sur un pot commun, pas sur le fait de rendre à une personne ce qu'elle a donné. La phrase prévue par la spec (« Tu as rendu ce qu'on t'a donné, comme environ la moitié des gens ») doit être reformulée.
  - Les populations étudiées sont surtout des étudiants occidentaux.
- Point ouvert, à trancher par Henri : 0,9 décrit des suiveurs plus fidèles que la moyenne observée. Avec 0,675, le village généreux ne verse plus 0,7 de sa récolte, et le fait stylisé correspondant casse (voir [0013](0013-outil-de-robustesse.md)). Baisser la pente rendrait le modèle plus pessimiste. Il faudrait alors revoir ce seuil, dont la valeur 0,7 n'est pas sourcée.
- Le résultat d'Ostrom et de ses coauteurs, plus nuancé que ce que disait la fiche [0011](0011-sanctions-de-la-surpeche.md), est à relire dans l'article publié. La sanction seule réduit la surexploitation mais coûte presque autant qu'elle rapporte ; c'est la communication suivie d'une sanction choisie qui donne une efficacité élevée. C'est un argument pour les règles votées de la v2.
- Le jeu de confiance (Johnson et Mislin 2011) n'a pas été retenu : seul un brouillon antérieur à la publication a pu être lu.

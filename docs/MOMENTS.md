# Les moments d'une vie

Brouillon de travail pour la proposition [0020](decisions/0020-une-vie-puis-l-histoire.md) : la liste des moments où le jeu sollicite le joueur pendant sa vie, et ce que chacun fait dans le moteur. Ce document disparaîtra dans la spec si la proposition est acceptée.

## Règles d'écriture

- **Un moment ne fait que présenter une décision que le moteur sait exécuter.** Ses effets sont ceux du moteur, rien d'autre : aucune conséquence écrite à la main (« elle s'en souviendra »). Une scène sans décision possible dans le modèle est un récit avec un seul bouton « Continuer », jamais un faux choix.
- **Celui qui parle est un vrai villageois de la partie** (le parent, un enfant, le voisin le plus proche), avec son nom, et ses répliques sont tirées de l'état du moteur.
- **Les villageois disent ce qu'ils font et ce qu'ils voient, jamais ce qu'il faudrait faire.** « J'ai versé un tiers de ma récolte. Paul, rien. » et non « Il faut punir Paul. »
- **Les coûts sont affichés en nourriture, les traits jamais.** Le joueur voit sa réserve, ce que coûte un enfant ou une sanction ; il ne voit ni sa disposition ni celle des autres.
- **Chaque moment fait sentir un arbitrage entre les leviers** (soi, la descendance, l'exemple, les règles, l'étang), sans bonne réponse.

## La ligne de conduite

Entre deux moments, le villageois du joueur suit sa ligne de conduite, modifiable à tout moment depuis un panneau. Elle est formulée en mots ; chaque mot correspond à une valeur, paramètre du registre au statut `hypothese`.

- **Au grenier** : verser presque rien, un peu, comme mes voisins, beaucoup.
- **À l'étang** : pêcher tout ce que je peux, avec un peu de retenue, comme mes voisins, très peu.

« Comme mes voisins » reprend ce que ses voisins ont fait la saison passée. C'est une façon de choisir d'être coopérateur conditionnel sans que le mot soit prononcé.

Sanctionner ne fait pas partie de la ligne de conduite : c'est une décision prise au cas par cas (moment 5), pour qu'elle ait un visage et un coût. Une ligne « toujours sanctionner » ferait du joueur un sanctionneur plus zélé que n'importe quel villageois du moteur.

## Les moments

Ordre à peu près chronologique. « Moteur » dit ce qui existe déjà et ce qu'il faudrait ajouter (lettres renvoyant à la liste de la fin).

### Jeunesse

**1. Chez le parent (15 ans).** Au lancement. Parle : le parent. Il montre le village et dit ce qu'il fait : « Cette saison j'ai versé 4 au grenier sur 10 récoltés. Il me reste 31. » Récit, pas de choix. Le joueur regarde passer une année. Moteur : le joueur naît enfant d'un villageois existant (D).

**2. Première récolte (16 ans).** À l'âge adulte du moteur. Parle : le parent ou un voisin. « Tu as récolté 10. Moi j'ai versé 4. Les voisins, entre 2 et 6. Tout ce qui est versé est multiplié puis partagé entre tous les adultes. » Choix : la ligne de conduite au grenier. Moteur : la part du joueur vient de son choix (A).

**3. Première pêche (16 ans, saison suivante).** Parle : un voisin à l'étang. « J'ai pêché 3. L'étang est presque plein. » Choix : la ligne de conduite à l'étang. Moteur : A.

### Vie adulte, moments liés à l'état du village

Chacun revient au plus une fois toutes les quelques années (délai propre au jeu, à écrire dans la configuration du jeu et à afficher, puisqu'il décide quand le joueur peut changer d'avis).

**4. Un voisin verse nettement moins que les autres.** Quand un voisin du joueur est sous la moyenne moins l'écart toléré (`sanctionGap`) plusieurs saisons de suite. Parle : un autre voisin. « Paul n'a rien versé depuis trois saisons. Il a reçu sa part du grenier comme nous. » Choix : verser moins moi aussi, ne rien changer, et, si les sanctions sont autorisées au village, le sanctionner (moment 5). Moteur : A, et B pour la sanction. Version pêche : même moment avec la modération à l'étang.

**5. Sanctionner.** Ouvert depuis le moment 4. « Le sanctionner te coûte 1 ; il perd 3. » Choix : oui, non. Moteur : une amende du joueur, avec les mêmes conditions que celles des villageois (cible sous la moyenne moins l'écart, plafond de la sanction graduée, coût et perte du registre) (B).

**6. Tu as été sanctionné.** Quand le joueur reçoit une amende. Parle : celui qui l'a sanctionné. « Tu as versé 1, la moyenne est 4. Je t'ai fait perdre 3, ça m'a coûté 1. » Choix : changer ma ligne de conduite, ne rien changer. Moteur : existe (les villageois sanctionnent déjà le joueur) ; la peur du moteur ne s'applique pas au joueur, c'est lui qui décide (A).

**7. Tu as faim.** Quand la réserve du joueur ne couvre plus un repas. Parle : le parent, un enfant ou un voisin. « Il te reste 5. Tu manges 8 par saison. Après 4 saisons de faim, on meurt. » Choix : verser moins, pêcher davantage, ne rien changer. Moteur : A.

**8. Un voisin a faim.** Quand un voisin du joueur passe une saison de faim. Parle : ce voisin. « Je n'ai plus rien depuis deux saisons. » Choix : verser davantage, ne rien changer. Le moment dit honnêtement ce que vaut l'aide : « Si tu verses 5 de plus, Marthe en reçoit 0,2 : le grenier est partagé entre les 40 adultes. » C'est la version du modèle de la scène « partager avec un voisin dans le besoin » : on ne peut l'aider qu'à travers le pot commun. Moteur : A.

**9. Tu pourrais avoir un enfant.** La première fois que le joueur est en âge fertile avec une réserve au-dessus du seuil (`birthWealthThreshold`). « Ta réserve : 43. Un enfant prend 20 à sa naissance, puis 3 par saison jusqu'à ses 16 ans. » Choix : je veux des enfants, pas maintenant (le moment revient), jamais. Moteur : « je veux » laisse jouer la règle commune (une chance par an tant que la réserve suffit) ; « pas maintenant » et « jamais » l'empêchent (C). Le joueur peut refuser un enfant, il ne peut pas en forcer un.

**10. Pas assez pour un enfant.** Vers 25 ans, si le joueur n'a jamais atteint le seuil. Parle : un voisin du même âge. « J'ai eu mon deuxième cet hiver. » Puis : « Ta réserve : 12. Il en faut 40 pour avoir un enfant. » Choix : verser moins pour amasser, ne rien changer. C'est le dilemme mesuré dans 0020 (le généreux n'a presque pas de descendants) rendu visible. Moteur : A.

**11. Une naissance.** Quand un enfant du joueur naît. Récit : « Ta réserve passe de 46 à 26. » Moteur : existe.

**12. Ton enfant devient adulte.** Quand il atteint 16 ans. Parle : l'enfant. « J'ai versé 3 ma première saison. Les voisins versent entre 2 et 4. » Récit, sans choix : le joueur ne décide pas pour ses enfants. C'est là qu'il découvre que ses enfants ressemblent au village plus qu'à lui. Moteur : existe.

**13. Tes voisins changent.** Quand la part versée par les voisins du joueur a nettement bougé depuis quelques années. Parle : un voisin. « Je verse plus qu'avant. Autour de moi, on verse davantage. » Récit, sans choix, et sans prétendre que c'est grâce au joueur : on montre ce que le voisin voit, le joueur fait le lien. C'est le retour du levier de l'exemple. Moteur : voisinage (E).

**14. L'étang baisse.** Quand le stock passe sous la moitié de la capacité (n'arrive qu'avec le petit étang). Parle : un voisin à l'étang. « J'ai pêché 1 cette saison. Il y a dix ans j'en prenais 3. » Choix : la ligne de conduite à l'étang. Moteur : A.

**15. La mort du parent.** Récit : « Ta mère est morte à 61 ans. Sa réserve, 36, est partagée entre ses 3 enfants : tu reçois 12. » Moteur : existe.

### Événements tirés de la graine

**16. Sécheresse.** Une ou deux fois par vie au plus. Parle : un voisin. « Les champs ont donné moitié moins. » Choix : les deux lignes de conduite (l'étang prend le relais, au risque de le vider). Moteur : nouvelle règle, une baisse de la récolte pendant quelques saisons, avec sa fréquence, sa durée et sa force au registre (F).

### Fin de vie

**17. La vieillesse.** À la fin de l'âge fertile. Parle : un enfant, sinon un voisin. « Tu as 45 ans. Ta réserve : 54. Tes 2 enfants vivent au village. » Récit. Moteur : existe.

**18. La mort.** Récit, puis le temps s'accélère et la chronique commence. Moteur : existe.

## Ce qui reste hors de cette liste

- **Devenir chef**, et installer ou retirer les sanctions. C'est le levier le plus durable d'après 0020, mais on ne sait pas encore comment on devient chef ni qui succède. À laisser hors du premier prototype ; on joue d'abord dans un village dont les sanctions sont fixées au réglage.
- **L'arrivée d'étrangers.** Si le chef peut les accepter ou non, ou si leur disposition diffère de celle du village, le moment devient un tract. S'il est gardé, les nouveaux venus doivent être tirés comme les villageois de départ, le jeu ne doit rien dire de leurs traits, et le joueur n'a pas de choix à faire sur leur venue. Je proposerais de le laisser hors de la v1.
- **Donner à un voisin précis.** Le moteur n'a pas d'échanges à deux. Le moment 8 traduit la scène dans le modèle ; une vraie aide directe demanderait une règle à sourcer.
- **Léguer au grenier avant de mourir.** Ce serait une manière simple de « laisser des ressources », mais la règle n'existe pas (la réserve va aux enfants ou se perd).

## Ce que le moteur doit gagner

- **A. Le joueur décide de sa conduite.** Sa part versée et sa modération viennent de sa ligne de conduite, pas de la règle de comportement, sans bruit et sans peur. La partie devient : graine, réglages et journal des choix ; rejouer le journal redonne la même partie. Déjà prévu par 0020, avec une fiche à part.
- **B. Le joueur sanctionne une cible précise**, une fois, aux conditions des autres villageois.
- **C. Le joueur peut refuser d'avoir des enfants.**
- **D. Le joueur commence à 15 ans, enfant d'un villageois existant**, au lieu d'arriver jeune adulte (règle `player` actuelle).
- **E. Le voisinage** : chacun observe ses voisins, pas tout le village. Prévu par 0020, avec sa fiche et la revérification des faits stylisés. Les moments 4, 8 et 13 en dépendent ; sans lui, « tes voisins » voudrait dire « tout le village ».
- **F. La sécheresse**, nouvelle règle tirée de la graine.

A, B, C et D ne touchent que le villageois du joueur : les faits stylisés, qui se jouent sans joueur, ne bougent pas. E et F changent le modèle de tous.

## Points faibles à garder en tête

- **Le rythme est un réglage caché du jeu.** Le délai entre deux moments décide combien de fois le joueur peut sanctionner ou changer d'avis. Il ne touche pas le moteur, mais il pèse sur la partie : il doit être affiché comme le reste.
- **Le joueur garde un avantage** : il ne fait pas d'erreurs (pas de bruit) et ne cède pas à la peur, contrairement aux villageois. C'est le sens même de « vivre sa vie », mais une comparaison entre sa lignée et les autres doit le dire.
- **Le moment 13 est le seul retour du levier de l'exemple**, et il dépend du voisinage (E). Sans lui, le joueur ne verra jamais que sa conduite compte.
- **Environ quinze à vingt-cinq moments par vie**, avec le temps qui file entre eux. Si les moments liés à l'état du village se déclenchent peu dans certaines parties (village calme, grand étang), la vie sera vide. À mesurer sur un prototype en texte avant de dessiner quoi que ce soit.

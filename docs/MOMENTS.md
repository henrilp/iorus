# Les moments d'une vie

Brouillon de travail pour la proposition [0020](decisions/0020-une-vie-puis-l-histoire.md) : la liste des moments où le jeu sollicite le joueur pendant sa vie, et ce que chacun fait dans le moteur. Ce document disparaîtra dans la spec si la proposition est acceptée.

Un prototype en texte les met à l'épreuve : la page `vie/` (code dans `src/vie/`), sans graphismes ni déplacement. Tous les moments ci-dessous y sont.

## Règles d'écriture

- **Un moment ne fait que présenter une décision que le moteur sait exécuter.** Ses effets sont ceux du moteur, rien d'autre : aucune conséquence écrite à la main (« elle s'en souviendra »). Une scène sans décision possible dans le modèle est un récit avec un seul bouton « Continuer », jamais un faux choix.
- **Le geste fixe la décision, le moteur calcule le résultat.** Aucun jeu d'adresse ne décide d'une récolte ou d'une prise.
- **Celui qui parle est un vrai villageois de la partie** (le parent, un enfant, le voisin le plus proche), avec son nom, et ses répliques sont tirées de l'état du moteur.
- **Les villageois disent ce qu'ils font et ce qu'ils voient, jamais ce qu'il faudrait faire.** « J'ai versé un tiers de ma récolte. Paul, rien. » et non « Il faut punir Paul. »
- **Les coûts sont affichés en nourriture, les traits jamais.** Le joueur voit sa réserve, ce que coûte un enfant ou une sanction ; il ne voit ni sa disposition ni celle des autres.
- **Chaque moment fait sentir un arbitrage entre les leviers** (soi, la descendance, l'exemple, les règles, l'étang), sans bonne réponse.

## Le rythme d'une vie

Cinq chapitres, à 15, 25, 35, 45 et 55 ans, d'environ une année chacun. Pendant un chapitre, le joueur se déplace dans le village et le temps avance à la vitesse de la marche. Entre deux chapitres, dix années passent vite.

- **Pendant un chapitre** : les gestes au grenier et à l'étang, les villageois à qui l'on peut parler, et les moments liés à ce que le joueur voit autour de lui.
- **Entre deux chapitres** : la ligne de conduite s'applique seule. Seuls les moments graves interrompent le passage rapide, par une carte de dialogue ; tout le reste est raconté à l'ouverture du chapitre suivant.
- **À l'ouverture d'un chapitre** : ce qui s'est passé en dix ans, puis ce qui a changé autour du joueur, dit par les villageois.

La mort peut venir entre deux chapitres : la vie s'arrête là, sans chapitre de rattrapage.

## La ligne de conduite

Le villageois du joueur suit sa ligne de conduite, formulée en mots ; chaque mot correspond à une valeur que reçoit le moteur, affichée à côté du mot. Ces valeurs sont un choix du prototype, comme la position d'un curseur, pas une règle du moteur ([0022](decisions/0022-le-joueur-conduit-son-villageois.md)).

- **Au grenier** : verser presque rien, un peu, comme mes voisins, beaucoup.
- **À l'étang** : pêcher tout ce que je peux, avec un peu de retenue, comme mes voisins, très peu.

« Comme mes voisins » reprend ce que ses voisins ont fait la saison passée. C'est une façon de choisir d'être coopérateur conditionnel sans que le mot soit prononcé.

Elle se change depuis un panneau, accessible à tout moment, et par les gestes pendant un chapitre : la récolte s'affiche en sacs, et le nombre de sacs que le joueur porte au grenier fixe sa part, qui devient sa ligne de conduite jusqu'au prochain changement. S'il ne va pas au grenier, son villageois suit sa ligne de conduite : oublier d'y aller n'est pas un choix. Même logique à l'étang avec le nombre de lancers.

Sanctionner ne fait pas partie de la ligne de conduite : c'est une décision prise au cas par cas (moment 8), pour qu'elle ait un visage et un coût. Une ligne « toujours sanctionner » ferait du joueur un sanctionneur plus zélé que n'importe quel villageois du moteur.

## Les moments

« Moteur » dit ce qui existe déjà et ce qu'il faudrait ajouter (lettres renvoyant à la liste de la fin). Les moments liés à l'état du village reviennent au plus une fois toutes les quelques années : ce délai est propre au jeu, écrit dans sa configuration et affiché, puisqu'il décide quand le joueur peut changer d'avis.

### Premier chapitre : 15 ans, jusqu'à la première récolte

**1. Chez le parent.** Au lancement. Parle : le parent. Il montre le village et dit ce qu'il fait : « Cette saison j'ai versé 4 sacs au grenier sur 10 récoltés. Il me reste 31. » Récit : le joueur se promène, suit son parent au champ, au grenier, à l'étang. Moteur : le joueur naît enfant d'un villageois existant (D).

**2. Première récolte (16 ans).** À l'âge adulte du moteur. Parle : le parent ou un voisin, au grenier. « Tu as récolté 10. Moi j'ai versé 4. Les voisins, entre 2 et 6. Tout ce qui est versé est multiplié puis partagé entre tous les adultes. » Geste : porter des sacs au grenier. Moteur : la part du joueur vient de son choix (A).

**3. Première pêche (16 ans, saison suivante).** Parle : un voisin à l'étang. « J'ai pêché 3. L'étang est presque plein. » Geste : lancer sa ligne. Moteur : A.

### Ouverture des chapitres suivants : 25, 35, 45 et 55 ans

**4. Dix ans ont passé.** Récit, en quelques phrases : les naissances et les morts dans sa famille (dont la mort du parent et ce qu'il a laissé : « Ta mère est morte à 61 ans. Sa réserve, 36, a été partagée entre ses 3 enfants : tu as reçu 12. »), les sécheresses, ce qu'est devenue sa réserve, la taille du village. Moteur : existe.

**5. Ce qui a changé autour de toi.** Les voisins du joueur se comparent à ce qu'ils faisaient au chapitre précédent : « Je verse 3 maintenant, j'en versais 5 quand tu avais 25 ans. » ; « J'ai pêché 1 cette saison. Il y a dix ans j'en prenais 3. » Récit, sans prétendre que c'est grâce ou à cause du joueur : on montre ce que les voisins font et voient, le joueur fait le lien. C'est le retour principal du levier de l'exemple, et il peut montrer une érosion autant qu'une contagion, puisque l'imitation copie la réussite. Les nouveaux venus sont présentés par leurs liens (« le fils de Paul »), pour que la comparaison se lise. Moteur : voisinage (E).

**6. Tes enfants adultes (45 et 55 ans).** Parle : chaque enfant adulte, ou le plus âgé. « J'ai versé 3 cette saison. Les voisins versent entre 2 et 4. » Récit, sans choix : le joueur ne décide pas pour ses enfants. C'est là qu'il découvre qu'ils ressemblent au village plus qu'à lui. À 55 ans, il peut avoir des petits-enfants. Moteur : existe.

### Pendant un chapitre adulte

**7. Un voisin verse nettement moins que les autres.** Quand un voisin du joueur est sous la moyenne moins l'écart toléré (`sanctionGap`) plusieurs saisons de suite. Parle : un autre voisin. « Paul n'a rien versé depuis trois saisons. Il a reçu sa part du grenier comme nous. » Choix : verser moins moi aussi, ne rien changer, et, si les sanctions sont autorisées au village, le sanctionner (moment 8). Moteur : A, et B pour la sanction. Version pêche : même moment avec la modération à l'étang.

**8. Sanctionner.** Ouvert depuis le moment 7. « Le sanctionner te coûte 1 ; il perd 3. » Choix : oui, non. Moteur : une amende du joueur, aux mêmes conditions que celles des villageois (cible sous la moyenne moins l'écart, plafond de la sanction graduée, coût et perte du registre) (B).

**9. Un voisin a faim.** Quand un voisin du joueur passe une saison de faim. Parle : ce voisin. « Je n'ai plus rien depuis deux saisons. » Choix : verser davantage, ne rien changer. Le moment dit honnêtement ce que vaut l'aide : « Si tu verses 5 de plus, Marthe en reçoit 0,2 : le grenier est partagé entre les 40 adultes. » C'est la version du modèle de la scène « partager avec un voisin dans le besoin » : on ne peut l'aider qu'à travers le pot commun. Moteur : A.

**10. Pas assez pour un enfant (25 et 35 ans).** Si le joueur, en âge fertile, n'a jamais atteint le seuil de réserve. Parle : un voisin du même âge. « J'ai eu mon deuxième cet hiver. » Puis : « Ta réserve : 12. Il en faut 40 pour avoir un enfant. » Choix : verser moins pour amasser, ne rien changer. C'est le dilemme mesuré dans 0020 (le généreux n'a presque pas de descendants) rendu visible. Moteur : A.

**11. L'étang baisse.** Quand le stock est sous la moitié de la capacité (n'arrive qu'avec le petit étang). Parle : un voisin à l'étang. « Il faut lancer deux fois plus pour la même prise. » Geste : lancer sa ligne, ou changer sa ligne de conduite. Moteur : A.

### Cartes : moments graves, qui interrompent le passage rapide

Ils peuvent aussi arriver pendant un chapitre ; entre deux chapitres, ils arrêtent l'accélération le temps de la carte, puis le temps repart.

**12. Tu as été sanctionné.** Quand le joueur reçoit une amende. Parle : celui qui l'a sanctionné. « Tu as versé 1, la moyenne est 4. Je t'ai fait perdre 3, ça m'a coûté 1. » Choix : changer ma ligne de conduite, ne rien changer. Moteur : existe (les villageois sanctionnent déjà le joueur) ; la peur du moteur ne s'applique pas au joueur, c'est lui qui décide (A).

**13. Tu as faim.** Quand la réserve du joueur ne couvre plus un repas. Parle : un enfant, le parent ou un voisin. « Il te reste 5. Tu manges 8 par saison. Après 4 saisons de faim, on meurt. » Choix : verser moins, pêcher davantage, ne rien changer. Moteur : A.

**14. Tu pourrais avoir un enfant.** La première fois que le joueur est en âge fertile avec une réserve au-dessus du seuil (`birthWealthThreshold`), puis à nouveau s'il a répondu « pas maintenant ». « Ta réserve : 43. Un enfant prend 20 à sa naissance, puis 3 par saison jusqu'à ses 16 ans. » Choix : je veux des enfants, pas maintenant, jamais. Moteur : « je veux » laisse jouer la règle commune (une chance par an tant que la réserve suffit) ; « pas maintenant » et « jamais » l'empêchent (C). Le joueur peut refuser un enfant, il ne peut pas en forcer un. Les naissances elles-mêmes sont racontées à l'ouverture du chapitre suivant, ou sur le moment pendant un chapitre.

**15. Sécheresse.** Environ deux fois par vie en moyenne dans le prototype (une chance sur 25 chaque année), tirée de la graine, sans plafond : certaines vies n'en auront pas, d'autres trois. Parle : un voisin. « Mes champs m'ont donné 5 cette saison. D'habitude, c'est autour de 10. » Choix : verser moins, pêcher davantage (l'étang prend le relais, au risque de le vider), verser davantage, ne rien changer. Moteur : une baisse de la récolte pendant quelques saisons, avec sa fréquence, sa durée et sa force au registre (F, [0024](decisions/0024-secheresse-en-option.md)).

**16. Des nouveaux venus.** Une ou deux fois par vie dans le prototype (3 chances sur 100 chaque année), tirée de la graine. Récit pendant un chapitre, ligne de la décennie sinon : « 5 personnes venues d'ailleurs s'installent au bout du village : Mila, Tobe… Comme tout le monde, elles récolteront, verseront au grenier, pêcheront à l'étang et recevront leur part. » Pas de choix : le joueur ne décide pas de leur venue, et le jeu ne dit rien de leurs traits. Moteur : des villageois tirés comme ceux du départ (G, [0025](decisions/0025-nouveaux-venus-en-option.md)).

### Le chef

**17. Un nouveau chef.** Quand la place est libre (mort du chef ou fin de son mandat de 10 ans), le moteur tire l'un de trois chemins (l'âge, le revenu de l'année, la part de sa récolte versée dans l'année), puis le chef au sort parmi les trois premiers de ce chemin. Récit pendant un chapitre, ligne de la décennie sinon : « Berimi devient chef, par tirage au sort parmi les 3 personnes les plus âgées du village. Désormais, les sanctions sont autorisées au grenier, pas à l'étang. » Moteur : un chef non joueur autorise chaque sanction avec une probabilité égale à sa disposition (H, [0026](decisions/0026-le-chef.md), [0027](decisions/0027-chemins-du-chef-equilibres.md)).

**18. Le village te choisit comme chef.** Carte : le temps s'arrête. « Le sort te désigne parmi les 3 personnes qui ont le plus gagné cette année. Le village te confie cette place pour 10 ans. » Le jeu rappelle ce que coûte une sanction et ce qui est autorisé aujourd'hui. Choix : sanctions au grenier et à l'étang, au grenier seulement, à l'étang seulement, aucune. Pendant le mandat, le joueur peut changer d'avis depuis le panneau des règles. Moteur : H.

### Fin de vie

**19. La mort.** Pendant un chapitre ou entre deux, par la vieillesse ou la faim. Récit : « Ta vie s'arrête à 52 ans. Ta réserve, 30, est partagée entre tes 2 enfants. » Puis le temps s'accélère et la chronique de l'après commence. Moteur : existe.

## Ce qui reste hors de cette liste

- **D'autres pouvoirs du chef** (un grenier qui stocke d'une année sur l'autre, des quotas de pêche, l'accueil des nouveaux venus). Le chef du prototype ne décide que des sanctions ([0026](decisions/0026-le-chef.md)).
- **Décider de l'arrivée de nouveaux venus**, par le chef ou par le village. Le moment 16 n'offre aucun choix : un choix d'accueil, ou des nouveaux venus aux traits différents de ceux du village, en ferait un tract ([0025](decisions/0025-nouveaux-venus-en-option.md)).
- **Donner à un voisin précis.** Le moteur n'a pas d'échanges à deux. Le moment 9 traduit la scène dans le modèle ; une vraie aide directe demanderait une règle à sourcer.
- **Léguer au grenier avant de mourir.** Ce serait une manière simple de « laisser des ressources », mais la règle n'existe pas (la réserve va aux enfants ou se perd).

## Ce que le moteur doit gagner

A à D sont faits ([0022](decisions/0022-le-joueur-conduit-son-villageois.md)) ; E, F, G et H le sont en option, désactivés par défaut ([0023](decisions/0023-voisinage-en-option.md), [0024](decisions/0024-secheresse-en-option.md), [0025](decisions/0025-nouveaux-venus-en-option.md), [0026](decisions/0026-le-chef.md)).

- **A. Le joueur décide de sa conduite.** Sa part versée et sa modération viennent de sa ligne de conduite ou de ses gestes, pas de la règle de comportement, sans bruit et sans peur. La partie devient : graine, réglages et journal des choix ; rejouer le journal redonne la même partie. Déjà prévu par 0020, avec une fiche à part.
- **B. Le joueur sanctionne une cible précise**, une fois, aux conditions des autres villageois.
- **C. Le joueur peut refuser d'avoir des enfants.**
- **D. Le joueur commence à 15 ans, enfant d'un villageois existant**, au lieu d'arriver jeune adulte (règle `player` actuelle).
- **E. Le voisinage** : chacun observe ses voisins, pas tout le village. Prévu par 0020, avec sa fiche et la revérification des faits stylisés. Les moments 5, 7 et 9 en dépendent ; sans lui, « tes voisins » voudrait dire « tout le village ».
- **F. La sécheresse**, nouvelle règle tirée de la graine.
- **G. Les nouveaux venus**, tirés comme les villageois de départ.
- **H. Le chef**, qui décide des sanctions autorisées.

A, B, C et D ne touchent que le villageois du joueur : les faits stylisés, qui se jouent sans joueur, ne bougent pas. E, F, G et H changent le modèle de tous. Les chapitres, eux, ne demandent rien au moteur : le jeu décide seulement quand il calcule vite et quand il laisse le joueur agir.

## Points faibles à garder en tête

- **Le moment 5 est le seul vrai retour du levier de l'exemple**, et il dépend du voisinage (E). Sans lui, le joueur ne verra jamais que sa conduite compte.
- **Le rythme est un réglage caché du jeu.** Le délai entre deux moments et la place des chapitres décident combien de fois le joueur peut sanctionner ou changer d'avis. Ils ne touchent pas le moteur, mais ils pèsent sur la partie : ils doivent être affichés comme le reste.
- **Le joueur garde un avantage** : il ne fait pas d'erreurs (pas de bruit) et ne cède pas à la peur, contrairement aux villageois. C'est le sens même de « vivre sa vie », mais une comparaison entre sa lignée et les autres doit le dire.
- **Geste et ligne en mots ne parlent pas la même langue.** Le geste donne une part précise (4 sacs sur 10), la ligne de conduite des mots, dont « comme mes voisins », qui n'est pas une part fixe. Le panneau affichera la part choisie par le geste sous le mot le plus proche ; « comme mes voisins » ne s'obtient que depuis le panneau ou un dialogue. À éprouver sur le prototype.
- **Dix ans entre deux chapitres, c'est long.** Le village double ou triple, les voisins changent. Si les repères (sa maison, les maisons voisines, les liens de parenté) ne suffisent pas, l'ouverture de chapitre sera une liste d'inconnus.
- **La durée** : cinq chapitres d'un an, avec des saisons d'environ une minute, font une vingtaine de minutes, plus les cartes. À mesurer sur le premier chapitre.
- **Une vie peut être vide** si les moments liés à l'état du village se déclenchent peu (village calme, grand étang). À mesurer sur un prototype en texte avant de dessiner quoi que ce soit.

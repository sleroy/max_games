# L'étang du Bois Neuf — Jeu de Pêche 3D

Un jeu de pêche en 3D réalisé avec [three.js](https://threejs.org/).

## Lancer le jeu

Le plus simple, pour jouer tout de suite :

```bash
./launch.sh
```

Ce petit script démarre un serveur local **et ouvre le navigateur automatiquement**
(il choisit aussi un port libre s'il y en a déjà un d'occupé).
Pour arrêter le jeu : `Ctrl+C`.

> Sur certaines distributions, un double-clic sur `launch.sh` le lance directement
> dans un terminal.

Sinon, à la main (le jeu doit être servi par un serveur HTTP : modules ES + WebGL
nécessitent une origine `http://`) :

```bash
cd peche_game
python3 serveur.py 8000
```

Puis ouvrir : <http://127.0.0.1:8000/index.html>

> `serveur.py` envoie `Cache-Control: no-store` : le navigateur redemande toujours
> la **dernière** version des fichiers. C'est important, car avec un serveur qui
> laisse le cache faire, le navigateur peut resservir un vieux `sound.js`… et le
> jeu plante alors avec `sound.setRain is not a function`. En dépannage, un
> **rechargement forcé** (`Ctrl+Shift+R`, ou `Cmd+Shift+R` sur Mac) règle le
> problème.

Fonctionne dans Firefox et Chrome (WebGL requis).

## Commandes

- **Clic gauche sur l'eau** : **clique et maintiens** pour viser (une jauge de puissance oscille), puis **relâche au bon moment** : plus la puissance est forte, plus tu lances loin (le vent décale le lancer).
- **Choisis ton bouchon** (liste « Bouchon **équipé** » ou **boutique** du carnet) :
  **Anglaise** (longue tige, très sensible), **Waggler** (court, se couche sur le côté),
  **Pose à coulisse**, **Bolognaise** (gros, peu sensible). Plus le bouchon est sensible,
  plus la **fenêtre de ferrage** est longue… mais plus il montre de **fausses touches** !
  Les autres bouchons (à **capacités spéciales**) s'achètent avec l'**expérience**.
- **Attendre qu'un poisson morde** : le bouchon reste presque **immobile** (il suit
  seulement la houle) pendant **3 à 8 s** — et la pause entre deux mouvements peut durer
  jusqu'à **8 s** : c'est la patience du pêcheur. Puis il bouge **d'un coup**, en **0,1 à
  0,3 s** comme un vrai bouchon qui disparaît sous l'eau, et c'est **ce mouvement qu'il
  faut lire**. Avant LA bonne touche, le poisson en fait **2 ou 3 fausses**, brèves elles
  aussi (0,4 à 0,7 s) : chacune
  a **son dessin propre** (vitesse, fréquence des petits coups, **inclinaison** et **dérive**
  différentes), avec un « Ça bouge… » et **deux ronds sur l'eau** pour les repérer de loin.
  Comme au bord de l'eau, le bouchon est plombé : un poisson
  qui **soulève** l'appât le fait **monter** (« ascenseur »), un poisson qui tire le fait
  **plonger** ou **partir de côté**. Il y a **18 touches au catalogue** — des **fausses**
  (frémissement, tapotement, danse du bouchon, enfoncement partiel, fausse remontée,
  couchage manqué, dérive, deux coups, touche hésitante, il tourne sur place) et les
  **vraies** (coulée franche, ascenseur, coulée lente et lourde, il file sous l'eau, il se
  couche franchement, enfoncement sec, remontée sèche, touche à la volée). Chaque poisson a
  ses habitudes : un petit poisson tapote, un gros coule lentement… Le carnet contient la
  **fiche « Reconnaître les touches »** qui les décrit toutes : à toi de les reconnaître
  en vrai !
  Si tu laisses passer LA touche, le poisson recrache l'hameçon et des **ronds rouges
  concentriques** s'écartent du bouchon pour te montrer que tu l'as **ratée**.
- **Ferrer au bon moment** : clique pile pendant la vraie touche → **tu démarres avec
  l'avantage** (le poisson est tout près). Trop tôt (sur une fausse touche) ou trop tard
  (juste après la fenêtre) → **le poisson est quand même ferré, mais avec l'avantage**.
  Si tu laisses vraiment passer, il recrache l'hameçon.
- **Épreuve de force** : tourne la manivelle pour ramener le poisson (la barre suit la longueur de fil sortie). **Le poisson se défend pour de bon** : même un gardon tire en continu et donne des coups brusques — un combat dure **3 à 15 s** selon le poisson et ta vitesse de manivelle (trop lent = la ligne casse ou le temps file). Il **se fatigue** au bout de quelques secondes (ses tirades faiblissent de 60 %) : c'est le moment d'accélérer. Quand le poisson tire, la ligne recule : il faut regagner la distance perdue. **Seule la manivelle fait revenir le poisson.** Si la ligne est trop tendue (zone hachurée à droite), **maintiens « 🔓 Lâcher du fil »** : le frein patine, la ligne ne casse pas, mais le poisson reprend de la distance.
- **Manivelle** (en bas à droite **dès que la ligne est à l'eau**) : fais glisser la poignée en cercle pour ramener la ligne — pour relancer ailleurs, ou pendant l'épreuve de force et la remontée. Un tour complet ramène environ 1 m de fil : plus le lancer est loin, plus il faut de tours.
- **🧺 Bourriche** : quand le poisson arrive au bord, tu le gardes **en main** ; il faut
  alors le **lancer dans la bourriche** (même principe que l'amorce : appuie, maintiens,
  relâche quand la jauge passe sur le repère). Réussi → +1 point et la prise est notée
  dans le carnet ; raté → le poisson retombe à l'eau (aucun point).
- **On peut pêcher TANT QUE LE BOUCHON EST À L'EAU** : un poisson peut mordre à tout
  moment, **même pendant la remontée de la ligne** ! Et si tu ne touches plus à la
  manivelle, la ligne **revient toute seule** après quelques secondes : tu ne restes
  jamais bloqué en mode « remontée ».
- **La ligne peut remonter seule pendant l'attente** : si **aucun poisson n'est venu en
  20 s**, le jeu ramène la ligne pour ne pas te laisser planté. Il **prévient 3 s avant**
  (« la ligne va remonter TOUTE SEULE dans 3 s ») puis explique (« aucun poisson en 20 s »).
  Un poisson qui renifle l'esche **prolonge** l'attente, et le vent ne fait jamais dériver
  le bouchon à plus de **2 m** du point de lancer (la ligne est tenue).
- **📖 Carnet de pêche** (bouton à côté du pêcheur), en **5 onglets** : **🐟 Prises**
  (prises, poids, record, fiche des espèces et **carte de l'étang**), **🐟 Espèces**
  (les **16 poissons un par un** : silhouette, taille et poids réels, zone de profondeur,
  comportement, abondance et **tes records** — navigation « Précédent / Suivant »),
  **🧺 Boutique** (bouchons à acheter/équiper), **🎣 Touches** (comment reconnaître les 17
  mouvements du bouchon) et **⚙️ Options** (difficulté, effets, reflets, gros texte,
  animations calmes).
  La **carte** est dessinée d'après le vrai étang : le lac, les fosses, les **nénuphars**
  (placés au hasard), le pêcheur, la bourriche et le bouchon, avec les espèces de chaque
  zone de profondeur.
- **⭐ Expérience (XP) et 🎣 boutique de bouchons** : chaque poisson rangé dans la
  bourriche rapporte de l'**expérience** (plus le poisson est lourd, plus il rapporte).
  Dans le carnet, la **boutique** permet d'**acheter** des bouchons aux **capacités
  spéciales** : **Plume d'oie lumineuse** (visible la nuit), **Bouchon truqué** (beaucoup
  moins de fausses touches), **Waggler plombé** (combat plus long, poisson moins combatif)
  et **Bouchon du maître** (polyvalent + 50 % d'expérience). On équipe un bouchon d'un clic
  et l'expérience comme les bouchons achetés sont **sauvegardés** dans le navigateur.
  ⚠️ **Prends garde aux nénuphars** : si la ligne s'y accroche et **casse**, le bouchon
  équipé **part avec elle**. Un bouchon **acheté** est alors **perdu** (il quitte le sac et
  il faudra le **racheter** avec de l'expérience) ; les bouchons **de départ** ne coûtent rien.
- **Bouton pause** (⏸) : fige le jeu (et le bouton plein écran ⛶ en dessous).
- **Bouton son** (🔊) : couper / réactiver les effets sonores.
- **Bouton 🥣 Nourrir (amorçage)** : clique une fois sur le bouton pour armer le mode,
  puis **clique et maintiens** sur l'eau pour viser (une jauge de puissance s'affiche et
  oscille), et **relâche** pour lancer la boule. Plus la puissance est forte, plus la boule
  va loin ; le vent la décale. En tombant, elle crée un **nuage de miettes** qui attire les
  poissons alentour (le nuage dérive un peu avec le vent).

## Fonctionnalités

- Scène 3D : étang, rive, arbres, roseaux, rochers, nénuphars, ciel dégradé, nuages, soleil.
- Pêcheur 3D avec canne, ligne courbe et bouchon muni d'un hameçon.
- 20 poissons de 4 formes différentes, avec taille, force, agressivité et poids variables.
- **Vent** aléatoire : déplace le bouchon, décale le lancer, fait bouger les nuages, indiqué par une **girouette 3D** et une **jauge**.
- **Poissons discrets** : ils **ne se voient pas** dans l'étang (comme dans la vraie vie !).
  Seuls leurs **bulles** et leurs **sillages** trahissent leur présence. Pendant l'épreuve de
  force, le poisson **apparaît par intermittence** quand il remonte près de la surface, puis
  **replonge et disparaît** ; une fois le combat **gagné**, il reste **visible**.
- **Eau transparente et vivante** : surface animée par une houle dont l'amplitude et la vitesse suivent le vent, bouchon qui flotte sur les vagues, poissons nageant à des profondeurs différentes et remontant vers l'hameçon pour mordre.
- **Types de bouchons** (Anglaise, Waggler, Pose à coulisse, Bolognaise) avec **sensibilité
  à la touche**, **fausses touches**, **deux types de vraies touches** (enfoncement /
  remontée) et **avantage au ferrage** (parfait = avantage au joueur, trop tôt/trop tard =
  avantage au poisson).
- **Vue réaliste** (plus aucun zoom) : on surveille son **bouchon de loin**, comme au bord
  de l'eau, et c'est à l'œil (et à l'oreille : le « ploc » du bouchon) qu'on repère la
  **vraie touche**. Des **messages flottants** dans la scène 3D disent ce qui se passe
  (« Un poisson s'approche… », « Ça bouge… », « FERRÉ ! », « Trop tôt ! ») et, quand une
  touche est **ratée**, des **ronds rouges concentriques** s'écartent du bouchon. Le bouchon
  a été un peu **agrandi** (et ses mouvements amplifiés) pour rester lisible de la berge.
- **Épreuve de force** : on ramène le fil à la manivelle (un tour ≈ 1 m), le poisson reprend du fil quand il tire — la résistance suit sa taille, sa combativité et son agressivité, et il finit par se fatiguer ; temps limite proportionnel à la distance du lancer.
- **Accrochage dans les nénuphars** : la ligne peut casser… et le **bouchon part avec
  elle** ! Un bouchon **acheté** est alors perdu (il faudra le racheter), et on repêche
  avec un bouchon de départ.
- Les poissons perdus deviennent plus agressifs, plus rapides et plus rouges.
- **Manivelle** (tours proportionnels à la distance) pendant l'épreuve de force et la remontée.
- **Amorçage (boule de nourriture)** : bouton « Nourrir », visée au maintien de la souris
  (ou du doigt), jauge de puissance oscillante avec un repère à atteindre, lancer en arc
  influencé par le vent, puis nuage de miettes qui attire les poissons — avec une animation
  d'épaule du pêcheur.
- **Rendu plus « photo »** : tone mapping ACES, lumière hémisphérique, ombres plus
  propres, **éclairage d'environnement (IBL)** pour de vrais reflets sur les matériaux,
  **cycle jour/nuit** (le soleil décrit un arc, le ciel et les couleurs changent), houle
  de l'eau qui suit le vent.
- **Effets visuels** : post-traitement maison (léger « bloom » + vignette), activable ou
  non depuis le carnet, **désactivé par défaut sur mobile** et **désactivé
  automatiquement** si le rendu échoue.
- **Qualité automatique** : la résolution s'adapte toute seule si les images baissent
  (et remonte quand ça va mieux) → 60 images/s visées.
- **Interface rangée** : la barre d'outils du pêcheur (🥣 Nourrir, 📖 Carnet, compteur)
  est **fixe en bas à gauche**, à côté du pêcheur, et **disparaît pendant l'action**
  (ferrage, combat, remontée, lancer) pour ne rien masquer.
- **Canne vivante** : la canne **plie** quand le fil est tendu et la ligne se raidit.
- **Poissons plus vivants** : ondulation du corps, inclinaison dans les virages,
  sillage près de la surface, **éclaboussures** au ferrage.
- **Décor optimisé** : arbres, roseaux et rochers en *instancing* (un seul appel de
  dessin), ce qui laisse de la marge pour la végétation.
- **Zones de profondeur réalistes** : chaque espèce nage dans SA tranche d'eau (ablette et
  gardon près de la surface, carpe et tanche sur le fond, sandre et silure dans les fosses)
  et **reste dans son coin d'étang** (un sandre ne traverse pas tout l'étang).
- **Profondeur réglable (⬆️ Moins profond / ⬇️ Plus profond)** : deux **gros boutons**
  illustrés (56 px de haut sur mobile/tablette, faciles à toucher pour les enfants) ; la
  longueur de ligne va de 0,3 m à **3,2 m** selon le bouchon (la pose à coulisse descend
  le plus bas, l'anglaise s'arrête à 2 m), au pas de **12,5 cm** : le panneau affiche en
  clair la plage du bouchon équipé (« Anglaise : 0,3 m à 2,0 m ») pour comprendre la limite. Une **coupe de
  l'eau** en direct (en bas à gauche) montre le **bouchon en surface, le fil, l'hameçon à
  SA profondeur et le fond de l'étang** à l'endroit pêché : le point rouge = l'hameçon est
  dans la vase. Le bouchon 3D et son bas de ligne sont dessinés à la bonne distance, et
  **seuls les poissons dont la tranche d'eau contient l'hameçon mordent** : ligne courte
  pour les gardons, longue pour les carpes !
- **Un vrai bassin + une carte qui aide** : le fond est modelé (0,7 m au bord, 2,5 m au
  centre, deux fosses à 3,3 m). La **carte du carnet est teintée par la profondeur** (plus
  c'est foncé, plus c'est profond), écrit les **courbes 1 m et 2 m**, repère les **fosses**
  et donne la **profondeur sous le bouchon** (« Ici : 2,4 m d'eau · hameçon à 1,3 m »).
  Si la ligne est plus longue que l'eau, l'hameçon **s'ACCROCHE dans la vase** — même
  mini-jeu que les nénuphars (clic pour le dégager) : on réessaie plus court. Pêcher
  profond a un autre prix : le poisson est dans son élément et **se débat un peu plus**
  (jusqu'à +12 %).
- **Amorçage à profondeur** : le nuage d'amorce **coule** jusqu'à la profondeur de la ligne
  et n'attire que les poissons de cette couche d'eau. À faible profondeur, l'esche peut
  même être prise **à la volée** (le bouchon ne se pose pas !).
- **Espèces réalistes** : 16 poissons d'eau douce d'Europe, chacun avec sa **silhouette
  3D**, sa **texture d'écailles**, ses couleurs, sa **longueur réelle** et sa
  **combativité**. Le poids est calculé avec la formule des pêcheurs
  (`poids ≈ K × longueur³ / 100 000`), et le **carnet note l'espèce** de chaque prise.
- **Des mesures réelles partout** (1 unité du monde = 50 cm) : un bouchon mesure **18 à 40 cm**
  selon le modèle, son hameçon **1,3 cm**, un nénuphar **12 à 35 cm** de rayon, les roseaux
  **2 à 4 cm** de tige, la canne **5,2 m**, le pêcheur **1,75 m**, l'étang **55 m** de large et
  **2,5 m** de fond (3,3 m dans les fosses) ; chaque poisson a **exactement sa taille réelle**
  (un gardon de 28 cm fait 28 cm à l'écran) et le bouchon ne s'enfonce que de quelques
  dizaines de centimètres, comme un vrai.
- **Records d'espèce** : quand un poisson range dans la bourriche est plus lourd que le
  record du carnet, le message de prise passe en **doré** (« 🏆 RECORD — Carpe ! 2,4 kg 🎣 »)
  et le statut rappelle l'ancien record. Le premier poisson d'une espèce établit son record.
- **Chaque espèce mord et se bat à SA façon** : 6 styles de combat — **Nerveux** (ablette,
  gardon : il tapote), **Teigneux** (goujon, perche : petits coups secs), **Aspirateur**
  (tanche, brème : le bouchon MONTE), **Fonceur** (brochet, truite, chevesne, black-bass :
  il part de côté et s'épuise vite), **Glisseur** (sandre, anguille : tirades irrégulières)
  et **Lourd** (carpe, silure : traction énorme, il ne se fatigue presque pas). Ces styles
  changent les **touches du bouchon**, la **traction**, les **tirades**, l'**endurance** et
  les **écarts latéraux** — et le carnet les décrit pour chaque poisson.
- **Lancer au dosage** : le lancer de la canne se fait comme l'amorçage (viser, maintenir,
  relâcher quand la jauge passe sur le repère) — un vrai geste à réussir.
- **Frein du moulinet** : bouton « 🔓 Lâcher du fil » pendant le combat (le poisson
  reprend de la ligne mais elle ne casse pas).
- **Barre de tension accessible** : zone dangereuse **hachurée** + légende à symboles
  (🟩 🟨 ✖) : lisible même en cas de daltonisme.
- **Météo** : cycle beau temps → **rafales** (le vent souffle plus fort) → **pluie**
  (gouttes, ciel grisé, ondulations sur l'eau, bruit de pluie) ; sous la pluie, les
  poissons s'intéressent à l'hameçon **de plus loin**.
- **Vie ambiante** : **oiseaux** qui tournent dans le ciel en battant des ailes,
  **libellules** au-dessus de l'eau, **poisson qui saute** de temps en temps ; et le son
  (pépiements, « plop ») va avec.
- **Fiche des espèces** dans le carnet : nombre de prises et **record** pour chaque
  espèce attrapée.
- **Carte de l'étang** dans le carnet : où chercher les poissons (herbiers, roseaux,
  pleine eau, fond).
- **Tutoriel d'accueil** (montré à la première visite, avec une main animée) et
  reboutonnable depuis le carnet.
- **Reflets sur l'eau** (option du carnet) : un cube-mapping rendu de temps en temps
  (désactivé par défaut car coûteux) ; **désactivé automatiquement** si le rendu échoue.
- **LOD** : les petits détails des poissons (yeux, nageoires) disparaissent au loin.
- **Effets sonores** procéduraux (Web Audio API, sans fichier externe).
- **Carnet de pêche** : prises, poids total, record, dernières prises — sauvegardé dans
  le navigateur (`localStorage`).
- **Difficulté réglable** depuis le carnet : **Facile / Normal / Dur** (le poisson tire
  plus ou moins fort, le chrono et la fenêtre de ferrage changent).
- **Options d'accessibilité** : gros texte, animations calmes (moins de clignotements).
- **Jouable sur téléphone et tablette** : commandes tactiles (appui/relâchement pour
  l'amorçage et le lancer du poisson, manivelle au doigt), invite à passer en paysage,
  interface qui respecte les encoches (zones sûres), bouton pause et plein écran ⛶.
- Plein écran et HUD en surimpression.

## Espèces (16 poissons d'eau douce d'Europe)

Chaque espèce a sa **silhouette 3D**, sa **texture d'écailles** dessinée à la main
(rayures, taches, mouchetures…), ses couleurs, sa **longueur réelle** et sa
**combativité**. Le poids n'est pas tiré au hasard : il vient de la formule des
pêcheurs, `poids (kg) ≈ K × longueur(cm)³ / 100 000`, où `K` est le « facteur de
condition » de l'espèce (2,3 pour une carpe bien nourrie, 0,2 pour une anguille
très allongée).

| Espèce | Silhouette | Longueur | Poids max | Combat |
|---|---|---|---|---|
| Ablette | petit | 8 – 18 cm | 0,05 kg | 🟢 |
| Gardon | fusiforme | 12 – 32 cm | 0,36 kg | 🟢 |
| Rotengle | fusiforme (nageoires rouges) | 15 – 35 cm | 0,47 kg | 🟢 |
| Goujon | petit, moucheté | 10 – 22 cm | 0,14 kg | 🟢 |
| Brème | haut et plat | 25 – 60 cm | 3,9 kg | 🟡 |
| Tanche | profond, œil rouge | 25 – 55 cm | 2,8 kg | 🟡 |
| Carassin | profond, doré | 18 – 40 cm | 1,4 kg | 🟡 |
| Carpe | profond, écailles | 35 – 95 cm | 19,7 kg | 🟠 |
| Perche | bossu, dorsale épineuse, nageoires rouges | 15 – 45 cm | 1,3 kg | 🟠 |
| Chevesne | fusiforme | 25 – 60 cm | 2,6 kg | 🟠 |
| Truite | fusiforme, points rouges | 20 – 55 cm | 2,0 kg | 🟠 |
| Black-bass | bossu, bande latérale | 25 – 55 cm | 2,7 kg | 🔴 |
| Sandre | torpille, barres | 35 – 90 cm | 5,8 kg | 🔴 |
| Brochet | torpille, taches claires | 40 – 120 cm | 15,6 kg | 🔴 |
| Anguille | serpent | 40 – 110 cm | 2,7 kg | 🔴 |
| Silure | barbu (moustaches) | 80 – 200 cm | 80 kg | 🔴 |

> La taille affichée sur le poisson correspond à sa **taille réelle** (2 unités du
> monde ≈ 1 m) : un gardon est vraiment petit, un silure vraiment énorme.

## Structure

```
peche_game/
├── index.html          # Page principale + HUD
├── style.css           # Styles (plein écran, manivelle, barres…)
├── script.js           # Logique 3D du jeu (three.js)
├── sound.js            # Moteur audio procédural
├── launch.sh           # Lance le serveur local + ouvre le navigateur
├── serveur.py          # Serveur local sans cache (pour le développement)
├── assets/
│   ├── three.module.js # three.js r160 (MIT)
│   ├── fish.png        # Image 2D (ancienne version)
│   ├── pond.svg        # Décor SVG (ancienne version)
│   └── CREDITS.txt     # Attributions
└── README.md
```

## Crédits

Voir `assets/CREDITS.txt` :

- Photo de poisson : Ffish.asia / Ellicrum — CC BY-SA 4.0
- Bibliothèque 3D : three.js r160 — MIT

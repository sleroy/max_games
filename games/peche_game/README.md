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
python3 -m http.server 8000
```

Puis ouvrir : <http://127.0.0.1:8000/index.html>

Fonctionne dans Firefox et Chrome (WebGL requis).

## Commandes

- **Clic gauche sur l'eau** : **clique et maintiens** pour viser (une jauge de puissance oscille), puis **relâche au bon moment** : plus la puissance est forte, plus tu lances loin (le vent décale le lancer).
- **Choisis ton bouchon** (menu « Bouchon » du carnet) : **Anglaise** (longue tige, très
  sensible), **Waggler** (court, se couche sur le côté), **Pose à coulisse**,
  **Bolognaise** (gros, peu sensible). Plus le bouchon est sensible, plus la **fenêtre de
  ferrage** est longue… mais plus il montre de **fausses touches** !
- **Attendre qu'un poisson morde** : le bouchon fait d'abord des **fausses touches**
  (il plonge à moitié, remonte un peu, se couche, frémit…), puis vient **LA vraie touche**,
  de deux types : **enfoncement complet** ou **remontée** (l'anglaise sort la moitié de sa
  tige ; un bouchon court se couche sur le côté).
- **Ferrer au bon moment** : clique pile pendant la vraie touche → **tu démarres avec
  l'avantage** (le poisson est tout près). Trop tôt (sur une fausse touche) ou trop tard
  (juste après la fenêtre) → **le poisson est quand même ferré, mais avec l'avantage**.
  Si tu laisses vraiment passer, il recrache l'hameçon.
- **Épreuve de force** : tourne la manivelle pour ramener le poisson (la barre suit la longueur de fil sortie). Quand le poisson tire, la ligne recule : il faut regagner la distance perdue. **Seule la manivelle fait revenir le poisson.** Si la ligne est trop tendue (zone hachurée à droite), **maintiens « 🔓 Lâcher du fil »** : le frein patine, la ligne ne casse pas, mais le poisson reprend de la distance.
- **Manivelle** (en bas à droite pendant l'épreuve de force et la remontée) : fais glisser la poignée en cercle pour ramener la ligne. Un tour complet ramène environ 1 m de fil : plus le lancer est loin, plus il faut de tours.
- **🧺 Bourriche** : quand le poisson arrive au bord, tu le gardes **en main** ; il faut
  alors le **lancer dans la bourriche** (même principe que l'amorce : appuie, maintiens,
  relâche quand la jauge passe sur le repère). Réussi → +1 point et la prise est notée
  dans le carnet ; raté → le poisson retombe à l'eau (aucun point).
- **Pas de nouveau poisson pendant la remontée** : tant que la ligne revient vers le bord, aucun autre poisson ne peut mordre — il faut rembobiner puis relancer la canne.
- **📖 Carnet de pêche** (bouton à côté du pêcheur) : nombre de prises, poids total, record
  et dernières prises (sauvegardés dans le navigateur). C'est aussi là qu'on choisit la
  **difficulté** et les options (gros texte, animations calmes).
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
- **Mode bouchon** : vue rapprochée, enfoncement sous l'eau, fenêtre de ferrage à un seul essai.
- **Épreuve de force** : on ramène le fil à la manivelle (un tour ≈ 1 m), le poisson reprend du fil quand il tire ; temps limite proportionnel à la distance du lancer.
- **Accrochage dans les nénuphars** avec risque de casser la ligne.
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
- **Espèces réalistes** : 16 poissons d'eau douce d'Europe, chacun avec sa **silhouette
  3D**, sa **texture d'écailles**, ses couleurs, sa **longueur réelle** et sa
  **combativité**. Le poids est calculé avec la formule des pêcheurs
  (`poids ≈ K × longueur³ / 100 000`), et le **carnet note l'espèce** de chaque prise.
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

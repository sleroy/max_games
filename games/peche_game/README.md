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

- **Clic gauche sur l'eau** : lancer la ligne (le vent peut la décaler).
- **Attendre qu'un poisson morde** : un poisson s'approche du bouchon et **mordille** (le bouchon plonge par petites tapes) avant de l'enfoncer franchement — la vue se rapproche alors et le bouchon coule.
- **Un seul clic** pour ferrer : clique au bon moment (pendant l'enfoncement). Trop tôt → le poisson s'enfuit.
- **Épreuve de force** : tourne la manivelle pour ramener le poisson (la barre suit la longueur de fil sortie). Quand le poisson tire, la ligne recule : il faut regagner la distance perdue. **Seule la manivelle fait revenir le poisson — cliquer ne sert plus à rien pendant le combat.**
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
- **Eau transparente et vivante** : surface animée par une houle dont l'amplitude et la vitesse suivent le vent, bouchon qui flotte sur les vagues, poissons nageant à des profondeurs différentes et remontant vers l'hameçon pour mordre.
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
  propres, **cycle jour/nuit** (le soleil décrit un arc, le ciel et les couleurs
  changent), houle de l'eau qui suit le vent.
- **Canne vivante** : la canne **plie** quand le fil est tendu et la ligne se raidit.
- **Poissons plus vivants** : ondulation du corps, inclinaison dans les virages,
  sillage près de la surface, **éclaboussures** au ferrage.
- **Décor optimisé** : arbres, roseaux et rochers en *instancing* (un seul appel de
  dessin), ce qui laisse de la marge pour la végétation.
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

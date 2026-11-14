# L'étang du Bois Neuf — Jeu de Pêche 3D

Un jeu de pêche en 3D réalisé avec [three.js](https://threejs.org/).

## Lancer le jeu

Le jeu doit être servi par un serveur HTTP (modules ES + WebGL nécessitent une origine `http://`).

```bash
cd peche_game
python3 -m http.server 8000
```

Puis ouvrir : <http://127.0.0.1:8000/index.html>

Fonctionne dans Firefox et Chrome (WebGL requis).

## Commandes

- **Clic gauche sur l'eau** : lancer la ligne (le vent peut la décaler).
- **Attendre qu'un poisson morde** : une vue rapprochée du bouchon s'affiche, puis il s'enfonce soudainement.
- **Un seul clic** pour ferrer : clique au bon moment (pendant l'enfoncement). Trop tôt → le poisson s'enfuit.
- **Épreuve de force** : clique vite pour faire reculer la barre et ramener le poisson.
- **Manivelle** (en bas à droite pendant la remontée) : fais glisser la poignée en cercle pour ramener la ligne.
- **Bouton son** (🔊) : couper / réactiver les effets sonores.

## Fonctionnalités

- Scène 3D : étang, rive, arbres, roseaux, rochers, nénuphars, ciel dégradé, nuages, soleil.
- Pêcheur 3D avec canne, ligne courbe et bouchon muni d'un hameçon.
- 20 poissons de 4 formes différentes, avec taille, force, agressivité et poids variables.
- **Vent** aléatoire : déplace le bouchon, décale le lancer, fait bouger les nuages, indiqué par une **girouette 3D** et une **jauge**.
- **Mode bouchon** : vue rapprochée, enfoncement sous l'eau, fenêtre de ferrage à un seul essai.
- **Épreuve de force** limitée dans le temps (2 à 4 s selon la distance).
- **Accrochage dans les nénuphars** avec risque de casser la ligne.
- Les poissons perdus deviennent plus agressifs, plus rapides et plus rouges.
- **Touches pendant la remontée** et **manivelle** pour ramener la ligne.
- **Effets sonores** procéduraux (Web Audio API, sans fichier externe).
- Plein écran et HUD en surimpression.

## Structure

```
peche_game/
├── index.html          # Page principale + HUD
├── style.css           # Styles (plein écran, manivelle, barres…)
├── script.js           # Logique 3D du jeu (three.js)
├── sound.js            # Moteur audio procédural
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

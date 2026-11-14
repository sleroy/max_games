# 🎮 Collection de jeux web

Ce dépôt regroupe plusieurs petits jeux et démos réalisés en HTML / CSS / JavaScript,
publiés sur **GitHub Pages**.

👉 **Page d'accueil (tous les jeux) :** ouvrez le site GitHub Pages du dépôt.

## Jeux disponibles

| Jeu | Description | Dossier |
|---|---|---|
| 🎣 **L'étang du Bois Neuf** | Jeu de pêche en 3D (three.js) — vent, ferrage, épreuve de force | [`games/peche_game/`](games/peche_game/) |
| ⛏️ **Minecraft en JavaScript** | Clone de Minecraft en 3D (three.js) | [`games/minecraft/`](games/minecraft/) |
| 🌐 **Minecraft JS — Version Online** | Version enrichie (survie, monstres, craft) | [`games/minecraft-online/`](games/minecraft-online/) |
| 🪤 **Minecraft Trap PVP** | Arène PVP de type Minecraft | [`games/minecraft-trap-pvp/`](games/minecraft-trap-pvp/) |
| ❌⭕ **Jeu de Morpion** | Tic-tac-toe (2 joueurs ou IA) | [`games/jeu1/`](games/jeu1/) |
| 🟢 **Slime Adventure** | Jeu de plateforme par niveaux | [`games/slime_game/`](games/slime_game/) |
| 📄 **Page de démo** | Exemple de contenu statique | [`games/page 1/`](games/page%201/) |

## Structure

```
.
├── index.html                 # Page d'accueil (liste des jeux)
├── README.md                  # Présentation du projet
├── AGENTS.md                  # Instructions pour l'agent (Cline)
├── .nojekyll                  # Désactive Jekyll sur GitHub Pages
├── .githooks/post-commit      # Hook de push automatique
└── games/                     # Tous les jeux
    ├── jeu1/                  # Morpion
    ├── minecraft/             # Minecraft JS
    ├── minecraft-online/      # Minecraft JS (version online)
    ├── minecraft-trap-pvp/    # Minecraft Trap PVP
    ├── page 1/                # Page de démo
    ├── peche_game/            # Jeu de pêche 3D
    └── slime_game/            # Slime Adventure
```

## Lancer en local

Comme `games/peche_game/` utilise des modules ES, mieux vaut servir le dossier via un serveur HTTP :

```bash
python3 -m http.server 8000
# puis ouvrir http://127.0.0.1:8000/
```

Pour le jeu de pêche, le plus simple est de lancer son petit script : il démarre le
serveur **et** ouvre le navigateur automatiquement.

```bash
games/peche_game/launch.sh
```

Les autres jeux fonctionnent aussi en ouvrant simplement leur fichier `index.html`.

## Déploiement (GitHub Pages)

Le site est publié directement depuis la branche `main` (racine du dépôt) :
chaque jeu est accessible à l'URL `https://sleroy.github.io/max_games/games/<dossier>/`.

- 🏠 Accueil : <https://sleroy.github.io/max_games/>
- 💻 Code : <https://github.com/sleroy/max_games>
- 🎣 Exemple : <https://sleroy.github.io/max_games/games/peche_game/>

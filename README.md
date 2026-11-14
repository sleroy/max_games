# 🎮 Collection de jeux web

Ce dépôt regroupe plusieurs petits jeux et démos réalisés en HTML / CSS / JavaScript,
publiés sur **GitHub Pages**.

👉 **Page d'accueil (tous les jeux) :** ouvrez le site GitHub Pages du dépôt.

## Jeux disponibles

| Jeu | Description | Dossier |
|---|---|---|
| 🎣 **L'étang du Bois Neuf** | Jeu de pêche en 3D (three.js) — vent, ferrage, épreuve de force | [`peche_game/`](peche_game/) |
| ⛏️ **Minecraft en JavaScript** | Clone de Minecraft en 3D (three.js) | [`minecraft/`](minecraft/) |
| 🌐 **Minecraft JS — Version Online** | Version enrichie (survie, monstres, craft) | [`minecraft-online/`](minecraft-online/) |
| 🪤 **Minecraft Trap PVP** | Arène PVP de type Minecraft | [`minecraft-trap-pvp/`](minecraft-trap-pvp/) |
| ❌⭕ **Jeu de Morpion** | Tic-tac-toe (2 joueurs ou IA) | [`jeu1/`](jeu1/) |
| 🟢 **Slime Adventure** | Jeu de plateforme par niveaux | [`slime_game/`](slime_game/) |
| 📄 **Page de démo** | Exemple de contenu statique | [`page 1/`](page%201/) |

## Structure

```
.
├── index.html                 # Page d'accueil listant tous les jeux
├── .nojekyll                  # Désactive Jekyll sur GitHub Pages
├── jeu1/                      # Morpion
├── minecraft/                 # Minecraft JS
├── minecraft-online/          # Minecraft JS (version online)
├── minecraft-trap-pvp/        # Minecraft Trap PVP
├── page 1/                    # Page de démo
├── peche_game/                # Jeu de pêche 3D
└── slime_game/                # Slime Adventure
```

## Lancer en local

Comme`peche_game` utilise des modules ES, mieux vaut servir le dossier via un serveur HTTP :

```bash
python3 -m http.server 8000
# puis ouvrir http://127.0.0.1:8000/
```

Les autres jeux fonctionnent aussi en ouvrant simplement leur fichier `index.html`.

## Déploiement (GitHub Pages)

Le site est publié directement depuis la branche `main` (racine du dépôt) :
chaque dossier est accessible à l'URL `https://<utilisateur>.github.io/<depot>/<dossier>/`.

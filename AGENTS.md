# AGENTS.md — Instructions pour l'agent (Cline)

## Règles pour l'agent : publier automatiquement sur GitHub

> **⚠️ Règle principale :** après **chaque** modification de fichiers dans ce dépôt,
> l'agent doit **automatiquement** committer **et** pousser les changements sur GitHub,
> sans attendre que l'utilisateur le demande.

### Procédure à suivre après toute modification

```bash
git add -A
git commit -m "<type>: <description courte>"
git push origin main
```

- Ne jamais laisser de modifications non poussées en fin de tâche.
- Si le push échoue (authentification / réseau), prévenir l'utilisateur et afficher la
  commande `gh auth login` à exécuter.
- Ne pas utiliser `--force` sauf demande explicite.

### Dépôt et déploiement

| Élément | Valeur |
|---|---|
| Dépôt GitHub | [`sleroy/max_games`](https://github.com/sleroy/max_games) (public) |
| Branche principale | `main` |
| Remote | `origin` → `https://github.com/sleroy/max_games.git` |
| Hébergement | GitHub Pages (déploiement depuis la branche `main`, dossier `/`) |
| URL du site | `https://sleroy.github.io/max_games/` |

### Push automatique (filet de sécurité actif)

Ce dépôt est configuré avec `core.hooksPath = .githooks` : le hook `post-commit`
**pousse automatiquement** la branche courante vers `origin` à chaque commit.

Pour activer ce comportement sur une nouvelle copie du dépôt :

```bash
git config core.hooksPath .githooks
```

Le hook est volontairement silencieux en cas d'absence de remote ou de rebase en cours.

## Liste des jeux disponibles (source de vérité)

Tout **dossier placé dans `games/` et contenant un `index.html`** est un jeu exposé sur le site.

| # | Jeu | Dossier | Techno | Lien |
|---|---|---|---|---|
| 1 | 🎣 L'étang du Bois Neuf | `games/peche_game/` | three.js | [jouer](https://sleroy.github.io/max_games/games/peche_game/) |
| 2 | ⛏️ Minecraft en JavaScript | `games/minecraft/` | three.js | [jouer](https://sleroy.github.io/max_games/games/minecraft/) |
| 3 | 🌐 Minecraft JS — Online | `games/minecraft-online/` | three.js | [jouer](https://sleroy.github.io/max_games/games/minecraft-online/) |
| 4 | 🪤 Minecraft Trap PVP | `games/minecraft-trap-pvp/` | three.js | [jouer](https://sleroy.github.io/max_games/games/minecraft-trap-pvp/) |
| 5 | ❌⭕ Jeu de Morpion | `games/jeu1/` | JavaScript | [jouer](https://sleroy.github.io/max_games/games/jeu1/) |
| 6 | 🟢 Slime Adventure | `games/slime_game/` | Canvas 2D | [jouer](https://sleroy.github.io/max_games/games/slime_game/) |
| 7 | 📄 Page de démo | `games/page 1/` | HTML | [voir](https://sleroy.github.io/max_games/games/page%201/) |

**Total : 7 entrées.**

### Règle : maintenir `index.html`

`index.html` (racine) est la **page d'accueil du site** et doit toujours lister les jeux réellement présents.

À faire **à chaque ajout / suppression / renommage d'un jeu** :

1. Ajouter (ou retirer) l'élément `<li class="game">` correspondant dans `index.html`, en renseignant
   les attributs `data-folder` et `data-tech` (utilisés par la liste et le compteur).
2. Mettre à jour le tableau ci-dessus.
3. Mettre à jour le tableau du `README.md`.
4. Committer et pousser (voir la règle de push automatique en haut de ce fichier).

Points d'attention :

- Le compteur en en-tête (`#gameCount`) est **calculé automatiquement en JS** à partir du nombre de
  `<li class="game">`. La valeur `7` codée en dur n'est qu'un repli si JavaScript est désactivé.
- Les liens vers un dossier contenant un espace doivent être encodés : `games/page 1/` → `games/page%201/`.
- Garder les mêmes conventions de style : textes et descriptions en français, icône emoji par jeu.

## Présentation du projet

Collection de jeux web statiques (HTML / CSS / JavaScript), exposés via GitHub Pages.

```
.
├── index.html                 # Page d'accueil (liste des jeux)
├── README.md                  # Présentation du projet
├── AGENTS.md                  # Instructions pour l'agent (Cline)
├── .nojekyll                  # Désactive le traitement Jekyll sur GitHub Pages
├── .githooks/post-commit      # Hook de push automatique
└── games/                     # Tous les jeux exposés sur le site
    ├── jeu1/                  # Jeu de Morpion
    ├── minecraft/             # Minecraft en JavaScript (three.js)
    ├── minecraft-online/      # Minecraft JS — version en ligne (survie, craft)
    ├── minecraft-trap-pvp/    # Minecraft Trap PVP
    ├── page 1/                # Page de démonstration statique
    ├── peche_game/            # Jeu de pêche 3D (three.js)
    └── slime_game/            # Slime Adventure
```

## Contraintes techniques

- **Site 100 % statique** : pas d'étape de build, pas de `node_modules` versionné.
- Conserver le fichier `.nojekyll` (sinon les dossiers commençant par `_` seraient ignorés
  par GitHub Pages).
- `games/peche_game/` utilise des **modules ES** : le jeu doit être servi via HTTP
  (`python3 -m http.server`) et non ouvert en `file://`.
- Respecter les conventions existantes : commentaires et textes d'interface en français.
- Ne pas supprimer le dossier `/home/enfant/peche_game_git_backup` (sauvegarde de
  l'ancien historique Git de `peche_game`).

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

## Présentation du projet

Collection de jeux web statiques (HTML / CSS / JavaScript), exposés via GitHub Pages.

```
.
├── index.html                 # Page d'accueil (liste des jeux)
├── .nojekyll                  # Désactive le traitement Jekyll sur GitHub Pages
├── .githooks/post-commit      # Hook de push automatique
├── jeu1/                      # Jeu de Morpion
├── minecraft/                 # Minecraft en JavaScript (three.js)
├── minecraft-online/          # Minecraft JS — version en ligne (survie, craft)
├── minecraft-trap-pvp/        # Minecraft Trap PVP
├── page 1/                    # Page de démonstration statique
├── peche_game/                # Jeu de pêche 3D (three.js)
└── slime_game/                # Slime Adventure
```

## Contraintes techniques

- **Site 100 % statique** : pas d'étape de build, pas de `node_modules` versionné.
- Conserver le fichier `.nojekyll` (sinon les dossiers commençant par `_` seraient ignorés
  par GitHub Pages).
- `peche_game/` utilise des **modules ES** : le jeu doit être servi via HTTP
  (`python3 -m http.server`) et non ouvert en `file://`.
- Respecter les conventions existantes : commentaires et textes d'interface en français.
- Ne pas supprimer le dossier `/home/enfant/peche_game_git_backup` (sauvegarde de
  l'ancien historique Git de `peche_game`).

# AGENTS.md — Guide du dépôt « max_games »

> Ce fichier sert à **deux publics** :
> - 🧒 **Toi** (le créateur de jeux) → lis la **Partie 1**.
> - 🤖 **L'agent IA (Cline)** → applique les règles du haut et la **Partie 2**.

## ⚡ Le résumé en 30 secondes

- **1 jeu = 1 dossier** dans `games/` (ex. `games/mon-super-jeu/`).
- Un jeu, c'est **3 fichiers** : `index.html`, `style.css`, `script.js`.
- **Tester** : `python3 -m http.server` puis ouvrir <http://127.0.0.1:8000/>.
- **Publier** : ajouter le jeu à `index.html` + `README.md` + ce fichier.
- **L'agent s'occupe du reste** : il committe et pousse tout seul sur GitHub.

---

## 🤖 Règles pour l'agent (Cline) — à appliquer toujours

### 1. Publier automatiquement sur GitHub

> **⚠️ Règle principale :** après **chaque** modification de fichiers, l'agent doit
> **automatiquement** committer **et** pousser sur GitHub, sans qu'on le lui demande.

```bash
git add -A
git commit -m "<type>: <description courte>"
git push origin main
```

- Ne jamais laisser de modifications non poussées en fin de tâche.
- Si le push échoue (authentification / réseau) : prévenir et rappeler `gh auth login`.
- Ne pas utiliser `--force` sauf demande explicite.

### 2. Dépôt et déploiement

| Élément | Valeur |
|---|---|
| Dépôt GitHub | [`sleroy/max_games`](https://github.com/sleroy/max_games) (public) |
| Branche principale | `main` |
| Remote | `origin` → `https://github.com/sleroy/max_games.git` |
| Hébergement | GitHub Pages (branche `main`, dossier `/`) |
| URL du site | `https://sleroy.github.io/max_games/` |

### 3. Push automatique (filet de sécurité)

Le dépôt est configuré avec `core.hooksPath = .githooks` : le hook `post-commit`
**pousse automatiquement** la branche courante vers `origin` à chaque commit.

Sur une nouvelle copie du dépôt : `git config core.hooksPath .githooks`.
Le hook est silencieux s'il n'y a pas de remote ou pendant un rebase.

---

## 🧒 Partie 1 — Créer un jeu vidéo (guide pas à pas)

Pas besoin d'être un pro : **commence simple**, puis améliore petit à petit. 😊

### ✅ Checklist : ajouter un nouveau jeu

1. **Choisis une idée simple** : « un carré qui évite des obstacles ».
2. **Crée un dossier** dans `games/` : `games/mon-super-jeu/`
   (minuscules, tirets, **pas d'espaces ni d'accents**).
3. **Crée 3 fichiers** : `index.html`, `style.css`, `script.js` (voir le squelette).
4. **Teste en local** : `python3 -m http.server` →
   <http://127.0.0.1:8000/games/mon-super-jeu/>.
5. **Ajoute le jeu à la liste** : `index.html`, `README.md` et ce fichier.
6. **Commit + push** : l'agent le fait automatiquement.
7. **Joue en ligne** : `https://sleroy.github.io/max_games/games/mon-super-jeu/`

### 🧱 Le squelette de départ

**`index.html`**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon super jeu</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Mon super jeu</h1>
    <canvas id="game" width="800" height="600"></canvas>
    <script src="script.js"></script>
</body>
</html>
```

**`style.css`**
```css
body {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: sans-serif;
    color: #ffffff;
    background: #1a1a2e;
}
canvas {
    background: #16213e;
    border-radius: 8px;
    touch-action: none;
}
```

**`script.js`**
```js
// Récupère le canvas et son "pinceau" (le contexte 2D)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Le joueur : pour commencer, un simple carré
const joueur = { x: 380, y: 500, taille: 40, vitesse: 300 };

// Mémorise les touches appuyées
const touches = {};
addEventListener('keydown', e => touches[e.key] = true);
addEventListener('keyup',   e => touches[e.key] = false);

// La boucle de jeu (tourne ~60 fois par seconde)
let dernier = performance.now();
function boucle(maintenant) {
    const dt = (maintenant - dernier) / 1000; // temps écoulé (secondes)
    dernier = maintenant;
    maj(dt);      // mettre à jour le monde
    dessine();    // dessiner l'écran
    requestAnimationFrame(boucle);
}

function maj(dt) {
    if (touches['ArrowLeft'])  joueur.x -= joueur.vitesse * dt;
    if (touches['ArrowRight']) joueur.x += joueur.vitesse * dt;
    joueur.x = Math.max(0, Math.min(canvas.width - joueur.taille, joueur.x));
}

function dessine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f9c74f';
    ctx.fillRect(joueur.x, joueur.y, joueur.taille, joueur.taille);
}

requestAnimationFrame(boucle);
```

---

### 🔁 Comprendre la boucle de jeu

1. `maj(dt)` → **mettre à jour** le monde (déplacer le joueur, les ennemis…).
2. `dessine()` → **effacer** l'écran puis **tout redessiner**.

`dt` est le temps écoulé depuis l'image précédente. En multipliant par `dt`,
le jeu va **à la même vitesse** sur un ordinateur rapide ou lent. 👍

### ⭐ Bonnes pratiques

- **Commence petit** : un carré qui bouge, puis ajoute ennemis, score…
- **Une idée = un jeu** : ne mélange pas plusieurs jeux dans un dossier.
- **Noms clairs** : `vitesseEnnemi`, `score`… (évite `a`, `b`, `x1`).
- **Utilise `const` et `let`** (`var` = ancien, à éviter).
- **Une seule boucle** `requestAnimationFrame` par jeu.
- **Range l'état dans un objet** : `const jeu = { score: 0, vies: 3 };`
- **Découpe en petites fonctions** : `maj()`, `dessine()`, `creerEnnemi()`.
- **Commente en français** : ton « toi du futur » te remerciera.
- **Teste après chaque petite étape** et regarde la console (touche **F12**).

### 🚫 Erreurs classiques à éviter

- Tout écrire dans le HTML → mets le JavaScript dans `script.js`.
- Copier du code sans comprendre → demande à l'agent de **t'expliquer**.
- Ouvrir un jeu en `file://` alors qu'il utilise des modules → serveur HTTP.
- Oublier `dt` → le jeu accélère ou ralentit selon l'ordinateur.
- Oublier d'ajouter le jeu à `index.html` → il n'apparaît pas sur le site.
- Utiliser une image ou un son **sans vérifier la licence** → mets un `CREDITS.txt`.

### 🧪 Tester son jeu en local

```bash
cd games/mon-super-jeu
python3 -m http.server 8000
# puis ouvre http://127.0.0.1:8000/
```

Ouvre la **console** du navigateur (**F12**) : les erreurs en rouge expliquent
souvent le problème. C'est le meilleur ami du créateur de jeux ! 🐞

---

## 📚 Bibliothèques recommandées

**Conseil :** commence **sans bibliothèque** (canvas + JavaScript) pour apprendre les
bases, puis ajoutes-en une quand tu en as besoin.

| Bibliothèque | Pour faire… | Niveau | Site |
|---|---|---|---|
| **p5.js** | dessiner et créer en 2D très simplement | 🟢 débutant | <https://p5js.org> |
| **Kaplay** (ex-Kaboom) | des jeux 2D très vite (arcade, plateforme) | 🟢 débutant | <https://kaplayjs.com> |
| **Phaser** | des jeux 2D complets et pro | 🟠 intermédiaire | <https://phaser.io> |
| **three.js** | de la 3D (déjà utilisé dans `peche_game`) | 🟠 intermédiaire | <https://threejs.org> |
| **Matter.js** | de la physique (chute, rebond, collision) | 🟠 intermédiaire | <https://brm.io/matter-js> |
| **Howler.js** | des sons et de la musique | 🟢 tous | <https://howlerjs.com> |
| **GSAP** | des animations fluides | 🟢 tous | <https://gsap.com> |

**Que choisir ?**

- « Je veux juste dessiner et bouger des formes » → **canvas seul** ou **p5.js**.
- « Je veux un vrai jeu 2D avec niveaux et ennemis » → **Kaplay** ou **Phaser**.
- « Je veux de la 3D » → **three.js**.

> 💡 Pour ajouter une bibliothèque, télécharge son fichier `.js` **dans le dossier du jeu**
> (comme `peche_game/assets/three.module.js`) et référence-le en local. On évite les
> liens externes (CDN) pour que le jeu fonctionne même sans Internet.

## 🎨 Ressources gratuites (images, sons, polices)

| Ressource | Contenu | Licence |
|---|---|---|
| [Kenney](https://kenney.nl/assets) | packs d'images et de sons | CC0 (libre) |
| [OpenGameArt](https://opengameart.org) | images, sons, musiques | à vérifier |
| [itch.io — assets gratuits](https://itch.io/game-assets/free) | ressources de jeux | à vérifier |
| [Freesound](https://freesound.org) | bruitages | à vérifier |
| [Google Fonts](https://fonts.google.com) | polices | open source |
| [Coolors](https://coolors.co) | palettes de couleurs | libre |

**Règle d'or :** note toujours la **source** et la **licence** dans un fichier
`CREDITS.txt` à côté du jeu (exemple : `games/peche_game/assets/CREDITS.txt`).
Préfère les ressources **CC0**.

---

## 🤖 Partie 2 — Détails du dépôt (pour l'agent)

### 📦 Conventions

- **Tout jeu** vit dans `games/<nom-du-jeu>/` et contient un `index.html`.
- Noms de dossiers : **minuscules, tirets, sans espaces** (`mon-super-jeu`).
- Un jeu est **autonome** : il référence ses fichiers en **relatif**
  (`style.css`, `./assets/...`) — jamais de chemin absolu (`/...`).
- **Site 100 % statique** : pas d'étape de build, pas de `node_modules` versionné.
- Conserver `.nojekyll` (sinon GitHub Pages ignore certains dossiers).
- `games/peche_game/` utilise des **modules ES** → serveur HTTP obligatoire.
- Commentaires et textes d'interface **en français**.
- Ne pas supprimer `/home/enfant/peche_game_git_backup` (ancienne sauvegarde Git).

### 🗂️ Arborescence

```
.
├── index.html                 # Page d'accueil (liste des jeux)
├── README.md                  # Présentation du projet
├── AGENTS.md                  # Ce guide (agent + créateur)
├── .nojekyll
├── .githooks/post-commit      # Push automatique
└── games/
    ├── jeu1/                  # Morpion
    ├── minecraft/             # Minecraft (three.js)
    ├── minecraft-online/      # Minecraft — version en ligne
    ├── minecraft-trap-pvp/    # Minecraft Trap PVP
    ├── page 1/                # Page de démo
    ├── peche_game/            # Jeu de pêche 3D
    └── slime_game/            # Slime Adventure
```

### 📋 Liste des jeux (source de vérité)

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

### ➕ Quand un jeu est ajouté / retiré / renommé

1. Ajoute (ou retire) un `<li class="game">` dans `index.html` en renseignant
   `data-folder="games/mon-super-jeu/"` et `data-tech`.
2. Mets à jour le tableau **ci-dessus**.
3. Mets à jour le tableau du `README.md`.
4. Commit + push (l'agent le fait tout seul).

> 💡 Le compteur en haut de `index.html` se **calcule automatiquement** en JavaScript.
> Pour un dossier contenant un espace, encode l'URL : `page 1/` → `page%201/`.

### 🧪 Commandes de test

```bash
node games/peche_game/tests/run.mjs   # non-régression du jeu de pêche (~2 s, Node seul)
node scripts/check-syntax.mjs         # syntaxe de tous les .js / .mjs de games/
MATRICE_CSV=docs/matrice-touche.csv node games/peche_game/tests/run.mjs   # régénère la matrice des touches
```

- Après une modif de `games/peche_game/*.js` : incrémenter `script.js?v=N` dans
  `games/peche_game/index.html`.
- Nouvelle fonctionnalité du jeu de pêche : ajouter `tests/scenario-*.mjs` + l'importer dans `tests/run.mjs`.
- Si l'utilisateur dit explicitement de ne pas committer/pousser, cela prime sur la règle de push automatique.

### 🎣 Carte rapide de `games/peche_game/`

| Fichier | Rôle |
|---|---|
| `script.js` | orchestrateur 3D (three.js), boucle de jeu, UI — **en cours de découpage** |
| `decor.js` | décor fixe : arbres, roseaux, rochers, nénuphars (rend `lilyPads`) |
| `vegetation.js` | roseaux et herbe des berges qui ondulent au vent (shader) |
| `chanceTouche.js` | **règles de touche, source unique** (vue, couche, fond, esche, délai) : `evaluerTouche(contexte)` ; toute règle de touche s'ajoute ici |
| `matriceTouche.js` | grille de situations, **règles** de la matrice (test bloquant) et points **à surveiller** ; partagé par le test et `matrice.html` |
| `avion.js` | avion (modèle glTF `assets/avion.glb`) qui traîne une banderole de conseils d'esche, d'après la matrice |
| `matrice.html` / `matrice.js` / `matrice.css` | page de visualisation de la matrice des touches ([voir en ligne](https://sleroy.github.io/max_games/games/peche_game/matrice.html)) |
| `portraits.js` | portraits 2D des espèces : **repli** du panneau de combat (sans WebGL) ; le portrait normal est le rendu 3D (`apercuPoisson.js`) |
| `modelePoisson.js` | poisson 3D paramétrique (corps par sections, nageoires, yeux, barbillons) — voir `docs/modeles-poissons.md` |
| `texturesPoisson.js` | robes procédurales 256 × 128 par espèce (motifs) et rayons des nageoires |
| `especes.js` | données : espèces, styles de combat, silhouettes, touches, `substrats` préférés |
| `esches.js` | esches (maïs, ver, pain, bouillette, vif) : profils, décision de touche, widget |
| `substrats.js` | types de fond (sable, gravier, vase, roche, herbier) : grille, texture, carte, habitat, accrochages |
| `carnet.js` | persistance du carnet de pêche (localStorage) |
| `classement.js` | classement local |
| `demelage.js` | mini-jeu de démêlage (canvas 2D) |
| `quiver.js` | indicateur de scion de canne |
| `sound.js` | moteur audio |
| `tests/` | harnais Node (`harness.mjs`, `three-stub.mjs`) + `scenario-*.mjs` |

> **Découpage et travail en parallèle** : lire **`docs/modules.md`** (contrat des
> modules, tableau de propriété, plafonds de lignes, ordre de découpage). Règle :
> un agent = un fichier ; `script.js` ne reçoit qu'un import et un appel
> `creerXxx(deps)`. Garde-fou automatique : `tests/scenario-modules.mjs`.

Suivi des idées : `idées.md` à la racine (ignoré par git, ne pas modifier sans demande).

### 🧰 Skills, steering et hooks

- **Steering Kiro** : `.kiro/steering/{product,tech,structure,conventions}.md` (toujours inclus).
- **Hooks Kiro** : `.kiro/hooks/*.json` (syntaxe + tests à l'enregistrement, rappel de fin de tâche, blocage de `git push --force`).
- **Skills installés** : `.kiro/skills/` (Kiro) et `.agents/skills/` (Codex), copies identiques ;
  liste, sources et licences dans `.kiro/skills/README.md`.
  Actuels : `frontend-design`, `webapp-testing`, `threejs-fundamentals`, `threejs-performance`,
  `threejs-shaders`, `threejs-lighting`.
- Codex lit ce `AGENTS.md` et `.agents/skills/` ; Kiro lit aussi `.kiro/`.

### 🚦 CI

CircleCI (`.circleci/config.yml`, image `cimg/node:22.12`) : lance `check-syntax.mjs` puis les tests de pêche.
Aucune dépendance à installer.

### 📜 Licence

Code sous licence MIT (`LICENSE`). Les ressources tierces gardent leur licence
(voir `games/peche_game/assets/CREDITS.txt`).

## 📖 Petit glossaire

- **Canvas** : la zone rectangulaire où l'on dessine.
- **Contexte 2D (`ctx`)** : l'objet qui sert de « pinceau ».
- **Boucle de jeu** : fonction répétée ~60×/s qui met à jour puis dessine.
- **`dt` (delta time)** : temps écoulé depuis l'image précédente.
- **Sprite** : une image de personnage ou d'objet.
- **Hitbox** : la zone invisible qui détecte les collisions.
- **Assets** : les images, sons et polices d'un jeu.
- **FPS** : images par seconde (*frames per second*).

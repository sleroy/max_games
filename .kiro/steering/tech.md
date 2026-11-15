# Technique

- Site 100 % statique : HTML + CSS + JavaScript. Pas de build, pas de `node_modules` versionné.
- `peche_game` utilise des modules ES + three.js local (`assets/three.module.js`) : servir en HTTP.
- Lancer en local : `python3 -m http.server 8000` ou `games/peche_game/launch.sh`.
- Tests (Node seul, ~2 s, aucun navigateur) : `node games/peche_game/tests/run.mjs`.
- Syntaxe JS de tous les jeux : `node scripts/check-syntax.mjs`.
- CI CircleCI (`.circleci/config.yml`) : exécute ces deux commandes.
- Cache navigateur : à chaque modification de `games/peche_game/*.js`, incrémenter `script.js?v=N`
  dans `games/peche_game/index.html` (version actuelle visible par `grep "script.js?v" games/peche_game/index.html`).
- Nouvelle fonctionnalité du jeu de pêche => ajouter un `tests/scenario-*.mjs` et l'importer dans `tests/run.mjs`.

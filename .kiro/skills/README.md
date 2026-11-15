# Skills installés

Copies identiques dans `.kiro/skills/` (Kiro) et `.agents/skills/` (Codex).
Pour mettre à jour : recopier depuis la source, puis recopier `.kiro/skills/*` vers `.agents/skills/`.
Scripts relus avant installation : seul `webapp-testing/scripts/with_server.py` lance des commandes (celles qu'on lui passe, pour démarrer un serveur local).

| Skill | Usage | Source | Licence |
|---|---|---|---|
| `frontend-design` | Design d'interface / CSS | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 (`LICENSE.txt`) |
| `webapp-testing` | Tester une page locale avec Playwright | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 (`LICENSE.txt`) |
| `threejs-fundamentals` | Bases three.js (scène, caméra, rendu) | [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) | MIT (`LICENSE`) |
| `threejs-performance` | Optimiser un jeu three.js | CloudAI-X/threejs-skills | MIT |
| `threejs-shaders` | Shaders GLSL (eau, etc.) | CloudAI-X/threejs-skills | MIT |
| `threejs-lighting` | Lumières, ombres, soleil | CloudAI-X/threejs-skills | MIT |

Écartés : `openai/skills` `yeet` (ouvre des PR, contraire à la règle « push direct sur main »), `gh-fix-ci` (GitHub Actions seulement, le CI est CircleCI), `canvas-design` (polices embarquées sous licences variées).

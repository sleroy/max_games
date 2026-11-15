# Conventions

- Commentaires, textes d'interface, messages de commit explicatifs : français. Code (identifiants) clair, `const`/`let`.
- Chemins toujours relatifs dans les jeux (`style.css`, `./assets/...`), jamais `/...`.
- Dossiers de jeux : minuscules, tirets, sans espaces ni accents.
- Pas de CDN : bibliothèques téléchargées dans le dossier du jeu.
- Toute ressource (image, son, police, texture) : source + licence dans `CREDITS.txt` du jeu ; préférer CC0.
- Un jeu ajouté/retiré/renommé : mettre à jour `index.html` (`<li class="game">`), `README.md` et `AGENTS.md`.
- Après chaque modification : tests, puis `git add -A && git commit -m "<type>: <description>" && git push origin main`
  (règle AGENTS.md). Jamais `--force` sans demande explicite.
- Types de commit : `feat`, `fix`, `docs`, `chore`, `test`, `refactor` (ex. `feat(peche): ...`).
- Ne pas toucher `idées.md` (ignoré par git).

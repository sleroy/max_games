# Structure

```
index.html, README.md, AGENTS.md, LICENSE   racine : accueil du site + docs
games/<jeu>/                                un dossier par jeu (index.html, style.css, script.js)
games/peche_game/script.js                  orchestrateur 3D (gros fichier)
games/peche_game/{especes,carnet,classement,demelage,quiver,sound}.js   modules
games/peche_game/assets/                    images, sons, textures, three.js + CREDITS.txt
games/peche_game/tests/                     harnais Node (three-stub.mjs) + scenario-*.mjs
scripts/check-syntax.mjs                    vérification syntaxe
.kiro/{steering,hooks,skills}/              config Kiro ; .agents/skills/ = copie pour Codex
.circleci/config.yml                        CI
```

Modules du jeu de pêche : `especes.js` données des espèces/touches, `carnet.js` persistance localStorage,
`classement.js` classement local, `demelage.js` mini-jeu de démêlage, `quiver.js` scion de canne,
`sound.js` moteur audio.

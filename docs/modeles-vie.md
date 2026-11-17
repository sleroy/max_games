# Modèles 3D des oiseaux et des libellules (v244)

La vie ambiante n'est plus faite de sphères et de rectangles : les oiseaux et les
libellules sont générés en code, comme les poissons.

| Modèle | Fichier | Textures |
|---|---|---|
| Oiseaux | `games/peche_game/modeleOiseau.js` | `texturesVie.js` (`texturePlumage`) |
| Libellules | `games/peche_game/modeleLibellule.js` | `texturesVie.js` (`textureAileLibellule`, `textureAbdomenLibellule`) |

## Repère et unités

- 1 unité = 50 cm (même échelle que `modelePoisson.js`).
- Le **bec** (oiseau) ou la **tête** (libellule) pointe vers **+X**, le dos vers **+Y**.
- Les ailes s'étendent vers **+Z** pour l'aile droite. L'aile gauche est son
  **miroir** (`scale.z = -1`). Comme three.js compose `T × R × S` (échelle
  d'abord), une rotation locale `θ` du miroir donne `-θ` dans le monde : les
  fonctions d'animation multiplient donc les rotations par `cote`.
- Le corps est un tube fermé par sections (superellipse), avec `u = t` le long
  du corps et `v = 0` au ventre / `1` au dos (même convention que les poissons).

## Oiseaux (`modeleOiseau.js`)

### Espèces

| Espèce | Longueur (bec → base queue) | Envergure | Queue | Battement |
|---|---|---|---|---|
| Corneille | 1,25 unité | 4,4 unités | éventail, 0,55 × longueur | 7,2 rad/s, 0,62 rad |
| Mouette | 1,35 unité | 5,0 unités | éventail, 0,42 × longueur | 6,0 rad/s, 0,70 rad |
| Hirondelle | 0,95 unité | 3,4 unités | fourchue, 0,62 × longueur | 11 rad/s, 0,85 rad |

Les couleurs (`couleurs.dos`, `ventre`, `aile`, `bec`, `oeil`) sont dans
`OISEAUX`. Les silhouettes d'aile (`styleAile`) : `large` (corneille),
`allongee` (mouette), `fauchee` (hirondelle).

### Maillage

| Partie | Mesh | Détail |
|---|---|---|
| Corps + tête | 1 | 30 anneaux × 10 segments ; profil `CORPS_H` / `CORPS_W`, creux du cou et renflement de la tête |
| Bec | 1 | cône à 4 faces, aplati, dans l'axe +X |
| Yeux | 2 | petites sphères |
| Ailes | 4 | par aile : membrane interne (6 × 3) + groupe **poignet** (membrane externe 6 × 3 + 5 rémiges) |
| Queue | 1 | 7 plumes en éventail (4 en queue fourchue, les 2 extérieures plus longues) |

Environ 1 000 triangles et 10 meshes par oiseau ; texture de plumage 128 × 64
par espèce et par partie (`corps`, `aile`).

### Articulations et animation

- `oiseau.userData.ailes` = `[{ groupe, poignet, cote, mesh }]` (2 entrées).
- `oiseau.userData.queue` = groupe de la queue ; `corps`, `bec` exposés aussi.
- `animerOiseau(oiseau, temps)` : battement (`cadence`, `battement` de l'espèce),
  **glissades** lentes (amplitude réduite par un sinus lent), vrillage de l'aile,
  poignet en retard (la main se replie après l'épaule) et queue qui s'ouvre.
- L'orientation du vol (cap du bec, inclinaison dans le virage) reste dans
  `vie.js`, qui possède le mouvement.

## Libellules (`modeleLibellule.js`)

### Espèces

`LIBELLULES` : `azur`, `verte`, `rouge` — seule la robe change (corps, tête,
yeux, nervures, membrane). Longueur ≈ 1,10 unité, envergure ≈ 1,56 unité.

### Maillage

| Partie | Mesh | Détail |
|---|---|---|
| Thorax | 1 | tube 8 × 10, trapu |
| Abdomen | 1 | tube 20 × 10 de 10 segments, courbé vers le bas, **groupe articulé** à la taille |
| Tête | 1 | sphère |
| Yeux composés | 2 | grosses sphères rouge-brun |
| Ailes | 4 | grille 9 × 2, paires avant/arrière (0,72 / 0,68 unité), matériau transparent nervuré |
| Pattes | 1 | 6 pattes repliées, une géométrie de lignes |

Environ 700 triangles et 10 meshes par libellule ; texture d'aile 128 × 64
(transparente) et d'abdomen 128 × 32.

### Animation

`animerLibellule(libellule, temps)` : les ailes battent à ~7 Hz visuels
(`temps × 46`), la paire arrière décalée d'un quart de période ; l'abdomen ondule
légèrement. Le vol (vol sur place, pointes sèches de 0,45 s, ancres × `f`) est
dans `vie.js`.

## Intégration dans `vie.js`

- Trois oiseaux (`corneille`, `mouette`, `hirondelle`), chacun avec son cercle
  (`userData.orbite`) et son altitude ; le cap suit la vitesse de l'orbite.
- Trois libellules (une par robe), ancrées au-dessus de l'eau à des décalages de
  référence × `f` (échelle de l'étang) ; toutes les 2 à 6 s, une pointe sèche les
  emmène vers un nouveau point, puis elles reprennent le vol sur place.

## Tests

`games/peche_game/tests/scenario-modeles-vie.mjs` (groupe 83) vérifie avec le
vrai three.js :

- envergure et longueur mesurées de chaque espèce (± 3 % / ± 5 %) ;
- budget : 600 à 3 000 triangles, ≤ 12 meshes par oiseau ; 400 à 2 000
  triangles, ≤ 12 meshes par libellule ;
- contrat `userData` (ailes + poignet, queue, bec, abdomen, segments) ;
- textures 128 × 64 (oiseau, aile de libellule) et 128 × 32 (abdomen) ;
- le battement fait monter/descendre l'aile, les deux ailes sont symétriques,
  le poignet se replie, les paires de libellule sont déphasées et l'abdomen ondule ;
- les trois espèces sont bien présentes dans le ciel de la partie.

## Ajouter une espèce

1. Ajouter une entrée dans `OISEAUX` (ou `LIBELLULES`) : longueurs, envergure,
   corde, queue, couleurs, cadence.
2. Rien à changer ailleurs : `vie.js` choisit les espèces par identifiant.
3. Lancer `node games/peche_game/tests/run.mjs` : le scénario 83 mesure la
   nouvelle espèce et vérifie le budget.

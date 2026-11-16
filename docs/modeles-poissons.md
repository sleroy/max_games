# Modèles 3D des poissons (v197)

Le poisson 3D est généré en code par `games/peche_game/modelePoisson.js`, à partir des
données de `games/peche_game/especes.js` (`FORMES`, `PROFILS`, `ANATOMIES`).
La robe (couleurs + motif) est dessinée par `games/peche_game/texturesPoisson.js`.

## Repère et unités

- Toutes les mesures d'un profil sont des **fractions de la longueur standard LS**
  (museau → base de la queue). `t = 0` museau, `t = 1` pédoncule.
- Le modèle va du museau (`x = +LS/2`) au pédoncule (`x = -LS/2`), puis la caudale.
  Sa longueur totale (museau → bout de la caudale) vaut exactement
  `FORMES[form].longueurRef` : `echellePourTaille(cm, form)` reste juste (1 unité = 50 cm).
- Ondulation de nage (`ambiance.js`) : `rear = -x / swimDemi`, amplitude `swimAmp`
  (= `bodyZ` de la silhouette).

## Maillage

| Partie | Mesh | Détail |
|---|---|---|
| Corps + dorsale(s) + anale + adipeuse | 1 (2 matériaux), animé | 60 anneaux × 30 segments, section en superellipse (`n` dos, `nb` ventre), capuchons |
| Caudale | 1, dans `tailPivot` | grille 16 × 6, contour `fourche`, `breme`, `echancree`, `arrondie`, `silure`, `fine` |
| Pectorales + pelviennes | 1, dans `details` | posées sur la surface (`zSurface`) |
| Yeux | 2, dans `details` | pupille, iris (`oeil`), cercle sombre (couleurs de sommets) |
| Bouche, barbillons | 1 + 1, dans `details` | fente sombre ; tubes effilés |

Environ 5 000 à 5 750 triangles et 6 à 7 meshes par poisson ; textures 256 × 128 (corps,
une par espèce) et 128 × 64 (rayons des nageoires, partagée).

## Mesurer une espèce sur sa photo

1. `python3 scripts/mesure-silhouette.py <espece> '{"museau":[x,y],"pedoncule":[x,y]}'`
   segmente le poisson (seuils à régler dans `masque()` selon le fond de la photo),
   écrit le masque dans `$MESURES` et imprime `h`, `y` tous les 5 % de LS.
   Ajouter un 3e argument `{"zone":[x0,y0,x1,y1]}` pour échantillonner des couleurs (médianes).
2. Si le fond est trop chargé (gravier, herbes), relever le contour à la main sur
   une photo quadrillée et le vérifier par superposition :
   `python3 scripts/trace-silhouette.py <espece>` (tracé dans `TRACES`).
3. Reporter les valeurs dans `PROFILS[<espece>]` et `ANATOMIES[<espece>]`, les couleurs
   (`couleur` = flanc, `dos`, `ventre`, `tete`, `nageoires`, `oeil`, `teinteMotif`) dans `SPECIES`.
4. Contrôler sur `tailles.html` (photo à côté du modèle) et lancer
   `node games/peche_game/tests/run.mjs` (`scenario-modeles.mjs` vérifie longueurs et budget).

## Espèces calibrées

| Espèce | Photo | LS (px) | Méthode | Points clés |
|---|---|---|---|---|
| Brème | `breme.jpg` | 720 | masque automatique (fond béton) | h max 0,196 à t 0,5 ; pédoncule 0,043 ; œil t 0,061 ; dorsale t 0,56-0,74 ; anale t 0,65-0,93 ; caudale 0,21 LS |
| Brochet | `brochet.jpg` | 797 | contour relevé + superposition (gravier) | h max 0,0875 à t 0,55 ; œil t 0,18 ; ouïe t 0,354 ; dorsale t 0,82-0,94 ; anale t 0,80-0,91 |
| Silure | `silure.jpg` | 691 | masque automatique (eau sombre), vue de trois quarts | tête large (w > h jusqu'à t 0,2) ; anale t 0,42-0,985 ; barbillons 0,28 LS |
| Sandre | `sandre.jpg` | 692 | contour relevé + superposition (gravier), `scripts/trace-silhouette.py sandre` | h max 0,103 à t 0,4 ; pédoncule 0,034 ; œil t 0,092 (r 0,021) ; ouïe t 0,30 ; 1re dorsale t 0,347-0,622 (repliée) ; 2e dorsale t 0,666-0,921 ; anale t 0,731-0,86 ; caudale 0,155 LS, presque droite |

Les 13 autres espèces utilisent le profil type de leur silhouette (à affiner une par une).

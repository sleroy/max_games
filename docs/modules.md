# Modules du jeu de pêche — contrats et propriété

> Dernière mise à jour : **2026-11-17** · jeu **v245** (la ligne qui bouge attire les poissons : plouf d'arrivée et sillage de la remontée — `comportement.js`, `chanceTouche.js` ; oiseaux et libellules 3D conservés)
> Objectif : permettre à **plusieurs agents de travailler en parallèle** sans se
> marcher dessus, en gardant des fichiers petits (coût de modification faible).

## 1. Pourquoi ce document

`script.js` a longtemps porté tout le jeu (**9 581 lignes**, ramené à ~9 300 en v142). Toute modification
obligeait à ouvrir ce fichier : deux agents qui travaillent en même temps finissent
donc par éditer le même fichier, et leurs changements se mélangent (c'est arrivé :
des fichiers « en vol » ont été avalés par le commit d'un autre agent).

Règle de base : **un agent = un fichier**. Ce tableau dit qui possède quoi.

## 2. Contrat d'un module

Un module du jeu respecte ces règles (vérifiées par `tests/scenario-modules.mjs`) :

1. **Pas d'accès aux globales de `script.js`.** Tout ce dont le module a besoin
   arrive par un objet `deps` (injection de dépendances), comme le font déjà
   `demelage.js`, `quiver.js` et `decor.js`.
2. **Pas de dépendance à `window` / au DOM global.** Si un module a besoin d'un
   élément, on lui passe l'élément (ou une fonction qui le rend).
3. **Aucun module n'importe `script.js`** (pas de cycle). `script.js` est la racine.
4. **Une seule responsabilité par module**, et une API explicite :
   - `export function creerXxx(deps) { ... return { ... }; }` pour un système ;
   - `export const DONNEES` / `export function utilitaire(...)` pour des données ou
     des fonctions pures.
5. **Plafond de lignes** : **800 max** par module (hors commentaires d'en-tête).
6. **Version de cache** : l'import porte `?v=N` (`./decor.js?v=141`). Le test
   statique existe déjà pour `sound.js` (même version que `index.html`) ; on
   incrémente toutes les versions à la livraison.
7. **Un scénario de test** propre au module dès qu'il contient de la logique
   (`tests/scenario-<module>.mjs`). Le `decor.js` est couvert indirectement
   (nénuphars, accrochages, carte) et par le test statique.

## 3. État actuel (v141)

| Module | Rôle | Lignes | Propriétaire / à qui le modifier |
|---|---|---|---|
| `script.js` | Orchestrateur : scène 3D, câblage, pont `etat`, API de test | ~2 990 | **Personne en parallèle** — à réduire |
| `environnement.js` | Étang : centre, **rayon reconstructible** (`POND_RADIUS` = 90 = la plaine de référence ; `setRayonMonde(r)` recalcule centre, contour, `FOSSES` (tableau rempli EN PLACE : décalages et rayons × r / 90, `plus` inchangé), `RAYON_ETANG_MAX`, `SURFACE_ETANG` / `SURFACE_HA`, `PROFONDEUR_MAX`, `RAYON_CADRE_CARTE`, `DEMI_COTE_FOND` et `DEMI_COTE_X` / `DEMI_COTE_Z` (grille rectangulaire des fonds) ; `setRayonMonde(r, forme)` (forme par défaut `etang` ; l'ancre du poste sud ne bouge pas, décalages des fosses mis à l'échelle PAR AXE) ; liaisons vivantes `export let`, et l'objet **`monde`** (accesseurs : `rayon`, `echelle`, `rayonMax`, `surfaceHa`, `profondeurMax`, `rayonCadre`, `porteeLancer`, `porteeAmorce`…) à lire à CHAQUE usage, jamais copié dans un `deps`), contour (`rayonEtang`, `BRUIT_ETANG`), relief et 3 fosses, maillages du fond (`makeFondGeometry`), de l'eau (`makeWaterGeometry`) et de la rive (`makeShoreGeometry`), **verdict du fond** (`verdictFond`, `MARGE_VASE`). Le centre se déplace pour que la rive sud (poste de départ) reste en place. Plaine = monde d'origine au bit près | ~310 | Monde (à faire seul) |
| `dimensions.js` | **Dimensions d'un étang, fonctions PURES** (sans `three`, partagé par `milieux.js`, `environnement.js` et les tests) : `RAYON_REFERENCE` (90), `HARMONIQUES` du contour, `VARIATION_CONTOUR`, `facteurContour`, `rayonContour(rayon, angle)`, `COEFFICIENT_SURFACE`, `surfaceUnites(rayon)`, `surfaceHectares(rayon)` (**seule vérité de la surface** : 4 unités² = 1 m²), `echelleDeRayon` (f = rayon / 90), `porteeLancer` (52 × f borné [20 ; 140]), `porteeAmorce`, `echelleAmbiance` (brume, ciel, caméra, sol : 1 jusqu'à la plaine, f au-delà) et leurs références (`BRUME_REFERENCE`, `CIEL_REFERENCE`, `CAMERA_FAR_REFERENCE`, `RIVE_EXTERIEURE_REFERENCE`). **FORMES** (v241) : `FORMES` / `IDS_FORMES` (`etang` = contour d'origine, `lac` 1,5 : 1 exposant 2,4, `canal` 5 : 1 exposant 7, `riviere` 3,5 : 1 exposant 2,8 avec méandre ; superellipse + harmoniques, normalisée pour garder le même sens de `rayon`), `forme` en dernier paramètre de `rayonContour`, `surfaceUnites`, `surfaceHectares`, `coefficientSurface(forme)`, `extents(rayon, forme)` → `{ maxX, maxZ }`, `echelleExtent`, `echelleAxes`, `angleParSurface` / `angleParBord` / `angleSurForme`, `pointAuBord`, `formeConnue`. Chaque forme reste ÉTOILÉE (un rayon = une rive). Sans forme = `etang` : la plaine est le monde v239 au bit près | ~100 | Monde / équilibrage |
| `tailleEtang.js` | **Le monde suit la taille de l'étang** : `creerTailleEtang(deps)` → `surGeometrie` (maillages de l'eau, du fond et de la rive refaits sur le nouveau contour, brume, sphère du ciel, `camera.far`, portée de l'amorce, pas de la barque), `apresGeometrie` (carte de placement refaite, **la partie redémarre** puis le pêcheur retourne au poste sud : on ne reconstruit pas à chaud une ligne en l'air), `majRive` (répétitions de la texture d'herbe), `resolutionEau(echelle)`. Appelé par `creerMilieux` | ~110 | Monde / biotopes |
| `poissons.js` | Population calculée d'après la surface et la biomasse (≈ 58 poissons, 100–300 kg/ha, solitaires rares, poissons de fond en fosse), fabrique 3D, bancs, spécimens hors norme, respawn **Taille d'étang** : surface des kg/ha = surface réelle (`deps.monde.surfaceHa`) ; marge au bord du tirage de position ×  min(1, f) ; territoires (`homeRadius`) × f. | 773 | Poissons / contenu |
| `combat.js` | Épreuve de force : tension, fatigue, ferrage, touche vue de près, clic utile, accrochage ; portrait du poisson ferré = rendu du modèle 3D (`apercuPartage`, une fois par ferrage, canvas 300 × 180) avec repli sur `portraits.js` sans WebGL (état via `etat`) | ~750 | Combat |
| `comportement.js` | Comportement des poissons : vue, zone de vie, banc, vitesse, humeur, morsure et nage, verdict du fond sous le bouchon (`jugerFond`), remous du petit coup de moulinet (`dandiner`), **plouf d'arrivée** (`data.plouf`) et **sillage de la remontée** (`etat.sillage`) (état via `etat`) Marges au bord de l'évitement et du rebond × min(1, f). **Culling** : appelle `culling.poissonAAttendre` et gèle les poissons hors de portée. | 796 | Poissons / contenu |
| `culling.js` | **Quels poissons simuler** (LOD de population) : `creerCulling({ angler, floatGroup, monde })` → `poissonAAttendre(data)` (vrai si le pêcheur peut poser l'esche dans le domaine du poisson, ou si le bouchon y est déjà) et `margeDomaine`. Deux distances au carré par poisson et par image ; un poisson non attendu est GELÉ par `comportement.js`. Rend possibles les grands plans d'eau très peuplés (950 poissons en rivière) sans coût CPU proportionnel. | ~55 | Poissons / performance |
| `bateau.js` | Mode bateau : barque (modèle, textures), rame, pad tactile, embarquement, collision avec les obstacles, poste sur le ponton (état via `etat`) **Limites × f** (échelle de l'étang) : jamais à moins de 10 × f du centre, au plus près 4 × f (borné [0,5 ; 3]) de la berge, visées par défaut 30 / 22 × portée de l'étang / portée de la plaine (lues à chaque usage dans `deps.monde`). | 565 | Bateau / monde |
| `lancerPoisson.js` | Lancer du poisson dans la bourriche : prise en main, lancer, arc de vol (état via `etat`) | 206 | Bourriche / lancer |
| `carnetUI.js` | Onglets du carnet (Prises / Boutique / Touches / Options) et carte de l’étang à l'échelle du cadre (état via `etat`) Rayon, cadre et profondeur max lus dans `deps.monde` à chaque dessin ; tracé des fonds mémorisé par empreinte de la grille. | 159 | Carnet / UI |
| `boutique.js` | Expérience (XP) et boutique de bouchons : gains, achats, rendu (état via `etat`) | 264 | Boutique / progression |
| `fiches.js` | Onglet Espèces : fiche par poisson (aperçu 3D via `apercuPoisson.js` avec silhouette SVG de secours, photo réelle + crédit depuis `assets/references/photos.json`, zone de vie, comportement) (état via `etat`) « Où la trouver », abondance et record dans le biotope choisi. | 124 | Carnet / UI |
| `lancerCanne.js` | Lancer de la canne au dosage (jauge) et animation du geste de lancer (état via `etat`) **Portée maximale = `deps.monde.porteeLancer`** (52 × f borné [20 ; 140], lue à chaque lancer). | 182 | Lancer |
| `lancer.js` | **Geste de lancer commun** (amorce et sonar) : visée, jauge de puissance, point d’impact, arc de vol, arrivée. Les objets lançables s’enregistrent dans `etat.projectiles` (`etat.declarerProjectile`) | 243 | Lancer / outils |
| `amorcage.js` | Amorçage : boule d’amorce (stock, plouf, nuage de miettes qui attire les poissons), bras du pêcheur et barre d’outils (état via `etat`) | 205 | Amorçage / outils |
| `frein.js` | Frein du moulinet (on lâche du fil quand le poisson charge) et didacticiel (état via `etat`) | 132 | Frein / tutoriel |
| `ligne.js` | Ligne + flotteur : tampon de la ligne, groupe du bouchon, textures, opacité, bornes de profondeur, **coupe de l'eau** (schéma de profondeur, `majCoupeProfondeur`) (état via `etat`) | 180 | Ligne / bouchon |
| `bouchons.js` | Types de bouchons (flotteurs), scions du quiver, capacités spéciales (état via `etat`) | 188 | Bouchons / boutique |
| `placement.js` | Carte de placement vue de dessus (écran d’accueil, terrain de 260 unités) et hauteur du terrain (état via `etat`) `reconstruireCarte()` refait le relief, le plan d'eau, le rivage, les repères et la couronne quand la taille de l'étang change (largeur du terrain et caméra × f borné [0,25 ; 3,2] : 260 dans la plaine). | 403 | Monde / placement |
| `meteo.js` | Météo : beau temps → rafales → pluie, piloté par le temps de jeu (état via `etat`) Rides de pluie à 54 × f du centre. | 110 | Météo / ambiance |
| `vie.js` | Vie ambiante (oiseaux, libellules, poisson qui saute) et bulles sous l’eau (état via `etat`) **Oiseaux** : trois espèces (`modeleOiseau.js`), cercle et altitude propres, cap du bec d’après la vitesse ; **libellules** : trois robes (`modeleLibellule.js`), ancre au-dessus de l’eau × f et pointes sèches de 0,45 s. Libellules et poisson qui saute : écarts au centre × f ; oiseaux : orbite × max(0,5 ; f). | 233 | Ambiance / faune |
| `sonar.js` | Sonar : bouée **lancée comme une amorce** (via `lancer.js`), radar, ondes jaunes, achats (sonar, barque), rangement (état via `etat`) | 233 | Sonar / boutique |
| `stocks.js` | Stocks : lignes de rechange, fils, **esches ILLIMITÉES** (toutes disponibles, esche équipée, aucune consommation depuis la v192), amorce de départ, achat de recharges (état via `etat`) | ~145 | Boutique / stocks |
| `menus.js` | Menus déroulants de la barre du haut : 🪱 **Esche** (toutes les esches, équipement immédiat) et 🎈 **Matériel** (bouchons, ou scions en quiver : possédés à équiper, puis achats en XP). Panneau superposé, sans modale ni fond assombri ; un seul menu ouvert ; clic extérieur / Échap ; clavier ↑ ↓ Home Fin Entrée (role=`menu`, `aria-expanded`, `aria-activedescendant`) | ~260 | UI / barre du haut |
| `journal.js` | Carnet de pêche : chargement/sauvegarde, rendu, ajout d’une prise (état via `etat`) Ligne « Milieu : … » ; records par biotope (`addJournalEntry(poids, espèce, cm)`). | 112 | Carnet / persistance |
| `touches.js` | Catalogue des touches : durées, mouvements du bouchon, tirage vrai/faux (état via `etat`) | 165 | Touches / contenu |
| `cycleLigne.js` | Cycle de la ligne : visée sur l’eau, lancer, remontée, touche détectée, fin du lancer (état via `etat`) | 197 | Lancer / ligne |
| `accrochage.js` | Accrochage dans les nénuphars, la vase et les obstacles : détection, accroc, dégagement du fil (état via `etat`) | 226 | Combat / accroc |
| `ambiance.js` | Ambiance : vent, faune sonore, nuages, ondulation de la queue des poissons (état via `etat`) | 95 | Ambiance / effets |
| `entrees.js` | Entrées : pointeur, clavier et boutons de l’écran de jeu (état via `etat`) | 225 | Entrées / UI |
| `cheat.js` | Cheats : mots secrets « poisson » (+50 XP) et « aquarium » (eau transparente `uClear` + poissons visibles via `scene.onBeforeRender`) et « radar » (bascule `radar.js` ; Échap le ferme en premier) (état via `etat`) | 179 | Cheat / tests |
| `radar.js` | Cheat « radar » (§17.3) : carte 2D superposée avec **tous les poissons** (couleur par espèce, rayon ∝ longueur, trait de cap, cercle de zone de vie), le pêcheur (triangle orienté), le bouchon et la barque. Fond = contour de `rayonEtang` + `substrats.rectsCarte()` dans des éléments SVG séparés de la carte du carnet. Rafraîchi à ~10 Hz, **aucune mise à jour du DOM** quand il est fermé. API : `basculer()`, `estActif()`, `maj(dt)`, `fermer()` (+ lecture seule pour les tests : `points()`, `pecheur()`, `misesAJour()`) Échelle (`monde.rayonCadre`) et fond relus quand le biotope change la taille ou la grille. | ~235 | Cheat / UI |
| `boucle.js` | Boucle d’animation : une image du jeu, ragondin, pause, horloge (état via `etat`) | 212 | Boucle / rendu |
| `partie.js` | Partie : lignes (vies), remontée trop rapide, classement, fin de partie, accueil (état via `etat`) | 465 | Partie / règles |
| `pecheur.js` | Pêcheur, canne et geste de lancer : modèle 3D, poses, charge et fouetté (état via `etat`) | 252 | Pêcheur / canne |
| `rendu.js` | Rendu : renderer WebGL, tone mapping, post-traitement (bloom + vignette) (état via `etat`) | 193 | Rendu / graphismes |
| `messages.js` | Messages 3D flottants + anneaux de touche ratée | 126 | UI / feedback |
| `bourriche.js` | Bourriche (panier) : maillage et compte | 66 | Bourriche |
| `ondulations.js` | Ondulations de surface (`spawnRipple`) | ~60 | Eau / effets |
| `dom.js` | Éléments de la page lus par script.js : `lireDom()` rend `{ canvas, scoreDisplay, … }` (mêmes noms que les anciennes constantes) | ~150 | UI / page |
| `camera.js` | Caméra : `creerCamera(deps)` crée la `PerspectiveCamera`, FOV horizontal garanti (`fovPourAspect`), vue réglable (boutons et geste à deux doigts), suivi en douceur (`updateCameraPosition`) et `resize` (état via `etat`) | ~125 | Rendu / caméra |
| `ciel.js` | Ciel et soleil : `creerCiel(deps)` — dégradé du ciel (`skyMat`, `sky`), soleil à azimut fixe (`SUN_AZIMUT` = 225, `azimutTexte`, `directionAzimut`), lumières (ambiante, ciel/sol, soleil dont l'ombre suit le pêcheur), disque et halo du soleil, cycle jour / nuit (`updateDayNight`, `DAY_LENGTH`) (état via `etat`) | ~190 | Ambiance / lumière |
| `manivelle.js` | Manivelle du moulinet : `creerManivelle(deps)` → `consumeCrankTurns()` ; glisser du pointeur, cliquet sonore, patinage au-delà de la vitesse maximale, avertissement de remontée trop rapide (état via `etat`) | ~110 | Moulinet / entrées |
| `splashes.js` | Éclaboussures (ferrage, amorce) | ~50 | Effets |
| `sound.js` | Moteur audio (samples + synthèse) | 798 | Audio |
| `portraits.js` | Portraits 2D des espèces (fond transparent). **Repli** du panneau de combat : utilisé seulement quand le rendu 3D (`apercuPoisson.js`) est impossible (pas de WebGL) | 282 | Combat / UI (repli) |
| `modelePoisson.js` | **Fabrique 3D paramétrique** d'un poisson, partagée par le jeu (`poissons.js`) et `tailles.html` : corps par sections (60 anneaux × 30 segments, superellipse) le long d'un profil `{t, h, w, y, n}` (`especes.js` → `PROFILS`), nageoires attachées (dorsale(s), anale, adipeuse dans le maillage du corps ; caudale dans `tailPivot` ; pectorales, pelviennes, yeux, bouche, barbillons dans `details`), `echellePourTaille`. Longueur du modèle = `FORMES[form].longueurRef`. Module pur (aucun état du jeu). Plafond 800 | ~610 | Poissons / 3D |
| `teteBec.js` | **Tête à bec** du moteur `modelePoisson.js` (brochet ; réutilisable : sandre, silure) : `profilAvecBec` (museau aplati et élargi, dessus et dessous en droites), `preparerTete` (anneaux de la tête avec fente de gueule : mâchoire supérieure et inférieure séparées, la basse avancée de `saillieMachoire`, palais/plancher/parois sombres, dents, narines ; faces fantômes pour les normales), `pupilleVerticaleGeometrie`. Paramètres : `bec` et `bouche` dans `ANATOMIES` (`especes.js`). Module pur : `sommet`, `spow` et SEGMENTS lui sont passés (pas d'import circulaire). Plafond 800 | ~250 | Poissons / 3D |
| `apercuPoisson.js` | **Aperçu 3D d'un poisson en image** (data URL PNG), partagé par `tailles.js` (galerie, instance propre), `fiches.js` (fiche « Espèces » du carnet) et `combat.js` (portrait du panneau de combat). `apercuPartage()` = instance unique paresseuse (720 × 480, cache de 64 images) pour fiche + combat : un seul contexte WebGL. `creerApercuPoisson({largeur, hauteur, cacheMax})` → `{ rendre(espece, cm), disponible(), liberer() }` : un seul `WebGLRenderer` transparent créé au premier rendu, cadrage sur la boîte englobante, recadrage des pixels visibles, cache `id:cm`, géométries libérées après rendu (textures partagées conservées). Sans WebGL ni `document` : `rendre` renvoie `null`, jamais d'exception. Aucun accès à `window`. Plafond 800 | ~210 | Poissons / 3D |
| `blackBass.js` | **Données mesurées du black-bass** (`black-bass.jpg`) : `PROFIL_BLACK_BASS` (silhouette tous les 5 % de LS), `ANATOMIE_BLACK_BASS` (nageoires, œil, bouche, opercule ; les nageoires portent leur `forme` et la caudale son `contour`, lus par `modelePoisson.js` avant ses tables génériques) et `ROBE_BLACK_BASS` (couleurs, écailles, taches, bande). `especes.js` les branche (`PROFILS['black-bass']`, `ANATOMIES['black-bass']`, champs de l'espèce). Module de données pur, sans import. Plafond 800 | ~110 | Poissons / 3D |
| `chevesne.js` | **Données mesurées du chevesne** (`chevesne.jpg`) : `PROFIL_CHEVESNE` (silhouette tous les 5 % de LS), `ANATOMIE_CHEVESNE` (nageoires avec leur `forme`, caudale avec son `contour`, œil, bouche, opercule) et `ROBE_CHEVESNE` (couleurs, grandes écailles à liseré sombre, nageoires rougeâtres/brunes). `especes.js` les branche (`PROFILS.chevesne`, `ANATOMIES.chevesne`, champs de l'espèce). Module de données pur, sans import. Plafond 800 | ~90 | Poissons / 3D |
| `rotengle.js` | **Données mesurées du rotengle** (`rotengle.jpg`) : `PROFIL_ROTENGLE` (silhouette tous les 5 % de LS, corps haut et comprimé), `ANATOMIE_ROTENGLE` (nageoires avec leur `forme`, caudale avec son `contour`, œil rouge, bouche remontante, opercule) et `ROBE_ROTENGLE` (couleurs, grandes écailles à liseré sombre, nageoires rouge-orangé). `especes.js` les branche (`PROFILS.rotengle`, `ANATOMIES.rotengle`, champs de l'espèce). Module de données pur, sans import. Plafond 800 | ~85 | Poissons / 3D |
| `goujon.js` | **Données mesurées du goujon** (`goujon.jpg`) : `PROFIL_GOUJON` (silhouette tous les 5 % de LS, corps allongé presque cylindrique, ventre plat), `ANATOMIE_GOUJON` (nageoires avec leur `forme`, caudale avec son `contour`, œil, bouche infère, barbillons, opercule) et `ROBE_GOUJON` (couleurs, fines écailles, points et taches latérales via le motif `bandeLaterale`). `especes.js` les branche (`PROFILS.goujon`, `ANATOMIES.goujon`, champs de l'espèce). Module de données pur, sans import. Plafond 800 | ~85 | Poissons / 3D |
| `carassin.js` | **Données mesurées du carassin** (`carassin.jpg`) : `PROFIL_CARASSIN` (silhouette tous les 5 % de LS, corps très haut et ovale, dos convexe), `ANATOMIE_CARASSIN` (dorsale longue à bord convexe, anale, pelviennes pendantes à base large, caudale avec son `contour`, œil, bouche terminale, opercule ; pas de barbillons) et `ROBE_CARASSIN` (couleurs, grandes écailles, points sombres, tache du pédoncule via le motif `bandeLaterale`). `especes.js` les branche (`PROFILS.carassin`, `ANATOMIES.carassin`, champs de l'espèce). Module de données pur, sans import. Plafond 800 | ~95 | Poissons / 3D |
| `motifBande.js` | **Motif « bande latérale »** de la robe (`dessinerBandeLaterale`) : écailles discrètes, points sombres, taches verticales irrégulières soudées en ruban continu vers la queue. Appelé par le motif `bandeLaterale` de `texturesPoisson.js`, qui lui passe ses outils (`css`, `melanger`, `tache`, `ecailles`) : pas d'import de `texturesPoisson.js` (pas de cycle). Options lues dans l'espèce : `taches`, `bande`, `pointsEcailles`, `ecailles`. Plafond 800 | ~95 | Poissons / 3D |
| `texturesPoisson.js` | Textures procédurales des poissons : robe 256 × 128 par espèce (dégradé dos → ventre, motif, tête, ouïe, ligne latérale ; cache par `espece.id`), rayons des nageoires. `MOTIFS_GERES` liste les motifs connus (testé par `scenario-modeles.mjs`) | ~375 | Poissons / textures |
| `modeleOiseau.js` | **Fabrique 3D paramétrique d'un oiseau** (`corneille`, `mouette`, `hirondelle`) : corps par sections (30 anneaux × 10 segments, tête fondue dans le profil), ailes **articulées** (membrane interne + poignet avec membrane externe et 5 rémiges), queue en éventail ou fourchue, bec et yeux. `animerOiseau` bat des ailes (battement, vrillage, poignet en retard, glissades) et anime la queue. Repère bec → +X ; aile gauche = miroir (`scale.z = -1`, rotations signées). Module pur (aucun état du jeu). Plafond 800 | 402 | Ambiance / 3D |
| `modeleLibellule.js` | **Fabrique 3D paramétrique d'une libellule** (`azur`, `verte`, `rouge`) : thorax trapu, abdomen de 10 segments articulé à la taille, tête et grands yeux composés, **quatre ailes** membraneuses nervurées (texture transparente), six pattes en panier (une géométrie de lignes). `animerLibellule` bat les paires avant/arrière en décalage et ondule l'abdomen. Module pur. Plafond 800 | 318 | Ambiance / 3D |
| `texturesVie.js` | **Textures procédurales de la vie ambiante** : plumage des oiseaux 128 × 64 (corps : dégradé dos → ventre, écailles de plumes ; aile : rémiges), aile de libellule 128 × 64 sur fond transparent (membrane, costa, nervures, ptérostigma) et abdomen 128 × 32 (10 segments, ligne dorsale). Caches par espèce. Plafond 800 | 214 | Ambiance / 3D |
| `demelage.js` | Mini-jeu de démêlage | 281 | Lancer |
| `especes.js` | **Données** espèces, comportements, styles, touches, silhouettes 3D (`FORMES`, `PROFILS`, `ANATOMIES` lus par `modelePoisson.js`) | ~490 | Contenu (ajout d'espèces) |
| `obstacles.js` | Obstacles aquatiques (§14.2) : ponton (aussi poste de pêche), écluse, douve, roches, souches, pieux, épave, îlots de joncs. Placement déterministe (sans `rand()`), rendu 3D généré en code, accrochage (`ACCROCHAGES`), attraction d'espèces (`attirer`), collision barque (`heurtBarque`) et lancer (`lancerBloque`). **`reconstruire()`** repose tout dans le contour actuel quand le biotope change la taille de l'étang (distances au bord × f, zones libres autour des postes × min(1, f), tailles inchangées ; un obstacle sans place libre est omis ; `liste` et `postesRef` refaits EN PLACE). Plafond 800 | ~690 | Monde / obstacles |
| `esches.js` | Esches (§15.2) : maïs, ver, pain / flocons, bouillette, vif / leurre. Modèle pur (`ESCHES`, `coucheHamecon`, `efficaciteEsche` : espèce × couche × substrat ; mode facile : `chanceMaximaleEsche` / `acceptationFacile`, 100 % au-dessus de `SEUIL_FACILE` = 60 %, sinon 0) et système (`creerEsches` : décision d'un poisson arrivé sur l'hameçon, une fois par poisson et par lancer, message discret après plusieurs refus, étiquette du widget). Générateur local, jamais `rand()` | 306 | Esches / pêche |
| `substrats.js` | Types de fond (§14.3) : sable, gravier, vase, roche, herbier. Grille déterministe (sans `rand()`) dérivée du relief, des fosses, de l'exposition au vent et des nénuphars/roseaux du décor. Source unique de la texture du fond (`pixelsFond`, `habillerFond` ; l'ancienne texture est libérée à chaque changement de biotope), de la carte du carnet (`rectsCarte`), du verdict de fond sous l'hameçon (`verdictFond`, accrochages vase / herbier / roche) et de l'habitat des poissons (`attirer`, `COMPORTEMENTS[...].substrats`). **Biotopes** : la grille est **reconfigurée à chaque changement de taille d'étang** (`configurerGeometrie` : cellule × f borné [0,35 ; 2,5], pas du vent, bruit et marges ramenés à l'échelle ; `grille`, `taille`, `cellule`, `origine`, `cote` sont des accesseurs) ; `appliquerMilieu(milieu)` refait la grille EN PLACE d'après le décor actuel et les parts de fonds du biotope (affinités lisses par substrat + décalages ajustés par itérations, sans hasard ; la plaine garde la règle naturelle d'origine) ; mêmes graine et biotope = même grille. Plafond 800 | ~650 | Monde / fonds |
| `physique.js` | Physique de l'eau (§15.1) : heures actives, pression, **saisons, température de l'eau, thermocline**. Modèle pur (`heureDeJeu`, `phaseDeHeure`, `periodeDeJournee`, `texteHeure`, `activiteHoraire`, `facteurHoraire`, `PRESSION_CIBLE`, `facteurPression`, `limiterFacteur`, `flecheTendance`, `saisonDe`, `temperatureSaison`, `temperatureJour`, `temperatureCible`, `intensiteThermocline`, `profondeurThermocline`, `temperatureEnProfondeur`, `facteurTemperature`, `vitaliteThermique`, `texteEauPour`) et système (`creerPhysique` : pression, année, température et thermocline suivies image par image, `etat.facteurTouche(comp)` appelé par `combat.js`, `etat.thermocline` = **seule** source de la couche d'eau chaude, lignes de HUD et de widget, `crochets` de test repris dans `window.__game` par `script.js`). Aucun `rand()`. Plafond 800 | ~410 | Météo / physique |
| `decor.js` | Décor de l'étang : arbres, roseaux, rochers, nénuphars (expose aussi leurs positions à `obstacles.js`). Les comptes et le style viennent du **biotope** (`milieux.js` : `densitesDecor`, `styleDecor`). Monde d'origine = plaine (64 / 40 / 70 / 24) avec le `rand()` du jeu, tirages mémorisés ; `appliquerMilieu(milieu, obstacles)` reconstruit le décor EN PLACE (comptes et bande des arbres × f ; marges au bord ≤ 1 ; un petit étang retente les places d'arbre refusées ; sphères englobantes remises à zéro) (mêmes tableaux) avec un générateur local (graine du monde + biotope) et évite les obstacles déjà posés ; revenir en plaine rejoue le décor d'origine | ~300 | Monde / décor |
| `vegetation.js` | Roseaux et touffes d'herbe des berges qui ondulent au vent (shader de sommets, appelé par `decor.js`, sans `rand()`). `regler(densite)` : l'herbe visible suit le décor du biotope | 155 | Monde / décor |
| `chanceTouche.js` | **Chance de touche, source UNIQUE** (fonctions pures) : `rayonVue`, `rayonRemous`, `rayonBruit` et `attireParBruit` (remous, plouf d'arrivée `PLOUF_RAYON`, sillage de la remontée `SILLAGE_RAYON`), `dansCouche` (couche d'eau, fond, thermocline), `profondeurHamecon`, `ligneQuiver`, et `evaluerTouche(contexte)` qui combine attraction, couche, fond pris (`substrats.hameconSurSubstrat`), acceptation (`esches.efficaciteEsche`, ou `esches.acceptationFacile` en mode facile) et délai (`physique.facteurDelai`) avec la `raison` d'un refus. Utilisé par `comportement.js` et `script.js` ; vérifié par `tests/scenario-matrice-touche.mjs` (≈ 237 000 cas + concordance avec le jeu) et `tests/scenario-attraction-ligne.mjs` (plouf et sillage). Toute nouvelle règle de touche va ICI | 147 | Pêche / équilibrage |
| `matriceTouche.js` | Matrice des touches : grille (`parcourir`), résumé (`calculerResume`), **règles bloquantes** (`verifierRegles`) et **points à surveiller** (`aSurveiller`), conseils d'esche par espèce (`conseilsEsches`, bannière de l'avion). Module pur partagé par `tests/scenario-matrice-touche.mjs`, la page `matrice.html` (`matrice.js`, rendu seulement) et `vie.js` **Biotopes** : `taillesDe(espece, cmMax)`, `parcourir({ especes, cmMax })`, `verifierReglesMilieu(id)` / `verifierTousMilieux()` (chaque espèce présente reste pêchable à ≥ 50 % avec sa taille maximale du biotope, au moins une esche utilisable ; `perdues` = esches devenues inutilisables), `conseilsEsches(resume, especesIds)` (espèces du biotope seulement ; affiché sur `matrice.html`). | 237 | Pêche / équilibrage |
| `avion.js` | Avion (petit avion de tourisme glTF, `assets/avion.glb`, Vojtěch Balák, CC-BY 3.0 ; avion simple de secours) qui traîne une banderole de conseils d'esche : 2 meilleures esches et la pire par espèce (`matriceTouche.conseilsEsches`). Créé par `vie.js`, `maj(dt)` à chaque image, sans `rand()` `deps.especesIds()` (optionnel, défaut : toutes) limite les banderoles aux espèces du biotope. | ~190 | Ambiance / conseils |
| `conseilLocal.js` | Rien ne mord (facile 30 s, normal 60 s, dur jamais) : meilleur réglage (esche + profondeur, dans les bornes du bouchon) pour les poissons à moins de 5 m du bouchon, calculé avec `evaluerTouche` (`recommander`, pur) ; l'avion l'apporte (`avion.lancerMessage`). Facile : espèces nommées ; normal : « Papa » conseille sans rien dévoiler. Un conseil par lancer, au plus un toutes les 3 min. Créé par `vie.js` `especesIds` (optionnel) : seules les espèces du biotope sont conseillées. | ~170 | Ambiance / conseils |
| `milieux.js` | **Biotopes d'étang** (6 milieux au choix sur l'accueil : plaine, canal, carnassiers, montagne, forêt, rivière). Données pures et UNE SEULE source : parts de population par espèce (somme 100), décor (arbres / nénuphars / roseaux / rochers), fonds, teinte de l'eau, **rayon du plan d'eau** (12 / 45 / 70 / 90 / 180 / 280 unités : la TAILLE est une donnée du biotope ; la FORME aussi : `forme` = `etang` pour plaine, carnassiers et forêt, `canal`, `lac` (montagne), `riviere`), profondeur **écologique** (facteur de taille), densité. La surface n'est plus en dur : `surfaceHaDe(milieu)` la déduit de la géométrie (`dimensions.js`) et `capacite`, `facteurTaille` et la biomasse la lisent. Fonctions pures : `milieuParId`, `partsEspeces`, `especesPresentes`, `quotasEspeces` (allocation par plus forts restes, ≥ 1 par espèce présente, minimum de banc), `capacite`, `facteurTaille` / `tailleMaxEspece` (taille maximale selon surface et profondeur), `densitesDecor` (comptes × f : arbres, roseaux, rochers ; nénuphars × f² borné [0,3 ; 3]), `styleDecor` (bande des arbres × f), `rayonDe`, `echelleMilieu`, `surfaceHaDe`, `partsSubstrats`, `eauDe`, `ouTrouver`. Système `creerMilieux(deps)` : `choisir(id)` (mémorise `journal.milieu`, applique), `appliquer(id)` et `demarrer()` (biotope du carnet, appelé quand tout le monde existe) ; un changement applique d'abord la TAILLE (`setRayonMonde`, `tailleEtang.js`), puis eau, décor, obstacles (reposés dans le nouveau contour), fonds, partie redémarrée au poste sud, et **repeuple** l'étang. Plafond 800 | ~290 | Contenu / équilibrage |
| `classement.js` | Classement local | 111 | UI / persistance |
| `quiver.js` | Indicateur de scion | 105 | Technique quiver |
| `carnet.js` | Persistance du carnet (localStorage) Lit `milieu` (biotope, défaut plaine) et `records` par biotope `{ milieu: { espèce: { cm, kg, milieu } } }` (`lireRecords` : anciens carnets et valeurs numériques convertis). | 88 | Persistance |

**Somme ≈ 11 700 lignes**, dont **~73 % encore dans `script.js`**.

## 4. Découpage à faire (ordre = valeur pour le parallélisme)

Chaque ligne = un module futur, avec sa frontière. Deux agents peuvent prendre deux
lignes différentes **sans se rencontrer**.

| Module cible | Contenu à sortir de `script.js` | Bloc actuel (approx.) | Dépendances entrantes |
|---|---|---|---|
| `eau.js` | maillage + shader d'eau, reflet planaire, ondulations | 1124–1310 | moyen |
| `meteo.js` | jour/nuit, météo, vent, girouette | 751–790, 4951–5041 | moyen |
| `combat.js` | épreuve de force, frein, accrochages | 6176–7013 | moyen |
| `pecheur.js` | pêcheur, canne, geste de lancer | 1652–1884 | faible |
| `ligne.js` | fil, bouchon, profondeur, flotteurs achetables | 1956–2304 | faible |
| `amorcage.js` | boules d'amorce et attraction | 2305–2651 | faible |
| `bourriche.js` | bourriche et lancer du poisson | 2652–2695, 4486–4668 | faible |
| `bateau.js` | barque : modèle, textures, déplacement, pad | 2740–3231 | faible |
| `placement.js` | postes autour de l'étang + carte 3D de placement | 2696–2739, 3232–3608 | moyen |
| `carnetUI.js` | onglets, fiches espèces, carte du carnet | 3609–3976, 4217–4485 | faible |
| `boutique.js` | XP, achats, rendu boutique | 3977–4216 | faible |
| `ambiance.js` | faune, bulles, splashes, ondulations, messages 3D | 5042–5193, 7014–7274 | faible |

**Ordre recommandé** (le plus gros gain d'abord, mais un module par livraison) :

1. ~~`environnement.js`~~ — **fait (v142)** : indispensable avant d'agrandir l'étang (14.1).
2. ~~`poissons.js`~~ — **fait (v143) pour la population** ; reste le **comportement**
   (déplacement, bancs, vision, zone de vie) à extraire dans `comportement.js`,
   prérequis des fonds (14.3) et de la densité (14.4).
3. `combat.js` — prérequis de l'épuisette et du frein (15.3).
4. `pecheur.js`, `ligne.js`, `amorcage.js`, `bourriche.js` (petits, sûrs).
5. `meteo.js`, `ambiance.js`, `placement.js`, `carnetUI.js`, `boutique.js`.
6. `bateau.js` — quand les obstacles (14.2) arriveront, puisque la barque les touchera.

## 5. Comment deux agents travaillent en parallèle (sans se marcher dessus)

1. **Un worktree par agent** : `~/git/wt/<numéro>-<slug>` — jamais le checkout
   principal (règle déjà en place, voir `AGENTS.md` du dépôt).
2. **Une branche par agent**, un PR par agent.
3. **Fichier possédé** : chaque agent ne modifie que les fichiers de sa ligne du
   tableau. Si `script.js` doit changer, la modification est **minimale** : un
   import + un appel `creerXxx(deps)`.
4. **Ordre de fusion** : les extractions de modules d'abord (elles bougent beaucoup
   de code), les fonctionnalités ensuite. Une fonctionnalité ne se développe
   **jamais** dans `script.js` si son module existe.
5. **Conflit inévitable** : `script.js`, `index.html`, `style.css` et `run.mjs`.
   Le garder petit et l'annoncer avant de commencer.

## 6. Garde-fous automatiques

`tests/scenario-modules.mjs` échoue si :

- un module dépasse **800 lignes** ;
- `script.js` dépasse son plafond courant (**ratchet** à 8 600 en v144 : il ne peut que baisser —
  le passer à la baisse à chaque extraction, ce qui empêche de regonfler le fichier) ;
- un module importe `script.js` (cycle) ;
- un module du dossier n'est pas listé dans ce document ;
- un module exporte quelque chose sans le documenter ici (tableau §3).

## 7. Packaging de production (plus tard)

Le développement reste **sans build** (modules ES natifs + `importmap`). Un
`esbuild` optionnel produira un `dist/` minifié + hash pour GitHub Pages, sans
jamais devenir une dépendance pour développer ou tester.


## 8. État au 2026-11-15 (v144) — historique du blocage (RÉSOLU)

> ⚠️ Sections 8.1 à 8.5 = **journal de la passe v144**, quand le découpage était
> bloqué. Elles sont conservées pour la traçabilité (les 5 règles restent
> valables). **L'état réel et final est en §8.6** (passes v145 → v172).

**Fait** : `decor.js`, `environnement.js`, `poissons.js`, `bourriche.js`,
`ondulations.js`, `messages.js`, `splashes.js`, `meteo.js`*(voir note)*.
`script.js` est passé de **9 581 à ~8 550 lignes**.

### 8.1 Pourquoi les modules suivants ne peuvent pas être extraits tels quels

Un module reçoit ses dépendances **par valeur** au moment de sa création. Or les
blocs restants **modifient des `let` de `script.js`** (`tension`, `floatState`,
`castSwing`, `experiencePartie`…). Un module n'en aurait qu'une copie morte, et
l'affectation lèverait même une erreur (« assignment to constant »). L'extracteur
refuse donc ces blocs — c'est volontaire.

Variables d'état à déplacer, par module (mesuré automatiquement) :

| Module restant | Variables mutées (état partagé) |
|---|---|
| `bateau.js` | `rodBend`, `castSwing`, `castYawAngler`, `castYawRod`, `anglerYawBase`, `rodYawBase`, `posteActuel`, `emplacementLibre` |
| `boutique.js` | `flotteurChoix`, `experiencePartie` |
| `fiches.js` | `especeIndex`, `DIFFICULTY`, `tangleChance`, `BITE_WINDOW` |
| `lancerPoisson.js` | `floatState`, `heldFish`, `fishThrowState`, `fishThrowPower`, `fishThrowTarget`, `fishThrowPhase`, `fishThrowT`, `bourricheCount` |
| `lancerCanne.js` | `castSwing`, `castYawAngler`, `castYawRod` |
| `frein.js` | `techniqueCourante` |
| `combat.js` | `portraitEspeceCourante`, `avantageFerrage`, `cameraMode`, `floatState`, `fishCaught`, `waitTimer`, `biteFish`, `biteCooldown`, … (≈ 15) |
| `comportement.js` | `floatState`, `castT`, `waitTimer`, `hameconDansLaVase`, `depuisLancement`, `biteCooldown`, `baitInterest`, … (≈ 11) |
| `amorcage.js` | `amorceDepartRestante` |
| `carnetUI.js` | `especeIndex`, `partieStats`, … |

### 8.2 Le déblocage : `etat.js` (prochaine étape, dans cet ordre)

1. **Créer `etat.js`** : un objet **mutable partagé**, une seule source de vérité.

   ```js
   export const etat = {
       tension: 0, struggle: 0, floatState: 'idle', castT: 0,
       castSwing: 0, castYawAngler: 0, castYawRod: 0, techniqueCourante: 'bouchon',
       experiencePartie: 0, flotteurChoix: null, especeIndex: 0,
       // … une ligne par variable du tableau ci-dessus
   };
   ```

2. **Renommer** ces variables dans `script.js` : `tension` → `etat.tension`
   (remplacement par mot entier, **jamais** dans les chaînes de caractères), et
   supprimer les `let` correspondantes.
3. **Les modules importent `etat.js`** (`import { etat } from './etat.js'`) : c'est
   la seule exception au « pas de globales », et elle est explicite et testable.
4. **Garde-fou à ajouter** dans `scenario-modules.mjs` : `etat.js` est le seul
   module autorisé à être importé par plusieurs ; aucun module ne crée son propre
   état dupliqué.
5. **Un module par livraison**, tests verts à chaque fois.

> Prérequis indispensable : `combat.js` et `comportement.js` (les deux plus gros
> blocs restants, ~670 et ~580 lignes) ne peuvent PAS être extraits avant `etat.js`.

### 8.3 Note sur `meteo.js` / `vie.js`

Extraits puis **annulés** : ces blocs déclarent en leur sein des `let` lues plus
loin dans `script.js` (`weatherRafales`, `modeBrouillard`…). Ils rentreront dans
l'ordre après `etat.js`, comme les autres.

### 8.4 Nouveauté de l'outillage

- `tests/../extract.py` (hors dépôt, réutilisable) : extraction mécanique
  (bloc verbatim → module + injection + destructuring), **refuse** les blocs qui
  mutent une dépendance, et signale les dépendances déclarées après le bloc
  (risque d'accès avant initialisation).
- Le harnais réécrit désormais l'import `three` de **tout** module copié
  (liste découverte, plus figée).

### 8.5 Ce que l'essai sur `combat.js` a appris (à faire dans la prochaine passe)

`etat.js` (v144) fonctionne : le pont d'accesseurs permet à un module de modifier
la vraie variable de `script.js` **sans renommer une seule ligne existante**. Les
trois règles suivantes manquent encore à l'outil d'extraction ; elles ont été
identifiées en essayant `combat.js` (≈ 750 lignes, le plus gros bloc restant) :

1. **Chaînes de caractères** : un remplacement global `struggle` → `etat.struggle`
   a corrompu le littéral `'struggle'` (état du bouchon). Le remplacement doit
   être fait **hors des chaînes** (`'…'`, `"…"`, `` `…` ``). *Corrigé dans
   l'outil.*
2. **Propriétés et clés** : ne jamais remplacer `obj.tension` ni `tension:`
   (sinon `obj.etat.tension` / clé invalide). *Corrigé (lookbehind + lookahead).*
3. **Variables déclarées DANS le bloc et affectées ailleurs** : `recordBattu`,
   `snag`, `catchMessageTimer` (combat) vivaient dans le bloc. Après extraction,
   `script.js` les reçoit par destructuring (`const`) alors que d'autres fonctions
   lui **assignent** une valeur → `TypeError: Assignment to constant variable`.
   Règle à appliquer : ces variables **restent des `let` de `script.js`**, sont
   retirées de la liste exportée, et le module y accède par `etat.NOM`.
4. **Fonctions fournies par un autre module** (`spawnRipple`, `spawnSplash`,
   `spawnFloatingText`, `signalerToucheRatee`) : elles sont déclarées **après** le
   bloc, donc illisibles à la création → elles doivent aussi passer par le pont
   `etat`. Le générateur de pont doit scanner **tous** les `etat.X` réellement
   utilisés par les modules et créer les accesseurs manquants (fait dans
   `bridge.py`, pas encore dans l'extracteur).

5. **État dédoublé (la règle qui manquait encore)** : une variable *déclarée dans
   le bloc* et **lue** ailleurs (`floatState`, `snag`, `biteFish`…) ne doit pas
   être exportée sous forme de valeur — sinon le module modifie sa copie et
   `script.js` garde la sienne. Seules les **fonctions** du bloc sont exportables ;
   toute `let`/`const`/`var` du bloc utilisée à l'extérieur doit rester un `let`
   de `script.js` et passer par `etat`. Test de contrôle : après extraction, un
   lancer doit produire `floatState === 'inWater'` ; si l'on obtient `'idle'`,
   c'est exactement ce symptôme.

Avec ces cinq règles, `combat.js` puis `comportement.js` (~580 l.) passent.
Les modules restants ensuite : `bateau`, `boutique`, `fiches`, `lancerPoisson`,
`lancerCanne`, `frein`, `amorcage`, `carnetUI`, `ligne`, `bouchons`, `meteo`,
`vie`, `carte_etang`.

**Méthode de travail validée** : extraire → lancer la suite complète (1 662
vérifications) → si rouge, `git checkout -- .` et supprimer le module ; jamais
laisser un module à moitié branché.


## 8.6 Rapport de fin de passe (v145 → v172)

**Modules extraits (lignes)** : `combat` 696, `comportement` 607, `bateau` 517,
`partie` 464, `placement` 398, `amorcage` 363, `boutique` 263, `pecheur` 251,
`entrees` 224, `boucle` 211, `lancerPoisson` 205, `sonar` 198, `cycleLigne` 196,
`rendu` 192, `bouchons` 187, `accrochage` 187, `lancerCanne` 181, `vie` 170,
`touches` 164, `carnetUI` 156, `ligne` 139, `frein` 131, `cheat` 122, `fiches` 123,
`journal` 111, `meteo` 109, `stocks` 103, `ambiance` 94. Tous ≤ 800 lignes.
`script.js` : **8 651 → ~3 020 lignes**. Suite : 1 662 → 1 829 vérifications, toujours vertes ;
test réel dans Chromium (lancer → `inWater`, touche, ferrage, combat) sans erreur JS.

**Ce qui reste dans `script.js`** (volontairement ou pas encore) :
- scène, caméra, ciel, lumières, jour/nuit, IBL, qualité auto (≈ 400 l.), eau et reflet
  planaire (≈ 450 l., `eau.js` à faire), vent/girouette (≈ 50 l.) ;
- les déclarations `let X;` des variables partagées (règle 5), le pont `etat`
  (≈ 215 lignes générées par `bridge.py`) et `window.__game` (≈ 680 l., API de test :
  les modules n'ont pas le droit de la porter) ;
- le bloc « EMPLACEMENTS AUTOUR DE L'ÉTANG » (données `POSTES`, `POSTE_*`).

**Pièges rencontrés (à ajouter aux 5 règles)**
6. **Dépendance `let` copiée par valeur.** La cause réelle de l'échec de `combat.js`
   (`floatState` restait `'idle'`) : `snag` est un `let` de `script.js` que le bloc ne
   modifie pas, donc passé par valeur au `creerCombat` et figé à `null`. Règle : toute
   dépendance déclarée `let`/`var`, ou `const` définie après le bloc, passe par `etat`.
7. **Pont `etat` avant les créations.** Les modules écrivent dans `etat` dès leur
   création (`etat.bateauGroupe = …`). Le pont est donc placé juste après les imports
   (fermetures : une variable déclarée plus bas n'est lue qu'à l'appel).
8. **Initialisation d'une variable du bloc.** `let x = init` d'une variable lue ailleurs
   devient `let x;` dans `script.js` et `etat.x = init` dans le module, à la même place :
   l'init peut appeler une fonction du bloc (`makeBobberTexture`), hissée dans le module.
9. **Fonction du bloc appelée par un module créé avant.** `ligne.js` reçoit
   `flotteurCourant`, désormais définie dans `bouchons.js` (plus bas) : accès avant
   initialisation. L'extracteur passe alors un appel paresseux
   (`f: (...args) => f(...args)`) aux modules déjà créés.
10. **Statement qui crée un autre module dans le bloc** (`const { ripples… } =
    creerOndulations(…)`) : il reste dans `script.js` ; le bloc se termine juste avant
    (marqueur de fin sur plusieurs lignes).
11. **Offsets UTF-16.** acorn compte en unités UTF-16, Python en points de code : un
    emoji (🏆) décale tous les retraits suivants. Les découpages se font sur l'UTF-16.
12. **Tests statiques** : `script.includes(...)` ne voit plus le code déplacé. Les
    contrôles lisent `code` (script + modules) ; les assertions négatives aussi, sinon
    elles deviennent vides. Les modules déclarés dans `MODULES` de `scenario-static.mjs`
    sont donc la source à tenir à jour.
13. **Outillage** : analyse par acorn (portées réelles, pas de regex sur le code) :
    `extract2.py`, `route.mjs`, `toplevel.mjs`, `bridge.py`, `freevars.mjs` (détecte les
    identifiants jamais déclarés, cause des `ReferenceError`). Le scan du pont ne doit
    lire que les modules qui importent `etat.js` (`demelage`, `quiver` ont un `etat` local).


## 9. Grand étang (v173) — ce qui change pour les modules

Demande du joueur : « étang moyen + zones profondes » (`idées.md` §14.1 et §14.4).

- **`environnement.js`** : `POND_RADIUS` 55 → **90** (contour de 71 à 104, borne `RAYON_ETANG_MAX` 109,8),
  `POND_CENTER` (0, 0, **-71**) pour que la rive sud (poste de départ) ne bouge pas ;
  trois `FOSSES` (rayon 16 à 22, profondeur max **8,14** ≈ 4 m), `PROFONDEUR_MAX`, `SURFACE_HA` (0,64 ha),
  `RAYON_CADRE_CARTE`. Les maillages de l'eau (40 × 128) et de la rive (rayon 430) y sont aussi.
  Le shader d'eau ne contient plus aucune constante de l'étang : il lit `aDepth`.
- **`bouchons.js` / `especes.js`** : la ligne descend jusqu'à **9,0** (4,5 m) au lieu de 7,0, pour atteindre le fond des fosses.
- **`poissons.js`** : population = `round(surface × 90 poissons/ha)` = 58 ; `FISH_COUNT` (64) n'est plus
  qu'un plafond. La composition est planifiée avant de fabriquer les poissons (≥ 10 espèces, 1 silure max,
  2 de chaque autre solitaire), la biomasse est contrôlée (100–300 kg/ha). Silure, anguille et sandre
  naissent dans les fosses.
- **`script.js`** : brume 150 → 480, ciel 520, caméra `far` 900, ombres qui suivent le pêcheur
  (`suivreOmbres`), disque du soleil relatif à la caméra. Plafond de lignes abaissé (3 030 → 2 995).
- **`placement.js`** : terrain de la carte 170 → 260 unités, caméra reculée ×1,7.
- **`bateau.js`** : les bornes de rame se calculent au rayon de l'angle d'**arrivée** (bug révélé par l'étang plus grand).
- Tests : `tests/scenario-grand-etang.mjs` (rayon, fosses, barque, sonar, cartes, population, densité).


## 10. Obstacles aquatiques (v174 → v178) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.2 (ponton, écluse, douve, roches, arbres immergés, pieux, épave, joncs).

- **`obstacles.js`** (nouveau, 671 lignes, plafond 800) : 12 obstacles de 8 types. Données (`TYPES`,
  `ACCROCHAGES`, `SPECS`), placement, dessin et requêtes de jeu (`accrocheEn`, `lancerBloque`,
  `heurtBarque`, `attirer`, `pontonPoste`). Créé dans `script.js` après les postes de berge et avant la
  barque et les poissons. **Il ne consomme jamais `rand()`** : angles fixes + première place libre
  (postes de berge, bourriche, départ, fosses, nénuphars, arbres, rochers et roseaux du décor évités),
  détails par un LCG local. Aucune texture téléchargée (canvas 64 px + géométrie).
- **`decor.js`** : retourne aussi `arbres`, `rochers`, `roseaux` (simples copies, aucun tirage de plus).
- **`accrochage.js`** : `isSnagged(point)` renvoie `true` (nénuphar) ou l'obstacle ; `startSnag(obstacle)` lit son
  profil (difficulté, message). `etat.snag.rythme` remplace `dansLaVase` pour décider du rythme à tenir.
- **`comportement.js`** : passe l'obstacle à `startSnag`.
- **`poissons.js`** : appelle `obstacles.attirer(fishes)` après le peuplement, dans `repeuplerEtang()` et pour
  un poisson de remplacement (déplace `homeX/homeZ` et la position du poisson ou du banc sur l'obstacle).
- **`bateau.js`** : `deplacerBateau` refuse le coup de rame qui amène la coque (rayon 1,5) sur un ouvrage et le
  réduit à 40 % dans les joncs ; `placerALAngle` pose le pêcheur sur le ponton quand l'angle choisi est sur
  son axe (marge −10,5, y 0,67, girouette rangée).
- **`cycleLigne.js`** : `startCast` refuse un lancer qui retombe sur un ponton, une écluse ou des roches.
- **`placement.js`** : un repère coloré par obstacle sur la carte d'accueil (le ponton est cliquable).
- **`script.js`** : +6 lignes de câblage, ratchet 2995 → 3001 ; `window.__game.obstacles` pour les tests.
- Tests : `tests/scenario-obstacles.mjs` (placement, accrochage, attraction, collision, ponton).


## 11. Le sonar se lance comme une amorce (v179) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.7. Avant, un clic sur 📡 **téléportait** la bouée à une position calculée
et faisait pinger tout de suite.

- **`lancer.js`** (nouveau, 243 lignes) : le **geste de lancer commun** (clic = visée, maintien = jauge de
  puissance, relâchement = arc de vol, arrivée). Il porte `setFeedMode(on, type)`, `startFeedCharge`,
  `moveFeedAim`, `releaseFeed`, `cancelFeed`, `updateFeed` ; l'état du geste reste `etat.feed*`.
  Chaque objet lançable s'enregistre avec `etat.declarerProjectile(nom, définition)` ; le projectile armé est
  `etat.feedType` (`'amorce'` | `'sonar'`, propriété de module, non reliée à `script.js`).
  Définition : `refus()`, `verifier(point)` (impact refusé), `consommer()`, `dansEau(point)`,
  `atterrir(point, dansEau)` (effets + message), `majMode(arme)` (boutons), `couleur`, `ventFacteur`,
  `resterDansEtang`, `verbe`, `messageArme`, `messageVol`.
- **`amorcage.js`** (364 → 205 lignes) : ne garde que la boule d'amorce (enregistrée comme projectile `'amorce'`),
  le nuage de miettes, le bras du pêcheur et la barre d'outils.
- **`sonar.js`** : enregistre le projectile `'sonar'` (jaune, vent ×2,5 comme la ligne, **ne reste pas dans
  l'étang**). `verifier` refuse un impact sur un ouvrage qui bloque le lancer (même règle que
  `cycleLigne.startCast`) ; `atterrir` pose la bouée **au point d'impact réel** (plouf, éclaboussure, ondulation,
  radar, premier scan) ou, hors de l'eau (rayon du contour − 1,5), annonce « tombée sur la berge » sans ping.
  Le clic sur 📡 arme la visée (mêmes règles d'accès que l'amorce, plus `cameraMode === 'normal'`), annule la
  visée si elle est déjà armée, ou range la bouée posée (immédiat). Plus de `sonarDernierPing = -Infinity` au clic.
- **`stocks.js`**, **`entrees.js`** : le bouton Amorce ne se croit plus « prêt » pendant la visée du sonar ;
  il bascule sur l'amorce si on le presse pendant la visée du sonar.
- **`script.js`** : +1 import, `creerLancer` appelé avant `creerAmorcage`, `setFeedMode` et `obstacles` passés à
  `creerSonar`. 3000 → 2998 lignes, ratchet 3001 → 2999.
- Tests : `scenario-sonar.mjs` (71 et 71b : puissance, direction, ping après le plouf, centre du radar, refus en
  combat / accrochage / emmêlement / vol, barque, ouvrages, berge, Ranger), `lancerSonar()` dans `harness.mjs`.


## 12. Le fond se juge sous le bouchon (v180) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.8 (bug : le verdict « hameçon dans la vase » était calculé une fois avec le point
visé, puis jamais recalculé après la dérive au vent ; le schéma de coupe, lui, lisait la position du bouchon et
n'alertait qu'à 0,25 du fond au lieu de 0,5).

- **`environnement.js`** : `verdictFond(x, z, profondeurLigne, auFond)` est la **source unique** (`dansLaVase` = ligne
  plus longue que `profondeur − MARGE_VASE`, marge 0,5 ; jamais au quiver). La profondeur de la ligne reste une
  **longueur bouchon → hameçon** (`HOOK_DEPTH = −profondeurLigne`), jamais une altitude.
- **`comportement.js`** : `jugerFond()` appelle `verdictFond` à la position du bouchon, à l'atterrissage puis à chaque
  image tant que le bouchon flotte (`inWater`) : le verdict suit la dérive. `startSnag('fond')` ne part qu'à la
  **transition** « pas dans la vase → dans la vase », jamais en combat, accrochage, emmêlement, touche ni poisson ferré.
  À l'accrochage, `castTarget` est ramené sous le bouchon (le bouchon est tenu là où il est). Un bouchon qui
  retrouve de l'eau profonde se redresse.
- **`ligne.js`** : héberge `majCoupeProfondeur` (sortie de `script.js`, 2999 → 2970 lignes) ; elle appelle
  `verdictFond` sous le bouchon. Avant l'arrivée (repos, vol), le schéma montre le point visé : un aperçu, aucune
  décision. Accroché dans la vase, l'alerte suit la décision du jeu (pas de clignotement).
- **`script.js`** : éléments du schéma passés à `creerLigne({ coupe })`, `poserHameconAuFond()` sans argument (sous le
  bouchon), `window.__game` : `getVerdictFond`, `castTarget`, `setWind`, `etat`. Ratchet 2999 → 2971.
- Tests : `scenario-fond.mjs` (74) ; `scenario-profondeur.mjs` adapté (indice « Fond à » avec majuscule dans la vase,
  règle de 0,5 partagée par le schéma et le jeu).


## 13. Petit coup de moulinet (v181) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.9. Un tour de manivelle ramenait toujours la ligne et n'attirait personne.

- **`comportement.js`** (633 → 701 lignes) : `dandiner(dt, tours)` est appelé à chaque image bouchon à l'eau avec
  les tours consommés. Moins de 0,3 tour cumulé (un geste = tours séparés de moins de 0,5 s) : remous
  `etat.remous` (+10 par tour, plafonné à 1, −1/3 par seconde) et un rond à la surface. Au-delà : `startReel()`,
  comme avant. `updateFish` : un poisson déjà dans sa zone d'eau et son domaine, mais pas intéressé de lui-même,
  est « senti » s'il est à moins de `3 × remous × sensibilité` unités (sensibilité = agressivité bornée à 0,5–1,2,
  ×1,25 pour les `embuscade`, plafond 1,3). Il approche comme un poisson intéressé, **sans** changer de couche.
  `etat.remous` repasse à 0 hors `inWater`. Les tours donnés avant l'arrivée du bouchon sont jetés à l'atterrissage.
- État ajouté à `etat` (propriétés de module, non reliées à `script.js`) : `remous`, `moulinetGeste`,
  `moulinetRepos`, `remousRond`.
- **`script.js`** : aucune modification de logique (versions de cache 181).
- Tests : `scenario-dandine.mjs` (75).


## 14. Types de fond (v183) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.3. Le fond était uniforme (une couleur unie) ; il est maintenant découpé en cinq substrats.

- **`substrats.js`** (nouveau, ≈ 520 lignes, plafond 800) : une grille de 1 × 1 unité sur le carré de l'étang
  (`DEMI_COTE_FOND`). Règle (priorité) : roche (anneau 0,55 à 1,2 rayon autour d'une fosse) → herbier (proximité d'un
  nénuphar ou d'un roseau, profondeur < 3,6) → vase (profondeur ≥ 4,2 ; anses abritées ≥ 3,2) → gravier
  (hauts-fonds exposés au vent dominant : plus de 85 unités d'eau en amont) → sable (le reste). Un bruit sinusoïdal fixe
  rend les limites organiques, un filtre « majorité 3 × 3 » retire les cellules isolées. **Aucun `rand()`** : la grille ne
  dépend que de la géométrie et des plantes du décor (elles-mêmes tirées avec la graine fixe du jeu).
  Répartition mesurée : sable 25 %, gravier 14 %, vase 31 %, roche 14 %, herbier 16 % (70 zones connexes, ids `vase-1`…).
- **Une seule source** : la texture du fond (canvas 384 px généré en code, aucune image), les rectangles de la carte du
  carnet, le widget de profondeur, le verdict de fond et l'habitat des poissons lisent la même grille.
- **`environnement.js`** : `DEMI_COTE_FOND` et des UV planaires sur `makeFondGeometry` (la texture couvre le carré).
- **`especes.js`** : `COMPORTEMENTS[espèce].substrats` (fonds préférés) et `fosse: true` (silure, anguille, sandre : le
  substrat les installe dans les fosses, jamais au bord).
- **`poissons.js`** : `installerHabitat(poissons)` = `obstacles.attirer` PUIS `substrats.attirer`. Un poisson déjà attiré par
  un obstacle (`obstacleId`) n'est jamais déplacé : un seul « chez-soi » (`homeX/homeZ`), pas de second déplacement. 80 % des
  autres (bancs entiers) s'installent sur un de leurs substrats ; le premier de chaque espèce l'est toujours.
- **`comportement.js`** : `jugerFond` lit `verdict.accroche` (vase, herbier, roche) et appelle `accrochageDe(substrat)` ;
  sur sable ou gravier l'hameçon trop long **repose** (`HOOK_DEPTH` = fond + 0,1, hors quiver) sans s'accrocher.
- **`accrochage.js`** : bruit du fond (`sound.jouerSample`) : « pas-gravier » pour la roche, « plouf » (bulle) pour la vase.
  Aucun son ajouté. Sable, gravier et herbier restent silencieux.
- **`ligne.js`** / **`carnetUI.js`** : widget « Fond : vase » (couleur du substrat, « hameçon posé » sur le sable) et carte du
  carnet avec les fonds sous l'eau + légende (espèces de chaque fond).
- **`script.js`** : +9 lignes de câblage (ratchet 2971 → 2980), `window.__game.substrats`.
- Tests : `scenario-substrats.mjs` (76). Les tests de la vase (57, 52…) visent désormais un point de vase du bassin
  (0, −25) : l'ancien point (30, −10) est de l'herbier.


## 15. Esches (v184) — ce qui change pour les modules

Demande du joueur : `idées.md` §15.2. L'hameçon était nu : tout poisson arrivé dessus mordait.

- **`esches.js`** (nouveau, ≈ 150 lignes, plafond 800) : cinq esches (`ESCHES`) avec `cibles` (espèce → poids, 1 = esche reine,
  absent = 0,06), `couches` (surface / mi-eau / fond) et `substrats` (§14.3). `efficaciteEsche(id, espèce, couche, substrat)` =
  produit des trois, borné à 1 ; hameçon nu = 0,06. `coucheHamecon` : « fond » à moins de 1,2 unité du fond, « surface » sous 1,6
  unité de ligne (le widget de profondeur affiche la même couche). `creerEsches` : `accepterTouche(poisson)` (une décision par
  poisson et par lancer, générateur local) ; un poisson qui refuse s'en désintéresse (`refuseLEsche`) ; tous les 3 refus,
  un message discret (« Ils tournent autour… », jamais d'aide explicite).
- **`stocks.js`** : les esches réutilisent le système des recharges : lots de `TAILLE_LOT` (3), achat en XP (`acheterRecharge`
  cherche dans RECHARGES et ESCHES), stock dans `journal.recharges`, esche équipée dans `journal.esche` (null = hameçon nu).
  `consommerEsche` (une touche ferrée = une esche, appelée par `combat.hookFish`), stock à 0 = hameçon nu. 3 vers offerts au départ.
- **`carnet.js`** : persiste `esche` (id connu ou null) ; un ancien carnet sans `esche` reçoit les vers de départ.
- **`cycleLigne.js`** : `findBitingFish` trie les poissons arrivés sur l'hameçon et demande à `etat.accepterTouche` ;
  `startCast` incrémente `etat.numeroLancer`. **`comportement.js`** : un poisson qui a refusé ne s'approche plus.
- **`boutique.js`** : section « Esches » (Acheter ×3, Équiper, Hameçon nu) ; **`ligne.js`** : couche du widget via `coucheHamecon`.
- **Tests** : `etat.eschesActives = false` dans le harnais (tout poisson mord, comme avant) ; `scenario-esches.mjs` (77) l'active.
- **`script.js`** : +4 lignes (ratchet 2980 → 2984).


## 16. Heures actives et pression (v186) — ce qui change pour les modules

Demande du joueur : `idées.md` §15.1 (la touche était purement aléatoire : `biteSinkAt = 3 + rand() * 5`).

- **`physique.js`** (nouveau, plafond 800) : **un seul chemin de calcul** du délai de touche.
  `facteurTouche(comp) = limiter( facteurHoraire × facteurPression )`, borné à [0,5 ; 6].
  - **Horaire** : `dayPhase` 0 = 6 h (aube), 0,25 = 12 h, 0,5 = 18 h, 0,75 = minuit. Activité `a` ∈ [0,30 ; 1], facteur `0,75 / a`.
    Diurne : 0,75 à midi (× 1,0), 1,0 à l'aube et au crépuscule (× 0,75), 0,30 la nuit (× 2,5). Nocturne (`COMPORTEMENTS[…].nocturne` :
    sandre, silure, anguille, tanche) : 0,75 la nuit (× 1,0), 1,0 aux crépuscules, 0,30 à midi (× 2,5).
  - **Pression** (dérivée de la météo de `meteo.js`) : cible beau 1022 hPa, rafales 1004, pluie 998, constante de temps 14 s de jeu.
    Tendance ∈ [−1 ; 1] = vitesse de variation lissée. Facteur = (hausse : `1 − 0,35 t` ; chute : `1 + 1,2 |t|`) × niveau
    (`1 + (1013 − p)/150`, borné 0,9–1,2). Chute avant l'orage = jusqu'à × 2,2 ; coup de feu après la pluie = × 0,65.
- **`combat.js`** : `etat.biteSinkAt = (3 + rand() * 5) × etat.facteurTouche(comp)` (1er signal) et `(2 + rand() * 6) × …` (pauses
  entre faux signaux). **Aucun tirage en plus** : le facteur est lu, jamais tiré.
- **`meteo.js`** : `etat.meteoGelee` (crochet de test) arrête le minuteur du cycle.
- **`script.js`** : +5 lignes (import, création, `majPhysique` à côté de `updateWeather` dans les deux boucles, spread des crochets
  dans `window.__game`) ; `updateDayNight` ne fait plus avancer l'horloge si `etat.horlogeGelee`. Ratchet 3006 → 3011.
- **`index.html`** : une ligne de HUD `#heureEau` sous la boussole (« 🕒 6 h 30 · aube · 1021 hPa ↗ »), sans popup.
- **Crochets de test** (`window.__game`) : `setHeure(h)` (impose l'heure et gèle l'horloge ; `setHeure(null)` la relance), `getHeure()`,
  `setMeteo(id)` (impose la météo et gèle son cycle), `setPression(p, tendance)` (fige ; `setPression(null)` rend la main à la météo),
  `getPression()`, `getTendancePression()`, `getFacteurTouche(espèce | profil)`, `getTexteConditions()`.
- **Harnais** : `run.mjs` appelle `debutScenario()` avant **chaque** scénario = `setGraine` (verrou conservé) + `setHeure(12)` +
  `setPression(1013, 0)` : facteur ×1 posé explicitement pour les scénarios historiques. `forceBite(nocturne = false)` : le poisson du
  test est diurne (il était `nocturne: true` pour la vue ; à midi les deux voient pareil).
- Tests : `scenario-physique.mjs` (78).


## 17. Saisons, température de l'eau et thermocline (v189) — ce qui change pour les modules

Demande du joueur : `idées.md` §15.1 (température + saisons + thermocline), étape B.

- **Saisons** : 4 saisons × 2 jours de jeu (840 s), année de 56 min ; `anneePhase` 0 = début du printemps, départ à 0,12 (printemps, ≈ 13 °C).
  L'année n'avance que si l'horloge tourne (`etat.horlogeGelee` la fige) : les tests restent déterministes.
- **Température de surface** = `temperatureSaison` (13,5 °C ± 10,5 : ≈ 24 °C mi-été, ≈ 3 °C mi-hiver) + `temperatureJour` (± 1,5 °C, max 16 h) +
  météo (rafales − 0,5, pluie − 1,2), suivie avec une inertie de 35 s (aucun à-coup).
- **Thermocline** (`etat.thermocline` : `actif`, `profondeur`, `intensite`, `plafondPoisson`, `tSurface`, `tFond`) : intensité = (T de saison − 15) / 6
  bornée à [0 ; 1] (la température imposée la remplace), profondeur 2,8 + 1,2 × intensité unités (1,4 à 2,0 m), active dès 0,1 : de la mi-printemps à la
  mi-automne ; **absente en hiver** (eau brassée). Plafond des poissons = −profondeur + 0,3. Température sous la thermocline ≈ 9 °C.
- **Qui lit `etat.thermocline`** (une seule valeur, aucune copie) : `comportement.js` (nage : `ajusterCouche`, `plancherPoisson`, `hameconDansZone` ; vitesse :
  `vitaliteEau`), `ligne.js` (bande dans la coupe de l'eau + couche d'esche), `esches.js` (`profondeurUtile`), `carnetUI.js` (ligne sous la carte, même texte
  `etat.texteEau()` que le widget `#depthEau`), `physique.js` (`etat.facteurTouche`).
- **Effets** : eau froide (< 8 °C) = léthargie : délai × (1 + 1,5 L), carnassiers (`COMPORTEMENTS[…].carnassier`, **les mêmes que `CARNASSIERS` de `poissons.js`** :
  brochet, sandre, perche, black-bass) × (1 + 0,3 L) ; nage × (1 − 0,55 L) (carnassiers 0,15). Eau chaude (> 22 °C) : poissons à la couche la plus basse permise
  (juste au-dessus de la thermocline) ; délai × (1 + 0,8 C) à midi, × (1 − 0,2 C) à l'aube et au crépuscule. **Un seul chemin de calcul** :
  `facteurTouche = limiter(horaire × pression × température)`, borné à [0,5 ; 6].
- **Poissons** : un poisson de fond reste collé au relief SAUF sous la thermocline (il se tient au-dessus) ; un poisson de mi-eau trop profond remonte ;
  `data.profNat` mémorise sa couche naturelle et il la retrouve quand l'eau est brassée. L'hameçon d'un poisson de fond doit être à la thermocline
  (fosse, été) ; plongé dessous, il n'attire rien.
- **Crochets de test** (`window.__game`) : `setSaison(nom | null)`, `getSaison()`, `setTemperatureEau(t | null)`, `getTemperatureEau()`, `getTemperatureCible()`,
  `getThermocline()`, `getTemperatureEnProfondeur(z)`, `getTexteEau()`.
- **Harnais** : `debutScenario()` pose aussi `setTemperatureEau(15)` (ni léthargie, ni chaleur, ni thermocline : facteur ×1, poissons à leur couche).
- **Versions** : `?v=189` partout (index.html, script.js, imports de `especes`, `esches`, `poissons`, `substrats`, `stocks`, `ligne`, `comportement`, `combat`, `meteo`,
  `carnetUI`, `physique`, `sound`) : les importeurs d'un module modifié portent la même version, sinon un navigateur garde l'ancien fichier en cache.
- `script.js` : +2 lignes (ratchet 3011 → 3013). Tests : `scenario-physique-eau.mjs` (79).

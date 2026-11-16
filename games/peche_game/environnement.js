// ---------------------------------------------------------------------------
// environnement.js — L'ÉTANG LUI-MÊME : centre, contour, relief et fond.
//
// Extrait de script.js (découpage v142). Ce module ne dépend de RIEN du jeu :
// il ne connaît ni les poissons, ni le pêcheur, ni le bouchon. C'est la
// géométrie du monde, et tout le reste s'appuie dessus.
//
// Contrat (voir docs/modules.md) : pas d'accès aux globales de script.js, pas
// de dépendance à `window`. Seul `scene` est injecté (pour ajouter le fond 3D).
//
// ⚠ Échelle du monde : 2 unités ≈ 1 m. Le rayon NOMINAL de l'étang n'est plus une constante : c'est
// une DONNÉE DU BIOTOPE (milieux.js : 12 à 280 unités). `POND_RADIUS` (90, la plaine) reste le monde de
// RÉFÉRENCE ; `setRayonMonde(r)` reconstruit toute la géométrie (contour, centre, fosses, surface,
// profondeur max, cadre de la carte) pour un autre rayon. La FORME ne change pas : mêmes harmoniques
// (BRUIT_ETANG), même relief normalisé, même profondeur ; seule l'échelle change. Le contour réel ondule
// autour du rayon nominal (somme d'harmoniques, voir BRUIT_ETANG).
//
// Les valeurs qui dépendent du rayon (`RAYON_ETANG_MAX`, `SURFACE_ETANG`, `SURFACE_HA`,
// `PROFONDEUR_MAX`, `RAYON_CADRE_CARTE`, `DEMI_COTE_FOND`) sont des liaisons VIVANTES (`export let`) et
// l'objet `monde` les expose en accesseurs : un module qui les copie dans un objet « deps » garde une
// valeur périmée, il doit lire `monde.xxx` à chaque usage. `FOSSES` est un tableau rempli EN PLACE et
// `POND_CENTER` un vecteur modifié EN PLACE : leurs lecteurs gardent la bonne référence.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import {
    RAYON_REFERENCE, HARMONIQUES, VARIATION_CONTOUR, rayonContour, surfaceUnites, surfaceHectares,
    echelleDeRayon, porteeLancer, porteeAmorce
} from './dimensions.js?v=239';

// Centre de l'étang DE RÉFÉRENCE (la plaine) : le monde entier est bâti autour de ce point.
// v173 : l'étang passe de 55 à 90 de rayon. Le centre recule de (0, -40) à (0, -71)
// pour que la rive SUD (poste de départ, pêcheur en (-4, 18), bourriche, girouette,
// caméra) reste exactement où le joueur la connaît : l'étang grandit vers le NORD.
const CENTRE_REFERENCE = { x: 0, z: -71 };
// Le même principe sert à TOUTES les tailles : le centre se déplace pour que la rive sud (au point visé
// par le pêcheur de départ, en (-4, 18)) reste en place. L'étang est une homothétie de la plaine autour
// de ce point d'ancrage ; le poste de départ, la girouette et la caméra ne bougent jamais.
const POSTE_DEPART = { x: -4, z: 18 };
const ANGLE_ANCRE = Math.atan2(POSTE_DEPART.z - CENTRE_REFERENCE.z, POSTE_DEPART.x - CENTRE_REFERENCE.x);
const ANCRE = {
    x: CENTRE_REFERENCE.x + Math.cos(ANGLE_ANCRE) * rayonContour(RAYON_REFERENCE, ANGLE_ANCRE),
    z: CENTRE_REFERENCE.z + Math.sin(ANGLE_ANCRE) * rayonContour(RAYON_REFERENCE, ANGLE_ANCRE)
};
export const POND_CENTER = new THREE.Vector3(CENTRE_REFERENCE.x, 0, CENTRE_REFERENCE.z);

// Rayon NOMINAL de RÉFÉRENCE (la plaine ; la forme réelle ondule autour de lui).
// v173 : 55 → 90 (≈ 45 m de rayon, ≈ 0,64 ha au lieu de 0,23 ha) : « étang moyen ».
export const POND_RADIUS = RAYON_REFERENCE;

// Hauteur de la rive. La rive est légèrement PLUS HAUTE que l'eau : celle-ci
// reste « dans son bol ». Sans cela, la surface de l'eau arrive exactement au
// niveau des pieds du pêcheur (et le dépasse même en cas de rafale) : le
// pêcheur donne alors l'impression de flotter, voire d'être dans l'eau.
export const RIVE_Y = 0.35;

// ---------------------------------------------------------------------------
// CONTOUR GÉNÉRÉ DE L'ÉTANG
// Le bord n'est PAS un cercle : c'est une somme de plusieurs harmoniques
// (coefficients fixes, donc déterministe). Les basses fréquences donnent une
// forme allongée et lobée (une vraie « mare »), les hautes ajoutent des criques.
// Amplitude totale : 10,5 % + 6 % + 3,5 % + 2 % = 22 % du rayon nominal.
// Le rayon varie donc de ≈ 78 % à 122 % du rayon nominal : ce n'est plus un cercle.
// Aucun tirage aléatoire n'est consommé : le monde des tests reste reproductible.
// Les harmoniques et la surface sont dans dimensions.js (pur, partagé avec milieux.js).
// ---------------------------------------------------------------------------
export const BRUIT_ETANG = HARMONIQUES;
export const RAYON_ETANG_VARIATION = VARIATION_CONTOUR;

// Rayon NOMINAL du monde actuel : 90 (la plaine) tant qu'un autre biotope n'a pas été choisi.
let rayonMonde = RAYON_REFERENCE;

// Rayon de l'étang dans la direction `angle` (radians, x = cos, z = sin).
export function rayonEtang(angle) {
    let facteur = 1;
    for (let i = 0; i < BRUIT_ETANG.length; i++) {
        const bruit = BRUIT_ETANG[i];
        facteur += bruit.amplitude * Math.sin(bruit.frequence * angle + bruit.phase);
    }
    return rayonMonde * facteur;
}

// Valeurs qui dépendent du rayon : recalculées par setRayonMonde (liaisons vivantes, voir l'en-tête).
//  - RAYON_ETANG_MAX : le plus grand rayon du contour ;
//  - SURFACE_ETANG : surface de l'eau en unités² ; SURFACE_HA : en HECTARES (2 unités = 1 m, donc
//    4 unités² = 1 m²). La surface sert à la population de poissons (poissons.js, milieux.js) et aux tests ;
//  - PROFONDEUR_MAX : le point le plus bas d'une fosse ;
//  - RAYON_CADRE_CARTE : cadre de la carte du carnet (rayon max + couronne de placement + un peu d'air) ;
//  - DEMI_COTE_FOND : demi-côté du carré qui porte la texture du fond (substrats.js).
export let RAYON_ETANG_MAX = 0;
export let SURFACE_ETANG = 0;
export let SURFACE_HA = 0;
export let PROFONDEUR_MAX = 0;
export let RAYON_CADRE_CARTE = 0;
export let DEMI_COTE_FOND = 0;

// ---------------------------------------------------------------------------
// Relief de l'étang : le fond est un BASSIN (peu profond au bord, profond au
// centre) avec trois FOSSES. Profondeurs en UNITÉS (2 unités ≈ 1 m).
//
// v173 : étang moyen (rayon 90). Les fosses sont plus larges (16 à 22 unités de
// rayon) et plus profondes (+3,3 à +3,8 en plus de la cuvette) : la plus grande
// atteint ≈ 8,1 unités (≈ 4 m), le refuge du silure, de l'anguille et du sandre.
// ⚠ La profondeur max reste ≤ 8,2 : la ligne descend à 7,0 au plus et un poisson de
// fond mord dans les 1,2 unité sous l'hameçon (comportement.js, hameconDansZone).
// Les deux grandes fosses sont à ≈ 37 unités du centre, donc à plus de 60 unités de la
// rive : hors de portée d'un lancer (52 maxi), il faut la BARQUE. La troisième, près
// de la rive nord, reste accessible depuis la berge.
// Coordonnées absolues dans l'étang de référence (le centre est en (0, -71)). Pour un autre rayon, les
// décalages depuis le centre ET les rayons des fosses sont multipliés par r / 90 ; leur profondeur
// supplémentaire (`plus`) ne change pas : même relief normalisé, même profondeur.
// ---------------------------------------------------------------------------
export const FOND_BORD = 1.4;         // profondeur au bord (≈ 0,7 m)
export const FOND_CENTRE = 5.0;       // profondeur au centre (≈ 2,5 m)
const FOSSES_REFERENCE = [
    { x: -28, z: -95, rayon: 22, plus: 3.6 },   // la grande fosse (nord-ouest)
    { x: 30, z: -53, rayon: 18, plus: 3.3 },    // fosse sud-est
    { x: 4, z: -123, rayon: 16, plus: 3.8 }     // fosse nord
];
// Remplie EN PLACE par setRayonMonde : même tableau pour tous les lecteurs.
export const FOSSES = [];

// Profondeur d'eau (positive) à un point de l'étang. Le bord suit le CONTOUR
// GÉNÉRÉ : à un même éloignement du centre, on n'a pas la même profondeur
// selon la direction (l'étang est un peu ovale, avec des criques).
export function profondeurLocale(x, z) {
    const dx = x - POND_CENTER.x;
    const dz = z - POND_CENTER.z;
    const d = Math.hypot(dx, dz);
    const rayonLocal = rayonEtang(Math.atan2(dz, dx));
    const t = Math.min(1, d / rayonLocal);
    let prof = FOND_BORD + (FOND_CENTRE - FOND_BORD) * (1 - t * t);   // cuvette
    FOSSES.forEach(function (fosse) {
        const fd = Math.hypot(x - fosse.x, z - fosse.z);
        if (fd < fosse.rayon) {
            prof += fosse.plus * (1 - (fd / fosse.rayon) * (fd / fosse.rayon));
        }
    });
    return prof;
}

// Profondeur MAXIMALE réelle de l'étang (le point le plus bas d'une fosse), mesurée à chaque changement
// de rayon sur une grille de 0,5 unité (× r / 90 : les mêmes points du relief normalisé) dans chaque fosse.
// Le tout est déterministe. Les bouchons doivent descendre au moins jusque-là (voir bouchons.js).
function mesurerProfondeurMax(echelle) {
    const pas = 0.5 * echelle;
    let max = FOND_CENTRE;
    FOSSES.forEach(function (fosse) {
        for (let dx = -fosse.rayon; dx <= fosse.rayon; dx += pas) {
            for (let dz = -fosse.rayon; dz <= fosse.rayon; dz += pas) {
                max = Math.max(max, profondeurLocale(fosse.x + dx, fosse.z + dz));
            }
        }
    });
    return Math.round(max * 100) / 100;
}

/** Rayon nominal du monde actuel (unités). */
export function getRayonMonde() { return rayonMonde; }

/**
 * Reconstruit la GÉOMÉTRIE du monde pour un autre rayon nominal : centre, contour, fosses, surface,
 * profondeur max, cadre de la carte. `r = 90` redonne EXACTEMENT le monde d'origine (mêmes valeurs, au bit
 * près). Le centre se déplace pour que la rive sud reste au point d'ancrage du poste de départ : le poste,
 * la girouette et la caméra ne bougent pas, l'étang est une homothétie de la plaine autour de ce point.
 * N'utilise jamais `rand()`. Les meshes (eau, rive, fond) sont refaits par l'appelant (script.js).
 */
export function setRayonMonde(r) {
    const rayon = Number(r);
    if (!(rayon > 0) || !Number.isFinite(rayon)) { return false; }
    rayonMonde = rayon;
    const f = echelleDeRayon(rayon);
    if (f === 1) {
        POND_CENTER.set(CENTRE_REFERENCE.x, 0, CENTRE_REFERENCE.z);
    } else {
        POND_CENTER.set(ANCRE.x + f * (CENTRE_REFERENCE.x - ANCRE.x), 0, ANCRE.z + f * (CENTRE_REFERENCE.z - ANCRE.z));
    }
    FOSSES.length = 0;
    FOSSES_REFERENCE.forEach(function (fosse) {
        FOSSES.push({
            x: POND_CENTER.x + (fosse.x - CENTRE_REFERENCE.x) * f,
            z: POND_CENTER.z + (fosse.z - CENTRE_REFERENCE.z) * f,
            rayon: fosse.rayon * f,
            plus: fosse.plus
        });
    });
    RAYON_ETANG_MAX = rayon * (1 + RAYON_ETANG_VARIATION);
    SURFACE_ETANG = surfaceUnites(rayon);
    SURFACE_HA = surfaceHectares(rayon);
    PROFONDEUR_MAX = mesurerProfondeurMax(f);
    RAYON_CADRE_CARTE = RAYON_ETANG_MAX + 8;
    DEMI_COTE_FOND = Math.ceil(RAYON_ETANG_MAX + 4.5);
    return true;
}

// Le monde naît dans l'étang de référence (la plaine).
setRayonMonde(RAYON_REFERENCE);

/**
 * Lecteur du monde ACTUEL : des accesseurs, jamais des copies. À passer aux modules (`deps.monde`) qui
 * doivent suivre un changement de biotope. `echelle` = rayon / 90 (1 dans la plaine).
 */
export const monde = {
    get rayon() { return rayonMonde; },
    get echelle() { return echelleDeRayon(rayonMonde); },
    get rayonMax() { return RAYON_ETANG_MAX; },
    get surfaceEtang() { return SURFACE_ETANG; },
    get surfaceHa() { return SURFACE_HA; },
    get profondeurMax() { return PROFONDEUR_MAX; },
    get rayonCadre() { return RAYON_CADRE_CARTE; },
    get demiCoteFond() { return DEMI_COTE_FOND; },
    get porteeLancer() { return porteeLancer(rayonMonde); },
    get porteeAmorce() { return porteeAmorce(rayonMonde); },
    // Centre de l'étang de référence (la plaine) : l'homothétie qui donne les autres tailles est faite autour d'un point d'ancrage.
    centreReference: CENTRE_REFERENCE,
    fosses: FOSSES
};

// Hauteur (y) du fond à un point : négative, sous la surface de l'eau (y = 0).
export function fondY(x, z) {
    return -profondeurLocale(x, z);
}

// VERDICT DU FOND (§14.8) — SOURCE UNIQUE. La profondeur de la ligne (longueur
// bouchon → hameçon, en unités) se choisit avant le lancer ; le fond se juge là où
// est LE BOUCHON (x, z = floatGroup.position), jamais au point visé ni à la berge.
// Le jeu (comportement.js) et le schéma de coupe (ligne.js) appellent cette seule
// fonction : ils ne peuvent plus se contredire. Au quiver, l'hameçon est posé EN
// APPUI sur le fond par construction (`auFond`) : jamais dans la vase.
export const MARGE_VASE = 0.5;   // l'hameçon touche la vase à moins de 0,5 unité du fond
export function verdictFond(x, z, profondeurLigne, auFond) {
    const profondeurEau = profondeurLocale(x, z);
    return {
        profondeurEau,
        dansLaVase: !auFond && profondeurLigne > profondeurEau - MARGE_VASE
    };
}

// DEMI_COTE_FOND (déclaré plus haut) : demi-côté (unités) du carré centré sur l'étang qui porte la TEXTURE
// du fond (substrats.js, §14.3) : le contour le plus large + la marge du maillage du fond (2) + un peu d'air.

// Maillage du fond : un disque « polaire » qui suit le contour, avec une
// profondeur (`aDepth`) stockée par sommet pour foncer l'eau au large, et des UV planaires
// (le carré de côté 2 × DEMI_COTE_FOND centré sur l'étang) pour la texture des substrats.
export function makeFondGeometry(marge, rings, segments) {
    const positions = [POND_CENTER.x, fondY(POND_CENTER.x, POND_CENTER.z), POND_CENTER.z];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const rr = (rayonEtang(a) + marge) * (r / rings);
            const x = Math.cos(a) * rr;
            const z = Math.sin(a) * rr;
            positions.push(x, fondY(POND_CENTER.x + x, POND_CENTER.z + z), z);
        }
    }
    for (let s = 0; s < segments; s++) {
        indices.push(0, 1 + s, 1 + ((s + 1) % segments));
    }
    for (let r = 1; r < rings; r++) {
        const base = 1 + (r - 1) * segments;
        const next = 1 + r * segments;
        for (let s = 0; s < segments; s++) {
            const s1 = (s + 1) % segments;
            indices.push(base + s, next + s, next + s1);
            indices.push(base + s, next + s1, base + s1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // Profondeur d'eau RÉELLE sous chaque sommet : sert à foncer l'eau au large
    // et à la garder claire au bord (plus de bassine bleu pâle uniforme).
    const depths = [];
    for (let i = 0; i < positions.length; i += 3) {
        depths.push(profondeurLocale(POND_CENTER.x + positions[i],
            POND_CENTER.z + positions[i + 2]));
    }
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    const uvs = [];
    for (let i = 0; i < positions.length; i += 3) {
        // positions[i] et positions[i + 2] sont relatifs au centre (le maillage y est posé).
        uvs.push((positions[i] + DEMI_COTE_FOND) / (2 * DEMI_COTE_FOND),
            1 - (positions[i + 2] + DEMI_COTE_FOND) / (2 * DEMI_COTE_FOND));
    }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Ajoute le fond 3D à la scène et renvoie le maillage (les tests le consultent).
export function ajouterFond(scene) {
    const fond = new THREE.Mesh(
        makeFondGeometry(2, 40, 128),
        // Double face : les faces du disque pointent vers le bas -> invisibles
        // depuis la berge ; on voyait donc le ciel à travers l'eau (d'où la
        // nappe blanche).
        new THREE.MeshStandardMaterial({
            color: 0x246b7a, roughness: 1, side: THREE.DoubleSide
        })
    );
    // La hauteur est dans la géométrie : le maillage est simplement centré.
    fond.position.set(POND_CENTER.x, 0, POND_CENTER.z);
    scene.add(fond);
    return fond;
}

// Eau : disque « polaire » (anneaux + rayons) pour permettre au shader de
// déformer finement la surface en vagues. Chaque anneau suit le CONTOUR de
// l'étang : le bord de l'eau n'est plus un cercle parfait.
export function makeWaterGeometry(rings, segments) {
    const positions = [0, 0, 0];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const rr = rayonEtang(a) * (r / rings);
            positions.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        }
    }
    // Éventail du centre vers le premier anneau.
    for (let s = 0; s < segments; s++) {
        indices.push(0, 1 + s, 1 + ((s + 1) % segments));
    }
    // Quadrangles entre anneaux voisins.
    for (let r = 1; r < rings; r++) {
        const base = 1 + (r - 1) * segments;
        const next = 1 + r * segments;
        for (let s = 0; s < segments; s++) {
            const s1 = (s + 1) % segments;
            indices.push(base + s, next + s, next + s1);
            indices.push(base + s, next + s1, base + s1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // Profondeur d'eau RÉELLE sous chaque sommet : sert à foncer l'eau au large
    // et à la garder claire au bord (plus de bassine bleu pâle uniforme).
    const depths = [];
    for (let i = 0; i < positions.length; i += 3) {
        depths.push(profondeurLocale(POND_CENTER.x + positions[i], POND_CENTER.z + positions[i + 2]));
    }
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Rive : un anneau dont le bord INTÉRIEUR suit le contour généré de l'étang.
// (Un RingGeometry donnait un cercle parfait et laissait des fentes.)
export function makeShoreGeometry(outer, segments) {
    const positions = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    const coast = new THREE.Color(0xa08465);
    const transition = new THREE.Color(0xd7c7a7);
    const grass = new THREE.Color(0xffffff);
    for (let segment = 0; segment < segments; segment++) {
        const angle = segment / segments * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const inner = rayonEtang(angle);
        const edgeWidth = 1.7 + 0.8 * Math.sin(7 * angle) + 0.4 * Math.cos(13 * angle);
        const rings = [inner, inner + edgeWidth, inner + edgeWidth * 2, outer];
        for (let ring = 0; ring < rings.length; ring++) {
            const x = cos * rings[ring];
            const z = sin * rings[ring];
            positions.push(x, 0, z);
            uvs.push((x / outer + 1) / 2, (z / outer + 1) / 2);
            const color = ring === 0 ? coast : ring === 1 ? transition : grass;
            colors.push(color.r, color.g, color.b);
        }
        const next = ((segment + 1) % segments) * rings.length;
        for (let ring = 0; ring < rings.length - 1; ring++) {
            const current = segment * rings.length + ring;
            const adjacent = next + ring;
            indices.push(current, adjacent + 1, current + 1,
                current, adjacent, adjacent + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

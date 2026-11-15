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
// ⚠ Échelle du monde : 2 unités ≈ 1 m. POND_RADIUS est le rayon NOMINAL ; le
// contour réel ondule autour de lui (somme d'harmoniques, voir BRUIT_ETANG).
// ---------------------------------------------------------------------------
import * as THREE from 'three';

// Centre de l'étang : le monde entier est bâti autour de ce point.
// v173 : l'étang passe de 55 à 90 de rayon. Le centre recule de (0, -40) à (0, -71)
// pour que la rive SUD (poste de départ, pêcheur en (-4, 18), bourriche, girouette,
// caméra) reste exactement où le joueur la connaît : l'étang grandit vers le NORD.
export const POND_CENTER = new THREE.Vector3(0, 0, -71);

// Rayon NOMINAL (la forme réelle ondule autour de lui).
// v173 : 55 → 90 (≈ 45 m de rayon, ≈ 0,64 ha au lieu de 0,23 ha) : « étang moyen ».
export const POND_RADIUS = 90;

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
// Le rayon varie donc d'environ 70 à 110 unités : ce n'est plus un cercle.
// Aucun tirage aléatoire n'est consommé : le monde des tests reste reproductible.
// ---------------------------------------------------------------------------
export const BRUIT_ETANG = [
    { amplitude: 0.105, frequence: 2, phase: 0.6 },
    { amplitude: 0.060, frequence: 3, phase: 2.4 },
    { amplitude: 0.035, frequence: 5, phase: 4.1 },
    { amplitude: 0.020, frequence: 7, phase: 1.3 }
];

export const RAYON_ETANG_VARIATION = BRUIT_ETANG.reduce(function (total, bruit) {
    return total + bruit.amplitude;
}, 0);

export const RAYON_ETANG_MAX = POND_RADIUS * (1 + RAYON_ETANG_VARIATION);

// Rayon de l'étang dans la direction `angle` (radians, x = cos, z = sin).
export function rayonEtang(angle) {
    let facteur = 1;
    for (let i = 0; i < BRUIT_ETANG.length; i++) {
        const bruit = BRUIT_ETANG[i];
        facteur += bruit.amplitude * Math.sin(bruit.frequence * angle + bruit.phase);
    }
    return POND_RADIUS * facteur;
}

// Surface de l'eau, en unités² (aire d'un contour polaire : ∫ r²/2 dθ, par 2 000
// tranches), puis en HECTARES (2 unités = 1 m, donc 4 unités² = 1 m²). Sert à calculer
// la population de poissons à partir de la surface (poissons.js) et les tests.
export const SURFACE_ETANG = (function () {
    const tranches = 2000;
    let aire = 0;
    for (let i = 0; i < tranches; i++) {
        const r = rayonEtang(((i + 0.5) / tranches) * Math.PI * 2);
        aire += (r * r / 2) * (Math.PI * 2 / tranches);
    }
    return aire;
}());
export const SURFACE_HA = SURFACE_ETANG / 4 / 10000;

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
// Coordonnées absolues (le centre de l'étang est en (0, -71)).
// ---------------------------------------------------------------------------
export const FOND_BORD = 1.4;         // profondeur au bord (≈ 0,7 m)
export const FOND_CENTRE = 5.0;       // profondeur au centre (≈ 2,5 m)
export const FOSSES = [
    { x: -28, z: -95, rayon: 22, plus: 3.6 },   // la grande fosse (nord-ouest)
    { x: 30, z: -53, rayon: 18, plus: 3.3 },    // fosse sud-est
    { x: 4, z: -123, rayon: 16, plus: 3.8 }     // fosse nord
];

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

// Profondeur MAXIMALE réelle de l'étang (le point le plus bas d'une fosse), mesurée
// une fois au chargement sur une grille de 0,5 unité dans chaque fosse. Le tout est
// déterministe. Les bouchons doivent descendre au moins jusque-là (voir bouchons.js).
export const PROFONDEUR_MAX = (function () {
    let max = FOND_CENTRE;
    FOSSES.forEach(function (fosse) {
        for (let dx = -fosse.rayon; dx <= fosse.rayon; dx += 0.5) {
            for (let dz = -fosse.rayon; dz <= fosse.rayon; dz += 0.5) {
                max = Math.max(max, profondeurLocale(fosse.x + dx, fosse.z + dz));
            }
        }
    });
    return Math.round(max * 100) / 100;
}());

// Rayon du cadre de la CARTE du carnet (SVG) : le plus grand rayon du contour, plus
// la couronne de placement (6 unités) et un peu d'air. La carte est dessinée à
// l'échelle de ce rayon : rien (rive, pêcheur, bourriche) ne sort du cadre.
export const RAYON_CADRE_CARTE = RAYON_ETANG_MAX + 8;

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

// Demi-côté (unités) du carré centré sur l'étang qui porte la TEXTURE du fond (substrats.js,
// §14.3) : le contour le plus large + la marge du maillage du fond (2) + un peu d'air.
export const DEMI_COTE_FOND = Math.ceil(RAYON_ETANG_MAX + 4.5);

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

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
export const POND_CENTER = new THREE.Vector3(0, 0, -40);

// Rayon NOMINAL (la forme réelle ondule autour de lui).
export const POND_RADIUS = 55;

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
// Le rayon varie donc d'environ 43 à 67 unités : ce n'est plus un cercle.
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

// ---------------------------------------------------------------------------
// Relief de l'étang : le fond est un BASSIN (peu profond au bord, profond au
// centre) avec deux FOSSES. Profondeurs en UNITÉS (2 unités ≈ 1 m).
// ---------------------------------------------------------------------------
export const FOND_BORD = 1.4;         // profondeur au bord (≈ 0,7 m)
export const FOND_CENTRE = 5.0;       // profondeur au centre (≈ 2,5 m)
export const FOSSES = [
    { x: -16, z: -56, rayon: 11, plus: 1.6 },
    { x: 20, z: -26, rayon: 9, plus: 1.2 }
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

// Hauteur (y) du fond à un point : négative, sous la surface de l'eau (y = 0).
export function fondY(x, z) {
    return -profondeurLocale(x, z);
}

// Maillage du fond : un disque « polaire » qui suit le contour, avec une
// profondeur (`aDepth`) stockée par sommet pour foncer l'eau au large.
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
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Ajoute le fond 3D à la scène et renvoie le maillage (les tests le consultent).
export function ajouterFond(scene) {
    const fond = new THREE.Mesh(
        makeFondGeometry(2, 26, 96),
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

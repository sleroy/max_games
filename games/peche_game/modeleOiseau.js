// ---------------------------------------------------------------------------
// modeleOiseau.js — FABRIQUE 3D PARAMÉTRIQUE d'un oiseau (v244).
//
// Même principe que modelePoisson.js : le corps est un tube par sections
// (superellipse) le long d'un profil, la tête est fondue dans le profil, et
// les ailes sont des MEMBRANES ARTICULÉES :
//   - membrane interne (bras) dans le groupe de l'aile ;
//   - membrane externe (main) + 5 rémiges dans un groupe « poignet » ;
//   - queue en éventail (ou fourchue) dans un groupe qui peut s'ouvrir.
// Repère : bec vers +X, dos vers +Y, aile droite vers +Z (l'aile gauche est
// le MIROIR de la droite : `scale.z = -1`, donc les deux ailes reçoivent la
// même rotation locale).
// Unités : 1 unité = 50 cm (comme les poissons) ; l'envergure est celle de
// l'espèce (corneille ≈ 4,4 unités ≈ 2,2 m).
//
// Le plumage vient de texturesVie.js (`texturePlumage`). Module pur : aucun
// accès à l'état du jeu. L'animation des ailes est ici (`animerOiseau`) pour
// que vie.js ne s'occupe que du vol.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { texturePlumage } from './texturesVie.js?v=245';

export const OISEAUX = {
    corneille: {
        nom: 'Corneille',
        longueur: 1.25,          // bec → base de la queue (fractions de LS en unités)
        envergure: 4.4,
        corde: 0.72,             // corde maximale de l'aile
        queue: 0.55,             // longueur de la queue (fraction de longueur)
        ouvertureQueue: 0.75,    // éventail (radians)
        queueForme: 'eventail',
        bec: 0.13,               // longueur du bec (fraction de longueur)
        becLargeur: 0.050,
        oeil: { t: 0.075, y: 0.035, z: 0.075 },
        styleAile: 'large',
        cadence: 7.2,            // rad/s du battement
        battement: 0.62,         // amplitude (radians)
        couleurs: { dos: 0x232329, ventre: 0x3d3d47, aile: 0x1d1d24, bec: 0x141519, oeil: 0x0a0a0c }
    },
    mouette: {
        nom: 'Mouette',
        longueur: 1.35,
        envergure: 5.0,
        corde: 0.60,
        queue: 0.42,
        ouvertureQueue: 0.34,
        queueForme: 'eventail',
        bec: 0.17,
        becLargeur: 0.035,
        oeil: { t: 0.082, y: 0.032, z: 0.070 },
        styleAile: 'allongee',
        cadence: 6.0,
        battement: 0.70,
        couleurs: { dos: 0xb9c2ca, ventre: 0xf2f4f5, aile: 0x98a3ae, bec: 0xd9a92f, oeil: 0x1a1a1a }
    },
    hirondelle: {
        nom: 'Hirondelle',
        longueur: 0.95,
        envergure: 3.4,
        corde: 0.50,
        queue: 0.62,
        ouvertureQueue: 0.85,
        queueForme: 'fourchue',
        bec: 0.070,
        becLargeur: 0.030,
        oeil: { t: 0.080, y: 0.034, z: 0.072 },
        styleAile: 'fauchee',
        cadence: 11.0,
        battement: 0.85,
        couleurs: { dos: 0x1b2438, ventre: 0xd7dde5, aile: 0x161e30, bec: 0x101114, oeil: 0x08090b }
    }
};

// Profil du corps : hauteur et largeur (fractions de la longueur), du bec (t = 0)
// à la base de la queue (t = 1). Le renflement de la tête puis le creux du cou
// donnent la silhouette d'un passereau ; le ventre est le plus large au milieu.
const CORPS_H = [
    [0, 0.030], [0.030, 0.082], [0.060, 0.112], [0.100, 0.100], [0.140, 0.078],
    [0.220, 0.128], [0.340, 0.142], [0.460, 0.142], [0.600, 0.125],
    [0.740, 0.098], [0.880, 0.060], [1, 0.020]
];
const CORPS_W = [
    [0, 0.026], [0.030, 0.074], [0.060, 0.098], [0.100, 0.088], [0.140, 0.070],
    [0.220, 0.112], [0.340, 0.120], [0.460, 0.115], [0.600, 0.100],
    [0.740, 0.078], [0.880, 0.050], [1, 0.018]
];
const CORPS_Y = [[0, 0], [0.30, 0.004], [0.55, 0.010], [1, 0.014]];

// Corde relative le long de l'envergure (s = 0 épaule → 1 bout).
const PROFILS_AILE = {
    large: [[0, 0.55], [0.20, 0.88], [0.45, 1.00], [0.65, 0.95], [0.82, 0.75], [0.94, 0.45], [1, 0.12]],
    allongee: [[0, 0.50], [0.20, 0.82], [0.50, 0.95], [0.78, 0.72], [0.94, 0.40], [1, 0.10]],
    fauchee: [[0, 0.42], [0.18, 0.78], [0.45, 0.90], [0.70, 0.62], [0.90, 0.30], [1, 0.08]]
};

// --- Outils géométrie -------------------------------------------------------
function lire(table, t) {
    for (let i = 1; i < table.length; i++) {
        if (t <= table[i][0]) {
            const t0 = table[i - 1][0];
            const v0 = table[i - 1][1];
            const t1 = table[i][0];
            const v1 = table[i][1];
            const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
            const lisse = f * f * (3 - 2 * f);
            return v0 + (v1 - v0) * lisse;
        }
    }
    return table[table.length - 1][1];
}

function creerLot() {
    return { pos: [], uv: [], idx: [] };
}

function sommet(lot, x, y, z, u, v) {
    lot.pos.push(x, y, z);
    lot.uv.push(u, v);
    return lot.pos.length / 3 - 1;
}

function geometrieDe(lot) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lot.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(lot.uv, 2));
    g.setIndex(lot.idx);
    g.computeVertexNormals();
    return g;
}

function spow(v, e) {
    return Math.sign(v) * Math.pow(Math.abs(v), e);
}

// Tube fermé par sections : x0 (nez) > x1 (queue), `profil(t)` → { h, w, y }.
// Les UV suivent celles des poissons : u = t, v = 0 au ventre, 1 au dos.
function tube(lot, x0, x1, profil, sections, segments) {
    const nez = sommet(lot, x0, profil(0).y, 0, 0, 0.5);
    const anneaux = [];
    for (let i = 1; i <= sections; i++) {
        const t = i / sections;
        const p = profil(t);
        const x = x0 + (x1 - x0) * t;
        const debut = lot.pos.length / 3;
        for (let j = 0; j < segments; j++) {
            const theta = (j / segments) * Math.PI * 2;
            const c = Math.cos(theta);
            const e = 2 / 2.2;
            sommet(lot, x,
                p.y - p.h * spow(c, e),
                p.w * spow(Math.sin(theta), e),
                t, 1 - Math.abs(theta - Math.PI) / Math.PI);
        }
        anneaux.push(debut);
    }
    for (let j = 0; j < segments; j++) {
        lot.idx.push(nez, anneaux[0] + (j + 1) % segments, anneaux[0] + j);
    }
    for (let i = 0; i < anneaux.length - 1; i++) {
        for (let j = 0; j < segments; j++) {
            const a = anneaux[i] + j;
            const b = anneaux[i] + (j + 1) % segments;
            const c = anneaux[i + 1] + j;
            const d = anneaux[i + 1] + (j + 1) % segments;
            lot.idx.push(a, b, c, b, d, c);
        }
    }
    const fin = sommet(lot, x1, profil(1).y, 0, 1, 0.5);
    const dernier = anneaux[anneaux.length - 1];
    for (let j = 0; j < segments; j++) {
        lot.idx.push(dernier + j, dernier + (j + 1) % segments, fin);
    }
}

// Membrane d'aile : grille (s le long de l'envergure, r le long de la corde).
function membrane(lot, def, s0, s1, zOrigine, demi) {
    const S = 6;
    const R = 3;
    const base = lot.pos.length / 3;
    const profil = PROFILS_AILE[def.styleAile] || PROFILS_AILE.large;
    for (let i = 0; i <= S; i++) {
        const s = s0 + (s1 - s0) * (i / S);
        const corde = def.corde * lire(profil, s);
        const bord = -0.55 * def.corde * Math.pow(s, 1.6);
        for (let j = 0; j <= R; j++) {
            const r = j / R;
            const x = bord - r * corde;
            const y = 0.07 * corde * Math.sin(Math.PI * r) * (0.4 + 0.6 * (1 - s));
            sommet(lot, x, y, s * demi - zOrigine, i / S, r);
        }
    }
    for (let i = 0; i < S; i++) {
        for (let j = 0; j < R; j++) {
            const a = base + i * (R + 1) + j;
            const b = a + R + 1;
            lot.idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
}

// Plume (ou rémige) : ruban effilé le long de (dx, dz), largeur au départ.
function plume(lot, x, y, z, dx, dz, largeur, longueur) {
    const S = 4;
    const px = -dz;
    const pz = dx;
    const base = lot.pos.length / 3;
    for (let i = 0; i <= S; i++) {
        const t = i / S;
        const w = largeur * (1 - 0.78 * t);
        const cx = x + dx * longueur * t;
        const cz = z + dz * longueur * t;
        const cy = y + 0.10 * largeur * Math.sin(Math.PI * t) - 0.05 * longueur * t * t;
        sommet(lot, cx + px * w * 0.5, cy, cz + pz * w * 0.5, t, 0);
        sommet(lot, cx - px * w * 0.5, cy, cz - pz * w * 0.5, t, 1);
    }
    for (let i = 0; i < S; i++) {
        const a = base + i * 2;
        lot.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
}

// Une aile complète : membrane interne + poignet (membrane externe + rémiges).
function construireAile(def, materiau) {
    const zEpaule = 0.09 * def.longueur;
    const demi = def.envergure / 2 - zEpaule;
    const groupe = new THREE.Group();
    const coude = 0.55 * demi;

    const lotInterne = creerLot();
    membrane(lotInterne, def, 0, 0.57, 0, demi);
    groupe.add(new THREE.Mesh(geometrieDe(lotInterne), materiau));

    const poignet = new THREE.Group();
    poignet.position.z = coude;
    groupe.add(poignet);

    const lotExterne = creerLot();
    membrane(lotExterne, def, 0.50, 1, coude, demi);
    const profil = PROFILS_AILE[def.styleAile] || PROFILS_AILE.large;
    for (let i = 0; i < 5; i++) {
        const s = 0.74 + 0.05 * i;
        const corde = def.corde * lire(profil, s);
        const bord = -0.55 * def.corde * Math.pow(s, 1.6);
        const angle = 0.10 + 0.10 * i;
        plume(lotExterne, bord - corde * 0.80, 0, s * demi - coude,
            -Math.cos(angle), Math.sin(angle), 0.16 * def.corde, corde * 0.80);
    }
    poignet.add(new THREE.Mesh(geometrieDe(lotExterne), materiau));

    return { groupe: groupe, poignet: poignet };
}

function construireQueue(def, materiau) {
    const L = def.longueur;
    const groupe = new THREE.Group();
    groupe.position.set(-L / 2, 0.012 * L, 0);
    const lot = creerLot();
    const fourchue = def.queueForme === 'fourchue';
    const n = fourchue ? 4 : 7;
    for (let i = 0; i < n; i++) {
        const f = i / (n - 1) - 0.5;
        const angle = f * def.ouvertureQueue;
        const longueur = def.queue * L
            * (fourchue ? (Math.abs(f) > 0.3 ? 1.30 : 0.64) : 1);
        plume(lot, 0, 0, f * 0.05 * L, -Math.cos(angle), -Math.sin(angle), 0.055 * L, longueur);
    }
    groupe.add(new THREE.Mesh(geometrieDe(lot), materiau));
    return groupe;
}

// --- Fabrique ---------------------------------------------------------------
export function creerModeleOiseau(id, phase) {
    const espece = id || 'corneille';
    const def = OISEAUX[espece] || OISEAUX.corneille;
    const L = def.longueur;
    const groupe = new THREE.Group();
    const couleurs = def.couleurs;

    const materiauCorps = new THREE.MeshStandardMaterial({
        map: texturePlumage(espece, couleurs, 'corps'),
        roughness: 0.62,
        metalness: 0.04
    });
    const materiauAile = new THREE.MeshStandardMaterial({
        map: texturePlumage(espece, couleurs, 'aile'),
        roughness: 0.70,
        metalness: 0.03,
        side: THREE.DoubleSide
    });
    const materiauBec = new THREE.MeshStandardMaterial({ color: couleurs.bec, roughness: 0.42 });
    const materiauOeil = new THREE.MeshStandardMaterial({ color: couleurs.oeil, roughness: 0.18 });

    // --- Corps (tête fondue dans le profil) ---------------------------------
    const longueurBec = def.bec * L;
    const xNez = L / 2 - longueurBec;
    const profil = function (t) {
        return {
            h: lire(CORPS_H, t) * L,
            w: lire(CORPS_W, t) * L,
            y: lire(CORPS_Y, t) * L
        };
    };
    const lotCorps = creerLot();
    tube(lotCorps, xNez, -L / 2, profil, 30, 10);
    const corps = new THREE.Mesh(geometrieDe(lotCorps), materiauCorps);
    corps.castShadow = true;
    groupe.add(corps);

    // --- Bec ---------------------------------------------------------------
    const bec = new THREE.Mesh(
        new THREE.ConeGeometry(def.becLargeur * L, longueurBec, 4),
        materiauBec
    );
    bec.rotation.z = -Math.PI / 2;
    bec.scale.set(0.82, 1, 1);
    bec.position.x = xNez + longueurBec / 2;
    groupe.add(bec);

    // --- Yeux --------------------------------------------------------------
    const oeilT = def.oeil.t;
    const xOeil = xNez - oeilT * (xNez + L / 2);
    const rayonOeil = 0.017 * L;
    for (let c = -1; c <= 1; c += 2) {
        const oeil = new THREE.Mesh(
            new THREE.SphereGeometry(rayonOeil, 6, 4),
            materiauOeil
        );
        oeil.position.set(xOeil, def.oeil.y * L, c * def.oeil.z * L);
        groupe.add(oeil);
    }

    // --- Ailes (gauche = miroir de la droite) ------------------------------
    const ailes = [];
    for (let c = -1; c <= 1; c += 2) {
        const aile = construireAile(def, materiauAile);
        aile.groupe.position.set(0.16 * L, 0.02 * L, c * 0.09 * L);
        aile.groupe.scale.z = c;
        groupe.add(aile.groupe);
        ailes.push({ groupe: aile.groupe, poignet: aile.poignet, cote: c, mesh: aile.groupe });
    }

    // --- Queue -------------------------------------------------------------
    const queue = construireQueue(def, materiauAile);
    groupe.add(queue);

    groupe.userData = {
        espece: espece,
        especeData: def,
        ailes: ailes,
        queue: queue,
        corps: corps,
        bec: bec,
        materiauAile: materiauAile,
        longueur: L,
        envergure: def.envergure,
        queueLongueur: def.queue * L,
        cadence: def.cadence,
        battement: def.battement,
        phase: phase || 0,
        topOffset: 0.08
    };
    return groupe;
}

// Bat des ailes : battement principal + vrillage + poignet en retard + queue.
// `temps` en secondes ; la phase de l'individu est dans userData.phase.
export function animerOiseau(oiseau, temps) {
    const u = oiseau.userData;
    const phase = u.phase || 0;
    // Le vol alterne battements et glissades lentes (jamais complètement figé).
    const glisse = 0.55 + 0.45 * Math.sin(temps * 0.31 + phase * 1.7);
    const onde = Math.sin(temps * u.cadence + phase);
    const battement = onde * u.battement * (0.30 + 0.70 * glisse);
    for (let i = 0; i < u.ailes.length; i++) {
        const a = u.ailes[i];
        // L'aile gauche est le miroir de la droite (scale.z = -1). Avec l'ordre
        // d'Euler par défaut, seule la rotation X du groupe doit changer de
        // signe pour que les deux ailes montent et descendent ensemble ; le
        // vrillage (Z) et les rotations du poignet restent identiques.
        const c = a.cote;
        a.groupe.rotation.x = c * battement;
        a.groupe.rotation.z = 0.30 * onde * glisse;             // vrillage
        a.poignet.rotation.y = -0.15 * Math.sin(temps * u.cadence - 0.80 + phase);
        a.poignet.rotation.z = 0.12 * Math.sin(temps * u.cadence - 1.20 + phase);
    }
    u.queue.rotation.x = 0.10 * Math.sin(temps * 1.3 + phase);
    u.queue.rotation.z = 0.18 + 0.05 * Math.sin(temps * 1.7 + phase + 0.8);
}

export function statistiquesModele(racine) {
    let triangles = 0;
    let meshes = 0;
    racine.traverse(function (o) {
        if (!o.isMesh) { return; }
        meshes++;
        const g = o.geometry;
        if (g.index) {
            triangles += g.index.count / 3;
        } else if (g.getAttribute('position')) {
            triangles += g.getAttribute('position').count / 3;
        }
    });
    return { triangles: Math.round(triangles), meshes: meshes };
}

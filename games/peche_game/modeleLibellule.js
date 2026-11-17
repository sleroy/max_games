// ---------------------------------------------------------------------------
// modeleLibellule.js — FABRIQUE 3D PARAMÉTRIQUE d'une libellule (v244).
//
// Même esprit que modelePoisson.js / modeleOiseau.js : des tubes par sections
// (thorax trapu, abdomen de 10 segments qui se courbe vers le bas), une tête
// avec deux grands yeux composés, QUATRE ailes membraneuses nervurées (texture
// transparente de texturesVie.js) et six pattes repliées en panier.
// Repère : tête vers +X, dos vers +Y, aile droite vers +Z. L'aile gauche est
// le MIROIR de la droite (`scale.z = -1`) : les deux ailes reçoivent la même
// rotation locale. L'abdomen est un groupe articulé à la taille.
// Unités : 1 unité = 50 cm ; longueur totale ≈ 1,1 unité, envergure ≈ 1,4.
// Module pur : aucun accès à l'état du jeu. `animerLibellule` ne fait que
// battre les ailes et onduler l'abdomen ; le vol est dans vie.js.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import {
    textureAileLibellule, textureAbdomenLibellule
} from './texturesVie.js?v=249';

export const LIBELLULES = {
    azur: {
        nom: 'Libellule bleue',
        corps: 0x2b7ba4,
        tete: 0x1d3138,
        yeux: 0x5a2320,
        nervure: 0x22313a,
        membrane: 0xdcefff
    },
    verte: {
        nom: 'Libellule verte',
        corps: 0x4f7a34,
        tete: 0x243326,
        yeux: 0x4a2a18,
        nervure: 0x26301f,
        membrane: 0xe4f3d8
    },
    rouge: {
        nom: 'Libellule rouge',
        corps: 0x9c3c25,
        tete: 0x38221c,
        yeux: 0x3a1a16,
        nervure: 0x33231d,
        membrane: 0xffe6d8
    }
};

// --- Outils (mêmes conventions que modeleOiseau.js) -------------------------
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

// Tube fermé : x0 (avant) > x1 (arrière), profil(t) → { h, w, y } en unités.
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
            const e = 2 / 2.1;
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

// Aile : grille (s le long de l'envergure, r le long de la corde).
// Le bord d'attaque est en x = 0, la corde s'étend vers -X.
const CORDE_AILE = [[0, 0.42], [0.15, 0.70], [0.45, 0.95], [0.70, 1.00], [0.90, 0.75], [1, 0.15]];

// Thorax : hauteur (unités), du cou à la taille.
const PROFIL_THORAX = [[0, 0.085], [0.15, 0.112], [0.40, 0.120], [0.65, 0.105], [0.85, 0.085], [1, 0.070]];

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

function construireAile(longueur, largeur, materiau) {
    const S = 9;
    const R = 2;
    const lot = creerLot();
    for (let i = 0; i <= S; i++) {
        const s = i / S;
        const corde = largeur * lire(CORDE_AILE, s);
        const bord = -0.07 * longueur * s * s;      // légère flèche
        for (let j = 0; j <= R; j++) {
            const r = j / R;
            sommet(lot, bord - r * corde,
                0.02 * corde * Math.sin(Math.PI * Math.min(1, r + 0.06)),
                s * longueur, s, r);
        }
    }
    for (let i = 0; i < S; i++) {
        for (let j = 0; j < R; j++) {
            const a = i * (R + 1) + j;
            const b = a + R + 1;
            lot.idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    return new THREE.Mesh(geometrieDe(lot), materiau);
}

// Six pattes repliées sous le thorax, en une seule géométrie de lignes.
function construirePattes() {
    const pos = [];
    for (let c = -1; c <= 1; c += 2) {
        for (let i = 0; i < 3; i++) {
            const x = 0.22 - i * 0.065;
            const y = -0.055;
            const z = c * 0.055;
            const genou = [x + 0.055, y - 0.055, z + c * 0.02];
            const pied = [x + 0.115, y - 0.125, z + c * 0.005];
            pos.push(x, y, z, genou[0], genou[1], genou[2]);
            pos.push(genou[0], genou[1], genou[2], pied[0], pied[1], pied[2]);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x1b1f22 }));
}

// --- Fabrique ---------------------------------------------------------------
export function creerModeleLibellule(id, phase) {
    const espece = id || 'azur';
    const def = LIBELLULES[espece] || LIBELLULES.azur;
    const groupe = new THREE.Group();

    const materiauThorax = new THREE.MeshStandardMaterial({
        color: def.corps, roughness: 0.38, metalness: 0.35
    });
    const materiauTete = new THREE.MeshStandardMaterial({
        color: def.tete, roughness: 0.40, metalness: 0.30
    });
    const materiauYeux = new THREE.MeshStandardMaterial({
        color: def.yeux, roughness: 0.22, metalness: 0.40
    });
    const materiauAbdomen = new THREE.MeshStandardMaterial({
        map: textureAbdomenLibellule(espece, def),
        roughness: 0.42,
        metalness: 0.28
    });
    const materiauAile = new THREE.MeshStandardMaterial({
        map: textureAileLibellule(espece, def),
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.25,
        metalness: 0.10
    });

    // --- Thorax (trapu, légèrement aplati) ---------------------------------
    const thorax = new THREE.Mesh(geometrieDe((function () {
        const lot = creerLot();
        const profil = function (t) {
            const h = lire(PROFIL_THORAX, t);
            return { h: h, w: h * (1.02 + 0.10 * Math.sin(Math.PI * t)), y: 0.01 };
        };
        tube(lot, 0.30, 0.05, profil, 8, 10);
        return lot;
    })()), materiauThorax);
    thorax.castShadow = true;
    groupe.add(thorax);

    // --- Tête et yeux composés ---------------------------------------------
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), materiauTete);
    tete.position.set(0.345, 0.012, 0);
    tete.scale.set(1.0, 1.05, 1.10);
    groupe.add(tete);
    for (let c = -1; c <= 1; c += 2) {
        const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), materiauYeux);
        oeil.position.set(0.365, 0.030, c * 0.070);
        oeil.scale.set(1.10, 1.00, 0.90);
        groupe.add(oeil);
    }

    // --- Abdomen articulé (10 segments) ------------------------------------
    const abdomen = new THREE.Group();
    abdomen.position.set(0.05, 0.01, 0);
    const lotAbdomen = creerLot();
    const profilAbdomen = function (t) {
        const h = 0.075 * (1 - t) + 0.012 * t;
        return { h: h, w: h * 1.05, y: -0.065 * t * t };
    };
    tube(lotAbdomen, 0, -0.70, profilAbdomen, 20, 10);
    abdomen.add(new THREE.Mesh(geometrieDe(lotAbdomen), materiauAbdomen));
    groupe.add(abdomen);

    // --- Quatre ailes (avant / arrière, gauche = miroir) -------------------
    const ailes = [];
    const paires = [
        { paire: 'avant', x: 0.225, sweep: -0.14, longueur: 0.72 },
        { paire: 'arriere', x: 0.120, sweep: -0.32, longueur: 0.68 }
    ];
    for (let p = 0; p < paires.length; p++) {
        const paire = paires[p];
        for (let c = -1; c <= 1; c += 2) {
            const support = new THREE.Group();
            support.position.set(paire.x, 0.108, c * 0.060);
            support.scale.z = c;
            support.rotation.y = paire.sweep;
            support.add(construireAile(paire.longueur, 0.16, materiauAile));
            groupe.add(support);
            ailes.push({ groupe: support, cote: c, paire: paire.paire, sweep: paire.sweep, mesh: support });
        }
    }

    // --- Pattes ------------------------------------------------------------
    const pattes = construirePattes();
    groupe.add(pattes);

    groupe.userData = {
        espece: espece,
        especeData: def,
        ailes: ailes,
        abdomen: abdomen,
        tete: tete,
        pattes: pattes,
        materiauAile: materiauAile,
        longueur: 1.10,
        envergure: 1.56,
        segments: 10,
        phase: phase || 0,
        topOffset: 0.22
    };
    return groupe;
}

// Battement des quatre ailes (avant / arrière déphasés) + ondulation de
// l'abdomen. Les ailes gauches étant le miroir des droites, la même rotation
// locale suffit : le vol reste symétrique.
export function animerLibellule(libellule, temps) {
    const u = libellule.userData;
    const phase = u.phase || 0;
    const onde = temps * 46 + phase;
    for (let i = 0; i < u.ailes.length; i++) {
        const a = u.ailes[i];
        const retard = a.paire === 'avant' ? 0 : Math.PI * 0.5;
        // Aile gauche = miroir (scale.z = -1) : avec l'ordre d'Euler par défaut,
        // les rotations X et Y changent de signe, le vrillage (Z) non.
        const c = a.cote;
        a.groupe.rotation.x = c * 0.34 * Math.sin(onde + retard);
        a.groupe.rotation.z = 0.10 * Math.sin(onde * 0.5 + retard);
        a.groupe.rotation.y = c * (a.sweep + 0.06 * Math.sin(onde * 0.5 + retard));
    }
    u.abdomen.rotation.z = 0.045 * Math.sin(temps * 2.1 + phase);
    u.abdomen.rotation.y = 0.035 * Math.sin(temps * 1.4 + phase + 0.7);
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

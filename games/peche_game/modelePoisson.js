// ---------------------------------------------------------------------------
// modelePoisson.js — FABRIQUE 3D PARAMÉTRIQUE d'un poisson, partagée par le jeu
// (`poissons.js`) et la page de vérification des tailles (`tailles.html`).
//
// Le corps n'est plus une sphère aplatie : il est construit PAR SECTIONS le
// long d'un profil (`profil: [{ t, h, w, y, n }]`, voir `especes.js`) :
//   t = 0 museau → 1 pédoncule ; h / w = demi-hauteur / demi-largeur ;
//   y = décalage du squelette (bosse du dos) ; n = exposant de la superellipse
//   de la section (2 = ellipse, > 2 = plus carrée, comme la tête du silure).
// Toutes les mesures sont des FRACTIONS de la longueur standard LS (museau →
// base de la queue), relevées sur les photos de `assets/references/`.
//
// Repère du modèle (avant `group.scale = size`) : museau en +x, dos en +y,
// flanc droit en +z. La longueur totale (museau → bout de la caudale) vaut
// EXACTEMENT `FORMES[form].longueurRef`, quelle que soit l'agressivité : c'est
// ce qui garde `echellePourTaille` juste (1 unité = 50 cm).
//
// Maillages (≈ 4 000 à 6 000 triangles, 8 meshes au plus) :
//   corps + dorsale(s) + anale + adipeuse : UN mesh, deux matériaux (animé) ;
//   caudale : dans `tailPivot` ; détails (masqués au loin) : pectorales,
//   pelviennes, yeux (sclère + iris + pupille), bouche, barbillons.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { FORMES, FORMES_PAR_TYPE, PROFILS, ANATOMIES } from './especes.js?v=205';
import { textureCorps, textureNageoire, couleursEspece, melanger } from './texturesPoisson.js?v=205';

export const SECTIONS = 60;          // anneaux le long du corps
export const SEGMENTS = 30;          // sommets par anneau (tour du corps)

function formeDe(form) {
    return FORMES[form] || FORMES[FORMES_PAR_TYPE[form]] || FORMES.fusiforme;
}

// Échelle 3D d'un poisson mesurant `longueurCm` centimètres.
// 2 unités de jeu ≈ 1 m : 50 cm = 1 unité. Le plancher 0,08 évite qu'un
// juvénile minuscule disparaisse sous la résolution de l'étang.
export function echellePourTaille(longueurCm, form) {
    return Math.max(0.08, (longueurCm / 50) / formeDe(form).longueurRef);
}

// ---------------------------------------------------------------------------
// Profil : interpolation cubique MONOTONE (Fritsch-Carlson) de chaque canal.
// Comme Catmull-Rom, mais sans dépassement : une hauteur ne devient jamais
// négative et la bosse du dos ne « rebondit » pas entre deux points.
// ---------------------------------------------------------------------------
function canal(ts, vs) {
    const n = ts.length;
    const d = [];
    const m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) {
        d.push((vs[i + 1] - vs[i]) / Math.max(1e-6, ts[i + 1] - ts[i]));
    }
    m[0] = d[0] || 0;
    m[n - 1] = d[n - 2] || 0;
    for (let i = 1; i < n - 1; i++) {
        m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
        const a = m[i] / d[i];
        const b = m[i + 1] / d[i];
        const s = a * a + b * b;
        if (s > 9) {
            const k = 3 / Math.sqrt(s);
            m[i] = k * a * d[i];
            m[i + 1] = k * b * d[i];
        }
    }
    return function (t) {
        if (t <= ts[0]) { return vs[0]; }
        if (t >= ts[n - 1]) { return vs[n - 1]; }
        let i = 0;
        while (i < n - 2 && t > ts[i + 1]) { i++; }
        const h = ts[i + 1] - ts[i];
        const s = (t - ts[i]) / h;
        const s2 = s * s;
        const s3 = s2 * s;
        return (2 * s3 - 3 * s2 + 1) * vs[i] + (s3 - 2 * s2 + s) * h * m[i]
            + (-2 * s3 + 3 * s2) * vs[i + 1] + (s3 - s2) * h * m[i + 1];
    };
}

const _profils = new WeakMap();

// Profil lissé : { h(t), w(t), y(t), n(t), nb(t) } en fractions de LS.
export function preparerProfil(points, rondeur) {
    if (_profils.has(points)) {
        return _profils.get(points);
    }
    const ts = points.map(p => p.t);
    const lis = cle => canal(ts, points.map(p => p[cle] !== undefined ? p[cle] : (cle === 'y' ? 0 : 2)));
    const fh = lis('h');
    const fw = lis('w');
    const n = lis('n');
    const nb = canal(ts, points.map(p => p.nb !== undefined ? p.nb : (p.n !== undefined ? p.n : 2)));
    const r = rondeur || 0.03;
    // Museau arrondi : sur les premiers `rondeur` de LS, la section se referme en dôme.
    const dome = t => (t >= r ? 1 : Math.sqrt(Math.max(0, 1 - (1 - t / r) ** 2)));
    const profil = {
        h: t => Math.max(0.0015, fh(t)) * dome(t),
        w: t => Math.max(0.0015, fw(t)) * dome(t),
        y: lis('y'),
        n: n,
        nb: nb
    };
    _profils.set(points, profil);
    return profil;
}

// Puissance signée : la superellipse |y/h|^n + |z/w|^n = 1.
function spow(v, e) {
    return Math.sign(v) * Math.pow(Math.abs(v), e);
}

// Demi-épaisseur de la surface à (t, y) (fractions de LS) : sert à poser les
// yeux, la bouche, les pectorales et les barbillons SUR le corps.
function zSurface(profil, t, y) {
    const h = profil.h(t);
    const rel = Math.min(0.999, Math.abs((y - profil.y(t)) / h));
    const n = y < profil.y(t) ? profil.nb(t) : profil.n(t);
    return profil.w(t) * Math.pow(1 - Math.pow(rel, n), 1 / n);
}

// ---------------------------------------------------------------------------
// Accumulateur de géométrie (positions, UV, couleurs, index, groupes).
// ---------------------------------------------------------------------------
function creerLot() {
    return { pos: [], uv: [], col: [], idx: [], groupes: [] };
}

function sommet(lot, x, y, z, u, v, c) {
    lot.pos.push(x, y, z);
    lot.uv.push(u, v);
    lot.col.push(c, c, c);
    return lot.pos.length / 3 - 1;
}

// Grille (S+1) × (R+1) : point(s, r) → [x, y, z, teinte] ; u = s × reps, v = r.
function grille(lot, S, R, point, reps) {
    const base = lot.pos.length / 3;
    for (let i = 0; i <= S; i++) {
        for (let j = 0; j <= R; j++) {
            const p = point(i / S, j / R, i, j);
            sommet(lot, p[0], p[1], p[2], (i / S) * reps, j / R, p[3] !== undefined ? p[3] : 1);
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

function fermerGroupe(lot, materiau) {
    const debut = lot.groupes.length ? lot.groupes[lot.groupes.length - 1].fin : 0;
    lot.groupes.push({ debut: debut, fin: lot.idx.length, materiau: materiau });
}

function geometrieDe(lot, couleurs) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lot.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(lot.uv, 2));
    if (couleurs) {
        g.setAttribute('color', new THREE.Float32BufferAttribute(lot.col, 3));
    }
    g.setIndex(lot.idx);
    lot.groupes.forEach(gr => g.addGroup(gr.debut, gr.fin - gr.debut, gr.materiau));
    g.computeVertexNormals();
    return g;
}

// ---------------------------------------------------------------------------
// Formes de nageoires : hauteur relative le long de la base (s = 0 avant → 1
// arrière) et « recul » (la pointe part vers la queue). `epines` : un rayon
// sur deux dépasse de la membrane (perche, sandre, black-bass).
// ---------------------------------------------------------------------------
const NAGEOIRES = {
    souple: { h: [[0, 0.72], [0.15, 1], [0.45, 0.72], [0.8, 0.45], [1, 0.2]], recul: 0.45 },
    haute: { h: [[0, 0.88], [0.1, 1], [0.32, 0.62], [0.7, 0.3], [1, 0.12]], recul: 0.75 },
    longue: { h: [[0, 0.6], [0.08, 1], [0.22, 0.55], [0.6, 0.42], [1, 0.3]], recul: 0.3 },
    epineuse: { h: [[0, 0.45], [0.14, 1], [0.32, 0.95], [0.6, 0.7], [0.85, 0.42], [1, 0.25]], recul: 0.22, epines: true },
    reculee: { h: [[0, 0.32], [0.25, 0.85], [0.55, 1], [0.85, 0.82], [1, 0.45]], recul: 0.35 },
    petite: { h: [[0, 0.6], [0.3, 1], [1, 0.3]], recul: 0.5 },
    continue: { h: [[0, 0.15], [0.2, 0.75], [0.9, 1], [1, 1]], recul: 0.15 },
    analeLongue: { h: [[0, 0.05], [0.12, 0.6], [0.3, 0.9], [0.85, 1], [1, 0.85]], recul: 0.22 },
    analeBreme: { h: [[0, 0.72], [0.12, 1], [0.35, 0.55], [0.7, 0.28], [1, 0.12]], recul: 0.6 },
    adipeuse: { h: [[0, 0.3], [0.4, 1], [1, 0.5]], recul: 0.7 },
    // Dorsale de brème : sommet arrondi près de l'avant, bord arrière concave.
    dorsaleBreme: { h: [[0, 0.66], [0.07, 0.94], [0.17, 1], [0.34, 0.86], [0.62, 0.58], [1, 0.3]], recul: 0.4 },
    // Dorsale de carpe : longue, premier rayon épineux (pointe étroite à l'avant),
    // bord supérieur concave qui s'abaisse doucement vers l'arrière.
    dorsaleCarpe: { h: [[0, 0.58], [0.035, 1], [0.1, 0.84], [0.25, 0.7], [0.55, 0.56], [0.85, 0.46], [1, 0.34]], recul: 0.8 }
};

// Pectorales / pelviennes : longueur relative de chaque rayon (s = 0 rayon
// du haut / de l'avant → 1).
const PAIRES = {
    pointue: [[0, 0.82], [0.22, 1], [0.6, 0.72], [1, 0.38]],
    ronde: [[0, 0.7], [0.4, 1], [1, 0.62]],
    // Éventail arrondi, rayons du milieu les plus longs (pectorale de brème).
    ovale: [[0, 0.5], [0.2, 0.84], [0.45, 1], [0.75, 0.88], [1, 0.52]]
};

// Caudales : contour du bord libre, du lobe du haut au lobe du bas, en
// fractions de (longueur, écart) ; x < 0 = vers l'arrière.
const CAUDALES = {
    fourche: [[-0.95, 1], [-0.62, 0.45], [-0.42, 0], [-0.62, -0.45], [-1, -1]],
    // Échancrure modérée, lobes arrondis, lobe du bas un peu plus long.
    breme: [[-0.8, 1], [-0.9, 0.92], [-0.94, 0.78], [-0.88, 0.58], [-0.72, 0.38], [-0.54, 0.17],
        [-0.46, 0], [-0.54, -0.17], [-0.74, -0.4], [-0.92, -0.62], [-1, -0.8], [-0.98, -0.92], [-0.86, -1]],
    // Carpe : lobes arrondis, échancrure moyenne (≈ 50 % de la longueur).
    carpe: [[-0.84, 1], [-0.95, 0.92], [-0.98, 0.76], [-0.9, 0.56], [-0.72, 0.34], [-0.55, 0.14],
        [-0.5, 0], [-0.56, -0.15], [-0.74, -0.36], [-0.92, -0.58], [-1, -0.78], [-0.97, -0.92], [-0.84, -1]],
    echancree: [[-0.94, 1], [-0.98, 0.55], [-0.86, 0], [-0.97, -0.55], [-1, -1]],
    arrondie: [[-0.55, 1], [-0.85, 0.7], [-1, 0], [-0.85, -0.7], [-0.55, -1]],
    silure: [[-0.6, 0.85], [-0.9, 0.45], [-1, -0.05], [-0.9, -0.6], [-0.6, -1]],
    fine: [[-0.45, 0.7], [-1, 0], [-0.45, -0.7]]
};

function lirePolyligne(table, s) {
    if (s <= table[0][0]) { return table[0][1]; }
    for (let i = 1; i < table.length; i++) {
        if (s <= table[i][0]) {
            const f = (s - table[i - 1][0]) / (table[i][0] - table[i - 1][0]);
            return table[i - 1][1] + (table[i][1] - table[i - 1][1]) * f;
        }
    }
    return table[table.length - 1][1];
}

// Point du contour de caudale à l'abscisse curviligne s ∈ [0, 1].
function bordCaudale(contour, s) {
    const longueurs = [0];
    for (let i = 1; i < contour.length; i++) {
        longueurs.push(longueurs[i - 1] + Math.hypot(contour[i][0] - contour[i - 1][0],
            contour[i][1] - contour[i - 1][1]));
    }
    const cible = s * longueurs[longueurs.length - 1];
    for (let i = 1; i < contour.length; i++) {
        if (cible <= longueurs[i] + 1e-9) {
            const f = (cible - longueurs[i - 1]) / Math.max(1e-9, longueurs[i] - longueurs[i - 1]);
            return [contour[i - 1][0] + (contour[i][0] - contour[i - 1][0]) * f,
                contour[i - 1][1] + (contour[i][1] - contour[i - 1][1]) * f];
        }
    }
    return contour[contour.length - 1];
}

// ---------------------------------------------------------------------------
// Corps : anneaux en superellipse, capuchons au museau et au pédoncule.
// u = t (le long du corps), v = 0 ventre → 1 dos (miroir sur les deux flancs).
// ---------------------------------------------------------------------------
function construireCorps(lot, profil, LS, xNez) {
    const M = SEGMENTS;
    const pointe = sommet(lot, xNez, profil.y(0) * LS, 0, 0, 0.5, 1);
    const anneaux = [];
    for (let i = 1; i <= SECTIONS; i++) {
        const s = i / SECTIONS;
        const t = 0.6 * s + 0.4 * (1 - Math.cos(Math.PI * s)) / 2;
        const h = profil.h(t) * LS;
        const w = profil.w(t) * LS;
        const yc = profil.y(t) * LS;
        const x = xNez - t * LS;
        const debut = lot.pos.length / 3;
        for (let j = 0; j < M; j++) {
            const theta = (j / M) * Math.PI * 2;
            const c = Math.cos(theta);
            const e = 2 / (c > 0 ? profil.nb(t) : profil.n(t));
            sommet(lot, x, yc - h * spow(c, e), w * spow(Math.sin(theta), e),
                t, 1 - Math.abs(theta - Math.PI) / Math.PI, 1);
        }
        anneaux.push(debut);
    }
    // Bout du pédoncule (caché par la caudale) : teinte du dos, pas de reflet clair.
    const fin = sommet(lot, xNez - LS * 1.004, profil.y(1) * LS, 0, 1, 0.9, 1);
    for (let j = 0; j < M; j++) {
        const k = (j + 1) % M;
        lot.idx.push(pointe, anneaux[0] + k, anneaux[0] + j);
    }
    for (let i = 0; i < anneaux.length - 1; i++) {
        for (let j = 0; j < M; j++) {
            const k = (j + 1) % M;
            const a = anneaux[i] + j;
            const b = anneaux[i] + k;
            const c = anneaux[i + 1] + j;
            const d = anneaux[i + 1] + k;
            lot.idx.push(a, b, c, b, d, c);
        }
    }
    const dernier = anneaux[anneaux.length - 1];
    for (let j = 0; j < M; j++) {
        lot.idx.push(dernier + j, dernier + (j + 1) % M, fin);
    }
}

// Nageoire impaire (dorsale, anale, adipeuse) : base sur le dos (sens = +1)
// ou le ventre (sens = -1), dans le plan z = 0. Elle fait partie du maillage
// du corps : l'ondulation de nage la plie avec lui.
function nageoireImpaire(lot, profil, LS, xNez, def, sens, echelleHauteur) {
    const type = NAGEOIRES[def.type] || NAGEOIRES.souple;
    const S = Math.max(6, Math.round((def.t1 - def.t0) * 70)) | 1;   // impair : épines alternées
    const R = 4;
    const H = def.hauteur * echelleHauteur * LS;
    const recul = def.recul !== undefined ? def.recul : type.recul;
    grille(lot, S, R, function (s, r, i) {
        const t = def.t0 + (def.t1 - def.t0) * s;
        const bord = profil.y(t) + sens * profil.h(t) * 0.94;
        let haut = H * lirePolyligne(type.h, s);
        if (type.epines && i % 2 === 1) { haut *= 0.78; }
        const bombe = Math.sin(Math.PI * r) * 0.04 * haut;      // membrane légèrement courbe
        return [xNez - t * LS - recul * haut * r - bombe,
            bord * LS + sens * haut * r, 0, 1 - 0.25 * r];
    }, (S / 16) * 1.0);
}

// Pectorales (sur le flanc) ou pelviennes (sous le ventre) des deux côtés.
function nageoiresPaires(lot, profil, LS, xNez, def, pelvienne, echelleHauteur) {
    const forme = PAIRES[def.forme] || PAIRES.pointue;
    const L = def.longueur * echelleHauteur * LS;
    const pente = def.pente !== undefined ? def.pente : 0.4;
    const ecart = def.ecart !== undefined ? def.ecart : (pelvienne ? 0.45 : 0.55);
    const S = 8;
    const R = 4;
    for (const cote of [1, -1]) {
        grille(lot, S, R, function (s, r) {
            let t;
            let y;
            if (pelvienne) {
                t = def.t + 0.035 * s;
                y = profil.y(t) - profil.h(t) * 0.9;
            } else {
                t = def.t + 0.012 * s;
                y = def.y + 0.22 * def.longueur * (0.5 - s);
            }
            const z = cote * zSurface(profil, t, y) * (pelvienne ? 0.6 : 0.97);
            // Éventail des rayons : sans lui, base et rayons sont parallèles et
            // la nageoire n'est qu'un trait vue de profil.
            const angle = pente + (s - 0.5) * (pelvienne ? 0.8 : (def.eventail !== undefined ? def.eventail : 0.55));
            const l = L * lirePolyligne(forme, s) * r;
            // Une pelvienne pend sous le ventre (vue de profil) au lieu de
            // s'étaler à plat : elle descend autant qu'elle s'écarte.
            const bas = pelvienne ? Math.cos(ecart) * 0.5 : 0;
            return [xNez - t * LS - Math.cos(angle) * l,
                y * LS - (Math.sin(angle) + bas) * l,
                z * LS + cote * (Math.sin(ecart) * l * (pelvienne ? 0.7 : 1)
                    + 0.05 * L * Math.sin(Math.PI * s) * r * r),
                1 - 0.2 * r];
        }, 0.5);
    }
}

// Caudale, dans le repère du pivot (origine au centre du pédoncule).
function caudale(lot, def, hPed, LS, echelleHauteur) {
    const contour = CAUDALES[def.type] || CAUDALES.fourche;
    const longueur = def.longueur * LS;
    const ecart = Math.max(def.ecart * echelleHauteur, hPed * 1.2) * LS;
    const S = 16;
    const R = 6;
    grille(lot, S, R, function (s, r) {
        const bord = bordCaudale(contour, s);
        const baseY = (1 - 2 * s) * hPed * LS * 1.02;
        const ex = bord[0] * longueur;
        const ey = bord[1] * ecart;
        // Le rayon se courbe un peu (le lobe s'évase après le pédoncule).
        const x = 0.004 * LS + (ex - 0.004 * LS) * r;
        const y = baseY + (ey - baseY) * (r + 0.25 * r * (1 - r) * Math.abs(1 - 2 * s));
        return [x, y, 0.012 * longueur * Math.sin(Math.PI * s) * r, 1 - 0.2 * r];
    }, 1.2);
}

// Œil : sphère aplatie, couleurs en anneaux autour de l'axe +z
// (pupille noire, iris de l'espèce, cercle sombre, sclère claire).
function geometrieOeil(rayon, couleurIris) {
    const g = new THREE.SphereGeometry(rayon, 18, 12);
    g.rotateX(Math.PI / 2);
    g.scale(1, 1, 0.5);
    const pos = g.getAttribute('position');
    // Un œil de poisson montre surtout l'iris (doré, argenté, rouge…) autour
    // d'une grosse pupille ; le bord (« sclère ») reste sombre, dans la peau.
    const iris = new THREE.Color(couleurIris);
    const anneau = iris.clone().multiplyScalar(0.55);
    const sclere = iris.clone().multiplyScalar(0.22);
    const pupille = new THREE.Color(0x050505);
    const col = [];
    for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i) * 2).normalize();
        const a = Math.acos(Math.max(-1, Math.min(1, v.z)));
        const c = a < 0.42 ? pupille : a < 0.9 ? iris.clone().lerp(anneau, (a - 0.42) / 0.48)
            : a < 1.05 ? anneau : sclere;
        col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
}

// Bouche : fente sombre qui suit la surface, du bout du museau au coin.
function bouche(lot, profil, LS, xNez, def) {
    const e = (def.epaisseur || 0.006) * LS;
    for (const cote of [1, -1]) {
        grille(lot, 10, 1, function (s, r) {
            const t = 0.004 + (def.t - 0.004) * s;
            const y = def.y0 + (def.y1 - def.y0) * s;
            return [xNez - t * LS, y * LS + (r - 0.5) * e * (1 - 0.4 * s),
                cote * (zSurface(profil, t, y) * LS + 0.002 * LS), 1];
        }, 1);
    }
}

// Barbillons : tubes effilés qui partent du museau, s'écartent puis traînent.
function barbillons(lot, profil, LS, xNez, liste) {
    const K = 10;
    const C = 4;
    liste.forEach(function (b) {
        for (const cote of [1, -1]) {
            const z0 = cote * zSurface(profil, b.t, b.y) * LS;
            const centre = [];
            for (let k = 0; k <= K; k++) {
                const s = k / K;
                const L = b.longueur * LS;
                centre.push([xNez - b.t * LS - L * 0.78 * Math.pow(s, 1.3),
                    b.y * LS - L * (b.chute || 0.6) * 0.55 * Math.pow(s, 1.5)
                        + L * 0.07 * Math.sin(Math.PI * s),     // léger arc, pas un bâton

                    z0 + cote * L * (b.ecart || 0.3) * (s - 0.35 * s * s)]);
            }
            const base = lot.pos.length / 3;
            for (let k = 0; k <= K; k++) {
                const p = centre[k];
                const r = (b.rayon || 0.003) * LS * (1 - 0.7 * k / K);
                for (let j = 0; j < C; j++) {
                    const a = (j / C) * Math.PI * 2;
                    sommet(lot, p[0], p[1] + Math.cos(a) * r, p[2] + Math.sin(a) * r, k / K, j / C, 1);
                }
            }
            for (let k = 0; k < K; k++) {
                for (let j = 0; j < C; j++) {
                    const a = base + k * C + j;
                    const b2 = base + k * C + (j + 1) % C;
                    lot.idx.push(a, a + C, b2, b2, a + C, b2 + C);
                }
            }
        }
    });
}

// Profil + anatomie effectifs : l'espèce prime sur sa silhouette.
// (un nom renvoie à PROFILS / ANATOMIES ; une table peut aussi être donnée telle quelle).
function table(source, valeur) {
    return typeof valeur === 'string' ? source[valeur] : valeur;
}

export function anatomieDe(forme, espece) {
    const deLEspece = espece ? (table(ANATOMIES, espece.anatomie) || ANATOMIES[espece.id]) : null;
    const anatomie = Object.assign({}, table(ANATOMIES, forme.anatomie) || ANATOMIES.fusiforme,
        deLEspece || {});
    const profil = (espece && table(PROFILS, espece.profil)) || table(PROFILS, forme.profil)
        || PROFILS.fusiforme;
    return { anatomie: anatomie, profil: profil, rondeur: (espece && espece.rondeur) || forme.rondeur };
}

// Fabrique 3D d'un poisson.
//   size       : échelle du groupe (voir echellePourTaille)
//   power      : combativité (0,4 → 1,6) : rougit un poisson combatif
//   aggression : agressivité (0,5 → 1,6) : hauteur des nageoires (pas la longueur)
//   form       : silhouette (clé de FORMES ; un ancien « type » numérique est accepté)
//   espece     : données de l'espèce (couleurs, motif, profil, anatomie, id)
export function creerModelePoisson(size, power, aggression, form, espece) {
    const group = new THREE.Group();
    const forme = formeDe(form);
    const { anatomie, profil: points, rondeur } = anatomieDe(forme, espece);
    const profil = preparerProfil(points, rondeur);
    const queue = anatomie.queue || { type: 'fourche', longueur: 0.22, ecart: 0.13 };
    const LS = forme.longueurRef / (1 + queue.longueur);   // longueur standard
    const xNez = LS / 2;
    const xPed = -LS / 2;
    // Un individu plus agressif que la moyenne de son espèce a des nageoires un
    // peu plus grandes (± 10 %) ; la moyenne garde les proportions mesurées.
    const moyenne = espece && espece.agressivite
        ? (espece.agressivite[0] + espece.agressivite[1]) / 2 : 1;
    const echelleNageoires = THREE.MathUtils.clamp(1 + (aggression - moyenne) * 0.4, 0.88, 1.12);

    // --- Matériaux ----------------------------------------------------------
    const couleurs = couleursEspece(espece);
    const baseColor = new THREE.Color(couleurs.flanc);
    const rouge = Math.min(1, Math.max(0,
        ((power - 1.0) / 0.5) * 0.5 + ((aggression - 1.1) / 0.5) * 0.5));
    const repere = {
        opercule: anatomie.opercule,
        oeil: anatomie.oeil ? { t: anatomie.oeil.t, v: 0.62 } : null,
        ligneCourbe: anatomie.ligneCourbe,
        contrasteOpercule: anatomie.contrasteOpercule
    };
    const motif = (espece && espece.motif) || 'aucun';
    const brillant = motif === 'argent' ? 0.3 : motif === 'ecailles' ? 0.12 : 0.04;
    const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff).lerp(new THREE.Color(0xff7a55), rouge * 0.45),
        map: textureCorps(espece, repere),
        roughness: motif === 'marbrures' || motif === 'aucun' ? 0.38 : 0.45,
        metalness: brillant
    });
    const couleurNageoires = espece && espece.nageoires !== undefined ? espece.nageoires
        : melanger(couleurs.flanc, couleurs.dos, 0.5);
    const finMat = new THREE.MeshStandardMaterial({
        color: couleurNageoires,
        map: textureNageoire(espece && espece.nageoiresMotif),
        roughness: 0.6,
        side: THREE.DoubleSide,
        vertexColors: true
    });

    // --- Corps + nageoires impaires (un seul mesh animé) ---------------------
    const lot = creerLot();
    construireCorps(lot, profil, LS, xNez);
    fermerGroupe(lot, 0);
    ['dorsale', 'dorsale2', 'adipeuse'].forEach(function (cle) {
        if (anatomie[cle]) {
            nageoireImpaire(lot, profil, LS, xNez, anatomie[cle], 1, echelleNageoires);
        }
    });
    if (anatomie.anale) {
        nageoireImpaire(lot, profil, LS, xNez, anatomie.anale, -1, echelleNageoires);
    }
    fermerGroupe(lot, 1);
    const bodyGeometry = geometrieDe(lot, true);
    const fishBody = new THREE.Mesh(bodyGeometry, [bodyMat, finMat]);
    fishBody.castShadow = true;
    group.add(fishBody);

    // --- Caudale -------------------------------------------------------------
    const tailPivot = new THREE.Group();
    tailPivot.position.set(xPed, profil.y(1) * LS, 0);
    const lotQueue = creerLot();
    caudale(lotQueue, queue, profil.h(1), LS, echelleNageoires);
    tailPivot.add(new THREE.Mesh(geometrieDe(lotQueue, true), finMat));
    group.add(tailPivot);

    // --- Détails (masqués au loin) ------------------------------------------
    const details = new THREE.Group();
    group.add(details);
    const lotPaires = creerLot();
    if (anatomie.pectorale) {
        nageoiresPaires(lotPaires, profil, LS, xNez, anatomie.pectorale, false, echelleNageoires);
    }
    if (anatomie.pelvienne) {
        nageoiresPaires(lotPaires, profil, LS, xNez, anatomie.pelvienne, true, echelleNageoires);
    }
    if (lotPaires.idx.length) {
        details.add(new THREE.Mesh(geometrieDe(lotPaires, true), finMat));
    }

    if (anatomie.oeil) {
        const o = anatomie.oeil;
        const rayon = o.r * LS;
        const iris = espece && espece.oeil !== undefined ? espece.oeil : 0xb08a40;
        const eyeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.05 });
        const geo = geometrieOeil(rayon, iris);
        const z = zSurface(profil, o.t, o.y) * LS - rayon * 0.12;
        for (const cote of [1, -1]) {
            const oeil = new THREE.Mesh(geo, eyeMat);
            oeil.position.set(xNez - o.t * LS, o.y * LS, cote * z);
            if (cote < 0) { oeil.rotation.y = Math.PI; }
            details.add(oeil);
        }
    }

    const lotTete = creerLot();
    if (anatomie.bouche) {
        bouche(lotTete, profil, LS, xNez, anatomie.bouche);
    }
    if (lotTete.idx.length) {
        details.add(new THREE.Mesh(geometrieDe(lotTete, false), new THREE.MeshStandardMaterial({
            color: melanger(couleurs.dos, 0x000000, 0.6), roughness: 0.7, side: THREE.DoubleSide
        })));
    }
    if (anatomie.barbillons && anatomie.barbillons.length) {
        const lotB = creerLot();
        barbillons(lotB, profil, LS, xNez, anatomie.barbillons);
        details.add(new THREE.Mesh(geometrieDe(lotB, false), new THREE.MeshStandardMaterial({
            color: (espece && espece.barbillonsCouleur) || melanger(couleurs.ventre, couleurs.dos, 0.35),
            roughness: 0.5
        })));
    }

    // --- Données attendues par le jeu (contrat) -------------------------------
    group.userData.tailPivot = tailPivot;
    group.userData.bodyMat = bodyMat;
    group.userData.swimRest = bodyGeometry.getAttribute('position').array.slice();
    group.userData.bodyMesh = fishBody;
    // Ondulation (ambiance.js) : rear = 0 au milieu du corps → 1 au pédoncule ;
    // amplitude en unités du modèle (même valeur que l'ancien `scale.z = bodyZ`).
    group.userData.swimDemi = LS / 2;
    group.userData.swimAmp = forme.bodyZ;
    // Teinte multipliée à la texture : le jeu la fait rougir (poissons.js).
    group.userData.couleurBase = bodyMat.color.clone();
    group.userData.couleurEspece = baseColor;
    group.userData.especeData = espece || null;
    group.userData.details = details;
    group.updateMatrixWorld(true);
    const boite = new THREE.Box3().setFromObject(group);
    // Hauteur du poisson au-dessus de son centre : sert à le garder sous l'eau.
    group.userData.topOffset = boite.max.y * size;
    group.userData.longueurModele = boite.max.x - boite.min.x;
    group.scale.setScalar(size);
    group.userData.size = size;
    return group;
}

// Compte des triangles et des meshes (tests, page des tailles).
export function statistiquesModele(group) {
    let triangles = 0;
    let meshes = 0;
    group.traverse(function (o) {
        if (o.isMesh) {
            meshes++;
            const g = o.geometry;
            triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
        }
    });
    return { triangles: triangles, meshes: meshes };
}

// ---------------------------------------------------------------------------
// dimensions.js — DIMENSIONS D'UN ÉTANG : contour, surface, échelle et portées. Fonctions PURES.
//
// Tout ce qui ne dépend que du RAYON NOMINAL de l'étang (en unités, 2 unités ≈ 1 m) et de sa FORME vit ici : le
// contour (somme d'harmoniques fixes), sa surface, le facteur d'échelle par rapport à l'étang de référence
// (rayon 90 = la plaine) et les portées de lancer. Aucun `three`, aucun état, aucun `rand()` : `milieux.js`
// (données des biotopes) et `environnement.js` (le monde) lisent la MÊME source, et les tests l'importent
// directement.
//
// La FORME ne change pas avec la taille : seul le rayon multiplie le contour. Elle change avec le BIOTOPE :
// `FORMES` décrit quatre profils de contour (étang, lac, canal, rivière), tous RADIAUX (r = f(angle) autour
// d'un centre : une seule rive par rayon, donc étoilés), et `rayonContour(rayon, angle, forme)` les calcule.
// L'étang (plaine, carnassiers, forêt) est le contour d'origine, au bit près. Les autres profils sont une
// superellipse allongée le long de z, déformée par des harmoniques, puis NORMALISÉE pour que `rayon` garde le
// même sens d'échelle : à rayon égal, tous les profils ont la même SURFACE que l'étang.
// ---------------------------------------------------------------------------

// Rayon nominal de l'étang de référence (la plaine) : le monde d'origine. ≈ 45 m de rayon.
export const RAYON_REFERENCE = 90;

// Harmoniques du contour de l'ÉTANG (coefficients fixes, donc déterministe). Les basses fréquences donnent une
// forme allongée et lobée, les hautes ajoutent des criques. Amplitude totale : 10,5 % + 6 % + 3,5 % + 2 % = 22 %.
export const HARMONIQUES = [
    { amplitude: 0.105, frequence: 2, phase: 0.6 },
    { amplitude: 0.060, frequence: 3, phase: 2.4 },
    { amplitude: 0.035, frequence: 5, phase: 4.1 },
    { amplitude: 0.020, frequence: 7, phase: 1.3 }
];

export const VARIATION_CONTOUR = HARMONIQUES.reduce(function (total, h) { return total + h.amplitude; }, 0);

// ---------------------------------------------------------------------------
// PROFILS DE FORME (une forme par type de plan d'eau). Grand axe le long de z : le joueur regarde vers le nord.
//   allongement : rapport z / x de la superellipse de base (1 = autant en largeur qu'en longueur) ;
//   exposant    : p de la superellipse |x|^p + |z|^p = 1 (2 = ellipse, grand = berges presque parallèles) ;
//   harmoniques : déformations multiplicatives du contour (1 + Σ a·sin(k·θ + φ)).
// Le « méandre » de la rivière est une harmonique PAIRE de phase nulle (sin kθ) : elle gonfle la rive est quand
// elle creuse la rive ouest au même z, donc les deux berges se décalent ensemble (un S, pas un élargissement).
// ---------------------------------------------------------------------------
export const FORME_DEFAUT = 'etang';

export const FORMES = {
    etang: { id: 'etang', nom: 'Étang', allongement: 1, exposant: null, harmoniques: HARMONIQUES },
    lac: {
        id: 'lac', nom: 'Lac', allongement: 1.5, exposant: 2.4,
        // 4 harmoniques douces (les anses) : amplitude totale 0,24.
        harmoniques: [
            { amplitude: 0.090, frequence: 3, phase: 0.9 },
            { amplitude: 0.070, frequence: 4, phase: 2.1 },
            { amplitude: 0.050, frequence: 6, phase: 4.4 },
            { amplitude: 0.030, frequence: 9, phase: 0.3 }
        ]
    },
    canal: {
        id: 'canal', nom: 'Canal', allongement: 5, exposant: 7,
        // 2 harmoniques très faibles : des berges presque droites et parallèles.
        harmoniques: [
            { amplitude: 0.012, frequence: 3, phase: 0.4 },
            { amplitude: 0.008, frequence: 5, phase: 2.2 }
        ]
    },
    riviere: {
        id: 'riviere', nom: 'Rivière', allongement: 3.5, exposant: 2.8,
        // Le méandre (1 harmonique basse fréquence, amplitude 0,22) + 3 petites.
        harmoniques: [
            { amplitude: 0.220, frequence: 4, phase: 0 },
            { amplitude: 0.020, frequence: 3, phase: 1.1 },
            { amplitude: 0.012, frequence: 7, phase: 3.0 },
            { amplitude: 0.008, frequence: 11, phase: 5.2 }
        ]
    }
};

export const IDS_FORMES = Object.keys(FORMES);

/** Vrai si `forme` est le nom d'un profil connu. */
export function formeConnue(forme) {
    return typeof forme === 'string' && Object.prototype.hasOwnProperty.call(FORMES, forme);
}

/** Rapport de contour de l'ÉTANG d'origine dans la direction `angle` (1 = rayon nominal). Inchangé au bit près. */
function facteurEtang(angle) {
    let facteur = 1;
    for (let i = 0; i < HARMONIQUES.length; i++) {
        const h = HARMONIQUES[i];
        facteur += h.amplitude * Math.sin(h.frequence * angle + h.phase);
    }
    return facteur;
}

// Rayon d'une superellipse de demi-axes (1 en x, `allongement` en z) dans la direction `angle`, puis harmoniques :
// c'est le profil BRUT, avant normalisation.
function facteurBrut(angle, forme) {
    const profil = FORMES[forme];
    const c = Math.abs(Math.cos(angle));
    const s = Math.abs(Math.sin(angle) / profil.allongement);
    let facteur = 1 / Math.pow(Math.pow(c, profil.exposant) + Math.pow(s, profil.exposant), 1 / profil.exposant);
    let modulation = 1;
    for (let i = 0; i < profil.harmoniques.length; i++) {
        const h = profil.harmoniques[i];
        modulation += h.amplitude * Math.sin(h.frequence * angle + h.phase);
    }
    facteur *= modulation;
    return facteur;
}

// Aire (par 2 000 tranches) d'un contour polaire de rayon 1 : ∫ r²/2 dθ. La même quadrature sert à normaliser
// les profils et à calculer leur coefficient de surface.
const TRANCHES = 2000;
function aireDe(facteur) {
    let aire = 0;
    for (let i = 0; i < TRANCHES; i++) {
        const f = facteur(((i + 0.5) / TRANCHES) * Math.PI * 2);
        aire += (f * f / 2) * (Math.PI * 2 / TRANCHES);
    }
    return aire;
}

// Surface de l'étang d'origine (rayon 1) : la référence que tous les profils reproduisent.
const AIRE_ETANG = aireDe(facteurEtang);
// Échelle de chaque profil : sa surface (à rayon égal) est celle de l'étang (moyenne quadratique du rayon identique).
const NORMES = {};
IDS_FORMES.forEach(function (forme) {
    NORMES[forme] = forme === FORME_DEFAUT ? 1 : Math.sqrt(AIRE_ETANG / aireDe(function (a) { return facteurBrut(a, forme); }));
});

/** Rapport de contour dans la direction `angle` (1 = rayon nominal) pour un profil (`etang` par défaut). */
export function facteurContour(angle, forme) {
    if (forme === undefined || forme === FORME_DEFAUT) { return facteurEtang(angle); }
    return NORMES[forme] * facteurBrut(angle, forme);
}

/** Rayon du contour (unités) d'un plan d'eau de rayon nominal `rayon` et de profil `forme`, dans la direction `angle`. */
export function rayonContour(rayon, angle, forme) {
    return rayon * facteurContour(angle, forme);
}

// Surface d'un plan d'eau de rayon 1 (aire d'un contour polaire : ∫ r²/2 dθ). La surface d'un plan d'eau de
// rayon R est R² fois ce coefficient : la forme est la même à toutes les tailles. `COEFFICIENT_SURFACE` est celui
// de l'étang ; `coefficientSurface(forme)` celui d'un profil (calculé numériquement, comme celui de l'étang).
export const COEFFICIENT_SURFACE = AIRE_ETANG;
const COEFFICIENTS = {};
IDS_FORMES.forEach(function (forme) {
    COEFFICIENTS[forme] = forme === FORME_DEFAUT ? COEFFICIENT_SURFACE : aireDe(function (a) { return facteurContour(a, forme); });
});
export const COEFFICIENTS_SURFACE = COEFFICIENTS;

/** Coefficient de surface (rayon 1) d'un profil. */
export function coefficientSurface(forme) {
    return COEFFICIENTS[formeConnue(forme) ? forme : FORME_DEFAUT];
}

/** Surface de l'eau (unités²) d'un plan d'eau de rayon nominal `rayon` et de profil `forme`. */
export function surfaceUnites(rayon, forme) {
    return rayon * rayon * coefficientSurface(forme);
}

/** Surface de l'eau en HECTARES (2 unités = 1 m, donc 4 unités² = 1 m²). Seule vérité de la surface. */
export function surfaceHectares(rayon, forme) {
    return surfaceUnites(rayon, forme) / 4 / 10000;
}

/** Facteur d'échelle d'un étang par rapport à la plaine (f = rayon / 90). */
export function echelleDeRayon(rayon) {
    return rayon / RAYON_REFERENCE;
}

// ---------------------------------------------------------------------------
// EXTENTS : la plus grande distance au centre, mesurée sur chaque axe (x : largeur, z : longueur). Ils servent à
// la grille des fonds (un RECTANGLE), à la carte, à la barque et à l'ambiance (brume, ciel, caméra, portées).
// L'étang garde sa borne d'origine (rayon × (1 + 22 %), la même sur les deux axes) : le monde de la plaine ne
// bouge pas d'un bit. Les autres profils sont mesurés sur leur contour (8 192 directions, déterministe).
// ---------------------------------------------------------------------------
const MESURES = 8192;
const EXTENTS_UNITAIRES = {};
// Maximum d'une fonction de l'angle : balayage de 8 192 directions, puis recherche ternaire autour du meilleur point.
function maximumSur(fonction) {
    let meilleur = 0;
    let angleMeilleur = 0;
    for (let i = 0; i < MESURES; i++) {
        const a = (i / MESURES) * Math.PI * 2;
        const v = fonction(a);
        if (v > meilleur) { meilleur = v; angleMeilleur = a; }
    }
    let bas = angleMeilleur - Math.PI * 2 / MESURES;
    let haut = angleMeilleur + Math.PI * 2 / MESURES;
    for (let k = 0; k < 60; k++) {
        const g = bas + (haut - bas) / 3;
        const d = haut - (haut - bas) / 3;
        if (fonction(g) < fonction(d)) { bas = g; } else { haut = d; }
    }
    return Math.max(meilleur, fonction((bas + haut) / 2));
}
IDS_FORMES.forEach(function (forme) {
    if (forme === FORME_DEFAUT) { EXTENTS_UNITAIRES[forme] = { maxX: 1 + VARIATION_CONTOUR, maxZ: 1 + VARIATION_CONTOUR }; return; }
    EXTENTS_UNITAIRES[forme] = {
        maxX: maximumSur(function (a) { return Math.abs(facteurContour(a, forme) * Math.cos(a)); }),
        maxZ: maximumSur(function (a) { return Math.abs(facteurContour(a, forme) * Math.sin(a)); })
    };
});

/** Plus grandes distances au centre, sur x (largeur) et sur z (longueur), d'un plan d'eau de rayon `rayon`. */
export function extents(rayon, forme) {
    const e = EXTENTS_UNITAIRES[formeConnue(forme) ? forme : FORME_DEFAUT];
    return { maxX: rayon * e.maxX, maxZ: rayon * e.maxZ };
}

// Plus grand extent de l'étang de RÉFÉRENCE (la plaine, 109,8) : l'unité des échelles d'ambiance.
const EXTENT_REFERENCE = extents(RAYON_REFERENCE, FORME_DEFAUT).maxX;

/** Facteur d'échelle du plan d'eau d'après son plus grand extent (= f pour l'étang : rayon / 90). */
export function echelleExtent(rayon, forme) {
    if (forme === undefined || forme === FORME_DEFAUT) { return echelleDeRayon(rayon); }
    const e = extents(rayon, forme);
    return Math.max(e.maxX, e.maxZ) / EXTENT_REFERENCE;
}

/**
 * Facteurs d'échelle des décalages de relief (les fosses) sur chaque axe, par rapport à la plaine. L'étang est une
 * homothétie (f sur les deux axes) ; un autre profil étire le relief comme ses extents (x × maxX / maxX_ref, z × maxZ / maxZ_ref).
 */
export function echelleAxes(rayon, forme) {
    if (forme === undefined || forme === FORME_DEFAUT) { const f = echelleDeRayon(rayon); return { x: f, z: f }; }
    const e = extents(rayon, forme);
    return { x: e.maxX / EXTENT_REFERENCE, z: e.maxZ / EXTENT_REFERENCE };
}

function borner(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Lancer de la canne : 52 unités dans la plaine. On ne lance pas 26 m dans un étang de 24 m, et on doit
// atteindre le large d'un lac : la portée suit l'échelle (du plus grand extent), bornée à [20, 140].
export const PORTEE_LANCER_REFERENCE = 52;
export const PORTEE_LANCER_MIN = 20;
export const PORTEE_LANCER_MAX = 140;

/** Portée maximale du lancer de la canne (unités) dans un plan d'eau de rayon nominal `rayon` (et de profil `forme`). */
export function porteeLancer(rayon, forme) {
    return borner(PORTEE_LANCER_REFERENCE * echelleExtent(rayon, forme), PORTEE_LANCER_MIN, PORTEE_LANCER_MAX);
}

// Boule d'amorce et bouée du sonar : 46 unités dans la plaine, dans la même proportion que le lancer.
export const PORTEE_AMORCE_REFERENCE = 46;

/** Portée maximale de l'amorce et du sonar (unités) : même rapport que le lancer de la canne. */
export function porteeAmorce(rayon, forme) {
    return PORTEE_AMORCE_REFERENCE * porteeLancer(rayon, forme) / PORTEE_LANCER_REFERENCE;
}

// Brume : 150 → 480 dans la plaine. Elle grandit avec le plus grand étang, jamais en dessous de la plaine.
export const BRUME_REFERENCE = { proche: 150, loin: 480 };
export const CIEL_REFERENCE = 520;     // rayon de la sphère du ciel dans la plaine
export const CAMERA_FAR_REFERENCE = 900;
export const RIVE_EXTERIEURE_REFERENCE = 430;   // rayon extérieur du sol dans la plaine

/** Échelle des éléments d'ambiance (brume, ciel, sol) : 1 dans la plaine et plus petit, f (du plus grand extent) au-delà. */
export function echelleAmbiance(rayon, forme) {
    return Math.max(1, echelleExtent(rayon, forme));
}

// ---------------------------------------------------------------------------
// RÉPARTITION DES POINTS LE LONG DU CONTOUR. Tirer un angle UNIFORME convient à l'étang (presque rond) mais
// entasse tout dans le milieu d'un canal ou d'une rivière (un angle qui balaie vite le bout, lentement les
// berges). Ces fonctions transforment un tirage u ∈ [0, 1[ en angle :
//   angleParSurface : densité d'angle ∝ r² (points uniformes sur la SURFACE : poissons, nénuphars) ;
//   angleParBord    : densité d'angle ∝ longueur d'arc (points uniformes le long de la RIVE : arbres, roseaux).
// Pour l'étang elles rendent `u × 2π`, comme avant (le monde d'origine ne bouge pas d'un bit).
// ---------------------------------------------------------------------------
const TABLE = 2048;
const CUMULS = {};
function tableDe(forme, mode) {
    const cle = forme + ':' + mode;
    if (CUMULS[cle]) { return CUMULS[cle]; }
    const cumul = new Float64Array(TABLE + 1);
    const h = 1e-5;
    for (let i = 0; i < TABLE; i++) {
        const a = ((i + 0.5) / TABLE) * Math.PI * 2;
        const r = facteurContour(a, forme);
        let poids = r * r;
        if (mode === 'bord') {
            const dr = (facteurContour(a + h, forme) - facteurContour(a - h, forme)) / (2 * h);
            poids = Math.sqrt(r * r + dr * dr);
        }
        cumul[i + 1] = cumul[i] + poids;
    }
    CUMULS[cle] = cumul;
    return cumul;
}

function angleDepuisTable(u, forme, mode) {
    if (forme === undefined || forme === FORME_DEFAUT) { return u * Math.PI * 2; }
    const cumul = tableDe(forme, mode);
    const cible = (u - Math.floor(u)) * cumul[TABLE];
    let bas = 0;
    let haut = TABLE;
    while (haut - bas > 1) {
        const milieu = (bas + haut) >> 1;
        if (cumul[milieu] <= cible) { bas = milieu; } else { haut = milieu; }
    }
    const reste = cumul[bas + 1] > cumul[bas] ? (cible - cumul[bas]) / (cumul[bas + 1] - cumul[bas]) : 0;
    return ((bas + reste) / TABLE) * Math.PI * 2;
}

/** Angle tel que les points soient répartis uniformément sur la SURFACE du plan d'eau (u ∈ [0, 1[). */
export function angleParSurface(u, forme) { return angleDepuisTable(u, forme, 'surface'); }

/** Angle tel que les points soient répartis uniformément le long de la RIVE (u ∈ [0, 1[). */
export function angleParBord(u, forme) { return angleDepuisTable(u, forme, 'bord'); }

/**
 * Angle d'un emplacement DÉFINI POUR L'ÉTANG (obstacles : 50°, 116°…) ramené sur un autre profil : il pointe le
 * même endroit relatif du plan d'eau (les positions suivent les axes). Identité pour l'étang.
 */
export function angleSurForme(angle, forme) {
    if (forme === undefined || forme === FORME_DEFAUT) { return angle; }
    return Math.atan2(Math.sin(angle) * FORMES[forme].allongement, Math.cos(angle));
}

/** Réciproque de `angleSurForme` : l'angle d'un point du plan d'eau dans le repère de l'étang (identité pour l'étang). */
export function angleDepuisForme(angle, forme) {
    if (forme === undefined || forme === FORME_DEFAUT) { return angle; }
    return Math.atan2(Math.sin(angle) / FORMES[forme].allongement, Math.cos(angle));
}

/**
 * Point à `decalage` unités de la rive, mesurées sur la NORMALE du contour (et non sur le rayon : sur une berge
 * presque parallèle au rayon, un décalage radial se réduirait à presque rien). `rayonDe(angle)` donne le contour.
 * Renvoie le décalage (x, z) depuis le centre et la normale sortante unitaire (nx, nz) du contour en ce point.
 */
export function pointAuBord(rayonDe, angle, decalage) {
    const h = 1e-4;
    const r = rayonDe(angle);
    const dr = (rayonDe(angle + h) - rayonDe(angle - h)) / (2 * h);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // Tangente (dr·c − r·s, dr·s + r·c) ; normale sortante (tz, −tx).
    const tx = dr * c - r * s;
    const tz = dr * s + r * c;
    const n = Math.hypot(tx, tz) || 1;
    return { x: c * r + (tz / n) * decalage, z: s * r - (tx / n) * decalage, nx: tz / n, nz: -tx / n };
}

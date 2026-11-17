// ---------------------------------------------------------------------------
// dimensions.js — DIMENSIONS D'UN ÉTANG : contour, surface, échelle et portées. Fonctions PURES.
//
// Tout ce qui ne dépend que du RAYON NOMINAL de l'étang (en unités, 2 unités ≈ 1 m) et de sa FORME vit ici : le
// contour (somme d'harmoniques), sa surface, le facteur d'échelle par rapport à l'étang de référence (rayon 90 =
// la plaine) et les portées de lancer. Aucun `three`, aucun `rand()` : `milieux.js` (données des biotopes) et
// `environnement.js` (le monde) lisent la MÊME source, et les tests l'importent directement.
//
// La FORME ne change pas avec la taille : seul le rayon multiplie le contour. Elle change avec le BIOTOPE :
// `FORMES` décrit le STYLE de quatre profils de contour (étang, lac, canal, rivière), tous RADIAUX (r = f(angle)
// autour d'un centre : une seule rive par rayon, donc étoilés), et `rayonContour(rayon, angle, forme)` les calcule.
// Un profil est une superellipse allongée le long de z, déformée par des harmoniques, puis NORMALISÉE pour que
// `rayon` garde le même sens d'échelle : à rayon égal, tous les profils ont la même SURFACE que l'étang d'origine.
//
// GÉNÉRATEUR DE TERRAINS (v244) : `profilDeGraine(graine, forme)` tire, dans les plages du style (`PLAGES_GRAINE`),
// les paramètres exacts d'un plan d'eau : chaque partie a une forme différente mais fidèle au biotope, et la même
// graine redonne le même plan d'eau. `FORMES` reste la description du style (documentation, valeurs par défaut :
// l'étang de `FORMES` est le contour d'origine, au bit près). Le profil COURANT (le plan d'eau du monde) est le seul
// ÉTAT du module : `definirProfil` le change (environnement.js, `setRayonMonde`) et toutes les fonctions de contour,
// de surface, d'extents, de portée et de répartition lisent ce profil quand leur `forme` est la sienne (ou omise) ;
// pour une autre forme (le catalogue des biotopes), elles lisent le style par défaut.
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

// Modulation d'un profil : 1 + Σ a·sin(k·θ + φ).
function modulation(angle, profil) {
    let m = 1;
    for (let i = 0; i < profil.harmoniques.length; i++) {
        const h = profil.harmoniques[i];
        m += h.amplitude * Math.sin(h.frequence * angle + h.phase);
    }
    return m;
}

// Rayon d'une superellipse de demi-axes (1 en x, `allongement` en z) dans la direction `angle`, puis harmoniques :
// c'est le profil BRUT, avant normalisation. Un exposant `null` (étang tiré d'une graine) est une ellipse (p = 2).
function facteurBrut(angle, profil) {
    const p = profil.exposant === null ? 2 : profil.exposant;
    const c = Math.abs(Math.cos(angle));
    const s = Math.abs(Math.sin(angle) / profil.allongement);
    const facteur = 1 / Math.pow(Math.pow(c, p) + Math.pow(s, p), 1 / p);
    return facteur * modulation(angle, profil);
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

// Surface de l'étang d'origine (rayon 1) : LA référence. Tous les profils (par défaut ou tirés d'une graine) sont
// normalisés pour la reproduire : à rayon égal, la surface (donc la population, la capacité…) ne dépend pas de la forme.
const AIRE_ETANG = aireDe(facteurEtang);

// Maximum d'une fonction de l'angle : balayage de 8 192 directions, puis recherche ternaire autour du meilleur point.
const MESURES = 8192;
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

// ---------------------------------------------------------------------------
// PROFIL COURANT. Le monde n'a qu'un plan d'eau à la fois : `definirProfil` le choisit (environnement.js, via
// `setRayonMonde(rayon, forme, graine)`), et toutes les fonctions ci-dessous lisent CE profil quand leur `forme`
// est celle du profil courant (ou omise). Pour une AUTRE forme (le catalogue des biotopes : surface annoncée d'un
// biotope qu'on n'a pas choisi), elles lisent le profil par défaut de `FORMES` : la surface est la même partout.
// Chaque profil a son « cache » : contour normalisé, coefficient de surface, extents et tables de répartition,
// recalculés une seule fois quand le profil change.
// ---------------------------------------------------------------------------
function construire(profil) {
    const origine = profil === FORMES.etang;   // le contour d'origine (v243) : bit pour bit
    const norme = origine ? 1 : Math.sqrt(AIRE_ETANG / aireDe(function (a) { return facteurBrut(a, profil); }));
    const facteur = origine ? facteurEtang : function (a) { return norme * facteurBrut(a, profil); };
    // L'étang d'origine garde sa borne (rayon × (1 + 22 %), la même sur les deux axes) : le monde de la plaine ne
    // bouge pas d'un bit. Les autres contours sont mesurés (8 192 directions, déterministe).
    // Un étang tiré d'une graine est presque rond : comme l'étang d'origine, sa borne est la même sur les deux axes
    // (son plus grand rayon), donc le carré d'origine de la grille des fonds et de la carte.
    let etendue = { maxX: 1 + VARIATION_CONTOUR, maxZ: 1 + VARIATION_CONTOUR };
    if (!origine && profil.id === FORME_DEFAUT) {
        const rayonMax = maximumSur(facteur);
        etendue = { maxX: rayonMax, maxZ: rayonMax };
    } else if (!origine) {
        etendue = {
            maxX: maximumSur(function (a) { return Math.abs(facteur(a) * Math.cos(a)); }),
            maxZ: maximumSur(function (a) { return Math.abs(facteur(a) * Math.sin(a)); })
        };
    }
    return { profil: profil, origine: origine, facteur: facteur, coefficient: origine ? AIRE_ETANG : aireDe(facteur),
        etendue: etendue, tables: {} };
}

const DEFAUTS = {};
IDS_FORMES.forEach(function (forme) { DEFAUTS[forme] = construire(FORMES[forme]); });
const CONSTRUITS = new Map();
let courant = DEFAUTS[FORME_DEFAUT];

/** Profil COURANT (`{ id, nom, allongement, exposant, harmoniques }`) : celui du plan d'eau du monde. */
export function profilCourant() { return courant.profil; }

/** Vrai si `profil` est le contour d'origine de l'étang (la plaine v243, sans graine). */
export function estContourOrigine(profil) { return profil === FORMES.etang; }

/** Choisit le profil courant (un profil de `FORMES` ou de `profilDeGraine`). Renvoie false s'il est invalide. */
export function definirProfil(profil) {
    if (!profil || !formeConnue(profil.id) || !Array.isArray(profil.harmoniques) || !(profil.allongement > 0)) { return false; }
    if (profil === FORMES[profil.id]) { courant = DEFAUTS[profil.id]; return true; }
    let cache = CONSTRUITS.get(profil);
    if (!cache) {
        if (CONSTRUITS.size >= 16) { CONSTRUITS.clear(); }
        cache = construire(profil);
        CONSTRUITS.set(profil, cache);
    }
    courant = cache;
    return true;
}

// Cache de la forme demandée : le profil courant si `forme` est omise ou celle du courant, sinon le style par défaut.
function cacheDe(forme) {
    if (forme === undefined || forme === courant.profil.id) { return courant; }
    return DEFAUTS[formeConnue(forme) ? forme : FORME_DEFAUT];
}

/** Rapport de contour dans la direction `angle` (1 = rayon nominal) pour un profil (le courant par défaut). */
export function facteurContour(angle, forme) {
    return cacheDe(forme).facteur(angle);
}

/** Rayon du contour (unités) d'un plan d'eau de rayon nominal `rayon` et de profil `forme`, dans la direction `angle`. */
export function rayonContour(rayon, angle, forme) {
    return rayon * cacheDe(forme).facteur(angle);
}

// Surface d'un plan d'eau de rayon 1 (aire d'un contour polaire : ∫ r²/2 dθ). La surface d'un plan d'eau de
// rayon R est R² fois ce coefficient : la forme est la même à toutes les tailles. `COEFFICIENT_SURFACE` est celui
// de l'étang d'origine ; `coefficientSurface(forme)` celui d'un profil (intégrale de son contour). Tous égaux :
// les profils sont normalisés.
export const COEFFICIENT_SURFACE = AIRE_ETANG;
export const COEFFICIENTS_SURFACE = {};
IDS_FORMES.forEach(function (forme) { COEFFICIENTS_SURFACE[forme] = DEFAUTS[forme].coefficient; });

/** Coefficient de surface (rayon 1) d'un profil : l'intégrale de son contour. */
export function coefficientSurface(forme) {
    return cacheDe(forme).coefficient;
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
// ---------------------------------------------------------------------------
/** Plus grandes distances au centre, sur x (largeur) et sur z (longueur), d'un plan d'eau de rayon `rayon`. */
export function extents(rayon, forme) {
    const e = cacheDe(forme).etendue;
    return { maxX: rayon * e.maxX, maxZ: rayon * e.maxZ };
}

// ---------------------------------------------------------------------------
// GÉNÉRATEUR DE TERRAINS : `profilDeGraine(graine, forme)` tire, dans les PLAGES du style de la forme, les
// paramètres exacts d'un plan d'eau. Même graine + même forme = même profil, au bit près (rejouable, testable).
//
// Le générateur est LOCAL : un mulberry32 amorcé par `graine ^ hash(forme)`. Il ne touche ni `Math.random` ni le
// `rand()` du monde (décor et poissons ne changent pas parce qu'on a tiré une forme). `FORMES` reste la description
// du style (documentation et valeurs par défaut) ; PLAGES_GRAINE en donne les bornes.
//
//   allongement : rapport z / x de base ; exposant : p de la superellipse (null : contour harmonique d'un étang) ;
//   harmoniques : nombre, amplitude de chacune (la plus basse fréquence est la plus forte) et fréquences distinctes ;
//   rapport     : longueur / largeur MESURÉE du contour final (les harmoniques déforment l'allongement de base) ;
//   meandre     : rivière, nombre de S le long du lit (1 ou 2). Le méandre est une harmonique PAIRE (2 × nombre de S)
//                 de phase nulle : les deux berges se décalent ensemble ; une harmonique impaire ne ferait qu'élargir
//                 une extrémité du lit.
// Un tirage dont le contour sortirait du style (rapport mesuré hors plage, contour trop creusé, méandre trop faible)
// est refait avec la suite du même générateur : toujours déterministe, et le style est garanti sur la mesure.
// ---------------------------------------------------------------------------
export const PLAGES_GRAINE = {
    etang: { allongement: [0.95, 1.08], exposant: null, nombre: [4, 6], amplitude: [0.02, 0.11], frequences: [2, 7], rapport: [0.88, 1.14] },
    lac: { allongement: [1.2, 1.8], exposant: [2.2, 2.8], nombre: [5, 7], amplitude: [0.03, 0.09], frequences: [3, 10], rapport: [1.2, 1.8] },
    canal: { allongement: [4.0, 6.5], exposant: [6, 8], nombre: [2, 3], amplitude: [0.005, 0.02], frequences: [3, 9], rapport: [4.0, 6.5] },
    riviere: { allongement: [2.5, 4.5], exposant: [2.4, 3.2], meandre: [1, 2], amplitudeMeandre: [0.12, 0.28],
        nombre: [3, 4], amplitude: [0.008, 0.03], frequences: [3, 11], rapport: [2.5, 4.5] }
};

const ESSAIS_MAX = 60;

function hashTexte(texte) {   // FNV-1a 32 bits
    let h = 2166136261;
    for (let i = 0; i < texte.length; i++) { h = Math.imul(h ^ texte.charCodeAt(i), 16777619) >>> 0; }
    return h;
}

function mulberry32(graine) {
    let s = graine >>> 0;
    return function () {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function arrondi(v) { return Math.round(v * 10000) / 10000; }

// n entiers DISTINCTS de [min ; max] (mélange partiel), triés par fréquence croissante.
function frequencesDistinctes(alea, n, min, max, exclues) {
    const pool = [];
    for (let k = min; k <= max; k++) { if (!exclues || exclues.indexOf(k) < 0) { pool.push(k); } }
    for (let i = 0; i < n; i++) {
        const j = i + Math.floor(alea() * (pool.length - i));
        const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, n).sort(function (a, b) { return a - b; });
}

// Un tirage de paramètres, dans les plages du style (l'ordre des appels à `alea` est FIXE : il définit la graine).
function tirer(forme, alea) {
    const p = PLAGES_GRAINE[forme];
    const entre = function (plage) { return plage[0] + (plage[1] - plage[0]) * alea(); };
    const allongement = arrondi(entre(p.allongement));
    const exposant = p.exposant ? arrondi(entre(p.exposant)) : null;
    const harmoniques = [];
    const exclues = [];
    if (p.meandre) {
        const s = p.meandre[0] + Math.floor(alea() * (p.meandre[1] - p.meandre[0] + 1));
        harmoniques.push({ amplitude: arrondi(entre(p.amplitudeMeandre)), frequence: 2 * s, phase: 0 });
        exclues.push(2 * s);
    }
    const n = p.nombre[0] + Math.floor(alea() * (p.nombre[1] - p.nombre[0] + 1));
    const frequences = frequencesDistinctes(alea, n, p.frequences[0], p.frequences[1], exclues);
    frequences.forEach(function (frequence, i) {
        // Étang et lac : la plus basse fréquence est la plus forte (anses larges d'abord, criques ensuite).
        const poids = (forme === 'etang' || forme === 'lac') ? 1 / (1 + 0.5 * i) : 1;
        const amplitude = arrondi(p.amplitude[0] + (p.amplitude[1] - p.amplitude[0]) * alea() * poids);
        harmoniques.push({ amplitude: amplitude, frequence: frequence, phase: arrondi(alea() * Math.PI * 2) });
    });
    return { id: forme, nom: FORMES[forme].nom, allongement: allongement, exposant: exposant, harmoniques: harmoniques };
}

// Mesure du contour BRUT d'un profil (le rapport et la forme ne dépendent pas de la normalisation).
function mesurer(profil, avecMeandre) {
    const brut = function (a) { return facteurBrut(a, profil); };
    const maxX = maximumSur(function (a) { return Math.abs(brut(a) * Math.cos(a)); });
    const maxZ = maximumSur(function (a) { return Math.abs(brut(a) * Math.sin(a)); });
    let modMin = Infinity;
    let rMin = Infinity;
    let rMax = 0;
    const N = 4096;
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        modMin = Math.min(modMin, modulation(a, profil));
        const r = brut(a);
        rMin = Math.min(rMin, r);
        rMax = Math.max(rMax, r);
    }
    const mesure = { rapport: maxZ / maxX, modMin: modMin, rMin: rMin, rMax: rMax, meandre: 0 };
    if (avecMeandre) {
        // Même mesure que les tests : à 17 hauteurs (−80 % … +80 % de la longueur), l'axe du lit (milieu des deux berges)
        // et la largeur ; le méandre est l'amplitude de l'axe, rapportée à la largeur moyenne.
        const points = [];
        for (let i = 0; i < 16384; i++) { const a = (i / 16384) * Math.PI * 2; const r = brut(a); points.push([r * Math.cos(a), r * Math.sin(a)]); }
        const axes = [];
        let largeurs = 0;
        for (let k = -8; k <= 8; k++) {
            let est = -Infinity;
            let ouest = Infinity;
            points.forEach(function (q) { if (Math.abs(q[1] - (k / 10) * maxZ) < 0.003 * maxZ) { est = Math.max(est, q[0]); ouest = Math.min(ouest, q[0]); } });
            axes.push((est + ouest) / 2);
            largeurs += est - ouest;
        }
        mesure.meandre = (Math.max.apply(null, axes) - Math.min.apply(null, axes)) / (largeurs / axes.length);
    }
    return mesure;
}

// Le style est-il conservé ? (marge de 0,2 % sur le rapport : la mesure des tests est plus fine que la nôtre.)
function respecteLeStyle(forme, profil) {
    const p = PLAGES_GRAINE[forme];
    const m = mesurer(profil, forme === 'riviere');
    if (!(m.rapport >= p.rapport[0] * 1.002 && m.rapport <= p.rapport[1] * 0.998)) { return false; }
    if (!(m.modMin >= 0.55)) { return false; }
    if (forme === 'etang' && !(m.rMax / m.rMin <= 1.9)) { return false; }
    if (forme === 'riviere' && !(m.meandre >= 0.3)) { return false; }
    return true;
}

const PROFILS_GRAINE = new Map();

/**
 * Profil `{ id, nom, allongement, exposant, harmoniques }` d'un plan d'eau de la `forme` donnée (`etang`, `lac`,
 * `canal`, `riviere`), tiré de la `graine` dans les plages de `PLAGES_GRAINE`. Pur et déterministe.
 */
export function profilDeGraine(graine, forme) {
    const id = formeConnue(forme) ? forme : FORME_DEFAUT;
    const g = Number.isFinite(Number(graine)) ? (Number(graine) >>> 0) : 0;
    const cle = id + ':' + g;
    if (PROFILS_GRAINE.has(cle)) { return PROFILS_GRAINE.get(cle); }
    const alea = mulberry32((g ^ hashTexte(id)) >>> 0);
    let profil = null;
    for (let essai = 0; essai < ESSAIS_MAX && !profil; essai++) {
        const candidat = tirer(id, alea);
        if (respecteLeStyle(id, candidat)) { profil = candidat; }
    }
    // Garde-fou (jamais atteint sur les graines éprouvées) : le style par défaut, valide par construction.
    if (!profil) { profil = FORMES[id]; }
    if (PROFILS_GRAINE.size >= 128) { PROFILS_GRAINE.clear(); }
    PROFILS_GRAINE.set(cle, profil);
    return profil;
}

// Plus grand extent de l'étang de RÉFÉRENCE (la plaine, 109,8) : l'unité des échelles d'ambiance.
const EXTENT_REFERENCE = extents(RAYON_REFERENCE, FORME_DEFAUT).maxX;

/** Facteur d'échelle du plan d'eau d'après son plus grand extent (= f pour l'étang : rayon / 90). */
export function echelleExtent(rayon, forme) {
    if (cacheDe(forme).profil.id === FORME_DEFAUT) { return echelleDeRayon(rayon); }
    const e = extents(rayon, forme);
    return Math.max(e.maxX, e.maxZ) / EXTENT_REFERENCE;
}

/**
 * Facteurs d'échelle des décalages de relief (les fosses) sur chaque axe, par rapport à la plaine. L'étang est une
 * homothétie (f sur les deux axes) ; un autre profil étire le relief comme ses extents (x × maxX / maxX_ref, z × maxZ / maxZ_ref).
 */
export function echelleAxes(rayon, forme) {
    if (cacheDe(forme).profil.id === FORME_DEFAUT) { const f = echelleDeRayon(rayon); return { x: f, z: f }; }
    const e = extents(rayon, forme);
    return { x: e.maxX / EXTENT_REFERENCE, z: e.maxZ / EXTENT_REFERENCE };
}

function borner(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ---------------------------------------------------------------------------
// PROFONDEUR : un petit plan d'eau est moins profond qu'un grand lac, à forme de relief égale. La plaine
// (rayon 90) garde exactement sa profondeur (facteur 1) ; un étang de forêt de 12 unités est à 0,35 (≈ 1,4 m
// au plus profond), un canal à 0,5, une grande rivière à 1 (plafonnée : la ligne descend à 7 unités).
// ---------------------------------------------------------------------------
export function facteurProfondeur(rayon) {
    return borner(rayon / RAYON_REFERENCE, 0.35, 1);
}

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
function tableDe(cache, mode) {
    if (cache.tables[mode]) { return cache.tables[mode]; }
    const cumul = new Float64Array(TABLE + 1);
    const h = 1e-5;
    for (let i = 0; i < TABLE; i++) {
        const a = ((i + 0.5) / TABLE) * Math.PI * 2;
        const r = cache.facteur(a);
        let poids = r * r;
        if (mode === 'bord') {
            const dr = (cache.facteur(a + h) - cache.facteur(a - h)) / (2 * h);
            poids = Math.sqrt(r * r + dr * dr);
        }
        cumul[i + 1] = cumul[i] + poids;
    }
    cache.tables[mode] = cumul;
    return cumul;
}

// L'étang (d'origine ou tiré d'une graine) garde l'angle uniforme : presque rond, le tirage ne s'entasse pas.
function angleDepuisTable(u, forme, mode) {
    const cache = cacheDe(forme);
    if (cache.profil.id === FORME_DEFAUT) { return u * Math.PI * 2; }
    const cumul = tableDe(cache, mode);
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
 * même endroit relatif du plan d'eau (les positions suivent les axes, d'après l'allongement du profil courant).
 * Identité pour l'étang.
 */
export function angleSurForme(angle, forme) {
    const profil = cacheDe(forme).profil;
    if (profil.id === FORME_DEFAUT) { return angle; }
    return Math.atan2(Math.sin(angle) * profil.allongement, Math.cos(angle));
}

/** Réciproque de `angleSurForme` : l'angle d'un point du plan d'eau dans le repère de l'étang (identité pour l'étang). */
export function angleDepuisForme(angle, forme) {
    const profil = cacheDe(forme).profil;
    if (profil.id === FORME_DEFAUT) { return angle; }
    return Math.atan2(Math.sin(angle) / profil.allongement, Math.cos(angle));
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

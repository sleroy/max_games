// ---------------------------------------------------------------------------
// especes.js — DONNÉES des espèces, styles de combat, silhouettes et touches.
// Extraites de script.js pour alléger l'orchestrateur 3D.
// ---------------------------------------------------------------------------

// Tailles (cm) : min = juvénile pêchable, max = grand sujet (Wikipédia FR).
export const SPECIES = [
    { id: 'gardon', nom: 'Gardon', form: 'fusiforme', cm: [10, 42], k: 1.1, abondance: 12,
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.8], agressivite: [0.55, 0.85], style: 'nerveux', couleur: 0xbfcbd0, motif: 'argent' },
    { id: 'rotengle', nom: 'Rotengle', form: 'fusiforme', cm: [10, 50], k: 1.1, abondance: 8,
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.85], agressivite: [0.6, 0.9], style: 'nerveux', couleur: 0xb9c6c0, nageoires: 0xc0522a, motif: 'argent' },
    { id: 'ablette', nom: 'Ablette', form: 'petit', cm: [8, 25], k: 0.9, abondance: 9,
      profondeur: [-1.3, -0.7], combativite: [0.4, 0.65], agressivite: [0.6, 0.95], style: 'nerveux', couleur: 0xd2dcdf, motif: 'argent' },
    { id: 'goujon', nom: 'Goujon', form: 'petit', cm: [8, 20], k: 1.3, abondance: 7,
      profondeur: [-3.0, -2.0], combativite: [0.4, 0.7], agressivite: [0.5, 0.8], style: 'teigneux', couleur: 0xc2a878, motif: 'taches' },
    { id: 'breme', nom: 'Brème', form: 'plat', cm: [15, 75], k: 1.8, abondance: 6,
      profondeur: [-2.8, -1.8], combativite: [0.55, 0.9], agressivite: [0.5, 0.8], style: 'aspirateur',
      // Couleurs échantillonnées sur assets/references/breme.jpg (médianes PIL, flanc
      // et ventre au 80e centile pour compenser l'ombre de la photo).
      couleur: 0x64573f, dos: 0x2a2319, ventre: 0xc2b89d, tete: 0x645c42, nageoires: 0x6c6257, oeil: 0xd2bf7c,
      nageoiresMotif: 'doux',
      // Robe : écailles fines et irrégulières, estompées vers le ventre, fondu de la tête doux.
      motif: 'ecailles', ecailles: 74, contrasteEcailles: 0.7, irregulariteEcailles: 0.3, ecaillesVentre: 0.75,
      debutEcailles: 0.21, fonduTete: 0.45, profil: 'breme', anatomie: 'breme' },
    { id: 'tanche', nom: 'Tanche', form: 'profond', cm: [15, 70], k: 1.7, abondance: 5,
      profondeur: [-3.2, -2.2], combativite: [0.7, 1.05], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0x4f6b3c, oeil: 0xc0392b, motif: 'mouchetures' },
    { id: 'carpe', nom: 'Carpe', form: 'profond', cm: [20, 105], k: 2.3, abondance: 6,
      profondeur: [-3.2, -2.2], combativite: [0.9, 1.2], agressivite: [0.7, 1.05], style: 'lourd',
      // Couleurs : médianes PIL sur assets/references/carpe.jpg (eau trouble orangée : cuivre
      // délavé) recoupées avec une photo de mesure de carpe commune (olive-bronze, ventre crème,
      // 80e centile) ; le dos plus sombre, le flanc doré, les nageoires brun-gris un peu rouges.
      couleur: 0x96744a, dos: 0x3f351f, ventre: 0xd8cca8, tete: 0x6a5b3a, nageoires: 0x7a6a58, oeil: 0xc9a04a,
      barbillonsCouleur: 0xb88a62, nageoiresMotif: 'doux',
      // Robe : grandes écailles (≈ 36 le long de la ligne latérale), contraste modéré,
      // un peu irrégulières, estompées vers le ventre et la tête (pas de limite nette à l'ouïe).
      motif: 'ecailles', ecailles: 38, contrasteEcailles: 0.62, irregulariteEcailles: 0.25, ecaillesVentre: 0.55,
      debutEcailles: 0.2, fonduTete: 0.65, reflet: 0.14, rondeur: 0.05, profil: 'carpe', anatomie: 'carpe' },
    { id: 'carassin', nom: 'Carassin', form: 'profond', cm: [10, 50], k: 2.2, abondance: 5,
      profondeur: [-2.8, -1.9], combativite: [0.6, 0.9], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0xb08b3a, motif: 'ecailles' },
    { id: 'perche', nom: 'Perche', form: 'bossu', cm: [10, 45], k: 1.4, abondance: 7,
      profondeur: [-2.6, -1.5], combativite: [0.7, 1.05], agressivite: [0.9, 1.25], style: 'teigneux', couleur: 0x6f7a45, nageoires: 0xc0522a, motif: 'rayures' },
    { id: 'chevesne', nom: 'Chevesne', form: 'fusiforme', cm: [12, 70], k: 1.2, abondance: 5,
      profondeur: [-1.8, -0.8], combativite: [0.8, 1.15], agressivite: [0.9, 1.25], style: 'fonceur', couleur: 0x9aa39c, motif: 'argent' },
    { id: 'brochet', nom: 'Brochet', form: 'torpille', cm: [25, 130], k: 0.9, abondance: 3,
      profondeur: [-2.2, -1.0], combativite: [0.9, 1.25], agressivite: [1.25, 1.6], style: 'fonceur',
      // Couleurs de assets/references/brochet.jpg (sujet clair d'aquarium) ; ventre
      // relevé sous la tête (le reste du ventre est dans l'ombre sur la photo).
      couleur: 0x9e9478, dos: 0x7d7258, ventre: 0xcfc9b0, tete: 0x9a9474, teinteMotif: 0xd8d2b4, nageoires: 0x6b5236,
      nageoiresMotif: 'taches', oeil: 0x9a8a5c, motif: 'tachesClaires', profil: 'brochet', anatomie: 'brochet' },
    { id: 'sandre', nom: 'Sandre', form: 'torpille', cm: [20, 110], k: 0.8, abondance: 2,
      profondeur: [-3.4, -2.4], combativite: [0.85, 1.15], agressivite: [1.1, 1.45], style: 'glisseur', couleur: 0x8f9a83, motif: 'barres' },
    { id: 'black-bass', nom: 'Black-bass', form: 'bossu', cm: [15, 60], k: 1.6, abondance: 2,
      profondeur: [-2.4, -1.3], combativite: [0.9, 1.2], agressivite: [1.1, 1.5], style: 'fonceur', couleur: 0x556a3f, motif: 'bandeLaterale' },
    { id: 'truite', nom: 'Truite', form: 'fusiforme', cm: [15, 80], k: 1.2, abondance: 2,
      profondeur: [-2.2, -1.0], combativite: [0.8, 1.15], agressivite: [1.0, 1.35], style: 'fonceur', couleur: 0x7d6a4a, motif: 'pointsRouges' },
    { id: 'anguille', nom: 'Anguille', form: 'anguille', cm: [30, 130], k: 0.2, abondance: 2,
      profondeur: [-3.4, -2.6], combativite: [1.0, 1.4], agressivite: [1.1, 1.5], style: 'glisseur', couleur: 0x3f4a30, motif: 'aucun' },
    { id: 'silure', nom: 'Silure', form: 'barbu', cm: [60, 220], k: 1.0, abondance: 1,
      profondeur: [-3.4, -2.6], combativite: [1.1, 1.5], agressivite: [1.2, 1.55], style: 'lourd',
      // Couleurs de assets/references/silure.jpg : dos presque noir, flanc gris-olive
      // semé de taches pâles (80e centile du flanc), gorge claire.
      couleur: 0x50554d, dos: 0x2a2c29, ventre: 0x9c9d8e, tete: 0x3c423c, teinteMotif: 0x8f9587, nageoires: 0x34352f,
      oeil: 0x9b8f5a, barbillonsCouleur: 0xb9b69c, motif: 'marbrures', profil: 'silure', anatomie: 'silure' }
];

// Poids réaliste d'un poisson (kg) : formule du « facteur de condition » des
// pêcheurs — K × longueur(cm)³ / 100 000. K = `k` de l'espèce (2,3 pour une
// carpe bien nourrie, 0,2 pour une anguille très allongée). Source unique,
// utilisée par le jeu (carnet, prises) et par la page des tailles.
export function poidsKilos(espece, longueurCm) {
    return espece.k * Math.pow(longueurCm, 3) / 100000;
}

// ---------------------------------------------------------------------------
// COMPORTEMENTS : où et comment chaque espèce vit (d'après les fiches Wikipédia).
//   couche    : 'surface' | 'mi-eau' | 'fond'. Une espèce « fond » reste collée au
//               relief ; elle mord si l'hameçon est posé près du fond, où qu'il soit.
//   banc      : [min, max] poissons dans un groupe (1 = solitaire).
//   cohesion  : 0 → 1, attirance vers le groupe.
//   croisiere : vitesse de nage tranquille (unités/s ; 2 unités ≈ 1 m).
//   pointe    : vitesse maximale (fuite, attaque, chasse).
//   virage    : agilité (rad/s de changement de cap) ; un brochet vire peu.
//   domaine   : rayon de la zone de vie (unités) ; le poisson y reste presque tout le temps.
//   vue       : distance à laquelle il repère un appât (unités) par bonne visibilité.
//   humeur    : 'errant' (nage en continu), 'embuscade' (immobile puis bond),
//               'fouille' (lent, s'arrête souvent pour fouiller le fond).
//   nocturne  : voit et chasse mieux la nuit (vue × 1,4 la nuit au lieu de × 0,45).
//   substrats : fonds où l'espèce vit (§14.3) : 'sable' | 'gravier' | 'vase' | 'roche' | 'herbier'.
//               Sa zone de vie (homeX/homeZ) est installée sur l'un d'eux (substrats.js).
//   carnassier: (les mêmes que CARNASSIERS dans poissons.js) reste actif en eau froide (< 8 °C) : la touche s'allonge de 30 % au plus au lieu de 150 % (physique.js).
//   fosse     : vrai = refuge des grandes fosses (elle ne quitte pas les fosses).
// ---------------------------------------------------------------------------
export const COMPORTEMENTS = {
    gardon:   { couche: 'mi-eau',  banc: [4, 6], cohesion: 0.9, croisiere: 1.3, pointe: 3.6, virage: 1.6, domaine: 14, vue: 6.0, humeur: 'errant', substrats: ['sable', 'herbier'] },
    rotengle: { couche: 'surface', banc: [3, 5], cohesion: 0.8, croisiere: 1.2, pointe: 3.4, virage: 1.5, domaine: 12, vue: 6.0, humeur: 'errant', substrats: ['herbier'] },
    ablette:  { couche: 'surface', banc: [5, 8], cohesion: 1.0, croisiere: 2.2, pointe: 4.8, virage: 2.4, domaine: 18, vue: 5.5, humeur: 'errant', substrats: ['sable'] },
    goujon:   { couche: 'fond',    banc: [3, 5], cohesion: 0.8, croisiere: 0.8, pointe: 3.0, virage: 1.8, domaine: 8,  vue: 4.0, humeur: 'fouille', substrats: ['sable'] },
    breme:    { couche: 'fond',    banc: [3, 5], cohesion: 0.7, croisiere: 1.0, pointe: 3.0, virage: 1.0, domaine: 20, vue: 4.5, humeur: 'fouille', substrats: ['vase'] },
    tanche:   { couche: 'fond',    banc: [1, 1], cohesion: 0,   croisiere: 0.5, pointe: 2.6, virage: 0.9, domaine: 9,  vue: 3.5, humeur: 'fouille', nocturne: true, substrats: ['vase'] },
    carpe:    { couche: 'fond',    banc: [1, 3], cohesion: 0.5, croisiere: 0.9, pointe: 4.0, virage: 0.9, domaine: 16, vue: 4.5, humeur: 'fouille', substrats: ['vase'] },
    carassin: { couche: 'fond',    banc: [2, 4], cohesion: 0.6, croisiere: 0.8, pointe: 3.0, virage: 1.1, domaine: 10, vue: 4.0, humeur: 'fouille', substrats: ['vase'] },
    perche:   { couche: 'mi-eau',  banc: [3, 5], cohesion: 0.9, croisiere: 1.5, pointe: 5.0, virage: 1.7, domaine: 12, vue: 7.0, humeur: 'errant', carnassier: true, substrats: ['gravier', 'roche'] },
    chevesne: { couche: 'mi-eau',  banc: [2, 4], cohesion: 0.6, croisiere: 1.6, pointe: 5.0, virage: 1.4, domaine: 18, vue: 6.5, humeur: 'errant', substrats: ['gravier'] },
    brochet:  { couche: 'mi-eau',  banc: [1, 1], cohesion: 0,   croisiere: 0.4, pointe: 8.5, virage: 0.8, domaine: 7,  vue: 8.0, humeur: 'embuscade', carnassier: true, substrats: ['herbier'] },
    sandre:   { couche: 'fond',    banc: [1, 2], cohesion: 0.4, croisiere: 0.9, pointe: 6.5, virage: 1.0, domaine: 14, vue: 7.5, humeur: 'errant', carnassier: true, nocturne: true, substrats: ['roche'], fosse: true },
    'black-bass': { couche: 'mi-eau', banc: [1, 1], cohesion: 0, croisiere: 0.7, pointe: 6.0, virage: 1.3, domaine: 8, vue: 7.0, humeur: 'embuscade', carnassier: true, substrats: ['herbier'] },
    truite:   { couche: 'mi-eau',  banc: [1, 1], cohesion: 0,   croisiere: 1.4, pointe: 6.5, virage: 1.8, domaine: 11, vue: 7.0, humeur: 'errant', substrats: ['gravier'] },
    anguille: { couche: 'fond',    banc: [1, 1], cohesion: 0,   croisiere: 0.5, pointe: 3.2, virage: 1.4, domaine: 8,  vue: 2.5, humeur: 'fouille', nocturne: true, substrats: ['vase'], fosse: true },
    silure:   { couche: 'fond',    banc: [1, 1], cohesion: 0,   croisiere: 0.6, pointe: 4.5, virage: 0.6, domaine: 10, vue: 3.5, humeur: 'embuscade', nocturne: true, substrats: ['vase'], fosse: true }
};

export const STYLES_COMBAT = {
    nerveux: {
        nom: 'Nerveux',
        resume: 'tapote et sautille, puis vole l’esche d’un coup sec : bref mais électrique.',
        touchesVraies: ['coulee_franche', 'enfoncement_sec'],
        touchesFausses: ['tapote', 'danse', 'frisson', 'double_coup'],
        traction: 0.9, coups: 1.2, intervalle: 0.75, endurance: 4, derive: 0.9
    },
    teigneux: {
        nom: 'Teigneux',
        resume: 'se débat sur place par petits coups secs et répétés : ça ne dure pas, mais ça secoue.',
        touchesVraies: ['coulee_franche', 'file_sous_leau', 'couchage_franc'],
        touchesFausses: ['tapote', 'double_coup', 'hesitation', 'couchage_manque'],
        traction: 1.0, coups: 1.3, intervalle: 0.95, endurance: 7, derive: 0.6
    },
    aspirateur: {
        nom: 'Aspirateur',
        resume: 'soulève l’appât : le bouchon MONTE, puis il pèse de tout son poids vers le fond.',
        touchesVraies: ['ascenseur', 'remontee_seche'],
        touchesFausses: ['fausse_remontee', 'couchage_manque', 'frisson'],
        traction: 1.05, coups: 0.9, intervalle: 1.2, endurance: 9, derive: 0.4
    },
    fonceur: {
        nom: 'Fonceur',
        resume: 'part d’un coup et file DE CÔTÉ : tirades latérales violentes, mais il s’épuise vite.',
        touchesVraies: ['file_sous_leau', 'enfoncement_sec', 'remontee_seche'],
        touchesFausses: ['double_coup', 'derive', 'frisson'],
        traction: 1.15, coups: 1.4, intervalle: 0.9, endurance: 6, derive: 1.4
    },
    glisseur: {
        nom: 'Glisseur',
        resume: 's’enroule et tire par à-coups irréguliers : imprévisible, et il fatigue lentement.',
        touchesVraies: ['coulee_franche', 'file_sous_leau'],
        touchesFausses: ['derive', 'tourne_sur_place', 'hesitation'],
        traction: 1.2, coups: 1.1, intervalle: 1.05, endurance: 12, derive: 0.7
    },
    lourd: {
        nom: 'Lourd',
        resume: 'une ancre : traction énorme et régulière, peu de tirades… et il ne se fatigue presque pas.',
        touchesVraies: ['coulee_lente', 'ascenseur'],
        touchesFausses: ['enfonce_partiel', 'hesitation', 'couchage_manque'],
        traction: 1.35, coups: 0.8, intervalle: 1.35, endurance: 14, derive: 0.3
    }
};

export const STYLE_DEFAUT = {
    nom: 'Ordinaire', resume: 'un poisson ordinaire.',
    touchesVraies: [], touchesFausses: [],
    traction: 1, coups: 1, intervalle: 1, endurance: 7, derive: 0.5
};

// ---------------------------------------------------------------------------
// SILHOUETTES du modèle 3D (modelePoisson.js).
//   longueurRef : longueur du modèle, museau → bout de la caudale (unités du
//                 modèle) : echellePourTaille() en déduit l'échelle d'une taille en cm.
//   bodyX/Y/Z   : proportions de l'ancien modèle, gardées pour la mini-silhouette
//                 des fiches (fiches.js) ; bodyZ règle aussi l'amplitude de nage.
//   profil      : nom d'une table de PROFILS ; anatomie : nom d'une table d'ANATOMIES.
// Une espèce peut porter ses propres `profil` / `anatomie` (lus en priorité ;
// l'anatomie de l'espèce complète celle de sa silhouette).
// ---------------------------------------------------------------------------
export const FORMES = {
    fusiforme: { bodyX: 1.5, bodyY: 0.78, bodyZ: 0.58, longueurRef: 2.30, profil: 'fusiforme', anatomie: 'fusiforme' },
    profond: { bodyX: 1.6, bodyY: 1.02, bodyZ: 0.72, longueurRef: 2.42, profil: 'profond', anatomie: 'profond' },
    plat: { bodyX: 1.55, bodyY: 1.3, bodyZ: 0.34, longueurRef: 2.36, profil: 'plat', anatomie: 'plat' },
    torpille: { bodyX: 2.7, bodyY: 0.62, bodyZ: 0.5, longueurRef: 3.74, profil: 'torpille', anatomie: 'torpille' },
    bossu: { bodyX: 1.45, bodyY: 0.95, bodyZ: 0.62, longueurRef: 2.24, profil: 'bossu', anatomie: 'bossu' },
    anguille: { bodyX: 3.4, bodyY: 0.3, bodyZ: 0.3, longueurRef: 4.58, profil: 'anguille', anatomie: 'anguille' },
    barbu: { bodyX: 2.4, bodyY: 0.85, bodyZ: 0.78, longueurRef: 3.38, profil: 'barbu', anatomie: 'barbu' },
    petit: { bodyX: 1.35, bodyY: 0.72, bodyZ: 0.52, longueurRef: 2.0, profil: 'petit', anatomie: 'petit' }
};

// PROFILS du corps : points de contrôle { t, h, w, y, n, nb } en FRACTIONS de la
// longueur standard LS (museau → base de la queue) :
//   t  : 0 museau → 1 pédoncule ;  h / w : demi-hauteur / demi-largeur ;
//   y  : décalage du squelette (milieu de la section, + = vers le dos) ;
//   n / nb : exposant de la superellipse du haut / du bas (2 = ellipse).
// `breme`, `brochet` et `silure` sont MESURÉS sur les photos de
// assets/references/ (contour PIL, voir docs/modeles-poissons.md) ; les autres
// sont des profils types de leur silhouette, à affiner espèce par espèce.
export const PROFILS = {
    fusiforme: [
        { t: 0, h: 0.03, w: 0.022, y: -0.008 }, { t: 0.06, h: 0.07, w: 0.042, y: 0 },
        { t: 0.14, h: 0.105, w: 0.058, y: 0.006 }, { t: 0.25, h: 0.13, w: 0.066, y: 0.01 },
        { t: 0.38, h: 0.14, w: 0.068, y: 0.012 }, { t: 0.52, h: 0.132, w: 0.062, y: 0.01 },
        { t: 0.68, h: 0.105, w: 0.048, y: 0.006 }, { t: 0.82, h: 0.072, w: 0.032, y: 0.003 },
        { t: 0.93, h: 0.052, w: 0.021, y: 0.001 }, { t: 1, h: 0.048, w: 0.017, y: 0 }],
    profond: [
        { t: 0, h: 0.035, w: 0.026, y: -0.012 }, { t: 0.06, h: 0.085, w: 0.055, y: 0 },
        { t: 0.14, h: 0.135, w: 0.08, y: 0.012 }, { t: 0.27, h: 0.17, w: 0.098, y: 0.022 },
        { t: 0.42, h: 0.178, w: 0.1, y: 0.024 }, { t: 0.56, h: 0.165, w: 0.09, y: 0.02 },
        { t: 0.72, h: 0.128, w: 0.068, y: 0.01 }, { t: 0.86, h: 0.088, w: 0.042, y: 0.004 },
        { t: 1, h: 0.068, w: 0.028, y: 0 }],
    plat: [
        { t: 0, h: 0.02, w: 0.012, y: -0.015 }, { t: 0.06, h: 0.065, w: 0.032, y: -0.02 },
        { t: 0.15, h: 0.11, w: 0.046, y: -0.025 }, { t: 0.3, h: 0.17, w: 0.058, y: -0.025 },
        { t: 0.45, h: 0.19, w: 0.06, y: -0.03 }, { t: 0.6, h: 0.175, w: 0.052, y: -0.035 },
        { t: 0.78, h: 0.11, w: 0.034, y: -0.035 }, { t: 0.92, h: 0.062, w: 0.02, y: -0.025 },
        { t: 1, h: 0.045, w: 0.016, y: -0.013 }],
    torpille: [   // type sandre : tête pointue, corps rond et long
        { t: 0, h: 0.02, w: 0.016, y: -0.006 }, { t: 0.06, h: 0.048, w: 0.036, y: 0 },
        { t: 0.16, h: 0.08, w: 0.058, y: 0.006 }, { t: 0.3, h: 0.1, w: 0.068, y: 0.01 },
        { t: 0.45, h: 0.104, w: 0.068, y: 0.01 }, { t: 0.62, h: 0.092, w: 0.058, y: 0.006 },
        { t: 0.8, h: 0.065, w: 0.038, y: 0.002 }, { t: 1, h: 0.04, w: 0.02, y: 0 }],
    bossu: [      // type perche : bosse derrière la tête
        { t: 0, h: 0.03, w: 0.02, y: -0.012 }, { t: 0.06, h: 0.075, w: 0.046, y: 0.004 },
        { t: 0.15, h: 0.125, w: 0.07, y: 0.026 }, { t: 0.3, h: 0.162, w: 0.085, y: 0.036 },
        { t: 0.45, h: 0.158, w: 0.08, y: 0.03 }, { t: 0.6, h: 0.13, w: 0.066, y: 0.016 },
        { t: 0.76, h: 0.09, w: 0.045, y: 0.006 }, { t: 0.9, h: 0.062, w: 0.028, y: 0.002 },
        { t: 1, h: 0.055, w: 0.022, y: 0 }],
    anguille: [
        { t: 0, h: 0.012, w: 0.01, y: -0.002 }, { t: 0.03, h: 0.022, w: 0.02, y: 0 },
        { t: 0.1, h: 0.032, w: 0.028, y: 0.002 }, { t: 0.3, h: 0.04, w: 0.034, y: 0.002 },
        { t: 0.55, h: 0.04, w: 0.03, y: 0.001 }, { t: 0.8, h: 0.034, w: 0.018, y: 0 },
        { t: 1, h: 0.016, w: 0.007, y: 0 }],
    barbu: [
        { t: 0, h: 0.03, w: 0.04, y: -0.008, nb: 3 }, { t: 0.08, h: 0.06, w: 0.075, y: 0, nb: 3 },
        { t: 0.25, h: 0.085, w: 0.08, y: 0.004 }, { t: 0.45, h: 0.085, w: 0.06, y: 0 },
        { t: 0.7, h: 0.06, w: 0.035, y: 0 }, { t: 1, h: 0.03, w: 0.012, y: 0 }],
    petit: [
        { t: 0, h: 0.03, w: 0.024, y: -0.006 }, { t: 0.07, h: 0.065, w: 0.045, y: 0 },
        { t: 0.18, h: 0.098, w: 0.06, y: 0.004 }, { t: 0.36, h: 0.112, w: 0.064, y: 0.006 },
        { t: 0.55, h: 0.1, w: 0.056, y: 0.004 }, { t: 0.75, h: 0.072, w: 0.036, y: 0.002 },
        { t: 1, h: 0.044, w: 0.016, y: 0 }],

    // --- Mesurés ---------------------------------------------------------------
    // Brème : breme.jpg, LS = 720 px (museau x 26 → pédoncule x 745), contour PIL
    // (fond béton : saturation > 9 ou luminance < 85). Hauteur max 0,39 LS à t = 0,5 ;
    // ventre très bas (y négatif), pédoncule fin (0,086 LS). Largeur : corps très
    // comprimé (w ≈ 0,31 h), quille ventrale (nb < 2).
    breme: [
        { t: 0, h: 0.012, w: 0.01, y: -0.018 }, { t: 0.05, h: 0.059, w: 0.03, y: -0.026 },
        { t: 0.1, h: 0.079, w: 0.039, y: -0.027 }, { t: 0.15, h: 0.1, w: 0.045, y: -0.031 },
        { t: 0.2, h: 0.128, w: 0.05, y: -0.03 }, { t: 0.25, h: 0.152, w: 0.054, y: -0.027 },
        { t: 0.3, h: 0.17, w: 0.057, y: -0.025, n: 1.8, nb: 1.7 },
        { t: 0.4, h: 0.187, w: 0.06, y: -0.025, n: 1.8, nb: 1.7 },
        { t: 0.5, h: 0.196, w: 0.059, y: -0.034, n: 1.8, nb: 1.7 },
        { t: 0.6, h: 0.18, w: 0.052, y: -0.035, n: 1.8, nb: 1.8 }, { t: 0.7, h: 0.145, w: 0.042, y: -0.035 },
        { t: 0.8, h: 0.104, w: 0.031, y: -0.042 }, { t: 0.9, h: 0.069, w: 0.021, y: -0.032 },
        { t: 1, h: 0.043, w: 0.015, y: -0.013 }],
    // Carpe : photo de mesure temporaire (carpe commune posée sur l'herbe, vue de profil, tête à
    // droite ; Wikimedia Commons, non versionnée), LS = 952 px (museau 1180,574 → pédoncule
    // 236,452). Masque : herbe écartée par saturation/teinte ; les nageoires repliées (dorsale,
    // anale) sont retranchées du contour. Hauteur max 0,18 LS à t = 0,5 ; tête longue (ouïe t 0,215) ;
    // pédoncule épais (0,06 LS) ; corps épais : largeur ≈ 0,54 × hauteur.
    carpe: [
        { t: 0, h: 0.03, w: 0.026, y: -0.004 }, { t: 0.05, h: 0.058, w: 0.042, y: 0.004 },
        { t: 0.1, h: 0.082, w: 0.054, y: 0.017 }, { t: 0.15, h: 0.099, w: 0.064, y: 0.021 },
        { t: 0.2, h: 0.128, w: 0.077, y: 0.025 }, { t: 0.25, h: 0.146, w: 0.086, y: 0.03 },
        { t: 0.3, h: 0.16, w: 0.092, y: 0.026 }, { t: 0.35, h: 0.166, w: 0.095, y: 0.021 },
        { t: 0.4, h: 0.176, w: 0.097, y: 0.021 }, { t: 0.45, h: 0.177, w: 0.097, y: 0.022 },
        { t: 0.5, h: 0.18, w: 0.097, y: 0.023 }, { t: 0.55, h: 0.178, w: 0.095, y: 0.017 },
        { t: 0.6, h: 0.168, w: 0.088, y: 0.008 }, { t: 0.65, h: 0.153, w: 0.08, y: 0.004 },
        { t: 0.7, h: 0.14, w: 0.07, y: 0.001 }, { t: 0.75, h: 0.13, w: 0.06, y: -0.002 },
        { t: 0.8, h: 0.112, w: 0.05, y: -0.005 }, { t: 0.85, h: 0.098, w: 0.043, y: -0.004 },
        { t: 0.9, h: 0.082, w: 0.036, y: 0 }, { t: 0.95, h: 0.068, w: 0.031, y: 0.004 },
        { t: 1, h: 0.06, w: 0.027, y: 0.004 }],
    // Brochet : brochet.jpg (poisson vu de profil, tête à droite), LS = 797 px
    // (museau 885,512 → pédoncule 100,375), contour relevé sur la photo quadrillée
    // puis superposé (gravier trop bariolé pour un seuil automatique). Corps
    // presque cylindrique (h max 0,0875 LS à t = 0,55), longue tête plate en bec
    // de canard (w > h jusqu'à t = 0,12).
    brochet: [
        { t: 0, h: 0.007, w: 0.012, y: 0.002 }, { t: 0.05, h: 0.031, w: 0.036, y: 0.002, n: 2.4, nb: 2.6 },
        { t: 0.1, h: 0.044, w: 0.047, y: 0.002, n: 2.3, nb: 2.4 }, { t: 0.15, h: 0.053, w: 0.052, y: 0.002 },
        { t: 0.2, h: 0.062, w: 0.055, y: 0.002 }, { t: 0.3, h: 0.076, w: 0.06, y: 0.004 },
        { t: 0.4, h: 0.083, w: 0.062, y: 0.004 }, { t: 0.5, h: 0.087, w: 0.06, y: 0.005 },
        { t: 0.6, h: 0.087, w: 0.056, y: 0.002 }, { t: 0.7, h: 0.083, w: 0.048, y: 0 },
        { t: 0.8, h: 0.067, w: 0.036, y: 0.004 }, { t: 0.9, h: 0.045, w: 0.022, y: 0.008 },
        { t: 1, h: 0.025, w: 0.013, y: 0 }],
    // Silure : silure.jpg, LS = 691 px (museau 722,440 → pédoncule 150,52). Vue de
    // trois quarts dessus : la hauteur mesurée mêle hauteur et largeur, et la
    // perspective grossit la tête. Retenu : tête large et plate (w > h, ventre
    // plat nb = 3), corps qui s'amincit régulièrement, queue comprimée.
    silure: [
        { t: 0, h: 0.022, w: 0.034, y: -0.004, n: 2.4, nb: 3.2 }, { t: 0.05, h: 0.045, w: 0.068, y: 0, n: 2.4, nb: 3.2 },
        { t: 0.1, h: 0.062, w: 0.082, y: 0.004, n: 2.2, nb: 3 }, { t: 0.15, h: 0.072, w: 0.086, y: 0.006, n: 2.1, nb: 2.6 },
        { t: 0.2, h: 0.078, w: 0.084, y: 0.006 }, { t: 0.3, h: 0.088, w: 0.074, y: 0.004 },
        { t: 0.4, h: 0.09, w: 0.062, y: 0.002 }, { t: 0.5, h: 0.083, w: 0.05, y: 0 },
        { t: 0.6, h: 0.072, w: 0.04, y: 0 }, { t: 0.7, h: 0.062, w: 0.03, y: 0 },
        { t: 0.8, h: 0.052, w: 0.022, y: 0 }, { t: 0.9, h: 0.042, w: 0.016, y: 0 },
        { t: 1, h: 0.032, w: 0.011, y: 0 }]
};

// ANATOMIES : position des nageoires et des détails, en fractions de LS.
//   queue     : { type: fourche | breme | echancree | arrondie | silure | fine,
//                 longueur (fraction de LS au-delà du pédoncule), ecart (demi-envergure) }
//   dorsale, dorsale2, adipeuse, anale : { type, t0, t1 (base), hauteur, recul? }
//                 types : souple, haute, longue, epineuse, reculee, petite, continue,
//                 analeLongue, analeBreme, dorsaleBreme, adipeuse (voir NAGEOIRES dans modelePoisson.js)
//   pectorale : { t, y, longueur, pente (rad, + = vers le bas), forme: pointue | ronde | ovale,
//                 eventail? (ouverture des rayons en rad, défaut 0,55) }
//   pelvienne : { t, longueur, pente }
//   oeil      : { t, y, r } ; bouche : { t (coin), y0 (museau), y1 (coin) }
//   opercule  : t du bord de l'ouïe ; barbillons : [{ t, y, longueur, chute, ecart }]
export const ANATOMIES = {
    fusiforme: {
        queue: { type: 'fourche', longueur: 0.24, ecart: 0.15 },
        dorsale: { type: 'souple', t0: 0.42, t1: 0.57, hauteur: 0.14 },
        anale: { type: 'souple', t0: 0.68, t1: 0.82, hauteur: 0.09 },
        pectorale: { t: 0.25, y: -0.075, longueur: 0.15, pente: 0.45 },
        pelvienne: { t: 0.47, longueur: 0.1, pente: 0.3 },
        oeil: { t: 0.085, y: 0.022, r: 0.03 }, bouche: { t: 0.045, y0: 0, y1: -0.012 }, opercule: 0.23
    },
    profond: {
        queue: { type: 'fourche', longueur: 0.25, ecart: 0.16 },
        dorsale: { type: 'longue', t0: 0.38, t1: 0.72, hauteur: 0.12 },
        anale: { type: 'souple', t0: 0.74, t1: 0.86, hauteur: 0.1 },
        pectorale: { t: 0.27, y: -0.11, longueur: 0.15, pente: 0.4, forme: 'ronde' },
        pelvienne: { t: 0.5, longueur: 0.11, pente: 0.3 },
        oeil: { t: 0.09, y: 0.03, r: 0.026 }, bouche: { t: 0.04, y0: -0.01, y1: -0.025 }, opercule: 0.25
    },
    plat: {
        queue: { type: 'breme', longueur: 0.21, ecart: 0.135 },
        dorsale: { type: 'haute', t0: 0.56, t1: 0.74, hauteur: 0.16 },
        anale: { type: 'analeBreme', t0: 0.65, t1: 0.93, hauteur: 0.14 },
        pectorale: { t: 0.24, y: -0.105, longueur: 0.18, pente: 0.15 },
        pelvienne: { t: 0.46, longueur: 0.12, pente: 0.12 },
        oeil: { t: 0.061, y: -0.007, r: 0.016 }, bouche: { t: 0.034, y0: -0.02, y1: -0.038 }, opercule: 0.23
    },
    torpille: {   // type sandre : deux dorsales (épineuse puis souple)
        queue: { type: 'fourche', longueur: 0.2, ecart: 0.11 },
        dorsale: { type: 'epineuse', t0: 0.33, t1: 0.53, hauteur: 0.11 },
        dorsale2: { type: 'souple', t0: 0.57, t1: 0.76, hauteur: 0.09 },
        anale: { type: 'souple', t0: 0.68, t1: 0.8, hauteur: 0.07 },
        pectorale: { t: 0.27, y: -0.05, longueur: 0.12, pente: 0.45 },
        pelvienne: { t: 0.32, longueur: 0.1, pente: 0.3 },
        oeil: { t: 0.1, y: 0.03, r: 0.022 }, bouche: { t: 0.09, y0: -0.004, y1: -0.02 }, opercule: 0.27
    },
    bossu: {      // type perche
        queue: { type: 'echancree', longueur: 0.22, ecart: 0.13 },
        dorsale: { type: 'epineuse', t0: 0.32, t1: 0.55, hauteur: 0.15 },
        dorsale2: { type: 'souple', t0: 0.58, t1: 0.75, hauteur: 0.11 },
        anale: { type: 'souple', t0: 0.68, t1: 0.8, hauteur: 0.1 },
        pectorale: { t: 0.29, y: -0.05, longueur: 0.14, pente: 0.4 },
        pelvienne: { t: 0.32, longueur: 0.12, pente: 0.35 },
        oeil: { t: 0.1, y: 0.035, r: 0.03 }, bouche: { t: 0.08, y0: -0.004, y1: -0.02 }, opercule: 0.28
    },
    anguille: {
        queue: { type: 'fine', longueur: 0.04, ecart: 0.035 },
        dorsale: { type: 'continue', t0: 0.32, t1: 0.995, hauteur: 0.035, recul: 0.05 },
        anale: { type: 'continue', t0: 0.45, t1: 0.995, hauteur: 0.032, recul: 0.05 },
        pectorale: { t: 0.13, y: -0.004, longueur: 0.035, pente: 0.2, forme: 'ronde' },
        oeil: { t: 0.035, y: 0.01, r: 0.007 }, bouche: { t: 0.03, y0: -0.002, y1: -0.008 }, opercule: 0.12
    },
    barbu: {
        queue: { type: 'silure', longueur: 0.1, ecart: 0.06 },
        dorsale: { type: 'petite', t0: 0.27, t1: 0.31, hauteur: 0.05 },
        anale: { type: 'analeLongue', t0: 0.42, t1: 0.985, hauteur: 0.045 },
        pectorale: { t: 0.2, y: -0.045, longueur: 0.12, pente: 0.5, forme: 'ronde' },
        pelvienne: { t: 0.42, longueur: 0.06, pente: 0.3, forme: 'ronde' },
        oeil: { t: 0.09, y: 0.035, r: 0.007 }, bouche: { t: 0.09, y0: -0.004, y1: -0.02, epaisseur: 0.008 },
        opercule: 0.19, contrasteOpercule: 0.12,
        barbillons: [{ t: 0.03, y: 0.016, longueur: 0.28, chute: 0.5, ecart: 0.45 },
            { t: 0.045, y: -0.03, longueur: 0.07, chute: 1.2, ecart: 0.3 },
            { t: 0.065, y: -0.034, longueur: 0.06, chute: 1.2, ecart: 0.35 }]
    },
    petit: {
        queue: { type: 'fourche', longueur: 0.23, ecart: 0.13 },
        dorsale: { type: 'souple', t0: 0.4, t1: 0.53, hauteur: 0.13 },
        anale: { type: 'souple', t0: 0.66, t1: 0.8, hauteur: 0.08 },
        pectorale: { t: 0.25, y: -0.06, longueur: 0.13, pente: 0.45 },
        pelvienne: { t: 0.47, longueur: 0.09, pente: 0.3 },
        oeil: { t: 0.09, y: 0.02, r: 0.034 }, bouche: { t: 0.04, y0: 0.004, y1: -0.008 }, opercule: 0.23
    },

    // --- Mesurés (mêmes photos que les PROFILS) ------------------------------------
    // Brème : œil t 0,061 (r 0,019), bouche infère petite, ouïe t 0,22 ; dorsale t 0,56 → 0,74
    // (0,13 LS, sommet arrondi) ; anale longue t 0,65 → 0,93 (lobe avant 0,10 LS) ; pectorale
    // t 0,24 basse (0,15 LS, ovale) ; pelviennes t 0,46 ; caudale 0,21 LS, échancrure
    // modérée, lobes arrondis, lobe bas plus long.
    breme: {
        queue: { type: 'breme', longueur: 0.206, ecart: 0.133 },
        dorsale: { type: 'dorsaleBreme', t0: 0.564, t1: 0.742, hauteur: 0.125, recul: 0.36 },
        anale: { type: 'analeBreme', t0: 0.654, t1: 0.932, hauteur: 0.1, recul: 0.55 },
        pectorale: { t: 0.24, y: -0.105, longueur: 0.15, pente: 0.15, forme: 'ovale', eventail: 0.95 },
        pelvienne: { t: 0.457, longueur: 0.11, pente: 0.12, forme: 'ronde' },
        oeil: { t: 0.061, y: -0.007, r: 0.019 }, bouche: { t: 0.03, y0: -0.02, y1: -0.034, epaisseur: 0.0045 },
        opercule: 0.222, ligneCourbe: 1.2, contrasteOpercule: 0.1
    },
    // Brochet : œil t 0,18 (r 0,015), haut sur la tête ; gueule jusqu'à t 0,136 ;
    // ouïe t 0,354 ; pectorale basse t 0,335 ; pelviennes t 0,613 ; dorsale et anale
    // tout à l'arrière (t 0,82 → 0,94 et 0,80 → 0,91) ; caudale fourchue.
    brochet: {
        queue: { type: 'fourche', longueur: 0.13, ecart: 0.088 },
        dorsale: { type: 'reculee', t0: 0.821, t1: 0.944, hauteur: 0.078 },
        dorsale2: null,
        anale: { type: 'reculee', t0: 0.798, t1: 0.912, hauteur: 0.068 },
        pectorale: { t: 0.335, y: -0.066, longueur: 0.1, pente: 0.35, forme: 'ronde' },
        pelvienne: { t: 0.613, longueur: 0.085, pente: 0.35, forme: 'ronde' },
        oeil: { t: 0.18, y: 0.016, r: 0.015 }, bouche: { t: 0.136, y0: -0.002, y1: -0.022 },
        opercule: 0.354, ligneCourbe: 0.2, contrasteOpercule: 0.3
    },
    // Silure : œil minuscule t 0,09 ; gueule large ; 2 grands barbillons maxillaires
    // (0,28 LS) + 4 courts sous le menton ; petite dorsale t 0,27 ; anale de t 0,42
    // jusqu'à la queue ; caudale petite et arrondie.
    silure: {
        queue: { type: 'silure', longueur: 0.1, ecart: 0.062 }
    },
    // Carpe : œil t 0,073 (r 0,016), haut sur la tête ; bouche petite, protractile ; ouïe t 0,215 ;
    // pectorale basse t 0,233 (0,16 LS) ; pelviennes t 0,477 ; dorsale LONGUE t 0,48 → 0,84
    // (0,072 LS devant, bord haut concave, premier rayon épineux, couchée vers l'arrière) ;
    // anale courte et haute t 0,78 → 0,88 ; caudale 0,2 LS, lobes arrondis. Deux paires de
    // barbillons (une courte au museau, une plus longue au coin de la bouche).
    carpe: {
        queue: { type: 'carpe', longueur: 0.2, ecart: 0.14 },
        dorsale: { type: 'dorsaleCarpe', t0: 0.48, t1: 0.84, hauteur: 0.072, recul: 0.8 },
        anale: { type: 'haute', t0: 0.78, t1: 0.88, hauteur: 0.078, recul: 0.7 },
        pectorale: { t: 0.233, y: -0.055, longueur: 0.135, pente: 0.35, forme: 'ovale', eventail: 0.75 },
        pelvienne: { t: 0.477, longueur: 0.12, pente: 0.3, forme: 'ronde' },
        oeil: { t: 0.073, y: 0.055, r: 0.018 }, bouche: { t: 0.038, y0: -0.012, y1: -0.036, epaisseur: 0.007 },
        opercule: 0.215, ligneCourbe: 0.8, contrasteOpercule: 0.05,
        barbillons: [{ t: 0.014, y: -0.022, longueur: 0.032, chute: 0.9, ecart: 0.3, rayon: 0.0032 },
            { t: 0.036, y: -0.034, longueur: 0.058, chute: 1.1, ecart: 0.35, rayon: 0.0038 }]
    },
    tanche: {
        queue: { type: 'echancree', longueur: 0.22, ecart: 0.13 },
        dorsale: { type: 'souple', t0: 0.42, t1: 0.58, hauteur: 0.12 },
        barbillons: [{ t: 0.03, y: -0.02, longueur: 0.03, chute: 0.8, ecart: 0.25, rayon: 0.002 }]
    },
    goujon: {
        barbillons: [{ t: 0.03, y: -0.02, longueur: 0.05, chute: 0.8, ecart: 0.3, rayon: 0.002 }]
    },
    truite: {
        queue: { type: 'echancree', longueur: 0.2, ecart: 0.13 },
        dorsale: { type: 'souple', t0: 0.38, t1: 0.52, hauteur: 0.13 },
        adipeuse: { type: 'adipeuse', t0: 0.79, t1: 0.86, hauteur: 0.04 },
        bouche: { t: 0.1, y0: -0.004, y1: -0.02 }
    }
};

export const FORMES_PAR_TYPE = ['profond', 'bossu', 'torpille', 'plat'];

export const TOUCHES = [
    // ---------- FAUSSES TOUCHES : le bouchon bouge, mais ce n'est PAS le moment
    { id: 'frisson', nom: 'Frémissement', forme: 'frisson', coups: 4, a: 0.21, duree: 1.4,
      vrai: false, famille: 'fausse', qui: 'tous',
      desc: 'Le bouchon vibre sur place sans s’enfoncer : un poisson a frôlé la ligne.' },
    { id: 'tapote', nom: 'Tapotement', forme: 'pulse', coups: 3, a: 0.24, rot: 0.3, duree: 1.5,
      vrai: false, famille: 'fausse', qui: 'petit',
      desc: 'Deux ou trois petits coups secs vers le bas : il goûte l’esche et la recrache.' },
    { id: 'danse', nom: 'Danse du bouchon', forme: 'pulse', coups: 4, a: 0.21, rot: 0.28, duree: 1.8,
      vrai: false, famille: 'fausse', qui: 'petit',
      desc: 'Il sautille vite et sans s’enfoncer : les ablettes attaquent l’esche.' },
    { id: 'enfonce_partiel', nom: 'Enfoncement partiel', forme: 'sinus', a: 0.35, duree: 1.7,
      vrai: false, famille: 'enfoncement', qui: 'tous',
      desc: 'Il plonge à moitié, puis remonte tout seul : le poisson a lâché l’esche.' },
    { id: 'fausse_remontee', nom: 'Fausse remontée', forme: 'montee_retour', a: 0.28, duree: 1.6,
      vrai: false, famille: 'remontee', qui: 'tous',
      desc: 'Il monte un peu puis se repose : l’appât a été soulevé puis relâché.' },
    { id: 'couchage_manque', nom: 'Couchage manqué', forme: 'couchage_retour', rot: 1.2, a: 0.1, duree: 1.6,
      vrai: false, famille: 'couchage', qui: 'tous',
      desc: 'Il s’allonge un instant sur l’eau puis se redresse : la ligne s’est détendue.' },
    { id: 'derive', nom: 'Dérive', forme: 'derive', a: 0.16, derive: 1.1, rot: 0.18, duree: 2.2,
      vrai: false, famille: 'derive', qui: 'tous',
      desc: 'Il s’en va doucement de côté sans s’enfoncer : le courant pousse la ligne.' },
    { id: 'double_coup', nom: 'Deux coups', forme: 'double', a: 0.32, rot: 0.2, duree: 1.9,
      vrai: false, famille: 'enfoncement', qui: 'gros',
      desc: 'Il plonge deux fois à la même profondeur : un poisson méfiant qui essaie l’esche.' },
    { id: 'hesitation', nom: 'Touche hésitante', forme: 'hesitation', a: 0.35, rot: 0.18, duree: 2.1,
      vrai: false, famille: 'enfoncement', qui: 'gros',
      desc: 'Il descend par petits à-coups, hésite, puis remonte : le poisson n’est pas décidé.' },
    { id: 'tourne_sur_place', nom: 'Il tourne sur place', forme: 'tourner', a: 0.16, derive: 0.85, rot: 0.2, duree: 2.0,
      vrai: false, famille: 'derive', qui: 'gros',
      desc: 'Le bouchon décrit un petit cercle : un poisson tourne autour de l’esche.' },
    // ---------- VRAIES TOUCHES : c'est MAINTENANT qu'il faut ferrer
    { id: 'coulee_franche', nom: 'Coulée franche', forme: 'descente', a: 0.77, rot: 0.3, duree: 0.45,
      vrai: true, famille: 'enfoncement', qui: 'tous',
      desc: 'Il s’enfonce d’un coup et RESTE sous l’eau : la touche classique, à ferrer !' },
    { id: 'ascenseur', nom: 'Ascenseur (remontée)', forme: 'montee', a: 0.63, duree: 0.52,
      vrai: true, famille: 'remontee', qui: 'tous',
      desc: 'Il MONTE franchement (brème, tanche) : le poisson a soulevé les plombs. Ferrer !' },
    { id: 'coulee_lente', nom: 'Coulée lente et lourde', forme: 'descente_lente', a: 0.77, rot: 0.15, duree: 0.8,
      vrai: true, famille: 'enfoncement', qui: 'gros',
      desc: 'Il descend lentement, sans s’arrêter : le gros poisson part avec l’esche.' },
    { id: 'file_sous_leau', nom: 'Il file sous l’eau', forme: 'file', a: 0.7, derive: 0.9, rot: 0.5, duree: 0.52,
      vrai: true, famille: 'derive', qui: 'vif',
      desc: 'Il coule ET part de côté (perche, brochet) : le poisson détale. Ferrer vite !' },
    { id: 'couchage_franc', nom: 'Il se couche franchement', forme: 'couchage', rot: 1.35, a: 0.12, duree: 0.52,
      vrai: true, famille: 'couchage', qui: 'tous',
      desc: 'Il s’allonge complètement sur le côté : le poisson part au ras de l’eau. Ferrer !' },
    { id: 'enfoncement_sec', nom: 'Enfoncement sec', forme: 'descente', a: 0.88, rot: 0.12, duree: 0.45,
      vrai: true, famille: 'enfoncement', qui: 'vif',
      desc: 'Il disparaît d’un coup, très vite : un poisson vif a emporté l’esche.' },
    { id: 'remontee_seche', nom: 'Remontée sèche', forme: 'montee', a: 0.7, rot: 0.12, duree: 0.4,
      vrai: true, famille: 'remontee', qui: 'vif',
      desc: 'Il ressort d’un coup, très haut : les plombs ont été soulevés d’un seul geste.' },
    { id: 'a_la_volee', nom: 'Touche à la volée', forme: 'descente', a: 0.7, duree: 0.4,
      vrai: true, famille: 'enfoncement', qui: 'tous', explicite: true,
      desc: 'L’esche est prise PENDANT la descente : le bouchon ne se pose même pas. Ferrer tout de suite !' }
];

export const TOUCHES_PAR_ID = {};
TOUCHES.forEach(function (touche) { TOUCHES_PAR_ID[touche.id] = touche; });

// ---------------------------------------------------------------------------
// SCIONS (mode quiver) : le bout de la canne remplace le bouchon. Chaque scion a
// sa sensibilité et ses capacités (mêmes champs que les bouchons).
//   sonnette : une petite clochette tinte à chaque touche (idéal de nuit).
// ---------------------------------------------------------------------------
export const SCIONS_DE_DEPART = ['souple', 'moyen', 'rigide'];

export const SCIONS = [
    { id: 'souple', nom: 'Scion souple', profondeur: [0.6, 9.0], prix: 0, atout: '🎯 Très sensible',
      capacite: {}, sensibilite: 1.35, couleur: 0xff6b57,
      desc: 'Scion souple : il plie à la moindre touche, très sensible. Attention aux fausses touches !' },
    { id: 'moyen', nom: 'Scion moyen', profondeur: [0.6, 9.0], prix: 0, atout: '⚖ Polyvalent',
      capacite: {}, sensibilite: 1.0, couleur: 0xffd24d,
      desc: 'Scion moyen : un bon compromis entre sensibilité et fausses touches.' },
    { id: 'rigide', nom: 'Scion rigide', profondeur: [0.6, 9.0], prix: 0, atout: '🛡 Peu de fausses touches',
      capacite: {}, sensibilite: 0.75, couleur: 0x6ec1ff,
      desc: 'Scion rigide : il ne bouge que pour de vraies touches, mais la fenêtre de ferrage est plus courte.' },
    { id: 'clochette', nom: 'Scion à clochette', profondeur: [0.6, 9.0], prix: 60, atout: '🔔 Sonne à chaque touche',
      capacite: { sonnette: true, fenetre: 1.1 }, sensibilite: 1.0, couleur: 0xffe27a,
      desc: 'Une petite clochette tinte dès qu’un poisson touche : tu l’entends même sans regarder le scion. Un peu plus de temps pour ferrer.' },
    { id: 'carbone', nom: 'Scion carbone', profondeur: [0.6, 9.0], prix: 90, atout: '🤫 Moins de fausses touches',
      capacite: { fausses: 0.6 }, sensibilite: 1.2, couleur: 0x39393f,
      desc: 'Scion en carbone : sensible mais précis, il ignore presque les fausses touches.' },
    { id: 'maitre', nom: 'Scion du maître', profondeur: [0.6, 9.0], prix: 200, atout: '🏆 Polyvalent + 50 % d’expérience',
      capacite: { sonnette: true, fenetre: 1.2, fausses: 0.7, avantage: 0.85, temps: 1.15, xp: 1.5 }, sensibilite: 1.25, couleur: 0xffd700,
      desc: 'Le scion du maître pêcheur : clochette, ferrage plus facile, moins de fausses touches et 50 % d’expérience en plus !' }
];

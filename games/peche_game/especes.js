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
      profondeur: [-2.8, -1.8], combativite: [0.55, 0.9], agressivite: [0.5, 0.8], style: 'aspirateur', couleur: 0x9d8f63, motif: 'ecailles' },
    { id: 'tanche', nom: 'Tanche', form: 'profond', cm: [15, 70], k: 1.7, abondance: 5,
      profondeur: [-3.2, -2.2], combativite: [0.7, 1.05], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0x4f6b3c, oeil: 0xc0392b, motif: 'mouchetures' },
    { id: 'carpe', nom: 'Carpe', form: 'profond', cm: [20, 105], k: 2.3, abondance: 6,
      profondeur: [-3.2, -2.2], combativite: [0.9, 1.2], agressivite: [0.7, 1.05], style: 'lourd', couleur: 0xa8853f, motif: 'ecailles' },
    { id: 'carassin', nom: 'Carassin', form: 'profond', cm: [10, 50], k: 2.2, abondance: 5,
      profondeur: [-2.8, -1.9], combativite: [0.6, 0.9], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0xb08b3a, motif: 'ecailles' },
    { id: 'perche', nom: 'Perche', form: 'bossu', cm: [10, 45], k: 1.4, abondance: 7,
      profondeur: [-2.6, -1.5], combativite: [0.7, 1.05], agressivite: [0.9, 1.25], style: 'teigneux', couleur: 0x6f7a45, nageoires: 0xc0522a, motif: 'rayures' },
    { id: 'chevesne', nom: 'Chevesne', form: 'fusiforme', cm: [12, 70], k: 1.2, abondance: 5,
      profondeur: [-1.8, -0.8], combativite: [0.8, 1.15], agressivite: [0.9, 1.25], style: 'fonceur', couleur: 0x9aa39c, motif: 'argent' },
    { id: 'brochet', nom: 'Brochet', form: 'torpille', cm: [25, 130], k: 0.9, abondance: 3,
      profondeur: [-2.2, -1.0], combativite: [0.9, 1.25], agressivite: [1.25, 1.6], style: 'fonceur', couleur: 0x4c5c33, motif: 'tachesClaires' },
    { id: 'sandre', nom: 'Sandre', form: 'torpille', cm: [20, 110], k: 0.8, abondance: 2,
      profondeur: [-3.4, -2.4], combativite: [0.85, 1.15], agressivite: [1.1, 1.45], style: 'glisseur', couleur: 0x8f9a83, motif: 'barres' },
    { id: 'black-bass', nom: 'Black-bass', form: 'bossu', cm: [15, 60], k: 1.6, abondance: 2,
      profondeur: [-2.4, -1.3], combativite: [0.9, 1.2], agressivite: [1.1, 1.5], style: 'fonceur', couleur: 0x556a3f, motif: 'bandeLaterale' },
    { id: 'truite', nom: 'Truite', form: 'fusiforme', cm: [15, 80], k: 1.2, abondance: 2,
      profondeur: [-2.2, -1.0], combativite: [0.8, 1.15], agressivite: [1.0, 1.35], style: 'fonceur', couleur: 0x7d6a4a, motif: 'pointsRouges' },
    { id: 'anguille', nom: 'Anguille', form: 'anguille', cm: [30, 130], k: 0.2, abondance: 2,
      profondeur: [-3.4, -2.6], combativite: [1.0, 1.4], agressivite: [1.1, 1.5], style: 'glisseur', couleur: 0x3f4a30, motif: 'aucun' },
    { id: 'silure', nom: 'Silure', form: 'barbu', cm: [60, 220], k: 1.0, abondance: 1,
      profondeur: [-3.4, -2.6], combativite: [1.1, 1.5], agressivite: [1.2, 1.55], style: 'lourd', couleur: 0x474b42, motif: 'marbrures' }
];

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
    perche:   { couche: 'mi-eau',  banc: [3, 5], cohesion: 0.9, croisiere: 1.5, pointe: 5.0, virage: 1.7, domaine: 12, vue: 7.0, humeur: 'errant', substrats: ['gravier', 'roche'] },
    chevesne: { couche: 'mi-eau',  banc: [2, 4], cohesion: 0.6, croisiere: 1.6, pointe: 5.0, virage: 1.4, domaine: 18, vue: 6.5, humeur: 'errant', substrats: ['gravier'] },
    brochet:  { couche: 'mi-eau',  banc: [1, 1], cohesion: 0,   croisiere: 0.4, pointe: 8.5, virage: 0.8, domaine: 7,  vue: 8.0, humeur: 'embuscade', substrats: ['herbier'] },
    sandre:   { couche: 'fond',    banc: [1, 2], cohesion: 0.4, croisiere: 0.9, pointe: 6.5, virage: 1.0, domaine: 14, vue: 7.5, humeur: 'errant', nocturne: true, substrats: ['roche'], fosse: true },
    'black-bass': { couche: 'mi-eau', banc: [1, 1], cohesion: 0, croisiere: 0.7, pointe: 6.0, virage: 1.3, domaine: 8, vue: 7.0, humeur: 'embuscade', substrats: ['herbier'] },
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

export const FORMES = {
    fusiforme: { bodyX: 1.5, bodyY: 0.78, bodyZ: 0.58, queue: 'fourche', dorsale: 0.55, longueurRef: 2.30 },
    profond: { bodyX: 1.6, bodyY: 1.02, bodyZ: 0.72, queue: 'fourche', dorsale: 0.5, longueurRef: 2.42 },
    plat: { bodyX: 1.55, bodyY: 1.3, bodyZ: 0.34, queue: 'fourche', dorsale: 0.75, longueurRef: 2.36 },
    torpille: { bodyX: 2.7, bodyY: 0.62, bodyZ: 0.5, queue: 'arrondie', dorsale: 0.35, dorsaleReculee: true, longueurRef: 3.74 },
    bossu: { bodyX: 1.45, bodyY: 0.95, bodyZ: 0.62, queue: 'fourche', dorsale: 0.7, epines: true, longueurRef: 2.24 },
    anguille: { bodyX: 3.4, bodyY: 0.3, bodyZ: 0.3, queue: 'fine', dorsale: 0, longueurRef: 4.58 },
    barbu: { bodyX: 2.4, bodyY: 0.85, bodyZ: 0.78, queue: 'arrondie', dorsale: 0.4, moustaches: true, longueurRef: 3.38 },
    petit: { bodyX: 1.35, bodyY: 0.72, bodyZ: 0.52, queue: 'fourche', dorsale: 0.45, longueurRef: 2.12 }
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

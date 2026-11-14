// ---------------------------------------------------------------------------
// especes.js — DONNÉES des espèces, styles de combat, silhouettes et touches.
// Extraites de script.js pour alléger l'orchestrateur 3D.
// ---------------------------------------------------------------------------

export const SPECIES = [
    { id: 'gardon', nom: 'Gardon', form: 'fusiforme', cm: [12, 32], k: 1.1, abondance: 12,
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.8], agressivite: [0.55, 0.85], style: 'nerveux', couleur: 0xbfcbd0, motif: 'argent' },
    { id: 'rotengle', nom: 'Rotengle', form: 'fusiforme', cm: [15, 35], k: 1.1, abondance: 8,
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.85], agressivite: [0.6, 0.9], style: 'nerveux', couleur: 0xb9c6c0, nageoires: 0xc0522a, motif: 'argent' },
    { id: 'ablette', nom: 'Ablette', form: 'petit', cm: [8, 18], k: 0.9, abondance: 9,
      profondeur: [-1.3, -0.7], combativite: [0.4, 0.65], agressivite: [0.6, 0.95], style: 'nerveux', couleur: 0xd2dcdf, motif: 'argent' },
    { id: 'goujon', nom: 'Goujon', form: 'petit', cm: [10, 22], k: 1.3, abondance: 7,
      profondeur: [-3.0, -2.0], combativite: [0.4, 0.7], agressivite: [0.5, 0.8], style: 'teigneux', couleur: 0xc2a878, motif: 'taches' },
    { id: 'breme', nom: 'Brème', form: 'plat', cm: [25, 60], k: 1.8, abondance: 6,
      profondeur: [-2.8, -1.8], combativite: [0.55, 0.9], agressivite: [0.5, 0.8], style: 'aspirateur', couleur: 0x9d8f63, motif: 'ecailles' },
    { id: 'tanche', nom: 'Tanche', form: 'profond', cm: [25, 55], k: 1.7, abondance: 5,
      profondeur: [-3.2, -2.2], combativite: [0.7, 1.05], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0x4f6b3c, oeil: 0xc0392b, motif: 'mouchetures' },
    { id: 'carpe', nom: 'Carpe', form: 'profond', cm: [35, 95], k: 2.3, abondance: 6,
      profondeur: [-3.2, -2.2], combativite: [0.9, 1.2], agressivite: [0.7, 1.05], style: 'lourd', couleur: 0xa8853f, motif: 'ecailles' },
    { id: 'carassin', nom: 'Carassin', form: 'profond', cm: [18, 40], k: 2.2, abondance: 5,
      profondeur: [-2.8, -1.9], combativite: [0.6, 0.9], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0xb08b3a, motif: 'ecailles' },
    { id: 'perche', nom: 'Perche', form: 'bossu', cm: [15, 45], k: 1.4, abondance: 7,
      profondeur: [-2.6, -1.5], combativite: [0.7, 1.05], agressivite: [0.9, 1.25], style: 'teigneux', couleur: 0x6f7a45, nageoires: 0xc0522a, motif: 'rayures' },
    { id: 'chevesne', nom: 'Chevesne', form: 'fusiforme', cm: [25, 60], k: 1.2, abondance: 5,
      profondeur: [-1.8, -0.8], combativite: [0.8, 1.15], agressivite: [0.9, 1.25], style: 'fonceur', couleur: 0x9aa39c, motif: 'argent' },
    { id: 'brochet', nom: 'Brochet', form: 'torpille', cm: [40, 120], k: 0.9, abondance: 3,
      profondeur: [-2.2, -1.0], combativite: [0.9, 1.25], agressivite: [1.25, 1.6], style: 'fonceur', couleur: 0x4c5c33, motif: 'tachesClaires' },
    { id: 'sandre', nom: 'Sandre', form: 'torpille', cm: [35, 90], k: 0.8, abondance: 2,
      profondeur: [-3.4, -2.4], combativite: [0.85, 1.15], agressivite: [1.1, 1.45], style: 'glisseur', couleur: 0x8f9a83, motif: 'barres' },
    { id: 'black-bass', nom: 'Black-bass', form: 'bossu', cm: [25, 55], k: 1.6, abondance: 2,
      profondeur: [-2.4, -1.3], combativite: [0.9, 1.2], agressivite: [1.1, 1.5], style: 'fonceur', couleur: 0x556a3f, motif: 'bandeLaterale' },
    { id: 'truite', nom: 'Truite', form: 'fusiforme', cm: [20, 55], k: 1.2, abondance: 2,
      profondeur: [-2.2, -1.0], combativite: [0.8, 1.15], agressivite: [1.0, 1.35], style: 'fonceur', couleur: 0x7d6a4a, motif: 'pointsRouges' },
    { id: 'anguille', nom: 'Anguille', form: 'anguille', cm: [40, 110], k: 0.2, abondance: 2,
      profondeur: [-3.4, -2.6], combativite: [1.0, 1.4], agressivite: [1.1, 1.5], style: 'glisseur', couleur: 0x3f4a30, motif: 'aucun' },
    { id: 'silure', nom: 'Silure', form: 'barbu', cm: [80, 200], k: 1.0, abondance: 1,
      profondeur: [-3.4, -2.6], combativite: [1.1, 1.5], agressivite: [1.2, 1.55], style: 'lourd', couleur: 0x474b42, motif: 'marbrures' }
];

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

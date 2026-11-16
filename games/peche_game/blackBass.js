// ---------------------------------------------------------------------------
// blackBass.js — DONNÉES MESURÉES du black-bass (Micropterus salmoides) : silhouette, anatomie et
// robe, relevées sur assets/references/black-bass.jpg. Module de données pur (aucun import) ;
// especes.js les branche (PROFILS['black-bass'], ANATOMIES['black-bass'], champs de l'espèce).
//
// Les formes de nageoires propres à l'espèce sont données ici même (`forme` d'une nageoire impaire :
// { h: hauteur relative le long de la base, recul, epines, epinesAmp } ; `contour` de la caudale : bord
// libre du lobe du haut à celui du bas, voir modelePoisson.js) : le moteur n'a pas besoin de les connaître.
// ---------------------------------------------------------------------------

// Black-bass : black-bass.jpg (900 × 450, fond blanc, tourné à gauche, gueule entrouverte), LS = 694 px
// (museau 42,225 → base de la caudale 735,185), contour par seuil sur le fond
// (scripts/mesure-silhouette.py black-bass), nageoires repliées retranchées par des droites tracées à la
// main, bouche refermée (la mâchoire du bas, tombante sur la photo, est remontée). Corps très haut (0,19 LS
// de demi-hauteur à t = 0,45), dos presque droit de t = 0,35 à 0,65, grosse tête (0,36 LS) au front en
// pente, ventre plein jusqu'à t = 0,6 puis qui remonte vers un pédoncule épais (0,058 LS). Poisson vu de
// profil : largeur estimée (≈ 0,54 × hauteur sur le corps, tête un peu plus étroite à l'avant).
export const PROFIL_BLACK_BASS = [
    { t: 0, h: 0.008, w: 0.006, y: -0.008 }, { t: 0.025, h: 0.029, w: 0.02, y: -0.013 },
    { t: 0.05, h: 0.0535, w: 0.036, y: -0.0125 }, { t: 0.075, h: 0.074, w: 0.05, y: -0.014 },
    { t: 0.1, h: 0.0864, w: 0.06, y: -0.0136 }, { t: 0.15, h: 0.1079, w: 0.076, y: -0.0121 },
    { t: 0.2, h: 0.1338, w: 0.088, y: -0.0063 }, { t: 0.25, h: 0.157, w: 0.098, y: -0.005 },
    { t: 0.3, h: 0.1729, w: 0.1, y: -0.0065 }, { t: 0.35, h: 0.183, w: 0.102, y: -0.005 },
    { t: 0.4, h: 0.1872, w: 0.102, y: -0.0022 }, { t: 0.45, h: 0.1883, w: 0.1, y: 0.0018 },
    { t: 0.5, h: 0.1865, w: 0.097, y: 0.0015 }, { t: 0.55, h: 0.1843, w: 0.093, y: 0.0023 },
    { t: 0.6, h: 0.18, w: 0.088, y: 0.005 }, { t: 0.65, h: 0.174, w: 0.082, y: 0.002 },
    { t: 0.7, h: 0.158, w: 0.074, y: 0 }, { t: 0.75, h: 0.1365, w: 0.066, y: 0.0015 },
    { t: 0.8, h: 0.1165, w: 0.057, y: 0.0005 }, { t: 0.85, h: 0.0965, w: 0.047, y: -0.0015 },
    { t: 0.9, h: 0.076, w: 0.037, y: -0.006 }, { t: 0.95, h: 0.062, w: 0.029, y: -0.002 },
    { t: 1, h: 0.055, w: 0.024, y: 0.007 }];

// Anatomie (mêmes photo et repère que le profil). Œil moyen t 0,141 (r 0,026) à mi-hauteur de la tête ;
// grande gueule oblique dont le coin (t 0,185) passe sous l'arrière de l'œil ; ouïe t 0,36 (bord doux) ;
// 1re dorsale épineuse t 0,424 → 0,648 (0,052 LS, épines couchées vers l'arrière), encoche très basse,
// 2e dorsale souple t 0,65 → 0,88 (0,108 LS, rayons couchés, sommet vers les deux tiers) ; pectorale
// t 0,378 (0,16 LS, éventail ovale jaunâtre) ; pelviennes t 0,355 (0,13 LS) ; anale t 0,69 → 0,855
// (0,097 LS) ; caudale 0,2 LS, échancrure modérée (≈ 10 %), lobes arrondis, demi-envergure 0,16 LS.
// Pas de barbillons.
export const ANATOMIE_BLACK_BASS = {
    queue: {
        type: 'bass', longueur: 0.2, ecart: 0.16,
        contour: [[-0.6, 1], [-0.72, 0.96], [-0.82, 0.8], [-0.89, 0.52], [-0.9, 0.26], [-0.84, 0.04],
            [-0.9, -0.12], [-0.97, -0.38], [-1, -0.62], [-0.95, -0.86], [-0.86, -0.98], [-0.7, -0.95]]
    },
    // 1re dorsale : épines les plus hautes vers l'avant, un rayon sur deux plus court, bord qui descend
    // jusqu'à l'encoche ; 2e dorsale : s'élève en éventail, bord arrière qui retombe, rayons couchés ;
    // anale courte et arrondie, rayons du milieu les plus longs.
    dorsale: {
        type: 'dorsaleBass', t0: 0.424, t1: 0.648, hauteur: 0.052,
        forme: { h: [[0, 0.55], [0.06, 0.7], [0.2, 0.95], [0.32, 1], [0.5, 0.78], [0.7, 0.55], [0.88, 0.35], [1, 0.22]],
            recul: 0.5, epines: true, epinesAmp: 0.82 }
    },
    dorsale2: {
        type: 'dorsale2Bass', t0: 0.65, t1: 0.88, hauteur: 0.108,
        forme: { h: [[0, 0.25], [0.1, 0.4], [0.35, 0.75], [0.6, 1], [0.8, 0.97], [0.92, 0.7], [1, 0.3]], recul: 0.7 }
    },
    anale: {
        type: 'analeBass', t0: 0.69, t1: 0.855, hauteur: 0.097,
        forme: { h: [[0, 0.45], [0.1, 0.8], [0.3, 1], [0.55, 0.95], [0.8, 0.72], [1, 0.4]], recul: 0.55 }
    },
    pectorale: { t: 0.378, y: -0.08, longueur: 0.16, pente: 0.2, forme: 'ovale', eventail: 1 },
    pelvienne: { t: 0.355, longueur: 0.13, pente: 0.15, ecart: 0.5, forme: 'pointue' },
    oeil: { t: 0.141, y: 0.044, r: 0.026 },
    bouche: { t: 0.185, y0: -0.004, y1: -0.078, epaisseur: 0.011 },
    opercule: 0.36, ligneCourbe: 0.3, contrasteOpercule: 0.06
};

// Champs de l'espèce hors identité et comportement (cm, k, abondance… restent dans especes.js).
// Couleurs : médianes PIL sur black-bass.jpg (sujet clair sur fond blanc) : dos gris-olive (#87816f), flanc
// vert-gris pâle (#a4a18d), ventre blanc cassé (80e centile #e7e8e2), tête gris-olive (#86847d à #a5a08f),
// bande latérale gris-noir (#5d5f5e), iris sombre cerclé d'or ; teintes ramenées un peu plus sombres et plus
// vertes pour tenir sous la lumière du jeu. Nageoires translucides beige-gris aux rayons bruns (caudale
// #bcb3a3, pectorale jaunâtre #b9b18b), rayons fins de la variante « doux ».
// Robe : ≈ 68 écailles le long de la ligne latérale, peu contrastées (liseré foncé fin, effacées vers le
// ventre et la tête) ; petits points sombres sur le haut du flanc ; bande latérale faite de taches
// verticales irrégulières (tête, opercule, flanc : t = place le long du corps, large = largeur en fraction
// de LS, f0 / f1 = hauteur atteinte du dos (0) au ventre (1), force = opacité) qui se soudent en un ruban
// continu, de plus en plus épais, sur le pédoncule (motifBande.js).
export const ROBE_BLACK_BASS = {
    couleur: 0x969b82, dos: 0x4f5340, ventre: 0xe4e6dc, tete: 0x858774, oeil: 0x4c4828, teinteMotif: 0x2f332b,
    nageoires: 0xb0ad9a, nageoiresMotif: 'doux',
    nageoiresCouleurs: { dorsale: 0xa9a993, dorsale2: 0xb4b49e, anale: 0xc4c1aa, pectorale: 0xc4c0a8,
        pelvienne: 0xd2cfb6, caudale: [0x9a9886, 0xa6a390] },
    motif: 'bandeLaterale', ecailles: 68, rangsEcailles: 42, contrasteEcailles: 0.5, irregulariteEcailles: 0.3,
    ecaillesVentre: 0.7, debutEcailles: 0.3, fonduTete: 0.5, ombreDos: 1, ventreClair: 0.8, joueClaire: 0.12,
    rondeur: 0.05,
    pointsEcailles: { nombre: 150, t0: 0.3, t1: 1, f0: 0.06, f1: 0.34, rayon: 0.9, force: 0.65 },
    taches: [{ t: 0.205, large: 0.07, f0: 0.3, f1: 0.42, force: 0.35 },
        { t: 0.27, large: 0.09, f0: 0.22, f1: 0.52, force: 0.55 }, { t: 0.335, large: 0.05, f0: 0.3, f1: 0.55, force: 0.45 },
        { t: 0.415, large: 0.026, f0: 0.34, f1: 0.5, force: 0.6 }, { t: 0.455, large: 0.034, f0: 0.34, f1: 0.52, force: 0.65 },
        { t: 0.5, large: 0.036, f0: 0.27, f1: 0.58, force: 0.8 }, { t: 0.545, large: 0.034, f0: 0.3, f1: 0.52, force: 0.75 },
        { t: 0.59, large: 0.03, f0: 0.35, f1: 0.55, force: 0.7 }, { t: 0.635, large: 0.032, f0: 0.3, f1: 0.62, force: 0.8 },
        { t: 0.69, large: 0.034, f0: 0.34, f1: 0.62, force: 0.8 }, { t: 0.735, large: 0.032, f0: 0.34, f1: 0.56, force: 0.7 }],
    bande: { t0: 0.77, t1: 1, f: 0.5, demi: 0.1, demiFin: 0.2, force: 0.8 },
    profil: 'black-bass', anatomie: 'black-bass'
};

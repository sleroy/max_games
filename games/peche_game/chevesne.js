// ---------------------------------------------------------------------------
// chevesne.js — DONNÉES MESURÉES du chevesne (Squalius cephalus) : silhouette, anatomie et robe,
// relevées sur assets/references/chevesne.jpg. Module de données pur (aucun import) ; especes.js les
// branche (PROFILS.chevesne, ANATOMIES.chevesne, champs de l'espèce). Même principe que blackBass.js :
// les nageoires impaires portent leur `forme`, la caudale son `contour` (lus par modelePoisson.js).
// ---------------------------------------------------------------------------

// Chevesne : chevesne.jpg (900 × 675, posé sur un plateau de bois, tourné à droite), LS = 689 px (museau
// 835,360 → base de la caudale 148,306). Contour par seuil de teinte sur le plateau
// (scripts/mesure-silhouette.py chevesne), dorsale détachée, anale et pelvienne étalées retranchées par
// deux lignes tracées à la main ; bouche refermée (la mâchoire du bas, entrouverte sur la photo, est
// remontée). Corps long et épais : hauteur max 0,147 LS à t = 0,4 (dos presque droit, ventre plein),
// grosse tête (0,26 LS) au front en pente douce et au museau émoussé, pédoncule épais (0,049 LS).
// Poisson vu de profil : largeur estimée (≈ 0,52 × hauteur sur le corps, tête un peu plus étroite devant).
export const PROFIL_CHEVESNE = [
    { t: 0, h: 0.02, w: 0.012, y: -0.003 }, { t: 0.025, h: 0.037, w: 0.021, y: -0.003 },
    { t: 0.05, h: 0.0545, w: 0.031, y: -0.0057 }, { t: 0.075, h: 0.068, w: 0.039, y: -0.006 },
    { t: 0.1, h: 0.0788, w: 0.044, y: -0.006 }, { t: 0.15, h: 0.098, w: 0.055, y: -0.0058 },
    { t: 0.2, h: 0.1103, w: 0.061, y: -0.0065 }, { t: 0.25, h: 0.1212, w: 0.066, y: -0.0079 },
    { t: 0.3, h: 0.1331, w: 0.07, y: -0.0119 }, { t: 0.35, h: 0.1415, w: 0.074, y: -0.0188 },
    { t: 0.4, h: 0.1466, w: 0.076, y: -0.0203 }, { t: 0.45, h: 0.1458, w: 0.076, y: -0.021 },
    { t: 0.5, h: 0.1408, w: 0.074, y: -0.0195 }, { t: 0.55, h: 0.1346, w: 0.071, y: -0.017 },
    { t: 0.6, h: 0.1226, w: 0.065, y: -0.0123 }, { t: 0.65, h: 0.1117, w: 0.059, y: -0.0123 },
    { t: 0.7, h: 0.104, w: 0.054, y: -0.015 }, { t: 0.75, h: 0.0975, w: 0.05, y: -0.0165 },
    { t: 0.8, h: 0.0865, w: 0.045, y: -0.0112 }, { t: 0.85, h: 0.068, w: 0.036, y: -0.004 },
    { t: 0.9, h: 0.056, w: 0.03, y: 0.0026 }, { t: 0.95, h: 0.0505, w: 0.026, y: 0 },
    { t: 1, h: 0.049, w: 0.024, y: 0.001 }];

// Anatomie (mêmes photo et repère que le profil). Œil petit t 0,071 (r 0,0175) au tiers haut de la tête ;
// grande bouche terminale dont le coin (t 0,05) arrive sous l'avant de l'œil ; ouïe t 0,26 (bord doux,
// joue dorée) ; dorsale courte t 0,575 → 0,688 (0,13 LS, bord avant long qui se couche vers l'arrière,
// sommet arrondi) au-dessus des pelviennes (t 0,566, 0,13 LS, rouge pâle) ; pectorale t 0,262 (0,18 LS,
// lancéolée, brun sombre) ; anale courte t 0,775 → 0,858 (0,1 LS, bord arrondi, rouge-orangé) ;
// caudale 0,17 LS, fourche moyenne (échancrure ≈ 28 % de la longueur), lobes pointus.
// Pas de barbillons.
export const ANATOMIE_CHEVESNE = {
    queue: {
        type: 'chevesne', longueur: 0.17, ecart: 0.14,
        contour: [[-0.92, 1], [-0.88, 0.82], [-0.8, 0.58], [-0.74, 0.32], [-0.71, 0.1], [-0.71, -0.08],
            [-0.75, -0.3], [-0.82, -0.52], [-0.91, -0.72], [-0.99, -0.9], [-1, -1]]
    },
    dorsale: {
        type: 'dorsaleChevesne', t0: 0.575, t1: 0.688, hauteur: 0.13,
        forme: { h: [[0, 0.8], [0.1, 1], [0.35, 0.93], [0.65, 0.76], [0.88, 0.56], [1, 0.42]], recul: 0.45 }
    },
    anale: {
        type: 'analeChevesne', t0: 0.765, t1: 0.865, hauteur: 0.085,
        forme: { h: [[0, 0.75], [0.15, 1], [0.45, 0.92], [0.75, 0.7], [1, 0.45]], recul: 0.95 }
    },
    pectorale: { t: 0.262, y: -0.05, longueur: 0.18, pente: 0.42, forme: 'ovale', eventail: 0.4 },
    pelvienne: { t: 0.566, longueur: 0.11, pente: 0.1, ecart: 0.35, forme: 'pointue' },
    oeil: { t: 0.071, y: 0.023, r: 0.0175 },
    bouche: { t: 0.05, y0: -0.004, y1: -0.032, epaisseur: 0.009 },
    opercule: 0.27, ligneCourbe: 0.5, contrasteOpercule: 0.1
};

// Champs de l'espèce hors identité et comportement (cm, k, abondance… restent dans especes.js).
// Couleurs : médianes PIL sur chevesne.jpg (lumière chaude du plateau) : dos brun-olive sombre (#4e3c24 à
// #827159), flanc argenté (#b8ac97), ventre blanc cassé (80e centile #c4bca8, ramené à #d2cdbc), tête
// sombre sur le dessus (#3e352c) à joue dorée (#7a6951 à #958364), iris argent-or ; nageoires :
// pectorale brun sombre (#372d27), dorsale et caudale gris-brun (#5d5043, #2f2520), anale et pelviennes
// rouge-orangé (#824734, #763217) ; teintes éclaircies (la membrane des nageoires les assombrit).
// Robe : ≈ 38 grandes écailles le long de la ligne latérale (≈ 18 px de LS = 689 sur la photo), 13 rangées
// du dos au ventre, liseré sombre bien net (aspect réticulé), à peine effacé vers le ventre, reflet argenté
// discret ; la ligne latérale est un pointillé léger.
export const ROBE_CHEVESNE = {
    couleur: 0xaea99b, dos: 0x40362a, ventre: 0xdad6ca, tete: 0x58503c, oeil: 0xbdb08c,
    nageoires: 0x6b5d4d, nageoiresMotif: 'doux',
    nageoiresCouleurs: { dorsale: 0x6e604f, anale: 0xa85a44, pectorale: 0x5d4b3b, pelvienne: 0xb05a30,
        caudale: [0x463b33, 0x463b33] },
    motif: 'argent', ecailles: 38, rangsEcailles: 13, contrasteEcailles: 1.3, irregulariteEcailles: 0.2,
    ecaillesVentre: 0.45, debutEcailles: 0.22, fonduTete: 0.1, refletArgent: 0.3, refletFondu: 0.12, ombreDos: 1,
    ventreClair: 0.65, joueClaire: 0.2,
    profil: 'chevesne', anatomie: 'chevesne'
};

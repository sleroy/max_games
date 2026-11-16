// ---------------------------------------------------------------------------
// ablette.js — DONNÉES MESURÉES de l'ablette (Alburnus alburnus) : silhouette, anatomie et robe,
// relevées sur assets/references/ablette.jpg. Module de données pur (aucun import) ; especes.js les
// branche (PROFILS.ablette, ANATOMIES.ablette, champs de l'espèce). Même principe que rotengle.js :
// les nageoires impaires portent leur `forme`, la caudale son `contour`.
// ---------------------------------------------------------------------------

// Ablette : ablette.jpg (900 × 545, fond blanc-gris, tournée à gauche), LS = 560 px (museau 135,266 →
// base de la caudale 695,274). Contour par écart au fond (scripts/mesure-silhouette.py ablette) entre
// deux lignes tracées à la main : la dorsale couchée, la pectorale, l'anale (membrane pâle sous le
// ventre) et la caudale sont retranchées. Corps fuselé et comprimé : hauteur max 0,104 LS (demi-hauteur)
// à t = 0,45, dos presque droit, ventre plein qui remonte vers l'arrière ; petite tête pointue
// (0,06 LS de demi-hauteur à t = 0,1) ; pédoncule fin (0,034 LS). Vu de profil : largeur estimée
// (≈ 0,41 × hauteur sur le corps, tête un peu plus épaisse).
export const PROFIL_ABLETTE = [
    { t: 0, h: 0.02, w: 0.012, y: -0.002 }, { t: 0.025, h: 0.0299, w: 0.0165, y: -0.0105 },
    { t: 0.05, h: 0.0433, w: 0.023, y: -0.0121 }, { t: 0.075, h: 0.0522, w: 0.027, y: -0.0115 },
    { t: 0.1, h: 0.0603, w: 0.0295, y: -0.0121 }, { t: 0.15, h: 0.0737, w: 0.034, y: -0.0105 },
    { t: 0.2, h: 0.0844, w: 0.037, y: -0.013 }, { t: 0.25, h: 0.0942, w: 0.04, y: -0.0148 },
    { t: 0.3, h: 0.0995, w: 0.0415, y: -0.0166 }, { t: 0.35, h: 0.1005, w: 0.042, y: -0.0148 },
    { t: 0.4, h: 0.1013, w: 0.042, y: -0.013 }, { t: 0.45, h: 0.1035, w: 0.043, y: -0.0148 },
    { t: 0.5, h: 0.1025, w: 0.0425, y: -0.011 }, { t: 0.55, h: 0.1004, w: 0.041, y: -0.0135 },
    { t: 0.6, h: 0.0933, w: 0.038, y: -0.0098 }, { t: 0.65, h: 0.0879, w: 0.035, y: -0.0085 },
    { t: 0.7, h: 0.0754, w: 0.031, y: -0.0005 }, { t: 0.75, h: 0.0629, w: 0.026, y: 0.004 },
    { t: 0.8, h: 0.0549, w: 0.0225, y: 0.0031 }, { t: 0.85, h: 0.046, w: 0.0195, y: 0.004 },
    { t: 0.9, h: 0.0424, w: 0.018, y: 0.0031 }, { t: 0.95, h: 0.0385, w: 0.0165, y: 0.003 },
    { t: 1, h: 0.034, w: 0.015, y: 0.002 }];

// Anatomie (mêmes photo et repère que le profil). Grand œil t 0,066 (r 0,027, iris doré-olive) un peu
// au-dessus du milieu de la tête ; bouche très remontante (supère) : la fente monte du coin t 0,036
// (y −0,04) vers le museau ; ouïe t 0,185 (limite douce) ; dorsale couchée sur le dos, courte, derrière
// l'insertion des pelviennes (t 0,47) : base t 0,545 → 0,65 (0,085 LS), inclinée vers l'arrière ;
// pectorale basse t 0,2 (0,15 LS, pâle, qui se couche le long du ventre) ; pelviennes t 0,47 (0,085 LS,
// pâles) ; anale plus longue que la dorsale, base t 0,6 → 0,8 (0,05 LS), pâle, bord arrière concave ;
// caudale 0,214 LS, fourche profonde (échancrure ≈ 39 % de la longueur), lobes en pointes fines.
// Pas de barbillons.
export const ANATOMIE_ABLETTE = {
    queue: {
        type: 'ablette', longueur: 0.214, ecart: 0.066,
        contour: [[-0.917, 1], [-0.84, 0.82], [-0.764, 0.66], [-0.6, 0.4], [-0.46, 0.1], [-0.39, -0.09],
            [-0.51, -0.36], [-0.68, -0.59], [-0.85, -0.82], [-1, -1]]
    },
    dorsale: {
        type: 'dorsaleAblette', t0: 0.545, t1: 0.65, hauteur: 0.05,
        forme: { h: [[0, 0.5], [0.15, 0.9], [0.3, 1], [0.55, 0.9], [0.8, 0.65], [1, 0.4]], recul: 1.5 }
    },
    anale: {
        type: 'analeAblette', t0: 0.62, t1: 0.79, hauteur: 0.032,
        forme: { h: [[0, 0.75], [0.1, 1], [0.4, 0.75], [0.75, 0.5], [1, 0.3]], recul: 1.6 }
    },
    pectorale: { t: 0.2, y: -0.088, longueur: 0.115, pente: 0.2, forme: 'ovale', eventail: 0.3 },
    pelvienne: { t: 0.47, longueur: 0.095, pente: 0.5, ecart: 0.3, forme: 'pointue' },
    oeil: { t: 0.066, y: -0.01, r: 0.027 },
    bouche: { t: 0.036, y0: -0.002, y1: -0.04, epaisseur: 0.005 },
    opercule: 0.185, ligneCourbe: 0.5, contrasteOpercule: 0.08
};

// Champs de l'espèce hors identité et comportement (cm, k, abondance… restent dans especes.js).
// Couleurs : médianes PIL sur ablette.jpg : dos olive sombre (bande du dos #646037, 20e centile #4a461e),
// haut du flanc gris-olive (#a1a076), flanc argenté (#d6cfba), ventre blanc (80e centile #fefefa, ramené
// à #f4f2ea), dessus de la tête olive sombre (#58543a), joue argentée (#beb79c), iris doré-olive (#a7a275) ;
// nageoires très pâles : caudale beige rosé (#e5c9a6, bout gris), dorsale gris-olive (#a7a27a), pectorale
// ocre pâle (#c6bb97), anale presque blanche (#e6ded4) ; teintes éclaircies (la membrane les assombrit).
// Robe : écailles fines (≈ 52 sur la ligne latérale, 15 rangées du dos au ventre), liseré peu contrasté,
// effacées vers le ventre (carène sans écailles), fort reflet argenté ; ligne latérale en pointillé.
export const ROBE_ABLETTE = {
    couleur: 0xeceadc, dos: 0x403c1e, ventre: 0xfcfbf4, tete: 0x57532f, oeil: 0xc6c196,
    nageoires: 0xdccfb4, nageoiresMotif: 'doux',
    nageoiresCouleurs: { dorsale: 0xc8c39a, anale: 0xf2e8de, pectorale: 0xe0d6b4, pelvienne: 0xeee6d6,
        caudale: [0xfadcb4, 0xf4d8b4] },
    motif: 'argent', ecailles: 52, rangsEcailles: 15, contrasteEcailles: 0.7, irregulariteEcailles: 0.3,
    ecaillesVentre: 0.75, debutEcailles: 0.18, fonduTete: 0.6, refletArgent: 0.35, refletFondu: 0.15, ombreDos: 0.9,
    ventreClair: 0.85, joueClaire: 0.55,
    profil: 'ablette', anatomie: 'ablette'
};

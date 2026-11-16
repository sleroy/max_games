// ---------------------------------------------------------------------------
// goujon.js — DONNÉES MESURÉES du goujon (Gobio gobio) : silhouette, anatomie et robe, relevées sur
// assets/references/goujon.jpg. Module de données pur (aucun import) ; especes.js les branche
// (PROFILS.goujon, ANATOMIES.goujon, champs de l'espèce). Même principe que ablette.js : les nageoires
// impaires portent leur `forme`, la caudale son `contour`. Robe : motif `bandeLaterale` (motifBande.js).
// ---------------------------------------------------------------------------

// Goujon : goujon.jpg (900 × 474, jeune goujon translucide posé sur du sable, tourné à DROITE),
// LS = 562 px (museau 788,197 → base de la caudale 228,247 ; axe légèrement incliné). Le ventre se
// confond avec l'ombre : le contour est tracé à la main (grille de 20 px, deux lignes dos / ventre, voir
// scripts/mesure-silhouette.py goujon) ; la dorsale dressée, la pectorale, la pelvienne et la caudale en
// sont retranchées. Corps allongé, presque cylindrique : demi-hauteur max 0,088 LS à t = 0,35 → 0,45,
// dos presque droit qui descend doucement, ventre plat posé sur le fond ; tête arrondie et assez épaisse
// (0,058 LS à t = 0,1), museau obtus ; pédoncule épais (0,036 LS). Vu de profil : largeur estimée
// (≈ 0,78 × hauteur : section ronde), ventre aplati (`nb` 2,7) comme un poisson de fond.
export const PROFIL_GOUJON = [
    { t: 0, h: 0.02, w: 0.016, y: 0 }, { t: 0.025, h: 0.033, w: 0.026, y: 0.008 },
    { t: 0.05, h: 0.0425, w: 0.032, y: 0.0132 }, { t: 0.075, h: 0.051, w: 0.0385, y: 0.015 },
    { t: 0.1, h: 0.0578, w: 0.044, y: 0.0163 }, { t: 0.15, h: 0.0694, w: 0.053, y: 0.0163, nb: 2.3 },
    { t: 0.2, h: 0.0774, w: 0.0595, y: 0.0181, nb: 2.5 }, { t: 0.25, h: 0.0809, w: 0.0625, y: 0.019, nb: 2.7 },
    { t: 0.3, h: 0.0845, w: 0.065, y: 0.0199, nb: 2.7 }, { t: 0.35, h: 0.088, w: 0.0675, y: 0.0207, nb: 2.7 },
    { t: 0.4, h: 0.088, w: 0.0675, y: 0.0181, nb: 2.7 }, { t: 0.45, h: 0.0872, w: 0.0665, y: 0.0163, nb: 2.7 },
    { t: 0.5, h: 0.0863, w: 0.0655, y: 0.0145, nb: 2.7 }, { t: 0.55, h: 0.08, w: 0.061, y: 0.011, nb: 2.7 },
    { t: 0.6, h: 0.0747, w: 0.057, y: 0.0065, nb: 2.7 }, { t: 0.65, h: 0.0676, w: 0.0515, y: 0.0021, nb: 2.6 },
    { t: 0.7, h: 0.0618, w: 0.047, y: -0.0028, nb: 2.5 }, { t: 0.75, h: 0.0583, w: 0.0445, y: -0.0055, nb: 2.4 },
    { t: 0.8, h: 0.0556, w: 0.0425, y: -0.0073, nb: 2.3 }, { t: 0.85, h: 0.0502, w: 0.038, y: -0.0082, nb: 2.2 },
    { t: 0.9, h: 0.0449, w: 0.034, y: -0.0073 }, { t: 0.95, h: 0.0405, w: 0.0305, y: -0.0058 },
    { t: 1, h: 0.036, w: 0.027, y: -0.004 }];

// Anatomie (mêmes photo et repère que le profil). Œil moyen t 0,122 (r 0,03, anneau argenté-bronze autour
// d'une grosse pupille) au tiers haut de la tête ; bouche INFÈRE : la fente part sous le museau (t 0)
// vers un coin t 0,066 sous l'avant de l'œil ; deux barbillons courts (≈ 0,055 LS) aux coins de la
// bouche, qui pendent vers le bas ; ouïe t 0,25 (limite douce, joue argentée) ; dorsale dressée et
// couchée vers l'arrière, base t 0,48 → 0,64 (au-dessus de l'insertion des pelviennes t 0,5), hauteur
// 0,12 LS, pointe arrondie ; pectorale basse t 0,255 (membrane translucide, ovale, étalée) ; pelviennes
// t 0,5 (0,11 LS) pendantes vers l'arrière ; anale courte t 0,72 → 0,8 (0,06 LS) ; caudale 0,22 LS,
// fourche modérée (échancrure ≈ 33 % de la longueur), lobes arrondis.
export const ANATOMIE_GOUJON = {
    queue: {
        type: 'goujon', longueur: 0.22, ecart: 0.085,
        contour: [[-0.8, 1], [-0.9, 0.93], [-0.95, 0.78], [-0.9, 0.58], [-0.82, 0.4], [-0.74, 0.2], [-0.69, 0],
            [-0.74, -0.2], [-0.83, -0.42], [-0.92, -0.64], [-0.99, -0.82], [-0.97, -0.95], [-0.88, -1]]
    },
    dorsale: {
        type: 'dorsaleGoujon', t0: 0.48, t1: 0.64, hauteur: 0.095,
        forme: { h: [[0, 0.5], [0.12, 0.92], [0.3, 1], [0.55, 0.86], [0.8, 0.6], [1, 0.4]], recul: 0.75 }
    },
    anale: {
        type: 'analeGoujon', t0: 0.72, t1: 0.8, hauteur: 0.04,
        forme: { h: [[0, 0.5], [0.15, 1], [0.5, 0.75], [0.8, 0.45], [1, 0.25]], recul: 1.2 }
    },
    pectorale: { t: 0.255, y: -0.05, longueur: 0.1, pente: 0.35, forme: 'ovale', eventail: 0.5, ecart: 0.4 },
    pelvienne: { t: 0.5, longueur: 0.11, pente: 0.3, ecart: 0.4, forme: 'pointue' },
    oeil: { t: 0.122, y: 0.03, r: 0.034 },
    bouche: { t: 0.066, y0: -0.012, y1: -0.026, epaisseur: 0.008 },
    barbillons: [{ t: 0.05, y: -0.022, longueur: 0.06, chute: 1.2, ecart: 0.3, rayon: 0.005, ondule: 0.2 }],
    opercule: 0.25, ligneCourbe: 0.2, contrasteOpercule: 0.04
};

// Champs de l'espèce hors identité et comportement (cm, k, abondance… restent dans especes.js).
// Couleurs : médianes PIL sur goujon.jpg (photo sombre, sous l'eau) : dos brun-olive (bande du dos
// #544c3a, 80e centile #605847), haut du flanc rosé-brun (#65584e), flanc gris translucide (#827f78,
// 80e centile #959187), ventre gris clair (80e centile #8a8884, éclairci : l'ombre du fond l'assombrit),
// dessus de la tête olive-beige (80e centile #a59880), joue argentée bleutée (80e centile #c8cdd1), iris
// bronze (#ab9c8b) ; nageoires translucides gris-olive (caudale #565850, dorsale #63635d, pectorale
// #90938c) à rayons sombres, éclaircies (la membrane les assombrit).
// Robe : fines écailles (≈ 44 sur la ligne latérale, 13 rangées), effacées vers le ventre, semis de petits
// points sombres sur le haut du flanc (liseré des écailles), rangée de grosses taches rondes bleu-noir
// sur la ligne latérale (10 relevées sur la photo) ; barbillons couleur chair.
export const ROBE_GOUJON = {
    couleur: 0x9c9b93, dos: 0x4a4233, ventre: 0xd4d3cb, tete: 0x877d6a, oeil: 0xcdbfa4,
    nageoires: 0xa8a698, nageoiresMotif: 'sandre', barbillonsCouleur: 0xa88a70,
    nageoiresCouleurs: { dorsale: 0xa4a294, anale: 0xb4b0a2, pectorale: 0xc4c0b2, pelvienne: 0xb0b2b0,
        caudale: [0xa09e90, 0xa09e90] },
    motif: 'bandeLaterale', teinteMotif: 0x26262a,
    ecailles: 50, rangsEcailles: 14, contrasteEcailles: 0.35, irregulariteEcailles: 0.45,
    ecaillesVentre: 0.85, debutEcailles: 0.22, fonduTete: 0.7, ombreDos: 0.85, ventreClair: 0.7, joueClaire: 0.3,
    pointsEcailles: { nombre: 170, t0: 0.28, t1: 0.97, f0: 0.06, f1: 0.42, rayon: 0.85, force: 0.7 },
    taches: [{ t: 0.31, large: 0.02, f0: 0.46, f1: 0.54, force: 0.45 }, { t: 0.35, large: 0.02, f0: 0.46, f1: 0.54, force: 0.51 },
        { t: 0.495, large: 0.02, f0: 0.46, f1: 0.54, force: 0.55 }, { t: 0.555, large: 0.02, f0: 0.46, f1: 0.54, force: 0.59 },
        { t: 0.63, large: 0.02, f0: 0.46, f1: 0.54, force: 0.59 }, { t: 0.725, large: 0.02, f0: 0.46, f1: 0.54, force: 0.51 },
        { t: 0.76, large: 0.02, f0: 0.46, f1: 0.54, force: 0.64 }, { t: 0.81, large: 0.02, f0: 0.46, f1: 0.54, force: 0.64 },
        { t: 0.865, large: 0.02, f0: 0.46, f1: 0.54, force: 0.64 }, { t: 0.965, large: 0.024, f0: 0.46, f1: 0.54, force: 0.59 }],
    profil: 'goujon', anatomie: 'goujon'
};

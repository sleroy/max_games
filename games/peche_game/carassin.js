// ---------------------------------------------------------------------------
// carassin.js — DONNÉES MESURÉES du carassin (Carassius carassius) : silhouette, anatomie et robe,
// relevées sur assets/references/carassin.jpg. Module de données pur (aucun import) ; especes.js les
// branche (PROFILS.carassin, ANATOMIES.carassin, champs de l'espèce). Même principe que goujon.js :
// les nageoires impaires portent leur `forme`, la caudale son `contour`. Robe : motif `bandeLaterale`
// (motifBande.js : écailles + petits points sombres + tache du pédoncule).
// ---------------------------------------------------------------------------

// Carassin : carassin.jpg (900 × 601, jeune carassin sous l'eau sur fond gris, tourné à GAUCHE),
// LS = 647 px (museau 42,342 → base de la caudale 688,300 ; axe incliné de 4°). Le dos brun sombre et le
// ventre jaune se fondent dans les ombres : le contour est tracé à la main (grille de 50 px, deux lignes
// dos / ventre, voir scripts/mesure-silhouette.py carassin) ; la dorsale dressée, la pectorale, les
// pelviennes, l'anale et la caudale en sont retranchées. Corps très haut, ovale : demi-hauteur max
// 0,192 LS à t = 0,5, dos convexe qui monte régulièrement de la nuque à la dorsale, ventre plein ;
// petite tête arrondie (0,098 LS à t = 0,1), museau obtus ; pédoncule haut (0,068 LS). Vu de profil :
// largeur estimée (≈ 0,46 × hauteur sur le corps, un peu plus sur la tête arrondie).
export const PROFIL_CARASSIN = [
    { t: 0, h: 0.012, w: 0.01, y: 0.002 }, { t: 0.025, h: 0.045, w: 0.024, y: 0 },
    { t: 0.05, h: 0.069, w: 0.036, y: -0.001 }, { t: 0.075, h: 0.084, w: 0.043, y: -0.004 },
    { t: 0.1, h: 0.0977, w: 0.049, y: -0.0064 }, { t: 0.15, h: 0.1228, w: 0.06, y: -0.0115 },
    { t: 0.2, h: 0.1413, w: 0.067, y: -0.0115 }, { t: 0.25, h: 0.1552, w: 0.073, y: -0.0099 },
    { t: 0.3, h: 0.1691, w: 0.078, y: -0.0037 }, { t: 0.35, h: 0.1796, w: 0.083, y: 0.0013 },
    { t: 0.4, h: 0.1854, w: 0.086, y: 0.0055 }, { t: 0.45, h: 0.19, w: 0.088, y: 0.0086 },
    { t: 0.5, h: 0.1923, w: 0.089, y: 0.0109 }, { t: 0.55, h: 0.1892, w: 0.088, y: 0.0094 },
    { t: 0.6, h: 0.1823, w: 0.084, y: 0.0048 }, { t: 0.65, h: 0.1715, w: 0.078, y: 0.0001 },
    { t: 0.7, h: 0.1576, w: 0.071, y: -0.0045 }, { t: 0.75, h: 0.1413, w: 0.063, y: -0.0099 },
    { t: 0.8, h: 0.1186, w: 0.054, y: -0.0111 }, { t: 0.85, h: 0.0962, w: 0.045, y: -0.0088 },
    { t: 0.9, h: 0.0819, w: 0.039, y: -0.0084 }, { t: 0.95, h: 0.0726, w: 0.034, y: -0.0068 },
    { t: 1, h: 0.068, w: 0.03, y: -0.008 }];

// Anatomie (mêmes photo et repère que le profil). Œil t 0,131 (r 0,034 : iris gris-beige autour d'une
// grosse pupille) à mi-hauteur de la tête ; bouche TERMINALE, fente courte et oblique : du bout du
// museau (t 0) vers un coin t 0,03 sous le museau ; PAS de barbillons ; ouïe t 0,30 (plaque pâle ponctuée,
// limite douce) ; dorsale LONGUE t 0,518 → 0,87 (0,16 LS), dressée devant (premier rayon raide) puis
// bord supérieur CONVEXE qui retombe en douceur sur les rayons couchés vers la queue ; pectorale basse
// t 0,30 (0,19 LS, rabattue le long du ventre, lancéolée) ; pelviennes t 0,487 (0,12 LS, pendantes),
// sous l'aplomb de la dorsale ; anale t 0,742 → 0,9 (0,11 LS, rayons avant longs et couchés, bord
// arrière vertical) ; caudale 0,25 LS, fourche modérée (échancrure ≈ 29 %), lobes arrondis, lobe du bas
// un peu plus long.
export const ANATOMIE_CARASSIN = {
    queue: {
        type: 'carassin', longueur: 0.25, ecart: 0.2,
        contour: [[-0.38, 0.8], [-0.54, 0.98], [-0.69, 1.05], [-0.78, 1.06], [-0.86, 1.03], [-0.92, 0.97],
            [-0.95, 0.84], [-0.93, 0.68], [-0.85, 0.43], [-0.77, 0.18], [-0.71, 0.05], [-0.75, -0.13], [-0.83, -0.33],
            [-0.93, -0.52], [-1, -0.64], [-0.97, -0.69], [-0.88, -0.71], [-0.75, -0.67], [-0.63, -0.6], [-0.38, -0.44]]
    },
    dorsale: {
        type: 'dorsaleCarassin', t0: 0.518, t1: 0.87, hauteur: 0.16,
        forme: { h: [[0, 0.6], [0.04, 1], [0.1, 1], [0.23, 0.97], [0.34, 0.9], [0.47, 0.79], [0.6, 0.66],
            [0.76, 0.44], [0.93, 0.2], [1, 0.08]], recul: 0.3 }
    },
    anale: {
        type: 'analeCarassin', t0: 0.742, t1: 0.9, hauteur: 0.11,
        forme: { h: [[0, 0.2], [0.08, 0.6], [0.2, 0.95], [0.3, 1], [0.5, 0.9], [0.7, 0.65],
            [0.88, 0.35], [1, 0.12]], recul: 0.9 }
    },
    pectorale: { t: 0.3, y: -0.112, longueur: 0.19, pente: 0.3, forme: 'ovale', eventail: 0.25, ecart: 0.25 },
    pelvienne: { t: 0.487, base: 0.11, longueur: 0.13, pente: 0.7, eventail: 0.25, ecart: 0.15, forme: 'ovale' },
    oeil: { t: 0.131, y: 0.015, r: 0.037 },
    bouche: { t: 0.03, y0: -0.008, y1: -0.033, epaisseur: 0.006 },
    opercule: 0.3, ligneCourbe: 0.4, contrasteOpercule: 0.04
};

// Champs de l'espèce hors identité et comportement (cm, k, abondance… restent dans especes.js).
// Couleurs : médianes PIL sur carassin.jpg (sous l'eau, éclairage doux) : dos brun-olive sombre (bande
// du dos #857b62, 20e centile #807250 : assombri vers #4e4630), flanc bronze-doré (#997a4e, 80e centile
// #ac8e60) tirant sur le cuivre rosé vers le pédoncule (#a77d53), ventre jaune-orangé (#b48b31, 80e
// centile #c59c4b : éclairci), dessus de la tête gris-brun sombre (#473a37 / #6e6f70), joue olive
// (#89734d), iris gris-beige (#524b44 éclairci) ; nageoires translucides : caudale jaune-olive
// (base #b09f52, bord #afae9f), dorsale gris-olive (#989489), anale pâle à rayons orangés (#a59c84),
// pelviennes orangé-ambre (#bead89 / #a48c5f), pectorale jaune-orangé (#bd913f) ; teintes éclaircies
// (la membrane les assombrit).
// Robe : ≈ 33 grandes écailles le long de la ligne latérale, 14 rangées du dos au ventre, liseré sombre
// modéré, légèrement irrégulières ; semis de petits points sombres sur le bas du flanc ; grosse tache
// noire en travers du pédoncule caudal (juvénile) ; pas de barbillons.
export const ROBE_CARASSIN = {
    couleur: 0xb59250, dos: 0x433b2a, ventre: 0xd8ac44, tete: 0x2f2923, oeil: 0x8f836a,
    nageoires: 0xc2b070, nageoiresMotif: 'truite',
    nageoiresCouleurs: { dorsale: 0xae9e70, anale: 0xdcb878, pectorale: 0xdcb878, pelvienne: 0xe0a850,
        caudale: [0xe0cc7a, 0xd8b868] },
    motif: 'bandeLaterale', teinteMotif: 0x241e18,
    ecailles: 33, rangsEcailles: 14, contrasteEcailles: 0.6, irregulariteEcailles: 0.3,
    ecaillesVentre: 0.35, debutEcailles: 0.24, fonduTete: 0.7, reflet: 0.12, ombreDos: 0.9, ventreClair: 0.5,
    joueClaire: 0.2,
    pointsEcailles: { nombre: 330, t0: 0.3, t1: 0.92, f0: 0.38, f1: 0.9, rayon: 0.7, force: 0.42 },
    taches: [{ t: 0.975, large: 0.032, f0: 0.08, f1: 0.86, force: 0.85 }],
    profil: 'carassin', anatomie: 'carassin'
};

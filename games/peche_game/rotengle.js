// ---------------------------------------------------------------------------
// rotengle.js — DONNÉES MESURÉES du rotengle (Scardinius erythrophthalmus) : silhouette, anatomie et
// robe, relevées sur assets/references/rotengle.jpg. Module de données pur (aucun import) ; especes.js
// les branche (PROFILS.rotengle, ANATOMIES.rotengle, champs de l'espèce). Même principe que
// chevesne.js : les nageoires impaires portent leur `forme`, la caudale son `contour`.
// ---------------------------------------------------------------------------

// Rotengle : rotengle.jpg (900 × 560, fond blanc, tourné à gauche), LS = 644 px (museau 54,285 →
// base de la caudale 698,288). Le flanc et le ventre sont surexposés (presque blancs) : le seuil sur le
// fond ne suffit pas, le contour est donc tracé à la main (deux lignes dos / ventre, voir
// scripts/mesure-silhouette.py rotengle) ; la dorsale couchée, la pectorale, les pelviennes et l'anale
// sont retranchées. Corps très haut et comprimé : hauteur max 0,172 LS (demi-hauteur) à t = 0,5, dos
// convexe qui monte vite derrière la nuque, ventre plein ; petite tête conique (0,07 LS de demi-hauteur
// à t = 0,1) ; pédoncule assez fin (0,055 LS). Vu de profil : largeur estimée (≈ 0,41 × hauteur sur le
// corps, tête un peu plus étroite devant).
export const PROFIL_ROTENGLE = [
    { t: 0, h: 0.016, w: 0.01, y: 0 }, { t: 0.025, h: 0.038, w: 0.02, y: 0.002 },
    { t: 0.05, h: 0.0493, w: 0.026, y: 0.003 }, { t: 0.075, h: 0.06, w: 0.031, y: 0.0036 },
    { t: 0.1, h: 0.0695, w: 0.035, y: 0.0044 }, { t: 0.15, h: 0.0959, w: 0.045, y: 0.0044 },
    { t: 0.2, h: 0.1153, w: 0.052, y: 0.0075 }, { t: 0.25, h: 0.1316, w: 0.058, y: 0.0067 },
    { t: 0.3, h: 0.1448, w: 0.062, y: 0.0044 }, { t: 0.35, h: 0.1549, w: 0.066, y: 0.0021 },
    { t: 0.4, h: 0.1627, w: 0.068, y: 0.0013 }, { t: 0.45, h: 0.1689, w: 0.07, y: 0 },
    { t: 0.5, h: 0.172, w: 0.0705, y: 0 }, { t: 0.55, h: 0.1712, w: 0.07, y: -0.0002 },
    { t: 0.6, h: 0.1611, w: 0.066, y: -0.0057 }, { t: 0.65, h: 0.1471, w: 0.06, y: -0.0103 },
    { t: 0.7, h: 0.1308, w: 0.0535, y: -0.0134 }, { t: 0.75, h: 0.113, w: 0.0465, y: -0.0142 },
    { t: 0.8, h: 0.0959, w: 0.04, y: -0.0158 }, { t: 0.85, h: 0.0842, w: 0.035, y: -0.0134 },
    { t: 0.9, h: 0.0741, w: 0.031, y: -0.0088 }, { t: 0.95, h: 0.0633, w: 0.0265, y: -0.0041 },
    { t: 1, h: 0.055, w: 0.023, y: 0 }];

// Anatomie (mêmes photo et repère que le profil). Œil rouge-orangé t 0,051 (r 0,02) au tiers haut de la
// tête ; bouche remontante (supère) : la fente descend du museau vers un coin t 0,032 sous l'avant de
// l'œil ; ouïe t 0,17 (bord sombre bien net sur la photo) ; dorsale couchée sur le dos, courte et haute
// pour un rotengle t 0,57 → 0,70 (0,09 LS), derrière l'insertion des pelviennes (t 0,47) ; pectorale
// t 0,19 (0,185 LS, lancéolée, orange) ; pelviennes t 0,47 (0,15 LS, rouge vif) ; anale t 0,735 → 0,855
// (0,07 LS, rouge vif, bord arrière concave) ; caudale 0,25 LS, fourche profonde (échancrure ≈ 50 % de
// la longueur), lobes pointus, lobe du bas un peu plus long. Pas de barbillons.
export const ANATOMIE_ROTENGLE = {
    queue: {
        type: 'rotengle', longueur: 0.25, ecart: 0.143,
        contour: [[-0.89, 0.72], [-0.89, 0.48], [-0.86, 0.39], [-0.8, 0.3], [-0.75, 0.22], [-0.62, 0.13], [-0.55, 0.04], [-0.48, -0.05], [-0.53, -0.13], [-0.62, -0.22], [-0.7, -0.3], [-0.76, -0.39], [-0.81, -0.48], [-0.86, -0.57], [-0.89, -0.65], [-0.93, -0.74], [-0.95, -0.83], [-0.99, -0.91], [-1.0, -1.0]]
    },
    dorsale: {
        type: 'dorsaleRotengle', t0: 0.57, t1: 0.7, hauteur: 0.06,
        forme: { h: [[0, 0.5], [0.1, 1], [0.35, 0.88], [0.65, 0.62], [0.9, 0.42], [1, 0.32]], recul: 1.35 }
    },
    anale: {
        type: 'analeRotengle', t0: 0.74, t1: 0.85, hauteur: 0.055,
        forme: { h: [[0, 0.5], [0.15, 1], [0.4, 0.8], [0.7, 0.5], [1, 0.3]], recul: 1.3 }
    },
    pectorale: { t: 0.19, y: -0.068, longueur: 0.165, pente: 0.32, forme: 'ovale', eventail: 0.2 },
    pelvienne: { t: 0.47, longueur: 0.14, pente: 0.12, ecart: 0.45, forme: 'pointue' },
    oeil: { t: 0.051, y: 0.014, r: 0.016 },
    bouche: { t: 0.032, y0: -0.01, y1: -0.03, epaisseur: 0.005 },
    opercule: 0.17, ligneCourbe: 0.7, contrasteOpercule: 0.1
};

// Champs de l'espèce hors identité et comportement (cm, k, abondance… restent dans especes.js).
// Couleurs : médianes PIL sur rotengle.jpg (flash : flanc et ventre surexposés) : dos gris-olive sombre
// (bande du dos #727168, 20e centile #46463e), flanc argenté doré (#cdc4aa), ventre blanc (80e centile
// #fefefb, ramené à #e6e8dc), dessus de la tête gris-vert (#a0a08f assombri), joue jaune pâle (#f9f6d5),
// iris rouge-orangé ; nageoires rouge-orangé (pectorale #c8883e, pelviennes #d46e30, anale #ca7641,
// dorsale #c79371, caudale #b5745c à base brune) : teintes éclaircies (la membrane les assombrit).
// Robe : ≈ 42 grandes écailles le long de la ligne latérale, 15 rangées du dos au ventre, liseré sombre
// net (aspect réticulé), un peu effacé vers le ventre, reflet argenté discret ; ligne latérale en pointillé.
export const ROBE_ROTENGLE = {
    couleur: 0xc4c2aa, dos: 0x3b3c2f, ventre: 0xf0f1e8, tete: 0x5c5a4a, oeil: 0xc4401c,
    nageoires: 0xd0663a, nageoiresMotif: 'doux',
    nageoiresCouleurs: { dorsale: 0xd2693a, anale: 0xde6a30, pectorale: 0xe08a3a, pelvienne: 0xe0602a,
        caudale: [0xca5c40, 0xbf5640] },
    motif: 'argent', ecailles: 42, rangsEcailles: 15, contrasteEcailles: 1.05, irregulariteEcailles: 0.25,
    ecaillesVentre: 0.5, debutEcailles: 0.17, fonduTete: 0.3, refletArgent: 0.3, refletFondu: 0.1, ombreDos: 1,
    ventreClair: 0.85, joueClaire: 0.15,
    profil: 'rotengle', anatomie: 'rotengle'
};

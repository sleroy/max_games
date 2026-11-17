// ---------------------------------------------------------------------------
// especes.js — DONNÉES des espèces, styles de combat, silhouettes et touches (extraites de script.js).
// ---------------------------------------------------------------------------
import { PROFIL_BLACK_BASS, ANATOMIE_BLACK_BASS, ROBE_BLACK_BASS } from './blackBass.js?v=255';
import { PROFIL_CHEVESNE, ANATOMIE_CHEVESNE, ROBE_CHEVESNE } from './chevesne.js?v=255';
import { PROFIL_ROTENGLE, ANATOMIE_ROTENGLE, ROBE_ROTENGLE } from './rotengle.js?v=255';
import { PROFIL_ABLETTE, ANATOMIE_ABLETTE, ROBE_ABLETTE } from './ablette.js?v=255';
import { PROFIL_GOUJON, ANATOMIE_GOUJON, ROBE_GOUJON } from './goujon.js?v=255';
import { PROFIL_CARASSIN, ANATOMIE_CARASSIN, ROBE_CARASSIN } from './carassin.js?v=255';

// Tailles (cm) : min = juvénile pêchable, max = grand sujet (Wikipédia FR).
export const SPECIES = [
    { id: 'gardon', nom: 'Gardon', form: 'fusiforme', cm: [10, 42], k: 1.1, abondance: 12,
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.8], agressivite: [0.55, 0.85], style: 'nerveux',
      // Couleurs : médianes PIL sur assets/references/gardon.jpg (photo au flash, flanc surexposé) :
      // dos brun-olive (#7b7663), flanc gris argenté (#c2c1aa), ventre blanc (80e centile #f8f8f1),
      // tête gris-beige (#b9aa94), iris orange-rouge. Dorsale brun cuivré, caudale orange-brun,
      // anale et pelviennes orange vif, pectorales jaune pâle.
      couleur: 0xb2baad, dos: 0x4d4e3d, ventre: 0xeff1e8, tete: 0x95917e, oeil: 0xd8803a,
      nageoires: 0xb88a58, nageoiresMotif: 'doux',
      nageoiresCouleurs: { dorsale: 0x9e7448, anale: 0xe6762a, pectorale: 0xb09c6a, pelvienne: 0xee7a2e,
          caudale: [0xa88a62, 0xb98250] },
      // Robe argentée : écailles moyennes (≈ 42 sur la ligne latérale, presque aussi hautes que larges),
      // bords sombres bien nets sur le dos, effacées vers le ventre, reflet argenté discret.
      motif: 'argent', ecailles: 42, rangsEcailles: 14, contrasteEcailles: 0.85, irregulariteEcailles: 0.35,
      ecaillesVentre: 0.7, debutEcailles: 0.2, fonduTete: 0.55, refletArgent: 0.26, ombreDos: 0.65,
      ventreClair: 0.6, profil: 'gardon', anatomie: 'gardon' },
    { id: 'rotengle', nom: 'Rotengle', form: 'fusiforme', cm: [10, 50], k: 1.1, abondance: 8, profondeur: [-1.6, -0.7], combativite: [0.5, 0.85], agressivite: [0.6, 0.9], style: 'nerveux', ...ROBE_ROTENGLE },   // robe mesurée : rotengle.js
    { id: 'ablette', nom: 'Ablette', form: 'petit', cm: [8, 25], k: 0.9, abondance: 9, profondeur: [-1.3, -0.7], combativite: [0.4, 0.65], agressivite: [0.6, 0.95], style: 'nerveux', ...ROBE_ABLETTE },   // robe mesurée : ablette.js
    { id: 'goujon', nom: 'Goujon', form: 'petit', cm: [8, 20], k: 1.3, abondance: 7,
      profondeur: [-3.0, -2.0], combativite: [0.4, 0.7], agressivite: [0.5, 0.8], style: 'teigneux', ...ROBE_GOUJON },   // robe mesurée : goujon.js
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
      profondeur: [-3.2, -2.2], combativite: [0.7, 1.05], agressivite: [0.6, 0.95], style: 'aspirateur',
      // Couleurs : médianes PIL sur tanche.jpg (photo au flash) : dos brun-olive très sombre, flanc vert-olive doré,
      // ventre ocre (80e centile), tête olive-jaune, nageoires gris-vert, iris orange-rouge ; peau muqueuse presque lisse.
      couleur: 0x8a8a5c, dos: 0x2e2913, ventre: 0xcdb56a, tete: 0xa8985e, oeil: 0xd24a2a, nageoires: 0x5e6658,
      barbillonsCouleur: 0xb48a60, motif: 'peauFine', ecailles: 130, contrasteEcailles: 0.3, irregulariteEcailles: 0.3,
      ecaillesVentre: 0.5, debutEcailles: 0.21, fonduTete: 0.5, ombreDos: 0.95, ventreClair: 0.55, joueClaire: 0.1,
      profil: 'tanche', anatomie: 'tanche' },
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
      profondeur: [-2.8, -1.9], combativite: [0.6, 0.9], agressivite: [0.6, 0.95], style: 'aspirateur', ...ROBE_CARASSIN },   // robe mesurée : carassin.js
    { id: 'perche', nom: 'Perche', form: 'bossu', cm: [10, 45], k: 1.4, abondance: 7,
      profondeur: [-2.6, -1.5], combativite: [0.7, 1.05], agressivite: [0.9, 1.25], style: 'teigneux',
      // Couleurs : médianes PIL sur assets/references/perche.jpg (dos et flanc), ventre au 80e
      // centile ; dos olive sombre, flanc vert-gris, ventre blanc verdâtre, tête jaune-olive.
      couleur: 0x728660, dos: 0x38442d, ventre: 0xc0c4a4, tete: 0x9aa65f, oeil: 0x8c7a34,
      ombreDos: 0.55, ventreClair: 0.7,
      // Nageoires : pelviennes et anale orange-rouge, pectorales ambrées, dorsales vert très
      // sombre aux rayons pâles, caudale verdâtre en haut, rougeâtre en bas.
      nageoires: 0x6a7058, nageoiresMotif: 'perche',
      nageoiresCouleurs: { dorsale: 0x5c7a66, dorsale2: 0x4f6e5c, anale: 0x9c5a3c, pectorale: 0x9c9468,
          pelvienne: 0xb8562e, caudale: [0x58806a, 0x8a5636] },
      // Robe : fines écailles peu contrastées, 5 barres sombres (t = position le long du corps,
      // largeur en fraction de LS, inclinaison vers l'arrière, profondeur d = part de la hauteur).
      motif: 'rayures', ecailles: 62, contrasteEcailles: 0.4, irregulariteEcailles: 0.25, ecaillesVentre: 0.5,
      debutEcailles: 0.2, fonduTete: 0.5, tachesJoue: 5,
      rayures: [{ t: 0.305, large: 0.05, pente: 0.04, d: 0.8 }, { t: 0.43, large: 0.062, pente: 0.047, d: 0.86 },
          { t: 0.585, large: 0.09, pente: 0.047, d: 0.93 }, { t: 0.76, large: 0.05, pente: 0.015, d: 0.88 },
          { t: 0.89, large: 0.042, pente: 0.035, d: 0.86 }],
      profil: 'perche', anatomie: 'perche' },
    { id: 'chevesne', nom: 'Chevesne', form: 'fusiforme', cm: [12, 70], k: 1.2, abondance: 5, profondeur: [-1.8, -0.8], combativite: [0.8, 1.15], agressivite: [0.9, 1.25], style: 'fonceur', ...ROBE_CHEVESNE },   // robe mesurée : chevesne.js
    { id: 'brochet', nom: 'Brochet', form: 'torpille', cm: [25, 130], k: 0.9, abondance: 3,
      profondeur: [-2.2, -1.0], combativite: [0.9, 1.25], agressivite: [1.25, 1.6], style: 'fonceur',
      // Brochet typique (la photo, sujet d'aquarium très pâle, est beige) : dos vert-olive
      // foncé, flancs olive, ventre blanc-jaune ; taches jaune pâle ; nageoires orange-brun.
      couleur: 0x66723f, dos: 0x38421f, ventre: 0xe4dfb4, tete: 0x56603a, teinteMotif: 0xe6dc96, nageoires: 0x9a6a40,
      nageoiresMotif: 'brochet', oeil: 0xcfa62e, motif: 'tachesClaires', profil: 'brochet', anatomie: 'brochet',
      ombreDos: 0.55, ventreClair: 0.85, fonduTete: 0.6, tachesDebut: 0.35, tachesDensite: 1.5, tachesTaille: 0.75, joueClaire: 0.03 },
    { id: 'sandre', nom: 'Sandre', form: 'torpille', cm: [20, 110], k: 0.8, abondance: 2,
      profondeur: [-3.4, -2.4], combativite: [0.85, 1.15], agressivite: [1.1, 1.45], style: 'glisseur',
      // Couleurs : médianes PIL sur assets/references/sandre.jpg (flanc, joue, nageoires), ventre au
      // 80e centile ; dos olive-gris sombre piqueté, flanc vert-gris, ventre vert très pâle, joue et
      // opercule argent bleuté, nageoires translucides olive (pectorales et pelviennes bleu-vert pâle).
      couleur: 0x72866d, dos: 0x4a5a45, ventre: 0xa4bc9c, tete: 0x8db3ad, nageoires: 0x8f9880, oeil: 0xb4cccd,
      nageoiresMotif: 'sandre',
      nageoiresCouleurs: { dorsale: 0x7a8566, dorsale2: 0x8a9378, anale: 0x929882, pectorale: 0xa8c8b0,
          pelvienne: 0xa0c0b4, caudale: [0x8c9680, 0x8c9680] },
      // Robe : points sombres un par écaille (dos et haut du flanc, effacés vers le ventre), 9 barres
      // verticales très discrètes (t = place le long du corps, large = largeur en fraction de LS,
      // pente = inclinaison vers l'arrière, d = profondeur atteinte), joue argentée sans limite nette.
      motif: 'barres', ecailles: 78, pointsEcailles: 0.42, forceRayures: 0.2, debutEcailles: 0.27, fonduTete: 0.7,
      ombreDos: 0.7, ventreClair: 0.75, joueClaire: 0.08,
      barres: [{ t: 0.335, large: 0.034, pente: 0.03, d: 0.5 }, { t: 0.4, large: 0.04, pente: 0.03, d: 0.58 },
          { t: 0.47, large: 0.036, pente: 0.03, d: 0.52 }, { t: 0.54, large: 0.042, pente: 0.032, d: 0.6 },
          { t: 0.61, large: 0.038, pente: 0.03, d: 0.55 }, { t: 0.68, large: 0.044, pente: 0.03, d: 0.6 },
          { t: 0.75, large: 0.036, pente: 0.025, d: 0.54 }, { t: 0.82, large: 0.04, pente: 0.025, d: 0.56 },
          { t: 0.895, large: 0.032, pente: 0.02, d: 0.5 }],
      profil: 'sandre', anatomie: 'sandre' },
    { id: 'black-bass', nom: 'Black-bass', form: 'bossu', cm: [15, 60], k: 1.6, abondance: 2,
      profondeur: [-2.4, -1.3], combativite: [0.9, 1.2], agressivite: [1.1, 1.5], style: 'fonceur', ...ROBE_BLACK_BASS },
    { id: 'truite', nom: 'Truite', form: 'fusiforme', cm: [15, 80], k: 1.2, abondance: 2,
      profondeur: [-2.2, -1.0], combativite: [0.8, 1.15], agressivite: [1.0, 1.35], style: 'fonceur',
      // Couleurs : médianes PIL sur assets/references/truite.jpg (fario sur fond noir, photo sombre) :
      // dos brun-olive (#77634b), flanc gris-brun doré (#7f6e61 → #8b7c71 au 80e centile), joue dorée
      // (#b8a487), ventre au 80e centile (#998c80) un peu éclairci (le bas du ventre est dans l'ombre) ;
      // nageoires brun-ambre translucides (dorsale presque noire), iris gris-doré.
      couleur: 0x8b7a67, dos: 0x5c4b33, ventre: 0xc2b8a0, tete: 0xa8946f, nageoires: 0x6b5c45, oeil: 0xb9a888,
      nageoiresMotif: 'truite',
      nageoiresCouleurs: { dorsale: 0x4e4538, adipeuse: 0x7a5a3c, anale: 0x8a7a5c, pectorale: 0x8a7656,
          pelvienne: 0x94835f, caudale: [0x6a5c48, 0x75604a] },
      // Robe : points noirs (dos et haut du flanc, quelques-uns sur l'ouïe) et points rouges à halo clair
      // (milieu du flanc, de l'ouïe à la queue), semis irrégulier ; pas de barres.
      motif: 'pointsRouges', pointsNoirs: 150, pointsRouges: 50, ombreDos: 0.7, ventreClair: 0.85, fonduTete: 0.2, joueClaire: 0,
      profil: 'truite', anatomie: 'truite' },
    { id: 'anguille', nom: 'Anguille', form: 'anguille', cm: [30, 130], k: 0.2, abondance: 2,
      profondeur: [-3.4, -2.6], combativite: [1.0, 1.4], agressivite: [1.1, 1.5], style: 'glisseur',
      // Couleurs de assets/references/anguille.jpg (phase jaune) : dos olive très sombre, flanc
      // olive jaunâtre, ventre jaune pâle (80e centile, l'ombre de la photo l'assombrit), gorge verdâtre.
      // Nageoires dorsale/anale/caudale olive translucide, pectorale pâle. Peau lisse, sans écailles.
      couleur: 0x585a38, dos: 0x2f3020, ventre: 0xa4a67e, tete: 0x5a5e40, nageoires: 0x4a4727, oeil: 0x6a5a26,
      nageoiresMotif: 'anguille',
      nageoiresCouleurs: { dorsale: 0x4a4727, anale: 0x58542f, pectorale: 0xa5a276, caudale: [0x4a4727, 0x4a4727] },
      motif: 'peauLisse', ombreDos: 0.6, ventreClair: 0.7, fonduTete: 0.1, joueClaire: 0.1, rondeur: 0.02,
      profil: 'anguille', anatomie: 'anguille' },
    { id: 'silure', nom: 'Silure', form: 'barbu', cm: [60, 220], k: 1.0, abondance: 1,
      profondeur: [-3.4, -2.6], combativite: [1.1, 1.5], agressivite: [1.2, 1.55], style: 'lourd',
      // Couleurs de assets/references/silure.jpg (médianes PIL par zones ; photo sombre et verdâtre) :
      // dos gris-vert très foncé (#2a2c2b), flanc gris-olive (#5a5d53) semé de petites taches pâles
      // (#92978b), ventre et gorge clairs (80e centile #949b8a / #c8ccac), tête (#3e443f), nageoires
      // gris-brun translucides, barbillons chair-brun clair. Peau sans écailles : marbrures.
      couleur: 0x4a5750, dos: 0x1f2926, ventre: 0xa0aa9b, tete: 0x37433c, teinteMotif: 0x95a095, nageoires: 0x363a33,
      nageoiresMotif: 'silure',
      nageoiresCouleurs: { dorsale: 0x363a33, anale: 0x43463c, pectorale: 0x4a4d44, pelvienne: 0x4a4d44,
          caudale: [0x2e322d, 0x2e322d] },
      oeil: 0x8f8a58, barbillonsCouleur: 0xa98d6f, motif: 'marbrures', ombreDos: 0.6, ventreClair: 0.85,
      fonduTete: 0.15, joueClaire: 0, rondeur: 0.045, profil: 'silure', anatomie: 'silure' }
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
//   bord      : vrai = PETIT POISSON DE BORD : il vit dans la bande de rive (poissons.js, BANDE_BORD).
// ---------------------------------------------------------------------------
export const COMPORTEMENTS = {
    gardon:   { couche: 'mi-eau',  banc: [4, 6], cohesion: 0.9, croisiere: 1.3, pointe: 3.6, virage: 1.6, domaine: 14, vue: 6.0, humeur: 'errant', substrats: ['sable', 'herbier'], bord: true },
    rotengle: { couche: 'surface', banc: [3, 5], cohesion: 0.8, croisiere: 1.2, pointe: 3.4, virage: 1.5, domaine: 12, vue: 6.0, humeur: 'errant', substrats: ['herbier'], bord: true },
    ablette:  { couche: 'surface', banc: [5, 8], cohesion: 1.0, croisiere: 2.2, pointe: 4.8, virage: 2.4, domaine: 18, vue: 5.5, humeur: 'errant', substrats: ['sable'], bord: true },
    goujon:   { couche: 'fond',    banc: [3, 5], cohesion: 0.8, croisiere: 0.8, pointe: 3.0, virage: 1.8, domaine: 8,  vue: 4.0, humeur: 'fouille', substrats: ['sable'], bord: true },
    breme:    { couche: 'fond',    banc: [3, 5], cohesion: 0.7, croisiere: 1.0, pointe: 3.0, virage: 1.0, domaine: 20, vue: 4.5, humeur: 'fouille', substrats: ['vase'] },
    tanche:   { couche: 'fond',    banc: [1, 1], cohesion: 0,   croisiere: 0.5, pointe: 2.6, virage: 0.9, domaine: 9,  vue: 3.5, humeur: 'fouille', nocturne: true, substrats: ['vase'], bord: true },
    carpe:    { couche: 'fond',    banc: [1, 3], cohesion: 0.5, croisiere: 0.9, pointe: 4.0, virage: 0.9, domaine: 16, vue: 4.5, humeur: 'fouille', substrats: ['vase'] },
    carassin: { couche: 'fond',    banc: [2, 4], cohesion: 0.6, croisiere: 0.8, pointe: 3.0, virage: 1.1, domaine: 10, vue: 4.0, humeur: 'fouille', substrats: ['vase'], bord: true },
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
    // Anguille jaune : anguille.jpg (poisson enroulé, tête relevée, donc mesures prises sur le
    // corps visible : diamètre max ≈ 4 % de la longueur, tête ≈ moitié du diamètre maximal à
    // l'œil, queue effilée). Section quasi ronde, un peu comprimée vers la queue.
    anguille: [
        { t: 0, h: 0.0035, w: 0.0035, y: -0.0015 }, { t: 0.012, h: 0.0075, w: 0.0085, y: -0.0008 },
        { t: 0.03, h: 0.0108, w: 0.0115, y: 0 }, { t: 0.055, h: 0.0132, w: 0.0135, y: 0.0005 },
        { t: 0.09, h: 0.0158, w: 0.0158, y: 0.001 }, { t: 0.14, h: 0.0182, w: 0.0178, y: 0.001 },
        { t: 0.25, h: 0.02, w: 0.019, y: 0.0008 }, { t: 0.45, h: 0.021, w: 0.019, y: 0 },
        { t: 0.65, h: 0.02, w: 0.0175, y: 0 }, { t: 0.82, h: 0.017, w: 0.0135, y: 0 },
        { t: 0.93, h: 0.0115, w: 0.0082, y: 0 }, { t: 1, h: 0.0055, w: 0.0035, y: 0 }],
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
    // perspective grossit la tête. Retenu : tête aplatie et LARGE en bec de canard
    // (w > h, dessus presque plat n = 2,6, ventre plat nb = 3,4), corps qui
    // s'amincit régulièrement vers un pédoncule comprimé (queue haute, étroite).
    silure: [
        { t: 0, h: 0.03, w: 0.05, y: -0.004, n: 2.8, nb: 3.6 }, { t: 0.05, h: 0.046, w: 0.085, y: 0, n: 2.7, nb: 3.5 },
        { t: 0.1, h: 0.054, w: 0.097, y: 0.003, n: 2.6, nb: 3.4 }, { t: 0.15, h: 0.064, w: 0.1, y: 0.005, n: 2.4, nb: 3 },
        { t: 0.2, h: 0.072, w: 0.092, y: 0.006, n: 2.2, nb: 2.6 }, { t: 0.3, h: 0.086, w: 0.076, y: 0.004 },
        { t: 0.4, h: 0.09, w: 0.062, y: 0.002 }, { t: 0.5, h: 0.083, w: 0.05, y: 0 },
        { t: 0.6, h: 0.072, w: 0.04, y: 0 }, { t: 0.7, h: 0.062, w: 0.03, y: 0 },
        { t: 0.8, h: 0.05, w: 0.022, y: 0 }, { t: 0.9, h: 0.036, w: 0.016, y: 0 },
        { t: 1, h: 0.026, w: 0.011, y: 0 }],
    // Sandre : sandre.jpg (900 × 387, tourné à gauche, posé sur du gravier), LS = 692 px
    // (museau 57,203 → base de la caudale 748,232), contour relevé sur la photo quadrillée
    // (scripts/trace-silhouette.py sandre). Corps haut pour une torpille (0,206 LS à t = 0,4),
    // tête conique à front peu bombé, ventre presque droit, pédoncule fin (0,068 LS). Poisson vu de
    // profil : largeur estimée (≈ 0,62 × hauteur, tête plus étroite).
    sandre: [
        { t: 0, h: 0.0051, w: 0.006, y: -0.0024 }, { t: 0.05, h: 0.0351, w: 0.024, y: -0.0129 },
        { t: 0.1, h: 0.0528, w: 0.036, y: -0.0125 }, { t: 0.15, h: 0.0665, w: 0.045, y: -0.0067 },
        { t: 0.2, h: 0.0781, w: 0.052, y: -0.0002 }, { t: 0.25, h: 0.0886, w: 0.058, y: 0.0059 },
        { t: 0.3, h: 0.0969, w: 0.062, y: 0.0114 }, { t: 0.35, h: 0.1016, w: 0.064, y: 0.0161 },
        { t: 0.4, h: 0.103, w: 0.065, y: 0.019 }, { t: 0.45, h: 0.1019, w: 0.064, y: 0.0193 },
        { t: 0.5, h: 0.0994, w: 0.063, y: 0.019 }, { t: 0.55, h: 0.0925, w: 0.06, y: 0.0143 },
        { t: 0.6, h: 0.09, w: 0.058, y: 0.0139 }, { t: 0.65, h: 0.086, w: 0.055, y: 0.0128 },
        { t: 0.7, h: 0.0755, w: 0.049, y: 0.0074 }, { t: 0.75, h: 0.0651, w: 0.042, y: 0.0034 },
        { t: 0.8, h: 0.0542, w: 0.035, y: 0.0012 }, { t: 0.85, h: 0.0455, w: 0.029, y: 0.0005 },
        { t: 0.9, h: 0.0394, w: 0.025, y: 0.0016 }, { t: 0.95, h: 0.0369, w: 0.021, y: 0.0012 },
        { t: 1, h: 0.034, w: 0.018, y: 0.0005 }],
    // Perche : perche.jpg (900 × 600, tournée à gauche, queue relevée), LS = 561 px
    // (museau 158,452 → base de la caudale 705,328), contour relevé sur la photo
    // quadrillée (scripts/trace-silhouette.py perche). Corps haut (0,30 LS à t = 0,3),
    // front qui monte en pente raide jusqu'à l'origine de la dorsale, ventre presque
    // droit, pédoncule fin (0,088 LS). Poisson vu de profil : largeur estimée
    // (≈ 0,5 × hauteur, tête un peu plus étroite).
    perche: [
        { t: 0, h: 0.012, w: 0.01, y: -0.0046 }, { t: 0.05, h: 0.053, w: 0.03, y: -0.0109 },
        { t: 0.1, h: 0.0767, w: 0.043, y: -0.0113 }, { t: 0.15, h: 0.0963, w: 0.053, y: -0.0086 },
        { t: 0.2, h: 0.1181, w: 0.061, y: 0.0007 }, { t: 0.25, h: 0.1373, w: 0.07, y: 0.011 },
        { t: 0.3, h: 0.1498, w: 0.076, y: 0.0181 }, { t: 0.35, h: 0.1489, w: 0.078, y: 0.0217 },
        { t: 0.4, h: 0.1449, w: 0.077, y: 0.0257 }, { t: 0.45, h: 0.1413, w: 0.075, y: 0.0283 },
        { t: 0.5, h: 0.1359, w: 0.072, y: 0.0283 }, { t: 0.55, h: 0.1328, w: 0.069, y: 0.0261 },
        { t: 0.6, h: 0.1288, w: 0.066, y: 0.0239 }, { t: 0.65, h: 0.1244, w: 0.062, y: 0.0212 },
        { t: 0.7, h: 0.1168, w: 0.057, y: 0.0163 }, { t: 0.75, h: 0.1052, w: 0.051, y: 0.0101 },
        { t: 0.8, h: 0.0918, w: 0.044, y: 0.0047 }, { t: 0.85, h: 0.0767, w: 0.036, y: 0.0003 },
        { t: 0.9, h: 0.0606, w: 0.029, y: -0.0024 }, { t: 0.95, h: 0.0464, w: 0.023, y: -0.0015 },
        { t: 1, h: 0.0441, w: 0.019, y: -0.0002 }],
    // Truite : truite.jpg (900 × 453, fario sur fond noir, tournée à gauche, gueule entrouverte),
    // LS = 684 px (museau 78,239 → base de la caudale 762,256), contour relevé sur la photo
    // (scripts/trace-silhouette.py truite ; ventre de la tête tracé bouche fermée). Corps en
    // torpille souple : hauteur max 0,128 LS à t = 0,52, petite tête arrondie, dos presque
    // droit, pédoncule assez épais (0,053 LS). Poisson vu de profil : largeur estimée
    // (≈ 0,58 × hauteur, tête plus étroite).
    truite: [
        { t: 0, h: 0.006, w: 0.006, y: -0.0017 }, { t: 0.05, h: 0.0515, w: 0.03, y: -0.016 },
        { t: 0.1, h: 0.0767, w: 0.045, y: -0.0215 }, { t: 0.15, h: 0.0928, w: 0.055, y: -0.0222 },
        { t: 0.2, h: 0.1041, w: 0.062, y: -0.0211 }, { t: 0.25, h: 0.1103, w: 0.066, y: -0.0207 },
        { t: 0.3, h: 0.1173, w: 0.07, y: -0.0189 }, { t: 0.35, h: 0.1217, w: 0.072, y: -0.0174 },
        { t: 0.4, h: 0.125, w: 0.074, y: -0.0156 }, { t: 0.45, h: 0.1268, w: 0.075, y: -0.0138 },
        { t: 0.5, h: 0.1282, w: 0.075, y: -0.0116 }, { t: 0.55, h: 0.1282, w: 0.075, y: -0.0101 },
        { t: 0.6, h: 0.1264, w: 0.074, y: -0.012 }, { t: 0.65, h: 0.1239, w: 0.072, y: -0.0131 },
        { t: 0.7, h: 0.1202, w: 0.068, y: -0.0138 }, { t: 0.75, h: 0.1129, w: 0.062, y: -0.0138 },
        { t: 0.8, h: 0.1016, w: 0.055, y: -0.012 }, { t: 0.85, h: 0.0906, w: 0.048, y: -0.0098 },
        { t: 0.9, h: 0.0807, w: 0.042, y: -0.0072 }, { t: 0.95, h: 0.0672, w: 0.036, y: -0.0039 },
        { t: 1, h: 0.0533, w: 0.03, y: 0.0005 }],
    // Gardon : gardon.jpg (900 × 579, fond blanc, tourné à gauche), LS = 633 px (museau 78,266 →
    // base de la caudale 711,286). Contour relevé par seuil sur le fond (scripts/mesure-silhouette.py
    // gardon), dorsale et anale repliées retranchées, ventre blanc de l'arrière tracé à la main.
    // Corps haut et comprimé : hauteur max 0,276 LS à t = 0,4 ; petite tête conique (0,10 LS de
    // demi-hauteur à t = 0,10) ; dos convexe, ventre qui remonte régulièrement ; pédoncule assez
    // fin (0,076 LS). Poisson vu de profil : largeur estimée (≈ 0,46 × hauteur, tête plus étroite).
    gardon: [
        { t: 0, h: 0.014, w: 0.009, y: -0.006 }, { t: 0.05, h: 0.051, w: 0.026, y: -0.0112 },
        { t: 0.1, h: 0.073, w: 0.037, y: -0.0143 }, { t: 0.15, h: 0.088, w: 0.044, y: -0.0151 },
        { t: 0.2, h: 0.103, w: 0.05, y: -0.0143 }, { t: 0.25, h: 0.1157, w: 0.055, y: -0.0159 },
        { t: 0.3, h: 0.1259, w: 0.06, y: -0.0167 }, { t: 0.35, h: 0.1338, w: 0.063, y: -0.0183 },
        { t: 0.4, h: 0.1378, w: 0.064, y: -0.0206 }, { t: 0.45, h: 0.137, w: 0.064, y: -0.0214 },
        { t: 0.5, h: 0.1354, w: 0.063, y: -0.0199 }, { t: 0.55, h: 0.1299, w: 0.06, y: -0.0222 },
        { t: 0.6, h: 0.122, w: 0.056, y: -0.027 }, { t: 0.65, h: 0.1125, w: 0.051, y: -0.0317 },
        { t: 0.7, h: 0.1015, w: 0.046, y: -0.0333 }, { t: 0.75, h: 0.0912, w: 0.041, y: -0.0325 },
        { t: 0.8, h: 0.0809, w: 0.036, y: -0.0285 }, { t: 0.85, h: 0.0707, w: 0.031, y: -0.0214 },
        { t: 0.9, h: 0.0604, w: 0.026, y: -0.0143 }, { t: 0.95, h: 0.0493, w: 0.021, y: -0.0064 },
        { t: 1, h: 0.038, w: 0.016, y: 0 }],
    // Tanche : tanche.jpg (900 × 381, tournée à gauche), LS = 700 px (museau 35,200 → base de la caudale 735,213), contour
    // mesuré par scripts/mesure-silhouette.py tanche. Corps trapu (h max 0,16 LS à t = 0,5), museau arrondi, pédoncule épais ;
    // largeur estimée ≈ 0,6 × hauteur (vue de profil).
    tanche: [
        { t: 0, h: 0.011, w: 0.009, y: -0.008 }, { t: 0.012, h: 0.025, w: 0.02, y: -0.0095 }, { t: 0.028, h: 0.04, w: 0.027, y: -0.011 },
        { t: 0.05, h: 0.057, w: 0.034, y: -0.0126 }, { t: 0.1, h: 0.082, w: 0.048, y: -0.008 }, { t: 0.15, h: 0.102, w: 0.06, y: -0.0055 },
        { t: 0.2, h: 0.124, w: 0.073, y: 0 }, { t: 0.3, h: 0.1405, w: 0.085, y: 0.0175 }, { t: 0.4, h: 0.153, w: 0.092, y: 0.023 },
        { t: 0.5, h: 0.1595, w: 0.095, y: 0.0235 }, { t: 0.6, h: 0.148, w: 0.089, y: 0.018 }, { t: 0.7, h: 0.13, w: 0.077, y: 0.005 },
        { t: 0.8, h: 0.106, w: 0.062, y: 0.001 }, { t: 0.9, h: 0.082, w: 0.047, y: 0.007 }, { t: 1, h: 0.072, w: 0.04, y: 0.008 }],
    'black-bass': PROFIL_BLACK_BASS, chevesne: PROFIL_CHEVESNE, rotengle: PROFIL_ROTENGLE, ablette: PROFIL_ABLETTE, goujon: PROFIL_GOUJON, carassin: PROFIL_CARASSIN };   // mesurés : blackBass.js, chevesne.js, rotengle.js, ablette.js, goujon.js, carassin.js

// ANATOMIES : position des nageoires et des détails, en fractions de LS.
//   queue     : { type: fourche | breme | echancree | arrondie | silure | fine,
//                 longueur (fraction de LS au-delà du pédoncule), ecart (demi-envergure) }
//   dorsale, dorsale2, adipeuse, anale : { type, t0, t1 (base), hauteur, recul? }
//                 types : souple, haute, longue, epineuse, reculee, petite, continue,
//                 analeLongue, analeBreme, dorsaleBreme, adipeuse (voir NAGEOIRES dans modelePoisson.js)
//   pectorale : { t, y, longueur, pente (rad, + = vers le bas), forme: pointue | ronde | ovale,
//                 eventail? (ouverture des rayons en rad, défaut 0,55) }
//   pelvienne : { t, longueur, pente }
//   oeil      : { t, y, r, pupille? ('verticale') } ; bouche : { t (coin), y0 (museau), y1 (coin) }
//   bec       : { longueur, aplatissement, nez, fond, saillieMachoire, largeur, arrondi, narine? } : tête en bec
//               (avec `bouche` : fente ouverte de `epaisseur`, voir modelePoisson.js) ; operculeDoux
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
    // Anguille : dorsale et anale basses, continues jusqu'à la queue (qui les prolonge en pointe) ;
    // pas de pelviennes ; petite pectorale pâle juste derrière l'ouïe ; œil minuscule ; bouche terminale.
    anguille: {
        queue: { type: 'anguille', longueur: 0.07, ecart: 0.0153 },
        dorsale: { type: 'anguille', t0: 0.27, t1: 1, hauteur: 0.0095, recul: 0 },
        anale: { type: 'anguille', t0: 0.34, t1: 1, hauteur: 0.0085, recul: 0 },
        pectorale: { t: 0.105, y: -0.003, longueur: 0.03, pente: 0.25, forme: 'ovale', eventail: 0.6 },
        oeil: { t: 0.024, y: 0.003, r: 0.0036 },
        bouche: { t: 0.03, y0: -0.0008, y1: -0.0036, epaisseur: 0.003 },
        opercule: 0.1, contrasteOpercule: 0.05, ligneCourbe: 0.1
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
    // Brochet : œil t 0,18 (r 0,016), haut sur la tête ; gueule jusqu'à t 0,136 ;
    // ouïe t 0,354 (peu marquée) ; pectorale basse et petite t 0,335 (0,085 LS) ; pelviennes
    // t 0,613 ; dorsale et anale tout à l'arrière (t 0,82 → 0,94 et 0,80 → 0,91), couchées vers
    // la queue ; caudale 0,125 LS, échancrure modérée, lobes arrondis.
    brochet: {
        queue: { type: 'brochet', longueur: 0.125, ecart: 0.07 },
        dorsale: { type: 'dorsaleBrochet', t0: 0.821, t1: 0.944, hauteur: 0.07 },
        dorsale2: null,
        anale: { type: 'analeBrochet', t0: 0.798, t1: 0.912, hauteur: 0.058 },
        pectorale: { t: 0.335, y: -0.066, longueur: 0.085, pente: 0.5, forme: 'ovale', eventail: 0.8 },
        pelvienne: { t: 0.613, longueur: 0.075, pente: 0.35, forme: 'ronde' },
        oeil: { t: 0.18, y: 0.03, r: 0.0155, pupille: 'verticale' },
        // Bec de canard : museau épais et aplati (dessus et dessous en droites), fente de
        // gueule jusqu'à t 0,155 (épaisseur `epaisseur` au bout, 0 au coin), mâchoire
        // inférieure qui dépasse de `saillieMachoire`, narines sur le dessus.
        bec: { longueur: 0.16, aplatissement: 1, nez: 0.012, fond: -0.03, saillieMachoire: 0.009,
            largeur: 0.55, arrondi: 0.05, narine: { t: 0.085, ecart: 0.5, rayon: 0.0055 } },
        // Avec un bec, la ligne de bouche suit le sommet « lèvre » de la section (y0 et y1 y servent
        // seulement de repère) ; `epaisseur` = ouverture de la fente au bout du museau.
        bouche: { t: 0.155, y0: -0.013, y1: -0.022, epaisseur: 0.012 },
        opercule: 0.354, ligneCourbe: 0.2, contrasteOpercule: 0.18, operculeDoux: true
    },
    // Silure : mêmes photo et repère que le profil. Œil minuscule, haut et en arrière sur la tête
    // plate (t 0,1) ; gueule large et terminale, coin sous l'œil ; 1 paire de grands barbillons
    // maxillaires (0,28 LS, courbes) + 2 paires courtes sous le menton ; dorsale minuscule très en
    // avant (t 0,265 → 0,3) ; pectorales sombres sur l'ouïe (0,10 LS, éventail arrondi) ; pelviennes
    // petites (t 0,40) ; anale = membrane basse continue de t 0,45 à 0,995 qui rejoint la caudale ;
    // caudale petite et arrondie, sans angle (queue de type `silure`).
    silure: {
        queue: { type: 'silure', longueur: 0.1, ecart: 0.062 },
        dorsale: { type: 'petite', t0: 0.265, t1: 0.3, hauteur: 0.03 },
        anale: { type: 'analeSilure', t0: 0.45, t1: 0.995, hauteur: 0.05, ondule: 0.1 },
        pectorale: { t: 0.2, y: -0.04, longueur: 0.1, pente: 0.6, forme: 'ovale', eventail: 0.6 },
        pelvienne: { t: 0.4, longueur: 0.05, pente: 0.3, forme: 'ronde' },
        oeil: { t: 0.1, y: 0.04, r: 0.0055 },
        bouche: { t: 0.1, y0: -0.008, y1: -0.022, epaisseur: 0.006 },
        opercule: 0.19, contrasteOpercule: 0, ligneCourbe: 0.3,
        barbillons: [{ t: 0.06, y: -0.014, longueur: 0.28, chute: 0.6, ecart: 0.6, rayon: 0.0034, ondule: 0.06 },
            { t: 0.05, y: -0.036, longueur: 0.075, chute: 1.3, ecart: 0.3, rayon: 0.0027, ondule: 0.07 },
            { t: 0.08, y: -0.04, longueur: 0.06, chute: 1.3, ecart: 0.4, rayon: 0.0027, ondule: 0.07 }]
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
    // Perche : mêmes photo et repère que le profil. Œil t 0,109 (r 0,027) à mi-hauteur de
    // la tête ; gueule oblique, coin sous l'œil (t 0,10) ; ouïe t 0,29 ; 1re dorsale
    // épineuse t 0,30 → 0,67 (0,155 LS, trapèze haut) ; 2e dorsale t 0,69 → 0,905
    // (0,13 LS, couchée vers l'arrière) ; pectorale t 0,31 (0,18 LS, éventail ambré) ;
    // pelviennes t 0,36 (0,19 LS, rouges) ; anale t 0,72 → 0,865 (0,095 LS) ; caudale
    // 0,215 LS, légère échancrure, lobes pointus.
    perche: {
        queue: { type: 'perche', longueur: 0.215, ecart: 0.13 },
        dorsale: { type: 'dorsalePerche', t0: 0.3, t1: 0.668, hauteur: 0.155, recul: 0.18 },
        dorsale2: { type: 'dorsale2Perche', t0: 0.688, t1: 0.905, hauteur: 0.13, recul: 0.5 },
        anale: { type: 'analePerche', t0: 0.72, t1: 0.865, hauteur: 0.095, recul: 0.7 },
        pectorale: { t: 0.305, y: -0.04, longueur: 0.17, pente: 0.3, forme: 'ventail', eventail: 0.8 },
        pelvienne: { t: 0.35, longueur: 0.235, pente: -0.05, ecart: 0.8, forme: 'pointue' },
        oeil: { t: 0.109, y: 0.005, r: 0.027 },
        bouche: { t: 0.1, y0: -0.01, y1: -0.06, epaisseur: 0.005 },
        opercule: 0.29, ligneCourbe: 0.45, contrasteOpercule: 0.1
    },
    // Sandre : mêmes photo et repère que le profil. Œil gros et vitreux t 0,092 (r 0,021) ; gueule
    // large, coin sous l'arrière de l'œil (t 0,113) ; ouïe t 0,30 (plaque argentée, bord peu marqué) ;
    // 1re dorsale épineuse t 0,347 → 0,622, repliée (0,05 LS) ; 2e dorsale souple t 0,666 → 0,921
    // (0,064 LS, rayons couchés vers l'arrière) ; anale basse t 0,731 → 0,86 ; pectorale pâle t 0,319
    // (0,115 LS) ; pelviennes t 0,355 (0,105 LS) ; caudale 0,155 LS, bord arrière presque droit
    // (échancrure ≈ 10 %), coins arrondis, hauteur 0,11 LS.
    sandre: {
        queue: { type: 'sandre', longueur: 0.155, ecart: 0.056 },
        dorsale: { type: 'dorsaleSandre', t0: 0.347, t1: 0.622, hauteur: 0.05 },
        dorsale2: { type: 'dorsale2Sandre', t0: 0.666, t1: 0.921, hauteur: 0.064 },
        anale: { type: 'analeSandre', t0: 0.731, t1: 0.86, hauteur: 0.03 },
        pectorale: { t: 0.319, y: -0.02, longueur: 0.115, pente: 0.42, forme: 'ovale', eventail: 0.6 },
        pelvienne: { t: 0.355, longueur: 0.105, pente: 0.15, ecart: 0.5, forme: 'pointue' },
        oeil: { t: 0.092, y: 0.004, r: 0.021 },
        bouche: { t: 0.113, y0: -0.006, y1: -0.05, epaisseur: 0.006 },
        opercule: 0.3, ligneCourbe: 0.3, contrasteOpercule: 0.03
    },
    tanche: {
        queue: { type: 'echancree', longueur: 0.22, ecart: 0.13 },
        dorsale: { type: 'souple', t0: 0.42, t1: 0.58, hauteur: 0.12 },
        barbillons: [{ t: 0.03, y: -0.02, longueur: 0.03, chute: 0.8, ecart: 0.25, rayon: 0.002 }]
    },
    // Truite : mêmes photo et repère que le profil. Œil moyen t 0,117 (r 0,024) ; gueule grande,
    // coin sous l'arrière de l'œil (t 0,145) ; ouïe t 0,29 ; dorsale courte et haute t 0,548 → 0,79
    // (0,125 LS, bord avant oblique, pointe vers t 0,67, bord arrière qui retombe) ; adipeuse
    // minuscule t 0,89 → 0,96 ; anale basse t 0,83 → 0,955 (0,05 LS) ; pectorale basse t 0,30
    // (0,20 LS, éventail ambré) ; pelviennes t 0,635 plaquées sous le ventre (0,14 LS) ;
    // caudale 0,14 LS, bord arrière presque droit (tronquée), hauteur 0,21 LS.
    truite: {
        queue: { type: 'truite', longueur: 0.14, ecart: 0.105 },
        dorsale: { type: 'dorsaleTruite', t0: 0.548, t1: 0.79, hauteur: 0.125, recul: 0.95 },
        adipeuse: { type: 'adipeuse', t0: 0.9, t1: 0.955, hauteur: 0.026 },
        anale: { type: 'analeTruite', t0: 0.83, t1: 0.955, hauteur: 0.052, recul: 0.6 },
        pectorale: { t: 0.3, y: -0.115, longueur: 0.2, pente: 0.62, forme: 'ovale', eventail: 0.8 },
        pelvienne: { t: 0.635, longueur: 0.14, pente: -0.15, ecart: 0.95, forme: 'ovale' },
        oeil: { t: 0.117, y: 0.003, r: 0.024 },
        bouche: { t: 0.145, y0: -0.004, y1: -0.045, epaisseur: 0.008 },
        opercule: 0.29, ligneCourbe: 0.3, contrasteOpercule: 0.1
    },
    // Gardon : mêmes photo et repère que le profil. Œil moyen t 0,076 (r 0,026), orange-rouge ; bouche
    // terminale, coin sous l'avant de l'œil (t 0,045) ; ouïe t 0,21 ; dorsale courte, couchée sur le
    // dos, t 0,52 → 0,725 (0,065 LS) ; anale basse t 0,745 → 0,845 (0,062 LS, couchée vers la queue) ;
    // pectorale t 0,224 (0,16 LS, lancéolée, jaune pâle) ; pelviennes t 0,524 (0,105 LS, orange vif) ;
    // caudale 0,235 LS, fourche profonde (échancrure ≈ 40 %), lobes pointus, lobe du bas plus long.
    gardon: {
        queue: { type: 'gardon', longueur: 0.235, ecart: 0.095 },
        dorsale: { type: 'dorsaleGardon', t0: 0.52, t1: 0.7, hauteur: 0.05, recul: 0.8 },
        anale: { type: 'analeGardon', t0: 0.745, t1: 0.82, hauteur: 0.05, recul: 0.8 },
        pectorale: { t: 0.224, y: -0.09, longueur: 0.13, pente: 0.36, forme: 'ovale', eventail: 0.35 },
        pelvienne: { t: 0.524, longueur: 0.105, pente: 0.3, ecart: 0.5, forme: 'pointue' },
        oeil: { t: 0.076, y: -0.004, r: 0.024 },
        bouche: { t: 0.045, y0: -0.002, y1: -0.027, epaisseur: 0.004 },
        opercule: 0.21, ligneCourbe: 1.3, contrasteOpercule: 0.08
    },
    // Tanche : même photo. Œil petit et haut, bouche terminale + minuscule barbillon, dorsale courte et arrondie (t 0,53 → 0,69),
    // anale rabattue (0,76 → 0,865), pectorale sombre, caudale presque rectangulaire (0,19 LS).
    tanche: {
        queue: { type: 'tanche', longueur: 0.19, ecart: 0.104 },
        dorsale: { type: 'dorsaleTanche', t0: 0.529, t1: 0.689, hauteur: 0.1, recul: 0.6 },
        anale: { type: 'analeTanche', t0: 0.76, t1: 0.865, hauteur: 0.07, recul: 1.5 },
        pectorale: { t: 0.217, y: -0.085, longueur: 0.15, pente: 0.4, forme: 'ovale', eventail: 0.5 },
        pelvienne: { t: 0.5, longueur: 0.13, pente: 0.5, forme: 'ronde' },
        oeil: { t: 0.079, y: 0.017, r: 0.0135 }, bouche: { t: 0.028, y0: -0.012, y1: -0.034, epaisseur: 0.004 },
        opercule: 0.22, ligneCourbe: 0.3, contrasteOpercule: 0.08, barbillons: [{ t: 0.028, y: -0.032, longueur: 0.03, chute: 0.9, ecart: 0.25, rayon: 0.0032 }]
    },
    'black-bass': ANATOMIE_BLACK_BASS, chevesne: ANATOMIE_CHEVESNE, rotengle: ANATOMIE_ROTENGLE, ablette: ANATOMIE_ABLETTE, goujon: ANATOMIE_GOUJON, carassin: ANATOMIE_CARASSIN };   // mesurées : blackBass.js, chevesne.js, rotengle.js, ablette.js, goujon.js, carassin.js

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

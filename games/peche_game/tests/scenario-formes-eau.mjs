// ---------------------------------------------------------------------------
// Scénario : LA FORME DE L'EAU SUIT LE BIOTOPE (dimensions.js `FORMES`, environnement.js `setRayonMonde(rayon, forme)`).
//
// Quatre profils de contour, tous RADIAUX (rayonEtang(angle) autour d'un centre : une seule rive par rayon) :
//   etang   (plaine, carnassiers, forêt) : le contour d'origine ;
//   lac     (montagne) : superellipse 1,5 : 1, exposant 2,4, quatre anses ;
//   canal   (canal)    : 5 : 1, exposant 7, berges presque parallèles ;
//   riviere (rivière)  : 3,5 : 1, exposant 2,8, un méandre.
//  1) profils purs (dimensions.js) : rapports, berges, méandre, anses, surfaces, extents ;
//  2) la PLAINE est le monde v239 au bit près (contour, surface, fosses, centre, cadre, décor, obstacles, fonds,
//     maillages), aussi après un tour par tous les profils ;
//  3) chaque forme dans le jeu : géométrie, fosses, postes, obstacles, ponton, barque, cartes, grille des fonds
//     rectangulaire, décor à bonne distance de l'eau, maillages de l'eau et de la rive, poissons répartis ;
//  4) retour en plaine : tout redevient identique, bit à bit.
//
// Le monde est laissé en plaine à la fin.
// ---------------------------------------------------------------------------
import { milieuParId, formeDe, IDS_MILIEUX } from '../milieux.js';
import {
    FORMES, IDS_FORMES, HARMONIQUES, facteurContour, rayonContour, coefficientSurface, COEFFICIENT_SURFACE,
    surfaceUnites, surfaceHectares, extents, echelleExtent, echelleAxes, angleSurForme, angleParSurface, angleParBord,
    pointAuBord, formeConnue, RAYON_REFERENCE, porteeLancer, porteeAmorce
} from '../dimensions.js';
import { instantane, empreinteNombres } from './instantane-plaine.mjs';
import { group, check, checkEqual, checkClose, G, el, fire, resetToIdle } from './harness.mjs';
import { suivreProfil, profilParDefaut, GRAINE_TEMOIN } from './profil-monde.mjs';

const cap = function (id) { return id[0].toUpperCase() + id.slice(1); };
const DEUX_PI = Math.PI * 2;

// Biotope qui porte chaque profil dans le jeu (milieux.js).
const BIOTOPES = { etang: 'carnassiers', lac: 'montagne', canal: 'canal', riviere: 'riviere' };

// ---------------------------------------------------------------------------
// RÉFÉRENCE v239 : instantané de la plaine tel que le produit origin/main (43cc298), c'est-à-dire AVANT les formes
// d'eau (tests/instantane-plaine.mjs exécuté sur cette version). Toute différence, même d'un bit, est une régression.
//
// ATTENDU MODIFIÉ (formes tirées d'une graine, v244) : le monde de la plaine est maintenant l'étang de la GRAINE, donc ces
// constantes ne décrivent plus le monde du jeu. Elles restent vraies pour le style PAR DÉFAUT (sans graine) : les valeurs
// pures (contour, surface, extents, portées) sont vérifiées dessus dans `profilsPurs`. Dans le jeu, la plaine est comparée à
// elle-même (`REFERENCE_PLAINE` : instantané de la plaine de la graine témoin, pris avant le tour par tous les profils).
// ---------------------------------------------------------------------------
const REFERENCE_V239 = {
    contour720: 'f158c7ca',
    contourSud: 86.35386136723558,
    centre: '0,-71',
    fosses: '[{"x":-28,"z":-95,"rayon":22,"plus":3.6},{"x":30,"z":-53,"rayon":18,"plus":3.3},{"x":4,"z":-123,"rayon":16,"plus":3.8}]',
    rayon: 90,
    rayonMax: 109.8,
    surfaceHa: 0.6413414140147925,
    profondeurMax: 8.14,
    rayonCadre: 117.8,
    porteeLancer: 52,
    porteeAmorce: 46,
    cameraFar: 900,
    brume: '150,480',
    ciel: 520,
    monde3D: 260,
    pasBateauMarge: 2.4,
    relief: 'afb69591',
    decor: 'e2d11c44',
    decorCompte: '59,40,70,24',
    obstacles: '8d339330',
    obstaclesCompte: 12,
    fonds: '66ddb652:70',
    fondsGrille: '230x230 pas 1 côté 230',
    eau: 'b975a69b',
    eauProfondeur: '11e77e5',
    fond: '8339b58',
    fondUV: '59016d15',
    rive: '6ef70b19',
    pecheur: '-4.018820002489201,18.418745055384722'
};

function choisirSurAccueil(id) {
    el('accueilMilieu' + cap(id)).checked = true;
    fire('accueilMilieu' + cap(id), 'change');
    suivreProfil(G());   // formes tirées d'une graine : dimensions.js (tests) calcule sur le plan d'eau du jeu
}

// Instantané de la plaine de la graine témoin (pris avant le tour par tous les profils).
let REFERENCE_PLAINE = null;

/** Distance au centre et angle d'un point, et rayon du contour dans cette direction. */
function polaire(p, centre) {
    const dx = p.x - centre.x;
    const dz = p.z - centre.z;
    const angle = Math.atan2(dz, dx);
    return { distance: Math.hypot(dx, dz), angle: angle, contour: G().getRayonEtang(angle) };
}

/** Distance (unités) d'un point au contour réel, mesurée sur 1 440 points du contour (la vraie distance à l'eau). */
function distanceAuContour(p, centre) {
    let mini = Infinity;
    for (let k = 0; k < 1440; k++) {
        const a = (k / 1440) * DEUX_PI;
        const r = G().getRayonEtang(a);
        mini = Math.min(mini, Math.hypot(p.x - (centre.x + Math.cos(a) * r), p.z - (centre.z + Math.sin(a) * r)));
    }
    return mini;
}

/** Aire (unités²) d'un contour polaire r(θ) : ∫ r²/2 dθ, par 20 000 tranches (plus fin que dimensions.js : 2 000). */
function aire(rayonDe) {
    const n = 20000;
    let total = 0;
    for (let i = 0; i < n; i++) { const r = rayonDe(((i + 0.5) / n) * DEUX_PI); total += r * r / 2 * (DEUX_PI / n); }
    return total;
}

// Points du contour d'un profil de rayon 1 (pour mesurer les berges : x et z de chaque point).
function contourUnitaire(forme, n) {
    const points = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * DEUX_PI;
        const r = facteurContour(a, forme);
        points.push({ x: r * Math.cos(a), z: r * Math.sin(a) });
    }
    return points;
}

// Berges à la hauteur z (fraction du plus grand extent z) : { est, ouest } = plus grand et plus petit x des points proches.
function bergesA(points, z, tolerance) {
    let est = -Infinity;
    let ouest = Infinity;
    points.forEach(function (p) {
        if (Math.abs(p.z - z) < tolerance) { est = Math.max(est, p.x); ouest = Math.min(ouest, p.x); }
    });
    return { est: est, ouest: ouest, largeur: est - ouest, axe: (est + ouest) / 2 };
}

function profilsPurs() {
    group('79a) Formes d’eau : les profils (dimensions.js)');
    profilParDefaut();   // style par défaut (sans graine) : le profil du jeu est suivi plus bas, biotope par biotope
    checkEqual('quatre profils : étang, lac, canal, rivière', IDS_FORMES.join(','), 'etang,lac,canal,riviere');
    checkEqual('formeConnue : oui pour les quatre, non pour le reste',
        IDS_FORMES.every(formeConnue) && !formeConnue('mare') && !formeConnue(undefined) && !formeConnue('toString'), true);
    checkEqual('lac : allongement 1,5, exposant 2,4, 4 harmoniques', [FORMES.lac.allongement, FORMES.lac.exposant, FORMES.lac.harmoniques.length].join(' '), '1.5 2.4 4');
    checkEqual('canal : allongement 5, exposant 7, 2 harmoniques', [FORMES.canal.allongement, FORMES.canal.exposant, FORMES.canal.harmoniques.length].join(' '), '5 7 2');
    checkEqual('rivière : allongement 3,5, exposant 2,8, 4 harmoniques (1 méandre + 3 petites)',
        [FORMES.riviere.allongement, FORMES.riviere.exposant, FORMES.riviere.harmoniques.length].join(' '), '3.5 2.8 4');
    const somme = function (forme) { return FORMES[forme].harmoniques.reduce(function (t, h) { return t + h.amplitude; }, 0); };
    checkClose('lac : amplitude totale des harmoniques ≈ 0,24', somme('lac'), 0.24, 0.005);
    checkClose('canal : amplitude totale des harmoniques ≈ 0,02', somme('canal'), 0.02, 0.002);
    checkClose('rivière : méandre d’amplitude 0,22 (la plus grande harmonique)', Math.max.apply(null, FORMES.riviere.harmoniques.map(function (h) { return h.amplitude; })), 0.22, 1e-9);
    check('canal : les harmoniques sont très faibles (chacune ≤ 0,02)', FORMES.canal.harmoniques.every(function (h) { return h.amplitude <= 0.02; }));

    // L'étang est le contour d'origine, au bit près : même formule, écrite ici en clair.
    const original = function (angle) {
        let f = 1;
        [[0.105, 2, 0.6], [0.060, 3, 2.4], [0.035, 5, 4.1], [0.020, 7, 1.3]].forEach(function (h) { f += h[0] * Math.sin(h[1] * angle + h[2]); });
        return f;
    };
    let ecartEtang = 0;
    for (let k = 0; k < 720; k++) {
        const a = (k / 720) * DEUX_PI;
        ecartEtang = Math.max(ecartEtang, Math.abs(facteurContour(a, 'etang') - original(a)), Math.abs(facteurContour(a) - original(a)),
            Math.abs(rayonContour(90, a, 'etang') - 90 * original(a)), Math.abs(rayonContour(90, a) - 90 * original(a)));
    }
    checkEqual('étang : contour identique à la formule d’origine (720 angles, écart exactement 0)', ecartEtang, 0);
    // Le contour par défaut est celui de la v239, au bit près (empreinte de 720 angles, rive sud, surface, extents, portées).
    const angles720 = [];
    for (let k = 0; k < 720; k++) { angles720.push((k / 720) * DEUX_PI); }
    checkEqual('étang par défaut : empreinte du contour (720 angles) = celle de la v239', empreinteNombres(angles720.map(function (a) { return rayonContour(90, a); })), REFERENCE_V239.contour720);
    checkEqual('étang par défaut : rive sud = celle de la v239', rayonContour(90, angles720[180]), REFERENCE_V239.contourSud);
    checkEqual('étang par défaut : surface = celle de la v239', surfaceHectares(90), REFERENCE_V239.surfaceHa);
    checkEqual('étang par défaut : rayon max = celui de la v239 (109,8)', extents(90).maxX + ',' + extents(90).maxZ, REFERENCE_V239.rayonMax + ',' + REFERENCE_V239.rayonMax);
    checkEqual('étang par défaut : portées de la v239', porteeLancer(90) + ',' + porteeAmorce(90), REFERENCE_V239.porteeLancer + ',' + REFERENCE_V239.porteeAmorce);
    checkEqual('étang : harmoniques d’origine inchangées', JSON.stringify(HARMONIQUES.map(function (h) { return [h.amplitude, h.frequence, h.phase]; })),
        JSON.stringify([[0.105, 2, 0.6], [0.06, 3, 2.4], [0.035, 5, 4.1], [0.02, 7, 1.3]]));

    // Tous les profils sont étoilés : un rayon strictement positif dans toutes les directions (une seule rive par rayon).
    IDS_FORMES.forEach(function (forme) {
        let mini = Infinity;
        for (let k = 0; k < 7200; k++) { mini = Math.min(mini, facteurContour((k / 7200) * DEUX_PI, forme)); }
        check(forme + ' : rayon strictement positif dans les 7 200 directions (profil étoilé)', mini > 0.2, 'minimum ' + mini.toFixed(3));
        check(forme + ' : contour périodique (angle + 2π)', Math.abs(facteurContour(1.234, forme) - facteurContour(1.234 + DEUX_PI, forme)) < 1e-9);
    });

    // Surfaces : même coefficient pour tous (profils normalisés), égal à l'intégrale du contour.
    IDS_FORMES.forEach(function (forme) {
        const integrale = aire(function (a) { return facteurContour(a, forme); });
        checkClose(forme + ' : coefficient de surface = intégrale du contour (20 000 tranches)', coefficientSurface(forme), integrale, 1e-6 * integrale);
        checkClose(forme + ' : à rayon égal, même surface que l’étang (profil normalisé)', coefficientSurface(forme), COEFFICIENT_SURFACE, 1e-9 * COEFFICIENT_SURFACE);
        checkClose(forme + ' : surfaceHectares(180) = ∫ r² / 2 du contour de rayon 180, en hectares',
            surfaceHectares(180, forme), aire(function (a) { return rayonContour(180, a, forme); }) / 4 / 10000, 1e-4 * surfaceHectares(180, forme));
        checkClose(forme + ' : surfaceUnites = R² × coefficient', surfaceUnites(45, forme), 45 * 45 * coefficientSurface(forme), 1e-9);
    });
    checkEqual('surfaceHectares sans forme = étang (la plaine : 0,6413 ha)', surfaceHectares(90), surfaceHectares(90, 'etang'));
    checkClose('plaine : 0,6413 ha', surfaceHectares(90, 'etang'), 0.6413, 0.001);

    // Extents : plus grande distance au centre sur chaque axe.
    IDS_FORMES.forEach(function (forme) {
        const e = extents(100, forme);
        const pts = contourUnitaire(forme, 40000);
        const mx = Math.max.apply(null, pts.map(function (p) { return Math.abs(p.x); })) * 100;
        const mz = Math.max.apply(null, pts.map(function (p) { return Math.abs(p.z); })) * 100;
        if (forme === 'etang') {
            checkEqual('étang : extents = rayon × (1 + 22 %) sur les deux axes (borne d’origine)', e.maxX + ',' + e.maxZ, (100 * 1.22) + ',' + (100 * 1.22));
            check('étang : cette borne couvre le contour', mx <= e.maxX + 1e-9 && mz <= e.maxZ + 1e-9);
        } else {
            checkClose(forme + ' : extent x = plus grande largeur du contour', e.maxX, mx, 0.01 * mx);
            checkClose(forme + ' : extent z = plus grande longueur du contour', e.maxZ, mz, 0.01 * mz);
            check(forme + ' : les extents couvrent le contour (jamais en dessous du maximum mesuré)', e.maxX >= mx - 1e-9 && e.maxZ >= mz - 1e-9);
        }
        checkClose(forme + ' : extents proportionnels au rayon', extents(45, forme).maxZ * 2, extents(90, forme).maxZ, 1e-9);
    });
    checkEqual('echelleExtent de l’étang = f = rayon / 90', echelleExtent(180, 'etang'), 2);
    checkEqual('echelleAxes de l’étang = f sur les deux axes', JSON.stringify(echelleAxes(45, 'etang')), '{"x":0.5,"z":0.5}');
    check('echelleAxes d’un canal : x ≪ z', echelleAxes(45, 'canal').x < 0.25 * echelleAxes(45, 'canal').z);

    // CANAL : longueur / largeur ≥ 4, largeur quasi constante, berges parallèles.
    const canal = extents(1, 'canal');
    check('canal : longueur / largeur ≥ 4', canal.maxZ / canal.maxX >= 4, (canal.maxZ / canal.maxX).toFixed(2));
    const ptsCanal = contourUnitaire('canal', 40000);
    const largeursCanal = [];
    const estCanal = [];
    for (let k = -7; k <= 7; k++) {
        const b = bergesA(ptsCanal, (k / 10) * canal.maxZ, 0.003 * canal.maxZ);
        largeursCanal.push(b.largeur);
        estCanal.push(b.est);
    }
    const moyenne = largeursCanal.reduce(function (t, v) { return t + v; }, 0) / largeursCanal.length;
    const ecartRelatif = (Math.max.apply(null, largeursCanal) - Math.min.apply(null, largeursCanal)) / moyenne;
    check('canal : largeur quasi constante (écart < 15 % sur 70 % de la longueur)', ecartRelatif < 0.15, (ecartRelatif * 100).toFixed(1) + ' %');
    const pente = Math.max.apply(null, estCanal.map(function (x) { return Math.abs(x - estCanal[0]); })) / (1.4 * canal.maxZ);
    check('canal : berges parallèles (la rive est dérive de moins de 2 % de la longueur)', pente < 0.02, pente.toFixed(4));
    // L'exposant fait la différence : avec p = 2 (ellipse) la largeur à 70 % de la longueur tomberait à ≈ 71 % du maximum.
    const bandeCanal = bergesA(ptsCanal, 0.7 * canal.maxZ, 0.003 * canal.maxZ).largeur / bergesA(ptsCanal, 0, 0.003 * canal.maxZ).largeur;
    check('canal : à 70 % de la longueur, la largeur reste ≥ 90 % de celle du milieu (superellipse d’exposant 7)', bandeCanal >= 0.9, bandeCanal.toFixed(3));

    // RIVIÈRE : rapport ≥ 3 et méandre.
    const riviere = extents(1, 'riviere');
    check('rivière : longueur / largeur ≥ 3', riviere.maxZ / riviere.maxX >= 3, (riviere.maxZ / riviere.maxX).toFixed(2));
    const ptsRiviere = contourUnitaire('riviere', 40000);
    const axes = [];
    const largeursRiviere = [];
    for (let k = -8; k <= 8; k++) {
        const b = bergesA(ptsRiviere, (k / 10) * riviere.maxZ, 0.003 * riviere.maxZ);
        axes.push(b.axe);
        largeursRiviere.push(b.largeur);
    }
    const largeurMoyenne = largeursRiviere.reduce(function (t, v) { return t + v; }, 0) / largeursRiviere.length;
    const amplitudeMeandre = Math.max.apply(null, axes) - Math.min.apply(null, axes);
    check('rivière : MÉANDRE : l’axe du lit se déplace d’au moins 25 % de la largeur le long du grand axe',
        amplitudeMeandre >= 0.25 * largeurMoyenne, (amplitudeMeandre / largeurMoyenne * 100).toFixed(0) + ' %');
    let changements = 0;
    for (let k = 1; k < axes.length; k++) { if (axes[k] * axes[k - 1] < 0) { changements++; } }
    check('rivière : le lit passe au moins 2 fois d’un côté à l’autre de l’axe (un S, pas un simple décalage)', changements >= 2, changements + ' passages');
    const estRiviere = [];
    const ouestRiviere = [];
    for (let k = -8; k <= 8; k++) { const b = bergesA(ptsRiviere, (k / 10) * riviere.maxZ, 0.003 * riviere.maxZ); estRiviere.push(b.est); ouestRiviere.push(b.ouest); }
    check('rivière : la rive est ondule le long du grand axe (x varie de plus de 25 % de la largeur moyenne)',
        Math.max.apply(null, estRiviere) - Math.min.apply(null, estRiviere) > 0.25 * largeurMoyenne);
    check('rivière : la rive ouest ondule aussi', Math.max.apply(null, ouestRiviere) - Math.min.apply(null, ouestRiviere) > 0.25 * largeurMoyenne);
    // Les deux berges se décalent ENSEMBLE (même sens) : leur écart de largeur reste modéré devant le décalage de l'axe.
    check('rivière : les berges se décalent ensemble (la largeur varie moins que l’axe du lit n’oscille)',
        (Math.max.apply(null, largeursRiviere) - Math.min.apply(null, largeursRiviere)) < 2.5 * amplitudeMeandre);

    // LAC : largeur / longueur entre 0,55 et 0,75 ; anses (le bord s'écarte du profil lisse).
    const lac = extents(1, 'lac');
    check('lac : largeur / longueur entre 0,55 et 0,75', lac.maxX / lac.maxZ >= 0.55 && lac.maxX / lac.maxZ <= 0.75, (lac.maxX / lac.maxZ).toFixed(3));
    const lisse = function (forme) {
        // Profil lisse du même allongement et du même exposant, sans harmonique, ramené à la même surface.
        const p = FORMES[forme];
        const base = function (a) {
            const c = Math.abs(Math.cos(a));
            const s = Math.abs(Math.sin(a) / p.allongement);
            return 1 / Math.pow(Math.pow(c, p.exposant) + Math.pow(s, p.exposant), 1 / p.exposant);
        };
        const k = Math.sqrt(COEFFICIENT_SURFACE / aire(base));
        return function (a) { return k * base(a); };
    };
    const ecartType = function (forme) {
        const l = lisse(forme);
        const rapports = [];
        for (let i = 0; i < 4000; i++) { const a = (i / 4000) * DEUX_PI; rapports.push(facteurContour(a, forme) / l(a)); }
        const m = rapports.reduce(function (t, v) { return t + v; }, 0) / rapports.length;
        return Math.sqrt(rapports.reduce(function (t, v) { return t + (v - m) * (v - m); }, 0) / rapports.length);
    };
    check('lac : anses : le bord varie nettement autour du profil lisse (écart-type ≥ 0,08)', ecartType('lac') >= 0.08, ecartType('lac').toFixed(3));
    check('canal : berges nettes : le bord reste à moins de 2 % de son profil lisse (écart-type ≤ 0,02)', ecartType('canal') <= 0.02, ecartType('canal').toFixed(4));
    check('rivière : le bord varie nettement autour du profil lisse (méandre, écart-type ≥ 0,08)', ecartType('riviere') >= 0.08, ecartType('riviere').toFixed(3));
    let creuxLac = 0;
    for (let i = 1; i < 720; i++) {
        const a = (i / 720) * DEUX_PI;
        const avant = facteurContour(a - DEUX_PI / 720, 'lac');
        const apres = facteurContour(a + DEUX_PI / 720, 'lac');
        if (facteurContour(a, 'lac') < avant && facteurContour(a, 'lac') < apres) { creuxLac++; }
    }
    check('lac : plusieurs anses (au moins 3 creux dans le rayon)', creuxLac >= 3, creuxLac + ' creux');

    // Outils de répartition : identité pour l'étang, bijections croissantes sinon.
    checkEqual('angleParSurface / angleParBord / angleSurForme : identité (u × 2π) pour l’étang', [angleParSurface(0.3, 'etang'), angleParBord(0.3, 'etang'), angleParSurface(0.3)].join(),
        [0.3 * Math.PI * 2, 0.3 * Math.PI * 2, 0.3 * Math.PI * 2].join());
    checkEqual('angleSurForme d’un étang : l’angle lui-même', angleSurForme(1.234, 'etang'), 1.234);
    check('angleSurForme d’un canal : 50° devient ≈ 80° (même endroit relatif, axes 5 : 1)', Math.abs(angleSurForme(50 * Math.PI / 180, 'canal') * 180 / Math.PI - 80.5) < 0.2,
        (angleSurForme(50 * Math.PI / 180, 'canal') * 180 / Math.PI).toFixed(1));
    ['canal', 'lac', 'riviere'].forEach(function (forme) {
        let croissant = true;
        let precedent = -1;
        for (let k = 0; k < 400; k++) { const a = angleParSurface(k / 400, forme); if (!(a > precedent)) { croissant = false; } precedent = a; }
        check(forme + ' : angleParSurface est croissant sur [0, 1[', croissant);
        // Points uniformes sur la surface : la moitié des tirages tombe dans la moitié de l'aire.
        let moitie = 0;
        const tirages = 20000;
        const demiAire = aire(function (a) { return facteurContour(a, forme); }) / 2;
        for (let i = 0; i < tirages; i++) { const a = angleParSurface((i + 0.5) / tirages, forme); if (a < Math.PI) { moitie++; } }
        let aireNord = 0;
        const n = 20000;
        for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI; const r = facteurContour(a, forme); aireNord += r * r / 2 * (Math.PI / n); }
        checkClose(forme + ' : angleParSurface répartit selon l’aire (part des angles < π = part de l’aire)', moitie / tirages, aireNord / (2 * demiAire), 0.005);
    });
    // Décalage sur la normale : à d unités de la rive, mesurées perpendiculairement.
    const rCanal = function (a) { return rayonContour(45, a, 'canal'); };
    const p = pointAuBord(rCanal, 0.7, 5);
    check('pointAuBord : la normale est unitaire', Math.abs(Math.hypot(p.nx, p.nz) - 1) < 1e-9);
    const base = { x: Math.cos(0.7) * rCanal(0.7), z: Math.sin(0.7) * rCanal(0.7) };
    checkClose('pointAuBord : le point est à 5 unités du point du contour', Math.hypot(p.x - base.x, p.z - base.z), 5, 1e-9);
    check('pointAuBord : …sur la normale (perpendiculaire à la berge)', Math.abs((p.x - base.x) * p.nz - (p.z - base.z) * p.nx) < 1e-9);
}

// Orientation du trou d'eau de la plaine après un tour par tous les profils : même instantané que la référence.
function comparerPlaine(titre, instant) {
    Object.keys(REFERENCE_PLAINE).forEach(function (cle) {
        checkEqual(titre + ' : ' + cle, instant[cle], REFERENCE_PLAINE[cle]);
    });
}

function plaineIdentique() {
    group('79b) Formes d’eau : la plaine de la graine est reconstruite à l’identique, au bit près');
    // ATTENDU MODIFIÉ (graine) : la plaine est l'étang de la graine témoin ; sa référence est son propre instantané.
    G().setGraine(GRAINE_TEMOIN);
    choisirSurAccueil('plaine');
    REFERENCE_PLAINE = instantane(G());
    // Un tour par tous les profils d'abord : la plaine doit être reconstruite à l'identique, pas simplement jamais quittée.
    ['canal', 'riviere', 'montagne', 'foret', 'carnassiers'].forEach(choisirSurAccueil);
    choisirSurAccueil('plaine');
    checkEqual('plaine : monde de forme étang', G().getMonde().forme, 'etang');
    comparerPlaine('plaine après un tour par tous les profils', instantane(G()));
    // Son extent est la borne de l'étang (son plus grand rayon, la même sur x et z : un carré) ; la grille des fonds est ce carré.
    const m = G().getMonde();
    checkEqual('plaine : demi-côtés de la grille = extent + 4,5 arrondi au-dessus, sur les deux axes (carré)', m.demiCoteX + ',' + m.demiCoteZ,
        Math.ceil(m.rayonMax + 4.5) + ',' + Math.ceil(m.rayonMax + 4.5));
    checkEqual('plaine : maxX = maxZ = rayon max (borne carrée de l’étang)', m.maxX + ',' + m.maxZ, m.rayonMax + ',' + m.rayonMax);
    checkEqual('plaine : grille des fonds carrée', G().substrats.taille, G().substrats.hauteur);
}

function chaqueForme() {
    group('79c) Formes d’eau : chaque biotope dans le jeu (géométrie, fosses, postes, obstacles, barque, cartes, grille)');
    const reference = G().getEtangInfo();   // plaine (instantané précédent)
    checkEqual('plaine choisie avant de commencer', G().milieux.courant().id, 'plaine');
    const profondeurPlaine = reference.profondeurMax;
    Object.keys(BIOTOPES).forEach(function (forme) {
        const id = BIOTOPES[forme];
        const m = milieuParId(id);
        choisirSurAccueil(id);
        const monde = G().getMonde();
        const info = G().getEtangInfo();
        const centre = G().getPondCenter();
        const etiquette = id + ' (' + forme + ') : ';

        // --- Géométrie ---
        checkEqual(etiquette + 'le biotope porte le profil ' + forme, formeDe(m), forme);
        checkEqual(etiquette + 'le monde a la forme ' + forme, monde.forme, forme);
        let ecart = 0;
        for (let k = 0; k < 720; k++) {
            const a = (k / 720) * DEUX_PI;
            ecart = Math.max(ecart, Math.abs(G().getRayonEtang(a) - rayonContour(m.rayon, a, forme)));
        }
        checkEqual(etiquette + 'le contour du jeu est celui du profil (720 angles)', ecart, 0);
        const ext = extents(m.rayon, forme);
        checkEqual(etiquette + 'extents du monde = extents du profil', monde.maxX + ',' + monde.maxZ, ext.maxX + ',' + ext.maxZ);
        checkEqual(etiquette + 'rayon max = le plus grand des deux extents', monde.rayonMax, Math.max(ext.maxX, ext.maxZ));
        checkEqual(etiquette + 'demi-côtés de la grille = extent + 4,5 arrondi au-dessus', monde.demiCoteX + ',' + monde.demiCoteZ,
            Math.ceil(ext.maxX + 4.5) + ',' + Math.ceil(ext.maxZ + 4.5));
        checkClose(etiquette + 'cadre de la carte = rayon max + 8', info.rayonCadre, monde.rayonMax + 8, 1e-9);
        let largeurMesuree = 0;
        let longueurMesuree = 0;
        for (let k = 0; k < 7200; k++) {
            const a = (k / 7200) * DEUX_PI;
            largeurMesuree = Math.max(largeurMesuree, Math.abs(Math.cos(a) * G().getRayonEtang(a)));
            longueurMesuree = Math.max(longueurMesuree, Math.abs(Math.sin(a) * G().getRayonEtang(a)));
        }
        check(etiquette + 'les extents x et z couvrent le contour du jeu (7 200 directions)', monde.maxX >= largeurMesuree - 1e-9 && monde.maxZ >= longueurMesuree - 1e-9);
        check(etiquette + 'les extents ne dépassent pas de plus de 0,5 % le contour mesuré (' + (forme === 'etang' ? 'borne d’origine à 22 % ' : 'mesure exacte') + ')',
            forme === 'etang' || (monde.maxX <= largeurMesuree * 1.005 && monde.maxZ <= longueurMesuree * 1.005));
        // Surface : intégrale du contour du JEU (fenêtre de 1e-3, la surface annoncée utilise 2 000 tranches).
        const integrale = aire(function (a) { return G().getRayonEtang(a); }) / 4 / 10000;
        checkClose(etiquette + 'surface annoncée = intégrale du contour du jeu (ha)', monde.surfaceHa, integrale, 1e-3 * integrale);
        checkClose(etiquette + 'surface = celle de l’étang de même rayon (profils normalisés)', monde.surfaceHa, surfaceHectares(m.rayon, 'etang'), 1e-9);
        // Rive sud : l'ancre reste sur le contour de la forme, le poste de départ ne bouge pas.
        const depart = G().angler.position;
        const pd = polaire(depart, centre);
        checkClose(etiquette + 'le pêcheur de départ est à la même place que dans la plaine', Math.hypot(depart.x - (-4.01882), depart.z - 18.4187), 0, 1e-3);
        checkClose(etiquette + '…à 2,2 unités de la berge locale (l’ancre est sur le contour de la forme)', pd.distance - pd.contour, 2.2, 1e-6);
        checkEqual(etiquette + 'poste sud', G().getPoste().id, 'sud');

        // --- Fosses ---
        check(etiquette + 'trois fosses', info.fosses.length === 3);
        check(etiquette + 'chaque fosse est ENTIÈREMENT dans l’eau (32 points de son cercle)',
            info.fosses.every(function (fosse) {
                for (let k = 0; k < 32; k++) {
                    const a = (k / 32) * DEUX_PI;
                    const q = polaire({ x: fosse.x + Math.cos(a) * fosse.rayon, z: fosse.z + Math.sin(a) * fosse.rayon }, centre);
                    if (q.distance >= q.contour) { return false; }
                }
                return true;
            }));
        check(etiquette + 'le centre de chaque fosse est à plus de 2 unités de la vraie berge', info.fosses.every(function (fosse) { return distanceAuContour(fosse, centre) > 2; }));
        check(etiquette + 'les fosses ne se chevauchent pas', info.fosses.every(function (a, i) {
            return info.fosses.every(function (b, j) { return i === j || Math.hypot(a.x - b.x, a.z - b.z) > a.rayon + b.rayon; });
        }));
        check(etiquette + 'rayons des fosses × f, profondeurs supplémentaires inchangées', info.fosses.every(function (fosse, i) {
            return Math.abs(fosse.rayon - [22, 18, 16][i] * m.rayon / 90) < 1e-9 && fosse.plus === [3.6, 3.3, 3.8][i];
        }));
        check(etiquette + 'profondeur max ≤ 8,2 (la ligne descend à 7)', info.profondeurMax <= 8.2 && info.profondeurMax > 0.5, String(info.profondeurMax));
        // ATTENDU MODIFIÉ (profondeur selon la taille) : la profondeur suit facteurProfondeur(rayon).
        checkClose(etiquette + 'profondeur max = celle de la plaine × facteur de profondeur', info.profondeurMax,
            profondeurPlaine * monde.facteurProfondeur, 0.08);
        // Le fond reste dans l'ordre : profondeur nulle impossible, jamais plus profond que la fosse la plus creuse.
        check(etiquette + 'relief : de la cuvette au plus profond', G().profondeurLocale(centre.x, centre.z) > 4.9 * monde.facteurProfondeur
            && G().profondeurLocale(centre.x, centre.z) <= info.profondeurMax + 1e-9);

        // --- Poissons dans l'eau, bien répartis (avant resetToIdle : le harnais range alors les poissons à l'écart) ---
        check(etiquette + 'tous les poissons sont dans l’eau', G().fishes.every(function (p) { const q = polaire(p.position, centre); return q.distance < q.contour; }));
        if (forme === 'canal' || forme === 'riviere') {
            // Le long du grand axe : aucun tiers du plan d'eau n'est vide (un angle uniforme entasserait tout au milieu).
            const tiers = [0, 0, 0];
            G().fishes.forEach(function (p) {
                const t = Math.max(0, Math.min(2, Math.floor((p.position.z - (centre.z - ext.maxZ)) / (2 * ext.maxZ) * 3)));
                tiers[t]++;
            });
            const part = Math.min.apply(null, tiers) / G().fishes.length;
            check(etiquette + 'poissons : chaque tiers de la longueur en abrite au moins 15 %', part >= 0.15, tiers.join(' / ') + ' sur ' + G().fishes.length);
        }

        // --- Postes sur la rive ---
        [1, 2, 3, 0].forEach(function (i) {
            G().placerAuPoste(i);
            const q = polaire(G().angler.position, centre);
            check(etiquette + 'poste ' + G().getPoste().id + ' : sur la rive, à 2,2 unités de la berge', Math.abs(q.distance - q.contour - 2.2) < 1e-6, (q.distance - q.contour).toFixed(3));
            check(etiquette + 'poste ' + G().getPoste().id + ' : à terre, à plus de 1 unité de l’eau', distanceAuContour(G().angler.position, centre) > 1);
        });

        // --- Obstacles dans l'eau, ponton ---
        const liste = G().obstacles.liste;
        check(etiquette + 'au moins 6 obstacles posés', liste.length >= 6, liste.length + ' obstacles');
        check(etiquette + 'obstacles : le centre de chaque cercle dans l’eau est dans l’eau', liste.every(function (o) {
            return o.cercles.every(function (c) { if (!c.eau) { return true; } const q = polaire(c, centre); return q.distance <= q.contour - 1.5 + 1e-9; });
        }));
        check(etiquette + 'obstacles : chaque ouvrage a son repère (axe) sur la normale de la berge, donc perpendiculaire à la rive', liste.every(function (o) {
            const q = polaire(o.racine, centre);
            // La racine est sur le contour (d = 0) ou à d unités à l'intérieur : jamais au-delà.
            return q.distance <= q.contour + 1e-6;
        }));
        const ponton = liste.find(function (o) { return o.type === 'ponton'; });
        check(etiquette + 'le ponton est posé', !!ponton);
        if (ponton) {
            const pp = G().obstacles.pontonPoste;
            resetToIdle();
            check(etiquette + 'ponton : choisir son poste sur la carte réussit', G().choisirEmplacement(pp.axe + 0.01, 3));
            const p = G().angler.position;
            check(etiquette + 'ponton : le pêcheur est DANS l’eau, sur le plancher (à moins de 2 unités des planches)', ponton.cercles.some(function (c) { return Math.hypot(c.x - p.x, c.z - p.z) < 2; }),
                ponton.cercles.map(function (c) { return Math.hypot(c.x - p.x, c.z - p.z).toFixed(1); }).join(' '));
            check(etiquette + 'ponton : debout au niveau du plancher', Math.abs(p.y - pp.hauteur) < 0.01);
            check(etiquette + 'ponton : à plus de 8 unités de la vraie berge (10,5 sur la normale)', distanceAuContour(p, centre) > 8, distanceAuContour(p, centre).toFixed(1));
            G().placerAuPoste(0);
        }

        // --- Barque ---
        G().recommencerPartie();
        G().setExperience(G().getBateauPrix());
        G().acheterBateau();
        resetToIdle();
        checkEqual(etiquette + 'on embarque', G().embarquerBateau(), true);
        let toujoursDansLEau = polaire(G().angler.position, centre).distance < polaire(G().angler.position, centre).contour;
        const f = m.rayon / 90;
        [[0, -2.4], [0.12, 0], [-0.12, 0], [0, 2.4], [0.2, 1], [-0.2, -1]].forEach(function (pas) {
            for (let i = 0; i < 70; i++) {
                G().deplacerBateau(pas[0], pas[1] * Math.max(0.5, f));
                const q = polaire(G().angler.position, centre);
                if (!(q.distance < q.contour - 1)) { toujoursDansLEau = false; }
            }
        });
        check(etiquette + 'barque : toujours dans l’eau, à plus de 1 unité de la rive (6 × 70 coups de rame)', toujoursDansLEau);
        checkEqual(etiquette + 'on débarque', G().quitterBateau(), true);
        resetToIdle();
        G().placerAuPoste(0);

        // --- Cartes ---
        const cadre = monde.rayonCadre === undefined ? info.rayonCadre : monde.rayonCadre;
        let contourDansCadre = true;
        for (let k = 0; k < 720; k++) {
            const a = (k / 720) * DEUX_PI;
            const r = G().getRayonEtang(a);
            // La couronne de placement (jusqu'à 6 unités) reste dans le cadre aussi.
            if (Math.abs(Math.cos(a) * (r + 6)) > cadre || Math.abs(Math.sin(a) * (r + 6)) > cadre) { contourDansCadre = false; }
        }
        check(etiquette + 'carte du carnet : tout le contour et la couronne de placement tiennent dans le cadre', contourDansCadre);
        // Carte 3D de placement : la caméra voit tout le contour et la couronne (coordonnées normalisées dans [-1, 1]).
        const camera = G().etat.carteCamera;
        camera.updateMatrixWorld();
        const V = G().etat.carteMarqueur.position.constructor;
        let pire = 0;
        for (let k = 0; k < 360; k++) {
            const a = (k / 360) * DEUX_PI;
            [0, 6].forEach(function (marge) {
                const r = G().getRayonEtang(a) + marge;
                const q = new V(centre.x + Math.cos(a) * r, 0, centre.z + Math.sin(a) * r).project(camera);
                pire = Math.max(pire, Math.abs(q.x), Math.abs(q.y));
            });
        }
        check(etiquette + 'carte 3D de placement : le contour et la couronne sont dans le cadre de la caméra', pire <= 1, 'plus grand écart ' + pire.toFixed(2));

        // --- Grille des fonds : un RECTANGLE ajusté à l'étang ---
        const S = G().substrats;
        const largeur = S.taille * S.cellule;
        const hauteur = S.hauteur * S.cellule;
        check(etiquette + 'grille des fonds : couvre l’extent + 4,5 sur chaque axe', largeur >= 2 * (ext.maxX + 4.5) - 1e-9 && hauteur >= 2 * (ext.maxZ + 4.5) - 1e-9,
            largeur.toFixed(1) + ' × ' + hauteur.toFixed(1));
        check(etiquette + 'grille des fonds : pas surdimensionnée (au plus une cellule de plus que l’extent + 4,5, +1 de chaque côté)',
            largeur <= 2 * Math.ceil(ext.maxX + 4.5) + S.cellule + 1e-9 && hauteur <= 2 * Math.ceil(ext.maxZ + 4.5) + S.cellule + 1e-9);
        checkEqual(etiquette + 'grille : côtés de la texture = 2 × demi-côtés', S.cote + ',' + S.coteZ, (2 * monde.demiCoteX) + ',' + (2 * monde.demiCoteZ));
        const carre = Math.pow(2 * Math.ceil(monde.rayonMax + 4.5) / S.cellule, 2);
        if (forme === 'canal' || forme === 'riviere') {
            check(etiquette + 'grille rectangulaire : plus longue que large (hauteur / largeur ≥ 2,5)', S.hauteur / S.taille >= 2.5, (S.hauteur / S.taille).toFixed(2));
            check(etiquette + 'grille rectangulaire : moins de 70 % des cellules du carré qui contiendrait l’étang', S.taille * S.hauteur <= 0.7 * carre,
                Math.round(S.taille * S.hauteur) + ' contre ' + Math.round(carre));
        }
        let hors = 0;
        for (let k = 0; k < 720; k++) {
            const a = (k / 720) * DEUX_PI;
            const r = G().getRayonEtang(a) * 0.97;
            if (!S.substratEn(centre.x + Math.cos(a) * r, centre.z + Math.sin(a) * r)) { hors++; }
        }
        checkEqual(etiquette + 'grille : tout l’intérieur de l’eau a un substrat (720 directions à 97 % du rayon)', hors, 0);
        check(etiquette + 'grille : les cinq types de fond existent ou sont absents du biotope sans cellule orpheline',
            Math.abs(Object.keys(S.parts).reduce(function (t, k) { return t + S.parts[k]; }, 0) - 1) < 1e-6);
        const pixels = S.pixelsFond(64, 96);
        checkEqual(etiquette + 'texture du fond : pixelsFond(largeur, hauteur) fournit largeur × hauteur × 4 octets', pixels.length, 64 * 96 * 4);

        // --- Maillages : eau, fond, rive ---
        const eau = G().water.geometry.attributes.position.array;
        let horsBoite = 0;
        for (let i = 0; i < eau.length; i += 3) { if (Math.abs(eau[i]) > ext.maxX + 1e-6 || Math.abs(eau[i + 2]) > ext.maxZ + 1e-6) { horsBoite++; } }
        checkEqual(etiquette + 'maillage de l’eau : aucun sommet hors du rectangle des extents', horsBoite, 0);
        let horsContour = 0;
        for (let i = 3; i < eau.length; i += 3) {
            if (Math.hypot(eau[i], eau[i + 2]) > G().getRayonEtang(Math.atan2(eau[i + 2], eau[i])) + 1e-3) { horsContour++; }
        }
        checkEqual(etiquette + 'maillage de l’eau : aucun sommet au-delà du contour (à la précision float32 près)', horsContour, 0);
        const uv = G().getFondMesh().geometry.attributes.uv.array;
        let uvHors = 0;
        for (let i = 0; i < uv.length; i++) { if (uv[i] < -1e-9 || uv[i] > 1 + 1e-9) { uvHors++; } }
        checkEqual(etiquette + 'maillage du fond : toutes les coordonnées de texture dans [0, 1] (le rectangle de la grille couvre le fond)', uvHors, 0);
        const rive = G().getShoreMesh().geometry.attributes.position.array;
        const nbSegments = rive.length / 12;
        let contourRive = 0;
        let repliee = 0;
        for (let s = 0; s < nbSegments; s++) {
            const x = rive[s * 12];
            const z = rive[s * 12 + 2];
            const a = (s / nbSegments) * DEUX_PI;
            if (Math.abs(x - Math.cos(a) * G().getRayonEtang(a)) > 1e-4 || Math.abs(z - Math.sin(a) * G().getRayonEtang(a)) > 1e-4) { contourRive++; }
            // Le bord extérieur de la bande de sable (anneau 2) reste dans l'ordre des angles : pas de pli.
            const suivant = (s + 1) % nbSegments;
            [1, 2].forEach(function (anneau) {
                const a1 = Math.atan2(rive[(s * 4 + anneau) * 3 + 2], rive[(s * 4 + anneau) * 3]);
                const a2 = Math.atan2(rive[(suivant * 4 + anneau) * 3 + 2], rive[(suivant * 4 + anneau) * 3]);
                let d = a2 - a1;
                while (d < -Math.PI) { d += DEUX_PI; }
                while (d > Math.PI) { d -= DEUX_PI; }
                if (!(d > 0)) { repliee++; }
            });
        }
        checkEqual(etiquette + 'rive : le bord intérieur de la rive est le contour de l’eau', contourRive, 0);
        checkEqual(etiquette + 'rive : la bande de sable ne se replie jamais sur elle-même', repliee, 0);

        // --- Décor : à bonne distance de la VRAIE berge ---
        const D = G().decor;
        const minArbres = Math.min.apply(null, D.arbres.map(function (t) { return distanceAuContour(t, centre); }));
        check(etiquette + 'arbres : à plus de 3,5 unités de la vraie berge (décalage sur la normale)', D.arbres.length === 0 || minArbres > 3.5, minArbres.toFixed(1));
        check(etiquette + 'nénuphars et roseaux dans l’eau', G().lilyPads.every(function (l) { const q = polaire(l, centre); return q.distance < q.contour; })
            && D.roseaux.every(function (r) { const q = polaire(r, centre); return q.distance < q.contour; }));
        check(etiquette + 'rochers sur la berge (hors de l’eau)', D.rochers.every(function (r) { const q = polaire(r, centre); return q.distance > q.contour; }));
        check(etiquette + 'au moins la moitié des arbres du biotope sont posés', D.arbres.length >= Math.floor(milieuParId(id).decor.arbres * (m.rayon / 90) * 0.5), String(D.arbres.length));

        G().recommencerPartie();
    });
}

function tousLesBiotopes() {
    group('79d) Formes d’eau : les six biotopes et leur profil');
    const attendu = { plaine: 'etang', canal: 'canal', carnassiers: 'etang', montagne: 'lac', foret: 'etang', riviere: 'riviere' };
    checkEqual('six biotopes', IDS_MILIEUX.length, 6);
    IDS_MILIEUX.forEach(function (id) {
        checkEqual(id + ' : profil ' + attendu[id], formeDe(milieuParId(id)), attendu[id]);
        choisirSurAccueil(id);
        checkEqual(id + ' : le monde a le profil du biotope', G().getMonde().forme, attendu[id]);
        const m = milieuParId(id);
        checkClose(id + ' : surface = celle d’un étang de même rayon', G().getMonde().surfaceHa, surfaceHectares(m.rayon, 'etang'), 1e-9);
    });
    // Un changement de FORME à rayon égal reconstruit bien le monde : aucun biotope ne partage son rayon, donc on vérifie
    // seulement que la plaine → canal → plaine ne laisse pas la forme du canal.
    choisirSurAccueil('canal');
    choisirSurAccueil('plaine');
    checkEqual('retour du canal à la plaine : forme étang', G().getMonde().forme, 'etang');
    checkEqual('RAYON_REFERENCE = 90', RAYON_REFERENCE, 90);
}

function retourEnPlaine() {
    group('79e) Formes d’eau : retour en plaine, bit à bit');
    ['riviere', 'canal', 'montagne', 'foret', 'carnassiers', 'riviere', 'plaine'].forEach(choisirSurAccueil);
    comparerPlaine('retour en plaine', instantane(G()));
    G().setGraine(20240101);   // graine du harnais : le monde en plaine est reconstruit sur son étang
    choisirSurAccueil('plaine');
    G().repeuplerEtang();
    G().recommencerPartie();
}

export async function run() {
    profilsPurs();
    plaineIdentique();
    chaqueForme();
    tousLesBiotopes();
    retourEnPlaine();
}

export default run;

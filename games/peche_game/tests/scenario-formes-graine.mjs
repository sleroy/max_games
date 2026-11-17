// ---------------------------------------------------------------------------
// Scénario : LES FORMES D'EAU SONT TIRÉES D'UNE GRAINE (dimensions.js `profilDeGraine`, environnement.js
// `setRayonMonde(rayon, forme, graine)`, milieux.js `creerMilieux({ graine })`).
//
// Chaque nouvelle partie a un plan d'eau DIFFÉRENT mais fidèle à son biotope : un canal reste long et à berges parallèles,
// une rivière sinueuse, un lac a ses anses, un étang est une mare lobée. Même graine = même plan d'eau.
//  1) générateur pur : déterminisme, aucun `Math.random`, plages respectées, graines différentes = contours différents ;
//  2) STYLE conservé, mesuré sur le contour, sur 20 graines par forme ;
//  3) surface = intégrale du contour (profils normalisés : la même surface que l'étang d'origine) ;
//  4) dans le jeu, pour plusieurs graines et chaque forme : contour, fosses, postes, obstacles, barque, cartes, grille des fonds ;
//  5) rejouable : même graine = même monde au bit près ; changer de biotope garde la graine ;
//  6) le tirage de la forme ne consomme pas le hasard du monde (décor, poissons).
//
// Le monde est laissé en plaine (graine du harnais) à la fin.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { milieuParId } from '../milieux.js';
import {
    FORMES, IDS_FORMES, PLAGES_GRAINE, profilDeGraine, definirProfil, facteurContour, rayonContour, coefficientSurface,
    COEFFICIENT_SURFACE, surfaceHectares, extents
} from '../dimensions.js';
import { instantane } from './instantane-plaine.mjs';
import { GAME_DIR, group, check, checkEqual, checkClose, G, el, fire, resetToIdle, moduleCopie } from './harness.mjs';
import { suivreProfil, profilParDefaut } from './profil-monde.mjs';

const DEUX_PI = Math.PI * 2;
const NB_GRAINES_STYLE = 20;        // style : 20 graines par forme
const NB_GRAINES_JEU = 3;           // dans le jeu (un monde reconstruit par graine et par biotope)
const graines = function (n, depart) { return Array.from({ length: n }, function (_, i) { return (depart + i * 7919) >>> 0; }); };
const GRAINES_STYLE = graines(NB_GRAINES_STYLE, 1);
const GRAINES_JEU = [1001, 20240101, 424242].slice(0, NB_GRAINES_JEU);   // 20240101 : la graine du harnais
const cap = function (id) { return id[0].toUpperCase() + id.slice(1); };

// Biotope qui porte chaque forme dans le jeu (milieux.js).
const BIOTOPES = { etang: 'carnassiers', lac: 'montagne', canal: 'canal', riviere: 'riviere' };

function choisirSurAccueil(id) {
    el('accueilMilieu' + cap(id)).checked = true;
    fire('accueilMilieu' + cap(id), 'change');
    suivreProfil(G());
}

/** Contour (rapport au rayon) d'une forme tirée d'une graine, sur n directions. */
function contourDe(forme, graine, n) {
    definirProfil(profilDeGraine(graine, forme));
    const valeurs = [];
    for (let k = 0; k < n; k++) { valeurs.push(facteurContour((k / n) * DEUX_PI, forme)); }
    return valeurs;
}

/** Aire (unités²) d'un contour polaire r(θ) : ∫ r²/2 dθ, par 20 000 tranches (plus fin que dimensions.js : 2 000). */
function aire(rayonDe) {
    const n = 20000;
    let total = 0;
    for (let i = 0; i < n; i++) { const r = rayonDe(((i + 0.5) / n) * DEUX_PI); total += r * r / 2 * (DEUX_PI / n); }
    return total;
}

// Berges à la hauteur z du contour unitaire : { est, ouest, largeur, axe } (plus grand et plus petit x des points proches).
function bergesA(points, z, tolerance) {
    let est = -Infinity;
    let ouest = Infinity;
    points.forEach(function (p) { if (Math.abs(p.z - z) < tolerance) { est = Math.max(est, p.x); ouest = Math.min(ouest, p.x); } });
    return { est: est, ouest: ouest, largeur: est - ouest, axe: (est + ouest) / 2 };
}

function pointsDuContour(forme, n) {
    const points = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * DEUX_PI; const r = facteurContour(a, forme); points.push({ x: r * Math.cos(a), z: r * Math.sin(a) }); }
    return points;
}

const somme = function (liste) { return liste.reduce(function (t, v) { return t + v; }, 0); };

// ---------------------------------------------------------------------------
// 1) Générateur pur
// ---------------------------------------------------------------------------
function generateur() {
    group('80a) Formes tirées d’une graine : le générateur (dimensions.js)');
    profilParDefaut();
    IDS_FORMES.forEach(function (forme) {
        // Déterminisme.
        let identiques = true;
        GRAINES_STYLE.forEach(function (g) { if (JSON.stringify(profilDeGraine(g, forme)) !== JSON.stringify(profilDeGraine(g, forme))) { identiques = false; } });
        check(forme + ' : deux appels profilDeGraine(g, forme) sont identiques (' + NB_GRAINES_STYLE + ' graines)', identiques);
        // Deux graines différentes : contours différents (écart mesuré sur 720 directions).
        let pireEcart = Infinity;
        for (let i = 0; i + 1 < 6; i++) {
            const a = contourDe(forme, GRAINES_STYLE[i], 720);
            const b = contourDe(forme, GRAINES_STYLE[i + 1], 720);
            let ecart = 0;
            for (let k = 0; k < 720; k++) { ecart = Math.max(ecart, Math.abs(a[k] - b[k])); }
            pireEcart = Math.min(pireEcart, ecart);
        }
        check(forme + ' : deux graines différentes donnent des contours différents (écart max sur 720 directions > 0,02 × rayon)', pireEcart > 0.02, pireEcart.toFixed(3));
        // Les paramètres tirés de graines voisines ne sont pas tous égaux (le générateur dépend vraiment de la graine).
        check(forme + ' : les ' + NB_GRAINES_STYLE + ' graines donnent au moins 15 allongements distincts',
            new Set(GRAINES_STYLE.map(function (g) { return profilDeGraine(g, forme).allongement; })).size >= 15);
        // L'identité de la forme.
        check(forme + ' : id et nom du style', GRAINES_STYLE.every(function (g) { const p = profilDeGraine(g, forme); return p.id === forme && p.nom === FORMES[forme].nom; }));
        checkEqual(forme + ' : un profil n’a que les champs { id, nom, allongement, exposant, harmoniques }',
            Object.keys(profilDeGraine(5, forme)).join(','), 'id,nom,allongement,exposant,harmoniques');
        // Même graine, autre forme : autre profil (l'amorce dépend de la forme).
        check(forme + ' : la même graine donne un autre tirage dans une autre forme',
            JSON.stringify(profilDeGraine(5, forme).harmoniques) !== JSON.stringify(profilDeGraine(5, IDS_FORMES[(IDS_FORMES.indexOf(forme) + 1) % 4]).harmoniques));
    });
    // Aucun Math.random : le générateur est LOCAL (mulberry32 amorcé par graine ^ hash(forme)).
    const aleatoire = Math.random;
    let appels = 0;
    Math.random = function () { appels++; return aleatoire(); };
    IDS_FORMES.forEach(function (forme) { profilDeGraine(910000 + IDS_FORMES.indexOf(forme), forme); });
    Math.random = aleatoire;
    checkEqual('aucun appel à Math.random (tirages neufs, hors cache)', appels, 0);
    // Graine témoin : le profil ne change pas d'un commit à l'autre sans que ce test ne le dise.
    checkEqual('graine témoin 20240101 : canal',
        JSON.stringify(profilDeGraine(20240101, 'canal')),
        '{"id":"canal","nom":"Canal","allongement":4.5757,"exposant":6.1514,"harmoniques":[{"amplitude":0.0138,"frequence":4,"phase":2.2184},{"amplitude":0.0109,"frequence":5,"phase":3.1522},{"amplitude":0.0185,"frequence":9,"phase":0.3869}]}');

    // --- Plages : chaque paramètre tiré est dans la plage du style ---
    IDS_FORMES.forEach(function (forme) {
        const p = PLAGES_GRAINE[forme];
        const dans = function (v, plage) { return v >= plage[0] - 1e-9 && v <= plage[1] + 1e-9; };
        const profils = GRAINES_STYLE.map(function (g) { return profilDeGraine(g, forme); });
        check(forme + ' : allongement dans ' + JSON.stringify(p.allongement), profils.every(function (q) { return dans(q.allongement, p.allongement); }));
        if (p.exposant) {
            check(forme + ' : exposant dans ' + JSON.stringify(p.exposant), profils.every(function (q) { return dans(q.exposant, p.exposant); }));
        } else {
            check(forme + ' : exposant null (contour harmonique)', profils.every(function (q) { return q.exposant === null; }));
        }
        const hors = forme === 'riviere' ? function (q) { return q.harmoniques.slice(1); } : function (q) { return q.harmoniques; };
        check(forme + ' : nombre d’harmoniques dans ' + JSON.stringify(p.nombre) + (forme === 'riviere' ? ' (+ le méandre)' : ''),
            profils.every(function (q) { return dans(hors(q).length, p.nombre); }));
        check(forme + ' : amplitude de chaque harmonique dans ' + JSON.stringify(p.amplitude),
            profils.every(function (q) { return hors(q).every(function (h) { return dans(h.amplitude, p.amplitude); }); }));
        check(forme + ' : fréquences entières distinctes dans ' + JSON.stringify(p.frequences),
            profils.every(function (q) {
                const f = hors(q).map(function (h) { return h.frequence; });
                return new Set(f).size === f.length && f.every(function (v) { return Number.isInteger(v) && dans(v, p.frequences); });
            }));
        check(forme + ' : phases dans [0 ; 2π[', profils.every(function (q) { return hors(q).every(function (h) { return h.phase >= 0 && h.phase < DEUX_PI; }); }));
        if (forme === 'riviere') {
            check('rivière : un méandre (1ʳᵉ harmonique) de phase 0, d’amplitude ' + JSON.stringify(p.amplitudeMeandre),
                profils.every(function (q) { return q.harmoniques[0].phase === 0 && dans(q.harmoniques[0].amplitude, p.amplitudeMeandre); }));
            check('rivière : le méandre est une harmonique PAIRE (2 ou 4 : 1 ou 2 « S » le long du lit ; les deux berges se décalent ensemble)',
                profils.every(function (q) { return q.harmoniques[0].frequence === 2 || q.harmoniques[0].frequence === 4; }));
            check('rivière : les deux nombres de « S » (1 et 2) sont tirés', new Set(profils.map(function (q) { return q.harmoniques[0].frequence; })).size === 2);
        }
    });
}

// ---------------------------------------------------------------------------
// 2) STYLE conservé, sur 20 graines par forme (mesuré sur le contour normalisé)
// ---------------------------------------------------------------------------
function style() {
    group('80b) Formes tirées d’une graine : le style est conservé (' + NB_GRAINES_STYLE + ' graines par forme)');
    profilParDefaut();
    // CANAL : longueur / largeur ∈ [4 ; 6,5], largeur quasi constante, berges parallèles.
    const canal = { rapports: [], ecarts: [], pentes: [] };
    GRAINES_STYLE.forEach(function (g) {
        definirProfil(profilDeGraine(g, 'canal'));
        const e = extents(1, 'canal');
        canal.rapports.push(e.maxZ / e.maxX);
        const pts = pointsDuContour('canal', 20000);
        const largeurs = [];
        const est = [];
        for (let k = -7; k <= 7; k++) { const b = bergesA(pts, (k / 10) * e.maxZ, 0.004 * e.maxZ); largeurs.push(b.largeur); est.push(b.est); }
        const moyenne = somme(largeurs) / largeurs.length;
        canal.ecarts.push((Math.max.apply(null, largeurs) - Math.min.apply(null, largeurs)) / moyenne);
        canal.pentes.push(Math.max.apply(null, est.map(function (x) { return Math.abs(x - est[0]); })) / (1.4 * e.maxZ));
    });
    check('canal : longueur / largeur ∈ [4 ; 6,5] sur 20 graines', canal.rapports.every(function (r) { return r >= 4 && r <= 6.5; }),
        Math.min.apply(null, canal.rapports).toFixed(2) + ' → ' + Math.max.apply(null, canal.rapports).toFixed(2));
    check('canal : largeur quasi constante (écart < 15 % sur 70 % de la longueur) sur 20 graines', canal.ecarts.every(function (e) { return e < 0.15; }),
        (Math.max.apply(null, canal.ecarts) * 100).toFixed(1) + ' %');
    check('canal : berges parallèles (la rive est dérive de moins de 2 % de la longueur) sur 20 graines', canal.pentes.every(function (p) { return p < 0.02; }),
        Math.max.apply(null, canal.pentes).toFixed(4));
    check('canal : les longueurs diffèrent d’une graine à l’autre (au moins 1,5 de différence de rapport)',
        Math.max.apply(null, canal.rapports) - Math.min.apply(null, canal.rapports) > 1.5);

    // RIVIÈRE : rapport ∈ [2,5 ; 4,5] et MÉANDRE (le bord ondule le long du grand axe).
    const riviere = { rapports: [], meandres: [], ondulationEst: [], ondulationOuest: [], passages: [] };
    GRAINES_STYLE.forEach(function (g) {
        definirProfil(profilDeGraine(g, 'riviere'));
        const e = extents(1, 'riviere');
        riviere.rapports.push(e.maxZ / e.maxX);
        const pts = pointsDuContour('riviere', 20000);
        const axes = [];
        const largeurs = [];
        const est = [];
        const ouest = [];
        for (let k = -8; k <= 8; k++) { const b = bergesA(pts, (k / 10) * e.maxZ, 0.004 * e.maxZ); axes.push(b.axe); largeurs.push(b.largeur); est.push(b.est); ouest.push(b.ouest); }
        const largeur = somme(largeurs) / largeurs.length;
        riviere.meandres.push((Math.max.apply(null, axes) - Math.min.apply(null, axes)) / largeur);
        riviere.ondulationEst.push((Math.max.apply(null, est) - Math.min.apply(null, est)) / largeur);
        riviere.ondulationOuest.push((Math.max.apply(null, ouest) - Math.min.apply(null, ouest)) / largeur);
    });
    check('rivière : longueur / largeur ∈ [2,5 ; 4,5] sur 20 graines', riviere.rapports.every(function (r) { return r >= 2.5 && r <= 4.5; }),
        Math.min.apply(null, riviere.rapports).toFixed(2) + ' → ' + Math.max.apply(null, riviere.rapports).toFixed(2));
    check('rivière : MÉANDRE : l’axe du lit se déplace d’au moins 25 % de la largeur sur 20 graines', riviere.meandres.every(function (m) { return m >= 0.25; }),
        (Math.min.apply(null, riviere.meandres) * 100).toFixed(0) + ' % au plus faible');
    check('rivière : la rive est ondule le long du grand axe (plus de 25 % de la largeur) sur 20 graines', riviere.ondulationEst.every(function (m) { return m > 0.25; }));
    check('rivière : la rive ouest ondule aussi sur 20 graines', riviere.ondulationOuest.every(function (m) { return m > 0.25; }));

    // LAC : rapport ∈ [1,2 ; 1,8] et anses (creux du rayon).
    const lac = { rapports: [], creux: [], ecartTypes: [] };
    GRAINES_STYLE.forEach(function (g) {
        definirProfil(profilDeGraine(g, 'lac'));
        const e = extents(1, 'lac');
        lac.rapports.push(e.maxZ / e.maxX);
        let creux = 0;
        for (let i = 1; i < 720; i++) {
            const a = (i / 720) * DEUX_PI;
            const avant = facteurContour(a - DEUX_PI / 720, 'lac');
            const apres = facteurContour(a + DEUX_PI / 720, 'lac');
            if (facteurContour(a, 'lac') < avant && facteurContour(a, 'lac') < apres) { creux++; }
        }
        lac.creux.push(creux);
        // Écart du bord à un profil lisse (même allongement et exposant, sans harmonique, même surface) : l'amplitude des anses.
        const p = profilDeGraine(g, 'lac');
        const base = function (a) {
            const c = Math.abs(Math.cos(a));
            const s = Math.abs(Math.sin(a) / p.allongement);
            return 1 / Math.pow(Math.pow(c, p.exposant) + Math.pow(s, p.exposant), 1 / p.exposant);
        };
        const k = Math.sqrt(COEFFICIENT_SURFACE / aire(base));
        const rapportsAuLisse = [];
        for (let i = 0; i < 2000; i++) { const a = (i / 2000) * DEUX_PI; rapportsAuLisse.push(facteurContour(a, 'lac') / (k * base(a))); }
        const m = somme(rapportsAuLisse) / rapportsAuLisse.length;
        lac.ecartTypes.push(Math.sqrt(somme(rapportsAuLisse.map(function (v) { return (v - m) * (v - m); })) / rapportsAuLisse.length));
    });
    check('lac : longueur / largeur ∈ [1,2 ; 1,8] sur 20 graines', lac.rapports.every(function (r) { return r >= 1.2 && r <= 1.8; }),
        Math.min.apply(null, lac.rapports).toFixed(2) + ' → ' + Math.max.apply(null, lac.rapports).toFixed(2));
    check('lac : des anses (au moins 3 creux dans le rayon) sur 20 graines', lac.creux.every(function (c) { return c >= 3; }), 'au plus faible ' + Math.min.apply(null, lac.creux) + ' creux');
    check('lac : le bord s’écarte nettement du profil lisse (écart-type ≥ 0,05) sur 20 graines', lac.ecartTypes.every(function (e) { return e >= 0.05; }),
        Math.min.apply(null, lac.ecartTypes).toFixed(3));

    // ÉTANG : quasi rond (une mare lobée, ni canal ni lac).
    const etang = { rapports: [], extremes: [], minimum: [] };
    GRAINES_STYLE.forEach(function (g) {
        definirProfil(profilDeGraine(g, 'etang'));
        const pts = pointsDuContour('etang', 8000);
        const maxX = Math.max.apply(null, pts.map(function (q) { return Math.abs(q.x); }));
        const maxZ = Math.max.apply(null, pts.map(function (q) { return Math.abs(q.z); }));
        etang.rapports.push(maxZ / maxX);
        const rayons = pts.map(function (q) { return Math.hypot(q.x, q.z); });
        etang.extremes.push(Math.max.apply(null, rayons) / Math.min.apply(null, rayons));
        etang.minimum.push(Math.min.apply(null, rayons));
    });
    check('étang : quasi rond : longueur / largeur ∈ [0,88 ; 1,14] sur 20 graines', etang.rapports.every(function (r) { return r >= 0.88 && r <= 1.14; }),
        Math.min.apply(null, etang.rapports).toFixed(2) + ' → ' + Math.max.apply(null, etang.rapports).toFixed(2));
    check('étang : plus grand rayon / plus petit rayon ≤ 1,9 (une mare lobée, pas une étoile) sur 20 graines', etang.extremes.every(function (r) { return r <= 1.9; }),
        Math.max.apply(null, etang.extremes).toFixed(2));
    check('étang : jamais plus étroit que la moitié de son rayon nominal sur 20 graines', etang.minimum.every(function (r) { return r >= 0.5; }));
    check('étang : le contour varie réellement (plus grand rayon / plus petit ≥ 1,15) sur 20 graines', etang.extremes.every(function (r) { return r >= 1.15; }),
        Math.min.apply(null, etang.extremes).toFixed(2));

    // SURFACE = intégrale du contour, la même que celle de l'étang d'origine (profils normalisés), pour chaque forme et chaque graine.
    IDS_FORMES.forEach(function (forme) {
        let ecartIntegrale = 0;
        let ecartReference = 0;
        let etoile = true;
        GRAINES_STYLE.slice(0, 8).forEach(function (g) {
            definirProfil(profilDeGraine(g, forme));
            const integrale = aire(function (a) { return facteurContour(a, forme); });
            ecartIntegrale = Math.max(ecartIntegrale, Math.abs(coefficientSurface(forme) - integrale) / integrale);
            ecartReference = Math.max(ecartReference, Math.abs(coefficientSurface(forme) - COEFFICIENT_SURFACE) / COEFFICIENT_SURFACE);
            for (let k = 0; k < 3600; k++) { if (!(facteurContour((k / 3600) * DEUX_PI, forme) > 0.2)) { etoile = false; } }
        });
        check(forme + ' : coefficient de surface = intégrale du contour (20 000 tranches, 8 graines, écart relatif < 1e-6)', ecartIntegrale < 1e-6, ecartIntegrale.toExponential(2));
        check(forme + ' : à rayon égal, la même surface que l’étang d’origine (écart relatif < 1e-9, 8 graines)', ecartReference < 1e-9, ecartReference.toExponential(2));
        check(forme + ' : contour étoilé (rayon > 0,2 dans 3 600 directions, 8 graines)', etoile);
    });
    definirProfil(profilDeGraine(GRAINES_STYLE[0], 'canal'));
    checkClose('surfaceHectares(180) d’un canal tiré = ∫ r² / 2, en hectares', surfaceHectares(180, 'canal'),
        aire(function (a) { return rayonContour(180, a, 'canal'); }) / 4 / 10000, 1e-4 * surfaceHectares(180, 'canal'));
    profilParDefaut();
}

// ---------------------------------------------------------------------------
// 3) Dans le jeu : invariants pour plusieurs graines et chaque forme
// ---------------------------------------------------------------------------
function polaire(p, centre) {
    const dx = p.x - centre.x;
    const dz = p.z - centre.z;
    const angle = Math.atan2(dz, dx);
    return { distance: Math.hypot(dx, dz), angle: angle, contour: G().getRayonEtang(angle) };
}

function distanceAuContour(p, centre) {
    let mini = Infinity;
    for (let k = 0; k < 720; k++) {
        const a = (k / 720) * DEUX_PI;
        const r = G().getRayonEtang(a);
        mini = Math.min(mini, Math.hypot(p.x - (centre.x + Math.cos(a) * r), p.z - (centre.z + Math.sin(a) * r)));
    }
    return mini;
}

function invariantsDuJeu() {
    group('80c) Formes tirées d’une graine : invariants dans le jeu (' + NB_GRAINES_JEU + ' graines × 4 formes)');
    Object.keys(BIOTOPES).forEach(function (forme) {
        const id = BIOTOPES[forme];
        const m = milieuParId(id);
        GRAINES_JEU.forEach(function (graine) {
            const etiquette = id + ' (' + forme + ', graine ' + graine + ') : ';
            G().setGraine(graine);
            choisirSurAccueil(id);
            const monde = G().getMonde();
            const info = G().getEtangInfo();
            const centre = G().getPondCenter();

            // Le monde est celui de la graine.
            checkEqual(etiquette + 'le monde porte la graine', monde.graine, graine);
            checkEqual(etiquette + 'le profil du monde est celui de profilDeGraine(graine, forme)', JSON.stringify(monde.profil), JSON.stringify(profilDeGraine(graine, forme)));
            let ecart = 0;
            for (let k = 0; k < 360; k++) {
                const a = (k / 360) * DEUX_PI;
                ecart = Math.max(ecart, Math.abs(G().getRayonEtang(a) - rayonContour(m.rayon, a, forme)));
            }
            checkEqual(etiquette + 'le contour du jeu est celui du profil (360 angles)', ecart, 0);
            // Surface = intégrale du contour du jeu, = celle d'un étang de même rayon.
            const integrale = aire(function (a) { return G().getRayonEtang(a); }) / 4 / 10000;
            checkClose(etiquette + 'surface annoncée = intégrale du contour du jeu (ha)', monde.surfaceHa, integrale, 1e-3 * integrale);
            checkClose(etiquette + 'surface = celle de l’étang de même rayon (profils normalisés)', monde.surfaceHa, surfaceHectares(m.rayon, 'etang'), 1e-9);
            // Extents et grille couvrent le contour.
            let largeur = 0;
            let longueur = 0;
            for (let k = 0; k < 3600; k++) {
                const a = (k / 3600) * DEUX_PI;
                largeur = Math.max(largeur, Math.abs(Math.cos(a) * G().getRayonEtang(a)));
                longueur = Math.max(longueur, Math.abs(Math.sin(a) * G().getRayonEtang(a)));
            }
            check(etiquette + 'les extents couvrent le contour', monde.maxX >= largeur - 1e-9 && monde.maxZ >= longueur - 1e-9);
            const S = G().substrats;
            check(etiquette + 'grille des fonds : couvre l’extent + 4,5 sur chaque axe', S.taille * S.cellule >= 2 * (monde.maxX + 4.5) - 1e-9 && S.hauteur * S.cellule >= 2 * (monde.maxZ + 4.5) - 1e-9);
            let hors = 0;
            for (let k = 0; k < 360; k++) {
                const a = (k / 360) * DEUX_PI;
                const r = G().getRayonEtang(a) * 0.97;
                if (!S.substratEn(centre.x + Math.cos(a) * r, centre.z + Math.sin(a) * r)) { hors++; }
            }
            checkEqual(etiquette + 'grille : tout l’intérieur de l’eau a un substrat (97 % du rayon, 360 directions)', hors, 0);
            // Fosses : dans l'eau, à plus de 2 unités de la rive, sans chevauchement, profondeur max ≤ 8,2.
            check(etiquette + 'trois fosses, ENTIÈREMENT dans l’eau (16 points de leur cercle)', info.fosses.length === 3 && info.fosses.every(function (fosse) {
                for (let k = 0; k < 16; k++) {
                    const a = (k / 16) * DEUX_PI;
                    const q = polaire({ x: fosse.x + Math.cos(a) * fosse.rayon, z: fosse.z + Math.sin(a) * fosse.rayon }, centre);
                    if (q.distance >= q.contour) { return false; }
                }
                return true;
            }));
            check(etiquette + 'le centre de chaque fosse est à plus de 2 unités de la vraie berge', info.fosses.every(function (fosse) { return distanceAuContour(fosse, centre) > 2; }));
            check(etiquette + 'les fosses ne se chevauchent pas', info.fosses.every(function (a, i) {
                return info.fosses.every(function (b, j) { return i === j || Math.hypot(a.x - b.x, a.z - b.z) > a.rayon + b.rayon; });
            }));
            check(etiquette + 'rayons des fosses ≤ × f (rognés si une anse s’approche), profondeurs supplémentaires inchangées, rayon ≥ 40 % du nominal',
                info.fosses.every(function (fosse, i) {
                    const nominal = [22, 18, 16][i] * m.rayon / 90;
                    return fosse.rayon <= nominal + 1e-9 && fosse.rayon >= 0.4 * nominal - 1e-9 && fosse.plus === [3.6, 3.3, 3.8][i];
                }));
            check(etiquette + 'profondeur max ≤ 8,2 (la ligne descend à 7)', info.profondeurMax <= 8.2 && info.profondeurMax > 0.5, String(info.profondeurMax));
            // Poste de départ : même place qu'avant ; les quatre postes sur la rive.
            const depart = G().angler.position;
            checkClose(etiquette + 'le pêcheur de départ est à la même place (ancre sud)', Math.hypot(depart.x - (-4.01882), depart.z - 18.4187), 0, 1e-3);
            [1, 2, 3, 0].forEach(function (i) {
                G().placerAuPoste(i);
                const q = polaire(G().angler.position, centre);
                check(etiquette + 'poste ' + G().getPoste().id + ' : à 2,2 unités de la berge, à terre',
                    Math.abs(q.distance - q.contour - 2.2) < 1e-6 && distanceAuContour(G().angler.position, centre) > 1, (q.distance - q.contour).toFixed(3));
            });
            // Obstacles dans l'eau.
            const liste = G().obstacles.liste;
            check(etiquette + 'au moins 4 obstacles posés', liste.length >= 4, liste.length + ' obstacles');
            check(etiquette + 'obstacles : le centre de chaque cercle dans l’eau est dans l’eau (contour − 1,5)', liste.every(function (o) {
                return o.cercles.every(function (c) { if (!c.eau) { return true; } const q = polaire(c, centre); return q.distance <= q.contour - 1.5 + 1e-9; });
            }));
            // Décor : nénuphars et roseaux dans l'eau, rochers sur la berge.
            const D = G().decor;
            check(etiquette + 'nénuphars et roseaux dans l’eau, rochers sur la berge', G().lilyPads.every(function (l) { const q = polaire(l, centre); return q.distance < q.contour; })
                && D.roseaux.every(function (r) { const q = polaire(r, centre); return q.distance < q.contour; })
                && D.rochers.every(function (r) { const q = polaire(r, centre); return q.distance > q.contour; }));
            // Barque : toujours dans l'eau, à plus de 1 unité de la rive.
            G().recommencerPartie();
            G().setExperience(G().getBateauPrix());
            G().acheterBateau();
            resetToIdle();
            checkEqual(etiquette + 'on embarque', G().embarquerBateau(), true);
            let dansLEau = true;
            const f = m.rayon / 90;
            [[0, -2.4], [0.12, 0], [-0.12, 0], [0, 2.4], [0.2, 1], [-0.2, -1]].forEach(function (pas) {
                for (let i = 0; i < 25; i++) {
                    G().deplacerBateau(pas[0], pas[1] * Math.max(0.5, f));
                    const q = polaire(G().angler.position, centre);
                    if (!(q.distance < q.contour - 1)) { dansLEau = false; }
                }
            });
            check(etiquette + 'barque : toujours dans l’eau, à plus de 1 unité de la rive (6 × 25 coups de rame)', dansLEau);
            G().quitterBateau();
            resetToIdle();
            G().placerAuPoste(0);
            // Cartes : le contour et la couronne de placement tiennent dans le cadre du carnet et dans celui de la caméra 3D.
            let dansCadre = true;
            for (let k = 0; k < 360; k++) {
                const a = (k / 360) * DEUX_PI;
                const r = G().getRayonEtang(a) + 6;
                if (Math.abs(Math.cos(a) * r) > info.rayonCadre || Math.abs(Math.sin(a) * r) > info.rayonCadre) { dansCadre = false; }
            }
            check(etiquette + 'carte du carnet : contour et couronne de placement dans le cadre', dansCadre);
            const camera = G().etat.carteCamera;
            camera.updateMatrixWorld();
            const V = G().etat.carteMarqueur.position.constructor;
            let pire = 0;
            for (let k = 0; k < 180; k++) {
                const a = (k / 180) * DEUX_PI;
                [0, 6].forEach(function (marge) {
                    const r = G().getRayonEtang(a) + marge;
                    const q = new V(centre.x + Math.cos(a) * r, 0, centre.z + Math.sin(a) * r).project(camera);
                    pire = Math.max(pire, Math.abs(q.x), Math.abs(q.y));
                });
            }
            check(etiquette + 'carte 3D de placement : contour et couronne dans le cadre de la caméra', pire <= 1, pire.toFixed(2));
        });
    });
}

// ---------------------------------------------------------------------------
// 4) Rejouable : même graine = même plan d'eau ; changer de biotope garde la graine
// ---------------------------------------------------------------------------
function rejouable() {
    group('80d) Formes tirées d’une graine : même graine = même plan d’eau, changer de biotope garde la graine');
    const empreinteContour = function () { return instantane(G()).contour720; };
    // Rejeu bit à bit sur deux formes (canal : forme allongée ; carnassiers : étang) : le monde est refait par un détour par
    // la forêt, minuscule donc rapide. Les autres formes sont couvertes par les invariants et par `retour en plaine`.
    ['carnassiers', 'canal'].forEach(function (id) {
        G().setGraine(4242);
        choisirSurAccueil(id);
        const premier = instantane(G());
        choisirSurAccueil('foret');
        G().setGraine(4242);
        choisirSurAccueil(id);
        const rejoue = instantane(G());
        checkEqual(id + ' : même graine, même plan d’eau (contour, centre, fosses, relief, obstacles, fonds, maillages : au bit près)',
            JSON.stringify(rejoue), JSON.stringify(premier));
        G().setGraine(4243);
        choisirSurAccueil(id);
        check(id + ' : une autre graine, un autre contour', empreinteContour() !== premier.contour720);
    });
    // Changer de biotope garde la même graine : autre style, même graine.
    G().setGraine(9001);
    choisirSurAccueil('canal');
    checkEqual('canal : graine 9001', G().getMonde().graine, 9001);
    for (let i = 0; i < 200; i++) { G().step(0.05); }   // le jeu tourne : rand() avance, la graine du plan d'eau reste
    choisirSurAccueil('montagne');
    checkEqual('montagne : même graine 9001 (le hasard du monde a avancé, pas la graine de la forme)', G().getMonde().graine, 9001);
    checkEqual('montagne : profil = profilDeGraine(9001, lac)', JSON.stringify(G().getMonde().profil), JSON.stringify(profilDeGraine(9001, 'lac')));
    choisirSurAccueil('canal');
    checkEqual('retour au canal : profil = profilDeGraine(9001, canal), comme au premier passage', JSON.stringify(G().getMonde().profil), JSON.stringify(profilDeGraine(9001, 'canal')));
    // Une graine nouvelle (setGraine) refait le plan d'eau du MÊME biotope.
    const avant = JSON.stringify(G().getMonde().profil);
    G().setGraine(9002);
    choisirSurAccueil('canal');
    check('même biotope, autre graine : le plan d’eau est refait', JSON.stringify(G().getMonde().profil) !== avant && G().getMonde().graine === 9002);
    // La plaine par défaut (graine du harnais) est reproductible.
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    const plaine1 = instantane(G());
    choisirSurAccueil('foret');
    choisirSurAccueil('plaine');
    checkEqual('plaine (graine du harnais) : reproductible après un détour par la forêt', JSON.stringify(instantane(G())), JSON.stringify(plaine1));
    checkEqual('plaine (graine du harnais) : le profil est celui de profilDeGraine(20240101, etang)', JSON.stringify(G().getMonde().profil), JSON.stringify(profilDeGraine(20240101, 'etang')));
}

// ---------------------------------------------------------------------------
// 5) Le tirage de la forme ne consomme pas le hasard du monde
// ---------------------------------------------------------------------------
async function hasardIntact() {
    group('80e) Formes tirées d’une graine : le tirage de la forme ne consomme pas le hasard du monde');
    // Le module d'environnement du JEU (même URL que celle qu'il importe : même instance, même état).
    const version = /script\.js\?v=(\d+)/.exec(fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8'))[1];
    const env = await import(moduleCopie('environnement.js') + '?v=' + version);
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    checkEqual('le module d’environnement du test est celui du jeu', env.getRayonMonde(), G().getMonde().rayon);
    const rayon = G().getMonde().rayon;
    const aleatoire = Math.random;
    let appels = 0;
    Math.random = function () { appels++; return aleatoire(); };
    const graineAvant = G().getGraine();
    ['canal', 'riviere', 'lac', 'etang'].forEach(function (forme, i) { env.setRayonMonde(rayon, forme, 31000 + i); });
    env.setRayonMonde(rayon, 'etang', 20240101);   // le monde du jeu, tel qu'il était
    Math.random = aleatoire;
    checkEqual('setRayonMonde (quatre formes tirées) : aucun appel à Math.random', appels, 0);
    checkEqual('setRayonMonde (quatre formes tirées) : le hasard du monde (rand) n’a pas bougé', G().getGraine(), graineAvant);
    checkEqual('…et le monde est revenu exactement comme avant (graine du plan d’eau)', G().getMonde().graine, 20240101);

    // Deux plans d'eau de même graine du monde : mêmes poissons (mêmes espèces dans le même ordre), seules les positions
    // changent. Les tailles viennent du générateur de COMPORTEMENT (`comportementRand`, un autre flux que `rand()`) : elles ne
    // sont pas comparées ici.
    const compo = function () {
        return G().fishes.map(function (p) { return p.userData.especeId; });
    };
    G().setGraine(555);
    choisirSurAccueil('carnassiers');
    G().setGraine(555);
    G().repeuplerEtang();
    const poissonsA = compo();
    const positionsA = G().fishes.map(function (p) { return p.position.x.toFixed(3) + ',' + p.position.z.toFixed(3); }).join(' ');
    const rayonCarnassiers = G().getMonde().rayon;
    env.setRayonMonde(rayonCarnassiers, 'etang', 123456);   // une AUTRE forme d'étang, même rayon, même hasard du monde
    G().setGraine(555);
    G().repeuplerEtang();
    const poissonsB = compo();
    const positionsB = G().fishes.map(function (p) { return p.position.x.toFixed(3) + ',' + p.position.z.toFixed(3); }).join(' ');
    checkEqual('même hasard du monde, deux formes d’étang : mêmes poissons (mêmes espèces, dans le même ordre)', poissonsB.join('|'), poissonsA.join('|'));
    check('…mais pas aux mêmes endroits (la forme change les positions)', positionsA !== positionsB);
    checkEqual('le même nombre de poissons (la surface est la même)', poissonsA.length, poissonsB.length);
    // Retour au monde réel.
    env.setRayonMonde(rayonCarnassiers, 'etang', 555);
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    G().repeuplerEtang();

    // Le décor ne consomme pas non plus le hasard du monde : la plaine rejoue des tirages mémorisés, les autres biotopes
    // ont un générateur LOCAL (graine du monde + biotope).
    const avantDecor = G().getGraine();
    G().decor.appliquerMilieu(milieuParId('plaine'), null);
    G().decor.appliquerMilieu(milieuParId('canal'), null);
    G().decor.appliquerMilieu(milieuParId('plaine'), null);
    checkEqual('décor : appliquerMilieu (plaine, canal, plaine) ne consomme pas le hasard du monde', G().getGraine(), avantDecor);
    const comptes = function () { return [G().decor.arbres.length, G().lilyPads.length, G().decor.roseaux.length, G().decor.rochers.length].join(','); };
    const comptesA = comptes();
    env.setRayonMonde(rayon, 'etang', 777);   // un autre contour de plaine, mêmes tirages de décor
    G().decor.appliquerMilieu(milieuParId('plaine'), null);
    const comptesB = comptes();
    const [a, b] = [comptesA.split(',').map(Number), comptesB.split(',').map(Number)];
    check('décor de la plaine : mêmes tirages sur deux contours (comptes à ±10 % : l’arbre ou le roseau qui tombe hors de sa bande est omis)',
        a.every(function (n, k) { return Math.abs(n - b[k]) <= Math.max(2, 0.1 * n); }), comptesA + ' contre ' + comptesB);
    env.setRayonMonde(rayon, 'etang', 20240101);
    choisirSurAccueil('canal');
    choisirSurAccueil('plaine');
}

export async function run() {
    generateur();
    style();
    invariantsDuJeu();
    rejouable();
    await hasardIntact();
    // Retour à un état propre : plaine de la graine du harnais.
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    G().repeuplerEtang();
    G().recommencerPartie();
    checkEqual('fin : le monde est en plaine', G().milieux.courant().id, 'plaine');
}

export default run;

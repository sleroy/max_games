// ---------------------------------------------------------------------------
// substrats.js — TYPES DE FOND de l'étang (idées.md §14.3) : sable clair, gravier,
// vase, roche et herbier.
//
// Un substrat a trois rôles, qui lisent TOUS la même grille (une seule source) :
//  - RENDU     : texture du fond générée en code (aucune image), voir pixelsFond() ;
//  - LISIBILITÉ: zones de la carte du carnet (rectsCarte), type de fond sous l'hameçon ;
//  - POISSONS  : chaque espèce a ses substrats (COMPORTEMENTS[...].substrats). attirer()
//    choisit la zone de vie du poisson (homeX/homeZ) — la même notion d'« habitat » que
//    les obstacles (obstacles.js). Un poisson déjà attiré par un obstacle n'est pas touché :
//    aucun second déplacement ne se bat avec le premier.
//  - RISQUES   : verdictFond() dit si l'hameçon posé au fond s'accroche (vase : aspire,
//    herbier : comme les nénuphars, roche : court) ; sable et gravier : il repose, rien de plus.
//
// ⚠ Le monde est reproductible : ce module ne consomme JAMAIS `rand()`. La grille ne dépend
// que de la géométrie de l'étang (contour, fosses), des nénuphars et des roseaux du décor
// (eux-mêmes tirés avec la graine fixe du jeu) et d'un bruit sinusoïdal fixe.
//
// Contrat (docs/modules.md) : aucun accès aux globales de script.js ni à `window`.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { COMPORTEMENTS } from './especes.js?v=195';

// Ordre = numéro de la grille (1 à 5) et ordre de la légende.
export const SUBSTRATS = [
    { id: 'sable', nom: 'Sable clair', couleur: '#e3d29a', article: 'le sable', dans: 'dans le sable',
        lieu: 'anses abritées et hauts-fonds doux' },
    { id: 'gravier', nom: 'Gravier et galets', couleur: '#a29b8e', article: 'le gravier', dans: 'dans les galets',
        lieu: 'hauts-fonds exposés au vent' },
    { id: 'vase', nom: 'Vase', couleur: '#5b4f36', article: 'la vase', dans: 'dans la vase',
        lieu: 'fosses profondes et anses calmes' },
    { id: 'roche', nom: 'Roche', couleur: '#6f757c', article: 'la roche', dans: 'coincé dans la roche',
        lieu: 'tombants et bordures des fosses' },
    { id: 'herbier', nom: 'Herbier', couleur: '#3f8a4d', article: 'l’herbier', dans: 'pris dans l’herbier',
        lieu: 'autour des nénuphars et des roseaux' }
];
export const IDS_SUBSTRATS = SUBSTRATS.map(function (s) { return s.id; });

// Risque de l'hameçon posé AU FOND (clé d'ACCROCHAGES de obstacles.js, mêmes réglages).
//  vase    : l'accrochage qui aspire (historique de accrochage.js, mode 'fond') ;
//  herbier : comme les nénuphars (facile, sans temps de récupération) ;
//  roche   : COURT — il tire fort mais lâche vite (3 à 4 clics) ;
//  sable, gravier : aucun, l'hameçon repose sur le fond.
export const ACCROCHAGES_FOND = {
    vase: null,
    herbier: { difficulte: 'facile', niveau: 1, message: 'Ligne prise dans l’herbier !',
        pullRate: 0.12, burstStrength: 0.10, burstInterval: 1.1, clickPower: 0.10, clickCooldown: 0, tensionDepart: 0.5 },
    roche: { difficulte: 'courte', niveau: 1, message: 'Hameçon coincé entre les pierres du fond !',
        pullRate: 0.16, burstStrength: 0.12, burstInterval: 0.8, clickPower: 0.26, clickCooldown: 0.12, tensionDepart: 0.45 }
};
// Bruits déjà crédités (assets/CREDITS.txt) : cailloux = « pas-gravier », vase = bulle « plouf ».
export const SONS_FOND = { vase: ['plouf', 0.45], roche: ['pas', 0.5], gravier: ['pas', 0.3] };

// --- Géométrie de la grille -------------------------------------------------------------
const CELLULE = 1;                  // unités par cellule (≈ 0,5 m)
const MARGE_FOND = 2.5;             // le fond dépasse un peu le contour (voir makeFondGeometry)
const MARGE_RIVE_ANCRE = 8;         // un poisson ne vit pas à moins de 8 de la rive
// Vent dominant : direction VERS laquelle il souffle (x = cos, z = sin) → du sud-ouest vers le nord-est.
export const VENT_DOMINANT = -Math.PI / 4;
const FETCH_EXPOSE = 85;            // une rive est « exposée » si le vent traverse ≥ 85 unités d'eau avant elle
const PROBA_HABITAT = 0.8;          // part des poissons (ou bancs) installés sur leur substrat

// Bruit fixe (somme de sinus, valeurs ≈ -1 → 1) : rend les limites de zones organiques.
function bruit(x, z) {
    return (Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.13 + 0.4)
        + 0.6 * Math.sin((x + z) * 0.07 + 2.1)
        + 0.4 * Math.sin((x - z) * 0.17 + 0.7)) / 2;
}

function creerHasard(graine) {
    let s = graine >>> 0;
    return function () {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function creerSubstrats(deps) {
    const { POND_CENTER, rayonEtang, profondeurLocale, FOSSES, RAYON_ETANG_MAX, DEMI_COTE_FOND, verdictBase, MARGE_VASE } = deps;
    // Sources d'herbier : COPIE des nénuphars et roseaux du décor au moment de la création
    // (les tests vident `lilyPads` : la grille, elle, ne bouge plus).
    const padsCopie = (deps.lilyPads || []).map(function (p) { return { x: p.x, z: p.z, radius: p.radius }; });
    const roseauxCopie = (deps.roseaux || []).map(function (r) { return { x: r.x, z: r.z }; });
    const sources = [];
    padsCopie.forEach(function (p) { sources.push({ x: p.x, z: p.z, rayon: 5.5 + (p.radius || 0.4) * 3 }); });
    roseauxCopie.forEach(function (r) { sources.push({ x: r.x, z: r.z, rayon: 5 }); });

    // Le même carré que les UV du maillage du fond (environnement.js).
    const demi = DEMI_COTE_FOND || Math.ceil(RAYON_ETANG_MAX + 4.5);
    const N = Math.ceil(demi * 2 / CELLULE);
    const X0 = POND_CENTER.x - demi;
    const Z0 = POND_CENTER.z - demi;

    function dansEtang(x, z, marge) {
        const dx = x - POND_CENTER.x;
        const dz = z - POND_CENTER.z;
        return Math.hypot(dx, dz) < rayonEtang(Math.atan2(dz, dx)) + marge;
    }

    // --- Exposition au vent : longueur d'eau traversée en remontant le vent (grille de 4) ---
    const PAS_FETCH = 4;
    const NF = Math.ceil(demi * 2 / PAS_FETCH);
    const fetchGrille = new Float32Array(NF * NF);
    const ventX = Math.cos(VENT_DOMINANT);
    const ventZ = Math.sin(VENT_DOMINANT);
    for (let j = 0; j < NF; j++) {
        for (let i = 0; i < NF; i++) {
            const x = X0 + (i + 0.5) * PAS_FETCH;
            const z = Z0 + (j + 0.5) * PAS_FETCH;
            let longueur = 0;
            if (dansEtang(x, z, 0)) {
                // On remonte le vent (direction opposée) tant qu'on est sur l'eau.
                while (longueur < 2 * demi && dansEtang(x - ventX * longueur, z - ventZ * longueur, 0)) { longueur += 3; }
            }
            fetchGrille[j * NF + i] = longueur;
        }
    }
    function fetchEn(x, z) {
        const i = Math.max(0, Math.min(NF - 1, Math.floor((x - X0) / PAS_FETCH)));
        const j = Math.max(0, Math.min(NF - 1, Math.floor((z - Z0) / PAS_FETCH)));
        return fetchGrille[j * NF + i];
    }

    // --- Proximité de l'herbier (0 = loin, 1 = sur la plante) : étalée sur les cellules ----
    const proxGrille = new Float32Array(N * N);
    sources.forEach(function (s) {
        const i0 = Math.max(0, Math.floor((s.x - s.rayon - X0) / CELLULE));
        const i1 = Math.min(N - 1, Math.ceil((s.x + s.rayon - X0) / CELLULE));
        const j0 = Math.max(0, Math.floor((s.z - s.rayon - Z0) / CELLULE));
        const j1 = Math.min(N - 1, Math.ceil((s.z + s.rayon - Z0) / CELLULE));
        for (let j = j0; j <= j1; j++) {
            for (let i = i0; i <= i1; i++) {
                const d = Math.hypot(X0 + (i + 0.5) * CELLULE - s.x, Z0 + (j + 0.5) * CELLULE - s.z);
                const p = 1 - d / s.rayon;
                if (p > proxGrille[j * N + i]) { proxGrille[j * N + i] = p; }
            }
        }
    });

    // --- La règle : quel substrat en (x, z) ? (priorité : roche, herbier, vase, gravier, sable) ---
    function classer(x, z, prox) {
        const prof = profondeurLocale(x, z);
        const n = bruit(x, z);
        // 1) roche : tombants et bordures des fosses (anneau entre 0,55 et 1,2 rayon).
        for (let k = 0; k < FOSSES.length; k++) {
            const f = FOSSES[k];
            const q = Math.hypot(x - f.x, z - f.z) / f.rayon;
            if (q > 0.55 + 0.06 * n && q < 1.2 + 0.08 * n && n > -0.45) { return 4; }
        }
        // 2) herbier : autour des plantes, là où la lumière arrive (pas dans les grands fonds).
        if (prox > 0.12 - 0.1 * n && prof < 3.6 + 0.3 * n) { return 5; }
        // 3) vase : fosses et grand bassin, anses calmes un peu profondes.
        if (prof + 0.4 * n >= 4.2) { return 3; }
        const abrite = fetchEn(x, z) < FETCH_EXPOSE;
        if (abrite) { return prof + 0.3 * n >= 3.2 ? 3 : 1; }
        // 4) gravier : hauts-fonds exposés au vent ; sinon vase en eau plus profonde.
        return prof + 0.3 * n < 3.7 ? 2 : 3;
    }

    // --- La grille : 0 = hors étang, 1 à 5 = indice dans SUBSTRATS + 1 ---------------------
    let grille = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
            const x = X0 + (i + 0.5) * CELLULE;
            const z = Z0 + (j + 0.5) * CELLULE;
            if (dansEtang(x, z, MARGE_FOND)) { grille[j * N + i] = classer(x, z, proxGrille[j * N + i]); }
        }
    }
    // Un passage « majorité 3 × 3 » retire les cellules isolées (limites nettes et lisibles).
    (function lisser() {
        const copie = grille.slice();
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                const id = copie[j * N + i];
                if (!id) { continue; }
                const comptes = [0, 0, 0, 0, 0, 0];
                for (let dj = -1; dj <= 1; dj++) {
                    for (let di = -1; di <= 1; di++) { comptes[copie[(j + dj) * N + i + di]]++; }
                }
                let meilleur = id;
                for (let s = 1; s <= 5; s++) { if (comptes[s] > comptes[meilleur] + 2) { meilleur = s; } }
                grille[j * N + i] = meilleur;
            }
        }
    }());

    function indiceEn(x, z) {
        const i = Math.floor((x - X0) / CELLULE);
        const j = Math.floor((z - Z0) / CELLULE);
        return i < 0 || j < 0 || i >= N || j >= N ? 0 : grille[j * N + i];
    }
    // Substrat du fond en (x, z) : un identifiant de SUBSTRATS, ou null hors de l'étang.
    function substratEn(x, z) {
        const k = indiceEn(x, z);
        return k ? IDS_SUBSTRATS[k - 1] : null;
    }

    // --- Aires, zones (composantes connexes), rectangles de la carte ------------------------
    const aires = {};
    IDS_SUBSTRATS.forEach(function (id) { aires[id] = 0; });
    let total = 0;
    for (let k = 0; k < grille.length; k++) {
        if (grille[k]) { aires[IDS_SUBSTRATS[grille[k] - 1]] += CELLULE * CELLULE; total += CELLULE * CELLULE; }
    }
    const parts = {};
    IDS_SUBSTRATS.forEach(function (id) { parts[id] = total ? aires[id] / total : 0; });

    const etiquettes = new Int32Array(N * N).fill(-1);
    const zones = [];
    const compteurs = {};
    for (let depart = 0; depart < grille.length; depart++) {
        if (!grille[depart] || etiquettes[depart] >= 0) { continue; }
        const k = grille[depart];
        const pile = [depart];
        etiquettes[depart] = zones.length;
        let cellules = 0;
        let sx = 0;
        let sz = 0;
        const cellulesZone = [];
        while (pile.length) {
            const c = pile.pop();
            cellules++;
            const ci = c % N;
            const cj = (c - ci) / N;
            sx += ci;
            sz += cj;
            cellulesZone.push(c);
            [c - 1, c + 1, c - N, c + N].forEach(function (v) {
                if (v < 0 || v >= grille.length) { return; }
                if ((v === c - 1 && ci === 0) || (v === c + 1 && ci === N - 1)) { return; }
                if (grille[v] === k && etiquettes[v] < 0) { etiquettes[v] = zones.length; pile.push(v); }
            });
        }
        const id = IDS_SUBSTRATS[k - 1];
        compteurs[id] = (compteurs[id] || 0) + 1;
        zones.push({
            id: id + '-' + compteurs[id], substrat: id, aire: cellules * CELLULE * CELLULE,
            centre: { x: X0 + (sx / cellules + 0.5) * CELLULE, z: Z0 + (sz / cellules + 0.5) * CELLULE },
            cellules: cellulesZone
        });
    }
    function zoneEn(x, z) {
        const i = Math.floor((x - X0) / CELLULE);
        const j = Math.floor((z - Z0) / CELLULE);
        if (i < 0 || j < 0 || i >= N || j >= N || etiquettes[j * N + i] < 0) { return null; }
        return zones[etiquettes[j * N + i]];
    }

    // Rectangles de la carte du carnet : les cellules d'une même ligne, fusionnées par runs
    // de même substrat (x, z en coordonnées du monde). Triés par substrat puis par position.
    function rectsCarte() {
        const rects = [];
        let precedents = {};
        for (let j = 0; j < N; j++) {
            const courants = {};
            let i = 0;
            while (i < N) {
                const k = grille[j * N + i];
                if (!k) { i++; continue; }
                let fin = i;
                while (fin + 1 < N && grille[j * N + fin + 1] === k) { fin++; }
                const cle = k + ':' + i + ':' + fin;
                if (precedents[cle]) {
                    precedents[cle].h += CELLULE;          // même run que la ligne du dessus : on l'allonge
                    courants[cle] = precedents[cle];
                } else {
                    const rect = { substrat: IDS_SUBSTRATS[k - 1], x: X0 + i * CELLULE, z: Z0 + j * CELLULE,
                        w: (fin - i + 1) * CELLULE, h: CELLULE };
                    rects.push(rect);
                    courants[cle] = rect;
                }
                i = fin + 1;
            }
            precedents = courants;
        }
        return rects;
    }

    // --- Risque de l'hameçon posé au fond ---------------------------------------------------
    // Même contrat que verdictFond d'environnement.js (SOURCE UNIQUE du fond, §14.8), plus :
    //  substrat : le fond sous l'hameçon ;  surLeFond : l'hameçon touche le fond ;
    //  dansLaVase : l'hameçon est PRIS au fond (nom historique : vase, herbier ou roche).
    function verdictFond(x, z, profondeurLigne, auFond) {
        const base = verdictBase(x, z, profondeurLigne, auFond);
        const substrat = substratEn(x, z) || 'vase';
        const surLeFond = !auFond && profondeurLigne > base.profondeurEau - MARGE_VASE;
        const pris = surLeFond && (substrat === 'vase' || !!ACCROCHAGES_FOND[substrat]);
        const fiche = SUBSTRATS[IDS_SUBSTRATS.indexOf(substrat)];
        return { profondeurEau: base.profondeurEau, dansLaVase: pris, surLeFond: surLeFond,
            substrat: substrat, accroche: pris ? substrat : null,
            nom: fiche.nom.toLowerCase(), dans: fiche.dans, couleur: fiche.couleur };
    }

    // Accrochage d'un substrat : 'fond' (la vase, historique) ou un pseudo-obstacle que
    // accrochage.startSnag lit comme n'importe quel obstacle (profil + type).
    function accrochageDe(substrat) {
        const profil = ACCROCHAGES_FOND[substrat];
        if (!profil) { return 'fond'; }
        return { id: substrat + '-fond', type: substrat + '-fond', nom: substrat, profil: profil,
            son: SONS_FOND[substrat] || null };
    }

    // --- Habitat des poissons ---------------------------------------------------------------
    // Points d'ancrage d'un substrat : cellules (une sur deux) dont le voisinage est surtout du
    // même substrat, à plus de 8 unités de la rive. Triées une fois pour toutes → déterministe.
    const ancres = {};
    function ancresDe(id, fosseSeulement) {
        const cle = id + (fosseSeulement ? ':fosse' : '');
        if (ancres[cle]) { return ancres[cle]; }
        const k = IDS_SUBSTRATS.indexOf(id) + 1;
        const liste = [];
        for (let j = 3; j < N - 3; j += 2) {
            for (let i = 3; i < N - 3; i += 2) {
                if (grille[j * N + i] !== k) { continue; }
                let memes = 0;
                for (let dj = -3; dj <= 3; dj++) {
                    for (let di = -3; di <= 3; di++) { if (grille[(j + dj) * N + i + di] === k) { memes++; } }
                }
                if (memes < 49 * 0.6) { continue; }
                const x = X0 + (i + 0.5) * CELLULE;
                const z = Z0 + (j + 0.5) * CELLULE;
                const dx = x - POND_CENTER.x;
                const dz = z - POND_CENTER.z;
                if (rayonEtang(Math.atan2(dz, dx)) - Math.hypot(dx, dz) < MARGE_RIVE_ANCRE) { continue; }
                // Espèces de fosse : bien DANS une fosse (marge pour l'écart du banc), jamais au bord.
                if (fosseSeulement && !FOSSES.some(function (f) { return Math.hypot(x - f.x, z - f.z) < f.rayon * 0.78; })) { continue; }
                liste.push({ x: x, z: z });
            }
        }
        ancres[cle] = liste;
        return liste;
    }

    const hasard = creerHasard(7919);
    const tours = {};
    const stats = { poissons: 0, parSubstrat: {} };

    // Choix d'un point de vie pour une espèce : un de ses substrats (à tour de rôle), puis un
    // point d'ancrage de ce substrat. Renvoie null si l'espèce n'a pas de substrat.
    function choisirHabitat(especeId) {
        const comp = COMPORTEMENTS[especeId];
        if (!comp || !comp.substrats || !comp.substrats.length) { return null; }
        tours[especeId] = ((tours[especeId] === undefined ? -1 : tours[especeId]) + 1) % comp.substrats.length;
        for (let essai = 0; essai < comp.substrats.length; essai++) {
            const id = comp.substrats[(tours[especeId] + essai) % comp.substrats.length];
            const liste = ancresDe(id, !!comp.fosse);
            if (liste.length) {
                const a = liste[Math.floor(hasard() * liste.length) % liste.length];
                return { substrat: id, x: a.x, z: a.z };
            }
        }
        return null;
    }

    // Installe les poissons sur leur substrat. Comme obstacles.attirer : zone de vie
    // (homeX/homeZ) et position sont déplacées ; un banc entier choisit le même point.
    // Un poisson DÉJÀ attiré par un obstacle (obstacleId) garde son habitat : un seul « chez-soi ».
    // Au peuplement, le premier poisson (ou banc) de chaque espèce est TOUJOURS installé.
    function attirer(poissons) {
        const groupes = {};
        const vues = {};
        poissons.forEach(function (fish) {
            const d = fish.userData;
            if (d.hooked || d.obstacleId !== undefined || !COMPORTEMENTS[d.especeId] || !COMPORTEMENTS[d.especeId].substrats) { return; }
            let choix = d.groupeId !== undefined ? groupes[d.groupeId] : undefined;
            if (choix === undefined) {
                const garanti = poissons.length > 1 && !vues[d.especeId];
                vues[d.especeId] = true;
                const habitat = (garanti || hasard() < PROBA_HABITAT) ? choisirHabitat(d.especeId) : null;
                const a = hasard() * Math.PI * 2;
                const r = hasard() * 2.5;
                choix = habitat ? { substrat: habitat.substrat, x: habitat.x + Math.cos(a) * r, z: habitat.z + Math.sin(a) * r } : null;
                if (d.groupeId !== undefined) { groupes[d.groupeId] = choix; }
            }
            if (!choix) { return; }
            const a = hasard() * Math.PI * 2;
            const r = hasard() * (d.groupeId !== undefined ? 2.2 : 0.1);
            fish.position.x = choix.x + Math.cos(a) * r;
            fish.position.z = choix.z + Math.sin(a) * r;
            d.homeX = choix.x;
            d.homeZ = choix.z;
            d.substratHabitat = choix.substrat;
            const fond = -profondeurLocale(fish.position.x, fish.position.z);
            d.depth = d.couche === 'fond' ? fond + 0.45 : Math.max(d.depth, fond + 0.35);
            fish.position.y = d.depth - d.topOffset;
            stats.poissons++;
            stats.parSubstrat[choix.substrat] = (stats.parSubstrat[choix.substrat] || 0) + 1;
        });
        return stats.poissons;
    }

    // -------------------------------------------------------------------------
    // PÊCHE DU BORD : l'étang a triplé de surface (v173) et les zones de vie sont
    // désormais fixées par les obstacles (v176) puis par les substrats. Mesure avant
    // ce garde-fou : depuis les 4 postes de berge, un lancer à 30 unités n'avait
    // AUCUN poisson à moins de 15 u (0, 1, 0, 0) ; or le bouchon n'intéresse un
    // poisson qu'à ~7 u. La pêche du bord — le seul mode avant la barque (180 XP) —
    // était morte.
    //
    // Pour CHAQUE poste, on rapproche donc quelques poissons de l'ancre de LEUR
    // substrat la plus proche : l'attraction par fond reste vraie (on ne change
    // jamais le substrat d'un poisson), on rapproche seulement sa zone de vie.
    // Les poissons d'un BANC ne sont pas déplacés seuls (ils perdraient leur banc).
    // -------------------------------------------------------------------------
    const POSTES_ANGLE = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const PAR_POSTE = 4;       // zones de vie garanties à portée de chaque poste
    const PORTEE_POSTE = 30;   // rayon de lancer couvert (portée réelle ≈ 52)

    function garantirPecheDuBord(poissons) {
        let deplaces = 0;
        POSTES_ANGLE.forEach(function (angle) {
            const ray = rayonEtang(angle) - 14;      // là où le pêcheur se tient
            const px = POND_CENTER.x + Math.cos(angle) * ray;
            const pz = POND_CENTER.z + Math.sin(angle) * ray;
            const proches = poissons.filter(function (f) {
                return !f.userData.hooked && f.userData.homeX !== undefined &&
                    Math.hypot(f.userData.homeX - px, f.userData.homeZ - pz) <= PORTEE_POSTE;
            }).length;
            let manque = PAR_POSTE - proches;
            if (manque <= 0) { return; }
            // Candidats : solitaires vivant sur un substrat, un par substrat à chaque
            // tour (round-robin) : sinon on dépêcherait toujours les mêmes espèces
            // profondes et la densité par fond s'effondrerait.
            const parSubstrat = {};
            poissons.forEach(function (f) {
                const d = f.userData;
                if (d.hooked || d.substratHabitat === undefined || d.groupeId !== undefined) { return; }
                (parSubstrat[d.substratHabitat] = parSubstrat[d.substratHabitat] || []).push(f);
            });
            const ids = Object.keys(parSubstrat);
            ids.forEach(function (id) {
                parSubstrat[id].sort(function (a, b) {
                    const da = Math.hypot(a.userData.homeX - POND_CENTER.x, a.userData.homeZ - POND_CENTER.z);
                    const db = Math.hypot(b.userData.homeX - POND_CENTER.x, b.userData.homeZ - POND_CENTER.z);
                    return db - da;
                });
            });
            for (let tour = 0; tour < PAR_POSTE && manque > 0; tour++) {
                for (let j = 0; j < ids.length && manque > 0; j++) {
                    const id = ids[(tour + j) % ids.length];
                    const f = parSubstrat[id].shift();
                    if (!f) { continue; }
                    const d = f.userData;
                    const liste = ancresDe(d.substratHabitat, !!COMPORTEMENTS[d.especeId].fosse);
                    let meilleure = null;
                    let meilleureDist = Infinity;
                    for (let k = 0; k < liste.length; k++) {
                        const dist = Math.hypot(liste[k].x - px, liste[k].z - pz);
                        if (dist < meilleureDist) { meilleureDist = dist; meilleure = liste[k]; }
                    }
                    if (!meilleure || meilleureDist > PORTEE_POSTE) { continue; }
                    // Pile sur l'ancre : un écart la ferait sortir de sa zone de fond,
                    // et la densité par substrat (mesurée en jeu) s'effondrerait.
                    const x = meilleure.x;
                    const z = meilleure.z;
                    d.homeX = x;
                    d.homeZ = z;
                    const fond = -profondeurLocale(x, z);
                    d.depth = d.couche === 'fond' ? fond + 0.45 : Math.max(d.depth, fond + 0.35);
                    f.position.x = x;
                    f.position.z = z;
                    f.position.y = d.depth - d.topOffset;
                    manque--;
                    deplaces++;
                }
            }
        });
        return deplaces;
    }

    // Quelles espèces vivent sur ce substrat (d'après COMPORTEMENTS), pour la légende.
    function especesDe(id) {
        return Object.keys(COMPORTEMENTS).filter(function (e) { return (COMPORTEMENTS[e].substrats || []).indexOf(id) >= 0; });
    }

    // Empreinte de la grille (FNV-1a) : deux exécutions doivent donner la même.
    function empreinte() {
        let h = 2166136261;
        for (let k = 0; k < grille.length; k++) { h = Math.imul(h ^ grille[k], 16777619) >>> 0; }
        return h.toString(16) + ':' + zones.length;
    }

    // --- Texture du fond (générée en code, 100 % procédurale) --------------------------------
    // Une image carrée centrée sur l'étang : chaque pixel prend la couleur du substrat de la
    // grille (fondue entre cellules voisines), avec un grain propre à chaque substrat.
    const COTE = demi * 2;
    const COULEURS = {
        sable: [222, 205, 150], gravier: [158, 152, 142], vase: [78, 68, 46],
        roche: [104, 110, 118], herbier: [58, 124, 66]
    };
    function hachage(i, j) {
        let h = Math.imul(i * 374761393 + j * 668265263, 1274126177);
        h = Math.imul(h ^ (h >>> 13), 1103515245);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function motif(id, x, z, px, py) {
        const t = bruit(x * 3.1, z * 3.1);
        const grain = hachage(px, py);
        let f = 1 + 0.16 * t + 0.06 * (grain - 0.5);
        if (id === 'gravier') { f *= grain > 0.9 ? 1.28 : (grain < 0.12 ? 0.68 : 1); }
        else if (id === 'roche') { f *= 0.88 + 0.22 * Math.abs(Math.sin((x + 0.8 * t) * 1.7 + z * 0.9)); }
        else if (id === 'herbier') { f *= 0.82 + 0.3 * Math.abs(Math.sin(x * 4.3 + 1.7 * t) * Math.cos(z * 2.1)); }
        else if (id === 'vase') { f *= 0.9 + 0.2 * t; }
        return f;
    }
    // Renvoie les pixels RGBA (Uint8ClampedArray taille × taille × 4) : testable sans canvas.
    function pixelsFond(taille) {
        const px = new Uint8ClampedArray(taille * taille * 4);
        const pas = COTE / taille;
        for (let py = 0; py < taille; py++) {
            for (let pxl = 0; pxl < taille; pxl++) {
                const x = X0 + (pxl + 0.5) * pas;
                const z = Z0 + (py + 0.5) * pas;
                // Léger désordre des limites (au plus 1 cellule) : la grille ne se devine pas.
                const wx = x + 0.9 * Math.sin(x * 0.9 + z * 0.37 + 3) * Math.cos(z * 0.8 - x * 0.21);
                const wz = z + 0.9 * Math.sin(z * 0.85 - x * 0.33 + 1) * Math.cos(x * 0.77 + z * 0.19);
                const fi = (wx - X0) / CELLULE - 0.5;
                const fj = (wz - Z0) / CELLULE - 0.5;
                const i0 = Math.floor(fi);
                const j0 = Math.floor(fj);
                const i1 = Math.min(N - 1, Math.max(0, i0 + 1));
                const j1 = Math.min(N - 1, Math.max(0, j0 + 1));
                const ia = Math.min(N - 1, Math.max(0, i0));
                const ja = Math.min(N - 1, Math.max(0, j0));
                const k00 = grille[ja * N + ia];
                const k10 = grille[ja * N + i1];
                const k01 = grille[j1 * N + ia];
                const k11 = grille[j1 * N + i1];
                const o = (py * taille + pxl) * 4;
                let r;
                let g;
                let b;
                if (k00 === k10 && k00 === k01 && k00 === k11) {
                    const id = IDS_SUBSTRATS[(k00 || 3) - 1];     // hors étang (marge) : vase sombre
                    const c = COULEURS[id];
                    const m = motif(id, x, z, pxl, py);
                    r = c[0] * m; g = c[1] * m; b = c[2] * m;
                } else {
                    const tx = fi - i0;
                    const tz = fj - j0;
                    r = 0; g = 0; b = 0;
                    const cellules = [k00, k10, k01, k11];
                    const poids = [(1 - tx) * (1 - tz), tx * (1 - tz), (1 - tx) * tz, tx * tz];
                    for (let q = 0; q < 4; q++) {
                        if (poids[q] <= 0) { continue; }
                        const id = IDS_SUBSTRATS[(cellules[q] || 3) - 1];
                        const c = COULEURS[id];
                        const m = motif(id, x, z, pxl, py);
                        r += c[0] * m * poids[q]; g += c[1] * m * poids[q]; b += c[2] * m * poids[q];
                    }
                }
                px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
            }
        }
        return px;
    }
    // Pose la texture sur le maillage du fond (échelle UV : voir makeFondGeometry).
    // Renvoie la texture, ou null sans canvas (tests) : le fond garde alors sa couleur unie.
    function habillerFond(maillage, taille) {
        try {
            const c = document.createElement('canvas');
            c.width = taille || 384;
            c.height = taille || 384;
            const g = c.getContext('2d');
            if (!g || !g.createImageData) { return null; }
            const image = g.createImageData(c.width, c.height);
            image.data.set(pixelsFond(c.width));
            g.putImageData(image, 0, 0);
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 4;
            maillage.material.map = tex;
            maillage.material.color.setHex(0xd6e6e8);   // légère teinte d'eau
            maillage.material.needsUpdate = true;
            return tex;
        } catch (erreur) {
            return null;
        }
    }

    return {
        SUBSTRATS: SUBSTRATS, ACCROCHAGES_FOND: ACCROCHAGES_FOND, SONS_FOND: SONS_FOND,
        grille: grille, COULEURS: COULEURS, taille: N, cellule: CELLULE, origine: { x: X0, z: Z0 }, cote: COTE,
        aires: aires, parts: parts, zones: zones, stats: stats,
        substratEn: substratEn, zoneEn: zoneEn, rectsCarte: rectsCarte, verdictFond: verdictFond,
        accrochageDe: accrochageDe, attirer: attirer, ancresDe: ancresDe, especesDe: especesDe,
        garantirPecheDuBord: garantirPecheDuBord,
        empreinte: empreinte, pixelsFond: pixelsFond, habillerFond: habillerFond,
        fetchEn: fetchEn, proximiteHerbier: function (x, z) {
            const i = Math.floor((x - X0) / CELLULE);
            const j = Math.floor((z - Z0) / CELLULE);
            return i < 0 || j < 0 || i >= N || j >= N ? 0 : proxGrille[j * N + i];
        },
        // Rejoue la construction : deux exécutions doivent donner la même grille et les mêmes zones.
        refaire: function () {
            return creerSubstrats(Object.assign({}, deps, { lilyPads: padsCopie, roseaux: roseauxCopie }));
        }
    };
}

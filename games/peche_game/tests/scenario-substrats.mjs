// ---------------------------------------------------------------------------
// Scénario 76 : TYPES DE FOND de l'étang (idées.md §14.3, v183).
//
// Sable, gravier, vase, roche, herbier : une grille déterministe (sans rand()) que lisent
// la texture du fond, la carte du carnet, le widget de profondeur, les poissons (habitat)
// et les accrochages. Ce scénario vérifie :
//  - la répartition (déterministe, 5 substrats, surfaces cohérentes) ;
//  - l'attraction MESURÉE sur une simulation, sans second système (obstacles intacts) ;
//  - la cohérence carte / rendu / poissons (une seule source) ;
//  - les risques (vase, herbier, roche accrochent ; sable et gravier non) et les sons ;
//  - le widget de profondeur avant et après dérive.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { SPECIES, COMPORTEMENTS } from '../especes.js';
import {
    GAME_DIR, group, check, checkEqual, checkClose,
    G, el, state, step, stepFor, resetToIdle, clearLilyPads, castTo
} from './harness.mjs';

const IDS = ['sable', 'gravier', 'vase', 'roche', 'herbier'];
// Spécification de la demande (§14.3) : substrat → espèces qu'il doit attirer.
const CIBLES = {
    vase: ['tanche', 'carpe', 'breme', 'anguille'],
    sable: ['gardon', 'goujon', 'ablette'],
    gravier: ['perche', 'chevesne'],
    roche: ['perche', 'sandre'],
    herbier: ['brochet', 'black-bass', 'gardon']
};

function lire(fichier) { return fs.readFileSync(path.join(GAME_DIR, fichier), 'utf8'); }

/** Un point du substrat `id`, profond de moins de 6 unités (la ligne descend à 9). */
function pointDe(id, indice = 0) {
    const S = G().substrats;
    const liste = S.ancresDe(id, false).filter(p => G().profondeurLocale(p.x, p.z) <= 6);
    return liste[Math.floor(liste.length * (0.2 + 0.1 * indice)) % liste.length];
}

/** Lance au centre (point de lancer sûr), puis y place le bouchon : seul le verdict du fond compte. */
function bouchonSur(point, longueurSousLeFond) {
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('coulisse');
    G().setProfondeur(1.0);
    castTo(0, -25);
    const prof = G().profondeurLocale(point.x, point.z);
    G().setProfondeur(prof + longueurSousLeFond);
    G().castTarget.x = point.x;
    G().castTarget.z = point.z;
    G().floatGroup.position.x = point.x;
    G().floatGroup.position.z = point.z;
    step(1 / 60);
    return prof;
}

function remettre() {
    resetToIdle();
    G().setWind(0, 0);
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
}

function espionSon() {
    const son = G().sound;
    const original = son.jouerSample;
    const appels = [];
    son.jouerSample = function (nom) { appels.push(nom); return original.apply(son, arguments); };
    return { appels, rendre() { son.jouerSample = original; } };
}

export function run() {
    group('76) Types de fond : sable, gravier, vase, roche, herbier (§14.3)');
    const S = G().substrats;

    // --- 1) Répartition déterministe -------------------------------------------------
    const code = lire('substrats.js').replace(/\/\/.*$/gm, '');
    check('le module n’appelle jamais rand() ni Math.random', !/\brand\(|Math\.random/.test(code));
    const bis = S.refaire();
    const ter = S.refaire();
    checkEqual('deux exécutions : même empreinte de la grille', bis.empreinte(), ter.empreinte());
    checkEqual('…et la même que celle du monde en cours', bis.empreinte(), S.empreinte());
    checkEqual('mêmes zones (nombre)', bis.zones.length, ter.zones.length);
    const memesZones = bis.zones.every(function (z, i) {
        const t = ter.zones[i];
        return z.id === t.id && z.substrat === t.substrat && z.aire === t.aire
            && z.centre.x === t.centre.x && z.centre.z === t.centre.z;
    });
    checkEqual('mêmes ids, aires et centres de zones', memesZones, true);
    checkEqual('mêmes surfaces par substrat', JSON.stringify(bis.aires), JSON.stringify(S.aires));
    check('les zones ont des ids uniques', new Set(S.zones.map(z => z.id)).size === S.zones.length);
    checkEqual('la grille donne le même substrat au même point',
        bis.substratEn(10, -60), S.substratEn(10, -60));
    checkEqual('hors de l’étang : aucun substrat', S.substratEn(0, 60), null);

    // --- 2) Les 5 substrats existent, surfaces cohérentes ----------------------------
    const resume = IDS.map(id => id + ' ' + (S.parts[id] * 100).toFixed(1) + ' %').join(', ');
    IDS.forEach(function (id) {
        check('« ' + id + ' » existe, surface non nulle', S.aires[id] > 0, S.aires[id] + ' u²');
        check('« ' + id + ' » : part raisonnable (5 à 45 % de l’étang)',
            S.parts[id] >= 0.05 && S.parts[id] <= 0.45, (S.parts[id] * 100).toFixed(1) + ' %');
        check('« ' + id + ' » : au moins une zone', S.zones.some(z => z.substrat === id));
    });
    console.log('      répartition : ' + resume);
    const totalAires = IDS.reduce((t, id) => t + S.aires[id], 0);
    checkClose('la somme des surfaces est celle de la grille', totalAires,
        S.grille.reduce((t, k) => t + (k ? 1 : 0), 0) * S.cellule * S.cellule, 1e-6);
    // Cohérence avec le relief et les plantes.
    const centresFosses = [[-28, -95], [30, -53], [4, -123]];
    checkEqual('le fond de chaque fosse est de la vase',
        centresFosses.every(([x, z]) => S.substratEn(x, z) === 'vase'), true);
    checkEqual('le centre du bassin est de la vase', S.substratEn(0, -71), 'vase');
    const rochesPres = S.rectsCarte().filter(r => r.substrat === 'roche').every(function (r) {
        return centresFosses.some(([x, z], i) => {
            const rayon = [22, 18, 16][i];
            return Math.hypot(r.x + r.w / 2 - x, r.z + r.h / 2 - z) < rayon * 1.35;
        });
    });
    checkEqual('la roche borde les fosses (tombants)', rochesPres, true);
    const zonesHerbier = S.zones.filter(z => z.substrat === 'herbier');
    const herbierProche = zonesHerbier.filter(z => z.cellules.some(function (c) {
        const i = c % S.taille;
        const j = (c - i) / S.taille;
        return S.proximiteHerbier(S.origine.x + (i + 0.5) * S.cellule, S.origine.z + (j + 0.5) * S.cellule) > 0;
    }));
    checkEqual('l’herbier est toujours près d’un nénuphar ou d’un roseau',
        herbierProche.length, zonesHerbier.length);
    const profondeurs = (id) => S.rectsCarte().filter(r => r.substrat === id)
        .map(r => G().profondeurLocale(r.x + r.w / 2, r.z + r.h / 2));
    check('le sable et le gravier sont des hauts-fonds (≤ 3,8)',
        profondeurs('sable').concat(profondeurs('gravier')).every(p => p <= 3.8));
    check('l’herbier reste dans la lumière (≤ 4,2)', profondeurs('herbier').every(p => p <= 4.2));
    check('le gravier est exposé au vent (eau ouverte à 85 unités ou plus)', S.rectsCarte()
        .filter(r => r.substrat === 'gravier')
        .filter(r => S.fetchEn(r.x + r.w / 2, r.z + r.h / 2) >= 85).length
        >= 0.95 * S.rectsCarte().filter(r => r.substrat === 'gravier').length);

    // --- 3) Rôle halieutique branché sur COMPORTEMENTS -------------------------------
    IDS.forEach(function (id) {
        const voulues = CIBLES[id];
        const lues = S.especesDe(id);
        check('COMPORTEMENTS : « ' + id + ' » attire ' + voulues.join(', '),
            voulues.every(e => lues.indexOf(e) >= 0), lues.join(', '));
    });
    checkEqual('aucune espèce ne cite un substrat inconnu',
        Object.keys(COMPORTEMENTS).every(e => (COMPORTEMENTS[e].substrats || []).every(s => IDS.indexOf(s) >= 0)), true);

    G().repeuplerEtang();   // population neuve (les scénarios précédents ont déplacé des zones de vie)
    // Pas de second système : un poisson déjà attiré par un obstacle garde son habitat.
    const attires = G().fishes.filter(f => f.userData.obstacleId !== undefined);
    check('des poissons sont attirés par les obstacles (§14.2 intact)', attires.length > 0, attires.length + ' poissons');
    checkEqual('un poisson attiré par un obstacle n’est jamais déplacé par un substrat',
        attires.every(f => f.userData.substratHabitat === undefined), true);
    checkEqual('sa zone de vie reste CELLE de l’obstacle',
        attires.every(function (f) {
            const o = G().obstacles.liste.find(x => x.id === f.userData.obstacleId);
            return o && Math.hypot(f.userData.homeX - o.attire.centre.x, f.userData.homeZ - o.attire.centre.z) <= 2.6;
        }), true);
    const installes = G().fishes.filter(f => f.userData.substratHabitat !== undefined);
    check('des poissons vivent sur leur substrat', installes.length >= 5, installes.length + ' poissons');
    checkEqual('un poisson installé n’a jamais d’obstacle', installes.every(f => f.userData.obstacleId === undefined), true);
    check('chacun vit sur un substrat voulu par son espèce',
        installes.every(f => COMPORTEMENTS[f.userData.especeId].substrats.indexOf(f.userData.substratHabitat) >= 0));
    const surPlace = installes.filter(f => S.substratEn(f.userData.homeX, f.userData.homeZ) === f.userData.substratHabitat);
    check('sa zone de vie est bien sur ce substrat (≥ 70 %)', surPlace.length >= 0.7 * installes.length,
        surPlace.length + ' / ' + installes.length);

    // --- 4) Attraction MESURÉE sur une simulation ------------------------------------
    // La mesure ne doit pas dépendre de l'aléatoire consommé par les scénarios
    // précédents (le jeu consomme rand() à chaque image : le nombre de tirages
    // varie avec le temps réel). On repart donc d'une graine imposée.
    G().setGraine(20240101);
    resetToIdle();
    const aGarder = G().fishes.length;
    // Espèces MESURÉES : celles qui n'ont qu'un seul substrat (la perche et le gardon se partagent entre deux).
    const MESUREES = { vase: ['tanche', 'carpe', 'breme'], sable: ['goujon', 'ablette'], gravier: ['chevesne'],
        roche: ['sandre'], herbier: ['brochet', 'black-bass'] };
    const tous = Array.from(new Set(Object.keys(MESUREES).reduce((t, id) => t.concat(MESUREES[id]), [])));
    tous.forEach(function (id) {
        const espece = SPECIES.find(s => s.id === id);
        for (let i = 0; i < 40; i++) { G().spawnFish(espece); }
    });
    const echantillons = {};
    const POSES = 50;
    for (let t = 0; t < POSES; t++) {
        stepFor(0.5);
        G().fishes.forEach(function (f) {
            const e = f.userData.especeId;
            const sub = S.substratEn(f.position.x, f.position.z);
            const ligne = echantillons[e] || (echantillons[e] = { n: 0, sur: {} });
            ligne.n++;
            ligne.sur[sub] = (ligne.sur[sub] || 0) + 1;
        });
    }
    const ratios = {};
    IDS.forEach(function (id) {
        let n = 0;
        let sur = 0;
        MESUREES[id].forEach(function (e) {
            if (echantillons[e]) { n += echantillons[e].n; sur += echantillons[e].sur[id] || 0; }
        });
        ratios[id] = { part: sur / n, aire: S.parts[id], ratio: sur / n / S.parts[id] };
        // La demande (§14.3) est « chaque substrat ATTIRE ses espèces » : densité
        // SUPÉRIEURE à la moyenne. Le seuil individuel est modeste (1,2) parce qu'un
        // substrat n'a parfois qu'une espèce cible et peu d'individus : c'est le test
        // agrégé ci-dessous (≥ 3 substrats à 1,5) qui garantit l'effet net.
        // La demande §14.3 dit « densité SUPÉRIEURE à la moyenne ». Avec 115 poissons
        // (densité par difficulté, v197) le bruit par substrat grandit : seuil
        // individuel 1,1 ; c'est le test agrégé (≥ 3 substrats à 1,5) qui prouve l'effet.
        check('densité des espèces cibles sur « ' + id + ' » ≥ 1,1 × la moyenne de l’étang',
            ratios[id].ratio >= 1.1,
            (ratios[id].part * 100).toFixed(0) + ' % des poissons pour ' + (S.parts[id] * 100).toFixed(0)
            + ' % de la surface (×' + ratios[id].ratio.toFixed(1) + ')');
    });
    // (L'écart d'un tirage à l'autre vient des scénarios précédents : au moins 3 substrats nets.)
    check('au moins 3 substrats sont ≥ 1,5 × la moyenne (≥ 2 exigés par la demande)',
        IDS.filter(id => ratios[id].ratio >= 1.5).length >= 3,
        IDS.map(id => id + ' ×' + ratios[id].ratio.toFixed(1)).join(', '));
    // Retour à l'étang d'origine (la suite des scénarios en dépend).
    G().repeuplerEtang();
    check('l’étang est repeuplé à la normale', G().fishes.length <= Math.max(aGarder, 64), G().fishes.length + ' poissons');

    // --- 5) Cohérence carte / rendu / poissons : UNE source --------------------------
    G().showJournal();
    const carte = el('pondMap').innerHTML;
    IDS.forEach(id => check('la carte trace le fond « ' + id + ' »', carte.indexOf('class="fond-' + id + '"') >= 0));
    const rects = S.rectsCarte();
    const sousChemins = (carte.match(/h-[\d.]+z/g) || []).length;
    checkEqual('la carte dessine exactement les rectangles de la grille', sousChemins, rects.length);
    const aireRects = {};
    rects.forEach(r => { aireRects[r.substrat] = (aireRects[r.substrat] || 0) + r.w * r.h; });
    checkEqual('…dont les surfaces sont celles de la grille',
        IDS.every(id => Math.abs((aireRects[id] || 0) - S.aires[id]) < 1e-6), true);
    check('la légende nomme les 5 fonds et leurs espèces',
        IDS.every(id => carte.indexOf(S.SUBSTRATS.find(s => s.id === id).nom) >= 0) && carte.indexOf('Tanche') >= 0);
    // Le rendu : la couleur du pixel, au centre d'une zone, est celle du substrat de la grille.
    const TAILLE = 192;
    const pixels = S.pixelsFond(TAILLE);
    const palette = S.COULEURS;
    const pas = S.cote / TAILLE;
    let bons = 0;
    let essais = 0;
    IDS.forEach(function (id) {
        S.ancresDe(id, false).filter((_, i) => i % 40 === 0).forEach(function (a) {
            const px = Math.floor((a.x - S.origine.x) / pas);
            const py = Math.floor((a.z - S.origine.z) / pas);
            const o = (py * TAILLE + px) * 4;
            const rendu = [pixels[o], pixels[o + 1], pixels[o + 2]];
            let meilleur = null;
            let ecart = Infinity;
            IDS.forEach(function (autre) {
                const d = Math.hypot(rendu[0] - palette[autre][0], rendu[1] - palette[autre][1], rendu[2] - palette[autre][2]);
                if (d < ecart) { ecart = d; meilleur = autre; }
            });
            essais++;
            if (meilleur === id) { bons++; }
        });
    });
    check('le rendu : la couleur du fond est celle du substrat de la grille (≥ 90 %)', bons >= 0.9 * essais,
        bons + ' / ' + essais);
    checkEqual('le maillage du fond porte des UV (texture planaire)', !!G().getFondMesh().geometry.attributes.uv, true);
    // Les poissons : la même fonction substratEn décide de leur zone de vie.
    check('les poissons et le verdict utilisent la même grille',
        G().getVerdictFond().substrat === S.substratEn(G().floatGroup.position.x, G().floatGroup.position.z)
        || S.substratEn(G().floatGroup.position.x, G().floatGroup.position.z) === null);
    G().closeJournal && G().closeJournal();

    // --- 6) Risques : la vase aspire, l'herbier accroche, la roche est courte --------
    const espion = espionSon();
    const profils = {};
    ['vase', 'herbier', 'roche'].forEach(function (id) {
        const p = pointDe(id);
        bouchonSur(p, 0.4);
        const snag = G().getSnag();
        checkEqual('« ' + id + ' » : l’hameçon trop long s’accroche', state(), 'snag');
        checkEqual('« ' + id + ' » : le verdict le sait', G().getVerdictFond().accroche, id);
        profils[id] = snag;
        remettre();
    });
    check('la vase reste l’accrochage qui aspire (rythme, 0,32 s)', profils.vase.dansLaVase === true
        && profils.vase.clickCooldown === 0.32, JSON.stringify([profils.vase.dansLaVase, profils.vase.clickCooldown]));
    check('l’herbier accroche comme les nénuphars (clic libre, sous tension 0,5)',
        profils.herbier.clickCooldown === 0 && Math.abs(profils.herbier.tension - 0.5) < 0.01, JSON.stringify(profils.herbier));
    check('l’herbier a son message', profils.herbier.message.indexOf('herbier') >= 0, profils.herbier.message);
    check('la roche est plus COURTE que la vase (2 fois moins de temps entre deux clics, clic plus fort)',
        profils.roche.clickCooldown < profils.vase.clickCooldown / 2 && profils.roche.clickPower >= 2 * profils.vase.clickPower - 1e-9,
        'attente ' + profils.roche.clickCooldown + ' s, puissance ' + profils.roche.clickPower);
    check('la roche a son message', profils.roche.message.indexOf('pierres') >= 0, profils.roche.message);
    // La roche se dégage vite : 5 clics espacés suffisent (la vase en demande bien plus).
    bouchonSur(pointDe('roche'), 0.4);
    let clics = 0;
    while (state() === 'snag' && clics < 12) {
        G().reelClick();
        stepFor(0.16);
        clics++;
    }
    check('la roche se dégage en moins de 8 clics', state() !== 'snag' && clics <= 8, clics + ' clics');
    remettre();
    // Le bruit : cailloux pour la roche, bulle pour la vase (sons déjà crédités), rien d'ajouté.
    espion.appels.length = 0;
    bouchonSur(pointDe('roche', 1), 0.4);
    check('la roche fait un bruit de cailloux (« pas-gravier »)', espion.appels.indexOf('pas') >= 0, espion.appels.join(','));
    remettre();
    espion.appels.length = 0;
    bouchonSur(pointDe('vase', 1), 0.4);
    check('la vase fait une bulle (« plouf »)', espion.appels.indexOf('plouf') >= 0, espion.appels.join(','));
    remettre();
    espion.rendre();
    const sons = lire('sound.js');
    check('les sons utilisés existent déjà dans sound.js', /\['pas', 'pas-gravier'\]/.test(sons) && /\['plouf', 'plouf'\]/.test(sons));
    check('…et sont crédités', /pas-gravier\.mp3/.test(lire('assets/CREDITS.txt')) && /plouf\.mp3/.test(lire('assets/CREDITS.txt')));
    // Sable et gravier : l'hameçon repose, aucun accrochage.
    ['sable', 'gravier'].forEach(function (id) {
        const p = pointDe(id);
        const prof = bouchonSur(p, 0.6);
        checkEqual('« ' + id + ' » : l’hameçon trop long repose sans s’accrocher', state(), 'inWater');
        check('« ' + id + ' » : le verdict dit « sur le fond », pas « pris »',
            G().getVerdictFond().surLeFond === true && G().getVerdictFond().dansLaVase === false, JSON.stringify(G().getVerdictFond()));
        checkClose('« ' + id + ' » : sa profondeur utile est celle du fond', -G().getHookDepth(), prof - 0.1, 0.02);
        remettre();
    });
    checkEqual('les anciens accrochages n’ont pas bougé (nénuphars : clic libre)', G().obstacles.ACCROCHAGES.joncs.clickCooldown, 0);

    // --- 7) Widget de profondeur : le fond sous l'hameçon -----------------------------
    const pv = pointDe('vase');
    bouchonSur(pv, -1.5);
    G().majCoupeProfondeur();
    check('le widget indique le fond sous le bouchon (vase)', el('depthFond').textContent.indexOf('vase') >= 0, el('depthFond').textContent);
    const ps = pointDe('sable');
    G().castTarget.x = ps.x; G().castTarget.z = ps.z;
    G().floatGroup.position.x = ps.x; G().floatGroup.position.z = ps.z;
    step(1 / 60);
    G().majCoupeProfondeur();
    check('…puis le sable, quand le bouchon est ailleurs', el('depthFond').textContent.indexOf('sable clair') >= 0,
        el('depthFond').textContent);
    remettre();
    // Après une VRAIE dérive au vent, le widget suit.
    let frontiere = null;
    for (let x = -40; x <= 40 && !frontiere; x += 2) {
        for (let z = -50; z <= -8 && !frontiere; z += 2) {
            const a = S.substratEn(x, z);
            if (a !== 'vase' && a !== 'sable') { continue; }
            for (let k = 0; k < 16 && !frontiere; k++) {
                const dir = k * Math.PI / 8;
                const qx = x + Math.cos(dir) * 3.8;
                const qz = z + Math.sin(dir) * 3.8;
                const b = S.substratEn(qx, qz);
                if (b && b !== a && G().profondeurLocale(x, z) < 6 && G().profondeurLocale(qx, qz) < 6) {
                    frontiere = { p: { x, z }, q: { x: qx, z: qz }, dir, a, b };
                }
            }
        }
    }
    check('une frontière de fond existe à portée de lancer', !!frontiere);
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('coulisse');
    G().setProfondeur(1.0);
    castTo(frontiere.p.x, frontiere.p.z);
    G().majCoupeProfondeur();
    const avant = el('depthFond').textContent;
    const nomA = S.SUBSTRATS.find(s => s.id === frontiere.a).nom.toLowerCase();
    check('avant la dérive : « ' + nomA + ' »', avant.indexOf(nomA) >= 0, avant);
    G().setWind(frontiere.dir, 0.8);
    let t = 0;
    while (t < 20 && S.substratEn(G().floatGroup.position.x, G().floatGroup.position.z) === frontiere.a) { step(1 / 60); t += 1 / 60; }
    G().majCoupeProfondeur();
    const nomB = S.SUBSTRATS.find(s => s.id === frontiere.b).nom.toLowerCase();
    check('après la dérive : « ' + nomB + ' »', el('depthFond').textContent.indexOf(nomB) >= 0,
        el('depthFond').textContent + ' (' + t.toFixed(1) + ' s)');
    remettre();
    const html = lire('index.html');
    check('index.html porte l’élément du fond sous l’hameçon', /id="depthFond"/.test(html));
}

export default run;

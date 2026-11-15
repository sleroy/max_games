// ---------------------------------------------------------------------------
// Scénario 73 : OBSTACLES AQUATIQUES (idées.md §14.2, v174).
//
// Ponton, écluse, douve, roches, souches, pieux, épave, îlots de joncs :
//  - placement déterministe, sans jamais consommer rand() ;
//  - aucun chevauchement avec les 4 postes de berge, la bourriche, le point de départ,
//    le point d'embarquement de la barque, les fosses ;
//  - (accrochage, attraction et collision : voir les groupes suivants).
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { SPECIES } from '../especes.js';
import { COMPORTEMENTS } from '../especes.js';
import {
    GAME_DIR, group, check, checkEqual,
    G, el, fire, resetToIdle, castTo, step, stepFor, state
} from './harness.mjs';

const TYPES_ATTENDUS = ['ponton', 'ecluse', 'douve', 'roches', 'souche', 'pieux', 'epave', 'joncs'];

function distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Le jeu a-t-il la barque ? (achat avec l'XP si besoin) */
export function assurerBarque() {
    G().setExperience(G().getBateauPrix());
    G().acheterBateau();   // sans effet si la barque est déjà achetée
}

/** Un point d'eau libre juste à côté de l'obstacle, qui coince l'hameçon sans être sur la pierre. */
export function pointAccroche(o) {
    const O = G().obstacles;
    for (const c of o.cercles) {
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2;
            const p = { x: c.x + Math.cos(a) * (c.r + 0.4), z: c.z + Math.sin(a) * (c.r + 0.4) };
            const dx = p.x - G().getPondCenter().x;
            const dz = p.z - G().getPondCenter().z;
            const dedans = Math.hypot(dx, dz) < G().getRayonEtang(Math.atan2(dz, dx)) - 4;
            if (dedans && O.accrocheEn(p) === o && O.lancerBloque(p) === null) { return p; }
        }
    }
    return null;
}

/** Lance la ligne pour que l'hameçon retombe EXACTEMENT en (x, z) malgré le vent. */
export function lancerSur(x, z) {
    const vent = G().getWind();
    return castTo(x - Math.cos(vent.dir) * vent.strength * 2.5, z - Math.sin(vent.dir) * vent.strength * 2.5);
}

export function run() {
    group('73) Obstacles aquatiques : placement, non-chevauchement (v174)');
    G().recommencerPartie();
    resetToIdle();

    const O = G().obstacles;
    const centre = G().getPondCenter();

    // --- 1) Les obstacles existent : un type, une position dans l'eau, un rayon ---
    check('au moins 8 obstacles posés', O.liste.length >= 8, O.liste.length + ' obstacles');
    const types = new Set(O.liste.map(o => o.type));
    TYPES_ATTENDUS.forEach(function (type) {
        check('type « ' + type + ' » présent', types.has(type));
    });
    O.liste.forEach(function (o) {
        const dx = o.x - centre.x;
        const dz = o.z - centre.z;
        const dedans = Math.hypot(dx, dz) < G().getRayonEtang(Math.atan2(dz, dx)) - 0.5;
        check(o.id + ' : un type connu, une position DANS l’eau et un rayon',
            !!O.TYPES[o.type] && dedans && o.rayon > 0.5 && Number.isFinite(o.x) && Number.isFinite(o.z),
            o.type + ' (' + o.x.toFixed(1) + ' ; ' + o.z.toFixed(1) + ') r = ' + o.rayon.toFixed(1));
    });

    // --- 2) Déterminisme : le même placement à chaque exécution, sans rand() ---
    const second = O.refaire();
    check('deux placements donnent exactement les mêmes obstacles',
        second.empreinte() === O.empreinte(), O.liste.length + ' obstacles, positions et cercles identiques');
    checkEqual('… et le même nombre', second.liste.length, O.liste.length);
    const code = fs.readFileSync(path.join(GAME_DIR, 'obstacles.js'), 'utf8')
        .replace(/\/\/.*$/gm, '');
    check('obstacles.js ne consomme jamais rand() ni Math.random',
        !/Math\.random|\brand\s*\(/.test(code));

    // --- 3) Non-chevauchement : postes de berge, bourriche, départ, fosses ---
    const fosses = G().getEtangInfo().fosses;
    const anglerDepart = { x: 0, z: 0 };
    for (let poste = 0; poste < 4; poste++) {
        G().placerAuPoste(poste);
        const pecheur = { x: G().angler.position.x, z: G().angler.position.z };
        const bourriche = G().getBourriche();
        if (poste === 0) { anglerDepart.x = pecheur.x; anglerDepart.z = pecheur.z; }
        let pecheurLibre = true;
        let bourricheLibre = true;
        let couloirLibre = true;
        O.liste.forEach(function (o) {
            o.cercles.forEach(function (c) {
                if (distance2D(c, pecheur) < c.r + 5) { pecheurLibre = false; }
                if (distance2D(c, bourriche) < c.r + bourriche.radius + 2) { bourricheLibre = false; }
                // Le tir vers le centre depuis le poste ne passe pas par un obstacle proche.
                const ux = centre.x - pecheur.x;
                const uz = centre.z - pecheur.z;
                const n = Math.hypot(ux, uz);
                const t = ((c.x - pecheur.x) * ux + (c.z - pecheur.z) * uz) / n;
                const lateral = Math.abs((c.x - pecheur.x) * uz - (c.z - pecheur.z) * ux) / n;
                if (t > 0 && t < 40 && lateral < c.r + 4) { couloirLibre = false; }
            });
        });
        check('poste ' + poste + ' : pêcheur à l’écart de tout obstacle', pecheurLibre);
        check('poste ' + poste + ' : bourriche à l’écart de tout obstacle', bourricheLibre);
        check('poste ' + poste + ' : les 40 premières unités de tir vers l’étang sont libres', couloirLibre);
    }
    G().placerAuPoste(0);
    check('le point de départ du pêcheur est libre',
        O.liste.every(o => o.cercles.every(c => distance2D(c, anglerDepart) > c.r + 5)));

    let fosseLibre = true;
    O.liste.forEach(function (o) {
        o.cercles.forEach(function (c) {
            if (!c.eau) { return; }
            fosses.forEach(function (f) {
                if (distance2D(c, f) < f.rayon + c.r) { fosseLibre = false; }
            });
        });
    });
    check('aucun obstacle ne ferme une fosse (on peut y pêcher)', fosseLibre);

    // Aucun obstacle ne chevauche un autre.
    let chevauche = false;
    O.liste.forEach(function (a, i) {
        O.liste.forEach(function (b, j) {
            if (j <= i) { return; }
            a.cercles.forEach(function (ca) {
                b.cercles.forEach(function (cb) {
                    if (distance2D(ca, cb) < ca.r + cb.r) { chevauche = true; }
                });
            });
        });
    });
    check('aucun obstacle ne chevauche un autre', !chevauche);

    // Aucun obstacle sur un nénuphar de départ.
    check('aucun obstacle ne recouvre un nénuphar', O.nenupharsDepart.length === 40
        && O.liste.every(o => o.cercles.every(c => !c.eau
            || O.nenupharsDepart.every(p => distance2D(c, p) >= c.r + p.radius))));

    // --- 4) La barque ne naît jamais sur un obstacle (embarquement depuis chaque poste) ---
    assurerBarque();
    for (let poste = 0; poste < 4; poste++) {
        G().placerAuPoste(poste);
        const monte = G().embarquerBateau();
        const barque = G().getBateau();
        check('poste ' + poste + ' : on embarque', monte);
        check('poste ' + poste + ' : la barque naît en eau libre',
            monte && O.heurtBarque(barque.x, barque.z) === null);
        G().quitterBateau();
    }
    G().placerAuPoste(0);
    resetToIdle();

    // --- 5) ACCROCHAGE : l'hameçon posé sur un obstacle se coince, avec SON message ---
    group('73b) Obstacles : accrochage (difficulté et message propres à chacun)');
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    const accrochables = O.liste.filter(o => o.profil);
    check('tous les obstacles sauf la douve peuvent accrocher', accrochables.length === O.liste.length - 1,
        accrochables.length + ' sur ' + O.liste.length);
    const messages = new Set();
    accrochables.forEach(function (o) {
        const p = pointAccroche(o);
        check(o.id + ' : un point d’accrochage existe', !!p);
        if (!p) { return; }
        resetToIdle();
        G().lilyPads.length = 0;
        G().recommencerPartie();
        lancerSur(p.x, p.z);
        check(o.id + ' : l’hameçon se coince (état snag)', state() === 'snag', state());
        const snag = G().getSnag();
        check(o.id + ' : bon type d’obstacle dans l’accrochage', snag && snag.obstacle === o.type,
            snag && snag.obstacle);
        check(o.id + ' : message « ' + o.profil.message + ' »',
            el('struggleInfo').textContent === o.profil.message, el('struggleInfo').textContent);
        check(o.id + ' : le statut répète le message',
            el('status').textContent.indexOf(o.profil.message) === 0, el('status').textContent);
        check(o.id + ' : réglages repris du profil (rythme ' + o.profil.clickCooldown + ' s)',
            snag && Math.abs(snag.clickCooldown - o.profil.clickCooldown) < 1e-9
            && Math.abs(snag.clickPower - o.profil.clickPower) < 1e-9);
        messages.add(o.profil.message);
        resetToIdle();
    });
    check('chaque type d’obstacle a son propre message', messages.size === new Set(accrochables.map(o => o.type)).size,
        messages.size + ' messages');
    // Difficulté : de plus en plus dure, mais toujours possible au rythme demandé.
    const niveaux = { facile: 1, moyenne: 2, difficile: 3 };
    Object.keys(O.ACCROCHAGES).forEach(function (cle) {
        const a = O.ACCROCHAGES[cle];
        const cadence = a.clickCooldown > 0 ? Math.min(1 / a.clickCooldown, 5) : 5;
        const tire = a.pullRate + a.burstStrength / a.burstInterval;
        check(cle + ' (' + a.difficulte + ') : niveau cohérent', niveaux[a.difficulte] === a.niveau);
        check(cle + ' : dégageable en cliquant au rythme demandé',
            a.clickPower * cadence > tire, (a.clickPower * cadence).toFixed(2) + ' > ' + tire.toFixed(2));
    });
    check('la souche, l’épave et l’écluse sont plus dures que les joncs et les pieux',
        ['souche', 'epave', 'ecluse'].every(c => O.ACCROCHAGES[c].niveau > O.ACCROCHAGES.joncs.niveau
            && O.ACCROCHAGES[c].niveau > O.ACCROCHAGES.pieux.niveau));
    check('la souche tire plus fort que la vase (0,08 / 0,08 / 0,32 s)',
        O.ACCROCHAGES.souche.pullRate + O.ACCROCHAGES.souche.burstStrength / O.ACCROCHAGES.souche.burstInterval
        > 0.08 + 0.08 / 0.9);

    // Cliquer en rythme dégage la souche ; ne rien faire casse la ligne.
    const souche = O.liste.find(o => o.type === 'souche');
    const ps = pointAccroche(souche);
    resetToIdle();
    lancerSur(ps.x, ps.z);
    let t = 0;
    while (state() === 'snag' && t < 30) {
        fire('fishButton', 'click');
        step(souche.profil.clickCooldown + 0.02);
        t += souche.profil.clickCooldown + 0.02;
    }
    check('en cliquant en rythme, la souche lâche', state() === 'reeling', state() + ' après ' + t.toFixed(1) + ' s');
    check('… et cela prend plusieurs secondes', t > 2, t.toFixed(1) + ' s');
    resetToIdle();
    lancerSur(ps.x, ps.z);
    let attente = 0;
    while (state() === 'snag' && attente < 30) { step(0.1); attente += 0.1; }
    check('sans cliquer, la ligne casse', state() === 'broken' || state() === 'idle', state());
    resetToIdle();
    G().recommencerPartie();

    attraction(O);
    collisions(O);
    posteSurPonton(O);
}

/** Densité (poissons / unité²) de l'espèce près de ses obstacles, moyennée sur 4 instants de simulation. */
function mesurerDensites(O, especeId, obstaclesCibles) {
    const surface = G().getEtangInfo().surfaceHa * 4 * 10000;   // unités² (2 unités = 1 m)
    let proches = 0;
    let total = 0;
    for (let instant = 0; instant < 4; instant++) {
        stepFor(5, 0.05);
        G().fishes.forEach(function (f) {
            if (f.userData.especeId !== especeId) { return; }
            total++;
            if (obstaclesCibles.some(o => Math.hypot(f.position.x - o.attire.centre.x,
                f.position.z - o.attire.centre.z) < o.attire.rayon)) { proches++; }
        });
    }
    const aire = obstaclesCibles.length * Math.PI * obstaclesCibles[0].attire.rayon ** 2;
    return { autour: proches / 4 / aire, etang: total / 4 / surface, proches: proches / 4, total: total / 4 };
}

function attraction(O) {
    group('73c) Obstacles : attraction d’un type d’espèce autour de chaque obstacle');
    const pardon = {};
    O.liste.forEach(o => { (pardon[o.type] = pardon[o.type] || []).push(o); });

    // --- Les espèces attirées existent dans COMPORTEMENTS (reliées à especes.js) ---
    Object.keys(O.TYPES).forEach(function (type) {
        check(type + ' : espèces attirées connues (' + O.TYPES[type].especes.join(', ') + ')',
            O.TYPES[type].especes.every(id => !!COMPORTEMENTS[id] && SPECIES.some(e => e.id === id)));
    });
    check('arbres immergés → brochet et black-bass (embuscade)',
        O.TYPES.souche.especes.includes('brochet') && O.TYPES.souche.especes.includes('black-bass')
        && COMPORTEMENTS.brochet.humeur === 'embuscade');
    check('roches → perche', O.TYPES.roches.especes.join() === 'perche');
    check('ponton → gardons', O.TYPES.ponton.especes.join() === 'gardon');
    check('joncs → brochet + gardon', O.TYPES.joncs.especes.join() === 'brochet,gardon');

    // --- 1) Population naturelle : une espèce qui a un obstacle en a au moins un ---
    G().repeuplerEtang();
    const presentes = new Set(G().fishes.map(f => f.userData.especeId));
    let testes = 0;
    O.liste.forEach(function (o) {
        o.attire.especes.forEach(function (id) {
            if (!presentes.has(id)) { return; }
            const aCetObstacle = G().fishes.some(f => f.userData.obstacleId === o.id && f.userData.especeId === id);
            const aUnObstacle = G().fishes.some(f => f.userData.especeId === id && !!f.userData.obstacleId);
            if (!aUnObstacle) {
                check('espèce « ' + id + ' » présente : attirée par au moins un de ses obstacles', false);
            } else if (aCetObstacle) { testes++; }
        });
    });
    check('l’étang naturel attire au moins 4 (espèce, obstacle)', testes >= 4, testes + ' couples');
    const attirees = G().fishes.filter(f => f.userData.obstacleId);
    check('une partie seulement des poissons est attirée (le reste vit librement)',
        attirees.length > 0 && attirees.length < G().fishes.length,
        attirees.length + ' sur ' + G().fishes.length);
    check('un poisson attiré vit près de son obstacle (zone de vie déplacée)',
        attirees.every(function (f) {
            const o = O.liste.find(x => x.id === f.userData.obstacleId);
            return Math.hypot(f.userData.homeX - o.attire.centre.x, f.userData.homeZ - o.attire.centre.z) < 6;
        }));

    // --- 2) Simulation : pour CHAQUE espèce reliée, plus dense autour de ses obstacles ---
    const parEspece = {};
    O.liste.forEach(o => o.attire.especes.forEach(id => { (parEspece[id] = parEspece[id] || []).push(o); }));
    Object.keys(parEspece).forEach(function (id) {
        G().repeuplerEtang();
        const espece = SPECIES.find(e => e.id === id);
        // Trois poissons de l'espèce, puis attraction forcée (un lot de plusieurs est toujours attiré).
        const lot = [G().spawnFish(espece), G().spawnFish(espece), G().spawnFish(espece)];
        O.attirer(lot);
        const cibles = parEspece[id];
        const m = mesurerDensites(O, id, cibles);
        check(id + ' : plus dense autour de ses obstacles (' + cibles.map(o => o.type).join(', ') + ') que dans l’étang',
            m.autour > 2 * m.etang && m.proches >= 1,
            (m.autour * 1000).toFixed(2) + ' ‰ contre ' + (m.etang * 1000).toFixed(2) + ' ‰ ('
            + m.proches.toFixed(1) + ' sur ' + m.total.toFixed(1) + ')');
    });

    // --- 3) Un poisson de la population naturelle reste près de son obstacle ---
    G().repeuplerEtang();
    const tenant = G().fishes.find(f => f.userData.obstacleId);
    if (tenant) {
        const o = O.liste.find(x => x.id === tenant.userData.obstacleId);
        stepFor(30, 0.05);
        check('après 30 s de simulation, le poisson attiré est toujours dans sa zone',
            Math.hypot(tenant.position.x - o.attire.centre.x, tenant.position.z - o.attire.centre.z) < o.attire.rayon + 6,
            Math.hypot(tenant.position.x - o.attire.centre.x, tenant.position.z - o.attire.centre.z).toFixed(1) + ' unités');
    }
    G().repeuplerEtang();
}

export default run;

/** Place la barque à `recul` unités de l'obstacle, sur l'axe centre → obstacle. */
function placerBarqueDevant(o, recul) {
    if (!G().isBateau()) { G().embarquerBateau(); }
    let ecart = o.angle - G().getEmplacement().angle;
    while (ecart > Math.PI) { ecart -= Math.PI * 2; }
    while (ecart < -Math.PI) { ecart += Math.PI * 2; }
    G().deplacerBateau(ecart, 0);
    const centre = G().getPondCenter();
    const distObstacle = Math.hypot(o.x - centre.x, o.z - centre.z);
    const marge = distObstacle - recul - G().getRayonEtang(o.angle);
    G().deplacerBateau(0, marge - G().getEmplacement().marge);
}

/** Rame vers la berge, pas à pas : renvoie ce qui s'est passé. */
function ramerVersLaBerge(O, max) {
    const trace = { pas: 0, bloque: false, distanceMin: Infinity, ralenti: false, plusPetitPas: Infinity };
    let dernier = G().getBateau();
    for (let i = 0; i < max; i++) {
        const ok = G().deplacerBateau(0, 2.4);
        const b = G().getBateau();
        const deplace = Math.hypot(b.x - dernier.x, b.z - dernier.z);
        if (!ok) { trace.bloque = true; break; }
        if (deplace < 0.01) { break; }          // borne de l'étang : rien ne bouge
        trace.pas++;
        trace.plusPetitPas = Math.min(trace.plusPetitPas, deplace);
        const touche = O.heurtBarque(b.x, b.z);
        if (touche && touche.effet === 'ralenti') { trace.ralenti = true; }
        O.liste.forEach(function (o) {
            o.cercles.forEach(function (c) {
                if (c.barque === false || !o.barque || o.barque !== 'arret') { return; }
                trace.distanceMin = Math.min(trace.distanceMin, distance2D(b, c) - c.r);
            });
        });
        dernier = b;
    }
    return trace;
}

function collisions(O) {
    group('73d) Obstacles : la barque bute dessus, le lancer retombe dessus');
    G().recommencerPartie();
    resetToIdle();
    assurerBarque();
    G().placerAuPoste(0);

    // --- Barque : arrêtée par les ouvrages, ralentie par les joncs ---
    const arret = O.liste.filter(o => o.barque === 'arret');
    arret.forEach(function (o) {
        G().placerAuPoste(0);
        placerBarqueDevant(o, 16);
        const avant = G().getBateau();
        check(o.id + ' : la barque est au large, en eau libre', O.heurtBarque(avant.x, avant.z) === null);
        const trace = ramerVersLaBerge(O, 30);
        check(o.id + ' : la barque est ARRÊTÉE (le coup de rame est refusé)', trace.bloque,
            trace.pas + ' pas réussis');
        check(o.id + ' : elle ne traverse jamais l’obstacle (coque ≥ ' + O.RAYON_BARQUE + ' du bord)',
            trace.distanceMin >= O.RAYON_BARQUE - 0.2, trace.distanceMin.toFixed(2) + ' de jeu');
        check(o.id + ' : le message nomme l’obstacle',
            el('status').textContent.indexOf(o.nom) >= 0, el('status').textContent);
        const fin = G().getBateau();
        check(o.id + ' : elle ne bouge plus, même en insistant',
            G().deplacerBateau(0, 2.4) === false && distance2D(fin, G().getBateau()) < 0.01);
        // On peut s'en éloigner (reculer vers le centre) : la barque n'est pas coincée.
        check(o.id + ' : on peut reculer vers le centre', G().deplacerBateau(0, -6) === true);
    });
    check('6 types d’ouvrages arrêtent la barque', new Set(arret.map(o => o.type)).size === 6,
        [...new Set(arret.map(o => o.type))].join(', '));

    const joncs = O.liste.find(o => o.type === 'joncs');
    G().placerAuPoste(0);
    placerBarqueDevant(joncs, 14);
    const libre = ramerVersLaBerge(O, 3);
    check('en eau libre, un coup de rame avance de ≈ 2,4', libre.plusPetitPas > 2, libre.plusPetitPas.toFixed(2));
    const dedans = ramerVersLaBerge(O, 30);
    check('les joncs ralentissent la barque (sans l’arrêter)', dedans.ralenti && dedans.plusPetitPas < 1.4,
        'plus petit pas ' + dedans.plusPetitPas.toFixed(2));
    check('… et le message parle des joncs', el('status').textContent.indexOf('joncs') >= 0, el('status').textContent);
    const douve = O.liste.find(o => o.type === 'douve');
    check('la douve ne bloque pas la barque (elle est sur la rive)', O.heurtBarque(douve.x, douve.z) === null);
    G().quitterBateau();
    G().placerAuPoste(0);
    resetToIdle();

    // --- Lancer : refusé sur un ouvrage, accroché sur une souche ou des joncs ---
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    O.liste.filter(o => o.bloqueLancer).forEach(function (o) {
        const c = o.cercles.find(x => x.eau);
        resetToIdle();
        const etatApres = lancerSur(c.x, c.z);
        check(o.id + ' : le lancer sur ' + o.nom + ' est refusé (la ligne reste au repos)', etatApres === 'idle', etatApres);
        check(o.id + ' : le message explique pourquoi', el('status').textContent.indexOf('retombe sur ' + o.nom) >= 0,
            el('status').textContent);
    });
    ['souche', 'joncs', 'epave', 'pieux'].forEach(function (type) {
        const o = O.liste.find(x => x.type === type);
        resetToIdle();
        const etatApres = lancerSur(o.cercles[0].x, o.cercles[0].z);
        check(o.id + ' : le lancer pile dessus accroche (pas de lancer refusé)', etatApres === 'snag', etatApres);
        resetToIdle();
    });
    resetToIdle();
    const libreX = O.liste.find(o => o.type === 'roches');
    check('une eau libre n’est pas bloquée', O.lancerBloque({ x: 0, z: -71 }) === null
        && O.accrocheEn({ x: 0, z: -71 }) === null && !!libreX);
    G().recommencerPartie();
}

function posteSurPonton(O) {
    group('73e) Le ponton est un poste de pêche confortable');
    G().recommencerPartie();
    resetToIdle();
    const pp = O.pontonPoste;
    check('le ponton propose un poste', !!pp);
    const ponton = O.liste.find(o => o.type === 'ponton');
    const centre = G().getPondCenter();
    check('choisir l’axe du ponton sur la carte réussit', G().choisirEmplacement(pp.axe + 0.01, 3));
    const p = G().angler.position;
    const dist = Math.hypot(p.x - centre.x, p.z - centre.z);
    check('le pêcheur est DANS l’eau, sur le plancher (marge ' + G().getEmplacement().marge.toFixed(1) + ')',
        G().getEmplacement().marge < -9 && dist < G().getRayonEtang(Math.atan2(p.z - centre.z, p.x - centre.x)) - 9);
    check('… à moins de 2 unités de l’axe des planches',
        ponton.cercles.some(c => distance2D(c, p) < 2));
    check('… debout au niveau du plancher (0,67)', Math.abs(p.y - pp.hauteur) < 0.01, p.y.toFixed(2));
    check('la boussole annonce le ponton', el('compass').textContent.indexOf('ponton') >= 0, el('compass').textContent);
    check('un angle voisin hors du ponton reste sur la berge',
        G().choisirEmplacement(pp.axe + 0.2, 3) && G().getEmplacement().marge > 0 && Math.abs(G().angler.position.y - 0.35) < 0.01);
    G().choisirEmplacement(pp.axe, 3);
    const ux = centre.x - G().angler.position.x;
    const uz = centre.z - G().angler.position.z;
    const n = Math.hypot(ux, uz);
    check('on pêche depuis le ponton (le lancer vers l’étang part)',
        castTo(G().angler.position.x + ux / n * 25, G().angler.position.z + uz / n * 25) === 'inWater');
    resetToIdle();
    G().placerAuPoste(0);
    check('retour au poste sud : à terre, niveau de la berge', G().getEmplacement().marge > 0
        && Math.abs(G().angler.position.y - 0.35) < 0.01);
    G().recommencerPartie();
}

// ---------------------------------------------------------------------------
// Scénario 75 : un petit coup de moulinet attire les poissons TOUT PROCHES (§14.9, v181).
//
// Un léger mouvement de la manivelle crée un remous (etat.remous, 0 → 1) qui ravive
// l'intérêt des poissons à ≈ 3 unités du bouchon : rayon petit, effet décroissant et
// plafonné, aucun effet en combat / accrochage / emmêlement, et un geste franc ramène
// toujours la ligne.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, state, step, stepFor, resetToIdle, clearLilyPads, castTo, startFight,
    crankTurns, distanceToShore, parkFish
} from './harness.mjs';

const VISEE = { x: 0, z: -25 };

function distanceBouchon(fish) {
    const b = G().floatGroup.position;
    return Math.hypot(fish.position.x - b.x, fish.position.z - b.z);
}

/** Pose un poisson à `dist` unités du bouchon : presque immobile, vue très courte. */
function placer(fish, dist, options = {}) {
    const b = G().floatGroup.position;
    const d = fish.userData;
    fish.position.set(b.x + dist, -2, b.z);
    d.groupeId = undefined;
    d.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    d.couche = options.couche || 'mi-eau';
    d.homeX = b.x;
    d.homeZ = b.z;
    d.homeRadius = 20;
    d.aggression = options.aggression || 1.0;
    d.comp = Object.assign({}, d.comp, {
        vue: 1.0, nocturne: false, croisiere: 0.02, humeur: options.humeur || 'errant'
    });
    d.depth = options.profondeur === undefined ? G().getHookDepth() - 0.1 : options.profondeur;
    d.vx = 0;
    d.vz = 0;
}

function unPoisson(index) {
    return G().fishes.filter(f => !f.userData.hooked && !f.userData.biting)[index];
}

/** Ligne neuve à l'eau, tous les poissons loin, pas de vent. */
function prepare() {
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    castTo(VISEE.x, VISEE.z);
    parkFish();
}

/** Distance finale d'un poisson posé à `dist`, avec ou sans petit coup de moulinet. */
function essai(dist, tours, secondes, options) {
    prepare();
    const fish = unPoisson(options && options.index || 0);
    placer(fish, dist, options);
    if (tours > 0) { crankTurns(tours); }
    stepFor(secondes);
    const fin = distanceBouchon(fish);
    const etatFin = state();
    resetToIdle();
    return { fin, etatFin };
}

export function run() {
    group('75) Petit coup de moulinet : attire les poissons tout proches (§14.9)');

    // --- Un poisson à 2 unités se rapproche ---------------------------------
    const temoin = essai(2, 0, 0.4);
    const avecCoup = essai(2, 0.1, 0.4);
    checkClose('sans coup de moulinet, le poisson tout proche reste sur place', temoin.fin, 2, 0.1);
    check('après un petit coup, le poisson à 2 unités se rapproche du bouchon',
        avecCoup.fin < temoin.fin - 0.4 || avecCoup.etatFin === 'bite',
        'témoin ' + temoin.fin.toFixed(2) + ' → avec coup ' + avecCoup.fin.toFixed(2) + ' (' + avecCoup.etatFin + ')');
    checkEqual('un petit coup ne ramène pas la ligne : toujours à l’eau (ou touche)',
        avecCoup.etatFin === 'inWater' || avecCoup.etatFin === 'bite', true);

    // --- L'attraction déplace l'intérêt, pas la couche d'eau -----------------
    prepare();
    const f = unPoisson(0);
    placer(f, 2);
    const profondeurAvant = f.userData.depth;
    crankTurns(0.1);
    stepFor(0.3);
    checkEqual('le poisson est intéressé (retour visuel du bouchon)', G().getBaitInterest(), true);
    checkEqual('le poisson ne change pas de couche d’eau', f.userData.depth, profondeurAvant);
    resetToIdle();

    // --- Un poisson à 20 unités ne bouge pas ---------------------------------
    prepare();
    const loin = unPoisson(0);
    placer(loin, 20);
    const avantX = loin.position.x;
    const avantZ = loin.position.z;
    crankTurns(0.1);
    stepFor(1.5);
    check('un poisson à 20 unités ne bouge pas',
        Math.hypot(loin.position.x - avantX, loin.position.z - avantZ) < 0.2,
        'déplacé de ' + Math.hypot(loin.position.x - avantX, loin.position.z - avantZ).toFixed(2));
    checkEqual('aucun intérêt pour le remous à 20 unités', G().getBaitInterest(), false);
    resetToIdle();
    // Même à 5 unités (rayon d’intérêt normal : 7), le remous ne porte pas.
    const cinq = essai(5, 0.1, 0.5);
    checkClose('à 5 unités, le remous ne porte pas (rayon ≈ 3)', cinq.fin, 5, 0.2);

    // --- Le remous se recoit selon l'espèce ----------------------------------
    // Un carnassier en embuscade sent plus loin qu'un poisson ordinaire…
    const ordinaire = essai(3.5, 0.1, 0.4, { humeur: 'errant' });
    const embuscade = essai(3.5, 0.1, 0.4, { humeur: 'embuscade' });
    checkClose('à 3,5 unités, un poisson ordinaire ne réagit pas', ordinaire.fin, 3.5, 0.15);
    check('à 3,5 unités, un carnassier en embuscade réagit',
        embuscade.fin < 3.5 - 0.3 || embuscade.etatFin === 'bite',
        embuscade.fin.toFixed(2) + ' (' + embuscade.etatFin + ')');
    // … et un poisson méfiant (peu agressif) moins fort.
    const mefiant = essai(2, 0.1, 0.4, { aggression: 0.5 });
    checkClose('un poisson méfiant ne réagit pas à 2 unités', mefiant.fin, 2, 0.15);
    // Un poisson de fond reste au fond : hameçon en surface, il ne réagit pas.
    const fond = essai(2, 0.1, 0.4, { couche: 'fond' });
    checkClose('un poisson de fond ne quitte pas sa couche (hameçon hors de portée)', fond.fin, 2, 0.15);

    // --- Effet temporaire et décroissant --------------------------------------
    prepare();
    crankTurns(0.1);
    step(1 / 60);
    const apresCoup = G().etat.remous;
    check('le coup crée un remous', apresCoup > 0.9, apresCoup.toFixed(2));
    stepFor(1);
    const apres1s = G().etat.remous;
    check('le remous décroît', apres1s < apresCoup - 0.2, apresCoup.toFixed(2) + ' → ' + apres1s.toFixed(2));
    stepFor(2.5);
    checkEqual('après quelques secondes, l’effet est nul', G().etat.remous, 0);
    const placeTard = unPoisson(0);
    placer(placeTard, 2);
    stepFor(0.4);
    checkClose('un poisson posé après l’effet ne réagit plus', distanceBouchon(placeTard), 2, 0.1);
    resetToIdle();

    // --- Plafond : marteler la manivelle ne cumule pas -------------------------
    prepare();
    let maximum = 0;
    for (let i = 0; i < 12; i++) {
        crankTurns(0.1);                  // un petit coup…
        step(1 / 60);
        maximum = Math.max(maximum, G().etat.remous);
        stepFor(0.6);                     // … puis une pause : le geste est fini, pas de rappel
        maximum = Math.max(maximum, G().etat.remous);
    }
    checkEqual('douze coups espacés : toujours à l’eau (pas de rappel)', state(), 'inWater');
    check('l’intensité du remous ne dépasse jamais 1', maximum <= 1, maximum.toFixed(3));
    crankTurns(0.1);
    crankTurns(0.1);                      // deux coups dans la même image
    step(1 / 60);
    check('deux coups rapprochés : toujours plafonné à 1', G().etat.remous <= 1,
        G().etat.remous.toFixed(3));
    const plafonne = unPoisson(0);
    placer(plafonne, 4);
    stepFor(0.5);
    checkClose('même martelé, le remous ne porte pas à 4 unités (< 3,9)', distanceBouchon(plafonne), 4, 0.2);
    resetToIdle();

    // --- Aucun effet en combat, accrochage, emmêlement ------------------------
    startFight(0, -30);
    const prochePendantCombat = unPoisson(0);
    crankTurns(0.05);
    step(1 / 60);
    checkEqual('en combat : aucun remous', G().etat.remous, 0);
    resetToIdle();

    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().lilyPads.push({ x: VISEE.x, z: VISEE.z, radius: 6 });
    castTo(VISEE.x, VISEE.z);
    checkEqual('ligne accrochée aux nénuphars', state(), 'snag');
    const prochePendantSnag = unPoisson(0);
    placer(prochePendantSnag, 2);
    crankTurns(0.1);
    stepFor(0.4);
    checkEqual('accroché : aucun remous', G().etat.remous, 0);
    checkClose('accroché : le poisson proche ne vient pas', distanceBouchon(prochePendantSnag), 2, 0.2);
    checkEqual('accroché : aucun intérêt', G().getBaitInterest(), false);
    resetToIdle();

    prepare();
    G().forcerEmmElement();
    checkEqual('ligne emmêlée', state(), 'tangle');
    crankTurns(0.1);
    stepFor(0.3);
    checkEqual('emmêlé : aucun remous', G().etat.remous, 0);
    G().abandonnerEmmElement();
    resetToIdle();

    // --- Le rappel de ligne par la manivelle fonctionne toujours --------------
    prepare();
    crankTurns(0.1);
    stepFor(0.2);
    checkEqual('un petit coup (0,1 tour) ne ramène pas la ligne', state(), 'inWater');
    crankTurns(0.12);
    stepFor(0.1);
    checkEqual('un second petit coup (0,22 au total) non plus', state(), 'inWater');
    crankTurns(0.12);
    step(1 / 60);
    checkEqual('trois coups enchaînés (0,34 tour) : la ligne est rappelée', state(), 'reeling');
    resetToIdle();

    prepare();
    crankTurns(1);
    step(1 / 60);
    checkEqual('un tour de manivelle ramène la ligne', state(), 'reeling');
    checkEqual('le rappel coupe le remous', G().etat.remous, 0);
    const avant = distanceToShore();
    crankTurns(2);
    stepFor(1);
    check('la manivelle ramène toujours la ligne', distanceToShore() < avant - 2,
        avant.toFixed(1) + ' → ' + distanceToShore().toFixed(1));
    resetToIdle();

    // Un geste lent mais continu finit aussi par ramener la ligne (compromis voulu).
    prepare();
    let tours = 0;
    while (state() === 'inWater' && tours < 1) {
        crankTurns(0.05);
        stepFor(0.1);
        tours += 0.05;
    }
    checkEqual('mouliner franchement (même lentement) ramène la ligne', state(), 'reeling');
    check('… après ≈ 0,3 tour', tours >= 0.25 && tours <= 0.45, tours.toFixed(2) + ' tour');
    resetToIdle();
}

export default run;

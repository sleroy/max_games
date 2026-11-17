// ---------------------------------------------------------------------------
// Scénario 80 : la ligne qui bouge attire les poissons (plouf d'arrivée + sillage).
//
// Deux bruits de la ligne s'ajoutent au remous du petit coup de moulinet :
//  - le PLOUF du bouchon à l'arrivée (rayon 7, 2,5 s) attire les poissons déjà proches ;
//  - le SILLAGE de la remontée (rayon 6) attire les poissons et les fait suivre la
//    ligne qui avance vers la berge. Sans mouvement, plus rien : ce n'est pas un aimant.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, state, step, stepFor, stepUntil, resetToIdle, clearLilyPads, castTo,
    parkFish, crankTurns, distanceToShore
} from './harness.mjs';

const VISEE = { x: 0, z: -25 };

function distanceBouchon(fish) {
    const b = G().floatGroup.position;
    return Math.hypot(fish.position.x - b.x, fish.position.z - b.z);
}

/** Pose un poisson presque immobile autour de `centre` (par défaut le bouchon). */
function placer(fish, dist, centre, options = {}) {
    const c = centre || G().floatGroup.position;
    const d = fish.userData;
    fish.position.set(c.x + dist, -2, c.z);
    d.groupeId = undefined;
    d.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    d.couche = options.couche || 'mi-eau';
    d.homeX = c.x;
    d.homeZ = c.z;
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

/** Lance avec un poisson déjà posé à `dist` du point visé (pour le plouf d'arrivée). */
function lancerAvecPoissonProche(dist) {
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    parkFish();
    const fish = unPoisson(0);
    placer(fish, dist, VISEE);
    G().startCast({ x: VISEE.x, y: 0, z: VISEE.z });
    stepUntil(() => state() !== 'flying', 3);
    return fish;
}

export function run() {
    group('80) La ligne qui bouge attire les poissons (plouf et sillage)');

    // --- Le plouf d'arrivée attire un poisson déjà tout proche ----------------
    const proche = lancerAvecPoissonProche(4);
    const apresPlouf = distanceBouchon(proche);
    stepFor(0.6);
    const apres = distanceBouchon(proche);
    check('le plouf d’arrivée attire le poisson proche du bouchon',
        apres < apresPlouf - 0.3 || state() === 'bite',
        apresPlouf.toFixed(2) + ' → ' + apres.toFixed(2) + ' (' + state() + ')');
    checkEqual('le plouf ne ramène pas la ligne', state() === 'inWater' || state() === 'bite', true);
    resetToIdle();

    // --- Un poisson loin du plouf ne bouge pas --------------------------------
    const loin = lancerAvecPoissonProche(12);
    const avantLoin = distanceBouchon(loin);
    stepFor(0.6);
    checkClose('un poisson à 12 unités ne réagit pas au plouf (rayon 7)',
        distanceBouchon(loin), avantLoin, 0.2);
    resetToIdle();

    // --- Le sillage de la remontée attire et fait suivre la ligne --------------
    prepare();
    const suiveur = unPoisson(0);
    placer(suiveur, 5);
    const avantSuiveur = distanceBouchon(suiveur);
    const avantBerge = distanceToShore();
    crankTurns(0.5);                 // geste franc : la ligne passe en remontée
    step(1 / 60);
    checkEqual('la ligne est en remontée', state(), 'reeling');
    // Le geste franc est consommé par le rappel : un petit tour de plus fait avancer la ligne.
    crankTurns(0.05);
    step(1 / 60);
    check('la ligne avance vers la berge', distanceToShore() < avantBerge - 0.05,
        avantBerge.toFixed(1) + ' → ' + distanceToShore().toFixed(1));
    // On mouline lentement pendant 2 s : la ligne avance vers la berge, le poisson suit.
    for (let i = 0; i < 40; i++) {
        crankTurns(0.05);
        stepFor(0.05);
        if (state() === 'bite') { break; }
    }
    const apresSuiveur = distanceBouchon(suiveur);
    check('le sillage attire le poisson vers la ligne qui avance',
        apresSuiveur < avantSuiveur - 0.3 || state() === 'bite',
        avantSuiveur.toFixed(2) + ' → ' + apresSuiveur.toFixed(2) + ' (' + state() + ')');
    resetToIdle();

    // --- Sans mouvement, pas de sillage : ce n'est pas un aimant ----------------
    prepare();
    const immobile = unPoisson(0);
    placer(immobile, 5);
    const avantImmobile = distanceBouchon(immobile);
    stepFor(2);
    checkClose('sans mouvement, le poisson à 5 unités ne vient pas',
        distanceBouchon(immobile), avantImmobile, 0.2);
    resetToIdle();

    // --- Un poisson de fond ne quitte pas sa couche -----------------------------
    prepare();
    const fond = unPoisson(0);
    placer(fond, 5, null, { couche: 'fond' });
    const avantFond = distanceBouchon(fond);
    crankTurns(0.5);
    step(1 / 60);
    stepFor(1);
    checkClose('un poisson de fond ne quitte pas sa couche (hameçon en surface)',
        distanceBouchon(fond), avantFond, 0.2);
    resetToIdle();
}

export default run;

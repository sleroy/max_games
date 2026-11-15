// ---------------------------------------------------------------------------
// Scénario 58 : les ONDULATIONS avant la touche sont ALÉATOIRES.
// Avant, le bouchon mordillait selon un cycle fixe (time % 4) avec un rond
// toutes les 1,8 s : le joueur pouvait chronométrer. Maintenant les intervalles,
// durées et amplitudes varient, et chaque approche de poisson repart d'une
// séquence différente. La VRAIE touche, elle, n'est pas randomisée.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, resetToIdle, clearLilyPads, castTo, forceBite, strike,
    step, stepFor, state, adapterAuBouchon
} from './harness.mjs';

/** Prend le premier poisson disponible et le place dans la zone de l'hameçon. */
function poissonInteresse() {
    const fish = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    if (!fish) {
        throw new Error('aucun poisson disponible');
    }
    fish.userData.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    fish.userData.depth = G().getHookDepth();
    adapterAuBouchon(fish);
    fish.userData.vx = 0;
    fish.userData.vz = 0;
    return fish;
}

/** Maintient un poisson à 6,4 unités du bouchon (intéressé, mais sans mordre). */
function tenirInteresse(fish, secondes, aChaquePas) {
    const pas = 0.02;
    for (let t = 0; t < secondes; t += pas) {
        // Les autres poissons restent loin : seul celui du test intéresse le bouchon.
        G().fishes.forEach(function (autre) {
            if (autre !== fish && !autre.userData.hooked) {
                autre.position.set(-45, -2, 5);
                autre.userData.vx = 0;
                autre.userData.vz = 0;
            }
        });
        const base = G().floatGroup.position;
        fish.position.set(base.x + 6.4, -2, base.z);
        fish.userData.vx = 0;
        fish.userData.vz = 0;
        fish.userData.depth = G().getHookDepth();
        step(pas);
        if (aChaquePas) {
            aChaquePas(t, G().getNibble());
        }
    }
}

export function run() {
    group('58) Les ondulations avant la touche sont aléatoires');
    G().recommencerPartie();
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);

    const fish = poissonInteresse();
    const base = G().floatGroup.position;
    fish.position.set(base.x + 6.4, -2, base.z);
    step(0.02);
    checkEqual('un poisson s’intéresse à l’hameçon', G().getBaitInterest(), true);
    const premiere = G().getNibble();
    check('le premier mordillement n’arrive pas immédiatement',
        premiere.suivant > 0.1, premiere.suivant.toFixed(2) + ' s');
    check('le premier délai reste court', premiere.suivant < 1.2,
        premiere.suivant.toFixed(2) + ' s');

    // --- 20 s d'observation : intervalles, durées et amplitudes varient ---
    const intervalles = [];
    const amplitudes = [];
    const vides = [];
    let dernierDebut = null;
    let etaitActif = false;
    tenirInteresse(fish, 20, function (t, n) {
        if (n.actif && !etaitActif) {
            if (dernierDebut !== null) {
                intervalles.push(t - dernierDebut);
            }
            dernierDebut = t;
            amplitudes.push(n.amplitude);
        }
        if (!n.actif && etaitActif) {
            vides.push(n.suivant);
        }
        etaitActif = n.actif;
    });

    check('plusieurs mordillements ont eu lieu', amplitudes.length >= 4,
        amplitudes.length + ' mordillements');
    check('les intervalles entre mordillements varient',
        Math.max.apply(null, intervalles) - Math.min.apply(null, intervalles) > 0.2,
        intervalles.map(v => v.toFixed(2)).join(' / ') + ' s');
    check('aucun intervalle n’est recyclé à l’identique',
        new Set(intervalles.map(v => v.toFixed(2))).size >= 2,
        intervalles.map(v => v.toFixed(2)).join(' / '));
    check('les amplitudes varient aussi',
        new Set(amplitudes.map(v => v.toFixed(3))).size >= 2,
        amplitudes.map(v => v.toFixed(3)).join(' / '));
    check('les temps d’attente après un mordillement sont aléatoires',
        new Set(vides.map(v => v.toFixed(2))).size >= 2,
        vides.map(v => v.toFixed(2)).join(' / '));
    check('les temps d’attente restent dans une plage crédible',
        vides.every(v => v > 0.1 && v < 3.2),
        vides.map(v => v.toFixed(2)).join(' / '));

    // --- Chaque approche repart d'une séquence différente ---
    const graineA = premiere.graine;
    const delaiA = premiere.suivant;
    resetToIdle();
    stepFor(1.37);
    clearLilyPads();
    castTo(0, -25);
    const fish2 = poissonInteresse();
    const base2 = G().floatGroup.position;
    fish2.position.set(base2.x + 6.4, -2, base2.z);
    step(0.02);
    const seconde = G().getNibble();
    check('une nouvelle approche change la graine aléatoire',
        seconde.graine !== graineA,
        graineA + ' -> ' + seconde.graine);
    check('les deux approches n’ont pas le même premier délai',
        seconde.suivant !== delaiA,
        delaiA.toFixed(3) + ' vs ' + seconde.suivant.toFixed(3) + ' s');

    // --- La VRAIE touche n'est pas randomisée : elle reste jouable ---
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    checkEqual('la vraie touche se déclenche toujours', state(), 'bite');
    strike();
    check('le ferrage fonctionne toujours',
        state() === 'struggle' || state() === 'reeling', state());
    resetToIdle();

    clearLilyPads();
    G().demarrerJeu();
}

export default run;

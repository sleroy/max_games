// ---------------------------------------------------------------------------
// Scénario : plus de poissons qui « tournent autour » sans fin (bug signalé 2026-11-16).
// Le bouchon mordillait (intérêt des poissons) alors qu'aucune touche n'était possible :
//  - un poisson qui ne PEUT PAS prendre l'esche (vif pour une carpe, bouillette pour un petit)
//    l'ignore : il ne vient plus tourner autour ;
//  - un hameçon dans la vase n'attire personne ;
//  - un poisson qui tourne autour depuis trop longtemps sans mordre se lasse (pour ce lancer).
// ---------------------------------------------------------------------------
import { SPECIES } from '../especes.js';
import { PATIENCE_POISSON } from '../esches.js';
import {
    group, check, checkEqual, G, state, step, stepFor, resetToIdle, clearLilyPads, castTo, parkFish, adapterAuBouchon
} from './harness.mjs';

/** Lance, puis pose un poisson de l'espèce juste à côté du bouchon, à la profondeur de l'hameçon. */
function poserPres(especeId, profondeur) {
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('coulisse');
    G().setProfondeur(profondeur);
    castTo(0, -25);
    parkFish();
    const fish = G().spawnFish(SPECIES.find(s => s.id === especeId));
    const b = G().floatGroup.position;
    fish.position.set(b.x + 1.5, G().getHookDepth() - 0.1, b.z);
    fish.userData.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    fish.userData.hooked = false;
    fish.userData.biting = false;
    adapterAuBouchon(fish);
    fish.userData.vx = 0;
    fish.userData.vz = 0;
    return fish;
}

function retirer(fish) {
    const i = G().fishes.indexOf(fish);
    if (i >= 0) { G().fishes.splice(i, 1); }
}

export function run() {
    group('Poissons qui tournent autour sans mordre (vif, vase, lassitude)');
    const e = G().etat;
    e.eschesActives = true;
    G().setDifficulty('normal');

    // 1) Vif / leurre : une carpe l'ignore, elle ne vient pas tourner autour.
    e.equiperEsche('vif');
    const carpe = poserPres('carpe', 2.0);
    let interet = false;
    for (let i = 0; i < 60; i++) { stepFor(0.05); interet = interet || carpe.userData.targeting === true; }
    check('vif : une carpe tout près ne vise pas l’hameçon', !interet);
    check('…et le bouchon ne fait pas de touche', state() !== 'bite', state());
    retirer(carpe);

    // …alors qu'un brochet, lui, vient bien voir.
    const brochet = poserPres('brochet', 2.0);
    let vise = false;
    for (let i = 0; i < 60 && !vise; i++) { stepFor(0.05); vise = brochet.userData.targeting === true || state() === 'bite'; }
    check('vif : un brochet tout près vient bien sur l’hameçon', vise);
    retirer(brochet);

    // 2) Hameçon dans la vase : personne ne s'y intéresse.
    e.equiperEsche('ver');
    const gardon = poserPres('gardon', 2.0);
    e.hameconDansLaVase = true;
    let interetVase = false;
    for (let i = 0; i < 60; i++) {
        // Une image à la fois : la nage des poissons lit le drapeau AVANT que le fond réel
        // ne soit rejugé sous le bouchon (dans la même image).
        e.hameconDansLaVase = true;
        step(1 / 60);
        interetVase = interetVase || e.baitInterest === true;
    }
    check('hameçon dans la vase : aucun poisson ne vient mordiller', !interetVase);
    e.hameconDansLaVase = false;
    retirer(gardon);

    // 3) Lassitude : trop longtemps autour de l'hameçon sans mordre → il abandonne pour ce lancer.
    const lent = poserPres('gardon', 2.0);
    const d = lent.userData;
    d.escheLancer = -1;
    e.patienceEsche(d, PATIENCE_POISSON - 1);
    checkEqual('avant ' + PATIENCE_POISSON + ' s : il insiste encore', e.refuseLEsche(d), false);
    e.patienceEsche(d, 2);
    checkEqual('après ' + PATIENCE_POISSON + ' s sans mordre : il se lasse', e.refuseLEsche(d), true);
    checkEqual('…et ne vise plus l’hameçon', d.targeting, false);
    retirer(lent);

    // Mode facile : une bonne esche (> 60 %) attire, une mauvaise est ignorée ; jamais de lassitude.
    G().setDifficulty('facile');
    e.equiperEsche('mais');
    const facile = poserPres('carpe', 2.0);
    checkEqual('facile : la carpe vient sur du maïs', e.escheSansEspoir(facile.userData), false);
    facile.userData.escheLancer = -1;
    e.patienceEsche(facile.userData, PATIENCE_POISSON * 3);
    checkEqual('facile : pas de lassitude', e.refuseLEsche(facile.userData), false);
    retirer(facile);

    e.equiperEsche('vif');
    const facileVif = poserPres('carpe', 2.0);
    checkEqual('facile : la carpe ignore un vif (sans espoir)', e.escheSansEspoir(facileVif.userData), true);
    let interetFacile = false;
    for (let i = 0; i < 60; i++) { stepFor(0.05); interetFacile = interetFacile || facileVif.userData.targeting === true; }
    check('facile : carpe + vif ⇒ elle ne vise pas l’hameçon', !interetFacile);
    check('facile : carpe + vif ⇒ aucune touche', state() !== 'bite', state());
    retirer(facileVif);

    resetToIdle();
    G().setDifficulty('normal');
    e.equiperEsche('ver');
    e.eschesActives = false;
}

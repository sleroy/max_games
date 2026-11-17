// ---------------------------------------------------------------------------
// Scénario : ligne qu'on ramène.
//  1) Amorce possible pendant qu'on ramène la ligne (sans poisson ferré).
//  2) Combat raté : le bouchon reste là où on l'a ramené, il ne revient pas au
//     point du ferrage / du lancer.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, G, el, fire, step, stepFor, stepUntil, castTo, clearLilyPads, resetToIdle, forceBite, state, parkFish
} from './harness.mjs';

export function run() {
    group('Ligne ramenée : amorce possible pendant la remontée');
    G().setTangleChance(0);
    resetToIdle();
    clearLilyPads();
    castTo(0, -30);
    G().turnCrank(3);
    step(1 / 60);
    checkEqual('un tour de manivelle : la ligne remonte', state(), 'reeling');
    G().updateToolDock();
    checkEqual('le bouton Amorce reste actif pendant la remontée',
        el('feedButton').disabled, G().stockAmorce() === 0);
    fire('feedButton', 'click');
    checkEqual('le mode amorçage s’arme pendant la remontée', G().etat.feedMode, true);
    fire('feedButton', 'click');
    checkEqual('re-cliquer désarme l’amorce', G().etat.feedMode, false);

    group('Ligne ramenée : le bouchon reste là où on l’a ramené');
    resetToIdle();
    clearLilyPads();
    castTo(0, -30);
    const fish = forceBite();
    fish.userData.especeId = 'carpe';
    stepUntil(() => G().getBitePhase() === 'touche', 45);
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('poisson ferré : combat', state(), 'struggle');
    const depart = G().castTarget.clone();
    // On ramène un peu, puis on laisse filer le temps : combat raté.
    for (let i = 0; i < 4; i++) { G().turnCrank(1); step(1 / 60); }
    G().etat.biteCooldown = 30;
    parkFish();   // aucun autre poisson ne doit mordre juste après (on mesure le bouchon seul)
    G().etat.struggleTimeLeft = 0.01;
    stepUntil(() => state() !== 'struggle', 3);
    checkEqual('combat raté : on remonte la ligne', state(), 'reeling');
    checkEqual('combat raté : plus de poisson ferré', G().etat.hookedFish, null);
    const apres = G().floatGroup.position.clone();
    const ancre = G().etat.ancreBouchon;
    check('le point de pêche suit le bouchon ramené',
        Math.hypot(ancre.x - apres.x, ancre.z - apres.z) < 0.3,
        'ancre (' + ancre.x.toFixed(1) + ', ' + ancre.z.toFixed(1) + ') bouchon ('
            + apres.x.toFixed(1) + ', ' + apres.z.toFixed(1) + ') départ (' + depart.x.toFixed(1) + ', ' + depart.z.toFixed(1) + ')');
    // Une touche ratée repasse en « ligne posée » : le bouchon ne doit pas sauter au point du lancer.
    G().etat.floatState = 'inWater';
    stepFor(2);
    const plusTard = G().floatGroup.position;
    check('sans manivelle, le bouchon ne revient pas au point du ferrage',
        Math.hypot(plusTard.x - apres.x, plusTard.z - apres.z) < 0.5,
        'déplacement ' + Math.hypot(plusTard.x - apres.x, plusTard.z - apres.z).toFixed(2));
    resetToIdle();
}

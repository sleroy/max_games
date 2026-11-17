// ---------------------------------------------------------------------------
// Scénario 4 : l'amorçage (lancer une boule de nourriture pour attirer les
// poissons). Vise → charge la puissance (jauge qui oscille) → relâche.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, step, stepFor, stepUntil,
    resetToIdle, parkFish, clearLilyPads
} from './harness.mjs';

export function run() {
    group('32) Amorçage : viser, doser la puissance, lancer la boule');
    resetToIdle();
    clearLilyPads();
    checkEqual('amorçage inactif au départ', G().isFeedMode(), false);
    checkEqual('jauge de puissance cachée', el('feedGauge').classList.contains('active'), false);
    checkEqual('pas de nuage de miettes au départ', G().getChums().length, 0);

    // Bouton « Nourrir » : on arme le mode amorçage.
    fire('feedButton', 'click');
    checkEqual('le bouton arme le mode amorçage', G().isFeedMode(), true);
    checkEqual('le bouton est surligné', el('feedButton').classList.contains('active'), true);
    check('le texte explique la visée', el('status').textContent.includes('maintiens'),
        el('status').textContent);

    // Appui sur l'eau : la puissance commence à osciller.
    G().startFeedCharge({ x: 0, y: 0, z: -25 });
    checkEqual('chargement de la puissance', G().getFeedState(), 'charging');
    checkEqual('la jauge s’affiche', el('feedGauge').classList.contains('active'), true);
    const target = G().getFeedTargetPower();
    check('une puissance cible est calculée', target > 0 && target < 1, target.toFixed(2));
    check('le repère est positionné sur la jauge', el('feedGaugeTarget').style.left !== '',
        el('feedGaugeTarget').style.left);

    const p0 = G().getFeedPower();
    stepFor(0.15);
    const p1 = G().getFeedPower();
    stepFor(0.15);
    const p2 = G().getFeedPower();
    check('la puissance oscille', p0 !== p1 && p1 !== p2,
        [p0, p1, p2].map(v => v.toFixed(2)).join(' / '));
    check('la puissance reste entre 0 et 1', p2 >= 0 && p2 <= 1, p2.toFixed(2));

    // Relâchement : la boule part et décrit un arc.
    G().releaseFeed();
    checkEqual('la boule est en vol', G().getFeedState(), 'flying');
    checkEqual('la boule est visible', G().getFeedBall().visible, true);
    checkEqual('la jauge est refermée', el('feedGauge').classList.contains('active'), false);
    stepFor(0.3);
    check('la boule décrit un arc au-dessus de l’eau', G().getFeedBall().position.y > 0.3,
        G().getFeedBall().position.y.toFixed(2));

    check('la boule tombe dans l’eau', stepUntil(() => G().getFeedState() === 'idle', 3),
        G().getFeedState());
    checkEqual('la boule n’est plus visible', G().getFeedBall().visible, false);
    const landing = G().getFeedLanding();
    const chum = G().getChums()[0];
    check('un nuage de miettes apparaît à l’atterrissage', G().getChums().length === 1 && !!chum);
    checkClose('le nuage est au point de chute',
        Math.hypot(chum.x - landing.x, chum.z - landing.z), 0, 0.5);
    checkEqual('le mode amorçage se désarme après le lancer', G().isFeedMode(), false);

    group('33) Le nuage attire les poissons et dérive doucement');
    const C = G().getPondCenter();
    const chum0 = G().getChums()[0];
    // On place un poisson à 15 unités du nuage, du côté du centre (dans l'étang).
    let dx = C.x - chum0.x;
    let dz = C.z - chum0.z;
    const n = Math.hypot(dx, dz) || 1;
    dx /= n;
    dz /= n;
    parkFish();
    const fish = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    // Le poisson vit dans la couche du nuage (celui-ci coule vers la profondeur de la ligne) : un poisson
    // d'une autre couche l'ignore et nage normalement (voir scenario-amorce-couche.mjs).
    fish.userData.depth = G().getHookDepth();
    fish.position.set(chum0.x + dx * 15, fish.userData.depth - fish.userData.topOffset, chum0.z + dz * 15);
    fish.userData.vx = 0;
    fish.userData.vz = 0;
    const before = Math.hypot(fish.position.x - chum0.x, fish.position.z - chum0.z);
    // Un poisson de fond (tanche…) n'est dans la couche du nuage qu'une fois celui-ci descendu : on lui laisse 8 s.
    stepFor(8);
    const now = G().getChums()[0];
    const after = Math.hypot(fish.position.x - now.x, fish.position.z - now.z);
    check('le poisson se rapproche du nuage', after < before - 1,
        before.toFixed(1) + ' -> ' + after.toFixed(1) + ' unités');
    check('le poisson finit près des miettes', after < 8, after.toFixed(1) + ' unités');

    // Dérive : le nuage ne s'éloigne que très lentement de son point de chute.
    stepFor(4);
    const later = G().getChums()[0];
    const drift = Math.hypot(later.x - chum0.x, later.z - chum0.z);
    check('le nuage ne dérive que doucement', drift < 6, drift.toFixed(2) + ' unités');

    group('34) Le nuage de miettes finit par se dissiper');
    // §17.4 : la durée de vie du nuage est passée de 16 à 60 s (zone de fouille).
    check('le nuage disparaît après sa durée de vie',
        stepUntil(() => G().getChums().length === 0, 65), String(G().getChums().length));

    group('35) On peut amorcer MÊME avec la ligne à l’eau');
    resetToIdle();
    clearLilyPads();
    step(0.02);
    checkEqual('le réglage de profondeur est visible avant le lancer', el('depthPanel').hidden, false);
    checkEqual('le bouton rond est caché avant le lancer', el('quickFeedButton').hidden, true);
    parkFish();
    G().startCast({ x: 0, y: 0, z: -25 });
    checkEqual('le panneau se cache dès que le lancer part', el('depthPanel').hidden, true);
    checkEqual('le bouton attend que la ligne touche l’eau', el('quickFeedButton').hidden, true);
    check('la ligne arrive à l’eau', stepUntil(() => state() === 'inWater', 3), state());
    checkEqual('le bouton rond apparaît quand la ligne est à l’eau', el('quickFeedButton').hidden, false);
    checkEqual('le bouton rond affiche le stock restant', el('quickFeedCount').textContent, '2');
    fire('quickFeedButton', 'click');
    checkEqual('amorçage possible pendant la pêche', G().isFeedMode(), true);
    check('le jeu invite à viser', el('status').textContent.includes('Amorçage'),
        el('status').textContent);
    checkEqual('le bouton indique que l’amorce est prête', el('quickFeedButton').getAttribute('aria-pressed'), 'true');
    fire('quickFeedButton', 'click');
    checkEqual('une deuxième pression annule l’amorçage', G().isFeedMode(), false);
    resetToIdle();
    step(0.02);
    checkEqual('retour au repos', state(), 'idle');
    checkEqual('le widget revient après la remontée', el('depthPanel').hidden, false);
    checkEqual('le bouton rond est de nouveau masqué', el('quickFeedButton').hidden, true);
}

export default run;

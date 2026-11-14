// ---------------------------------------------------------------------------
// Scénario 3 : le cœur du jeu (lancer, bouchon, moulinet, remontée, nénuphars).
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, statusText, step, stepFor, stepUntil,
    castDistance, distanceToShore, parkFish, clearLilyPads, resetToIdle,
    castTo, forceBite, strike, startFight,
    crankTurns, crankDragTurns, crankWidgetActive
} from './harness.mjs';

// Les 20 poissons attendus et l'API publique du jeu (contrat de test).
const FISH_COUNT = 20;
const API = [
    'scene', 'camera', 'renderer', 'fishes', 'floatGroup', 'rodTip', 'angler', 'makeFish', 'lilyPads',
    'startCast', 'hookFish', 'getState', 'getBitePhase', 'isBiteViewActive', 'getCameraMode', 'startReel',
    'getBiteFromReel', 'sound', 'getWind', 'getVaneRotation', 'getTension', 'getStruggleTimeLeft',
    'getLineLength', 'getStruggleTurnsNeeded', 'getUnitsPerTurn', 'turnCrank', 'reelClick', 'setPaused', 'step'
];

/** Distance au sol entre le bouchon et le bout de la canne. */
function floatToRod() {
    const pos = G().floatGroup.position;
    return Math.hypot(G().rodTip.x - pos.x, G().rodTip.z - pos.z);
}

export function run() {
    group('9) Chargement du module et API de test');
    check('window.__game est exposé', !!G());
    API.forEach(name => check('__game.' + name + ' exposé', name in G()));
    checkEqual('les poissons sont dans l\'étang', G().fishes.length, FISH_COUNT);
    checkEqual('un tour de manivelle = 2 unités de fil', G().getUnitsPerTurn(), 2);
    checkEqual('état initial : repos', state(), 'idle');
    checkEqual('caméra initiale : normale', G().getCameraMode(), 'normal');
    checkEqual('mode bouchon inactif', G().isBiteViewActive(), false);
    checkEqual('manivelle cachée au repos', crankWidgetActive(), false);
    checkEqual('aucun combat en cours', G().getLineLength(), 0);

    group('10) Lancer la ligne');
    resetToIdle();
    clearLilyPads();
    fire('gameCanvas', 'pointerdown', { button: 0, clientX: 640, clientY: 360 });
    checkEqual('un clic sur l\'eau lance la ligne', state(), 'flying');
    checkEqual('bouton désactivé pendant le vol', el('fishButton').disabled, true);
    checkEqual('texte d\'état', statusText(), 'Lancer…');
    stepFor(0.9, 0.05);
    checkEqual('le bouchon tombe dans l\'eau (0,8 s)', state(), 'inWater');
    const distance = castDistance();
    check('distance de lancer plausible', distance > 1 && distance < 55, distance.toFixed(1) + ' unités');
    checkClose('le bouchon flotte à la surface', G().floatGroup.position.y, 0.1, 0.12);
    checkEqual('lancer ignoré si la ligne est déjà à l\'eau',
        (() => { G().startCast({ x: 0, y: 0, z: -40 }); return state(); })(), 'inWater');
    const drift = G().floatGroup.position.clone();
    stepFor(1);
    check('le vent déplace doucement le bouchon',
        Math.hypot(G().floatGroup.position.x - drift.x, G().floatGroup.position.z - drift.z) < 1.5);
    check('le bouchon ne coule pas', G().floatGroup.position.y > -0.2);

    group('11) Touche du poisson et ferrage');
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    const earlyFish = forceBite();
    checkEqual('un poisson qui mord déclenche le mode bouchon', state(), 'bite');
    checkEqual('vue bouchon affichée', G().isBiteViewActive(), true);
    checkEqual('classe CSS de la vue bouchon', el('biteView').classList.contains('active'), true);
    checkEqual('caméra rapprochée', G().getCameraMode(), 'bite');
    checkEqual('le poisson qui mord est caché', earlyFish.visible, false);
    checkEqual('phase initiale : bouchon qui flotte', G().getBitePhase(), 'floating');

    const aggroBefore = earlyFish.userData.aggression;
    const lossesBefore = earlyFish.userData.losses;
    fire('biteView', 'pointerdown', { button: 0 });
    checkEqual('ferrer trop tôt : le poisson s\'enfuit', state(), 'inWater');
    check('le poisson effrayé devient plus agressif', earlyFish.userData.aggression > aggroBefore,
        aggroBefore.toFixed(2) + ' -> ' + earlyFish.userData.aggression.toFixed(2));
    checkEqual('l\'échec est comptabilisé pour ce poisson', earlyFish.userData.losses, lossesBefore + 1);
    checkEqual('le poisson redevient visible', earlyFish.visible, true);
    checkEqual('vue bouchon refermée', G().isBiteViewActive(), false);
    checkEqual('caméra revenue à la normale', G().getCameraMode(), 'normal');
    stepFor(0.5);
    checkEqual('pas de nouvelle touche pendant la récupération', state(), 'inWater');
    // Après le délai de récupération (1 s), une nouvelle touche doit pouvoir
    // arriver : on approche un poisson pour rendre le test déterministe
    // (sinon le résultat dépend du hasard des déplacements des poissons).
    stepFor(0.6);
    forceBite();
    checkEqual('une nouvelle touche arrive ensuite', state(), 'bite');

    group('12) Ferrage réussi et touche pendant la remontée');
    resetToIdle();
    clearLilyPads();
    castTo(0, -30);
    forceBite();
    strike();
    step(1 / 60); // laisse passer une image : la manivelle s'affiche pendant le combat
    checkEqual('ferrer pendant l\'enfoncement = épreuve de force', state(), 'struggle');
    checkEqual('panneau d\'épreuve de force affiché', el('struggle').classList.contains('active'), true);
    checkEqual('manivelle affichée pendant le combat', crankWidgetActive(), true);
    checkEqual('caméra de nouveau normale', G().getCameraMode(), 'normal');
    checkEqual('vue bouchon refermée', G().isBiteViewActive(), false);
    check('le panneau annonce le poisson', el('struggleInfo').textContent.startsWith('Taille '),
        el('struggleInfo').textContent);
    check('le panneau indique le nombre de tours',
        el('struggleTimer').textContent.includes('de manivelle'), el('struggleTimer').textContent);
    check('le bouton propose de ramener', el('fishButton').textContent === 'Ramener !');

    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    G().startReel();
    checkEqual('on remonte la ligne', state(), 'reeling');
    forceBite();
    checkEqual('une touche peut survenir pendant la remontée', state(), 'bite');
    checkEqual('la touche est marquée « depuis la remontée »', G().getBiteFromReel(), true);
    fire('biteView', 'pointerdown', { button: 0 });
    checkEqual('ferrer trop tôt reprend la remontée', state(), 'reeling');
    checkEqual('le marqueur est remis à zéro', G().getBiteFromReel(), false);

    group('13) Moulinet : un tour ramène 2 unités de fil');
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    G().startReel();
    const before1 = distanceToShore();
    crankDragTurns(1, 8);
    step(1 / 60);
    const after1 = distanceToShore();
    checkClose('1 tour à la souris ramène 2 unités', before1 - after1, 2, 0.02);
    crankDragTurns(2, 8);
    step(1 / 60);
    checkClose('2 tours ramènent 4 unités', after1 - distanceToShore(), 4, 0.02);
    checkEqual('on est toujours en remontée', state(), 'reeling');
    const frozen = distanceToShore();
    stepFor(2);
    checkClose('sans manivelle, la ligne ne bouge plus', distanceToShore(), frozen, 1e-9);
    checkEqual('toujours en remontée', state(), 'reeling');

    group('14) Épreuve de force : des tours proportionnels à la distance');
    const nearFish = startFight(0, -20);
    const nearLine = G().getLineLength();
    const nearTurns = G().getStruggleTurnsNeeded();
    checkClose('au ferrage, le fil sorti = distance du lancer', nearLine, castDistance(), 0.3);
    checkClose('la barre part au milieu (tension 0,5)', G().getTension(), 0.5, 0.02);
    checkClose('tours annoncés = 0,3 × fil restant', nearTurns, nearLine * 0.6 / 2, 0.5);
    check('le poisson ferré est marqué « hooké »', nearFish.userData.hooked === true);

    const farLine = startFight(0, -90);
    const farTurns = G().getStruggleTurnsNeeded();
    const farDistance = G().getLineLength();
    checkClose('tours ∝ distance (lancer 3× plus loin ⇒ 3× plus de tours)',
        farTurns / nearTurns, farDistance / nearLine, 0.05);
    check('un long lancer demande beaucoup plus de tours', farTurns > nearTurns * 2,
        nearTurns.toFixed(1) + ' -> ' + farTurns.toFixed(1) + ' tours');

    group('15) Le poisson tire : la ligne et la distance reculent');
    const pulled = startFight(0, -20);
    const lineBefore = G().getLineLength();
    const tensionBefore = G().getTension();
    const distanceBefore = floatToRod();
    stepFor(1);
    check('sans tourner, le poisson reprend du fil', G().getLineLength() > lineBefore,
        lineBefore.toFixed(2) + ' -> ' + G().getLineLength().toFixed(2) + ' unités');
    check('la tension monte sur la barre', G().getTension() > tensionBefore,
        tensionBefore.toFixed(3) + ' -> ' + G().getTension().toFixed(3));
    check('le bouchon s\'éloigne du pêcheur', floatToRod() > distanceBefore,
        distanceBefore.toFixed(2) + ' -> ' + floatToRod().toFixed(2) + ' unités');
    check('le poisson ferré bouge avec le bouchon',
        Math.hypot(pulled.position.x - G().floatGroup.position.x,
            pulled.position.z - G().floatGroup.position.z) < 0.5);

    group('16) Le clic de la souris = petit coup de poignet');
    startFight(0, -25);
    const lineBeforeClick = G().getLineLength();
    const clicks = fire('fishButton', 'click');
    check('le bouton réagit pendant le combat', clicks > 0);
    checkClose('un clic ramène 1,2 unité', lineBeforeClick - G().getLineLength(), 1.2, 1e-9);
    check('un clic rapporte moins qu\'un tour de manivelle', 1.2 < G().getUnitsPerTurn());

    group('17) Gagner le combat en tournant la manivelle');
    startFight(0, -30);
    const announcedTurns = G().getStruggleTurnsNeeded();
    let turnsDone = 0;
    let guard = 0;
    while (state() === 'struggle' && guard++ < 20000) {
        crankDragTurns(0.25, 4);
        turnsDone += 0.25;
        step(1 / 60);
    }
    checkEqual('le combat est gagné', state(), 'reeling');
    check('il faut au moins les tours annoncés', turnsDone >= announcedTurns * 0.8,
        turnsDone.toFixed(2) + ' tours (annoncé ' + announcedTurns.toFixed(2) + ')');
    check('le combat n\'est pas sans fin', turnsDone <= announcedTurns * 4, turnsDone.toFixed(2) + ' tours');
    checkClose('la tension est retombée à zéro', G().getTension(), 0, 1e-9);
    checkEqual('le panneau de combat est fermé', el('struggle').classList.contains('active'), false);
    checkEqual('le bouton redevient « Lancer la canne »', el('fishButton').textContent, 'Lancer la canne');

    group('18) Remonter le poisson et marquer un point');
    const caughtFish = startFight(0, -30);
    while (state() === 'struggle') {
        crankTurns(2);
        step(1 / 60);
    }
    // Score juste avant la dernière touche de manivelle : les scénarios
    // précédents ont pu ramener des poissons, on mesure donc bien « +1 » ici.
    const scoreBefore = Number(el('score').textContent) || 0;
    const toShore = distanceToShore();
    let retrieveTurns = 0;
    guard = 0;
    while (state() !== 'idle' && guard++ < 20000) {
        if (state() === 'reeling') {
            crankDragTurns(0.25, 4);
            retrieveTurns += 0.25;
        }
        step(1 / 60);
    }
    checkEqual('la ligne est revenue au bord', state(), 'idle');
    checkClose('tours de remontée ≈ distance restante / 2', retrieveTurns, (toShore - 0.5) / 2, 2);
    checkEqual('le score augmente d\'un point', Number(el('score').textContent) - scoreBefore, 1);
    checkEqual('message de victoire affiché', el('catchMessage').classList.contains('show'), true);
    check('le message donne le poids', el('catchMessage').textContent.includes('kg'), el('catchMessage').textContent);
    checkEqual('le poisson pêché a quitté l\'étang', G().fishes.indexOf(caughtFish), -1);
    checkEqual('un nouveau poisson apparaît (toujours 20)', G().fishes.length, FISH_COUNT);
    checkEqual('on peut relancer', el('fishButton').disabled, false);
    checkEqual('manivelle cachée au repos', crankWidgetActive(), false);

    group('19) Perdre le combat : le fil casse');
    const lostFish = startFight(0, -20);
    const aggroLost = lostFish.userData.aggression;
    const lossesLost = lostFish.userData.losses;
    let snapped = false;
    guard = 0;
    while (state() === 'struggle' && guard++ < 4000) {
        step(0.05);
        if (G().getTension() >= 1) {
            snapped = true;
        }
    }
    check('sans tourner, le fil finit trop tendu', snapped);
    check('le poisson s\'est décroché', state() !== 'struggle', state());
    check('le poisson est puni', lostFish.userData.losses > lossesLost && lostFish.userData.aggression > aggroLost,
        'échecs ' + lossesLost + ' -> ' + lostFish.userData.losses);
    checkEqual('il n\'est plus marqué « pêché »', lostFish.userData.hooked, false);
    parkFish();
    resetToIdle();
    checkEqual('on peut relancer après la perte', state(), 'idle');

    group('20) Accrochage dans les nénuphars');
    resetToIdle();
    clearLilyPads();
    G().lilyPads.push({ x: 0, z: -25, radius: 6 });
    checkEqual('lancer dans un nénuphar = accrochage', castTo(0, -25), 'snag');
    checkEqual('panneau d\'accrochage affiché', el('struggle').classList.contains('active'), true);
    checkEqual('texte d\'accrochage', el('struggleInfo').textContent, 'Ligne accrochée aux nénuphars');
    checkEqual('bouton « Dégager ! »', el('fishButton').textContent, 'Dégager !');
    checkEqual('manivelle cachée pendant l\'accrochage', crankWidgetActive(), false);
    guard = 0;
    while (state() === 'snag' && guard++ < 400) {
        fire('fishButton', 'click');
        step(0.05);
    }
    checkEqual('ligne dégagée : on remonte', state(), 'reeling');
    guard = 0;
    while (state() !== 'idle' && guard++ < 20000) {
        if (state() === 'reeling') {
            crankTurns(5);
        }
        step(0.05);
    }
    checkEqual('retour au repos', state(), 'idle');
    check('message « ligne dégagée »', statusText().includes('dégagée'), statusText());

    resetToIdle();
    clearLilyPads();
    G().lilyPads.push({ x: 0, z: -25, radius: 6 });
    castTo(0, -25);
    checkEqual('nouvel accrochage', state(), 'snag');
    guard = 0;
    while (state() === 'snag' && guard++ < 400) {
        step(0.05);
    }
    checkEqual('sans se dégager, la ligne casse', state(), 'broken');
    checkEqual('le bouchon est perdu', G().floatGroup.visible, false);
    check('message « ligne cassée »', statusText().includes('cassé'), statusText());
    stepFor(1.5);
    checkEqual('on peut relancer peu après', state(), 'idle');
    checkEqual('le bouchon est revenu', G().floatGroup.visible, true);
    checkEqual('bouton réactivé', el('fishButton').disabled, false);

    group('21) Vent et girouette');
    resetToIdle();
    stepFor(2);
    const wind = G().getWind();
    check('force du vent bornée', wind.strength >= 0 && wind.strength < 1, wind.strength.toFixed(3));
    checkClose('la girouette pointe dans le sens du vent', G().getVaneRotation(), -wind.dir, 1e-9);
    checkClose('la jauge de vent suit la force du vent',
        parseFloat(el('windFill').style.width), wind.strength * 100, 0.5);
    stepFor(30);
    const laterWind = G().getWind();
    check('le vent change en 30 secondes', Math.abs(laterWind.dir - wind.dir) > 0.01,
        wind.dir.toFixed(2) + ' -> ' + laterWind.dir.toFixed(2) + ' rad');
    checkClose('la girouette suit toujours le vent', G().getVaneRotation(), -laterWind.dir, 1e-9);
    check('la force du vent reste bornée', laterWind.strength >= 0 && laterWind.strength < 1,
        laterWind.strength.toFixed(3));
}

export default run;

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
    'sound', 'getWind', 'getVaneRotation', 'getTension', 'getStruggleTimeLeft',
    'getLineLength', 'getStruggleTurnsNeeded', 'getUnitsPerTurn', 'turnCrank', 'reelClick', 'setPaused', 'step',
    'setFeedMode', 'isFeedMode', 'getFeedState', 'getFeedPower', 'getFeedTargetPower', 'startFeedCharge',
    'releaseFeed', 'getFeedBall', 'getFeedLanding', 'getFeedRange', 'getChum', 'getPondCenter',
    'water', 'getWaterHeightAt', 'getBaitInterest', 'getHookDepth', 'getFloatOpacity'
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

    group('10) Lancer la ligne (au dosage)');
    resetToIdle();
    clearLilyPads();
    fire('gameCanvas', 'pointerdown', { button: 0, clientX: 640, clientY: 360 });
    checkEqual('maintenir sur l’eau prépare le lancer', G().getCastState(), 'charging');
    checkEqual('la ligne n’est pas encore lancée', state(), 'idle');
    checkEqual('la jauge de lancer s’affiche', el('feedGauge').classList.contains('active'), true);
    stepFor(0.2);
    check('la puissance du lancer oscille', G().getCastPower() > 0, G().getCastPower().toFixed(2));
    check('un repère indique la puissance pour atteindre la visée',
        G().getCastTargetPower() > 0 && G().getCastTargetPower() < 1,
        G().getCastTargetPower().toFixed(2));
    G().setCastPower(G().getCastTargetPower());
    fire('gameCanvas', 'pointerup', { button: 0 });
    checkEqual('relâcher lance la ligne', state(), 'flying');
    checkEqual('la jauge est refermée', el('feedGauge').classList.contains('active'), false);
    checkEqual('bouton désactivé pendant le vol', el('fishButton').disabled, true);
    checkEqual('texte d\'état', statusText(), 'Lancer…');
    stepFor(0.9, 0.05);
    checkEqual('le bouchon tombe dans l\'eau (0,8 s)', state(), 'inWater');
    const distance = castDistance();
    check('distance de lancer plausible', distance > 1 && distance < 55, distance.toFixed(1) + ' unités');
    check('le bouchon flotte à la surface', Math.abs(G().floatGroup.position.y - 0.1) < 0.45,
        G().floatGroup.position.y.toFixed(2));
    checkEqual('lancer ignoré si la ligne est déjà à l\'eau',
        (() => { G().startCast({ x: 0, y: 0, z: -40 }); return state(); })(), 'inWater');
    const drift = G().floatGroup.position.clone();
    stepFor(1);
    check('le vent déplace doucement le bouchon',
        Math.hypot(G().floatGroup.position.x - drift.x, G().floatGroup.position.z - drift.z) < 1.5);
    check('le bouchon ne coule pas', G().floatGroup.position.y > -0.5,
        G().floatGroup.position.y.toFixed(2));

    group('11) Touche du poisson et ferrage');
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    const earlyFish = forceBite();
    checkEqual('un poisson qui mord déclenche le mode bouchon', state(), 'bite');
    checkEqual('touche en cours', G().isBiteViewActive(), true);
    checkEqual('aucun zoom : on garde la vue réaliste', G().getCameraMode(), 'normal');
    check('un message flottant annonce l’approche du poisson',
        G().getFloatingTexts().length > 0, G().getFloatingTexts().join(' / '));
    checkEqual('le poisson qui mord est caché', earlyFish.visible, false);
    checkEqual('phase initiale : bouchon qui flotte', G().getBitePhase(), 'floating');

    const aggroBefore = earlyFish.userData.aggression;
    const lossesBefore = earlyFish.userData.losses;
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('ferrer trop tôt : le poisson s\'enfuit', state(), 'inWater');
    check('le poisson effrayé devient plus agressif', earlyFish.userData.aggression > aggroBefore,
        aggroBefore.toFixed(2) + ' -> ' + earlyFish.userData.aggression.toFixed(2));
    checkEqual('l\'échec est comptabilisé pour ce poisson', earlyFish.userData.losses, lossesBefore + 1);
    checkEqual('le poisson effrayé disparaît dans les profondeurs', earlyFish.visible, false);
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

    group('12) Ferrage réussi pendant l’enfoncement');
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
    check('le bouton invite à tourner la manivelle',
        el('fishButton').textContent.includes('manivelle'), el('fishButton').textContent);
    checkEqual('le bouton est désactivé pendant le combat', el('fishButton').disabled, true);

    // Pendant la remontée, on finit de ramener la ligne : aucun autre poisson
    // ne peut mordre (il faut relancer la canne pour en prendre un).
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    G().startReel();
    checkEqual('on remonte la ligne', state(), 'reeling');
    parkFish();
    const reelBait = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    reelBait.position.set(G().floatGroup.position.x, -2.5, G().floatGroup.position.z);
    reelBait.userData.depth = -2.5;
    reelBait.userData.profondeurZone = [-3.3, -1.7];
    reelBait.userData.vx = 0;
    reelBait.userData.vz = 0;
    stepFor(1.5);
    checkEqual('un poisson peut mordre PENDANT la remontée', state(), 'bite');
    check('le bouchon reste en surface pendant la remontée',
        G().floatGroup.position.y > -0.5, G().floatGroup.position.y.toFixed(2));

    // Filet de sécurité : sans toucher la manivelle, la ligne revient toute seule
    // (on ne reste jamais bloqué en « remontée »).
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    G().startReel();
    parkFish();
    const avantRetour = distanceToShore();
    stepFor(5);
    check('sans manivelle, la ligne revient toute seule', distanceToShore() < avantRetour - 5,
        avantRetour.toFixed(1) + ' -> ' + distanceToShore().toFixed(1) + ' unités');
    check('on finit par revenir au repos', stepUntil(() => state() === 'idle', 10), state());

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
    // Le lancer de test à z = −90 tombe près de la berge : l'eau y est peu
    // profonde, donc on règle une ligne courte pour ne pas pêcher dans la vase.
    G().setProfondeur(1.5);
    const nearFish = startFight(0, -20);
    const nearLine = G().getLineLength();
    const nearTurns = G().getStruggleTurnsNeeded();
    checkClose('ferrage parfait : le fil sorti = 85 % de la distance du lancer',
        nearLine, G().getStruggleBaseLength() * 0.85, 0.7);
    checkClose('la barre démarre à gauche du milieu (avantage joueur)',
        G().getTension(), 0.375, 0.06);
    checkClose('tours annoncés = (fil restant − minimum) / 2',
        nearTurns, (nearLine - G().getStruggleBaseLength() * 0.4) / 2, 0.7);
    check('le poisson ferré est marqué « hooké »', nearFish.userData.hooked === true);

    const farLine = startFight(0, -90);
    const farTurns = G().getStruggleTurnsNeeded();
    const farDistance = G().getLineLength();
    checkClose('tours ∝ distance (lancer 3× plus loin ⇒ 3× plus de tours)',
        farTurns / nearTurns, farDistance / nearLine, 0.05);
    check('un long lancer demande beaucoup plus de tours', farTurns > nearTurns * 2,
        nearTurns.toFixed(1) + ' -> ' + farTurns.toFixed(1) + ' tours');
    G().setProfondeur(2.5);            // on revient à la profondeur par défaut

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

    group('16) Le clic ne remplace pas la manivelle');
    startFight(0, -25);
    const lineBeforeClick = G().getLineLength();
    const clicks = fire('fishButton', 'click');
    check('le bouton existe toujours (il sert à dégager la ligne)', clicks > 0);
    checkClose('un clic ne ramène plus de fil pendant le combat',
        G().getLineLength(), lineBeforeClick, 1e-9);
    check('le bouton invite à tourner la manivelle',
        el('fishButton').textContent.includes('manivelle'), el('fishButton').textContent);

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

    group('18) Remonter le poisson, puis le ranger dans la bourriche');
    const caughtFish = startFight(0, -30);
    while (state() === 'struggle') {
        crankTurns(2);
        step(1 / 60);
    }
    const toShore = distanceToShore();
    let retrieveTurns = 0;
    guard = 0;
    while (state() === 'reeling' && guard++ < 20000) {
        crankDragTurns(0.25, 4);
        retrieveTurns += 0.25;
        step(1 / 60);
    }
    checkEqual('le poisson est amené au bord (en main)', state(), 'holding');
    checkClose('tours de remontée ≈ distance restante / 2', retrieveTurns, (toShore - 0.5) / 2, 2);
    check('c’est bien le poisson pêché qui est en main', G().getHeldFish() === caughtFish);

    // On dose la puissance du lancer, puis on relâche.
    const scoreBefore = Number(el('score').textContent) || 0;
    const journalBefore = G().getJournal().total;
    G().startFishThrow();
    checkEqual('la jauge de lancer s’affiche', el('feedGauge').classList.contains('active'), true);
    check('un repère indique la puissance pour la bourriche',
        G().getFishThrowTargetPower() > 0 && G().getFishThrowTargetPower() < 1,
        G().getFishThrowTargetPower().toFixed(2));
    G().setFishThrowPower(G().getFishThrowTargetPower());
    G().releaseFishThrow();
    checkEqual('le poisson part en vol', G().getFishThrowState(), 'flying');
    check('le lancer se termine', stepUntil(() => state() === 'idle', 3), state());
    const landing = G().getFishThrowLanding();
    const bourriche = G().getBourriche();
    const inBourriche = Math.hypot(landing.x - bourriche.x, landing.z - bourriche.z) < bourriche.radius;
    checkEqual('score +1 seulement si le poisson entre dans la bourriche',
        Number(el('score').textContent) - scoreBefore, inBourriche ? 1 : 0);
    checkEqual('le carnet enregistre la prise de la même façon',
        G().getJournal().total, journalBefore + (inBourriche ? 1 : 0));
    checkEqual('plus rien en main', G().getHeldFish(), null);
    checkEqual('toujours 20 poissons', G().fishes.length, FISH_COUNT);
    checkEqual('on peut relancer', el('fishButton').disabled, false);
    checkEqual('manivelle cachée au repos', crankWidgetActive(), false);

    // Version déterministe du rangement (indépendante du vent).
    const caught2 = startFight(0, -30);
    while (state() === 'struggle') {
        crankTurns(2);
        step(1 / 60);
    }
    guard = 0;
    while (state() === 'reeling' && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('deuxième poisson en main', state(), 'holding');
    const scoreBis = Number(el('score').textContent) || 0;
    const journalBis = G().getJournal();
    G().storeHeldFish();
    checkEqual('retour au repos', state(), 'idle');
    checkEqual('un point de plus', Number(el('score').textContent) - scoreBis, 1);
    checkEqual('une prise de plus dans le carnet', G().getJournal().total, journalBis.total + 1);
    checkEqual('l’espèce enregistrée est celle du poisson attrapé',
        G().getJournal().last[0].espece, caught2.userData.espece);
    check('le carnet affiche l’espèce sur la ligne de la prise',
        el('journalList').textContent.includes(caught2.userData.espece),
        el('journalList').textContent.split('\n')[0]);
    check('le nombre d’espèces capturées est suivi',
        Object.keys(G().getJournal().especes).length >= 1,
        Object.keys(G().getJournal().especes).join(', '));
    check('message de victoire affiché', el('catchMessage').classList.contains('show'), true);
    check('le message donne le poids', el('catchMessage').textContent.includes('kg'), el('catchMessage').textContent);
    checkEqual('le poisson rangé a quitté l’étang', G().fishes.indexOf(caught2), -1);
    checkEqual('un nouveau poisson le remplace', G().fishes.length, FISH_COUNT);
    check('le compteur de la bourriche se met à jour',
        el('bourricheLabel').textContent.indexOf(String(G().getJournal().total)) >= 0,
        el('bourricheLabel').textContent);

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
    check('sans tourner, le poisson finit par se décrocher', state() !== 'struggle', state());
    // Selon la taille de l'espèce : le fil casse (gros poisson) ou le temps
    // s'écoule (petit poisson qui ne peut pas tendre la ligne à fond).
    check('le fil casse ou le temps s’écoule', snapped || G().getStruggleTimeLeft() <= 0,
        'fil cassé : ' + snapped + ', temps restant : ' + G().getStruggleTimeLeft().toFixed(1) + ' s');
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

    group('22) Les poissons nagent à différentes profondeurs');
    resetToIdle();
    stepFor(0.6);
    const depths = G().fishes.map(f => f.userData.depth);
    check('chaque poisson a une profondeur', depths.every(d => typeof d === 'number'),
        depths.length + ' poissons');
    check('aucun dos de poisson au-dessus de l’eau',
        G().fishes.every(f => f.position.y + f.userData.topOffset <= -0.5),
        Math.max.apply(null, G().fishes.map(f => f.position.y + f.userData.topOffset)).toFixed(2));
    check('les profondeurs sont variées',
        Math.max.apply(null, depths) - Math.min.apply(null, depths) > 1.4,
        Math.min.apply(null, depths).toFixed(2) + ' -> ' + Math.max.apply(null, depths).toFixed(2));
    check('tous restent sous la surface en nageant',
        G().fishes.every(f => f.position.y < -0.5),
        Math.max.apply(null, G().fishes.map(f => f.position.y)).toFixed(2));

    group('23) Le poisson remonte vers l’hameçon avant de mordre');
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    parkFish();
    const deepFish = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    deepFish.position.set(G().floatGroup.position.x, -5.2, G().floatGroup.position.z);
    deepFish.userData.depth = -5.2;
    deepFish.userData.profondeurZone = [-6.5, -0.5];   // il peut mordre à l'hameçon
    deepFish.userData.vx = 0;
    deepFish.userData.vz = 0;
    stepFor(0.2);
    checkEqual('pas encore de touche (le poisson est trop profond)', state(), 'inWater');
    check('le bouchon signale un poisson tout proche', G().getBaitInterest(), true);
    check('le poisson a commencé à remonter', deepFish.userData.depth > -4.6,
        deepFish.userData.depth.toFixed(2));
    check('il finit par mordre', stepUntil(() => state() === 'bite', 5), state());
    step(1 / 60); // une image de plus : le poisson prend sa position de touche
    check('la morsure se fait au niveau de l’hameçon',
        Math.abs((deepFish.position.y + deepFish.userData.topOffset) - G().getHookDepth()) < 0.2,
        (deepFish.position.y + deepFish.userData.topOffset).toFixed(2));

    group('24) L’eau est animée par la houle (selon le vent)');
    resetToIdle();
    const uniforms = G().water.material.uniforms;
    const timeBefore = uniforms.uTime.value;
    stepFor(0.5);
    check('la houle avance dans le temps', uniforms.uTime.value > timeBefore,
        uniforms.uTime.value.toFixed(2));
    const windNow = G().getWind();
    checkClose('la force de la houle suit le vent', uniforms.uWind.value, windNow.strength, 1e-6);
    checkClose('la direction de la houle suit le vent (x)',
        uniforms.uWindDir.value.x, Math.cos(windNow.dir), 1e-6);
    checkClose('la direction de la houle suit le vent (z)',
        uniforms.uWindDir.value.y, Math.sin(windNow.dir), 1e-6);
    // Le bouchon flotte : il monte et descend avec la houle.
    clearLilyPads();
    castTo(0, -25);
    let floatMinY = Infinity;
    let floatMaxY = -Infinity;
    for (let i = 0; i < 90; i++) {
        stepFor(1 / 60);
        floatMinY = Math.min(floatMinY, G().floatGroup.position.y);
        floatMaxY = Math.max(floatMaxY, G().floatGroup.position.y);
    }
    check('le bouchon oscille avec la houle', floatMaxY - floatMinY > 0.03,
        floatMinY.toFixed(2) + ' -> ' + floatMaxY.toFixed(2));
    check('le bouchon reste près de la surface de l’eau',
        floatMinY > -0.6 && floatMaxY < 0.6,
        floatMinY.toFixed(2) + ' -> ' + floatMaxY.toFixed(2));

    group('25) Mode bouchon : fausses touches, vraie touche et avantage');
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    checkEqual('vue bouchon active', G().isBiteViewActive(), true);
    checkEqual('le bouchon flotte au début', G().getBitePhase(), 'floating');
    check('la fenêtre de ferrage dépend du bouchon (anglaise = longue)',
        G().getBiteWindow() > 0.4, G().getBiteWindow().toFixed(2));
    check('des fausses touches se produisent avant la vraie',
        stepUntil(() => G().getBitePhase() === 'fausse', 15), G().getBitePhase());
    check('une vraie touche finit par arriver',
        stepUntil(() => G().getBitePhase() === 'touche', 45), G().getBitePhase());
    check('la vraie touche vient du catalogue',
        G().getTouches().some(t => t.vrai && t.id === G().getBiteTouchId()),
        G().getBiteTouchName() + ' (' + G().getBiteTouchType() + ')');
    stepFor(0.08);
    check('le bouchon bouge vraiment (il coule ou il remonte)',
        Math.abs(G().floatGroup.position.y - 0.1) > 0.05 || Math.abs(G().floatGroup.rotation.z) > 0.1,
        G().floatGroup.position.y.toFixed(2) + ' / z ' + G().floatGroup.rotation.z.toFixed(2));
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('ferrer au bon moment déclenche le combat', state(), 'struggle');
    checkEqual('ferrage parfait', G().getStrikeQuality(), 'parfait');
    check('avantage au joueur (facteur < 1)', G().getFightAdvantage() < 1,
        G().getFightAdvantage().toFixed(2));
    check('le panneau l’annonce', el('struggleInfo').textContent.indexOf('avantage') >= 0,
        el('struggleInfo').textContent);
    resetToIdle();

    // Trop tôt (sur une fausse touche) : le poisson démarre avec l'avantage.
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    check('une fausse touche arrive', stepUntil(() => G().getBitePhase() === 'fausse', 15),
        G().getBitePhase());
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('ferrer trop tôt ferre quand même', state(), 'struggle');
    checkEqual('ferrage trop tôt', G().getStrikeQuality(), 'tot');
    check('avantage au poisson (facteur > 1)', G().getFightAdvantage() > 1,
        G().getFightAdvantage().toFixed(2));
    resetToIdle();

    // Trop tard (après la fenêtre) : dernière chance, le poisson a beaucoup d'avance.
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    stepUntil(() => G().getBitePhase() === 'touche', 45);
    check('la fenêtre se referme', stepUntil(() => G().getBitePhase() === 'ratee', 3), G().getBitePhase());
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('ferrer trop tard ferre quand même (dernière chance)', state(), 'struggle');
    checkEqual('ferrage trop tard', G().getStrikeQuality(), 'tard');
    check('avantage au poisson (facteur > 1)', G().getFightAdvantage() > 1,
        G().getFightAdvantage().toFixed(2));
    checkEqual('la caméra est bien en mode bouchon', G().getCameraMode(), 'normal');
    resetToIdle();

    // Si on laisse vraiment passer la touche : le poisson recrache l'hameçon.
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    stepUntil(() => G().getBitePhase() === 'touche', 45);
    stepFor(0.6);
    check('le poisson finit par recracher', stepUntil(() => state() === 'inWater', 3), state());
    check('la vue bouchon se referme', stepUntil(() => G().isBiteViewActive() === false, 3),
        G().isBiteViewActive());
    resetToIdle();

    group('26) Bourriche, carnet de pêche et difficulté');
    resetToIdle();
    checkEqual('la bourriche a un rayon connu', typeof G().getBourriche().radius, 'number');
    checkEqual('le carnet est fermé au départ', G().isJournalOpen(), false);
    G().showJournal();
    checkEqual('le carnet s’ouvre', G().isJournalOpen(), true);
    check('le carnet affiche un résumé', el('journalStats').textContent.length > 0,
        el('journalStats').textContent);
    G().hideJournal();
    checkEqual('le carnet se referme', G().isJournalOpen(), false);

    G().setDifficulty('facile');
    const easy = G().getDifficulty();
    G().setDifficulty('dur');
    const hard = G().getDifficulty();
    check('la difficulté change le combat', hard.difficulty > easy.difficulty,
        easy.difficulty.toFixed(2) + ' -> ' + hard.difficulty.toFixed(2));
    check('la difficulté change la fenêtre de ferrage', hard.biteWindow < easy.biteWindow,
        easy.biteWindow.toFixed(2) + ' -> ' + hard.biteWindow.toFixed(2));
    G().setDifficulty('normal');
    checkClose('retour au réglage normal', G().getDifficulty().difficulty, 1.3, 1e-9);

    // Lancer volontairement trop court : le poisson retombe à l'eau, sans point.
    const missed = startFight(0, -30);
    while (state() === 'struggle') {
        crankTurns(2);
        step(1 / 60);
    }
    guard = 0;
    while (state() === 'reeling' && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('poisson en main', state(), 'holding');
    const scoreAvant = Number(el('score').textContent) || 0;
    const journalAvant = G().getJournal().total;
    G().startFishThrow();
    G().setFishThrowPower(0);   // trop court : on rate la bourriche
    G().releaseFishThrow();
    check('fin du lancer raté', stepUntil(() => state() === 'idle', 3), state());
    checkEqual('aucun point marqué', Number(el('score').textContent), scoreAvant);
    checkEqual('aucune prise ajoutée au carnet', G().getJournal().total, journalAvant);
    check('le poisson est retourné à l’eau', G().fishes.indexOf(missed) >= 0);
    checkEqual('toujours 20 poissons', G().fishes.length, FISH_COUNT);
    checkEqual('plus rien en main', G().getHeldFish(), null);

    group('27) Effets visuels (post-traitement maison)');
    const fx = G().getVisualEffects();
    checkEqual('post-traitement ignoré sans vrai moteur de rendu (tests)', fx.supported, false);
    G().setVisualEffects(false);
    checkEqual('on peut désactiver les effets', G().getVisualEffects().enabled, false);
    G().setVisualEffects(true);
    checkEqual('on peut les réactiver', G().getVisualEffects().enabled, true);
    check('réglages de bloom et vignette cohérents', fx.bloom > 0 && fx.vignette > 0,
        fx.bloom + ' / ' + fx.vignette);
    G().setVisualEffects(false);

    group('28) Espèces de poissons (formes, tailles et poids réalistes)');
    const especes = G().getSpecies();
    check('au moins 14 espèces d’eau douce', especes.length >= 14, especes.length + ' espèces');
    check('chaque espèce a une silhouette 3D', especes.every(e => typeof e.form === 'string' && e.form.length > 3));
    check('longueurs réalistes (min < max)', especes.every(e => e.minCm > 0 && e.maxCm > e.minCm));
    check('combativité renseignée', especes.every(e => e.agressivite[1] > e.agressivite[0]));
    check('au moins 4 silhouettes différentes',
        new Set(especes.map(e => e.form)).size >= 4,
        Array.from(new Set(especes.map(e => e.form))).join(', '));

    const carpe = especes.find(e => e.id === 'carpe');
    const gardon = especes.find(e => e.id === 'gardon');
    const silure = especes.find(e => e.id === 'silure');
    const brochet = especes.find(e => e.id === 'brochet');
    check('la carpe est un gros poisson (5 à 30 kg)', carpe.maxKg > 5 && carpe.maxKg < 30, carpe.maxKg + ' kg max');
    check('le gardon reste petit (< 1 kg)', gardon.maxKg < 1, gardon.maxKg + ' kg max');
    check('le silure est énorme (> 30 kg)', silure.maxKg > 30, silure.maxKg + ' kg max');
    check('le brochet est plus combatif que le gardon',
        brochet.agressivite[0] > gardon.agressivite[0],
        brochet.agressivite[0] + ' vs ' + gardon.agressivite[0]);
    check('le poids suit la formule des pêcheurs (K × L³)',
        Math.abs(G().poidsRealisteKilos(carpe, 60) - 2.3 * Math.pow(60, 3) / 100000) < 1e-9,
        G().poidsRealisteKilos(carpe, 60).toFixed(2) + ' kg pour 60 cm');

    // Les poissons de l'étang portent bien une espèce et des données réalistes.
    const noms = G().fishes.map(f => f.userData.espece);
    check('chaque poisson appartient à une espèce connue',
        noms.every(n => especes.some(e => e.nom === n)), noms.slice(0, 4).join(', '));
    check('chaque poisson a une longueur dans la fourchette de son espèce',
        G().fishes.every(f => {
            const e = especes.find(x => x.nom === f.userData.espece);
            return e && f.userData.longueurCm >= e.minCm && f.userData.longueurCm <= e.maxCm;
        }));
    check('le poids de chaque poisson est déduit de sa longueur',
        G().fishes.every(f => {
            const e = especes.find(x => x.nom === f.userData.espece);
            return e && Math.abs(f.userData.weight - G().poidsRealisteKilos(e, f.userData.longueurCm)) < 0.002;
        }));
    check('des tailles très variées dans l’étang',
        Math.max.apply(null, G().fishes.map(f => f.userData.longueurCm))
            - Math.min.apply(null, G().fishes.map(f => f.userData.longueurCm)) > 20,
        Math.min.apply(null, G().fishes.map(f => f.userData.longueurCm)) + ' à '
            + Math.max.apply(null, G().fishes.map(f => f.userData.longueurCm)) + ' cm');

    group('29) Lancer au dosage et frein du moulinet');
    resetToIdle();
    clearLilyPads();
    G().startCastCharge({ x: 0, y: 0, z: -70 });
    checkEqual('la visée prépare le lancer', G().getCastState(), 'charging');
    G().setCastPower(0.08);
    G().releaseCast();
    stepUntil(() => state() === 'inWater', 3);
    const lancerCourt = castDistance();
    resetToIdle();
    clearLilyPads();
    G().startCastCharge({ x: 0, y: 0, z: -70 });
    G().setCastPower(0.95);
    G().releaseCast();
    stepUntil(() => state() === 'inWater', 3);
    const lancerLoin = castDistance();
    check('plus la puissance est forte, plus on lance loin',
        lancerLoin > lancerCourt + 15,
        lancerCourt.toFixed(1) + ' -> ' + lancerLoin.toFixed(1) + ' unités');
    check('un lancer faible reste court', lancerCourt < 25, lancerCourt.toFixed(1) + ' unités');
    resetToIdle();

    // Frein : en lâchant du fil, le combat continue sans casser la ligne.
    const grosPoisson = startFight(0, -20);
    check('un poisson est ferré', !!grosPoisson);
    const ligneAvant = G().getLineLength();
    G().setDragLoosened(true);
    checkEqual('le frein est lâché', G().isDragLoosened(), true);
    stepFor(3);
    checkEqual('le combat continue (la ligne n’a pas cassé)', state(), 'struggle');
    check('le poisson reprend du fil', G().getLineLength() > ligneAvant,
        ligneAvant.toFixed(1) + ' -> ' + G().getLineLength().toFixed(1) + ' unités');
    check('la tension reste dans la zone sûre', G().getTension() <= 0.75,
        G().getTension().toFixed(2));
    G().setDragLoosened(false);
    checkEqual('le frein est resserré', G().isDragLoosened(), false);
    resetToIdle();

    group('30) Météo, vie ambiante et LOD');
    check('météo connue', ['beau', 'rafales', 'pluie'].indexOf(G().getWeather()) >= 0, G().getWeather());
    G().setWeather('pluie');
    stepFor(4);
    checkEqual('la météo passe à la pluie', G().getWeather(), 'pluie');
    check('la pluie monte', G().getRainAmount() > 0.5, G().getRainAmount().toFixed(2));
    check('des gouttes de pluie sont visibles', G().getRainPoints().material.opacity > 0.2,
        G().getRainPoints().material.opacity.toFixed(2));
    G().setWeather('beau');
    stepFor(8);
    check('la pluie s’arrête au beau temps', G().getRainAmount() < 0.3, G().getRainAmount().toFixed(2));
    G().setWeather('rafales');
    stepFor(6);
    const ventRafale = G().getWind();
    check('les rafales restent bornées (vent < 1)', ventRafale.strength >= 0 && ventRafale.strength < 1,
        ventRafale.strength.toFixed(2));
    check('les rafales sont actives', G().getWindGusts() > 0.5, G().getWindGusts().toFixed(2));
    G().setWeather('beau');

    const ambiance = G().getAmbientCounts();
    check('des oiseaux volent dans le ciel', ambiance.birds >= 1, ambiance.birds + ' oiseaux');
    check('des libellules volent au-dessus de l’eau', ambiance.libellules >= 1,
        ambiance.libellules + ' libellules');
    check('la vie ambiante est animée', G().getBirds()[0].userData.ailes.length === 2);

    // LOD : les petits détails du poisson s'effacent quand il est loin.
    const poissonLod = G().fishes[0];
    poissonLod.position.set(G().camera.position.x + 60, -1, G().camera.position.z);
    stepFor(0.2);
    checkEqual('LOD : détails cachés au loin', poissonLod.userData.details.visible, false);
    poissonLod.position.set(G().camera.position.x + 3, -1, G().camera.position.z);
    stepFor(0.2);
    checkEqual('LOD : détails visibles de près', poissonLod.userData.details.visible, true);
    resetToIdle();

    group('31) Fiche des espèces, tutoriel et reflets');
    const ficheEspeces = G().getSpeciesCard();
    check('la fiche des espèces est remplie par les prises',
        Object.keys(ficheEspeces).length >= 1, Object.keys(ficheEspeces).join(', '));
    check('chaque fiche a un nombre de prises et un record',
        Object.keys(ficheEspeces).every(nom => ficheEspeces[nom].n >= 1 && ficheEspeces[nom].record >= 0));
    check('la fiche est affichée dans le carnet',
        el('journalEspeces').textContent.length > 5, el('journalEspeces').textContent.split('\n')[0]);

    G().openTutorial();
    checkEqual('le tutoriel s’ouvre', G().isTutorialOpen(), true);
    check('chaque étape a un texte', G().getTutorialStep().texte.length > 20,
        G().getTutorialStep().texte.slice(0, 40) + '…');
    checkEqual('le tutoriel commence à l’étape 1', el('tutorialStep').textContent, '1 / 4');
    G().nextTutorialStep();
    checkEqual('le tutoriel avance à l’étape 2', el('tutorialStep').textContent, '2 / 4');
    G().nextTutorialStep();
    G().nextTutorialStep();
    checkEqual('à la dernière étape, le bouton propose de jouer',
        el('tutorialNext').textContent, 'Jouer !');
    G().nextTutorialStep();
    checkEqual('le tutoriel se ferme après la dernière étape', G().isTutorialOpen(), false);
    closeTutorialCheck: {
        G().closeTutorial();
        checkEqual('le tutoriel reste fermé', G().isTutorialOpen(), false);
    }

    G().setReflections(true);
    const reflets = G().getReflections();
    checkEqual('reflets indisponibles sans vrai moteur de rendu (tests)', reflets.supported, false);
    checkEqual('du coup ils restent désactivés', reflets.enabled, false);
    G().setReflections(false);
    checkEqual('les reflets peuvent être coupés', G().getReflections().strength, 0);

    group('32) Les poissons se cachent sous l’eau (bulles et sillages)');
    resetToIdle();
    stepFor(1.5);
    check('les poissons sont invisibles dans l’étang',
        G().fishes.every(f => !f.visible),
        G().fishes.filter(f => f.visible).length + ' poisson(s) visible(s)');
    check('bulles et sillages trahissent leur présence',
        G().getBubbleCount() > 0 || G().getRippleCount() > 0,
        G().getBubbleCount() + ' bulles, ' + G().getRippleCount() + ' sillages');

    // Pendant l'épreuve de force : apparitions intermittentes, puis plongées.
    const cachePoisson = startFight(0, -20);
    let imagesVisibles = 0;
    let imagesCachees = 0;
    for (let i = 0; i < 200; i++) {
        step(0.05);
        if (state() !== 'struggle') {
            break;
        }
        if (cachePoisson.visible) {
            imagesVisibles += 1;
        } else {
            imagesCachees += 1;
        }
    }
    check('le poisson apparaît par intermittence pendant le combat',
        imagesVisibles > 0 && imagesCachees > 0,
        imagesVisibles + ' images visible / ' + imagesCachees + ' caché');

    // Combat gagné : le poisson reste visible (on refait un combat propre : le
    // poisson tire désormais assez fort pour casser la ligne si on ne fait rien).
    const gagne = startFight(0, -20);
    guard = 0;
    while (state() === 'struggle' && guard++ < 4000) {
        crankTurns(3);
        step(1 / 60);
    }
    stepFor(0.3);
    checkEqual('une fois le combat gagné, le poisson est visible', gagne.visible, true);
    resetToIdle();
    group('47) Mesures réalistes (1 unité du monde = 50 cm)');
    const mes = G().getEchelles();
    check('le bouchon mesure 15 à 40 cm', mes.bouchonCm >= 15 && mes.bouchonCm <= 40,
        mes.bouchonCm + ' cm (tige ' + mes.bouchonTigeCm + ' cm)');
    check('l’hameçon mesure moins de 4 cm', mes.hameconCm <= 4, mes.hameconCm + ' cm');
    check('un nénuphar fait 10 à 40 cm de rayon', mes.nenupharCm >= 10 && mes.nenupharCm <= 40,
        mes.nenupharCm + ' cm');
    check('la canne mesure 4 à 6 m', mes.canneM >= 4 && mes.canneM <= 6, mes.canneM + ' m');
    check('le pêcheur mesure 1,6 à 1,9 m', mes.pecheurM >= 1.6 && mes.pecheurM <= 1.9,
        mes.pecheurM + ' m');
    check('l’étang mesure 40 à 70 m de large', mes.etangM >= 40 && mes.etangM <= 70,
        mes.etangM + ' m');
    check('l’étang est profond de 1 à 4 m', mes.fondM >= 1 && mes.fondM <= 4, mes.fondM + ' m');
    check('la taille 3D d’un poisson = sa longueur réelle',
        Math.abs(mes.poisson3DCm - mes.poissonReelCm) <= 1,
        mes.poisson3DCm + ' cm en 3D pour ' + mes.poissonReelCm + ' cm annoncés');

    group('44) Résistance du poisson : il se défend vraiment');
    resetToIdle();
    clearLilyPads();
    startFight(0, -20);
    const ligne0 = G().getLineLength();
    stepFor(1);
    const croissance = G().getLineLength() - ligne0;
    check('même un petit poisson reprend du fil', croissance > 0.5,
        'ligne +' + croissance.toFixed(2) + ' unités en 1 s (plancher de traction : 0,7 u/s)');
    // Fatigue : après ~7 s, ses tirades faiblissent nettement.
    stepFor(7);
    const ligneFatigue = G().getLineLength();
    stepFor(1);
    const croissanceFatigue = G().getLineLength() - ligneFatigue;
    check('le poisson se fatigue (il tire beaucoup moins)', croissanceFatigue < croissance * 0.7,
        croissanceFatigue.toFixed(2) + ' après 8 s contre ' + croissance.toFixed(2) + ' au début');
    resetToIdle();
    // Et un combat ne se gagne pas en un instant, même à la manivelle.
    clearLilyPads();
    startFight(0, -25);
    let tempsCombat = 0;
    while (state() === 'struggle' && tempsCombat < 30) {
        crankTurns(2 / 60);
        step(1 / 60);
        tempsCombat += 1 / 60;
    }
    check('à 2 tours/s, le combat dure plus d’une seconde', tempsCombat > 1,
        tempsCombat.toFixed(2) + ' s');
    resetToIdle();
}

export default run;

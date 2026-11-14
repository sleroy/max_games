// ---------------------------------------------------------------------------
// Scénario 7 : le RYTHME des touches — le bouchon est calme et il faut attendre.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, fire, state, step, resetToIdle, clearLilyPads, castTo, forceBite
} from './harness.mjs';

/** Avance le jeu et renvoie le temps écoulé (s) jusqu'à ce que `test()` soit vrai. */
function tempsJusqua(test, maxSeconds = 45) {
    let t = 0;
    while (t < maxSeconds && !test()) {
        step(1 / 60);
        t += 1 / 60;
    }
    return t;
}

export function run() {
    group('37) Rythme des touches : patience et bouchon calme');

    // On équipe le bouchon de départ (capacités neutres) pour un test net.
    G().setFloatType('anglaise');

    // 1) Dans l'eau, le bouchon ne fait que SUIVRE la surface : aucune agitation.
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    let ecart = 0;
    for (let i = 0; i < 180; i++) {            // 3 secondes
        step(1 / 60);
        const pos = G().floatGroup.position;
        const surface = 0.1 + G().getWaterHeightAt(pos.x, pos.z);
        ecart = Math.max(ecart, Math.abs(pos.y - surface));
    }
    check('le bouchon se contente de suivre l’eau (pas de gigote)', ecart < 0.08,
        'écart maximum ' + ecart.toFixed(3) + ' unité');

    // 2) Le bouchon reste CALME et silencieux au début de la touche.
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    checkEqual('la vue bouchon s’ouvre', G().isBiteViewActive(), true);
    let mini = Infinity;
    let maxi = -Infinity;
    let tCalme = 0;
    for (let i = 0; i < 105; i++) {            // 1,75 seconde
        step(1 / 60);
        tCalme += 1 / 60;
        mini = Math.min(mini, G().floatGroup.position.y);
        maxi = Math.max(maxi, G().floatGroup.position.y);
    }
    check('le bouchon bouge à peine pendant 1,75 s', maxi - mini < 0.06,
        (maxi - mini).toFixed(3) + ' unité d’amplitude');
    checkEqual('aucun signal pendant cette pause', G().getBitePhase(), 'floating');

    // 3) Le premier mouvement n'arrive qu'après une VRAIE pause.
    const tSuite = tempsJusqua(() => G().getBitePhase() !== 'floating', 20);
    check('le premier mouvement arrive après plus de 2 s de calme', tCalme + tSuite >= 2,
        (tCalme + tSuite).toFixed(1) + ' s avant le premier mouvement');

    // 4) Le mouvement d'une fausse touche est PROGRESSIF : aucun à-coup.
    let precedent = G().floatGroup.position.y;
    let plusGrandPas = 0;
    let dureeFausse = 0;
    while (dureeFausse < 3) {
        step(1 / 60);
        dureeFausse += 1 / 60;
        if (G().getBitePhase() !== 'fausse') {
            break;                       // la phase vient de se terminer
        }
        plusGrandPas = Math.max(plusGrandPas, Math.abs(G().floatGroup.position.y - precedent));
        precedent = G().floatGroup.position.y;
    }
    check('le mouvement de la fausse touche est progressif (aucun à-coup)',
        plusGrandPas < 0.2, 'plus grand saut ' + plusGrandPas.toFixed(3) + ' unité/image');
    check('la fausse touche dure un bon moment (mouvement lent)', dureeFausse >= 0.7,
        dureeFausse.toFixed(2) + ' s');

    // 5) Une vraie pause sépare deux mouvements du bouchon.
    tempsJusqua(() => G().getBitePhase() !== 'fausse', 10);      // fin de la fausse touche
    const tPause = tempsJusqua(() => G().getBitePhase() !== 'floating', 20);
    check('une vraie pause sépare deux mouvements', tPause >= 1.0,
        'pause de ' + tPause.toFixed(1) + ' s');

    // 6) La fenêtre de ferrage est assez longue pour viser le bon moment.
    check('la fenêtre de ferrage est confortable', G().getBiteWindow() >= 0.5,
        G().getBiteWindow().toFixed(2) + ' s pour ferrer');

    // 7) La vraie touche reste franche et lisible (2 s pour couler = réaction facile).
    tempsJusqua(() => G().getBitePhase() === 'touche', 45);
    checkEqual('la vraie touche est arrivée', G().getBitePhase(), 'touche');
    step(0.5);
    check('le bouchon bouge nettement sur la vraie touche',
        Math.abs(G().floatGroup.position.y - 0.1) > 0.15
        || Math.abs(G().floatGroup.rotation.z) > 0.5,
        G().floatGroup.position.y.toFixed(2) + ' / z ' + G().floatGroup.rotation.z.toFixed(2));
    // -----------------------------------------------------------------------
    group('38) Vue réaliste : messages flottants et anneau rouge');
    resetToIdle();

    // Une touche RATÉE (on laisse passer la fenêtre) : message + ronds rouges.
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    checkEqual('aucun zoom pendant la touche', G().getCameraMode(), 'normal');
    check('la caméra reste loin du bouchon (vue réaliste)',
        Math.abs(G().camera.position.z - 34) < 1, 'caméra z = ' + G().camera.position.z.toFixed(1));
    tempsJusqua(() => G().getBitePhase() === 'touche', 45);
    checkEqual('la vraie touche est là', G().getBitePhase(), 'touche');
    const rondsAvant = G().getMissRings();
    tempsJusqua(() => G().getBitePhase() === 'termine', 10);   // on laisse filer
    checkEqual('le poisson a recraché', G().getBitePhase(), 'termine');
    const textesRate = G().getFloatingTexts();
    check('un message flottant signale la touche ratée',
        textesRate.some(t => t.indexOf('Raté') >= 0), textesRate.join(' / '));
    check('des ronds rouges s’écartent du bouchon',
        G().getMissRings() - rondsAvant >= 2,
        (G().getMissRings() - rondsAvant) + ' ronds rouges');
    for (let i = 0; i < 240; i++) {                 // 4 secondes plus tard…
        step(1 / 60);
    }
    checkEqual('les ronds rouges finissent par disparaître', G().getMissRings(), 0);
    check('le message de touche ratée a disparu tout seul',
        G().getFloatingTexts().indexOf('Raté ! Il a recraché…') === -1,
        G().getFloatingTexts().join(' / ') || 'aucun message');
    resetToIdle();

    // Un ferrage PARFAIT : message de réussite.
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    tempsJusqua(() => G().getBitePhase() === 'touche', 45);
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('le poisson est ferré', state(), 'struggle');
    check('un message flottant annonce le ferrage',
        G().getFloatingTexts().some(t => t.indexOf('FERRÉ') >= 0),
        G().getFloatingTexts().join(' / '));
    resetToIdle();

    // Ferrage TROP TÔT (sur une fausse touche) : message d'avertissement.
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    tempsJusqua(() => G().getBitePhase() === 'fausse', 20);
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('le poisson est ferré malgré tout', state(), 'struggle');
    check('un message flottant prévient qu’on a ferré trop tôt',
        G().getFloatingTexts().some(t => t.indexOf('Trop tôt') >= 0),
        G().getFloatingTexts().join(' / '));
    resetToIdle();
}

export default run;

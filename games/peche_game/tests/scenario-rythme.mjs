// ---------------------------------------------------------------------------
// Scénario 7 : le RYTHME des touches — le bouchon est calme et il faut attendre.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, step, resetToIdle, clearLilyPads, castTo, forceBite
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

    // 4) Le mouvement d'une fausse touche est LENT et progressif (aucun à-coup).
    const yDepart = G().floatGroup.position.y;
    step(0.1);
    const deplacement = Math.abs(G().floatGroup.position.y - yDepart);
    check('la fausse touche bouge lentement', deplacement < 0.15,
        deplacement.toFixed(3) + ' unité en 0,1 s');

    // 5) Une vraie pause sépare deux mouvements du bouchon.
    tempsJusqua(() => G().getBitePhase() !== 'fausse', 10);      // fin de la fausse touche
    const tPause = tempsJusqua(() => G().getBitePhase() !== 'floating', 20);
    check('une vraie pause sépare deux mouvements', tPause >= 1.2,
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
    resetToIdle();
}

export default run;

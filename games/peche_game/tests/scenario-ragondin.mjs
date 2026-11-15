// ---------------------------------------------------------------------------
// Scénario 14 : le RAGONDIN VOLEUR (aléa rare, 3 clics, jamais confondu avec
// le ferrage).
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, G, el, resetToIdle, stepFor, fire,
    state, step, castTo, startFight, clearLilyPads
} from './harness.mjs';

export function run() {
    group('50) Le ragondin voleur');
    resetToIdle();
    if (G().isRagondinActive()) {
        G().effrayerRagondin();
    }
    // 1) Il apparaît quand on le force (et seulement s'il y a des poissons).
    const modele = G().spawnRagondin();
    check('le ragondin apparaît', !!modele && G().isRagondinActive());
    const pos = G().getRagondin();
    check('il rôde près de la bourriche, hors de l’eau',
        Math.abs(pos.x - G().getBourriche().x) < 8 && Math.abs(pos.z - G().getBourriche().z) < 8,
        pos.x.toFixed(1) + ' / ' + pos.z.toFixed(1));
    check('le jeu prévient le joueur', el('status').textContent.indexOf('RAGONDIN') >= 0,
        el('status').textContent);

    // 2) Il faut TROIS clics, et un clic sur lui ne ferre pas un poisson.
    const etatAvant = G().getState();
    G().hitRagondin();
    checkEqual('un clic sur le ragondin ne change pas l’état de la pêche',
        G().getState(), etatAvant);
    checkEqual('il faut 3 clics : il est encore là', G().isRagondinActive(), true);
    check('le compteur de clics avance', G().getRagondin().hits >= 1, G().getRagondin().hits);
    G().hitRagondin();
    check('après 2 clics il est encore là', G().isRagondinActive(), true);
    G().hitRagondin();
    checkEqual('après 3 clics il est chassé', G().isRagondinActive(), false);
    check('le joueur est rassuré', el('status').textContent.indexOf('fui') >= 0,
        el('status').textContent);

    // 3) S'il n'est pas chassé, il vole un poisson et repart.
    G().setScore(2);
    G().setBourricheCount(2);
    G().spawnRagondin();
    check('une alerte visuelle signale le ragondin',
        G().getFloatingTexts().some(function (t) { return t.indexOf('RAGONDIN') >= 0; }),
        G().getFloatingTexts().join(' / '));
    checkEqual('la bannière HUD du ragondin est active',
        el('ragondinAlert').classList.contains('active'), true);
    G().setRagondinVolDans(0.3);
    G().volerUnPoissonRagondin();
    checkEqual('il a volé un poisson (score -1)', G().getScore(), 1);
    checkEqual('la bourriche perd aussi un poisson', G().getBourricheCount(), 1);
    check('le compteur de bourriche est mis à jour',
        el('bourricheLabel').textContent === '🧺 Bourriche : 1', el('bourricheLabel').textContent);
    checkEqual('il repart après le vol', G().isRagondinActive(), false);
    checkEqual('la bannière disparaît après le vol',
        el('ragondinAlert').classList.contains('active'), false);
    check('le jeu explique le vol', el('status').textContent.indexOf('volé') >= 0,
        el('status').textContent);

    // 4) Il est rare mais visible : prochaine visite dans 45–75 s.
    check('l’apparition reste rare (> 30 s)', G().getRagondinTimer() > 30,
        G().getRagondinTimer().toFixed(1) + ' s avant la prochaine visite');
    // Le compteur peut être forcé (utile pour tester l'apparition).
    G().setRagondinTimer(0.01);
    check('le compteur d’apparition peut être forcé', G().getRagondinTimer() <= 0.01,
        G().getRagondinTimer() + ' s');
    G().effrayerRagondin();

    // 5) Cycle AUTOMATIQUE : timer → apparition près de la bourriche → vol.
    G().setRagondinAuto(true);
    G().setScore(1);
    G().setBourricheCount(1);
    G().setRagondinTimer(0.01);
    stepFor(0.1);
    check('le ragondin sort tout seul quand il y a un poisson', G().isRagondinActive(),
        'timer ' + G().getRagondinTimer().toFixed(1));
    checkEqual('la bannière HUD s’allume à l’apparition',
        el('ragondinAlert').classList.contains('active'), true);
    check('l’alerte automatique est visible',
        G().getFloatingTexts().some(function (t) { return t.indexOf('RAGONDIN') >= 0; }),
        G().getFloatingTexts().join(' / '));
    G().setRagondinVolDans(0.01);
    stepFor(0.1);
    checkEqual('le ragondin automatique vole la bourriche', G().getBourricheCount(), 0);
    checkEqual('le score baisse aussi', G().getScore(), 0);
    checkEqual('il repart après le vol automatique', G().isRagondinActive(), false);
    checkEqual('la bannière s’éteint après le vol automatique',
        el('ragondinAlert').classList.contains('active'), false);
    G().setRagondinAuto(false);

    // 6) Il ne sort QUE quand on ne fait rien ou quand le bouchon est à l'eau.
    //    Rien pendant un ferrage ni une épreuve de force.
    G().effrayerRagondin();
    resetToIdle();
    clearLilyPads();
    G().setScore(5);
    castTo(0, -25);                            // bouchon à l'eau
    checkEqual('bouchon à l’eau', state(), 'inWater');
    G().setRagondinAuto(true);
    G().setRagondinTimer(0.01);
    stepFor(0.1);
    checkEqual('il peut sortir quand le bouchon est à l’eau',
        G().isRagondinActive(), true);
    G().effrayerRagondin();

    // Pendant une épreuve de force : il reste caché.
    startFight(0, -25);
    checkEqual('épreuve de force en cours', state(), 'struggle');
    G().setRagondinTimer(0.01);
    stepFor(0.2);
    checkEqual('aucun ragondin pendant une épreuve de force',
        G().isRagondinActive(), false);
    G().setRagondinAuto(false);
    resetToIdle();

    // 7) Chasser le ragondin ne gêne JAMAIS la pêche : un clic à côté de lui
    //    ne lance pas la ligne (c'était le vrai problème).
    G().effrayerRagondin();
    resetToIdle();
    G().setScore(1);
    G().spawnRagondin();
    step(1 / 60);                              // une image : caméra à jour
    const ecran = G().getRagondinEcran();
    check('le ragondin est bien visible à l’écran',
        !!ecran && ecran.devant, JSON.stringify(ecran));
    checkEqual('un clic SUR lui le touche', G().clicSurRagondinAt(ecran.x, ecran.y), true);
    checkEqual('un clic à 200 px ne le touche pas',
        G().clicSurRagondinAt(ecran.x + 200, ecran.y), false);

    // Un clic à côté, alors que la ligne est au repos : on ne lance PAS.
    fire('gameCanvas', 'pointerdown', { button: 0, clientX: 5, clientY: 5 });
    checkEqual('un clic à côté ne lance pas la ligne', state(), 'idle');
    check('le jeu dit de viser le ragondin',
        el('status').textContent.indexOf('ragondin') >= 0,
        el('status').textContent);
    // Un clic SUR lui le chasse, sans rien lancer.
    fire('gameCanvas', 'pointerdown', { button: 0, clientX: ecran.x, clientY: ecran.y });
    check('un clic sur lui compte', G().getRagondin().hits >= 1,
        G().getRagondin().hits);
    checkEqual('un clic sur lui ne lance pas la ligne non plus', state(), 'idle');
    G().effrayerRagondin();
    resetToIdle();
}

export default run;

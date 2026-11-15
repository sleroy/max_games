// ---------------------------------------------------------------------------
// Scénario 14 : le RAGONDIN VOLEUR (aléa rare, 3 clics, jamais confondu avec
// le ferrage).
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, resetToIdle, stepFor, fire } from './harness.mjs';

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
    resetToIdle();
}

export default run;

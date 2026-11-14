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
    const scoreAvant = G().getScore();
    G().spawnRagondin();
    G().setRagondinVolDans(0.3);
    G().volerUnPoissonRagondin();
    checkEqual('il a volé un poisson (score -1)', G().getScore(), Math.max(0, scoreAvant - 1));
    checkEqual('il repart après le vol', G().isRagondinActive(), false);
    check('le jeu explique le vol', el('status').textContent.indexOf('volé') >= 0,
        el('status').textContent);

    // 4) Il est TRÈS rare : le compteur d'apparition est long.
    check('l’apparition est rare (> 2 min)', G().getRagondinTimer() > 120,
        G().getRagondinTimer().toFixed(0) + ' s avant la prochaine visite');
    // … et le compteur descend bien avec le temps de jeu.
    G().setRagondinTimer(5);
    const t0 = G().getRagondinTimer();
    stepFor(1);
    check('le compteur d’apparition descend avec le temps',
        G().getRagondinTimer() < t0 - 0.5, t0.toFixed(1) + ' -> ' + G().getRagondinTimer().toFixed(1) + ' s');
    G().effrayerRagondin();
    resetToIdle();
}

export default run;

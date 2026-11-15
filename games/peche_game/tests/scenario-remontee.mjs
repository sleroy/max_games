// ---------------------------------------------------------------------------
// Scénario 68 : la ligne à l'eau ne se remonte PLUS au clic (ni au clavier).
// Une seule façon de ramener la ligne : tourner la manivelle.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    fire, state, statusText, step, stepFor,
    distanceToShore, parkFish, clearLilyPads, resetToIdle, castTo,
    crankTurns
} from './harness.mjs';

export function run() {
    group('68) La manivelle seule ramène la ligne (plus de clic)');

    // Ligne posée à l'eau, poissons loin pour éviter une touche pendant le test.
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    parkFish();
    checkEqual('la ligne est à l’eau', state(), 'inWater');

    // Un clic sur le canvas ne doit PAS démarrer la remontée (le bouchon,
    // lui, dérive doucement avec le vent : c'est normal et voulu).
    fire('gameCanvas', 'pointerdown', { button: 0 });
    stepFor(1);
    checkEqual('un clic ne remonte pas la ligne', state(), 'inWater');
    check('aucun message de remontée après le clic',
        statusText().indexOf('remonte') < 0, statusText());

    // La manivelle, elle, marche toujours : un tour passe en « remontée ».
    crankTurns(1);
    step(1 / 60);
    checkEqual('un tour de manivelle lance la remontée', state(), 'reeling');

    // Et la ligne revient vraiment vers la berge en tournant.
    const avantManivelle = distanceToShore();
    crankTurns(2);
    stepFor(1);
    check('la manivelle ramène la ligne', distanceToShore() < avantManivelle - 2,
        avantManivelle.toFixed(1) + ' -> ' + distanceToShore().toFixed(1));
}

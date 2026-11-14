// ---------------------------------------------------------------------------
// Scénario 66 : DEUX TECHNIQUES — bouchon ou quiver (scion).
// En quiver : aucun bouchon visible, la canne est inclinée, les touches font
// bouger le scion, et le ferrage fonctionne normalement.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, el, fire, resetToIdle, castTo, forceBite, step, stepUntil, state
} from './harness.mjs';

function attendreEtat(cible, max = 4) {
    return stepUntil(function () { return state() === cible; }, max);
}

export function run() {
    group('66) Deux techniques : bouchon et quiver');
    G().demarrerJeu();
    resetToIdle();
    G().lilyPads.length = 0;

    check('le sélecteur de technique existe', !!el('techniqueSelect'));
    checkEqual('la technique par défaut est le bouchon', G().getTechnique(), 'bouchon');

    // 1) Passage en quiver : panneau scion visible, bouchon masqué.
    checkEqual('on peut choisir le quiver', G().setTechnique('quiver'), true);
    checkEqual('la technique active est le quiver', G().getTechnique(), 'quiver');
    checkEqual('le panneau du scion s’affiche', G().isQuiverPanelVisible(), true);
    checkEqual('le sélecteur suit le choix', el('techniqueSelect').value, 'quiver');
    G().setTangleChance(0);
    checkEqual('le lancer quiver arrive à l’eau', castTo(0, -25), 'inWater');
    step(0.2);
    checkEqual('aucun bouchon n’est visible en quiver', G().floatGroup.visible, false);
    const poseQuiver = G().getRodPose().x;
    check('la canne est inclinée en quiver', Math.abs(poseQuiver) > 0.1,
        poseQuiver.toFixed(2));

    // 2) Touche : le scion bouge (pas le bouchon).
    const poisson = forceBite();
    check('un poisson s’approche', !!poisson);
    checkEqual('la pêche est en phase de touche', state(), 'bite');
    check('le statut parle du scion',
        el('status').textContent.indexOf('scion') >= 0, el('status').textContent);
    checkEqual('le bouchon reste caché pendant la touche', G().floatGroup.visible, false);
    const touche = stepUntil(function () { return G().getBitePhase() === 'touche'; }, 30);
    check('la vraie touche arrive', touche, G().getBitePhase());
    step(0.04);
    const mouvement = G().getQuiverMotion();
    check('le scion bouge avec la touche',
        Math.abs(mouvement.bend) + Math.abs(mouvement.rot) + Math.abs(mouvement.twitch) > 0.01,
        JSON.stringify(mouvement));

    // 3) Le ferrage au clic fonctionne comme avec un bouchon.
    fire('gameCanvas', 'pointerdown', { button: 0 });
    checkEqual('le ferrage quiver déclenche le combat', state(), 'struggle');
    checkEqual('on reste en technique quiver', G().getTechnique(), 'quiver');

    // 4) Retour au bouchon : le flotteur redevient visible et la canne se redresse.
    resetToIdle();
    checkEqual('le retour au bouchon est accepté', G().setTechnique('bouchon'), true);
    checkEqual('la technique redevient bouchon', G().getTechnique(), 'bouchon');
    checkEqual('le panneau scion se ferme', G().isQuiverPanelVisible(), false);
    checkEqual('le lancer bouchon arrive', castTo(0, -25), 'inWater');
    step(0.2);
    checkEqual('le bouchon est de nouveau visible', G().floatGroup.visible, true);
    const poseBouchon = G().getRodPose().x;
    check('la pose bouchon diffère de la pose quiver',
        Math.abs(poseQuiver - poseBouchon) > 0.1,
        'quiver ' + poseQuiver.toFixed(2) + ' / bouchon ' + poseBouchon.toFixed(2));

    resetToIdle();
    G().setTechnique('bouchon');
    G().demarrerJeu();
}

export default run;

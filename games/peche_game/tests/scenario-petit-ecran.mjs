// ---------------------------------------------------------------------------
// Scénario 61 : menu compact, caméra tactile et FOV sur petit écran.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, checkClose, G, el, fire, step, resetToIdle } from './harness.mjs';

export function run() {
    group('61) Petit écran : menu compact, vue et FOV élargi');
    G().recommencerPartie();
    resetToIdle();
    G().demarrerJeu();

    // --- FOV horizontal garanti ---
    checkClose('en 16:9, le FOV vertical reste 50°',
        G().getFovPourAspect(16 / 9), 50, 0.01);
    check('en 3:2, le FOV s’élargit pour garder les bords',
        G().getFovPourAspect(1.5) > 50.5,
        G().getFovPourAspect(1.5).toFixed(1) + '°');
    check('en écran carré, le FOV s’élargit encore',
        G().getFovPourAspect(1) > 65,
        G().getFovPourAspect(1).toFixed(1) + '°');
    check('le FOV reste borné (pas de déformation extrême)',
        G().getFovPourAspect(0.5) <= 85,
        G().getFovPourAspect(0.5).toFixed(1) + '°');
    checkClose('la caméra utilise bien ce FOV',
        G().getCameraFov(), G().getFovPourAspect(G().camera.aspect), 1e-6);

    // --- Menu repliable et accès à la caméra ---
    checkEqual('le dock est fermé au départ', G().isOutilsOuverts(), false);
    fire('toolToggle', 'click');
    checkEqual('le bouton Menu ouvre le tiroir', G().isOutilsOuverts(), true);
    checkEqual('le bouton indique comment fermer', el('toolToggle').textContent, '✕ Fermer');
    fire('toolToggle', 'click');
    checkEqual('le bouton referme le dock', G().isOutilsOuverts(), false);
    checkEqual('le bouton redevient Menu', el('toolToggle').textContent, '☰ Menu');

    check('la barre de stats existe', !!el('statsStrip'), true);
    check('la bourriche reste accessible dans le menu',
        el('bourricheLabel').textContent.indexOf('Bourriche') >= 0,
        el('bourricheLabel').textContent);
    check('l’XP reste accessible dans le menu',
        el('xpLabel').textContent.indexOf('XP') >= 0, el('xpLabel').textContent);
    check('les lignes restantes sont indiquées',
        el('lignesLabel').textContent.indexOf('Lignes') >= 0,
        el('lignesLabel').textContent);

    fire('toolToggle', 'click');
    fire('cameraButton', 'click');
    checkEqual('ouvrir la vue referme le menu', G().isOutilsOuverts(), false);
    checkEqual('les commandes de vue sont affichées', el('cameraControls').hidden, false);
    const vueInitiale = G().camera.position.clone();
    fire('gameCanvas', 'pointerdown', { button: 0, pointerType: 'touch', pointerId: 1, clientX: 620, clientY: 350 });
    fire('gameCanvas', 'pointerdown', { button: 0, pointerType: 'touch', pointerId: 2, clientX: 660, clientY: 350 });
    fire('gameCanvas', 'pointermove', { pointerType: 'touch', pointerId: 2, clientX: 690, clientY: 370 });
    fire('gameCanvas', 'pointerup', { pointerType: 'touch', pointerId: 2 });
    fire('gameCanvas', 'pointerup', { pointerType: 'touch', pointerId: 1 });
    checkEqual('un geste de caméra ne charge pas un lancer', G().getCastState(), 'idle');
    step(1);
    check('le pincement rapproche la caméra', G().camera.position.y < vueInitiale.y);
    check('la rotation des doigts déplace la caméra latéralement',
        Math.abs(G().camera.position.x - vueInitiale.x) > 1);
    fire('cameraReset', 'click');
    step(1);
    checkClose('Recentrer ramène la caméra à sa place',
        G().camera.position.distanceTo(vueInitiale), 0, 0.01);
    fire('cameraDone', 'click');
    checkEqual('Reprendre cache les commandes de vue', el('cameraControls').hidden, true);
    fire('toolToggle', 'click');
    fire('pauseButton', 'click');
    checkEqual('le menu reste accessible en pause', G().isOutilsOuverts(), true);
    fire('pauseButton', 'click');
    checkEqual('Reprendre ferme le menu', G().isOutilsOuverts(), false);

    // --- JOUER referme le tiroir ---
    fire('toolToggle', 'click');
    checkEqual('dock ouvert avant de rejouer', G().isOutilsOuverts(), true);
    G().demarrerJeu();
    checkEqual('JOUER referme le dock', G().isOutilsOuverts(), false);
    checkEqual('le bouton redevient Menu après JOUER',
        el('toolToggle').textContent, '☰ Menu');

    G().demarrerJeu();
}

export default run;

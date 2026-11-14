// ---------------------------------------------------------------------------
// Scénario 61 : PETIT ÉCRAN — le dock se replie pour laisser la bourriche et
// la girouette visibles ; les compteurs restent dans la barre de stats ; le
// FOV s'élargit automatiquement sur les écrans étroits.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, checkClose, G, el, fire, resetToIdle } from './harness.mjs';

export function run() {
    group('61) Petit écran : dock repliable, stats visibles, FOV élargi');
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

    // --- Dock repliable + compteurs hors du dock ---
    checkEqual('le dock est fermé au départ', G().isOutilsOuverts(), false);
    fire('toolToggle', 'click');
    checkEqual('le bouton 🎒 ouvre le dock', G().isOutilsOuverts(), true);
    checkEqual('le bouton devient ✕', el('toolToggle').textContent, '✕');
    fire('toolToggle', 'click');
    checkEqual('le bouton referme le dock', G().isOutilsOuverts(), false);
    checkEqual('le bouton redevient 🎒', el('toolToggle').textContent, '🎒');

    check('la barre de stats existe', !!el('statsStrip'), true);
    check('la bourriche reste visible hors du dock',
        el('bourricheLabel').textContent.indexOf('Bourriche') >= 0,
        el('bourricheLabel').textContent);
    check('l’XP reste visible hors du dock',
        el('xpLabel').textContent.indexOf('XP') >= 0, el('xpLabel').textContent);
    check('les lignes restent visibles hors du dock',
        el('lignesLabel').textContent.indexOf('Lignes') >= 0,
        el('lignesLabel').textContent);

    // --- JOUER referme le tiroir ---
    fire('toolToggle', 'click');
    checkEqual('dock ouvert avant de rejouer', G().isOutilsOuverts(), true);
    G().demarrerJeu();
    checkEqual('JOUER referme le dock', G().isOutilsOuverts(), false);
    checkEqual('le bouton redevient 🎒 après JOUER',
        el('toolToggle').textContent, '🎒');

    G().demarrerJeu();
}

export default run;

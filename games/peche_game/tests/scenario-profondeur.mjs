// ---------------------------------------------------------------------------
// Scénario 11 : profondeur de la ligne, relief de l'étang, vase et amorçage.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, step, stepFor, stepUntil,
    resetToIdle, clearLilyPads, castTo
} from './harness.mjs';

export function run() {
    group('43) Profondeur de la ligne et relief de l’étang');

    // --- Réglage de la profondeur (borné par le bouchon) ---
    resetToIdle();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    checkEqual('profondeur par défaut', G().getProfondeur(), 2.5);
    checkEqual('l’hameçon est à la profondeur réglée', G().getHookDepth(), -2.5);
    const bornesAnglaise = G().getBornesProfondeur();
    check('l’anglaise ne descend pas très profond', bornesAnglaise[1] <= 2.6,
        bornesAnglaise.join(' à '));
    G().setProfondeur(10);
    checkEqual('la profondeur est bornée par le bouchon', G().getProfondeur(), bornesAnglaise[1]);
    G().setFloatType('coulisse');
    check('la pose à coulisse va bien plus profond',
        G().getBornesProfondeur()[1] > bornesAnglaise[1] + 1, G().getBornesProfondeur().join(' à '));
    G().setProfondeur(4.5);
    checkClose('on peut descendre l’hameçon très bas', G().getHookDepth(), -4.5, 1e-9);
    G().setFloatType('anglaise');
    check('changer de bouchon ramène la profondeur dans ses bornes',
        G().getProfondeur() <= G().getBornesProfondeur()[1], G().getProfondeur());

    // --- Le relief : un bassin avec des fosses ---
    const centre = G().getPondCenter();
    const R = G().getPondRadius();
    const profCentre = G().profondeurLocale(centre.x, centre.z);
    const profBord = G().profondeurLocale(centre.x, centre.z - (R - 1));
    check('le centre est plus profond que le bord', profCentre > profBord + 1,
        profBord.toFixed(2) + ' -> ' + profCentre.toFixed(2) + ' unités');
    check('le bord est peu profond', profBord < 2, profBord.toFixed(2) + ' unités');
    check('le fond est sous la surface', G().fondY(centre.x, centre.z) <= -4,
        G().fondY(centre.x, centre.z).toFixed(2));

    // --- Morsure PAR ZONE ---
    resetToIdle();
    clearLilyPads();
    G().setProfondeur(0.5);                       // hameçon juste sous la surface
    castTo(0, -25);
    const poissonFond = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    poissonFond.userData.profondeurZone = [-3.3, -2.0];
    poissonFond.position.set(G().floatGroup.position.x, -2.5, G().floatGroup.position.z);
    poissonFond.userData.depth = -2.5;
    poissonFond.userData.vx = 0;
    poissonFond.userData.vz = 0;
    stepFor(1.5);
    checkEqual('un poisson du fond ne mord pas une esche en surface', state(), 'inWater');
    resetToIdle();
    clearLilyPads();
    G().setProfondeur(2.5);                       // hameçon dans SA zone
    castTo(0, -25);
    const poissonFond2 = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    poissonFond2.userData.profondeurZone = [-3.3, -2.0];
    poissonFond2.position.set(G().floatGroup.position.x, -2.5, G().floatGroup.position.z);
    poissonFond2.userData.depth = -2.5;
    poissonFond2.userData.vx = 0;
    poissonFond2.userData.vz = 0;
    stepFor(1.5);
    checkEqual('dans sa zone, le poisson mord', state(), 'bite');
    resetToIdle();

    // --- Hameçon dans la VASE (lancer profond près de la berge) ---
    resetToIdle();
    clearLilyPads();
    G().setFloatType('coulisse');
    // Point de lancer toujours à portée, en bord d'étang (peu d'eau).
    const PROF_BERGE = G().profondeurLocale(30, -10);
    G().setProfondeur(PROF_BERGE - 0.1);          // un peu trop long : dans la vase
    castTo(30, -10);
    checkEqual('la ligne est dans la vase', G().isHameconDansLaVase(), true);
    check('le jeu prévient', el('status').textContent.indexOf('vase') >= 0,
        el('status').textContent);
    stepFor(1.5);
    checkEqual('rien ne mord dans la vase', state(), 'inWater');
    resetToIdle();
    clearLilyPads();
    G().setProfondeur(1.0);
    castTo(30, -10);
    checkEqual('en réglant court, plus de vase', G().isHameconDansLaVase(), false);
    resetToIdle();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);

    // --- ALÉA : hameçon franchement enfoncé dans le fond = ACCROCHAGE ---
    resetToIdle();
    clearLilyPads();
    G().setFloatType('coulisse');
    G().setProfondeur(PROF_BERGE + 0.6);
    castTo(30, -10);
    checkEqual('un hameçon trop profond s’accroche dans la vase', state(), 'snag');
    check('le jeu explique l’accrochage', el('status').textContent.indexOf('vase') >= 0,
        el('status').textContent);
    resetToIdle();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);

    // --- L'AMORÇAGE coule à la profondeur de la ligne ---
    resetToIdle();
    clearLilyPads();
    G().setFloatType('coulisse');
    G().setProfondeur(4.0);
    G().setFeedMode(true);
    G().startFeedCharge({ x: 0, y: 0, z: -25 });
    G().releaseFeed();
    check('le nuage de miettes apparaît', stepUntil(() => G().getChum() !== null, 5),
        G().getFeedState());
    stepFor(4);
    const nuage = G().getChum();
    check('le nuage a coulé à la profondeur de la ligne', nuage.y < -2.5,
        'hauteur du nuage ' + nuage.y.toFixed(2));
    G().setFeedMode(false);
    resetToIdle();

    // --- Touche À LA VOLÉE (esche prise pendant la descente) ---
    resetToIdle();
    clearLilyPads();
    stepFor(1.2);                                 // laisse retomber le délai entre touches
    G().setProfondeur(1.0);                       // faible profondeur
    castTo(0, -25);
    const vif = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    vif.userData.profondeurZone = [-1.3, -0.7];
    vif.position.set(G().floatGroup.position.x, -1.0, G().floatGroup.position.z);
    vif.userData.depth = -1.0;
    vif.userData.vx = 0;
    vif.userData.vz = 0;
    step(1 / 60);
    checkEqual('morsure immédiate après le lancer', state(), 'bite');
    checkEqual('c’est une touche À LA VOLÉE', G().getBiteTouchId(), 'a_la_volee');
    resetToIdle();
    G().setProfondeur(2.5);

    // --- La COUPE DE L'EAU : le visuel du réglage de profondeur ---
    resetToIdle();
    G().setFloatType('coulisse');
    G().setProfondeur(1.5);
    const hautHamecon = parseFloat(el('depthHook').style.top);
    checkEqual('le schéma nomme la couche d’eau (surface)', el('depthZoneLabel').textContent, 'surface');
    G().setProfondeur(4.5);
    const basHamecon = parseFloat(el('depthHook').style.top);
    check('le schéma enfonce l’hameçon quand la ligne s’allonge',
        basHamecon > hautHamecon + 15, hautHamecon.toFixed(0) + '% -> ' + basHamecon.toFixed(0) + '%');
    checkEqual('le schéma nomme la couche d’eau (fond)', el('depthZoneLabel').textContent, 'fond');
    check('le schéma donne la profondeur du fond', el('depthHint').textContent.indexOf('fond à') >= 0,
        el('depthHint').textContent);
    // L'hameçon dans le fond : alerte rouge sur le schéma.
    resetToIdle();
    clearLilyPads();
    G().setProfondeur(PROF_BERGE + 0.6);
    castTo(30, -10);
    G().majCoupeProfondeur();
    checkEqual('le schéma passe en alerte dans la vase',
        el('depthHook').classList.contains('danger'), true);
    check('le schéma prévient du risque', el('depthHint').textContent.indexOf('vase') >= 0,
        el('depthHint').textContent);
    resetToIdle();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);

    // --- La carte montre les isobathes et la profondeur du moment ---
    clearLilyPads();
    castTo(0, -25);
    G().showJournal();
    const carte = el('pondMap').innerHTML;
    check('la carte dessine les isobathes', carte.indexOf('stroke-dasharray') >= 0,
        carte.length + ' caractères');
    check('la carte donne les profondeurs en mètres', /m<\/text>/.test(carte));
    check('la carte donne la profondeur sous le bouchon', carte.indexOf('Ici :') >= 0,
        'ligne « Ici » de la légende');
    G().hideJournal();
    resetToIdle();
}

export default run;

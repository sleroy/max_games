// ---------------------------------------------------------------------------
// Scénario 57 : la VASE est tenace (idee de difficulte).
// Avant, ~5 clics en 0,3 s suffisaient. Maintenant la vase aspire : un clic
// n'est utile que toutes les 0,32 s, il faut tenir un rythme (~3 clics/s)
// pendant plusieurs secondes, sinon la ligne casse. Les nénuphars restent
// faciles (aucun temps de récupération).
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, resetToIdle, clearLilyPads, castTo, step, stepFor, state, donnerFilsDeRechange, viderFilsDeRechange
} from './harness.mjs';

/** Provoque un accrochage DANS LA VASE : hameçon franchement trop profond. */
function declencherVase() {
    resetToIdle();
    clearLilyPads();
    G().setFloatType('coulisse');
    const profBerge = G().profondeurLocale(POINT_VASE.x, POINT_VASE.z);
    G().setProfondeur(profBerge + 1.2);
    castTo(POINT_VASE.x, POINT_VASE.z);
}

/** Provoque un accrochage dans les NÉNUPHARS (facile). */
function declencherNenuphar() {
    resetToIdle();
    clearLilyPads();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    G().lilyPads.push({ x: 0, z: -25, radius: 6 });
    castTo(0, -25);
}

// §14.3 : le fond n'est plus uniforme. Le point (30, -10) est désormais de l'HERBIER (herbier
// autour des nénuphars et roseaux) : les tests de la VASE visent un point de vase, au centre du bassin
// (profondeur ≈ 2 m), toujours à portée de lancer.
const POINT_VASE = { x: 0, z: -25 };

export function run() {
    group('57) La vase est tenace : rythme obligatoire, clics rapides inutiles');
    G().recommencerPartie();
    declencherVase();

    checkEqual('la ligne s’accroche dans la vase', state(), 'snag');
    checkEqual('le jeu sait que l’hameçon est dans la vase',
        G().isHameconDansLaVase(), true);
    const debut = G().getSnag();
    checkEqual('l’accrochage est bien identifié comme la vase', debut.dansLaVase, true);
    checkClose('la vase démarre déjà sous tension', debut.tension, 0.55, 0.01);
    checkClose('il faut attendre entre deux clics utiles', debut.clickCooldown, 0.32, 1e-9);
    check('le panneau parle de la vase',
        el('struggleInfo').textContent.indexOf('vase') >= 0,
        el('struggleInfo').textContent);
    check('le message explique le rythme',
        el('struggleHint').textContent.indexOf('rythme') >= 0,
        el('struggleHint').textContent);

    // --- 30 clics en 0,6 s : la vase ne lâche PAS ---
    for (let i = 0; i < 30; i++) {
        fire('fishButton', 'click');
        step(0.02);
    }
    const apresSpam = G().getSnag();
    checkEqual('après 30 clics rapides, la ligne est toujours accrochée',
        state(), 'snag');
    check('les clics trop rapides ne comptent pas tous',
        apresSpam.clicsUtiles <= 3,
        apresSpam.clicsUtiles + ' clic(s) utile(s) sur ' + apresSpam.clics);
    check('la tension n’a pas disparu', apresSpam.tension > 0.2,
        apresSpam.tension.toFixed(2));
    checkEqual('un clic trop rapide est GARDÉ, pas perdu',
        apresSpam.enAttente, true);

    // Un clic juste après : le jeu explique qu'il est gardé (pas « trop tôt »).
    fire('fishButton', 'click');
    check('le bouton signale le temps de récupération',
        el('fishButton').classList.contains('cooldown'), true);
    check('le message rassure : le clic est gardé',
        el('struggleHint').textContent.indexOf('gardé') >= 0,
        el('struggleHint').textContent);
    const avantAttente = G().getSnag();
    step(0.35);
    const apresAttente = G().getSnag();
    check('le clic gardé finit par compter',
        apresAttente.clicsUtiles > avantAttente.clicsUtiles,
        avantAttente.clicsUtiles + ' -> ' + apresAttente.clicsUtiles);
    checkEqual('plus rien en attente une fois le clic passé',
        apresAttente.enAttente, false);
    // Le clic gardé vient d'être consommé : la ligne doit de nouveau se détendre.
    checkEqual('il faut de nouveau attendre entre deux clics utiles',
        el('fishButton').classList.contains('cooldown'), true);
    // Sans nouveau clic, la ligne se détend et le bouton redevient prêt.
    step(0.35);
    checkEqual('après le temps de récupération, le bouton redevient prêt',
        el('fishButton').classList.contains('cooldown'), false);
    check('le message redemande le rythme',
        el('struggleHint').textContent.indexOf('rythme') >= 0,
        el('struggleHint').textContent);

    // --- Clics en rythme : il faut plusieurs secondes ---
    let duree = 0;
    let infos = null;
    while (state() === 'snag' && duree < 20) {
        infos = G().getSnag();
        fire('fishButton', 'click');
        step(0.32);
        duree += 0.32;
    }
    checkEqual('en tenant le rythme, la ligne finit par se dégager',
        state(), 'reeling');
    // Durée TOTALE depuis le début de l'accrochage (les clics de spam et d'attente
    // d'avant la boucle comptent) : la durée de la seule boucle dépend des à-coups
    // aléatoires de la vase (1,9 à 2,9 s selon le tirage), donc d'un monde à l'autre.
    check('il faut plusieurs secondes de rythme', !!infos && infos.elapsed > 2,
        infos ? infos.elapsed.toFixed(2) + ' s (dont ' + duree.toFixed(2) + ' s de rythme)' : 'aucune info');
    check('ce n’est pas interminable non plus', duree < 15,
        duree.toFixed(2) + ' s');
    check('il a fallu plusieurs clics utiles',
        !!infos && infos.clicsUtiles >= 5,
        infos ? infos.clicsUtiles + ' clics utiles' : 'aucune info');
    checkEqual('le repère de temps de récupération est retiré',
        el('fishButton').classList.contains('cooldown'), false);
    resetToIdle();

    // --- Sans cliquer, la vase casse la ligne ---
    donnerFilsDeRechange();   // une casse ne doit pas finir la partie (1 seule ligne au départ)
    declencherVase();
    checkEqual('nouvel accrochage dans la vase', state(), 'snag');
    let garde = 0;
    while (state() === 'snag' && garde++ < 200) {
        step(0.05);
    }
    checkEqual('sans cliquer, la ligne casse', state(), 'broken');
    check('le jeu explique la casse',
        el('status').textContent.indexOf('cassé') >= 0,
        el('status').textContent);
    stepFor(1.5);
    checkEqual('on peut relancer après la casse', state(), 'idle');
    checkEqual('la casse a coûté un fil de rechange, pas la partie', G().isPartieTerminee(), false);
    viderFilsDeRechange();

    // --- Les nénuphars restent FACILES (pas de temps de récupération) ---
    declencherNenuphar();
    checkEqual('la ligne s’accroche aux nénuphars', state(), 'snag');
    const nenuphar = G().getSnag();
    checkEqual('les nénuphars ne sont pas la vase', nenuphar.dansLaVase, false);
    checkEqual('aucun temps de récupération pour les nénuphars',
        nenuphar.clickCooldown, 0);
    for (let i = 0; i < 10; i++) {
        fire('fishButton', 'click');
        step(0.02);
    }
    checkEqual('quelques clics suffisent pour les nénuphars',
        state(), 'reeling');
    checkEqual('aucun repère de récupération sur les nénuphars',
        el('fishButton').classList.contains('cooldown'), false);
    resetToIdle();

    // Retour à l'état de jeu standard.
    clearLilyPads();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    G().demarrerJeu();
}

export default run;

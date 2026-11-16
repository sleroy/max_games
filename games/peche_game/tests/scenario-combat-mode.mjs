// ---------------------------------------------------------------------------
// Scénario 77 : la COMBATIVITÉ reste intacte en mode enfant (§17.7).
// Le mode Facile n'aide qu'à DÉTECTER la touche (fenêtre, densité, pas d'emmêlement,
// bandeau « FERRER ! »). Le combat — avantage du ferrage, traction, coups, endurance,
// temps limite — est le même qu'en Normal.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, stepUntil, castTo, clearLilyPads, resetToIdle, forceBite
} from './harness.mjs';

/** Ferre en `moment` ('tot' | 'tard') et mesure le combat obtenu, dans le mode donné. */
function mesurerCombat(mode, moment) {
    G().setDifficulty(mode);
    G().setTangleChance(0);
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    const fish = forceBite();
    // Poisson de référence : le même profil dans les deux modes (sinon la mesure compare deux poissons).
    fish.userData.especeId = 'carpe';
    fish.userData.size = 1;
    fish.userData.power = 1;
    fish.userData.aggression = 1;
    if (moment === 'tot') {
        stepUntil(() => G().getBitePhase() === 'fausse', 15);
    } else {
        stepUntil(() => G().getBitePhase() === 'touche', 45);
        stepUntil(() => G().getBitePhase() === 'ratee', 3);
    }
    fire('gameCanvas', 'pointerdown', { button: 0 });
    const s = G().etat.struggle;
    const mesure = {
        qualite: G().getStrikeQuality(),
        avantage: G().getFightAdvantage(),
        avantageFerrage: G().etat.avantageFerrage,
        pullSpeed: s ? s.pullSpeed : null,
        burstDistance: s ? s.burstDistance : null,
        burstInterval: s ? s.burstInterval : null,
        endurance: s ? s.endurance : null,
        lineLength: s ? s.lineLength : null,
        temps: G().getStruggleTimeLeft()
    };
    resetToIdle();
    return mesure;
}

export function run() {
    group('77) Mode enfant : la combativité du poisson reste intacte (§17.7)');

    try {
        for (const moment of ['tot', 'tard']) {
            const facile = mesurerCombat('facile', moment);
            const normal = mesurerCombat('normal', moment);
            const nom = moment === 'tot' ? 'ferrage trop tôt' : 'ferrage trop tard';
            check(nom + ' : la mesure porte sur un vrai combat',
                facile.pullSpeed !== null && normal.pullSpeed !== null,
                JSON.stringify({ facile: facile.pullSpeed, normal: normal.pullSpeed }));
            checkEqual(nom + ' : qualité de ferrage identique', facile.qualite, normal.qualite);
            checkEqual(nom + ' : fightAdvantage identique en facile et en normal',
                facile.avantage, normal.avantage);
            checkEqual(nom + ' : l’avantage transmis à startStruggle est le même',
                facile.avantageFerrage, normal.avantageFerrage);
            checkEqual(nom + ' : le poisson tire aussi fort (traction)', facile.pullSpeed, normal.pullSpeed);
            checkEqual(nom + ' : mêmes coups brusques (distance)', facile.burstDistance, normal.burstDistance);
            checkEqual(nom + ' : mêmes coups brusques (intervalle)', facile.burstInterval, normal.burstInterval);
            checkEqual(nom + ' : même endurance (vitesse de fatigue)', facile.endurance, normal.endurance);
            checkClose(nom + ' : même longueur de fil au départ (tension)', facile.lineLength, normal.lineLength, 0.5);
            checkClose(nom + ' : même temps limite', facile.temps, normal.temps, 0.3);
            check(nom + ' : le poisson garde l’avantage (facteur ≥ 1,15) même en mode enfant',
                facile.avantage >= 1.15, facile.avantage.toFixed(2));
        }

        // La difficulté de combat (traction, coups, temps) est celle du mode Normal.
        G().setDifficulty('facile');
        const facileDiff = G().getDifficulty();
        G().setDifficulty('normal');
        const normalDiff = G().getDifficulty();
        checkEqual('le mode Facile utilise la difficulté de combat du mode Normal',
            facileDiff.difficulty, normalDiff.difficulty);

        // --- Le mode enfant GARDE ses aides de détection ---
        G().setDifficulty('facile');
        G().setTangleChance(null);
        check('fenêtre de ferrage large conservée (≥ 1,5 s)', facileDiff.biteWindow >= 1.5,
            facileDiff.biteWindow.toFixed(2) + ' s');
        check('la fenêtre de ferrage reste plus large qu’en Normal',
            facileDiff.biteWindow > normalDiff.biteWindow,
            facileDiff.biteWindow + ' contre ' + normalDiff.biteWindow);
        checkEqual('pas d’emmêlement en mode enfant', G().getTangleChance(), 0);
        checkEqual('densité de poissons ×3 en mode enfant', G().etat.facteurDensite, 3);
        checkEqual('le corps garde la classe mode-facile (bandeau « FERRER ! »)',
            document.body.classList.contains('mode-facile'), true);
        checkEqual('le bandeau « FERRER ! » existe', !!el('kidCue'), true);
        G().setDifficulty('normal');
        checkEqual('densité ×2 en Normal', G().etat.facteurDensite, 2);
        checkClose('emmêlement 8 % en Normal', G().getTangleChance(), 0.08, 1e-9);
    } finally {
        try {
            resetToIdle();
            G().setDifficulty('normal');
            G().setTangleChance(0);   // le harnais neutralise l'emmêlement des lancers de test
        } catch (error) { /* rien */ }
    }
}

export default run;

// ---------------------------------------------------------------------------
// Scénario 60 : JOUER démarre une PARTIE NEUVE.
// Score, bourriche de la partie, lignes, statistiques et état de pêche doivent
// repartir de zéro. Le carnet, l'XP, les bouchons et le classement persistent.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, resetToIdle, clearLilyPads,
    state, step, stepFor, castTo, crankTurns, startFight
} from './harness.mjs';

function ramenerAuBord() {
    let guard = 0;
    while ((state() === 'struggle' || state() === 'reeling') && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    if (state() !== 'holding') {
        throw new Error('poisson non ramené (état ' + state() + ')');
    }
}

/** Pêche un poisson et le range : score et bourriche +1. */
function pecherEtRanger() {
    startFight(0, -25);
    ramenerAuBord();
    G().storeHeldFish();
}

/** Pêche un poisson et le garde en main (état « holding »). */
function pecherEtGarderEnMain() {
    startFight(0, -25);
    ramenerAuBord();
    return G().getHeldFish();
}

export function run() {
    group('60) JOUER réinitialise la partie (score, bourriche, lignes, stats)');
    G().recommencerPartie();
    resetToIdle();
    clearLilyPads();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    checkEqual('la partie repart à zéro avant le test', G().getScore(), 0);

    // --- Une vraie prise : score +1, bourriche de partie +1, carnet +1 ---
    const journalAvant = G().getJournal().total;
    const xpAvant = G().getExperience();
    pecherEtRanger();
    checkEqual('une prise marque un point', G().getScore(), 1);
    checkEqual('le compteur de bourriche de la partie suit', G().getBourricheCount(), 1);
    check('le libellé de bourriche affiche la partie',
        el('bourricheLabel').textContent === '🧺 Bourriche : 1',
        el('bourricheLabel').textContent);
    checkEqual('le carnet a enregistré la prise', G().getJournal().total, journalAvant + 1);
    check('l’XP a augmenté', G().getExperience() > xpAvant);
    checkEqual('les statistiques de partie comptent la prise',
        G().getPartieStats().poissons, 1);

    // --- Deux lignes perdues ---
    G().casserLigne('Test 1');
    G().casserLigne('Test 2');
    checkEqual('deux lignes ont été perdues', G().getLignes(), 3);

    // --- Un poisson en main au moment de cliquer JOUER ---
    const poissonEnMain = pecherEtGarderEnMain();
    check('un poisson est bien en main', !!poissonEnMain);
    checkEqual('la partie est en état « holding »', state(), 'holding');
    const journalApres = G().getJournal().total;
    const xpApres = G().getExperience();

    // --- JOUER ---
    G().afficherAccueil();
    fire('playButton', 'click');

    checkEqual('JOUER ferme l’accueil', G().isAccueilVisible(), false);
    checkEqual('le score repart à zéro', G().getScore(), 0);
    checkEqual('le score affiché repart à zéro', Number(el('score').textContent), 0);
    checkEqual('la bourriche de la partie repart à zéro', G().getBourricheCount(), 0);
    check('le libellé de bourriche repart à zéro',
        el('bourricheLabel').textContent === '🧺 Bourriche : 0',
        el('bourricheLabel').textContent);
    checkEqual('les 5 lignes sont rendues', G().getLignes(), 5);
    checkEqual('le libellé des lignes est remis à 5/5',
        el('lignesLabel').textContent, '🧵 Lignes : 5/5');
    checkEqual('les statistiques de partie repartent à zéro',
        G().getPartieStats().poissons, 0);
    checkEqual('la partie n’est pas terminée', G().isPartieTerminee(), false);
    checkEqual('le poisson en main est relâché', G().getHeldFish(), null);
    checkEqual('la pêche est au repos', state(), 'idle');
    checkEqual('le panneau de combat est fermé',
        el('struggle').classList.contains('active'), false);
    checkEqual('le panneau de fin de partie est fermé',
        el('gameOver').classList.contains('active'), false);
    checkEqual('l’étang a toujours toute sa population', G().fishes.length, G().getPopulation().cible);

    // --- Le carnet, l'XP et les bouchons PERSISTENT ---
    checkEqual('le carnet persiste', G().getJournal().total, journalApres);
    checkEqual('l’XP persiste', G().getExperience(), xpApres);
    check('les bouchons possédés persistent', G().getBouchonsPossedes().length >= 1,
        G().getBouchonsPossedes().join(', '));

    // --- Une ligne à l'eau est aussi rangée par JOUER ---
    resetToIdle();
    clearLilyPads();
    checkEqual('on relance une ligne', castTo(0, -25), 'inWater');
    G().afficherAccueil();
    fire('playButton', 'click');
    checkEqual('JOUER ramène la ligne au repos', state(), 'idle');
    checkClose('le bouchon revient au bout de la canne',
        Math.hypot(G().floatGroup.position.x - G().rodTip.x,
            G().floatGroup.position.z - G().rodTip.z), 0, 0.01);
    checkEqual('le score reste à zéro', G().getScore(), 0);

    G().afficherAccueil();
    fire('accueilTutoriel', 'click');
    checkEqual('le bouton d’accueil ouvre le tutoriel', G().isTutorialOpen(), true);
    fire('tutorialClose', 'click');
    checkEqual('passer le tutoriel laisse le menu ouvert', G().isAccueilVisible(), true);
    fire('accueilTutoriel', 'click');
    for (let stepIndex = 0; stepIndex < 4; stepIndex++) {
        fire('tutorialNext', 'click');
    }
    checkEqual('terminer le tutoriel démarre la partie', G().isAccueilVisible(), false);
}

export default run;

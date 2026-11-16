// ---------------------------------------------------------------------------
// Scénario 74 : MODE FACILE (enfant) — pêche ludique.
//  - les poissons repèrent l'hameçon de loin et nagent droit dessus, même
//    depuis une autre zone / couche d'eau ;
//  - la touche arrive vite, avec UNE seule fausse touche ;
//  - la fenêtre de ferrage est large ;
//  - le gros panneau « FERRER ! » s'affiche pendant LA vraie touche ;
//  - on revient au mode Normal sans laisser d'état caché.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, step, stepFor, stepUntil,
    castTo, parkFish, clearLilyPads, resetToIdle
} from './harness.mjs';

function distanceFishToHook(fish) {
    const fl = G().floatGroup.position;
    return Math.hypot(fish.position.x - fl.x, fish.position.z - fl.z);
}

export function run() {
    group('74) Mode Facile (enfant) : poissons aimantés et « FERRER ! »');

    try {
        // --- Le niveau se choisit DÈS L'ACCUEIL (et reste synchro avec le carnet) ---
        G().setDifficulty('normal');
        const accueilDifficulte = el('accueilDifficultySelect');
        accueilDifficulte.value = 'facile';
        fire('accueilDifficultySelect', 'change');
        checkEqual('le mode Facile se choisit sur l’accueil', G().getDifficulty().modeFacile, true);
        checkEqual('le carnet est synchronisé avec l’accueil',
            el('difficultySelect').value, 'facile');

        const diff = G().getDifficulty();
        checkEqual('le mode Facile est actif', diff.modeFacile, true);
        check('la fenêtre de ferrage est très large (≥ 1,5 s)', diff.biteWindow >= 1.5,
            diff.biteWindow.toFixed(2) + ' s');
        checkEqual('le corps reçoit la classe mode-facile',
            document.body.classList.contains('mode-facile'), true);

        // --- Aimant à poissons : un poisson LOIN et hors zone vient quand même ---
        resetToIdle();
        clearLilyPads();
        castTo(0, -25);
        parkFish();
        const fl = G().floatGroup.position;
        const fish = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
        // 20 unités sur le côté : hors de sa zone de vie et hors de sa couche.
        fish.position.set(fl.x + 20, -2, fl.z);
        fish.userData.depth = -2;
        fish.userData.profondeurZone = [-8, -6];   // zone opposée à l'hameçon
        fish.userData.homeX = fl.x + 40;
        fish.userData.homeZ = fl.z;
        fish.userData.homeRadius = 2;
        fish.userData.vx = 0;
        fish.userData.vz = 0;
        const depart = distanceFishToHook(fish);
        check('le poisson de test est bien loin (≥ 15 unités)', depart >= 15, depart.toFixed(1));

        const attire = stepUntil(() => distanceFishToHook(fish) < 3, 8);
        check('le poisson est attiré directement par l’hameçon (mode Facile)', attire,
            depart.toFixed(1) + ' -> ' + distanceFishToHook(fish).toFixed(1) + ' unités');

        // --- Touche rapide, une seule fausse touche, gros « FERRER ! » ---
        parkFish(); // les autres poissons ne doivent pas voler la touche
        // On remet le poisson de test sur l'hameçon pour une touche déterministe.
        fish.position.set(fl.x, -2, fl.z);
        fish.userData.depth = G().etat.HOOK_DEPTH;
        const touche = stepUntil(() => state() === 'bite', 5);
        check('la touche arrive vite (≤ 5 s)', touche, state());
        checkEqual('une seule fausse touche en mode Facile', G().getBiteSignaux(), 1);

        const vraie = stepUntil(() => G().getBitePhase() === 'touche', 6);
        check('la vraie touche arrive vite (≤ 6 s)', vraie, G().getBitePhase());
        checkEqual('le gros « FERRER ! » s’affiche pendant la vraie touche',
            el('kidCue').classList.contains('active'), true);

        // Ferrer : le poisson est bien ferré (et le panneau disparaît).
        G().hookFish();
        step(1 / 60);
        check('un clic sur « FERRER ! » ferre le poisson', state() === 'struggle' || state() === 'reeling',
            state());
        checkEqual('le panneau se cache après le ferrage',
            el('kidCue').classList.contains('active'), false);

        // --- On rend le jeu au mode Normal (aucun état caché) ---
        resetToIdle();
        G().setDifficulty('normal');
        checkEqual('le mode Facile est bien désactivé', G().getDifficulty().modeFacile, false);
        checkEqual('le sélecteur d’accueil repasse en Normal',
            el('accueilDifficultySelect').value, 'normal');
        checkEqual('la classe mode-facile est retirée',
            document.body.classList.contains('mode-facile'), false);
        checkClose('la fenêtre de ferrage redevient normale', G().getDifficulty().biteWindow, 0.7, 1e-9);
    } finally {
        // Même si un test échoue, les scénarios suivants repartent en Normal.
        try {
            resetToIdle();
            G().setDifficulty('normal');
        } catch (error) { /* rien */ }
    }
}

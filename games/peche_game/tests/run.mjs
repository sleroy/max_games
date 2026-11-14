// ---------------------------------------------------------------------------
// Tests de non-régression du jeu de pêche.
//
//   node games/peche_game/tests/run.mjs
//
// Aucune dépendance : Node seul (v18+). Le jeu n'est jamais modifié : le
// harnais fabrique un faux navigateur puis charge le vrai script.js.
// ---------------------------------------------------------------------------
import { installEnvironment, loadGame, cleanup, report } from './harness.mjs';
import scenarioStatic from './scenario-static.mjs';
import scenarioSound from './scenario-sound.mjs';
import scenarioGameplay from './scenario-gameplay.mjs';
import scenarioFeed from './scenario-feed.mjs';

console.log('Tests de non-régression — L\'étang du Bois Neuf (games/peche_game)');

let crashed = null;
try {
    scenarioStatic();          // fichiers, cohérence HTML <-> JS (pas de code exécuté)
    installEnvironment();
    await loadGame();
    scenarioSound();           // sound.js avec un faux AudioContext
    scenarioGameplay();        // lancer, bouchon, moulinet, remontée, nénuphars, vent
    scenarioFeed();            // amorçage : boule de nourriture, jauge, attraction
} catch (error) {
    crashed = error;
} finally {
    cleanup();
}

report();
if (crashed) {
    console.error('\nERREUR pendant les tests :\n' + (crashed.stack || crashed));
    process.exitCode = 1;
}

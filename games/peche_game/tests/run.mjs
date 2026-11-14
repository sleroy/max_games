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
import scenarioBoutique from './scenario-boutique.mjs';
import scenarioRythme from './scenario-rythme.mjs';
import scenarioTouches from './scenario-touches.mjs';
import scenarioRendu from './scenario-rendu.mjs';
import scenarioCarnet from './scenario-carnet.mjs';
import scenarioProfondeur from './scenario-profondeur.mjs';
import scenarioStyles from './scenario-styles.mjs';
import scenarioLignes from './scenario-lignes.mjs';
import scenarioRagondin from './scenario-ragondin.mjs';
import scenarioPostes from './scenario-postes.mjs';
import scenarioSoleil from './scenario-soleil.mjs';
import scenarioEtang from './scenario-etang.mjs';
import scenarioPlacement from './scenario-placement.mjs';
import scenarioVase from './scenario-vase.mjs';
import scenarioOndulations from './scenario-ondulations.mjs';
import scenarioLancer from './scenario-lancer.mjs';

console.log('Tests de non-régression — L\'étang du Bois Neuf (games/peche_game)');

let crashed = null;
try {
    scenarioStatic();          // fichiers, cohérence HTML <-> JS (pas de code exécuté)
    installEnvironment();
    await loadGame();
    scenarioSound();           // sound.js avec un faux AudioContext
    scenarioGameplay();        // lancer, bouchon, moulinet, remontée, nénuphars, vent
    scenarioFeed();            // amorçage : boule de nourriture, jauge, attraction
    scenarioBoutique();        // expérience (XP) et boutique de bouchons
    scenarioRythme();          // rythme des touches : patience et bouchon calme
    scenarioTouches();         // catalogue des touches (mouvements du bouchon)
    scenarioRendu();           // rendu : tampon de profondeur et « voile blanc »
    scenarioCarnet();          // carnet : onglets, carte de l’étang, zones des poissons
    scenarioProfondeur();      // profondeur de la ligne, relief, vase, amorçage
    scenarioStyles();          // un style de touches et de combat par espèce
    scenarioLignes();          // lignes (vies), casse, fin de partie, classement
    scenarioRagondin();        // ragondin voleur : 3 clics, vol, rareté
    scenarioPostes();          // emplacements : les 4 bords de l'étang
    scenarioSoleil();           // soleil fixe au sud-ouest + lumière par poste
    scenarioEtang();            // étang généré : contour, eau, fond, rive, carte
    scenarioPlacement();        // choix libre sur la carte vue de dessus
    scenarioVase();             // la vase est tenace (rythme obligatoire)
    scenarioOndulations();      // ondulations avant la touche : aléatoires
    scenarioLancer();           // geste de lancer : armé, fouetté, orienté
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

// ---------------------------------------------------------------------------
// Tests de non-régression du jeu de pêche.
//
//   node games/peche_game/tests/run.mjs
//
// Aucune dépendance : Node seul (v18+). Le jeu n'est jamais modifié : le
// harnais fabrique un faux navigateur puis charge le vrai script.js.
// ---------------------------------------------------------------------------
import { installEnvironment, loadGame, cleanup, report, G } from './harness.mjs';

// Graine imposée avant CHAQUE scénario : le jeu consomme rand() à chaque image,
// donc l'état du générateur dépend du temps réel des scénarios précédents. Sans
// ce verrou, un test statistique peut passer un jour sur deux (mesuré : densité
// des substrats x1,2 au lieu de x1,3, biomasse 93,8 kg/ha au lieu de 100).
const GRAINE_TESTS = 20240101;
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
import scenarioJouer from './scenario-jouer.mjs';
import { run as scenarioComportement } from './scenario-comportement.mjs';
import scenarioPetitEcran from './scenario-petit-ecran.mjs';
import scenarioMessages from './scenario-messages.mjs';
import scenarioCarnassier from './scenario-carnassier.mjs';
import scenarioFin from './scenario-fin.mjs';
import scenarioDemelage from './scenario-demelage.mjs';
import scenarioQuiver from './scenario-quiver.mjs';
import { run as scenarioRemontee } from './scenario-remontee.mjs';
import { run as scenarioVitesse } from './scenario-vitesse.mjs';
import scenarioBateau from './scenario-bateau.mjs';
import scenarioPortraits from './scenario-portraits.mjs';
import scenarioModules from './scenario-modules.mjs';
import scenarioCheat from './scenario-cheat.mjs';
import { run as scenarioSonar } from './scenario-sonar.mjs';
import scenarioGrandEtang from './scenario-grand-etang.mjs';
import { run as scenarioObstacles } from './scenario-obstacles.mjs';
import { run as scenarioFond } from './scenario-fond.mjs';
import { run as scenarioDandine } from './scenario-dandine.mjs';
import { run as scenarioSubstrats } from './scenario-substrats.mjs';
import { run as scenarioEsches } from './scenario-esches.mjs';

console.log('Tests de non-régression — L\'étang du Bois Neuf (games/peche_game)');

let crashed = null;
try {
    scenarioStatic();          // fichiers, cohérence HTML <-> JS (pas de code exécuté)
    installEnvironment();
    await loadGame();
    G().setGraine(GRAINE_TESTS);
    scenarioSound();           // sound.js avec un faux AudioContext
    G().setGraine(GRAINE_TESTS);
    scenarioGameplay();        // lancer, bouchon, moulinet, remontée, nénuphars, vent
    G().setGraine(GRAINE_TESTS);
    scenarioFeed();            // amorçage : boule de nourriture, jauge, attraction
    G().setGraine(GRAINE_TESTS);
    scenarioBoutique();        // expérience (XP) et boutique de bouchons
    G().setGraine(GRAINE_TESTS);
    scenarioRythme();          // rythme des touches : patience et bouchon calme
    G().setGraine(GRAINE_TESTS);
    scenarioTouches();         // catalogue des touches (mouvements du bouchon)
    G().setGraine(GRAINE_TESTS);
    scenarioRendu();           // rendu : tampon de profondeur et « voile blanc »
    G().setGraine(GRAINE_TESTS);
    scenarioCarnet();          // carnet : onglets, carte de l’étang, zones des poissons
    G().setGraine(GRAINE_TESTS);
    scenarioProfondeur();      // profondeur de la ligne, relief, vase, amorçage
    G().setGraine(GRAINE_TESTS);
    scenarioStyles();          // un style de touches et de combat par espèce
    G().setGraine(GRAINE_TESTS);
    scenarioLignes();          // lignes (vies), casse, fin de partie, classement
    G().setGraine(GRAINE_TESTS);
    scenarioRagondin();        // ragondin voleur : 3 clics, vol, rareté
    G().setGraine(GRAINE_TESTS);
    scenarioPostes();          // emplacements : les 4 bords de l'étang
    G().setGraine(GRAINE_TESTS);
    scenarioSoleil();           // soleil fixe au sud-ouest + lumière par poste
    G().setGraine(GRAINE_TESTS);
    scenarioEtang();            // étang généré : contour, eau, fond, rive, carte
    G().setGraine(GRAINE_TESTS);
    scenarioPlacement();        // choix libre sur la carte vue de dessus
    G().setGraine(GRAINE_TESTS);
    scenarioVase();             // la vase est tenace (rythme obligatoire)
    G().setGraine(GRAINE_TESTS);
    scenarioOndulations();      // ondulations avant la touche : aléatoires
    G().setGraine(GRAINE_TESTS);
    scenarioLancer();           // geste de lancer : armé, fouetté, orienté
    G().setGraine(GRAINE_TESTS);
    scenarioJouer();            // JOUER = partie neuve (score, bourriche, lignes)
    G().setGraine(GRAINE_TESTS);
    scenarioPetitEcran();       // petit écran : dock repliable + FOV
    G().setGraine(GRAINE_TESTS);
    scenarioMessages();         // messages de touche : « Ça bouge » interdit
    G().setGraine(GRAINE_TESTS);
    scenarioCarnassier();       // attaque de carnassier pendant la remontée
    G().setGraine(GRAINE_TESTS);
    scenarioFin();              // fin volontaire, accueil modal, XP de partie, rares
    G().setGraine(GRAINE_TESTS);
    scenarioDemelage();         // ligne tendue, emmêlement et mini-jeu de démêlage
    G().setGraine(GRAINE_TESTS);
    scenarioQuiver();           // bouchon / quiver : scion, canne inclinée, ferrage
    G().setGraine(GRAINE_TESTS);
    scenarioComportement();     // poissons réalistes, quiver au fond, accueil épuré
    G().setGraine(GRAINE_TESTS);
    scenarioRemontee();         // la manivelle seule ramène la ligne (plus de clic)
    G().setGraine(GRAINE_TESTS);
    scenarioVitesse();          // remontée trop rapide : poids du poisson + fil
    G().setGraine(GRAINE_TESTS);
    scenarioBateau();           // mode bateau : barque achetable, ramer, pêche à bord
    G().setGraine(GRAINE_TESTS);
    scenarioPortraits();        // panneau de combat court + portraits d'espèces
    G().setGraine(GRAINE_TESTS);
    scenarioModules();          // contrat des modules (découpage, plafonds, cycles)
    G().setGraine(GRAINE_TESTS);
    scenarioSonar();            // sonar : ping de sous-marin + ondes jaunes
    G().setGraine(GRAINE_TESTS);
    scenarioGrandEtang();       // grand étang (v173) : rayon 90, fosses en barque, ≈ 58 poissons
    G().setGraine(GRAINE_TESTS);
    scenarioObstacles();        // obstacles aquatiques (v174) : placement, accrochage, attraction, collision
    G().setGraine(GRAINE_TESTS);
    scenarioFond();             // fond sous le bouchon (v180) : un seul verdict, dérive comprise
    G().setGraine(GRAINE_TESTS);
    scenarioDandine();          // petit coup de moulinet (v181) : remous, rayon 3, décroissance, plafond
    G().setGraine(GRAINE_TESTS);
    scenarioSubstrats();        // types de fond (v183) : répartition, habitat, risques, carte, widget
    G().setGraine(GRAINE_TESTS);
    scenarioEsches();           // esches (v184) : profils, touches, stock, persistance, boutique
    G().setGraine(GRAINE_TESTS);
    scenarioCheat();            // cheat « poisson » : mot secret = +50 XP
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

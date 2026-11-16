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
import { run as scenarioRadar } from './scenario-radar.mjs';
import { run as scenarioSonar } from './scenario-sonar.mjs';
import scenarioGrandEtang from './scenario-grand-etang.mjs';
import { run as scenarioObstacles } from './scenario-obstacles.mjs';
import { run as scenarioFond } from './scenario-fond.mjs';
import { run as scenarioDandine } from './scenario-dandine.mjs';
import { run as scenarioSubstrats } from './scenario-substrats.mjs';
import { run as scenarioEsches } from './scenario-esches.mjs';
import { run as scenarioPerteEsche } from './scenario-perte-esche.mjs';
import { run as scenarioTourneAutour } from './scenario-tourne-autour.mjs';
import { run as scenarioVegetation } from './scenario-vegetation.mjs';
import { run as scenarioMatriceTouche } from './scenario-matrice-touche.mjs';
import { run as scenarioAvion } from './scenario-avion.mjs';
import { run as scenarioMenus } from './scenario-menus.mjs';
import { run as scenarioPhysique } from './scenario-physique.mjs';
import { run as scenarioPhysiqueEau } from './scenario-physique-eau.mjs';
import { run as scenarioModeles } from './scenario-modeles.mjs';
import { run as scenarioApercu } from './scenario-apercu.mjs';
import { run as scenarioFacile } from './scenario-facile.mjs';
import { run as scenarioCombatMode } from './scenario-combat-mode.mjs';

// Avant chaque scénario : graine imposée (voir ci-dessus) ET conditions de pêche neutres.
// Le délai de touche dépend de l'heure et de la pression (physique.js, §15.1) ; les scénarios
// historiques supposent un facteur ×1 : on le pose explicitement (midi, 1013 hPa stable)
// au lieu de laisser l'heure et la météo dériver d'un scénario à l'autre. Même chose pour l'eau :
// 15 °C = ni léthargie, ni chaleur, ni thermocline (l'eau est brassée) : facteur ×1, poissons à leur couche.
function debutScenario() {
    G().setGraine(GRAINE_TESTS);
    G().setHeure(12);
    G().setPression(1013, 0);
    G().setTemperatureEau(15);
}

console.log('Tests de non-régression — L\'étang du Bois Neuf (games/peche_game)');

let crashed = null;
try {
    scenarioStatic();          // fichiers, cohérence HTML <-> JS (pas de code exécuté)
    installEnvironment();
    await loadGame();
    debutScenario();
    scenarioSound();           // sound.js avec un faux AudioContext
    debutScenario();
    scenarioGameplay();        // lancer, bouchon, moulinet, remontée, nénuphars, vent
    debutScenario();
    scenarioFeed();            // amorçage : boule de nourriture, jauge, attraction
    debutScenario();
    scenarioBoutique();        // expérience (XP) et boutique de bouchons
    debutScenario();
    scenarioRythme();          // rythme des touches : patience et bouchon calme
    debutScenario();
    scenarioTouches();         // catalogue des touches (mouvements du bouchon)
    debutScenario();
    scenarioRendu();           // rendu : tampon de profondeur et « voile blanc »
    debutScenario();
    scenarioCarnet();          // carnet : onglets, carte de l’étang, zones des poissons
    debutScenario();
    scenarioProfondeur();      // profondeur de la ligne, relief, vase, amorçage
    debutScenario();
    scenarioStyles();          // un style de touches et de combat par espèce
    debutScenario();
    scenarioLignes();          // lignes (vies), casse, fin de partie, classement
    debutScenario();
    scenarioRagondin();        // ragondin voleur : 3 clics, vol, rareté
    debutScenario();
    scenarioPostes();          // emplacements : les 4 bords de l'étang
    debutScenario();
    scenarioSoleil();           // soleil fixe au sud-ouest + lumière par poste
    debutScenario();
    scenarioEtang();            // étang généré : contour, eau, fond, rive, carte
    debutScenario();
    scenarioPlacement();        // choix libre sur la carte vue de dessus
    debutScenario();
    scenarioVase();             // la vase est tenace (rythme obligatoire)
    debutScenario();
    scenarioOndulations();      // ondulations avant la touche : aléatoires
    debutScenario();
    scenarioLancer();           // geste de lancer : armé, fouetté, orienté
    debutScenario();
    scenarioJouer();            // JOUER = partie neuve (score, bourriche, lignes)
    debutScenario();
    scenarioPetitEcran();       // petit écran : dock repliable + FOV
    debutScenario();
    scenarioMessages();         // messages de touche : « Ça bouge » interdit
    debutScenario();
    scenarioCarnassier();       // attaque de carnassier pendant la remontée
    debutScenario();
    scenarioFin();              // fin volontaire, accueil modal, XP de partie, rares
    debutScenario();
    scenarioDemelage();         // ligne tendue, emmêlement et mini-jeu de démêlage
    debutScenario();
    scenarioQuiver();           // bouchon / quiver : scion, canne inclinée, ferrage
    debutScenario();
    scenarioComportement();     // poissons réalistes, quiver au fond, accueil épuré
    debutScenario();
    scenarioRemontee();         // la manivelle seule ramène la ligne (plus de clic)
    debutScenario();
    scenarioFacile();           // mode Facile (enfant) : aimant à poissons + « FERRER ! »
    debutScenario();
    scenarioVitesse();          // remontée trop rapide : poids du poisson + fil
    debutScenario();
    scenarioBateau();           // mode bateau : barque achetable, ramer, pêche à bord
    debutScenario();
    scenarioPortraits();        // panneau de combat court + portraits d'espèces
    debutScenario();
    scenarioModules();          // contrat des modules (découpage, plafonds, cycles)
    debutScenario();
    scenarioSonar();            // sonar : ping de sous-marin + ondes jaunes
    debutScenario();
    scenarioGrandEtang();       // grand étang (v173) : rayon 90, fosses en barque, ≈ 58 poissons
    debutScenario();
    scenarioObstacles();        // obstacles aquatiques (v174) : placement, accrochage, attraction, collision
    debutScenario();
    scenarioFond();             // fond sous le bouchon (v180) : un seul verdict, dérive comprise
    debutScenario();
    scenarioDandine();          // petit coup de moulinet (v181) : remous, rayon 3, décroissance, plafond
    debutScenario();
    scenarioSubstrats();        // types de fond (v183) : répartition, habitat, risques, carte, widget
    debutScenario();
    scenarioEsches();           // esches (v184, illimitées v192) : profils, touches, persistance, boutique
    scenarioPerteEsche();       // esche volée sur un ferrage raté (facile / normal / dur)
    scenarioTourneAutour();     // plus de poissons qui tournent autour sans mordre (vif, vase, lassitude)
    await scenarioVegetation();     // roseaux et herbe ondulent au vent (vegetation.js)
    debutScenario();
    await scenarioMatriceTouche();  // matrice de la chance de touche (chanceTouche.js) + concordance avec le jeu
    debutScenario();
    await scenarioAvion();          // avion des conseils d'esche (avion.js, d'après la matrice)
    debutScenario();
    scenarioMenus();            // menus de la barre du haut (v192) : 🪱 Esche et 🎈 Matériel
    debutScenario();
    scenarioPhysique();         // physique de l'eau (v186) : heures actives, pression, facteur de touche
    debutScenario();
    scenarioPhysiqueEau();      // physique de l'eau (v189) : température, saisons, thermocline
    debutScenario();
    scenarioCheat();            // cheat « poisson » : mot secret = +50 XP
    debutScenario();
    await scenarioModeles();    // moteur de poisson 3D paramétrique (v197) : longueurs, budget, motifs, nage
    debutScenario();
    await scenarioApercu();     // aperçu 3D d'un poisson (v203) : cache, repli sans WebGL, branchements
    debutScenario();
    scenarioRadar();            // cheat « radar » (§17.3) : carte 2D des poissons
    debutScenario();
    scenarioCombatMode();       // §17.7 : combat identique en mode enfant, aides de détection gardées (en dernier : ses prises modifient le carnet)
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

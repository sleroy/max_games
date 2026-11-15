import * as THREE from 'three';
// Le « ?v=87 » est essentiel : sans lui, le navigateur peut resservir une
// VIEILLE copie de sound.js gardée en mémoire, et le jeu plante alors avec
// « sound.setRain is not a function ». On numérote donc AUSSI les modules
// importés (la version doit rester la même que celle de index.html).
import { SoundEngine } from './sound.js?v=156';
import { creerJeuDemelage } from './demelage.js?v=120';
import { creerModeQuiver } from './quiver.js?v=121';
import { SCIONS, SCIONS_DE_DEPART, SPECIES, COMPORTEMENTS, STYLES_COMBAT, STYLE_DEFAUT, FORMES, FORMES_PAR_TYPE, TOUCHES, TOUCHES_PAR_ID } from './especes.js?v=135';
import { creerClassement } from './classement.js';
import { dessinerPortrait } from './portraits.js?v=140';
import { creerPoissons } from './poissons.js?v=143';
import { POND_CENTER, POND_RADIUS, RIVE_Y, RAYON_ETANG_MAX, rayonEtang,
    FOND_BORD, FOND_CENTRE, FOSSES, profondeurLocale, fondY,
    ajouterFond } from './environnement.js?v=142';
import { creerDecor } from './decor.js?v=141';
import { chargerCarnet, sauverCarnet } from './carnet.js?v=135';
import { creerBourriche } from './bourriche.js?v=144';
import { creerOndulations } from './ondulations.js?v=144';
import { creerMessages } from './messages.js?v=144';
import { creerSplashes } from './splashes.js?v=144';
import { creerCombat } from './combat.js?v=145';
import { creerComportement } from './comportement.js?v=146';
import { creerBateau } from './bateau.js?v=147';
import { creerLancerPoisson } from './lancerPoisson.js?v=148';
import { creerCarnetUI } from './carnetUI.js?v=149';
import { creerBoutique } from './boutique.js?v=150';
import { creerFiches } from './fiches.js?v=151';
import { creerLancerCanne } from './lancerCanne.js?v=152';
import { creerAmorcage } from './amorcage.js?v=153';
import { creerFrein } from './frein.js?v=154';
import { creerLigne } from './ligne.js?v=155';
import { creerBouchons } from './bouchons.js?v=156';
import { etat } from './etat.js?v=145';

// ---------------------------------------------------------------------------
// ÉTAT PARTAGÉ (voir etat.js) : accesseurs vers les variables `let` de ce
// fichier. Une ligne par variable ; aucune valeur n'est dupliquée : les
// modules extraits lisent et écrivent la vraie variable de ce fichier.
// Placé avant la création des modules : ils écrivent dans `etat` dès leur création.
// ---------------------------------------------------------------------------
function lienEtat(nom, lire, ecrire) {
    Object.defineProperty(etat, nom, { get: lire, set: ecrire, enumerable: true });
}
lienEtat('BATEAU_PAS_ANGLE', function () { return BATEAU_PAS_ANGLE; }, function (v) { BATEAU_PAS_ANGLE = v; });
lienEtat('BATEAU_PAS_MARGE', function () { return BATEAU_PAS_MARGE; }, function (v) { BATEAU_PAS_MARGE = v; });
lienEtat('BITE_WINDOW', function () { return BITE_WINDOW; }, function (v) { BITE_WINDOW = v; });
lienEtat('BOUCHONS_DE_DEPART', function () { return BOUCHONS_DE_DEPART; }, function (v) { BOUCHONS_DE_DEPART = v; });
lienEtat('CAST_DURATION', function () { return CAST_DURATION; }, function (v) { CAST_DURATION = v; });
lienEtat('CHUM_ATTRACT_ACCEL', function () { return CHUM_ATTRACT_ACCEL; }, function (v) { CHUM_ATTRACT_ACCEL = v; });
lienEtat('DIFFICULTY', function () { return DIFFICULTY; }, function (v) { DIFFICULTY = v; });
lienEtat('FEED_MAX_RANGE', function () { return FEED_MAX_RANGE; }, function (v) { FEED_MAX_RANGE = v; });
lienEtat('FEED_MIN_RANGE', function () { return FEED_MIN_RANGE; }, function (v) { FEED_MIN_RANGE = v; });
lienEtat('FLOTTEURS', function () { return FLOTTEURS; }, function (v) { FLOTTEURS = v; });
lienEtat('FLOTTEUR_ECHELLE', function () { return FLOTTEUR_ECHELLE; }, function (v) { FLOTTEUR_ECHELLE = v; });
lienEtat('HOOK_DEPTH', function () { return HOOK_DEPTH; }, function (v) { HOOK_DEPTH = v; });
lienEtat('LINE_SEGMENTS', function () { return LINE_SEGMENTS; }, function (v) { LINE_SEGMENTS = v; });
lienEtat('TUTORIAL_STEPS', function () { return TUTORIAL_STEPS; }, function (v) { TUTORIAL_STEPS = v; });
lienEtat('VITESSE_MANIVELLE_MAX', function () { return VITESSE_MANIVELLE_MAX; }, function (v) { VITESSE_MANIVELLE_MAX = v; });
lienEtat('ZONES_CARTE', function () { return ZONES_CARTE; }, function (v) { ZONES_CARTE = v; });
lienEtat('amorceDepartRestante', function () { return amorceDepartRestante; }, function (v) { amorceDepartRestante = v; });
lienEtat('anglerYawBase', function () { return anglerYawBase; }, function (v) { anglerYawBase = v; });
lienEtat('annoncerRecord', function () { return annoncerRecord; }, function (v) { annoncerRecord = v; });
lienEtat('avantageFerrage', function () { return avantageFerrage; }, function (v) { avantageFerrage = v; });
lienEtat('baitInterest', function () { return baitInterest; }, function (v) { baitInterest = v; });
lienEtat('bateauGroupe', function () { return bateauGroupe; }, function (v) { bateauGroupe = v; });
lienEtat('bateauRame', function () { return bateauRame; }, function (v) { bateauRame = v; });
lienEtat('biteCooldown', function () { return biteCooldown; }, function (v) { biteCooldown = v; });
lienEtat('biteFauxTouche', function () { return biteFauxTouche; }, function (v) { biteFauxTouche = v; });
lienEtat('biteFenetre', function () { return biteFenetre; }, function (v) { biteFenetre = v; });
lienEtat('biteFish', function () { return biteFish; }, function (v) { biteFish = v; });
lienEtat('bitePhase', function () { return bitePhase; }, function (v) { bitePhase = v; });
lienEtat('biteRetourRot', function () { return biteRetourRot; }, function (v) { biteRetourRot = v; });
lienEtat('biteRetourY', function () { return biteRetourY; }, function (v) { biteRetourY = v; });
lienEtat('biteSignalDuree', function () { return biteSignalDuree; }, function (v) { biteSignalDuree = v; });
lienEtat('biteSignalTimer', function () { return biteSignalTimer; }, function (v) { biteSignalTimer = v; });
lienEtat('biteSignauxRestants', function () { return biteSignauxRestants; }, function (v) { biteSignauxRestants = v; });
lienEtat('biteSinkAt', function () { return biteSinkAt; }, function (v) { biteSinkAt = v; });
lienEtat('biteStyle', function () { return biteStyle; }, function (v) { biteStyle = v; });
lienEtat('biteTouche', function () { return biteTouche; }, function (v) { biteTouche = v; });
lienEtat('biteViewActive', function () { return biteViewActive; }, function (v) { biteViewActive = v; });
lienEtat('biteViewHideTimer', function () { return biteViewHideTimer; }, function (v) { biteViewHideTimer = v; });
lienEtat('biteViewTimer', function () { return biteViewTimer; }, function (v) { biteViewTimer = v; });
lienEtat('bouchonPossede', function () { return bouchonPossede; }, function (v) { bouchonPossede = v; });
lienEtat('bourricheCount', function () { return bourricheCount; }, function (v) { bourricheCount = v; });
lienEtat('boutonPosteActif', function () { return boutonPosteActif; }, function (v) { boutonPosteActif = v; });
lienEtat('cameraMode', function () { return cameraMode; }, function (v) { cameraMode = v; });
lienEtat('cameraViewActive', function () { return cameraViewActive; }, function (v) { cameraViewActive = v; });
lienEtat('cancelCast', function () { return cancelCast; }, function (v) { cancelCast = v; });
lienEtat('castAim', function () { return castAim; }, function (v) { castAim = v; });
lienEtat('castPhase', function () { return castPhase; }, function (v) { castPhase = v; });
lienEtat('castPower', function () { return castPower; }, function (v) { castPower = v; });
lienEtat('castState', function () { return castState; }, function (v) { castState = v; });
lienEtat('castSwing', function () { return castSwing; }, function (v) { castSwing = v; });
lienEtat('castSwingDepart', function () { return castSwingDepart; }, function (v) { castSwingDepart = v; });
lienEtat('castT', function () { return castT; }, function (v) { castT = v; });
lienEtat('castTarget', function () { return castTarget; }, function (v) { castTarget = v; });
lienEtat('castTargetPower', function () { return castTargetPower; }, function (v) { castTargetPower = v; });
lienEtat('castYawAngler', function () { return castYawAngler; }, function (v) { castYawAngler = v; });
lienEtat('castYawRod', function () { return castYawRod; }, function (v) { castYawRod = v; });
lienEtat('catchMessageTimer', function () { return catchMessageTimer; }, function (v) { catchMessageTimer = v; });
lienEtat('caughtWeight', function () { return caughtWeight; }, function (v) { caughtWeight = v; });
lienEtat('chum', function () { return chum; }, function (v) { chum = v; });
lienEtat('dayPhase', function () { return dayPhase; }, function (v) { dayPhase = v; });
lienEtat('depthRange', function () { return depthRange; }, function (v) { depthRange = v; });
lienEtat('depuisLancement', function () { return depuisLancement; }, function (v) { depuisLancement = v; });
lienEtat('dragLoosened', function () { return dragLoosened; }, function (v) { dragLoosened = v; });
lienEtat('elapsed', function () { return elapsed; }, function (v) { elapsed = v; });
lienEtat('emplacementAngle', function () { return emplacementAngle; }, function (v) { emplacementAngle = v; });
lienEtat('emplacementLibre', function () { return emplacementLibre; }, function (v) { emplacementLibre = v; });
lienEtat('emplacementMarge', function () { return emplacementMarge; }, function (v) { emplacementMarge = v; });
lienEtat('escaped', function () { return escaped; }, function (v) { escaped = v; });
lienEtat('especeIndex', function () { return especeIndex; }, function (v) { especeIndex = v; });
lienEtat('experiencePartie', function () { return experiencePartie; }, function (v) { experiencePartie = v; });
lienEtat('feedAim', function () { return feedAim; }, function (v) { feedAim = v; });
lienEtat('feedBall', function () { return feedBall; }, function (v) { feedBall = v; });
lienEtat('feedFlyT', function () { return feedFlyT; }, function (v) { feedFlyT = v; });
lienEtat('feedLanding', function () { return feedLanding; }, function (v) { feedLanding = v; });
lienEtat('feedMode', function () { return feedMode; }, function (v) { feedMode = v; });
lienEtat('feedPower', function () { return feedPower; }, function (v) { feedPower = v; });
lienEtat('feedState', function () { return feedState; }, function (v) { feedState = v; });
lienEtat('feedTargetPower', function () { return feedTargetPower; }, function (v) { feedTargetPower = v; });
lienEtat('fightAdvantage', function () { return fightAdvantage; }, function (v) { fightAdvantage = v; });
lienEtat('fishCaught', function () { return fishCaught; }, function (v) { fishCaught = v; });
lienEtat('fishThrowPhase', function () { return fishThrowPhase; }, function (v) { fishThrowPhase = v; });
lienEtat('fishThrowPower', function () { return fishThrowPower; }, function (v) { fishThrowPower = v; });
lienEtat('fishThrowState', function () { return fishThrowState; }, function (v) { fishThrowState = v; });
lienEtat('fishThrowT', function () { return fishThrowT; }, function (v) { fishThrowT = v; });
lienEtat('fishThrowTarget', function () { return fishThrowTarget; }, function (v) { fishThrowTarget = v; });
lienEtat('fishes', function () { return fishes; }, function (v) { fishes = v; });
lienEtat('floatBody', function () { return floatBody; }, function (v) { floatBody = v; });
lienEtat('floatGroup', function () { return floatGroup; }, function (v) { floatGroup = v; });
lienEtat('floatState', function () { return floatState; }, function (v) { floatState = v; });
lienEtat('floatStick', function () { return floatStick; }, function (v) { floatStick = v; });
lienEtat('flotteurChoix', function () { return flotteurChoix; }, function (v) { flotteurChoix = v; });
lienEtat('hameconDansLaVase', function () { return hameconDansLaVase; }, function (v) { hameconDansLaVase = v; });
lienEtat('heldFish', function () { return heldFish; }, function (v) { heldFish = v; });
lienEtat('hookedFish', function () { return hookedFish; }, function (v) { hookedFish = v; });
lienEtat('jeuDemelage', function () { return jeuDemelage; }, function (v) { jeuDemelage = v; });
lienEtat('journal', function () { return journal; }, function (v) { journal = v; });
lienEtat('ligneTendue', function () { return ligneTendue; }, function (v) { ligneTendue = v; });
lienEtat('lineBrokenTimer', function () { return lineBrokenTimer; }, function (v) { lineBrokenTimer = v; });
lienEtat('lineGeometry', function () { return lineGeometry; }, function (v) { lineGeometry = v; });
lienEtat('linePositions', function () { return linePositions; }, function (v) { linePositions = v; });
lienEtat('modeBateau', function () { return modeBateau; }, function (v) { modeBateau = v; });
lienEtat('modeQuiver', function () { return modeQuiver; }, function (v) { modeQuiver = v; });
lienEtat('nibbleAmplitude', function () { return nibbleAmplitude; }, function (v) { nibbleAmplitude = v; });
lienEtat('nibbleDebut', function () { return nibbleDebut; }, function (v) { nibbleDebut = v; });
lienEtat('nibbleDuree', function () { return nibbleDuree; }, function (v) { nibbleDuree = v; });
lienEtat('nibbleInteretAvant', function () { return nibbleInteretAvant; }, function (v) { nibbleInteretAvant = v; });
lienEtat('nibblePhase', function () { return nibblePhase; }, function (v) { nibblePhase = v; });
lienEtat('nibbleRngState', function () { return nibbleRngState; }, function (v) { nibbleRngState = v; });
lienEtat('nibbleSuivant', function () { return nibbleSuivant; }, function (v) { nibbleSuivant = v; });
lienEtat('partieTerminee', function () { return partieTerminee; }, function (v) { partieTerminee = v; });
lienEtat('paused', function () { return paused; }, function (v) { paused = v; });
lienEtat('poidsRealisteKilos', function () { return poidsRealisteKilos; }, function (v) { poidsRealisteKilos = v; });
lienEtat('portraitEspeceCourante', function () { return portraitEspeceCourante; }, function (v) { portraitEspeceCourante = v; });
lienEtat('posteActuel', function () { return posteActuel; }, function (v) { posteActuel = v; });
lienEtat('profondeurLigne', function () { return profondeurLigne; }, function (v) { profondeurLigne = v; });
lienEtat('recordBattu', function () { return recordBattu; }, function (v) { recordBattu = v; });
lienEtat('reelIdle', function () { return reelIdle; }, function (v) { reelIdle = v; });
lienEtat('renderBoutique', function () { return renderBoutique; }, function (v) { renderBoutique = v; });
lienEtat('rodBend', function () { return rodBend; }, function (v) { rodBend = v; });
lienEtat('rodYawBase', function () { return rodYawBase; }, function (v) { rodYawBase = v; });
lienEtat('scionChoix', function () { return scionChoix; }, function (v) { scionChoix = v; });
lienEtat('score', function () { return score; }, function (v) { score = v; });
lienEtat('shake', function () { return shake; }, function (v) { shake = v; });
lienEtat('showCatchMessage', function () { return showCatchMessage; }, function (v) { showCatchMessage = v; });
lienEtat('signalerToucheRatee', function () { return signalerToucheRatee; }, function (v) { signalerToucheRatee = v; });
lienEtat('snag', function () { return snag; }, function (v) { snag = v; });
lienEtat('sonarBuoy', function () { return sonarBuoy; }, function (v) { sonarBuoy = v; });
lienEtat('spawnFish', function () { return spawnFish; }, function (v) { spawnFish = v; });
lienEtat('spawnFloatingText', function () { return spawnFloatingText; }, function (v) { spawnFloatingText = v; });
lienEtat('spawnRipple', function () { return spawnRipple; }, function (v) { spawnRipple = v; });
lienEtat('spawnSplash', function () { return spawnSplash; }, function (v) { spawnSplash = v; });
lienEtat('strikeQuality', function () { return strikeQuality; }, function (v) { strikeQuality = v; });
lienEtat('struggle', function () { return struggle; }, function (v) { struggle = v; });
lienEtat('struggleAnchor', function () { return struggleAnchor; }, function (v) { struggleAnchor = v; });
lienEtat('strugglePos', function () { return strugglePos; }, function (v) { strugglePos = v; });
lienEtat('struggleTimeLeft', function () { return struggleTimeLeft; }, function (v) { struggleTimeLeft = v; });
lienEtat('styleEspece', function () { return styleEspece; }, function (v) { styleEspece = v; });
lienEtat('tangleChance', function () { return tangleChance; }, function (v) { tangleChance = v; });
lienEtat('tangleChanceOverride', function () { return tangleChanceOverride; }, function (v) { tangleChanceOverride = v; });
lienEtat('techniqueCourante', function () { return techniqueCourante; }, function (v) { techniqueCourante = v; });
lienEtat('tension', function () { return tension; }, function (v) { tension = v; });
lienEtat('timeoutEscape', function () { return timeoutEscape; }, function (v) { timeoutEscape = v; });
lienEtat('tutorialStepIndex', function () { return tutorialStepIndex; }, function (v) { tutorialStepIndex = v; });
lienEtat('waitTimer', function () { return waitTimer; }, function (v) { waitTimer = v; });
lienEtat('weatherPluie', function () { return weatherPluie; }, function (v) { weatherPluie = v; });

const canvas = document.getElementById('gameCanvas');
const scoreDisplay = document.getElementById('score');
const fishButton = document.getElementById('fishButton');
const statusDisplay = document.getElementById('status');
const strugglePanel = document.getElementById('struggle');
const struggleMarker = document.getElementById('struggleMarker');
const struggleInfo = document.getElementById('struggleInfo');
const struggleHint = document.getElementById('struggleHint');
const struggleTimer = document.getElementById('struggleTimer');
const strugglePortrait = document.getElementById('strugglePortrait');
// Dernier portrait dessiné (id d'espèce) — exposé pour les tests.
let portraitEspeceCourante = null;
// Caché par défaut : il n'apparaît que pendant un combat (ou jamais, si
// l'élément manque, par exemple avec un index.html encore en cache).
if (strugglePortrait) { strugglePortrait.hidden = true; }
// Avantage (facteur) AU MOMENT du ferrage : le combat le fait évoluer ensuite,
// mais le test « carnassier » vérifie l'avantage initial du brochet.
let avantageFerrage = 1;
// Ferme le panneau de combat et remasque le portrait : il ne reste visible
// QUE pendant un vrai combat de poisson (jamais après, jamais en accrochage).
function fermerPanneauCombat() {
    strugglePanel.classList.remove('active');
    if (strugglePortrait) { strugglePortrait.hidden = true; }
    portraitEspeceCourante = null;
}
const catchMessage = document.getElementById('catchMessage');
const windFill = document.getElementById('windFill');
const windArrow = document.getElementById('windArrow');
const soundToggle = document.getElementById('soundToggle');
const lineSelect = document.getElementById('lineSelect');
const feedButton = document.getElementById('feedButton');
const depthPanel = document.getElementById('depthPanel');
const quickFeedButton = document.getElementById('quickFeedButton');
const quickFeedCount = document.getElementById('quickFeedCount');
const feedGauge = document.getElementById('feedGauge');
const feedGaugeFill = document.getElementById('feedGaugeFill');
const feedGaugeTarget = document.getElementById('feedGaugeTarget');
const journalButton = document.getElementById('journalButton');
const journalPanel = document.getElementById('journal');
const journalStats = document.getElementById('journalStats');
const journalList = document.getElementById('journalList');
const journalClose = document.getElementById('journalClose');
const difficultySelect = document.getElementById('difficultySelect');
const bigTextToggle = document.getElementById('bigTextToggle');
const calmToggle = document.getElementById('calmToggle');
const effectsToggle = document.getElementById('effectsToggle');
const bourricheLabel = document.getElementById('bourricheLabel');
const xpLabel = document.getElementById('xpLabel');
// XP de la partie, rappelée dans la barre du haut (le menu est souvent fermé).
const xpTop = document.getElementById('xpTop');
const depthLabel = document.getElementById('depthLabel');
const depthMinus = document.getElementById('depthMinus');
const depthPlus = document.getElementById('depthPlus');
const lignesLabel = document.getElementById('lignesLabel');
const gameOver = document.getElementById('gameOver');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverText = document.getElementById('gameOverText');
const playerName = document.getElementById('playerName');
const saveScore = document.getElementById('saveScore');
const saveAndMenu = document.getElementById('saveAndMenu');
const backToMenu = document.getElementById('backToMenu');
const restartGame = document.getElementById('restartGame');
const showRanking = document.getElementById('showRanking');
const rankingButton = document.getElementById('rankingButton');
const classement = document.getElementById('classement');
const rankingTabs = document.getElementById('rankingTabs');
const rankingList = document.getElementById('rankingList');
const closeRanking = document.getElementById('closeRanking');
const accueil = document.getElementById('accueil');
const playButton = document.getElementById('playButton');
const accueilClassement = document.getElementById('accueilClassement');
const endGameButton = document.getElementById('endGameButton');
const modalBackdrop = document.getElementById('modalBackdrop');
const tangleGame = document.getElementById('tangleGame');
const tangleCanvas = document.getElementById('tangleCanvas');
const tangleTimer = document.getElementById('tangleTimer');
const tangleProgress = document.getElementById('tangleProgress');
const tangleMessage = document.getElementById('tangleMessage');
const tangleGiveUp = document.getElementById('tangleGiveUp');
const ragondinAlert = document.getElementById('ragondinAlert');
const techniqueSelect = document.getElementById('techniqueSelect');
const quiverPanel = document.getElementById('quiverPanel');
const quiverCanvas = document.getElementById('quiverCanvas');
const compassDisplay = document.getElementById('compass');
const cartePlacement = document.getElementById('cartePlacement');
const cartePlacementAide = document.getElementById('cartePlacementAide');
const cartePlacementRepere = document.getElementById('cartePlacementRepere');
const shopXp = document.getElementById('shopXp');
const boutique = document.getElementById('boutique');
const ficheTouches = document.getElementById('ficheTouches');
const journalTabs = document.getElementById('journalTabs');
const pondMap = document.getElementById('pondMap');
const tabPages = {
    prises: document.getElementById('tabPrises'),
    especes: document.getElementById('tabEspeces'),
    boutique: document.getElementById('tabBoutique'),
    touches: document.getElementById('tabTouches'),
    options: document.getElementById('tabOptions')
};
const especePrev = document.getElementById('especePrev');
const especeNext = document.getElementById('especeNext');
const especePage = document.getElementById('especePage');
const especeFiche = document.getElementById('especeFiche');
const tabBtnEspeces = document.getElementById('tabBtnEspeces');
let especeIndex = 0;             // poisson affiché dans l'onglet « Espèces »
const toolDock = document.getElementById('toolDock');
const sonarButton = document.getElementById('sonarButton');
const sonarPanel = document.getElementById('sonarPanel');
const boatButton = document.getElementById('boatButton');
const boatPad = document.getElementById('boatPad');
const boatLeft = document.getElementById('boatLeft');
const boatRow = document.getElementById('boatRow');
const boatRight = document.getElementById('boatRight');
const sonarRadar = document.getElementById('sonarRadar');
const sonarCount = document.getElementById('sonarCount');
const cameraButton = document.getElementById('cameraButton');
const cameraControls = document.getElementById('cameraControls');
const toolToggle = document.getElementById('toolToggle');
const dragButton = document.getElementById('dragButton');
const journalEspeces = document.getElementById('journalEspeces');
const reflectionsToggle = document.getElementById('reflectionsToggle');
const tutorial = document.getElementById('tutorial');
const tutorialText = document.getElementById('tutorialText');
const tutorialHand = document.getElementById('tutorialHand');
const tutorialStepDisplay = document.getElementById('tutorialStep');
const tutorialNext = document.getElementById('tutorialNext');
const tutorialClose = document.getElementById('tutorialClose');
const tutorialOpen = document.getElementById('tutorialOpen');
const floatSelect = document.getElementById('floatSelect');
const scionSelect = document.getElementById('scionSelect');
const floatInfo = document.getElementById('floatInfo');

const sound = new SoundEngine();

// ---------------------------------------------------------------------------
// Aléatoire du jeu : notre propre générateur « seedé », pour que le monde soit
// reproductible indépendamment du nombre d'objets créés par three.js (chaque
// objet de three.js consomme de l'aléatoire pour son identifiant interne).
// ---------------------------------------------------------------------------
let rngState = 20240101 >>> 0;

function rand() {
    rngState = (rngState + 0x6d2b79f5) >>> 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function ensureSound() {
    sound.init();
    sound.resume();
}

soundToggle.addEventListener('click', () => {
    ensureSound();
    sound.enabled = !sound.enabled;
    sound.setEnabled(sound.enabled);
    soundToggle.textContent = sound.enabled ? '🔊 Son' : '🔇 Son coupé';
    soundToggle.setAttribute('aria-pressed', String(sound.enabled));
});

// Bouton plein écran (très pratique sur téléphone : masque la barre du navigateur).
const fullscreenButton = document.getElementById('fullscreenButton');

function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function toggleFullscreen() {
    const root = document.documentElement;
    if (!root) {
        return;
    }
    if (fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
            const result = exit.call(document);
            if (result && result.catch) {
                result.catch(() => {});
            }
        }
    } else {
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (request) {
            const result = request.call(root);
            if (result && result.catch) {
                result.catch(() => {});
            }
        }
    }
}

fullscreenButton.addEventListener('click', () => {
    ensureSound();
    toggleFullscreen();
    fermerOutils();
});

// Si le navigateur ne gère pas le plein écran, on masque le bouton.
if (document.documentElement
        && !document.documentElement.requestFullscreen
        && !document.documentElement.webkitRequestFullscreen) {
    fullscreenButton.style.display = 'none';
}

// Bouton pause : fige le jeu (très pratique pour un enfant).
const pauseButton = document.getElementById('pauseButton');

pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
    if (!paused) { fermerOutils(); }
});

// Manivelle : on la fait tourner pour ramener la ligne.
const crank = document.getElementById('crank');
const crankRotor = document.getElementById('crankRotor');
let crankDragging = false;
let crankAngle = 0;
let crankLastAngle = 0;
let crankRotationDelta = 0;
let crankSoundAccum = 0;
let crankLastMoveTime = 0;
let crankSpeedRad = 0;
let crankSpeedWindow = 0;
let crankSpeedStrikes = 0;

// ---------------------------------------------------------------------------
// Moulinet : conversion « tours de manivelle ↔ longueur de fil »
// ---------------------------------------------------------------------------
// Échelle du décor : ~2 unités du monde ≈ 1 m (le pêcheur mesure ~3,5 unités
// pour 1,8 m). Un moulinet réel ramène à peu près 1 m de fil par tour de
// manivelle : ici, un tour complet ramène donc REEL_PER_TURN unités de fil.
// Conséquence voulue : le nombre de tours nécessaires est proportionnel à la
// distance à ramener (un long lancer demande beaucoup plus de tours).
const REEL_PER_TURN = 2.0;
const TWO_PI = Math.PI * 2;
const CRANK_SOUND_PER_TURN = 0.5; // un « cliquet » sonore tous les demi-tours

// Le fil sorti correspond à la barre de tension : 0 = poisson au bord de la
// canne (barre à gauche), 1 = fil tendu au maximum, juste avant qu'il casse
// (barre à droite). Au ferrage, la longueur de fil vaut la distance du lancer.
const STRUGGLE_MIN_FACTOR = 0.4;
const STRUGGLE_MAX_FACTOR = 1.6;
const STRUGGLE_SPAN = STRUGGLE_MAX_FACTOR - STRUGGLE_MIN_FACTOR;

// ---------------------------------------------------------------------------
// Difficulté — réglable depuis le carnet (Facile / Normal / Dur).
// En augmentant la difficulté :
//   • le poisson tire plus fort et reprend plus de fil (épreuve de force) ;
//   • le temps de l'épreuve de force est plus court ;
//   • la fenêtre de ferrage (BITE_WINDOW) est plus courte.
// ---------------------------------------------------------------------------
const DIFFICULTY_MODES = {
    facile: { difficulty: 1.0, biteWindow: 0.85, tangleChance: 0 },
    normal: { difficulty: 1.3, biteWindow: 0.7, tangleChance: 0.08 },
    dur: { difficulty: 1.6, biteWindow: 0.55, tangleChance: 0.15 }
};
let DIFFICULTY = DIFFICULTY_MODES.normal.difficulty;
let tangleChance = DIFFICULTY_MODES.normal.tangleChance;
let tangleChanceOverride = null;

// Tours de manivelle effectués depuis le dernier appel (puis remis à zéro).
function consumeCrankTurns() {
    const turns = crankRotationDelta / TWO_PI;
    crankRotationDelta = 0;
    if (turns > 0) {
        crankSoundAccum += turns;
        while (crankSoundAccum >= CRANK_SOUND_PER_TURN) {
            crankSoundAccum -= CRANK_SOUND_PER_TURN;
            sound.reel();
        }
    }
    return turns;
}

function crankPointerAngle(event) {
    const rect = crank.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(event.clientY - cy, event.clientX - cx);
}

crank.addEventListener('pointerdown', event => {
    if (paused) { return; }
    ensureSound();
    crankDragging = true;
    crankLastAngle = crankPointerAngle(event);
    crank.setPointerCapture(event.pointerId);
});

crank.addEventListener('pointermove', event => {
    if (!crankDragging) {
        return;
    }
    const angle = crankPointerAngle(event);
    let delta = angle - crankLastAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    crankRotationDelta += Math.abs(delta);
    crankAngle += delta;
    crankLastAngle = angle;
    crankRotor.style.transform = 'rotate(' + crankAngle + 'rad)';
    // Remonter TROP VITE fatigue la ligne — mais on mesure une MOYENNE sur une
    // fenêtre de 0,6 s, et il faut DEUX fenêtres de suite trop rapides : un coup
    // de poignet ne suffit pas, il faut vraiment enchaîner les tours.
    const maintenant = performance.now();
    const ecart = Math.max(8, maintenant - crankLastMoveTime) / 1000;
    crankLastMoveTime = maintenant;
    crankSpeedRad += Math.abs(delta);
    crankSpeedWindow += ecart;
    if (crankSpeedWindow >= 0.6) {
        const toursParSeconde = (crankSpeedRad / TWO_PI) / crankSpeedWindow;
        const fenetre = crankSpeedWindow;
        const max = vitesseMaxTours();
        crankSpeedRad = 0;
        crankSpeedWindow = 0;
        if (toursParSeconde > max) {
            // PATINAGE : au-delà du maximum, le moulinet n'entraîne plus — les
            // tours en trop sont PERDUS (l'effort est gaspillé). La ligne ne
            // casse qu'en cas d'abus SOUTENU (voir avertirVitesse), sinon un
            // enfant qui « moule » la manivelle perdrait sa ligne sans comprendre.
            const excedent = (toursParSeconde - max) * fenetre * TWO_PI;
            crankRotationDelta = Math.max(0, crankRotationDelta - excedent);
            crankSpeedStrikes += 1;
            if (crankSpeedStrikes >= 2) {
                crankSpeedStrikes = 0;
                avertirVitesse();
            }
        } else {
            crankSpeedStrikes = 0;
        }
    }
});

crank.addEventListener('pointerup', () => {
    crankDragging = false;
});

crank.addEventListener('pointercancel', () => {
    crankDragging = false;
});

// ---------------------------------------------------------------------------
// Rendu / scène / caméra
// ---------------------------------------------------------------------------
// Sur téléphone : on limite la résolution et la taille des ombres (performance).
// Même critère que la CSS : pointeur « grossier » ou écran étroit.
const isMobileDevice = typeof window.matchMedia === 'function'
    && (window.matchMedia('(pointer: coarse)').matches
        || window.matchMedia('(max-width: 820px)').matches);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.5 : 2));
// Rendu plus « photo » : tone mapping ACES (comme une caméra). Les shaders
// maison (ciel, eau) incluent les chunks de tone mapping pour rester cohérents.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------------------------------------------------------------------------
// Post-traitement maison (aucune dépendance) : léger « bloom » + vignette.
// On rend la scène dans une cible, on isole les hautes lumières, on les floute
// puis on recompose à l'écran. Désactivé par défaut sur mobile (performance).
// ---------------------------------------------------------------------------
const post = { enabled: !isMobileDevice, strength: 0.22, vignette: 0.18 };
const postSupported = !!(renderer.capabilities && renderer.setRenderTarget
    && renderer.getRenderTarget && renderer.setSize);

const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
postQuad.frustumCulled = false;
postScene.add(postQuad);

let sceneTarget = null;
let brightTarget = null;
let blurTargetA = null;
let blurTargetB = null;

// Options des cibles de rendu.
// ⚠️ La cible de la SCÈNE doit GARDER un tampon de profondeur : sans lui, le tri
// des objets est perdu et l'eau (transparente), dessinée en dernier, passe
// PAR-DESSUS le pêcheur et la bourriche pourtant DEVANT elle. C'est exactement
// ce qui leur donnait cet aspect « sous un voile blanc ».
const SCENE_TARGET_OPTIONS = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false
};
// Les cibles du bloom sont de simples quads plein écran : pas besoin de profondeur.
const BLOOM_TARGET_OPTIONS = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false
};

function makePostTarget(w, h, options) {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h),
        options || BLOOM_TARGET_OPTIONS);
}

function resizePost(width, height) {
    if (!postSupported) {
        return;
    }
    const ratio = (renderer.getPixelRatio && renderer.getPixelRatio()) || 1;
    const fullW = Math.floor(width * ratio);
    const fullH = Math.floor(height * ratio);
    const halfW = Math.floor(fullW / 2);
    const halfH = Math.floor(fullH / 2);
    if (sceneTarget) sceneTarget.dispose();
    if (brightTarget) brightTarget.dispose();
    if (blurTargetA) blurTargetA.dispose();
    if (blurTargetB) blurTargetB.dispose();
    sceneTarget = makePostTarget(fullW, fullH, SCENE_TARGET_OPTIONS);
    brightTarget = makePostTarget(halfW, halfH);
    blurTargetA = makePostTarget(halfW, halfH);
    blurTargetB = makePostTarget(halfW, halfH);
}

const POST_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const brightMaterial = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.92 } },
    vertexShader: POST_VERTEX,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uThreshold;
        varying vec2 vUv;
        void main() {
            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            float k = max(0.0, l - uThreshold) / max(0.0001, 1.0 - uThreshold);
            gl_FragColor = vec4(c * k, 1.0);
        }`
});
brightMaterial.toneMapped = false;

const blurMaterial = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } },
    vertexShader: POST_VERTEX,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uDir;
        varying vec2 vUv;
        void main() {
            vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.24;
            sum += texture2D(tDiffuse, vUv - uDir).rgb * 0.20;
            sum += texture2D(tDiffuse, vUv + uDir).rgb * 0.20;
            sum += texture2D(tDiffuse, vUv - uDir * 2.0).rgb * 0.12;
            sum += texture2D(tDiffuse, vUv + uDir * 2.0).rgb * 0.12;
            sum += texture2D(tDiffuse, vUv - uDir * 3.0).rgb * 0.06;
            sum += texture2D(tDiffuse, vUv + uDir * 3.0).rgb * 0.06;
            gl_FragColor = vec4(sum, 1.0);
        }`
});
blurMaterial.toneMapped = false;

const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        uBloom: { value: post.strength },
        uVignette: { value: post.vignette }
    },
    vertexShader: POST_VERTEX,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tBloom;
        uniform float uBloom;
        uniform float uVignette;
        varying vec2 vUv;
        void main() {
            vec3 col = texture2D(tDiffuse, vUv).rgb;
            col += texture2D(tBloom, vUv).rgb * uBloom;
            // Vignette douce pour attirer l'œil au centre.
            float v = smoothstep(0.9, 0.35, length(vUv - 0.5));
            col *= mix(1.0 - uVignette, 1.0, v);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
        }`
});
// Le tone mapping est déjà appliqué dans la cible : on ne le refait pas.
compositeMaterial.toneMapped = false;

function renderWithPost() {
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);

    postQuad.material = brightMaterial;
    brightMaterial.uniforms.tDiffuse.value = sceneTarget.texture;
    renderer.setRenderTarget(brightTarget);
    renderer.render(postScene, postCamera);

    postQuad.material = blurMaterial;
    blurMaterial.uniforms.tDiffuse.value = brightTarget.texture;
    blurMaterial.uniforms.uDir.value.set(1 / blurTargetA.width, 0);
    renderer.setRenderTarget(blurTargetA);
    renderer.render(postScene, postCamera);

    blurMaterial.uniforms.tDiffuse.value = blurTargetA.texture;
    blurMaterial.uniforms.uDir.value.set(0, 1 / blurTargetB.height);
    renderer.setRenderTarget(blurTargetB);
    renderer.render(postScene, postCamera);

    postQuad.material = compositeMaterial;
    compositeMaterial.uniforms.tDiffuse.value = sceneTarget.texture;
    compositeMaterial.uniforms.tBloom.value = blurTargetB.texture;
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ea);
scene.fog = new THREE.Fog(0x9fd3ea, 90, 260);

// Ciel dégradé
const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        topColor: { value: new THREE.Color(0x4a9fd8) },
        bottomColor: { value: new THREE.Color(0xe6f6fd) },
        offset: { value: 30 },
        exponent: { value: 0.7 }
    },
    vertexShader: 'varying vec3 vWorldPosition; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 600);
// Sur un écran étroit, le FOV horizontal devient trop petit : la bourriche et
// la girouette (à ±12 unités) sortent du cadre. On garantit un FOV horizontal
// minimum en élargissant le FOV vertical (borné pour éviter la déformation).
const H_FOV_MIN = 76 * Math.PI / 180;

function fovPourAspect(aspect) {
    const a = Math.max(0.2, aspect || 1);
    const vertical = 2 * Math.atan(Math.tan(H_FOV_MIN / 2) / a) * 180 / Math.PI;
    return Math.min(85, Math.max(50, vertical));
}

const NORMAL_CAM_POS = new THREE.Vector3(0, 8, 34);
const NORMAL_CAM_TARGET = new THREE.Vector3(0, 0, -15);
const cameraTarget = NORMAL_CAM_TARGET.clone();
// Vue RÉALISTE unique : plus aucun zoom sur le bouchon (le joueur le surveille
// de loin). On garde la variable pour l'API de test.
let cameraMode = 'normal';
camera.position.copy(NORMAL_CAM_POS);
camera.lookAt(cameraTarget);

const cameraAxis = new THREE.Vector3(0, 1, 0);
const adjustedCameraPosition = new THREE.Vector3();
const cameraTouches = new Map();
let cameraViewActive = false;
let cameraAngle = 0;
let cameraDistance = 1;
let previousCameraGesture = null;

function adjustCamera(angle, distanceFactor) {
    cameraAngle = THREE.MathUtils.clamp(cameraAngle + angle, -Math.PI / 4, Math.PI / 4);
    cameraDistance = THREE.MathUtils.clamp(cameraDistance * distanceFactor, 0.72, 1.25);
}

function resetCameraView() {
    cameraAngle = 0;
    cameraDistance = 1;
}

function setCameraView(active) {
    cameraViewActive = active;
    cameraControls.hidden = !active;
    toolToggle.hidden = active;
    cameraTouches.clear();
    previousCameraGesture = null;
    if (active) {
        fermerOutils();
        document.getElementById('cameraDone').focus?.();
    }
}

cameraButton.addEventListener('click', () => setCameraView(true));
document.getElementById('cameraLeft').addEventListener('click', () => adjustCamera(-Math.PI / 12, 1));
document.getElementById('cameraRight').addEventListener('click', () => adjustCamera(Math.PI / 12, 1));
document.getElementById('cameraCloser').addEventListener('click', () => adjustCamera(0, 0.88));
document.getElementById('cameraFarther').addEventListener('click', () => adjustCamera(0, 1.14));
document.getElementById('cameraReset').addEventListener('click', resetCameraView);
document.getElementById('cameraDone').addEventListener('click', () => {
    setCameraView(false);
    toolToggle.focus?.();
});

function updateCameraGesture() {
    if (cameraTouches.size !== 2) {
        previousCameraGesture = null;
        return;
    }
    const [a, b] = cameraTouches.values();
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
        previousCameraGesture = null;
        return;
    }
    const angle = Math.atan2(dy, dx);
    if (previousCameraGesture) {
        const delta = angle - previousCameraGesture.angle;
        adjustCamera(Math.atan2(Math.sin(delta), Math.cos(delta)), previousCameraGesture.distance / distance);
    }
    previousCameraGesture = { angle, distance };
}

function updateCameraPosition(dt) {
    adjustedCameraPosition.copy(NORMAL_CAM_POS).sub(NORMAL_CAM_TARGET)
        .multiplyScalar(cameraDistance).applyAxisAngle(cameraAxis, cameraAngle).add(NORMAL_CAM_TARGET);
    camera.position.lerp(adjustedCameraPosition, 1 - Math.pow(0.0001, dt));
}

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = fovPourAspect(camera.aspect);
    camera.updateProjectionMatrix();
    resizePost(w, h);
}
window.addEventListener('resize', resize);
// Le navigateur mobile met parfois un instant à recalculer la taille : on insiste.
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
}
// iOS : le viewport ne suffit pas toujours à empêcher le zoom par pincement.
document.addEventListener('gesturestart', event => event.preventDefault());
resize();

// ---------------------------------------------------------------------------
// SOLEIL : orientation FIXE du monde (idee 2 de idees.md).
// L'azimut se lit comme sur une boussole : 0° = nord, 90° = est, 180° = sud,
// 270° = ouest. Le nord correspond à l'axe -z (le haut de l'écran au poste sud).
// 225° = sud-ouest, exactement ce qu'annonce la boussole du HUD.
// ---------------------------------------------------------------------------
const SUN_AZIMUT = 225;
const NOMS_AZIMUT = {
    0: 'nord', 45: 'nord-est', 90: 'est', 135: 'sud-est',
    180: 'sud', 225: 'sud-ouest', 270: 'ouest', 315: 'nord-ouest'
};

function azimutTexte(valeur) {
    const normalise = ((valeur % 360) + 360) % 360;
    return NOMS_AZIMUT[normalise] || (normalise + '°');
}

// Direction HORIZONTALE (x, z) vers le soleil pour un azimut donné.
function directionAzimut(azimut) {
    const a = (azimut * Math.PI) / 180;
    return { x: Math.sin(a), z: -Math.cos(a) };
}

// Direction 3D de référence (élévation de « midi ») : sert d'état initial au
// reflet solaire de l'eau, avant la première image.
function directionSoleil3D(cible) {
    const a = (SUN_AZIMUT * Math.PI) / 180;
    const elevation = (42 * Math.PI) / 180;
    return cible.set(
        Math.sin(a) * Math.cos(elevation),
        Math.sin(elevation),
        -Math.cos(a) * Math.cos(elevation)
    );
}

const SUN_DIRECTION = directionAzimut(SUN_AZIMUT);

// ---------------------------------------------------------------------------
// Lumières
// ---------------------------------------------------------------------------
// Lumière ambiante douce + lumière « ciel/sol » : les volumes sont plus naturels.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const skyLight = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a3f, 0.5);
scene.add(skyLight);

const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.15);
sunLight.position.set(SUN_DIRECTION.x * 70, 73, SUN_DIRECTION.z * 70);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(isMobileDevice ? 512 : 1024, isMobileDevice ? 512 : 1024);
// L'étang généré peut atteindre ~63 unités de rayon : la carte d'ombre doit
// couvrir tout le lac et la berge, sinon les arbres du fond perdent leur ombre.
sunLight.shadow.camera.left = -90;
sunLight.shadow.camera.right = 90;
sunLight.shadow.camera.top = 90;
sunLight.shadow.camera.bottom = -90;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 260;
// Ombres plus propres (moins d'« acné » sur le sable et l'eau).
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.03;
scene.add(sunLight);

const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
);
sunMesh.position.copy(sunLight.position).multiplyScalar(0.75);
scene.add(sunMesh);

// Halo du soleil
function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 250, 200, 1)');
    grad.addColorStop(0.3, 'rgba(255, 240, 150, 0.6)');
    grad.addColorStop(1, 'rgba(255, 240, 150, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, depthWrite: false }));
sunGlow.scale.set(70, 70, 1);
sunGlow.position.copy(sunMesh.position);
scene.add(sunGlow);

// ---------------------------------------------------------------------------
// Cycle jour / nuit : le soleil décrit un arc, le ciel et la lumière suivent.
// ---------------------------------------------------------------------------
const DAY_LENGTH = 420;   // durée d'un cycle complet (secondes)
let dayPhase = 0.20;      // 0 = aube, 0,25 = midi, 0,5 = crépuscule, 0,75 = nuit
const SKY_TOP_DAY = new THREE.Color(0x4a9fd8);
const SKY_BOTTOM_DAY = new THREE.Color(0xe6f6fd);
const SKY_TOP_NIGHT = new THREE.Color(0x0b1c33);
const SKY_BOTTOM_NIGHT = new THREE.Color(0x2b3f57);
const SUN_WARM = new THREE.Color(0xffb877);
const SUN_DAY = new THREE.Color(0xfff2cc);

function updateDayNight(dt) {
    dayPhase = (dayPhase + dt / DAY_LENGTH) % 1;
    const angle = dayPhase * Math.PI * 2;
    const daylight = Math.max(0, Math.sin(angle)); // 0 la nuit, 1 en plein jour
    // LUMINOSITÉ DU POSTE : le soleil est TOUJOURS au sud-ouest ; selon l'endroit
    // où l'on pêche, on l'a dans le dos, de côté ou en plein contre-jour.
    const exposition = expositionPoste();
    // Soleil : azimut FIXE (sud-ouest), seule l'élévation suit le cycle du jour.
    sunLight.position.set(SUN_DIRECTION.x * 70, 12 + daylight * 65, SUN_DIRECTION.z * 70);
    sunLight.intensity = (0.25 + daylight * 1.05) * exposition;
    sunLight.color.copy(SUN_WARM).lerp(SUN_DAY, daylight);
    sunMesh.position.copy(sunLight.position).multiplyScalar(0.75);
    sunGlow.position.copy(sunMesh.position);
    // La même direction pour le reflet solaire du shader d'eau (plus de valeur
    // codée en dur : le soleil peut être ailleurs qu'au sud-ouest).
    waterUniforms.uSunDir.value.copy(sunLight.position).normalize();
    // Ciel (dégradé), brume et fond.
    skyMat.uniforms.topColor.value.copy(SKY_TOP_NIGHT).lerp(SKY_TOP_DAY, daylight);
    skyMat.uniforms.bottomColor.value.copy(SKY_BOTTOM_NIGHT).lerp(SKY_BOTTOM_DAY, daylight);
    scene.background.copy(skyMat.uniforms.bottomColor.value);
    scene.fog.color.copy(skyMat.uniforms.bottomColor.value);
    // Lumières d'ambiance : la nuit reste assez claire pour jouer.
    ambientLight.intensity = (0.42 + daylight * 0.22) * (0.94 + exposition * 0.06);
    skyLight.intensity = (0.38 + daylight * 0.30) * (0.96 + exposition * 0.04);
    waterUniforms.uLight.value = (0.35 + daylight * 0.65) * exposition;
}

// ---------------------------------------------------------------------------
// Éclairage d'environnement (IBL) : reflets crédibles sur les matériaux PBR.
// On fabrique un petit « ciel » et on le convertit en carte d'environnement.
// ---------------------------------------------------------------------------
function buildEnvironment() {
    if (!postSupported || typeof THREE.PMREMGenerator !== 'function') {
        return;
    }
    try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        envScene.add(new THREE.Mesh(
            new THREE.SphereGeometry(80, 16, 12),
            new THREE.ShaderMaterial({
                side: THREE.BackSide,
                uniforms: {
                    topColor: { value: new THREE.Color(0x8fc4ee) },
                    bottomColor: { value: new THREE.Color(0x5d6b4a) }
                },
                vertexShader: 'varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
                fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; varying vec3 vP; void main() { float h = normalize(vP).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0); }'
            })
        ));
        const envSun = new THREE.Mesh(
            new THREE.SphereGeometry(7, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        envSun.position.set(24, 40, -30);
        envScene.add(envSun);
        // 0.04 rad de flou : assez doux pour un ciel crédible, et juste sous la
        // limite de three.js (à 0.05 il prévient « sigmaRadians … is too large »).
        scene.environment = pmrem.fromScene(envScene, 0.04).texture;
        pmrem.dispose();
    } catch (error) {
        // Pas d'environnement disponible : l'éclairage direct suffit.
    }
}

buildEnvironment();

// ---------------------------------------------------------------------------
// Qualité automatique : si les images baissent, on réduit la résolution.
// ---------------------------------------------------------------------------
const QUALITY_MAX = isMobileDevice ? 1.5 : 2;
const QUALITY_MIN = 0.75;
let qualityRatio = Math.min(window.devicePixelRatio || 1, QUALITY_MAX);
let qualityAccum = 0;
let qualityFrames = 0;

function updateQuality(dt) {
    if (!renderer.setPixelRatio || !renderer.getPixelRatio) {
        return;
    }
    qualityAccum += dt;
    qualityFrames += 1;
    if (qualityAccum < 2.5) {
        return;
    }
    const fps = qualityFrames / qualityAccum;
    qualityAccum = 0;
    qualityFrames = 0;
    const ratioMax = Math.min(window.devicePixelRatio || 1, QUALITY_MAX);
    if (fps < 45 && qualityRatio > QUALITY_MIN) {
        qualityRatio = Math.max(QUALITY_MIN, qualityRatio - 0.25);
        renderer.setPixelRatio(qualityRatio);
        resize();
    } else if (fps > 57 && qualityRatio < ratioMax) {
        qualityRatio = Math.min(ratioMax, qualityRatio + 0.25);
        renderer.setPixelRatio(qualityRatio);
        resize();
    }
}

// Nuages
const clouds = [];
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + rand() * 2, 8, 6), cloudMat);
        puff.position.set(j * 4 - 6, rand() * 1.5, rand() * 2);
        puff.scale.y = 0.5;
        cloud.add(puff);
    }
    cloud.position.set(-90 + rand() * 180, 42 + rand() * 22, -120 - rand() * 50);
    scene.add(cloud);
    clouds.push(cloud);
}

// ---------------------------------------------------------------------------
// Étang : géométrie du monde (centre, contour, relief, fond) — module dédié.
// ---------------------------------------------------------------------------
const pondBottom = ajouterFond(scene);

// Eau : disque « polaire » (anneaux + rayons) pour permettre au shader de
// déformer finement la surface en vagues. Chaque anneau suit le CONTOUR de
// l'étang : le bord de l'eau n'est plus un cercle parfait.
function makeWaterGeometry(rings, segments) {
    const positions = [0, 0, 0];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const rr = rayonEtang(a) * (r / rings);
            positions.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        }
    }
    // Éventail du centre vers le premier anneau.
    for (let s = 0; s < segments; s++) {
        indices.push(0, 1 + s, 1 + ((s + 1) % segments));
    }
    // Quadrangles entre anneaux voisins.
    for (let r = 1; r < rings; r++) {
        const base = 1 + (r - 1) * segments;
        const next = 1 + r * segments;
        for (let s = 0; s < segments; s++) {
            const s1 = (s + 1) % segments;
            indices.push(base + s, next + s, next + s1);
            indices.push(base + s, next + s1, base + s1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // Profondeur d'eau RÉELLE sous chaque sommet : sert à foncer l'eau au large
    // et à la garder claire au bord (plus de bassine bleu pâle uniforme).
    const depths = [];
    for (let i = 0; i < positions.length; i += 3) {
        depths.push(profondeurLocale(POND_CENTER.x + positions[i], POND_CENTER.z + positions[i + 2]));
    }
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Carte de normales d'eau GÉNÉRÉE (pas de fichier image à embarquer) : la
// somme de vagues sinusoidales tileables, convertie en normales RGB. C'est la
// couche 1 de la technique « eau réaliste » (normales de vague par pixel).
function makeWaterNormalTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    if (!g || !g.createImageData) {
        return null;
    }
    const hauteur = function (x, y) {
        const u = (x / 128) * Math.PI * 2;
        const v = (y / 128) * Math.PI * 2;
        return Math.sin(u * 3) * 0.5 + Math.sin(v * 5 + 1.3) * 0.35 + Math.sin((u + v) * 7) * 0.2
            + Math.sin(u * 11 - v * 4) * 0.12;
    };
    const img = g.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
            const dx = hauteur((x + 1) % 128, y) - hauteur((x + 127) % 128, y);
            const dy = hauteur(x, (y + 1) % 128) - hauteur(x, (y + 127) % 128);
            const i = (y * 128 + x) * 4;
            img.data[i] = Math.max(0, Math.min(255, 128 + dx * 110));
            img.data[i + 1] = Math.max(0, Math.min(255, 128 + dy * 110));
            img.data[i + 2] = 255;
            img.data[i + 3] = 255;
        }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

const textureLoader = (typeof THREE.TextureLoader === 'function') ? new THREE.TextureLoader() : null;
function chargerTexture(nom, rx, ry, srgb) {
    if (!textureLoader) {
        return null;
    }
    let tex = null;
    try {
        tex = textureLoader.load('./assets/' + nom);
    } catch (erreur) {
        return null;      // environnement sans images (tests) : on garde la couleur
    }
    if (tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(rx || 1, ry || 1);
        // Une NORMAL map reste LINÉAIRE (sRGB la déformerait).
        if (srgb !== false && THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        }
    }
    return tex;
}

// Uniforms de l'eau (partagés avec la houle calculée côté JavaScript).
const waterUniforms = {
    uTime: { value: 0 },
    uWindDir: { value: new THREE.Vector2(1, 0) },
    uWind: { value: 0 },
    uLight: { value: 1 },
    // Direction NORMALISÉE (du plan d'eau vers le soleil) : elle suit l'azimut
    // fixe du soleil et son élévation, au lieu d'être codée en dur dans le shader.
    uSunDir: { value: directionSoleil3D(new THREE.Vector3()) },
    uShallow: { value: new THREE.Color(0x3d7d92) },
    uDeep: { value: new THREE.Color(0x0a2736) },
    uSky: { value: new THREE.Color(0x9fc7d6) },
    uNormals: { value: chargerTexture('eau-normales.jpg', 1, 1, false) || makeWaterNormalTexture() },
    uNormalsOn: { value: 0 },
    uReflection: { value: null },
    uReflectOn: { value: 0 },
    uReflectionProjection: { value: new THREE.Matrix4() }
};

// ---------------------------------------------------------------------------
// COUCHE 2 du rendu d'eau : REFLET PLANAIRE. Une caméra miroir (symétrique par
// rapport au plan y = 0) rend la scène dans une petite cible, échantillonnée par
// le shader et déformée par les normales. Basse résolution + une image sur deux,
// désactivé sur mobile.
// ---------------------------------------------------------------------------
const waterReflectionTarget = postSupported && !isMobileDevice
    ? new THREE.WebGLRenderTarget(320, 180, { depthBuffer: true }) : null;
const waterMirrorCamera = new THREE.PerspectiveCamera();
const mirrorDirection = new THREE.Vector3();
const mirrorUp = new THREE.Vector3();
const reflectionClip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
let waterReflectionFrame = 0;

function updateWaterReflection() {
    if (!reflections.enabled || !waterReflectionTarget || camera.position.y <= 0) {
        waterUniforms.uReflectOn.value = 0;
        return;
    }
    waterReflectionFrame += 1;
    if (waterUniforms.uReflectOn.value && waterReflectionFrame % 2 !== 0) { return; }
    waterMirrorCamera.copy(camera);
    camera.getWorldDirection(mirrorDirection);
    mirrorDirection.y *= -1;
    mirrorUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    mirrorUp.y *= -1;
    waterMirrorCamera.up.copy(mirrorUp);
    waterMirrorCamera.position.y *= -1;
    waterMirrorCamera.lookAt(mirrorDirection.add(waterMirrorCamera.position));
    waterMirrorCamera.updateMatrixWorld(true);

    const previousTarget = renderer.getRenderTarget();
    const previousClipping = renderer.clippingPlanes;
    const previousVisibility = water.visible;
    const previousShadowUpdate = renderer.shadowMap.autoUpdate;
    try {
        water.visible = false;
        renderer.clippingPlanes = reflectionClip;
        renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(waterReflectionTarget);
        renderer.clear();
        renderer.render(scene, waterMirrorCamera);
        waterUniforms.uReflectionProjection.value.multiplyMatrices(
            waterMirrorCamera.projectionMatrix, waterMirrorCamera.matrixWorldInverse);
        waterUniforms.uReflection.value = waterReflectionTarget.texture;
        waterUniforms.uReflectOn.value = 1;
    } catch (error) {
        setReflections(false);
        reflectionsToggle.checked = false;
        console.warn('Reflet planaire indisponible', error);
    } finally {
        renderer.setRenderTarget(previousTarget);
        renderer.clippingPlanes = previousClipping;
        renderer.shadowMap.autoUpdate = previousShadowUpdate;
        water.visible = previousVisibility;
    }
}

// Miroir JS de la composition de l'eau (memes regles que le fragment shader) :
// sert aux TESTS DE NON-REGRESSION pour garantir une eau bleu-vert sombre et
// jamais une nappe blanche.
function couleurEau(prof, fres) {
    const p = Math.max(0, Math.min(1, prof));
    const f = Math.max(0, Math.min(1, fres));
    const melange = function (a, b, t) {
        return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
    };
    const shallow = waterUniforms.uShallow.value;
    const deep = waterUniforms.uDeep.value;
    const sky = waterUniforms.uSky.value;
    let col = melange({ r: shallow.r, g: shallow.g, b: shallow.b },
        { r: deep.r, g: deep.g, b: deep.b }, p);
    col = melange(col, { r: sky.r, g: sky.g, b: sky.b }, f * 0.22);
    return col;
}

// Eau transparente avec des vagues dont l'amplitude et la vitesse suivent le
// vent. La normale est calculée à partir du gradient de la houle (éclairage).
const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: waterUniforms,
    vertexShader: `
        uniform float uTime;
        uniform vec2 uWindDir;
        uniform float uWind;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vDepth;
        // Hauteur de la houle + son gradient (pour la normale).
        float waveHeight(vec2 p, float t, out vec2 grad) {
            float amp = 0.11 * (0.5 + uWind * 1.4);
            vec2 d = normalize(uWindDir + vec2(0.0001, 0.0));
            vec2 perp = vec2(-d.y, d.x);
            float a = dot(p, d) * 0.30 - t * (1.1 + uWind * 2.6);
            float b = dot(p, perp) * 0.45 + t * 1.6;
            float c = (p.x * 0.22 + p.y * 0.18) - t * 2.0;
            float h = sin(a) * amp + sin(b) * amp * 0.55 + sin(c) * amp * 0.35;
            grad = d * (cos(a) * amp * 0.30)
                 + perp * (cos(b) * amp * 0.55 * 0.45)
                 + vec2(0.22, 0.18) * (cos(c) * amp * 0.35);
            return h;
        }
        void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vec2 grad;
            wp.y += waveHeight(wp.xz, uTime, grad);
            vWorldPos = wp.xyz;
            // Profondeur RÉELLE de l'étang sous ce point (mêmes constantes que
            // profondeurLocale) : claire au bord, sombre au centre et dans les fosses.
            vec2 dp = wp.xz - vec2(0.0, -40.0);
            float dd = length(dp);
            float tt = min(1.0, dd / 55.0);
            float pr = 1.4 + 3.6 * (1.0 - tt * tt);
            float f1 = length(wp.xz - vec2(-16.0, -56.0)) / 11.0;
            float f2 = length(wp.xz - vec2(20.0, -26.0)) / 9.0;
            pr += 1.6 * max(0.0, 1.0 - f1 * f1) + 1.2 * max(0.0, 1.0 - f2 * f2);
            vDepth = pr;
            vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));
            gl_Position = projectionMatrix * viewMatrix * wp;
        }
    `,
    fragmentShader: `
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        uniform vec3 uSky;
        uniform sampler2D uNormals;
        uniform float uNormalsOn;
        uniform sampler2D uReflection;
        uniform float uReflectOn;
        uniform mat4 uReflectionProjection;
        uniform float uTime;
        uniform float uWind;
        uniform float uLight;
        uniform vec3 uSunDir;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vDepth;
        vec3 vRipple;
        void main() {
            // Deux nappes de normales qui défilent avec le vent : ridules par pixel.
            if (uNormalsOn > 0.5) {
                vec2 uv1 = vWorldPos.xz * 0.05 + vec2(uTime * 0.010, uTime * 0.006) * (0.5 + uWind);
                vec2 uv2 = vWorldPos.xz * 0.11 - vec2(uTime * 0.016, -uTime * 0.012) * (0.4 + uWind);
                vec3 t1 = texture2D(uNormals, uv1).rgb * 2.0 - vec3(1.0);
                vec3 t2 = texture2D(uNormals, uv2).rgb * 2.0 - vec3(1.0);
                vRipple = (t1 + t2) * 0.5;
            }
            vec3 n = normalize(vNormal + vec3(vRipple.x, 0.0, vRipple.y) * 0.8);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);
            // LA profondeur commande la couleur : claire au bord, sombre au fond.
            float prof = clamp(vDepth / 5.2, 0.0, 1.0);
            vec3 col = mix(uShallow, uDeep, prof);
            // Un peu de vaguelette : petites variations de teinte.
            col *= 0.94 + 0.06 * clamp(n.y, 0.0, 1.0);
            col = mix(col, uSky, fres * 0.22);
            // REFLET du décor (couche 2) : distordu par les ridules.
            if (uReflectOn > 0.5) {
                vec4 mirrorPoint = uReflectionProjection * vec4(vWorldPos.x, 0.0, vWorldPos.z, 1.0);
                if (mirrorPoint.w > 0.0) {
                    vec2 uvRef = mirrorPoint.xy / mirrorPoint.w * 0.5 + 0.5 + vRipple.xy * 0.025;
                    vec2 edge = min(uvRef, 1.0 - uvRef);
                    float coverage = smoothstep(0.0, 0.04, min(edge.x, edge.y));
                    vec3 reflet = texture2D(uReflection, clamp(uvRef, vec2(0.0), vec2(1.0))).rgb;
                    col = mix(col, reflet, coverage * (0.12 + fres * 0.32));
                }
            }
            // La nuit, l'eau s'assombrit (cohérent avec la lumière de la scène).
            col *= mix(vec3(0.30, 0.36, 0.48), vec3(1.0), uLight);
            vec3 halfDir = normalize(viewDir + uSunDir);
            float spec = pow(max(dot(n, halfDir), 0.0), 90.0) * (0.16 + uWind * 0.34) * uLight;
            col += vec3(spec);
            // Eau plus transparente : on voit la moitié inférieure du bouchon et
            // le bas de ligne sous la surface.
            float alpha = clamp(0.45 + prof * 0.40 + fres * 0.10, 0.0, 0.96);
            gl_FragColor = vec4(col, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
});

const water = new THREE.Mesh(makeWaterGeometry(22, 64), waterMaterial);
water.position.set(POND_CENTER.x, 0, POND_CENTER.z);
scene.add(water);

// ---------------------------------------------------------------------------
// Le reflet planaire est proposé sur ordinateur ; le ciel reste visible sur mobile.
const reflections = { enabled: false };
function setReflections(value) {
    reflections.enabled = !!value && !!waterReflectionTarget;
    waterUniforms.uReflectOn.value = 0;
}

// Même houle que le shader, côté JavaScript : servez-vous en pour faire flotter
// le bouchon sur les vagues.
function waterWaveHeightAt(x, z, t) {
    const amp = 0.08 * (0.5 + wind.strength * 1.4);
    const dx = Math.cos(wind.dir);
    const dz = Math.sin(wind.dir);
    const px = -dz;
    const pz = dx;
    const a = (x * dx + z * dz) * 0.30 - t * (1.1 + wind.strength * 2.6);
    const b = (x * px + z * pz) * 0.45 + t * 1.6;
    const c = (x * 0.22 + z * 0.18) - t * 2.0;
    return Math.sin(a) * amp + Math.sin(b) * amp * 0.55 + Math.sin(c) * amp * 0.35;
}

function updateWater(t) {
    waterUniforms.uTime.value = t;
    waterUniforms.uWindDir.value.set(Math.cos(wind.dir), Math.sin(wind.dir));
    waterUniforms.uWind.value = wind.strength;
}

// Rive : un anneau dont le bord INTÉRIEUR suit le contour généré de l'étang.
// (Un RingGeometry donnait un cercle parfait et laissait des fentes.)
function makeShoreGeometry(outer, segments) {
    const positions = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    const coast = new THREE.Color(0xa08465);
    const transition = new THREE.Color(0xd7c7a7);
    const grass = new THREE.Color(0xffffff);
    for (let segment = 0; segment < segments; segment++) {
        const angle = segment / segments * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const inner = rayonEtang(angle);
        const edgeWidth = 1.7 + 0.8 * Math.sin(7 * angle) + 0.4 * Math.cos(13 * angle);
        const rings = [inner, inner + edgeWidth, inner + edgeWidth * 2, outer];
        for (let ring = 0; ring < rings.length; ring++) {
            const x = cos * rings[ring];
            const z = sin * rings[ring];
            positions.push(x, 0, z);
            uvs.push((x / outer + 1) / 2, (z / outer + 1) / 2);
            const color = ring === 0 ? coast : ring === 1 ? transition : grass;
            colors.push(color.r, color.g, color.b);
        }
        const next = ((segment + 1) % segments) * rings.length;
        for (let ring = 0; ring < rings.length - 1; ring++) {
            const current = segment * rings.length + ring;
            const adjacent = next + ring;
            indices.push(current, adjacent + 1, current + 1,
                current, adjacent, adjacent + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

const shore = new THREE.Mesh(
    makeShoreGeometry(220, 96),
    new THREE.MeshStandardMaterial({
        color: 0xe5e0c9, roughness: 0.94, vertexColors: true,
        normalScale: new THREE.Vector2(0.55, 0.55)
    })
);

async function loadShoreTextures(material) {
    const maps = [['map', 'sol-herbe', true]];
    if (!isMobileDevice) {
        maps.push(['normalMap', 'herbe-normales', false],
            ['roughnessMap', 'herbe-rugosite', false]);
    }
    let loader;
    try {
        const tryCompressed = renderer.extensions && typeof Worker !== 'undefined'
            && new URLSearchParams(window.location.search).get('textures') === 'ktx2';
        if (tryCompressed) {
            const { KTX2Loader } = await import('./assets/ktx2/loaders/KTX2Loader.js');
            const candidate = new KTX2Loader().detectSupport(renderer);
            if (Object.values(candidate.workerConfig).some(Boolean)) {
                loader = candidate.setWorkerLimit(1).setTranscoderPath('./assets/ktx2/libs/basis/');
            }
        }
        await Promise.all(maps.map(async ([property, name, srgb]) => {
            let texture;
            if (loader) {
                try {
                    texture = await loader.loadAsync('./assets/' + name + '.ktx2');
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(180, 180);
                } catch {
                    // Un navigateur peut bloquer les workers ou WebAssembly.
                }
            }
            material[property] = texture || chargerTexture(name + '.jpg', 180, 180, srgb);
            material.needsUpdate = true;
        }));
    } catch {
        for (const [property, name, srgb] of maps) {
            material[property] = chargerTexture(name + '.jpg', 180, 180, srgb);
        }
        material.needsUpdate = true;
    } finally {
        if (loader) { loader.dispose(); }
    }
}
loadShoreTextures(shore.material);
shore.position.set(POND_CENTER.x, RIVE_Y, POND_CENTER.z);
shore.receiveShadow = true;
scene.add(shore);

// ---------------------------------------------------------------------------
// Décor fixe (arbres, roseaux, rochers, nénuphars) : module dédié.
// Appelé ICI et pas ailleurs : le décor consomme rand() dans un ordre
// précis, qui conditionne la génération du reste du monde.
const { lilyPads } = creerDecor({
    scene: scene,
    chargerTexture: chargerTexture,
    rand: rand,
    rayonEtang: rayonEtang,
    POND_CENTER: POND_CENTER,
    RIVE_Y: RIVE_Y
});

// ---------------------------------------------------------------------------
// Vent + girouette
// ---------------------------------------------------------------------------
const wind = {
    dir: 0,
    strength: 0,
    targetDir: 0,
    targetStrength: 0,
    timer: 0
};

const vaneGroup = new THREE.Group();
const vaneBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
vaneBase.position.y = 0.15;
vaneGroup.add(vaneBase);

const vanePole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 })
);
vanePole.position.y = 2;
vanePole.castShadow = true;
vaneGroup.add(vanePole);

const vaneArrow = new THREE.Group();
vaneArrow.position.y = 4;
const arrowCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xcc3333 })
);
arrowCone.rotation.z = -Math.PI / 2;
arrowCone.position.x = 0.4;
vaneArrow.add(arrowCone);
const arrowTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.4, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xcc3333 })
);
arrowTail.position.x = -0.4;
vaneArrow.add(arrowTail);
vaneGroup.add(vaneArrow);

vaneGroup.position.set(12, RIVE_Y, 16);
scene.add(vaneGroup);

// ---------------------------------------------------------------------------
// Pêcheur
// ---------------------------------------------------------------------------
const angler = new THREE.Group();
const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.8 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.9 });

const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.6, 4, 10), clothMat);
body.position.y = 1.5;
body.castShadow = true;
angler.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), skinMat);
head.position.y = 2.9;
head.castShadow = true;
angler.add(head);

const hatMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), hatMat);
hat.position.y = 3.35;
angler.add(hat);
const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 16), hatMat);
brim.position.y = 3.2;
angler.add(brim);

const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.3, 4, 8), clothMat);
arm.position.set(0.55, 2.1, -0.35);
arm.rotation.z = -0.9;
arm.rotation.x = 0.4;
angler.add(arm);

// Le pêcheur est posé SUR la rive (pieds au niveau du sol, pas au niveau de l'eau).
angler.position.set(-4, RIVE_Y, 18);
angler.rotation.y = Math.PI;
scene.add(angler);

// ---------------------------------------------------------------------------
// Canne
// ---------------------------------------------------------------------------
// Pecheur de 1,70 m ; canne au flotteur de 3 m (6 unites).
const rodBase = new THREE.Vector3(-3, 2.2 + RIVE_Y, 17);
const rodTip = new THREE.Vector3(-0.8, 4.81, 11.89); // ~3 m du talon

const rodLocalTip = rodTip.clone().sub(rodBase);
const rodPivot = new THREE.Group();
rodPivot.position.copy(rodBase);
scene.add(rodPivot);
const rodGroup = new THREE.Group();
rodPivot.add(rodGroup);

const blankMaterial = new THREE.MeshStandardMaterial({ color: 0x25292a, roughness: 0.32 });
const guideMaterial = new THREE.MeshStandardMaterial({ color: 0x8b9297, metalness: 0.7, roughness: 0.3 });
const wrapMaterial = new THREE.MeshStandardMaterial({ color: 0x463025, roughness: 0.55 });
const corkMaterial = new THREE.MeshStandardMaterial({ color: 0xb89163, roughness: 0.88 });
const rodAxis = rodLocalTip.clone().normalize();
const guideSide = new THREE.Vector3(0, -1, 0).addScaledVector(rodAxis, rodAxis.y).normalize();
const cylinderAxis = new THREE.Vector3(0, 1, 0);
const guideAxis = new THREE.Vector3(0, 0, 1);

function addRodCylinder(from, to, baseRadius, tipRadius, material, parent = rodGroup) {
    const direction = to.clone().sub(from);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(
        tipRadius, baseRadius, direction.length(), 12), material);
    mesh.position.copy(from).lerp(to, 0.5);
    mesh.quaternion.setFromUnitVectors(cylinderAxis, direction.normalize());
    parent.add(mesh);
    return mesh;
}

const blank = new THREE.Mesh(new THREE.CylinderGeometry(
    0.004, 0.022, rodLocalTip.length(), 12, 16), blankMaterial);
blank.geometry.rotateZ(-Math.PI / 2);
blank.geometry.translate(rodLocalTip.length() * 0.5, 0, 0);
const blankAxis = new THREE.Vector3(1, 0, 0);
blank.geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(blankAxis, rodAxis));
const blankPositions = blank.geometry.getAttribute('position');
const blankRest = blankPositions.array.slice();
const guideMounts = [];
let previousRodFlex = 0;
rodGroup.add(blank);
blank.castShadow = true;
addRodCylinder(new THREE.Vector3(), rodLocalTip.clone().multiplyScalar(0.15), 0.052, 0.043, corkMaterial);
addRodCylinder(rodLocalTip.clone().multiplyScalar(0.15),
    rodLocalTip.clone().multiplyScalar(0.22), 0.037, 0.032, wrapMaterial);
addRodCylinder(rodLocalTip.clone().multiplyScalar(0.22),
    rodLocalTip.clone().multiplyScalar(0.27), 0.039, 0.031, corkMaterial);

const spoolMaterial = new THREE.MeshStandardMaterial({ color: 0xb28643, metalness: 0.72, roughness: 0.31 });
const lineCoilMaterial = new THREE.MeshStandardMaterial({ color: 0x798477, roughness: 0.68 });
const reelSeat = rodLocalTip.clone().multiplyScalar(0.18);
const reelCenter = reelSeat.clone().addScaledVector(guideSide, 0.19);
const spoolBack = reelCenter.clone().addScaledVector(rodAxis, 0.09);
const spoolFront = reelCenter.clone().addScaledVector(rodAxis, 0.17);
const bodyBack = reelCenter.clone().addScaledVector(rodAxis, -0.11);
const crankSide = new THREE.Vector3().crossVectors(rodAxis, guideSide).normalize();

addRodCylinder(reelSeat.clone().addScaledVector(rodAxis, -0.12),
    reelSeat.clone().addScaledVector(rodAxis, 0.10), 0.041, 0.036, guideMaterial);
addRodCylinder(reelSeat, reelCenter, 0.016, 0.029, blankMaterial);
addRodCylinder(bodyBack, reelCenter, 0.028, 0.075, blankMaterial);
addRodCylinder(reelCenter, spoolBack, 0.072, 0.064, blankMaterial);
addRodCylinder(spoolBack, spoolFront, 0.055, 0.057, lineCoilMaterial);
addRodCylinder(spoolFront, spoolFront.clone().addScaledVector(rodAxis, 0.018),
    0.073, 0.066, spoolMaterial);
addRodCylinder(spoolFront.clone().addScaledVector(rodAxis, 0.018),
    spoolFront.clone().addScaledVector(rodAxis, 0.041), 0.027, 0.018, blankMaterial);

const reelRotor = new THREE.Group();
reelRotor.position.copy(spoolBack);
rodGroup.add(reelRotor);
const bail = new THREE.Mesh(new THREE.TorusGeometry(0.091, 0.004, 6, 24, Math.PI * 1.15), guideMaterial);
bail.position.addScaledVector(rodAxis, 0.054);
bail.quaternion.setFromUnitVectors(guideAxis, rodAxis);
reelRotor.add(bail);
for (const side of [-1, 1]) {
    const hinge = crankSide.clone().multiplyScalar(0.081 * side);
    addRodCylinder(hinge, hinge.clone().addScaledVector(rodAxis, 0.053),
        0.017, 0.022, blankMaterial, reelRotor);
}

const reelCrank = new THREE.Group();
reelCrank.position.copy(reelCenter);
rodGroup.add(reelCrank);
const crankElbow = crankSide.clone().multiplyScalar(0.127);
const crankHandle = crankElbow.clone().addScaledVector(guideSide, 0.096);
addRodCylinder(new THREE.Vector3(), crankElbow, 0.018, 0.012, guideMaterial, reelCrank);
addRodCylinder(crankElbow, crankHandle, 0.012, 0.009, guideMaterial, reelCrank);
addRodCylinder(crankHandle, crankHandle.clone().addScaledVector(crankSide, 0.057),
    0.019, 0.023, blankMaterial, reelCrank);

for (const fraction of [0.35, 0.48, 0.60, 0.71, 0.81, 0.90, 0.96]) {
    const radius = THREE.MathUtils.lerp(0.05, 0.014, fraction);
    const mount = rodLocalTip.clone().multiplyScalar(fraction);
    const ringCenter = mount.clone().addScaledVector(guideSide, radius * 1.6);
    const foot = addRodCylinder(mount, ringCenter.clone().addScaledVector(guideSide, -radius),
        0.006, 0.004, guideMaterial);
    const wrapRadius = THREE.MathUtils.lerp(0.023, 0.005, fraction);
    const wrap = addRodCylinder(mount.clone().addScaledVector(rodAxis, -0.025),
        mount.clone().addScaledVector(rodAxis, 0.025), wrapRadius, wrapRadius, wrapMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.003, 6, 12), guideMaterial);
    ring.position.copy(ringCenter);
    ring.quaternion.setFromUnitVectors(guideAxis, rodAxis);
    rodGroup.add(ring);
    guideMounts.push({ fraction, rodParts: [foot, ring, wrap].map(mesh => ({ mesh, rest: mesh.position.clone() })) });
}
const tipGuide = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.003, 6, 12), guideMaterial);
tipGuide.position.copy(rodLocalTip);
tipGuide.quaternion.setFromUnitVectors(guideAxis, rodAxis);
rodGroup.add(tipGuide);

function rodFlexOffset(fraction, flex) {
    const t = Math.max(0, (fraction - 0.27) / 0.73);
    return flex * 2 * t * t * (1 - t);
}

function updateRodFlex(flex) {
    if (Math.abs(flex - previousRodFlex) < 0.001) { return; }
    previousRodFlex = flex;
    const length = rodLocalTip.length();
    for (let i = 0; i < blankRest.length; i += 3) {
        const x = blankRest[i];
        const y = blankRest[i + 1];
        const z = blankRest[i + 2];
        const fraction = THREE.MathUtils.clamp((x * rodAxis.x + y * rodAxis.y + z * rodAxis.z) / length, 0, 1);
        const offset = rodFlexOffset(fraction, flex);
        blankPositions.setXYZ(i / 3, x + guideSide.x * offset, y + guideSide.y * offset, z + guideSide.z * offset);
    }
    blankPositions.needsUpdate = true;
    blank.geometry.computeVertexNormals();
    for (const { fraction, rodParts } of guideMounts) {
        const offset = rodFlexOffset(fraction, flex);
        for (const { mesh, rest } of rodParts) {
            mesh.position.copy(rest).addScaledVector(guideSide, offset);
        }
    }
}

// Pliage de la canne + position VISUELLE du bout (la ligne part de là).
// `rodTip` reste la référence logique (distances, tests) et ne bouge pas.
const rodTipVisual = rodTip.clone();
const ROD_BEND_AXIS = new THREE.Vector3(1, 0, 0);
const AXE_VERTICAL = new THREE.Vector3(0, 1, 0);
let rodBend = 0;

// ---------------------------------------------------------------------------
// GESTE DE LANCER : la canne s'arme en arrière pendant la charge, puis fouette
// vers l'avant au lâcher. Le pêcheur et la canne s'orientent vers la cible
// réelle (point visé, puis bouchon). `castSwing` > 0 = armé, < 0 = fouetté.
// ---------------------------------------------------------------------------
let castSwing = 0;
let castSwingDepart = 0;        // valeur de l'armé au moment du lâcher
let castYawAngler = 0;          // écart de lacet du corps par rapport au poste
let castYawRod = 0;             // écart de lacet de la canne par rapport au poste
let anglerYawBase = Math.PI;    // lacet de repos du pêcheur (fixé au placement)
let rodYawBase = 0;             // lacet de repos du pivot de canne
const CAST_SWING_CHARGE = 0.55; // armé en arrière (~31°)
const CAST_SWING_RELEASE = -0.78; // fouetté vers l'avant (~45°)
const CAST_YAW_ANGLER_MAX = 0.8;  // le corps ne se tord pas au-delà de ~46°
const CAST_YAW_ROD_MAX = 1.2;     // la canne peut viser plus loin (~69°)

function angleNormalise(valeur) {
    const deuxPi = Math.PI * 2;
    let a = valeur % deuxPi;
    if (a > Math.PI) { a -= deuxPi; }
    if (a < -Math.PI) { a += deuxPi; }
    return a;
}

function updateRod(dt) {
    const quiverActif = modeQuiver.estActif();
    const cibleQuiver = (quiverActif && floatState === 'bite')
        ? modeQuiver.getBend() * 0.35 : 0;
    const target = ((floatState === 'struggle' || floatState === 'reeling') ? tension * 0.5
        : (floatState === 'bite' ? 0.10 : 0)) + cibleQuiver;
    rodBend += (target - rodBend) * Math.min(1, dt * 6);
    // En quiver, la canne est posée plus bas (scion vers l'eau) ; le geste de
    // lancer garde toutefois sa cinématique normale.
    const poseQuiver = (quiverActif && (floatState === 'inWater' || floatState === 'bite'
        || floatState === 'struggle' || floatState === 'reeling')) ? -0.24 : 0;
    const pliage = -rodBend + castSwing + poseQuiver;
    rodGroup.rotation.x = pliage;
    updateRodFlex(rodBend + castSwing * 0.4);
    reelCrank.quaternion.setFromAxisAngle(crankSide, crankAngle);
    reelRotor.quaternion.setFromAxisAngle(rodAxis, crankAngle * 5);
    // Pliage autour de l'axe LOCAL de la canne, puis orientation du poste :
    // c'est exactement la transformation de rodPivot -> rodGroup.
    rodTipVisual.copy(rodLocalTip).applyAxisAngle(ROD_BEND_AXIS, pliage);
    if (rodPivot.rotation.y) {
        rodTipVisual.applyAxisAngle(AXE_VERTICAL, rodPivot.rotation.y);
    }
    rodTipVisual.add(rodBase);
}

// ---------------------------------------------------------------------------
// Mode QUIVER : le module quiver.js gère le dessin du scion et ses mouvements.
// ---------------------------------------------------------------------------
// Le quiver se pêche AU FOND (comme la pêche à l'anglaise « posée ») : l'hameçon
// repose sur le relief à l'endroit où la ligne est tombée.
let profondeurBouchonMemo = null;
function poserHameconAuFond(lieu) {
    if (profondeurBouchonMemo === null) { profondeurBouchonMemo = profondeurLigne; }
    const enEau = floatState !== 'idle' && floatState !== 'flying';
    const px = lieu ? lieu.x : (enEau ? floatGroup.position.x : castTarget.x);
    const pz = lieu ? lieu.z : (enEau ? floatGroup.position.z : castTarget.z);
    const fond = Math.max(0.6, profondeurLocale(px, pz) - 0.55);   // posé juste au-dessus de la vase
    if (Math.abs(fond - profondeurLigne) > 0.001) {
        profondeurLigne = fond;
        HOOK_DEPTH = -fond;
        appliquerProfondeurVisuelle();
        majEtiquetteProfondeur();
        majCoupeProfondeur();
    }
}

function updateQuiver(dt) {
    if (!modeQuiver.estActif()) {
        if (profondeurBouchonMemo !== null) {
            // Retour au bouchon : on retrouve le réglage de profondeur d'avant.
            const memo = profondeurBouchonMemo;
            profondeurBouchonMemo = null;
            setProfondeur(memo);
        }
        return;
    }
    poserHameconAuFond();
    // Pas de bouchon : la ligne entre directement dans l'eau.
    floatGroup.visible = false;
    modeQuiver.update(dt, floatState);
}

function appliquerTechniqueVisuelle() {
    const quiver = techniqueCourante === 'quiver';
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
        document.body.classList.toggle('mode-quiver', quiver);
    }
    if (techniqueSelect) { techniqueSelect.value = techniqueCourante; }
    modeQuiver.setActif(quiver);
    if (quiver) {
        floatGroup.visible = false;
    } else {
        floatGroup.visible = true;
    }
}

function setTechnique(value) {
    const nouvelle = value === 'quiver' ? 'quiver' : 'bouchon';
    if (floatState !== 'idle' && nouvelle !== techniqueCourante) {
        statusDisplay.textContent = 'Termine la ligne en cours avant de changer de technique.';
        if (techniqueSelect) { techniqueSelect.value = techniqueCourante; }
        return false;
    }
    techniqueCourante = nouvelle;
    journal.technique = nouvelle;
    saveJournal();
    appliquerTechniqueVisuelle();
    updateToolDock();
    floatInfo.textContent = flotteurCourant().desc;
    renderBoutique();
    statusDisplay.textContent = nouvelle === 'quiver'
        ? 'Technique quiver : surveille le scion de la canne (pas de bouchon).'
        : 'Technique bouchon : surveille le bouchon.';
    return true;
}

let LINE_SEGMENTS;
let linePositions;
let lineGeometry;
let floatGroup;
let floatBody;
let floatStick;
let profondeurLigne;
let HOOK_DEPTH;
let floatState;
const {
    setFloatOpacity, bornesProfondeur, appliquerProfondeurVisuelle, majEtiquetteProfondeur,
    updateDepthButtons, setProfondeur
} = creerLigne({
    scene, flotteurCourant: (...args) => flotteurCourant(...args), depthLabel, nombreMetres, depthMinus, depthPlus, majCoupeProfondeur
});

// ---------------------------------------------------------------------------
// COUPE DE L'EAU : le petit schéma qui montre, en direct, le bouchon en
// surface, le fil, l'hameçon à SA profondeur et le fond de l'étang à l'endroit
// pêché. C'est la partie « visuelle » du réglage de profondeur.
// ---------------------------------------------------------------------------
const depthCross = document.getElementById('depthCross');
const depthBottomLine = document.getElementById('depthBottomLine');
const depthHookLine = document.getElementById('depthHookLine');
const depthHookDot = document.getElementById('depthHook');
const depthZoneLabel = document.getElementById('depthZoneLabel');
const depthHint = document.getElementById('depthHint');
const depthRange = document.getElementById('depthRange');
let dernierCoupe = -1;
let coupePrete = false;   // le schéma attend que le jeu soit entièrement initialisé

// Hauteur d'eau (unités) représentée par la hauteur du schéma.
const COUPE_REF = 6.8;

function nombreMetres(unites) {
    return (unites / 2).toFixed(1).replace('.', ',') + ' m';
}

function majCoupeProfondeur() {
    if (!depthCross || !coupePrete) {
        return;
    }
    const enEau = floatState !== 'idle';
    const px = enEau ? floatGroup.position.x : castTarget.x;
    const pz = enEau ? floatGroup.position.z : castTarget.z;
    const profLocale = profondeurLocale(px, pz);
    // Le fond, en % de la hauteur du schéma (jamais collé aux bords).
    const fondPct = Math.min(96, Math.max(8, (profLocale / COUPE_REF) * 100));
    depthBottomLine.style.top = fondPct.toFixed(1) + '%';
    depthBottomLine.style.height = (100 - fondPct).toFixed(1) + '%';
    // L'hameçon et le fil qui le relie au bouchon.
    const hameconPct = Math.min(100, (profondeurLigne / COUPE_REF) * 100);
    depthHookDot.style.top = hameconPct.toFixed(1) + '%';
    depthHookLine.style.height = hameconPct.toFixed(1) + '%';
    const zone = modeQuiver.estActif() ? 'au fond (quiver)'
        : (profondeurLigne < 1.6 ? 'surface' : (profondeurLigne < 3.2 ? 'mi-eau' : 'fond'));
    depthZoneLabel.textContent = zone;
    // Alerte : l'hameçon touche (ou dépasse) le fond → vase, aucune touche.
    const dansLeFond = !modeQuiver.estActif() && profondeurLigne > profLocale - 0.25;
    depthHookDot.classList.toggle('danger', dansLeFond);
    depthHint.classList.toggle('alerte', dansLeFond);
    depthHint.textContent = dansLeFond
        ? '⚠ Fond à ' + nombreMetres(profLocale) + ' : hameçon dans la vase !'
        : zone + ' · fond à ' + nombreMetres(profLocale);
}

const floatIdle = new THREE.Vector3(rodTip.x, rodTip.y - 0.6, rodTip.z);
floatGroup.position.copy(floatIdle);
// Le bouchon est un peu plus petit que dans la réalité d'un jeu vidéo : il doit
// rester crédible. (Les mouvements de touche sont bien plus grands que sa taille,
// donc il reste très lisible de loin.)
const FLOTTEUR_ECHELLE = 0.8;
floatGroup.scale.setScalar(FLOTTEUR_ECHELLE);
scene.add(floatGroup);

let BOUCHONS_DE_DEPART;
let FLOTTEURS;
let flotteurChoix;
let techniqueCourante;
let scionChoix;
const {
    trouverScion, flotteurCourant, appliquerFlotteurVisuel, setFloatType, scionPossede, setScion,
    acheterScion, trouverFlotteur, capaciteBouchon
} = creerBouchons({
    SCIONS_DE_DEPART, SCIONS, appliquerProfondeurVisuelle, floatSelect, floatInfo, setProfondeur,
    saveJournal, scionSelect, renderJournal
});

floatInfo.textContent = flotteurCourant().desc;
appliquerFlotteurVisuel(flotteurCourant());

let FEED_MIN_RANGE = 6;
let FEED_MAX_RANGE = 46;
let CHUM_ATTRACT_ACCEL = 6;
let feedMode = false;
let feedState = 'idle';
let feedPower = 0;
let feedTargetPower = 0;
let feedFlyT = 0;
let chum = null;
let feedAim = new THREE.Vector3(0, 0.1, -25);
let feedLanding = new THREE.Vector3(0, 0.1, -25);
let feedBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xcdb56f, roughness: 0.95 })
);
const {
    setFeedMode, startFeedCharge, moveFeedAim, releaseFeed, cancelFeed, updateChum, updateFeed,
    updateArm, fermerOutils, updateToolDock
} = creerAmorcage({
    scene, angler, feedGaugeFill, feedGaugeTarget, stockAmorce, statusDisplay, feedButton,
    majAmorce, feedGauge, ensureSound, POND_CENTER, wind, rayonEtang, saveJournal, sound, arm,
    toolDock, toolToggle, setCameraView, cameraButton, depthPanel, quickFeedButton, lineSelect,
    updateDepthButtons, bornesProfondeur, sonarButton
});

const {
    BOURRICHE_POS, BOURRICHE_RADIUS, FISH_THROW_MIN, FISH_THROW_MAX, FISH_THROW_WIND,
    FISH_THROW_DURATION, FISH_THROW_OSC, bourriche,
} = creerBourriche({
    scene: scene,
});

// ---------------------------------------------------------------------------
// EMPLACEMENTS AUTOUR DE L'ÉTANG (idee 1 de idees.md)
// Le monde (eau, poissons, nénuphars) ne bouge pas : c'est le « poste de
// pêche » qui fait le tour de l'étang. On tourne donc tout le matériel du
// pêcheur autour de POND_CENTER : pêcheur, canne, bouchon au repos, bourriche,
// girouette et caméra. Les 4 postes sont à 90° l'un de l'autre.
//   delta = rotation autour du centre (0 = poste historique, au sud).
// ---------------------------------------------------------------------------
const POSTES = [
    // `exposition` module la lumière du soleil ET la luminosité de l'eau :
    //  - sud   : soleil dans le dos (référence, lumière franche) ;
    //  - est   : soleil de côté (un peu plus doux) ;
    //  - nord  : contre-jour (l'eau est plus sombre) ;
    //  - ouest : plein soleil dans le dos (le plus lumineux).
    { id: 'sud', nom: 'Sud', delta: 0, exposition: 1.00 },
    { id: 'est', nom: 'Est', delta: Math.PI / 2, exposition: 0.96 },
    { id: 'nord', nom: 'Nord', delta: Math.PI, exposition: 0.90 },
    { id: 'ouest', nom: 'Ouest', delta: -Math.PI / 2, exposition: 1.04 }
];
let posteActuel = 0;          // preset le plus proche (pour la lumière et les boutons)
let emplacementLibre = false; // true = choisi à la main sur la carte
let boutonPosteActif = 0;     // -1 = aucun raccourci actif

// Distance entre le pêcheur et le bord LOCAL de l'eau. Le joueur peut choisir
// n'importe quel angle et une distance dans cette bande (carte vue de dessus).
const POSTE_MARGE = 2.2;
const PLACEMENT_MARGE_MIN = 1.4;
const PLACEMENT_MARGE_MAX = 6.0;

// Positions de référence du poste SUD (les valeurs historiques du jeu). On les
// fait tourner autour de l'étang pour obtenir n'importe quel emplacement.
const POSTE_ANGLER = angler.position.clone();
const POSTE_ROD_BASE = rodBase.clone();
const POSTE_ROD_TIP = rodTip.clone();
const POSTE_BOURRICHE = BOURRICHE_POS.clone();
const POSTE_GIROUETTE = vaneGroup.position.clone();
const POSTE_CAM_POS = NORMAL_CAM_POS.clone();
const POSTE_CAM_TARGET = NORMAL_CAM_TARGET.clone();
// Angle (x = cos, z = sin) du poste sud historique.
const ANGLE_BASE = Math.atan2(
    POSTE_ANGLER.z - POND_CENTER.z, POSTE_ANGLER.x - POND_CENTER.x);
let emplacementAngle = ANGLE_BASE;
let emplacementMarge = POSTE_MARGE;

let BATEAU_PAS_ANGLE = 0.055;
let BATEAU_PAS_MARGE = 1.6;
let bateauGroupe = new THREE.Group();
let modeBateau = false;
let bateauRame = { gauche: false, droite: false, avant: false };
const {
    embarquerBateau, quitterBateau, deplacerBateau, updateRameBateau, majPadBateau, updateBateau,
    expositionPoste, azimutPosteTexte, majEtiquettePoste, placerAuPoste, choisirEmplacement
} = creerBateau({
    scene, POSTE_MARGE, rayonEtang, angler, boatLeft, boatRow, boatRight, boatPad, boatButton,
    ensureSound, statusDisplay, sound, waterWaveHeightAt, POSTES, POND_CENTER, ANGLE_BASE,
    cameraTarget, camera, compassDisplay, azimutTexte, SUN_AZIMUT, RAYON_ETANG_MAX,
    PLACEMENT_MARGE_MIN, PLACEMENT_MARGE_MAX, POSTE_ANGLER, POSTE_ROD_BASE, rodBase,
    POSTE_ROD_TIP, rodTip, POSTE_BOURRICHE, BOURRICHE_POS, POSTE_GIROUETTE, vaneGroup,
    POSTE_CAM_POS, NORMAL_CAM_POS, POSTE_CAM_TARGET, NORMAL_CAM_TARGET, rodPivot, rodGroup,
    rodTipVisual, floatIdle, floatGroup, bourriche, resetCameraView, feedAim, majCoupeProfondeur,
    renderCartePlacement
});

// ---------------------------------------------------------------------------
// CARTE DE PLACEMENT VUE DE DESSUS (écran d'accueil)
// On voit l'étang de dessus ; la COURONNE claire autour de l'eau représente la
// zone où l'on peut se placer (1,4 à 6 unités de la berge locale). Cliquer ou
// glisser dans cette couronne choisit l'angle ET la distance à la berge.
// ---------------------------------------------------------------------------
const CARTE_3D_TAILLE = 320;        // résolution du canvas de la carte
const CARTE_3D_MONDE = 170;         // largeur du terrain représenté (unités)
const CARTE_3D_SEGMENTS = 96;       // résolution du maillage de relief
const CARTE_3D_EAU_Y = 0;           // HAUTEUR DE L'EAU : dessous = le lac
const CARTE_3D_BANDE_SEGMENTS = 128;

// ---------------------------------------------------------------------------
// HAUTEUR DU TERRAIN : un « champ de hauteur » (comme une image grayscale
// 2D dont on fixe le niveau de l'eau). Ici la hauteur est calculée à partir
// de la vraie profondeur de l'étang :
//   - sous le bord de l'eau : y = -profondeurLocale (négatif, c'est le lac) ;
//   - sur la berge : y remonte au-dessus de 0, avec des collines douces.
// Le plan d'eau est à y = CARTE_3D_EAU_Y (0).
// ---------------------------------------------------------------------------
function hauteurCarte(x, z) {
    const dx = x - POND_CENTER.x;
    const dz = z - POND_CENTER.z;
    const d = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const rayon = rayonEtang(angle);
    if (d <= rayon) {
        return -profondeurLocale(x, z);   // fond du lac, sous le plan d'eau
    }
    // Berge qui remonte, puis collines (dénivelé visible autour de l'étang).
    const t = d - rayon;
    let y = RIVE_Y + Math.min(7, t * 0.14);
    y += 0.35 * Math.sin(x * 0.07 + 0.8) * Math.cos(z * 0.06 - 0.4)
        + 0.18 * Math.sin((x + z) * 0.11 + 2.1);
    return Math.max(RIVE_Y + 0.05, y);
}

const CARTE_EAU_BAS = new THREE.Color(0x5a9aa8);
const CARTE_EAU_PROFOND = new THREE.Color(0x0d2c3a);
const CARTE_TERRE_BAS = new THREE.Color(0x3c3c3c);
const CARTE_TERRE_HAUT = new THREE.Color(0xdedede);
const _couleurCarte = new THREE.Color();

// Couleur du relief : eau bleu-vert (foncée avec la profondeur), terre en
// dégradé de gris (comme une heightmap) plus claire en altitude.
function couleurCarte(y) {
    if (y < CARTE_3D_EAU_Y) {
        const t = Math.min(1, -y / 5.5);
        return _couleurCarte.copy(CARTE_EAU_BAS).lerp(CARTE_EAU_PROFOND, t);
    }
    const t = Math.min(1, (y - RIVE_Y) / 7);
    return _couleurCarte.copy(CARTE_TERRE_BAS).lerp(CARTE_TERRE_HAUT, t);
}

const carteScene = new THREE.Scene();
carteScene.background = new THREE.Color(0x16242b);
const carteCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 600);
carteCamera.position.set(POND_CENTER.x + 75, 100, POND_CENTER.z + 120);
carteCamera.lookAt(POND_CENTER.x, -1, POND_CENTER.z);
carteCamera.updateMatrixWorld();
carteCamera.updateProjectionMatrix();

carteScene.add(new THREE.AmbientLight(0xffffff, 0.65));
const lumiereCarte = new THREE.DirectionalLight(0xffffff, 1.0);
const azimutSoleilCarte = directionAzimut(SUN_AZIMUT);
lumiereCarte.position.set(azimutSoleilCarte.x * 70, 90, azimutSoleilCarte.z * 70);
carteScene.add(lumiereCarte);

// --- Terrain : un maillage dont chaque sommet prend sa hauteur dans le champ. ---
const carteGeometrie = new THREE.PlaneGeometry(
    CARTE_3D_MONDE, CARTE_3D_MONDE, CARTE_3D_SEGMENTS, CARTE_3D_SEGMENTS);
carteGeometrie.rotateX(-Math.PI / 2);
const cartePositions = carteGeometrie.attributes.position;
const carteCouleurs = [];
let carteMinY = Infinity;
let carteMaxY = -Infinity;
let carteSousLEau = 0;
for (let i = 0; i < cartePositions.count; i++) {
    const x = cartePositions.getX(i) + POND_CENTER.x;
    const z = cartePositions.getZ(i) + POND_CENTER.z;
    const y = hauteurCarte(x, z);
    cartePositions.setY(i, y);
    const couleur = couleurCarte(y);
    carteCouleurs.push(couleur.r, couleur.g, couleur.b);
    carteMinY = Math.min(carteMinY, y);
    carteMaxY = Math.max(carteMaxY, y);
    if (y < CARTE_3D_EAU_Y) {
        carteSousLEau += 1;
    }
}
carteGeometrie.setAttribute('color', new THREE.Float32BufferAttribute(carteCouleurs, 3));
carteGeometrie.computeVertexNormals();
const carteTerrain = new THREE.Mesh(
    carteGeometrie,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })
);
carteTerrain.name = 'terrain-etang';
carteTerrain.position.set(POND_CENTER.x, 0, POND_CENTER.z);
carteScene.add(carteTerrain);

// --- Plan d'eau à hauteur fixe : tout ce qui est dessous est le lac. ---
const carteEau = new THREE.Mesh(
    new THREE.PlaneGeometry(CARTE_3D_MONDE, CARTE_3D_MONDE),
    new THREE.MeshStandardMaterial({
        color: 0x2b7ea1,
        transparent: true,
        opacity: 0.55,
        roughness: 0.25,
        metalness: 0.15,
        depthWrite: false,
        side: THREE.DoubleSide
    })
);
carteEau.name = 'eau-etang';
carteEau.rotation.x = -Math.PI / 2;
carteEau.position.set(POND_CENTER.x, CARTE_3D_EAU_Y, POND_CENTER.z);
carteScene.add(carteEau);

// Ligne de rivage (contour généré) juste au-dessus du plan d'eau.
const cartePointsRive = [];
for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    const r = rayonEtang(a);
    cartePointsRive.push(new THREE.Vector3(
        POND_CENTER.x + Math.cos(a) * r,
        CARTE_3D_EAU_Y + 0.06,
        POND_CENTER.z + Math.sin(a) * r
    ));
}
const carteLigneRive = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(cartePointsRive),
    new THREE.LineBasicMaterial({ color: 0xdff3fb })
);
carteLigneRive.name = 'rivage-etang';
carteScene.add(carteLigneRive);

// --- Couronne de placement : un ruban posé sur le relief (1,4 → 6 unités). ---
const carteBandePositions = [];
const carteBandeIndices = [];
for (let i = 0; i <= CARTE_3D_BANDE_SEGMENTS; i++) {
    const a = (i / CARTE_3D_BANDE_SEGMENTS) * Math.PI * 2;
    const ri = rayonEtang(a) + PLACEMENT_MARGE_MIN;
    const ro = rayonEtang(a) + PLACEMENT_MARGE_MAX;
    const xi = POND_CENTER.x + Math.cos(a) * ri;
    const zi = POND_CENTER.z + Math.sin(a) * ri;
    const xo = POND_CENTER.x + Math.cos(a) * ro;
    const zo = POND_CENTER.z + Math.sin(a) * ro;
    carteBandePositions.push(
        xi, hauteurCarte(xi, zi) + 0.07, zi,
        xo, hauteurCarte(xo, zo) + 0.07, zo
    );
}
for (let i = 0; i < CARTE_3D_BANDE_SEGMENTS; i++) {
    const a = i * 2;
    carteBandeIndices.push(a, a + 1, a + 3, a, a + 3, a + 2);
}
const carteBandeGeometrie = new THREE.BufferGeometry();
carteBandeGeometrie.setAttribute('position',
    new THREE.Float32BufferAttribute(carteBandePositions, 3));
carteBandeGeometrie.setIndex(carteBandeIndices);
carteBandeGeometrie.computeVertexNormals();
const carteBande = new THREE.Mesh(
    carteBandeGeometrie,
    new THREE.MeshBasicMaterial({
        color: 0xffe780,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false
    })
);
carteBande.name = 'zone-placement';
carteScene.add(carteBande);

// --- Repère 3D du pêcheur (mât + tête dorée) ---
const carteMarqueur = new THREE.Group();
carteMarqueur.name = 'emplacement-marker';
const carteMarqueurTige = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 5.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 })
);
carteMarqueurTige.position.y = 2.9;
carteMarqueur.add(carteMarqueurTige);
const carteMarqueurTete = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff0a8, roughness: 0.5 })
);
carteMarqueurTete.position.y = 6.3;
carteMarqueur.add(carteMarqueurTete);
const carteMarqueurAnneau = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.16, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5 })
);
carteMarqueurAnneau.rotation.x = Math.PI / 2;
carteMarqueurAnneau.position.y = 0.18;
carteMarqueur.add(carteMarqueurAnneau);
carteScene.add(carteMarqueur);

// --- Renderer dédié à la petite carte (contexte WebGL séparé, 320×320) ---
let carteRenderer = null;
try {
    carteRenderer = new THREE.WebGLRenderer({
        canvas: cartePlacement,
        antialias: true,
        alpha: false
    });
    carteRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    carteRenderer.setSize(CARTE_3D_TAILLE, CARTE_3D_TAILLE, false);
    if (THREE.SRGBColorSpace) {
        carteRenderer.outputColorSpace = THREE.SRGBColorSpace;
    }
} catch (erreur) {
    carteRenderer = null;
}

const carteRaycaster = new THREE.Raycaster();
const cartePlanEau = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function majMarqueurCarte() {
    const distance = rayonEtang(emplacementAngle) + emplacementMarge;
    const x = POND_CENTER.x + Math.cos(emplacementAngle) * distance;
    const z = POND_CENTER.z + Math.sin(emplacementAngle) * distance;
    const y = hauteurCarte(x, z);
    carteMarqueur.position.set(x, y, z);
    carteMarqueur.visible = true;
}

// Projette un emplacement du monde vers les coordonnées client du canvas.
// Sert aux tests (et pourrait servir à un survol) : on vise exactement le
// point du relief, donc le raycast retrouve le bon angle et la bonne marge.
function projeterPlacement(angle, marge) {
    const distance = rayonEtang(angle)
        + (typeof marge === 'number' ? marge : POSTE_MARGE);
    const x = POND_CENTER.x + Math.cos(angle) * distance;
    const z = POND_CENTER.z + Math.sin(angle) * distance;
    const y = hauteurCarte(x, z);
    carteCamera.updateMatrixWorld();
    const point = new THREE.Vector3(x, y, z).project(carteCamera);
    const rect = cartePlacement
        ? cartePlacement.getBoundingClientRect()
        : { left: 0, top: 0, width: CARTE_3D_TAILLE, height: CARTE_3D_TAILLE };
    const clientX = rect.left + (point.x * 0.5 + 0.5) * rect.width;
    const clientY = rect.top + (-point.y * 0.5 + 0.5) * rect.height;
    return {
        clientX: clientX,
        clientY: clientY,
        x: clientX,
        y: clientY,
        xMonde: x,
        yMonde: y,
        zMonde: z
    };
}

// Chemin SVG d'un contour de l'étang.
//   facteur : 1 = bord de l'eau, < 1 = isobathe ;
//   decalage : marge radiale en unités du monde (couronne de placement).
function cheminContourEtang(cx, cy, echelle, facteur, decalage) {
    const n = 96;
    const f = (typeof facteur === 'number') ? facteur : 1;
    const dec = (typeof decalage === 'number') ? decalage : 0;
    let d = '';
    for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = (rayonEtang(a) * f + dec) * echelle;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
}

function renderCartePlacement() {
    majMarqueurCarte();
    if (cartePlacementAide) {
        cartePlacementAide.textContent = '📍 '
            + (emplacementLibre
                ? azimutPosteTexte(emplacementAngle)
                : POSTES[posteActuel].nom.toLowerCase())
            + ' · ' + emplacementMarge.toFixed(1).replace('.', ',')
            + ' unité(s) de la berge — clique ou glisse sur le relief.';
    }
    if (cartePlacementRepere && cartePlacement) {
        const projection = projeterPlacement(emplacementAngle, emplacementMarge);
        const rect = cartePlacement.getBoundingClientRect();
        cartePlacementRepere.style.left = (projection.clientX - rect.left) + 'px';
        cartePlacementRepere.style.top = (projection.clientY - rect.top) + 'px';
    }
    if (carteRenderer) {
        carteCamera.updateMatrixWorld();
        carteRenderer.render(carteScene, carteCamera);
    }
}

// Convertit un clic sur le RELIEF en (angle, marge) dans le monde.
// On raycast le terrain : le point touché est un vrai point du relief, ce qui
// rend le choix cohérent avec le dénivelé affiché. Si le rayon ne touche pas
// le maillage (bord), on retombe sur le plan d'eau y = 0.
function emplacementDepuisCarte(event) {
    if (!cartePlacement) {
        return null;
    }
    const rect = cartePlacement.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) {
        return null;
    }
    const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    carteCamera.updateMatrixWorld();
    carteScene.updateMatrixWorld(true);
    carteRaycaster.setFromCamera(ndc, carteCamera);
    const hits = carteRaycaster.intersectObject(carteTerrain);
    let point = hits.length ? hits[0].point : null;
    if (!point) {
        point = new THREE.Vector3();
        if (!carteRaycaster.ray.intersectPlane(cartePlanEau, point)) {
            return null;
        }
    }
    const dx = point.x - POND_CENTER.x;
    const dz = point.z - POND_CENTER.z;
    const angle = Math.atan2(dz, dx);
    const distance = Math.hypot(dx, dz);
    const marge = distance - rayonEtang(angle);
    return {
        angle: angle,
        marge: Math.max(PLACEMENT_MARGE_MIN,
            Math.min(PLACEMENT_MARGE_MAX, marge))
    };
}

let cartePlacementPressee = false;
if (cartePlacement) {
    cartePlacement.addEventListener('pointerdown', function (event) {
        cartePlacementPressee = true;
        ensureSound();
        const point = emplacementDepuisCarte(event);
        if (point) {
            choisirEmplacement(point.angle, point.marge);
        }
        if (cartePlacement.setPointerCapture && event && event.pointerId !== undefined) {
            cartePlacement.setPointerCapture(event.pointerId);
        }
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
    });
    cartePlacement.addEventListener('pointermove', function (event) {
        if (!cartePlacementPressee) {
            return;
        }
        const point = emplacementDepuisCarte(event);
        if (point) {
            choisirEmplacement(point.angle, point.marge);
        }
    });
    const relacherCarte = function () { cartePlacementPressee = false; };
    cartePlacement.addEventListener('pointerup', relacherCarte);
    cartePlacement.addEventListener('pointercancel', relacherCarte);
    cartePlacement.addEventListener('pointerleave', relacherCarte);
}

majEtiquettePoste();


// Poisson tenu en main, prêt à être lancé.
let heldFish = null;
let fishThrowState = 'idle';   // 'idle' | 'charging' | 'flying'
let fishThrowPower = 0;
let fishThrowTarget = 0;
let fishThrowPhase = 0;
let fishThrowT = 0;
const fishThrowLanding = new THREE.Vector3();
const fishThrowOrigin = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Carnet de pêche (conservé dans le navigateur quand c'est possible)
// ---------------------------------------------------------------------------
const SONAR_PRICE = 150;
const BATEAU_PRIX = 180;
const SONAR_RADIUS = 24; // 12 m à l’échelle du jeu.
const sonarBuoy = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffb62e, roughness: 0.55 }));
sonarBuoy.visible = false;
scene.add(sonarBuoy);
const sonarContext = sonarRadar.getContext('2d');
let sonarScanTimer = 0;

// « Pings » de sonar : quand un poisson est repéré, le sonar émet un ping
// de sous-marin ET une onde jaune qui s'étend à la surface de l'eau.
// Pas plus d'un ping toutes les SONAR_PING_DELAI secondes (« de temps en temps »).
const SONAR_PING_DELAI = 1.8;   // s — tempo minimale entre deux pings.
const SONAR_ONDE_DUREE = 1.4;   // s — vie d'une onde jaune.
const sonarOndeGeo = new THREE.RingGeometry(0.92, 1, 40);
const sonarOndes = [];          // ondes jaunes vivantes (Mesh).
let sonarHorloge = 0;           // secondes avancées par updateSonar (horloge du sonar).
let sonarDernierPing = -Infinity;
let sonarPings = 0;             // compteur de pings (pour les tests).

// Émet une onde jaune à la surface, centrée sur la bouée du sonar.
function emettreOndeSonar() {
    const onde = new THREE.Mesh(sonarOndeGeo, new THREE.MeshBasicMaterial({
        color: 0xffc454, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false
    }));
    onde.rotation.x = -Math.PI / 2; // à plat sur l'eau
    onde.position.set(sonarBuoy.position.x, 0.1, sonarBuoy.position.z);
    onde.userData.vie = 0;
    scene.add(onde);
    sonarOndes.push(onde);
}

// Fait disparaître immédiatement toutes les ondes (rangement du sonar).
function effacerOndesSonar() {
    while (sonarOndes.length > 0) {
        const onde = sonarOndes.pop();
        scene.remove(onde);
        onde.material.dispose();
    }
}

function acheterSonar() {
    if (journal.sonar || journal.experience < SONAR_PRICE) { return false; }
    journal.experience -= SONAR_PRICE;
    journal.sonar = true;
    saveJournal();
    renderJournal();
    return true;
}

// Achète la barque (un seul achat, pour toujours). Renvoie true si réussi.
function acheterBateau() {
    if (journal.bateau || journal.experience < BATEAU_PRIX) { return false; }
    journal.experience -= BATEAU_PRIX;
    journal.bateau = true;
    saveJournal();
    renderJournal();
    return true;
}

function rangerSonar() {
    sonarBuoy.visible = false;
    effacerOndesSonar();
    sonarPanel.hidden = true;
    sonarButton.textContent = '📡 Poser le sonar';
    sonarButton.setAttribute('aria-pressed', 'false');
}

function updateSonar(dt, time) {
    if (!sonarBuoy.visible) { return; }
    // Le sonar a SA propre horloge (dt cumulé) : la tempo des pings ne dépend
    // ni de elapsed (jeu) ni de testTime (harnais de test).
    sonarHorloge += dt;
    const origin = sonarBuoy.position;
    origin.y = 0.13 + waterWaveHeightAt(origin.x, origin.z, time);

    // Les ondes jaunes vivent leur vie entre deux balayages : elles grandissent
    // en s'estompant, en suivant doucement la houle.
    for (let i = sonarOndes.length - 1; i >= 0; i--) {
        const onde = sonarOndes[i];
        onde.userData.vie += dt;
        const progression = onde.userData.vie / SONAR_ONDE_DUREE;
        if (progression >= 1) {
            scene.remove(onde);
            onde.material.dispose();
            sonarOndes.splice(i, 1);
            continue;
        }
        onde.position.y = 0.1
            + waterWaveHeightAt(onde.position.x, onde.position.z, time) * 0.5;
        onde.scale.setScalar(1 + progression * 6);
        onde.material.opacity = 0.85 * (1 - progression);
    }

    sonarScanTimer -= dt;
    if (sonarScanTimer > 0) { return; }
    sonarScanTimer = 0.2;

    const center = sonarRadar.width / 2;
    const radius = center - 4;
    if (sonarContext) {
        sonarContext.clearRect(0, 0, sonarRadar.width, sonarRadar.height);
        sonarContext.strokeStyle = '#76b5ac';
        for (const fraction of [0.5, 1]) {
            sonarContext.beginPath();
            sonarContext.arc(center, center, radius * fraction, 0, Math.PI * 2);
            sonarContext.stroke();
        }
        sonarContext.fillStyle = '#ffc454';
        sonarContext.fillRect(center - 2, center - 2, 4, 4);
        sonarContext.fillStyle = '#9df5c6';
    }

    let detected = 0;
    for (const fish of fishes) {
        if (fish === heldFish || fish.userData.hooked) { continue; }
        const dx = fish.position.x - origin.x;
        const dz = fish.position.z - origin.z;
        if (dx * dx + dz * dz > SONAR_RADIUS ** 2) { continue; }
        detected += 1;
        if (sonarContext) {
            sonarContext.beginPath();
            sonarContext.arc(center + dx / SONAR_RADIUS * radius,
                center + dz / SONAR_RADIUS * radius, 2.6, 0, Math.PI * 2);
            sonarContext.fill();
        }
    }
    // Poisson repéré : « ping » de sous-marin + onde jaune à la surface
    // (pas plus d'un ping toutes les SONAR_PING_DELAI secondes).
    if (detected > 0 && sonarHorloge - sonarDernierPing >= SONAR_PING_DELAI) {
        // MÊME horloge des deux côtés : le « time » passé par l'animateur est
        // l'horloge du JEU (grande après plusieurs parties), pas celle du
        // sonar — les mélanger casse la tempo dès que le jeu a tourné.
        sonarDernierPing = sonarHorloge;
        sonarPings += 1;
        sound.sonarPing();
        emettreOndeSonar();
    }
    const label = detected + (detected === 1 ? ' poisson' : ' poissons') + ' · 12 m';
    if (sonarCount.textContent !== label) {
        sonarCount.textContent = label;
        sonarRadar.setAttribute('aria-label', 'Radar, nord en haut. ' + label);
    }
}

sonarButton.addEventListener('click', () => {
    if (!journal.sonar) { return; }
    if (sonarBuoy.visible) {
        rangerSonar();
    } else {
        if (paused || (floatState !== 'idle' && floatState !== 'inWater')) { return; }
        if (floatState === 'inWater') {
            sonarBuoy.position.copy(floatGroup.position);
        } else if (modeBateau) {
            // Depuis la barque : le sonar part DEVANT, vers le centre de l'étang.
            const dx = POND_CENTER.x - angler.position.x;
            const dz = POND_CENTER.z - angler.position.z;
            const d = Math.hypot(dx, dz) || 1;
            sonarBuoy.position.set(angler.position.x + (dx / d) * 8, 0.13,
                angler.position.z + (dz / d) * 8);
        } else {
            const angle = Math.atan2(angler.position.z - POND_CENTER.z, angler.position.x - POND_CENTER.x);
            const distance = rayonEtang(angle) - 4;
            sonarBuoy.position.set(POND_CENTER.x + Math.cos(angle) * distance, 0.13,
                POND_CENTER.z + Math.sin(angle) * distance);
        }
        sonarBuoy.visible = true;
        sonarPanel.hidden = false;
        sonarButton.textContent = '📡 Ranger le sonar';
        sonarButton.setAttribute('aria-pressed', 'true');
        sonarScanTimer = 0;
        sonarDernierPing = -Infinity; // un placement peut pinger tout de suite
        updateSonar(0, elapsed);
    }
    fermerOutils();
});

const MAX_LIGNES = 5;
const AMORCE_DEPART = 3;
const RECHARGES = [
    { id: 'amorce', nom: 'Boules d’amorce', prix: 12, desc: 'Attirent les poissons vers le point de chute.' },
    { id: 'nylon', nom: 'Nylon', prix: 18, resistance: 1, emmelement: 1, desc: 'Le fil standard.' },
    { id: 'fluorocarbone', nom: 'Fluorocarbone', prix: 28, resistance: 1, emmelement: 0.5,
        desc: 'Réduit de moitié le risque d’emmêlement si tu oublies de tendre le fil.' },
    { id: 'tresse', nom: 'Tresse', prix: 36, resistance: 1.25, emmelement: 1,
        desc: 'Supporte mieux les poissons qui tirent et la remontée rapide.' }
];
const TYPES_DE_FIL = RECHARGES.slice(1);
const TAILLE_LOT = 3;
let lignesRestantes = MAX_LIGNES;
let amorceDepartRestante = AMORCE_DEPART;
const journal = { total: 0, totalWeight: 0, best: 0, last: [], especes: {}, experience: 0, sonar: false, bateau: false,
    technique: 'bouchon', bouchons: BOUCHONS_DE_DEPART.slice(), scions: SCIONS_DE_DEPART.slice(), scion: SCIONS_DE_DEPART[0], ligne: 'nylon',
    recharges: Object.fromEntries(RECHARGES.map(article => [article.id, 0])) };

function stockAmorce() {
    return amorceDepartRestante + journal.recharges.amorce;
}

function majAmorce() {
    const stock = stockAmorce();
    feedButton.textContent = (feedMode ? '🥣 Amorce prête' : '🥣 Amorce') + ' (' + stock + ')';
    quickFeedCount.textContent = String(stock);
    const action = feedMode ? 'Annuler l’amorçage' : 'Amorcer';
    quickFeedButton.setAttribute('aria-label',
        action + ', ' + stock + (stock === 1 ? ' boule restante' : ' boules restantes'));
    quickFeedButton.setAttribute('aria-pressed', String(feedMode));
}

function stockFil(id) {
    return journal.recharges[id] + (id === 'nylon' ? lignesRestantes : 0);
}

function totalLignes() {
    return TYPES_DE_FIL.reduce((total, fil) => total + stockFil(fil.id), 0);
}

function filEquipe() {
    return TYPES_DE_FIL.find(fil => fil.id === journal.ligne) || TYPES_DE_FIL[0];
}

function selectionnerFilDisponible() {
    if (stockFil(journal.ligne) > 0) { return; }
    journal.ligne = TYPES_DE_FIL.find(fil => stockFil(fil.id) > 0)?.id || 'nylon';
}

function debiterLigne() {
    const id = filEquipe().id;
    if (id === 'nylon' && lignesRestantes > 0) {
        lignesRestantes -= 1;
    } else if (journal.recharges[id] > 0) {
        journal.recharges[id] -= 1;
    }
    selectionnerFilDisponible();
    saveJournal();
    majLignes();
    renderBoutique();
}

function acheterRecharge(id) {
    const article = RECHARGES.find(recharge => recharge.id === id);
    if (!article || journal.experience < article.prix) { return false; }
    journal.experience -= article.prix;
    journal.recharges[id] += TAILLE_LOT;
    selectionnerFilDisponible();
    saveJournal();
    renderJournal();
    majLignes();
    return true;
}

lineSelect.addEventListener('change', () => {
    const id = lineSelect.value;
    if (floatState === 'idle' && castState === 'idle'
            && TYPES_DE_FIL.some(fil => fil.id === id) && stockFil(id) > 0) {
        journal.ligne = id;
        saveJournal();
    }
    lineSelect.value = journal.ligne;
});

// Compteur de la PARTIE en cours (la bourriche), distinct du carnet persistant
// (`journal.total` = total de toutes les parties).
let bourricheCount = 0;
// XP gagnée DANS LA PARTIE : repart à zéro à chaque JOUER. L'XP carrière
// (`journal.experience`) reste persistante pour la boutique (décision v97).
let experiencePartie = 0;
// Technique de pêche : 'bouchon' (flotteur) ou 'quiver' (scion de canne).
const modeQuiver = creerModeQuiver({ canvas: quiverCanvas, panel: quiverPanel });

const journalStore = (typeof localStorage !== 'undefined') ? localStorage : null;
const JOURNAL_KEY = 'peche_carnet_v1';

function loadJournal() {
    chargerCarnet({
        store: journalStore,
        key: JOURNAL_KEY,
        data: journal,
        bouchonsDepart: BOUCHONS_DE_DEPART,
        trouverFlotteur: trouverFlotteur,
        setFlotteur: function (id) { flotteurChoix = id; },
        getFlotteur: function () { return flotteurChoix; },
        scionsDepart: SCIONS_DE_DEPART,
        trouverScion: trouverScion,
        setScion: function (id) { scionChoix = id; }
    });
}

function saveJournal() {
    sauverCarnet({ store: journalStore, key: JOURNAL_KEY, data: journal });
}

function fmtPoids(value) {
    return (value < 1 ? value.toFixed(2) : value.toFixed(1)).replace('.', ',') + ' kg';
}

function renderJournal() {
    const nbEspeces = Object.keys(journal.especes).length;
    if (journal.total === 0) {
        journalStats.textContent = 'Aucune prise pour l’instant… Lance la canne !';
    } else {
        journalStats.textContent = 'Prises : ' + journal.total
            + ' · Poids total : ' + fmtPoids(journal.totalWeight)
            + ' · Record : ' + fmtPoids(journal.best)
            + ' · Espèces : ' + nbEspeces;
    }
    // Pas de appendChild ici : le carnet s'affiche en texte simple.
    journalList.textContent = journal.last.length
        ? journal.last.map(prise => '🐟 ' + prise.espece + ' — ' + fmtPoids(prise.kg)).join('\n')
        : '';
    // Fiche des espèces : nombre de prises et record pour chaque espèce attrapée.
    const nomsEspeces = Object.keys(journal.especes);
    journalEspeces.textContent = nomsEspeces.length
        ? nomsEspeces.map(nom => {
            const fiche = journal.especes[nom];
            return '🐟 ' + nom + ' — ' + fiche.n + (fiche.n > 1 ? ' prises' : ' prise')
                + ' · record ' + fmtPoids(fiche.record || 0);
        }).join('\n')
        : 'Attrape ton premier poisson pour remplir la fiche !';
    bourricheLabel.textContent = '🧺 Bourriche : ' + bourricheCount;
    // L'XP de partie repart à 0 ; l'XP carrière reste visible pour la boutique.
    xpLabel.textContent = '⭐ ' + experiencePartie + ' XP · ' + journal.experience + ' carrière';
    // Barre du haut : la version courte (l'XP de la partie en cours, comme le
    // score). Le détail « carrière » reste dans le menu.
    if (xpTop) { xpTop.textContent = '⭐ ' + experiencePartie + ' XP'; }
    shopXp.textContent = '⭐ ' + journal.experience + ' XP';
    // Le carnet a changé (XP, prises…) : la boutique doit se rafraîchir aussi,
    // sinon les boutons d'achat restent grisés alors qu'on a assez d'expérience.
    renderBoutique();
}

function addJournalEntry(weight, espece) {
    journal.total += 1;
    journal.totalWeight = Math.round((journal.totalWeight + weight) * 100) / 100;
    if (weight > journal.best) {
        journal.best = weight;
    }
    const nom = espece || 'Poisson';
    journal.last.unshift({ kg: Math.round(weight * 100) / 100, espece: nom });
    if (journal.last.length > 12) {
        journal.last.length = 12;
    }
    journal.especes[nom] = journal.especes[nom] || { n: 0, record: 0 };
    const fiche = journal.especes[nom];
    const ancienRecord = fiche.record || 0;
    fiche.n += 1;
    // Un record est BATTU si le poisson est plus lourd que le précédent (le
    // tout premier poisson d'une espèce établit son record).
    const nouveauRecord = weight > ancienRecord;
    if (nouveauRecord) {
        fiche.record = Math.round(weight * 100) / 100;
    }
    partieStats.poissons += 1;
    partieStats.poids = Math.round((partieStats.poids + weight) * 100) / 100;
    const ancienPartie = partieStats.records[nom] || 0;
    if (weight > ancienPartie) {
        partieStats.records[nom] = Math.round(weight * 100) / 100;
    }
    saveJournal();
    renderJournal();
    return { nouveauRecord: nouveauRecord, ancienRecord: ancienRecord };
}

const {
    xpPourPrise, gagnerExperience, bouchonPossede, acheterBouchon, perdreLeBouchon,
    renderBoutique, renderFicheTouches
} = creerBoutique({
    capaciteBouchon, journal, saveJournal, renderJournal, trouverFlotteur, flotteurCourant,
    BOUCHONS_DE_DEPART, setFloatType, FLOTTEURS, floatSelect, scionSelect, SCIONS, scionPossede,
    selectionnerFilDisponible, lineSelect, TYPES_DE_FIL, stockFil, majAmorce, boutique,
    RECHARGES, stockAmorce, TAILLE_LOT, sonarButton, boatButton, SONAR_PRICE, BATEAU_PRIX,
    ficheTouches, TOUCHES, acheterRecharge, sound, acheterSonar, acheterBateau, statusDisplay,
    ensureSound, setScion, acheterScion, trouverScion
});

let ZONES_CARTE = [
    { nom: 'Bord, près de la surface', min: -1.2, max: 0.1, couleur: '#4aa3c4' },
    { nom: 'Pleine eau', min: -2.4, max: -1.2, couleur: '#2e7f9c' },
    { nom: 'Le fond', min: -3.5, max: -2.4, couleur: '#1f5f7a' }
];
const {
    montrerOnglet, rendreCarteEtang
} = creerCarnetUI({
    tabPages, journalTabs, pondMap, POND_RADIUS, POND_CENTER, cheminContourEtang, FOND_BORD,
    FOND_CENTRE, FOSSES, lilyPads, BOURRICHE_POS, angler, floatGroup, SPECIES, profondeurLocale
});

const {
    renderEspece
} = creerFiches({
    FORMES, especeFiche, SPECIES, journal, TOUCHES_PAR_ID, fmtPoids, especePage, tabBtnEspeces,
    especePrev, especeNext
});

function showJournal() {
    fermerOutils();
    renderJournal();
    renderEspece();
    rendreCarteEtang();
    journalPanel.classList.add('open');
}

function hideJournal() {
    journalPanel.classList.remove('open');
}

function setDifficulty(mode) {
    const preset = DIFFICULTY_MODES[mode] || DIFFICULTY_MODES.normal;
    DIFFICULTY = preset.difficulty;
    BITE_WINDOW = preset.biteWindow;
    tangleChance = preset.tangleChance;
    if (difficultySelect.value !== mode) {
        difficultySelect.value = mode;
    }
}

const {
    startHoldingFish, setFishThrowPower, startFishThrow, releaseFishThrow, storeHeldFish,
    dropHeldFish, updateFishThrow
} = creerLancerPoisson({
    BOURRICHE_POS, angler, FISH_THROW_MIN, FISH_THROW_MAX, sound, floatGroup, floatIdle,
    fishButton, statusDisplay, feedGaugeFill, feedGauge, feedGaugeTarget, ensureSound,
    fishThrowLanding, wind, FISH_THROW_WIND, fishThrowOrigin, scene, scoreDisplay,
    addJournalEntry, gagnerExperience, fmtPoids, FISH_THROW_OSC, FISH_THROW_DURATION,
    BOURRICHE_RADIUS
});

let castState = 'idle';
let castPower = 0;
let castTargetPower = 0;
let castPhase = 0;
let ligneTendue = false;
let jeuDemelage = null;
let castAim = new THREE.Vector3(0, 0.1, -28);
const {
    risqueEmmelement, setCastPower, startCastCharge, moveCastAim, cancelCast, releaseCast,
    updateCast, updateCastAnimation
} = creerLancerCanne({
    filEquipe, angler, feedGaugeFill, totalLignes, feedGauge, feedGaugeTarget, ensureSound,
    statusDisplay, casserLigne, startCast, floatGroup, angleNormalise, rodLocalTip,
    CAST_YAW_ANGLER_MAX, CAST_YAW_ROD_MAX, rodPivot, CAST_SWING_CHARGE, CAST_SWING_RELEASE
});

let dragLoosened = false;
let TUTORIAL_STEPS = [
    { main: '👆', texte: 'Maintiens sur l’eau pour doser le lancer. Relâche, puis appuie sur « Tendre le fil » pendant qu’il vole : cela évite qu’il s’emmêle. En mode Facile, tu peux simplement laisser le fil se poser.' },
    { main: '✊', texte: 'Quand le bouchon mordille puis s’enfonce, clique vite pour ferrer le poisson : un seul essai !' },
    { main: '🔄', texte: 'Tourne la manivelle en cercle pour le ramener. Si la ligne est trop tendue, maintiens « Lâcher du fil ».' },
    { main: '🐟', texte: 'Garde le poisson en main et lance-le dans la bourriche 🧺 (comme l’amorce) pour le ranger dans ton carnet.' }
];
let tutorialStepIndex = 0;
const {
    setDragLoosened, openTutorial, closeTutorial, nextTutorialStep
} = creerFrein({
    dragButton, strugglePanel, ensureSound, sound, tutorialText, tutorialHand,
    tutorialStepDisplay, tutorialNext, tutorial, accueil, demarrerJeu, tutorialClose,
    tutorialOpen, hideJournal, journalButton, journalPanel, showJournal, journalClose,
    difficultySelect, setDifficulty, scionSelect, setScion, renderBoutique, floatSelect,
    setFloatType, effectsToggle, post, reflectionsToggle, reflections, waterReflectionTarget,
    setReflections, bigTextToggle, calmToggle, loadJournal, journal, appliquerTechniqueVisuelle,
    renderJournal
});

// ---------------------------------------------------------------------------
// Météo : beau temps → rafales → pluie. Le cycle est piloté par le TEMPS DE JEU
// (aucun tirage aléatoire) : le monde des tests reste donc reproductible.
// ---------------------------------------------------------------------------
const WEATHER_CYCLE = [
    { nom: 'beau', duree: 70, pluie: 0, rafales: 0 },
    { nom: 'rafales', duree: 45, pluie: 0, rafales: 1 },
    { nom: 'pluie', duree: 60, pluie: 1, rafales: 0.6 }
];
let weatherIndex = 0;
let weatherTimer = WEATHER_CYCLE[0].duree;
let weatherPluie = 0;
let weatherRafales = 0;
let rainRippleTimer = 0;
const GRIS_PLUIE = new THREE.Color(0x6b7a86);

function weatherName() {
    return WEATHER_CYCLE[weatherIndex].nom;
}

function setWeather(nom) {
    for (let i = 0; i < WEATHER_CYCLE.length; i++) {
        if (WEATHER_CYCLE[i].nom === nom) {
            weatherIndex = i;
            weatherTimer = WEATHER_CYCLE[i].duree;
            return;
        }
    }
}

// Gouttes de pluie : quelques centaines de points autour de l'étang.
const RAIN_COUNT = 700;
const rainPositions = new Float32Array(RAIN_COUNT * 3);
for (let i = 0; i < RAIN_COUNT; i++) {
    rainPositions[i * 3] = POND_CENTER.x - 60 + ((i * 37) % 120);
    rainPositions[i * 3 + 1] = -0.2 + ((i * 53) % 32);
    rainPositions[i * 3 + 2] = POND_CENTER.z - 60 + ((i * 71) % 120);
}
const rainGeometry = new THREE.BufferGeometry();
rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainMaterial = new THREE.PointsMaterial({
    color: 0xcfe6f5, size: 0.24, transparent: true, opacity: 0, depthWrite: false
});
const rainPoints = new THREE.Points(rainGeometry, rainMaterial);
rainPoints.frustumCulled = false;
scene.add(rainPoints);

function updateWeather(dt) {
    weatherTimer -= dt;
    if (weatherTimer <= 0) {
        weatherIndex = (weatherIndex + 1) % WEATHER_CYCLE.length;
        weatherTimer = WEATHER_CYCLE[weatherIndex].duree;
    }
    const cible = WEATHER_CYCLE[weatherIndex];
    const k = Math.min(1, dt * 0.5);
    weatherPluie += (cible.pluie - weatherPluie) * k;
    weatherRafales += (cible.rafales - weatherRafales) * k;

    // La pluie assombrit le ciel et la lumière (appelé APRÈS le cycle jour/nuit).
    if (weatherPluie > 0.01) {
        sunLight.intensity *= (1 - 0.5 * weatherPluie);
        ambientLight.intensity = Math.max(0.22, ambientLight.intensity - 0.15 * weatherPluie);
        skyLight.intensity += 0.12 * weatherPluie;
        skyMat.uniforms.topColor.value.lerp(GRIS_PLUIE, 0.5 * weatherPluie);
        skyMat.uniforms.bottomColor.value.lerp(GRIS_PLUIE, 0.35 * weatherPluie);
        scene.background.copy(skyMat.uniforms.bottomColor.value);
    }

    // Gouttes + ondulations sur l'eau.
    rainMaterial.opacity = weatherPluie * 0.75;
    if (weatherPluie > 0.02) {
        const pas = dt * 26;
        for (let i = 0; i < RAIN_COUNT; i++) {
            let y = rainPositions[i * 3 + 1] - pas;
            if (y < -0.2) {
                y = 30 + ((i * 13) % 12);
            }
            rainPositions[i * 3 + 1] = y;
        }
        rainGeometry.attributes.position.needsUpdate = true;
        rainRippleTimer -= dt;
        if (rainRippleTimer <= 0) {
            rainRippleTimer = 0.35;
            const a = rainRippleTimer * 37 + weatherPluie * 11;
            spawnRipple(new THREE.Vector3(
                POND_CENTER.x + Math.cos(a) * 18, 0.06, POND_CENTER.z + Math.sin(a) * 18));
        }
    }
    sound.setRain(weatherPluie);
}

// ---------------------------------------------------------------------------
// Vie ambiante : oiseaux, libellules et poisson qui saute.
// ---------------------------------------------------------------------------
const birds = [];
for (let i = 0; i < 3; i++) {
    const bird = new THREE.Group();
    const corps = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.9 })
    );
    corps.scale.set(1.8, 0.7, 0.8);
    bird.add(corps);
    const ailes = [];
    for (let c = -1; c <= 1; c += 2) {
        const aile = new THREE.Mesh(
            new THREE.PlaneGeometry(2.2, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.9, side: THREE.DoubleSide })
        );
        aile.position.set(0, 0.1, c * 1.1);
        bird.add(aile);
        ailes.push({ mesh: aile, cote: c });
    }
    bird.userData.ailes = ailes;
    bird.userData.phase = i * 2.1;
    scene.add(bird);
    birds.push(bird);
}

const libellules = [];
for (let i = 0; i < 3; i++) {
    const lib = new THREE.Group();
    const corps = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5),
        new THREE.MeshStandardMaterial({ color: 0x2f6f8f, roughness: 0.6 })
    );
    corps.rotation.z = Math.PI / 2;
    lib.add(corps);
    for (let c = -1; c <= 1; c += 2) {
        lib.add(new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.28),
            new THREE.MeshStandardMaterial({
                color: 0xd9f2ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide
            })
        ));
    }
    lib.userData.phase = i * 1.7;
    scene.add(lib);
    libellules.push(lib);
}

// Poisson qui saute hors de l'eau (un seul, réutilisé).
const sauteur = new THREE.Group();
sauteur.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xb9c6c0, roughness: 0.4, metalness: 0.3 })
));
sauteur.visible = false;
scene.add(sauteur);
let sautT = -1;
let sautTimer = 26;
let oiseauTimer = 14;

function updateAmbiante(dt, time) {
    for (let i = 0; i < birds.length; i++) {
        const bird = birds[i];
        const p = bird.userData.phase;
        bird.position.set(
            Math.cos(time * 0.06 + p) * 70,
            24 + Math.sin(time * 0.3 + p) * 2.5,
            -60 + Math.sin(time * 0.06 + p) * 45);
        bird.rotation.y = -time * 0.06 - p + Math.PI / 2;
        const battement = Math.sin(time * 9 + p) * 0.7;
        bird.userData.ailes.forEach(a => { a.mesh.rotation.x = a.cote * (0.2 + battement); });
    }
    for (let i = 0; i < libellules.length; i++) {
        const lib = libellules[i];
        const p = lib.userData.phase;
        lib.position.set(
            POND_CENTER.x + Math.sin(time * 0.9 + p) * 14 + Math.sin(time * 3.1 + p) * 1.5,
            1.2 + Math.sin(time * 2.3 + p) * 0.5,
            POND_CENTER.z + 18 + Math.cos(time * 0.7 + p * 1.3) * 9);
        lib.rotation.y = Math.sin(time * 2 + p) * 0.6;
    }
    if (sautT < 0) {
        sautTimer -= dt;
        if (sautTimer <= 0) {
            sautTimer = 24 - weatherPluie * 8;
            sautT = 0;
            sauteur.position.set(POND_CENTER.x + 8, 0.1, POND_CENTER.z + 22);
            sauteur.visible = true;
            sound.jump();
            spawnRipple(sauteur.position);
        }
    } else {
        sautT += dt;
        const duree = 1.1;
        const t = Math.min(1, sautT / duree);
        sauteur.position.y = 0.1 + Math.sin(Math.PI * t) * 2.6;
        sauteur.rotation.x = -Math.sin(Math.PI * t) * 1.2;
        if (sautT >= duree) {
            sautT = -1;
            sauteur.visible = false;
            sound.retombe();
            spawnRipple(sauteur.position);
        }
    }
    oiseauTimer -= dt;
    if (oiseauTimer <= 0) {
        oiseauTimer = 16 + weatherPluie * 10;
        if (weatherPluie < 0.4) {
            sound.birds();
        }
    }
}

// ---------------------------------------------------------------------------
// Bulles : le seul indice de la présence des poissons sous l'eau.
// ---------------------------------------------------------------------------
const bubbles = [];
const bubbleGeo = new THREE.SphereGeometry(0.06, 6, 6);
const bubbleMat = new THREE.MeshBasicMaterial({
    color: 0xdff3ff, transparent: true, opacity: 0.65, depthWrite: false
});

function spawnBubbles(position, count) {
    if (bubbles.length > 70) {
        return;
    }
    for (let i = 0; i < count; i++) {
        const bulle = new THREE.Mesh(bubbleGeo, bubbleMat);
        bulle.position.set(
            position.x + ((i * 7) % 3 - 1) * 0.16,
            Math.max(-3.4, position.y),
            position.z + ((i * 5) % 3 - 1) * 0.16);
        bulle.userData.vy = 0.7 + (i % 3) * 0.25;
        scene.add(bulle);
        bubbles.push({ mesh: bulle, t: 0 });
    }
}

function updateBubbles(dt) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.t += dt;
        b.mesh.position.y += b.mesh.userData.vy * dt;
        if (b.mesh.position.y > 0.05 || b.t > 2.4) {
            scene.remove(b.mesh);
            bubbles.splice(i, 1);
        }
    }
}

// ---------------------------------------------------------------------------
// Poissons : population, fabrique 3D, bancs et spécimens — module dédié.
// Créé ICI : il peuple l’étang à la construction (mêmes tirages qu’avant).
// ---------------------------------------------------------------------------
const { fishes, styleEspece, makeFish, spawnFish, randomFishPosition,
    poidsRealisteKilos, setHorsNormeChance, getHorsNormeChance,
    distributionAttendue, comportementRand, repeuplerEtang, punishFish,
    PROIES_CARNASSIERS, CARNASSIERS, PREDATOR_ATTACK_RADIUS,
    PREDATOR_ATTACK_ADVANTAGE } = creerPoissons({
    scene: scene,
    rand: rand,
    rayonEtang: rayonEtang,
    POND_CENTER: POND_CENTER,
    fondY: fondY
});

// ---------------------------------------------------------------------------
// État du jeu
// ---------------------------------------------------------------------------
let score = 0;
let fishCaught = false;
let castT = 0;
let waitTimer = 0;
let reelIdle = 0;                // secondes sans toucher la manivelle pendant la remontée
let avertiRemontee = false;      // a-t-on prévenu de la remontée automatique ?
let hameconDansLaVase = false;   // hameçon posé dans la vase (profondeur trop grande)
let depuisLancement = 99;        // temps écoulé depuis que le bouchon s'est posé
let biteFish = null;
let biteCooldown = 0;
let biteViewActive = false;
// Phases de la touche : le joueur suit son bouchon DE LOIN (vue réaliste).
//   'floating' = le bouchon flotte (rien ne mord)
//   'fausse'   = fausse touche (le bouchon bouge, mais ce n'est pas LE moment)
//   'touche'   = la VRAIE touche (fenêtre de ferrage)
//   'ratee'    = la fenêtre est passée (dernière chance de ferrer)
let bitePhase = 'floating';
let biteViewTimer = 0;
let biteSinkAt = 0;
let biteViewHideTimer = -1;         // fermeture différée de la touche (après un raté)
let biteNibbleTimer = 0;
let biteTouche = null;              // la VRAIE touche en cours (objet du catalogue)
let biteFauxTouche = null;          // la fausse touche en cours
let biteStyle = null;               // style de combat du poisson qui a mordu
const biteOrigine = new THREE.Vector3();  // position du bouchon au début du mouvement
let biteRetourY = 0.1;              // hauteur du bouchon quand la fenêtre se referme
let biteRetourRot = 0;              // inclinaison à ce moment-là
let biteSignauxRestants = 1;
let biteSignalTimer = 0;
let biteSignalDuree = 0.5;
let biteFenetre = 0.4;              // durée de la fenêtre de ferrage
let strikeQuality = '';             // '' | 'parfait' | 'tot' | 'tard'
let fightAdvantage = 1;             // < 1 = avantage au joueur, > 1 = au poisson
// Fenêtre pour ferrer : temps pendant lequel le bouchon s'enfonce avant que le
// poisson ne recrache l'hameçon. Plus elle est courte, plus le ferrage est dur.
let BITE_WINDOW = 0.7;
// Le poisson mordille le bouchon avant de l'enfoncer : le joueur est prévenu.
const BITE_NIBBLE_DURATION = 0.6;
// Durée pendant laquelle on laisse « Trop tard ! » affiché après une touche
// ratée. Comptée par la boucle de jeu (et plus courte que le temps de
// récupération) pour ne jamais refermer une NOUVELLE touche par erreur.
const BITE_VIEW_LINGER = 0.7;
// ---------------------------------------------------------------------------
// CATALOGUE DES TOUCHES — comment bouge un VRAI bouchon
// ---------------------------------------------------------------------------
// Comme au bord de l'eau, le bouchon est plombé : seule sa tige dépasse. Un
// poisson qui SOULÈVE l'appât fait monter le bouchon (« ascenseur ») ; un poisson
// qui tire vers le fond ou de côté le fait plonger ou partir. Tant qu'il ne fait
// que renifler, tapoter ou frôler la ligne, le bouchon ne fait que frémir :
// CE N'EST PAS LE MOMENT de ferrer. Tout le jeu est de reconnaître le dessin…
//
//   forme  : dessin du mouvement (voir mouvementDeTouche)
//   a      : amplitude (unités ; le bouchon mesure ~3,5 unités avec sa tige)
//   duree  : durée du mouvement (s) — long = poisson calme, court = poisson vif
//   rot    : inclinaison maximale (radians ; 1,35 ≈ couché sur le côté)
//   derive : déplacement latéral (unités)
//   vrai   : faut-il FERRER quand on voit ça ?
//   famille: 'enfoncement' | 'remontee' | 'couchage' | 'derive' | 'fausse'
//   qui    : quels poissons font ça ('tous' | 'petit' | 'gros' | 'vif')


// Vitesse globale des touches : réglage unique qui accélère (ou ralentit) TOUS
// les mouvements du bouchon. < 1 = plus rapide. Les dessins restent les mêmes.
// 0.32 : le bouchon RÉAGIT COMME EN VRAI — une touche se joue en 0,1 à 0,25 s,
// un simple tapotement en un demi-seconde. C'est la PAUSE entre deux mouvements
// qui est longue (jusqu'à 8 s), pas le mouvement lui-même.
const VITESSE_TOUCHES = 0.32;

function dureeTouche(touche) {
    // Plancher très bas : une vraie touche doit pouvoir se jouer en ~0,1 s,
    // exactement comme un bouchon qui disparaît sous l'eau.
    return Math.max(0.1, (touche.duree || 1) * VITESSE_TOUCHES);
}

// Dessine le mouvement d'une touche : `p` va de 0 (début) à 1 (fin).
// Renvoie un déplacement { y, rot, dx, dz }. Tout est LISSE : aucun à-coup.
//   lisse = 0 → 1 → 0 (le bouchon revient)   tenue = 0 → 1 (il reste)
function mouvementDeTouche(touche, p, bouchonCourt) {
    const a = touche.a || 0;
    const rot = touche.rot || 0;
    const der = touche.derive || 0;
    const lisse = Math.sin(Math.PI * p);
    const tenue = Math.sin(Math.PI * 0.5 * p);
    const coups = touche.coups || 3;
    // « Sautillement » : les petits coups secs sur l'eau (fréquence élevée). Chaque
    // touche a SA fréquence, SON inclinaison et SA dérive : impossible de les
    // confondre à l'œil.
    const sautille = Math.abs(Math.sin(Math.PI * coups * p));
    switch (touche.forme) {
        case 'frisson':
            // Vibration serrée : le bouchon tremble sans s'enfoncer.
            return { y: -a * sautille * Math.min(1, p * 5) * Math.min(1, (1 - p) * 5),
                rot: rot * sautille * 0.6 };
        case 'pulse':
            return { y: -a * sautille * lisse, rot: rot * sautille * lisse };
        case 'sinus':
            return { y: -a * lisse };
        case 'double':
            return { y: -a * Math.abs(Math.sin(Math.PI * 2 * p)) * lisse,
                rot: rot * Math.abs(Math.sin(Math.PI * 2 * p)) * lisse };
        case 'hesitation':
            return { y: -a * lisse * (0.65 + 0.35 * Math.sin(Math.PI * 3 * p)),
                rot: rot * lisse };
        case 'derive':
            return { y: -a * lisse, dx: der * lisse, dz: der * 0.35 * lisse, rot: rot * lisse };
        case 'tourner':
            return { y: -a * lisse, dx: der * Math.sin(2 * Math.PI * p),
                dz: der * (1 - Math.cos(2 * Math.PI * p)) * 0.5,
                rot: rot * Math.sin(2 * Math.PI * p) };
        case 'couchage_retour':
            return { y: a * 0.3 * lisse, rot: rot * lisse };
        case 'couchage':
            return { y: a * tenue, rot: rot * tenue };
        case 'montee':
            if (bouchonCourt) {
                // Un bouchon court ne peut pas « sortir sa tige » : il se couche.
                return { y: a * 0.25 * tenue, rot: Math.min(1.35, 1.2 * tenue) };
            }
            return { y: a * tenue, rot: rot * tenue };
        case 'montee_retour':
            if (bouchonCourt) {
                return { y: a * 0.2 * lisse, rot: 1.1 * lisse };
            }
            return { y: a * lisse };
        case 'descente_lente':
            // Il s'enfonce de plus en plus vite : le gros poisson part avec l'esche.
            return { y: -a * p * p, rot: rot * p };
        case 'file':
            return { y: -a * tenue, dx: der * tenue, dz: der * 0.4 * tenue, rot: rot * tenue };
        case 'descente':
        default:
            return { y: -a * tenue, rot: rot * tenue };
    }
}

// Applique un mouvement au bouchon (hauteur, inclinaison, dérive avec le vent).
function appliquerMouvement(m) {
    // QUIVER : le mouvement du poisson se lit sur le scion, pas sur un bouchon.
    if (techniqueCourante === 'quiver') {
        modeQuiver.appliquer(m);
        return;
    }
    floatGroup.position.y = 0.1 + (m.y || 0);
    floatGroup.rotation.z = m.rot || 0;
    if (m.dx || m.dz) {
        const c = Math.cos(wind.dir);
        const s = Math.sin(wind.dir);
        floatGroup.position.x = biteOrigine.x + (m.dx || 0) * c - (m.dz || 0) * s;
        floatGroup.position.z = biteOrigine.z + (m.dx || 0) * s + (m.dz || 0) * c;
    }
}

// Chaque poisson a ses habitudes : un petit poisson « tapote », un gros « coule »
// lentement ou se couche, un poisson vif emporte l'esche.
function profilPoisson(taille, agressivite) {
    if (taille < 0.55) {
        return 'petit';
    }
    return (agressivite > 1.05) ? 'vif' : 'gros';
}

// Tire une touche du catalogue : vraie ou fausse, selon le poisson.
function choisirTouche(vrai, taille, agressivite, style) {
    // 1) Les touches PROPRES À L'ESPÈCE : un brochet emporte l'esche d'un coup,
    //    une tanche la soulève, une ablette la tapote, une carpe la coule
    //    lentement… C'est ce qui rend chaque poisson reconnaissable.
    if (style) {
        const ids = vrai ? style.touchesVraies : style.touchesFausses;
        const poolEspece = ids.map(function (id) {
            return TOUCHES_PAR_ID[id];
        }).filter(function (t) {
            return t && t.vrai === vrai;
        });
        if (poolEspece.length) {
            return poolEspece[Math.floor(rand() * poolEspece.length)];
        }
    }
    // 2) Sinon, le profil générique de taille / agressivité.
    const profil = profilPoisson(taille, agressivite);
    let pool = TOUCHES.filter(function (t) {
        // « explicite » : cette touche n'est jouée que dans son cas particulier
        // (la touche à la volée, juste après le lancer).
        return t.vrai === vrai && !t.explicite && (t.qui === 'tous' || t.qui === profil);
    });
    if (!pool.length) {
        pool = TOUCHES.filter(function (t) { return t.vrai === vrai; });
    }
    return pool[Math.floor(rand() * pool.length)];
}

let tension = 0.5;
let struggle = null;
let struggleTimeLeft = 0;
let snag = null;
let hookedFish = null;
let escaped = false;
let timeoutEscape = false;
let shake = 0;
let baitInterest = false;   // un poisson renifle-t-il l'hameçon (retour visuel) ?
let nibblePhase = 0;        // avancement du « mordillement » en cours (0 = aucun)
// Mordillements ALÉATOIRES : petits coups, durées et intervalles varient. On
// utilise un générateur LOCAL pour ne PAS consommer le hasard du monde (les
// tests restent reproductibles et le reste du jeu ne change pas).
let nibbleRngState = 0x9e3779b9 >>> 0;
let nibbleSuivant = 0;      // délai avant le prochain mordillement
let nibbleDebut = -1;       // -1 = aucun mordillement en cours
let nibbleDuree = 0;
let nibbleAmplitude = 0;
let nibbleInteretAvant = false;

function nibbleRand() {
    nibbleRngState = (nibbleRngState + 0x6d2b79f5) >>> 0;
    let t = nibbleRngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
let caughtWeight = 0;
let lineBrokenTimer = 0;
let snagFreed = false;
const castStart = new THREE.Vector3();
const castTarget = new THREE.Vector3();
const CAST_DURATION = 1.2;
const MAX_WAIT = 20;        // sans poisson, la ligne remonte toute seule (securite)

// Morsure : le poisson doit venir renifler l'hameçon — donc s'approcher visiblement
// du bouchon ET remonter jusqu'à lui depuis sa profondeur. La morsure se décide
// sur la distance RÉELLE en 3D à l'hameçon, pas seulement à l'aplomb du bouchon.
const BITE_INTEREST_RADIUS = 7;    // à cette distance, le poisson s'intéresse au bouchon
const BITE_RADIUS = 0.9;           // distance 3D en dessous de laquelle il mord
const BITE_APPROACH_ACCEL = 4.5;   // vitesse d'approche maximale (unités/s)
// Remontée de la ligne : si le joueur ne touche plus à la manivelle pendant
// REEL_IDLE_HELP secondes, la ligne revient toute seule (REEL_AUTO unités/s).
const REEL_IDLE_HELP = 3;
const REEL_AUTO = 6;

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2(0, 0);

function waterPointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObject(water);
    return hits.length ? hits[0].point.clone() : null;
}

function startCast(target) {
    if (partieTerminee || totalLignes() === 0) { return; }
    if (floatState !== 'idle') {
        return;
    }
    castStart.copy(rodTipVisual);
    castSwingDepart = castSwing;
    castTarget.copy(target);
    castTarget.x += Math.cos(wind.dir) * wind.strength * 2.5;
    castTarget.z += Math.sin(wind.dir) * wind.strength * 2.5;
    castTarget.y = 0.1;
    const wdx = castTarget.x - POND_CENTER.x;
    const wdz = castTarget.z - POND_CENTER.z;
    const wd = Math.hypot(wdx, wdz);
    const maxR = rayonEtang(Math.atan2(wdz, wdx)) - 2;
    if (wd > maxR) {
        castTarget.x = POND_CENTER.x + (wdx / wd) * maxR;
        castTarget.z = POND_CENTER.z + (wdz / wd) * maxR;
    }
    castT = 0;
    fishCaught = false;
    ligneTendue = false;
    // Un nouveau lancer = une nouvelle chance : le poisson peut prendre
    // l'esche « à la volée » dès que le bouchon touche l'eau.
    biteCooldown = 0;
    floatState = 'flying';
    updateToolDock();
    const peutEmmeler = risqueEmmelement() > 0;
    fishButton.disabled = !peutEmmeler;
    fishButton.hidden = !peutEmmeler;
    fishButton.textContent = 'Tendre le fil';
    statusDisplay.textContent = peutEmmeler
        ? 'Lancer… appuie sur « Tendre le fil » avant l’arrivée dans l’eau.'
        : 'Lancer… la ligne va se poser.';
    sound.cast();
    sound.playFouet();
}

// Clic pendant le vol : on tend la ligne avant que le bouchon ne se pose.
function tendreLigneAuLancer() {
    if (floatState !== 'flying' || ligneTendue || risqueEmmelement() === 0) {
        return false;
    }
    ligneTendue = true;
    spawnFloatingText('Ligne tendue !', castTarget, '#7ed957');
    fishButton.disabled = true;
    fishButton.textContent = '✓ Fil tendu';
    statusDisplay.textContent = 'Ligne tendue ! Le lancer est sécurisé.';
    sound.reel();
    return true;
}

// Démarre le mini-jeu de démêlage (appelé quand le lancer n'a pas été tendu).
function demarrerEmmElement() {
    if (partieTerminee) { return; }
    if (hookedFish) {
        hookedFish.userData.hooked = false;
        hookedFish.visible = false;
        hookedFish = null;
    }
    if (biteFish) {
        biteFish.userData.biting = false;
        biteFish.visible = false;
        biteFish = null;
    }
    if (struggle) {
        struggle = null;
        struggleTimeLeft = 0;
        fermerPanneauCombat();
        setDragLoosened(false);
    }
    if (snag) { snag = null; }
    biteViewActive = false;
    hideBiteView();
    floatState = 'tangle';
    floatGroup.position.copy(castTarget);
    floatGroup.visible = true;
    floatGroup.rotation.z = 0;
    crank.classList.remove('active');
    feedButton.classList.remove('active');
    fishButton.disabled = true;
    if (jeuDemelage) { jeuDemelage.ouvrir(); }
    spawnFloatingText('🧶 Ligne emmêlée !', floatGroup.position, '#ffb347');
    sound.escape();
    statusDisplay.textContent = '🧶 Ligne emmêlée ! Suis le fil du départ à l’arrivée.';
}

// Étapes où la manivelle est utile : dès que la ligne est à l'eau (pour ramener
// la ligne et relancer où l'on veut), pendant le combat et pendant la remontée.
const CRANK_STATES = ['inWater', 'reeling', 'struggle'];

function updateCrankVisibility() {
    crank.classList.toggle('active', CRANK_STATES.indexOf(floatState) >= 0);
}

function startReel(automatique) {
    if (floatState === 'inWater') {
        floatState = 'reeling';
        reelIdle = 0;
        hameconDansLaVase = false;
        avertiRemontee = false;
        const support = techniqueCourante === 'quiver'
            ? 'la ligne est toujours à l’eau'
            : 'le bouchon est toujours à l’eau';
        statusDisplay.textContent = automatique
            ? 'Aucun poisson en ' + MAX_WAIT + ' s : la ligne a été remontée TOUTE SEULE. Relance (ou amorce pour attirer les poissons !).'
            : 'On remonte la ligne… (' + support + ' : un poisson peut encore mordre !)';
    }
}

// Un poisson mord quand il est réellement arrivé sur l'hameçon (distance 3D) :
// il a donc dû s'approcher du bouchon ET remonter vers la surface (voir updateFish).
function findBitingFish() {
    if (fishCaught) {
        return null;
    }
    let best = null;
    let bestDist = BITE_RADIUS * BITE_RADIUS;
    for (let i = 0; i < fishes.length; i++) {
        const fish = fishes[i];
        const data = fish.userData;
        if (data.hooked || data.biting) {
            continue;
        }
        // Seuls les poissons dont la tranche d'eau contient l'hameçon peuvent mordre.
        const zone = data.profondeurZone;
        if (!hameconDansZone(data, zone)) {
            continue;
        }
        const dx = fish.position.x - floatGroup.position.x;
        const dy = (fish.position.y + data.topOffset) - HOOK_DEPTH;
        const dz = fish.position.z - floatGroup.position.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bestDist) {
            bestDist = d2;
            best = fish;
        }
    }
    return best;
}

function endCast() {
    if (fishCaught) {
        score++;
        scoreDisplay.textContent = score;
        showCatchMessage(caughtWeight);
        sound.catchFish();
        statusDisplay.textContent = 'Poisson attrapé ! ' + fmtPoids(caughtWeight) + ' (+1) 🎣';
        fishCaught = false;
    } else if (snagFreed) {
        statusDisplay.textContent = 'Ligne dégagée ! Tu peux relancer.';
        snagFreed = false;
    } else if (escaped) {
        sound.escape();
        statusDisplay.textContent = timeoutEscape ? 'Temps écoulé ! Le poisson s’est décroché.' : 'Le poisson s’est détaché ! Réessaie.';
        escaped = false;
        timeoutEscape = false;
    } else {
        statusDisplay.textContent = 'Rien cette fois… clique sur l’eau pour relancer.';
    }
}

let catchMessageTimer = null;
let recordBattu = null;
let struggleAnchor = new THREE.Vector3(rodTip.x, 0, rodTip.z);
let strugglePos = new THREE.Vector3(rodTip.x, 0.1, rodTip.z);
const {
    updateStruggleBar, showCatchMessage, annoncerRecord, tenterAttaquePredateur, showBiteView,
    hideBiteView, hookFish, updateBiteView, appliquerClicUtile, snagPret, reelClick,
    updateStruggle
} = creerCombat({
    struggleMarker, REEL_PER_TURN, struggleTimer, catchMessage, fmtPoids, sound, BOURRICHE_POS,
    statusDisplay, castTarget, STRUGGLE_MIN_FACTOR, STRUGGLE_SPAN, POND_CENTER, rayonEtang,
    capaciteBouchon, styleEspece, floatGroup, STRUGGLE_MAX_FACTOR, filEquipe, setDragLoosened,
    strugglePanel, struggleInfo, struggleHint, strugglePortrait, SPECIES, dessinerPortrait,
    fishButton, PROIES_CARNASSIERS, PREDATOR_ATTACK_RADIUS, fishes, CARNASSIERS,
    PREDATOR_ATTACK_ADVANTAGE, flotteurCourant, rand, TOUCHES_PAR_ID, choisirTouche, biteOrigine,
    rodTipVisual, setFloatOpacity, modeQuiver, punishFish, dureeTouche, appliquerMouvement,
    mouvementDeTouche, BITE_VIEW_LINGER, majIndiceSnag, fermerPanneauCombat, consumeCrankTurns,
    vitesseMaxTours
});

// ---------------------------------------------------------------------------
// Accrochage dans les nénuphars
// ---------------------------------------------------------------------------
function isSnagged(point) {
    for (let i = 0; i < lilyPads.length; i++) {
        const pad = lilyPads[i];
        const dx = point.x - pad.x;
        const dz = point.z - pad.z;
        const r = pad.radius + 0.5;
        if (dx * dx + dz * dz < r * r) {
            return true;
        }
    }
    return false;
}

function startSnag(mode) {
    floatState = 'snag';
    const dansLaVase = mode === 'fond';
    tension = dansLaVase ? 0.55 : 0.5;
    // Deux accrochages, deux difficultés :
    //  - NÉNUPHARS : on clique vite, c'est facile (clickCooldown = 0).
    //  - VASE : elle ASPIRE. Un clic n'est utile que toutes les 0,32 s ; il faut
    //    tenir un rythme (~3 clics/s) pendant plusieurs secondes, sinon la
    //    tension monte et la ligne casse.
    snag = dansLaVase ? {
        dansLaVase: true,
        // La vase tire un peu moins fort qu'avant : ses à-coups rendaient la
        // sortie injuste (on pouvait perdre la ligne en cliquant correctement).
        pullRate: 0.08,
        burstStrength: 0.08,
        burstInterval: 0.9,
        burstTimer: 0.9,
        // Chaque clic utile détend un peu plus la ligne qu'avant : la sortie de
        // vase dure ~3 s de clics réguliers au lieu de ~4 s.
        clickPower: 0.12,
        clickCooldown: 0.32,
        enAttente: false,       // clic arrivé trop tôt : gardé, pas perdu
        elapsed: 0,
        lastClick: -1,
        clics: 0,
        clicsUtiles: 0
    } : {
        dansLaVase: false,
        pullRate: 0.12,
        burstStrength: 0.10,
        burstInterval: 1.1,
        burstTimer: 1.1,
        clickPower: 0.10,
        clickCooldown: 0,
        enAttente: false,
        elapsed: 0,
        lastClick: -1,
        clics: 0,
        clicsUtiles: 0
    };
    snagIndicePret = null;
    strugglePanel.classList.add('active');
    strugglePanel.classList.add('snagging');
    sound.snag();
    struggleInfo.textContent = dansLaVase ? 'Hameçon accroché dans la vase' : 'Ligne accrochée aux nénuphars';
    if (strugglePortrait) { strugglePortrait.hidden = true; }
    portraitEspeceCourante = null;
    struggleTimer.textContent = '';
    struggleTimer.classList.remove('urgent');
    struggleHint.textContent = dansLaVase
        ? 'La vase aspire : clique en rythme (environ 3 fois par seconde) !'
        : 'Clique vite pour dégager la ligne !';
    struggleHint.hidden = false;
    majIndiceSnag();
    updateStruggleBar();
    fishButton.disabled = false;
    fishButton.textContent = 'Dégager !';
    fishButton.hidden = false;
    statusDisplay.textContent = dansLaVase
        ? 'Ton hameçon s’est enfoncé dans la vase ! Tire en rythme (≈ 3 clics/s) pour le dégager, puis règle une ligne moins profonde.'
        : 'La ligne s’est accrochée aux nénuphars ! Clique pour la dégager.';
}

// Indique au joueur s'il peut cliquer (vase) ou s'il doit laisser le fil se
// détendre. N'affiche rien pour les nénuphars (pas de temps de récupération).
let snagIndicePret = null;
function majIndiceSnag() {
    if (!snag || !snag.dansLaVase) {
        return;
    }
    const pret = (snag.elapsed - snag.lastClick) >= snag.clickCooldown;
    if (pret === snagIndicePret) {
        return;
    }
    snagIndicePret = pret;
    // Le clic n'est jamais perdu (il attend son tour) : on encourage au lieu de
    // gronder le joueur.
    struggleHint.textContent = pret
        ? 'La vase aspire : clique en rythme (environ 3 fois par seconde) !'
        : 'La ligne se détend… ton clic est gardé, continue !';
    if (fishButton.classList) {
        fishButton.classList.toggle('cooldown', !pret);
    }
}

function endSnag(freed) {
    fermerPanneauCombat();
    fishButton.hidden = true;
    if (fishButton.classList) {
        fishButton.classList.remove('cooldown');
    }
    snag = null;
    snagIndicePret = null;
    if (freed) {
        snagFreed = true;
        statusDisplay.textContent = 'Ligne dégagée ! On la ramène.';
        floatState = 'reeling';
    } else {
        debiterLigne();
        sound.lineBreak();
        floatGroup.visible = false;
        lineBrokenTimer = 1.2;
        floatState = 'broken';
        // Le bouchon part avec la ligne : s'il avait été acheté, il est PERDU.
        const perdu = perdreLeBouchon();
        if (perdu) {
            statusDisplay.textContent = 'La ligne a cassé ! Ton bouchon « ' + perdu.nom
                + ' » est perdu… tu repêches avec le bouchon de départ.';
            spawnFloatingText('Bouchon perdu !', floatGroup.position, '#ff6b6b');
        } else {
            statusDisplay.textContent = 'La ligne a cassé ! Le bouchon est perdu… (un bouchon de départ : sans regret).';
        }
    }
    if (!freed && totalLignes() === 0) { terminerPartie(); }
}

function updateSnag(dt) {
    if (floatState !== 'snag' || !snag) {
        return;
    }
    snag.elapsed += dt;
    // Clic mis en attente : il part dès que la ligne a eu le temps de se
    // détendre. Le rythme (~3 clics/s) reste obligatoire, mais plus aucun clic
    // n'est perdu.
    if (snag.enAttente && snagPret()) {
        snag.enAttente = false;
        appliquerClicUtile();
    }
    if (tension <= 0) {
        tension = 0;
        updateStruggleBar();
        endSnag(true);
        return;
    }
    tension += snag.pullRate * dt;
    snag.burstTimer -= dt;
    if (snag.burstTimer <= 0) {
        tension += snag.burstStrength;
        snag.burstTimer = snag.burstInterval * (0.7 + rand() * 0.6);
        shake = 0.12;
    }
    if (tension >= 1) {
        tension = 1;
        updateStruggleBar();
        endSnag(false);
        return;
    }
    majIndiceSnag();
    updateStruggleBar();
}

const {
    ripples, spawnRipple, updateRipples,
} = creerOndulations({
    scene: scene,
});

const {
    floatingTexts, spawnFloatingText, updateFloatingTexts, missRings, updateMissRings,
    signalerToucheRatee,
} = creerMessages({
    canvas: canvas,
    scene: scene,
});

const {
    spawnSplash, updateSplashes,
} = creerSplashes({
    scene: scene,
});

// ---------------------------------------------------------------------------
// Mise à jour
// ---------------------------------------------------------------------------
function updateWind(dt) {
    wind.timer -= dt;
    if (wind.timer <= 0) {
        wind.targetDir = rand() * Math.PI * 2;
        wind.targetStrength = rand() * 0.8;
        wind.timer = 6 + rand() * 6;
    }
    const lerpFactor = 1 - Math.pow(0.1, dt);
    let diff = wind.targetDir - wind.dir;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    wind.dir += diff * lerpFactor;
    wind.strength += (wind.targetStrength - wind.strength) * lerpFactor;

    // Rafales : la météo peut renforcer le vent par moments (toujours < 1).
    wind.clock = (wind.clock || 0) + dt;
    if (weatherRafales > 0.01) {
        const rafale = weatherRafales * (0.30 + 0.30 * Math.sin(wind.clock * 2.3));
        wind.strength = Math.min(0.95, wind.strength + rafale * dt * 0.9);
    }

    vaneArrow.rotation.y = -wind.dir;
    windFill.style.width = (wind.strength * 100).toFixed(0) + '%';
    windArrow.style.transform = 'rotate(' + (wind.dir * 180 / Math.PI).toFixed(0) + 'deg)';
    sound.setWind(wind.strength);
    updateFauneSonore(dt);
}

// Ambiance vivante : la nuit les grenouilles et les grillons chantent en continu ;
// le jour un héron, un martin-pêcheur, une corneille ou un canard se font entendre
// de loin en loin (intervalles aléatoires, sans toucher au hasard du monde).
let delaiFaune = 12;
function updateFauneSonore(dt) {
    const jour = Math.max(0, Math.sin(dayPhase * Math.PI * 2));
    sound.setNuit(1 - Math.min(1, jour * 1.6));
    delaiFaune -= dt;
    if (delaiFaune > 0) { return; }
    delaiFaune = 9 + Math.random() * 18;
    if (jour < 0.15) { return; }
    const r = Math.random();
    if (r < 0.3) { sound.playHeron(); }
    else if (r < 0.55) { sound.playMartinPecheur(); }
    else if (r < 0.8) { sound.playCorneille(); }
    else { sound.playCanard(); }
}

function updateClouds(dt) {
    const speed = 2 + wind.strength * 4;
    clouds.forEach(cloud => {
        cloud.position.x += Math.cos(wind.dir) * speed * dt;
        cloud.position.z += Math.sin(wind.dir) * speed * dt;
        if (cloud.position.x > 130) cloud.position.x = -130;
        if (cloud.position.x < -130) cloud.position.x = 130;
        if (cloud.position.z > -50) cloud.position.z = -190;
        if (cloud.position.z < -190) cloud.position.z = -50;
    });
}

// Le mouvement augmente vers la queue et se propage avec un déphasage le
// long du corps. La caudale suit la même translation que son point d'attache.
function animateFishMesh(data, phase, amplitude) {
    const positions = data.bodyMesh.geometry.getAttribute('position');
    const rest = data.swimRest;
    for (let i = 0; i < positions.count; i++) {
        const x = rest[i * 3];
        const rear = Math.max(0, -x / 0.6);
        positions.setZ(i, rest[i * 3 + 2] + Math.sin(phase - rear) * amplitude * rear ** 2);
    }
    positions.needsUpdate = true;
    data.bodyMesh.geometry.computeVertexNormals();
    data.tailPivot.position.z = Math.sin(phase - 0.98) * amplitude * data.bodyMesh.scale.z;
    data.tailPivot.rotation.y = Math.sin(phase - 1.45) * amplitude * 3.2;
}

const {
    hameconDansZone, updateFish, updateFloat, updateLine
} = creerComportement({
    BITE_INTEREST_RADIUS, floatGroup, fondY, comportementRand, POND_CENTER, rayonEtang, fishes,
    animateFishMesh, camera, spawnBubbles, CHUM_ATTRACT_ACCEL, BITE_APPROACH_ACCEL, ripples,
    spawnRipple, CAST_DURATION, fishButton, castTarget, sound, isSnagged, startSnag,
    risqueEmmelement, rand, demarrerEmmElement, modeQuiver, poserHameconAuFond, profondeurLocale,
    majCoupeProfondeur, statusDisplay, castStart, wind, waterWaveHeightAt, nibbleRand, MAX_WAIT,
    consumeCrankTurns, startReel, findBitingFish, showBiteView, floatIdle,
    tenterAttaquePredateur, REEL_IDLE_HELP, REEL_AUTO, REEL_PER_TURN, angler, startHoldingFish,
    endCast, updateCrankVisibility, rodTipVisual, LINE_SEGMENTS, linePositions, lineGeometry
});

// ---------------------------------------------------------------------------
// Entrées
// ---------------------------------------------------------------------------
canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    // Pendant la visée (amorce ou lancer), on peut ajuster le point de chute.
    if (castState === 'charging') {
        const p = waterPointFromEvent(event);
        if (p) {
            moveCastAim(p);
        }
    }
    if (feedState === 'charging') {
        const p = waterPointFromEvent(event);
        if (p) {
            moveFeedAim(p);
        }
    }
});

canvas.addEventListener('pointerdown', event => {
    if (cameraViewActive) {
        if (event.pointerType === 'touch' && cameraTouches.size < 2) {
            cameraTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
            canvas.setPointerCapture?.(event.pointerId);
            updateCameraGesture();
        }
        return;
    }
    if (toolDock.classList.contains('ouvert') || paused) {
        if (!paused) { fermerOutils(); }
        return;
    }
    if (event.button !== 0) {
        return;
    }
    ensureSound();
    // Lancer en vol : un clic tend la ligne AVANT que le bouchon touche l'eau.
    if (floatState === 'flying') {
        tendreLigneAuLancer();
        return;
    }
    // RAGONDIN : le chasser ne doit JAMAIS gêner la pêche. Il ne capte donc le
    // clic que lorsque la ligne ne fait rien (au repos) ou qu'elle est
    // simplement posée à l'eau. Pendant un ferrage, un combat, une remontée ou
    // un accrochage, le clic garde son rôle habituel.
    if (ragondin && (floatState === 'idle' || floatState === 'inWater')) {
        if (clicSurRagondin(event)) {
            hitRagondin();
            return;
        }
        // Clic à côté pendant qu'il rôde : on ne LANCE pas la ligne par
        // accident. C'était le vrai problème : viser le ragondin et rater
        // faisait partir le bouchon.
        if (floatState === 'idle') {
            statusDisplay.textContent = '🐀 Le ragondin est là : vise-le (3 clics) avant de relancer.';
            return;
        }
    }
    // Poisson en main : on dose la puissance du lancer vers la bourriche.
    if (floatState === 'holding') {
        startFishThrow();
        return;
    }
    // Mode amorçage : un appui sur l'eau commence à charger la puissance.
    if (feedMode && (floatState === 'idle' || floatState === 'inWater') && castState === 'idle') {
        if (feedState === 'idle') {
            const p = waterPointFromEvent(event);
            if (p) {
                // On capture le pointeur : le relâchement est bien reçu même si
                // le doigt sort du canvas (important sur téléphone).
                if (canvas.setPointerCapture && event.pointerId !== undefined) {
                    canvas.setPointerCapture(event.pointerId);
                }
                startFeedCharge(p);
            }
        }
        return;
    }
    if (floatState === 'bite') {
        hookFish();
        return;
    }
    if (floatState === 'struggle' || floatState === 'snag') {
        reelClick();
        return;
    }
    if (floatState === 'idle') {
        const p = waterPointFromEvent(event);
        if (p) {
            startCastCharge(p);   // on vise et on dose la puissance du lancer
        }
    }
    // Ligne à l'eau : un clic ne ramène PLUS la ligne (sinon un clic mal placé
    // remontait le bouchon sans prévenir). Seule la manivelle ramène la ligne.
});

canvas.addEventListener('pointermove', event => {
    if (cameraTouches.has(event.pointerId)) {
        cameraTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        updateCameraGesture();
    }
});

function endCameraTouch(event) {
    if (cameraTouches.delete(event.pointerId)) { updateCameraGesture(); }
}
canvas.addEventListener('lostpointercapture', endCameraTouch);

// Relâcher = on dose la puissance et la boule part.
canvas.addEventListener('pointerup', event => {
    if (cameraViewActive) {
        endCameraTouch(event);
        return;
    }
    if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
        canvas.releasePointerCapture(event.pointerId);
    }
    if (castState === 'charging') {
        releaseCast();
        return;
    }
    if (fishThrowState === 'charging') {
        releaseFishThrow();
        return;
    }
    if (feedState === 'charging') {
        releaseFeed();
    }
});

canvas.addEventListener('pointercancel', event => {
    if (cameraViewActive) {
        endCameraTouch(event);
        return;
    }
    if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
        canvas.releasePointerCapture(event.pointerId);
    }
    cancelCast();
    if (fishThrowState === 'charging') {
        releaseFishThrow();
    }
    cancelFeed();
});

// Filet de sécurité (téléphone) : si le relâchement n'arrive pas au canvas,
// on le rattrape au niveau de la fenêtre.
window.addEventListener('pointerup', () => {
    if (castState === 'charging') {
        releaseCast();
    }
    if (fishThrowState === 'charging') {
        releaseFishThrow();
    }
    if (feedState === 'charging') {
        releaseFeed();
    }
});

// Au doigt, l'appui long ne doit pas ouvrir le menu contextuel du navigateur.
canvas.addEventListener('contextmenu', event => event.preventDefault());

function toggleAmorcage() {
    ensureSound();
    setFeedMode(!feedMode);
    fermerOutils();
}

feedButton.addEventListener('click', toggleAmorcage);
quickFeedButton.addEventListener('click', () => {
    if (floatState === 'inWater' && !paused && !cameraViewActive && feedState === 'idle') {
        toggleAmorcage();
    }
});

// La profondeur se règle avant le lancer.
function clickDepth(delta) {
    if (paused || cameraViewActive || castState !== 'idle' || floatState !== 'idle') { return; }
    ensureSound();
    setProfondeur(profondeurLigne + delta);
}
depthMinus.addEventListener('click', () => clickDepth(-0.5));
depthPlus.addEventListener('click', () => clickDepth(0.5));
majEtiquetteProfondeur();
// Le jeu est initialisé : la coupe de l'eau (schéma) peut se dessiner.
coupePrete = true;
majCoupeProfondeur();
waterUniforms.uNormalsOn.value = waterUniforms.uNormals.value ? 1 : 0;

fishButton.addEventListener('click', () => {
    if (paused || cameraViewActive || toolDock.classList.contains('ouvert')) { return; }
    ensureSound();
    if (floatState === 'flying') {
        tendreLigneAuLancer();
    } else if (floatState === 'snag') {
        reelClick();
    }
});

// ---------------------------------------------------------------------------
// Cheat : mot secret « poisson »
// ---------------------------------------------------------------------------
// Taper le mot secret (n'importe où, hors champ de saisie) offre +50 XP.
// Les lettres s'accumulent dans un petit tampon : pas besoin d'un seul coup,
// mais une fausse lettre remet le compteur à zéro.

const CHEAT_MOT = 'poisson';
const CHEAT_GAIN = 50;
let cheatTampon = '';

function cheatTouche(touche) {
    if (typeof touche !== 'string' || touche.length !== 1) { return false; }
    cheatTampon = (cheatTampon + touche.toLowerCase()).slice(-CHEAT_MOT.length);
    if (cheatTampon !== CHEAT_MOT) { return false; }
    cheatTampon = '';
    journal.experience += CHEAT_GAIN;
    experiencePartie += CHEAT_GAIN;
    saveJournal();
    renderJournal();
    statusDisplay.textContent = '🪄 Cheat activé : +' + CHEAT_GAIN + ' XP !';
    catchMessage.textContent = '🪄 CHEAT — +' + CHEAT_GAIN + ' XP !';
    catchMessage.classList.remove('record', 'rare');
    catchMessage.classList.add('show');
    if (catchMessageTimer) { clearTimeout(catchMessageTimer); }
    catchMessageTimer = setTimeout(function () {
        catchMessage.classList.remove('show');
    }, 2500);
    return true;
}

window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        if (cameraViewActive) { setCameraView(false); toolToggle.focus?.(); }
        else if (!paused) { fermerOutils(); }
        return;
    }
    // Cheat : taper « poisson » n'importe où (sauf dans un champ de saisie)
    // offre +50 XP. Testé AVANT les early-return, pour marcher même en pause.
    if (event.key.length === 1 && !event.target?.closest?.('input, textarea')) {
        cheatTouche(event.key);
    }
    if (cameraViewActive || paused || toolDock.classList.contains('ouvert')
            || event.target?.closest?.('button, input, select, textarea')) { return; }
    if (modeBateau) {
        // Ramer : flèches ou ZQSD (clavier français). Gauche/droite tournent
        // autour du centre ; haut = vers le centre (marge PLUS négative),
        // bas = vers la berge.
        const touche = event.key;
        let coup = null;
        if (touche === 'ArrowUp' || touche === 'z' || touche === 'w') { coup = [0, -BATEAU_PAS_MARGE]; }
        else if (touche === 'ArrowDown' || touche === 's') { coup = [0, BATEAU_PAS_MARGE]; }
        else if (touche === 'ArrowLeft' || touche === 'q' || touche === 'a') { coup = [BATEAU_PAS_ANGLE, 0]; }
        else if (touche === 'ArrowRight' || touche === 'd') { coup = [-BATEAU_PAS_ANGLE, 0]; }
        if (coup) {
            event.preventDefault();
            if (!deplacerBateau(coup[0], coup[1])) {
                statusDisplay.textContent = 'Le bouchon est dehors : ramène la ligne pour déplacer la barque.';
            }
            return;
        }
    }
    if (event.key === ' ' || event.key === 'Enter') {
        ensureSound();
        if (feedMode) {
            return; // en mode amorçage, on lance avec la souris sur l'eau
        }
        if (floatState === 'flying') {
            tendreLigneAuLancer();
            return;
        }
        if (castState === 'charging') {
            releaseCast();
            return;
        }
        if (floatState === 'holding') {
            if (fishThrowState === 'charging') {
                releaseFishThrow();
            } else {
                startFishThrow();
            }
            return;
        }
        if (floatState === 'bite') {
            hookFish();
            return;
        }
        if (floatState === 'struggle' || floatState === 'snag') {
            reelClick();
            return;
        }
        if (floatState === 'idle') {
            raycaster.setFromCamera(pointerNdc, camera);
            const hits = raycaster.intersectObject(water);
            if (hits.length) {
                startCastCharge(hits[0].point.clone());
            }
        }
        // Espace/Entrée à l'eau : idem clic, la ligne ne se remonte plus au
        // clavier. La manivelle reste le seul moyen de ramener la ligne.
    }
});

// ---------------------------------------------------------------------------
// Boucle d'animation
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let elapsed = 0;
let paused = false;

// LE RAGONDIN VOLEUR — aléa rare : il sort de l'eau près de la bourriche pour
// voler un poisson. 3 clics SUR LUI le font fuir ; ses clics passent AVANT le
// ferrage, donc impossible de ferrer en le chassant.
const RAGONDIN_CLICS = 3;
let ragondin = null;
// Première visite plus tôt (18–30 s) : le joueur doit pouvoir la voir.
// Seulement s'il y a un poisson à voler (score > 0).
let ragondinTimer = 18 + rand() * 12;
let ragondinHits = 0;
let ragondinVolTimer = 0;   // secondes restantes avant le vol
let ragondinAuto = true;    // désactivable par les tests

function makeRagondin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.9 });
    const corps = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat);
    corps.scale.set(1.9, 0.95, 0.9);
    corps.position.y = 0.2;
    group.add(corps);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat);
    tete.position.set(0.44, 0.24, 0);
    group.add(tete);
    [-1, 1].forEach(function (cote) {
        const oreille = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat);
        oreille.position.set(0.37, 0.35, cote * 0.09);
        group.add(oreille);
    });
    const queue = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.5, 6), mat);
    queue.rotation.z = Math.PI / 2.4;
    queue.position.set(-0.55, 0.24, 0);
    group.add(queue);
    return group;
}

function spawnRagondin() {
    if (ragondin || partieTerminee) { return null; }
    const modele = makeRagondin();
    // Tout près de la bourriche (et face au pêcheur) : il est visible.
    modele.position.set(BOURRICHE_POS.x + 2.2, 0, BOURRICHE_POS.z + 1.2);
    modele.scale.setScalar(1.8);   // ~50 cm à l'échelle du monde : bien visible
    modele.rotation.y = Math.PI;
    scene.add(modele);
    ragondinHits = 0;
    ragondinVolTimer = 12;     // 12 s pour le chasser
    ragondin = modele;
    ensureSound();
    sound.ragondinArrive();
    if (ragondinAlert) { ragondinAlert.classList.add('active'); }
    spawnFloatingText('🐀 RAGONDIN !',
        new THREE.Vector3(BOURRICHE_POS.x + 5, BOURRICHE_POS.y, BOURRICHE_POS.z),
        '#ffb347');
    statusDisplay.textContent = '🐀 Un RAGONDIN rôde près de ta bourriche ! Clique 3 fois sur lui pour le chasser (sinon il vole un poisson).';
    return modele;
}

function volerUnPoissonRagondin() {
    if (!ragondin) { return false; }
    let pris = false;
    if (bourricheCount > 0) {
        bourricheCount -= 1;
        pris = true;
    }
    if (score > 0) {
        score -= 1;
        scoreDisplay.textContent = score;
        pris = true;
    }
    if (bourricheLabel) {
        bourricheLabel.textContent = '🧺 Bourriche : ' + bourricheCount;
    }
    spawnFloatingText('🐀 Il a volé un poisson !', BOURRICHE_POS, '#ff6b57');
    statusDisplay.textContent = pris
        ? '🐀 Trop tard : le ragondin a volé un poisson de la bourriche et s’est échappé !'
        : '🐀 Le ragondin est reparti sans rien voler…';
    sound.ragondinRonge(8);
    sound.escape();
    effrayerRagondin();
    return true;
}

function effrayerRagondin() {
    if (!ragondin) { return; }
    scene.remove(ragondin);
    ragondin = null;
    sound.ragondinMusiqueStop();
    ragondinHits = 0;
    if (ragondinAlert) { ragondinAlert.classList.remove('active'); }
    ragondinTimer = 45 + rand() * 30;
}

function hitRagondin() {
    if (!ragondin) { return false; }
    ragondinHits += 1;
    sound.splash();
    sound.ragondinCri(true);
    ragondin.position.x += 1.2;
    if (ragondinHits >= RAGONDIN_CLICS) {
        spawnFloatingText('🐀 Il s’enfuit !', ragondin.position, '#ffd166');
        effrayerRagondin();
        statusDisplay.textContent = '🐀 Le ragondin a fui ! Tes poissons sont saufs.';
        return true;
    }
    spawnFloatingText('🐀 Il détale !', ragondin.position, '#ffd166');
    statusDisplay.textContent = '🐀 Touché ! Encore ' + (RAGONDIN_CLICS - ragondinHits) + ' clic(s) pour le chasser.';
    return false;
}

// Zone de clic GÉNÉREUSE autour du ragondin (en pixels CSS). Le modèle 3D est
// petit et l'animal bouge : exiger un clic pile sur lui rendait la chasse
// pénible (surtout au doigt). On accepte donc un clic « à côté ».
const RAGONDIN_CLIC_RADIUS = 70;

/** Position du ragondin À L'ÉCRAN (pixels CSS), ou null s'il est derrière nous. */
function ragondinALEcran() {
    if (!ragondin) { return null; }
    const rect = canvas.getBoundingClientRect();
    const centre = ragondin.position.clone();
    centre.y += 0.35;                       // le corps, pas les pattes
    const projete = centre.project(camera);
    if (projete.z > 1) {                    // derrière la caméra
        return null;
    }
    return {
        x: rect.left + (projete.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-projete.y * 0.5 + 0.5) * rect.height
    };
}

function clicSurRagondin(event) {
    if (!ragondin) { return false; }
    const rect = canvas.getBoundingClientRect();
    // 1) Test à l'écran : la distance au ragondin PROJETÉ. Il ne dépend ni de la
    //    taille du modèle ni de l'inclinaison de la caméra.
    const ecran = ragondinALEcran();
    if (ecran) {
        const dx = event.clientX - ecran.x;
        const dy = event.clientY - ecran.y;
        if (dx * dx + dy * dy <= RAGONDIN_CLIC_RADIUS * RAGONDIN_CLIC_RADIUS) {
            return true;
        }
    }
    // 2) Test 3D exact : si le clic tombe vraiment sur le modèle, on le prend
    //    aussi (utile quand il sort du cadre de la zone d'écran).
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    return raycaster.intersectObject(ragondin, true).length > 0;
}

function updateRagondin(dt) {
    if (!ragondin) {
        if (!ragondinAuto) { return; }
        ragondinTimer -= dt;
        if (ragondinTimer <= 0) {
            // Il ne sort que s'il y a réellement un poisson à voler, et
            // SEULEMENT quand le joueur ne fait rien (au repos) ou quand le
            // bouchon est déjà à l'eau. Rien pendant un lancer, un ferrage, une
            // épreuve de force ou un accrochage : sa visite ne doit pas tomber
            // au milieu d'une action.
            const momentCalme = floatState === 'idle' || floatState === 'inWater';
            if (score > 0 && momentCalme) {
                if (spawnRagondin()) { ragondinTimer = 45 + rand() * 30; }
            } else {
                ragondinTimer = 8 + rand() * 5;   // on revérifie bientôt
            }
        }
        return;
    }
    const dx = BOURRICHE_POS.x - ragondin.position.x;
    const dz = BOURRICHE_POS.z - ragondin.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.7) {
        ragondin.position.x += (dx / d) * 1.1 * dt;
        ragondin.position.z += (dz / d) * 1.1 * dt;
        ragondin.rotation.y = Math.atan2(-dz, dx);
    }
    ragondin.position.y = Math.abs(Math.sin(elapsed * 6)) * 0.04;
    ragondinVolTimer -= dt;
    if (ragondinVolTimer <= 0) {
        volerUnPoissonRagondin();
        return;
    }
}

// ---------------------------------------------------------------------------
// Mini-jeu de démêlage : module autonome (demelage.js).
// Créé avant la boucle de rendu ; les callbacks utilisent les fonctions du jeu.
// ---------------------------------------------------------------------------
jeuDemelage = creerJeuDemelage({
    canvas: tangleCanvas,
    conteneur: tangleGame,
    timerEl: tangleTimer,
    progressEl: tangleProgress,
    messageEl: tangleMessage,
    duree: 14,
    onReussi: function () {
        floatState = 'inWater';
        waitTimer = 0;
        depuisLancement = 0;
        biteCooldown = 0.5;
        fishButton.disabled = true;
        spawnFloatingText('✅ Démêlée !', floatGroup.position, '#7ed957');
        statusDisplay.textContent = '✅ Ligne démêlée ! Ramène-la ou attends une touche.';
        sound.reel();
        updateCrankVisibility();
    },
    onPerdu: function (raison) {
        casserLigne('Démêlage : ' + raison.toLowerCase());
    },
    onStatus: function (texte) {
        statusDisplay.textContent = texte;
    },
    onTexte: function (texte, couleur) {
        spawnFloatingText(texte, floatGroup.position, couleur);
    },
    onSon: function (nom) {
        if (sound && typeof sound[nom] === 'function') { sound[nom](); }
    }
});
if (tangleGiveUp) {
    tangleGiveUp.addEventListener('click', function () {
        if (jeuDemelage) { jeuDemelage.abandonner(); }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused && !cameraViewActive) {
        elapsed += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateWater(elapsed);
        updateFish(dt, elapsed);
        updateSonar(dt, elapsed);
        updateBateau(elapsed);
        updateRameBateau(dt);
        updateFloat(dt, elapsed);
        // La coupe de l'eau suit le bouchon (5 fois par seconde suffit).
        if (elapsed - dernierCoupe > 0.2) {
            dernierCoupe = elapsed;
            majCoupeProfondeur();
        }
        updateFeed(dt);
        updateChum(dt);
        updateRagondin(dt);
        updateCastAnimation(dt);
        updateArm(dt);
        updateRod(dt);
        updateQuiver(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, elapsed);
        updateWaterReflection();
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
        updateRipples(dt);
        updateMissRings(dt);
        updateFloatingTexts(dt);
        if (jeuDemelage) { jeuDemelage.update(dt); }
        updateLine();
    }
    updateCrankVisibility();
    majPadBateau();
    updateCameraPosition(dt);
    cameraTarget.lerp(NORMAL_CAM_TARGET, 1 - Math.pow(0.0001, dt));
    if (shake > 0) {
        shake = Math.max(0, shake - dt * 1.5);
        camera.position.x += Math.sin(elapsed * 60) * shake;
        camera.position.y += Math.cos(elapsed * 55) * shake;
    }
    camera.lookAt(cameraTarget);
    if (post.enabled && postSupported && sceneTarget) {
        try {
            renderWithPost();
        } catch (error) {
            // Filet de sécurité : on revient au rendu direct.
            post.enabled = false;
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
        }
    } else {
        renderer.render(scene, camera);
    }
    updateQuality(dt);
    updateToolDock();
}

animate();

// ---------------------------------------------------------------------------
// Exposé pour les tests automatisés
// ---------------------------------------------------------------------------
let testTime = 0;
// ---------------------------------------------------------------------------
// LIGNES (VIES) : on part avec 5 lignes. Un lancer trop fort ou une remontée
// trop rapide en coûte une. À zéro : fin de partie, nom du pêcheur et
// classement local (3 onglets : poissons, poids total, records par espèce).
// ---------------------------------------------------------------------------
const VITESSE_MANIVELLE_MAX = 4.0;     // base : tours/s EN MOYENNE sur 0,6 s
const RANKING_KEY = 'peche_max_games_classement';
const NOM_KEY = 'peche_max_games_nom';
let avertissementsVitesse = 0;
let partieTerminee = false;
let derniereAlerteVitesse = -10000;
let ongletClassement = 'poissons';
let partieStats = { poissons: 0, poids: 0, records: {} };

function majLignes() {
    if (!lignesLabel) { return; }
    const total = totalLignes();
    const reserves = total - lignesRestantes;
    lignesLabel.textContent = '🧵 Lignes : ' + total + (reserves ? '' : '/' + MAX_LIGNES);
    lignesLabel.classList.toggle('danger', total <= 1);
}

function casserLigne(raison) {
    if (partieTerminee) { return; }
    fishButton.hidden = true;
    if (jeuDemelage && jeuDemelage.estActif()) { jeuDemelage.fermer(); }
    debiterLigne();
    avertissementsVitesse = 0;
    sound.lineBreak();
    spawnFloatingText('💥 Ligne cassée !', floatGroup.position, '#ff6b57');
    statusDisplay.textContent = '💥 ' + raison + ' : une ligne est perdue ('
        + totalLignes() + ' restante' + (totalLignes() > 1 ? 's' : '') + ').';
    floatState = 'idle';
    hameconDansLaVase = false;
    fishButton.disabled = false;
    if (hookedFish) {
        hookedFish.userData.hooked = false;
        hookedFish.visible = false;
        hookedFish = null;
    }
    floatGroup.position.copy(floatIdle);
    floatGroup.rotation.z = 0;
    if (totalLignes() === 0) { terminerPartie(); }
}

// ---------------------------------------------------------------------------
// Remontée trop rapide : LA CHARGE COMPTE
// ---------------------------------------------------------------------------
// Le fil ne casse pas parce qu'on tourne vite : il casse parce que quelque
// chose TIRE au bout. Deux conséquences :
//   • sans poisson ferré (on rembobine un bouchon vide) : aucune limite ;
//   • avec un poisson ferré : plus il est lourd, plus la vitesse permise est
//     basse (et le fil choisi compte aussi).
// Poids réels du jeu : ~0,1 kg (goujon) à ~106 kg (silure).
function vitesseMaxTours() {
    if (!hookedFish) { return Infinity; }
    const poids = Math.max(0.05, hookedFish.userData.weight || 0);
    // 0,1 kg ≈ 6,1 · 0,8 kg ≈ 5,4 · 2,8 kg ≈ 4,5 · 6 kg ≈ 3,6 · ≥ 20 kg = 2,5
    const seuil = Math.max(2.5, VITESSE_MANIVELLE_MAX + 2.5 - 1.2 * Math.sqrt(poids));
    return seuil * filEquipe().resistance;
}

// Chance qu'un avertissement casse vraiment la ligne : elle grandit avec le
// poids du poisson (un goujon ne fait pas casser un fil, une carpe oui).
function risqueCasseVitesse() {
    if (!hookedFish) { return 0; }
    const poids = Math.max(0.05, hookedFish.userData.weight || 0);
    const facteur = Math.min(1.6, 0.4 + 0.4 * Math.sqrt(poids));
    return Math.min(0.15, 0.015 * avertissementsVitesse * facteur);
}

// Remontée trop rapide : un avertissement (toutes les 1,5 s au plus), puis le
// risque de casse augmente à chaque avertissement.
function avertirVitesse() {
    if (partieTerminee) { return; }
    const maintenant = performance.now();
    if (maintenant - derniereAlerteVitesse < 1500) { return; }  // 1 alerte / 1,5 s
    derniereAlerteVitesse = maintenant;
    avertissementsVitesse += 1;
    // POPUP 3D près du bouchon, comme « FERRÉ ! » ou « Trop tôt ! » : le joueur
    // voit l'avertissement sans quitter l'eau des yeux.
    spawnFloatingText('⚠️ Trop vite !', floatGroup.position, '#ffb347');
    if (avertissementsVitesse <= 3) {
        statusDisplay.textContent = '⚠️ Tu remontes trop vite ! La ligne souffre ('
            + avertissementsVitesse + ' avertissement' + (avertissementsVitesse > 1 ? 's' : '') + ').';
    }
    if (rand() < risqueCasseVitesse()) {
        casserLigne('Tu as remonté trop vite');
    }
}

// Classement local délégué au module classement.js.
const classementApi = creerClassement({
    store: journalStore,
    rankingKey: RANKING_KEY,
    nomKey: NOM_KEY,
    getPartieStats: function () { return partieStats; },
    fmtPoids: fmtPoids,
    rankingList: rankingList,
    rankingTabs: rankingTabs
});

function chargerClassement() {
    return classementApi.charger();
}

function sauverClassement(liste) {
    classementApi.sauver(liste);
}

function enregistrerClassement(nom) {
    return classementApi.enregistrer(nom);
}

function renderClassement(onglet) {
    ongletClassement = onglet || 'poissons';
    classementApi.render(ongletClassement);
}

function ouvrirClassement() {
    if (!classement) { return; }
    fermerOutils();
    renderClassement(ongletClassement);
    classement.classList.add('active');
    majModalBackdrop();
}

function fermerClassement() {
    if (classement) { classement.classList.remove('active'); }
    majModalBackdrop();
}

// Fin de partie : plus aucune ligne, ou fin volontaire par le joueur.
// `raison` vaut 'lignes' (défaut) ou 'manuelle'.
function terminerPartie(raison) {
    if (partieTerminee) { return; }
    rangerSonar();
    setCameraView(false);
    if (jeuDemelage && jeuDemelage.estActif()) { jeuDemelage.fermer(); }
    const manuelle = raison === 'manuelle';
    partieTerminee = true;
    // On coupe proprement une ligne en cours : aucun poisson ne doit rester
    // accroché derrière le panneau de fin de partie.
    if (hookedFish) {
        hookedFish.userData.hooked = false;
        hookedFish.visible = false;
        hookedFish = null;
    }
    if (biteFish) {
        biteFish.userData.biting = false;
        biteFish.visible = false;
        biteFish = null;
    }
    biteViewActive = false;
    hideBiteView();
    struggle = null;
    struggleTimeLeft = 0;
    snag = null;
    setDragLoosened(false);
    castState = 'idle';
    feedGauge.classList.remove('active');
    if (feedState === 'charging') { cancelFeed(); }
    floatState = 'idle';
    floatGroup.visible = true;
    floatGroup.position.copy(floatIdle);
    floatGroup.rotation.z = 0;
    crank.classList.remove('active');
    feedButton.classList.remove('active');
    fishButton.disabled = true;
    fermerOutils();
    if (!gameOver) { majModalBackdrop(); return; }
    if (gameOverTitle) {
        gameOverTitle.textContent = manuelle ? '🏁 Partie terminée' : '💥 Plus de lignes !';
    }
    if (gameOverText) {
        gameOverText.textContent = manuelle
            ? 'Tu as choisi de terminer la partie. Voici ton bilan :'
            : 'Tu n’as plus de lignes. Voici ta partie :';
    }
    if (gameOverScore) {
        gameOverScore.innerHTML = '🐟 <b>' + partieStats.poissons + '</b> poisson(s) · ⚖️ <b>'
            + fmtPoids(partieStats.poids) + '</b> au total · 🏆 <b>'
            + Object.keys(partieStats.records).length + '</b> espèce(s)';
    }
    if (playerName) {
        let dernierNom = '';
        try { if (journalStore) { dernierNom = journalStore.getItem(NOM_KEY) || ''; } } catch (e) { /* plein */ }
        playerName.value = dernierNom;
    }
    gameOver.classList.add('active');
    majModalBackdrop();
}

// Le fond assombri n'est affiché que si une modale est réellement ouverte.
function majModalBackdrop() {
    if (!modalBackdrop) { return; }
    const bloque = !!(
        (accueil && accueil.classList.contains('active'))
        || (gameOver && gameOver.classList.contains('active'))
        || (classement && classement.classList.contains('active'))
    );
    modalBackdrop.classList.toggle('active', bloque);
}

function revenirAccueil() {
    rangerSonar();
    if (gameOver) { gameOver.classList.remove('active'); }
    if (classement) { classement.classList.remove('active'); }
    if (accueil) { accueil.classList.add('active'); }
    majModalBackdrop();
}

// Remet la PARTIE à zéro : score, bourriche de la partie, lignes, statistiques
// et état de pêche. Le carnet (`journal`), l'XP, les bouchons achetés et le
// classement sont PERSISTANTS : on ne les efface pas ici.
function reinitialiserPartie() {
    rangerSonar();
    // --- État de pêche / animations ---
    if (jeuDemelage && jeuDemelage.estActif()) { jeuDemelage.fermer(); }
    ligneTendue = false;
    if (castState === 'charging') { cancelCast(); }
    if (feedState === 'charging') { cancelFeed(); }
    if (hookedFish) { hookedFish.userData.hooked = false; }
    if (biteFish) { biteFish.userData.biting = false; }
    // Poisson en main : on le remet à l'eau (et dans le tableau s'il en sortait).
    if (heldFish) {
        const poisson = heldFish;
        heldFish = null;
        poisson.scale.setScalar(poisson.userData.size);
        poisson.rotation.set(0, 0, 0);
        poisson.position.copy(randomFishPosition());
        poisson.visible = true;
        poisson.userData.vx = 0;
        poisson.userData.vz = 0;
        if (fishes.indexOf(poisson) < 0) { fishes.push(poisson); }
    }
    fishes.forEach(function (poisson) {
        poisson.userData.hooked = false;
        poisson.userData.biting = false;
        poisson.userData.targeting = false;
        poisson.visible = true;
        poisson.scale.setScalar(poisson.userData.size);
        poisson.rotation.set(0, 0, 0);
        poisson.userData.vx = 0;
        poisson.userData.vz = 0;
    });
    hookedFish = null;
    biteFish = null;
    biteViewActive = false;
    hideBiteView();
    struggle = null;
    snag = null;
    fermerPanneauCombat();
    setDragLoosened(false);
    tension = 0;
    hameconDansLaVase = false;
    snagFreed = false;
    lineBrokenTimer = 0;
    fishCaught = false;
    escaped = false;
    timeoutEscape = false;
    caughtWeight = 0;
    recordBattu = null;
    waitTimer = 0;
    depuisLancement = 0;
    biteCooldown = 0;
    biteSignauxRestants = 1;
    baitInterest = false;
    nibbleInteretAvant = false;
    nibbleDebut = -1;
    nibbleSuivant = 0;
    nibblePhase = 0;

    // --- Bouchon, canne et bras au repos ---
    floatState = 'idle';
    floatGroup.visible = true;
    floatGroup.position.copy(floatIdle);
    floatGroup.rotation.z = 0;
    setFloatOpacity(1);
    castState = 'idle';
    setCastPower(0);
    castTargetPower = 0;
    castPhase = 0;
    castT = 0;
    castTarget.copy(castAim);
    castSwing = 0;
    castSwingDepart = 0;
    castYawAngler = 0;
    castYawRod = 0;
    rodBend = 0;
    rodGroup.rotation.x = 0;
    rodTipVisual.copy(rodTip);
    angler.rotation.y = anglerYawBase;
    rodPivot.rotation.y = rodYawBase;
    feedGauge.classList.remove('active');
    feedState = 'idle';
    setFeedMode(false);
    feedBall.visible = false;
    feedPower = 0;
    feedTargetPower = 0;
    feedFlyT = 0;
    fishThrowState = 'idle';
    fishThrowPower = 0;
    fishThrowTarget = 0;
    fishThrowPhase = 0;
    fishThrowT = 0;

    // --- Effets visuels de la partie précédente ---
    floatingTexts.forEach(function (item) {
        scene.remove(item.sprite);
        if (item.sprite.material.map) { item.sprite.material.map.dispose(); }
        item.sprite.material.dispose();
    });
    floatingTexts.length = 0;
    missRings.forEach(function (item) {
        scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
    });
    missRings.length = 0;
    ripples.forEach(function (item) {
        scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
    });
    ripples.length = 0;
    if (chum) { scene.remove(chum.group); chum = null; }
    if (ragondin) { effrayerRagondin(); }
    ragondinHits = 0;
    ragondinVolTimer = 0;
    ragondinTimer = 18 + rand() * 12;
    if (ragondinAlert) { ragondinAlert.classList.remove('active'); }

    // --- Compteurs de la PARTIE (le carnet/XP persistants ne bougent pas) ---
    score = 0;
    scoreDisplay.textContent = score;
    bourricheCount = 0;
    lignesRestantes = MAX_LIGNES;
    amorceDepartRestante = AMORCE_DEPART;
    avertissementsVitesse = 0;
    derniereAlerteVitesse = -10000;
    partieTerminee = false;
    partieStats = { poissons: 0, poids: 0, records: {} };
    experiencePartie = 0;
    crankRotationDelta = 0;

    // --- Interface ---
    if (gameOver) { gameOver.classList.remove('active'); }
    if (classement) { classement.classList.remove('active'); }
    feedButton.classList.remove('active');
    crank.classList.remove('active');
    fishButton.disabled = false;
    fishButton.hidden = true;
    fishButton.classList.remove('cooldown');
    paused = false;
    setCameraView(false);
    resetCameraView();
    pauseButton.textContent = '⏸ Pause';
    fermerOutils();
    majLignes();
    renderJournal();      // bourriche de la partie + XP persistant
    majCoupeProfondeur();
    updateToolDock();
    updateCrankVisibility();
    updateLine();
    majModalBackdrop();
}

function recommencerPartie() {
    reinitialiserPartie();
    if (gameOver) { gameOver.classList.remove('active'); }
    fermerClassement();
    majModalBackdrop();
    statusDisplay.textContent = 'Nouvelle partie : ' + totalLignes() + ' lignes et ' + stockAmorce() + ' boules d’amorce.';
}

// --- Boutons du panneau de fin de partie et du classement ---
if (saveScore) {
    saveScore.addEventListener('click', function () {
        enregistrerClassement(playerName ? playerName.value : '');
        if (gameOver) { gameOver.classList.remove('active'); }
        ouvrirClassement();
    });
}
if (showRanking) { showRanking.addEventListener('click', ouvrirClassement); }
if (rankingButton) { rankingButton.addEventListener('click', ouvrirClassement); }
if (closeRanking) { closeRanking.addEventListener('click', fermerClassement); }
if (restartGame) { restartGame.addEventListener('click', recommencerPartie); }
if (saveAndMenu) {
    saveAndMenu.addEventListener('click', function () {
        enregistrerClassement(playerName ? playerName.value : '');
        revenirAccueil();
    });
}
if (backToMenu) { backToMenu.addEventListener('click', revenirAccueil); }
if (endGameButton) {
    endGameButton.addEventListener('click', function () {
        if (partieTerminee) { return; }
        if (accueil && accueil.classList.contains('active')) { return; }
        terminerPartie('manuelle');
    });
}
if (rankingTabs) {
    rankingTabs.addEventListener('click', function (event) {
        const cible = event.target && event.target.dataset ? event.target.dataset.rank : '';
        if (cible) { renderClassement(cible); }
    });
}

majLignes();

// ÉCRAN D'ACCUEIL : on propose de JOUER ou de consulter le CLASSEMENT local.
function demarrerJeu() {
    // JOUER = une PARTIE NEUVE : score, bourriche, lignes, statistiques et état
    // de pêche repartent de zéro (le carnet, l'XP carrière et le classement restent).
    recommencerPartie();
    if (accueil) { accueil.classList.remove('active'); }
    majModalBackdrop();
    ensureSound();
    statusDisplay.textContent = 'Maintiens sur l’eau, puis relâche pour lancer.';
}
function afficherAccueil() {
    if (classement) { classement.classList.remove('active'); }
    if (gameOver) { gameOver.classList.remove('active'); }
    if (accueil) { accueil.classList.add('active'); }
    majModalBackdrop();
}
if (playButton) { playButton.addEventListener('click', demarrerJeu); }
if (accueilClassement) { accueilClassement.addEventListener('click', ouvrirClassement); }
if (techniqueSelect) {
    techniqueSelect.addEventListener('change', function () {
        setTechnique(this.value);
    });
}

window.__game = {
    scene: scene,
    camera: camera,
    renderer: renderer,
    fishes: fishes,
    floatGroup: floatGroup,
    rodTip: rodTip,
    angler: angler,
    makeFish: makeFish,
    lilyPads: lilyPads,
    startCast: startCast,
    hookFish: hookFish,
    getState: function () { return floatState; },
    // Poisson actuellement sur l'hameçon (proie ou carnassier) — pour les tests.
    getHookedFish: function () { return hookedFish; },
    getHookedEspece: function () {
        return hookedFish ? (hookedFish.userData.especeId || '') : '';
    },
    getBitePhase: function () { return bitePhase; },
    getBiteSignaux: function () { return biteSignauxRestants; },
    getBiteTouchType: function () { return biteTouche ? biteTouche.famille : ''; },
    getBiteTouchId: function () { return biteTouche ? biteTouche.id : ''; },
    getBiteTouchName: function () { return biteTouche ? biteTouche.nom : ''; },
    getFauxToucheId: function () { return biteFauxTouche ? biteFauxTouche.id : ''; },
    getBiteWindow: function () { return biteFenetre; },
    // Catalogue des touches (les mouvements du bouchon) — exposé pour les tests.
    getTouches: function () {
        return TOUCHES.map(function (t) { return Object.assign({}, t); });
    },
    // Styles de combat par espèce (touches + comportement) — tests et carnet.
    getStylesCombat: function () { return STYLES_COMBAT; },
    styleEspece: styleEspece,
    // --- Lignes (vies), fin de partie et classement local ---
    getLignes: totalLignes,
    maxLignes: MAX_LIGNES,
    casserLigne: casserLigne,
    getAvertissements: function () { return avertissementsVitesse; },
    // Règles de la « remontée trop rapide » (poids du poisson + fil choisi).
    getVitesseMaxTours: function () { return vitesseMaxTours(); },
    getRisqueCasseVitesse: function () { return risqueCasseVitesse(); },
    setFilEquipe: function (id) {
        if (TYPES_DE_FIL.some(function (fil) { return fil.id === id; })) { journal.ligne = id; }
        return journal.ligne;
    },
    avertirVitesse: avertirVitesse,
    getElapsed: function () { return elapsed; },
    // Ondes sonar vivantes + compteur de pings (pour les tests).
    sonarBuoy: sonarBuoy,
    getOndesSonar: function () { return sonarOndes; },
    getSonarPings: function () { return sonarPings; },
    ouvrirClassement: ouvrirClassement,
    isPartieTerminee: function () { return partieTerminee; },
    recommencerPartie: recommencerPartie,
    enregistrerClassement: enregistrerClassement,
    getClassement: chargerClassement,
    getPartieStats: function () { return Object.assign({}, partieStats); },
    terminerPartie: terminerPartie,
    revenirAccueil: revenirAccueil,
    isModalBackdropVisible: function () {
        return !!modalBackdrop && modalBackdrop.classList.contains('active');
    },
    renderClassement: renderClassement,
    getStruggleStyle: function () { return struggle ? struggle.styleNom : ''; },
    // ÉCHELLE DU MONDE : 1 unité = 50 cm. Renvoie les mesures réelles des
    // objets (pour vérifier qu'elles restent réalistes) et la taille 3D d'un
    // poisson comparée à sa longueur réelle.
    getEchelles: function () {
        const f = flotteurCourant();
        const u = 2;                         // unités par mètre
        const cm = function (unites) { return Math.round(unites * (100 / u)); };
        const poisson = fishes[0];
        let poisson3DCm = 0;
        if (poisson) {
            const ref = (FORMES[poisson.userData.type] || FORMES.fusiforme).longueurRef;
            poisson3DCm = cm(ref * poisson.scale.x);
        }
        return {
            unitesParMetre: u,
            bouchonCm: cm((f.longueur + 0.1) * FLOTTEUR_ECHELLE),
            bouchonTigeCm: cm(f.longueur * FLOTTEUR_ECHELLE),
            hameconCm: cm(0.016 * 2 * FLOTTEUR_ECHELLE),
            nenupharCm: cm(0.7),
            roseauCm: cm(0.035 * 2),
            bourricheCm: cm(0.72 * 2),
            canneM: Math.round(rodTip.distanceTo(rodBase) / u * 10) / 10,
            pecheurM: Math.round(3.4 / u * 100) / 100,
            etangM: Math.round(POND_RADIUS * 2 / u),
            fondM: Math.round(FOND_CENTRE / u * 10) / 10,
            poisson3DCm: poisson3DCm,
            poissonReelCm: poisson ? poisson.userData.longueurCm : 0
        };
    },
    getRecordBattu: function () { return recordBattu ? Object.assign({}, recordBattu) : null; },
    spawnFish: spawnFish,
    repeuplerEtang: repeuplerEtang,
    setHorsNormeChance: setHorsNormeChance,
    getHorsNormeChance: getHorsNormeChance,
    getHorsNormeCount: function () {
        return fishes.filter(function (f) { return !!f.userData.horsNorme; }).length;
    },
    getDistributionAttendue: distributionAttendue,
    spawnRagondin: spawnRagondin,
    hitRagondin: hitRagondin,
    effrayerRagondin: effrayerRagondin,
    isRagondinActive: function () { return !!ragondin; },
    getRagondin: function () {
        return ragondin ? { x: ragondin.position.x, z: ragondin.position.z, hits: ragondinHits } : null;
    },
    // Un clic à (x, y) en pixels toucherait-il le ragondin ? (zone généreuse)
    clicSurRagondinAt: function (x, y) {
        return clicSurRagondin({ clientX: x, clientY: y });
    },
    // Position À L'ÉCRAN du ragondin (pixels CSS) : utile aux tests.
    getRagondinEcran: function () {
        const ecran = ragondinALEcran();
        return ecran ? { x: ecran.x, y: ecran.y, devant: true }
            : { x: 0, y: 0, devant: false };
    },
    getRagondinTimer: function () { return ragondinTimer; },
    setRagondinTimer: function (v) { ragondinTimer = v; },
    setRagondinAuto: function (value) { ragondinAuto = !!value; },
    isRagondinAuto: function () { return ragondinAuto; },
    setRagondinVolDans: function (sec) { if (ragondin) { ragondinVolTimer = sec; } },
    volerUnPoissonRagondin: volerUnPoissonRagondin,
    getScore: function () { return score; },
    setScore: function (value) {
        score = Math.max(0, Math.floor(Number(value) || 0));
        if (scoreDisplay) { scoreDisplay.textContent = score; }
    },
    getBourricheCount: function () { return bourricheCount; },
    setBourricheCount: function (value) {
        bourricheCount = Math.max(0, Math.floor(Number(value) || 0));
        if (bourricheLabel) { bourricheLabel.textContent = '🧺 Bourriche : ' + bourricheCount; }
    },
    demarrerJeu: demarrerJeu,
    afficherAccueil: afficherAccueil,
    setTechnique: setTechnique,
    getTechnique: function () { return techniqueCourante; },
    isQuiver: function () { return techniqueCourante === 'quiver'; },
    getQuiverMotion: function () {
        return modeQuiver.getMotion();
    },
    getRodPose: function () {
        return { x: rodGroup.rotation.x, y: rodPivot.rotation.y };
    },
    isQuiverPanelVisible: function () {
        return modeQuiver.isPanneauVisible();
    },
    isAccueilVisible: function () { return !!accueil && accueil.classList.contains('active'); },
    // Emplacements autour de l'étang (idee 1) — exposés pour les tests.
    getPoste: function () {
        const poste = POSTES[posteActuel];
        return {
            index: posteActuel,
            id: emplacementLibre ? 'libre' : poste.id,
            nom: emplacementLibre ? azimutPosteTexte(emplacementAngle) : poste.nom,
            delta: poste.delta,
            libre: emplacementLibre,
            angle: emplacementAngle,
            marge: emplacementMarge
        };
    },
    getPostes: function () {
        return POSTES.map(function (poste) {
            return { id: poste.id, nom: poste.nom, delta: poste.delta };
        });
    },
    // Choix libre (carte vue de dessus) : angle + distance à la berge.
    getEmplacement: function () {
        const dx = angler.position.x - POND_CENTER.x;
        const dz = angler.position.z - POND_CENTER.z;
        const distance = Math.hypot(dx, dz);
        return {
            angle: emplacementAngle,
            marge: emplacementMarge,
            distance: distance,
            rayonLocal: rayonEtang(emplacementAngle),
            x: angler.position.x,
            z: angler.position.z,
            direction: azimutPosteTexte(emplacementAngle),
            libre: emplacementLibre
        };
    },
    // Mode bateau (barque achetée en boutique) — exposés pour les tests.
    isBateau: function () { return modeBateau; },
    // Remet le sonar « jamais acheté » : les scénarios qui l'ACHÈTENT ont
    // besoin d'un carnet neuf (un scénario antérieur peut l'avoir acheté
    // et posé, ce qui polluerait pings et ondes).
    reinitialiserSonar: function () {
        journal.sonar = false;
        rangerSonar();
        sonarOndes.forEach(function (onde) { scene.remove(onde); });
        sonarOndes.length = 0;
        sonarPings = 0;
        sonarHorloge = 0;
        sonarDernierPing = -Infinity;
        sonarScanTimer = 0;
    },
    acheterBateau: acheterBateau,
    embarquerBateau: embarquerBateau,
    quitterBateau: quitterBateau,
    deplacerBateau: deplacerBateau,
    getBateauPrix: function () { return BATEAU_PRIX; },
    getPortrait: function () {
        return { cache: strugglePortrait ? strugglePortrait.hidden : true,
            espece: portraitEspeceCourante };
    },
    // Commandes tactiles de la barque (pad) — exposées pour les tests.
    getBateauPad: function () {
        return { cache: boatPad ? boatPad.hidden : true,
            rame: { gauche: bateauRame.gauche, avant: bateauRame.avant,
                droite: bateauRame.droite } };
    },
    getAvantageFerrage: function () { return avantageFerrage; },
    getBateau: function () {
        return {
            visible: bateauGroupe.visible,
            x: bateauGroupe.position.x,
            y: bateauGroupe.position.y,
            z: bateauGroupe.position.z,
            marge: emplacementMarge,
            angle: emplacementAngle
        };
    },
    getPlacementMap: function () {
        return {
            troisD: true,
            taille: CARTE_3D_TAILLE,
            monde: CARTE_3D_MONDE,
            segments: CARTE_3D_SEGMENTS,
            hauteurEau: CARTE_3D_EAU_Y,
            margeMin: PLACEMENT_MARGE_MIN,
            margeMax: PLACEMENT_MARGE_MAX,
            angle: emplacementAngle,
            marge: emplacementMarge,
            terrain: {
                sommets: carteGeometrie.attributes.position.count,
                minY: carteMinY,
                maxY: carteMaxY,
                sousLEau: carteSousLEau,
                auDessus: carteGeometrie.attributes.position.count - carteSousLEau
            },
            bande: {
                sommets: (CARTE_3D_BANDE_SEGMENTS + 1) * 2,
                margeMin: PLACEMENT_MARGE_MIN,
                margeMax: PLACEMENT_MARGE_MAX
            },
            marqueur: {
                x: carteMarqueur.position.x,
                y: carteMarqueur.position.y,
                z: carteMarqueur.position.z
            },
            camera: {
                x: carteCamera.position.x,
                y: carteCamera.position.y,
                z: carteCamera.position.z
            }
        };
    },
    getHauteurCarte: function (x, z) { return hauteurCarte(x, z); },
    projeterPlacement: projeterPlacement,
    getCarteMarqueur: function () {
        return {
            x: carteMarqueur.position.x,
            y: carteMarqueur.position.y,
            z: carteMarqueur.position.z
        };
    },
    choisirEmplacement: choisirEmplacement,
    placerAuPoste: placerAuPoste,
    getRodBase: function () { return { x: rodBase.x, y: rodBase.y, z: rodBase.z }; },
    // Geste de lancer / orientation du pêcheur et de la canne — pour les tests.
    getCastAnimation: function () {
        let cible;
        if (castState === 'charging') {
            cible = { x: castAim.x, z: castAim.z };
        } else if (floatState === 'flying') {
            cible = { x: castTarget.x, z: castTarget.z };
        } else {
            cible = { x: floatGroup.position.x, z: floatGroup.position.z };
        }
        return {
            swing: castSwing,
            baseAngler: anglerYawBase,
            baseRod: rodYawBase,
            yawAngler: angler.rotation.y,
            yawRod: rodPivot.rotation.y,
            offsetAngler: castYawAngler,
            offsetRod: castYawRod,
            cible: cible,
            castState: castState,
            floatState: floatState,
            castT: castT
        };
    },
    getRodTipVisual: function () {
        return { x: rodTipVisual.x, y: rodTipVisual.y, z: rodTipVisual.z };
    },
    getArmPose: function () {
        return {
            x: arm.position.x, y: arm.position.y, z: arm.position.z,
            rx: arm.rotation.x, ry: arm.rotation.y, rz: arm.rotation.z
        };
    },
    getCameraTarget: function () { return { x: cameraTarget.x, y: cameraTarget.y, z: cameraTarget.z }; },
    getGirouette: function () { return { x: vaneGroup.position.x, z: vaneGroup.position.z }; },
    // Soleil directionnel et lumière du poste (idee 2) — exposés pour les tests.
    getSoleil: function () {
        const direction = waterUniforms.uSunDir.value;
        return {
            azimut: SUN_AZIMUT,
            libelle: azimutTexte(SUN_AZIMUT),
            direction: { x: direction.x, y: direction.y, z: direction.z },
            position: { x: sunLight.position.x, y: sunLight.position.y, z: sunLight.position.z },
            intensite: sunLight.intensity,
            exposition: expositionPoste(),
            lumiereEau: waterUniforms.uLight.value,
            ambiance: ambientLight.intensity
        };
    },
    getExpositionPoste: function (index) { return expositionPoste(index); },
    couleurEau: couleurEau,
    getFondDoubleFace: function () { return pondBottom.material.side === THREE.DoubleSide; },
    getEauCouleurs: function () {
        return {
            shallow: waterUniforms.uShallow.value.getHex(),
            deep: waterUniforms.uDeep.value.getHex(),
            sky: waterUniforms.uSky.value.getHex()
        };
    },
    annoncerRecord: annoncerRecord,
    addJournalEntry: addJournalEntry,
    showCatchMessage: showCatchMessage,
    majCoupeProfondeur: majCoupeProfondeur,
    choisirTouche: choisirTouche,
    mouvementDeTouche: mouvementDeTouche,
    dureeTouche: dureeTouche,
    getVitesseTouches: function () { return VITESSE_TOUCHES; },
    getStrikeQuality: function () { return strikeQuality; },
    getFightAdvantage: function () { return fightAdvantage; },
    getFloats: function () {
        return FLOTTEURS.map(function (f) {
            return {
                id: f.id, nom: f.nom, sensibilite: f.sensibilite,
                remontee: f.remontee, longueur: f.longueur, desc: f.desc,
                prix: f.prix || 0, atout: f.atout || '',
                capacite: capaciteBouchon(f)
            };
        });
    },
    getFloatType: function () { return flotteurCourant().id; },
    setFloatType: setFloatType,
    // Expérience et boutique de bouchons — exposées pour les tests.
    getExperience: function () { return journal.experience; },
    getExperiencePartie: function () { return experiencePartie; },
    setExperience: function (value) {
        journal.experience = Math.max(0, Math.floor(value || 0));
        saveJournal();
        renderJournal();
    },
    getBouchonsPossedes: function () { return journal.bouchons.slice(); },
    getScionsPossedes: function () { return journal.scions.slice(); },
    getScion: function () { return scionChoix; },
    setScion: setScion,
    acheterScion: acheterScion,
    getBoutiqueHtml: function () { return boutique ? boutique.innerHTML : ''; },
    acheterBouchon: acheterBouchon,
    perdreLeBouchon: perdreLeBouchon,
    xpPourPrise: xpPourPrise,
    gagnerExperience: gagnerExperience,
    // Cheat « poisson » — exposé pour les tests.
    cheatTouche: cheatTouche,
    getCapaciteBouchon: function () { return capaciteBouchon(); },
    isBiteViewActive: function () { return biteViewActive; },
    getCameraMode: function () { return cameraMode; },
    // Responsive : FOV garanti et état du tiroir d'outils — pour les tests.
    getFovPourAspect: fovPourAspect,
    getCameraFov: function () { return camera.fov; },
    isOutilsOuverts: function () {
        return !!toolDock && toolDock.classList.contains('ouvert');
    },
    getFloatingTexts: function () {
        return floatingTexts.map(function (item) { return item.texte; });
    },
    // Détails (texte + position monde) des messages flottants — pour vérifier
    // notamment que l'avertissement de vitesse apparaît près du bouchon.
    getFloatingTextDetails: function () {
        return floatingTexts.map(function (item) {
            return {
                texte: item.texte,
                x: item.sprite.position.x,
                y: item.sprite.position.y,
                z: item.sprite.position.z
            };
        });
    },
    getMissRings: function () { return missRings.length; },
    startReel: startReel,
    // Mini-jeu de démêlage et tension de ligne au lancer — pilotage des tests.
    setTangleChance: function (value) {
        tangleChanceOverride = value === null ? null : Math.max(0, Math.min(1, Number(value) || 0));
    },
    getTangleChance: risqueEmmelement,
    tendreLigne: tendreLigneAuLancer,
    isLigneTendue: function () { return ligneTendue; },
    forcerEmmElement: demarrerEmmElement,
    getTangle: function () { return jeuDemelage ? jeuDemelage.getState() : null; },
    getDemelagePath: function () { return jeuDemelage ? jeuDemelage.getPath() : []; },
    pointerDemelage: function (x, y) {
        if (jeuDemelage) { jeuDemelage.pointer(Number(x), Number(y)); }
    },
    abandonnerEmmElement: function () {
        if (jeuDemelage) { jeuDemelage.abandonner(); }
    },
    setTangleTime: function (sec) {
        if (jeuDemelage) { jeuDemelage.setTimeLeft(sec); }
    },
    isTangleActif: function () { return !!jeuDemelage && jeuDemelage.estActif(); },
    sound: sound,
    getWind: function () { return { dir: wind.dir, strength: wind.strength }; },
    getVaneRotation: function () { return vaneArrow.rotation.y; },
    getTension: function () { return tension; },
    // Accrochage (vase / nénuphars) — exposé pour les tests de difficulté.
    getSnag: function () {
        if (!snag) {
            return null;
        }
        return {
            dansLaVase: !!snag.dansLaVase,
            tension: tension,
            clickPower: snag.clickPower,
            clickCooldown: snag.clickCooldown,
            elapsed: snag.elapsed,
            lastClick: snag.lastClick,
            pret: snag.clickCooldown <= 0
                || (snag.elapsed - snag.lastClick) >= snag.clickCooldown,
            enAttente: !!snag.enAttente,
            clics: snag.clics,
            clicsUtiles: snag.clicsUtiles
        };
    },
    getStruggleTimeLeft: function () { return struggleTimeLeft; },
    getLineLength: function () { return struggle ? struggle.lineLength : 0; },
    getStruggleTurnsNeeded: function () {
        if (!struggle) {
            return 0;
        }
        return Math.max(0, (struggle.lineLength - struggle.minLength) / REEL_PER_TURN);
    },
    getStruggleBaseLength: function () { return struggle ? struggle.baseLength : 0; },
    getUnitsPerTurn: function () { return REEL_PER_TURN; },
    // Simule les tours de manivelle (1 = un tour complet) pour les tests.
    turnCrank: function (turns) { crankRotationDelta += turns * TWO_PI; },
    reelClick: reelClick,
    // Amorçage (boule de nourriture) — exposé pour les tests.
    setFeedMode: setFeedMode,
    isFeedMode: function () { return feedMode; },
    getFeedState: function () { return feedState; },
    getFeedPower: function () { return feedPower; },
    getFeedTargetPower: function () { return feedTargetPower; },
    startFeedCharge: startFeedCharge,
    releaseFeed: releaseFeed,
    getFeedBall: function () { return feedBall; },
    getFeedLanding: function () { return { x: feedLanding.x, z: feedLanding.z }; },
    getFeedRange: function () { return { min: FEED_MIN_RANGE, max: FEED_MAX_RANGE }; },
    getPondCenter: function () { return { x: POND_CENTER.x, z: POND_CENTER.z }; },
    getPondRadius: function () { return POND_RADIUS; },
    // Contour généré de l'étang (idee 3) — exposé pour les tests et la carte.
    getRayonEtang: function (angle) { return rayonEtang(angle); },
    getRayonEtangMax: function () { return RAYON_ETANG_MAX; },
    getContourEtang: function (segments) {
        const n = Math.max(8, Math.floor(segments || 96));
        const points = [];
        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2;
            const rayonLocal = rayonEtang(angle);
            points.push({
                angle: angle,
                rayon: rayonLocal,
                x: POND_CENTER.x + Math.cos(angle) * rayonLocal,
                z: POND_CENTER.z + Math.sin(angle) * rayonLocal
            });
        }
        return points;
    },
    getFondMesh: function () { return pondBottom; },
    getShoreMesh: function () { return shore; },
    water: water,
    bourriche: bourriche,
    getWaterHeightAt: function (x, z) { return waterWaveHeightAt(x, z, testTime); },
    getBaitInterest: function () { return baitInterest; },
    // Mordillements avant la touche — exposés pour vérifier leur caractère aléatoire.
    getNibble: function () {
        return {
            interesse: baitInterest,
            actif: nibbleDebut >= 0,
            suivant: nibbleSuivant,
            duree: nibbleDuree,
            amplitude: nibbleAmplitude,
            phase: nibblePhase,
            graine: nibbleRngState
        };
    },
    getHookDepth: function () { return HOOK_DEPTH; },
    // Profondeur de la ligne (réglable) et relief de l'étang — pour les tests.
    getProfondeur: function () { return profondeurLigne; },
    setProfondeur: setProfondeur,
    getBornesProfondeur: function () { return bornesProfondeur().slice(); },
    profondeurLocale: profondeurLocale,
    // Profondeur maximale de l'étang (fond de la fosse la plus profonde).
    getProfondeurMaxEtang: function () {
        return FOND_CENTRE + Math.max.apply(null, FOSSES.map(function (f) { return f.plus; }));
    },
    fondY: fondY,
    isHameconDansLaVase: function () { return hameconDansLaVase; },
    getFloatOpacity: function () { return floatBody.material.opacity; },
    // Bourriche, carnet et lancer du poisson — exposé pour les tests.
    getBourriche: function () {
        return { x: BOURRICHE_POS.x, z: BOURRICHE_POS.z, radius: BOURRICHE_RADIUS };
    },
    getHeldFish: function () { return heldFish; },
    getFishThrowState: function () { return fishThrowState; },
    getFishThrowPower: function () { return fishThrowPower; },
    getFishThrowTargetPower: function () { return fishThrowTarget; },
    getFishThrowLanding: function () { return { x: fishThrowLanding.x, z: fishThrowLanding.z }; },
    startFishThrow: startFishThrow,
    setFishThrowPower: setFishThrowPower,
    releaseFishThrow: releaseFishThrow,
    storeHeldFish: storeHeldFish,
    dropHeldFish: dropHeldFish,
    getJournal: function () {
        return {
            total: journal.total, totalWeight: journal.totalWeight,
            best: journal.best, last: journal.last.slice(),
            especes: Object.assign({}, journal.especes)
        };
    },
    // Espèces disponibles (longueurs/poids réalistes calculés).
    getSpecies: function () {
        return SPECIES.map(function (s) {
            return {
                id: s.id, nom: s.nom, form: s.form, style: s.style,
                minCm: s.cm[0], maxCm: s.cm[1], k: s.k,
                minKg: Math.round(s.k * Math.pow(s.cm[0], 3) / 100000 * 1000) / 1000,
                maxKg: Math.round(s.k * Math.pow(s.cm[1], 3) / 100000 * 1000) / 1000,
                agressivite: s.agressivite.slice(),
                abondance: s.abondance,
                profondeur: s.profondeur ? s.profondeur.slice() : null,
                couleur: s.couleur,
                motif: s.motif
            };
        });
    },
    poidsRealisteKilos: poidsRealisteKilos,
    // Lancer au dosage et frein du moulinet — exposé pour les tests.
    getCastState: function () { return castState; },
    getCastPower: function () { return castPower; },
    getCastTargetPower: function () { return castTargetPower; },
    getCastAim: function () { return { x: castAim.x, z: castAim.z }; },
    setCastPower: setCastPower,
    startCastCharge: startCastCharge,
    releaseCast: releaseCast,
    cancelCast: cancelCast,
    setDragLoosened: setDragLoosened,
    isDragLoosened: function () { return dragLoosened; },
    // Météo et vie ambiante — exposé pour les tests.
    getWeather: function () { return weatherName(); },
    setWeather: setWeather,
    getRainAmount: function () { return weatherPluie; },
    getWindGusts: function () { return weatherRafales; },
    getAmbientCounts: function () {
        return { birds: birds.length, libellules: libellules.length, sauteur: sauteur.visible ? 1 : 0 };
    },
    getRainPoints: function () { return rainPoints; },
    getBirds: function () { return birds; },
    getBubbleCount: function () { return bubbles.length; },
    getRippleCount: function () { return ripples.length; },
    // Fiche des espèces, tutoriel et reflets — exposé pour les tests.
    getSpeciesCard: function () { return Object.assign({}, journal.especes); },
    openTutorial: openTutorial,
    closeTutorial: closeTutorial,
    nextTutorialStep: nextTutorialStep,
    isTutorialOpen: function () { return tutorial.classList.contains('open'); },
    getTutorialStep: function () {
        return { index: tutorialStepIndex, total: TUTORIAL_STEPS.length, texte: tutorialText.textContent };
    },
    setReflections: setReflections,
    getReflections: function () {
        return {
            enabled: reflections.enabled, supported: !!waterReflectionTarget,
            strength: waterUniforms.uReflectOn.value
        };
    },
    setDifficulty: setDifficulty,
    getDifficulty: function () { return { difficulty: DIFFICULTY, biteWindow: BITE_WINDOW }; },
    isJournalOpen: function () { return journalPanel.classList.contains('open'); },
    showJournal: showJournal,
    hideJournal: hideJournal,
    // Effets visuels (post-traitement maison) — exposé pour les tests.
    setVisualEffects: function (value) {
        post.enabled = !!value;
        effectsToggle.checked = !!value;
    },
    getVisualEffects: function () {
        return {
            enabled: post.enabled, supported: postSupported,
            bloom: post.strength, vignette: post.vignette
        };
    },
    // Configuration des cibles de rendu — exposé pour les tests (« voile blanc »).
    getPostConfig: function () {
        return {
            sceneDepthBuffer: SCENE_TARGET_OPTIONS.depthBuffer,
            bloomDepthBuffer: BLOOM_TARGET_OPTIONS.depthBuffer,
            bloom: post.strength,
            vignette: post.vignette
        };
    },
    makeSceneTarget: function (w, h) {
        return makePostTarget(w, h, SCENE_TARGET_OPTIONS);
    },
    getChum: function () {
        return chum ? {
            x: chum.position.x,
            y: chum.position.y,
            z: chum.position.z,
            radius: chum.radius,
            age: chum.age,
            lifetime: chum.lifetime,
            strength: chum.strength
        } : null;
    },
    setPaused: function (value) { paused = value; },
    step: function (dt) {
        if (cameraViewActive) {
            updateCameraPosition(dt);
            camera.lookAt(cameraTarget);
            return;
        }
        testTime += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateWater(testTime);
        updateFish(dt, testTime);
        updateSonar(dt, testTime);
        updateBateau(testTime);
        updateRameBateau(dt);
        updateFloat(dt, testTime);
        updateFeed(dt);
        updateChum(dt);
        updateRagondin(dt);
        updateCastAnimation(dt);
        updateArm(dt);
        updateRod(dt);
        updateQuiver(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, testTime);
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
        updateRipples(dt);
        updateMissRings(dt);
        updateFloatingTexts(dt);
        if (jeuDemelage) { jeuDemelage.update(dt); }
        updateLine();
        updateToolDock();
        majPadBateau();
    }
};

// La fiche des touches est construite tout à la fin : le catalogue des touches
// est déclaré plus bas dans le fichier (on évite ainsi un accès avant création).
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------



renderFicheTouches();
// Et on ouvre le carnet sur l'onglet « Prises ».
montrerOnglet('prises');
// Le poste par défaut est calé sur la rive LOCALE de l'étang généré : comme ce
// n'est pas un cercle, on ne peut pas se contenter des positions historiques.
placerAuPoste(0);

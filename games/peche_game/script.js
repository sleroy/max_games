import * as THREE from 'three';
// Le « ?v=232 » est essentiel : sans lui, le navigateur peut resservir une
// VIEILLE copie de sound.js gardée en mémoire, et le jeu plante alors avec
// « sound.setRain is not a function ». On numérote donc AUSSI les modules
// importés (la version doit rester la même que celle de index.html).
import { SoundEngine } from './sound.js?v=232';
import { creerJeuDemelage } from './demelage.js?v=232';
import { creerModeQuiver } from './quiver.js?v=232';
import { SCIONS, SCIONS_DE_DEPART, SPECIES, COMPORTEMENTS, STYLES_COMBAT, STYLE_DEFAUT, FORMES, FORMES_PAR_TYPE, TOUCHES, TOUCHES_PAR_ID } from './especes.js?v=232';
import { creerClassement } from './classement.js';
import { dessinerPortrait } from './portraits.js?v=232';
import { creerPoissons } from './poissons.js?v=232';
import { POND_CENTER, POND_RADIUS, RIVE_Y, RAYON_ETANG_MAX, rayonEtang,
    FOND_BORD, FOND_CENTRE, FOSSES, profondeurLocale, fondY, verdictFond as verdictFondBase, MARGE_VASE, DEMI_COTE_FOND, PROFONDEUR_MAX, RAYON_CADRE_CARTE, SURFACE_HA,
    ajouterFond, makeWaterGeometry, makeShoreGeometry } from './environnement.js?v=232';
import { creerDecor } from './decor.js?v=232';
import { creerObstacles } from './obstacles.js?v=232';
import { creerSubstrats } from './substrats.js?v=232';
import { creerEsches } from './esches.js?v=232';
import { ligneQuiver } from './chanceTouche.js?v=232';
import { chargerCarnet, sauverCarnet } from './carnet.js?v=232';
import { creerBourriche } from './bourriche.js?v=232';
import { creerOndulations } from './ondulations.js?v=232';
import { creerMessages } from './messages.js?v=232';
import { creerSplashes } from './splashes.js?v=232';
import { creerCombat } from './combat.js?v=232';
import { creerComportement } from './comportement.js?v=232';
import { creerBateau } from './bateau.js?v=232';
import { creerLancerPoisson } from './lancerPoisson.js?v=232';
import { creerCarnetUI } from './carnetUI.js?v=232';
import { creerBoutique } from './boutique.js?v=232';
import { creerMenus } from './menus.js?v=232';
import { creerFiches } from './fiches.js?v=232';
import { creerLancerCanne } from './lancerCanne.js?v=232';
import { creerLancer } from './lancer.js?v=232';
import { creerAmorcage } from './amorcage.js?v=232';
import { creerFrein } from './frein.js?v=232';
import { creerLigne } from './ligne.js?v=232';
import { creerBouchons } from './bouchons.js?v=232';
import { creerPlacement } from './placement.js?v=232';
import { creerMeteo } from './meteo.js?v=232';
import { creerPhysique } from './physique.js?v=232';
import { creerVie } from './vie.js?v=232';
import { creerSonar } from './sonar.js?v=232';
import { creerStocks } from './stocks.js?v=232';
import { creerJournal } from './journal.js?v=232';
import { creerTouches } from './touches.js?v=232';
import { creerCycleLigne } from './cycleLigne.js?v=232';
import { creerAccrochage } from './accrochage.js?v=232';
import { creerAmbiance } from './ambiance.js?v=232';
import { creerEntrees } from './entrees.js?v=232';
import { creerRadar } from './radar.js?v=232';
import { creerCheat } from './cheat.js?v=232';
import { creerBoucle } from './boucle.js?v=232';
import { creerPartie } from './partie.js?v=232';
import { creerPecheur } from './pecheur.js?v=232';
import { creerRendu } from './rendu.js?v=232';
import { etat } from './etat.js?v=232';

// ---------------------------------------------------------------------------
// ÉTAT PARTAGÉ (voir etat.js) : accesseurs vers les variables `let` de ce
// fichier. Une ligne par variable ; aucune valeur n'est dupliquée : les
// modules extraits lisent et écrivent la vraie variable de ce fichier.
// Placé avant la création des modules : ils écrivent dans `etat` dès leur création.
// ---------------------------------------------------------------------------
function lienEtat(nom, lire, ecrire) {
    Object.defineProperty(etat, nom, { get: lire, set: ecrire, enumerable: true });
}
lienEtat('AMORCE_DEPART', function () { return AMORCE_DEPART; }, function (v) { AMORCE_DEPART = v; });
lienEtat('BATEAU_PAS_ANGLE', function () { return BATEAU_PAS_ANGLE; }, function (v) { BATEAU_PAS_ANGLE = v; });
lienEtat('BATEAU_PAS_MARGE', function () { return BATEAU_PAS_MARGE; }, function (v) { BATEAU_PAS_MARGE = v; });
lienEtat('BATEAU_PRIX', function () { return BATEAU_PRIX; }, function (v) { BATEAU_PRIX = v; });
lienEtat('BITE_WINDOW', function () { return BITE_WINDOW; }, function (v) { BITE_WINDOW = v; });
lienEtat('BLOOM_TARGET_OPTIONS', function () { return BLOOM_TARGET_OPTIONS; }, function (v) { BLOOM_TARGET_OPTIONS = v; });
lienEtat('BOUCHONS_DE_DEPART', function () { return BOUCHONS_DE_DEPART; }, function (v) { BOUCHONS_DE_DEPART = v; });
lienEtat('CARTE_3D_BANDE_SEGMENTS', function () { return CARTE_3D_BANDE_SEGMENTS; }, function (v) { CARTE_3D_BANDE_SEGMENTS = v; });
lienEtat('CARTE_3D_EAU_Y', function () { return CARTE_3D_EAU_Y; }, function (v) { CARTE_3D_EAU_Y = v; });
lienEtat('CARTE_3D_MONDE', function () { return CARTE_3D_MONDE; }, function (v) { CARTE_3D_MONDE = v; });
lienEtat('CARTE_3D_SEGMENTS', function () { return CARTE_3D_SEGMENTS; }, function (v) { CARTE_3D_SEGMENTS = v; });
lienEtat('CARTE_3D_TAILLE', function () { return CARTE_3D_TAILLE; }, function (v) { CARTE_3D_TAILLE = v; });
lienEtat('CAST_DURATION', function () { return CAST_DURATION; }, function (v) { CAST_DURATION = v; });
lienEtat('CAST_SWING_CHARGE', function () { return CAST_SWING_CHARGE; }, function (v) { CAST_SWING_CHARGE = v; });
lienEtat('CAST_SWING_RELEASE', function () { return CAST_SWING_RELEASE; }, function (v) { CAST_SWING_RELEASE = v; });
lienEtat('CAST_YAW_ANGLER_MAX', function () { return CAST_YAW_ANGLER_MAX; }, function (v) { CAST_YAW_ANGLER_MAX = v; });
lienEtat('CAST_YAW_ROD_MAX', function () { return CAST_YAW_ROD_MAX; }, function (v) { CAST_YAW_ROD_MAX = v; });
lienEtat('CHUM_ATTRACT_ACCEL', function () { return CHUM_ATTRACT_ACCEL; }, function (v) { CHUM_ATTRACT_ACCEL = v; });
lienEtat('DIFFICULTY', function () { return DIFFICULTY; }, function (v) { DIFFICULTY = v; });
lienEtat('FEED_MAX_RANGE', function () { return FEED_MAX_RANGE; }, function (v) { FEED_MAX_RANGE = v; });
lienEtat('FEED_MIN_RANGE', function () { return FEED_MIN_RANGE; }, function (v) { FEED_MIN_RANGE = v; });
lienEtat('FLOTTEURS', function () { return FLOTTEURS; }, function (v) { FLOTTEURS = v; });
lienEtat('FLOTTEUR_ECHELLE', function () { return FLOTTEUR_ECHELLE; }, function (v) { FLOTTEUR_ECHELLE = v; });
lienEtat('HOOK_DEPTH', function () { return HOOK_DEPTH; }, function (v) { HOOK_DEPTH = v; });
lienEtat('LINE_SEGMENTS', function () { return LINE_SEGMENTS; }, function (v) { LINE_SEGMENTS = v; });
lienEtat('MAX_LIGNES', function () { return MAX_LIGNES; }, function (v) { MAX_LIGNES = v; });
lienEtat('RECHARGES', function () { return RECHARGES; }, function (v) { RECHARGES = v; });
lienEtat('SCENE_TARGET_OPTIONS', function () { return SCENE_TARGET_OPTIONS; }, function (v) { SCENE_TARGET_OPTIONS = v; });
lienEtat('SONAR_PRICE', function () { return SONAR_PRICE; }, function (v) { SONAR_PRICE = v; });
lienEtat('TAILLE_LOT', function () { return TAILLE_LOT; }, function (v) { TAILLE_LOT = v; });
lienEtat('TUTORIAL_STEPS', function () { return TUTORIAL_STEPS; }, function (v) { TUTORIAL_STEPS = v; });
lienEtat('TYPES_DE_FIL', function () { return TYPES_DE_FIL; }, function (v) { TYPES_DE_FIL = v; });
lienEtat('VITESSE_MANIVELLE_MAX', function () { return VITESSE_MANIVELLE_MAX; }, function (v) { VITESSE_MANIVELLE_MAX = v; });
lienEtat('VITESSE_TOUCHES', function () { return VITESSE_TOUCHES; }, function (v) { VITESSE_TOUCHES = v; });
lienEtat('ZONES_CARTE', function () { return ZONES_CARTE; }, function (v) { ZONES_CARTE = v; });
lienEtat('amorceDepartRestante', function () { return amorceDepartRestante; }, function (v) { amorceDepartRestante = v; });
lienEtat('angler', function () { return angler; }, function (v) { angler = v; });
lienEtat('anglerYawBase', function () { return anglerYawBase; }, function (v) { anglerYawBase = v; });
lienEtat('annoncerRecord', function () { return annoncerRecord; }, function (v) { annoncerRecord = v; });
lienEtat('arm', function () { return arm; }, function (v) { arm = v; });
lienEtat('avantageFerrage', function () { return avantageFerrage; }, function (v) { avantageFerrage = v; });
lienEtat('avertissementsVitesse', function () { return avertissementsVitesse; }, function (v) { avertissementsVitesse = v; });
lienEtat('baitInterest', function () { return baitInterest; }, function (v) { baitInterest = v; });
lienEtat('bateauGroupe', function () { return bateauGroupe; }, function (v) { bateauGroupe = v; });
lienEtat('bateauRame', function () { return bateauRame; }, function (v) { bateauRame = v; });
lienEtat('birds', function () { return birds; }, function (v) { birds = v; });
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
lienEtat('bubbles', function () { return bubbles; }, function (v) { bubbles = v; });
lienEtat('camera', function () { return camera; }, function (v) { camera = v; });
lienEtat('cameraMode', function () { return cameraMode; }, function (v) { cameraMode = v; });
lienEtat('cameraViewActive', function () { return cameraViewActive; }, function (v) { cameraViewActive = v; });
lienEtat('cancelCast', function () { return cancelCast; }, function (v) { cancelCast = v; });
lienEtat('carteCamera', function () { return carteCamera; }, function (v) { carteCamera = v; });
lienEtat('carteGeometrie', function () { return carteGeometrie; }, function (v) { carteGeometrie = v; });
lienEtat('carteMarqueur', function () { return carteMarqueur; }, function (v) { carteMarqueur = v; });
lienEtat('carteMaxY', function () { return carteMaxY; }, function (v) { carteMaxY = v; });
lienEtat('carteMinY', function () { return carteMinY; }, function (v) { carteMinY = v; });
lienEtat('carteSousLEau', function () { return carteSousLEau; }, function (v) { carteSousLEau = v; });
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
lienEtat('clock', function () { return clock; }, function (v) { clock = v; });
lienEtat('coupePrete', function () { return coupePrete; }, function (v) { coupePrete = v; });
lienEtat('crankAngle', function () { return crankAngle; }, function (v) { crankAngle = v; });
lienEtat('crankRotationDelta', function () { return crankRotationDelta; }, function (v) { crankRotationDelta = v; });
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
lienEtat('fishThrowLanding', function () { return fishThrowLanding; }, function (v) { fishThrowLanding = v; });
lienEtat('fishThrowOrigin', function () { return fishThrowOrigin; }, function (v) { fishThrowOrigin = v; });
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
lienEtat('hameconDansZone', function () { return hameconDansZone; }, function (v) { hameconDansZone = v; });
lienEtat('heldFish', function () { return heldFish; }, function (v) { heldFish = v; });
lienEtat('hideBiteView', function () { return hideBiteView; }, function (v) { hideBiteView = v; });
lienEtat('hookedFish', function () { return hookedFish; }, function (v) { hookedFish = v; });
lienEtat('isMobileDevice', function () { return isMobileDevice; }, function (v) { isMobileDevice = v; });
lienEtat('jeuDemelage', function () { return jeuDemelage; }, function (v) { jeuDemelage = v; });
lienEtat('journal', function () { return journal; }, function (v) { journal = v; });
lienEtat('journalStore', function () { return journalStore; }, function (v) { journalStore = v; });
lienEtat('libellules', function () { return libellules; }, function (v) { libellules = v; });
lienEtat('ligneTendue', function () { return ligneTendue; }, function (v) { ligneTendue = v; });
lienEtat('lignesRestantes', function () { return lignesRestantes; }, function (v) { lignesRestantes = v; });
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
lienEtat('partieStats', function () { return partieStats; }, function (v) { partieStats = v; });
lienEtat('partieTerminee', function () { return partieTerminee; }, function (v) { partieTerminee = v; });
lienEtat('paused', function () { return paused; }, function (v) { paused = v; });
lienEtat('poidsRealisteKilos', function () { return poidsRealisteKilos; }, function (v) { poidsRealisteKilos = v; });
lienEtat('pointerNdc', function () { return pointerNdc; }, function (v) { pointerNdc = v; });
lienEtat('portraitEspeceCourante', function () { return portraitEspeceCourante; }, function (v) { portraitEspeceCourante = v; });
lienEtat('post', function () { return post; }, function (v) { post = v; });
lienEtat('postSupported', function () { return postSupported; }, function (v) { postSupported = v; });
lienEtat('posteActuel', function () { return posteActuel; }, function (v) { posteActuel = v; });
lienEtat('profondeurLigne', function () { return profondeurLigne; }, function (v) { profondeurLigne = v; });
lienEtat('ragondin', function () { return ragondin; }, function (v) { ragondin = v; });
lienEtat('ragondinAuto', function () { return ragondinAuto; }, function (v) { ragondinAuto = v; });
lienEtat('ragondinHits', function () { return ragondinHits; }, function (v) { ragondinHits = v; });
lienEtat('ragondinTimer', function () { return ragondinTimer; }, function (v) { ragondinTimer = v; });
lienEtat('ragondinVolTimer', function () { return ragondinVolTimer; }, function (v) { ragondinVolTimer = v; });
lienEtat('rainPoints', function () { return rainPoints; }, function (v) { rainPoints = v; });
lienEtat('raycaster', function () { return raycaster; }, function (v) { raycaster = v; });
lienEtat('recordBattu', function () { return recordBattu; }, function (v) { recordBattu = v; });
lienEtat('renderBoutique', function () { return renderBoutique; }, function (v) { renderBoutique = v; });
lienEtat('renderer', function () { return renderer; }, function (v) { renderer = v; });
lienEtat('rodBase', function () { return rodBase; }, function (v) { rodBase = v; });
lienEtat('rodBend', function () { return rodBend; }, function (v) { rodBend = v; });
lienEtat('rodGroup', function () { return rodGroup; }, function (v) { rodGroup = v; });
lienEtat('rodLocalTip', function () { return rodLocalTip; }, function (v) { rodLocalTip = v; });
lienEtat('rodPivot', function () { return rodPivot; }, function (v) { rodPivot = v; });
lienEtat('rodTip', function () { return rodTip; }, function (v) { rodTip = v; });
lienEtat('rodTipVisual', function () { return rodTipVisual; }, function (v) { rodTipVisual = v; });
lienEtat('rodYawBase', function () { return rodYawBase; }, function (v) { rodYawBase = v; });
lienEtat('sauteur', function () { return sauteur; }, function (v) { sauteur = v; });
lienEtat('scene', function () { return scene; }, function (v) { scene = v; });
lienEtat('sceneTarget', function () { return sceneTarget; }, function (v) { sceneTarget = v; });
lienEtat('scionChoix', function () { return scionChoix; }, function (v) { scionChoix = v; });
lienEtat('score', function () { return score; }, function (v) { score = v; });
lienEtat('shake', function () { return shake; }, function (v) { shake = v; });
lienEtat('showCatchMessage', function () { return showCatchMessage; }, function (v) { showCatchMessage = v; });
lienEtat('signalerToucheRatee', function () { return signalerToucheRatee; }, function (v) { signalerToucheRatee = v; });
lienEtat('snag', function () { return snag; }, function (v) { snag = v; });
lienEtat('snagFreed', function () { return snagFreed; }, function (v) { snagFreed = v; });
lienEtat('sonarBuoy', function () { return sonarBuoy; }, function (v) { sonarBuoy = v; });
lienEtat('sonarDernierPing', function () { return sonarDernierPing; }, function (v) { sonarDernierPing = v; });
lienEtat('sonarHorloge', function () { return sonarHorloge; }, function (v) { sonarHorloge = v; });
lienEtat('sonarOndes', function () { return sonarOndes; }, function (v) { sonarOndes = v; });
lienEtat('sonarPings', function () { return sonarPings; }, function (v) { sonarPings = v; });
lienEtat('sonarScanTimer', function () { return sonarScanTimer; }, function (v) { sonarScanTimer = v; });
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
lienEtat('weatherRafales', function () { return weatherRafales; }, function (v) { weatherRafales = v; });

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
const kidCue = document.getElementById('kidCue');
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
const accueilTechniqueRadios = {
    bouchon: document.getElementById('accueilTechniqueBouchon'),
    quiver: document.getElementById('accueilTechniqueQuiver')
};
const accueilDifficulteRadios = {
    facile: document.getElementById('accueilDifficulteFacile'),
    normal: document.getElementById('accueilDifficulteNormal'),
    dur: document.getElementById('accueilDifficulteDur')
};

// Coche le bon bouton d'un groupe de l'accueil (sans dropdown).
function majChoixRadio(radios, valeur) {
    Object.keys(radios || {}).forEach(function (cle) {
        if (radios[cle]) { radios[cle].checked = (cle === valeur); }
    });
}
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
//
// La GRAINE, elle, change à chaque chargement : un F5 doit donner un étang
// neuf (poissons et décors ailleurs). Elle reste pilotable pour rejouer un
// monde précis : `window.__PECHE_SEED` (harnais de test) ou `?graine=N`.
// ---------------------------------------------------------------------------
function graineDeDepart() {
    if (typeof window !== 'undefined' && window.__PECHE_SEED !== undefined) {
        const forcee = Number(window.__PECHE_SEED);
        if (Number.isFinite(forcee)) { return forcee >>> 0; }
    }
    if (typeof location !== 'undefined' && location && location.search) {
        const rejouee = Number(new URLSearchParams(location.search).get('graine'));
        if (Number.isFinite(rejouee)) { return rejouee >>> 0; }
    }
    const alea = (typeof crypto !== 'undefined' && crypto.getRandomValues)
        ? crypto.getRandomValues(new Uint32Array(1))[0]
        : Math.floor(Math.random() * 4294967296);
    return (alea ^ (Date.now() >>> 0)) >>> 0;
}

let rngState = graineDeDepart();

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
// Le combat d'un poisson est aussi dur en Facile qu'en Normal (§17.7, `difficulty` 1,3) : le
// mode enfant n'aide qu'à DÉTECTER la touche (fenêtre, densité, pas d'emmêlement). Le mode Dur
// reste plus dur : poisson plus fort, épreuve plus courte, fenêtre de ferrage plus courte.
// ---------------------------------------------------------------------------
// `poissons` = facteur de DENSITE (demande du joueur 2026-11-16) : facile ×3,
// normale ×2, difficile ×1,5. Il multiplie la population calculee par la surface.
const DIFFICULTY_MODES = {
    // §17.7 : `difficulty` (combativité) est la MEME en facile et en normal — le mode
    // enfant n'aide que la détection. §17.8 : `xp` récompense la difficulté choisie.
    facile: { difficulty: 1.3, biteWindow: 1.6, tangleChance: 0, poissons: 3, xp: 0.75 },
    normal: { difficulty: 1.3, biteWindow: 0.7, tangleChance: 0.08, poissons: 2, xp: 1 },
    dur: { difficulty: 1.6, biteWindow: 0.55, tangleChance: 0.15, poissons: 1.5, xp: 1.5 }
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
    if (paused || (event.button !== undefined && event.button !== 0)) { return; }
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

let isMobileDevice;
let renderer;
let post;
let postSupported;
let sceneTarget;
let SCENE_TARGET_OPTIONS;
let BLOOM_TARGET_OPTIONS;
const {
    makePostTarget, resizePost, renderWithPost
} = creerRendu({
    canvas
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ea);
// Brume : l'étang fait maintenant jusqu'à ≈ 210 unités de large et le pêcheur peut
// se tenir à n'importe quelle rive. Elle commence à 150 et noie tout à 480 : la rive
// opposée (≈ 200 unités) reste nette, seuls l'horizon et le bord du terrain se fondent.
scene.fog = new THREE.Fog(0x9fd3ea, 150, 480);

// Ciel dégradé
const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        topColor: { value: new THREE.Color(0x4a9fd8) },
        bottomColor: { value: new THREE.Color(0xe6f6fd) },
        offset: { value: 52 },   // 30 × (520 / 300) : même dégradé avec la sphère agrandie
        exponent: { value: 0.7 }
    },
    vertexShader: 'varying vec3 vWorldPosition; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
});
// Sphère du ciel : 520 (au lieu de 300) pour englober la brume (480) et la caméra, qui
// peut maintenant s'éloigner de ≈ 190 unités de l'origine (poste à la rive nord).
const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 16), skyMat);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 900);
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
// Position du soleil RELATIVE au centre des ombres (voir suivreOmbres) : c'est ce
// décalage, et lui seul, qui donne la direction de la lumière.
const sunDecalage = new THREE.Vector3(SUN_DIRECTION.x * 70, 73, SUN_DIRECTION.z * 70);
sunLight.position.copy(sunDecalage);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(isMobileDevice ? 512 : 1024, isMobileDevice ? 512 : 1024);
// La carte d'ombre couvre 180 × 180 unités. Depuis v173 l'étang fait ≈ 210 unités de
// large : une carte fixe ne couvrirait plus tous les postes. Elle SUIT donc le pêcheur
// (suivreOmbres) et couvre toujours la rive, le matériel et la moitié proche de l'eau.
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
scene.add(sunLight.target);

// Centre des ombres : 35 unités devant le pêcheur, vers le milieu de l'étang. La
// lumière garde la même direction (même décalage) : seul son point de visée bouge.
const ombreCentre = new THREE.Vector3();
function suivreOmbres() {
    if (!angler) { return; }
    ombreCentre.set(POND_CENTER.x - angler.position.x, 0, POND_CENTER.z - angler.position.z);
    const d = ombreCentre.length() || 1;
    ombreCentre.multiplyScalar(Math.min(35, d) / d).add(angler.position);
    ombreCentre.y = 0;
    sunLight.target.position.copy(ombreCentre);
    sunLight.position.copy(ombreCentre).add(sunDecalage);
}

// Disque du soleil : posé dans le ciel RELATIVEMENT à la caméra (120 unités dans la
// direction de la lumière). Fixé au monde, il se retrouvait derrière la caméra ou dans
// un arbre dès que le poste changeait de rive (l'étang fait maintenant 210 unités).
const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(10, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false })
);
sunMesh.position.copy(sunDecalage).multiplyScalar(1.2);
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
sunGlow.scale.set(140, 140, 1);
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
    if (!etat.horlogeGelee) { dayPhase = (dayPhase + dt / DAY_LENGTH) % 1; }   // gelée par setHeure (tests)
    const angle = dayPhase * Math.PI * 2;
    const daylight = Math.max(0, Math.sin(angle)); // 0 la nuit, 1 en plein jour
    // LUMINOSITÉ DU POSTE : le soleil est TOUJOURS au sud-ouest ; selon l'endroit
    // où l'on pêche, on l'a dans le dos, de côté ou en plein contre-jour.
    const exposition = expositionPoste();
    // Soleil : azimut FIXE (sud-ouest), seule l'élévation suit le cycle du jour.
    sunDecalage.set(SUN_DIRECTION.x * 70, 12 + daylight * 65, SUN_DIRECTION.z * 70);
    suivreOmbres();
    sunLight.intensity = (0.25 + daylight * 1.05) * exposition;
    sunLight.color.copy(SUN_WARM).lerp(SUN_DAY, daylight);
    sunMesh.position.copy(camera.position).addScaledVector(sunDecalage.clone().normalize(), 120);
    sunGlow.position.copy(sunMesh.position);
    // La même direction pour le reflet solaire du shader d'eau (plus de valeur
    // codée en dur : le soleil peut être ailleurs qu'au sud-ouest).
    waterUniforms.uSunDir.value.copy(sunDecalage).normalize();
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
    // Nuages répartis sur tout le ciel de l'étang (≈ 440 × 340 unités, v173).
    cloud.position.set(-220 + rand() * 440, 42 + rand() * 22, -280 + rand() * 320);
    scene.add(cloud);
    clouds.push(cloud);
}

// ---------------------------------------------------------------------------
// Étang : géométrie du monde (centre, contour, relief, fond) — module dédié.
// ---------------------------------------------------------------------------
const pondBottom = ajouterFond(scene);

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
    // 0 = eau normale ; 1 = eau presque transparente (cheat « aquarium »).
    uClear: { value: 0 },
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
        attribute float aDepth;
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
            // Profondeur RÉELLE de l'étang sous ce sommet : elle est calculée côté
            // JavaScript (profondeurLocale : contour, cuvette et fosses) et stockée
            // dans le maillage (aDepth). Plus aucune constante de l'étang dans le
            // shader : agrandir l'étang ou déplacer une fosse suffit, rien à recopier.
            vDepth = aDepth;
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
        uniform float uClear;
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
            // Les FOSSES (au-delà de 5 unités) foncent encore : on lit les zones
            // profondes d'un coup d'œil, depuis la berge comme depuis la barque.
            col = mix(col, uDeep * 0.55, clamp((vDepth - 5.0) / 3.2, 0.0, 1.0) * 0.7);
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
            // Cheat « aquarium » : l'eau s'efface presque entièrement pour
            // laisser voir les poissons sous la surface.
            alpha = mix(alpha, 0.10, uClear);
            gl_FragColor = vec4(col, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
});

// Résolution du maillage d'eau : l'étang a 1,6 fois plus de rayon, on garde un pas de
// ≈ 2,5 unités entre anneaux et ≈ 5 unités entre rayons (houle en vertex shader).
const EAU_ANNEAUX = 40;
const EAU_SEGMENTS = 128;
const water = new THREE.Mesh(makeWaterGeometry(EAU_ANNEAUX, EAU_SEGMENTS), waterMaterial);
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

// Le sol s'étend jusqu'à 430 unités du centre (brume totale à 480 de la caméra) : on ne
// voit jamais son bord. La texture d'herbe garde sa densité (180 × 430/220 ≈ 350).
const RIVE_RAYON_EXTERIEUR = 430;
const RIVE_TEXTURE_REPETITIONS = 350;
const shore = new THREE.Mesh(
    makeShoreGeometry(RIVE_RAYON_EXTERIEUR, 128),
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
                    texture.repeat.set(RIVE_TEXTURE_REPETITIONS, RIVE_TEXTURE_REPETITIONS);
                } catch {
                    // Un navigateur peut bloquer les workers ou WebAssembly.
                }
            }
            material[property] = texture || chargerTexture(name + '.jpg', RIVE_TEXTURE_REPETITIONS, RIVE_TEXTURE_REPETITIONS, srgb);
            material.needsUpdate = true;
        }));
    } catch {
        for (const [property, name, srgb] of maps) {
            material[property] = chargerTexture(name + '.jpg', RIVE_TEXTURE_REPETITIONS, RIVE_TEXTURE_REPETITIONS, srgb);
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
const wind = {
    dir: 0,
    strength: 0,
    targetDir: 0,
    targetStrength: 0,
    timer: 0
};
const decor = creerDecor({
    scene: scene,
    chargerTexture: chargerTexture,
    rand: rand,
    rayonEtang: rayonEtang,
    POND_CENTER: POND_CENTER,
    RIVE_Y: RIVE_Y, wind: wind   // wind : roseaux et herbe ondulent au vent (vegetation.js)
});
const { lilyPads } = decor;

// Types de fond (§14.3) : grille déterministe (sans rand()) lue par la texture du fond, la carte, les poissons et les accrochages.
const substrats = creerSubstrats({ POND_CENTER, rayonEtang, profondeurLocale, FOSSES, RAYON_ETANG_MAX, DEMI_COTE_FOND, MARGE_VASE,
    verdictBase: verdictFondBase, lilyPads, roseaux: decor.roseaux });
substrats.habillerFond(pondBottom);
const verdictFond = substrats.verdictFond;   // SOURCE UNIQUE du fond sous l'hameçon (§14.8), substrat compris

// ---------------------------------------------------------------------------
// Vent + girouette
// ---------------------------------------------------------------------------

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

let angler;
let arm;
let rodBase;
let rodTip;
let rodLocalTip;
let rodPivot;
let rodGroup;
let rodTipVisual;
let rodBend;
let castSwing;
let castSwingDepart;
let castYawAngler;
let castYawRod;
let anglerYawBase;
let rodYawBase;
let CAST_SWING_CHARGE;
let CAST_SWING_RELEASE;
let CAST_YAW_ANGLER_MAX;
let CAST_YAW_ROD_MAX;
const {
    angleNormalise, updateRod
} = creerPecheur({
    RIVE_Y, scene
});

// ---------------------------------------------------------------------------
// Mode QUIVER : le module quiver.js gère le dessin du scion et ses mouvements.
// ---------------------------------------------------------------------------
// Le quiver se pêche AU FOND (comme la pêche à l'anglaise « posée ») : l'hameçon
// repose sur le relief à l'endroit où la ligne est tombée.
let profondeurBouchonMemo = null;
function poserHameconAuFond() {
    if (profondeurBouchonMemo === null) { profondeurBouchonMemo = profondeurLigne; }
    const enEau = floatState !== 'idle' && floatState !== 'flying';
    const lieu = enEau ? floatGroup.position : castTarget;   // sous le bouchon dès qu'il est à l'eau
    const fond = ligneQuiver(profondeurLocale(lieu.x, lieu.z));   // posé juste au-dessus de la vase (chanceTouche.js)
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
    majChoixRadio(accueilTechniqueRadios, techniqueCourante);
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
        majChoixRadio(accueilTechniqueRadios, techniqueCourante);
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
    updateDepthButtons, setProfondeur, majCoupeProfondeur
} = creerLigne({
    scene, flotteurCourant: (...args) => flotteurCourant(...args), depthLabel, nombreMetres, depthMinus, depthPlus, verdictFond,
    coupe: {
        cadre: document.getElementById('depthCross'), fond: document.getElementById('depthBottomLine'),
        fil: document.getElementById('depthHookLine'), hamecon: document.getElementById('depthHook'),
        zone: document.getElementById('depthZoneLabel'), indice: document.getElementById('depthHint'), substrat: document.getElementById('depthFond'), thermo: document.getElementById('depthThermo')
    }
});

// COUPE DE L'EAU : le schéma (éléments `coupe`, passés à ligne.js, qui le dessine).
const depthRange = document.getElementById('depthRange');
let dernierCoupe = -1;
let coupePrete = false;   // le schéma attend que le jeu soit entièrement initialisé

function nombreMetres(unites) {
    return (unites / 2).toFixed(1).replace('.', ',') + ' m';
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
    saveJournal: (...args) => saveJournal(...args), scionSelect, renderJournal: (...args) => renderJournal(...args)
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
const { setFeedMode, startFeedCharge, moveFeedAim, releaseFeed, cancelFeed, updateFeed } = creerLancer({
    scene, angler, feedGaugeFill, feedGaugeTarget, feedGauge, statusDisplay, ensureSound, POND_CENTER, wind, rayonEtang, sound });
const { updateChum, updateArm, fermerOutils, updateToolDock } = creerAmorcage({
    scene, stockAmorce: (...args) => stockAmorce(...args), feedButton, majAmorce: (...args) => majAmorce(...args),
    ensureSound, POND_CENTER, wind, rayonEtang, saveJournal: (...args) => saveJournal(...args), sound, arm, toolDock, toolToggle,
    setCameraView, cameraButton, depthPanel, quickFeedButton, lineSelect, updateDepthButtons, bornesProfondeur, sonarButton, cancelFeed });

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
// Obstacles aquatiques (ponton, écluse, roches, souches…) : placement sans rand().
const obstacles = creerObstacles({ scene, POND_CENTER, rayonEtang, fondY, FOSSES, lilyPads, decor, ANGLE_BASE,
    POSTES, POSTE_ANGLER, POSTE_BOURRICHE, POSTE_MARGE, RIVE_Y });

let BATEAU_PAS_ANGLE = 0.055;
let BATEAU_PAS_MARGE = 2.4;   // v173 : étang 1,6 × plus grand → pas d'avancée × 1,5
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
    renderCartePlacement: (...args) => renderCartePlacement(...args), obstacles
});

let CARTE_3D_TAILLE;
let CARTE_3D_MONDE;
let CARTE_3D_SEGMENTS;
let CARTE_3D_EAU_Y;
let CARTE_3D_BANDE_SEGMENTS;
let carteCamera;
let carteGeometrie;
let carteMinY;
let carteMaxY;
let carteSousLEau;
let carteMarqueur;
let heldFish;
let fishThrowState;
let fishThrowPower;
let fishThrowTarget;
let fishThrowPhase;
let fishThrowT;
let fishThrowLanding;
let fishThrowOrigin;
const {
    hauteurCarte, projeterPlacement, cheminContourEtang, renderCartePlacement
} = creerPlacement({
    POND_CENTER, rayonEtang, profondeurLocale, RIVE_Y, directionAzimut, SUN_AZIMUT,
    PLACEMENT_MARGE_MIN, PLACEMENT_MARGE_MAX, cartePlacement, POSTE_MARGE, cartePlacementAide,
    azimutPosteTexte, POSTES, cartePlacementRepere, ensureSound, choisirEmplacement, obstacles,
    majEtiquettePoste
});

// ---------------------------------------------------------------------------
// Carnet de pêche (conservé dans le navigateur quand c'est possible)
// ---------------------------------------------------------------------------
let SONAR_PRICE;
let BATEAU_PRIX;
let sonarBuoy;
let sonarScanTimer;
let sonarOndes;
let sonarHorloge;
let sonarDernierPing;
let sonarPings;
const {
    acheterSonar, acheterBateau, rangerSonar, updateSonar
} = creerSonar({
    scene, sonarRadar, saveJournal: (...args) => saveJournal(...args), renderJournal: (...args) => renderJournal(...args), sonarPanel, sonarButton, waterWaveHeightAt,
    sound, sonarCount, POND_CENTER, rayonEtang, fermerOutils, setFeedMode, obstacles
});

let MAX_LIGNES;
let AMORCE_DEPART;
let RECHARGES;
let TYPES_DE_FIL;
let TAILLE_LOT;
let lignesRestantes;
let amorceDepartRestante;
let journal;
const {
    stockAmorce, majAmorce, stockFil, totalLignes, filEquipe, selectionnerFilDisponible,
    debiterLigne, acheterRecharge
} = creerStocks({
    SCIONS_DE_DEPART, feedButton, quickFeedCount, quickFeedButton, saveJournal: (...args) => saveJournal(...args), majLignes: (...args) => majLignes(...args),
    renderJournal: (...args) => renderJournal(...args), lineSelect, statusDisplay
});

// Compteur de la PARTIE en cours (la bourriche), distinct du carnet persistant
// (`journal.total` = total de toutes les parties).
let bourricheCount = 0;
// XP gagnée DANS LA PARTIE : repart à zéro à chaque JOUER. L'XP carrière
// (`journal.experience`) reste persistante pour la boutique (décision v97).
let experiencePartie = 0;
// Technique de pêche : 'bouchon' (flotteur) ou 'quiver' (scion de canne).
const modeQuiver = creerModeQuiver({ canvas: quiverCanvas, panel: quiverPanel });

let journalStore;
const {
    loadJournal, saveJournal, fmtPoids, renderJournal, addJournalEntry
} = creerJournal({
    chargerCarnet, trouverFlotteur, SCIONS_DE_DEPART, trouverScion, sauverCarnet, journalStats,
    journalList, journalEspeces, bourricheLabel, xpLabel, xpTop, shopXp
});

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

// Menus déroulants de la barre du haut (v192) : 🪱 Esche et 🎈 Matériel (bouchons ou scions).
// Un clic ouvre un petit panneau superposé au jeu (pas de modale, pas de fond assombri).
const menus = creerMenus({
    boutonEsche: document.getElementById('escheTopButton'), menuEsche: document.getElementById('escheTopMenu'),
    boutonMateriel: document.getElementById('materielTopButton'), menuMateriel: document.getElementById('materielTopMenu'),
    ESCHES: etat.ESCHES || [], FLOTTEURS, SCIONS,
    equiperEsche: (...args) => etat.equiperEsche(...args), escheEquipee: () => etat.escheEquipee(),
    flotteurEquipe: () => etat.flotteurChoix, scionEquipe: () => etat.scionChoix,
    bouchonPossede, setFlotteur: setFloatType, acheterBouchon, scionPossede, setScion, acheterScion,
    techniqueActuelle: () => etat.techniqueCourante, getExperience: () => journal.experience,
    renderBoutique, ensureSound, sound, statusDisplay, globale: window
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
    FOND_CENTRE, FOSSES, PROFONDEUR_MAX, RAYON_CADRE_CARTE, lilyPads, BOURRICHE_POS, angler, floatGroup,
    SPECIES, profondeurLocale, substrats
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

// Declare AVANT setDifficulty : cette fonction est appelee a l'initialisation du
// module et ecrit BITE_WINDOW (sinon : « Cannot access before initialization »).
let BITE_WINDOW = 0.7;

function setDifficulty(mode) {
    const preset = DIFFICULTY_MODES[mode] || DIFFICULTY_MODES.normal;
    DIFFICULTY = preset.difficulty;
    etat.facteurDensite = preset.poissons || 2;
    etat.facteurXp = preset.xp || 1;   // plus difficile = plus d'XP par poisson
    BITE_WINDOW = preset.biteWindow;
    tangleChance = preset.tangleChance;
    // MODE FACILE (enfant) : aimant à poissons, touche rapide, gros « FERRER ! ».
    // Les modules lisent `etat.modeFacile` ; le CSS reçoit aussi la classe.
    etat.modeFacile = (mode === 'facile'); etat.modeDifficulte = DIFFICULTY_MODES[mode] ? mode : 'normal';   // + esches.js
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.toggle('mode-facile', etat.modeFacile);
    }
    // Le choix de l'accueil et celui du carnet restent synchronisés.
    majChoixRadio(accueilDifficulteRadios, mode);
    if (difficultySelect && difficultySelect.value !== mode) {
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
    statusDisplay, casserLigne: (...args) => casserLigne(...args), startCast: (...args) => startCast(...args), floatGroup, angleNormalise, rodLocalTip,
    CAST_YAW_ANGLER_MAX, CAST_YAW_ROD_MAX, rodPivot, CAST_SWING_CHARGE, CAST_SWING_RELEASE
});

let dragLoosened = false;
let TUTORIAL_STEPS = [
    { main: '👆', texte: 'Maintiens sur l’eau pour doser le lancer. Relâche, puis appuie sur « Tendre le fil » pendant qu’il vole : cela évite qu’il s’emmêle. En mode Facile, tu peux simplement laisser le fil se poser.' },
    { main: '✊', texte: 'Quand le bouchon mordille puis s’enfonce, clique vite pour ferrer le poisson : un seul essai !' },
    { main: '🔄', texte: 'Tourne la manivelle en cercle pour le ramener. Si la ligne est trop tendue, maintiens le clic droit (ou « Lâcher du fil » sur tablette).' },
    { main: '🐟', texte: 'Garde le poisson en main et lance-le dans la bourriche 🧺 (comme l’amorce) pour le ranger dans ton carnet.' }
];
let tutorialStepIndex = 0;
const {
    setDragLoosened, openTutorial, closeTutorial, nextTutorialStep
} = creerFrein({
    dragButton, strugglePanel, ensureSound, sound, tutorialText, tutorialHand,
    tutorialStepDisplay, tutorialNext, tutorial, accueil, demarrerJeu: (...args) => demarrerJeu(...args), tutorialClose,
    tutorialOpen, hideJournal, journalButton, journalPanel, showJournal, journalClose,
    difficultySelect, setDifficulty, scionSelect, setScion, renderBoutique, floatSelect,
    setFloatType, effectsToggle, post, reflectionsToggle, reflections, waterReflectionTarget,
    setReflections, bigTextToggle, calmToggle, loadJournal, journal, appliquerTechniqueVisuelle,
    renderJournal
});

let weatherPluie;
let weatherRafales;
let rainPoints;
const {
    weatherName, setWeather, updateWeather
} = creerMeteo({
    POND_CENTER, scene, sunLight, ambientLight, skyLight, skyMat, sound
});
const physique = creerPhysique({ weatherName, setWeather, hud: document.getElementById('heureEau'), hudEau: document.getElementById('depthEau'), dureeJour: DAY_LENGTH });

let birds;
let libellules;
let sauteur;
let bubbles;
const {
    updateAmbiante, spawnBubbles, updateBubbles
} = creerVie({
    scene, POND_CENTER, sound
});

// ---------------------------------------------------------------------------
// Poissons : population, fabrique 3D, bancs et spécimens — module dédié.
// Créé ICI : il peuple l’étang à la construction (mêmes tirages qu’avant).
// ---------------------------------------------------------------------------
const { fishes, styleEspece, makeFish, spawnFish, randomFishPosition,
    poidsRealisteKilos, setHorsNormeChance, getHorsNormeChance,
    distributionAttendue, comportementRand, repeuplerEtang, punishFish, statsPopulation,
    SOLITAIRES, MAX_PAR_SOLITAIRE, BIOMASSE_MIN_KG_HA,
    BIOMASSE_MAX_KG_HA, ESPECES_MIN,
    PROIES_CARNASSIERS, CARNASSIERS, PREDATOR_ATTACK_RADIUS,
    PREDATOR_ATTACK_ADVANTAGE } = creerPoissons({
    scene: scene,
    rand: rand,
    rayonEtang: rayonEtang,
    POND_CENTER: POND_CENTER,
    fondY: fondY,
    FOSSES: FOSSES,
    SURFACE_HA: SURFACE_HA,
    obstacles: obstacles,
    substrats: substrats
});

// ---------------------------------------------------------------------------
// État du jeu
// ---------------------------------------------------------------------------
let score = 0;
let fishCaught = false;
let castT = 0;
let waitTimer = 0;
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
setDifficulty(difficultySelect.value);   // applique le mode choisi (et etat.modeFacile)
// Le poisson mordille le bouchon avant de l'enfoncer : le joueur est prévenu.
const BITE_NIBBLE_DURATION = 0.6;
// Durée pendant laquelle on laisse « Trop tard ! » affiché après une touche
// ratée. Comptée par la boucle de jeu (et plus courte que le temps de
// récupération) pour ne jamais refermer une NOUVELLE touche par erreur.
const BITE_VIEW_LINGER = 0.7;
// ---------------------------------------------------------------------------
let VITESSE_TOUCHES;
const {
    dureeTouche, mouvementDeTouche, appliquerMouvement, choisirTouche
} = creerTouches({
    modeQuiver, wind, biteOrigine, TOUCHES_PAR_ID, rand, TOUCHES
});

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
const MAX_WAIT = 20;        // attente de référence (un poisson qui renifle l'esche la prolonge)

// Morsure : le poisson doit venir renifler l'hameçon — donc s'approcher visiblement
// du bouchon ET remonter jusqu'à lui depuis sa profondeur. La morsure se décide
// sur la distance RÉELLE en 3D à l'hameçon, pas seulement à l'aplomb du bouchon.
const BITE_RADIUS = 0.9;           // distance 3D en dessous de laquelle il mord
const BITE_APPROACH_ACCEL = 4.5;   // vitesse d'approche maximale (unités/s)

let raycaster;
let pointerNdc;
const {
    waterPointFromEvent, startCast, tendreLigneAuLancer, demarrerEmmElement,
    updateCrankVisibility, startReel, findBitingFish, endCast
} = creerCycleLigne({
    canvas, camera, water, totalLignes, castStart, rodTipVisual, castTarget, wind, POND_CENTER,
    rayonEtang, updateToolDock, risqueEmmelement, fishButton, statusDisplay, sound,
    fermerPanneauCombat, setDragLoosened, crank, feedButton, BITE_RADIUS, fishes,
    scoreDisplay, fmtPoids, obstacles
});

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
    mouvementDeTouche, BITE_VIEW_LINGER, majIndiceSnag: (...args) => majIndiceSnag(...args), fermerPanneauCombat, consumeCrankTurns,
    vitesseMaxTours: (...args) => vitesseMaxTours(...args), kidCue
});

const {
    isSnagged, startSnag, majIndiceSnag, updateSnag
} = creerAccrochage({
    lilyPads, obstacles, strugglePanel, sound, struggleInfo, strugglePortrait, struggleTimer, struggleHint,
    updateStruggleBar, fishButton, statusDisplay, fermerPanneauCombat, debiterLigne,
    perdreLeBouchon, totalLignes, terminerPartie: (...args) => terminerPartie(...args), snagPret, appliquerClicUtile, rand
});

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

const {
    updateWind, updateClouds, animateFishMesh
} = creerAmbiance({
    wind, rand, vaneArrow, windFill, windArrow, sound, clouds
});

const {
    hameconDansZone, updateFish, updateFloat, updateLine
} = creerComportement({
    floatGroup, fondY, comportementRand, POND_CENTER, rayonEtang, fishes,
    animateFishMesh, camera, spawnBubbles, CHUM_ATTRACT_ACCEL, BITE_APPROACH_ACCEL, ripples,
    spawnRipple, CAST_DURATION, fishButton, castTarget, sound, isSnagged, startSnag,
    risqueEmmelement, rand, demarrerEmmElement, modeQuiver, poserHameconAuFond, verdictFond,
    accrochageDe: substrats.accrochageDe, majCoupeProfondeur, statusDisplay, castStart, wind, waterWaveHeightAt, nibbleRand, MAX_WAIT,
    consumeCrankTurns, startReel, findBitingFish, showBiteView, floatIdle,
    tenterAttaquePredateur, REEL_PER_TURN, angler, startHoldingFish,
    endCast, updateCrankVisibility, rodTipVisual, LINE_SEGMENTS, linePositions, lineGeometry
});

// Esches (§15.2) : l'esche équipée décide si le poisson arrivé sur l'hameçon mord (stocks : stocks.js).
creerEsches({ verdictFond, modeQuiver, statusDisplay, saveJournal: (...args) => saveJournal(...args), etiquette: document.getElementById('depthEsche') });

creerEntrees({
    canvas, waterPointFromEvent, moveCastAim, moveFeedAim, cameraTouches, updateCameraGesture,
    toolDock, fermerOutils, ensureSound, tendreLigneAuLancer, clicSurRagondin: (...args) => clicSurRagondin(...args), hitRagondin: (...args) => hitRagondin(...args),
    statusDisplay, startFishThrow, startFeedCharge, hookFish, reelClick, startCastCharge,
    releaseCast, releaseFishThrow, releaseFeed, cancelCast, cancelFeed, setFeedMode, feedButton,
    quickFeedButton, setProfondeur, depthMinus, depthPlus, majEtiquetteProfondeur,
    majCoupeProfondeur, waterUniforms, fishButton
});

// Cheat « radar » (§17.3) : carte 2D des poissons, pilotée par le mot secret de cheat.js.
const radar = creerRadar({
    fishes, angler, floatGroup, substrats, POND_CENTER, rayonEtang, RAYON_CADRE_CARTE, SPECIES, COMPORTEMENTS,
    panneau: document.getElementById('radarPanel'),
    fondEl: document.getElementById('radarFond'),
    vivantEl: document.getElementById('radarVivant')
});

const {
    cheatTouche
} = creerCheat({
    radar, saveJournal, renderJournal, statusDisplay, catchMessage, setCameraView, toolToggle,
    fermerOutils, toolDock, deplacerBateau, ensureSound, tendreLigneAuLancer, releaseCast,
    releaseFishThrow, startFishThrow, hookFish, reelClick, camera, water, startCastCharge
});

let clock;
let elapsed;
let paused;
let ragondin;
let ragondinTimer;
let ragondinHits;
let ragondinVolTimer;
let ragondinAuto;
const {
    spawnRagondin, volerUnPoissonRagondin, effrayerRagondin, hitRagondin, ragondinALEcran,
    clicSurRagondin, updateRagondin
} = creerBoucle({
    rand, BOURRICHE_POS, scene, ensureSound, sound, ragondinAlert, spawnFloatingText,
    statusDisplay, scoreDisplay, bourricheLabel, canvas, camera
});

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
        physique.majPhysique(dt);
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
        radar.maj(dt);
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
let VITESSE_MANIVELLE_MAX;
let avertissementsVitesse;
let partieTerminee;
let partieStats;
const {
    majLignes, casserLigne, vitesseMaxTours, risqueCasseVitesse, avertirVitesse,
    chargerClassement, enregistrerClassement, renderClassement, ouvrirClassement, terminerPartie,
    revenirAccueil, recommencerPartie, demarrerJeu, afficherAccueil
} = creerPartie({
    lignesLabel, totalLignes, fishButton, debiterLigne, sound, spawnFloatingText, statusDisplay,
    floatIdle, filEquipe, rand, creerClassement, fmtPoids, rankingList, rankingTabs, classement,
    fermerOutils, rangerSonar, setCameraView, hideBiteView, setDragLoosened, feedGauge,
    cancelFeed, crank, feedButton, gameOver, gameOverTitle, gameOverText, gameOverScore,
    playerName, modalBackdrop, accueil, cancelCast, randomFishPosition, fishes,
    fermerPanneauCombat, setFloatOpacity, setCastPower, castTarget, rodGroup, rodTipVisual,
    rodTip, angler, rodPivot, setFeedMode, floatingTexts, scene, missRings, ripples,
    effrayerRagondin, ragondinAlert, scoreDisplay, resetCameraView, pauseButton, renderJournal,
    majCoupeProfondeur, updateToolDock, updateCrankVisibility, updateLine, stockAmorce,
    saveScore, showRanking, rankingButton, closeRanking, restartGame, saveAndMenu, backToMenu,
    endGameButton, ensureSound, playButton, accueilClassement,
    accueilTechniqueRadios, setTechnique, accueilDifficulteRadios, setDifficulty
});

window.__game = {
    ...physique.crochets,
    scene: scene,
    camera: camera,
    renderer: renderer,
    fishes: fishes,
    floatGroup: floatGroup,
    rodTip: rodTip,
    angler: angler,
    makeFish: makeFish,
    lilyPads: lilyPads,
    obstacles: obstacles,
    substrats: substrats,
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
    // Graine du monde : lisible et pilotable (tests : monde reproductible).
    getGraine: function () { return rngState; },
    setGraine: function (graine) { rngState = Number(graine) >>> 0; return rngState; },
    // Population : cible calculée d'après la surface, plafond technique, bornes réalistes.
    getPopulation: function () {
        const stats = statsPopulation();
        stats.solitairesListe = SOLITAIRES.slice();
        stats.maxParSolitaire = Object.assign({}, MAX_PAR_SOLITAIRE);
        stats.biomasseMin = BIOMASSE_MIN_KG_HA;
        stats.biomasseMax = BIOMASSE_MAX_KG_HA;
        stats.especesMin = ESPECES_MIN;
        return stats;
    },
    getEtangInfo: function () {
        return { fosses: FOSSES, surfaceHa: SURFACE_HA, profondeurMax: PROFONDEUR_MAX,
            rayonCadre: RAYON_CADRE_CARTE, pasBateau: { angle: BATEAU_PAS_ANGLE, marge: BATEAU_PAS_MARGE } };
    },
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
            // Position RELATIVE au centre des ombres (la direction de la lumière).
            position: { x: sunDecalage.x, y: sunDecalage.y, z: sunDecalage.z },
            intensite: sunLight.intensity,
            exposition: expositionPoste(),
            lumiereEau: waterUniforms.uLight.value,
            ambiance: ambientLight.intensity
        };
    },
    getExpositionPoste: function (index) { return expositionPoste(index); },
    couleurEau: couleurEau,
    getFondDoubleFace: function () { return pondBottom.material.side === THREE.DoubleSide; },
    // Cheat « aquarium » : l'eau est-elle transparente ? — pour les tests.
    getEauTransparente: function () { return waterUniforms.uClear.value > 0.5; },
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
    radar: radar,
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
            obstacle: snag.obstacle || null,
            message: snag.message || '',
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
        return PROFONDEUR_MAX;
    },
    fondY: fondY,
    isHameconDansLaVase: function () { return hameconDansLaVase; },
    // Fond sous le bouchon (§14.8) : verdict en direct, point visé, vent imposé, état partagé.
    getVerdictFond: function () {
        return verdictFond(floatGroup.position.x, floatGroup.position.z, profondeurLigne, modeQuiver.estActif());
    },
    castTarget: castTarget,
    setWind: function (dir, force) {
        Object.assign(wind, { dir: dir, targetDir: dir, strength: force, targetStrength: force, timer: 1e9 });
    },
    etat: etat,
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
    getDifficulty: function () { return { difficulty: DIFFICULTY, biteWindow: BITE_WINDOW, modeFacile: !!etat.modeFacile }; },
    isJournalOpen: function () { return journalPanel.classList.contains('open'); },
    showJournal: showJournal,
    hideJournal: hideJournal,
    // Menus de la barre du haut (v192) — exposé pour les tests.
    isMenuOuvert: function (nom) { return menus.estOuvert(nom); },
    getMenuHtml: function (nom) {
        const element = document.getElementById(nom === 'esche' ? 'escheTopMenu' : 'materielTopMenu');
        return element ? element.innerHTML : '';
    },
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
        physique.majPhysique(dt);
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
        radar.maj(dt);
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

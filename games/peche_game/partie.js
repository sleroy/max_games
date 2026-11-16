// ---------------------------------------------------------------------------
// partie.js — PARTIE : lignes (vies), remontée trop rapide, classement, fin de partie, accueil. Extrait de script.js (v170).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=213';

export function creerPartie(deps) {
    const {
        lignesLabel, totalLignes, fishButton, debiterLigne, sound, spawnFloatingText,
        statusDisplay, floatIdle, filEquipe, rand, creerClassement, fmtPoids, rankingList,
        rankingTabs, classement, fermerOutils, rangerSonar, setCameraView, hideBiteView,
        setDragLoosened, feedGauge, cancelFeed, crank, feedButton, gameOver, gameOverTitle,
        gameOverText, gameOverScore, playerName, modalBackdrop, accueil, cancelCast,
        randomFishPosition, fishes, fermerPanneauCombat, setFloatOpacity, setCastPower,
        castTarget, rodGroup, rodTipVisual, rodTip, angler, rodPivot, setFeedMode, floatingTexts,
        scene, missRings, ripples, effrayerRagondin, ragondinAlert, scoreDisplay,
        resetCameraView, pauseButton, renderJournal, majCoupeProfondeur, updateToolDock,
        updateCrankVisibility, updateLine, stockAmorce, saveScore, showRanking, rankingButton,
        closeRanking, restartGame, saveAndMenu, backToMenu, endGameButton, ensureSound,
        playButton, accueilClassement, accueilTechniqueRadios, setTechnique,
        accueilDifficulteRadios, setDifficulty
    } = deps;

    // LIGNES (VIES) : on part avec 5 lignes. Un lancer trop fort ou une remontée
    // trop rapide en coûte une. À zéro : fin de partie, nom du pêcheur et
    // classement local (3 onglets : poissons, poids total, records par espèce).
    // ---------------------------------------------------------------------------
    etat.VITESSE_MANIVELLE_MAX = 4.0;     // base : tours/s EN MOYENNE sur 0,6 s
    const RANKING_KEY = 'peche_max_games_classement';
    const NOM_KEY = 'peche_max_games_nom';
    etat.avertissementsVitesse = 0;
    etat.partieTerminee = false;
    let derniereAlerteVitesse = -10000;
    let ongletClassement = 'poissons';
    etat.partieStats = { poissons: 0, poids: 0, records: {} };

    function majLignes() {
        if (!lignesLabel) { return; }
        const total = totalLignes();
        const reserves = total - etat.lignesRestantes;
        lignesLabel.textContent = '🧵 Lignes : ' + total + (reserves ? '' : '/' + etat.MAX_LIGNES);
        lignesLabel.classList.toggle('danger', total <= 1);
    }

    function casserLigne(raison) {
        if (etat.partieTerminee) { return; }
        fishButton.hidden = true;
        if (etat.jeuDemelage && etat.jeuDemelage.estActif()) { etat.jeuDemelage.fermer(); }
        debiterLigne();
        etat.avertissementsVitesse = 0;
        sound.lineBreak();
        spawnFloatingText('💥 Ligne cassée !', etat.floatGroup.position, '#ff6b57');
        statusDisplay.textContent = '💥 ' + raison + ' : une ligne est perdue ('
            + totalLignes() + ' restante' + (totalLignes() > 1 ? 's' : '') + ').';
        etat.floatState = 'idle';
        etat.hameconDansLaVase = false;
        fishButton.disabled = false;
        if (etat.hookedFish) {
            etat.hookedFish.userData.hooked = false;
            etat.hookedFish.visible = false;
            etat.hookedFish = null;
        }
        etat.floatGroup.position.copy(floatIdle);
        etat.floatGroup.rotation.z = 0;
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
        if (!etat.hookedFish) { return Infinity; }
        const poids = Math.max(0.05, etat.hookedFish.userData.weight || 0);
        // 0,1 kg ≈ 6,1 · 0,8 kg ≈ 5,4 · 2,8 kg ≈ 4,5 · 6 kg ≈ 3,6 · ≥ 20 kg = 2,5
        const seuil = Math.max(2.5, etat.VITESSE_MANIVELLE_MAX + 2.5 - 1.2 * Math.sqrt(poids));
        return seuil * filEquipe().resistance;
    }

    // Chance qu'un avertissement casse vraiment la ligne : elle grandit avec le
    // poids du poisson (un goujon ne fait pas casser un fil, une carpe oui).
    function risqueCasseVitesse() {
        if (!etat.hookedFish) { return 0; }
        const poids = Math.max(0.05, etat.hookedFish.userData.weight || 0);
        const facteur = Math.min(1.6, 0.4 + 0.4 * Math.sqrt(poids));
        return Math.min(0.15, 0.015 * etat.avertissementsVitesse * facteur);
    }

    // Remontée trop rapide : un avertissement (toutes les 1,5 s au plus), puis le
    // risque de casse augmente à chaque avertissement.
    function avertirVitesse() {
        if (etat.partieTerminee) { return; }
        const maintenant = performance.now();
        if (maintenant - derniereAlerteVitesse < 1500) { return; }  // 1 alerte / 1,5 s
        derniereAlerteVitesse = maintenant;
        etat.avertissementsVitesse += 1;
        // POPUP 3D près du bouchon, comme « FERRÉ ! » ou « Trop tôt ! » : le joueur
        // voit l'avertissement sans quitter l'eau des yeux.
        spawnFloatingText('⚠️ Trop vite !', etat.floatGroup.position, '#ffb347');
        if (etat.avertissementsVitesse <= 3) {
            statusDisplay.textContent = '⚠️ Tu remontes trop vite ! La ligne souffre ('
                + etat.avertissementsVitesse + ' avertissement' + (etat.avertissementsVitesse > 1 ? 's' : '') + ').';
        }
        if (rand() < risqueCasseVitesse()) {
            casserLigne('Tu as remonté trop vite');
        }
    }

    // Classement local délégué au module classement.js.
    const classementApi = creerClassement({
        store: etat.journalStore,
        rankingKey: RANKING_KEY,
        nomKey: NOM_KEY,
        getPartieStats: function () { return etat.partieStats; },
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
        if (etat.partieTerminee) { return; }
        rangerSonar();
        setCameraView(false);
        if (etat.jeuDemelage && etat.jeuDemelage.estActif()) { etat.jeuDemelage.fermer(); }
        const manuelle = raison === 'manuelle';
        etat.partieTerminee = true;
        // On coupe proprement une ligne en cours : aucun poisson ne doit rester
        // accroché derrière le panneau de fin de partie.
        if (etat.hookedFish) {
            etat.hookedFish.userData.hooked = false;
            etat.hookedFish.visible = false;
            etat.hookedFish = null;
        }
        if (etat.biteFish) {
            etat.biteFish.userData.biting = false;
            etat.biteFish.visible = false;
            etat.biteFish = null;
        }
        etat.biteViewActive = false;
        hideBiteView();
        etat.struggle = null;
        etat.struggleTimeLeft = 0;
        etat.snag = null;
        setDragLoosened(false);
        etat.castState = 'idle';
        feedGauge.classList.remove('active');
        if (etat.feedState === 'charging') { cancelFeed(); }
        etat.floatState = 'idle';
        etat.floatGroup.visible = true;
        etat.floatGroup.position.copy(floatIdle);
        etat.floatGroup.rotation.z = 0;
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
            gameOverScore.innerHTML = '🐟 <b>' + etat.partieStats.poissons + '</b> poisson(s) · ⚖️ <b>'
                + fmtPoids(etat.partieStats.poids) + '</b> au total · 🏆 <b>'
                + Object.keys(etat.partieStats.records).length + '</b> espèce(s)';
        }
        if (playerName) {
            let dernierNom = '';
            try { if (etat.journalStore) { dernierNom = etat.journalStore.getItem(NOM_KEY) || ''; } } catch (e) { /* plein */ }
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
        if (etat.jeuDemelage && etat.jeuDemelage.estActif()) { etat.jeuDemelage.fermer(); }
        etat.ligneTendue = false;
        if (etat.castState === 'charging') { cancelCast(); }
        if (etat.feedState === 'charging') { cancelFeed(); }
        if (etat.hookedFish) { etat.hookedFish.userData.hooked = false; }
        if (etat.biteFish) { etat.biteFish.userData.biting = false; }
        // Poisson en main : on le remet à l'eau (et dans le tableau s'il en sortait).
        if (etat.heldFish) {
            const poisson = etat.heldFish;
            etat.heldFish = null;
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
        etat.hookedFish = null;
        etat.biteFish = null;
        etat.biteViewActive = false;
        hideBiteView();
        etat.struggle = null;
        etat.snag = null;
        fermerPanneauCombat();
        setDragLoosened(false);
        etat.tension = 0;
        etat.hameconDansLaVase = false;
        etat.snagFreed = false;
        etat.lineBrokenTimer = 0;
        etat.fishCaught = false;
        etat.escaped = false;
        etat.timeoutEscape = false;
        etat.caughtWeight = 0;
        etat.recordBattu = null;
        etat.waitTimer = 0;
        etat.depuisLancement = 0;
        etat.biteCooldown = 0;
        etat.biteSignauxRestants = 1;
        etat.baitInterest = false;
        etat.nibbleInteretAvant = false;
        etat.nibbleDebut = -1;
        etat.nibbleSuivant = 0;
        etat.nibblePhase = 0;

        // --- Bouchon, canne et bras au repos ---
        etat.floatState = 'idle';
        etat.floatGroup.visible = true;
        etat.floatGroup.position.copy(floatIdle);
        etat.floatGroup.rotation.z = 0;
        setFloatOpacity(1);
        etat.castState = 'idle';
        setCastPower(0);
        etat.castTargetPower = 0;
        etat.castPhase = 0;
        etat.castT = 0;
        castTarget.copy(etat.castAim);
        etat.castSwing = 0;
        etat.castSwingDepart = 0;
        etat.castYawAngler = 0;
        etat.castYawRod = 0;
        etat.rodBend = 0;
        rodGroup.rotation.x = 0;
        rodTipVisual.copy(rodTip);
        angler.rotation.y = etat.anglerYawBase;
        rodPivot.rotation.y = etat.rodYawBase;
        feedGauge.classList.remove('active');
        etat.feedState = 'idle';
        setFeedMode(false);
        etat.feedBall.visible = false;
        etat.feedPower = 0;
        etat.feedTargetPower = 0;
        etat.feedFlyT = 0;
        etat.fishThrowState = 'idle';
        etat.fishThrowPower = 0;
        etat.fishThrowTarget = 0;
        etat.fishThrowPhase = 0;
        etat.fishThrowT = 0;

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
        if (etat.chum) { scene.remove(etat.chum.group); etat.chum = null; }
        if (etat.ragondin) { effrayerRagondin(); }
        etat.ragondinHits = 0;
        etat.ragondinVolTimer = 0;
        etat.ragondinTimer = 18 + rand() * 12;
        if (ragondinAlert) { ragondinAlert.classList.remove('active'); }

        // --- Compteurs de la PARTIE (le carnet/XP persistants ne bougent pas) ---
        etat.score = 0;
        scoreDisplay.textContent = etat.score;
        etat.bourricheCount = 0;
        etat.lignesRestantes = etat.MAX_LIGNES;
        etat.amorceDepartRestante = etat.AMORCE_DEPART;
        etat.avertissementsVitesse = 0;
        derniereAlerteVitesse = -10000;
        etat.partieTerminee = false;
        etat.partieStats = { poissons: 0, poids: 0, records: {} };
        etat.experiencePartie = 0;
        etat.crankRotationDelta = 0;

        // --- Interface ---
        if (gameOver) { gameOver.classList.remove('active'); }
        if (classement) { classement.classList.remove('active'); }
        feedButton.classList.remove('active');
        crank.classList.remove('active');
        fishButton.disabled = false;
        fishButton.hidden = true;
        fishButton.classList.remove('cooldown');
        etat.paused = false;
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
        statusDisplay.textContent = 'Nouvelle partie : ' + totalLignes() + (totalLignes() > 1 ? ' lignes' : ' ligne')
            + ' et ' + stockAmorce() + ' boules d’amorce.';
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
            if (etat.partieTerminee) { return; }
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
    // Choix de l'accueil en boutons (radio), sans dropdown. Le carnet reste
    // synchronisé via setTechnique / setDifficulty.
    function ecouterChoixRadios(radios, appliquer) {
        Object.keys(radios || {}).forEach(function (valeur) {
            const radio = radios[valeur];
            if (!radio) { return; }
            radio.addEventListener('change', function () {
                if (radio.checked) { appliquer(valeur); }
            });
        });
    }
    ecouterChoixRadios(accueilTechniqueRadios, setTechnique);
    ecouterChoixRadios(accueilDifficulteRadios, setDifficulty);

    return {
        majLignes, casserLigne, vitesseMaxTours, risqueCasseVitesse, avertirVitesse,
        chargerClassement, enregistrerClassement, renderClassement, ouvrirClassement,
        terminerPartie, revenirAccueil, recommencerPartie, demarrerJeu, afficherAccueil
    };
}

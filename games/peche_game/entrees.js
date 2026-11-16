// ---------------------------------------------------------------------------
// entrees.js — ENTRÉES : pointeur, clavier et boutons de l'écran de jeu. Extrait de script.js (v167).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=207';

export function creerEntrees(deps) {
    const {
        canvas, waterPointFromEvent, moveCastAim, moveFeedAim, cameraTouches,
        updateCameraGesture, toolDock, fermerOutils, ensureSound, tendreLigneAuLancer,
        clicSurRagondin, hitRagondin, statusDisplay, startFishThrow, startFeedCharge, hookFish,
        reelClick, startCastCharge, releaseCast, releaseFishThrow, releaseFeed, cancelCast,
        cancelFeed, setFeedMode, feedButton, quickFeedButton, setProfondeur, depthMinus,
        depthPlus, majEtiquetteProfondeur, majCoupeProfondeur, waterUniforms, fishButton
    } = deps;

    // ---------------------------------------------------------------------------
    // Entrées
    // ---------------------------------------------------------------------------
    canvas.addEventListener('pointermove', event => {
        const rect = canvas.getBoundingClientRect();
        etat.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        etat.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        // Pendant la visée (amorce ou lancer), on peut ajuster le point de chute.
        if (etat.castState === 'charging') {
            const p = waterPointFromEvent(event);
            if (p) {
                moveCastAim(p);
            }
        }
        if (etat.feedState === 'charging') {
            const p = waterPointFromEvent(event);
            if (p) {
                moveFeedAim(p);
            }
        }
    });

    canvas.addEventListener('pointerdown', event => {
        if (etat.cameraViewActive) {
            if (event.pointerType === 'touch' && cameraTouches.size < 2) {
                cameraTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
                canvas.setPointerCapture?.(event.pointerId);
                updateCameraGesture();
            }
            return;
        }
        if (toolDock.classList.contains('ouvert') || etat.paused) {
            if (!etat.paused) { fermerOutils(); }
            return;
        }
        if (event.button !== 0) {
            return;
        }
        ensureSound();
        // Lancer en vol : un clic tend la ligne AVANT que le bouchon touche l'eau.
        if (etat.floatState === 'flying') {
            tendreLigneAuLancer();
            return;
        }
        // RAGONDIN : le chasser ne doit JAMAIS gêner la pêche. Il ne capte donc le
        // clic que lorsque la ligne ne fait rien (au repos) ou qu'elle est
        // simplement posée à l'eau. Pendant un ferrage, un combat, une remontée ou
        // un accrochage, le clic garde son rôle habituel.
        if (etat.ragondin && (etat.floatState === 'idle' || etat.floatState === 'inWater')) {
            if (clicSurRagondin(event)) {
                hitRagondin();
                return;
            }
            // Clic à côté pendant qu'il rôde : on ne LANCE pas la ligne par
            // accident. C'était le vrai problème : viser le ragondin et rater
            // faisait partir le bouchon.
            if (etat.floatState === 'idle') {
                statusDisplay.textContent = '🐀 Le ragondin est là : vise-le (3 clics) avant de relancer.';
                return;
            }
        }
        // Poisson en main : on dose la puissance du lancer vers la bourriche.
        if (etat.floatState === 'holding') {
            startFishThrow();
            return;
        }
        // Mode amorçage : un appui sur l'eau commence à charger la puissance.
        if (etat.feedMode && (etat.floatState === 'idle' || etat.floatState === 'inWater') && etat.castState === 'idle') {
            if (etat.feedState === 'idle') {
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
        if (etat.floatState === 'bite') {
            hookFish();
            return;
        }
        if (etat.floatState === 'struggle' || etat.floatState === 'snag') {
            reelClick();
            return;
        }
        if (etat.floatState === 'idle') {
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
        if (etat.cameraViewActive) {
            endCameraTouch(event);
            return;
        }
        if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
            canvas.releasePointerCapture(event.pointerId);
        }
        if (etat.castState === 'charging') {
            releaseCast();
            return;
        }
        if (etat.fishThrowState === 'charging') {
            releaseFishThrow();
            return;
        }
        if (etat.feedState === 'charging') {
            releaseFeed();
        }
    });

    canvas.addEventListener('pointercancel', event => {
        if (etat.cameraViewActive) {
            endCameraTouch(event);
            return;
        }
        if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
            canvas.releasePointerCapture(event.pointerId);
        }
        cancelCast();
        if (etat.fishThrowState === 'charging') {
            releaseFishThrow();
        }
        cancelFeed();
    });

    // Filet de sécurité (téléphone) : si le relâchement n'arrive pas au canvas,
    // on le rattrape au niveau de la fenêtre.
    window.addEventListener('pointerup', () => {
        if (etat.castState === 'charging') {
            releaseCast();
        }
        if (etat.fishThrowState === 'charging') {
            releaseFishThrow();
        }
        if (etat.feedState === 'charging') {
            releaseFeed();
        }
    });

    // Au doigt, l'appui long ne doit pas ouvrir le menu contextuel du navigateur.
    canvas.addEventListener('contextmenu', event => event.preventDefault());

    function toggleAmorcage() {
        ensureSound();
        setFeedMode(!(etat.feedMode && etat.feedType !== 'sonar'));   // pendant la visée du sonar : bascule sur l'amorce
        fermerOutils();
    }

    feedButton.addEventListener('click', toggleAmorcage);
    quickFeedButton.addEventListener('click', () => {
        if (etat.floatState === 'inWater' && !etat.paused && !etat.cameraViewActive && etat.feedState === 'idle') {
            toggleAmorcage();
        }
    });

    // La profondeur se règle avant le lancer.
    function clickDepth(delta) {
        if (etat.paused || etat.cameraViewActive || etat.castState !== 'idle' || etat.floatState !== 'idle') { return; }
        ensureSound();
        setProfondeur(etat.profondeurLigne + delta);
    }
    depthMinus.addEventListener('click', () => clickDepth(-0.5));
    depthPlus.addEventListener('click', () => clickDepth(0.5));
    majEtiquetteProfondeur();
    // Le jeu est initialisé : la coupe de l'eau (schéma) peut se dessiner.
    etat.coupePrete = true;
    majCoupeProfondeur();
    waterUniforms.uNormalsOn.value = waterUniforms.uNormals.value ? 1 : 0;

    fishButton.addEventListener('click', () => {
        if (etat.paused || etat.cameraViewActive || toolDock.classList.contains('ouvert')) { return; }
        ensureSound();
        if (etat.floatState === 'flying') {
            tendreLigneAuLancer();
        } else if (etat.floatState === 'snag') {
            reelClick();
        }
    });

    return {

    };
}

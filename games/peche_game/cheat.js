// ---------------------------------------------------------------------------
// cheat.js — CHEAT : mot secret « poisson » (+50 XP). Extrait de script.js (v168).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=145';

export function creerCheat(deps) {
    const {
        saveJournal, renderJournal, statusDisplay, catchMessage, setCameraView, toolToggle,
        fermerOutils, toolDock, deplacerBateau, ensureSound, tendreLigneAuLancer, releaseCast,
        releaseFishThrow, startFishThrow, hookFish, reelClick, camera, water, startCastCharge
    } = deps;

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
        etat.journal.experience += CHEAT_GAIN;
        etat.experiencePartie += CHEAT_GAIN;
        saveJournal();
        renderJournal();
        statusDisplay.textContent = '🪄 Cheat activé : +' + CHEAT_GAIN + ' XP !';
        catchMessage.textContent = '🪄 CHEAT — +' + CHEAT_GAIN + ' XP !';
        catchMessage.classList.remove('record', 'rare');
        catchMessage.classList.add('show');
        if (etat.catchMessageTimer) { clearTimeout(etat.catchMessageTimer); }
        etat.catchMessageTimer = setTimeout(function () {
            catchMessage.classList.remove('show');
        }, 2500);
        return true;
    }

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (etat.cameraViewActive) { setCameraView(false); toolToggle.focus?.(); }
            else if (!etat.paused) { fermerOutils(); }
            return;
        }
        // Cheat : taper « poisson » n'importe où (sauf dans un champ de saisie)
        // offre +50 XP. Testé AVANT les early-return, pour marcher même en pause.
        if (event.key.length === 1 && !event.target?.closest?.('input, textarea')) {
            cheatTouche(event.key);
        }
        if (etat.cameraViewActive || etat.paused || toolDock.classList.contains('ouvert')
                || event.target?.closest?.('button, input, select, textarea')) { return; }
        if (etat.modeBateau) {
            // Ramer : flèches ou ZQSD (clavier français). Gauche/droite tournent
            // autour du centre ; haut = vers le centre (marge PLUS négative),
            // bas = vers la berge.
            const touche = event.key;
            let coup = null;
            if (touche === 'ArrowUp' || touche === 'z' || touche === 'w') { coup = [0, -etat.BATEAU_PAS_MARGE]; }
            else if (touche === 'ArrowDown' || touche === 's') { coup = [0, etat.BATEAU_PAS_MARGE]; }
            else if (touche === 'ArrowLeft' || touche === 'q' || touche === 'a') { coup = [etat.BATEAU_PAS_ANGLE, 0]; }
            else if (touche === 'ArrowRight' || touche === 'd') { coup = [-etat.BATEAU_PAS_ANGLE, 0]; }
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
            if (etat.feedMode) {
                return; // en mode amorçage, on lance avec la souris sur l'eau
            }
            if (etat.floatState === 'flying') {
                tendreLigneAuLancer();
                return;
            }
            if (etat.castState === 'charging') {
                releaseCast();
                return;
            }
            if (etat.floatState === 'holding') {
                if (etat.fishThrowState === 'charging') {
                    releaseFishThrow();
                } else {
                    startFishThrow();
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
                etat.raycaster.setFromCamera(etat.pointerNdc, camera);
                const hits = etat.raycaster.intersectObject(water);
                if (hits.length) {
                    startCastCharge(hits[0].point.clone());
                }
            }
            // Espace/Entrée à l'eau : idem clic, la ligne ne se remonte plus au
            // clavier. La manivelle reste le seul moyen de ramener la ligne.
        }
    });

    return {
        cheatTouche
    };
}

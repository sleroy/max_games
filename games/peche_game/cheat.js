// ---------------------------------------------------------------------------
// cheat.js — CHEATS : mots secrets tapés au clavier (extrait de script.js, v168).
//
//   « poisson »  → +50 XP
//   « aquarium » → bascule l'eau transparente (on voit les poissons)
//   « radar »    → bascule la carte 2D des poissons (radar.js ; Échap la ferme)
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=214';

export function creerCheat(deps) {
    const {
        radar, saveJournal, renderJournal, statusDisplay, catchMessage, setCameraView, toolToggle,
        fermerOutils, toolDock, deplacerBateau, ensureSound, tendreLigneAuLancer, releaseCast,
        releaseFishThrow, startFishThrow, hookFish, reelClick, camera, water, startCastCharge
    } = deps;

    // ---------------------------------------------------------------------------
    // Cheats : mots secrets
    // ---------------------------------------------------------------------------
    // Taper un mot secret (n'importe où, hors champ de saisie) déclenche son
    // effet. Les lettres s'accumulent dans un petit tampon : pas besoin d'un
    // seul coup, mais une fausse lettre remet le compteur à zéro.

    const CHEAT_GAIN = 50;

    // Message éclair (2,5 s) dans le bandeau de prise : retour visible d'un cheat.
    function annoncerCheat(texteBarre, textePrise) {
        statusDisplay.textContent = texteBarre;
        catchMessage.textContent = textePrise;
        catchMessage.classList.remove('record', 'rare');
        catchMessage.classList.add('show');
        if (etat.catchMessageTimer) { clearTimeout(etat.catchMessageTimer); }
        etat.catchMessageTimer = setTimeout(function () {
            catchMessage.classList.remove('show');
        }, 2500);
    }

    // Cheat « poisson » : +50 XP, crédités au carnet et à la partie.
    function cheatExperience() {
        etat.journal.experience += CHEAT_GAIN;
        etat.experiencePartie += CHEAT_GAIN;
        saveJournal();
        renderJournal();
        annoncerCheat('🪄 Cheat activé : +' + CHEAT_GAIN + ' XP !',
            '🪄 CHEAT — +' + CHEAT_GAIN + ' XP !');
    }

    // Cheat « aquarium » : l'eau devient presque transparente (uniforme uClear
    // du shader, voir script.js) ; retaper le mot remet l'eau normale.
    let eauTransparente = false;
    function cheatAquarium() {
        eauTransparente = !eauTransparente;
        const uniforms = water && water.material ? water.material.uniforms : null;
        if (uniforms && uniforms.uClear) { uniforms.uClear.value = eauTransparente ? 1 : 0; }
        if (eauTransparente) {
            annoncerCheat('🪄 Cheat « aquarium » : eau transparente !',
                '🪄 CHEAT — eau transparente !');
        } else {
            annoncerCheat('💧 Cheat « aquarium » désactivé : eau normale.',
                '💧 Eau normale.');
        }
    }

    // Les poissons sont CACHÉS sous l'eau par défaut (comportement.js : « seules
    // leurs bulles les trahissent »). Pendant le cheat, on les rend tous visibles
    // juste avant le rendu : c'est le seul moment où la mise à jour du jeu ne
    // réécrit plus le drapeau `visible` de la même image.
    const scene = water && water.parent ? water.parent : null;
    if (scene) {
        const avantRendu = scene.onBeforeRender;
        scene.onBeforeRender = function () {
            if (typeof avantRendu === 'function') { avantRendu.apply(this, arguments); }
            if (!eauTransparente) { return; }
            scene.children.forEach(function (objet) {
                if (objet.userData && objet.userData.especeId) { objet.visible = true; }
            });
        };
    }

    const CHEATS = [
        { mot: 'poisson', action: cheatExperience },
        { mot: 'aquarium', action: cheatAquarium },
        { mot: 'radar', action: function () { radar.basculer(); } }
    ];
    const CHEAT_LONGUEUR = CHEATS.reduce(function (max, cheat) {
        return Math.max(max, cheat.mot.length);
    }, 1);
    let cheatTampon = '';

    function cheatTouche(touche) {
        if (typeof touche !== 'string' || touche.length !== 1) { return false; }
        cheatTampon = (cheatTampon + touche.toLowerCase()).slice(-CHEAT_LONGUEUR);
        for (let i = 0; i < CHEATS.length; i += 1) {
            if (!cheatTampon.endsWith(CHEATS[i].mot)) { continue; }
            cheatTampon = '';
            CHEATS[i].action();
            return true;
        }
        return false;
    }

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (radar.estActif()) { radar.fermer(); return; }   // le radar se ferme en premier
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

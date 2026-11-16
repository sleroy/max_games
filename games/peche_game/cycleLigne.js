// ---------------------------------------------------------------------------
// cycleLigne.js — CYCLE DE LA LIGNE : visée sur l'eau, lancer, remontée, touche détectée, fin du lancer. Extrait de script.js (v164).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=222';

export function creerCycleLigne(deps) {
    const {
        canvas, camera, water, totalLignes, castStart, rodTipVisual, castTarget, wind,
        POND_CENTER, rayonEtang, updateToolDock, risqueEmmelement, fishButton, statusDisplay,
        sound, fermerPanneauCombat, setDragLoosened, crank, feedButton, BITE_RADIUS,
        fishes, scoreDisplay, fmtPoids, obstacles
    } = deps;

    etat.raycaster = new THREE.Raycaster();
    etat.pointerNdc = new THREE.Vector2(0, 0);

    function waterPointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        etat.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        etat.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        etat.raycaster.setFromCamera(etat.pointerNdc, camera);
        const hits = etat.raycaster.intersectObject(water);
        return hits.length ? hits[0].point.clone() : null;
    }

    function startCast(target) {
        if (etat.partieTerminee || totalLignes() === 0) { return; }
        if (etat.floatState !== 'idle') {
            return;
        }
        castStart.copy(rodTipVisual);
        etat.castSwingDepart = etat.castSwing;
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
        // Le lancer retombe SUR un ouvrage (ponton, écluse, roches) : refusé, la ligne reste au repos.
        const bloque = obstacles.lancerBloque(castTarget);
        if (bloque) {
            statusDisplay.textContent = 'Le lancer retombe sur ' + bloque.nom + ' ! Vise l’eau libre.';
            etat.spawnFloatingText('Lancer bloqué !', castTarget, '#ffb347');
            return;
        }
        etat.castT = 0;
        etat.numeroLancer++;   // une nouvelle présentation de l'esche : chaque poisson décide à nouveau (esches.js)
        etat.fishCaught = false;
        etat.ligneTendue = false;
        // Un nouveau lancer = une nouvelle chance : le poisson peut prendre
        // l'esche « à la volée » dès que le bouchon touche l'eau.
        etat.biteCooldown = 0;
        etat.floatState = 'flying';
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
        if (etat.floatState !== 'flying' || etat.ligneTendue || risqueEmmelement() === 0) {
            return false;
        }
        etat.ligneTendue = true;
        etat.spawnFloatingText('Ligne tendue !', castTarget, '#7ed957');
        fishButton.disabled = true;
        fishButton.textContent = '✓ Fil tendu';
        statusDisplay.textContent = 'Ligne tendue ! Le lancer est sécurisé.';
        sound.reel();
        return true;
    }

    // Démarre le mini-jeu de démêlage (appelé quand le lancer n'a pas été tendu).
    function demarrerEmmElement() {
        if (etat.partieTerminee) { return; }
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
        if (etat.struggle) {
            etat.struggle = null;
            etat.struggleTimeLeft = 0;
            fermerPanneauCombat();
            setDragLoosened(false);
        }
        if (etat.snag) { etat.snag = null; }
        etat.biteViewActive = false;
        etat.hideBiteView();
        etat.floatState = 'tangle';
        etat.floatGroup.position.copy(castTarget);
        etat.floatGroup.visible = true;
        etat.floatGroup.rotation.z = 0;
        crank.classList.remove('active');
        feedButton.classList.remove('active');
        fishButton.disabled = true;
        if (etat.jeuDemelage) { etat.jeuDemelage.ouvrir(); }
        etat.spawnFloatingText('🧶 Ligne emmêlée !', etat.floatGroup.position, '#ffb347');
        sound.escape();
        statusDisplay.textContent = '🧶 Ligne emmêlée ! Suis le fil du départ à l’arrivée.';
    }

    // Étapes où la manivelle est utile : dès que la ligne est à l'eau (pour ramener
    // la ligne et relancer où l'on veut), pendant le combat et pendant la remontée.
    const CRANK_STATES = ['inWater', 'reeling', 'struggle'];

    function updateCrankVisibility() {
        crank.classList.toggle('active', CRANK_STATES.indexOf(etat.floatState) >= 0);
    }

    function startReel() {
        if (etat.floatState === 'inWater') {
            etat.floatState = 'reeling';
            etat.hameconDansLaVase = false;
            const support = etat.techniqueCourante === 'quiver'
                ? 'la ligne est toujours à l’eau'
                : 'le bouchon est toujours à l’eau';
            statusDisplay.textContent = 'On remonte la ligne… (' + support
                + ' : un poisson peut encore mordre — arrête la manivelle pour pêcher ici !)';
        }
    }

    // Un poisson mord quand il est réellement arrivé sur l'hameçon (distance 3D) :
    // il a donc dû s'approcher du bouchon ET remonter vers la surface (voir updateFish).
    function findBitingFish() {
        if (etat.fishCaught) {
            return null;
        }
        // Les poissons arrivés sur l'hameçon, du plus proche au plus éloigné.
        const candidats = [];
        for (let i = 0; i < fishes.length; i++) {
            const fish = fishes[i];
            const data = fish.userData;
            if (data.hooked || data.biting) {
                continue;
            }
            // Seuls les poissons dont la tranche d'eau contient l'hameçon peuvent mordre.
            // MODE FACILE : on ignore la tranche — les poissons sont venus exprès sur
            // l'hameçon, quelle que soit leur espèce (pêche ludique pour enfants).
            const zone = data.profondeurZone;
            if (!etat.modeFacile && !etat.hameconDansZone(data, zone)) {
                continue;
            }
            const dx = fish.position.x - etat.floatGroup.position.x;
            const dy = (fish.position.y + data.topOffset) - etat.HOOK_DEPTH;
            const dz = fish.position.z - etat.floatGroup.position.z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < BITE_RADIUS * BITE_RADIUS) {
                candidats.push({ fish: fish, d2: d2 });
            }
        }
        candidats.sort(function (a, b) { return a.d2 - b.d2; });
        // L'esche décide (esches.js) : un poisson qui la refuse laisse la place au suivant.
        for (let i = 0; i < candidats.length; i++) {
            if (etat.accepterTouche(candidats[i].fish)) { return candidats[i].fish; }
        }
        return null;
    }

    function endCast() {
        if (etat.fishCaught) {
            etat.score++;
            scoreDisplay.textContent = etat.score;
            etat.showCatchMessage(etat.caughtWeight);
            sound.catchFish();
            statusDisplay.textContent = 'Poisson attrapé ! ' + fmtPoids(etat.caughtWeight) + ' (+1) 🎣';
            etat.fishCaught = false;
        } else if (etat.snagFreed) {
            statusDisplay.textContent = 'Ligne dégagée ! Tu peux relancer.';
            etat.snagFreed = false;
        } else if (etat.escaped) {
            sound.escape();
            statusDisplay.textContent = etat.timeoutEscape ? 'Temps écoulé ! Le poisson s’est décroché.' : 'Le poisson s’est détaché ! Réessaie.';
            etat.escaped = false;
            etat.timeoutEscape = false;
        } else {
            statusDisplay.textContent = 'Rien cette fois… clique sur l’eau pour relancer.';
        }
    }

    return {
        waterPointFromEvent, startCast, tendreLigneAuLancer, demarrerEmmElement,
        updateCrankVisibility, startReel, findBitingFish, endCast
    };
}

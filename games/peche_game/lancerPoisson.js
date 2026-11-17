// ---------------------------------------------------------------------------
// lancerPoisson.js — LANCER DU POISSON dans la bourriche : prise en main, lancer, arc de vol. Extrait de script.js (v148).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=255';

export function creerLancerPoisson(deps) {
    const {
        BOURRICHE_POS, angler, FISH_THROW_MIN, FISH_THROW_MAX, sound, floatGroup, floatIdle,
        fishButton, statusDisplay, feedGaugeFill, feedGauge, feedGaugeTarget, ensureSound,
        fishThrowLanding, wind, FISH_THROW_WIND, fishThrowOrigin, scene, scoreDisplay,
        addJournalEntry, gagnerExperience, fmtPoids, FISH_THROW_OSC, FISH_THROW_DURATION,
        BOURRICHE_RADIUS
    } = deps;

    // ---------------------------------------------------------------------------
    // Lancer du poisson dans la bourriche
    // ---------------------------------------------------------------------------
    function bourricheDistance() {
        return Math.hypot(BOURRICHE_POS.x - angler.position.x, BOURRICHE_POS.z - angler.position.z);
    }

    function fishThrowPowerFor(distance) {
        return Math.max(0, Math.min(1,
            (distance - FISH_THROW_MIN) / (FISH_THROW_MAX - FISH_THROW_MIN)));
    }

    // Le poisson est amené au bord : on le garde en main et on invite à le lancer.
    function startHoldingFish(fish) {
        sound.playEpuisette();
        etat.heldFish = fish;
        etat.hookedFish = null;
        fish.userData.hooked = false;
        fish.userData.biting = false;
        fish.visible = true;
        fish.userData.details.visible = true;
        fish.scale.setScalar(fish.userData.size * 0.75);
        // Bien visible depuis la berge : levé au-dessus de l'épaule, côté caméra.
        fish.rotation.set(0, Math.PI * 0.75, 0);
        fish.position.set(angler.position.x + 1.5, 3.6, angler.position.z + 1.1);
        etat.floatState = 'holding';
        floatGroup.position.copy(floatIdle);
        etat.fishThrowState = 'idle';
        etat.fishThrowTarget = fishThrowPowerFor(bourricheDistance());
        fishButton.disabled = true;
        fishButton.hidden = true;
        const espece = fish.userData.espece ? fish.userData.espece + ' ' : '';
        etat.spawnFloatingText((fish.userData.espece || 'Poisson') + ' au bord !', fish.position, '#9ef0c0');
        statusDisplay.textContent = espece + 'au bord ! Lance-le dans la bourriche 🧺 (appuie, maintiens, relâche au bon moment).';
    }

    function setFishThrowPower(value) {
        etat.fishThrowPower = Math.max(0, Math.min(1, value));
        feedGaugeFill.style.width = (etat.fishThrowPower * 100).toFixed(0) + '%';
    }

    function startFishThrow() {
        if (etat.floatState !== 'holding' || etat.fishThrowState !== 'idle') {
            return;
        }
        etat.fishThrowState = 'charging';
        etat.fishThrowPhase = 0;
        etat.fishThrowTarget = fishThrowPowerFor(bourricheDistance());
        setFishThrowPower(0);
        feedGauge.classList.add('active');
        feedGaugeTarget.style.left = (etat.fishThrowTarget * 100).toFixed(0) + '%';
        ensureSound();
        statusDisplay.textContent = 'Dose la puissance : relâche quand la jauge passe sur le repère !';
    }

    function computeFishThrowLanding() {
        const dx = BOURRICHE_POS.x - angler.position.x;
        const dz = BOURRICHE_POS.z - angler.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const range = FISH_THROW_MIN + etat.fishThrowPower * (FISH_THROW_MAX - FISH_THROW_MIN);
        fishThrowLanding.set(
            angler.position.x + (dx / d) * range + Math.cos(wind.dir) * wind.strength * FISH_THROW_WIND,
            0.1,
            angler.position.z + (dz / d) * range + Math.sin(wind.dir) * wind.strength * FISH_THROW_WIND
        );
    }

    function releaseFishThrow() {
        if (etat.fishThrowState !== 'charging') {
            return;
        }
        etat.fishThrowState = 'flying';
        etat.fishThrowT = 0;
        feedGauge.classList.remove('active');
        computeFishThrowLanding();
        fishThrowOrigin.set(angler.position.x + 1.1, 2.6, angler.position.z - 0.9);
        if (etat.heldFish) {
            etat.heldFish.position.copy(fishThrowOrigin);
        }
        sound.throwItem();
        statusDisplay.textContent = 'Lancer du poisson…';
    }

    function finishHolding() {
        etat.fishThrowState = 'idle';
        feedGauge.classList.remove('active');
        fishButton.disabled = false;
        fishButton.hidden = true;
        etat.floatState = 'idle';
        etat.fishCaught = false;
        etat.escaped = false;
        floatGroup.position.copy(floatIdle);
    }

    // Réussi : le poisson tombe dans la bourriche (score + carnet).
    function storeHeldFish() {
        const fish = etat.heldFish;
        if (fish) { sound.playPoissonSol(); }
        finishHolding();
        etat.heldFish = null;
        if (!fish) {
            return;
        }
        const weight = fish.userData.weight;
        scene.remove(fish);
        const index = etat.fishes.indexOf(fish);
        if (index >= 0) {
            etat.fishes.splice(index, 1);
        }
        etat.spawnFish();
        etat.caughtWeight = weight;
        etat.score++;
        etat.bourricheCount += 1;
        scoreDisplay.textContent = etat.score;
        etat.recordBattu = null;
        // On enregistre d'abord : le carnet nous dit si c'est un NOUVEAU RECORD.
        const entree = addJournalEntry(weight, fish.userData.espece, fish.userData.longueurCm);
        etat.showCatchMessage(weight, fish.userData.espece, entree.nouveauRecord,
            fish.userData.horsNorme);
        const gainXp = gagnerExperience(weight);
        sound.catchFish();
        etat.spawnRipple(BOURRICHE_POS);
        etat.spawnSplash(BOURRICHE_POS);
        if (entree.nouveauRecord) {
            etat.annoncerRecord(weight, fish.userData.espece, entree.ancienRecord,
                fish.userData.horsNorme);
            return;
        }
        statusDisplay.textContent = (fish.userData.horsNorme ? '✨ HORS NORME ! ' : '')
            + 'Dans la bourriche ! ' + fish.userData.espece + ' — '
            + fmtPoids(weight) + ' (+1 · +' + gainXp + ' XP) 🧺';
    }

    // Raté : le poisson retombe à l'eau et repart.
    function dropHeldFish() {
        const fish = etat.heldFish;
        finishHolding();
        etat.heldFish = null;
        if (!fish) {
            return;
        }
        fish.scale.setScalar(fish.userData.size);
        fish.rotation.set(0, 0, 0);
        fish.userData.depth = Math.min(fish.userData.depth, -1.2);
        fish.position.set(fishThrowLanding.x,
            fish.userData.depth - fish.userData.topOffset, fishThrowLanding.z);
        fish.userData.vx = Math.cos(wind.dir) * 2;
        fish.userData.vz = Math.sin(wind.dir) * 2;
        etat.spawnRipple(fishThrowLanding);
        etat.spawnSplash(fishThrowLanding);
        sound.escape();
        statusDisplay.textContent = 'Raté ! Le poisson est retombé à l’eau…';
    }

    function updateFishThrow(dt) {
        if (etat.fishThrowState === 'charging') {
            etat.fishThrowPhase += FISH_THROW_OSC * dt;
            const m = ((etat.fishThrowPhase % 2) + 2) % 2;
            setFishThrowPower(m < 1 ? m : 2 - m);
        } else if (etat.fishThrowState === 'flying') {
            etat.fishThrowT += dt / FISH_THROW_DURATION;
            const t = Math.min(1, etat.fishThrowT);
            if (etat.heldFish) {
                etat.heldFish.position.set(
                    fishThrowOrigin.x + (fishThrowLanding.x - fishThrowOrigin.x) * t,
                    fishThrowOrigin.y + (fishThrowLanding.y - fishThrowOrigin.y) * t + Math.sin(Math.PI * t) * 3.2,
                    fishThrowOrigin.z + (fishThrowLanding.z - fishThrowOrigin.z) * t
                );
                etat.heldFish.rotation.x += dt * 6;
            }
            if (etat.fishThrowT >= 1) {
                const inBourriche = Math.hypot(
                    fishThrowLanding.x - BOURRICHE_POS.x,
                    fishThrowLanding.z - BOURRICHE_POS.z) < BOURRICHE_RADIUS;
                if (inBourriche) {
                    storeHeldFish();
                } else {
                    dropHeldFish();
                }
            }
        }
    }

    return {
        startHoldingFish, setFishThrowPower, startFishThrow, releaseFishThrow, storeHeldFish,
        dropHeldFish, updateFishThrow
    };
}

// ---------------------------------------------------------------------------
// lancerCanne.js — LANCER DE LA CANNE au dosage (jauge) et animation du geste de lancer. Extrait de script.js (v152).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=214';

export function creerLancerCanne(deps) {
    const {
        filEquipe, angler, feedGaugeFill, totalLignes, feedGauge, feedGaugeTarget, ensureSound,
        statusDisplay, casserLigne, startCast, floatGroup, angleNormalise, rodLocalTip,
        CAST_YAW_ANGLER_MAX, CAST_YAW_ROD_MAX, rodPivot, CAST_SWING_CHARGE, CAST_SWING_RELEASE
    } = deps;

    // ---------------------------------------------------------------------------
    // Lancer de la canne au dosage (même jauge que l'amorce)
    // ---------------------------------------------------------------------------
    const CAST_MIN_RANGE = 7;      // portée mini (jauge à zéro)
    const CAST_MAX_RANGE = 52;     // portée maxi (jauge à fond)
    const CAST_OSC = 1.7;          // vitesse d'oscillation de la jauge

            // 'idle' | 'charging'
    // Ligne tendue pendant le vol : un clic avant l'atterrissage évite l'emmêlement.
    function risqueEmmelement() { return etat.tangleChanceOverride ?? (etat.tangleChance * filEquipe().emmelement); }

    function castPowerForDistance(distance) {
        return Math.max(0, Math.min(1,
            (distance - CAST_MIN_RANGE) / (CAST_MAX_RANGE - CAST_MIN_RANGE)));
    }

    function castAimDistance() {
        return Math.hypot(etat.castAim.x - angler.position.x, etat.castAim.z - angler.position.z);
    }

    function setCastPower(value) {
        etat.castPower = Math.max(0, Math.min(1, value));
        feedGaugeFill.style.width = (etat.castPower * 100).toFixed(0) + '%';
    }

    function startCastCharge(point) {
        if (etat.partieTerminee || totalLignes() === 0) { return; }
        if (etat.castState !== 'idle' || (etat.floatState !== 'idle' && etat.floatState !== 'inWater') || etat.feedMode) {
            return;
        }
        etat.castState = 'charging';
        etat.castPhase = 0;
        etat.castAim.set(point.x, 0.1, point.z);
        etat.castTargetPower = castPowerForDistance(castAimDistance());
        setCastPower(0);
        feedGauge.classList.add('active');
        feedGaugeTarget.style.left = (etat.castTargetPower * 100).toFixed(0) + '%';
        ensureSound();
        statusDisplay.textContent = 'Dose la puissance : relâche quand la jauge passe sur le repère !';
    }

    function moveCastAim(point) {
        if (etat.castState !== 'charging') {
            return;
        }
        etat.castAim.set(point.x, 0.1, point.z);
        etat.castTargetPower = castPowerForDistance(castAimDistance());
        feedGaugeTarget.style.left = (etat.castTargetPower * 100).toFixed(0) + '%';
    }

    function cancelCast() {
        if (etat.castState === 'charging') {
            etat.castState = 'idle';
            feedGauge.classList.remove('active');
            statusDisplay.textContent = 'Lancer annulé. Clique sur l’eau pour réessayer.';
        }
    }

    function releaseCast() {
        if (etat.castState !== 'charging') {
            return;
        }
        // LANCER TROP FORT : la jauge au maximum casse la ligne (et coûte une vie).
        if (etat.castPower >= 0.995) {
            etat.castState = 'idle';
            feedGauge.classList.remove('active');
            casserLigne('Lancer beaucoup trop fort');
            return;
        }
        etat.castState = 'idle';
        feedGauge.classList.remove('active');
        // Le point de chute dépend de la puissance choisie : c'est le geste à réussir.
        const dx = etat.castAim.x - angler.position.x;
        const dz = etat.castAim.z - angler.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const range = CAST_MIN_RANGE + etat.castPower * (CAST_MAX_RANGE - CAST_MIN_RANGE);
        startCast(new THREE.Vector3(
            angler.position.x + (dx / d) * range, 0.1, angler.position.z + (dz / d) * range));
    }

    function updateCast(dt) {
        if (etat.castState !== 'charging') {
            return;
        }
        etat.castPhase += CAST_OSC * dt;
        const m = ((etat.castPhase % 2) + 2) % 2;
        setCastPower(m < 1 ? m : 2 - m);
    }

    // ---------------------------------------------------------------------------
    // ANIMATION DU LANCER : orientation vers la cible + geste de canne.
    // Appelée à chaque image AVANT updateArm/updateRod.
    // ---------------------------------------------------------------------------
    function updateCastAnimation(dt) {
        // 1) Cible à regarder : point visé pendant la charge, point de chute
        //    pendant le vol, puis bouchon réel une fois à l'eau.
        let cible = null;
        let facteur = 0;
        if (etat.castState === 'charging') {
            cible = etat.castAim;
            facteur = 0.9;
        } else if (etat.floatState === 'flying') {
            cible = etat.castTarget;
            facteur = 1;
        } else if (etat.floatState === 'inWater' || etat.floatState === 'bite'
            || etat.floatState === 'struggle' || etat.floatState === 'reeling'
            || etat.floatState === 'snag') {
            cible = floatGroup.position;
            facteur = 0.8;
        }
        let yawAnglerVoulu = 0;
        let yawRodVoulu = 0;
        if (cible) {
            const dx = cible.x - angler.position.x;
            const dz = cible.z - angler.position.z;
            if (Math.hypot(dx, dz) > 0.5) {
                const thetaCible = Math.atan2(dz, dx);
                // Pêcheur : son axe local +z donne theta = PI/2 - lacet.
                yawAnglerVoulu = angleNormalise(
                    (Math.PI / 2 - thetaCible) - etat.anglerYawBase) * facteur;
                // Canne : son bout local a un angle qui dépend AUSSI du geste
                // vertical (rotation X). On le recalcule avec le swing courant ;
                // un lacet ψ diminue l'angle monde de ψ.
                const zSwing = rodLocalTip.y * Math.sin(etat.castSwing)
                    + rodLocalTip.z * Math.cos(etat.castSwing);
                const angleLocalCanne = Math.atan2(zSwing, rodLocalTip.x);
                yawRodVoulu = angleNormalise(
                    (angleLocalCanne - thetaCible) - etat.rodYawBase) * facteur;
            }
        }
        yawAnglerVoulu = Math.max(-CAST_YAW_ANGLER_MAX,
            Math.min(CAST_YAW_ANGLER_MAX, yawAnglerVoulu));
        yawRodVoulu = Math.max(-CAST_YAW_ROD_MAX,
            Math.min(CAST_YAW_ROD_MAX, yawRodVoulu));
        const lissage = Math.min(1, dt * 7);
        etat.castYawAngler += (yawAnglerVoulu - etat.castYawAngler) * lissage;
        etat.castYawRod += (yawRodVoulu - etat.castYawRod) * lissage;
        angler.rotation.y = etat.anglerYawBase + etat.castYawAngler;
        rodPivot.rotation.y = etat.rodYawBase + etat.castYawRod;

        // 2) Geste de canne : armé pendant la charge, fouetté au lâcher, puis repos.
        if (etat.castState === 'charging') {
            etat.castSwing += (CAST_SWING_CHARGE - etat.castSwing) * Math.min(1, dt * 6);
        } else if (etat.floatState === 'flying') {
            const volSecondes = etat.castT * etat.CAST_DURATION;
            const dureeFouette = 0.192;
            if (volSecondes < dureeFouette) {
                const t = volSecondes / dureeFouette;
                const doux = t * t * (3 - 2 * t);
                etat.castSwing = etat.castSwingDepart
                    + (CAST_SWING_RELEASE - etat.castSwingDepart) * doux;
            } else {
                const t = Math.min(1, (volSecondes - dureeFouette) / 0.448);
                etat.castSwing = CAST_SWING_RELEASE * (1 - t) * (1 - t);
            }
        } else {
            etat.castSwing += (0 - etat.castSwing) * Math.min(1, dt * 8);
        }
    }

    return {
        risqueEmmelement, setCastPower, startCastCharge, moveCastAim, cancelCast, releaseCast,
        updateCast, updateCastAnimation
    };
}

// ---------------------------------------------------------------------------
// manivelle.js — MANIVELLE DU MOULINET : on la fait tourner (pointeur) pour
// ramener la ligne. Compte les tours, joue le cliquet, fait PATINER le moulinet
// au-delà de la vitesse maximale et avertit si l'on remonte trop vite.
// Extrait de script.js (v244).
//
// L'état partagé passe par etat.js (`etat.crankRotationDelta`, `etat.crankAngle`,
// `etat.paused`) ; le reste est injecté par `deps`.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=251';

export function creerManivelle(deps) {
    const { crank, crankRotor, sound, ensureSound, vitesseMaxTours, avertirVitesse } = deps;

    const TWO_PI = Math.PI * 2;
    const CRANK_SOUND_PER_TURN = 0.5; // un « cliquet » sonore tous les demi-tours
    let crankDragging = false;
    let crankLastAngle = 0;
    let crankSoundAccum = 0;
    let crankLastMoveTime = 0;
    let crankSpeedRad = 0;
    let crankSpeedWindow = 0;
    let crankSpeedStrikes = 0;

    // Tours de manivelle effectués depuis le dernier appel (puis remis à zéro).
    function consumeCrankTurns() {
        const turns = etat.crankRotationDelta / TWO_PI;
        etat.crankRotationDelta = 0;
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
        if (etat.paused || (event.button !== undefined && event.button !== 0)) { return; }
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
        etat.crankRotationDelta += Math.abs(delta);
        etat.crankAngle += delta;
        crankLastAngle = angle;
        crankRotor.style.transform = 'rotate(' + etat.crankAngle + 'rad)';
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
                etat.crankRotationDelta = Math.max(0, etat.crankRotationDelta - excedent);
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

    return { consumeCrankTurns };
}

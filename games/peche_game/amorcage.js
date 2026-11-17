// ---------------------------------------------------------------------------
// amorcage.js — AMORÇAGE : lancer une boule de nourriture pour attirer les poissons. Extrait de script.js (v153).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=244';

export function creerAmorcage(deps) {
    const {
        scene, stockAmorce, feedButton, majAmorce, ensureSound, POND_CENTER, wind, rayonEtang,
        saveJournal, sound, arm, toolDock, toolToggle, setCameraView, cameraButton, depthPanel,
        quickFeedButton, lineSelect, updateDepthButtons, bornesProfondeur, sonarButton, cancelFeed
    } = deps;

    // ---------------------------------------------------------------------------
    // Amorçage : lancer une boule de nourriture pour attirer les poissons
    // ---------------------------------------------------------------------------
    // Le geste (viser, doser la puissance, arc de vol) est dans lancer.js, commun
    // avec le sonar : ici, on décrit seulement la boule d'amorce (stock, plouf, nuage
    // de miettes qui attire les poissons et dérive doucement au vent).
    const CHUM_RADIUS = 6;             // §17.4 : rayon de la SPHÈRE de fouille (≈ 3 m)
    const CHUM_ATTRACT_RADIUS = 18;    // zone où les poissons sentent l'amorce (3 × R)
    const CHUM_DRIFT = 0.25;           // dérive du nuage au vent
    const CHUM_LIFETIME = 60;          // §17.4 : durée de vie du nuage (s)
    const CHUMS_MAX = 8;               // plafond de sécurité : au-delà, le plus ancien nuage est retiré

    // Source de vérité : TOUS les nuages vivants (le plus ancien en premier). Chaque boule lancée
    // ajoute son nuage ; aucun n'en efface un autre (sauf le plafond ci-dessus).
    etat.chums = [];

    let armSwing = 0;                  // bras : 0 = repos, 1 = armé (en arrière)
    let armThrow = 0;                  // bras : impulsion de lancer

    // Texture douce d'une « bouffée » de miettes.
    function makeChumTexture() {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(226,255,228,0.9)');
        grad.addColorStop(0.5, 'rgba(184,236,196,0.45)');
        grad.addColorStop(1, 'rgba(160,220,175,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    }

    // Retire un nuage de la scène et libère sa texture et son matériau (pas de fuite mémoire).
    function retirerChum(nuage) {
        scene.remove(nuage.group);
        if (nuage.material.map) { nuage.material.map.dispose(); }
        nuage.material.dispose();
    }

    // Retire TOUS les nuages (nouvelle partie).
    etat.viderChums = function () {
        etat.chums.forEach(retirerChum);
        etat.chums.length = 0;
    };

    // Crée un nuage de miettes qui attire les poissons ; les nuages déjà en place restent.
    function spawnChum(position) {
        while (etat.chums.length >= CHUMS_MAX) {
            retirerChum(etat.chums.shift());
        }
        const group = new THREE.Group();
        const material = new THREE.SpriteMaterial({
            map: makeChumTexture(), transparent: true, depthWrite: false, opacity: 0
        });
        // Quelques « bouffées » disposées en cercle (positions fixes : aucun
        // tirage aléatoire, pour garder les tests reproductibles).
        for (let i = 0; i < 6; i++) {
            const sprite = new THREE.Sprite(material);
            const angle = (i / 6) * Math.PI * 2;
            const r = 1.2 + (i % 3) * 1.4;
            sprite.position.set(Math.cos(angle) * r, 0.4 + (i % 3) * 0.4, Math.sin(angle) * r);
            const s = 4 + (i % 3) * 1.5;
            sprite.scale.set(s, s * 0.7, 1);
            group.add(sprite);
        }
        group.position.set(position.x, 0.4, position.z);
        scene.add(group);
        etat.chums.push({
            group: group,
            material: material,
            position: new THREE.Vector3(position.x, 0.1, position.z),
            age: 0,
            lifetime: CHUM_LIFETIME,
            radius: CHUM_RADIUS,
            detect: CHUM_ATTRACT_RADIUS,
            strength: 0
        });
        etat.spawnRipple(position);
    }

    // La boule d'amorce, vue par le geste de lancer (lancer.js).
    etat.declarerProjectile('amorce', {
        verbe: 'amorcer',
        couleur: 0xcdb56f,
        ventFacteur: 5,
        resterDansEtang: true,
        messageArme: 'Amorçage : clique et maintiens sur l’eau pour viser, puis relâche pour doser la puissance.',
        messageVol: 'Lancer de l’amorce…',
        refus() {
            return stockAmorce() === 0 ? 'Plus de boules d’amorce. Recharge dans Carnet → Boutique.' : null;
        },
        consommer() {
            if (etat.amorceDepartRestante > 0) {
                etat.amorceDepartRestante -= 1;
            } else {
                etat.journal.recharges.amorce -= 1;
                saveJournal();
            }
            etat.renderBoutique();
        },
        // Plouf de la BOULE D'AMORCE : son réel dédié (une grosse boule qui tombe),
        // différent du « ploc » du bouchon et du splash du combat.
        atterrir(point) {
            sound.amorceSplash();
            etat.spawnSplash(point);
            spawnChum(point);
            return 'Amorce lancée ! Les poissons s’approchent du nuage de miettes…';
        },
        majMode(arme) {
            feedButton.classList.toggle('active', arme);
            majAmorce();
        }
    });

    // Fait vivre UN nuage ; renvoie false quand il est éteint (à retirer).
    function majNuage(nuage, dt) {
        nuage.age += dt;
        if (nuage.age >= nuage.lifetime) {
            return false;
        }
        // Le nuage dérive doucement avec le vent.
        nuage.position.x += Math.cos(wind.dir) * wind.strength * CHUM_DRIFT * dt;
        nuage.position.z += Math.sin(wind.dir) * wind.strength * CHUM_DRIFT * dt;
        const dx = nuage.position.x - POND_CENTER.x;
        const dz = nuage.position.z - POND_CENTER.z;
        const dd = Math.hypot(dx, dz);
        const maxR = rayonEtang(Math.atan2(dz, dx)) - 6;
        if (dd > maxR) {
            nuage.position.x = POND_CENTER.x + (dx / dd) * maxR;
            nuage.position.z = POND_CENTER.z + (dz / dd) * maxR;
        }
        // Apparition en douceur, puis disparition en fondu.
        const fadeIn = Math.min(1, nuage.age / 1.2);
        const fadeOut = Math.min(1, Math.max(0, (nuage.lifetime - nuage.age) / 3));
        nuage.strength = Math.min(fadeIn, fadeOut);
        // Le nuage COULE jusqu'à la profondeur de la ligne : on amorce là où on pêche.
        nuage.position.y += (etat.HOOK_DEPTH - nuage.position.y) * Math.min(1, dt * 0.7);
        nuage.group.position.set(nuage.position.x, nuage.position.y + 0.35, nuage.position.z);
        nuage.material.opacity = 0.55 * nuage.strength;
        const pulse = 1 + Math.sin(nuage.age * 1.5) * 0.06;
        nuage.group.scale.set(pulse, pulse, pulse);
        nuage.group.rotation.y += dt * 0.15;
        return true;
    }

    function updateChum(dt) {
        // Chaque nuage vieillit seul ; un nuage éteint est retiré de la scène, libéré et ôté du tableau.
        for (let i = etat.chums.length - 1; i >= 0; i--) {
            if (!majNuage(etat.chums[i], dt)) {
                retirerChum(etat.chums[i]);
                etat.chums.splice(i, 1);
            }
        }
    }

    // Animation du bras du pêcheur : repos → armé (visée) → lancer.
    function updateArm(dt) {
        const targetSwing = etat.feedState === 'charging' ? 1 : 0;
        const targetThrow = etat.feedState === 'flying' ? 1 : 0;
        armSwing += (targetSwing - armSwing) * Math.min(1, dt * 8);
        armThrow += (targetThrow - armThrow) * Math.min(1, dt * 12);
        // Le geste de lancer (canne) entraîne aussi le bras : armé puis détendu.
        const cast = etat.castSwing;
        arm.rotation.z = -0.9 - armSwing * 0.9 + armThrow * 1.6 + cast * 0.45;
        arm.rotation.x = 0.4 - armSwing * 1.0 + armThrow * 0.8 - cast * 0.30;
        arm.position.y = 2.1 + armSwing * 0.4 + Math.max(0, cast) * 0.15;
    }

    // Le menu reste accessible pendant l’action pour permettre la pause.
    function mettreAJourBoutonOutils() {
        const ouvert = toolDock.classList.contains('ouvert');
        toolToggle.textContent = ouvert ? '✕ Fermer' : '☰ Menu';
        toolToggle.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
        toolToggle.setAttribute('aria-expanded', String(ouvert));
    }

    function fermerOutils() {
        toolDock.classList.remove('ouvert');
        mettreAJourBoutonOutils();
    }

    toolToggle.addEventListener('click', () => {
        ensureSound();
        if (etat.cameraViewActive) {
            setCameraView(false);
            return;
        }
        if (etat.paused && toolDock.classList.contains('ouvert')) { return; }
        etat.cancelCast();
        cancelFeed();
        toolDock.classList.toggle('ouvert');
        mettreAJourBoutonOutils();
    });

    function updateToolDock() {
        const resting = (etat.floatState === 'idle' || etat.floatState === 'inWater') && etat.cameraMode === 'normal';
        cameraButton.disabled = !resting || etat.paused;
        feedButton.disabled = !resting || etat.paused || stockAmorce() === 0;
        // Au quiver, l'hameçon est posé au fond : le réglage de profondeur ne sert pas.
        depthPanel.hidden = etat.floatState !== 'idle' || etat.techniqueCourante === 'quiver';
        quickFeedButton.hidden = etat.floatState !== 'inWater' || etat.cameraViewActive;
        quickFeedButton.disabled = feedButton.disabled || etat.feedState !== 'idle';
        lineSelect.disabled = etat.floatState !== 'idle' || etat.castState !== 'idle';
        updateDepthButtons(bornesProfondeur(),
            etat.floatState === 'idle' && !etat.paused && !etat.cameraViewActive && etat.castState === 'idle');
        sonarButton.disabled = !etat.sonarBuoy.visible && (!resting || etat.paused);
        if (etat.cameraViewActive && !resting) { setCameraView(false); }
    }

    return {
        updateChum, updateArm, fermerOutils, updateToolDock
    };
}

// ---------------------------------------------------------------------------
// amorcage.js — AMORÇAGE : lancer une boule de nourriture pour attirer les poissons. Extrait de script.js (v153).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=145';

export function creerAmorcage(deps) {
    const {
        scene, angler, feedGaugeFill, feedGaugeTarget, stockAmorce, statusDisplay, feedButton,
        majAmorce, feedGauge, ensureSound, POND_CENTER, wind, rayonEtang, saveJournal, sound,
        arm, toolDock, toolToggle, setCameraView, cameraButton, depthPanel, quickFeedButton,
        lineSelect, updateDepthButtons, bornesProfondeur, sonarButton
    } = deps;

    // ---------------------------------------------------------------------------
    // Amorçage : lancer une boule de nourriture pour attirer les poissons
    // ---------------------------------------------------------------------------
    // Le joueur arme le mode avec le bouton « Nourrir », clique sur l'eau en
    // maintenant le doigt (ou la souris) pour viser, puis relâche : la puissance
    // dépend du moment du relâchement (la jauge oscille toute seule). La boule suit
    // un arc de cercle, poussée par le vent, et crée à l'atterrissage un nuage de
    // miettes qui attire les poissons — et dérive doucement au vent.
              // distance mini d'un lancer (unités)
             // distance maxi (jauge à fond)
    const FEED_FLIGHT_DURATION = 0.9;  // durée du vol de la boule (s)
    const FEED_OSC_SPEED = 1.5;        // vitesse de base de l'oscillation (tours/s)
    const FEED_WIND_FACTOR = 5;        // décalage dû au vent pendant le vol
    const CHUM_ATTRACT_RADIUS = 20;    // zone où les poissons sentent l'amorce
          // force d'attirance (unités/s²)
    const CHUM_DRIFT = 0.25;           // dérive du nuage au vent
    const CHUM_LIFETIME = 16;          // durée de vie du nuage (s)

                  // le mode amorçage est-il armé ?
                // 'idle' | 'charging' | 'flying'
                     // puissance courante (0..1), oscille
               // puissance « idéale » pour atteindre la visée
    let feedPhase = 0;                 // phase de l'oscillation
    let feedChargeT = 0;               // temps de maintien
                      // avancement du vol (0..1)
                       // nuage de miettes en cours
    let armSwing = 0;                  // bras : 0 = repos, 1 = armé (en arrière)
    let armThrow = 0;                  // bras : impulsion de lancer

    const feedOrigin = new THREE.Vector3(-3.2, 3.0, 16.6);

    // La boule de nourriture : une petite boule beige.
    etat.feedBall.castShadow = true;
    etat.feedBall.visible = false;
    scene.add(etat.feedBall);

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

    // Distance de visée → puissance nécessaire pour tomber pile dessus.
    function feedPowerForDistance(distance) {
        return Math.max(0, Math.min(1,
            (distance - etat.FEED_MIN_RANGE) / (etat.FEED_MAX_RANGE - etat.FEED_MIN_RANGE)));
    }

    function feedAimDistance() {
        return Math.hypot(etat.feedAim.x - angler.position.x, etat.feedAim.z - angler.position.z);
    }

    function updateFeedGauge() {
        feedGaugeFill.style.width = (etat.feedPower * 100).toFixed(0) + '%';
        feedGaugeTarget.style.left = (etat.feedTargetPower * 100).toFixed(0) + '%';
    }

    function setFeedMode(on) {
        // On peut amorcer à tout moment où le moulinet est libre : au repos OU
        // avec la ligne à l'eau (l'amorçage attire les poissons vers le bouchon).
        if (on && etat.partieTerminee) { return; }
        if (on && stockAmorce() === 0) {
            statusDisplay.textContent = 'Plus de boules d’amorce. Recharge dans Carnet → Boutique.';
            return;
        }
        if (on && etat.floatState !== 'idle' && etat.floatState !== 'inWater') {
            statusDisplay.textContent = 'Attends la fin de l’action pour pouvoir amorcer.';
            return;
        }
        etat.feedMode = !!on && (etat.floatState === 'idle' || etat.floatState === 'inWater');
        feedButton.classList.toggle('active', etat.feedMode);
        majAmorce();
        if (etat.feedMode) {
            statusDisplay.textContent = 'Amorçage : clique et maintiens sur l’eau pour viser, puis relâche pour doser la puissance.';
        } else if (etat.feedState === 'idle') {
            statusDisplay.textContent = 'Clique sur l’eau pour lancer la ligne.';
        }
    }

    function startFeedCharge(point) {
        if (etat.partieTerminee || etat.feedState !== 'idle' || stockAmorce() === 0) {
            return;
        }
        etat.feedState = 'charging';
        feedChargeT = 0;
        feedPhase = 0;
        etat.feedPower = 0;
        etat.feedAim.set(point.x, 0.1, point.z);
        etat.feedTargetPower = feedPowerForDistance(feedAimDistance());
        feedGauge.classList.add('active');
        updateFeedGauge();
        ensureSound();
        statusDisplay.textContent = 'Vise… relâche quand la jauge passe sur le repère !';
    }

    function moveFeedAim(point) {
        if (etat.feedState !== 'charging') {
            return;
        }
        etat.feedAim.set(point.x, 0.1, point.z);
        etat.feedTargetPower = feedPowerForDistance(feedAimDistance());
        updateFeedGauge();
    }

    function computeFeedLanding() {
        let ax = etat.feedAim.x - angler.position.x;
        let az = etat.feedAim.z - angler.position.z;
        let d = Math.hypot(ax, az);
        if (d < 0.01) {
            // Visée collée au pêcheur : on tire vers le centre de l'étang.
            ax = POND_CENTER.x - angler.position.x;
            az = POND_CENTER.z - angler.position.z;
            d = Math.hypot(ax, az) || 1;
        }
        const range = etat.FEED_MIN_RANGE + etat.feedPower * (etat.FEED_MAX_RANGE - etat.FEED_MIN_RANGE);
        let lx = angler.position.x + (ax / d) * range;
        let lz = angler.position.z + (az / d) * range;
        // Le vent pousse la boule pendant le vol.
        lx += Math.cos(wind.dir) * wind.strength * FEED_WIND_FACTOR;
        lz += Math.sin(wind.dir) * wind.strength * FEED_WIND_FACTOR;
        // La boule retombe dans l'étang.
        const dx = lx - POND_CENTER.x;
        const dz = lz - POND_CENTER.z;
        const dd = Math.hypot(dx, dz);
        const maxR = rayonEtang(Math.atan2(dz, dx)) - 2;
        if (dd > maxR) {
            lx = POND_CENTER.x + (dx / dd) * maxR;
            lz = POND_CENTER.z + (dz / dd) * maxR;
        }
        etat.feedLanding.set(lx, 0.1, lz);
    }

    function releaseFeed() {
        if (etat.feedState !== 'charging') {
            return;
        }
        if (stockAmorce() === 0) { cancelFeed(); return; }
        if (etat.amorceDepartRestante > 0) {
            etat.amorceDepartRestante -= 1;
        } else {
            etat.journal.recharges.amorce -= 1;
            saveJournal();
        }
        etat.renderBoutique();
        etat.feedState = 'flying';
        etat.feedFlyT = 0;
        feedGauge.classList.remove('active');
        computeFeedLanding();
        // La boule part de la main du pêcheur (où qu'il soit sur la berge),
        // un peu en avant de lui, vers la zone visée.
        {
            const dx = etat.feedLanding.x - angler.position.x;
            const dz = etat.feedLanding.z - angler.position.z;
            const dn = Math.hypot(dx, dz) || 1;
            feedOrigin.set(angler.position.x + (dx / dn) * 0.9,
                angler.position.y + 2.6,
                angler.position.z + (dz / dn) * 0.9);
        }
        etat.feedBall.position.copy(feedOrigin);
        etat.feedBall.visible = true;
        sound.throwItem();
        statusDisplay.textContent = 'Lancer de l’amorce…';
    }

    // Crée le nuage de miettes qui attire les poissons.
    function spawnChum(position) {
        if (etat.chum) {
            scene.remove(etat.chum.group);
            etat.chum = null;
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
        etat.chum = {
            group: group,
            material: material,
            position: new THREE.Vector3(position.x, 0.1, position.z),
            age: 0,
            lifetime: CHUM_LIFETIME,
            radius: CHUM_ATTRACT_RADIUS,
            strength: 0
        };
        etat.spawnRipple(position);
    }

    function landFeed() {
        etat.feedState = 'idle';
        etat.feedBall.visible = false;
        // Plouf de la BOULE D'AMORCE : son réel dédié (une grosse boule qui tombe),
        // différent du « ploc » du bouchon et du splash du combat.
        sound.amorceSplash();
        etat.spawnSplash(etat.feedLanding);
        spawnChum(etat.feedLanding);
        setFeedMode(false);
        statusDisplay.textContent = 'Amorce lancée ! Les poissons s’approchent du nuage de miettes…';
    }

    function cancelFeed() {
        if (etat.feedState === 'charging') {
            etat.feedState = 'idle';
            feedGauge.classList.remove('active');
            setFeedMode(false);
        }
    }

    function updateChum(dt) {
        if (!etat.chum) {
            return;
        }
        etat.chum.age += dt;
        if (etat.chum.age >= etat.chum.lifetime) {
            scene.remove(etat.chum.group);
            etat.chum = null;
            return;
        }
        // Le nuage dérive doucement avec le vent.
        etat.chum.position.x += Math.cos(wind.dir) * wind.strength * CHUM_DRIFT * dt;
        etat.chum.position.z += Math.sin(wind.dir) * wind.strength * CHUM_DRIFT * dt;
        const dx = etat.chum.position.x - POND_CENTER.x;
        const dz = etat.chum.position.z - POND_CENTER.z;
        const dd = Math.hypot(dx, dz);
        const maxR = rayonEtang(Math.atan2(dz, dx)) - 6;
        if (dd > maxR) {
            etat.chum.position.x = POND_CENTER.x + (dx / dd) * maxR;
            etat.chum.position.z = POND_CENTER.z + (dz / dd) * maxR;
        }
        // Apparition en douceur, puis disparition en fondu.
        const fadeIn = Math.min(1, etat.chum.age / 1.2);
        const fadeOut = Math.min(1, Math.max(0, (etat.chum.lifetime - etat.chum.age) / 3));
        etat.chum.strength = Math.min(fadeIn, fadeOut);
        // Le nuage COULE jusqu'à la profondeur de la ligne : on amorce là où on pêche.
        etat.chum.position.y += (etat.HOOK_DEPTH - etat.chum.position.y) * Math.min(1, dt * 0.7);
        etat.chum.group.position.set(etat.chum.position.x, etat.chum.position.y + 0.35, etat.chum.position.z);
        etat.chum.material.opacity = 0.55 * etat.chum.strength;
        const pulse = 1 + Math.sin(etat.chum.age * 1.5) * 0.06;
        etat.chum.group.scale.set(pulse, pulse, pulse);
        etat.chum.group.rotation.y += dt * 0.15;
    }

    function updateFeed(dt) {
        if (etat.feedState === 'charging') {
            feedChargeT += dt;
            // La jauge oscille de plus en plus vite : il faut choisir son moment.
            const speed = FEED_OSC_SPEED + Math.min(0.6, feedChargeT * 0.15);
            feedPhase += speed * dt;
            const m = ((feedPhase % 2) + 2) % 2;
            etat.feedPower = m < 1 ? m : 2 - m;
            updateFeedGauge();
        } else if (etat.feedState === 'flying') {
            etat.feedFlyT += dt / FEED_FLIGHT_DURATION;
            const t = Math.min(1, etat.feedFlyT);
            const x = feedOrigin.x + (etat.feedLanding.x - feedOrigin.x) * t;
            const z = feedOrigin.z + (etat.feedLanding.z - feedOrigin.z) * t;
            const arc = 3 + etat.feedPower * 5;
            const y = feedOrigin.y + (etat.feedLanding.y - feedOrigin.y) * t + Math.sin(Math.PI * t) * arc;
            etat.feedBall.position.set(x, y, z);
            etat.feedBall.rotation.x += dt * 8;
            etat.feedBall.rotation.z += dt * 6;
            if (etat.feedFlyT >= 1) {
                landFeed();
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
        setFeedMode, startFeedCharge, moveFeedAim, releaseFeed, cancelFeed, updateChum,
        updateFeed, updateArm, fermerOutils, updateToolDock
    };
}

// ---------------------------------------------------------------------------
// lancer.js — GESTE DE LANCER D'UN OBJET : viser, doser la puissance, arc de vol, arrivée (v179).
//
// Le même geste sert à l'AMORCE (amorcage.js) et au SONAR (sonar.js) : clic sur l'eau
// pour viser, maintien pour doser la jauge, relâchement → l'objet part de la main du
// pêcheur en arc, puis tombe (plouf). Ce qui change d'un objet à l'autre est décrit
// par un « projectile » enregistré dans `etat.projectiles` :
//
//   refus()                 → message si on ne peut pas armer le geste (sinon null)
//   verbe, messageArme, messageVol
//   couleur                 → couleur de l'objet en vol
//   ventFacteur             → poussée du vent pendant le vol
//   resterDansEtang         → true : l'objet est ramené dans l'eau ; false : il tombe où il tombe
//   verifier(point)         → message si l'impact est refusé (null sinon), au relâchement
//   consommer()             → débit du stock (au départ de l'objet)
//   dansEau(point)          → l'impact est-il dans l'eau ? (défaut : oui)
//   atterrir(point, dansEau)→ effets de l'arrivée, renvoie le message à afficher
//   majMode(arme)           → met à jour les boutons quand le mode est armé / désarmé
//
// L'état du geste reste dans etat.js (feedMode, feedState, feedPower, feedAim, feedLanding…).
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=212';

export function creerLancer(deps) {
    const {
        scene, angler, feedGaugeFill, feedGaugeTarget, feedGauge, statusDisplay, ensureSound,
        POND_CENTER, wind, rayonEtang, sound
    } = deps;

    const FEED_FLIGHT_DURATION = 0.9;  // durée du vol (s)
    const FEED_OSC_SPEED = 1.5;        // vitesse de base de l'oscillation (tours/s)

    let feedPhase = 0;                 // phase de l'oscillation
    let feedChargeT = 0;               // temps de maintien
    let projectileEnVol = null;        // le projectile parti (mémorisé au relâchement)
    const feedOrigin = new THREE.Vector3(-3.2, 3.0, 16.6);

    etat.projectiles = {};
    etat.feedType = 'amorce';          // projectile armé : 'amorce' | 'sonar'

    // Enregistre un objet lançable (voir l'en-tête) ; les champs omis ont une valeur neutre.
    etat.declarerProjectile = function (nom, definition) {
        etat.projectiles[nom] = Object.assign({
            refus: () => null, verifier: () => null, consommer() {}, dansEau: () => true,
            ventFacteur: 0, resterDansEtang: false, majMode() {}
        }, definition);
    };

    // L'objet lancé : une petite boule (beige pour l'amorce, jaune pour le sonar).
    etat.feedBall.castShadow = true;
    etat.feedBall.visible = false;
    scene.add(etat.feedBall);

    function projectile() {
        return etat.projectiles[etat.feedType] || etat.projectiles.amorce;
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

    function setFeedMode(on, type) {
        const nom = type || 'amorce';
        const p = etat.projectiles[nom];
        // On peut lancer à tout moment où le moulinet est libre : au repos OU
        // avec la ligne à l'eau (l'amorce attire les poissons vers le bouchon).
        if (on && etat.partieTerminee) { return; }
        const refus = on ? p.refus() : null;
        if (refus) {
            statusDisplay.textContent = refus;
            return;
        }
        if (on && etat.floatState !== 'idle' && etat.floatState !== 'inWater') {
            statusDisplay.textContent = 'Attends la fin de l’action pour pouvoir ' + p.verbe + '.';
            return;
        }
        etat.feedMode = !!on && (etat.floatState === 'idle' || etat.floatState === 'inWater');
        if (etat.feedMode) { etat.feedType = nom; }
        Object.keys(etat.projectiles).forEach(cle => {
            etat.projectiles[cle].majMode(etat.feedMode && etat.feedType === cle);
        });
        if (etat.feedMode) {
            statusDisplay.textContent = p.messageArme;
        } else {
            etat.feedType = 'amorce';
            if (etat.feedState === 'idle') {
                statusDisplay.textContent = 'Clique sur l’eau pour lancer la ligne.';
            }
        }
    }

    function startFeedCharge(point) {
        if (etat.partieTerminee || etat.feedState !== 'idle' || projectile().refus()) {
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

    // Point d'impact : dans la direction visée, à la portée donnée par la puissance.
    function computeFeedLanding(p) {
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
        // Le vent pousse l'objet pendant le vol.
        lx += Math.cos(wind.dir) * wind.strength * p.ventFacteur;
        lz += Math.sin(wind.dir) * wind.strength * p.ventFacteur;
        if (p.resterDansEtang) {
            // L'objet retombe toujours dans l'étang.
            const dx = lx - POND_CENTER.x;
            const dz = lz - POND_CENTER.z;
            const dd = Math.hypot(dx, dz);
            const maxR = rayonEtang(Math.atan2(dz, dx)) - 2;
            if (dd > maxR) {
                lx = POND_CENTER.x + (dx / dd) * maxR;
                lz = POND_CENTER.z + (dz / dd) * maxR;
            }
        }
        etat.feedLanding.set(lx, 0.1, lz);
    }

    function releaseFeed() {
        if (etat.feedState !== 'charging') {
            return;
        }
        const p = projectile();
        if (p.refus()) { cancelFeed(); return; }
        computeFeedLanding(p);
        // Impact refusé (ex. sonar sur un ponton) : rien ne part, le mode reste armé.
        const refus = p.verifier(etat.feedLanding);
        if (refus) {
            etat.feedState = 'idle';
            feedGauge.classList.remove('active');
            statusDisplay.textContent = refus;
            return;
        }
        p.consommer();
        projectileEnVol = p;
        etat.feedState = 'flying';
        etat.feedFlyT = 0;
        feedGauge.classList.remove('active');
        // L'objet part de la main du pêcheur (où qu'il soit sur la berge),
        // un peu en avant de lui, vers la zone visée.
        {
            const dx = etat.feedLanding.x - angler.position.x;
            const dz = etat.feedLanding.z - angler.position.z;
            const dn = Math.hypot(dx, dz) || 1;
            feedOrigin.set(angler.position.x + (dx / dn) * 0.9,
                angler.position.y + 2.6,
                angler.position.z + (dz / dn) * 0.9);
        }
        etat.feedBall.material.color.setHex(p.couleur);
        etat.feedBall.position.copy(feedOrigin);
        etat.feedBall.visible = true;
        sound.throwItem();
        statusDisplay.textContent = p.messageVol;
    }

    function landFeed() {
        const p = projectileEnVol || projectile();
        projectileEnVol = null;
        etat.feedState = 'idle';
        etat.feedBall.visible = false;
        const message = p.atterrir(etat.feedLanding, p.dansEau(etat.feedLanding));
        setFeedMode(false);
        if (message) { statusDisplay.textContent = message; }
    }

    function cancelFeed() {
        if (etat.feedState === 'charging') {
            etat.feedState = 'idle';
            feedGauge.classList.remove('active');
            setFeedMode(false);
        }
    }

    // Une image du geste : la jauge oscille (charge) ou l'objet suit son arc (vol).
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

    return { setFeedMode, startFeedCharge, moveFeedAim, releaseFeed, cancelFeed, updateFeed };
}

// ---------------------------------------------------------------------------
// sonar.js — SONAR : bouée, radar, ondes jaunes, achats (sonar, barque) et rangement. Extrait de script.js (v160).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=145';

export function creerSonar(deps) {
    const {
        scene, sonarRadar, saveJournal, renderJournal, sonarPanel, sonarButton,
        waterWaveHeightAt, sound, sonarCount, POND_CENTER, angler, rayonEtang, fermerOutils
    } = deps;

    etat.SONAR_PRICE = 150;
    etat.BATEAU_PRIX = 180;
    const SONAR_RADIUS = 24; // 12 m à l’échelle du jeu.
    etat.sonarBuoy = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xffb62e, roughness: 0.55 }));
    etat.sonarBuoy.visible = false;
    scene.add(etat.sonarBuoy);
    const sonarContext = sonarRadar.getContext('2d');
    etat.sonarScanTimer = 0;

    // « Pings » de sonar : quand un poisson est repéré, le sonar émet un ping
    // de sous-marin ET une onde jaune qui s'étend à la surface de l'eau.
    // Pas plus d'un ping toutes les SONAR_PING_DELAI secondes (« de temps en temps »).
    const SONAR_PING_DELAI = 1.8;   // s — tempo minimale entre deux pings.
    const SONAR_ONDE_DUREE = 1.4;   // s — vie d'une onde jaune.
    const sonarOndeGeo = new THREE.RingGeometry(0.92, 1, 40);
    etat.sonarOndes = [];          // ondes jaunes vivantes (Mesh).
    etat.sonarHorloge = 0;           // secondes avancées par updateSonar (horloge du sonar).
    etat.sonarDernierPing = -Infinity;
    etat.sonarPings = 0;             // compteur de pings (pour les tests).

    // Émet une onde jaune à la surface, centrée sur la bouée du sonar.
    function emettreOndeSonar() {
        const onde = new THREE.Mesh(sonarOndeGeo, new THREE.MeshBasicMaterial({
            color: 0xffc454, transparent: true, opacity: 0.85,
            side: THREE.DoubleSide, depthWrite: false
        }));
        onde.rotation.x = -Math.PI / 2; // à plat sur l'eau
        onde.position.set(etat.sonarBuoy.position.x, 0.1, etat.sonarBuoy.position.z);
        onde.userData.vie = 0;
        scene.add(onde);
        etat.sonarOndes.push(onde);
    }

    // Fait disparaître immédiatement toutes les ondes (rangement du sonar).
    function effacerOndesSonar() {
        while (etat.sonarOndes.length > 0) {
            const onde = etat.sonarOndes.pop();
            scene.remove(onde);
            onde.material.dispose();
        }
    }

    function acheterSonar() {
        if (etat.journal.sonar || etat.journal.experience < etat.SONAR_PRICE) { return false; }
        etat.journal.experience -= etat.SONAR_PRICE;
        etat.journal.sonar = true;
        saveJournal();
        renderJournal();
        return true;
    }

    // Achète la barque (un seul achat, pour toujours). Renvoie true si réussi.
    function acheterBateau() {
        if (etat.journal.bateau || etat.journal.experience < etat.BATEAU_PRIX) { return false; }
        etat.journal.experience -= etat.BATEAU_PRIX;
        etat.journal.bateau = true;
        saveJournal();
        renderJournal();
        return true;
    }

    function rangerSonar() {
        etat.sonarBuoy.visible = false;
        effacerOndesSonar();
        sonarPanel.hidden = true;
        sonarButton.textContent = '📡 Poser le sonar';
        sonarButton.setAttribute('aria-pressed', 'false');
    }

    function updateSonar(dt, time) {
        if (!etat.sonarBuoy.visible) { return; }
        // Le sonar a SA propre horloge (dt cumulé) : la tempo des pings ne dépend
        // ni de elapsed (jeu) ni de testTime (harnais de test).
        etat.sonarHorloge += dt;
        const origin = etat.sonarBuoy.position;
        origin.y = 0.13 + waterWaveHeightAt(origin.x, origin.z, time);

        // Les ondes jaunes vivent leur vie entre deux balayages : elles grandissent
        // en s'estompant, en suivant doucement la houle.
        for (let i = etat.sonarOndes.length - 1; i >= 0; i--) {
            const onde = etat.sonarOndes[i];
            onde.userData.vie += dt;
            const progression = onde.userData.vie / SONAR_ONDE_DUREE;
            if (progression >= 1) {
                scene.remove(onde);
                onde.material.dispose();
                etat.sonarOndes.splice(i, 1);
                continue;
            }
            onde.position.y = 0.1
                + waterWaveHeightAt(onde.position.x, onde.position.z, time) * 0.5;
            onde.scale.setScalar(1 + progression * 6);
            onde.material.opacity = 0.85 * (1 - progression);
        }

        etat.sonarScanTimer -= dt;
        if (etat.sonarScanTimer > 0) { return; }
        etat.sonarScanTimer = 0.2;

        const center = sonarRadar.width / 2;
        const radius = center - 4;
        if (sonarContext) {
            sonarContext.clearRect(0, 0, sonarRadar.width, sonarRadar.height);
            sonarContext.strokeStyle = '#76b5ac';
            for (const fraction of [0.5, 1]) {
                sonarContext.beginPath();
                sonarContext.arc(center, center, radius * fraction, 0, Math.PI * 2);
                sonarContext.stroke();
            }
            sonarContext.fillStyle = '#ffc454';
            sonarContext.fillRect(center - 2, center - 2, 4, 4);
            sonarContext.fillStyle = '#9df5c6';
        }

        let detected = 0;
        for (const fish of etat.fishes) {
            if (fish === etat.heldFish || fish.userData.hooked) { continue; }
            const dx = fish.position.x - origin.x;
            const dz = fish.position.z - origin.z;
            if (dx * dx + dz * dz > SONAR_RADIUS ** 2) { continue; }
            detected += 1;
            if (sonarContext) {
                sonarContext.beginPath();
                sonarContext.arc(center + dx / SONAR_RADIUS * radius,
                    center + dz / SONAR_RADIUS * radius, 2.6, 0, Math.PI * 2);
                sonarContext.fill();
            }
        }
        // Poisson repéré : « ping » de sous-marin + onde jaune à la surface
        // (pas plus d'un ping toutes les SONAR_PING_DELAI secondes).
        if (detected > 0 && etat.sonarHorloge - etat.sonarDernierPing >= SONAR_PING_DELAI) {
            // MÊME horloge des deux côtés : le « time » passé par l'animateur est
            // l'horloge du JEU (grande après plusieurs parties), pas celle du
            // sonar — les mélanger casse la tempo dès que le jeu a tourné.
            etat.sonarDernierPing = etat.sonarHorloge;
            etat.sonarPings += 1;
            sound.sonarPing();
            emettreOndeSonar();
        }
        const label = detected + (detected === 1 ? ' poisson' : ' poissons') + ' · 12 m';
        if (sonarCount.textContent !== label) {
            sonarCount.textContent = label;
            sonarRadar.setAttribute('aria-label', 'Radar, nord en haut. ' + label);
        }
    }

    sonarButton.addEventListener('click', () => {
        if (!etat.journal.sonar) { return; }
        if (etat.sonarBuoy.visible) {
            rangerSonar();
        } else {
            if (etat.paused || (etat.floatState !== 'idle' && etat.floatState !== 'inWater')) { return; }
            if (etat.floatState === 'inWater') {
                etat.sonarBuoy.position.copy(etat.floatGroup.position);
            } else if (etat.modeBateau) {
                // Depuis la barque : le sonar part DEVANT, vers le centre de l'étang.
                const dx = POND_CENTER.x - angler.position.x;
                const dz = POND_CENTER.z - angler.position.z;
                const d = Math.hypot(dx, dz) || 1;
                etat.sonarBuoy.position.set(angler.position.x + (dx / d) * 8, 0.13,
                    angler.position.z + (dz / d) * 8);
            } else {
                const angle = Math.atan2(angler.position.z - POND_CENTER.z, angler.position.x - POND_CENTER.x);
                const distance = rayonEtang(angle) - 4;
                etat.sonarBuoy.position.set(POND_CENTER.x + Math.cos(angle) * distance, 0.13,
                    POND_CENTER.z + Math.sin(angle) * distance);
            }
            etat.sonarBuoy.visible = true;
            sonarPanel.hidden = false;
            sonarButton.textContent = '📡 Ranger le sonar';
            sonarButton.setAttribute('aria-pressed', 'true');
            etat.sonarScanTimer = 0;
            etat.sonarDernierPing = -Infinity; // un placement peut pinger tout de suite
            updateSonar(0, etat.elapsed);
        }
        fermerOutils();
    });

    return {
        acheterSonar, acheterBateau, rangerSonar, updateSonar
    };
}

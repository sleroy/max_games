// ---------------------------------------------------------------------------
// sonar.js — SONAR : bouée, radar, ondes jaunes, achats (sonar, barque) et rangement. Extrait de script.js (v160).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=212';

export function creerSonar(deps) {
    const {
        scene, sonarRadar, saveJournal, renderJournal, sonarPanel, sonarButton,
        waterWaveHeightAt, sound, sonarCount, POND_CENTER, rayonEtang, fermerOutils, setFeedMode,
        obstacles
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

    // Pose la bouée là où elle est tombée : le radar de 12 m se centre sur l'impact réel.
    // Le scan démarre ici, jamais avant le plouf.
    function poserBouee(point) {
        etat.sonarBuoy.position.set(point.x, 0.13, point.z);
        etat.sonarBuoy.visible = true;
        sonarPanel.hidden = false;
        sonarButton.textContent = '📡 Ranger le sonar';
        sonarButton.setAttribute('aria-pressed', 'true');
        etat.sonarScanTimer = 0;
        updateSonar(0, etat.elapsed);
    }

    // La bouée, vue par le geste de lancer (lancer.js) : mêmes visée, jauge et arc que l'amorce.
    etat.declarerProjectile('sonar', {
        verbe: 'lancer le sonar',
        couleur: 0xffb62e,
        ventFacteur: 2.5,           // comme le lancer de la ligne
        resterDansEtang: false,     // la bouée tombe où elle tombe, même sur la berge
        messageArme: 'Sonar : clique et maintiens sur l’eau pour viser, puis relâche pour lancer la bouée.',
        messageVol: 'La bouée du sonar part…',
        // Même règle que le lancer de la ligne : pas sur un ponton, une écluse ou des roches.
        verifier(point) {
            const bloque = obstacles.lancerBloque(point);
            if (!bloque) { return null; }
            etat.spawnFloatingText('Lancer bloqué !', point, '#ffb347');
            return 'La bouée retombe sur ' + bloque.nom + ' ! Vise l’eau libre.';
        },
        dansEau(point) {
            const angle = Math.atan2(point.z - POND_CENTER.z, point.x - POND_CENTER.x);
            return Math.hypot(point.x - POND_CENTER.x, point.z - POND_CENTER.z) <= rayonEtang(angle) - 1.5;
        },
        atterrir(point, dansEau) {
            if (etat.partieTerminee) { return ''; }
            if (!dansEau) {
                etat.spawnFloatingText('Sur la berge !', point, '#ffb347');
                return 'La bouée est tombée sur la berge. Vise plus court, vers l’eau.';
            }
            sound.splash();
            etat.spawnSplash(point);
            etat.spawnRipple(point);
            poserBouee(point);
            return 'Sonar posé : le radar balaie 12 m autour de la bouée.';
        },
        majMode(arme) {
            if (etat.sonarBuoy.visible) { return; }
            sonarButton.textContent = arme ? '📡 Annuler la visée' : '📡 Poser le sonar';
            sonarButton.setAttribute('aria-pressed', String(arme));
        }
    });

    // 📡 : lancer (visée → maintien → relâchement) ; sur une bouée posée, ranger tout de suite.
    sonarButton.addEventListener('click', () => {
        if (!etat.journal.sonar) { return; }
        if (etat.sonarBuoy.visible) {
            rangerSonar();
        } else if (etat.feedMode && etat.feedType === 'sonar') {
            if (etat.feedState === 'idle') { setFeedMode(false); }   // annule la visée
        } else {
            // Mêmes règles d'accès que l'amorce : ligne au repos ou à l'eau, hors combat, accrochage, emmêlement.
            if (etat.paused || etat.cameraMode !== 'normal' || etat.castState !== 'idle' || etat.feedState !== 'idle') { return; }
            if (etat.floatState !== 'idle' && etat.floatState !== 'inWater') { return; }
            setFeedMode(true, 'sonar');
        }
        fermerOutils();
    });

    return {
        acheterSonar, acheterBateau, rangerSonar, updateSonar
    };
}

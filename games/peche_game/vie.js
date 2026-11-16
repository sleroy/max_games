// ---------------------------------------------------------------------------
// vie.js — VIE AMBIANTE (oiseaux, libellules, poisson qui saute) et bulles sous l'eau. Extrait de script.js (v159).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=216';

export function creerVie(deps) {
    const {
        scene, POND_CENTER, sound
    } = deps;

    // ---------------------------------------------------------------------------
    // Vie ambiante : oiseaux, libellules et poisson qui saute.
    // ---------------------------------------------------------------------------
    etat.birds = [];
    for (let i = 0; i < 3; i++) {
        const bird = new THREE.Group();
        const corps = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.9 })
        );
        corps.scale.set(1.8, 0.7, 0.8);
        bird.add(corps);
        const ailes = [];
        for (let c = -1; c <= 1; c += 2) {
            const aile = new THREE.Mesh(
                new THREE.PlaneGeometry(2.2, 0.9),
                new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.9, side: THREE.DoubleSide })
            );
            aile.position.set(0, 0.1, c * 1.1);
            bird.add(aile);
            ailes.push({ mesh: aile, cote: c });
        }
        bird.userData.ailes = ailes;
        bird.userData.phase = i * 2.1;
        scene.add(bird);
        etat.birds.push(bird);
    }

    etat.libellules = [];
    for (let i = 0; i < 3; i++) {
        const lib = new THREE.Group();
        const corps = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5),
            new THREE.MeshStandardMaterial({ color: 0x2f6f8f, roughness: 0.6 })
        );
        corps.rotation.z = Math.PI / 2;
        lib.add(corps);
        for (let c = -1; c <= 1; c += 2) {
            lib.add(new THREE.Mesh(
                new THREE.PlaneGeometry(0.9, 0.28),
                new THREE.MeshStandardMaterial({
                    color: 0xd9f2ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide
                })
            ));
        }
        lib.userData.phase = i * 1.7;
        scene.add(lib);
        etat.libellules.push(lib);
    }

    // Poisson qui saute hors de l'eau (un seul, réutilisé).
    etat.sauteur = new THREE.Group();
    etat.sauteur.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xb9c6c0, roughness: 0.4, metalness: 0.3 })
    ));
    etat.sauteur.visible = false;
    scene.add(etat.sauteur);
    let sautT = -1;
    let sautTimer = 26;
    let oiseauTimer = 14;

    function updateAmbiante(dt, time) {
        for (let i = 0; i < etat.birds.length; i++) {
            const bird = etat.birds[i];
            const p = bird.userData.phase;
            bird.position.set(
                Math.cos(time * 0.06 + p) * 110,
                24 + Math.sin(time * 0.3 + p) * 2.5,
                POND_CENTER.z + Math.sin(time * 0.06 + p) * 80);
            bird.rotation.y = -time * 0.06 - p + Math.PI / 2;
            const battement = Math.sin(time * 9 + p) * 0.7;
            bird.userData.ailes.forEach(a => { a.mesh.rotation.x = a.cote * (0.2 + battement); });
        }
        for (let i = 0; i < etat.libellules.length; i++) {
            const lib = etat.libellules[i];
            const p = lib.userData.phase;
            lib.position.set(
                POND_CENTER.x + Math.sin(time * 0.9 + p) * 14 + Math.sin(time * 3.1 + p) * 1.5,
                1.2 + Math.sin(time * 2.3 + p) * 0.5,
                POND_CENTER.z + 18 + Math.cos(time * 0.7 + p * 1.3) * 9);
            lib.rotation.y = Math.sin(time * 2 + p) * 0.6;
        }
        if (sautT < 0) {
            sautTimer -= dt;
            if (sautTimer <= 0) {
                sautTimer = 24 - etat.weatherPluie * 8;
                sautT = 0;
                etat.sauteur.position.set(POND_CENTER.x + 8, 0.1, POND_CENTER.z + 22);
                etat.sauteur.visible = true;
                sound.jump();
                etat.spawnRipple(etat.sauteur.position);
            }
        } else {
            sautT += dt;
            const duree = 1.1;
            const t = Math.min(1, sautT / duree);
            etat.sauteur.position.y = 0.1 + Math.sin(Math.PI * t) * 2.6;
            etat.sauteur.rotation.x = -Math.sin(Math.PI * t) * 1.2;
            if (sautT >= duree) {
                sautT = -1;
                etat.sauteur.visible = false;
                sound.retombe();
                etat.spawnRipple(etat.sauteur.position);
            }
        }
        oiseauTimer -= dt;
        if (oiseauTimer <= 0) {
            oiseauTimer = 16 + etat.weatherPluie * 10;
            if (etat.weatherPluie < 0.4) {
                sound.birds();
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Bulles : le seul indice de la présence des poissons sous l'eau.
    // ---------------------------------------------------------------------------
    etat.bubbles = [];
    const bubbleGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const bubbleMat = new THREE.MeshBasicMaterial({
        color: 0xdff3ff, transparent: true, opacity: 0.65, depthWrite: false
    });

    function spawnBubbles(position, count) {
        if (etat.bubbles.length > 70) {
            return;
        }
        for (let i = 0; i < count; i++) {
            const bulle = new THREE.Mesh(bubbleGeo, bubbleMat);
            bulle.position.set(
                position.x + ((i * 7) % 3 - 1) * 0.16,
                Math.max(-3.4, position.y),
                position.z + ((i * 5) % 3 - 1) * 0.16);
            bulle.userData.vy = 0.7 + (i % 3) * 0.25;
            scene.add(bulle);
            etat.bubbles.push({ mesh: bulle, t: 0 });
        }
    }

    function updateBubbles(dt) {
        for (let i = etat.bubbles.length - 1; i >= 0; i--) {
            const b = etat.bubbles[i];
            b.t += dt;
            b.mesh.position.y += b.mesh.userData.vy * dt;
            if (b.mesh.position.y > 0.05 || b.t > 2.4) {
                scene.remove(b.mesh);
                etat.bubbles.splice(i, 1);
            }
        }
    }

    return {
        updateAmbiante, spawnBubbles, updateBubbles
    };
}

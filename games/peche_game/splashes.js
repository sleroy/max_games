// ---------------------------------------------------------------------------
// splashes.js — module extrait de script.js (découpage v144).
// Contrat : voir docs/modules.md (dépendances injectées, pas de globales).
// ---------------------------------------------------------------------------

import * as THREE from 'three';

export function creerSplashes(deps) {
    const scene = deps.scene;

    // ---------------------------------------------------------------------------
    // Éclaboussures (ferrage, atterrissage de l'amorce)
    // ---------------------------------------------------------------------------
    const splashes = [];
    const splashGeo = new THREE.SphereGeometry(0.1, 6, 6);

    function spawnSplash(position) {
        if (splashes.length > 60) {
            return;
        }
        for (let i = 0; i < 8; i++) {
            const drop = new THREE.Mesh(splashGeo, new THREE.MeshBasicMaterial({
                color: 0xeaf6ff, transparent: true, opacity: 0.9
            }));
            drop.position.set(position.x, Math.max(0.15, position.y), position.z);
            const a = (i / 8) * Math.PI * 2;
            drop.userData.vx = Math.cos(a) * (1.2 + (i % 3) * 0.5);
            drop.userData.vz = Math.sin(a) * (1.2 + (i % 3) * 0.5);
            drop.userData.vy = 3.5 + (i % 3) * 0.7;
            scene.add(drop);
            splashes.push({ mesh: drop, t: 0 });
        }
    }

    function updateSplashes(dt) {
        for (let i = splashes.length - 1; i >= 0; i--) {
            const s = splashes[i];
            s.t += dt;
            const d = s.mesh.userData;
            d.vy -= 12 * dt;
            s.mesh.position.x += d.vx * dt;
            s.mesh.position.z += d.vz * dt;
            s.mesh.position.y += d.vy * dt;
            s.mesh.material.opacity = Math.max(0, 0.9 * (1 - s.t / 0.9));
            if (s.t > 0.9 || s.mesh.position.y < -0.2) {
                scene.remove(s.mesh);
                s.mesh.material.dispose();
                splashes.splice(i, 1);
            }
        }
    }


    return {
        spawnSplash: spawnSplash,
        updateSplashes: updateSplashes,
    };
}

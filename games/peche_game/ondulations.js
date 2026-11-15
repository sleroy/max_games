// ---------------------------------------------------------------------------
// ondulations.js — module extrait de script.js (découpage v144).
// Contrat : voir docs/modules.md (dépendances injectées, pas de globales).
// ---------------------------------------------------------------------------

import * as THREE from 'three';

export function creerOndulations(deps) {
    const scene = deps.scene;

    // ---------------------------------------------------------------------------
    // Ondulations
    // ---------------------------------------------------------------------------
    const ripples = [];

    function spawnRipple(position) {
        const geo = new THREE.RingGeometry(0.3, 0.42, 32);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position.x, 0.06, position.z);
        scene.add(mesh);
        ripples.push({ mesh: mesh, t: 0 });
    }

    function updateRipples(dt) {
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            r.t += dt;
            const s = 1 + r.t * 4.5;
            r.mesh.scale.set(s, s, s);
            r.mesh.material.opacity = Math.max(0, 0.32 * (1 - r.t / 1.1));
            if (r.t > 1.1) {
                scene.remove(r.mesh);
                r.mesh.geometry.dispose();
                r.mesh.material.dispose();
                ripples.splice(i, 1);
            }
        }
    }


    return {
        ripples: ripples,
        spawnRipple: spawnRipple,
        updateRipples: updateRipples,
    };
}

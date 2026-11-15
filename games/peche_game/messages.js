// ---------------------------------------------------------------------------
// messages.js — module extrait de script.js (découpage v144).
// Contrat : voir docs/modules.md (dépendances injectées, pas de globales).
// ---------------------------------------------------------------------------

import * as THREE from 'three';

export function creerMessages(deps) {
    const canvas = deps.canvas;
    const scene = deps.scene;

    // ---------------------------------------------------------------------------
    // Messages flottants (dans la scène 3D) et anneaux de touche ratée
    // ---------------------------------------------------------------------------
    // Sans « vue bouchon », le joueur surveille son bouchon de LOIN. Ces messages
    // flottants et ces ronds rouges lui disent tout de suite ce qui vient de se
    // passer : touche ratée, ferrage trop tôt, ferrage parfait…
    const floatingTexts = [];

    function makeTextTexture(texte, couleur) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const g = canvas.getContext('2d');
        if (!g) {
            return null;
        }
        g.font = 'bold 64px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.lineWidth = 12;
        g.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        if (typeof g.strokeText === 'function') {
            g.strokeText(texte, 256, 64);
        }
        g.fillStyle = couleur || '#ffffff';
        if (typeof g.fillText === 'function') {
            g.fillText(texte, 256, 64);
        }
        return new THREE.CanvasTexture(canvas);
    }

    function spawnFloatingText(texte, position, couleur) {
        const texture = makeTextTexture(texte, couleur);
        if (!texture) {
            return;
        }
        const material = new THREE.SpriteMaterial({
            map: texture, transparent: true, depthWrite: false, depthTest: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(position.x, position.y + 1.4, position.z);
        sprite.scale.set(7, 1.75, 1);
        scene.add(sprite);
        floatingTexts.push({ sprite: sprite, texte: texte, t: 0, duree: 2.4 });
    }

    function updateFloatingTexts(dt) {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const item = floatingTexts[i];
            item.t += dt;
            const k = item.t / item.duree;
            item.sprite.position.y += dt * 0.8;               // il s'élève doucement
            item.sprite.material.opacity = Math.max(0, 1 - k * k);
            const grossit = 1 + Math.min(0.2, k * 0.5);       // un peu plus gros au début
            item.sprite.scale.set(7 * grossit, 1.75 * grossit, 1);
            if (item.t >= item.duree) {
                scene.remove(item.sprite);
                if (item.sprite.material.map) {
                    item.sprite.material.map.dispose();
                }
                item.sprite.material.dispose();
                floatingTexts.splice(i, 1);
            }
        }
    }

    // Anneaux ROUGES : ils s'écartent du bouchon quand la touche est ratée.
    const missRings = [];

    function spawnMissRing(position, rayon) {
        const r = rayon || 0.32;
        const geo = new THREE.RingGeometry(r, r + 0.16, 40);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff2d2d, transparent: true, opacity: 0.85,
            depthWrite: false, side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position.x, 0.09, position.z);
        scene.add(mesh);
        missRings.push({ mesh: mesh, t: 0 });
    }

    function updateMissRings(dt) {
        for (let i = missRings.length - 1; i >= 0; i--) {
            const r = missRings[i];
            r.t += dt;
            const s = 1 + r.t * 2.4;                          // il s'écarte doucement
            r.mesh.scale.set(s, s, s);
            r.mesh.material.opacity = Math.max(0, 0.85 * (1 - r.t / 1.9));
            if (r.t > 1.9) {
                scene.remove(r.mesh);
                r.mesh.geometry.dispose();
                r.mesh.material.dispose();
                missRings.splice(i, 1);
            }
        }
    }

    // Une touche ratée : deux ronds rouges concentriques autour du bouchon.
    function signalerToucheRatee(position) {
        spawnMissRing(position, 0.3);
        spawnMissRing(position, 0.62);
    }


    return {
        floatingTexts: floatingTexts,
        spawnFloatingText: spawnFloatingText,
        updateFloatingTexts: updateFloatingTexts,
        missRings: missRings,
        updateMissRings: updateMissRings,
        signalerToucheRatee: signalerToucheRatee,
    };
}

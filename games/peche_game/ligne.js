// ---------------------------------------------------------------------------
// ligne.js — LIGNE + FLOTTEUR : textures du bouchon, opacité, bornes et réglage de profondeur. Extrait de script.js (v155).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=145';

export function creerLigne(deps) {
    const {
        scene, flotteurCourant, depthLabel, nombreMetres, depthMinus, depthPlus,
        majCoupeProfondeur
    } = deps;

    // ---------------------------------------------------------------------------
    // Ligne + flotteur
    // ---------------------------------------------------------------------------
    // Ligne préallouée (aucune allocation par image) : on écrit dans le tampon.
    etat.LINE_SEGMENTS = 12;
    etat.linePositions = new Float32Array((etat.LINE_SEGMENTS + 1) * 3);
    etat.lineGeometry = new THREE.BufferGeometry();
    etat.lineGeometry.setAttribute('position', new THREE.BufferAttribute(etat.linePositions, 3));
    const line = new THREE.Line(etat.lineGeometry, new THREE.LineBasicMaterial({
        color: 0x232c2b, transparent: true, opacity: 0.58, depthWrite: false
    }));
    line.frustumCulled = false;
    scene.add(line);

    function makeBobberTexture() {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const g = c.getContext('2d');
        g.fillStyle = '#f4f4f4';
        g.fillRect(0, 0, 64, 32);
        g.fillStyle = '#d33';
        g.fillRect(0, 32, 64, 32);
        return new THREE.CanvasTexture(c);
    }

    etat.floatGroup = new THREE.Group();
    etat.floatBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 12),
        new THREE.MeshStandardMaterial({ map: makeBobberTexture(), roughness: 0.4, transparent: true })
    );
    etat.floatBody.castShadow = true;
    etat.floatGroup.add(etat.floatBody);
    etat.floatStick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.012, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xc93030, transparent: true })
    );
    etat.floatStick.position.y = 0.5;
    etat.floatGroup.add(etat.floatStick);

    // Ligne + hameçon sous le bouchon
    const hookLine = new THREE.Mesh(
        // Long bas de ligne : environ 1,3 m sous le bouchon (2 unités ≈ 1 m).
        new THREE.CylinderGeometry(0.0005, 0.0005, 3.0, 4),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true })
    );
    hookLine.position.y = -1.8;    // du bas du bouchon jusqu'à l'hameçon
    etat.floatGroup.add(hookLine);

    const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.016, 0.005, 6, 12, Math.PI * 1.5),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3, transparent: true })
    );
    hook.position.y = -3.25;       // tout au fond du bas de ligne
    hook.rotation.z = Math.PI;
    etat.floatGroup.add(hook);

    function setFloatOpacity(opacity) {
        etat.floatBody.material.opacity = opacity;
        etat.floatStick.material.opacity = opacity;
        hookLine.material.opacity = opacity;
        hook.material.opacity = opacity;
    }
    // Profondeur de la LIGNE : distance entre le bouchon et l'hameçon, en UNITÉS
    // (2 unités ≈ 1 m). Le joueur la règle avec − / + ; elle est bornée par le type
    // de bouchon (une « pose à coulisse » descend bien plus profond).
    etat.profondeurLigne = 2.5;              // 1,25 m par défaut
    etat.HOOK_DEPTH = -etat.profondeurLigne;      // hauteur (y) de l'hameçon

    function bornesProfondeur(f) {
        const b = (f || flotteurCourant()).profondeur;
        return Array.isArray(b) && b.length === 2 ? b : [0.6, 2.6];
    }

    // Met à jour le dessin du bas de ligne et de l'hameçon (plus ou moins loin).
    function appliquerProfondeurVisuelle() {
        const bas = 0.06;   // bas du bouchon (local) — le fil part du corps                                        // bas du bouchon (local)
        const prof = etat.profondeurLigne / etat.FLOTTEUR_ECHELLE;        // en local
        const longueur = Math.max(0.3, prof - bas);
        hookLine.scale.y = longueur / 3.0;                      // géométrie de 3.0
        hookLine.position.y = -(bas + longueur / 2);
        hook.position.y = -prof;
    }

    function majEtiquetteProfondeur() {
        if (!depthLabel) {
            return;
        }
        const bornes = bornesProfondeur();
        depthLabel.textContent = (etat.profondeurLigne / 2).toFixed(1).replace('.', ',') + ' m';
        updateDepthButtons(bornes);
        // La plage du bouchon équipé : c'est ELLE qui fixe la limite de profondeur.
        if (etat.depthRange) {
            const f = flotteurCourant();
            etat.depthRange.textContent = f.nom + ' : ' + nombreMetres(bornes[0]) + ' à '
                + nombreMetres(bornes[1]) + (etat.profondeurLigne >= bornes[1] - 0.01 ? ' (maxi)' : '');
        }
    }

    function updateDepthButtons(bornes, adjustable = true) {
        // Au quiver, la profondeur n'est pas réglable : l'hameçon est posé au fond.
        const fixe = etat.modeQuiver.estActif();
        depthMinus.disabled = fixe || !adjustable || etat.profondeurLigne <= bornes[0] + 0.01;
        depthPlus.disabled = fixe || !adjustable || etat.profondeurLigne >= bornes[1] - 0.01;
    }

    etat.floatState = 'idle'; // 'idle' | 'flying' | 'inWater' | 'bite' | 'struggle' | 'reeling'
    function setProfondeur(valeur) {
        const bornes = bornesProfondeur();
        // Pas fin de 0,25 unité (12,5 cm) pour pouvoir viser la couche exacte, et
        // borné par le bouchon équipé.
        const arrondi = Math.round(valeur * 4) / 4;
        etat.profondeurLigne = Math.min(bornes[1], Math.max(bornes[0], arrondi));
        etat.HOOK_DEPTH = -etat.profondeurLigne;
        appliquerProfondeurVisuelle();
        majEtiquetteProfondeur();
        majCoupeProfondeur();
    }

    return {
        setFloatOpacity, bornesProfondeur, appliquerProfondeurVisuelle, majEtiquetteProfondeur,
        updateDepthButtons, setProfondeur
    };
}

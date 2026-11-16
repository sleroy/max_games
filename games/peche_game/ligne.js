// ---------------------------------------------------------------------------
// ligne.js — LIGNE + FLOTTEUR : textures du bouchon, opacité, bornes et réglage de profondeur. Extrait de script.js (v155).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=220';
import { coucheHamecon } from './esches.js?v=220';

export function creerLigne(deps) {
    const {
        scene, flotteurCourant, depthLabel, nombreMetres, depthMinus, depthPlus,
        coupe, verdictFond
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

    // ---------------------------------------------------------------------------
    // COUPE DE L'EAU : le petit schéma qui montre le bouchon en surface, le fil,
    // l'hameçon à SA profondeur et le fond à l'endroit pêché. `coupe` regroupe ses
    // éléments (cadre, fond, fil, hameçon, zone, indice).
    // Le fond se juge SOUS LE BOUCHON, avec la même fonction que le jeu (verdictFond).
    // Avant l'arrivée du bouchon (repos, vol), le schéma montre le point visé : c'est
    // un simple aperçu, aucune décision n'en dépend.
    // ---------------------------------------------------------------------------
    const COUPE_REF = 9.2;   // hauteur du schéma (≥ fond max 8,8 : étang moyen v173)

    function majCoupeProfondeur() {
        if (!coupe.cadre || !etat.coupePrete) {
            return;
        }
        const apercu = etat.floatState === 'idle' || etat.floatState === 'flying';
        const lieu = apercu ? etat.castTarget : etat.floatGroup.position;
        const verdict = verdictFond(lieu.x, lieu.z, etat.profondeurLigne, etat.modeQuiver.estActif());
        const profLocale = verdict.profondeurEau;
        // Le fond, en % de la hauteur du schéma (jamais collé aux bords).
        const fondPct = Math.min(96, Math.max(8, (profLocale / COUPE_REF) * 100));
        coupe.fond.style.top = fondPct.toFixed(1) + '%';
        coupe.fond.style.height = (100 - fondPct).toFixed(1) + '%';
        // L'hameçon et le fil qui le relie au bouchon.
        const hameconPct = Math.min(100, (etat.profondeurLigne / COUPE_REF) * 100);
        coupe.hamecon.style.top = hameconPct.toFixed(1) + '%';
        coupe.fil.style.height = hameconPct.toFixed(1) + '%';
        // La même couche que celle des esches (esches.js) : ce que montre le schéma est ce qui compte.
        const zone = etat.modeQuiver.estActif() ? 'au fond (quiver)'
            : coucheHamecon(etat.profondeurLigne, etat.profondeurUtile(profLocale), false);   // §15.1 : thermocline = fond des poissons
        coupe.zone.textContent = zone;
        // §15.1 : la thermocline (même valeur que la nage des poissons et que le carnet).
        if (coupe.thermo) {
            const tc = etat.thermocline;
            const visible = !!tc && tc.actif && tc.profondeur < profLocale;
            coupe.thermo.hidden = !visible;
            if (visible) { coupe.thermo.style.top = Math.min(96, (tc.profondeur / COUPE_REF) * 100).toFixed(1) + '%'; }
        }
        // Alerte : l'hameçon touche (ou dépasse) le fond → vase, aucune touche.
        // Accroché dans la vase, la décision du jeu (accrochage) fait foi : le bouchon
        // tremble de quelques centièmes, ce qui ne doit pas faire clignoter l'alerte.
        const accroche = etat.floatState === 'snag' && etat.hameconDansLaVase;
        const dansLaVase = verdict.dansLaVase || accroche
            || (etat.floatState === 'snag' && !!etat.snag && etat.snag.dansLaVase);
        coupe.hamecon.classList.toggle('danger', dansLaVase);
        coupe.indice.classList.toggle('alerte', dansLaVase);
        coupe.indice.textContent = dansLaVase
            ? '⚠ Fond à ' + nombreMetres(profLocale) + ' : hameçon ' + (verdict.dansLaVase ? verdict.dans : (etat.fondPris || 'dans la vase')) + ' !'
            : zone + ' · fond à ' + nombreMetres(profLocale);
        // §14.3 : le TYPE de fond sous le bouchon (sous le point visé avant l'arrivée), pour
        // choisir où lancer. Sa couleur teinte aussi le fond du schéma.
        coupe.fond.style.backgroundColor = verdict.couleur ? verdict.couleur + 'dd' : '';
        if (coupe.substrat) {
            coupe.substrat.textContent = 'Fond : ' + verdict.nom
                + (verdict.surLeFond && !verdict.dansLaVase ? ' · hameçon posé' : '');
            coupe.substrat.setAttribute('data-substrat', verdict.substrat);
            coupe.substrat.style.borderLeftColor = verdict.couleur;
        }
    }

    return {
        setFloatOpacity, bornesProfondeur, appliquerProfondeurVisuelle, majEtiquetteProfondeur,
        updateDepthButtons, setProfondeur, majCoupeProfondeur
    };
}

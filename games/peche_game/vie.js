// ---------------------------------------------------------------------------
// vie.js — VIE AMBIANTE (oiseaux, libellules, poisson qui saute) et bulles sous l'eau. Extrait de script.js (v159).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=257';
import { creerAvion } from './avion.js?v=257';
import { creerConseilLocal } from './conseilLocal.js?v=257';
import { heureDeJeu } from './physique.js?v=257';
import { especesPresentes } from './milieux.js?v=257';
import { creerModeleOiseau, animerOiseau } from './modeleOiseau.js?v=257';
import { creerModeleLibellule, animerLibellule } from './modeleLibellule.js?v=257';

export function creerVie(deps) {
    const {
        scene, POND_CENTER, sound, monde
    } = deps;

    // ---------------------------------------------------------------------------
    // Vie ambiante : oiseaux, libellules et poisson qui saute.
    // ---------------------------------------------------------------------------
    // Oiseaux (modeleOiseau.js) : trois espèces pour un ciel varié — corneille
    // sombre, mouette claire, hirondelle rapide. Chacune a son cercle et son
    // altitude ; le bec suit la trajectoire (le modèle regarde vers +X).
    etat.birds = [];
    const OISEAUX_CIEL = ['corneille', 'mouette', 'hirondelle'];
    for (let i = 0; i < 3; i++) {
        const bird = creerModeleOiseau(OISEAUX_CIEL[i % OISEAUX_CIEL.length]);
        bird.userData.phase = i * 2.1;
        bird.userData.orbite = 1 - i * 0.16;
        bird.userData.hauteur = 22 + i * 3.5;
        bird.rotation.order = 'YXZ';
        scene.add(bird);
        etat.birds.push(bird);
    }

    // Libellules (modeleLibellule.js) : trois robes (bleue, verte, rouge).
    // Chacune a une ancre au-dessus de l'eau (décalage de référence × f) et
    // fait des pointes sèches entre deux vols sur place.
    etat.libellules = [];
    const LIBELLULES_EAU = ['azur', 'verte', 'rouge'];
    const ANCRES_LIB = [[-20, -4], [14, 6], [4, 12]];
    for (let i = 0; i < 3; i++) {
        const lib = creerModeleLibellule(LIBELLULES_EAU[i % LIBELLULES_EAU.length]);
        lib.userData.phase = i * 1.7;
        lib.userData.ox = ANCRES_LIB[i][0];
        lib.userData.oz = ANCRES_LIB[i][1];
        lib.userData.hauteur = 1.05 + i * 0.22;
        lib.userData.minuteur = 1.6 + i * 0.9;
        lib.userData.vol = 0;
        lib.userData.depart = new THREE.Vector3();
        lib.userData.cible = new THREE.Vector3();
        lib.rotation.order = 'YXZ';
        // Posée tout de suite sur son ancre (sinon elle partirait de l'origine).
        lib.position.set(POND_CENTER.x + lib.userData.ox * monde.echelle,
            lib.userData.hauteur, POND_CENTER.z + lib.userData.oz * monde.echelle);
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

    // Un avion traîne une banderole de conseils d'esche (avion.js, d'après la matrice des touches).
    // Seules les espèces du biotope choisi (journal.milieu) sont conseillées : pas de silure dans un étang de forêt.
    const especesIds = function () { return especesPresentes(etat.journal && etat.journal.milieu); };
    const avion = creerAvion({ scene, especesIds, camera: function () { return etat.camera; },
        hauteurEcran: function () { return etat.renderer && etat.renderer.domElement ? etat.renderer.domElement.clientHeight : 800; } });
    etat.avion = avion;
    // Rien ne mord depuis un moment ? L'avion apporte un conseil pour CET endroit (facile : 30 s, normal : 60 s, dur : jamais).
    const conseilLocal = creerConseilLocal({ avion, etat, especesIds,
        fishes: function () { return etat.fishes; }, floatGroup: function () { return etat.floatGroup; },
        contexte: function () { return etat.contexteHamecon(); },
        bornes: function () { return (etat.FLOTTEURS.find(f => f.id === etat.flotteurChoix) || etat.FLOTTEURS[0]).profondeur; },
        temperature: function () { return etat.thermocline ? etat.thermocline.tSurface : 15; },
        heure: function () { return heureDeJeu(etat.dayPhase); } });
    etat.conseilLocal = conseilLocal;

    function updateAmbiante(dt, time) {
        avion.maj(dt);
        conseilLocal.maj(dt);
        // Libellules et poisson qui saute restent au-dessus de l'eau : leurs écarts au centre suivent l'échelle de
        // l'étang f. Les oiseaux tournent plus large au-dessus d'un grand lac (jamais plus serré que la moitié).
        const f = monde.echelle;
        const orbite = Math.max(0.5, f);
        for (let i = 0; i < etat.birds.length; i++) {
            const bird = etat.birds[i];
            const u = bird.userData;
            const p = u.phase;
            const t = time * 0.06 + p;
            const r = u.orbite;
            bird.position.set(
                POND_CENTER.x + Math.cos(t) * 110 * orbite * r,
                u.hauteur + Math.sin(time * 0.3 + p) * 2.2,
                POND_CENTER.z + Math.sin(t) * 80 * orbite * r);
            // Cap du bec (+X) d'après la vitesse, et inclinaison dans le virage.
            const vx = -Math.sin(t) * 110 * r;
            const vz = Math.cos(t) * 80 * r;
            bird.rotation.y = Math.atan2(-vz, vx);
            bird.rotation.x = 0.28;
            animerOiseau(bird, time);
        }
        for (let i = 0; i < etat.libellules.length; i++) {
            const lib = etat.libellules[i];
            const u = lib.userData;
            const p = u.phase;
            // Ancre de référence : suit le centre et la taille de l'étang.
            const ax = POND_CENTER.x + u.ox * f;
            const az = POND_CENTER.z + u.oz * f;
            if (u.vol > 0) {
                // Pointe sèche : interpolation lissée vers la cible.
                u.vol = Math.max(0, u.vol - dt / 0.45);
                const k = 1 - u.vol;
                const lisse = k * k * (3 - 2 * k);
                lib.position.x = u.depart.x + (u.cible.x - u.depart.x) * lisse;
                lib.position.z = u.depart.z + (u.cible.z - u.depart.z) * lisse;
                lib.position.y = u.depart.y + (u.cible.y - u.depart.y) * lisse
                    + Math.sin(Math.PI * k) * 0.20;
                const dx = u.cible.x - u.depart.x;
                const dz = u.cible.z - u.depart.z;
                if (dx * dx + dz * dz > 1e-6) {
                    lib.rotation.y = Math.atan2(-dz, dx);
                }
                if (u.vol === 0) {
                    u.ox = (u.cible.x - POND_CENTER.x) / f;
                    u.oz = (u.cible.z - POND_CENTER.z) / f;
                    u.hauteur = u.cible.y;
                }
            } else {
                u.minuteur -= dt;
                if (u.minuteur <= 0) {
                    u.minuteur = 2.4 + Math.random() * 3.4;
                    u.depart.copy(lib.position);
                    u.cible.set(
                        ax + (Math.random() - 0.5) * 11 * f,
                        0.70 + Math.random() * 0.95,
                        az + (Math.random() - 0.5) * 11 * f);
                    u.vol = 1;
                } else {
                    // Sur place : petits écarts et rappel doux vers l'ancre.
                    const rappel = Math.min(1, dt * 1.2);
                    lib.position.x += Math.sin(time * 0.9 + p) * 0.45 * dt
                        + (ax - lib.position.x) * rappel;
                    lib.position.z += Math.cos(time * 0.7 + p * 1.3) * 0.45 * dt
                        + (az - lib.position.z) * rappel;
                    lib.position.y = u.hauteur + Math.sin(time * 2.3 + p) * 0.16;
                    lib.rotation.y = Math.sin(time * 0.8 + p) * 0.8;
                }
            }
            lib.rotation.x = 0.10 * Math.sin(time * 1.9 + p);   // assiette
            animerLibellule(lib, time);
        }
        if (sautT < 0) {
            sautTimer -= dt;
            if (sautTimer <= 0) {
                sautTimer = 24 - etat.weatherPluie * 8;
                sautT = 0;
                etat.sauteur.position.set(POND_CENTER.x + 8 * f, 0.1, POND_CENTER.z + 22 * f);
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

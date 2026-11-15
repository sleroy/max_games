// ---------------------------------------------------------------------------
// bourriche.js — LE PANIER À POISSONS : maillage, compte, rangement.
// Extrait de script.js (découpage v144).
// ---------------------------------------------------------------------------

import * as THREE from 'three';

export function creerBourriche(deps) {
    const scene = deps.scene;

    // ---------------------------------------------------------------------------
    // Bourriche (panier à poissons) et lancer du poisson
    // ---------------------------------------------------------------------------
    // Après avoir ramené un poisson au bord, il faut le LANCER dans la bourriche,
    // comme l'amorce : on appuie, on maintient (la puissance oscille), on relâche
    // au bon moment. Le vent décale le lancer.
    // La bourriche est un « garde-poisson » posé au bord de l'eau : la gueule
    // dépasse un peu de la surface et le filet pend dans l'eau. y = 0,32 la place
    // juste au-dessus des vagues (la rive, elle, est plus haute : RIVE_Y).
    const BOURRICHE_POS = new THREE.Vector3(-12, 0.32, 13);
    const BOURRICHE_RADIUS = 1.6;      // rayon de la gueule (tolérance d'entrée)
    const FISH_THROW_MIN = 2;          // portée mini du lancer du poisson
    const FISH_THROW_MAX = 14;         // portée maxi
    const FISH_THROW_WIND = 1.6;       // influence du vent sur le lancer
    const FISH_THROW_DURATION = 0.8;   // durée du vol (s)
    const FISH_THROW_OSC = 1.6;        // vitesse d'oscillation de la jauge

    // La bourriche 3D : un anneau (la gueule) et un filet qui pend dans l'eau.
    const bourriche = new THREE.Group();
    const bourricheRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.05, 8, 24),   // gueule de 36 cm de rayon (réelle)
        new THREE.MeshStandardMaterial({ color: 0x9a7b46, roughness: 0.8 })
    );
    bourricheRing.rotation.x = Math.PI / 2;
    bourricheRing.position.y = 0.12;
    bourricheRing.castShadow = true;
    bourriche.add(bourricheRing);
    const bourricheNet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.66, 0.4, 1.3, 16, 1, true),
        new THREE.MeshStandardMaterial({
            // Bourriche = panier d'osier : OPAQUE. Un filet translucide donnait
            // l'impression d'un objet « sous un voile ».
            color: 0x3f5540, roughness: 0.95, side: THREE.DoubleSide
        })
    );
    bourricheNet.position.y = -1.2;
    bourriche.add(bourricheNet);
    // Taille RÉALISTE (environ 1 m de gueule) : sans cette mise à l'échelle, la
    // bourriche est presque aussi haute que le pêcheur et ressemble à un gros seau.
    // La tolérance de jeu (BOURRICHE_RADIUS) reste généreuse : elle ne change pas.
    bourriche.scale.setScalar(0.66);
    bourriche.position.copy(BOURRICHE_POS);
    scene.add(bourriche);


    return {
        BOURRICHE_POS: BOURRICHE_POS,
        BOURRICHE_RADIUS: BOURRICHE_RADIUS,
        FISH_THROW_MIN: FISH_THROW_MIN,
        FISH_THROW_MAX: FISH_THROW_MAX,
        FISH_THROW_WIND: FISH_THROW_WIND,
        FISH_THROW_DURATION: FISH_THROW_DURATION,
        FISH_THROW_OSC: FISH_THROW_OSC,
        bourriche: bourriche,
    };
}

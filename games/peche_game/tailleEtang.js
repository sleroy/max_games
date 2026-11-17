// ---------------------------------------------------------------------------
// tailleEtang.js — LE MONDE SUIT LA TAILLE DE L'ÉTANG : ce qu'il faut refaire quand un biotope change le rayon.
//
// Le rayon et la FORME d'un plan d'eau sont des données du biotope (milieux.js : 12 à 280 unités ; étang, lac,
// canal ou rivière). `environnement.js` (`setRayonMonde`) recalcule la GÉOMÉTRIE pure (contour, centre, fosses,
// surface, profondeur, grille des fonds) ; ce module refait
// ce que le monde 3D en tire, dans cet ordre (appelé par `creerMilieux`) :
//   `surGeometrie`    : maillages de l'eau, de la rive et du fond ; brume, sphère du ciel, plan lointain de la
//                       caméra ; portées du lancer et de l'amorce, pas de la barque. AVANT le décor et les fonds ;
//   `apresGeometrie`  : carte de placement, puis la PARTIE REDÉMARRE et le pêcheur retourne au poste de départ.
//
// CHANGER DE TAILLE REDÉMARRE PROPREMENT LA PARTIE. Le biotope se choisit sur l'écran d'accueil, avant de jouer :
// reconstruire à chaud l'eau, la rive, les obstacles, les postes, la barque et la caméra d'une ligne en l'air
// serait risqué (ligne dans l'eau, poisson ferré, barque au milieu du lac). On ramène donc tout au repos
// (`recommencerPartie`, comme « Jouer ») puis au poste sud : même geste que le joueur, sans état à moitié refait.
//
// Les échelles d'ambiance (brume, ciel, caméra, sol) valent 1 jusqu'à la plaine et f au-delà (jamais en dessous de
// la plaine : un petit étang garde l'horizon de la plaine). f se mesure sur le plus GRAND EXTENT du plan d'eau
// (pour une rivière de 1 200 unités de long, c'est sa longueur et non son rayon nominal). Aucun `rand()`.
//
// Contrat (docs/modules.md) : injection de dépendances ; seule exception, la lecture de la géométrie pure de
// `environnement.js` (le module du monde lui-même).
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=257';
import { monde, POND_CENTER, RIVE_Y, makeWaterGeometry, makeShoreGeometry, makeFondGeometry } from './environnement.js?v=257';
import {
    FORME_DEFAUT, echelleAmbiance, BRUME_REFERENCE, CIEL_REFERENCE, CAMERA_FAR_REFERENCE, RIVE_EXTERIEURE_REFERENCE
} from './dimensions.js?v=257';

// Résolution du maillage d'eau dans la plaine : un pas de ≈ 2,5 unités entre anneaux et ≈ 5 entre rayons.
const EAU_ANNEAUX_REFERENCE = 40;
const EAU_SEGMENTS_REFERENCE = 128;
// Répétitions de la texture d'herbe de la rive dans la plaine (densité conservée aux autres tailles).
const RIVE_REPETITIONS_REFERENCE = 350;
// Décalage du dégradé du ciel dans la plaine (30 × 520 / 300).
const CIEL_DECALAGE_REFERENCE = 52;
const PAS_BATEAU_MARGE_REFERENCE = 2.4;

function borner(v, min, max) { return Math.max(min, Math.min(max, v)); }

/**
 * Résolution du maillage de l'eau : celle de la plaine jusqu'à f = 1, puis ∝ √f (plafonnée) : un lac reste lisse.
 * Un profil allongé (canal, rivière, lac) double le nombre de rayons : ses berges sont longues et ses bouts courbes.
 */
export function resolutionEau(echelle, forme) {
    const k = Math.sqrt(Math.max(1, echelle));
    const allonge = forme !== undefined && forme !== FORME_DEFAUT;
    return {
        anneaux: Math.min(96, Math.ceil(EAU_ANNEAUX_REFERENCE * k)),
        segments: Math.min(allonge ? 384 : 256, Math.ceil(EAU_SEGMENTS_REFERENCE * k * (allonge ? 2 : 1)))
    };
}

export function creerTailleEtang(deps) {
    const { camera, sky, skyMat, water, shore, fond, brume } = deps;
    const memoire = { echelleAmbiance: 1 };

    function remplacer(maillage, geometrie) {
        if (maillage.geometry && maillage.geometry.dispose) { maillage.geometry.dispose(); }
        maillage.geometry = geometrie;
    }

    // Répétitions de la texture d'herbe : proportionnelles au sol (même densité à toutes les tailles). Appelée aussi
    // quand les textures arrivent (chargement asynchrone) : elles ne portent pas encore la bonne échelle.
    function majRive() {
        const k = RIVE_REPETITIONS_REFERENCE * memoire.echelleAmbiance;
        ['map', 'normalMap', 'roughnessMap'].forEach(function (nom) {
            const t = shore.material[nom];
            if (t && t.repeat && t.repeat.set) { t.repeat.set(k, k); }
        });
    }

    // Géométrie pure déjà recalculée (setRayonMonde) : on refait les maillages et l'ambiance.
    function surGeometrie() {
        const e = echelleAmbiance(monde.rayon, monde.forme);
        memoire.echelleAmbiance = e;
        // Eau, fond et rive : mêmes constructeurs qu'à la naissance du monde, sur le NOUVEAU contour.
        const res = resolutionEau(monde.echelle, monde.forme);
        remplacer(water, makeWaterGeometry(res.anneaux, res.segments));
        water.position.set(POND_CENTER.x, 0, POND_CENTER.z);
        remplacer(fond, makeFondGeometry(2, 40, monde.forme === FORME_DEFAUT ? 128 : 256));
        fond.position.set(POND_CENTER.x, 0, POND_CENTER.z);
        remplacer(shore, makeShoreGeometry(RIVE_EXTERIEURE_REFERENCE * e, 128));
        shore.position.set(POND_CENTER.x, RIVE_Y, POND_CENTER.z);
        majRive();
        // Ambiance : la brume, le ciel et le plan lointain grandissent avec le lac (≥ la plaine). Le ciel englobe la
        // brume et la caméra ; le plan lointain voit toute la sphère du ciel (≥ 4 × le plus grand rayon).
        if (brume) { brume.near = BRUME_REFERENCE.proche * e; brume.far = BRUME_REFERENCE.loin * e; }
        remplacer(sky, new THREE.SphereGeometry(CIEL_REFERENCE * e, 32, 16));
        skyMat.uniforms.offset.value = CIEL_DECALAGE_REFERENCE * e;
        camera.far = CAMERA_FAR_REFERENCE * e;
        camera.updateProjectionMatrix();
        // Gestes : portée de l'amorce et du sonar (la canne lit `monde.porteeLancer`), pas de la barque.
        etat.FEED_MAX_RANGE = monde.porteeAmorce;
        etat.BATEAU_PAS_MARGE = PAS_BATEAU_MARGE_REFERENCE * borner(monde.echelle, 0.5, 3);
    }

    // Après décor, obstacles et fonds : carte de placement refaite, partie remise au repos, pêcheur au poste sud.
    function apresGeometrie() {
        deps.reconstruireCarte();
        deps.recommencerPartie();
        deps.placerAuPoste(0);
    }

    return { surGeometrie: surGeometrie, apresGeometrie: apresGeometrie, majRive: majRive };
}

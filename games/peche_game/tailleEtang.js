// ---------------------------------------------------------------------------
// tailleEtang.js — LE MONDE SUIT LA TAILLE DE L'ÉTANG : ce qu'il faut refaire quand un biotope change le rayon.
//
// Le rayon d'un étang est une donnée du biotope (milieux.js : 12 à 280 unités). `environnement.js`
// (`setRayonMonde`) recalcule la GÉOMÉTRIE pure (contour, centre, fosses, surface, profondeur) ; ce module refait
// ce que le monde 3D en tire, dans cet ordre (appelé par `creerMilieux`) :
//   `surGeometrie`    : maillages de l'eau, de la rive et du fond. AVANT le décor et les fonds ;
//   `apresGeometrie`  : carte de placement, puis la PARTIE REDÉMARRE et le pêcheur retourne au poste de départ.
//
// CHANGER DE TAILLE REDÉMARRE PROPREMENT LA PARTIE. Le biotope se choisit sur l'écran d'accueil, avant de jouer :
// reconstruire à chaud l'eau, la rive, les obstacles, les postes, la barque et la caméra d'une ligne en l'air
// serait risqué (ligne dans l'eau, poisson ferré, barque au milieu du lac). On ramène donc tout au repos
// (`recommencerPartie`, comme « Jouer ») puis au poste sud : même geste que le joueur, sans état à moitié refait.
//
// Le sol (rive) suit l'échelle d'ambiance : 1 jusqu'à la plaine et f au-delà. Aucun `rand()`.
//
// Contrat (docs/modules.md) : injection de dépendances ; seule exception, la lecture de la géométrie pure de
// `environnement.js` (le module du monde lui-même).
// ---------------------------------------------------------------------------
import { monde, POND_CENTER, RIVE_Y, makeWaterGeometry, makeShoreGeometry, makeFondGeometry } from './environnement.js?v=238';
import { echelleAmbiance, RIVE_EXTERIEURE_REFERENCE } from './dimensions.js?v=238';

// Résolution du maillage d'eau dans la plaine : un pas de ≈ 2,5 unités entre anneaux et ≈ 5 entre rayons.
const EAU_ANNEAUX_REFERENCE = 40;
const EAU_SEGMENTS_REFERENCE = 128;
// Répétitions de la texture d'herbe de la rive dans la plaine (densité conservée aux autres tailles).
const RIVE_REPETITIONS_REFERENCE = 350;

/** Résolution du maillage de l'eau : celle de la plaine jusqu'à f = 1, puis ∝ √f (plafonnée) : un lac reste lisse. */
export function resolutionEau(echelle) {
    const k = Math.sqrt(Math.max(1, echelle));
    return { anneaux: Math.min(96, Math.ceil(EAU_ANNEAUX_REFERENCE * k)), segments: Math.min(256, Math.ceil(EAU_SEGMENTS_REFERENCE * k)) };
}

export function creerTailleEtang(deps) {
    const { water, shore, fond } = deps;
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
        const e = echelleAmbiance(monde.rayon);
        memoire.echelleAmbiance = e;
        // Eau, fond et rive : mêmes constructeurs qu'à la naissance du monde, sur le NOUVEAU contour.
        const res = resolutionEau(monde.echelle);
        remplacer(water, makeWaterGeometry(res.anneaux, res.segments));
        water.position.set(POND_CENTER.x, 0, POND_CENTER.z);
        remplacer(fond, makeFondGeometry(2, 40, 128));
        fond.position.set(POND_CENTER.x, 0, POND_CENTER.z);
        remplacer(shore, makeShoreGeometry(RIVE_EXTERIEURE_REFERENCE * e, 128));
        shore.position.set(POND_CENTER.x, RIVE_Y, POND_CENTER.z);
        majRive();
    }

    // Après décor, obstacles et fonds : carte de placement refaite, partie remise au repos, pêcheur au poste sud.
    function apresGeometrie() {
        deps.reconstruireCarte();
        deps.recommencerPartie();
        deps.placerAuPoste(0);
    }

    return { surGeometrie: surGeometrie, apresGeometrie: apresGeometrie, majRive: majRive };
}

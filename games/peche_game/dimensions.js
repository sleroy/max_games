// ---------------------------------------------------------------------------
// dimensions.js — DIMENSIONS D'UN ÉTANG : contour, surface, échelle et portées. Fonctions PURES.
//
// Tout ce qui ne dépend que du RAYON NOMINAL de l'étang (en unités, 2 unités ≈ 1 m) vit ici : la forme du
// contour (somme d'harmoniques fixes), sa surface, le facteur d'échelle par rapport à l'étang de référence
// (rayon 90 = la plaine) et les portées de lancer. Aucun `three`, aucun état, aucun `rand()` : `milieux.js`
// (données des biotopes) et `environnement.js` (le monde) lisent la MÊME source, et les tests l'importent
// directement.
//
// La FORME ne change pas avec la taille : mêmes harmoniques, seul le rayon multiplie le contour.
// ---------------------------------------------------------------------------

// Rayon nominal de l'étang de référence (la plaine) : le monde d'origine. ≈ 45 m de rayon.
export const RAYON_REFERENCE = 90;

// Harmoniques du contour (coefficients fixes, donc déterministe). Les basses fréquences donnent une forme
// allongée et lobée, les hautes ajoutent des criques. Amplitude totale : 10,5 % + 6 % + 3,5 % + 2 % = 22 %.
export const HARMONIQUES = [
    { amplitude: 0.105, frequence: 2, phase: 0.6 },
    { amplitude: 0.060, frequence: 3, phase: 2.4 },
    { amplitude: 0.035, frequence: 5, phase: 4.1 },
    { amplitude: 0.020, frequence: 7, phase: 1.3 }
];

export const VARIATION_CONTOUR = HARMONIQUES.reduce(function (total, h) { return total + h.amplitude; }, 0);

/** Rapport de contour dans la direction `angle` (1 = rayon nominal). */
export function facteurContour(angle) {
    let facteur = 1;
    for (let i = 0; i < HARMONIQUES.length; i++) {
        const h = HARMONIQUES[i];
        facteur += h.amplitude * Math.sin(h.frequence * angle + h.phase);
    }
    return facteur;
}

/** Rayon du contour (unités) d'un étang de rayon nominal `rayon`, dans la direction `angle`. */
export function rayonContour(rayon, angle) {
    return rayon * facteurContour(angle);
}

// Surface d'un étang de rayon 1 (aire d'un contour polaire : ∫ r²/2 dθ, par 2 000 tranches). La surface d'un
// étang de rayon R est R² fois ce coefficient : la forme est la même à toutes les tailles.
export const COEFFICIENT_SURFACE = (function () {
    const tranches = 2000;
    let aire = 0;
    for (let i = 0; i < tranches; i++) {
        const f = facteurContour(((i + 0.5) / tranches) * Math.PI * 2);
        aire += (f * f / 2) * (Math.PI * 2 / tranches);
    }
    return aire;
}());

/** Surface de l'eau (unités²) d'un étang de rayon nominal `rayon`. */
export function surfaceUnites(rayon) {
    return rayon * rayon * COEFFICIENT_SURFACE;
}

/** Surface de l'eau en HECTARES (2 unités = 1 m, donc 4 unités² = 1 m²). Seule vérité de la surface. */
export function surfaceHectares(rayon) {
    return surfaceUnites(rayon) / 4 / 10000;
}

/** Facteur d'échelle d'un étang par rapport à la plaine (f = rayon / 90). */
export function echelleDeRayon(rayon) {
    return rayon / RAYON_REFERENCE;
}

function borner(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Lancer de la canne : 52 unités dans la plaine. On ne lance pas 26 m dans un étang de 24 m, et on doit
// atteindre le large d'un lac : la portée suit l'échelle, bornée à [20, 140].
export const PORTEE_LANCER_REFERENCE = 52;
export const PORTEE_LANCER_MIN = 20;
export const PORTEE_LANCER_MAX = 140;

/** Portée maximale du lancer de la canne (unités) dans un étang de rayon nominal `rayon`. */
export function porteeLancer(rayon) {
    return borner(PORTEE_LANCER_REFERENCE * echelleDeRayon(rayon), PORTEE_LANCER_MIN, PORTEE_LANCER_MAX);
}

// Boule d'amorce et bouée du sonar : 46 unités dans la plaine, dans la même proportion que le lancer.
export const PORTEE_AMORCE_REFERENCE = 46;

/** Portée maximale de l'amorce et du sonar (unités) : même rapport que le lancer de la canne. */
export function porteeAmorce(rayon) {
    return PORTEE_AMORCE_REFERENCE * porteeLancer(rayon) / PORTEE_LANCER_REFERENCE;
}

// Brume : 150 → 480 dans la plaine. Elle grandit avec le plus grand étang, jamais en dessous de la plaine.
export const BRUME_REFERENCE = { proche: 150, loin: 480 };
export const CIEL_REFERENCE = 520;     // rayon de la sphère du ciel dans la plaine
export const CAMERA_FAR_REFERENCE = 900;
export const RIVE_EXTERIEURE_REFERENCE = 430;   // rayon extérieur du sol dans la plaine

/** Échelle des éléments d'ambiance (brume, ciel, sol) : 1 dans la plaine et plus petit, f au-delà. */
export function echelleAmbiance(rayon) {
    return Math.max(1, echelleDeRayon(rayon));
}

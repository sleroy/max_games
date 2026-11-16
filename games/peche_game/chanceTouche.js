// ---------------------------------------------------------------------------
// chanceTouche.js — LA CHANCE DE TOUCHE, EN UN SEUL ENDROIT (demande du joueur 2026-11-16).
//
// Toutes les règles qui décident si un poisson peut mordre sont ici, en fonctions PURES (aucun
// état du jeu, aucun `rand()`). Le jeu les appelle (comportement.js, physique.js, esches.js,
// substrats.js) et les tests aussi : une seule formule, impossible que le jeu et les tests divergent.
//
//  1. ATTRACTION   rayonVue (vue de l'espèce × lumière × pluie), rayonRemous (petit coup de moulinet) ;
//  2. COUCHE       dansCouche : l'hameçon est-il dans la tranche d'eau de l'espèce (fond, thermocline) ;
//  3. FOND         hameçon pris (vase, herbier, roche) : plus aucune touche (substrats.hameconSurSubstrat) ;
//  4. ACCEPTATION  efficaciteEsche (esches.js) : espèce × couche × substrat × taille.
//                  En mode FACILE : acceptationFacile (esches.js), 1 ou 0 sans hasard — 100 % si le
//                  plafond de l'esche pour l'espèce (toutes couches d'hameçon) dépasse 60 %
//                  (SEUIL_FACILE), sinon 0 ;
//  5. DÉLAI        facteurDelai (physique.js) : heure × pression × température, borné [0,5 ; 3,5].
//
// `evaluerTouche(contexte)` combine le tout pour UN poisson et UNE situation et dit pourquoi il ne
// mord pas (`raison`). C'est ce qu'exploite la matrice de tests (tests/scenario-matrice-touche.mjs).
// ---------------------------------------------------------------------------
import { COMPORTEMENTS, SPECIES } from './especes.js?v=233';
import { efficaciteEsche, acceptationFacile, coucheHamecon, tropPetitPourEsche } from './esches.js?v=233';
import { lumiere, facteurDelai, thermoclinePour, plancherSous, zoneSous, profondeurUtileSous } from './physique.js?v=233';
import { hameconSurSubstrat } from './substrats.js?v=233';
import { MARGE_VASE } from './environnement.js?v=233';

export const RAYON_VUE_DEFAUT = 7;        // unités : poisson sans fiche de comportement
export const RAYON_VUE_FACILE = 26;       // mode facile : aimant à poissons
export const REMOUS_RAYON = 3;            // unités, à pleine intensité et sensibilité 1
export const MARGE_FOND_NAGE = 0.45;      // un poisson de fond nage à 0,45 unité du relief
export const ECART_LIGNE_QUIVER = 0.55;   // au quiver, l'hameçon est posé juste au-dessus de la vase

export const RAISONS = {
    accroche: 'hameçon pris au fond (vase, herbier ou roche)',
    couche: 'hameçon hors de la couche d’eau de l’espèce',
    esche: 'esche que l’espèce ne mange pas',
    taille: 'poisson trop petit pour cette esche'
};

// 1. Distance à laquelle l'espèce repère l'appât : réduite la nuit (sauf chasseurs nocturnes) et par la pluie.
export function rayonVue(comp, heure, pluie) {
    const base = comp ? comp.vue : RAYON_VUE_DEFAUT;
    const jour = lumiere(heure);
    const facteur = comp && comp.nocturne ? 1 + 0.4 * (1 - jour) : 0.45 + 0.55 * jour;
    return base * facteur * (1 - 0.25 * (pluie || 0));
}

// 1 bis. Les carnassiers en embuscade guettent le moindre remous ; un poisson méfiant y réagit moins.
export function sensibiliteRemous(aggression, humeur) {
    const ardeur = Math.min(1.2, Math.max(0.5, aggression || 0.8));
    return Math.min(1.3, ardeur * (humeur === 'embuscade' ? 1.25 : 1));
}
export function rayonRemous(remous, aggression, humeur) {
    return remous > 0 ? REMOUS_RAYON * remous * sensibiliteRemous(aggression, humeur) : 0;
}

// 2. L'hameçon (hauteur hookY < 0) est-il dans la couche de l'espèce ? Un poisson « de fond » mord si
// l'hameçon est posé près du relief (fondY < 0) ; en été la thermocline relève ce fond.
export function dansCouche(couche, zone, hookY, fondY, thermocline) {
    if (couche === 'fond') {
        const fondReel = fondY + MARGE_FOND_NAGE;
        const fondUtile = plancherSous(fondReel, thermocline);
        const fond = fondUtile - MARGE_FOND_NAGE;
        // Sous la thermocline (eau froide), personne ; sur un vrai fond, un hameçon trop bas repose dessus.
        const haut = (fondUtile > fondReel ? hookY : Math.max(hookY, fond)) - fond;
        return haut <= 1.2 && haut >= -0.4;
    }
    const tranche = zoneSous(zone, thermocline);
    return !tranche || (hookY >= tranche[0] - 0.5 && hookY <= tranche[1] + 0.5);
}

// 3. Hauteur réelle de l'hameçon : sur le sable ou le gravier, un hameçon trop long repose sur le fond.
export function profondeurHamecon(profondeurLigne, profondeurEau, surLeFond, pris) {
    return surLeFond && !pris ? Math.max(-profondeurLigne, -profondeurEau + 0.1) : -profondeurLigne;
}
// Au quiver, la ligne est réglée pour poser l'hameçon juste au-dessus du fond.
export function ligneQuiver(profondeurEau) {
    return Math.max(0.6, profondeurEau - ECART_LIGNE_QUIVER);
}

/**
 * Évalue UN poisson dans UNE situation. Contexte (unités du jeu : 2 unités = 1 m) :
 *   especeId, longueurCm, esche (id ou null = hameçon nu), profondeurLigne, profondeurEau, substrat,
 *   heure (0–24), pression (hPa), tendance (-1…1), temperature (°C, surface ET stratification),
 *   pluie (0–1), mode ('facile' | 'normal' | 'dur'), quiver (booléen).
 * Renvoie { possible, raison, chance, acceptation, couche, hookY, ligne, facteurDelai, rayonVue } :
 *   chance = probabilité qu'un poisson arrivé sur l'hameçon morde (0 si une règle l'interdit).
 */
export function evaluerTouche(c) {
    const espece = SPECIES.find(function (s) { return s.id === c.especeId; });
    if (!espece) { throw new Error('espèce inconnue : ' + c.especeId); }
    const comp = COMPORTEMENTS[espece.id] || null;
    const quiver = !!c.quiver;
    const facile = c.mode === 'facile';
    const temperature = c.temperature === undefined ? 15 : c.temperature;
    const heure = c.heure === undefined ? 12 : c.heure;
    const ligne = quiver ? ligneQuiver(c.profondeurEau) : c.profondeurLigne;
    const th = thermoclinePour(temperature, temperature);
    const fond = hameconSurSubstrat(c.profondeurEau, ligne, quiver, c.substrat, MARGE_VASE);
    const hookY = quiver ? -ligne : profondeurHamecon(ligne, c.profondeurEau, fond.surLeFond, fond.pris);
    const couche = coucheHamecon(ligne, profondeurUtileSous(c.profondeurEau, th), quiver);
    const acceptation = facile ? acceptationFacile(c.esche || null, espece.id, c.longueurCm)
        : efficaciteEsche(c.esche || null, espece.id, couche, c.substrat, c.longueurCm);
    let raison = null;
    if (fond.pris) {
        raison = 'accroche';
    } else if (!facile && !dansCouche(comp ? comp.couche : 'mi-eau', espece.profondeur, hookY, -c.profondeurEau, th)) {
        raison = 'couche';
    } else if (acceptation <= 0) {
        raison = tropPetitPourEsche(c.esche, c.longueurCm) ? 'taille' : 'esche';
    }
    return {
        possible: !raison, raison: raison, chance: raison ? 0 : acceptation, acceptation: acceptation,
        couche: couche, hookY: hookY, ligne: ligne,
        facteurDelai: facteurDelai(heure, c.pression === undefined ? 1013 : c.pression, c.tendance || 0, temperature, comp),
        rayonVue: facile ? RAYON_VUE_FACILE : rayonVue(comp, heure, c.pluie)
    };
}

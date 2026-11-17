// ---------------------------------------------------------------------------
// culling.js — QUELS POISSONS SIMULER (niveau de détail de la POPULATION).
//
// Un grand plan d'eau porte beaucoup de poissons (950 dans la rivière). Les
// simuler tous à chaque image coûte cher pour rien : un poisson qui ne peut pas
// atteindre l'hameçon ne changera jamais la partie.
//
// RÈGLE (une seule, ici) : un poisson est SIMULÉ si
//   1) le pêcheur peut poser l'esche dans son domaine vital — distance au pêcheur
//      ≤ portée du lancer + marge de son domaine ; ou
//   2) le bouchon est DÉJÀ dans son domaine (lancer long, dérive, barque).
// Sinon il est GELÉ : ni nage, ni bulles, ni sillage (comportement.js).
//
// Pourquoi c'est sûr : un poisson ne quitte jamais son domaine (nageNaturelle)
// et ne s'intéresse au bouchon que s'il entre dans ce domaine (baitDansDomaine).
// Hors de ces deux cercles, il ne peut donc ni voir l'esche ni la mordre.
//
// Coût : deux distances au carré par poisson et par image (~20 µs à 950).
// Fonctions pures vis-à-vis du monde : elles lisent `angler`, `floatGroup` et
// `monde`, et ne modifient rien. Testable sans navigateur (tests/scenario-culling.mjs).
// ---------------------------------------------------------------------------

const PORTEE_LANCER_DEFAUT = 52;   // portée de référence de la plaine (dimensions.js)

export function creerCulling(deps) {
    const angler = deps.angler;
    const floatGroup = deps.floatGroup;
    const monde = deps.monde;

    // Marge de baitDansDomaine (comportement.js) : le poisson mord un peu hors de son domaine.
    function margeDomaine(data) {
        return (Number.isFinite(data.homeRadius) ? data.homeRadius : 0) * 1.25 + 4;
    }

    function porteeLancer() {
        return monde && Number.isFinite(monde.porteeLancer) ? monde.porteeLancer : PORTEE_LANCER_DEFAUT;
    }

    function poissonAAttendre(data) {
        // Poisson sans domaine connu (créé hors du peuplement) : on le simule.
        if (!Number.isFinite(data.homeX) || !Number.isFinite(data.homeZ)) { return true; }
        const marge = margeDomaine(data);
        // 1) Le pêcheur peut-il poser l'esche dans son domaine ?
        const dxA = data.homeX - angler.position.x;
        const dzA = data.homeZ - angler.position.z;
        const rA = porteeLancer() + marge;
        if (dxA * dxA + dzA * dzA <= rA * rA) { return true; }
        // 2) Le bouchon est-il déjà dans son domaine ?
        const dxB = data.homeX - floatGroup.position.x;
        const dzB = data.homeZ - floatGroup.position.z;
        return dxB * dxB + dzB * dzB <= marge * marge;
    }

    return { poissonAAttendre: poissonAAttendre, margeDomaine: margeDomaine };
}

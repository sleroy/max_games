// ---------------------------------------------------------------------------
// etat.js — ÉTAT PARTAGÉ DU JEU (source de vérité unique).
//
// Pourquoi ce fichier : les modules extraits de script.js doivent MODIFIER
// l'état du jeu (tension du fil, état du bouchon, réglages…). Un module qui
// recevrait ces valeurs « par valeur » n'aurait qu'une copie morte.
//
// Solution retenue : `etat` est un objet vide que script.js remplit avec des
// ACCESSORS (`Object.defineProperties`) vers ses propres variables `let`. Les
// modules écrivent donc `etat.tension = 12` et modifient la vraie variable,
// sans qu'aucune ligne existante de script.js n'ait à être renommée.
//
// Contrat (docs/modules.md) : c'est le SEUL objet partagé autorisé.
// ---------------------------------------------------------------------------
export const etat = {};

// Le moulinet est-il LIBRE pour un autre geste (amorce, sonar) ? Oui au repos, ligne
// posée à l'eau, ou ligne qu'on ramène SANS poisson ferré (on s'arrête souvent de
// mouliner pour pêcher sur place : l'amorce doit rester possible).
export function moulinetLibre() {
    return etat.floatState === 'idle' || etat.floatState === 'inWater'
        || (etat.floatState === 'reeling' && !etat.hookedFish);
}

// ---------------------------------------------------------------------------
// CULLING (culling.js) : ne simuler que les poissons à portée du pêcheur.
// Vrai en jeu (c'est ce qui rend les grands plans d'eau peuplés tenables).
// Les tests de COMPORTEMENT le désactivent pour observer un poisson isolé hors
// de portée (harnais) ; tests/scenario-densite.mjs le rallume et le vérifie.
// ---------------------------------------------------------------------------
etat.cullingActif = true;

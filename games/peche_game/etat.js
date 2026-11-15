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

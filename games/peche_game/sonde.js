// ---------------------------------------------------------------------------
// sonde.js — SONDE (matériel de la boutique) : une petite étiquette, fine et discrète,
// posée À CÔTÉ DU BOUCHON (ou du point d'impact au quiver) qui donne la PROFONDEUR de
// l'eau et le TYPE DE FOND à cet endroit.
//
// Quand on ramène la ligne, le bouchon se déplace : l'étiquette change, et l'on apprend
// peu à peu le relief de l'étang (fosses, bords, herbiers…).
//
//  - achat unique (SONDE_PRIX XP), puis « Équiper » / « Retirer » dans la boutique ;
//  - visible seulement quand la ligne est à l'eau ;
//  - texte mis à jour ~8 fois par seconde, position suivie à chaque image (une transformation CSS).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=254';

export const SONDE_PRIX = 120;
const PERIODE_TEXTE = 0.12;   // s entre deux lectures du fond
// États où la ligne est dans l'eau : la sonde mesure sous le bouchon.
const ETATS_A_L_EAU = ['inWater', 'reeling', 'bite', 'snag', 'struggle'];

export function creerSonde(deps) {
    const { camera, canvas, floatGroup, verdictFond, element, nombreMetres, saveJournal, renderJournal } = deps;
    const projete = floatGroup.position.clone();   // vecteur de travail (sans importer three : module testable)
    let attente = 0;
    let dernierTexte = '';
    let visible = false;
    let derniereLecture = null;

    function possedee() { return !!(etat.journal && etat.journal.sonde); }
    function equipee() { return possedee() && etat.journal.sondeEquipee !== false; }

    function afficher(oui) {
        if (visible === oui || !element) { return; }
        visible = oui;
        element.hidden = !oui;
    }

    function lire() {
        const p = floatGroup.position;
        const v = verdictFond(p.x, p.z, etat.profondeurLigne, etat.modeQuiver && etat.modeQuiver.estActif());
        derniereLecture = { profondeur: v.profondeurEau, substrat: v.substrat, nom: v.nom };
        return nombreMetres(v.profondeurEau) + ' · ' + v.nom;
    }

    // Une image : position à chaque fois, texte au plus ~8 fois par seconde.
    function maj(dt) {
        const active = equipee() && ETATS_A_L_EAU.indexOf(etat.floatState) >= 0;
        if (!active) { afficher(false); return; }
        attente -= dt || 0;
        if (attente <= 0 || !visible) {
            attente = PERIODE_TEXTE;
            const texte = lire();
            if (texte !== dernierTexte && element) {
                element.textContent = texte;
                dernierTexte = texte;
            }
        }
        // Projection du bouchon à l'écran : l'étiquette se tient juste à droite.
        projete.copy(floatGroup.position).project(camera);
        if (projete.z > 1) { afficher(false); return; }   // derrière la caméra
        const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
        const w = rect && rect.width ? rect.width : (typeof innerWidth === 'number' ? innerWidth : 800);
        const h = rect && rect.height ? rect.height : (typeof innerHeight === 'number' ? innerHeight : 600);
        const x = (projete.x * 0.5 + 0.5) * w + (rect ? rect.left || 0 : 0) + 14;
        const y = (-projete.y * 0.5 + 0.5) * h + (rect ? rect.top || 0 : 0) - 8;
        if (element && element.style) {
            element.style.transform = 'translate(' + x.toFixed(0) + 'px, ' + y.toFixed(0) + 'px)';
        }
        afficher(true);
    }

    function acheter() {
        const journal = etat.journal;
        if (!journal || journal.sonde || journal.experience < SONDE_PRIX) { return false; }
        journal.experience -= SONDE_PRIX;
        journal.sonde = true;
        journal.sondeEquipee = true;
        if (saveJournal) { saveJournal(); }
        if (renderJournal) { renderJournal(); }
        return true;
    }

    // Équiper / retirer (sans rien payer). Renvoie le nouvel état.
    function basculer() {
        if (!possedee()) { return false; }
        etat.journal.sondeEquipee = !equipee();
        if (saveJournal) { saveJournal(); }
        if (renderJournal) { renderJournal(); }
        if (!etat.journal.sondeEquipee) { afficher(false); }
        return etat.journal.sondeEquipee;
    }

    if (element) { element.hidden = true; }
    return {
        maj, acheter, basculer, possedee, equipee,
        // Lecture seule (tests) : dernière mesure et visibilité.
        lecture: function () { return derniereLecture; },
        estVisible: function () { return visible; }
    };
}

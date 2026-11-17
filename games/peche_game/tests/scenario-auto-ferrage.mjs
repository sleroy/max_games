// ---------------------------------------------------------------------------
// Scénario : demandes du joueur 2026-11-17.
//  - le bouton « Esche » du haut montre l'icône de l'esche équipée (🪝 pour l'hameçon nu) ;
//  - AUTO-FERRAGE : à la vraie touche, une part des poissons se pique seule (combat direct) ;
//  - la touche arrive plus vite (pauses de 1,5–4 s puis 1–3,5 s, au lieu de 3–8 s puis 2–8 s).
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, state, stepUntil, resetToIdle, clearLilyPads, castTo, forceBite } from './harness.mjs';

export function run() {
    group('Bouton esche, auto-ferrage, touche plus rapide');
    resetToIdle();
    clearLilyPads();
    G().setDifficulty('normal');
    const e = G().etat;

    // --- Icône du bouton Esche ---
    const bouton = el('escheTopButton');
    e.equiperEsche('mais');
    checkEqual('maïs équipé : le bouton montre 🌽', bouton.textContent, '🌽');
    e.equiperEsche('pain');
    checkEqual('pain équipé : le bouton montre 🍞', bouton.textContent, '🍞');
    e.equiperEsche(null);
    checkEqual('hameçon nu : le bouton montre 🪝', bouton.textContent, '🪝');
    e.equiperEsche('ver');
    checkEqual('ver équipé : le bouton montre 🪱', bouton.textContent, '🪱');

    // --- Auto-ferrage : probabilité 1 = le poisson se pique seul à la vraie touche ---
    const ancienne = e.probaAutoFerrage;
    e.probaAutoFerrage = 1;
    e.autoFerrages = 0;
    castTo(0, -25);
    forceBite();
    check('la touche commence (approche)', state() === 'bite', state());
    // Pauses raccourcies : 2 ou 3 fausses touches + la vraie arrivent en moins de 20 s (facteur ×1).
    check('il se ferre tout seul, sans clic, en moins de 20 s', stepUntil(() => state() === 'struggle', 20), state());
    checkEqual('un auto-ferrage compté', e.autoFerrages, 1);
    checkEqual('qualité du ferrage : « seul »', G().getStrikeQuality(), 'seul');
    resetToIdle();

    // --- Probabilité 0 : sans clic, le poisson recrache ---
    e.probaAutoFerrage = 0;
    castTo(0, -25);
    forceBite();
    check('sans auto-ferrage, il ne se ferre pas seul', !stepUntil(() => state() === 'struggle', 20), state());
    checkEqual('aucun auto-ferrage de plus', e.autoFerrages, 1);
    e.probaAutoFerrage = ancienne;
    resetToIdle();
}

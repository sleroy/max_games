// ---------------------------------------------------------------------------
// Scénario : cheat « radar » (idées.md §17.3) — carte 2D superposée des poissons.
//
//  - présence : le mot secret affiche / masque le panneau, Échap le ferme ;
//  - un point par poisson, couleur stable par espèce, rayon ∝ longueur ;
//  - le pêcheur est à la bonne échelle ; bouchon et barque ;
//  - fermé, le radar ne touche JAMAIS au DOM.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { group, check, checkEqual, G, el, GAME_DIR, resetToIdle, stepFor } from './harness.mjs';

function taper(mot) {
    mot.split('').forEach(function (lettre) {
        globalThis.fireWindowEvent('keydown', { key: lettre });
    });
}

export function run() {
    group('73) Cheat « radar » : présence du panneau, ouverture et fermeture');
    resetToIdle();
    const radar = G().radar;
    const panneau = el('radarPanel');

    // --- Le conteneur existe dans index.html ---------------------------------
    const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    check('index.html contient le panneau du radar (masqué au départ)',
        /<div class="radar-panel" id="radarPanel" hidden>/.test(html));
    check('le panneau contient un SVG avec un calque de fond et un calque vivant',
        html.includes('id="radarFond"') && html.includes('id="radarVivant"'));

    // --- Fermé au départ -----------------------------------------------------
    checkEqual('le radar est fermé au départ', radar.estActif(), false);

    // --- Mot incomplet : rien ------------------------------------------------
    taper('rada');
    checkEqual('un mot incomplet n’ouvre pas le radar', radar.estActif(), false);

    // --- « radar » l'ouvre, et affiche le panneau ----------------------------
    globalThis.fireWindowEvent('keydown', { key: 'r' });
    checkEqual('« radar » ouvre le radar', radar.estActif(), true);
    checkEqual('le panneau est affiché (hidden = false)', panneau.hidden, false);

    // --- Re-taper « radar » le ferme -----------------------------------------
    taper('radar');
    checkEqual('re-taper « radar » ferme le radar', radar.estActif(), false);
    checkEqual('le panneau est masqué (hidden = true)', panneau.hidden, true);

    // --- Échap le ferme aussi ------------------------------------------------
    taper('radar');
    checkEqual('« radar » rouvre le radar', radar.estActif(), true);
    globalThis.fireWindowEvent('keydown', { key: 'Escape' });
    checkEqual('Échap ferme le radar', radar.estActif(), false);
    checkEqual('Échap masque le panneau', panneau.hidden, true);
    globalThis.fireWindowEvent('keydown', { key: 'Escape' });
    checkEqual('Échap sans radar ne le rouvre pas', radar.estActif(), false);

    // --- Les autres cheats ne sont pas perturbés -----------------------------
    G().setExperience(0);
    taper('poisson');
    checkEqual('« poisson » marche toujours (+50 XP)', G().getExperience(), 50);
    checkEqual('« poisson » n’ouvre pas le radar', radar.estActif(), false);
    G().setExperience(0);
    stepFor(0.2);
}

export default run;

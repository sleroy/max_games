// ---------------------------------------------------------------------------
// Scénario : radar à poissons ACHETÉ en boutique (et grille de densité).
//
//  - verrouillé sous RADAR_PRIX XP, achat unique, bouton « Radar » dans le menu ;
//  - le bouton ouvre / ferme la carte (même radar que le cheat) ;
//  - la densité compte bien tous les poissons (grille + poissons/ha + kg/ha) ;
//  - le fin de partie ne propose plus que trois boutons.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { group, check, checkEqual, checkClose, G, el, fire, GAME_DIR, resetToIdle, step } from './harness.mjs';
import { RADAR_PRIX } from '../radar.js';

export function run() {
    group('Radar à poissons : achat en boutique et densité');
    resetToIdle();
    G().reinitialiserRadar();
    const radar = G().radar;
    const acheter = () => fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'radar' } } });

    checkEqual('le bouton Radar est caché avant l’achat', el('radarButton').hidden, true);
    G().setExperience(RADAR_PRIX - 1);
    acheter();
    checkEqual('sous ' + RADAR_PRIX + ' XP, le radar reste verrouillé', G().getJournal().radar, false);
    checkEqual('un achat refusé ne coûte rien', G().getExperience(), RADAR_PRIX - 1);

    G().setExperience(RADAR_PRIX + 40);
    acheter();
    checkEqual('le radar coûte ' + RADAR_PRIX + ' XP', G().getExperience(), 40);
    checkEqual('le radar acheté est noté dans le carnet', G().getJournal().radar, true);
    checkEqual('le bouton Radar apparaît dans le menu', el('radarButton').hidden, false);
    acheter();
    checkEqual('le radar ne se rachète pas', G().getExperience(), 40);

    // --- Le bouton ouvre et ferme la carte --------------------------------------
    fire('radarButton', 'click');
    checkEqual('le bouton ouvre le radar', radar.estActif(), true);
    checkEqual('le panneau est affiché', el('radarPanel').hidden, false);
    checkEqual('le bouton est marqué « enfoncé »', el('radarButton').getAttribute('aria-pressed'), 'true');

    // --- Densité ----------------------------------------------------------------
    const d = radar.densite();
    const fishes = G().fishes;
    checkEqual('la densité compte tous les poissons', d.total, fishes.length);
    const dansGrille = d.grille.reduce((a, n) => a + n, 0);
    check('la grille place (presque) chaque poisson dans une case', dansGrille >= fishes.length * 0.95,
        dansGrille + ' / ' + fishes.length);
    check('la case la plus pleine est cohérente', d.max >= 1 && d.max <= dansGrille, String(d.max));
    checkClose('poissons/ha = total / surface', d.parHa, fishes.length / d.surfaceHa, 1e-9);
    const kg = fishes.reduce((t, f) => t + (f.userData.weight || 0), 0);
    checkClose('kg/ha = biomasse / surface', d.kgParHa, kg / d.surfaceHa, 1e-9);
    check('la ligne d’infos annonce le nombre de poissons',
        el('radarInfo').textContent.indexOf(String(fishes.length)) >= 0, el('radarInfo').textContent);
    for (let i = 0; i < 12; i++) { step(1 / 60); }
    check('le radar ouvert se rafraîchit', radar.misesAJour() > 1);

    fire('radarButton', 'click');
    checkEqual('re-cliquer ferme le radar', radar.estActif(), false);
    checkEqual('le panneau est masqué', el('radarPanel').hidden, true);

    // --- Fin de partie : trois boutons seulement --------------------------------
    group('Fin de partie : panneau allégé');
    const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    const panneau = html.slice(html.indexOf('id="gameOver"'), html.indexOf('id="classement"'));
    const boutons = (panneau.match(/<button\b/g) || []).length;
    checkEqual('le panneau de fin a 3 boutons', boutons, 3);
    check('il garde Enregistrer, Rejouer et Accueil',
        ['saveAndMenu', 'restartGame', 'backToMenu'].every(id => panneau.includes('id="' + id + '"')));

    G().reinitialiserRadar();
    G().setExperience(0);
}

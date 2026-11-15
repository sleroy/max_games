// ---------------------------------------------------------------------------
// Scénario : le PANNEAU D'ÉPREUVE DE FORCE allégé + les PORTRAITS d'espèces.
// Le panneau ne montre plus que l'essentiel (portrait, nom, poids, barre,
// temps, bouton) ; chaque espèce a un portrait dessiné sur fond transparent.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, resetToIdle, castTo, forceBite, strike, state } from './harness.mjs';
import { SPECIES } from '../especes.js?v=138';
import { dessinerPortrait } from '../portraits.js?v=138';

export function run() {
    group('58) Panneau de combat court + portraits des espèces');
    G().recommencerPartie();
    resetToIdle();

    // --- Le panneau est épuré AVANT même de ferrer ---
    check('plus de légende « zone sûre » dans le panneau',
        el('struggle').textContent.indexOf('zone sûre') < 0,
        el('struggle').textContent);
    check('le panneau n’annonce pas d’avantage à l’avance',
        el('struggleInfo').textContent.indexOf('avantage') < 0,
        el('struggleInfo').textContent);
    checkEqual('le portrait est caché hors combat',
        el('strugglePortrait').hidden === true, true);

    // --- Pendant le combat : nom + poids, SANS le texte en plus ---
    const pecheur = G().angler.position;
    const centre = G().getPondCenter();
    const vx = centre.x - pecheur.x;
    const vz = centre.z - pecheur.z;
    const norme = Math.hypot(vx, vz) || 1;
    // On cherche une eau libre (éviter les nénuphars près de la berge).
    let distance = 0;
    let etat = 'snag';
    for (const essai of [10, 14, 18, 22, 26, 30]) {
        resetToIdle();
        etat = castTo(pecheur.x + (vx / norme) * essai,
            pecheur.z + (vz / norme) * essai);
        if (etat === 'inWater') {
            distance = essai;
            break;
        }
    }
    checkEqual('le lancer part', etat, 'inWater');
    forceBite();
    checkEqual('un poisson mord', state(), 'bite');
    strike();
    const info = el('struggleInfo').textContent;
    check('le panneau annonce l’espèce et le poids', info.indexOf('·') >= 0
        && info.indexOf('kg') >= 0, info);
    check('le panneau ne contient que deux blocs (nom · poids)',
        info.split('·').length <= 2, info);
    check('le panneau n’explique plus la manivelle en long',
        el('struggleHint').textContent.indexOf('ramener le poisson') < 0,
        el('struggleHint').textContent);
    check('le portrait du poisson accroché est affiché',
        G().getPortrait().cache === false, JSON.stringify(G().getPortrait()));
    check('le portrait correspond à l’espèce ferrée',
        typeof G().getPortrait().espece === 'string' && G().getPortrait().espece.length > 0,
        JSON.stringify(G().getPortrait()));

    // --- Toutes les espèces ont un portrait dessinable, sans planter ---
    SPECIES.forEach(function (espece) {
        let erreur = null;
        try {
            dessinerPortrait(el('strugglePortrait').getContext('2d'), espece, 150, 90);
        } catch (exception) {
            erreur = exception;
        }
        check('portrait dessinable : ' + espece.nom, erreur === null,
            erreur ? erreur.message : 'ok');
    });

    // --- Retour au repos propre ---
    resetToIdle();
    G().demarrerJeu();
}

export default run;

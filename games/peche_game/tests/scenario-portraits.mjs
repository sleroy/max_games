// ---------------------------------------------------------------------------
// Scénario : le PANNEAU D'ÉPREUVE DE FORCE allégé + les PORTRAITS d'espèces.
// Le panneau ne montre plus que l'essentiel (portrait, nom, poids, barre,
// temps, bouton) ; chaque espèce a un portrait dessiné sur fond transparent.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { group, check, checkEqual, G, el, resetToIdle, castTo, forceBite, strike, state, GAME_DIR } from './harness.mjs';
import { SPECIES } from '../especes.js?v=138';
import { dessinerPortrait } from '../portraits.js?v=138';

// Faux contexte 2D qui note les appels (le faux DOM en crée un neuf à chaque getContext).
function contexteEspion() {
    const appels = [];
    const ctx = new Proxy({}, {
        get(cible, nom) {
            if (nom === 'appels') { return appels; }
            if (nom in cible) { return cible[nom]; }
            if (nom === 'measureText') { return () => ({ width: 0 }); }
            if (nom === 'createRadialGradient' || nom === 'createLinearGradient') {
                return () => ({ addColorStop() {} });
            }
            return (...args) => { appels.push(String(nom)); return args; };
        },
        set(cible, nom, valeur) { cible[nom] = valeur; return true; }
    });
    return ctx;
}

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
    // Espion sur le canvas 2D du portrait : sans WebGL, le repli 2D doit le dessiner.
    const canvasPortrait = el('strugglePortrait');
    const getContextInitial = canvasPortrait.getContext;
    const espion = contexteEspion();
    canvasPortrait.getContext = () => espion;
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

    // --- Repli : sans WebGL (ici : faux DOM), le portrait 2D a été dessiné ---
    canvasPortrait.getContext = getContextInitial;
    check('repli 2D : le portrait est dessiné quand rendre() renvoie null',
        espion.appels.includes('fill') || espion.appels.includes('fillRect')
            || espion.appels.includes('stroke'), espion.appels.slice(0, 8).join(','));
    check('repli 2D : le portrait reste affiché et associé à l’espèce',
        canvasPortrait.hidden === false && typeof G().getPortrait().espece === 'string',
        JSON.stringify(G().getPortrait()));
    check('index.html : canvas interne = 2× la taille CSS (300×180, netteté)',
        /<canvas id="strugglePortrait" width="300" height="180"/.test(
            fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8')));

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

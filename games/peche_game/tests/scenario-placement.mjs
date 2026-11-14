// ---------------------------------------------------------------------------
// Scénario 56 : CHOIX LIBRE DE L'EMPLACEMENT sur la carte vue de dessus.
// Le joueur voit l'étang de dessus et clique dans la couronne autour de l'eau
// (1,4 à 6 unités de la berge) pour choisir son angle ET sa distance.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, resetToIdle, castTo, forceBite, strike, step, crankTurns, state
} from './harness.mjs';

function distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Coordonnées client pour viser (angle, distance) sur la carte 240×240. */
function clientCarte(angle, distance) {
    const carte = G().getPlacementMap();
    return {
        clientX: carte.centre.x + Math.cos(angle) * distance * carte.echelle,
        clientY: carte.centre.y + Math.sin(angle) * distance * carte.echelle,
        pointerId: 1
    };
}

function cliquerCarte(angle, distance) {
    const point = clientCarte(angle, distance);
    fire('cartePlacement', 'pointerdown', point);
    fire('cartePlacement', 'pointerup', { pointerId: 1 });
}

function ecartAuBord() {
    const centre = G().getPondCenter();
    const p = G().angler.position;
    const dx = p.x - centre.x;
    const dz = p.z - centre.z;
    const angle = Math.atan2(dz, dx);
    return Math.hypot(dx, dz) - G().getRayonEtang(angle);
}

export function run() {
    group('56) Choix libre de l’emplacement sur la carte vue de dessus');
    G().recommencerPartie();
    resetToIdle();
    G().afficherAccueil();

    const carte = G().getPlacementMap();
    checkEqual('la carte de placement est un carré de 240', carte.view, 240);
    checkClose('l’échelle de la carte est cohérente', carte.echelle, 120 / 78, 1e-6);
    checkEqual('la bande commence à 1,4 unité de la berge', carte.margeMin, 1.4);
    checkEqual('la bande s’arrête à 6 unités de la berge', carte.margeMax, 6);

    const html = el('cartePlacement').innerHTML;
    check('la carte affiche le contour généré de l’étang',
        html.indexOf('contour-etang') >= 0);
    check('la carte affiche la couronne de placement',
        html.indexOf('zone-placement') >= 0);
    check('la carte affiche le repère du pêcheur',
        html.indexOf('emplacement-marker') >= 0);
    check('la carte indique le nord', html.indexOf('N ▲') >= 0);
    check('la carte indique le soleil au sud-ouest', html.indexOf('☀️') >= 0);
    check('la carte explique comment choisir sa place',
        html.indexOf('bande claire') >= 0);

    // --- Au départ : poste sud, marge par défaut, marqueur présent ---
    const initial = G().getEmplacement();
    checkEqual('au départ, le poste est le raccourci sud', G().getPoste().id, 'sud');
    checkClose('au départ, on est à 2,2 unités de la berge', initial.marge, 2.2, 0.01);
    check('le repère est dans la bande', initial.marge >= 1.4 && initial.marge <= 6,
        initial.marge.toFixed(2));

    // --- Clic libre : angle et distance choisis ---
    const angleLibre = 0.2;
    const margeLibre = 3.4;
    cliquerCarte(angleLibre, G().getRayonEtang(angleLibre) + margeLibre);
    const libre = G().getEmplacement();
    checkClose('le clic choisit l’angle', libre.angle, angleLibre, 1e-6);
    checkClose('le clic choisit la distance à la berge', libre.marge, margeLibre, 0.02);
    checkEqual('le poste devient « libre »', G().getPoste().id, 'libre');
    checkEqual('le poste libre n’est pas un raccourci', G().getPoste().libre, true);
    checkEqual('la direction est nommée (est)', libre.direction, 'est');
    check('la boussole affiche la direction libre',
        el('compass').textContent.indexOf('poste est') >= 0, el('compass').textContent);
    checkClose('le pêcheur est à la distance choisie de la berge',
        ecartAuBord(), margeLibre, 0.02);
    check('la carte affiche la nouvelle distance',
        el('cartePlacement').innerHTML.indexOf('3,4') >= 0);

    // --- Cliquer DANS l'eau : on est repoussé sur la berge (marge mini) ---
    cliquerCarte(angleLibre, G().getRayonEtang(angleLibre) * 0.4);
    checkClose('un clic dans l’eau est ramené à la marge mini',
        G().getEmplacement().marge, 1.4, 0.01);
    check('le pêcheur reste hors de l’eau',
        ecartAuBord() >= 1.39, ecartAuBord().toFixed(2) + ' unités');

    // --- Cliquer LOIN : on est ramené à la marge maxi ---
    cliquerCarte(angleLibre, 77);
    checkClose('un clic trop loin est ramené à la marge maxi',
        G().getEmplacement().marge, 6, 0.01);

    // --- Glisser le long de la couronne ---
    fire('cartePlacement', 'pointerdown', clientCarte(0.2, G().getRayonEtang(0.2) + 2.5));
    fire('cartePlacement', 'pointermove', clientCarte(0.8, G().getRayonEtang(0.8) + 4));
    fire('cartePlacement', 'pointerup', { pointerId: 1 });
    const glisse = G().getEmplacement();
    checkClose('le glisser change l’angle', glisse.angle, 0.8, 0.01);
    checkClose('le glisser change la distance', glisse.marge, 4, 0.05);

    // --- Les raccourcis restent disponibles ---
    fire('posteNord', 'click');
    checkEqual('le raccourci Nord replace au nord', G().getPoste().id, 'nord');
    checkEqual('le raccourci n’est pas « libre »', G().getPoste().libre, false);
    checkEqual('le bouton Nord est actif', el('posteNord').classList.contains('actif'), true);
    checkEqual('le bouton Sud n’est pas actif', el('posteSud').classList.contains('actif'), false);

    // --- Pas de téléportation avec la ligne à l'eau ---
    resetToIdle();
    const centre = G().getPondCenter();
    const pecheur = G().angler.position;
    const ux = centre.x - pecheur.x;
    const uz = centre.z - pecheur.z;
    const norme = Math.hypot(ux, uz);
    const cible = {
        x: pecheur.x + (ux / norme) * 26,
        z: pecheur.z + (uz / norme) * 26
    };
    checkEqual('la ligne part depuis le nord', castTo(cible.x, cible.z), 'inWater');
    checkEqual('on ne peut pas changer de place avec la ligne à l’eau',
        G().choisirEmplacement(1.0, 2.5), false);
    checkEqual('l’emplacement n’a pas changé', G().getPoste().id, 'nord');
    resetToIdle();

    // --- PÊCHE COMPLÈTE depuis un emplacement LIBRE (nord-ouest) ---
    G().choisirEmplacement(-2.0, 3.0);
    checkEqual('l’emplacement libre est bien pris', G().getPoste().id, 'libre');
    checkClose('la marge libre est respectée', ecartAuBord(), 3, 0.02);
    const librePecheur = G().angler.position;
    const dx = centre.x - librePecheur.x;
    const dz = centre.z - librePecheur.z;
    const d = Math.hypot(dx, dz);
    const cibleLibre = {
        x: librePecheur.x + (dx / d) * 26,
        z: librePecheur.z + (dz / d) * 26
    };
    checkEqual('le lancer part depuis l’emplacement libre',
        castTo(cibleLibre.x, cibleLibre.z), 'inWater');
    forceBite();
    checkEqual('un poisson mord à l’emplacement libre', state(), 'bite');
    strike();
    check('le ferrage accroche le poisson',
        state() === 'struggle' || state() === 'reeling', state());
    let guard = 0;
    while ((state() === 'struggle' || state() === 'reeling') && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('le poisson arrive au bord', state(), 'holding');
    G().storeHeldFish();
    checkEqual('le poisson est rangé dans la bourriche', state(), 'idle');

    // Retour au sud pour ne pas perturber la suite.
    G().placerAuPoste(0);
    checkEqual('on peut revenir au raccourci sud', G().getPoste().id, 'sud');
    G().demarrerJeu();
}

export default run;

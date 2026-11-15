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

/** Coordonnées client pour viser (angle, marge) sur la carte 3D. */
function pointCarte(angle, marge) {
    const p = G().projeterPlacement(angle, marge);
    return { clientX: p.clientX, clientY: p.clientY, pointerId: 1 };
}

function cliquerCarte(angle, marge) {
    fire('cartePlacement', 'pointerdown', pointCarte(angle, marge));
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
    group('56) Choix libre de l’emplacement sur la carte 3D en relief');
    G().recommencerPartie();
    resetToIdle();
    G().afficherAccueil();

    const carte = G().getPlacementMap();
    checkEqual('la carte est un relief 3D', carte.troisD, true);
    checkEqual('le plan d’eau est à une hauteur fixe (0)', carte.hauteurEau, 0);
    checkEqual('la carte a une résolution de 320', carte.taille, 320);
    checkEqual('la bande commence à 1,4 unité de la berge', carte.margeMin, 1.4);
    checkEqual('la bande s’arrête à 6 unités de la berge', carte.margeMax, 6);
    check('le maillage de relief est dense', carte.terrain.sommets > 5000,
        carte.terrain.sommets + ' sommets');
    check('le fond du lac est sous le plan d’eau', carte.terrain.minY < -4,
        carte.terrain.minY.toFixed(2) + ' unité');
    check('la terre monte au-dessus du plan d’eau', carte.terrain.maxY > 2,
        carte.terrain.maxY.toFixed(2) + ' unité');
    check('des sommets sont sous l’eau (le lac)', carte.terrain.sousLEau > 100,
        carte.terrain.sousLEau + ' sommets');
    check('des sommets sont au-dessus (la berge)', carte.terrain.auDessus > 100,
        carte.terrain.auDessus + ' sommets');
    check('la couronne de placement est un ruban 3D', carte.bande.sommets > 100,
        carte.bande.sommets + ' sommets');
    const centreCarte = G().getPondCenter();
    check('au centre, le terrain est sous l’eau',
        G().getHauteurCarte(centreCarte.x, centreCarte.z) < -3,
        G().getHauteurCarte(centreCarte.x, centreCarte.z).toFixed(2));
    const angleBerge = 0.2;
    const rayonBerge = G().getRayonEtang(angleBerge);
    const xBerge = centreCarte.x + Math.cos(angleBerge) * (rayonBerge + 3);
    const zBerge = centreCarte.z + Math.sin(angleBerge) * (rayonBerge + 3);
    check('sur la berge, le terrain est au-dessus de l’eau',
        G().getHauteurCarte(xBerge, zBerge) > 0.3,
        G().getHauteurCarte(xBerge, zBerge).toFixed(2));
    check('la carte explique comment choisir sa place',
        el('cartePlacementAide').textContent.indexOf('relief') >= 0,
        el('cartePlacementAide').textContent);

    // --- Toute la couronne doit être VISIBLE dans le cadre de la carte ---
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        [1.4, 3, 6].forEach(function (marge) {
            const p = G().projeterPlacement(angle, marge);
            minX = Math.min(minX, p.clientX);
            maxX = Math.max(maxX, p.clientX);
            minY = Math.min(minY, p.clientY);
            maxY = Math.max(maxY, p.clientY);
        });
    }
    check('toute la couronne est visible dans la carte',
        minX >= 0 && maxX <= 320 && minY >= 0 && maxY <= 320,
        'x ' + minX.toFixed(0) + '→' + maxX.toFixed(0)
        + ' / y ' + minY.toFixed(0) + '→' + maxY.toFixed(0));

    // --- Au départ : poste sud, marge par défaut, marqueur présent ---
    const initial = G().getEmplacement();
    checkEqual('au départ, le poste est le raccourci sud', G().getPoste().id, 'sud');
    checkClose('au départ, on est à 2,2 unités de la berge', initial.marge, 2.2, 0.01);
    check('le repère est dans la bande', initial.marge >= 1.4 && initial.marge <= 6,
        initial.marge.toFixed(2));

    // --- Clic libre sur le relief : angle et distance choisis ---
    const angleLibre = 0.2;
    const margeLibre = 3.4;
    cliquerCarte(angleLibre, margeLibre);
    const libre = G().getEmplacement();
    checkClose('le clic choisit l’angle', libre.angle, angleLibre, 0.05);
    checkClose('le clic choisit la distance à la berge', libre.marge, margeLibre, 0.35);
    checkEqual('le poste devient « libre »', G().getPoste().id, 'libre');
    checkEqual('le poste libre n’est pas un raccourci', G().getPoste().libre, true);
    checkEqual('la direction est nommée (est)', libre.direction, 'est');
    check('la boussole affiche la direction libre',
        el('compass').textContent.indexOf('poste est') >= 0, el('compass').textContent);
    checkClose('le pêcheur est à la distance choisie de la berge',
        ecartAuBord(), libre.marge, 0.35);
    check('la carte affiche la nouvelle distance',
        el('cartePlacementAide').textContent.indexOf(
            libre.marge.toFixed(1).replace('.', ',')) >= 0,
        el('cartePlacementAide').textContent);
    const projRepere = G().projeterPlacement(libre.angle, libre.marge);
    checkClose('le repère écran suit la sélection',
        parseFloat(el('cartePlacementRepere').style.left), projRepere.clientX, 1);
    checkClose('le repère écran suit la sélection (y)',
        parseFloat(el('cartePlacementRepere').style.top), projRepere.clientY, 1);

    // --- Cliquer DANS l'eau : on est repoussé sur la berge (marge mini) ---
    cliquerCarte(angleLibre, -4);
    checkClose('un clic dans l’eau est ramené à la marge mini',
        G().getEmplacement().marge, 1.4, 0.01);
    check('le pêcheur reste hors de l’eau',
        ecartAuBord() >= 1.39, ecartAuBord().toFixed(2) + ' unités');

    // --- Cliquer LOIN : on est ramené à la marge maxi ---
    cliquerCarte(angleLibre, 12);
    checkClose('un clic trop loin est ramené à la marge maxi',
        G().getEmplacement().marge, 6, 0.01);

    // --- Glisser le long de la couronne de relief ---
    fire('cartePlacement', 'pointerdown', pointCarte(0.2, 2.5));
    fire('cartePlacement', 'pointermove', pointCarte(0.8, 4));
    fire('cartePlacement', 'pointerup', { pointerId: 1 });
    const glisse = G().getEmplacement();
    checkClose('le glisser change l’angle', glisse.angle, 0.8, 0.05);
    checkClose('le glisser change la distance', glisse.marge, 4, 0.35);

    // --- Les raccourcis restent disponibles ---
    G().placerAuPoste(2);
    checkEqual('le raccourci Nord replace au nord', G().getPoste().id, 'nord');
    checkEqual('le raccourci n’est pas « libre »', G().getPoste().libre, false);

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

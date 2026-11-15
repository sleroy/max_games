// ---------------------------------------------------------------------------
// Scénario 53 : les EMPLACEMENTS autour de l'étang (idee 1 de idees.md).
// On vérifie que les 4 postes font bien le tour du lac, que tout le matériel
// suit (canne, bourriche, caméra) et qu'on peut y pêcher de bout en bout.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, resetToIdle, castTo, forceBite, strike, step, crankTurns, state
} from './harness.mjs';

function distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Les 4 postes par ordre d'index (comme dans POSTES). */
const POSTES = [
    { index: 0, id: 'sud', bouton: 'posteSud' },
    { index: 1, id: 'est', bouton: 'posteEst' },
    { index: 2, id: 'nord', bouton: 'posteNord' },
    { index: 3, id: 'ouest', bouton: 'posteOuest' }
];

export function run() {
    group('53) Emplacements : pêcher depuis les 4 bords de l’étang');
    G().recommencerPartie();
    resetToIdle();
    G().afficherAccueil();

    const centre = G().getPondCenter();
    const MARGE_POSTE = 2.2;
    // Écart entre un objet et le bord LOCAL de l'eau (le contour n'est pas un cercle).
    const ecartAuBord = function (p) {
        const dx = p.x - centre.x;
        const dz = p.z - centre.z;
        return Math.hypot(dx, dz) - G().getRayonEtang(Math.atan2(dz, dx));
    };
    const posteInitial = G().getPoste();
    checkEqual('au démarrage, on pêche au sud', posteInitial.id, 'sud');
    checkEqual('le jeu propose 4 postes', G().getPostes().length, 4);
    checkEqual('les 4 boutons sont présents sur l’écran d’accueil',
        POSTES.every(p => !!el(p.bouton)), true);

    // --- Le poste sud est calé sur la rive LOCALE (pas un cercle) ---
    const anglerSud = G().angler.position;
    checkClose('au sud, le pêcheur est à la marge du bord local',
        ecartAuBord(anglerSud), MARGE_POSTE, 0.02);
    check('le poste sud ne réutilise pas la distance circulaire historique',
        Math.abs(distance2D(anglerSud, centre) - Math.hypot(-4, 58)) > 0.5,
        distance2D(anglerSud, centre).toFixed(1) + ' unités du centre');

    // --- Les 4 postes : chacun sur SA rive, canne et caméra cohérentes ---
    const fleches = { sud: '↑', est: '→', nord: '↓', ouest: '←' };
    const mesures = POSTES.map(function (poste) {
        const ok = G().placerAuPoste(poste.index);
        const courant = G().getPoste();
        check('le poste « ' + poste.id + ' » est accessible', ok === true);
        checkEqual('le poste courant est « ' + poste.id + ' »', courant.id, poste.id);

        const pecheur = G().angler.position;
        const base = G().getRodBase();
        const bout = G().rodTip;
        const camera = G().camera.position;
        const cible = G().getCameraTarget();
        const bourriche = G().getBourriche();
        const girouette = G().getGirouette();

        checkClose('« ' + poste.id + ' » : le pêcheur est à la marge du bord local',
            ecartAuBord(pecheur), MARGE_POSTE, 0.02);
        checkClose('« ' + poste.id + ' » : la canne garde sa longueur (3 m)',
            distance2D(bout, base), Math.hypot(2.2, 5.11), 0.05);
        check('« ' + poste.id + ' » : le bout de la canne regarde l’étang',
            distance2D(bout, centre) < distance2D(base, centre),
            Math.round(distance2D(bout, centre)) + ' < ' + Math.round(distance2D(base, centre)));
        check('« ' + poste.id + ' » : la caméra reste derrière le pêcheur',
            distance2D(camera, pecheur) > 8 && distance2D(camera, pecheur) < 30,
            distance2D(camera, pecheur).toFixed(1) + ' unités');
        check('« ' + poste.id + ' » : la caméra vise l’étang',
            distance2D(cible, centre) < distance2D(camera, centre),
            Math.round(distance2D(cible, centre)) + ' < ' + Math.round(distance2D(camera, centre)));
        checkClose('« ' + poste.id + ' » : la bourriche reste collée au pêcheur',
            distance2D(pecheur, bourriche), Math.hypot(8, 5), 0.02);
        checkClose('« ' + poste.id + ' » : la girouette reste collée au pêcheur',
            distance2D(pecheur, girouette), Math.hypot(16, 2), 0.02);
        check('« ' + poste.id + ' » : la boussole indique où est le nord à l’écran',
            el('compass').textContent.indexOf('Nord ' + fleches[poste.id]) >= 0,
            el('compass').textContent);
        check('« ' + poste.id + ' » : le pêcheur est hors de l’eau',
            ecartAuBord(pecheur) > MARGE_POSTE - 0.2,
            ecartAuBord(pecheur).toFixed(2) + ' unités du bord');
        check('« ' + poste.id + ' » : la bourriche reste près du bord',
            Math.abs(ecartAuBord(bourriche)) < 6,
            ecartAuBord(bourriche).toFixed(1) + ' unités du bord');

        return {
            id: poste.id,
            pecheur: { x: pecheur.x, z: pecheur.z }
        };
    });

    // Les 4 postes sont bien DIFFÉRENTS (un quart de tour à chaque fois).
    const positions = mesures.map(m => m.pecheur.x.toFixed(1) + '/' + m.pecheur.z.toFixed(1));
    check('les 4 postes occupent 4 places distinctes',
        new Set(positions).size === 4, positions.join(' · '));

    // --- Les boutons de l'écran d'accueil ---
    G().placerAuPoste(2);
    checkEqual('placer au poste Nord place le pêcheur au nord', G().getPoste().id, 'nord');
    check('la boussole indique le poste choisi',
        el('compass').textContent.indexOf('poste nord') >= 0, el('compass').textContent);

    // --- Pas de téléportation en pleine partie ---
    const pecheur = G().angler.position;
    const ux = centre.x - pecheur.x;
    const uz = centre.z - pecheur.z;
    const norme = Math.hypot(ux, uz);
    const cibleLancer = {
        x: pecheur.x + (ux / norme) * 28,
        z: pecheur.z + (uz / norme) * 28
    };
    checkEqual('au nord, le lancer se pose dans l’étang',
        castTo(cibleLancer.x, cibleLancer.z), 'inWater');
    const angleBouchon = Math.atan2(
        G().floatGroup.position.z - centre.z, G().floatGroup.position.x - centre.x);
    const rayonBouchon = G().getRayonEtang(angleBouchon);
    check('le bouchon est bien dans l’étang',
        distance2D(G().floatGroup.position, centre) < rayonBouchon,
        distance2D(G().floatGroup.position, centre).toFixed(1) + ' < '
        + rayonBouchon.toFixed(1));
    checkEqual('on ne peut pas changer de poste avec la ligne à l’eau',
        G().placerAuPoste(1), false);
    checkEqual('le poste n’a pas changé', G().getPoste().id, 'nord');
    resetToIdle();

    // --- PÊCHE COMPLÈTE au poste nord : lancer -> touche -> ferrer -> bourriche ---
    resetToIdle();
    checkEqual('le lancer au nord part', castTo(cibleLancer.x, cibleLancer.z), 'inWater');
    const profondeur = G().profondeurLocale(
        G().floatGroup.position.x, G().floatGroup.position.z);
    check('la profondeur au nord reste jouable', profondeur > 1.4 && profondeur < 6.6,
        profondeur.toFixed(2) + ' unités');
    forceBite();
    checkEqual('un poisson mord au poste nord', state(), 'bite');
    strike();
    check('le ferrage accroche bien le poisson',
        state() === 'struggle' || state() === 'reeling', state());
    let guard = 0;
    while ((state() === 'struggle' || state() === 'reeling') && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('au nord aussi, le poisson arrive au bord', state(), 'holding');
    G().storeHeldFish();
    checkEqual('le poisson est rangé dans la bourriche', state(), 'idle');

    // --- Retour au poste sud pour ne pas perturber la suite ---
    G().placerAuPoste(0);
    checkEqual('on peut revenir au poste sud', G().getPoste().id, 'sud');
    check('la boussole est revenue au sud',
        el('compass').textContent.indexOf('poste sud') >= 0, el('compass').textContent);
    G().demarrerJeu();
}

export default run;

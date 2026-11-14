// ---------------------------------------------------------------------------
// Scénario 54 : le SOLEIL directionnel (idee 2 de idees.md).
// L'azimut est fixe (sud-ouest) : seule l'élévation suit le cycle du jour.
// Chaque poste autour de l'étang a sa propre exposition lumineuse.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, checkClose, G, el, resetToIdle } from './harness.mjs';

/** Avance d'un pas nul : recalcule le soleil sans faire avancer le temps. */
function rafraichirSoleil() {
    G().step(0);
    return G().getSoleil();
}

export function run() {
    group('54) Soleil fixe au sud-ouest et lumière selon le poste');
    G().recommencerPartie();
    resetToIdle();
    G().afficherAccueil();

    // --- 1) L'azimut est une CONSTANTE du monde ---
    const initial = G().getSoleil();
    checkEqual('le soleil est fixé au sud-ouest (225°)', initial.azimut, 225);
    checkEqual('l’azimut est nommé « sud-ouest »', initial.libelle, 'sud-ouest');
    check('la boussole du HUD annonce le sud-ouest',
        el('compass').textContent.indexOf('soleil au sud-ouest') >= 0,
        el('compass').textContent);

    // --- 2) Direction normalisée vers le sud-ouest, au-dessus de l'horizon ---
    const soleil = rafraichirSoleil();
    check('le soleil est à l’ouest (x < 0)', soleil.direction.x < -0.01,
        soleil.direction.x.toFixed(3));
    check('le soleil est au sud (z > 0)', soleil.direction.z > 0.01,
        soleil.direction.z.toFixed(3));
    check('le soleil est au-dessus de l’horizon (y > 0)', soleil.direction.y > 0.1,
        soleil.direction.y.toFixed(3));
    checkClose('la direction de l’eau est normalisée',
        Math.hypot(soleil.direction.x, soleil.direction.y, soleil.direction.z), 1, 1e-6);
    check('la lumière directionnelle est du même côté (ouest + sud)',
        soleil.position.x < 0 && soleil.position.z > 0,
        soleil.position.x.toFixed(1) + ' / ' + soleil.position.z.toFixed(1));
    const longueur = Math.hypot(soleil.position.x, soleil.position.y, soleil.position.z);
    checkClose('la direction de l’eau est celle de la lumière directionnelle',
        soleil.direction.x, soleil.position.x / longueur, 1e-6);
    checkClose('… et pour z', soleil.direction.z, soleil.position.z / longueur, 1e-6);

    // --- 3) Chaque poste a SA lumière (exposition) ---
    const parPoste = {};
    [0, 1, 2, 3].forEach(function (index) {
        G().placerAuPoste(index);
        const id = G().getPoste().id;
        const s = rafraichirSoleil();
        parPoste[id] = s;
        check('au poste « ' + id + ' », le soleil reste au sud-ouest',
            s.direction.x < 0 && s.direction.z > 0,
            s.direction.x.toFixed(2) + ' / ' + s.direction.z.toFixed(2));
    });
    const sud = parPoste.sud;
    const est = parPoste.est;
    const nord = parPoste.nord;
    const ouest = parPoste.ouest;
    check('les 4 postes ont 4 expositions distinctes',
        new Set([sud.exposition, est.exposition, nord.exposition, ouest.exposition]).size === 4,
        [sud.exposition, est.exposition, nord.exposition, ouest.exposition].join(' / '));
    checkEqual('le sud est la référence (exposition 1)', sud.exposition, 1);
    check('le nord est en contre-jour : exposition plus faible', nord.exposition < sud.exposition,
        nord.exposition + ' < ' + sud.exposition);
    check('l’ouest est le plus lumineux', ouest.exposition > sud.exposition,
        ouest.exposition + ' > ' + sud.exposition);
    check('contre-jour au nord : l’eau est plus sombre qu’au sud',
        nord.lumiereEau < sud.lumiereEau * 0.95,
        nord.lumiereEau.toFixed(3) + ' < ' + (sud.lumiereEau * 0.95).toFixed(3));
    check('plein soleil à l’ouest : l’eau est plus lumineuse qu’au sud',
        ouest.lumiereEau > sud.lumiereEau,
        ouest.lumiereEau.toFixed(3) + ' > ' + sud.lumiereEau.toFixed(3));
    check('l’intensité du soleil suit aussi le poste',
        nord.intensite < sud.intensite && ouest.intensite > sud.intensite,
        [nord.intensite, sud.intensite, ouest.intensite].map(v => v.toFixed(2)).join(' < '));
    check('l’ambiance générale reste jouable partout',
        [sud, est, nord, ouest].every(s => s.ambiance > 0.3),
        [sud, est, nord, ouest].map(s => s.ambiance.toFixed(2)).join(' / '));

    // --- 4) L'azimut ne bouge pas avec le temps : seule l'élévation varie ---
    G().placerAuPoste(0);
    const avant = rafraichirSoleil();
    for (let i = 0; i < 120; i++) {
        G().step(0.5);          // 60 s : un peu plus d'un huitième de journée
    }
    const apres = G().getSoleil();
    checkClose('l’azimut (x/z) reste constant au fil de la journée',
        apres.direction.x / apres.direction.z, avant.direction.x / avant.direction.z, 1e-6);
    check('l’élévation, elle, change avec le cycle du jour',
        Math.abs(apres.direction.y - avant.direction.y) > 1e-4,
        avant.direction.y.toFixed(3) + ' -> ' + apres.direction.y.toFixed(3));
    check('le soleil reste au sud-ouest après 60 s',
        apres.direction.x < 0 && apres.direction.z > 0,
        apres.direction.x.toFixed(2) + ' / ' + apres.direction.z.toFixed(2));

    // --- 5) La boussole reste cohérente avec le poste ---
    G().placerAuPoste(2);
    check('la boussole donne le soleil ET le poste',
        el('compass').textContent.indexOf('soleil au sud-ouest') >= 0
        && el('compass').textContent.indexOf('poste nord') >= 0,
        el('compass').textContent);
    G().placerAuPoste(0);
    G().demarrerJeu();
}

export default run;

// ---------------------------------------------------------------------------
// Scénario : CHASSES des carnassiers (chasse.js) et nourriture des étangs à carnassiers.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, fire, step, stepFor, castTo, clearLilyPads, resetToIdle, state, forceBite } from './harness.mjs';
import { CHASSE_PROIES, frequenceChasse } from '../chasse.js';
import { MILIEUX } from '../milieux.js';

function choisirSurAccueil(id) {
    const cle = 'accueilMilieu' + id.charAt(0).toUpperCase() + id.slice(1);
    el(cle).checked = true;
    fire(cle, 'change');
}

const BLANCS = ['gardon', 'rotengle', 'ablette', 'goujon', 'carassin'];

export function run() {
    group('Étang à carnassiers : des petits poissons blancs en quantité');
    const carn = MILIEUX.find(m => m.id === 'carnassiers');
    const partBlancs = BLANCS.reduce((t, id) => t + (carn.parts[id] || 0), 0);
    check('au moins 60 % de poissons blancs', partBlancs >= 60, partBlancs + ' %');
    check('densité forte (≥ 1,4)', carn.densite >= 1.4, String(carn.densite));
    check('chaque carnassier a des proies définies', ['brochet', 'perche', 'sandre', 'black-bass'].every(id => CHASSE_PROIES[id].length >= 2));
    check('le brochet chasse les ablettes', CHASSE_PROIES.brochet.indexOf('ablette') >= 0);

    group('Chasses : fréquence selon l’heure, la météo et l’eau');
    check('plus de chasses au crépuscule qu’à midi', frequenceChasse(18, 'beau', 15) > frequenceChasse(13, 'beau', 15));
    check('plus de chasses à l’aube qu’à midi', frequenceChasse(6.5, 'beau', 15) > frequenceChasse(13, 'beau', 15));
    check('temps couvert : plus de chasses', frequenceChasse(13, 'pluie', 15) > frequenceChasse(13, 'beau', 15));
    check('eau froide : presque pas de chasse', frequenceChasse(13, 'beau', 4) < 0.5 * frequenceChasse(13, 'beau', 15));

    group('Chasses : un carnassier fonce sur un banc, les proies fuient et remontent');
    choisirSurAccueil('plaine');
    choisirSurAccueil('carnassiers');
    resetToIdle();
    const chasse = G().chasse;
    const lance = chasse.declencher('brochet') || chasse.declencher();
    check('une chasse démarre', lance && chasse.enCours());
    if (!chasse.enCours()) { return; }
    const info = chasse.info();
    check('le chasseur est un carnassier qui chasse ses proies', !!CHASSE_PROIES[info.especeChasseur]
        && CHASSE_PROIES[info.especeChasseur].indexOf(info.especeProie) >= 0, info.especeChasseur + ' → ' + info.especeProie);
    const sautsAvant = chasse.sauts();
    let profMin = Infinity;
    let fuite = false;
    for (let i = 0; i < 240 && chasse.enCours(); i++) {
        step(1 / 60);
        const inf = chasse.info();
        if (!inf) { break; }
        inf.proies.forEach(p => {
            profMin = Math.min(profMin, -p.userData.depth);
            const d = Math.hypot(p.position.x - inf.chasseur.position.x, p.position.z - inf.chasseur.position.z);
            const v = (p.userData.vx * (p.position.x - inf.chasseur.position.x) + p.userData.vz * (p.position.z - inf.chasseur.position.z)) / (d || 1);
            if (v > 2) { fuite = true; }
        });
    }
    check('les proies fuient le chasseur', fuite);
    check('des proies remontent près de la surface', profMin < 0.6, profMin.toFixed(2));
    for (let i = 0; i < 3 && chasse.sauts() === sautsAvant; i++) {
        chasse.arreter();
        if (chasse.declencher()) { stepFor(10); }
    }
    check('parfois, une proie saute hors de l’eau', chasse.sauts() > sautsAvant, String(chasse.sauts() - sautsAvant));
    chasse.arreter();

    group('Chasses : les poissons restent pêchables');
    resetToIdle();
    clearLilyPads();
    castTo(G().angler.position.x, G().angler.position.z - 30);
    const poisson = forceBite();
    chasse.declencher();
    stepFor(0.5);
    const inf = chasse.info();
    check('le poisson qui mord n’est jamais pris dans la chasse',
        !inf || (inf.chasseur !== poisson && inf.proies.indexOf(poisson) < 0));
    checkEqual('la touche continue', state(), 'bite');
    chasse.arreter();
    resetToIdle();
    choisirSurAccueil('plaine');
}

// ---------------------------------------------------------------------------
// Scénario 65 : LANCER TENDU + MINI-JEU DE DÉMÊLAGE.
// Un clic pendant le vol tend la ligne. Sans clic, la ligne peut s'emmêler :
// il faut suivre le câble au doigt ; un abandon ou un temps écoulé coûte une ligne.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, el, fire, resetToIdle, step, stepUntil, state
} from './harness.mjs';

function attendreEtat(cible, max = 4) {
    return stepUntil(function () { return state() === cible; }, max);
}

export function run() {
    group('65) Lancer tendu et mini-jeu de démêlage');
    G().demarrerJeu();
    resetToIdle();
    G().lilyPads.length = 0;

    G().setTangleChance(null);
    G().setDifficulty('facile');
    checkEqual('le mode Facile écarte les emmêlements au lancer', G().getTangleChance(), 0);
    G().startCast({ x: 0, y: 0, z: -25 });
    checkEqual('le bouton de tension est inutile en Facile', el('fishButton').disabled, true);
    check('le lancer arrive sans geste supplémentaire', attendreEtat('inWater', 4), state());
    resetToIdle();
    G().setDifficulty('dur');
    checkEqual('le mode Dur plafonne le risque à quinze pour cent', G().getTangleChance(), 0.15);
    G().setDifficulty('normal');
    checkEqual('le mode Normal plafonne le risque à huit pour cent', G().getTangleChance(), 0.08);

    // 1) Un clic pendant le vol tend la ligne : pas d'emmêlement.
    G().setTangleChance(1);
    G().startCast({ x: 0, y: 0, z: -25 });
    checkEqual('la ligne part', state(), 'flying');
    check('le statut invite à tendre la ligne',
        el('status').textContent.includes('Tendre le fil'), el('status').textContent);
    checkEqual('le bouton indique le geste à faire', el('fishButton').textContent, 'Tendre le fil');
    checkEqual('le bouton est utilisable pendant le vol', el('fishButton').disabled, false);
    checkEqual('le bouton est visible pendant le vol', el('fishButton').hidden, false);
    fire('fishButton', 'click');
    checkEqual('le jeu confirme le geste', el('fishButton').textContent, '✓ Fil tendu');
    checkEqual('la ligne est marquée tendue', G().isLigneTendue(), true);
    attendreEtat('inWater', 4);
    checkEqual('une ligne tendue arrive sans emmêlement', state(), 'inWater');
    checkEqual('aucune ligne perdue', G().getLignes(), 1);

    resetToIdle();
    G().startCast({ x: 0, y: 0, z: -25 });
    fire('gameCanvas', 'pointerdown', { button: 0, pointerType: 'touch' });
    checkEqual('une pression sur l’eau tend aussi le fil', G().isLigneTendue(), true);
    check('le geste tactile protège aussi le lancer', attendreEtat('inWater', 4), state());

    // 2) Sans tendre la ligne, elle s'emmêle (chance forcée à 100 %).
    resetToIdle();
    checkEqual('le clic tend la ligne', G().tendreLigne(), false);
    G().setTangleChance(1);
    G().startCast({ x: 0, y: 0, z: -25 });
    check('l’emmêlement se déclenche', attendreEtat('tangle', 4), state());
    checkEqual('l’état de pêche est « tangle »', state(), 'tangle');
    checkEqual('le mini-jeu est actif', G().isTangleActif(), true);
    checkEqual('le panneau de démêlage s’affiche',
        el('tangleGame').classList.contains('active'), true);
    const tangle = G().getTangle();
    check('le câble a été généré', !!tangle && tangle.nbPoints > 20,
        tangle ? tangle.nbPoints + ' points' : 'aucun');
    check('le joueur est prévenu', el('status').textContent.indexOf('emmêlée') >= 0,
        el('status').textContent);
    check('une popup annonce l’emmêlement',
        G().getFloatingTexts().some(function (t) { return t.indexOf('emmêlée') >= 0; }),
        G().getFloatingTexts().join(' / '));
    checkEqual('aucune ligne perdue avant la résolution', G().getLignes(), 1);

    // 3) Suivre tout le câble (les points du parcours) démêle la ligne.
    const parcours = G().getDemelagePath();
    check('le parcours est exposé aux tests', parcours.length > 20,
        parcours.length + ' points');
    parcours.slice(0, 20).forEach(p => G().pointerDemelage(p.x, p.y));
    const avantPause = G().getTangle();
    for (let i = 0; i < 12; i++) { G().pointerDemelage(-100, -100); }
    checkEqual('une sortie du tracé ne fait pas perdre la ligne', G().isTangleActif(), true);
    checkEqual('les événements hors du tracé ne retirent pas de temps', G().getTangle().timeLeft,
        avantPause.timeLeft);
    fire('tangleCanvas', 'pointerup');
    const reprise = parcours[avantPause.progress];
    G().pointerDemelage(reprise.x, reprise.y);
    checkEqual('le joueur reprend au même endroit', G().getTangle().progress, avantPause.progress);
    parcours.slice(avantPause.progress + 1).forEach(p => G().pointerDemelage(p.x, p.y));
    checkEqual('le chemin complet libère la ligne', G().isTangleActif(), false);
    checkEqual('le panneau de démêlage se ferme',
        el('tangleGame').classList.contains('active'), false);
    checkEqual('la ligne est récupérée', state(), 'inWater');
    checkEqual('le tracé réussi ne coûte pas de ligne', G().getLignes(), 1);

    // 4) Abandonner le mini-jeu coûte une ligne.
    resetToIdle();
    G().setTangleChance(1);
    G().startCast({ x: 0, y: 0, z: -25 });
    attendreEtat('tangle', 4);
    const lignesAvant = G().getLignes();
    G().abandonnerEmmElement();
    checkEqual('l’abandon ferme le mini-jeu', G().isTangleActif(), false);
    checkEqual('l’abandon coûte une ligne', G().getLignes(), lignesAvant - 1);
    checkEqual('avec une seule ligne, l’abandon finit la partie', G().isPartieTerminee(), true);
    checkEqual('la pêche revient au repos', state(), 'idle');

    // 5) Le temps écoulé coûte aussi une ligne.
    resetToIdle();
    G().setTangleChance(1);
    G().startCast({ x: 0, y: 0, z: -25 });
    attendreEtat('tangle', 4);
    const lignesAvantTemps = G().getLignes();
    G().setTangleTime(0.01);
    step(0.05);
    checkEqual('le temps écoulé ferme le mini-jeu', G().isTangleActif(), false);
    checkEqual('le temps écoulé coûte une ligne', G().getLignes(), lignesAvantTemps - 1);
    checkEqual('avec une seule ligne, le temps écoulé finit la partie', G().isPartieTerminee(), true);
    checkEqual('la pêche revient au repos après le temps', state(), 'idle');

    G().setTangleChance(0);
    resetToIdle();
    G().demarrerJeu();
}

export default run;

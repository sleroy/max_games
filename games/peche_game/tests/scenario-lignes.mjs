// ---------------------------------------------------------------------------
// Scénario 13 : les LIGNES (vies) — casse, fin de partie et classement local.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, resetToIdle, stepFor } from './harness.mjs';

export function run() {
    group('49) Lignes (vies) : lancer trop fort, remontée trop rapide');
    G().recommencerPartie();
    checkEqual('on commence avec 5 lignes', G().getLignes(), 5);
    checkEqual('le compteur affiche les 5 lignes', el('lignesLabel').textContent, '🧵 Lignes : 5/5');

    // 1) Lancer au maximum de la jauge = ligne cassée.
    resetToIdle();
    G().startCastCharge({ x: 0, y: 0, z: -25 });
    G().setCastPower(1);
    G().releaseCast();
    checkEqual('un lancer trop fort casse la ligne', G().getLignes(), 4);
    check('le jeu explique la casse', el('status').textContent.indexOf('trop fort') >= 0,
        el('status').textContent);
    checkEqual('le compteur suit', el('lignesLabel').textContent, '🧵 Lignes : 4/5');

    // 2) Remontée trop rapide : avertissements (risque croissant).
    G().avertirVitesse();
    stepFor(1);
    G().avertirVitesse();
    stepFor(1);
    G().avertirVitesse();
    check('les remontées trop rapides sont signalées', G().getAvertissements() >= 1,
        G().getAvertissements() + ' avertissement(s)');
    check('un avertissement s’affiche', el('status').textContent.indexOf('trop vite') >= 0,
        el('status').textContent);

    // 3) Fin de partie, nom du pêcheur et classement local.
    G().addJournalEntry(1.7, 'Gardon');
    while (G().getLignes() > 0) {
        G().casserLigne('Test');
    }
    checkEqual('plus aucune ligne', G().getLignes(), 0);
    checkEqual('la partie est terminée', G().isPartieTerminee(), true);
    checkEqual('le panneau de fin de partie s’affiche',
        el('gameOver').classList.contains('active'), true);
    const stats = G().getPartieStats();
    check('la partie a compté les prises', stats.poissons >= 1 && stats.poids > 0,
        JSON.stringify(stats));
    check('le panneau résume la partie', el('gameOverScore').innerHTML.indexOf('poisson') >= 0,
        el('gameOverScore').textContent);
    const entree = G().enregistrerClassement('Max');
    checkEqual('le nom est enregistré', entree.nom, 'Max');
    const ldb = G().getClassement();
    check('le classement contient la partie', ldb.some(e => e.nom === 'Max'),
        ldb.length + ' entrée(s)');
    G().renderClassement('poissons');
    check('l’onglet Poissons liste le pêcheur', el('rankingList').innerHTML.indexOf('Max') >= 0);
    G().renderClassement('poids');
    check('l’onglet Poids total liste le pêcheur', el('rankingList').innerHTML.indexOf('Max') >= 0);
    G().renderClassement('records');
    check('l’onglet Records donne le record par espèce',
        el('rankingList').innerHTML.indexOf('Gardon') >= 0, el('rankingList').textContent);

    // 4) Rejouer.
    G().recommencerPartie();
    checkEqual('rejouer redonne 5 lignes', G().getLignes(), 5);
    checkEqual('la partie est relancée', G().isPartieTerminee(), false);
    check('le panneau s’est refermé', !el('gameOver').classList.contains('active'));
    checkEqual('les statistiques repartent de zéro', G().getPartieStats().poissons, 0);
}

export default run;

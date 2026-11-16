// ---------------------------------------------------------------------------
// Scénario 13 : les LIGNES (vies) — casse, fin de partie et classement local.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, fire, resetToIdle, stepFor, state } from './harness.mjs';

export function run() {
    group('49) Lignes (vies) : lancer trop fort, remontée trop rapide');
    G().recommencerPartie();
    checkEqual('on commence avec UNE seule ligne', G().getLignes(), 1);
    checkEqual('la réserve maximale est de 1 ligne', G().maxLignes, 1);
    checkEqual('le compteur affiche 1/1', el('lignesLabel').textContent, '🧵 Lignes : 1/1');
    checkEqual('la partie est en cours', G().isPartieTerminee(), false);

    // 1) Lancer au maximum de la jauge = ligne cassée.
    resetToIdle();
    G().startCastCharge({ x: 0, y: 0, z: -25 });
    G().setCastPower(1);
    G().releaseCast();
    checkEqual('un lancer trop fort casse la ligne', G().getLignes(), 0);
    check('le jeu explique la casse', el('status').textContent.indexOf('trop fort') >= 0,
        el('status').textContent);
    checkEqual('le compteur suit : 0/1', el('lignesLabel').textContent, '🧵 Lignes : 0/1');
    checkEqual('une seule casse = fin de partie directe', G().isPartieTerminee(), true);
    checkEqual('le panneau de fin s’affiche aussitôt',
        el('gameOver').classList.contains('active'), true);
    check('l’écran de fin dit clairement qu’il n’y a plus de ligne',
        el('gameOverTitle').textContent.indexOf('Plus de lignes') >= 0
        && el('gameOverText').textContent.indexOf('plus de lignes') >= 0,
        el('gameOverTitle').textContent + ' / ' + el('gameOverText').textContent);
    checkEqual('aucun état bloqué : la pêche est au repos', state(), 'idle');
    G().casserLigne('Encore');
    checkEqual('une casse de plus n’a aucun effet', G().getLignes(), 0);

    // Nouvelle partie : 1/1 de nouveau, avant les avertissements de vitesse.
    G().recommencerPartie();
    checkEqual('relancer une partie repart à 1 ligne', G().getLignes(), 1);
    check('le message de départ dit « 1 ligne » (singulier)', el('status').textContent.indexOf('1 ligne et') >= 0,
        el('status').textContent);
    checkEqual('le compteur repart à 1/1', el('lignesLabel').textContent, '🧵 Lignes : 1/1');

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
    const popupVitesse = G().getFloatingTextDetails().find(function (item) {
        return item.texte.indexOf('Trop vite') >= 0;
    });
    check('l’avertissement est aussi une popup près du bouchon', !!popupVitesse,
        G().getFloatingTexts().join(' / '));
    if (popupVitesse) {
        check('la popup de vitesse est au-dessus du bouchon',
            Math.hypot(popupVitesse.x - G().floatGroup.position.x,
                popupVitesse.z - G().floatGroup.position.z) < 1,
            'popup ' + popupVitesse.x.toFixed(1) + '/' + popupVitesse.z.toFixed(1)
            + ' · bouchon ' + G().floatGroup.position.x.toFixed(1) + '/'
            + G().floatGroup.position.z.toFixed(1));
    }

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
    checkEqual('rejouer redonne 1 ligne', G().getLignes(), 1);
    checkEqual('rejouer remet le compteur à 1/1', el('lignesLabel').textContent, '🧵 Lignes : 1/1');
    checkEqual('la partie est relancée', G().isPartieTerminee(), false);
    check('le panneau s’est refermé', !el('gameOver').classList.contains('active'));
    checkEqual('les statistiques repartent de zéro', G().getPartieStats().poissons, 0);

    group('52) Ecran d accueil : Jouer ou Classement');
    G().afficherAccueil();
    checkEqual('l ecran d accueil s affiche au demarrage', G().isAccueilVisible(), true);
    check('il propose de jouer (bouton présent)', !!el('playButton'), 'bouton Jouer');
    check('il propose le classement', !!el('accueilClassement'));
    fire('accueilClassement', 'click');
    checkEqual('le classement s ouvre depuis l accueil', el('classement').classList.contains('active'), true);
    fire('closeRanking', 'click');
    fire('playButton', 'click');
    checkEqual('Jouer ferme l accueil', G().isAccueilVisible(), false);
    G().afficherAccueil();
    checkEqual('on peut reafficher l accueil', G().isAccueilVisible(), true);
    G().demarrerJeu();
}

export default run;

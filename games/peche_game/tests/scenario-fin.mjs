// ---------------------------------------------------------------------------
// Scénario 64 : FIN DE PARTIE VOLONTAIRE, MODALE D'ACCUEIL, XP DE PARTIE,
// SPÉCIMENS HORS NORME.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, fire, state } from './harness.mjs';

export function run() {
    group('64) Fin de partie volontaire, modale d’accueil et XP de partie');

    // 1) L'accueil est une vraie modale : fond bloquant tant qu'on n'a pas joué.
    G().demarrerJeu();
    G().afficherAccueil();
    checkEqual('l’accueil est affiché', G().isAccueilVisible(), true);
    checkEqual('un fond modal bloque le lac', G().isModalBackdropVisible(), true);
    check('le bouton Jouer est présent', !!el('playButton'));
    fire('playButton', 'click');
    checkEqual('JOUER ferme l’accueil', G().isAccueilVisible(), false);
    checkEqual('JOUER retire le fond modal', G().isModalBackdropVisible(), false);

    // 2) Terminer la partie à la main, même avec des lignes restantes.
    G().demarrerJeu();
    G().addJournalEntry(1.5, 'Gardon');
    const lignesAvant = G().getLignes();
    fire('endGameButton', 'click');
    checkEqual('la partie est terminée', G().isPartieTerminee(), true);
    checkEqual('les lignes ne sont pas débitées', G().getLignes(), lignesAvant);
    checkEqual('le panneau de fin s’affiche', el('gameOver').classList.contains('active'), true);
    check('le titre parle d’une fin volontaire',
        el('gameOverTitle').textContent.indexOf('Partie terminée') >= 0,
        el('gameOverTitle').textContent);
    checkEqual('la pêche est bien arrêtée', state(), 'idle');
    checkEqual('le fond modal est là aussi', G().isModalBackdropVisible(), true);

    // 3) Saisir son nom, enregistrer et revenir à l'accueil.
    el('playerName').value = 'Max';
    fire('saveAndMenu', 'click');
    checkEqual('l’accueil revient après enregistrement', G().isAccueilVisible(), true);
    checkEqual('le panneau de fin se ferme', el('gameOver').classList.contains('active'), false);
    checkEqual('le fond modal reste pour l’accueil', G().isModalBackdropVisible(), true);
    check('le nom est bien dans le classement',
        G().getClassement().some(function (e) { return e.nom === 'Max'; }));

    // 4) Rejouer repart proprement.
    fire('playButton', 'click');
    checkEqual('l’accueil se ferme', G().isAccueilVisible(), false);
    checkEqual('la partie est relancée', G().isPartieTerminee(), false);
    checkEqual('1 ligne neuve', G().getLignes(), 1);
    checkEqual('le fond modal disparaît', G().isModalBackdropVisible(), false);

    // 5) XP de partie : à zéro au début, gagnée en pêchant, remise à zéro à JOUER.
    checkEqual('l’XP de partie démarre à zéro', G().getExperiencePartie(), 0);
    const xpCarriereAvant = G().getExperience();
    G().gagnerExperience(1);
    const gain = G().getExperiencePartie();
    check('l’XP de partie augmente', gain >= 3, gain + ' XP');
    check('l’XP carrière augmente aussi', G().getExperience() > xpCarriereAvant);
    check('le bandeau affiche XP de partie et carrière',
        el('xpLabel').textContent.indexOf('XP') >= 0
        && el('xpLabel').textContent.indexOf('carrière') >= 0,
        el('xpLabel').textContent);
    const xpCarriereApres = G().getExperience();
    G().demarrerJeu();
    checkEqual('JOUER remet l’XP de partie à zéro', G().getExperiencePartie(), 0);
    checkEqual('JOUER conserve l’XP carrière', G().getExperience(), xpCarriereApres);

    // 6) Distribution : les poids d'abondance sont cohérents et l'étang est peuplé.
    const distribution = G().getDistributionAttendue();
    const sommeParts = distribution.reduce(function (s, e) { return s + e.part; }, 0);
    check('la distribution des espèces totalise 100 %',
        Math.abs(sommeParts - 1) < 1e-9, sommeParts.toFixed(6));
    const partGardon = distribution.find(function (e) { return e.id === 'gardon'; });
    const partSilure = distribution.find(function (e) { return e.id === 'silure'; });
    check('les espèces abondantes restent majoritaires',
        !!partGardon && !!partSilure && partGardon.part > partSilure.part,
        (partGardon ? partGardon.part.toFixed(3) : '?') + ' > '
        + (partSilure ? partSilure.part.toFixed(3) : '?'));
    checkEqual('l’étang contient bien toute sa population', G().fishes.length, G().getPopulation().cible);

    // 7) Spécimen hors norme : taille/poids/combat au-delà de la norme.
    const raresAvant = G().getHorsNormeCount();
    G().setHorsNormeChance(1);
    const rare = G().spawnFish();
    check('le spécimen est marqué hors norme', !!rare && rare.userData.horsNorme === true);
    check('son facteur de taille dépasse 1',
        !!rare && rare.userData.facteurRare > 1, rare ? rare.userData.facteurRare : '');
    check('il est compté dans l’étang', G().getHorsNormeCount() === raresAvant + 1);
    const indexRare = G().fishes.indexOf(rare);
    if (indexRare >= 0) { G().fishes.splice(indexRare, 1); }
    G().scene.remove(rare);
    G().setHorsNormeChance(0);
    check('le retrait du spécimen est propre', G().getHorsNormeCount() === raresAvant);

    G().demarrerJeu();
}

export default run;

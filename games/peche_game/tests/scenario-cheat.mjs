// ---------------------------------------------------------------------------
// Scénario 70 : cheat « poisson ». Taper le mot secret n'importe où offre
// +50 XP ; un mot incomplet, faux ou une touche spéciale n'offrent rien.
// ---------------------------------------------------------------------------
import { group, checkEqual, G, resetToIdle } from './harness.mjs';

export function run() {
    group('70) Cheat « poisson » : +50 XP');
    resetToIdle();
    G().setExperience(0);
    const partieAvant = G().getExperiencePartie();

    // --- Mot incomplet : rien ---
    'poisso'.split('').forEach(function (lettre) {
        checkEqual('« ' + lettre + ' » seule n\'offre rien',
            G().cheatTouche(lettre), false);
    });
    checkEqual('XP inchangée après un mot incomplet', G().getExperience(), 0);

    // --- La dernière lettre complète « poisson » : +50 XP ---
    checkEqual('la dernière lettre déclenche le cheat', G().cheatTouche('n'), true);
    checkEqual('+50 XP crédités', G().getExperience(), 50);
    checkEqual('l\'XP de partie grimpe aussi',
        G().getExperiencePartie(), partieAvant + 50);

    // --- Le cheat peut être relancé ---
    'poisson'.split('').forEach(function (lettre) {
        G().cheatTouche(lettre);
    });
    checkEqual('le cheat peut être relancé', G().getExperience(), 100);

    // --- Une fausse lettre remet le compteur à zéro ---
    'poisso'.split('').forEach(function (lettre) {
        G().cheatTouche(lettre);
    });
    G().cheatTouche('x'); // lettre fausse
    'poisson'.split('').forEach(function (lettre) {
        G().cheatTouche(lettre);
    });
    checkEqual('une fausse lettre casse la série, pas de double bonus volé',
        G().getExperience(), 150);

    // --- Robustesse ---
    checkEqual('une touche spéciale (Shift) est ignorée', G().cheatTouche('Shift'), false);

    // --- Intégration : vraies frappes clavier via l'écouteur « window » ---
    G().setExperience(0);
    const partieAvantClavier = G().getExperiencePartie();
    'poisson'.split('').forEach(function (lettre) {
        globalThis.fireWindowEvent('keydown', { key: lettre });
    });
    checkEqual('le vrai clavier déclenche aussi le cheat (+50 XP)',
        G().getExperience(), 50);
    checkEqual('l\'XP de partie suit via le vrai clavier',
        G().getExperiencePartie(), partieAvantClavier + 50);

    // --- Saisie dans un champ de texte : pas de cheat ---
    G().setExperience(0);
    const champFactice = { closest: () => ({}) };   // simule target dans <input>
    'poisson'.split('').forEach(function (lettre) {
        globalThis.fireWindowEvent('keydown', { key: lettre, target: champFactice });
    });
    checkEqual('aucun cheat depuis un champ de saisie', G().getExperience(), 0);

    // Ménage : on ne laisse pas d'XP de cheat aux scénarios suivants.
    G().setExperience(0);
}

export default run;

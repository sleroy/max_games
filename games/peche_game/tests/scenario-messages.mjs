// ---------------------------------------------------------------------------
// Scénario 62 : messages de touche. « Ça bouge » est INTERDIT ; le seul message
// d'approche autorisé est « Un poisson s'approche… ». Les fausses touches ne
// doivent produire aucun texte (le mouvement et les ronds suffisent).
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, resetToIdle, clearLilyPads, castTo, forceBite, stepUntil } from './harness.mjs';

export function run() {
    group('62) Messages de touche : « Ça bouge » interdit');
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    checkEqual('la touche est en cours', G().getState(), 'bite');
    check('le message d’approche est affiché',
        G().getFloatingTexts().some(t => t.indexOf('s’approche') >= 0),
        G().getFloatingTexts().join(' / '));
    check('aucun « Ça bouge » dès l’approche',
        !G().getFloatingTexts().some(t => /[ÇC]a bouge/.test(t)),
        G().getFloatingTexts().join(' / '));

    // Attend la première fausse touche : aucun texte ne doit apparaître.
    const fausse = stepUntil(() => G().getBitePhase() === 'fausse', 20);
    check('une fausse touche se déclenche', fausse, G().getBitePhase());
    check('aucun « Ça bouge » sur une fausse touche',
        !G().getFloatingTexts().some(t => /[ÇC]a bouge/.test(t)),
        G().getFloatingTexts().join(' / '));
    check('le seul message d’approche reste le message autorisé',
        G().getFloatingTexts().every(t => t.indexOf('s’approche') >= 0
            || t.indexOf('FERRÉ') >= 0 || t.indexOf('Trop tôt') >= 0
            || t.indexOf('Trop tard') >= 0 || t.indexOf('Raté') >= 0
            || t.indexOf('Rien ne bougeait') >= 0),
        G().getFloatingTexts().join(' / '));

    resetToIdle();
    G().demarrerJeu();
}

export default run;

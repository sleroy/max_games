// ---------------------------------------------------------------------------
// Scénario : ESCHE VOLÉE sur un ferrage raté (demande du joueur 2026-11-16).
//
//  - hameçon nu à 4 % ;
//  - perte selon l'esche : pain 80 %, ver 50 %, maïs 30 %, vif 30 %, bouillette 10 % ;
//  - facile : jamais ; normal : message + hameçon nu tout de suite ;
//  - dur : un peu plus souvent, SILENCIEUX, découvert seulement au retour de la ligne.
// ---------------------------------------------------------------------------
import { PROBA_NU, PERTE_ESCHE, PERTE_FACTEUR_DUR, probaPerteEsche } from '../esches.js';
import {
    group, check, checkEqual, G, el, state, stepUntil, resetToIdle, clearLilyPads, castTo, forceBite
} from './harness.mjs';

/** Une touche qu'on laisse filer (le poisson recrache). Renvoie les textes flottants vus. */
function toucheRatee() {
    const e = G().etat;
    resetToIdle();
    clearLilyPads();
    castTo(0, -25);
    const actives = e.eschesActives;
    e.eschesActives = false;          // le poisson mord forcément (on teste la perte, pas la touche)
    forceBite();
    e.eschesActives = actives;
    const textes = [];
    stepUntil(() => {
        G().getFloatingTexts().forEach(t => textes.push(t));
        return G().getBitePhase() === 'termine';
    }, 60);
    G().getFloatingTexts().forEach(t => textes.push(t));
    return textes;
}

/** Rate des touches jusqu'à ce que `fini()` soit vrai (au plus `n`). */
function raterJusqua(fini, n) {
    const textes = [];
    for (let i = 0; i < n && !fini(); i++) { toucheRatee().forEach(t => textes.push(t)); }
    return textes;
}

export function run() {
    group('Esche volée sur un ferrage raté (facile / normal / dur)');
    const e = G().etat;

    // --- Modèle pur ---
    checkEqual('hameçon nu : 4 %', PROBA_NU, 0.04);
    checkEqual('pain 80 %, ver 50 %, maïs 30 %, vif 30 %, bouillette 10 %',
        [PERTE_ESCHE.pain, PERTE_ESCHE.ver, PERTE_ESCHE.mais, PERTE_ESCHE.vif, PERTE_ESCHE.bouillette].join(), '0.8,0.5,0.3,0.3,0.1');
    check('facile : jamais de perte', ['pain', 'ver', 'mais', 'vif', 'bouillette'].every(id => probaPerteEsche(id, 'facile') === 0));
    check('dur : un peu plus souvent qu’en normal (sans dépasser 100 %)',
        probaPerteEsche('ver', 'dur') === 0.5 * PERTE_FACTEUR_DUR && probaPerteEsche('ver', 'dur') > probaPerteEsche('ver', 'normal')
        && probaPerteEsche('pain', 'dur') <= 1);
    checkEqual('hameçon nu : rien à perdre', probaPerteEsche(null, 'normal'), 0);

    e.eschesActives = true;

    // --- Normal : message + hameçon nu tout de suite ---
    G().setDifficulty('normal');
    e.equiperEsche('pain');
    const textesNormal = raterJusqua(() => e.journal.esche === null, 12);
    checkEqual('normal : le poisson finit par voler le pain', e.journal.esche, null);
    check('…et le joueur est prévenu', textesNormal.some(t => t.indexOf('a volé ton pain') >= 0), textesNormal.join(' | '));
    check('…le widget affiche « Hameçon nu »', el('depthEsche').textContent.indexOf('Hameçon nu') >= 0, el('depthEsche').textContent);
    checkEqual('…sans le mémoriser comme un choix', e.journal.escheNu, false);

    // --- Dur : silence, découverte au retour de la ligne ---
    G().setDifficulty('dur');
    e.equiperEsche('ver');
    const textesDur = raterJusqua(() => e.escheVolee, 12);
    check('dur : le ver finit par être volé', e.escheVolee === true);
    checkEqual('…mais l’esche équipée n’a pas changé', e.journal.esche, 'ver');
    check('…le widget affiche toujours le ver', el('depthEsche').textContent.indexOf('Ver de terre') >= 0, el('depthEsche').textContent);
    check('…seul « Raté » est dit, rien sur l’esche', textesDur.some(t => t.indexOf('Raté') >= 0)
        && textesDur.every(t => t.indexOf('volé ton ver') < 0 && t.indexOf('hameçon est nu') < 0)
        && el('status').textContent.indexOf('volé') < 0, textesDur.join(' | '));
    // On ramène la ligne au bord : l'hameçon nu apparaît.
    G().startReel();
    const textesRetour = [];
    stepUntil(() => {
        G().getFloatingTexts().forEach(t => textesRetour.push(t));
        if (state() === 'reeling') { G().turnCrank(30); }
        return state() === 'idle';
    }, 60);
    G().getFloatingTexts().forEach(t => textesRetour.push(t));
    checkEqual('retour de la ligne : l’hameçon est nu', e.journal.esche, null);
    check('…le joueur le découvre', textesRetour.some(t => t.indexOf('hameçon est nu') >= 0) || el('status').textContent.indexOf('hameçon est nu') >= 0,
        textesRetour.join(' | ') + ' / ' + el('status').textContent);
    checkEqual('…et plus rien n’est en attente', e.escheVolee, false);
    // Rééquiper efface aussi une perte encore cachée.
    e.equiperEsche('ver');
    e.escheVolee = true;
    e.equiperEsche('ver');
    checkEqual('rééquiper une esche remet une esche fraîche', e.escheVolee, false);

    // --- Facile : jamais ---
    G().setDifficulty('facile');
    e.equiperEsche('pain');
    raterJusqua(() => false, 6);
    checkEqual('facile : 6 touches ratées, le pain est toujours là', e.journal.esche, 'pain');
    checkEqual('…et rien n’est volé en cachette', e.escheVolee, false);

    resetToIdle();
    G().setDifficulty('normal');
    e.eschesActives = false;
    e.equiperEsche('ver');
}

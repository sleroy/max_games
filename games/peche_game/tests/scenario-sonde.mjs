// ---------------------------------------------------------------------------
// Scénario : SONDE (boutique) — profondeur et type de fond à côté du bouchon.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { group, check, checkEqual, G, el, fire, step, stepFor, castTo, clearLilyPads, resetToIdle, state, GAME_DIR } from './harness.mjs';
import { SONDE_PRIX } from '../sonde.js';

export function run() {
    group('Sonde : achat, affichage près du bouchon, mise à jour en ramenant');
    resetToIdle();
    clearLilyPads();
    G().reinitialiserSonde();
    const sonde = G().sonde;
    const acheter = () => fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'sonde' } } });

    G().setExperience(SONDE_PRIX - 1);
    acheter();
    checkEqual('sous ' + SONDE_PRIX + ' XP, pas de sonde', sonde.possedee(), false);
    G().setExperience(SONDE_PRIX + 10);
    acheter();
    checkEqual('la sonde coûte ' + SONDE_PRIX + ' XP', G().getExperience(), 10);
    checkEqual('achetée, elle est équipée', sonde.equipee(), true);

    step(1 / 60);
    checkEqual('ligne au repos : pas d’étiquette', el('sondeLabel').hidden, true);

    castTo(0, -30);
    step(1 / 60);
    checkEqual('ligne à l’eau : l’étiquette apparaît', el('sondeLabel').hidden, false);
    const texte = el('sondeLabel').textContent;
    const lecture = sonde.lecture();
    check('elle donne la profondeur en mètres et le fond', /m · /.test(texte) && texte.indexOf(lecture.nom) >= 0, texte);
    const verdict = G().verdictFond(G().floatGroup.position.x, G().floatGroup.position.z, 2.5, false);
    check('la profondeur est celle du fond sous le bouchon',
        Math.abs(lecture.profondeur - verdict.profondeurEau) < 1e-6, lecture.profondeur + ' / ' + verdict.profondeurEau);
    check('l’étiquette suit le bouchon à l’écran (transform)', /translate\(/.test(String(el('sondeLabel').style.transform)));

    // On ramène la ligne vers la berge : le fond change (moins profond près du bord).
    const avant = lecture.profondeur;
    for (let i = 0; i < 12; i++) { G().turnCrank(1); stepFor(0.15); }
    stepFor(0.2);
    const apres = sonde.lecture();
    check('en ramenant, la mesure change', apres && apres.profondeur !== avant,
        avant.toFixed(2) + ' → ' + (apres ? apres.profondeur.toFixed(2) : '?'));

    fire('boutique', 'click', { target: { dataset: { action: 'basculer-sonde', id: 'sonde' } } });
    checkEqual('« retirer » range la sonde', sonde.equipee(), false);
    step(1 / 60);
    checkEqual('sonde rangée : plus d’étiquette', el('sondeLabel').hidden, true);

    const css = fs.readFileSync(path.join(GAME_DIR, 'style.css'), 'utf8');
    const regle = css.slice(css.indexOf('.sonde-label {'), css.indexOf('}', css.indexOf('.sonde-label {')));
    check('texte fin et petit (≤ 0,75 rem, graisse normale)', /font-size: 0\.(6|7)\d*rem/.test(regle) && /font-weight: 400/.test(regle));

    G().reinitialiserSonde();
    G().setExperience(0);
    resetToIdle();
}

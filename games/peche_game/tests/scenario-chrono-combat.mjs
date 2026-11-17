// ---------------------------------------------------------------------------
// Scénario : chrono du combat = minimum fixe + temps × distance.
// Un poisson ferré TOUT PRÈS laisse toujours le temps de le ramener.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { group, check, GAME_DIR } from './harness.mjs';
import { TEMPS_COMBAT_MIN, TEMPS_COMBAT_DISTANCE_MAX, chronoCombat } from '../chronoCombat.js';

// combat.js passe Math.max(4, distance du lancer).
const chrono = (distance, difficulte, avantage, capTemps) => chronoCombat(Math.max(4, distance), difficulte, avantage, capTemps);

export function run() {
    group('Chrono du combat : minimum + temps × distance');
    const src = fs.readFileSync(path.join(GAME_DIR, 'combat.js'), 'utf8');
    check('combat.js utilise chronoCombat', /struggleTimeLeft = chronoCombat\(baseLength/.test(src));
    check('le minimum est d’au moins 7 s', TEMPS_COMBAT_MIN >= 7, String(TEMPS_COMBAT_MIN));
    // Pire cas : poisson tout près, mode Dur, ferrage raté (avantage au poisson 1,4).
    const pres = chrono(4, 1.6, 1.4, 1);
    check('poisson tout près, mode dur, ferrage raté : ≥ 7 s', pres >= 7, pres.toFixed(2) + ' s');
    const loin = chrono(60, 1.3, 1, 1);
    check('un poisson lointain a nettement plus de temps', loin > pres + 8, loin.toFixed(2) + ' s');
    check('le temps croît avec la distance', chrono(10, 1.3, 1, 1) < chrono(30, 1.3, 1, 1));
    check('chrono plafonné', chrono(1000, 1, 0.5, 1.2) <= TEMPS_COMBAT_MIN + TEMPS_COMBAT_DISTANCE_MAX * 1.5 * 1.2 + 1e-9);
}

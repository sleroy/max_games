// ---------------------------------------------------------------------------
// chronoCombat.js — temps limite d'un combat (fonction PURE, sans three).
// Chrono = TEMPS_COMBAT_MIN + TEMPS_PAR_UNITE × distance du lancer (part bornée).
// Le minimum n'est réduit ni par la difficulté ni par un mauvais ferrage : un poisson
// pris tout près laisse toujours le temps de le ramener. La part « distance » se
// resserre quand la difficulté monte (difficulte) ou qu'on a ferré trop tard (avantage > 1).
// ---------------------------------------------------------------------------
export const TEMPS_COMBAT_MIN = 7;             // s, même pour un poisson tout près
export const TEMPS_PAR_UNITE = 0.5;            // s par unité de fil (≈ 1 s par mètre)
export const TEMPS_COMBAT_DISTANCE_MAX = 16;   // s, plafond de la part « distance »

export function chronoCombat(distance, difficulte, avantage, capTemps) {
    const partDistance = Math.min(TEMPS_COMBAT_DISTANCE_MAX, (distance * TEMPS_PAR_UNITE) / difficulte);
    return TEMPS_COMBAT_MIN + partDistance * (2 - avantage) * capTemps;
}

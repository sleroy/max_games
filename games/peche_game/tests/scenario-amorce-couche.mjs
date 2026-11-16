// ---------------------------------------------------------------------------
// Scénario : bugs d'amorçage / touche corrigés (signalés par le joueur 2026-11-16).
//  - un poisson d'une AUTRE couche que le nuage d'amorce l'ignore mais continue de nager (il était figé 60 s) ;
//  - la clochette des scions du quiver (capacité « sonnette ») existe vraiment : capaciteBouchon() la renvoie.
// ---------------------------------------------------------------------------
import { SPECIES, SCIONS } from '../especes.js';
import { group, check, checkEqual, G, step, stepFor, stepUntil, resetToIdle, clearLilyPads, parkFish } from './harness.mjs';

export function run() {
    group('Amorce : un poisson d’une autre couche ne se fige plus ; clochette des scions');
    const e = G().etat;
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    parkFish();
    // Un nuage d'amorce au bout d'un vrai lancer d'amorce.
    G().setFeedMode(true);
    G().startFeedCharge({ x: 0, y: 0, z: -30 });
    stepFor(0.3);
    G().releaseFeed();
    stepUntil(() => G().getFeedState() === 'idle', 3);
    check('un nuage d’amorce est bien là', !!e.chum && e.chum.strength >= 0, String(!!e.chum));
    e.chum.age = 0;
    e.chum.position.y = -0.2;                                         // le nuage est en surface
    // Gardon DANS le rayon de détection, mais 3 unités plus bas que le nuage : couche différente.
    const gardon = G().spawnFish(SPECIES.find(s => s.id === 'gardon'));
    const d = gardon.userData;
    d.depth = -3.2;
    d.profNat = undefined;
    gardon.position.set(e.chum.position.x + 9, d.depth - d.topOffset, e.chum.position.z);
    d.vx = 1.2;
    d.vz = 0;
    d.hooked = false;
    const x0 = gardon.position.x;
    const z0 = gardon.position.z;
    for (let i = 0; i < 20; i++) { e.chum.position.y = -0.2; step(0.05); }   // le nuage reste en surface pendant le test
    const bouge = Math.hypot(gardon.position.x - x0, gardon.position.z - z0);
    check('le poisson d’une autre couche continue de nager (il n’est plus figé)', bouge > 0.5, bouge.toFixed(2) + ' unités en 1 s');
    check('… et ne se laisse pas attirer par le nuage', d.attire === false, String(d.attire));
    G().fishes.splice(G().fishes.indexOf(gardon), 1);
    resetToIdle();

    // Clochette des scions.
    const capa = G().getCapaciteBouchon();
    checkEqual('un bouchon ordinaire : pas de clochette', capa.sonnette, false);
    const avecSonnette = SCIONS.filter(s => s.capacite && s.capacite.sonnette);
    check('des scions à clochette existent', avecSonnette.length >= 1, String(avecSonnette.length));
    G().setTechnique('quiver');
    G().setExperience(1000);
    G().acheterScion(avecSonnette[0].id);
    G().setScion(avecSonnette[0].id);
    check('un scion à clochette : capaciteBouchon() la renvoie', G().getCapaciteBouchon().sonnette === true, String(G().getCapaciteBouchon().sonnette));
    G().setTechnique('bouchon');
    G().setExperience(0);
}

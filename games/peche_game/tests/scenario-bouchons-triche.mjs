// ---------------------------------------------------------------------------
// Scénario : bouchons TRICHES payants (géant, détecteur sonore, balise « FERRER ! »).
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el, state, stepUntil, resetToIdle, clearLilyPads, castTo, parkFish, step, forceBite } from './harness.mjs';

export function run() {
    group('Bouchons triches : géant, détecteur, balise');
    resetToIdle();
    clearLilyPads();
    G().setDifficulty('normal');
    const triches = G().getFloats().filter(f => f.triche);
    checkEqual('3 bouchons triches en boutique', triches.length, 3);
    check('ils sont payants et ne rapportent que la moitié de l’XP',
        triches.every(f => f.prix > 0 && f.capacite.xp === 0.5), triches.map(f => f.id + ':' + f.prix).join(' '));
    checkEqual('aucun n’est offert au départ', triches.some(f => G().getBouchonsPossedes().indexOf(f.id) >= 0), false);

    G().setExperience(1000);
    triches.forEach(f => G().acheterBouchon(f.id));

    // --- Géant : corps et tige 3 fois plus gros ---
    const taille0 = G().etat.floatBody.scale.x;
    G().setFloatType('geant');
    checkEqual('géant : capacité', G().getCapaciteBouchon().geant, true);
    check('géant : le corps grossit ×8', G().etat.floatBody.scale.x === taille0 * 8, String(G().etat.floatBody.scale.x));
    G().setFloatType('balise');
    check('balise : énorme aussi (×5)', G().etat.floatBody.scale.x === taille0 * 5, String(G().etat.floatBody.scale.x));
    G().setFloatType('anglaise');
    checkEqual('un bouchon normal retrouve sa taille', G().etat.floatBody.scale.x, taille0);

    // --- Balise : « FERRER ! » affiché en mode Normal ---
    G().setFloatType('balise');
    resetToIdle();
    castTo(0, -25);
    parkFish();
    const fl = G().floatGroup.position;
    const poisson = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    poisson.position.set(fl.x, -2, fl.z);
    poisson.userData.depth = G().etat.HOOK_DEPTH;
    poisson.userData.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    poisson.userData.vx = 0; poisson.userData.vz = 0;
    check('la touche arrive', stepUntil(() => state() === 'bite', 8), state());
    check('mode Normal + balise : « FERRER ! » pendant la vraie touche',
        stepUntil(() => el('kidCue').classList.contains('active'), 45), G().getBitePhase());
    checkEqual('balise seule : pas de bip', G().etat.bipsDetecteur || 0, 0);
    G().hookFish();
    resetToIdle();

    // --- Détecteur : 1 bip à l'approche, 3 bips à la vraie touche ---
    G().setFloatType('detecteur');
    G().etat.bipsDetecteur = 0;
    castTo(0, -25);
    forceBite();
    check('détecteur : la touche arrive', state() === 'bite', state());
    checkEqual('détecteur : 1 bip à l’approche', G().etat.bipsDetecteur, 1);
    check('détecteur : la vraie touche', stepUntil(() => G().getBitePhase() === 'touche', 45), G().getBitePhase());
    step(1 / 60);
    checkEqual('détecteur : + 3 bips à la vraie touche', G().etat.bipsDetecteur, 4);
    checkEqual('détecteur seul : pas de « FERRER ! » en Normal', el('kidCue').classList.contains('active'), false);
    G().setFloatType('anglaise');
    G().setExperience(0);
    resetToIdle();
}

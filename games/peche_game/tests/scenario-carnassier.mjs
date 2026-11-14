// ---------------------------------------------------------------------------
// Scénario 63 : ATTAQUE DE CARNASSIER pendant la remontée.
// On ramène une petite proie (gardon) ; un brochet proche attaque, la proie
// s'échappe, le brochet prend l'hameçon et le combat repart avec un avantage
// au poisson. Un carnassier trop loin n'attaque pas.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, el, resetToIdle, clearLilyPads, startFight, step, crankTurns, state
} from './harness.mjs';

export function run() {
    group('63) Attaque de carnassier pendant la remontée');
    G().recommencerPartie();
    resetToIdle();
    clearLilyPads();

    // 1) On ferre une petite proie et on gagne son combat.
    const proie = startFight(0, -25);
    proie.userData.especeId = 'gardon';
    proie.userData.espece = 'Gardon';
    proie.userData.size = 0.3;
    proie.userData.power = 0.6;
    proie.userData.aggression = 0.7;
    proie.userData.weight = 0.3;
    let guard = 0;
    while (state() === 'struggle' && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('la petite proie est ramenée', state(), 'reeling');
    checkEqual('l’hameçon porte bien la petite proie', G().getHookedEspece(), 'gardon');

    // 2) Un carnassier loin ne doit pas attaquer.
    const predateur = G().fishes.find(function (fish) {
        return fish !== proie && !fish.userData.hooked && !fish.userData.biting;
    });
    predateur.userData.especeId = 'brochet';
    predateur.userData.espece = 'Brochet';
    predateur.userData.size = 1.1;
    predateur.userData.power = 1.25;
    predateur.userData.aggression = 1.5;
    predateur.userData.weight = 4.5;
    predateur.userData.hooked = false;
    predateur.userData.biting = false;
    predateur.userData.targeting = false;
    predateur.visible = true;
    predateur.userData.vx = 0;
    predateur.userData.vz = 0;
    const nbFishes = G().fishes.length;
    predateur.position.set(G().floatGroup.position.x + 30, -1.2,
        G().floatGroup.position.z);
    step(0.05);
    checkEqual('un carnassier loin n’attaque pas', state(), 'reeling');
    checkEqual('la proie reste sur la ligne', G().getHookedEspece(), 'gardon');

    // 3) Le carnassier passe près de la ligne : il attaque et remplace la proie.
    predateur.position.set(G().floatGroup.position.x + 2, -1.2,
        G().floatGroup.position.z);
    predateur.userData.vx = 0;
    predateur.userData.vz = 0;
    step(0.05);
    checkEqual('le carnassier attaque et remplace la proie', state(), 'struggle');
    checkEqual('l’hameçon porte maintenant le brochet', G().getHookedEspece(), 'brochet');
    check('c’est bien le brochet qui est ferré', G().getHookedFish() === predateur);
    check('la petite proie est libérée et visible',
        proie.userData.hooked === false && proie.visible === true);
    check('le carnassier est marqué ferré', predateur.userData.hooked === true);
    checkEqual('l’étang garde ses 20 poissons', G().fishes.length, nbFishes);

    // 4) Le combat est celui du brochet, avec un avantage au poisson.
    checkEqual('le combat est celui du brochet', G().getStruggleStyle(),
        G().styleEspece('brochet').nom);
    check('le carnassier a l’avantage',
        el('struggleInfo').textContent.indexOf('avantage au poisson') >= 0,
        el('struggleInfo').textContent);
    check('le joueur est prévenu de l’attaque',
        el('status').textContent.indexOf('attaqué') >= 0, el('status').textContent);
    check('une popup annonce l’attaque',
        G().getFloatingTexts().some(function (texte) {
            return texte.indexOf('Brochet') >= 0 && texte.indexOf('attaque') >= 0;
        }), G().getFloatingTexts().join(' / '));
    const popup = G().getFloatingTextDetails().find(function (item) {
        return item.texte.indexOf('Brochet') >= 0 && item.texte.indexOf('attaque') >= 0;
    });
    check('la popup d’attaque est une vraie popup 3D', !!popup,
        G().getFloatingTexts().join(' / '));
    if (popup) {
        check('la popup d’attaque est ancrée au bouchon',
            Math.hypot(popup.x - G().floatGroup.position.x,
                popup.z - G().floatGroup.position.z) < 1,
            'popup ' + popup.x.toFixed(2) + ',' + popup.z.toFixed(2)
                + ' / bouchon ' + G().floatGroup.position.x.toFixed(2) + ','
                + G().floatGroup.position.z.toFixed(2));
    }

    // 5) Une espèce qui n'est PAS une petite proie n'est jamais attaquée.
    resetToIdle();
    G().demarrerJeu();
    const carpe = startFight(0, -25);
    carpe.userData.especeId = 'carpe';
    carpe.userData.espece = 'Carpe';
    guard = 0;
    while (state() === 'struggle' && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('une carpe est ramenée', state(), 'reeling');
    checkEqual('l’hameçon porte la carpe', G().getHookedEspece(), 'carpe');
    const predateurCarpe = G().fishes.find(function (fish) {
        return fish !== carpe && !fish.userData.hooked && !fish.userData.biting;
    });
    predateurCarpe.userData.especeId = 'brochet';
    predateurCarpe.userData.espece = 'Brochet';
    predateurCarpe.userData.hooked = false;
    predateurCarpe.userData.biting = false;
    predateurCarpe.userData.targeting = false;
    predateurCarpe.visible = true;
    predateurCarpe.userData.vx = 0;
    predateurCarpe.userData.vz = 0;
    predateurCarpe.position.set(G().floatGroup.position.x + 2, -1.2,
        G().floatGroup.position.z);
    step(0.05);
    checkEqual('un carnassier n’attaque pas une carpe', state(), 'reeling');
    checkEqual('la carpe reste sur la ligne', G().getHookedEspece(), 'carpe');

    resetToIdle();
    G().demarrerJeu();
}

export default run;

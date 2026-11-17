// ---------------------------------------------------------------------------
// Scénario : PLUSIEURS amorces en même temps (bug signalé par le joueur 2026-11-16 :
// « si j'en envoie une seconde, la première disparaît »).
//  - chaque boule lancée crée son propre nuage ; les précédents restent en place ;
//  - chaque poisson va vers le nuage le plus proche qui l'attire ;
//  - chaque nuage vieillit, dérive et s'éteint seul ;
//  - plafond de sécurité : 8 nuages (le plus ancien est retiré et libéré).
// ---------------------------------------------------------------------------
import { SPECIES } from '../especes.js';
import { group, check, checkEqual, G, step, resetToIdle, clearLilyPads, parkFish } from './harness.mjs';

/** Lance une boule d'amorce vers (x, z) ; renvoie les secondes écoulées jusqu'à l'atterrissage. */
function lancerAmorce(x, z) {
    const e = G().etat;
    e.amorceDepartRestante = 20;            // assez de boules : le stock n'est pas l'objet du test
    G().setFeedMode(true);
    G().startFeedCharge({ x, y: 0, z });
    let ecoule = 0;
    for (let i = 0; i < 6; i++) { step(0.05); ecoule += 0.05; }
    G().releaseFeed();
    for (let i = 0; i < 100 && G().getFeedState() !== 'idle'; i++) { step(0.05); ecoule += 0.05; }
    return ecoule;
}

/** Observe les libérations (dispose) d'un nuage : matériau et texture. */
function espionner(nuage) {
    const compte = { materiau: 0, texture: 0 };
    nuage.material.addEventListener('dispose', () => { compte.materiau++; });
    nuage.material.map.addEventListener('dispose', () => { compte.texture++; });
    return compte;
}

export function run() {
    group('Amorces multiples : chaque boule garde son nuage');
    const e = G().etat;
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    parkFish();
    e.viderChums();
    checkEqual('aucun nuage au départ', e.chums.length, 0);

    // --- Deux amorces à deux endroits : 2 nuages vivants ---
    lancerAmorce(-25, -30);
    check('la 1re amorce crée un nuage', e.chums.length === 1, String(e.chums.length));
    const A = e.chums[0];
    const ax = A.position.x;
    const az = A.position.z;
    const ageAvant = A.age;
    const duree = lancerAmorce(25, -30);
    const B = e.chums[1];
    checkEqual('2 nuages vivants après deux amorces', e.chums.length, 2);
    check('le 1er nuage n’a pas été retiré', e.chums[0] === A && A.group.parent !== null, 'même objet, toujours dans la scène');
    check('le 2e nuage est un autre nuage, avec son propre groupe et matériau',
        !!B && B !== A && B.group !== A.group && B.material !== A.material);
    check('les deux nuages sont à deux endroits différents',
        Math.hypot(A.position.x - B.position.x, A.position.z - B.position.z) > 2 * A.radius,   // plus que deux sphères de 6 u
        Math.hypot(A.position.x - B.position.x, A.position.z - B.position.z).toFixed(1) + ' unités');
    // La 2e amorce ne modifie ni l'âge ni la position de la 1re : elle vieillit seulement du temps écoulé.
    check('la 2e amorce ne touche pas à l’âge de la 1re (seul le temps passe)',
        Math.abs(A.age - (ageAvant + duree)) < 0.2,
        'âge ' + A.age.toFixed(2) + ' attendu ' + (ageAvant + duree).toFixed(2));
    // Le vent météo n'est jamais exactement nul (rafales) : la dérive propre au nuage reste < 0,1 u.
    check('la 2e amorce ne déplace pas la 1re (seule la dérive au vent la bouge)',
        Math.hypot(A.position.x - ax, A.position.z - az) < 0.1,
        Math.hypot(A.position.x - ax, A.position.z - az).toFixed(3));
    check('chaque nuage garde sa durée de vie (60 s), son rayon (6 u) et sa zone d’attraction (18 u)',
        [A, B].every(n => n.lifetime === 60 && n.radius === 6 && n.detect === 18));
    check('le 1er nuage est plus âgé que le 2e', A.age > B.age, A.age.toFixed(2) + ' > ' + B.age.toFixed(2));

    // --- Chaque poisson vise le nuage qui est près de lui ---
    for (let i = 0; i < 40; i++) { step(0.05); }          // les nuages coulent à la profondeur de la ligne
    const gardon = SPECIES.find(s => s.id === 'gardon');
    function poissonPres(nuage, dx, dz) {
        const f = G().spawnFish(gardon);
        const d = f.userData;
        d.hooked = false;
        d.profNat = undefined;
        d.depth = nuage.position.y;                         // même couche que le nuage
        f.position.set(nuage.position.x + dx, d.depth - d.topOffset, nuage.position.z + dz);
        d.vx = 0;
        d.vz = 0;
        return f;
    }
    const fA = poissonPres(A, 9, 0);
    const fB = poissonPres(B, -9, 0);
    const vers = (f, n) => (n.position.x - f.position.x) * f.userData.vx + (n.position.z - f.position.z) * f.userData.vz;
    step(0.05);
    check('le poisson près du nuage A est attiré', fA.userData.attire === true, String(fA.userData.attire));
    check('le poisson près du nuage B est attiré', fB.userData.attire === true, String(fB.userData.attire));
    check('le poisson près de A nage vers A', vers(fA, A) > 0, vers(fA, A).toFixed(3));
    check('le poisson près de B nage vers B', vers(fB, B) > 0, vers(fB, B).toFixed(3));
    const dA0 = Math.hypot(fA.position.x - A.position.x, fA.position.z - A.position.z);
    const dB0 = Math.hypot(fB.position.x - B.position.x, fB.position.z - B.position.z);
    for (let i = 0; i < 60; i++) { step(0.05); }
    check('le poisson de A se rapproche de A',
        Math.hypot(fA.position.x - A.position.x, fA.position.z - A.position.z) < dA0 - 1);
    check('le poisson de B se rapproche de B',
        Math.hypot(fB.position.x - B.position.x, fB.position.z - B.position.z) < dB0 - 1);
    G().fishes.splice(G().fishes.indexOf(fA), 1);
    G().fishes.splice(G().fishes.indexOf(fB), 1);

    // --- Entre deux nuages : le plus proche l'emporte ---
    // Les deux nuages sont rapprochés (20 u) : un poisson à 14 u de A et 6 u de B les sent tous les deux.
    A.position.set(0, A.position.y, -30);
    B.position.set(20, B.position.y, -30);
    const milieu = poissonPres(A, 14, 0);                    // x = 14 : 14 u de A, 6 u de B
    milieu.userData.depth = A.position.y;
    B.position.y = A.position.y;
    step(0.01);
    check('entre deux nuages, le poisson vise le plus proche (B)',
        vers(milieu, B) > 0 && milieu.userData.vx > 0, 'vx = ' + milieu.userData.vx.toFixed(3));
    // On inverse : B s'éloigne, A devient le plus proche.
    B.position.x = 60;
    milieu.userData.vx = 0;
    milieu.userData.vz = 0;
    milieu.position.x = 10;                                  // 10 u de A
    milieu.userData.chumCible = null;
    step(0.01);
    check('si B s’éloigne, le poisson revient vers A', milieu.userData.vx < 0, 'vx = ' + milieu.userData.vx.toFixed(3));
    // Hors de portée (18 u) de tous les nuages : il n'est plus attiré.
    milieu.position.x = 35;
    milieu.userData.vx = 0;
    step(0.01);
    check('hors de portée de tous les nuages, le poisson n’est pas attiré', milieu.userData.attire === false,
        String(milieu.userData.attire));
    G().fishes.splice(G().fishes.indexOf(milieu), 1);

    // --- Durées de vie indépendantes ---
    e.viderChums();
    lancerAmorce(-25, -30);
    lancerAmorce(25, -30);
    const [N1, N2] = e.chums;
    const spy1 = espionner(N1);
    const spy2 = espionner(N2);
    N2.age = 10;                                              // le 2e est installé : plein effet
    N1.age = N1.lifetime - 1.5;                               // le 1er touche à sa fin
    step(0.05);
    check('le 1er nuage s’estompe avant le 2e (fondu propre à chacun)', N1.strength < N2.strength,
        N1.strength.toFixed(2) + ' < ' + N2.strength.toFixed(2));
    for (let i = 0; i < 40; i++) { step(0.05); }              // 2 s : N1 s'éteint
    checkEqual('le 1er nuage s’éteint, le 2e reste', e.chums.length, 1);
    check('le survivant est bien le 2e', e.chums[0] === N2);
    check('le nuage éteint est retiré de la scène', N1.group.parent === null);
    check('son matériau et sa texture sont libérés (dispose)', spy1.materiau === 1 && spy1.texture === 1,
        spy1.materiau + ' / ' + spy1.texture);
    check('le nuage encore vivant n’est pas libéré', spy2.materiau === 0 && spy2.texture === 0 && N2.group.parent !== null);
    check('le 2e a gardé sa propre durée de vie', N2.age < N2.lifetime - 3, N2.age.toFixed(1) + ' s');
    N2.age = N2.lifetime - 0.1;
    step(0.2);
    checkEqual('le 2e s’éteint à son tour : plus aucun nuage', e.chums.length, 0);
    check('le 2e est retiré et libéré aussi', N2.group.parent === null && spy2.materiau === 1 && spy2.texture === 1);

    // --- Plafond de sécurité : 8 nuages ---
    e.viderChums();
    lancerAmorce(-20, -30);
    const premier = e.chums[0];
    const spyPremier = espionner(premier);
    for (let i = 0; i < 7; i++) { lancerAmorce(-20 + i * 6, -35); }
    checkEqual('8 lancers : 8 nuages', e.chums.length, 8);
    check('le plus ancien est encore là au 8e', e.chums[0] === premier && premier.group.parent !== null);
    lancerAmorce(30, -40);                                     // le 9e
    checkEqual('9 lancers : 8 nuages vivants au maximum', e.chums.length, 8);
    check('le plus ancien est retiré de la scène', premier.group.parent === null && !e.chums.includes(premier));
    check('le plus ancien est libéré (dispose du matériau et de la texture)',
        spyPremier.materiau === 1 && spyPremier.texture === 1, spyPremier.materiau + ' / ' + spyPremier.texture);
    check('le dernier lancé est le plus récent du tableau', e.chums[7].age < e.chums[0].age);
    check('aucun nuage mort ne reste dans le tableau', e.chums.every(n => n.age < n.lifetime));
    check('tous les nuages vivants sont dans la scène', e.chums.every(n => n.group.parent === G().scene));

    // --- Nouvelle partie : tout est retiré ---
    e.viderChums();
    checkEqual('viderChums retire tous les nuages', e.chums.length, 0);
    G().setFeedMode(false);
    resetToIdle();
}

export default run;

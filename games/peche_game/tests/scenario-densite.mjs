// ---------------------------------------------------------------------------
// Scénario : DENSITÉ DE POISSONS ET CULLING
//
// A. PETITS POISSONS DE BORD (poissons.js, COMPORTEMENTS[x].bord) : ils naissent et
//    vivent dans la bande de rive. C'est ce qui rend un grand plan d'eau pêchable :
//    répartis uniformément, les poissons d'une rivière de 6 ha restent hors de portée.
// B. CULLING (culling.js) : seuls les poissons qui peuvent atteindre l'hameçon sont
//    simulés ; les autres sont GELÉS. Vérifié sur la vraie population de la rivière.
//
// Le harnais désactive le culling pour les scénarios de comportement (poissons
// téléportés hors de portée) : ce scénario est le seul à le rallumer.
// ---------------------------------------------------------------------------
import { group, check, G, el, fire, resetToIdle, stepFor } from './harness.mjs';
import { COMPORTEMENTS } from '../especes.js';

function choisirSurAccueil(id) {
    el('accueilMilieu' + id.charAt(0).toUpperCase() + id.slice(1)).checked = true;
    fire('accueilMilieu' + id.charAt(0).toUpperCase() + id.slice(1), 'change');
}

/** Distance (unités) d'un point à la rive, mesurée dans SA direction : rayon du contour − rayon du point. */
function distanceAuBord(x, z) {
    const c = G().getPondCenter();
    const dx = x - c.x;
    const dz = z - c.z;
    return G().getRayonEtang(Math.atan2(dz, dx)) - Math.hypot(dx, dz);
}

/** Domaine vital d'un poisson (là où il vit vraiment), pas sa position d'un instant. */
function domaine(f) {
    const d = f.userData;
    return {
        x: Number.isFinite(d.homeX) ? d.homeX : f.position.x,
        z: Number.isFinite(d.homeZ) ? d.homeZ : f.position.z
    };
}

function distancesAuBord(deBord) {
    return G().fishes.filter(function (f) {
        const comp = COMPORTEMENTS[f.userData.especeId];
        return !!comp && !!comp.bord === deBord;
    }).map(function (f) {
        const p = domaine(f);
        return distanceAuBord(p.x, p.z);
    });
}

function mediane(valeurs) {
    const v = valeurs.slice().sort(function (a, b) { return a - b; });
    return v.length ? v[Math.floor(v.length / 2)] : 0;
}

function mouvement(f, x0, z0) {
    return Math.hypot(f.position.x - x0, f.position.z - z0);
}

export function run() {
    group('78) Densité : petits poissons au bord, culling des poissons hors de portée');

    // --- A) Les petits poissons de bord vivent près de la rive -----------------------------
    ['plaine', 'riviere'].forEach(function (id) {
        // Passer par un autre biotope force un monde NEUF (sinon un biotope déjà choisi n'est pas retiré).
        // Trois mondes tirés à la suite : une seule plaine (≈ 47 poissons du large) dépend trop
        // du tirage (les poissons du large suivent leurs fonds préférés, parfois près du bord).
        const bord = [];
        const large = [];
        for (let essai = 0; essai < 3; essai++) {
            choisirSurAccueil(id === 'plaine' ? 'canal' : 'plaine');
            choisirSurAccueil(id);
            bord.push(...distancesAuBord(true));
            large.push(...distancesAuBord(false));
        }
        check(id + ' : le biotope a bien deux familles de poissons',
            bord.length > 0 && large.length > 0, bord.length + ' de bord / ' + large.length + ' du large');
        // Bande de rive : naissance à 12 (marge) + 15 (bande) du bord ⇒ ≤ 27 unités, et le
        // domaine est borné à la bande, donc le poisson y reste.
        check(id + ' : les petits poissons restent dans la bande de rive (médiane ≤ 25 u)',
            mediane(bord) <= 25, 'médiane ' + mediane(bord).toFixed(1) + ' u');
        check(id + ' : trois sur quatre à moins de 25 unités de la rive',
            bord.filter(function (d) { return d <= 25; }).length >= bord.length * 0.75,
            bord.filter(function (d) { return d <= 25; }).length + ' / ' + bord.length);
        // Seuil 1,25 (1,4 avant) : mesuré seul (canal → plaine, 5 mondes), le rapport de la plaine vaut 1,36
        // (bord 12,4 u, large 16,9 u : les obstacles et la pêche du bord rapprochent aussi les poissons du large).
        // 1,4 ne passait que selon les biotopes peuplés avant ce scénario (le tirage des obstacles continue).
        check(id + ' : … et bien plus près de la rive que les autres',
            mediane(bord) * 1.25 <= mediane(large),
            'bord ' + mediane(bord).toFixed(1) + ' u contre large ' + mediane(large).toFixed(1) + ' u');
    });

    // Sur la rivière (le plan d'eau qui posait problème) : beaucoup de poissons à portée
    // d'un lancer depuis la berge. Avant : 240 poissons sur 6,2 ha, quasi tous au large.
    choisirSurAccueil('riviere');
    const aPortee = G().fishes.filter(function (f) {
        const d = f.userData;
        const x = Number.isFinite(d.homeX) ? d.homeX : f.position.x;
        const z = Number.isFinite(d.homeZ) ? d.homeZ : f.position.z;
        return distanceAuBord(x, z) <= 30;
    }).length;
    check('rivière : au moins 400 poissons à moins de 30 unités d’une rive',
        aPortee >= 400, aPortee + ' sur ' + G().fishes.length);

    // --- B) Culling : poisson loin = gelé, poisson près = simulé ---------------------------
    choisirSurAccueil('plaine');
    resetToIdle();
    const etat = G().etat;
    etat.cullingActif = true;
    const p = G().angler.position;
    const libres = G().fishes.filter(function (f) { return !f.userData.hooked && !f.userData.biting; });
    check('assez de poissons libres pour le test', libres.length >= 2, String(libres.length));

    // LOIN du pêcheur (200 unités, hors de la portée du lancer + son domaine) : gelé.
    const loin = libres[0];
    loin.position.set(p.x + 200, -2, p.z);
    loin.userData.homeX = p.x + 200;
    loin.userData.homeZ = p.z;
    loin.userData.homeRadius = 10;
    loin.userData.vx = 3;
    loin.userData.vz = 3;
    const lionX = loin.position.x;
    const lionZ = loin.position.z;
    stepFor(1);
    check('poisson hors de portée : GELÉ (il n’a pas bougé)', mouvement(loin, lionX, lionZ) === 0,
        mouvement(loin, lionX, lionZ).toExponential(2) + ' u');

    // PRÈS du pêcheur : simulé.
    const proche = libres[1];
    proche.position.set(p.x + 8, -2, p.z);
    proche.userData.homeX = p.x + 8;
    proche.userData.homeZ = p.z;
    proche.userData.homeRadius = 10;
    proche.userData.vx = 3;
    proche.userData.vz = 3;
    const procheX = proche.position.x;
    const procheZ = proche.position.z;
    stepFor(1);
    check('poisson à portée : SIMULÉ (il nage)', mouvement(proche, procheX, procheZ) > 0.5,
        mouvement(proche, procheX, procheZ).toFixed(2) + ' u');

    // Un poisson qui MORD n'est jamais gelé, même loin : sa place est sur le bouchon.
    loin.userData.biting = true;
    loin.userData.vx = 0;
    loin.userData.vz = 0;
    stepFor(0.2);
    check('poisson qui mord : jamais gelé (il est collé au bouchon)',
        Math.hypot(loin.position.x - G().floatGroup.position.x, loin.position.z - G().floatGroup.position.z) < 0.5,
        loin.position.x.toFixed(1) + ',' + loin.position.z.toFixed(1));
    loin.userData.biting = false;

    // --- C) Sur la vraie population : une minorité est simulée ----------------------------
    choisirSurAccueil('riviere');
    resetToIdle();
    etat.cullingActif = true;
    const avant = G().fishes.map(function (f) { return { x: f.position.x, z: f.position.z }; });
    stepFor(1.5);
    let bouges = 0;
    G().fishes.forEach(function (f, i) {
        if (Math.hypot(f.position.x - avant[i].x, f.position.z - avant[i].z) > 1e-6) { bouges += 1; }
    });
    check('rivière : le culling épargne la majorité des ' + G().fishes.length + ' poissons',
        bouges > 0 && bouges < G().fishes.length * 0.75,
        bouges + ' poissons simulés sur ' + G().fishes.length);

    // Remise en état pour les scénarios suivants.
    etat.cullingActif = false;
    choisirSurAccueil('plaine');
}

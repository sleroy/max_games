// ---------------------------------------------------------------------------
// Scénario : le sonar pinge et émet des ondes jaunes quand il repère un poisson.
//
// Un « ping » de sous-marin (son) + une onde jaune qui s'étend à la surface
// partent de la bouée quand un poisson entre dans le rayon de 12 m — mais
// pas plus d'un ping toutes les 1,8 s. Ranger le sonar efface les ondes.
//
// Depuis la v179 (§14.7) la bouée est LANCÉE comme une amorce : clic sur 📡 (visée),
// maintien (jauge), relâchement (arc de vol), plouf. Le scan ne démarre qu'au plouf
// et se centre sur le point d'impact réel (groupe 71b).
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import {
    GAME_DIR, group, check, checkEqual, checkClose,
    G, el, fire, step, stepFor, stepUntil, state,
    resetToIdle, clearLilyPads, castTo, forceBite, startFight, lancerSonar
} from './harness.mjs';

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Clic sur 📡 + appui sur l'eau en `visee` + maintien : renvoie sans relâcher. */
function viserSonar(visee, maintien) {
    fire('sonarButton', 'click');
    G().startFeedCharge({ x: visee.x, y: 0, z: visee.z });
    stepFor(maintien);
}

/** Vole jusqu'au plouf (ou jusqu'à la fin du vol) : la bouée est posée si elle est tombée dans l'eau. */
function attendreAtterrissage() {
    return stepUntil(() => G().getFeedState() === 'idle', 3);
}

/** Écart d'angle (degrés) entre deux directions (vecteurs x, z). */
function ecartDegres(a, b) {
    const cos = (a.x * b.x + a.z * b.z) / ((Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z)) || 1);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
}

/** Décalage dû au vent pour la bouée (voir `ventFacteur` du sonar : 2,5, comme le lancer de ligne). */
function ventBouee() {
    const v = G().getWind();
    return { x: Math.cos(v.dir) * v.strength * 2.5, z: Math.sin(v.dir) * v.strength * 2.5 };
}

/**
 * Charge la jauge jusqu'à la puissance nécessaire pour tomber PILE sur `cible` (vent compensé),
 * puis relâche. Précision ≈ 0,1 unité (pas de 2 ms). Renvoie le point d'impact calculé.
 */
function lancerSonarSur(cible) {
    const vent = ventBouee();
    fire('sonarButton', 'click');
    G().startFeedCharge({ x: cible.x - vent.x, y: 0, z: cible.z - vent.z });
    let n = 0;
    while (G().getFeedPower() < G().getFeedTargetPower() && n++ < 5000) { step(0.002); }
    G().releaseFeed();
    return G().getFeedLanding();
}

export function run() {
    group('71) Sonar : ping de sous-marin et ondes jaunes à la surface');

    // Les scénarios antérieurs peuvent avoir ACHETÉ et POSÉ le sonar : on
    // repart d'un carnet neuf pour que l'achat de ce scénario soit réel.
    if (G().reinitialiserSonar) { G().reinitialiserSonar(); }
    resetToIdle();
    clearLilyPads();
    G().setExperience(300);
    fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'sonar' } } });
    checkEqual('le sonar est acheté', G().getExperience(), 150);

    const oldPositions = G().fishes.map(fish => fish.position.clone());

    // 1) Poisson DANS le rayon : le premier balayage (au plouf) doit pinger.
    //    On lance la bouée ; dès le relâchement on sait où elle tombera : un poisson y est posé à 5 unités.
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    viserSonar({ x: 0, z: -25 }, 0.4);
    G().releaseFeed();
    const impact = G().getFeedLanding();
    G().fishes.forEach((fish, index) => {
        fish.position.set(impact.x + (index === 0 ? 5 : 200), -2, impact.z);
    });
    attendreAtterrissage();
    checkEqual('la bouée du sonar est posée après le plouf', G().sonarBuoy.visible, true);
    checkEqual('poser le sonar avec un poisson à portée pinge tout de suite',
        G().getSonarPings(), 1);
    checkEqual('une onde jaune part de la bouée', G().getOndesSonar().length, 1);
    const onde = G().getOndesSonar()[0];
    check('l’onde est jaune et transparente',
        onde.material.color.getHex() === 0xffc454 && onde.material.transparent, true);
    check('l’onde est posée à plat sur l’eau',
        Math.abs(onde.rotation.x + Math.PI / 2) < 1e-6, onde.rotation.x.toFixed(3));
    check('l’onde est centrée sur la bouée',
        onde.position.x === G().sonarBuoy.position.x
            && onde.position.z === G().sonarBuoy.position.z,
        onde.position.x + ',' + onde.position.z);

    // 2) Le ping ne se répète pas à chaque balayage (toutes les 0,2 s) :
    //    en 1 s, toujours un seul ping, et l'onde grandit sans avoir disparu.
    stepFor(1);
    checkEqual('un seul ping pendant la première seconde', G().getSonarPings(), 1);
    const ondeVivante = G().getOndesSonar()[0];
    check('l’onde grandit avec le temps', ondeVivante
        && ondeVivante.scale.x > 1 && ondeVivante.material.opacity < 0.85,
        ondeVivante ? 'échelle ' + ondeVivante.scale.x.toFixed(2) : 'absente');
    stepFor(0.5);
    check('l’onde disparaît après sa durée de vie (1,4 s)',
        G().getOndesSonar().length === 0, String(G().getOndesSonar().length));

    // 3) Poisson toujours à portée : un deuxième ping arrive après le délai.
    //    (Le poisson de test est reposé près de la bouée : il a pu nager pendant le vol.)
    const bouee = G().sonarBuoy.position;
    G().fishes.forEach((fish, index) => fish.position.set(bouee.x + (index === 0 ? 5 : 200), -2, bouee.z));
    stepFor(1);
    check('un deuxième ping après le délai de tempo', G().getSonarPings() === 2,
        String(G().getSonarPings()));

    // 4) Plus de poisson à portée : plus aucun ping.
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    stepFor(3);
    checkEqual('poisson parti : pas de nouveau ping', G().getSonarPings(), 2);
    checkEqual('poisson parti : plus d’onde', G().getOndesSonar().length, 0);

    // 5) Ranger le sonar efface les ondes immédiatement.
    // Deux poissons dans le rayon : si le premier est retenu (ferré ou en
    // main à la suite d'un scénario antérieur, donc ignoré par le radar),
    // le suivant reste détectable. Un seul ping quand même (délai de tempo).
    G().fishes.forEach((fish, index) => fish.position.set(
        bouee.x + (index <= 1 ? 5 : 200), -2, bouee.z));
    stepFor(2); // laisse un ping (et son onde) repartir
    check('le poisson revenu déclenche un nouveau ping', G().getSonarPings() >= 3,
        String(G().getSonarPings()));
    fire('sonarButton', 'click'); // ranger
    checkEqual('ranger le sonar efface les ondes', G().getOndesSonar().length, 0);
    const apresRangement = G().getSonarPings();
    stepFor(3);
    checkEqual('sonar rangé : plus aucun ping', G().getSonarPings(), apresRangement);

    G().fishes.forEach((fish, index) => fish.position.copy(oldPositions[index]));

    lancement(oldPositions);
}

// ---------------------------------------------------------------------------
// 71b) Le sonar se LANCE comme une amorce
// ---------------------------------------------------------------------------
function lancement(oldPositions) {
    group('71b) Sonar lancé comme une amorce : visée, puissance, arc, plouf (§14.7)');
    resetToIdle();
    clearLilyPads();
    G().placerAuPoste(0);
    resetToIdle();
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    const pingsDepart = G().getSonarPings();

    // --- Le clic arme la visée : ni bouée, ni radar, ni ping ---
    fire('sonarButton', 'click');
    checkEqual('un clic sur 📡 arme le mode visée', G().isFeedMode(), true);
    checkEqual('la bouée n’apparaît pas au clic (plus de téléportation)', G().sonarBuoy.visible, false);
    checkEqual('le radar reste caché au clic', el('sonarPanel').hidden, true);
    checkEqual('aucun ping au clic', G().getSonarPings(), pingsDepart);
    check('le texte invite à viser et à maintenir', el('status').textContent.includes('maintiens'),
        el('status').textContent);
    check('le bouton propose d’annuler la visée', el('sonarButton').textContent.includes('Annuler'),
        el('sonarButton').textContent);
    checkEqual('l’amorce n’est pas armée à la place', el('feedButton').classList.contains('active'), false);
    check('le bouton Amorce n’affiche pas « prête »', !el('feedButton').textContent.includes('prête'),
        el('feedButton').textContent);

    // --- Même jauge que l'amorce ---
    G().startFeedCharge({ x: 0, y: 0, z: -25 });
    checkEqual('le maintien charge la puissance', G().getFeedState(), 'charging');
    checkEqual('la même jauge s’affiche', el('feedGauge').classList.contains('active'), true);
    check('le repère de la jauge est posé', el('feedGaugeTarget').style.left !== '', el('feedGaugeTarget').style.left);
    const p0 = G().getFeedPower();
    stepFor(0.15);
    check('la puissance oscille (jauge vivante)', G().getFeedPower() !== p0, G().getFeedPower().toFixed(2));
    G().releaseFeed();
    checkEqual('le relâchement lance la bouée en vol', G().getFeedState(), 'flying');
    checkEqual('la jauge se referme', el('feedGauge').classList.contains('active'), false);
    checkEqual('une bouée visible vole (la boule du lancer)', G().getFeedBall().visible, true);
    checkEqual('la bouée n’est pas encore posée (pas de plouf)', G().sonarBuoy.visible, false);
    attendreAtterrissage();
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    fire('sonarButton', 'click');   // ranger
    stepFor(0.1);

    // --- Un petit maintien tombe près, un long maintien tombe loin ---
    const visee = { x: 0, z: -40 };
    const a = G().angler.position;
    viserSonar(visee, 0.1);
    G().releaseFeed();
    const proche = G().getFeedLanding();
    const pPetit = G().getFeedPower();
    attendreAtterrissage();
    fire('sonarButton', 'click');   // ranger
    viserSonar(visee, 0.6);
    G().releaseFeed();
    const loin = G().getFeedLanding();
    const pLong = G().getFeedPower();
    attendreAtterrissage();
    fire('sonarButton', 'click');   // ranger
    check('un petit maintien donne une puissance faible, un long une forte', pLong > pPetit + 0.4,
        pPetit.toFixed(2) + ' < ' + pLong.toFixed(2));
    check('le point d’impact dépend de la puissance : maintien long = impact PLUS LOIN',
        dist(loin, a) > dist(proche, a) + 10,
        dist(proche, a).toFixed(1) + ' < ' + dist(loin, a).toFixed(1) + ' unités du pêcheur');
    check('un petit maintien tombe près du pêcheur (< 25 unités)', dist(proche, a) < 25, dist(proche, a).toFixed(1));

    // --- L'impact est dans la direction visée ---
    [{ x: 28, z: -40 }, { x: -28, z: -40 }, { x: 0, z: -45 }].forEach(function (v) {
        viserSonar(v, 0.3);
        const vent = ventBouee();
        G().releaseFeed();
        const imp = G().getFeedLanding();
        const ecart = ecartDegres({ x: imp.x - vent.x - a.x, z: imp.z - vent.z - a.z }, { x: v.x - a.x, z: v.z - a.z });
        check('impact dans la direction visée (' + v.x + ', ' + v.z + ')', ecart < 2, ecart.toFixed(2) + '°');
        attendreAtterrissage();
        fire('sonarButton', 'click');   // ranger
    });

    // --- Aucun ping avant le plouf, ping après l'impact, radar centré sur l'impact ---
    {
        G().fishes.forEach(fish => fish.position.set(200, -2, 200));
        const avant = G().getSonarPings();
        viserSonar({ x: 0, z: -35 }, 0.35);
        G().releaseFeed();
        const imp = G().getFeedLanding();
        // Un poisson attend à l'endroit de l'impact : il serait pingué si le scan démarrait trop tôt.
        G().fishes[0].userData.hooked = false;
        G().fishes[0].position.set(imp.x + 3, -2, imp.z);
        let pingEnVol = 0;
        let ondesEnVol = 0;
        let radarEnVol = 0;
        let guard = 0;
        while (G().getFeedState() === 'flying' && guard++ < 200) {
            G().fishes[0].position.set(imp.x + 3, -2, imp.z);
            step(1 / 60);
            if (G().getFeedState() === 'flying') {
                pingEnVol += G().getSonarPings() - avant;
                ondesEnVol += G().getOndesSonar().length;
                radarEnVol += el('sonarPanel').hidden ? 0 : 1;
            }
        }
        checkEqual('aucun ping pendant le vol de la bouée', pingEnVol, 0);
        checkEqual('aucune onde jaune pendant le vol', ondesEnVol, 0);
        checkEqual('le radar reste caché pendant le vol', radarEnVol, 0);
        checkEqual('la bouée a atterri (plus de vol)', G().getFeedState(), 'idle');
        checkEqual('la bouée flotte après le plouf', G().sonarBuoy.visible, true);
        checkEqual('le radar s’affiche au plouf', el('sonarPanel').hidden, false);
        checkEqual('ping après l’impact', G().getSonarPings(), avant + 1);
        checkClose('le radar est centré sur l’impact réel (x)', G().sonarBuoy.position.x, imp.x, 0.01);
        checkClose('le radar est centré sur l’impact réel (z)', G().sonarBuoy.position.z, imp.z, 0.01);
        const onde = G().getOndesSonar()[0];
        check('l’onde jaune part du point d’impact',
            !!onde && Math.hypot(onde.position.x - imp.x, onde.position.z - imp.z) < 0.01);
        checkEqual('le mode visée se désarme après le plouf', G().isFeedMode(), false);
        check('le bouton propose de ranger', el('sonarButton').textContent.includes('Ranger'), el('sonarButton').textContent);
        // Poisson à 23 unités du point d'impact : dans le rayon de 12 m ; à 25 : hors rayon.
        G().fishes.forEach(fish => fish.position.set(200, -2, 200));
        G().fishes[0].position.set(imp.x + 23, -2, imp.z);
        G().fishes[1].position.set(imp.x + 25, -2, imp.z);
        stepFor(0.3);
        checkEqual('le radar compte les poissons autour de l’IMPACT (un seul dans les 12 m)',
            el('sonarCount').textContent, '1 poisson · 12 m');
        // Ranger reste immédiat.
        fire('sonarButton', 'click');
        checkEqual('Ranger : la bouée disparaît tout de suite', G().sonarBuoy.visible, false);
        checkEqual('Ranger : le radar se cache tout de suite', el('sonarPanel').hidden, true);
        checkEqual('Ranger : les ondes sont effacées tout de suite', G().getOndesSonar().length, 0);
        check('Ranger : le bouton propose de poser de nouveau', el('sonarButton').textContent.includes('Poser'),
            el('sonarButton').textContent);
    }

    // --- On peut annuler la visée ---
    fire('sonarButton', 'click');
    checkEqual('la visée est armée', G().isFeedMode(), true);
    fire('sonarButton', 'click');
    checkEqual('un second clic annule la visée', G().isFeedMode(), false);
    checkEqual('aucune bouée après une visée annulée', G().sonarBuoy.visible, false);
    check('le bouton redevient « Poser le sonar »', el('sonarButton').textContent.includes('Poser'), el('sonarButton').textContent);

    // --- L'amorce et le sonar se partagent le geste sans se mélanger ---
    fire('sonarButton', 'click');
    fire('feedButton', 'click');
    checkEqual('depuis la visée du sonar, le bouton Amorce bascule sur l’amorce', G().isFeedMode(), true);
    checkEqual('le bouton Amorce est surligné', el('feedButton').classList.contains('active'), true);
    check('le bouton du sonar n’est plus en visée', el('sonarButton').textContent.includes('Poser'), el('sonarButton').textContent);
    fire('feedButton', 'click');
    checkEqual('le bouton Amorce désarme le mode', G().isFeedMode(), false);

    // --- La ligne à l'eau n'empêche pas de lancer le sonar ---
    resetToIdle();
    castTo(0, -25);
    checkEqual('ligne à l’eau', state(), 'inWater');
    const bInWater = lancerSonar({ x: 0, z: -40 }, 0.3);
    check('lancer le sonar ligne à l’eau : la bouée tombe', !!bInWater);
    checkEqual('la ligne reste à l’eau', state(), 'inWater');
    fire('sonarButton', 'click');   // ranger
    resetToIdle();

    // --- Refus : combat, accrochage, emmêlement, lancer en vol ---
    G().fishes.forEach((fish, index) => fish.position.copy(oldPositions[index]));
    {
        startFight(0, -30);
        checkEqual('on est en plein combat', state(), 'struggle');
        fire('sonarButton', 'click');
        checkEqual('sonar refusé pendant le combat (pas de visée)', G().isFeedMode(), false);
        checkEqual('sonar refusé pendant le combat (pas de bouée)', G().sonarBuoy.visible, false);
        resetToIdle();

        G().startCast({ x: 0, y: 0, z: -25 });
        checkEqual('lancer en vol', state(), 'flying');
        fire('sonarButton', 'click');
        checkEqual('sonar refusé pendant le vol de la ligne', G().isFeedMode(), false);
        resetToIdle();

        const O = G().obstacles;
        const souche = O.liste.find(o => o.type === 'souche');
        const vent = G().getWind();
        resetToIdle();
        castTo(souche.cercles[0].x - Math.cos(vent.dir) * vent.strength * 2.5,
            souche.cercles[0].z - Math.sin(vent.dir) * vent.strength * 2.5);
        if (state() === 'snag') {
            fire('sonarButton', 'click');
            checkEqual('sonar refusé pendant l’accrochage (pas de visée)', G().isFeedMode(), false);
            checkEqual('sonar refusé pendant l’accrochage (pas de bouée)', G().sonarBuoy.visible, false);
        } else {
            check('la ligne s’accroche sur la souche', false, state());
        }
        resetToIdle();

        G().setTangleChance(1);
        G().startCast({ x: 0, y: 0, z: -25 });
        stepUntil(() => state() === 'tangle', 4);
        checkEqual('la ligne s’emmêle', state(), 'tangle');
        fire('sonarButton', 'click');
        checkEqual('sonar refusé pendant l’emmêlement (pas de visée)', G().isFeedMode(), false);
        checkEqual('sonar refusé pendant l’emmêlement (pas de bouée)', G().sonarBuoy.visible, false);
        G().setTangleChance(0);
        G().recommencerPartie();
        resetToIdle();
        G().setExperience(300);
        clearLilyPads();
        G().placerAuPoste(0);
        resetToIdle();
    }

    // --- Impact sur un ouvrage (ponton, écluse, roches) : refusé comme le lancer de ligne ---
    obstacles();

    // --- Impact hors de l'eau : la bouée tombe sur la rive, aucun ping, aucun plantage ---
    horsEau();

    // --- Depuis la barque : la direction suit la visée, pas « le centre » en dur ---
    barque();

    // --- Garde-fou statique : plus de téléportation ni de ping forcé au clic ---
    const code = fs.readFileSync(path.join(GAME_DIR, 'sonar.js'), 'utf8').replace(/\/\/.*$/gm, '');
    const clic = code.slice(code.indexOf('sonarButton.addEventListener'));
    check('sonar.js ne force plus un ping au clic', !/sonarDernierPing\s*=\s*-Infinity/.test(clic));
    check('sonar.js ne place plus la bouée à une position calculée au clic',
        !/rayonEtang\(angle\)\s*-\s*4/.test(code) && !/\*\s*8,\s*0\.13/.test(code));

    G().fishes.forEach((fish, index) => fish.position.copy(oldPositions[index]));
    if (G().sonarBuoy.visible) { fire('sonarButton', 'click'); }
    G().placerAuPoste(0);
    resetToIdle();
}

function obstacles() {
    const O = G().obstacles;
    G().placerAuPoste(0);
    resetToIdle();
    const a = G().angler.position;
    const origine = { x: a.x, y: a.y, z: a.z };
    const bloquants = O.liste.filter(o => o.bloqueLancer);
    check('il existe des ouvrages qui bloquent le lancer', bloquants.length >= 2, String(bloquants.length));
    bloquants.forEach(function (o) {
        const c = o.cercles.find(x => x.eau) || o.cercles[0];
        // Le pêcheur est posé à 18 unités au sud de l'ouvrage : à portée de la jauge.
        a.set(c.x, origine.y, c.z + 18);
        const avant = G().getSonarPings();
        const imp = lancerSonarSur({ x: c.x, z: c.z });
        check(o.id + ' : l’impact visé tombe bien sur l’ouvrage',
            O.lancerBloque(imp) === o, imp.x.toFixed(1) + ',' + imp.z.toFixed(1));
        checkEqual(o.id + ' : le lancer sur ' + o.nom + ' est refusé (rien ne part)', G().getFeedState(), 'idle');
        check(o.id + ' : le message explique pourquoi', el('status').textContent.includes('retombe sur ' + o.nom),
            el('status').textContent);
        checkEqual(o.id + ' : aucune bouée posée', G().sonarBuoy.visible, false);
        checkEqual(o.id + ' : aucune boule en vol', G().getFeedBall().visible, false);
        checkEqual(o.id + ' : la visée reste armée pour réessayer', G().isFeedMode(), true);
        stepFor(0.5);
        checkEqual(o.id + ' : aucun ping', G().getSonarPings(), avant);
        fire('sonarButton', 'click');   // annule la visée
        checkEqual(o.id + ' : la visée s’annule proprement', G().isFeedMode(), false);
    });
    // Le même endroit, à côté de l'ouvrage, est accepté (la règle ne bloque pas tout).
    {
        const o = bloquants[0];
        const c = o.cercles.find(x => x.eau) || o.cercles[0];
        a.set(c.x, origine.y, c.z + 18);
        const libre = { x: c.x + c.r + 6, z: c.z + 6 };
        if (O.lancerBloque(libre) === null) {
            const dxp = G().getPondCenter();
            const dedans = Math.hypot(libre.x - dxp.x, libre.z - dxp.z) < G().getRayonEtang(Math.atan2(libre.z - dxp.z, libre.x - dxp.x)) - 4;
            if (dedans) {
                lancerSonarSur(libre);
                attendreAtterrissage();
                checkEqual('à côté de l’ouvrage, la bouée est posée', G().sonarBuoy.visible, true);
                fire('sonarButton', 'click');   // ranger
            }
        }
    }
    a.set(origine.x, origine.y, origine.z);
    G().placerAuPoste(0);
    resetToIdle();
}

function horsEau() {
    const C = G().getPondCenter();
    const a = G().angler.position;
    const origine = { x: a.x, y: a.y, z: a.z };
    G().placerAuPoste(0);
    resetToIdle();
    // Le pêcheur est dans l'eau à 3 unités de la rive nord-est ; il vise vers l'extérieur.
    const angle = 0.6;
    const rive = G().getRayonEtang(angle);
    const dir = { x: Math.cos(angle), z: Math.sin(angle) };
    a.set(C.x + dir.x * (rive - 3), origine.y, C.z + dir.z * (rive - 3));
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    const avant = G().getSonarPings();
    viserSonar({ x: a.x + dir.x * 10, z: a.z + dir.z * 10 }, 0.3);
    // Un poisson à l'impact : serait pingué si la bouée « sonnait » sur la berge.
    const vent = ventBouee();
    G().releaseFeed();
    const imp = G().getFeedLanding();
    G().fishes[0].position.set(imp.x + 2, -2, imp.z);
    const horsDeLEtang = Math.hypot(imp.x - C.x, imp.z - C.z) > G().getRayonEtang(Math.atan2(imp.z - C.z, imp.x - C.x));
    check('l’impact est bien hors de l’étang (sur la berge)', horsDeLEtang,
        'vent ' + vent.x.toFixed(2) + ',' + vent.z.toFixed(2));
    checkEqual('la bouée part quand même en vol', G().getFeedState(), 'flying');
    attendreAtterrissage();
    checkEqual('hors de l’eau : la bouée n’est pas posée', G().sonarBuoy.visible, false);
    checkEqual('hors de l’eau : le radar reste caché', el('sonarPanel').hidden, true);
    check('hors de l’eau : un message discret explique', el('status').textContent.includes('berge'), el('status').textContent);
    checkEqual('hors de l’eau : la boule en vol a disparu', G().getFeedBall().visible, false);
    checkEqual('hors de l’eau : le mode visée est désarmé', G().isFeedMode(), false);
    checkEqual('hors de l’eau : le geste est terminé', G().getFeedState(), 'idle');
    stepFor(3);
    checkEqual('hors de l’eau : aucun ping', G().getSonarPings(), avant);
    checkEqual('hors de l’eau : aucune onde', G().getOndesSonar().length, 0);
    // Le sonar reste lançable ensuite (pas de plantage, pas d'état bloqué).
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    a.set(origine.x, origine.y, origine.z);
    G().placerAuPoste(0);
    resetToIdle();
    const apres = lancerSonar({ x: 0, z: -30 }, 0.3);
    check('après un lancer raté, on peut relancer le sonar', !!apres);
    fire('sonarButton', 'click');   // ranger
}

function barque() {
    G().placerAuPoste(0);
    resetToIdle();
    G().setExperience(G().getBateauPrix() + 150);
    G().acheterBateau();
    checkEqual('on embarque', G().embarquerBateau(), true);
    resetToIdle();
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    const a = G().angler.position;
    const C = G().getPondCenter();
    const versCentre = { x: C.x - a.x, z: C.z - a.z };
    const n = Math.hypot(versCentre.x, versCentre.z) || 1;
    // On vise à 70° du centre (de côté), du côté qui reste dans l'étang.
    const essais = [70, -70].map(function (deg) {
        const r = deg * Math.PI / 180;
        const dx = (versCentre.x * Math.cos(r) - versCentre.z * Math.sin(r)) / n;
        const dz = (versCentre.x * Math.sin(r) + versCentre.z * Math.cos(r)) / n;
        return { dir: { x: dx, z: dz }, p: { x: a.x + dx * 20, z: a.z + dz * 20 } };
    });
    essais.forEach(function (e, i) {
        viserSonar(e.p, 0.25);
        const vent = ventBouee();
        G().releaseFeed();
        const imp = G().getFeedLanding();
        const ecart = ecartDegres({ x: imp.x - vent.x - a.x, z: imp.z - vent.z - a.z }, e.dir);
        check('en barque : l’impact suit la visée (côté ' + (i === 0 ? 'gauche' : 'droit') + ')', ecart < 2, ecart.toFixed(2) + '°');
        const ecartCentre = ecartDegres({ x: imp.x - vent.x - a.x, z: imp.z - vent.z - a.z }, versCentre);
        check('en barque : la direction n’est plus « vers le centre » en dur', ecartCentre > 30, ecartCentre.toFixed(0) + '°');
        attendreAtterrissage();
        if (G().sonarBuoy.visible) {
            checkClose('en barque : le radar est centré sur l’impact (x)', G().sonarBuoy.position.x, imp.x, 0.01);
            checkClose('en barque : le radar est centré sur l’impact (z)', G().sonarBuoy.position.z, imp.z, 0.01);
            fire('sonarButton', 'click');   // ranger
        }
    });
    // Un lancer vers le centre atterrit bien dans l'eau depuis la barque.
    const b = lancerSonar({ x: C.x, z: C.z }, 0.3);
    check('en barque : un lancer vers le centre pose la bouée à l’eau', !!b);
    if (b) { fire('sonarButton', 'click'); }
    G().quitterBateau();
    G().placerAuPoste(0);
    resetToIdle();
}

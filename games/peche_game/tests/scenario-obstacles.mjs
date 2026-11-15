// ---------------------------------------------------------------------------
// Scénario 73 : OBSTACLES AQUATIQUES (idées.md §14.2, v174).
//
// Ponton, écluse, douve, roches, souches, pieux, épave, îlots de joncs :
//  - placement déterministe, sans jamais consommer rand() ;
//  - aucun chevauchement avec les 4 postes de berge, la bourriche, le point de départ,
//    le point d'embarquement de la barque, les fosses ;
//  - (accrochage, attraction et collision : voir les groupes suivants).
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import {
    GAME_DIR, group, check, checkEqual,
    G, el, fire, resetToIdle, castTo, step, state
} from './harness.mjs';

const TYPES_ATTENDUS = ['ponton', 'ecluse', 'douve', 'roches', 'souche', 'pieux', 'epave', 'joncs'];

function distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Le jeu a-t-il la barque ? (achat avec l'XP si besoin) */
export function assurerBarque() {
    G().setExperience(G().getBateauPrix());
    G().acheterBateau();   // sans effet si la barque est déjà achetée
}

/** Un point d'eau libre juste à côté de l'obstacle, qui coince l'hameçon sans être sur la pierre. */
export function pointAccroche(o) {
    const O = G().obstacles;
    for (const c of o.cercles) {
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2;
            const p = { x: c.x + Math.cos(a) * (c.r + 0.4), z: c.z + Math.sin(a) * (c.r + 0.4) };
            const dx = p.x - G().getPondCenter().x;
            const dz = p.z - G().getPondCenter().z;
            const dedans = Math.hypot(dx, dz) < G().getRayonEtang(Math.atan2(dz, dx)) - 4;
            if (dedans && O.accrocheEn(p) === o && O.lancerBloque(p) === null) { return p; }
        }
    }
    return null;
}

/** Lance la ligne pour que l'hameçon retombe EXACTEMENT en (x, z) malgré le vent. */
export function lancerSur(x, z) {
    const vent = G().getWind();
    return castTo(x - Math.cos(vent.dir) * vent.strength * 2.5, z - Math.sin(vent.dir) * vent.strength * 2.5);
}

export function run() {
    group('73) Obstacles aquatiques : placement, non-chevauchement (v174)');
    G().recommencerPartie();
    resetToIdle();

    const O = G().obstacles;
    const centre = G().getPondCenter();

    // --- 1) Les obstacles existent : un type, une position dans l'eau, un rayon ---
    check('au moins 8 obstacles posés', O.liste.length >= 8, O.liste.length + ' obstacles');
    const types = new Set(O.liste.map(o => o.type));
    TYPES_ATTENDUS.forEach(function (type) {
        check('type « ' + type + ' » présent', types.has(type));
    });
    O.liste.forEach(function (o) {
        const dx = o.x - centre.x;
        const dz = o.z - centre.z;
        const dedans = Math.hypot(dx, dz) < G().getRayonEtang(Math.atan2(dz, dx)) - 0.5;
        check(o.id + ' : un type connu, une position DANS l’eau et un rayon',
            !!O.TYPES[o.type] && dedans && o.rayon > 0.5 && Number.isFinite(o.x) && Number.isFinite(o.z),
            o.type + ' (' + o.x.toFixed(1) + ' ; ' + o.z.toFixed(1) + ') r = ' + o.rayon.toFixed(1));
    });

    // --- 2) Déterminisme : le même placement à chaque exécution, sans rand() ---
    const second = O.refaire();
    check('deux placements donnent exactement les mêmes obstacles',
        second.empreinte() === O.empreinte(), O.liste.length + ' obstacles, positions et cercles identiques');
    checkEqual('… et le même nombre', second.liste.length, O.liste.length);
    const code = fs.readFileSync(path.join(GAME_DIR, 'obstacles.js'), 'utf8')
        .replace(/\/\/.*$/gm, '');
    check('obstacles.js ne consomme jamais rand() ni Math.random',
        !/Math\.random|\brand\s*\(/.test(code));

    // --- 3) Non-chevauchement : postes de berge, bourriche, départ, fosses ---
    const fosses = G().getEtangInfo().fosses;
    const anglerDepart = { x: 0, z: 0 };
    for (let poste = 0; poste < 4; poste++) {
        G().placerAuPoste(poste);
        const pecheur = { x: G().angler.position.x, z: G().angler.position.z };
        const bourriche = G().getBourriche();
        if (poste === 0) { anglerDepart.x = pecheur.x; anglerDepart.z = pecheur.z; }
        let pecheurLibre = true;
        let bourricheLibre = true;
        let couloirLibre = true;
        O.liste.forEach(function (o) {
            o.cercles.forEach(function (c) {
                if (distance2D(c, pecheur) < c.r + 5) { pecheurLibre = false; }
                if (distance2D(c, bourriche) < c.r + bourriche.radius + 2) { bourricheLibre = false; }
                // Le tir vers le centre depuis le poste ne passe pas par un obstacle proche.
                const ux = centre.x - pecheur.x;
                const uz = centre.z - pecheur.z;
                const n = Math.hypot(ux, uz);
                const t = ((c.x - pecheur.x) * ux + (c.z - pecheur.z) * uz) / n;
                const lateral = Math.abs((c.x - pecheur.x) * uz - (c.z - pecheur.z) * ux) / n;
                if (t > 0 && t < 40 && lateral < c.r + 4) { couloirLibre = false; }
            });
        });
        check('poste ' + poste + ' : pêcheur à l’écart de tout obstacle', pecheurLibre);
        check('poste ' + poste + ' : bourriche à l’écart de tout obstacle', bourricheLibre);
        check('poste ' + poste + ' : les 40 premières unités de tir vers l’étang sont libres', couloirLibre);
    }
    G().placerAuPoste(0);
    check('le point de départ du pêcheur est libre',
        O.liste.every(o => o.cercles.every(c => distance2D(c, anglerDepart) > c.r + 5)));

    let fosseLibre = true;
    O.liste.forEach(function (o) {
        o.cercles.forEach(function (c) {
            if (!c.eau) { return; }
            fosses.forEach(function (f) {
                if (distance2D(c, f) < f.rayon + c.r) { fosseLibre = false; }
            });
        });
    });
    check('aucun obstacle ne ferme une fosse (on peut y pêcher)', fosseLibre);

    // Aucun obstacle ne chevauche un autre.
    let chevauche = false;
    O.liste.forEach(function (a, i) {
        O.liste.forEach(function (b, j) {
            if (j <= i) { return; }
            a.cercles.forEach(function (ca) {
                b.cercles.forEach(function (cb) {
                    if (distance2D(ca, cb) < ca.r + cb.r) { chevauche = true; }
                });
            });
        });
    });
    check('aucun obstacle ne chevauche un autre', !chevauche);

    // Aucun obstacle sur un nénuphar de départ.
    check('aucun obstacle ne recouvre un nénuphar', O.nenupharsDepart.length === 40
        && O.liste.every(o => o.cercles.every(c => !c.eau
            || O.nenupharsDepart.every(p => distance2D(c, p) >= c.r + p.radius))));

    // --- 4) La barque ne naît jamais sur un obstacle (embarquement depuis chaque poste) ---
    assurerBarque();
    for (let poste = 0; poste < 4; poste++) {
        G().placerAuPoste(poste);
        const monte = G().embarquerBateau();
        const barque = G().getBateau();
        check('poste ' + poste + ' : on embarque', monte);
        check('poste ' + poste + ' : la barque naît en eau libre',
            monte && O.heurtBarque(barque.x, barque.z) === null);
        G().quitterBateau();
    }
    G().placerAuPoste(0);
    resetToIdle();

    // --- 5) ACCROCHAGE : l'hameçon posé sur un obstacle se coince, avec SON message ---
    group('73b) Obstacles : accrochage (difficulté et message propres à chacun)');
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
    const accrochables = O.liste.filter(o => o.profil);
    check('tous les obstacles sauf la douve peuvent accrocher', accrochables.length === O.liste.length - 1,
        accrochables.length + ' sur ' + O.liste.length);
    const messages = new Set();
    accrochables.forEach(function (o) {
        const p = pointAccroche(o);
        check(o.id + ' : un point d’accrochage existe', !!p);
        if (!p) { return; }
        resetToIdle();
        G().lilyPads.length = 0;
        G().recommencerPartie();
        lancerSur(p.x, p.z);
        check(o.id + ' : l’hameçon se coince (état snag)', state() === 'snag', state());
        const snag = G().getSnag();
        check(o.id + ' : bon type d’obstacle dans l’accrochage', snag && snag.obstacle === o.type,
            snag && snag.obstacle);
        check(o.id + ' : message « ' + o.profil.message + ' »',
            el('struggleInfo').textContent === o.profil.message, el('struggleInfo').textContent);
        check(o.id + ' : le statut répète le message',
            el('status').textContent.indexOf(o.profil.message) === 0, el('status').textContent);
        check(o.id + ' : réglages repris du profil (rythme ' + o.profil.clickCooldown + ' s)',
            snag && Math.abs(snag.clickCooldown - o.profil.clickCooldown) < 1e-9
            && Math.abs(snag.clickPower - o.profil.clickPower) < 1e-9);
        messages.add(o.profil.message);
        resetToIdle();
    });
    check('chaque type d’obstacle a son propre message', messages.size === new Set(accrochables.map(o => o.type)).size,
        messages.size + ' messages');
    // Difficulté : de plus en plus dure, mais toujours possible au rythme demandé.
    const niveaux = { facile: 1, moyenne: 2, difficile: 3 };
    Object.keys(O.ACCROCHAGES).forEach(function (cle) {
        const a = O.ACCROCHAGES[cle];
        const cadence = a.clickCooldown > 0 ? Math.min(1 / a.clickCooldown, 5) : 5;
        const tire = a.pullRate + a.burstStrength / a.burstInterval;
        check(cle + ' (' + a.difficulte + ') : niveau cohérent', niveaux[a.difficulte] === a.niveau);
        check(cle + ' : dégageable en cliquant au rythme demandé',
            a.clickPower * cadence > tire, (a.clickPower * cadence).toFixed(2) + ' > ' + tire.toFixed(2));
    });
    check('la souche, l’épave et l’écluse sont plus dures que les joncs et les pieux',
        ['souche', 'epave', 'ecluse'].every(c => O.ACCROCHAGES[c].niveau > O.ACCROCHAGES.joncs.niveau
            && O.ACCROCHAGES[c].niveau > O.ACCROCHAGES.pieux.niveau));
    check('la souche tire plus fort que la vase (0,08 / 0,08 / 0,32 s)',
        O.ACCROCHAGES.souche.pullRate + O.ACCROCHAGES.souche.burstStrength / O.ACCROCHAGES.souche.burstInterval
        > 0.08 + 0.08 / 0.9);

    // Cliquer en rythme dégage la souche ; ne rien faire casse la ligne.
    const souche = O.liste.find(o => o.type === 'souche');
    const ps = pointAccroche(souche);
    resetToIdle();
    lancerSur(ps.x, ps.z);
    let t = 0;
    while (state() === 'snag' && t < 30) {
        fire('fishButton', 'click');
        step(souche.profil.clickCooldown + 0.02);
        t += souche.profil.clickCooldown + 0.02;
    }
    check('en cliquant en rythme, la souche lâche', state() === 'reeling', state() + ' après ' + t.toFixed(1) + ' s');
    check('… et cela prend plusieurs secondes', t > 2, t.toFixed(1) + ' s');
    resetToIdle();
    lancerSur(ps.x, ps.z);
    let attente = 0;
    while (state() === 'snag' && attente < 30) { step(0.1); attente += 0.1; }
    check('sans cliquer, la ligne casse', state() === 'broken' || state() === 'idle', state());
    resetToIdle();
    G().recommencerPartie();
}

export default run;

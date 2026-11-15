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
    G, resetToIdle
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
}

export default run;

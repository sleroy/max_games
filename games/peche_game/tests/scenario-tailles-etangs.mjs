// ---------------------------------------------------------------------------
// Scénario : LA TAILLE DE L'ÉTANG SUIT LE BIOTOPE (milieux.js `rayon`, environnement.js `setRayonMonde`,
// tailleEtang.js).
//
// Six tailles : forêt 12, canal 45, carnassiers 70, plaine 90 (la référence), montagne 180, rivière 280
// (rayon nominal, en unités ; le « diamètre » du tableau d'énoncé est 2 × rayon, en unités).
//  1) dimensions pures (dimensions.js) : rayon, surface, portées, échelles ;
//  2) pour chaque biotope choisi sur l'accueil : géométrie (rayon max, surface, fosses, profondeur), ambiance
//     (brume, ciel, plan lointain), portées (lancer, amorce), carte, pêcheur sur la berge, décor et obstacles
//     DANS le contour, poissons dans l'eau, barque ;
//  3) la plaine est EXACTEMENT le monde d'origine, aussi après un tour par toutes les autres tailles.
//
// Le monde est laissé en plaine à la fin.
// ---------------------------------------------------------------------------
import {
    MILIEUX, IDS_MILIEUX, milieuParId, surfaceHaDe, capacite, quotasEspeces, densitesDecor, styleDecor,
    echelleMilieu, facteurTaille, formeDe
} from '../milieux.js';
import {
    RAYON_REFERENCE, surfaceHectares, surfaceUnites, porteeLancer, porteeAmorce, echelleDeRayon,
    BRUME_REFERENCE, CIEL_REFERENCE, CAMERA_FAR_REFERENCE, rayonContour, VARIATION_CONTOUR, HARMONIQUES,
    extents, echelleExtent, echelleAmbiance
} from '../dimensions.js';
import { group, check, checkEqual, checkClose, G, el, fire, resetToIdle } from './harness.mjs';
import { suivreProfil, profilParDefaut, GRAINE_TEMOIN } from './profil-monde.mjs';

const cap = function (id) { return id[0].toUpperCase() + id.slice(1); };
const borner = function (v, min, max) { return Math.max(min, Math.min(max, v)); };

// Énoncé : rayon (unités) et diamètre nominal (2 × rayon, unités) de chaque biotope.
const ATTENDU = {
    foret: { rayon: 12, diametre: 24 },
    canal: { rayon: 45, diametre: 90 },
    carnassiers: { rayon: 70, diametre: 140 },
    plaine: { rayon: 90, diametre: 180 },
    montagne: { rayon: 180, diametre: 360 },
    riviere: { rayon: 280, diametre: 560 }
};

function choisirSurAccueil(id) {
    el('accueilMilieu' + cap(id)).checked = true;
    fire('accueilMilieu' + cap(id), 'change');
    suivreProfil(G());   // formes tirées d'une graine : dimensions.js (tests) calcule sur le plan d'eau du jeu
}

/** Distance au centre et angle d'un point, et rayon du contour dans cette direction. */
function polaire(p, centre) {
    const dx = p.x - centre.x;
    const dz = p.z - centre.z;
    const angle = Math.atan2(dz, dx);
    return { distance: Math.hypot(dx, dz), angle: angle, contour: G().getRayonEtang(angle) };
}

export async function run() {
    group('78) Tailles d’étang : le rayon, la géométrie, le décor et les portées suivent le biotope');
    profilParDefaut();   // les dimensions pures ci-dessous : style par défaut (le profil du jeu est suivi plus bas)

    // --- 1) Les dimensions pures ----------------------------------------------------------------
    checkEqual('six biotopes, six rayons : 12, 45, 70, 90, 180 et 280',
        JSON.stringify(IDS_MILIEUX.map(function (id) { return milieuParId(id).rayon; }).sort(function (a, b) { return a - b; })),
        JSON.stringify([12, 45, 70, 90, 180, 280]));
    IDS_MILIEUX.forEach(function (id) {
        const m = milieuParId(id);
        checkEqual(id + ' : rayon ' + ATTENDU[id].rayon, m.rayon, ATTENDU[id].rayon);
        checkEqual(id + ' : diamètre nominal ' + ATTENDU[id].diametre, m.rayon * 2, ATTENDU[id].diametre);
        check(id + ' : plus de surface « écologique » en dur (la surface se déduit du rayon)', m.surfaceHa === undefined);
    });
    checkEqual('la plaine est le monde de référence (rayon 90)', milieuParId('plaine').rayon, RAYON_REFERENCE);
    checkClose('surface de la plaine ≈ 0,64 ha (0,6413)', surfaceHectares(90), 0.6413, 0.001);
    checkClose('surface = R² × coefficient (même forme à toutes les tailles)', surfaceHectares(180) / surfaceHectares(90), 4, 1e-9);
    check('forêt : surface < 0,06 ha', surfaceHectares(12) < 0.06, surfaceHectares(12).toFixed(4) + ' ha');
    check('forêt : diamètre < 30 (unités ; 12 m réels à 2 unités = 1 m)', ATTENDU.foret.diametre < 30);
    check('rivière : diamètre > 500 (unités ; 280 m réels)', ATTENDU.riviere.diametre > 500);
    checkEqual('portée du lancer dans la plaine : 52', porteeLancer(90), 52);
    checkEqual('portée du lancer dans la forêt : plancher 20', porteeLancer(12), 20);
    checkEqual('portée du lancer dans la rivière : plafond 140', porteeLancer(280), 140);
    checkClose('portée du lancer en montagne : 104 (× 2)', porteeLancer(180), 104, 1e-9);
    checkClose('portée de l’amorce dans la plaine : 46', porteeAmorce(90), 46, 1e-9);
    check('les portées ne baissent jamais quand le rayon augmente',
        [12, 45, 70, 90, 180, 280].every(function (r, i, l) { return i === 0 || porteeLancer(r) >= porteeLancer(l[i - 1]); }));
    checkClose('RAYON max du contour = rayon × 1,22 (variation de 22 %)', 1 + VARIATION_CONTOUR, 1.22, 1e-9);

    // --- Monde d'origine, mémorisé AVANT tout changement ------------------------------------------------
    const Z = G();
    Z.setGraine(GRAINE_TEMOIN);   // plan d'eau de la graine témoin (voir profil-monde.mjs) ; la graine du harnais est remise à la fin
    choisirSurAccueil('plaine');
    const origine = {
        centre: Z.getPondCenter(),
        fosses: JSON.stringify(Z.getEtangInfo().fosses),
        info: Z.getEtangInfo(),
        monde: Z.getMonde(),
        decor: JSON.stringify([Z.decor.arbres, Z.decor.lilyPads, Z.decor.roseaux, Z.decor.rochers]),
        obstacles: Z.obstacles.empreinte(),
        grille: Z.substrats.empreinte(),
        pecheur: { x: Z.angler.position.x, z: Z.angler.position.z },
        contour: [0, 1, 2, 3, 4, 5, 6].map(function (a) { return Z.getRayonEtang(a); }),
        profondeurs: [[0, -40], [-20, -90], [30, -55], [4, -123]].map(function (p) { return Z.profondeurLocale(p[0], p[1]); })
    };
    checkEqual('plaine : rayon 90', origine.monde.rayon, 90);
    // ATTENDU MODIFIÉ (formes tirées d'une graine) : le contour de la plaine vient de la graine, donc « centre en (0, -71) »,
    // « fosses d'origine (-28, -95)… » et « rayon max 109,8 » ne sont plus des constantes. Invariants à la place :
    // l'ancre sud (le poste de départ) reste sur le contour, le centre reste près de (0, -71), les fosses gardent rayons et
    // profondeurs d'origine et leur fraction d / rayon local, le rayon max est le plus grand rayon du contour tiré.
    check('plaine : centre près de (0, -71) (l’ancre sud reste en place, le contour vient de la graine)',
        Math.hypot(origine.centre.x - 0, origine.centre.z - (-71)) < 20, origine.centre.x.toFixed(2) + ',' + origine.centre.z.toFixed(2));
    checkEqual('plaine : fosses d’origine (rayons 22, 18, 16 et profondeurs supplémentaires 3,6, 3,3, 3,8)',
        JSON.stringify(JSON.parse(origine.fosses).map(function (f) { return [f.rayon, f.plus]; })), JSON.stringify([[22, 3.6], [18, 3.3], [16, 3.8]]));
    // Fraction d / rayon local de chaque fosse d'origine : (-28, -95), (30, -53), (4, -123) autour de (0, -71), contour d'origine.
    const fractionOrigine = function (x, z) {
        const dx = x;
        const dz = z + 71;
        const a = Math.atan2(dz, dx);
        return Math.hypot(dx, dz) / (90 * HARMONIQUES.reduce(function (t, h) { return t + h.amplitude * Math.sin(h.frequence * a + h.phase); }, 1));
    };
    check('plaine : les fosses gardent leur place RELATIVE (même fraction d / rayon local qu’au contour d’origine)',
        JSON.parse(origine.fosses).every(function (f, i) {
            const dx = f.x - origine.centre.x;
            const dz = f.z - origine.centre.z;
            return Math.abs(Math.hypot(dx, dz) / G().getRayonEtang(Math.atan2(dz, dx)) - fractionOrigine([-28, 30, 4][i], [-95, -53, -123][i])) < 1e-9;
        }));
    check('plaine : rayon max = le plus grand rayon du contour (borne carrée sur x et z)',
        (function () {
            let maxi = 0;
            for (let k = 0; k < 7200; k++) { maxi = Math.max(maxi, G().getRayonEtang((k / 7200) * Math.PI * 2)); }
            return origine.monde.rayonMax >= maxi - 1e-9 && origine.monde.rayonMax <= maxi * 1.001;
        })(), String(origine.monde.rayonMax));
    checkEqual('plaine : lancer 52', origine.monde.porteeLancer, 52);
    checkEqual('plaine : amorce 46', origine.monde.porteeAmorce, 46);
    checkEqual('plaine : plan lointain de la caméra 900', origine.monde.cameraFar, 900);
    checkEqual('plaine : brume 150 → 480', origine.monde.brume.proche + '→' + origine.monde.brume.loin, '150→480');
    checkEqual('plaine : ciel de 520', origine.monde.ciel, 520);
    checkEqual('plaine : carte 3D de 260 unités', origine.monde.monde3D, 260);
    checkClose('plaine : pas de la barque 2,4', origine.monde.pasBateauMarge, 2.4, 1e-9);

    // --- 2) Chaque biotope, tel que le joueur le choisit --------------------------------------------------
    const vus = {};
    IDS_MILIEUX.filter(function (id) { return id !== 'plaine'; }).concat(['plaine']).forEach(function (id) {
        const m = milieuParId(id);
        const f = echelleMilieu(m);
        // Forme du plan d'eau (formes d'eau) : l'étang est le contour d'origine ; canal, lac et rivière ont leur profil.
        // Les attendus qui supposaient « un étang partout » (rayon max, contour, ambiance, portées, carte) suivent le
        // profil : ils se mesurent sur le plus grand EXTENT (echelleExtent) au lieu du rayon nominal.
        const forme = formeDe(m);
        const etang = forme === 'etang';
        // Formes tirées d'une graine : on choisit d'abord le biotope (le profil du jeu est alors suivi par dimensions.js),
        // puis on calcule les échelles sur CE plan d'eau.
        choisirSurAccueil(id);
        const fx = echelleExtent(m.rayon, forme);          // = f pour l'étang
        const ambiance = echelleAmbiance(m.rayon, forme);  // = max(1, f) pour l'étang
        const monde = G().getMonde();
        const info = G().getEtangInfo();
        const centre = G().getPondCenter();

        // Géométrie
        checkEqual(id + ' : rayon du monde = rayon du biotope', monde.rayon, m.rayon);
        checkEqual(id + ' : getPondRadius suit le biotope', G().getPondRadius(), m.rayon);
        // ATTENDU MODIFIÉ (formes d'eau, puis graine) : « rayon max ≈ rayon × 1,22 » valait pour le contour d'origine ; l'étang
        // tiré d'une graine a son plus grand rayon, comme un autre profil son plus grand extent.
        const plusGrand = Math.max(extents(m.rayon, forme).maxX, extents(m.rayon, forme).maxZ);
        checkClose(id + ' : rayon max ≈ rayon × le plus grand ' + (etang ? 'rayon du contour' : 'extent du profil'), monde.rayonMax / m.rayon, plusGrand / m.rayon, 1e-9);
        // ATTENDU MODIFIÉ (graine) : « [0,78 ; 1,22] × rayon » → [0,5 ; plus grand rayon] pour l'étang (le générateur garde le contour ≥ 55 % de son rayon).
        check(id + ' : le contour reste dans ' + (etang ? '[0,5 ; plus grand rayon] × rayon' : '[0 ; rayon max] × rayon pour ce profil'),
            [0, 1, 2, 3, 4, 5, 6].every(function (a) {
                const r = G().getRayonEtang(a) / m.rayon;
                return etang ? (r >= 0.5 && r <= plusGrand / m.rayon + 1e-9) : (r > 0 && r <= plusGrand / m.rayon + 1e-9);
            }));
        checkClose(id + ' : contour = rayon × le contour ' + (etang ? 'de l’étang tiré de la graine' : 'du profil ' + forme),
            [0, 1.3, 2.6, 4.1, 5.5].reduce(function (e, a) { return Math.max(e, Math.abs(G().getRayonEtang(a) / m.rayon - rayonContour(1, a, forme))); }, 0), 0, 1e-9);

        // Une seule vérité pour la surface
        checkClose(id + ' : surface géométrique = surface du biotope (une seule vérité)', info.surfaceHa, surfaceHaDe(m), 1e-12);
        checkClose(id + ' : surface = surface d’un contour de ce rayon (aire intégrée)', info.surfaceHa * 4 * 10000, surfaceUnites(m.rayon), 1e-6 * surfaceUnites(m.rayon));
        const cibleAttendue = quotasEspeces(m, Math.min(240, Math.round(info.surfaceHa * 90 * m.densite * 2))).total;
        checkEqual(id + ' : population cible calculée d’après la surface RÉELLE', G().getPopulation().cible, cibleAttendue);
        checkEqual(id + ' : capacité = surface réelle × 90 /ha × densité × 2 (plafond 240)', capacite(m), Math.min(240, Math.round(info.surfaceHa * 90 * m.densite * 2)));
        checkClose(id + ' : biomasse et densité lisent la même surface', G().getPopulation().surfaceHa, info.surfaceHa, 1e-12);
        check(id + ' : facteur de taille borné [0,5 ; 1,2] et calculé sur la surface réelle',
            facteurTaille(m) >= 0.5 && facteurTaille(m) <= 1.2);

        // Fosses et profondeur : le relief normalisé ne change pas
        check(id + ' : trois fosses', info.fosses.length === 3);
        check(id + ' : chaque fosse est ENTIÈREMENT dans le bassin (contour échantillonné tous les 22,5°)',
            info.fosses.every(function (fosse) {
                for (let k = 0; k < 16; k++) {
                    const a = (k / 16) * Math.PI * 2;
                    const p = polaire({ x: fosse.x + Math.cos(a) * fosse.rayon, z: fosse.z + Math.sin(a) * fosse.rayon }, centre);
                    if (p.distance >= p.contour) { return false; }
                }
                const p0 = polaire(fosse, centre);
                return p0.distance < p0.contour;
            }));
        check(id + ' : rayons des fosses × f', info.fosses.every(function (fosse, i) { return Math.abs(fosse.rayon - [22, 18, 16][i] * f) < 1e-9; }));
        check(id + ' : profondeur supplémentaire des fosses inchangée', info.fosses.every(function (fosse, i) { return fosse.plus === [3.6, 3.3, 3.8][i]; }));
        check(id + ' : profondeur max ≤ 8,2 (la ligne descend à 7)', info.profondeurMax <= 8.2 && info.profondeurMax > 0.5, String(info.profondeurMax));
        // ATTENDU MODIFIÉ (profondeur selon la taille) : un petit étang est moins profond qu'un grand lac.
        // La profondeur suit facteurProfondeur(rayon) = rayon / 90 borné [0,35 ; 1] ; ±0,08 pour un autre profil
        // (la cuvette y est anisotrope : la fosse garde sa fraction d / rayon local, mais pas la pente exacte).
        checkClose(id + ' : profondeur max = celle de la plaine × facteur de profondeur', info.profondeurMax,
            origine.info.profondeurMax * monde.facteurProfondeur, etang ? 0.02 : 0.08);
        checkClose(id + ' : cadre de la carte = rayon max + 8', info.rayonCadre, monde.rayonMax + 8, 1e-9);
        // La profondeur normalisée : au centre, même cuvette qu'ailleurs.
        checkClose(id + ' : profondeur au centre de l’étang (cuvette) = 5 × facteur de profondeur',
            G().profondeurLocale(centre.x, centre.z), 5 * monde.facteurProfondeur, 1e-9);

        // Ambiance
        check(id + ' : plan lointain de la caméra ≥ 4 × rayon max', monde.cameraFar >= 4 * monde.rayonMax, monde.cameraFar + ' ≥ ' + (4 * monde.rayonMax).toFixed(0));
        check(id + ' : ciel ≥ 3 × rayon max', monde.ciel >= 3 * monde.rayonMax, monde.ciel + ' ≥ ' + (3 * monde.rayonMax).toFixed(0));
        check(id + ' : ciel ≥ brume (il englobe la brume)', monde.ciel >= monde.brume.loin);
        check(id + ' : brume ≥ celle de la plaine (150 / 480)', monde.brume.proche >= BRUME_REFERENCE.proche && monde.brume.loin >= BRUME_REFERENCE.loin);
        // ATTENDU MODIFIÉ (formes d'eau) : l'ambiance suit le plus grand extent (= f pour l'étang).
        checkClose(id + ' : brume ×f au-delà de la plaine', monde.brume.loin, BRUME_REFERENCE.loin * ambiance, 1e-9);
        checkClose(id + ' : ciel × f au-delà de la plaine', monde.ciel, CIEL_REFERENCE * ambiance, 1e-9);
        checkClose(id + ' : plan lointain × f au-delà de la plaine', monde.cameraFar, CAMERA_FAR_REFERENCE * ambiance, 1e-9);
        check(id + ' : la brume ne commence pas après la fin du lancer', monde.brume.proche > monde.porteeLancer);

        // Portées
        // ATTENDU MODIFIÉ (formes d'eau) : la portée suit le plus grand extent (= f pour l'étang).
        checkEqual(id + ' : portée du lancer = formule ×f bornée [20 ; 140]', monde.porteeLancer, borner(52 * fx, 20, 140));
        check(id + ' : portée du lancer dans [20 ; 140]', monde.porteeLancer >= 20 && monde.porteeLancer <= 140);
        checkClose(id + ' : portée de l’amorce dans la même proportion', G().getFeedRange().max, 46 * monde.porteeLancer / 52, 1e-9);
        checkClose(id + ' : pas de la barque × f borné [0,5 ; 3]', monde.pasBateauMarge, 2.4 * borner(f, 0.5, 3), 1e-9);
        // ATTENDU MODIFIÉ (formes d'eau) : la carte suit le plus grand extent ; plafond 3,2 pour l'étang, 6 pour un autre profil.
        checkClose(id + ' : carte 3D à l’échelle (260 × f borné [0,25 ; 3,2])', monde.monde3D, 260 * borner(fx, 0.25, etang ? 3.2 : 6), 1e-9);

        // Le pêcheur reste au poste de départ, sur la berge, et rien ne l'a laissé en l'air
        const a = G().angler.position;
        const pecheur = polaire(a, centre);
        checkClose(id + ' : le pêcheur de départ est resté au même endroit (rive sud)', Math.hypot(a.x - origine.pecheur.x, a.z - origine.pecheur.z), 0, 1e-6);
        checkClose(id + ' : …à 2,2 unités de la berge locale', pecheur.distance - pecheur.contour, 2.2, 1e-6);
        checkEqual(id + ' : poste sud', G().getPoste().id, 'sud');
        checkEqual(id + ' : la partie a redémarré proprement (ligne au repos)', G().getState(), 'idle');
        checkEqual(id + ' : pas en barque', G().isBateau(), false);
        check(id + ' : le pêcheur est sur la terre ferme', pecheur.distance > pecheur.contour);
        const cam = G().getCameraTarget();
        check(id + ' : la caméra regarde vers l’étang (cible dans le contour ou devant)', Number.isFinite(cam.x) && Number.isFinite(cam.z));

        // Décor : tout est dans le contour (nénuphars, roseaux) ou dehors (arbres, rochers)
        const D = G().decor;
        const d = densitesDecor(m);
        check(id + ' : arbres hors de l’eau (≥ rive + 4)', D.arbres.every(function (t) { const p = polaire(t, centre); return p.distance >= p.contour + 4 - 1e-9; }));
        check(id + ' : nénuphars dans l’eau', G().lilyPads.every(function (l) { const p = polaire(l, centre); return p.distance < p.contour; }));
        check(id + ' : roseaux dans l’eau, près de la rive', D.roseaux.every(function (r) { const p = polaire(r, centre); return p.distance < p.contour && p.distance > p.contour * 0.5; }));
        check(id + ' : rochers sur la berge', D.rochers.every(function (r) { const p = polaire(r, centre); return p.distance > p.contour; }));
        checkEqual(id + ' : arbres ≤ compte du biotope (' + d.arbres + ')', D.arbres.length <= d.arbres, true);
        check(id + ' : au moins la moitié des arbres posés', D.arbres.length >= Math.floor(d.arbres * 0.5), D.arbres.length + ' / ' + d.arbres);
        // Bande des arbres [distance à la rive, largeur] : (8, 45) × f en général, (6, 30) en forêt, (10, 55) en montagne ; jamais sous [5 ; 15].
        const bande = styleDecor(m).bandeArbres;
        const base = { foret: [6, 30], montagne: [10, 55] }[id] || [8, 45];
        check(id + ' : bande des arbres × f (jamais < [5 ; 15])',
            Math.abs(bande[0] - Math.max(5, base[0] * f)) < 1e-9 && Math.abs(bande[1] - Math.max(15, base[1] * f)) < 1e-9, JSON.stringify(bande));
        check(id + ' : l’herbe suit le contour', D.vegetation.herbe.count > 0);

        // Obstacles : positions × f, tailles inchangées, aucun ne sort du nouveau contour
        const liste = G().obstacles.liste;
        check(id + ' : au moins un obstacle', liste.length >= 1, liste.length + ' obstacles');
        check(id + ' : chaque obstacle a son centre dans l’eau (contour − 1,5)', liste.every(function (o) {
            return o.cercles.every(function (c) { if (!c.eau) { return true; } const p = polaire(c, centre); return p.distance <= p.contour - 1.5 + 1e-9; });
        }));
        check(id + ' : aucun obstacle sur un arbre, un rocher ou un nénuphar', liste.every(function (o) {
            return o.cercles.every(function (c) {
                return D.arbres.every(function (t) { return Math.hypot(c.x - t.x, c.z - t.z) >= c.r + t.r - 1e-9; })
                    && D.rochers.every(function (t) { return Math.hypot(c.x - t.x, c.z - t.z) >= c.r - 1e-9; })
                    && (!c.eau || G().lilyPads.every(function (l) { return Math.hypot(c.x - l.x, c.z - l.z) >= c.r + l.radius - 1e-9; }));
            });
        }));
        check(id + ' : tailles des obstacles inchangées (le ponton garde ses 6 cercles de rayon 2)', liste.every(function (o) {
            return o.type !== 'ponton' || (o.cercles.length === 6 && o.cercles.every(function (c) { return c.r === 2; }));
        }));
        check(id + ' : obstacles loin des quatre postes', liste.every(function (o) {
            return G().obstacles.postesRef.every(function (ref) { return Math.hypot(o.x - ref.pecheur.x, o.z - ref.pecheur.z) > 1; });
        }));

        // Poissons : tous dans l'eau, domaines ×f
        check(id + ' : tous les poissons sont dans l’eau', G().fishes.every(function (p) { const q = polaire(p.position, centre); return q.distance < q.contour; }));
        check(id + ' : chaque poisson vit dans l’eau (zone de vie dans le contour)', G().fishes.every(function (p) {
            const q = polaire({ x: p.userData.homeX, z: p.userData.homeZ }, centre);
            return q.distance < q.contour;
        }));
        check(id + ' : territoires × f (homeRadius ≤ domaine × 1,15 × f)', G().fishes.every(function (p) {
            const dom = p.userData.comp ? p.userData.comp.domaine : 22;
            return p.userData.homeRadius <= dom * 1.15 * f + 1e-9 && p.userData.homeRadius >= dom * 0.85 * f - 1e-9;
        }));
        vus[id] = { arbres: D.arbres.length, roseaux: D.roseaux.length, rochers: D.rochers.length, nenuphars: G().lilyPads.length, d: d };
    });

    // --- Comptes : forêt < plaine < montagne (rochers) et comptes ≈ × f --------------------------------------
    const dp = densitesDecor('plaine');
    checkEqual('plaine : les comptes d’origine (64 arbres, 40 nénuphars, 70 roseaux, 24 rochers)',
        [dp.arbres, dp.nenuphars, dp.roseaux, dp.rochers].join(','), '64,40,70,24');
    MILIEUX.forEach(function (m) {
        const f = echelleMilieu(m);
        const d = densitesDecor(m);
        const t = m.decor;
        const attendu = function (n, k) { return n > 0 ? Math.max(1, Math.round(n * k)) : 0; };
        checkEqual(m.id + ' : arbres ≈ × f', d.arbres, attendu(t.arbres, f));
        checkEqual(m.id + ' : roseaux ≈ × f', d.roseaux, attendu(t.roseaux, f));
        checkEqual(m.id + ' : rochers ≈ × f', d.rochers, attendu(t.rochers, f));
        checkEqual(m.id + ' : nénuphars ≈ × f² borné [0,3 ; 3]', d.nenuphars, attendu(t.nenuphars, borner(f * f, 0.3, 3)));
    });
    check('forêt < plaine < montagne : rochers posés', vus.foret.rochers < vus.plaine.rochers && vus.plaine.rochers < vus.montagne.rochers,
        vus.foret.rochers + ' < ' + vus.plaine.rochers + ' < ' + vus.montagne.rochers);
    check('forêt < plaine < rivière : roseaux posés', vus.foret.roseaux < vus.plaine.roseaux && vus.plaine.roseaux < vus.riviere.roseaux,
        vus.foret.roseaux + ' < ' + vus.plaine.roseaux + ' < ' + vus.riviere.roseaux);
    check('forêt < canal < carnassiers < plaine : arbres (au rapport f près)',
        vus.foret.arbres < vus.carnassiers.arbres && vus.carnassiers.arbres < vus.plaine.arbres);

    // --- Lancer et postes : la portée suit la taille, les quatre postes restent sur la berge ------------------
    ['foret', 'canal', 'plaine', 'montagne', 'riviere'].forEach(function (id) {
        const m = milieuParId(id);
        choisirSurAccueil(id);
        resetToIdle();
        const centre = G().getPondCenter();
        [1, 2, 3, 0].forEach(function (i) {
            G().placerAuPoste(i);
            const p = polaire(G().angler.position, centre);
            check(id + ' : poste ' + G().getPoste().id + ' : à 2,2 unités de la berge locale', Math.abs(p.distance - p.contour - 2.2) < 1e-6,
                (p.distance - p.contour).toFixed(3));
        });
        const portee = porteeLancer(m.rayon, formeDe(m));
        // Lancer à 95 % de la jauge vers le centre : 7 + 0,95 × (portée − 7) unités (dans l'étang assez large pour cela).
        G().startCastCharge({ x: centre.x, y: 0, z: centre.z });
        G().setCastPower(0.95);
        G().releaseCast();
        for (let t = 0; t < 4 && G().getState() === 'flying'; t += 0.05) { G().step(0.05); }
        G().step(0.05);
        const flotteur = G().floatGroup.position;
        const lance = Math.hypot(flotteur.x - G().angler.position.x, flotteur.z - G().angler.position.z);
        const q = polaire(flotteur, centre);
        check(id + ' : le bouchon retombe dans l’eau', q.distance < q.contour, lance.toFixed(1) + ' unités');
        check(id + ' : le lancer ne dépasse jamais la portée (' + portee + ')', lance <= portee + 1.5, lance.toFixed(1) + ' ≤ ' + portee);
        if (id !== 'foret') {
            checkClose(id + ' : lancer à 95 % ≈ 7 + 0,95 × (portée − 7)', lance, 7 + 0.95 * (portee - 7), 3);
        }
        resetToIdle();
    });

    // --- Barque : limites × f -------------------------------------------------------------------------------------
    G().recommencerPartie();
    G().setExperience(G().getBateauPrix());
    G().acheterBateau();
    ['foret', 'canal', 'riviere', 'plaine'].forEach(function (id) {
        const m = milieuParId(id);
        choisirSurAccueil(id);
        G().setExperience(G().getBateauPrix());
        G().acheterBateau();
        resetToIdle();
        const centre = G().getPondCenter();
        checkEqual(id + ' : on embarque', G().embarquerBateau(), true);
        const p = polaire(G().angler.position, centre);
        check(id + ' : à bord, le pêcheur est dans l’eau', p.distance < p.contour);
        check(id + ' : à bord, jamais à moins de 10 × f du centre', p.distance >= 10 * echelleMilieu(m) - 1e-6,
            p.distance.toFixed(2) + ' ≥ ' + (10 * echelleMilieu(m)).toFixed(2));
        // On rame vers le centre : la limite s'applique, la barque ne passe jamais la limite.
        for (let i = 0; i < 80; i++) { G().deplacerBateau(0, 2.4 * echelleMilieu(m)); }
        const q = polaire(G().angler.position, centre);
        check(id + ' : en ramant vers le centre, la barque s’arrête à 10 × f du centre', q.distance >= 10 * echelleMilieu(m) - 1e-6 && q.distance < q.contour,
            q.distance.toFixed(2));
        for (let i = 0; i < 80; i++) { G().deplacerBateau(0, -2.4 * echelleMilieu(m)); }
        const r = polaire(G().angler.position, centre);
        check(id + ' : en ramant vers la rive, la barque reste dans l’eau', r.distance < r.contour, (r.contour - r.distance).toFixed(2) + ' de la berge');
        checkEqual(id + ' : on débarque', G().quitterBateau(), true);
    });

    // --- 3) La plaine est EXACTEMENT le monde d'origine, après un tour par toutes les tailles ----------------------
    G().setGraine(GRAINE_TEMOIN);
    choisirSurAccueil('plaine');
    const retour = {
        centre: G().getPondCenter(), fosses: JSON.stringify(G().getEtangInfo().fosses), monde: G().getMonde(), info: G().getEtangInfo(),
        decor: JSON.stringify([G().decor.arbres, G().decor.lilyPads, G().decor.roseaux, G().decor.rochers]),
        obstacles: G().obstacles.empreinte(), grille: G().substrats.empreinte(),
        contour: [0, 1, 2, 3, 4, 5, 6].map(function (a) { return G().getRayonEtang(a); }),
        profondeurs: [[0, -40], [-20, -90], [30, -55], [4, -123]].map(function (p) { return G().profondeurLocale(p[0], p[1]); })
    };
    checkEqual('retour en plaine : rayon 90', retour.monde.rayon, 90);
    // ATTENDU MODIFIÉ (graine) : « même centre (0, -71) » → même centre que la plaine de la même graine, au bit près.
    checkEqual('retour en plaine : même centre, au bit près', JSON.stringify(retour.centre), JSON.stringify(origine.centre));
    checkEqual('retour en plaine : mêmes fosses, au bit près', retour.fosses, origine.fosses);
    checkEqual('retour en plaine : même contour, au bit près', JSON.stringify(retour.contour), JSON.stringify(origine.contour));
    checkEqual('retour en plaine : même relief, au bit près', JSON.stringify(retour.profondeurs), JSON.stringify(origine.profondeurs));
    checkEqual('retour en plaine : même rayon max, même surface, même profondeur max',
        [retour.monde.rayonMax, retour.info.surfaceHa, retour.info.profondeurMax, retour.info.rayonCadre].join(' '),
        [origine.monde.rayonMax, origine.info.surfaceHa, origine.info.profondeurMax, origine.info.rayonCadre].join(' '));
    checkEqual('retour en plaine : le décor d’origine est rejoué à l’identique', retour.decor, origine.decor);
    checkEqual('retour en plaine : les obstacles sont aux mêmes places', retour.obstacles, origine.obstacles);
    checkEqual('retour en plaine : la grille des fonds est celle d’origine', retour.grille, origine.grille);
    checkEqual('retour en plaine : brume, ciel, plan lointain et portées d’origine',
        JSON.stringify([retour.monde.brume, retour.monde.ciel, retour.monde.cameraFar, retour.monde.porteeLancer, retour.monde.porteeAmorce, retour.monde.monde3D, retour.monde.pasBateauMarge]),
        JSON.stringify([origine.monde.brume, origine.monde.ciel, origine.monde.cameraFar, origine.monde.porteeLancer, origine.monde.porteeAmorce, origine.monde.monde3D, origine.monde.pasBateauMarge]));
    checkClose('retour en plaine : le pêcheur est à sa place d’origine',
        Math.hypot(G().angler.position.x - origine.pecheur.x, G().angler.position.z - origine.pecheur.z), 0, 1e-9);

    // --- Déterminisme : même biotope deux fois, même géométrie, même décor, mêmes obstacles ---------------------
    choisirSurAccueil('montagne');
    const m1 = JSON.stringify([G().decor.arbres, G().decor.roseaux, G().decor.rochers]) + G().obstacles.empreinte() + G().substrats.empreinte();
    const c1 = JSON.stringify(G().getPondCenter());
    choisirSurAccueil('riviere');
    choisirSurAccueil('montagne');
    checkEqual('montagne revue : même centre', JSON.stringify(G().getPondCenter()), c1);
    checkEqual('montagne revue : même décor, mêmes obstacles, mêmes fonds',
        JSON.stringify([G().decor.arbres, G().decor.roseaux, G().decor.rochers]) + G().obstacles.empreinte() + G().substrats.empreinte(), m1);
    check('la grille des fonds suit la taille de l’étang (cellule plus grande en montagne)', G().substrats.cellule > 1 && G().substrats.cellule <= 2.5,
        String(G().substrats.cellule));
    choisirSurAccueil('foret');
    check('la grille des fonds est plus fine dans la forêt', G().substrats.cellule < 1 && G().substrats.cellule >= 0.35, String(G().substrats.cellule));
    check('tous les types de fond existent dans la forêt (grille couvrant l’étang)', Object.keys(G().substrats.parts).every(function (k) { return G().substrats.parts[k] >= 0; })
        && Object.keys(G().substrats.parts).reduce(function (t, k) { return t + G().substrats.parts[k]; }, 0) > 0.999);

    // --- Retour à un état propre ----------------------------------------------------------------------------------
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    G().setGraine(20240101);
    G().repeuplerEtang();
    checkEqual('fin : le monde est en plaine', G().milieux.courant().id, 'plaine');
    G().recommencerPartie();
}

export default run;

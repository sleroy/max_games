// ---------------------------------------------------------------------------
// Scénario 72 : LE GRAND ÉTANG (idées.md §14.1 et §14.4, v173).
//
// « Étang moyen + zones profondes » : rayon nominal 55 → 90 (≈ 45 m, ≈ 0,64 ha),
// trois fosses plus larges et plus profondes, atteignables en barque, et ≈ 58
// poissons (densité par hectare inchangée, biomasse réaliste, solitaires rares).
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, resetToIdle, clearLilyPads, castTo, stepUntil, state, lancerSonar
} from './harness.mjs';

// Somme des amplitudes du bruit du contour (voir BRUIT_ETANG dans environnement.js).
const SOMME_BRUIT = 0.105 + 0.060 + 0.035 + 0.020;
const PORTEE_LANCER_MAX = 52;        // CAST_MAX_RANGE (lancerCanne.js)
const FENETRE_FOND = 1.2;            // un poisson de fond mord ≤ 1,2 sous l'hameçon

function distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Rayon et angle (centre → point) d'un point du monde. */
function polaire(point, centre) {
    const dx = point.x - centre.x;
    const dz = point.z - centre.z;
    return { angle: Math.atan2(dz, dx), distance: Math.hypot(dx, dz) };
}

/** Coordonnées x/y (nombres) trouvées dans les attributs d'un SVG. */
function coordonneesSvg(svg, attribut) {
    const trouve = [];
    const regle = new RegExp(attribut + '="(-?[0-9.]+)"', 'g');
    let m;
    while ((m = regle.exec(svg))) { trouve.push(parseFloat(m[1])); }
    return trouve;
}

export function run() {
    group('72) Grand étang : rayon 90, fosses profondes, ≈ 58 poissons');
    G().recommencerPartie();
    resetToIdle();
    clearLilyPads();

    const info = G().getEtangInfo();
    const centre = G().getPondCenter();

    // --- 1) Le rayon ---
    checkEqual('rayon nominal de l’étang = 90 (45 m)', G().getPondRadius(), 90);
    checkClose('rayon max = 90 × (1 + somme des amplitudes du bruit) = 109,8',
        G().getRayonEtangMax(), 90 * (1 + SOMME_BRUIT), 1e-9);
    let mini = Infinity;
    let maxi = 0;
    let aire = 0;
    const N = 3600;
    for (let i = 0; i < N; i++) {
        const r = G().getRayonEtang((i / N) * Math.PI * 2);
        mini = Math.min(mini, r);
        maxi = Math.max(maxi, r);
        aire += r * r / 2 * (Math.PI * 2 / N);
    }
    check('le contour reste borné par le bruit (rayon entre 90 × 0,78 et le maximum exposé)',
        mini >= 90 * (1 - SOMME_BRUIT) - 1e-9 && maxi <= G().getRayonEtangMax() + 1e-9,
        mini.toFixed(1) + ' → ' + maxi.toFixed(1) + ' (borne ' + G().getRayonEtangMax().toFixed(1) + ')');
    const hectares = aire / 4 / 10000;      // 2 unités = 1 m → 4 unités² = 1 m²
    check('la surface de l’eau est ≈ 0,64 ha (0,23 ha avant)', hectares > 0.6 && hectares < 0.68,
        hectares.toFixed(3) + ' ha');
    checkClose('la surface exposée au peuplement est la même que celle du contour',
        info.surfaceHa, hectares, 1e-3);

    // --- 2) La profondeur : bord, centre, fosses ---
    const angleBord = 1.1;
    const rBord = G().getRayonEtang(angleBord);
    const profBord = G().profondeurLocale(
        centre.x + Math.cos(angleBord) * rBord, centre.z + Math.sin(angleBord) * rBord);
    checkClose('au bord, la profondeur est de 1,4 unité (0,7 m)', profBord, 1.4, 1e-6);
    checkClose('au centre, la profondeur est de 5 unités (2,5 m) hors fosse',
        G().profondeurLocale(centre.x, centre.z), 5, 1e-6);
    check('le centre est au moins 3 fois plus profond que le bord',
        G().profondeurLocale(centre.x, centre.z) > profBord * 3);

    check('l’étang a au moins 3 fosses', info.fosses.length >= 3, String(info.fosses.length));
    let profMesuree = 0;
    let profMesureeEn = null;
    for (let x = centre.x - 115; x <= centre.x + 115; x += 1) {
        for (let z = centre.z - 115; z <= centre.z + 115; z += 1) {
            const { angle, distance } = polaire({ x, z }, centre);
            if (distance >= G().getRayonEtang(angle)) { continue; }
            const p = G().profondeurLocale(x, z);
            if (p > profMesuree) { profMesuree = p; profMesureeEn = { x, z }; }
        }
    }
    check('la profondeur max (grille d’1 unité) est celle annoncée par le jeu (≤ 0,05)',
        Math.abs(profMesuree - info.profondeurMax) < 0.05,
        profMesuree.toFixed(2) + ' vs ' + info.profondeurMax);
    check('la profondeur max est 8,1 unités (≈ 4 m) : bien plus que les 6,6 d’avant',
        info.profondeurMax > 7.5 && info.profondeurMax <= 8.2, info.profondeurMax + ' unités');
    check('le point le plus profond est DANS une fosse',
        info.fosses.some(f => distance2D(profMesureeEn, f) < f.rayon),
        profMesureeEn.x + ',' + profMesureeEn.z);
    G().setFloatType('anglaise');
    check('l’hameçon peut descendre jusqu’au fond d’une fosse (bouchon ≥ fond max)',
        G().getBornesProfondeur()[1] >= info.profondeurMax,
        G().getBornesProfondeur()[1] + ' ≥ ' + info.profondeurMax);
    check('… et un poisson de fond mord à cette profondeur (fond − fenêtre ≤ maxi du bouchon)',
        info.profondeurMax - FENETRE_FOND <= G().getBornesProfondeur()[1]);

    info.fosses.forEach(function (fosse, index) {
        const nom = 'fosse ' + (index + 1);
        const prof = G().profondeurLocale(fosse.x, fosse.z);
        const { angle, distance } = polaire(fosse, centre);
        const bord = G().getRayonEtang(angle);
        check(nom + ' : plus profonde que le centre du bassin (≥ +2,0)', prof >= 5 + 2.0,
            prof.toFixed(2) + ' unités');
        check(nom + ' : large (≥ 16 unités de rayon, 8 m)', fosse.rayon >= 16,
            fosse.rayon + ' unités');
        check(nom + ' : entièrement dans l’eau, à ≥ 5 unités de la rive',
            distance + fosse.rayon <= bord - 5,
            (distance + fosse.rayon).toFixed(1) + ' ≤ ' + (bord - 5).toFixed(1));
        // La fosse est un creux : son bord est moins profond que son centre.
        const dehors = G().profondeurLocale(fosse.x + fosse.rayon, fosse.z);
        check(nom + ' : le centre est plus profond que le bord de la fosse',
            prof > dehors + 1, prof.toFixed(2) + ' > ' + dehors.toFixed(2));
    });

    // --- 3) Les fosses sont atteignables EN BARQUE (et pas du bord pour les grandes) ---
    G().setExperience(G().getBateauPrix());
    G().acheterBateau();                 // (déjà achetée par un scénario précédent : sans effet)
    G().setFloatType('coulisse');
    const pas = info.pasBateau;
    check('un pas de rame avance de 2,4 unités (1,6 avant : l’étang est 1,6 × plus grand)',
        Math.abs(pas.marge - 2.4) < 1e-9, pas.marge + ' unités');

    info.fosses.forEach(function (fosse, index) {
        const nom = 'fosse ' + (index + 1);
        const { angle, distance } = polaire(fosse, centre);
        const rayon = G().getRayonEtang(angle);
        // Distance depuis la rive la plus proche (même direction) : la portée d'un lancer
        // depuis la berge est de 52 unités au plus.
        const depuisLaRive = rayon - distance;
        // Départ : le poste sud, en barque (milieu de l'étang dans la même direction).
        G().placerAuPoste(0);
        resetToIdle();
        G().embarquerBateau();
        const avant = G().getEmplacement();
        const margeVoulue = distance - rayon;                 // négative : dans l'eau
        const ecartAngle = Math.atan2(Math.sin(angle - avant.angle), Math.cos(angle - avant.angle));
        const ok = G().deplacerBateau(ecartAngle, margeVoulue - avant.marge);
        const p = G().angler.position;
        checkEqual(nom + ' : la barque est à bord et peut rejoindre le centre de la fosse',
            ok && G().isBateau(), true);
        check(nom + ' : la barque est bien au-dessus (≤ 1 unité du centre)',
            distance2D(p, fosse) < 1, distance2D(p, fosse).toFixed(2) + ' unités');
        // Combien de coups de rame depuis le milieu de l'étang (embarquement) ?
        const pasMarge = Math.ceil(Math.abs(margeVoulue - avant.marge) / pas.marge);
        const pasAngle = Math.ceil(Math.abs(ecartAngle) / pas.angle);
        check(nom + ' : ≤ 70 coups de rame depuis l’embarquement (≈ 20 s en maintenant)',
            pasMarge + pasAngle <= 70, (pasMarge + pasAngle) + ' coups');

        // On y pêche : la ligne descend au fond, sans vase, et un poisson de fond mord.
        const cible = { x: fosse.x + 2, z: fosse.z };   // le centre : fond plat, la dérive du vent ne change rien
        const prof = G().profondeurLocale(cible.x, cible.z);
        G().setProfondeur(prof - 0.8);
        checkEqual(nom + ' : un lancer depuis la barque se pose dans la fosse',
            castTo(cible.x, cible.z), 'inWater');
        check(nom + ' : la ligne pend à ≥ 0,8 du fond (pas de vase)',
            !G().isHameconDansLaVase(), G().getProfondeur() + ' / ' + prof.toFixed(2));
        const bouchon = G().floatGroup.position;
        const fond = G().fishes.find(f => !f.userData.hooked && !f.userData.biting
            && f.userData.couche === 'fond');
        const yFond = G().fondY(bouchon.x, bouchon.z);
        fond.position.set(bouchon.x, yFond + 0.5, bouchon.z);
        fond.userData.depth = yFond + 0.45;
        fond.userData.homeX = bouchon.x;
        fond.userData.homeZ = bouchon.z;
        fond.userData.homeRadius = 20;
        fond.userData.comp = Object.assign({}, fond.userData.comp, { vue: 12, nocturne: false });   // diurne : facteur de touche neutre à midi (physique.js)
        fond.userData.vx = 0;
        fond.userData.vz = 0;
        check(nom + ' : un poisson de fond mord au fond de la fosse',
            stepUntil(() => state() === 'bite', 8), state());
        resetToIdle();
        G().setProfondeur(2.5);

        // Depuis la rive : seule la fosse proche de la berge se lance à pied.
        if (index < 2) {
            check(nom + ' : hors de portée d’un lancer depuis la rive (> 52 unités)',
                depuisLaRive > PORTEE_LANCER_MAX, depuisLaRive.toFixed(1) + ' unités de la rive');
        } else {
            check(nom + ' : reste accessible depuis la rive nord (≤ 52 unités)',
                depuisLaRive <= PORTEE_LANCER_MAX, depuisLaRive.toFixed(1) + ' unités de la rive');
        }
    });
    G().quitterBateau();

    // --- 4) La barque ne sort jamais des bornes du nouvel étang ---
    G().embarquerBateau();
    let pire = { rive: -Infinity, centre: Infinity };
    let essais = 0;
    for (let i = 0; i < 400; i++) {
        const dAngle = Math.sin(i * 12.9898) * 1.2;
        const dMarge = Math.sin(i * 78.233) * 160;           // coups de rame énormes
        G().deplacerBateau(dAngle, dMarge);
        const q = G().angler.position;
        const { angle, distance } = polaire(q, centre);
        pire.rive = Math.max(pire.rive, distance - G().getRayonEtang(angle));
        pire.centre = Math.min(pire.centre, distance);
        essais++;
    }
    check('la barque reste à ≥ 4 unités DANS l’eau, quel que soit le coup de rame',
        pire.rive <= -3.9, pire.rive.toFixed(2) + ' unités du bord (' + essais + ' essais)');
    check('la barque reste à ≥ 10 unités du centre', pire.centre >= 9.9,
        pire.centre.toFixed(2) + ' unités');
    G().quitterBateau();

    // --- 5) Le sonar se pose dans l'eau depuis chaque poste et depuis la barque ---
    if (G().reinitialiserSonar) { G().reinitialiserSonar(); }
    G().setExperience(300);
    fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'sonar' } } });
    // Depuis v179 le sonar se LANCE (visée, maintien, plouf) : on vise le centre de l'étang.
    [0, 1, 2, 3].forEach(function (poste) {
        G().placerAuPoste(poste);
        resetToIdle();
        const b = lancerSonar({ x: centre.x, z: centre.z }, 0.5);
        check('poste ' + poste + ' : la bouée du sonar lancée tombe à l’eau', !!b);
        if (b) {
            const { angle, distance } = polaire(b, centre);
            check('poste ' + poste + ' : la bouée du sonar est à l’eau (≥ 3 unités de la rive)',
                distance <= G().getRayonEtang(angle) - 3, (G().getRayonEtang(angle) - distance).toFixed(1));
            fire('sonarButton', 'click');   // ranger
        }
    });
    G().placerAuPoste(0);
    resetToIdle();
    G().embarquerBateau();
    {
        const b = lancerSonar({ x: centre.x, z: centre.z }, 0.5);
        check('en barque, la bouée du sonar lancée tombe à l’eau', !!b);
        if (b) {
            const { angle, distance } = polaire(b, centre);
            check('en barque, la bouée du sonar est à l’eau',
                distance <= G().getRayonEtang(angle) - 3, distance.toFixed(1));
            fire('sonarButton', 'click');
        }
    }
    G().quitterBateau();
    G().placerAuPoste(0);

    // --- 6) Les cartes couvrent le nouvel étang ---
    // Carte de PLACEMENT (3D) : tout le contour + la couronne tiennent dans les 320 px.
    const carte = G().getPlacementMap();
    check('le terrain représenté couvre le rayon max + la couronne + de la berge',
        carte.monde / 2 >= G().getRayonEtangMax() + carte.margeMax + 10,
        (carte.monde / 2) + ' ≥ ' + (G().getRayonEtangMax() + carte.margeMax + 10).toFixed(0));
    check('le maillage du relief garde ≤ 2 unités par segment',
        carte.monde / carte.segments <= 2, (carte.monde / carte.segments).toFixed(2) + ' unités');
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 90; i++) {
        const angle = (i / 90) * Math.PI * 2;
        [0, 1.4, 3, 6].forEach(function (marge) {
            const proj = G().projeterPlacement(angle, marge);
            minX = Math.min(minX, proj.clientX);
            maxX = Math.max(maxX, proj.clientX);
            minY = Math.min(minY, proj.clientY);
            maxY = Math.max(maxY, proj.clientY);
        });
    }
    check('rive + couronne de placement (90 directions) tiennent dans la carte, avec 12 px de marge',
        minX >= 12 && maxX <= 308 && minY >= 12 && maxY <= 308,
        'x ' + minX.toFixed(0) + '→' + maxX.toFixed(0) + ' / y ' + minY.toFixed(0) + '→' + maxY.toFixed(0));
    info.fosses.forEach(function (fosse, i) {
        const y = G().getHauteurCarte(fosse.x, fosse.z);
        check('fosse ' + (i + 1) + ' : visible dans le relief de la carte (≤ −6)', y <= -6, y.toFixed(2));
    });

    // Carte du CARNET (SVG 200 × 120) : le pêcheur, la bourriche et le contour restent dans le cadre.
    [-Math.PI, -1.5, -0.4, 0.8, 1.6, 2.4, 3.1].forEach(function (angle) {
        [1.4, 6].forEach(function (marge) {
            G().choisirEmplacement(angle, marge);
            G().showJournal();
            const svg = el('pondMap').innerHTML;
            const xs = coordonneesSvg(svg, 'cx');
            const ys = coordonneesSvg(svg, 'cy');
            const dansLeCadre = xs.every(x => x >= 0 && x <= 200) && ys.every(y => y >= 0 && y <= 120);
            const trace = (svg.match(/d="M([^"]*)"/) || [])[1] || '';
            const nombres = (trace.match(/-?[0-9.]+/g) || []).map(Number);
            const contourOk = nombres.every((v, k) => k % 2 === 0 ? (v >= 0 && v <= 200) : (v >= 0 && v <= 120));
            check('carte du carnet, poste ' + angle.toFixed(1) + ' rad / marge ' + marge
                + ' : pêcheur, bourriche et contour dans le cadre', dansLeCadre && contourOk && nombres.length > 100,
                'cx ' + Math.min(...xs).toFixed(0) + '→' + Math.max(...xs).toFixed(0)
                + ' cy ' + Math.min(...ys).toFixed(0) + '→' + Math.max(...ys).toFixed(0));
            G().hideJournal();
        });
    });
    G().showJournal();
    const svgCarnet = el('pondMap').innerHTML;
    check('la carte du carnet annonce la profondeur max des fosses (4,1 m)',
        svgCarnet.indexOf('4,1 m') >= 0, 'légende / étiquettes de fosses');
    check('la carte du carnet dessine les 3 fosses',
        (svgCarnet.match(/>fosse /g) || []).length === info.fosses.length);
    G().hideJournal();
    G().placerAuPoste(0);

    // --- 7) La population (§14.4) ---
    const pop = G().getPopulation();
    check('population ≈ 110–125 poissons en mode normal (surface × densité × 2)',
        pop.total >= 105 && pop.total <= 130, pop.total + ' poissons');
    checkEqual('le nombre de poissons est la cible calculée', pop.total, pop.cible);
    check('FISH_COUNT n’est plus qu’un plafond (≥ cible)', pop.plafond >= pop.cible,
        pop.plafond + ' ≥ ' + pop.cible);
    // v197 : la densité dépend de la DIFFICULTÉ (×1,5 / ×2 / ×3 sur 90/ha).
    // En mode normal (×2) : ≈ 180 poissons/ha.
    check('densité en mode normal : ≈ 180 poissons/ha (×2 sur 90)',
        pop.poissonsParHa >= 160 && pop.poissonsParHa <= 200, pop.poissonsParHa + ' /ha');
    check('au moins 10 espèces différentes', pop.especes >= 10, pop.especes + ' espèces');
    const rares = pop.solitairesListe;
    check('les solitaires (silure, brochet, sandre, black-bass, truite, anguille) restent rares : ≤ 2 chacun',
        rares.every(id => (pop.parEspece[id] || 0) <= 2), JSON.stringify(
            rares.map(id => id + ':' + (pop.parEspece[id] || 0))));
    check('… et un seul silure au plus', (pop.parEspece.silure || 0) <= 1);
    check('… et ils font moins de 20 % de la population', pop.solitaires / pop.total <= 0.2,
        (100 * pop.solitaires / pop.total).toFixed(0) + ' %');
    const bancs = pop.total - pop.solitaires;
    check('les poissons de banc portent l’essentiel du nombre (≥ 80 %)', bancs / pop.total >= 0.8,
        bancs + ' sur ' + pop.total);
    check('biomasse réaliste : 100 à 300 kg/ha', pop.biomasseKgHa >= 100 && pop.biomasseKgHa <= 300,
        pop.biomasseKg + ' kg → ' + pop.biomasseKgHa + ' kg/ha');
    const dansLEau = G().fishes.every(function (f) {
        const { angle, distance } = polaire(f.position, centre);
        return distance <= G().getRayonEtang(angle) - 5;
    });
    check('tous les poissons naissent dans l’eau, à ≥ 5 unités de la rive', dansLEau);

    // Plusieurs tirages successifs : la population reste réaliste à chaque fois.
    let pires = { biomasse: [Infinity, 0], total: [Infinity, 0], especes: Infinity, rares: 0 };
    let tirages = 0;
    let dansUneFosse = 0;
    let poissonsDeFosse = 0;
    for (let i = 0; i < 12; i++) {
        G().repeuplerEtang();
        const s = G().getPopulation();
        tirages++;
        pires.biomasse = [Math.min(pires.biomasse[0], s.biomasseKgHa), Math.max(pires.biomasse[1], s.biomasseKgHa)];
        pires.total = [Math.min(pires.total[0], s.total), Math.max(pires.total[1], s.total)];
        pires.especes = Math.min(pires.especes, s.especes);
        pires.rares = Math.max(pires.rares, ...rares.map(id => s.parEspece[id] || 0));
        G().fishes.forEach(function (f) {
            if (['silure', 'anguille', 'sandre'].indexOf(f.userData.especeId) >= 0) {
                poissonsDeFosse++;
                if (info.fosses.some(fo => distance2D(f.position, fo) < fo.rayon)) { dansUneFosse++; }
            }
        });
    }
    check('12 tirages : population stable autour de 110–125 poissons (mode normal)',
        pires.total[0] >= 105 && pires.total[1] <= 130, pires.total.join(' → '));
    check('12 tirages : biomasse toujours dans 100–300 kg/ha',
        pires.biomasse[0] >= 100 && pires.biomasse[1] <= 300, pires.biomasse.join(' → ') + ' kg/ha');
    check('12 tirages : toujours ≥ 10 espèces', pires.especes >= 10, String(pires.especes));
    check('12 tirages : jamais plus de 2 poissons d’une même espèce solitaire', pires.rares <= 2,
        String(pires.rares));
    check('silure, anguille et sandre naissent dans les fosses (refuge du poisson de fond)',
        poissonsDeFosse === 0 || dansUneFosse === poissonsDeFosse,
        dansUneFosse + ' sur ' + poissonsDeFosse + ' dans une fosse (' + tirages + ' tirages)');

    // Un poisson pêché est remplacé SANS dépasser le quota des solitaires.
    G().repeuplerEtang();
    const avantRemplacement = G().fishes.length;
    for (let i = 0; i < 60; i++) {
        G().fishes.splice(0, 1);          // un poisson pêché quitte l'étang…
        G().spawnFish();                  // … et un autre le remplace
    }
    const apres = G().getPopulation();
    checkEqual('60 remplacements : le nombre de poissons ne change pas', apres.total, avantRemplacement);
    check('60 remplacements : les quotas de solitaires tiennent (≤ 2, silure ≤ 1)',
        rares.every(id => (apres.parEspece[id] || 0) <= 2) && (apres.parEspece.silure || 0) <= 1,
        JSON.stringify(apres.parEspece));
    resetToIdle();

    // --- 8) Pas plus facile : même densité par surface qu'avant ---
    G().setGraine(20240101);   // mesure statistique : indépendante de l'aléatoire consommé avant
    G().repeuplerEtang();
    const ancienneDensite = 20 / (Math.PI * 55 * 55 * 1.0108);     // 20 poissons, rayon 55
    const densite = G().fishes.length / (info.surfaceHa * 4 * 10000);
    // v197 : décision du joueur — la densité augmente avec la difficulté choisie
    // (×2 en normal). On vérifie simplement qu'elle reste dans la fourchette prévue.
    check('densité par surface conforme au facteur de difficulté (×2 en normal)',
        densite <= ancienneDensite * 2.4, (densite * 1000).toFixed(2) + ' ‰ vs ' + (ancienneDensite * 1000).toFixed(2) + ' ‰ avant (poissons par 1 000 u²)');
    // Poissons dans le rayon de vue d'un appât (8 unités) autour de 600 points d'eau, en moyenne sur
    // 5 peuplements (un seul tirage varie de ± 0,1 selon la répartition des bancs).
    let somme = 0;
    let mesures = 0;
    for (let tirage = 0; tirage < 5; tirage++) {
        G().setGraine(20240101 + tirage);
        G().repeuplerEtang();
        for (let i = 0; i < 600; i++) {
            const angle = i * 2.399963;                            // angle d'or : répartition régulière
            const r = Math.sqrt((i + 0.5) / 600) * (G().getRayonEtang(angle) - 12);
            const px = centre.x + Math.cos(angle) * r;
            const pz = centre.z + Math.sin(angle) * r;
            somme += G().fishes.filter(f => distance2D(f.position, { x: px, z: pz }) < 8).length;
            mesures++;
        }
    }
    const moyenne = somme / mesures;
    // Restaure le peuplement de référence : les scénarios suivants comptent dessus.
    G().setGraine(20240101);
    G().repeuplerEtang();
    // Moyenne sur 5 peuplements : un seul tirage va de 0,68 à 0,83 selon la répartition des bancs.
    // Les poissons naissent à ≥ 12 unités de la rive, donc la zone utile est le disque de rayon R − 12.
    check('un appât voit au plus 0,8 poisson à 8 unités (moyenne sur 5 peuplements)',
        moyenne > 0.3 && moyenne <= 0.8, moyenne.toFixed(2) + ' poisson(s) à 8 unités');

    // --- Retour à un état propre ---
    G().placerAuPoste(0);
    resetToIdle();
    G().demarrerJeu();
}

export default run;

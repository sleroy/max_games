// ---------------------------------------------------------------------------
// Scénario 55 : l'ÉTANG GÉNÉRÉ (idee 3 de idees.md).
// Le bord suit un bruit radial déterministe ; l'eau, le fond, la rive et la
// profondeur locale s'appuient dessus. v173 : le rayon NOMINAL passe de 55 à 90
// (« étang moyen », ≈ 0,64 ha) et les fosses sont plus profondes (voir aussi
// scenario-grand-etang.mjs pour les mesures du nouvel étang).
// ---------------------------------------------------------------------------
import { group, check, checkEqual, checkClose, G, el, resetToIdle } from './harness.mjs';

function rayonDuSommet(mesh, index) {
    const arr = mesh.geometry.attributes.position.array;
    const x = arr[index * 3];
    const z = arr[index * 3 + 2];
    return { rayon: Math.hypot(x, z), angle: Math.atan2(z, x) };
}

/** Écart maximal entre les sommets d'un anneau et le contour attendu. */
function ecartAnneau(mesh, premier, segments, marge) {
    let max = 0;
    for (let s = 0; s < segments; s++) {
        const sommet = rayonDuSommet(mesh, premier + s);
        const attendu = G().getRayonEtang(sommet.angle) + (marge || 0);
        max = Math.max(max, Math.abs(sommet.rayon - attendu));
    }
    return max;
}

export function run() {
    group('55) Étang généré : contour, eau, fond, rive et profondeur');
    G().recommencerPartie();
    resetToIdle();

    const centre = G().getPondCenter();
    const nominal = G().getPondRadius();
    checkEqual('le rayon NOMINAL est 90 (étang moyen, v173 ; c’était 55)', nominal, 90);
    // Avant : 5 (centre) + 1,6 (fosse) = 6,6. Maintenant : fosses plus profondes.
    check('la profondeur maximale a augmenté (fosses plus profondes que les 6,6 d’avant)',
        G().getProfondeurMaxEtang() > 7.5 && G().getProfondeurMaxEtang() <= 8.2,
        G().getProfondeurMaxEtang() + ' unités');
    checkEqual('le centre reste à la profondeur maximale du bassin',
        G().profondeurLocale(centre.x, centre.z), 5);

    // --- 1) Le bruit radial est déterministe et FRANCHEMENT non circulaire ---
    const a1 = 0.83;
    checkClose('le contour est déterministe (même angle, même rayon)',
        G().getRayonEtang(a1), G().getRayonEtang(a1), 0);
    checkClose('le contour fait un tour complet (période 2π)',
        G().getRayonEtang(a1), G().getRayonEtang(a1 + Math.PI * 2), 1e-9);
    const echantillons = [];
    for (let i = 0; i < 720; i++) {
        echantillons.push(G().getRayonEtang((i / 720) * Math.PI * 2));
    }
    const mini = Math.min.apply(null, echantillons);
    const maxi = Math.max.apply(null, echantillons);
    check('l’étang n’est PAS un cercle : le rayon varie fortement',
        maxi - mini > 15, mini.toFixed(2) + ' → ' + maxi.toFixed(2)
        + ' (' + (100 * (maxi - mini) / nominal).toFixed(0) + ' % du rayon)');
    check('la forme reste dans une fourchette crédible (pas un lac gigantesque)',
        mini > 65 && maxi < 115, mini.toFixed(1) + ' / ' + maxi.toFixed(1));
    // Le bruit vaut ±22 % du rayon nominal, mais ses harmoniques ne culminent jamais
    // ensemble : la borne (110) reste à moins de 8 unités du maximum atteint (104).
    check('le rayon maximal exposé est une borne supérieure crédible',
        G().getRayonEtangMax() >= maxi && G().getRayonEtangMax() - maxi < 8,
        G().getRayonEtangMax().toFixed(2) + ' (borne) vs ' + maxi.toFixed(2) + ' (atteint)');
    const valeurs = [];
    for (let i = 0; i < 16; i++) {
        valeurs.push(G().getRayonEtang((i / 16) * Math.PI * 2).toFixed(3));
    }
    check('16 directions donnent bien des rayons différents',
        new Set(valeurs).size >= 14, new Set(valeurs).size + ' valeurs distinctes');

    // --- 2) L'eau suit le contour ---
    const eau = G().water;
    const anneauxEau = 40;    // 22 × 64 avant l'agrandissement : pas de ≈ 2,5 unités
    const segmentsEau = 128;
    checkEqual('le maillage d’eau garde sa résolution', eau.geometry.attributes.position.count,
        1 + anneauxEau * segmentsEau);
    const premierAnneauExterneEau = 1 + (anneauxEau - 1) * segmentsEau;
    const ecartEau = ecartAnneau(eau, premierAnneauExterneEau, segmentsEau, 0);
    check('le bord de l’eau suit exactement le contour généré', ecartEau < 1e-4,
        'écart max ' + ecartEau.toExponential(1) + ' unité');
    check('l’eau conserve l’attribut de profondeur (aDepth)',
        !!eau.geometry.attributes.aDepth);

    // --- 3) Le fond déborde sous la rive en suivant le même contour ---
    const fond = G().getFondMesh();
    const anneauxFond = 40;
    const segmentsFond = 128;
    const premierAnneauExterneFond = 1 + (anneauxFond - 1) * segmentsFond;
    const ecartFond = ecartAnneau(fond, premierAnneauExterneFond, segmentsFond, 2);
    check('le fond suit le contour avec 2 unités de marge', ecartFond < 1e-4,
        'écart max ' + ecartFond.toExponential(1) + ' unité');
    checkEqual('le fond reste en DoubleSide (pas de nappe blanche)',
        G().getFondDoubleFace(), true);

    // --- 4) La rive (anneau) suit le contour, sans rotation ---
    const rive = G().getShoreMesh();
    const segmentsRive = 128;
    const anneauxRive = 4;
    checkEqual('la rive a quatre sommets par segment pour le dégradé de berge',
        rive.geometry.attributes.position.count, segmentsRive * anneauxRive);
    let ecartRive = 0;
    let ecartExterieur = 0;
    for (let s = 0; s < segmentsRive; s++) {
        const interieur = rayonDuSommet(rive, s * anneauxRive);
        const exterieur = rayonDuSommet(rive, s * anneauxRive + anneauxRive - 1);
        ecartRive = Math.max(ecartRive,
            Math.abs(interieur.rayon - G().getRayonEtang(interieur.angle)));
        ecartExterieur = Math.max(ecartExterieur, Math.abs(exterieur.rayon - 430));
    }
    check('le bord intérieur de la rive épouse le contour', ecartRive < 1e-4,
        'écart max ' + ecartRive.toExponential(1) + ' unité');
    check('la rive s’étend jusqu’à 430 unités (brume totale à 480)', ecartExterieur < 1e-4);
    checkClose('la rive est à la bonne hauteur', rive.position.y, 0.35, 1e-9);
    check('la rive n’est plus un anneau tourné (géométrie déjà horizontale)',
        Math.abs(rive.rotation.x) < 1e-9);
    const normales = rive.geometry.attributes.normal;
    check('la rive est éclairée par le dessus (normales vers +y)',
        !!normales && normales.array[1] > 0.9,
        normales ? normales.array[1].toFixed(2) : 'absentes');

    // --- 5) La profondeur locale suit le contour ---
    const angleTest = 0.8;
    const rayonTest = G().getRayonEtang(angleTest);
    const pointBord = {
        x: centre.x + Math.cos(angleTest) * rayonTest * 0.98,
        z: centre.z + Math.sin(angleTest) * rayonTest * 0.98
    };
    const profBord = G().profondeurLocale(pointBord.x, pointBord.z);
    check('au bord (98 % du rayon local), l’eau est peu profonde',
        profBord > 1.3 && profBord < 2, profBord.toFixed(2) + ' unités');
    const pointMilieu = {
        x: centre.x + Math.cos(angleTest) * rayonTest * 0.3,
        z: centre.z + Math.sin(angleTest) * rayonTest * 0.3
    };
    check('vers le centre, l’eau se creuse', G().profondeurLocale(
        pointMilieu.x, pointMilieu.z) > 4.4,
        G().profondeurLocale(pointMilieu.x, pointMilieu.z).toFixed(2) + ' unités');
    // À distance ÉGALE du centre, deux directions n'ont pas la même profondeur.
    const angleMax = (echantillons.indexOf(maxi) / 720) * Math.PI * 2;
    const angleMin = (echantillons.indexOf(mini) / 720) * Math.PI * 2;
    const d = 85;   // 52 avant (près du bord à 55) ; ici près du bord, à 90 de rayon nominal
    const profMax = G().profondeurLocale(
        centre.x + Math.cos(angleMax) * d, centre.z + Math.sin(angleMax) * d);
    const profMin = G().profondeurLocale(
        centre.x + Math.cos(angleMin) * d, centre.z + Math.sin(angleMin) * d);
    check('à 85 unités du centre, la profondeur dépend de la direction',
        Math.abs(profMax - profMin) > 0.15,
        profMax.toFixed(2) + ' vs ' + profMin.toFixed(2) + ' unités');
    const dehors = G().profondeurLocale(
        centre.x + Math.cos(angleTest) * rayonTest * 1.05,
        centre.z + Math.sin(angleTest) * rayonTest * 1.05);
    check('sur la terre ferme, la profondeur est celle du bord',
        Math.abs(dehors - 1.4) < 0.01, dehors.toFixed(2) + ' unités');

    // --- 6) Les 4 postes restent sur la berge, hors de l'eau ---
    [0, 1, 2, 3].forEach(function (index) {
        G().placerAuPoste(index);
        const p = G().angler.position;
        const angle = Math.atan2(p.z - centre.z, p.x - centre.x);
        const rayonLocal = G().getRayonEtang(angle);
        const distance = Math.hypot(p.x - centre.x, p.z - centre.z);
        check('au poste « ' + G().getPoste().id + ' », le pêcheur est hors de l’eau',
            distance > rayonLocal + 0.5,
            distance.toFixed(1) + ' > ' + rayonLocal.toFixed(1) + ' + 0.5');
    });

    // --- 7) La carte du carnet montre le contour généré ---
    G().showJournal();
    const carte = el('pondMap').innerHTML;
    check('la carte dessine le contour généré', carte.indexOf('contour-etang') >= 0);
    check('la carte n’impose plus de cercle au lac',
        carte.indexOf('<circle cx="100" cy="60"') < 0);
    check('les bandes et isobathes suivent le contour (plusieurs paths)',
        (carte.match(/<path/g) || []).length >= 9,
        (carte.match(/<path/g) || []).length + ' chemins');
    check('les isobathes chiffrées sont toujours là',
        carte.indexOf('>1 m<') >= 0 && carte.indexOf('>2 m<') >= 0);
    G().hideJournal();

    G().placerAuPoste(0);
    G().demarrerJeu();

    // --- Graine du monde : VARIABLE à chaque chargement, mais rejouable ----------
    // Un F5 doit donner un étang neuf. La graine est donc tirée au chargement
    // (window.__PECHE_SEED, ?graine=N, sinon crypto/Math.random + Date.now).
    group('55g) Graine du monde : étang neuf à chaque chargement, rejouable');
    const graine = G().getGraine();
    check('la graine est un entier 32 bits', Number.isInteger(graine) && graine >= 0 && graine < 4294967296,
        String(graine));
    checkEqual('la graine peut être imposée (monde rejouable)', G().setGraine(123456), 123456);
    checkEqual('la graine imposée est relue', G().getGraine(), 123456);

    function peuplement() {
        return G().fishes.slice(0, 12).map(function (f) {
            return (f.userData.especeId || '?') + ':' + f.userData.homeX.toFixed(2) + ',' + f.userData.homeZ.toFixed(2);
        }).join('|');
    }
    G().setGraine(111);
    G().repeuplerEtang();
    const mondeA = peuplement();
    G().setGraine(222);
    G().repeuplerEtang();
    const mondeB = peuplement();
    check('deux graines différentes donnent deux peuplements différents', mondeA !== mondeB);
    G().setGraine(20240101);
    G().repeuplerEtang();
}

export default run;

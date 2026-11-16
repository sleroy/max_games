// ---------------------------------------------------------------------------
// milieux.js — BIOTOPES D'ÉTANG : six milieux au choix (accueil), UNE SEULE source de vérité.
//
// Un biotope change la FAUNE (parts de population), la FLORE et le DÉCOR (arbres, nénuphars,
// roseaux, rochers), les FONDS (vase, herbier, sable, gravier, roche), la TEINTE de l'eau et la
// TAILLE MAXIMALE des poissons. Il ne change JAMAIS la forme du plan d'eau : le contour, les
// fosses, les postes, la barque et la caméra restent ceux de l'étang généré par la graine.
// Un « petit étang de forêt » est petit écologiquement (peu de poissons, plus petits) et
// visuellement (décor dense), pas par un contour rétréci.
//
// ⚠ `surfaceHa` et `profondeur` sont des données ÉCOLOGIQUES : elles ne servent qu'à la formule
// de taille (`facteurTaille`) et à la densité de poissons (`capacite`). Ne jamais les utiliser
// comme profondeur d'eau ni comme géométrie.
//
// Fonctions PURES (aucun `rand()`, aucun accès au DOM) : testables sans navigateur. Le système
// `creerMilieux(deps)` en bas du fichier applique le choix au monde et le persiste dans le carnet.
// ---------------------------------------------------------------------------
import { SPECIES, COMPORTEMENTS } from './especes.js?v=238';
import { etat } from './etat.js?v=238';

export const MILIEU_DEFAUT = 'plaine';
export const DENSITE_PAR_HECTARE = 90;      // poissons / ha (base ; × densité du biotope × difficulté)
export const PLAFOND_POPULATION = 240;      // plafond technique (animation, bancs, téléphone)
export const SURFACE_REFERENCE_HA = 0.64;   // l'étang de plaine : facteur de taille 1
export const PROFONDEUR_REFERENCE = 8.2;    // idem (unités : 2 = 1 m)

// Ordre des colonnes de `parts` : celui de SPECIES (id de l'espèce → pourcentage, 0 = absente).
// Chaque ligne somme à 100.
function parts(liste) {
    const ids = ['gardon', 'rotengle', 'ablette', 'goujon', 'breme', 'tanche', 'carpe', 'carassin',
        'perche', 'chevesne', 'brochet', 'sandre', 'black-bass', 'truite', 'anguille', 'silure'];
    const resultat = {};
    ids.forEach(function (id, i) { resultat[id] = liste[i]; });
    return resultat;
}

export const MILIEUX = [
    {
        id: 'plaine', nom: 'Étang de plaine', icone: '🌾',
        resume: 'Eau calme, poissons blancs et un peu de tout.',
        parts: parts([16, 10, 12, 9, 8, 6, 8, 6, 9, 6, 4, 0, 3, 0, 3, 0]),
        decor: { arbres: 64, nenuphars: 40, roseaux: 70, rochers: 24 },
        fonds: { vase: 0.28, herbier: 0.20, sable: 0.20, gravier: 0.20, roche: 0.12 },
        eau: { shallow: 0x3d7d92, deep: 0x0a2736, sky: 0x9fc7d6 },
        surfaceHa: 0.64, profondeur: 8.2, densite: 1.0
    },
    {
        id: 'canal', nom: 'Canal', icone: '🚤',
        resume: 'Eau verte, berges de roseaux, gardons et ablettes.',
        // L'énoncé donnait 19 pour le gardon et une somme de 99 : le point manquant va au gardon (20).
        parts: parts([20, 12, 15, 8, 10, 5, 0, 8, 8, 6, 4, 2, 2, 0, 0, 0]),
        decor: { arbres: 20, nenuphars: 10, roseaux: 90, rochers: 10 },
        fonds: { vase: 0.55, herbier: 0.20, sable: 0.15, gravier: 0.08, roche: 0.02 },
        eau: { shallow: 0x4a7a5c, deep: 0x122a20, sky: 0x9fb6a6 },
        surfaceHa: 0.35, profondeur: 5.0, densite: 1.0
    },
    {
        id: 'carnassiers', nom: 'Étang à carnassiers', icone: '🦈',
        resume: 'Herbiers et nénuphars : brochets, sandres et black-bass.',
        parts: parts([23, 10, 14, 0, 0, 0, 0, 0, 14, 6, 12, 10, 10, 0, 0, 1]),
        decor: { arbres: 20, nenuphars: 60, roseaux: 90, rochers: 15 },
        fonds: { vase: 0.30, herbier: 0.35, sable: 0.15, gravier: 0.12, roche: 0.08 },
        eau: { shallow: 0x35584f, deep: 0x081a18, sky: 0x8fa8a0 },
        surfaceHa: 0.80, profondeur: 7.0, densite: 0.9
    },
    {
        id: 'montagne', nom: 'Lac de montagne', icone: '🏔️',
        resume: 'Eau claire et fraîche, rochers, truites et chevesnes.',
        parts: parts([6, 8, 0, 14, 0, 0, 0, 0, 10, 18, 0, 0, 0, 40, 4, 0]),
        decor: { arbres: 30, nenuphars: 0, roseaux: 10, rochers: 60 },
        fonds: { vase: 0.05, herbier: 0.05, sable: 0.15, gravier: 0.30, roche: 0.45 },
        eau: { shallow: 0x4f93b8, deep: 0x0d3448, sky: 0xb9d7e6 },
        surfaceHa: 1.60, profondeur: 9.0, densite: 0.7
    },
    {
        id: 'foret', nom: 'Petit étang de forêt', icone: '🌲',
        resume: 'Eau sombre sous les arbres : gardons, tanches et carassins.',
        parts: parts([28, 16, 0, 0, 0, 16, 0, 14, 12, 0, 8, 0, 0, 0, 6, 0]),
        decor: { arbres: 80, nenuphars: 30, roseaux: 40, rochers: 10 },
        fonds: { vase: 0.40, herbier: 0.25, sable: 0.15, gravier: 0.12, roche: 0.08 },
        eau: { shallow: 0x5a6b3f, deep: 0x1a1f0f, sky: 0xa8b48f },
        surfaceHa: 0.18, profondeur: 3.2, densite: 0.6
    },
    {
        id: 'riviere', nom: 'Grande rivière (silures)', icone: '🌊',
        resume: 'Eau large et profonde : carpes, sandres et gros silures.',
        // Silure à 1 % : à 240 poissons, cela fait 2 individus, pas 19 (un grand prédateur ne se
        // compte pas en dizaines dans un plan d'eau de cette taille).
        parts: parts([24, 0, 18, 0, 11, 0, 10, 0, 6, 8, 6, 10, 0, 0, 6, 1]),
        decor: { arbres: 25, nenuphars: 10, roseaux: 50, rochers: 20 },
        fonds: { vase: 0.30, herbier: 0.10, sable: 0.25, gravier: 0.20, roche: 0.15 },
        eau: { shallow: 0x3b5f63, deep: 0x061b1d, sky: 0x93a9ab },
        surfaceHa: 2.00, profondeur: 9.5, densite: 0.85
    }
];

export const IDS_MILIEUX = MILIEUX.map(function (m) { return m.id; });

/** Le biotope d'identifiant `id` ; un identifiant inconnu (ou absent) donne le biotope par défaut. */
export function milieuParId(id) {
    for (let i = 0; i < MILIEUX.length; i++) {
        if (MILIEUX[i].id === id) { return MILIEUX[i]; }
    }
    return MILIEUX[0];
}

function milieuDe(milieu) {
    return typeof milieu === 'string' || milieu === undefined || milieu === null ? milieuParId(milieu) : milieu;
}

/** Parts de population par espèce, entre 0 et 1, de somme 1 (0 = espèce absente du biotope). */
export function partsEspeces(milieu) {
    const m = milieuDe(milieu);
    let total = 0;
    SPECIES.forEach(function (e) { total += m.parts[e.id] || 0; });
    const resultat = {};
    SPECIES.forEach(function (e) { resultat[e.id] = total > 0 ? (m.parts[e.id] || 0) / total : 0; });
    return resultat;
}

/** Identifiants des espèces présentes (part > 0), dans l'ordre de SPECIES. */
export function especesPresentes(milieu) {
    const p = partsEspeces(milieu);
    return SPECIES.filter(function (e) { return p[e.id] > 0; }).map(function (e) { return e.id; });
}

/** Les biotopes (objets) où l'espèce vit, du plus abondant au plus rare. */
export function ouTrouver(especeId) {
    return MILIEUX.filter(function (m) { return (m.parts[especeId] || 0) > 0; })
        .sort(function (a, b) { return (b.parts[especeId] - a.parts[especeId]) || (MILIEUX.indexOf(a) - MILIEUX.indexOf(b)); });
}

/** Phrase pour la fiche d'espèce : « Où la trouver : Étang de plaine, Canal… ». */
export function texteOuTrouver(especeId) {
    const liste = ouTrouver(especeId);
    return liste.length ? liste.map(function (m) { return m.nom; }).join(', ') : 'nulle part';
}

function borner(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** Facteur de taille d'un étang : le plus petit de ses deux facteurs (surface, profondeur). */
export function facteurTaille(milieu) {
    const m = milieuDe(milieu);
    const fSurface = borner(Math.sqrt(m.surfaceHa / SURFACE_REFERENCE_HA), 0.5, 1.2);
    const fProfondeur = borner(Math.pow(m.profondeur / PROFONDEUR_REFERENCE, 0.4), 0.6, 1.1);
    return Math.min(fSurface, fProfondeur);
}

/** Même formule à partir de la surface (ha) et de la profondeur : sert aux tests de monotonie. */
export function facteurTailleDe(surfaceHa, profondeur) {
    return facteurTaille({ surfaceHa: surfaceHa, profondeur: profondeur });
}

/** Longueur maximale (cm) d'une espèce dans ce biotope : jamais sous cm[0], jamais au-dessus de cm[1]. */
export function tailleMaxEspece(espece, milieu) {
    const cm = espece.cm;
    const facteur = typeof milieu === 'number' ? milieu : facteurTaille(milieu);
    return Math.max(cm[0], Math.min(cm[1], cm[0] + (cm[1] - cm[0]) * facteur));
}

/** Population cible : surface écologique × 90 /ha × densité du biotope × facteur de difficulté (2 = Normal). */
export function capacite(milieu, facteurDensite, plafond) {
    const m = milieuDe(milieu);
    const facteur = facteurDensite === undefined ? 2 : facteurDensite;
    return Math.min(plafond === undefined ? PLAFOND_POPULATION : plafond,
        Math.round(m.surfaceHa * DENSITE_PAR_HECTARE * m.densite * facteur));
}

function minimumBanc(id) {
    const c = COMPORTEMENTS[id];
    return Math.max(1, c && c.banc ? c.banc[0] : 1);
}

/**
 * QUOTAS par espèce pour `N` poissons (allocation par plus forts restes) :
 *   q = N × part ; n = floor(q) ; part > 0 ⇒ n ≥ 1 ; part = 0 ⇒ n = 0 ;
 *   une espèce de banc a au moins `banc[0]` poissons ;
 *   la somme est ramenée à N par les plus forts restes, sans repasser sous ces minimums.
 * Si N est inférieur à la somme des minimums, N remonte à cette somme.
 * Renvoie { total, quotas: { id: n } }. Fonction pure : mêmes entrées, mêmes quotas.
 */
export function quotasEspeces(milieu, N) {
    const p = partsEspeces(milieu);
    const presents = SPECIES.filter(function (e) { return p[e.id] > 0; }).map(function (e) { return e.id; });
    let sommeMin = 0;
    presents.forEach(function (id) { sommeMin += minimumBanc(id); });
    const total = Math.max(Math.round(N), sommeMin);
    const quotas = {};
    SPECIES.forEach(function (e) { quotas[e.id] = 0; });
    let somme = 0;
    presents.forEach(function (id) {
        quotas[id] = Math.max(Math.floor(total * p[id]), minimumBanc(id));
        somme += quotas[id];
    });
    // Reste à répartir : les plus forts restes d'abord (ex æquo : ordre de SPECIES).
    while (somme < total) {
        let meilleur = null;
        presents.forEach(function (id) {
            if (meilleur === null || total * p[id] - quotas[id] > total * p[meilleur] - quotas[meilleur] + 1e-12) { meilleur = id; }
        });
        quotas[meilleur]++;
        somme++;
    }
    // Trop : on retire aux plus gros excédents, sans passer sous le minimum de l'espèce.
    while (somme > total) {
        let pire = null;
        presents.forEach(function (id) {
            if (quotas[id] <= minimumBanc(id)) { return; }
            if (pire === null || total * p[id] - quotas[id] < total * p[pire] - quotas[pire] - 1e-12) { pire = id; }
        });
        if (pire === null) { break; }
        quotas[pire]--;
        somme--;
    }
    return { total: somme, quotas: quotas };
}

/** Quantités du décor : { arbres, nenuphars, roseaux, rochers, herbe } (herbe = facteur 0–1 de touffes). */
export function densitesDecor(milieu) {
    const d = milieuDe(milieu).decor;
    const ref = MILIEUX[0].decor;
    return { arbres: d.arbres, nenuphars: d.nenuphars, roseaux: d.roseaux, rochers: d.rochers,
        herbe: borner(d.roseaux / ref.roseaux * 0.5 + d.arbres / ref.arbres * 0.5, 0.25, 1) };
}

// Style du décor : bande où poussent les arbres [distance à la rive, largeur], échelle des arbres et des
// rochers [minimum, amplitude]. La plaine garde les valeurs d'origine (le monde ne bouge pas).
// Forêt : couronne dense et haute tout près de l'eau. Montagne : grands sapins épars et gros blocs.
const STYLES_DECOR = {
    defaut: { bandeArbres: [8, 45], echelleArbres: [0.8, 0.7], echelleRochers: [0.6, 1.3] },
    foret: { bandeArbres: [6, 30], echelleArbres: [0.9, 0.9], echelleRochers: [0.6, 1.0] },
    montagne: { bandeArbres: [10, 55], echelleArbres: [1.0, 0.8], echelleRochers: [0.9, 1.7] }
};

/** Style du décor d'un biotope : { bandeArbres, echelleArbres, echelleRochers }. */
export function styleDecor(milieu) {
    return STYLES_DECOR[milieuDe(milieu).id] || STYLES_DECOR.defaut;
}

/** Parts des fonds (0–1, somme 1) : { vase, herbier, sable, gravier, roche }. */
export function partsSubstrats(milieu) {
    const f = milieuDe(milieu).fonds;
    const total = f.vase + f.herbier + f.sable + f.gravier + f.roche;
    return { vase: f.vase / total, herbier: f.herbier / total, sable: f.sable / total,
        gravier: f.gravier / total, roche: f.roche / total };
}

/** Teintes de l'eau (nombres 0xRRGGBB) : { shallow, deep, sky }. */
export function eauDe(milieu) {
    const e = milieuDe(milieu).eau;
    return { shallow: e.shallow, deep: e.deep, sky: e.sky };
}

/** Texte « Milieu : … » du carnet. */
export function texteMilieu(milieu) {
    const m = milieuDe(milieu);
    return 'Milieu : ' + m.icone + ' ' + m.nom;
}

// ---------------------------------------------------------------------------
// SYSTÈME : applique le biotope choisi au monde et le mémorise dans le carnet.
//
// Un choix (accueil) ou un changement, même en cours de partie, RECONSTRUIT ce qui dépend du
// biotope (eau, décor, fonds, herbe) puis REPEUPLE l'étang avec la composition du biotope.
// Le contour de l'étang et ses fosses ne bougent pas.
// ---------------------------------------------------------------------------
export function creerMilieux(deps) {
    const radios = deps.radios || {};
    let courant = MILIEU_DEFAUT;          // le monde est construit en « plaine »

    // Teintes de l'eau : seuls uShallow, uDeep et uSky changent. uClear (cheat « aquarium ») et le
    // cycle jour/nuit du ciel ne sont pas touchés.
    function appliquerEau(eau) {
        const u = deps.uniformsEau;
        if (!u) { return; }
        u.uShallow.value.setHex(eau.shallow);
        u.uDeep.value.setHex(eau.deep);
        u.uSky.value.setHex(eau.sky);
    }

    function cocherRadios(id) {
        Object.keys(radios).forEach(function (cle) { if (radios[cle]) { radios[cle].checked = (cle === id); } });
    }

    // Reconstruit le monde pour ce biotope. Sans effet s'il est déjà celui du monde.
    function appliquer(id) {
        const m = milieuParId(id);
        cocherRadios(m.id);
        if (m.id === courant) { return false; }
        courant = m.id;
        appliquerEau(eauDe(m));
        // Ordre : le décor d'abord (les fonds en dépendent : herbier autour des nénuphars et roseaux), puis les fonds
        // et leur texture. Les obstacles déjà posés ne bougent pas : le décor les évite.
        if (deps.decor) { deps.decor.appliquerMilieu(m, deps.obstacles ? deps.obstacles.liste : null); }
        if (deps.substrats) {
            deps.substrats.appliquerMilieu(m);
            if (deps.fond) { deps.substrats.habillerFond(deps.fond); }
        }
        deps.repeuplerEtang(m);
        return true;
    }

    // Choix du joueur : mémorisé dans le carnet (`journal.milieu`) puis appliqué.
    function choisir(id) {
        const m = milieuParId(id);
        etat.journal.milieu = m.id;
        if (deps.saveJournal) { deps.saveJournal(); }
        const change = appliquer(m.id);
        if (deps.renderJournal) { deps.renderJournal(); }
        return change;
    }

    appliquer(etat.journal.milieu);   // le carnet est déjà chargé : on applique le biotope mémorisé
    return { appliquer: appliquer, choisir: choisir, courant: function () { return milieuParId(courant); } };
}

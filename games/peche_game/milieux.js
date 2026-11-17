// ---------------------------------------------------------------------------
// milieux.js — BIOTOPES D'ÉTANG : six milieux au choix (accueil), UNE SEULE source de vérité.
//
// Un biotope change la FAUNE (parts de population), la FLORE et le DÉCOR (arbres, nénuphars,
// roseaux, rochers), les FONDS (vase, herbier, sable, gravier, roche), la TEINTE de l'eau, la
// TAILLE MAXIMALE des poissons et, depuis les tailles d'étang, la TAILLE du plan d'eau : `rayon`
// (12 à 280 unités, 2 unités ≈ 1 m) et sa FORME : `forme` choisit un profil de contour de dimensions.js
// (`etang` pour la plaine, les carnassiers et la forêt ; `canal` ; `lac` en montagne ; `riviere`). Le relief
// reste normalisé (même profondeur). L'échelle est f = rayon / 90 ; la plaine (f = 1, étang) est le monde de
// référence, inchangé. À rayon égal, tous les profils ont la même surface.
//
// La SURFACE n'est plus une donnée écologique en dur : elle se déduit de la géométrie réelle
// (`surfaceHaDe(milieu)` = surface d'un contour de ce rayon, dimensions.js). `capacite`, `facteurTaille`
// et la biomasse lisent cette seule surface. `profondeur` reste une donnée ÉCOLOGIQUE (facteur de taille) :
// ne jamais l'utiliser comme profondeur d'eau.
//
// Fonctions PURES (aucun `rand()`, aucun accès au DOM) : testables sans navigateur. Le système
// `creerMilieux(deps)` en bas du fichier applique le choix au monde et le persiste dans le carnet.
// ---------------------------------------------------------------------------
import { SPECIES, COMPORTEMENTS } from './especes.js?v=242';
import { etat } from './etat.js?v=242';
import { RAYON_REFERENCE, FORME_DEFAUT, surfaceHectares, echelleDeRayon } from './dimensions.js?v=242';

export const MILIEU_DEFAUT = 'plaine';
export const DENSITE_PAR_HECTARE = 90;      // poissons / ha (base ; × densité du biotope × difficulté)
export const PLAFOND_POPULATION = 240;      // plafond technique (animation, bancs, téléphone)
export const SURFACE_REFERENCE_HA = surfaceHectares(RAYON_REFERENCE);   // l'étang de plaine (≈ 0,64 ha) : facteur de taille 1
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
        rayon: 90, forme: 'etang', profondeur: 8.2, densite: 1.0
    },
    {
        id: 'canal', nom: 'Canal', icone: '🚤',
        resume: 'Eau verte, berges de roseaux, gardons et ablettes.',
        // L'énoncé donnait 19 pour le gardon et une somme de 99 : le point manquant va au gardon (20).
        parts: parts([20, 12, 15, 8, 10, 5, 0, 8, 8, 6, 4, 2, 2, 0, 0, 0]),
        decor: { arbres: 20, nenuphars: 10, roseaux: 90, rochers: 10 },
        fonds: { vase: 0.55, herbier: 0.20, sable: 0.15, gravier: 0.08, roche: 0.02 },
        eau: { shallow: 0x4a7a5c, deep: 0x122a20, sky: 0x9fb6a6 },
        rayon: 45, forme: 'canal', profondeur: 5.0, densite: 1.0
    },
    {
        id: 'carnassiers', nom: 'Étang à carnassiers', icone: '🦈',
        resume: 'Herbiers et nénuphars : brochets, sandres et black-bass.',
        parts: parts([23, 10, 14, 0, 0, 0, 0, 0, 14, 6, 12, 10, 10, 0, 0, 1]),
        decor: { arbres: 20, nenuphars: 60, roseaux: 90, rochers: 15 },
        fonds: { vase: 0.30, herbier: 0.35, sable: 0.15, gravier: 0.12, roche: 0.08 },
        eau: { shallow: 0x35584f, deep: 0x081a18, sky: 0x8fa8a0 },
        rayon: 70, forme: 'etang', profondeur: 7.0, densite: 0.9
    },
    {
        id: 'montagne', nom: 'Lac de montagne', icone: '🏔️',
        resume: 'Eau claire et fraîche, rochers, truites et chevesnes.',
        parts: parts([6, 8, 0, 14, 0, 0, 0, 0, 10, 18, 0, 0, 0, 40, 4, 0]),
        decor: { arbres: 30, nenuphars: 0, roseaux: 10, rochers: 60 },
        fonds: { vase: 0.05, herbier: 0.05, sable: 0.15, gravier: 0.30, roche: 0.45 },
        eau: { shallow: 0x4f93b8, deep: 0x0d3448, sky: 0xb9d7e6 },
        rayon: 180, forme: 'lac', profondeur: 9.0, densite: 0.7
    },
    {
        id: 'foret', nom: 'Petit étang de forêt', icone: '🌲',
        resume: 'Eau sombre sous les arbres : gardons, tanches et carassins.',
        parts: parts([28, 16, 0, 0, 0, 16, 0, 14, 12, 0, 8, 0, 0, 0, 6, 0]),
        decor: { arbres: 80, nenuphars: 30, roseaux: 40, rochers: 10 },
        fonds: { vase: 0.40, herbier: 0.25, sable: 0.15, gravier: 0.12, roche: 0.08 },
        eau: { shallow: 0x5a6b3f, deep: 0x1a1f0f, sky: 0xa8b48f },
        rayon: 12, forme: 'etang', profondeur: 3.2, densite: 0.6
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
        rayon: 280, forme: 'riviere', profondeur: 9.5, densite: 0.85
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

/** Rayon nominal (unités) du plan d'eau d'un biotope : une DONNÉE du biotope (dimensions.js en tire la surface). */
export function rayonDe(milieu) {
    return milieuDe(milieu).rayon;
}

/** Profil de forme du plan d'eau du biotope (`etang`, `lac`, `canal` ou `riviere` : dimensions.js `FORMES`). */
export function formeDe(milieu) {
    return milieuDe(milieu).forme || FORME_DEFAUT;
}

/** Facteur d'échelle du biotope par rapport à la plaine : rayon / 90 (1 pour la plaine). */
export function echelleMilieu(milieu) {
    return echelleDeRayon(rayonDe(milieu));
}

/**
 * Surface (hectares) du plan d'eau du biotope, DÉDUITE de sa géométrie réelle (rayon → contour → aire).
 * C'est la seule surface du jeu : la capacité, le facteur de taille et la biomasse la lisent. Un objet
 * qui porte directement `surfaceHa` (tests de monotonie : `facteurTailleDe`) la fournit lui-même.
 */
export function surfaceHaDe(milieu) {
    const m = milieuDe(milieu);
    return typeof m.surfaceHa === 'number' ? m.surfaceHa : surfaceHectares(m.rayon, m.forme);
}

/** Facteur de taille d'un étang : le plus petit de ses deux facteurs (surface réelle, profondeur). */
export function facteurTaille(milieu) {
    const m = milieuDe(milieu);
    const fSurface = borner(Math.sqrt(surfaceHaDe(m) / SURFACE_REFERENCE_HA), 0.5, 1.2);
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
        Math.round(surfaceHaDe(m) * DENSITE_PAR_HECTARE * m.densite * facteur));
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

/**
 * Quantités du décor : { arbres, nenuphars, roseaux, rochers, herbe } (herbe = facteur 0–1 de touffes).
 * Les comptes de la table `decor` sont ceux de l'étang de PLAINE ; ils suivent l'échelle f = rayon / 90 :
 * arbres, roseaux et rochers ≈ × f (le périmètre), nénuphars ≈ × f² borné à [0,3 ; 3] (la surface). Pour la
 * plaine (f = 1), les comptes d'origine. `herbe` compare les densités de la table (par mètre de rive).
 */
export function densitesDecor(milieu) {
    const m = milieuDe(milieu);
    const d = m.decor;
    const ref = MILIEUX[0].decor;
    const f = echelleDeRayon(m.rayon);
    const surface = borner(f * f, 0.3, 3);
    const suivre = function (n, facteur) { return n > 0 ? Math.max(1, Math.round(n * facteur)) : 0; };
    return { arbres: suivre(d.arbres, f), nenuphars: suivre(d.nenuphars, surface), roseaux: suivre(d.roseaux, f),
        rochers: suivre(d.rochers, f),
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
// Un arbre ne pousse pas à moins de 4 unités de l'eau (decor.js) : la bande ne descend jamais sous 5,
// ni sa largeur sous 15, même dans un très petit étang.
const BANDE_ARBRES_MIN = [5, 15];

/**
 * Style du décor d'un biotope : { bandeArbres, echelleArbres, echelleRochers }. La bande des arbres suit
 * l'échelle (× f), sans jamais descendre sous [5, 15] ; les échelles des arbres et des rochers sont celles de
 * la table (les arbres et les rochers ne grandissent pas avec l'étang).
 */
export function styleDecor(milieu) {
    const m = milieuDe(milieu);
    const base = STYLES_DECOR[m.id] || STYLES_DECOR.defaut;
    const f = echelleDeRayon(m.rayon);
    return {
        bandeArbres: [Math.max(BANDE_ARBRES_MIN[0], base.bandeArbres[0] * f), Math.max(BANDE_ARBRES_MIN[1], base.bandeArbres[1] * f)],
        echelleArbres: base.echelleArbres, echelleRochers: base.echelleRochers
    };
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
// Un choix (accueil) ou un changement RECONSTRUIT d'abord la GÉOMÉTRIE quand le rayon ou la forme change
// (`deps.setRayonMonde` : contour, centre, fosses, surface ; puis `deps.surGeometrie` : eau, rive,
// fond, brume, ciel, caméra), AVANT le décor, les fonds et l'eau. Ordre ensuite : teinte de l'eau,
// décor (les fonds en dépendent), obstacles (qui évitent le décor, comme dans le monde d'origine),
// fonds et leur texture, `deps.apresGeometrie` (partie redémarrée et poste de départ : ce n'est PAS un
// changement « à chaud »), puis le repeuplement de l'étang avec la composition du biotope.
//
// Le monde est construit en « plaine » ; le biotope mémorisé dans le carnet est appliqué par `demarrer()`,
// appelé par script.js quand TOUT le reste existe (carte de placement, barque, partie).
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
        // 1) La TAILLE d'abord : tout le reste (décor, fonds, poissons) se pose dans le nouveau contour.
        const changeTaille = !!deps.setRayonMonde && !!deps.monde
            && (deps.monde.rayon !== m.rayon || (deps.monde.forme || FORME_DEFAUT) !== formeDe(m));
        if (changeTaille) {
            deps.setRayonMonde(m.rayon, formeDe(m));
            if (deps.surGeometrie) { deps.surGeometrie(m); }
        }
        appliquerEau(eauDe(m));
        // 2) Décor d'abord (les fonds en dépendent : herbier autour des nénuphars et roseaux), puis les obstacles
        //    qui l'évitent (taille changée : ils sont reposés), puis les fonds et leur texture. À taille égale,
        //    les obstacles en place ne bougent pas : le décor les évite.
        if (deps.decor) { deps.decor.appliquerMilieu(m, !changeTaille && deps.obstacles ? deps.obstacles.liste : null); }
        if (changeTaille && deps.obstacles) { deps.obstacles.reconstruire(); }
        if (deps.substrats) {
            deps.substrats.appliquerMilieu(m);
            if (deps.fond) { deps.substrats.habillerFond(deps.fond); }
        }
        if (changeTaille && deps.apresGeometrie) { deps.apresGeometrie(m); }
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

    // Applique le biotope du carnet (déjà chargé) : à appeler une fois le monde entièrement construit.
    function demarrer() { return appliquer(etat.journal.milieu); }

    return { appliquer: appliquer, choisir: choisir, demarrer: demarrer, courant: function () { return milieuParId(courant); } };
}

// ---------------------------------------------------------------------------
// poissons.js — LA POPULATION DE POISSONS : fabrique 3D, peuplement par bancs,
// spécimens hors norme, respawn et « punition » après une touche ratée.
//
// Extrait de script.js (découpage v143). Le module ne connaît PAS la pêche :
// il ignore le bouchon, la touche, le combat et le pêcheur. Il reçoit la scène
// et les fonctions du monde dont il a besoin, et rend la population.
//
// Contrat (voir docs/modules.md) : injection de dépendances, aucun accès aux
// globales de script.js, aucun accès à `window`.
//
// ⚠ Le corps ci-dessous est le code d'origine COPIÉ TEL QUEL (aucune
// réécriture) : mêmes tirages `rand()`, mêmes constantes, mêmes poids. L'ordre
// des tirages est conservé car `peuplerEtang()` s'exécute à la création.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import {
    SPECIES, COMPORTEMENTS, STYLES_COMBAT, STYLE_DEFAUT, poidsKilos
} from './especes.js?v=255';
import { creerModelePoisson, echellePourTaille } from './modelePoisson.js?v=255';
import { angleParSurface } from './dimensions.js?v=255';
import {
    MILIEU_DEFAUT, PLAFOND_POPULATION, milieuParId, partsEspeces, quotasEspeces,
    capacite, facteurTaille, tailleMaxEspece
} from './milieux.js?v=255';

export function creerPoissons(deps) {
    const scene = deps.scene;
    const rand = deps.rand;
    const rayonEtang = deps.rayonEtang;
    const POND_CENTER = deps.POND_CENTER;
    // Le poisson ne nage pas dans le fond : il lui faut le relief de l'étang.
    const fondY = deps.fondY;
    // Fosses (refuge des poissons de fond) et surface (en hectares) de l'étang.
    const FOSSES = deps.FOSSES;
    // Le monde ACTUEL (environnement.js `monde`) : surface réelle, échelle f = rayon / 90. Des accesseurs, lus à chaque
    // usage (le biotope peut changer la taille de l'étang) : jamais copiés.
    const monde = deps.monde;
    // Biotope courant (milieux.js) : parts de population, taille maximale, surface écologique.
    // Le monde est construit en « plaine » ; setMilieu / repeuplerEtang(milieu) le changent.
    let milieuCourant = milieuParId(deps.milieu || MILIEU_DEFAUT);
    let facteurTailleCourant = facteurTaille(milieuCourant);
    // Obstacles aquatiques (obstacles.js) : ils attirent certaines espèces (zone de vie déplacée).
    const obstacles = deps.obstacles;
    // Types de fond (substrats.js) : l'habitat des poissons qu'aucun obstacle n'a attirés.
    const substrats = deps.substrats;
    // Un seul « chez-soi » par poisson : obstacles d'abord, puis le substrat pour les autres.
    function installerHabitat(poissons) {
        if (obstacles) { obstacles.attirer(poissons); }
        if (substrats) {
            substrats.attirer(poissons);
            // L'étang agrandi + les zones de vie fixes vidaient les berges : on
            // garantit quelques poissons à portée de lancer de chaque poste.
            substrats.garantirPecheDuBord(poissons);
        }
        poissons.forEach(rentrerDansLEau);
    }
    // Un banc posé près de la rive (canal étroit, petit étang) peut écarter un poisson hors de l'eau :
    // on ramène sa position ET sa zone de vie sur le même rayon, à 1 unité de la berge.
    function ramenerPoint(x, z) {
        const dx = x - POND_CENTER.x;
        const dz = z - POND_CENTER.z;
        const r = Math.hypot(dx, dz);
        const bord = Math.max(0, rayonEtang(Math.atan2(dz, dx)) - 1);
        if (r < bord || r === 0) { return null; }
        return { x: POND_CENTER.x + dx * bord / r, z: POND_CENTER.z + dz * bord / r };
    }
    function rentrerDansLEau(fish) {
        const d = fish.userData;
        if (Number.isFinite(d.homeX) && Number.isFinite(d.homeZ)) {
            const maison = ramenerPoint(d.homeX, d.homeZ);
            if (maison) { d.homeX = maison.x; d.homeZ = maison.z; }
        }
        const p = ramenerPoint(fish.position.x, fish.position.z);
        if (!p) { return; }
        fish.position.x = p.x;
        fish.position.z = p.z;
        const fond = fondY(fish.position.x, fish.position.z);
        d.depth = d.couche === 'fond' ? fond + 0.45 : Math.max(d.depth, fond + 0.35);
        fish.position.y = d.depth - d.topOffset;
    }
    let peuplement = true;   // vrai pendant le peuplement initial (les bancs sont attirés d'un bloc, après)


    // ---------------------------------------------------------------------------
    // Poissons
    // ---------------------------------------------------------------------------
    const fishes = [];

    // ---------------------------------------------------------------------------
    // POPULATION (v173) : calculée d'après la SURFACE et la BIOMASSE, plus un compte fixe.
    //  - Un étang extensif porte 100 à 300 kg de poisson par hectare (on vise ≈ 180).
    //  - Densité d'individus : 90 poissons/ha (20 sur 0,23 ha avant : 87/ha). La densité
    //    par surface reste donc la même, seul le nombre total augmente : on pêche à
    //    peu près au même rythme, dans un étang plus grand.
    //  - FISH_COUNT n'est plus que le PLAFOND de confort technique (animation, bancs,
    //    ordinateur modeste ou téléphone).
    //  - Les solitaires (silure, brochet, sandre, black-bass, truite, anguille) restent
    //    rares : leur PART du biotope est faible (1 % pour le silure), donc leur nombre
    //    suit la surface et la densité, pas un compte fixe.
    // ---------------------------------------------------------------------------
    const FISH_COUNT = PLAFOND_POPULATION;       // plafond technique (v197 : 64 -> 240 -> 1000, densite par difficulte)
    const BIOMASSE_MIN_KG_HA = 100;              // bornes réalistes (kg / ha)
    const BIOMASSE_MAX_KG_HA = 300;
    const ESPECES_MIN = 10;                      // diversité minimale de l'étang de plaine
    const SOLITAIRES = ['silure', 'brochet', 'sandre', 'black-bass', 'truite', 'anguille'];
    const MAX_PAR_SOLITAIRE = { silure: 1, defaut: 2 };
    // Les poissons de fosse vivent dans les trous profonds : on les atteint en barque.
    const ESPECES_DE_FOSSE = ['silure', 'anguille', 'sandre'];
    // Densité par difficulté (idées.md §17.6) : ×1,5 / ×2 / ×3 sur la base 90/ha.
    const FACTEUR_DENSITE = (typeof etat !== 'undefined' && etat.facteurDensite) || 2;
    // Population cible : surface écologique du biotope × 90 /ha × densité du biotope × difficulté.
    // Elle remonte à la somme des minimums de banc si le biotope est trop petit pour eux.
    function populationPourMilieu(milieu) {
        return quotasEspeces(milieu, capacite(milieu, FACTEUR_DENSITE, FISH_COUNT)).total;
    }
    let POPULATION_CIBLE = populationPourMilieu(milieuCourant);
    // Surface utilisée pour les kg/ha : la surface RÉELLE du plan d'eau (géométrie du biotope, une seule vérité).
    function surfaceBiomasse() {
        return monde.surfaceHa;
    }

    // ---------------------------------------------------------------------------
    // Espèces d'eau douce : silhouette, longueur réelle (cm), poids, combativité,
    // couleurs et motif d'écailles.
    //   poids (kg) ≈ K × longueur(cm)³ / 100 000   ← formule réelle des pêcheurs
    //   (K = « facteur de condition » : 2,3 pour une carpe bien nourrie, 0,2 pour
    //    une anguille très allongée…)
    // `abondance` = fréquence relative dans l'étang.
    // ---------------------------------------------------------------------------

    // ---------------------------------------------------------------------------
    // ATTAQUE DE CARNASSIER pendant la remontée (idee « petits poissons »).
    // Quand on ramène une PETITE PROIE (une de ces espèces), un carnassier qui
    // passe près de la ligne peut l'attaquer, la remplacer sur l'hameçon et
    // repartir avec un avantage (combat plus long, chrono plus court).
    // ---------------------------------------------------------------------------
    const PROIES_CARNASSIERS = ['gardon', 'rotengle', 'ablette', 'goujon', 'carassin'];
    const CARNASSIERS = ['brochet', 'sandre', 'perche', 'black-bass'];
    const PREDATOR_ATTACK_RADIUS = 9;        // unités autour du bouchon
    const PREDATOR_ATTACK_ADVANTAGE = 1.35;  // > 1 : avantage au carnassier

    // ---------------------------------------------------------------------------
    // STYLES DE COMBAT — chaque espèce a SA façon de se battre… et SES touches.
    // Une carpe ne se joue pas comme un brochet : l'une pèse de tout son poids au
    // fond, l'autre part en trombe de côté. Un gardon tapote l'esche, une tanche la
    // soulève, un chevesne l'emporte d'un coup sec.
    //
    //   touchesVraies / touchesFausses : dessins du bouchon propres à l'espèce
    //   traction   : multiplicateur de la force de traction (le poisson « pèse »)
    //   coups      : multiplicateur des tirades brusques
    //   intervalle : multiplicateur du temps entre deux tirades (> 1 = plus calme)
    //   endurance  : durée (s) avant que le poisson ne soit épuisé (fatigue)
    //   derive     : écart latéral pendant les tirades (0 = il tire droit)
    // ---------------------------------------------------------------------------


    // Style de combat d'une espèce (d'après son identifiant).
    function styleEspece(especeId) {
        for (let i = 0; i < SPECIES.length; i++) {
            if (SPECIES[i].id === especeId) {
                return STYLES_COMBAT[SPECIES[i].style] || STYLE_DEFAUT;
            }
        }
        return STYLE_DEFAUT;
    }

    // Fabrique 3D d'un poisson : extraite dans modelePoisson.js (v195) pour être
    // partagée avec la page de vérification des tailles (`tailles.html`).
    function makeFish(size, power, aggression, form, espece) {
        return creerModelePoisson(size, power, aggression, form, espece);
    }

    // ---------------------------------------------------------------------------
    // PETITS POISSONS DE BORD : ils longent la rive, là où le pêcheur les atteint.
    // C'est la règle qui rend un grand plan d'eau pêchable : répartis uniformément,
    // 950 poissons sur 6,2 ha laissent l'hameçon presque toujours seul. Un gardon,
    // une ablette ou un goujon vivent dans les quelques mètres qui bordent la berge.
    // L'espèce est marquée `bord: true` dans COMPORTEMENTS (especes.js).
    // ---------------------------------------------------------------------------
    const BANDE_BORD = 15;          // unités (7,5 m) : largeur de la bande de rive

    function estEspeceDeBord(especeId) {
        const comp = COMPORTEMENTS[especeId];
        return !!(comp && comp.bord);
    }

    function randomFishPosition(auBord) {
        // Étang : angle uniforme (monde d'origine). Canal, lac, rivière : angle réparti selon l'aire, sinon tout
        // s'entasserait au milieu d'un plan d'eau allongé (angleParSurface rend `u × 2π` pour l'étang).
        const angle = angleParSurface(rand(), monde.forme);
        // Le poisson naît DANS l'eau, à distance du bord local (contour irrégulier).
        // Racine carrée : répartition uniforme sur la SURFACE (un tirage linéaire du
        // rayon entassait les poissons au centre, ce qui se voit dans un grand étang).
        // La marge au bord (12) suit l'échelle sans dépasser 1 : un petit étang garde des poissons sur toute sa surface.
        const rayonLocal = Math.max(1, rayonEtang(angle) - 12 * Math.min(1, monde.echelle));
        // Poisson de bord : u² tasse les positions contre la rive (la moitié dans le
        // tiers extérieur de la bande). La bande est bornée à 45 % du rayon local pour
        // qu'un petit étang garde des poissons sur toute sa surface.
        const bande = Math.min(rayonLocal * 0.45, BANDE_BORD);
        const u = rand();
        const r = auBord ? rayonLocal - bande * u * u : Math.sqrt(u) * rayonLocal;
        return new THREE.Vector3(
            POND_CENTER.x + Math.cos(angle) * r,
            -2.0,
            POND_CENTER.z + Math.sin(angle) * r
        );
    }

    // Position dans une FOSSE (générateur local : ne décale pas le hasard du monde).
    function positionDansFosse() {
        const fosse = FOSSES[Math.floor(comportementRand() * FOSSES.length) % FOSSES.length];
        const a = comportementRand() * Math.PI * 2;
        const r = Math.sqrt(comportementRand()) * fosse.rayon * 0.6;
        return new THREE.Vector3(fosse.x + Math.cos(a) * r, -2.0, fosse.z + Math.sin(a) * r);
    }

    function positionPourEspece(especeId) {
        // randomFishPosition() est TOUJOURS appelée (mêmes tirages rand() qu'avant) ;
        // les poissons de fosse remplacent ensuite sa position.
        const position = randomFishPosition(estEspeceDeBord(especeId));
        return ESPECES_DE_FOSSE.indexOf(especeId) >= 0 ? positionDansFosse() : position;
    }

    function randomFishVelocity() {
        const dir = rand() * Math.PI * 2;
        const speed = 2 + rand() * 2.5;
        return { vx: Math.cos(dir) * speed, vz: Math.sin(dir) * speed };
    }

    // Poids réaliste : formule du « facteur de condition » des pêcheurs.
    // (Partagée avec la page des tailles : une seule formule dans especes.js.)
    function poidsRealisteKilos(espece, longueurCm) {
        return poidsKilos(espece, longueurCm);
    }

    // Tirage d'espèce pondéré par sa PART de population dans le biotope courant (milieux.js).
    // Une espèce absente du biotope (part 0) n'est jamais tirée. `abondance` (especes.js) n'est
    // plus qu'une indication de repli : la seule vérité est la table des biotopes.
    function pickSpecies() {
        const parts = partsEspeces(milieuCourant);
        let r = rand();
        let derniere = SPECIES[0];
        for (let i = 0; i < SPECIES.length; i++) {
            if (parts[SPECIES[i].id] <= 0) { continue; }
            derniere = SPECIES[i];
            r -= parts[SPECIES[i].id];
            if (r <= 0) {
                return SPECIES[i];
            }
        }
        return derniere;
    }

    // ---------------------------------------------------------------------------
    // SPÉCIMENS HORS NORME : quelques poissons (≈7 %) dépassent les normes de leur
    // espèce (taille, poids, combativité, agressivité). On utilise un petit
    // générateur LOCAL pour ne PAS décaler le hasard du monde (tests reproductibles).
    // ---------------------------------------------------------------------------
    let horsNormeChance = 0.07;
    let rareRngState = 0x51f15e1d >>> 0;

    function rareRand() {
        rareRngState = (rareRngState + 0x6d2b79f5) >>> 0;
        let t = rareRngState;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function setHorsNormeChance(value) {
        horsNormeChance = Math.max(0, Math.min(1, Number(value) || 0));
        // Le harnais peut fixer un drapeau avant le chargement (monde sans rare).
        if (typeof window !== 'undefined') { window.__PECHE_RARE__ = horsNormeChance; }
    }

    // Distribution ATTENDUE : le QUOTA de chaque espèce dans le biotope courant (milieux.js,
    // allocation par plus forts restes), avec sa part du total. Sert au carnet et aux tests.
    function distributionAttendue() {
        const alloc = quotasEspeces(milieuCourant, POPULATION_CIBLE);
        return SPECIES.map(function (espece) {
            return {
                id: espece.id,
                nom: espece.nom,
                quota: alloc.quotas[espece.id],
                part: alloc.total > 0 ? alloc.quotas[espece.id] / alloc.total : 0
            };
        });
    }

    // Un poisson pêché est remplacé par l'espèce la plus en manque par rapport à son QUOTA :
    // la composition du biotope reste stable (pas de silures en trop, jamais d'espèce absente).
    // Quand rien ne manque, tirage pondéré par les parts du biotope.
    function pickEspeceAutorisee() {
        const quotas = quotasEspeces(milieuCourant, POPULATION_CIBLE).quotas;
        const presents = {};
        fishes.forEach(function (f) { presents[f.userData.especeId] = (presents[f.userData.especeId] || 0) + 1; });
        let choisie = null;
        let manque = 0;
        SPECIES.forEach(function (e) {
            const m = quotas[e.id] - (presents[e.id] || 0);
            if (m > manque) { manque = m; choisie = e; }
        });
        return choisie || pickSpecies();
    }

    function spawnFish(especeImposee, groupe) {
        const espece = especeImposee || pickEspeceAutorisee();
        // Longueur réelle tirée dans la fourchette de l'espèce, bornée par la TAILLE MAXIMALE du
        // biotope (un petit étang de forêt ne porte pas de carpe de 1 m) : cm[0] → cmMax.
        const cmMax = tailleMaxEspece(espece, facteurTailleCourant);
        let longueurCm = espece.cm[0] + rand() * (cmMax - espece.cm[0]);
        // Spécimen hors norme : il dépasse la norme de l'espèce mais reste borné à cmMax.
        const rareChance = (typeof window !== 'undefined'
            && typeof window.__PECHE_RARE__ === 'number')
            ? window.__PECHE_RARE__ : horsNormeChance;
        const horsNorme = rareRand() < rareChance;
        const facteurRare = horsNorme ? (1.08 + rareRand() * 0.28) : 1;
        if (horsNorme) {
            longueurCm = Math.min(cmMax, longueurCm * facteurRare);
        }
        // Échelle 3D donnant au poisson sa vraie taille (2 unités ≈ 1 m).
        const size = echellePourTaille(longueurCm, espece.form);
        let power = espece.combativite[0] + rand() * (espece.combativite[1] - espece.combativite[0]);
        let aggression = espece.agressivite[0] + rand() * (espece.agressivite[1] - espece.agressivite[0]);
        if (horsNorme) {
            power = Math.min(2.7, power * facteurRare);
            aggression = Math.min(2.7, aggression * facteurRare);
        }
        const fish = makeFish(size, power, aggression, espece.form, espece);
        fish.position.copy(positionPourEspece(espece.id));
        const v = randomFishVelocity();
        fish.userData.vx = v.vx;
        fish.userData.vz = v.vz;
        fish.userData.phase = rand() * Math.PI * 2;
        const comp = COMPORTEMENTS[espece.id] || null;
        fish.userData.comp = comp;
        fish.userData.couche = comp ? comp.couche : 'mi-eau';
        if (groupe) {
            // Un banc naît groupé : même coin d'étang, même cap, vitesses voisines.
            const a = comportementRand() * Math.PI * 2;
            const r = comportementRand() * 2.2;
            fish.position.x = groupe.centre.x + Math.cos(a) * r;
            fish.position.z = groupe.centre.z + Math.sin(a) * r;
            const cap = groupe.cap + (comportementRand() - 0.5) * 0.5;
            const vit = comp ? comp.croisiere : 1.5;
            fish.userData.vx = Math.cos(cap) * vit;
            fish.userData.vz = Math.sin(cap) * vit;
            fish.userData.groupeId = groupe.id;
        } else if (comp) {
            const cap = Math.atan2(v.vz, v.vx);
            fish.userData.vx = Math.cos(cap) * comp.croisiere;
            fish.userData.vz = Math.sin(cap) * comp.croisiere;
        }
        // Profondeur du DOS du poisson : chaque espèce a SA zone (un sandre reste au
        // fond, une ablette près de la surface). Déduite de la phase (déjà aléatoire)
        // pour ne pas décaler le monde reproductible des tests.
        const plage = espece.profondeur || [-3.4, -0.9];
        const tProf = (Math.sin(fish.userData.phase) + 1) / 2;      // 0 → 1
        fish.userData.depth = plage[0] + tProf * (plage[1] - plage[0]);
        // Le poisson ne peut pas nager DANS le fond : il reste au-dessus du relief.
        fish.userData.depth = Math.max(fish.userData.depth,
            fondY(fish.position.x, fish.position.z) + 0.35);
        // Une espèce de FOND naît collée au relief, même au fond d'une fosse (jusqu'à
        // 8 unités) : sa tranche d'eau [-3,4 ; -2,6] la laisserait flotter à mi-hauteur.
        if (fish.userData.couche === 'fond') {
            fish.userData.depth = fondY(fish.position.x, fish.position.z) + 0.45;
        }
        fish.position.y = fish.userData.depth - fish.userData.topOffset;
        // Sa tranche d'eau : il ne viendra à l'hameçon que si celui-ci y est.
        fish.userData.profondeurZone = plage.slice();
        // Domaine vital : chaque poisson reste dans SON coin d'étang (il ne traverse
        // pas tout l'étang). Rayon déduit de la phase, sans tirage aléatoire en plus.
        fish.userData.homeX = groupe ? groupe.centre.x : fish.position.x;
        fish.userData.homeZ = groupe ? groupe.centre.z : fish.position.z;
        // Les territoires suivent l'échelle de l'étang (× f : plus larges dans un grand lac, plus serrés dans un étang
        // minuscule) ; pour la plaine, f = 1.
        fish.userData.homeRadius = (comp ? comp.domaine * (0.85 + tProf * 0.3)
            : 10 + tProf * 12) * monde.echelle;                     // zone de vie propre à l'espèce
        // Un petit poisson de bord ne s'éloigne pas de la berge : son domaine est borné à
        // la bande de rive, sinon il se diluerait dans le large et l'hameçon resterait seul.
        if (estEspeceDeBord(espece.id)) {
            fish.userData.homeRadius = Math.min(fish.userData.homeRadius, BANDE_BORD);
        }
        fish.userData.power = power;
        fish.userData.aggression = aggression;
        fish.userData.type = espece.form;
        fish.userData.espece = espece.nom;
        fish.userData.especeId = espece.id;
        // Longueur affichée (cm) : c'est elle qui sert aussi au calcul du poids,
        // pour que le carnet et le poisson soient parfaitement cohérents.
        const longueurAffichee = Math.round(longueurCm);
        fish.userData.longueurCm = longueurAffichee;
        fish.userData.weight = Math.round(poidsRealisteKilos(espece, longueurAffichee) * 1000) / 1000;
        fish.userData.losses = 0;
        fish.userData.hooked = false;
        fish.userData.horsNorme = horsNorme;
        fish.userData.facteurRare = facteurRare;
        if (horsNorme && fish.userData.bodyMat && fish.userData.bodyMat.emissive) {
            // Un très léger éclat doré distingue le spécimen exceptionnel.
            fish.userData.bodyMat.emissive.setHex(0x3a2a00);
            fish.userData.bodyMat.emissiveIntensity = 0.35;
        }
        // Les poissons vivent cachés sous l'eau : seules leurs bulles et leurs
        // sillages indiquent leur présence (ils ne deviennent visibles qu'au combat).
        fish.visible = false;
        scene.add(fish);
        fishes.push(fish);
        // Un poisson ajouté plus tard (remplacement) est lui aussi attiré par les obstacles.
        if (!peuplement && !groupe) { installerHabitat([fish]); }
        return fish;
    }

    // Générateur LOCAL pour les comportements : il ne décale pas le hasard du monde.
    let comportementRngState = 0x2c1b3a77 >>> 0;
    function comportementRand() {
        comportementRngState = (comportementRngState + 0x6d2b79f5) >>> 0;
        let t = comportementRngState;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Statistiques de la population courante : sert au contrôle de biomasse, à l'API de
    // test et au carnet. La biomasse se compte en kg et en kg/ha (surface réelle).
    function statsPopulation() {
        const parEspece = {};
        let biomasse = 0;
        fishes.forEach(function (f) {
            const id = f.userData.especeId;
            parEspece[id] = (parEspece[id] || 0) + 1;
            biomasse += f.userData.weight || 0;
        });
        const ids = Object.keys(parEspece);
        const solitaires = ids.reduce(function (total, id) {
            return total + (SOLITAIRES.indexOf(id) >= 0 ? parEspece[id] : 0);
        }, 0);
        return {
            total: fishes.length,
            cible: POPULATION_CIBLE,
            plafond: FISH_COUNT,
            especes: ids.length,
            parEspece: parEspece,
            solitaires: solitaires,
            biomasseKg: Math.round(biomasse * 10) / 10,
            biomasseKgHa: Math.round(biomasse / surfaceBiomasse() * 10) / 10,
            surfaceHa: surfaceBiomasse(),
            poissonsParHa: Math.round(fishes.length / surfaceBiomasse() * 10) / 10,
            milieu: milieuCourant.id
        };
    }

    // COMPOSITION de la population (quelles espèces, en groupes de combien) : planifiée AVANT de
    // fabriquer le moindre poisson. Les QUOTAS par espèce viennent du biotope (milieux.js :
    // allocation par plus forts restes, au moins 1 poisson par espèce présente, au moins `banc[0]`
    // pour une espèce de banc). Seule la découpe en bancs utilise le générateur local : le hasard
    // du monde n'est pas touché. Les GROUPES (bancs) sont plantés d'abord, puis les solitaires.
    function planifierComposition() {
        const quotas = quotasEspeces(milieuCourant, POPULATION_CIBLE).quotas;
        const groupes = [];
        const solitaires = [];
        SPECIES.forEach(function (esp) {
            let restant = quotas[esp.id] || 0;
            const c = COMPORTEMENTS[esp.id];
            const banc = c && c.banc ? c.banc : [1, 1];
            while (restant > 0) {
                let n = banc[0] + Math.floor(comportementRand() * (banc[1] - banc[0] + 1));
                n = Math.max(1, Math.min(n, restant));
                // Un reste plus petit qu'un banc minimal est rattaché à ce banc (pas de banc incomplet).
                if (restant - n > 0 && restant - n < banc[0]) { n = restant; }
                (n > 1 ? groupes : solitaires).push({ espece: esp, n: n });
                restant -= n;
            }
        });
        return groupes.concat(solitaires);
    }

    // La BIOMASSE ne se connaît qu'une fois les longueurs tirées (un silure fait de 20 à
    // 100 kg, un gardon 300 g) : elle se vérifie sur la population fabriquée.
    function biomasseAcceptable() {
        const s = statsPopulation();
        return s.biomasseKgHa >= BIOMASSE_MIN_KG_HA && s.biomasseKgHa <= BIOMASSE_MAX_KG_HA;
    }

    let compteurGroupes = 0;
    function tirerPopulation(plan) {
        plan.forEach(function (element) {
            const esp = element.espece;
            const groupe = element.n > 1 ? {
                id: ++compteurGroupes,
                centre: positionPourEspece(esp.id),
                cap: rand() * Math.PI * 2
            } : null;
            for (let i = 0; i < element.n; i++) {
                spawnFish(esp, groupe);
            }
        });
    }

    function viderEtang() {
        fishes.forEach(function (f) { scene.remove(f); });
        fishes.length = 0;
    }

    // Un poisson de BORD habite la bande de rive. Les obstacles puis les substrats installent
    // les zones de vie au large (un gardon se retrouvait à 70 unités de la berge) : on le
    // RAMÈNE dans la bande, dans sa direction. Son fond préféré est conservé
    // (`substratHabitat`) ; seule sa zone de vie revient au bord. Générateur LOCAL : le
    // hasard du monde n'est pas décalé.
    function rappelerAuBord(liste) {
        const marge = 12 * Math.min(1, monde.echelle);
        liste.forEach(function (f) {
            const d = f.userData;
            if (!estEspeceDeBord(d.especeId) || d.hooked || !Number.isFinite(d.homeX)) { return; }
            const dx = d.homeX - POND_CENTER.x;
            const dz = d.homeZ - POND_CENTER.z;
            const angle = Math.atan2(dz, dx);
            const rayonLocal = Math.max(1, rayonEtang(angle) - marge);
            const bande = Math.min(rayonLocal * 0.45, BANDE_BORD);
            const cible = rayonLocal - bande * comportementRand() * comportementRand();
            if (Math.hypot(dx, dz) >= cible) { return; }      // déjà plus près de la rive que la cible
            d.homeX = POND_CENTER.x + Math.cos(angle) * cible;
            d.homeZ = POND_CENTER.z + Math.sin(angle) * cible;
            f.position.x = d.homeX;
            f.position.z = d.homeZ;
        });
    }

    // Peuple l'étang jusqu'à POPULATION_CIBLE poissons. Pour la plaine (l'étang d'origine), la biomasse
    // est vérifiée une fois les poissons faits : si elle sort de 100–300 kg/ha, on recommence les
    // tailles (au plus 12 fois ; le résultat reste reproductible). Les autres biotopes sont des
    // données d'équilibrage voulues (une rivière à silures dépasse 300 kg/ha) : un seul tirage,
    // sans refaire toute la population en 3D.
    function peuplerEtang() {
        const essais = milieuCourant.id === MILIEU_DEFAUT ? 12 : 0;
        let plan = planifierComposition();
        for (let essai = 0; essai < essais; essai++) {
            tirerPopulation(plan);
            if (biomasseAcceptable()) { return; }
            viderEtang();
            plan = planifierComposition();
        }
        tirerPopulation(plan);   // dernier recours : on garde le tirage tel quel
    }

    peuplerEtang();
    peuplement = false;
    installerHabitat(fishes);
    rappelerAuBord(fishes);

    // Change de biotope : quotas, taille maximale et population cible suivent (sans repeupler).
    function setMilieu(milieu) {
        milieuCourant = typeof milieu === 'string' ? milieuParId(milieu) : (milieu || milieuCourant);
        facteurTailleCourant = facteurTaille(milieuCourant);
        POPULATION_CIBLE = populationPourMilieu(milieuCourant);
    }

    // Vide l'étang puis le repeuple (tests, nouvelle partie, changement de biotope).
    function repeuplerEtang(milieu) {
        if (milieu) { setMilieu(milieu); }
        peuplement = true;
        viderEtang();
        peuplerEtang();
        peuplement = false;
        installerHabitat(fishes);
        rappelerAuBord(fishes);
    }

    function respawnFish(fish) {
        fish.position.copy(positionPourEspece(fish.userData.especeId));
        const v = randomFishVelocity();
        fish.userData.vx = v.vx;
        fish.userData.vz = v.vz;
    }

    // Un poisson perdu devient plus agressif, plus rapide et plus difficile.
    function punishFish(fish) {
        if (!fish) {
            return;
        }
        fish.userData.losses = (fish.userData.losses || 0) + 1;
        fish.userData.aggression = Math.min(2.5, fish.userData.aggression + 0.2);
        const speed = Math.hypot(fish.userData.vx, fish.userData.vz);
        const newSpeed = Math.min(9, speed * 1.25 + 0.5);
        if (speed > 0.001) {
            fish.userData.vx = (fish.userData.vx / speed) * newSpeed;
            fish.userData.vz = (fish.userData.vz / speed) * newSpeed;
        } else {
            const v = randomFishVelocity();
            fish.userData.vx = v.vx;
            fish.userData.vz = v.vz;
        }
        if (fish.userData.bodyMat) {
            // Un poisson perdu devient plus rouge (il « chauffe »).
            const base = fish.userData.couleurBase || new THREE.Color(0xffb066);
            const t = Math.min(1, (fish.userData.losses || 0) * 0.2);
            fish.userData.bodyMat.color.copy(base).lerp(new THREE.Color(0xd23a12), t);
        }
    }

    // -------------------------------------------------------------------
    // API du module (ce que script.js utilise).
    // -------------------------------------------------------------------
    return {
        fishes: fishes,
        PROIES_CARNASSIERS: PROIES_CARNASSIERS,
        CARNASSIERS: CARNASSIERS,
        PREDATOR_ATTACK_RADIUS: PREDATOR_ATTACK_RADIUS,
        PREDATOR_ATTACK_ADVANTAGE: PREDATOR_ATTACK_ADVANTAGE,
        styleEspece: styleEspece,
        makeFish: makeFish,
        randomFishPosition: randomFishPosition,
        poidsRealisteKilos: poidsRealisteKilos,
        setHorsNormeChance: setHorsNormeChance,
        distributionAttendue: distributionAttendue,
        spawnFish: spawnFish,
        statsPopulation: statsPopulation,
        viderEtang: viderEtang,
        get POPULATION_CIBLE() { return POPULATION_CIBLE; },
        setMilieu: setMilieu,
        getMilieu: function () { return milieuCourant; },
        FISH_COUNT: FISH_COUNT,
        SOLITAIRES: SOLITAIRES,
        MAX_PAR_SOLITAIRE: MAX_PAR_SOLITAIRE,
        BIOMASSE_MIN_KG_HA: BIOMASSE_MIN_KG_HA,
        BIOMASSE_MAX_KG_HA: BIOMASSE_MAX_KG_HA,
        ESPECES_MIN: ESPECES_MIN,
        comportementRand: comportementRand,
        repeuplerEtang: repeuplerEtang,
        punishFish: punishFish,
        // `horsNormeChance` est un nombre : on expose un lecteur, sinon on
        // ne verrait que la valeur au moment de la création du module.
        getHorsNormeChance: function () { return horsNormeChance; }
    };
}

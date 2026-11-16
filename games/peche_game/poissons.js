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
} from './especes.js?v=230';
import { creerModelePoisson, echellePourTaille } from './modelePoisson.js?v=230';

export function creerPoissons(deps) {
    const scene = deps.scene;
    const rand = deps.rand;
    const rayonEtang = deps.rayonEtang;
    const POND_CENTER = deps.POND_CENTER;
    // Le poisson ne nage pas dans le fond : il lui faut le relief de l'étang.
    const fondY = deps.fondY;
    // Fosses (refuge des poissons de fond) et surface (en hectares) de l'étang.
    const FOSSES = deps.FOSSES;
    const SURFACE_HA = deps.SURFACE_HA;
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
    //    rares : au plus 2 de chaque, 1 seul silure. Les bancs portent l'essentiel.
    // ---------------------------------------------------------------------------
    const FISH_COUNT = 240;                      // plafond technique (v197 : 64 -> 240, densite par difficulte)
    const DENSITE_PAR_HECTARE = 90;              // poissons / ha
    const BIOMASSE_MIN_KG_HA = 100;              // bornes réalistes (kg / ha)
    const BIOMASSE_MAX_KG_HA = 300;
    const ESPECES_MIN = 10;                      // diversité minimale de l'étang
    const SOLITAIRES = ['silure', 'brochet', 'sandre', 'black-bass', 'truite', 'anguille'];
    const MAX_PAR_SOLITAIRE = { silure: 1, defaut: 2 };
    // Les poissons de fosse vivent dans les trous profonds : on les atteint en barque.
    const ESPECES_DE_FOSSE = ['silure', 'anguille', 'sandre'];
    // Densité par difficulté (idées.md §17.6) : ×1,5 / ×2 / ×3 sur la base 90/ha.
    const FACTEUR_DENSITE = (typeof etat !== 'undefined' && etat.facteurDensite) || 2;
    const POPULATION_CIBLE = Math.min(FISH_COUNT, Math.round(SURFACE_HA * DENSITE_PAR_HECTARE * FACTEUR_DENSITE));

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

    function randomFishPosition() {
        const angle = rand() * Math.PI * 2;
        // Le poisson naît DANS l'eau, à distance du bord local (contour irrégulier).
        // Racine carrée : répartition uniforme sur la SURFACE (un tirage linéaire du
        // rayon entassait les poissons au centre, ce qui se voit dans un grand étang).
        const r = Math.sqrt(rand()) * Math.max(1, rayonEtang(angle) - 12);
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
        const position = randomFishPosition();
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

    // Tirage d'espèce pondéré par son abondance dans l'étang.
    function pickSpecies() {
        let total = 0;
        for (let i = 0; i < SPECIES.length; i++) {
            total += SPECIES[i].abondance;
        }
        let r = rand() * total;
        for (let i = 0; i < SPECIES.length; i++) {
            r -= SPECIES[i].abondance;
            if (r <= 0) {
                return SPECIES[i];
            }
        }
        return SPECIES[0];
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

    // Distribution ATTENDUE : chaque espèce reçoit une part proportionnelle à son
    // abondance. Sert au carnet/aux tests pour vérifier que l'étang reste équilibré.
    function distributionAttendue() {
        let total = 0;
        for (let i = 0; i < SPECIES.length; i++) { total += SPECIES[i].abondance; }
        return SPECIES.map(function (espece) {
            return {
                id: espece.id,
                nom: espece.nom,
                part: total > 0 ? espece.abondance / total : 0
            };
        });
    }

    // Une espèce rare déjà au complet (voir MAX_PAR_SOLITAIRE) n'est pas retirée : un
    // poisson pêché est remplacé, mais l'étang ne se remplit pas de silures.
    function pickEspeceAutorisee() {
        let espece = pickSpecies();
        for (let i = 0; i < 8; i++) {
            const max = MAX_PAR_SOLITAIRE[espece.id] || MAX_PAR_SOLITAIRE.defaut;
            const present = fishes.filter(function (f) { return f.userData.especeId === espece.id; }).length;
            if (SOLITAIRES.indexOf(espece.id) < 0 || present < max) { return espece; }
            espece = pickSpecies();
        }
        return espece;
    }

    function spawnFish(especeImposee, groupe) {
        const espece = especeImposee || pickEspeceAutorisee();
        // Longueur réelle tirée dans la fourchette de l'espèce (cm).
        let longueurCm = espece.cm[0] + rand() * (espece.cm[1] - espece.cm[0]);
        // Spécimen hors norme : la taille peut dépasser le maximum de l'espèce.
        const rareChance = (typeof window !== 'undefined'
            && typeof window.__PECHE_RARE__ === 'number')
            ? window.__PECHE_RARE__ : horsNormeChance;
        const horsNorme = rareRand() < rareChance;
        const facteurRare = horsNorme ? (1.08 + rareRand() * 0.28) : 1;
        if (horsNorme) {
            longueurCm *= facteurRare;
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
        fish.userData.homeRadius = comp ? comp.domaine * (0.85 + tProf * 0.3)
            : 10 + tProf * 12;                                      // zone de vie propre à l'espèce
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

    // Peuplement de l'étang : les espèces de banc arrivent EN GROUPE, les solitaires
    // (brochet, silure, anguille…) seuls. Le tirage reste pondéré par l'abondance :
    // on divise le poids par la taille moyenne du groupe (l'abondance compte des poissons).
    function pickEspeceGroupe(tirage) {
        const tire = tirage || rand;
        let total = 0;
        const poids = SPECIES.map(function (esp) {
            const c = COMPORTEMENTS[esp.id];
            const moy = c ? (c.banc[0] + c.banc[1]) / 2 : 1;
            total += esp.abondance / moy;
            return esp.abondance / moy;
        });
        let r = tire() * total;
        for (let i = 0; i < SPECIES.length; i++) {
            r -= poids[i];
            if (r <= 0) { return SPECIES[i]; }
        }
        return SPECIES[0];
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
            biomasseKgHa: Math.round(biomasse / SURFACE_HA * 10) / 10,
            surfaceHa: SURFACE_HA,
            poissonsParHa: Math.round(fishes.length / SURFACE_HA * 10) / 10
        };
    }

    // COMPOSITION de la population (quelles espèces, en groupes de combien) : planifiée
    // AVANT de fabriquer le moindre poisson, avec le générateur local (le hasard du monde
    // n'est pas touché). Une composition est acceptable si elle compte assez d'espèces et
    // si les solitaires restent rares. Refaire ce tirage ne coûte presque rien ; refaire
    // des poissons en 3D (mesh, sommets) coûterait 60 ms par essai.
    function compositionAcceptable(compte) {
        if (Object.keys(compte).length < ESPECES_MIN) { return false; }
        return SOLITAIRES.every(function (id) {
            return (compte[id] || 0) <= (MAX_PAR_SOLITAIRE[id] || MAX_PAR_SOLITAIRE.defaut);
        });
    }

    function planifierComposition() {
        let plan = [];
        for (let essai = 0; essai < 300; essai++) {
            plan = [];
            const compte = {};
            let restant = POPULATION_CIBLE;
            while (restant > 0) {
                const esp = pickEspeceGroupe(comportementRand);
                const c = COMPORTEMENTS[esp.id];
                let n = c ? c.banc[0] + Math.floor(comportementRand() * (c.banc[1] - c.banc[0] + 1)) : 1;
                n = Math.max(1, Math.min(n, restant));
                plan.push({ espece: esp, n: n });
                compte[esp.id] = (compte[esp.id] || 0) + n;
                restant -= n;
            }
            if (compositionAcceptable(compte)) { return plan; }
        }
        return plan;
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

    // Peuple l'étang jusqu'à POPULATION_CIBLE poissons. La biomasse est vérifiée une fois
    // les poissons faits : si elle sort de 100–300 kg/ha (un silure de 100 kg, ou une
    // carpe de moins), on recommence (au plus 12 fois ; le générateur est toujours le même,
    // le résultat reste reproductible). Environ une population sur dix est refaite.
    function peuplerEtang() {
        let plan = planifierComposition();
        for (let essai = 0; essai < 12; essai++) {
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

    // Vide l'étang puis le repeuple (tests, nouvelle partie).
    function repeuplerEtang() {
        peuplement = true;
        viderEtang();
        peuplerEtang();
        peuplement = false;
        installerHabitat(fishes);
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
        POPULATION_CIBLE: POPULATION_CIBLE,
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

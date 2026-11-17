// ---------------------------------------------------------------------------
// chasse.js — CHASSES DES CARNASSIERS : de temps en temps, un carnassier fonce sur un
// banc de petits poissons blancs. On le voit à la surface : remous en série, proies qui
// remontent, et parfois une proie qui saute hors de l'eau.
//
// Règles :
//  - chaque carnassier a SES proies (CHASSE_PROIES, ci-dessous) ;
//  - les chasses sont plus fréquentes à l'aube et au crépuscule, par temps couvert
//    (rafales, pluie) et dans une eau ni trop froide ni trop chaude (frequenceChasse) ;
//  - les poissons restent PÊCHABLES : un poisson ferré, qui mord ou qui vise l'hameçon
//    n'est jamais piloté par la chasse ; les autres gardent leur nage, la chasse ne fait
//    qu'ajouter une impulsion (fuite des proies, sprint du chasseur).
//
// Données et frequenceChasse : PURES (testables sans navigateur). creerChasse(deps) : système.
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=251';
import { heureDeJeu, periodeDeJournee } from './physique.js?v=251';

// Proies de chaque carnassier (poissons blancs, à son goût).
export const CHASSE_PROIES = {
    brochet: ['ablette', 'gardon', 'rotengle'],
    perche: ['ablette', 'goujon', 'gardon'],
    sandre: ['gardon', 'ablette', 'goujon'],
    'black-bass': ['ablette', 'gardon', 'rotengle'],
    silure: ['gardon', 'carassin', 'rotengle']
};

export const CHASSES_PAR_MINUTE = 0.8;   // fréquence de base (midi, beau temps, eau tempérée)
export const RAYON_CHASSE = 9;           // unités : proies prises dans la chasse autour du chasseur
export const RAYON_RECHERCHE = 22;       // unités : un chasseur ne part que s'il a des proies assez près
export const DUREE_CHASSE = [6, 13];     // s
const VITESSE_SPRINT = 6.5;              // unités/s : le carnassier fonce
const VITESSE_FUITE = 5;                 // unités/s : la proie détale
const SAUTS_PAR_SECONDE = 0.35;          // probabilité de saut par proie paniquée près de la surface
const DUREE_SAUT = 0.55;

/**
 * Multiplicateur de la fréquence des chasses (sans unité, 0 à ≈ 3).
 * heure : 0–24 ; meteo : 'beau' | 'rafales' | 'pluie' ; temperature : °C (surface).
 */
export function frequenceChasse(heure, meteo, temperature) {
    const periode = periodeDeJournee(heure);
    const horaire = periode === 'aube' || periode === 'crépuscule' ? 2.2
        : periode === 'nuit' ? 0.7 : 1;
    const ciel = meteo === 'pluie' ? 1.5 : meteo === 'rafales' ? 1.3 : 1;
    let eau = 1;
    if (Number.isFinite(temperature)) {
        if (temperature < 6) { eau = 0.25; }
        else if (temperature < 10) { eau = 0.6; }
        else if (temperature > 25) { eau = 0.5; }
    }
    return horaire * ciel * eau;
}

export function creerChasse(deps) {
    const { fishes, angler, spawnRipple, spawnSplash, sound, weatherName, temperatureEau, monde, POND_CENTER, rayonEtang } = deps;
    // Hasard PROPRE à la chasse (graine fixe) : le hasard du monde n'est pas décalé.
    let graine = 0xc4a55e;
    function rand() {
        graine = (graine + 0x6d2b79f5) >>> 0;
        let t = graine;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    if (etat.chassesActives === undefined) { etat.chassesActives = true; }   // les tests les coupent (harnais)
    let chasse = null;            // { chasseur, proies: [], restant, remous, x, z, especeProie }
    let attente = 4;              // s avant le prochain tirage
    let total = 0;                // chasses lancées (tests)
    let sauts = 0;                // sauts de proies (tests)
    const sauteurs = [];          // { fish, t, x0, z0, vx, vz }

    // Un poisson qu'on ne doit JAMAIS piloter : il appartient à la pêche.
    function occupe(f) {
        const d = f.userData;
        return !d || d.hooked || d.biting || d.targeting || f === etat.heldFish || f === etat.hookedFish || f === etat.biteFish;
    }

    function portee() { return (monde && monde.porteeLancer ? monde.porteeLancer : 52) * 1.3; }

    function trouverChasse(forcerEspece) {
        const loin = portee();
        const candidats = fishes.filter(function (f) {
            const id = f.userData && f.userData.especeId;
            if (!CHASSE_PROIES[id] || occupe(f)) { return false; }
            if (forcerEspece && id !== forcerEspece) { return false; }
            return !angler || Math.hypot(f.position.x - angler.position.x, f.position.z - angler.position.z) < loin;
        });
        // On mélange un peu l'ordre (sans toucher au hasard du monde plus qu'un tirage par candidat essayé).
        for (let essai = 0; essai < Math.min(6, candidats.length); essai++) {
            const chasseur = candidats[Math.floor(rand() * candidats.length)];
            const gouts = CHASSE_PROIES[chasseur.userData.especeId];
            const proches = fishes.filter(function (f) {
                return f !== chasseur && !occupe(f) && gouts.indexOf(f.userData.especeId) >= 0
                    && Math.hypot(f.position.x - chasseur.position.x, f.position.z - chasseur.position.z) < RAYON_RECHERCHE;
            });
            if (proches.length >= 2) { return { chasseur: chasseur, proies: proches }; }
        }
        return null;
    }

    function demarrer(trouve) {
        const c = trouve.chasseur;
        // Le chasseur fonce vers le centre du groupe de proies le plus proche.
        let cx = 0, cz = 0;
        trouve.proies.forEach(function (p) { cx += p.position.x; cz += p.position.z; });
        cx /= trouve.proies.length;
        cz /= trouve.proies.length;
        chasse = {
            chasseur: c, x: cx, z: cz, restant: DUREE_CHASSE[0] + rand() * (DUREE_CHASSE[1] - DUREE_CHASSE[0]),
            remous: 0, proies: [], especeProie: trouve.proies[0].userData.especeId
        };
        total += 1;
        if (etat.spawnFloatingText) {
            etat.spawnFloatingText('Chasse !', { x: cx, y: 0.6, z: cz }, '#ffd27a');
        }
        return true;
    }

    function dansEtang(x, z, marge) {
        const dx = x - POND_CENTER.x;
        const dz = z - POND_CENTER.z;
        return Math.hypot(dx, dz) < rayonEtang(Math.atan2(dz, dx)) - marge;
    }

    function lancerSaut(f) {
        if (sauteurs.length >= 2 || sauteurs.some(function (s) { return s.fish === f; })) { return; }
        const a = rand() * Math.PI * 2;
        sauteurs.push({ fish: f, t: 0, x0: f.position.x, z0: f.position.z, vx: Math.cos(a) * 2.2, vz: Math.sin(a) * 2.2 });
        sauts += 1;
        if (sound && sound.jump) { sound.jump(); }
        if (spawnSplash) { spawnSplash({ x: f.position.x, y: 0.1, z: f.position.z }); }
    }

    function majSauts(dt) {
        for (let i = sauteurs.length - 1; i >= 0; i--) {
            const s = sauteurs[i];
            const f = s.fish;
            s.t += dt;
            // Ferré ou mordu pendant le saut : la pêche reprend la main tout de suite.
            if (occupe(f) || s.t >= DUREE_SAUT) {
                if (!occupe(f)) {
                    f.visible = false;
                    if (spawnSplash) { spawnSplash({ x: f.position.x, y: 0.1, z: f.position.z }); }
                    if (spawnRipple) { spawnRipple({ x: f.position.x, y: 0.1, z: f.position.z }); }
                }
                sauteurs.splice(i, 1);
                continue;
            }
            const k = s.t / DUREE_SAUT;
            f.position.x = s.x0 + s.vx * s.t;
            f.position.z = s.z0 + s.vz * s.t;
            f.position.y = Math.sin(Math.PI * k) * 1.1;
            f.rotation.z = (0.5 - k) * 1.6;
            f.visible = true;
        }
    }

    // Une image de chasse : sprint du chasseur, fuite et remontée des proies, remous, sauts.
    function majChasse(dt) {
        const c = chasse.chasseur;
        chasse.restant -= dt;
        if (chasse.restant <= 0 || occupe(c)) { chasse = null; return; }
        const gouts = CHASSE_PROIES[c.userData.especeId];
        // Le chasseur poursuit la proie la plus proche (cible recalculée chaque image, sans allocation).
        let cible = null;
        let meilleure = Infinity;
        chasse.proies.length = 0;
        for (let i = 0; i < fishes.length; i++) {
            const f = fishes[i];
            if (f === c || occupe(f) || gouts.indexOf(f.userData.especeId) < 0) { continue; }
            const d = Math.hypot(f.position.x - c.position.x, f.position.z - c.position.z);
            if (d < RAYON_CHASSE) { chasse.proies.push(f); }
            if (d < meilleure) { meilleure = d; cible = f; }
        }
        if (!cible || meilleure > RAYON_RECHERCHE * 1.5) { chasse = null; return; }
        const cd = c.userData;
        const ex = cible.position.x - c.position.x;
        const ez = cible.position.z - c.position.z;
        const n = Math.hypot(ex, ez) || 1;
        cd.vx = ex / n * VITESSE_SPRINT;
        cd.vz = ez / n * VITESSE_SPRINT;
        if (Number.isFinite(cd.depth)) { cd.depth += (-0.6 - cd.depth) * Math.min(1, dt * 2); }   // il monte attaquer
        chasse.x = c.position.x;
        chasse.z = c.position.z;
        // Les proies paniquent : elles fuient le chasseur et remontent vers la surface.
        chasse.proies.forEach(function (p) {
            const d = p.userData;
            const fx = p.position.x - c.position.x;
            const fz = p.position.z - c.position.z;
            const fn = Math.hypot(fx, fz) || 1;
            d.vx = fx / fn * VITESSE_FUITE;
            d.vz = fz / fn * VITESSE_FUITE;
            if (Number.isFinite(d.depth)) { d.depth += (-0.15 - d.depth) * Math.min(1, dt * 3); }
            if (fn < 3.5 && dansEtang(p.position.x, p.position.z, 3) && rand() < SAUTS_PAR_SECONDE * dt) { lancerSaut(p); }
        });
        // Remous en série à la surface, là où ça chasse.
        chasse.remous -= dt;
        if (chasse.remous <= 0 && spawnRipple) {
            chasse.remous = 0.18 + rand() * 0.3;
            spawnRipple({ x: chasse.x + (rand() - 0.5) * 2, y: 0.1, z: chasse.z + (rand() - 0.5) * 2 });
        }
    }

    function maj(dt) {
        majSauts(dt);
        if (chasse) { majChasse(dt); return; }
        if (etat.chassesActives === false) { return; }
        attente -= dt;
        if (attente > 0) { return; }
        attente = 1;   // un tirage par seconde
        const meteo = weatherName ? weatherName() : 'beau';
        const temperature = temperatureEau ? temperatureEau() : 15;
        const proba = CHASSES_PAR_MINUTE / 60 * frequenceChasse(heureDeJeu(etat.dayPhase || 0), meteo, temperature);
        if (rand() >= proba) { return; }
        const trouve = trouverChasse(null);
        if (trouve) { demarrer(trouve); }
    }

    // Tests : déclenche tout de suite une chasse (espèce de chasseur au choix).
    function declencher(especeChasseur) {
        if (chasse) { return true; }
        const trouve = trouverChasse(especeChasseur || null);
        return trouve ? demarrer(trouve) : false;
    }

    return {
        maj, declencher,
        enCours: function () { return !!chasse; },
        info: function () {
            return chasse ? { chasseur: chasse.chasseur, especeChasseur: chasse.chasseur.userData.especeId,
                especeProie: chasse.especeProie, proies: chasse.proies.slice(), restant: chasse.restant } : null;
        },
        arreter: function () { chasse = null; sauteurs.length = 0; },
        total: function () { return total; },
        sauts: function () { return sauts; }
    };
}

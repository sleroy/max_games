// ---------------------------------------------------------------------------
// Scénario 79 : PHYSIQUE DE L'EAU — température, saisons, thermocline (idées.md §15.1, v189).
//
//  - température calculée (saison + heure + météo), avec inertie : aucun à-coup ;
//  - 4 saisons sur 2 jours de jeu chacune ;
//  - thermocline en été (eau chaude dessus, froide dessous), absente en hiver ;
//  - UNE seule source (`etat.thermocline`) : nage des poissons, widget de profondeur, carnet ;
//  - eau froide (< 8 °C) : léthargie, carnassiers encore actifs ; eau chaude (> 22 °C) : poissons au
//    fond, meilleure pêche à l'aube et au crépuscule ;
//  - l'effet température MULTIPLIE le facteur des heures et de la pression (un seul chemin de calcul).
// ---------------------------------------------------------------------------
import {
    SAISONS, JOURS_PAR_SAISON, MILIEU_SAISON, saisonDe, temperatureSaison, temperatureJour, temperatureCible,
    intensiteThermocline, profondeurThermocline, temperatureEnProfondeur, facteurTemperature, vitaliteThermique,
    facteurHoraire, facteurPression, limiterFacteur, FACTEUR_MIN, FACTEUR_MAX, MARGE_THERMOCLINE,
    SEUIL_THERMOCLINE, CORRECTION_METEO
} from '../physique.js';
import fs from 'node:fs';
import path from 'node:path';
import { COMPORTEMENTS } from '../especes.js';
import {
    group, check, checkEqual, checkClose,
    GAME_DIR, G, el, state, step, stepFor, resetToIdle, clearLilyPads, castTo, forceBite
} from './harness.mjs';

const POINT = { x: 0, z: -25 };

/** Laisse l'eau rejoindre sa température (heure et météo figées) : 8 inerties. */
function laisserTiedir() {
    stepFor(280, 0.5);
}

function moyenne(liste) {
    return liste.reduce(function (a, b) { return a + b; }, 0) / (liste.length || 1);
}

/** Poissons libres (ni ferrés, ni en touche, ni attirés) : ceux dont la nage est naturelle. */
function poissonsLibres() {
    return G().fishes.filter(function (f) {
        return !f.userData.hooked && !f.userData.biting && !f.userData.targeting && !f.userData.attire;
    });
}

export function run() {
    group('79) Physique de l’eau : température, saisons, thermocline (§15.1)');

    // --- 1) Modèle pur : saisons, température, thermocline --------------------------
    checkEqual('4 saisons', SAISONS.length, 4);
    checkEqual('une saison dure 2 jours de jeu', JOURS_PAR_SAISON, 2);
    ['printemps', 'été', 'automne', 'hiver'].forEach(function (nom, i) {
        checkEqual('le milieu de saison ' + (i + 1) + ' est « ' + nom + ' »', SAISONS[saisonDe(MILIEU_SAISON[i])], nom);
    });
    checkEqual('l’année boucle : après l’hiver, le printemps', SAISONS[saisonDe(1.01)], 'printemps');
    const tEte = temperatureSaison(MILIEU_SAISON[1]);
    const tHiver = temperatureSaison(MILIEU_SAISON[3]);
    check('mi-été ≈ 24 °C', Math.abs(tEte - 24) < 0.01, tEte.toFixed(2));
    check('mi-hiver ≈ 3 °C', Math.abs(tHiver - 3) < 0.01, tHiver.toFixed(2));
    check('l’eau d’été est plus chaude que celle d’hiver', tEte > tHiver + 15);
    check('printemps et automne sont intermédiaires', temperatureSaison(MILIEU_SAISON[0]) > tHiver
        && temperatureSaison(MILIEU_SAISON[0]) < tEte && temperatureSaison(MILIEU_SAISON[2]) < tEte);
    check('le jour réchauffe, la nuit refroidit (16 h > 4 h)', temperatureJour(16) > temperatureJour(4) + 2,
        temperatureJour(16).toFixed(2) + ' contre ' + temperatureJour(4).toFixed(2));
    check('la pluie refroidit', temperatureCible(0.375, 12, 'pluie') < temperatureCible(0.375, 12, 'beau')
        && CORRECTION_METEO.pluie < CORRECTION_METEO.rafales);
    let bornes = true;
    for (let a = 0; a < 1; a += 0.01) {
        for (let h = 0; h < 24; h += 1) {
            ['beau', 'rafales', 'pluie'].forEach(function (m) {
                const t = temperatureCible(a, h, m);
                if (!Number.isFinite(t) || t < 0.5 || t > 30) { bornes = false; }
            });
        }
    }
    check('toute l’année : température finie dans [0,5 ; 30] °C', bornes);

    checkEqual('intensité nulle sous 15 °C (eau brassée)', intensiteThermocline(14), 0);
    checkEqual('intensité pleine à 21 °C', intensiteThermocline(21), 1);
    check('intensité croissante entre les deux', intensiteThermocline(18) > 0.4 && intensiteThermocline(18) < 0.6);
    check('la thermocline s’enfonce avec l’été', profondeurThermocline(1) > profondeurThermocline(0));
    const tc = { actif: true, profondeur: 3.6, intensite: 1 };
    check('surface = température de surface', Math.abs(temperatureEnProfondeur(24, tc, 0.5) - 24) < 0.05);
    check('au-delà de la thermocline : eau froide (≤ 10 °C)', temperatureEnProfondeur(24, tc, 6) <= 10,
        temperatureEnProfondeur(24, tc, 6).toFixed(1));
    check('la température ne remonte jamais avec la profondeur', (function () {
        let prec = Infinity;
        for (let z = 0; z <= 8; z += 0.1) {
            const t = temperatureEnProfondeur(24, tc, z);
            if (t > prec + 1e-9) { return false; }
            prec = t;
        }
        return true;
    })());
    check('sans thermocline, la température est la même à toute profondeur',
        temperatureEnProfondeur(5, { actif: false }, 6) === 5);

    // --- 2) Facteur de température ---------------------------------------------------
    const carpe = COMPORTEMENTS.carpe;
    const brochet = COMPORTEMENTS.brochet;
    checkClose('eau tempérée (15 °C) : facteur neutre', facteurTemperature(15, carpe, 12), 1, 1e-9);
    checkClose('8 °C pile : pas encore de léthargie', facteurTemperature(8, carpe, 12), 1, 1e-9);
    check('eau froide : un paisible est léthargique (× 1,8 au moins à 4 °C)',
        facteurTemperature(4, carpe, 12) > 1.8, facteurTemperature(4, carpe, 12).toFixed(2));
    check('eau froide : le carnassier reste actif (≤ × 1,3 à 4 °C)', facteurTemperature(4, brochet, 12) <= 1.3,
        facteurTemperature(4, brochet, 12).toFixed(2));
    check('à 2 °C, le carnassier mord bien plus vite que le paisible',
        facteurTemperature(2, brochet, 12) < facteurTemperature(2, carpe, 12) / 1.8);
    check('eau chaude : le milieu de journée est lent (× 1,5 au moins à 26 °C)',
        facteurTemperature(26, carpe, 12) > 1.5, facteurTemperature(26, carpe, 12).toFixed(2));
    check('eau chaude : l’aube et le crépuscule sont les meilleures heures',
        facteurTemperature(26, carpe, 6) < 1 && facteurTemperature(26, carpe, 18) < 1
        && facteurTemperature(26, carpe, 6) < facteurTemperature(26, carpe, 12),
        facteurTemperature(26, carpe, 6).toFixed(2) + ' / ' + facteurTemperature(26, carpe, 12).toFixed(2));
    check('la vitalité baisse en eau froide, moins pour un carnassier',
        vitaliteThermique(4, carpe) < 0.7 && vitaliteThermique(4, brochet) > 0.85
        && vitaliteThermique(15, carpe) === 1);
    let facteurBorne = true;
    for (let t = -5; t <= 40; t += 1) {
        for (let h = 0; h < 24; h += 1) {
            ['carpe', 'brochet', 'sandre', 'tanche'].forEach(function (espece) {
                const comp = COMPORTEMENTS[espece];
                const f = limiterFacteur(facteurHoraire(h, !!comp.nocturne) * facteurPression(998, -1)
                    * facteurTemperature(t, comp, h));
                if (!Number.isFinite(f) || f < FACTEUR_MIN || f > FACTEUR_MAX) { facteurBorne = false; }
            });
        }
    }
    check('température, heure et pression ensemble : facteur borné [' + FACTEUR_MIN + ' ; ' + FACTEUR_MAX + ']',
        facteurBorne);
    const sourcePoissons = fs.readFileSync(path.join(GAME_DIR, 'poissons.js'), 'utf8');
    const carnassiersDuJeu = sourcePoissons.match(/const CARNASSIERS = \[([^\]]*)\]/)[1].match(/'([^']+)'/g)
        .map(function (m) { return m.replace(/'/g, ''); }).sort();
    const carnassiersFlag = Object.keys(COMPORTEMENTS).filter(function (id) { return COMPORTEMENTS[id].carnassier; }).sort();
    check('« carnassier » (physique) = CARNASSIERS de poissons.js : une seule notion', carnassiersFlag.join() === carnassiersDuJeu.join(),
        carnassiersFlag.join() + ' / ' + carnassiersDuJeu.join());
    checkEqual('4 carnassiers', carnassiersFlag.length, 4);
    ['carpe', 'gardon', 'tanche', 'goujon'].forEach(function (id) {
        check(id + ' n’est pas carnassier', !COMPORTEMENTS[id].carnassier);
    });

    // --- 3) Le système : un seul chemin de calcul ------------------------------------
    G().setPression(1013, 0);
    G().setMeteo('beau');
    G().setSaison('été');
    G().setTemperatureEau(null);
    G().setHeure(12);
    laisserTiedir();
    const fHoraire = facteurHoraire(12, false);
    const fPression = facteurPression(1013, 0);
    const fTemp = facteurTemperature(G().getTemperatureEau(), COMPORTEMENTS.carpe, 12);
    checkClose('facteurTouche = horaire × pression × température (un seul chemin)',
        G().getFacteurTouche('carpe'), limiterFacteur(fHoraire * fPression * fTemp), 1e-9);
    G().setTemperatureEau(4);
    checkClose('… avec une eau à 4 °C aussi',
        G().getFacteurTouche('carpe'),
        limiterFacteur(fHoraire * fPression * facteurTemperature(4, COMPORTEMENTS.carpe, 12)), 1e-9);
    check('l’eau froide ALLONGE le délai de la carpe (≥ × 1,8)', G().getFacteurTouche('carpe') >= 1.8,
        G().getFacteurTouche('carpe').toFixed(2));
    check('… mais le brochet reste actif', G().getFacteurTouche('brochet') < G().getFacteurTouche('carpe') / 1.5,
        G().getFacteurTouche('brochet').toFixed(2) + ' contre ' + G().getFacteurTouche('carpe').toFixed(2));
    G().setTemperatureEau(26);
    G().setHeure(12);
    const midiChaud = G().getFacteurTouche('carpe');
    G().setHeure(6);
    const aubeChaude = G().getFacteurTouche('carpe');
    check('eau chaude : la pêche est meilleure à l’aube qu’à midi', aubeChaude < midiChaud * 0.6,
        aubeChaude.toFixed(2) + ' contre ' + midiChaud.toFixed(2));
    G().setTemperatureEau(15);
    G().setHeure(12);
    checkClose('15 °C : facteur neutre (le harnais le pose avant chaque scénario)', G().getFacteurTouche('carpe'),
        facteurHoraire(12, false) * facteurPression(1013, 0), 1e-9);

    // Effet RÉEL sur le délai du bouchon : 1er signal ∈ [3 ; 8] × facteur, à froid comme en tempéré.
    let premiersBornes = true;
    [4, 15].forEach(function (t) {
        G().setTemperatureEau(t);
        G().setGraine(9100 + t);
        resetToIdle();
        clearLilyPads();
        castTo(POINT.x, POINT.z);
        const poisson = forceBite(false);
        const f = G().getFacteurTouche(poisson.userData.comp);
        const sink = G().etat.biteSinkAt;
        if (sink < 1.5 * f - 1e-6 || sink > 4 * f + 1e-6) { premiersBornes = false; }
    });
    check('en jeu, le délai du 1er signal reste dans [1,5 ; 4] × facteur (froid et tempéré)', premiersBornes);
    resetToIdle();
    G().setTemperatureEau(15);

    // --- 4) Température qui évolue : jour / nuit, saison, météo, sans à-coup ----------
    G().setTemperatureEau(null);
    G().setSaison('été');
    G().setMeteo('beau');
    G().setHeure(4);
    laisserTiedir();
    const nuitEte = G().getTemperatureEau();
    G().setHeure(16);
    laisserTiedir();
    const jourEte = G().getTemperatureEau();
    check('la température MONTE le jour (16 h) et DESCEND la nuit (4 h)', jourEte > nuitEte + 2,
        jourEte.toFixed(1) + ' °C contre ' + nuitEte.toFixed(1) + ' °C');
    G().setSaison('hiver');
    G().setHeure(16);
    laisserTiedir();
    const jourHiver = G().getTemperatureEau();
    check('été > hiver (à la même heure)', jourEte > jourHiver + 15,
        jourEte.toFixed(1) + ' °C contre ' + jourHiver.toFixed(1) + ' °C');
    check('l’eau d’été ≈ 25 °C, celle d’hiver ≈ 4 °C', Math.abs(jourEte - 25.5) < 0.3 && Math.abs(jourHiver - 4.5) < 0.3,
        jourEte.toFixed(1) + ' / ' + jourHiver.toFixed(1));
    G().setSaison('été');
    G().setHeure(16);
    G().setMeteo('pluie');
    laisserTiedir();
    check('la pluie refroidit l’eau', G().getTemperatureEau() < jourEte - 0.8,
        G().getTemperatureEau().toFixed(1) + ' °C contre ' + jourEte.toFixed(1) + ' °C');
    G().setMeteo('beau');

    // Évolution sans à-coup : l’heure avance de 4 h à 16 h, l’eau suit en douceur.
    G().setSaison('été');
    G().setHeure(4);
    laisserTiedir();
    G().setHeure(null);
    let precedent = G().getTemperatureEau();
    let plusGrandPas = 0;
    let montee = true;
    for (let i = 0; i < 2100; i++) {              // 210 s de jeu = 12 h
        step(0.1);
        const t = G().getTemperatureEau();
        plusGrandPas = Math.max(plusGrandPas, Math.abs(t - precedent));
        if (t < precedent - 0.01) { montee = false; }
        precedent = t;
    }
    check('la température évolue sans à-coup (plus grand pas < 0,05 °C par 0,1 s)', plusGrandPas < 0.05,
        plusGrandPas.toFixed(4) + ' °C');
    check('de 4 h à 16 h, l’eau ne fait que se réchauffer', montee);
    check('… et finit plus chaude qu’au départ', precedent > nuitEte + 1.5,
        precedent.toFixed(1) + ' °C contre ' + nuitEte.toFixed(1) + ' °C');

    // Les saisons défilent avec les jours de jeu : mi-printemps → été en 0,125 an = 420 s.
    G().setSaison('printemps');
    G().setSaison(null);
    G().setHeure(null);
    checkEqual('départ : printemps', G().getSaison(), 'printemps');
    stepFor(380, 0.5);
    checkEqual('après 380 s de jeu : toujours le printemps', G().getSaison(), 'printemps');
    stepFor(60, 0.5);
    checkEqual('après 440 s de jeu (> 0,125 an) : l’été', G().getSaison(), 'été');

    // --- 5) Thermocline : présente en été, absente en hiver ----------------------------
    G().setTemperatureEau(null);
    G().setHeure(12);
    G().setMeteo('beau');
    G().setSaison('été');
    step(0.1);
    const ete = G().getThermocline();
    check('été : thermocline présente', ete.actif === true);
    check('été : profondeur ∈ [1,4 ; 2,0] m (2,8 à 4,0 unités)', ete.profondeur >= 2.8 && ete.profondeur <= 4.0,
        ete.profondeur.toFixed(2) + ' unités');
    check('été : intensité maximale', ete.intensite > 0.99);
    check('été : eau chaude en surface, froide au fond (écart ≥ 10 °C)', ete.tSurface - ete.tFond >= 10,
        ete.tSurface.toFixed(1) + ' → ' + ete.tFond.toFixed(1));
    check('été : la température tombe de part et d’autre de la thermocline',
        G().getTemperatureEnProfondeur(ete.profondeur - 1.2) > G().getTemperatureEnProfondeur(ete.profondeur + 1.2) + 8);
    G().setSaison('hiver');
    step(0.1);
    const hiver = G().getThermocline();
    check('hiver : pas de thermocline (eau brassée)', hiver.actif === false && hiver.profondeur === 0);
    check('hiver : même température à toute profondeur',
        G().getTemperatureEnProfondeur(1) === G().getTemperatureEnProfondeur(7));
    ['printemps', 'automne'].forEach(function (saison) {
        G().setSaison(saison);
        step(0.1);
        check(saison + ' (mi-saison, ≈ 13,5 °C) : eau brassée', G().getThermocline().actif === false);
    });
    check('le seuil d’existence de la thermocline est bas mais non nul', SEUIL_THERMOCLINE > 0 && SEUIL_THERMOCLINE < 0.3);

    // --- 6) Les poissons se tiennent juste au-dessus de la thermocline (été) -----------
    G().setSaison('été');
    G().setTemperatureEau(22);                       // chaud sans excès : la thermocline est à fond
    G().setHeure(12);
    step(0.1);
    const plafond = G().getThermocline().plafondPoisson;
    check('le plafond des poissons est 0,3 unité au-dessus de la thermocline',
        Math.abs(plafond - (-G().getThermocline().profondeur + MARGE_THERMOCLINE)) < 1e-9);
    // Une carpe (espèce de fond) au fond de la plus grande fosse, et un poisson de mi-eau « naturellement » profond.
    const fosse = G().getEtangInfo().fosses.slice().sort(function (a, b) { return b.rayon - a.rayon; })[0];
    const libres = poissonsLibres();
    const carpeTest = libres.find(function (f) { return f.userData.couche === 'fond'; });
    const midTest = libres.filter(function (f) { return f.userData.couche !== 'fond'; })[0];
    const fondFosse = G().fondY(fosse.x, fosse.z);
    check('la fosse descend bien sous la thermocline', fondFosse < plafond - 1, fondFosse.toFixed(2));
    [carpeTest, midTest].forEach(function (f) {
        f.position.set(fosse.x, fondFosse + 0.45, fosse.z);
        f.userData.homeX = fosse.x;
        f.userData.homeZ = fosse.z;
        f.userData.homeRadius = 20;
        f.userData.vx = 0;
        f.userData.vz = 0;
        f.userData.depth = fondFosse + 0.45;
        f.userData.profNat = undefined;      // placé à la main : on oublie la couche naturelle d'avant
    });
    midTest.userData.couche = 'mi-eau';
    const depuis = midTest.userData.depth;
    stepFor(8, 1 / 20);
    const attendu = Math.max(G().fondY(carpeTest.position.x, carpeTest.position.z) + 0.45, plafond);
    check('une espèce de fond se tient AU-DESSUS de la thermocline en été (au fond de la fosse)',
        Math.abs(carpeTest.userData.depth - attendu) < 0.3 && carpeTest.userData.depth >= plafond - 0.15,
        carpeTest.userData.depth.toFixed(2) + ' pour un plafond à ' + plafond.toFixed(2) + ' (attendu ' + attendu.toFixed(2) + ')');
    check('un poisson de mi-eau trop profond remonte aussi', midTest.userData.depth >= plafond - 0.15,
        midTest.userData.depth.toFixed(2) + ' (parti de ' + depuis.toFixed(2) + ')');
    let sousLaThermocline = 0;
    poissonsLibres().forEach(function (f) {
        if (f.userData.depth < plafond - 0.2) { sousLaThermocline++; }
    });
    checkEqual('aucun poisson libre ne nage sous la thermocline', sousLaThermocline, 0);
    // Un poisson ne descend pas plus bas que le fond réel : sur un haut-fond, il reste sur le relief.
    const hautFond = G().fishes.find(function (f) { return f.userData.couche === 'fond' && f.userData.depth > plafond + 0.5; });
    check('sur un haut-fond (au-dessus de la thermocline) le poisson de fond reste collé au relief',
        !hautFond || Math.abs(hautFond.userData.depth - (G().fondY(hautFond.position.x, hautFond.position.z) + 0.45)) < 0.6);

    // En hiver l'eau est brassée : le poisson de mi-eau retrouve sa couche, celui du fond le relief.
    G().setSaison('hiver');
    G().setTemperatureEau(null);
    step(0.1);
    stepFor(8, 1 / 20);
    check('hiver : le poisson de mi-eau retrouve sa profondeur naturelle', Math.abs(midTest.userData.depth - depuis) < 0.1,
        midTest.userData.depth.toFixed(2) + ' contre ' + depuis.toFixed(2));
    check('hiver : le poisson de fond retourne au fond de la fosse',
        carpeTest.userData.depth < plafond - 1, carpeTest.userData.depth.toFixed(2));

    // L'hameçon : en été, un poisson de fond ne mord qu'au niveau de la thermocline (fosse) ; en hiver, au fond.
    function hameconMord(fish, profondeurHamecon) {
        G().floatGroup.position.set(fosse.x, 0.1, fosse.z);
        G().etat.HOOK_DEPTH = -profondeurHamecon;
        return G().etat.hameconDansZone(fish.userData, fish.userData.profondeurZone);
    }
    carpeTest.userData.couche = 'fond';
    G().setSaison('été');
    G().setTemperatureEau(22);
    step(0.1);
    const profTc = G().getThermocline().profondeur;
    check('été, fosse : l’hameçon à la thermocline fait mordre le poisson de fond', hameconMord(carpeTest, profTc) === true);
    check('été, fosse : l’hameçon au fond de la fosse (sous la thermocline) ne fait rien',
        hameconMord(carpeTest, -fondFosse - 0.2) === false);
    G().setSaison('hiver');
    G().setTemperatureEau(null);
    step(0.1);
    check('hiver, fosse : l’hameçon au fond fait mordre', hameconMord(carpeTest, -fondFosse - 0.2) === true);
    check('hiver, fosse : l’hameçon à mi-hauteur ne fait rien', hameconMord(carpeTest, profTc) === false);
    // Esche : la couche « fond » suit la thermocline (même fonction pour les deux).
    G().setSaison('été');
    G().setTemperatureEau(22);
    step(0.1);
    check('été : la profondeur utile à l’esche est bornée par la thermocline',
        Math.abs(G().etat.profondeurUtile(8) - (G().getThermocline().profondeur - MARGE_THERMOCLINE + 0.45)) < 1e-9);
    checkEqual('été, sur un haut-fond : la profondeur utile est le fond réel', G().etat.profondeurUtile(2), 2);
    G().setSaison('hiver');
    G().setTemperatureEau(null);
    step(0.1);
    checkEqual('hiver : la profondeur utile est toujours le fond réel', G().etat.profondeurUtile(8), 8);

    // --- 7) Eau chaude (> 22 °C) : les poissons se tiennent plus bas ---------------------
    G().setSaison('été');
    const libresChaud = poissonsLibres().filter(function (f) { return f.userData.couche !== 'fond'; });
    libresChaud.forEach(function (f) { f.userData.depth = -1.0; f.userData.profNat = undefined; });
    G().setTemperatureEau(18);
    stepFor(8, 1 / 20);
    const moyenneTiede = moyenne(libresChaud.map(function (f) { return f.userData.depth; }));
    G().setTemperatureEau(26);
    stepFor(8, 1 / 20);
    const moyenneChaude = moyenne(libresChaud.map(function (f) { return f.userData.depth; }));
    check('eau chaude : les poissons de mi-eau sont nettement plus bas qu’à 18 °C',
        moyenneChaude < moyenneTiede - 1,
        moyenneChaude.toFixed(2) + ' contre ' + moyenneTiede.toFixed(2));
    G().setTemperatureEau(15);
    stepFor(8, 1 / 20);
    check('l’eau redevient tempérée : ils remontent à leur couche', moyenne(libresChaud.map(function (f) {
        return f.userData.depth;
    })) > moyenneChaude + 1);

    // --- 8) Eau froide : léthargie (vitesse), carnassiers encore actifs ------------------
    G().setSaison('hiver');
    G().setTemperatureEau(4);
    check('froid : un paisible nage à moins de 70 % de sa vitesse', G().etat.vitaliteEau(COMPORTEMENTS.carpe) < 0.7);
    check('froid : un carnassier garde plus de 85 % de sa vitesse', G().etat.vitaliteEau(COMPORTEMENTS.brochet) > 0.85);
    G().setTemperatureEau(15);
    checkEqual('tempéré : vitesse normale', G().etat.vitaliteEau(COMPORTEMENTS.carpe), 1);

    // --- 9) Une seule source : simulation, widget de profondeur, carnet ------------------
    G().setSaison('été');
    G().setTemperatureEau(18);                       // thermocline à 3,4 unités : visible sur 3,98 unités d’eau
    G().setHeure(12);
    resetToIdle();
    clearLilyPads();
    castTo(POINT.x, POINT.z);
    stepFor(0.5);
    G().setProfondeur(G().etat.profondeurLigne);       // la coupe se redessine (5 fois par seconde dans le jeu)
    const tcJeu = G().getThermocline();
    const texte = G().getTexteEau();
    checkEqual('widget : la ligne « eau » est le texte du modèle', el('depthEau').textContent, texte);
    check('widget : saison, °C et thermocline y figurent',
        texte.indexOf('été') >= 0 && texte.indexOf('°C') >= 0 && texte.indexOf('thermocline à') >= 0, texte);
    check('widget : la profondeur écrite est celle de la simulation',
        texte.indexOf((tcJeu.profondeur / 2).toFixed(1).replace('.', ',') + ' m') >= 0, texte);
    checkEqual('widget : la bande de thermocline est visible', el('depthThermo').hidden, false);
    checkClose('widget : la bande est à la profondeur de la simulation (% de la coupe)',
        parseFloat(el('depthThermo').style.top), (tcJeu.profondeur / 9.2) * 100, 0.1);
    G().showJournal();
    check('carnet : il affiche le même texte', el('pondMap').innerHTML.indexOf(texte) >= 0, texte);
    // Les poissons nagent sous le plafond calculé par ce même objet.
    const plafondJeu = tcJeu.plafondPoisson;
    check('simulation : plafond des poissons = −profondeur + marge de CE même objet',
        Math.abs(plafondJeu - (-tcJeu.profondeur + MARGE_THERMOCLINE)) < 1e-9);
    G().setSaison('hiver');
    G().setTemperatureEau(null);
    stepFor(0.5);
    G().setProfondeur(G().etat.profondeurLigne);
    check('hiver : le widget dit « eau brassée » et cache la bande',
        el('depthEau').textContent.indexOf('eau brassée') >= 0 && el('depthThermo').hidden === true,
        el('depthEau').textContent);
    G().showJournal();
    check('hiver : le carnet dit aussi « eau brassée »', el('pondMap').innerHTML.indexOf('eau brassée') >= 0);
    resetToIdle();

    // --- 10) Déterminisme : lire la physique ne tire rien -------------------------------
    const graineAvant = G().getGraine();
    for (let i = 0; i < 20; i++) {
        G().getThermocline();
        G().getTexteEau();
        G().getTemperatureEnProfondeur(3);
        G().getFacteurTouche('carpe');
    }
    checkEqual('lire température et thermocline ne consomme aucun tirage', G().getGraine(), graineAvant);

    // Retour aux conditions neutres pour la suite.
    G().setSaison(null);
    G().setTemperatureEau(15);
    G().setMeteo('beau');
    G().setPression(1013, 0);
    G().setHeure(12);
    step(0.1);
}

export default run;

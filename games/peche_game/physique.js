// ---------------------------------------------------------------------------
// physique.js — PHYSIQUE DE L'EAU (idées.md §15.1) : heures actives, pression
// atmosphérique, saisons, température de l'eau et thermocline. Un SEUL calcul donne le
// facteur appliqué au délai de touche.
//
// Principe : le délai avant le premier signal du bouchon (3 à 8 s) est multiplié par
//     facteurTouche = limiter( facteur horaire × facteur de pression × facteur de température )
// 1 = comportement historique ; < 1 = le poisson mord plus vite ; > 1 = plus lentement.
// Tout est DÉTERMINISTE : aucun tirage de rand(), le facteur ne dépend que de l'heure de
// jeu, de la météo (donc de la pression), de la saison et de l'espèce.
// La thermocline (`etat.thermocline`) est la SEULE source de la couche d'eau chaude : la nage
// des poissons, le widget de profondeur et le carnet lisent la même valeur.
//
// Modèle pur (exporté, testable sans jeu) + système (`creerPhysique`) qui suit la
// pression image par image, écrit la ligne « heure · pression » du HUD et fournit les
// crochets de test (`crochets`, repris par script.js dans window.__game).
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=256';
import { COMPORTEMENTS } from './especes.js?v=256';

// ---------------------------------------------------------------------------
// Heure de jeu. dayPhase : 0 = aube, 0,25 = midi, 0,5 = crépuscule, 0,75 = nuit.
// L'aube est donc à 6 h, le midi à 12 h, le crépuscule à 18 h, minuit à 0 h.
// ---------------------------------------------------------------------------
export function heureDeJeu(dayPhase) {
    return (((6 + dayPhase * 24) % 24) + 24) % 24;
}

export function phaseDeHeure(heure) {
    return ((((heure - 6) / 24) % 1) + 1) % 1;
}

/** Lumière du jour, comme le cycle du ciel : 0 la nuit, 1 à midi (source unique : vue des poissons aussi). */
export function lumiere(heure) {
    return Math.max(0, Math.sin(((heure - 6) / 24) * Math.PI * 2));
}

/** Proximité de l'aube ou du crépuscule : 1 à 6 h et à 18 h, ≈ 0 à plus de 4 h de là. */
function crepuscule(heure) {
    const proche = Math.min(Math.abs(heure - 6), Math.abs(heure - 18));
    return Math.exp(-0.5 * (proche / 1.4) * (proche / 1.4));
}

/** Nom lisible de la période (affiché dans le HUD). */
export function periodeDeJournee(heure) {
    if (heure >= 4.5 && heure < 7.5) { return 'aube'; }
    if (heure >= 7.5 && heure < 11) { return 'matin'; }
    if (heure >= 11 && heure < 14) { return 'midi'; }
    if (heure >= 14 && heure < 16.5) { return 'après-midi'; }
    if (heure >= 16.5 && heure < 19.5) { return 'crépuscule'; }
    return 'nuit';
}

/** « 6 h 30 » (arrondi à 10 minutes : le texte ne tremble pas). */
export function texteHeure(heure) {
    let total = Math.round(heure * 6) % 144;       // dixièmes d'heure → pas de 10 minutes
    if (total < 0) { total += 144; }
    const h = Math.floor(total / 6);
    const m = (total % 6) * 10;
    return h + ' h ' + (m < 10 ? '0' + m : m);
}

// ---------------------------------------------------------------------------
// Facteur horaire. Activité a ∈ [0,30 ; 1] puis facteur = A_REF / a.
//   diurne   : 0,75 à midi (facteur 1,0), 1,0 à l'aube et au crépuscule (0,75), 0,30 la nuit (2,5).
//   nocturne : 0,75 la nuit (1,0), 1,0 à l'aube et au crépuscule (0,75), 0,30 à midi (2,5).
// Plancher d'activité 0,30 : le facteur ne dépasse jamais 2,5 (pas de division par ≈ 0).
// ---------------------------------------------------------------------------
export const A_REF = 0.75;
export const ACTIVITE_MIN = 0.30;   // activité minimale d'une période (midi = 1,0 neutre)

export function activiteHoraire(heure, nocturne) {
    const jour = lumiere(heure);
    const crep = crepuscule(heure);
    const a = nocturne
        ? ACTIVITE_MIN + 0.45 * (1 - jour) + 0.55 * crep
        : ACTIVITE_MIN + 0.45 * jour + 0.70 * crep;
    return Math.min(1, Math.max(ACTIVITE_MIN, a));
}

// v193 : la NUIT ne doit pas fermer la pêche. Le facteur horaire est plafonné à
// 1,8 (au lieu de 2,5 avec l'activité plancher) : midi reste neutre (× 1) et
// l'aube / le crépuscule restent favorables (× 0,75). Mesuré : nuit × 2,5
// donnait des premiers signaux à 16–44 s, ressentis comme « aucun poisson ».
export const FACTEUR_HORAIRE_MAX = 1.8;
export function facteurHoraire(heure, nocturne) {
    return Math.min(FACTEUR_HORAIRE_MAX, A_REF / activiteHoraire(heure, nocturne));
}

// ---------------------------------------------------------------------------
// Pression atmosphérique, dérivée de la météo (beau → rafales → pluie → beau) :
//   beau 1022 hPa (haute pression), rafales 1004 (elle chute : l'orage arrive),
//   pluie 998, puis elle REMONTE au retour du beau temps.
// La pression rejoint sa cible avec une constante de temps TAU_PRESSION (secondes de jeu).
// La TENDANCE (-1 chute rapide … +1 hausse rapide) est la vitesse de variation, lissée.
// ---------------------------------------------------------------------------
export const PRESSION_CIBLE = { beau: 1022, rafales: 1004, pluie: 998 };
export const PRESSION_NORMALE = 1013;
export const TAU_PRESSION = 14;
const VITESSE_MAX = 1.0;          // hPa par seconde de jeu = tendance 1

export function limiter(x, mini, maxi) {
    return Math.min(maxi, Math.max(mini, x));
}

/**
 * Facteur de pression : hausse = poissons actifs (jusqu'à × 0,65), chute = pêche fermée
 * (jusqu'à × 2,2), puis un léger effet de niveau (basse pression = un peu plus lent).
 */
export function facteurPression(pression, tendance) {
    const t = limiter(tendance, -1, 1);
    const selonTendance = t >= 0 ? 1 - 0.35 * t : 1 + 1.2 * (-t);
    const niveau = limiter(1 + (PRESSION_NORMALE - pression) / 150, 0.9, 1.2);
    return selonTendance * niveau;
}

/** Le facteur total reste dans une fourchette sûre (jamais ≈ 0, jamais interminable). */
export const FACTEUR_MIN = 0.5;
export const FACTEUR_MAX = 3.5;    // v193 : 6 -> 3,5 (jamais de désert)
export function limiterFacteur(f) {
    return limiter(f, FACTEUR_MIN, FACTEUR_MAX);
}

/** Flèche de tendance : ↗ monte, ↘ chute, → stable. */
export function flecheTendance(tendance) {
    if (tendance > 0.25) { return '↗'; }
    if (tendance < -0.25) { return '↘'; }
    return '→';
}


// ---------------------------------------------------------------------------
// SAISONS ET TEMPÉRATURE DE L'EAU (étape B).
// L'année dure 4 saisons × JOURS_PAR_SAISON jours de jeu (1 jour = DAY_LENGTH s, 420 s) :
// 2 jours = 14 min par saison, 56 min par année. anneePhase : 0 = début du printemps.
// ---------------------------------------------------------------------------
export const SAISONS = ['printemps', 'été', 'automne', 'hiver'];
export const JOURS_PAR_SAISON = 2;
export const DEPART_ANNEE = 0.12;            // on commence au printemps (eau tempérée)
export const MILIEU_SAISON = [0.125, 0.375, 0.625, 0.875];

export function saisonDe(anneePhase) {
    return Math.floor((((anneePhase % 1) + 1) % 1) * 4);
}

/** Température moyenne de l'eau de surface : 13,5 °C ± 10,5 (≈ 24 °C à la mi-été, ≈ 3 °C à la mi-hiver). */
export function temperatureSaison(anneePhase) {
    return 13.5 + 10.5 * Math.cos((anneePhase - 0.375) * Math.PI * 2);
}

/** Écart du jour : ± 1,5 °C, maximum à 16 h, minimum à 4 h. */
export function temperatureJour(heure) {
    return 1.5 * Math.cos(((heure - 16) / 24) * Math.PI * 2);
}

/** Écart de la météo : les rafales brassent l'eau (− 0,5), la pluie la refroidit (− 1,2). */
export const CORRECTION_METEO = { beau: 0, rafales: -0.5, pluie: -1.2 };

export function temperatureCible(anneePhase, heure, meteo) {
    return limiter(temperatureSaison(anneePhase) + temperatureJour(heure) + (CORRECTION_METEO[meteo] || 0), 0.5, 30);
}
export const TAU_EAU = 35;                    // inertie de l'eau (secondes de jeu) : pas d'à-coup

// Thermocline : eau chaude en surface, froide en profondeur, séparées par une couche étroite.
// Elle n'existe qu'en eau chaude (intensité 0 sous 15 °C, 1 à 21 °C et plus) : en automne et en
// hiver l'eau est brassée. Profondeurs en unités sous la surface (2 unités = 1 m).
export const T_MELANGE = 15;
export const T_STRATIFIEE = 21;
export const TEMPERATURE_FOND_ETE = 9;
export const SEUIL_THERMOCLINE = 0.1;
export function intensiteThermocline(temperatureRef) {
    return limiter((temperatureRef - T_MELANGE) / (T_STRATIFIEE - T_MELANGE), 0, 1);
}
export function profondeurThermocline(intensite) {
    return 2.8 + 1.2 * intensite;
}
/** Poisson : il se tient juste au-dessus de la thermocline (dos à 0,3 unité au-dessus). */
export const MARGE_THERMOCLINE = 0.3;
export const MARGE_FOND_POISSON = 0.45;       // un poisson de fond nage à 0,45 unité du relief (comportement.js)
const LARGEUR_THERMOCLINE = 0.6;

function lisse(x) {
    const t = limiter(x, 0, 1);
    return t * t * (3 - 2 * t);
}

/** Température à la profondeur z (unités, positive vers le bas). */
export function temperatureEnProfondeur(tSurface, thermocline, z) {
    if (!thermocline || !thermocline.actif) { return tSurface; }
    const tFond = Math.min(tSurface, TEMPERATURE_FOND_ETE);
    const k = lisse((z - thermocline.profondeur + LARGEUR_THERMOCLINE) / (2 * LARGEUR_THERMOCLINE));
    return tSurface - (tSurface - tFond) * thermocline.intensite * k;
}

/**
 * Facteur de température sur le délai de touche (se MULTIPLIE aux facteurs d'heure et de pression).
 *  - eau froide (< 8 °C) : léthargie, × 1 + 1,5 L (L = 0 à 8 °C, 1 à 2 °C) ; les carnassiers
 *    (comp.carnassier) restent actifs : × 1 + 0,3 L ;
 *  - eau chaude (> 22 °C) : les poissons restent au fond, la touche se mérite à midi (× 1 + 0,8 C) et
 *    se récompense à l'aube et au crépuscule (× 1 − 0,2 C), C = 0 à 22 °C, 1 à 26 °C.
 */
export function facteurTemperature(tSurface, comp, heure) {
    const froid = limiter((8 - tSurface) / 6, 0, 1);
    const chaud = limiter((tSurface - 22) / 4, 0, 1);
    const crep = crepuscule(heure);
    const lethargie = 1 + (comp && comp.carnassier ? 0.3 : 1.5) * froid;
    return lethargie * (1 + 0.8 * chaud * (1 - crep) - 0.2 * chaud * crep);
}

/** Facteur du DÉLAI de touche (source unique, chanceTouche.js) : heure × pression × température, borné. */
export function facteurDelai(heure, pression, tendance, tSurface, comp) {
    return limiterFacteur(facteurHoraire(heure, !!(comp && comp.nocturne))
        * facteurPression(pression, tendance) * facteurTemperature(tSurface, comp, heure));
}

/** Thermocline d'une eau (tRef : température qui fixe la stratification, tSurface : celle de surface). */
export function thermoclinePour(tRef, tSurface) {
    const intensite = intensiteThermocline(tRef);
    const actif = intensite >= SEUIL_THERMOCLINE;
    const profondeur = actif ? profondeurThermocline(intensite) : 0;
    const th = { actif: actif, profondeur: profondeur, intensite: intensite,
        plafondPoisson: actif ? -profondeur + MARGE_THERMOCLINE : -Infinity, tSurface: tSurface, tFond: 0 };
    th.tFond = temperatureEnProfondeur(tSurface, th, 99);
    return th;
}
/** Un poisson de fond / une couche d'eau ne descend pas sous la thermocline (y négatif). */
export function plancherSous(y, th) {
    return th && th.actif ? Math.max(y, th.plafondPoisson) : y;
}
/** Tranche d'eau d'une espèce, remontée au-dessus de la thermocline (zone[0] = le plus profond). */
export function zoneSous(zone, th) {
    if (!zone || !th || !th.actif || zone[0] >= th.plafondPoisson) { return zone; }
    return [th.plafondPoisson - 0.2, Math.max(zone[1], th.plafondPoisson + 0.2)];
}
/** Profondeur d'eau « utile » pour l'esche : la thermocline fait office de fond pour les poissons. */
export function profondeurUtileSous(profondeurEau, th) {
    return th && th.actif
        ? Math.min(profondeurEau, th.profondeur - MARGE_THERMOCLINE + MARGE_FOND_POISSON)
        : profondeurEau;
}

/** Vitalité de nage (vitesse × v) : l'eau froide ralentit, surtout les paisibles. 1 = normale. */
export function vitaliteThermique(tSurface, comp) {
    const froid = limiter((8 - tSurface) / 6, 0, 1);
    return 1 - (comp && comp.carnassier ? 0.15 : 0.55) * froid;
}

/** Texte lu à l'identique dans le widget de profondeur et dans le carnet. */
export function texteEauPour(saison, tSurface, thermocline) {
    return '🌡 ' + SAISONS[saison] + ' · eau ' + tSurface.toFixed(1).replace('.', ',') + ' °C · '
        + (thermocline.actif
            ? 'thermocline à ' + (thermocline.profondeur / 2).toFixed(1).replace('.', ',') + ' m'
            : 'eau brassée (pas de thermocline)');
}

// ---------------------------------------------------------------------------
// Système
// ---------------------------------------------------------------------------
export function creerPhysique(deps) {
    const { weatherName, setWeather, hud, hudEau, dureeJour } = deps;

    // Pression et tendance réelles (suivent la météo) ; les valeurs « imposées » (tests) les remplacent.
    let pression = PRESSION_CIBLE[weatherName()] || PRESSION_NORMALE;
    let tendance = 0;
    let pressionImposee = null;
    let tendanceImposee = 0;
    let dernierTexte = '';
    let dernierTexteEau = '';

    // Année, température de l'eau (inertie TAU_EAU) et thermocline (objet UNIQUE, modifié sur place).
    let anneePhase = DEPART_ANNEE;
    let saisonImposee = false;
    let temperatureImposee = null;
    const dureeAnnee = (dureeJour || 420) * JOURS_PAR_SAISON * 4;
    const thermocline = { actif: false, profondeur: 0, intensite: 0, plafondPoisson: 0, tSurface: 0, tFond: 0 };
    etat.thermocline = thermocline;

    function heure() { return heureDeJeu(etat.dayPhase); }
    function pressionActuelle() { return pressionImposee === null ? pression : pressionImposee; }
    function tendanceActuelle() { return pressionImposee === null ? tendance : tendanceImposee; }

    let tEau = temperatureCible(anneePhase, 12, weatherName());
    function temperatureEau() { return temperatureImposee === null ? tEau : temperatureImposee; }

    /** Facteur appliqué au délai de touche d'un poisson (comp = COMPORTEMENTS[espèce]). */
    function facteurTouche(comp) {
        return facteurDelai(heure(), pressionActuelle(), tendanceActuelle(), temperatureEau(), comp);
    }
    etat.facteurTouche = facteurTouche;

    // --- Thermocline : l'unique source de la couche d'eau chaude -------------------------------
    // La stratification suit la saison (ou la température imposée), jamais l'écart du jour : elle
    // ne bouge donc pas d'un tour de cadran à l'autre.
    function majThermocline() {
        const tRef = temperatureImposee === null ? temperatureSaison(anneePhase) : temperatureImposee;
        Object.assign(thermocline, thermoclinePour(tRef, temperatureEau()));   // objet UNIQUE, modifié sur place
    }

    /** Un poisson de fond / une couche d'eau ne descend pas sous la thermocline. */
    etat.plancherPoisson = function (y) { return plancherSous(y, thermocline); };
    /** Profondeur voulue pour le dos d'un poisson dont la profondeur naturelle est yNat (négative). */
    etat.profondeurPhysique = function (yNat) {
        if (!thermocline.actif) { return yNat; }
        const chaleur = limiter((temperatureEau() - 22) / 4, 0, 1);        // eau chaude : au plus bas permis
        const y = yNat + (thermocline.plafondPoisson - yNat) * chaleur * (yNat > thermocline.plafondPoisson ? 1 : 0);
        return Math.max(y, thermocline.plafondPoisson);
    };
    /** Tranche d'eau d'une espèce, remontée au-dessus de la thermocline (zone[0] = le plus profond). */
    etat.zoneUtile = function (zone) { return zoneSous(zone, thermocline); };
    /** Profondeur d'eau « utile » pour l'esche : la thermocline fait office de fond pour les poissons. */
    etat.profondeurUtile = function (profondeurEau) { return profondeurUtileSous(profondeurEau, thermocline); };
    etat.vitaliteEau = function (comp) { return vitaliteThermique(temperatureEau(), comp); };

    function texteEau() {
        return texteEauPour(saisonDe(anneePhase), temperatureEau(), thermocline);
    }
    etat.texteEau = texteEau;

    function texteConditions() {
        const h = heure();
        return '🕒 ' + texteHeure(h) + ' · ' + periodeDeJournee(h) + ' · '
            + Math.round(pressionActuelle()) + ' hPa ' + flecheTendance(tendanceActuelle());
    }

    function majPhysique(dt) {
        if (pressionImposee === null) {
            const cible = PRESSION_CIBLE[weatherName()] || PRESSION_NORMALE;
            const ecart = cible - pression;
            const brute = limiter(ecart / TAU_PRESSION / VITESSE_MAX, -1, 1);
            pression += ecart * (1 - Math.exp(-dt / TAU_PRESSION));
            tendance += (brute - tendance) * Math.min(1, dt / 4);    // lissage : pas d'à-coup
        }
        // L'année avance avec les jours : horloge gelée (tests), saison gelée = rien ne bouge.
        if (!etat.horlogeGelee && !saisonImposee) {
            anneePhase = (anneePhase + dt / dureeAnnee) % 1;
        }
        const cibleEau = temperatureCible(anneePhase, heure(), weatherName());
        tEau += (cibleEau - tEau) * (1 - Math.exp(-dt / TAU_EAU));
        majThermocline();
        if (hud) {
            const texte = texteConditions();
            if (texte !== dernierTexte) {
                dernierTexte = texte;
                hud.textContent = texte;
            }
        }
        if (hudEau) {
            const texte = texteEau();
            if (texte !== dernierTexteEau) {
                dernierTexteEau = texte;
                hudEau.textContent = texte;
            }
        }
    }
    majThermocline();

    // Crochets de test (repris dans window.__game par script.js) : l'heure, la météo, la pression,
    // la saison et la température deviennent pilotables ; les scénarios n'ont plus à attendre.
    const crochets = {
        /** Impose l'heure de jeu (0–24) et ARRÊTE l'horloge ; setHeure(null) la relance. */
        setHeure: function (h) {
            if (h === null || h === undefined) {
                etat.horlogeGelee = false;
                return heure();
            }
            etat.dayPhase = phaseDeHeure(Number(h));
            etat.horlogeGelee = true;
            return heure();
        },
        getHeure: heure,
        /** Impose la météo et arrête son cycle ; la pression, elle, évolue ensuite normalement. */
        setMeteo: function (id) {
            setWeather(id);
            etat.meteoGelee = true;
            return weatherName();
        },
        /** setPression(p, tendance = 0) fige pression ET tendance ; setPression(null) rend la main à la météo. */
        setPression: function (p, t) {
            if (p === null || p === undefined) {
                pressionImposee = null;
                return pression;
            }
            pressionImposee = Number(p);
            tendanceImposee = limiter(Number(t) || 0, -1, 1);
            return pressionImposee;
        },
        getPression: pressionActuelle,
        getTendancePression: tendanceActuelle,
        /** Facteur du délai de touche : un id d'espèce (« sandre ») ou un profil ; diurne par défaut. */
        getFacteurTouche: function (espece) {
            return facteurTouche(typeof espece === 'string' ? COMPORTEMENTS[espece] : espece);
        },
        getTexteConditions: texteConditions,
        /** Impose la saison (milieu de saison, année gelée) ; setSaison(null) relance l'année. */
        setSaison: function (nom) {
            if (nom === null || nom === undefined) {
                saisonImposee = false;
                return SAISONS[saisonDe(anneePhase)];
            }
            const i = SAISONS.indexOf(String(nom).replace('ete', 'été'));
            if (i < 0) { throw new Error('saison inconnue : ' + nom); }
            anneePhase = MILIEU_SAISON[i];
            saisonImposee = true;
            tEau = temperatureCible(anneePhase, heure(), weatherName());   // l'eau a eu le temps de suivre
            majThermocline();
            return SAISONS[i];
        },
        getSaison: function () { return SAISONS[saisonDe(anneePhase)]; },
        /** Impose la température de surface (°C) ; setTemperatureEau(null) rend la main au modèle. */
        setTemperatureEau: function (t) {
            temperatureImposee = (t === null || t === undefined) ? null : Number(t);
            majThermocline();
            return temperatureEau();
        },
        getTemperatureEau: temperatureEau,
        /** Température cible du modèle (saison + heure + météo), sans l'inertie. */
        getTemperatureCible: function () { return temperatureCible(anneePhase, heure(), weatherName()); },
        getThermocline: function () { return Object.assign({}, thermocline); },
        getTemperatureEnProfondeur: function (z) { return temperatureEnProfondeur(temperatureEau(), thermocline, z); },
        getTexteEau: texteEau
    };

    return { majPhysique, facteurTouche, texteConditions, texteEau, crochets };
}

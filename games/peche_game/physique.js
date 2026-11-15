// ---------------------------------------------------------------------------
// physique.js — PHYSIQUE DE L'EAU (idées.md §15.1) : heures actives et pression
// atmosphérique. Un SEUL calcul donne le facteur appliqué au délai de touche.
//
// Principe : le délai avant le premier signal du bouchon (3 à 8 s) est multiplié par
//     facteurTouche = limiter( facteur horaire × facteur de pression )
// 1 = comportement historique ; < 1 = le poisson mord plus vite ; > 1 = plus lentement.
// Tout est DÉTERMINISTE : aucun tirage de rand(), le facteur ne dépend que de l'heure de
// jeu, de la météo (donc de la pression) et de l'espèce (diurne ou nocturne).
//
// Modèle pur (exporté, testable sans jeu) + système (`creerPhysique`) qui suit la
// pression image par image, écrit la ligne « heure · pression » du HUD et fournit les
// crochets de test (`crochets`, repris par script.js dans window.__game).
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=145';
import { COMPORTEMENTS } from './especes.js?v=183';

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

/** Lumière du jour, comme le cycle du ciel : 0 la nuit, 1 à midi. */
function lumiere(heure) {
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
export const ACTIVITE_MIN = 0.30;

export function activiteHoraire(heure, nocturne) {
    const jour = lumiere(heure);
    const crep = crepuscule(heure);
    const a = nocturne
        ? ACTIVITE_MIN + 0.45 * (1 - jour) + 0.55 * crep
        : ACTIVITE_MIN + 0.45 * jour + 0.70 * crep;
    return Math.min(1, Math.max(ACTIVITE_MIN, a));
}

export function facteurHoraire(heure, nocturne) {
    return A_REF / activiteHoraire(heure, nocturne);
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
export const FACTEUR_MAX = 6;
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
// Système
// ---------------------------------------------------------------------------
export function creerPhysique(deps) {
    const { weatherName, setWeather, hud } = deps;

    // Pression et tendance réelles (suivent la météo) ; les valeurs « imposées » (tests) les remplacent.
    let pression = PRESSION_CIBLE[weatherName()] || PRESSION_NORMALE;
    let tendance = 0;
    let pressionImposee = null;
    let tendanceImposee = 0;
    let dernierTexte = '';

    function heure() { return heureDeJeu(etat.dayPhase); }
    function pressionActuelle() { return pressionImposee === null ? pression : pressionImposee; }
    function tendanceActuelle() { return pressionImposee === null ? tendance : tendanceImposee; }

    /** Facteur appliqué au délai de touche d'un poisson (comp = COMPORTEMENTS[espèce]). */
    function facteurTouche(comp) {
        const nocturne = !!(comp && comp.nocturne);
        return limiterFacteur(
            facteurHoraire(heure(), nocturne) * facteurPression(pressionActuelle(), tendanceActuelle()));
    }
    etat.facteurTouche = facteurTouche;

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
        if (hud) {
            const texte = texteConditions();
            if (texte !== dernierTexte) {
                dernierTexte = texte;
                hud.textContent = texte;
            }
        }
    }

    // Crochets de test (repris dans window.__game par script.js) : l'heure, la météo et la
    // pression deviennent pilotables ; les scénarios n'ont plus à attendre le bon moment.
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
        getTexteConditions: texteConditions
    };

    return { majPhysique, facteurTouche, texteConditions, crochets };
}

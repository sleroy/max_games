// ---------------------------------------------------------------------------
// conseilLocal.js — QUAND RIEN NE MORD, L'AVION APPORTE UN CONSEIL POUR CET ENDROIT (demande du joueur 2026-11-16).
//
// Bouchon à l'eau depuis DELAI[mode] secondes sans aucune touche : on regarde les poissons qui nagent à
// moins de RAYON unités du bouchon, et on cherche (avec evaluerTouche, la règle unique du jeu) l'esche et la
// profondeur de ligne qui leur donnent le plus de touches, sous le bouchon réel (profondeur d'eau, fond).
// La PROFONDEUR conseillée est la MOYENNE de la profondeur réelle des poissons proches (ceux que l'esche choisie
// attire), arrondie au pas du réglage et gardée au-dessus de la vase ; si cette moyenne tombe entre deux couches où
// rien ne mord (poissons très étagés), on retombe sur le milieu de la zone où ça mord (chanceTouche.ligneIdeale).
//  - FACILE : l'avion le dit franchement, espèces comprises : « Ici : 4 gardons, 1 carpe / Essaie 🍞 Pain à 0,5 m ».
//  - NORMAL : c'est Papa qui conseille, sans dévoiler ce qu'il y a sous l'eau : « Papa : essaie 🍞 Pain à 0,5 m ».
//  - DUR    : jamais (comme l'esche volée sans prévenir).
// Un conseil par lancer au plus, et au plus un toutes les INTERVALLE_MIN secondes de jeu.
//
// `recommander` est PUR (testable sans jeu) ; `creerConseilLocal` le déclenche et le confie à l'avion (avion.js).
// ⚠ Aucun `rand()`.
// ---------------------------------------------------------------------------
import { SPECIES } from './especes.js?v=241';
import { ESCHES } from './esches.js?v=241';
import { evaluerTouche, ligneQuiver, ligneIdeale } from './chanceTouche.js?v=241';

export const DELAI = { facile: 30, normal: 60 };   // secondes sans touche (pas d'entrée : jamais, mode Dur)
export const RAYON = 10;                            // unités (5 m) autour du bouchon
export const INTERVALLE_MIN = 180;                  // au plus un conseil toutes les 3 minutes
export const PAS_LIGNE = 0.25;                      // même pas que le réglage de profondeur du jeu
const BON_REGLAGE = 0.9;                            // le réglage actuel donne déjà 90 % du meilleur : « patience »
const MOYENNE_MIN = 0.5;                            // la moyenne doit donner au moins 50 % du meilleur score, sinon plateau
const GAIN_BOUCHON = 1.25;                          // un bouchon plus long ferait nettement mieux (× 1,25)

const metres = u => (Math.round(u / 2 * 10) / 10).toLocaleString('fr-FR') + ' m';   // au décimètre : lisible
function esche(id) { return ESCHES.find(e => e.id === id); }
function court(id) { const e = esche(id); return e ? e.icone + ' ' + e.nom.split(' / ')[0].replace(' de terre', '') : '🪝 Hameçon nu'; }
function nomPluriel(id, n) {
    const nom = (SPECIES.find(s => s.id === id) || { nom: id }).nom.toLowerCase();
    return n > 1 && !/s$/.test(nom) ? nom.replace(/^(\S+)/, '$1s') : nom;
}

// Touches attendues pour ces poissons avec ce réglage (somme des chances).
function score(poissons, base, escheId, ligne) {
    let total = 0;
    for (let i = 0; i < poissons.length; i++) {
        total += evaluerTouche(Object.assign({}, base, { especeId: poissons[i].especeId, longueurCm: poissons[i].longueurCm,
            esche: escheId, profondeurLigne: ligne })).chance;
    }
    return total;
}

/**
 * Meilleur réglage pour les poissons proches. Entrée :
 *   poissons [{ especeId, longueurCm, profondeur? }] (profondeur : y du dos du poisson, négatif, unités du jeu),
 *   profondeurEau, substrat, bornes [min, max] (bouchon équipé), quiver,
 *   escheActuelle (id | null), ligneActuelle, mode ('facile' | 'normal'), temperature, heure.
 * Optionnel : especesIds (les espèces du biotope ; défaut : toutes).
 * Sortie : { cas: 'personne' | 'impossible' | 'bon' | 'changer', esche, ligne, bouchonPlusLong, comptes, lignes: [l1, l2] }.
 */
export function recommander(c) {
    const facile = c.mode === 'facile';
    // `especesIds` (optionnel, défaut : toutes) : on ne conseille que les espèces du biotope.
    if (c.especesIds) { c = Object.assign({}, c, { poissons: c.poissons.filter(function (p) { return c.especesIds.indexOf(p.especeId) >= 0; }) }); }
    const comptes = {};
    c.poissons.forEach(p => { comptes[p.especeId] = (comptes[p.especeId] || 0) + 1; });
    const ici = Object.keys(comptes).sort((a, b) => comptes[b] - comptes[a]).slice(0, 2)
        .map(id => comptes[id] + ' ' + nomPluriel(id, comptes[id])).join(', ');
    const base = { profondeurEau: c.profondeurEau, substrat: c.substrat, quiver: !!c.quiver, mode: 'normal',
        temperature: c.temperature, heure: c.heure };
    const res = { cas: 'personne', esche: null, ligne: null, bouchonPlusLong: false, comptes: comptes, lignes: null };
    if (!c.poissons.length) {
        res.lignes = facile ? ['Ici : aucun poisson !', 'Lance ailleurs 🎣'] : ['Papa : il n’y a personne ici,', 'lance plus loin !'];
        return res;
    }
    // Lignes essayées : celles du bouchon équipé (au quiver, l'hameçon est posé au fond : une seule).
    const lignesDe = function (min, max) {
        const l = [];
        for (let u = Math.max(0.5, min); u <= max + 1e-9; u += PAS_LIGNE) { l.push(Math.round(u * 100) / 100); }
        return l;
    };
    const lignes = c.quiver ? [ligneQuiver(c.profondeurEau)] : lignesDe(c.bornes[0], c.bornes[1]);
    // Pour chaque esche : la ligne IDÉALE (milieu du plateau où ça mord), puis la meilleure esche.
    const idealeDe = (e, liste) => ligneIdeale(liste, l => score(c.poissons, base, e.id, l));
    let meilleur = { s: 0, esche: null, ligne: null };
    ESCHES.forEach(function (e) {
        const r = idealeDe(e, lignes);
        if (r.score > meilleur.s + 1e-9) { meilleur = { s: r.score, esche: e.id, ligne: r.ligne }; }
    });
    // Rien ne marche avec CE bouchon : un bouchon plus long (jusqu'à 7 unités) permettrait-il d'atteindre les poissons ?
    if (meilleur.s <= 0 && !c.quiver && c.bornes[1] < 7) {
        ESCHES.forEach(function (e) {
            const r = idealeDe(e, lignesDe(c.bornes[1] + PAS_LIGNE, 7));
            if (r.score > meilleur.s + 1e-9) { meilleur = { s: r.score, esche: e.id, ligne: r.ligne, plusLong: true }; }
        });
    }
    if (meilleur.s <= 0) {
        res.cas = 'impossible';
        res.lignes = facile ? ['Ici : ' + ici, 'Ils ne mordront pas ici : change d’endroit'] : ['Papa : ils ne mordront pas ici,', 'change d’endroit !'];
        return res;
    }
    res.esche = meilleur.esche;
    res.ligne = meilleur.ligne;
    res.source = 'plateau';
    res.bouchonPlusLong = !!meilleur.plusLong;
    // Profondeur MOYENNE des poissons que cette esche attire (là où ils nagent vraiment).
    if (!c.quiver && !res.bouchonPlusLong) {
        const attires = c.poissons.filter(p => typeof p.profondeur === 'number'
            && score([p], base, meilleur.esche, meilleur.ligne) > 0);
        if (attires.length) {
            const moyenne = -attires.reduce((t, p) => t + p.profondeur, 0) / attires.length;
            const plafond = ligneQuiver(c.profondeurEau);                    // jamais dans la vase
            const voulue = Math.min(moyenne, plafond);
            const ligne = lignes.reduce((m, l) => (Math.abs(l - voulue) < Math.abs(m - voulue) ? l : m), lignes[0]);
            // La profondeur est fixée sur la moyenne : on cherche ensuite la meilleure esche POUR CETTE profondeur
            // (un ver à 0,7 m flotte en surface, où il ne vaut presque rien : le pain y est bien meilleur).
            let aLaMoyenne = { s: 0, esche: null };
            ESCHES.forEach(function (e) {
                const s = score(c.poissons, base, e.id, ligne);
                if (s > aLaMoyenne.s + 1e-9) { aLaMoyenne = { s: s, esche: e.id }; }
            });
            if (ligne <= plafond + 1e-9 && aLaMoyenne.s >= meilleur.s * MOYENNE_MIN) {
                res.esche = aLaMoyenne.esche;
                meilleur = { s: aLaMoyenne.s, esche: aLaMoyenne.esche, ligne: ligne };
                res.ligne = ligne;
                res.source = 'moyenne';
                res.profondeurMoyenne = moyenne;
            }
        }
    }
    // Un bouchon plus long (jusqu'à 7 unités) ferait-il nettement mieux ?
    if (!res.bouchonPlusLong && !c.quiver && c.bornes[1] < 7) {
        res.bouchonPlusLong = idealeDe(esche(meilleur.esche), lignesDe(c.bornes[1] + PAS_LIGNE, 7)).score > meilleur.s * GAIN_BOUCHON;
    }
    const actuel = score(c.poissons, base, c.escheActuelle || null, c.quiver ? lignes[0] : c.ligneActuelle);
    if (actuel >= meilleur.s * BON_REGLAGE && !res.bouchonPlusLong) {
        res.cas = 'bon';
        // Même dans ce cas, on rappelle le réglage idéal : le joueur sait quoi garder.
        const garde = court(meilleur.esche) + (c.quiver ? ' au fond' : ' à ' + metres(res.ligne));
        res.lignes = facile ? ['Ici : ' + ici, 'Garde ' + garde + ', patience !'] : ['Papa : garde ' + garde + ',', 'sois patient !'];
        return res;
    }
    res.cas = 'changer';
    const reglage = court(meilleur.esche) + (c.quiver ? ' au fond' : ' à ' + metres(res.ligne));
    const fin = res.bouchonPlusLong ? ' (+ bouchon plus long)' : '';
    // « Là où ils nagent » : la profondeur vient de la moyenne des poissons proches.
    const pourquoi = res.bouchonPlusLong ? 'avec un bouchon plus long !'
        : (res.source === 'moyenne' ? 'c’est là que nagent les poissons !' : 'ça devrait mordre ici !');
    let tete = 'Ici : ' + ici + (res.source === 'moyenne' ? ' vers ' + metres(res.profondeurMoyenne) : '');
    if ([...tete].length > 45) { tete = 'Ici : ' + ici.split(', ')[0] + ' vers ' + metres(res.profondeurMoyenne); }
    res.lignes = facile ? [tete, 'Essaie ' + reglage + fin] : ['Papa : essaie ' + reglage, pourquoi];
    return res;
}

/**
 * Déclencheur (appelé à chaque image par vie.js). deps : avion, fishes(), floatGroup(), etat (lecture), contexte()
 * → { profondeurEau, substrat } sous le bouchon, bornes() du bouchon équipé, temperature(), heure().
 */
export function creerConseilLocal(deps) {
    const { avion, etat } = deps;
    let attente = 0;            // secondes à l'eau sans touche, pour CE lancer
    let lancer = -1;            // numéro du lancer suivi
    let dejaDonne = false;      // un conseil par lancer
    let depuisDernier = Infinity;
    let dernier = null;

    function mode() { return etat.modeFacile ? 'facile' : (etat.modeDifficulte || 'normal'); }

    function maj(dt) {
        depuisDernier += dt;
        if (etat.numeroLancer !== lancer) { lancer = etat.numeroLancer; attente = 0; dejaDonne = false; }
        if (etat.floatState === 'bite' || etat.floatState === 'struggle') { attente = 0; dejaDonne = true; return; }
        if (etat.floatState !== 'inWater') { return; }
        attente += dt;
        const delai = DELAI[mode()];
        if (delai === undefined || dejaDonne || attente < delai || depuisDernier < INTERVALLE_MIN) { return; }
        dernier = calculer();
        dejaDonne = true;
        depuisDernier = 0;
        avion.lancerMessage(dernier.lignes, 'conseil-local');
    }

    function calculer() {
        const b = deps.floatGroup().position;
        const poissons = deps.fishes().filter(function (f) {
            const d = f.userData;
            return !d.hooked && f !== etat.heldFish && Math.hypot(f.position.x - b.x, f.position.z - b.z) <= RAYON;
        }).map(function (f) { return { especeId: f.userData.especeId, longueurCm: f.userData.longueurCm, profondeur: f.userData.depth }; });
        const ici = deps.contexte();
        const e = etat.escheEquipee ? etat.escheEquipee() : null;
        return recommander({ poissons: poissons, profondeurEau: ici.profondeurEau, substrat: ici.substrat, bornes: deps.bornes(),
            quiver: !!(etat.modeQuiver && etat.modeQuiver.estActif()), escheActuelle: etat.escheVolee ? null : (e ? e.id : null),
            ligneActuelle: etat.profondeurLigne, mode: mode(), temperature: deps.temperature(), heure: deps.heure(),
            especesIds: deps.especesIds ? deps.especesIds() : undefined });
    }

    return { maj, calculer, attente: function () { return attente; }, dernier: function () { return dernier; },
        reinitialiserDelai: function () { depuisDernier = Infinity; } };
}

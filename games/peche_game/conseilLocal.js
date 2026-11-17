// ---------------------------------------------------------------------------
// conseilLocal.js — QUAND RIEN NE MORD, L'AVION APPORTE UN CONSEIL POUR CET ENDROIT (demande du joueur 2026-11-16).
//
// Bouchon à l'eau depuis DELAI[mode] secondes sans aucune touche : on regarde les poissons qui nagent à
// moins de RAYON unités du bouchon, et on cherche (avec evaluerTouche, la règle unique du jeu) l'esche et la
// profondeur de ligne qui leur donnent le plus de touches, sous le bouchon réel (profondeur d'eau, fond).
// La PROFONDEUR conseillée est TOUJOURS celle des poissons réellement détectés près du bouchon que l'esche
// intéresse : la moyenne de leur profondeur de nage, arrondie au pas du réglage, puis la ligne la plus proche de
// cette moyenne où ça mord encore. Elle ne descend jamais sous le fond (une ligne plus longue ne creuse rien) —
// sauf si l'eau est plus basse que le réglage mini du bouchon : là, l'hameçon repose forcément sur le fond.
//  - FACILE : l'avion le dit franchement, espèces comprises : « Ici : 4 gardons, 1 carpe vers 0,8 m / Pêche à 0,8 m · 🍞 Pain ».
//  - NORMAL : c'est Papa qui conseille, sans dévoiler ce qu'il y a sous l'eau : « Papa : pêche à 0,8 m · 🍞 Pain ».
//  - DUR    : jamais (comme l'esche volée sans prévenir).
// Un conseil par lancer au plus, et au plus un toutes les INTERVALLE_MIN secondes de jeu.
//
// `recommander` est PUR (testable sans jeu) ; `creerConseilLocal` le déclenche et le confie à l'avion (avion.js).
// ⚠ Aucun `rand()`.
// ---------------------------------------------------------------------------
import { SPECIES } from './especes.js?v=253';
import { ESCHES } from './esches.js?v=253';
import { evaluerTouche, ligneQuiver, ligneIdeale } from './chanceTouche.js?v=253';

export const DELAI = { facile: 30, normal: 60 };   // secondes sans touche (pas d'entrée : jamais, mode Dur)
export const RAYON = 10;                            // unités (5 m) autour du bouchon
export const INTERVALLE_MIN = 180;                  // au plus un conseil toutes les 3 minutes
export const PAS_LIGNE = 0.25;                      // même pas que le réglage de profondeur du jeu
const BON_REGLAGE = 0.9;                            // le réglage actuel donne déjà 90 % du meilleur : « patience »
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
 *   profondeurEau (obligatoire, > 0), substrat, bornes [min, max] (bouchon équipé), quiver,
 *   escheActuelle (id | null), ligneActuelle, mode ('facile' | 'normal'), temperature, heure.
 * Optionnel : especesIds (les espèces du biotope ; défaut : toutes).
 * Sortie : { cas: 'personne' | 'impossible' | 'bon' | 'changer', esche, ligne, source: 'plateau' | 'moyenne',
 *   profondeurMoyenne (source 'moyenne' : moyenne des poissons détectés qui a fixé la ligne), bouchonPlusLong,
 *   comptes, lignes: [l1, l2] }.
 */
export function recommander(c) {
    const facile = c.mode === 'facile';
    // Sans profondeur d'eau, la règle du fond n'a pas de sens : on refuse plutôt que de conseiller au hasard.
    if (!(c.profondeurEau > 0)) { throw new Error('recommander : profondeurEau manquante'); }
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
    // L'hameçon ne descend JAMAIS sous le fond : au-delà de la profondeur d'eau, une ligne plus longue ne
    // creuse rien (le conseil n'annonce plus « 2,6 m » dans 1,2 m d'eau, ni une ligne muette).
    const lignesDe = function (min, max) {
        const l = [];
        for (let u = Math.max(0.5, min); u <= max + 1e-9; u += PAS_LIGNE) { l.push(Math.round(u * 100) / 100); }
        return l;
    };
    const maxLigne = Math.min(c.bornes[1], Math.max(c.bornes[0], c.profondeurEau));
    const lignes = c.quiver ? [ligneQuiver(c.profondeurEau)] : lignesDe(c.bornes[0], maxLigne);
    if (!lignes.length) { lignes.push(Math.max(0.5, c.bornes[0])); }   // eau plus basse que le bouchon : une seule ligne possible
    // Lignes d'un bouchon plus long : utiles seulement si l'eau est plus profonde que ce bouchon.
    const lignesPlusLong = c.quiver || c.bornes[1] >= 7 ? []
        : lignesDe(c.bornes[1] + PAS_LIGNE, Math.min(7, c.profondeurEau));
    // Pour chaque esche : la ligne IDÉALE (milieu du plateau où ça mord), puis la meilleure esche.
    const idealeDe = (e, liste) => ligneIdeale(liste, l => score(c.poissons, base, e.id, l));
    let meilleur = { s: 0, esche: null, ligne: null };
    ESCHES.forEach(function (e) {
        const r = idealeDe(e, lignes);
        if (r.score > meilleur.s + 1e-9) { meilleur = { s: r.score, esche: e.id, ligne: r.ligne }; }
    });
    // Rien ne marche avec CE bouchon : un bouchon plus long (jusqu'à 7 unités) permettrait-il d'atteindre les poissons ?
    if (meilleur.s <= 0 && lignesPlusLong.length) {
        ESCHES.forEach(function (e) {
            const r = idealeDe(e, lignesPlusLong);
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
    // PROFONDEUR : celle des poissons RÉELLEMENT détectés près du bouchon que cette esche intéresse (leur
    // profondeur de nage, pas le milieu d'une zone abstraite). On garde ensuite la ligne la PLUS PROCHE de cette
    // moyenne où ça mord encore : le conseil est « pêche à la profondeur où ils sont », jamais une ligne muette.
    if (!c.quiver && !res.bouchonPlusLong) {
        const interesses = c.poissons.filter(p => Number.isFinite(p.profondeur)
            && lignes.some(l => score([p], base, meilleur.esche, l) > 0));
        if (interesses.length) {
            const moyenne = -interesses.reduce((t, p) => t + p.profondeur, 0) / interesses.length;
            const voulue = Math.min(moyenne, maxLigne);
            // Les lignes de touche de l'esche retenue, calculées UNE fois (le conseil tourne dans la boucle de jeu).
            const totaux = lignes.map(l => score(c.poissons, base, meilleur.esche, l));
            let ligne = null;
            let ecart = Infinity;
            lignes.forEach(function (l, i) {
                if (totaux[i] <= 0) { return; }
                if (Math.abs(l - voulue) < ecart - 1e-9) { ecart = Math.abs(l - voulue); ligne = l; }
            });
            if (ligne !== null) {
                // La profondeur est fixée sur la moyenne : on cherche ensuite la meilleure esche POUR CETTE profondeur
                // (un ver à 0,7 m flotte en surface, où il ne vaut presque rien : le pain y est bien meilleur).
                let aLaMoyenne = { s: 0, esche: null };
                ESCHES.forEach(function (e) {
                    const s = score(c.poissons, base, e.id, ligne);
                    if (s > aLaMoyenne.s + 1e-9) { aLaMoyenne = { s: s, esche: e.id }; }
                });
                if (aLaMoyenne.s > 0) {
                    res.esche = aLaMoyenne.esche;
                    meilleur = { s: aLaMoyenne.s, esche: aLaMoyenne.esche, ligne: ligne };
                    res.ligne = ligne;
                    res.source = 'moyenne';
                    res.profondeurMoyenne = moyenne;
                }
            }
        }
    }
    // Un bouchon plus long (jusqu'à 7 unités) ferait-il nettement mieux ?
    if (!res.bouchonPlusLong && lignesPlusLong.length) {
        res.bouchonPlusLong = idealeDe(esche(meilleur.esche), lignesPlusLong).score > meilleur.s * GAIN_BOUCHON;
    }
    // Où pêcher : la profondeur de ligne conseillée. Au quiver, l'hameçon est posé au fond : on donne la
    // profondeur RÉELLE de l'hameçon dans ce mode (ligneQuiver), pas un « au fond » muet.
    const ou = c.quiver ? 'au fond, ' + metres(ligneQuiver(c.profondeurEau)) : 'à ' + metres(res.ligne);
    const actuel = score(c.poissons, base, c.escheActuelle || null, c.quiver ? lignes[0] : c.ligneActuelle);
    if (actuel >= meilleur.s * BON_REGLAGE && !res.bouchonPlusLong) {
        res.cas = 'bon';
        // Même dans ce cas, on rappelle le réglage idéal : le joueur sait quoi garder.
        const garde = court(meilleur.esche) + ' ' + ou;
        res.lignes = facile ? ['Ici : ' + ici, 'Garde ' + garde + ', patience !'] : ['Papa : garde ' + garde + ',', 'sois patient !'];
        return res;
    }
    res.cas = 'changer';
    // Le conseil dit la profondeur d'abord, puis l'esche (et, en facile, les espèces de la ligne 1).
    const escheTxt = court(meilleur.esche);
    // « Là où ils nagent » : même profondeur que la ligne 2 (une seule vérité : res.ligne).
    const pourquoi = res.bouchonPlusLong ? 'avec un bouchon plus long !'
        : (res.source === 'moyenne' ? 'c’est là que nagent les poissons !' : 'ça devrait mordre ici !');
    const vers = res.source === 'moyenne' ? ' vers ' + metres(res.ligne) : '';
    const long = res.bouchonPlusLong ? ' · bouchon plus long' : '';
    const premiere = ici.split(', ')[0];
    let tete = 'Ici : ' + ici + vers + long;
    if ([...tete].length > 45) { tete = 'Ici : ' + premiere + long; }   // la 2e espèce et « vers » sautent
    if ([...tete].length > 45) { tete = 'Ici : ' + premiere; }
    res.lignes = facile ? [tete, 'Pêche ' + ou + ' · ' + escheTxt]
        : ['Papa : pêche ' + ou + ' · ' + escheTxt, pourquoi];
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

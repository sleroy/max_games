// ---------------------------------------------------------------------------
// stocks.js — STOCKS : lignes de rechange, fils, amorce de départ et achats de recharges. Extrait de script.js (v161).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=145';
import { ESCHES, ESCHE_DEPART } from './esches.js?v=184';

export function creerStocks(deps) {
    const {
        SCIONS_DE_DEPART, feedButton, quickFeedCount, quickFeedButton, saveJournal, majLignes,
        renderJournal, lineSelect, statusDisplay
    } = deps;

    etat.MAX_LIGNES = 5;
    etat.AMORCE_DEPART = 3;
    etat.RECHARGES = [
        { id: 'amorce', nom: 'Boules d’amorce', prix: 12, desc: 'Attirent les poissons vers le point de chute.' },
        { id: 'nylon', nom: 'Nylon', prix: 18, resistance: 1, emmelement: 1, desc: 'Le fil standard.' },
        { id: 'fluorocarbone', nom: 'Fluorocarbone', prix: 28, resistance: 1, emmelement: 0.5,
            desc: 'Réduit de moitié le risque d’emmêlement si tu oublies de tendre le fil.' },
        { id: 'tresse', nom: 'Tresse', prix: 36, resistance: 1.25, emmelement: 1,
            desc: 'Supporte mieux les poissons qui tirent et la remontée rapide.' }
    ];
    etat.TYPES_DE_FIL = etat.RECHARGES.slice(1);
    // Esches (§15.2) : MÊME système que les fils et l'amorce (lots de TAILLE_LOT, achat en XP, stock dans
    // journal.recharges, persisté par carnet.js). Elles ne sont pas dans RECHARGES (ni fil, ni amorce).
    etat.ESCHES = ESCHES;
    etat.ESCHE_DEPART = ESCHE_DEPART;
    etat.TAILLE_LOT = 3;
    etat.lignesRestantes = etat.MAX_LIGNES;
    etat.amorceDepartRestante = etat.AMORCE_DEPART;
    etat.journal = { total: 0, totalWeight: 0, best: 0, last: [], especes: {}, experience: 0, sonar: false, bateau: false,
        technique: 'bouchon', bouchons: etat.BOUCHONS_DE_DEPART.slice(), scions: SCIONS_DE_DEPART.slice(), scion: SCIONS_DE_DEPART[0], ligne: 'nylon',
        esche: ESCHE_DEPART.id,
        recharges: Object.fromEntries(etat.RECHARGES.concat(ESCHES).map(article =>
            [article.id, article.id === ESCHE_DEPART.id ? ESCHE_DEPART.quantite : 0])) };

    function stockAmorce() {
        return etat.amorceDepartRestante + etat.journal.recharges.amorce;
    }

    function majAmorce() {
        const stock = stockAmorce();
        const amorceArmee = etat.feedMode && etat.feedType !== 'sonar';   // le sonar arme le même geste de lancer
        feedButton.textContent = (amorceArmee ? '🥣 Amorce prête' : '🥣 Amorce') + ' (' + stock + ')';
        quickFeedCount.textContent = String(stock);
        const action = amorceArmee ? 'Annuler l’amorçage' : 'Amorcer';
        quickFeedButton.setAttribute('aria-label',
            action + ', ' + stock + (stock === 1 ? ' boule restante' : ' boules restantes'));
        quickFeedButton.setAttribute('aria-pressed', String(amorceArmee));
    }

    function stockFil(id) {
        return etat.journal.recharges[id] + (id === 'nylon' ? etat.lignesRestantes : 0);
    }

    function totalLignes() {
        return etat.TYPES_DE_FIL.reduce((total, fil) => total + stockFil(fil.id), 0);
    }

    function filEquipe() {
        return etat.TYPES_DE_FIL.find(fil => fil.id === etat.journal.ligne) || etat.TYPES_DE_FIL[0];
    }

    function selectionnerFilDisponible() {
        if (stockFil(etat.journal.ligne) > 0) { return; }
        etat.journal.ligne = etat.TYPES_DE_FIL.find(fil => stockFil(fil.id) > 0)?.id || 'nylon';
    }

    function debiterLigne() {
        const id = filEquipe().id;
        if (id === 'nylon' && etat.lignesRestantes > 0) {
            etat.lignesRestantes -= 1;
        } else if (etat.journal.recharges[id] > 0) {
            etat.journal.recharges[id] -= 1;
        }
        selectionnerFilDisponible();
        saveJournal();
        majLignes();
        etat.renderBoutique();
    }

    // --- Esches : stock, esche équipée (null = hameçon nu), consommation à chaque touche ferrée ---
    function stockEsche(id) {
        return etat.journal.recharges[id] || 0;
    }

    function escheEquipee() {
        const esche = ESCHES.find(e => e.id === etat.journal.esche);
        return esche && stockEsche(esche.id) > 0 ? esche : null;   // stock à 0 : hameçon nu
    }

    function equiperEsche(id) {
        if (etat.floatState !== 'idle' && etat.floatState !== 'inWater') { return false; }
        if (id && !(ESCHES.some(e => e.id === id) && stockEsche(id) > 0)) { return false; }
        etat.journal.esche = id || null;
        saveJournal();
        etat.majEsche();
        return true;
    }

    // Une touche FERRÉE consomme une esche. À zéro, l'hameçon est nu (le stock vide reste équipé).
    function consommerEsche() {
        const esche = etat.eschesActives ? escheEquipee() : null;
        if (!esche) { return false; }
        etat.journal.recharges[esche.id] -= 1;
        saveJournal();
        if (stockEsche(esche.id) === 0) { statusDisplay.textContent = 'Plus de ' + esche.nom.toLowerCase() + ' : l’hameçon est nu.'; }
        etat.majEsche();
        etat.renderBoutique();
        return true;
    }

    function acheterRecharge(id) {
        const article = etat.RECHARGES.concat(ESCHES).find(recharge => recharge.id === id);
        if (!article || etat.journal.experience < article.prix) { return false; }
        etat.journal.experience -= article.prix;
        etat.journal.recharges[id] += etat.TAILLE_LOT;
        // Hameçon nu (ou stock vidé) : l'esche qu'on vient d'acheter est équipée.
        if (ESCHES.includes(article) && !escheEquipee()) { etat.journal.esche = id; }
        selectionnerFilDisponible();
        saveJournal();
        renderJournal();
        majLignes();
        return true;
    }

    lineSelect.addEventListener('change', () => {
        const id = lineSelect.value;
        if (etat.floatState === 'idle' && etat.castState === 'idle'
                && etat.TYPES_DE_FIL.some(fil => fil.id === id) && stockFil(id) > 0) {
            etat.journal.ligne = id;
            saveJournal();
        }
        lineSelect.value = etat.journal.ligne;
    });

    // L'étiquette du widget et la boutique lisent ces fonctions via `etat` (propriétés de module).
    Object.assign(etat, { stockEsche, escheEquipee, equiperEsche, consommerEsche });

    return {
        stockAmorce, majAmorce, stockFil, totalLignes, filEquipe, selectionnerFilDisponible,
        debiterLigne, acheterRecharge, stockEsche, escheEquipee, equiperEsche, consommerEsche
    };
}

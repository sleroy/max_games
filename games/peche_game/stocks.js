// ---------------------------------------------------------------------------
// stocks.js — STOCKS : lignes de rechange, fils, amorce de départ et achats de recharges. Extrait de script.js (v161).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=231';
import { ESCHES, ESCHE_DEPART } from './esches.js?v=231';

export function creerStocks(deps) {
    const {
        SCIONS_DE_DEPART, feedButton, quickFeedCount, quickFeedButton, saveJournal, majLignes,
        renderJournal, lineSelect
    } = deps;

    etat.MAX_LIGNES = 1;
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
    // Esches (§15.2) : ILLIMITÉES depuis la v192. Toutes disponibles d'emblée, sans achat et
    // sans consommation ; seul `journal.esche` (l'esche ÉQUIPÉE) est persisté par carnet.js.
    // Elles ne sont pas dans RECHARGES (ni fil, ni amorce) et n'ont plus de stock.
    etat.ESCHES = ESCHES;
    etat.ESCHE_DEPART = ESCHE_DEPART;
    etat.TAILLE_LOT = 3;
    etat.lignesRestantes = etat.MAX_LIGNES;
    etat.amorceDepartRestante = etat.AMORCE_DEPART;
    etat.journal = { total: 0, totalWeight: 0, best: 0, last: [], especes: {}, experience: 0, sonar: false, bateau: false,
        technique: 'bouchon', bouchons: etat.BOUCHONS_DE_DEPART.slice(), scions: SCIONS_DE_DEPART.slice(), scion: SCIONS_DE_DEPART[0], ligne: 'nylon',
        esche: ESCHE_DEPART.id,
        recharges: Object.fromEntries(etat.RECHARGES.map(article => [article.id, 0])) };

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

    // --- Esches : ILLIMITÉES (v192) — toutes disponibles, équipables, jamais consommées ---
    // `stockEsche` ne sert plus qu'à savoir si l'identifiant est valide (Infinity = illimité).
    function stockEsche(id) {
        return ESCHES.some(e => e.id === id) ? Infinity : 0;
    }

    // Esche équipée (null = hameçon nu). Plus aucune condition de stock.
    function escheEquipee() {
        return ESCHES.find(e => e.id === etat.journal.esche) || null;
    }

    function equiperEsche(id) {
        if (etat.floatState !== 'idle' && etat.floatState !== 'inWater') { return false; }
        if (id && !ESCHES.some(e => e.id === id)) { return false; }
        etat.journal.esche = id || null;
        etat.escheVolee = false;   // une esche fraîche remplace celle qui a été volée (esches.js)
        // « Hameçon nu » est un CHOIX : on le mémorise pour ne pas le remplacer par
        // l'esche de départ au prochain chargement.
        etat.journal.escheNu = !id;
        saveJournal();
        etat.majEsche();
        return true;
    }

    // Conservée pour l'API (combat.js l'appelle au ferrage) : plus aucune consommation.
    function consommerEsche() {
        return false;
    }

    function acheterRecharge(id) {
        const article = etat.RECHARGES.find(recharge => recharge.id === id);
        if (!article || etat.journal.experience < article.prix) { return false; }
        etat.journal.experience -= article.prix;
        etat.journal.recharges[id] += etat.TAILLE_LOT;
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

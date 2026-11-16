// ---------------------------------------------------------------------------
// journal.js — CARNET DE PÊCHE : chargement/sauvegarde, rendu, ajout d'une prise. Extrait de script.js (v162).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=225';

export function creerJournal(deps) {
    const {
        chargerCarnet, trouverFlotteur, SCIONS_DE_DEPART, trouverScion, sauverCarnet,
        journalStats, journalList, journalEspeces, bourricheLabel, xpLabel, xpTop, shopXp
    } = deps;

    etat.journalStore = (typeof localStorage !== 'undefined') ? localStorage : null;
    const JOURNAL_KEY = 'peche_carnet_v1';

    function loadJournal() {
        chargerCarnet({
            store: etat.journalStore,
            key: JOURNAL_KEY,
            data: etat.journal,
            bouchonsDepart: etat.BOUCHONS_DE_DEPART,
            trouverFlotteur: trouverFlotteur,
            setFlotteur: function (id) { etat.flotteurChoix = id; },
            getFlotteur: function () { return etat.flotteurChoix; },
            scionsDepart: SCIONS_DE_DEPART,
            trouverScion: trouverScion,
            setScion: function (id) { etat.scionChoix = id; },
            eschesIds: etat.ESCHES.map(function (e) { return e.id; }),
            eschesDepart: etat.ESCHE_DEPART
        });
    }

    function saveJournal() {
        sauverCarnet({ store: etat.journalStore, key: JOURNAL_KEY, data: etat.journal });
    }

    function fmtPoids(value) {
        return (value < 1 ? value.toFixed(2) : value.toFixed(1)).replace('.', ',') + ' kg';
    }

    function renderJournal() {
        const nbEspeces = Object.keys(etat.journal.especes).length;
        if (etat.journal.total === 0) {
            journalStats.textContent = 'Aucune prise pour l’instant… Lance la canne !';
        } else {
            journalStats.textContent = 'Prises : ' + etat.journal.total
                + ' · Poids total : ' + fmtPoids(etat.journal.totalWeight)
                + ' · Record : ' + fmtPoids(etat.journal.best)
                + ' · Espèces : ' + nbEspeces;
        }
        // Pas de appendChild ici : le carnet s'affiche en texte simple.
        journalList.textContent = etat.journal.last.length
            ? etat.journal.last.map(prise => '🐟 ' + prise.espece + ' — ' + fmtPoids(prise.kg)).join('\n')
            : '';
        // Fiche des espèces : nombre de prises et record pour chaque espèce attrapée.
        const nomsEspeces = Object.keys(etat.journal.especes);
        journalEspeces.textContent = nomsEspeces.length
            ? nomsEspeces.map(nom => {
                const fiche = etat.journal.especes[nom];
                return '🐟 ' + nom + ' — ' + fiche.n + (fiche.n > 1 ? ' prises' : ' prise')
                    + ' · record ' + fmtPoids(fiche.record || 0);
            }).join('\n')
            : 'Attrape ton premier poisson pour remplir la fiche !';
        bourricheLabel.textContent = '🧺 Bourriche : ' + etat.bourricheCount;
        // L'XP de partie repart à 0 ; l'XP carrière reste visible pour la boutique.
        xpLabel.textContent = '⭐ ' + etat.experiencePartie + ' XP · ' + etat.journal.experience + ' carrière';
        // Barre du haut : la version courte (l'XP de la partie en cours, comme le
        // score). Le détail « carrière » reste dans le menu.
        if (xpTop) { xpTop.textContent = '⭐ ' + etat.experiencePartie + ' XP'; }
        shopXp.textContent = '⭐ ' + etat.journal.experience + ' XP';
        // Le carnet a changé (XP, prises…) : la boutique doit se rafraîchir aussi,
        // sinon les boutons d'achat restent grisés alors qu'on a assez d'expérience.
        etat.renderBoutique();
    }

    function addJournalEntry(weight, espece) {
        etat.journal.total += 1;
        etat.journal.totalWeight = Math.round((etat.journal.totalWeight + weight) * 100) / 100;
        if (weight > etat.journal.best) {
            etat.journal.best = weight;
        }
        const nom = espece || 'Poisson';
        etat.journal.last.unshift({ kg: Math.round(weight * 100) / 100, espece: nom });
        if (etat.journal.last.length > 12) {
            etat.journal.last.length = 12;
        }
        etat.journal.especes[nom] = etat.journal.especes[nom] || { n: 0, record: 0 };
        const fiche = etat.journal.especes[nom];
        const ancienRecord = fiche.record || 0;
        fiche.n += 1;
        // Un record est BATTU si le poisson est plus lourd que le précédent (le
        // tout premier poisson d'une espèce établit son record).
        const nouveauRecord = weight > ancienRecord;
        if (nouveauRecord) {
            fiche.record = Math.round(weight * 100) / 100;
        }
        etat.partieStats.poissons += 1;
        etat.partieStats.poids = Math.round((etat.partieStats.poids + weight) * 100) / 100;
        const ancienPartie = etat.partieStats.records[nom] || 0;
        if (weight > ancienPartie) {
            etat.partieStats.records[nom] = Math.round(weight * 100) / 100;
        }
        saveJournal();
        renderJournal();
        return { nouveauRecord: nouveauRecord, ancienRecord: ancienRecord };
    }

    return {
        loadJournal, saveJournal, fmtPoids, renderJournal, addJournalEntry
    };
}

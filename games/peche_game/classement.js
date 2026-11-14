// ---------------------------------------------------------------------------
// classement.js — STOCKAGE ET RENDU DU CLASSEMENT LOCAL.
// Module autonome : reçoit le stockage, les clés, les fonctions de formatage et
// les éléments DOM. L'orchestrateur garde l'ouverture/fermeture des panneaux.
// ---------------------------------------------------------------------------
export function creerClassement(options) {
    const opts = options || {};
    const store = opts.store || null;
    const rankingKey = opts.rankingKey || 'peche_classement';
    const nomKey = opts.nomKey || 'peche_nom';
    const getPartieStats = opts.getPartieStats || function () {
        return { poissons: 0, poids: 0, records: {} };
    };
    const fmtPoids = opts.fmtPoids || function (kg) { return kg + ' kg'; };
    const rankingList = opts.rankingList || null;
    const rankingTabs = opts.rankingTabs || null;
    let liste = [];

    try {
        if (store) {
            const brut = store.getItem(rankingKey);
            if (brut) {
                const lu = JSON.parse(brut);
                if (Array.isArray(lu)) { liste = lu; }
            }
        }
    } catch (e) {
        liste = [];
    }

    function charger() {
        return liste.slice();
    }

    function sauver(nouvelleListe) {
        liste = (nouvelleListe || []).slice(0, 50);
        try {
            if (store) { store.setItem(rankingKey, JSON.stringify(liste)); }
        } catch (e) { /* stockage plein ou refusé */ }
    }

    function enregistrer(nom) {
        const pseudo = String(nom || '').trim().slice(0, 12) || 'Pêcheur';
        const stats = getPartieStats();
        const entree = {
            nom: pseudo,
            date: new Date().toISOString().slice(0, 10),
            poissons: stats.poissons,
            poids: Math.round(stats.poids * 100) / 100,
            records: Object.assign({}, stats.records)
        };
        const copie = charger();
        copie.push(entree);
        sauver(copie);
        try { if (store) { store.setItem(nomKey, pseudo); } } catch (e) { /* plein */ }
        return entree;
    }

    function render(onglet) {
        const choix = onglet || 'poissons';
        if (!rankingList) { return; }
        const copie = charger();
        let html = '';
        if (choix === 'records') {
            const parEspece = {};
            copie.forEach(function (e) {
                const rec = e.records || {};
                Object.keys(rec).forEach(function (esp) {
                    if (!parEspece[esp] || rec[esp] > parEspece[esp].kg) {
                        parEspece[esp] = { kg: rec[esp], nom: e.nom };
                    }
                });
            });
            const especes = Object.keys(parEspece).sort(function (a, b) {
                return parEspece[b].kg - parEspece[a].kg;
            });
            html = especes.length
                ? '<table class="ranking-table"><tr><th>Espèce</th><th>Record</th><th>Pêcheur</th></tr>'
                    + especes.map(function (esp) {
                        return '<tr><td>' + esp + '</td><td>' + fmtPoids(parEspece[esp].kg)
                            + '</td><td>' + parEspece[esp].nom + '</td></tr>';
                    }).join('') + '</table>'
                : '<p>Aucun record pour le moment.</p>';
        } else {
            const cle = choix === 'poids' ? 'poids' : 'poissons';
            const tri = copie.slice().sort(function (a, b) { return b[cle] - a[cle]; }).slice(0, 10);
            html = tri.length
                ? '<table class="ranking-table"><tr><th>#</th><th>Pêcheur</th><th>'
                    + (cle === 'poids' ? 'Poids' : 'Poissons') + '</th><th>Date</th></tr>'
                    + tri.map(function (e, i) {
                        return '<tr><td>' + (i + 1) + '</td><td>' + e.nom + '</td><td>'
                            + (cle === 'poids' ? fmtPoids(e.poids) : e.poissons) + '</td><td>'
                            + (e.date || '') + '</td></tr>';
                    }).join('') + '</table>'
                : '<p>Classement vide : termine une partie pour y figurer !</p>';
        }
        rankingList.innerHTML = html;
        if (rankingTabs && typeof rankingTabs.querySelectorAll === 'function') {
            rankingTabs.querySelectorAll('.tab').forEach(function (btn) {
                btn.classList.toggle('active', btn.dataset.rank === choix);
            });
        }
    }

    return {
        charger: charger,
        sauver: sauver,
        enregistrer: enregistrer,
        render: render
    };
}

// ---------------------------------------------------------------------------
// carnet.js — PERSISTANCE DU CARNET DE PÊCHE (localStorage).
// Reçoit l'objet `journal` de l'orchestrateur et le migre ; le rendu et le jeu
// restent dans script.js. Aucun accès direct au DOM ici.
// ---------------------------------------------------------------------------
export function chargerCarnet(options) {
    const opts = options || {};
    const store = opts.store || null;
    const key = opts.key || 'peche_carnet';
    const data = opts.data;
    const bouchonsDepart = Array.isArray(opts.bouchonsDepart) ? opts.bouchonsDepart : [];
    const trouverFlotteur = opts.trouverFlotteur || function () { return null; };
    const setFlotteur = opts.setFlotteur || function () {};
    const getFlotteur = opts.getFlotteur || function () { return ''; };
    if (!store || !data) { return false; }
    try {
        const raw = store.getItem(key);
        if (!raw) { return false; }
        const saved = JSON.parse(raw);
        data.total = saved.total || 0;
        data.totalWeight = saved.totalWeight || 0;
        data.best = saved.best || 0;
        data.last = Array.isArray(saved.last)
            ? saved.last.map(function (entry) {
                return (typeof entry === 'number')
                    ? { kg: entry, espece: 'Poisson' }
                    : { kg: entry.kg || 0, espece: entry.espece || 'Poisson' };
            })
            : [];
        data.especes = {};
        const brut = (saved.especes && typeof saved.especes === 'object') ? saved.especes : {};
        Object.keys(brut).forEach(function (nom) {
            const valeur = brut[nom];
            data.especes[nom] = (typeof valeur === 'number')
                ? { n: valeur, record: 0 }
                : { n: valeur.n || 0, record: valeur.record || 0 };
        });
        if (typeof saved.bouchon === 'string') { setFlotteur(saved.bouchon); }
        data.experience = Math.max(0, Math.floor(saved.experience || 0));
        data.sonar = saved.sonar === true;
        data.bateau = saved.bateau === true;
        if (data.recharges) {
            for (const id of Object.keys(data.recharges)) {
                const nombre = saved.recharges?.[id];
                data.recharges[id] = Number.isSafeInteger(nombre) && nombre > 0 ? nombre : 0;
            }
            data.ligne = Object.hasOwn(data.recharges, saved.ligne) && saved.ligne !== 'amorce'
                ? saved.ligne : 'nylon';
        }
        // Esches (§15.2) : ILLIMITÉES depuis la v192 — seul `esche` (l'esche équipée, null =
        // hameçon nu) est conservé. Un carnet d'avant les esches reçoit les vers de départ.
        const eschesIds = Array.isArray(opts.eschesIds) ? opts.eschesIds : [];
        if (eschesIds.length) {
            if (!('esche' in saved) && opts.eschesDepart) {
                data.esche = opts.eschesDepart.id;
            } else {
                data.esche = eschesIds.indexOf(saved.esche) >= 0 ? saved.esche : null;
            }
        }
        data.technique = saved.technique === 'quiver' ? 'quiver' : 'bouchon';
        data.bouchons = bouchonsDepart.slice();
        const achetes = Array.isArray(saved.bouchons) ? saved.bouchons : [];
        achetes.forEach(function (id) {
            if (trouverFlotteur(id) && data.bouchons.indexOf(id) < 0) {
                data.bouchons.push(id);
            }
        });
        // Scions du mode quiver : mêmes règles que les bouchons.
        const scionsDepart = Array.isArray(opts.scionsDepart) ? opts.scionsDepart : [];
        const trouverScion = opts.trouverScion || function () { return null; };
        data.scions = scionsDepart.slice();
        (Array.isArray(saved.scions) ? saved.scions : []).forEach(function (id) {
            if (trouverScion(id) && data.scions.indexOf(id) < 0) { data.scions.push(id); }
        });
        data.scion = data.scions.indexOf(saved.scion) >= 0 ? saved.scion : scionsDepart[0];
        if (opts.setScion) { opts.setScion(data.scion); }
        if (data.bouchons.indexOf(getFlotteur()) < 0) {
            setFlotteur(bouchonsDepart[0]);
        }
        return true;
    } catch (error) {
        return false;
    }
}

export function sauverCarnet(options) {
    const opts = options || {};
    const store = opts.store || null;
    const key = opts.key || 'peche_carnet';
    const data = opts.data;
    if (!store || !data) { return false; }
    try {
        store.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        return false;
    }
}

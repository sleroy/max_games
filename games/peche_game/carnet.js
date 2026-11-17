// ---------------------------------------------------------------------------
// carnet.js — PERSISTANCE DU CARNET DE PÊCHE (localStorage).
// Reçoit l'objet `journal` de l'orchestrateur et le migre ; le rendu et le jeu
// restent dans script.js. Aucun accès direct au DOM ici.
// ---------------------------------------------------------------------------
import { milieuParId, IDS_MILIEUX } from './milieux.js?v=247';

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
        data.radar = saved.radar === true;
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
            // On ne commence JAMAIS avec un hameçon nu (6 % de touche) : le joueur qui
            // n'a rien choisi reçoit l'esche de départ ; « hameçon nu » reste un choix
            // explicite, mémorisé par `escheNu`.
            const defaut = opts.eschesDepart ? opts.eschesDepart.id : eschesIds[0];
            if (saved.escheNu === true) {
                data.esche = null;
            } else {
                data.esche = eschesIds.indexOf(saved.esche) >= 0 ? saved.esche : defaut;
            }
        }
        data.technique = saved.technique === 'quiver' ? 'quiver' : 'bouchon';
        // Biotope choisi (milieux.js) : un carnet d'avant les biotopes, ou une valeur inconnue, donne la plaine.
        data.milieu = milieuParId(saved.milieu).id;
        data.records = lireRecords(saved, data.especes);
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

// RECORDS PAR BIOTOPE : { idMilieu: { nomEspece: { cm, kg, milieu } } }.
// Un carnet d'avant les biotopes n'a que `especes[nom].record` (kg, un nombre) : ces records sont ceux de la
// plaine (le seul étang qui existait). Une valeur numérique dans `records` est lue comme des kg.
export function lireRecords(saved, especes) {
    const records = {};
    function poser(milieu, nom, valeur) {
        const kg = typeof valeur === 'number' ? valeur : (valeur && Number(valeur.kg)) || 0;
        const cm = typeof valeur === 'number' ? 0 : (valeur && Number(valeur.cm)) || 0;
        if (!(kg > 0)) { return; }
        (records[milieu] = records[milieu] || {})[nom] = { cm: cm, kg: kg, milieu: milieu };
    }
    const brut = saved && saved.records && typeof saved.records === 'object' ? saved.records : null;
    if (brut) {
        Object.keys(brut).forEach(function (milieu) {
            if (IDS_MILIEUX.indexOf(milieu) < 0 || !brut[milieu] || typeof brut[milieu] !== 'object') { return; }
            Object.keys(brut[milieu]).forEach(function (nom) { poser(milieu, nom, brut[milieu][nom]); });
        });
    } else {
        Object.keys(especes || {}).forEach(function (nom) { poser('plaine', nom, especes[nom].record); });
    }
    return records;
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

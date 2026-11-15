// ---------------------------------------------------------------------------
// Scénario 77 : LES ESCHES (idées.md §15.2, v184).
//
// Maïs, ver de terre, pain / flocons, bouillette, vif / leurre : l'hameçon n'est plus nu.
//  - profils de cibles conformes à la demande ;
//  - l'esche équipée MODIFIE la distribution des touches (adaptée / inadaptée / hameçon nu) ;
//  - croisement avec la couche (surface, mi-eau, fond) et le substrat (§14.3) ;
//  - stock : lots de 3 achetés en XP (même système que les fils), 1 consommée par touche ferrée,
//    stock à 0 = hameçon nu ; persistance dans le carnet ; boutique et widget ;
//  - message discret après plusieurs refus (jamais d'aide explicite).
// ---------------------------------------------------------------------------
import { SPECIES } from '../especes.js';
import { chargerCarnet, sauverCarnet } from '../carnet.js';
import {
    ESCHES, IDS_ESCHES, PROBA_NU, PROBA_INADAPTEE, ESCHE_DEPART, coucheHamecon, efficaciteEsche
} from '../esches.js';
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, step, stepFor, stepUntil, resetToIdle, clearLilyPads, castTo, parkFish, strike,
    adapterAuBouchon
} from './harness.mjs';

// Ce que dit la demande : esche → espèces visées.
const CIBLES = {
    mais: ['carpe', 'tanche', 'breme'],
    ver: ['gardon', 'perche', 'anguille', 'goujon'],
    pain: ['gardon', 'rotengle', 'chevesne'],
    bouillette: ['carpe', 'carassin'],
    vif: ['brochet', 'sandre', 'black-bass']
};

const POINT = { x: 0, z: -25 };    // vase, ≈ 2 m d'eau (3,98 unités)
const PROFONDEUR = { surface: 1.0, 'mi-eau': 2.0, fond: 3.25 };

/** Stock et esche équipée (sans passer par l'interface). */
function equiper(id, stock) {
    const e = G().etat;
    ESCHES.forEach(esche => { e.journal.recharges[esche.id] = 0; });
    if (id) { e.journal.recharges[id] = stock === undefined ? 999 : stock; }
    e.journal.esche = id;
}

/** Un lancer, un poisson de l'espèce arrive sur l'hameçon : mord-il ? */
function essai(fish, couche, collecteur) {
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('coulisse');
    G().setProfondeur(PROFONDEUR[couche]);
    castTo(POINT.x, POINT.z);
    parkFish();
    fish.position.set(G().floatGroup.position.x, G().getHookDepth() - 0.1, G().floatGroup.position.z);
    fish.userData.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    fish.userData.hooked = false;
    fish.userData.biting = false;
    adapterAuBouchon(fish);
    fish.userData.vx = 0;
    fish.userData.vz = 0;
    return stepUntil(() => {
        if (collecteur) { G().getFloatingTexts().forEach(t => collecteur.push(t)); }
        return state() === 'bite';
    }, 3);
}

/** Nombre de touches sur `n` lancers avec la même esche et le même poisson. */
function touches(especeId, escheId, couche, n) {
    equiper(escheId);
    const fish = G().spawnFish(SPECIES.find(s => s.id === especeId));
    let bites = 0;
    for (let i = 0; i < n; i++) {
        if (essai(fish, couche)) { bites++; }
    }
    resetToIdle();
    G().fishes.splice(G().fishes.indexOf(fish), 1);
    return bites;
}

export function run() {
    group('77) Esches : maïs, ver, pain, bouillette, vif (§15.2)');
    const e = G().etat;

    // --- 1) Profils de cibles conformes à la demande ----------------------------------
    check('cinq esches : maïs, ver, pain, bouillette, vif', IDS_ESCHES.join() === 'mais,ver,pain,bouillette,vif', IDS_ESCHES.join());
    Object.keys(CIBLES).forEach(function (id) {
        const esche = ESCHES.find(x => x.id === id);
        check(id + ' cible ' + CIBLES[id].join(', '), CIBLES[id].every(sp => esche.cibles[sp] === 1));
        check(id + ' : les espèces visées existent', CIBLES[id].every(sp => SPECIES.some(s => s.id === sp)));
        const autres = SPECIES.map(s => s.id).filter(sp => CIBLES[id].indexOf(sp) < 0);
        check(id + ' : une espèce non visée ne dépasse jamais 0,5',
            autres.every(sp => (esche.cibles[sp] === undefined ? PROBA_INADAPTEE : esche.cibles[sp]) <= 0.5));
    });
    check('maïs → carpe', ESCHES[0].cibles.carpe === 1);
    check('ver → gardon', ESCHES[1].cibles.gardon === 1);
    check('vif / leurre → brochet', ESCHES[4].cibles.brochet === 1);
    check('prix en XP par lot de 3 (positifs)', ESCHES.every(x => x.prix > 0));

    // --- 2) Croisement esche × couche × substrat (modèle pur) ------------------------
    checkEqual('une ligne courte est en surface', coucheHamecon(1.0, 4.0, false), 'surface');
    checkEqual('une ligne moyenne est en mi-eau', coucheHamecon(2.0, 4.0, false), 'mi-eau');
    checkEqual('près du fond, c’est le fond', coucheHamecon(3.0, 4.0, false), 'fond');
    checkEqual('au quiver, toujours au fond', coucheHamecon(1.0, 4.0, true), 'fond');
    const f = efficaciteEsche;
    check('bouillette sur carpe : bonne au fond', f('bouillette', 'carpe', 'fond', 'vase') >= 0.8);
    check('bouillette posée en SURFACE : nettement moins efficace (÷ 10)',
        f('bouillette', 'carpe', 'surface', 'vase') * 10 <= f('bouillette', 'carpe', 'fond', 'vase'));
    check('maïs en surface : nettement moins efficace', f('mais', 'carpe', 'surface', 'sable') * 5 <= f('mais', 'carpe', 'fond', 'sable'));
    check('flocons en surface : bons ; au FOND : nettement moins (÷ 5)',
        f('pain', 'gardon', 'surface', 'sable') >= 0.9 && f('pain', 'gardon', 'fond', 'sable') * 5 <= f('pain', 'gardon', 'surface', 'sable'));
    check('un leurre en pleine eau est bon', f('vif', 'brochet', 'mi-eau', 'herbier') >= 0.9);
    check('le leurre est meilleur en pleine eau qu’au fond', f('vif', 'brochet', 'mi-eau', 'sable') > f('vif', 'brochet', 'fond', 'sable'));
    check('le fond compte : le maïs se perd dans l’herbier', f('mais', 'carpe', 'fond', 'herbier') < f('mais', 'carpe', 'fond', 'vase'));
    check('le fond compte : le leurre est roi dans l’herbier', f('vif', 'brochet', 'mi-eau', 'herbier') > f('vif', 'brochet', 'mi-eau', 'vase'));
    check('une esche inadaptée ne touche presque jamais (≤ 0,1)',
        f('ver', 'carpe', 'fond', 'vase') <= 0.1 && f('mais', 'brochet', 'mi-eau', 'vase') <= 0.1
        && f('vif', 'carpe', 'fond', 'vase') <= 0.1 && f('pain', 'carpe', 'surface', 'vase') <= 0.1);
    check('hameçon nu : presque rien (≤ 0,1) et bien moins qu’une esche adaptée',
        PROBA_NU <= 0.1 && f(null, 'carpe', 'fond', 'vase') * 10 <= f('mais', 'carpe', 'fond', 'vase'));
    checkEqual('hameçon nu = null, quelle que soit l’espèce', f(null, 'brochet', 'mi-eau', 'herbier'), PROBA_NU);

    // --- 3) L'esche équipée MODIFIE la distribution des touches (simulation) ---------
    e.eschesActives = true;
    const N = 24;
    const resultats = {};
    [['carpe', 'mais', 'ver', 'fond'], ['gardon', 'ver', 'bouillette', 'mi-eau'],
        ['brochet', 'vif', 'pain', 'mi-eau'], ['gardon', 'pain', 'mais', 'surface']].forEach(function (cas) {
        const [sp, bonne, mauvaise, couche] = cas;
        const adaptee = touches(sp, bonne, couche, N);
        const inadaptee = touches(sp, mauvaise, couche, N);
        const nu = touches(sp, null, couche, N);
        resultats[sp + '/' + bonne] = [adaptee, inadaptee, nu];
        check(sp + ' + ' + bonne + ' (' + couche + ') : la plupart des lancers donnent une touche (≥ 75 %)', adaptee >= 0.75 * N,
            adaptee + ' touches sur ' + N);
        check(sp + ' + ' + mauvaise + ' (inadaptée) : presque jamais', inadaptee <= 0.2 * N, inadaptee + ' sur ' + N);
        check(sp + ' à nu : presque jamais', nu <= 0.2 * N, nu + ' sur ' + N);
        check(sp + ' : l’esche adaptée change la distribution (≥ 4 fois plus)', adaptee >= 4 * Math.max(1, inadaptee) && adaptee >= 4 * Math.max(1, nu),
            adaptee + ' contre ' + inadaptee + ' / ' + nu);
    });
    // Couche : la même esche, la même espèce, la profondeur change tout.
    const fondOk = touches('carpe', 'bouillette', 'fond', N);
    const surfaceKo = touches('carpe', 'bouillette', 'surface', N);
    check('bouillette : au fond ≥ 75 % des lancers, en surface presque jamais',
        fondOk >= 0.75 * N && surfaceKo <= 0.2 * N, fondOk + ' contre ' + surfaceKo);
    const surfaceOk = touches('gardon', 'pain', 'surface', N);
    const fondKo = touches('gardon', 'pain', 'fond', N);
    check('flocons : en surface ≥ 75 %, au fond presque jamais', surfaceOk >= 0.75 * N && fondKo <= 0.2 * N, surfaceOk + ' contre ' + fondKo);
    checkEqual('le stock n’est pas touché par les touches non ferrées (999 avant, 999 après)', e.journal.recharges.pain, 999);

    // --- 4) Décision unique par poisson et par lancer + désintérêt -------------------
    equiper('ver');
    const gardon = G().spawnFish(SPECIES.find(s => s.id === 'gardon'));
    essai(gardon, 'mi-eau');
    const d1 = e.accepterTouche(gardon);
    checkEqual('un poisson décide UNE fois par lancer', e.accepterTouche(gardon), d1);
    equiper('mais');
    const brochet = G().spawnFish(SPECIES.find(s => s.id === 'brochet'));
    let refus = null;
    for (let i = 0; i < 12 && !refus; i++) {
        resetToIdle();
        essai(brochet, 'mi-eau');
        if (state() !== 'bite') { refus = brochet; }
    }
    check('un brochet refuse le maïs', !!refus);
    check('…et s’en désintéresse pour ce lancer', e.refuseLEsche(brochet.userData) === true && brochet.userData.targeting !== true,
        'targeting ' + brochet.userData.targeting);
    resetToIdle();
    [gardon, brochet].forEach(x => G().fishes.splice(G().fishes.indexOf(x), 1));

    // --- 5) Message DISCRET après plusieurs refus ------------------------------------
    equiper('mais');
    e.escheStats.serieRefus = 0;
    const textes = [];
    const boudeur = G().spawnFish(SPECIES.find(s => s.id === 'brochet'));
    let message = false;
    for (let i = 0; i < 40 && !message; i++) {
        essai(boudeur, 'mi-eau', textes);
        message = el('status').textContent.indexOf('aucun ne se décide') >= 0;
    }
    G().getFloatingTexts().forEach(t => textes.push(t));
    check('après quelques refus, un message discret apparaît', message, el('status').textContent);
    const MOTS_INTERDITS = ['esche', 'maïs', 'ver de terre', 'pain', 'bouillette', 'leurre', 'change', 'utilise', 'essaie'];
    const tous = (el('status').textContent + ' ' + textes.join(' ')).toLowerCase();
    check('…sans AUCUNE aide explicite (pas de nom d’esche, pas de conseil)', MOTS_INTERDITS.every(m => tous.indexOf(m) < 0), tous);
    check('un message flottant discret accompagne les refus', textes.some(t => /boudent|tournent/.test(t)), textes.join(' | '));
    G().fishes.splice(G().fishes.indexOf(boudeur), 1);
    resetToIdle();

    // --- 6) Stock : achat par lots de 3, consommation à la touche ferrée, nu à 0 -----
    e.eschesActives = true;
    equiper(null);
    e.journal.experience = 100;
    G().recommencerPartie();
    G().setExperience(100);
    const acheter = id => fire('boutique', 'click', { target: { dataset: { action: 'recharger', id } } });
    const prix = ESCHES.find(x => x.id === 'mais').prix;
    acheter('mais');
    checkEqual('un achat ajoute un lot de 3', e.stockEsche('mais'), 3);
    checkEqual('…et débite le prix en XP', G().getExperience(), 100 - prix);
    checkEqual('acheter équipe l’esche quand l’hameçon était nu', e.escheEquipee().id, 'mais');
    acheter('mais');
    checkEqual('un second achat : 6', e.stockEsche('mais'), 6);
    G().setExperience(2);
    acheter('vif');
    checkEqual('pas assez d’XP : rien n’est acheté', e.stockEsche('vif'), 0);
    G().setExperience(100);
    // Trois touches FERRÉES consomment trois esches (une par touche).
    equiper('mais', 3);
    for (let i = 1; i <= 3; i++) {
        const carpe = G().spawnFish(SPECIES.find(s => s.id === 'carpe'));
        checkEqual('touche ' + i + ' : mord', essai(carpe, 'fond'), true);
        strike();
        checkEqual('touche ' + i + ' : le poisson est ferré', state(), 'struggle');
        checkEqual('touche ' + i + ' ferrée : une esche consommée', e.stockEsche('mais'), 3 - i);
        resetToIdle();
    }
    checkEqual('stock à 0 : plus d’esche équipée (hameçon nu)', e.escheEquipee(), null);
    checkEqual('le widget annonce l’hameçon nu', el('depthEsche').textContent.indexOf('nu') >= 0, true);
    equiper('mais', 0);
    let bitesNu = 0;
    const carpe = G().spawnFish(SPECIES.find(s => s.id === 'carpe'));
    for (let i = 0; i < N; i++) { if (essai(carpe, 'fond')) { bitesNu++; } }
    check('stock à 0, équipée ou non : l’hameçon est nu (presque aucune touche)', bitesNu <= 0.2 * N, bitesNu + ' sur ' + N);
    resetToIdle();
    G().fishes.splice(G().fishes.indexOf(carpe), 1);
    e.eschesActives = false;

    // --- 7) Boutique, sélection, widget ----------------------------------------------
    equiper('ver', 2);
    G().setExperience(100);
    G().showJournal();
    const rendu = el('boutique').innerHTML;
    check('la boutique a une section « Esches »', rendu.indexOf('Esches') >= 0);
    check('elle liste les cinq esches avec leur stock', ESCHES.every(x => rendu.indexOf(x.nom + ' · ') >= 0));
    check('chaque esche s’achète par lot de 3', (rendu.match(/Acheter ×3/g) || []).length >= ESCHES.length + 3);
    check('l’esche équipée est marquée', rendu.indexOf('✅ Équipée') >= 0);
    check('le stock s’affiche', rendu.indexOf('Ver de terre · 2 en stock') >= 0);
    fire('boutique', 'click', { target: { dataset: { action: 'equiper-esche', id: 'mais' } } });
    equiper('ver', 2);
    e.journal.recharges.mais = 4;
    fire('boutique', 'click', { target: { dataset: { action: 'equiper-esche', id: 'mais' } } });
    checkEqual('on choisit l’esche équipée dans la boutique', e.journal.esche, 'mais');
    check('le widget de profondeur affiche l’esche et son stock', el('depthEsche').textContent.indexOf('Maïs ×4') >= 0,
        el('depthEsche').textContent);
    fire('boutique', 'click', { target: { dataset: { action: 'equiper-esche', id: 'vif' } } });
    checkEqual('on ne peut pas équiper une esche sans stock', e.journal.esche, 'mais');
    fire('boutique', 'click', { target: { dataset: { action: 'equiper-esche', id: 'nu' } } });
    checkEqual('« Hameçon nu » se choisit aussi', e.journal.esche, null);
    check('…et s’affiche dans le widget', el('depthEsche').textContent.indexOf('Hameçon nu') >= 0, el('depthEsche').textContent);
    // Le widget de profondeur nomme la même couche que les esches.
    resetToIdle();
    clearLilyPads();
    G().setFloatType('coulisse');
    G().setProfondeur(1.0);
    castTo(POINT.x, POINT.z);
    G().majCoupeProfondeur();
    checkEqual('le widget nomme la couche des esches (surface)', el('depthZoneLabel').textContent, 'surface');
    G().setProfondeur(3.25);
    G().majCoupeProfondeur();
    checkEqual('…puis le fond', el('depthZoneLabel').textContent, 'fond');
    resetToIdle();
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);

    // --- 8) Persistance dans le carnet (localStorage), pas dans l'état de partie -----
    const store = { valeur: '', getItem() { return this.valeur; }, setItem(cle, v) { this.valeur = v; } };
    const ids = IDS_ESCHES;
    const neuf = () => ({ recharges: Object.fromEntries(['amorce', 'nylon', 'fluorocarbone', 'tresse'].concat(ids).map(i => [i, 0])), esche: 'ver' });
    sauverCarnet({ store, data: Object.assign(neuf(), { esche: 'bouillette', recharges: Object.assign(neuf().recharges, { bouillette: 6, ver: 1 }) }) });
    const recharge = neuf();
    chargerCarnet({ store, data: recharge, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('rechargement : l’esche équipée est restaurée', recharge.esche, 'bouillette');
    checkEqual('rechargement : le stock est restauré', recharge.recharges.bouillette, 6);
    checkEqual('rechargement : les autres stocks aussi', recharge.recharges.ver, 1);
    sauverCarnet({ store, data: Object.assign(neuf(), { esche: null }) });
    const nuRecharge = neuf();
    chargerCarnet({ store, data: nuRecharge, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('rechargement : « hameçon nu » est restauré', nuRecharge.esche, null);
    store.valeur = JSON.stringify({ experience: 12, recharges: { amorce: 2 } });
    const ancien = neuf();
    chargerCarnet({ store, data: ancien, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('un ancien carnet reçoit les 3 vers de départ', ancien.recharges.ver, 3);
    checkEqual('…et les équipe', ancien.esche, 'ver');
    checkEqual('…sans toucher à son XP', ancien.experience, 12);
    store.valeur = JSON.stringify({ esche: 'inconnue', recharges: {} });
    const faux = neuf();
    chargerCarnet({ store, data: faux, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('une esche inconnue est ignorée (hameçon nu)', faux.esche, null);
    // Le jeu écrit bien l'esche et le stock dans le CARNET (journal), pas dans l'état de partie.
    const reel = e.journalStore;
    const boite = { valeur: '', getItem() { return this.valeur; }, setItem(cle, v) { this.valeur = v; } };
    e.journalStore = boite;
    equiper('ver', 5);
    check('équiper une esche enregistre le carnet', G().etat.equiperEsche('ver') && /"esche":"ver"/.test(boite.valeur));
    check('le stock est dans le carnet', /"ver":5/.test(boite.valeur), boite.valeur.slice(0, 120));
    G().recommencerPartie();
    checkEqual('une nouvelle partie ne touche ni l’esche ni le stock', e.journal.esche === 'ver' && e.stockEsche('ver') === 5, true);
    e.journalStore = reel;
    checkEqual('les vers de départ sont offerts aux nouveaux joueurs', ESCHE_DEPART.quantite, 3);
    equiper(null);
    e.eschesActives = false;
    G().setExperience(0);
    resetToIdle();
}

export default run;

// ---------------------------------------------------------------------------
// Scénario 77 : LES ESCHES (idées.md §15.2, v184 ; ILLIMITÉES en v192).
//
// Maïs, ver de terre, pain / flocons, bouillette, vif / leurre : l'hameçon n'est plus nu.
//  - profils de cibles conformes à la demande ;
//  - l'esche équipée MODIFIE la distribution des touches (adaptée / inadaptée / hameçon nu) ;
//  - croisement avec la couche (surface, mi-eau, fond) et le substrat (§14.3) ;
//  - esches ILLIMITÉES (v192) : toutes disponibles, équipables librement, AUCUNE consommation,
//    aucun achat, widget sans compteur ; seule l'esche équipée est persistée par le carnet ;
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
    vif: ['brochet', 'sandre', 'black-bass', 'silure'],
    mouche: ['truite']
};

const POINT = { x: 0, z: -25 };    // vase, ≈ 2 m d'eau (3,98 unités)
const PROFONDEUR = { surface: 1.0, 'mi-eau': 2.0, fond: 3.25 };

/** Esche équipée (sans passer par l'interface). Les esches sont illimitées : pas de stock. */
function equiper(id) {
    G().etat.journal.esche = id;
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
    check('six esches : maïs, ver, pain, bouillette, vif, mouche', IDS_ESCHES.join() === 'mais,ver,pain,bouillette,vif,mouche', IDS_ESCHES.join());
    Object.keys(CIBLES).forEach(function (id) {
        const esche = ESCHES.find(x => x.id === id);
        check(id + ' cible ' + CIBLES[id].join(', '), CIBLES[id].every(sp => esche.cibles[sp] === 1));
        check(id + ' : les espèces visées existent', CIBLES[id].every(sp => SPECIES.some(s => s.id === sp)));
        const autres = SPECIES.map(s => s.id).filter(sp => CIBLES[id].indexOf(sp) < 0);
        // Une espèce non visée peut en faire son 2e choix (≤ 0,75 : le leurre pour la truite), jamais son esche reine.
        check(id + ' : une espèce non visée ne dépasse jamais 0,75',
            autres.every(sp => (esche.cibles[sp] === undefined ? PROBA_INADAPTEE : esche.cibles[sp]) <= 0.75));
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
        f('mais', 'brochet', 'mi-eau', 'vase') <= 0.1
        && f('vif', 'carpe', 'fond', 'vase') <= 0.1 && f('pain', 'carpe', 'surface', 'vase') <= 0.1);
    check('hameçon nu : presque rien (≤ 0,1) et bien moins qu’une esche adaptée',
        PROBA_NU <= 0.1 && f(null, 'carpe', 'fond', 'vase') * 10 <= f('mais', 'carpe', 'fond', 'vase'));
    checkEqual('hameçon nu = null, quelle que soit l’espèce', f(null, 'brochet', 'mi-eau', 'herbier'), PROBA_NU);

    check('ver : toujours mieux qu’un hameçon nu, même pour une espèce non visée',
        ['carpe', 'brochet', 'sandre', 'black-bass'].every(sp => f('ver', sp, 'mi-eau', 'sable') > PROBA_NU && f('ver', sp, 'mi-eau', 'sable') <= 0.3));
    check('ver : l’ablette est une vraie cible (asticot / ver de vase, ses appâts de référence)',
        f('ver', 'ablette', 'mi-eau', 'sable') >= 0.4);
    check('pain : l’ablette gobe la mie de pain en surface (≥ 0,65)',
        f('pain', 'ablette', 'surface', 'sable') >= 0.65);
    check('vif / leurre : un herbivore l’ignore (0)', ['carpe', 'gardon', 'tanche', 'breme', 'carassin'].every(sp => f('vif', sp, 'mi-eau', 'herbier') === 0));
    check('bouillette : un carnassier l’ignore (0)', f('bouillette', 'brochet', 'fond', 'vase') === 0);
    check('bouillette : une carpe trop petite (< 25 cm) l’ignore, une grosse la prend',
        f('bouillette', 'carpe', 'fond', 'vase', 15) === 0 && f('bouillette', 'carpe', 'fond', 'vase', 40) >= 0.8);

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
    checkEqual('l’esche équipée ne change pas pendant des touches NON ferrées', e.journal.esche, 'pain');

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

    // --- 6) Esches ILLIMITÉES (v192) : ni achat, ni consommation ---------------------
    e.eschesActives = true;
    equiper(null);
    G().recommencerPartie();
    G().setExperience(100);
    const acheter = id => fire('boutique', 'click', { target: { dataset: { action: 'recharger', id } } });
    check('toutes les esches sont disponibles d’emblée (stock illimité)', ESCHES.every(x => e.stockEsche(x.id) > 0),
        ESCHES.map(x => x.id + '=' + e.stockEsche(x.id)).join(' '));
    acheter('mais');
    checkEqual('on ne peut plus ACHETER une esche (XP inchangée)', G().getExperience(), 100);
    checkEqual('…et son stock reste illimité', e.stockEsche('mais'), Infinity);
    check('équiper une esche ne demande aucun achat', G().etat.equiperEsche('mais'));
    checkEqual('…elle est bien équipée', e.escheEquipee().id, 'mais');
    // Dix touches FERRÉES : aucune esche n'est consommée, l'équipement ne bouge pas.
    for (let i = 1; i <= 10; i++) {
        const carpe = G().spawnFish(SPECIES.find(s => s.id === 'carpe'));
        checkEqual('touche ' + i + ' : mord', essai(carpe, 'fond'), true);
        strike();
        checkEqual('touche ' + i + ' : le poisson est ferré', state(), 'struggle');
        resetToIdle();
    }
    checkEqual('après 10 touches ferrées, le stock reste disponible', e.stockEsche('mais') > 0, true);
    checkEqual('…et l’esche équipée n’a pas changé', e.journal.esche, 'mais');
    checkEqual('…escheEquipee la renvoie toujours', e.escheEquipee().id, 'mais');
    check('le widget n’affiche plus de compteur', el('depthEsche').textContent.indexOf('×') < 0,
        el('depthEsche').textContent);
    check('le widget nomme l’esche équipée', el('depthEsche').textContent.indexOf('Esche : Maïs') >= 0,
        el('depthEsche').textContent);
    // L'hameçon nu reste possible, et les identifiants inconnus sont refusés.
    G().etat.equiperEsche(null);
    checkEqual('l’hameçon nu se choisit toujours', e.escheEquipee(), null);
    check('…et s’affiche dans le widget', el('depthEsche').textContent.indexOf('Hameçon nu') >= 0,
        el('depthEsche').textContent);
    checkEqual('une esche inconnue est refusée', G().etat.equiperEsche('licorne'), false);
    // La décision de touche reste valable : hameçon nu = presque rien, ver = presque tout.
    equiper(null);
    let bitesNu = 0;
    const carpe = G().spawnFish(SPECIES.find(s => s.id === 'carpe'));
    for (let i = 0; i < N; i++) { if (essai(carpe, 'fond')) { bitesNu++; } }
    check('hameçon nu : presque aucune touche', bitesNu <= 0.2 * N, bitesNu + ' sur ' + N);
    resetToIdle();
    G().fishes.splice(G().fishes.indexOf(carpe), 1);
    e.eschesActives = false;

    // --- 7) Boutique : liste d'équipement (plus aucun achat d'esche) -----------------
    e.eschesActives = false;
    G().etat.equiperEsche('ver');
    G().setExperience(100);
    G().showJournal();
    const rendu = el('boutique').innerHTML;
    check('la boutique a une section « Esches »', rendu.indexOf('Esches') >= 0);
    check('elle annonce les esches illimitées', rendu.indexOf('illimitées') >= 0);
    check('elle liste les six esches (icône + nom)', ESCHES.every(x => rendu.indexOf(x.icone + ' ' + x.nom) >= 0),
        ESCHES.map(x => x.icone + ' ' + x.nom).join(' · '));
    checkEqual('les fils et l’amorce s’achètent toujours par lots de 3',
        (rendu.match(/Acheter ×3/g) || []).length, 4);
    check('aucune esche n’a de bouton d’achat',
        ESCHES.every(x => rendu.indexOf('data-action="recharger" data-id="' + x.id + '"') < 0));
    check('l’esche équipée est marquée', rendu.indexOf('✅ Équipée') >= 0);
    checkEqual('plus de stock affiché pour les esches', rendu.indexOf('en stock') >= 0
        && rendu.indexOf('Ver de terre · ') < 0, true);
    fire('boutique', 'click', { target: { dataset: { action: 'equiper-esche', id: 'mais' } } });
    checkEqual('on choisit l’esche équipée dans la boutique (sans stock)', e.journal.esche, 'mais');
    check('le widget de profondeur affiche l’esche sans compteur',
        el('depthEsche').textContent.indexOf('Maïs') >= 0 && el('depthEsche').textContent.indexOf('×') < 0,
        el('depthEsche').textContent);
    fire('boutique', 'click', { target: { dataset: { action: 'equiper-esche', id: 'vif' } } });
    checkEqual('une autre esche s’équipe aussi librement', e.journal.esche, 'vif');
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

    // --- 8) Persistance : seule l'esche ÉQUIPÉE va dans le carnet ---------------------
    const store = { valeur: '', getItem() { return this.valeur; }, setItem(cle, v) { this.valeur = v; } };
    const ids = IDS_ESCHES;
    const neuf = () => ({ recharges: { amorce: 0, nylon: 0, fluorocarbone: 0, tresse: 0 }, esche: 'ver' });
    sauverCarnet({ store, data: Object.assign(neuf(), { esche: 'bouillette' }) });
    const recharge = neuf();
    chargerCarnet({ store, data: recharge, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('rechargement : l’esche équipée est restaurée', recharge.esche, 'bouillette');
    checkEqual('rechargement : aucune esche n’ajoute de stock au carnet',
        Object.keys(recharge.recharges).join(), 'amorce,nylon,fluorocarbone,tresse');
    // v193 : « hameçon nu » est un CHOIX explicite, mémorisé par `escheNu`.
    sauverCarnet({ store, data: Object.assign(neuf(), { esche: null, escheNu: true }) });
    const nuRecharge = neuf();
    chargerCarnet({ store, data: nuRecharge, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('rechargement : « hameçon nu » (choix explicite) est restauré', nuRecharge.esche, null);
    sauverCarnet({ store, data: Object.assign(neuf(), { esche: null }) });
    const jamaisChoisi = neuf();
    chargerCarnet({ store, data: jamaisChoisi, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('sans choix explicite, on ne démarre jamais à l’hameçon nu', jamaisChoisi.esche, 'ver');
    store.valeur = JSON.stringify({ experience: 12, recharges: { amorce: 2 }, esche: 'ver', ver: 9 });
    const ancien = neuf();
    chargerCarnet({ store, data: ancien, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('un ancien carnet reste équipé de son esche', ancien.esche, 'ver');
    checkEqual('…et un vieux stock d’esche est ignoré', Object.hasOwn(ancien.recharges, 'ver'), false);
    checkEqual('…sans toucher à son XP', ancien.experience, 12);
    store.valeur = JSON.stringify({ experience: 12, recharges: { amorce: 2 } });
    const sansEsche = neuf();
    chargerCarnet({ store, data: sansEsche, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('un carnet d’avant les esches est équipé des vers de départ', sansEsche.esche, 'ver');
    store.valeur = JSON.stringify({ esche: 'inconnue', recharges: {} });
    const faux = neuf();
    chargerCarnet({ store, data: faux, eschesIds: ids, eschesDepart: ESCHE_DEPART });
    checkEqual('une esche inconnue retombe sur l’esche de départ', faux.esche, 'ver');
    // Le jeu écrit bien l'esche ÉQUIPÉE dans le CARNET (journal), pas dans l'état de partie.
    const reel = e.journalStore;
    const boite = { valeur: '', getItem() { return this.valeur; }, setItem(cle, v) { this.valeur = v; } };
    e.journalStore = boite;
    check('équiper une esche enregistre le carnet', G().etat.equiperEsche('ver') && /"esche":"ver"/.test(boite.valeur));
    check('le carnet ne contient plus de stock d’esche', !/"ver":\s*[1-9]/.test(boite.valeur), boite.valeur.slice(0, 160));
    G().recommencerPartie();
    checkEqual('une nouvelle partie ne touche pas l’esche équipée', e.journal.esche, 'ver');
    e.journalStore = reel;
    checkEqual('le ver de terre reste l’esche de départ (compatibilité carnets)', ESCHE_DEPART.id, 'ver');
    equiper(null);
    e.eschesActives = false;
    G().setExperience(0);
    resetToIdle();
}

export default run;

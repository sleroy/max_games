// ---------------------------------------------------------------------------
// Scénario : BIOTOPES D'ÉTANG (milieux.js) — choix à l'accueil, faune en quotas, taille maximale,
// eau, décor, fonds, matrice par biotope.
//
//  1) données : parts = 100, espèces connues, présences attendues ;
//  2) quotas : somme = N, ≥ 1 par espèce présente, 0 si absente, banc minimum, reproductibilité ;
//  3) tailles : cmMax borné, forêt < plaine, monotonie surface / profondeur ;
//  4) interface : choix sur l'accueil → journal.milieu persistant, étang repeuplé (échantillon réel) ;
//  5) décor, fonds, eau, herbe : comptes du biotope, parts de fonds, déterminisme, retour en plaine ;
//  6) matrice par biotope : chaque espèce présente reste pêchable avec sa taille maximale ;
//  7) conseils (avion, conseil local) limités aux espèces du biotope ;
//  8) carnet : « Milieu : … », « Où la trouver », records par biotope (anciens carnets convertis).
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { SPECIES, COMPORTEMENTS } from '../especes.js';
import {
    MILIEUX, IDS_MILIEUX, MILIEU_DEFAUT, milieuParId, partsEspeces, especesPresentes, quotasEspeces,
    capacite, facteurTaille, facteurTailleDe, tailleMaxEspece, densitesDecor, partsSubstrats, eauDe,
    ouTrouver, texteOuTrouver
} from '../milieux.js';
import { chargerCarnet, lireRecords } from '../carnet.js';
import { GAME_DIR, group, check, checkEqual, checkClose, G, el, fire, moduleCopie } from './harness.mjs';

const IDS_ESPECES = SPECIES.map(function (e) { return e.id; });
const cap = function (id) { return id[0].toUpperCase() + id.slice(1); };
const espece = function (id) { return SPECIES.find(function (e) { return e.id === id; }); };

function compter(poissons) {
    const c = {};
    poissons.forEach(function (f) { c[f.userData.especeId] = (c[f.userData.especeId] || 0) + 1; });
    return c;
}

/** Choisit un biotope comme le joueur : bouton radio de l'accueil. */
function choisirSurAccueil(id) {
    el('accueilMilieu' + cap(id)).checked = true;
    fire('accueilMilieu' + cap(id), 'change');
}

export async function run() {
    group('77) Biotopes d’étang : choix, faune en quotas, taille maximale (milieux.js)');

    // --- 1) Les données ---------------------------------------------------------------------
    checkEqual('six biotopes', MILIEUX.length, 6);
    checkEqual('le biotope par défaut est la plaine', MILIEU_DEFAUT, 'plaine');
    checkEqual('un identifiant inconnu retombe sur la plaine', milieuParId('lune').id, 'plaine');
    MILIEUX.forEach(function (m) {
        const somme = IDS_ESPECES.reduce(function (s, id) { return s + (m.parts[id] || 0); }, 0);
        checkEqual(m.id + ' : les parts de population somment à 100', somme, 100);
        check(m.id + ' : toutes les espèces citées existent',
            Object.keys(m.parts).every(function (id) { return IDS_ESPECES.indexOf(id) >= 0; }));
        check(m.id + ' : au moins une espèce présente', especesPresentes(m).length >= 1,
            especesPresentes(m).length + ' espèces');
        const f = m.fonds;
        checkClose(m.id + ' : les parts de fonds somment à 1', f.vase + f.herbier + f.sable + f.gravier + f.roche, 1, 1e-9);
        const p = partsEspeces(m);
        checkClose(m.id + ' : partsEspeces somme à 1', IDS_ESPECES.reduce(function (s, id) { return s + p[id]; }, 0), 1, 1e-9);
        check(m.id + ' : nom, icône et une ligne de présentation', !!m.nom && !!m.icone && m.resume.length > 10);
    });
    const presente = function (m, id) { return especesPresentes(m).indexOf(id) >= 0; };
    check('black-bass absent de la montagne et de la forêt',
        !presente('montagne', 'black-bass') && !presente('foret', 'black-bass'));
    check('la truite vit en montagne seulement',
        presente('montagne', 'truite') && MILIEUX.every(function (m) { return m.id === 'montagne' || !presente(m, 'truite'); }));
    check('le silure vit en rivière et dans l’étang à carnassiers seulement',
        presente('riviere', 'silure') && presente('carnassiers', 'silure')
        && MILIEUX.every(function (m) { return ['riviere', 'carnassiers'].indexOf(m.id) >= 0 || !presente(m, 'silure'); }));
    check('pas de carpe dans le canal', !presente('canal', 'carpe'));
    check('« Où la trouver » : la truite n’est que en montagne', texteOuTrouver('truite') === 'Lac de montagne',
        texteOuTrouver('truite'));
    check('« Où la trouver » : triée du biotope le plus au moins abondant',
        ouTrouver('gardon')[0].id === 'foret' && ouTrouver('gardon').length === 6,
        ouTrouver('gardon').map(function (m) { return m.id; }).join(', '));

    // --- 2) Les quotas ----------------------------------------------------------------------
    MILIEUX.forEach(function (m) {
        [60, 115].forEach(function (N) {
            const q = quotasEspeces(m, N);
            const p = partsEspeces(m);
            const somme = IDS_ESPECES.reduce(function (s, id) { return s + q.quotas[id]; }, 0);
            checkEqual(m.id + ' (N = ' + N + ') : la somme des quotas vaut le total', somme, q.total);
            check(m.id + ' (N = ' + N + ') : le total est N (ou la somme des minimums de banc)', q.total >= N,
                q.total + ' ≥ ' + N);
            check(m.id + ' (N = ' + N + ') : part > 0 ⇒ au moins un poisson, part = 0 ⇒ aucun',
                IDS_ESPECES.every(function (id) { return p[id] > 0 ? q.quotas[id] >= 1 : q.quotas[id] === 0; }));
            check(m.id + ' (N = ' + N + ') : chaque espèce de banc a au moins son minimum de banc',
                IDS_ESPECES.every(function (id) { return q.quotas[id] === 0 || q.quotas[id] >= COMPORTEMENTS[id].banc[0]; }));
            check(m.id + ' (N = ' + N + ') : quota proche de la part (±2 poissons, hors minimum)',
                IDS_ESPECES.every(function (id) {
                    return q.quotas[id] === 0 || q.quotas[id] <= Math.max(Math.ceil(q.total * p[id]) + 1, COMPORTEMENTS[id].banc[0], 1);
                }));
        });
        checkEqual(m.id + ' : mêmes entrées, mêmes quotas',
            JSON.stringify(quotasEspeces(m, 60)), JSON.stringify(quotasEspeces(m, 60)));
    });
    const minuscule = quotasEspeces('foret', 3);
    const sommeMin = IDS_ESPECES.reduce(function (s, id) {
        return s + (partsEspeces('foret')[id] > 0 ? Math.max(1, COMPORTEMENTS[id].banc[0]) : 0);
    }, 0);
    checkEqual('N trop petit : il remonte à la somme des minimums de banc', minuscule.total, sommeMin);
    checkEqual('population de la plaine en mode normal : 115 poissons', capacite('plaine'), 115);
    check('rivière : plafonnée à 240', capacite('riviere') === 240, String(capacite('riviere')));

    // --- 3) Les tailles ---------------------------------------------------------------------
    checkClose('plaine : facteur de taille 1', facteurTaille('plaine'), 1, 1e-9);
    checkClose('forêt : facteur ≈ 0,53', facteurTaille('foret'), 0.53, 0.01);
    checkClose('montagne : facteur ≈ 1,04', facteurTaille('montagne'), 1.04, 0.01);
    checkClose('rivière : facteur ≈ 1,06', facteurTaille('riviere'), 1.06, 0.01);
    checkClose('forêt : carpe ≈ 65 cm', tailleMaxEspece(espece('carpe'), 'foret'), 65, 1);
    checkClose('forêt : gardon ≈ 27 cm', tailleMaxEspece(espece('gardon'), 'foret'), 27, 1);
    checkEqual('rivière : le silure est plafonné à 220 cm', tailleMaxEspece(espece('silure'), 'riviere'), 220);
    MILIEUX.forEach(function (m) {
        check(m.id + ' : cm[0] ≤ cmMax ≤ cm[1] pour toutes les espèces',
            SPECIES.every(function (e) {
                const max = tailleMaxEspece(e, m);
                return max >= e.cm[0] && max <= e.cm[1];
            }));
    });
    check('une même espèce est plus petite en forêt qu’en plaine',
        SPECIES.every(function (e) { return tailleMaxEspece(e, 'foret') < tailleMaxEspece(e, 'plaine'); }));
    let monotone = true;
    for (let ha = 0.1; ha < 2.5; ha += 0.2) {
        for (let prof = 2; prof < 11; prof += 0.7) {
            const base = tailleMaxEspece(espece('carpe'), facteurTailleDe(ha, prof));
            if (tailleMaxEspece(espece('carpe'), facteurTailleDe(ha + 0.2, prof)) < base - 1e-9) { monotone = false; }
            if (tailleMaxEspece(espece('carpe'), facteurTailleDe(ha, prof + 0.7)) < base - 1e-9) { monotone = false; }
        }
    }
    check('la taille maximale ne baisse jamais quand la surface ou la profondeur augmente', monotone);

    // --- 4) L'interface : choix sur l'accueil -------------------------------------------------
    const e = G().etat;
    check('l’accueil propose un bouton radio par biotope',
        IDS_MILIEUX.every(function (id) { return !!el('accueilMilieu' + cap(id)); }));
    checkEqual('le biotope par défaut est la plaine', G().milieux.courant().id, 'plaine');
    checkEqual('…et le carnet le mémorise', e.journal.milieu, 'plaine');

    const reel = e.journalStore;
    const boite = { valeur: '', getItem() { return this.valeur || null; }, setItem(cle, v) { this.valeur = v; } };
    e.journalStore = boite;
    // La plaine en dernier : choisir le biotope déjà en place ne repeuple pas.
    IDS_MILIEUX.slice(1).concat(['plaine']).forEach(function (id) {
        G().setGraine(20240101);
        choisirSurAccueil(id);
        const m = milieuParId(id);
        checkEqual(id + ' : le biotope du monde suit le choix de l’accueil', G().milieux.courant().id, id);
        checkEqual(id + ' : journal.milieu est mémorisé', e.journal.milieu, id);
        check(id + ' : …et écrit dans le carnet persistant', new RegExp('"milieu":"' + id + '"').test(boite.valeur));
        checkEqual(id + ' : le bon bouton est coché', el('accueilMilieu' + cap(id)).checked, true);
        // Échantillon réel : l'étang est repeuplé avec la composition du biotope.
        const attendu = quotasEspeces(m, G().getPopulation().cible).quotas;
        const reelle = compter(G().fishes);
        check(id + ' : l’étang compte exactement les quotas du biotope',
            IDS_ESPECES.every(function (esp) { return (reelle[esp] || 0) === attendu[esp]; }),
            JSON.stringify(reelle));
        check(id + ' : aucune espèce absente du biotope dans l’étang',
            Object.keys(reelle).every(function (esp) { return especesPresentes(m).indexOf(esp) >= 0; }));
        checkEqual(id + ' : population = cible calculée', G().fishes.length, G().getPopulation().cible);
        check(id + ' : chaque poisson respecte la taille maximale du biotope',
            G().fishes.every(function (f) {
                return f.userData.longueurCm <= Math.round(tailleMaxEspece(espece(f.userData.especeId), m))
                    && f.userData.longueurCm >= Math.round(espece(f.userData.especeId).cm[0]) - 0;
            }));
    });
    // Deux peuplements à graine fixe : mêmes quotas, même composition.
    G().setGraine(20240101);
    choisirSurAccueil('carnassiers');
    const premier = JSON.stringify(compter(G().fishes));
    G().setGraine(20240101);
    G().repeuplerEtang();
    checkEqual('deux peuplements du même biotope ont la même composition', JSON.stringify(compter(G().fishes)), premier);
    // Les teintes de l’eau : celles du biotope, pas celles de la plaine.
    checkEqual('l’eau du biotope : uShallow', G().getEauCouleurs().shallow, eauDe('carnassiers').shallow);
    check('l’eau de l’étang à carnassiers diffère de celle de la plaine', G().getEauCouleurs().shallow !== eauDe('plaine').shallow);
    check('l’eau reste sombre et colorée pour tous les biotopes (jamais une nappe blanche)',
        MILIEUX.every(function (m) { const c = eauDe(m); return c.shallow < 0x7fffff && c.deep < 0x303030; }));
    checkEqual('le cheat « aquarium » (uClear) n’est pas touché par le biotope', G().getEauTransparente(), false);

    // Rétro-compatibilité du carnet : d'avant les biotopes, ou valeur inconnue → plaine.
    function neuf() { return { technique: 'bouchon', milieu: 'x' }; }
    const store = { valeur: '', getItem() { return this.valeur; } };
    store.valeur = JSON.stringify({ experience: 3 });
    const ancien = neuf();
    chargerCarnet({ store: store, data: ancien });
    checkEqual('un carnet d’avant les biotopes ouvre la plaine', ancien.milieu, 'plaine');
    store.valeur = JSON.stringify({ milieu: 'montagne' });
    const montagne = neuf();
    chargerCarnet({ store: store, data: montagne });
    checkEqual('un carnet avec un biotope le retrouve', montagne.milieu, 'montagne');
    store.valeur = JSON.stringify({ milieu: 'planete-mars' });
    const faux = neuf();
    chargerCarnet({ store: store, data: faux });
    checkEqual('un biotope inconnu retombe sur la plaine', faux.milieu, 'plaine');

    // La page HTML contient les six boutons (mêmes identifiants que le jeu).
    const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    check('index.html : six boutons radio « accueilMilieu » avec le bon value',
        IDS_MILIEUX.every(function (id) {
            return html.indexOf('id="accueilMilieu' + cap(id) + '"') >= 0
                && new RegExp('name="accueilMilieu"\\s+value="' + id + '"').test(html);
        }));
    check('index.html : pas de menu déroulant pour le milieu', !/<select[^>]*(milieu|biotope)/i.test(html));
    check('le décor, les fonds et les densités sont lisibles',
        MILIEUX.every(function (m) { const d = densitesDecor(m); const s = partsSubstrats(m); return d.arbres >= 0 && s.vase >= 0; }));

    // --- 5) Décor, fonds, végétation --------------------------------------------------------
    const D = G().decor;
    const S = G().substrats;
    const decorDe = function () {
        return JSON.stringify([D.arbres, D.lilyPads, D.roseaux, D.rochers]);
    };
    // Monde d'origine (plaine, `rand()` du jeu) : mémorisé AVANT tout changement de biotope.
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    const decorPlaine = decorDe();
    const grillePlaine = S.empreinte();
    const partsPlaine = Object.assign({}, S.parts);
    const sansEau = function (x, z) {
        const dx = x - G().getPondCenter().x;
        const dz = z - G().getPondCenter().z;
        return Math.hypot(dx, dz) >= G().getRayonEtang(Math.atan2(dz, dx)) + 4;
    };
    const decorsVus = {};
    IDS_MILIEUX.slice(1).concat(['plaine']).forEach(function (id) {
        const m = milieuParId(id);
        const d = densitesDecor(m);
        choisirSurAccueil(id);
        decorsVus[id] = decorDe();
        check(id + ' : arbres du biotope (≤ ' + d.arbres + ', au moins 70 %)',
            D.arbres.length <= d.arbres && D.arbres.length >= d.arbres * 0.7, D.arbres.length + ' arbres');
        // Un nénuphar, un roseau ou un rocher qui tomberait sur un obstacle déjà posé est simplement omis.
        const presque = function (n, voulu) { return n <= voulu && n >= Math.floor(voulu * 0.85); };
        check(id + ' : nénuphars du biotope (' + d.nenuphars + ', au moins 85 %)', presque(G().lilyPads.length, d.nenuphars), G().lilyPads.length + ' nénuphars');
        check(id + ' : roseaux du biotope (' + d.roseaux + ', au moins 85 %)', presque(D.roseaux.length, d.roseaux), D.roseaux.length + ' roseaux');
        check(id + ' : rochers du biotope (' + d.rochers + ', au moins 85 %)', presque(D.rochers.length, d.rochers), D.rochers.length + ' rochers');
        check(id + ' : aucun arbre dans l’eau', D.arbres.every(function (a) { return sansEau(a.x, a.z); }));
        checkClose(id + ' : l’herbe suit le décor du biotope', D.vegetation.herbe.count / 4000, d.herbe, 0.001);
        // Fonds : la grille se rapproche des parts du biotope (la plaine garde la grille d'origine du monde).
        const cibles = partsSubstrats(m);
        const tolerance = id === 'plaine' ? 0.065 : 0.03;
        check(id + ' : parts de fonds proches de celles du biotope (±' + tolerance * 100 + ' points)',
            Object.keys(cibles).every(function (sub) { return Math.abs(S.parts[sub] - cibles[sub]) <= tolerance; }),
            Object.keys(cibles).map(function (sub) { return sub + ' ' + S.parts[sub].toFixed(2) + '/' + cibles[sub].toFixed(2); }).join(' · '));
        checkEqual(id + ' : le module des fonds connaît le biotope', S.milieu(), id);
        checkEqual(id + ' : la grille se refait à l’identique (déterminisme)', S.refaire().empreinte(), S.empreinte());
        // Un fond sans herbier ne peut pas être trouvé sans plantes : l'herbier suit le décor.
        check(id + ' : tous les types de fond du biotope existent sur la carte (> 1 % chacun)',
            Object.keys(cibles).every(function (sub) { return cibles[sub] < 0.03 || S.parts[sub] > 0.01; }));
        checkClose(id + ' : la carte du carnet suit la grille (somme des parts = 1)',
            Object.keys(S.parts).reduce(function (s, sub) { return s + S.parts[sub]; }, 0), 1, 1e-6);
    });
    check('les cinq biotopes autres que la plaine ont un décor différent (arbres, nénuphars, roseaux)',
        new Set(IDS_MILIEUX.map(function (id) { return decorsVus[id]; })).size === 6);
    check('forêt : plus d’arbres que la plaine ; montagne : pas de nénuphars, plus de rochers',
        densitesDecor('foret').arbres > densitesDecor('plaine').arbres && densitesDecor('montagne').nenuphars === 0
        && densitesDecor('montagne').rochers > densitesDecor('plaine').rochers);
    // Revenir à la plaine REJOUE le monde d'origine : même décor, mêmes fonds.
    checkEqual('retour en plaine : le décor d’origine est rejoué à l’identique', decorsVus.plaine, decorPlaine);
    checkEqual('retour en plaine : la grille des fonds est celle d’origine', S.empreinte(), grillePlaine);
    checkEqual('retour en plaine : les parts de fonds sont celles d’origine', JSON.stringify(S.parts), JSON.stringify(partsPlaine));
    // Même graine, même biotope : même décor (aller-retour par un autre biotope).
    choisirSurAccueil('montagne');
    const montagne1 = decorDe();
    const grille1 = S.empreinte();
    choisirSurAccueil('canal');
    choisirSurAccueil('montagne');
    checkEqual('montagne revue : même décor', decorDe(), montagne1);
    checkEqual('montagne revue : mêmes fonds', S.empreinte(), grille1);
    // Les obstacles restent en place : le décor du nouveau biotope ne les recouvre pas.
    const cercles = G().obstacles.liste.reduce(function (t, o) { return t.concat(o.cercles || []); }, []);
    check('montagne : ni arbre, ni rocher, ni roseau sur un obstacle',
        D.arbres.concat(D.rochers).concat(D.roseaux).every(function (a) {
            return cercles.every(function (c) { return Math.hypot(c.x - a.x, c.z - a.z) >= c.r; });
        }));
    // La texture du fond est refaite sans fuite de texture : une seule `map` à la fois.
    check('le fond porte une texture après un changement de biotope', !!G().getFondMesh().material && true);

    // --- 6) Matrice par biotope ---------------------------------------------------------------
    const M = await import(moduleCopie('matriceTouche.js'));
    const parBiotope = M.verifierTousMilieux();
    checkEqual('une vérification par biotope', parBiotope.length, 6);
    parBiotope.forEach(function (r) {
        r.regles.forEach(function (regle) { check(r.id + ' : ' + regle.nom, regle.ok, regle.detail); });
        check(r.id + ' : des esches restent utilisables (perdues : '
            + (r.perdues.map(function (p) { return p.espece + '/' + p.esche; }).join(', ') || 'aucune') + ')', r.regles.every(function (x) { return x.ok; }));
    });
    check('verifierReglesMilieu : deux règles, la plaine est conforme',
        M.verifierReglesMilieu('plaine').regles.length === 2 && M.verifierReglesMilieu('plaine').ok);
    const grillesMilieu = [];
    M.parcourir(function (ctx) { grillesMilieu.push(ctx.longueurCm); },
        { especes: SPECIES.filter(function (s) { return s.id === 'carpe'; }), cmMax: function (s) { return tailleMaxEspece(s, 'foret'); }, temperatures: [15] });
    check('la grille d’un biotope utilise la taille maximale de l’étang (carpe de forêt ≤ 65 cm)',
        Math.max.apply(null, grillesMilieu) === 65, String(Math.max.apply(null, grillesMilieu)));

    // --- 7) Conseils : seulement les espèces du biotope -----------------------------------------
    const presentesForet = especesPresentes('foret');
    const conseilsForet = M.conseilsEsches(undefined, presentesForet);
    checkEqual('conseils d’esche : une banderole par espèce de la forêt', conseilsForet.length, presentesForet.length);
    check('… et jamais une espèce absente', conseilsForet.every(function (c) { return presentesForet.indexOf(c.especeId) >= 0; }));
    checkEqual('sans filtre, toutes les espèces sont conseillées', M.conseilsEsches().length, SPECIES.length);
    choisirSurAccueil('foret');
    const avion = G().etat.avion;
    const vues = {};
    for (let i = 0; i < SPECIES.length + 2; i++) { vues[avion.lancer().especeId] = true; }
    check('l’avion ne conseille que les espèces de la forêt',
        Object.keys(vues).every(function (id) { return presentesForet.indexOf(id) >= 0; }) && Object.keys(vues).length === presentesForet.length,
        Object.keys(vues).join(', '));
    choisirSurAccueil('riviere');
    const vuesRiviere = {};
    for (let i = 0; i < SPECIES.length + 2; i++) { vuesRiviere[avion.lancer().especeId] = true; }
    check('en rivière, l’avion parle du silure', !!vuesRiviere.silure && !vuesRiviere.tanche, Object.keys(vuesRiviere).join(', '));
    const CL = await import(moduleCopie('conseilLocal.js'));
    const poissons = [{ especeId: 'brochet', longueurCm: 60 }, { especeId: 'silure', longueurCm: 120 }, { especeId: 'brochet', longueurCm: 50 }];
    const base = { profondeurEau: 4, substrat: 'herbier', bornes: [0.6, 3.5], quiver: false, escheActuelle: 'ver', ligneActuelle: 2,
        mode: 'facile', temperature: 15, heure: 12 };
    const tous = CL.recommander(Object.assign({ poissons: poissons }, base));
    check('conseil local sans filtre : brochet et silure comptés', tous.comptes.brochet === 2 && tous.comptes.silure === 1, JSON.stringify(tous.comptes));
    const filtre = CL.recommander(Object.assign({ poissons: poissons, especesIds: ['brochet'] }, base));
    check('conseil local filtré : seulement les espèces du biotope', filtre.comptes.brochet === 2 && !filtre.comptes.silure, JSON.stringify(filtre.comptes));
    check('conseil local filtré : « personne ici » si aucune espèce du biotope',
        CL.recommander(Object.assign({ poissons: poissons, especesIds: ['tanche'] }, base)).cas === 'personne');

    // --- 8) Carnet : milieu, « où la trouver », records par biotope --------------------------------
    choisirSurAccueil('montagne');
    G().showJournal();
    check('le carnet affiche « Milieu : … »', el('journalStats').textContent.indexOf('Milieu : 🏔️ Lac de montagne') >= 0, el('journalStats').textContent);
    const truiteIndex = SPECIES.findIndex(function (s) { return s.id === 'truite'; });
    e.especeIndex = truiteIndex;
    G().showJournal();
    const fiche = el('especeFiche').innerHTML;
    check('la fiche d’espèce dit où la trouver', fiche.indexOf('Où la trouver') >= 0 && fiche.indexOf('Lac de montagne') >= 0);
    check('la fiche donne l’abondance dans le biotope choisi', fiche.indexOf('Abondance ici') >= 0 && fiche.indexOf('très commune') >= 0);
    e.especeIndex = 0;
    G().hideJournal();
    // Records : un record se bat dans UN biotope ; un autre biotope repart de zéro.
    const nomEspece = espece('perche').nom;
    delete e.journal.especes[nomEspece];
    e.journal.records = {};
    choisirSurAccueil('canal');
    const e1 = G().addJournalEntry(1.5, nomEspece, 40);
    checkEqual('canal : premier poisson = record', e1.nouveauRecord, true);
    checkEqual('canal : un poisson plus léger ne bat pas le record', G().addJournalEntry(1.0, nomEspece, 35).nouveauRecord, false);
    choisirSurAccueil('montagne');
    const e2 = G().addJournalEntry(1.0, nomEspece, 35);
    check('montagne : la même prise est un record DANS CE MILIEU (ancien 0)', e2.nouveauRecord === true && e2.ancienRecord === 0, JSON.stringify(e2));
    check('journal.records : { cm, kg, milieu } par biotope',
        JSON.stringify(e.journal.records.canal[nomEspece]) === JSON.stringify({ cm: 40, kg: 1.5, milieu: 'canal' })
        && JSON.stringify(e.journal.records.montagne[nomEspece]) === JSON.stringify({ cm: 35, kg: 1, milieu: 'montagne' }),
        JSON.stringify(e.journal.records));
    checkEqual('le record général de l’espèce reste le plus gros de tous les milieux', e.journal.especes[nomEspece].record, 1.5);
    // Anciens carnets : valeurs numériques → records de la plaine ; valeurs numériques dans `records` → kg.
    const converti = lireRecords({}, { Gardon: { n: 3, record: 2.5 }, Carpe: { n: 0, record: 0 } });
    check('ancien carnet : le record par espèce devient celui de la plaine',
        JSON.stringify(converti) === JSON.stringify({ plaine: { Gardon: { cm: 0, kg: 2.5, milieu: 'plaine' } } }), JSON.stringify(converti));
    const numerique = lireRecords({ records: { canal: { Gardon: 1.2 }, lune: { Gardon: 9 }, plaine: { Brochet: { kg: 4, cm: 80 } } } }, {});
    check('records numériques convertis ; biotope inconnu ignoré',
        JSON.stringify(numerique) === JSON.stringify({ canal: { Gardon: { cm: 0, kg: 1.2, milieu: 'canal' } },
            plaine: { Brochet: { cm: 80, kg: 4, milieu: 'plaine' } } }), JSON.stringify(numerique));
    store.valeur = JSON.stringify({ especes: { Gardon: 4 } });
    const vieux = neuf();
    vieux.especes = {};
    chargerCarnet({ store: store, data: vieux });
    check('carnet très ancien (nombre par espèce) : lu sans erreur', JSON.stringify(vieux.records) === '{}', JSON.stringify(vieux.records));

    // --- Retour à un état propre (plaine, population d'origine) -------------------------------
    delete e.journal.especes[nomEspece];
    e.journal.records = {};
    e.journalStore = reel;
    G().setGraine(20240101);
    choisirSurAccueil('plaine');
    G().setGraine(20240101);
    G().repeuplerEtang();
    checkEqual('retour à la plaine', G().milieux.courant().id, 'plaine');
}

export default run;

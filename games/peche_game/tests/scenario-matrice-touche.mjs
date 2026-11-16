// ---------------------------------------------------------------------------
// Scénario : MATRICE DE LA CHANCE DE TOUCHE (chanceTouche.js, demande du joueur 2026-11-16).
//
// But : vérifier en ~1 s que tout changement de paramètre du jeu (esches, espèces, profondeurs,
// fonds, thermocline, heure, pression…) ne casse pas la mécanique « un poisson mord ».
//
//  1. MATRICE : espèces × tailles × esches × profondeurs d'eau × lignes × fonds × températures
//     (+ quiver), évaluée par la fonction UNIQUE evaluerTouche, avec des règles générales :
//     chaque espèce est pêchable, chaque esche sert, l'hameçon nu fait toujours moins bien, une
//     chance nulle a toujours une raison, le mode facile ne bloque que l'hameçon pris…
//  2. DÉLAI : heure × pression × tendance × température × espèce, toujours borné.
//  3. CONCORDANCE : le VRAI jeu (poisson posé à côté de l'hameçon) suit evaluerTouche.
//
// MATRICE_CSV=chemin node tests/run.mjs : écrit le résumé (espèce × esche) dans un fichier CSV.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import { SPECIES } from '../especes.js';
import { ESCHES } from '../esches.js';
import { group, check, checkEqual, G, moduleCopie, state, stepUntil, resetToIdle, clearLilyPads, castTo, parkFish } from './harness.mjs';

const SUBSTRATS = ['sable', 'gravier', 'vase', 'roche', 'herbier'];
const EAUX = [1.5, 3, 4.5, 6, 8];              // profondeur d'eau (unités) : bord → fosse
const LIGNES = [0.75, 1.5, 2.5, 3.5, 5, 7];    // longueur de ligne (unités)
const TEMPERATURES = [5, 15, 24];              // hiver, eau brassée, été (thermocline)
const ESCHES_IDS = ESCHES.map(e => e.id).concat([null]);   // null = hameçon nu
const FOSSE = ['silure', 'anguille', 'sandre'];
const PORTEE_BORD = 4.5;                       // ≈ eau au plus loin d'un lancer du bord (2,2 m)

function tailles(e) { return [e.cm[0], Math.round((e.cm[0] + e.cm[1]) / 2), e.cm[1]]; }

export async function run() {
    group('Matrice de la chance de touche (chanceTouche.js)');
    const C = await import(moduleCopie('chanceTouche.js'));
    const t0 = Date.now();

    // --- 1. Matrice ---------------------------------------------------------------------
    let cas = 0;
    let incoherents = 0;
    let faciles = 0;
    let taillesHorsVifBouillette = 0;
    const meilleur = {};       // espèce → { chance, ctx }
    const parEsche = {};       // espèce|esche → { max, possibles, total }
    const meilleurDuBord = {}; // espèce → meilleure chance en eau ≤ PORTEE_BORD, normal, 15 °C
    function noter(ctx, r) {
        cas++;
        if (r.possible !== (r.raison === null) || (r.possible && !(r.chance > 0 && r.chance <= 1))
            || (!r.possible && r.chance !== 0) || (r.raison && !C.RAISONS[r.raison])) { incoherents++; }
        if (r.raison === 'taille' && ['bouillette', 'vif'].indexOf(ctx.esche) < 0) { taillesHorsVifBouillette++; }
        if (ctx.temperature !== 15) { return; }
        const cle = ctx.especeId + '|' + (ctx.esche || 'nu');
        const pe = parEsche[cle] || (parEsche[cle] = { max: 0, possibles: 0, total: 0, ctx: null });
        pe.total++;
        if (r.possible) { pe.possibles++; }
        if (r.chance > pe.max) { pe.max = r.chance; pe.ctx = ctx; }
        const m = meilleur[ctx.especeId];
        if (!m || r.chance > m.chance) { meilleur[ctx.especeId] = { chance: r.chance, ctx: ctx }; }
        if (ctx.profondeurEau <= PORTEE_BORD) {
            meilleurDuBord[ctx.especeId] = Math.max(meilleurDuBord[ctx.especeId] || 0, r.chance);
        }
    }
    SPECIES.forEach(function (e) {
        tailles(e).forEach(function (cm) {
            ESCHES_IDS.forEach(function (esche) {
                EAUX.forEach(function (eau) {
                    SUBSTRATS.forEach(function (substrat) {
                        TEMPERATURES.forEach(function (temperature) {
                            const base = { especeId: e.id, longueurCm: cm, esche: esche, profondeurEau: eau, substrat: substrat, temperature: temperature };
                            LIGNES.forEach(function (ligne) {
                                const ctx = Object.assign({ profondeurLigne: ligne }, base);
                                noter(ctx, C.evaluerTouche(ctx));
                                // Mode facile : seul l'hameçon pris empêche la touche.
                                const f = C.evaluerTouche(Object.assign({ mode: 'facile' }, ctx));
                                if (f.possible === (f.raison === 'accroche')) { faciles++; }
                            });
                            const q = Object.assign({ quiver: true, profondeurLigne: 0 }, base);
                            noter(q, C.evaluerTouche(q));
                        });
                    });
                });
            });
        });
    });
    checkEqual('matrice : chaque cas est cohérent (chance nulle ⇔ une raison connue)', incoherents, 0);
    checkEqual('mode facile : seul un hameçon pris au fond empêche la touche', faciles, 0);
    checkEqual('« trop petit » n’arrive qu’avec la bouillette ou le vif', taillesHorsVifBouillette, 0);
    const peuPechables = SPECIES.filter(e => !meilleur[e.id] || meilleur[e.id].chance < 0.5).map(e => e.id);
    check('chaque espèce a au moins une vraie façon d’être pêchée (chance ≥ 50 %)', peuPechables.length === 0, peuPechables.join(', '));
    const nuPasPire = SPECIES.filter(e => (parEsche[e.id + '|nu'] || { max: 0 }).max >= meilleur[e.id].chance).map(e => e.id);
    check('l’hameçon nu fait toujours moins bien que la meilleure esche', nuPasPire.length === 0, nuPasPire.join(', '));
    const escheInutile = ESCHES.filter(function (esche) {
        return !SPECIES.some(e => (parEsche[e.id + '|' + esche.id] || { max: 0 }).max >= meilleur[e.id].chance - 1e-9);
    }).map(e => e.id);
    check('chaque esche est la meilleure pour au moins une espèce', escheInutile.length === 0, escheInutile.join(', '));
    const fosseKo = FOSSE.filter(id => !meilleur[id] || meilleur[id].chance < 0.5);
    check('les poissons de fosse se pêchent en eau profonde', fosseKo.length === 0, fosseKo.join(', '));
    const horsBord = SPECIES.filter(e => FOSSE.indexOf(e.id) < 0 && (meilleurDuBord[e.id] || 0) < 0.3).map(e => e.id);
    check('hors fosses, chaque espèce se pêche aussi depuis le bord (eau ≤ 2,25 m, chance ≥ 30 %)', horsBord.length === 0, horsBord.join(', '));

    // --- 2. Délai (heure × pression × température × espèce) ---------------------------
    let horsBornes = 0;
    [0, 3, 6, 9, 12, 15, 18, 21].forEach(function (heure) {
        [[1022, 1], [1013, 0], [998, -1]].forEach(function (p) {
            TEMPERATURES.concat([28]).forEach(function (temperature) {
                SPECIES.forEach(function (e) {
                    const r = C.evaluerTouche({ especeId: e.id, longueurCm: e.cm[1], esche: 'ver', profondeurEau: 4, profondeurLigne: 2,
                        substrat: 'sable', heure: heure, pression: p[0], tendance: p[1], temperature: temperature });
                    cas++;
                    if (!(r.facteurDelai >= 0.5 && r.facteurDelai <= 3.5)) { horsBornes++; }
                });
            });
        });
    });
    checkEqual('délai de touche toujours borné (× 0,5 à × 3,5)', horsBornes, 0);
    const neutre = C.evaluerTouche({ especeId: 'gardon', longueurCm: 20, esche: 'ver', profondeurEau: 4, profondeurLigne: 2, substrat: 'sable' });
    checkEqual('midi, 1013 hPa stable, 15 °C : délai neutre (× 1)', Math.round(neutre.facteurDelai * 1000) / 1000, 1);
    const ms = Date.now() - t0;
    check(cas + ' cas évalués en moins de 3 s', ms < 3000, ms + ' ms');

    // CSV (sur demande) : meilleure chance par espèce × esche, et le réglage qui la donne.
    if (process.env.MATRICE_CSV) {
        const lignes = ['espece;esche;chance_max;cas_possibles_%;eau_m;ligne_m;fond;quiver'];
        SPECIES.forEach(function (e) {
            ESCHES_IDS.forEach(function (esche) {
                const pe = parEsche[e.id + '|' + (esche || 'nu')];
                const c = pe.ctx;
                lignes.push([e.id, esche || 'nu', pe.max.toFixed(2), Math.round(100 * pe.possibles / pe.total),
                    c ? (c.profondeurEau / 2).toFixed(2) : '', c && !c.quiver ? (c.profondeurLigne / 2).toFixed(2) : '',
                    c ? c.substrat : '', c && c.quiver ? 'oui' : ''].join(';'));
            });
        });
        fs.writeFileSync(process.env.MATRICE_CSV, lignes.join('\n') + '\n');
        console.log('  (matrice écrite dans ' + process.env.MATRICE_CSV + ')');
    }

    // --- 3. Concordance : le vrai jeu suit evaluerTouche --------------------------------
    const e = G().etat;
    e.eschesActives = true;
    G().setDifficulty('normal');
    const POINT = { x: 0, z: -25 };
    const scenarios = [
        { especeId: 'gardon', cm: 20, esche: 'pain', ligne: 1.0 },
        { especeId: 'brochet', cm: 80, esche: 'vif', ligne: 2.0 },
        { especeId: 'carpe', cm: 60, esche: 'vif', ligne: 3.25 },      // au fond, mais esche que la carpe ne mange pas
        { especeId: 'carpe', cm: 60, esche: 'mais', ligne: 1.0 },      // hors de la couche (carpe = fond)
        { especeId: 'carpe', cm: 15, esche: 'bouillette', ligne: 3.25 }, // trop petite
        { especeId: 'perche', cm: 30, esche: 'ver', ligne: 2.0 }
    ];
    scenarios.forEach(function (s) {
        resetToIdle();
        clearLilyPads();
        G().setWind(0, 0);
        G().setFloatType('coulisse');
        G().setProfondeur(s.ligne);
        e.equiperEsche(s.esche);
        castTo(POINT.x, POINT.z);
        parkFish();
        const v = G().getVerdictFond();
        const attendu = C.evaluerTouche({ especeId: s.especeId, longueurCm: s.cm, esche: s.esche, profondeurLigne: s.ligne,
            profondeurEau: v.profondeurEau, substrat: v.substrat, heure: G().getHeure(), pression: G().getPression(),
            tendance: G().getTendancePression(), temperature: G().getTemperatureEau() });
        const fish = G().spawnFish(SPECIES.find(sp => sp.id === s.especeId));
        const d = fish.userData;
        d.longueurCm = s.cm;
        d.homeX = G().floatGroup.position.x;
        d.homeZ = G().floatGroup.position.z;
        d.homeRadius = 20;
        d.depth = G().getHookDepth();
        fish.position.set(G().floatGroup.position.x + 0.4, G().getHookDepth() - d.topOffset, G().floatGroup.position.z);
        d.vx = 0;
        d.vz = 0;
        const mord = stepUntil(() => state() === 'bite', 4);
        const nom = s.especeId + ' ' + s.cm + ' cm + ' + s.esche + ' à ' + (s.ligne / 2) + ' m';
        checkEqual(nom + ' : même hauteur d’hameçon que le jeu', Math.round(attendu.hookY * 100), Math.round(G().getHookDepth() * 100));
        checkEqual(nom + ' : même délai que le jeu', Math.round(attendu.facteurDelai * 1000), Math.round(e.facteurTouche(d.comp) * 1000));
        if (!attendu.possible) {
            check(nom + ' : jamais de touche (' + C.RAISONS[attendu.raison] + ')', !mord, state());
        } else if (attendu.chance >= 0.85) {
            check(nom + ' : la touche arrive (chance ' + Math.round(attendu.chance * 100) + ' %)', mord, state());
        }
        resetToIdle();
        G().fishes.splice(G().fishes.indexOf(fish), 1);
    });
    resetToIdle();
    e.equiperEsche('ver');
    e.eschesActives = false;
}

// ---------------------------------------------------------------------------
// Scénario : MATRICE DE LA CHANCE DE TOUCHE (chanceTouche.js, demande du joueur 2026-11-16).
//
// But : vérifier en ~1 s que tout changement de paramètre du jeu (esches, espèces, profondeurs,
// fonds, thermocline, heure, pression…) ne casse pas la mécanique « un poisson mord ».
//
//  1. MATRICE : espèces × tailles × esches × profondeurs d'eau × lignes × fonds × températures
//     (+ quiver), évaluée par la fonction UNIQUE evaluerTouche, avec des règles générales :
//     chaque espèce est pêchable, chaque esche sert, l'hameçon nu fait toujours moins bien, une
//     chance nulle a toujours une raison, mode facile = chance 1 ou 0 (100 % au-dessus de 60 %)…
//  2. DÉLAI : heure × pression × tendance × température × espèce, toujours borné.
//  3. CONCORDANCE : le VRAI jeu (poisson posé à côté de l'hameçon) suit evaluerTouche.
//
// Les règles vivent dans matriceTouche.js (partagé avec la page matrice.html).
// MATRICE_CSV=chemin node tests/run.mjs : écrit le résumé (espèce × esche) dans un fichier CSV.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import { SPECIES } from '../especes.js';
import { group, check, checkEqual, G, moduleCopie, state, stepUntil, resetToIdle, clearLilyPads, castTo, parkFish } from './harness.mjs';

export async function run() {
    group('Matrice de la chance de touche (chanceTouche.js + matriceTouche.js)');
    const C = await import(moduleCopie('chanceTouche.js'));
    const M = await import(moduleCopie('matriceTouche.js'));
    const t0 = Date.now();

    // --- 1 et 2. Règles de la matrice (les MÊMES que la page matrice.html) ---------------
    const verif = M.verifierRegles();
    verif.regles.forEach(function (r) { check(r.nom, r.ok, r.detail); });
    const ms = Date.now() - t0;
    check(verif.cas + ' cas évalués en moins de 3 s', ms < 3000, ms + ' ms');
    // Points à surveiller : affichés seulement (décision d'équilibrage, jamais bloquants).
    M.aSurveiller(verif.resume).forEach(function (a) { console.log('  (à surveiller) ' + a.texte); });

    // CSV (sur demande) : meilleure chance par espèce × esche, et le réglage qui la donne.
    if (process.env.MATRICE_CSV) {
        const lignes = ['espece;esche;chance_max;cas_possibles_%;eau_m;ligne_m;fond;quiver'];
        SPECIES.forEach(function (e) {
            M.ESCHES_MATRICE.forEach(function (esche) {
                const pe = verif.resume.parEsche[e.id + '|' + (esche || 'nu')];
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

// ---------------------------------------------------------------------------
// Scénario 78 : PHYSIQUE DE L'EAU — heures actives et pression (idées.md §15.1, v186).
//
// Le délai avant le premier signal du bouchon (3 à 8 s) est multiplié par UN facteur :
//     facteurTouche = limiter( facteur horaire × facteur de pression )
//  - aube et crépuscule = meilleures heures ; la nuit favorise les nocturnes, défavorise les diurnes ;
//  - la pression vient de la météo : elle chute avant l'orage (pêche fermée), remonte après la pluie ;
//  - le facteur est déterministe (aucun tirage), borné, et lisible dans le HUD ;
//  - crochets de test : setHeure, setMeteo, setPression, getFacteurTouche.
// ---------------------------------------------------------------------------
import {
    heureDeJeu, phaseDeHeure, activiteHoraire, facteurHoraire, facteurPression, limiterFacteur,
    periodeDeJournee, texteHeure, flecheTendance, PRESSION_CIBLE, PRESSION_NORMALE,
    FACTEUR_MIN, FACTEUR_MAX, ACTIVITE_MIN, A_REF
} from '../physique.js';
import {
    group, check, checkEqual, checkClose,
    G, el, state, step, stepFor, resetToIdle, clearLilyPads, castTo, forceBite, strike
} from './harness.mjs';

const POINT = { x: 0, z: -25 };

/** Lance, attend la touche d'un poisson (diurne ou nocturne) et mesure ses délais (secondes de jeu). */
function mesurerTouche(heure, nocturne, graine) {
    G().setHeure(heure);
    G().setGraine(graine);
    resetToIdle();
    clearLilyPads();
    castTo(POINT.x, POINT.z);
    forceBite(nocturne);
    const premier = G().etat.biteSinkAt;          // délai tiré pour le 1er signal (× facteur)
    let t = 0;
    while (G().getBitePhase() !== 'touche' && t < 250) {
        step(0.05);
        t += 0.05;
    }
    return { premier, total: t, phase: G().getBitePhase() };
}

export function run() {
    group('78) Physique de l’eau : heures actives et pression (§15.1)');

    // --- 1) L'heure de jeu et le cycle du ciel disent la même chose ------------------
    checkClose('dayPhase 0 = aube = 6 h', heureDeJeu(0), 6, 1e-9);
    checkClose('dayPhase 0,25 = midi = 12 h', heureDeJeu(0.25), 12, 1e-9);
    checkClose('dayPhase 0,5 = crépuscule = 18 h', heureDeJeu(0.5), 18, 1e-9);
    checkClose('dayPhase 0,75 = minuit', heureDeJeu(0.75), 0, 1e-9);
    checkClose('phaseDeHeure est la réciproque', heureDeJeu(phaseDeHeure(15.5)), 15.5, 1e-9);
    checkEqual('6 h 30 se lit « 6 h 30 »', texteHeure(6.5), '6 h 30');
    checkEqual('minuit se lit « 0 h 00 »', texteHeure(0), '0 h 00');
    checkEqual('période à 6 h 30', periodeDeJournee(6.5), 'aube');
    checkEqual('période à 12 h', periodeDeJournee(12), 'midi');
    checkEqual('période à 18 h', periodeDeJournee(18), 'crépuscule');
    checkEqual('période à 23 h', periodeDeJournee(23), 'nuit');

    // --- 2) Facteur horaire : aube / crépuscule, diurnes et nocturnes ----------------
    const fDiurne = h => facteurHoraire(h, false);
    const fNocturne = h => facteurHoraire(h, true);
    check('diurne : l’aube mord plus vite que midi', fDiurne(6) < fDiurne(12),
        fDiurne(6).toFixed(2) + ' < ' + fDiurne(12).toFixed(2));
    check('diurne : le crépuscule mord plus vite que midi', fDiurne(18) < fDiurne(12),
        fDiurne(18).toFixed(2) + ' < ' + fDiurne(12).toFixed(2));
    check('diurne : midi mord plus vite que minuit', fDiurne(12) < fDiurne(0),
        fDiurne(12).toFixed(2) + ' < ' + fDiurne(0).toFixed(2));
    check('nocturne : la nuit mord plus vite qu’à midi (l’inverse du diurne)', fNocturne(0) < fNocturne(12),
        fNocturne(0).toFixed(2) + ' < ' + fNocturne(12).toFixed(2));
    check('nocturne : l’aube et le crépuscule restent les meilleures heures',
        fNocturne(6) <= fNocturne(0) && fNocturne(18) <= fNocturne(0),
        fNocturne(6).toFixed(2) + ' / ' + fNocturne(18).toFixed(2));
    check('la nuit, le nocturne mord plus vite que le diurne', fNocturne(0) < fDiurne(0),
        fNocturne(0).toFixed(2) + ' < ' + fDiurne(0).toFixed(2));
    check('à midi, le diurne mord plus vite que le nocturne', fDiurne(12) < fNocturne(12),
        fDiurne(12).toFixed(2) + ' < ' + fNocturne(12).toFixed(2));
    checkClose('midi, diurne : facteur neutre (× 1)', fDiurne(12), 1, 0.01);
    checkClose('minuit, nocturne : facteur neutre (× 1)', fNocturne(0), 1, 0.01);
    check('la meilleure heure raccourcit le délai de 25 % environ', Math.abs(fDiurne(6) - A_REF) < 0.01,
        fDiurne(6).toFixed(3));
    check('la pire heure ne dépasse jamais × 2,5', fDiurne(0) <= A_REF / ACTIVITE_MIN + 1e-9,
        fDiurne(0).toFixed(2));

    // Tout le cycle : fini, jamais ≈ 0, jamais interminable, continu (aucun à-coup).
    let borne = true;
    let continu = true;
    let precedent = null;
    for (let h = 0; h <= 24; h += 0.05) {
        for (const nocturne of [false, true]) {
            const a = activiteHoraire(h, nocturne);
            const f = facteurHoraire(h, nocturne);
            if (!Number.isFinite(f) || a < ACTIVITE_MIN - 1e-9 || a > 1 + 1e-9 || f < 0.7 || f > 2.5001) {
                borne = false;
            }
        }
        const f = fDiurne(h);
        if (precedent !== null && Math.abs(f - precedent) > 0.12) { continu = false; }
        precedent = f;
    }
    check('sur 24 h, activité ∈ [0,30 ; 1] et facteur horaire ∈ [0,75 ; 2,5]', borne);
    check('le facteur horaire varie sans à-coup (pas de 3 min < 0,12)', continu);

    // --- 3) Pression : dérivée de la météo, tendance, facteur -------------------------
    check('la pression des cibles : beau > rafales > pluie',
        PRESSION_CIBLE.beau > PRESSION_CIBLE.rafales && PRESSION_CIBLE.rafales > PRESSION_CIBLE.pluie,
        JSON.stringify(PRESSION_CIBLE));
    const stable = facteurPression(PRESSION_NORMALE, 0);
    checkClose('pression normale et stable : facteur neutre', stable, 1, 1e-9);
    check('la pression qui MONTE raccourcit le délai', facteurPression(PRESSION_NORMALE, 1) < stable,
        facteurPression(PRESSION_NORMALE, 1).toFixed(2));
    check('la pression qui CHUTE allonge le délai (pêche fermée)', facteurPression(PRESSION_NORMALE, -1) > 2,
        facteurPression(PRESSION_NORMALE, -1).toFixed(2));
    check('chute plus marquée = délai plus long', facteurPression(1010, -1) > facteurPression(1010, -0.4));
    check('basse pression stable : un peu plus lent que haute pression stable',
        facteurPression(998, 0) > facteurPression(1022, 0),
        facteurPression(998, 0).toFixed(2) + ' > ' + facteurPression(1022, 0).toFixed(2));
    let pressionBornee = true;
    for (let p = 950; p <= 1060; p += 5) {
        for (let t = -3; t <= 3; t += 0.25) {
            const f = limiterFacteur(facteurHoraire(0, false) * facteurPression(p, t));
            if (!Number.isFinite(f) || f < FACTEUR_MIN || f > FACTEUR_MAX) { pressionBornee = false; }
        }
    }
    check('facteur total borné [' + FACTEUR_MIN + ' ; ' + FACTEUR_MAX + '] pour toute pression et toute tendance',
        pressionBornee);
    checkEqual('la tendance se lit ↗', flecheTendance(0.8), '↗');
    checkEqual('la tendance se lit ↘', flecheTendance(-0.8), '↘');
    checkEqual('la tendance stable se lit →', flecheTendance(0.05), '→');

    // --- 4) Crochets de test : l'heure et la météo sont pilotables --------------------
    G().setPression(null);                              // la pression suit de nouveau la météo
    G().setHeure(6);
    check('setHeure impose l’heure (aube)', Math.abs(G().getHeure() - 6) < 1e-6, String(G().getHeure()));
    stepFor(6);
    check('l’horloge est gelée par setHeure', Math.abs(G().getHeure() - 6) < 1e-6, String(G().getHeure()));
    G().setHeure(null);
    stepFor(20);
    check('setHeure(null) relance l’horloge', G().getHeure() > 6.5, G().getHeure().toFixed(2));
    G().setHeure(12);
    G().setMeteo('beau');
    stepFor(100);                                       // plus que la durée du beau temps : la météo est figée
    checkEqual('setMeteo fige le cycle de la météo', G().getWeather(), 'beau');
    check('beau temps durable : haute pression', G().getPression() > PRESSION_CIBLE.beau - 1,
        G().getPression().toFixed(1) + ' hPa');
    check('beau temps durable : tendance stable', Math.abs(G().getTendancePression()) < 0.1,
        G().getTendancePression().toFixed(2));
    const fBeau = G().getFacteurTouche('carpe');

    // Chute avant l'orage : les rafales font baisser la pression.
    G().setMeteo('rafales');
    stepFor(8);
    check('rafales : la pression CHUTE (tendance < 0)', G().getTendancePression() < -0.25,
        G().getTendancePression().toFixed(2));
    const fChute = G().getFacteurTouche('carpe');
    check('la chute de pression ALLONGE le délai de touche', fChute > fBeau * 1.5,
        fChute.toFixed(2) + ' contre ' + fBeau.toFixed(2));
    check('pêche presque fermée avant l’orage (× 1,8 au moins)', fChute >= 1.8, fChute.toFixed(2));

    // La pluie s'installe : basse pression, la tendance retombe.
    G().setMeteo('pluie');
    stepFor(120);
    check('pluie durable : basse pression', G().getPression() < PRESSION_CIBLE.pluie + 1,
        G().getPression().toFixed(1) + ' hPa');
    check('pluie durable : tendance ≈ stable', Math.abs(G().getTendancePression()) < 0.1,
        G().getTendancePression().toFixed(2));
    const fPluie = G().getFacteurTouche('carpe');

    // Coup de feu juste après la pluie : la pression remonte.
    G().setMeteo('beau');
    stepFor(8);
    check('retour du beau temps : la pression MONTE (tendance > 0)', G().getTendancePression() > 0.25,
        G().getTendancePression().toFixed(2));
    const fApres = G().getFacteurTouche('carpe');
    check('après la pluie, le délai de touche RACCOURCIT (coup de feu)', fApres < fBeau && fApres < fPluie,
        fApres.toFixed(2) + ' < beau ' + fBeau.toFixed(2) + ' et pluie ' + fPluie.toFixed(2));
    stepFor(120);
    check('puis la pression se stabilise : le coup de feu retombe', G().getFacteurTouche('carpe') > fApres,
        G().getFacteurTouche('carpe').toFixed(2));
    G().setMeteo('beau');

    // --- 5) Déterminisme : lire le facteur ne tire rien ------------------------------
    G().setPression(1013, 0);
    G().setHeure(12);
    const graineAvant = G().getGraine();
    for (let i = 0; i < 20; i++) { G().getFacteurTouche('sandre'); G().getFacteurTouche('carpe'); }
    checkEqual('lire le facteur ne consomme aucun tirage aléatoire', G().getGraine(), graineAvant);
    G().setHeure(6.5);
    const a1 = G().getFacteurTouche('sandre');
    const a2 = G().getFacteurTouche('sandre');
    checkEqual('le facteur est déterministe (même heure, même valeur)', a1, a2);

    // --- 6) Espèces réelles : sandre (nocturne) contre carpe (diurne) -----------------
    G().setPression(1013, 0);
    G().setHeure(0);
    check('minuit : le sandre (nocturne) mord plus vite que la carpe',
        G().getFacteurTouche('sandre') < G().getFacteurTouche('carpe'),
        G().getFacteurTouche('sandre').toFixed(2) + ' < ' + G().getFacteurTouche('carpe').toFixed(2));
    ['sandre', 'silure', 'anguille', 'tanche'].forEach(function (espece) {
        G().setHeure(0);
        const nuit = G().getFacteurTouche(espece);
        G().setHeure(12);
        const midi = G().getFacteurTouche(espece);
        check(espece + ' (nocturne) : plus rapide la nuit qu’à midi', nuit < midi,
            nuit.toFixed(2) + ' < ' + midi.toFixed(2));
    });
    ['carpe', 'gardon', 'brochet', 'perche'].forEach(function (espece) {
        G().setHeure(0);
        const nuit = G().getFacteurTouche(espece);
        G().setHeure(12);
        const midi = G().getFacteurTouche(espece);
        check(espece + ' (diurne) : plus lent la nuit qu’à midi', nuit > midi,
            nuit.toFixed(2) + ' > ' + midi.toFixed(2));
    });

    // --- 7) Effet RÉEL sur le jeu : le délai de touche du bouchon ----------------------
    G().setPression(1013, 0);
    const SOMME = { aube: 0, midi: 0, nuitDiurne: 0, nuitNocturne: 0, midiNocturne: 0 };
    let premiersBornes = true;
    let touchesAtteintes = true;
    for (let i = 0; i < 6; i++) {
        const graine = 5000 + i;
        const aube = mesurerTouche(6.5, false, graine);
        const midi = mesurerTouche(12, false, graine);
        const nuitD = mesurerTouche(0, false, graine);
        const nuitN = mesurerTouche(0, true, graine);
        const midiN = mesurerTouche(12, true, graine);
        SOMME.aube += aube.total;
        SOMME.midi += midi.total;
        SOMME.nuitDiurne += nuitD.total;
        SOMME.nuitNocturne += nuitN.total;
        SOMME.midiNocturne += midiN.total;
        [[aube, 6.5, false], [midi, 12, false], [nuitD, 0, false], [nuitN, 0, true], [midiN, 12, true]]
            .forEach(function (cas) {
                G().setHeure(cas[1]);
                const f = G().getFacteurTouche({ nocturne: cas[2] });
                if (cas[0].premier < 1.5 * f - 1e-6 || cas[0].premier > 4 * f + 1e-6) { premiersBornes = false; }
                if (cas[0].phase !== 'touche') { touchesAtteintes = false; }
            });
    }
    // ATTENDU MODIFIÉ (2026-11-17) : [3 ; 8] → [1,5 ; 4] (« la touche met du temps à venir »).
    check('le délai du 1er signal reste dans [1,5 ; 4] × facteur (rien de tiré en plus)', premiersBornes);
    check('la vraie touche arrive toujours (aube, midi, nuit, diurne et nocturne)', touchesAtteintes);
    check('diurne : la touche vient plus vite à l’aube qu’à midi (' + SOMME.aube.toFixed(0) + ' s contre '
        + SOMME.midi.toFixed(0) + ' s)', SOMME.aube < SOMME.midi);
    check('diurne : la touche vient plus vite à midi que la nuit (' + SOMME.midi.toFixed(0) + ' s contre '
        + SOMME.nuitDiurne.toFixed(0) + ' s)', SOMME.midi < SOMME.nuitDiurne);
    check('nocturne : la touche vient plus vite la nuit qu’à midi (' + SOMME.nuitNocturne.toFixed(0) + ' s contre '
        + SOMME.midiNocturne.toFixed(0) + ' s)', SOMME.nuitNocturne < SOMME.midiNocturne);
    check('la nuit, le nocturne devance le diurne (' + SOMME.nuitNocturne.toFixed(0) + ' s contre '
        + SOMME.nuitDiurne.toFixed(0) + ' s)', SOMME.nuitNocturne < SOMME.nuitDiurne);

    // Pêche possible de bout en bout à l'aube et de nuit.
    [[6.5, false, 'à l’aube'], [0, true, 'de nuit (nocturne)'], [0, false, 'de nuit (diurne, lent)']]
        .forEach(function (cas) {
            G().setHeure(cas[0]);
            G().setGraine(777);
            resetToIdle();
            clearLilyPads();
            castTo(POINT.x, POINT.z);
            forceBite(cas[1]);
            let t = 0;
            while (G().getBitePhase() !== 'touche' && t < 250) { step(0.05); t += 0.05; }
            strike();
            checkEqual('on peut pêcher ' + cas[2] + ' : le poisson est ferré', state(), 'struggle');
            resetToIdle();
        });

    // --- 8) Lisible : heure, période et pression dans le HUD, sans popup ---------------
    G().setPression(1013, 0);
    G().setHeure(6.5);
    step(0.1);
    const hud = el('heureEau').textContent;
    check('HUD : l’heure s’affiche', hud.indexOf('6 h 30') >= 0, hud);
    check('HUD : la période s’affiche', hud.indexOf('aube') >= 0, hud);
    check('HUD : la pression s’affiche', hud.indexOf('1013 hPa') >= 0, hud);
    G().setHeure(23);
    G().setPression(1000, -0.8);
    step(0.1);
    check('HUD : la nuit et la chute de pression se lisent',
        el('heureEau').textContent.indexOf('nuit') >= 0 && el('heureEau').textContent.indexOf('↘') >= 0,
        el('heureEau').textContent);
    G().setPression(1024, 0.8);
    step(0.1);
    check('HUD : la hausse de pression se lit', el('heureEau').textContent.indexOf('↗') >= 0,
        el('heureEau').textContent);
    checkEqual('le HUD est une ligne de texte (aucune popup 3D ajoutée)', G().getTexteConditions(),
        el('heureEau').textContent);

    // Retour aux conditions neutres pour la suite.
    G().setPression(1013, 0);
    G().setHeure(12);
}

export default run;

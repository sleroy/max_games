// ---------------------------------------------------------------------------
// Scénario 74 : la détection du FOND se fait SOUS LE BOUCHON (§14.8, v180).
//
// La profondeur de la ligne (longueur bouchon → hameçon) se choisit avant le lancer ;
// le fond se juge là où est le bouchon — à l'arrivée ET après chaque dérive au vent —
// avec UNE seule fonction (verdictFond). Le schéma de coupe lit la même.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import {
    GAME_DIR, group, check, checkEqual, checkClose,
    G, el, state, step, stepFor, resetToIdle, clearLilyPads, castTo
} from './harness.mjs';

const POINTS_DE_VISEE = [];
for (let x = -40; x <= 40; x += 2) {
    for (let z = -50; z <= -8; z += 2) { POINTS_DE_VISEE.push({ x, z }); }
}

/**
 * Cherche, dans la zone de lancer, un point P profond d'où une dérive de 3,8 unités fait
 * perdre le plus de profondeur : l'eau y est nettement moins profonde en Q (bord d'une fosse).
 */
function trouverPente() {
    let meilleur = null;
    POINTS_DE_VISEE.forEach(function (p) {
        const dp = G().profondeurLocale(p.x, p.z);
        if (dp < 2.0) { return; }
        for (let a = 0; a < 16; a++) {
            const dir = a * Math.PI / 8;
            const q = { x: p.x + Math.cos(dir) * 3.8, z: p.z + Math.sin(dir) * 3.8 };
            const dq = G().profondeurLocale(q.x, q.z);
            if (!meilleur || dp - dq > meilleur.ecart) {
                meilleur = { p, q, dir, dp, dq, ecart: dp - dq };
            }
        }
    });
    // Longueur de ligne entre les deux seuils : pas de vase en P, vase en Q.
    meilleur.longueur = Math.round(((meilleur.dp - 0.5) + (meilleur.dq - 0.5)) / 2 * 4) / 4;
    return meilleur;
}

/** Compte les accrochages (sound.snag est appelé par startSnag). */
function espionSnag() {
    const son = G().sound;
    const original = son.snag;
    let n = 0;
    son.snag = function () { n++; return original.apply(son, arguments); };
    return {
        get compte() { return n; },
        rendre() { son.snag = original; }
    };
}

function preparer() {
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setFloatType('coulisse');
}

function remettreAuStandard() {
    resetToIdle();
    G().setWind(0, 0);
    G().setFloatType('anglaise');
    G().setProfondeur(2.5);
}

export function run() {
    group('74) Fond sous le bouchon : un seul verdict, après dérive aussi (§14.8)');

    const pente = trouverPente();
    check('une pente existe à portée de lancer (≥ 0,8 unité sur 3,8)',
        pente.ecart >= 0.8,
        'P ' + pente.p.x + ',' + pente.p.z + ' : ' + pente.dp.toFixed(2) + ' → Q : ' + pente.dq.toFixed(2));
    check('la longueur choisie est dans les bornes du bouchon',
        pente.longueur >= 0.6 && pente.longueur <= 9, pente.longueur + ' unités');
    check('P : l’hameçon est au-dessus de la vase', pente.longueur <= pente.dp - 0.5 - 0.01);
    check('Q : le même hameçon serait dans la vase', pente.longueur > pente.dq - 0.5 + 0.01);

    // --- Aucune décision ne se prend plus avec le point visé --------------------
    const sources = ['script.js', 'comportement.js', 'ligne.js', 'carnetUI.js', 'environnement.js']
        .map(f => fs.readFileSync(path.join(GAME_DIR, f), 'utf8')).join('\n');
    checkEqual('plus aucun profondeurLocale(castTarget…) dans le jeu',
        /profondeurLocale\(\s*castTarget/.test(sources), false);
    checkEqual('le schéma de coupe et le jeu appellent la même fonction (verdictFond)',
        /verdictFond\(/.test(fs.readFileSync(path.join(GAME_DIR, 'ligne.js'), 'utf8'))
        && /verdictFond\(/.test(fs.readFileSync(path.join(GAME_DIR, 'comportement.js'), 'utf8')), true);

    // --- (a) Le verdict utilise la position du bouchon, pas castTarget ---------
    preparer();
    G().setProfondeur(pente.longueur);
    let espion = espionSnag();
    checkEqual('lancer en P : le bouchon flotte', castTo(pente.p.x, pente.p.z), 'inWater');
    const posArrivee = G().floatGroup.position.clone();
    checkClose('le bouchon arrive au point visé (x)', posArrivee.x, pente.p.x, 0.5);
    checkClose('le bouchon arrive au point visé (z)', posArrivee.z, pente.p.z, 0.5);
    checkEqual('en P, pas de vase', G().isHameconDansLaVase(), false);
    checkEqual('l’hameçon est donc à la profondeur choisie : longueur bouchon → hameçon',
        G().getHookDepth(), -G().getProfondeur());
    // On décale castTarget en Q (vase) : le bouchon, lui, reste en P.
    G().castTarget.x = pente.q.x;
    G().castTarget.z = pente.q.z;
    check('précondition : sous castTarget, l’hameçon serait dans la vase',
        G().profondeurLocale(G().castTarget.x, G().castTarget.z) - 0.5 < G().getProfondeur());
    step(1 / 60);
    checkEqual('le point visé ne décide plus : toujours à l’eau', state(), 'inWater');
    checkEqual('le point visé ne décide plus : pas de vase', G().isHameconDansLaVase(), false);
    checkEqual('aucun accrochage déclenché par le point visé', espion.compte, 0);
    // Inverse : le bouchon va en Q, castTarget reste en P : c'est le bouchon qui gagne.
    G().castTarget.x = pente.p.x;
    G().castTarget.z = pente.p.z;
    G().floatGroup.position.x = pente.q.x;
    G().floatGroup.position.z = pente.q.z;
    step(1 / 60);
    checkEqual('le bouchon est sur le haut-fond : l’hameçon s’accroche', state(), 'snag');
    checkEqual('le verdict est « dans la vase »', G().isHameconDansLaVase(), true);
    checkEqual('un seul accrochage', espion.compte, 1);
    espion.rendre();
    remettreAuStandard();

    // --- (b) Dérive au vent : le verdict est recalculé -------------------------
    preparer();
    G().setProfondeur(pente.longueur);
    espion = espionSnag();
    castTo(pente.p.x, pente.p.z);
    checkEqual('avant la dérive : à l’eau, pas de vase',
        state() === 'inWater' && !G().isHameconDansLaVase(), true);
    const longueurAvant = G().getProfondeur();
    G().setWind(pente.dir, 0.8);   // le vent pousse vers le haut-fond (0,48 unité/s)
    let t = 0;
    while (state() === 'inWater' && t < 20) { step(1 / 60); t += 1 / 60; }
    checkEqual('poussé vers le haut-fond, l’hameçon finit dans la vase (accrochage)', state(), 'snag');
    check('après ' + t.toFixed(1) + ' s de dérive', t > 1 && t < 20, t.toFixed(1) + ' s');
    checkEqual('le jeu sait que l’hameçon est dans la vase', G().isHameconDansLaVase(), true);
    const vers = G().floatGroup.position;
    check('le bouchon a vraiment dérivé vers Q',
        Math.hypot(vers.x - pente.p.x, vers.z - pente.p.z) > 0.5
        && Math.hypot(vers.x - pente.q.x, vers.z - pente.q.z) < Math.hypot(pente.p.x - pente.q.x, pente.p.z - pente.q.z));
    checkEqual('le verdict en direct (sous le bouchon) dit : vase', G().getVerdictFond().dansLaVase, true);
    checkEqual('la profondeur choisie n’est pas devenue une altitude (longueur inchangée)',
        G().getProfondeur(), longueurAvant);
    checkEqual('hameçon = −longueur du bas de ligne', G().getHookDepth(), -longueurAvant);
    checkEqual('un seul accrochage malgré les images qui suivent', (function () {
        stepFor(0.5);
        return espion.compte;
    }()), 1);
    espion.rendre();
    remettreAuStandard();

    // Le verdict se recalcule aussi dans l'autre sens (bouchon poussé vers l'eau profonde).
    preparer();
    G().setProfondeur(pente.longueur);
    castTo(pente.p.x, pente.p.z);
    G().etat.hameconDansLaVase = true;               // verdict périmé (avant la dérive)
    G().floatGroup.rotation.z = 1.45;                 // bouchon couché
    step(1 / 60);
    checkEqual('poussé en eau profonde, le bouchon n’est plus dans la vase', G().isHameconDansLaVase(), false);
    checkClose('le bouchon se redresse', G().floatGroup.rotation.z, 0, 1e-9);
    checkEqual('sans accrochage : toujours à l’eau', state(), 'inWater');
    remettreAuStandard();

    // --- Pas de spam d'accrochage ------------------------------------------------
    preparer();
    G().setProfondeur(pente.longueur);
    espion = espionSnag();
    castTo(pente.p.x, pente.p.z);
    G().floatGroup.position.x = pente.q.x;           // déjà dans la vase (verdict connu)
    G().floatGroup.position.z = pente.q.z;
    G().etat.hameconDansLaVase = true;
    stepFor(1);
    checkEqual('dans la vase depuis un moment : pas de nouvel accrochage par image',
        espion.compte + ':' + state(), '0:inWater');
    espion.rendre();
    remettreAuStandard();

    // Jamais pendant un combat.
    preparer();
    G().setProfondeur(2.5);
    espion = espionSnag();
    castTo(0, -30);
    G().floatGroup.position.x = pente.q.x;
    G().floatGroup.position.z = pente.q.z;
    G().setProfondeur(pente.longueur);
    G().etat.floatState = 'struggle';                 // épreuve de force simulée
    stepFor(0.2);
    check('pendant un combat, le fond ne déclenche aucun accrochage',
        espion.compte === 0 && state() !== 'snag', espion.compte + ' accrochage(s), état ' + state());
    espion.rendre();
    G().etat.floatState = 'inWater';
    remettreAuStandard();

    // --- (c) Le schéma de coupe affiche ce que le jeu décide, dérive comprise ---
    preparer();
    G().setProfondeur(pente.longueur);
    castTo(pente.p.x, pente.p.z);
    G().setWind(pente.dir, 0.8);
    let echantillons = 0;
    let ecarts = 0;
    const affichees = new Set();
    t = 0;
    let alerteVue = false;
    while (t < 12) {
        stepFor(0.25);
        t += 0.25;
        if (state() !== 'inWater' && state() !== 'snag') { break; }   // ligne cassée : plus de verdict
        G().majCoupeProfondeur();
        const pos = G().floatGroup.position;
        const vase = G().isHameconDansLaVase();   // la décision du jeu
        const texte = el('depthHint').textContent;
        const metres = (G().profondeurLocale(pos.x, pos.z) / 2).toFixed(1).replace('.', ',') + ' m';
        affichees.add(metres);
        echantillons++;
        const memeProfondeur = texte.indexOf('Fond à ' + metres) >= 0 || texte.indexOf('fond à ' + metres) >= 0;
        const memeVerdict = el('depthHook').classList.contains('danger') === vase
            && el('depthHint').classList.contains('alerte') === vase
            && (state() !== 'inWater' || G().getVerdictFond().dansLaVase === vase);
        if (!memeProfondeur || !memeVerdict) { ecarts++; }
        if (state() === 'snag' && el('depthHook').classList.contains('danger')) { alerteVue = true; }
    }
    checkEqual('schéma et jeu égaux à chaque instant (' + echantillons + ' mesures, dérive et vase comprises)', ecarts, 0);
    check('la profondeur affichée a bien suivi la dérive', affichees.size >= 2, Array.from(affichees).join(' → '));
    checkEqual('accroché dans la vase, le schéma alerte comme le jeu', alerteVue, true);
    remettreAuStandard();

    // --- (d) Bord ou fosse, même ligne : verdicts opposés ------------------------
    const bord = { x: 30, z: -10 };
    const fosse = { x: 20, z: -46 };
    const dBord = G().profondeurLocale(bord.x, bord.z);
    const dFosse = G().profondeurLocale(fosse.x, fosse.z);
    const longueur = Math.round(((dBord - 0.2) + (dFosse - 0.6)) / 2 * 4) / 4;
    check('précondition : une même ligne est trop longue au bord et courte en fosse',
        longueur > dBord - 0.5 && longueur <= dFosse - 0.5 && longueur <= 9,
        'bord ' + dBord.toFixed(2) + ' / fosse ' + dFosse.toFixed(2) + ' / ligne ' + longueur);
    preparer();
    G().setProfondeur(longueur);
    castTo(bord.x, bord.z);
    const auBord = { etat: state(), vase: G().isHameconDansLaVase() };
    G().majCoupeProfondeur();
    const alerteBord = el('depthHook').classList.contains('danger');
    resetToIdle();
    G().setProfondeur(longueur);
    castTo(fosse.x, fosse.z);
    const enFosse = { etat: state(), vase: G().isHameconDansLaVase() };
    G().majCoupeProfondeur();
    const alerteFosse = el('depthHook').classList.contains('danger');
    checkEqual('au bord : accrochage dans la vase', auBord.etat + '/' + auBord.vase, 'snag/true');
    checkEqual('en fosse, même profondeur de ligne : rien', enFosse.etat + '/' + enFosse.vase, 'inWater/false');
    checkEqual('le schéma alerte au bord', alerteBord, true);
    checkEqual('le schéma n’alerte pas en fosse', alerteFosse, false);
    checkEqual('même longueur de ligne dans les deux cas', G().getProfondeur(), longueur);
    remettreAuStandard();
}

export default run;

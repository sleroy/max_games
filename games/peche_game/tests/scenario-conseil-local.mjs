// ---------------------------------------------------------------------------
// Scénario : LE CONSEIL POUR CET ENDROIT (conseilLocal.js, demande du joueur 2026-11-16).
// Rien ne mord depuis 30 s (facile) ou 60 s (normal) : l'avion apporte le meilleur réglage pour les poissons
// à moins de 5 m du bouchon. Facile : espèces nommées ; normal : « Papa » conseille sans rien dévoiler ;
// dur : jamais. Un conseil par lancer, au plus un toutes les 3 minutes.
// ---------------------------------------------------------------------------
import { SPECIES } from '../especes.js';
import { group, check, checkEqual, G, moduleCopie, state, stepFor, resetToIdle, clearLilyPads, castTo, parkFish } from './harness.mjs';

const NOMS = SPECIES.map(s => s.nom.toLowerCase());

export async function run() {
    group('Conseil pour cet endroit quand rien ne mord (conseilLocal.js)');
    const L = await import(moduleCopie('conseilLocal.js'));
    const C = await import(moduleCopie('chanceTouche.js'));
    checkEqual('facile : après 30 s ; normal : après 60 s ; dur : jamais', [L.DELAI.facile, L.DELAI.normal, L.DELAI.dur].join(), '30,60,');
    checkEqual('rayon : 10 unités (5 m)', L.RAYON, 10);
    checkEqual('au plus un conseil toutes les 3 minutes', L.INTERVALLE_MIN, 180);

    // --- Modèle pur ---
    const ici = { profondeurEau: 4, substrat: 'vase', bornes: [0.6, 9], temperature: 15, heure: 12 };
    const banc = [1, 2, 3, 4].map(() => ({ especeId: 'gardon', longueurCm: 25 })).concat([{ especeId: 'carpe', longueurCm: 60 }]);
    const personne = L.recommander(Object.assign({ poissons: [], mode: 'facile' }, ici));
    checkEqual('aucun poisson proche : « lance ailleurs »', personne.cas, 'personne');
    const f = L.recommander(Object.assign({ poissons: banc, mode: 'facile', escheActuelle: 'mais', ligneActuelle: 3.25 }, ici));
    // Le gardon mord autant au pain qu'au ver (100 %) : les deux sont de bons conseils, le maïs de la carpe non.
    check('4 gardons et 1 carpe : une esche de gardon l’emporte (ils sont plus nombreux)', ['pain', 'ver'].indexOf(f.esche) >= 0, f.esche);
    check('… dans la couche du gardon (≤ 1,6 m)', f.ligne <= 3.2, f.ligne);
    checkEqual('facile : les espèces sont nommées', f.lignes[0], 'Ici : 4 gardons, 1 carpe');
    check('facile : la profondeur ET l’esche sont donnés, au décimètre', /^Pêche à \d+(,\d)? m · \S/.test(f.lignes[1]), f.lignes[1]);
    // Le conseil est vrai : il fait mieux que le réglage du joueur (mesuré avec la règle unique).
    const touches = (esche, ligne) => banc.reduce((t, p) => t + C.evaluerTouche(Object.assign({ especeId: p.especeId, longueurCm: p.longueurCm,
        esche: esche, profondeurLigne: ligne }, ici)).chance, 0);
    check('le conseil donne plus de touches que le réglage du joueur', touches(f.esche, f.ligne) > touches('mais', 3.25),
        touches(f.esche, f.ligne).toFixed(2) + ' contre ' + touches('mais', 3.25).toFixed(2));
    // Profondeur IDÉALE : le milieu de la zone où ça mord, pas son bord (source unique : chanceTouche.ligneIdeale).
    const lignesTest = [];
    for (let u = ici.bornes[0]; u <= ici.bornes[1] + 1e-9; u += 0.25) { lignesTest.push(Math.round(u * 100) / 100); }   // la grille du bouchon équipé
    const idealeDe = (esche) => C.ligneIdeale(lignesTest, l => banc.slice(0, 4).reduce((t, p) => t + C.evaluerTouche(Object.assign({ especeId: p.especeId,
        longueurCm: p.longueurCm, esche: esche, profondeurLigne: l }, ici)).chance, 0));
    const ideale = idealeDe(f.esche);
    check('le conseil donne le MILIEU du plateau (pas son bord)', f.ligne === ideale.ligne && f.ligne > ideale.plateau[0] && f.ligne < ideale.plateau[1],
        f.ligne + ' dans [' + ideale.plateau.join(' ; ') + ']');
    check('ligneIdeale : milieu du plateau, null sans touche possible',
        C.ligneIdeale([1, 2, 3, 4, 5], l => (l >= 2 && l <= 4 ? 1 : 0)).ligne === 3 && C.ligneIdeale([1, 2], () => 0).ligne === null);
    // Profondeur MOYENNE des poissons proches (dos à -2,0 ; -2,4 ; -2,2 → moyenne 2,2 unités = 1,1 m).
    const etages = [-2.0, -2.4, -2.2].map(prof => ({ especeId: 'perche', longueurCm: 25, profondeur: prof }));
    const m = L.recommander(Object.assign({ poissons: etages, mode: 'facile', escheActuelle: 'mais', ligneActuelle: 3.25 }, ici));
    check('la profondeur conseillée est la moyenne des poissons (≈ 2,2 unités)', m.source === 'moyenne' && Math.abs(m.ligne - 2.2) <= 0.13,
        m.source + ' ' + m.ligne);
    check('… et le message le dit', /vers 1,1 m$/.test(m.lignes[0]) && /^Pêche à 1,1 m · /.test(m.lignes[1]), m.lignes.join(' | '));
    const mn = L.recommander(Object.assign({ poissons: etages, mode: 'normal', escheActuelle: 'mais', ligneActuelle: 3.25 }, ici));
    checkEqual('normal : « c’est là que nagent les poissons »', mn.lignes[1], 'c’est là que nagent les poissons !');
    // Poissons trop étagés : la moyenne tomberait où rien ne mord → on retombe sur le milieu de la zone qui mord.
    const eclates = [{ especeId: 'gardon', longueurCm: 25, profondeur: -0.8 }, { especeId: 'gardon', longueurCm: 25, profondeur: -6 }];
    const ec = L.recommander(Object.assign({ poissons: eclates, mode: 'normal', escheActuelle: 'mais', ligneActuelle: 3.25 }, ici));
    check('poissons très étagés : le conseil reste dans une zone où ça mord', ec.cas === 'changer' && touches2(ec, eclates) > 0, ec.source + ' ' + ec.ligne);
    function touches2(r, ps) { return ps.reduce((t, p) => t + C.evaluerTouche(Object.assign({ especeId: p.especeId, longueurCm: p.longueurCm, esche: r.esche,
        profondeurLigne: r.ligne }, ici)).chance, 0); }
    const dansVase = L.recommander(Object.assign({ poissons: [{ especeId: 'carpe', longueurCm: 60, profondeur: -4.05 }], mode: 'facile', escheActuelle: 'ver',
        ligneActuelle: 2.1 }, ici, { profondeurEau: 4.5 }));
    check('une carpe au fond : le conseil reste au-dessus de la vase', dansVase.ligne <= 4.5 - 0.55 + 1e-9, dansVase.ligne);
    // La profondeur conseillée ne descend JAMAIS sous le fond : une ligne plus longue ne creuse rien.
    const profond = L.recommander({ poissons: [{ especeId: 'perche', longueurCm: 25, profondeur: -2.2 }], profondeurEau: 2.4,
        substrat: 'roche', bornes: [0.6, 9], mode: 'normal', escheActuelle: 'mais', ligneActuelle: 2.5, temperature: 15, heure: 12 });
    check('le conseil ne descend pas sous le fond (ligne ≤ profondeur d’eau)', profond.ligne <= 2.4 + 1e-9, profond.ligne);
    // La profondeur est celle des poissons RÉELLEMENT détectés, même quand le « plateau » serait plus haut.
    const detectes = [{ especeId: 'gardon', longueurCm: 25, profondeur: -1.5 }, { especeId: 'gardon', longueurCm: 25, profondeur: -1.7 }];
    const d2 = L.recommander(Object.assign({ poissons: detectes, mode: 'normal', escheActuelle: 'mais', ligneActuelle: 0.6 }, ici));
    check('la profondeur suit les poissons détectés (≈ 1,6 unité)', d2.source === 'moyenne' && Math.abs(d2.ligne - 1.6) <= 0.13,
        d2.source + ' ' + d2.ligne);
    check('… et la ligne conseillée n’est jamais muette', touches2(d2, detectes) > 0, d2.ligne);
    const n = L.recommander(Object.assign({ poissons: banc, mode: 'normal', escheActuelle: 'mais', ligneActuelle: 3.25 }, ici));
    check('normal : c’est Papa qui conseille', n.lignes[0].indexOf('Papa : pêche à ') === 0, n.lignes[0]);
    check('normal : aucune espèce n’est dévoilée', NOMS.every(nom => n.lignes.join(' ').toLowerCase().indexOf(nom) < 0), n.lignes.join(' | '));
    const bon = L.recommander(Object.assign({ poissons: banc, mode: 'normal', escheActuelle: f.esche, ligneActuelle: f.ligne }, ici));
    checkEqual('déjà le bon réglage : « patience »', bon.cas, 'bon');
    check('… et le message rappelle l’esche ET la profondeur à garder', /Papa : garde .* à \d+(,\d)? m/.test(bon.lignes[0]) && /patient/.test(bon.lignes[1]),
        bon.lignes.join(' | '));
    const bonFacile = L.recommander(Object.assign({ poissons: banc, mode: 'facile', escheActuelle: f.esche, ligneActuelle: f.ligne }, ici));
    check('facile : « Garde … à … m, patience ! »', /^Garde .* à \d+(,\d)? m, patience !$/.test(bonFacile.lignes[1]), bonFacile.lignes.join(' | '));
    const fond = L.recommander({ poissons: [{ especeId: 'carpe', longueurCm: 60 }], profondeurEau: 6, substrat: 'sable', bornes: [0.6, 2.6],
        mode: 'facile', escheActuelle: 'ver', ligneActuelle: 2.5, temperature: 15, heure: 12 });
    check('carpe au fond hors de portée du bouchon : il faut un bouchon plus long', fond.cas === 'changer' && fond.bouchonPlusLong
        && fond.ligne > 2.6 && /bouchon plus long/.test(fond.lignes.join(' ')), fond.cas + ' ' + fond.lignes.join(' | '));
    const q = L.recommander(Object.assign({ poissons: banc.slice(4), mode: 'facile', quiver: true, escheActuelle: 'ver' }, ici));
    check('au quiver : on ne parle que de l’esche (hameçon posé au fond)', q.esche === 'mais' && /au fond/.test(q.lignes[1]), q.lignes.join(' | '));
    check('au quiver : le conseil donne la profondeur RÉELLE de l’hameçon', /au fond, \d+(,\d)? m/.test(q.lignes[1]), q.lignes[1]);
    check('chaque message tient sur 2 lignes courtes (≤ 45 caractères)', [personne, f, n, bon, fond, q].every(r => r.lignes.length === 2
        && r.lignes.every(l => [...l].length <= 45)), [personne, f, n, bon, fond, q].map(r => r.lignes.join(' / ')).join(' ‖ '));

    // --- Dans le jeu ---
    const e = G().etat;
    const avion = e.avion;
    e.eschesActives = true;
    function attendre(mode, secondes) {
        G().setDifficulty(mode);
        resetToIdle();
        clearLilyPads();
        G().setWind(0, 0);
        e.equiperEsche('mais');   // personne ne le mange ici : aucune touche ne vient interrompre l'attente
        castTo(0, -25);
        parkFish();
        stepFor(secondes, 0.1);
        return avion.conseilCourant();
    }
    e.conseilLocal.reinitialiserDelai();
    checkEqual('normal : rien avant 60 s', (attendre('normal', 55) || {}).cle === 'conseil-local', false);
    stepFor(6, 0.1);
    const c1 = avion.conseilCourant();
    check('normal : après 60 s sans touche, l’avion apporte le conseil de Papa', !!c1 && c1.cle === 'conseil-local'
        && c1.lignes[0].indexOf('Papa') === 0, c1 && c1.texte);
    stepFor(30, 0.1);
    checkEqual('… un seul conseil par lancer', (avion.conseilCourant() || {}).cle === 'conseil-local', false);
    checkEqual('nouveau lancer avant 3 minutes : pas de nouveau conseil', (attendre('normal', 70) || {}).cle === 'conseil-local', false);
    e.conseilLocal.reinitialiserDelai();
    checkEqual('mode dur : jamais de conseil', (attendre('dur', 100) || {}).cle === 'conseil-local', false);
    // Facile : les poissons foncent sur l'hameçon (aimant) ; on retire l'étang le temps de l'attente.
    e.conseilLocal.reinitialiserDelai();
    const sauvegarde = G().fishes.splice(0, G().fishes.length);
    const c2 = attendre('facile', 31);
    check('facile : après 30 s, l’avion dit franchement ce qu’il y a ici', !!c2 && c2.cle === 'conseil-local' && c2.lignes[0].indexOf('Ici') === 0,
        c2 && c2.texte);
    checkEqual('le joueur pêchait bien le bouchon à l’eau pendant ce temps', state(), 'inWater');
    stepFor(30, 0.1);
    G().fishes.push(...sauvegarde);
    // Dans le jeu : les poissons posés près du bouchon, à une profondeur connue → la moyenne est lue sur eux.
    resetToIdle();
    clearLilyPads();
    G().setWind(0, 0);
    G().setDifficulty('facile');
    e.equiperEsche('mais');
    castTo(0, -25);
    parkFish();
    const proches = [1, 2, 3].map(() => G().spawnFish(SPECIES.find(s => s.id === 'gardon')));
    const profondeurs = [-1.0, -1.4, -1.8];
    proches.forEach((f, i) => {
        f.userData.depth = profondeurs[i];
        f.position.set(G().floatGroup.position.x + 2 + i, profondeurs[i] - f.userData.topOffset, G().floatGroup.position.z);
        f.userData.hooked = false;
    });
    if (proches.length === 3) {
        const calcul = e.conseilLocal.calculer();
        const attendu = 1.4;   // moyenne de 1,0 / 1,4 / 1,8
        check('en jeu : la profondeur est la moyenne des poissons du rayon (≈ 1,4 unités)', calcul.source === 'moyenne'
            && Math.abs(calcul.profondeurMoyenne - attendu) < 0.01 && Math.abs(calcul.ligne - attendu) <= 0.13, JSON.stringify([calcul.source, calcul.profondeurMoyenne, calcul.ligne]));
    } else {
        check('en jeu : 3 poissons disponibles pour le test', false, String(proches.length));
    }
    proches.forEach(f => G().fishes.splice(G().fishes.indexOf(f), 1));
    resetToIdle();
    G().setDifficulty('normal');
    e.equiperEsche('ver');
    e.eschesActives = false;
}

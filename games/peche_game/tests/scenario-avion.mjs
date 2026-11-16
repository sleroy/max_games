// ---------------------------------------------------------------------------
// Scénario : L'AVION DES CONSEILS (avion.js + matriceTouche.conseilsEsches, demande du joueur 2026-11-16).
//  - chaque espèce a son conseil : ses 2 meilleures esches puis la pire, d'après la matrice ;
//  - l'avion passe tout seul (premier passage après PREMIER_PASSAGE s), traverse l'écran puis disparaît ;
//  - une espèce par passage, à tour de rôle.
// ---------------------------------------------------------------------------
import { SPECIES } from '../especes.js';
import { group, check, checkEqual, G, moduleCopie, stepFor } from './harness.mjs';

export async function run() {
    group('Avion des conseils d’esche (avion.js)');
    const M = await import(moduleCopie('matriceTouche.js'));
    const A = await import(moduleCopie('avion.js'));
    const conseils = M.conseilsEsches();
    checkEqual('un conseil par espèce', conseils.length, SPECIES.length);
    const gardon = conseils.find(c => c.especeId === 'gardon');
    checkEqual('gardon : pain d’abord, puis ver', gardon.meilleures.join(), 'pain,ver');
    check('… le texte le dit', /Gardon : préfère .*Pain.*puis.*Ver/.test(gardon.texte), gardon.texte);
    checkEqual('truite : la mouche d’abord, puis le leurre', conseils.find(c => c.especeId === 'truite').meilleures.join(), 'mouche,vif');
    // 2 esches, ou une seule quand l'espèce n'en mange qu'une (le goujon : le ver).
    // Profondeur idéale sur la banderole : « À 0,5 m » pour une espèce de pleine eau, « Au fond » pour une espèce de fond.
    check('chaque banderole donne une profondeur (À x m / Au fond)', conseils.every(c => /^(À \d+(,\d)? m|Au fond) · (jamais|rarement) /.test(c.lignes[1])),
        conseils.filter(c => !/^(À|Au fond)/.test(c.lignes[1])).map(c => c.especeId + ' : ' + c.lignes[1]).join(' ; '));
    check('gardon : près de la surface ; carpe et silure : au fond', /^À /.test(gardon.lignes[1]) && /^Au fond/.test(conseils.find(c => c.especeId === 'carpe').lignes[1])
        && /^Au fond/.test(conseils.find(c => c.especeId === 'silure').lignes[1]), gardon.lignes[1]);
    check('chaque conseil donne 1 ou 2 esches qui marchent, et une pire différente', conseils.every(c => c.meilleures.length >= 1
        && c.meilleures.length <= 2 && c.meilleures.indexOf(c.pire) < 0));
    const goujon = conseils.find(c => c.especeId === 'goujon');
    check('une seule esche : pas de « puis »', goujon.meilleures.length > 1 || goujon.texte.indexOf('puis') < 0, goujon.texte);
    // Cohérence avec la matrice : la 1re esche du conseil est bien la meilleure chance de l'espèce.
    const res = M.calculerResume(15);
    check('la 1re esche conseillée = la meilleure chance de la matrice', conseils.every(c =>
        res.parEsche[c.especeId + '|' + c.meilleures[0]].max >= res.meilleur[c.especeId].chance - 1e-9));

    checkEqual('banderole : taille normale sur un écran d’ordinateur (800 px)', A.echelleBanderole(800), 1);
    check('… agrandie sur un téléphone à l’horizontale (390 px), sans excès', A.echelleBanderole(390) > 1.5 && A.echelleBanderole(390) <= 1.8,
        A.echelleBanderole(390).toFixed(2));
    // Aucun texte n'est tronqué : la police diminue jusqu'à ce que les 2 lignes tiennent (largeur simulée : 20 px par lettre à 40 px).
    const mesure = (l, t) => [...l].length * t * 0.5;
    check('la police s’adapte pour que chaque ligne tienne dans la banderole', conseils.every(c =>
        c.lignes.every(l => mesure(l, A.taillePolice(mesure, c.lignes, 964, 92)) <= 964 || A.taillePolice(mesure, c.lignes, 964, 92) === 20)));
    check('chaque conseil tient sur 2 lignes courtes (≤ 45 caractères)', conseils.every(c => c.lignes.length === 2
        && c.lignes.every(l => [...l].length <= 45)), conseils.map(c => c.lignes.map(l => [...l].length).join('/')).join(' '));
    const avion = G().etat.avion;
    check('l’avion existe dans la scène', !!avion && G().scene.children.indexOf(avion.groupe) >= 0);
    // Il attend son tour, passe, puis repart (horloge du jeu).
    if (!avion.enVol()) { stepFor(Math.max(0, avion.attente()) + 0.5, 0.1); }
    check('l’avion passe tout seul', avion.enVol() && avion.groupe.visible && avion.banderole.visible);
    const premier = avion.conseilCourant();
    check('il traîne un conseil d’esche', !!premier && premier.texte.indexOf('préfère') > 0, premier && premier.texte);
    const depart = avion.groupe.position.clone();
    stepFor(2, 0.1);
    check('il avance', avion.groupe.position.distanceTo(depart) > 2 * A.VITESSE * 0.8, avion.groupe.position.distanceTo(depart).toFixed(1));
    stepFor((2 * A.DEMI_TRAJET) / A.VITESSE, 0.1);
    check('… puis disparaît après sa traversée', !avion.enVol() && !avion.groupe.visible && !avion.banderole.visible);
    checkEqual('il revient plus tard', Math.round(avion.attente()) <= A.INTERVALLE, true);
    avion.lancer();
    check('le passage suivant montre une autre espèce', avion.conseilCourant().especeId !== premier.especeId,
        avion.conseilCourant().especeId);
    stepFor((2 * A.DEMI_TRAJET) / A.VITESSE + 0.5, 0.1);
}

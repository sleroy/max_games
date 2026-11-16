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
    check('chaque conseil donne 1 ou 2 esches qui marchent, et une pire différente', conseils.every(c => c.meilleures.length >= 1
        && c.meilleures.length <= 2 && c.meilleures.indexOf(c.pire) < 0));
    const goujon = conseils.find(c => c.especeId === 'goujon');
    check('une seule esche : pas de « puis »', goujon.meilleures.length > 1 || goujon.texte.indexOf('puis') < 0, goujon.texte);
    // Cohérence avec la matrice : la 1re esche du conseil est bien la meilleure chance de l'espèce.
    const res = M.calculerResume(15);
    check('la 1re esche conseillée = la meilleure chance de la matrice', conseils.every(c =>
        res.parEsche[c.especeId + '|' + c.meilleures[0]].max >= res.meilleur[c.especeId].chance - 1e-9));

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

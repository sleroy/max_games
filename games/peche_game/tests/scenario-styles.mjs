// ---------------------------------------------------------------------------
// Scénario 12 : chaque espèce a SON style — ses touches et son combat.
// ---------------------------------------------------------------------------
import {
    group, check, G, el, resetToIdle, clearLilyPads, castTo, forceBite
} from './harness.mjs';

export function run() {
    group('45) Chaque espèce a son style (touches et combat)');

    const styles = G().getStylesCombat();
    const especes = G().getSpecies();
    const parId = {};
    G().getTouches().forEach(function (t) { parId[t.id] = t; });
    const ids = Object.keys(styles);
    check('au moins 5 styles de combat', ids.length >= 5, ids.join(', '));
    check('chaque espèce a un style connu', especes.every(function (e) { return !!styles[e.style]; }),
        especes.filter(function (e) { return !styles[e.style]; }).map(function (e) { return e.nom; }).join(', ') || 'toutes');
    check('chaque style est utilisé par au moins 2 espèces',
        ids.every(function (id) {
            return especes.filter(function (e) { return e.style === id; }).length >= 2;
        }),
        ids.map(function (id) {
            return id + ':' + especes.filter(function (e) { return e.style === id; }).length;
        }).join(' '));
    // Chaque style a SES touches, toutes présentes au catalogue.
    ids.forEach(function (id) {
        const st = styles[id];
        check('style « ' + st.nom + ' » : des vraies touches', st.touchesVraies.length >= 2
            && st.touchesVraies.every(function (x) { return parId[x] && parId[x].vrai === true; }),
            st.touchesVraies.join(', '));
        check('style « ' + st.nom + ' » : des fausses touches', st.touchesFausses.length >= 2
            && st.touchesFausses.every(function (x) { return parId[x] && parId[x].vrai === false; }),
            st.touchesFausses.join(', '));
    });

    // --- Le brochet et la carpe ne se ressemblent pas du tout ---
    const stBrochet = G().styleEspece('brochet');
    const stCarpe = G().styleEspece('carpe');
    const stAblette = G().styleEspece('ablette');
    check('le brochet et la carpe n’ont pas les mêmes touches',
        stBrochet.touchesVraies.join() !== stCarpe.touchesVraies.join(),
        stBrochet.touchesVraies.join(' / ') + ' vs ' + stCarpe.touchesVraies.join(' / '));
    check('le brochet ne montre que SES vraies touches', (function () {
        for (let i = 0; i < 25; i++) {
            if (stBrochet.touchesVraies.indexOf(G().choisirTouche(true, 0.5, 1.2, stBrochet).id) < 0) {
                return false;
            }
        }
        return true;
    })(), stBrochet.touchesVraies.join(', '));
    check('sans style, le tirage reste générique (compatibilité)',
        !!G().choisirTouche(true, 0.5, 1.2));

    // --- Le combat diffère aussi ---
    check('la carpe (lourde) tire plus fort qu’une ablette',
        stCarpe.traction > stAblette.traction, stCarpe.traction + ' vs ' + stAblette.traction);
    check('le brochet s’épuise plus vite qu’une carpe',
        stBrochet.endurance < stCarpe.endurance, stBrochet.endurance + ' s vs ' + stCarpe.endurance + ' s');
    check('le brochet part de côté, la carpe tire droit',
        stBrochet.derive > stCarpe.derive, stBrochet.derive + ' vs ' + stCarpe.derive);
    check('chaque style décrit sa façon de se battre',
        ids.every(function (id) { return styles[id].resume.length > 40; }),
        ids.length + ' descriptions');

    // --- En jeu : la touche dépend de l'espèce qui a mordu ---
    let conformes = 0;
    let essais = 0;
    for (let i = 0; i < 5; i++) {
        resetToIdle();
        clearLilyPads();
        castTo(0, -25);
        const fish = forceBite();
        const st = G().styleEspece(fish.userData.especeId);
        essais += 1;
        if (st.touchesVraies.indexOf(G().getBiteTouchId()) >= 0) {
            conformes += 1;
        }
    }
    check('en jeu, la touche correspond à l’espèce qui a mordu', conformes === essais,
        conformes + ' / ' + essais + ' touches conformes');
    resetToIdle();

    // --- Le carnet affiche les touches et le style de l'espèce ---
    G().showJournal();
    el('journalTabs').emit('click', { target: { dataset: { tab: 'especes' } } });
    const fiche = el('especeFiche').innerHTML;
    check('la fiche d’espèce liste ses touches', fiche.indexOf('Touches') >= 0,
        fiche.length + ' caractères');
    check('la fiche d’espèce décrit son combat', fiche.indexOf('Combat') >= 0);
    G().hideJournal();
}

export default run;

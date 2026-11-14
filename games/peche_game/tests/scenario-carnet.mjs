// ---------------------------------------------------------------------------
// Scénario 10 : le carnet (onglets + carte de l'étang) et les zones des poissons.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, el } from './harness.mjs';

export function run() {
    group('42) Carnet : onglets, carte de l’étang et zones des poissons');

    // --- Onglets du carnet ---
    G().showJournal();
    checkEqual('le carnet s’ouvre', G().isJournalOpen(), true);
    checkEqual('l’onglet « Prises » est ouvert au départ',
        el('tabPrises').classList.contains('active'), true);
    checkEqual('les autres onglets sont fermés',
        el('tabBoutique').classList.contains('active'), false);

    el('journalTabs').emit('click', { target: { dataset: { tab: 'boutique' } } });
    checkEqual('cliquer sur « Boutique » ouvre la boutique',
        el('tabBoutique').classList.contains('active'), true);
    checkEqual('l’onglet « Prises » se ferme',
        el('tabPrises').classList.contains('active'), false);
    el('journalTabs').emit('click', { target: { dataset: { tab: 'touches' } } });
    checkEqual('cliquer sur « Touches » ouvre la fiche',
        el('tabTouches').classList.contains('active'), true);
    el('journalTabs').emit('click', { target: { dataset: { tab: 'options' } } });
    checkEqual('cliquer sur « Options » ouvre les options',
        el('tabOptions').classList.contains('active'), true);
    el('journalTabs').emit('click', { target: { dataset: { tab: 'prises' } } });
    checkEqual('on peut revenir aux prises',
        el('tabPrises').classList.contains('active'), true);
    // Les pages inactives sont RÉELLEMENT masquées (style en ligne, indépendant du
    // CSS : c'est ce qui garantit qu'on ne voit pas deux onglets à la fois).
    checkEqual('la page « Boutique » est masquée', el('tabBoutique').style.display, 'none');
    el('journalTabs').emit('click', { target: { dataset: { tab: 'touches' } } });
    checkEqual('la page « Prises » est masquée', el('tabPrises').style.display, 'none');
    checkEqual('la page « Touches » est affichée', el('tabTouches').style.display, '');
    el('journalTabs').emit('click', { target: { dataset: { tab: 'prises' } } });

    // --- La carte est celle du VRAI étang ---
    G().lilyPads.push({ x: 6, z: -30, radius: 2 });
    G().showJournal();
    const carte = el('pondMap').innerHTML;
    check('la carte est un dessin SVG', carte.indexOf('<svg') >= 0, carte.length + ' caractères');
    const R = G().getPondRadius();
    const rayonAttendu = (R * (100 / (2 * R))).toFixed(1);
    check('le lac est un cercle au bon rayon', carte.indexOf('r="' + rayonAttendu + '"') >= 0,
        'rayon ' + rayonAttendu);
    check('les nénuphars sont dessinés à leur place', carte.indexOf('#3f7d4a') >= 0,
        G().lilyPads.length + ' nénuphar(s)');
    check('le pêcheur et la bourriche sont sur la carte',
        carte.indexOf('#f2f2f2') >= 0 && carte.indexOf('#c9a227') >= 0);
    check('la légende donne les zones de profondeur',
        carte.indexOf('Le fond') >= 0 && carte.indexOf('Pleine eau') >= 0);
    check('le sandre est annoncé dans la zone du fond', carte.indexOf('Sandre') >= 0);
    G().lilyPads.length = 0;

    // --- Les profondeurs des espèces sont réalistes ---
    const especes = G().getSpecies();
    check('chaque espèce a une zone de profondeur',
        especes.every(e => Array.isArray(e.profondeur) && e.profondeur.length === 2));
    check('les zones restent entre la surface et le fond',
        especes.every(e => e.profondeur[0] < e.profondeur[1]
            && e.profondeur[1] <= -0.6 && e.profondeur[0] >= -3.6));
    const parId = {};
    especes.forEach(e => { parId[e.id] = e; });
    check('un sandre vit au fond',
        (parId.sandre.profondeur[0] + parId.sandre.profondeur[1]) / 2 < -2.4,
        parId.sandre.profondeur.join(' à '));
    check('une ablette vit près de la surface', parId.ablette.profondeur[1] > -1.0,
        parId.ablette.profondeur.join(' à '));
    // Chaque poisson nage dans SA zone (tolérance : il peut plonger vers l'hameçon).
    const horsZone = G().fishes.filter(f => {
        const esp = especes.filter(e => e.nom === f.userData.espece)[0];
        if (!esp || !esp.profondeur) {
            return false;
        }
        return f.userData.depth < esp.profondeur[0] - 1.2;
    });
    check('chaque poisson nage dans SA zone de profondeur', horsZone.length === 0,
        horsZone.map(f => f.userData.espece).join(', ') || 'aucun');

    // --- Le bouchon est petit et l'hameçon profond (demandes du joueur) ---
    check('le bouchon reste petit', G().floatGroup.scale.x <= 1,
        'échelle ' + G().floatGroup.scale.x);
    check('l’hameçon est bien bas sous le bouchon', G().getHookDepth() <= -2,
        'hameçon à ' + G().getHookDepth() + ' unité');
}

export default run;

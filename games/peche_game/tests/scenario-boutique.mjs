// ---------------------------------------------------------------------------
// Scénario 6 : expérience (XP) et boutique de bouchons à capacités spéciales.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, step,
    resetToIdle, clearLilyPads, castTo, forceBite, startFight, crankTurns
} from './harness.mjs';

/** Amène un poisson au bord jusqu'à l'avoir « en main » (étape bourriche). */
function amenerUnPoissonEnMain() {
    startFight(0, -30);
    let guard = 0;
    while (state() === 'struggle' && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    guard = 0;
    while (state() === 'reeling' && guard++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
}

export function run() {
    group('36) Expérience et boutique de bouchons');

    // On repart d'un état connu : au repos, sans expérience.
    resetToIdle();
    G().setExperience(0);

    // --- Contenu de la boutique ---
    const bouchons = G().getFloats();
    checkEqual('8 bouchons proposés au total', bouchons.length, 8);
    const offerts = bouchons.filter(f => f.prix === 0);
    const aVendre = bouchons.filter(f => f.prix > 0);
    checkEqual('4 bouchons offerts au départ', offerts.length, 4);
    checkEqual('4 bouchons à acheter avec l’expérience', aVendre.length, 4);
    check('chaque bouchon à vendre a un prix et un atout',
        aVendre.every(f => f.prix > 0 && f.atout.length > 0),
        aVendre.map(f => f.nom + ' (' + f.prix + ' XP)').join(' · '));
    check('chaque bouchon à vendre a une capacité spéciale',
        aVendre.every(f => f.capacite.fenetre !== 1 || f.capacite.fausses !== 1
            || f.capacite.avantage !== 1 || f.capacite.temps !== 1
            || f.capacite.xp !== 1 || f.capacite.voyant),
        aVendre.map(f => f.nom).join(' · '));
    checkEqual('les bouchons de départ sont possédés',
        offerts.every(f => G().getBouchonsPossedes().indexOf(f.id) >= 0), true);
    checkEqual('aucun bouchon à vendre n’est possédé au départ',
        aVendre.every(f => G().getBouchonsPossedes().indexOf(f.id) < 0), true);

    // --- Acheter : il faut de l'expérience ---
    const prixTruque = aVendre.filter(f => f.id === 'truque')[0].prix;
    checkEqual('sans expérience, l’achat échoue', G().acheterBouchon('truque'), false);
    checkEqual('aucune expérience débitée', G().getExperience(), 0);
    checkEqual('un bouchon inconnu est refusé', G().acheterBouchon('licorne'), false);
    checkEqual('un bouchon déjà offert ne s’achète pas', G().acheterBouchon('anglaise'), false);
    G().setFloatType('plume');
    checkEqual('équiper un bouchon non possédé est sans effet', G().getFloatType(), 'anglaise');

    G().setExperience(prixTruque);
    checkEqual('avec assez d’expérience, l’achat réussit', G().acheterBouchon('truque'), true);
    checkEqual('l’expérience est débitée du prix', G().getExperience(), 0);
    checkEqual('le bouchon est désormais possédé',
        G().getBouchonsPossedes().indexOf('truque') >= 0, true);
    checkEqual('impossible d’acheter deux fois le même', G().acheterBouchon('truque'), false);

    // --- Équiper et capacités actives ---
    G().setFloatType('truque');
    checkEqual('le bouchon acheté peut être équipé', G().getFloatType(), 'truque');
    check('capacité « moins de fausses touches » active',
        G().getCapaciteBouchon().fausses < 1, G().getCapaciteBouchon().fausses);
    G().setFloatType('anglaise');
    checkEqual('bouchon de base : capacité neutre', G().getCapaciteBouchon().fausses, 1);
    checkEqual('bouchon de base : pas de lueur la nuit', G().getCapaciteBouchon().voyant, false);

    // --- Le carnet affiche l'expérience et la boutique ---
    G().showJournal();
    const html = G().getBoutiqueHtml();
    check('la boutique liste tous les bouchons', html.indexOf('Bouchon truqué') >= 0);
    check('la boutique affiche les prix en XP', html.indexOf('XP</span>') >= 0);
    check('la boutique propose d’acheter', html.indexOf('data-action="acheter"') >= 0);
    check('la boutique propose d’équiper', html.indexOf('data-action="equiper"') >= 0);
    check('le bouchon équipé est signalé', html.indexOf('✅ Équipé') >= 0);
    check('sans expérience, les bouchons à vendre sont grisés',
        html.indexOf('data-id="plume" disabled') >= 0);
    check('l’expérience est affichée dans le carnet', el('shopXp').textContent.indexOf('XP') >= 0,
        el('shopXp').textContent);
    check('l’expérience est affichée dans le bandeau', el('xpLabel').textContent.indexOf('XP') >= 0,
        el('xpLabel').textContent);

    // --- Un clic dans la boutique achète / équipe vraiment ---
    G().setExperience(500);
    check('avec assez d’expérience, l’achat devient possible',
        G().getBoutiqueHtml().indexOf('data-id="plume" disabled') < 0,
        'bouton « plume » actif');
    const xpAvantClic = G().getExperience();
    fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'plume' } } });
    checkEqual('le clic « Acheter » achète le bouchon',
        G().getBouchonsPossedes().indexOf('plume') >= 0, true);
    check('le clic débite l’expérience', G().getExperience() < xpAvantClic,
        xpAvantClic + ' -> ' + G().getExperience());
    checkEqual('le bouchon acheté est équipé aussitôt', G().getFloatType(), 'plume');
    fire('boutique', 'click', { target: { dataset: { action: 'equiper', id: 'anglaise' } } });
    checkEqual('le clic « Équiper » change de bouchon', G().getFloatType(), 'anglaise');
    G().setExperience(0);
    fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'maitre' } } });
    checkEqual('sans expérience, le clic n’achète rien',
        G().getBouchonsPossedes().indexOf('maitre'), -1);

    // --- Capacité « fenetre » : la fenêtre de ferrage est allongée ---
    resetToIdle();
    clearLilyPads();
    G().setFloatType('anglaise');
    castTo(0, -25);
    forceBite();
    const fenetreAnglaise = G().getBiteWindow();
    resetToIdle();
    G().setExperience(500);
    G().acheterBouchon('maitre');
    G().setFloatType('maitre');
    clearLilyPads();
    castTo(0, -25);
    forceBite();
    const fenetreMaitre = G().getBiteWindow();
    check('la fenêtre de ferrage du maître est plus longue', fenetreMaitre > fenetreAnglaise,
        fenetreAnglaise.toFixed(2) + ' -> ' + fenetreMaitre.toFixed(2));
    // anglaise : sensibilité 1.35 × capacité 1   /   maître : 1.25 × 1.2
    checkClose('la capacité explique exactement l’écart',
        fenetreMaitre / fenetreAnglaise, (1.25 * 1.2) / (1.35 * 1), 0.01);
    resetToIdle();

    // --- Capacités « temps » et « avantage » : le combat dure plus longtemps ---
    clearLilyPads();
    G().setFloatType('anglaise');
    startFight(0, -30);
    const tempsAnglaise = G().getStruggleTimeLeft();
    resetToIdle();
    G().setExperience(500);
    G().acheterBouchon('plombee');
    G().setFloatType('plombee');
    check('capacité « avantage réduit » active', G().getCapaciteBouchon().avantage < 1,
        G().getCapaciteBouchon().avantage);
    clearLilyPads();
    startFight(0, -30);
    const tempsPlombee = G().getStruggleTimeLeft();
    check('le bouchon plombé laisse plus de temps de combat', tempsPlombee > tempsAnglaise,
        tempsAnglaise.toFixed(1) + ' s -> ' + tempsPlombee.toFixed(1) + ' s');
    resetToIdle();

    // --- L'expérience se gagne en rangeant des poissons ---
    G().setExperience(0);
    G().setFloatType('anglaise');
    amenerUnPoissonEnMain();
    checkEqual('le poisson est en main', state(), 'holding');
    const xpAvant = G().getExperience();
    G().storeHeldFish();
    const gain = G().getExperience() - xpAvant;
    check('ranger un poisson rapporte de l’expérience', gain >= 3, '+' + gain + ' XP');
    check('le poids influence l’expérience gagnée',
        G().xpPourPrise(0.5) > G().xpPourPrise(0.05),
        G().xpPourPrise(0.05) + ' XP (50 g) vs ' + G().xpPourPrise(0.5) + ' XP (500 g)');

    // --- La capacité « xp » du bouchon du maître augmente les gains ---
    resetToIdle();
    G().setFloatType('maitre');
    const xpMaitre = G().xpPourPrise(1);
    G().setFloatType('anglaise');
    const xpAnglaise = G().xpPourPrise(1);
    check('le bouchon du maître donne plus d’expérience', xpMaitre > xpAnglaise,
        xpAnglaise + ' XP -> ' + xpMaitre + ' XP');

    // -----------------------------------------------------------------------
    group('40) Perdre son bouchon dans les nénuphars');

    resetToIdle();
    clearLilyPads();
    G().setExperience(500);
    G().acheterBouchon('truque');
    G().setFloatType('truque');
    checkEqual('bouchon acheté et équipé', G().getFloatType(), 'truque');

    // On pose un nénuphar et on lance DESSUS : la ligne s'y accroche.
    G().lilyPads.push({ x: 0, z: -25, radius: 4 });
    castTo(0, -25);
    checkEqual('la ligne s’accroche au nénuphar', state(), 'snag');
    let garde = 0;
    while (state() === 'snag' && garde++ < 60 * 30) {
        step(1 / 60);           // on ne clique pas : la tension monte et ça casse
    }
    check('la ligne finit par casser', state() === 'broken' || state() === 'idle', state());
    check('un message flottant annonce la perte',
        G().getFloatingTexts().indexOf('Bouchon perdu !') >= 0,
        G().getFloatingTexts().join(' / '));
    checkEqual('le bouchon ACHETÉ est perdu', G().getBouchonsPossedes().indexOf('truque'), -1);
    checkEqual('on repêche avec le bouchon de départ', G().getFloatType(), 'anglaise');
    check('le message explique la perte', el('status').textContent.indexOf('perdu') >= 0,
        el('status').textContent);
    const boutiqueApres = G().getBoutiqueHtml();
    check('la boutique propose de le racheter',
        boutiqueApres.indexOf('data-id="truque"') >= 0
        && boutiqueApres.indexOf('data-id="truque" disabled') < 0,
        'bouton « truque » de nouveau disponible');
    for (let i = 0; i < 120; i++) {
        step(1 / 60);           // la ligne cassée « revient » et on repart au repos
    }
    checkEqual('retour au repos après la casse', state(), 'idle');
    checkEqual('on peut racheter le bouchon perdu', G().acheterBouchon('truque'), true);
    G().lilyPads.length = 0;

    // Un bouchon de DÉPART, lui, n'est jamais retiré de l'inventaire.
    resetToIdle();
    G().setFloatType('anglaise');
    const sacAvant = G().getBouchonsPossedes().length;
    G().lilyPads.push({ x: 0, z: -25, radius: 4 });
    castTo(0, -25);
    garde = 0;
    while (state() === 'snag' && garde++ < 60 * 30) {
        step(1 / 60);
    }
    for (let i = 0; i < 120; i++) {
        step(1 / 60);
    }
    checkEqual('un bouchon de départ n’est pas retiré du sac',
        G().getBouchonsPossedes().length, sacAvant);
    checkEqual('on garde le bouchon de départ équipé', G().getFloatType(), 'anglaise');
    G().lilyPads.length = 0;

    G().setExperience(0);
    resetToIdle();
    G().setFloatType('anglaise');
}

export default run;

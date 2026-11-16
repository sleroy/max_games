// ---------------------------------------------------------------------------
// Scénario 6 : expérience (XP) et boutique de bouchons à capacités spéciales.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, fire, state, step, stepUntil,
    resetToIdle, clearLilyPads, castTo, forceBite, startFight, crankTurns, lancerSonar, stepFor
} from './harness.mjs';
import { chargerCarnet, sauverCarnet } from '../carnet.js';

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
    checkEqual('11 bouchons proposés au total', bouchons.length, 11);
    const offerts = bouchons.filter(f => f.prix === 0);
    const aVendre = bouchons.filter(f => f.prix > 0);
    checkEqual('4 bouchons offerts au départ', offerts.length, 4);
    checkEqual('7 bouchons à acheter avec l’expérience (dont 3 triches)', aVendre.length, 7);
    check('chaque bouchon à vendre a un prix et un atout',
        aVendre.every(f => f.prix > 0 && f.atout.length > 0),
        aVendre.map(f => f.nom + ' (' + f.prix + ' XP)').join(' · '));
    check('chaque bouchon à vendre a une capacité spéciale',
        aVendre.every(f => f.capacite.fenetre !== 1 || f.capacite.fausses !== 1
            || f.capacite.avantage !== 1 || f.capacite.temps !== 1
            || f.capacite.xp !== 1 || f.capacite.voyant || f.capacite.geant || f.capacite.detecteur || f.capacite.balise),
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

    group('62) Sonar flottant : achat, détection et rangement');
    const buySonar = () => fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'sonar' } } });
    G().setExperience(149);
    buySonar();
    checkEqual('le sonar reste verrouillé sous 150 XP', el('sonarButton').hidden, true);
    checkEqual('un achat refusé ne coûte rien', G().getExperience(), 149);
    G().setExperience(300);
    buySonar();
    checkEqual('le sonar coûte 150 XP', G().getExperience(), 150);
    checkEqual('le sonar acheté apparaît dans le menu', el('sonarButton').hidden, false);
    buySonar();
    checkEqual('le même sonar ne peut pas être racheté', G().getExperience(), 150);

    resetToIdle();
    clearLilyPads();
    // Le sonar se LANCE comme une amorce (§14.7) : visée, maintien, relâchement, plouf.
    const bouee = lancerSonar({ x: 0, z: -25 }, 0.4);
    check('on lance le sonar : la bouée tombe à l’eau', !!bouee);
    const oldPositions = G().fishes.map(fish => fish.position.clone());
    G().fishes.forEach((fish, index) => {
        fish.position.set(bouee.x + (index === 0 ? 23 : 25), -2, bouee.z);
    });
    stepFor(0.3);
    checkEqual('poser le sonar affiche le radar', el('sonarPanel').hidden, false);
    checkEqual('seul le poisson dans le rayon de 12 m est détecté',
        el('sonarCount').textContent, '1 poisson · 12 m');
    G().fishes.forEach((fish, index) => fish.position.copy(oldPositions[index]));
    fire('sonarButton', 'click');
    checkEqual('ranger le sonar cache le radar', el('sonarPanel').hidden, true);
    lancerSonar({ x: 0, z: -25 }, 0.4);
    G().recommencerPartie();
    checkEqual('une nouvelle partie range le sonar', el('sonarPanel').hidden, true);
    checkEqual('le sonar reste acquis dans la nouvelle partie', el('sonarButton').hidden, false);

    group('63) Recharges : stock limité, achat et choix du fil');
    const acheter = id => fire('boutique', 'click', { target: { dataset: { action: 'recharger', id } } });
    checkEqual('une nouvelle partie commence avec 3 boules', el('feedButton').textContent, '🥣 Amorce (3)');
    G().setExperience(0);
    acheter('amorce');
    checkEqual('sans XP, le lot n’est pas ajouté', el('feedButton').textContent, '🥣 Amorce (3)');
    G().setExperience(100);
    acheter('amorce');
    checkEqual('le lot ajoute 3 boules', el('feedButton').textContent, '🥣 Amorce (6)');
    checkEqual('le lot d’amorce coûte 12 XP', G().getExperience(), 88);
    G().recommencerPartie();
    checkEqual('les boules achetées restent en réserve après Rejouer', el('feedButton').textContent, '🥣 Amorce (6)');
    G().startFeedCharge({ x: 0, y: 0, z: -25 });
    fire('toolToggle', 'click');
    fire('toolToggle', 'click');
    checkEqual('annuler un geste ne dépense pas de boule', el('feedButton').textContent, '🥣 Amorce (6)');
    for (let i = 0; i < 6; i++) {
        G().startFeedCharge({ x: 0, y: 0, z: -25 });
        G().releaseFeed();
        stepUntil(() => G().getFeedState() === 'idle', 3);
    }
    checkEqual('les six lancers épuisent le stock', el('feedButton').textContent, '🥣 Amorce (0)');
    G().setFeedMode(true);
    G().startFeedCharge({ x: 0, y: 0, z: -25 });
    checkEqual('sans boule, aucune charge ne commence', G().getFeedState(), 'idle');
    checkEqual('sans boule, le jeu n’arme pas l’amorçage', G().isFeedMode(), false);

    acheter('fluorocarbone');
    checkEqual('le fluorocarbone coûte 28 XP', G().getExperience(), 60);
    checkEqual('trois nouveaux fils s’ajoutent au fil de départ', G().getLignes(), 4);
    el('lineSelect').value = 'fluorocarbone';
    fire('lineSelect', 'change');
    G().setDifficulty('normal');
    G().setTangleChance(null);
    checkClose('le fluorocarbone divise le risque par deux', G().getTangleChance(), 0.04, 1e-9);
    G().setTangleChance(0);
    for (let i = 0; i < 3; i++) { G().casserLigne('Test'); }
    checkEqual('les casses débitent le fil équipé', G().getLignes(), 1);
    checkEqual('quand le lot est épuisé, on reprend le nylon', el('lineSelect').value, 'nylon');

    const store = { value: '', getItem() { return this.value; }, setItem(key, value) { this.value = value; } };
    const reserves = { amorce: 0, nylon: 0, fluorocarbone: 0, tresse: 0 };
    const data = { recharges: { ...reserves } };
    store.value = '{"experience":42}';
    chargerCarnet({ store, data });
    checkEqual('un ancien carnet conserve son XP', data.experience, 42);
    checkEqual('un ancien carnet commence sans recharge achetée', data.recharges.amorce, 0);
    sauverCarnet({ store, data: { recharges: { ...reserves, tresse: 3, amorce: 2 }, ligne: 'tresse' } });
    chargerCarnet({ store, data });
    checkEqual('le carnet restaure le nombre de boules achetées', data.recharges.amorce, 2);
    checkEqual('le carnet restaure les lignes achetées', data.recharges.tresse, 3);
    checkEqual('le carnet restaure le type équipé', data.ligne, 'tresse');

    G().recommencerPartie();
    G().setExperience(0);
    resetToIdle();
    G().setFloatType('anglaise');
}

export default run;

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

    // --- Onglet « Espèces » : une fiche par poisson ---
    el('journalTabs').emit('click', { target: { dataset: { tab: 'especes' } } });
    checkEqual('cliquer sur « Espèces » ouvre la fiche des poissons',
        el('tabEspeces').classList.contains('active'), true);
    checkEqual('la page « Prises » est masquée', el('tabPrises').style.display, 'none');
    const fichePoisson = el('especeFiche').innerHTML;
    check('la fiche du poisson est dessinée (silhouette SVG)',
        fichePoisson.indexOf('<svg') >= 0 && fichePoisson.indexOf('espece-silhouette') >= 0,
        fichePoisson.length + ' caractères');
    check('la fiche indique la page courante', el('especePage').textContent.indexOf('1 /') >= 0,
        el('especePage').textContent);
    check('la fiche donne la taille et le poids',
        fichePoisson.indexOf('cm') >= 0 && fichePoisson.indexOf('kg') >= 0);
    check('la fiche donne la zone de profondeur',
        fichePoisson.indexOf('Bord') >= 0 || fichePoisson.indexOf('Pleine eau') >= 0
        || fichePoisson.indexOf('Le fond') >= 0);
    check('la fiche indique les prises (ou « pas encore attrapé »)',
        fichePoisson.indexOf('prise') >= 0 || fichePoisson.indexOf('Pas encore') >= 0);
    const nomPremier = (fichePoisson.match(/espece-nom">([^<]+)</) || [])[1];
    el('especeNext').emit('click', {});
    check('« Suivant » passe au poisson suivant',
        el('especePage').textContent.indexOf('2 /') >= 0, el('especePage').textContent);
    const nomSecond = (el('especeFiche').innerHTML.match(/espece-nom">([^<]+)</) || [])[1];
    check('on voit un autre poisson', nomPremier !== nomSecond, nomPremier + ' -> ' + nomSecond);
    el('especePrev').emit('click', {});
    el('especePrev').emit('click', {});        // depuis la page 1 : on boucle
    check('la navigation boucle sur la dernière fiche',
        el('especePage').textContent.indexOf(' / ' + G().getSpecies().length) >= 0,
        el('especePage').textContent);
    el('journalTabs').emit('click', { target: { dataset: { tab: 'prises' } } });

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

    group('46) Nouveau record d’espèce');
    // La logique : le carnet dit si le record est battu.
    const e1 = G().addJournalEntry(2.5, 'Espèce test');
    check('le premier poisson d’une espèce établit son record',
        e1.nouveauRecord === true && e1.ancienRecord === 0, JSON.stringify(e1));
    const e2 = G().addJournalEntry(1.2, 'Espèce test');
    check('un poisson plus léger ne bat pas le record', e2.nouveauRecord === false,
        JSON.stringify(e2));
    const e3 = G().addJournalEntry(3.4, 'Espèce test');
    check('un poisson plus lourd bat le record',
        e3.nouveauRecord === true && Math.abs(e3.ancienRecord - 2.5) < 1e-9, JSON.stringify(e3));
    check('le record est enregistré dans le carnet',
        G().getSpeciesCard()['Espèce test'].record === 3.4,
        String(G().getSpeciesCard()['Espèce test'].record));
    // L'annonce à l'écran.
    G().annoncerRecord(3.4, 'Espèce test', 2.5);
    const msgRecord = el('catchMessage');
    check('le message de prise passe en doré', msgRecord.classList.contains('record'),
        msgRecord.className);
    check('le message annonce le record', msgRecord.textContent.indexOf('RECORD') >= 0,
        msgRecord.textContent);
    check('le statut rappelle l’ancien record',
        el('status').textContent.indexOf('ancien record') >= 0, el('status').textContent);
    const rb = G().getRecordBattu();
    check('le record battu est mémorisé', !!rb && rb.espece === 'Espèce test'
        && Math.abs(rb.kg - 3.4) < 1e-9 && Math.abs(rb.ancien - 2.5) < 1e-9, JSON.stringify(rb));
    // Une prise ordinaire enlève le doré.
    G().showCatchMessage(1.0, 'Espèce test', false);
    check('une prise ordinaire retire le doré', !el('catchMessage').classList.contains('record'),
        el('catchMessage').className);
}

export default run;

// ---------------------------------------------------------------------------
// Scénario 78 : MENUS DE LA BARRE DU HAUT (v192) — 🪱 Esche et 🎈 Matériel.
//
// Contrat de la demande :
//  - deux boutons compacts à DROITE du bouton 📖 du carnet ;
//  - un menu déroulant superposé (pas de modale, pas de fond assombri) ;
//  - un seul menu ouvert à la fois ; fermeture au clic extérieur, sur Échap et en
//    recliquant le bouton ;
//  - accessible (aria-haspopup / aria-expanded / role=menu) et pilotable au clavier
//    (↑ ↓ Home Fin, Entrée) ;
//  - 🪱 liste TOUTES les esches (illimitées) et équipe immédiatement ;
//  - 🎈 liste les bouchons possédés (équiper) puis ceux à acheter en XP — ou les
//    scions du quiver quand la technique est quiver.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { SCIONS } from '../especes.js';
import {
    group, check, checkEqual, GAME_DIR, G, el, fire, resetToIdle, castTo, forceBite, strike, state
} from './harness.mjs';

const HTML = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');

/** Clic sur une entrée du menu (délégation : on fournit l'id de l'entrée). */
function cliquerEntree(menu, id) {
    fire(menu, 'click', { target: { dataset: { id } } });
}

/** Clic « extérieur » (sur le canvas du jeu) : doit fermer le menu ouvert. */
function clicExterieur() {
    globalThis.fireWindowEvent('click', { target: { id: 'gameCanvas' } });
}

let preventions = 0;
function touche(menu, key) {
    preventions = 0;
    fire(menu, 'keydown', { key, preventDefault() { preventions++; } });
    return preventions;
}

export function run() {
    group('78) Menus de la barre du haut : 🪱 Esche et 🎈 Matériel (v192)');

    // --- 1) Les deux boutons sont dans index.html, à droite du carnet --------
    check('le bouton 🪱 Esche est dans index.html', HTML.indexOf('id="escheTopButton"') >= 0);
    check('le bouton 🎈 Matériel est dans index.html', HTML.indexOf('id="materielTopButton"') >= 0);
    check('ils sont placés APRÈS le bouton 📖 du carnet',
        HTML.indexOf('id="escheTopButton"') > HTML.indexOf('id="carnetTopButton"')
        && HTML.indexOf('id="materielTopButton"') > HTML.indexOf('id="escheTopButton"'));
    ['escheTopButton', 'materielTopButton'].forEach(function (id) {
        const balise = HTML.match(new RegExp('<button[^>]*id="' + id + '"[^>]*>'));
        check(id + ' déclare aria-haspopup="menu"', !!balise && balise[0].indexOf('aria-haspopup="menu"') >= 0);
        check(id + ' déclare aria-expanded="false" au départ',
            !!balise && balise[0].indexOf('aria-expanded="false"') >= 0);
        check(id + ' contrôle son menu (aria-controls)',
            !!balise && balise[0].indexOf('aria-controls="' + id.replace('TopButton', 'TopMenu') + '"') >= 0);
    });
    const menusHtml = HTML.match(/<div class="menu-pop"[^>]*>/g) || [];
    checkEqual('les deux conteneurs de menu existent (role=menu, cachés)', menusHtml.length, 2);
    check('chaque conteneur est un role="menu"',
        menusHtml.every(tag => tag.indexOf('role="menu"') >= 0 && tag.indexOf('hidden') >= 0));

    // --- 2) Ouverture / fermeture du menu des esches -------------------------
    resetToIdle();
    const boutonEsche = el('escheTopButton');
    const menuEsche = el('escheTopMenu');
    checkEqual('au départ les menus sont fermés', G().isMenuOuvert(), false);
    boutonEsche.emit('click', {});
    checkEqual('un clic sur 🪱 ouvre le menu', G().isMenuOuvert('esche'), true);
    checkEqual('…et passe aria-expanded à true', boutonEsche.getAttribute('aria-expanded'), 'true');
    checkEqual('…le panneau devient visible', menuEsche.hidden, false);
    check('le menu liste TOUTES les esches',
        G().etat.ESCHES.every(e => G().getMenuHtml('esche').indexOf('>' + e.icone + '<') >= 0
            && G().getMenuHtml('esche').indexOf('<b>' + e.nom + '</b>') >= 0),
        G().getMenuHtml('esche').slice(0, 200));
    check('…et l’hameçon nu', G().getMenuHtml('esche').indexOf('Hameçon nu') >= 0);
    check('il annonce les esches illimitées', G().getMenuHtml('esche').indexOf('illimitées') >= 0);
    boutonEsche.emit('click', {});
    checkEqual('un second clic referme le menu', G().isMenuOuvert('esche'), false);
    checkEqual('…aria-expanded repasse à false', boutonEsche.getAttribute('aria-expanded'), 'false');
    checkEqual('…et le panneau est caché', menuEsche.hidden, true);

    // --- 3) Clic extérieur et Échap -----------------------------------------
    boutonEsche.emit('click', {});
    clicExterieur();
    checkEqual('un clic extérieur ferme le menu', G().isMenuOuvert('esche'), false);
    boutonEsche.emit('click', {});
    globalThis.fireWindowEvent('keydown', { key: 'Escape', preventDefault() {} });
    checkEqual('Échap ferme le menu', G().isMenuOuvert('esche'), false);
    checkEqual('…et rend le bouton lisible (aria-expanded)', boutonEsche.getAttribute('aria-expanded'), 'false');

    // --- 4) Équiper une esche depuis le menu --------------------------------
    resetToIdle();
    check('on part d’une autre esche', G().etat.equiperEsche('ver'));
    boutonEsche.emit('click', {});
    check('l’esche équipée est marquée dans le menu', G().getMenuHtml('esche').indexOf('équipe') >= 0
        || G().getMenuHtml('esche').indexOf('✅') >= 0);
    cliquerEntree('escheTopMenu', 'mais');
    checkEqual('un clic équipe l’esche', G().etat.journal.esche, 'mais');
    checkEqual('…et referme le menu', G().isMenuOuvert('esche'), false);
    checkEqual('…le widget de profondeur suit', el('depthEsche').textContent.indexOf('Maïs') >= 0, true);
    boutonEsche.emit('click', {});
    cliquerEntree('escheTopMenu', 'nu');
    checkEqual('« Hameçon nu » s’équipe aussi depuis le menu', G().etat.journal.esche, null);

    // --- 5) Clavier : ↑ ↓ et Entrée -----------------------------------------
    resetToIdle();
    check('esche de départ pour le clavier', G().etat.equiperEsche('ver'));
    boutonEsche.emit('click', {});
    checkEqual('la première entrée est active à l’ouverture',
        menuEsche.getAttribute('aria-activedescendant'), 'escheMenu-mais');
    touche('escheTopMenu', 'ArrowDown');
    checkEqual('↓ descend d’une entrée', menuEsche.getAttribute('aria-activedescendant'), 'escheMenu-ver');
    touche('escheTopMenu', 'End');
    checkEqual('Fin va sur la dernière entrée (hameçon nu)',
        menuEsche.getAttribute('aria-activedescendant'), 'escheMenu-nu');
    touche('escheTopMenu', 'Home');
    checkEqual('Origine revient sur la première', menuEsche.getAttribute('aria-activedescendant'), 'escheMenu-mais');
    touche('escheTopMenu', 'ArrowDown');
    checkEqual('la touche Entrée est consommée (pas de clic fantôme sur le bouton)',
        touche('escheTopMenu', 'Enter'), 1);
    checkEqual('Entrée équipe l’entrée active (ver)', G().etat.journal.esche, 'ver');
    checkEqual('…et ferme le menu', G().isMenuOuvert('esche'), false);

    // --- 6) Un seul menu ouvert à la fois -----------------------------------
    boutonEsche.emit('click', {});
    el('materielTopButton').emit('click', {});
    checkEqual('ouvrir 🎈 referme 🪱', G().isMenuOuvert('esche'), false);
    checkEqual('…et laisse 🎈 ouvert', G().isMenuOuvert('materiel'), true);
    checkEqual('les deux aria-expanded sont cohérents',
        boutonEsche.getAttribute('aria-expanded') + '/' + el('materielTopButton').getAttribute('aria-expanded'),
        'false/true');
    clicExterieur();
    checkEqual('le clic extérieur referme aussi 🎈', G().isMenuOuvert(), false);

    // --- 7) 🎈 Matériel en technique BOUCHON : possédés puis achats en XP -----
    resetToIdle();
    G().setTechnique('bouchon');
    // Boutique DÉTERMINISTE : les scénarios précédents ont pu acheter tout le matériel.
    G().setFloatType('anglaise');
    G().setScion('souple');
    G().etat.journal.bouchons = G().getFloats().filter(f => f.prix === 0).map(f => f.id);
    G().etat.journal.scions = SCIONS.filter(f => f.prix === 0).map(f => f.id);
    const boutonMateriel = el('materielTopButton');
    const bouchons = G().getFloats();
    const possedes = G().getBouchonsPossedes();
    const aVendre = bouchons.filter(f => f.prix > 0 && possedes.indexOf(f.id) < 0)[0];
    check('un bouchon reste à acheter pour le test', !!aVendre, possedes.join());
    boutonMateriel.emit('click', {});
    const materiel = G().getMenuHtml('materiel');
    check('le menu matériel liste les bouchons', materiel.indexOf('Bouchons') >= 0);
    check('il propose les bouchons possédés',
        possedes.every(id => materiel.indexOf(bouchons.filter(f => f.id === id)[0].nom) >= 0),
        possedes.join());
    check('…et ceux à acheter, avec leur prix en XP',
        materiel.indexOf(aVendre.nom) >= 0 && materiel.indexOf(aVendre.prix + ' XP') >= 0,
        aVendre.nom + ' / ' + aVendre.prix + ' XP');
    check('les bouchons possédés passent AVANT ceux à vendre',
        materiel.indexOf(bouchons.filter(f => f.id === possedes[0])[0].nom) < materiel.indexOf(aVendre.nom));
    check('le bouchon équipé est marqué', materiel.indexOf('✅') >= 0);
    check('il n’y a PAS de scion dans le menu bouchon', materiel.indexOf('Scions') < 0);
    // Équiper un bouchon déjà possédé.
    const autreBouchon = possedes.filter(id => id !== G().getFloatType())[0];
    cliquerEntree('materielTopMenu', autreBouchon);
    checkEqual('un clic équipe le bouchon possédé', G().getFloatType(), autreBouchon);
    checkEqual('…et referme le menu', G().isMenuOuvert('materiel'), false);
    // Acheter sans XP : refus explicite, le menu reste ouvert.
    G().setExperience(0);
    boutonMateriel.emit('click', {});
    cliquerEntree('materielTopMenu', aVendre.id);
    checkEqual('sans XP, le bouchon n’est pas acheté', G().getBouchonsPossedes().indexOf(aVendre.id), -1);
    check('…un message le dit', el('status').textContent.indexOf('Pas assez d’expérience') >= 0,
        el('status').textContent);
    checkEqual('…et le menu reste ouvert pour réessayer', G().isMenuOuvert('materiel'), true);
    // Acheter avec assez d'XP : achat + équipement + fermeture.
    G().setExperience(1000);
    cliquerEntree('materielTopMenu', aVendre.id);
    check('avec assez d’XP, le bouchon est acheté', G().getBouchonsPossedes().indexOf(aVendre.id) >= 0);
    checkEqual('…et immédiatement équipé', G().getFloatType(), aVendre.id);
    check('…l’XP est débitée', G().getExperience() < 1000, G().getExperience() + ' XP restants');
    checkEqual('…et le menu se ferme', G().isMenuOuvert('materiel'), false);

    // --- 8) 🎈 Matériel en technique QUIVER : les SCIONS à la place ---------
    resetToIdle();
    G().setTechnique('quiver');
    boutonMateriel.emit('click', {});
    const quiverHtml = G().getMenuHtml('materiel');
    check('en quiver, le menu annonce les scions', quiverHtml.indexOf('Scions') >= 0);
    check('…il liste les scions, pas les bouchons',
        quiverHtml.indexOf('Scion souple') >= 0 && quiverHtml.indexOf('Waggler') < 0);
    check('…avec le scion équipé marqué', quiverHtml.indexOf('✅') >= 0);
    const scions = G().getScionsPossedes().slice();
    const scionOffert = SCIONS.filter(f => f.prix === 0)[0].id;
    check('les scions de départ sont possédés', scions.indexOf(scionOffert) >= 0, scions.join());
    const autreScion = scions.filter(id => id !== G().getScion())[0];
    cliquerEntree('materielTopMenu', autreScion);
    checkEqual('un clic équipe le scion', G().getScion(), autreScion);
    checkEqual('…et referme le menu', G().isMenuOuvert('materiel'), false);
    // Achat d'un scion en XP (le premier scion payant non possédé).
    const scionAVendre = SCIONS.filter(f => f.prix > 0 && scions.indexOf(f.id) < 0)[0];
    check('un scion reste à acheter pour le test', !!scionAVendre);
    G().setExperience(0);
    boutonMateriel.emit('click', {});
    check('le menu quiver liste aussi les scions à acheter, avec leur prix',
        G().getMenuHtml('materiel').indexOf(scionAVendre.nom) >= 0
        && G().getMenuHtml('materiel').indexOf(scionAVendre.prix + ' XP') >= 0);
    cliquerEntree('materielTopMenu', scionAVendre.id);
    checkEqual('sans XP, le scion n’est pas acheté', G().getScionsPossedes().indexOf(scionAVendre.id), -1);
    G().setExperience(1000);
    cliquerEntree('materielTopMenu', scionAVendre.id);
    check('avec assez d’XP, le scion est acheté', G().getScionsPossedes().indexOf(scionAVendre.id) >= 0);
    checkEqual('…et immédiatement équipé', G().getScion(), scionAVendre.id);
    checkEqual('…le menu se ferme', G().isMenuOuvert('materiel'), false);
    resetToIdle();
    G().setTechnique('bouchon');
    G().setExperience(0);

    // --- 9) Les menus ne cassent pas la PÊCHE DU BORD (4 postes) ------------
    group('78b) La pêche du bord reste possible depuis les 4 postes');
    resetToIdle();
    [0, 1, 2, 3].forEach(function (index) {
        resetToIdle();
        check('le poste ' + index + ' est accessible', G().placerAuPoste(index) === true);
        const centre = G().getPondCenter();
        const pecheur = G().angler.position;
        const ux = centre.x - pecheur.x;
        const uz = centre.z - pecheur.z;
        const norme = Math.hypot(ux, uz) || 1;
        const cible = { x: pecheur.x + (ux / norme) * 28, z: pecheur.z + (uz / norme) * 28 };
        checkEqual('poste ' + index + ' : le lancer se pose dans l’étang',
            castTo(cible.x, cible.z), 'inWater');
        forceBite();
        checkEqual('poste ' + index + ' : un poisson peut mordre', state(), 'bite');
        strike();
        check('poste ' + index + ' : le ferrage accroche',
            state() === 'struggle' || state() === 'reeling', state());
        resetToIdle();
    });
    G().placerAuPoste(0);
    // Remise en état neutre pour les scénarios suivants.
    resetToIdle();
    G().etat.equiperEsche('ver');
    resetToIdle();
}

export default run;

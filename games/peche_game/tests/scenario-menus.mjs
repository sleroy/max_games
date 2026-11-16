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
import {
    group, check, checkEqual, GAME_DIR, G, el, fire, resetToIdle
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

function touche(menu, key) {
    fire(menu, 'keydown', { key, preventDefault() {} });
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
    touche('escheTopMenu', 'Enter');
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

    // Remise en état neutre pour les scénarios suivants.
    G().etat.equiperEsche('ver');
    resetToIdle();
}

export default run;

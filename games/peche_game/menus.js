// ---------------------------------------------------------------------------
// menus.js — MENUS DÉROULANTS DE LA BARRE DU HAUT (v192) : 🪱 Esche et 🎈 Matériel.
//
// Pas de modale, pas de fond assombri : le menu se SUPERPOSE au jeu, ancré sous son
// bouton. Un seul menu ouvert à la fois. Fermeture au clic extérieur, sur Échap, ou
// en recliquant le bouton. Navigation clavier : ↑ ↓ (Home / Fin), Entrée / Espace,
// Échap. Accessible : aria-haspopup, aria-expanded, role="menu" + menuitemradio.
//
// Contenu piloté par les données : toutes les esches (illimitées depuis la v192) et,
// selon la technique, les bouchons (flotteurs) ou les scions du quiver — possédés en
// haut (équiper), achetables en XP en dessous.
//
// Aucun accès à window / à l'API de jeu : tout arrive par `deps`.
// ---------------------------------------------------------------------------

/** Échappe un texte pour l'insérer dans du HTML (noms et descriptions sont statiques). */
function echapper(texte) {
    return String(texte)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function creerMenus(deps) {
    const {
        boutonEsche, menuEsche, boutonMateriel, menuMateriel,
        ESCHES, FLOTTEURS, SCIONS,
        equiperEsche, escheEquipee, flotteurEquipe, scionEquipe,
        bouchonPossede, setFlotteur, acheterBouchon,
        scionPossede, setScion, acheterScion,
        techniqueActuelle, getExperience, renderBoutique, ensureSound, sound, statusDisplay,
        globale
    } = deps;

    if (!boutonEsche || !menuEsche || !boutonMateriel || !menuMateriel) {
        // Page sans barre du haut (index.html ancien, en cache) : rien à faire.
        return { estOuvert: () => false, ouvrir: () => false, fermer: () => {}, rafraichir: () => {} };
    }

    // Menus : chaque entrée décrit un bouton du menu (identifiant + action à lancer).
    const MENUS = {
        esche: { bouton: boutonEsche, panneau: menuEsche, titre: '🪱 Esche', items: [] },
        materiel: { bouton: boutonMateriel, panneau: menuMateriel, titre: '🎈 Matériel', items: [] }
    };
    let ouvert = null;      // 'esche' | 'materiel' | null
    let actif = 0;          // index de l'entrée surlignée (clavier)
    let items = [];         // entrées du menu ouvert : { id, action }

    // --- Construction du contenu -------------------------------------------
    function htmlEntree(cle, options) {
        const marque = options.equipe ? '✅' : (options.prix ? options.prix + ' XP' : '');
        return '<button type="button" role="menuitemradio" tabindex="-1"'
            + ' id="' + cle + 'Menu-' + options.id + '"'
            + ' class="menu-pop-item' + (options.equipe ? ' equipe' : '') + (options.classe ? ' ' + options.classe : '') + '"'
            + ' data-id="' + options.id + '"'
            + ' aria-checked="' + (options.equipe ? 'true' : 'false') + '"'
            + (options.desactive ? ' aria-disabled="true"' : '') + '>'
            + '<span class="menu-pop-icone" aria-hidden="true">' + (options.icone || '') + '</span>'
            + '<span class="menu-pop-texte"><b>' + echapper(options.nom) + '</b>'
            + (options.detail ? '<small>' + echapper(options.detail) + '</small>' : '') + '</span>'
            + '<span class="menu-pop-marque" aria-hidden="true">' + marque + '</span>'
            + '</button>';
    }

    function construireEsches() {
        const equipee = escheEquipee ? escheEquipee() : null;
        items = ESCHES.map(esche => ({ id: esche.id, action: 'esche' }));
        items.push({ id: 'nu', action: 'esche' });
        let html = '<div class="menu-pop-titre">Esches <span>illimitées</span></div>';
        ESCHES.forEach(function (esche) {
            html += htmlEntree('esche', {
                id: esche.id, icone: esche.icone, nom: esche.nom, detail: esche.desc,
                equipe: !!equipee && equipee.id === esche.id
            });
        });
        html += htmlEntree('esche', {
            id: 'nu', icone: '🪝', nom: 'Hameçon nu', detail: 'Sans esche, presque rien ne mord.',
            equipe: !equipee
        });
        return html;
    }

    function construireMateriel() {
        const quiver = techniqueActuelle() === 'quiver';
        const liste = quiver ? SCIONS : FLOTTEURS;
        const possede = quiver ? scionPossede : bouchonPossede;
        const equipeId = quiver ? scionEquipe() : flotteurEquipe();
        const experience = getExperience();
        // Les objets POSSÉDÉS d'abord (équipables), puis ceux à ACHETER en XP.
        const ordre = liste.slice().sort(function (a, b) { return (possede(b.id) ? 1 : 0) - (possede(a.id) ? 1 : 0); });
        items = ordre.map(f => ({ id: f.id, action: possede(f.id) ? 'equiper' : 'acheter' }));
        let html = '<div class="menu-pop-titre">' + (quiver ? 'Scions <span>quiver</span>' : 'Bouchons') + '</div>';
        ordre.forEach(function (f) {
            const aLui = possede(f.id);
            html += htmlEntree('materiel', {
                id: f.id, icone: aLui ? (quiver ? '🪄' : '🎈') : '🔒', nom: f.nom,
                detail: f.atout || f.desc || '',
                equipe: aLui && f.id === equipeId,
                prix: aLui ? 0 : f.prix,
                classe: aLui ? ' possede' : ' a-vendre',
                desactive: !aLui && experience < f.prix
            });
        });
        return html;
    }

    function moteur(nom) {
        return nom === 'materiel' ? construireMateriel : construireEsches;
    }

    // --- Rendu et état -----------------------------------------------------
    function rendre() {
        const menu = MENUS[ouvert];
        if (!menu) { return; }
        menu.panneau.innerHTML = moteur(ouvert)() + aide(ouvert);
        actif = Math.max(0, Math.min(actif, items.length - 1));
        surligner();
        menu.panneau.setAttribute('aria-activedescendant', idEntree(ouvert, items[actif].id));
    }

    function aide(nom) {
        const quiver = nom === 'materiel' && techniqueActuelle() === 'quiver';
        const fin = nom === 'materiel'
            ? 'Équiper ou acheter en XP' + (quiver ? ' · scions du quiver' : ' · bouchons')
            : 'Un clic équipe l’esche';
        return '<div class="menu-pop-aide">↑ ↓ puis Entrée · Échap pour fermer<div>' + fin + '</div></div>';
    }

    function idEntree(nom, id) {
        return nom + 'Menu-' + id;
    }

    /** Surligne l'entrée `actif` (classe .actif, seule retouche après le rendu). */
    function surligner() {
        const menu = MENUS[ouvert];
        if (!menu) { return; }
        const entrees = menu.panneau.querySelectorAll
            ? menu.panneau.querySelectorAll('.menu-pop-item')
            : [];
        for (let i = 0; i < entrees.length; i++) {
            if (entrees[i].classList) { entrees[i].classList.toggle('actif', i === actif); }
        }
    }

    function estOuvert(nom) {
        return nom ? ouvert === nom : ouvert !== null;
    }

    function fermer(rendreFocus) {
        if (!ouvert) { return; }
        const menu = MENUS[ouvert];
        menu.panneau.hidden = true;
        menu.panneau.setAttribute('aria-activedescendant', '');
        menu.bouton.setAttribute('aria-expanded', 'false');
        if (rendreFocus && typeof menu.bouton.focus === 'function') { menu.bouton.focus(); }
        ouvert = null;
        actif = 0;
        items = [];
    }

    function ouvrir(nom) {
        if (!MENUS[nom]) { return false; }
        if (ouvert === nom) { fermer(true); return false; }
        // Un seul menu ouvert à la fois.
        if (ouvert) { fermer(false); }
        ensureSound();
        ouvert = nom;
        actif = 0;
        const menu = MENUS[nom];
        menu.panneau.hidden = false;
        menu.bouton.setAttribute('aria-expanded', 'true');
        rendre();
        if (typeof menu.panneau.focus === 'function') { menu.panneau.focus(); }
        return true;
    }

    function rafraichir() {
        if (ouvert) { rendre(); }
    }

    // --- Actions -----------------------------------------------------------
    function lancer(entree) {
        if (!entree) { return; }
        const nom = ouvert;
        if (nom === 'esche') {
            // « nu » = aucun identifiant d'esche : hameçon nu.
            if (equiperEsche(entree.id === 'nu' ? null : entree.id)) {
                ensureSound();
                sound.reel();
                fermer(true);
            }
        } else if (entree.action === 'equiper') {
            if (nom === 'materiel' && techniqueActuelle() === 'quiver') {
                ensureSound();
                if (setScion(entree.id)) { sound.reel(); fermer(true); }
            } else {
                ensureSound();
                setFlotteur(entree.id);
                sound.reel();
                fermer(true);
            }
        } else {
            const achete = techniqueActuelle() === 'quiver' ? acheterScion(entree.id) : acheterBouchon(entree.id);
            if (achete) {
                ensureSound();
                sound.playPiece();
                if (techniqueActuelle() === 'quiver') { setScion(entree.id); } else { setFlotteur(entree.id); }
                statusDisplay.textContent = 'Matériel acheté et équipé !';
                fermer(true);
            } else {
                statusDisplay.textContent = 'Pas assez d’expérience : pêche encore des poissons !';
            }
        }
        renderBoutique();
    }

    function entreeDepuisCible(cible) {
        if (!cible) { return null; }
        const bouton = (typeof cible.closest === 'function') ? cible.closest('[data-id]') : cible;
        const id = bouton && bouton.dataset ? bouton.dataset.id : null;
        if (!id) { return null; }
        return items.filter(item => item.id === id)[0] || null;
    }

    function contient(element, cible) {
        if (!element || !cible) { return false; }
        if (element === cible) { return true; }
        return typeof element.contains === 'function' ? element.contains(cible) : false;
    }

    // --- Écouteurs ---------------------------------------------------------
    boutonEsche.addEventListener('click', function () { ouvrir('esche'); });
    boutonMateriel.addEventListener('click', function () { ouvrir('materiel'); });

    Object.keys(MENUS).forEach(function (nom) {
        const menu = MENUS[nom];
        menu.panneau.addEventListener('click', function (evenement) {
            const entree = entreeDepuisCible(evenement && evenement.target);
            if (entree) { lancer(entree); }
        });
        menu.panneau.addEventListener('keydown', function (evenement) {
            clavier(evenement, nom);
        });
        menu.bouton.addEventListener('keydown', function (evenement) {
            if (evenement && evenement.key === 'ArrowDown') {
                if (evenement.preventDefault) { evenement.preventDefault(); }
                if (!estOuvert(nom)) { ouvrir(nom); }
            }
        });
    });

    // Touches du menu ouvert : ↑ ↓ Home Fin Entrée Espace Échap.
    function clavier(evenement, nom) {
        const touche = evenement && evenement.key;
        if (!touche || ouvert !== nom) { return; }
        let consomme = true;
        if (touche === 'ArrowDown') { actif = (actif + 1) % items.length; }
        else if (touche === 'ArrowUp') { actif = (actif - 1 + items.length) % items.length; }
        else if (touche === 'Home') { actif = 0; }
        else if (touche === 'End') { actif = items.length - 1; }
        else if (touche === 'Enter' || touche === ' ') {
            // On consomme la touche : sans cela, le navigateur déclencherait le clic
            // par défaut du bouton qui vient de reprendre le focus (menu rouvert).
            if (evenement.preventDefault) { evenement.preventDefault(); }
            lancer(items[actif]);
            return;
        } else if (touche === 'Escape' || touche === 'Tab') {
            if (evenement.preventDefault) { evenement.preventDefault(); }
            fermer(touche === 'Escape');
            return;
        }
        else { consomme = false; }
        if (consomme) {
            if (evenement.preventDefault) { evenement.preventDefault(); }
            rendre();
        }
    }

    // Écouteurs GLOBAUX (window passée par script.js) : clic extérieur et Échap.
    const cibleGlobale = globale || { addEventListener: function () {} };

    // Clic EXTÉRIEUR : ferme les menus (le clic sur un menu ou son bouton est ignoré).
    cibleGlobale.addEventListener('click', function (evenement) {
        if (!ouvert) { return; }
        const cible = evenement && evenement.target;
        if (contient(MENUS[ouvert].panneau, cible) || contient(MENUS[ouvert].bouton, cible)) { return; }
        fermer(false);
    });

    // Échap depuis n'importe où (le focus peut être resté sur le bouton).
    cibleGlobale.addEventListener('keydown', function (evenement) {
        if (ouvert && evenement && evenement.key === 'Escape') {
            if (evenement.preventDefault) { evenement.preventDefault(); }
            fermer(true);
        }
    });

    return { estOuvert, ouvrir, fermer, rafraichir };
}

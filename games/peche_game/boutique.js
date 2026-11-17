// ---------------------------------------------------------------------------
// boutique.js — EXPÉRIENCE (XP) et BOUTIQUE de bouchons : gains, achats, rendu. Extrait de script.js (v150).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=245';

export function creerBoutique(deps) {
    const {
        capaciteBouchon, journal, saveJournal, renderJournal, trouverFlotteur, flotteurCourant,
        BOUCHONS_DE_DEPART, setFloatType, FLOTTEURS, floatSelect, scionSelect, SCIONS,
        scionPossede, selectionnerFilDisponible, lineSelect, TYPES_DE_FIL, stockFil, majAmorce,
        boutique, RECHARGES, stockAmorce, TAILLE_LOT, sonarButton, boatButton, SONAR_PRICE,
        BATEAU_PRIX, ficheTouches, TOUCHES, acheterRecharge, sound, acheterSonar, acheterBateau,
        statusDisplay, ensureSound, setScion, acheterScion, trouverScion
    } = deps;

    // ---------------------------------------------------------------------------
    // Expérience et boutique de bouchons
    // ---------------------------------------------------------------------------
    // On gagne de l'expérience (XP) en rangeant des poissons dans la bourriche :
    // plus le poisson est lourd, plus il rapporte. Cette expérience sert à ACHETER
    // des bouchons aux capacités spéciales (moins de fausses touches, combat plus
    // court, visible la nuit…).

    function xpPourPrise(poids) {
        // Courbe douce : la racine évite qu'un très gros poisson achète tout d'un coup.
        const brut = 5 + Math.sqrt(Math.max(0, poids || 0)) * 12;
        // v198 : un niveau plus difficile rapporte plus d'XP par poisson
        // (facile x0,75 ; normal x1 ; difficile x1,5).
        const facteur = etat.facteurXp || 1;
        return Math.max(3, Math.round(brut * capaciteBouchon().xp * facteur));
    }

    // Encaisse l'expérience d'une prise. Renvoie le nombre de XP gagnés.
    function gagnerExperience(poids) {
        const gain = xpPourPrise(poids);
        journal.experience += gain;
        etat.experiencePartie += gain;
        saveJournal();
        renderJournal();
        return gain;
    }

    function bouchonPossede(id) {
        return journal.bouchons.indexOf(id) >= 0;
    }

    // Achète un bouchon avec l'expérience. Renvoie true si l'achat a réussi.
    function acheterBouchon(id) {
        const f = trouverFlotteur(id);
        if (!f || bouchonPossede(id) || journal.experience < f.prix) {
            return false;
        }
        journal.experience -= f.prix;
        journal.bouchons.push(id);
        saveJournal();
        renderJournal();
        return true;
    }

    // La ligne casse (nénuphars) : le bouchon part avec elle ! S'il avait été ACHETÉ
    // (payé avec de l'expérience), il quitte l'inventaire et on repêche avec un
    // bouchon de départ. Renvoie le bouchon perdu, ou null si c'était un bouchon
    // offert (les bouchons de départ sont toujours dans le sac).
    function perdreLeBouchon() {
        // Au quiver, pas de bouchon à perdre : le scion reste au bout de la canne.
        if (etat.techniqueCourante === 'quiver') { return null; }
        const flotteur = flotteurCourant();
        if ((flotteur.prix || 0) <= 0) {
            return null;
        }
        const index = journal.bouchons.indexOf(flotteur.id);
        if (index >= 0) {
            journal.bouchons.splice(index, 1);
        }
        // On reprend le premier bouchon offert.
        etat.flotteurChoix = BOUCHONS_DE_DEPART[0];
        saveJournal();
        setFloatType(etat.flotteurChoix);
        renderJournal();          // (rafraîchit aussi la boutique : on peut le racheter)
        return flotteur;
    }

    // Construit la liste déroulante (bouchons possédés) et la boutique.
    function renderBoutique() {
        // 1) La liste déroulante ne propose que ce qu'on possède.
        let options = '';
        FLOTTEURS.forEach(f => {
            if (bouchonPossede(f.id)) {
                options += '<option value="' + f.id + '">' + f.nom + '</option>';
            }
        });
        floatSelect.innerHTML = options;
        if (bouchonPossede(etat.flotteurChoix)) {
            floatSelect.value = etat.flotteurChoix;
        }
        if (scionSelect) {
            scionSelect.innerHTML = SCIONS.filter(f => scionPossede(f.id))
                .map(f => '<option value="' + f.id + '">' + f.nom + '</option>').join('');
            scionSelect.value = etat.scionChoix;
        }
        selectionnerFilDisponible();
        lineSelect.innerHTML = TYPES_DE_FIL.map(fil => '<option value="' + fil.id + '"'
            + (stockFil(fil.id) ? '' : ' disabled') + '>' + fil.nom + ' (' + stockFil(fil.id) + ')</option>').join('');
        lineSelect.value = journal.ligne;
        majAmorce();
        if (etat.majEsche) { etat.majEsche(); }
        if (!boutique) {
            return;
        }
        // 2) La boutique : un bouton « Équiper » ou « Acheter » pour chaque bouchon.
        let html = '<div class="shop-section">🧵 Fils et amorce</div><div class="shop-grid">';
        html += RECHARGES.map(article => {
            const disponible = article.id === 'amorce' ? stockAmorce() : stockFil(article.id);
            return '<div class="shop-item"><div class="shop-name">' + article.nom + ' · ' + disponible
                + ' en stock</div><div class="shop-desc">' + article.desc + '</div>'
                + '<button class="shop-btn buy" data-action="recharger" data-id="' + article.id + '"'
                + (journal.experience < article.prix ? ' disabled' : '')
                + '>Acheter ×' + TAILLE_LOT + ' · ' + article.prix + ' XP</button></div>';
        }).join('');
        // Esches (§15.2) : ILLIMITÉES (v192) — une simple liste d'équipement, sans prix ni achat.
        html += '</div><div class="shop-section">🪱 Esches (illimitées)</div><div class="shop-grid">';
        const equipee = etat.escheEquipee();
        etat.ESCHES.forEach(esche => {
            const bouton = equipee && equipee.id === esche.id
                ? '<button class="shop-btn equipped" disabled>✅ Équipée</button>'
                : '<button class="shop-btn" data-action="equiper-esche" data-id="' + esche.id + '">Équiper</button>';
            html += '<div class="shop-item owned"><div class="shop-name">' + esche.icone + ' '
                + esche.nom + '</div><div class="shop-desc">' + esche.desc + '</div>' + bouton + '</div>';
        });
        html += '<div class="shop-item"><div class="shop-name">🪝 Hameçon nu</div><div class="shop-desc">Sans esche, presque rien ne mord.</div>'
            + (equipee ? '<button class="shop-btn" data-action="equiper-esche" data-id="nu">Équiper</button>'
                : '<button class="shop-btn equipped" disabled>✅ Équipé</button>') + '</div>';
        html += '</div><div class="shop-section">🎣 Bouchons</div><div class="shop-grid">';
        FLOTTEURS.forEach(f => {
            const possede = bouchonPossede(f.id);
            const equipe = f.id === etat.flotteurChoix;
            const assez = journal.experience >= f.prix;
            let bouton;
            if (possede) {
                bouton = equipe
                    ? '<button class="shop-btn equipped" disabled>✅ Équipé</button>'
                    : '<button class="shop-btn" data-action="equiper" data-id="' + f.id + '">Équiper</button>';
            } else {
                bouton = '<button class="shop-btn buy" data-action="acheter" data-id="' + f.id + '"'
                    + (assez ? '' : ' disabled') + '>Acheter · ' + f.prix + ' XP</button>';
            }
            html += '<div class="shop-item' + (possede ? ' owned' : '') + '">'
                + '<div class="shop-name">' + f.nom
                + (possede ? '' : ' <span class="shop-price">' + f.prix + ' XP</span>') + '</div>'
                + (f.atout ? '<div class="shop-trait">' + f.atout + '</div>' : '')
                + '<div class="shop-desc">' + f.desc + '</div>'
                + bouton + '</div>';
        });
        html += '</div><div class="shop-section">🪄 Scions (quiver)</div><div class="shop-grid">';
        SCIONS.forEach(f => {
            const possede = scionPossede(f.id);
            const equipe = f.id === etat.scionChoix;
            let bouton;
            if (possede) {
                bouton = equipe
                    ? '<button class="shop-btn equipped" disabled>✅ Équipé</button>'
                    : '<button class="shop-btn" data-action="equiper-scion" data-id="' + f.id + '">Équiper</button>';
            } else {
                bouton = '<button class="shop-btn buy" data-action="acheter-scion" data-id="' + f.id + '"'
                    + (journal.experience >= f.prix ? '' : ' disabled') + '>Acheter · ' + f.prix + ' XP</button>';
            }
            html += '<div class="shop-item' + (possede ? ' owned' : '') + '">'
                + '<div class="shop-name">' + f.nom
                + (possede ? '' : ' <span class="shop-price">' + f.prix + ' XP</span>') + '</div>'
                + '<div class="shop-trait">' + f.atout + '</div>'
                + '<div class="shop-desc">' + f.desc + '</div>' + bouton + '</div>';
        });
        html += '</div><div class="shop-section">📡 Matériel</div><div class="shop-grid">';
        const owned = journal.sonar;
        sonarButton.hidden = !owned;
        const bateauPossede = journal.bateau;
        if (boatButton) { boatButton.hidden = !bateauPossede; }
        html += '<div class="shop-item' + (owned ? ' owned' : '') + '">'
            + '<div class="shop-name">📡 Sonar flottant</div>'
            + '<div class="shop-desc">Repère les poissons à 12 m autour du sonar. Pose-le depuis le menu.</div>'
            + (owned ? '<button class="shop-btn equipped" disabled>✅ Acheté</button>'
                : '<button class="shop-btn buy" data-id="sonar" data-action="acheter"'
                    + (journal.experience < SONAR_PRICE ? ' disabled' : '') + '>Acheter · ' + SONAR_PRICE + ' XP</button>')
            + '</div>';
        html += '<div class="shop-item' + (bateauPossede ? ' owned' : '') + '">'
            + '<div class="shop-name">🚤 Barque de pêche</div>'
            + '<div class="shop-desc">Pêche au milieu de l’étang, là où sont les gros ! Une fois à bord : '
                + 'flèches ou ZQSD pour ramer, clic sur l’eau pour lancer. '
                + 'Le bouton « Bateau » apparaît en bas à gauche.</div>'
            + (bateauPossede ? '<button class="shop-btn equipped" disabled>✅ Acheté</button>'
                : '<button class="shop-btn buy" data-id="bateau" data-action="acheter"'
                    + (journal.experience < BATEAU_PRIX ? ' disabled' : '') + '>Acheter · ' + BATEAU_PRIX + ' XP</button>')
            + '</div></div>';
        boutique.innerHTML = html;
    }

    // Fiche « comment reconnaître les touches » : le petit livre du pêcheur.
    // On y retrouve tout le catalogue, séparé en fausses et vraies touches.
    function renderFicheTouches() {
        if (!ficheTouches) {
            return;
        }
        let html = '';
        [false, true].forEach(function (vrai) {
            html += '<div class="touch-titre' + (vrai ? ' vrai' : '') + '">'
                + (vrai ? '✅ VRAIES touches — il faut ferrer !' : '❌ Fausses touches — ne ferre pas')
                + '</div>';
            TOUCHES.forEach(function (t) {
                if (t.vrai !== vrai) {
                    return;
                }
                html += '<div class="touch-item"><b>' + t.nom + '</b><span>' + t.desc + '</span></div>';
            });
        });
        ficheTouches.innerHTML = html;
    }

    // Un seul écouteur pour toute la boutique (les boutons sont recréés souvent).
    boutique.addEventListener('click', event => {
        const cible = event.target;
        if (!cible || !cible.dataset || !cible.dataset.id) {
            return;
        }
        const id = cible.dataset.id;
        if (cible.dataset.action === 'equiper-esche') {
            if (etat.equiperEsche(id === 'nu' ? null : id)) { ensureSound(); sound.reel(); renderBoutique(); }
            return;
        }
        if (cible.dataset.action === 'recharger') {
            if (acheterRecharge(id)) { sound.playPiece(); }
            return;
        }
        if (id === 'sonar' && cible.dataset.action === 'acheter') {
            if (acheterSonar()) { sound.playPiece(); }
            return;
        }
        if (id === 'bateau' && cible.dataset.action === 'acheter') {
            if (acheterBateau()) {
                sound.playPiece();
                statusDisplay.textContent = '🚤 Barque achetée ! Le bouton « Bateau » t’attend en bas à gauche.';
            } else {
                statusDisplay.textContent = 'Pas assez d’expérience pour la barque.';
            }
            return;
        }
        if (cible.dataset.action === 'equiper-scion') {
            ensureSound();
            setScion(id);
            sound.reel();
        } else if (cible.dataset.action === 'acheter-scion') {
            if (acheterScion(id)) {
                ensureSound();
                setScion(id);
                sound.playPiece();
                statusDisplay.textContent = trouverScion(id).nom + ' acheté et équipé !';
            } else {
                statusDisplay.textContent = 'Pas assez d’expérience pour ce scion.';
            }
        } else if (cible.dataset.action === 'equiper') {
            ensureSound();
            setFloatType(id);
            sound.reel();
        } else if (cible.dataset.action === 'acheter') {
            if (acheterBouchon(id)) {
                ensureSound();
                setFloatType(id);
                sound.playPiece();
                const f = trouverFlotteur(id);
                statusDisplay.textContent = f.nom + ' acheté et équipé ! ' + f.atout;
            } else {
                statusDisplay.textContent = 'Pas assez d’expérience : pêche encore des poissons pour ce bouchon !';
            }
        }
        renderBoutique();
    });

    return {
        xpPourPrise, gagnerExperience, bouchonPossede, acheterBouchon, perdreLeBouchon,
        renderBoutique, renderFicheTouches
    };
}

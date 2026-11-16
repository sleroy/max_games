// ---------------------------------------------------------------------------
// bouchons.js — TYPES DE BOUCHONS (flotteurs), scions du quiver et capacités spéciales. Extrait de script.js (v156).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=206';

export function creerBouchons(deps) {
    const {
        SCIONS_DE_DEPART, SCIONS, appliquerProfondeurVisuelle, floatSelect, floatInfo,
        setProfondeur, saveJournal, scionSelect, renderJournal
    } = deps;

    // ---------------------------------------------------------------------------
    // Types de bouchons (flotteurs) : chacun a sa sensibilité à la touche.
    //   - plus sensible = fenêtre de ferrage plus longue, MAIS plus de fausses
    //     touches (le bouchon bouge pour un rien) ;
    //   - sur une touche en remontée : l'anglaise sort la moitié de sa tige, un
    //     bouchon court et sensible (waggler) se couche sur le côté.
    // ---------------------------------------------------------------------------
    // Capacités spéciales des bouchons. Les valeurs « neutres » valent 1.
    //   fenetre  : longueur de la fenêtre de ferrage (> 1 = plus facile)
    //   fausses  : nombre de fausses touches (< 1 = moins de pièges)
    //   avantage : avantage laissé au poisson au ferrage (< 1 = mieux pour toi)
    //   temps    : temps d'épreuve de force (> 1 = plus de temps)
    //   xp       : expérience gagnée (> 1 = plus d'expérience)
    //   voyant   : le bouchon reste visible la nuit
    const CAPACITE_BASE = { fenetre: 1, fausses: 1, avantage: 1, temps: 1, xp: 1, voyant: false };

    // Bouchons offerts au départ (les autres s'ACHÈTENT avec l'expérience).
    etat.BOUCHONS_DE_DEPART = ['anglaise', 'waggler', 'coulisse', 'bolognaise'];

    etat.FLOTTEURS = [
        { id: 'anglaise', nom: 'Anglaise', profondeur: [0.6, 9.0], prix: 0, atout: '🎯 Très sensible', capacite: {}, sensibilite: 1.35, remontee: 'demi-tige', longueur: 0.45,
          couleur: 0xff5a3c, corps: 0xf4f4f4,
          desc: 'Anglaise : longue tige fine, très sensible. Sur une touche en remontée, la moitié de la tige ressort. Attention : elle bouge aussi sur les fausses touches !' },
        { id: 'waggler', nom: 'Waggler', profondeur: [0.6, 9.0], prix: 0, atout: '🎯 Sensible', capacite: {}, sensibilite: 1.15, remontee: 'couche', longueur: 0.35,
          couleur: 0xffd24d, corps: 0xf4f4f4,
          desc: 'Waggler : bouchon court et fin pour l’eau calme. Très sensible ; quand le poisson remonte, il se couche sur le côté.' },
        { id: 'coulisse', nom: 'Pose à coulisse', profondeur: [0.8, 9.0], prix: 0, atout: '⚖️ Sensibilité moyenne', capacite: {}, sensibilite: 0.85, remontee: 'couche', longueur: 0.5,
          couleur: 0xd0552a, corps: 0xf4f4f4,
          desc: 'Pose à coulisse : bouchon coulissant pour pêcher profond. Sensibilité moyenne, un peu moins de fausses touches.' },
        { id: 'bolognaise', nom: 'Bolognaise', profondeur: [1.2, 9.0], prix: 0, atout: '🛡️ Peu de fausses touches', capacite: {}, sensibilite: 0.7, remontee: 'demi-tige', longueur: 0.8,
          couleur: 0xe04a2a, corps: 0xffe066,
          desc: 'Bolognaise : gros bouchon pour lancer loin. Peu sensible : la fenêtre de ferrage est courte, mais il y a moins de fausses touches.' },
        // --- Bouchons à ACHETER avec l'expérience (capacités spéciales) ---
        { id: 'plume', nom: 'Plume d’oie lumineuse', profondeur: [0.6, 9.0], prix: 40, remontee: 'couche', longueur: 0.4,
          couleur: 0x8ef0c0, corps: 0xf7f7f7, atout: '💡 Visible la nuit',
          capacite: { voyant: true, fenetre: 1.1 }, sensibilite: 1.0,
          desc: 'Plume lumineuse : elle brille doucement, donc tu la vois même quand la nuit tombe. Un peu plus de temps pour ferrer.' },
        { id: 'truque', nom: 'Bouchon truqué', profondeur: [0.6, 9.0], prix: 70, remontee: 'couche', longueur: 0.38,
          couleur: 0xff7ad9, corps: 0xf4f4f4, atout: '🤫 Moins de fausses touches',
          capacite: { fausses: 0.55 }, sensibilite: 1.2,
          desc: 'Bouchon truqué : il ne bouge presque pas pour rien. Bien moins de fausses touches : tu serres au bon moment !' },
        { id: 'plombee', nom: 'Waggler plombé', profondeur: [1.2, 9.0], prix: 110, remontee: 'couche', longueur: 0.4,
          couleur: 0x2f6fd0, corps: 0xe8e8e8, atout: '🏋️ Combat plus court',
          capacite: { temps: 1.25, avantage: 0.9 }, sensibilite: 0.9,
          desc: 'Waggler plombé : bien posé dans l’eau, il fatigue le poisson. L’épreuve de force dure plus longtemps et le poisson a moins d’avance.' },
        { id: 'maitre', nom: 'Bouchon du maître', profondeur: [0.6, 9.0], prix: 200, remontee: 'demi-tige', longueur: 0.55,
          couleur: 0xffd700, corps: 0x222222, atout: '🏆 Polyvalent + 50 % d’expérience',
          capacite: { fenetre: 1.2, fausses: 0.7, avantage: 0.85, temps: 1.15, xp: 1.5, voyant: true },
          sensibilite: 1.25,
          desc: 'Le bouchon du maître pêcheur : un peu tout à la fois (ferrage plus facile, moins de fausses touches, poisson moins combatif) et 50 % d’expérience en plus !' }
    ];
    etat.flotteurChoix = 'anglaise';
    // Technique de pêche : 'bouchon' (flotteur) ou 'quiver' (scion de canne, hameçon au fond).
    etat.techniqueCourante = 'bouchon';
    etat.scionChoix = SCIONS_DE_DEPART[0];

    function trouverScion(id) {
        for (let i = 0; i < SCIONS.length; i++) {
            if (SCIONS[i].id === id) { return SCIONS[i]; }
        }
        return null;
    }

    function scionCourant() {
        return trouverScion(etat.scionChoix) || SCIONS[0];
    }

    // En quiver, le « bouchon » actif est le SCION : sensibilité et capacités suivent.
    function flotteurCourant() {
        if (etat.techniqueCourante === 'quiver') { return scionCourant(); }
        for (let i = 0; i < etat.FLOTTEURS.length; i++) {
            if (etat.FLOTTEURS[i].id === etat.flotteurChoix) {
                return etat.FLOTTEURS[i];
            }
        }
        return etat.FLOTTEURS[0];
    }

    function appliquerFlotteurVisuel(f) {
        // La tige s'allonge selon le modèle (elle ressort plus ou moins de l'eau).
        etat.floatStick.scale.y = f.longueur / 0.5;
        etat.floatStick.position.y = 0.04 + f.longueur / 2;
        etat.floatStick.material.color.set(f.couleur);
        etat.floatBody.material.color.set(f.corps);
        etat.floatStick.userData.longueur = f.longueur;
        // Bouchons lumineux : une petite lueur propre les rend lisibles la nuit.
        const lueur = capaciteBouchon(f).voyant;
        if (etat.floatStick.material.emissive) {
            etat.floatStick.material.emissive.set(lueur ? f.couleur : 0x000000);
            etat.floatStick.material.emissiveIntensity = lueur ? 0.9 : 0;
        }
        if (etat.floatBody.material.emissive) {
            etat.floatBody.material.emissive.set(lueur ? 0x335566 : 0x000000);
            etat.floatBody.material.emissiveIntensity = lueur ? 0.45 : 0;
        }
        // Le bas de ligne et l'hameçon suivent la profondeur réglée.
        appliquerProfondeurVisuelle();
    }

    function setFloatType(id) {
        const f = trouverFlotteur(id);
        // Un bouchon inconnu, ou pas encore acheté, ne peut pas être équipé.
        if (!f || !etat.bouchonPossede(f.id)) {
            return;
        }
        etat.flotteurChoix = f.id;
        if (floatSelect.value !== f.id) {
            floatSelect.value = f.id;
        }
        floatInfo.textContent = f.desc;
        appliquerFlotteurVisuel(f);
        // La profondeur est bornée par le bouchon choisi (une pose à coulisse va
        // beaucoup plus profond qu'une anglaise).
        setProfondeur(etat.profondeurLigne);
        etat.journal.bouchon = f.id;
        saveJournal();
    }

    function scionPossede(id) {
        return etat.journal.scions.indexOf(id) >= 0;
    }

    // Équipe un scion possédé (mode quiver).
    function setScion(id) {
        const f = trouverScion(id);
        if (!f || !scionPossede(f.id)) { return false; }
        etat.scionChoix = f.id;
        etat.journal.scion = f.id;
        saveJournal();
        if (scionSelect && scionSelect.value !== f.id) { scionSelect.value = f.id; }
        if (etat.techniqueCourante === 'quiver') { floatInfo.textContent = f.desc; }
        return true;
    }

    function acheterScion(id) {
        const f = trouverScion(id);
        if (!f || scionPossede(id) || etat.journal.experience < f.prix) { return false; }
        etat.journal.experience -= f.prix;
        etat.journal.scions.push(id);
        saveJournal();
        renderJournal();
        return true;
    }

    // Retrouve un bouchon par son identifiant (ou null).
    function trouverFlotteur(id) {
        for (let i = 0; i < etat.FLOTTEURS.length; i++) {
            if (etat.FLOTTEURS[i].id === id) {
                return etat.FLOTTEURS[i];
            }
        }
        return null;
    }

    // Capacités du bouchon donné (ou du bouchon équipé) : les valeurs manquantes
    // prennent la valeur neutre (CAPACITE_BASE).
    function capaciteBouchon(f) {
        const c = (f || flotteurCourant()).capacite || {};
        return {
            fenetre: c.fenetre || CAPACITE_BASE.fenetre,
            fausses: c.fausses || CAPACITE_BASE.fausses,
            avantage: c.avantage || CAPACITE_BASE.avantage,
            temps: c.temps || CAPACITE_BASE.temps,
            xp: c.xp || CAPACITE_BASE.xp,
            voyant: !!c.voyant
        };
    }

    return {
        trouverScion, flotteurCourant, appliquerFlotteurVisuel, setFloatType, scionPossede,
        setScion, acheterScion, trouverFlotteur, capaciteBouchon
    };
}

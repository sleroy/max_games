// ---------------------------------------------------------------------------
// esches.js — LES ESCHES (idées.md §15.2) : maïs, ver de terre, pain / flocons, bouillette,
// vif / leurre. L'hameçon n'est plus « nu » : l'esche équipée décide si un poisson qui arrive sur
// l'hameçon se laisse tenter.
//
// Deux parties :
//  - le MODÈLE (fonctions pures, testables sans jeu) : efficacité d'une esche pour une espèce, selon
//    la COUCHE de l'hameçon (surface, mi-eau, fond) et le SUBSTRAT (substrats.js, §14.3) ;
//  - le SYSTÈME (creerEsches) : la décision d'un poisson qui arrive sur l'hameçon (une fois par
//    poisson et par lancer), le message discret après plusieurs refus, l'étiquette du widget.
//
// Les STOCKS (lots de 3, achat en XP, esche équipée) sont ceux de stocks.js : mêmes lots et même
// compte `journal.recharges` que les fils et l'amorce (RECHARGES), persistés par carnet.js.
// ⚠ Depuis la v192 les esches sont ILLIMITÉES : plus de lot, plus d'achat, plus de consommation.
// Seule l'esche ÉQUIPÉE (`journal.esche`) est gardée par stocks.js / carnet.js.
// ⚠ Ce module ne consomme JAMAIS `rand()` : il a son propre générateur à graine fixe.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=209';

// Probabilité de touche d'un poisson de la mauvaise espèce (esche inadaptée) et de l'hameçon NU :
// pêcher sans esche reste possible, mais presque rien ne mord.
export const PROBA_INADAPTEE = 0.06;
export const PROBA_NU = 0.06;
export const REFUS_MESSAGE = 3;   // un message discret tous les 3 refus

// cibles   : espèce → poids (1 = esche reine ; absent = PROBA_INADAPTEE) ;
// couches  : poids par couche de l'hameçon ; une esche de fond posée en surface ne vaut presque rien ;
// substrats: poids par fond (1 si absent) : le maïs se perd dans l'herbier, le leurre y est roi.
// exclusif : vrai = les espèces absentes de `cibles` IGNORENT l'esche (probabilité 0, pas PROBA_INADAPTEE) :
//            un herbivore ne touche pas un vif, un carnassier ne touche pas une bouillette.
// tailleMin: longueur (cm) en dessous de laquelle un poisson ne peut pas avaler l'esche (il l'ignore).
export const ESCHES = [
    { id: 'mais', nom: 'Maïs', icone: '🌽', prix: 8,
      desc: 'Doux et sucré, il coule et reste au fond.',
      exclusif: true,
      cibles: { carpe: 1, tanche: 1, breme: 1, carassin: 0.5 },
      couches: { surface: 0.12, 'mi-eau': 0.5, fond: 1 },
      substrats: { vase: 1, sable: 1, gravier: 0.95, roche: 0.7, herbier: 0.6 } },
    { id: 'ver', nom: 'Ver de terre', icone: '🪱', prix: 6,
      desc: 'Le classique de tous les pêcheurs : il gigote.',
      cibles: { gardon: 1, perche: 1, anguille: 1, goujon: 1, rotengle: 0.5, chevesne: 0.5, truite: 0.5, tanche: 0.35, breme: 0.35, carassin: 0.35, silure: 0.2 },
      couches: { surface: 0.45, 'mi-eau': 1, fond: 0.9 },
      substrats: { vase: 1, sable: 1, gravier: 1, roche: 0.85, herbier: 0.8 } },
    { id: 'pain', nom: 'Pain / flocons', icone: '🍞', prix: 6,
      desc: 'Léger, il flotte et se délite en petits nuages.',
      exclusif: true,
      cibles: { gardon: 1, rotengle: 1, chevesne: 1, ablette: 0.5 },
      couches: { surface: 1, 'mi-eau': 0.45, fond: 0.1 },
      substrats: { herbier: 0.8 } },
    { id: 'bouillette', nom: 'Bouillette', icone: '🟤', prix: 14,
      desc: 'Une grosse boule dure, lourde, faite pour rester au fond.',
      exclusif: true, tailleMin: 25,   // grosse boule dure : les petits poissons ne peuvent pas l'avaler
      cibles: { carpe: 1, carassin: 1 },
      couches: { surface: 0.03, 'mi-eau': 0.25, fond: 1 },
      substrats: { vase: 0.85, roche: 0.7, herbier: 0.6 } },
    { id: 'vif', nom: 'Vif / leurre', icone: '🐟', prix: 16,
      desc: 'Un petit poisson ou un leurre qui nage : il se montre.',
      exclusif: true, tailleMin: 15,   // seuls les carnassiers attaquent un vif / leurre
      cibles: { brochet: 1, sandre: 1, 'black-bass': 1, perche: 0.5, truite: 0.5, silure: 0.5, anguille: 0.2 },
      couches: { surface: 0.7, 'mi-eau': 1, fond: 0.65 },
      substrats: { herbier: 1, roche: 1, vase: 0.9, sable: 0.95 } }
];
export const IDS_ESCHES = ESCHES.map(function (e) { return e.id; });
// Les 3 premiers vers sont offerts (comme l'amorce de départ) : on apprend avant d'acheter.
export const ESCHE_DEPART = { id: 'ver', quantite: 3 };

// Couche de l'hameçon : « fond » à moins de 1,2 unité du fond (même seuil que les poissons de fond,
// comportement.js), « surface » sous 1,6 unité de ligne, « mi-eau » entre les deux. Au quiver,
// l'hameçon est posé au fond. C'est aussi ce qu'affiche le widget de profondeur.
export function coucheHamecon(profondeurLigne, profondeurEau, auFond) {
    if (auFond || profondeurEau - profondeurLigne <= 1.2) { return 'fond'; }
    return profondeurLigne < 1.6 ? 'surface' : 'mi-eau';
}

// Probabilité (0 → 1) qu'un poisson de l'espèce prenne l'esche : espèce × couche × fond.
// `escheId` null = hameçon nu.
// `longueurCm` (facultatif) : un poisson trop petit pour l'esche (`tailleMin`) l'ignore.
export function efficaciteEsche(escheId, especeId, couche, substrat, longueurCm) {
    const esche = ESCHES.find(function (e) { return e.id === escheId; });
    if (!esche) { return PROBA_NU; }
    if (esche.tailleMin && typeof longueurCm === 'number' && longueurCm < esche.tailleMin) { return 0; }
    const inconnue = esche.exclusif ? 0 : PROBA_INADAPTEE;
    const espece = esche.cibles[especeId] === undefined ? inconnue : esche.cibles[especeId];
    const fond = esche.substrats[substrat] === undefined ? 1 : esche.substrats[substrat];
    return Math.max(0, Math.min(1, espece * (esche.couches[couche] === undefined ? 1 : esche.couches[couche]) * fond));
}

export function creerEsches(deps) {
    const { verdictFond, modeQuiver, statusDisplay, etiquette } = deps;

    etat.eschesActives = true;   // faux dans les tests historiques : tout poisson mord (voir harness.mjs)
    etat.numeroLancer = 0;       // incrémenté à chaque lancer (cycleLigne.js) : une décision par poisson et par lancer
    etat.escheStats = { acceptees: 0, refusees: 0, serieRefus: 0 };

    // Générateur local à graine fixe : le hasard du monde (rand) n'est pas touché.
    let graine = 0x1badf00d;
    function hasard() {
        graine = (graine + 0x6d2b79f5) >>> 0;
        let t = graine;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Couche et substrat à la position du bouchon, à cet instant.
    function contexte() {
        const pos = etat.floatGroup.position;
        const quiver = modeQuiver.estActif();
        const verdict = verdictFond(pos.x, pos.z, etat.profondeurLigne, quiver);
        // §15.1 : en été, la thermocline fait office de fond pour les poissons (etat.profondeurUtile).
        return { couche: coucheHamecon(etat.profondeurLigne, etat.profondeurUtile(verdict.profondeurEau), quiver), substrat: verdict.substrat };
    }

    function probabilite(especeId, longueurCm) {
        const esche = etat.escheEquipee ? etat.escheEquipee() : null;
        const c = contexte();
        return efficaciteEsche(esche ? esche.id : null, especeId, c.couche, c.substrat, longueurCm);
    }

    // Le poisson arrivé sur l'hameçon prend-il l'esche ? Décision UNIQUE par poisson et par lancer :
    // un poisson qui refuse s'en désintéresse (voir comportement.js, `refuseLEsche`).
    function accepterTouche(fish) {
        // MODE FACILE : tous les poissons acceptent l'esche (aucun refus).
        if (etat.modeFacile) { return true; }
        if (!etat.eschesActives) { return true; }
        const d = fish.userData;
        if (d.escheLancer === etat.numeroLancer) { return d.escheAccepte; }
        const accepte = hasard() < probabilite(d.especeId, d.longueurCm);
        d.escheLancer = etat.numeroLancer;
        d.escheAccepte = accepte;
        const stats = etat.escheStats;
        if (accepte) {
            stats.acceptees++;
            stats.serieRefus = 0;
        } else {
            stats.refusees++;
            stats.serieRefus++;
            // Message DISCRET, jamais d'aide explicite : le joueur comprend seul.
            if (stats.serieRefus % REFUS_MESSAGE === 0) {
                etat.spawnFloatingText(stats.serieRefus % (2 * REFUS_MESSAGE) === 0 ? 'Ils boudent…' : 'Ils tournent autour…',
                    etat.floatGroup.position, '#aab8c8');
                statusDisplay.textContent = 'Les poissons s’approchent… mais aucun ne se décide.';
            }
        }
        return accepte;
    }

    // Ce poisson a-t-il refusé l'esche pendant CE lancer ? (il ne s'intéresse plus à l'hameçon)
    function refuseLEsche(d) {
        if (etat.modeFacile) { return false; }
        return etat.eschesActives && d.escheLancer === etat.numeroLancer && d.escheAccepte === false;
    }

    // Étiquette du widget de profondeur : l'esche équipée (illimitée : pas de compteur).
    function majEtiquette() {
        if (!etiquette) { return; }
        const esche = etat.escheEquipee ? etat.escheEquipee() : null;
        etiquette.textContent = esche ? esche.icone + ' Esche : ' + esche.nom : '🪝 Hameçon nu';
    }
    etat.accepterTouche = accepterTouche;
    etat.refuseLEsche = refuseLEsche;
    etat.majEsche = majEtiquette;

    return { accepterTouche, refuseLEsche, probabilite, contexte, majEtiquette };
}

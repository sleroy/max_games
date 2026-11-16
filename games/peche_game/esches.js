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
import { etat } from './etat.js?v=233';

// Probabilité de touche d'un poisson de la mauvaise espèce (esche inadaptée) et de l'hameçon NU :
// pêcher sans esche reste possible, mais presque rien ne mord.
export const PROBA_INADAPTEE = 0.06;
export const PROBA_NU = 0.04;
export const REFUS_MESSAGE = 3;   // un message discret tous les 3 refus
export const PATIENCE_POISSON = 15;   // secondes à tourner autour de l'hameçon sans mordre avant de s'en lasser

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
      cibles: { gardon: 1, perche: 1, anguille: 1, goujon: 1, rotengle: 0.5, chevesne: 0.5, truite: 0.5, tanche: 0.35, breme: 0.35, carassin: 0.35,
               // Silure : une grosse grappe de vers, très odorante, est l'un de ses meilleurs appâts.
               silure: 0.75,
               // Ablette : l'asticot et le ver de vase sont SES appâts de référence (pêche au coup).
               ablette: 0.5,
               // Un ver qui gigote tente parfois même les autres : mieux qu'un hameçon nu, sans être leur esche.
               carpe: 0.15, brochet: 0.15, sandre: 0.15, 'black-bass': 0.15 },
      couches: { surface: 0.45, 'mi-eau': 1, fond: 0.9 },
      substrats: { vase: 1, sable: 1, gravier: 1, roche: 0.85, herbier: 0.8 } },
    { id: 'pain', nom: 'Pain / flocons', icone: '🍞', prix: 6,
      desc: 'Léger, il flotte et se délite en petits nuages.',
      exclusif: true,
      // Mie de pain : classique d'été de l'ablette, qui gobe les miettes en surface.
      cibles: { gardon: 1, rotengle: 1, chevesne: 1, ablette: 0.7 },
      couches: { surface: 1, 'mi-eau': 0.45, fond: 0.1 },
      substrats: { herbier: 0.8 } },
    { id: 'bouillette', nom: 'Bouillette', icone: '🟤', prix: 14,
      desc: 'Une grosse boule dure, lourde, faite pour rester au fond.',
      exclusif: true, tailleMin: 25,   // grosse boule dure : les petits poissons ne peuvent pas l'avaler
      // Silure : les bouillettes carnées (calmar, foie, 24 à 30 mm) le sélectionnent bien.
      cibles: { carpe: 1, carassin: 1, silure: 0.7 },
      couches: { surface: 0.03, 'mi-eau': 0.25, fond: 1 },
      substrats: { vase: 0.85, roche: 0.7, herbier: 0.6 } },
    { id: 'vif', nom: 'Vif / leurre', icone: '🐟', prix: 16,
      desc: 'Un petit poisson ou un leurre qui nage : il se montre.',
      exclusif: true, tailleMin: 15,   // seuls les carnassiers attaquent un vif / leurre
      cibles: { brochet: 1, sandre: 1, 'black-bass': 1, silure: 1, truite: 0.75, perche: 0.5, anguille: 0.2 },
      couches: { surface: 0.7, 'mi-eau': 1, fond: 0.65 },
      substrats: { herbier: 1, roche: 1, vase: 0.9, sable: 0.95 } },
    // La mouche : l'esche de la truite (le leurre vient en second, le ver en troisième).
    // Un insecte posé à la surface : seuls les poissons qui gobent en surface s'y intéressent.
    { id: 'mouche', nom: 'Mouche', icone: '🪰', prix: 12,
      desc: 'Un petit insecte posé sur l’eau : la truite adore le gober.',
      exclusif: true,
      cibles: { truite: 1, chevesne: 0.6, ablette: 0.5, rotengle: 0.4, gardon: 0.25 },
      couches: { surface: 1, 'mi-eau': 0.35, fond: 0.05 },
      substrats: {} }
];
// ESCHE VOLÉE quand le ferrage est raté (le poisson recrache) : probabilité selon l'esche.
// Le pain se délite, le ver s'arrache ; la bouillette, montée sur un cheveu, tient bien.
// En mode Dur, la perte est un peu plus fréquente (× PERTE_FACTEUR_DUR) et SILENCIEUSE :
// le joueur ne le découvre qu'en ramenant sa ligne au bord. Jamais en mode facile.
export const PERTE_ESCHE = { pain: 0.8, ver: 0.5, mouche: 0.4, mais: 0.3, vif: 0.3, bouillette: 0.1 };
export const PERTE_FACTEUR_DUR = 1.25;
// « Le poisson a volé … »
export const NOM_VOLE = { mais: 'ton maïs', ver: 'ton ver', pain: 'ton pain', bouillette: 'ta bouillette', vif: 'ton vif', mouche: 'ta mouche' };

// Probabilité de perdre l'esche `escheId` sur un ferrage raté, selon le mode ('facile' | 'normal' | 'dur').
export function probaPerteEsche(escheId, mode) {
    if (mode === 'facile' || !escheId) { return 0; }
    const p = PERTE_ESCHE[escheId] || 0;
    return Math.min(1, mode === 'dur' ? p * PERTE_FACTEUR_DUR : p);
}

export const IDS_ESCHES = ESCHES.map(function (e) { return e.id; });
// Les 3 premiers vers sont offerts (comme l'amorce de départ) : on apprend avant d'acheter.
export const ESCHE_DEPART = { id: 'ver', quantite: 3 };

// Les trois couches d'hameçon que `coucheHamecon` peut renvoyer (vocabulaire unique du mode facile).
export const COUCHES_HAMECON = ['surface', 'mi-eau', 'fond'];

// Couche de l'hameçon : « fond » à moins de 1,2 unité du fond (même seuil que les poissons de fond,
// comportement.js), « surface » sous 1,6 unité de ligne, « mi-eau » entre les deux. Au quiver,
// l'hameçon est posé au fond. C'est aussi ce qu'affiche le widget de profondeur.
export function coucheHamecon(profondeurLigne, profondeurEau, auFond) {
    if (auFond || profondeurEau - profondeurLigne <= 1.2) { return 'fond'; }
    return profondeurLigne < 1.6 ? 'surface' : 'mi-eau';
}

// Le poisson est-il trop petit pour avaler cette esche (bouillette, vif) ? Règle UNIQUE, partagée par
// `efficaciteEsche`, `evaluerTouche` (raison « taille ») et la matrice des touches.
export function tropPetitPourEsche(escheId, longueurCm) {
    const esche = ESCHES.find(function (e) { return e.id === escheId; });
    return !!(esche && esche.tailleMin && typeof longueurCm === 'number' && longueurCm < esche.tailleMin);
}

// Probabilité (0 → 1) qu'un poisson de l'espèce prenne l'esche : espèce × couche × fond.
// `escheId` null = hameçon nu.
// `longueurCm` (facultatif) : un poisson trop petit pour l'esche (`tailleMin`) l'ignore.
export function efficaciteEsche(escheId, especeId, couche, substrat, longueurCm) {
    const esche = ESCHES.find(function (e) { return e.id === escheId; });
    if (!esche) { return PROBA_NU; }
    if (tropPetitPourEsche(escheId, longueurCm)) { return 0; }
    const inconnue = esche.exclusif ? 0 : PROBA_INADAPTEE;
    const espece = esche.cibles[especeId] === undefined ? inconnue : esche.cibles[especeId];
    const fond = esche.substrats[substrat] === undefined ? 1 : esche.substrats[substrat];
    return Math.max(0, Math.min(1, espece * (esche.couches[couche] === undefined ? 1 : esche.couches[couche]) * fond));
}

// MODE FACILE : seuil de la « meilleure chance » d'une esche pour une espèce. Strictement au-dessus :
// la touche est certaine (100 %) ; sinon le poisson ignore l'esche (0 %).
export const SEUIL_FACILE = 0.6;

// Plafond de chance (0 → 1) de l'esche pour l'espèce : le maximum de efficaciteEsche sur les trois
// couches d'hameçon, sur le fond neutre (poids 1 : le meilleur fond possible, donc le plafond).
// ⚠ Ce plafond est ≥ la valeur du tableau « meilleure chance par poisson et par esche » de la matrice :
// celle-ci applique en plus la couche d'eau de l'espèce (règle `dansCouche`), que le mode facile ignore.
// `escheId` null ou inconnue = hameçon nu (PROBA_NU).
export function chanceMaximaleEsche(escheId, especeId, longueurCm) {
    let meilleure = 0;
    COUCHES_HAMECON.forEach(function (couche) {
        meilleure = Math.max(meilleure, efficaciteEsche(escheId, especeId, couche, undefined, longueurCm));
    });
    return meilleure;
}

// MODE FACILE : décision binaire, sans hasard. 1 si le plafond de l'esche dépasse SEUIL_FACILE, sinon 0
// (le poisson ignore l'esche, hameçon nu compris). Marge 1e-9 : 0,75 × 0,8 vaut 0,6000000000000001.
export function acceptationFacile(escheId, especeId, longueurCm) {
    return chanceMaximaleEsche(escheId, especeId, longueurCm) > SEUIL_FACILE + 1e-9 ? 1 : 0;
}

export function creerEsches(deps) {
    const { verdictFond, modeQuiver, statusDisplay, saveJournal, etiquette } = deps;

    etat.eschesActives = true;   // faux dans les tests historiques : tout poisson mord (voir harness.mjs)
    etat.numeroLancer = 0;       // incrémenté à chaque lancer (cycleLigne.js) : une décision par poisson et par lancer
    etat.escheStats = { acceptees: 0, refusees: 0, serieRefus: 0 };

    etat.escheVolee = false;     // mode Dur : esche perdue mais pas encore découverte (étiquette inchangée)

    // Générateurs locaux à graine fixe : le hasard du monde (rand) n'est pas touché.
    // La perte d'esche a le sien, pour ne pas décaler les décisions de touche.
    function generateur(graine) {
        return function () {
            graine = (graine + 0x6d2b79f5) >>> 0;
            let t = graine;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const hasard = generateur(0x1badf00d);
    const hasardPerte = generateur(0x5eedbea7);

    // Esche réellement au bout de la ligne (null si volée sans que le joueur le sache).
    function escheAuBout() {
        if (etat.escheVolee) { return null; }
        return etat.escheEquipee ? etat.escheEquipee() : null;
    }

    // Couche et substrat à la position du bouchon, à cet instant.
    function contexte() {
        const pos = etat.floatGroup.position;
        const quiver = modeQuiver.estActif();
        const verdict = verdictFond(pos.x, pos.z, etat.profondeurLigne, quiver);
        // §15.1 : en été, la thermocline fait office de fond pour les poissons (etat.profondeurUtile).
        return { couche: coucheHamecon(etat.profondeurLigne, etat.profondeurUtile(verdict.profondeurEau), quiver), substrat: verdict.substrat,
            profondeurEau: verdict.profondeurEau };
    }

    function probabilite(especeId, longueurCm) {
        const esche = escheAuBout();
        // Facile : 1 ou 0 selon la meilleure chance de l'esche (ni couche ni fond, ni hasard).
        if (etat.modeFacile) { return acceptationFacile(esche ? esche.id : null, especeId, longueurCm); }
        const c = contexte();
        return efficaciteEsche(esche ? esche.id : null, especeId, c.couche, c.substrat, longueurCm);
    }

    // Le poisson arrivé sur l'hameçon prend-il l'esche ? Décision UNIQUE par poisson et par lancer :
    // un poisson qui refuse s'en désintéresse (voir comportement.js, `refuseLEsche`).
    function accepterTouche(fish) {
        if (!etat.eschesActives) { return true; }
        const d = fish.userData;
        // MODE FACILE : 100 % ou rien (règle unique : acceptationFacile), sans hasard ni message.
        if (etat.modeFacile) { return probabilite(d.especeId, d.longueurCm) > 0; }
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

    // Ce poisson ne PEUT PAS prendre l'esche (espèce non visée par une esche exclusive, trop petit pour
    // elle) : il l'ignore, il ne vient même pas tourner autour (sinon le bouchon « mordille » pour rien).
    // En facile, une esche sous le seuil (SEUIL_FACILE) est aussi ignorée.
    function escheSansEspoir(d) {
        if (!etat.eschesActives) { return false; }
        return probabilite(d.especeId, d.longueurCm) <= 0;
    }

    // Filet de sécurité : un poisson qui tourne autour de l'hameçon depuis PATIENCE_POISSON secondes
    // sans l'atteindre (relief, couche d'eau…) s'en lasse pour ce lancer, comme s'il avait refusé.
    // Sans cela, son intérêt bloque l'attente (waitTimer) : le bouchon mordille sans fin, sans touche.
    function patienceEsche(d, dt) {
        if (etat.modeFacile || !etat.eschesActives) { return; }
        if (d.patienceLancer !== etat.numeroLancer) { d.patienceLancer = etat.numeroLancer; d.patience = 0; }
        d.patience += dt;
        if (d.patience > PATIENCE_POISSON && d.escheLancer !== etat.numeroLancer) {
            d.escheLancer = etat.numeroLancer;
            d.escheAccepte = false;
            d.targeting = false;
        }
    }

    // Ferrage RATÉ (le poisson a recraché) : il peut emporter l'esche. Renvoie vrai si elle est perdue.
    //  - normal : hameçon nu tout de suite, message et étiquette mis à jour ;
    //  - dur    : rien n'est dit (seul « Raté » s'affiche) ; découverte au retour de la ligne.
    function volerEsche() {
        if (!etat.eschesActives) { return false; }
        const esche = escheAuBout();
        const mode = etat.modeFacile ? 'facile' : (etat.modeDifficulte || 'normal');
        if (!esche || hasardPerte() >= probaPerteEsche(esche.id, mode)) { return false; }
        if (mode === 'dur') {
            etat.escheVolee = true;
            return true;
        }
        retirerEsche();
        etat.spawnFloatingText('Le poisson a volé ' + NOM_VOLE[esche.id] + ' ! 🪝', etat.floatGroup.position, '#ffd166');
        statusDisplay.textContent = 'Le poisson a volé ' + NOM_VOLE[esche.id] + ' ! Remets une esche (menu Esches).';
        return true;
    }

    // L'hameçon devient nu (sans le mémoriser comme un CHOIX : au prochain chargement, l'esche de départ revient).
    function retirerEsche() {
        etat.escheVolee = false;
        etat.journal.esche = null;
        if (saveJournal) { saveJournal(); }
        majEtiquette();
    }

    // Mode Dur : la ligne revient au bord, le joueur voit enfin son hameçon nu.
    function revelerEscheVolee() {
        if (!etat.escheVolee) { return false; }
        retirerEsche();
        etat.spawnFloatingText('Ton hameçon est nu ! 🪝', etat.floatGroup.position, '#ffd166');
        statusDisplay.textContent = 'Ton hameçon est nu ! Remets une esche avant de relancer.';
        return true;
    }

    // Étiquette du widget de profondeur : l'esche équipée (illimitée : pas de compteur).
    function majEtiquette() {
        if (!etiquette) { return; }
        const esche = etat.escheEquipee ? etat.escheEquipee() : null;
        etiquette.textContent = esche ? esche.icone + ' Esche : ' + esche.nom : '🪝 Hameçon nu';
    }
    etat.accepterTouche = accepterTouche;
    etat.contexteHamecon = contexte;   // fond sous le bouchon (conseilLocal.js)
    etat.refuseLEsche = refuseLEsche;
    etat.escheSansEspoir = escheSansEspoir;
    etat.patienceEsche = patienceEsche;
    etat.majEsche = majEtiquette;
    etat.volerEsche = volerEsche;
    etat.revelerEscheVolee = revelerEscheVolee;

    return { accepterTouche, refuseLEsche, escheSansEspoir, patienceEsche, probabilite, contexte, majEtiquette, volerEsche, revelerEscheVolee };
}

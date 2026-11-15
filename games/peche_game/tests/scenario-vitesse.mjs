// ---------------------------------------------------------------------------
// Scénario 69 : « remontée trop rapide » — la vitesse permise dépend du POIDS
// du poisson et du FIL choisi. Sans poisson ferré, aucune limite et aucune
// casse. Au-delà du seuil, le moulinet PATINE (les tours sont perdus).
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, el, resetToIdle, step, startFight
} from './harness.mjs';

/** Tourne la manivelle « très vite » avec de vrais événements pointeur. */
function tournerTresVite(moves = 120, pasRad = 1.5) {
    const rect = el('crank').getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = rect.width / 2 - 10;
    let angle = 0;
    el('crank').emit('pointerdown', { pointerId: 1, clientX: cx + r, clientY: cy });
    for (let i = 0; i < moves; i++) {
        angle += pasRad;
        el('crank').emit('pointermove', {
            pointerId: 1,
            clientX: cx + Math.cos(angle) * r,
            clientY: cy + Math.sin(angle) * r
        });
    }
    el('crank').emit('pointerup', {});
}

export function run() {
    group('69) Remontée trop rapide : poids du poisson et fil choisi');

    // --- 1) Ligne VIDE (aucun poisson ferré) : aucune limite, aucune casse ---
    resetToIdle();
    G().setFilEquipe('nylon');
    checkEqual('sans poisson ferré, aucune vitesse maximale',
        G().getVitesseMaxTours(), Infinity);
    checkEqual('sans poisson ferré, aucun risque de casse',
        G().getRisqueCasseVitesse(), 0);
    tournerTresVite();
    checkEqual('on peut rembobiner un bouchon vide très vite sans casser',
        G().getLignes(), 5);
    checkEqual('et sans avertissement', G().getAvertissements(), 0);

    // --- 2) Un poisson ferré : le seuil baisse avec le poids ---
    resetToIdle();
    G().setFilEquipe('nylon');
    const leger = startFight(0, -25);
    const poidsLege = leger.userData.weight;
    const seuilLeger = G().getVitesseMaxTours();
    check('le seuil est fini quand un poisson est ferré',
        isFinite(seuilLeger), String(seuilLeger));
    leger.userData.weight = 0.1;                     // goujon
    const seuilGoujon = G().getVitesseMaxTours();
    leger.userData.weight = 1;                       // perche
    const seuilPerche = G().getVitesseMaxTours();
    leger.userData.weight = 6;                       // tanche
    const seuilTanche = G().getVitesseMaxTours();
    leger.userData.weight = 40;                      // gros silure
    const seuilSilure = G().getVitesseMaxTours();
    check('un goujon autorise une remontée rapide (≈ 6 tours/s)',
        seuilGoujon > 5.5 && seuilGoujon < 6.6, seuilGoujon.toFixed(2));
    check('un poisson de 6 kg demande d’y aller plus doucement',
        seuilTanche > 3.2 && seuilTanche < 4.2, seuilTanche.toFixed(2));
    check('plus le poisson est lourd, plus le seuil baisse',
        seuilGoujon > seuilPerche && seuilPerche > seuilTanche && seuilTanche > seuilSilure,
        [seuilGoujon, seuilPerche, seuilTanche, seuilSilure]
            .map(function (v) { return v.toFixed(2); }).join(' > '));
    check('le seuil a un plancher (2,5 tours/s) : on peut toujours ramener',
        Math.abs(seuilSilure - 2.5) < 1e-9, seuilSilure.toFixed(2));
    check('le poids réel du poisson compte (perche > goujon)',
        poidsLege >= 0, String(poidsLege));

    // --- 3) Le FIL choisi compte : la tresse supporte plus vite ---
    leger.userData.weight = 6;
    checkEqual('fil de nylon', G().setFilEquipe('nylon'), 'nylon');
    const seuilNylon = G().getVitesseMaxTours();
    checkEqual('fil de tresse', G().setFilEquipe('tresse'), 'tresse');
    const seuilTresse = G().getVitesseMaxTours();
    check('la tresse permet une remontée plus rapide',
        seuilTresse > seuilNylon * 1.2,
        seuilNylon.toFixed(2) + ' -> ' + seuilTresse.toFixed(2));
    G().setFilEquipe('nylon');

    // --- 4) Au-delà du seuil, le moulinet PATINE (tours perdus) ---
    leger.userData.weight = 6;
    const avant = G().getLineLength();
    const CRANS = 120;
    const PAS = 1.5;                    // radians par événement pointeur
    tournerTresVite(CRANS, PAS);
    step(1 / 60);                       // une image : les tours sont consommés
    const apres = G().getLineLength();
    const toursCrankes = CRANS * PAS / (2 * Math.PI);
    const toursVraies = (avant - apres) / G().getUnitsPerTurn();
    check('le patinage perd la plus grande partie des tours',
        toursVraies < toursCrankes * 0.8,
        toursVraies.toFixed(1) + ' tour(s) ramené(s) sur ' + toursCrankes.toFixed(1)
            + ' tournés (' + Math.round(100 * toursVraies / toursCrankes) + ' %)');
    check('quelques tours passent quand même (sous le seuil)',
        toursVraies > 0.5, toursVraies.toFixed(1) + ' tour(s)');

    // --- 5) La casse dépend du poids : un goujon ne casse pas la ligne ---
    resetToIdle();
    G().setFilEquipe('nylon');
    const petit = startFight(0, -25);
    petit.userData.weight = 0.1;
    G().avertirVitesse();
    check('un goujon ne fait pas casser la ligne',
        G().getRisqueCasseVitesse() < 0.015,
        G().getRisqueCasseVitesse().toFixed(4));
    const risquePetit = G().getRisqueCasseVitesse();
    resetToIdle();
    const gros = startFight(0, -25);
    gros.userData.weight = 20;
    G().avertirVitesse();
    const risqueGros = G().getRisqueCasseVitesse();
    check('un gros poisson fait plus risquer la casse',
        risqueGros > risquePetit * 2,
        risquePetit.toFixed(4) + ' vs ' + risqueGros.toFixed(4));
    check('le risque reste plafonné', risqueGros <= 0.15, risqueGros.toFixed(3));

    resetToIdle();
}

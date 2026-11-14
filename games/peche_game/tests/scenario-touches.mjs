// ---------------------------------------------------------------------------
// Scénario 8 : le catalogue des touches (les mouvements du bouchon).
// Vérifie la variété, la lisibilité et surtout l'absence d'à-coups.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, el, step, resetToIdle, clearLilyPads, castTo, forceBite
} from './harness.mjs';

export function run() {
    group('39) Catalogue des touches (mouvements du bouchon)');

    const touches = G().getTouches();
    check('au moins 15 types de touches', touches.length >= 15, touches.length + ' types');
    check('identifiants uniques', new Set(touches.map(t => t.id)).size === touches.length);
    check('chaque touche est décrite (nom + explication)',
        touches.every(t => t.nom && t.desc && t.desc.length > 20));
    const fausses = touches.filter(t => t.vrai === false);
    const vraies = touches.filter(t => t.vrai === true);
    check('beaucoup de fausses touches à reconnaître', fausses.length >= 8, fausses.length + ' fausses');
    check('assez de vraies touches différentes', vraies.length >= 6, vraies.length + ' vraies');
    check('toutes les touches ont une famille connue',
        touches.every(t => ['enfoncement', 'remontee', 'couchage', 'derive', 'fausse'].indexOf(t.famille) >= 0));
    const formes = new Set(touches.map(t => t.forme));
    check('les dessins sont variés', formes.size >= 8, formes.size + ' formes différentes');

    // --- Le dessin de chaque touche : borné, LISSE, et cohérent ---
    let plusGrandSaut = 0;
    let pireNom = '';
    let plusGrandeAccel = 0;
    let pireAccel = '';
    const invisibles = [];
    const faussesQuiNeReviennentPas = [];
    const vraiesQuiNeTiennentPas = [];
    touches.forEach(t => {
        const pas = (1 / 60) / t.duree;              // une image à 60 images/s
        let yPrec = G().mouvementDeTouche(t, 0, false).y || 0;
        let yAvant = yPrec;
        let premiere = true;
        let imagesAccel = 0;
        let maxY = 0;
        let maxRot = 0;
        let maxLat = 0;
        for (let p = 0; p <= 1.0001; p += pas) {
            const m = G().mouvementDeTouche(t, Math.min(1, p), false);
            const y = m.y || 0;
            const saut = Math.abs(y - yPrec);
            if (saut > plusGrandSaut) {
                plusGrandSaut = saut;
                pireNom = t.nom;
            }
            if (!premiere && imagesAccel > 2) {
                // À-coup = saut d'accélération d'une image à l'autre. On ignore les
                // toutes premières images : un poisson qui prend l'esche, c'est un
                // à-coup par nature (le bouchon démarre d'un coup).
                const accel = Math.abs((y - yPrec) - (yPrec - yAvant));
                if (accel > plusGrandeAccel) {
                    plusGrandeAccel = accel;
                    pireAccel = t.nom;
                }
            }
            premiere = false;
            imagesAccel += 1;
            yAvant = yPrec;
            yPrec = y;
            maxY = Math.max(maxY, Math.abs(y));
            maxRot = Math.max(maxRot, Math.abs(m.rot || 0));
            maxLat = Math.max(maxLat, Math.hypot(m.dx || 0, m.dz || 0));
        }
        if (maxY < 0.3 && maxRot < 0.5 && maxLat < 0.4) {
            invisibles.push(t.nom);
        }
        const fin = G().mouvementDeTouche(t, 1, false);
        if (!t.vrai && (Math.abs(fin.y || 0) > 0.12 || Math.abs(fin.rot || 0) > 0.12)) {
            faussesQuiNeReviennentPas.push(t.nom);   // une fausse touche doit « revenir »
        }
        if (t.vrai && Math.abs(fin.y || 0) < 0.3 && Math.abs(fin.rot || 0) < 1) {
            vraiesQuiNeTiennentPas.push(t.nom);      // une vraie touche reste enfoncée/sortie
        }
    });
    check('le bouchon ne se téléporte jamais (vitesse bornée)', plusGrandSaut < 0.35,
        'plus grand saut ' + plusGrandSaut.toFixed(3) + ' u/image (' + pireNom + ')');
    // Les petits coups (tapotement, danse) ont des rebonds VOLONTAIRES : le
    // bouchon saute sur la surface comme un vrai. On vérifie seulement qu'aucun
    // mouvement ne fait un bond démesuré (ce qui trahirait un défaut).
    check('aucun à-coup démesuré (accélération bornée)', plusGrandeAccel < 0.25,
        'plus grande accélération ' + plusGrandeAccel.toFixed(3) + ' u/image² (' + pireAccel + ')');
    check('chaque touche est visible de loin (mouvement assez grand)',
        invisibles.length === 0, invisibles.join(', ') || 'aucune');
    check('chaque fausse touche ramène le bouchon à sa place',
        faussesQuiNeReviennentPas.length === 0, faussesQuiNeReviennentPas.join(', '));
    check('chaque vraie touche reste enfoncée (ou sortie, ou couchée)',
        vraiesQuiNeTiennentPas.length === 0, vraiesQuiNeTiennentPas.join(', '));
    check('le bouchon commence toujours à sa place',
        touches.every(t => Math.abs(G().mouvementDeTouche(t, 0, false).y || 0) < 1e-9));

    // --- Les bouchons courts se couchent au lieu de « sortir leur tige » ---
    const montee = touches.filter(t => t.forme === 'montee')[0];
    const court = G().mouvementDeTouche(montee, 1, true);
    check('un bouchon court se couche sur une remontée', court.rot > 1,
        'inclinaison ' + court.rot.toFixed(2) + ' rad');
    const long = G().mouvementDeTouche(montee, 1, false);
    check('une longue tige ressort vraiment', long.y > 1, long.y.toFixed(2) + ' unité');

    // --- Le choix de la touche dépend du poisson ---
    const touchePetit = G().choisirTouche(false, 0.3, 1.0);
    check('un petit poisson a ses fausses touches à lui',
        touchePetit.vrai === false && (touchePetit.qui === 'petit' || touchePetit.qui === 'tous'),
        touchePetit.nom);
    const toucheGros = G().choisirTouche(true, 1.0, 0.8);
    check('un gros poisson a ses vraies touches à lui',
        toucheGros.vrai === true && toucheGros.qui !== 'petit', toucheGros.nom);

    // --- En jeu : les touches varient d'une fois à l'autre ---
    const vuesFausses = {};
    const vuesVraies = {};
    for (let i = 0; i < 6; i++) {
        resetToIdle();
        clearLilyPads();
        castTo(0, -25);
        forceBite();
        vuesVraies[G().getBiteTouchId()] = true;
        let garde = 0;
        while (G().getBitePhase() !== 'fausse' && garde++ < 60 * 25) {
            step(1 / 60);
        }
        const idFausse = G().getFauxToucheId();
        check('la fausse touche vient bien du catalogue',
            touches.some(t => !t.vrai && t.id === idFausse), idFausse);
        vuesFausses[idFausse] = true;
    }
    check('plusieurs fausses touches différentes en 6 essais',
        Object.keys(vuesFausses).length >= 3, Object.keys(vuesFausses).join(', '));
    check('plusieurs vraies touches différentes en 6 essais',
        Object.keys(vuesVraies).length >= 2, Object.keys(vuesVraies).join(', '));
    resetToIdle();

    // --- La fiche du carnet liste tout ---
    const fiche = el('ficheTouches').innerHTML;
    check('la fiche des touches est remplie', fiche.length > 500, fiche.length + ' caractères');
    check('la fiche sépare fausses et vraies touches',
        fiche.indexOf('Fausses touches') >= 0 && fiche.indexOf('VRAIES touches') >= 0);
    check('la fiche liste toutes les touches',
        touches.every(t => fiche.indexOf(t.nom) >= 0),
        touches.filter(t => fiche.indexOf(t.nom) < 0).map(t => t.nom).join(', ') || 'toutes');
}

export default run;

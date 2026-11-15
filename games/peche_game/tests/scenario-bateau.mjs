// ---------------------------------------------------------------------------
// Scénario : le MODE BATEAU (barque achetée en boutique avec l'XP).
// Embarquer déplace le POSTE au milieu de l'eau ; on pêche de bout en bout
// depuis la barque ; on ne rame pas ligne dehors ; débarquer rend la rive.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, resetToIdle, castTo, forceBite, strike, step, crankTurns, state
} from './harness.mjs';

function distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

export function run() {
    group('57) Mode bateau : la barque du milieu de l’étang');
    G().recommencerPartie();
    resetToIdle();
    G().setExperience(0);

    const centre = G().getPondCenter();
    // Écart à la berge LOCALE : positif sur la rive, négatif dans l'eau.
    const ecartAuBord = function (p) {
        const dx = p.x - centre.x;
        const dz = p.z - centre.z;
        return Math.hypot(dx, dz) - G().getRayonEtang(Math.atan2(dz, dx));
    };

    // --- Sans barque : rien n'est possible ---
    checkEqual('sans barque, le bouton est caché', el('boatButton').hidden, true);
    checkEqual('sans barque, embarquer est refusé', G().embarquerBateau(), false);

    // --- Achat : il faut l'XP, et une seule fois ---
    const prix = G().getBateauPrix();
    check('la barque a un prix positif', prix > 0, prix + ' XP');
    checkEqual('sans expérience, l’achat échoue', G().acheterBateau(), false);
    G().setExperience(prix - 1);
    checkEqual('expérience juste insuffisante : refusé', G().acheterBateau(), false);
    G().setExperience(prix);
    checkEqual('avec l’expérience, l’achat réussit', G().acheterBateau(), true);
    checkEqual('l’expérience est débitée du prix', G().getExperience(), 0);
    checkEqual('impossible d’acheter deux fois la barque', G().acheterBateau(), false);
    checkEqual('la barque achetée montre le bouton', el('boatButton').hidden, false);

    // --- Embarquer : le poste va au milieu de l'eau ---
    const riveAvant = G().getEmplacement();
    checkEqual('embarquer réussit', G().embarquerBateau(), true);
    checkEqual('on est en mode bateau', G().isBateau(), true);
    const pecheur = G().angler.position;
    const barque = G().getBateau();
    check('à bord, le pêcheur est DANS l’eau', ecartAuBord(pecheur) < 0,
        ecartAuBord(pecheur).toFixed(1) + ' unités du bord');
    check('la barque est visible', barque.visible, true);
    check('la barque porte le pêcheur (recul de la poupe inclus)',
        distance2D(barque, pecheur) < 1.2,
        distance2D(barque, pecheur).toFixed(2) + ' unités');
    check('on reste à bonne distance du centre (visée possible)',
        distance2D(pecheur, centre) >= 9.9,
        distance2D(pecheur, centre).toFixed(1) + ' unités du centre');
    check('la caméra reste derrière le pêcheur',
        distance2D(G().camera.position, pecheur) > 8
            && distance2D(G().camera.position, pecheur) < 30,
        distance2D(G().camera.position, pecheur).toFixed(1) + ' unités');
    check('la boussole annonce le mode bateau',
        el('compass').textContent.indexOf('bateau') >= 0, el('compass').textContent);

    // --- Ligne dehors : ni ramer, ni débarquer ---
    const ux = centre.x - pecheur.x;
    const uz = centre.z - pecheur.z;
    const norme = Math.hypot(ux, uz);
    checkEqual('le lancer depuis la barque part', castTo(
        pecheur.x + (ux / norme) * 12, pecheur.z + (uz / norme) * 12), 'inWater');
    checkEqual('ligne dehors : impossible de ramer', G().deplacerBateau(0, 1), false);
    checkEqual('ligne dehors : impossible de débarquer', G().quitterBateau(), false);
    resetToIdle();

    // --- Ramer : avancer (vers le centre) rapproche, les bornes tiennent ---
    // Marge = distance - rayon local : avancer = marge PLUS négative.
    const distanceAvant = distance2D(pecheur, centre);
    checkEqual('avancer vers le centre fonctionne', G().deplacerBateau(0, -5), true);
    check('avancer rapproche du centre',
        distance2D(G().angler.position, centre) < distanceAvant,
        distance2D(G().angler.position, centre).toFixed(1) + ' < '
            + distanceAvant.toFixed(1));
    checkEqual('reculer vers la berge fonctionne', G().deplacerBateau(0, 500), true);
    const presDuBord = ecartAuBord(G().angler.position);
    check('on ne sort jamais de l’eau (4 unités du bord au plus près)',
        presDuBord <= -3.9 && presDuBord >= -4.6, presDuBord.toFixed(2) + ' du bord');
    checkEqual('forcer vers le centre fonctionne', G().deplacerBateau(0, -500), true);
    const auCentre = distance2D(G().angler.position, centre);
    check('jamais à moins de 10 unités du centre', auCentre >= 9.9,
        auCentre.toFixed(2) + ' unités');
    checkEqual('tourner (gauche) fonctionne', G().deplacerBateau(0.3, 0), true);

    // --- PÊCHE COMPLÈTE à bord : lancer -> touche -> ferrage -> bourriche ---
    resetToIdle();
    const depuis = G().angler.position;
    const vx = centre.x - depuis.x;
    const vz = centre.z - depuis.z;
    const longueur = Math.hypot(vx, vz) || 1;
    checkEqual('le lancer en pleine eau part', castTo(
        depuis.x + (vx / longueur) * 12, depuis.z + (vz / longueur) * 12), 'inWater');
    forceBite();
    checkEqual('un poisson mord à bord', state(), 'bite');
    strike();
    check('le ferrage accroche bien le poisson',
        state() === 'struggle' || state() === 'reeling', state());
    let garde = 0;
    while ((state() === 'struggle' || state() === 'reeling') && garde++ < 20000) {
        crankTurns(2);
        step(1 / 60);
    }
    checkEqual('à bord aussi, le poisson arrive', state(), 'holding');
    G().storeHeldFish();
    checkEqual('le poisson est rangé dans la bourriche', state(), 'idle');

    // --- Débarquer : retour EXACT au poste de la rive ---
    checkEqual('débarquer réussit', G().quitterBateau(), true);
    checkEqual('on n’est plus en mode bateau', G().isBateau(), false);
    check('la barque est rangée', G().getBateau().visible === false);
    check('le pêcheur est revenu SUR LA RIVE',
        ecartAuBord(G().angler.position) > 0,
        ecartAuBord(G().angler.position).toFixed(2) + ' unités du bord');
    checkClose('l’emplacement de rive est restauré',
        G().getEmplacement().marge, riveAvant.marge, 0.02);
    check('la boussole redit le poste de rive',
        el('compass').textContent.indexOf('poste') >= 0, el('compass').textContent);

    // --- Un raccourci de poste débarque la barque ---
    checkEqual('on peut ré-embarquer', G().embarquerBateau(), true);
    checkEqual('placer au poste réussit (ligne au repos)',
        G().placerAuPoste(1), true);
    checkEqual('le raccourci de poste débarque la barque', G().isBateau(), false);
    check('la barque est rangée après débarquement par poste',
        G().getBateau().visible === false);

    // --- État propre pour la suite ---
    G().placerAuPoste(0);
    resetToIdle();
    G().demarrerJeu();
}

export default run;

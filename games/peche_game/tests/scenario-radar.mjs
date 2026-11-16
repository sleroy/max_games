// ---------------------------------------------------------------------------
// Scénario : cheat « radar » (idées.md §17.3) — carte 2D superposée des poissons.
//
//  - présence : le mot secret affiche / masque le panneau, Échap le ferme ;
//  - un point par poisson, couleur stable par espèce, rayon ∝ longueur ;
//  - le pêcheur est à la bonne échelle ; bouchon et barque ;
//  - fermé, le radar ne touche JAMAIS au DOM.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { SPECIES } from '../especes.js';
import { group, check, checkEqual, checkClose, G, el, GAME_DIR, resetToIdle, stepFor, castTo } from './harness.mjs';

function taper(mot) {
    mot.split('').forEach(function (lettre) {
        globalThis.fireWindowEvent('keydown', { key: lettre });
    });
}

export function run() {
    group('73) Cheat « radar » : présence du panneau, ouverture et fermeture');
    resetToIdle();
    const radar = G().radar;
    const panneau = el('radarPanel');

    // --- Le conteneur existe dans index.html ---------------------------------
    const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    check('index.html contient le panneau du radar (masqué au départ)',
        /<div class="radar-panel" id="radarPanel" hidden>/.test(html));
    check('le panneau contient un SVG avec un calque de fond et un calque vivant',
        html.includes('id="radarFond"') && html.includes('id="radarVivant"'));

    // --- Fermé au départ -----------------------------------------------------
    checkEqual('le radar est fermé au départ', radar.estActif(), false);

    // --- Mot incomplet : rien ------------------------------------------------
    taper('rada');
    checkEqual('un mot incomplet n’ouvre pas le radar', radar.estActif(), false);

    // --- « radar » l'ouvre, et affiche le panneau ----------------------------
    globalThis.fireWindowEvent('keydown', { key: 'r' });
    checkEqual('« radar » ouvre le radar', radar.estActif(), true);
    checkEqual('le panneau est affiché (hidden = false)', panneau.hidden, false);

    // --- Re-taper « radar » le ferme -----------------------------------------
    taper('radar');
    checkEqual('re-taper « radar » ferme le radar', radar.estActif(), false);
    checkEqual('le panneau est masqué (hidden = true)', panneau.hidden, true);

    // --- Échap le ferme aussi ------------------------------------------------
    taper('radar');
    checkEqual('« radar » rouvre le radar', radar.estActif(), true);
    globalThis.fireWindowEvent('keydown', { key: 'Escape' });
    checkEqual('Échap ferme le radar', radar.estActif(), false);
    checkEqual('Échap masque le panneau', panneau.hidden, true);
    globalThis.fireWindowEvent('keydown', { key: 'Escape' });
    checkEqual('Échap sans radar ne le rouvre pas', radar.estActif(), false);

    // --- Les autres cheats ne sont pas perturbés -----------------------------
    G().setExperience(0);
    taper('poisson');
    checkEqual('« poisson » marche toujours (+50 XP)', G().getExperience(), 50);
    checkEqual('« poisson » n’ouvre pas le radar', radar.estActif(), false);
    G().setExperience(0);
    stepFor(0.2);

    detailsDuRadar(radar);
}

// Nombre d'occurrences d'une classe dans le SVG vivant (le radar écrit des chaînes SVG).
function compter(classe) {
    const html = String(el('radarVivant').innerHTML || '');
    return html.split('class="' + classe + '"').length - 1;
}

function detailsDuRadar(radar) {
    group('74) Cheat « radar » : points, couleurs, tailles, pêcheur, bouchon, barque, cadence');
    const poissons = G().fishes;
    const centre = G().getPondCenter();
    const echelle = 58 / (G().getRayonEtangMax() + 8);   // = carte du carnet (RAYON_CADRE_CARTE)

    taper('radar');
    checkEqual('le radar est ouvert', radar.estActif(), true);

    // --- Un point par poisson ------------------------------------------------
    check('le monde contient des poissons (≈ 58)', poissons.length >= 30, poissons.length + ' poissons');
    checkEqual('un point par poisson (modèle)', radar.points().length, poissons.length);
    checkEqual('un point par poisson (SVG)', compter('radar-poisson'), poissons.length);
    checkEqual('un trait de cap par poisson (SVG)', compter('radar-cap'), poissons.length);
    checkEqual('un cercle de zone de vie par poisson (SVG)', compter('radar-zone'), poissons.length);
    check('le fond de carte est dessiné (contour + 5 zones de substrat)',
        String(el('radarFond').innerHTML).includes('radar-fond-herbier')
            && String(el('radarFond').innerHTML).includes('radar-clip-fonds'));
    check('le fond n\'utilise pas l\'id du clip du carnet (pas de collision SVG)',
        !/id="clip-fonds"/.test(String(el('radarFond').innerHTML)));

    // --- Couleur : stable par espèce, différente entre espèces ---------------
    const parEspece = new Map();
    radar.points().forEach(function (p) {
        if (!parEspece.has(p.especeId)) { parEspece.set(p.especeId, new Set()); }
        parEspece.get(p.especeId).add(p.couleur);
    });
    check('plusieurs espèces sont présentes', parEspece.size >= 6, parEspece.size + ' espèces');
    check('chaque espèce a UNE seule couleur',
        Array.from(parEspece.values()).every(function (couleurs) { return couleurs.size === 1; }));
    const couleurs = Array.from(parEspece.values()).map(function (c) { return Array.from(c)[0]; });
    checkEqual('deux espèces n\'ont jamais la même couleur', new Set(couleurs).size, couleurs.length);
    const especes = SPECIES.map(function (e) { return e.id; });
    const palette = especes.map(radar.couleurDe);
    checkEqual('16 espèces = 16 couleurs distinctes', new Set(palette).size, 16);
    checkEqual('une espèce inconnue reste grise', radar.couleurDe('licorne'), '#cccccc');
    const pairesMemeEspece = poissons.filter(function (f) {
        return poissons.filter(function (g) { return g.userData.especeId === f.userData.especeId; }).length >= 2;
    });
    const a = pairesMemeEspece[0];
    const b = pairesMemeEspece.find(function (f) { return f !== a && f.userData.especeId === a.userData.especeId; });
    const c = poissons.find(function (f) { return f.userData.especeId !== a.userData.especeId; });
    const pointDe = function (poisson) { return radar.points()[poissons.indexOf(poisson)]; };
    checkEqual('deux poissons de la même espèce : même couleur', pointDe(a).couleur, pointDe(b).couleur);
    check('deux poissons d\'espèces différentes : couleurs différentes', pointDe(a).couleur !== pointDe(c).couleur);
    check('le SVG porte la couleur de l\'espèce',
        String(el('radarVivant').innerHTML).includes('fill="' + pointDe(a).couleur + '"'));

    // --- Rayon : proportionnel à la longueur (borné) -------------------------
    a.userData.longueurCm = 20;
    b.userData.longueurCm = 80;
    stepFor(0.15);
    check('un poisson plus long a un point plus grand', pointDe(b).rayon > pointDe(a).rayon,
        pointDe(a).rayon.toFixed(2) + ' < ' + pointDe(b).rayon.toFixed(2));
    check('le rayon reste borné (visible, pas écrasant)',
        radar.points().every(function (p) { return p.rayon >= 1.4 && p.rayon <= 6.5; }));
    check('rayonDe est croissant puis plafonné',
        radar.rayonDe(10) < radar.rayonDe(50) && radar.rayonDe(50) < radar.rayonDe(100)
            && radar.rayonDe(300) === radar.rayonDe(500));

    // --- Cap : dans le sens de la nage ---------------------------------------
    a.userData.vx = 2;
    a.userData.vz = 0;
    stepFor(0.01);
    a.userData.vx = 2;
    a.userData.vz = 0;
    radar.basculer();
    radar.basculer();   // réouverture = rafraîchissement immédiat
    check('le trait de cap part vers l\'est quand le poisson nage vers l\'est',
        pointDe(a).queueX > pointDe(a).x + 1 && Math.abs(pointDe(a).queueY - pointDe(a).y) < 0.01);
    a.userData.vx = 0;
    a.userData.vz = -2;
    radar.basculer();
    radar.basculer();
    check('le trait de cap part vers le nord (haut de la carte) quand z décroît',
        pointDe(a).queueY < pointDe(a).y - 1 && Math.abs(pointDe(a).queueX - pointDe(a).x) < 0.01);

    // --- Position : mise à l'échelle sur la carte (centre = milieu du cadre) -
    const f0 = poissons[0];
    checkClose('x du poisson : même échelle que la carte du carnet',
        radar.points()[0].x, 100 + (f0.position.x - centre.x) * echelle, 0.001);
    checkClose('y du poisson : le nord (z négatif) est en haut',
        radar.points()[0].y, 60 + (f0.position.z - centre.z) * echelle, 0.001);

    // --- Pêcheur : position, échelle, orientation ----------------------------
    const angler = G().angler;
    const j = radar.pecheur();
    checkClose('x du pêcheur cohérent avec angler.position', j.x, 100 + (angler.position.x - centre.x) * echelle, 0.001);
    checkClose('y du pêcheur cohérent avec angler.position', j.y, 60 + (angler.position.z - centre.z) * echelle, 0.001);
    check('le pêcheur est dans le cadre de la carte', j.x >= 0 && j.x <= 200 && j.y >= 0 && j.y <= 120,
        j.x.toFixed(1) + ', ' + j.y.toFixed(1));
    checkEqual('le pêcheur est dessiné (triangle)', compter('radar-pecheur'), 1);
    const xAvant = j.x;
    angler.position.x += 5;
    stepFor(0.15);
    checkClose('déplacer le pêcheur de 5 unités décale le point de 5 × échelle',
        radar.pecheur().x - xAvant, 5 * echelle, 0.001);
    angler.position.x -= 5;
    // Orientation : (sin ry, cos ry) — le pêcheur à la rive regarde l'étang.
    const anglerYaw = angler.rotation.y;
    // (le jeu réécrit rotation.y à chaque image : on rafraîchit sans avancer le jeu)
    const rafraichir = function () { radar.basculer(); radar.basculer(); };
    angler.rotation.y = Math.PI / 2;   // vers +x : l'est de la carte
    rafraichir();
    checkClose('rotation.y = π/2 : le triangle regarde vers l\'est (cap 0)', radar.pecheur().cap, 0, 1e-9);
    angler.rotation.y = Math.PI;       // vers −z : le nord
    rafraichir();
    checkClose('rotation.y = π : le triangle regarde vers le nord (cap −π/2)', radar.pecheur().cap, -Math.PI / 2, 1e-9);
    angler.rotation.y = anglerYaw;
    stepFor(0.15);
    const versEtang = Math.atan2(centre.z - angler.position.z, centre.x - angler.position.x);
    let ecartCap = Math.abs(radar.pecheur().cap - versEtang);
    ecartCap = Math.min(ecartCap, 2 * Math.PI - ecartCap);
    check('à son poste, le pêcheur regarde vers l\'étang', ecartCap < 0.6, ecartCap.toFixed(2) + ' rad');

    // --- Bouchon : seulement quand la ligne est à l'eau ----------------------
    resetToIdle();
    stepFor(0.15);
    checkEqual('ligne au repos : pas de bouchon sur la carte', radar.pecheur().bouchon, null);
    checkEqual('ligne au repos : aucun bouchon dessiné', compter('radar-bouchon'), 0);
    castTo(0, -30);
    stepFor(0.15);
    const flotteur = G().floatGroup.position;
    check('ligne à l\'eau : le bouchon est sur la carte', !!radar.pecheur().bouchon);
    checkEqual('ligne à l\'eau : le bouchon est dessiné', compter('radar-bouchon'), 1);
    checkClose('x du bouchon cohérent avec floatGroup.position',
        radar.pecheur().bouchon.x, 100 + (flotteur.x - centre.x) * echelle, 0.001);
    checkClose('y du bouchon cohérent avec floatGroup.position',
        radar.pecheur().bouchon.y, 60 + (flotteur.z - centre.z) * echelle, 0.001);
    resetToIdle();

    // --- Barque : pastille distincte à bord seulement ------------------------
    stepFor(0.15);
    checkEqual('sans barque : aucune pastille', compter('radar-barque'), 0);
    const avaitBarque = !!G().etat.journal.bateau;
    if (!avaitBarque) {
        G().setExperience(G().getBateauPrix());
        G().acheterBateau();
    }
    checkEqual('embarquer réussit', G().embarquerBateau(), true);
    stepFor(0.15);
    checkEqual('à bord : une pastille de barque', compter('radar-barque'), 1);
    check('à bord : la barque est au pêcheur (même endroit, à la rame près)',
        Math.hypot(radar.pecheur().bateauX - radar.pecheur().x, radar.pecheur().bateauY - radar.pecheur().y) < 2.5);
    G().quitterBateau();
    stepFor(0.15);
    checkEqual('débarqué : la pastille disparaît', compter('radar-barque'), 0);
    G().etat.journal.bateau = avaitBarque;
    G().setExperience(0);

    // --- Cadence : ~10 Hz ouvert, RIEN de fermé ------------------------------
    const avant = radar.misesAJour();
    stepFor(1);
    const sur1s = radar.misesAJour() - avant;
    check('ouvert, le radar se rafraîchit ≈ 10 fois par seconde (pas à chaque image)',
        sur1s >= 8 && sur1s <= 12, sur1s + ' mises à jour pour 60 images');

    taper('radar');
    checkEqual('le radar est refermé', radar.estActif(), false);
    const figeCompteur = radar.misesAJour();
    const figeSvg = String(el('radarVivant').innerHTML);
    stepFor(2);
    checkEqual('fermé : aucune mise à jour du DOM en 2 s de jeu', radar.misesAJour(), figeCompteur);
    checkEqual('fermé : le SVG n\'est pas réécrit', String(el('radarVivant').innerHTML), figeSvg);
    resetToIdle();
}

export default run;

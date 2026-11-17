// ---------------------------------------------------------------------------
// radar.js — RADAR À POISSONS : carte 2D superposée au jeu, avec TOUS les poissons
// qui nagent (idées.md §17.3). Deux façons de l'ouvrir :
//  - le mot secret « radar » (cheat.js), pour le débogage ;
//  - le bouton 🗺️ Radar du menu, une fois le radar ACHETÉ en boutique (RADAR_PRIX XP).
// Il sert aussi à vérifier la DENSITÉ : grille de chaleur (poissons par case) et
// ligne d'infos (nombre de poissons, poissons/ha, kg/ha).
//
// Contenu de la carte :
//  - fond : contour de l'étang + 5 zones de substrat (mêmes données que la carte du
//    carnet : `substrats.rectsCarte()` et `rayonEtang`), dans des éléments SÉPARÉS ;
//  - un point par poisson : couleur stable par espèce (palette de 16, dans l'ordre de
//    SPECIES), rayon croissant avec la longueur, trait de cap dans le sens de la nage,
//    cercle discret de la zone de vie (homeX / homeZ + domaine) ;
//  - le pêcheur (triangle orienté), le bouchon (point clair) et la barque (pastille).
//
// Le calcul des points (`points()`, `pecheur()`) est séparé du dessin : les tests lisent
// le modèle, le navigateur lit le SVG. Rafraîchi à ~10 Hz seulement, et JAMAIS quand le
// radar est fermé (aucune mise à jour du DOM).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=256';

// 16 couleurs bien distinctes (une par espèce, dans l'ordre de SPECIES).
const PALETTE = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6',
    '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3'
];
const COULEUR_INCONNUE = '#cccccc';

const LARGEUR = 200;          // viewBox du SVG : 200 × 120 (même cadre que la carte du carnet)
const HAUTEUR = 120;
const PERIODE = 0.1;          // s entre deux rafraîchissements (~10 Hz)
const RAYON_MIN = 1.4;        // rayon d'un point, en unités du viewBox
const RAYON_MAX = 5.5;
const RAYON_PAR_CM = 0.04;
const CASE = 10;              // côté d'une case de la grille de densité (unités du viewBox)
export const RADAR_PRIX = 250;   // prix en XP du radar à poissons (boutique)

export function creerRadar(deps) {
    const {
        fishes, angler, floatGroup, panneau, fondEl, vivantEl, substrats, POND_CENTER, rayonEtang,
        monde, SPECIES, COMPORTEMENTS, infoEl, bouton, saveJournal, renderJournal, fermerOutils, svgEl
    } = deps;

    // Échelle : le cadre (demi-hauteur 58) contient le plus grand rayon du contour + la couronne
    // de placement, comme la carte du carnet. Le nord est en haut (z croissant vers le bas).
    const cx = LARGEUR / 2;
    const cy = HAUTEUR / 2;
    // L'échelle suit la TAILLE de l'étang (`monde.rayonCadre`, lu à chaque rafraîchissement : le biotope peut la changer).
    let ech = 58 / monde.rayonCadre;
    function majEchelle() { ech = 58 / monde.rayonCadre; }
    const mx = function (x) { return cx + (x - POND_CENTER.x) * ech; };
    const mz = function (z) { return cy + (z - POND_CENTER.z) * ech; };

    let actif = false;
    let fondDessine = false;
    let cleFond = '';     // grille des fonds et échelle du dernier fond dessiné : un autre biotope ou une autre taille le redessine
    let attente = 0;
    let misesAJour = 0;
    let derniersPoints = [];
    let dernierPecheur = null;
    let derniersAmorces = [];

    // --- Modèle : couleur et rayon ---------------------------------------------------------
    // Couleur stable par espèce : rang de l'espèce dans SPECIES (jamais l'ordre des poissons).
    function couleurDe(especeId) {
        const rang = SPECIES.findIndex(function (s) { return s.id === especeId; });
        return rang < 0 ? COULEUR_INCONNUE : PALETTE[rang % PALETTE.length];
    }

    // Rayon croissant avec la longueur (cm), borné pour que ni le goujon ni le silure
    // ne disparaissent ou n'écrasent la carte.
    function rayonDe(longueurCm) {
        const cm = Number.isFinite(longueurCm) ? longueurCm : 0;
        return Math.min(RAYON_MAX, Math.max(RAYON_MIN, 1.1 + cm * RAYON_PAR_CM));
    }

    // Cap d'un poisson dans le plan de la carte : sa vitesse (vx, vz) ; à l'arrêt, son
    // orientation 3D (comportement.js : rotation.y = atan2(-vz, vx)).
    function capDe(poisson) {
        const d = poisson.userData;
        const vx = d.vx || 0;
        const vz = d.vz || 0;
        const vitesse = Math.hypot(vx, vz);
        if (vitesse > 0.02) { return { dx: vx / vitesse, dz: vz / vitesse, vitesse: vitesse }; }
        const yaw = poisson.rotation ? poisson.rotation.y : 0;
        return { dx: Math.cos(yaw), dz: -Math.sin(yaw), vitesse: 0 };
    }

    function pointDe(poisson) {
        const d = poisson.userData;
        const rayon = rayonDe(d.longueurCm);
        const cap = capDe(poisson);
        const x = mx(poisson.position.x);
        const y = mz(poisson.position.z);
        const queue = rayon + 1.5 + Math.min(5, cap.vitesse * 1.6);
        const comp = COMPORTEMENTS[d.especeId];
        const domaine = Number.isFinite(d.homeRadius) ? d.homeRadius : (comp ? comp.domaine : 0);
        return {
            especeId: d.especeId, couleur: couleurDe(d.especeId), longueurCm: d.longueurCm,
            x: x, y: y, rayon: rayon, cap: Math.atan2(cap.dz, cap.dx),
            queueX: x + cap.dx * queue, queueY: y + cap.dz * queue,
            maisonX: mx(Number.isFinite(d.homeX) ? d.homeX : poisson.position.x),
            maisonY: mz(Number.isFinite(d.homeZ) ? d.homeZ : poisson.position.z),
            maisonRayon: domaine * ech
        };
    }

    // Le pêcheur regarde dans la direction de sa canne : (sin ry, cos ry) dans le monde.
    function pecheurDe() {
        const yaw = angler.rotation.y;
        const dx = Math.sin(yaw);
        const dz = Math.cos(yaw);
        const aLEau = etat.floatState !== 'idle';
        const bateau = !!etat.modeBateau && !!etat.bateauGroupe;
        return {
            x: mx(angler.position.x), y: mz(angler.position.z), cap: Math.atan2(dz, dx),
            bateau: bateau,
            bateauX: bateau ? mx(etat.bateauGroupe.position.x) : null,
            bateauY: bateau ? mz(etat.bateauGroupe.position.z) : null,
            bouchon: aLEau ? { x: mx(floatGroup.position.x), y: mz(floatGroup.position.z) } : null
        };
    }

    // --- Densité : poissons par case de la carte, et totaux par hectare ----------------------
    let derniereDensite = null;
    let echellePoints = 1;   // taille AFFICHÉE des points (le modèle garde le rayon ∝ longueur)
    function densiteDe(points) {
        const colonnes = Math.ceil(LARGEUR / CASE);
        const lignes = Math.ceil(HAUTEUR / CASE);
        const grille = new Array(colonnes * lignes).fill(0);
        points.forEach(function (p) {
            const c = Math.floor(p.x / CASE);
            const l = Math.floor(p.y / CASE);
            if (c >= 0 && c < colonnes && l >= 0 && l < lignes) { grille[l * colonnes + c] += 1; }
        });
        const biomasse = fishes.reduce(function (total, f) { return total + (f.userData.weight || 0); }, 0);
        const surface = monde.surfaceHa > 0 ? monde.surfaceHa : 0;
        return {
            total: fishes.length,
            biomasseKg: biomasse,
            surfaceHa: surface,
            parHa: surface > 0 ? fishes.length / surface : 0,
            kgParHa: surface > 0 ? biomasse / surface : 0,
            colonnes: colonnes, lignes: lignes, grille: grille,
            max: grille.reduce(function (m, n) { return Math.max(m, n); }, 0)
        };
    }

    function arrondi(n) { return n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace('.', ','); }

    function texteInfo(d) {
        return '🐟 ' + d.total + (d.total > 1 ? ' poissons' : ' poisson')
            + ' · ' + arrondi(d.parHa) + ' /ha · ' + arrondi(d.kgParHa) + ' kg/ha'
            + ' · case la + pleine : ' + d.max;
    }

    // --- Dessin ----------------------------------------------------------------------------
    function contour() {
        let d = '';
        const n = 96;
        for (let i = 0; i <= n; i++) {
            const a = (i / n) * Math.PI * 2;
            const r = rayonEtang(a) * ech;
            d += (i === 0 ? 'M' : 'L') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1);
        }
        return d + 'Z';
    }

    // Rectangle englobant le contour de l'étang (+ marge), en unités du viewBox.
    function cadreEtang() {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (let i = 0; i < 96; i++) {
            const a = (i / 96) * Math.PI * 2;
            const r = rayonEtang(a) * ech;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
        const marge = 3;
        return { x: x0 - marge, y: y0 - marge, w: x1 - x0 + 2 * marge, h: y1 - y0 + 2 * marge };
    }

    // Le fond est dessiné à la première ouverture, puis seulement si la grille ou l'échelle change (biotope).
    function dessinerFond() {
        majEchelle();
        const chemins = {};
        substrats.rectsCarte().forEach(function (r) {
            const w = (r.w * ech).toFixed(2);
            const h = (r.h * ech).toFixed(2);
            chemins[r.substrat] = (chemins[r.substrat] || '') + 'M' + mx(r.x).toFixed(1) + ' ' + mz(r.z).toFixed(1)
                + 'h' + w + 'v' + h + 'h-' + w + 'z';
        });
        const bord = contour();
        // Cadrage serré sur l'étang (le viewBox suit son contour) : sur grand écran, l'étang remplit la carte.
        const cadre = cadreEtang();
        // Carte cadrée = carte agrandie : les points rapetissent d'autant (sinon ils couvrent l'étang).
        echellePoints = Math.max(0.35, Math.min(1, cadre.w / LARGEUR) * 0.7);
        if (svgEl && svgEl.setAttribute) {
            svgEl.setAttribute('viewBox', cadre.x.toFixed(1) + ' ' + cadre.y.toFixed(1) + ' '
                + cadre.w.toFixed(1) + ' ' + cadre.h.toFixed(1));
        }
        let svg = '<rect x="' + cadre.x.toFixed(1) + '" y="' + cadre.y.toFixed(1) + '" width="' + cadre.w.toFixed(1)
            + '" height="' + cadre.h.toFixed(1) + '" rx="4" fill="#2f6b3f"/>'
            + '<path d="' + bord + '" fill="#3790b3"/>'
            + '<clipPath id="radar-clip-fonds"><path d="' + bord + '"/></clipPath>'
            + '<g clip-path="url(#radar-clip-fonds)" opacity="0.6">';
        substrats.SUBSTRATS.forEach(function (sub) {
            svg += '<path class="radar-fond radar-fond-' + sub.id + '" d="' + (chemins[sub.id] || '')
                + '" fill="' + sub.couleur + '" stroke="' + sub.couleur + '" stroke-width="0.4"/>';   // le trait comble les fines coutures entre rangées
        });
        svg += '</g><path d="' + bord + '" fill="none" stroke="#eaf6ff" stroke-width="0.8"/>';
        fondEl.innerHTML = svg;
        fondDessine = true;
        cleFond = cleDuFond();
    }

    function triangle(p) {
        const c = Math.cos(p.cap);
        const s = Math.sin(p.cap);
        const sommet = function (avant, cote) {
            return (p.x + c * avant - s * cote).toFixed(1) + ',' + (p.y + s * avant + c * cote).toFixed(1);
        };
        return sommet(4.5, 0) + " " + sommet(-2.8, 2.6) + " " + sommet(-2.8, -2.6);
    }

    function dessiner() {
        let svg = '';
        // Grille de chaleur (sous les poissons) : plus une case est orange, plus elle a de poissons.
        const d = derniereDensite;
        if (d && d.max > 0) {
            d.grille.forEach(function (n, i) {
                if (n === 0) { return; }
                const x = (i % d.colonnes) * CASE;
                const y = Math.floor(i / d.colonnes) * CASE;
                svg += '<rect class="radar-densite" data-n="' + n + '" x="' + x + '" y="' + y + '" width="' + CASE
                    + '" height="' + CASE + '" fill="#ff8c1a" fill-opacity="' + (0.08 + 0.42 * n / d.max).toFixed(2) + '"/>';
            });
        }
        // Nuages d'amorce (boules lancées) : disque d'attraction + point central beige.
        derniersAmorces.forEach(function (a) {
            svg += '<circle class="radar-amorce-zone" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1)
                + '" r="' + a.rayon.toFixed(1) + '" fill="#e8c46a" fill-opacity="' + (0.12 + 0.18 * a.force).toFixed(2)
                + '" stroke="#e8c46a" stroke-width="0.5" stroke-dasharray="2 1.5"/>';
            svg += '<circle class="radar-amorce" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1)
                + '" r="1.8" fill="#cdb56f" stroke="#5a4310" stroke-width="0.8"/>';
        });
        derniersPoints.forEach(function (p) {
            svg += '<circle class="radar-zone" cx="' + p.maisonX.toFixed(1) + '" cy="' + p.maisonY.toFixed(1)
                + '" r="' + p.maisonRayon.toFixed(1) + '" fill="none" stroke="' + p.couleur
                + '" stroke-opacity="0.28" stroke-width="0.4" stroke-dasharray="1.5 1.5"/>';
        });
        derniersPoints.forEach(function (p) {
            svg += '<line class="radar-cap" x1="' + p.x.toFixed(1) + '" y1="' + p.y.toFixed(1)
                + '" x2="' + (p.x + (p.queueX - p.x) * echellePoints).toFixed(1)
                + '" y2="' + (p.y + (p.queueY - p.y) * echellePoints).toFixed(1)
                + '" stroke="' + p.couleur + '" stroke-width="0.6" stroke-linecap="round"/>';
            svg += '<circle class="radar-poisson" data-espece="' + p.especeId + '" cx="' + p.x.toFixed(1)
                + '" cy="' + p.y.toFixed(1) + '" r="' + (p.rayon * echellePoints).toFixed(2) + '" fill="' + p.couleur
                + '" stroke="#0b1d28" stroke-width="0.3"/>';
        });
        const j = dernierPecheur;
        if (j.bateau) {
            svg += '<ellipse class="radar-barque" cx="' + j.bateauX.toFixed(1) + '" cy="' + j.bateauY.toFixed(1)
                + '" rx="8" ry="4.6" fill="#8a5a2b" stroke="#f5deb3" stroke-width="0.9"'
                + ' transform="rotate(' + (j.cap * 180 / Math.PI).toFixed(0) + ' ' + j.bateauX.toFixed(1) + ' '
                + j.bateauY.toFixed(1) + ')"/>';
        }
        // Le pêcheur d'abord, puis le bouchon PAR-DESSUS : visible même au-dessus d'un poisson ou du pêcheur.
        svg += '<polygon class="radar-pecheur" points="' + triangle(j)
            + '" fill="#f2f2f2" stroke="#222222" stroke-width="0.8" stroke-linejoin="round"/>';
        if (j.bouchon) {
            const bx = j.bouchon.x.toFixed(1);
            const by = j.bouchon.y.toFixed(1);
            svg += '<line class="radar-ligne" x1="' + j.x.toFixed(1) + '" y1="' + j.y.toFixed(1) + '" x2="' + bx + '" y2="' + by
                + '" stroke="#ff5a3c" stroke-width="0.5" stroke-dasharray="1.5 1" stroke-opacity="0.8"/>';
            svg += '<circle class="radar-bouchon-halo" cx="' + bx + '" cy="' + by
                + '" r="5" fill="none" stroke="#ff5a3c" stroke-width="0.8" stroke-opacity="0.9"/>';
            svg += '<circle class="radar-bouchon" cx="' + bx + '" cy="' + by
                + '" r="2.4" fill="#fffbe0" stroke="#ff5a3c" stroke-width="1.2"/>';
        }
        vivantEl.innerHTML = svg;
    }

    function cleDuFond() { return substrats.empreinte() + '|' + monde.rayonCadre + '|' + POND_CENTER.x + ',' + POND_CENTER.z; }

    function rafraichir() {
        if (fondDessine && cleDuFond() !== cleFond) { dessinerFond(); }   // autre biotope ou autre taille : fond refait
        majEchelle();
        derniersPoints = fishes.map(pointDe);
        dernierPecheur = pecheurDe();
        derniersAmorces = (etat.chums || []).filter(function (n) { return n.strength > 0; }).map(function (n) {
            return { x: mx(n.position.x), y: mz(n.position.z), rayon: 6 * ech, force: Math.min(1, n.strength) };
        });
        derniereDensite = densiteDe(derniersPoints);
        dessiner();
        if (infoEl) { infoEl.textContent = texteInfo(derniereDensite); }
        misesAJour += 1;
    }

    // --- API -------------------------------------------------------------------------------
    function majBouton() {
        if (!bouton) { return; }
        bouton.hidden = !(etat.journal && etat.journal.radar);
        bouton.setAttribute('aria-pressed', String(actif));
        bouton.textContent = actif ? '🗺️ Ranger le radar' : '🗺️ Radar';
    }

    function fermer() {
        actif = false;
        panneau.hidden = true;
        majBouton();
    }

    function basculer() {
        if (actif) { fermer(); return false; }
        actif = true;
        majBouton();
        if (!fondDessine) { dessinerFond(); }
        panneau.hidden = false;
        attente = 0;
        rafraichir();
        return true;
    }

    // Appelé à chaque image : ne fait RIEN si le radar est fermé, et au plus ~10 fois par seconde sinon.
    function maj(dt) {
        if (!actif) { return; }
        attente += dt;
        if (attente < PERIODE) { return; }
        attente = 0;
        rafraichir();
    }

    // Achat en boutique (une seule fois, pour toujours). Renvoie true si réussi.
    function acheter() {
        const journal = etat.journal;
        if (!journal || journal.radar || journal.experience < RADAR_PRIX) { return false; }
        journal.experience -= RADAR_PRIX;
        journal.radar = true;
        if (saveJournal) { saveJournal(); }
        if (renderJournal) { renderJournal(); }
        majBouton();
        return true;
    }

    if (bouton) {
        bouton.addEventListener('click', function () {
            if (!etat.journal || !etat.journal.radar) { return; }
            basculer();
            if (fermerOutils) { fermerOutils(); }   // sur petit écran, le menu ouvert cacherait la carte
        });
    }

    return {
        basculer, estActif: function () { return actif; }, maj, fermer,
        // Lecture seule (tests) : le modèle du dernier dessin, et le nombre de mises à jour du DOM.
        points: function () { return derniersPoints; },
        pecheur: function () { return dernierPecheur; },
        amorces: function () { return derniersAmorces; },
        misesAJour: function () { return misesAJour; },
        densite: function () { return derniereDensite; },
        acheter, majBouton,
        couleurDe, rayonDe
    };
}

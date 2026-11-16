// ---------------------------------------------------------------------------
// radar.js — CHEAT « radar » : carte 2D superposée au jeu, avec TOUS les poissons
// qui nagent (idées.md §17.3). Un mot secret (cheat.js) l'affiche / le masque.
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
import { etat } from './etat.js?v=225';

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

export function creerRadar(deps) {
    const {
        fishes, angler, floatGroup, panneau, fondEl, vivantEl, substrats, POND_CENTER, rayonEtang,
        RAYON_CADRE_CARTE, SPECIES, COMPORTEMENTS
    } = deps;

    // Échelle : le cadre (demi-hauteur 58) contient le plus grand rayon du contour + la couronne
    // de placement, comme la carte du carnet. Le nord est en haut (z croissant vers le bas).
    const cx = LARGEUR / 2;
    const cy = HAUTEUR / 2;
    const ech = 58 / RAYON_CADRE_CARTE;
    const mx = function (x) { return cx + (x - POND_CENTER.x) * ech; };
    const mz = function (z) { return cy + (z - POND_CENTER.z) * ech; };

    let actif = false;
    let fondDessine = false;
    let attente = 0;
    let misesAJour = 0;
    let derniersPoints = [];
    let dernierPecheur = null;

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

    // Le fond ne change jamais : dessiné une seule fois, à la première ouverture.
    function dessinerFond() {
        const chemins = {};
        substrats.rectsCarte().forEach(function (r) {
            const w = (r.w * ech).toFixed(2);
            const h = (r.h * ech).toFixed(2);
            chemins[r.substrat] = (chemins[r.substrat] || '') + 'M' + mx(r.x).toFixed(1) + ' ' + mz(r.z).toFixed(1)
                + 'h' + w + 'v' + h + 'h-' + w + 'z';
        });
        const bord = contour();
        let svg = '<rect x="0" y="0" width="' + LARGEUR + '" height="' + HAUTEUR + '" rx="8" fill="#2f6b3f"/>'
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
    }

    function triangle(p) {
        const c = Math.cos(p.cap);
        const s = Math.sin(p.cap);
        const sommet = function (avant, cote) {
            return (p.x + c * avant - s * cote).toFixed(1) + ',' + (p.y + s * avant + c * cote).toFixed(1);
        };
        return sommet(6.5, 0) + ' ' + sommet(-4, 3.8) + ' ' + sommet(-4, -3.8);
    }

    function dessiner() {
        let svg = '';
        derniersPoints.forEach(function (p) {
            svg += '<circle class="radar-zone" cx="' + p.maisonX.toFixed(1) + '" cy="' + p.maisonY.toFixed(1)
                + '" r="' + p.maisonRayon.toFixed(1) + '" fill="none" stroke="' + p.couleur
                + '" stroke-opacity="0.28" stroke-width="0.4" stroke-dasharray="1.5 1.5"/>';
        });
        derniersPoints.forEach(function (p) {
            svg += '<line class="radar-cap" x1="' + p.x.toFixed(1) + '" y1="' + p.y.toFixed(1)
                + '" x2="' + p.queueX.toFixed(1) + '" y2="' + p.queueY.toFixed(1)
                + '" stroke="' + p.couleur + '" stroke-width="1" stroke-linecap="round"/>';
            svg += '<circle class="radar-poisson" data-espece="' + p.especeId + '" cx="' + p.x.toFixed(1)
                + '" cy="' + p.y.toFixed(1) + '" r="' + p.rayon.toFixed(1) + '" fill="' + p.couleur
                + '" stroke="#0b1d28" stroke-width="0.5"/>';
        });
        const j = dernierPecheur;
        if (j.bateau) {
            svg += '<ellipse class="radar-barque" cx="' + j.bateauX.toFixed(1) + '" cy="' + j.bateauY.toFixed(1)
                + '" rx="8" ry="4.6" fill="#8a5a2b" stroke="#f5deb3" stroke-width="0.9"'
                + ' transform="rotate(' + (j.cap * 180 / Math.PI).toFixed(0) + ' ' + j.bateauX.toFixed(1) + ' '
                + j.bateauY.toFixed(1) + ')"/>';
        }
        if (j.bouchon) {
            svg += '<circle class="radar-bouchon" cx="' + j.bouchon.x.toFixed(1) + '" cy="' + j.bouchon.y.toFixed(1)
                + '" r="1.9" fill="#fffbe0" stroke="#ff5a3c" stroke-width="0.9"/>';
        }
        svg += '<polygon class="radar-pecheur" points="' + triangle(j)
            + '" fill="#f2f2f2" stroke="#222222" stroke-width="0.8" stroke-linejoin="round"/>';
        vivantEl.innerHTML = svg;
    }

    function rafraichir() {
        derniersPoints = fishes.map(pointDe);
        dernierPecheur = pecheurDe();
        dessiner();
        misesAJour += 1;
    }

    // --- API -------------------------------------------------------------------------------
    function fermer() {
        actif = false;
        panneau.hidden = true;
    }

    function basculer() {
        if (actif) { fermer(); return false; }
        actif = true;
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

    return {
        basculer, estActif: function () { return actif; }, maj, fermer,
        // Lecture seule (tests) : le modèle du dernier dessin, et le nombre de mises à jour du DOM.
        points: function () { return derniersPoints; },
        pecheur: function () { return dernierPecheur; },
        misesAJour: function () { return misesAJour; },
        couleurDe, rayonDe
    };
}

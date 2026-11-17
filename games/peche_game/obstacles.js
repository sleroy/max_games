// ---------------------------------------------------------------------------
// obstacles.js — OBSTACLES AQUATIQUES (idées.md §14.2) : ponton, écluse, douve,
// roches à moitié émergées, souches immergées, pieux, épave, îlots de joncs.
//
// Trois rôles de jeu pour chaque obstacle :
//  - ACCROCHAGE : l'hameçon qui tombe dessus se coince (mini-jeu de accrochage.js),
//    avec SA difficulté et SON message (ACCROCHAGES) ;
//  - ATTRACTION : chaque obstacle attire certaines espèces (zone de vie déplacée sur
//    lui, voir attirer()), reliée aux COMPORTEMENTS d'especes.js ;
//  - COLLISION : la barque s'arrête (ou ralentit) et le lancer est refusé dessus.
//
// Contrat (docs/modules.md) : aucun accès aux globales de script.js ni à `window`.
// ⚠ Le monde est reproductible : ce module ne consomme JAMAIS `rand()`. Le placement
// est entièrement déterministe (angles fixes + recherche de la première place libre),
// les détails (blocs, branches, planches) viennent d'un générateur LOCAL à graine fixe.
// Tout est dessiné en code (géométrie + textures canvas) : aucune image, aucune licence.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { FORME_DEFAUT, angleSurForme, angleDepuisForme, pointAuBord } from './dimensions.js?v=245';

export const RAYON_BARQUE = 1.5;     // rayon de la coque pour les collisions
export const MARGE_ACCROCHE = 0.8;   // l'hameçon se coince à moins de 0,8 d'un obstacle
export const ATTIRE_RAYON = 10;      // rayon de la zone de vie autour d'un obstacle
const DEG = Math.PI / 180;
const PROBA_ATTIRANCE = 0.5;         // part des poissons (ou bancs) attirés par un obstacle
const COULOIR_POSTE = 14 * DEG;      // aucun obstacle à ±14° d'un des 4 postes de berge

// Difficultés d'accrochage : mêmes réglages que accrochage.js (nénuphars : 0,12 / 0,10 / 1,1 /
// 0,10 / pas d'attente ; vase : 0,08 / 0,08 / 0,9 / 0,12 / 0,32 s). clickCooldown > 0 =
// il faut cliquer EN RYTHME. Plus le fil tire fort et plus l'attente est longue, plus c'est dur.
export const ACCROCHAGES = {
    pieux: { difficulte: 'facile', niveau: 1, message: 'Ligne accrochée aux pieux !',
        pullRate: 0.10, burstStrength: 0.09, burstInterval: 1.1, clickPower: 0.10, clickCooldown: 0.15, tensionDepart: 0.5 },
    joncs: { difficulte: 'facile', niveau: 1, message: 'Ligne enroulée dans les joncs !',
        pullRate: 0.11, burstStrength: 0.08, burstInterval: 1.2, clickPower: 0.10, clickCooldown: 0, tensionDepart: 0.5 },
    ponton: { difficulte: 'moyenne', niveau: 2, message: 'Ligne accrochée aux pilotis du ponton !',
        pullRate: 0.10, burstStrength: 0.10, burstInterval: 1.1, clickPower: 0.11, clickCooldown: 0.2, tensionDepart: 0.5 },
    roches: { difficulte: 'moyenne', niveau: 2, message: 'Hameçon coincé entre les roches !',
        pullRate: 0.09, burstStrength: 0.09, burstInterval: 1.0, clickPower: 0.11, clickCooldown: 0.26, tensionDepart: 0.5 },
    souche: { difficulte: 'difficile', niveau: 3, message: 'Ligne accrochée à la souche !',
        pullRate: 0.10, burstStrength: 0.12, burstInterval: 0.95, clickPower: 0.11, clickCooldown: 0.30, tensionDepart: 0.55 },
    epave: { difficulte: 'difficile', niveau: 3, message: 'Ligne accrochée à l’épave !',
        pullRate: 0.12, burstStrength: 0.12, burstInterval: 0.85, clickPower: 0.10, clickCooldown: 0.30, tensionDepart: 0.55 },
    ecluse: { difficulte: 'difficile', niveau: 3, message: 'Ligne accrochée aux pierres de l’écluse !',
        pullRate: 0.11, burstStrength: 0.12, burstInterval: 0.9, clickPower: 0.10, clickCooldown: 0.34, tensionDepart: 0.55 }
};

// Types : accroche (clé d'ACCROCHAGES, ou null), barque ('arret' | 'ralenti' | null),
// bloqueLancer (le lancer retombe dessus : refusé), especes (attirées, ids d'especes.js).
export const TYPES = {
    ponton: { nom: 'le ponton', accroche: 'ponton', barque: 'arret', bloqueLancer: true, especes: ['gardon'] },
    ecluse: { nom: 'l’écluse', accroche: 'ecluse', barque: 'arret', bloqueLancer: true, especes: ['chevesne'] },
    douve: { nom: 'la douve', accroche: null, barque: null, bloqueLancer: false, especes: ['tanche', 'carassin'] },
    roches: { nom: 'les roches', accroche: 'roches', barque: 'arret', bloqueLancer: true, especes: ['perche'] },
    souche: { nom: 'la souche', accroche: 'souche', barque: 'arret', bloqueLancer: false, especes: ['brochet', 'black-bass'] },
    pieux: { nom: 'les pieux', accroche: 'pieux', barque: 'arret', bloqueLancer: false, especes: ['rotengle'] },
    epave: { nom: 'l’épave', accroche: 'epave', barque: 'arret', bloqueLancer: false, especes: ['carassin'] },
    joncs: { nom: 'l’îlot de joncs', accroche: 'joncs', barque: 'ralenti', bloqueLancer: false, especes: ['brochet', 'gardon'] }
};

// Emplacements : angle (degrés, x = cos, z = sin, comme rayonEtang) et distance `d` au bord.
// Les 4 postes de berge sont à 2,6° / 92,6° / 182,6° / 272,6° : tout est placé dans les
// quatre fenêtres intermédiaires. Ordre = priorité (les grands ouvrages d'abord).
const SPECS = [
    { type: 'ponton', angle: 50, d: 0 },
    { type: 'ecluse', angle: 140, d: 0 },
    { type: 'douve', angle: 322, d: 0 },
    { type: 'roches', angle: 116, d: 7 },
    { type: 'roches', angle: 158, d: 8 },
    { type: 'roches', angle: 340, d: 7 },
    { type: 'souche', angle: 208, d: 7 },
    { type: 'souche', angle: 240, d: 8 },
    { type: 'epave', angle: 224, d: 6 },
    { type: 'pieux', angle: 30, d: 6 },
    { type: 'joncs', angle: 298, d: 8 },
    { type: 'joncs', angle: 250, d: 8 }
];

// Générateur local à graine fixe (LCG) : ne touche pas au rand() du jeu.
function creerHasard(graine) {
    let s = graine >>> 0;
    return function () {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Empreinte d'une liste d'obstacles (comparaison de deux placements).
export function signature(liste) {
    return liste.map(function (o) {
        return o.id + '@' + o.x.toFixed(4) + ',' + o.z.toFixed(4) + '/' + o.cercles.map(function (c) {
            return c.x.toFixed(3) + ',' + c.z.toFixed(3) + ',' + c.r.toFixed(2);
        }).join(';');
    }).join('|');
}

function ecartAngle(a, b) {
    const d = Math.abs(a - b) % (Math.PI * 2);
    return Math.min(d, Math.PI * 2 - d);
}

export function creerObstacles(deps) {
    const { scene, POND_CENTER, rayonEtang, fondY, FOSSES, lilyPads, decor, ANGLE_BASE, POSTES,
        POSTE_ANGLER, POSTE_BOURRICHE, POSTE_MARGE, RIVE_Y } = deps;
    // Copie des nénuphars de départ : refaire() (tests) rejoue le même placement même si les
    // nénuphars ont été vidés entre-temps. Refaite à chaque reconstruction (taille d'étang changée).
    let padsInitiaux = lilyPads.map(function (p) { return { x: p.x, z: p.z, radius: p.radius }; });
    // Le monde ACTUEL (environnement.js `monde`) : l'échelle f = rayon / 90 (1 dans la plaine). Le centre de l'étang
    // et son contour sont lus à chaque pose : le placement se refait dans le nouveau contour (reconstruire()).
    const monde = deps.monde || { echelle: 1 };
    let CX = POND_CENTER.x;
    let CZ = POND_CENTER.z;
    let ECH = 1;                         // échelle des distances au bord et des zones libres pour CE placement
    const _m = new THREE.Matrix4();
    const _q = new THREE.Quaternion();
    const _p = new THREE.Vector3();
    const _s = new THREE.Vector3();
    const _e = new THREE.Euler();
    const _c = new THREE.Color();
    const HAUT = new THREE.Vector3(0, 1, 0);

    // --- Textures et matériaux (100 % code, canvas 64 px, fillRect uniquement) -------------
    function textureBois(base, graine) {
        const hasard = creerHasard(graine);
        const toile = document.createElement('canvas');
        toile.width = 64;
        toile.height = 64;
        const g = toile.getContext('2d');
        g.fillStyle = base;
        g.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 24; i++) {   // veines le long de la planche (axe v)
            g.fillStyle = hasard() > 0.5 ? 'rgba(255,240,210,0.10)' : 'rgba(30,20,10,0.18)';
            g.fillRect(hasard() * 64, 0, 1 + hasard() * 2, 64);
        }
        g.fillStyle = 'rgba(35,22,10,0.55)';   // deux nœuds
        g.fillRect(hasard() * 56, hasard() * 56, 4, 3);
        g.fillRect(hasard() * 56, hasard() * 56, 3, 4);
        const t = new THREE.CanvasTexture(toile);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        return t;
    }

    function texturePierre(graine) {
        const hasard = creerHasard(graine);
        const toile = document.createElement('canvas');
        toile.width = 64;
        toile.height = 64;
        const g = toile.getContext('2d');
        g.fillStyle = '#8e8a80';
        g.fillRect(0, 0, 64, 64);
        for (let rang = 0; rang < 4; rang++) {   // 4 rangs d'appareil, décalés d'un rang sur l'autre
            for (let bloc = 0; bloc < 3; bloc++) {
                const x = ((bloc * 24) + (rang % 2) * 12) % 72 - 8;
                g.fillStyle = 'rgba(' + (hasard() > 0.5 ? '255,255,240,' : '30,30,25,') + (0.05 + hasard() * 0.12) + ')';
                g.fillRect(x, rang * 16, 24, 16);
            }
            g.fillStyle = 'rgba(25,25,22,0.7)';   // joint horizontal
            g.fillRect(0, rang * 16, 64, 2);
        }
        const t = new THREE.CanvasTexture(toile);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        return t;
    }

    const texPierre = texturePierre(31);
    texPierre.repeat.set(3, 1);
    const mat = {
        planche: new THREE.MeshStandardMaterial({ map: textureBois('#9a7a4c', 11), roughness: 0.9 }),
        poutre: new THREE.MeshStandardMaterial({ color: 0x4d3c2b, roughness: 0.95 }),
        pieu: new THREE.MeshStandardMaterial({ color: 0x5a4f40, roughness: 1 }),
        caisse: new THREE.MeshStandardMaterial({ map: textureBois('#7d6540', 23), roughness: 0.95 }),
        pierre: new THREE.MeshStandardMaterial({ map: texPierre, roughness: 0.95 }),
        chape: new THREE.MeshStandardMaterial({ color: 0xb9b4a6, roughness: 0.9 }),
        vantail: new THREE.MeshStandardMaterial({ color: 0x3d4a40, roughness: 0.8 }),
        fer: new THREE.MeshStandardMaterial({ color: 0x2d3236, roughness: 0.6, metalness: 0.4 }),
        mort: new THREE.MeshStandardMaterial({ color: 0x4a3d30, roughness: 1 }),
        roche: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
        jonc: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide }),
        boue: new THREE.MeshStandardMaterial({ color: 0x57503b, roughness: 1 }),
        berge: new THREE.MeshStandardMaterial({ color: 0x7c6b4e, roughness: 1 }),
        canal: new THREE.MeshStandardMaterial({ color: 0x2f7f93, roughness: 0.25, transparent: true, opacity: 0.92 })
    };

    // --- Aides de dessin -------------------------------------------------------------------
    function instances(geo, materiau, n) {
        const m = new THREE.InstancedMesh(geo, materiau, n);
        m.frustumCulled = false;   // la boîte englobante de la géométrie seule serait fausse
        return m;
    }

    function poser(m, i, x, y, z, rx, ry, rz, sx, sy, sz) {
        _e.set(rx, ry, rz);
        _q.setFromEuler(_e);
        _p.set(x, y, z);
        _s.set(sx, sy, sz);
        _m.compose(_p, _q, _s);
        m.setMatrixAt(i, _m);
    }

    // Cylindre unitaire (base à l'origine, haut = +y) posé de A vers B.
    function poserBranche(m, i, a, b, epaisseur) {
        _p.set(b.x - a.x, b.y - a.y, b.z - a.z);
        const longueur = _p.length();
        _q.setFromUnitVectors(HAUT, _p.normalize());
        _s.set(epaisseur, longueur, epaisseur);
        _p.set(a.x, a.y, a.z);
        _m.compose(_p, _q, _s);
        m.setMatrixAt(i, _m);
    }

    function teinter(m, i, couleur, variation, hasard) {
        _c.set(couleur).multiplyScalar(1 + (hasard() - 0.5) * variation);
        m.setColorAt(i, _c);
    }

    function boite(g, materiau, lx, ly, lz, x, y, z, ry) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), materiau);
        mesh.position.set(x, y, z);
        mesh.rotation.y = ry || 0;
        g.add(mesh);
        return mesh;
    }

    // Bloc de roche : sphère déformée (arrondie), sombre et mouillée en bas, claire et sèche
    // en haut. L'instance est posée à y = 0,25 × échelle : la ligne d'eau coupe à y local −0,25.
    const rocheGeo = (function () {
        const geo = new THREE.SphereGeometry(1, 12, 9);
        const pos = geo.attributes.position;
        const couleurs = [];
        const humide = new THREE.Color(0x394348);
        const sec = new THREE.Color(0xaaa493);
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            const f = 1 + 0.12 * Math.sin(x * 3.7 + 1.1) * Math.sin(z * 3.1 + 0.4) + 0.08 * Math.sin(y * 5.3 + 2);
            pos.setXYZ(i, x * f, y * f * 0.85, z * f);
            const t = THREE.MathUtils.smoothstep(y * f * 0.85, -0.3, 0.3);
            _c.copy(humide).lerp(sec, t);
            couleurs.push(_c.r, _c.g, _c.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(couleurs, 3));
        geo.computeVertexNormals();
        return geo;
    }());

    // --- Formes locales : cercles de collision + dessin --------------------------------------
    // Repère local : x = vers la berge (sortant de l'étang), z = perpendiculaire, y = hauteur.
    // `eau` : le centre du cercle doit être dans l'eau. `barque:false` : ne bloque pas la coque.
    function formePonton(h) {
        const cercles = [];
        for (let x = -11; x <= 2.6; x += 2.4) { cercles.push({ x: x, z: 0, r: 2.0, eau: x < -3 }); }
        function dessiner(g) {
            const n = 29;
            const planches = instances(new THREE.BoxGeometry(0.46, 0.1, 3.4), mat.planche, n);
            for (let i = 0; i < n; i++) {
                poser(planches, i, -12 + i * 0.52, 0.62 + (h() - 0.5) * 0.015, (h() - 0.5) * 0.06,
                    0, (h() - 0.5) * 0.02, 0, 1, 1, 0.96 + h() * 0.05);
                teinter(planches, i, 0xffffff, 0.4, h);
            }
            g.add(planches);
            const poutres = instances(new THREE.BoxGeometry(15.1, 0.16, 0.18), mat.poutre, 2);
            poser(poutres, 0, -4.7, 0.47, -1.35, 0, 0, 0, 1, 1, 1);
            poser(poutres, 1, -4.7, 0.47, 1.35, 0, 0, 0, 1, 1, 1);
            g.add(poutres);
            const pilotis = instances(new THREE.CylinderGeometry(0.13, 0.16, 2.6, 7), mat.pieu, 12);
            for (let k = 0; k < 6; k++) {
                poser(pilotis, k * 2, -11.2 + k * 2.7, -0.35, -1.55, 0, 0, 0, 1, 1, 1);
                poser(pilotis, k * 2 + 1, -11.2 + k * 2.7, -0.35, 1.55, 0, 0, 0, 1, 1, 1);
            }
            g.add(pilotis);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formeEcluse(h) {
        const cercles = [];
        for (let x = -5.5; x <= 3.6; x += 2) {
            cercles.push({ x: x, z: -3, r: 1.4, eau: x < -3 });
            cercles.push({ x: x, z: 3, r: 1.4, eau: x < -3 });
        }
        cercles.push({ x: -6, z: 0, r: 1.5, eau: true }, { x: -6, z: -1.6, r: 1.5, eau: true }, { x: -6, z: 1.6, r: 1.5, eau: true });
        function dessiner(g) {
            const pierres = instances(new THREE.BoxGeometry(1, 1, 1), mat.pierre, 5);
            poser(pierres, 0, -1, 0.3, -3, 0, 0, 0, 10, 2.2, 1.3);        // bajoyer gauche
            poser(pierres, 1, -1, 0.3, 3, 0, 0, 0, 10, 2.2, 1.3);         // bajoyer droit
            poser(pierres, 2, -1, 1.46, -3, 0, 0, 0, 10.3, 0.12, 1.55);    // chaperons
            poser(pierres, 3, -1, 1.46, 3, 0, 0, 0, 10.3, 0.12, 1.55);
            poser(pierres, 4, 4.2, 0.2, 0, 0, 0, 0, 0.8, 1.0, 4.7);       // seuil amont
            for (let i = 2; i < 4; i++) { teinter(pierres, i, 0xc9c4b6, 0.1, h); }
            teinter(pierres, 0, 0xffffff, 0.15, h);
            teinter(pierres, 1, 0xffffff, 0.15, h);
            teinter(pierres, 4, 0xffffff, 0.15, h);
            g.add(pierres);
            // Portes (vantaux) fermées en V, côté étang ; un caillebotis les relie.
            const portes = instances(new THREE.BoxGeometry(0.35, 1.5, 2.7), mat.vantail, 2);
            poser(portes, 0, -6.2, 0.35, -1.2, 0, 0.3, 0, 1, 1, 1);
            poser(portes, 1, -6.2, 0.35, 1.2, 0, -0.3, 0, 1, 1, 1);
            g.add(portes);
            // Échelle de fer scellée dans le bajoyer droit : 2 montants + 6 barreaux.
            const echelle = instances(new THREE.BoxGeometry(1, 1, 1), mat.fer, 8);
            poser(echelle, 0, -2.2, 0.4, 2.3, 0, 0, 0, 0.06, 2.2, 0.06);
            poser(echelle, 1, -1.5, 0.4, 2.3, 0, 0, 0, 0.06, 2.2, 0.06);
            for (let k = 0; k < 6; k++) { poser(echelle, 2 + k, -1.85, -0.5 + k * 0.38, 2.3, 0, 0, 0, 0.7, 0.05, 0.05); }
            g.add(echelle);
            // Sas : une eau calme entre les murs, à fleur de berge (l'écluse se prolonge à terre).
            const sas = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.7), mat.canal);
            sas.rotation.x = -Math.PI / 2;
            sas.position.set(2.0, RIVE_Y + 0.04, 0);
            g.add(sas);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formeDouve() {
        // Le cercle « embouchure » est dans l'étang (position du repère) ; le reste est sur la rive.
        const cercles = [{ x: -3, z: 0, r: 2.5, eau: true, barque: false }];
        for (let x = 2; x <= 27; x += 3) { cercles.push({ x: x, z: 0, r: 3.2, eau: false, barque: false }); }
        function dessiner(g) {
            const eau = new THREE.Mesh(new THREE.PlaneGeometry(27.5, 5.5), mat.canal);
            eau.rotation.x = -Math.PI / 2;
            eau.position.set(13.55, RIVE_Y + 0.05, 0);
            g.add(eau);
            const bords = instances(new THREE.BoxGeometry(27.5, 0.5, 0.5), mat.berge, 2);
            poser(bords, 0, 13.55, RIVE_Y + 0.2, -3, 0, 0, 0, 1, 1, 1);
            poser(bords, 1, 13.55, RIVE_Y + 0.2, 3, 0, 0, 0, 1, 1, 1);
            g.add(bords);
            boite(g, mat.pierre, 0.7, 0.3, 5.5, -0.2, RIVE_Y + 0.05, 0);   // seuil de pierre (déversoir)
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formeRoches(h) {
        const blocs = [];
        const n = 5;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + h() * 0.8;
            const dist = i === 0 ? 0 : 1.6 + h() * 1.3;
            blocs.push({ x: Math.cos(a) * dist, z: Math.sin(a) * dist, s: i === 0 ? 1.9 : 0.9 + h() * 0.8, ry: h() * 6 });
        }
        const cercles = blocs.map(function (b) { return { x: b.x, z: b.z, r: b.s * 0.95, eau: true }; });
        function dessiner(g) {
            const m = instances(rocheGeo, mat.roche, n);
            blocs.forEach(function (b, i) {
                poser(m, i, b.x, 0.25 * b.s, b.z, 0, b.ry, 0, b.s * 1.1, b.s, b.s);
                teinter(m, i, 0xffffff, 0.25, h);
            });
            g.add(m);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formeSouche(h) {
        // Souche immergée : le tronc affleure (+0,12), des branches mortes partent dans tous les
        // sens, les unes sous l'eau, les autres qui crèvent la surface.
        const elev = [1.0, 0.7, 0.3, -0.2, -0.6, -0.9];
        const branches = elev.map(function (e, i) {
            const az = (i / elev.length) * Math.PI * 2 + h() * 0.7;
            return { az: az, e: e, len: 1.6 + h() * 1.4 };
        });
        const cercles = [{ x: 0, z: 0, r: 1.4, eau: true }];
        branches.slice(0, 2).forEach(function (b) {
            cercles.push({ x: Math.cos(b.az) * b.len * 0.55, z: Math.sin(b.az) * b.len * 0.55, r: 0.9, eau: true });
        });
        function dessiner(g) {
            const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.85, 2.6, 8), mat.mort);
            tronc.position.y = -1.18;
            g.add(tronc);
            const m = instances(new THREE.CylinderGeometry(0.07, 0.2, 1, 5).translate(0, 0.5, 0), mat.mort, branches.length);
            branches.forEach(function (b, i) {
                const depart = { x: Math.cos(b.az) * 0.3, y: -0.15, z: Math.sin(b.az) * 0.3 };
                const arrivee = {
                    x: depart.x + Math.cos(b.az) * Math.cos(b.e) * b.len,
                    y: depart.y + Math.sin(b.e) * b.len,
                    z: depart.z + Math.sin(b.az) * Math.cos(b.e) * b.len
                };
                poserBranche(m, i, depart, arrivee, 1);
                teinter(m, i, 0xffffff, 0.35, h);
            });
            g.add(m);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formePieux(h) {
        const pos = [];
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + h() * 0.5;
            pos.push({ x: Math.cos(a) * (0.9 + h() * 0.5), z: Math.sin(a) * (0.9 + h() * 0.5), s: 0.75 + h() * 0.4, t: (h() - 0.5) * 0.12 });
        }
        const cercles = pos.map(function (p) { return { x: p.x, z: p.z, r: 0.55, eau: true }; });
        function dessiner(g) {
            const m = instances(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6), mat.pieu, pos.length);
            pos.forEach(function (p, i) { poser(m, i, p.x, 0.25 * p.s, p.z, p.t, 0, -p.t, 1, p.s, 1); teinter(m, i, 0xffffff, 0.3, h); });
            g.add(m);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formeEpave(h) {
        // 3 cageots à demi coulés + 2 planches flottantes (boîte unitaire mise à l'échelle).
        const pieces = [
            { x: 0, z: 0, y: 0.0, sx: 1.4, sy: 0.85, sz: 1.1, ry: 0.3, rz: 0.12 },
            { x: 1.5, z: 0.9, y: -0.15, sx: 1.3, sy: 0.8, sz: 1.0, ry: -0.5, rz: -0.2 },
            { x: -1.1, z: -1.0, y: -0.3, sx: 1.2, sy: 0.8, sz: 1.0, ry: 1.1, rz: 0.25 },
            { x: 0.4, z: -1.7, y: 0.02, sx: 2.4, sy: 0.08, sz: 0.35, ry: 0.5, rz: 0 },
            { x: -0.6, z: 1.7, y: 0.02, sx: 1.8, sy: 0.08, sz: 0.3, ry: -0.3, rz: 0 }
        ];
        const cercles = [{ x: 0, z: 0, r: 1.0, eau: true }, { x: 1.5, z: 0.9, r: 1.0, eau: true }, { x: -1.1, z: -1.0, r: 0.9, eau: true }];
        function dessiner(g) {
            const m = instances(new THREE.BoxGeometry(1, 1, 1), mat.caisse, pieces.length);
            pieces.forEach(function (p, i) { poser(m, i, p.x, p.y, p.z, 0, p.ry, p.rz, p.sx, p.sy, p.sz); teinter(m, i, 0xffffff, 0.3, h); });
            g.add(m);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    function formeJoncs(h) {
        const n = 40;
        const cercles = [{ x: 0, z: 0, r: 2.6, eau: true }];
        function dessiner(g) {
            const motte = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.9, 0.7, 10), mat.boue);
            motte.position.y = -0.15;
            g.add(motte);
            const m = instances(new THREE.CylinderGeometry(0.015, 0.035, 1, 4).translate(0, 0.5, 0), mat.jonc, n);
            const verts = [0x4f7a34, 0x6b8f3d, 0x8a9a4a];
            for (let i = 0; i < n; i++) {
                const a = h() * Math.PI * 2;
                const r = Math.sqrt(h()) * 2.4;
                poser(m, i, Math.cos(a) * r, 0.1, Math.sin(a) * r, (h() - 0.5) * 0.3, 0, (h() - 0.5) * 0.3, 1, 1.2 + h() * 1.2, 1);
                teinter(m, i, verts[i % 3], 0.2, h);
            }
            g.add(m);
        }
        return { cercles: cercles, dessiner: dessiner };
    }

    const FORMES = { ponton: formePonton, ecluse: formeEcluse, douve: formeDouve, roches: formeRoches,
        souche: formeSouche, pieux: formePieux, epave: formeEpave, joncs: formeJoncs };

    // --- Références à éviter : les 4 postes de berge (pêcheur + bourriche) ----------------------
    // Même calcul que bateau.js (rotation autour du centre puis recalage radial à POSTE_MARGE).
    // Remplie EN PLACE (reposer) : le centre et le contour dépendent de la taille de l'étang.
    const postesRef = [];
    function calculerPostesRef() {
        postesRef.length = 0;
        POSTES.forEach(function (poste) { postesRef.push(posteRef(poste)); });
    }
    function posteRef(poste) {
        const delta = poste.delta;
        const cos = Math.cos(delta);
        const sin = Math.sin(delta);
        const tourner = function (p) {
            return { x: CX + (p.x - CX) * cos + (p.z - CZ) * sin, z: CZ - (p.x - CX) * sin + (p.z - CZ) * cos };
        };
        const pecheur = tourner(POSTE_ANGLER);
        const bourriche = tourner(POSTE_BOURRICHE);
        const angle = Math.atan2(pecheur.z - CZ, pecheur.x - CX);
        const dist = Math.hypot(pecheur.x - CX, pecheur.z - CZ);
        const decal = rayonEtang(angle) + POSTE_MARGE - dist;
        const ux = Math.cos(angle);
        const uz = Math.sin(angle);
        pecheur.x += ux * decal; pecheur.z += uz * decal;
        bourriche.x += ux * decal; bourriche.z += uz * decal;
        return { angle: ANGLE_BASE - delta, pecheur: pecheur, bourriche: bourriche };
    }

    // --- Placement déterministe ---------------------------------------------------------------
    const liste = [];

    function versMonde(c, pose) {
        return { x: pose.x + c.x * pose.cos - c.z * pose.sin, z: pose.z + c.x * pose.sin + c.z * pose.cos,
            r: c.r, eau: c.eau, barque: c.barque };
    }

    function placeLibre(mondes) {
        for (let i = 0; i < mondes.length; i++) {
            const c = mondes[i];
            const dc = Math.hypot(c.x - CX, c.z - CZ);
            const ang = Math.atan2(c.z - CZ, c.x - CX);
            if (c.eau && dc > rayonEtang(ang) - 1.5) { return false; }         // centre dans l'eau
            for (let k = 0; k < postesRef.length; k++) {
                const ref = postesRef[k];
                // Le couloir de ±14° est celui de l'étang : sur un canal ou une rivière il se mesure dans le même repère
                // (angles ramenés à l'étang), sinon il couvrirait tout le bout du plan d'eau.
                if (ecartAngle(angleDepuisForme(ang, monde.forme), angleDepuisForme(ref.angle, monde.forme)) < COULOIR_POSTE) { return false; }
                if (Math.hypot(c.x - ref.pecheur.x, c.z - ref.pecheur.z) < c.r + 10 * Math.min(1, ECH)) { return false; }
                if (Math.hypot(c.x - ref.bourriche.x, c.z - ref.bourriche.z) < c.r + 8 * Math.min(1, ECH)) { return false; }
            }
            if (c.eau) {
                for (let k = 0; k < FOSSES.length; k++) {
                    if (Math.hypot(c.x - FOSSES[k].x, c.z - FOSSES[k].z) < FOSSES[k].rayon + c.r + 2) { return false; }
                }
                for (let k = 0; k < lilyPads.length; k++) {
                    if (Math.hypot(c.x - lilyPads[k].x, c.z - lilyPads[k].z) < c.r + lilyPads[k].radius + 0.5) { return false; }
                }
            }
            for (let k = 0; k < decor.arbres.length; k++) {
                if (Math.hypot(c.x - decor.arbres[k].x, c.z - decor.arbres[k].z) < c.r + decor.arbres[k].r) { return false; }
            }
            for (let k = 0; k < decor.rochers.length; k++) {
                if (Math.hypot(c.x - decor.rochers[k].x, c.z - decor.rochers[k].z) < c.r + decor.rochers[k].r + 0.5) { return false; }
            }
            for (let k = 0; k < decor.roseaux.length; k++) {
                if (Math.hypot(c.x - decor.roseaux[k].x, c.z - decor.roseaux[k].z) < c.r + 0.3) { return false; }
            }
            for (let k = 0; k < liste.length; k++) {
                for (let j = 0; j < liste[k].cercles.length; j++) {
                    const o = liste[k].cercles[j];
                    if (Math.hypot(c.x - o.x, c.z - o.z) < c.r + o.r + 1.5) { return false; }
                }
            }
        }
        return true;
    }

    const DECALAGES_ANGLE = [0, 1.5, -1.5, 3, -3, 4.5, -4.5, 6, -6, 8, -8, 10, -10];
    const DECALAGES_BORD = [0, 1.5, -1.5, 3, -3];

    function placer(spec, index) {
        const forme = FORMES[spec.type](creerHasard(1000 + index * 77));
        const bords = spec.d === 0 ? [0] : DECALAGES_BORD;
        for (let i = 0; i < DECALAGES_ANGLE.length; i++) {
            for (let j = 0; j < bords.length; j++) {
                // Les angles des emplacements sont ceux de l'étang : sur un canal ou une rivière, ils sont ramenés
                // sur les axes de la forme (même endroit RELATIF du plan d'eau). Identité pour l'étang.
                const angle = angleSurForme((spec.angle + DECALAGES_ANGLE[i]) * DEG, monde.forme);
                const recul = (spec.d + bords[j]) * Math.max(ECH, 0.35);   // distances au bord : × f (≥ 0,35 : un obstacle garde ses 1,5 unité d'eau) ; inchangées dans la plaine
                // Repère local : x vers la berge (u), z perpendiculaire (v).
                let pose;
                if (!monde.forme || monde.forme === FORME_DEFAUT) {
                    // Étang : l'ouvrage est posé et orienté sur le RAYON (monde d'origine, au bit près).
                    const rayon = rayonEtang(angle) - recul;
                    pose = { x: CX + Math.cos(angle) * rayon, z: CZ + Math.sin(angle) * rayon,
                        cos: Math.cos(angle), sin: Math.sin(angle), angle: angle };
                } else {
                    // Canal, lac, rivière : sur une berge presque parallèle au rayon, un ouvrage orienté sur le rayon
                    // longerait la rive. Il est posé et orienté sur la NORMALE du contour (perpendiculaire à la berge).
                    const o = pointAuBord(rayonEtang, angle, -recul);
                    pose = { x: CX + o.x, z: CZ + o.z, cos: o.nx, sin: o.nz, angle: Math.atan2(o.nz, o.nx) };
                }
                const mondes = forme.cercles.map(function (c) { return versMonde(c, pose); });
                if (placeLibre(mondes)) { return { forme: forme, pose: pose, cercles: mondes }; }
            }
        }
        return null;
    }

    function construire(spec, index) {
        const place = placer(spec, index);
        if (!place) { return; }
        const type = TYPES[spec.type];
        const groupe = new THREE.Group();
        groupe.position.set(place.pose.x, 0, place.pose.z);
        groupe.rotation.y = -place.pose.angle;
        place.forme.dessiner(groupe);
        scene.add(groupe);
        // Repère de l'obstacle : barycentre de ses cercles dans l'eau (donc toujours dans l'eau).
        const eau = place.cercles.filter(function (c) { return c.eau; });
        const x = eau.reduce(function (t, c) { return t + c.x; }, 0) / eau.length;
        const z = eau.reduce(function (t, c) { return t + c.z; }, 0) / eau.length;
        const rayon = eau.reduce(function (m, c) { return Math.max(m, Math.hypot(c.x - x, c.z - z) + c.r); }, 0);   // emprise dans l'eau
        // Centre de la zone de vie : à 10,5 du bord au moins (les poissons évitent la rive).
        const angle = Math.atan2(z - CZ, x - CX);
        let dBord = rayonEtang(angle) - Math.hypot(x - CX, z - CZ);
        let versLeau = { x: -Math.cos(angle), z: -Math.sin(angle) };   // direction qui éloigne de la berge : le long du rayon (étang)
        if (monde.forme && monde.forme !== FORME_DEFAUT) {
            // Canal, lac, rivière : la distance à la berge se mesure à la VRAIE rive (le point le plus proche du
            // contour), et la zone de vie s'en éloigne dans cette direction, pas le long du rayon.
            let plusProche = Infinity;
            for (let k = 0; k < 720; k++) {
                const a = (k / 720) * Math.PI * 2;
                const r = rayonEtang(a);
                const dx = CX + Math.cos(a) * r - x;
                const dz = CZ + Math.sin(a) * r - z;
                const dist = Math.hypot(dx, dz);
                if (dist < plusProche) { plusProche = dist; versLeau = { x: -dx / (dist || 1), z: -dz / (dist || 1) }; }
            }
            dBord = plusProche;
        }
        const recul = Math.max(0, 10.5 * Math.min(1, ECH) - dBord);
        liste.push({
            id: spec.type + '-' + index, type: spec.type, nom: type.nom, x: x, z: z, rayon: rayon,
            angle: angle, axe: place.pose.angle, racine: { x: place.pose.x, z: place.pose.z }, cercles: place.cercles, groupe: groupe,
            profil: type.accroche ? ACCROCHAGES[type.accroche] : null,
            barque: type.barque, bloqueLancer: type.bloqueLancer,
            attire: { especes: type.especes.slice(), rayon: ATTIRE_RAYON,
                centre: { x: x + versLeau.x * recul, z: z + versLeau.z * recul } }
        });
    }

    const parEspece = {};
    // Le ponton est aussi un POSTE de pêche : choisi sur la carte (angle dans `demi` de l'axe), le
    // pêcheur se place sur le plancher, à 10,5 unités de la berge, et la girouette est rangée.
    let pontonPoste = null;

    // Pose (ou REPOSE) tous les obstacles dans le contour ACTUEL. Les tailles ne changent pas : seules les distances
    // au bord et les zones libres autour des postes suivent l'échelle. Un obstacle qui ne trouve aucune place libre
    // est omis. Les listes (`liste`, `postesRef`) sont refaites EN PLACE : leurs lecteurs gardent la référence.
    function reposer() {
        liste.forEach(function (o) {
            scene.remove(o.groupe);
            o.groupe.traverse(function (n) { if (n.geometry && n.geometry.dispose) { n.geometry.dispose(); } });
        });
        liste.length = 0;
        CX = POND_CENTER.x;
        CZ = POND_CENTER.z;
        ECH = monde.echelle;
        calculerPostesRef();
        SPECS.forEach(construire);
        Object.keys(parEspece).forEach(function (id) { delete parEspece[id]; });
        liste.forEach(function (o) {
            o.attire.especes.forEach(function (id) { (parEspece[id] = parEspece[id] || []).push(o); });
        });
        const ponton = liste.find(function (o) { return o.type === 'ponton'; });
        pontonPoste = ponton ? { axe: ponton.axe, demi: 0.05, marge: -10.5, hauteur: 0.67, id: ponton.id } : null;
        if (ponton && monde.forme && monde.forme !== FORME_DEFAUT) {
            // Le ponton suit la normale de la berge, pas le rayon : le poste est le point du plancher à 10,5 unités de
            // la berge, repéré par son angle polaire et sa distance au contour LOCAL (c'est ainsi que se place le pêcheur).
            const qx = ponton.racine.x - Math.cos(ponton.axe) * 10.5;
            const qz = ponton.racine.z - Math.sin(ponton.axe) * 10.5;
            const axePoste = Math.atan2(qz - CZ, qx - CX);
            pontonPoste.axe = axePoste;
            pontonPoste.marge = Math.hypot(qx - CX, qz - CZ) - rayonEtang(axePoste);
        }
    }
    reposer();

    // --- Requêtes de jeu ----------------------------------------------------------------------
    // Obstacle qui coince un hameçon tombé en `point` (null si l'eau est libre).
    function accrocheEn(point) {
        for (let i = 0; i < liste.length; i++) {
            const o = liste[i];
            if (!o.profil) { continue; }
            for (let j = 0; j < o.cercles.length; j++) {
                const c = o.cercles[j];
                if (Math.hypot(point.x - c.x, point.z - c.z) < c.r + MARGE_ACCROCHE) { return o; }
            }
        }
        return null;
    }

    // Obstacle sur lequel le lancer retombe (pas dans l'eau : refusé).
    function lancerBloque(point) {
        for (let i = 0; i < liste.length; i++) {
            const o = liste[i];
            if (!o.bloqueLancer) { continue; }
            for (let j = 0; j < o.cercles.length; j++) {
                const c = o.cercles[j];
                if (Math.hypot(point.x - c.x, point.z - c.z) < c.r) { return o; }
            }
        }
        return null;
    }

    // La barque (cercle de rayon RAYON_BARQUE en x, z) touche-t-elle un obstacle ?
    // Renvoie { obstacle, effet } ('arret' l'emporte sur 'ralenti'), ou null.
    function heurtBarque(x, z, rayon) {
        const rb = rayon === undefined ? RAYON_BARQUE : rayon;
        let trouve = null;
        for (let i = 0; i < liste.length; i++) {
            const o = liste[i];
            if (!o.barque) { continue; }
            for (let j = 0; j < o.cercles.length; j++) {
                const c = o.cercles[j];
                if (c.barque === false || Math.hypot(x - c.x, z - c.z) >= c.r + rb) { continue; }
                if (o.barque === 'arret') { return { obstacle: o, effet: 'arret' }; }
                trouve = { obstacle: o, effet: o.barque };
            }
        }
        return trouve;
    }

    // --- Attraction : la zone de vie des poissons se déplace sur l'obstacle ------------------
    // Générateur local : l'attraction ne décale pas le hasard du monde. Un banc entier choisit
    // le même obstacle ; les obstacles d'une espèce sont servis à tour de rôle.
    const hasardAttire = creerHasard(4242);
    const tours = {};
    const stats = { poissons: 0, parObstacle: {} };

    function choisirObstacle(especeId, garanti) {
        const cibles = parEspece[especeId];
        if (!cibles || (!garanti && hasardAttire() >= PROBA_ATTIRANCE)) { return null; }
        tours[especeId] = ((tours[especeId] === undefined ? -1 : tours[especeId]) + 1) % cibles.length;
        return cibles[tours[especeId]];
    }

    // Au peuplement (plusieurs poissons), le premier banc ou poisson de chaque espèce est TOUJOURS
    // attiré : toute espèce qui a un obstacle en a au moins un. Les suivants le sont une fois sur deux.
    function attirer(poissons) {
        const groupes = {};
        const vues = {};
        poissons.forEach(function (fish) {
            const d = fish.userData;
            if (!parEspece[d.especeId] || d.hooked) { return; }
            let choix = d.groupeId !== undefined ? groupes[d.groupeId] : undefined;
            if (choix === undefined) {
                const obstacle = choisirObstacle(d.especeId, poissons.length > 1 && !vues[d.especeId]);
                vues[d.especeId] = true;
                const a = hasardAttire() * Math.PI * 2;
                const r = hasardAttire() * 2.5;
                choix = obstacle ? { obstacle: obstacle, x: obstacle.attire.centre.x + Math.cos(a) * r,
                    z: obstacle.attire.centre.z + Math.sin(a) * r } : null;
                if (d.groupeId !== undefined) { groupes[d.groupeId] = choix; }
            }
            if (!choix) { return; }
            const a = hasardAttire() * Math.PI * 2;
            const r = hasardAttire() * (d.groupeId !== undefined ? 2.2 : 0.1);
            fish.position.x = choix.x + Math.cos(a) * r;
            fish.position.z = choix.z + Math.sin(a) * r;
            d.homeX = choix.x;
            d.homeZ = choix.z;
            d.obstacleId = choix.obstacle.id;
            const fond = fondY(fish.position.x, fish.position.z);
            d.depth = d.couche === 'fond' ? fond + 0.45 : Math.max(d.depth, fond + 0.35);
            fish.position.y = d.depth - d.topOffset;
            stats.poissons++;
            stats.parObstacle[choix.obstacle.id] = (stats.parObstacle[choix.obstacle.id] || 0) + 1;
        });
        return stats.poissons;
    }

    return {
        liste: liste, get pontonPoste() { return pontonPoste; }, TYPES: TYPES, ACCROCHAGES: ACCROCHAGES, RAYON_BARQUE: RAYON_BARQUE,
        postesRef: postesRef, stats: stats, get nenupharsDepart() { return padsInitiaux; }, empreinte: function () { return signature(liste); },
        // Taille d'étang changée : repose tout dans le nouveau contour (décor et nénuphars déjà refaits).
        reconstruire: function () {
            padsInitiaux = lilyPads.map(function (p) { return { x: p.x, z: p.z, radius: p.radius }; });
            reposer();
            return liste;
        },
        // Rejoue le placement dans une scène jetable : deux exécutions doivent donner la même liste.
        refaire: function () {
            return creerObstacles(Object.assign({}, deps, { scene: new THREE.Group(), lilyPads: padsInitiaux }));
        },
        accrocheEn: accrocheEn, lancerBloque: lancerBloque, heurtBarque: heurtBarque, attirer: attirer
    };
}

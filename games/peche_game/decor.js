// ---------------------------------------------------------------------------
// decor.js — DÉCOR FIXE DE L'ÉTANG : arbres, roseaux, rochers, nénuphars.
//
// Module extrait de script.js (découpage v141) : il ne connaît RIEN du jeu
// (pas de pêcheur, pas de poissons, pas de bouchon). Il reçoit la scène et les
// quelques fonctions du monde dont il a besoin, et ne rend qu'une chose :
// la liste des nénuphars, qui sert aux accrochages et à la carte du carnet.
//
// Contrat (voir docs/modules.md) : aucun accès aux variables globales de
// script.js, aucune dépendance à `window`, donc testable sans navigateur.
//
// BIOTOPES (milieux.js) : le décor se construit pour un biotope (comptes d'arbres, nénuphars, roseaux et
// rochers, style de la couronne d'arbres). Le monde naît en « plaine » avec le `rand()` du jeu ; un autre
// biotope est posé par `appliquerMilieu` avec un générateur LOCAL à graine fixe (graine du monde + biotope) :
// toujours le même décor pour la même graine, sans toucher au hasard du monde. Les tableaux exposés
// (lilyPads, arbres, rochers, roseaux) sont remplis EN PLACE : leurs lecteurs gardent la bonne référence.
//
// Important : le décor consomme `rand()` dans un ordre PRÉCIS. On l'appelle
// exactement à la place de l'ancien bloc (même séquence de tirages), sinon tout
// le reste du monde (poissons, nénuphars, rochers) se décale et les tests de
// reproductibilité tombent.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { creerVegetation } from './vegetation.js?v=238';
import { MILIEUX, MILIEU_DEFAUT, densitesDecor, styleDecor } from './milieux.js?v=238';

export function creerDecor(deps) {
    const scene = deps.scene;
    const chargerTexture = deps.chargerTexture;
    const rand = deps.rand;
    const rayonEtang = deps.rayonEtang;
    const POND_CENTER = deps.POND_CENTER;
    const RIVE_Y = deps.RIVE_Y;

    // -----------------------------------------------------------------------
    // TEXTURES RÉELLES, chargées en LOCAL depuis assets/ (aucun CDN) :
    //   ecorce.jpg        -> écorces des arbres      (ambientCG Bark006, CC0)
    //   eau-normales.jpg  -> ridules de l'eau        (three.js waternormals, MIT)
    //   sol-herbe.jpg     -> herbe                   (ambientCG Grass004, CC0)
    //   vase.jpg          -> fond vaseux             (ambientCG Ground054, CC0)
    // -----------------------------------------------------------------------
    const trunkMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1,
        map: chargerTexture('ecorce.jpg', 2, 1)
    });

    // Aiguilles de sapin GÉNÉRÉES (aucun fichier) : fond vert sombre + petits
    // traits d'aiguilles clairs/foncés, tuilés 3x sur les cônes. Si le canvas
    // n'est pas disponible (tests), on garde simplement le vert uni.
    function makeNeedlesTexture() {
        try {
            const c = document.createElement('canvas');
            c.width = 128;
            c.height = 128;
            const g = c.getContext('2d');
            if (!g) { return null; }
            g.fillStyle = '#2c5738';
            g.fillRect(0, 0, 128, 128);
            for (let i = 0; i < 700; i++) {
                const x = (i * 37) % 128;
                const y = (i * 53) % 128;
                const t = 45 + ((i * 17) % 45);
                g.strokeStyle = 'rgb(' + Math.round(t * 0.55) + ',' + t + ','
                    + Math.round(t * 0.65) + ')';
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(x + 3, y - 6);
                g.stroke();
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(3, 3);
            return tex;
        } catch (erreur) {
            return null;
        }
    }

    const foliageMap = makeNeedlesTexture();
    const foliageMat = new THREE.MeshStandardMaterial({
        color: foliageMap ? 0xffffff : 0x3f7a4a,
        roughness: 1,
        map: foliageMap
    });

    // Objets temporaires réutilisés pour composer les matrices d'instances
    // (aucune allocation dans les boucles).
    const _mat4 = new THREE.Matrix4();
    const _quat = new THREE.Quaternion();
    const _vec = new THREE.Vector3();
    const _scl = new THREE.Vector3();
    const _euler = new THREE.Euler();
    const UNIT_Z = new THREE.Vector3(0, 0, 1);

    // --- Arbres, nénuphars, roseaux, rochers : capacités = le maximum de tous les biotopes ; les
    // comptes réels viennent du biotope (densitesDecor). Un appel de dessin par groupe instancié.
    // v173 : étang de rayon 90 (périmètre × 1,6, surface × 2,8) → décor étoffé pour que la berge
    // ne paraisse pas nue : plaine = 64 arbres, 70 roseaux, 24 rochers, 40 nénuphars.
    const CAPACITE = MILIEUX.reduce(function (m, milieu) {
        const d = densitesDecor(milieu);
        return { arbres: Math.max(m.arbres, d.arbres), roseaux: Math.max(m.roseaux, d.roseaux), rochers: Math.max(m.rochers, d.rochers) };
    }, { arbres: 1, roseaux: 1, rochers: 1 });
    const trunkInst = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.3, 0.45, 3, 6), trunkMat, CAPACITE.arbres
    );
    const foliageInst = new THREE.InstancedMesh(
        new THREE.ConeGeometry(1, 1, 8), foliageMat, CAPACITE.arbres * 3
    );
    trunkInst.castShadow = true;
    foliageInst.castShadow = true;
    scene.add(trunkInst);
    scene.add(foliageInst);
    let trunkCount = 0;
    let foliageCount = 0;
    // Positions du décor exposées à obstacles.js (aucun tirage de plus : simples copies).
    const arbres = [];
    const rochers = [];
    const roseaux = [];
    const lilyPads = [];     // la SEULE sortie dont dépendent accrochages et carte du carnet

    function addTree(x, z, scale) {
        arbres.push({ x: x, z: z, r: 1.2 * scale });
        _vec.set(x, 1.5 * scale + RIVE_Y, z);
        _scl.set(scale, scale, scale);
        _quat.identity();
        _mat4.compose(_vec, _quat, _scl);
        trunkInst.setMatrixAt(trunkCount++, _mat4);
        // Feuillage : 3 cônes empilés (géométrie unitaire mise à l'échelle).
        for (let i = 0; i < 3; i++) {
            const r = (2.4 - i * 0.55) * scale;
            const h = (2.6 - i * 0.4) * scale;
            _vec.set(x, (3 + i * 1.5) * scale + RIVE_Y, z);
            _scl.set(r, h, r);
            _mat4.compose(_vec, _quat, _scl);
            foliageInst.setMatrixAt(foliageCount++, _mat4);
        }
    }

    const lilyMat = new THREE.MeshStandardMaterial({
        color: 0x3f7d4a, roughness: 0.8, side: THREE.DoubleSide
    });
    const padMeshes = [];
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x2f6b3f, roughness: 0.9 });
    const reedGeo = new THREE.CylinderGeometry(0.02, 0.035, 1, 5);
    reedGeo.translate(0, 0.5, 0);
    const reedInst = new THREE.InstancedMesh(reedGeo, reedMat, CAPACITE.roseaux);
    scene.add(reedInst);
    // Roseaux et herbe des berges ondulent au vent (shader, vegetation.js ; aucun tirage de rand()).
    const vegetation = creerVegetation({ scene, wind: deps.wind, roseauxMat: reedMat, rayonEtang, POND_CENTER, RIVE_Y });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 1 });
    const rockInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMat, CAPACITE.rochers);
    rockInst.castShadow = true;
    scene.add(rockInst);

    // Pose tout le décor d'un biotope. `tirage` : le `rand()` du jeu (monde d'origine) ou un générateur
    // local. `evite(x, z, r)` : vrai si un obstacle occupe la place (seulement à la reconstruction).
    // ⚠ L'ORDRE des tirages est celui d'origine (arbres, nénuphars, roseaux, rochers) : en plaine, le
    // monde reste identique au pixel près.
    function peupler(milieu, tirage, evite) {
        const d = densitesDecor(milieu);
        const style = styleDecor(milieu);
        const occupe = function (x, z, r) { return !!evite && evite(x, z, r); };
        // Arbres : derrière la rive LOCALE (le contour n'est pas un cercle), sur une bande propre au biotope.
        arbres.length = 0;
        trunkCount = 0;
        foliageCount = 0;
        for (let i = 0; i < d.arbres; i++) {
            const angle = (i / d.arbres) * Math.PI * 2 + tirage() * 0.1;
            const radius = rayonEtang(angle) + style.bandeArbres[0] + tirage() * style.bandeArbres[1];
            const x = POND_CENTER.x + Math.cos(angle) * radius;
            const z = POND_CENTER.z + Math.sin(angle) * radius;
            // Laisse dégagé l'espace devant la caméra et le pêcheur.
            if (z > 5 && Math.abs(x) < 30) {
                continue;
            }
            // Ni dans l'eau : un sapin au milieu de l'étang, c'était très moche !
            if (Math.hypot(x - POND_CENTER.x, z - POND_CENTER.z) < rayonEtang(angle) + 4) {
                continue;
            }
            const echelle = style.echelleArbres[0] + tirage() * style.echelleArbres[1];
            if (occupe(x, z, 1.2 * echelle)) { continue; }
            addTree(x, z, echelle);
        }
        trunkInst.count = trunkCount;
        foliageInst.count = foliageCount;
        trunkInst.instanceMatrix.needsUpdate = true;
        foliageInst.instanceMatrix.needsUpdate = true;

        // Nénuphars : DANS l'eau, à distance du bord local. La racine carrée répartit les nénuphars à
        // densité égale sur toute la surface (un tirage linéaire les entassait au milieu, v173).
        padMeshes.forEach(function (pad) { scene.remove(pad); pad.geometry.dispose(); });
        padMeshes.length = 0;
        lilyPads.length = 0;
        for (let i = 0; i < d.nenuphars; i++) {
            const radius = 0.25 + tirage() * 0.45;   // 12 à 35 cm de rayon
            const angle = tirage() * Math.PI * 2;
            const r = Math.sqrt(tirage()) * Math.max(1, rayonEtang(angle) - 12);
            const x = POND_CENTER.x + Math.cos(angle) * r;
            const z = POND_CENTER.z + Math.sin(angle) * r;
            if (occupe(x, z, radius)) { continue; }
            const pad = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), lilyMat);
            pad.rotation.x = -Math.PI / 2;
            pad.position.set(x, 0.06, z);
            scene.add(pad);
            padMeshes.push(pad);
            lilyPads.push({ x: pad.position.x, z: pad.position.z, radius: radius });
        }

        // Roseaux (instanciés) : pivot à la base pour qu'ils se balancent au vent (vegetation.js).
        roseaux.length = 0;
        let reedCount = 0;
        for (let i = 0; i < d.roseaux; i++) {
            const angle = tirage() * Math.PI * 2;
            // Les roseaux poussent DANS l'eau, le long du contour généré.
            const r = rayonEtang(angle) - 1 - tirage() * 5;
            const x = POND_CENTER.x + Math.cos(angle) * r;
            const z = POND_CENTER.z + Math.sin(angle) * r;
            const h = 2 + tirage() * 2.5;
            const rotZ = (tirage() - 0.5) * 0.25;
            if (occupe(x, z, 0.3)) { continue; }
            _vec.set(x, 0, z);
            _quat.setFromAxisAngle(UNIT_Z, rotZ);
            _scl.set(1, h, 1);
            _mat4.compose(_vec, _quat, _scl);
            reedInst.setMatrixAt(reedCount++, _mat4);
            roseaux.push({ x: x, z: z });
        }
        reedInst.count = reedCount;
        reedInst.instanceMatrix.needsUpdate = true;
        // L'herbe des berges suit le décor du biotope (arbres et roseaux).
        vegetation.regler(d.herbe);

        // Rochers (instanciés) : sur la berge, derrière le bord local.
        rochers.length = 0;
        let rockCount = 0;
        for (let i = 0; i < d.rochers; i++) {
            const angle = tirage() * Math.PI * 2;
            const r = rayonEtang(angle) + 3 + tirage() * 12;
            const s = style.echelleRochers[0] + tirage() * style.echelleRochers[1];
            _vec.set(POND_CENTER.x + Math.cos(angle) * r, RIVE_Y + 0.15,
                POND_CENTER.z + Math.sin(angle) * r);
            _euler.set(tirage(), tirage(), tirage());
            if (occupe(_vec.x, _vec.z, s)) { continue; }
            _quat.setFromEuler(_euler);
            _scl.set(s, s, s);
            _mat4.compose(_vec, _quat, _scl);
            rockInst.setMatrixAt(rockCount++, _mat4);
            rochers.push({ x: _vec.x, z: _vec.z, r: s });
        }
        rockInst.count = rockCount;
        rockInst.instanceMatrix.needsUpdate = true;
    }

    // Monde d'origine : la plaine, avec le `rand()` du jeu (ordre des tirages inchangé). Les tirages sont
    // mémorisés : revenir en plaine REJOUE exactement le décor d'origine (même graine, même plaine).
    const tiragesPlaine = [];
    peupler(MILIEU_DEFAUT, function () { const v = rand(); tiragesPlaine.push(v); return v; }, null);

    // Générateur local (mulberry32) : graine du monde + empreinte du biotope.
    function hasardDe(milieu) {
        let s = ((deps.graine || 0) >>> 0);
        for (let i = 0; i < milieu.id.length; i++) { s = (Math.imul(s, 31) + milieu.id.charCodeAt(i)) >>> 0; }
        return function () {
            s = (s + 0x6d2b79f5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Change de biotope : décor reconstruit (même graine, même biotope → même décor). `obstacles` (liste de
    // obstacles.js) : on ne pose ni arbre, ni nénuphar, ni roseau, ni rocher sur un obstacle déjà en place.
    function appliquerMilieu(milieu, obstacles) {
        if (milieu.id === MILIEU_DEFAUT) {
            let k = 0;
            peupler(milieu, function () { return tiragesPlaine[k++]; }, null);
            return;
        }
        const cercles = [];
        (obstacles || []).forEach(function (o) { (o.cercles || []).forEach(function (c) { cercles.push(c); }); });
        const evite = cercles.length ? function (x, z, r) {
            return cercles.some(function (c) { return Math.hypot(c.x - x, c.z - z) < c.r + r + 0.5; });
        } : null;
        peupler(milieu, hasardDe(milieu), evite);
    }

    return { lilyPads: lilyPads, arbres: arbres, rochers: rochers, roseaux: roseaux, vegetation: vegetation,
        appliquerMilieu: appliquerMilieu };
}

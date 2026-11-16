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
// Important : le décor consomme `rand()` dans un ordre PRÉCIS. On l'appelle
// exactement à la place de l'ancien bloc (même séquence de tirages), sinon tout
// le reste du monde (poissons, nénuphars, rochers) se décale et les tests de
// reproductibilité tombent.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { creerVegetation } from './vegetation.js?v=221';

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

    // --- Arbres : un appel de dessin pour les troncs, un autre pour le feuillage.
    // v173 : étang de rayon 90 (périmètre × 1,6, surface × 2,8) → décor étoffé pour que
    // la berge ne paraisse pas nue : 64 arbres, 70 roseaux, 24 rochers, 40 nénuphars.
    const TREE_MAX = 64;
    const trunkInst = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.3, 0.45, 3, 6), trunkMat, TREE_MAX
    );
    const foliageInst = new THREE.InstancedMesh(
        new THREE.ConeGeometry(1, 1, 8), foliageMat, TREE_MAX * 3
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

    for (let i = 0; i < TREE_MAX; i++) {
        const angle = (i / TREE_MAX) * Math.PI * 2 + rand() * 0.1;
        // Les arbres poussent DERRIÈRE la rive LOCALE (le contour n'est pas un cercle),
        // sur une bande de 8 à 53 unités (35 avant l'agrandissement de l'étang).
        const radius = rayonEtang(angle) + 8 + rand() * 45;
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
        addTree(x, z, 0.8 + rand() * 0.7);
    }
    trunkInst.count = trunkCount;
    foliageInst.count = foliageCount;
    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;

    // --- Nénuphars : la SEULE sortie du module (accrochage + carte du carnet).
    const lilyPads = [];
    const NENUPHARS = 40;   // 14 sur 0,23 ha → ≈ 40 sur 0,64 ha (même densité)
    const lilyMat = new THREE.MeshStandardMaterial({
        color: 0x3f7d4a, roughness: 0.8, side: THREE.DoubleSide
    });
    for (let i = 0; i < NENUPHARS; i++) {
        const radius = 0.25 + rand() * 0.45;   // 12 à 35 cm de rayon
        const pad = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), lilyMat);
        pad.rotation.x = -Math.PI / 2;
        const angle = rand() * Math.PI * 2;
        // Les nénuphars restent DANS l'eau, à distance du bord local. La racine carrée
        // répartit les nénuphars à densité égale sur toute la surface : avec un tirage
        // linéaire du rayon, ils s'entassaient au milieu du grand étang (v173).
        const r = Math.sqrt(rand()) * Math.max(1, rayonEtang(angle) - 12);
        pad.position.set(POND_CENTER.x + Math.cos(angle) * r, 0.06,
            POND_CENTER.z + Math.sin(angle) * r);
        scene.add(pad);
        lilyPads.push({ x: pad.position.x, z: pad.position.z, radius: radius });
    }

    // --- Roseaux (instanciés : un seul appel de dessin). Pivot à la base pour
    // qu'ils puissent se balancer au vent (shader de vent : vegetation.js).
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x2f6b3f, roughness: 0.9 });
    const reedGeo = new THREE.CylinderGeometry(0.02, 0.035, 1, 5);
    reedGeo.translate(0, 0.5, 0);
    const ROSEAUX = 70;   // 40 pour un périmètre de 345 → 70 pour ≈ 570
    const reedInst = new THREE.InstancedMesh(reedGeo, reedMat, ROSEAUX);
    let reedCount = 0;
    for (let i = 0; i < ROSEAUX; i++) {
        const angle = rand() * Math.PI * 2;
        // Les roseaux poussent DANS l'eau, le long du contour généré.
        const r = rayonEtang(angle) - 1 - rand() * 5;
        const x = POND_CENTER.x + Math.cos(angle) * r;
        const z = POND_CENTER.z + Math.sin(angle) * r;
        const h = 2 + rand() * 2.5;
        const rotZ = (rand() - 0.5) * 0.25;
        _vec.set(x, 0, z);
        _quat.setFromAxisAngle(UNIT_Z, rotZ);
        _scl.set(1, h, 1);
        _mat4.compose(_vec, _quat, _scl);
        reedInst.setMatrixAt(reedCount++, _mat4);
        roseaux.push({ x: x, z: z });
    }
    reedInst.count = reedCount;
    reedInst.instanceMatrix.needsUpdate = true;
    scene.add(reedInst);
    // Roseaux et herbe des berges ondulent au vent (shader, vegetation.js ; aucun tirage de rand()).
    const vegetation = creerVegetation({ scene, wind: deps.wind, roseauxMat: reedMat, rayonEtang, POND_CENTER, RIVE_Y });

    // --- Rochers (instanciés).
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 1 });
    const ROCHERS = 24;
    const rockInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMat, ROCHERS);
    rockInst.castShadow = true;
    for (let i = 0; i < ROCHERS; i++) {
        const angle = rand() * Math.PI * 2;
        // Les rochers restent sur la berge, derrière le bord local.
        const r = rayonEtang(angle) + 3 + rand() * 12;
        const s = 0.6 + rand() * 1.3;
        _vec.set(POND_CENTER.x + Math.cos(angle) * r, RIVE_Y + 0.15,
            POND_CENTER.z + Math.sin(angle) * r);
        _euler.set(rand(), rand(), rand());
        _quat.setFromEuler(_euler);
        _scl.set(s, s, s);
        _mat4.compose(_vec, _quat, _scl);
        rockInst.setMatrixAt(i, _mat4);
        rochers.push({ x: _vec.x, z: _vec.z, r: s });
    }
    rockInst.instanceMatrix.needsUpdate = true;
    scene.add(rockInst);

    return { lilyPads: lilyPads, arbres: arbres, rochers: rochers, roseaux: roseaux, vegetation: vegetation };
}

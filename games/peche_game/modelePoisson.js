// ---------------------------------------------------------------------------
// modelePoisson.js — FABRIQUE 3D d'un poisson : silhouette, nageoires, queue,
// yeux et barbillons, à partir des données de `especes.js`.
//
// Extraite de `poissons.js` (v195) pour être PARTAGÉE par le jeu et par la page
// de vérification des tailles (`tailles.html`) : une seule source du modèle,
// donc la page montre exactement le poisson que l'étang affiche.
//
// Module pur : il ne connaît ni l'étang, ni le hasard du monde, ni l'état du
// jeu. Seule exception au contrat : la texture des motifs est dessinée sur un
// canvas 2D (`document.createElement`), comme avant l'extraction.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { FORMES, FORMES_PAR_TYPE } from './especes.js?v=195';

// Échelle 3D d'un poisson mesurant `longueurCm` centimètres.
// 2 unités de jeu ≈ 1 m : 50 cm = 1 unité. Le plancher 0,08 évite qu'un
// juvénile minuscule disparaisse sous la résolution de l'étang.
export function echellePourTaille(longueurCm, form) {
    const forme = FORMES[form] || FORMES[FORMES_PAR_TYPE[form]] || FORMES.fusiforme;
    return Math.max(0.08, (longueurCm / 50) / forme.longueurRef);
}

// Motifs d'écailles : textures dessinées une seule fois, puis partagées.
// (Uniquement fillRect + fillStyle : compatible partout.)
const _texturesMotif = {};

export function textureMotif(motif) {
    if (_texturesMotif[motif]) {
        return _texturesMotif[motif];
    }
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 64);
    if (motif === 'rayures') {                 // barres verticales (perche)
        g.fillStyle = 'rgba(35,50,25,0.55)';
        for (let i = 0; i < 5; i++) {
            g.fillRect(i * 13 + 3, 0, 6, 64);
        }
    } else if (motif === 'barres') {           // barres fines (sandre)
        g.fillStyle = 'rgba(40,50,40,0.45)';
        for (let i = 0; i < 7; i++) {
            g.fillRect(i * 9 + 2, 0, 3, 64);
        }
    } else if (motif === 'bandeLaterale') {    // bande sombre (black-bass)
        g.fillStyle = 'rgba(30,45,25,0.5)';
        g.fillRect(0, 26, 64, 10);
    } else if (motif === 'ecailles') {         // écailles (carpe, brème)
        g.fillStyle = 'rgba(120,90,40,0.30)';
        for (let y = 0; y < 8; y++) {
            for (let x = -1; x <= 8; x++) {
                const center = x * 8 + (y % 2) * 4;
                g.beginPath();
                g.arc(center, y * 8, 4.8, 0.15 * Math.PI, 0.85 * Math.PI);
                g.strokeStyle = 'rgba(75,57,27,0.43)';
                g.stroke();
            }
        }
    } else if (motif === 'mouchetures') {      // taches fines (tanche)
        g.fillStyle = 'rgba(25,40,20,0.5)';
        for (let i = 0; i < 40; i++) {
            g.fillRect((i * 17) % 64, (i * 29) % 64, 3, 2);
        }
    } else if (motif === 'taches') {           // petites taches (goujon)
        g.fillStyle = 'rgba(80,60,30,0.4)';
        for (let i = 0; i < 28; i++) {
            g.fillRect((i * 13) % 64, (i * 23) % 64, 4, 3);
        }
    } else if (motif === 'tachesClaires') {    // taches claires (brochet)
        g.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 34; i++) {
            g.fillRect((i * 11) % 64, (i * 19) % 64, 7, 4);
        }
    } else if (motif === 'pointsRouges') {     // mouchetures + points rouges (truite)
        g.fillStyle = 'rgba(60,40,25,0.5)';
        for (let i = 0; i < 30; i++) {
            g.fillRect((i * 7) % 64, (i * 17) % 64, 3, 3);
        }
        g.fillStyle = 'rgba(190,70,50,0.6)';
        for (let i = 0; i < 10; i++) {
            g.fillRect((i * 23 + 5) % 64, (i * 31 + 9) % 64, 4, 4);
        }
    } else if (motif === 'marbrures') {        // grandes marbrures (silure)
        g.fillStyle = 'rgba(20,25,20,0.45)';
        for (let i = 0; i < 16; i++) {
            g.fillRect((i * 19) % 56, (i * 27) % 56, 14, 11);
        }
    }
    // Léger ombrage « dos plus sombre / ventre plus clair ».
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.fillRect(0, 0, 64, 10);
    g.fillStyle = 'rgba(255,255,255,0.20)';
    g.fillRect(0, 54, 64, 10);
    _texturesMotif[motif] = new THREE.CanvasTexture(canvas);
    return _texturesMotif[motif];
}

// Une membrane suit le contour de la nageoire ; sa courbure et son dégradé
// restent visibles de profil et quand le poisson est ramené vers la caméra.
function makeFin(outline, width, height, curve, material) {
    const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    const geometry = new THREE.ShapeGeometry(shape);
    const positions = geometry.getAttribute('position');
    const colors = [];
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        positions.setXYZ(i, x * width, y * height, Math.abs(y) * curve);
        const tint = 0.82 - 0.26 * Math.abs(y);
        colors.push(tint, tint, tint);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
}

const TAIL_OUTLINE = {
    fine: [[0.14, 0], [0, 0.24], [-0.28, 0.22], [-0.74, 0.11], [-1, 0],
        [-0.74, -0.11], [-0.28, -0.22], [0, -0.24]],
    arrondie: [[0.13, 0], [0, 0.20], [-0.45, 0.48], [-0.78, 0.48], [-0.96, 0.29],
        [-1, 0], [-0.96, -0.29], [-0.78, -0.48], [-0.45, -0.48], [0, -0.20]],
    fourche: [[0.14, 0], [0, 0.17], [-0.32, 0.27], [-0.64, 0.48], [-1, 0.60],
        [-0.86, 0.36], [-0.56, 0.08], [-0.53, 0], [-0.61, -0.15],
        [-0.88, -0.40], [-0.97, -0.55], [-0.63, -0.43], [-0.31, -0.25], [0, -0.17]]
};
const FIN_DORSAL = {
    longue: [[0.52, 0], [0.30, 0.86], [0.12, 1], [-0.03, 0.68], [-0.2, 0.47],
        [-0.43, 0.33], [-0.7, 0.25], [-1, 0]],
    epineuse: [[0.52, 0], [0.40, 0.36], [0.29, 0.63], [0.18, 0.58], [0.13, 0.86],
        [0.02, 0.75], [-0.06, 1], [-0.16, 0.82], [-0.26, 0.92], [-0.36, 0.64],
        [-0.46, 0.72], [-0.61, 0.47], [-0.74, 0.45], [-1, 0]],
    souple: [[0.52, 0], [0.22, 0.75], [-0.10, 1], [-0.43, 0.88], [-0.63, 0.56], [-1, 0]]
};
const FIN_PECTORALE = [[0.15, 0], [0.05, 0.28], [-0.34, 0.17], [-0.70, -0.10],
    [-1, -0.34], [-0.80, -0.44], [-0.40, -0.34], [0, -0.11]];

// Fabrique 3D d'un poisson.
//   size       : échelle du groupe (voir echellePourTaille)
//   power      : combativité (0,4 → 1,6) : rougit un poisson combatif
//   aggression : agressivité (0,5 → 1,6) : taille de la queue et des nageoires
//   form       : silhouette (clé de FORMES ; un ancien « type » numérique est accepté)
//   espece     : données de l'espèce (couleur, motif, nageoires, œil, id)
export function creerModelePoisson(size, power, aggression, form, espece) {
    const group = new THREE.Group();

    // Silhouette (compatibilité : un ancien « type » numérique est accepté).
    const forme = FORMES[form] || FORMES[FORMES_PAR_TYPE[form]] || FORMES.fusiforme;

    // Couleur = celle de l'espèce ; un poisson très combatif vire au rouge.
    const couleur = espece ? espece.couleur : 0xffb066;
    const baseColor = new THREE.Color(couleur);
    const t = Math.min(1, Math.max(0,
        ((power - 1.0) / 0.5) * 0.5 + ((aggression - 1.1) / 0.5) * 0.5));
    const bodyMat = new THREE.MeshStandardMaterial({
        color: baseColor.clone().lerp(new THREE.Color(0xd23a12), t * 0.7),
        map: textureMotif(espece ? espece.motif : 'aucun'),
        roughness: 0.37,
        metalness: 0.04,
        vertexColors: true
    });
    const finMat = new THREE.MeshStandardMaterial({
        color: (espece && espece.nageoires) ? espece.nageoires : couleur,
        roughness: 0.52,
        side: THREE.DoubleSide,
        vertexColors: true
    });

    const tailScale = 0.8 + (aggression - 0.6) * 0.5;
    const finScale = 0.6 + (aggression - 0.6) * 0.5;
    const bodyX = forme.bodyX;
    const bodyY = forme.bodyY;
    const bodyZ = forme.bodyZ;

    const bodyGeometry = new THREE.SphereGeometry(0.6, 24, 16);
    const bodyVertices = bodyGeometry.getAttribute('position');
    const carp = espece && espece.id === 'carpe';
    const pike = espece && espece.id === 'brochet';
    const bodyColors = [];
    for (let i = 0; i < bodyVertices.count; i++) {
        const x = bodyVertices.getX(i);
        const longitudinal = x / 0.6;
        const shoulder = 1 + 0.16 * longitudinal;
        const back = bodyVertices.getY(i);
        const snout = pike ? 0.10 : forme.queue === 'fine' ? 0.08 : 0.035;
        const head = Math.max(0, longitudinal) ** 3;
        const peduncle = Math.min(1, Math.max(0, (-longitudinal - 0.68) * 4));
        bodyVertices.setXYZ(i, x,
            back * (shoulder - peduncle * 0.14 - (pike ? head * 0.28 : 0))
                - snout * head
                + (carp ? 0.07 * Math.max(0, back / 0.6) * (1 - longitudinal ** 2) : 0),
            bodyVertices.getZ(i) * (shoulder - peduncle * 0.18));
        const light = THREE.MathUtils.clamp(0.78 - back * 0.35, 0.55, 1);
        bodyColors.push(light, light, light);
    }
    bodyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bodyColors, 3));
    bodyGeometry.computeVertexNormals();
    const fishBody = new THREE.Mesh(bodyGeometry, bodyMat);
    fishBody.scale.set(bodyX, bodyY, bodyZ);
    fishBody.castShadow = true;
    group.add(fishBody);

    const tailPivot = new THREE.Group();
    tailPivot.position.x = -0.59 * bodyX;
    const tailOutline = TAIL_OUTLINE[pike ? 'fourche' : forme.queue];
    const tail = makeFin(tailOutline, tailScale * (pike ? 1.16 : 1), tailScale, 0.04, finMat);
    tailPivot.add(tail);
    group.add(tailPivot);

    const finHeight = Math.max(0.15, forme.dorsale * 1.5) * finScale;
    if (forme.dorsale > 0) {
        const outline = carp ? FIN_DORSAL.longue : forme.epines ? FIN_DORSAL.epineuse : FIN_DORSAL.souple;
        const dorsal = makeFin(outline, bodyX * (carp ? 0.51 : 0.38), finHeight * 0.76, 0.025, finMat);
        dorsal.position.set(forme.dorsaleReculee ? -0.33 * bodyX : 0.04 * bodyX,
            (forme.dorsaleReculee ? 0.38 : 0.48) * bodyY, 0);
        group.add(dorsal);

        const anal = makeFin(FIN_DORSAL.souple, bodyX * 0.24, -finHeight * 0.42, -0.02, finMat);
        anal.position.set(-0.30 * bodyX, -0.38 * bodyY, 0);
        group.add(anal);
    }

    // Petits détails (nageoires pectorales, moustaches, yeux) : regroupés
    // pour pouvoir les cacher de loin (LOD).
    const details = new THREE.Group();
    group.add(details);

    for (const side of [-1, 1]) {
        const pectoral = makeFin(FIN_PECTORALE, 0.62 * finScale, 0.55 * finScale, side * 0.10, finMat);
        pectoral.position.set(0.22 * bodyX, -0.20 * bodyY, side * 0.46 * bodyZ);
        pectoral.rotation.y = side * 0.35;
        details.add(pectoral);
    }

    // Moustaches (silure, poisson-chat).
    if (forme.moustaches || carp) {
        for (let i = 0; i < 4; i++) {
            const cote = i < 2 ? 1 : -1;
            const moustache = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, carp ? 0.12 : 0.7, 4), bodyMat);
            moustache.rotation.z = Math.PI / 2 - cote * 0.25;
            moustache.rotation.y = (i % 2 === 0 ? 0.35 : -0.35);
            moustache.position.set((carp ? 0.58 : 0.62) * bodyX,
                carp ? -0.05 - (i % 2) * 0.03 : 0.02 - (i % 2) * 0.12, cote * 0.12);
            details.add(moustache);
        }
    }

    // Yeux (certaines espèces ont l'œil rouge, comme la tanche).
    const eyeMat = new THREE.MeshStandardMaterial({ color: (espece && espece.oeil) ? espece.oeil : 0x96713d });
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x0d100e, roughness: 0.16 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
    eye1.position.set(0.48 * bodyX, 0.18 * bodyY, 0.3 * bodyZ);
    details.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.z = -0.3 * bodyZ;
    details.add(eye2);

    const gillMaterial = new THREE.LineBasicMaterial({ color: baseColor.clone().multiplyScalar(0.45) });
    for (const side of [-1, 1]) {
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pupilMaterial);
        pupil.position.copy(eye1.position);
        pupil.position.z = (0.3 * bodyZ + 0.073) * side;
        details.add(pupil);
        const gillPoints = [];
        for (let segment = 0; segment <= 10; segment++) {
            const t = segment / 10;
            const x = 0.29 - Math.sin(Math.PI * t) * 0.08;
            const y = 0.42 - t * 0.77;
            const z = Math.sqrt(0.36 - x * x - y * y) * (1 + 0.16 * x / 0.6);
            gillPoints.push(new THREE.Vector3(x * bodyX, y * bodyY, (z * bodyZ + 0.013) * side));
        }
        details.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(gillPoints), gillMaterial));
    }

    group.userData.tailPivot = tailPivot;
    group.userData.bodyMat = bodyMat;
    group.userData.swimRest = bodyVertices.array.slice();
    group.userData.bodyMesh = fishBody;
    group.userData.couleurBase = baseColor;
    group.userData.especeData = espece || null;
    group.userData.details = details;
    // Hauteur du poisson au-dessus de son centre : sert à le garder sous l'eau.
    group.userData.topOffset = (0.6 * bodyY + finHeight) * size;
    group.scale.setScalar(size);
    group.userData.size = size;
    return group;
}

import * as THREE from 'three';
import { SoundEngine } from './sound.js';

const canvas = document.getElementById('gameCanvas');
const scoreDisplay = document.getElementById('score');
const fishButton = document.getElementById('fishButton');
const statusDisplay = document.getElementById('status');
const strugglePanel = document.getElementById('struggle');
const struggleMarker = document.getElementById('struggleMarker');
const struggleInfo = document.getElementById('struggleInfo');
const struggleHint = document.getElementById('struggleHint');
const struggleTimer = document.getElementById('struggleTimer');
const catchMessage = document.getElementById('catchMessage');
const biteView = document.getElementById('biteView');
const biteHint = document.getElementById('biteHint');
const windFill = document.getElementById('windFill');
const windArrow = document.getElementById('windArrow');
const soundToggle = document.getElementById('soundToggle');

const sound = new SoundEngine();

function ensureSound() {
    sound.init();
    sound.resume();
}

soundToggle.addEventListener('click', () => {
    ensureSound();
    sound.enabled = !sound.enabled;
    sound.setEnabled(sound.enabled);
    soundToggle.textContent = sound.enabled ? '🔊' : '🔇';
});

// Manivelle : on la fait tourner pour ramener la ligne.
const crank = document.getElementById('crank');
const crankRotor = document.getElementById('crankRotor');
let crankDragging = false;
let crankAngle = 0;
let crankLastAngle = 0;
let crankRotationDelta = 0;
let crankSoundAccum = 0;
let biteFromReel = false;

// ---------------------------------------------------------------------------
// Moulinet : conversion « tours de manivelle ↔ longueur de fil »
// ---------------------------------------------------------------------------
// Échelle du décor : ~2 unités du monde ≈ 1 m (le pêcheur mesure ~3,5 unités
// pour 1,8 m). Un moulinet réel ramène à peu près 1 m de fil par tour de
// manivelle : ici, un tour complet ramène donc REEL_PER_TURN unités de fil.
// Conséquence voulue : le nombre de tours nécessaires est proportionnel à la
// distance à ramener (un long lancer demande beaucoup plus de tours).
const REEL_PER_TURN = 2.0;
const TWO_PI = Math.PI * 2;
const CRANK_SOUND_PER_TURN = 0.5; // un « cliquet » sonore tous les demi-tours

// Le fil sorti correspond à la barre de tension : 0 = poisson au bord de la
// canne (barre à gauche), 1 = fil tendu au maximum, juste avant qu'il casse
// (barre à droite). Au ferrage, la longueur de fil vaut la distance du lancer.
const STRUGGLE_MIN_FACTOR = 0.4;
const STRUGGLE_MAX_FACTOR = 1.6;
const STRUGGLE_SPAN = STRUGGLE_MAX_FACTOR - STRUGGLE_MIN_FACTOR;

// Tours de manivelle effectués depuis le dernier appel (puis remis à zéro).
function consumeCrankTurns() {
    const turns = crankRotationDelta / TWO_PI;
    crankRotationDelta = 0;
    if (turns > 0) {
        crankSoundAccum += turns;
        while (crankSoundAccum >= CRANK_SOUND_PER_TURN) {
            crankSoundAccum -= CRANK_SOUND_PER_TURN;
            sound.reel();
        }
    }
    return turns;
}

function crankPointerAngle(event) {
    const rect = crank.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(event.clientY - cy, event.clientX - cx);
}

crank.addEventListener('pointerdown', event => {
    ensureSound();
    crankDragging = true;
    crankLastAngle = crankPointerAngle(event);
    crank.setPointerCapture(event.pointerId);
});

crank.addEventListener('pointermove', event => {
    if (!crankDragging) {
        return;
    }
    const angle = crankPointerAngle(event);
    let delta = angle - crankLastAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    crankRotationDelta += Math.abs(delta);
    crankAngle += delta;
    crankLastAngle = angle;
    crankRotor.style.transform = 'rotate(' + crankAngle + 'rad)';
});

crank.addEventListener('pointerup', () => {
    crankDragging = false;
});

crank.addEventListener('pointercancel', () => {
    crankDragging = false;
});

// ---------------------------------------------------------------------------
// Rendu / scène / caméra
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ea);
scene.fog = new THREE.Fog(0x9fd3ea, 90, 260);

// Ciel dégradé
const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        topColor: { value: new THREE.Color(0x4a9fd8) },
        bottomColor: { value: new THREE.Color(0xe6f6fd) },
        offset: { value: 30 },
        exponent: { value: 0.7 }
    },
    vertexShader: 'varying vec3 vWorldPosition; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0); }'
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 600);
const NORMAL_CAM_POS = new THREE.Vector3(0, 8, 34);
const NORMAL_CAM_TARGET = new THREE.Vector3(0, 0, -15);
const cameraTarget = NORMAL_CAM_TARGET.clone();
const biteCamPos = new THREE.Vector3();
const biteCamTarget = new THREE.Vector3();
let cameraMode = 'normal';
camera.position.copy(NORMAL_CAM_POS);
camera.lookAt(cameraTarget);

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------------
// Lumières
// ---------------------------------------------------------------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.2);
sunLight.position.set(40, 60, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -70;
sunLight.shadow.camera.right = 70;
sunLight.shadow.camera.top = 70;
sunLight.shadow.camera.bottom = -70;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 200;
scene.add(sunLight);

const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
);
sunMesh.position.set(55, 55, -90);
scene.add(sunMesh);

// Halo du soleil
function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 250, 200, 1)');
    grad.addColorStop(0.3, 'rgba(255, 240, 150, 0.6)');
    grad.addColorStop(1, 'rgba(255, 240, 150, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, depthWrite: false }));
sunGlow.scale.set(70, 70, 1);
sunGlow.position.set(55, 55, -90);
scene.add(sunGlow);

// Nuages
const clouds = [];
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 2, 8, 6), cloudMat);
        puff.position.set(j * 4 - 6, Math.random() * 1.5, Math.random() * 2);
        puff.scale.y = 0.5;
        cloud.add(puff);
    }
    cloud.position.set(-90 + Math.random() * 180, 42 + Math.random() * 22, -120 - Math.random() * 50);
    scene.add(cloud);
    clouds.push(cloud);
}

// ---------------------------------------------------------------------------
// Étang
// ---------------------------------------------------------------------------
const POND_CENTER = new THREE.Vector3(0, 0, -40);
const POND_RADIUS = 55;

const pondBottom = new THREE.Mesh(
    new THREE.CircleGeometry(POND_RADIUS + 2, 96),
    new THREE.MeshStandardMaterial({ color: 0x1a5a70, roughness: 1 })
);
pondBottom.rotation.x = -Math.PI / 2;
pondBottom.position.set(POND_CENTER.x, -4, POND_CENTER.z);
scene.add(pondBottom);

const water = new THREE.Mesh(
    new THREE.CircleGeometry(POND_RADIUS, 96),
    new THREE.MeshStandardMaterial({
        color: 0x3f9fc0,
        transparent: true,
        opacity: 0.45,
        roughness: 0.15,
        metalness: 0.25,
        side: THREE.DoubleSide
    })
);
water.rotation.x = -Math.PI / 2;
water.position.set(POND_CENTER.x, 0, POND_CENTER.z);
scene.add(water);

const shore = new THREE.Mesh(
    new THREE.RingGeometry(POND_RADIUS, 220, 96),
    new THREE.MeshStandardMaterial({ color: 0x4f8a55, roughness: 1 })
);
shore.rotation.x = -Math.PI / 2;
shore.position.set(POND_CENTER.x, -0.4, POND_CENTER.z);
shore.receiveShadow = true;
scene.add(shore);

// ---------------------------------------------------------------------------
// Arbres
// ---------------------------------------------------------------------------
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });
const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3f7a4a, roughness: 1 });

function addTree(x, z, scale) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3 * scale, 0.45 * scale, 3 * scale, 6),
        trunkMat
    );
    trunk.position.set(x, 1.5 * scale - 0.4, z);
    trunk.castShadow = true;
    scene.add(trunk);

    for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry((2.4 - i * 0.55) * scale, (2.6 - i * 0.4) * scale, 8),
            foliageMat
        );
        cone.position.set(x, (3 + i * 1.5) * scale - 0.4, z);
        cone.castShadow = true;
        scene.add(cone);
    }
}

for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.1;
    const radius = POND_RADIUS + 8 + Math.random() * 35;
    const x = POND_CENTER.x + Math.cos(angle) * radius;
    const z = POND_CENTER.z + Math.sin(angle) * radius;
    // Laisse dégagé l'espace devant la caméra et le pêcheur.
    if (z > 5 && Math.abs(x) < 30) {
        continue;
    }
    addTree(x, z, 0.8 + Math.random() * 0.7);
}

// Nénuphars
const lilyPads = [];
const lilyMat = new THREE.MeshStandardMaterial({ color: 0x3f7d4a, roughness: 0.8, side: THREE.DoubleSide });
for (let i = 0; i < 14; i++) {
    const radius = 1.2 + Math.random() * 1.6;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (POND_RADIUS - 12);
    pad.position.set(POND_CENTER.x + Math.cos(angle) * r, 0.06, POND_CENTER.z + Math.sin(angle) * r);
    scene.add(pad);
    lilyPads.push({ x: pad.position.x, z: pad.position.z, radius: radius });
}

// Roseaux
const reedMat = new THREE.MeshStandardMaterial({ color: 0x2f6b3f, roughness: 0.9 });
for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = POND_RADIUS - 1 - Math.random() * 5;
    const x = POND_CENTER.x + Math.cos(angle) * r;
    const z = POND_CENTER.z + Math.sin(angle) * r;
    const h = 2 + Math.random() * 2.5;
    const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, h, 5), reedMat);
    reed.position.set(x, h / 2, z);
    reed.rotation.z = (Math.random() - 0.5) * 0.25;
    scene.add(reed);
}

// Rochers
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 1 });
for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = POND_RADIUS + 3 + Math.random() * 12;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + Math.random() * 1.3, 0), rockMat);
    rock.position.set(POND_CENTER.x + Math.cos(angle) * r, 0.2, POND_CENTER.z + Math.sin(angle) * r);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    scene.add(rock);
}

// ---------------------------------------------------------------------------
// Vent + girouette
// ---------------------------------------------------------------------------
const wind = {
    dir: 0,
    strength: 0,
    targetDir: 0,
    targetStrength: 0,
    timer: 0
};

const vaneGroup = new THREE.Group();
const vaneBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
vaneBase.position.y = 0.15;
vaneGroup.add(vaneBase);

const vanePole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 })
);
vanePole.position.y = 2;
vanePole.castShadow = true;
vaneGroup.add(vanePole);

const vaneArrow = new THREE.Group();
vaneArrow.position.y = 4;
const arrowCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xcc3333 })
);
arrowCone.rotation.z = -Math.PI / 2;
arrowCone.position.x = 0.4;
vaneArrow.add(arrowCone);
const arrowTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.4, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xcc3333 })
);
arrowTail.position.x = -0.4;
vaneArrow.add(arrowTail);
vaneGroup.add(vaneArrow);

vaneGroup.position.set(12, 0, 16);
scene.add(vaneGroup);

// ---------------------------------------------------------------------------
// Pêcheur
// ---------------------------------------------------------------------------
const angler = new THREE.Group();
const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.8 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.9 });

const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.6, 4, 10), clothMat);
body.position.y = 1.5;
body.castShadow = true;
angler.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), skinMat);
head.position.y = 2.9;
head.castShadow = true;
angler.add(head);

const hatMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), hatMat);
hat.position.y = 3.35;
angler.add(hat);
const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 16), hatMat);
brim.position.y = 3.2;
angler.add(brim);

const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.3, 4, 8), clothMat);
arm.position.set(0.55, 2.1, -0.35);
arm.rotation.z = -0.9;
arm.rotation.x = 0.4;
angler.add(arm);

angler.position.set(-4, 0, 18);
angler.rotation.y = Math.PI;
scene.add(angler);

// ---------------------------------------------------------------------------
// Canne
// ---------------------------------------------------------------------------
const rodBase = new THREE.Vector3(-3, 2.2, 17);
const rodTip = new THREE.Vector3(0, 7, 8);

function cylinderBetween(start, end, radius, material) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = true;
    return mesh;
}

const rodMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
scene.add(cylinderBetween(rodBase, rodTip, 0.08, rodMat));

const handleEnd = rodBase.clone().lerp(rodTip, 0.2);
scene.add(cylinderBetween(rodBase, handleEnd, 0.15, new THREE.MeshStandardMaterial({ color: 0x3b2a1a })));

const reel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.22, 14),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 })
);
reel.position.copy(handleEnd).add(new THREE.Vector3(0.25, -0.25, 0));
reel.rotation.z = Math.PI / 2;
scene.add(reel);

// ---------------------------------------------------------------------------
// Ligne + flotteur
// ---------------------------------------------------------------------------
const lineGeometry = new THREE.BufferGeometry().setFromPoints([rodTip.clone(), rodTip.clone()]);
const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x222222 }));
scene.add(line);

function makeBobberTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f4f4';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#d33';
    g.fillRect(0, 32, 64, 32);
    return new THREE.CanvasTexture(c);
}

const floatGroup = new THREE.Group();
const floatBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 24, 16),
    new THREE.MeshStandardMaterial({ map: makeBobberTexture(), roughness: 0.4, transparent: true })
);
floatBody.castShadow = true;
floatGroup.add(floatBody);
const floatStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xc93030, transparent: true })
);
floatStick.position.y = 0.5;
floatGroup.add(floatStick);

// Ligne + hameçon sous le bouchon
const hookLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.7, 4),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true })
);
hookLine.position.y = -0.55;
floatGroup.add(hookLine);

const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.022, 6, 14, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3, transparent: true })
);
hook.position.y = -0.95;
hook.rotation.z = Math.PI;
floatGroup.add(hook);

function setFloatOpacity(opacity) {
    floatBody.material.opacity = opacity;
    floatStick.material.opacity = opacity;
    hookLine.material.opacity = opacity;
    hook.material.opacity = opacity;
}
const floatIdle = new THREE.Vector3(rodTip.x, rodTip.y - 0.6, rodTip.z);
floatGroup.position.copy(floatIdle);
scene.add(floatGroup);

// ---------------------------------------------------------------------------
// Poissons
// ---------------------------------------------------------------------------
const fishes = [];
const FISH_COUNT = 20;

function makeFish(size, power, aggression, type) {
    const group = new THREE.Group();

    // Couleur : plus le poisson est puissant/agressif, plus il tire vers le rouge.
    const t = Math.min(1, ((power - 0.6) / 0.9) * 0.5 + ((aggression - 0.6) / 0.9) * 0.5);
    const color = new THREE.Color(0xffb066).lerp(new THREE.Color(0xd23a12), t);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.1 });

    const thickness = 1.0 + (power - 0.6) * 0.5;
    const tailScale = 0.8 + (aggression - 0.6) * 0.6;
    const finScale = 0.6 + (aggression - 0.6) * 0.8;

    // Forme du corps selon le type de poisson.
    let bodyX = 2.0;
    let bodyY = thickness;
    let bodyZ = 0.8 * thickness;
    if (type === 1) {
        bodyX = 1.3;
        bodyY = 1.2 * thickness;
        bodyZ = 1.0 * thickness;
    } else if (type === 2) {
        bodyX = 2.6;
        bodyY = 0.7 * thickness;
        bodyZ = 0.6 * thickness;
    } else if (type === 3) {
        bodyX = 1.4;
        bodyY = 1.6 * thickness;
        bodyZ = 0.5 * thickness;
    }

    const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), bodyMat);
    fishBody.scale.set(bodyX, bodyY, bodyZ);
    fishBody.castShadow = true;
    group.add(fishBody);

    // Queue selon le type.
    const tailPivot = new THREE.Group();
    tailPivot.position.x = -0.6 * bodyX;
    if (type === 2) {
        const tail1 = new THREE.Mesh(new THREE.ConeGeometry(0.4 * tailScale, 1.0 * tailScale, 6), bodyMat);
        tail1.rotation.z = Math.PI / 2;
        tail1.rotation.y = 0.4;
        tail1.position.set(-0.4 * tailScale, 0.2, 0);
        tailPivot.add(tail1);
        const tail2 = tail1.clone();
        tail2.rotation.y = -0.4;
        tail2.position.y = -0.2;
        tailPivot.add(tail2);
    } else if (type === 1 || type === 3) {
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.7 * tailScale, 0.8 * tailScale, 8), bodyMat);
        tail.rotation.z = Math.PI / 2;
        tail.scale.z = 0.3;
        tail.position.x = -0.4 * tailScale;
        tailPivot.add(tail);
    } else {
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.6 * tailScale, 1.1 * tailScale, 8), bodyMat);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -0.35 * tailScale;
        tailPivot.add(tail);
    }
    group.add(tailPivot);

    // Aileron dorsal (plus haut pour le type plat).
    const finHeight = (type === 3 ? 1.2 : 0.7) * finScale;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.35 * finScale, finHeight, 4), bodyMat);
    fin.position.set(-0.1, 0.6 * bodyY + 0.3 * finScale, 0);
    fin.rotation.z = -0.25;
    group.add(fin);

    // Yeux
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eye1.position.set(0.5 * bodyX, 0.2 * bodyY, 0.32 * bodyZ);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.z = -0.32 * bodyZ;
    group.add(eye2);

    group.userData.tailPivot = tailPivot;
    group.userData.bodyMat = bodyMat;
    group.scale.setScalar(size);
    group.userData.size = size;
    return group;
}

function randomFishPosition() {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (POND_RADIUS - 12);
    return new THREE.Vector3(
        POND_CENTER.x + Math.cos(angle) * r,
        -2.0,
        POND_CENTER.z + Math.sin(angle) * r
    );
}

function randomFishVelocity() {
    const dir = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 2.5;
    return { vx: Math.cos(dir) * speed, vz: Math.sin(dir) * speed };
}

function spawnFish() {
    const size = 0.7 + Math.random() * 0.9;
    const power = 0.6 + Math.random() * 0.9;
    const aggression = 0.6 + Math.random() * 0.9;
    const type = Math.floor(Math.random() * 4);
    const fish = makeFish(size, power, aggression, type);
    fish.position.copy(randomFishPosition());
    const v = randomFishVelocity();
    fish.userData.vx = v.vx;
    fish.userData.vz = v.vz;
    fish.userData.phase = Math.random() * Math.PI * 2;
    fish.userData.power = power;
    fish.userData.aggression = aggression;
    fish.userData.type = type;
    fish.userData.losses = 0;
    fish.userData.weight = Math.round((Math.pow(size, 3) * (1.2 + power * 0.5) + Math.random() * 0.3) * 10) / 10;
    fish.userData.hooked = false;
    scene.add(fish);
    fishes.push(fish);
}

for (let i = 0; i < FISH_COUNT; i++) {
    spawnFish();
}

function respawnFish(fish) {
    fish.position.copy(randomFishPosition());
    const v = randomFishVelocity();
    fish.userData.vx = v.vx;
    fish.userData.vz = v.vz;
}

// Un poisson perdu devient plus agressif, plus rapide et plus difficile.
function punishFish(fish) {
    if (!fish) {
        return;
    }
    fish.userData.losses = (fish.userData.losses || 0) + 1;
    fish.userData.aggression = Math.min(2.5, fish.userData.aggression + 0.2);
    const speed = Math.hypot(fish.userData.vx, fish.userData.vz);
    const newSpeed = Math.min(9, speed * 1.25 + 0.5);
    if (speed > 0.001) {
        fish.userData.vx = (fish.userData.vx / speed) * newSpeed;
        fish.userData.vz = (fish.userData.vz / speed) * newSpeed;
    } else {
        const v = randomFishVelocity();
        fish.userData.vx = v.vx;
        fish.userData.vz = v.vz;
    }
    if (fish.userData.bodyMat) {
        const power = fish.userData.power;
        const aggression = fish.userData.aggression;
        const t = Math.min(1, ((power - 0.6) / 0.9) * 0.5 + ((aggression - 0.6) / 0.9) * 0.5);
        const color = new THREE.Color(0xffb066).lerp(new THREE.Color(0xd23a12), t);
        fish.userData.bodyMat.color.copy(color);
    }
}

// ---------------------------------------------------------------------------
// État du jeu
// ---------------------------------------------------------------------------
let score = 0;
let fishCaught = false;
let floatState = 'idle'; // 'idle' | 'flying' | 'inWater' | 'bite' | 'struggle' | 'reeling'
let castT = 0;
let waitTimer = 0;
let biteFish = null;
let biteCooldown = 0;
let biteViewActive = false;
let bitePhase = 'floating';
let biteViewTimer = 0;
let biteSinkAt = 0;
let biteSinkTimer = 0;
const BITE_WINDOW = 0.5;
let tension = 0.5;
let struggle = null;
let struggleTimeLeft = 0;
let snag = null;
let hookedFish = null;
let escaped = false;
let timeoutEscape = false;
let shake = 0;
let caughtWeight = 0;
let lineBrokenTimer = 0;
let snagFreed = false;
const castStart = new THREE.Vector3();
const castTarget = new THREE.Vector3();
const CAST_DURATION = 0.8;
const MAX_WAIT = 5;

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2(0, 0);

function waterPointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObject(water);
    return hits.length ? hits[0].point.clone() : null;
}

function startCast(target) {
    if (floatState !== 'idle') {
        return;
    }
    castStart.copy(rodTip);
    castTarget.copy(target);
    castTarget.x += Math.cos(wind.dir) * wind.strength * 2.5;
    castTarget.z += Math.sin(wind.dir) * wind.strength * 2.5;
    castTarget.y = 0.1;
    const wdx = castTarget.x - POND_CENTER.x;
    const wdz = castTarget.z - POND_CENTER.z;
    const wd = Math.hypot(wdx, wdz);
    if (wd > POND_RADIUS - 2) {
        castTarget.x = POND_CENTER.x + (wdx / wd) * (POND_RADIUS - 2);
        castTarget.z = POND_CENTER.z + (wdz / wd) * (POND_RADIUS - 2);
    }
    castT = 0;
    fishCaught = false;
    floatState = 'flying';
    fishButton.disabled = true;
    statusDisplay.textContent = 'Lancer…';
    sound.cast();
}

function startReel() {
    if (floatState === 'inWater') {
        floatState = 'reeling';
        statusDisplay.textContent = 'On remonte la ligne… tourne la manivelle !';
    }
}

function findBitingFish() {
    if (fishCaught) {
        return null;
    }
    for (let i = 0; i < fishes.length; i++) {
        const fish = fishes[i];
        if (fish.userData.hooked) {
            continue;
        }
        const dx = fish.position.x - floatGroup.position.x;
        const dz = fish.position.z - floatGroup.position.z;
        if (dx * dx + dz * dz < 2.4 * 2.4) {
            return fish;
        }
    }
    return null;
}

function endCast() {
    if (fishCaught) {
        score++;
        scoreDisplay.textContent = score;
        showCatchMessage(caughtWeight);
        sound.catchFish();
        statusDisplay.textContent = 'Poisson attrapé ! ' + caughtWeight.toFixed(1).replace('.', ',') + ' kg (+1) 🎣';
        fishCaught = false;
    } else if (snagFreed) {
        statusDisplay.textContent = 'Ligne dégagée ! Tu peux relancer.';
        snagFreed = false;
    } else if (escaped) {
        sound.escape();
        statusDisplay.textContent = timeoutEscape ? 'Temps écoulé ! Le poisson s’est décroché.' : 'Le poisson s’est détaché ! Réessaie.';
        escaped = false;
        timeoutEscape = false;
    } else {
        statusDisplay.textContent = 'Rien cette fois… clique sur l’eau pour relancer.';
    }
}

// ---------------------------------------------------------------------------
// Épreuve de force (tug-of-war)
// ---------------------------------------------------------------------------
function updateStruggleBar() {
    struggleMarker.style.left = (tension * 100) + '%';
}

function updateStruggleTimer() {
    // Affiche le temps restant et le nombre de tours de manivelle encore
    // nécessaires : comme un tour ramène REEL_PER_TURN unités, ce nombre est
    // directement proportionnel à la longueur de fil qu'il reste à ramener.
    let text = '⏱ ' + struggleTimeLeft.toFixed(1).replace('.', ',') + ' s';
    if (struggle) {
        const turns = Math.max(0, (struggle.lineLength - struggle.minLength) / REEL_PER_TURN);
        text += ' · encore ~' + Math.ceil(turns) + ' tour' + (turns >= 1.5 ? 's' : '') + ' de manivelle';
    }
    struggleTimer.textContent = text;
    if (struggleTimeLeft <= 1) {
        struggleTimer.classList.add('urgent');
    } else {
        struggleTimer.classList.remove('urgent');
    }
}

let catchMessageTimer = null;

function showCatchMessage(weight) {
    catchMessage.textContent = 'Poisson attrapé ! ' + weight.toFixed(1).replace('.', ',') + ' kg 🎣';
    catchMessage.classList.add('show');
    if (catchMessageTimer) {
        clearTimeout(catchMessageTimer);
    }
    catchMessageTimer = setTimeout(function () {
        catchMessage.classList.remove('show');
    }, 2500);
}

const struggleAnchor = new THREE.Vector3(rodTip.x, 0, rodTip.z);
const struggleDir = new THREE.Vector3();
const strugglePos = new THREE.Vector3(rodTip.x, 0.1, rodTip.z);

// Longueur de fil « de référence » du combat : la distance au sol entre le
// bout de la canne et le point de lancer.
function struggleBaseLength() {
    return Math.hypot(castTarget.x - struggleAnchor.x, castTarget.z - struggleAnchor.z);
}

// Convertit une longueur de fil sortie en tension affichée sur la barre.
function lineLengthToTension(length) {
    if (!struggle || struggle.baseLength < 0.001) {
        return 0.5;
    }
    return (length / struggle.baseLength - STRUGGLE_MIN_FACTOR) / STRUGGLE_SPAN;
}

// Position du poisson le long de la ligne, d'après la longueur de fil sortie :
// il « recule » quand il tire (du fil sort) et se rapproche du pêcheur quand
// le joueur tourne la manivelle.
function computeStrugglePos() {
    if (!struggle) {
        return;
    }
    struggleDir.set(castTarget.x - struggleAnchor.x, 0, castTarget.z - struggleAnchor.z);
    const baseDist = struggleDir.length();
    if (baseDist < 0.001) {
        strugglePos.set(castTarget.x, 0.1, castTarget.z);
        return;
    }
    struggleDir.normalize();
    const dist = struggle.lineLength;
    let x = struggleAnchor.x + struggleDir.x * dist;
    let z = struggleAnchor.z + struggleDir.z * dist;
    const dx = x - POND_CENTER.x;
    const dz = z - POND_CENTER.z;
    const d = Math.hypot(dx, dz);
    const maxR = POND_RADIUS - 3;
    if (d > maxR) {
        x = POND_CENTER.x + (dx / d) * maxR;
        z = POND_CENTER.z + (dz / d) * maxR;
    }
    strugglePos.set(x, 0.1, z);
}

function startStruggle(fish) {
    const size = fish.userData.size;
    const power = fish.userData.power;
    const aggression = fish.userData.aggression;
    const interval = (1.8 - size * 0.4) / aggression;
    // Longueur de fil de référence : la distance du lancer.
    const baseLength = Math.max(4, struggleBaseLength());
    // Fil déjà rentré pendant la remontée (touche en cours de récupération) :
    // le combat démarre avec ce qu'il reste dehors, sans téléporter le poisson.
    const floatDist = Math.hypot(
        floatGroup.position.x - struggleAnchor.x,
        floatGroup.position.z - struggleAnchor.z
    );
    const startLength = Math.min(baseLength, Math.max(baseLength * 0.5, floatDist));
    struggle = {
        baseLength: baseLength,
        lineLength: startLength,
        minLength: baseLength * STRUGGLE_MIN_FACTOR,
        maxLength: baseLength * STRUGGLE_MAX_FACTOR,
        // Le poisson reprend du fil (la ligne et la distance reculent) : une
        // vitesse de fond, plus des « coups » brusques de temps en temps.
        pullSpeed: Math.min(1.6, (0.4 + size * 0.6) * power),
        burstDistance: (0.3 + size * 0.4) * power,
        burstInterval: interval,
        burstTimer: interval,
        // Un clic = un petit coup de poignet, bien plus faible qu'un tour.
        clickDistance: 1.2
    };
    tension = Math.max(0, Math.min(1, lineLengthToTension(struggle.lineLength)));
    // Temps limite, large : c'est surtout le fil trop tendu (le poisson qui
    // prend du fil) qui fait perdre le poisson, pas le chrono.
    struggleTimeLeft = Math.min(25, Math.max(6, baseLength * 0.7));
    updateStruggleTimer();
    computeStrugglePos();
    floatGroup.position.copy(strugglePos);
    fishCaught = true;
    escaped = false;
    hookedFish = fish;
    fish.userData.hooked = true;
    fish.userData.biting = false;
    biteFromReel = false;
    floatState = 'struggle';
    strugglePanel.classList.add('active');
    struggleInfo.textContent = 'Taille ' + size.toFixed(1) + ' · force ' + power.toFixed(1) + ' · agressivité ' + aggression.toFixed(1) + ' · ' + fish.userData.weight.toFixed(1).replace('.', ',') + ' kg';
    struggleHint.textContent = 'Tourne la manivelle pour ramener le poisson !';
    updateStruggleBar();
    fishButton.disabled = false;
    fishButton.textContent = 'Ramener !';
    statusDisplay.textContent = 'Poisson ferré ! Tourne la manivelle pour le ramener !';
}

function showBiteView(fish, fromReel) {
    biteFish = fish;
    biteFromReel = !!fromReel;
    fish.userData.biting = true;
    fish.visible = false;
    biteViewActive = true;
    bitePhase = 'floating';
    biteViewTimer = 0;
    biteSinkAt = 1.2 + Math.random() * 1.3;
    biteSinkTimer = 0;
    biteView.classList.add('active');
    biteHint.textContent = 'Attends que le bouchon s’enfonce… (1 seul essai !)';
    biteHint.classList.remove('urgent');
    floatGroup.position.y = 0.1;
    spawnRipple(floatGroup.position);
    sound.bite();
    cameraMode = 'bite';
    biteCamPos.set(floatGroup.position.x, floatGroup.position.y + 1.6, floatGroup.position.z + 3.2);
    biteCamTarget.set(floatGroup.position.x, floatGroup.position.y + 0.1, floatGroup.position.z);
    floatState = 'bite';
    statusDisplay.textContent = 'Un poisson s’approche du bouchon…';
}

function hideBiteView() {
    biteViewActive = false;
    biteView.classList.remove('active');
    cameraMode = 'normal';
    setFloatOpacity(1);
}

function hookFish() {
    if (floatState !== 'bite' || !biteViewActive) {
        return;
    }
    if (bitePhase === 'sinking') {
        const fish = biteFish;
        biteFish = null;
        fish.visible = true;
        sound.reel();
        hideBiteView();
        startStruggle(fish);
    } else if (bitePhase === 'floating') {
        // Trop tôt : le poisson est effrayé et s'enfuit (un seul essai).
        if (biteFish) {
            biteFish.userData.biting = false;
            biteFish.visible = true;
            punishFish(biteFish);
            biteFish = null;
        }
        biteCooldown = 1.0;
        if (biteFromReel) {
            biteFromReel = false;
            floatState = 'reeling';
        } else {
            floatState = 'inWater';
            waitTimer = 0;
        }
        statusDisplay.textContent = 'Trop tôt ! Le poisson s’est enfui.';
        hideBiteView();
    }
}

function updateBiteView(dt) {
    if (!biteViewActive) {
        return;
    }
    biteViewTimer += dt;
    if (bitePhase === 'floating') {
        floatGroup.position.y = 0.1 + Math.sin(biteViewTimer * 4) * 0.08;
        setFloatOpacity(1);
        if (biteViewTimer >= biteSinkAt) {
            bitePhase = 'sinking';
            biteSinkTimer = 0;
            biteHint.textContent = 'MAINTENANT !';
            biteHint.classList.add('urgent');
            spawnRipple(floatGroup.position);
        }
    } else if (bitePhase === 'sinking') {
        biteSinkTimer += dt;
        const progress = Math.min(1, biteSinkTimer / 0.25);
        floatGroup.position.y = 0.1 - 1.4 * progress;
        setFloatOpacity(Math.max(0, 1 - progress * 1.5));
        if (biteSinkTimer >= BITE_WINDOW) {
            bitePhase = 'missed';
            biteHint.textContent = 'Trop tard ! Le poisson a recraché…';
            biteHint.classList.remove('urgent');
            floatGroup.position.y = 0.1;
            setFloatOpacity(1);
            if (biteFish) {
                biteFish.userData.biting = false;
                biteFish.visible = true;
                punishFish(biteFish);
                biteFish = null;
            }
            biteCooldown = 1.0;
            if (biteFromReel) {
                biteFromReel = false;
                floatState = 'reeling';
            } else {
                floatState = 'inWater';
                waitTimer = 0;
            }
            statusDisplay.textContent = 'Trop tard ! Le poisson a recraché l’hameçon.';
            setTimeout(hideBiteView, 800);
        }
    }
}

function reelClick() {
    if (floatState === 'struggle' && struggle) {
        // Coup de poignet : gagne juste un peu de fil. La manivelle reste le
        // vrai moulinet (et son apport est proportionnel à la distance).
        struggle.lineLength = Math.max(struggle.minLength, struggle.lineLength - struggle.clickDistance);
        tension = Math.max(0, lineLengthToTension(struggle.lineLength));
        shake = 0.06;
        sound.reel();
        updateStruggleBar();
    } else if (floatState === 'snag' && snag) {
        tension = Math.max(0, tension - snag.clickPower);
        shake = 0.06;
        sound.reel();
        updateStruggleBar();
    }
}

function endStruggle(success, timedOut) {
    strugglePanel.classList.remove('active');
    fishButton.textContent = 'Lancer la canne';
    struggle = null;
    if (success) {
        fishCaught = true;
        caughtWeight = hookedFish ? hookedFish.userData.weight : 0;
        statusDisplay.textContent = 'Poisson ferré ! On le ramène…';
    } else {
        fishCaught = false;
        escaped = true;
        timeoutEscape = !!timedOut;
        if (hookedFish) {
            hookedFish.userData.hooked = false;
            hookedFish.visible = true;
            punishFish(hookedFish);
            hookedFish = null;
        }
        statusDisplay.textContent = timedOut ? 'Temps écoulé ! Le poisson s’est décroché.' : 'Fil trop tendu : le poisson s’est décroché !';
    }
    floatState = 'reeling';
}

function updateStruggle(dt) {
    if (floatState !== 'struggle' || !struggle) {
        return;
    }
    // 1) Le joueur tourne la manivelle : chaque tour ramène REEL_PER_TURN
    //    unités de fil (un tour ≈ 1 m), donc un long lancer demande plus de tours.
    const reeled = consumeCrankTurns() * REEL_PER_TURN;
    if (reeled > 0) {
        struggle.lineLength -= reeled;
    }
    // 2) Le poisson tire : il reprend du fil, la ligne (et donc la distance)
    //    recule. Il donne aussi des coups brusques de temps en temps.
    struggle.lineLength += struggle.pullSpeed * dt;
    struggle.burstTimer -= dt;
    if (struggle.burstTimer <= 0) {
        struggle.lineLength += struggle.burstDistance;
        struggle.burstTimer = struggle.burstInterval * (0.7 + Math.random() * 0.6);
        shake = 0.14;
    }
    // 3) La barre et la position du poisson suivent la longueur de fil sortie.
    tension = Math.max(0, Math.min(1, lineLengthToTension(struggle.lineLength)));
    // Fil tendu à l'extrême (barre tout à droite) : il casse, le poisson se décroche.
    if (struggle.lineLength >= struggle.maxLength) {
        tension = 1;
        computeStrugglePos();
        updateStruggleBar();
        endStruggle(false);
        return;
    }
    // Poisson ramené au bord de la canne : gagné !
    if (struggle.lineLength <= struggle.minLength) {
        tension = 0;
        computeStrugglePos();
        updateStruggleBar();
        endStruggle(true);
        return;
    }
    // Temps limité : sinon le poisson finit par se décrocher.
    struggleTimeLeft -= dt;
    if (struggleTimeLeft <= 0) {
        struggleTimeLeft = 0;
        updateStruggleTimer();
        endStruggle(false, true);
        return;
    }
    updateStruggleTimer();
    computeStrugglePos();
    updateStruggleBar();
}

// ---------------------------------------------------------------------------
// Accrochage dans les nénuphars
// ---------------------------------------------------------------------------
function isSnagged(point) {
    for (let i = 0; i < lilyPads.length; i++) {
        const pad = lilyPads[i];
        const dx = point.x - pad.x;
        const dz = point.z - pad.z;
        const r = pad.radius + 0.5;
        if (dx * dx + dz * dz < r * r) {
            return true;
        }
    }
    return false;
}

function startSnag() {
    floatState = 'snag';
    tension = 0.5;
    snag = {
        pullRate: 0.12,
        burstStrength: 0.10,
        burstInterval: 1.1,
        burstTimer: 1.1,
        clickPower: 0.10
    };
    strugglePanel.classList.add('active');
    sound.snag();
    struggleInfo.textContent = 'Ligne accrochée aux nénuphars';
    struggleTimer.textContent = '';
    struggleTimer.classList.remove('urgent');
    struggleHint.textContent = 'Clique vite pour dégager la ligne !';
    updateStruggleBar();
    fishButton.disabled = false;
    fishButton.textContent = 'Dégager !';
    statusDisplay.textContent = 'La ligne s’est accrochée aux nénuphars ! Clique pour la dégager.';
}

function endSnag(freed) {
    strugglePanel.classList.remove('active');
    fishButton.textContent = 'Lancer la canne';
    snag = null;
    if (freed) {
        snagFreed = true;
        statusDisplay.textContent = 'Ligne dégagée ! On la ramène.';
        floatState = 'reeling';
    } else {
        sound.lineBreak();
        statusDisplay.textContent = 'La ligne a cassé ! Le bouchon est perdu…';
        floatGroup.visible = false;
        lineBrokenTimer = 1.2;
        floatState = 'broken';
    }
}

function updateSnag(dt) {
    if (floatState !== 'snag' || !snag) {
        return;
    }
    if (tension <= 0) {
        tension = 0;
        updateStruggleBar();
        endSnag(true);
        return;
    }
    tension += snag.pullRate * dt;
    snag.burstTimer -= dt;
    if (snag.burstTimer <= 0) {
        tension += snag.burstStrength;
        snag.burstTimer = snag.burstInterval * (0.7 + Math.random() * 0.6);
        shake = 0.12;
    }
    if (tension >= 1) {
        tension = 1;
        updateStruggleBar();
        endSnag(false);
        return;
    }
    updateStruggleBar();
}

// ---------------------------------------------------------------------------
// Ondulations
// ---------------------------------------------------------------------------
const ripples = [];

function spawnRipple(position) {
    const geo = new THREE.RingGeometry(0.25, 0.45, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, 0.06, position.z);
    scene.add(mesh);
    ripples.push({ mesh: mesh, t: 0 });
}

function updateRipples(dt) {
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.t += dt;
        const s = 1 + r.t * 9;
        r.mesh.scale.set(s, s, s);
        r.mesh.material.opacity = Math.max(0, 0.7 * (1 - r.t / 1.3));
        if (r.t > 1.3) {
            scene.remove(r.mesh);
            r.mesh.geometry.dispose();
            r.mesh.material.dispose();
            ripples.splice(i, 1);
        }
    }
}

// ---------------------------------------------------------------------------
// Mise à jour
// ---------------------------------------------------------------------------
function updateWind(dt) {
    wind.timer -= dt;
    if (wind.timer <= 0) {
        wind.targetDir = Math.random() * Math.PI * 2;
        wind.targetStrength = Math.random() * 0.8;
        wind.timer = 6 + Math.random() * 6;
    }
    const lerpFactor = 1 - Math.pow(0.1, dt);
    let diff = wind.targetDir - wind.dir;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    wind.dir += diff * lerpFactor;
    wind.strength += (wind.targetStrength - wind.strength) * lerpFactor;

    vaneArrow.rotation.y = -wind.dir;
    windFill.style.width = (wind.strength * 100).toFixed(0) + '%';
    windArrow.style.transform = 'rotate(' + (wind.dir * 180 / Math.PI).toFixed(0) + 'deg)';
    sound.setWind(wind.strength);
}

function updateClouds(dt) {
    const speed = 2 + wind.strength * 4;
    clouds.forEach(cloud => {
        cloud.position.x += Math.cos(wind.dir) * speed * dt;
        cloud.position.z += Math.sin(wind.dir) * speed * dt;
        if (cloud.position.x > 130) cloud.position.x = -130;
        if (cloud.position.x < -130) cloud.position.x = 130;
        if (cloud.position.z > -50) cloud.position.z = -190;
        if (cloud.position.z < -190) cloud.position.z = -50;
    });
}

function updateFish(dt, time) {
    fishes.forEach(fish => {
        const data = fish.userData;
        if (data.biting) {
            fish.position.x = floatGroup.position.x + Math.sin(time * 20) * 0.12;
            fish.position.z = floatGroup.position.z + Math.cos(time * 18) * 0.12;
            fish.position.y = -0.4;
            fish.rotation.y = Math.sin(time * 18) * 0.4;
            data.tailPivot.rotation.y = Math.sin(time * 22) * 0.7;
            return;
        }
        if (data.hooked) {
            if (floatState === 'reeling') {
                return; // position gérée par la remontée
            }
            fish.position.x = strugglePos.x + Math.sin(time * 30) * 0.15;
            fish.position.z = strugglePos.z + Math.cos(time * 25) * 0.15;
            fish.position.y = -0.5 + Math.sin(time * 20) * 0.1;
            fish.rotation.y = Math.sin(time * 15) * 0.5;
            data.tailPivot.rotation.y = Math.sin(time * 25) * 0.8;
            return;
        }
        fish.position.x += data.vx * dt;
        fish.position.z += data.vz * dt;

        const dx = fish.position.x - POND_CENTER.x;
        const dz = fish.position.z - POND_CENTER.z;
        const dist = Math.hypot(dx, dz);
        const limit = POND_RADIUS - 5;
        if (dist > limit) {
            const nx = dx / dist;
            const nz = dz / dist;
            const dot = data.vx * nx + data.vz * nz;
            data.vx -= 2 * dot * nx;
            data.vz -= 2 * dot * nz;
            fish.position.x = POND_CENTER.x + nx * limit;
            fish.position.z = POND_CENTER.z + nz * limit;
        }

        fish.rotation.y = Math.atan2(-data.vz, data.vx);
        fish.position.y = -2.0 + Math.sin(time * 2 + data.phase) * 0.15;
        data.tailPivot.rotation.y = Math.sin(time * 9 + data.phase) * 0.5;
    });
}

function updateFloat(dt, time) {
    if (floatState === 'flying') {
        castT += dt / CAST_DURATION;
        if (castT >= 1) {
            castT = 1;
            floatGroup.position.copy(castTarget);
            spawnRipple(castTarget);
            sound.splash();
            if (isSnagged(castTarget)) {
                startSnag();
            } else {
                floatState = 'inWater';
                waitTimer = 0;
                statusDisplay.textContent = 'Le flotteur est dans l’eau… attends qu’un poisson morde.';
            }
        } else {
            const x = THREE.MathUtils.lerp(castStart.x, castTarget.x, castT);
            const z = THREE.MathUtils.lerp(castStart.z, castTarget.z, castT);
            const y = THREE.MathUtils.lerp(castStart.y, castTarget.y, castT) + Math.sin(Math.PI * castT) * 6;
            floatGroup.position.set(x, y, z);
        }
    } else if (floatState === 'inWater') {
        floatGroup.position.y = 0.1 + Math.sin(time * 3) * 0.06;
        floatGroup.position.x += Math.cos(wind.dir) * wind.strength * 0.6 * dt;
        floatGroup.position.z += Math.sin(wind.dir) * wind.strength * 0.6 * dt;
        waitTimer += dt;
        if (biteCooldown > 0) {
            biteCooldown -= dt;
        } else {
            const fish = findBitingFish();
            if (fish) {
                showBiteView(fish);
            } else if (waitTimer > MAX_WAIT) {
                startReel();
            }
        }
    } else if (floatState === 'struggle') {
        floatGroup.position.x = strugglePos.x + Math.sin(time * 30) * 0.08;
        floatGroup.position.z = strugglePos.z + Math.cos(time * 25) * 0.08;
        floatGroup.position.y = 0.1 + Math.sin(time * 20) * 0.05;
    } else if (floatState === 'snag') {
        floatGroup.position.x = castTarget.x + Math.sin(time * 25) * 0.05;
        floatGroup.position.z = castTarget.z + Math.cos(time * 22) * 0.05;
        floatGroup.position.y = 0.1 + Math.sin(time * 18) * 0.04;
    } else if (floatState === 'broken') {
        lineBrokenTimer -= dt;
        if (lineBrokenTimer <= 0) {
            floatGroup.visible = true;
            floatGroup.position.copy(floatIdle);
            floatState = 'idle';
            fishButton.disabled = false;
        }
    } else if (floatState === 'reeling') {
        // Le fil ne se rembobine qu'en tournant la manivelle : un tour complet
        // ramène REEL_PER_TURN unités (≈ 1 m), donc le nombre de tours est
        // proportionnel à la distance restante.
        const step = consumeCrankTurns() * REEL_PER_TURN;
        // Le poisson est ramené jusqu'aux pieds du pêcheur.
        const shoreX = angler.position.x;
        const shoreZ = angler.position.z - 2.5;
        const dx = shoreX - floatGroup.position.x;
        const dz = shoreZ - floatGroup.position.z;
        const distXZ = Math.hypot(dx, dz);
        if (distXZ > 1.0) {
            const move = Math.min(step, distXZ);
            floatGroup.position.x += (dx / distXZ) * move;
            floatGroup.position.z += (dz / distXZ) * move;
            floatGroup.position.y = 0.1 + Math.sin(time * 6) * 0.03;
            if (hookedFish) {
                hookedFish.position.x = floatGroup.position.x;
                hookedFish.position.z = floatGroup.position.z;
                hookedFish.position.y = -0.3;
                hookedFish.rotation.y = Math.atan2(-dz, dx);
            }
            // Une touche peut survenir pendant la remontée.
            if (!fishCaught) {
                const fish = findBitingFish();
                if (fish) {
                    showBiteView(fish, true);
                    return;
                }
            }
        } else {
            if (hookedFish) {
                scene.remove(hookedFish);
                const idx = fishes.indexOf(hookedFish);
                if (idx >= 0) {
                    fishes.splice(idx, 1);
                }
                hookedFish = null;
                spawnFish();
            }
            floatGroup.position.copy(floatIdle);
            floatState = 'idle';
            fishButton.disabled = false;
            endCast();
        }
    }
    // La manivelle sert pendant l'épreuve de force ET pendant la remontée.
    crank.classList.toggle('active', floatState === 'reeling' || floatState === 'struggle');
}

function updateLine() {
    const start = rodTip;
    const end = floatGroup.position;
    const points = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = start.x + (end.x - start.x) * t;
        const z = start.z + (end.z - start.z) * t;
        const y = start.y + (end.y - start.y) * t - Math.sin(Math.PI * t) * 0.8;
        points.push(new THREE.Vector3(x, y, z));
    }
    line.geometry.setFromPoints(points);
}

// ---------------------------------------------------------------------------
// Entrées
// ---------------------------------------------------------------------------
canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) {
        return;
    }
    ensureSound();
    if (floatState === 'bite') {
        hookFish();
        return;
    }
    if (floatState === 'struggle' || floatState === 'snag') {
        reelClick();
        return;
    }
    if (floatState === 'idle') {
        const p = waterPointFromEvent(event);
        if (p) {
            startCast(p);
        }
    } else if (floatState === 'inWater') {
        startReel();
    }
});

biteView.addEventListener('pointerdown', hookFish);

fishButton.addEventListener('click', () => {
    ensureSound();
    if (floatState === 'bite') {
        hookFish();
        return;
    }
    if (floatState === 'struggle' || floatState === 'snag') {
        reelClick();
        return;
    }
    if (floatState === 'idle') {
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObject(water);
        if (hits.length) {
            startCast(hits[0].point.clone());
        }
    } else if (floatState === 'inWater') {
        startReel();
    }
});

window.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') {
        ensureSound();
        if (floatState === 'bite') {
            hookFish();
            return;
        }
        if (floatState === 'struggle' || floatState === 'snag') {
            reelClick();
            return;
        }
        if (floatState === 'idle') {
            raycaster.setFromCamera(pointerNdc, camera);
            const hits = raycaster.intersectObject(water);
            if (hits.length) {
                startCast(hits[0].point.clone());
            }
        } else if (floatState === 'inWater') {
            startReel();
        }
    }
});

// ---------------------------------------------------------------------------
// Boucle d'animation
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let elapsed = 0;
let paused = false;

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused) {
        elapsed += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateFish(dt, elapsed);
        updateFloat(dt, elapsed);
        updateRipples(dt);
        updateLine();
    }
    crank.classList.toggle('active', floatState === 'reeling' || floatState === 'struggle');
    if (cameraMode === 'bite') {
        camera.position.lerp(biteCamPos, 1 - Math.pow(0.0001, dt));
        cameraTarget.lerp(biteCamTarget, 1 - Math.pow(0.0001, dt));
    } else {
        camera.position.lerp(NORMAL_CAM_POS, 1 - Math.pow(0.0001, dt));
        cameraTarget.lerp(NORMAL_CAM_TARGET, 1 - Math.pow(0.0001, dt));
    }
    if (shake > 0) {
        shake = Math.max(0, shake - dt * 1.5);
        camera.position.x += Math.sin(elapsed * 60) * shake;
        camera.position.y += Math.cos(elapsed * 55) * shake;
    }
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
}

animate();

// ---------------------------------------------------------------------------
// Exposé pour les tests automatisés
// ---------------------------------------------------------------------------
let testTime = 0;
window.__game = {
    scene: scene,
    camera: camera,
    renderer: renderer,
    fishes: fishes,
    floatGroup: floatGroup,
    rodTip: rodTip,
    angler: angler,
    makeFish: makeFish,
    lilyPads: lilyPads,
    startCast: startCast,
    hookFish: hookFish,
    getState: function () { return floatState; },
    getBitePhase: function () { return bitePhase; },
    isBiteViewActive: function () { return biteViewActive; },
    getCameraMode: function () { return cameraMode; },
    startReel: startReel,
    getBiteFromReel: function () { return biteFromReel; },
    sound: sound,
    getWind: function () { return { dir: wind.dir, strength: wind.strength }; },
    getVaneRotation: function () { return vaneArrow.rotation.y; },
    getTension: function () { return tension; },
    getStruggleTimeLeft: function () { return struggleTimeLeft; },
    getLineLength: function () { return struggle ? struggle.lineLength : 0; },
    getStruggleTurnsNeeded: function () {
        if (!struggle) {
            return 0;
        }
        return Math.max(0, (struggle.lineLength - struggle.minLength) / REEL_PER_TURN);
    },
    getUnitsPerTurn: function () { return REEL_PER_TURN; },
    // Simule les tours de manivelle (1 = un tour complet) pour les tests.
    turnCrank: function (turns) { crankRotationDelta += turns * TWO_PI; },
    reelClick: reelClick,
    setPaused: function (value) { paused = value; },
    step: function (dt) {
        testTime += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateFish(dt, testTime);
        updateFloat(dt, testTime);
        updateRipples(dt);
        updateLine();
    }
};

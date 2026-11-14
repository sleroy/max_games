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
const feedButton = document.getElementById('feedButton');
const feedGauge = document.getElementById('feedGauge');
const feedGaugeFill = document.getElementById('feedGaugeFill');
const feedGaugeTarget = document.getElementById('feedGaugeTarget');
const journalButton = document.getElementById('journalButton');
const journalPanel = document.getElementById('journal');
const journalStats = document.getElementById('journalStats');
const journalList = document.getElementById('journalList');
const journalClose = document.getElementById('journalClose');
const difficultySelect = document.getElementById('difficultySelect');
const bigTextToggle = document.getElementById('bigTextToggle');
const calmToggle = document.getElementById('calmToggle');
const effectsToggle = document.getElementById('effectsToggle');
const bourricheLabel = document.getElementById('bourricheLabel');
const toolDock = document.getElementById('toolDock');
const dragButton = document.getElementById('dragButton');
const journalEspeces = document.getElementById('journalEspeces');
const reflectionsToggle = document.getElementById('reflectionsToggle');
const tutorial = document.getElementById('tutorial');
const tutorialText = document.getElementById('tutorialText');
const tutorialHand = document.getElementById('tutorialHand');
const tutorialStepDisplay = document.getElementById('tutorialStep');
const tutorialNext = document.getElementById('tutorialNext');
const tutorialClose = document.getElementById('tutorialClose');
const tutorialOpen = document.getElementById('tutorialOpen');

const sound = new SoundEngine();

// ---------------------------------------------------------------------------
// Aléatoire du jeu : notre propre générateur « seedé », pour que le monde soit
// reproductible indépendamment du nombre d'objets créés par three.js (chaque
// objet de three.js consomme de l'aléatoire pour son identifiant interne).
// ---------------------------------------------------------------------------
let rngState = 20240101 >>> 0;

function rand() {
    rngState = (rngState + 0x6d2b79f5) >>> 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

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

// Bouton plein écran (très pratique sur téléphone : masque la barre du navigateur).
const fullscreenButton = document.getElementById('fullscreenButton');

function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function toggleFullscreen() {
    const root = document.documentElement;
    if (!root) {
        return;
    }
    if (fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
            const result = exit.call(document);
            if (result && result.catch) {
                result.catch(() => {});
            }
        }
    } else {
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (request) {
            const result = request.call(root);
            if (result && result.catch) {
                result.catch(() => {});
            }
        }
    }
}

fullscreenButton.addEventListener('click', () => {
    ensureSound();
    toggleFullscreen();
});

// Si le navigateur ne gère pas le plein écran, on masque le bouton.
if (document.documentElement
        && !document.documentElement.requestFullscreen
        && !document.documentElement.webkitRequestFullscreen) {
    fullscreenButton.style.display = 'none';
}

// Bouton pause : fige le jeu (très pratique pour un enfant).
const pauseButton = document.getElementById('pauseButton');

pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? '▶' : '⏸';
    if (paused) {
        statusDisplay.textContent = 'Pause — appuie sur ▶ pour reprendre.';
    }
});

// Manivelle : on la fait tourner pour ramener la ligne.
const crank = document.getElementById('crank');
const crankRotor = document.getElementById('crankRotor');
let crankDragging = false;
let crankAngle = 0;
let crankLastAngle = 0;
let crankRotationDelta = 0;
let crankSoundAccum = 0;

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

// ---------------------------------------------------------------------------
// Difficulté — réglable depuis le carnet (Facile / Normal / Dur).
// En augmentant la difficulté :
//   • le poisson tire plus fort et reprend plus de fil (épreuve de force) ;
//   • le temps de l'épreuve de force est plus court ;
//   • la fenêtre de ferrage (BITE_WINDOW) est plus courte.
// ---------------------------------------------------------------------------
const DIFFICULTY_MODES = {
    facile: { difficulty: 1.0, biteWindow: 0.55 },
    normal: { difficulty: 1.3, biteWindow: 0.4 },
    dur: { difficulty: 1.6, biteWindow: 0.32 }
};
let DIFFICULTY = DIFFICULTY_MODES.normal.difficulty;

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
// Sur téléphone : on limite la résolution et la taille des ombres (performance).
// Même critère que la CSS : pointeur « grossier » ou écran étroit.
const isMobileDevice = typeof window.matchMedia === 'function'
    && (window.matchMedia('(pointer: coarse)').matches
        || window.matchMedia('(max-width: 820px)').matches);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.5 : 2));
// Rendu plus « photo » : tone mapping ACES (comme une caméra). Les shaders
// maison (ciel, eau) incluent les chunks de tone mapping pour rester cohérents.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------------------------------------------------------------------------
// Post-traitement maison (aucune dépendance) : léger « bloom » + vignette.
// On rend la scène dans une cible, on isole les hautes lumières, on les floute
// puis on recompose à l'écran. Désactivé par défaut sur mobile (performance).
// ---------------------------------------------------------------------------
const post = { enabled: !isMobileDevice, strength: 0.22, vignette: 0.18 };
const postSupported = !!(renderer.capabilities && renderer.setRenderTarget
    && renderer.getRenderTarget && renderer.setSize);

const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
postQuad.frustumCulled = false;
postScene.add(postQuad);

let sceneTarget = null;
let brightTarget = null;
let blurTargetA = null;
let blurTargetB = null;

function makePostTarget(w, h) {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false
    });
}

function resizePost(width, height) {
    if (!postSupported) {
        return;
    }
    const ratio = (renderer.getPixelRatio && renderer.getPixelRatio()) || 1;
    const fullW = Math.floor(width * ratio);
    const fullH = Math.floor(height * ratio);
    const halfW = Math.floor(fullW / 2);
    const halfH = Math.floor(fullH / 2);
    if (sceneTarget) sceneTarget.dispose();
    if (brightTarget) brightTarget.dispose();
    if (blurTargetA) blurTargetA.dispose();
    if (blurTargetB) blurTargetB.dispose();
    sceneTarget = makePostTarget(fullW, fullH);
    brightTarget = makePostTarget(halfW, halfH);
    blurTargetA = makePostTarget(halfW, halfH);
    blurTargetB = makePostTarget(halfW, halfH);
}

const POST_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const brightMaterial = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.92 } },
    vertexShader: POST_VERTEX,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uThreshold;
        varying vec2 vUv;
        void main() {
            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            float k = max(0.0, l - uThreshold) / max(0.0001, 1.0 - uThreshold);
            gl_FragColor = vec4(c * k, 1.0);
        }`
});
brightMaterial.toneMapped = false;

const blurMaterial = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } },
    vertexShader: POST_VERTEX,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uDir;
        varying vec2 vUv;
        void main() {
            vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.24;
            sum += texture2D(tDiffuse, vUv - uDir).rgb * 0.20;
            sum += texture2D(tDiffuse, vUv + uDir).rgb * 0.20;
            sum += texture2D(tDiffuse, vUv - uDir * 2.0).rgb * 0.12;
            sum += texture2D(tDiffuse, vUv + uDir * 2.0).rgb * 0.12;
            sum += texture2D(tDiffuse, vUv - uDir * 3.0).rgb * 0.06;
            sum += texture2D(tDiffuse, vUv + uDir * 3.0).rgb * 0.06;
            gl_FragColor = vec4(sum, 1.0);
        }`
});
blurMaterial.toneMapped = false;

const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        uBloom: { value: post.strength },
        uVignette: { value: post.vignette }
    },
    vertexShader: POST_VERTEX,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tBloom;
        uniform float uBloom;
        uniform float uVignette;
        varying vec2 vUv;
        void main() {
            vec3 col = texture2D(tDiffuse, vUv).rgb;
            col += texture2D(tBloom, vUv).rgb * uBloom;
            // Vignette douce pour attirer l'œil au centre.
            float v = smoothstep(0.9, 0.35, length(vUv - 0.5));
            col *= mix(1.0 - uVignette, 1.0, v);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
        }`
});
// Le tone mapping est déjà appliqué dans la cible : on ne le refait pas.
compositeMaterial.toneMapped = false;

function renderWithPost() {
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);

    postQuad.material = brightMaterial;
    brightMaterial.uniforms.tDiffuse.value = sceneTarget.texture;
    renderer.setRenderTarget(brightTarget);
    renderer.render(postScene, postCamera);

    postQuad.material = blurMaterial;
    blurMaterial.uniforms.tDiffuse.value = brightTarget.texture;
    blurMaterial.uniforms.uDir.value.set(1 / blurTargetA.width, 0);
    renderer.setRenderTarget(blurTargetA);
    renderer.render(postScene, postCamera);

    blurMaterial.uniforms.tDiffuse.value = blurTargetA.texture;
    blurMaterial.uniforms.uDir.value.set(0, 1 / blurTargetB.height);
    renderer.setRenderTarget(blurTargetB);
    renderer.render(postScene, postCamera);

    postQuad.material = compositeMaterial;
    compositeMaterial.uniforms.tDiffuse.value = sceneTarget.texture;
    compositeMaterial.uniforms.tBloom.value = blurTargetB.texture;
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
}

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
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
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
    resizePost(w, h);
}
window.addEventListener('resize', resize);
// Le navigateur mobile met parfois un instant à recalculer la taille : on insiste.
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
}
// iOS : le viewport ne suffit pas toujours à empêcher le zoom par pincement.
document.addEventListener('gesturestart', event => event.preventDefault());
resize();

// ---------------------------------------------------------------------------
// Lumières
// ---------------------------------------------------------------------------
// Lumière ambiante douce + lumière « ciel/sol » : les volumes sont plus naturels.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const skyLight = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a3f, 0.5);
scene.add(skyLight);

const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.15);
sunLight.position.set(40, 60, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(isMobileDevice ? 512 : 1024, isMobileDevice ? 512 : 1024);
sunLight.shadow.camera.left = -70;
sunLight.shadow.camera.right = 70;
sunLight.shadow.camera.top = 70;
sunLight.shadow.camera.bottom = -70;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 200;
// Ombres plus propres (moins d'« acné » sur le sable et l'eau).
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.03;
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

// ---------------------------------------------------------------------------
// Cycle jour / nuit : le soleil décrit un arc, le ciel et la lumière suivent.
// ---------------------------------------------------------------------------
const DAY_LENGTH = 420;   // durée d'un cycle complet (secondes)
let dayPhase = 0.20;      // 0 = aube, 0,25 = midi, 0,5 = crépuscule, 0,75 = nuit
const SKY_TOP_DAY = new THREE.Color(0x4a9fd8);
const SKY_BOTTOM_DAY = new THREE.Color(0xe6f6fd);
const SKY_TOP_NIGHT = new THREE.Color(0x0b1c33);
const SKY_BOTTOM_NIGHT = new THREE.Color(0x2b3f57);
const SUN_WARM = new THREE.Color(0xffb877);
const SUN_DAY = new THREE.Color(0xfff2cc);

function updateDayNight(dt) {
    dayPhase = (dayPhase + dt / DAY_LENGTH) % 1;
    const angle = dayPhase * Math.PI * 2;
    const daylight = Math.max(0, Math.sin(angle)); // 0 la nuit, 1 en plein jour
    // Soleil : position, couleur et intensité.
    sunLight.position.set(Math.cos(angle) * 70, 12 + daylight * 65, -60);
    sunLight.intensity = 0.25 + daylight * 1.05;
    sunLight.color.copy(SUN_WARM).lerp(SUN_DAY, daylight);
    sunMesh.position.copy(sunLight.position).multiplyScalar(0.75);
    sunGlow.position.copy(sunMesh.position);
    // Ciel (dégradé), brume et fond.
    skyMat.uniforms.topColor.value.copy(SKY_TOP_NIGHT).lerp(SKY_TOP_DAY, daylight);
    skyMat.uniforms.bottomColor.value.copy(SKY_BOTTOM_NIGHT).lerp(SKY_BOTTOM_DAY, daylight);
    scene.background.copy(skyMat.uniforms.bottomColor.value);
    scene.fog.color.copy(skyMat.uniforms.bottomColor.value);
    // Lumières d'ambiance : la nuit reste assez claire pour jouer.
    ambientLight.intensity = 0.42 + daylight * 0.22;
    skyLight.intensity = 0.38 + daylight * 0.30;
    waterUniforms.uLight.value = 0.35 + daylight * 0.65;
}

// ---------------------------------------------------------------------------
// Éclairage d'environnement (IBL) : reflets crédibles sur les matériaux PBR.
// On fabrique un petit « ciel » et on le convertit en carte d'environnement.
// ---------------------------------------------------------------------------
function buildEnvironment() {
    if (!postSupported || typeof THREE.PMREMGenerator !== 'function') {
        return;
    }
    try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        envScene.add(new THREE.Mesh(
            new THREE.SphereGeometry(80, 16, 12),
            new THREE.ShaderMaterial({
                side: THREE.BackSide,
                uniforms: {
                    topColor: { value: new THREE.Color(0x8fc4ee) },
                    bottomColor: { value: new THREE.Color(0x5d6b4a) }
                },
                vertexShader: 'varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
                fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; varying vec3 vP; void main() { float h = normalize(vP).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0); }'
            })
        ));
        const envSun = new THREE.Mesh(
            new THREE.SphereGeometry(7, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        envSun.position.set(24, 40, -30);
        envScene.add(envSun);
        scene.environment = pmrem.fromScene(envScene, 0.05).texture;
        pmrem.dispose();
    } catch (error) {
        // Pas d'environnement disponible : l'éclairage direct suffit.
    }
}

buildEnvironment();

// ---------------------------------------------------------------------------
// Qualité automatique : si les images baissent, on réduit la résolution.
// ---------------------------------------------------------------------------
const QUALITY_MAX = isMobileDevice ? 1.5 : 2;
const QUALITY_MIN = 0.75;
let qualityRatio = Math.min(window.devicePixelRatio || 1, QUALITY_MAX);
let qualityAccum = 0;
let qualityFrames = 0;

function updateQuality(dt) {
    if (!renderer.setPixelRatio || !renderer.getPixelRatio) {
        return;
    }
    qualityAccum += dt;
    qualityFrames += 1;
    if (qualityAccum < 2.5) {
        return;
    }
    const fps = qualityFrames / qualityAccum;
    qualityAccum = 0;
    qualityFrames = 0;
    const ratioMax = Math.min(window.devicePixelRatio || 1, QUALITY_MAX);
    if (fps < 45 && qualityRatio > QUALITY_MIN) {
        qualityRatio = Math.max(QUALITY_MIN, qualityRatio - 0.25);
        renderer.setPixelRatio(qualityRatio);
        resize();
    } else if (fps > 57 && qualityRatio < ratioMax) {
        qualityRatio = Math.min(ratioMax, qualityRatio + 0.25);
        renderer.setPixelRatio(qualityRatio);
        resize();
    }
}

// Nuages
const clouds = [];
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + rand() * 2, 8, 6), cloudMat);
        puff.position.set(j * 4 - 6, rand() * 1.5, rand() * 2);
        puff.scale.y = 0.5;
        cloud.add(puff);
    }
    cloud.position.set(-90 + rand() * 180, 42 + rand() * 22, -120 - rand() * 50);
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
pondBottom.position.set(POND_CENTER.x, -6, POND_CENTER.z);
scene.add(pondBottom);

// Eau : disque « polaire » (anneaux + rayons) pour permettre au shader de
// déformer finement la surface en vagues.
function makeWaterGeometry(radius, rings, segments) {
    const positions = [0, 0, 0];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        const rr = radius * (r / rings);
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            positions.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        }
    }
    // Éventail du centre vers le premier anneau.
    for (let s = 0; s < segments; s++) {
        indices.push(0, 1 + s, 1 + ((s + 1) % segments));
    }
    // Quadrangles entre anneaux voisins.
    for (let r = 1; r < rings; r++) {
        const base = 1 + (r - 1) * segments;
        const next = 1 + r * segments;
        for (let s = 0; s < segments; s++) {
            const s1 = (s + 1) % segments;
            indices.push(base + s, next + s, next + s1);
            indices.push(base + s, next + s1, base + s1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Uniforms de l'eau (partagés avec la houle calculée côté JavaScript).
const waterUniforms = {
    uTime: { value: 0 },
    uWindDir: { value: new THREE.Vector2(1, 0) },
    uWind: { value: 0 },
    uLight: { value: 1 },
    uEnv: { value: null },
    uReflect: { value: 0 },
    uShallow: { value: new THREE.Color(0x6fc0dd) },
    uDeep: { value: new THREE.Color(0x1f6f8b) },
    uSky: { value: new THREE.Color(0xd6edf6) }
};

// Eau transparente avec des vagues dont l'amplitude et la vitesse suivent le
// vent. La normale est calculée à partir du gradient de la houle (éclairage).
const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: waterUniforms,
    vertexShader: `
        uniform float uTime;
        uniform vec2 uWindDir;
        uniform float uWind;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        // Hauteur de la houle + son gradient (pour la normale).
        float waveHeight(vec2 p, float t, out vec2 grad) {
            float amp = 0.11 * (0.5 + uWind * 1.8);
            vec2 d = normalize(uWindDir + vec2(0.0001, 0.0));
            vec2 perp = vec2(-d.y, d.x);
            float a = dot(p, d) * 0.30 - t * (1.1 + uWind * 2.6);
            float b = dot(p, perp) * 0.45 + t * 1.6;
            float c = (p.x * 0.22 + p.y * 0.18) - t * 2.0;
            float h = sin(a) * amp + sin(b) * amp * 0.55 + sin(c) * amp * 0.35;
            grad = d * (cos(a) * amp * 0.30)
                 + perp * (cos(b) * amp * 0.55 * 0.45)
                 + vec2(0.22, 0.18) * (cos(c) * amp * 0.35);
            return h;
        }
        void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vec2 grad;
            wp.y += waveHeight(wp.xz, uTime, grad);
            vWorldPos = wp.xyz;
            vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));
            gl_Position = projectionMatrix * viewMatrix * wp;
        }
    `,
    fragmentShader: `
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        uniform vec3 uSky;
        uniform float uWind;
        uniform float uLight;
        uniform samplerCube uEnv;
        uniform float uReflect;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        void main() {
            vec3 n = normalize(vNormal);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);
            vec3 col = mix(uDeep, uShallow, clamp(n.y, 0.0, 1.0));
            col = mix(col, uSky, fres * 0.45);
            // Reflets du décor (optionnels) : cube rendu de temps en temps.
            if (uReflect > 0.001) {
                vec3 refl = reflect(-viewDir, n);
                col = mix(col, textureCube(uEnv, refl).rgb, uReflect * (0.2 + fres * 0.5));
            }
            // La nuit, l'eau s'assombrit (cohérent avec la lumière de la scène).
            col *= mix(vec3(0.30, 0.36, 0.48), vec3(1.0), uLight);
            vec3 sunDir = normalize(vec3(0.4, 1.0, -0.6));
            vec3 halfDir = normalize(viewDir + sunDir);
            float spec = pow(max(dot(n, halfDir), 0.0), 60.0) * (0.35 + uWind * 0.8) * uLight;
            col += vec3(spec);
            float alpha = 0.52 + fres * 0.3;
            gl_FragColor = vec4(col, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
});

const water = new THREE.Mesh(makeWaterGeometry(POND_RADIUS, 22, 64), waterMaterial);
water.position.set(POND_CENTER.x, 0, POND_CENTER.z);
scene.add(water);

// ---------------------------------------------------------------------------
// Reflets sur l'eau (optionnels) : un cube-mapping rendu de temps en temps.
// Désactivé par défaut (coûteux) ; activable depuis le carnet.
// ---------------------------------------------------------------------------
const reflections = { enabled: false };
let cubeCamera = null;
let cubeTarget = null;
let reflectionTimer = 0;
if (postSupported && THREE.CubeCamera && THREE.WebGLCubeRenderTarget) {
    try {
        cubeTarget = new THREE.WebGLCubeRenderTarget(128, {
            generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter
        });
        cubeCamera = new THREE.CubeCamera(0.5, 320, cubeTarget);
        cubeCamera.position.set(POND_CENTER.x, 1.6, POND_CENTER.z);
        scene.add(cubeCamera);
    } catch (error) {
        cubeCamera = null;
    }
}

function setReflections(value) {
    reflections.enabled = !!value && !!cubeCamera;
    waterUniforms.uReflect.value = reflections.enabled ? 0.75 : 0;
}

function updateReflections(dt) {
    if (!reflections.enabled || !cubeCamera) {
        return;
    }
    reflectionTimer -= dt;
    if (reflectionTimer > 0) {
        return;
    }
    reflectionTimer = 2.5;   // on espace les mises à jour (coûteux)
    try {
        water.visible = false;
        cubeCamera.update(renderer, scene);
        water.visible = true;
        waterUniforms.uEnv.value = cubeTarget.texture;
    } catch (error) {
        // Pas de reflets disponibles : on revient au rendu simple.
        water.visible = true;
        setReflections(false);
    }
}

// Même houle que le shader, côté JavaScript : servez-vous en pour faire flotter
// le bouchon sur les vagues.
function waterWaveHeightAt(x, z, t) {
    const amp = 0.11 * (0.5 + wind.strength * 1.8);
    const dx = Math.cos(wind.dir);
    const dz = Math.sin(wind.dir);
    const px = -dz;
    const pz = dx;
    const a = (x * dx + z * dz) * 0.30 - t * (1.1 + wind.strength * 2.6);
    const b = (x * px + z * pz) * 0.45 + t * 1.6;
    const c = (x * 0.22 + z * 0.18) - t * 2.0;
    return Math.sin(a) * amp + Math.sin(b) * amp * 0.55 + Math.sin(c) * amp * 0.35;
}

function updateWater(t) {
    waterUniforms.uTime.value = t;
    waterUniforms.uWindDir.value.set(Math.cos(wind.dir), Math.sin(wind.dir));
    waterUniforms.uWind.value = wind.strength;
}

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

// Objets temporaires réutilisés pour composer les matrices d'instances
// (aucune allocation dans les boucles).
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _vec = new THREE.Vector3();
const _scl = new THREE.Vector3();
const _euler = new THREE.Euler();
const UNIT_Z = new THREE.Vector3(0, 0, 1);

// Arbres : un seul appel de dessin pour tous les troncs, un autre pour le feuillage.
const TREE_MAX = 40;
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

function addTree(x, z, scale) {
    // Tronc
    _vec.set(x, 1.5 * scale - 0.4, z);
    _scl.set(scale, scale, scale);
    _quat.identity();
    _mat4.compose(_vec, _quat, _scl);
    trunkInst.setMatrixAt(trunkCount++, _mat4);
    // Feuillage : 3 cônes empilés (géométrie unitaire mise à l'échelle)
    for (let i = 0; i < 3; i++) {
        const r = (2.4 - i * 0.55) * scale;
        const h = (2.6 - i * 0.4) * scale;
        _vec.set(x, (3 + i * 1.5) * scale - 0.4, z);
        _scl.set(r, h, r);
        _mat4.compose(_vec, _quat, _scl);
        foliageInst.setMatrixAt(foliageCount++, _mat4);
    }
}

for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2 + rand() * 0.1;
    const radius = POND_RADIUS + 8 + rand() * 35;
    const x = POND_CENTER.x + Math.cos(angle) * radius;
    const z = POND_CENTER.z + Math.sin(angle) * radius;
    // Laisse dégagé l'espace devant la caméra et le pêcheur.
    if (z > 5 && Math.abs(x) < 30) {
        continue;
    }
    addTree(x, z, 0.8 + rand() * 0.7);
}
trunkInst.count = trunkCount;
foliageInst.count = foliageCount;
trunkInst.instanceMatrix.needsUpdate = true;
foliageInst.instanceMatrix.needsUpdate = true;

// Nénuphars
const lilyPads = [];
const lilyMat = new THREE.MeshStandardMaterial({ color: 0x3f7d4a, roughness: 0.8, side: THREE.DoubleSide });
for (let i = 0; i < 14; i++) {
    const radius = 1.2 + rand() * 1.6;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    const angle = rand() * Math.PI * 2;
    const r = rand() * (POND_RADIUS - 12);
    pad.position.set(POND_CENTER.x + Math.cos(angle) * r, 0.06, POND_CENTER.z + Math.sin(angle) * r);
    scene.add(pad);
    lilyPads.push({ x: pad.position.x, z: pad.position.z, radius: radius });
}

// Roseaux (instanciés : un seul appel de dessin). Pivot à la base pour
// qu'ils puissent se balancer au vent.
const reedMat = new THREE.MeshStandardMaterial({ color: 0x2f6b3f, roughness: 0.9 });
const reedGeo = new THREE.CylinderGeometry(0.05, 0.09, 1, 5);
reedGeo.translate(0, 0.5, 0);
const reedInst = new THREE.InstancedMesh(reedGeo, reedMat, 40);
let reedCount = 0;
for (let i = 0; i < 40; i++) {
    const angle = rand() * Math.PI * 2;
    const r = POND_RADIUS - 1 - rand() * 5;
    const x = POND_CENTER.x + Math.cos(angle) * r;
    const z = POND_CENTER.z + Math.sin(angle) * r;
    const h = 2 + rand() * 2.5;
    const rotZ = (rand() - 0.5) * 0.25;
    _vec.set(x, 0, z);
    _quat.setFromAxisAngle(UNIT_Z, rotZ);
    _scl.set(1, h, 1);
    _mat4.compose(_vec, _quat, _scl);
    reedInst.setMatrixAt(reedCount++, _mat4);
}
reedInst.count = reedCount;
reedInst.instanceMatrix.needsUpdate = true;
scene.add(reedInst);

// Rochers (instanciés).
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 1 });
const rockInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMat, 12);
rockInst.castShadow = true;
for (let i = 0; i < 12; i++) {
    const angle = rand() * Math.PI * 2;
    const r = POND_RADIUS + 3 + rand() * 12;
    const s = 0.6 + rand() * 1.3;
    _vec.set(POND_CENTER.x + Math.cos(angle) * r, 0.2, POND_CENTER.z + Math.sin(angle) * r);
    _euler.set(rand(), rand(), rand());
    _quat.setFromEuler(_euler);
    _scl.set(s, s, s);
    _mat4.compose(_vec, _quat, _scl);
    rockInst.setMatrixAt(i, _mat4);
}
rockInst.instanceMatrix.needsUpdate = true;
scene.add(rockInst);

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

// La canne est regroupée depuis sa base : on peut ainsi la faire plier.
const rodGroup = new THREE.Group();
rodGroup.position.copy(rodBase);
scene.add(rodGroup);

const rodMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
const rodLocalTip = rodTip.clone().sub(rodBase);
rodGroup.add(cylinderBetween(new THREE.Vector3(0, 0, 0), rodLocalTip, 0.08, rodMat));

const handleEnd = rodLocalTip.clone().multiplyScalar(0.2);
rodGroup.add(cylinderBetween(new THREE.Vector3(0, 0, 0), handleEnd, 0.15, new THREE.MeshStandardMaterial({ color: 0x3b2a1a })));

const reel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.22, 14),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 })
);
reel.position.copy(handleEnd).add(new THREE.Vector3(0.25, -0.25, 0));
reel.rotation.z = Math.PI / 2;
rodGroup.add(reel);

// Pliage de la canne + position VISUELLE du bout (la ligne part de là).
// `rodTip` reste la référence logique (distances, tests) et ne bouge pas.
const rodTipVisual = rodTip.clone();
const ROD_BEND_AXIS = new THREE.Vector3(1, 0, 0);
let rodBend = 0;

function updateRod(dt) {
    const target = (floatState === 'struggle' || floatState === 'reeling') ? tension * 0.5
        : (floatState === 'bite' ? 0.10 : 0);
    rodBend += (target - rodBend) * Math.min(1, dt * 6);
    rodGroup.rotation.x = -rodBend;
    rodTipVisual.copy(rodLocalTip).applyAxisAngle(ROD_BEND_AXIS, -rodBend).add(rodBase);
}

// ---------------------------------------------------------------------------
// Ligne + flotteur
// ---------------------------------------------------------------------------
// Ligne préallouée (aucune allocation par image) : on écrit dans le tampon.
const LINE_SEGMENTS = 12;
const linePositions = new Float32Array((LINE_SEGMENTS + 1) * 3);
const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x222222 }));
line.frustumCulled = false;
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
// Amorçage : lancer une boule de nourriture pour attirer les poissons
// ---------------------------------------------------------------------------
// Le joueur arme le mode avec le bouton « Nourrir », clique sur l'eau en
// maintenant le doigt (ou la souris) pour viser, puis relâche : la puissance
// dépend du moment du relâchement (la jauge oscille toute seule). La boule suit
// un arc de cercle, poussée par le vent, et crée à l'atterrissage un nuage de
// miettes qui attire les poissons — et dérive doucement au vent.
const FEED_MIN_RANGE = 6;          // distance mini d'un lancer (unités)
const FEED_MAX_RANGE = 46;         // distance maxi (jauge à fond)
const FEED_FLIGHT_DURATION = 0.9;  // durée du vol de la boule (s)
const FEED_OSC_SPEED = 1.5;        // vitesse de base de l'oscillation (tours/s)
const FEED_WIND_FACTOR = 5;        // décalage dû au vent pendant le vol
const CHUM_ATTRACT_RADIUS = 20;    // zone où les poissons sentent l'amorce
const CHUM_ATTRACT_ACCEL = 6;      // force d'attirance (unités/s²)
const CHUM_DRIFT = 0.25;           // dérive du nuage au vent
const CHUM_LIFETIME = 16;          // durée de vie du nuage (s)

let feedMode = false;              // le mode amorçage est-il armé ?
let feedState = 'idle';            // 'idle' | 'charging' | 'flying'
let feedPower = 0;                 // puissance courante (0..1), oscille
let feedTargetPower = 0;           // puissance « idéale » pour atteindre la visée
let feedPhase = 0;                 // phase de l'oscillation
let feedChargeT = 0;               // temps de maintien
let feedFlyT = 0;                  // avancement du vol (0..1)
let chum = null;                   // nuage de miettes en cours
let armSwing = 0;                  // bras : 0 = repos, 1 = armé (en arrière)
let armThrow = 0;                  // bras : impulsion de lancer

const feedAim = new THREE.Vector3(0, 0.1, -25);
const feedLanding = new THREE.Vector3(0, 0.1, -25);
const feedOrigin = new THREE.Vector3(-3.2, 3.0, 16.6);

// La boule de nourriture : une petite boule beige.
const feedBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xcdb56f, roughness: 0.95 })
);
feedBall.castShadow = true;
feedBall.visible = false;
scene.add(feedBall);

// Texture douce d'une « bouffée » de miettes.
function makeChumTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(226,255,228,0.9)');
    grad.addColorStop(0.5, 'rgba(184,236,196,0.45)');
    grad.addColorStop(1, 'rgba(160,220,175,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}

// Distance de visée → puissance nécessaire pour tomber pile dessus.
function feedPowerForDistance(distance) {
    return Math.max(0, Math.min(1,
        (distance - FEED_MIN_RANGE) / (FEED_MAX_RANGE - FEED_MIN_RANGE)));
}

function feedAimDistance() {
    return Math.hypot(feedAim.x - angler.position.x, feedAim.z - angler.position.z);
}

function updateFeedGauge() {
    feedGaugeFill.style.width = (feedPower * 100).toFixed(0) + '%';
    feedGaugeTarget.style.left = (feedTargetPower * 100).toFixed(0) + '%';
}

function setFeedMode(on) {
    if (on && floatState !== 'idle') {
        statusDisplay.textContent = 'Ramène d’abord la ligne pour pouvoir amorcer.';
        return;
    }
    feedMode = !!on && floatState === 'idle';
    feedButton.classList.toggle('active', feedMode);
    feedButton.textContent = feedMode ? '🥣 Nourrir (armé)' : '🥣 Nourrir';
    if (feedMode) {
        statusDisplay.textContent = 'Amorçage : clique et maintiens sur l’eau pour viser, puis relâche pour doser la puissance.';
    } else if (feedState === 'idle') {
        statusDisplay.textContent = 'Clique sur l’eau pour lancer la ligne.';
    }
}

function startFeedCharge(point) {
    if (feedState !== 'idle') {
        return;
    }
    feedState = 'charging';
    feedChargeT = 0;
    feedPhase = 0;
    feedPower = 0;
    feedAim.set(point.x, 0.1, point.z);
    feedTargetPower = feedPowerForDistance(feedAimDistance());
    feedGauge.classList.add('active');
    updateFeedGauge();
    ensureSound();
    statusDisplay.textContent = 'Vise… relâche quand la jauge passe sur le repère !';
}

function moveFeedAim(point) {
    if (feedState !== 'charging') {
        return;
    }
    feedAim.set(point.x, 0.1, point.z);
    feedTargetPower = feedPowerForDistance(feedAimDistance());
    updateFeedGauge();
}

function computeFeedLanding() {
    let ax = feedAim.x - angler.position.x;
    let az = feedAim.z - angler.position.z;
    let d = Math.hypot(ax, az);
    if (d < 0.01) {
        // Visée collée au pêcheur : on tire vers le centre de l'étang.
        ax = POND_CENTER.x - angler.position.x;
        az = POND_CENTER.z - angler.position.z;
        d = Math.hypot(ax, az) || 1;
    }
    const range = FEED_MIN_RANGE + feedPower * (FEED_MAX_RANGE - FEED_MIN_RANGE);
    let lx = angler.position.x + (ax / d) * range;
    let lz = angler.position.z + (az / d) * range;
    // Le vent pousse la boule pendant le vol.
    lx += Math.cos(wind.dir) * wind.strength * FEED_WIND_FACTOR;
    lz += Math.sin(wind.dir) * wind.strength * FEED_WIND_FACTOR;
    // La boule retombe dans l'étang.
    const dx = lx - POND_CENTER.x;
    const dz = lz - POND_CENTER.z;
    const dd = Math.hypot(dx, dz);
    const maxR = POND_RADIUS - 2;
    if (dd > maxR) {
        lx = POND_CENTER.x + (dx / dd) * maxR;
        lz = POND_CENTER.z + (dz / dd) * maxR;
    }
    feedLanding.set(lx, 0.1, lz);
}

function releaseFeed() {
    if (feedState !== 'charging') {
        return;
    }
    feedState = 'flying';
    feedFlyT = 0;
    feedGauge.classList.remove('active');
    computeFeedLanding();
    feedBall.position.copy(feedOrigin);
    feedBall.visible = true;
    sound.cast();
    statusDisplay.textContent = 'Lancer de l’amorce…';
}

// Crée le nuage de miettes qui attire les poissons.
function spawnChum(position) {
    if (chum) {
        scene.remove(chum.group);
        chum = null;
    }
    const group = new THREE.Group();
    const material = new THREE.SpriteMaterial({
        map: makeChumTexture(), transparent: true, depthWrite: false, opacity: 0
    });
    // Quelques « bouffées » disposées en cercle (positions fixes : aucun
    // tirage aléatoire, pour garder les tests reproductibles).
    for (let i = 0; i < 6; i++) {
        const sprite = new THREE.Sprite(material);
        const angle = (i / 6) * Math.PI * 2;
        const r = 1.2 + (i % 3) * 1.4;
        sprite.position.set(Math.cos(angle) * r, 0.4 + (i % 3) * 0.4, Math.sin(angle) * r);
        const s = 4 + (i % 3) * 1.5;
        sprite.scale.set(s, s * 0.7, 1);
        group.add(sprite);
    }
    group.position.set(position.x, 0.4, position.z);
    scene.add(group);
    chum = {
        group: group,
        material: material,
        position: new THREE.Vector3(position.x, 0.1, position.z),
        age: 0,
        lifetime: CHUM_LIFETIME,
        radius: CHUM_ATTRACT_RADIUS,
        strength: 0
    };
    spawnRipple(position);
}

function landFeed() {
    feedState = 'idle';
    feedBall.visible = false;
    sound.splash();
    spawnSplash(feedLanding);
    spawnChum(feedLanding);
    setFeedMode(false);
    statusDisplay.textContent = 'Amorce lancée ! Les poissons s’approchent du nuage de miettes…';
}

function cancelFeed() {
    if (feedState === 'charging') {
        feedState = 'idle';
        feedGauge.classList.remove('active');
        setFeedMode(false);
    }
}

function updateChum(dt) {
    if (!chum) {
        return;
    }
    chum.age += dt;
    if (chum.age >= chum.lifetime) {
        scene.remove(chum.group);
        chum = null;
        return;
    }
    // Le nuage dérive doucement avec le vent.
    chum.position.x += Math.cos(wind.dir) * wind.strength * CHUM_DRIFT * dt;
    chum.position.z += Math.sin(wind.dir) * wind.strength * CHUM_DRIFT * dt;
    const dx = chum.position.x - POND_CENTER.x;
    const dz = chum.position.z - POND_CENTER.z;
    const dd = Math.hypot(dx, dz);
    const maxR = POND_RADIUS - 6;
    if (dd > maxR) {
        chum.position.x = POND_CENTER.x + (dx / dd) * maxR;
        chum.position.z = POND_CENTER.z + (dz / dd) * maxR;
    }
    // Apparition en douceur, puis disparition en fondu.
    const fadeIn = Math.min(1, chum.age / 1.2);
    const fadeOut = Math.min(1, Math.max(0, (chum.lifetime - chum.age) / 3));
    chum.strength = Math.min(fadeIn, fadeOut);
    chum.group.position.set(chum.position.x, 0.4, chum.position.z);
    chum.material.opacity = 0.55 * chum.strength;
    const pulse = 1 + Math.sin(chum.age * 1.5) * 0.06;
    chum.group.scale.set(pulse, pulse, pulse);
    chum.group.rotation.y += dt * 0.15;
}

function updateFeed(dt) {
    if (feedState === 'charging') {
        feedChargeT += dt;
        // La jauge oscille de plus en plus vite : il faut choisir son moment.
        const speed = FEED_OSC_SPEED + Math.min(0.6, feedChargeT * 0.15);
        feedPhase += speed * dt;
        const m = ((feedPhase % 2) + 2) % 2;
        feedPower = m < 1 ? m : 2 - m;
        updateFeedGauge();
    } else if (feedState === 'flying') {
        feedFlyT += dt / FEED_FLIGHT_DURATION;
        const t = Math.min(1, feedFlyT);
        const x = feedOrigin.x + (feedLanding.x - feedOrigin.x) * t;
        const z = feedOrigin.z + (feedLanding.z - feedOrigin.z) * t;
        const arc = 3 + feedPower * 5;
        const y = feedOrigin.y + (feedLanding.y - feedOrigin.y) * t + Math.sin(Math.PI * t) * arc;
        feedBall.position.set(x, y, z);
        feedBall.rotation.x += dt * 8;
        feedBall.rotation.z += dt * 6;
        if (feedFlyT >= 1) {
            landFeed();
        }
    }
}

// Animation du bras du pêcheur : repos → armé (visée) → lancer.
function updateArm(dt) {
    const targetSwing = feedState === 'charging' ? 1 : 0;
    const targetThrow = feedState === 'flying' ? 1 : 0;
    armSwing += (targetSwing - armSwing) * Math.min(1, dt * 8);
    armThrow += (targetThrow - armThrow) * Math.min(1, dt * 12);
    arm.rotation.z = -0.9 - armSwing * 0.9 + armThrow * 1.6;
    arm.rotation.x = 0.4 - armSwing * 1.0 + armThrow * 0.8;
    arm.position.y = 2.1 + armSwing * 0.4;
}

// La barre d'outils du pêcheur (Nourrir / Carnet / compteur) reste à un endroit
// FIXE, en bas à gauche (juste à côté du pêcheur), et disparaît pendant
// l'action (ferrage, combat, remontée, lancer) pour ne rien masquer.
function updateToolDock() {
    const resting = floatState === 'idle' || floatState === 'inWater';
    const visible = resting && cameraMode === 'normal';
    toolDock.classList.toggle('hidden', !visible);
    // On ne peut amorcer qu'au repos, sans ligne à l'eau.
    feedButton.disabled = floatState !== 'idle';
}

// ---------------------------------------------------------------------------
// Bourriche (panier à poissons) et lancer du poisson
// ---------------------------------------------------------------------------
// Après avoir ramené un poisson au bord, il faut le LANCER dans la bourriche,
// comme l'amorce : on appuie, on maintient (la puissance oscille), on relâche
// au bon moment. Le vent décale le lancer.
const BOURRICHE_POS = new THREE.Vector3(-12, 0.1, 13);
const BOURRICHE_RADIUS = 1.6;      // rayon de la gueule (tolérance d'entrée)
const FISH_THROW_MIN = 2;          // portée mini du lancer du poisson
const FISH_THROW_MAX = 14;         // portée maxi
const FISH_THROW_WIND = 1.6;       // influence du vent sur le lancer
const FISH_THROW_DURATION = 0.8;   // durée du vol (s)
const FISH_THROW_OSC = 1.6;        // vitesse d'oscillation de la jauge

// La bourriche 3D : un anneau (la gueule) et un filet qui pend dans l'eau.
const bourriche = new THREE.Group();
const bourricheRing = new THREE.Mesh(
    new THREE.TorusGeometry(BOURRICHE_RADIUS, 0.09, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x9a7b46, roughness: 0.8 })
);
bourricheRing.rotation.x = Math.PI / 2;
bourricheRing.position.y = 0.12;
bourricheRing.castShadow = true;
bourriche.add(bourricheRing);
const bourricheNet = new THREE.Mesh(
    new THREE.CylinderGeometry(BOURRICHE_RADIUS - 0.1, 0.8, 2.6, 16, 1, true),
    new THREE.MeshStandardMaterial({
        color: 0x33543c, roughness: 0.95, transparent: true, opacity: 0.9, side: THREE.DoubleSide
    })
);
bourricheNet.position.y = -1.2;
bourriche.add(bourricheNet);
bourriche.position.copy(BOURRICHE_POS);
scene.add(bourriche);

// Poisson tenu en main, prêt à être lancé.
let heldFish = null;
let fishThrowState = 'idle';   // 'idle' | 'charging' | 'flying'
let fishThrowPower = 0;
let fishThrowTarget = 0;
let fishThrowPhase = 0;
let fishThrowT = 0;
const fishThrowLanding = new THREE.Vector3();
const fishThrowOrigin = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Carnet de pêche (conservé dans le navigateur quand c'est possible)
// ---------------------------------------------------------------------------
const journal = { total: 0, totalWeight: 0, best: 0, last: [], especes: {} };
const journalStore = (typeof localStorage !== 'undefined') ? localStorage : null;
const JOURNAL_KEY = 'peche_carnet_v1';

function loadJournal() {
    if (!journalStore) {
        return;
    }
    try {
        const raw = journalStore.getItem(JOURNAL_KEY);
        if (!raw) {
            return;
        }
        const data = JSON.parse(raw);
        journal.total = data.total || 0;
        journal.totalWeight = data.totalWeight || 0;
        journal.best = data.best || 0;
        // Migration : les anciennes prises étaient de simples nombres.
        journal.last = Array.isArray(data.last)
            ? data.last.map(entry => (typeof entry === 'number')
                ? { kg: entry, espece: 'Poisson' }
                : { kg: entry.kg || 0, espece: entry.espece || 'Poisson' })
            : [];
        journal.especes = {};
        const brut = (data.especes && typeof data.especes === 'object') ? data.especes : {};
        Object.keys(brut).forEach(nom => {
            const valeur = brut[nom];
            journal.especes[nom] = (typeof valeur === 'number')
                ? { n: valeur, record: 0 }
                : { n: valeur.n || 0, record: valeur.record || 0 };
        });
    } catch (error) {
        // Carnet illisible : on repart de zéro.
    }
}

function saveJournal() {
    if (!journalStore) {
        return;
    }
    try {
        journalStore.setItem(JOURNAL_KEY, JSON.stringify(journal));
    } catch (error) {
        // Stockage indisponible : on continue sans sauvegarder.
    }
}

// Poids affiché : 2 décimales sous 1 kg (un gardon de 0,36 kg).
function fmtPoids(value) {
    return (value < 1 ? value.toFixed(2) : value.toFixed(1)).replace('.', ',') + ' kg';
}

function renderJournal() {
    const nbEspeces = Object.keys(journal.especes).length;
    if (journal.total === 0) {
        journalStats.textContent = 'Aucune prise pour l’instant… Lance la canne !';
    } else {
        journalStats.textContent = 'Prises : ' + journal.total
            + ' · Poids total : ' + fmtPoids(journal.totalWeight)
            + ' · Record : ' + fmtPoids(journal.best)
            + ' · Espèces : ' + nbEspeces;
    }
    // Pas de appendChild ici : le carnet s'affiche en texte simple.
    journalList.textContent = journal.last.length
        ? journal.last.map(prise => '🐟 ' + prise.espece + ' — ' + fmtPoids(prise.kg)).join('\n')
        : '';
    // Fiche des espèces : nombre de prises et record pour chaque espèce attrapée.
    const nomsEspeces = Object.keys(journal.especes);
    journalEspeces.textContent = nomsEspeces.length
        ? nomsEspeces.map(nom => {
            const fiche = journal.especes[nom];
            return '🐟 ' + nom + ' — ' + fiche.n + (fiche.n > 1 ? ' prises' : ' prise')
                + ' · record ' + fmtPoids(fiche.record || 0);
        }).join('\n')
        : 'Attrape ton premier poisson pour remplir la fiche !';
    bourricheLabel.textContent = '🧺 Bourriche : ' + journal.total;
}

function addJournalEntry(weight, espece) {
    journal.total += 1;
    journal.totalWeight = Math.round((journal.totalWeight + weight) * 100) / 100;
    if (weight > journal.best) {
        journal.best = weight;
    }
    const nom = espece || 'Poisson';
    journal.last.unshift({ kg: Math.round(weight * 100) / 100, espece: nom });
    if (journal.last.length > 12) {
        journal.last.length = 12;
    }
    journal.especes[nom] = journal.especes[nom] || { n: 0, record: 0 };
    const fiche = journal.especes[nom];
    fiche.n += 1;
    if (weight > fiche.record) {
        fiche.record = Math.round(weight * 100) / 100;
    }
    saveJournal();
    renderJournal();
}

function showJournal() {
    renderJournal();
    journalPanel.classList.add('open');
}

function hideJournal() {
    journalPanel.classList.remove('open');
}

function setDifficulty(mode) {
    const preset = DIFFICULTY_MODES[mode] || DIFFICULTY_MODES.normal;
    DIFFICULTY = preset.difficulty;
    BITE_WINDOW = preset.biteWindow;
    if (difficultySelect.value !== mode) {
        difficultySelect.value = mode;
    }
}

// ---------------------------------------------------------------------------
// Lancer du poisson dans la bourriche
// ---------------------------------------------------------------------------
function bourricheDistance() {
    return Math.hypot(BOURRICHE_POS.x - angler.position.x, BOURRICHE_POS.z - angler.position.z);
}

function fishThrowPowerFor(distance) {
    return Math.max(0, Math.min(1,
        (distance - FISH_THROW_MIN) / (FISH_THROW_MAX - FISH_THROW_MIN)));
}

// Le poisson est amené au bord : on le garde en main et on invite à le lancer.
function startHoldingFish(fish) {
    heldFish = fish;
    hookedFish = null;
    fish.userData.hooked = false;
    fish.userData.biting = false;
    fish.visible = true;
    fish.scale.setScalar(fish.userData.size * 0.75);
    fish.rotation.set(0, Math.PI, Math.PI / 2);
    fish.position.set(angler.position.x + 1.1, 2.4, angler.position.z - 0.9);
    floatState = 'holding';
    floatGroup.position.copy(floatIdle);
    fishThrowState = 'idle';
    fishThrowTarget = fishThrowPowerFor(bourricheDistance());
    fishButton.disabled = true;
    fishButton.textContent = 'Lance le poisson !';
    const espece = fish.userData.espece ? fish.userData.espece + ' ' : '';
    statusDisplay.textContent = espece + 'au bord ! Lance-le dans la bourriche 🧺 (appuie, maintiens, relâche au bon moment).';
}

function setFishThrowPower(value) {
    fishThrowPower = Math.max(0, Math.min(1, value));
    feedGaugeFill.style.width = (fishThrowPower * 100).toFixed(0) + '%';
}

function startFishThrow() {
    if (floatState !== 'holding' || fishThrowState !== 'idle') {
        return;
    }
    fishThrowState = 'charging';
    fishThrowPhase = 0;
    fishThrowTarget = fishThrowPowerFor(bourricheDistance());
    setFishThrowPower(0);
    feedGauge.classList.add('active');
    feedGaugeTarget.style.left = (fishThrowTarget * 100).toFixed(0) + '%';
    ensureSound();
    statusDisplay.textContent = 'Dose la puissance : relâche quand la jauge passe sur le repère !';
}

function computeFishThrowLanding() {
    const dx = BOURRICHE_POS.x - angler.position.x;
    const dz = BOURRICHE_POS.z - angler.position.z;
    const d = Math.hypot(dx, dz) || 1;
    const range = FISH_THROW_MIN + fishThrowPower * (FISH_THROW_MAX - FISH_THROW_MIN);
    fishThrowLanding.set(
        angler.position.x + (dx / d) * range + Math.cos(wind.dir) * wind.strength * FISH_THROW_WIND,
        0.1,
        angler.position.z + (dz / d) * range + Math.sin(wind.dir) * wind.strength * FISH_THROW_WIND
    );
}

function releaseFishThrow() {
    if (fishThrowState !== 'charging') {
        return;
    }
    fishThrowState = 'flying';
    fishThrowT = 0;
    feedGauge.classList.remove('active');
    computeFishThrowLanding();
    fishThrowOrigin.set(angler.position.x + 1.1, 2.6, angler.position.z - 0.9);
    if (heldFish) {
        heldFish.position.copy(fishThrowOrigin);
    }
    sound.cast();
    statusDisplay.textContent = 'Lancer du poisson…';
}

function finishHolding() {
    fishThrowState = 'idle';
    feedGauge.classList.remove('active');
    fishButton.disabled = false;
    fishButton.textContent = 'Lancer la canne';
    floatState = 'idle';
    fishCaught = false;
    escaped = false;
    floatGroup.position.copy(floatIdle);
}

// Réussi : le poisson tombe dans la bourriche (score + carnet).
function storeHeldFish() {
    const fish = heldFish;
    finishHolding();
    heldFish = null;
    if (!fish) {
        return;
    }
    const weight = fish.userData.weight;
    scene.remove(fish);
    const index = fishes.indexOf(fish);
    if (index >= 0) {
        fishes.splice(index, 1);
    }
    spawnFish();
    caughtWeight = weight;
    score++;
    scoreDisplay.textContent = score;
    showCatchMessage(weight, fish.userData.espece);
    addJournalEntry(weight, fish.userData.espece);
    sound.catchFish();
    spawnRipple(BOURRICHE_POS);
    spawnSplash(BOURRICHE_POS);
    statusDisplay.textContent = 'Dans la bourriche ! ' + fish.userData.espece + ' — '
        + fmtPoids(weight) + ' (+1) 🧺';
}

// Raté : le poisson retombe à l'eau et repart.
function dropHeldFish() {
    const fish = heldFish;
    finishHolding();
    heldFish = null;
    if (!fish) {
        return;
    }
    fish.scale.setScalar(fish.userData.size);
    fish.rotation.set(0, 0, 0);
    fish.userData.depth = Math.min(fish.userData.depth, -1.2);
    fish.position.set(fishThrowLanding.x,
        fish.userData.depth - fish.userData.topOffset, fishThrowLanding.z);
    fish.userData.vx = Math.cos(wind.dir) * 2;
    fish.userData.vz = Math.sin(wind.dir) * 2;
    spawnRipple(fishThrowLanding);
    spawnSplash(fishThrowLanding);
    sound.escape();
    statusDisplay.textContent = 'Raté ! Le poisson est retombé à l’eau…';
}

function updateFishThrow(dt) {
    if (fishThrowState === 'charging') {
        fishThrowPhase += FISH_THROW_OSC * dt;
        const m = ((fishThrowPhase % 2) + 2) % 2;
        setFishThrowPower(m < 1 ? m : 2 - m);
    } else if (fishThrowState === 'flying') {
        fishThrowT += dt / FISH_THROW_DURATION;
        const t = Math.min(1, fishThrowT);
        if (heldFish) {
            heldFish.position.set(
                fishThrowOrigin.x + (fishThrowLanding.x - fishThrowOrigin.x) * t,
                fishThrowOrigin.y + (fishThrowLanding.y - fishThrowOrigin.y) * t + Math.sin(Math.PI * t) * 3.2,
                fishThrowOrigin.z + (fishThrowLanding.z - fishThrowOrigin.z) * t
            );
            heldFish.rotation.x += dt * 6;
        }
        if (fishThrowT >= 1) {
            const inBourriche = Math.hypot(
                fishThrowLanding.x - BOURRICHE_POS.x,
                fishThrowLanding.z - BOURRICHE_POS.z) < BOURRICHE_RADIUS;
            if (inBourriche) {
                storeHeldFish();
            } else {
                dropHeldFish();
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Lancer de la canne au dosage (même jauge que l'amorce)
// ---------------------------------------------------------------------------
const CAST_MIN_RANGE = 7;      // portée mini (jauge à zéro)
const CAST_MAX_RANGE = 52;     // portée maxi (jauge à fond)
const CAST_OSC = 1.7;          // vitesse d'oscillation de la jauge

let castState = 'idle';        // 'idle' | 'charging'
let castPower = 0;
let castTargetPower = 0;
let castPhase = 0;
const castAim = new THREE.Vector3(0, 0.1, -28);

function castPowerForDistance(distance) {
    return Math.max(0, Math.min(1,
        (distance - CAST_MIN_RANGE) / (CAST_MAX_RANGE - CAST_MIN_RANGE)));
}

function castAimDistance() {
    return Math.hypot(castAim.x - angler.position.x, castAim.z - angler.position.z);
}

function setCastPower(value) {
    castPower = Math.max(0, Math.min(1, value));
    feedGaugeFill.style.width = (castPower * 100).toFixed(0) + '%';
}

function startCastCharge(point) {
    if (castState !== 'idle' || floatState !== 'idle' || feedMode) {
        return;
    }
    castState = 'charging';
    castPhase = 0;
    castAim.set(point.x, 0.1, point.z);
    castTargetPower = castPowerForDistance(castAimDistance());
    setCastPower(0);
    feedGauge.classList.add('active');
    feedGaugeTarget.style.left = (castTargetPower * 100).toFixed(0) + '%';
    ensureSound();
    statusDisplay.textContent = 'Dose la puissance : relâche quand la jauge passe sur le repère !';
}

function moveCastAim(point) {
    if (castState !== 'charging') {
        return;
    }
    castAim.set(point.x, 0.1, point.z);
    castTargetPower = castPowerForDistance(castAimDistance());
    feedGaugeTarget.style.left = (castTargetPower * 100).toFixed(0) + '%';
}

function cancelCast() {
    if (castState === 'charging') {
        castState = 'idle';
        feedGauge.classList.remove('active');
        statusDisplay.textContent = 'Lancer annulé. Clique sur l’eau pour réessayer.';
    }
}

function releaseCast() {
    if (castState !== 'charging') {
        return;
    }
    castState = 'idle';
    feedGauge.classList.remove('active');
    // Le point de chute dépend de la puissance choisie : c'est le geste à réussir.
    const dx = castAim.x - angler.position.x;
    const dz = castAim.z - angler.position.z;
    const d = Math.hypot(dx, dz) || 1;
    const range = CAST_MIN_RANGE + castPower * (CAST_MAX_RANGE - CAST_MIN_RANGE);
    startCast(new THREE.Vector3(
        angler.position.x + (dx / d) * range, 0.1, angler.position.z + (dz / d) * range));
}

function updateCast(dt) {
    if (castState !== 'charging') {
        return;
    }
    castPhase += CAST_OSC * dt;
    const m = ((castPhase % 2) + 2) % 2;
    setCastPower(m < 1 ? m : 2 - m);
}

// ---------------------------------------------------------------------------
// Frein du moulinet : on lâche du fil quand le poisson charge (la ligne ne
// casse pas, mais le poisson reprend de la distance).
// ---------------------------------------------------------------------------
let dragLoosened = false;

function setDragLoosened(value) {
    dragLoosened = !!value;
    dragButton.classList.toggle('active', dragLoosened);
    strugglePanel.classList.toggle('slipping', dragLoosened);
}

dragButton.addEventListener('pointerdown', event => {
    ensureSound();
    if (dragButton.setPointerCapture && event && event.pointerId !== undefined) {
        dragButton.setPointerCapture(event.pointerId);
    }
    setDragLoosened(true);
});
dragButton.addEventListener('pointerup', () => setDragLoosened(false));
dragButton.addEventListener('pointercancel', () => setDragLoosened(false));
dragButton.addEventListener('pointerleave', () => setDragLoosened(false));

// --- Tutoriel d'accueil (montré à la première visite) ----------------------
const TUTORIAL_STEPS = [
    { main: '👆', texte: 'Bienvenue à l’étang du Bois Neuf ! Clique sur l’eau, maintiens pour doser la puissance, puis relâche pour lancer la ligne.' },
    { main: '✊', texte: 'Quand le bouchon mordille puis s’enfonce, clique vite pour ferrer le poisson : un seul essai !' },
    { main: '🔄', texte: 'Tourne la manivelle en cercle pour le ramener. Si la ligne est trop tendue, maintiens « Lâcher du fil ».' },
    { main: '🐟', texte: 'Garde le poisson en main et lance-le dans la bourriche 🧺 (comme l’amorce) pour le ranger dans ton carnet.' }
];
let tutorialStepIndex = 0;
const tutorialStore = (typeof localStorage !== 'undefined') ? localStorage : null;
const TUTORIAL_KEY = 'peche_tuto_vu';

function renderTutorial() {
    const etape = TUTORIAL_STEPS[tutorialStepIndex];
    tutorialText.textContent = etape.texte;
    tutorialHand.textContent = etape.main;
    tutorialStepDisplay.textContent = (tutorialStepIndex + 1) + ' / ' + TUTORIAL_STEPS.length;
    tutorialNext.textContent = (tutorialStepIndex === TUTORIAL_STEPS.length - 1) ? 'Jouer !' : 'Suivant';
}

function openTutorial() {
    tutorialStepIndex = 0;
    renderTutorial();
    tutorial.classList.add('open');
    if (tutorialStore) {
        try {
            tutorialStore.setItem(TUTORIAL_KEY, '1');
        } catch (error) {
            // Stockage indisponible : le tutoriel réapparaîtra.
        }
    }
}

function closeTutorial() {
    tutorial.classList.remove('open');
}

function nextTutorialStep() {
    if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) {
        closeTutorial();
        return;
    }
    tutorialStepIndex += 1;
    renderTutorial();
}

tutorialNext.addEventListener('click', nextTutorialStep);
tutorialClose.addEventListener('click', closeTutorial);
tutorialOpen.addEventListener('click', () => {
    hideJournal();
    openTutorial();
});

let tutorielDejaVu = false;
if (tutorialStore) {
    try {
        tutorielDejaVu = tutorialStore.getItem(TUTORIAL_KEY) === '1';
    } catch (error) {
        tutorielDejaVu = false;
    }
}
if (!tutorielDejaVu) {
    openTutorial();
}

// --- Carnet : ouverture, difficulté, accessibilité -------------------------
journalButton.addEventListener('click', () => {
    ensureSound();
    if (journalPanel.classList.contains('open')) {
        hideJournal();
    } else {
        showJournal();
    }
});
journalClose.addEventListener('click', hideJournal);
difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));
effectsToggle.checked = post.enabled;
effectsToggle.addEventListener('change', () => {
    post.enabled = effectsToggle.checked !== false;
});
reflectionsToggle.checked = reflections.enabled;
reflectionsToggle.addEventListener('change', () => {
    setReflections(reflectionsToggle.checked !== false);
    reflectionsToggle.checked = reflections.enabled;
});
bigTextToggle.addEventListener('change', () => {
    if (document.body) {
        document.body.classList.toggle('big-text', !!bigTextToggle.checked);
    }
});
calmToggle.addEventListener('change', () => {
    if (document.body) {
        document.body.classList.toggle('calm', !!calmToggle.checked);
    }
});

loadJournal();
renderJournal();

// ---------------------------------------------------------------------------
// Météo : beau temps → rafales → pluie. Le cycle est piloté par le TEMPS DE JEU
// (aucun tirage aléatoire) : le monde des tests reste donc reproductible.
// ---------------------------------------------------------------------------
const WEATHER_CYCLE = [
    { nom: 'beau', duree: 70, pluie: 0, rafales: 0 },
    { nom: 'rafales', duree: 45, pluie: 0, rafales: 1 },
    { nom: 'pluie', duree: 60, pluie: 1, rafales: 0.6 }
];
let weatherIndex = 0;
let weatherTimer = WEATHER_CYCLE[0].duree;
let weatherPluie = 0;
let weatherRafales = 0;
let rainRippleTimer = 0;
const GRIS_PLUIE = new THREE.Color(0x6b7a86);

function weatherName() {
    return WEATHER_CYCLE[weatherIndex].nom;
}

function setWeather(nom) {
    for (let i = 0; i < WEATHER_CYCLE.length; i++) {
        if (WEATHER_CYCLE[i].nom === nom) {
            weatherIndex = i;
            weatherTimer = WEATHER_CYCLE[i].duree;
            return;
        }
    }
}

// Gouttes de pluie : quelques centaines de points autour de l'étang.
const RAIN_COUNT = 700;
const rainPositions = new Float32Array(RAIN_COUNT * 3);
for (let i = 0; i < RAIN_COUNT; i++) {
    rainPositions[i * 3] = POND_CENTER.x - 60 + ((i * 37) % 120);
    rainPositions[i * 3 + 1] = -0.2 + ((i * 53) % 32);
    rainPositions[i * 3 + 2] = POND_CENTER.z - 60 + ((i * 71) % 120);
}
const rainGeometry = new THREE.BufferGeometry();
rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainMaterial = new THREE.PointsMaterial({
    color: 0xcfe6f5, size: 0.24, transparent: true, opacity: 0, depthWrite: false
});
const rainPoints = new THREE.Points(rainGeometry, rainMaterial);
rainPoints.frustumCulled = false;
scene.add(rainPoints);

function updateWeather(dt) {
    weatherTimer -= dt;
    if (weatherTimer <= 0) {
        weatherIndex = (weatherIndex + 1) % WEATHER_CYCLE.length;
        weatherTimer = WEATHER_CYCLE[weatherIndex].duree;
    }
    const cible = WEATHER_CYCLE[weatherIndex];
    const k = Math.min(1, dt * 0.5);
    weatherPluie += (cible.pluie - weatherPluie) * k;
    weatherRafales += (cible.rafales - weatherRafales) * k;

    // La pluie assombrit le ciel et la lumière (appelé APRÈS le cycle jour/nuit).
    if (weatherPluie > 0.01) {
        sunLight.intensity *= (1 - 0.5 * weatherPluie);
        ambientLight.intensity = Math.max(0.22, ambientLight.intensity - 0.15 * weatherPluie);
        skyLight.intensity += 0.12 * weatherPluie;
        skyMat.uniforms.topColor.value.lerp(GRIS_PLUIE, 0.5 * weatherPluie);
        skyMat.uniforms.bottomColor.value.lerp(GRIS_PLUIE, 0.35 * weatherPluie);
        scene.background.copy(skyMat.uniforms.bottomColor.value);
    }

    // Gouttes + ondulations sur l'eau.
    rainMaterial.opacity = weatherPluie * 0.75;
    if (weatherPluie > 0.02) {
        const pas = dt * 26;
        for (let i = 0; i < RAIN_COUNT; i++) {
            let y = rainPositions[i * 3 + 1] - pas;
            if (y < -0.2) {
                y = 30 + ((i * 13) % 12);
            }
            rainPositions[i * 3 + 1] = y;
        }
        rainGeometry.attributes.position.needsUpdate = true;
        rainRippleTimer -= dt;
        if (rainRippleTimer <= 0) {
            rainRippleTimer = 0.35;
            const a = rainRippleTimer * 37 + weatherPluie * 11;
            spawnRipple(new THREE.Vector3(
                POND_CENTER.x + Math.cos(a) * 18, 0.06, POND_CENTER.z + Math.sin(a) * 18));
        }
    }
    sound.setRain(weatherPluie);
}

// ---------------------------------------------------------------------------
// Vie ambiante : oiseaux, libellules et poisson qui saute.
// ---------------------------------------------------------------------------
const birds = [];
for (let i = 0; i < 3; i++) {
    const bird = new THREE.Group();
    const corps = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.9 })
    );
    corps.scale.set(1.8, 0.7, 0.8);
    bird.add(corps);
    const ailes = [];
    for (let c = -1; c <= 1; c += 2) {
        const aile = new THREE.Mesh(
            new THREE.PlaneGeometry(2.2, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.9, side: THREE.DoubleSide })
        );
        aile.position.set(0, 0.1, c * 1.1);
        bird.add(aile);
        ailes.push({ mesh: aile, cote: c });
    }
    bird.userData.ailes = ailes;
    bird.userData.phase = i * 2.1;
    scene.add(bird);
    birds.push(bird);
}

const libellules = [];
for (let i = 0; i < 3; i++) {
    const lib = new THREE.Group();
    const corps = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5),
        new THREE.MeshStandardMaterial({ color: 0x2f6f8f, roughness: 0.6 })
    );
    corps.rotation.z = Math.PI / 2;
    lib.add(corps);
    for (let c = -1; c <= 1; c += 2) {
        lib.add(new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.28),
            new THREE.MeshStandardMaterial({
                color: 0xd9f2ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide
            })
        ));
    }
    lib.userData.phase = i * 1.7;
    scene.add(lib);
    libellules.push(lib);
}

// Poisson qui saute hors de l'eau (un seul, réutilisé).
const sauteur = new THREE.Group();
sauteur.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xb9c6c0, roughness: 0.4, metalness: 0.3 })
));
sauteur.visible = false;
scene.add(sauteur);
let sautT = -1;
let sautTimer = 26;
let oiseauTimer = 14;

function updateAmbiante(dt, time) {
    for (let i = 0; i < birds.length; i++) {
        const bird = birds[i];
        const p = bird.userData.phase;
        bird.position.set(
            Math.cos(time * 0.06 + p) * 70,
            24 + Math.sin(time * 0.3 + p) * 2.5,
            -60 + Math.sin(time * 0.06 + p) * 45);
        bird.rotation.y = -time * 0.06 - p + Math.PI / 2;
        const battement = Math.sin(time * 9 + p) * 0.7;
        bird.userData.ailes.forEach(a => { a.mesh.rotation.x = a.cote * (0.2 + battement); });
    }
    for (let i = 0; i < libellules.length; i++) {
        const lib = libellules[i];
        const p = lib.userData.phase;
        lib.position.set(
            POND_CENTER.x + Math.sin(time * 0.9 + p) * 14 + Math.sin(time * 3.1 + p) * 1.5,
            1.2 + Math.sin(time * 2.3 + p) * 0.5,
            POND_CENTER.z + 18 + Math.cos(time * 0.7 + p * 1.3) * 9);
        lib.rotation.y = Math.sin(time * 2 + p) * 0.6;
    }
    if (sautT < 0) {
        sautTimer -= dt;
        if (sautTimer <= 0) {
            sautTimer = 24 - weatherPluie * 8;
            sautT = 0;
            sauteur.position.set(POND_CENTER.x + 8, 0.1, POND_CENTER.z + 22);
            sauteur.visible = true;
            sound.jump();
            spawnRipple(sauteur.position);
        }
    } else {
        sautT += dt;
        const duree = 1.1;
        const t = Math.min(1, sautT / duree);
        sauteur.position.y = 0.1 + Math.sin(Math.PI * t) * 2.6;
        sauteur.rotation.x = -Math.sin(Math.PI * t) * 1.2;
        if (sautT >= duree) {
            sautT = -1;
            sauteur.visible = false;
            sound.jump();
            spawnRipple(sauteur.position);
        }
    }
    oiseauTimer -= dt;
    if (oiseauTimer <= 0) {
        oiseauTimer = 16 + weatherPluie * 10;
        if (weatherPluie < 0.4) {
            sound.birds();
        }
    }
}

// ---------------------------------------------------------------------------
// Bulles : le seul indice de la présence des poissons sous l'eau.
// ---------------------------------------------------------------------------
const bubbles = [];
const bubbleGeo = new THREE.SphereGeometry(0.06, 6, 6);
const bubbleMat = new THREE.MeshBasicMaterial({
    color: 0xdff3ff, transparent: true, opacity: 0.65, depthWrite: false
});

function spawnBubbles(position, count) {
    if (bubbles.length > 70) {
        return;
    }
    for (let i = 0; i < count; i++) {
        const bulle = new THREE.Mesh(bubbleGeo, bubbleMat);
        bulle.position.set(
            position.x + ((i * 7) % 3 - 1) * 0.16,
            Math.max(-3.4, position.y),
            position.z + ((i * 5) % 3 - 1) * 0.16);
        bulle.userData.vy = 0.7 + (i % 3) * 0.25;
        scene.add(bulle);
        bubbles.push({ mesh: bulle, t: 0 });
    }
}

function updateBubbles(dt) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.t += dt;
        b.mesh.position.y += b.mesh.userData.vy * dt;
        if (b.mesh.position.y > 0.05 || b.t > 2.4) {
            scene.remove(b.mesh);
            bubbles.splice(i, 1);
        }
    }
}

// ---------------------------------------------------------------------------
// Poissons
// ---------------------------------------------------------------------------
const fishes = [];
const FISH_COUNT = 20;

// ---------------------------------------------------------------------------
// Espèces d'eau douce : silhouette, longueur réelle (cm), poids, combativité,
// couleurs et motif d'écailles.
//   poids (kg) ≈ K × longueur(cm)³ / 100 000   ← formule réelle des pêcheurs
//   (K = « facteur de condition » : 2,3 pour une carpe bien nourrie, 0,2 pour
//    une anguille très allongée…)
// `abondance` = fréquence relative dans l'étang.
// ---------------------------------------------------------------------------
const SPECIES = [
    { id: 'gardon', nom: 'Gardon', form: 'fusiforme', cm: [12, 32], k: 1.1, abondance: 12,
      combativite: [0.5, 0.8], agressivite: [0.55, 0.85], couleur: 0xbfcbd0, motif: 'argent' },
    { id: 'rotengle', nom: 'Rotengle', form: 'fusiforme', cm: [15, 35], k: 1.1, abondance: 8,
      combativite: [0.5, 0.85], agressivite: [0.6, 0.9], couleur: 0xb9c6c0, nageoires: 0xc0522a, motif: 'argent' },
    { id: 'ablette', nom: 'Ablette', form: 'petit', cm: [8, 18], k: 0.9, abondance: 9,
      combativite: [0.4, 0.65], agressivite: [0.6, 0.95], couleur: 0xd2dcdf, motif: 'argent' },
    { id: 'goujon', nom: 'Goujon', form: 'petit', cm: [10, 22], k: 1.3, abondance: 7,
      combativite: [0.4, 0.7], agressivite: [0.5, 0.8], couleur: 0xc2a878, motif: 'taches' },
    { id: 'breme', nom: 'Brème', form: 'plat', cm: [25, 60], k: 1.8, abondance: 6,
      combativite: [0.55, 0.9], agressivite: [0.5, 0.8], couleur: 0x9d8f63, motif: 'ecailles' },
    { id: 'tanche', nom: 'Tanche', form: 'profond', cm: [25, 55], k: 1.7, abondance: 5,
      combativite: [0.7, 1.05], agressivite: [0.6, 0.95], couleur: 0x4f6b3c, oeil: 0xc0392b, motif: 'mouchetures' },
    { id: 'carpe', nom: 'Carpe', form: 'profond', cm: [35, 95], k: 2.3, abondance: 6,
      combativite: [0.9, 1.2], agressivite: [0.7, 1.05], couleur: 0xa8853f, motif: 'ecailles' },
    { id: 'carassin', nom: 'Carassin', form: 'profond', cm: [18, 40], k: 2.2, abondance: 5,
      combativite: [0.6, 0.9], agressivite: [0.6, 0.95], couleur: 0xb08b3a, motif: 'ecailles' },
    { id: 'perche', nom: 'Perche', form: 'bossu', cm: [15, 45], k: 1.4, abondance: 7,
      combativite: [0.7, 1.05], agressivite: [0.9, 1.25], couleur: 0x6f7a45, nageoires: 0xc0522a, motif: 'rayures' },
    { id: 'chevesne', nom: 'Chevesne', form: 'fusiforme', cm: [25, 60], k: 1.2, abondance: 5,
      combativite: [0.8, 1.15], agressivite: [0.9, 1.25], couleur: 0x9aa39c, motif: 'argent' },
    { id: 'brochet', nom: 'Brochet', form: 'torpille', cm: [40, 120], k: 0.9, abondance: 3,
      combativite: [0.9, 1.25], agressivite: [1.25, 1.6], couleur: 0x4c5c33, motif: 'tachesClaires' },
    { id: 'sandre', nom: 'Sandre', form: 'torpille', cm: [35, 90], k: 0.8, abondance: 2,
      combativite: [0.85, 1.15], agressivite: [1.1, 1.45], couleur: 0x8f9a83, motif: 'barres' },
    { id: 'black-bass', nom: 'Black-bass', form: 'bossu', cm: [25, 55], k: 1.6, abondance: 2,
      combativite: [0.9, 1.2], agressivite: [1.1, 1.5], couleur: 0x556a3f, motif: 'bandeLaterale' },
    { id: 'truite', nom: 'Truite', form: 'fusiforme', cm: [20, 55], k: 1.2, abondance: 2,
      combativite: [0.8, 1.15], agressivite: [1.0, 1.35], couleur: 0x7d6a4a, motif: 'pointsRouges' },
    { id: 'anguille', nom: 'Anguille', form: 'anguille', cm: [40, 110], k: 0.2, abondance: 2,
      combativite: [1.0, 1.4], agressivite: [1.1, 1.5], couleur: 0x3f4a30, motif: 'aucun' },
    { id: 'silure', nom: 'Silure', form: 'barbu', cm: [80, 200], k: 1.0, abondance: 1,
      combativite: [1.1, 1.5], agressivite: [1.2, 1.55], couleur: 0x474b42, motif: 'marbrures' }
];

// Silhouettes 3D : dimensions du corps + longueur totale de référence.
const FORMES = {
    fusiforme: { bodyX: 1.5, bodyY: 0.78, bodyZ: 0.58, queue: 'fourche', dorsale: 0.55, longueurRef: 2.30 },
    profond: { bodyX: 1.6, bodyY: 1.02, bodyZ: 0.72, queue: 'fourche', dorsale: 0.5, longueurRef: 2.42 },
    plat: { bodyX: 1.55, bodyY: 1.3, bodyZ: 0.34, queue: 'fourche', dorsale: 0.75, longueurRef: 2.36 },
    torpille: { bodyX: 2.7, bodyY: 0.62, bodyZ: 0.5, queue: 'arrondie', dorsale: 0.35, dorsaleReculee: true, longueurRef: 3.74 },
    bossu: { bodyX: 1.45, bodyY: 0.95, bodyZ: 0.62, queue: 'fourche', dorsale: 0.7, epines: true, longueurRef: 2.24 },
    anguille: { bodyX: 3.4, bodyY: 0.3, bodyZ: 0.3, queue: 'fine', dorsale: 0, longueurRef: 4.58 },
    barbu: { bodyX: 2.4, bodyY: 0.85, bodyZ: 0.78, queue: 'arrondie', dorsale: 0.4, moustaches: true, longueurRef: 3.38 },
    petit: { bodyX: 1.35, bodyY: 0.72, bodyZ: 0.52, queue: 'fourche', dorsale: 0.45, longueurRef: 2.12 }
};
// Ancien paramètre numérique de « type » → nouvelle silhouette (compatibilité).
const FORMES_PAR_TYPE = ['profond', 'bossu', 'torpille', 'plat'];

// Motifs d'écailles : textures dessinées une seule fois, puis partagées.
// (Uniquement fillRect + fillStyle : compatible partout.)
const _texturesMotif = {};

function makeFishTexture(motif) {
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
            for (let x = 0; x < 8; x++) {
                g.fillRect(x * 8 + (y % 2) * 4, y * 8, 6, 6);
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

function makeFish(size, power, aggression, form, espece) {
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
        map: makeFishTexture(espece ? espece.motif : 'aucun'),
        roughness: 0.35,
        metalness: 0.25
    });
    const finMat = new THREE.MeshStandardMaterial({
        color: (espece && espece.nageoires) ? espece.nageoires : couleur,
        roughness: 0.5,
        metalness: 0.15
    });

    const tailScale = 0.8 + (aggression - 0.6) * 0.5;
    const finScale = 0.6 + (aggression - 0.6) * 0.5;
    const bodyX = forme.bodyX;
    const bodyY = forme.bodyY;
    const bodyZ = forme.bodyZ;

    const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), bodyMat);
    fishBody.scale.set(bodyX, bodyY, bodyZ);
    fishBody.castShadow = true;
    group.add(fishBody);

    // Queue : fourchue, arrondie ou fine selon la silhouette.
    const tailPivot = new THREE.Group();
    tailPivot.position.x = -0.6 * bodyX;
    if (forme.queue === 'fine') {
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22 * tailScale, 1.1 * tailScale, 6), finMat);
        tail.rotation.z = Math.PI / 2;
        tail.scale.z = 0.5;
        tail.position.x = -0.4 * tailScale;
        tailPivot.add(tail);
    } else if (forme.queue === 'arrondie') {
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55 * tailScale, 0.9 * tailScale, 8), finMat);
        tail.rotation.z = Math.PI / 2;
        tail.scale.z = 0.35;
        tail.position.x = -0.4 * tailScale;
        tailPivot.add(tail);
    } else {
        const tail1 = new THREE.Mesh(new THREE.ConeGeometry(0.42 * tailScale, 1.0 * tailScale, 6), finMat);
        tail1.rotation.z = Math.PI / 2;
        tail1.rotation.y = 0.35;
        tail1.position.set(-0.4 * tailScale, 0.18, 0);
        tailPivot.add(tail1);
        const tail2 = tail1.clone();
        tail2.rotation.y = -0.35;
        tail2.position.y = -0.18;
        tailPivot.add(tail2);
    }
    group.add(tailPivot);

    // Nageoire dorsale (épineuse chez la perche, reculée chez le brochet).
    const finHeight = Math.max(0.15, forme.dorsale * 1.5) * finScale;
    if (forme.dorsale > 0) {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.3 * finScale, finHeight, 4), finMat);
        fin.position.set(forme.dorsaleReculee ? -0.35 * bodyX : -0.05, 0.6 * bodyY + finHeight / 2 - 0.05, 0);
        fin.rotation.z = forme.epines ? -0.08 : -0.25;
        fin.scale.z = 0.4;
        group.add(fin);
        if (forme.epines) {
            for (let i = 0; i < 4; i++) {
                const epine = new THREE.Mesh(new THREE.ConeGeometry(0.05 * finScale, 0.28 * finScale, 4), finMat);
                epine.position.set(0.25 - i * 0.16, 0.6 * bodyY + finHeight * 0.7, 0);
                group.add(epine);
            }
        }
    }

    // Petits détails (nageoires pectorales, moustaches, yeux) : regroupés
    // pour pouvoir les cacher de loin (LOD).
    const details = new THREE.Group();
    group.add(details);

    // Nageoires pectorales (2) : présentes chez tous les poissons.
    const pectorale = new THREE.Mesh(new THREE.ConeGeometry(0.18 * finScale, 0.5 * finScale, 5), finMat);
    pectorale.rotation.z = Math.PI / 2.4;
    pectorale.rotation.y = 0.5;
    pectorale.scale.z = 0.35;
    pectorale.position.set(0.25 * bodyX, -0.15 * bodyY, 0.42 * bodyZ);
    details.add(pectorale);
    const pectorale2 = pectorale.clone();
    pectorale2.position.z = -0.42 * bodyZ;
    pectorale2.rotation.y = -0.5;
    details.add(pectorale2);

    // Moustaches (silure, poisson-chat).
    if (forme.moustaches) {
        for (let i = 0; i < 4; i++) {
            const cote = i < 2 ? 1 : -1;
            const moustache = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.7, 4), bodyMat);
            moustache.rotation.z = Math.PI / 2 - cote * 0.25;
            moustache.rotation.y = (i % 2 === 0 ? 0.35 : -0.35);
            moustache.position.set(0.62 * bodyX, 0.02 - (i % 2) * 0.12, cote * 0.12);
            details.add(moustache);
        }
    }

    // Yeux (certaines espèces ont l'œil rouge, comme la tanche).
    const eyeMat = new THREE.MeshStandardMaterial({ color: (espece && espece.oeil) ? espece.oeil : 0x111111 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
    eye1.position.set(0.48 * bodyX, 0.18 * bodyY, 0.3 * bodyZ);
    details.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.z = -0.3 * bodyZ;
    details.add(eye2);

    group.userData.tailPivot = tailPivot;
    group.userData.bodyMat = bodyMat;
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

function randomFishPosition() {
    const angle = rand() * Math.PI * 2;
    const r = rand() * (POND_RADIUS - 12);
    return new THREE.Vector3(
        POND_CENTER.x + Math.cos(angle) * r,
        -2.0,
        POND_CENTER.z + Math.sin(angle) * r
    );
}

function randomFishVelocity() {
    const dir = rand() * Math.PI * 2;
    const speed = 2 + rand() * 2.5;
    return { vx: Math.cos(dir) * speed, vz: Math.sin(dir) * speed };
}

// Poids réaliste : formule du « facteur de condition » des pêcheurs.
function poidsRealisteKilos(espece, longueurCm) {
    return espece.k * Math.pow(longueurCm, 3) / 100000;
}

// Tirage d'espèce pondéré par son abondance dans l'étang.
function pickSpecies() {
    let total = 0;
    for (let i = 0; i < SPECIES.length; i++) {
        total += SPECIES[i].abondance;
    }
    let r = rand() * total;
    for (let i = 0; i < SPECIES.length; i++) {
        r -= SPECIES[i].abondance;
        if (r <= 0) {
            return SPECIES[i];
        }
    }
    return SPECIES[0];
}

function spawnFish() {
    const espece = pickSpecies();
    // Longueur réelle tirée dans la fourchette de l'espèce (cm).
    const longueurCm = espece.cm[0] + rand() * (espece.cm[1] - espece.cm[0]);
    const forme = FORMES[espece.form] || FORMES.fusiforme;
    // Échelle 3D donnant au poisson sa vraie taille (2 unités ≈ 1 m).
    const size = Math.max(0.08, (longueurCm / 50) / forme.longueurRef);
    const power = espece.combativite[0] + rand() * (espece.combativite[1] - espece.combativite[0]);
    const aggression = espece.agressivite[0] + rand() * (espece.agressivite[1] - espece.agressivite[0]);
    const fish = makeFish(size, power, aggression, espece.form, espece);
    fish.position.copy(randomFishPosition());
    const v = randomFishVelocity();
    fish.userData.vx = v.vx;
    fish.userData.vz = v.vz;
    fish.userData.phase = rand() * Math.PI * 2;
    // Profondeur du DOS du poisson (déduite de la phase : aucun tirage aléatoire
    // en plus, pour ne pas décaler le monde reproductible des tests) : le dos
    // reste toujours sous la surface, entre -0,9 et -3,4.
    fish.userData.depth = -0.9 - ((Math.sin(fish.userData.phase) + 1) / 2) * 2.5;
    fish.position.y = fish.userData.depth - fish.userData.topOffset;
    fish.userData.power = power;
    fish.userData.aggression = aggression;
    fish.userData.type = espece.form;
    fish.userData.espece = espece.nom;
    fish.userData.especeId = espece.id;
    // Longueur affichée (cm) : c'est elle qui sert aussi au calcul du poids,
    // pour que le carnet et le poisson soient parfaitement cohérents.
    const longueurAffichee = Math.round(longueurCm);
    fish.userData.longueurCm = longueurAffichee;
    fish.userData.weight = Math.round(poidsRealisteKilos(espece, longueurAffichee) * 1000) / 1000;
    fish.userData.losses = 0;
    fish.userData.hooked = false;
    // Les poissons vivent cachés sous l'eau : seules leurs bulles et leurs
    // sillages indiquent leur présence (ils ne deviennent visibles qu'au combat).
    fish.visible = false;
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
        // Un poisson perdu devient plus rouge (il « chauffe »).
        const base = fish.userData.couleurBase || new THREE.Color(0xffb066);
        const t = Math.min(1, (fish.userData.losses || 0) * 0.2);
        fish.userData.bodyMat.color.copy(base).lerp(new THREE.Color(0xd23a12), t);
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
let biteViewHideTimer = -1; // fermeture différée de la vue bouchon (< 0 = aucune)
let biteNibbleTimer = 0;    // durée du « mordillement » avant la touche franche
// Fenêtre pour ferrer : temps pendant lequel le bouchon s'enfonce avant que le
// poisson ne recrache l'hameçon. Plus elle est courte, plus le ferrage est dur.
let BITE_WINDOW = 0.4;
// Le poisson mordille le bouchon avant de l'enfoncer : le joueur est prévenu.
const BITE_NIBBLE_DURATION = 0.6;
// Durée pendant laquelle on laisse « Trop tard ! » affiché après une touche
// ratée. Comptée par la boucle de jeu (et plus courte que le temps de
// récupération) pour ne jamais refermer une NOUVELLE touche par erreur.
const BITE_VIEW_LINGER = 0.7;
let tension = 0.5;
let struggle = null;
let struggleTimeLeft = 0;
let snag = null;
let hookedFish = null;
let escaped = false;
let timeoutEscape = false;
let shake = 0;
let baitInterest = false;   // un poisson renifle-t-il l'hameçon (retour visuel) ?
let nibbleRippleTimer = 0;  // petites ondulations quand un poisson est tout près
let caughtWeight = 0;
let lineBrokenTimer = 0;
let snagFreed = false;
const castStart = new THREE.Vector3();
const castTarget = new THREE.Vector3();
const CAST_DURATION = 0.8;
const MAX_WAIT = 5;

// Morsure : le poisson doit venir renifler l'hameçon — donc s'approcher visiblement
// du bouchon ET remonter jusqu'à lui depuis sa profondeur. La morsure se décide
// sur la distance RÉELLE en 3D à l'hameçon, pas seulement à l'aplomb du bouchon.
const HOOK_DEPTH = -0.85;          // profondeur de l'hameçon sous le bouchon
const BITE_INTEREST_RADIUS = 7;    // à cette distance, le poisson s'intéresse au bouchon
const BITE_RADIUS = 0.9;           // distance 3D en dessous de laquelle il mord
const BITE_APPROACH_ACCEL = 4.5;   // vitesse d'approche maximale (unités/s)

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

// Un poisson mord quand il est réellement arrivé sur l'hameçon (distance 3D) :
// il a donc dû s'approcher du bouchon ET remonter vers la surface (voir updateFish).
function findBitingFish() {
    if (fishCaught) {
        return null;
    }
    let best = null;
    let bestDist = BITE_RADIUS * BITE_RADIUS;
    for (let i = 0; i < fishes.length; i++) {
        const fish = fishes[i];
        const data = fish.userData;
        if (data.hooked || data.biting) {
            continue;
        }
        const dx = fish.position.x - floatGroup.position.x;
        const dy = (fish.position.y + data.topOffset) - HOOK_DEPTH;
        const dz = fish.position.z - floatGroup.position.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bestDist) {
            bestDist = d2;
            best = fish;
        }
    }
    return best;
}

function endCast() {
    if (fishCaught) {
        score++;
        scoreDisplay.textContent = score;
        showCatchMessage(caughtWeight);
        sound.catchFish();
        statusDisplay.textContent = 'Poisson attrapé ! ' + fmtPoids(caughtWeight) + ' (+1) 🎣';
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

function showCatchMessage(weight, espece) {
    catchMessage.textContent = (espece ? espece + ' ! ' : 'Poisson attrapé ! ')
        + fmtPoids(weight) + ' 🎣';
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
    // Plus la difficulté est haute, plus les coups brusques sont rapprochés.
    const interval = (1.8 - size * 0.4) / aggression / DIFFICULTY;
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
        // La difficulté rend le poisson plus combatif : il tire plus fort.
        pullSpeed: Math.min(2.0, Math.max(0.35, (0.4 + size * 0.6) * power * DIFFICULTY)),
        burstDistance: (0.3 + size * 0.4) * power * DIFFICULTY,
        burstInterval: interval,
        burstTimer: interval
    };
    tension = Math.max(0, Math.min(1, lineLengthToTension(struggle.lineLength)));
    // Temps limite : assez large pour jouer à la souris, mais il faut vraiment
    // ramener le poisson — et le chrono se resserre quand DIFFICULTY augmente.
    struggleTimeLeft = Math.min(22, Math.max(6, (baseLength * 0.65) / DIFFICULTY));
    updateStruggleTimer();
    computeStrugglePos();
    floatGroup.position.copy(strugglePos);
    fishCaught = true;
    escaped = false;
    hookedFish = fish;
    fish.userData.hooked = true;
    fish.userData.biting = false;
    floatState = 'struggle';
    setDragLoosened(false);
    strugglePanel.classList.add('active');
    struggleInfo.textContent = 'Taille ' + size.toFixed(1) + ' · force ' + power.toFixed(1) + ' · agressivité ' + aggression.toFixed(1) + ' · ' + fish.userData.weight.toFixed(1).replace('.', ',') + ' kg';
    struggleHint.textContent = 'Tourne la manivelle pour ramener le poisson !';
    updateStruggleBar();
    fishButton.disabled = true;
    fishButton.textContent = 'Tourne la manivelle !';
    statusDisplay.textContent = 'Poisson ferré ! Tourne la manivelle pour le ramener !';
}

function showBiteView(fish) {
    biteFish = fish;
    fish.userData.biting = true;
    fish.visible = false;
    biteViewActive = true;
    bitePhase = 'floating';
    biteViewTimer = 0;
    biteSinkAt = 0.7 + rand() * 0.9;
    biteSinkTimer = 0;
    biteNibbleTimer = 0;
    biteViewHideTimer = -1; // annule toute fermeture en attente d'une ancienne touche
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
        spawnSplash(floatGroup.position);
        hideBiteView();
        startStruggle(fish);
    } else if (bitePhase === 'floating' || bitePhase === 'nibbling') {
        // Trop tôt : le poisson est effrayé et retourne dans les profondeurs.
        if (biteFish) {
            biteFish.userData.biting = false;
            biteFish.visible = false;
            punishFish(biteFish);
            biteFish = null;
        }
        biteCooldown = 1.0;
        floatState = 'inWater';
        waitTimer = 0;
        statusDisplay.textContent = 'Trop tôt ! Le poisson s’est enfui.';
        hideBiteView();
    }
}

function updateBiteView(dt) {
    if (!biteViewActive) {
        return;
    }
    // Fermeture différée (après une touche ratée) : on referme seulement si une
    // nouvelle touche n'a pas commencé entre-temps.
    if (biteViewHideTimer > 0) {
        biteViewHideTimer -= dt;
        if (biteViewHideTimer <= 0) {
            biteViewHideTimer = -1;
            if (floatState !== 'bite') {
                hideBiteView();
            }
        }
    }
    biteViewTimer += dt;
    if (bitePhase === 'floating') {
        floatGroup.position.y = 0.1 + Math.sin(biteViewTimer * 4) * 0.08;
        setFloatOpacity(1);
        if (biteViewTimer >= biteSinkAt) {
            bitePhase = 'nibbling';
            biteNibbleTimer = 0;
            biteHint.textContent = 'Attention, il mordille…';
        }
    } else if (bitePhase === 'nibbling') {
        // Petites tapes : le bouchon plonge un peu, plusieurs fois de suite.
        biteNibbleTimer += dt;
        floatGroup.position.y = 0.1 - Math.abs(Math.sin(biteNibbleTimer * 9)) * 0.18;
        setFloatOpacity(1);
        if (biteNibbleTimer >= BITE_NIBBLE_DURATION) {
            bitePhase = 'sinking';
            biteSinkTimer = 0;
            biteHint.textContent = 'MAINTENANT !';
            biteHint.classList.add('urgent');
            spawnRipple(floatGroup.position);
        }
    } else if (bitePhase === 'sinking') {
        biteSinkTimer += dt;
        // Enfoncement bien visible : le bouchon descend franchement et RESTE
        // visible sous l'eau (il ne s'efface pas).
        const progress = Math.min(1, biteSinkTimer / 0.18);
        floatGroup.position.y = 0.1 - 1.6 * progress;
        setFloatOpacity(Math.max(0.2, 1 - progress * 0.85));
        if (biteSinkTimer >= BITE_WINDOW) {
            bitePhase = 'missed';
            biteHint.textContent = 'Trop tard ! Le poisson a recraché…';
            biteHint.classList.remove('urgent');
            floatGroup.position.y = 0.1;
            setFloatOpacity(1);
            if (biteFish) {
                biteFish.userData.biting = false;
                biteFish.visible = false;
                punishFish(biteFish);
                biteFish = null;
            }
            biteCooldown = 1.0;
            floatState = 'inWater';
            waitTimer = 0;
            statusDisplay.textContent = 'Trop tard ! Le poisson a recraché l’hameçon.';
            biteViewHideTimer = BITE_VIEW_LINGER;
        }
    }
}

// Le clic ne sert plus qu'à dégager la ligne des nénuphars : pendant l'épreuve
// de force, seul le moulinet (la manivelle) fait revenir le poisson.
function reelClick() {
    if (floatState === 'snag' && snag) {
        tension = Math.max(0, tension - snag.clickPower);
        shake = 0.06;
        sound.reel();
        updateStruggleBar();
    }
}

function endStruggle(success, timedOut) {
    strugglePanel.classList.remove('active');
    setDragLoosened(false);
    fishButton.disabled = false;
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
            hookedFish.visible = false;   // il replonge et disparaît
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
        struggle.burstTimer = struggle.burstInterval * (0.7 + rand() * 0.6);
        shake = 0.14;
    }
    // 3) La barre et la position du poisson suivent la longueur de fil sortie.
    // 3) Frein : si on lâche du fil, le poisson reprend de la distance mais la
    //    ligne ne casse pas (le frein patine).
    if (dragLoosened) {
        struggle.lineLength += 3.5 * dt;
    }
    tension = Math.max(0, Math.min(1, lineLengthToTension(struggle.lineLength)));
    if (dragLoosened) {
        tension = Math.min(0.72, tension);
    }
    // Fil tendu à l'extrême (barre tout à droite) : il casse, le poisson se
    // décroche — sauf si on a lâché du fil (le frein patine).
    if (!dragLoosened && struggle.lineLength >= struggle.maxLength) {
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
        snag.burstTimer = snag.burstInterval * (0.7 + rand() * 0.6);
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
    const geo = new THREE.RingGeometry(0.3, 0.42, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
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
        const s = 1 + r.t * 4.5;
        r.mesh.scale.set(s, s, s);
        r.mesh.material.opacity = Math.max(0, 0.32 * (1 - r.t / 1.1));
        if (r.t > 1.1) {
            scene.remove(r.mesh);
            r.mesh.geometry.dispose();
            r.mesh.material.dispose();
            ripples.splice(i, 1);
        }
    }
}

// ---------------------------------------------------------------------------
// Éclaboussures (ferrage, atterrissage de l'amorce)
// ---------------------------------------------------------------------------
const splashes = [];
const splashGeo = new THREE.SphereGeometry(0.1, 6, 6);

function spawnSplash(position) {
    if (splashes.length > 60) {
        return;
    }
    for (let i = 0; i < 8; i++) {
        const drop = new THREE.Mesh(splashGeo, new THREE.MeshBasicMaterial({
            color: 0xeaf6ff, transparent: true, opacity: 0.9
        }));
        drop.position.set(position.x, Math.max(0.15, position.y), position.z);
        const a = (i / 8) * Math.PI * 2;
        drop.userData.vx = Math.cos(a) * (1.2 + (i % 3) * 0.5);
        drop.userData.vz = Math.sin(a) * (1.2 + (i % 3) * 0.5);
        drop.userData.vy = 3.5 + (i % 3) * 0.7;
        scene.add(drop);
        splashes.push({ mesh: drop, t: 0 });
    }
}

function updateSplashes(dt) {
    for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.t += dt;
        const d = s.mesh.userData;
        d.vy -= 12 * dt;
        s.mesh.position.x += d.vx * dt;
        s.mesh.position.z += d.vz * dt;
        s.mesh.position.y += d.vy * dt;
        s.mesh.material.opacity = Math.max(0, 0.9 * (1 - s.t / 0.9));
        if (s.t > 0.9 || s.mesh.position.y < -0.2) {
            scene.remove(s.mesh);
            s.mesh.material.dispose();
            splashes.splice(i, 1);
        }
    }
}

// ---------------------------------------------------------------------------
// Mise à jour
// ---------------------------------------------------------------------------
function updateWind(dt) {
    wind.timer -= dt;
    if (wind.timer <= 0) {
        wind.targetDir = rand() * Math.PI * 2;
        wind.targetStrength = rand() * 0.8;
        wind.timer = 6 + rand() * 6;
    }
    const lerpFactor = 1 - Math.pow(0.1, dt);
    let diff = wind.targetDir - wind.dir;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    wind.dir += diff * lerpFactor;
    wind.strength += (wind.targetStrength - wind.strength) * lerpFactor;

    // Rafales : la météo peut renforcer le vent par moments (toujours < 1).
    wind.clock = (wind.clock || 0) + dt;
    if (weatherRafales > 0.01) {
        const rafale = weatherRafales * (0.30 + 0.30 * Math.sin(wind.clock * 2.3));
        wind.strength = Math.min(0.95, wind.strength + rafale * dt * 0.9);
    }

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
    baitInterest = false;
    fishes.forEach(fish => {
        const data = fish.userData;
        if (fish === heldFish) {
            return; // le poisson en main est posé par le joueur
        }
        if (data.biting) {
            fish.position.x = floatGroup.position.x + Math.sin(time * 20) * 0.12;
            fish.position.z = floatGroup.position.z + Math.cos(time * 18) * 0.12;
            fish.position.y = HOOK_DEPTH - data.topOffset + Math.sin(time * 20) * 0.05;
            fish.rotation.y = Math.sin(time * 18) * 0.4;
            data.tailPivot.rotation.y = Math.sin(time * 22) * 0.7;
            return;
        }
        if (data.hooked) {
            if (floatState === 'reeling') {
                fish.visible = true;   // combat gagné : le poisson est bien visible
                return; // position gérée par la remontée
            }
            // Épreuve de force : le poisson remonte par intermittence puis
            // replonge et redevient invisible (seules les bulles le trahissent).
            data.surfacePhase = (data.surfacePhase || 0) + dt;
            const houle = Math.sin(data.surfacePhase * 1.6);
            const profondeur = -0.15 - (1 - houle) * 1.1;
            fish.visible = profondeur > -0.85;
            fish.position.x = strugglePos.x + Math.sin(time * 30) * 0.15;
            fish.position.z = strugglePos.z + Math.cos(time * 25) * 0.15;
            fish.position.y = profondeur - data.topOffset;
            fish.rotation.y = Math.sin(time * 15) * 0.5;
            data.tailPivot.rotation.y = Math.sin(time * 25) * 0.8;
            if (!fish.visible) {
                data.diveBubbleTimer = (data.diveBubbleTimer || 0) - dt;
                if (data.diveBubbleTimer <= 0) {
                    data.diveBubbleTimer = 0.6;
                    spawnBubbles(fish.position, 2);
                }
            }
            return;
        }
        data.targeting = false;
        // L'amorce attire les poissons vers le nuage de miettes.
        if (chum && chum.strength > 0) {
            const cx = chum.position.x - fish.position.x;
            const cz = chum.position.z - fish.position.z;
            const cd = Math.hypot(cx, cz);
            if (cd < chum.radius && cd > 0.001) {
                const accel = CHUM_ATTRACT_ACCEL * chum.strength * dt;
                data.vx += (cx / cd) * accel;
                data.vz += (cz / cd) * accel;
                // Tout près du nuage, le poisson ralentit et tourne (il picore).
                if (cd < 3.5) {
                    data.vx *= 0.94;
                    data.vz *= 0.94;
                }
                // Vitesse bornée pour rester crédible.
                const sp = Math.hypot(data.vx, data.vz);
                const maxSp = 4.5;
                if (sp > maxSp) {
                    data.vx = (data.vx / sp) * maxSp;
                    data.vz = (data.vz / sp) * maxSp;
                }
            }
        }
        // Un poisson qui passe près du bouchon vient renifler l'hameçon : il s'en
        // approche et remonte vers la surface. C'est ce qui rend la touche visible.
        if (!fishCaught && floatState === 'inWater') {
            const bx = floatGroup.position.x - fish.position.x;
            const bz = floatGroup.position.z - fish.position.z;
            const bd = Math.hypot(bx, bz);
            // Sous la pluie, les poissons s'intéressent de plus loin.
            const rayonInteret = BITE_INTEREST_RADIUS * (1 + 0.25 * weatherPluie);
            if (bd < rayonInteret) {
                baitInterest = true;
                data.targeting = true;
                const inv = bd > 0.001 ? 1 / bd : 0;
                const wanted = Math.min(BITE_APPROACH_ACCEL, bd * 2.2);
                const k = Math.min(1, dt * 4);
                data.vx += (bx * inv * wanted - data.vx) * k;
                data.vz += (bz * inv * wanted - data.vz) * k;
                data.depth += (HOOK_DEPTH - data.depth) * Math.min(1, dt * 2.5);
            }
        }
        fish.position.x += data.vx * dt;
        fish.position.z += data.vz * dt;

        const dx = fish.position.x - POND_CENTER.x;
        const dz = fish.position.z - POND_CENTER.z;
        const dist = Math.hypot(dx, dz);
        // Un poisson qui vise l'hameçon peut venir jusqu'au bord : le bouchon
        // peut être posé tout près de la rive.
        const limit = data.targeting ? POND_RADIUS : POND_RADIUS - 5;
        if (dist > limit) {
            const nx = dx / dist;
            const nz = dz / dist;
            const dot = data.vx * nx + data.vz * nz;
            data.vx -= 2 * dot * nx;
            data.vz -= 2 * dot * nz;
            fish.position.x = POND_CENTER.x + nx * limit;
            fish.position.z = POND_CENTER.z + nz * limit;
        }

        // Nage : ondulation du corps, inclinaison dans les virages, queue.
        const yaw = Math.atan2(-data.vz, data.vx);
        let yawDelta = yaw - (data.prevYaw === undefined ? yaw : data.prevYaw);
        while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
        while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
        data.prevYaw = yaw;
        fish.rotation.y = yaw;
        fish.rotation.z = Math.max(-0.45, Math.min(0.45, yawDelta * 5))
            + Math.sin(time * 2 + data.phase) * 0.05;
        if (data.bodyMesh) {
            data.bodyMesh.rotation.y = Math.sin(time * 9 + data.phase) * 0.10;
        }
        // position.y = profondeur du dos − hauteur du poisson : il reste sous l'eau,
        // seuls les gros poissons montrent leur dorsale près de la surface.
        fish.position.y = data.depth - data.topOffset + Math.sin(time * 2 + data.phase) * 0.12;
        data.tailPivot.rotation.y = Math.sin(time * 9 + data.phase) * 0.5;
        // Poisson caché sous l'eau : seules ses bulles et son sillage le trahissent.
        fish.visible = false;
        if (data.bubbleTimer === undefined) {
            data.bubbleTimer = 1.5 + (data.phase % 4);
        }
        data.bubbleTimer -= dt;
        if (data.bubbleTimer <= 0) {
            data.bubbleTimer = 4 + ((data.phase * 5) % 5);
            spawnBubbles(fish.position, 3);
        }
        // Sillage : une petite ondulation quand le poisson nage près de la surface.
        if (data.wakeTimer === undefined) {
            data.wakeTimer = 1 + (data.phase % 2.5);
        }
        data.wakeTimer -= dt;
        if (data.wakeTimer <= 0) {
            data.wakeTimer = 2.5 + ((data.phase * 7) % 3);
            if (data.depth > -1.8 && ripples.length < 10) {
                spawnRipple(fish.position);
            }
        }
        // LOD : les petits détails (yeux, nageoires) disparaissent au loin.
        if (data.details) {
            data.details.visible = fish.position.distanceToSquared(camera.position) < 1089;
        }
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
        // Le bouchon flotte sur la houle (la même que la surface de l'eau).
        floatGroup.position.x += Math.cos(wind.dir) * wind.strength * 0.6 * dt;
        floatGroup.position.z += Math.sin(wind.dir) * wind.strength * 0.6 * dt;
        const houle = waterWaveHeightAt(floatGroup.position.x, floatGroup.position.z, time);
        // Un poisson qui renifle fait plonger un peu le bouchon (retour visuel).
        const nibble = baitInterest ? -0.08 + Math.sin(time * 9) * 0.05 : 0;
        floatGroup.position.y = 0.1 + houle + Math.sin(time * 3) * 0.05 + nibble;
        if (baitInterest) {
            nibbleRippleTimer -= dt;
            if (nibbleRippleTimer <= 0) {
                nibbleRippleTimer = 0.7;
                spawnRipple(floatGroup.position);
            }
        }
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
    } else if (floatState === 'bite') {
        // Filet de sécurité : si la vue bouchon s'est refermée (fermeture
        // différée d'une touche ratée), on rend la main au lieu de rester bloqué.
        if (!biteViewActive) {
            floatState = 'inWater';
            waitTimer = 0;
            biteCooldown = 1.0;
            statusDisplay.textContent = 'Le poisson est reparti… clique sur l’eau pour relancer.';
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
                hookedFish.position.y = -0.3 - (hookedFish.userData.topOffset || 0);
                hookedFish.rotation.y = Math.atan2(-dz, dx);
            }
            // Pendant la remontée, on finit de ramener la ligne : aucun autre
            // poisson ne peut mordre (il faut relancer pour en prendre un).
        } else {
            if (hookedFish) {
                // Poisson amené au bord : on le garde en main, il faudra le
                // lancer dans la bourriche pour le ranger.
                startHoldingFish(hookedFish);
            } else {
                floatGroup.position.copy(floatIdle);
                floatState = 'idle';
                fishButton.disabled = false;
                endCast();
            }
        }
    }
    // La manivelle sert pendant l'épreuve de force ET pendant la remontée.
    crank.classList.toggle('active', floatState === 'reeling' || floatState === 'struggle');
}

function updateLine() {
    const start = rodTipVisual;
    const end = floatGroup.position;
    // La ligne pend, mais se raidit quand le fil est tendu.
    const sag = 0.8 * (1 - Math.min(1, Math.max(0, tension)) * 0.65);
    for (let i = 0; i <= LINE_SEGMENTS; i++) {
        const t = i / LINE_SEGMENTS;
        const o = i * 3;
        linePositions[o] = start.x + (end.x - start.x) * t;
        linePositions[o + 1] = start.y + (end.y - start.y) * t - Math.sin(Math.PI * t) * sag;
        linePositions[o + 2] = start.z + (end.z - start.z) * t;
    }
    lineGeometry.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Entrées
// ---------------------------------------------------------------------------
canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    // Pendant la visée (amorce ou lancer), on peut ajuster le point de chute.
    if (castState === 'charging') {
        const p = waterPointFromEvent(event);
        if (p) {
            moveCastAim(p);
        }
    }
    if (feedState === 'charging') {
        const p = waterPointFromEvent(event);
        if (p) {
            moveFeedAim(p);
        }
    }
});

canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) {
        return;
    }
    ensureSound();
    // Poisson en main : on dose la puissance du lancer vers la bourriche.
    if (floatState === 'holding') {
        startFishThrow();
        return;
    }
    // Mode amorçage : un appui sur l'eau commence à charger la puissance.
    if (feedMode && floatState === 'idle') {
        if (feedState === 'idle') {
            const p = waterPointFromEvent(event);
            if (p) {
                // On capture le pointeur : le relâchement est bien reçu même si
                // le doigt sort du canvas (important sur téléphone).
                if (canvas.setPointerCapture && event.pointerId !== undefined) {
                    canvas.setPointerCapture(event.pointerId);
                }
                startFeedCharge(p);
            }
        }
        return;
    }
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
            startCastCharge(p);   // on vise et on dose la puissance du lancer
        }
    } else if (floatState === 'inWater') {
        startReel();
    }
});

// Relâcher = on dose la puissance et la boule part.
canvas.addEventListener('pointerup', event => {
    if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
        canvas.releasePointerCapture(event.pointerId);
    }
    if (castState === 'charging') {
        releaseCast();
        return;
    }
    if (fishThrowState === 'charging') {
        releaseFishThrow();
        return;
    }
    if (feedState === 'charging') {
        releaseFeed();
    }
});

canvas.addEventListener('pointercancel', event => {
    if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
        canvas.releasePointerCapture(event.pointerId);
    }
    cancelCast();
    if (fishThrowState === 'charging') {
        releaseFishThrow();
    }
    cancelFeed();
});

// Filet de sécurité (téléphone) : si le relâchement n'arrive pas au canvas,
// on le rattrape au niveau de la fenêtre.
window.addEventListener('pointerup', () => {
    if (castState === 'charging') {
        releaseCast();
    }
    if (fishThrowState === 'charging') {
        releaseFishThrow();
    }
    if (feedState === 'charging') {
        releaseFeed();
    }
});

// Au doigt, l'appui long ne doit pas ouvrir le menu contextuel du navigateur.
canvas.addEventListener('contextmenu', event => event.preventDefault());

feedButton.addEventListener('click', () => {
    ensureSound();
    setFeedMode(!feedMode);
});

biteView.addEventListener('pointerdown', hookFish);

fishButton.addEventListener('click', () => {
    ensureSound();
    if (castState === 'charging') {
        releaseCast();
        return;
    }
    if (floatState === 'holding') {
        if (fishThrowState === 'charging') {
            releaseFishThrow();
        } else {
            startFishThrow();
        }
        return;
    }
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
            startCastCharge(hits[0].point.clone());
        }
    } else if (floatState === 'inWater') {
        startReel();
    }
});

window.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') {
        ensureSound();
        if (feedMode) {
            return; // en mode amorçage, on lance avec la souris sur l'eau
        }
        if (castState === 'charging') {
            releaseCast();
            return;
        }
        if (floatState === 'holding') {
            if (fishThrowState === 'charging') {
                releaseFishThrow();
            } else {
                startFishThrow();
            }
            return;
        }
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
                startCastCharge(hits[0].point.clone());
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
        updateWater(elapsed);
        updateFish(dt, elapsed);
        updateFloat(dt, elapsed);
        updateFeed(dt);
        updateChum(dt);
        updateArm(dt);
        updateRod(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, elapsed);
        updateReflections(dt);
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
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
    if (post.enabled && postSupported && sceneTarget) {
        try {
            renderWithPost();
        } catch (error) {
            // Filet de sécurité : on revient au rendu direct.
            post.enabled = false;
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
        }
    } else {
        renderer.render(scene, camera);
    }
    updateQuality(dt);
    updateToolDock();
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
    // Amorçage (boule de nourriture) — exposé pour les tests.
    setFeedMode: setFeedMode,
    isFeedMode: function () { return feedMode; },
    getFeedState: function () { return feedState; },
    getFeedPower: function () { return feedPower; },
    getFeedTargetPower: function () { return feedTargetPower; },
    startFeedCharge: startFeedCharge,
    releaseFeed: releaseFeed,
    getFeedBall: function () { return feedBall; },
    getFeedLanding: function () { return { x: feedLanding.x, z: feedLanding.z }; },
    getFeedRange: function () { return { min: FEED_MIN_RANGE, max: FEED_MAX_RANGE }; },
    getPondCenter: function () { return { x: POND_CENTER.x, z: POND_CENTER.z }; },
    water: water,
    getWaterHeightAt: function (x, z) { return waterWaveHeightAt(x, z, testTime); },
    getBaitInterest: function () { return baitInterest; },
    getHookDepth: function () { return HOOK_DEPTH; },
    getFloatOpacity: function () { return floatBody.material.opacity; },
    // Bourriche, carnet et lancer du poisson — exposé pour les tests.
    getBourriche: function () {
        return { x: BOURRICHE_POS.x, z: BOURRICHE_POS.z, radius: BOURRICHE_RADIUS };
    },
    getHeldFish: function () { return heldFish; },
    getFishThrowState: function () { return fishThrowState; },
    getFishThrowPower: function () { return fishThrowPower; },
    getFishThrowTargetPower: function () { return fishThrowTarget; },
    getFishThrowLanding: function () { return { x: fishThrowLanding.x, z: fishThrowLanding.z }; },
    startFishThrow: startFishThrow,
    setFishThrowPower: setFishThrowPower,
    releaseFishThrow: releaseFishThrow,
    storeHeldFish: storeHeldFish,
    dropHeldFish: dropHeldFish,
    getJournal: function () {
        return {
            total: journal.total, totalWeight: journal.totalWeight,
            best: journal.best, last: journal.last.slice(),
            especes: Object.assign({}, journal.especes)
        };
    },
    // Espèces disponibles (longueurs/poids réalistes calculés).
    getSpecies: function () {
        return SPECIES.map(function (s) {
            return {
                id: s.id, nom: s.nom, form: s.form,
                minCm: s.cm[0], maxCm: s.cm[1], k: s.k,
                minKg: Math.round(s.k * Math.pow(s.cm[0], 3) / 100000 * 1000) / 1000,
                maxKg: Math.round(s.k * Math.pow(s.cm[1], 3) / 100000 * 1000) / 1000,
                agressivite: s.agressivite.slice(),
                abondance: s.abondance
            };
        });
    },
    poidsRealisteKilos: poidsRealisteKilos,
    // Lancer au dosage et frein du moulinet — exposé pour les tests.
    getCastState: function () { return castState; },
    getCastPower: function () { return castPower; },
    getCastTargetPower: function () { return castTargetPower; },
    getCastAim: function () { return { x: castAim.x, z: castAim.z }; },
    setCastPower: setCastPower,
    startCastCharge: startCastCharge,
    releaseCast: releaseCast,
    cancelCast: cancelCast,
    setDragLoosened: setDragLoosened,
    isDragLoosened: function () { return dragLoosened; },
    // Météo et vie ambiante — exposé pour les tests.
    getWeather: function () { return weatherName(); },
    setWeather: setWeather,
    getRainAmount: function () { return weatherPluie; },
    getWindGusts: function () { return weatherRafales; },
    getAmbientCounts: function () {
        return { birds: birds.length, libellules: libellules.length, sauteur: sauteur.visible ? 1 : 0 };
    },
    getRainPoints: function () { return rainPoints; },
    getBirds: function () { return birds; },
    getBubbleCount: function () { return bubbles.length; },
    getRippleCount: function () { return ripples.length; },
    // Fiche des espèces, tutoriel et reflets — exposé pour les tests.
    getSpeciesCard: function () { return Object.assign({}, journal.especes); },
    openTutorial: openTutorial,
    closeTutorial: closeTutorial,
    nextTutorialStep: nextTutorialStep,
    isTutorialOpen: function () { return tutorial.classList.contains('open'); },
    getTutorialStep: function () {
        return { index: tutorialStepIndex, total: TUTORIAL_STEPS.length, texte: tutorialText.textContent };
    },
    setReflections: setReflections,
    getReflections: function () {
        return {
            enabled: reflections.enabled, supported: !!cubeCamera,
            strength: waterUniforms.uReflect.value
        };
    },
    setDifficulty: setDifficulty,
    getDifficulty: function () { return { difficulty: DIFFICULTY, biteWindow: BITE_WINDOW }; },
    isJournalOpen: function () { return journalPanel.classList.contains('open'); },
    showJournal: showJournal,
    hideJournal: hideJournal,
    // Effets visuels (post-traitement maison) — exposé pour les tests.
    setVisualEffects: function (value) {
        post.enabled = !!value;
        effectsToggle.checked = !!value;
    },
    getVisualEffects: function () {
        return {
            enabled: post.enabled, supported: postSupported,
            bloom: post.strength, vignette: post.vignette
        };
    },
    getChum: function () {
        return chum ? {
            x: chum.position.x,
            z: chum.position.z,
            radius: chum.radius,
            age: chum.age,
            lifetime: chum.lifetime,
            strength: chum.strength
        } : null;
    },
    setPaused: function (value) { paused = value; },
    step: function (dt) {
        testTime += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateWater(testTime);
        updateFish(dt, testTime);
        updateFloat(dt, testTime);
        updateFeed(dt);
        updateChum(dt);
        updateArm(dt);
        updateRod(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, testTime);
        updateReflections(dt);
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
        updateRipples(dt);
        updateLine();
    }
};

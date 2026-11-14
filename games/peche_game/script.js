import * as THREE from 'three';
// Le « ?v=74 » est essentiel : sans lui, le navigateur peut resservir une
// VIEILLE copie de sound.js gardée en mémoire, et le jeu plante alors avec
// « sound.setRain is not a function ». On numérote donc AUSSI les modules
// importés (la version doit rester la même que celle de index.html).
import { SoundEngine } from './sound.js?v=74';

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
const xpLabel = document.getElementById('xpLabel');
const depthLabel = document.getElementById('depthLabel');
const depthMinus = document.getElementById('depthMinus');
const depthPlus = document.getElementById('depthPlus');
const lignesLabel = document.getElementById('lignesLabel');
const gameOver = document.getElementById('gameOver');
const gameOverScore = document.getElementById('gameOverScore');
const playerName = document.getElementById('playerName');
const saveScore = document.getElementById('saveScore');
const restartGame = document.getElementById('restartGame');
const showRanking = document.getElementById('showRanking');
const rankingButton = document.getElementById('rankingButton');
const classement = document.getElementById('classement');
const rankingTabs = document.getElementById('rankingTabs');
const rankingList = document.getElementById('rankingList');
const closeRanking = document.getElementById('closeRanking');
const shopXp = document.getElementById('shopXp');
const boutique = document.getElementById('boutique');
const ficheTouches = document.getElementById('ficheTouches');
const journalTabs = document.getElementById('journalTabs');
const pondMap = document.getElementById('pondMap');
const tabPages = {
    prises: document.getElementById('tabPrises'),
    especes: document.getElementById('tabEspeces'),
    boutique: document.getElementById('tabBoutique'),
    touches: document.getElementById('tabTouches'),
    options: document.getElementById('tabOptions')
};
const especePrev = document.getElementById('especePrev');
const especeNext = document.getElementById('especeNext');
const especePage = document.getElementById('especePage');
const especeFiche = document.getElementById('especeFiche');
const tabBtnEspeces = document.getElementById('tabBtnEspeces');
let especeIndex = 0;             // poisson affiché dans l'onglet « Espèces »
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
const floatSelect = document.getElementById('floatSelect');
const floatInfo = document.getElementById('floatInfo');

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
let crankLastMoveTime = 0;

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
    facile: { difficulty: 1.0, biteWindow: 0.85 },
    normal: { difficulty: 1.3, biteWindow: 0.7 },
    dur: { difficulty: 1.6, biteWindow: 0.55 }
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
    // Remonter TROP VITE fatigue la ligne : avertissement, puis risque croissant.
    const maintenant = performance.now();
    const ecart = Math.max(16, maintenant - crankLastMoveTime) / 1000;
    crankLastMoveTime = maintenant;
    const vitesse = Math.abs(delta) / ecart;             // radians / seconde
    if (vitesse > VITESSE_MANIVELLE_MAX) {
        avertirVitesse();
    }
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

// Options des cibles de rendu.
// ⚠️ La cible de la SCÈNE doit GARDER un tampon de profondeur : sans lui, le tri
// des objets est perdu et l'eau (transparente), dessinée en dernier, passe
// PAR-DESSUS le pêcheur et la bourriche pourtant DEVANT elle. C'est exactement
// ce qui leur donnait cet aspect « sous un voile blanc ».
const SCENE_TARGET_OPTIONS = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false
};
// Les cibles du bloom sont de simples quads plein écran : pas besoin de profondeur.
const BLOOM_TARGET_OPTIONS = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false
};

function makePostTarget(w, h, options) {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h),
        options || BLOOM_TARGET_OPTIONS);
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
    sceneTarget = makePostTarget(fullW, fullH, SCENE_TARGET_OPTIONS);
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
// Vue RÉALISTE unique : plus aucun zoom sur le bouchon (le joueur le surveille
// de loin). On garde la variable pour l'API de test.
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
        // 0.04 rad de flou : assez doux pour un ciel crédible, et juste sous la
        // limite de three.js (à 0.05 il prévient « sigmaRadians … is too large »).
        scene.environment = pmrem.fromScene(envScene, 0.04).texture;
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
// Hauteur de la rive. La rive est légèrement PLUS HAUTE que l'eau : celle-ci
// reste « dans son bol ». Sans cela, la surface de l'eau arrive exactement au
// niveau des pieds du pêcheur (et le dépasse même en cas de rafale) : le
// pêcheur donne alors l'impression de flotter, voire d'être dans l'eau.
const RIVE_Y = 0.35;

// ---------------------------------------------------------------------------
// Relief de l'étang : le fond est un BASSIN (peu profond au bord, profond au
// centre) avec deux FOSSES. Profondeurs en UNITÉS (2 unités ≈ 1 m).
// ---------------------------------------------------------------------------
const FOND_BORD = 1.4;            // profondeur au bord (≈ 0,7 m)
const FOND_CENTRE = 5.0;          // profondeur au centre (≈ 2,5 m)
const FOSSES = [
    { x: -16, z: -56, rayon: 11, plus: 1.6 },
    { x: 20, z: -26, rayon: 9, plus: 1.2 }
];

// Profondeur d'eau (positive) à un point de l'étang.
function profondeurLocale(x, z) {
    const dx = x - POND_CENTER.x;
    const dz = z - POND_CENTER.z;
    const d = Math.hypot(dx, dz);
    const t = Math.min(1, d / POND_RADIUS);
    let prof = FOND_BORD + (FOND_CENTRE - FOND_BORD) * (1 - t * t);   // cuvette
    FOSSES.forEach(function (fosse) {
        const fd = Math.hypot(x - fosse.x, z - fosse.z);
        if (fd < fosse.rayon) {
            prof += fosse.plus * (1 - (fd / fosse.rayon) * (fd / fosse.rayon));
        }
    });
    return prof;
}

// Hauteur (y) du fond à un point donné.
function fondY(x, z) {
    return -profondeurLocale(x, z);
}

// Fond de l'étang : un disque dont les sommets suivent le relief.
function makeFondGeometry(radius, rings, segments) {
    const positions = [POND_CENTER.x, fondY(POND_CENTER.x, POND_CENTER.z), POND_CENTER.z];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        const rr = radius * (r / rings);
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const x = Math.cos(a) * rr;
            const z = Math.sin(a) * rr;
            positions.push(x, fondY(POND_CENTER.x + x, POND_CENTER.z + z), z);
        }
    }
    for (let s = 0; s < segments; s++) {
        indices.push(0, 1 + s, 1 + ((s + 1) % segments));
    }
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
    // Profondeur d'eau RÉELLE sous chaque sommet : sert à foncer l'eau au large
    // et à la garder claire au bord (plus de bassine bleu pâle uniforme).
    const depths = [];
    for (let i = 0; i < positions.length; i += 3) {
        depths.push(profondeurLocale(POND_CENTER.x + positions[i], POND_CENTER.z + positions[i + 2]));
    }
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

const pondBottom = new THREE.Mesh(
    makeFondGeometry(POND_RADIUS + 2, 26, 96),
    new THREE.MeshStandardMaterial({ color: 0x1a5a70, roughness: 1 })
);
// La hauteur est dans la géométrie : le maillage est simplement centré.
pondBottom.position.set(POND_CENTER.x, 0, POND_CENTER.z);
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
    // Profondeur d'eau RÉELLE sous chaque sommet : sert à foncer l'eau au large
    // et à la garder claire au bord (plus de bassine bleu pâle uniforme).
    const depths = [];
    for (let i = 0; i < positions.length; i += 3) {
        depths.push(profondeurLocale(POND_CENTER.x + positions[i], POND_CENTER.z + positions[i + 2]));
    }
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Carte de normales d'eau GÉNÉRÉE (pas de fichier image à embarquer) : la
// somme de vagues sinusoidales tileables, convertie en normales RGB. C'est la
// couche 1 de la technique « eau réaliste » (normales de vague par pixel).
function makeWaterNormalTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    if (!g || !g.createImageData) {
        return null;
    }
    const hauteur = function (x, y) {
        const u = (x / 128) * Math.PI * 2;
        const v = (y / 128) * Math.PI * 2;
        return Math.sin(u * 3) * 0.5 + Math.sin(v * 5 + 1.3) * 0.35 + Math.sin((u + v) * 7) * 0.2
            + Math.sin(u * 11 - v * 4) * 0.12;
    };
    const img = g.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
            const dx = hauteur((x + 1) % 128, y) - hauteur((x + 127) % 128, y);
            const dy = hauteur(x, (y + 1) % 128) - hauteur(x, (y + 127) % 128);
            const i = (y * 128 + x) * 4;
            img.data[i] = Math.max(0, Math.min(255, 128 + dx * 110));
            img.data[i + 1] = Math.max(0, Math.min(255, 128 + dy * 110));
            img.data[i + 2] = 255;
            img.data[i + 3] = 255;
        }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// Uniforms de l'eau (partagés avec la houle calculée côté JavaScript).
const waterUniforms = {
    uTime: { value: 0 },
    uWindDir: { value: new THREE.Vector2(1, 0) },
    uWind: { value: 0 },
    uLight: { value: 1 },
    uEnv: { value: null },
    uReflect: { value: 0 },
    uShallow: { value: new THREE.Color(0x5aa7b8) },
    uDeep: { value: new THREE.Color(0x103a4e) },
    uSky: { value: new THREE.Color(0xc4e2ee) },
    uNormals: { value: makeWaterNormalTexture() },
    uReflection: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) }
    , uMirrorY: { value: 0 }
};

// ---------------------------------------------------------------------------
// COUCHE 2 du rendu d'eau : REFLET PLANAIRE. Une caméra miroir (symétrique par
// rapport au plan y = 0) rend la scène dans une petite cible, échantillonnée par
// le shader et déformée par les normales. Basse résolution + une image sur deux,
// désactivé sur mobile.
// ---------------------------------------------------------------------------
const waterReflectionTarget = new THREE.WebGLRenderTarget(320, 180, { depthBuffer: true });
const waterMirrorCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.5, 400);
const waterReflectionOn = !(typeof isMobileDevice === 'function' ? isMobileDevice() : false);
let waterReflectionFrame = 0;
function updateWaterReflection() {
    if (!waterReflectionOn || !water) { return; }
    waterReflectionFrame += 1;
    if (waterReflectionFrame % 2 !== 0) { return; }
    waterMirrorCamera.copy(camera);
    waterMirrorCamera.position.y = -camera.position.y;
    waterMirrorCamera.up.set(0, -1, 0);
    waterMirrorCamera.lookAt(POND_CENTER.x, 0, POND_CENTER.z);
    const precedent = (typeof renderer.getRenderTarget === 'function') ? renderer.getRenderTarget() : null;
    const visibleAvant = water.visible;
    water.visible = false;
    renderer.setRenderTarget(waterReflectionTarget);
    renderer.render(scene, waterMirrorCamera);
    renderer.setRenderTarget(precedent);
    water.visible = visibleAvant;
    waterUniforms.uReflection.value = waterReflectionTarget.texture;
}

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
        varying float vDepth;
        // Hauteur de la houle + son gradient (pour la normale).
        float waveHeight(vec2 p, float t, out vec2 grad) {
            float amp = 0.08 * (0.5 + uWind * 1.4);
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
            // Profondeur RÉELLE de l'étang sous ce point (mêmes constantes que
            // profondeurLocale) : claire au bord, sombre au centre et dans les fosses.
            vec2 dp = wp.xz - vec2(0.0, -40.0);
            float dd = length(dp);
            float tt = min(1.0, dd / 55.0);
            float pr = 1.4 + 3.6 * (1.0 - tt * tt);
            float f1 = length(wp.xz - vec2(-16.0, -56.0)) / 11.0;
            float f2 = length(wp.xz - vec2(20.0, -26.0)) / 9.0;
            pr += 1.6 * max(0.0, 1.0 - f1 * f1) + 1.2 * max(0.0, 1.0 - f2 * f2);
            vDepth = pr;
            vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));
            gl_Position = projectionMatrix * viewMatrix * wp;
        }
    `,
    fragmentShader: `
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        uniform vec3 uSky;
        uniform sampler2D uNormals;
        uniform sampler2D uReflection;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uWind;
        uniform float uLight;
        uniform samplerCube uEnv;
        uniform float uReflect;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vDepth;
        vec3 vRipple;
        void main() {
            // Deux nappes de normales qui défilent avec le vent : ridules par pixel.
            if (true) {
                vec2 uv1 = vWorldPos.xz * 0.05 + vec2(uTime * 0.010, uTime * 0.006) * (0.5 + uWind);
                vec2 uv2 = vWorldPos.xz * 0.11 - vec2(uTime * 0.016, -uTime * 0.012) * (0.4 + uWind);
                vec3 t1 = texture2D(uNormals, uv1).rgb - vec3(0.5);
                vec3 t2 = texture2D(uNormals, uv2).rgb - vec3(0.5);
                vRipple = t1 + t2;
            }
            vec3 n = normalize(vNormal + vec3(vRipple.x, 0.0, vRipple.y) * 1.1);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);
            // LA profondeur commande la couleur : claire au bord, sombre au fond.
            float prof = clamp(vDepth / 5.2, 0.0, 1.0);
            vec3 col = mix(uShallow, uDeep, prof);
            // Un peu de vaguelette : petites variations de teinte.
            col *= 0.94 + 0.06 * clamp(n.y, 0.0, 1.0);
            col = mix(col, uSky, fres * 0.45);
            // REFLET du décor (couche 2) : distordu par les ridules.
            if (uReflection != 0) {
                vec2 uvRef = gl_FragCoord.xy / uResolution + vRipple.xy * 0.035;
                vec3 reflet = texture2D(uReflection, clamp(uvRef, vec2(0.0), vec2(1.0))).rgb;
                col = mix(col, reflet, (0.22 + fres * 0.45) * 0.9);
            }
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
            // Eau plus transparente : on voit la moitié inférieure du bouchon et
            // le bas de ligne sous la surface.
            float alpha = clamp(0.40 + prof * 0.45 + fres * 0.25, 0.0, 0.97);
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
    const amp = 0.08 * (0.5 + wind.strength * 1.4);
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
shore.position.set(POND_CENTER.x, RIVE_Y, POND_CENTER.z);
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
    _vec.set(x, 1.5 * scale + RIVE_Y, z);
    _scl.set(scale, scale, scale);
    _quat.identity();
    _mat4.compose(_vec, _quat, _scl);
    trunkInst.setMatrixAt(trunkCount++, _mat4);
    // Feuillage : 3 cônes empilés (géométrie unitaire mise à l'échelle)
    for (let i = 0; i < 3; i++) {
        const r = (2.4 - i * 0.55) * scale;
        const h = (2.6 - i * 0.4) * scale;
        _vec.set(x, (3 + i * 1.5) * scale + RIVE_Y, z);
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
    const radius = 0.25 + rand() * 0.45;   // 12 à 35 cm de rayon
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
const reedGeo = new THREE.CylinderGeometry(0.02, 0.035, 1, 5);
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
    _vec.set(POND_CENTER.x + Math.cos(angle) * r, RIVE_Y + 0.15, POND_CENTER.z + Math.sin(angle) * r);
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

vaneGroup.position.set(12, RIVE_Y, 16);
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

// Le pêcheur est posé SUR la rive (pieds au niveau du sol, pas au niveau de l'eau).
angler.position.set(-4, RIVE_Y, 18);
angler.rotation.y = Math.PI;
scene.add(angler);

// ---------------------------------------------------------------------------
// Canne
// ---------------------------------------------------------------------------
// Pecheur de 1,70 m ; canne au flotteur de 3 m (6 unites).
const rodBase = new THREE.Vector3(-3, 2.2 + RIVE_Y, 17);
const rodTip = new THREE.Vector3(-0.8, 4.81, 11.89); // ~3 m du talon

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
// Canne CONIQUE : talon de 25 mm, scion de 4 mm (pas un tube uniforme).
const rodMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.025, rodLocalTip.length(), 10), rodMat);
rodMesh.position.copy(rodLocalTip).multiplyScalar(0.5);
rodMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rodLocalTip.clone().normalize());
rodMesh.castShadow = true;
rodGroup.add(rodMesh);

const handleEnd = rodLocalTip.clone().multiplyScalar(0.2);
rodGroup.add(cylinderBetween(new THREE.Vector3(0, 0, 0), handleEnd, 0.055, new THREE.MeshStandardMaterial({ color: 0x3b2a1a })));

const reel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14),
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
    new THREE.SphereGeometry(0.05, 16, 12),
    new THREE.MeshStandardMaterial({ map: makeBobberTexture(), roughness: 0.4, transparent: true })
);
floatBody.castShadow = true;
floatGroup.add(floatBody);
const floatStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.012, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xc93030, transparent: true })
);
floatStick.position.y = 0.5;
floatGroup.add(floatStick);

// Ligne + hameçon sous le bouchon
const hookLine = new THREE.Mesh(
    // Long bas de ligne : environ 1,3 m sous le bouchon (2 unités ≈ 1 m).
    new THREE.CylinderGeometry(0.005, 0.005, 3.0, 4),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true })
);
hookLine.position.y = -1.8;    // du bas du bouchon jusqu'à l'hameçon
floatGroup.add(hookLine);

const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.016, 0.005, 6, 12, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3, transparent: true })
);
hook.position.y = -3.25;       // tout au fond du bas de ligne
hook.rotation.z = Math.PI;
floatGroup.add(hook);

function setFloatOpacity(opacity) {
    floatBody.material.opacity = opacity;
    floatStick.material.opacity = opacity;
    hookLine.material.opacity = opacity;
    hook.material.opacity = opacity;
}
// Profondeur de la LIGNE : distance entre le bouchon et l'hameçon, en UNITÉS
// (2 unités ≈ 1 m). Le joueur la règle avec − / + ; elle est bornée par le type
// de bouchon (une « pose à coulisse » descend bien plus profond).
let profondeurLigne = 2.5;              // 1,25 m par défaut
let HOOK_DEPTH = -profondeurLigne;      // hauteur (y) de l'hameçon

function bornesProfondeur(f) {
    const b = (f || flotteurCourant()).profondeur;
    return Array.isArray(b) && b.length === 2 ? b : [0.6, 2.6];
}

// Met à jour le dessin du bas de ligne et de l'hameçon (plus ou moins loin).
function appliquerProfondeurVisuelle() {
    const bas = 0.06;   // bas du bouchon (local) — le fil part du corps                                        // bas du bouchon (local)
    const prof = profondeurLigne / FLOTTEUR_ECHELLE;        // en local
    const longueur = Math.max(0.3, prof - bas);
    hookLine.scale.y = longueur / 3.0;                      // géométrie de 3.0
    hookLine.position.y = -(bas + longueur / 2);
    hook.position.y = -prof;
}

function majEtiquetteProfondeur() {
    if (!depthLabel) {
        return;
    }
    const bornes = bornesProfondeur();
    depthLabel.textContent = (profondeurLigne / 2).toFixed(1).replace('.', ',') + ' m';
    if (depthMinus) {
        depthMinus.disabled = profondeurLigne <= bornes[0] + 0.01;
    }
    if (depthPlus) {
        depthPlus.disabled = profondeurLigne >= bornes[1] - 0.01;
    }
    // La plage du bouchon équipé : c'est ELLE qui fixe la limite de profondeur.
    if (depthRange) {
        const f = flotteurCourant();
        depthRange.textContent = f.nom + ' : ' + nombreMetres(bornes[0]) + ' à '
            + nombreMetres(bornes[1]) + (profondeurLigne >= bornes[1] - 0.01 ? ' (maxi)' : '');
    }
}

let floatState = 'idle'; // 'idle' | 'flying' | 'inWater' | 'bite' | 'struggle' | 'reeling'
function setProfondeur(valeur) {
    const bornes = bornesProfondeur();
    // Pas fin de 0,25 unité (12,5 cm) pour pouvoir viser la couche exacte, et
    // borné par le bouchon équipé.
    const arrondi = Math.round(valeur * 4) / 4;
    profondeurLigne = Math.min(bornes[1], Math.max(bornes[0], arrondi));
    HOOK_DEPTH = -profondeurLigne;
    appliquerProfondeurVisuelle();
    majEtiquetteProfondeur();
    majCoupeProfondeur();
}

// ---------------------------------------------------------------------------
// COUPE DE L'EAU : le petit schéma qui montre, en direct, le bouchon en
// surface, le fil, l'hameçon à SA profondeur et le fond de l'étang à l'endroit
// pêché. C'est la partie « visuelle » du réglage de profondeur.
// ---------------------------------------------------------------------------
const depthCross = document.getElementById('depthCross');
const depthBottomLine = document.getElementById('depthBottomLine');
const depthHookLine = document.getElementById('depthHookLine');
const depthHookDot = document.getElementById('depthHook');
const depthZoneLabel = document.getElementById('depthZoneLabel');
const depthHint = document.getElementById('depthHint');
const depthRange = document.getElementById('depthRange');
let dernierCoupe = -1;
let coupePrete = false;   // le schéma attend que le jeu soit entièrement initialisé

// Hauteur d'eau (unités) représentée par la hauteur du schéma.
const COUPE_REF = 6.8;

function nombreMetres(unites) {
    return (unites / 2).toFixed(1).replace('.', ',') + ' m';
}

function majCoupeProfondeur() {
    if (!depthCross || !coupePrete) {
        return;
    }
    const enEau = floatState !== 'idle';
    const px = enEau ? floatGroup.position.x : castTarget.x;
    const pz = enEau ? floatGroup.position.z : castTarget.z;
    const profLocale = profondeurLocale(px, pz);
    // Le fond, en % de la hauteur du schéma (jamais collé aux bords).
    const fondPct = Math.min(96, Math.max(8, (profLocale / COUPE_REF) * 100));
    depthBottomLine.style.top = (100 - fondPct).toFixed(1) + '%';
    depthBottomLine.style.height = fondPct.toFixed(1) + '%';
    // L'hameçon et le fil qui le relie au bouchon.
    const hameconPct = Math.min(100, (profondeurLigne / COUPE_REF) * 100);
    depthHookDot.style.top = hameconPct.toFixed(1) + '%';
    depthHookLine.style.height = hameconPct.toFixed(1) + '%';
    const zone = profondeurLigne < 1.6 ? 'surface' : (profondeurLigne < 3.2 ? 'mi-eau' : 'fond');
    depthZoneLabel.textContent = zone;
    // Alerte : l'hameçon touche (ou dépasse) le fond → vase, aucune touche.
    const dansLeFond = profondeurLigne > profLocale - 0.25;
    depthHookDot.classList.toggle('danger', dansLeFond);
    depthHint.classList.toggle('alerte', dansLeFond);
    depthHint.textContent = dansLeFond
        ? '⚠ Fond à ' + nombreMetres(profLocale) + ' : hameçon dans la vase !'
        : zone + ' · fond à ' + nombreMetres(profLocale);
}

const floatIdle = new THREE.Vector3(rodTip.x, rodTip.y - 0.6, rodTip.z);
floatGroup.position.copy(floatIdle);
// Le bouchon est un peu plus petit que dans la réalité d'un jeu vidéo : il doit
// rester crédible. (Les mouvements de touche sont bien plus grands que sa taille,
// donc il reste très lisible de loin.)
const FLOTTEUR_ECHELLE = 0.8;
floatGroup.scale.setScalar(FLOTTEUR_ECHELLE);
scene.add(floatGroup);

// ---------------------------------------------------------------------------
// Types de bouchons (flotteurs) : chacun a sa sensibilité à la touche.
//   - plus sensible = fenêtre de ferrage plus longue, MAIS plus de fausses
//     touches (le bouchon bouge pour un rien) ;
//   - sur une touche en remontée : l'anglaise sort la moitié de sa tige, un
//     bouchon court et sensible (waggler) se couche sur le côté.
// ---------------------------------------------------------------------------
// Capacités spéciales des bouchons. Les valeurs « neutres » valent 1.
//   fenetre  : longueur de la fenêtre de ferrage (> 1 = plus facile)
//   fausses  : nombre de fausses touches (< 1 = moins de pièges)
//   avantage : avantage laissé au poisson au ferrage (< 1 = mieux pour toi)
//   temps    : temps d'épreuve de force (> 1 = plus de temps)
//   xp       : expérience gagnée (> 1 = plus d'expérience)
//   voyant   : le bouchon reste visible la nuit
const CAPACITE_BASE = { fenetre: 1, fausses: 1, avantage: 1, temps: 1, xp: 1, voyant: false };

// Bouchons offerts au départ (les autres s'ACHÈTENT avec l'expérience).
const BOUCHONS_DE_DEPART = ['anglaise', 'waggler', 'coulisse', 'bolognaise'];

const FLOTTEURS = [
    { id: 'anglaise', nom: 'Anglaise', profondeur: [0.6, 7.0], prix: 0, atout: '🎯 Très sensible', capacite: {}, sensibilite: 1.35, remontee: 'demi-tige', longueur: 0.45,
      couleur: 0xff5a3c, corps: 0xf4f4f4,
      desc: 'Anglaise : longue tige fine, très sensible. Sur une touche en remontée, la moitié de la tige ressort. Attention : elle bouge aussi sur les fausses touches !' },
    { id: 'waggler', nom: 'Waggler', profondeur: [0.6, 7.0], prix: 0, atout: '🎯 Sensible', capacite: {}, sensibilite: 1.15, remontee: 'couche', longueur: 0.35,
      couleur: 0xffd24d, corps: 0xf4f4f4,
      desc: 'Waggler : bouchon court et fin pour l’eau calme. Très sensible ; quand le poisson remonte, il se couche sur le côté.' },
    { id: 'coulisse', nom: 'Pose à coulisse', profondeur: [0.8, 7.0], prix: 0, atout: '⚖️ Sensibilité moyenne', capacite: {}, sensibilite: 0.85, remontee: 'couche', longueur: 0.5,
      couleur: 0xd0552a, corps: 0xf4f4f4,
      desc: 'Pose à coulisse : bouchon coulissant pour pêcher profond. Sensibilité moyenne, un peu moins de fausses touches.' },
    { id: 'bolognaise', nom: 'Bolognaise', profondeur: [1.2, 7.0], prix: 0, atout: '🛡️ Peu de fausses touches', capacite: {}, sensibilite: 0.7, remontee: 'demi-tige', longueur: 0.8,
      couleur: 0xe04a2a, corps: 0xffe066,
      desc: 'Bolognaise : gros bouchon pour lancer loin. Peu sensible : la fenêtre de ferrage est courte, mais il y a moins de fausses touches.' },
    // --- Bouchons à ACHETER avec l'expérience (capacités spéciales) ---
    { id: 'plume', nom: 'Plume d’oie lumineuse', profondeur: [0.6, 7.0], prix: 40, remontee: 'couche', longueur: 0.4,
      couleur: 0x8ef0c0, corps: 0xf7f7f7, atout: '💡 Visible la nuit',
      capacite: { voyant: true, fenetre: 1.1 }, sensibilite: 1.0,
      desc: 'Plume lumineuse : elle brille doucement, donc tu la vois même quand la nuit tombe. Un peu plus de temps pour ferrer.' },
    { id: 'truque', nom: 'Bouchon truqué', profondeur: [0.6, 7.0], prix: 70, remontee: 'couche', longueur: 0.38,
      couleur: 0xff7ad9, corps: 0xf4f4f4, atout: '🤫 Moins de fausses touches',
      capacite: { fausses: 0.55 }, sensibilite: 1.2,
      desc: 'Bouchon truqué : il ne bouge presque pas pour rien. Bien moins de fausses touches : tu serres au bon moment !' },
    { id: 'plombee', nom: 'Waggler plombé', profondeur: [1.2, 7.0], prix: 110, remontee: 'couche', longueur: 0.4,
      couleur: 0x2f6fd0, corps: 0xe8e8e8, atout: '🏋️ Combat plus court',
      capacite: { temps: 1.25, avantage: 0.9 }, sensibilite: 0.9,
      desc: 'Waggler plombé : bien posé dans l’eau, il fatigue le poisson. L’épreuve de force dure plus longtemps et le poisson a moins d’avance.' },
    { id: 'maitre', nom: 'Bouchon du maître', profondeur: [0.6, 7.0], prix: 200, remontee: 'demi-tige', longueur: 0.55,
      couleur: 0xffd700, corps: 0x222222, atout: '🏆 Polyvalent + 50 % d’expérience',
      capacite: { fenetre: 1.2, fausses: 0.7, avantage: 0.85, temps: 1.15, xp: 1.5, voyant: true },
      sensibilite: 1.25,
      desc: 'Le bouchon du maître pêcheur : un peu tout à la fois (ferrage plus facile, moins de fausses touches, poisson moins combatif) et 50 % d’expérience en plus !' }
];
let flotteurChoix = 'anglaise';

function flotteurCourant() {
    for (let i = 0; i < FLOTTEURS.length; i++) {
        if (FLOTTEURS[i].id === flotteurChoix) {
            return FLOTTEURS[i];
        }
    }
    return FLOTTEURS[0];
}

function appliquerFlotteurVisuel(f) {
    // La tige s'allonge selon le modèle (elle ressort plus ou moins de l'eau).
    floatStick.scale.y = f.longueur / 0.5;
    floatStick.position.y = 0.04 + f.longueur / 2;
    floatStick.material.color.set(f.couleur);
    floatBody.material.color.set(f.corps);
    floatStick.userData.longueur = f.longueur;
    // Bouchons lumineux : une petite lueur propre les rend lisibles la nuit.
    const lueur = capaciteBouchon(f).voyant;
    if (floatStick.material.emissive) {
        floatStick.material.emissive.set(lueur ? f.couleur : 0x000000);
        floatStick.material.emissiveIntensity = lueur ? 0.9 : 0;
    }
    if (floatBody.material.emissive) {
        floatBody.material.emissive.set(lueur ? 0x335566 : 0x000000);
        floatBody.material.emissiveIntensity = lueur ? 0.45 : 0;
    }
    // Le bas de ligne et l'hameçon suivent la profondeur réglée.
    appliquerProfondeurVisuelle();
}

function setFloatType(id) {
    const f = trouverFlotteur(id);
    // Un bouchon inconnu, ou pas encore acheté, ne peut pas être équipé.
    if (!f || !bouchonPossede(f.id)) {
        return;
    }
    flotteurChoix = f.id;
    if (floatSelect.value !== f.id) {
        floatSelect.value = f.id;
    }
    floatInfo.textContent = f.desc;
    appliquerFlotteurVisuel(f);
    // La profondeur est bornée par le bouchon choisi (une pose à coulisse va
    // beaucoup plus profond qu'une anglaise).
    setProfondeur(profondeurLigne);
    journal.bouchon = f.id;
    saveJournal();
}

// Retrouve un bouchon par son identifiant (ou null).
function trouverFlotteur(id) {
    for (let i = 0; i < FLOTTEURS.length; i++) {
        if (FLOTTEURS[i].id === id) {
            return FLOTTEURS[i];
        }
    }
    return null;
}

// Capacités du bouchon donné (ou du bouchon équipé) : les valeurs manquantes
// prennent la valeur neutre (CAPACITE_BASE).
function capaciteBouchon(f) {
    const c = (f || flotteurCourant()).capacite || {};
    return {
        fenetre: c.fenetre || CAPACITE_BASE.fenetre,
        fausses: c.fausses || CAPACITE_BASE.fausses,
        avantage: c.avantage || CAPACITE_BASE.avantage,
        temps: c.temps || CAPACITE_BASE.temps,
        xp: c.xp || CAPACITE_BASE.xp,
        voyant: !!c.voyant
    };
}

floatInfo.textContent = flotteurCourant().desc;
appliquerFlotteurVisuel(flotteurCourant());

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
    // Le nuage COULE jusqu'à la profondeur de la ligne : on amorce là où on pêche.
    chum.position.y += (HOOK_DEPTH - chum.position.y) * Math.min(1, dt * 0.7);
    chum.group.position.set(chum.position.x, chum.position.y + 0.35, chum.position.z);
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
// La bourriche est un « garde-poisson » posé au bord de l'eau : la gueule
// dépasse un peu de la surface et le filet pend dans l'eau. y = 0,32 la place
// juste au-dessus des vagues (la rive, elle, est plus haute : RIVE_Y).
const BOURRICHE_POS = new THREE.Vector3(-12, 0.32, 13);
const BOURRICHE_RADIUS = 1.6;      // rayon de la gueule (tolérance d'entrée)
const FISH_THROW_MIN = 2;          // portée mini du lancer du poisson
const FISH_THROW_MAX = 14;         // portée maxi
const FISH_THROW_WIND = 1.6;       // influence du vent sur le lancer
const FISH_THROW_DURATION = 0.8;   // durée du vol (s)
const FISH_THROW_OSC = 1.6;        // vitesse d'oscillation de la jauge

// La bourriche 3D : un anneau (la gueule) et un filet qui pend dans l'eau.
const bourriche = new THREE.Group();
const bourricheRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.05, 8, 24),   // gueule de 36 cm de rayon (réelle)
    new THREE.MeshStandardMaterial({ color: 0x9a7b46, roughness: 0.8 })
);
bourricheRing.rotation.x = Math.PI / 2;
bourricheRing.position.y = 0.12;
bourricheRing.castShadow = true;
bourriche.add(bourricheRing);
const bourricheNet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.4, 1.3, 16, 1, true),
    new THREE.MeshStandardMaterial({
        // Bourriche = panier d'osier : OPAQUE. Un filet translucide donnait
        // l'impression d'un objet « sous un voile ».
        color: 0x3f5540, roughness: 0.95, side: THREE.DoubleSide
    })
);
bourricheNet.position.y = -1.2;
bourriche.add(bourricheNet);
// Taille RÉALISTE (environ 1 m de gueule) : sans cette mise à l'échelle, la
// bourriche est presque aussi haute que le pêcheur et ressemble à un gros seau.
// La tolérance de jeu (BOURRICHE_RADIUS) reste généreuse : elle ne change pas.
bourriche.scale.setScalar(0.66);
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
const journal = { total: 0, totalWeight: 0, best: 0, last: [], especes: {}, experience: 0, bouchons: BOUCHONS_DE_DEPART.slice() };
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
        if (typeof data.bouchon === 'string') {
            flotteurChoix = data.bouchon;
        }
        // Expérience gagnée en pêchant, et bouchons achetés à la boutique.
        journal.experience = Math.max(0, Math.floor(data.experience || 0));
        journal.bouchons = BOUCHONS_DE_DEPART.slice();
        const achetes = Array.isArray(data.bouchons) ? data.bouchons : [];
        achetes.forEach(id => {
            if (trouverFlotteur(id) && journal.bouchons.indexOf(id) < 0) {
                journal.bouchons.push(id);
            }
        });
        // Bouchon sauvegardé qui n'est plus possédé : on repasse au premier offert.
        if (journal.bouchons.indexOf(flotteurChoix) < 0) {
            flotteurChoix = BOUCHONS_DE_DEPART[0];
        }
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
    xpLabel.textContent = '⭐ ' + journal.experience + ' XP';
    shopXp.textContent = '⭐ ' + journal.experience + ' XP';
    // Le carnet a changé (XP, prises…) : la boutique doit se rafraîchir aussi,
    // sinon les boutons d'achat restent grisés alors qu'on a assez d'expérience.
    renderBoutique();
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
    const ancienRecord = fiche.record || 0;
    fiche.n += 1;
    // Un record est BATTU si le poisson est plus lourd que le précédent (le
    // tout premier poisson d'une espèce établit son record).
    const nouveauRecord = weight > ancienRecord;
    if (nouveauRecord) {
        fiche.record = Math.round(weight * 100) / 100;
    }
    partieStats.poissons += 1;
    partieStats.poids = Math.round((partieStats.poids + weight) * 100) / 100;
    const ancienPartie = partieStats.records[nom] || 0;
    if (weight > ancienPartie) {
        partieStats.records[nom] = Math.round(weight * 100) / 100;
    }
    saveJournal();
    renderJournal();
    return { nouveauRecord: nouveauRecord, ancienRecord: ancienRecord };
}

// ---------------------------------------------------------------------------
// Expérience et boutique de bouchons
// ---------------------------------------------------------------------------
// On gagne de l'expérience (XP) en rangeant des poissons dans la bourriche :
// plus le poisson est lourd, plus il rapporte. Cette expérience sert à ACHETER
// des bouchons aux capacités spéciales (moins de fausses touches, combat plus
// court, visible la nuit…).

function xpPourPrise(poids) {
    // Courbe douce : la racine évite qu'un très gros poisson achète tout d'un coup.
    const brut = 5 + Math.sqrt(Math.max(0, poids || 0)) * 12;
    return Math.max(3, Math.round(brut * capaciteBouchon().xp));
}

// Encaisse l'expérience d'une prise. Renvoie le nombre de XP gagnés.
function gagnerExperience(poids) {
    const gain = xpPourPrise(poids);
    journal.experience += gain;
    saveJournal();
    renderJournal();
    return gain;
}

function bouchonPossede(id) {
    return journal.bouchons.indexOf(id) >= 0;
}

// Achète un bouchon avec l'expérience. Renvoie true si l'achat a réussi.
function acheterBouchon(id) {
    const f = trouverFlotteur(id);
    if (!f || bouchonPossede(id) || journal.experience < f.prix) {
        return false;
    }
    journal.experience -= f.prix;
    journal.bouchons.push(id);
    saveJournal();
    renderJournal();
    return true;
}

// La ligne casse (nénuphars) : le bouchon part avec elle ! S'il avait été ACHETÉ
// (payé avec de l'expérience), il quitte l'inventaire et on repêche avec un
// bouchon de départ. Renvoie le bouchon perdu, ou null si c'était un bouchon
// offert (les bouchons de départ sont toujours dans le sac).
function perdreLeBouchon() {
    const flotteur = flotteurCourant();
    if ((flotteur.prix || 0) <= 0) {
        return null;
    }
    const index = journal.bouchons.indexOf(flotteur.id);
    if (index >= 0) {
        journal.bouchons.splice(index, 1);
    }
    // On reprend le premier bouchon offert.
    flotteurChoix = BOUCHONS_DE_DEPART[0];
    saveJournal();
    setFloatType(flotteurChoix);
    renderJournal();          // (rafraîchit aussi la boutique : on peut le racheter)
    return flotteur;
}

// Construit la liste déroulante (bouchons possédés) et la boutique.
function renderBoutique() {
    // 1) La liste déroulante ne propose que ce qu'on possède.
    let options = '';
    FLOTTEURS.forEach(f => {
        if (bouchonPossede(f.id)) {
            options += '<option value="' + f.id + '">' + f.nom + '</option>';
        }
    });
    floatSelect.innerHTML = options;
    if (bouchonPossede(flotteurChoix)) {
        floatSelect.value = flotteurChoix;
    }
    if (!boutique) {
        return;
    }
    // 2) La boutique : un bouton « Équiper » ou « Acheter » pour chaque bouchon.
    let html = '';
    FLOTTEURS.forEach(f => {
        const possede = bouchonPossede(f.id);
        const equipe = f.id === flotteurChoix;
        const assez = journal.experience >= f.prix;
        let bouton;
        if (possede) {
            bouton = equipe
                ? '<button class="shop-btn equipped" disabled>✅ Équipé</button>'
                : '<button class="shop-btn" data-action="equiper" data-id="' + f.id + '">Équiper</button>';
        } else {
            bouton = '<button class="shop-btn buy" data-action="acheter" data-id="' + f.id + '"'
                + (assez ? '' : ' disabled') + '>Acheter · ' + f.prix + ' XP</button>';
        }
        html += '<div class="shop-item' + (possede ? ' owned' : '') + '">'
            + '<div class="shop-name">' + f.nom
            + (possede ? '' : ' <span class="shop-price">' + f.prix + ' XP</span>') + '</div>'
            + (f.atout ? '<div class="shop-trait">' + f.atout + '</div>' : '')
            + '<div class="shop-desc">' + f.desc + '</div>'
            + bouton + '</div>';
    });
    boutique.innerHTML = html;
}

// Fiche « comment reconnaître les touches » : le petit livre du pêcheur.
// On y retrouve tout le catalogue, séparé en fausses et vraies touches.
function renderFicheTouches() {
    if (!ficheTouches) {
        return;
    }
    let html = '';
    [false, true].forEach(function (vrai) {
        html += '<div class="touch-titre' + (vrai ? ' vrai' : '') + '">'
            + (vrai ? '✅ VRAIES touches — il faut ferrer !' : '❌ Fausses touches — ne ferre pas')
            + '</div>';
        TOUCHES.forEach(function (t) {
            if (t.vrai !== vrai) {
                return;
            }
            html += '<div class="touch-item"><b>' + t.nom + '</b><span>' + t.desc + '</span></div>';
        });
    });
    ficheTouches.innerHTML = html;
}

// Un seul écouteur pour toute la boutique (les boutons sont recréés souvent).
boutique.addEventListener('click', event => {
    const cible = event.target;
    if (!cible || !cible.dataset || !cible.dataset.id) {
        return;
    }
    const id = cible.dataset.id;
    if (cible.dataset.action === 'equiper') {
        ensureSound();
        setFloatType(id);
        sound.reel();
    } else if (cible.dataset.action === 'acheter') {
        if (acheterBouchon(id)) {
            ensureSound();
            setFloatType(id);
            sound.catchFish();
            const f = trouverFlotteur(id);
            statusDisplay.textContent = f.nom + ' acheté et équipé ! ' + f.atout;
        } else {
            statusDisplay.textContent = 'Pas assez d’expérience : pêche encore des poissons pour ce bouchon !';
        }
    }
    renderBoutique();
});

// ---------------------------------------------------------------------------
// Onglets du carnet : Prises / Boutique / Touches / Options
// ---------------------------------------------------------------------------
function montrerOnglet(nom) {
    Object.keys(tabPages).forEach(function (cle) {
        const page = tabPages[cle];
        if (page) {
            page.classList.toggle('active', cle === nom);
            // Masquage infaillible : on force le style en ligne (indépendant du CSS).
            page.style.display = (cle === nom) ? '' : 'none';
            if (cle === nom) {
                page.scrollTop = 0;   // on ouvre l'onglet en haut
            }
        }
    });
}

if (journalTabs) {
    journalTabs.addEventListener('click', function (event) {
        const cible = event.target;
        if (cible && cible.dataset && cible.dataset.tab) {
            montrerOnglet(cible.dataset.tab);
        }
    });
}

// ---------------------------------------------------------------------------
// Carte de l'étang : dessinée d'après le VRAI étang (mêmes positions que la
// scène 3D : bord, fosses, nénuphars, pêcheur, bourriche et bouchon).
// ---------------------------------------------------------------------------
const ZONES_CARTE = [
    { nom: 'Bord, près de la surface', min: -1.2, max: 0.1, couleur: '#4aa3c4' },
    { nom: 'Pleine eau', min: -2.4, max: -1.2, couleur: '#2e7f9c' },
    { nom: 'Le fond', min: -3.5, max: -2.4, couleur: '#1f5f7a' }
];

function rendreCarteEtang() {
    if (!pondMap) {
        return;
    }
    const R = POND_RADIUS;
    const cx = 100;
    const cy = 60;
    const ech = 100 / (2 * R);              // unités du monde → pixels du plan
    const mx = function (x) { return cx + (x - POND_CENTER.x) * ech; };
    const mz = function (z) { return cy + (z - POND_CENTER.z) * ech; };
    let svg = '<svg viewBox="0 0 200 120" role="img" aria-label="Carte de l’étang">';
    svg += '<rect x="0" y="0" width="200" height="120" rx="10" fill="#2f6b3f"/>';
    // L'eau : des BANDES DE PROFONDEUR calculées avec le VRAI relief (plus c'est
    // foncé, plus c'est profond) — la carte sert vraiment à choisir où lancer.
    const TEINTES = ['#74c6e0', '#5cb4d2', '#48a2c4', '#3790b3', '#2b7ea1', '#216b8e', '#18597a', '#124a67'];
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R * ech).toFixed(1) + '" fill="' + TEINTES[0] + '"/>';
    for (let i = 1; i < TEINTES.length; i++) {
        const prof = FOND_BORD + (i / TEINTES.length) * (FOND_CENTRE - FOND_BORD);
        const frac = (prof - FOND_BORD) / (FOND_CENTRE - FOND_BORD);
        if (frac <= 0.02 || frac >= 0.99) {
            continue;
        }
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="'
            + (R * Math.sqrt(1 - frac) * ech).toFixed(1) + '" fill="' + TEINTES[i] + '"/>';
    }
    // ISOBATHES : les courbes de 1 m et 2 m (le 3 m n'existe que dans les fosses,
    // annotées juste après), avec leur valeur écrite.
    [2, 4].forEach(function (unites) {
        const frac = (unites - FOND_BORD) / (FOND_CENTRE - FOND_BORD);
        if (frac <= 0.02 || frac >= 0.99) {
            return;
        }
        const rr = R * Math.sqrt(1 - frac) * ech;
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rr.toFixed(1)
            + '" fill="none" stroke="#eaf6ff" stroke-width="0.7" stroke-dasharray="2.5 1.5" opacity="0.9"/>';
        svg += '<text x="' + (cx + rr * 0.7).toFixed(1) + '" y="' + (cy - rr * 0.7 + 2).toFixed(1)
            + '" font-size="6.4" font-weight="bold" fill="#ffffff" stroke="#0d3348" stroke-width="0.5">'
            + (unites / 2) + ' m</text>';
    });
    // Les deux FOSSES : les points les plus profonds de l'étang.
    FOSSES.forEach(function (fosse) {
        svg += '<circle cx="' + mx(fosse.x).toFixed(1) + '" cy="' + mz(fosse.z).toFixed(1)
            + '" r="' + (fosse.rayon * ech).toFixed(1)
            + '" fill="rgba(6, 34, 52, 0.42)" stroke="#bfe6f5" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>';
        svg += '<text x="' + mx(fosse.x).toFixed(1) + '" y="' + (mz(fosse.z) + 2).toFixed(1)
            + '" text-anchor="middle" font-size="4.8" fill="#ffffff">fosse '
            + ((FOND_CENTRE + fosse.plus) / 2).toFixed(1).replace('.', ',') + ' m</text>';
    });
    // Les nénuphars, aux VRAIES positions (aléatoires à chaque partie).
    lilyPads.forEach(function (pad) {
        svg += '<circle cx="' + mx(pad.x).toFixed(1) + '" cy="' + mz(pad.z).toFixed(1)
            + '" r="' + Math.max(1.4, pad.radius * ech).toFixed(1) + '" fill="#3f7d4a"/>';
    });
    // La bourriche (jaune) et le pêcheur (blanc), eux aussi à leur vraie place.
    svg += '<circle cx="' + mx(BOURRICHE_POS.x).toFixed(1) + '" cy="' + mz(BOURRICHE_POS.z).toFixed(1)
        + '" r="2.4" fill="#c9a227"/>';
    svg += '<circle cx="' + mx(angler.position.x).toFixed(1) + '" cy="' + mz(angler.position.z).toFixed(1)
        + '" r="3.2" fill="#f2f2f2" stroke="#222222" stroke-width="0.8"/>';
    // Le bouchon, s'il est à l'eau.
    if (floatState !== 'idle') {
        svg += '<circle cx="' + mx(floatGroup.position.x).toFixed(1) + '" cy="'
            + mz(floatGroup.position.z).toFixed(1) + '" r="1.8" fill="#ff5a3c"/>';
    }
    svg += '</svg>';
    // Légende : les espèces de chaque zone, d'après leurs profondeurs RÉELLES.
    // Échelle de profondeur, en clair (c'est ce qui aide à choisir son poste).
    const profMax = FOND_CENTRE + Math.max.apply(null, FOSSES.map(function (f) { return f.plus; }));
    let legende = '<div class="map-profondeur">Profondeur : <b>'
        + (FOND_BORD / 2).toFixed(1).replace('.', ',') + ' m</b> au bord → <b>'
        + (FOND_CENTRE / 2).toFixed(1).replace('.', ',') + ' m</b> au centre → <b>'
        + (profMax / 2).toFixed(1).replace('.', ',') + ' m</b> dans les fosses — plus c’est foncé, plus c’est profond.</div>';
    legende += '<div class="map-legende">';
    ZONES_CARTE.forEach(function (zone) {
        const noms = SPECIES.filter(function (s) {
            const p = s.profondeur || [-3.4, -0.9];
            const mid = (p[0] + p[1]) / 2;
            return mid >= zone.min && mid < zone.max;
        }).sort(function (a, b) { return b.abondance - a.abondance; })
            .slice(0, 4).map(function (s) { return s.nom; });
        legende += '<div class="map-zone"><span class="map-pastille" style="background:'
            + zone.couleur + '"></span>' + zone.nom + ' : ' + (noms.join(', ') || '—') + '</div>';
    });
    legende += '</div>';
    // Profondeur à l'endroit du bouchon (et profondeur de l'hameçon).
    if (floatState !== 'idle') {
        const profLocale = profondeurLocale(floatGroup.position.x, floatGroup.position.z);
        legende += '<div class="map-zone">🌊 Ici : ' + (profLocale / 2).toFixed(1).replace('.', ',')
            + ' m d’eau · hameçon à ' + (profondeurLigne / 2).toFixed(1).replace('.', ',') + ' m'
            + (hameconDansLaVase ? ' — <b>dans la vase !</b>' : '') + '</div>';
    }
    pondMap.innerHTML = svg + legende;
}

// ---------------------------------------------------------------------------
// Onglet « Espèces » : une fiche par poisson (Précédent / Suivant).
// ---------------------------------------------------------------------------
function zoneDeProfondeur(mid) {
    if (mid >= ZONES_CARTE[0].min) {
        return ZONES_CARTE[0].nom;
    }
    if (mid >= ZONES_CARTE[1].min) {
        return ZONES_CARTE[1].nom;
    }
    return ZONES_CARTE[2].nom;
}

function abondanceLabel(a) {
    if (a >= 9) return 'très commune';
    if (a >= 6) return 'commune';
    if (a >= 3) return 'peu commune';
    return 'rare';
}

function comportementLabel(agressivite) {
    const a = (agressivite[0] + agressivite[1]) / 2;
    if (a >= 1.1) return 'vif et combatif';
    if (a >= 0.85) return 'combatif';
    return 'calme';
}

// Silhouette simple de l'espèce, d'après sa forme 3D et sa couleur.
function silhouetteEspece(e) {
    const forme = FORMES[e.form] || FORMES.fusiforme;
    const couleur = '#' + ('000000' + (e.couleur || 0x99a0a5).toString(16)).slice(-6);
    const bx = Math.min(44, 20 + forme.bodyX * 11);
    const by = Math.min(28, 7 + forme.bodyY * 17);
    const gauche = 64 - bx;
    return '<svg class="espece-silhouette" viewBox="0 0 120 56" role="img" aria-label="' + e.nom + '">'
        + '<polygon points="18,28 ' + (gauche + 8).toFixed(1) + ',12 '
        + (gauche + 8).toFixed(1) + ',44" fill="' + couleur + '"/>'
        + '<ellipse cx="64" cy="28" rx="' + bx.toFixed(1) + '" ry="' + by.toFixed(1)
        + '" fill="' + couleur + '"/>'
        + '<circle cx="' + (64 + bx * 0.62).toFixed(1) + '" cy="24" r="2.4" fill="#111"/>'
        + '</svg>';
}

function ligneEspece(label, valeur) {
    return '<div class="espece-ligne"><b>' + label + '</b><span>' + valeur + '</span></div>';
}

function renderEspece() {
    if (!especeFiche) {
        return;
    }
    const liste = SPECIES;
    if (!liste.length) {
        return;
    }
    especeIndex = ((especeIndex % liste.length) + liste.length) % liste.length;
    const e = liste[especeIndex];
    const fiche = journal.especes[e.nom] || { n: 0, record: 0 };
    const p = e.profondeur || [-3.4, -0.9];
    // Style propre à l'espèce : ses touches et sa façon de se battre.
    const style = styleEspece(e.id);
    const nomsTouches = style.touchesVraies.map(function (id) {
        const t = TOUCHES_PAR_ID[id];
        return t ? t.nom : id;
    }).join(' · ');
    const infos = ligneEspece('Taille réelle', e.cm[0] + ' à ' + e.cm[1] + ' cm')
        + ligneEspece('Poids', fmtPoids(poidsRealisteKilos(e, e.cm[0])) + ' à '
            + fmtPoids(poidsRealisteKilos(e, e.cm[1])))
        + ligneEspece('Où ?', zoneDeProfondeur((p[0] + p[1]) / 2))
        + ligneEspece('Comportement', comportementLabel(e.agressivite))
        + ligneEspece('Touches', nomsTouches || '—')
        + ligneEspece('Combat', style.nom + ' : ' + style.resume)
        + ligneEspece('Abondance', abondanceLabel(e.abondance))
        + ligneEspece('Silhouette', e.form);
    especeFiche.innerHTML = silhouetteEspece(e)
        + '<h3 class="espece-nom">' + e.nom + '</h3>'
        + '<div class="espece-infos">' + infos + '</div>'
        + '<div class="espece-record">' + (fiche.n > 0
            ? '🧺 ' + fiche.n + (fiche.n > 1 ? ' prises' : ' prise') + ' · record '
                + fmtPoids(fiche.record || 0)
            : 'Pas encore attrapé — à toi de jouer !')
        + '</div>';
    especePage.textContent = (especeIndex + 1) + ' / ' + liste.length;
    // Le nom de l'onglet rappelle combien d'espèces ont été découvertes.
    if (tabBtnEspeces) {
        const decouvertes = liste.filter(function (s) {
            return journal.especes[s.nom] && journal.especes[s.nom].n > 0;
        }).length;
        tabBtnEspeces.textContent = '🐟 Espèces (' + decouvertes + '/' + liste.length + ')';
    }
}

if (especePrev) {
    especePrev.addEventListener('click', function () {
        especeIndex -= 1;
        renderEspece();
    });
}
if (especeNext) {
    especeNext.addEventListener('click', function () {
        especeIndex += 1;
        renderEspece();
    });
}

function showJournal() {
    renderJournal();
    renderEspece();
    rendreCarteEtang();
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
    // Bien visible depuis la berge : levé au-dessus de l'épaule, côté caméra.
    fish.rotation.set(0, Math.PI * 0.75, 0);
    fish.position.set(angler.position.x + 1.5, 3.6, angler.position.z + 1.1);
    floatState = 'holding';
    floatGroup.position.copy(floatIdle);
    fishThrowState = 'idle';
    fishThrowTarget = fishThrowPowerFor(bourricheDistance());
    fishButton.disabled = true;
    fishButton.textContent = 'Lance le poisson !';
    const espece = fish.userData.espece ? fish.userData.espece + ' ' : '';
    spawnFloatingText((fish.userData.espece || 'Poisson') + ' au bord !', fish.position, '#9ef0c0');
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
    recordBattu = null;
    // On enregistre d'abord : le carnet nous dit si c'est un NOUVEAU RECORD.
    const entree = addJournalEntry(weight, fish.userData.espece);
    showCatchMessage(weight, fish.userData.espece, entree.nouveauRecord);
    const gainXp = gagnerExperience(weight);
    sound.catchFish();
    spawnRipple(BOURRICHE_POS);
    spawnSplash(BOURRICHE_POS);
    if (entree.nouveauRecord) {
        annoncerRecord(weight, fish.userData.espece, entree.ancienRecord);
        return;
    }
    statusDisplay.textContent = 'Dans la bourriche ! ' + fish.userData.espece + ' — '
        + fmtPoids(weight) + ' (+1 · +' + gainXp + ' XP) 🧺';
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
    // LANCER TROP FORT : la jauge au maximum casse la ligne (et coûte une vie).
    if (castPower >= 0.995) {
        castState = 'idle';
        feedGauge.classList.remove('active');
        casserLigne('Lancer beaucoup trop fort');
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
floatSelect.addEventListener('change', () => {
    setFloatType(floatSelect.value);
    renderBoutique();
});
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
setFloatType(flotteurChoix);
renderJournal();
renderBoutique();

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
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.8], agressivite: [0.55, 0.85], style: 'nerveux', couleur: 0xbfcbd0, motif: 'argent' },
    { id: 'rotengle', nom: 'Rotengle', form: 'fusiforme', cm: [15, 35], k: 1.1, abondance: 8,
      profondeur: [-1.6, -0.7], combativite: [0.5, 0.85], agressivite: [0.6, 0.9], style: 'nerveux', couleur: 0xb9c6c0, nageoires: 0xc0522a, motif: 'argent' },
    { id: 'ablette', nom: 'Ablette', form: 'petit', cm: [8, 18], k: 0.9, abondance: 9,
      profondeur: [-1.3, -0.7], combativite: [0.4, 0.65], agressivite: [0.6, 0.95], style: 'nerveux', couleur: 0xd2dcdf, motif: 'argent' },
    { id: 'goujon', nom: 'Goujon', form: 'petit', cm: [10, 22], k: 1.3, abondance: 7,
      profondeur: [-3.0, -2.0], combativite: [0.4, 0.7], agressivite: [0.5, 0.8], style: 'teigneux', couleur: 0xc2a878, motif: 'taches' },
    { id: 'breme', nom: 'Brème', form: 'plat', cm: [25, 60], k: 1.8, abondance: 6,
      profondeur: [-2.8, -1.8], combativite: [0.55, 0.9], agressivite: [0.5, 0.8], style: 'aspirateur', couleur: 0x9d8f63, motif: 'ecailles' },
    { id: 'tanche', nom: 'Tanche', form: 'profond', cm: [25, 55], k: 1.7, abondance: 5,
      profondeur: [-3.2, -2.2], combativite: [0.7, 1.05], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0x4f6b3c, oeil: 0xc0392b, motif: 'mouchetures' },
    { id: 'carpe', nom: 'Carpe', form: 'profond', cm: [35, 95], k: 2.3, abondance: 6,
      profondeur: [-3.2, -2.2], combativite: [0.9, 1.2], agressivite: [0.7, 1.05], style: 'lourd', couleur: 0xa8853f, motif: 'ecailles' },
    { id: 'carassin', nom: 'Carassin', form: 'profond', cm: [18, 40], k: 2.2, abondance: 5,
      profondeur: [-2.8, -1.9], combativite: [0.6, 0.9], agressivite: [0.6, 0.95], style: 'aspirateur', couleur: 0xb08b3a, motif: 'ecailles' },
    { id: 'perche', nom: 'Perche', form: 'bossu', cm: [15, 45], k: 1.4, abondance: 7,
      profondeur: [-2.6, -1.5], combativite: [0.7, 1.05], agressivite: [0.9, 1.25], style: 'teigneux', couleur: 0x6f7a45, nageoires: 0xc0522a, motif: 'rayures' },
    { id: 'chevesne', nom: 'Chevesne', form: 'fusiforme', cm: [25, 60], k: 1.2, abondance: 5,
      profondeur: [-1.8, -0.8], combativite: [0.8, 1.15], agressivite: [0.9, 1.25], style: 'fonceur', couleur: 0x9aa39c, motif: 'argent' },
    { id: 'brochet', nom: 'Brochet', form: 'torpille', cm: [40, 120], k: 0.9, abondance: 3,
      profondeur: [-2.2, -1.0], combativite: [0.9, 1.25], agressivite: [1.25, 1.6], style: 'fonceur', couleur: 0x4c5c33, motif: 'tachesClaires' },
    { id: 'sandre', nom: 'Sandre', form: 'torpille', cm: [35, 90], k: 0.8, abondance: 2,
      profondeur: [-3.4, -2.4], combativite: [0.85, 1.15], agressivite: [1.1, 1.45], style: 'glisseur', couleur: 0x8f9a83, motif: 'barres' },
    { id: 'black-bass', nom: 'Black-bass', form: 'bossu', cm: [25, 55], k: 1.6, abondance: 2,
      profondeur: [-2.4, -1.3], combativite: [0.9, 1.2], agressivite: [1.1, 1.5], style: 'fonceur', couleur: 0x556a3f, motif: 'bandeLaterale' },
    { id: 'truite', nom: 'Truite', form: 'fusiforme', cm: [20, 55], k: 1.2, abondance: 2,
      profondeur: [-2.2, -1.0], combativite: [0.8, 1.15], agressivite: [1.0, 1.35], style: 'fonceur', couleur: 0x7d6a4a, motif: 'pointsRouges' },
    { id: 'anguille', nom: 'Anguille', form: 'anguille', cm: [40, 110], k: 0.2, abondance: 2,
      profondeur: [-3.4, -2.6], combativite: [1.0, 1.4], agressivite: [1.1, 1.5], style: 'glisseur', couleur: 0x3f4a30, motif: 'aucun' },
    { id: 'silure', nom: 'Silure', form: 'barbu', cm: [80, 200], k: 1.0, abondance: 1,
      profondeur: [-3.4, -2.6], combativite: [1.1, 1.5], agressivite: [1.2, 1.55], style: 'lourd', couleur: 0x474b42, motif: 'marbrures' }
];

// ---------------------------------------------------------------------------
// STYLES DE COMBAT — chaque espèce a SA façon de se battre… et SES touches.
// Une carpe ne se joue pas comme un brochet : l'une pèse de tout son poids au
// fond, l'autre part en trombe de côté. Un gardon tapote l'esche, une tanche la
// soulève, un chevesne l'emporte d'un coup sec.
//
//   touchesVraies / touchesFausses : dessins du bouchon propres à l'espèce
//   traction   : multiplicateur de la force de traction (le poisson « pèse »)
//   coups      : multiplicateur des tirades brusques
//   intervalle : multiplicateur du temps entre deux tirades (> 1 = plus calme)
//   endurance  : durée (s) avant que le poisson ne soit épuisé (fatigue)
//   derive     : écart latéral pendant les tirades (0 = il tire droit)
// ---------------------------------------------------------------------------
const STYLES_COMBAT = {
    nerveux: {
        nom: 'Nerveux',
        resume: 'tapote et sautille, puis vole l’esche d’un coup sec : bref mais électrique.',
        touchesVraies: ['coulee_franche', 'enfoncement_sec'],
        touchesFausses: ['tapote', 'danse', 'frisson', 'double_coup'],
        traction: 0.9, coups: 1.2, intervalle: 0.75, endurance: 4, derive: 0.9
    },
    teigneux: {
        nom: 'Teigneux',
        resume: 'se débat sur place par petits coups secs et répétés : ça ne dure pas, mais ça secoue.',
        touchesVraies: ['coulee_franche', 'file_sous_leau', 'couchage_franc'],
        touchesFausses: ['tapote', 'double_coup', 'hesitation', 'couchage_manque'],
        traction: 1.0, coups: 1.3, intervalle: 0.95, endurance: 7, derive: 0.6
    },
    aspirateur: {
        nom: 'Aspirateur',
        resume: 'soulève l’appât : le bouchon MONTE, puis il pèse de tout son poids vers le fond.',
        touchesVraies: ['ascenseur', 'remontee_seche'],
        touchesFausses: ['fausse_remontee', 'couchage_manque', 'frisson'],
        traction: 1.05, coups: 0.9, intervalle: 1.2, endurance: 9, derive: 0.4
    },
    fonceur: {
        nom: 'Fonceur',
        resume: 'part d’un coup et file DE CÔTÉ : tirades latérales violentes, mais il s’épuise vite.',
        touchesVraies: ['file_sous_leau', 'enfoncement_sec', 'remontee_seche'],
        touchesFausses: ['double_coup', 'derive', 'frisson'],
        traction: 1.15, coups: 1.4, intervalle: 0.9, endurance: 6, derive: 1.4
    },
    glisseur: {
        nom: 'Glisseur',
        resume: 's’enroule et tire par à-coups irréguliers : imprévisible, et il fatigue lentement.',
        touchesVraies: ['coulee_franche', 'file_sous_leau'],
        touchesFausses: ['derive', 'tourne_sur_place', 'hesitation'],
        traction: 1.2, coups: 1.1, intervalle: 1.05, endurance: 12, derive: 0.7
    },
    lourd: {
        nom: 'Lourd',
        resume: 'une ancre : traction énorme et régulière, peu de tirades… et il ne se fatigue presque pas.',
        touchesVraies: ['coulee_lente', 'ascenseur'],
        touchesFausses: ['enfonce_partiel', 'hesitation', 'couchage_manque'],
        traction: 1.35, coups: 0.8, intervalle: 1.35, endurance: 14, derive: 0.3
    }
};

const STYLE_DEFAUT = {
    nom: 'Ordinaire', resume: 'un poisson ordinaire.',
    touchesVraies: [], touchesFausses: [],
    traction: 1, coups: 1, intervalle: 1, endurance: 7, derive: 0.5
};

// Style de combat d'une espèce (d'après son identifiant).
function styleEspece(especeId) {
    for (let i = 0; i < SPECIES.length; i++) {
        if (SPECIES[i].id === especeId) {
            return STYLES_COMBAT[SPECIES[i].style] || STYLE_DEFAUT;
        }
    }
    return STYLE_DEFAUT;
}

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
    // Profondeur du DOS du poisson : chaque espèce a SA zone (un sandre reste au
    // fond, une ablette près de la surface). Déduite de la phase (déjà aléatoire)
    // pour ne pas décaler le monde reproductible des tests.
    const plage = espece.profondeur || [-3.4, -0.9];
    const tProf = (Math.sin(fish.userData.phase) + 1) / 2;      // 0 → 1
    fish.userData.depth = plage[0] + tProf * (plage[1] - plage[0]);
    // Le poisson ne peut pas nager DANS le fond : il reste au-dessus du relief.
    fish.userData.depth = Math.max(fish.userData.depth,
        fondY(fish.position.x, fish.position.z) + 0.35);
    fish.position.y = fish.userData.depth - fish.userData.topOffset;
    // Sa tranche d'eau : il ne viendra à l'hameçon que si celui-ci y est.
    fish.userData.profondeurZone = plage.slice();
    // Domaine vital : chaque poisson reste dans SON coin d'étang (il ne traverse
    // pas tout l'étang). Rayon déduit de la phase, sans tirage aléatoire en plus.
    fish.userData.homeX = fish.position.x;
    fish.userData.homeZ = fish.position.z;
    fish.userData.homeRadius = 10 + tProf * 12;                 // 10 à 22 unités
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
let castT = 0;
let waitTimer = 0;
let reelIdle = 0;                // secondes sans toucher la manivelle pendant la remontée
let avertiRemontee = false;      // a-t-on prévenu de la remontée automatique ?
let hameconDansLaVase = false;   // hameçon posé dans la vase (profondeur trop grande)
let depuisLancement = 99;        // temps écoulé depuis que le bouchon s'est posé
let biteFish = null;
let biteCooldown = 0;
let biteViewActive = false;
// Phases de la touche : le joueur suit son bouchon DE LOIN (vue réaliste).
//   'floating' = le bouchon flotte (rien ne mord)
//   'fausse'   = fausse touche (le bouchon bouge, mais ce n'est pas LE moment)
//   'touche'   = la VRAIE touche (fenêtre de ferrage)
//   'ratee'    = la fenêtre est passée (dernière chance de ferrer)
let bitePhase = 'floating';
let biteViewTimer = 0;
let biteSinkAt = 0;
let biteViewHideTimer = -1;         // fermeture différée de la touche (après un raté)
let biteNibbleTimer = 0;
let biteTouche = null;              // la VRAIE touche en cours (objet du catalogue)
let biteFauxTouche = null;          // la fausse touche en cours
let biteStyle = null;               // style de combat du poisson qui a mordu
const biteOrigine = new THREE.Vector3();  // position du bouchon au début du mouvement
let biteRetourY = 0.1;              // hauteur du bouchon quand la fenêtre se referme
let biteRetourRot = 0;              // inclinaison à ce moment-là
let biteSignauxRestants = 1;
let biteSignalTimer = 0;
let biteSignalDuree = 0.5;
let biteFenetre = 0.4;              // durée de la fenêtre de ferrage
let strikeQuality = '';             // '' | 'parfait' | 'tot' | 'tard'
let fightAdvantage = 1;             // < 1 = avantage au joueur, > 1 = au poisson
// Fenêtre pour ferrer : temps pendant lequel le bouchon s'enfonce avant que le
// poisson ne recrache l'hameçon. Plus elle est courte, plus le ferrage est dur.
let BITE_WINDOW = 0.7;
// Le poisson mordille le bouchon avant de l'enfoncer : le joueur est prévenu.
const BITE_NIBBLE_DURATION = 0.6;
// Durée pendant laquelle on laisse « Trop tard ! » affiché après une touche
// ratée. Comptée par la boucle de jeu (et plus courte que le temps de
// récupération) pour ne jamais refermer une NOUVELLE touche par erreur.
const BITE_VIEW_LINGER = 0.7;
// ---------------------------------------------------------------------------
// CATALOGUE DES TOUCHES — comment bouge un VRAI bouchon
// ---------------------------------------------------------------------------
// Comme au bord de l'eau, le bouchon est plombé : seule sa tige dépasse. Un
// poisson qui SOULÈVE l'appât fait monter le bouchon (« ascenseur ») ; un poisson
// qui tire vers le fond ou de côté le fait plonger ou partir. Tant qu'il ne fait
// que renifler, tapoter ou frôler la ligne, le bouchon ne fait que frémir :
// CE N'EST PAS LE MOMENT de ferrer. Tout le jeu est de reconnaître le dessin…
//
//   forme  : dessin du mouvement (voir mouvementDeTouche)
//   a      : amplitude (unités ; le bouchon mesure ~3,5 unités avec sa tige)
//   duree  : durée du mouvement (s) — long = poisson calme, court = poisson vif
//   rot    : inclinaison maximale (radians ; 1,35 ≈ couché sur le côté)
//   derive : déplacement latéral (unités)
//   vrai   : faut-il FERRER quand on voit ça ?
//   famille: 'enfoncement' | 'remontee' | 'couchage' | 'derive' | 'fausse'
//   qui    : quels poissons font ça ('tous' | 'petit' | 'gros' | 'vif')
const TOUCHES = [
    // ---------- FAUSSES TOUCHES : le bouchon bouge, mais ce n'est PAS le moment
    { id: 'frisson', nom: 'Frémissement', forme: 'frisson', coups: 4, a: 0.21, duree: 1.4,
      vrai: false, famille: 'fausse', qui: 'tous',
      desc: 'Le bouchon vibre sur place sans s’enfoncer : un poisson a frôlé la ligne.' },
    { id: 'tapote', nom: 'Tapotement', forme: 'pulse', coups: 3, a: 0.24, rot: 0.3, duree: 1.5,
      vrai: false, famille: 'fausse', qui: 'petit',
      desc: 'Deux ou trois petits coups secs vers le bas : il goûte l’esche et la recrache.' },
    { id: 'danse', nom: 'Danse du bouchon', forme: 'pulse', coups: 4, a: 0.21, rot: 0.28, duree: 1.8,
      vrai: false, famille: 'fausse', qui: 'petit',
      desc: 'Il sautille vite et sans s’enfoncer : les ablettes attaquent l’esche.' },
    { id: 'enfonce_partiel', nom: 'Enfoncement partiel', forme: 'sinus', a: 0.35, duree: 1.7,
      vrai: false, famille: 'enfoncement', qui: 'tous',
      desc: 'Il plonge à moitié, puis remonte tout seul : le poisson a lâché l’esche.' },
    { id: 'fausse_remontee', nom: 'Fausse remontée', forme: 'montee_retour', a: 0.28, duree: 1.6,
      vrai: false, famille: 'remontee', qui: 'tous',
      desc: 'Il monte un peu puis se repose : l’appât a été soulevé puis relâché.' },
    { id: 'couchage_manque', nom: 'Couchage manqué', forme: 'couchage_retour', rot: 1.2, a: 0.1, duree: 1.6,
      vrai: false, famille: 'couchage', qui: 'tous',
      desc: 'Il s’allonge un instant sur l’eau puis se redresse : la ligne s’est détendue.' },
    { id: 'derive', nom: 'Dérive', forme: 'derive', a: 0.16, derive: 1.1, rot: 0.18, duree: 2.2,
      vrai: false, famille: 'derive', qui: 'tous',
      desc: 'Il s’en va doucement de côté sans s’enfoncer : le courant pousse la ligne.' },
    { id: 'double_coup', nom: 'Deux coups', forme: 'double', a: 0.32, rot: 0.2, duree: 1.9,
      vrai: false, famille: 'enfoncement', qui: 'gros',
      desc: 'Il plonge deux fois à la même profondeur : un poisson méfiant qui essaie l’esche.' },
    { id: 'hesitation', nom: 'Touche hésitante', forme: 'hesitation', a: 0.35, rot: 0.18, duree: 2.1,
      vrai: false, famille: 'enfoncement', qui: 'gros',
      desc: 'Il descend par petits à-coups, hésite, puis remonte : le poisson n’est pas décidé.' },
    { id: 'tourne_sur_place', nom: 'Il tourne sur place', forme: 'tourner', a: 0.16, derive: 0.85, rot: 0.2, duree: 2.0,
      vrai: false, famille: 'derive', qui: 'gros',
      desc: 'Le bouchon décrit un petit cercle : un poisson tourne autour de l’esche.' },
    // ---------- VRAIES TOUCHES : c'est MAINTENANT qu'il faut ferrer
    { id: 'coulee_franche', nom: 'Coulée franche', forme: 'descente', a: 0.77, rot: 0.3, duree: 0.45,
      vrai: true, famille: 'enfoncement', qui: 'tous',
      desc: 'Il s’enfonce d’un coup et RESTE sous l’eau : la touche classique, à ferrer !' },
    { id: 'ascenseur', nom: 'Ascenseur (remontée)', forme: 'montee', a: 0.63, duree: 0.52,
      vrai: true, famille: 'remontee', qui: 'tous',
      desc: 'Il MONTE franchement (brème, tanche) : le poisson a soulevé les plombs. Ferrer !' },
    { id: 'coulee_lente', nom: 'Coulée lente et lourde', forme: 'descente_lente', a: 0.77, rot: 0.15, duree: 0.8,
      vrai: true, famille: 'enfoncement', qui: 'gros',
      desc: 'Il descend lentement, sans s’arrêter : le gros poisson part avec l’esche.' },
    { id: 'file_sous_leau', nom: 'Il file sous l’eau', forme: 'file', a: 0.7, derive: 0.9, rot: 0.5, duree: 0.52,
      vrai: true, famille: 'derive', qui: 'vif',
      desc: 'Il coule ET part de côté (perche, brochet) : le poisson détale. Ferrer vite !' },
    { id: 'couchage_franc', nom: 'Il se couche franchement', forme: 'couchage', rot: 1.35, a: 0.12, duree: 0.52,
      vrai: true, famille: 'couchage', qui: 'tous',
      desc: 'Il s’allonge complètement sur le côté : le poisson part au ras de l’eau. Ferrer !' },
    { id: 'enfoncement_sec', nom: 'Enfoncement sec', forme: 'descente', a: 0.88, rot: 0.12, duree: 0.45,
      vrai: true, famille: 'enfoncement', qui: 'vif',
      desc: 'Il disparaît d’un coup, très vite : un poisson vif a emporté l’esche.' },
    { id: 'remontee_seche', nom: 'Remontée sèche', forme: 'montee', a: 0.7, rot: 0.12, duree: 0.4,
      vrai: true, famille: 'remontee', qui: 'vif',
      desc: 'Il ressort d’un coup, très haut : les plombs ont été soulevés d’un seul geste.' },
    { id: 'a_la_volee', nom: 'Touche à la volée', forme: 'descente', a: 0.7, duree: 0.4,
      vrai: true, famille: 'enfoncement', qui: 'tous', explicite: true,
      desc: 'L’esche est prise PENDANT la descente : le bouchon ne se pose même pas. Ferrer tout de suite !' }
];

const TOUCHES_PAR_ID = {};
TOUCHES.forEach(function (touche) { TOUCHES_PAR_ID[touche.id] = touche; });

// Vitesse globale des touches : réglage unique qui accélère (ou ralentit) TOUS
// les mouvements du bouchon. < 1 = plus rapide. Les dessins restent les mêmes.
// 0.32 : le bouchon RÉAGIT COMME EN VRAI — une touche se joue en 0,1 à 0,25 s,
// un simple tapotement en un demi-seconde. C'est la PAUSE entre deux mouvements
// qui est longue (jusqu'à 8 s), pas le mouvement lui-même.
const VITESSE_TOUCHES = 0.32;

function dureeTouche(touche) {
    // Plancher très bas : une vraie touche doit pouvoir se jouer en ~0,1 s,
    // exactement comme un bouchon qui disparaît sous l'eau.
    return Math.max(0.1, (touche.duree || 1) * VITESSE_TOUCHES);
}

// Dessine le mouvement d'une touche : `p` va de 0 (début) à 1 (fin).
// Renvoie un déplacement { y, rot, dx, dz }. Tout est LISSE : aucun à-coup.
//   lisse = 0 → 1 → 0 (le bouchon revient)   tenue = 0 → 1 (il reste)
function mouvementDeTouche(touche, p, bouchonCourt) {
    const a = touche.a || 0;
    const rot = touche.rot || 0;
    const der = touche.derive || 0;
    const lisse = Math.sin(Math.PI * p);
    const tenue = Math.sin(Math.PI * 0.5 * p);
    const coups = touche.coups || 3;
    // « Sautillement » : les petits coups secs sur l'eau (fréquence élevée). Chaque
    // touche a SA fréquence, SON inclinaison et SA dérive : impossible de les
    // confondre à l'œil.
    const sautille = Math.abs(Math.sin(Math.PI * coups * p));
    switch (touche.forme) {
        case 'frisson':
            // Vibration serrée : le bouchon tremble sans s'enfoncer.
            return { y: -a * sautille * Math.min(1, p * 5) * Math.min(1, (1 - p) * 5),
                rot: rot * sautille * 0.6 };
        case 'pulse':
            return { y: -a * sautille * lisse, rot: rot * sautille * lisse };
        case 'sinus':
            return { y: -a * lisse };
        case 'double':
            return { y: -a * Math.abs(Math.sin(Math.PI * 2 * p)) * lisse,
                rot: rot * Math.abs(Math.sin(Math.PI * 2 * p)) * lisse };
        case 'hesitation':
            return { y: -a * lisse * (0.65 + 0.35 * Math.sin(Math.PI * 3 * p)),
                rot: rot * lisse };
        case 'derive':
            return { y: -a * lisse, dx: der * lisse, dz: der * 0.35 * lisse, rot: rot * lisse };
        case 'tourner':
            return { y: -a * lisse, dx: der * Math.sin(2 * Math.PI * p),
                dz: der * (1 - Math.cos(2 * Math.PI * p)) * 0.5,
                rot: rot * Math.sin(2 * Math.PI * p) };
        case 'couchage_retour':
            return { y: a * 0.3 * lisse, rot: rot * lisse };
        case 'couchage':
            return { y: a * tenue, rot: rot * tenue };
        case 'montee':
            if (bouchonCourt) {
                // Un bouchon court ne peut pas « sortir sa tige » : il se couche.
                return { y: a * 0.25 * tenue, rot: Math.min(1.35, 1.2 * tenue) };
            }
            return { y: a * tenue, rot: rot * tenue };
        case 'montee_retour':
            if (bouchonCourt) {
                return { y: a * 0.2 * lisse, rot: 1.1 * lisse };
            }
            return { y: a * lisse };
        case 'descente_lente':
            // Il s'enfonce de plus en plus vite : le gros poisson part avec l'esche.
            return { y: -a * p * p, rot: rot * p };
        case 'file':
            return { y: -a * tenue, dx: der * tenue, dz: der * 0.4 * tenue, rot: rot * tenue };
        case 'descente':
        default:
            return { y: -a * tenue, rot: rot * tenue };
    }
}

// Applique un mouvement au bouchon (hauteur, inclinaison, dérive avec le vent).
function appliquerMouvement(m) {
    floatGroup.position.y = 0.1 + (m.y || 0);
    floatGroup.rotation.z = m.rot || 0;
    if (m.dx || m.dz) {
        const c = Math.cos(wind.dir);
        const s = Math.sin(wind.dir);
        floatGroup.position.x = biteOrigine.x + (m.dx || 0) * c - (m.dz || 0) * s;
        floatGroup.position.z = biteOrigine.z + (m.dx || 0) * s + (m.dz || 0) * c;
    }
}

// Chaque poisson a ses habitudes : un petit poisson « tapote », un gros « coule »
// lentement ou se couche, un poisson vif emporte l'esche.
function profilPoisson(taille, agressivite) {
    if (taille < 0.55) {
        return 'petit';
    }
    return (agressivite > 1.05) ? 'vif' : 'gros';
}

// Tire une touche du catalogue : vraie ou fausse, selon le poisson.
function choisirTouche(vrai, taille, agressivite, style) {
    // 1) Les touches PROPRES À L'ESPÈCE : un brochet emporte l'esche d'un coup,
    //    une tanche la soulève, une ablette la tapote, une carpe la coule
    //    lentement… C'est ce qui rend chaque poisson reconnaissable.
    if (style) {
        const ids = vrai ? style.touchesVraies : style.touchesFausses;
        const poolEspece = ids.map(function (id) {
            return TOUCHES_PAR_ID[id];
        }).filter(function (t) {
            return t && t.vrai === vrai;
        });
        if (poolEspece.length) {
            return poolEspece[Math.floor(rand() * poolEspece.length)];
        }
    }
    // 2) Sinon, le profil générique de taille / agressivité.
    const profil = profilPoisson(taille, agressivite);
    let pool = TOUCHES.filter(function (t) {
        // « explicite » : cette touche n'est jouée que dans son cas particulier
        // (la touche à la volée, juste après le lancer).
        return t.vrai === vrai && !t.explicite && (t.qui === 'tous' || t.qui === profil);
    });
    if (!pool.length) {
        pool = TOUCHES.filter(function (t) { return t.vrai === vrai; });
    }
    return pool[Math.floor(rand() * pool.length)];
}

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
let nibblePhase = 0;        // avancement du « mordillement » en cours (0 = aucun)
let caughtWeight = 0;
let lineBrokenTimer = 0;
let snagFreed = false;
const castStart = new THREE.Vector3();
const castTarget = new THREE.Vector3();
const CAST_DURATION = 0.8;
const MAX_WAIT = 20;        // sans poisson, la ligne remonte toute seule (securite)

// Morsure : le poisson doit venir renifler l'hameçon — donc s'approcher visiblement
// du bouchon ET remonter jusqu'à lui depuis sa profondeur. La morsure se décide
// sur la distance RÉELLE en 3D à l'hameçon, pas seulement à l'aplomb du bouchon.
const BITE_INTEREST_RADIUS = 7;    // à cette distance, le poisson s'intéresse au bouchon
const BITE_RADIUS = 0.9;           // distance 3D en dessous de laquelle il mord
const BITE_APPROACH_ACCEL = 4.5;   // vitesse d'approche maximale (unités/s)
// Remontée de la ligne : si le joueur ne touche plus à la manivelle pendant
// REEL_IDLE_HELP secondes, la ligne revient toute seule (REEL_AUTO unités/s).
const REEL_IDLE_HELP = 3;
const REEL_AUTO = 6;

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
    // Un nouveau lancer = une nouvelle chance : le poisson peut prendre
    // l'esche « à la volée » dès que le bouchon touche l'eau.
    biteCooldown = 0;
    floatState = 'flying';
    fishButton.disabled = true;
    statusDisplay.textContent = 'Lancer…';
    sound.cast();
}

// Étapes où la manivelle est utile : dès que la ligne est à l'eau (pour ramener
// la ligne et relancer où l'on veut), pendant le combat et pendant la remontée.
const CRANK_STATES = ['inWater', 'reeling', 'struggle'];

function updateCrankVisibility() {
    crank.classList.toggle('active', CRANK_STATES.indexOf(floatState) >= 0);
}

function startReel(automatique) {
    if (floatState === 'inWater') {
        floatState = 'reeling';
        reelIdle = 0;
        hameconDansLaVase = false;
        avertiRemontee = false;
        statusDisplay.textContent = automatique
            ? 'Aucun poisson en ' + MAX_WAIT + ' s : la ligne a été remontée TOUTE SEULE. Relance (ou amorce pour attirer les poissons !).'
            : 'On remonte la ligne… (le bouchon est toujours à l’eau : un poisson peut encore mordre !)';
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
        // Seuls les poissons dont la tranche d'eau contient l'hameçon peuvent mordre.
        const zone = data.profondeurZone;
        if (zone && (HOOK_DEPTH < zone[0] - 0.5 || HOOK_DEPTH > zone[1] + 0.5)) {
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

function showCatchMessage(weight, espece, record) {
    catchMessage.textContent = (record ? '🏆 RECORD — ' : '')
        + (espece ? espece + ' ! ' : 'Poisson attrapé ! ') + fmtPoids(weight) + ' 🎣';
    catchMessage.classList.toggle('record', !!record);
    catchMessage.classList.add('show');
    if (catchMessageTimer) {
        clearTimeout(catchMessageTimer);
    }
    catchMessageTimer = setTimeout(function () {
        catchMessage.classList.remove('show');
    }, 2500);
}

// Dernier record battu (affiché à l'écran, exposé aux tests).
let recordBattu = null;

// Annonce un NOUVEAU RECORD pour une espèce : message doré + statut détaillé.
function annoncerRecord(weight, espece, ancienRecord) {
    const nom = espece || 'Poisson';
    recordBattu = {
        espece: nom,
        kg: Math.round(weight * 100) / 100,
        ancien: Math.round((ancienRecord || 0) * 100) / 100
    };
    catchMessage.textContent = '🏆 RECORD — ' + nom + ' ! ' + fmtPoids(weight) + ' 🎣';
    catchMessage.classList.add('record', 'show');
    spawnFloatingText('🏆 RECORD !', BOURRICHE_POS, '#ffd166');
    statusDisplay.textContent = '🏆 NOUVEAU RECORD de ' + nom + ' : ' + fmtPoids(weight)
        + (ancienRecord > 0 ? ' (ancien record : ' + fmtPoids(ancienRecord) + ')' : '') + ' !';
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
    // Écart latéral des tirades : le poisson (et le bouchon) partent de côté.
    const lat = struggle.lateral || 0;
    if (lat) {
        x += -struggleDir.z * lat;
        z += struggleDir.x * lat;
    }
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

function startStruggle(fish, facteurAvantage) {
    // `facteurAvantage` vient du ferrage : < 1 = avantage au joueur (le poisson
    // est proche), > 1 = avantage au poisson (il faut ramener plus de fil).
    const cap = capaciteBouchon();
    // L'avantage laissé au poisson peut être réduit par le bouchon équipé.
    const avantage = ((typeof facteurAvantage === 'number') ? facteurAvantage : 1) * cap.avantage;
    const size = fish.userData.size;
    const power = fish.userData.power;
    const aggression = fish.userData.aggression;
    // Chaque espèce se bat à SA façon (traction, tirades, endurance, écarts).
    const style = styleEspece(fish.userData.especeId);
    // Une ligne profonde met le poisson dans son élément : il se défend un peu
    // mieux (à choisir : les poissons du fond… ou un combat plus facile).
    const bonusProfondeur = 1 + 0.05 * Math.max(0, profondeurLigne - 2.5);
    // Plus la difficulté est haute, plus les coups brusques sont rapprochés.
    const interval = Math.max(0.6,
        (1.4 - size * 0.25) / aggression / DIFFICULTY * style.intervalle);
    // Longueur de fil de référence : la distance du lancer.
    const baseLength = Math.max(4, struggleBaseLength());
    // Fil déjà rentré pendant la remontée (touche en cours de récupération) :
    // le combat démarre avec ce qu'il reste dehors, sans téléporter le poisson.
    const floatDist = Math.hypot(
        floatGroup.position.x - struggleAnchor.x,
        floatGroup.position.z - struggleAnchor.z
    );
    const startLength = Math.min(baseLength, Math.max(baseLength * 0.5, floatDist)) * avantage;
    struggle = {
        baseLength: baseLength,
        lineLength: startLength,
        minLength: baseLength * STRUGGLE_MIN_FACTOR,
        maxLength: baseLength * STRUGGLE_MAX_FACTOR,
        // Le poisson se DÉFEND, même petit : on ne le ramène pas « à la vitesse
        // du moulinet ». Il tire sur la ligne en continu, et donne des coups
        // brusques (une petite ablette secoue le bouchon aussi fort qu'une carpe !).
        // `power` = combativité de l'espèce, `aggression` = son ardeur.
        pullSpeed: Math.min(3.8, Math.max(0.7,
            (0.9 + size * 0.9) * power * (0.8 + aggression * 0.3) * DIFFICULTY * style.traction * bonusProfondeur)),
        burstDistance: (0.35 + size * 0.45) * power * (0.8 + aggression * 0.3) * DIFFICULTY * style.coups,
        burstInterval: interval,
        burstTimer: interval,
        // Le poisson se fatigue : ses tirades faiblissent peu à peu (sinon les
        // très gros poissons seraient impossibles à sortir). L'endurance dépend
        // de l'espèce : une carpe tient 14 s, un brochet est cuit en 5 s.
        endurance: style.endurance,
        // Écart latéral des tirades (les fonceurs partent de côté).
        derive: style.derive,
        lateral: 0,
        styleNom: style.nom,
        elapsed: 0,
        fatigueShown: false
    };
    tension = Math.max(0, Math.min(1, lineLengthToTension(struggle.lineLength)));
    // Temps limite : il faut VRAIMENT ramener le poisson (et le chrono se
    // resserre quand la difficulté monte ou quand on a ferré trop tard).
    struggleTimeLeft = Math.min(20, Math.max(6, (baseLength * 0.65) / DIFFICULTY)) * (2 - avantage) * cap.temps;
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
    struggleInfo.textContent = 'Taille ' + size.toFixed(1) + ' · force ' + power.toFixed(1) + ' · agressivité ' + aggression.toFixed(1) + ' · ' + fish.userData.weight.toFixed(1).replace('.', ',') + ' kg'
        + ' · ' + style.nom
        + (avantage < 0.99 ? ' · avantage pour toi !' : (avantage > 1.01 ? ' · avantage au poisson' : ''));
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
    const flotteur = flotteurCourant();
    const cap = capaciteBouchon(flotteur);
    // Plus le bouchon est sensible, plus la fenêtre de ferrage est longue…
    // …et certains bouchons achetés l'allongent encore (capacité « fenetre »).
    biteFenetre = BITE_WINDOW * flotteur.sensibilite * cap.fenetre;
    // …mais plus il montre de fausses touches ! (« fausses » < 1 = moins de pièges)
    const signauxBase = 2 + Math.floor(rand() * 2);   // 2 ou 3 faux signaux AVANT le vrai
    biteSignauxRestants = cap.fausses >= 1
        ? signauxBase
        : Math.max(1, Math.round(signauxBase * cap.fausses));
    // Le poisson a ses habitudes : quelle « touche » aura-t-on cette fois ?
    // Chaque ESPÈCE a ses dessins de bouchon (un brochet emporte l'esche, une
    // tanche la soulève, une ablette la tapote…).
    biteStyle = styleEspece(fish.userData.especeId);
    // Juste après le lancer et à faible profondeur, l'esche peut être prise
    // « à la volée » (le bouchon ne se pose même pas).
    if (depuisLancement < 0.9 && profondeurLigne < 1.6) {
        biteTouche = TOUCHES_PAR_ID.a_la_volee;
        spawnFloatingText('À la volée !', floatGroup.position, '#ffe14d');
    } else {
        biteTouche = choisirTouche(true, fish.userData.size, fish.userData.aggression, biteStyle);
    }
    biteSinkAt = 3 + rand() * 5;       // longue attente possible (3 à 8 s) avant le 1er signal
    biteSignalTimer = 0;
    biteViewHideTimer = -1; // annule toute fermeture en attente d'une ancienne touche
    strikeQuality = '';
    fightAdvantage = 1;
    floatGroup.position.y = 0.1;
    floatGroup.rotation.z = 0;
    biteOrigine.copy(floatGroup.position);
    spawnRipple(floatGroup.position);
    sound.bite();
    // Vue RÉALISTE : aucun zoom. Un petit message flottant aide simplement à
    // repérer que quelque chose se passe autour du bouchon.
    spawnFloatingText('Un poisson s’approche…', floatGroup.position, '#dff1ff');
    floatState = 'bite';
    statusDisplay.textContent = 'Un poisson s’approche du bouchon… surveille-le !';
}

function hideBiteView() {
    biteViewActive = false;
    cameraMode = 'normal';
    setFloatOpacity(1);
    floatGroup.rotation.z = 0;
}

// Ferrage : le joueur clique. Selon le MOMENT, il obtient un avantage… ou pas !
function hookFish() {
    if (floatState !== 'bite' || !biteViewActive) {
        return;
    }
    const fish = biteFish;
    if (bitePhase === 'touche') {
        // Pile au bon moment : avantage au joueur (le poisson est tout près).
        strikeQuality = 'parfait';
        fightAdvantage = 0.85;
        biteFish = null;
        if (fish) {
            fish.visible = true;
            sound.reel();
            spawnSplash(floatGroup.position);
            hideBiteView();
            startStruggle(fish, fightAdvantage);
        }
        spawnFloatingText('FERRÉ !', floatGroup.position, '#7ed957');
        statusDisplay.textContent = 'Ferrage parfait ! Tu démarres avec l’avantage.';
        return;
    }
    if (bitePhase === 'fausse' || bitePhase === 'ratee') {
        // Trop tôt (sur une fausse touche) ou trop tard : le poisson a l'avantage.
        strikeQuality = (bitePhase === 'fausse') ? 'tot' : 'tard';
        fightAdvantage = (bitePhase === 'fausse') ? 1.15 : 1.3;
        biteFish = null;
        if (fish) {
            fish.visible = true;
            sound.reel();
            spawnSplash(floatGroup.position);
            hideBiteView();
            startStruggle(fish, fightAdvantage);
        }
        spawnFloatingText(strikeQuality === 'tot' ? 'Trop tôt !' : 'Trop tard !',
            floatGroup.position, '#ffb347');
        statusDisplay.textContent = (strikeQuality === 'tot')
            ? 'Trop tôt ! Le poisson a pris de l’avance…'
            : 'Trop tard, mais ferré : le poisson a beaucoup d’avance !';
        return;
    }
    // 'floating' : le bouchon n'a pas bougé → aucun poisson ferré.
    if (biteFish) {
        biteFish.userData.biting = false;
        biteFish.visible = false;
        punishFish(biteFish);
        biteFish = null;
    }
    biteCooldown = 1.0;
    floatState = 'inWater';
    waitTimer = 0;
    spawnFloatingText('Rien ne bougeait…', floatGroup.position, '#cfd8e3');
    statusDisplay.textContent = 'Trop tôt ! Rien ne bougeait encore…';
    hideBiteView();
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
    const flotteur = flotteurCourant();
    if (bitePhase === 'floating') {
        // Le bouchon est posé sur l'eau : il ne gigote pas, il monte et descend à
        // peine au rythme de la houle. C'est long, et c'est voulu : patience !
        floatGroup.rotation.z *= 0.9;
        floatGroup.position.y = 0.1 + Math.sin(biteViewTimer * 1.6) * 0.02;
        setFloatOpacity(1);
        if (biteViewTimer >= biteSinkAt) {
            if (biteSignauxRestants > 0) {
                // FAUSSE touche : le bouchon bouge, mais ce n'est pas LE moment.
                biteSignauxRestants -= 1;
                bitePhase = 'fausse';
                biteSignalTimer = 0;
                // Quelle fausse touche ? (elle change à chaque fois)
                const profil = biteFish ? biteFish.userData : { size: 0.5, aggression: 1 };
                biteFauxTouche = choisirTouche(false, profil.size, profil.aggression, biteStyle);
                biteSignalDuree = dureeTouche(biteFauxTouche);
                biteOrigine.copy(floatGroup.position);
                spawnFloatingText('Ça bouge…', floatGroup.position, '#ffe14d');
                // Deux ronds sur l'eau : le mouvement se repère de loin.
                spawnRipple(floatGroup.position);
                spawnRipple(floatGroup.position);
            } else {
                // LA vraie touche : c'est maintenant qu'il faut ferrer.
                bitePhase = 'touche';
                biteSignalTimer = 0;
                biteOrigine.copy(floatGroup.position);
                // Un « ploc » et des ronds sur l'eau : c'est au joueur de VOIR.
                sound.splash();
                spawnRipple(floatGroup.position);
                spawnRipple(floatGroup.position);
            }
        }
    } else if (bitePhase === 'fausse') {
        biteSignalTimer += dt;
        // Le mouvement vient du CATALOGUE : chaque fausse touche a son dessin
        // propre (frémissement, tapotement, fausse remontée, dérive, tour…).
        const toucheFausse = biteFauxTouche || TOUCHES_PAR_ID.enfonce_partiel;
        const p = Math.min(1, biteSignalTimer / biteSignalDuree);
        appliquerMouvement(mouvementDeTouche(toucheFausse, p, flotteur.remontee === 'couche'));
        setFloatOpacity(1);
        if (biteSignalTimer >= biteSignalDuree) {
            bitePhase = 'floating';
            biteViewTimer = 0;
            biteSinkAt = 2 + rand() * 6;       // la pause peut être longue (2 à 8 s) avant le signal suivant
            floatGroup.rotation.z = 0;
            floatGroup.position.set(biteOrigine.x, 0.1, biteOrigine.z);
        }
    } else if (bitePhase === 'touche') {
        biteSignalTimer += dt;
        // LA vraie touche : son dessin vient aussi du catalogue (coulée franche,
        // ascenseur, il file sous l'eau, il se couche…).
        const toucheVraie = biteTouche || TOUCHES_PAR_ID.coulee_franche;
        const p = Math.min(1, biteSignalTimer / dureeTouche(toucheVraie));
        const m = mouvementDeTouche(toucheVraie, p, flotteur.remontee === 'couche');
        appliquerMouvement(m);
        // Un bouchon qui coule franchement s'efface peu à peu : « il a disparu ».
        setFloatOpacity(m.y < -0.5 ? Math.max(0.25, 1 + m.y * 0.34) : 1);
        if (biteSignalTimer >= biteFenetre) {
            // La fenêtre de ferrage est passée : dernière chance de cliquer.
            bitePhase = 'ratee';
            biteSignalTimer = 0;
            biteRetourY = floatGroup.position.y;      // pour remonter en douceur
            biteRetourRot = floatGroup.rotation.z;
            statusDisplay.textContent = 'Trop tard… clique encore pour tenter !';
        }
    } else if (bitePhase === 'ratee') {
        biteSignalTimer += dt;
        // Le poisson recrache : le bouchon REMONTE en douceur jusqu'à sa place
        // (pas de saut d'un coup, comme quand la ligne se détend).
        const k = Math.min(1, biteSignalTimer / 0.45);
        const doux = 1 - Math.pow(1 - k, 3);
        floatGroup.position.y = biteRetourY + (0.1 - biteRetourY) * doux;
        floatGroup.rotation.z = biteRetourRot * (1 - doux);
        setFloatOpacity(1);
        if (biteSignalTimer >= 0.45) {
            // Le poisson recrache l'hameçon : la ligne revient. On passe dans une
            // phase TERMINÉE pour ne pas rejouer ce bloc à chaque image.
            bitePhase = 'termine';
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
            // TOUCHE RATÉE : un message flottant + des ronds rouges qui s'écartent
            // du bouchon (bien visibles depuis la vue réaliste).
            spawnFloatingText('Raté ! Il a recraché…', floatGroup.position, '#ff6b6b');
            signalerToucheRatee(floatGroup.position);
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
        // Le poisson est sorti de l'eau : il redevient toujours visible, même
        // s'il était en train de « plonger » au moment où on l'a ramené.
        if (hookedFish) {
            hookedFish.visible = true;
        }
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
    //    MAIS il se fatigue : ses tirades faiblissent jusqu'à 40 % après ~7 s.
    struggle.elapsed += dt;
    const endurance = struggle.endurance || 7;
    const essouffle = 1 - 0.6 * Math.min(1, struggle.elapsed / endurance);
    struggle.lineLength += struggle.pullSpeed * essouffle * dt;
    struggle.burstTimer -= dt;
    if (struggle.burstTimer <= 0) {
        struggle.lineLength += struggle.burstDistance * essouffle;
        struggle.burstTimer = struggle.burstInterval * (0.7 + rand() * 0.6);
        // Les « fonceurs » partent de côté, les poissons lourds tirent droit.
        struggle.lateral = (struggle.derive || 0) * (rand() * 2 - 1) * essouffle;
        shake = 0.14;
    }
    // L'écart latéral revient doucement sur l'axe de la ligne.
    struggle.lateral = (struggle.lateral || 0) * Math.max(0, 1 - dt * 1.6);
    if (!struggle.fatigueShown && struggle.elapsed > Math.min(2.5, endurance * 0.35)) {
        struggle.fatigueShown = true;
        statusDisplay.textContent = 'Le poisson se fatigue… c’est le moment de tourner plus vite !';
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

function startSnag(mode) {
    floatState = 'snag';
    tension = 0.5;
    const dansLaVase = mode === 'fond';
    snag = {
        pullRate: 0.12,
        burstStrength: 0.10,
        burstInterval: 1.1,
        burstTimer: 1.1,
        clickPower: 0.10
    };
    strugglePanel.classList.add('active');
    sound.snag();
    struggleInfo.textContent = dansLaVase ? 'Hameçon accroché dans la vase' : 'Ligne accrochée aux nénuphars';
    struggleTimer.textContent = '';
    struggleTimer.classList.remove('urgent');
    struggleHint.textContent = 'Clique vite pour dégager la ligne !';
    updateStruggleBar();
    fishButton.disabled = false;
    fishButton.textContent = 'Dégager !';
    statusDisplay.textContent = dansLaVase
        ? 'Ton hameçon s’est enfoncé dans la vase ! Clique pour le dégager, puis règle une ligne moins profonde.'
        : 'La ligne s’est accrochée aux nénuphars ! Clique pour la dégager.';
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
        floatGroup.visible = false;
        lineBrokenTimer = 1.2;
        floatState = 'broken';
        // Le bouchon part avec la ligne : s'il avait été acheté, il est PERDU.
        const perdu = perdreLeBouchon();
        if (perdu) {
            statusDisplay.textContent = 'La ligne a cassé ! Ton bouchon « ' + perdu.nom
                + ' » est perdu… tu repêches avec le bouchon de départ.';
            spawnFloatingText('Bouchon perdu !', floatGroup.position, '#ff6b6b');
        } else {
            statusDisplay.textContent = 'La ligne a cassé ! Le bouchon est perdu… (un bouchon de départ : sans regret).';
        }
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
// Messages flottants (dans la scène 3D) et anneaux de touche ratée
// ---------------------------------------------------------------------------
// Sans « vue bouchon », le joueur surveille son bouchon de LOIN. Ces messages
// flottants et ces ronds rouges lui disent tout de suite ce qui vient de se
// passer : touche ratée, ferrage trop tôt, ferrage parfait…
const floatingTexts = [];

function makeTextTexture(texte, couleur) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const g = canvas.getContext('2d');
    if (!g) {
        return null;
    }
    g.font = 'bold 64px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 12;
    g.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    if (typeof g.strokeText === 'function') {
        g.strokeText(texte, 256, 64);
    }
    g.fillStyle = couleur || '#ffffff';
    if (typeof g.fillText === 'function') {
        g.fillText(texte, 256, 64);
    }
    return new THREE.CanvasTexture(canvas);
}

function spawnFloatingText(texte, position, couleur) {
    const texture = makeTextTexture(texte, couleur);
    if (!texture) {
        return;
    }
    const material = new THREE.SpriteMaterial({
        map: texture, transparent: true, depthWrite: false, depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position.x, position.y + 1.4, position.z);
    sprite.scale.set(7, 1.75, 1);
    scene.add(sprite);
    floatingTexts.push({ sprite: sprite, texte: texte, t: 0, duree: 2.4 });
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const item = floatingTexts[i];
        item.t += dt;
        const k = item.t / item.duree;
        item.sprite.position.y += dt * 0.8;               // il s'élève doucement
        item.sprite.material.opacity = Math.max(0, 1 - k * k);
        const grossit = 1 + Math.min(0.2, k * 0.5);       // un peu plus gros au début
        item.sprite.scale.set(7 * grossit, 1.75 * grossit, 1);
        if (item.t >= item.duree) {
            scene.remove(item.sprite);
            if (item.sprite.material.map) {
                item.sprite.material.map.dispose();
            }
            item.sprite.material.dispose();
            floatingTexts.splice(i, 1);
        }
    }
}

// Anneaux ROUGES : ils s'écartent du bouchon quand la touche est ratée.
const missRings = [];

function spawnMissRing(position, rayon) {
    const r = rayon || 0.32;
    const geo = new THREE.RingGeometry(r, r + 0.16, 40);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xff2d2d, transparent: true, opacity: 0.85,
        depthWrite: false, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, 0.09, position.z);
    scene.add(mesh);
    missRings.push({ mesh: mesh, t: 0 });
}

function updateMissRings(dt) {
    for (let i = missRings.length - 1; i >= 0; i--) {
        const r = missRings[i];
        r.t += dt;
        const s = 1 + r.t * 2.4;                          // il s'écarte doucement
        r.mesh.scale.set(s, s, s);
        r.mesh.material.opacity = Math.max(0, 0.85 * (1 - r.t / 1.9));
        if (r.t > 1.9) {
            scene.remove(r.mesh);
            r.mesh.geometry.dispose();
            r.mesh.material.dispose();
            missRings.splice(i, 1);
        }
    }
}

// Une touche ratée : deux ronds rouges concentriques autour du bouchon.
function signalerToucheRatee(position) {
    spawnMissRing(position, 0.3);
    spawnMissRing(position, 0.62);
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
                // L'amorçage n'attire que les poissons de SA couche d'eau.
                if (Math.abs(data.depth - chum.position.y) > 1.6) {
                    return;
                }
                const accel = CHUM_ATTRACT_ACCEL * chum.strength * dt;
                data.vx += (cx / cd) * accel;
                data.vz += (cz / cd) * accel;
                // Le poisson descend vers le nuage (même profondeur que l'esche).
                data.depth += (chum.position.y - data.depth) * Math.min(1, dt * 1.5);
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
        // Le poisson s'intéresse au bouchon tant qu'il est à l'eau — y compris
        // pendant la remontée de la ligne (s'il n'y a pas déjà un poisson ferré).
        if (!fishCaught && !hookedFish
            && (floatState === 'inWater' || floatState === 'reeling')) {
            const bx = floatGroup.position.x - fish.position.x;
            const bz = floatGroup.position.z - fish.position.z;
            const bd = Math.hypot(bx, bz);
            // Sous la pluie, les poissons s'intéressent de plus loin.
            const rayonInteret = BITE_INTEREST_RADIUS * (1 + 0.25 * weatherPluie);
            // Le poisson ne vient à l'hameçon que s'il est DANS SA tranche d'eau
            // (un gardon de surface ne plonge pas à 2,5 m pour mordre).
            const zoneEsp = data.profondeurZone;
            const dansSaZone = !zoneEsp
                || (HOOK_DEPTH >= zoneEsp[0] - 0.5 && HOOK_DEPTH <= zoneEsp[1] + 0.5);
            if (bd < rayonInteret && dansSaZone) {
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
        // Domaine vital : au-delà de sa zone, le poisson revient doucement (un
        // sandre ne traverse pas tout l'étang). Il oublie sa zone pour venir à
        // l'hameçon quand il le sent.
        if (!data.targeting && data.homeX !== undefined) {
            const hx = data.homeX - fish.position.x;
            const hz = data.homeZ - fish.position.z;
            const hd = Math.hypot(hx, hz);
            if (hd > data.homeRadius) {
                const k = Math.min(1, dt * 0.8);
                data.vx += (hx / hd) * 1.5 * k;
                data.vz += (hz / hd) * 1.5 * k;
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
        // Le poisson reste toujours au-dessus du relief (le fond est un bassin).
        const yBas = fondY(fish.position.x, fish.position.z) + 0.3;
        fish.position.y = Math.max(yBas,
            data.depth - data.topOffset + Math.sin(time * 2 + data.phase) * 0.12);
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
                depuisLancement = 0;
                const profLocale = profondeurLocale(castTarget.x, castTarget.z);
                // Hameçon BEAUCOUP trop profond : il s'enfonce dans la vase et
                // s'y accroche (il faut le dégager à la main !).
                if (profondeurLigne > profLocale + 0.3) {
                    hameconDansLaVase = true;
                    startSnag('fond');
                    majCoupeProfondeur();
                    return;
                }
                // Profondeur réglée > profondeur de l'eau à cet endroit : l'hameçon
                // est DANS LA VASE → il s'y ACCROCHE, exactement comme dans les
                // nénuphars : il faut le dégager (même mini-jeu).
                hameconDansLaVase = profondeurLigne > profLocale - 0.5;
                if (hameconDansLaVase) {
                    startSnag('fond');
                    majCoupeProfondeur();
                    return;
                }
                statusDisplay.textContent = hameconDansLaVase
                    ? 'Hameçon dans la vase (fond à ' + nombreMetres(profLocale) + ') : remonte la ligne et choisis moins profond !'
                    : 'Ligne à ' + nombreMetres(profondeurLigne) + ' dans ' + nombreMetres(profLocale) + ' d’eau : attends qu’un poisson morde !';
                majCoupeProfondeur();
            }
        } else {
            const x = THREE.MathUtils.lerp(castStart.x, castTarget.x, castT);
            const z = THREE.MathUtils.lerp(castStart.z, castTarget.z, castT);
            const y = THREE.MathUtils.lerp(castStart.y, castTarget.y, castT) + Math.sin(Math.PI * castT) * 6;
            floatGroup.position.set(x, y, z);
        }
    } else if (floatState === 'inWater') {
        // Le bouchon flotte sur la houle (la même que la surface de l'eau) : il ne
        // bouge PAS tout seul. Comme en vrai, il reste presque immobile et il faut
        // de la patience avant qu'un poisson s'intéresse à l'appât.
        floatGroup.position.x += Math.cos(wind.dir) * wind.strength * 0.6 * dt;
        floatGroup.position.z += Math.sin(wind.dir) * wind.strength * 0.6 * dt;
        // Le vent fait dériver le bouchon… mais la ligne est TENUE : il ne peut
        // pas s'en aller à l'autre bout de l'étang (2 m maximum autour du posé).
        const deriveX = floatGroup.position.x - castTarget.x;
        const deriveZ = floatGroup.position.z - castTarget.z;
        const derive = Math.hypot(deriveX, deriveZ);
        if (derive > 4) {
            floatGroup.position.x = castTarget.x + (deriveX / derive) * 4;
            floatGroup.position.z = castTarget.z + (deriveZ / derive) * 4;
        }
        const houle = waterWaveHeightAt(floatGroup.position.x, floatGroup.position.z, time);
        floatGroup.position.y = 0.1 + houle;
        depuisLancement += dt;
        if (hameconDansLaVase) {
            // L'hameçon est dans la vase : le bouchon se couche et rien ne mord.
            floatGroup.rotation.z = 1.45;
        }
        // Un poisson qui renifle l'appât fait « mordiller » le bouchon de temps en
        // temps seulement : un petit plongeon bref (environ une fois toutes les 4 s),
        // et pas une agitation continue. Le rythme suit le temps de jeu : aucun
        // tirage aléatoire, donc le monde des tests reste reproductible.
        if (baitInterest) {
            const cycle = time % 4;
            nibblePhase = cycle < 0.9 ? Math.sin((cycle / 0.9) * Math.PI) : 0;
            floatGroup.position.y -= 0.06 * nibblePhase;
            nibbleRippleTimer -= dt;
            if (nibbleRippleTimer <= 0) {
                nibbleRippleTimer = 1.8;
                spawnRipple(floatGroup.position);
            }
        } else {
            nibblePhase = 0;
            nibbleRippleTimer = 0;
        }
        // Un poisson qui renifle l'esche fait patienter plus longtemps.
        if (baitInterest) {
            waitTimer = Math.min(waitTimer, MAX_WAIT - 6);
        }
        waitTimer += dt;
        // Trois secondes avant la remontée automatique : on prévient le joueur.
        if (waitTimer > MAX_WAIT - 3 && !avertiRemontee) {
            avertiRemontee = true;
            statusDisplay.textContent = 'Toujours rien… la ligne va remonter TOUTE SEULE dans 3 s (tourne la manivelle pour la ramener, ou relance).';
        }
        // Un tour de manivelle pendant l'attente : on ramène la ligne (pour
        // relancer ailleurs). La manivelle ne sert donc pas qu'au combat.
        if (consumeCrankTurns() > 0) {
            startReel();
            return;
        }
        if (biteCooldown > 0) {
            biteCooldown -= dt;
        } else if (!hameconDansLaVase) {
            const fish = findBitingFish();
            if (fish) {
                showBiteView(fish);
            } else if (waitTimer > MAX_WAIT) {
                startReel(true);
            }
        }
    } else if (floatState === 'bite') {
        // Filet de sécurité : si la touche s'est terminée (fermeture différée
        // d'une touche ratée), on rend la main au lieu de rester bloqué.
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
        // On ramène la ligne… mais le bouchon est TOUJOURS dans l'eau : un poisson
        // peut encore mordre ! (Sauf si on ramène déjà un poisson ferré.)
        if (!hookedFish) {
            if (biteCooldown > 0) {
                biteCooldown -= dt;
            } else {
                const fish = findBitingFish();
                if (fish) {
                    showBiteView(fish);
                    return;
                }
            }
        }
        // Le fil se rembobine en tournant la manivelle : un tour complet ramène
        // REEL_PER_TURN unités (≈ 1 m).
        const tours = consumeCrankTurns();
        reelIdle = tours > 0 ? 0 : reelIdle + dt;
        // Filet de sécurité : si le joueur ne touche plus à la manivelle pendant
        // quelques secondes, la ligne revient toute seule — on ne reste JAMAIS
        // bloqué en mode « remontée ».
        const auto = (reelIdle > REEL_IDLE_HELP && !hookedFish) ? REEL_AUTO * dt : 0;
        const step = tours * REEL_PER_TURN + auto;
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
    // La manivelle est disponible dès que la ligne est à l'eau (on peut ramener
    // la ligne et relancer quand on veut) et pendant le combat / la remontée.
    updateCrankVisibility();
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

// Réglage de la profondeur de la ligne (− / +).
if (depthMinus) {
    depthMinus.addEventListener('click', function () {
        ensureSound();
        setProfondeur(profondeurLigne - 0.5);
    });
}
if (depthPlus) {
    depthPlus.addEventListener('click', function () {
        ensureSound();
        setProfondeur(profondeurLigne + 0.5);
    });
}
majEtiquetteProfondeur();
// Le jeu est initialisé : la coupe de l'eau (schéma) peut se dessiner.
coupePrete = true;
majCoupeProfondeur();
waterUniforms.uResolution.value.set(window.innerWidth || 1280, window.innerHeight || 720);

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
        // La coupe de l'eau suit le bouchon (5 fois par seconde suffit).
        if (elapsed - dernierCoupe > 0.2) {
            dernierCoupe = elapsed;
            majCoupeProfondeur();
        }
        updateFeed(dt);
        updateChum(dt);
        updateArm(dt);
        updateRod(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, elapsed);
        updateReflections(dt);
        updateWaterReflection();
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
        updateRipples(dt);
        updateMissRings(dt);
        updateFloatingTexts(dt);
        updateLine();
    }
    updateCrankVisibility();
    // Vue RÉALISTE unique : la caméra reste toujours à distance, jamais de zoom.
    camera.position.lerp(NORMAL_CAM_POS, 1 - Math.pow(0.0001, dt));
    cameraTarget.lerp(NORMAL_CAM_TARGET, 1 - Math.pow(0.0001, dt));
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
// ---------------------------------------------------------------------------
// LIGNES (VIES) : on part avec 5 lignes. Un lancer trop fort ou une remontée
// trop rapide en coûte une. À zéro : fin de partie, nom du pêcheur et
// classement local (3 onglets : poissons, poids total, records par espèce).
// ---------------------------------------------------------------------------
const MAX_LIGNES = 5;
const VITESSE_MANIVELLE_MAX = 42;      // rad/s (~6,7 tours/s) : il faut vraiment forcer
const RANKING_KEY = 'peche_max_games_classement';
const NOM_KEY = 'peche_max_games_nom';
let lignesRestantes = MAX_LIGNES;
let avertissementsVitesse = 0;
let partieTerminee = false;
let derniereAlerteVitesse = -10000;
let ongletClassement = 'poissons';
let partieStats = { poissons: 0, poids: 0, records: {} };

function majLignes() {
    if (!lignesLabel) { return; }
    lignesLabel.textContent = '🧵 Lignes : ' + lignesRestantes + '/' + MAX_LIGNES;
    lignesLabel.classList.toggle('danger', lignesRestantes <= 1);
}

function casserLigne(raison) {
    if (partieTerminee) { return; }
    lignesRestantes = Math.max(0, lignesRestantes - 1);
    avertissementsVitesse = 0;
    majLignes();
    sound.escape();
    spawnFloatingText('💥 Ligne cassée !', floatGroup.position, '#ff6b57');
    statusDisplay.textContent = '💥 ' + raison + ' : une ligne est perdue ('
        + lignesRestantes + ' restante' + (lignesRestantes > 1 ? 's' : '') + ').';
    floatState = 'idle';
    hameconDansLaVase = false;
    fishButton.disabled = false;
    if (hookedFish) {
        hookedFish.userData.hooked = false;
        hookedFish.visible = false;
        hookedFish = null;
    }
    floatGroup.position.copy(floatIdle);
    floatGroup.rotation.z = 0;
    if (lignesRestantes <= 0) { terminerPartie(); }
}

// Remontée trop rapide : un avertissement (toutes les 0,8 s au plus), puis le
// risque de casse augmente à chaque avertissement.
function avertirVitesse() {
    if (partieTerminee) { return; }
    const maintenant = performance.now();
    if (maintenant - derniereAlerteVitesse < 1500) { return; }  // 1 alerte / 1,5 s
    derniereAlerteVitesse = maintenant;
    avertissementsVitesse += 1;
    if (avertissementsVitesse <= 3) {
        statusDisplay.textContent = '⚠️ Tu remontes trop vite ! La ligne souffre ('
            + avertissementsVitesse + ' avertissement' + (avertissementsVitesse > 1 ? 's' : '') + ').';
    }
    if (rand() < Math.min(0.15, 0.02 * avertissementsVitesse)) {
        casserLigne('Tu as remonté trop vite');
    }
}

// Le classement vit en mémoire et, si le navigateur le permet, dans le stockage
// local (il survit alors d'une session à l'autre).
let classementLocal = [];
try {
    if (journalStore) {
        const brut = journalStore.getItem(RANKING_KEY);
        if (brut) {
            const liste = JSON.parse(brut);
            if (Array.isArray(liste)) { classementLocal = liste; }
        }
    }
} catch (e) { classementLocal = []; }

function chargerClassement() {
    return classementLocal.slice();
}

function sauverClassement(liste) {
    classementLocal = liste.slice(0, 50);
    try {
        if (journalStore) { journalStore.setItem(RANKING_KEY, JSON.stringify(classementLocal)); }
    } catch (e) { /* stockage plein ou refusé */ }
}

function enregistrerClassement(nom) {
    const pseudo = String(nom || '').trim().slice(0, 12) || 'Pêcheur';
    const entree = {
        nom: pseudo,
        date: new Date().toISOString().slice(0, 10),
        poissons: partieStats.poissons,
        poids: Math.round(partieStats.poids * 100) / 100,
        records: Object.assign({}, partieStats.records)
    };
    const liste = chargerClassement();
    liste.push(entree);
    sauverClassement(liste);
    try { if (journalStore) { journalStore.setItem(NOM_KEY, pseudo); } } catch (e) { /* plein */ }
    return entree;
}

function renderClassement(onglet) {
    ongletClassement = onglet || 'poissons';
    if (!rankingList) { return; }
    const liste = chargerClassement();
    let html = '';
    if (ongletClassement === 'records') {
        const parEspece = {};
        liste.forEach(function (e) {
            const rec = e.records || {};
            Object.keys(rec).forEach(function (esp) {
                if (!parEspece[esp] || rec[esp] > parEspece[esp].kg) {
                    parEspece[esp] = { kg: rec[esp], nom: e.nom };
                }
            });
        });
        const especes = Object.keys(parEspece).sort(function (a, b) {
            return parEspece[b].kg - parEspece[a].kg;
        });
        html = especes.length
            ? '<table class="ranking-table"><tr><th>Espèce</th><th>Record</th><th>Pêcheur</th></tr>'
                + especes.map(function (esp) {
                    return '<tr><td>' + esp + '</td><td>' + fmtPoids(parEspece[esp].kg)
                        + '</td><td>' + parEspece[esp].nom + '</td></tr>';
                }).join('') + '</table>'
            : '<p>Aucun record pour le moment.</p>';
    } else {
        const cle = ongletClassement === 'poids' ? 'poids' : 'poissons';
        const tri = liste.slice().sort(function (a, b) { return b[cle] - a[cle]; }).slice(0, 10);
        html = tri.length
            ? '<table class="ranking-table"><tr><th>#</th><th>Pêcheur</th><th>'
                + (cle === 'poids' ? 'Poids' : 'Poissons') + '</th><th>Date</th></tr>'
                + tri.map(function (e, i) {
                    return '<tr><td>' + (i + 1) + '</td><td>' + e.nom + '</td><td>'
                        + (cle === 'poids' ? fmtPoids(e.poids) : e.poissons) + '</td><td>'
                        + (e.date || '') + '</td></tr>';
                }).join('') + '</table>'
            : '<p>Classement vide : termine une partie pour y figurer !</p>';
    }
    rankingList.innerHTML = html;
    if (rankingTabs && typeof rankingTabs.querySelectorAll === 'function') {
        rankingTabs.querySelectorAll('.tab').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.rank === ongletClassement);
        });
    }
}

function ouvrirClassement() {
    if (!classement) { return; }
    renderClassement(ongletClassement);
    classement.classList.add('active');
}

function fermerClassement() {
    if (classement) { classement.classList.remove('active'); }
}

// Fin de partie : plus aucune ligne.
function terminerPartie() {
    partieTerminee = true;
    floatState = 'idle';
    strugglePanel.classList.remove('active');
    if (!gameOver) { return; }
    if (gameOverScore) {
        gameOverScore.innerHTML = '🐟 <b>' + partieStats.poissons + '</b> poisson(s) · ⚖️ <b>'
            + fmtPoids(partieStats.poids) + '</b> au total · 🏆 <b>'
            + Object.keys(partieStats.records).length + '</b> espèce(s)';
    }
    if (playerName) {
        let dernierNom = '';
        try { if (journalStore) { dernierNom = journalStore.getItem(NOM_KEY) || ''; } } catch (e) { /* plein */ }
        playerName.value = dernierNom;
    }
    gameOver.classList.add('active');
}

function recommencerPartie() {
    lignesRestantes = MAX_LIGNES;
    avertissementsVitesse = 0;
    partieTerminee = false;
    derniereAlerteVitesse = -10000;
    partieStats = { poissons: 0, poids: 0, records: {} };
    majLignes();
    if (gameOver) { gameOver.classList.remove('active'); }
    fermerClassement();
    statusDisplay.textContent = 'Nouvelle partie : ' + MAX_LIGNES + ' lignes neuves. Bonne pêche !';
}

// --- Boutons du panneau de fin de partie et du classement ---
if (saveScore) {
    saveScore.addEventListener('click', function () {
        enregistrerClassement(playerName ? playerName.value : '');
        if (gameOver) { gameOver.classList.remove('active'); }
        ouvrirClassement();
    });
}
if (showRanking) { showRanking.addEventListener('click', ouvrirClassement); }
if (rankingButton) { rankingButton.addEventListener('click', ouvrirClassement); }
if (closeRanking) { closeRanking.addEventListener('click', fermerClassement); }
if (restartGame) { restartGame.addEventListener('click', recommencerPartie); }
if (rankingTabs) {
    rankingTabs.addEventListener('click', function (event) {
        const cible = event.target && event.target.dataset ? event.target.dataset.rank : '';
        if (cible) { renderClassement(cible); }
    });
}

majLignes();

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
    getBiteSignaux: function () { return biteSignauxRestants; },
    getBiteTouchType: function () { return biteTouche ? biteTouche.famille : ''; },
    getBiteTouchId: function () { return biteTouche ? biteTouche.id : ''; },
    getBiteTouchName: function () { return biteTouche ? biteTouche.nom : ''; },
    getFauxToucheId: function () { return biteFauxTouche ? biteFauxTouche.id : ''; },
    getBiteWindow: function () { return biteFenetre; },
    // Catalogue des touches (les mouvements du bouchon) — exposé pour les tests.
    getTouches: function () {
        return TOUCHES.map(function (t) { return Object.assign({}, t); });
    },
    // Styles de combat par espèce (touches + comportement) — tests et carnet.
    getStylesCombat: function () { return STYLES_COMBAT; },
    styleEspece: styleEspece,
    // --- Lignes (vies), fin de partie et classement local ---
    getLignes: function () { return lignesRestantes; },
    maxLignes: MAX_LIGNES,
    casserLigne: casserLigne,
    getAvertissements: function () { return avertissementsVitesse; },
    avertirVitesse: avertirVitesse,
    getElapsed: function () { return elapsed; },
    ouvrirClassement: ouvrirClassement,
    isPartieTerminee: function () { return partieTerminee; },
    recommencerPartie: recommencerPartie,
    enregistrerClassement: enregistrerClassement,
    getClassement: chargerClassement,
    getPartieStats: function () { return Object.assign({}, partieStats); },
    renderClassement: renderClassement,
    getStruggleStyle: function () { return struggle ? struggle.styleNom : ''; },
    // ÉCHELLE DU MONDE : 1 unité = 50 cm. Renvoie les mesures réelles des
    // objets (pour vérifier qu'elles restent réalistes) et la taille 3D d'un
    // poisson comparée à sa longueur réelle.
    getEchelles: function () {
        const f = flotteurCourant();
        const u = 2;                         // unités par mètre
        const cm = function (unites) { return Math.round(unites * (100 / u)); };
        const poisson = fishes[0];
        let poisson3DCm = 0;
        if (poisson) {
            const ref = (FORMES[poisson.userData.type] || FORMES.fusiforme).longueurRef;
            poisson3DCm = cm(ref * poisson.scale.x);
        }
        return {
            unitesParMetre: u,
            bouchonCm: cm((f.longueur + 0.1) * FLOTTEUR_ECHELLE),
            bouchonTigeCm: cm(f.longueur * FLOTTEUR_ECHELLE),
            hameconCm: cm(0.016 * 2 * FLOTTEUR_ECHELLE),
            nenupharCm: cm(0.7),
            roseauCm: cm(0.035 * 2),
            bourricheCm: cm(0.72 * 2),
            canneM: Math.round(rodTip.distanceTo(rodBase) / u * 10) / 10,
            pecheurM: Math.round(3.4 / u * 100) / 100,
            etangM: Math.round(POND_RADIUS * 2 / u),
            fondM: Math.round(FOND_CENTRE / u * 10) / 10,
            poisson3DCm: poisson3DCm,
            poissonReelCm: poisson ? poisson.userData.longueurCm : 0
        };
    },
    getRecordBattu: function () { return recordBattu ? Object.assign({}, recordBattu) : null; },
    annoncerRecord: annoncerRecord,
    addJournalEntry: addJournalEntry,
    showCatchMessage: showCatchMessage,
    majCoupeProfondeur: majCoupeProfondeur,
    choisirTouche: choisirTouche,
    mouvementDeTouche: mouvementDeTouche,
    dureeTouche: dureeTouche,
    getVitesseTouches: function () { return VITESSE_TOUCHES; },
    getStrikeQuality: function () { return strikeQuality; },
    getFightAdvantage: function () { return fightAdvantage; },
    getFloats: function () {
        return FLOTTEURS.map(function (f) {
            return {
                id: f.id, nom: f.nom, sensibilite: f.sensibilite,
                remontee: f.remontee, longueur: f.longueur, desc: f.desc,
                prix: f.prix || 0, atout: f.atout || '',
                capacite: capaciteBouchon(f)
            };
        });
    },
    getFloatType: function () { return flotteurCourant().id; },
    setFloatType: setFloatType,
    // Expérience et boutique de bouchons — exposées pour les tests.
    getExperience: function () { return journal.experience; },
    setExperience: function (value) {
        journal.experience = Math.max(0, Math.floor(value || 0));
        saveJournal();
        renderJournal();
    },
    getBouchonsPossedes: function () { return journal.bouchons.slice(); },
    getBoutiqueHtml: function () { return boutique ? boutique.innerHTML : ''; },
    acheterBouchon: acheterBouchon,
    perdreLeBouchon: perdreLeBouchon,
    xpPourPrise: xpPourPrise,
    gagnerExperience: gagnerExperience,
    getCapaciteBouchon: function () { return capaciteBouchon(); },
    isBiteViewActive: function () { return biteViewActive; },
    getCameraMode: function () { return cameraMode; },
    getFloatingTexts: function () {
        return floatingTexts.map(function (item) { return item.texte; });
    },
    getMissRings: function () { return missRings.length; },
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
    getStruggleBaseLength: function () { return struggle ? struggle.baseLength : 0; },
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
    getPondRadius: function () { return POND_RADIUS; },
    water: water,
    bourriche: bourriche,
    getWaterHeightAt: function (x, z) { return waterWaveHeightAt(x, z, testTime); },
    getBaitInterest: function () { return baitInterest; },
    getHookDepth: function () { return HOOK_DEPTH; },
    // Profondeur de la ligne (réglable) et relief de l'étang — pour les tests.
    getProfondeur: function () { return profondeurLigne; },
    setProfondeur: setProfondeur,
    getBornesProfondeur: function () { return bornesProfondeur().slice(); },
    profondeurLocale: profondeurLocale,
    // Profondeur maximale de l'étang (fond de la fosse la plus profonde).
    getProfondeurMaxEtang: function () {
        return FOND_CENTRE + Math.max.apply(null, FOSSES.map(function (f) { return f.plus; }));
    },
    fondY: fondY,
    isHameconDansLaVase: function () { return hameconDansLaVase; },
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
                id: s.id, nom: s.nom, form: s.form, style: s.style,
                minCm: s.cm[0], maxCm: s.cm[1], k: s.k,
                minKg: Math.round(s.k * Math.pow(s.cm[0], 3) / 100000 * 1000) / 1000,
                maxKg: Math.round(s.k * Math.pow(s.cm[1], 3) / 100000 * 1000) / 1000,
                agressivite: s.agressivite.slice(),
                abondance: s.abondance,
                profondeur: s.profondeur ? s.profondeur.slice() : null,
                couleur: s.couleur,
                motif: s.motif
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
    // Configuration des cibles de rendu — exposé pour les tests (« voile blanc »).
    getPostConfig: function () {
        return {
            sceneDepthBuffer: SCENE_TARGET_OPTIONS.depthBuffer,
            bloomDepthBuffer: BLOOM_TARGET_OPTIONS.depthBuffer,
            bloom: post.strength,
            vignette: post.vignette
        };
    },
    makeSceneTarget: function (w, h) {
        return makePostTarget(w, h, SCENE_TARGET_OPTIONS);
    },
    getChum: function () {
        return chum ? {
            x: chum.position.x,
            y: chum.position.y,
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
        updateMissRings(dt);
        updateFloatingTexts(dt);
        updateLine();
    }
};

// La fiche des touches est construite tout à la fin : le catalogue des touches
// est déclaré plus bas dans le fichier (on évite ainsi un accès avant création).
renderFicheTouches();
// Et on ouvre le carnet sur l'onglet « Prises ».
montrerOnglet('prises');

import * as THREE from 'three';
// Le « ?v=87 » est essentiel : sans lui, le navigateur peut resservir une
// VIEILLE copie de sound.js gardée en mémoire, et le jeu plante alors avec
// « sound.setRain is not a function ». On numérote donc AUSSI les modules
// importés (la version doit rester la même que celle de index.html).
import { SoundEngine } from './sound.js?v=116';
import { creerJeuDemelage } from './demelage.js';
import { creerModeQuiver } from './quiver.js';
import { SPECIES, STYLES_COMBAT, STYLE_DEFAUT, FORMES, FORMES_PAR_TYPE, TOUCHES, TOUCHES_PAR_ID } from './especes.js';
import { creerClassement } from './classement.js';
import { chargerCarnet, sauverCarnet } from './carnet.js';

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
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverText = document.getElementById('gameOverText');
const playerName = document.getElementById('playerName');
const saveScore = document.getElementById('saveScore');
const saveAndMenu = document.getElementById('saveAndMenu');
const backToMenu = document.getElementById('backToMenu');
const restartGame = document.getElementById('restartGame');
const showRanking = document.getElementById('showRanking');
const rankingButton = document.getElementById('rankingButton');
const classement = document.getElementById('classement');
const rankingTabs = document.getElementById('rankingTabs');
const rankingList = document.getElementById('rankingList');
const closeRanking = document.getElementById('closeRanking');
const accueil = document.getElementById('accueil');
const playButton = document.getElementById('playButton');
const accueilClassement = document.getElementById('accueilClassement');
const endGameButton = document.getElementById('endGameButton');
const modalBackdrop = document.getElementById('modalBackdrop');
const tangleGame = document.getElementById('tangleGame');
const tangleCanvas = document.getElementById('tangleCanvas');
const tangleTimer = document.getElementById('tangleTimer');
const tangleProgress = document.getElementById('tangleProgress');
const tangleMessage = document.getElementById('tangleMessage');
const tangleGiveUp = document.getElementById('tangleGiveUp');
const techniqueSelect = document.getElementById('techniqueSelect');
const quiverPanel = document.getElementById('quiverPanel');
const quiverCanvas = document.getElementById('quiverCanvas');
const compassDisplay = document.getElementById('compass');
const posteSud = document.getElementById('posteSud');
const posteEst = document.getElementById('posteEst');
const posteNord = document.getElementById('posteNord');
const posteOuest = document.getElementById('posteOuest');
const cartePlacement = document.getElementById('cartePlacement');
const cartePlacementAide = document.getElementById('cartePlacementAide');
const cartePlacementRepere = document.getElementById('cartePlacementRepere');
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
const sonarButton = document.getElementById('sonarButton');
const sonarPanel = document.getElementById('sonarPanel');
const sonarRadar = document.getElementById('sonarRadar');
const sonarCount = document.getElementById('sonarCount');
const cameraButton = document.getElementById('cameraButton');
const cameraControls = document.getElementById('cameraControls');
const toolToggle = document.getElementById('toolToggle');
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
    soundToggle.textContent = sound.enabled ? '🔊 Son' : '🔇 Son coupé';
    soundToggle.setAttribute('aria-pressed', String(sound.enabled));
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
    fermerOutils();
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
    pauseButton.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
    if (!paused) { fermerOutils(); }
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
let crankSpeedRad = 0;
let crankSpeedWindow = 0;
let crankSpeedStrikes = 0;

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
    if (paused) { return; }
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
    // Remonter TROP VITE fatigue la ligne — mais on mesure une MOYENNE sur une
    // fenêtre de 0,6 s, et il faut DEUX fenêtres de suite trop rapides : un coup
    // de poignet ne suffit pas, il faut vraiment enchaîner les tours.
    const maintenant = performance.now();
    const ecart = Math.max(8, maintenant - crankLastMoveTime) / 1000;
    crankLastMoveTime = maintenant;
    crankSpeedRad += Math.abs(delta);
    crankSpeedWindow += ecart;
    if (crankSpeedWindow >= 0.6) {
        const toursParSeconde = (crankSpeedRad / TWO_PI) / crankSpeedWindow;
        crankSpeedRad = 0;
        crankSpeedWindow = 0;
        if (toursParSeconde > VITESSE_MANIVELLE_MAX) {
            crankSpeedStrikes += 1;
            if (crankSpeedStrikes >= 2) {
                crankSpeedStrikes = 0;
                avertirVitesse();
            }
        } else {
            crankSpeedStrikes = 0;
        }
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
// Sur un écran étroit, le FOV horizontal devient trop petit : la bourriche et
// la girouette (à ±12 unités) sortent du cadre. On garantit un FOV horizontal
// minimum en élargissant le FOV vertical (borné pour éviter la déformation).
const H_FOV_MIN = 76 * Math.PI / 180;

function fovPourAspect(aspect) {
    const a = Math.max(0.2, aspect || 1);
    const vertical = 2 * Math.atan(Math.tan(H_FOV_MIN / 2) / a) * 180 / Math.PI;
    return Math.min(85, Math.max(50, vertical));
}

const NORMAL_CAM_POS = new THREE.Vector3(0, 8, 34);
const NORMAL_CAM_TARGET = new THREE.Vector3(0, 0, -15);
const cameraTarget = NORMAL_CAM_TARGET.clone();
// Vue RÉALISTE unique : plus aucun zoom sur le bouchon (le joueur le surveille
// de loin). On garde la variable pour l'API de test.
let cameraMode = 'normal';
camera.position.copy(NORMAL_CAM_POS);
camera.lookAt(cameraTarget);

const cameraAxis = new THREE.Vector3(0, 1, 0);
const adjustedCameraPosition = new THREE.Vector3();
const cameraTouches = new Map();
let cameraViewActive = false;
let cameraAngle = 0;
let cameraDistance = 1;
let previousCameraGesture = null;

function adjustCamera(angle, distanceFactor) {
    cameraAngle = THREE.MathUtils.clamp(cameraAngle + angle, -Math.PI / 4, Math.PI / 4);
    cameraDistance = THREE.MathUtils.clamp(cameraDistance * distanceFactor, 0.72, 1.25);
}

function resetCameraView() {
    cameraAngle = 0;
    cameraDistance = 1;
}

function setCameraView(active) {
    cameraViewActive = active;
    cameraControls.hidden = !active;
    toolToggle.hidden = active;
    cameraTouches.clear();
    previousCameraGesture = null;
    if (active) {
        fermerOutils();
        document.getElementById('cameraDone').focus?.();
    }
}

cameraButton.addEventListener('click', () => setCameraView(true));
document.getElementById('cameraLeft').addEventListener('click', () => adjustCamera(-Math.PI / 12, 1));
document.getElementById('cameraRight').addEventListener('click', () => adjustCamera(Math.PI / 12, 1));
document.getElementById('cameraCloser').addEventListener('click', () => adjustCamera(0, 0.88));
document.getElementById('cameraFarther').addEventListener('click', () => adjustCamera(0, 1.14));
document.getElementById('cameraReset').addEventListener('click', resetCameraView);
document.getElementById('cameraDone').addEventListener('click', () => {
    setCameraView(false);
    toolToggle.focus?.();
});

function updateCameraGesture() {
    if (cameraTouches.size !== 2) {
        previousCameraGesture = null;
        return;
    }
    const [a, b] = cameraTouches.values();
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
        previousCameraGesture = null;
        return;
    }
    const angle = Math.atan2(dy, dx);
    if (previousCameraGesture) {
        const delta = angle - previousCameraGesture.angle;
        adjustCamera(Math.atan2(Math.sin(delta), Math.cos(delta)), previousCameraGesture.distance / distance);
    }
    previousCameraGesture = { angle, distance };
}

function updateCameraPosition(dt) {
    adjustedCameraPosition.copy(NORMAL_CAM_POS).sub(NORMAL_CAM_TARGET)
        .multiplyScalar(cameraDistance).applyAxisAngle(cameraAxis, cameraAngle).add(NORMAL_CAM_TARGET);
    camera.position.lerp(adjustedCameraPosition, 1 - Math.pow(0.0001, dt));
}

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = fovPourAspect(camera.aspect);
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
// SOLEIL : orientation FIXE du monde (idee 2 de idees.md).
// L'azimut se lit comme sur une boussole : 0° = nord, 90° = est, 180° = sud,
// 270° = ouest. Le nord correspond à l'axe -z (le haut de l'écran au poste sud).
// 225° = sud-ouest, exactement ce qu'annonce la boussole du HUD.
// ---------------------------------------------------------------------------
const SUN_AZIMUT = 225;
const NOMS_AZIMUT = {
    0: 'nord', 45: 'nord-est', 90: 'est', 135: 'sud-est',
    180: 'sud', 225: 'sud-ouest', 270: 'ouest', 315: 'nord-ouest'
};

function azimutTexte(valeur) {
    const normalise = ((valeur % 360) + 360) % 360;
    return NOMS_AZIMUT[normalise] || (normalise + '°');
}

// Direction HORIZONTALE (x, z) vers le soleil pour un azimut donné.
function directionAzimut(azimut) {
    const a = (azimut * Math.PI) / 180;
    return { x: Math.sin(a), z: -Math.cos(a) };
}

// Direction 3D de référence (élévation de « midi ») : sert d'état initial au
// reflet solaire de l'eau, avant la première image.
function directionSoleil3D(cible) {
    const a = (SUN_AZIMUT * Math.PI) / 180;
    const elevation = (42 * Math.PI) / 180;
    return cible.set(
        Math.sin(a) * Math.cos(elevation),
        Math.sin(elevation),
        -Math.cos(a) * Math.cos(elevation)
    );
}

const SUN_DIRECTION = directionAzimut(SUN_AZIMUT);

// ---------------------------------------------------------------------------
// Lumières
// ---------------------------------------------------------------------------
// Lumière ambiante douce + lumière « ciel/sol » : les volumes sont plus naturels.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const skyLight = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a3f, 0.5);
scene.add(skyLight);

const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.15);
sunLight.position.set(SUN_DIRECTION.x * 70, 73, SUN_DIRECTION.z * 70);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(isMobileDevice ? 512 : 1024, isMobileDevice ? 512 : 1024);
// L'étang généré peut atteindre ~63 unités de rayon : la carte d'ombre doit
// couvrir tout le lac et la berge, sinon les arbres du fond perdent leur ombre.
sunLight.shadow.camera.left = -90;
sunLight.shadow.camera.right = 90;
sunLight.shadow.camera.top = 90;
sunLight.shadow.camera.bottom = -90;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 260;
// Ombres plus propres (moins d'« acné » sur le sable et l'eau).
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.03;
scene.add(sunLight);

const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
);
sunMesh.position.copy(sunLight.position).multiplyScalar(0.75);
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
sunGlow.position.copy(sunMesh.position);
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
    // LUMINOSITÉ DU POSTE : le soleil est TOUJOURS au sud-ouest ; selon l'endroit
    // où l'on pêche, on l'a dans le dos, de côté ou en plein contre-jour.
    const exposition = expositionPoste();
    // Soleil : azimut FIXE (sud-ouest), seule l'élévation suit le cycle du jour.
    sunLight.position.set(SUN_DIRECTION.x * 70, 12 + daylight * 65, SUN_DIRECTION.z * 70);
    sunLight.intensity = (0.25 + daylight * 1.05) * exposition;
    sunLight.color.copy(SUN_WARM).lerp(SUN_DAY, daylight);
    sunMesh.position.copy(sunLight.position).multiplyScalar(0.75);
    sunGlow.position.copy(sunMesh.position);
    // La même direction pour le reflet solaire du shader d'eau (plus de valeur
    // codée en dur : le soleil peut être ailleurs qu'au sud-ouest).
    waterUniforms.uSunDir.value.copy(sunLight.position).normalize();
    // Ciel (dégradé), brume et fond.
    skyMat.uniforms.topColor.value.copy(SKY_TOP_NIGHT).lerp(SKY_TOP_DAY, daylight);
    skyMat.uniforms.bottomColor.value.copy(SKY_BOTTOM_NIGHT).lerp(SKY_BOTTOM_DAY, daylight);
    scene.background.copy(skyMat.uniforms.bottomColor.value);
    scene.fog.color.copy(skyMat.uniforms.bottomColor.value);
    // Lumières d'ambiance : la nuit reste assez claire pour jouer.
    ambientLight.intensity = (0.42 + daylight * 0.22) * (0.94 + exposition * 0.06);
    skyLight.intensity = (0.38 + daylight * 0.30) * (0.96 + exposition * 0.04);
    waterUniforms.uLight.value = (0.35 + daylight * 0.65) * exposition;
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
const POND_RADIUS = 55;   // rayon NOMINAL (la forme réelle ondule autour de lui)
// Hauteur de la rive. La rive est légèrement PLUS HAUTE que l'eau : celle-ci
// reste « dans son bol ». Sans cela, la surface de l'eau arrive exactement au
// niveau des pieds du pêcheur (et le dépasse même en cas de rafale) : le
// pêcheur donne alors l'impression de flotter, voire d'être dans l'eau.
const RIVE_Y = 0.35;

// ---------------------------------------------------------------------------
// CONTOUR GÉNÉRÉ DE L'ÉTANG (idee 3 de idees.md)
// Le bord n'est PAS un cercle : c'est une somme de plusieurs harmoniques
// (coefficients fixes, donc déterministe). Les basses fréquences donnent une
// forme allongée et lobée (une vraie « mare »), les hautes ajoutent des criques.
// Amplitude totale : 10,5 % + 6 % + 3,5 % + 2 % = 22 % du rayon nominal.
// Le rayon varie donc d'environ 43 à 67 unités : ce n'est plus un cercle.
// Aucun tirage aléatoire n'est consommé : le monde des tests reste reproductible.
// ---------------------------------------------------------------------------
const BRUIT_ETANG = [
    { amplitude: 0.105, frequence: 2, phase: 0.6 },
    { amplitude: 0.060, frequence: 3, phase: 2.4 },
    { amplitude: 0.035, frequence: 5, phase: 4.1 },
    { amplitude: 0.020, frequence: 7, phase: 1.3 }
];
const RAYON_ETANG_VARIATION = BRUIT_ETANG.reduce(function (total, bruit) {
    return total + bruit.amplitude;
}, 0);
const RAYON_ETANG_MAX = POND_RADIUS * (1 + RAYON_ETANG_VARIATION);

// Rayon de l'étang dans la direction `angle` (radians, x = cos, z = sin).
function rayonEtang(angle) {
    let facteur = 1;
    for (let i = 0; i < BRUIT_ETANG.length; i++) {
        const bruit = BRUIT_ETANG[i];
        facteur += bruit.amplitude * Math.sin(bruit.frequence * angle + bruit.phase);
    }
    return POND_RADIUS * facteur;
}

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

// Profondeur d'eau (positive) à un point de l'étang. Le bord suit le CONTOUR
// GÉNÉRÉ : à un même éloignement du centre, on n'a pas la même profondeur
// selon la direction (l'étang est un peu ovale, avec des criques).
function profondeurLocale(x, z) {
    const dx = x - POND_CENTER.x;
    const dz = z - POND_CENTER.z;
    const d = Math.hypot(dx, dz);
    const rayonLocal = rayonEtang(Math.atan2(dz, dx));
    const t = Math.min(1, d / rayonLocal);
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

// Fond de l'étang : un disque dont les sommets suivent le relief ET le contour
// généré. `marge` déborde un peu sous la rive pour éviter toute fente visible.
function makeFondGeometry(marge, rings, segments) {
    const positions = [POND_CENTER.x, fondY(POND_CENTER.x, POND_CENTER.z), POND_CENTER.z];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const rr = (rayonEtang(a) + marge) * (r / rings);
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
    makeFondGeometry(2, 26, 96),
    // Double face : les faces du disque pointent vers le bas -> invisibles depuis
    // la berge ; on voyait donc le ciel a travers l'eau (d'ou la nappe blanche).
    new THREE.MeshStandardMaterial({ color: 0x246b7a, roughness: 1, side: THREE.DoubleSide })
);
// La hauteur est dans la géométrie : le maillage est simplement centré.
pondBottom.position.set(POND_CENTER.x, 0, POND_CENTER.z);
scene.add(pondBottom);

// Eau : disque « polaire » (anneaux + rayons) pour permettre au shader de
// déformer finement la surface en vagues. Chaque anneau suit le CONTOUR de
// l'étang : le bord de l'eau n'est plus un cercle parfait.
function makeWaterGeometry(rings, segments) {
    const positions = [0, 0, 0];
    const indices = [];
    for (let r = 1; r <= rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const rr = rayonEtang(a) * (r / rings);
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

const textureLoader = (typeof THREE.TextureLoader === 'function') ? new THREE.TextureLoader() : null;
function chargerTexture(nom, rx, ry, srgb) {
    if (!textureLoader) {
        return null;
    }
    let tex = null;
    try {
        tex = textureLoader.load('./assets/' + nom);
    } catch (erreur) {
        return null;      // environnement sans images (tests) : on garde la couleur
    }
    if (tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(rx || 1, ry || 1);
        // Une NORMAL map reste LINÉAIRE (sRGB la déformerait).
        if (srgb !== false && THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        }
    }
    return tex;
}

// Uniforms de l'eau (partagés avec la houle calculée côté JavaScript).
const waterUniforms = {
    uTime: { value: 0 },
    uWindDir: { value: new THREE.Vector2(1, 0) },
    uWind: { value: 0 },
    uLight: { value: 1 },
    // Direction NORMALISÉE (du plan d'eau vers le soleil) : elle suit l'azimut
    // fixe du soleil et son élévation, au lieu d'être codée en dur dans le shader.
    uSunDir: { value: directionSoleil3D(new THREE.Vector3()) },
    uShallow: { value: new THREE.Color(0x3d7d92) },
    uDeep: { value: new THREE.Color(0x0a2736) },
    uSky: { value: new THREE.Color(0x9fc7d6) },
    uNormals: { value: chargerTexture('eau-normales.jpg', 1, 1, false) || makeWaterNormalTexture() },
    uNormalsOn: { value: 0 },
    uReflection: { value: null },
    uReflectOn: { value: 0 },
    uReflectionProjection: { value: new THREE.Matrix4() }
};

// ---------------------------------------------------------------------------
// COUCHE 2 du rendu d'eau : REFLET PLANAIRE. Une caméra miroir (symétrique par
// rapport au plan y = 0) rend la scène dans une petite cible, échantillonnée par
// le shader et déformée par les normales. Basse résolution + une image sur deux,
// désactivé sur mobile.
// ---------------------------------------------------------------------------
const waterReflectionTarget = postSupported && !isMobileDevice
    ? new THREE.WebGLRenderTarget(320, 180, { depthBuffer: true }) : null;
const waterMirrorCamera = new THREE.PerspectiveCamera();
const mirrorDirection = new THREE.Vector3();
const mirrorUp = new THREE.Vector3();
const reflectionClip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
let waterReflectionFrame = 0;

function updateWaterReflection() {
    if (!reflections.enabled || !waterReflectionTarget || camera.position.y <= 0) {
        waterUniforms.uReflectOn.value = 0;
        return;
    }
    waterReflectionFrame += 1;
    if (waterUniforms.uReflectOn.value && waterReflectionFrame % 2 !== 0) { return; }
    waterMirrorCamera.copy(camera);
    camera.getWorldDirection(mirrorDirection);
    mirrorDirection.y *= -1;
    mirrorUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    mirrorUp.y *= -1;
    waterMirrorCamera.up.copy(mirrorUp);
    waterMirrorCamera.position.y *= -1;
    waterMirrorCamera.lookAt(mirrorDirection.add(waterMirrorCamera.position));
    waterMirrorCamera.updateMatrixWorld(true);

    const previousTarget = renderer.getRenderTarget();
    const previousClipping = renderer.clippingPlanes;
    const previousVisibility = water.visible;
    const previousShadowUpdate = renderer.shadowMap.autoUpdate;
    try {
        water.visible = false;
        renderer.clippingPlanes = reflectionClip;
        renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(waterReflectionTarget);
        renderer.clear();
        renderer.render(scene, waterMirrorCamera);
        waterUniforms.uReflectionProjection.value.multiplyMatrices(
            waterMirrorCamera.projectionMatrix, waterMirrorCamera.matrixWorldInverse);
        waterUniforms.uReflection.value = waterReflectionTarget.texture;
        waterUniforms.uReflectOn.value = 1;
    } catch (error) {
        setReflections(false);
        reflectionsToggle.checked = false;
        console.warn('Reflet planaire indisponible', error);
    } finally {
        renderer.setRenderTarget(previousTarget);
        renderer.clippingPlanes = previousClipping;
        renderer.shadowMap.autoUpdate = previousShadowUpdate;
        water.visible = previousVisibility;
    }
}

// Miroir JS de la composition de l'eau (memes regles que le fragment shader) :
// sert aux TESTS DE NON-REGRESSION pour garantir une eau bleu-vert sombre et
// jamais une nappe blanche.
function couleurEau(prof, fres) {
    const p = Math.max(0, Math.min(1, prof));
    const f = Math.max(0, Math.min(1, fres));
    const melange = function (a, b, t) {
        return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
    };
    const shallow = waterUniforms.uShallow.value;
    const deep = waterUniforms.uDeep.value;
    const sky = waterUniforms.uSky.value;
    let col = melange({ r: shallow.r, g: shallow.g, b: shallow.b },
        { r: deep.r, g: deep.g, b: deep.b }, p);
    col = melange(col, { r: sky.r, g: sky.g, b: sky.b }, f * 0.22);
    return col;
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
            float amp = 0.11 * (0.5 + uWind * 1.4);
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
        uniform float uReflectOn;
        uniform mat4 uReflectionProjection;
        uniform float uTime;
        uniform float uWind;
        uniform float uLight;
        uniform vec3 uSunDir;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vDepth;
        vec3 vRipple;
        void main() {
            // Deux nappes de normales qui défilent avec le vent : ridules par pixel.
            if (uNormalsOn > 0.5) {
                vec2 uv1 = vWorldPos.xz * 0.05 + vec2(uTime * 0.010, uTime * 0.006) * (0.5 + uWind);
                vec2 uv2 = vWorldPos.xz * 0.11 - vec2(uTime * 0.016, -uTime * 0.012) * (0.4 + uWind);
                vec3 t1 = texture2D(uNormals, uv1).rgb * 2.0 - vec3(1.0);
                vec3 t2 = texture2D(uNormals, uv2).rgb * 2.0 - vec3(1.0);
                vRipple = (t1 + t2) * 0.5;
            }
            vec3 n = normalize(vNormal + vec3(vRipple.x, 0.0, vRipple.y) * 0.8);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);
            // LA profondeur commande la couleur : claire au bord, sombre au fond.
            float prof = clamp(vDepth / 5.2, 0.0, 1.0);
            vec3 col = mix(uShallow, uDeep, prof);
            // Un peu de vaguelette : petites variations de teinte.
            col *= 0.94 + 0.06 * clamp(n.y, 0.0, 1.0);
            col = mix(col, uSky, fres * 0.22);
            // REFLET du décor (couche 2) : distordu par les ridules.
            if (uReflectOn > 0.5) {
                vec4 mirrorPoint = uReflectionProjection * vec4(vWorldPos.x, 0.0, vWorldPos.z, 1.0);
                if (mirrorPoint.w > 0.0) {
                    vec2 uvRef = mirrorPoint.xy / mirrorPoint.w * 0.5 + 0.5 + vRipple.xy * 0.025;
                    vec2 edge = min(uvRef, 1.0 - uvRef);
                    float coverage = smoothstep(0.0, 0.04, min(edge.x, edge.y));
                    vec3 reflet = texture2D(uReflection, clamp(uvRef, vec2(0.0), vec2(1.0))).rgb;
                    col = mix(col, reflet, coverage * (0.12 + fres * 0.32));
                }
            }
            // La nuit, l'eau s'assombrit (cohérent avec la lumière de la scène).
            col *= mix(vec3(0.30, 0.36, 0.48), vec3(1.0), uLight);
            vec3 halfDir = normalize(viewDir + uSunDir);
            float spec = pow(max(dot(n, halfDir), 0.0), 90.0) * (0.16 + uWind * 0.34) * uLight;
            col += vec3(spec);
            // Eau plus transparente : on voit la moitié inférieure du bouchon et
            // le bas de ligne sous la surface.
            float alpha = clamp(0.45 + prof * 0.40 + fres * 0.10, 0.0, 0.96);
            gl_FragColor = vec4(col, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
});

const water = new THREE.Mesh(makeWaterGeometry(22, 64), waterMaterial);
water.position.set(POND_CENTER.x, 0, POND_CENTER.z);
scene.add(water);

// ---------------------------------------------------------------------------
// Le reflet planaire est proposé sur ordinateur ; le ciel reste visible sur mobile.
const reflections = { enabled: false };
function setReflections(value) {
    reflections.enabled = !!value && !!waterReflectionTarget;
    waterUniforms.uReflectOn.value = 0;
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

// Rive : un anneau dont le bord INTÉRIEUR suit le contour généré de l'étang.
// (Un RingGeometry donnait un cercle parfait et laissait des fentes.)
function makeShoreGeometry(outer, segments) {
    const positions = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    const coast = new THREE.Color(0xa08465);
    const transition = new THREE.Color(0xd7c7a7);
    const grass = new THREE.Color(0xffffff);
    for (let segment = 0; segment < segments; segment++) {
        const angle = segment / segments * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const inner = rayonEtang(angle);
        const edgeWidth = 1.7 + 0.8 * Math.sin(7 * angle) + 0.4 * Math.cos(13 * angle);
        const rings = [inner, inner + edgeWidth, inner + edgeWidth * 2, outer];
        for (let ring = 0; ring < rings.length; ring++) {
            const x = cos * rings[ring];
            const z = sin * rings[ring];
            positions.push(x, 0, z);
            uvs.push((x / outer + 1) / 2, (z / outer + 1) / 2);
            const color = ring === 0 ? coast : ring === 1 ? transition : grass;
            colors.push(color.r, color.g, color.b);
        }
        const next = ((segment + 1) % segments) * rings.length;
        for (let ring = 0; ring < rings.length - 1; ring++) {
            const current = segment * rings.length + ring;
            const adjacent = next + ring;
            indices.push(current, adjacent + 1, current + 1,
                current, adjacent, adjacent + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

const shore = new THREE.Mesh(
    makeShoreGeometry(220, 96),
    new THREE.MeshStandardMaterial({
        color: 0xe5e0c9, roughness: 0.94, vertexColors: true,
        normalScale: new THREE.Vector2(0.55, 0.55)
    })
);

async function loadShoreTextures(material) {
    const maps = [['map', 'sol-herbe', true]];
    if (!isMobileDevice) {
        maps.push(['normalMap', 'herbe-normales', false],
            ['roughnessMap', 'herbe-rugosite', false]);
    }
    let loader;
    try {
        const tryCompressed = renderer.extensions && typeof Worker !== 'undefined'
            && new URLSearchParams(window.location.search).get('textures') === 'ktx2';
        if (tryCompressed) {
            const { KTX2Loader } = await import('./assets/ktx2/loaders/KTX2Loader.js');
            const candidate = new KTX2Loader().detectSupport(renderer);
            if (Object.values(candidate.workerConfig).some(Boolean)) {
                loader = candidate.setWorkerLimit(1).setTranscoderPath('./assets/ktx2/libs/basis/');
            }
        }
        await Promise.all(maps.map(async ([property, name, srgb]) => {
            let texture;
            if (loader) {
                try {
                    texture = await loader.loadAsync('./assets/' + name + '.ktx2');
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(180, 180);
                } catch {
                    // Un navigateur peut bloquer les workers ou WebAssembly.
                }
            }
            material[property] = texture || chargerTexture(name + '.jpg', 180, 180, srgb);
            material.needsUpdate = true;
        }));
    } catch {
        for (const [property, name, srgb] of maps) {
            material[property] = chargerTexture(name + '.jpg', 180, 180, srgb);
        }
        material.needsUpdate = true;
    } finally {
        if (loader) { loader.dispose(); }
    }
}
loadShoreTextures(shore.material);
shore.position.set(POND_CENTER.x, RIVE_Y, POND_CENTER.z);
shore.receiveShadow = true;
scene.add(shore);

// ---------------------------------------------------------------------------
// Arbres
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// TEXTURES RÉELLES, chargées en LOCAL depuis assets/ (aucun CDN) :
//   ecorce.jpg        -> écorces des arbres      (ambientCG Bark006, CC0)
//   eau-normales.jpg  -> ridules de l'eau        (three.js waternormals, MIT)
//   sol-herbe.jpg     -> herbe (prêt pour le terrain) (ambientCG Grass004, CC0)
//   vase.jpg          -> fond vaseux             (ambientCG Ground054, CC0)
const trunkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, map: chargerTexture('ecorce.jpg', 2, 1) });
// Aiguilles de sapin GÉNÉRÉES (aucun fichier) : fond vert sombre + petits traits
// d'aiguilles clairs/foncés, tuilés 3x sur les cônes. Si le canvas n'est pas
// disponible (tests), on garde simplement le vert uni.
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
            g.strokeStyle = 'rgb(' + Math.round(t * 0.55) + ',' + t + ',' + Math.round(t * 0.65) + ')';
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
    // Les arbres poussent DERRIÈRE la rive LOCALE (le contour n'est pas un cercle).
    const radius = rayonEtang(angle) + 8 + rand() * 35;
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

// Nénuphars
const lilyPads = [];
const lilyMat = new THREE.MeshStandardMaterial({ color: 0x3f7d4a, roughness: 0.8, side: THREE.DoubleSide });
for (let i = 0; i < 14; i++) {
    const radius = 0.25 + rand() * 0.45;   // 12 à 35 cm de rayon
    const pad = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    const angle = rand() * Math.PI * 2;
    // Les nénuphars restent DANS l'eau, à distance du bord local.
    const r = rand() * Math.max(1, rayonEtang(angle) - 12);
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
    // Les rochers restent sur la berge, derrière le bord local.
    const r = rayonEtang(angle) + 3 + rand() * 12;
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

const rodLocalTip = rodTip.clone().sub(rodBase);
const rodPivot = new THREE.Group();
rodPivot.position.copy(rodBase);
scene.add(rodPivot);
const rodGroup = new THREE.Group();
rodPivot.add(rodGroup);

const blankMaterial = new THREE.MeshStandardMaterial({ color: 0x25292a, roughness: 0.32 });
const guideMaterial = new THREE.MeshStandardMaterial({ color: 0x8b9297, metalness: 0.7, roughness: 0.3 });
const wrapMaterial = new THREE.MeshStandardMaterial({ color: 0x463025, roughness: 0.55 });
const corkMaterial = new THREE.MeshStandardMaterial({ color: 0xb89163, roughness: 0.88 });
const rodAxis = rodLocalTip.clone().normalize();
const guideSide = new THREE.Vector3(0, -1, 0).addScaledVector(rodAxis, rodAxis.y).normalize();
const cylinderAxis = new THREE.Vector3(0, 1, 0);
const guideAxis = new THREE.Vector3(0, 0, 1);

function addRodCylinder(from, to, baseRadius, tipRadius, material, parent = rodGroup) {
    const direction = to.clone().sub(from);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(
        tipRadius, baseRadius, direction.length(), 12), material);
    mesh.position.copy(from).lerp(to, 0.5);
    mesh.quaternion.setFromUnitVectors(cylinderAxis, direction.normalize());
    parent.add(mesh);
    return mesh;
}

const blank = new THREE.Mesh(new THREE.CylinderGeometry(
    0.004, 0.022, rodLocalTip.length(), 12, 16), blankMaterial);
blank.geometry.rotateZ(-Math.PI / 2);
blank.geometry.translate(rodLocalTip.length() * 0.5, 0, 0);
const blankAxis = new THREE.Vector3(1, 0, 0);
blank.geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(blankAxis, rodAxis));
const blankPositions = blank.geometry.getAttribute('position');
const blankRest = blankPositions.array.slice();
const guideMounts = [];
let previousRodFlex = 0;
rodGroup.add(blank);
blank.castShadow = true;
addRodCylinder(new THREE.Vector3(), rodLocalTip.clone().multiplyScalar(0.15), 0.052, 0.043, corkMaterial);
addRodCylinder(rodLocalTip.clone().multiplyScalar(0.15),
    rodLocalTip.clone().multiplyScalar(0.22), 0.037, 0.032, wrapMaterial);
addRodCylinder(rodLocalTip.clone().multiplyScalar(0.22),
    rodLocalTip.clone().multiplyScalar(0.27), 0.039, 0.031, corkMaterial);

const spoolMaterial = new THREE.MeshStandardMaterial({ color: 0xb28643, metalness: 0.72, roughness: 0.31 });
const lineCoilMaterial = new THREE.MeshStandardMaterial({ color: 0x798477, roughness: 0.68 });
const reelSeat = rodLocalTip.clone().multiplyScalar(0.18);
const reelCenter = reelSeat.clone().addScaledVector(guideSide, 0.19);
const spoolBack = reelCenter.clone().addScaledVector(rodAxis, 0.09);
const spoolFront = reelCenter.clone().addScaledVector(rodAxis, 0.17);
const bodyBack = reelCenter.clone().addScaledVector(rodAxis, -0.11);
const crankSide = new THREE.Vector3().crossVectors(rodAxis, guideSide).normalize();

addRodCylinder(reelSeat.clone().addScaledVector(rodAxis, -0.12),
    reelSeat.clone().addScaledVector(rodAxis, 0.10), 0.041, 0.036, guideMaterial);
addRodCylinder(reelSeat, reelCenter, 0.016, 0.029, blankMaterial);
addRodCylinder(bodyBack, reelCenter, 0.028, 0.075, blankMaterial);
addRodCylinder(reelCenter, spoolBack, 0.072, 0.064, blankMaterial);
addRodCylinder(spoolBack, spoolFront, 0.055, 0.057, lineCoilMaterial);
addRodCylinder(spoolFront, spoolFront.clone().addScaledVector(rodAxis, 0.018),
    0.073, 0.066, spoolMaterial);
addRodCylinder(spoolFront.clone().addScaledVector(rodAxis, 0.018),
    spoolFront.clone().addScaledVector(rodAxis, 0.041), 0.027, 0.018, blankMaterial);

const reelRotor = new THREE.Group();
reelRotor.position.copy(spoolBack);
rodGroup.add(reelRotor);
const bail = new THREE.Mesh(new THREE.TorusGeometry(0.091, 0.004, 6, 24, Math.PI * 1.15), guideMaterial);
bail.position.addScaledVector(rodAxis, 0.054);
bail.quaternion.setFromUnitVectors(guideAxis, rodAxis);
reelRotor.add(bail);
for (const side of [-1, 1]) {
    const hinge = crankSide.clone().multiplyScalar(0.081 * side);
    addRodCylinder(hinge, hinge.clone().addScaledVector(rodAxis, 0.053),
        0.017, 0.022, blankMaterial, reelRotor);
}

const reelCrank = new THREE.Group();
reelCrank.position.copy(reelCenter);
rodGroup.add(reelCrank);
const crankElbow = crankSide.clone().multiplyScalar(0.127);
const crankHandle = crankElbow.clone().addScaledVector(guideSide, 0.096);
addRodCylinder(new THREE.Vector3(), crankElbow, 0.018, 0.012, guideMaterial, reelCrank);
addRodCylinder(crankElbow, crankHandle, 0.012, 0.009, guideMaterial, reelCrank);
addRodCylinder(crankHandle, crankHandle.clone().addScaledVector(crankSide, 0.057),
    0.019, 0.023, blankMaterial, reelCrank);

for (const fraction of [0.35, 0.48, 0.60, 0.71, 0.81, 0.90, 0.96]) {
    const radius = THREE.MathUtils.lerp(0.05, 0.014, fraction);
    const mount = rodLocalTip.clone().multiplyScalar(fraction);
    const ringCenter = mount.clone().addScaledVector(guideSide, radius * 1.6);
    const foot = addRodCylinder(mount, ringCenter.clone().addScaledVector(guideSide, -radius),
        0.006, 0.004, guideMaterial);
    const wrapRadius = THREE.MathUtils.lerp(0.023, 0.005, fraction);
    const wrap = addRodCylinder(mount.clone().addScaledVector(rodAxis, -0.025),
        mount.clone().addScaledVector(rodAxis, 0.025), wrapRadius, wrapRadius, wrapMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.003, 6, 12), guideMaterial);
    ring.position.copy(ringCenter);
    ring.quaternion.setFromUnitVectors(guideAxis, rodAxis);
    rodGroup.add(ring);
    guideMounts.push({ fraction, rodParts: [foot, ring, wrap].map(mesh => ({ mesh, rest: mesh.position.clone() })) });
}
const tipGuide = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.003, 6, 12), guideMaterial);
tipGuide.position.copy(rodLocalTip);
tipGuide.quaternion.setFromUnitVectors(guideAxis, rodAxis);
rodGroup.add(tipGuide);

function rodFlexOffset(fraction, flex) {
    const t = Math.max(0, (fraction - 0.27) / 0.73);
    return flex * 2 * t * t * (1 - t);
}

function updateRodFlex(flex) {
    if (Math.abs(flex - previousRodFlex) < 0.001) { return; }
    previousRodFlex = flex;
    const length = rodLocalTip.length();
    for (let i = 0; i < blankRest.length; i += 3) {
        const x = blankRest[i];
        const y = blankRest[i + 1];
        const z = blankRest[i + 2];
        const fraction = THREE.MathUtils.clamp((x * rodAxis.x + y * rodAxis.y + z * rodAxis.z) / length, 0, 1);
        const offset = rodFlexOffset(fraction, flex);
        blankPositions.setXYZ(i / 3, x + guideSide.x * offset, y + guideSide.y * offset, z + guideSide.z * offset);
    }
    blankPositions.needsUpdate = true;
    blank.geometry.computeVertexNormals();
    for (const { fraction, rodParts } of guideMounts) {
        const offset = rodFlexOffset(fraction, flex);
        for (const { mesh, rest } of rodParts) {
            mesh.position.copy(rest).addScaledVector(guideSide, offset);
        }
    }
}

// Pliage de la canne + position VISUELLE du bout (la ligne part de là).
// `rodTip` reste la référence logique (distances, tests) et ne bouge pas.
const rodTipVisual = rodTip.clone();
const ROD_BEND_AXIS = new THREE.Vector3(1, 0, 0);
const AXE_VERTICAL = new THREE.Vector3(0, 1, 0);
let rodBend = 0;

// ---------------------------------------------------------------------------
// GESTE DE LANCER : la canne s'arme en arrière pendant la charge, puis fouette
// vers l'avant au lâcher. Le pêcheur et la canne s'orientent vers la cible
// réelle (point visé, puis bouchon). `castSwing` > 0 = armé, < 0 = fouetté.
// ---------------------------------------------------------------------------
let castSwing = 0;
let castSwingDepart = 0;        // valeur de l'armé au moment du lâcher
let castYawAngler = 0;          // écart de lacet du corps par rapport au poste
let castYawRod = 0;             // écart de lacet de la canne par rapport au poste
let anglerYawBase = Math.PI;    // lacet de repos du pêcheur (fixé au placement)
let rodYawBase = 0;             // lacet de repos du pivot de canne
const CAST_SWING_CHARGE = 0.55; // armé en arrière (~31°)
const CAST_SWING_RELEASE = -0.78; // fouetté vers l'avant (~45°)
const CAST_YAW_ANGLER_MAX = 0.8;  // le corps ne se tord pas au-delà de ~46°
const CAST_YAW_ROD_MAX = 1.2;     // la canne peut viser plus loin (~69°)

function angleNormalise(valeur) {
    const deuxPi = Math.PI * 2;
    let a = valeur % deuxPi;
    if (a > Math.PI) { a -= deuxPi; }
    if (a < -Math.PI) { a += deuxPi; }
    return a;
}

function updateRod(dt) {
    const quiverActif = modeQuiver.estActif();
    const cibleQuiver = (quiverActif && floatState === 'bite')
        ? modeQuiver.getBend() * 0.35 : 0;
    const target = ((floatState === 'struggle' || floatState === 'reeling') ? tension * 0.5
        : (floatState === 'bite' ? 0.10 : 0)) + cibleQuiver;
    rodBend += (target - rodBend) * Math.min(1, dt * 6);
    // En quiver, la canne est posée plus bas (scion vers l'eau) ; le geste de
    // lancer garde toutefois sa cinématique normale.
    const poseQuiver = (quiverActif && (floatState === 'inWater' || floatState === 'bite'
        || floatState === 'struggle' || floatState === 'reeling')) ? -0.24 : 0;
    const pliage = -rodBend + castSwing + poseQuiver;
    rodGroup.rotation.x = pliage;
    updateRodFlex(rodBend + castSwing * 0.4);
    reelCrank.quaternion.setFromAxisAngle(crankSide, crankAngle);
    reelRotor.quaternion.setFromAxisAngle(rodAxis, crankAngle * 5);
    // Pliage autour de l'axe LOCAL de la canne, puis orientation du poste :
    // c'est exactement la transformation de rodPivot -> rodGroup.
    rodTipVisual.copy(rodLocalTip).applyAxisAngle(ROD_BEND_AXIS, pliage);
    if (rodPivot.rotation.y) {
        rodTipVisual.applyAxisAngle(AXE_VERTICAL, rodPivot.rotation.y);
    }
    rodTipVisual.add(rodBase);
}

// ---------------------------------------------------------------------------
// Mode QUIVER : le module quiver.js gère le dessin du scion et ses mouvements.
// ---------------------------------------------------------------------------
function updateQuiver(dt) {
    if (!modeQuiver.estActif()) { return; }
    // Pas de bouchon : la ligne entre directement dans l'eau.
    floatGroup.visible = false;
    modeQuiver.update(dt, floatState);
}

function appliquerTechniqueVisuelle() {
    const quiver = techniqueCourante === 'quiver';
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
        document.body.classList.toggle('mode-quiver', quiver);
    }
    if (techniqueSelect) { techniqueSelect.value = techniqueCourante; }
    modeQuiver.setActif(quiver);
    if (quiver) {
        floatGroup.visible = false;
    } else {
        floatGroup.visible = true;
    }
}

function setTechnique(value) {
    const nouvelle = value === 'quiver' ? 'quiver' : 'bouchon';
    if (floatState !== 'idle' && nouvelle !== techniqueCourante) {
        statusDisplay.textContent = 'Termine la ligne en cours avant de changer de technique.';
        if (techniqueSelect) { techniqueSelect.value = techniqueCourante; }
        return false;
    }
    techniqueCourante = nouvelle;
    journal.technique = nouvelle;
    saveJournal();
    appliquerTechniqueVisuelle();
    statusDisplay.textContent = nouvelle === 'quiver'
        ? 'Technique quiver : surveille le scion de la canne (pas de bouchon).'
        : 'Technique bouchon : surveille le bouchon.';
    return true;
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
    updateDepthButtons(bornes);
    // La plage du bouchon équipé : c'est ELLE qui fixe la limite de profondeur.
    if (depthRange) {
        const f = flotteurCourant();
        depthRange.textContent = f.nom + ' : ' + nombreMetres(bornes[0]) + ' à '
            + nombreMetres(bornes[1]) + (profondeurLigne >= bornes[1] - 0.01 ? ' (maxi)' : '');
    }
}

function updateDepthButtons(bornes, adjustable = true) {
    depthMinus.disabled = !adjustable || profondeurLigne <= bornes[0] + 0.01;
    depthPlus.disabled = !adjustable || profondeurLigne >= bornes[1] - 0.01;
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
    // On peut amorcer à tout moment où le moulinet est libre : au repos OU
    // avec la ligne à l'eau (l'amorçage attire les poissons vers le bouchon).
    if (on && floatState !== 'idle' && floatState !== 'inWater') {
        statusDisplay.textContent = 'Attends la fin de l’action pour pouvoir amorcer.';
        return;
    }
    feedMode = !!on && (floatState === 'idle' || floatState === 'inWater');
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
    const maxR = rayonEtang(Math.atan2(dz, dx)) - 2;
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
    const maxR = rayonEtang(Math.atan2(dz, dx)) - 6;
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
    // Le geste de lancer (canne) entraîne aussi le bras : armé puis détendu.
    const cast = castSwing;
    arm.rotation.z = -0.9 - armSwing * 0.9 + armThrow * 1.6 + cast * 0.45;
    arm.rotation.x = 0.4 - armSwing * 1.0 + armThrow * 0.8 - cast * 0.30;
    arm.position.y = 2.1 + armSwing * 0.4 + Math.max(0, cast) * 0.15;
}

// Le menu reste accessible pendant l’action pour permettre la pause.
function mettreAJourBoutonOutils() {
    const ouvert = toolDock.classList.contains('ouvert');
    toolToggle.textContent = ouvert ? '✕ Fermer' : '☰ Menu';
    toolToggle.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    toolToggle.setAttribute('aria-expanded', String(ouvert));
}

function fermerOutils() {
    toolDock.classList.remove('ouvert');
    mettreAJourBoutonOutils();
}

toolToggle.addEventListener('click', () => {
    ensureSound();
    if (cameraViewActive) {
        setCameraView(false);
        return;
    }
    if (paused && toolDock.classList.contains('ouvert')) { return; }
    cancelCast();
    cancelFeed();
    toolDock.classList.toggle('ouvert');
    mettreAJourBoutonOutils();
});

function updateToolDock() {
    const resting = (floatState === 'idle' || floatState === 'inWater') && cameraMode === 'normal';
    cameraButton.disabled = !resting || paused;
    feedButton.disabled = !resting || paused;
    updateDepthButtons(bornesProfondeur(), resting && !paused && !cameraViewActive && castState === 'idle');
    sonarButton.disabled = !sonarBuoy.visible && (!resting || paused);
    if (cameraViewActive && !resting) { setCameraView(false); }
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

// ---------------------------------------------------------------------------
// EMPLACEMENTS AUTOUR DE L'ÉTANG (idee 1 de idees.md)
// Le monde (eau, poissons, nénuphars) ne bouge pas : c'est le « poste de
// pêche » qui fait le tour de l'étang. On tourne donc tout le matériel du
// pêcheur autour de POND_CENTER : pêcheur, canne, bouchon au repos, bourriche,
// girouette et caméra. Les 4 postes sont à 90° l'un de l'autre.
//   delta = rotation autour du centre (0 = poste historique, au sud).
// ---------------------------------------------------------------------------
const POSTES = [
    // `exposition` module la lumière du soleil ET la luminosité de l'eau :
    //  - sud   : soleil dans le dos (référence, lumière franche) ;
    //  - est   : soleil de côté (un peu plus doux) ;
    //  - nord  : contre-jour (l'eau est plus sombre) ;
    //  - ouest : plein soleil dans le dos (le plus lumineux).
    { id: 'sud', nom: 'Sud', delta: 0, exposition: 1.00 },
    { id: 'est', nom: 'Est', delta: Math.PI / 2, exposition: 0.96 },
    { id: 'nord', nom: 'Nord', delta: Math.PI, exposition: 0.90 },
    { id: 'ouest', nom: 'Ouest', delta: -Math.PI / 2, exposition: 1.04 }
];
let posteActuel = 0;          // preset le plus proche (pour la lumière et les boutons)
let emplacementLibre = false; // true = choisi à la main sur la carte
let boutonPosteActif = 0;     // -1 = aucun raccourci actif

// Distance entre le pêcheur et le bord LOCAL de l'eau. Le joueur peut choisir
// n'importe quel angle et une distance dans cette bande (carte vue de dessus).
const POSTE_MARGE = 2.2;
const PLACEMENT_MARGE_MIN = 1.4;
const PLACEMENT_MARGE_MAX = 6.0;

// Positions de référence du poste SUD (les valeurs historiques du jeu). On les
// fait tourner autour de l'étang pour obtenir n'importe quel emplacement.
const POSTE_ANGLER = angler.position.clone();
const POSTE_ROD_BASE = rodBase.clone();
const POSTE_ROD_TIP = rodTip.clone();
const POSTE_BOURRICHE = BOURRICHE_POS.clone();
const POSTE_GIROUETTE = vaneGroup.position.clone();
const POSTE_CAM_POS = NORMAL_CAM_POS.clone();
const POSTE_CAM_TARGET = NORMAL_CAM_TARGET.clone();
// Angle (x = cos, z = sin) du poste sud historique.
const ANGLE_BASE = Math.atan2(
    POSTE_ANGLER.z - POND_CENTER.z, POSTE_ANGLER.x - POND_CENTER.x);
let emplacementAngle = ANGLE_BASE;
let emplacementMarge = POSTE_MARGE;

// Exposition lumineuse du poste demandé (par défaut : le plus proche).
function expositionPoste(index) {
    const poste = POSTES[(typeof index === 'number') ? index : posteActuel];
    return poste ? poste.exposition : 1;
}

// Fait tourner `base` autour du centre de l'étang et écrit le résultat dans
// `cible` (on réutilise les Vector3 existants : aucun objet recréé).
function tournerAutourEtang(base, delta, cible) {
    const dx = base.x - POND_CENTER.x;
    const dz = base.z - POND_CENTER.z;
    const cos = Math.cos(delta);
    const sin = Math.sin(delta);
    cible.copy(base);
    cible.x = POND_CENTER.x + dx * cos + dz * sin;
    cible.z = POND_CENTER.z - dx * sin + dz * cos;
    return cible;
}

// Écart angulaire le plus court entre deux angles (radians).
function ecartAngulaire(a, b) {
    const deuxPi = Math.PI * 2;
    let d = Math.abs(a - b) % deuxPi;
    return Math.min(d, deuxPi - d);
}

// Preset (sud / est / nord / ouest) le plus proche d'un angle libre.
function plusProchePresetIndex(angle) {
    let meilleur = 0;
    let meilleurEcart = Infinity;
    POSTES.forEach(function (poste, index) {
        const cible = ANGLE_BASE - poste.delta;
        const ecart = ecartAngulaire(angle, cible);
        if (ecart < meilleurEcart) {
            meilleurEcart = ecart;
            meilleur = index;
        }
    });
    return meilleur;
}

// Nom de la direction (8 secteurs) pour un angle de position autour de l'étang.
// Convention boussole : 0° = nord, 90° = est, 180° = sud, 270° = ouest.
function azimutPosteTexte(angle) {
    const degres = (((angle * 180) / Math.PI) + 90 + 360) % 360;
    const secteurs = ['nord', 'nord-est', 'est', 'sud-est',
        'sud', 'sud-ouest', 'ouest', 'nord-ouest'];
    return secteurs[Math.round(degres / 45) % 8];
}

function nomEmplacementCourant() {
    return emplacementLibre
        ? azimutPosteTexte(emplacementAngle)
        : POSTES[posteActuel].nom.toLowerCase();
}

// Où est le NORD à l'écran ? Comme le poste fait le tour de l'étang, la caméra
// tourne aussi : « Nord en haut » n'est vrai qu'au poste sud. On affiche une
// flèche calculée à partir de la direction réelle de la caméra.
function flecheNordEcran() {
    const fx = cameraTarget.x - camera.position.x;
    const fz = cameraTarget.z - camera.position.z;
    const norme = Math.hypot(fx, fz) || 1;
    const avant = { x: fx / norme, z: fz / norme };
    // « Droite » à l'écran, dans le plan du sol (x = est, z = sud).
    const droite = { x: -avant.z, z: avant.x };
    const nord = { x: 0, z: -1 };
    const versAvant = nord.x * avant.x + nord.z * avant.z;
    const versDroite = nord.x * droite.x + nord.z * droite.z;
    if (Math.abs(versAvant) >= Math.abs(versDroite)) {
        return versAvant >= 0 ? '↑' : '↓';
    }
    return versDroite >= 0 ? '→' : '←';
}

function majEtiquettePoste() {
    if (!compassDisplay) {
        return;
    }
    compassDisplay.textContent = '🧭 Nord ' + flecheNordEcran()
        + ' · ☀️ soleil au ' + azimutTexte(SUN_AZIMUT)
        + ' · 📍 poste ' + nomEmplacementCourant();
}

const posteBoutons = [
    { element: posteSud, index: 0 },
    { element: posteEst, index: 1 },
    { element: posteNord, index: 2 },
    { element: posteOuest, index: 3 }
];

function majBoutonsPoste() {
    posteBoutons.forEach(function (bouton) {
        if (!bouton.element) {
            return;
        }
        const actif = bouton.index === boutonPosteActif;
        bouton.element.classList.toggle('actif', actif);
        if (typeof bouton.element.setAttribute === 'function') {
            bouton.element.setAttribute('aria-pressed', actif ? 'true' : 'false');
        }
    });
}

// Place tout le matériel du pêcheur à un ANGLE et une MARGE (distance au bord
// local) donnés. Refusé si une ligne est en l'air ou à l'eau.
//   presetIndex : index du raccourci (0-3) ou -1 pour un choix libre.
function placerALAngle(angle, marge, presetIndex, libre) {
    if (floatState !== 'idle' || !Number.isFinite(angle)) {
        return false;
    }
    const margeVoulue = Math.max(PLACEMENT_MARGE_MIN,
        Math.min(PLACEMENT_MARGE_MAX,
            Number.isFinite(marge) ? marge : POSTE_MARGE));
    emplacementAngle = angle;
    emplacementMarge = margeVoulue;
    emplacementLibre = !!libre;
    posteActuel = (typeof presetIndex === 'number' && presetIndex >= 0)
        ? presetIndex : plusProchePresetIndex(angle);
    boutonPosteActif = emplacementLibre ? -1 : posteActuel;

    // Rotation qui amène le poste sud historique sur l'angle demandé.
    const delta = ANGLE_BASE - angle;

    // 1) Rotation RIGIDE du matériel autour du centre : le poste fait le tour.
    tournerAutourEtang(POSTE_ANGLER, delta, angler.position);
    anglerYawBase = Math.PI + delta;
    rodYawBase = delta;
    angler.rotation.y = anglerYawBase;
    tournerAutourEtang(POSTE_ROD_BASE, delta, rodBase);
    tournerAutourEtang(POSTE_ROD_TIP, delta, rodTip);
    tournerAutourEtang(POSTE_BOURRICHE, delta, BOURRICHE_POS);
    tournerAutourEtang(POSTE_GIROUETTE, delta, vaneGroup.position);
    tournerAutourEtang(POSTE_CAM_POS, delta, NORMAL_CAM_POS);
    tournerAutourEtang(POSTE_CAM_TARGET, delta, NORMAL_CAM_TARGET);

    // 2) L'ÉTANG N'EST PAS UN CERCLE : on recale TOUT le matériel dans l'axe
    //    radial pour que le pêcheur soit à `marge` du bord LOCAL. Le décalage
    //    est le même pour la canne, la bourriche, la girouette et la caméra :
    //    le matériel reste rigide et le cadrage identique.
    const dxAngler = angler.position.x - POND_CENTER.x;
    const dzAngler = angler.position.z - POND_CENTER.z;
    const distanceAngler = Math.hypot(dxAngler, dzAngler) || 1;
    const anglePoste = Math.atan2(dzAngler, dxAngler);
    const distanceVoulue = rayonEtang(anglePoste) + emplacementMarge;
    const decalage = distanceVoulue - distanceAngler;
    const decalX = (dxAngler / distanceAngler) * decalage;
    const decalZ = (dzAngler / distanceAngler) * decalage;
    [angler.position, rodBase, rodTip, BOURRICHE_POS, vaneGroup.position,
        NORMAL_CAM_POS, NORMAL_CAM_TARGET].forEach(function (repere) {
        repere.x += decalX;
        repere.z += decalZ;
    });

    // Canne : pivot à la nouvelle base, orienté vers l'étang.
    rodPivot.position.copy(rodBase);
    rodPivot.rotation.y = rodYawBase;
    rodBend = 0;
    castSwing = 0;
    castYawAngler = 0;
    castYawRod = 0;
    rodGroup.rotation.x = 0;
    rodTipVisual.copy(rodTip);

    // Bouchon au repos, au bout de la canne.
    floatIdle.set(rodTip.x, rodTip.y - 0.6, rodTip.z);
    floatGroup.position.copy(floatIdle);

    // Bourriche et caméra suivent le décalage radial.
    bourriche.position.copy(BOURRICHE_POS);
    resetCameraView();
    camera.position.copy(NORMAL_CAM_POS);
    cameraTarget.copy(NORMAL_CAM_TARGET);
    camera.lookAt(cameraTarget);

    // Repères du combat : l'ancre est au bout de la canne.
    struggleAnchor.set(rodTip.x, 0, rodTip.z);
    strugglePos.set(rodTip.x, 0.1, rodTip.z);

    // Visées par défaut : vers le centre de l'étang, à bonne distance.
    const dx = POND_CENTER.x - angler.position.x;
    const dz = POND_CENTER.z - angler.position.z;
    const d = Math.hypot(dx, dz) || 1;
    castAim.set(angler.position.x + (dx / d) * 30, 0.1, angler.position.z + (dz / d) * 30);
    feedAim.set(angler.position.x + (dx / d) * 22, 0.1, angler.position.z + (dz / d) * 22);
    castTarget.set(castAim.x, 0.1, castAim.z);

    majCoupeProfondeur();
    majEtiquettePoste();
    majBoutonsPoste();
    renderCartePlacement();
    return true;
}

// Raccourci : les 4 boutons de l'accueil (sud / est / nord / ouest).
function placerAuPoste(index) {
    const poste = POSTES[index];
    if (!poste) {
        return false;
    }
    return placerALAngle(ANGLE_BASE - poste.delta, POSTE_MARGE, index, false);
}

// Choix libre depuis la carte vue de dessus : un angle + une distance à la
// berge. Si le clic est très proche d'un raccourci, on le rattache à ce poste.
function choisirEmplacement(angle, marge) {
    const preset = plusProchePresetIndex(angle);
    const cible = ANGLE_BASE - POSTES[preset].delta;
    const libre = ecartAngulaire(angle, cible) > (2 * Math.PI / 180);
    return placerALAngle(angle, marge, libre ? -1 : preset, libre);
}

// ---------------------------------------------------------------------------
// CARTE DE PLACEMENT VUE DE DESSUS (écran d'accueil)
// On voit l'étang de dessus ; la COURONNE claire autour de l'eau représente la
// zone où l'on peut se placer (1,4 à 6 unités de la berge locale). Cliquer ou
// glisser dans cette couronne choisit l'angle ET la distance à la berge.
// ---------------------------------------------------------------------------
const CARTE_3D_TAILLE = 320;        // résolution du canvas de la carte
const CARTE_3D_MONDE = 170;         // largeur du terrain représenté (unités)
const CARTE_3D_SEGMENTS = 96;       // résolution du maillage de relief
const CARTE_3D_EAU_Y = 0;           // HAUTEUR DE L'EAU : dessous = le lac
const CARTE_3D_BANDE_SEGMENTS = 128;

// ---------------------------------------------------------------------------
// HAUTEUR DU TERRAIN : un « champ de hauteur » (comme une image grayscale
// 2D dont on fixe le niveau de l'eau). Ici la hauteur est calculée à partir
// de la vraie profondeur de l'étang :
//   - sous le bord de l'eau : y = -profondeurLocale (négatif, c'est le lac) ;
//   - sur la berge : y remonte au-dessus de 0, avec des collines douces.
// Le plan d'eau est à y = CARTE_3D_EAU_Y (0).
// ---------------------------------------------------------------------------
function hauteurCarte(x, z) {
    const dx = x - POND_CENTER.x;
    const dz = z - POND_CENTER.z;
    const d = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const rayon = rayonEtang(angle);
    if (d <= rayon) {
        return -profondeurLocale(x, z);   // fond du lac, sous le plan d'eau
    }
    // Berge qui remonte, puis collines (dénivelé visible autour de l'étang).
    const t = d - rayon;
    let y = RIVE_Y + Math.min(7, t * 0.14);
    y += 0.35 * Math.sin(x * 0.07 + 0.8) * Math.cos(z * 0.06 - 0.4)
        + 0.18 * Math.sin((x + z) * 0.11 + 2.1);
    return Math.max(RIVE_Y + 0.05, y);
}

const CARTE_EAU_BAS = new THREE.Color(0x5a9aa8);
const CARTE_EAU_PROFOND = new THREE.Color(0x0d2c3a);
const CARTE_TERRE_BAS = new THREE.Color(0x3c3c3c);
const CARTE_TERRE_HAUT = new THREE.Color(0xdedede);
const _couleurCarte = new THREE.Color();

// Couleur du relief : eau bleu-vert (foncée avec la profondeur), terre en
// dégradé de gris (comme une heightmap) plus claire en altitude.
function couleurCarte(y) {
    if (y < CARTE_3D_EAU_Y) {
        const t = Math.min(1, -y / 5.5);
        return _couleurCarte.copy(CARTE_EAU_BAS).lerp(CARTE_EAU_PROFOND, t);
    }
    const t = Math.min(1, (y - RIVE_Y) / 7);
    return _couleurCarte.copy(CARTE_TERRE_BAS).lerp(CARTE_TERRE_HAUT, t);
}

const carteScene = new THREE.Scene();
carteScene.background = new THREE.Color(0x16242b);
const carteCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 600);
carteCamera.position.set(POND_CENTER.x + 75, 100, POND_CENTER.z + 120);
carteCamera.lookAt(POND_CENTER.x, -1, POND_CENTER.z);
carteCamera.updateMatrixWorld();
carteCamera.updateProjectionMatrix();

carteScene.add(new THREE.AmbientLight(0xffffff, 0.65));
const lumiereCarte = new THREE.DirectionalLight(0xffffff, 1.0);
const azimutSoleilCarte = directionAzimut(SUN_AZIMUT);
lumiereCarte.position.set(azimutSoleilCarte.x * 70, 90, azimutSoleilCarte.z * 70);
carteScene.add(lumiereCarte);

// --- Terrain : un maillage dont chaque sommet prend sa hauteur dans le champ. ---
const carteGeometrie = new THREE.PlaneGeometry(
    CARTE_3D_MONDE, CARTE_3D_MONDE, CARTE_3D_SEGMENTS, CARTE_3D_SEGMENTS);
carteGeometrie.rotateX(-Math.PI / 2);
const cartePositions = carteGeometrie.attributes.position;
const carteCouleurs = [];
let carteMinY = Infinity;
let carteMaxY = -Infinity;
let carteSousLEau = 0;
for (let i = 0; i < cartePositions.count; i++) {
    const x = cartePositions.getX(i) + POND_CENTER.x;
    const z = cartePositions.getZ(i) + POND_CENTER.z;
    const y = hauteurCarte(x, z);
    cartePositions.setY(i, y);
    const couleur = couleurCarte(y);
    carteCouleurs.push(couleur.r, couleur.g, couleur.b);
    carteMinY = Math.min(carteMinY, y);
    carteMaxY = Math.max(carteMaxY, y);
    if (y < CARTE_3D_EAU_Y) {
        carteSousLEau += 1;
    }
}
carteGeometrie.setAttribute('color', new THREE.Float32BufferAttribute(carteCouleurs, 3));
carteGeometrie.computeVertexNormals();
const carteTerrain = new THREE.Mesh(
    carteGeometrie,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })
);
carteTerrain.name = 'terrain-etang';
carteTerrain.position.set(POND_CENTER.x, 0, POND_CENTER.z);
carteScene.add(carteTerrain);

// --- Plan d'eau à hauteur fixe : tout ce qui est dessous est le lac. ---
const carteEau = new THREE.Mesh(
    new THREE.PlaneGeometry(CARTE_3D_MONDE, CARTE_3D_MONDE),
    new THREE.MeshStandardMaterial({
        color: 0x2b7ea1,
        transparent: true,
        opacity: 0.55,
        roughness: 0.25,
        metalness: 0.15,
        depthWrite: false,
        side: THREE.DoubleSide
    })
);
carteEau.name = 'eau-etang';
carteEau.rotation.x = -Math.PI / 2;
carteEau.position.set(POND_CENTER.x, CARTE_3D_EAU_Y, POND_CENTER.z);
carteScene.add(carteEau);

// Ligne de rivage (contour généré) juste au-dessus du plan d'eau.
const cartePointsRive = [];
for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    const r = rayonEtang(a);
    cartePointsRive.push(new THREE.Vector3(
        POND_CENTER.x + Math.cos(a) * r,
        CARTE_3D_EAU_Y + 0.06,
        POND_CENTER.z + Math.sin(a) * r
    ));
}
const carteLigneRive = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(cartePointsRive),
    new THREE.LineBasicMaterial({ color: 0xdff3fb })
);
carteLigneRive.name = 'rivage-etang';
carteScene.add(carteLigneRive);

// --- Couronne de placement : un ruban posé sur le relief (1,4 → 6 unités). ---
const carteBandePositions = [];
const carteBandeIndices = [];
for (let i = 0; i <= CARTE_3D_BANDE_SEGMENTS; i++) {
    const a = (i / CARTE_3D_BANDE_SEGMENTS) * Math.PI * 2;
    const ri = rayonEtang(a) + PLACEMENT_MARGE_MIN;
    const ro = rayonEtang(a) + PLACEMENT_MARGE_MAX;
    const xi = POND_CENTER.x + Math.cos(a) * ri;
    const zi = POND_CENTER.z + Math.sin(a) * ri;
    const xo = POND_CENTER.x + Math.cos(a) * ro;
    const zo = POND_CENTER.z + Math.sin(a) * ro;
    carteBandePositions.push(
        xi, hauteurCarte(xi, zi) + 0.07, zi,
        xo, hauteurCarte(xo, zo) + 0.07, zo
    );
}
for (let i = 0; i < CARTE_3D_BANDE_SEGMENTS; i++) {
    const a = i * 2;
    carteBandeIndices.push(a, a + 1, a + 3, a, a + 3, a + 2);
}
const carteBandeGeometrie = new THREE.BufferGeometry();
carteBandeGeometrie.setAttribute('position',
    new THREE.Float32BufferAttribute(carteBandePositions, 3));
carteBandeGeometrie.setIndex(carteBandeIndices);
carteBandeGeometrie.computeVertexNormals();
const carteBande = new THREE.Mesh(
    carteBandeGeometrie,
    new THREE.MeshBasicMaterial({
        color: 0xffe780,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false
    })
);
carteBande.name = 'zone-placement';
carteScene.add(carteBande);

// --- Repère 3D du pêcheur (mât + tête dorée) ---
const carteMarqueur = new THREE.Group();
carteMarqueur.name = 'emplacement-marker';
const carteMarqueurTige = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 5.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 })
);
carteMarqueurTige.position.y = 2.9;
carteMarqueur.add(carteMarqueurTige);
const carteMarqueurTete = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff0a8, roughness: 0.5 })
);
carteMarqueurTete.position.y = 6.3;
carteMarqueur.add(carteMarqueurTete);
const carteMarqueurAnneau = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.16, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5 })
);
carteMarqueurAnneau.rotation.x = Math.PI / 2;
carteMarqueurAnneau.position.y = 0.18;
carteMarqueur.add(carteMarqueurAnneau);
carteScene.add(carteMarqueur);

// --- Renderer dédié à la petite carte (contexte WebGL séparé, 320×320) ---
let carteRenderer = null;
try {
    carteRenderer = new THREE.WebGLRenderer({
        canvas: cartePlacement,
        antialias: true,
        alpha: false
    });
    carteRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    carteRenderer.setSize(CARTE_3D_TAILLE, CARTE_3D_TAILLE, false);
    if (THREE.SRGBColorSpace) {
        carteRenderer.outputColorSpace = THREE.SRGBColorSpace;
    }
} catch (erreur) {
    carteRenderer = null;
}

const carteRaycaster = new THREE.Raycaster();
const cartePlanEau = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function majMarqueurCarte() {
    const distance = rayonEtang(emplacementAngle) + emplacementMarge;
    const x = POND_CENTER.x + Math.cos(emplacementAngle) * distance;
    const z = POND_CENTER.z + Math.sin(emplacementAngle) * distance;
    const y = hauteurCarte(x, z);
    carteMarqueur.position.set(x, y, z);
    carteMarqueur.visible = true;
}

// Projette un emplacement du monde vers les coordonnées client du canvas.
// Sert aux tests (et pourrait servir à un survol) : on vise exactement le
// point du relief, donc le raycast retrouve le bon angle et la bonne marge.
function projeterPlacement(angle, marge) {
    const distance = rayonEtang(angle)
        + (typeof marge === 'number' ? marge : POSTE_MARGE);
    const x = POND_CENTER.x + Math.cos(angle) * distance;
    const z = POND_CENTER.z + Math.sin(angle) * distance;
    const y = hauteurCarte(x, z);
    carteCamera.updateMatrixWorld();
    const point = new THREE.Vector3(x, y, z).project(carteCamera);
    const rect = cartePlacement
        ? cartePlacement.getBoundingClientRect()
        : { left: 0, top: 0, width: CARTE_3D_TAILLE, height: CARTE_3D_TAILLE };
    const clientX = rect.left + (point.x * 0.5 + 0.5) * rect.width;
    const clientY = rect.top + (-point.y * 0.5 + 0.5) * rect.height;
    return {
        clientX: clientX,
        clientY: clientY,
        x: clientX,
        y: clientY,
        xMonde: x,
        yMonde: y,
        zMonde: z
    };
}

// Chemin SVG d'un contour de l'étang.
//   facteur : 1 = bord de l'eau, < 1 = isobathe ;
//   decalage : marge radiale en unités du monde (couronne de placement).
function cheminContourEtang(cx, cy, echelle, facteur, decalage) {
    const n = 96;
    const f = (typeof facteur === 'number') ? facteur : 1;
    const dec = (typeof decalage === 'number') ? decalage : 0;
    let d = '';
    for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = (rayonEtang(a) * f + dec) * echelle;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
}

function renderCartePlacement() {
    majMarqueurCarte();
    if (cartePlacementAide) {
        cartePlacementAide.textContent = '📍 '
            + (emplacementLibre
                ? azimutPosteTexte(emplacementAngle)
                : POSTES[posteActuel].nom.toLowerCase())
            + ' · ' + emplacementMarge.toFixed(1).replace('.', ',')
            + ' unité(s) de la berge — clique ou glisse sur le relief.';
    }
    if (cartePlacementRepere && cartePlacement) {
        const projection = projeterPlacement(emplacementAngle, emplacementMarge);
        const rect = cartePlacement.getBoundingClientRect();
        cartePlacementRepere.style.left = (projection.clientX - rect.left) + 'px';
        cartePlacementRepere.style.top = (projection.clientY - rect.top) + 'px';
    }
    if (carteRenderer) {
        carteCamera.updateMatrixWorld();
        carteRenderer.render(carteScene, carteCamera);
    }
}

// Convertit un clic sur le RELIEF en (angle, marge) dans le monde.
// On raycast le terrain : le point touché est un vrai point du relief, ce qui
// rend le choix cohérent avec le dénivelé affiché. Si le rayon ne touche pas
// le maillage (bord), on retombe sur le plan d'eau y = 0.
function emplacementDepuisCarte(event) {
    if (!cartePlacement) {
        return null;
    }
    const rect = cartePlacement.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) {
        return null;
    }
    const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    carteCamera.updateMatrixWorld();
    carteScene.updateMatrixWorld(true);
    carteRaycaster.setFromCamera(ndc, carteCamera);
    const hits = carteRaycaster.intersectObject(carteTerrain);
    let point = hits.length ? hits[0].point : null;
    if (!point) {
        point = new THREE.Vector3();
        if (!carteRaycaster.ray.intersectPlane(cartePlanEau, point)) {
            return null;
        }
    }
    const dx = point.x - POND_CENTER.x;
    const dz = point.z - POND_CENTER.z;
    const angle = Math.atan2(dz, dx);
    const distance = Math.hypot(dx, dz);
    const marge = distance - rayonEtang(angle);
    return {
        angle: angle,
        marge: Math.max(PLACEMENT_MARGE_MIN,
            Math.min(PLACEMENT_MARGE_MAX, marge))
    };
}

let cartePlacementPressee = false;
if (cartePlacement) {
    cartePlacement.addEventListener('pointerdown', function (event) {
        cartePlacementPressee = true;
        ensureSound();
        const point = emplacementDepuisCarte(event);
        if (point) {
            choisirEmplacement(point.angle, point.marge);
        }
        if (cartePlacement.setPointerCapture && event && event.pointerId !== undefined) {
            cartePlacement.setPointerCapture(event.pointerId);
        }
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
    });
    cartePlacement.addEventListener('pointermove', function (event) {
        if (!cartePlacementPressee) {
            return;
        }
        const point = emplacementDepuisCarte(event);
        if (point) {
            choisirEmplacement(point.angle, point.marge);
        }
    });
    const relacherCarte = function () { cartePlacementPressee = false; };
    cartePlacement.addEventListener('pointerup', relacherCarte);
    cartePlacement.addEventListener('pointercancel', relacherCarte);
    cartePlacement.addEventListener('pointerleave', relacherCarte);
}

posteBoutons.forEach(function (bouton) {
    if (!bouton.element) {
        return;
    }
    bouton.element.addEventListener('click', function () {
        placerAuPoste(bouton.index);
    });
});
majBoutonsPoste();
majEtiquettePoste();


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
const SONAR_PRICE = 150;
const SONAR_RADIUS = 24; // 12 m à l’échelle du jeu.
const sonarBuoy = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffb62e, roughness: 0.55 }));
sonarBuoy.visible = false;
scene.add(sonarBuoy);
const sonarContext = sonarRadar.getContext('2d');
let sonarScanTimer = 0;

function acheterSonar() {
    if (journal.sonar || journal.experience < SONAR_PRICE) { return false; }
    journal.experience -= SONAR_PRICE;
    journal.sonar = true;
    saveJournal();
    renderJournal();
    return true;
}

function rangerSonar() {
    sonarBuoy.visible = false;
    sonarPanel.hidden = true;
    sonarButton.textContent = '📡 Poser le sonar';
    sonarButton.setAttribute('aria-pressed', 'false');
}

function updateSonar(dt, time) {
    if (!sonarBuoy.visible) { return; }
    const origin = sonarBuoy.position;
    origin.y = 0.13 + waterWaveHeightAt(origin.x, origin.z, time);
    sonarScanTimer -= dt;
    if (sonarScanTimer > 0) { return; }
    sonarScanTimer = 0.2;

    const center = sonarRadar.width / 2;
    const radius = center - 4;
    if (sonarContext) {
        sonarContext.clearRect(0, 0, sonarRadar.width, sonarRadar.height);
        sonarContext.strokeStyle = '#76b5ac';
        for (const fraction of [0.5, 1]) {
            sonarContext.beginPath();
            sonarContext.arc(center, center, radius * fraction, 0, Math.PI * 2);
            sonarContext.stroke();
        }
        sonarContext.fillStyle = '#ffc454';
        sonarContext.fillRect(center - 2, center - 2, 4, 4);
        sonarContext.fillStyle = '#9df5c6';
    }

    let detected = 0;
    for (const fish of fishes) {
        if (fish === heldFish || fish.userData.hooked) { continue; }
        const dx = fish.position.x - origin.x;
        const dz = fish.position.z - origin.z;
        if (dx * dx + dz * dz > SONAR_RADIUS ** 2) { continue; }
        detected += 1;
        if (sonarContext) {
            sonarContext.beginPath();
            sonarContext.arc(center + dx / SONAR_RADIUS * radius,
                center + dz / SONAR_RADIUS * radius, 2.6, 0, Math.PI * 2);
            sonarContext.fill();
        }
    }
    const label = detected + (detected === 1 ? ' poisson' : ' poissons') + ' · 12 m';
    if (sonarCount.textContent !== label) {
        sonarCount.textContent = label;
        sonarRadar.setAttribute('aria-label', 'Radar, nord en haut. ' + label);
    }
}

sonarButton.addEventListener('click', () => {
    if (!journal.sonar) { return; }
    if (sonarBuoy.visible) {
        rangerSonar();
    } else {
        if (paused || (floatState !== 'idle' && floatState !== 'inWater')) { return; }
        if (floatState === 'inWater') {
            sonarBuoy.position.copy(floatGroup.position);
        } else {
            const angle = Math.atan2(angler.position.z - POND_CENTER.z, angler.position.x - POND_CENTER.x);
            const distance = rayonEtang(angle) - 4;
            sonarBuoy.position.set(POND_CENTER.x + Math.cos(angle) * distance, 0.13,
                POND_CENTER.z + Math.sin(angle) * distance);
        }
        sonarBuoy.visible = true;
        sonarPanel.hidden = false;
        sonarButton.textContent = '📡 Ranger le sonar';
        sonarButton.setAttribute('aria-pressed', 'true');
        sonarScanTimer = 0;
        updateSonar(0, elapsed);
    }
    fermerOutils();
});

const journal = { total: 0, totalWeight: 0, best: 0, last: [], especes: {}, experience: 0, sonar: false, technique: 'bouchon', bouchons: BOUCHONS_DE_DEPART.slice() };
// Compteur de la PARTIE en cours (la bourriche), distinct du carnet persistant
// (`journal.total` = total de toutes les parties).
let bourricheCount = 0;
// XP gagnée DANS LA PARTIE : repart à zéro à chaque JOUER. L'XP carrière
// (`journal.experience`) reste persistante pour la boutique (décision v97).
let experiencePartie = 0;
// Technique de pêche : 'bouchon' (flotteur) ou 'quiver' (scion de canne).
const modeQuiver = creerModeQuiver({ canvas: quiverCanvas, panel: quiverPanel });

let techniqueCourante = 'bouchon';
const journalStore = (typeof localStorage !== 'undefined') ? localStorage : null;
const JOURNAL_KEY = 'peche_carnet_v1';

function loadJournal() {
    chargerCarnet({
        store: journalStore,
        key: JOURNAL_KEY,
        data: journal,
        bouchonsDepart: BOUCHONS_DE_DEPART,
        trouverFlotteur: trouverFlotteur,
        setFlotteur: function (id) { flotteurChoix = id; },
        getFlotteur: function () { return flotteurChoix; }
    });
}

function saveJournal() {
    sauverCarnet({ store: journalStore, key: JOURNAL_KEY, data: journal });
}

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
    bourricheLabel.textContent = '🧺 Bourriche : ' + bourricheCount;
    // L'XP de partie repart à 0 ; l'XP carrière reste visible pour la boutique.
    xpLabel.textContent = '⭐ ' + experiencePartie + ' XP · ' + journal.experience + ' carrière';
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
    experiencePartie += gain;
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
    const owned = journal.sonar;
    sonarButton.hidden = !owned;
    html += '<div class="shop-item' + (owned ? ' owned' : '') + '">'
        + '<div class="shop-name">📡 Sonar flottant</div>'
        + '<div class="shop-desc">Repère les poissons à 12 m autour du sonar. Pose-le depuis le menu.</div>'
        + (owned ? '<button class="shop-btn equipped" disabled>✅ Acheté</button>'
            : '<button class="shop-btn buy" data-id="sonar" data-action="acheter"'
                + (journal.experience < SONAR_PRICE ? ' disabled' : '') + '>Acheter · ' + SONAR_PRICE + ' XP</button>')
        + '</div>';
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
    if (id === 'sonar' && cible.dataset.action === 'acheter') {
        if (acheterSonar()) { sound.catchFish(); }
        return;
    }
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
    // Chemin SVG du contour GÉNÉRÉ (facteur 1 = bord de l'eau, < 1 = isobathe).
    const cheminContour = function (facteur) {
        return cheminContourEtang(cx, cy, ech, facteur, 0);
    };
    let svg = '<svg viewBox="0 0 200 120" role="img" aria-label="Carte de l’étang">';
    svg += '<rect x="0" y="0" width="200" height="120" rx="10" fill="#2f6b3f"/>';
    // L'eau : des BANDES DE PROFONDEUR calculées avec le VRAI relief (plus c'est
    // foncé, plus c'est profond) — la carte sert vraiment à choisir où lancer.
    const TEINTES = ['#74c6e0', '#5cb4d2', '#48a2c4', '#3790b3', '#2b7ea1', '#216b8e', '#18597a', '#124a67'];
    // L'eau : le VRAI contour généré (aucun cercle imposé), rempli de la teinte
    // de surface. Les bandes de profondeur et les isobathes suivent ce contour.
    svg += '<path class="contour-etang" d="' + cheminContour(1)
        + '" fill="' + TEINTES[0] + '" stroke="#eaf6ff" stroke-width="0.8" opacity="0.95"/>';
    for (let i = 1; i < TEINTES.length; i++) {
        const prof = FOND_BORD + (i / TEINTES.length) * (FOND_CENTRE - FOND_BORD);
        const frac = (prof - FOND_BORD) / (FOND_CENTRE - FOND_BORD);
        if (frac <= 0.02 || frac >= 0.99) {
            continue;
        }
        svg += '<path d="' + cheminContour(Math.sqrt(1 - frac))
            + '" fill="' + TEINTES[i] + '"/>';
    }
    // ISOBATHES : les courbes de 1 m et 2 m (le 3 m n'existe que dans les fosses,
    // annotées juste après), avec leur valeur écrite.
    [2, 4].forEach(function (unites) {
        const frac = (unites - FOND_BORD) / (FOND_CENTRE - FOND_BORD);
        if (frac <= 0.02 || frac >= 0.99) {
            return;
        }
        const rr = R * Math.sqrt(1 - frac) * ech;
        svg += '<path d="' + cheminContour(Math.sqrt(1 - frac))
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
    fermerOutils();
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
    fish.userData.details.visible = true;
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
    bourricheCount += 1;
    scoreDisplay.textContent = score;
    recordBattu = null;
    // On enregistre d'abord : le carnet nous dit si c'est un NOUVEAU RECORD.
    const entree = addJournalEntry(weight, fish.userData.espece);
    showCatchMessage(weight, fish.userData.espece, entree.nouveauRecord,
        fish.userData.horsNorme);
    const gainXp = gagnerExperience(weight);
    sound.catchFish();
    spawnRipple(BOURRICHE_POS);
    spawnSplash(BOURRICHE_POS);
    if (entree.nouveauRecord) {
        annoncerRecord(weight, fish.userData.espece, entree.ancienRecord,
            fish.userData.horsNorme);
        return;
    }
    statusDisplay.textContent = (fish.userData.horsNorme ? '✨ HORS NORME ! ' : '')
        + 'Dans la bourriche ! ' + fish.userData.espece + ' — '
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
// Ligne tendue pendant le vol : un clic avant l'atterrissage évite l'emmêlement.
let ligneTendue = false;
let tangleChance = 0.32;
let jeuDemelage = null;
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
    if (castState !== 'idle' || (floatState !== 'idle' && floatState !== 'inWater') || feedMode) {
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
// ANIMATION DU LANCER : orientation vers la cible + geste de canne.
// Appelée à chaque image AVANT updateArm/updateRod.
// ---------------------------------------------------------------------------
function updateCastAnimation(dt) {
    // 1) Cible à regarder : point visé pendant la charge, point de chute
    //    pendant le vol, puis bouchon réel une fois à l'eau.
    let cible = null;
    let facteur = 0;
    if (castState === 'charging') {
        cible = castAim;
        facteur = 0.9;
    } else if (floatState === 'flying') {
        cible = castTarget;
        facteur = 1;
    } else if (floatState === 'inWater' || floatState === 'bite'
        || floatState === 'struggle' || floatState === 'reeling'
        || floatState === 'snag') {
        cible = floatGroup.position;
        facteur = 0.8;
    }
    let yawAnglerVoulu = 0;
    let yawRodVoulu = 0;
    if (cible) {
        const dx = cible.x - angler.position.x;
        const dz = cible.z - angler.position.z;
        if (Math.hypot(dx, dz) > 0.5) {
            const thetaCible = Math.atan2(dz, dx);
            // Pêcheur : son axe local +z donne theta = PI/2 - lacet.
            yawAnglerVoulu = angleNormalise(
                (Math.PI / 2 - thetaCible) - anglerYawBase) * facteur;
            // Canne : son bout local a un angle qui dépend AUSSI du geste
            // vertical (rotation X). On le recalcule avec le swing courant ;
            // un lacet ψ diminue l'angle monde de ψ.
            const zSwing = rodLocalTip.y * Math.sin(castSwing)
                + rodLocalTip.z * Math.cos(castSwing);
            const angleLocalCanne = Math.atan2(zSwing, rodLocalTip.x);
            yawRodVoulu = angleNormalise(
                (angleLocalCanne - thetaCible) - rodYawBase) * facteur;
        }
    }
    yawAnglerVoulu = Math.max(-CAST_YAW_ANGLER_MAX,
        Math.min(CAST_YAW_ANGLER_MAX, yawAnglerVoulu));
    yawRodVoulu = Math.max(-CAST_YAW_ROD_MAX,
        Math.min(CAST_YAW_ROD_MAX, yawRodVoulu));
    const lissage = Math.min(1, dt * 7);
    castYawAngler += (yawAnglerVoulu - castYawAngler) * lissage;
    castYawRod += (yawRodVoulu - castYawRod) * lissage;
    angler.rotation.y = anglerYawBase + castYawAngler;
    rodPivot.rotation.y = rodYawBase + castYawRod;

    // 2) Geste de canne : armé pendant la charge, fouetté au lâcher, puis repos.
    if (castState === 'charging') {
        castSwing += (CAST_SWING_CHARGE - castSwing) * Math.min(1, dt * 6);
    } else if (floatState === 'flying') {
        if (castT < 0.24) {
            const t = Math.min(1, castT / 0.24);
            const doux = t * t * (3 - 2 * t);
            castSwing = castSwingDepart
                + (CAST_SWING_RELEASE - castSwingDepart) * doux;
        } else {
            const t = Math.min(1, (castT - 0.24) / 0.56);
            castSwing = CAST_SWING_RELEASE * (1 - t) * (1 - t);
        }
    } else {
        castSwing += (0 - castSwing) * Math.min(1, dt * 8);
    }
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

// --- Tutoriel d'accueil (accessible depuis l’écran d’accueil) ----------------------
const TUTORIAL_STEPS = [
    { main: '👆', texte: 'Bienvenue à l’étang du Bois Neuf ! Clique sur l’eau, maintiens pour doser la puissance, puis relâche pour lancer la ligne.' },
    { main: '✊', texte: 'Quand le bouchon mordille puis s’enfonce, clique vite pour ferrer le poisson : un seul essai !' },
    { main: '🔄', texte: 'Tourne la manivelle en cercle pour le ramener. Si la ligne est trop tendue, maintiens « Lâcher du fil ».' },
    { main: '🐟', texte: 'Garde le poisson en main et lance-le dans la bourriche 🧺 (comme l’amorce) pour le ranger dans ton carnet.' }
];
let tutorialStepIndex = 0;
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
}

function closeTutorial() {
    tutorial.classList.remove('open');
}

function nextTutorialStep() {
    if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) {
        closeTutorial();
        if (accueil && accueil.classList.contains('active')) { demarrerJeu(); }
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

const accueilTutoriel = document.getElementById('accueilTutoriel');
if (accueilTutoriel) { accueilTutoriel.addEventListener('click', openTutorial); }

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
reflectionsToggle.disabled = !waterReflectionTarget;
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
techniqueCourante = journal.technique;
appliquerTechniqueVisuelle();
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

// ---------------------------------------------------------------------------
// ATTAQUE DE CARNASSIER pendant la remontée (idee « petits poissons »).
// Quand on ramène une PETITE PROIE (une de ces espèces), un carnassier qui
// passe près de la ligne peut l'attaquer, la remplacer sur l'hameçon et
// repartir avec un avantage (combat plus long, chrono plus court).
// ---------------------------------------------------------------------------
const PROIES_CARNASSIERS = ['gardon', 'rotengle', 'ablette', 'goujon', 'carassin'];
const CARNASSIERS = ['brochet', 'sandre', 'perche', 'black-bass'];
const PREDATOR_ATTACK_RADIUS = 9;        // unités autour du bouchon
const PREDATOR_ATTACK_ADVANTAGE = 1.35;  // > 1 : avantage au carnassier

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
// Ancien paramètre numérique de « type » → nouvelle silhouette (compatibilité).

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

function randomFishPosition() {
    const angle = rand() * Math.PI * 2;
    // Le poisson naît DANS l'eau, à distance du bord local (contour irrégulier).
    const r = rand() * Math.max(1, rayonEtang(angle) - 12);
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

// ---------------------------------------------------------------------------
// SPÉCIMENS HORS NORME : quelques poissons (≈7 %) dépassent les normes de leur
// espèce (taille, poids, combativité, agressivité). On utilise un petit
// générateur LOCAL pour ne PAS décaler le hasard du monde (tests reproductibles).
// ---------------------------------------------------------------------------
let horsNormeChance = 0.07;
let rareRngState = 0x51f15e1d >>> 0;

function rareRand() {
    rareRngState = (rareRngState + 0x6d2b79f5) >>> 0;
    let t = rareRngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function setHorsNormeChance(value) {
    horsNormeChance = Math.max(0, Math.min(1, Number(value) || 0));
    // Le harnais peut fixer un drapeau avant le chargement (monde sans rare).
    if (typeof window !== 'undefined') { window.__PECHE_RARE__ = horsNormeChance; }
}

// Distribution ATTENDUE : chaque espèce reçoit une part proportionnelle à son
// abondance. Sert au carnet/aux tests pour vérifier que l'étang reste équilibré.
function distributionAttendue() {
    let total = 0;
    for (let i = 0; i < SPECIES.length; i++) { total += SPECIES[i].abondance; }
    return SPECIES.map(function (espece) {
        return {
            id: espece.id,
            nom: espece.nom,
            part: total > 0 ? espece.abondance / total : 0
        };
    });
}

function spawnFish() {
    const espece = pickSpecies();
    // Longueur réelle tirée dans la fourchette de l'espèce (cm).
    let longueurCm = espece.cm[0] + rand() * (espece.cm[1] - espece.cm[0]);
    // Spécimen hors norme : la taille peut dépasser le maximum de l'espèce.
    const rareChance = (typeof window !== 'undefined'
        && typeof window.__PECHE_RARE__ === 'number')
        ? window.__PECHE_RARE__ : horsNormeChance;
    const horsNorme = rareRand() < rareChance;
    const facteurRare = horsNorme ? (1.08 + rareRand() * 0.28) : 1;
    if (horsNorme) {
        longueurCm *= facteurRare;
    }
    const forme = FORMES[espece.form] || FORMES.fusiforme;
    // Échelle 3D donnant au poisson sa vraie taille (2 unités ≈ 1 m).
    const size = Math.max(0.08, (longueurCm / 50) / forme.longueurRef);
    let power = espece.combativite[0] + rand() * (espece.combativite[1] - espece.combativite[0]);
    let aggression = espece.agressivite[0] + rand() * (espece.agressivite[1] - espece.agressivite[0]);
    if (horsNorme) {
        power = Math.min(2.7, power * facteurRare);
        aggression = Math.min(2.7, aggression * facteurRare);
    }
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
    fish.userData.horsNorme = horsNorme;
    fish.userData.facteurRare = facteurRare;
    if (horsNorme && fish.userData.bodyMat && fish.userData.bodyMat.emissive) {
        // Un très léger éclat doré distingue le spécimen exceptionnel.
        fish.userData.bodyMat.emissive.setHex(0x3a2a00);
        fish.userData.bodyMat.emissiveIntensity = 0.35;
    }
    // Les poissons vivent cachés sous l'eau : seules leurs bulles et leurs
    // sillages indiquent leur présence (ils ne deviennent visibles qu'au combat).
    fish.visible = false;
    scene.add(fish);
    fishes.push(fish);
    return fish;
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
    // QUIVER : le mouvement du poisson se lit sur le scion, pas sur un bouchon.
    if (techniqueCourante === 'quiver') {
        modeQuiver.appliquer(m);
        return;
    }
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
let nibblePhase = 0;        // avancement du « mordillement » en cours (0 = aucun)
// Mordillements ALÉATOIRES : petits coups, durées et intervalles varient. On
// utilise un générateur LOCAL pour ne PAS consommer le hasard du monde (les
// tests restent reproductibles et le reste du jeu ne change pas).
let nibbleRngState = 0x9e3779b9 >>> 0;
let nibbleSuivant = 0;      // délai avant le prochain mordillement
let nibbleDebut = -1;       // -1 = aucun mordillement en cours
let nibbleDuree = 0;
let nibbleAmplitude = 0;
let nibbleInteretAvant = false;

function nibbleRand() {
    nibbleRngState = (nibbleRngState + 0x6d2b79f5) >>> 0;
    let t = nibbleRngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
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
    castStart.copy(rodTipVisual);
    castSwingDepart = castSwing;
    castTarget.copy(target);
    castTarget.x += Math.cos(wind.dir) * wind.strength * 2.5;
    castTarget.z += Math.sin(wind.dir) * wind.strength * 2.5;
    castTarget.y = 0.1;
    const wdx = castTarget.x - POND_CENTER.x;
    const wdz = castTarget.z - POND_CENTER.z;
    const wd = Math.hypot(wdx, wdz);
    const maxR = rayonEtang(Math.atan2(wdz, wdx)) - 2;
    if (wd > maxR) {
        castTarget.x = POND_CENTER.x + (wdx / wd) * maxR;
        castTarget.z = POND_CENTER.z + (wdz / wd) * maxR;
    }
    castT = 0;
    fishCaught = false;
    ligneTendue = false;
    // Un nouveau lancer = une nouvelle chance : le poisson peut prendre
    // l'esche « à la volée » dès que le bouchon touche l'eau.
    biteCooldown = 0;
    floatState = 'flying';
    fishButton.disabled = true;
    statusDisplay.textContent = 'Lancer… clique pour tendre la ligne avant qu’il touche l’eau !';
    sound.cast();
}

// Clic pendant le vol : on tend la ligne avant que le bouchon ne se pose.
function tendreLigneAuLancer() {
    if (floatState !== 'flying' || ligneTendue) {
        return false;
    }
    ligneTendue = true;
    spawnFloatingText('Ligne tendue !', castTarget, '#7ed957');
    statusDisplay.textContent = 'Ligne tendue ! Le bouchon va se poser…';
    sound.reel();
    return true;
}

// Démarre le mini-jeu de démêlage (appelé quand le lancer n'a pas été tendu).
function demarrerEmmElement() {
    if (partieTerminee) { return; }
    if (hookedFish) {
        hookedFish.userData.hooked = false;
        hookedFish.visible = false;
        hookedFish = null;
    }
    if (biteFish) {
        biteFish.userData.biting = false;
        biteFish.visible = false;
        biteFish = null;
    }
    if (struggle) {
        struggle = null;
        struggleTimeLeft = 0;
        strugglePanel.classList.remove('active');
        setDragLoosened(false);
    }
    if (snag) { snag = null; }
    biteViewActive = false;
    hideBiteView();
    floatState = 'tangle';
    floatGroup.position.copy(castTarget);
    floatGroup.visible = true;
    floatGroup.rotation.z = 0;
    crank.classList.remove('active');
    feedButton.classList.remove('active');
    fishButton.disabled = true;
    if (jeuDemelage) { jeuDemelage.ouvrir(); }
    spawnFloatingText('🧶 Ligne emmêlée !', floatGroup.position, '#ffb347');
    sound.escape();
    statusDisplay.textContent = '🧶 Ligne emmêlée ! Suis le fil du départ à l’arrivée.';
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
        const support = techniqueCourante === 'quiver'
            ? 'la ligne est toujours à l’eau'
            : 'le bouchon est toujours à l’eau';
        statusDisplay.textContent = automatique
            ? 'Aucun poisson en ' + MAX_WAIT + ' s : la ligne a été remontée TOUTE SEULE. Relance (ou amorce pour attirer les poissons !).'
            : 'On remonte la ligne… (' + support + ' : un poisson peut encore mordre !)';
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

function showCatchMessage(weight, espece, record, horsNorme) {
    catchMessage.textContent = (horsNorme ? '✨ HORS NORME — ' : '')
        + (record ? '🏆 RECORD — ' : '')
        + (espece ? espece + ' ! ' : 'Poisson attrapé ! ') + fmtPoids(weight) + ' 🎣';
    catchMessage.classList.toggle('record', !!record);
    catchMessage.classList.toggle('rare', !!horsNorme);
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
function annoncerRecord(weight, espece, ancienRecord, horsNorme) {
    const nom = espece || 'Poisson';
    recordBattu = {
        espece: nom,
        kg: Math.round(weight * 100) / 100,
        ancien: Math.round((ancienRecord || 0) * 100) / 100
    };
    catchMessage.textContent = (horsNorme ? '✨ HORS NORME — ' : '')
        + '🏆 RECORD — ' + nom + ' ! ' + fmtPoids(weight) + ' 🎣';
    catchMessage.classList.add('record', 'show');
    catchMessage.classList.toggle('rare', !!horsNorme);
    spawnFloatingText('🏆 RECORD !', BOURRICHE_POS, '#ffd166');
    if (horsNorme) {
        spawnFloatingText('✨ HORS NORME !', BOURRICHE_POS, '#ffd166');
    }
    statusDisplay.textContent = '🏆 NOUVEAU RECORD de ' + nom + ' : ' + fmtPoids(weight)
        + (horsNorme ? ' — spécimen HORS NORME !' : '')
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
    const maxR = rayonEtang(Math.atan2(dz, dx)) - 3;
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

// Cherche un carnassier libre assez proche du bouchon pendant la remontée.
function attaquePredateurProche(proie) {
    if (!proie || !proie.userData) {
        return null;
    }
    if (PROIES_CARNASSIERS.indexOf(proie.userData.especeId) < 0) {
        return null;
    }
    const px = floatGroup.position.x;
    const pz = floatGroup.position.z;
    let meilleur = null;
    let meilleureDistance = PREDATOR_ATTACK_RADIUS;
    fishes.forEach(function (fish) {
        if (fish === proie || fish === heldFish) {
            return;
        }
        const data = fish.userData;
        if (!data || data.hooked || data.biting) {
            return;
        }
        if (CARNASSIERS.indexOf(data.especeId) < 0) {
            return;
        }
        const d = Math.hypot(fish.position.x - px, fish.position.z - pz);
        if (d < meilleureDistance) {
            meilleureDistance = d;
            meilleur = fish;
        }
    });
    return meilleur;
}

// Un carnassier croise la ligne : il attaque, la petite proie s'échappe, et
// c'est LUI qu'on ramène désormais — avec un avantage au poisson.
function tenterAttaquePredateur() {
    if (!hookedFish) {
        return false;
    }
    const predateur = attaquePredateurProche(hookedFish);
    if (!predateur) {
        return false;
    }
    const proie = hookedFish;
    const proieNom = proie.userData.espece || 'poisson';
    const predNom = predateur.userData.espece || 'carnassier';
    const predNomMin = predNom.charAt(0).toLowerCase() + predNom.slice(1);
    const proieNomMin = proieNom.charAt(0).toLowerCase() + proieNom.slice(1);
    // 1) La petite proie est libérée et détale.
    proie.userData.hooked = false;
    proie.userData.biting = false;
    proie.userData.targeting = false;
    proie.visible = true;
    const fuiteX = proie.position.x - predateur.position.x;
    const fuiteZ = proie.position.z - predateur.position.z;
    const fuite = Math.hypot(fuiteX, fuiteZ) || 1;
    proie.userData.vx = (fuiteX / fuite) * 3;
    proie.userData.vz = (fuiteZ / fuite) * 3;
    // 2) Le carnassier prend sa place sur la ligne.
    predateur.userData.biting = false;
    predateur.userData.targeting = false;
    predateur.visible = true;
    predateur.position.set(
        floatGroup.position.x + 0.6,
        -1.2,
        floatGroup.position.z + 0.2
    );
    predateur.rotation.y = Math.atan2(
        floatGroup.position.x - predateur.position.x,
        floatGroup.position.z - predateur.position.z
    );
    // 3) Nouveau combat, plus difficile : avantage au carnassier.
    startStruggle(predateur, PREDATOR_ATTACK_ADVANTAGE);
    statusDisplay.textContent = '🐟 Un ' + predNomMin + ' a attaqué ta ligne et remplacé le '
        + proieNomMin + ' ! Combat plus difficile (avantage au poisson).';
    // POPUP 3D au bouchon : indispensable pour que le joueur comprenne
    // immédiatement pourquoi le combat vient de changer de poisson.
    spawnFloatingText('🐟 ' + predNom + ' attaque !', floatGroup.position, '#ff6b57');
    spawnSplash(floatGroup.position);
    spawnRipple(floatGroup.position);
    spawnRipple(floatGroup.position);
    sound.splash();
    shake = 0.18;
    return true;
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
    // repérer que quelque chose se passe autour du bouchon / du scion.
    const nomMouvement = techniqueCourante === 'quiver' ? 'scion' : 'bouchon';
    spawnFloatingText('Un poisson s’approche…',
        techniqueCourante === 'quiver' ? rodTipVisual : floatGroup.position, '#dff1ff');
    floatState = 'bite';
    statusDisplay.textContent = 'Un poisson s’approche du ' + nomMouvement + '… surveille-le !';
}

function hideBiteView() {
    biteViewActive = false;
    cameraMode = 'normal';
    setFloatOpacity(1);
    floatGroup.rotation.z = 0;
    modeQuiver.reset();
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
                // AUCUN texte ici : le joueur doit lire le mouvement du bouchon.
                // Le seul message d'approche autorisé est « Un poisson s'approche… »
                // (affiché au début de la touche, dans showBiteView).
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
        snag.clics += 1;
        // LA VASE EST TENACE : un clic n'est efficace qu'après un temps de
        // récupération (la ligne doit se détendre). Les nénuphars, eux, n'ont
        // pas de temps de récupération (clickCooldown = 0).
        const pret = snag.clickCooldown <= 0
            || (snag.elapsed - snag.lastClick) >= snag.clickCooldown;
        if (pret) {
            tension = Math.max(0, tension - snag.clickPower);
            snag.lastClick = snag.elapsed;
            snag.clicsUtiles += 1;
        }
        shake = 0.06;
        sound.reel();
        updateStruggleBar();
        majIndiceSnag();
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
    const dansLaVase = mode === 'fond';
    tension = dansLaVase ? 0.55 : 0.5;
    // Deux accrochages, deux difficultés :
    //  - NÉNUPHARS : on clique vite, c'est facile (clickCooldown = 0).
    //  - VASE : elle ASPIRE. Un clic n'est utile que toutes les 0,32 s ; il faut
    //    tenir un rythme (~3 clics/s) pendant plusieurs secondes, sinon la
    //    tension monte et la ligne casse.
    snag = dansLaVase ? {
        dansLaVase: true,
        pullRate: 0.10,
        burstStrength: 0.10,
        burstInterval: 0.9,
        burstTimer: 0.9,
        clickPower: 0.10,
        clickCooldown: 0.32,
        elapsed: 0,
        lastClick: -1,
        clics: 0,
        clicsUtiles: 0
    } : {
        dansLaVase: false,
        pullRate: 0.12,
        burstStrength: 0.10,
        burstInterval: 1.1,
        burstTimer: 1.1,
        clickPower: 0.10,
        clickCooldown: 0,
        elapsed: 0,
        lastClick: -1,
        clics: 0,
        clicsUtiles: 0
    };
    snagIndicePret = null;
    strugglePanel.classList.add('active');
    sound.snag();
    struggleInfo.textContent = dansLaVase ? 'Hameçon accroché dans la vase' : 'Ligne accrochée aux nénuphars';
    struggleTimer.textContent = '';
    struggleTimer.classList.remove('urgent');
    struggleHint.textContent = dansLaVase
        ? 'La vase aspire : clique en rythme (environ 3 fois par seconde) !'
        : 'Clique vite pour dégager la ligne !';
    majIndiceSnag();
    updateStruggleBar();
    fishButton.disabled = false;
    fishButton.textContent = 'Dégager !';
    statusDisplay.textContent = dansLaVase
        ? 'Ton hameçon s’est enfoncé dans la vase ! Tire en rythme (≈ 3 clics/s) pour le dégager, puis règle une ligne moins profonde.'
        : 'La ligne s’est accrochée aux nénuphars ! Clique pour la dégager.';
}

// Indique au joueur s'il peut cliquer (vase) ou s'il doit laisser le fil se
// détendre. N'affiche rien pour les nénuphars (pas de temps de récupération).
let snagIndicePret = null;
function majIndiceSnag() {
    if (!snag || !snag.dansLaVase) {
        return;
    }
    const pret = (snag.elapsed - snag.lastClick) >= snag.clickCooldown;
    if (pret === snagIndicePret) {
        return;
    }
    snagIndicePret = pret;
    struggleHint.textContent = pret
        ? 'La vase aspire : clique en rythme (environ 3 fois par seconde) !'
        : 'Trop tôt : laisse le fil se détendre…';
    if (fishButton.classList) {
        fishButton.classList.toggle('cooldown', !pret);
    }
}

function endSnag(freed) {
    strugglePanel.classList.remove('active');
    fishButton.textContent = 'Lancer la canne';
    if (fishButton.classList) {
        fishButton.classList.remove('cooldown');
    }
    snag = null;
    snagIndicePret = null;
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
    snag.elapsed += dt;
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
    majIndiceSnag();
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

// Le mouvement augmente vers la queue et se propage avec un déphasage le
// long du corps. La caudale suit la même translation que son point d'attache.
function animateFishMesh(data, phase, amplitude) {
    const positions = data.bodyMesh.geometry.getAttribute('position');
    const rest = data.swimRest;
    for (let i = 0; i < positions.count; i++) {
        const x = rest[i * 3];
        const rear = Math.max(0, -x / 0.6);
        positions.setZ(i, rest[i * 3 + 2] + Math.sin(phase - rear) * amplitude * rear ** 2);
    }
    positions.needsUpdate = true;
    data.bodyMesh.geometry.computeVertexNormals();
    data.tailPivot.position.z = Math.sin(phase - 0.98) * amplitude * data.bodyMesh.scale.z;
    data.tailPivot.rotation.y = Math.sin(phase - 1.45) * amplitude * 3.2;
}

function updateFish(dt, time) {
    baitInterest = false;
    fishes.forEach(fish => {
        const data = fish.userData;
        if (fish === heldFish) {
            animateFishMesh(data, time * 15 + data.phase, 0.08);
            return; // le poisson en main est posé par le joueur
        }
        data.details.visible = fish.position.distanceToSquared(camera.position) < 1089;
        if (data.biting) {
            fish.position.x = floatGroup.position.x + Math.sin(time * 20) * 0.12;
            fish.position.z = floatGroup.position.z + Math.cos(time * 18) * 0.12;
            fish.position.y = HOOK_DEPTH - data.topOffset + Math.sin(time * 20) * 0.05;
            fish.rotation.y = Math.sin(time * 18) * 0.4;
            if (fish.visible) { animateFishMesh(data, time * 22, 0.18); }
            return;
        }
        if (data.hooked) {
            if (floatState === 'reeling') {
                fish.visible = true;   // combat gagné : le poisson est bien visible
                animateFishMesh(data, time * 12 + data.phase, 0.11);
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
            if (fish.visible) { animateFishMesh(data, time * 25, 0.23); }
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
        // peut être posé tout près de la rive. La limite suit le bord LOCAL.
        const rayonLocal = rayonEtang(Math.atan2(dz, dx));
        const limit = data.targeting ? rayonLocal - 0.5 : rayonLocal - 5;
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
        // position.y = profondeur du dos − hauteur du poisson : il reste sous l'eau,
        // seuls les gros poissons montrent leur dorsale près de la surface.
        // Le poisson reste toujours au-dessus du relief (le fond est un bassin).
        const yBas = fondY(fish.position.x, fish.position.z) + 0.3;
        fish.position.y = Math.max(yBas,
            data.depth - data.topOffset + Math.sin(time * 2 + data.phase) * 0.12);
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
            } else if (!ligneTendue && tangleChance > 0 && rand() < tangleChance) {
                // La ligne n'a pas été tendue : elle s'est emmêlée en touchant
                // l'eau. Pas de pêche tant que le mini-jeu n'est pas résolu.
                demarrerEmmElement();
                return;
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
        // Un poisson qui renifle l'appât fait « mordiller » le bouchon de temps
        // en temps. Les ondulations sont ALÉATOIRES (intervalles, durée et
        // amplitude varient) : impossible de chronométrer le clic. On utilise un
        // petit générateur LOCAL pour ne pas décaler le hasard du monde.
        if (baitInterest) {
            if (!nibbleInteretAvant) {
                // Nouvelle approche : nouvelle séquence, dérivée de l'instant.
                nibbleRngState = ((Math.floor(time * 1000) ^ 0x9e3779b9) >>> 0) || 1;
                nibbleSuivant = 0.2 + nibbleRand() * 0.9;
                nibbleDebut = -1;
                nibblePhase = 0;
            }
            nibbleInteretAvant = true;
            if (nibbleDebut < 0) {
                nibbleSuivant -= dt;
                if (nibbleSuivant <= 0) {
                    nibbleDebut = time;
                    nibbleDuree = 0.2 + nibbleRand() * 0.55;
                    nibbleAmplitude = 0.03 + nibbleRand() * 0.06;
                    spawnRipple(floatGroup.position);
                }
            } else {
                const avancement = (time - nibbleDebut) / nibbleDuree;
                if (avancement >= 1) {
                    nibbleDebut = -1;
                    nibblePhase = 0;
                    // Parfois un deuxième rond juste après le mordillement.
                    if (nibbleRand() < 0.3) {
                        spawnRipple(floatGroup.position);
                    }
                    // Intervalle ALÉATOIRE avant le prochain mordillement.
                    nibbleSuivant = nibbleRand() < 0.25
                        ? 0.12 + nibbleRand() * 0.35   // parfois deux coups rapprochés
                        : 0.6 + nibbleRand() * 2.4;    // sinon 0,6 à 3,0 s
                } else {
                    nibblePhase = Math.sin(Math.PI * avancement);
                    floatGroup.position.y -= nibbleAmplitude * nibblePhase;
                }
            }
        } else {
            nibbleInteretAvant = false;
            nibbleDebut = -1;
            nibbleSuivant = 0;
            nibblePhase = 0;
        }
        // Un poisson qui renifle l'esche fait patienter plus longtemps.
        if (baitInterest) {
            waitTimer = Math.min(waitTimer, MAX_WAIT - 6);
        }
        waitTimer += dt;
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
        // Un carnassier peut intercepter la petite proie qu'on ramène.
        if (hookedFish && tenterAttaquePredateur()) {
            return;
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
    if (cameraViewActive) {
        if (event.pointerType === 'touch' && cameraTouches.size < 2) {
            cameraTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
            canvas.setPointerCapture?.(event.pointerId);
            updateCameraGesture();
        }
        return;
    }
    if (toolDock.classList.contains('ouvert') || paused) {
        if (!paused) { fermerOutils(); }
        return;
    }
    if (event.button !== 0) {
        return;
    }
    ensureSound();
    // Lancer en vol : un clic tend la ligne AVANT que le bouchon touche l'eau.
    if (floatState === 'flying') {
        tendreLigneAuLancer();
        return;
    }
    // RAGONDIN : un clic SUR LUI le chasse (et ne ferre jamais un poisson).
    if (ragondin && clicSurRagondin(event)) {
        hitRagondin();
        return;
    }
    // Poisson en main : on dose la puissance du lancer vers la bourriche.
    if (floatState === 'holding') {
        startFishThrow();
        return;
    }
    // Mode amorçage : un appui sur l'eau commence à charger la puissance.
    if (feedMode && (floatState === 'idle' || floatState === 'inWater') && castState === 'idle') {
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

canvas.addEventListener('pointermove', event => {
    if (cameraTouches.has(event.pointerId)) {
        cameraTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        updateCameraGesture();
    }
});

function endCameraTouch(event) {
    if (cameraTouches.delete(event.pointerId)) { updateCameraGesture(); }
}
canvas.addEventListener('lostpointercapture', endCameraTouch);

// Relâcher = on dose la puissance et la boule part.
canvas.addEventListener('pointerup', event => {
    if (cameraViewActive) {
        endCameraTouch(event);
        return;
    }
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
    if (cameraViewActive) {
        endCameraTouch(event);
        return;
    }
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
    fermerOutils();
});

// Les commandes restent visibles même quand la ligne est occupée.
function clickDepth(delta) {
    if (paused || cameraViewActive || castState !== 'idle'
            || (floatState !== 'idle' && floatState !== 'inWater')) { return; }
    ensureSound();
    setProfondeur(profondeurLigne + delta);
}
depthMinus.addEventListener('click', () => clickDepth(-0.5));
depthPlus.addEventListener('click', () => clickDepth(0.5));
majEtiquetteProfondeur();
// Le jeu est initialisé : la coupe de l'eau (schéma) peut se dessiner.
coupePrete = true;
majCoupeProfondeur();
waterUniforms.uNormalsOn.value = waterUniforms.uNormals.value ? 1 : 0;

fishButton.addEventListener('click', () => {
    if (paused || cameraViewActive || toolDock.classList.contains('ouvert')) { return; }
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
    if (event.key === 'Escape') {
        if (cameraViewActive) { setCameraView(false); toolToggle.focus?.(); }
        else if (!paused) { fermerOutils(); }
        return;
    }
    if (cameraViewActive || paused || toolDock.classList.contains('ouvert')
            || event.target?.closest?.('button, input, select, textarea')) { return; }
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

// LE RAGONDIN VOLEUR — aléa rare : il sort de l'eau près de la bourriche pour
// voler un poisson. 3 clics SUR LUI le font fuir ; ses clics passent AVANT le
// ferrage, donc impossible de ferrer en le chassant.
const RAGONDIN_CLICS = 3;
let ragondin = null;
let ragondinTimer = 80 + rand() * 70;
let ragondinHits = 0;
let ragondinVolTimer = 0;   // secondes restantes avant le vol

function makeRagondin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.9 });
    const corps = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat);
    corps.scale.set(1.9, 0.95, 0.9);
    corps.position.y = 0.2;
    group.add(corps);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat);
    tete.position.set(0.44, 0.24, 0);
    group.add(tete);
    [-1, 1].forEach(function (cote) {
        const oreille = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat);
        oreille.position.set(0.37, 0.35, cote * 0.09);
        group.add(oreille);
    });
    const queue = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.5, 6), mat);
    queue.rotation.z = Math.PI / 2.4;
    queue.position.set(-0.55, 0.24, 0);
    group.add(queue);
    return group;
}

function spawnRagondin() {
    if (ragondin || partieTerminee) { return null; }
    const modele = makeRagondin();
    modele.position.set(BOURRICHE_POS.x + 4, 0, BOURRICHE_POS.z - 2);
    modele.rotation.y = Math.PI;
    scene.add(modele);
    ragondinHits = 0;
    ragondinVolTimer = 12;     // 12 s pour le chasser
    ragondin = modele;
    statusDisplay.textContent = '🐀 Un RAGONDIN rôde près de ta bourriche ! Clique 3 fois sur lui pour le chasser (sinon il vole un poisson).';
    return modele;
}

function volerUnPoissonRagondin() {
    if (!ragondin) { return false; }
    if (score > 0) {
        score -= 1;
        scoreDisplay.textContent = score;
    }
    spawnFloatingText('🐀 Il a volé un poisson !', BOURRICHE_POS, '#ff6b57');
    statusDisplay.textContent = '🐀 Trop tard : le ragondin a volé un poisson et s’est échappé !';
    sound.escape();
    effrayerRagondin();
    return true;
}

function effrayerRagondin() {
    if (!ragondin) { return; }
    scene.remove(ragondin);
    ragondin = null;
    ragondinHits = 0;
    ragondinTimer = 160 + rand() * 140;
}

function hitRagondin() {
    if (!ragondin) { return false; }
    ragondinHits += 1;
    sound.splash();
    ragondin.position.x += 1.2;
    if (ragondinHits >= RAGONDIN_CLICS) {
        spawnFloatingText('🐀 Il s’enfuit !', ragondin.position, '#ffd166');
        effrayerRagondin();
        statusDisplay.textContent = '🐀 Le ragondin a fui ! Tes poissons sont saufs.';
        return true;
    }
    spawnFloatingText('🐀 Il détale !', ragondin.position, '#ffd166');
    statusDisplay.textContent = '🐀 Touché ! Encore ' + (RAGONDIN_CLICS - ragondinHits) + ' clic(s) pour le chasser.';
    return false;
}

function clicSurRagondin(event) {
    if (!ragondin) { return false; }
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    return raycaster.intersectObject(ragondin, true).length > 0;
}

function updateRagondin(dt) {
    if (!ragondin) {
        ragondinTimer -= dt;
        if (ragondinTimer <= 0) {
            ragondinTimer = 160 + rand() * 140;
            if (score > 0 && floatState !== 'struggle' && floatState !== 'bite') { spawnRagondin(); }
        }
        return;
    }
    const dx = BOURRICHE_POS.x - ragondin.position.x;
    const dz = BOURRICHE_POS.z - ragondin.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.7) {
        ragondin.position.x += (dx / d) * 1.1 * dt;
        ragondin.position.z += (dz / d) * 1.1 * dt;
        ragondin.rotation.y = Math.atan2(-dz, dx);
    }
    ragondin.position.y = Math.abs(Math.sin(elapsed * 6)) * 0.04;
    ragondinVolTimer -= dt;
    if (ragondinVolTimer <= 0) {
        volerUnPoissonRagondin();
        return;
    }
    if (false) {
        if (score > 0) { score -= 1; scoreDisplay.textContent = score; }
        spawnFloatingText('🐀 Il a volé un poisson !', BOURRICHE_POS, '#ff6b57');
        statusDisplay.textContent = '🐀 Trop tard : le ragondin a volé un poisson et s’est échappé !';
        sound.escape();
        effrayerRagondin();
    }
}

// ---------------------------------------------------------------------------
// Mini-jeu de démêlage : module autonome (demelage.js).
// Créé avant la boucle de rendu ; les callbacks utilisent les fonctions du jeu.
// ---------------------------------------------------------------------------
jeuDemelage = creerJeuDemelage({
    canvas: tangleCanvas,
    conteneur: tangleGame,
    timerEl: tangleTimer,
    progressEl: tangleProgress,
    messageEl: tangleMessage,
    duree: 14,
    onReussi: function () {
        floatState = 'inWater';
        waitTimer = 0;
        depuisLancement = 0;
        biteCooldown = 0.5;
        fishButton.disabled = true;
        spawnFloatingText('✅ Démêlée !', floatGroup.position, '#7ed957');
        statusDisplay.textContent = '✅ Ligne démêlée ! Ramène-la ou attends une touche.';
        sound.reel();
        updateCrankVisibility();
    },
    onPerdu: function (raison) {
        casserLigne('Ligne emmêlée non réparée : ' + raison);
    },
    onStatus: function (texte) {
        statusDisplay.textContent = texte;
    },
    onTexte: function (texte, couleur) {
        spawnFloatingText(texte, floatGroup.position, couleur);
    },
    onSon: function (nom) {
        if (sound && typeof sound[nom] === 'function') { sound[nom](); }
    }
});
if (tangleGiveUp) {
    tangleGiveUp.addEventListener('click', function () {
        if (jeuDemelage) { jeuDemelage.abandonner(); }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused && !cameraViewActive) {
        elapsed += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateWater(elapsed);
        updateFish(dt, elapsed);
        updateSonar(dt, elapsed);
        updateFloat(dt, elapsed);
        // La coupe de l'eau suit le bouchon (5 fois par seconde suffit).
        if (elapsed - dernierCoupe > 0.2) {
            dernierCoupe = elapsed;
            majCoupeProfondeur();
        }
        updateFeed(dt);
        updateChum(dt);
        updateRagondin(dt);
        updateCastAnimation(dt);
        updateArm(dt);
        updateRod(dt);
        updateQuiver(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, elapsed);
        updateWaterReflection();
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
        updateRipples(dt);
        updateMissRings(dt);
        updateFloatingTexts(dt);
        if (jeuDemelage) { jeuDemelage.update(dt); }
        updateLine();
    }
    updateCrankVisibility();
    updateCameraPosition(dt);
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
const VITESSE_MANIVELLE_MAX = 4.0;     // tours/s EN MOYENNE sur 0,6 s (il faut enchaîner)
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
    if (jeuDemelage && jeuDemelage.estActif()) { jeuDemelage.fermer(); }
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
    // POPUP 3D près du bouchon, comme « FERRÉ ! » ou « Trop tôt ! » : le joueur
    // voit l'avertissement sans quitter l'eau des yeux.
    spawnFloatingText('⚠️ Trop vite !', floatGroup.position, '#ffb347');
    if (avertissementsVitesse <= 3) {
        statusDisplay.textContent = '⚠️ Tu remontes trop vite ! La ligne souffre ('
            + avertissementsVitesse + ' avertissement' + (avertissementsVitesse > 1 ? 's' : '') + ').';
    }
    if (rand() < Math.min(0.10, 0.015 * avertissementsVitesse)) {
        casserLigne('Tu as remonté trop vite');
    }
}

// Classement local délégué au module classement.js.
const classementApi = creerClassement({
    store: journalStore,
    rankingKey: RANKING_KEY,
    nomKey: NOM_KEY,
    getPartieStats: function () { return partieStats; },
    fmtPoids: fmtPoids,
    rankingList: rankingList,
    rankingTabs: rankingTabs
});

function chargerClassement() {
    return classementApi.charger();
}

function sauverClassement(liste) {
    classementApi.sauver(liste);
}

function enregistrerClassement(nom) {
    return classementApi.enregistrer(nom);
}

function renderClassement(onglet) {
    ongletClassement = onglet || 'poissons';
    classementApi.render(ongletClassement);
}

function ouvrirClassement() {
    if (!classement) { return; }
    fermerOutils();
    renderClassement(ongletClassement);
    classement.classList.add('active');
    majModalBackdrop();
}

function fermerClassement() {
    if (classement) { classement.classList.remove('active'); }
    majModalBackdrop();
}

// Fin de partie : plus aucune ligne, ou fin volontaire par le joueur.
// `raison` vaut 'lignes' (défaut) ou 'manuelle'.
function terminerPartie(raison) {
    if (partieTerminee) { return; }
    rangerSonar();
    setCameraView(false);
    if (jeuDemelage && jeuDemelage.estActif()) { jeuDemelage.fermer(); }
    const manuelle = raison === 'manuelle';
    partieTerminee = true;
    // On coupe proprement une ligne en cours : aucun poisson ne doit rester
    // accroché derrière le panneau de fin de partie.
    if (hookedFish) {
        hookedFish.userData.hooked = false;
        hookedFish.visible = false;
        hookedFish = null;
    }
    if (biteFish) {
        biteFish.userData.biting = false;
        biteFish.visible = false;
        biteFish = null;
    }
    biteViewActive = false;
    hideBiteView();
    struggle = null;
    struggleTimeLeft = 0;
    snag = null;
    setDragLoosened(false);
    castState = 'idle';
    feedGauge.classList.remove('active');
    if (feedState === 'charging') { cancelFeed(); }
    floatState = 'idle';
    floatGroup.visible = true;
    floatGroup.position.copy(floatIdle);
    floatGroup.rotation.z = 0;
    crank.classList.remove('active');
    feedButton.classList.remove('active');
    fishButton.disabled = true;
    fermerOutils();
    if (!gameOver) { majModalBackdrop(); return; }
    if (gameOverTitle) {
        gameOverTitle.textContent = manuelle ? '🏁 Partie terminée' : '💥 Plus de lignes !';
    }
    if (gameOverText) {
        gameOverText.textContent = manuelle
            ? 'Tu as choisi de terminer la partie. Voici ton bilan :'
            : 'Tu as cassé tes 5 lignes. Voici ta partie :';
    }
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
    majModalBackdrop();
}

// Le fond assombri n'est affiché que si une modale est réellement ouverte.
function majModalBackdrop() {
    if (!modalBackdrop) { return; }
    const bloque = !!(
        (accueil && accueil.classList.contains('active'))
        || (gameOver && gameOver.classList.contains('active'))
        || (classement && classement.classList.contains('active'))
    );
    modalBackdrop.classList.toggle('active', bloque);
}

function revenirAccueil() {
    rangerSonar();
    if (gameOver) { gameOver.classList.remove('active'); }
    if (classement) { classement.classList.remove('active'); }
    if (accueil) { accueil.classList.add('active'); }
    majModalBackdrop();
}

// Remet la PARTIE à zéro : score, bourriche de la partie, lignes, statistiques
// et état de pêche. Le carnet (`journal`), l'XP, les bouchons achetés et le
// classement sont PERSISTANTS : on ne les efface pas ici.
function reinitialiserPartie() {
    rangerSonar();
    // --- État de pêche / animations ---
    if (jeuDemelage && jeuDemelage.estActif()) { jeuDemelage.fermer(); }
    ligneTendue = false;
    if (castState === 'charging') { cancelCast(); }
    if (feedState === 'charging') { cancelFeed(); }
    if (hookedFish) { hookedFish.userData.hooked = false; }
    if (biteFish) { biteFish.userData.biting = false; }
    // Poisson en main : on le remet à l'eau (et dans le tableau s'il en sortait).
    if (heldFish) {
        const poisson = heldFish;
        heldFish = null;
        poisson.scale.setScalar(poisson.userData.size);
        poisson.rotation.set(0, 0, 0);
        poisson.position.copy(randomFishPosition());
        poisson.visible = true;
        poisson.userData.vx = 0;
        poisson.userData.vz = 0;
        if (fishes.indexOf(poisson) < 0) { fishes.push(poisson); }
    }
    fishes.forEach(function (poisson) {
        poisson.userData.hooked = false;
        poisson.userData.biting = false;
        poisson.userData.targeting = false;
        poisson.visible = true;
        poisson.scale.setScalar(poisson.userData.size);
        poisson.rotation.set(0, 0, 0);
        poisson.userData.vx = 0;
        poisson.userData.vz = 0;
    });
    hookedFish = null;
    biteFish = null;
    biteViewActive = false;
    hideBiteView();
    struggle = null;
    snag = null;
    strugglePanel.classList.remove('active');
    setDragLoosened(false);
    tension = 0;
    hameconDansLaVase = false;
    snagFreed = false;
    lineBrokenTimer = 0;
    fishCaught = false;
    escaped = false;
    timeoutEscape = false;
    caughtWeight = 0;
    recordBattu = null;
    waitTimer = 0;
    depuisLancement = 0;
    biteCooldown = 0;
    biteSignauxRestants = 1;
    baitInterest = false;
    nibbleInteretAvant = false;
    nibbleDebut = -1;
    nibbleSuivant = 0;
    nibblePhase = 0;

    // --- Bouchon, canne et bras au repos ---
    floatState = 'idle';
    floatGroup.visible = true;
    floatGroup.position.copy(floatIdle);
    floatGroup.rotation.z = 0;
    setFloatOpacity(1);
    castState = 'idle';
    setCastPower(0);
    castTargetPower = 0;
    castPhase = 0;
    castT = 0;
    castTarget.copy(castAim);
    castSwing = 0;
    castSwingDepart = 0;
    castYawAngler = 0;
    castYawRod = 0;
    rodBend = 0;
    rodGroup.rotation.x = 0;
    rodTipVisual.copy(rodTip);
    angler.rotation.y = anglerYawBase;
    rodPivot.rotation.y = rodYawBase;
    feedGauge.classList.remove('active');
    feedState = 'idle';
    setFeedMode(false);
    feedBall.visible = false;
    feedPower = 0;
    feedTargetPower = 0;
    feedFlyT = 0;
    fishThrowState = 'idle';
    fishThrowPower = 0;
    fishThrowTarget = 0;
    fishThrowPhase = 0;
    fishThrowT = 0;

    // --- Effets visuels de la partie précédente ---
    floatingTexts.forEach(function (item) {
        scene.remove(item.sprite);
        if (item.sprite.material.map) { item.sprite.material.map.dispose(); }
        item.sprite.material.dispose();
    });
    floatingTexts.length = 0;
    missRings.forEach(function (item) {
        scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
    });
    missRings.length = 0;
    ripples.forEach(function (item) {
        scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
    });
    ripples.length = 0;
    if (chum) { scene.remove(chum.group); chum = null; }
    if (ragondin) { effrayerRagondin(); }
    ragondinHits = 0;
    ragondinVolTimer = 0;
    ragondinTimer = Math.max(ragondinTimer, 120);

    // --- Compteurs de la PARTIE (le carnet/XP persistants ne bougent pas) ---
    score = 0;
    scoreDisplay.textContent = score;
    bourricheCount = 0;
    lignesRestantes = MAX_LIGNES;
    avertissementsVitesse = 0;
    derniereAlerteVitesse = -10000;
    partieTerminee = false;
    partieStats = { poissons: 0, poids: 0, records: {} };
    experiencePartie = 0;
    crankRotationDelta = 0;

    // --- Interface ---
    if (gameOver) { gameOver.classList.remove('active'); }
    if (classement) { classement.classList.remove('active'); }
    feedButton.classList.remove('active');
    crank.classList.remove('active');
    fishButton.disabled = false;
    fishButton.textContent = 'Lancer la canne';
    fishButton.classList.remove('cooldown');
    paused = false;
    setCameraView(false);
    resetCameraView();
    pauseButton.textContent = '⏸ Pause';
    fermerOutils();
    majLignes();
    renderJournal();      // bourriche de la partie + XP persistant
    majCoupeProfondeur();
    updateToolDock();
    updateCrankVisibility();
    updateLine();
    majModalBackdrop();
}

function recommencerPartie() {
    reinitialiserPartie();
    if (gameOver) { gameOver.classList.remove('active'); }
    fermerClassement();
    majModalBackdrop();
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
if (saveAndMenu) {
    saveAndMenu.addEventListener('click', function () {
        enregistrerClassement(playerName ? playerName.value : '');
        revenirAccueil();
    });
}
if (backToMenu) { backToMenu.addEventListener('click', revenirAccueil); }
if (endGameButton) {
    endGameButton.addEventListener('click', function () {
        if (partieTerminee) { return; }
        if (accueil && accueil.classList.contains('active')) { return; }
        terminerPartie('manuelle');
    });
}
if (rankingTabs) {
    rankingTabs.addEventListener('click', function (event) {
        const cible = event.target && event.target.dataset ? event.target.dataset.rank : '';
        if (cible) { renderClassement(cible); }
    });
}

majLignes();

// ÉCRAN D'ACCUEIL : on propose de JOUER ou de consulter le CLASSEMENT local.
function demarrerJeu() {
    // JOUER = une PARTIE NEUVE : score, bourriche, lignes, statistiques et état
    // de pêche repartent de zéro (le carnet, l'XP carrière et le classement restent).
    recommencerPartie();
    if (accueil) { accueil.classList.remove('active'); }
    majModalBackdrop();
    ensureSound();
    statusDisplay.textContent = 'Bonne pêche ! Clique sur l’eau, maintiens pour doser la puissance, puis relâche.';
}
function afficherAccueil() {
    if (classement) { classement.classList.remove('active'); }
    if (gameOver) { gameOver.classList.remove('active'); }
    if (accueil) { accueil.classList.add('active'); }
    majModalBackdrop();
}
if (playButton) { playButton.addEventListener('click', demarrerJeu); }
if (accueilClassement) { accueilClassement.addEventListener('click', ouvrirClassement); }
if (techniqueSelect) {
    techniqueSelect.addEventListener('change', function () {
        setTechnique(this.value);
    });
}

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
    // Poisson actuellement sur l'hameçon (proie ou carnassier) — pour les tests.
    getHookedFish: function () { return hookedFish; },
    getHookedEspece: function () {
        return hookedFish ? (hookedFish.userData.especeId || '') : '';
    },
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
    terminerPartie: terminerPartie,
    revenirAccueil: revenirAccueil,
    isModalBackdropVisible: function () {
        return !!modalBackdrop && modalBackdrop.classList.contains('active');
    },
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
    spawnFish: spawnFish,
    setHorsNormeChance: setHorsNormeChance,
    getHorsNormeChance: function () { return horsNormeChance; },
    getHorsNormeCount: function () {
        return fishes.filter(function (f) { return !!f.userData.horsNorme; }).length;
    },
    getDistributionAttendue: distributionAttendue,
    spawnRagondin: spawnRagondin,
    hitRagondin: hitRagondin,
    effrayerRagondin: effrayerRagondin,
    isRagondinActive: function () { return !!ragondin; },
    getRagondin: function () {
        return ragondin ? { x: ragondin.position.x, z: ragondin.position.z, hits: ragondinHits } : null;
    },
    getRagondinTimer: function () { return ragondinTimer; },
    setRagondinTimer: function (v) { ragondinTimer = v; },
    setRagondinVolDans: function (sec) { if (ragondin) { ragondinVolTimer = sec; } },
    volerUnPoissonRagondin: volerUnPoissonRagondin,
    getScore: function () { return score; },
    getBourricheCount: function () { return bourricheCount; },
    demarrerJeu: demarrerJeu,
    afficherAccueil: afficherAccueil,
    setTechnique: setTechnique,
    getTechnique: function () { return techniqueCourante; },
    isQuiver: function () { return techniqueCourante === 'quiver'; },
    getQuiverMotion: function () {
        return modeQuiver.getMotion();
    },
    getRodPose: function () {
        return { x: rodGroup.rotation.x, y: rodPivot.rotation.y };
    },
    isQuiverPanelVisible: function () {
        return modeQuiver.isPanneauVisible();
    },
    isAccueilVisible: function () { return !!accueil && accueil.classList.contains('active'); },
    // Emplacements autour de l'étang (idee 1) — exposés pour les tests.
    getPoste: function () {
        const poste = POSTES[posteActuel];
        return {
            index: posteActuel,
            id: emplacementLibre ? 'libre' : poste.id,
            nom: emplacementLibre ? azimutPosteTexte(emplacementAngle) : poste.nom,
            delta: poste.delta,
            libre: emplacementLibre,
            angle: emplacementAngle,
            marge: emplacementMarge
        };
    },
    getPostes: function () {
        return POSTES.map(function (poste) {
            return { id: poste.id, nom: poste.nom, delta: poste.delta };
        });
    },
    // Choix libre (carte vue de dessus) : angle + distance à la berge.
    getEmplacement: function () {
        const dx = angler.position.x - POND_CENTER.x;
        const dz = angler.position.z - POND_CENTER.z;
        const distance = Math.hypot(dx, dz);
        return {
            angle: emplacementAngle,
            marge: emplacementMarge,
            distance: distance,
            rayonLocal: rayonEtang(emplacementAngle),
            x: angler.position.x,
            z: angler.position.z,
            direction: azimutPosteTexte(emplacementAngle),
            libre: emplacementLibre
        };
    },
    getPlacementMap: function () {
        return {
            troisD: true,
            taille: CARTE_3D_TAILLE,
            monde: CARTE_3D_MONDE,
            segments: CARTE_3D_SEGMENTS,
            hauteurEau: CARTE_3D_EAU_Y,
            margeMin: PLACEMENT_MARGE_MIN,
            margeMax: PLACEMENT_MARGE_MAX,
            angle: emplacementAngle,
            marge: emplacementMarge,
            terrain: {
                sommets: carteGeometrie.attributes.position.count,
                minY: carteMinY,
                maxY: carteMaxY,
                sousLEau: carteSousLEau,
                auDessus: carteGeometrie.attributes.position.count - carteSousLEau
            },
            bande: {
                sommets: (CARTE_3D_BANDE_SEGMENTS + 1) * 2,
                margeMin: PLACEMENT_MARGE_MIN,
                margeMax: PLACEMENT_MARGE_MAX
            },
            marqueur: {
                x: carteMarqueur.position.x,
                y: carteMarqueur.position.y,
                z: carteMarqueur.position.z
            },
            camera: {
                x: carteCamera.position.x,
                y: carteCamera.position.y,
                z: carteCamera.position.z
            }
        };
    },
    getHauteurCarte: function (x, z) { return hauteurCarte(x, z); },
    projeterPlacement: projeterPlacement,
    getCarteMarqueur: function () {
        return {
            x: carteMarqueur.position.x,
            y: carteMarqueur.position.y,
            z: carteMarqueur.position.z
        };
    },
    choisirEmplacement: choisirEmplacement,
    placerAuPoste: placerAuPoste,
    getRodBase: function () { return { x: rodBase.x, y: rodBase.y, z: rodBase.z }; },
    // Geste de lancer / orientation du pêcheur et de la canne — pour les tests.
    getCastAnimation: function () {
        let cible;
        if (castState === 'charging') {
            cible = { x: castAim.x, z: castAim.z };
        } else if (floatState === 'flying') {
            cible = { x: castTarget.x, z: castTarget.z };
        } else {
            cible = { x: floatGroup.position.x, z: floatGroup.position.z };
        }
        return {
            swing: castSwing,
            baseAngler: anglerYawBase,
            baseRod: rodYawBase,
            yawAngler: angler.rotation.y,
            yawRod: rodPivot.rotation.y,
            offsetAngler: castYawAngler,
            offsetRod: castYawRod,
            cible: cible,
            castState: castState,
            floatState: floatState,
            castT: castT
        };
    },
    getRodTipVisual: function () {
        return { x: rodTipVisual.x, y: rodTipVisual.y, z: rodTipVisual.z };
    },
    getArmPose: function () {
        return {
            x: arm.position.x, y: arm.position.y, z: arm.position.z,
            rx: arm.rotation.x, ry: arm.rotation.y, rz: arm.rotation.z
        };
    },
    getCameraTarget: function () { return { x: cameraTarget.x, y: cameraTarget.y, z: cameraTarget.z }; },
    getGirouette: function () { return { x: vaneGroup.position.x, z: vaneGroup.position.z }; },
    // Soleil directionnel et lumière du poste (idee 2) — exposés pour les tests.
    getSoleil: function () {
        const direction = waterUniforms.uSunDir.value;
        return {
            azimut: SUN_AZIMUT,
            libelle: azimutTexte(SUN_AZIMUT),
            direction: { x: direction.x, y: direction.y, z: direction.z },
            position: { x: sunLight.position.x, y: sunLight.position.y, z: sunLight.position.z },
            intensite: sunLight.intensity,
            exposition: expositionPoste(),
            lumiereEau: waterUniforms.uLight.value,
            ambiance: ambientLight.intensity
        };
    },
    getExpositionPoste: function (index) { return expositionPoste(index); },
    couleurEau: couleurEau,
    getFondDoubleFace: function () { return pondBottom.material.side === THREE.DoubleSide; },
    getEauCouleurs: function () {
        return {
            shallow: waterUniforms.uShallow.value.getHex(),
            deep: waterUniforms.uDeep.value.getHex(),
            sky: waterUniforms.uSky.value.getHex()
        };
    },
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
    getExperiencePartie: function () { return experiencePartie; },
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
    // Responsive : FOV garanti et état du tiroir d'outils — pour les tests.
    getFovPourAspect: fovPourAspect,
    getCameraFov: function () { return camera.fov; },
    isOutilsOuverts: function () {
        return !!toolDock && toolDock.classList.contains('ouvert');
    },
    getFloatingTexts: function () {
        return floatingTexts.map(function (item) { return item.texte; });
    },
    // Détails (texte + position monde) des messages flottants — pour vérifier
    // notamment que l'avertissement de vitesse apparaît près du bouchon.
    getFloatingTextDetails: function () {
        return floatingTexts.map(function (item) {
            return {
                texte: item.texte,
                x: item.sprite.position.x,
                y: item.sprite.position.y,
                z: item.sprite.position.z
            };
        });
    },
    getMissRings: function () { return missRings.length; },
    startReel: startReel,
    // Mini-jeu de démêlage et tension de ligne au lancer — pilotage des tests.
    setTangleChance: function (value) {
        tangleChance = Math.max(0, Math.min(1, Number(value) || 0));
    },
    getTangleChance: function () { return tangleChance; },
    tendreLigne: tendreLigneAuLancer,
    isLigneTendue: function () { return ligneTendue; },
    forcerEmmElement: demarrerEmmElement,
    getTangle: function () { return jeuDemelage ? jeuDemelage.getState() : null; },
    getDemelagePath: function () { return jeuDemelage ? jeuDemelage.getPath() : []; },
    pointerDemelage: function (x, y) {
        if (jeuDemelage) { jeuDemelage.pointer(Number(x), Number(y)); }
    },
    abandonnerEmmElement: function () {
        if (jeuDemelage) { jeuDemelage.abandonner(); }
    },
    setTangleTime: function (sec) {
        if (jeuDemelage) { jeuDemelage.setTimeLeft(sec); }
    },
    isTangleActif: function () { return !!jeuDemelage && jeuDemelage.estActif(); },
    sound: sound,
    getWind: function () { return { dir: wind.dir, strength: wind.strength }; },
    getVaneRotation: function () { return vaneArrow.rotation.y; },
    getTension: function () { return tension; },
    // Accrochage (vase / nénuphars) — exposé pour les tests de difficulté.
    getSnag: function () {
        if (!snag) {
            return null;
        }
        return {
            dansLaVase: !!snag.dansLaVase,
            tension: tension,
            clickPower: snag.clickPower,
            clickCooldown: snag.clickCooldown,
            elapsed: snag.elapsed,
            lastClick: snag.lastClick,
            pret: snag.clickCooldown <= 0
                || (snag.elapsed - snag.lastClick) >= snag.clickCooldown,
            clics: snag.clics,
            clicsUtiles: snag.clicsUtiles
        };
    },
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
    // Contour généré de l'étang (idee 3) — exposé pour les tests et la carte.
    getRayonEtang: function (angle) { return rayonEtang(angle); },
    getRayonEtangMax: function () { return RAYON_ETANG_MAX; },
    getContourEtang: function (segments) {
        const n = Math.max(8, Math.floor(segments || 96));
        const points = [];
        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2;
            const rayonLocal = rayonEtang(angle);
            points.push({
                angle: angle,
                rayon: rayonLocal,
                x: POND_CENTER.x + Math.cos(angle) * rayonLocal,
                z: POND_CENTER.z + Math.sin(angle) * rayonLocal
            });
        }
        return points;
    },
    getFondMesh: function () { return pondBottom; },
    getShoreMesh: function () { return shore; },
    water: water,
    bourriche: bourriche,
    getWaterHeightAt: function (x, z) { return waterWaveHeightAt(x, z, testTime); },
    getBaitInterest: function () { return baitInterest; },
    // Mordillements avant la touche — exposés pour vérifier leur caractère aléatoire.
    getNibble: function () {
        return {
            interesse: baitInterest,
            actif: nibbleDebut >= 0,
            suivant: nibbleSuivant,
            duree: nibbleDuree,
            amplitude: nibbleAmplitude,
            phase: nibblePhase,
            graine: nibbleRngState
        };
    },
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
            enabled: reflections.enabled, supported: !!waterReflectionTarget,
            strength: waterUniforms.uReflectOn.value
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
        if (cameraViewActive) {
            updateCameraPosition(dt);
            camera.lookAt(cameraTarget);
            return;
        }
        testTime += dt;
        updateWind(dt);
        updateClouds(dt);
        updateStruggle(dt);
        updateSnag(dt);
        updateBiteView(dt);
        updateWater(testTime);
        updateFish(dt, testTime);
        updateSonar(dt, testTime);
        updateFloat(dt, testTime);
        updateFeed(dt);
        updateChum(dt);
        updateCastAnimation(dt);
        updateArm(dt);
        updateRod(dt);
        updateQuiver(dt);
        updateDayNight(dt);
        updateWeather(dt);
        updateAmbiante(dt, testTime);
        updateSplashes(dt);
        updateBubbles(dt);
        updateFishThrow(dt);
        updateCast(dt);
        updateRipples(dt);
        updateMissRings(dt);
        updateFloatingTexts(dt);
        if (jeuDemelage) { jeuDemelage.update(dt); }
        updateLine();
    }
};

// La fiche des touches est construite tout à la fin : le catalogue des touches
// est déclaré plus bas dans le fichier (on évite ainsi un accès avant création).
renderFicheTouches();
// Et on ouvre le carnet sur l'onglet « Prises ».
montrerOnglet('prises');
// Le poste par défaut est calé sur la rive LOCALE de l'étang généré : comme ce
// n'est pas un cercle, on ne peut pas se contenter des positions historiques.
placerAuPoste(0);

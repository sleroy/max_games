// ---------------------------------------------------------------------------
// Harnais de test pour games/peche_game — AUCUNE dépendance (Node seul).
//
// Le jeu est du JavaScript de navigateur : ce harnais fabrique le minimum
// d'environnement (document, fenêtre, AudioContext, timers, requestAnimationFrame)
// puis charge le VRAI script.js, qui expose window.__game pour les tests.
//
// Deux points importants :
//  1. Math.random est remplacé par un générateur « seedé » : le monde (poissons,
//     nénuphars, vent) est reproductible d'une exécution à l'autre ;
//  2. les timers (setTimeout) sont simulés et avancés par H.step() : le temps du
//     test est celui du jeu, pas celui de l'horloge.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Dossier du jeu (games/peche_game). */
export const GAME_DIR = path.resolve(HERE, '..');
const FILES = {
    script: path.join(GAME_DIR, 'script.js'),
    sound: path.join(GAME_DIR, 'sound.js'),
    demelage: path.join(GAME_DIR, 'demelage.js'),
    quiver: path.join(GAME_DIR, 'quiver.js'),
    especes: path.join(GAME_DIR, 'especes.js'),
    classement: path.join(GAME_DIR, 'classement.js'),
    carnet: path.join(GAME_DIR, 'carnet.js'),
    portraits: path.join(GAME_DIR, 'portraits.js'),
    decor: path.join(GAME_DIR, 'decor.js'),
    environnement: path.join(GAME_DIR, 'environnement.js'),
    poissons: path.join(GAME_DIR, 'poissons.js'),
    etat: path.join(GAME_DIR, 'etat.js'),
    splashes: path.join(GAME_DIR, 'splashes.js'),
    messages: path.join(GAME_DIR, 'messages.js'),
    ondulations: path.join(GAME_DIR, 'ondulations.js'),
    bourriche: path.join(GAME_DIR, 'bourriche.js'),
    combat: path.join(GAME_DIR, 'combat.js'),
    accrochage: path.join(GAME_DIR, 'accrochage.js'),
    cycleLigne: path.join(GAME_DIR, 'cycleLigne.js'),
    touches: path.join(GAME_DIR, 'touches.js'),
    journal: path.join(GAME_DIR, 'journal.js'),
    stocks: path.join(GAME_DIR, 'stocks.js'),
    sonar: path.join(GAME_DIR, 'sonar.js'),
    vie: path.join(GAME_DIR, 'vie.js'),
    meteo: path.join(GAME_DIR, 'meteo.js'),
    placement: path.join(GAME_DIR, 'placement.js'),
    bouchons: path.join(GAME_DIR, 'bouchons.js'),
    ligne: path.join(GAME_DIR, 'ligne.js'),
    frein: path.join(GAME_DIR, 'frein.js'),
    amorcage: path.join(GAME_DIR, 'amorcage.js'),
    lancerCanne: path.join(GAME_DIR, 'lancerCanne.js'),
    fiches: path.join(GAME_DIR, 'fiches.js'),
    boutique: path.join(GAME_DIR, 'boutique.js'),
    carnetUI: path.join(GAME_DIR, 'carnetUI.js'),
    lancerPoisson: path.join(GAME_DIR, 'lancerPoisson.js'),
    bateau: path.join(GAME_DIR, 'bateau.js'),
    comportement: path.join(GAME_DIR, 'comportement.js'),
    three: path.join(GAME_DIR, 'assets', 'three.module.js'),
    stub: path.join(HERE, 'three-stub.mjs')
};

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
let checks = 0;
let failures = 0;
const failuresLog = [];

function fmt(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? String(value) : value.toFixed(3);
    }
    return JSON.stringify(value);
}

export function group(title) {
    console.log('\n' + title);
}

export function check(label, ok, detail) {
    checks++;
    if (!ok) {
        failures++;
        failuresLog.push(label);
    }
    console.log('  ' + (ok ? 'OK   ' : 'ECHEC') + ' ' + label + (detail === undefined ? '' : '   -> ' + detail));
}

export function checkEqual(label, actual, expected) {
    check(label, actual === expected, 'obtenu ' + fmt(actual) + ', attendu ' + fmt(expected));
}

export function checkClose(label, actual, expected, tolerance) {
    check(label, Math.abs(actual - expected) <= tolerance,
        'obtenu ' + fmt(actual) + ', attendu ' + fmt(expected) + ' ±' + fmt(tolerance));
}

export function report() {
    console.log('\n' + '='.repeat(60));
    if (failures === 0) {
        console.log('TOUT OK : ' + checks + ' vérifications passées 🎣');
    } else {
        console.log(failures + ' ECHEC(S) sur ' + checks + ' vérifications :');
        failuresLog.forEach(label => console.log('  - ' + label));
    }
    process.exitCode = failures === 0 ? 0 : 1;
    return failures;
}

// ---------------------------------------------------------------------------
// Aléatoire reproductible (mulberry32) installé à la place de Math.random
// ---------------------------------------------------------------------------
let rngState = 1;

export function setSeed(seed) {
    rngState = (seed >>> 0) || 1;
}

function rng() {
    rngState = (rngState + 0x6d2b79f5) >>> 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Timers simulés
// ---------------------------------------------------------------------------
const timers = new Map();
let timerId = 0;
let simTime = 0;

function fakeSetTimeout(fn, delay = 0) {
    timerId++;
    timers.set(timerId, { at: simTime + delay, fn });
    return timerId;
}

// ---------------------------------------------------------------------------
// Faux DOM
// ---------------------------------------------------------------------------
const RECTS = {
    gameCanvas: { left: 0, top: 0, width: 1280, height: 720 },
    crank: { left: 1000, top: 560, width: 120, height: 120 },
    cartePlacement: { left: 0, top: 0, width: 320, height: 320 },
    tangleCanvas: { left: 0, top: 0, width: 640, height: 360 }
};

/** @type {Map<string, object>} */
export const elements = new Map();

function makeClassList() {
    const set = new Set();
    return {
        add: name => set.add(name),
        remove: name => set.delete(name),
        contains: name => set.has(name),
        toggle: (name, on) => {
            const want = on === undefined ? !set.has(name) : !!on;
            if (want) set.add(name); else set.delete(name);
            return want;
        }
    };
}

function makeContext2d() {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        lineJoin: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        globalAlpha: 1,
        fillRect() {},
        strokeRect() {},
        fillText() {},
        strokeText() {},
        clearRect() {},
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        arc() {},
        quadraticCurveTo() {},
        bezierCurveTo() {},
        ellipse() {},
        clip() {},
        fill() {},
        stroke() {},
        save() {},
        restore() {},
        setLineDash() {},
        measureText() { return { width: 0 }; },
        createRadialGradient() { return { addColorStop() {} }; },
        createLinearGradient() { return { addColorStop() {} }; }
    };
}

function makeElement(id) {
    const handlers = new Map();
    const attributes = new Map();
    return {
        id,
        style: {},
        classList: makeClassList(),
        textContent: '',
        disabled: false,
        width: 0,
        height: 0,
        visible: true,
        addEventListener(type, fn) {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(fn);
        },
        getBoundingClientRect() {
            return RECTS[id] || { left: 0, top: 0, width: 1280, height: 720 };
        },
        getContext(kind) { return kind === '2d' ? makeContext2d() : null; },
        setAttribute(name, value) { attributes.set(name, String(value)); },
        getAttribute(name) { return attributes.get(name) ?? null; },
        setPointerCapture() {},
        releasePointerCapture() {},
        /** Envoie un événement aux écouteurs du jeu (utilisé par les tests). */
        emit(type, event = {}) {
            const list = handlers.get(type) || [];
            list.forEach(fn => fn(event));
            return list.length;
        }
    };
}

/** Renvoie (en le créant au besoin) un élément du faux DOM. */
export function el(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
}

/** Déclenche un événement sur un élément du faux DOM. */
export function fire(id, type, event = {}) {
    return el(id).emit(type, event);
}

// ---------------------------------------------------------------------------
// Faux AudioContext (pour tester sound.js sans son)
// ---------------------------------------------------------------------------
class FakeParam {
    constructor(ctx, name) {
        this.ctx = ctx;
        this.name = name;
        this.value = 0;
        this.targets = [];
        this.ramps = [];
    }

    setValueAtTime(value) { this.value = value; this.ctx.log.push(['setValueAtTime', this.name, value]); return this; }
    setTargetAtTime(value) { this.value = value; this.targets.push(value); this.ctx.log.push(['setTargetAtTime', this.name, value]); return this; }
    linearRampToValueAtTime(value) { this.value = value; this.ramps.push(value); return this; }
    exponentialRampToValueAtTime(value) { this.value = value; this.ramps.push(value); this.ctx.log.push(['ramp', this.name, value]); return this; }
}

class FakeNode {
    constructor(ctx, kind) {
        this.ctx = ctx;
        this.kind = kind;
        this.connections = [];
        ctx.nodes.push(this);
    }

    connect(destination) { this.connections.push(destination); return destination; }
    disconnect() {}
}

class FakeGain extends FakeNode {
    constructor(ctx) { super(ctx, 'gain'); this.gain = new FakeParam(ctx, 'gain'); }
}

class FakeFilter extends FakeNode {
    constructor(ctx) {
        super(ctx, 'filter');
        this.type = 'lowpass';
        this.frequency = new FakeParam(ctx, 'frequency');
        this.Q = new FakeParam(ctx, 'Q');
    }
}

class FakeOscillator extends FakeNode {
    constructor(ctx) {
        super(ctx, 'oscillator');
        this.type = 'sine';
        this.frequency = new FakeParam(ctx, 'frequency');
        this.started = false;
        this.stopped = false;
    }

    start() { this.started = true; this.ctx.started.push(this); }
    stop() { this.stopped = true; }
}

class FakeBufferSource extends FakeNode {
    constructor(ctx) {
        super(ctx, 'bufferSource');
        this.buffer = null;
        this.loop = false;
        this.started = false;
    }

    start() { this.started = true; this.ctx.started.push(this); }
    stop() { this.stopped = true; }
}

export class FakeAudioContext {
    constructor() {
        this.state = 'running';
        this.sampleRate = 44100;
        this.currentTime = 0;
        this.resumed = false;
        this.log = [];
        this.nodes = [];
        this.started = [];
        this.destination = new FakeNode(this, 'destination');
    }

    createGain() { return new FakeGain(this); }
    createBiquadFilter() { return new FakeFilter(this); }
    createOscillator() { return new FakeOscillator(this); }
    createBufferSource() { return new FakeBufferSource(this); }
    createBuffer(channels, length, sampleRate) {
        // Une seule bande de données, comme un vrai AudioBuffer : getChannelData
        // doit renvoyer le MÊME tableau à chaque appel.
        const data = new Float32Array(length);
        return {
            numberOfChannels: channels,
            length,
            sampleRate,
            getChannelData: () => data
        };
    }

    resume() { this.resumed = true; this.state = 'running'; }
}

// ---------------------------------------------------------------------------
// Installation de l'environnement (à appeler AVANT loadGame)
// ---------------------------------------------------------------------------
export function installEnvironment() {
    setSeed(20240101);
    Math.random = rng;                                  // monde reproductible
    globalThis.window = globalThis;
    globalThis.__PECHE_RARE__ = 0;                     // tests : pas de spécimen rare
    globalThis.devicePixelRatio = 1;
    globalThis.innerWidth = 1280;
    globalThis.innerHeight = 720;
    globalThis.__windowListeners = {};                  // écouteurs « window » enregistrés par le jeu
    globalThis.addEventListener = (type, fn) => {
        (globalThis.__windowListeners[type] = globalThis.__windowListeners[type] || []).push(fn);
    };
    globalThis.removeEventListener = (type, fn) => {
        const list = globalThis.__windowListeners[type] || [];
        const i = list.indexOf(fn);
        if (i >= 0) { list.splice(i, 1); }
    };
    // Déclenche un événement « window » (p. ex. keydown) sur tous les écouteurs du jeu.
    globalThis.fireWindowEvent = (type, event = {}) => {
        const list = globalThis.__windowListeners[type] || [];
        const e = { target: null, preventDefault: () => {}, stopPropagation: () => {}, ...event };
        for (const fn of list.slice()) { fn(e); }
        return e;
    };
    globalThis.requestAnimationFrame = () => 0;         // la boucle de rendu ne tourne pas
    globalThis.cancelAnimationFrame = () => {};
    globalThis.setTimeout = fakeSetTimeout;             // timers pilotés par step()
    globalThis.clearTimeout = fakeClearTimeout;
    globalThis.AudioContext = FakeAudioContext;
    globalThis.document = {
        title: '',
        addEventListener: () => {},
        getElementById: id => el(id),
        createElement: tag => makeElement('<' + tag + '>')
    };
}

let tmpDir = null;
let game = null;
let SoundClass = null;

/** Le jeu (window.__game), disponible après loadGame(). */
export function G() {
    if (!game) throw new Error('loadGame() doit être appelé avant G()');
    return game;
}

/** La classe SoundEngine (sound.js), disponible après loadGame(). */
export function SoundEngineClass() {
    if (!SoundClass) throw new Error('loadGame() doit être appelé avant');
    return SoundClass;
}

export async function loadGame() {
    // Le navigateur résout « three » grâce à l'importmap de index.html ; Node
    // demande un vrai chemin : on copie le jeu dans un dossier temporaire en
    // réécrivant uniquement cette ligne d'import (le jeu n'est pas modifié).
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peche-tests-'));
    const source = fs.readFileSync(FILES.script, 'utf8');
    if (!source.includes("from 'three'")) {
        throw new Error("script.js n'importe plus 'three' : adapter le harnais");
    }
    fs.copyFileSync(FILES.sound, path.join(tmpDir, 'sound.js'));
    fs.copyFileSync(FILES.demelage, path.join(tmpDir, 'demelage.js'));
    fs.copyFileSync(FILES.quiver, path.join(tmpDir, 'quiver.js'));
    fs.copyFileSync(FILES.especes, path.join(tmpDir, 'especes.js'));
    fs.copyFileSync(FILES.classement, path.join(tmpDir, 'classement.js'));
    fs.copyFileSync(FILES.carnet, path.join(tmpDir, 'carnet.js'));
    fs.copyFileSync(FILES.portraits, path.join(tmpDir, 'portraits.js'));
    fs.copyFileSync(FILES.decor, path.join(tmpDir, 'decor.js'));
    fs.copyFileSync(FILES.environnement, path.join(tmpDir, 'environnement.js'));
    fs.copyFileSync(FILES.poissons, path.join(tmpDir, 'poissons.js'));
    fs.copyFileSync(FILES.etat, path.join(tmpDir, 'etat.js'));
    fs.copyFileSync(FILES.splashes, path.join(tmpDir, 'splashes.js'));
    fs.copyFileSync(FILES.messages, path.join(tmpDir, 'messages.js'));
    fs.copyFileSync(FILES.ondulations, path.join(tmpDir, 'ondulations.js'));
    fs.copyFileSync(FILES.bourriche, path.join(tmpDir, 'bourriche.js'));
    fs.copyFileSync(FILES.combat, path.join(tmpDir, 'combat.js'));
    fs.copyFileSync(FILES.accrochage, path.join(tmpDir, 'accrochage.js'));
    fs.copyFileSync(FILES.cycleLigne, path.join(tmpDir, 'cycleLigne.js'));
    fs.copyFileSync(FILES.touches, path.join(tmpDir, 'touches.js'));
    fs.copyFileSync(FILES.journal, path.join(tmpDir, 'journal.js'));
    fs.copyFileSync(FILES.stocks, path.join(tmpDir, 'stocks.js'));
    fs.copyFileSync(FILES.sonar, path.join(tmpDir, 'sonar.js'));
    fs.copyFileSync(FILES.vie, path.join(tmpDir, 'vie.js'));
    fs.copyFileSync(FILES.meteo, path.join(tmpDir, 'meteo.js'));
    fs.copyFileSync(FILES.placement, path.join(tmpDir, 'placement.js'));
    fs.copyFileSync(FILES.bouchons, path.join(tmpDir, 'bouchons.js'));
    fs.copyFileSync(FILES.ligne, path.join(tmpDir, 'ligne.js'));
    fs.copyFileSync(FILES.frein, path.join(tmpDir, 'frein.js'));
    fs.copyFileSync(FILES.amorcage, path.join(tmpDir, 'amorcage.js'));
    fs.copyFileSync(FILES.lancerCanne, path.join(tmpDir, 'lancerCanne.js'));
    fs.copyFileSync(FILES.fiches, path.join(tmpDir, 'fiches.js'));
    fs.copyFileSync(FILES.boutique, path.join(tmpDir, 'boutique.js'));
    fs.copyFileSync(FILES.carnetUI, path.join(tmpDir, 'carnetUI.js'));
    fs.copyFileSync(FILES.lancerPoisson, path.join(tmpDir, 'lancerPoisson.js'));
    fs.copyFileSync(FILES.bateau, path.join(tmpDir, 'bateau.js'));
    fs.copyFileSync(FILES.comportement, path.join(tmpDir, 'comportement.js'));
    fs.copyFileSync(path.join(GAME_DIR, 'portraits.js'), path.join(tmpDir, 'portraits.js'));
    const stub = fs.readFileSync(FILES.stub, 'utf8')
        .replace('THREE_URL_PLACEHOLDER', pathToFileURL(FILES.three).href);
    fs.writeFileSync(path.join(tmpDir, 'three-stub.mjs'), stub);
    fs.writeFileSync(path.join(tmpDir, 'game.mjs'),
        source.replace("from 'three'", "from './three-stub.mjs'"));
    // Les modules qui importent eux aussi three (decor.js, futurs modules 3D)
    // reçoivent le même stub : le jeu n'est jamais modifié.
    // Tout module copié qui importe `three` reçoit le stub (le jeu n'est
    // jamais modifié) : la liste est découverte, pas figée, sinon chaque
    // nouveau module casse les tests.
    for (const fichier of fs.readdirSync(tmpDir)) {
        if (!fichier.endsWith('.js')) { continue; }
        const chemin = path.join(tmpDir, fichier);
        const code = fs.readFileSync(chemin, 'utf8');
        if (code.includes("from 'three'")) {
            fs.writeFileSync(chemin, code.replace("from 'three'", "from './three-stub.mjs'"));
        }
    }

    await import(pathToFileURL(path.join(tmpDir, 'game.mjs')).href);
    SoundClass = (await import(pathToFileURL(path.join(tmpDir, 'sound.js')).href)).SoundEngine;
    game = globalThis.__game;
    game.setTangleChance(0);       // les casts des tests ne s'emmêlent pas
    game.setHorsNormeChance(0);    // monde de test sans spécimen hors norme
    game.setTechnique('bouchon');  // les tests historiques pêchent au bouchon
    game.setRagondinAuto(false);  // le ragondin ne surgit pas dans les tests
    return game;
}

export function cleanup() {
    if (tmpDir) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        tmpDir = null;
    }
}

// ---------------------------------------------------------------------------
// Pilotage d'une partie
// ---------------------------------------------------------------------------
export function state() {
    return G().getState();
}

export function statusText() {
    return el('status').textContent;
}

/** Avance le jeu d'un pas, en avançant aussi les timers simulés. */
export function step(dt = 1 / 60) {
    advanceTimers(dt * 1000);
    G().step(dt);
}

export function stepFor(seconds, dt = 1 / 60) {
    for (let t = 0; t < seconds; t += dt) step(dt);
}

export function stepUntil(predicate, maxSeconds = 30, dt = 0.05) {
    let t = 0;
    while (!predicate() && t < maxSeconds) {
        step(dt);
        t += dt;
    }
    return predicate();
}

/** Distance (au sol) entre le bout de la canne et le bouchon. */
export function castDistance() {
    const pos = G().floatGroup.position;
    return Math.hypot(G().rodTip.x - pos.x, G().rodTip.z - pos.z);
}

/** Distance (au sol) entre le bouchon et le point de rive du pêcheur. */
export function distanceToShore() {
    const pos = G().floatGroup.position;
    return Math.hypot(G().angler.position.x - pos.x, G().angler.position.z - 2.5 - pos.z);
}

/** Éloigne tous les poissons du bouchon (évite les touches non voulues). */
export function parkFish() {
    G().fishes.forEach((fish, index) => {
        if (fish.userData.hooked) {
            return;
        }
        fish.position.set(-40, -2, -10 - index * 0.01);
        fish.userData.vx = 0;
        fish.userData.vz = 0;
    });
}

export function clearLilyPads() {
    G().lilyPads.length = 0;
}

/** Ramène la partie à l'état « repos », quelle que soit la situation. */
export function resetToIdle(maxSeconds = 200) {
    parkFish();
    let t = 0;
    while (state() !== 'idle' && t < maxSeconds) {
        const current = state();
        if (current === 'bite') {
            fire('gameCanvas', 'pointerdown', { button: 0 });   // ferrage immédiat
        } else if (current === 'snag') {
            G().reelClick();
        } else if (current === 'struggle' || current === 'reeling') {
            crankTurns(30);
        } else if (current === 'inWater') {
            G().startReel();
        } else if (current === 'holding') {
            G().storeHeldFish();   // poisson en main : on le range dans la bourriche
        }
        parkFish();
        step(0.05);
        t += 0.05;
    }
    if (state() !== 'idle') {
        throw new Error('impossible de revenir au repos (état ' + state() + ')');
    }
}

/** Lance la ligne vers un point de l'étang (la partie doit être au repos). */
export function castTo(x, z) {
    if (state() !== 'idle') {
        throw new Error("castTo() demande l'état idle, obtenu « " + state() + " »");
    }
    parkFish();
    G().startCast({ x, y: 0, z });
    stepUntil(() => state() !== 'flying', 3);
    return state();
}

/**
 * Le poisson du test vit autour du bouchon, voit loin et nage en eau moyenne
 * (sinon sa zone de vie, sa couche d'eau ou sa vue l'éloignent de l'appât).
 */
export function adapterAuBouchon(fish) {
    fish.userData.couche = 'mi-eau';
    fish.userData.homeX = G().floatGroup.position.x;
    fish.userData.homeZ = G().floatGroup.position.z;
    fish.userData.homeRadius = 20;
    if (fish.userData.comp) {
        fish.userData.comp = Object.assign({}, fish.userData.comp, { vue: 12, nocturne: true });
    }
}

/** Amène un poisson au bouchon jusqu'à déclencher une touche. */
export function forceBite() {
    parkFish();
    const fish = G().fishes.find(f => !f.userData.hooked && !f.userData.biting);
    if (!fish) {
        throw new Error('aucun poisson disponible pour la touche');
    }
    fish.position.set(G().floatGroup.position.x, -2, G().floatGroup.position.z);
    // Le poisson du test est placé dans la tranche d'eau de l'hameçon (sinon la
    // règle « morsure par zone » l'empêcherait de mordre).
    fish.userData.profondeurZone = [G().getHookDepth() - 0.2, G().getHookDepth() + 0.2];
    adapterAuBouchon(fish);
    fish.userData.vx = 0;
    fish.userData.vz = 0;
    if (!stepUntil(() => state() === 'bite', 5)) {
        throw new Error('aucune touche déclenchée');
    }
    return fish;
}

/** Ferre au bon moment (pendant la vraie touche). */
export function strike() {
    stepUntil(() => G().getBitePhase() === 'touche', 45);
    fire('gameCanvas', 'pointerdown', { button: 0 });
}

/** Enchaîne lancer → touche → ferrage et renvoie le poisson ferré. */
export function startFight(x = 0, z = -30) {
    resetToIdle();
    clearLilyPads();
    castTo(x, z);
    if (state() !== 'inWater') {
        throw new Error('lancer raté (état ' + state() + ')');
    }
    const fish = forceBite();
    strike();
    if (state() !== 'struggle') {
        throw new Error('combat non déclenché (état ' + state() + ')');
    }
    return fish;
}

/** Tourne la manivelle « en direct » (raccourci de test). */
export function crankTurns(turns) {
    G().turnCrank(turns);
}

/**
 * Tourne la manivelle avec de VRAIS événements pointeur, comme un joueur :
 * le pointeur décrit un cercle autour du widget #crank.
 */
export function crankDragTurns(turns, steps = 8) {
    const rect = el('crank').getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = rect.width / 2 - 10;
    const total = turns * Math.PI * 2;
    const at = angle => ({
        pointerId: 1,
        clientX: cx + Math.cos(angle) * radius,
        clientY: cy + Math.sin(angle) * radius
    });
    fire('crank', 'pointerdown', at(-Math.PI / 2));
    for (let i = 1; i <= steps; i++) {
        fire('crank', 'pointermove', at(-Math.PI / 2 + total * (i / steps)));
    }
    fire('crank', 'pointerup', at(-Math.PI / 2 + total));
}

/** La manivelle est-elle visible/active à l'écran ? */
export function crankWidgetActive() {
    return el('crank').classList.contains('active');
}


function fakeClearTimeout(id) {
    timers.delete(id);
}

function advanceTimers(ms) {
    simTime += ms;
    for (const [id, timer] of Array.from(timers)) {
        if (timer.at <= simTime) {
            timers.delete(id);
            timer.fn();
        }
    }
}

// ---------------------------------------------------------------------------
// Scénario 2 : moteur audio (sound.js), testé avec un faux AudioContext.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, checkClose, SoundEngineClass, FakeAudioContext } from './harness.mjs';

const EFFECTS = ['splash', 'cast', 'bite', 'reel', 'catchFish', 'escape', 'snag', 'lineBreak'];

export function run() {
    const SoundEngine = SoundEngineClass();

    group('5) Moteur audio : initialisation');
    const engine = new SoundEngine();
    checkEqual('son actif par défaut', engine.enabled, true);
    checkEqual('aucun contexte avant init()', engine.ctx, null);

    let error = null;
    try {
        engine.reel();
        engine.setWind(0.5);
        engine.setEnabled(false);
    } catch (e) {
        error = e;
    }
    check('sans AudioContext, les appels ne plantent pas', !error, error ? error.message : 'ctx = ' + engine.ctx);

    engine.init();
    const ctx = engine.ctx;
    check('init() crée un AudioContext', ctx instanceof FakeAudioContext);
    checkEqual('volume général à 0,5', engine.master.gain.value, 0.5);
    check('le volume général est relié au haut-parleur', engine.master.connections[0] === ctx.destination);
    engine.init();
    check('init() appelé deux fois ne recrée rien', engine.ctx === ctx);

    group('6) Moteur audio : vent continu');
    check('un bruit de vent tourne en boucle',
        !!engine.windSource && engine.windSource.loop === true && engine.windSource.started === true);
    check('les échantillons réels sont optionnels en test (fallback)',
        Object.keys(engine.samples).length === 0);
    engine.setWind(0.8);
    checkClose('gain du vent = 0,8 × 0,12', engine.windGain.gain.targets.at(-1), 0.096, 1e-9);
    checkClose('filtre du vent = 300 + 0,8 × 900', engine.windFilter.frequency.targets.at(-1), 1020, 1e-9);

    group('7) Moteur audio : les bruitages');
    EFFECTS.forEach(name => {
        const before = ctx.nodes.length;
        let thrown = null;
        try {
            engine[name]();
        } catch (e) {
            thrown = e;
        }
        const created = ctx.nodes.length - before;
        check('« ' + name + '() » joue un son', !thrown && created > 0,
            thrown ? thrown.message : created + ' nœuds audio');
    });

    const noise = engine.makeNoiseBuffer(0.4);
    checkEqual('bruit de 0,4 s : longueur = sampleRate × 0,4',
        noise.length, Math.floor(44100 * 0.4));
    const data = noise.getChannelData(0);
    let inRange = true;
    let nonZero = false;
    for (let i = 0; i < data.length; i++) {
        if (data[i] < -1 || data[i] > 1) inRange = false;
        if (data[i] !== 0) nonZero = true;
    }
    check('le bruit reste entre -1 et 1 (et n\'est pas muet)', inRange && nonZero);

    group('7a) Moteur audio : enregistrements disponibles');
    for (const name of ['cast', 'reel', 'drag', 'birds', 'lineBreak']) {
        const recording = engine.samples[name] = ctx.createBuffer(1, 4410, 44100);
        engine[name]();
        check('« ' + name + '() » utilise l’enregistrement', ctx.started.at(-1).buffer === recording);
    }
    const clicks = ctx.started.length;
    engine.reel();
    checkEqual('deux demi-tours rapprochés ne superposent pas les cliquets', ctx.started.length, clicks);
    ctx.currentTime += 0.16;
    engine.reel();
    checkEqual('un demi-tour suivant produit un cliquet', ctx.started.length, clicks + 1);
    engine.samples.rain = ctx.createBuffer(1, 44100, 44100);
    engine.setRain(0.6);
    check('la pluie enregistrée tourne en boucle',
        engine.rainSource.loop && engine.rainSource.buffer === engine.samples.rain);

    group('7b) Moteur audio : plouf de l’amorce');
    // Le son réel « amorce-plouf.mp3 » est dédié à la boule d'amorce : quand il
    // est chargé, c'est LUI qui joue (et pas le splash générique).
    const amorce = engine.samples.amorce = ctx.createBuffer(1, 4410, 44100);
    const avantAmorce = ctx.started.length;
    engine.amorceSplash();
    check('« amorceSplash() » utilise l’enregistrement dédié',
        ctx.started.at(-1).buffer === amorce);
    checkEqual('et il ne joue qu’un son, pas deux', ctx.started.length, avantAmorce + 1);
    // Sans l'asset (téléphone hors ligne, décodage raté), repli sur le splash.
    delete engine.samples.amorce;
    const avantRepli = ctx.started.length;
    engine.amorceSplash();
    check('sans l’asset, repli sur le splash habituel',
        ctx.started.length > avantRepli, (ctx.started.length - avantRepli) + ' nœud(s)');

    group('8) Moteur audio : réglages');
    engine.setEnabled(false);
    checkEqual('setEnabled(false) coupe le son', engine.master.gain.targets.at(-1), 0);
    engine.setEnabled(true);
    checkEqual('setEnabled(true) remet le son', engine.master.gain.targets.at(-1), 0.5);
    ctx.state = 'suspended';
    engine.resume();
    check('resume() relance un contexte suspendu', ctx.resumed === true);

    const celebration = new SoundEngine();
    celebration.init();
    celebration.catchFish();
    const notes = celebration.ctx.nodes.filter(node => node.kind === 'oscillator' && node.started);
    checkEqual('la victoire joue 4 notes', notes.length, 4);
    checkClose('première note = do 5 (523,25 Hz)', notes[0].frequency.value, 523.25, 1e-6);
}

export default run;

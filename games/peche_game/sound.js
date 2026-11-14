export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.windGain = null;
        this.windFilter = null;
        this.enabled = true;
        // Échantillons réels optionnels (fallback procédural si absents).
        this.samples = {};
        this.ambienceSource = null;
        this.ambienceGain = null;
    }

    init() {
        if (this.ctx) {
            return;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return;
        }
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        this.startWind();
        this.loadSamples();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setEnabled(value) {
        this.enabled = value;
        if (this.master) {
            this.master.gain.setTargetAtTime(value ? 0.5 : 0, this.ctx.currentTime, 0.05);
        }
    }

    makeNoiseBuffer(duration) {
        const length = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // -----------------------------------------------------------------------
    // Échantillons réels locaux (assets/sons). En l'absence de fetch /
    // decodeAudioData (tests, navigateur ancien), on garde les sons procéduraux.
    // -----------------------------------------------------------------------
    loadSamples() {
        if (!this.ctx || typeof this.ctx.decodeAudioData !== 'function'
            || typeof fetch !== 'function') {
            return;
        }
        if (typeof window !== 'undefined' && window.__PECHE_SANS_AUDIO_ASSETS__) {
            return;
        }
        const charger = (nom, chemin, volume, boucle) => {
            fetch(chemin)
                .then(function (reponse) {
                    if (!reponse.ok) { throw new Error('asset absent'); }
                    return reponse.arrayBuffer();
                })
                .then(buffer => this.ctx.decodeAudioData(buffer))
                .then(buffer => {
                    this.samples[nom] = buffer;
                    if (boucle) { this.startAmbiance(nom, volume); }
                })
                .catch(function () { /* fallback procédural */ });
        };
        charger('splash', 'assets/sons/eau-splash.wav', 0.65, false);
        charger('ambiance', 'assets/sons/etang-ambiance.mp3', 0.08, true);
    }

    jouerSample(nom, volume, duree) {
        if (!this.ctx || !this.samples[nom]) { return false; }
        const source = this.ctx.createBufferSource();
        source.buffer = this.samples[nom];
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(this.master);
        const longueur = Math.min(duree || source.buffer.duration, source.buffer.duration);
        source.start(this.ctx.currentTime, 0, longueur);
        return true;
    }

    startAmbiance(nom, volume) {
        if (this.ambienceSource || !this.ctx || !this.samples[nom]) { return; }
        const source = this.ctx.createBufferSource();
        source.buffer = this.samples[nom];
        source.loop = true;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(this.master);
        source.start();
        this.ambienceSource = source;
        this.ambienceGain = gain;
    }

    startWind() {
        const noise = this.makeNoiseBuffer(2);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        source.start();
        this.windSource = source;
        this.windFilter = filter;
        this.windGain = gain;
    }

    setWind(strength) {
        if (!this.windGain) {
            return;
        }
        const t = this.ctx.currentTime;
        this.windGain.gain.setTargetAtTime(strength * 0.12, t, 0.6);
        this.windFilter.frequency.setTargetAtTime(300 + strength * 900, t, 0.6);
    }

    // Pluie : bruit filtré, créé seulement quand il se met à pleuvoir.
    startRain() {
        if (this.rainGain || !this.ctx) {
            return;
        }
        const noise = this.makeNoiseBuffer(2);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2600;
        filter.Q.value = 0.6;
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        source.start();
        this.rainSource = source;
        this.rainFilter = filter;
        this.rainGain = gain;
    }

    setRain(amount) {
        if (!this.ctx) {
            return;
        }
        if (amount <= 0.02 && !this.rainGain) {
            return;
        }
        this.startRain();
        const t = this.ctx.currentTime;
        this.rainGain.gain.setTargetAtTime(amount * 0.16, t, 1.2);
        this.rainFilter.frequency.setTargetAtTime(1800 + amount * 2200, t, 1.2);
    }

    // Pépiements d'oiseaux.
    birds() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const start = t + i * 0.18;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2200 + i * 500, start);
            osc.frequency.exponentialRampToValueAtTime(3200 + i * 300, start + 0.06);
            osc.frequency.exponentialRampToValueAtTime(1900 + i * 400, start + 0.13);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
            osc.connect(gain);
            gain.connect(this.master);
            osc.start(start);
            osc.stop(start + 0.16);
        }
    }

    // « Plop » d'un poisson qui saute hors de l'eau.
    jump() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.22);
    }

    splash() {
        if (!this.ctx) return;
        // Vrai splash local si disponible, sinon synthèse procédurale.
        if (this.jouerSample('splash', 0.65, 1.2)) { return; }
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.makeNoiseBuffer(0.4);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        noise.start(t);
        noise.stop(t + 0.4);
    }

    cast() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.makeNoiseBuffer(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(2200, t + 0.3);
        filter.Q.value = 1.2;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        noise.start(t);
        noise.stop(t + 0.5);
    }

    bite() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.15);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.2);
        this.splash();
    }

    reel() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1100 + Math.random() * 300, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    catchFish() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = this.ctx.createGain();
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(0.001, start);
            gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain);
            gain.connect(this.master);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    escape() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.4);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.45);
    }

    snag() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    lineBreak() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.makeNoiseBuffer(0.2);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        noise.start(t);
        noise.stop(t + 0.2);
    }
}

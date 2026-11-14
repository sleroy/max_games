export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.windGain = null;
        this.windFilter = null;
        this.enabled = true;
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

    splash() {
        if (!this.ctx) return;
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

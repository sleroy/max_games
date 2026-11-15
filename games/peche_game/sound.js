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
        this.lastReelSampleAt = -Infinity;
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
        charger('cast', 'assets/sons/canne-lancer.mp3');
        charger('reel', 'assets/sons/moulinet.mp3');
        charger('drag', 'assets/sons/moulinet-frein.mp3');
        charger('lineBreak', 'assets/sons/fil-casse.mp3');
        charger('birds', 'assets/sons/merle.mp3');
        charger('rain', 'assets/sons/pluie.mp3');
        // Nouveaux bruitages (volume / boucle gérés à la lecture).
        [['plouf', 'plouf'], ['heron', 'heron'], ['martinPecheur', 'martin-pecheur'],
            ['corneille', 'corneille'], ['canard', 'canard'], ['grenouille', 'grenouille'],
            ['grenouillesNuit', 'grenouilles-nuit'], ['grillonsNuit', 'grillons-nuit'],
            ['tonnerre', 'tonnerre'], ['pas', 'pas-gravier'], ['piece', 'pieces'],
            ['cloche', 'cloche'], ['carillon', 'carillon'], ['clic', 'clic'],
            ['fouet', 'fouet-canne'], ['epuisette', 'epuisette'],
            ['poissonSol', 'poisson-sol'], ['filTendu', 'fil-tendu']
        ].forEach(function (paire) {
            charger(paire[0], 'assets/sons/' + paire[1] + '.mp3');
        });
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

    // Pluie : l'enregistrement tourne en boucle à partir de la première averse.
    startRain() {
        if (this.rainGain || !this.ctx) {
            return;
        }
        const recording = this.samples.rain;
        const source = this.ctx.createBufferSource();
        source.buffer = recording || this.makeNoiseBuffer(2);
        source.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = recording ? 'lowpass' : 'bandpass';
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
        const recorded = this.rainFilter.type === 'lowpass';
        this.rainGain.gain.setTargetAtTime(amount * (recorded ? 0.45 : 0.16), t, 1.2);
        this.rainFilter.frequency.setTargetAtTime(
            recorded ? 1400 + amount * 4600 : 1800 + amount * 2200, t, 1.2);
    }

    // Pépiements d'oiseaux.
    birds() {
        if (!this.ctx) return;
        if (this.jouerSample('birds', 0.32)) { return; }
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
        if (!this.jouerSample('cast', 0.45)) { this.throwItem(); }
    }

    throwItem() {
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
        if (this.samples.reel) {
            const now = this.ctx.currentTime;
            // Un geste rapide peut déclencher plusieurs demi-tours la même image.
            if (now - this.lastReelSampleAt >= 0.10) {
                this.jouerSample('reel', 0.42);
                this.lastReelSampleAt = now;
            }
            return;
        }
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

    drag() {
        if (!this.jouerSample('drag', 0.38)) { this.reel(); }
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
        if (this.jouerSample('lineBreak', 0.52)) { return; }
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

    // -----------------------------------------------------------------------
    // Bruitages d'ambiance et d'événements (enregistrements + secours procédural).
    // -----------------------------------------------------------------------
    // Petit « bip » glissant, utilisé comme secours quand l'échantillon manque.
    tonSecours(depart, arrivee, duree, volume, type) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(depart, t);
        osc.frequency.exponentialRampToValueAtTime(arrivee, t + duree);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + duree + 0.02);
    }

    // Bruit filtré, utilisé comme secours (vent, froissement, tonnerre...).
    bruitSecours(duree, volume, type, frequence) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.makeNoiseBuffer(duree);
        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequence;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        noise.start(t);
        noise.stop(t + duree);
    }

    // Poisson qui saute : « plouf » puis éclaboussure.
    playSaut() {
        if (!this.ctx) return;
        if (this.samples.plouf || this.samples.splash) {
            this.jouerSample('plouf', 0.5);
            this.jouerSample('splash', 0.4, 0.9);
            return;
        }
        this.jump();
    }

    // Flotteur ou appât qui tombe dans l'eau, petit « plouf ».
    playPlouf() {
        if (!this.ctx) return;
        if (this.jouerSample('plouf', 0.55)) { return; }
        this.tonSecours(520, 130, 0.16, 0.22, 'sine');
    }

    // -----------------------------------------------------------------------
    // RAGONDIN : bruitages procéduraux (aucun fichier externe) + musique
    // inquiétante tant qu'il rôde. Tout est synthétisé avec Web Audio.
    // -----------------------------------------------------------------------
    // Grognement / couinement grave : oscillateur + vibrato rapide.
    ragondinCri(aigu) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        const base = aigu ? 900 : 120;
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(aigu ? 380 : 70, t + 0.35);
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 28;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = aigu ? 90 : 18;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        const filtre = this.ctx.createBiquadFilter();
        filtre.type = 'lowpass';
        filtre.frequency.value = aigu ? 2400 : 500;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(filtre);
        filtre.connect(gain);
        gain.connect(this.master);
        osc.start(t); lfo.start(t);
        osc.stop(t + 0.45); lfo.stop(t + 0.45);
    }

    // Rongement : petites rafales de bruit filtré (« crrk-crrk-crrk »).
    ragondinRonge(nb) {
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime;
        const n = nb || 6;
        for (let i = 0; i < n; i++) {
            const t = t0 + i * 0.13;
            const src = this.ctx.createBufferSource();
            src.buffer = this.makeNoiseBuffer(0.06);
            const filtre = this.ctx.createBiquadFilter();
            filtre.type = 'bandpass';
            filtre.frequency.value = 2200 + (i % 3) * 500;
            filtre.Q.value = 3;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            src.connect(filtre);
            filtre.connect(gain);
            gain.connect(this.master);
            src.start(t);
        }
    }

    // Arrivée : éclaboussure sourde + grognement.
    ragondinArrive() {
        if (!this.ctx) return;
        this.splash();
        this.ragondinCri(false);
        this.ragondinMusiqueStart();
    }

    // Musique inquiétante : bourdon grave, tierce mineure + triton qui
    // grincent, battements de cœur et petites notes aiguës dissonantes.
    ragondinMusiqueStart() {
        if (!this.ctx || this.ragondinMusique) return;
        const ctx = this.ctx;
        const t = ctx.currentTime;
        const sortie = ctx.createGain();
        sortie.gain.setValueAtTime(0.0001, t);
        sortie.gain.exponentialRampToValueAtTime(0.5, t + 2.5);
        sortie.connect(this.master);
        const oscs = [];
        // Bourdon : La1 + Mib2 (triton) très légèrement désaccordés.
        [[55, 'sawtooth', 0.07], [55.7, 'sawtooth', 0.07], [77.8, 'triangle', 0.09], [82.4, 'sine', 0.08]]
            .forEach(function (d) {
                const o = ctx.createOscillator();
                o.type = d[1];
                o.frequency.value = d[0];
                const f = ctx.createBiquadFilter();
                f.type = 'lowpass';
                f.frequency.value = 380;
                const g = ctx.createGain();
                g.gain.value = d[2];
                o.connect(f); f.connect(g); g.connect(sortie);
                o.start(t);
                oscs.push(o);
            });
        // Tremblement lent sur le volume du bourdon.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.35;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.12;
        lfo.connect(lfoGain);
        lfoGain.connect(sortie.gain);
        lfo.start(t);
        oscs.push(lfo);
        const etat = { sortie, oscs, timer: null, battement: 0 };
        const notes = [466, 493, 698, 740, 880];   // Sib/Si, Fa/Fa#… : secondes frottées
        const pulse = () => {
            if (this.ragondinMusique !== etat || !this.ctx) { return; }
            const now = ctx.currentTime;
            // Battement de cœur « toum-toum » (2 coups) toutes les ~1,1 s.
            [0, 0.2].forEach(function (dec, k) {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(70, now + dec);
                o.frequency.exponentialRampToValueAtTime(38, now + dec + 0.18);
                const g = ctx.createGain();
                g.gain.setValueAtTime(k ? 0.22 : 0.32, now + dec);
                g.gain.exponentialRampToValueAtTime(0.001, now + dec + 0.22);
                o.connect(g); g.connect(sortie);
                o.start(now + dec); o.stop(now + dec + 0.25);
            });
            etat.battement += 1;
            // Une note aiguë et fausse, de temps en temps.
            if (etat.battement % 3 === 0) {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.0001, now);
                g.gain.exponentialRampToValueAtTime(0.05, now + 0.3);
                g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
                o.connect(g); g.connect(sortie);
                o.start(now); o.stop(now + 1.5);
            }
            // Grincement occasionnel.
            if (etat.battement % 5 === 0) { this.ragondinRonge(3); }
        };
        etat.timer = setInterval(pulse, 1100);
        pulse();
        this.ragondinMusique = etat;
    }

    ragondinMusiqueStop() {
        const etat = this.ragondinMusique;
        if (!etat) return;
        this.ragondinMusique = null;
        clearInterval(etat.timer);
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        if (etat.sortie.gain.cancelScheduledValues) { etat.sortie.gain.cancelScheduledValues(t); }
        etat.sortie.gain.setValueAtTime(Math.max(0.0001, etat.sortie.gain.value || 0.3), t);
        etat.sortie.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        etat.oscs.forEach(function (o) { try { o.stop(t + 1.3); } catch (e) { /* déjà arrêté */ } });
    }

    playHeron() {
        if (!this.ctx) return;
        if (this.jouerSample('heron', 0.35)) { return; }
        this.tonSecours(300, 120, 0.5, 0.1, 'sawtooth');
    }

    playMartinPecheur() {
        if (!this.ctx) return;
        if (this.jouerSample('martinPecheur', 0.3)) { return; }
        this.birds();
    }

    playCorneille() {
        if (!this.ctx) return;
        if (this.jouerSample('corneille', 0.3)) { return; }
        this.tonSecours(480, 260, 0.25, 0.1, 'sawtooth');
    }

    playCanard() {
        if (!this.ctx) return;
        if (this.jouerSample('canard', 0.3)) { return; }
        this.tonSecours(700, 350, 0.18, 0.1, 'square');
    }

    // Une grenouille qui coasse (courte, un seul cri).
    playGrenouille() {
        if (!this.ctx) return;
        if (this.jouerSample('grenouille', 0.35)) { return; }
        this.tonSecours(260, 160, 0.2, 0.12, 'triangle');
    }

    // Chœur de grenouilles de nuit : extrait de quelques secondes.
    playGrenouilles(duree) {
        if (!this.ctx) return;
        if (this.samples.grenouillesNuit) {
            this.jouerSample('grenouillesNuit', 0.3, duree || 5);
            return;
        }
        this.playGrenouille();
    }

    // Grillons de nuit : extrait de quelques secondes.
    playCrickets(duree) {
        if (!this.ctx) return;
        if (this.samples.grillonsNuit) {
            this.jouerSample('grillonsNuit', 0.28, duree || 5);
            return;
        }
        this.tonSecours(4200, 4000, 0.12, 0.03, 'sine');
    }

    // Ambiance de nuit en continu (0 = jour, 1 = pleine nuit). Sans échantillon : muet.
    setNuit(niveau) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const volumes = { grenouillesNuit: 0.22, grillonsNuit: 0.2 };
        this.nuit = this.nuit || {};
        Object.keys(volumes).forEach(nom => {
            if (!this.samples[nom]) { return; }
            if (!this.nuit[nom]) {
                if (niveau <= 0.02) { return; }
                const source = this.ctx.createBufferSource();
                source.buffer = this.samples[nom];
                source.loop = true;
                const gain = this.ctx.createGain();
                gain.gain.value = 0;
                source.connect(gain);
                gain.connect(this.master);
                source.start();
                this.nuit[nom] = { source, gain };
            }
            this.nuit[nom].gain.gain.setTargetAtTime(Math.max(0, niveau) * volumes[nom], t, 2);
        });
    }

    playTonnerre() {
        if (!this.ctx) return;
        if (this.jouerSample('tonnerre', 0.6)) { return; }
        this.bruitSecours(1.6, 0.35, 'lowpass', 220);
    }

    // Pas sur le gravier ou l'herbe (un pas par appel).
    playPas() {
        if (!this.ctx) return;
        if (this.jouerSample('pas', 0.4)) { return; }
        this.bruitSecours(0.1, 0.12, 'bandpass', 900);
    }

    // Cloche : record battu, passage de niveau.
    playCloche() {
        if (!this.ctx) return;
        if (this.jouerSample('cloche', 0.4)) { return; }
        this.tonSecours(880, 870, 0.9, 0.15, 'sine');
    }

    // Petit carillon : objectif atteint, nouvelle espèce au carnet.
    playCarillon() {
        if (!this.ctx) return;
        if (this.jouerSample('carillon', 0.45)) { return; }
        this.tonSecours(1320, 1300, 0.5, 0.12, 'sine');
    }

    // Pièces : achat à la boutique, argent gagné.
    playPiece() {
        if (!this.ctx) return;
        if (this.jouerSample('piece', 0.45)) { return; }
        this.tonSecours(2400, 1800, 0.12, 0.1, 'square');
    }

    // Clic d'interface.
    playClic() {
        if (!this.ctx) return;
        if (this.jouerSample('clic', 0.5)) { return; }
        this.tonSecours(1500, 900, 0.04, 0.08, 'square');
    }

    // Coup de fouet de la canne (lancer, ferrage).
    playFouet() {
        if (!this.ctx) return;
        if (this.jouerSample('fouet', 0.45)) { return; }
        this.throwItem();
    }

    // Fil qui se tend (sifflement). Limité à un par 0,25 s.
    playFilTendu() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (now - (this.lastFilTenduAt || -Infinity) < 0.25) { return; }
        this.lastFilTenduAt = now;
        if (this.jouerSample('filTendu', 0.3)) { return; }
        this.tonSecours(900, 2400, 0.25, 0.05, 'sine');
    }

    // Épuisette qui sort le poisson de l'eau.
    playEpuisette() {
        if (!this.ctx) return;
        if (this.jouerSample('epuisette', 0.5)) { return; }
        this.bruitSecours(0.5, 0.18, 'bandpass', 1200);
    }

    // Poisson qui frétille sur la berge.
    playPoissonSol() {
        if (!this.ctx) return;
        if (this.jouerSample('poissonSol', 0.5)) { return; }
        this.bruitSecours(0.4, 0.2, 'lowpass', 600);
    }
}

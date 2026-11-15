// ---------------------------------------------------------------------------
// demelage.js — MINI-JEU DE DÉMÊLAGE (« suivre le serpent »).
//
// Module autonome (aucun three.js) : il dessine un câble sinueux sur un canvas
// et vérifie que le doigt suit le fil dans le bon sens, avec une marge tactile.
// Le joueur colorie le câble au fur et à mesure. Temps limité ; en cas d'échec
// ou d'abandon, le jeu principal perd une ligne (callback onPerdu).
// ---------------------------------------------------------------------------
export function creerJeuDemelage(options) {
    const opts = options || {};
    const canvas = opts.canvas;
    if (!canvas) { return null; }
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!canvas.width) { canvas.width = 640; }
    if (!canvas.height) { canvas.height = 360; }
    const TOLERANCE_TACTILE = 20; // pixels CSS, indépendants de la taille du canvas.
    const RAYON_REPRISE = 26;
    const DUREE_DEFAUT = 14;
    const conteneur = opts.conteneur || null;
    const timerEl = opts.timerEl || null;
    const progressEl = opts.progressEl || null;
    const messageEl = opts.messageEl || null;
    let duree = opts.duree || DUREE_DEFAUT;
    let etat = null;
    let rngState = 0x9e3779b9 >>> 0;

    function rand() {
        rngState = (rngState + 0x6d2b79f5) >>> 0;
        let t = rngState;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function largeur() { return canvas.width || 640; }
    function hauteur() { return canvas.height || 360; }

    function genererParcours() {
        const w = largeur();
        const h = hauteur();
        const marge = 34;
        const phase = rand() * Math.PI * 2;
        const amplitude = 62 + rand() * 28;
        const nb = 6 + Math.floor(rand() * 3);
        const points = [];
        const n = 100;
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const enveloppe = Math.sin(Math.PI * t);
            const y = h / 2
                + Math.sin(t * Math.PI * 2 * nb + phase) * amplitude * enveloppe
                + Math.sin(t * Math.PI * 2 * 1.7 + phase * 0.7) * 16 * enveloppe;
            points.push({
                x: marge + t * (w - 2 * marge),
                y: Math.max(24, Math.min(h - 24, y))
            });
        }
        return points;
    }

    function majHud() {
        if (!etat) { return; }
        if (timerEl) { timerEl.textContent = '⏱ ' + Math.max(0, etat.timeLeft).toFixed(1) + ' s'; }
        if (progressEl) {
            const pct = Math.round((etat.progress / Math.max(1, etat.points.length - 1)) * 100);
            progressEl.textContent = pct + ' %';
        }
    }

    function dessiner() {
        if (!ctx || !etat) { return; }
        const w = largeur();
        const h = hauteur();
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0d1b24';
        ctx.fillRect(0, 0, w, h);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#d7e4df';
        ctx.lineWidth = 5;
        ctx.beginPath();
        etat.points.forEach(function (p, i) {
            if (i === 0) { ctx.moveTo(p.x, p.y); } else { ctx.lineTo(p.x, p.y); }
        });
        ctx.stroke();
        if (etat.progress > 0) {
            ctx.strokeStyle = '#7ed957';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i <= etat.progress; i++) {
                const p = etat.points[i];
                if (i === 0) { ctx.moveTo(p.x, p.y); } else { ctx.lineTo(p.x, p.y); }
            }
            ctx.stroke();
        }
        const debut = etat.points[0];
        const fin = etat.points[etat.points.length - 1];
        ctx.fillStyle = '#7ed957';
        ctx.beginPath(); ctx.arc(debut.x, debut.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6b57';
        ctx.beginPath(); ctx.arc(fin.x, fin.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DÉPART', debut.x - 26, debut.y + 28);
        ctx.fillText('ARRIVÉE', fin.x - 30, fin.y + 28);
    }

    function pointLePlusProche(x, y, scaleX, scaleY) {
        if (!etat) { return null; }
        const min = Math.max(0, etat.progress - 1);
        const max = Math.min(etat.points.length - 1, etat.progress + 20);
        let meilleur = null;
        for (let i = min; i <= max; i++) {
            const p = etat.points[i];
            const d = Math.hypot((p.x - x) * scaleX, (p.y - y) * scaleY);
            if (!meilleur || d < meilleur.distance) {
                meilleur = { index: i, distance: d };
            }
        }
        return meilleur;
    }

    function pointerDown(x, y, scaleX = 1, scaleY = 1) {
        if (!etat || !etat.active) { return false; }
        const point = etat.points[etat.progress];
        if (Math.hypot((point.x - x) * scaleX, (point.y - y) * scaleY) > RAYON_REPRISE) {
            if (messageEl) {
                messageEl.textContent = etat.progress ? 'Reprends au bout du fil vert.' : 'Commence au point vert.';
            }
            return false;
        }
        etat.tracing = true;
        if (messageEl) { messageEl.textContent = 'Suis le fil jusqu’au point rouge.'; }
        if (opts.onStatus) { opts.onStatus('🧶 Suis le fil jusqu’au point rouge.'); }
        return true;
    }

    function pointerMove(x, y, scaleX = 1, scaleY = 1) {
        if (!etat || !etat.active || !etat.tracing) { return; }
        const proche = pointLePlusProche(x, y, scaleX, scaleY);
        if (!proche || proche.distance > TOLERANCE_TACTILE) {
            if (messageEl) { messageEl.textContent = 'Reviens au bout du fil vert.'; }
            return;
        }
        if (proche.index > etat.progress) { etat.progress = proche.index; }
        if (messageEl) { messageEl.textContent = 'Continue jusqu’au point rouge.'; }
        majHud();
        dessiner();
        if (etat.progress >= etat.points.length - 1) { reussir(); }
    }

    function pointerUp() {
        if (!etat || !etat.active || !etat.tracing) { return; }
        etat.tracing = false;
        if (messageEl) {
            messageEl.textContent = etat.progress ? 'Reprends au bout du fil vert.' : 'Commence au point vert.';
        }
    }

    function fermer() {
        if (conteneur && conteneur.classList) { conteneur.classList.remove('active'); }
        etat = null;
    }

    function reussir() {
        if (!etat || !etat.active) { return; }
        etat.active = false;
        etat.tracing = false;
        if (messageEl) { messageEl.textContent = 'Ligne démêlée ! 🎣'; }
        majHud();
        fermer();
        if (opts.onReussi) { opts.onReussi(); }
    }

    function echouer(raison) {
        if (!etat || !etat.active) { return; }
        etat.active = false;
        etat.tracing = false;
        if (messageEl) { messageEl.textContent = 'Ligne perdue : ' + raison + '.'; }
        fermer();
        if (opts.onPerdu) { opts.onPerdu(raison); }
    }

    function ouvrir() {
        etat = {
            points: genererParcours(),
            progress: 0,
            tracing: false,
            timeLeft: duree,
            active: true
        };
        if (conteneur && conteneur.classList) { conteneur.classList.add('active'); }
        if (messageEl) {
            messageEl.textContent = 'Suis le fil du point vert au point rouge. Tu peux reprendre là où tu t’arrêtes.';
        }
        majHud();
        dessiner();
        return getState();
    }

    function update(dt) {
        if (!etat || !etat.active) { return; }
        etat.timeLeft -= dt;
        if (etat.timeLeft <= 0) {
            echouer('Temps écoulé');
            return;
        }
        majHud();
        dessiner();
    }

    function pointer(x, y) {
        if (!etat || !etat.active) { return; }
        if (!etat.tracing) { pointerDown(x, y); }
        if (etat && etat.tracing) { pointerMove(x, y); }
    }

    function getState() {
        if (!etat) { return null; }
        return {
            active: etat.active,
            progress: etat.progress,
            timeLeft: etat.timeLeft,
            nbPoints: etat.points.length,
            start: { x: etat.points[0].x, y: etat.points[0].y },
            end: {
                x: etat.points[etat.points.length - 1].x,
                y: etat.points[etat.points.length - 1].y
            }
        };
    }

    function getPath() {
        return etat ? etat.points.map(function (p) { return { x: p.x, y: p.y }; }) : [];
    }

    function coords(event) {
        const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
        if (!rect || !rect.width || !rect.height) { return null; }
        const scaleX = rect.width / largeur();
        const scaleY = rect.height / hauteur();
        return {
            x: (event.clientX - rect.left) / scaleX,
            y: (event.clientY - rect.top) / scaleY,
            scaleX,
            scaleY
        };
    }

    if (canvas.addEventListener) {
        canvas.addEventListener('pointerdown', function (event) {
            const p = coords(event);
            if (!p || !pointerDown(p.x, p.y, p.scaleX, p.scaleY)) { return; }
            canvas.setPointerCapture?.(event.pointerId);
            event.preventDefault?.();
        });
        canvas.addEventListener('pointermove', function (event) {
            const p = coords(event);
            if (p) { pointerMove(p.x, p.y, p.scaleX, p.scaleY); }
        });
        canvas.addEventListener('lostpointercapture', pointerUp);
        canvas.addEventListener('pointerup', pointerUp);
        canvas.addEventListener('pointercancel', pointerUp);
    }

    return {
        ouvrir: ouvrir,
        fermer: fermer,
        update: update,
        pointer: pointer,
        pointerDown: pointerDown,
        pointerMove: pointerMove,
        pointerUp: pointerUp,
        abandonner: function () { echouer('Abandon'); },
        setDuree: function (sec) { duree = Math.max(1, Number(sec) || DUREE_DEFAUT); },
        setTimeLeft: function (sec) { if (etat) { etat.timeLeft = Math.max(0, Number(sec) || 0); } },
        getState: getState,
        getPath: getPath,
        estActif: function () { return !!etat && etat.active; }
    };
}

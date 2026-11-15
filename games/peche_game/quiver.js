// ---------------------------------------------------------------------------
// quiver.js — MODE QUIVER (scion de canne).
//
// Module autonome : il dessine l'indicateur de scion, mémorise le mouvement
// courant et décide quand le panneau doit être visible. Le jeu principal lui
// envoie les mouvements du catalogue de touches (m.y, m.rot, m.dx).
// ---------------------------------------------------------------------------
export function creerModeQuiver(options) {
    const opts = options || {};
    const canvas = opts.canvas || null;
    const panel = opts.panel || null;
    let actif = false;
    let bend = 0;
    let rot = 0;
    let twitch = 0;

    function dessiner() {
        if (!canvas) { return; }
        if (!canvas.width) { canvas.width = 240; }
        if (!canvas.height) { canvas.height = 80; }
        const g = canvas.getContext ? canvas.getContext('2d') : null;
        if (!g) { return; }
        const w = canvas.width;
        const h = canvas.height;
        const b = Math.max(-1.2, Math.min(1.2, bend));
        const tx = w - 24 + twitch * 10;
        const ty = h * 0.34 + b * h * 0.28 + rot * 6;
        g.clearRect(0, 0, w, h);
        g.lineCap = 'round';
        g.strokeStyle = '#5a3d20';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(14, h - 10);
        g.quadraticCurveTo(w * 0.56, h * 0.48 + b * 16, tx, ty);
        g.stroke();
        g.strokeStyle = '#d8b06a';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(14, h - 10);
        g.quadraticCurveTo(w * 0.56, h * 0.48 + b * 16, tx, ty);
        g.stroke();
        g.fillStyle = '#ff6b57';
        g.beginPath();
        g.arc(tx, ty, 4.5, 0, Math.PI * 2);
        g.fill();
    }

    function reset() {
        bend = 0;
        rot = 0;
        twitch = 0;
        if (actif) { dessiner(); }
    }

    function setPanneau(etat) {
        if (!panel) { return; }
        // Le scion sert à lire les touches dès que la ligne est dans l’eau.
        const visible = actif && (etat === 'inWater' || etat === 'bite');
        panel.classList.toggle('active', visible);
        panel.setAttribute('aria-hidden', String(!visible));
    }

    function setActif(value) {
        actif = !!value;
        if (!actif) {
            reset();
            setPanneau('idle');
            return;
        }
        setPanneau('idle');
        dessiner();
    }

    function appliquer(m) {
        if (!actif || !m) { return; }
        bend = -(m.y || 0) * 2.4;
        rot = (m.rot || 0) * 1.2;
        twitch = (m.dx || 0) * 0.35;
        dessiner();
    }

    function update(dt, etat) {
        if (!actif) { return; }
        if (etat !== 'bite') {
            const k = Math.min(1, Math.max(0, dt) * 6);
            bend += (0 - bend) * k;
            rot += (0 - rot) * k;
            twitch += (0 - twitch) * k;
        }
        setPanneau(etat);
        dessiner();
    }

    return {
        setActif: setActif,
        estActif: function () { return actif; },
        appliquer: appliquer,
        update: update,
        reset: reset,
        dessiner: dessiner,
        getBend: function () { return bend; },
        getMotion: function () { return { bend: bend, rot: rot, twitch: twitch }; },
        isPanneauVisible: function () { return !!panel && panel.classList.contains('active'); }
    };
}

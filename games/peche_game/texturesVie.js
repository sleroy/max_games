// ---------------------------------------------------------------------------
// texturesVie.js — TEXTURES PROCÉDURALES des oiseaux et des libellules (v244).
//
// Oiseaux : plumage 128 × 64 par espèce, en deux variantes :
//   - « corps » : u = le long du corps (0 = bec → 1 = base de la queue),
//     v = tour du corps (0 = ventre, 1 = dos) ; dégradé dos → ventre et
//     rangées de petites plumes ;
//   - « aile » : u = envergure (0 = épaule → 1 = bout), v = corde
//     (0 = bord d'attaque → 1 = bord de fuite) ; liseré clair en avant,
//     séparations de rémiges vers l'arrière.
// Libellule : aile 128 × 64 sur fond TRANSPARENT (membrane à peine teintée,
// nervures, ptérostigma) et abdomen 128 × 32 (10 segments sombres).
//
// Comme texturesPoisson.js, le dessin n'utilise que fillRect, chemins,
// dégradés linéaires et clearRect : le faux canvas des tests Node suffit.
// ---------------------------------------------------------------------------
import * as THREE from 'three';

export const LARGEUR_PLUMAGE = 128;
export const HAUTEUR_PLUMAGE = 64;
export const LARGEUR_AILE = 128;
export const HAUTEUR_AILE = 64;
export const LARGEUR_ABDOMEN = 128;
export const HAUTEUR_ABDOMEN = 32;

const _textures = {};

// --- Couleurs ---------------------------------------------------------------
function rgb(c) {
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

function css(c, alpha) {
    const [r, g, b] = rgb(c);
    return alpha === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')'
        : 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')';
}

export function melanger(c1, c2, f) {
    const a = rgb(c1);
    const b = rgb(c2);
    const r = Math.round(a[0] + (b[0] - a[0]) * f);
    const g = Math.round(a[1] + (b[1] - a[1]) * f);
    const bl = Math.round(a[2] + (b[2] - a[2]) * f);
    return (r << 16) | (g << 8) | bl;
}

// --- Plumage ----------------------------------------------------------------
// `couleurs` : { dos, ventre, aile } en hexadécimal.
export function dessinerPlumage(g, W, H, couleurs, partie) {
    if (partie === 'aile') {
        const aile = couleurs.aile !== undefined ? couleurs.aile : 0x2a2a33;
        g.fillStyle = css(aile);
        g.fillRect(0, 0, W, H);
        // Bord d'attaque (couvertures) un peu plus clair.
        g.fillStyle = css(melanger(aile, 0xffffff, 0.22), 0.55);
        g.fillRect(0, 0, W, Math.max(1, H * 0.12));
        // Bord de fuite plus sombre : les extrémités des rémiges.
        g.fillStyle = css(melanger(aile, 0x000000, 0.5), 0.7);
        g.fillRect(0, H * 0.84, W, H * 0.16);
        // Séparations des rémiges : lignes presque parallèles à la corde.
        g.strokeStyle = css(melanger(aile, 0x000000, 0.45), 0.42);
        g.lineWidth = 1;
        for (let x = 3; x < W; x += 9) {
            g.beginPath();
            g.moveTo(x, H * 0.22);
            g.lineTo(x + 3, H);
            g.stroke();
        }
        // Raies claires du plumage (reflet).
        g.fillStyle = css(melanger(aile, 0xffffff, 0.3), 0.14);
        for (let x = 7; x < W; x += 19) {
            g.fillRect(x, H * 0.18, 2, H * 0.64);
        }
        return true;
    }

    const dos = couleurs.dos !== undefined ? couleurs.dos : 0x2a2a33;
    const ventre = couleurs.ventre !== undefined ? couleurs.ventre : 0x8a8a92;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, css(melanger(dos, 0x000000, 0.12)));
    grad.addColorStop(0.4, css(dos));
    grad.addColorStop(0.58, css(ventre));
    grad.addColorStop(1, css(melanger(ventre, 0xffffff, 0.12)));
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // Petites plumes du dos : arcs en écailles, du bec vers la queue.
    g.strokeStyle = css(melanger(dos, 0x000000, 0.4), 0.34);
    g.lineWidth = 1;
    for (let y = 3; y < H * 0.5; y += 5) {
        for (let x = ((y / 5) % 2) * 4; x < W; x += 8) {
            g.beginPath();
            g.moveTo(x, y);
            g.quadraticCurveTo(x + 4, y + 3, x + 8, y);
            g.stroke();
        }
    }
    // Ventre : fines stries claires dans l'axe du corps.
    g.fillStyle = css(melanger(ventre, 0xffffff, 0.35), 0.25);
    for (let y = H * 0.62; y < H - 2; y += 4) {
        g.fillRect(2, y, W - 4, 1);
    }
    // Tête plus sombre (capuchon) : bande verticale au ras du bec.
    g.fillStyle = css(melanger(dos, 0x000000, 0.2), 0.35);
    g.fillRect(0, 0, 10, H);
    return true;
}

export function texturePlumage(id, couleurs, partie) {
    const cle = 'plumage:' + id + ':' + (partie || 'corps');
    if (_textures[cle]) {
        return _textures[cle];
    }
    const canvas = document.createElement('canvas');
    canvas.width = LARGEUR_PLUMAGE;
    canvas.height = HAUTEUR_PLUMAGE;
    dessinerPlumage(canvas.getContext('2d'), LARGEUR_PLUMAGE, HAUTEUR_PLUMAGE, couleurs, partie);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    _textures[cle] = texture;
    return texture;
}

// --- Aile de libellule ------------------------------------------------------
export function dessinerAileLibellule(g, W, H, couleurs) {
    const nervure = couleurs.nervure !== undefined ? couleurs.nervure : 0x22313a;
    const membrane = couleurs.membrane !== undefined ? couleurs.membrane : 0xdcefff;
    g.clearRect(0, 0, W, H);
    // Membrane : à peine visible, bleutée.
    g.fillStyle = css(membrane, 0.16);
    g.fillRect(0, 0, W, H);
    // Costa (bord d'attaque) : nervure épaisse.
    g.strokeStyle = css(nervure, 0.85);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 1.5);
    g.lineTo(W, 1.5);
    g.stroke();
    // Nervures longitudinales.
    g.lineWidth = 0.8;
    [0.18, 0.36, 0.54, 0.72, 0.88].forEach(function (f) {
        g.strokeStyle = css(nervure, 0.50 - f * 0.28);
        g.beginPath();
        g.moveTo(0, Math.round(H * f));
        g.lineTo(W, Math.round(H * f));
        g.stroke();
    });
    // Nervures transversales : mailles allongées.
    g.strokeStyle = css(nervure, 0.38);
    g.lineWidth = 0.7;
    for (let x = 6; x < W; x += 9) {
        g.beginPath();
        g.moveTo(x, 2);
        g.lineTo(x + 1, H * 0.9);
        g.stroke();
    }
    // Ptérostigma (tache sombre près du bout).
    g.fillStyle = css(0x2a2520, 0.85);
    g.fillRect(Math.round(W * 0.8), 2, Math.round(W * 0.09), 6);
    return true;
}

export function textureAileLibellule(id, couleurs) {
    const cle = 'aile-libellule:' + id;
    if (_textures[cle]) {
        return _textures[cle];
    }
    const canvas = document.createElement('canvas');
    canvas.width = LARGEUR_AILE;
    canvas.height = HAUTEUR_AILE;
    dessinerAileLibellule(canvas.getContext('2d'), LARGEUR_AILE, HAUTEUR_AILE, couleurs);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    _textures[cle] = texture;
    return texture;
}

// --- Abdomen de libellule ---------------------------------------------------
export function dessinerAbdomen(g, W, H, couleurs) {
    const corps = couleurs.corps !== undefined ? couleurs.corps : 0x2d7ba0;
    g.fillStyle = css(corps);
    g.fillRect(0, 0, W, H);
    // Ligne dorsale sombre (haut du canvas = dos).
    g.fillStyle = css(melanger(corps, 0x000000, 0.55), 0.6);
    g.fillRect(0, 0, W, 3);
    // 10 segments : anneaux sombres et tache claire sur les flancs.
    for (let i = 1; i < 10; i++) {
        const x = Math.round((i * W) / 10);
        g.fillStyle = css(melanger(corps, 0x000000, 0.5), 0.6);
        g.fillRect(x - 1, 0, 2, H);
        g.fillStyle = css(melanger(corps, 0xffffff, 0.4), 0.5);
        g.fillRect(x - 4, Math.round(H * 0.42), 2, 2);
    }
    // Bout de l'abdomen (cerques) plus sombre.
    g.fillStyle = css(melanger(corps, 0x000000, 0.45), 0.7);
    g.fillRect(Math.round(W * 0.94), 0, Math.round(W * 0.06), H);
    return true;
}

export function textureAbdomenLibellule(id, couleurs) {
    const cle = 'abdomen-libellule:' + id;
    if (_textures[cle]) {
        return _textures[cle];
    }
    const canvas = document.createElement('canvas');
    canvas.width = LARGEUR_ABDOMEN;
    canvas.height = HAUTEUR_ABDOMEN;
    dessinerAbdomen(canvas.getContext('2d'), LARGEUR_ABDOMEN, HAUTEUR_ABDOMEN, couleurs);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    _textures[cle] = texture;
    return texture;
}

// ---------------------------------------------------------------------------
// texturesPoisson.js — TEXTURES PROCÉDURALES des poissons 3D (corps + nageoires).
//
// Corps : une texture 256 × 128 par espèce (cache par `espece.id`), dessinée
// comme une vue de profil « déroulée » :
//   - x (u) = le long du corps : 0 = museau (à gauche) → 256 = pédoncule ;
//   - y (v) = le tour du corps : haut du canvas = DOS, bas = VENTRE ; les deux
//     flancs lisent la même texture (miroir), donc le motif est visible des
//     deux côtés et sans couture.
// Nageoires : une texture 128 × 64 de RAYONS (lignes le long de la nageoire),
// teintée par la couleur des nageoires ; variante « taches » (brochet).
//
// Le dessin n'utilise que fillRect, arc/ellipse, chemins et dégradés linéaires :
// il marche aussi avec le faux canvas des tests Node.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { dessinerBandeLaterale } from './motifBande.js?v=238';

export const LARGEUR_TEXTURE = 256;
export const HAUTEUR_TEXTURE = 128;

const _texturesCorps = {};
const _texturesNageoire = {};

// --- Couleurs ---------------------------------------------------------------
function rgb(c) {
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

export function melanger(c1, c2, f) {
    const a = rgb(c1);
    const b = rgb(c2);
    const r = Math.round(a[0] + (b[0] - a[0]) * f);
    const g = Math.round(a[1] + (b[1] - a[1]) * f);
    const bl = Math.round(a[2] + (b[2] - a[2]) * f);
    return (r << 16) | (g << 8) | bl;
}

function css(c, alpha) {
    const [r, g, b] = rgb(c);
    return alpha === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')'
        : 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')';
}

// Couleurs du corps d'une espèce : dos, flanc, ventre (+ teinte du motif).
// Sans valeurs mesurées, le dos et le ventre sont déduits de `couleur`.
export function couleursEspece(espece) {
    const flanc = espece && espece.couleur !== undefined ? espece.couleur : 0xb09a6a;
    return {
        dos: espece && espece.dos !== undefined ? espece.dos : melanger(flanc, 0x141a10, 0.42),
        flanc: flanc,
        ventre: espece && espece.ventre !== undefined ? espece.ventre : melanger(flanc, 0xf0ead6, 0.55),
        motif: espece && espece.teinteMotif !== undefined ? espece.teinteMotif : null
    };
}

// Hasard déterministe (mulberry32) : même espèce = même motif à chaque partie.
function hasard(graine) {
    let a = graine >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function graineDe(texte) {
    let h = 2166136261;
    for (let i = 0; i < texte.length; i++) {
        h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
    }
    return h >>> 0;
}

function tache(g, x, y, rx, ry, angle) {
    g.beginPath();
    g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), angle || 0, 0, Math.PI * 2);
    g.fill();
}

// --- Motifs -----------------------------------------------------------------
// Chaque motif reçoit (g, W, H, couleurs, aleatoire, espece). Le canvas est
// une vue de profil : y = 0 dos, y = H ventre, x = 0 museau.
const MOTIFS = {
    aucun: function () { /* robe unie (anguille) : le dégradé suffit */ },

    // Écailles en filet (carpe, brème, carassin) : un arc par écaille, ouvert
    // vers la tête, reflet clair au centre. `espece.ecailles` = écailles sur la
    // longueur (ligne latérale).
    ecailles: function (g, W, H, c, aleatoire, espece) {
        const colonnes = (espece && espece.ecailles) || 40;
        const pas = W / colonnes;
        // `rangsEcailles` : nombre de rangées du dos au ventre (sinon écailles un peu plus larges que
        // hautes) ; l'arc de chaque écaille suit alors la hauteur d'une rangée.
        const rangs = (espece && espece.rangsEcailles) || Math.round(H / (pas * 1.05));
        const pasY = H / rangs;
        const etireArc = espece && espece.rangsEcailles ? pasY / (pas * 1.05) : 1;
        const sombre = melanger(c.flanc, 0x000000, 0.6);
        const clair = melanger(c.flanc, 0xffffff, 0.35);
        const debut = W * ((espece && espece.debutEcailles) || 0.22);   // la tête n'a pas d'écailles
        // Options propres à l'espèce (défauts = filet régulier d'origine) :
        //   contrasteEcailles (1) : force du dessin ; irregulariteEcailles (0) : décalage
        //   aléatoire des écailles (fraction de leur taille) ; ecaillesVentre (0) : part
        //   du dessin effacée vers le ventre (0 = aucune, 1 = totale).
        const contraste = espece && espece.contrasteEcailles !== undefined ? espece.contrasteEcailles : 1;
        const desordre = (espece && espece.irregulariteEcailles) || 0;
        const ventre = (espece && espece.ecaillesVentre) || 0;
        // `reflet` (0) : voile doré le long du flanc (carpe), sous le dessin des écailles.
        const reflet = espece && espece.reflet || 0;
        if (reflet) {
            const voile = g.createLinearGradient(0, H * 0.18, 0, H * 0.8);
            voile.addColorStop(0, css(0xe8c878, 0));
            voile.addColorStop(0.45, css(0xe8c878, reflet));
            voile.addColorStop(1, css(0xe8c878, 0));
            g.fillStyle = voile;
            g.fillRect(debut, H * 0.18, W - debut, H * 0.62);
        }
        g.lineWidth = Math.max(0.8, pas * 0.24);
        for (let r = 0; r <= rangs; r++) {
            const v = r / rangs;   // 0 = dos, 1 = ventre
            const attenue = 1 - ventre * Math.max(0, Math.min(1, (v - 0.5) / 0.45));
            for (let k = -1; k <= colonnes; k++) {
                // (le hasard n'est tiré que si l'espèce le demande : les autres robes restent identiques)
                const dx = desordre ? (aleatoire() - 0.5) * desordre * pas : 0;
                const dy = desordre ? (aleatoire() - 0.5) * desordre * pasY : 0;
                const x = (k + (r % 2) * 0.5) * pas + pas * 0.9 + dx;
                const y = r * pasY + dy;
                const force = contraste * attenue * (desordre ? 1 - desordre * 0.5 * aleatoire() : 1);
                if (x < debut) { continue; }
                // pas de bord net derrière l'ouïe (fondu plus long si l'espèce adoucit sa tête)
                const largeurFondu = W * (0.05 + 0.12 * ((espece && espece.fonduTete) || 0));
                const fondu = Math.min(1, (x - debut) / largeurFondu) * force;
                g.fillStyle = css(clair, (0.05 + aleatoire() * 0.08) * fondu);
                tache(g, x - pas * 0.3, y, pas * 0.36, pasY * 0.38, 0);
                g.strokeStyle = css(sombre, 0.5 * fondu);
                g.beginPath();
                if (etireArc === 1) {
                    g.arc(x - pas * 0.55, y, pas * 0.62, -1.15, 1.15);
                } else {
                    g.ellipse(x - pas * 0.55, y, pas * 0.62, pas * 0.62 * etireArc, 0, -1.15, 1.15);
                }
                g.stroke();
            }
        }
    },

    // Reflet argenté (gardon, ablette, chevesne) : fines écailles + bande brillante. L'espèce peut
    // régler le dessin des écailles (mêmes options que `ecailles`) et `refletArgent` (0,38) : opacité
    // de la bande brillante ; `refletFondu` (0) : largeur du fondu du reflet derrière l'ouïe (sinon bord net à 0,18).
    argent: function (g, W, H, c, aleatoire, espece) {
        MOTIFS.ecailles(g, W, H, c, aleatoire, Object.assign({}, espece, { ecailles: (espece && espece.ecailles) || 46 }));
        const alphaReflet = espece && espece.refletArgent !== undefined ? espece.refletArgent : 0.38;
        const fondu = (espece && espece.refletFondu) || 0;
        for (let i = fondu ? 0 : 10; i <= 10; i++) {   // i < 10 : bandes du fondu ; i = 10 : reflet plein
            const x0 = W * (0.18 + fondu * i / 10), x1 = i === 10 ? W : W * (0.18 + fondu * (i + 1) / 10);
            const reflet = g.createLinearGradient(0, H * 0.3, 0, H * 0.75);
            reflet.addColorStop(0, 'rgba(255,255,255,0)');
            reflet.addColorStop(0.5, 'rgba(235,242,248,' + alphaReflet * (i === 10 ? 1 : (i + 0.5) / 10) + ')');
            reflet.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = reflet; g.fillRect(x0, H * 0.3, x1 - x0, H * 0.45);
        }
    },

    // Barres verticales sombres (perche). Sans `espece.rayures` : 7 barres du dos au
    // milieu du flanc. Avec : une liste { t, large, pente, d } par barre (t = place le
    // long du corps, large = largeur en fraction de LS, pente = décalage vers l'arrière
    // au bas de la barre, d = profondeur atteinte, en part de la hauteur du corps).
    // Si l'espèce définit `ecailles`, de fines écailles sont dessinées dessous ; si elle
    // définit `tachesJoue`, des plages sombres tachent l'opercule.
    rayures: function (g, W, H, c, aleatoire, espece) {
        const liste = espece && espece.rayures;
        if (!liste) {
            g.fillStyle = css(melanger(c.dos, 0x0a120a, 0.45), 0.62);
            for (let i = 0; i < 7; i++) {
                const x = W * (0.3 + i * 0.095) + (aleatoire() - 0.5) * 4;
                const l = W * (i === 0 || i === 6 ? 0.03 : 0.042);
                g.beginPath();
                g.moveTo(x - l, 0);
                g.lineTo(x + l, 0);
                g.quadraticCurveTo(x + l * 0.6, H * 0.4, x + l * 0.15, H * (0.6 + aleatoire() * 0.08));
                g.quadraticCurveTo(x - l * 0.6, H * 0.4, x - l, 0);
                g.fill();
            }
            return;
        }
        if (espece.ecailles) {
            MOTIFS.ecailles(g, W, H, c, aleatoire, espece);
        }
        // Plages sombres sur l'opercule et la joue (taches irrégulières, contraste modéré).
        const joue = melanger(c.dos, 0x0a0f08, 0.3);
        for (let i = 0; i < (espece.tachesJoue || 0); i++) {
            g.fillStyle = css(joue, 0.12 + aleatoire() * 0.14);
            tache(g, W * (0.15 + aleatoire() * 0.12), H * (0.32 + aleatoire() * 0.36),
                W * (0.012 + aleatoire() * 0.016), H * (0.04 + aleatoire() * 0.05), aleatoire() * 3);
        }
        const encre = melanger(c.dos, 0x050a05, 0.4);
        // `forceRayures` (1) : opacité des barres (très discrètes chez le sandre).
        const forceBarre = espece.forceRayures !== undefined ? espece.forceRayures : 1;
        liste.forEach(function (b) {
            const bas = Math.acos(1 - 2 * b.d) / Math.PI;      // y/H du bout de la barre
            const N = 14;
            const gauche = [];
            const droite = [];
            for (let k = 0; k <= N; k++) {
                const f = k / N;                                // 0 dos → 1 bout
                const y = H * bas * f;
                const d = (1 - Math.cos(Math.PI * y / H)) / 2;   // hauteur parcourue (0 → 1)
                // pente vers l'arrière, élargie en haut, bout arrondi, bords irréguliers
                // (ondulation lente : les barres d'une perche ne sont pas des bandes régulières)
                const centre = W * (b.t + b.pente * d) + (aleatoire() - 0.5) * 1.2
                    + Math.sin(f * 5 + b.t * 31) * W * 0.006 * f;
                const demi = W * b.large * 0.5 * (1 - 0.4 * f * f) * Math.sqrt(Math.max(0, 1 - Math.pow(f, 5)));
                gauche.push([centre - demi - aleatoire() * 1.1, y]);
                droite.push([centre + demi + aleatoire() * 1.1, y]);
            }
            [[1.5, 0.2], [0.9, 0.28], [0, 0.7]].forEach(function (couche) {
                g.fillStyle = css(encre, couche[1] * forceBarre);
                g.beginPath();
                g.moveTo(gauche[0][0] - couche[0], gauche[0][1]);
                gauche.forEach(p => g.lineTo(p[0] - couche[0], p[1]));
                for (let k = N; k >= 0; k--) { g.lineTo(droite[k][0] + couche[0], droite[k][1]); }
                g.fill();
            });
        });
    },

    // Sandre : un point sombre par écaille sur le dos et le haut du flanc (effacés vers le ventre
    // et la tête), puis de larges barres verticales très discrètes. Options de l'espèce :
    // `pointsEcailles` (0 = aucun ; force 0-1), `ecailles` (écailles sur la longueur), `debutEcailles`,
    // `barres` (liste { t, large, pente, d } comme `rayures`), `forceRayures` (opacité des barres).
    // Sans `barres` : l'ancien dessin de 9 selles diffuses.
    barres: function (g, W, H, c, aleatoire, espece) {
        const bandes = espece && espece.barres;
        if (!bandes) {
            g.fillStyle = css(melanger(c.dos, 0x000000, 0.3), 0.35);
            for (let i = 0; i < 9; i++) {
                tache(g, W * (0.28 + i * 0.08), H * 0.18, W * 0.022, H * 0.3, (aleatoire() - 0.5) * 0.3);
            }
            return;
        }
        const force = espece.pointsEcailles || 0;
        if (force) {
            // La texture est plus étirée en v qu'en u (≈ 1,9 px de v pour 1 px de u par unité de
            // longueur) : une écaille ronde occupe donc pas × (pas × ETIRE) pixels.
            const ETIRE = 1.9;
            const colonnes = espece.ecailles || 60;
            const pas = W / colonnes;
            const pasY = pas * ETIRE;
            const rangs = Math.floor(H * 0.64 / pasY);
            const encre = melanger(c.dos, 0x050805, 0.45);
            const debut = W * (espece.debutEcailles || 0.25);
            for (let r = 0; r <= rangs; r++) {
                const v = (r + 0.5) / (rangs + 1) * 0.64;           // 0 = dos
                const attenue = Math.max(0, 1 - Math.pow(v / 0.64, 1.6));
                for (let k = -1; k <= colonnes; k++) {
                    const x = (k + (r % 2) * 0.5) * pas + pas * 0.8 + (aleatoire() - 0.5) * pas * 0.5;
                    const y = v * H + (aleatoire() - 0.5) * pasY * 0.4;
                    const alpha = force * attenue * (0.55 + aleatoire() * 0.75);
                    if (x < debut) { continue; }
                    const fondu = Math.min(1, (x - debut) / (W * 0.08));
                    g.fillStyle = css(encre, Math.min(0.9, alpha * fondu));
                    tache(g, x, y, pas * 0.3, pasY * 0.28, 0);
                }
            }
        }
        MOTIFS.rayures(g, W, H, c, aleatoire, Object.assign({}, espece, { rayures: bandes, ecailles: 0 }));
    },

    // Bande latérale de taches soudées (black-bass) : dessin et options dans motifBande.js.
    bandeLaterale: function (g, W, H, c, aleatoire, espece) {
        dessinerBandeLaterale(g, W, H, c, aleatoire, espece, { css: css, melanger: melanger, tache: tache, ecailles: MOTIFS.ecailles });
    },

    // Peau muqueuse presque lisse (tanche) : beaucoup de plages claires et sombres très transparentes (pas de
    // disque visible), puis écailles minuscules à peine marquées (options du motif « ecailles »).
    peauFine: function (g, W, H, c, aleatoire, espece) {
        const clair = melanger(c.flanc, 0xf0e8b0, 0.3), sombre = melanger(c.dos, 0x000000, 0.15);
        for (let i = 0; i < 90; i++) {
            const v = aleatoire() * 0.75;
            const cx = W * (0.14 + aleatoire() * 0.86);
            const rx = W * (0.05 + aleatoire() * 0.1), ry = H * (0.04 + aleatoire() * 0.08);
            const foncee = v < 0.3 ? aleatoire() < 0.7 : aleatoire() < 0.3;
            g.fillStyle = css(foncee ? sombre : clair, foncee ? 0.03 + aleatoire() * 0.04 : 0.025 + aleatoire() * 0.035);
            tache(g, cx, v * H, rx, ry, (aleatoire() - 0.5) * 0.5);
        }
        MOTIFS.ecailles(g, W, H, c, aleatoire, espece);
    },

    // Rangée de taches rondes le long de la ligne latérale (goujon).
    taches: function (g, W, H, c, aleatoire) {
        g.fillStyle = css(melanger(c.dos, 0x000000, 0.45), 0.6);
        for (let i = 0; i < 9; i++) {
            tache(g, W * (0.26 + i * 0.085), H * 0.5, W * 0.016, H * 0.06);
        }
        g.fillStyle = css(melanger(c.dos, 0x000000, 0.4), 0.4);
        for (let i = 0; i < 160; i++) {
            tache(g, W * (0.15 + aleatoire() * 0.85), H * aleatoire() * 0.4, 1.2, 1);
        }
    },

    // Taches claires en grain de haricot sur fond olive (brochet).
    // Dessinées en unités « physiques » (la texture est étirée : ~2,4 px de v pour
    // 1 px de u par unité de longueur), donc de vrais grains ronds-allongés à l'écran.
    // Options de l'espèce : tachesDebut (0,34 : fraction de W où les taches commencent,
    // la tête n'en porte pas), tachesDensite (1), tachesTaille (1).
    tachesClaires: function (g, W, H, c, aleatoire, espece) {
        const ETIRE = 2.4;
        const debut = ((espece && espece.tachesDebut) !== undefined ? espece.tachesDebut : 0.34) * W;
        const densite = (espece && espece.tachesDensite) || 1;
        const taille = (espece && espece.tachesTaille) || 1;
        const clair = c.motif !== null ? c.motif : melanger(c.flanc, 0xffffff, 0.45);
        const sombre = melanger(c.dos, 0x000000, 0.35);
        const lumiere = melanger(c.flanc, c.motif !== null ? c.motif : 0xffffff, 0.3);
        const hPhys = H / ETIRE;
        // (pas de transformations du contexte : le faux canvas des tests n'en a pas ;
        // on convertit nous-mêmes les unités physiques en pixels de texture.)
        // Marbrure du fond : plages vert foncé sur le dos, un peu de lumière sur le flanc.
        for (let i = 0; i < 90; i++) {
            const v = Math.pow(aleatoire(), 1.3) * 0.8;
            g.fillStyle = css(v < 0.42 ? sombre : lumiere, v < 0.42 ? 0.1 + aleatoire() * 0.1 : 0.05 + aleatoire() * 0.05);
            const xm = debut * 0.9 + aleatoire() * (W - debut * 0.9);
            tache(g, xm, v * H, 3 + aleatoire() * 6, (1.5 + aleatoire() * 3) * ETIRE, aleatoire() * Math.PI);
        }
        // Grains de haricot : grille irrégulière (décalage, vides, amas), jamais en lignes.
        const pas = 6.2 / Math.sqrt(densite);
        const rangs = Math.floor(hPhys * 0.82 / pas);
        for (let k = 0; debut + k * pas < W + pas; k++) {
            for (let r = 0; r < rangs; r++) {
                if (aleatoire() > 0.78 * Math.min(1, densite)) { continue; }
                const x = debut + (k + (r % 2) * 0.5 + (aleatoire() - 0.5) * 0.95) * pas;
                const v = 0.09 + (r + 0.5 + (aleatoire() - 0.5) * 0.95) / rangs * 0.73;
                if (x >= W || v > 0.84) { continue; }
                // plus grosses et plus nettes au milieu du flanc, rares vers le ventre
                const milieu = Math.max(0, 1 - Math.abs(v - 0.42) * 2.2);
                const entree = Math.min(1, (x - debut) / (W * 0.08));        // pas de bord net derrière l'ouïe
                const bas = v > 0.62 ? Math.max(0, 1 - (v - 0.62) / 0.22) : 1;
                const force = entree * bas;
                if (force < 0.12) { continue; }
                const longueur = (2.2 + milieu * 2.4 + aleatoire() * 2.2) * taille * (0.55 + 0.45 * entree);
                const epais = (0.75 + milieu * 0.55 + aleatoire() * 0.5) * taille;
                const rayon = longueur / 1.1;
                const ouverture = 0.3 + aleatoire() * 0.35;
                const rotation = (aleatoire() - 0.5) * 2.6;
                aleatoire();   // (tirage conservé : même suite de hasard qu'avec le décalage de l'arc)
                g.fillStyle = css(clair, (0.3 + aleatoire() * 0.34) * force);
                // le grain suit un arc court : une chaîne de petites ellipses, plus fines aux bouts
                const n = Math.max(3, Math.round(longueur / (epais * 0.7)));
                for (let i = 0; i <= n; i++) {
                    const a = -ouverture + 2 * ouverture * i / n;
                    const px = rayon * Math.cos(a) - rayon * Math.cos(ouverture * 0.5);
                    const py = rayon * Math.sin(a);
                    const qx = px * Math.cos(rotation) - py * Math.sin(rotation);
                    const qy = px * Math.sin(rotation) + py * Math.cos(rotation);
                    const fin = 0.55 + 0.45 * Math.sin(Math.PI * i / n);
                    tache(g, x + qx, (v * hPhys + qy) * ETIRE, epais * 0.5 * fin, epais * 0.5 * fin * ETIRE, 0);
                }
            }
        }
    },

    // Points noirs + points rouges à halo clair (truite). Options de l'espèce :
    // `pointsNoirs` (nombre, défaut 80) : points sombres du dos et du haut du flanc, plus quelques-uns
    // sur l'ouïe ; `pointsRouges` (nombre, défaut 18) : points rouges du milieu du flanc, de l'ouïe à la
    // queue. Semis irrégulier (distance minimale entre points) ; la texture est plus étirée en v au
    // sommet du dos, les points y sont donc allongés pour rester ronds vus de côté.
    pointsRouges: function (g, W, H, c, aleatoire, espece) {
        const nbNoirs = espece && espece.pointsNoirs !== undefined ? espece.pointsNoirs : 80;
        const nbRouges = espece && espece.pointsRouges !== undefined ? espece.pointsRouges : 18;
        const encre = melanger(c.dos, 0x000000, 0.8);
        const pale = melanger(c.flanc, 0xffffff, 0.55);
        const rouge = 0xa83c2e;
        const posees = [];
        // hauteur apparente (0 = dos, 1 = ventre) -> ordonnée de la texture
        const vDe = f => Math.acos(1 - 2 * f) / Math.PI;
        // pas apparent d'un pixel de v par rapport à un pixel de u, à la hauteur v
        const etire = v => Math.min(2.4, 1.25 / Math.max(0.05, Math.sin(Math.PI * v)));
        function poser(x0, x1, f0, f1, rayon, ecart, forme) {
            for (let essai = 0; essai < 24; essai++) {
                const x = W * (x0 + aleatoire() * (x1 - x0));
                const f = f0 + (f1 - f0) * (forme ? forme(aleatoire()) : aleatoire());
                const v = vDe(f);
                const y = v * H;
                const e = etire(v);
                let libre = true;
                for (let k = 0; k < posees.length; k++) {
                    const dx = posees[k][0] - x;
                    const dy = (posees[k][1] - y) / e;
                    if (dx * dx + dy * dy < ecart * ecart) { libre = false; break; }
                }
                if (libre) {
                    posees.push([x, y]);
                    return { x: x, y: y, e: e, rx: rayon * (0.8 + aleatoire() * 0.5) };
                }
            }
            return null;
        }
        // Points noirs : plus serrés sur le dos, de plus en plus rares vers le bas du flanc.
        for (let i = 0; i < nbNoirs; i++) {
            const p = poser(0.19, 0.985, 0.03, 0.62, 1.3, 4.2, a => Math.pow(a, 1.35));
            if (!p) { continue; }
            const a = (aleatoire() - 0.5) * 0.7;
            if (aleatoire() < 0.3) {
                g.fillStyle = css(pale, 0.16);
                tache(g, p.x, p.y, p.rx + 0.9, (p.rx + 0.9) * p.e, a);
            }
            g.fillStyle = css(encre, 0.55 + aleatoire() * 0.3);
            tache(g, p.x, p.y, p.rx, p.rx * p.e * (0.85 + aleatoire() * 0.3), a);
        }
        // Quelques points sur l'ouïe et la joue, et sur le museau.
        for (let i = 0; i < 7; i++) {
            const p = poser(0.1, 0.27, 0.12, 0.55, 1.05, 4.2);
            if (!p) { continue; }
            g.fillStyle = css(encre, 0.45 + aleatoire() * 0.25);
            tache(g, p.x, p.y, p.rx, p.rx * p.e, (aleatoire() - 0.5) * 0.7);
        }
        // Points rouges : un cœur rouge-brun, un halo clair à peine plus large.
        for (let i = 0; i < nbRouges; i++) {
            const p = poser(0.27, 0.975, 0.3, 0.7, 1.35, 5.5);
            if (!p) { continue; }
            g.fillStyle = css(pale, 0.3);
            tache(g, p.x, p.y, p.rx + 0.9, (p.rx + 0.9) * p.e, 0);
            g.fillStyle = css(rouge, 0.75 + aleatoire() * 0.2);
            tache(g, p.x, p.y, p.rx, p.rx * p.e, 0);
        }
    },

    // Peau lisse sans écailles (anguille) : nuages sombres très allongés le long du corps (ombres
    // du flanc), léger voile jaune clair sous la ligne latérale.
    peauLisse: function (g, W, H, c, aleatoire) {
        const sombre = melanger(c.dos, 0x000000, 0.35);
        for (let i = 0; i < 46; i++) {
            const cx = W * (0.12 + aleatoire() * 0.88);
            const cy = H * (0.06 + aleatoire() * 0.5);
            g.fillStyle = css(sombre, 0.05 + aleatoire() * 0.07);
            tache(g, cx, cy, W * (0.025 + aleatoire() * 0.06), H * (0.03 + aleatoire() * 0.07), (aleatoire() - 0.5) * 0.2);
        }
        const jaune = melanger(c.ventre, 0xd8c860, 0.15);
        const voile = g.createLinearGradient(0, H * 0.5, 0, H * 0.85);
        voile.addColorStop(0, css(jaune, 0));
        voile.addColorStop(1, css(jaune, 0.16));
        g.fillStyle = voile;
        g.fillRect(W * 0.1, H * 0.5, W * 0.9, H * 0.35);
    },

    // Marbrures (silure) : plages sombres irrégulières (chaînes de taches qui se chevauchent,
    // plus nombreuses et plus grandes sur le dos), voile gris-vert clair sur le flanc, puis semis
    // fin de petites taches pâles groupées en nuages (jamais une grille régulière), plus dense
    // sur le dos et vers la queue. Peau lisse : aucune écaille.
    marbrures: function (g, W, H, c, aleatoire) {
        const sombre = melanger(c.dos, 0x000000, 0.35);
        const moyen = melanger(c.flanc, c.dos, 0.5);
        // 1. Nuages moyens (flanc plus clair, par plaques) : cassent l'uniformité du dégradé.
        for (let i = 0; i < 26; i++) {
            const cx = W * (0.15 + aleatoire() * 0.85);
            const cy = H * (0.18 + aleatoire() * 0.5);
            g.fillStyle = css(c.motif !== null ? melanger(c.motif, c.flanc, 0.5) : c.flanc, 0.05 + aleatoire() * 0.06);
            tache(g, cx, cy, W * (0.02 + aleatoire() * 0.035), H * (0.05 + aleatoire() * 0.09), (aleatoire() - 0.5) * 0.8);
        }
        // 2. Marbrures sombres : chaînes de 4 à 9 taches (marche aléatoire), départ plutôt sur le dos.
        for (let chaine = 0; chaine < 46; chaine++) {
            let x = W * (0.16 + aleatoire() * 0.84);
            let y = H * (0.06 + Math.pow(aleatoire(), 1.5) * 0.6);
            const maillons = 4 + Math.floor(aleatoire() * 6);
            const dos = 1 - Math.min(1, y / (H * 0.5));            // 1 sur le dos → 0 plus bas
            g.fillStyle = css(chaine % 3 === 0 ? sombre : moyen, 0.1 + 0.1 * dos + aleatoire() * 0.07);
            for (let k = 0; k < maillons; k++) {
                tache(g, x, y, 1.6 + aleatoire() * (2.6 + 2.4 * dos), 1.2 + aleatoire() * (1.8 + 1.4 * dos),
                    aleatoire() * 3);
                x += (aleatoire() - 0.3) * 6;
                y += (aleatoire() - 0.5) * 4;
            }
        }
        // 3. Petites taches pâles, en nuages : on tire des centres, puis des points autour.
        const pale = c.motif !== null ? c.motif : melanger(c.flanc, 0xd8dccc, 0.55);
        for (let nuage = 0; nuage < 70; nuage++) {
            const u0 = 0.12 + Math.sqrt(aleatoire()) * 0.88;          // plus dense vers la queue
            const v0 = 0.08 + Math.pow(aleatoire(), 1.3) * 0.62;      // plus dense sur le dos
            const rayon = 6 + aleatoire() * 14;
            const nombre = 6 + Math.floor(aleatoire() * 14);
            for (let k = 0; k < nombre; k++) {
                const a = aleatoire() * Math.PI * 2;
                const d = Math.sqrt(aleatoire()) * rayon;
                g.fillStyle = css(pale, 0.12 + aleatoire() * 0.26);
                tache(g, W * u0 + Math.cos(a) * d * 1.6, H * v0 + Math.sin(a) * d * 0.7,
                    0.45 + aleatoire() * 0.8, 0.4 + aleatoire() * 0.55, aleatoire() * 3);
            }
        }
    }
};

export const MOTIFS_GERES = Object.keys(MOTIFS);

// Dessine la robe complète d'une espèce sur un contexte 2D (W × H).
//   repere : { opercule (t), oeil: { t, v }, ligneLaterale (bool) }
// Renvoie true si le motif est connu (sinon robe unie).
export function dessinerRobe(g, W, H, espece, repere) {
    const c = couleursEspece(espece);
    const motif = (espece && espece.motif) || 'aucun';
    const aleatoire = hasard(graineDe((espece && espece.id) || motif));

    // 1. Dégradé dos → flanc → ventre.
    const fond = g.createLinearGradient(0, 0, 0, H);
    fond.addColorStop(0, css(c.dos));
    fond.addColorStop(0.3, css(melanger(c.dos, c.flanc, 0.6)));
    fond.addColorStop(0.5, css(c.flanc));
    fond.addColorStop(0.72, css(melanger(c.flanc, c.ventre, 0.6)));
    fond.addColorStop(1, css(c.ventre));
    g.fillStyle = fond;
    g.fillRect(0, 0, W, H);

    // 1b. Dos plus sombre et ventre plus clair que le dégradé de base (options de l'espèce) :
    // vu de profil, le dégradé ne dure que sur le haut du flanc, la photo montre un dos net.
    const ombre = espece && espece.ombreDos || 0;
    if (ombre) {
        const d = g.createLinearGradient(0, 0, 0, H * 0.45);
        d.addColorStop(0, css(melanger(c.dos, 0x000000, 0.25), ombre));
        d.addColorStop(1, css(c.dos, 0));
        g.fillStyle = d;
        g.fillRect(0, 0, W, H * 0.45);
    }
    const clair = espece && espece.ventreClair || 0;
    if (clair) {
        const d = g.createLinearGradient(0, H * 0.58, 0, H * 0.92);
        d.addColorStop(0, css(c.ventre, 0));
        d.addColorStop(1, css(c.ventre, clair));
        g.fillStyle = d;
        g.fillRect(0, H * 0.58, W, H * 0.42);
    }

    // 2. Tête : peau sans écailles, de la teinte `tete` de l'espèce (sinon un
    // flanc un peu assombri), fondue vers l'ouïe. Posée AVANT le motif : les
    // taches du brochet ou les marbrures du silure peuvent déborder sur la joue.
    const r = repere || {};
    const xOp = (r.opercule !== undefined ? r.opercule : 0.22) * W;
    const tete = espece && espece.tete !== undefined ? espece.tete : melanger(c.flanc, c.dos, 0.45);
    const peau = g.createLinearGradient(0, 0, xOp + W * 0.02, 0);
    // `fonduTete` (0 par défaut) avance le début du fondu : limite de l'ouïe moins nette.
    const finPlein = 0.8 - Math.min(0.7, (espece && espece.fonduTete) || 0);
    peau.addColorStop(0, css(tete, 0.75));
    peau.addColorStop(finPlein, css(tete, 0.6));
    peau.addColorStop(1, css(tete, 0));
    g.fillStyle = peau;
    g.fillRect(0, 0, xOp + W * 0.02, H);

    // 3. Motif de l'espèce, puis joue un peu plus claire et bord de l'ouïe.
    const connu = Object.prototype.hasOwnProperty.call(MOTIFS, motif);
    if (connu) {
        MOTIFS[motif](g, W, H, c, aleatoire, espece);
    }
    const joue = g.createLinearGradient(0, H * 0.4, 0, H);
    joue.addColorStop(0, css(melanger(c.flanc, 0xffffff, 0.12), 0));
    // `joueClaire` (0,25) : reflet de la joue ; plus bas, la limite de l'ouïe s'efface.
    const alphaJoue = espece && espece.joueClaire !== undefined ? espece.joueClaire : 0.25;
    joue.addColorStop(1, css(melanger(c.ventre, 0xffffff, 0.1), alphaJoue));
    g.fillStyle = joue;
    g.fillRect(0, H * 0.4, xOp, H * 0.6);
    const contraste = r.contrasteOpercule !== undefined ? r.contrasteOpercule : 0.4;
    if (r.operculeDoux) {
        // Bord arrière diffus (brochet) : une ombre large et floue contre le flanc, un
        // trait plus net au milieu, puis un liseré clair devant : visible, jamais un fil.
        const ombre = melanger(c.dos, 0x000000, 0.5);
        [[9, 0.2], [5.5, 0.35], [2.6, 0.6]].forEach(function (l) {
            g.strokeStyle = css(ombre, contraste * l[1]);
            g.lineWidth = l[0];
            g.beginPath();
            g.moveTo(xOp - W * 0.022, H * 0.12);
            g.quadraticCurveTo(xOp + W * 0.012, H * 0.5, xOp - W * 0.032, H * 0.9);
            g.stroke();
        });
        g.strokeStyle = css(melanger(c.flanc, 0xffffff, 0.4), contraste * 0.7);
        g.lineWidth = 3.5;
        g.beginPath();
        g.moveTo(xOp - W * 0.04, H * 0.14);
        g.quadraticCurveTo(xOp + W * 0.0, H * 0.5, xOp - W * 0.05, H * 0.88);
        g.stroke();
    } else {
        g.strokeStyle = css(melanger(c.dos, 0x000000, 0.5), contraste);
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(xOp - W * 0.025, H * 0.12);
        g.quadraticCurveTo(xOp + W * 0.012, H * 0.5, xOp - W * 0.035, H * 0.9);
        g.stroke();
        g.strokeStyle = css(melanger(c.flanc, 0xffffff, 0.35), contraste * 0.6);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(xOp - W * 0.03, H * 0.14);
        g.quadraticCurveTo(xOp + W * 0.004, H * 0.5, xOp - W * 0.04, H * 0.88);
        g.stroke();
    }

    // Narine : petit point sombre entre l'œil et le museau.
    if (r.oeil && !r.sansNarine) {
        g.fillStyle = css(melanger(c.dos, 0x000000, 0.6), 0.7);
        tache(g, r.oeil.t * 0.55 * W, (1 - r.oeil.v) * H - 1, 1.3, 1);
    }

    // 4. Ligne latérale (pointillé discret).
    if (r.ligneLaterale !== false) {
        g.fillStyle = css(melanger(c.flanc, 0x000000, 0.45), 0.35);
        for (let x = xOp + 2; x < W - 3; x += 3) {
            const f = (x - xOp) / (W - xOp);
            g.fillRect(x, H * (0.44 + 0.08 * Math.sin(Math.PI * f) * (r.ligneCourbe || 0.6)), 1.6, 1.2);
        }
    }
    return connu;
}

// Texture 256 × 128 d'une espèce (cache par identifiant).
export function textureCorps(espece, repere) {
    const cle = (espece && espece.id) || ('motif-' + ((espece && espece.motif) || 'aucun'));
    if (_texturesCorps[cle]) {
        return _texturesCorps[cle];
    }
    const canvas = document.createElement('canvas');
    canvas.width = LARGEUR_TEXTURE;
    canvas.height = HAUTEUR_TEXTURE;
    dessinerRobe(canvas.getContext('2d'), LARGEUR_TEXTURE, HAUTEUR_TEXTURE, espece, repere);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    _texturesCorps[cle] = texture;
    return texture;
}

// Rayons de nageoire : 16 lignes par tour de texture (u répété), membrane plus
// claire vers le bord libre (v = 1 en haut du canvas).
export function textureNageoire(variante) {
    const cle = variante || 'rayons';
    if (_texturesNageoire[cle]) {
        return _texturesNageoire[cle];
    }
    const W = 128;
    const H = 64;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    const fond = g.createLinearGradient(0, 0, 0, H);
    fond.addColorStop(0, '#f2f2f2');
    fond.addColorStop(1, '#a8a8a8');
    g.fillStyle = fond;
    g.fillRect(0, 0, W, H);
    if (cle === 'perche') {
        // Membrane sombre et translucide, rayons pâles (dorsales de la perche) : la
        // couleur de la nageoire (sommets) éclaircit les rayons, assombrit la membrane.
        const membrane = g.createLinearGradient(0, 0, 0, H);
        membrane.addColorStop(0, '#9c9c9c');
        membrane.addColorStop(1, '#666666');
        g.fillStyle = membrane;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,0.95)';
        g.lineWidth = 2.4;
        for (let i = 0; i < 16; i++) {
            const x = (i + 0.5) * (W / 16);
            g.beginPath();
            g.moveTo(x, H);
            g.lineTo(x, 2);
            g.stroke();
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        _texturesNageoire[cle] = t;
        return t;
    }
    if (cle === 'sandre') {
        // Membrane translucide, rayons fins et rangées de petits points sombres le long des
        // rayons, plus nombreux vers la base (nageoires du sandre : gris-vert tachetées).
        const membrane = g.createLinearGradient(0, 0, 0, H);
        membrane.addColorStop(0, '#f0f0f0');
        membrane.addColorStop(1, '#b4b4b4');
        g.fillStyle = membrane;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(24,28,16,0.3)';
        g.lineWidth = 1.2;
        for (let i = 0; i < 16; i++) {
            const x = (i + 0.5) * (W / 16);
            g.beginPath();
            g.moveTo(x, H);
            g.lineTo(x, 2);
            g.stroke();
        }
        const alea = hasard(11);
        for (let i = 0; i < 16; i++) {
            const x = (i + 0.5) * (W / 16);
            for (let y = H - 5; y > 8; y -= 7 + alea() * 4) {
                g.fillStyle = 'rgba(26,30,18,' + (0.28 + 0.5 * (y / H) * alea()).toFixed(2) + ')';
                tache(g, x + (alea() - 0.5) * 2, y, 1.4 + alea() * 0.6, 1.2);
            }
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        _texturesNageoire[cle] = t;
        return t;
    }
    if (cle === 'brochet') {
        // Membrane claire et translucide, rayons fins, quelques petites taches brunes
        // (nageoires du brochet : orange-brun clair tacheté, pas de plaque sombre).
        const membrane = g.createLinearGradient(0, 0, 0, H);
        membrane.addColorStop(0, '#f4f4f4');
        membrane.addColorStop(1, '#bcbcbc');
        g.fillStyle = membrane;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(20,14,8,0.28)';
        g.lineWidth = 1.1;
        for (let i = 0; i < 16; i++) {
            const x = (i + 0.5) * (W / 16);
            g.beginPath();
            g.moveTo(x, H);
            g.lineTo(x, 2);
            g.stroke();
        }
        g.fillStyle = 'rgba(30,18,8,0.36)';
        const alea = hasard(7);
        for (let i = 0; i < 46; i++) {
            tache(g, alea() * W, 6 + alea() * (H - 10), 1.1 + alea() * 1.2, 0.9 + alea() * 0.8);
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        _texturesNageoire[cle] = t;
        return t;
    }
    if (cle === 'truite') {
        // Membrane translucide plus sombre vers la base, rayons fins et nets, liseré clair au bord
        // libre (nageoires de la truite : brun-ambre, rayons visibles).
        const membrane = g.createLinearGradient(0, 0, 0, H);
        membrane.addColorStop(0, '#f6f6f6');
        membrane.addColorStop(0.15, '#dcdcdc');
        membrane.addColorStop(1, '#8e8e8e');
        g.fillStyle = membrane;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(22,14,6,0.4)';
        g.lineWidth = 1.3;
        for (let i = 0; i < 16; i++) {
            const x = (i + 0.5) * (W / 16);
            g.beginPath();
            g.moveTo(x, H);
            g.lineTo(x, 5);
            g.stroke();
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        _texturesNageoire[cle] = t;
        return t;
    }
    if (cle === 'anguille') {
        // Membrane lisse et translucide, rayons à peine visibles, base plus sombre (le liseré
        // de la dorsale et de l'anale prolonge la queue).
        const membrane = g.createLinearGradient(0, 0, 0, H);
        membrane.addColorStop(0, '#f2f2f2');
        membrane.addColorStop(0.5, '#d2d2d2');
        membrane.addColorStop(1, '#9a9a9a');
        g.fillStyle = membrane;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(20,16,8,0.12)';
        g.lineWidth = 1;
        for (let i = 0; i < 16; i++) {
            const x = (i + 0.5) * (W / 16);
            g.beginPath();
            g.moveTo(x, H);
            g.lineTo(x, 4);
            g.stroke();
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        _texturesNageoire[cle] = t;
        return t;
    }
    // Variante « doux » : rayons discrets (membrane fine : brème, gardon…) ; « silure » : plus fins encore.
    const fin = cle === 'doux' || cle === 'silure';
    g.strokeStyle = fin ? 'rgba(20,16,12,0.2)' : 'rgba(20,16,12,0.45)';
    g.lineWidth = cle === 'silure' ? 0.9 : cle === 'doux' ? 1.2 : 1.6;
    for (let i = 0; i < 16; i++) {
        const x = (i + 0.5) * (W / 16);
        g.beginPath();
        g.moveTo(x, H);
        g.lineTo(x, 2);
        g.stroke();
    }
    if (cle === 'taches') {
        g.fillStyle = 'rgba(25,18,10,0.6)';
        const aleatoire = hasard(7);
        for (let i = 0; i < 70; i++) {
            tache(g, aleatoire() * W, 6 + aleatoire() * (H - 10), 1.8 + aleatoire() * 1.6, 1.4 + aleatoire());
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    _texturesNageoire[cle] = texture;
    return texture;
}

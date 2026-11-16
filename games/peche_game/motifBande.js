// ---------------------------------------------------------------------------
// motifBande.js — MOTIF « bande latérale » de la robe (black-bass) : taches verticales irrégulières
// qui se soudent en un ruban continu vers la queue, sur des écailles discrètes. Module de dessin pur,
// appelé par texturesPoisson.js (motif `bandeLaterale`) ; il reçoit ses outils (css, melanger, tache et
// le motif d'écailles) pour ne pas importer texturesPoisson.js (pas de cycle).
//
// Le canvas est une vue de profil « déroulée » (voir texturesPoisson.js) : x = le long du corps,
// y = 0 dos → H ventre. Options de l'espèce :
//   `ecailles`, `rangsEcailles`… : écailles dessous (mêmes options que le motif « ecailles ») ;
//   `pointsEcailles` { nombre, t0, t1, f0, f1, rayon, force } : petits points sombres du haut du flanc ;
//   `taches` : liste { t, large, f0, f1, force } (t = place le long du corps, large = largeur en fraction de
//              LS, f0 / f1 = hauteur du dos (0) au ventre (1)) ;
//   `bande` { t0, t1, f, demi, demiFin, force } : ruban continu sur l'arrière (demi-épaisseur en part de la
//              hauteur du corps, plus épaisse vers la fin), plus sombre à la base de la queue ;
//   `teinteMotif` : couleur de l'encre (sinon le dos assombri).
// ---------------------------------------------------------------------------

export function dessinerBandeLaterale(g, W, H, c, aleatoire, espece, outils) {
    const { css, melanger, tache } = outils;
    const encre = c.motif !== null ? c.motif : melanger(c.dos, 0x000000, 0.35);
    // hauteur apparente f (0 = dos, 1 = ventre) -> ordonnée de la texture
    const vDe = f => Math.acos(1 - 2 * Math.max(0, Math.min(1, f))) / Math.PI * H;
    if (espece.ecailles) {
        outils.ecailles(g, W, H, c, aleatoire, espece);
    }
    // Points sombres sur le haut du flanc (liseré foncé de certaines écailles).
    const pts = espece.pointsEcailles;
    if (pts) {
        for (let i = 0; i < pts.nombre; i++) {
            const x = W * (pts.t0 + aleatoire() * (pts.t1 - pts.t0));
            const y = vDe(pts.f0 + (pts.f1 - pts.f0) * Math.pow(aleatoire(), 0.8));
            const r = pts.rayon * (0.7 + aleatoire() * 0.7);
            g.fillStyle = css(encre, pts.force * (0.35 + aleatoire() * 0.55));
            tache(g, x, y, r * 1.1, r, (aleatoire() - 0.5) * 0.8);
        }
    }
    // Taches verticales : chaîne d'ellipses décalées et de largeur très variable (bord déchiqueté, quelques
    // trous, inclinaison propre à chaque tache), halo doux puis cœur plus net.
    (espece.taches || []).forEach(function (b) {
        const y0 = vDe(b.f0);
        const y1 = vDe(b.f1);
        const demi = b.large * W * 0.5;
        const xc = (b.t + (aleatoire() - 0.5) * 0.012) * W;
        const force = b.force * (0.85 + aleatoire() * 0.3);
        const pente = (aleatoire() - 0.5) * demi * 1.6;
        const n = Math.max(3, Math.ceil((y1 - y0) / 2.2));
        const decal = [];
        const gros = [];
        for (let k = 0; k <= n; k++) {
            decal.push((aleatoire() - 0.5) * demi * 1.3);
            gros.push(0.35 + aleatoire() * 1.0);
        }
        [[1.7, 0.2], [1.15, 0.36], [0.7, 0.58]].forEach(function (couche, ic) {
            for (let k = 0; k <= n; k++) {
                const u = k / n;
                if (ic > 0 && gros[k] < 0.45 && k % 3 === 1) { continue; }    // petits trous dans la tache
                const largeur = demi * couche[0] * gros[k] * (0.55 + 0.6 * Math.sin(Math.PI * (0.1 + 0.8 * u)));
                g.fillStyle = css(encre, force * couche[1]);
                tache(g, xc + (decal[k] + pente * (u - 0.5)) * (0.5 + 0.5 * couche[0]), y0 + (y1 - y0) * u,
                    Math.max(0.8, largeur), Math.max(1.2, (y1 - y0) / n * 1.3), 0);
            }
        });
    });
    // Ruban continu sur l'arrière du corps : ellipses allongées qui se recouvrent, centre et épaisseur
    // qui ondulent ; la base de la queue porte une tache plus sombre.
    const ruban = espece.bande;
    if (ruban) {
        const pas = 1.6;
        const x0 = ruban.t0 * W;
        const x1 = ruban.t1 * W;
        for (let x = x0; x <= x1; x += pas) {
            const u = (x - x0) / (x1 - x0);
            const montee = Math.min(1, u / 0.18);               // le ruban naît des taches, il ne démarre pas net
            const f = ruban.f + Math.sin(x * 0.21) * 0.025 + (aleatoire() - 0.5) * 0.03;
            const demi = (ruban.demi + (ruban.demiFin - ruban.demi) * u)
                * (0.8 + 0.4 * Math.sin(x * 0.37 + 1.2) * 0.5 + (aleatoire() - 0.5) * 0.25);
            const ya = vDe(f - demi);
            const yb = vDe(f + demi);
            [[1.35, 0.2], [1, 0.38], [0.62, 0.5]].forEach(function (couche) {
                g.fillStyle = css(encre, ruban.force * couche[1] * montee * (u > 0.93 ? 1.25 : 1));
                tache(g, x, (ya + yb) / 2, pas * 2.2, Math.max(1.2, (yb - ya) / 2 * couche[0]), 0);
            });
        }
    }
}

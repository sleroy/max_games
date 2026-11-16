// teteBec.js — TÊTE À BEC d'un poisson (brochet ; option générique du moteur
// `modelePoisson.js`, réutilisable pour d'autres becs : sandre, silure).
//
//   profilAvecBec    : aplatit et allonge le museau d'un profil (voir `especes.js`, `bec`) ;
//   preparerTete     : anneaux de la tête avec fente de gueule, mâchoire inférieure, intérieur
//                      sombre, dents et narines ;
//   pupilleVerticaleGeometrie : pupille elliptique posée sur le dôme de l'œil.
// Module pur : les fonctions de maillage (`sommet`, `spow`, SEGMENTS) lui sont passées par
// `modelePoisson.js` (`outils`), pour éviter un import circulaire.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BEC (brochet, option générique) : sur les `longueur` premières fractions de LS,
// le dessus et le dessous de la tête deviennent des droites qui partent d'un bout
// de museau épais (`nez` au-dessus, `fond` au-dessous de l'axe) et rejoignent le
// profil mesuré ; `aplatissement` (0 → 1) dose l'effet. La largeur est conservée :
// la tête est plus large que haute, en bec de canard.
//   bec : { longueur, aplatissement, nez, fond, saillieMachoire, arrondi }
// ---------------------------------------------------------------------------
export function profilAvecBec(profil, bec) {
    const L = bec.longueur;
    const a = bec.aplatissement === undefined ? 1 : bec.aplatissement;
    const haut0 = t => profil.y(t) + profil.h0(t);
    const bas0 = t => profil.y(t) - profil.h0(t);
    const hautL = haut0(L);
    const basL = bas0(L);
    // 1 sur le museau, retombe en douceur à 0 au bout du bec.
    const poids = function (t) {
        if (t >= L) { return 0; }
        const u = Math.max(0, (t - 0.35 * L) / (0.65 * L));
        return a * (1 - u * u * (3 - 2 * u));
    };
    const haut = function (t) {
        const m = poids(t);
        return haut0(t) + (bec.nez + (hautL - bec.nez) * t / L - haut0(t)) * m;
    };
    const bas = function (t) {
        const m = poids(t);
        return bas0(t) + (bec.fond + (basL - bec.fond) * t / L - bas0(t)) * m;
    };
    const h0 = t => Math.max(0.0015, (haut(t) - bas(t)) / 2);
    // Largeur : le bout du museau s'élargit (`largeur` = gain relatif au bout, sur les
    // 0,1 premières fractions de LS) : de dessus, une spatule arrondie plutôt qu'un V.
    const elargit = bec.largeur || 0;
    const w0 = function (t) {
        const u = Math.max(0, 1 - t / 0.14);
        return profil.w0(t) * (1 + elargit * u * u);
    };
    return Object.assign({}, profil, {
        y: t => (haut(t) + bas(t)) / 2,
        h0: h0,
        h: t => h0(t) * profil.dome(t),
        w0: w0,
        w: t => w0(t) * profil.dome(t)
    });
}

// ---------------------------------------------------------------------------
// TÊTE À BEC : des anneaux de la pointe du museau jusqu'au coin de la bouche (et un peu
// au-delà, pour fondre le raccord). Chaque anneau garde les SEGMENTS sommets du corps,
// mais le sommet « lèvre » (à `JC` pas du dessous) fixe la ligne de bouche :
//   - les sommets au-dessus forment la mâchoire supérieure (lèvre relevée de g/2) ;
//   - les sommets en dessous forment la mâchoire inférieure, dont la lèvre est un
//     sommet DUPLIQUÉ, abaissé de g/2 et avancé de `saillieMachoire` ;
//   - entre les deux lèvres, aucune peau : la fente. Palais, plancher et deux parois
//     (matériau sombre) en ferment l'intérieur ; des dents claires bordent la fente.
// `g` (ouverture) décroît jusqu'à 0 au coin de la bouche : à cet anneau les doublons
// coïncident, le maillage est étanche.
// ---------------------------------------------------------------------------
export const JC = 8;   // indice (pas de 360/SEGMENTS degrés depuis le ventre) des lèvres : la ligne de bouche

export function preparerTete(lot, profil, LS, xNez, bec, fente, tsCorps, outils) {
    const { sommet, spow, M } = outils;
    const tc = fente.t;
    const arrondi = bec.arrondi || 0.04;
    const saillie = bec.saillieMachoire || 0;
    const ouverture = fente.epaisseur || 0.01;   // ouverture de la fente au bout du museau
    const gap = t => t >= tc - 1e-9 ? 0 : ouverture * Math.pow(1 - t / tc, 0.9);
    const decal = t => t >= tc ? 0 : saillie * Math.pow(1 - t / tc, 2);
    // Museau vu de dessus : arrondi large (`arrondi`) ; de profil : bout épais, arrondi court.
    const arrondiV = bec.arrondiProfil || arrondi * 0.6;
    const coupole = (t, r) => t >= r ? 1
        : Math.max(0.02, Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / r, 2))));
    const dome = t => coupole(t, arrondi);
    const domeV = t => coupole(t, arrondiV);
    const uniforme = 2 * Math.PI * JC / M;

    // Positions des anneaux : pointe très resserrée (museau en dôme), puis ceux du corps.
    const tFin = tc;                                 // les anneaux suivants sont ceux du corps
    let ts = [0, 0.0012, 0.003, 0.0055].concat(tsCorps.filter(t => t > 0.0055 && t < tFin));
    ts = ts.filter(t => t < tc - 0.006);      // pas de maille minuscule devant le coin
    ts.push(tc);
    ts.sort((p, q) => p - q);

    const sections = [];
    ts.forEach(function (t) {
        const h = profil.h0(t);
        const w = profil.w0(t);
        const yc = profil.y(t);
        const nH = profil.n(t);
        const nB = profil.nb(t);
        // Ligne de bouche = hauteur de la lèvre (sommet JC, angles uniformes : pas de
        // raccord visible avec le corps) ; le museau se referme en dôme autour d'elle.
        const ym = yc - h * spow(Math.cos(uniforme), 2 / nB);
        const D = dome(t);
        const DV = domeV(t);
        const g = gap(t) * Math.min(1, 0.3 + DV);
        const levres = t <= tc + 1e-9;
        const base = lot.pos.length / 3;
        const debut = [];
        const fin = [];
        const sec = { t: t, base: base, debut: debut, fin: fin, levres: levres };
        const doublons = [];
        for (let j = 0; j < M; j++) {
            const theta = (j / M) * Math.PI * 2;
            const c = Math.cos(theta);
            const e = 2 / (c > 0 ? nB : nH);
            // Le museau se referme en dôme AUTOUR de la ligne de bouche (les deux
            // mâchoires se rejoignent à la pointe).
            const y = ym + DV * (yc - h * spow(c, e) - ym);
            const z = D * w * spow(Math.sin(theta), e);
            const haut = j >= JC && j <= M - JC;
            const lever = levres && (j === JC || j === M - JC);
            const uv = 1 - Math.abs(theta - Math.PI) / Math.PI;
            // La mâchoire inférieure garde l'abscisse du corps ; la supérieure recule de
            // `decal` : le bout du bec ne dépasse jamais la longueur de référence.
            sommet(lot, xNez - t * LS - (haut ? decal(t) * LS : 0),
                (lever ? y + g / 2 : y) * LS, z * LS, t, uv, 1);
            if (lever) {
                // Doublons des lèvres (ajoutés après les SEGMENTS sommets de l'anneau).
                doublons.push({ j: j, y: (y - g / 2) * LS, z: z * LS, uv: uv });
                if (j === JC) { sec.zr = z * LS; sec.yHaut = (y + g / 2) * LS; sec.yBas = (y - g / 2) * LS; }
            }
        }
        // Doublon bas de la lèvre : mâchoire inférieure, abaissé (et plus avancée que la haute).
        doublons.forEach(function (d) {
            const id = sommet(lot, xNez - t * LS, d.y, d.z, t, d.uv, 1);
            if (d.j === JC) { sec.lr = id; } else { sec.ll = id; }
        });
        for (let j = 0; j < M; j++) {
            debut.push(base + j);
            fin.push(base + (j + 1) % M);
        }
        if (levres) {
            fin[JC - 1] = sec.lr;               // le bas se termine sur la lèvre basse
            debut[M - JC] = sec.ll;             // et reprend de l'autre côté
            sec.x = xNez - t * LS - decal(t) * LS;
            sec.xBas = xNez - t * LS;
            // Intérieur : bord du palais, du plancher, parois inset (matériau sombre).
            const zi = sec.zr * 0.8;
            const pt = (x, y, z) => sommet(lot, x, y, z, 0, 0, 1);
            sec.pur = pt(sec.x, sec.yHaut, sec.zr); sec.pul = pt(sec.x, sec.yHaut, -sec.zr);
            sec.plr = pt(sec.xBas, sec.yBas, sec.zr); sec.pll = pt(sec.xBas, sec.yBas, -sec.zr);
            sec.wur = pt(sec.x, sec.yHaut, zi); sec.wul = pt(sec.x, sec.yHaut, -zi);
            sec.wlr = pt(sec.xBas, sec.yBas, zi); sec.wll = pt(sec.xBas, sec.yBas, -zi);
        }
        sections.push(sec);
    });

    // Intérieur de la bouche et dents (indices rangés à part : autres matériaux).
    const interieur = [];
    const dents = [];
    // Faces « fantômes » (matériau invisible) : elles comblent la fente pour le calcul des
    // normales seulement. Sans elles, les sommets des lèvres n'ont de voisins que d'un
    // côté, leur normale s'incline de 5° et un liseré de lumière coupe la joue.
    const fantomes = [];
    const quad = (a, b, c, d) => interieur.push(a, b, c, b, d, c);
    for (let i = 0; i < sections.length - 1; i++) {
        const p = sections[i];
        const q = sections[i + 1];
        if (!p.levres || !q.levres) { continue; }
        fantomes.push(p.base + JC - 1, p.base + JC, q.base + JC - 1, p.base + JC, q.base + JC, q.base + JC - 1);
        fantomes.push(p.lr, p.base + JC + 1, q.lr, p.base + JC + 1, q.base + JC + 1, q.lr);
        fantomes.push(p.base + M - JC - 1, p.base + M - JC, q.base + M - JC - 1,
            p.base + M - JC, q.base + M - JC, q.base + M - JC - 1);
        fantomes.push(p.ll, p.base + M - JC + 1, q.ll, p.base + M - JC + 1, q.base + M - JC + 1, q.ll);
        quad(p.pur, p.pul, q.pur, q.pul);          // palais
        quad(p.plr, p.pll, q.plr, q.pll);          // plancher
        quad(p.wur, p.wlr, q.wur, q.wlr);          // paroi droite
        quad(p.wul, p.wll, q.wul, q.wll);          // paroi gauche
        // Dents : une paire sur deux de sections ; basses (grandes) puis hautes (petites).
        if (p.t < 0.012 || q.t > tc - 0.012) { continue; }
        if (i % 2 !== 0) { continue; }
        const bas = i % 4 === 0;
        for (const cote of [1, -1]) {
            const zp = cote * p.zr * 0.88;
            const zq = cote * q.zr * 0.88;
            const hauteur = (bas ? 0.0055 : 0.0035) * LS;
            const y1 = bas ? p.yBas : p.yHaut;
            const y2 = bas ? q.yBas : q.yHaut;
            const x1 = bas ? p.xBas : p.x;
            const x2 = bas ? q.xBas : q.x;
            const sens = bas ? 1 : -1;
            const a = sommet(lot, x1, y1, zp, 0, 0, 1);
            const b = sommet(lot, x2, y2, zq, 0, 0, 1);
            const pointe = sommet(lot, (x1 + x2) / 2 - 0.0025 * LS, (y1 + y2) / 2 + sens * hauteur,
                (zp + zq) / 2, 0, 0, 1);
            dents.push(a, b, pointe);
        }
    }
    // Narines : deux petits creux sombres sur le dessus du museau.
    if (bec.narine) {
        const tn = bec.narine.t;
        const dessus = function (t, z) {
            const r = Math.min(0.97, Math.abs(z) / profil.w0(t));
            const n = profil.n(t);
            return profil.y(t) + profil.h0(t) * Math.pow(1 - Math.pow(r, n), 1 / n);
        };
        const rx = (bec.narine.rayon || 0.0055);
        for (const cote of [1, -1]) {
            const zc = cote * profil.w0(tn) * (bec.narine.ecart || 0.5);
            const point = (dt, dz, creux) => {
                const t = tn + dt;
                const z = zc + dz;
                return sommet(lot, xNez - t * LS - decal(t) * LS, (dessus(t, z) + (creux ? 0.0006 : 0.0012)) * LS,
                    z * LS, 0, 0, 1);
            };
            const centre = point(0, 0, true);
            const K = 6;
            const anneau = [];
            for (let k = 0; k < K; k++) {
                const ang = (k / K) * Math.PI * 2;
                anneau.push(point(Math.cos(ang) * rx, Math.sin(ang) * rx * 0.75, false));
            }
            for (let k = 0; k < K; k++) {
                interieur.push(centre, anneau[k], anneau[(k + 1) % K]);
            }
        }
    }
    return { sections: sections, tFin: tFin, interieur: interieur, dents: dents, fantomes: fantomes };
}

// Pupille verticale : éventail elliptique (haut = dos) posé sur le dôme de l'œil.
// `cote` = +1 flanc droit, -1 flanc gauche ; `cx, cy, cz` : centre de l'œil.
export function pupilleVerticaleGeometrie(lot, sommet, rayon, cx, cy, cz, cote) {
    const K = 10;
    const z = cz + cote * rayon * 0.512;
    const centre = sommet(lot, cx, cy, z, 0, 0, 1);
    for (let k = 0; k < K; k++) {
        const a = (k / K) * Math.PI * 2;
        sommet(lot, cx + Math.cos(a) * rayon * 0.15, cy + Math.sin(a) * rayon * 0.36, z, 0, 0, 1);
    }
    for (let k = 0; k < K; k++) {
        lot.idx.push(centre, centre + 1 + k, centre + 1 + (k + 1) % K);
    }
}


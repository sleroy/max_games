// ---------------------------------------------------------------------------
// portraits.js — PORTRAIT 2D « photo réaliste » de chaque espèce.
// Dessiné 100 % en code sur un canvas à FOND TRANSPARENT (aucune image
// téléchargée, donc aucune licence à gérer) : le portrait est construit à
// partir des données du jeu (especes.js) — silhouette par « forme », couleurs
// et motif de l'espèce — pour ressembler au poisson 3D qui mord.
// Le dessin n'utilise que des appels présents dans le faux canvas 2D du
// harnais de tests, et un générateur pseudo-aléatoire LOCAL à graine fixe :
// chaque espèce a toujours le même portrait et rien du rand() du jeu n'est
// consommé (monde de tests reproductible).
// ---------------------------------------------------------------------------

// Silhouette par forme : ratio longueur/hauteur, bosse de dos, proportion de
// tête, et les deux cas spéciaux (anguille = serpent, silure = barbillons).
const FORMES_PORTRAIT = {
    fusiforme: { ratio: 3.6, bosse: 0.00, tete: 0.24 },
    petit: { ratio: 3.8, bosse: 0.00, tete: 0.26 },
    torpille: { ratio: 4.3, bosse: 0.00, tete: 0.20 },
    plat: { ratio: 2.3, bosse: 0.05, tete: 0.28 },
    profond: { ratio: 2.5, bosse: 0.07, tete: 0.26 },
    bossu: { ratio: 2.8, bosse: 0.17, tete: 0.25 },
    anguille: { ratio: 7.0, bosse: 0.00, tete: 0.17, serpent: true },
    barbu: { ratio: 3.3, bosse: 0.03, tete: 0.31, tetePlate: true, barbillons: true }
};

// Couleur hexadécimale numérique -> chaîne CSS '#rrggbb'.
function versCss(nombre) {
    return '#' + nombre.toString(16).padStart(6, '0');
}

// Mélange deux couleurs CSS '#rrggbb' (t = 0 : la première, 1 : la seconde).
function melanger(hexA, hexB, t) {
    const a = [parseInt(hexA.slice(1, 3), 16), parseInt(hexA.slice(3, 5), 16),
        parseInt(hexA.slice(5, 7), 16)];
    const b = [parseInt(hexB.slice(1, 3), 16), parseInt(hexB.slice(3, 5), 16),
        parseInt(hexB.slice(5, 7), 16)];
    return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
}

// Générateur pseudo-aléatoire déterministe, amorcé par le nom de l'espèce.
function creerHasard(graine) {
    let etat = graine % 2147483647;
    if (etat <= 0) { etat += 2147483646; }
    return function () {
        etat = (etat * 16807) % 2147483647;
        return (etat - 1) / 2147483646;
    };
}

function graineDuTexte(texte) {
    let total = 7;
    for (let i = 0; i < texte.length; i++) {
        total = (total * 31 + texte.charCodeAt(i)) % 2147483647;
    }
    return total;
}

export function dessinerPortrait(ctx, espece, largeur, hauteur) {
    const forme = FORMES_PORTRAIT[espece.form] || FORMES_PORTRAIT.fusiforme;
    const corps = versCss(espece.couleur);
    const dessus = melanger(corps, '#102020', 0.42);
    const ventre = melanger(corps, '#ffffff', 0.62);
    const nageoire = espece.nageoires ? versCss(espece.nageoires)
        : melanger(corps, '#101820', 0.28);
    const oeil = espece.oeil ? versCss(espece.oeil) : '#e8b83a';

    // Gabarit : le corps occupe la place, la queue le reste.
    let longueur = largeur * 0.86;
    let hauteurCorps = longueur / forme.ratio;
    const maxHauteur = hauteur * 0.62;
    if (hauteurCorps > maxHauteur) {
        hauteurCorps = maxHauteur;
        longueur = hauteurCorps * forme.ratio;
    }
    const museauX = (largeur - longueur) / 2;
    const baseQueueX = museauX + longueur * 0.84;
    const cy = hauteur * 0.52;
    const demi = hauteurCorps / 2;

    ctx.clearRect(0, 0, largeur, hauteur);

    // --- NAGEOIRES (derrière le corps) -------------------------------------
    // Dorsale : longue sur le dos de l'anguille, petite discrète sinon.
    ctx.fillStyle = nageoire;
    ctx.beginPath();
    if (forme.serpent) {
        ctx.moveTo(museauX + longueur * 0.30, cy - demi * 0.92);
        ctx.lineTo(museauX + longueur * 0.86, cy - demi * 0.55);
        ctx.lineTo(museauX + longueur * 0.86, cy - demi * 0.15);
        ctx.lineTo(museauX + longueur * 0.32, cy - demi * 0.72);
        ctx.closePath();
    } else {
        ctx.moveTo(museauX + longueur * 0.34, cy - demi * 0.96);
        ctx.lineTo(museauX + longueur * 0.58, cy - demi * (1.0 + forme.bosse));
        ctx.lineTo(museauX + longueur * 0.64, cy - demi * 0.88);
        ctx.closePath();
    }
    ctx.fill();
    // Ventrales + anale (le dessous, discret).
    ctx.beginPath();
    ctx.moveTo(museauX + longueur * 0.52, cy + demi * 0.72);
    ctx.lineTo(museauX + longueur * 0.60, cy + demi * 1.22);
    ctx.lineTo(museauX + longueur * 0.66, cy + demi * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(museauX + longueur * 0.72, cy + demi * 0.62);
    ctx.lineTo(museauX + longueur * 0.82, cy + demi * 1.10);
    ctx.lineTo(museauX + longueur * 0.86, cy + demi * 0.55);
    ctx.closePath();
    ctx.fill();

    // Queue fourchue (l'anguille garde sa pointe continue).
    if (!forme.serpent) {
        ctx.beginPath();
        ctx.moveTo(baseQueueX, cy - demi * 0.35);
        ctx.lineTo(baseQueueX + longueur * 0.16, cy - demi * 0.95);
        ctx.lineTo(baseQueueX + longueur * 0.10, cy);
        ctx.lineTo(baseQueueX + longueur * 0.16, cy + demi * 0.95);
        ctx.lineTo(baseQueueX, cy + demi * 0.35);
        ctx.closePath();
        ctx.fill();
    }

    // --- CORPS --------------------------------------------------------------
    // Le dos (bosse optionnelle) et le ventre : deux courbes de Bézier.
    const sommetDos = demi * (1.0 + forme.bosse);
    ctx.beginPath();
    ctx.moveTo(museauX, cy);
    if (forme.tetePlate) {
        // Tête aplatie du silure : le dessus part presque à plat.
        ctx.lineTo(museauX + longueur * 0.16, cy - demi * 0.78);
        ctx.bezierCurveTo(museauX + longueur * 0.34, cy - sommetDos,
            museauX + longueur * 0.56, cy - sommetDos, baseQueueX, cy - demi * 0.30);
    } else {
        ctx.bezierCurveTo(museauX + longueur * 0.18, cy - sommetDos * 0.92,
            museauX + longueur * 0.44, cy - sommetDos,
            museauX + longueur * 0.62, cy - sommetDos * 0.94);
        ctx.bezierCurveTo(museauX + longueur * 0.76, cy - sommetDos * 0.72,
            baseQueueX - longueur * 0.04, cy - demi * 0.62,
            baseQueueX, cy - demi * 0.30);
    }
    ctx.lineTo(baseQueueX, cy + demi * 0.30);
    ctx.bezierCurveTo(museauX + longueur * 0.70, cy + demi * 0.98,
        museauX + longueur * 0.40, cy + demi * 1.06,
        museauX + longueur * 0.18, cy + demi * 0.86);
    ctx.bezierCurveTo(museauX + longueur * 0.08, cy + demi * 0.66,
        museauX + longueur * 0.01, cy + demi * 0.28,
        museauX, cy);
    ctx.closePath();
    const degrade = ctx.createLinearGradient(0, cy - sommetDos, 0, cy + demi * 1.1);
    degrade.addColorStop(0, dessus);
    degrade.addColorStop(0.55, corps);
    degrade.addColorStop(1, ventre);
    ctx.fillStyle = degrade;
    ctx.fill();

    // Le motif reste DANS le corps : on découpe selon la silhouette.
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.55;
    const hasard = creerHasard(graineDuTexte(espece.id || 'poisson'));
    const motif = espece.motif || 'aucun';
    if (motif === 'taches' || motif === 'tachesClaires' || motif === 'pointsRouges') {
        ctx.fillStyle = motif === 'tachesClaires' ? melanger(corps, '#ffffff', 0.75)
            : (motif === 'pointsRouges' ? '#c0392b' : melanger(corps, '#101820', 0.45));
        const nombre = motif === 'mouchetures' ? 40 : 16;
        for (let i = 0; i < nombre; i++) {
            const x = museauX + longueur * (0.16 + hasard() * 0.66);
            const y = cy + (hasard() - 0.55) * hauteurCorps * 0.8;
            const rayon = (motif === 'pointsRouges' ? 1.6 : 2.4) + hasard() * 2.6;
            ctx.beginPath();
            ctx.arc(x, y, rayon, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (motif === 'rayures' || motif === 'barres') {
        ctx.fillStyle = melanger(corps, '#101820', 0.5);
        const nombre = motif === 'rayures' ? 9 : 6;
        for (let i = 0; i < nombre; i++) {
            const x = museauX + longueur * (0.18 + (i / nombre) * 0.64);
            ctx.fillRect(x, cy - sommetDos, longueur * 0.018, hauteurCorps * 1.1);
        }
    } else if (motif === 'bandeLaterale') {
        ctx.fillStyle = melanger(corps, '#101820', 0.45);
        ctx.fillRect(museauX + longueur * 0.10, cy - hauteurCorps * 0.10,
            longueur * 0.78, hauteurCorps * 0.16);
    } else if (motif === 'mouchetures') {
        ctx.fillStyle = melanger(corps, '#101820', 0.35);
        for (let i = 0; i < 40; i++) {
            ctx.fillRect(museauX + longueur * (0.14 + hasard() * 0.68),
                cy + (hasard() - 0.55) * hauteurCorps * 0.8, 1.6, 1.6);
        }
    } else if (motif === 'marbrures') {
        ctx.strokeStyle = melanger(corps, '#101820', 0.4);
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
            const x = museauX + longueur * (0.16 + hasard() * 0.66);
            ctx.beginPath();
            ctx.moveTo(x, cy - demi);
            ctx.bezierCurveTo(x + 6, cy - demi * 0.3, x - 6, cy + demi * 0.3, x + 3, cy + demi);
            ctx.stroke();
        }
    } else if (motif === 'ecailles') {
        ctx.strokeStyle = melanger(corps, '#101820', 0.3);
        ctx.lineWidth = 1;
        for (let colonne = 0; colonne < 12; colonne++) {
            for (let rang = 0; rang < 4; rang++) {
                const x = museauX + longueur * (0.16 + colonne * 0.055);
                const y = cy - demi * 0.6 + rang * demi * 0.5;
                ctx.beginPath();
                ctx.arc(x, y, demi * 0.13, 0.2, Math.PI - 0.2);
                ctx.stroke();
            }
        }
    } else if (motif === 'argent') {
        // Reflet métallique : une bande claire le long du flanc.
        const reflet = ctx.createLinearGradient(0, cy - demi * 0.5, 0, cy + demi * 0.3);
        reflet.addColorStop(0, 'rgba(255,255,255,0)');
        reflet.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        reflet.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = reflet;
        ctx.fillRect(museauX, cy - demi, longueur, hauteurCorps);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Contour fin pour « poser » la silhouette sur n'importe quel fond.
    ctx.strokeStyle = melanger(corps, '#0a0f14', 0.55);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Nageoire pectorale (par-dessus le flanc).
    ctx.fillStyle = nageoire;
    ctx.beginPath();
    ctx.moveTo(museauX + longueur * 0.30, cy + demi * 0.1);
    ctx.bezierCurveTo(museauX + longueur * 0.40, cy + demi * 0.5,
        museauX + longueur * 0.34, cy + demi * 0.7,
        museauX + longueur * 0.24, cy + demi * 0.45);
    ctx.closePath();
    ctx.fill();

    // Opercule (joue) + œil + bouche.
    ctx.strokeStyle = melanger(corps, '#0a0f14', 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(museauX + longueur * forme.tete * 0.92, cy, demi * 0.62, -Math.PI / 2.4, Math.PI / 2.4);
    ctx.stroke();
    const oeilX = museauX + longueur * forme.tete * 0.42;
    const oeilY = cy - demi * 0.26;
    const oeilR = Math.max(2.2, demi * 0.13);
    ctx.fillStyle = oeil;
    ctx.beginPath();
    ctx.arc(oeilX, oeilY, oeilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(oeilX + oeilR * 0.18, oeilY, oeilR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(oeilX - oeilR * 0.3, oeilY - oeilR * 0.3, oeilR * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = melanger(corps, '#0a0f14', 0.6);
    ctx.beginPath();
    ctx.moveTo(museauX + 1, cy + demi * 0.18);
    ctx.lineTo(museauX + longueur * forme.tete * 0.6, cy + demi * 0.30);
    ctx.stroke();

    // Barbillons du silure : deux moustaches sous le museau.
    if (forme.barbillons) {
        ctx.strokeStyle = melanger(corps, '#101820', 0.2);
        ctx.lineWidth = 1.6;
        for (const ecart of [0.06, 0.14]) {
            ctx.beginPath();
            ctx.moveTo(museauX + longueur * 0.05, cy + demi * 0.25);
            ctx.bezierCurveTo(museauX - longueur * 0.02, cy + demi * (0.7 + ecart),
                museauX + longueur * 0.06, cy + demi * (0.9 + ecart),
                museauX + longueur * 0.02, cy + demi * (1.3 + ecart));
            ctx.stroke();
        }
    }
}

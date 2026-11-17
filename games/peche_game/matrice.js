// ---------------------------------------------------------------------------
// matrice.js — page de visualisation de la matrice des touches (matrice.html).
// Aucune règle ici : tout vient de chanceTouche.js (le jeu) et de matriceTouche.js (le test).
// ---------------------------------------------------------------------------
import { SPECIES } from './especes.js?v=257';
import { ESCHES } from './esches.js?v=257';
import { SUBSTRATS } from './substrats.js?v=257';
import { evaluerTouche, RAISONS } from './chanceTouche.js?v=257';
import { verifierRegles, verifierTousMilieux, aSurveiller, taillesDe, nomEsche, ESCHES_MATRICE } from './matriceTouche.js?v=257';

const LETTRE = { accroche: 'A', couche: 'C', esche: 'E', taille: 'T' };
const EAUX_FINES = [];       // profondeur d'eau, 0,5 → 4,25 m (unités : 1 → 8,5)
for (let u = 1; u <= 8.5; u += 0.5) { EAUX_FINES.push(u); }
const LIGNES_FINES = [];     // longueur de ligne, 0,25 → 3,5 m (unités : 0,5 → 7)
for (let u = 0.5; u <= 7; u += 0.5) { LIGNES_FINES.push(u); }

const $ = id => document.getElementById(id);
const metres = u => (u / 2).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' m';
const pourcent = c => Math.round(c * 100) + ' %';
const couleur = c => 'hsl(' + Math.round(c * 120) + ' 70% ' + (42 - c * 4) + '%)';
const nomFond = id => (SUBSTRATS.find(s => s.id === id) || { nom: id }).nom;
const echapper = t => String(t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

let especeChoisie = null;

// --- Vérifications ----------------------------------------------------------------
const verif = verifierRegles();
$('resumeRegles').textContent = verif.cas.toLocaleString('fr-FR') + ' situations calculées · '
    + verif.regles.filter(r => r.ok).length + ' règles sur ' + verif.regles.length + ' respectées.';
$('regles').innerHTML = verif.regles.map(r => '<li class="' + (r.ok ? 'ok' : 'ko') + '">' + echapper(r.nom)
    + (r.ok ? '' : ' <span class="detail">(' + echapper(r.detail) + ')</span>') + '</li>').join('');
const surveiller = aSurveiller(verif.resume);
$('surveiller').innerHTML = surveiller.length
    ? surveiller.map(a => '<li>' + echapper(a.texte) + '</li>').join('')
    : '<li>Rien à signaler.</li>';

// --- Règles par biotope (milieux.js) : taille maximale de l'étang, espèces présentes ---------
$('reglesMilieux').innerHTML = verifierTousMilieux().map(m => '<li class="' + (m.ok ? 'ok' : 'ko') + '">' + echapper(m.nom)
    + ' : ' + m.regles.map(r => echapper(r.id) + (r.ok ? ' ✓' : ' ✗ (' + echapper(r.detail) + ')')).join(' · ')
    + (m.perdues.length ? ' <span class="detail">esches inutilisables : ' + m.perdues.map(p => echapper(p.espece + '/' + p.esche)).join(', ') + '</span>' : '')
    + '</li>').join('');

// --- Tableau espèce × esche --------------------------------------------------------
function contexteTexte(ctx) {
    if (!ctx) { return 'jamais'; }
    return 'eau ' + metres(ctx.profondeurEau) + (ctx.quiver ? ', quiver' : ', ligne ' + metres(ctx.profondeurLigne))
        + ', ' + nomFond(ctx.substrat).toLowerCase() + ', ' + ctx.longueurCm + ' cm';
}
function rendreResume() {
    const res = verif.resume;
    let html = '<thead><tr><th class="espece">Poisson</th>' + ESCHES_MATRICE.map(id =>
        '<th>' + (id ? ESCHES.find(e => e.id === id).icone + ' ' : '🪝 ') + echapper(nomEsche(id)) + '</th>').join('') + '</tr></thead><tbody>';
    SPECIES.forEach(function (e) {
        const meilleure = res.meilleur[e.id].chance;
        html += '<tr><th class="espece">' + echapper(e.nom) + '</th>';
        ESCHES_MATRICE.forEach(function (id) {
            const pe = res.parEsche[e.id + '|' + (id || 'nu')];
            const classe = pe.max <= 0 ? 'nul' : (pe.max >= meilleure - 1e-9 ? 'meilleure' : '');
            html += '<td class="' + classe + '" data-espece="' + e.id + '" data-esche="' + (id || 'nu') + '"'
                + (pe.max > 0 ? ' style="background:' + couleur(pe.max) + '"' : '')
                + ' title="' + echapper(e.nom + ' + ' + nomEsche(id) + ' : ' + pourcent(pe.max) + ' au mieux (' + contexteTexte(pe.ctx) + ')') + '">'
                + (pe.max > 0 ? pourcent(pe.max) : '—') + '</td>';
        });
        html += '</tr>';
    });
    $('tableResume').innerHTML = html + '</tbody>';
}
$('tableResume').addEventListener('click', function (ev) {
    const td = ev.target.closest('td[data-espece]');
    if (!td) { return; }
    especeChoisie = td.dataset.espece;
    const pe = verif.resume.parEsche[td.dataset.espece + '|' + td.dataset.esche];
    $('choixEsche').value = td.dataset.esche;
    if (pe && pe.ctx) { $('choixFond').value = pe.ctx.substrat; $('choixQuiver').checked = !!pe.ctx.quiver; }
    rendreCartes();
    const carte = document.querySelector('.carte[data-espece="' + especeChoisie + '"]');
    if (carte) { carte.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
});

// --- Explorateur : une carte de chaleur par espèce ------------------------------------
$('choixEsche').innerHTML = ESCHES_MATRICE.map(id => '<option value="' + (id || 'nu') + '">' + echapper(nomEsche(id)) + '</option>').join('');
$('choixFond').innerHTML = SUBSTRATS.map(s => '<option value="' + s.id + '">' + echapper(s.nom) + '</option>').join('');
$('choixFond').value = 'vase';

function rendreCartes() {
    const esche = $('choixEsche').value === 'nu' ? null : $('choixEsche').value;
    const substrat = $('choixFond').value;
    const taille = Number($('choixTaille').value);
    const temperature = Number($('choixTemperature').value);
    const mode = $('choixMode').value;
    const quiver = $('choixQuiver').checked;
    const colonnes = quiver ? [0] : LIGNES_FINES;
    let html = '';
    SPECIES.forEach(function (e) {
        const cm = taillesDe(e)[taille];
        let max = 0;
        let cellules = '<div class="axe">eau</div>' + colonnes.map(l => '<div class="axe">' + (quiver ? 'fond' : (l % 2 === 0 ? l / 2 : '')) + '</div>').join('');
        EAUX_FINES.forEach(function (eau) {
            cellules += '<div class="axe">' + (eau % 1 === 0 ? eau / 2 : '') + '</div>';
            colonnes.forEach(function (ligne) {
                const r = evaluerTouche({ especeId: e.id, longueurCm: cm, esche: esche, profondeurEau: eau, profondeurLigne: ligne,
                    substrat: substrat, temperature: temperature, mode: mode, quiver: quiver });
                max = Math.max(max, r.chance);
                const titre = 'eau ' + metres(eau) + (quiver ? ', quiver' : ', ligne ' + metres(ligne)) + ' (' + r.couche + ') : '
                    + (r.possible ? pourcent(r.chance) : RAISONS[r.raison]);
                cellules += r.possible
                    ? '<div style="background:' + couleur(r.chance) + '" title="' + echapper(titre) + '"></div>'
                    : '<div class="impossible" title="' + echapper(titre) + '">' + LETTRE[r.raison] + '</div>';
            });
        });
        html += '<div class="carte' + (e.id === especeChoisie ? ' selection' : '') + '" data-espece="' + e.id + '">'
            + '<h4>' + echapper(e.nom) + ' <small>' + cm + ' cm · au mieux ' + pourcent(max) + '</small></h4>'
            + '<div class="grille" style="grid-template-columns: 18px repeat(' + colonnes.length + ', minmax(0, 1fr))">' + cellules + '</div>'
            + '<div class="axes"><span>↓ profondeur d’eau (m)</span><span>' + (quiver ? '' : 'longueur de ligne (m) →') + '</span></div></div>';
    });
    $('cartes').innerHTML = html;
}
['choixEsche', 'choixFond', 'choixTaille', 'choixTemperature', 'choixMode', 'choixQuiver'].forEach(function (id) {
    $(id).addEventListener('change', function () { especeChoisie = null; rendreCartes(); });
});

rendreResume();
rendreCartes();

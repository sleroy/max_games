// ---------------------------------------------------------------------------
// fiches.js — ONGLET ESPÈCES : une fiche par poisson (silhouette, zone de vie, comportement). Extrait de script.js (v151).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=201';

export function creerFiches(deps) {
    const {
        FORMES, especeFiche, SPECIES, journal, TOUCHES_PAR_ID, fmtPoids, especePage,
        tabBtnEspeces, especePrev, especeNext
    } = deps;

    // ---------------------------------------------------------------------------
    // Onglet « Espèces » : une fiche par poisson (Précédent / Suivant).
    // ---------------------------------------------------------------------------
    function zoneDeProfondeur(mid) {
        if (mid >= etat.ZONES_CARTE[0].min) {
            return etat.ZONES_CARTE[0].nom;
        }
        if (mid >= etat.ZONES_CARTE[1].min) {
            return etat.ZONES_CARTE[1].nom;
        }
        return etat.ZONES_CARTE[2].nom;
    }

    function abondanceLabel(a) {
        if (a >= 9) return 'très commune';
        if (a >= 6) return 'commune';
        if (a >= 3) return 'peu commune';
        return 'rare';
    }

    function comportementLabel(agressivite) {
        const a = (agressivite[0] + agressivite[1]) / 2;
        if (a >= 1.1) return 'vif et combatif';
        if (a >= 0.85) return 'combatif';
        return 'calme';
    }

    // Silhouette simple de l'espèce, d'après sa forme 3D et sa couleur.
    function silhouetteEspece(e) {
        const forme = FORMES[e.form] || FORMES.fusiforme;
        const couleur = '#' + ('000000' + (e.couleur || 0x99a0a5).toString(16)).slice(-6);
        const bx = Math.min(44, 20 + forme.bodyX * 11);
        const by = Math.min(28, 7 + forme.bodyY * 17);
        const gauche = 64 - bx;
        return '<svg class="espece-silhouette" viewBox="0 0 120 56" role="img" aria-label="' + e.nom + '">'
            + '<polygon points="18,28 ' + (gauche + 8).toFixed(1) + ',12 '
            + (gauche + 8).toFixed(1) + ',44" fill="' + couleur + '"/>'
            + '<ellipse cx="64" cy="28" rx="' + bx.toFixed(1) + '" ry="' + by.toFixed(1)
            + '" fill="' + couleur + '"/>'
            + '<circle cx="' + (64 + bx * 0.62).toFixed(1) + '" cy="24" r="2.4" fill="#111"/>'
            + '</svg>';
    }

    function ligneEspece(label, valeur) {
        return '<div class="espece-ligne"><b>' + label + '</b><span>' + valeur + '</span></div>';
    }

    function renderEspece() {
        if (!especeFiche) {
            return;
        }
        const liste = SPECIES;
        if (!liste.length) {
            return;
        }
        etat.especeIndex = ((etat.especeIndex % liste.length) + liste.length) % liste.length;
        const e = liste[etat.especeIndex];
        const fiche = journal.especes[e.nom] || { n: 0, record: 0 };
        const p = e.profondeur || [-3.4, -0.9];
        // Style propre à l'espèce : ses touches et sa façon de se battre.
        const style = etat.styleEspece(e.id);
        const nomsTouches = style.touchesVraies.map(function (id) {
            const t = TOUCHES_PAR_ID[id];
            return t ? t.nom : id;
        }).join(' · ');
        const infos = ligneEspece('Taille réelle', e.cm[0] + ' à ' + e.cm[1] + ' cm')
            + ligneEspece('Poids', fmtPoids(etat.poidsRealisteKilos(e, e.cm[0])) + ' à '
                + fmtPoids(etat.poidsRealisteKilos(e, e.cm[1])))
            + ligneEspece('Où ?', zoneDeProfondeur((p[0] + p[1]) / 2))
            + ligneEspece('Comportement', comportementLabel(e.agressivite))
            + ligneEspece('Touches', nomsTouches || '—')
            + ligneEspece('Combat', style.nom + ' : ' + style.resume)
            + ligneEspece('Abondance', abondanceLabel(e.abondance))
            + ligneEspece('Silhouette', e.form);
        especeFiche.innerHTML = silhouetteEspece(e)
            + '<h3 class="espece-nom">' + e.nom + '</h3>'
            + '<div class="espece-infos">' + infos + '</div>'
            + '<div class="espece-record">' + (fiche.n > 0
                ? '🧺 ' + fiche.n + (fiche.n > 1 ? ' prises' : ' prise') + ' · record '
                    + fmtPoids(fiche.record || 0)
                : 'Pas encore attrapé — à toi de jouer !')
            + '</div>';
        especePage.textContent = (etat.especeIndex + 1) + ' / ' + liste.length;
        // Le nom de l'onglet rappelle combien d'espèces ont été découvertes.
        if (tabBtnEspeces) {
            const decouvertes = liste.filter(function (s) {
                return journal.especes[s.nom] && journal.especes[s.nom].n > 0;
            }).length;
            tabBtnEspeces.textContent = '🐟 Espèces (' + decouvertes + '/' + liste.length + ')';
        }
    }

    if (especePrev) {
        especePrev.addEventListener('click', function () {
            etat.especeIndex -= 1;
            renderEspece();
        });
    }
    if (especeNext) {
        especeNext.addEventListener('click', function () {
            etat.especeIndex += 1;
            renderEspece();
        });
    }

    return {
        renderEspece
    };
}

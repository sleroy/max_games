// ---------------------------------------------------------------------------
// fiches.js — ONGLET ESPÈCES : une fiche par poisson (aperçu 3D, photo réelle, zone de vie, comportement). Extrait de script.js (v151).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=226';
import { apercuPartage } from './apercuPoisson.js?v=226';

const URL_PHOTOS = 'assets/references/photos.json';   // photos de référence (voir assets/references/SOURCES.md)

export function creerFiches(deps) {
    const {
        FORMES, especeFiche, SPECIES, journal, TOUCHES_PAR_ID, fmtPoids, especePage,
        tabBtnEspeces, especePrev, especeNext
    } = deps;

    // ---------------------------------------------------------------------------
    // Aperçu 3D (rendu hors écran, créé au premier besoin) et photos réelles.
    // ---------------------------------------------------------------------------
    let apercu = null;
    const apercusPrets = new Map();   // id d'espèce -> data URL déjà rendu
    let promessePhotos = null;        // photos.json, chargé une seule fois
    let jeton = 0;                    // identifie la fiche affichée (évite les retours tardifs)

    function chargerPhotos() {
        if (!promessePhotos) {
            promessePhotos = Promise.resolve().then(function () {
                if (typeof fetch !== 'function') { return {}; }
                return fetch(URL_PHOTOS).then(function (reponse) {
                    if (!reponse.ok) { throw new Error('HTTP ' + reponse.status); }
                    return reponse.json();
                });
            }).then(function (donnees) {
                return donnees && typeof donnees === 'object' ? donnees : {};
            }).catch(function () { return {}; });
        }
        return promessePhotos;
    }

    // Chemin relatif au jeu uniquement (pas d'URL externe, pas de remontée de dossier).
    function cheminSur(chemin) {
        return typeof chemin === 'string' && chemin !== ''
            && !/^([a-z][a-z0-9+.-]*:|\/|\\)/i.test(chemin) && chemin.indexOf('..') === -1;
    }

    // Taille moyenne de l'espèce : celle de l'aperçu.
    function tailleMoyenne(e) {
        return (e.cm[0] + e.cm[1]) / 2;
    }

    function balisesApercu(e, url) {
        return '<img class="espece-apercu" src="' + url + '" alt="Modèle 3D : ' + e.nom
            + ' de ' + tailleMoyenne(e) + ' cm" decoding="async">';
    }

    // Rendu 3D après l'ouverture de la fiche (le carnet n'attend pas le WebGL).
    function rendreApercu(e, visuel, mien) {
        if (!apercu) {
            apercu = apercuPartage();
        }
        const url = apercu.rendre(e, tailleMoyenne(e));
        if (!url || mien !== jeton) { return; }   // pas de WebGL : la silhouette reste
        apercusPrets.set(e.id, url);
        const silhouette = visuel.querySelector('.espece-silhouette');
        if (!silhouette) { return; }
        const image = document.createElement('img');
        image.className = 'espece-apercu';
        image.src = url;
        image.alt = 'Modèle 3D : ' + e.nom + ' de ' + tailleMoyenne(e) + ' cm';
        image.decoding = 'async';
        silhouette.replaceWith(image);
    }

    // Photo réelle + crédit (auteur · licence). Rien n'est ajouté si elle manque.
    function ajouterPhoto(e, visuel, mien) {
        chargerPhotos().then(function (photos) {
            const entree = Object.prototype.hasOwnProperty.call(photos, e.id) ? photos[e.id] : null;
            if (mien !== jeton || !entree || typeof entree !== 'object' || !cheminSur(entree.fichier)) {
                return;
            }
            const image = document.createElement('img');
            image.alt = 'Photo de ' + e.nom;
            image.decoding = 'async';
            // La figure n'entre dans la fiche qu'une fois l'image chargée : pas de cadre cassé.
            image.addEventListener('load', function () {
                if (mien !== jeton) { return; }
                const figure = document.createElement('figure');
                figure.className = 'espece-photo';
                figure.append(image);
                const auteur = typeof entree.auteur === 'string' ? entree.auteur.trim() : '';
                const licence = typeof entree.licence === 'string' ? entree.licence.trim() : '';
                const credit = [auteur, licence].filter(Boolean).join(' · ');
                if (credit !== '') {
                    const legende = document.createElement('figcaption');
                    if (typeof entree.page === 'string' && /^https:\/\//i.test(entree.page)) {
                        const lien = document.createElement('a');
                        lien.href = entree.page;
                        lien.target = '_blank';
                        lien.rel = 'noopener noreferrer';
                        lien.textContent = credit;
                        lien.title = 'Voir la photo et sa licence';
                        legende.append(lien);
                    } else {
                        legende.textContent = credit;
                    }
                    figure.append(legende);
                }
                visuel.append(figure);
            });
            image.src = entree.fichier;
        });
    }

    // Complète la fiche (hors chemin critique) : aperçu 3D puis photo.
    function completerVisuel(e, mien, apercuDejaPret) {
        if (typeof especeFiche.querySelector !== 'function') { return; }
        const visuel = especeFiche.querySelector('.espece-visuel');
        if (!visuel) { return; }
        if (!apercuDejaPret) {
            setTimeout(function () {
                if (mien === jeton) { rendreApercu(e, visuel, mien); }
            }, 0);
        }
        ajouterPhoto(e, visuel, mien);
    }

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
        // Aperçu 3D déjà rendu : affiché tout de suite ; sinon silhouette en attendant.
        const urlApercu = apercusPrets.get(e.id) || null;
        const mien = ++jeton;
        especeFiche.innerHTML = '<div class="espece-visuel">'
            + (urlApercu ? balisesApercu(e, urlApercu) : silhouetteEspece(e)) + '</div>'
            + '<h3 class="espece-nom">' + e.nom + '</h3>'
            + '<div class="espece-infos">' + infos + '</div>'
            + '<div class="espece-record">' + (fiche.n > 0
                ? '🧺 ' + fiche.n + (fiche.n > 1 ? ' prises' : ' prise') + ' · record '
                    + fmtPoids(fiche.record || 0)
                : 'Pas encore attrapé — à toi de jouer !')
            + '</div>';
        completerVisuel(e, mien, !!urlApercu);
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

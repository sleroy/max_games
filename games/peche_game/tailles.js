// ---------------------------------------------------------------------------
// tailles.js — PAGE DE VÉRIFICATION DES TAILLES (tailles.html).
//
// But : voir chaque espèce du jeu à sa taille MINIMALE et à sa taille MAXIMALE,
// toutes dessinées à la même échelle, pour contrôler l'aspect visuel.
//
// Le poisson vient du même module que le jeu (`modelePoisson.js`) et la taille
// est calculée par la même formule (`echellePourTaille`) : ce que montre la page
// est exactement le maillage de l'étang. Chaque poisson est rendu une fois hors
// écran (apercuPoisson.js), recadré au pixel près, puis affiché à sa longueur réelle.
// ---------------------------------------------------------------------------
import { SPECIES, poidsKilos } from './especes.js?v=229';
import { creerApercuPoisson } from './apercuPoisson.js?v=229';

const LARGEUR_RENDU = 1200;   // résolution interne d'un portrait (assez pour la loupe)
const HAUTEUR_RENDU = 800;
const PX_CM_DEFAUT = 3;       // échelle d'affichage au chargement (1 cm = 3 px)
const PX_CM_MIN = 0.8;
const PX_CM_MAX = 6;
const CLÉ_ECHELLE = 'peche-tailles-px-cm';
const URL_PHOTOS = 'assets/references/photos.json';   // photos de référence (voir SOURCES.md)

// Poids lisible : grammes sous 1 kg, kilos arrondis au-dessus.
function formaterPoids(kg) {
    if (kg < 1) {
        return Math.round(kg * 1000) + ' g';
    }
    const decimales = kg < 10 ? 2 : 1;
    return kg.toFixed(decimales).replace('.', ',') + ' kg';
}

function formaterNombre(n, decimales) {
    return n.toFixed(decimales === undefined ? 1 : decimales).replace('.', ',');
}

// --- Photos de référence ----------------------------------------------------
// Charge photos.json. Ne rejette jamais : en cas d'échec (fichier absent, JSON
// invalide, page ouverte en file://), renvoie {} et la page affiche « photo à venir ».
function chargerPhotos() {
    if (typeof fetch !== 'function') {
        return Promise.resolve({});
    }
    return fetch(URL_PHOTOS, { cache: 'no-cache' })
        .then(function (reponse) {
            if (!reponse.ok) { throw new Error('HTTP ' + reponse.status); }
            return reponse.json();
        })
        .then(function (donnees) {
            return donnees && typeof donnees === 'object' ? donnees : {};
        })
        .catch(function () { return {}; });
}

// Chemin relatif au jeu uniquement (pas d'URL externe, pas de remontée de dossier).
function cheminSur(chemin) {
    return typeof chemin === 'string' && chemin !== '' && !/^([a-z][a-z0-9+.-]*:|\/|\\)/i.test(chemin)
        && chemin.indexOf('..') === -1;
}

function creerReference() {
    const figure = document.createElement('figure');
    figure.className = 'reference';
    const cadre = document.createElement('div');
    cadre.className = 'reference-cadre';
    figure.append(cadre);
    return figure;
}

// Cadre « photo à venir » (aussi utilisé si l'image ne se charge pas).
function montrerPhotoAVenir(figure, espece) {
    figure.classList.add('vide');
    figure.querySelector('.reference-cadre').replaceChildren(
        Object.assign(document.createElement('span'), {
            className: 'reference-vide',
            textContent: 'photo à venir'
        })
    );
    const ancienne = figure.querySelector('figcaption');
    if (ancienne) { ancienne.remove(); }
    figure.title = 'Pas encore de photo de référence pour ' + espece.nom;
}

function montrerPhoto(figure, espece, entree) {
    if (!entree || typeof entree !== 'object' || !cheminSur(entree.fichier)) {
        montrerPhotoAVenir(figure, espece);
        return;
    }
    const image = document.createElement('img');
    image.className = 'reference-image';
    image.alt = 'Photo de ' + espece.nom;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', function () { montrerPhotoAVenir(figure, espece); });
    image.src = entree.fichier;
    figure.classList.remove('vide');
    figure.removeAttribute('title');
    figure.querySelector('.reference-cadre').replaceChildren(image);

    // Crédit discret : auteur · licence (lien vers la page d'origine si possible).
    const ancienne = figure.querySelector('figcaption');
    if (ancienne) { ancienne.remove(); }
    const credit = document.createElement('figcaption');
    const auteur = typeof entree.auteur === 'string' ? entree.auteur.trim() : '';
    const licence = typeof entree.licence === 'string' ? entree.licence.trim() : '';
    const texte = [auteur, licence].filter(Boolean).join(' · ');
    if (texte !== '') {
        if (typeof entree.page === 'string' && /^https:\/\//i.test(entree.page)) {
            const lien = document.createElement('a');
            lien.href = entree.page;
            lien.target = '_blank';
            lien.rel = 'noopener noreferrer';
            lien.textContent = texte;
            lien.title = 'Voir la photo et sa licence sur Wikimedia Commons';
            credit.append(lien);
        } else {
            credit.textContent = texte;
        }
        figure.append(credit);
    }
}

function creerVueLigne(espece) {
    const article = document.createElement('article');
    article.className = 'espece';
    article.dataset.espece = espece.id;

    // --- colonne collante : le nom de l'espèce -----------------------------
    const nom = document.createElement('div');
    nom.className = 'nom';
    const titre = document.createElement('h2');
    titre.textContent = espece.nom;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = 'Silhouette ' + espece.form
        + ' · K ' + formaterNombre(espece.k);
    nom.append(titre, meta);

    // --- colonne photo de référence (remplie quand photos.json est chargé) ----
    const reference = creerReference();
    montrerPhotoAVenir(reference, espece);

    // --- colonne des deux tailles ----------------------------------------
    const specimens = document.createElement('div');
    specimens.className = 'specimens';
    article.append(nom, reference, specimens);

    return { article, specimens, reference };
}

function creerSpecimen(espece, role, cm) {
    const bloc = document.createElement('div');
    bloc.className = 'specimen';
    bloc.style.setProperty('--cm', String(cm));

    const tete = document.createElement('div');
    tete.className = 'specimen-tete';

    const badge = document.createElement('span');
    badge.className = 'badge ' + role;
    badge.textContent = role === 'min' ? 'MIN' : 'MAX';

    const taille = document.createElement('span');
    taille.className = 'taille';
    taille.textContent = cm + ' cm';

    const poids = document.createElement('span');
    poids.className = 'poids';
    poids.textContent = formaterPoids(poidsKilos(espece, cm));

    tete.append(badge, taille, poids);

    // Comparaison avec l'autre borne : le poids varie comme le cube de la taille.
    if (role === 'max') {
        const ratio = document.createElement('span');
        ratio.className = 'ratio';
        ratio.textContent = '×' + formaterNombre(Math.pow(cm / espece.cm[0], 3), 1)
            + ' le poids du minimum';
        tete.append(ratio);
    }

    // Le bouton ouvre la loupe (l'image est ajoutée après le rendu).
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'vue';
    bouton.setAttribute('aria-label',
        'Agrandir ' + espece.nom + ' de ' + cm + ' cm (' + role + ')');

    const image = document.createElement('img');
    image.alt = espece.nom + ' de ' + cm + ' cm (' + (role === 'min' ? 'minimum' : 'maximum') + ')';
    image.decoding = 'async';
    bouton.append(image);

    // Règle graduée : sa longueur affichée est la longueur nominale du poisson.
    const regle = document.createElement('div');
    regle.className = 'regle';
    regle.setAttribute('aria-hidden', 'true');
    const valeur = document.createElement('span');
    valeur.className = 'regle-valeur';
    valeur.textContent = cm + ' cm';
    regle.append(valeur);

    bloc.append(tete, bouton, regle);
    return {
        bloc: bloc,
        image: image,
        bouton: bouton,
        espece: espece,
        role: role,
        cm: cm
    };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function initPage() {
    const galerie = document.getElementById('galerie');
    const compte = document.getElementById('compte');
    const curseur = document.getElementById('curseur');
    const valeurEchelle = document.getElementById('valeurEchelle');
    const tri = document.getElementById('tri');
    const loupe = document.getElementById('loupe');
    const loupeTitre = document.getElementById('loupeTitre');
    const loupeImage = document.getElementById('loupeImage');
    const loupePied = document.getElementById('loupePied');
    const loupeFermer = document.getElementById('loupeFermer');

    const modeles = [];      // { article, specimens, espece }
    const specimens = [];    // un par taille (min / max)
    const references = [];   // { figure, espece } : cadre photo de chaque espèce

    SPECIES.forEach(function (espece) {
        const ligne = creerVueLigne(espece);
        ['min', 'max'].forEach(function (role) {
            const cm = role === 'min' ? espece.cm[0] : espece.cm[1];
            const specimen = creerSpecimen(espece, role, cm);
            ligne.specimens.append(specimen.bloc);
            specimens.push(specimen);
        });
        galerie.append(ligne.article);
        modeles.push({ article: ligne.article, specimens: ligne.specimens, espece: espece });
        references.push({ figure: ligne.reference, espece: espece });
    });

    // Photos de référence : chargées en parallèle du rendu 3D, jamais bloquantes.
    chargerPhotos().then(function (photos) {
        references.forEach(function (ref) {
            const entree = Object.prototype.hasOwnProperty.call(photos, ref.espece.id)
                ? photos[ref.espece.id] : null;
            if (entree) { montrerPhoto(ref.figure, ref.espece, entree); }
        });
    });

    document.getElementById('resume').textContent = SPECIES.length + ' espèces · '
        + (SPECIES.length * 2) + ' modèles · de '
        + Math.min.apply(null, SPECIES.map(function (e) { return e.cm[0]; })) + ' cm à '
        + Math.max.apply(null, SPECIES.map(function (e) { return e.cm[1]; })) + ' cm';

    // Ordre des lignes.
    function appliquerTri() {
        const mode = tri.value;
        modeles.slice().sort(function (a, b) {
            if (mode === 'nom') {
                return a.espece.nom.localeCompare(b.espece.nom, 'fr');
            }
            if (mode === 'max') {
                return a.espece.cm[1] - b.espece.cm[1];
            }
            return SPECIES.indexOf(a.espece) - SPECIES.indexOf(b.espece);
        }).forEach(function (modele) {
            galerie.append(modele.article);
        });
    }
    tri.addEventListener('change', appliquerTri);
    appliquerTri();

    // Échelle d'affichage : la même pour tous les poissons de la page.
    function appliquerEchelle(pxCm) {
        document.documentElement.style.setProperty('--px-cm', pxCm + 'px');
        valeurEchelle.textContent = formaterNombre(pxCm, 1) + ' px/cm';
        try {
            localStorage.setItem(CLÉ_ECHELLE, String(pxCm));
        } catch (erreur) { /* stockage indisponible : on continue sans mémoire */ }
    }

    let depart = PX_CM_DEFAUT;
    try {
        const memo = parseFloat(localStorage.getItem(CLÉ_ECHELLE));
        if (isFinite(memo)) {
            depart = Math.min(PX_CM_MAX, Math.max(PX_CM_MIN, memo));
        }
    } catch (erreur) { /* stockage indisponible */ }

    curseur.min = String(PX_CM_MIN);
    curseur.max = String(PX_CM_MAX);
    curseur.step = '0.2';
    curseur.value = String(depart);
    appliquerEchelle(depart);
    curseur.addEventListener('input', function () {
        appliquerEchelle(parseFloat(curseur.value));
    });

    // --- Loupe ------------------------------------------------------------
    specimens.forEach(function (specimen) {
        specimen.bouton.addEventListener('click', function () {
            const espece = specimen.espece;
            const cm = specimen.cm;
            const role = specimen.role;
            loupeTitre.textContent = espece.nom + ' — '
                + (role === 'min' ? 'minimum' : 'maximum') + ' ' + cm + ' cm';
            loupeImage.src = specimen.image.src;
            loupeImage.alt = specimen.image.alt;
            const poids = poidsKilos(espece, cm);
            const autre = role === 'min' ? espece.cm[1] : espece.cm[0];
            loupePied.textContent = 'Poids estimé ' + formaterPoids(poids)
                + ' · silhouette ' + espece.form
                + ' · ' + (role === 'min' ? 'maximum' : 'minimum') + ' de l\'espèce : '
                + autre + ' cm (' + formaterPoids(poidsKilos(espece, autre)) + ')';
            if (typeof loupe.showModal === 'function') {
                loupe.showModal();
            }
        });
    });
    loupeFermer.addEventListener('click', function () { loupe.close(); });
    loupe.addEventListener('click', function (evenement) {
        if (evenement.target === loupe) { loupe.close(); }
    });

    // --- Fabrication des poissons (progressive, pour garder la page vivante) --
    const moteur = creerApercuPoisson({ largeur: LARGEUR_RENDU, hauteur: HAUTEUR_RENDU });
    let faits = 0;
    let echecs = 0;

    function uneEspece(index) {
        if (index >= specimens.length) {
            moteur.liberer();
            compte.textContent = echecs > 0
                ? 'Rendu 3D indisponible (WebGL) : ' + echecs + ' poisson(s) non affiché(s)'
                : specimens.length + ' poissons affichés';
            return;
        }
        const specimen = specimens[index];
        const rendu = moteur.rendre(specimen.espece, specimen.cm);
        if (rendu) {
            specimen.image.src = rendu;
        } else {
            specimen.bouton.disabled = true;   // pas de WebGL : rien à agrandir
            echecs++;
        }
        faits++;
        compte.textContent = 'Fabrication… ' + faits + ' / ' + specimens.length;
        // Toutes les 2 images, on rend la main au navigateur (barre de chargement).
        if (faits % 2 === 0 || index === specimens.length - 1) {
            setTimeout(function () { uneEspece(index + 1); }, 0);
        } else {
            uneEspece(index + 1);
        }
    }

    uneEspece(0);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

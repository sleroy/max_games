// ---------------------------------------------------------------------------
// tailles.js — PAGE DE VÉRIFICATION DES TAILLES (tailles.html).
//
// But : voir chaque espèce du jeu à sa taille MINIMALE et à sa taille MAXIMALE,
// toutes dessinées à la même échelle, pour contrôler l'aspect visuel.
//
// Le poisson vient du même module que le jeu (`modelePoisson.js`) et la taille
// est calculée par la même formule (`echellePourTaille`) : ce que montre la page
// est exactement le maillage de l'étang. Chaque poisson est rendu une fois hors
// écran, recadré au pixel près, puis affiché à sa longueur réelle.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { SPECIES, poidsKilos } from './especes.js?v=195';
import { creerModelePoisson, echellePourTaille } from './modelePoisson.js?v=195';

const LARGEUR_RENDU = 1200;   // résolution interne d'un portrait (assez pour la loupe)
const HAUTEUR_RENDU = 800;
const MARGE = 1.12;           // 6 % d'air de chaque côté, pour ne pas couper une nageoire
const PX_CM_DEFAUT = 3;       // échelle d'affichage au chargement (1 cm = 3 px)
const PX_CM_MIN = 0.8;
const PX_CM_MAX = 6;
const CLÉ_ECHELLE = 'peche-tailles-px-cm';

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

    // --- colonne des deux tailles ----------------------------------------
    const specimens = document.createElement('div');
    specimens.className = 'specimens';
    article.append(nom, specimens);

    return { article, specimens };
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
// Moteur de rendu hors écran : un WebGLRenderer, une scène, deux lumières.
// Un poisson est ajouté, cadré, rendu, recadré (transparence) puis jeté.
// ---------------------------------------------------------------------------
function creerMoteurRendu() {
    const canvas = document.createElement('canvas');
    canvas.width = LARGEUR_RENDU;
    canvas.height = HAUTEUR_RENDU;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(1);
    renderer.setSize(LARGEUR_RENDU, HAUTEUR_RENDU, false);
    // Même rendu « photo » que le jeu (rendu.js).
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x3a3322, 1.9));
    const cle = new THREE.DirectionalLight(0xfff3df, 2.6);
    cle.position.set(3, 6, 8);
    scene.add(cle);
    const remplissage = new THREE.DirectionalLight(0xbcd8ff, 1.1);
    remplissage.position.set(-5, 2, -4);
    scene.add(remplissage);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

    // Deux canvas 2D : un pour lire les pixels, un pour le recadrage final.
    const lecteur = document.createElement('canvas');
    lecteur.width = LARGEUR_RENDU;
    lecteur.height = HAUTEUR_RENDU;
    const contexteLecture = lecteur.getContext('2d', { willReadFrequently: true });

    const sortie = document.createElement('canvas');
    const contexteSortie = sortie.getContext('2d');

    // Cadre le poisson : vue de profil, très légère plongée pour voir le dos.
    function cadrer(poisson) {
        poisson.updateMatrixWorld(true);
        const boite = new THREE.Box3().setFromObject(poisson);
        const centre = boite.getCenter(new THREE.Vector3());
        const taille = boite.getSize(new THREE.Vector3());
        const aspect = LARGEUR_RENDU / HAUTEUR_RENDU;

        let largeur = Math.max(0.001, taille.x) * MARGE;
        let hauteur = Math.max(0.001, taille.y) * MARGE;
        if (largeur / hauteur < aspect) {
            largeur = hauteur * aspect;
        } else {
            hauteur = largeur / aspect;
        }

        camera.left = -largeur / 2;
        camera.right = largeur / 2;
        camera.top = hauteur / 2;
        camera.bottom = -hauteur / 2;
        camera.position.set(centre.x, centre.y + hauteur * 0.06,
            centre.z + Math.max(10, largeur * 2));
        camera.lookAt(centre.x, centre.y, centre.z);
        camera.updateProjectionMatrix();
    }

    // Recadre sur les pixels visibles : la largeur de l'image devient la
    // longueur exacte du poisson (aucune marge transparente à l'affichage).
    function recadrer() {
        contexteLecture.clearRect(0, 0, LARGEUR_RENDU, HAUTEUR_RENDU);
        contexteLecture.drawImage(canvas, 0, 0);
        const pixels = contexteLecture.getImageData(0, 0, LARGEUR_RENDU, HAUTEUR_RENDU).data;

        let x0 = LARGEUR_RENDU;
        let y0 = HAUTEUR_RENDU;
        let x1 = -1;
        let y1 = -1;
        for (let y = 0; y < HAUTEUR_RENDU; y++) {
            const ligne = y * LARGEUR_RENDU * 4;
            for (let x = 0; x < LARGEUR_RENDU; x++) {
                if (pixels[ligne + x * 4 + 3] > 8) {
                    if (x < x0) { x0 = x; }
                    if (x > x1) { x1 = x; }
                    if (y < y0) { y0 = y; }
                    if (y > y1) { y1 = y; }
                }
            }
        }
        if (x1 < x0 || y1 < y0) {
            return canvas.toDataURL('image/png');
        }

        const largeur = x1 - x0 + 1;
        const hauteur = y1 - y0 + 1;
        sortie.width = largeur;
        sortie.height = hauteur;
        contexteSortie.clearRect(0, 0, largeur, hauteur);
        contexteSortie.drawImage(canvas, x0, y0, largeur, hauteur, 0, 0, largeur, hauteur);
        return sortie.toDataURL('image/png');
    }

    function rendre(espece, longueurCm) {
        const size = echellePourTaille(longueurCm, espece.form);
        // Combativité et agressivité moyennes de l'espèce : seules les tailles
        // changent entre le MIN et le MAX (la queue ne « pousse » pas).
        const power = (espece.combativite[0] + espece.combativite[1]) / 2;
        const aggression = (espece.agressivite[0] + espece.agressivite[1]) / 2;
        const poisson = creerModelePoisson(size, power, aggression, espece.form, espece);

        scene.add(poisson);
        cadrer(poisson);
        renderer.clear();
        renderer.render(scene, camera);
        const source = recadrer();
        scene.remove(poisson);

        // Chaque appel crée ses géométries et matériaux : on les libère. La
        // texture des motifs est partagée (cache de modelePoisson.js) : on ne
        // touche pas à material.map.
        poisson.traverse(function (objet) {
            if (objet.geometry) { objet.geometry.dispose(); }
            if (objet.material && objet.material.dispose) { objet.material.dispose(); }
        });
        return source;
    }

    return {
        rendre: rendre,
        liberer: function () {
            renderer.dispose();
        }
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
    const moteur = creerMoteurRendu();
    let faits = 0;

    function uneEspece(index) {
        if (index >= specimens.length) {
            moteur.liberer();
            compte.textContent = specimens.length + ' poissons affichés';
            return;
        }
        const specimen = specimens[index];
        specimen.image.src = moteur.rendre(specimen.espece, specimen.cm);
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

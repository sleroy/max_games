// ---------------------------------------------------------------------------
// apercuPoisson.js — APERÇU 3D D'UN POISSON en image (data URL PNG).
//
// Un poisson est fabriqué par le même moteur que le jeu (`modelePoisson.js`),
// rendu une fois hors écran avec un WebGLRenderer transparent, cadré sur sa
// boîte englobante (vue de profil, très légère plongée), puis recadré au pixel
// près. Utilisé par la galerie des tailles (tailles.js), la fiche « Espèces »
// du carnet (fiches.js) et le panneau de combat (combat.js, v204). La fiche et
// le combat partagent UNE instance (`apercuPartage`) : un seul contexte WebGL.
//
// - Création PARESSEUSE : rien n'est fabriqué au chargement du module, ni tant
//   qu'on n'a pas demandé un rendu.
// - Sans WebGL (vieux navigateur, tests Node) : `rendre` renvoie `null` et ne
//   lève jamais d'exception ; l'appelant garde son dessin de secours.
// - Aucun accès à `window` ; seul `document.createElement` est utilisé.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { creerModelePoisson, echellePourTaille } from './modelePoisson.js?v=255';

const LARGEUR_DEFAUT = 1200;   // résolution interne (assez pour la loupe de tailles.html)
const HAUTEUR_DEFAUT = 800;
const MARGE = 1.12;            // 6 % d'air de chaque côté, pour ne pas couper une nageoire
const SEUIL_ALPHA = 8;         // pixel « visible » au-dessus de ce seuil
const LARGEUR_PARTAGE = 720;   // rendu de l'instance partagée (fiche + combat)
const HAUTEUR_PARTAGE = 480;
const CACHE_PARTAGE = 64;      // images gardées par l'instance partagée (les plus récentes)

function entierPositif(valeur, defaut) {
    const n = Math.round(Number(valeur));
    return isFinite(n) && n >= 16 ? n : defaut;
}

/**
 * @param {{largeur?: number, hauteur?: number, cacheMax?: number}} [options]
 *   taille du rendu interne (px) ; cacheMax : nombre d'images gardées (0 = illimité)
 * @returns {{rendre: function(object, number): (string|null), disponible: function(): boolean, liberer: function(): void}}
 */
export function creerApercuPoisson(options) {
    const reglages = options || {};
    const largeurRendu = entierPositif(reglages.largeur, LARGEUR_DEFAUT);
    const hauteurRendu = entierPositif(reglages.hauteur, HAUTEUR_DEFAUT);
    const cacheMax = Math.max(0, Math.floor(Number(reglages.cacheMax)) || 0);

    const cache = new Map();   // 'id:cm' -> data URL
    let moteur = null;         // créé au premier rendu
    let indisponible = false;  // WebGL a échoué : on n'insiste plus

    // --- Moteur (renderer, scène, lumières, canvas de recadrage) -----------------
    function creerMoteur() {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
            throw new Error('pas de document');
        }
        const canvas = document.createElement('canvas');
        canvas.width = largeurRendu;
        canvas.height = hauteurRendu;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(1);
        renderer.setSize(largeurRendu, hauteurRendu, false);
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
        lecteur.width = largeurRendu;
        lecteur.height = hauteurRendu;
        const contexteLecture = lecteur.getContext('2d', { willReadFrequently: true });
        const sortie = document.createElement('canvas');
        const contexteSortie = sortie.getContext('2d');
        if (!contexteLecture || !contexteSortie) {
            throw new Error('canvas 2D indisponible');
        }
        return {
            canvas, renderer, scene, camera, lecteur, contexteLecture, sortie, contexteSortie
        };
    }

    // Cadre le poisson : vue de profil, très légère plongée pour voir le dos.
    function cadrer(m, poisson) {
        poisson.updateMatrixWorld(true);
        const boite = new THREE.Box3().setFromObject(poisson);
        const centre = boite.getCenter(new THREE.Vector3());
        const taille = boite.getSize(new THREE.Vector3());
        const aspect = largeurRendu / hauteurRendu;

        let largeur = Math.max(0.001, taille.x) * MARGE;
        let hauteur = Math.max(0.001, taille.y) * MARGE;
        if (largeur / hauteur < aspect) {
            largeur = hauteur * aspect;
        } else {
            hauteur = largeur / aspect;
        }
        const camera = m.camera;
        camera.left = -largeur / 2;
        camera.right = largeur / 2;
        camera.top = hauteur / 2;
        camera.bottom = -hauteur / 2;
        camera.position.set(centre.x, centre.y + hauteur * 0.06,
            centre.z + Math.max(10, largeur * 2));
        camera.lookAt(centre.x, centre.y, centre.z);
        camera.updateProjectionMatrix();
    }

    // Recadre sur les pixels visibles : la largeur de l'image devient la longueur
    // exacte du poisson (aucune marge transparente à l'affichage).
    function recadrer(m) {
        m.contexteLecture.clearRect(0, 0, largeurRendu, hauteurRendu);
        m.contexteLecture.drawImage(m.canvas, 0, 0);
        const pixels = m.contexteLecture.getImageData(0, 0, largeurRendu, hauteurRendu).data;

        let x0 = largeurRendu;
        let y0 = hauteurRendu;
        let x1 = -1;
        let y1 = -1;
        for (let y = 0; y < hauteurRendu; y++) {
            const ligne = y * largeurRendu * 4;
            for (let x = 0; x < largeurRendu; x++) {
                if (pixels[ligne + x * 4 + 3] > SEUIL_ALPHA) {
                    if (x < x0) { x0 = x; }
                    if (x > x1) { x1 = x; }
                    if (y < y0) { y0 = y; }
                    if (y > y1) { y1 = y; }
                }
            }
        }
        if (x1 < x0 || y1 < y0) {
            return m.canvas.toDataURL('image/png');
        }
        const largeur = x1 - x0 + 1;
        const hauteur = y1 - y0 + 1;
        m.sortie.width = largeur;
        m.sortie.height = hauteur;
        m.contexteSortie.clearRect(0, 0, largeur, hauteur);
        m.contexteSortie.drawImage(m.canvas, x0, y0, largeur, hauteur, 0, 0, largeur, hauteur);
        return m.sortie.toDataURL('image/png');
    }

    // Crée le moteur au premier besoin ; un échec est définitif (pas de nouvel essai).
    function obtenirMoteur() {
        if (moteur) { return moteur; }
        if (indisponible) { return null; }
        try {
            moteur = creerMoteur();
        } catch (erreur) {
            moteur = null;
            indisponible = true;
        }
        return moteur;
    }

    function disponible() {
        return obtenirMoteur() !== null;
    }

    function rendre(espece, longueurCm) {
        if (!espece || !isFinite(longueurCm)) { return null; }
        const cle = espece.id + ':' + longueurCm;
        if (cache.has(cle)) { return cache.get(cle); }
        const m = obtenirMoteur();
        if (!m) { return null; }

        let poisson = null;
        try {
            const size = echellePourTaille(longueurCm, espece.form);
            // Combativité et agressivité moyennes de l'espèce : seule la taille change.
            const power = (espece.combativite[0] + espece.combativite[1]) / 2;
            const aggression = (espece.agressivite[0] + espece.agressivite[1]) / 2;
            poisson = creerModelePoisson(size, power, aggression, espece.form, espece);

            m.scene.add(poisson);
            cadrer(m, poisson);
            m.renderer.clear();
            m.renderer.render(m.scene, m.camera);
            const source = recadrer(m);
            if (typeof source !== 'string' || source.indexOf('data:image') !== 0) {
                return null;
            }
            if (cacheMax > 0 && cache.size >= cacheMax) {
                // Map garde l'ordre d'insertion : on retire la plus ancienne.
                cache.delete(cache.keys().next().value);
            }
            cache.set(cle, source);
            return source;
        } catch (erreur) {
            return null;
        } finally {
            if (poisson) {
                m.scene.remove(poisson);
                // Chaque appel crée ses géométries et matériaux : on les libère. La
                // texture des motifs est partagée (cache de modelePoisson.js) : on ne
                // touche pas à material.map.
                poisson.traverse(function (objet) {
                    if (objet.geometry) { objet.geometry.dispose(); }
                    if (objet.material && objet.material.dispose) { objet.material.dispose(); }
                });
            }
        }
    }

    function liberer() {
        if (moteur) {
            try {
                moteur.renderer.dispose();
                if (typeof moteur.renderer.forceContextLoss === 'function') {
                    moteur.renderer.forceContextLoss();
                }
            } catch (erreur) { /* déjà libéré : rien à faire */ }
            moteur = null;
        }
        indisponible = false;   // un nouvel appel peut retenter la création
        cache.clear();
    }

    return { rendre: rendre, disponible: disponible, liberer: liberer };
}

// Instance PARTAGÉE (fiche « Espèces » + panneau de combat) : créée au premier
// appel, jamais avant. Les `options` ne comptent qu'à la toute première fois.
let partage = null;
export function apercuPartage(options) {
    if (!partage) {
        partage = creerApercuPoisson(Object.assign({
            largeur: LARGEUR_PARTAGE, hauteur: HAUTEUR_PARTAGE, cacheMax: CACHE_PARTAGE
        }, options));
    }
    return partage;
}

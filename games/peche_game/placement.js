// ---------------------------------------------------------------------------
// placement.js — CARTE DE PLACEMENT vue de dessus (écran d'accueil) et HAUTEUR DU TERRAIN. Extrait de script.js (v157).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=240';

export function creerPlacement(deps) {
    const {
        POND_CENTER, rayonEtang, profondeurLocale, RIVE_Y, directionAzimut, SUN_AZIMUT,
        PLACEMENT_MARGE_MIN, PLACEMENT_MARGE_MAX, cartePlacement, POSTE_MARGE,
        cartePlacementAide, azimutPosteTexte, POSTES, cartePlacementRepere, ensureSound,
        choisirEmplacement, majEtiquettePoste, obstacles, monde
    } = deps;

    // ---------------------------------------------------------------------------
    // CARTE DE PLACEMENT VUE DE DESSUS (écran d'accueil)
    // On voit l'étang de dessus ; la COURONNE claire autour de l'eau représente la
    // zone où l'on peut se placer (1,4 à 6 unités de la berge locale). Cliquer ou
    // glisser dans cette couronne choisit l'angle ET la distance à la berge.
    // ---------------------------------------------------------------------------
    etat.CARTE_3D_TAILLE = 320;        // résolution du canvas de la carte
    // v173 : étang de rayon nominal 90 (contour jusqu'à ≈ 104, couronne jusqu'à 110) :
    // le terrain représenté passe de 170 à 260 unités de large (demi-largeur 130 =
    // rayon max + couronne + 16 de berge), à ≈ 1,75 unité par segment comme avant.
    // Tailles d'étang : cette largeur (et la caméra) suit l'échelle f = rayon / 90, bornée [0,25 ; 3,2] (voir
    // `echelleCarte`) : 260 dans la plaine. La carte est reconstruite par `reconstruireCarte()`.
    etat.CARTE_3D_MONDE = 260;         // largeur du terrain représenté (unités)
    etat.CARTE_3D_SEGMENTS = 148;      // résolution du maillage de relief
    etat.CARTE_3D_EAU_Y = 0;           // HAUTEUR DE L'EAU : dessous = le lac
    etat.CARTE_3D_BANDE_SEGMENTS = 128;

    // ---------------------------------------------------------------------------
    // HAUTEUR DU TERRAIN : un « champ de hauteur » (comme une image grayscale
    // 2D dont on fixe le niveau de l'eau). Ici la hauteur est calculée à partir
    // de la vraie profondeur de l'étang :
    //   - sous le bord de l'eau : y = -profondeurLocale (négatif, c'est le lac) ;
    //   - sur la berge : y remonte au-dessus de 0, avec des collines douces.
    // Le plan d'eau est à y = CARTE_3D_EAU_Y (0).
    // ---------------------------------------------------------------------------
    // Échelle de la carte (largeur du terrain, caméra, repères) : f = rayon / 90 borné [0,25 ; 3,2] ; 1 dans la plaine.
    // Un plan d'eau allongé (canal, lac, rivière) la mesure sur son plus GRAND EXTENT (sa longueur, pas son rayon
    // nominal) et peut dépasser 3,2 : une rivière de 1 200 unités doit tenir dans le cadre.
    function echelleCarte() {
        return Math.max(0.25, Math.min(monde.forme === 'etang' ? 3.2 : 6, monde.echelleExtent));
    }

    function hauteurCarte(x, z) {
        const dx = x - POND_CENTER.x;
        const dz = z - POND_CENTER.z;
        const d = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const rayon = rayonEtang(angle);
        if (d <= rayon) {
            return -profondeurLocale(x, z);   // fond du lac, sous le plan d'eau
        }
        // Berge qui remonte, puis collines (dénivelé visible autour de l'étang).
        const t = d - rayon;
        let y = RIVE_Y + Math.min(7, t * 0.14 / echelleCarte());   // le relief de la berge suit l'échelle de la carte
        y += 0.35 * Math.sin(x * 0.07 + 0.8) * Math.cos(z * 0.06 - 0.4)
            + 0.18 * Math.sin((x + z) * 0.11 + 2.1);
        return Math.max(RIVE_Y + 0.05, y);
    }

    const CARTE_EAU_BAS = new THREE.Color(0x5a9aa8);
    const CARTE_EAU_PROFOND = new THREE.Color(0x0d2c3a);
    const CARTE_TERRE_BAS = new THREE.Color(0x3c3c3c);
    const CARTE_TERRE_HAUT = new THREE.Color(0xdedede);
    const _couleurCarte = new THREE.Color();

    // Couleur du relief : eau bleu-vert (foncée avec la profondeur), terre en
    // dégradé de gris (comme une heightmap) plus claire en altitude.
    function couleurCarte(y) {
        if (y < etat.CARTE_3D_EAU_Y) {
            const t = Math.min(1, -y / 8.4);   // jusqu'au fond des fosses (≈ 8,1)
            return _couleurCarte.copy(CARTE_EAU_BAS).lerp(CARTE_EAU_PROFOND, t);
        }
        const t = Math.min(1, (y - RIVE_Y) / 7);
        return _couleurCarte.copy(CARTE_TERRE_BAS).lerp(CARTE_TERRE_HAUT, t);
    }

    const carteScene = new THREE.Scene();
    carteScene.background = new THREE.Color(0x16242b);
    // La caméra recule dans les mêmes proportions que l'étang grandit (× 1,7) : tout
    // le contour et la couronne de placement restent dans le cadre de 320 px.
    etat.carteCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 1000);
    function placerCameraCarte() {
        const k = echelleCarte();
        etat.carteCamera.far = 1000 * k;
        etat.carteCamera.position.set(POND_CENTER.x + 128 * k, 170 * k, POND_CENTER.z + 204 * k);
        etat.carteCamera.lookAt(POND_CENTER.x, -1, POND_CENTER.z);
        etat.carteCamera.updateMatrixWorld();
        etat.carteCamera.updateProjectionMatrix();
    }

    carteScene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const lumiereCarte = new THREE.DirectionalLight(0xffffff, 1.0);
    const azimutSoleilCarte = directionAzimut(SUN_AZIMUT);
    lumiereCarte.position.set(azimutSoleilCarte.x * 70, 90, azimutSoleilCarte.z * 70);
    carteScene.add(lumiereCarte);

    // --- Le décor de la carte : terrain, plan d'eau, rivage, repères d'obstacles et couronne de placement. ---
    // Construit pour l'étang ACTUEL ; `reconstruireCarte()` le refait quand le biotope change la taille de l'étang.
    let carteTerrain = null;
    const carteObjets = [];
    function construireCarte() {
        const k = echelleCarte();
        etat.CARTE_3D_MONDE = 260 * k;
        placerCameraCarte();
        // Les anciens objets partent (géométries et matériaux libérés).
        carteObjets.forEach(function (objet) {
            carteScene.remove(objet);
            if (objet.geometry && objet.geometry.dispose) { objet.geometry.dispose(); }
            if (objet.material && objet.material.dispose) { objet.material.dispose(); }
        });
        carteObjets.length = 0;
        // --- Terrain : un maillage dont chaque sommet prend sa hauteur dans le champ. ---
        etat.carteGeometrie = new THREE.PlaneGeometry(
            etat.CARTE_3D_MONDE, etat.CARTE_3D_MONDE, etat.CARTE_3D_SEGMENTS, etat.CARTE_3D_SEGMENTS);
        etat.carteGeometrie.rotateX(-Math.PI / 2);
        const cartePositions = etat.carteGeometrie.attributes.position;
        const carteCouleurs = [];
        etat.carteMinY = Infinity;
        etat.carteMaxY = -Infinity;
        etat.carteSousLEau = 0;
        for (let i = 0; i < cartePositions.count; i++) {
            const x = cartePositions.getX(i) + POND_CENTER.x;
            const z = cartePositions.getZ(i) + POND_CENTER.z;
            const y = hauteurCarte(x, z);
            cartePositions.setY(i, y);
            const couleur = couleurCarte(y);
            carteCouleurs.push(couleur.r, couleur.g, couleur.b);
            etat.carteMinY = Math.min(etat.carteMinY, y);
            etat.carteMaxY = Math.max(etat.carteMaxY, y);
            if (y < etat.CARTE_3D_EAU_Y) {
                etat.carteSousLEau += 1;
            }
        }
        etat.carteGeometrie.setAttribute('color', new THREE.Float32BufferAttribute(carteCouleurs, 3));
        etat.carteGeometrie.computeVertexNormals();
        carteTerrain = new THREE.Mesh(
            etat.carteGeometrie,
            new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })
        );
        carteTerrain.name = 'terrain-etang';
        carteTerrain.position.set(POND_CENTER.x, 0, POND_CENTER.z);
        carteScene.add(carteTerrain);
        carteObjets.push(carteTerrain);

        // --- Plan d'eau à hauteur fixe : tout ce qui est dessous est le lac. ---
        const carteEau = new THREE.Mesh(
            new THREE.PlaneGeometry(etat.CARTE_3D_MONDE, etat.CARTE_3D_MONDE),
            new THREE.MeshStandardMaterial({
                color: 0x2b7ea1,
                transparent: true,
                opacity: 0.55,
                roughness: 0.25,
                metalness: 0.15,
                depthWrite: false,
                side: THREE.DoubleSide
            })
        );
        carteEau.name = 'eau-etang';
        carteEau.rotation.x = -Math.PI / 2;
        carteEau.position.set(POND_CENTER.x, etat.CARTE_3D_EAU_Y, POND_CENTER.z);
        carteScene.add(carteEau);
        carteObjets.push(carteEau);

        // Ligne de rivage (contour généré) juste au-dessus du plan d'eau.
        const cartePointsRive = [];
        for (let i = 0; i < 160; i++) {
            const a = (i / 160) * Math.PI * 2;
            const r = rayonEtang(a);
            cartePointsRive.push(new THREE.Vector3(
                POND_CENTER.x + Math.cos(a) * r,
                etat.CARTE_3D_EAU_Y + 0.06,
                POND_CENTER.z + Math.sin(a) * r
            ));
        }
        const carteLigneRive = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(cartePointsRive),
            new THREE.LineBasicMaterial({ color: 0xdff3fb })
        );
        carteLigneRive.name = 'rivage-etang';
        carteScene.add(carteLigneRive);
        carteObjets.push(carteLigneRive);

        // --- Obstacles : un repère coloré par ouvrage (le ponton, brun et allongé, est un poste cliquable). ---
        const COULEURS_REPERES = { ponton: 0xd9a35c, ecluse: 0xd8d4c6, douve: 0x58c4e0, roches: 0xeeeeee,
            souche: 0x8a5a2b, pieux: 0xb08a4a, epave: 0xc88a3a, joncs: 0x7fd13f };
        obstacles.liste.forEach(function (o) {
            const long = o.type === 'ponton';
            const repere = new THREE.Mesh(new THREE.BoxGeometry(long ? 14 : 4, 0.6, 4),
                new THREE.MeshBasicMaterial({ color: COULEURS_REPERES[o.type] }));
            const milieu = long ? o.cercles.reduce(function (m, c) { return { x: m.x + c.x / o.cercles.length, z: m.z + c.z / o.cercles.length }; }, { x: 0, z: 0 }) : o;
            repere.position.set(milieu.x, etat.CARTE_3D_EAU_Y + 0.4, milieu.z);
            repere.rotation.y = -o.axe;
            repere.name = 'repere-' + o.id;
            repere.scale.setScalar(Math.max(0.4, Math.min(3.5, echelleCarte())));
            carteScene.add(repere);
            carteObjets.push(repere);
        });

        // --- Couronne de placement : un ruban posé sur le relief (1,4 → 6 unités). ---
        const carteBandePositions = [];
        const carteBandeIndices = [];
        for (let i = 0; i <= etat.CARTE_3D_BANDE_SEGMENTS; i++) {
            const a = (i / etat.CARTE_3D_BANDE_SEGMENTS) * Math.PI * 2;
            const ri = rayonEtang(a) + PLACEMENT_MARGE_MIN;
            const ro = rayonEtang(a) + PLACEMENT_MARGE_MAX;
            const xi = POND_CENTER.x + Math.cos(a) * ri;
            const zi = POND_CENTER.z + Math.sin(a) * ri;
            const xo = POND_CENTER.x + Math.cos(a) * ro;
            const zo = POND_CENTER.z + Math.sin(a) * ro;
            carteBandePositions.push(
                xi, hauteurCarte(xi, zi) + 0.07, zi,
                xo, hauteurCarte(xo, zo) + 0.07, zo
            );
        }
        for (let i = 0; i < etat.CARTE_3D_BANDE_SEGMENTS; i++) {
            const a = i * 2;
            carteBandeIndices.push(a, a + 1, a + 3, a, a + 3, a + 2);
        }
        const carteBandeGeometrie = new THREE.BufferGeometry();
        carteBandeGeometrie.setAttribute('position',
            new THREE.Float32BufferAttribute(carteBandePositions, 3));
        carteBandeGeometrie.setIndex(carteBandeIndices);
        carteBandeGeometrie.computeVertexNormals();
        const carteBande = new THREE.Mesh(
            carteBandeGeometrie,
            new THREE.MeshBasicMaterial({
                color: 0xffe780,
                transparent: true,
                opacity: 0.32,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        carteBande.name = 'zone-placement';
        carteScene.add(carteBande);
        carteObjets.push(carteBande);
        // Le repère du pêcheur reste à la même taille APPARENTE : il suit l'échelle de la carte.
        if (etat.carteMarqueur) { etat.carteMarqueur.scale.setScalar(Math.max(0.4, Math.min(3.5, k))); }
    }

    // --- Repère 3D du pêcheur (mât + tête dorée) ---
    etat.carteMarqueur = new THREE.Group();
    etat.carteMarqueur.name = 'emplacement-marker';
    const carteMarqueurTige = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 5.8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 })
    );
    carteMarqueurTige.position.y = 2.9;
    etat.carteMarqueur.add(carteMarqueurTige);
    const carteMarqueurTete = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff0a8, roughness: 0.5 })
    );
    carteMarqueurTete.position.y = 6.3;
    etat.carteMarqueur.add(carteMarqueurTete);
    const carteMarqueurAnneau = new THREE.Mesh(
        new THREE.TorusGeometry(1.35, 0.16, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5 })
    );
    carteMarqueurAnneau.rotation.x = Math.PI / 2;
    carteMarqueurAnneau.position.y = 0.18;
    etat.carteMarqueur.add(carteMarqueurAnneau);
    carteScene.add(etat.carteMarqueur);
    construireCarte();

    // --- Renderer dédié à la petite carte (contexte WebGL séparé, 320×320) ---
    let carteRenderer = null;
    try {
        carteRenderer = new THREE.WebGLRenderer({
            canvas: cartePlacement,
            antialias: true,
            alpha: false
        });
        carteRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        carteRenderer.setSize(etat.CARTE_3D_TAILLE, etat.CARTE_3D_TAILLE, false);
        if (THREE.SRGBColorSpace) {
            carteRenderer.outputColorSpace = THREE.SRGBColorSpace;
        }
    } catch (erreur) {
        carteRenderer = null;
    }

    const carteRaycaster = new THREE.Raycaster();
    const cartePlanEau = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    function majMarqueurCarte() {
        const distance = rayonEtang(etat.emplacementAngle) + etat.emplacementMarge;
        const x = POND_CENTER.x + Math.cos(etat.emplacementAngle) * distance;
        const z = POND_CENTER.z + Math.sin(etat.emplacementAngle) * distance;
        const y = hauteurCarte(x, z);
        etat.carteMarqueur.position.set(x, y, z);
        etat.carteMarqueur.visible = true;
    }

    // Projette un emplacement du monde vers les coordonnées client du canvas.
    // Sert aux tests (et pourrait servir à un survol) : on vise exactement le
    // point du relief, donc le raycast retrouve le bon angle et la bonne marge.
    function projeterPlacement(angle, marge) {
        const distance = rayonEtang(angle)
            + (typeof marge === 'number' ? marge : POSTE_MARGE);
        const x = POND_CENTER.x + Math.cos(angle) * distance;
        const z = POND_CENTER.z + Math.sin(angle) * distance;
        const y = hauteurCarte(x, z);
        etat.carteCamera.updateMatrixWorld();
        const point = new THREE.Vector3(x, y, z).project(etat.carteCamera);
        const rect = cartePlacement
            ? cartePlacement.getBoundingClientRect()
            : { left: 0, top: 0, width: etat.CARTE_3D_TAILLE, height: etat.CARTE_3D_TAILLE };
        const clientX = rect.left + (point.x * 0.5 + 0.5) * rect.width;
        const clientY = rect.top + (-point.y * 0.5 + 0.5) * rect.height;
        return {
            clientX: clientX,
            clientY: clientY,
            x: clientX,
            y: clientY,
            xMonde: x,
            yMonde: y,
            zMonde: z
        };
    }

    // Chemin SVG d'un contour de l'étang.
    //   facteur : 1 = bord de l'eau, < 1 = isobathe ;
    //   decalage : marge radiale en unités du monde (couronne de placement).
    function cheminContourEtang(cx, cy, echelle, facteur, decalage) {
        const n = 96;
        const f = (typeof facteur === 'number') ? facteur : 1;
        const dec = (typeof decalage === 'number') ? decalage : 0;
        let d = '';
        for (let i = 0; i <= n; i++) {
            const a = (i / n) * Math.PI * 2;
            const rr = (rayonEtang(a) * f + dec) * echelle;
            const x = cx + Math.cos(a) * rr;
            const y = cy + Math.sin(a) * rr;
            d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        return d + 'Z';
    }

    function renderCartePlacement() {
        majMarqueurCarte();
        if (cartePlacementAide) {
            cartePlacementAide.textContent = '📍 '
                + (etat.emplacementMarge < 0 ? 'ponton'
                    : etat.emplacementLibre
                    ? azimutPosteTexte(etat.emplacementAngle)
                    : POSTES[etat.posteActuel].nom.toLowerCase())
                + ' · ' + etat.emplacementMarge.toFixed(1).replace('.', ',')
                + ' unité(s) de la berge — clique ou glisse sur le relief.';
        }
        if (cartePlacementRepere && cartePlacement) {
            const projection = projeterPlacement(etat.emplacementAngle, etat.emplacementMarge);
            const rect = cartePlacement.getBoundingClientRect();
            cartePlacementRepere.style.left = (projection.clientX - rect.left) + 'px';
            cartePlacementRepere.style.top = (projection.clientY - rect.top) + 'px';
        }
        if (carteRenderer) {
            etat.carteCamera.updateMatrixWorld();
            carteRenderer.render(carteScene, etat.carteCamera);
        }
    }

    // Convertit un clic sur le RELIEF en (angle, marge) dans le monde.
    // On raycast le terrain : le point touché est un vrai point du relief, ce qui
    // rend le choix cohérent avec le dénivelé affiché. Si le rayon ne touche pas
    // le maillage (bord), on retombe sur le plan d'eau y = 0.
    function emplacementDepuisCarte(event) {
        if (!cartePlacement) {
            return null;
        }
        const rect = cartePlacement.getBoundingClientRect();
        if (!rect || !rect.width || !rect.height) {
            return null;
        }
        const ndc = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        etat.carteCamera.updateMatrixWorld();
        carteScene.updateMatrixWorld(true);
        carteRaycaster.setFromCamera(ndc, etat.carteCamera);
        const hits = carteRaycaster.intersectObject(carteTerrain);
        let point = hits.length ? hits[0].point : null;
        if (!point) {
            point = new THREE.Vector3();
            if (!carteRaycaster.ray.intersectPlane(cartePlanEau, point)) {
                return null;
            }
        }
        const dx = point.x - POND_CENTER.x;
        const dz = point.z - POND_CENTER.z;
        const angle = Math.atan2(dz, dx);
        const distance = Math.hypot(dx, dz);
        const marge = distance - rayonEtang(angle);
        return {
            angle: angle,
            marge: Math.max(PLACEMENT_MARGE_MIN,
                Math.min(PLACEMENT_MARGE_MAX, marge))
        };
    }

    let cartePlacementPressee = false;
    if (cartePlacement) {
        cartePlacement.addEventListener('pointerdown', function (event) {
            cartePlacementPressee = true;
            ensureSound();
            const point = emplacementDepuisCarte(event);
            if (point) {
                choisirEmplacement(point.angle, point.marge);
            }
            if (cartePlacement.setPointerCapture && event && event.pointerId !== undefined) {
                cartePlacement.setPointerCapture(event.pointerId);
            }
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
        });
        cartePlacement.addEventListener('pointermove', function (event) {
            if (!cartePlacementPressee) {
                return;
            }
            const point = emplacementDepuisCarte(event);
            if (point) {
                choisirEmplacement(point.angle, point.marge);
            }
        });
        const relacherCarte = function () { cartePlacementPressee = false; };
        cartePlacement.addEventListener('pointerup', relacherCarte);
        cartePlacement.addEventListener('pointercancel', relacherCarte);
        cartePlacement.addEventListener('pointerleave', relacherCarte);
    }

    majEtiquettePoste();


    // Poisson tenu en main, prêt à être lancé.
    etat.heldFish = null;
    etat.fishThrowState = 'idle';   // 'idle' | 'charging' | 'flying'
    etat.fishThrowPower = 0;
    etat.fishThrowTarget = 0;
    etat.fishThrowPhase = 0;
    etat.fishThrowT = 0;
    etat.fishThrowLanding = new THREE.Vector3();
    etat.fishThrowOrigin = new THREE.Vector3();

    return {
        hauteurCarte, projeterPlacement, cheminContourEtang, renderCartePlacement,
        // Taille d'étang changée : le relief, le plan d'eau, le rivage, les repères et la couronne sont refaits.
        reconstruireCarte: function () { construireCarte(); }
    };
}

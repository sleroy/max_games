// ---------------------------------------------------------------------------
// bateau.js — MODE BATEAU : la barque (modèle, textures), son déplacement à la
// rame, le pad tactile et le passage ponton ↔ barque. Extrait de script.js (v147).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=218';

export function creerBateau(deps) {
    const {
        scene, POSTE_MARGE, rayonEtang, angler, boatLeft, boatRow, boatRight, boatPad,
        boatButton, ensureSound, statusDisplay, sound, waterWaveHeightAt, POSTES, POND_CENTER,
        ANGLE_BASE, cameraTarget, camera, compassDisplay, azimutTexte, SUN_AZIMUT,
        RAYON_ETANG_MAX, PLACEMENT_MARGE_MIN, PLACEMENT_MARGE_MAX, POSTE_ANGLER, POSTE_ROD_BASE,
        rodBase, POSTE_ROD_TIP, rodTip, POSTE_BOURRICHE, BOURRICHE_POS, POSTE_GIROUETTE,
        vaneGroup, POSTE_CAM_POS, NORMAL_CAM_POS, POSTE_CAM_TARGET, NORMAL_CAM_TARGET, rodPivot,
        rodGroup, rodTipVisual, floatIdle, floatGroup, bourriche, resetCameraView, feedAim,
        majCoupeProfondeur, renderCartePlacement, obstacles
    } = deps;

    // ---------------------------------------------------------------------------
    // MODE BATEAU (acheté en boutique avec l'XP)
    // Embarquer DÉPLACE le poste au milieu de l'eau : même matériel, même caméra,
    // même lancer — seul l'endroit change. Les flèches (ou ZQSD) font ramer.
    // La marge (distance au bord LOCAL) devient NÉGATIVE : on est dans l'eau.
    // ---------------------------------------------------------------------------
       // pas de rotation (flèches gauche / droite)
         // pas d'avancée / recul (flèches haut / bas)
    const BATEAU_MARGE_BORD = 4;      // au plus près : 4 unités DANS l'eau du bord
    const BATEAU_MIN_CENTRE = 10;     // jamais à moins de 10 unités du centre (la
                                      // visée a besoin d'une direction vers le milieu)

    etat.bateauGroupe.visible = false;
    scene.add(etat.bateauGroupe);

    // --- Textures 100 % code (aucune image à télécharger, aucune licence) ---
    // Une tuile de 128 px = 1 unité du monde (~50 cm) : deux planches, la
    // peinture écaillée laisse voir le bois nu. Dessinée au fillRect uniquement
    // (le faux canvas 2D des tests ne connaît que ça) et avec un générateur
    // pseudo-aléatoire LOCAL à graine fixe : la texture est identique à chaque
    // lancement et ne consomme RIEN du rand() du jeu (monde reproductible).
    function creerTextureBarque(peintures, boisNu) {
        let graine = 20260501;
        const hasard = function () {
            graine = (graine * 1103515245 + 12345) % 2147483648;
            return graine / 2147483648;
        };
        const toile = document.createElement('canvas');
        toile.width = 128;
        toile.height = 128;
        const pinceau = toile.getContext('2d');
        // Deux planches par tuile, teinte alternée.
        pinceau.fillStyle = peintures[0];
        pinceau.fillRect(0, 0, 64, 128);
        pinceau.fillStyle = peintures[1];
        pinceau.fillRect(64, 0, 64, 128);
        // Veines du bois : de longues stries le long des planches.
        for (let i = 0; i < 30; i++) {
            const x = hasard() * 128;
            const largeur = 1 + hasard() * 2;
            pinceau.fillStyle = hasard() > 0.5
                ? 'rgba(255,255,255,0.08)' : 'rgba(20,15,8,0.10)';
            pinceau.fillRect(x, 0, largeur, 128);
        }
        // Peinture écaillée : des éclats de bois nu (coque seulement).
        if (boisNu) {
            for (let i = 0; i < 14; i++) {
                pinceau.fillStyle = boisNu;
                pinceau.fillRect(hasard() * 118, hasard() * 120,
                    3 + hasard() * 8, 2 + hasard() * 5);
            }
        }
        // Joints entre les planches (le bord droit de chaque planche).
        pinceau.fillStyle = 'rgba(30, 22, 12, 0.8)';
        pinceau.fillRect(62, 0, 3, 128);
        pinceau.fillRect(126, 0, 2, 128);
        const texture = new THREE.CanvasTexture(toile);
        texture.colorSpace = THREE.SRGBColorSpace;
        // Les UV de l'extrusion sont en unités du plan de la forme : la tuile
        // se répète toutes les unités, comme de vraies planches.
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    const coqueMateriau = new THREE.MeshStandardMaterial({
        map: creerTextureBarque(['#3f74a8', '#356896'], '#8a6a42'),
        roughness: 0.65
    });
    const boisMateriau = new THREE.MeshStandardMaterial({
        map: creerTextureBarque(['#9c7a4a', '#8a6a3c'], null),
        roughness: 0.85
    });
    // Coque : profil vu de dessus (la proue = +z local, comme le regard du
    // pêcheur), extrudée vers le bas. Le dessus de l'extrusion est le plancher.
    const coqueForme = new THREE.Shape();
    coqueForme.moveTo(-1.0, -2.2);
    coqueForme.lineTo(1.0, -2.2);
    coqueForme.lineTo(1.0, 0.6);
    coqueForme.quadraticCurveTo(0.95, 1.8, 0, 2.9);
    coqueForme.quadraticCurveTo(-0.95, 1.8, -1.0, 0.6);
    coqueForme.closePath();
    const coqueGeometrie = new THREE.ExtrudeGeometry(coqueForme, { depth: 0.8, bevelEnabled: false });
    coqueGeometrie.rotateX(Math.PI / 2);   // l'extrusion (+z) part vers le bas
    const coque = new THREE.Mesh(coqueGeometrie, coqueMateriau);
    coque.castShadow = true;
    etat.bateauGroupe.add(coque);
    const banc = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.09, 0.5), boisMateriau);
    banc.position.set(0, 0.34, 0.35);
    etat.bateauGroupe.add(banc);
    // Deux avirons posés en travers : ils suffisent à « lire » la barque de loin.
    const avironMateriau = new THREE.MeshStandardMaterial({
        map: creerTextureBarque(['#b08b52', '#a07a44'], null),
        roughness: 0.8
    });
    for (const cote of [-1, 1]) {
        const avironGeometrie = new THREE.CylinderGeometry(0.05, 0.07, 2.6, 8);
        avironGeometrie.rotateZ(Math.PI / 2);
        const aviron = new THREE.Mesh(avironGeometrie, avironMateriau);
        aviron.rotation.y = cote * 0.35;
        aviron.position.set(cote * 0.95, 0.42, 0.1);
        etat.bateauGroupe.add(aviron);
    }

    // État du mode bateau ; `riveDerniere` garde l'emplacement de berge pour
    // revenir exactement au même endroit en débarquant.
    const riveDerniere = { angle: null, marge: POSTE_MARGE, preset: 0, libre: false };

    // Embarquer : à peu près à mi-étang, dans l'axe du poste actuel.
    function margeBateauMilieu(angle) {
        const distance = Math.max(BATEAU_MIN_CENTRE, rayonEtang(angle) * 0.5);
        return distance - rayonEtang(angle);
    }

    function embarquerBateau() {
        if (etat.modeBateau || !etat.journal.bateau || etat.floatState !== 'idle') { return false; }
        riveDerniere.angle = etat.emplacementAngle;
        riveDerniere.marge = etat.emplacementMarge;
        riveDerniere.preset = etat.posteActuel;
        riveDerniere.libre = etat.emplacementLibre;
        etat.modeBateau = true;
        return placerALAngle(etat.emplacementAngle, margeBateauMilieu(etat.emplacementAngle), -1, true);
    }

    function quitterBateau() {
        // Refusé tant que la ligne n'est pas au repos : on reste à bord sinon.
        if (!etat.modeBateau || etat.floatState !== 'idle') { return false; }
        etat.modeBateau = false;
        return placerALAngle(riveDerniere.angle ?? etat.emplacementAngle, riveDerniere.marge,
            riveDerniere.preset, riveDerniere.libre);
    }

    // Un placement « de berge » (raccourci de poste ou carte d'accueil) débarque
    // la barque. On ne le fait que si le placement peut réussir (ligne au repos),
    // sinon l'état resterait cohérent : toujours à bord, ligne dehors.
    function atterirBateau() {
        if (etat.modeBateau && etat.floatState === 'idle') { etat.modeBateau = false; }
    }

    // Fait tourner / avancer / reculer la barque. Refusé tant que la ligne n'est
    // pas au repos : le bouchon ne peut pas être remorqué.
    function deplacerBateau(deltaAngle, deltaMarge) {
        if (!etat.modeBateau || etat.floatState !== 'idle') { return false; }
        // Les bornes se calculent au rayon de l'ANGLE D'ARRIVÉE (et non de départ) : le
        // contour varie de 71 à 104 unités, et un coup de rame qui tourne beaucoup
        // pouvait sinon amener la barque à moins de 10 unités du centre, voire au-delà.
        const avant = { angle: etat.emplacementAngle, marge: etat.emplacementMarge,
            x: etat.bateauGroupe.position.x, z: etat.bateauGroupe.position.z };
        // `part` = fraction du coup de rame réellement donné (1 = plein, 0,4 = freiné).
        const viser = function (part) {
            const angle = avant.angle + deltaAngle * part;
            const rayon = rayonEtang(angle);
            const marge = Math.max(BATEAU_MIN_CENTRE - rayon,
                Math.min(-BATEAU_MARGE_BORD, avant.marge + deltaMarge * part));
            return placerALAngle(angle, marge, -1, true);
        };
        const ok = viser(1);
        if (!ok) { return false; }
        // OBSTACLES : la coque s'arrête contre un ouvrage, et ralentit dans les joncs. On teste
        // plusieurs points du trajet (un grand coup de rame ne traverse pas un obstacle).
        const departLibre = !obstacles.heurtBarque(avant.x, avant.z)
            || obstacles.heurtBarque(avant.x, avant.z).effet !== 'arret';
        const heurt = heurtSurTrajet(avant.x, avant.z, etat.bateauGroupe.position.x, etat.bateauGroupe.position.z);
        if (heurt && heurt.effet === 'arret' && departLibre) {
            viser(0);   // la barque reste où elle était
            etat.spawnRipple({ x: heurt.obstacle.x, y: 0, z: heurt.obstacle.z });
            statusDisplay.textContent = '💥 La barque heurte ' + heurt.obstacle.nom + ' : impossible de passer !';
            return false;
        }
        if (heurt && heurt.effet === 'ralenti') {
            viser(0.4);   // freinée : 40 % du coup de rame
            statusDisplay.textContent = '🌿 Les joncs freinent la barque…';
        }
        etat.spawnRipple({ x: angler.position.x, y: 0, z: angler.position.z });
        return true;
    }

    // Premier obstacle touché par la coque entre deux points ('arret' l'emporte sur 'ralenti').
    function heurtSurTrajet(x0, z0, x1, z1) {
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.5));
        let ralenti = null;
        for (let i = 1; i <= n; i++) {
            const h = obstacles.heurtBarque(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n);
            if (h && h.effet === 'arret') { return h; }
            if (h) { ralenti = h; }
        }
        return ralenti;
    }

    // --- Commandes TACTILES de la barque ---------------------------------------
    // Tap = un pas. Maintenir = ramer en continu (même vocabulaire que « maintien
    // puis relâche » du lancer et de l'amorce : un seul doigt, aucune précision).
    const BATEAU_RAME_CADENCE = 0.28;   // s entre deux pas quand on maintient
    let bateauRameTimer = 0;

    function pasDeRame() {
        if (!etat.modeBateau || etat.floatState !== 'idle') {
            return false;
        }
        let fait = false;
        if (etat.bateauRame.avant) {
            fait = deplacerBateau(0, -etat.BATEAU_PAS_MARGE) || fait;
        }
        if (etat.bateauRame.gauche) {
            fait = deplacerBateau(etat.BATEAU_PAS_ANGLE, 0) || fait;
        }
        if (etat.bateauRame.droite) {
            fait = deplacerBateau(-etat.BATEAU_PAS_ANGLE, 0) || fait;
        }
        return fait;
    }

    function lierBoutonRame(bouton, cle) {
        if (!bouton) {
            return;
        }
        const presser = function (event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            if (!etat.modeBateau) { return; }
            etat.bateauRame[cle] = true;
            bateauRameTimer = BATEAU_RAME_CADENCE;
            pasDeRame();          // réponse immédiate au premier tap
        };
        const relacher = function () {
            etat.bateauRame[cle] = false;
        };
        bouton.addEventListener('pointerdown', presser);
        bouton.addEventListener('pointerup', relacher);
        bouton.addEventListener('pointercancel', relacher);
        bouton.addEventListener('pointerleave', relacher);
    }

    lierBoutonRame(boatLeft, 'gauche');
    lierBoutonRame(boatRow, 'avant');
    lierBoutonRame(boatRight, 'droite');

    // Avance la rame tenue : appelée par la boucle d'animation.
    function updateRameBateau(dt) {
        if (!etat.modeBateau) {
            etat.bateauRame.gauche = false;
            etat.bateauRame.droite = false;
            etat.bateauRame.avant = false;
            bateauRameTimer = 0;
            return;
        }
        const actif = etat.bateauRame.gauche || etat.bateauRame.droite || etat.bateauRame.avant;
        if (!actif) {
            bateauRameTimer = 0;
            return;
        }
        bateauRameTimer -= dt;
        if (bateauRameTimer > 0) {
            return;
        }
        bateauRameTimer = BATEAU_RAME_CADENCE;
        pasDeRame();
    }

    // Le pad n'apparaît qu'à bord ET ligne au repos : on ne rame pas en pêchant,
    // et le HUD reste propre sur téléphone.
    function majPadBateau() {
        if (!boatPad) {
            return;
        }
        boatPad.hidden = !(etat.modeBateau && etat.floatState === 'idle' && !etat.paused);
    }

    if (boatButton) {
        boatButton.addEventListener('click', function () {
            if (!etat.journal.bateau || etat.paused) { return; }
            ensureSound();
            let ok;
            if (etat.modeBateau) {
                ok = quitterBateau();
                if (ok) {
                    statusDisplay.textContent = '🐟 De retour sur la rive.';
                    sound.playPiece();
                }
            } else {
                ok = embarquerBateau();
                if (ok) {
                    statusDisplay.textContent = '🚤 À bord ! Flèches (ou ZQSD) pour ramer, clic sur l’eau pour pêcher.';
                    sound.playPiece();
                } else if (etat.floatState !== 'idle') {
                    statusDisplay.textContent = 'Range ta ligne (bouchon au repos) avant de monter à bord.';
                }
            }
            if (ok) {
                boatButton.textContent = etat.modeBateau ? '🐟 Rive' : '🚤 Bateau';
                boatButton.setAttribute('aria-pressed', String(etat.modeBateau));
                // Le focus reste sur le bouton après le clic : les flèches seraient
                // alors ignorées par le garde-fou clavier. On le rend au jeu.
                boatButton.blur();
            }
        });
    }

    // La barque flotte : elle suit la houle et prend une légère inclinaison
    // avant-arrière (la proue et la poupe ne portent pas la même hauteur d'eau).
    function updateBateau(time) {
        if (!etat.bateauGroupe.visible) { return; }
        const x = etat.bateauGroupe.position.x;
        const z = etat.bateauGroupe.position.z;
        etat.bateauGroupe.position.y = 0.3 + waterWaveHeightAt(x, z, time) * 0.5;
        const avant = Math.sin(etat.bateauGroupe.rotation.y);
        const cote = Math.cos(etat.bateauGroupe.rotation.y);
        const houleProue = waterWaveHeightAt(x + avant * 2.2, z + cote * 2.2, time);
        const houlePoupe = waterWaveHeightAt(x - avant * 2.2, z - cote * 2.2, time);
        etat.bateauGroupe.rotation.x = THREE.MathUtils.clamp(
            (houlePoupe - houleProue) * 0.12, -0.09, 0.09);
    }

    // Exposition lumineuse du poste demandé (par défaut : le plus proche).
    function expositionPoste(index) {
        const poste = POSTES[(typeof index === 'number') ? index : etat.posteActuel];
        return poste ? poste.exposition : 1;
    }

    // Fait tourner `base` autour du centre de l'étang et écrit le résultat dans
    // `cible` (on réutilise les Vector3 existants : aucun objet recréé).
    function tournerAutourEtang(base, delta, cible) {
        const dx = base.x - POND_CENTER.x;
        const dz = base.z - POND_CENTER.z;
        const cos = Math.cos(delta);
        const sin = Math.sin(delta);
        cible.copy(base);
        cible.x = POND_CENTER.x + dx * cos + dz * sin;
        cible.z = POND_CENTER.z - dx * sin + dz * cos;
        return cible;
    }

    // Écart angulaire le plus court entre deux angles (radians).
    function ecartAngulaire(a, b) {
        const deuxPi = Math.PI * 2;
        let d = Math.abs(a - b) % deuxPi;
        return Math.min(d, deuxPi - d);
    }

    // Preset (sud / est / nord / ouest) le plus proche d'un angle libre.
    function plusProchePresetIndex(angle) {
        let meilleur = 0;
        let meilleurEcart = Infinity;
        POSTES.forEach(function (poste, index) {
            const cible = ANGLE_BASE - poste.delta;
            const ecart = ecartAngulaire(angle, cible);
            if (ecart < meilleurEcart) {
                meilleurEcart = ecart;
                meilleur = index;
            }
        });
        return meilleur;
    }

    // Nom de la direction (8 secteurs) pour un angle de position autour de l'étang.
    // Convention boussole : 0° = nord, 90° = est, 180° = sud, 270° = ouest.
    function azimutPosteTexte(angle) {
        const degres = (((angle * 180) / Math.PI) + 90 + 360) % 360;
        const secteurs = ['nord', 'nord-est', 'est', 'sud-est',
            'sud', 'sud-ouest', 'ouest', 'nord-ouest'];
        return secteurs[Math.round(degres / 45) % 8];
    }

    function nomEmplacementCourant() {
        if (etat.modeBateau) { return 'bateau'; }
        if (etat.emplacementMarge < 0) { return 'ponton'; }
        return etat.emplacementLibre
            ? azimutPosteTexte(etat.emplacementAngle)
            : POSTES[etat.posteActuel].nom.toLowerCase();
    }

    // Où est le NORD à l'écran ? Comme le poste fait le tour de l'étang, la caméra
    // tourne aussi : « Nord en haut » n'est vrai qu'au poste sud. On affiche une
    // flèche calculée à partir de la direction réelle de la caméra.
    function flecheNordEcran() {
        const fx = cameraTarget.x - camera.position.x;
        const fz = cameraTarget.z - camera.position.z;
        const norme = Math.hypot(fx, fz) || 1;
        const avant = { x: fx / norme, z: fz / norme };
        // « Droite » à l'écran, dans le plan du sol (x = est, z = sud).
        const droite = { x: -avant.z, z: avant.x };
        const nord = { x: 0, z: -1 };
        const versAvant = nord.x * avant.x + nord.z * avant.z;
        const versDroite = nord.x * droite.x + nord.z * droite.z;
        if (Math.abs(versAvant) >= Math.abs(versDroite)) {
            return versAvant >= 0 ? '↑' : '↓';
        }
        return versDroite >= 0 ? '→' : '←';
    }

    function majEtiquettePoste() {
        if (!compassDisplay) {
            return;
        }
        compassDisplay.textContent = '🧭 Nord ' + flecheNordEcran()
            + ' · ☀️ soleil au ' + azimutTexte(SUN_AZIMUT)
            + ' · 📍 poste ' + nomEmplacementCourant();
    }

    // Place tout le matériel du pêcheur à un ANGLE et une MARGE (distance au bord
    // local) donnés. Refusé si une ligne est en l'air ou à l'eau.
    //   presetIndex : index du raccourci (0-3) ou -1 pour un choix libre.
    function placerALAngle(angle, marge, presetIndex, libre) {
        if (etat.floatState !== 'idle' || !Number.isFinite(angle)) {
            return false;
        }
        // Sur la rive : marge positive bornée. En bateau : marge NÉGATIVE (dans
        // l'eau), bornée par le filet de sécurité ; le vrai bornage est fait dans
        // deplacerBateau (le rayon dépend de l'angle).
        // PONTON : un angle choisi sur son axe pose le pêcheur sur le plancher.
        const pp = obstacles.pontonPoste;
        const surPonton = !etat.modeBateau && !!pp && ecartAngulaire(angle, pp.axe) < pp.demi;
        if (surPonton) { angle = pp.axe; marge = pp.marge; }
        const margeBrute = Number.isFinite(marge) ? marge : POSTE_MARGE;
        const margeVoulue = surPonton ? pp.marge : etat.modeBateau
            ? Math.max(BATEAU_MIN_CENTRE - RAYON_ETANG_MAX,
                Math.min(-BATEAU_MARGE_BORD, margeBrute))
            : Math.max(PLACEMENT_MARGE_MIN,
                Math.min(PLACEMENT_MARGE_MAX, margeBrute));
        etat.emplacementAngle = angle;
        etat.emplacementMarge = margeVoulue;
        etat.emplacementLibre = !!libre;
        etat.posteActuel = (typeof presetIndex === 'number' && presetIndex >= 0)
            ? presetIndex : plusProchePresetIndex(angle);
        etat.boutonPosteActif = etat.emplacementLibre ? -1 : etat.posteActuel;

        // Rotation qui amène le poste sud historique sur l'angle demandé.
        const delta = ANGLE_BASE - angle;

        // 1) Rotation RIGIDE du matériel autour du centre : le poste fait le tour.
        tournerAutourEtang(POSTE_ANGLER, delta, angler.position);
        etat.anglerYawBase = Math.PI + delta;
        etat.rodYawBase = delta;
        angler.rotation.y = etat.anglerYawBase;
        tournerAutourEtang(POSTE_ROD_BASE, delta, rodBase);
        tournerAutourEtang(POSTE_ROD_TIP, delta, rodTip);
        tournerAutourEtang(POSTE_BOURRICHE, delta, BOURRICHE_POS);
        tournerAutourEtang(POSTE_GIROUETTE, delta, vaneGroup.position);
        tournerAutourEtang(POSTE_CAM_POS, delta, NORMAL_CAM_POS);
        tournerAutourEtang(POSTE_CAM_TARGET, delta, NORMAL_CAM_TARGET);

        // 2) L'ÉTANG N'EST PAS UN CERCLE : on recale TOUT le matériel dans l'axe
        //    radial pour que le pêcheur soit à `marge` du bord LOCAL. Le décalage
        //    est le même pour la canne, la bourriche, la girouette et la caméra :
        //    le matériel reste rigide et le cadrage identique.
        const dxAngler = angler.position.x - POND_CENTER.x;
        const dzAngler = angler.position.z - POND_CENTER.z;
        const distanceAngler = Math.hypot(dxAngler, dzAngler) || 1;
        const anglePoste = Math.atan2(dzAngler, dxAngler);
        const distanceVoulue = rayonEtang(anglePoste) + etat.emplacementMarge;
        const decalage = distanceVoulue - distanceAngler;
        const decalX = (dxAngler / distanceAngler) * decalage;
        const decalZ = (dzAngler / distanceAngler) * decalage;
        [angler.position, rodBase, rodTip, BOURRICHE_POS, vaneGroup.position,
            NORMAL_CAM_POS, NORMAL_CAM_TARGET].forEach(function (repere) {
            repere.x += decalX;
            repere.z += decalZ;
        });

        // 3) BATEAU : la coque se glisse sous le pêcheur, tournée comme lui (proue
        //    vers l'étang). La girouette, matériel de berge, reste rangée à quai.
        // Sur le ponton : pêcheur, canne et caméra montent au niveau du plancher.
        if (surPonton) {
            const dy = pp.hauteur - POSTE_ANGLER.y;
            [angler.position, rodBase, rodTip, NORMAL_CAM_POS, NORMAL_CAM_TARGET].forEach(function (repere) {
                repere.y += dy;
            });
        }
        etat.bateauGroupe.visible = etat.modeBateau;
        vaneGroup.visible = !etat.modeBateau && !surPonton;
        if (etat.modeBateau) {
            // La barque recule de 0,7 : le pêcheur est près de la poupe et la
            // proue (et la canne) dépassent devant lui, comme dans une vraie barque.
            etat.bateauGroupe.position.set(
                angler.position.x - Math.sin(etat.anglerYawBase) * 0.7, 0.3,
                angler.position.z - Math.cos(etat.anglerYawBase) * 0.7);
            etat.bateauGroupe.rotation.y = etat.anglerYawBase;
        }

        // Canne : pivot à la nouvelle base, orienté vers l'étang.
        rodPivot.position.copy(rodBase);
        rodPivot.rotation.y = etat.rodYawBase;
        etat.rodBend = 0;
        etat.castSwing = 0;
        etat.castYawAngler = 0;
        etat.castYawRod = 0;
        rodGroup.rotation.x = 0;
        rodTipVisual.copy(rodTip);

        // Bouchon au repos, au bout de la canne.
        floatIdle.set(rodTip.x, rodTip.y - 0.6, rodTip.z);
        floatGroup.position.copy(floatIdle);

        // Bourriche et caméra suivent le décalage radial.
        bourriche.position.copy(BOURRICHE_POS);
        resetCameraView();
        camera.position.copy(NORMAL_CAM_POS);
        cameraTarget.copy(NORMAL_CAM_TARGET);
        camera.lookAt(cameraTarget);

        // Repères du combat : l'ancre est au bout de la canne.
        etat.struggleAnchor.set(rodTip.x, 0, rodTip.z);
        etat.strugglePos.set(rodTip.x, 0.1, rodTip.z);

        // Visées par défaut : vers le centre de l'étang, à bonne distance.
        const dx = POND_CENTER.x - angler.position.x;
        const dz = POND_CENTER.z - angler.position.z;
        const d = Math.hypot(dx, dz) || 1;
        etat.castAim.set(angler.position.x + (dx / d) * 30, 0.1, angler.position.z + (dz / d) * 30);
        feedAim.set(angler.position.x + (dx / d) * 22, 0.1, angler.position.z + (dz / d) * 22);
        etat.castTarget.set(etat.castAim.x, 0.1, etat.castAim.z);

        majCoupeProfondeur();
        majEtiquettePoste();
        renderCartePlacement();
        return true;
    }

    // Raccourci : les 4 boutons de l'accueil (sud / est / nord / ouest).
    function placerAuPoste(index) {
        const poste = POSTES[index];
        if (!poste) {
            return false;
        }
        atterirBateau();
        return placerALAngle(ANGLE_BASE - poste.delta, POSTE_MARGE, index, false);
    }

    // Choix libre depuis la carte vue de dessus : un angle + une distance à la
    // berge. Si le clic est très proche d'un raccourci, on le rattache à ce poste.
    function choisirEmplacement(angle, marge) {
        atterirBateau();
        const preset = plusProchePresetIndex(angle);
        const cible = ANGLE_BASE - POSTES[preset].delta;
        const libre = ecartAngulaire(angle, cible) > (2 * Math.PI / 180);
        return placerALAngle(angle, marge, libre ? -1 : preset, libre);
    }

    return {
        embarquerBateau, quitterBateau, deplacerBateau, updateRameBateau, majPadBateau,
        updateBateau, expositionPoste, azimutPosteTexte, majEtiquettePoste, placerAuPoste,
        choisirEmplacement
    };
}

// ---------------------------------------------------------------------------
// boucle.js — BOUCLE D'ANIMATION : une image du jeu (mises à jour, rendu, reflet planaire). Extrait de script.js (v169).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=218';

export function creerBoucle(deps) {
    const {
        rand, BOURRICHE_POS, scene, ensureSound, sound, ragondinAlert, spawnFloatingText,
        statusDisplay, scoreDisplay, bourricheLabel, canvas, camera
    } = deps;

    // ---------------------------------------------------------------------------
    // Boucle d'animation
    // ---------------------------------------------------------------------------
    etat.clock = new THREE.Clock();
    etat.elapsed = 0;
    etat.paused = false;

    // LE RAGONDIN VOLEUR — aléa rare : il sort de l'eau près de la bourriche pour
    // voler un poisson. 3 clics SUR LUI le font fuir ; ses clics passent AVANT le
    // ferrage, donc impossible de ferrer en le chassant.
    const RAGONDIN_CLICS = 3;
    etat.ragondin = null;
    // Première visite plus tôt (18–30 s) : le joueur doit pouvoir la voir.
    // Seulement s'il y a un poisson à voler (score > 0).
    etat.ragondinTimer = 18 + rand() * 12;
    etat.ragondinHits = 0;
    etat.ragondinVolTimer = 0;   // secondes restantes avant le vol
    etat.ragondinAuto = true;    // désactivable par les tests

    function makeRagondin() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.9 });
        const corps = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat);
        corps.scale.set(1.9, 0.95, 0.9);
        corps.position.y = 0.2;
        group.add(corps);
        const tete = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat);
        tete.position.set(0.44, 0.24, 0);
        group.add(tete);
        [-1, 1].forEach(function (cote) {
            const oreille = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat);
            oreille.position.set(0.37, 0.35, cote * 0.09);
            group.add(oreille);
        });
        const queue = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.5, 6), mat);
        queue.rotation.z = Math.PI / 2.4;
        queue.position.set(-0.55, 0.24, 0);
        group.add(queue);
        return group;
    }

    function spawnRagondin() {
        if (etat.ragondin || etat.partieTerminee) { return null; }
        const modele = makeRagondin();
        // Tout près de la bourriche (et face au pêcheur) : il est visible.
        modele.position.set(BOURRICHE_POS.x + 2.2, 0, BOURRICHE_POS.z + 1.2);
        modele.scale.setScalar(1.8);   // ~50 cm à l'échelle du monde : bien visible
        modele.rotation.y = Math.PI;
        scene.add(modele);
        etat.ragondinHits = 0;
        etat.ragondinVolTimer = 12;     // 12 s pour le chasser
        etat.ragondin = modele;
        ensureSound();
        sound.ragondinArrive();
        if (ragondinAlert) { ragondinAlert.classList.add('active'); }
        spawnFloatingText('🐀 RAGONDIN !',
            new THREE.Vector3(BOURRICHE_POS.x + 5, BOURRICHE_POS.y, BOURRICHE_POS.z),
            '#ffb347');
        statusDisplay.textContent = '🐀 Un RAGONDIN rôde près de ta bourriche ! Clique 3 fois sur lui pour le chasser (sinon il vole un poisson).';
        return modele;
    }

    function volerUnPoissonRagondin() {
        if (!etat.ragondin) { return false; }
        let pris = false;
        if (etat.bourricheCount > 0) {
            etat.bourricheCount -= 1;
            pris = true;
        }
        if (etat.score > 0) {
            etat.score -= 1;
            scoreDisplay.textContent = etat.score;
            pris = true;
        }
        if (bourricheLabel) {
            bourricheLabel.textContent = '🧺 Bourriche : ' + etat.bourricheCount;
        }
        spawnFloatingText('🐀 Il a volé un poisson !', BOURRICHE_POS, '#ff6b57');
        statusDisplay.textContent = pris
            ? '🐀 Trop tard : le ragondin a volé un poisson de la bourriche et s’est échappé !'
            : '🐀 Le ragondin est reparti sans rien voler…';
        sound.ragondinRonge(8);
        sound.escape();
        effrayerRagondin();
        return true;
    }

    function effrayerRagondin() {
        if (!etat.ragondin) { return; }
        scene.remove(etat.ragondin);
        etat.ragondin = null;
        sound.ragondinMusiqueStop();
        etat.ragondinHits = 0;
        if (ragondinAlert) { ragondinAlert.classList.remove('active'); }
        etat.ragondinTimer = 45 + rand() * 30;
    }

    function hitRagondin() {
        if (!etat.ragondin) { return false; }
        etat.ragondinHits += 1;
        sound.splash();
        sound.ragondinCri(true);
        etat.ragondin.position.x += 1.2;
        if (etat.ragondinHits >= RAGONDIN_CLICS) {
            spawnFloatingText('🐀 Il s’enfuit !', etat.ragondin.position, '#ffd166');
            effrayerRagondin();
            statusDisplay.textContent = '🐀 Le ragondin a fui ! Tes poissons sont saufs.';
            return true;
        }
        spawnFloatingText('🐀 Il détale !', etat.ragondin.position, '#ffd166');
        statusDisplay.textContent = '🐀 Touché ! Encore ' + (RAGONDIN_CLICS - etat.ragondinHits) + ' clic(s) pour le chasser.';
        return false;
    }

    // Zone de clic GÉNÉREUSE autour du ragondin (en pixels CSS). Le modèle 3D est
    // petit et l'animal bouge : exiger un clic pile sur lui rendait la chasse
    // pénible (surtout au doigt). On accepte donc un clic « à côté ».
    const RAGONDIN_CLIC_RADIUS = 70;

    /** Position du ragondin À L'ÉCRAN (pixels CSS), ou null s'il est derrière nous. */
    function ragondinALEcran() {
        if (!etat.ragondin) { return null; }
        const rect = canvas.getBoundingClientRect();
        const centre = etat.ragondin.position.clone();
        centre.y += 0.35;                       // le corps, pas les pattes
        const projete = centre.project(camera);
        if (projete.z > 1) {                    // derrière la caméra
            return null;
        }
        return {
            x: rect.left + (projete.x * 0.5 + 0.5) * rect.width,
            y: rect.top + (-projete.y * 0.5 + 0.5) * rect.height
        };
    }

    function clicSurRagondin(event) {
        if (!etat.ragondin) { return false; }
        const rect = canvas.getBoundingClientRect();
        // 1) Test à l'écran : la distance au ragondin PROJETÉ. Il ne dépend ni de la
        //    taille du modèle ni de l'inclinaison de la caméra.
        const ecran = ragondinALEcran();
        if (ecran) {
            const dx = event.clientX - ecran.x;
            const dy = event.clientY - ecran.y;
            if (dx * dx + dy * dy <= RAGONDIN_CLIC_RADIUS * RAGONDIN_CLIC_RADIUS) {
                return true;
            }
        }
        // 2) Test 3D exact : si le clic tombe vraiment sur le modèle, on le prend
        //    aussi (utile quand il sort du cadre de la zone d'écran).
        etat.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        etat.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        etat.raycaster.setFromCamera(etat.pointerNdc, camera);
        return etat.raycaster.intersectObject(etat.ragondin, true).length > 0;
    }

    function updateRagondin(dt) {
        if (!etat.ragondin) {
            if (!etat.ragondinAuto) { return; }
            etat.ragondinTimer -= dt;
            if (etat.ragondinTimer <= 0) {
                // Il ne sort que s'il y a réellement un poisson à voler, et
                // SEULEMENT quand le joueur ne fait rien (au repos) ou quand le
                // bouchon est déjà à l'eau. Rien pendant un lancer, un ferrage, une
                // épreuve de force ou un accrochage : sa visite ne doit pas tomber
                // au milieu d'une action.
                const momentCalme = etat.floatState === 'idle' || etat.floatState === 'inWater';
                if (etat.score > 0 && momentCalme) {
                    if (spawnRagondin()) { etat.ragondinTimer = 45 + rand() * 30; }
                } else {
                    etat.ragondinTimer = 8 + rand() * 5;   // on revérifie bientôt
                }
            }
            return;
        }
        const dx = BOURRICHE_POS.x - etat.ragondin.position.x;
        const dz = BOURRICHE_POS.z - etat.ragondin.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.7) {
            etat.ragondin.position.x += (dx / d) * 1.1 * dt;
            etat.ragondin.position.z += (dz / d) * 1.1 * dt;
            etat.ragondin.rotation.y = Math.atan2(-dz, dx);
        }
        etat.ragondin.position.y = Math.abs(Math.sin(etat.elapsed * 6)) * 0.04;
        etat.ragondinVolTimer -= dt;
        if (etat.ragondinVolTimer <= 0) {
            volerUnPoissonRagondin();
            return;
        }
    }

    return {
        spawnRagondin, volerUnPoissonRagondin, effrayerRagondin, hitRagondin, ragondinALEcran,
        clicSurRagondin, updateRagondin
    };
}

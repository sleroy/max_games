// ---------------------------------------------------------------------------
// camera.js — CAMÉRA : création, FOV garanti sur écran étroit, vue réglable
// (boutons ⟲ ⟳ + − et geste à deux doigts), suivi en douceur et redimensionnement.
// Extrait de script.js (v244).
//
// L'état partagé passe par etat.js (`etat.cameraViewActive`, `etat.renderer`) ;
// le reste est injecté par `deps`.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=257';

export function creerCamera(deps) {
    const {
        cameraControls, toolToggle, cameraButton, cameraLeft, cameraRight, cameraCloser,
        cameraFarther, cameraReset, cameraDone, fermerOutils, resizePost
    } = deps;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 900);
    // Sur un écran étroit, le FOV horizontal devient trop petit : la bourriche et
    // la girouette (à ±12 unités) sortent du cadre. On garantit un FOV horizontal
    // minimum en élargissant le FOV vertical (borné pour éviter la déformation).
    const H_FOV_MIN = 76 * Math.PI / 180;

    function fovPourAspect(aspect) {
        const a = Math.max(0.2, aspect || 1);
        const vertical = 2 * Math.atan(Math.tan(H_FOV_MIN / 2) / a) * 180 / Math.PI;
        return Math.min(85, Math.max(50, vertical));
    }

    const NORMAL_CAM_POS = new THREE.Vector3(0, 8, 34);
    const NORMAL_CAM_TARGET = new THREE.Vector3(0, 0, -15);
    const cameraTarget = NORMAL_CAM_TARGET.clone();
    camera.position.copy(NORMAL_CAM_POS);
    camera.lookAt(cameraTarget);

    const cameraAxis = new THREE.Vector3(0, 1, 0);
    const adjustedCameraPosition = new THREE.Vector3();
    const cameraTouches = new Map();
    let cameraAngle = 0;
    let cameraDistance = 1;
    let previousCameraGesture = null;

    function adjustCamera(angle, distanceFactor) {
        cameraAngle = THREE.MathUtils.clamp(cameraAngle + angle, -Math.PI / 4, Math.PI / 4);
        cameraDistance = THREE.MathUtils.clamp(cameraDistance * distanceFactor, 0.72, 1.25);
    }

    function resetCameraView() {
        cameraAngle = 0;
        cameraDistance = 1;
    }

    function setCameraView(active) {
        etat.cameraViewActive = active;
        cameraControls.hidden = !active;
        toolToggle.hidden = active;
        cameraTouches.clear();
        previousCameraGesture = null;
        if (active) {
            fermerOutils();
            cameraDone.focus?.();
        }
    }

    cameraButton.addEventListener('click', () => setCameraView(true));
    cameraLeft.addEventListener('click', () => adjustCamera(-Math.PI / 12, 1));
    cameraRight.addEventListener('click', () => adjustCamera(Math.PI / 12, 1));
    cameraCloser.addEventListener('click', () => adjustCamera(0, 0.88));
    cameraFarther.addEventListener('click', () => adjustCamera(0, 1.14));
    cameraReset.addEventListener('click', resetCameraView);
    cameraDone.addEventListener('click', () => {
        setCameraView(false);
        toolToggle.focus?.();
    });

    function updateCameraGesture() {
        if (cameraTouches.size !== 2) {
            previousCameraGesture = null;
            return;
        }
        const [a, b] = cameraTouches.values();
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 8) {
            previousCameraGesture = null;
            return;
        }
        const angle = Math.atan2(dy, dx);
        if (previousCameraGesture) {
            const delta = angle - previousCameraGesture.angle;
            adjustCamera(Math.atan2(Math.sin(delta), Math.cos(delta)), previousCameraGesture.distance / distance);
        }
        previousCameraGesture = { angle, distance };
    }

    function updateCameraPosition(dt) {
        adjustedCameraPosition.copy(NORMAL_CAM_POS).sub(NORMAL_CAM_TARGET)
            .multiplyScalar(cameraDistance).applyAxisAngle(cameraAxis, cameraAngle).add(NORMAL_CAM_TARGET);
        camera.position.lerp(adjustedCameraPosition, 1 - Math.pow(0.0001, dt));
    }

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        etat.renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = fovPourAspect(camera.aspect);
        camera.updateProjectionMatrix();
        resizePost(w, h);
    }
    window.addEventListener('resize', resize);
    // Le navigateur mobile met parfois un instant à recalculer la taille : on insiste.
    window.addEventListener('orientationchange', () => setTimeout(resize, 250));
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resize);
    }
    // iOS : le viewport ne suffit pas toujours à empêcher le zoom par pincement.
    document.addEventListener('gesturestart', event => event.preventDefault());
    resize();

    return {
        camera, fovPourAspect, NORMAL_CAM_POS, NORMAL_CAM_TARGET, cameraTarget, cameraTouches,
        adjustCamera, resetCameraView, setCameraView, updateCameraGesture, updateCameraPosition, resize
    };
}

// ---------------------------------------------------------------------------
// Stub de three.js pour les tests hors navigateur.
//
// Le jeu dessine avec WebGL, impossible dans Node : ce module ré-exporte le
// VRAI three.js (donc toute la géométrie, les vecteurs, le raycaster… sont
// authentiques) mais remplace uniquement WebGLRenderer par une version inerte
// qui se contente de mettre à jour les matrices (comme le vrai renderer).
//
// Le harnais (tests/harness.mjs) copie ce fichier dans un dossier temporaire en
// remplaçant le marqueur par le chemin réel de assets/three.module.js.
// ---------------------------------------------------------------------------
export * from 'THREE_URL_PLACEHOLDER';

export class WebGLRenderer {
    constructor() {
        this.domElement = {
            style: {},
            addEventListener() {},
            getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
        };
        this.shadowMap = {};
        this.renderCount = 0;
    }

    setPixelRatio() {}

    setSize() {}

    setAnimationLoop() {}

    // Le vrai renderer recalcule les matrices avant de dessiner : on fait pareil
    // pour que le raycaster (clic sur l'eau) travaille sur des matrices à jour.
    render(scene, camera) {
        this.renderCount++;
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
    }
}

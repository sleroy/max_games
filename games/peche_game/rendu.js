// ---------------------------------------------------------------------------
// rendu.js — RENDU : renderer WebGL, tone mapping et post-traitement maison (bloom + vignette). Extrait de script.js (v172).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=220';

export function creerRendu(deps) {
    const {
        canvas
    } = deps;

    // ---------------------------------------------------------------------------
    // Rendu / scène / caméra
    // ---------------------------------------------------------------------------
    // Sur téléphone : on limite la résolution et la taille des ombres (performance).
    // Même critère que la CSS : pointeur « grossier » ou écran étroit.
    etat.isMobileDevice = typeof window.matchMedia === 'function'
        && (window.matchMedia('(pointer: coarse)').matches
            || window.matchMedia('(max-width: 820px)').matches);

    etat.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    etat.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, etat.isMobileDevice ? 1.5 : 2));
    // Rendu plus « photo » : tone mapping ACES (comme une caméra). Les shaders
    // maison (ciel, eau) incluent les chunks de tone mapping pour rester cohérents.
    etat.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    etat.renderer.toneMappingExposure = 1.02;
    etat.renderer.outputColorSpace = THREE.SRGBColorSpace;
    etat.renderer.shadowMap.enabled = true;
    etat.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ---------------------------------------------------------------------------
    // Post-traitement maison (aucune dépendance) : léger « bloom » + vignette.
    // On rend la scène dans une cible, on isole les hautes lumières, on les floute
    // puis on recompose à l'écran. Désactivé par défaut sur mobile (performance).
    // ---------------------------------------------------------------------------
    etat.post = { enabled: !etat.isMobileDevice, strength: 0.22, vignette: 0.18 };
    etat.postSupported = !!(etat.renderer.capabilities && etat.renderer.setRenderTarget
        && etat.renderer.getRenderTarget && etat.renderer.setSize);

    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    postQuad.frustumCulled = false;
    postScene.add(postQuad);

    etat.sceneTarget = null;
    let brightTarget = null;
    let blurTargetA = null;
    let blurTargetB = null;

    // Options des cibles de rendu.
    // ⚠️ La cible de la SCÈNE doit GARDER un tampon de profondeur : sans lui, le tri
    // des objets est perdu et l'eau (transparente), dessinée en dernier, passe
    // PAR-DESSUS le pêcheur et la bourriche pourtant DEVANT elle. C'est exactement
    // ce qui leur donnait cet aspect « sous un voile blanc ».
    etat.SCENE_TARGET_OPTIONS = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false
    };
    // Les cibles du bloom sont de simples quads plein écran : pas besoin de profondeur.
    etat.BLOOM_TARGET_OPTIONS = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false
    };

    function makePostTarget(w, h, options) {
        return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h),
            options || etat.BLOOM_TARGET_OPTIONS);
    }

    function resizePost(width, height) {
        if (!etat.postSupported) {
            return;
        }
        const ratio = (etat.renderer.getPixelRatio && etat.renderer.getPixelRatio()) || 1;
        const fullW = Math.floor(width * ratio);
        const fullH = Math.floor(height * ratio);
        const halfW = Math.floor(fullW / 2);
        const halfH = Math.floor(fullH / 2);
        if (etat.sceneTarget) etat.sceneTarget.dispose();
        if (brightTarget) brightTarget.dispose();
        if (blurTargetA) blurTargetA.dispose();
        if (blurTargetB) blurTargetB.dispose();
        etat.sceneTarget = makePostTarget(fullW, fullH, etat.SCENE_TARGET_OPTIONS);
        brightTarget = makePostTarget(halfW, halfH);
        blurTargetA = makePostTarget(halfW, halfH);
        blurTargetB = makePostTarget(halfW, halfH);
    }

    const POST_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

    const brightMaterial = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.92 } },
        vertexShader: POST_VERTEX,
        fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uThreshold;
        varying vec2 vUv;
        void main() {
            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            float k = max(0.0, l - uThreshold) / max(0.0001, 1.0 - uThreshold);
            gl_FragColor = vec4(c * k, 1.0);
        }`
    });
    brightMaterial.toneMapped = false;

    const blurMaterial = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } },
        vertexShader: POST_VERTEX,
        fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uDir;
        varying vec2 vUv;
        void main() {
            vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.24;
            sum += texture2D(tDiffuse, vUv - uDir).rgb * 0.20;
            sum += texture2D(tDiffuse, vUv + uDir).rgb * 0.20;
            sum += texture2D(tDiffuse, vUv - uDir * 2.0).rgb * 0.12;
            sum += texture2D(tDiffuse, vUv + uDir * 2.0).rgb * 0.12;
            sum += texture2D(tDiffuse, vUv - uDir * 3.0).rgb * 0.06;
            sum += texture2D(tDiffuse, vUv + uDir * 3.0).rgb * 0.06;
            gl_FragColor = vec4(sum, 1.0);
        }`
    });
    blurMaterial.toneMapped = false;

    const compositeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null },
            tBloom: { value: null },
            uBloom: { value: etat.post.strength },
            uVignette: { value: etat.post.vignette }
        },
        vertexShader: POST_VERTEX,
        fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tBloom;
        uniform float uBloom;
        uniform float uVignette;
        varying vec2 vUv;
        void main() {
            vec3 col = texture2D(tDiffuse, vUv).rgb;
            col += texture2D(tBloom, vUv).rgb * uBloom;
            // Vignette douce pour attirer l'œil au centre.
            float v = smoothstep(0.9, 0.35, length(vUv - 0.5));
            col *= mix(1.0 - uVignette, 1.0, v);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
        }`
    });
    // Le tone mapping est déjà appliqué dans la cible : on ne le refait pas.
    compositeMaterial.toneMapped = false;

    function renderWithPost() {
        etat.renderer.setRenderTarget(etat.sceneTarget);
        etat.renderer.render(etat.scene, etat.camera);

        postQuad.material = brightMaterial;
        brightMaterial.uniforms.tDiffuse.value = etat.sceneTarget.texture;
        etat.renderer.setRenderTarget(brightTarget);
        etat.renderer.render(postScene, postCamera);

        postQuad.material = blurMaterial;
        blurMaterial.uniforms.tDiffuse.value = brightTarget.texture;
        blurMaterial.uniforms.uDir.value.set(1 / blurTargetA.width, 0);
        etat.renderer.setRenderTarget(blurTargetA);
        etat.renderer.render(postScene, postCamera);

        blurMaterial.uniforms.tDiffuse.value = blurTargetA.texture;
        blurMaterial.uniforms.uDir.value.set(0, 1 / blurTargetB.height);
        etat.renderer.setRenderTarget(blurTargetB);
        etat.renderer.render(postScene, postCamera);

        postQuad.material = compositeMaterial;
        compositeMaterial.uniforms.tDiffuse.value = etat.sceneTarget.texture;
        compositeMaterial.uniforms.tBloom.value = blurTargetB.texture;
        etat.renderer.setRenderTarget(null);
        etat.renderer.render(postScene, postCamera);
    }

    return {
        makePostTarget, resizePost, renderWithPost
    };
}

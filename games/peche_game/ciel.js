// ---------------------------------------------------------------------------
// ciel.js — CIEL ET SOLEIL : dégradé du ciel, soleil à azimut fixe (sud-ouest),
// lumières (ambiante, ciel/sol, soleil avec ombres qui suivent le pêcheur),
// disque et halo du soleil, cycle jour / nuit. Extrait de script.js (v244).
//
// L'état partagé passe par etat.js (`etat.dayPhase`, `etat.angler`,
// `etat.isMobileDevice`, `etat.horlogeGelee`) ; le reste est injecté par `deps`.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=257';

export function creerCiel(deps) {
    // `eau()` rend les uniforms de l'eau (créés plus tard dans script.js) ;
    // `expositionPoste()` vient du module bateau (créé plus tard aussi).
    const { scene, camera, POND_CENTER, eau, expositionPoste } = deps;

    // Ciel dégradé
    const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
            topColor: { value: new THREE.Color(0x4a9fd8) },
            bottomColor: { value: new THREE.Color(0xe6f6fd) },
            offset: { value: 52 },   // 30 × (520 / 300) : même dégradé avec la sphère agrandie
            exponent: { value: 0.7 }
        },
        vertexShader: 'varying vec3 vWorldPosition; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
    });
    // Sphère du ciel : 520 (au lieu de 300) pour englober la brume (480) et la caméra, qui
    // peut maintenant s'éloigner de ≈ 190 unités de l'origine (poste à la rive nord).
    const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 16), skyMat);
    scene.add(sky);

    // ---------------------------------------------------------------------------
    // SOLEIL : orientation FIXE du monde (idee 2 de idees.md).
    // L'azimut se lit comme sur une boussole : 0° = nord, 90° = est, 180° = sud,
    // 270° = ouest. Le nord correspond à l'axe -z (le haut de l'écran au poste sud).
    // 225° = sud-ouest, exactement ce qu'annonce la boussole du HUD.
    // ---------------------------------------------------------------------------
    const SUN_AZIMUT = 225;
    const NOMS_AZIMUT = {
        0: 'nord', 45: 'nord-est', 90: 'est', 135: 'sud-est',
        180: 'sud', 225: 'sud-ouest', 270: 'ouest', 315: 'nord-ouest'
    };

    function azimutTexte(valeur) {
        const normalise = ((valeur % 360) + 360) % 360;
        return NOMS_AZIMUT[normalise] || (normalise + '°');
    }

    // Direction HORIZONTALE (x, z) vers le soleil pour un azimut donné.
    function directionAzimut(azimut) {
        const a = (azimut * Math.PI) / 180;
        return { x: Math.sin(a), z: -Math.cos(a) };
    }

    // Direction 3D de référence (élévation de « midi ») : sert d'état initial au
    // reflet solaire de l'eau, avant la première image.
    function directionSoleil3D(cible) {
        const a = (SUN_AZIMUT * Math.PI) / 180;
        const elevation = (42 * Math.PI) / 180;
        return cible.set(
            Math.sin(a) * Math.cos(elevation),
            Math.sin(elevation),
            -Math.cos(a) * Math.cos(elevation)
        );
    }

    const SUN_DIRECTION = directionAzimut(SUN_AZIMUT);

    // ---------------------------------------------------------------------------
    // Lumières
    // ---------------------------------------------------------------------------
    // Lumière ambiante douce + lumière « ciel/sol » : les volumes sont plus naturels.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const skyLight = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a3f, 0.5);
    scene.add(skyLight);

    const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.15);
    // Position du soleil RELATIVE au centre des ombres (voir suivreOmbres) : c'est ce
    // décalage, et lui seul, qui donne la direction de la lumière.
    const sunDecalage = new THREE.Vector3(SUN_DIRECTION.x * 70, 73, SUN_DIRECTION.z * 70);
    sunLight.position.copy(sunDecalage);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(etat.isMobileDevice ? 512 : 1024, etat.isMobileDevice ? 512 : 1024);
    // La carte d'ombre couvre 180 × 180 unités. Depuis v173 l'étang fait ≈ 210 unités de
    // large : une carte fixe ne couvrirait plus tous les postes. Elle SUIT donc le pêcheur
    // (suivreOmbres) et couvre toujours la rive, le matériel et la moitié proche de l'eau.
    sunLight.shadow.camera.left = -90;
    sunLight.shadow.camera.right = 90;
    sunLight.shadow.camera.top = 90;
    sunLight.shadow.camera.bottom = -90;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 260;
    // Ombres plus propres (moins d'« acné » sur le sable et l'eau).
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.03;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Centre des ombres : 35 unités devant le pêcheur, vers le milieu de l'étang. La
    // lumière garde la même direction (même décalage) : seul son point de visée bouge.
    const ombreCentre = new THREE.Vector3();
    function suivreOmbres() {
        const angler = etat.angler;
        if (!angler) { return; }
        ombreCentre.set(POND_CENTER.x - angler.position.x, 0, POND_CENTER.z - angler.position.z);
        const d = ombreCentre.length() || 1;
        ombreCentre.multiplyScalar(Math.min(35, d) / d).add(angler.position);
        ombreCentre.y = 0;
        sunLight.target.position.copy(ombreCentre);
        sunLight.position.copy(ombreCentre).add(sunDecalage);
    }

    // Disque du soleil : posé dans le ciel RELATIVEMENT à la caméra (120 unités dans la
    // direction de la lumière). Fixé au monde, il se retrouvait derrière la caméra ou dans
    // un arbre dès que le poste changeait de rive (l'étang fait maintenant 210 unités).
    const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(10, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false })
    );
    sunMesh.position.copy(sunDecalage).multiplyScalar(1.2);
    scene.add(sunMesh);

    // Halo du soleil
    function makeGlowTexture() {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 250, 200, 1)');
        grad.addColorStop(0.3, 'rgba(255, 240, 150, 0.6)');
        grad.addColorStop(1, 'rgba(255, 240, 150, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    }
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, depthWrite: false }));
    sunGlow.scale.set(140, 140, 1);
    sunGlow.position.copy(sunMesh.position);
    scene.add(sunGlow);

    // ---------------------------------------------------------------------------
    // Cycle jour / nuit : le soleil décrit un arc, le ciel et la lumière suivent.
    // ---------------------------------------------------------------------------
    const DAY_LENGTH = 420;   // durée d'un cycle complet (secondes)
    const SKY_TOP_DAY = new THREE.Color(0x4a9fd8);
    const SKY_BOTTOM_DAY = new THREE.Color(0xe6f6fd);
    const SKY_TOP_NIGHT = new THREE.Color(0x0b1c33);
    const SKY_BOTTOM_NIGHT = new THREE.Color(0x2b3f57);
    const SUN_WARM = new THREE.Color(0xffb877);
    const SUN_DAY = new THREE.Color(0xfff2cc);

    function updateDayNight(dt) {
        if (!etat.horlogeGelee) { etat.dayPhase = (etat.dayPhase + dt / DAY_LENGTH) % 1; }   // gelée par setHeure (tests)
        const angle = etat.dayPhase * Math.PI * 2;
        const daylight = Math.max(0, Math.sin(angle)); // 0 la nuit, 1 en plein jour
        // LUMINOSITÉ DU POSTE : le soleil est TOUJOURS au sud-ouest ; selon l'endroit
        // où l'on pêche, on l'a dans le dos, de côté ou en plein contre-jour.
        const exposition = expositionPoste();
        // Soleil : azimut FIXE (sud-ouest), seule l'élévation suit le cycle du jour.
        sunDecalage.set(SUN_DIRECTION.x * 70, 12 + daylight * 65, SUN_DIRECTION.z * 70);
        suivreOmbres();
        sunLight.intensity = (0.25 + daylight * 1.05) * exposition;
        sunLight.color.copy(SUN_WARM).lerp(SUN_DAY, daylight);
        sunMesh.position.copy(camera.position).addScaledVector(sunDecalage.clone().normalize(), 120);
        sunGlow.position.copy(sunMesh.position);
        // La même direction pour le reflet solaire du shader d'eau (plus de valeur
        // codée en dur : le soleil peut être ailleurs qu'au sud-ouest).
        eau().uSunDir.value.copy(sunDecalage).normalize();
        // Ciel (dégradé), brume et fond.
        skyMat.uniforms.topColor.value.copy(SKY_TOP_NIGHT).lerp(SKY_TOP_DAY, daylight);
        skyMat.uniforms.bottomColor.value.copy(SKY_BOTTOM_NIGHT).lerp(SKY_BOTTOM_DAY, daylight);
        scene.background.copy(skyMat.uniforms.bottomColor.value);
        scene.fog.color.copy(skyMat.uniforms.bottomColor.value);
        // Lumières d'ambiance : la nuit reste assez claire pour jouer.
        ambientLight.intensity = (0.42 + daylight * 0.22) * (0.94 + exposition * 0.06);
        skyLight.intensity = (0.38 + daylight * 0.30) * (0.96 + exposition * 0.04);
        eau().uLight.value = (0.35 + daylight * 0.65) * exposition;
    }

    return {
        skyMat, sky, SUN_AZIMUT, azimutTexte, directionAzimut, directionSoleil3D,
        ambientLight, skyLight, sunLight, sunDecalage, DAY_LENGTH, updateDayNight
    };
}

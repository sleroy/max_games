// ---------------------------------------------------------------------------
// meteo.js — MÉTÉO : beau temps → rafales → pluie, piloté par le temps de jeu. Extrait de script.js (v158).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=204';

export function creerMeteo(deps) {
    const {
        POND_CENTER, scene, sunLight, ambientLight, skyLight, skyMat, sound
    } = deps;

    // ---------------------------------------------------------------------------
    // Météo : beau temps → rafales → pluie. Le cycle est piloté par le TEMPS DE JEU
    // (aucun tirage aléatoire) : le monde des tests reste donc reproductible.
    // ---------------------------------------------------------------------------
    const WEATHER_CYCLE = [
        { nom: 'beau', duree: 70, pluie: 0, rafales: 0 },
        { nom: 'rafales', duree: 45, pluie: 0, rafales: 1 },
        { nom: 'pluie', duree: 60, pluie: 1, rafales: 0.6 }
    ];
    let weatherIndex = 0;
    let weatherTimer = WEATHER_CYCLE[0].duree;
    etat.weatherPluie = 0;
    etat.weatherRafales = 0;
    let rainRippleTimer = 0;
    const GRIS_PLUIE = new THREE.Color(0x6b7a86);

    function weatherName() {
        return WEATHER_CYCLE[weatherIndex].nom;
    }

    function setWeather(nom) {
        for (let i = 0; i < WEATHER_CYCLE.length; i++) {
            if (WEATHER_CYCLE[i].nom === nom) {
                weatherIndex = i;
                weatherTimer = WEATHER_CYCLE[i].duree;
                return;
            }
        }
    }

    // Gouttes de pluie : quelques centaines de points autour de l'étang.
    // v173 : la pluie couvre tout l'étang (≈ 220 unités de large) : zone de 2 × 120,
    // 2 400 gouttes (même densité qu'avant : 700 gouttes sur 120 × 120).
    const RAIN_DEMI = 120;
    const RAIN_COUNT = 2400;
    const rainPositions = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
        rainPositions[i * 3] = POND_CENTER.x - RAIN_DEMI + ((i * 37) % (RAIN_DEMI * 2));
        rainPositions[i * 3 + 1] = -0.2 + ((i * 53) % 32);
        rainPositions[i * 3 + 2] = POND_CENTER.z - RAIN_DEMI + ((i * 71) % (RAIN_DEMI * 2));
    }
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMaterial = new THREE.PointsMaterial({
        color: 0xcfe6f5, size: 0.24, transparent: true, opacity: 0, depthWrite: false
    });
    etat.rainPoints = new THREE.Points(rainGeometry, rainMaterial);
    etat.rainPoints.frustumCulled = false;
    scene.add(etat.rainPoints);

    function updateWeather(dt) {
        weatherTimer -= etat.meteoGelee ? 0 : dt;     // meteoGelee : crochet de test (physique.js)
        if (weatherTimer <= 0) {
            weatherIndex = (weatherIndex + 1) % WEATHER_CYCLE.length;
            weatherTimer = WEATHER_CYCLE[weatherIndex].duree;
        }
        const cible = WEATHER_CYCLE[weatherIndex];
        const k = Math.min(1, dt * 0.5);
        etat.weatherPluie += (cible.pluie - etat.weatherPluie) * k;
        etat.weatherRafales += (cible.rafales - etat.weatherRafales) * k;

        // La pluie assombrit le ciel et la lumière (appelé APRÈS le cycle jour/nuit).
        if (etat.weatherPluie > 0.01) {
            sunLight.intensity *= (1 - 0.5 * etat.weatherPluie);
            ambientLight.intensity = Math.max(0.22, ambientLight.intensity - 0.15 * etat.weatherPluie);
            skyLight.intensity += 0.12 * etat.weatherPluie;
            skyMat.uniforms.topColor.value.lerp(GRIS_PLUIE, 0.5 * etat.weatherPluie);
            skyMat.uniforms.bottomColor.value.lerp(GRIS_PLUIE, 0.35 * etat.weatherPluie);
            scene.background.copy(skyMat.uniforms.bottomColor.value);
        }

        // Gouttes + ondulations sur l'eau.
        rainMaterial.opacity = etat.weatherPluie * 0.75;
        if (etat.weatherPluie > 0.02) {
            const pas = dt * 26;
            for (let i = 0; i < RAIN_COUNT; i++) {
                let y = rainPositions[i * 3 + 1] - pas;
                if (y < -0.2) {
                    y = 30 + ((i * 13) % 12);
                }
                rainPositions[i * 3 + 1] = y;
            }
            rainGeometry.attributes.position.needsUpdate = true;
            rainRippleTimer -= dt;
            if (rainRippleTimer <= 0) {
                rainRippleTimer = 0.35;
                const a = rainRippleTimer * 37 + etat.weatherPluie * 11;
                etat.spawnRipple(new THREE.Vector3(
                    POND_CENTER.x + Math.cos(a) * 18 * 3, 0.06, POND_CENTER.z + Math.sin(a) * 18 * 3));
            }
        }
        sound.setRain(etat.weatherPluie);
    }

    return {
        weatherName, setWeather, updateWeather
    };
}

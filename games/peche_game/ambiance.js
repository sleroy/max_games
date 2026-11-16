// ---------------------------------------------------------------------------
// ambiance.js — AMBIANCE : vent, faune sonore, nuages et ondulation de la queue des poissons. Extrait de script.js (v166).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=204';

export function creerAmbiance(deps) {
    const {
        wind, rand, vaneArrow, windFill, windArrow, sound, clouds
    } = deps;

    // ---------------------------------------------------------------------------
    // Mise à jour
    // ---------------------------------------------------------------------------
    function updateWind(dt) {
        wind.timer -= dt;
        if (wind.timer <= 0) {
            wind.targetDir = rand() * Math.PI * 2;
            wind.targetStrength = rand() * 0.8;
            wind.timer = 6 + rand() * 6;
        }
        const lerpFactor = 1 - Math.pow(0.1, dt);
        let diff = wind.targetDir - wind.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        wind.dir += diff * lerpFactor;
        wind.strength += (wind.targetStrength - wind.strength) * lerpFactor;

        // Rafales : la météo peut renforcer le vent par moments (toujours < 1).
        wind.clock = (wind.clock || 0) + dt;
        if (etat.weatherRafales > 0.01) {
            const rafale = etat.weatherRafales * (0.30 + 0.30 * Math.sin(wind.clock * 2.3));
            wind.strength = Math.min(0.95, wind.strength + rafale * dt * 0.9);
        }

        vaneArrow.rotation.y = -wind.dir;
        windFill.style.width = (wind.strength * 100).toFixed(0) + '%';
        windArrow.style.transform = 'rotate(' + (wind.dir * 180 / Math.PI).toFixed(0) + 'deg)';
        sound.setWind(wind.strength);
        updateFauneSonore(dt);
    }

    // Ambiance vivante : la nuit les grenouilles et les grillons chantent en continu ;
    // le jour un héron, un martin-pêcheur, une corneille ou un canard se font entendre
    // de loin en loin (intervalles aléatoires, sans toucher au hasard du monde).
    let delaiFaune = 12;
    function updateFauneSonore(dt) {
        const jour = Math.max(0, Math.sin(etat.dayPhase * Math.PI * 2));
        sound.setNuit(1 - Math.min(1, jour * 1.6));
        delaiFaune -= dt;
        if (delaiFaune > 0) { return; }
        delaiFaune = 9 + Math.random() * 18;
        if (jour < 0.15) { return; }
        const r = Math.random();
        if (r < 0.3) { sound.playHeron(); }
        else if (r < 0.55) { sound.playMartinPecheur(); }
        else if (r < 0.8) { sound.playCorneille(); }
        else { sound.playCanard(); }
    }

    function updateClouds(dt) {
        const speed = 2 + wind.strength * 4;
        clouds.forEach(cloud => {
            cloud.position.x += Math.cos(wind.dir) * speed * dt;
            cloud.position.z += Math.sin(wind.dir) * speed * dt;
            if (cloud.position.x > 230) cloud.position.x = -230;
            if (cloud.position.x < -230) cloud.position.x = 230;
            if (cloud.position.z > 50) cloud.position.z = -290;
            if (cloud.position.z < -290) cloud.position.z = 50;
        });
    }

    // Le mouvement augmente vers la queue et se propage avec un déphasage le
    // long du corps. La caudale suit la même translation que son point d'attache.
    // Corps par sections (modelePoisson.js) : x va de +swimDemi (museau) à
    // -swimDemi (pédoncule), l'amplitude est déjà en unités du modèle (swimAmp).
    // Ancien modèle (sphère) : x de +0,6 à -0,6, amplitude × scale.z.
    function animateFishMesh(data, phase, amplitude) {
        const positions = data.bodyMesh.geometry.getAttribute('position');
        const rest = data.swimRest;
        const demi = data.swimDemi || 0.6;
        const ampl = amplitude * (data.swimAmp !== undefined ? data.swimAmp : 1);
        const tableau = positions.array;
        for (let i = 0; i < positions.count; i++) {
            const rear = Math.max(0, -rest[i * 3] / demi);
            tableau[i * 3 + 2] = rest[i * 3 + 2] + Math.sin(phase - rear) * ampl * rear * rear;
        }
        positions.needsUpdate = true;
        data.bodyMesh.geometry.computeVertexNormals();
        data.tailPivot.position.z = Math.sin(phase - 0.98) * amplitude
            * (data.swimAmp !== undefined ? data.swimAmp : data.bodyMesh.scale.z);
        data.tailPivot.rotation.y = Math.sin(phase - 1.45) * amplitude * 3.2;
    }

    return {
        updateWind, updateClouds, animateFishMesh
    };
}

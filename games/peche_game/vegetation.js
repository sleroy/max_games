// ---------------------------------------------------------------------------
// vegetation.js — LA VÉGÉTATION ONDULE AU VENT : roseaux du bord et touffes d'herbe des berges.
//
// Le balancement est fait dans le SHADER (sommets) : aucune matrice d'instance n'est recalculée
// à chaque image, les roseaux restent en 1 appel de dessin et l'herbe aussi. Le haut des tiges
// plie dans le sens du vent (wind.dir, comme l'eau), plus fort quand il souffle (wind.strength,
// rafales comprises), avec un petit frémissement décalé d'une plante à l'autre.
//
// Le temps est `wind.clock` (ambiance.js) : il s'arrête quand le jeu est en pause.
// ⚠ Ce module ne consomme JAMAIS `rand()` (ordre du monde, voir decor.js) : l'herbe est placée
// avec son propre générateur à graine fixe.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { FORME_DEFAUT, angleParBord, pointAuBord } from './dimensions.js?v=257';

export const TOUFFES = 4000;          // touffes d'herbe sur les berges
export const BRINS_PAR_TOUFFE = 7;
export const AMPLITUDE_ROSEAUX = 0.55; // déplacement max du sommet (unités) par vent fort
export const AMPLITUDE_HERBE = 0.16;

// Déplacement horizontal du SOMMET d'une plante (facteur 0 → 1 de hauteur = 1), même formule que
// le shader (utile aux tests) : vent de fond + oscillation, décalés selon la position de la plante.
export function balancement(temps, force, x, z) {
    const phase = x * 0.37 + z * 0.21;
    return force * (0.65 + 0.35 * Math.sin(temps * 1.7 + phase)) + 0.06 * Math.sin(temps * 2.9 + phase * 1.3);
}

// Le shader de vent, greffé sur un matériau three.js existant (Standard, Lambert…).
// `hauteur` : la géométrie va de y = 0 (pied, fixe) à y = 1 (sommet, plie le plus).
function brancherVent(materiau, uniforms, amplitude) {
    materiau.onBeforeCompile = function (shader) {
        shader.uniforms.uTempsVent = uniforms.uTempsVent;
        shader.uniforms.uForceVent = uniforms.uForceVent;
        shader.uniforms.uDirVent = uniforms.uDirVent;
        shader.vertexShader = 'uniform float uTempsVent;\nuniform float uForceVent;\nuniform vec2 uDirVent;\n'
            + shader.vertexShader.replace('#include <project_vertex>', [
                'vec4 mvPosition = vec4( transformed, 1.0 );',
                '#ifdef USE_INSTANCING',
                '    mvPosition = instanceMatrix * mvPosition;',
                '    vec2 pied = ( instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xz;',
                '#else',
                '    vec2 pied = vec2( 0.0 );',
                '#endif',
                'float hauteurVent = clamp( position.y, 0.0, 1.0 );',
                'hauteurVent *= hauteurVent;',
                'float phaseVent = pied.x * 0.37 + pied.y * 0.21;',
                'float plie = uForceVent * ( 0.65 + 0.35 * sin( uTempsVent * 1.7 + phaseVent ) )',
                '    + 0.06 * sin( uTempsVent * 2.9 + phaseVent * 1.3 );',
                'mvPosition.xz += uDirVent * plie * hauteurVent * ' + amplitude.toFixed(3) + ';',
                'mvPosition.y -= plie * plie * hauteurVent * ' + (amplitude * 0.35).toFixed(3) + ';',
                'mvPosition = modelViewMatrix * mvPosition;',
                'gl_Position = projectionMatrix * mvPosition;'
            ].join('\n'));
    };
    materiau.customProgramCacheKey = function () { return 'vent-' + amplitude; };
    materiau.needsUpdate = true;
}

// Une touffe : quelques brins fins (triangles) qui partent du pied en éventail, y de 0 à 1.
// Couleur par sommet : pied sombre, pointe claire.
function geometrieTouffe() {
    const positions = [];
    const couleurs = [];
    const pied = new THREE.Color(0x2e5a22);
    const pointe = new THREE.Color(0x8fbf4f);
    for (let i = 0; i < BRINS_PAR_TOUFFE; i++) {
        const a = (i / BRINS_PAR_TOUFFE) * Math.PI * 2 + (i % 2) * 0.4;
        const ecart = 0.08 + 0.05 * (i % 3);
        const cx = Math.cos(a) * ecart;
        const cz = Math.sin(a) * ecart;
        const lx = -Math.sin(a) * 0.035;     // demi-largeur du brin, perpendiculaire à l'éventail
        const lz = Math.cos(a) * 0.035;
        const h = 0.75 + 0.25 * ((i * 7) % 4) / 3;
        positions.push(cx - lx, 0, cz - lz, cx + lx, 0, cz + lz, cx * 2.6, h, cz * 2.6);
        couleurs.push(pied.r, pied.g, pied.b, pied.r, pied.g, pied.b, pointe.r, pointe.g, pointe.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(couleurs, 3));
    geo.computeVertexNormals();
    return geo;
}

export function creerVegetation(deps) {
    const { scene, wind, roseauxMat, rayonEtang, POND_CENTER, RIVE_Y } = deps;
    const uniforms = {
        uTempsVent: { value: 0 },
        uForceVent: { value: 0 },
        uDirVent: { value: new THREE.Vector2(1, 0) }
    };

    // --- Roseaux : le matériau du décor reçoit le shader de vent ---
    if (roseauxMat) { brancherVent(roseauxMat, uniforms, AMPLITUDE_ROSEAUX); }

    // --- Herbe des berges : touffes instanciées, de la bande de sable jusqu'au sous-bois ---
    // Les touffes sont POSÉES (`poser`) d'après le contour ACTUEL : refaites quand la taille de l'étang change
    // (`regler(densite, echelle)`). La même graine à chaque pose : même étang, même herbe. La bande d'herbe
    // suit l'échelle de l'étang (× f borné [0,3 ; 3]) ; pour la plaine (f = 1), l'herbe d'origine.
    const GRAINE_HERBE = 0x9e3779b9;
    let graine = GRAINE_HERBE;
    function hasard() {
        graine = (graine + 0x6d2b79f5) >>> 0;
        let t = graine;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const herbeMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    brancherVent(herbeMat, uniforms, AMPLITUDE_HERBE);
    const herbe = new THREE.InstancedMesh(geometrieTouffe(), herbeMat, TOUFFES);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const axeY = new THREE.Vector3(0, 1, 0);
    let echelleHerbe = null;
    let formeHerbe = FORME_DEFAUT;
    function poser(echelle, forme) {
        graine = GRAINE_HERBE;
        const bande = 45 * Math.max(0.3, Math.min(3, echelle));
        const etang = forme === undefined || forme === FORME_DEFAUT;
        for (let i = 0; i < TOUFFES; i++) {
            // Étang : angle uniforme et décalage radial (monde d'origine). Canal, lac, rivière : touffes réparties le
            // long de la RIVE et décalées sur la normale du contour (sur une berge droite, un décalage radial se réduirait à presque rien).
            const angle = etang ? hasard() * Math.PI * 2 : angleParBord(hasard(), forme);
            // Plus dense près de l'eau (là où la caméra regarde), clairsemée vers le sous-bois.
            // Le sable du bord fait 3,4 à 5,8 unités (environnement.js) : l'herbe commence après.
            if (etang) {
                const r = rayonEtang(angle) + 5 + hasard() * hasard() * bande;
                p.set(POND_CENTER.x + Math.cos(angle) * r, RIVE_Y, POND_CENTER.z + Math.sin(angle) * r);
            } else {
                const o = pointAuBord(rayonEtang, angle, 5 + hasard() * hasard() * bande);
                p.set(POND_CENTER.x + o.x, RIVE_Y, POND_CENTER.z + o.z);
            }
            q.setFromAxisAngle(axeY, hasard() * Math.PI * 2);
            const taille = 0.35 + hasard() * 0.4;
            s.set(taille * 1.4, taille, taille * 1.4);
            m.compose(p, q, s);
            herbe.setMatrixAt(i, m);
        }
        herbe.instanceMatrix.needsUpdate = true;
        herbe.boundingSphere = null;   // la sphère englobante mise en cache serait celle de l'ancien contour
        echelleHerbe = echelle;
        formeHerbe = forme === undefined ? FORME_DEFAUT : forme;
    }
    poser(1);
    herbe.receiveShadow = true;
    // Les uniformes suivent le vent juste avant chaque rendu : rien à appeler depuis la boucle.
    herbe.onBeforeRender = function () { maj(); };
    scene.add(herbe);

    function maj() {
        if (!wind) { return; }
        uniforms.uTempsVent.value = wind.clock || 0;
        uniforms.uForceVent.value = wind.strength || 0;
        uniforms.uDirVent.value.set(Math.cos(wind.dir || 0), Math.sin(wind.dir || 0));
    }
    maj();

    // Densité de l'herbe (0–1) : le biotope (milieux.js) fixe la part des touffes visibles. `echelle` (f = rayon /
    // 90, optionnel) : si elle a changé, l'herbe est reposée le long du contour actuel.
    function regler(densite, echelle, forme) {
        const f = echelle === undefined ? echelleHerbe : echelle;
        const g = forme === undefined ? formeHerbe : forme;
        if (f !== echelleHerbe || g !== formeHerbe) { poser(f, g); }
        herbe.count = Math.round(TOUFFES * Math.max(0, Math.min(1, densite === undefined ? 1 : densite)));
    }

    return { herbe, uniforms, maj, regler };
}

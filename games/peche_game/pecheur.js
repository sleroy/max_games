// ---------------------------------------------------------------------------
// pecheur.js — PÊCHEUR, CANNE et GESTE DE LANCER : modèle 3D, poses, charge et fouetté. Extrait de script.js (v171).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=224';

export function creerPecheur(deps) {
    const {
        RIVE_Y, scene
    } = deps;

    // ---------------------------------------------------------------------------
    // Pêcheur
    // ---------------------------------------------------------------------------
    etat.angler = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.8 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.6, 4, 10), clothMat);
    body.position.y = 1.5;
    body.castShadow = true;
    etat.angler.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), skinMat);
    head.position.y = 2.9;
    head.castShadow = true;
    etat.angler.add(head);

    const hatMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), hatMat);
    hat.position.y = 3.35;
    etat.angler.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 16), hatMat);
    brim.position.y = 3.2;
    etat.angler.add(brim);

    etat.arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.3, 4, 8), clothMat);
    etat.arm.position.set(0.55, 2.1, -0.35);
    etat.arm.rotation.z = -0.9;
    etat.arm.rotation.x = 0.4;
    etat.angler.add(etat.arm);

    // Le pêcheur est posé SUR la rive (pieds au niveau du sol, pas au niveau de l'eau).
    etat.angler.position.set(-4, RIVE_Y, 18);
    etat.angler.rotation.y = Math.PI;
    scene.add(etat.angler);

    // ---------------------------------------------------------------------------
    // Canne
    // ---------------------------------------------------------------------------
    // Pecheur de 1,70 m ; canne au flotteur de 3 m (6 unites).
    etat.rodBase = new THREE.Vector3(-3, 2.2 + RIVE_Y, 17);
    etat.rodTip = new THREE.Vector3(-0.8, 4.81, 11.89); // ~3 m du talon

    etat.rodLocalTip = etat.rodTip.clone().sub(etat.rodBase);
    etat.rodPivot = new THREE.Group();
    etat.rodPivot.position.copy(etat.rodBase);
    scene.add(etat.rodPivot);
    etat.rodGroup = new THREE.Group();
    etat.rodPivot.add(etat.rodGroup);

    const blankMaterial = new THREE.MeshStandardMaterial({ color: 0x25292a, roughness: 0.32 });
    const guideMaterial = new THREE.MeshStandardMaterial({ color: 0x8b9297, metalness: 0.7, roughness: 0.3 });
    const wrapMaterial = new THREE.MeshStandardMaterial({ color: 0x463025, roughness: 0.55 });
    const corkMaterial = new THREE.MeshStandardMaterial({ color: 0xb89163, roughness: 0.88 });
    const rodAxis = etat.rodLocalTip.clone().normalize();
    const guideSide = new THREE.Vector3(0, -1, 0).addScaledVector(rodAxis, rodAxis.y).normalize();
    const cylinderAxis = new THREE.Vector3(0, 1, 0);
    const guideAxis = new THREE.Vector3(0, 0, 1);

    function addRodCylinder(from, to, baseRadius, tipRadius, material, parent = etat.rodGroup) {
        const direction = to.clone().sub(from);
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(
            tipRadius, baseRadius, direction.length(), 12), material);
        mesh.position.copy(from).lerp(to, 0.5);
        mesh.quaternion.setFromUnitVectors(cylinderAxis, direction.normalize());
        parent.add(mesh);
        return mesh;
    }

    const blank = new THREE.Mesh(new THREE.CylinderGeometry(
        0.004, 0.022, etat.rodLocalTip.length(), 12, 16), blankMaterial);
    blank.geometry.rotateZ(-Math.PI / 2);
    blank.geometry.translate(etat.rodLocalTip.length() * 0.5, 0, 0);
    const blankAxis = new THREE.Vector3(1, 0, 0);
    blank.geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(blankAxis, rodAxis));
    const blankPositions = blank.geometry.getAttribute('position');
    const blankRest = blankPositions.array.slice();
    const guideMounts = [];
    let previousRodFlex = 0;
    etat.rodGroup.add(blank);
    blank.castShadow = true;
    addRodCylinder(new THREE.Vector3(), etat.rodLocalTip.clone().multiplyScalar(0.15), 0.052, 0.043, corkMaterial);
    addRodCylinder(etat.rodLocalTip.clone().multiplyScalar(0.15),
        etat.rodLocalTip.clone().multiplyScalar(0.22), 0.037, 0.032, wrapMaterial);
    addRodCylinder(etat.rodLocalTip.clone().multiplyScalar(0.22),
        etat.rodLocalTip.clone().multiplyScalar(0.27), 0.039, 0.031, corkMaterial);

    const spoolMaterial = new THREE.MeshStandardMaterial({ color: 0xb28643, metalness: 0.72, roughness: 0.31 });
    const lineCoilMaterial = new THREE.MeshStandardMaterial({ color: 0x798477, roughness: 0.68 });
    const reelSeat = etat.rodLocalTip.clone().multiplyScalar(0.18);
    const reelCenter = reelSeat.clone().addScaledVector(guideSide, 0.19);
    const spoolBack = reelCenter.clone().addScaledVector(rodAxis, 0.09);
    const spoolFront = reelCenter.clone().addScaledVector(rodAxis, 0.17);
    const bodyBack = reelCenter.clone().addScaledVector(rodAxis, -0.11);
    const crankSide = new THREE.Vector3().crossVectors(rodAxis, guideSide).normalize();

    addRodCylinder(reelSeat.clone().addScaledVector(rodAxis, -0.12),
        reelSeat.clone().addScaledVector(rodAxis, 0.10), 0.041, 0.036, guideMaterial);
    addRodCylinder(reelSeat, reelCenter, 0.016, 0.029, blankMaterial);
    addRodCylinder(bodyBack, reelCenter, 0.028, 0.075, blankMaterial);
    addRodCylinder(reelCenter, spoolBack, 0.072, 0.064, blankMaterial);
    addRodCylinder(spoolBack, spoolFront, 0.055, 0.057, lineCoilMaterial);
    addRodCylinder(spoolFront, spoolFront.clone().addScaledVector(rodAxis, 0.018),
        0.073, 0.066, spoolMaterial);
    addRodCylinder(spoolFront.clone().addScaledVector(rodAxis, 0.018),
        spoolFront.clone().addScaledVector(rodAxis, 0.041), 0.027, 0.018, blankMaterial);

    const reelRotor = new THREE.Group();
    reelRotor.position.copy(spoolBack);
    etat.rodGroup.add(reelRotor);
    const bail = new THREE.Mesh(new THREE.TorusGeometry(0.091, 0.004, 6, 24, Math.PI * 1.15), guideMaterial);
    bail.position.addScaledVector(rodAxis, 0.054);
    bail.quaternion.setFromUnitVectors(guideAxis, rodAxis);
    reelRotor.add(bail);
    for (const side of [-1, 1]) {
        const hinge = crankSide.clone().multiplyScalar(0.081 * side);
        addRodCylinder(hinge, hinge.clone().addScaledVector(rodAxis, 0.053),
            0.017, 0.022, blankMaterial, reelRotor);
    }

    const reelCrank = new THREE.Group();
    reelCrank.position.copy(reelCenter);
    etat.rodGroup.add(reelCrank);
    const crankElbow = crankSide.clone().multiplyScalar(0.127);
    const crankHandle = crankElbow.clone().addScaledVector(guideSide, 0.096);
    addRodCylinder(new THREE.Vector3(), crankElbow, 0.018, 0.012, guideMaterial, reelCrank);
    addRodCylinder(crankElbow, crankHandle, 0.012, 0.009, guideMaterial, reelCrank);
    addRodCylinder(crankHandle, crankHandle.clone().addScaledVector(crankSide, 0.057),
        0.019, 0.023, blankMaterial, reelCrank);

    for (const fraction of [0.35, 0.48, 0.60, 0.71, 0.81, 0.90, 0.96]) {
        const radius = THREE.MathUtils.lerp(0.05, 0.014, fraction);
        const mount = etat.rodLocalTip.clone().multiplyScalar(fraction);
        const ringCenter = mount.clone().addScaledVector(guideSide, radius * 1.6);
        const foot = addRodCylinder(mount, ringCenter.clone().addScaledVector(guideSide, -radius),
            0.006, 0.004, guideMaterial);
        const wrapRadius = THREE.MathUtils.lerp(0.023, 0.005, fraction);
        const wrap = addRodCylinder(mount.clone().addScaledVector(rodAxis, -0.025),
            mount.clone().addScaledVector(rodAxis, 0.025), wrapRadius, wrapRadius, wrapMaterial);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.003, 6, 12), guideMaterial);
        ring.position.copy(ringCenter);
        ring.quaternion.setFromUnitVectors(guideAxis, rodAxis);
        etat.rodGroup.add(ring);
        guideMounts.push({ fraction, rodParts: [foot, ring, wrap].map(mesh => ({ mesh, rest: mesh.position.clone() })) });
    }
    const tipGuide = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.003, 6, 12), guideMaterial);
    tipGuide.position.copy(etat.rodLocalTip);
    tipGuide.quaternion.setFromUnitVectors(guideAxis, rodAxis);
    etat.rodGroup.add(tipGuide);

    function rodFlexOffset(fraction, flex) {
        const t = Math.max(0, (fraction - 0.27) / 0.73);
        return flex * 2 * t * t * (1 - t);
    }

    function updateRodFlex(flex) {
        if (Math.abs(flex - previousRodFlex) < 0.001) { return; }
        previousRodFlex = flex;
        const length = etat.rodLocalTip.length();
        for (let i = 0; i < blankRest.length; i += 3) {
            const x = blankRest[i];
            const y = blankRest[i + 1];
            const z = blankRest[i + 2];
            const fraction = THREE.MathUtils.clamp((x * rodAxis.x + y * rodAxis.y + z * rodAxis.z) / length, 0, 1);
            const offset = rodFlexOffset(fraction, flex);
            blankPositions.setXYZ(i / 3, x + guideSide.x * offset, y + guideSide.y * offset, z + guideSide.z * offset);
        }
        blankPositions.needsUpdate = true;
        blank.geometry.computeVertexNormals();
        for (const { fraction, rodParts } of guideMounts) {
            const offset = rodFlexOffset(fraction, flex);
            for (const { mesh, rest } of rodParts) {
                mesh.position.copy(rest).addScaledVector(guideSide, offset);
            }
        }
    }

    // Pliage de la canne + position VISUELLE du bout (la ligne part de là).
    // `rodTip` reste la référence logique (distances, tests) et ne bouge pas.
    etat.rodTipVisual = etat.rodTip.clone();
    const ROD_BEND_AXIS = new THREE.Vector3(1, 0, 0);
    const AXE_VERTICAL = new THREE.Vector3(0, 1, 0);
    etat.rodBend = 0;

    // ---------------------------------------------------------------------------
    // GESTE DE LANCER : la canne s'arme en arrière pendant la charge, puis fouette
    // vers l'avant au lâcher. Le pêcheur et la canne s'orientent vers la cible
    // réelle (point visé, puis bouchon). `castSwing` > 0 = armé, < 0 = fouetté.
    // ---------------------------------------------------------------------------
    etat.castSwing = 0;
    etat.castSwingDepart = 0;        // valeur de l'armé au moment du lâcher
    etat.castYawAngler = 0;          // écart de lacet du corps par rapport au poste
    etat.castYawRod = 0;             // écart de lacet de la canne par rapport au poste
    etat.anglerYawBase = Math.PI;    // lacet de repos du pêcheur (fixé au placement)
    etat.rodYawBase = 0;             // lacet de repos du pivot de canne
    etat.CAST_SWING_CHARGE = 0.55; // armé en arrière (~31°)
    etat.CAST_SWING_RELEASE = -0.78; // fouetté vers l'avant (~45°)
    etat.CAST_YAW_ANGLER_MAX = 0.8;  // le corps ne se tord pas au-delà de ~46°
    etat.CAST_YAW_ROD_MAX = 1.2;     // la canne peut viser plus loin (~69°)

    function angleNormalise(valeur) {
        const deuxPi = Math.PI * 2;
        let a = valeur % deuxPi;
        if (a > Math.PI) { a -= deuxPi; }
        if (a < -Math.PI) { a += deuxPi; }
        return a;
    }

    function updateRod(dt) {
        const quiverActif = etat.modeQuiver.estActif();
        const cibleQuiver = (quiverActif && etat.floatState === 'bite')
            ? etat.modeQuiver.getBend() * 0.35 : 0;
        const target = ((etat.floatState === 'struggle' || etat.floatState === 'reeling') ? etat.tension * 0.5
            : (etat.floatState === 'bite' ? 0.10 : 0)) + cibleQuiver;
        etat.rodBend += (target - etat.rodBend) * Math.min(1, dt * 6);
        // En quiver, la canne est posée plus bas (scion vers l'eau) ; le geste de
        // lancer garde toutefois sa cinématique normale.
        const poseQuiver = (quiverActif && (etat.floatState === 'inWater' || etat.floatState === 'bite'
            || etat.floatState === 'struggle' || etat.floatState === 'reeling')) ? -0.24 : 0;
        const pliage = -etat.rodBend + etat.castSwing + poseQuiver;
        etat.rodGroup.rotation.x = pliage;
        updateRodFlex(etat.rodBend + etat.castSwing * 0.4);
        reelCrank.quaternion.setFromAxisAngle(crankSide, etat.crankAngle);
        reelRotor.quaternion.setFromAxisAngle(rodAxis, etat.crankAngle * 5);
        // Pliage autour de l'axe LOCAL de la canne, puis orientation du poste :
        // c'est exactement la transformation de rodPivot -> rodGroup.
        etat.rodTipVisual.copy(etat.rodLocalTip).applyAxisAngle(ROD_BEND_AXIS, pliage);
        if (etat.rodPivot.rotation.y) {
            etat.rodTipVisual.applyAxisAngle(AXE_VERTICAL, etat.rodPivot.rotation.y);
        }
        etat.rodTipVisual.add(etat.rodBase);
    }

    return {
        angleNormalise, updateRod
    };
}

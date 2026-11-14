import * as THREE from 'three';

// Configuration du jeu
const config = {
    worldSize: 30,
    blockTypes: {
        air: 0,
        grass: 1,
        dirt: 2,
        stone: 3,
        wood: 4
    }
};

// Configuration des pièges
const trapConfig = {
    hole: { damage: 5 },
    tnt: { damage: 15 },
    lava: { damage: 8 }
};

// État du jeu
const state = {
    isPlaying: false,
    selectedItem: 'block',
    blocks: new Map(),
    traps: new Map(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2()
};

// Joueur et IA
const player = {
    height: 1.8,
    radius: 0.3,
    position: new THREE.Vector3(-10, 8, -10),
    velocity: new THREE.Vector3(),
    onGround: false,
    health: 20,
    maxHealth: 20,
    lastAttack: 0,
    attackCooldown: 500,
    yaw: 0,
    pitch: 0
};

const ai = {
    height: 1.8,
    radius: 0.3,
    position: new THREE.Vector3(10, 15, 10),
    velocity: new THREE.Vector3(),
    onGround: false,
    health: 20,
    maxHealth: 20,
    mesh: null,
    lastAttack: 0,
    lastTrapPlace: 0,
    trapCooldown: 4000,
    trapSkill: 0.3
};

// Initialisation Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

// Caméra première personne
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('game-container').appendChild(renderer.domElement);

// Verrouiller le curseur
let isPointerLocked = false;

document.addEventListener('click', () => {
    if (state.isPlaying && !isPointerLocked) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (event) => {
    if (!state.isPlaying || !isPointerLocked) return;
    
    player.yaw -= event.movementX * 0.002;
    player.pitch -= event.movementY * 0.002;
    player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.pitch));
});

// Géométries
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

// Textures Minecraft authentiques
function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    // Fond vert foncé
    ctx.fillStyle = '#3D8B37';
    ctx.fillRect(0, 0, 16, 16);
    
    // Herbe supérieure
    ctx.fillStyle = '#5DAA3D';
    ctx.fillRect(0, 0, 16, 3);
    
    // Détails
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 10);
        ctx.fillStyle = Math.random() > 0.5 ? '#4A9A32' : '#6BC44A';
        ctx.fillRect(x, y, 1, 1);
    }
    
    // Bordures ombres
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(0, 15, 16, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

function createDirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, 0, 16, 16);
    
    // Particules de terre
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillStyle = Math.random() > 0.5 ? '#4E342E' : '#6D4C41';
        ctx.fillRect(x, y, 1, 1);
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(0, 0, 16, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#757575';
    ctx.fillRect(0, 0, 16, 16);
    
    // Pierres
    for (let i = 0; i < 25; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillStyle = Math.random() > 0.5 ? '#616161' : '#8B8B8B';
        ctx.fillRect(x, y, 1, 1);
    }
    
    // Fissures
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(8, 8);
    ctx.moveTo(10, 3);
    ctx.lineTo(14, 10);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

// Matériaux
const materials = {
    grass: new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.9 }),
    dirt: new THREE.MeshStandardMaterial({ map: createDirtTexture(), roughness: 0.9 }),
    stone: new THREE.MeshStandardMaterial({ map: createStoneTexture(), roughness: 0.8 }),
    trap: new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.5 }),
    tnt: new THREE.MeshStandardMaterial({ color: 0xFF0000 }),
    lava: new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF4500, emissiveIntensity: 0.5 })
};

const blockMeshes = new Map();
const trapMeshes = new Map();

// Génération du terrain
function generateTerrain() {
    for (let x = -config.worldSize; x < config.worldSize; x++) {
        for (let z = -config.worldSize; z < config.worldSize; z++) {
            const height = Math.floor(Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2) + 4;
            
            for (let y = 0; y < height; y++) {
                let blockType = config.blockTypes.dirt;
                if (y === height - 1) blockType = config.blockTypes.grass;
                if (y < height - 2) blockType = config.blockTypes.stone;
                
                setBlock(x, y, z, blockType);
            }
        }
    }
}

function setBlock(x, y, z, type) {
    const key = `${x},${y},${z}`;
    state.blocks.set(key, type);
    updateBlockMesh(x, y, z, type);
}

function getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return state.blocks.get(key) || config.blockTypes.air;
}

function updateBlockMesh(x, y, z, type) {
    const key = `${x},${y},${z}`;
    const existingMesh = blockMeshes.get(key);
    
    if (existingMesh) {
        scene.remove(existingMesh);
        blockMeshes.delete(key);
    }
    
    if (type !== config.blockTypes.air) {
        let material;
        switch(type) {
            case config.blockTypes.grass: material = materials.grass; break;
            case config.blockTypes.dirt: material = materials.dirt; break;
            case config.blockTypes.stone: material = materials.stone; break;
            default: material = materials.dirt;
        }
        
        const mesh = new THREE.Mesh(blockGeometry, material);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        scene.add(mesh);
        blockMeshes.set(key, mesh);
    }
}

// Pièges - maintenant ils ressemblent à des blocs normaux (faux blocs)
function placeTrap(x, y, z, trapType) {
    const key = `${x},${y},${z}`;
    const trap = { type: trapType, triggered: false, position: new THREE.Vector3(x, y, z) };
    state.traps.set(key, trap);
    
    // Le piège ressemble à un bloc d'herbe normal (indétectable!)
    const material = materials.grass;
    
    const mesh = new THREE.Mesh(blockGeometry, material);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.userData = { isTrap: true, trapType: trapType };
    
    scene.add(mesh);
    trapMeshes.set(key, mesh);
}

function triggerTrap(trapKey, victim) {
    const trap = state.traps.get(trapKey);
    if (!trap || trap.triggered) return;
    
    trap.triggered = true;
    const mesh = trapMeshes.get(trapKey);
    
    switch(trap.type) {
        case 'trap-hole':
            setBlock(trap.position.x, trap.position.y, trap.position.z, config.blockTypes.air);
            victim.position.y = trap.position.y - 3;
            victim.velocity.y = 0;
            takeDamage(victim, trapConfig.hole.damage, 'Tombe dans un trou!');
            break;
            
        case 'trap-tnt':
            if (mesh) {
                mesh.scale.set(3, 3, 3);
                setTimeout(() => {
                    if (mesh.parent) scene.remove(mesh);
                }, 150);
            }
            takeDamage(victim, trapConfig.tnt.damage, 'BOOM TNT!');
            break;
            
        case 'trap-lava':
            setBlock(trap.position.x, trap.position.y, trap.position.z, config.blockTypes.air);
            const lavaMesh = new THREE.Mesh(blockGeometry, materials.lava);
            lavaMesh.position.set(trap.position.x + 0.5, trap.position.y + 0.5, trap.position.z + 0.5);
            scene.add(lavaMesh);
            takeDamage(victim, trapConfig.lava.damage, 'LAVE! Aie!');
            setTimeout(() => { scene.remove(lavaMesh); }, 5000);
            break;
    }
    
    setTimeout(() => {
        state.traps.delete(trapKey);
        if (mesh && mesh.parent) scene.remove(mesh);
    }, 500);
}

function checkTrapTrigger(entity) {
    // Vérifier plusieurs positions autour des pieds pour détecter les pièges
    const x = Math.floor(entity.position.x);
    const y = Math.floor(entity.position.y - 0.1); // Juste au-dessus du sol
    const z = Math.floor(entity.position.z);
    
    // Vérifier à la position des pieds
    let trapKey = `${x},${y},${z}`;
    let trap = state.traps.get(trapKey);
    
    // Si pas trouvé, vérifier juste en dessous (pour les pièges sous les pieds)
    if (!trap) {
        trapKey = `${x},${y-1},${z}`;
        trap = state.traps.get(trapKey);
    }
    
    // Si pas trouvé, vérifier la position exacte des pieds
    if (!trap) {
        trapKey = `${x},${Math.floor(entity.position.y - entity.height)},${z}`;
        trap = state.traps.get(trapKey);
    }
    
    if (trap && !trap.triggered) {
        console.log('Piège déclenché!');
        triggerTrap(trapKey, entity);
    }
}

// Dégâts
function takeDamage(entity, amount, message) {
    entity.health -= amount;
    showMessage(message, 'damage');
    
    document.body.classList.add('damage-flash');
    setTimeout(() => document.body.classList.remove('damage-flash'), 300);
    
    if (entity.health <= 0) {
        entity.health = 0;
        endGame(entity === player ? 'ai' : 'player');
    }
    
    updateHealthUI();
}

function updateHealthUI() {
    const playerPercent = (player.health / player.maxHealth) * 100;
    const aiPercent = (ai.health / ai.maxHealth) * 100;
    
    document.getElementById('health-fill').style.width = playerPercent + '%';
    document.getElementById('health-text').textContent = `${Math.floor(player.health)}/${player.maxHealth}`;
    
    document.getElementById('ai-health-fill').style.width = aiPercent + '%';
    document.getElementById('ai-health-text').textContent = `${Math.floor(ai.health)}/${ai.maxHealth}`;
}

function showMessage(text, type = '') {
    const messages = document.getElementById('messages');
    const message = document.createElement('div');
    message.className = 'message ' + type;
    message.textContent = text;
    messages.appendChild(message);
    setTimeout(() => message.remove(), 2000);
}

// IA visible - Style Minecraft (Steve)
function createAIMesh() {
    const group = new THREE.Group();
    
    // Tête - peau (couleur peau)
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC }); // Peau
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    group.add(head);
    
    // Cheveux (couleur cheveux foncés)
    const hairGeo = new THREE.BoxGeometry(0.62, 0.2, 0.62);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3D2314 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.85;
    group.add(hair);
    
    // Corps - chemise bleue
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.6, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x294F8C }); // Bleu
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.95;
    group.add(body);
    
    // Bras droit - peau
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC });
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.4, 0.95, 0);
    group.add(rightArm);
    
    // Bras gauche - peau
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.4, 0.95, 0);
    group.add(leftArm);
    
    // Jambe droite - cyan
    const legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x506870 }); // Cyan
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.15, 0.3, 0);
    group.add(rightLeg);
    
    // Jambe gauche - cyan
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.15, 0.3, 0);
    group.add(leftLeg);
    
    // Glow effet
    const glowGeo = new THREE.BoxGeometry(1.2, 2.2, 1.2);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.15 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.0;
    group.add(glow);
    
    group.position.copy(ai.position);
    scene.add(group);
    ai.mesh = group;
}

// Contrôles
const keys = { w: false, a: false, s: false, d: false, space: false };

document.addEventListener('keydown', (e) => {
    if (!state.isPlaying) return;
    switch(e.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyD': keys.d = true; break;
        case 'Space': keys.space = true; break;
        case 'Digit1': selectItem('block'); break;
        case 'Digit2': selectItem('trap'); break;
        case 'KeyE': attack(); break; // Touche E pour attacker
        case 'KeyR': attack(); break; // Touche R pour attacker aussi
        case 'KeyQ': attack(); break; // Touche Q pour attacker aussi
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyD': keys.d = false; break;
        case 'Space': keys.space = false; break;
    }
});

function selectItem(item) {
    state.selectedItem = item;
    document.querySelectorAll('.inventory-slot').forEach(slot => {
        slot.classList.remove('active');
        if (slot.dataset.item === item) slot.classList.add('active');
    });
    showMessage('Item: ' + item, '');
}

// Ajouter les événements de clic sur l'inventaire (accessible quand pas de pointer lock)
document.querySelectorAll('.inventory-slot').forEach(slot => {
    slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = slot.dataset.item;
        if (item) {
            selectItem(item);
        }
    });
});

// Ajouter molette de souris pour changer d'item
const itemsList = ['block', 'trap'];
let currentItemIndex = 0;

document.addEventListener('wheel', (e) => {
    if (!state.isPlaying) return;
    
    if (e.deltaY > 0) {
        currentItemIndex = (currentItemIndex + 1) % itemsList.length;
    } else {
        currentItemIndex = (currentItemIndex - 1 + itemsList.length) % itemsList.length;
    }
    selectItem(itemsList[currentItemIndex]);
});

// Interactions souris
document.addEventListener('mousedown', (e) => {
    if (!state.isPlaying || !isPointerLocked) return;
    
    if (e.button === 0) attack();
    else if (e.button === 2) placeBlockOrTrap();
});

function attack() {
    const now = Date.now();
    if (now - player.lastAttack < player.attackCooldown) return;
    player.lastAttack = now;
    
    const distance = player.position.distanceTo(ai.position);
    if (distance < 2.5) {
        const damage = 4;
        ai.health -= damage;
        showMessage(`-${damage} HP IA!`, 'damage');
        
        // Effet visuel sur l'IA
        if (ai.mesh) {
            ai.mesh.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0xFF0000);
                }
            });
            setTimeout(() => {
                if (ai.mesh) {
                    ai.mesh.children[0].material.color.setHex(0x9B59B6);
                    ai.mesh.children[1].material.color.setHex(0x8E44AD);
                }
            }, 200);
        }
        
        if (ai.health <= 0) {
            ai.health = 0;
            endGame('player');
        }
        updateHealthUI();
    }
}

function placeBlockOrTrap() {
    state.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const allMeshes = [...Array.from(blockMeshes.values()), ...Array.from(trapMeshes.values())];
    const intersects = state.raycaster.intersectObjects(allMeshes);
    
    if (intersects.length > 0 && intersects[0].distance < 6) {
        const intersect = intersects[0];
        const point = intersect.point;
        const face = intersect.face;
        
        let tx = Math.floor(point.x) + face.normal.x;
        let ty = Math.floor(point.y) + face.normal.y;
        let tz = Math.floor(point.z) + face.normal.z;
        
        // Ne pas placer sur le joueur
        const px = Math.floor(player.position.x);
        const py = Math.floor(player.position.y);
        const pz = Math.floor(player.position.z);
        
        if (tx === px && ty === py && tz === pz) return;
        
        if (state.selectedItem === 'trap') {
            // Place un faux bloc qui ressemble à de l'herbe (indétectable)
            placeTrap(tx, ty, tz, 'trap-hole');
            showMessage('Faux bloc placé!', 'trap');
        } else if (state.selectedItem === 'block') {
            setBlock(tx, ty, tz, config.blockTypes.dirt);
        }
    }
}

document.addEventListener('contextmenu', e => e.preventDefault());

// IA
function updateAI(delta) {
    const dist = ai.position.distanceTo(player.position);
    
    if (dist > 2) {
        const dir = new THREE.Vector3().subVectors(player.position, ai.position);
        dir.y = 0;
        dir.normalize();
        
        ai.position.x += dir.x * 4 * delta;
        ai.position.z += dir.z * 4 * delta;
        
        if (ai.position.y < 2 && Math.random() < 0.03) {
            ai.velocity.y = 7;
        }
    } else {
        const now = Date.now();
        if (now - ai.lastAttack > ai.attackCooldown * 2) {
            ai.lastAttack = now;
            const damage = 3;
            player.health -= damage;
            showMessage(`-${damage} HP!`, 'damage');
            
            if (player.health <= 0) {
                player.health = 0;
                endGame('ai');
            }
            updateHealthUI();
        }
    }
    
    // L'IA place des pièges
    const now = Date.now();
    if (now - ai.lastTrapPlace > ai.trapCooldown && Math.random() < ai.trapSkill) {
        ai.lastTrapPlace = now;
        
        const tx = Math.floor(player.position.x + (Math.random() - 0.5) * 3);
        const ty = Math.floor(player.position.y - 1);
        const tz = Math.floor(player.position.z + (Math.random() - 0.5) * 3);
        
        // L'IA place des faux blocs qui ressemblent à de l'herbe
        placeTrap(tx, ty, tz, 'trap-hole');
        showMessage('L\'IA place un faux bloc!', 'trap');
    }
    
    // Gravité IA
    ai.velocity.y -= 12 * delta;
    ai.position.y += ai.velocity.y * delta;
    
    // Collision avec le sol pour l'IA
    const aiMinY = Math.floor(ai.position.y - ai.height / 2);
    const aiMaxY = Math.floor(ai.position.y + ai.height / 2);
    const aiX = Math.floor(ai.position.x);
    const aiZ = Math.floor(ai.position.z);
    
    // Vérifier si l'IA est dans un bloc
    let onGround = false;
    for (let y = aiMinY; y <= aiMaxY; y++) {
        if (getBlock(aiX, y, aiZ) !== config.blockTypes.air) {
            // L'IA est dans un bloc, la pousser vers le haut
            ai.position.y = y + 1 + ai.height / 2;
            ai.velocity.y = 0;
            onGround = true;
            break;
        }
    }
    
    // Si pas dans un bloc et trop bas, remettre à la surface
    if (ai.position.y < 1) {
        ai.position.y = 1;
        ai.velocity.y = 0;
        onGround = true;
    }
    
    ai.onGround = onGround;
    
    // Mise à jour mesh IA
    if (ai.mesh) {
        ai.mesh.position.copy(ai.position);
        ai.mesh.lookAt(player.position.x, ai.position.y + 0.9, player.position.z);
    }
    
    checkTrapTrigger(ai);
}

// Joueur
function updatePlayer(delta) {
    // Rotation caméra
    const euler = new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    // Gravité
    player.velocity.y -= 12 * delta;
    
    // Mouvement
    const speed = 6;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.yaw, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, player.yaw, 0));
    
    const moveDir = new THREE.Vector3();
    if (keys.w) moveDir.add(forward);
    if (keys.s) moveDir.sub(forward);
    if (keys.d) moveDir.add(right);
    if (keys.a) moveDir.sub(right);
    
    if (moveDir.lengthSq() > 0) {
        moveDir.normalize().multiplyScalar(speed * delta);
        player.position.x += moveDir.x;
        checkCollisions('x');
        player.position.z += moveDir.z;
        checkCollisions('z');
    }
    
    // Saut
    if (keys.space && player.onGround) {
        player.velocity.y = 6;
        player.onGround = false;
    }
    
    player.position.y += player.velocity.y * delta;
    checkCollisions('y');
    
    if (player.position.y <= 1) {
        player.position.y = 1;
        player.velocity.y = 0;
        player.onGround = true;
    }
    
    // Position caméra
    camera.position.copy(player.position);
    camera.position.y += player.height - 0.2;
    
    checkTrapTrigger(player);
}

function checkCollisions(axis) {
    const minX = player.position.x - player.radius;
    const maxX = player.position.x + player.radius;
    const minY = player.position.y;
    const maxY = player.position.y + player.height;
    const minZ = player.position.z - player.radius;
    const maxZ = player.position.z + player.radius;
    
    for (let x = Math.floor(minX); x <= Math.floor(maxX); x++) {
        for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
            for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z++) {
                if (getBlock(x, y, z) !== config.blockTypes.air) {
                    if (axis === 'y') {
                        if (player.velocity.y < 0) {
                            player.position.y = y + 1;
                            player.velocity.y = 0;
                            player.onGround = true;
                        }
                    } else if (axis === 'x') {
                        player.position.x = player.position.x < x ? x - player.radius - 0.01 : x + 1 + player.radius + 0.01;
                    } else if (axis === 'z') {
                        player.position.z = player.position.z < z ? z - player.radius - 0.01 : z + 1 + player.radius + 0.01;
                    }
                }
            }
        }
    }
}

// Fin de partie
function endGame(winner) {
    state.isPlaying = false;
    document.exitPointerLock();
    
    const gameOver = document.getElementById('game-over');
    const title = document.getElementById('game-over-title');
    const text = document.getElementById('game-over-text');
    
    if (winner === 'player') {
        title.textContent = 'VICTOIRE!';
        text.textContent = 'Tu as gagné le combat!';
        title.style.color = '#44ff44';
    } else {
        title.textContent = 'DÉFAITE!';
        text.textContent = 'L\'IA a gagné...';
        title.style.color = '#ff4444';
    }
    
    gameOver.style.display = 'flex';
}

function restartGame() {
    player.position.set(-10, 8, -10);
    player.health = player.maxHealth;
    player.velocity.set(0, 0, 0);
    
    ai.position.set(10, 15, 10);
    ai.health = ai.maxHealth;
    ai.velocity.set(0, 0, 0);
    
    state.traps.clear();
    trapMeshes.forEach(m => scene.remove(m));
    trapMeshes.clear();
    
    state.blocks.clear();
    blockMeshes.forEach(m => scene.remove(m));
    blockMeshes.clear();
    
    generateTerrain();
    updateHealthUI();
    
    document.getElementById('game-over').style.display = 'none';
    state.isPlaying = true;
}

// Boucle
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    if (!state.isPlaying) {
        renderer.render(scene, camera);
        return;
    }
    
    const delta = Math.min(clock.getDelta(), 0.1);
    
    updatePlayer(delta);
    updateAI(delta);
    
    renderer.render(scene, camera);
}

// Fonction appelée par le bouton HTML
window.gameStart = function() {
    console.log('Démarrage du jeu...');
    state.isPlaying = true;
    generateTerrain();
    createAIMesh();
    updateHealthUI();
    console.log('Jeu démarré!');
};

// Événements - backup si le bouton onclick ne marche pas
document.getElementById('start-btn').addEventListener('click', () => {
    window.gameStart();
});

document.getElementById('restart-btn').addEventListener('click', restartGame);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SLIME_RADIUS = 20;
const GRAVITY = 0.5;
const JUMP_POWER = 10;
const MAX_JUMP_CHARGE = 30; // Max frames to hold jump button
const MOVE_SPEED = 3;

let slime = {
    x: 50,
    y: canvas.height - SLIME_RADIUS,
    velocityY: 0,
    isJumping: false,
    jumpCharge: 0
};

let keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

function drawSlime() {
    ctx.beginPath();
    ctx.arc(slime.x, slime.y, SLIME_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#00FF00"; // Vert pour le slime
    ctx.fill();
    ctx.closePath();
}

function updateSlime() {
    // Gravity
    slime.velocityY += GRAVITY;
    slime.y += slime.velocityY;

    // Jump charge
    if (keys["Space"] && !slime.isJumping) {
        slime.jumpCharge++;
        if (slime.jumpCharge > MAX_JUMP_CHARGE) {
            slime.jumpCharge = MAX_JUMP_CHARGE;
        }
    } else if (!keys["Space"] && slime.jumpCharge > 0) {
        slime.velocityY = -JUMP_POWER * (slime.jumpCharge / MAX_JUMP_CHARGE);
        slime.isJumping = true;
        slime.jumpCharge = 0;
    }

    // Horizontal movement
    if (keys["ArrowLeft"]) {
        slime.x -= MOVE_SPEED;
    }
    if (keys["ArrowRight"]) {
        slime.x += MOVE_SPEED;
    }

    // Collision with ground
    if (slime.y + SLIME_RADIUS > canvas.height) {
        slime.y = canvas.height - SLIME_RADIUS;
        slime.velocityY = 0;
        slime.isJumping = false;
    }

    // Keep slime within canvas bounds horizontally
    if (slime.x - SLIME_RADIUS < 0) {
        slime.x = SLIME_RADIUS;
    }
    if (slime.x + SLIME_RADIUS > canvas.width) {
        slime.x = canvas.width - SLIME_RADIUS;
    }
}

let blocks = [];

function createLevel(levelNum) {
    blocks = []; // Clear previous blocks

    // Ground block
    blocks.push({ x: 0, y: canvas.height - 20, width: canvas.width, height: 20, type: "normal" });

    if (levelNum === 1) {
        blocks.push({ x: 100, y: canvas.height - 100, width: 80, height: 20, type: "normal" });
        blocks.push({ x: 250, y: canvas.height - 180, width: 100, height: 20, type: "bouncy" });
        blocks.push({ x: 400, y: canvas.height - 120, width: 60, height: 20, type: "normal" });
        blocks.push({ x: 550, y: canvas.height - 250, width: 120, height: 20, type: "normal" });
        blocks.push({ x: canvas.width - 150, y: canvas.height - 300, width: 100, height: 20, type: "end" });
    } else if (levelNum === 2) {
        blocks.push({ x: 80, y: canvas.height - 80, width: 70, height: 20, type: "normal" });
        blocks.push({ x: 200, y: canvas.height - 160, width: 90, height: 20, type: "bouncy" });
        blocks.push({ x: 350, y: canvas.height - 220, width: 70, height: 20, type: "normal" });
        blocks.push({ x: 500, y: canvas.height - 150, width: 80, height: 20, type: "normal" });
        blocks.push({ x: 650, y: canvas.height - 280, width: 100, height: 20, type: "bouncy" });
        blocks.push({ x: canvas.width - 120, y: canvas.height - 350, width: 80, height: 20, type: "end" });
    } else if (levelNum === 3) {
        blocks.push({ x: 50, y: canvas.height - 60, width: 60, height: 20, type: "bouncy" });
        blocks.push({ x: 180, y: canvas.height - 120, width: 80, height: 20, type: "normal" });
        blocks.push({ x: 300, y: canvas.height - 180, width: 60, height: 20, type: "bouncy" });
        blocks.push({ x: 450, y: canvas.height - 240, width: 90, height: 20, type: "normal" });
        blocks.push({ x: 600, y: canvas.height - 300, width: 70, height: 20, type: "bouncy" });
        blocks.push({ x: canvas.width - 100, y: canvas.height - 400, width: 60, height: 20, type: "end" });
    }
}

function drawBlocks() {
    blocks.forEach(block => {
        ctx.fillStyle = block.type === "bouncy" ? "#FFD700" : "#8B4513"; // Jaune pour rebondissant, marron pour normal
        if (block.type === "end") {
            ctx.fillStyle = "#FF0000"; // Rouge pour la fin
        }
        ctx.fillRect(block.x, block.y, block.width, block.height);
    });
}

function checkCollisions() {
    blocks.forEach(block => {
        // Slime collision with block
        if (
            slime.x + SLIME_RADIUS > block.x &&
            slime.x - SLIME_RADIUS < block.x + block.width &&
            slime.y + SLIME_RADIUS > block.y &&
            slime.y - SLIME_RADIUS < block.y + block.height
        ) {
            // Collision from top
            if (slime.velocityY > 0 && slime.y + SLIME_RADIUS - slime.velocityY <= block.y) {
                slime.y = block.y - SLIME_RADIUS;
                slime.velocityY = 0;
                slime.isJumping = false;

                if (block.type === "bouncy") {
                    slime.velocityY = -JUMP_POWER * 1.5; // Plus haut sur bloc rebondissant
                    slime.isJumping = true;
                } else if (block.type === "end") {
                    currentLevel++;
                    if (currentLevel <= maxLevels) {
                        alert("Niveau " + (currentLevel - 1) + " terminé ! Préparation du niveau " + currentLevel);
                        resetSlime();
                        createLevel(currentLevel);
                    } else {
                        alert("Félicitations ! Vous avez terminé tous les niveaux !");
                        // Gérer la fin complète du jeu
                        resetGame();
                    }
                }
            }
            // Basic side collision (can be improved)
            else if (slime.y + SLIME_RADIUS > block.y + 5) {
                if (slime.x < block.x) {
                    slime.x = block.x - SLIME_RADIUS;
                } else {
                    slime.x = block.x + block.width + SLIME_RADIUS;
                }
            }
        }
    });
}

const levelDisplay = document.getElementById("levelDisplay");

function updateLevelDisplay() {
    levelDisplay.textContent = currentLevel;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateSlime();
    checkCollisions();
    drawBlocks();
    drawSlime();

    updateLevelDisplay();
    requestAnimationFrame(gameLoop);
}

let currentLevel = 1;
const maxLevels = 3; // Définir un nombre maximum de niveaux pour l\'exemple

function resetSlime() {
    slime.x = 50;
    slime.y = canvas.height - SLIME_RADIUS;
    slime.velocityY = 0;
    slime.isJumping = false;
    slime.jumpCharge = 0;
}

function resetGame() {
    currentLevel = 1;
    resetSlime();
    createLevel(currentLevel);
}

createLevel(currentLevel);
gameLoop();
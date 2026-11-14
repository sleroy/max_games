// Constantes et variables du jeu
const cells = document.querySelectorAll('.cell');
const message = document.getElementById('message');
const currentPlayerDisplay = document.getElementById('current-player');
const resetBtn = document.getElementById('reset-btn');
const modeSelection = document.getElementById('mode-selection');
const aiOptions = document.getElementById('ai-options');
const difficultySelect = document.getElementById('difficulty');
const playerSymbolInputs = document.querySelectorAll('input[name="player-symbol"]');

// État du jeu
let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let gameMode = '2players'; // '2players' ou 'ai'
let playerSymbol = 'X'; // 'X' ou 'O'
let aiSymbol = 'O'; // 'X' ou 'O'
let isPlayerTurn = true; // true si c'est au tour du joueur humain

// Combinaisons gagnantes (lignes, colonnes, diagonales)
const winningCombinations = [
    [0, 1, 2], // Ligne supérieure
    [3, 4, 5], // Ligne du milieu
    [6, 7, 8], // Ligne inférieure
    [0, 3, 6], // Colonne gauche
    [1, 4, 7], // Colonne du milieu
    [2, 5, 8], // Colonne droite
    [0, 4, 8], // Diagonale principale
    [2, 4, 6]  // Diagonale secondaire
];

// Initialisation du jeu
function initGame() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
    
    resetBtn.addEventListener('click', resetGame);
    
    updateMessage();
}

// Gestion du clic sur une case
function handleCellClick(e) {
    const cell = e.target;
    const index = cell.getAttribute('data-index');
    
    // Vérifier si la case est déjà remplie ou si le jeu est terminé
    if (gameBoard[index] !== '' || !gameActive) {
        return;
    }
    
    // Mettre à jour le tableau de jeu et l'affichage
    gameBoard[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    
    // Vérifier s'il y a un gagnant ou un match nul
    if (checkWin()) {
        endGame(false);
    } else if (checkDraw()) {
        endGame(true);
    } else {
        // Changer de joueur
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateMessage();
    }
}

// Vérification de la victoire
function checkWin() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            highlightWinningCells(combination);
            return true;
        }
    }
    return false;
}

// Mettre en évidence les cases gagnantes
function highlightWinningCells(combination) {
    combination.forEach(index => {
        cells[index].style.backgroundColor = '#d4edda';
        cells[index].style.color = '#28a745';
    });
}

// Vérification du match nul
function checkDraw() {
    return gameBoard.every(cell => cell !== '');
}

// Fin de partie
function endGame(isDraw) {
    gameActive = false;
    
    if (isDraw) {
        message.textContent = "Match nul !";
        message.classList.add('draw-message');
    } else {
        message.textContent = `Le joueur ${currentPlayer} a gagné !`;
        message.classList.add('winner-message');
    }
}

// Mise à jour du message
function updateMessage() {
    message.textContent = `C'est au tour de : ${currentPlayer}`;
    message.classList.remove('winner-message', 'draw-message');
    currentPlayerDisplay.textContent = currentPlayer;
}

// Réinitialisation du jeu
function resetGame() {
    gameActive = true;
    currentPlayer = 'X';
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
        cell.style.backgroundColor = 'white';
        cell.style.color = 'black';
    });
    
    updateMessage();
}

// Algorithmes d'IA

// Niveau facile : choix aléatoire
function getEasyMove() {
    const emptyCells = gameBoard.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
}

// Niveau moyen : bloque les menaces et cherche à gagner
function getMediumMove() {
    // 1. Vérifier si l'IA peut gagner
    for (let i = 0; i < 9; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = aiSymbol;
            if (checkWinForSymbol(aiSymbol)) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';
        }
    }
    
    // 2. Bloquer le joueur s'il peut gagner
    for (let i = 0; i < 9; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = playerSymbol;
            if (checkWinForSymbol(playerSymbol)) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';
        }
    }
    
    // 3. Jouer au centre si disponible
    if (gameBoard[4] === '') return 4;
    
    // 4. Jouer dans les coins
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameBoard[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // 5. Jouer n'importe où
    return getEasyMove();
}

// Niveau difficile : algorithme Minimax
function getHardMove() {
    let bestScore = -Infinity;
    let bestMove;
    
    for (let i = 0; i < 9; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = aiSymbol;
            let score = minimax(gameBoard, 0, false);
            gameBoard[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    // Vérifier les conditions de fin
    if (checkWinForSymbol(aiSymbol)) return 10 - depth;
    if (checkWinForSymbol(playerSymbol)) return depth - 10;
    if (board.every(cell => cell !== '')) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = aiSymbol;
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = playerSymbol;
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinForSymbol(symbol) {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (gameBoard[a] === symbol && gameBoard[b] === symbol && gameBoard[c] === symbol) {
            return true;
        }
    }
    return false;
}

// Gestion du tour de l'IA
function aiTurn() {
    if (!gameActive || gameMode !== 'ai' || isPlayerTurn) return;
    
    message.textContent = "Robot en réflexion...";
    message.style.color = "#007bff";
    
    setTimeout(() => {
        let move;
        const difficulty = difficultySelect.value;
        
        switch(difficulty) {
            case 'easy':
                move = getEasyMove();
                break;
            case 'medium':
                move = getMediumMove();
                break;
            case 'hard':
                move = getHardMove();
                break;
            default:
                move = getEasyMove();
        }
        
        // Jouer le coup
        gameBoard[move] = aiSymbol;
        cells[move].textContent = aiSymbol;
        cells[move].classList.add(aiSymbol.toLowerCase());
        
        // Vérifier la fin de partie
        if (checkWin()) {
            endGame(false);
        } else if (checkDraw()) {
            endGame(true);
        } else {
            isPlayerTurn = true;
            currentPlayer = playerSymbol;
            updateMessage();
        }
    }, 1000); // Délai pour simuler la réflexion
}

// Gestion des événements pour les options
function setupEventListeners() {
    // Mode de jeu
    document.querySelectorAll('input[name="game-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            gameMode = e.target.value;
            aiOptions.style.display = gameMode === 'ai' ? 'block' : 'none';
            resetGame();
        });
    });
    
    // Symbole du joueur
    playerSymbolInputs.forEach(radio => {
        radio.addEventListener('change', (e) => {
            playerSymbol = e.target.value;
            aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
            isPlayerTurn = playerSymbol === 'X';
            currentPlayer = isPlayerTurn ? playerSymbol : aiSymbol;
            resetGame();
            
            // Si l'IA commence, elle joue immédiatement
            if (gameMode === 'ai' && !isPlayerTurn) {
                setTimeout(() => aiTurn(), 500);
            }
        });
    });
    
    // Difficulté
    difficultySelect.addEventListener('change', () => {
        resetGame();
    });
}

// Gestion mise à jour du message pour le mode IA
function updateMessage() {
    if (gameMode === 'ai') {
        if (isPlayerTurn) {
            message.textContent = `À votre tour (${playerSymbol})`;
            message.style.color = playerSymbol === 'X' ? '#007bff' : '#dc3545';
        } else {
            message.textContent = `Tour du robot (${aiSymbol})`;
            message.style.color = aiSymbol === 'X' ? '#007bff' : '#dc3545';
        }
    } else {
        message.textContent = `C'est au tour de : ${currentPlayer}`;
        message.style.color = '#555';
    }
    message.classList.remove('winner-message', 'draw-message');
    currentPlayerDisplay.textContent = currentPlayer;
}

// Gestion du clic sur une case en mode IA
function handleCellClick(e) {
    const cell = e.target;
    const index = cell.getAttribute('data-index');
    
    // Vérifier si la case est déjà remplie ou si le jeu est terminé
    if (gameBoard[index] !== '' || !gameActive) {
        return;
    }
    
    // En mode IA, vérifier si c'est bien au tour du joueur
    if (gameMode === 'ai' && !isPlayerTurn) {
        return;
    }
    
    // Mettre à jour le tableau de jeu et l'affichage
    gameBoard[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    
    // Vérifier s'il y a un gagnant ou un match nul
    if (checkWin()) {
        endGame(false);
    } else if (checkDraw()) {
        endGame(true);
    } else {
        if (gameMode === 'ai') {
            isPlayerTurn = false;
            currentPlayer = aiSymbol;
            updateMessage();
            aiTurn();
        } else {
            // Changer de joueur en mode 2 joueurs
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateMessage();
        }
    }
}

// Démarrage du jeu
initGame();
setupEventListeners();

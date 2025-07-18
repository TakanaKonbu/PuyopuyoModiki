const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const boardWidth = 6;
const boardHeight = 12;
const colors = ['red', 'green', 'blue', 'yellow', 'orange'];
let board = [];
let currentPuyo = null;
let score = 0;

// スコアを更新
function updateScore(points) {
    score += points;
    scoreDisplay.textContent = `スコア: ${score}`;
}

// ゲームボードの初期化
function initBoard() {
    for (let y = 0; y < boardHeight; y++) {
        board[y] = [];
        for (let x = 0; x < boardWidth; x++) {
            board[y][x] = null;
        }
    }
    score = 0;
    updateScore(0);
}

// 新しいぷよを生成
function createPuyo() {
    return {
        puyo1: { x: 2, y: 0, color: colors[Math.floor(Math.random() * colors.length)] },
        puyo2: { x: 2, y: 1, color: colors[Math.floor(Math.random() * colors.length)] },
        rotation: 0 // 0: 上, 1: 右, 2: 下, 3: 左
    };
}

// ぷよを描画
function drawBoard() {
    gameBoard.innerHTML = '';
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x]) {
                const puyoElement = document.createElement('div');
                puyoElement.classList.add('puyo', board[y][x]);
                puyoElement.style.gridColumnStart = x + 1;
                puyoElement.style.gridRowStart = y + 1;
                gameBoard.appendChild(puyoElement);
            }
        }
    }
    if (currentPuyo) {
        const { puyo1, puyo2 } = currentPuyo;
        const puyo1Element = document.createElement('div');
        puyo1Element.classList.add('puyo', puyo1.color);
        puyo1Element.style.gridColumnStart = puyo1.x + 1;
        puyo1Element.style.gridRowStart = puyo1.y + 1;
        gameBoard.appendChild(puyo1Element);

        const puyo2Element = document.createElement('div');
        puyo2Element.classList.add('puyo', puyo2.color);
        puyo2Element.style.gridColumnStart = puyo2.x + 1;
        puyo2Element.style.gridRowStart = puyo2.y + 1;
        gameBoard.appendChild(puyo2Element);
    }
}

// ぷよを下に移動
function movePuyoDown() {
    if (!currentPuyo) return;

    const { puyo1, puyo2 } = currentPuyo;
    if (puyo1.y + 1 < boardHeight && puyo2.y + 1 < boardHeight && !board[puyo1.y + 1][puyo1.x] && !board[puyo2.y + 1][puyo2.x]) {
        puyo1.y++;
        puyo2.y++;
    } else {
        // ぷよをボードに固定
        board[puyo1.y][puyo1.x] = puyo1.color;
        board[puyo2.y][puyo2.x] = puyo2.color;
        currentPuyo = null;
        checkAndClearPuyos();
        if (board[0][2]) {
            alert('ゲームオーバー');
            initBoard();
        } else {
            currentPuyo = createPuyo();
        }
    }
    drawBoard();
}

// ぷよが4つ以上つながっているかチェックして消す
function checkAndClearPuyos() {
    const toClear = [];
    const visited = Array(boardHeight).fill(null).map(() => Array(boardWidth).fill(false));

    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x] && !visited[y][x]) {
                const connected = [];
                const color = board[y][x];
                const stack = [{x, y}];
                visited[y][x] = true;

                while (stack.length > 0) {
                    const { x: currentX, y: currentY } = stack.pop();
                    connected.push({ x: currentX, y: currentY });

                    const neighbors = [
                        { x: currentX, y: currentY - 1 },
                        { x: currentX, y: currentY + 1 },
                        { x: currentX - 1, y: currentY },
                        { x: currentX + 1, y: currentY },
                    ];

                    for (const neighbor of neighbors) {
                        const { x: nx, y: ny } = neighbor;
                        if (
                            nx >= 0 && nx < boardWidth &&
                            ny >= 0 && ny < boardHeight &&
                            !visited[ny][nx] &&
                            board[ny][nx] === color
                        ) {
                            visited[ny][nx] = true;
                            stack.push({ x: nx, y: ny });
                        }
                    }
                }

                if (connected.length >= 4) {
                    toClear.push(...connected);
                    updateScore(connected.length * 30);
                }
            }
        }
    }

    if (toClear.length > 0) {
        for (const puyo of toClear) {
            board[puyo.y][puyo.x] = null;
        }
        dropPuyos();
    }
}

// ぷよを落下させる
function dropPuyos() {
    for (let x = 0; x < boardWidth; x++) {
        let emptySpaces = 0;
        for (let y = boardHeight - 1; y >= 0; y--) {
            if (board[y][x] === null) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                board[y + emptySpaces][x] = board[y][x];
                board[y][x] = null;
            }
        }
    }
    checkAndClearPuyos(); // Check again after dropping
}


// キーボード操作
document.addEventListener('keydown', (e) => {
    if (!currentPuyo) return;

    const { puyo1, puyo2 } = currentPuyo;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (puyo1.x > 0 && puyo2.x > 0 && !board[puyo1.y][puyo1.x - 1] && !board[puyo2.y][puyo2.x - 1]) {
                puyo1.x--;
                puyo2.x--;
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (puyo1.x < boardWidth - 1 && puyo2.x < boardWidth - 1 && !board[puyo1.y][puyo1.x + 1] && !board[puyo2.y][puyo2.x + 1]) {
                puyo1.x++;
                puyo2.x++;
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePuyoDown();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePuyo();
            break;
    }
    drawBoard();
});

function rotatePuyo() {
    const { puyo1, puyo2, rotation } = currentPuyo;
    const nextRotation = (rotation + 1) % 4;

    let newPuyo2X = puyo1.x;
    let newPuyo2Y = puyo1.y;

    if (nextRotation === 0) { // 上
        newPuyo2Y--;
    } else if (nextRotation === 1) { // 右
        newPuyo2X++;
    } else if (nextRotation === 2) { // 下
        newPuyo2Y++;
    } else if (nextRotation === 3) { // 左
        newPuyo2X--;
    }

    if (
        newPuyo2X >= 0 && newPuyo2X < boardWidth &&
        newPuyo2Y >= 0 && newPuyo2Y < boardHeight &&
        !board[newPuyo2Y][newPuyo2X]
    ) {
        puyo2.x = newPuyo2X;
        puyo2.y = newPuyo2Y;
        currentPuyo.rotation = nextRotation;
    }
}

// ゲーム開始
function startGame() {
    initBoard();
    currentPuyo = createPuyo();
    drawBoard();
    setInterval(movePuyoDown, 1000);
}

startGame();
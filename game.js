// ======== CONFIGURACIÓN DEL JUEGO =========
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

let keys = {};
let score = 0;
let lives = 3;
let bullets = [];
let enemies = [];
let lastEnemySpawn = 0;
let enemySpawnInterval = 1500; // ms
let gameOver = false;

// ======== JUGADOR ========
const player = {
    x: 50,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    color: "red",
    speed: 4,
    bulletSpeed: 6,
    fireRate: 300,
    lastShot: 0
};

// ======== EVENTOS DE TECLAS ========
document.addEventListener("keydown", (e) => keys[e.code] = true);
document.addEventListener("keyup", (e) => keys[e.code] = false);

// ======== DISPARAR ========
function shoot() {
    const now = Date.now();
    if (now - player.lastShot > player.fireRate) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - 2,
            width: 8,
            height: 4,
            color: "yellow"
        });
        player.lastShot = now;
    }
}

// ======== GENERAR ENEMIGOS (HUMANOS) ========
function spawnEnemy() {
    const now = Date.now();
    if (now - lastEnemySpawn > enemySpawnInterval) {
        enemies.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 40),
            width: 30,
            height: 40,
            color: "blue",
            speed: 2
        });
        lastEnemySpawn = now;
    }
}

// ======== ACTUALIZAR ENTIDADES ========
function update() {
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["Space"]) shoot();

    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Mover balas
    bullets.forEach((b, i) => {
        b.x += player.bulletSpeed;
        if (b.x > canvas.width) bullets.splice(i, 1);
    });

    // Mover enemigos
    enemies.forEach((en, i) => {
        en.x -= en.speed;

        // Colisión con jugador
        if (checkCollision(player, en)) {
            lives--;
            enemies.splice(i, 1);
            if (lives <= 0) {
                gameOver = true;
            }
        }

        // Eliminar si sale de pantalla
        if (en.x + en.width < 0) enemies.splice(i, 1);
    });

    // Colisión balas-enemigos
    bullets.forEach((b, bi) => {
        enemies.forEach((en, ei) => {
            if (checkCollision(b, en)) {
                score += 10;
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
            }
        });
    });

    spawnEnemy();
}

// ======== DIBUJAR ========
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jugador
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Balas
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Enemigos
    enemies.forEach(en => {
        ctx.fillStyle = en.color;
        ctx.fillRect(en.x, en.y, en.width, en.height);
    });

    // UI
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Puntos: " + score, 10, 20);
    ctx.fillText("Vidas: " + lives, 10, 40);

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText("Presiona F5 para reiniciar", canvas.width / 2 - 110, canvas.height / 2 + 40);
    }
}

// ======== CHEQUEAR COLISIÓN ========
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// ======== BUCLE PRINCIPAL ========
function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        draw();
    }
}

gameLoop();

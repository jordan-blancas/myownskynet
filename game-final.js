// MyOwnSkynet - Versión Final Corregida
console.log('🎮 Iniciando MyOwnSkynet - Versión Final...');

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado, inicializando juego...');
    
    // Obtener elementos del DOM
    const canvas = document.getElementById('game');
    const scoreEl = document.getElementById('score');
    const creditsEl = document.getElementById('credits');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const panel = document.getElementById('panelUpgrade');
    const closePanel = document.getElementById('closePanel');
    
    // Botones móviles
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnShoot = document.getElementById('btnShoot');
    const btnRestart = document.getElementById('btnRestart');
    
    // Verificar elementos críticos
    if (!canvas) {
        console.error('❌ Canvas no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('❌ Contexto 2D no disponible');
        return;
    }
    
    console.log('✅ Canvas inicializado');
    
    // Estado del juego
    const gameState = {
        running: true,
        score: 0,
        credits: 0,
        player: {
            x: 60,
            y: 0, // Se ajustará después
            w: 28,
            h: 48,
            vy: 0,
            onGround: true,
            speed: 6
        },
        enemies: [],
        bullets: [],
        keys: {},
        lastTime: 0
    };
    
    // Configurar canvas
    function setupCanvas() {
        const maxWidth = Math.min(window.innerWidth, 1100);
        const scale = Math.max(0.6, Math.min(1, window.innerWidth / 900));
        canvas.width = Math.floor(maxWidth);
        canvas.height = Math.floor(Math.max(320 * scale, window.innerHeight * 0.35));
        
        // Ajustar posición del jugador
        gameState.player.y = canvas.height - gameState.player.h - 12;
    }
    
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    // Controles de teclado
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        
        if (e.code === 'ArrowUp' || e.code === 'Space') {
            e.preventDefault();
            jump();
        }
        if (e.code === 'KeyF') {
            e.preventDefault();
            shoot();
        }
        if (e.code === 'KeyU') {
            togglePanel();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });
    
    // Controles móviles
    if (btnLeft) {
        btnLeft.addEventListener('mousedown', () => gameState.keys['ArrowLeft'] = true);
        btnLeft.addEventListener('mouseup', () => gameState.keys['ArrowLeft'] = false);
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys['ArrowLeft'] = true; });
        btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); gameState.keys['ArrowLeft'] = false; });
    }
    
    if (btnRight) {
        btnRight.addEventListener('mousedown', () => gameState.keys['ArrowRight'] = true);
        btnRight.addEventListener('mouseup', () => gameState.keys['ArrowRight'] = false);
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys['ArrowRight'] = true; });
        btnRight.addEventListener('touchend', (e) => { e.preventDefault(); gameState.keys['ArrowRight'] = false; });
    }
    
    if (btnShoot) {
        btnShoot.addEventListener('mousedown', shoot);
        btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });
    }
    
    if (btnRestart) {
        btnRestart.addEventListener('click', resetGame);
    }
    
    // Funciones del juego
    function jump() {
        if (gameState.player.onGround) {
            gameState.player.vy = -14;
            gameState.player.onGround = false;
        }
    }
    
    function shoot() {
        gameState.bullets.push({
            x: gameState.player.x + gameState.player.w,
            y: gameState.player.y + gameState.player.h/2,
            w: 8,
            h: 4,
            vx: 12
        });
    }
    
    function spawnEnemy() {
        if (Math.random() < 0.02) { // 2% de probabilidad por frame
            gameState.enemies.push({
                x: canvas.width,
                y: canvas.height - 40 - Math.random() * 60,
                w: 24,
                h: 40,
                speed: 3
            });
        }
    }
    
    function updateGame(deltaTime) {
        if (!gameState.running) return;
        
        // Movimiento del jugador
        if (gameState.keys['ArrowLeft']) {
            gameState.player.x -= gameState.player.speed;
        }
        if (gameState.keys['ArrowRight']) {
            gameState.player.x += gameState.player.speed;
        }
        
        // Mantener jugador en pantalla
        gameState.player.x = Math.max(0, Math.min(canvas.width - gameState.player.w, gameState.player.x));
        
        // Física del jugador
        gameState.player.vy += 0.8; // gravedad
        gameState.player.y += gameState.player.vy;
        
        // Colisión con el suelo
        if (gameState.player.y > canvas.height - gameState.player.h - 12) {
            gameState.player.y = canvas.height - gameState.player.h - 12;
            gameState.player.vy = 0;
            gameState.player.onGround = true;
        }
        
        // Actualizar enemigos
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            enemy.x -= enemy.speed;
            
            // Eliminar enemigos fuera de pantalla
            if (enemy.x + enemy.w < 0) {
                gameState.enemies.splice(i, 1);
                gameState.score += 5;
            }
        }
        
        // Actualizar balas
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            bullet.x += bullet.vx;
            
            // Eliminar balas fuera de pantalla
            if (bullet.x > canvas.width) {
                gameState.bullets.splice(i, 1);
                continue;
            }
            
            // Colisión bala-enemigo
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (bullet.x < enemy.x + enemy.w && bullet.x + bullet.w > enemy.x &&
                    bullet.y < enemy.y + enemy.h && bullet.y + bullet.h > enemy.y) {
                    gameState.enemies.splice(j, 1);
                    gameState.bullets.splice(i, 1);
                    gameState.score += 10;
                    gameState.credits += 2;
                    break;
                }
            }
        }
        
        // Generar enemigos
        spawnEnemy();
        
        // Puntuación por tiempo
        gameState.score += 0.1;
        gameState.credits += 0.01;
    }
    
    function drawGame() {
        // Limpiar canvas
        ctx.fillStyle = '#e6eef7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar suelo
        ctx.fillStyle = '#cfd8e3';
        ctx.fillRect(0, canvas.height - 12, canvas.width, 12);
        
        // Dibujar jugador
        ctx.fillStyle = '#58d68d';
        ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.w, gameState.player.h);
        
        // Dibujar enemigos
        ctx.fillStyle = '#b33';
        gameState.enemies.forEach(enemy => {
            ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
        });
        
        // Dibujar balas
        ctx.fillStyle = '#ffd86b';
        gameState.bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
        });
        
        // UI
        ctx.fillStyle = '#141826';
        ctx.font = '16px Arial';
        ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 10, 25);
        ctx.fillText(`Credits: ${Math.floor(gameState.credits)}`, 10, 45);
    }
    
    function updateUI() {
        if (scoreEl) scoreEl.textContent = Math.floor(gameState.score);
        if (creditsEl) creditsEl.textContent = Math.floor(gameState.credits);
    }
    
    function resetGame() {
        gameState.score = 0;
        gameState.credits = 0;
        gameState.enemies = [];
        gameState.bullets = [];
        gameState.player.x = 60;
        gameState.player.y = canvas.height - 60;
        gameState.player.vy = 0;
        gameState.running = true;
    }
    
    function togglePanel() {
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }
    
    // Event listeners para UI
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', togglePanel);
    }
    
    if (closePanel) {
        closePanel.addEventListener('click', togglePanel);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Resetear progreso?')) {
                resetGame();
            }
        });
    }
    
    // Bucle principal del juego
    function gameLoop(timestamp) {
        if (!gameState.lastTime) gameState.lastTime = timestamp;
        const deltaTime = timestamp - gameState.lastTime;
        gameState.lastTime = timestamp;
        
        updateGame(deltaTime);
        drawGame();
        updateUI();
        
        if (gameState.running) {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Iniciar el juego
    console.log('🚀 Iniciando bucle del juego...');
    requestAnimationFrame(gameLoop);
    
    // Exponer para debug
    window.gameState = gameState;
    window.resetGame = resetGame;
    window.MOS = { state: gameState, resetRound: resetGame };
    
    console.log('✅ Juego iniciado correctamente');
});

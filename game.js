/* MyOwnSkynet — Responsive runner + shooting + upgrades
   Works on mobile (touch) and desktop. Persiste mejoras en localStorage.
*/

(() => {
  // --- Canvas responsive setup (colocar al inicio del js) ---
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    // full-width within container while keeping a minimum logical height
    const parent = canvas.parentElement;
    const maxW = Math.min(window.innerWidth, 1100);
    // desired aspect ~ 900x220 -> keep scale but allow taller on mobile
    const scale = Math.max(0.6, Math.min(1, window.innerWidth / 900));
    canvas.width = Math.floor(maxW - 0); // use full width available
    // height based on ratio but allow chunk for mobile
    canvas.height = Math.floor(Math.max(220 * scale, window.innerHeight * 0.35));

    // keep player on ground when resize
    if (player) {
      player.y = Math.min(player.y, canvas.height - player.h - 12);
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- UI elements (existing in HTML) ---
  const scoreEl = document.getElementById('score');
  const creditsEl = document.getElementById('credits');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const panel = document.getElementById('panelUpgrade');
  const closePanel = document.getElementById('closePanel');
  const resetBtn = document.getElementById('resetBtn');

  // --- State ---
  const state = {
    running: true,
    score: 0,
    credits: 0,
    obstacles: [],      // reused as enemies/humans
    bullets: [],
    particles: [],
    lastTime: 0,
    enemyTimer: 0,
    enemyInterval: 1400,
    shieldActive: false,
    shieldUntil: 0
  };

  // --- Upgrades persistence ---
  const defaultUpgrades = { speed:0, jump:0, shield:0, mult:0, fireRate:0, bulletDmg:0 };
  const upgradesKey = 'mos_upgrades_v2';
  const upgrades = JSON.parse(localStorage.getItem(upgradesKey) || 'null') || defaultUpgrades;
  function persistUpgrades(){ localStorage.setItem(upgradesKey, JSON.stringify(upgrades)); }

  // --- Player ---
  const player = {
    x: 60,
    y: canvas.height - 60,
    w: 28,
    h: 48,
    vy: 0,
    jumps: 0,
    gravity: 1.2,
    onGround: true,
    maxJumps: 1,
    baseSpeed: 6,
    speed: 6,
    jumpStrength: 14,
    lastShot: 0,
    fireRate: 300, // ms
    bulletSpeed: 10,
    lives: 1
  };

  // apply upgrades to player (call after resize too)
  function applyUpgrades(){
    player.speed = player.baseSpeed * (1 + 0.10 * upgrades.speed);
    player.jumpStrength = 14 * (1 + 0.12 * upgrades.jump);
    player.maxJumps = upgrades.jump >= 3 ? 2 : 1;
    // fireRate upgrade reduces delay
    player.fireRate = Math.max(80, 300 - (upgrades.fireRate * 20));
    // bullet speed/damage could be applied (for now bullet speed small boost)
    player.bulletSpeed = 10 + (upgrades.bulletDmg * 1.5);
  }

  applyUpgrades();

  // --- Input: keyboard + mouse + touch ---
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Controls:
    // ArrowUp -> jump
    // ArrowLeft/ArrowRight -> movement (handled in loop)
    // Space -> shoot (changed from previous jump)
    // KeyF -> alternate shoot
    // KeyU -> toggle panel
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      doJump();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      shoot();
    }
    if (e.code === 'KeyF') {
      e.preventDefault();
      shoot();
    }
    if (e.code === 'KeyU') togglePanel();
  });
  window.addEventListener('keyup', e => keys[e.code] = false);

  // Mouse
  canvas.addEventListener('mousedown', e => {
    // on mobile / small screen we use left half for jump, right half for shoot
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.45) doJump();
    else shoot();
  });

  // Touch
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    if (x < rect.width * 0.45) doJump();
    else shoot();
  }, {passive:false});

  // --- Jump logic ---
  function doJump(){
    if (player.onGround || player.jumps < player.maxJumps){
      player.vy = -player.jumpStrength;
      player.onGround = false;
      player.jumps++;
    }
  }

  // --- Shooting ---
  function shoot(){
    const now = performance.now();
    if (now - player.lastShot < player.fireRate) return;
    player.lastShot = now;
    state.bullets.push({
      x: player.x + player.w,
      y: player.y + player.h/2 - 4,
      w: 10,
      h: 6,
      vx: player.bulletSpeed,
      dmg: 1 + upgrades.bulletDmg
    });
    // tiny visual/recoil could be added
  }

  // --- Enemy spawn (humans) ---
  function spawnHuman(){
    const gap = 100 + Math.random() * 120;
    const h = 28 + Math.random() * 40;
    // y random but within ground
    const y = Math.max(12, canvas.height - h - 12 - Math.random()*60);
    state.obstacles.push({
      x: canvas.width + 20,
      y: y,
      w: 28,
      h: h,
      speed: player.speed - (Math.random()*1.5) + 0.5 // small variance
    });
  }

  // --- Panel upgrades wiring ---
  upgradeBtn.addEventListener('click', togglePanel);
  closePanel.addEventListener('click', togglePanel);

  resetBtn.addEventListener('click', () => {
    if (!confirm('Resetear progreso y mejoras?')) return;
    localStorage.removeItem(upgradesKey);
    Object.assign(upgrades, defaultUpgrades);
    persistUpgrades();
    state.credits = 0;
    state.score = 0;
    applyUpgrades();
    updateHUD();
  });

  function togglePanel(){
    panel.classList.toggle('hidden');
    updatePanelCosts();
  }

  function updatePanelCosts(){
    panel.querySelectorAll('.upgrade').forEach(node=>{
      const id = node.dataset.id;
      const base = {speed:10,jump:12,shield:25,mult:20, fireRate:30, bulletDmg:30}[id] || 20;
      const nextCost = Math.floor(base * Math.pow(1.5, upgrades[id]||0));
      node.querySelector('.cost').textContent = nextCost;
    });
  }

  // Buy handler
  panel.addEventListener('click', (ev) => {
    if (!ev.target.matches('.buy')) return;
    const item = ev.target.closest('.upgrade').dataset.id;
    const base = {speed:10,jump:12,shield:25,mult:20, fireRate:30, bulletDmg:30}[item] || 20;
    const cost = Math.floor(base * Math.pow(1.5, upgrades[item]||0));
    if (state.credits < cost) { alert('Créditos insuficientes'); return; }
    state.credits -= cost;
    upgrades[item] = (upgrades[item]||0) + 1;
    // immediate effects
    if (item === 'shield') {
      state.shieldActive = true;
      state.shieldUntil = performance.now() + 8000; // 8s
    }
    persistUpgrades();
    applyUpgrades();
    updatePanelCosts();
    updateHUD();
  });

  // --- Collision helper ---
  function rectsOverlap(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // --- Particles small helper ---
  function createParticles(x,y,color){
    for (let i=0;i<12;i++){
      state.particles.push({
        x, y,
        vx:(Math.random()-0.5)*4,
        vy:(Math.random()-0.8)*3,
        life: 60 + Math.random()*80,
        color: color || '#444'
      });
    }
  }

  // --- HUD updater ---
  function updateHUD(){
    scoreEl.textContent = Math.floor(state.score);
    creditsEl.textContent = Math.floor(state.credits);
  }

  // --- Game reset / game over handling ---
  let gameOver = false;
  function setGameOver(){
    state.running = false;
    gameOver = true;
  }

  function resetRound(){
    state.obstacles = [];
    state.bullets = [];
    state.particles = [];
    state.score = 0;
    state.credits = 0;
    state.shieldActive = false;
    player.y = canvas.height - player.h - 12;
    player.vy = 0;
    player.jumps = 0;
    applyUpgrades();
    state.running = true;
    gameOver = false;
    state.lastTime = performance.now();
  }

  // --- Main loop ---
  function loop(ts){
    if (!state.lastTime) state.lastTime = ts;
    const dt = ts - state.lastTime;
    state.lastTime = ts;

    // === PLAYER HORIZONTAL MOVEMENT (added) ===
    // Use dt to make movement frame-rate independent (base frame ~16ms)
    const frameScale = Math.max(0.5, Math.min(2, dt / 16));
    if (keys['ArrowLeft']) {
      player.x -= (player.speed * frameScale);
    }
    if (keys['ArrowRight']) {
      player.x += (player.speed * frameScale);
    }
    // Keep within bounds
    if (player.x < 8) player.x = 8;
    if (player.x + player.w > canvas.width - 8) player.x = canvas.width - player.w - 8;

    // spawn logic
    state.enemyTimer += dt;
    const interval = Math.max(600, state.enemyInterval - Math.min(800, state.score * 0.8));
    if (state.enemyTimer > interval){
      state.enemyTimer = 0;
      spawnHuman();
    }

    // physics: apply gravity & update player
    player.vy += player.gravity * (dt/16);
    player.y += player.vy * (dt/16);
    if (player.y > canvas.height - player.h - 12){
      player.y = canvas.height - player.h - 12;
      player.vy = 0;
      player.onGround = true;
      player.jumps = 0;
    } else {
      player.onGround = false;
    }

    // move obstacles (humans)
    for (let i = state.obstacles.length - 1; i >= 0; i--){
      const ob = state.obstacles[i];
      ob.x -= (ob.speed + (upgrades.speed * 0.2)) * (dt/16); // small difficulty scaling, frame independent
      // check collision with player
      if (rectsOverlap(player, ob)){
        if (state.shieldActive && performance.now() < state.shieldUntil){
          // shield consumes obstacle
          state.shieldActive = false;
          state.shieldUntil = 0;
          createParticles(ob.x + ob.w/2, ob.y + ob.h/2, '#58d68d');
          state.obstacles.splice(i,1);
          state.score += 5;
          state.credits += 2 * (1 + (upgrades.mult || 0) * 0.1);
        } else {
          // player hit => game over (no auto reset)
          setGameOver();
        }
        continue;
      }
      // off-screen removal => reward for passing
      if (ob.x + ob.w < -50){
        state.obstacles.splice(i,1);
        state.score += 8;
        state.credits += 1 * (1 + (upgrades.mult || 0) * 0.1);
      }
    }

    // move bullets, check collisions with enemies
    for (let i = state.bullets.length - 1; i >= 0; i--){
      const b = state.bullets[i];
      b.x += b.vx * (dt/16);
      // remove if out of screen
      if (b.x > canvas.width + 50) { state.bullets.splice(i,1); continue; }
      // collision with obstacles
      for (let j = state.obstacles.length - 1; j >= 0; j--){
        const ob = state.obstacles[j];
        if (rectsOverlap(b, ob)){
          // hit
          createParticles(ob.x + ob.w/2, ob.y + ob.h/2, '#b33');
          state.obstacles.splice(j,1);
          // bullet may be removed
          state.bullets.splice(i,1);
          state.score += 10;
          state.credits += 3 * (1 + (upgrades.mult || 0) * 0.1);
          break;
        }
      }
    }

    // particles update
    for (let i = state.particles.length - 1; i >= 0; i--){
      const p = state.particles[i];
      p.x += p.vx * (dt/16);
      p.y += p.vy * (dt/16);
      p.vy += 0.12 * (dt/16);
      p.life -= 6 * (dt/16);
      if (p.life <= 0) state.particles.splice(i,1);
    }

    // shield timeout
    if (state.shieldActive && performance.now() > state.shieldUntil){
      state.shieldActive = false;
    }

    // scoring over time if running
    if (state.running){
      state.score += 0.04 * (1 + (upgrades.speed||0)*0.03) * (dt/16);
      state.credits += 0.004 * (1 + (upgrades.mult||0)*0.08) * (dt/16);
    }

    // Draw
    draw();

    if (!gameOver){
      requestAnimationFrame(loop);
    } else {
      drawGameOver();
    }

    updateHUD();
  }

  // --- Drawing functions ---
  function draw(){
    // clear
    ctx.fillStyle = '#e6eef7';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // ground
    ctx.fillStyle = '#cfd8e3';
    ctx.fillRect(0, canvas.height - 12, canvas.width, 12);

    // UI label top-left
    ctx.fillStyle = '#141826';
    ctx.font = `${Math.max(12, canvas.width * 0.012)}px Inter, Arial`;
    ctx.fillText('Skynet — v' + (1 + (upgrades.speed||0)*0.1).toFixed(2), 12, 18);

    // === DIBUJA HUMANO JUGADOR ===
    drawPlayerHuman();

    // shield visual
    if (state.shieldActive){
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(88,214,141,0.6)';
      ctx.lineWidth = 3;
      ctx.ellipse(player.x + player.w/2, player.y + player.h/2, player.w, player.h+6, 0,0,Math.PI*2);
      ctx.stroke();
    }

    // bullets
    ctx.fillStyle = '#ffd86b';
    state.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // enemies (draw simple human)
    state.obstacles.forEach(ob => drawHuman(ob));

    // particles
    state.particles.forEach(p => {
      ctx.fillStyle = p.color || '#333';
      ctx.fillRect(p.x, p.y, 2, 2);
    });
  }

  // Nuevo: Dibuja el jugador como humano
  function drawPlayerHuman() {
    const px = player.x, py = player.y, w = player.w, h = player.h;
    // cabeza
    ctx.fillStyle = '#58d68d';
    ctx.beginPath();
    ctx.arc(px + w/2, py + 10, 10, 0, Math.PI*2);
    ctx.fill();
    // cuerpo
    ctx.strokeStyle = '#0b1020';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + w/2, py + 20);
    ctx.lineTo(px + w/2, py + h - 8); // cuerpo
    // brazos
    ctx.moveTo(px + w/2, py + 28);
    ctx.lineTo(px + w/2 - 14, py + 38);
    ctx.moveTo(px + w/2, py + 28);
    ctx.lineTo(px + w/2 + 14, py + 38);
    // piernas
    ctx.moveTo(px + w/2, py + h - 8);
    ctx.lineTo(px + w/2 - 10, py + h + 12);
    ctx.moveTo(px + w/2, py + h - 8);
    ctx.lineTo(px + w/2 + 10, py + h + 12);
    ctx.stroke();
  }

  function drawHuman(ob){
    // head
    ctx.fillStyle = '#b33';
    ctx.beginPath();
    ctx.arc(ob.x + ob.w/2, ob.y + 8, 6, 0, Math.PI*2);
    ctx.fill();
    // body & limbs
    ctx.strokeStyle = '#300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ob.x + ob.w/2, ob.y + 14);
    ctx.lineTo(ob.x + ob.w/2, ob.y + ob.h - 6); // body
    ctx.moveTo(ob.x + ob.w/2 - 8, ob.y + 20);
    ctx.lineTo(ob.x + ob.w/2 + 8, ob.y + 20); // arms
    ctx.moveTo(ob.x + ob.w/2, ob.y + ob.h - 6);
    ctx.lineTo(ob.x + ob.w/2 - 6, ob.y + ob.h + 4); // leg1
    ctx.moveTo(ob.x + ob.w/2, ob.y + ob.h - 6);
    ctx.lineTo(ob.x + ob.w/2 + 6, ob.y + ob.h + 4); // leg2
    ctx.stroke();
  }

  function drawGameOver(){
    // overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff4d4d';
    ctx.font = `${Math.max(28, canvas.width * 0.05)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(14, canvas.width * 0.018)}px Arial`;
    ctx.fillText('Toca para reiniciar / F5 para recargar', canvas.width / 2, canvas.height / 2 + 26);
    ctx.textAlign = 'start';
  }

  // restart on canvas click/touch when game over
  canvas.addEventListener('mousedown', () => {
    if (gameOver) resetRound();
  });
  canvas.addEventListener('touchstart', (e) => {
    if (gameOver) { e.preventDefault(); resetRound(); }
  }, {passive:false});

  // Al final del archivo, después de otros event listeners:
  document.getElementById('btnRestart').addEventListener('click', () => {
    resetRound();
  });

  // --- Storage sync (external changes) ---
  window.addEventListener('storage', () => {
    const other = JSON.parse(localStorage.getItem(upgradesKey) || 'null');
    if (other) {
      Object.assign(upgrades, other);
      applyUpgrades();
    }
  });

  // start loop
  requestAnimationFrame(loop);

  // initial HUD
  updateHUD();

  // expose small debug in console
  window.MOS = { state, upgrades, resetRound, applyUpgrades };
})();

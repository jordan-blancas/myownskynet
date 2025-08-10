/* MyOwnSkynet — Simple runner with upgrades
   No libs, purely Canvas + localStorage
*/

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // UI
  const scoreEl = document.getElementById('score');
  const creditsEl = document.getElementById('credits');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const panel = document.getElementById('panelUpgrade');
  const closePanel = document.getElementById('closePanel');
  const resetBtn = document.getElementById('resetBtn');

  // Game state
  const state = {
    running: true,
    score: 0,
    credits: 0,
    speedBase: 6,
    gravity: 0.9,
    lastTime: 0,
    obstacleTimer: 0,
    obstacleInterval: 1400,
    obstacles: [],
    particles: [],
    shieldActive: false,
    shieldUntil: 0
  };

  // upgrades persistence
  const defaultUpgrades = { speed:0, jump:0, shield:0, mult:0 };
  const upgrades = JSON.parse(localStorage.getItem('mos_upgrades') || 'null') || defaultUpgrades;
  const persist = ()=> localStorage.setItem('mos_upgrades', JSON.stringify(upgrades));

  function applyUpgrades(){
    state.speed = state.speedBase * (1 + 0.10 * upgrades.speed);
    player.jumpStrength = 14 * (1 + 0.12 * upgrades.jump);
  }

  // Player
  const player = {
    x: 60,
    y: canvas.height - 48,
    w: 44,
    h: 40,
    vy: 0,
    onGround: true,
    jumps: 0,
    maxJumps: 1
  };

  // Input
  let pressing = false;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
    if (e.code === 'KeyU') togglePanel();
  });
  canvas.addEventListener('mousedown', ()=> jump());

  function jump(){
    if (player.onGround || player.jumps < player.maxJumps){
      player.vy = -player.jumpStrength;
      player.onGround = false;
      player.jumps++;
    }
  }

  // Obstacles (simple rectangles)
  function makeObstacle(){
    const h = 20 + Math.random()*40;
    const w = 12 + Math.random()*28;
    state.obstacles.push({
      x: canvas.width + 20,
      y: canvas.height - h - 12,
      w, h,
      speed: state.speed
    });
  }

  // Upgrades UI wiring
  upgradeBtn.addEventListener('click', togglePanel);
  closePanel.addEventListener('click', togglePanel);
  resetBtn.addEventListener('click', () => {
    if (!confirm('Resetear progreso y mejoras?')) return;
    localStorage.removeItem('mos_upgrades');
    Object.assign(upgrades, defaultUpgrades);
    state.credits = 0;
    state.score = 0;
    persist();
    updateUI();
    applyUpgrades();
  });

  function togglePanel(){
    panel.classList.toggle('hidden');
    updatePanelCosts();
  }

  function updatePanelCosts(){
    panel.querySelectorAll('.upgrade').forEach(node=>{
      const id = node.dataset.id;
      const base = {speed:10,jump:12,shield:25,mult:20}[id];
      const nextCost = Math.floor(base * Math.pow(1.6, upgrades[id]||0));
      node.querySelector('.cost').textContent = nextCost;
    });
  }

  panel.addEventListener('click', (ev)=>{
    if (!ev.target.matches('.buy')) return;
    const item = ev.target.closest('.upgrade').dataset.id;
    const base = {speed:10,jump:12,shield:25,mult:20}[item];
    const cost = Math.floor(base * Math.pow(1.6, upgrades[item]||0));
    if (state.credits < cost) { alert('Créditos insuficientes'); return; }
    state.credits -= cost;
    upgrades[item] = (upgrades[item]||0) + 1;
    // immediate effect for shield purchase
    if (item === 'shield') {
      state.shieldActive = true;
      state.shieldUntil = performance.now() + 8000; // 8s
    }
    persist();
    updatePanelCosts();
    applyUpgrades();
    updateUI();
  });

  function updateUI(){
    scoreEl.textContent = Math.floor(state.score);
    creditsEl.textContent = Math.floor(state.credits);
  }

  // Collisions
  function rectsOverlap(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Main loop
  function loop(ts){
    if (!state.lastTime) state.lastTime = ts;
    const dt = ts - state.lastTime;
    state.lastTime = ts;

    // spawn obstacles
    state.obstacleTimer += dt;
    if (state.obstacleTimer > state.obstacleInterval - Math.min(800, state.score*2)){
      state.obstacleTimer = 0;
      makeObstacle();
    }

    // physics
    player.vy += state.gravity;
    player.y += player.vy;
    if (player.y > canvas.height - player.h - 12){
      player.y = canvas.height - player.h - 12;
      player.vy = 0;
      player.onGround = true;
      player.jumps = 0;
    }

    // move obstacles
    for (let i = state.obstacles.length-1; i>=0; i--){
      const ob = state.obstacles[i];
      ob.x -= state.speed;
      if (ob.x + ob.w < -50) {
        state.obstacles.splice(i,1);
        // reward for avoiding
        const reward = 1 + (upgrades.mult || 0)*0.1;
        state.score += 10;
        state.credits += 1 * reward;
      } else {
        // collision
        if (rectsOverlap(player, ob)){
          if (state.shieldActive && performance.now() < state.shieldUntil){
            // consume shield
            state.shieldActive = false;
            state.shieldUntil = 0;
            // destroy obstacle
            state.obstacles.splice(i,1);
            createParticles(ob.x+ob.w/2, ob.y+ob.h/2);
          } else {
            // game over -> reset but keep upgrades
            state.running = false;
            setTimeout(()=>{
              // soft reset positions & continue
              state.obstacles = [];
              state.score = 0;
              player.y = canvas.height - player.h - 12;
              player.vy = 0;
              state.running = true;
              applyUpgrades();
            }, 900);
          }
        }
      }
    }

    // shield timeout check
    if (state.shieldActive && performance.now() > state.shieldUntil){
      state.shieldActive = false;
    }

    // background and render
    draw();

    // score increases by time
    if (state.running) {
      state.score += 0.06 * (1 + (upgrades.speed||0)*0.05);
      state.credits += 0.006 * (1 + (upgrades.mult||0)*0.1);
    }

    updateUI();
    requestAnimationFrame(loop);
  }

  function createParticles(x,y){
    for (let i=0;i<12;i++){
      state.particles.push({
        x,y,
        vx:(Math.random()-0.5)*4,
        vy:(Math.random()-0.6)*2,
        life:80 + Math.random()*120
      });
    }
  }

  function draw(){
    // clear
    ctx.fillStyle = '#e6eef7';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // ground
    ctx.fillStyle = '#cfd8e3';
    ctx.fillRect(0, canvas.height - 12, canvas.width, 12);

    // score text
    ctx.fillStyle = '#141826';
    ctx.font = '12px Inter, Arial';
    ctx.fillText('Skynet — v' + (1 + (upgrades.speed||0)*0.1).toFixed(2), 12, 18);

    // player
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // helmet / eye
    ctx.fillStyle = '#58d68d';
    ctx.fillRect(player.x + player.w - 12, player.y + 8, 8, 8);

    // shield visual
    if (state.shieldActive){
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(88,214,141,0.6)';
      ctx.lineWidth = 3;
      ctx.ellipse(player.x + player.w/2, player.y + player.h/2, player.w, player.h+6, 0,0,Math.PI*2);
      ctx.stroke();
    }

    // obstacles
    state.obstacles.forEach(ob=>{
      ctx.fillStyle = '#b33';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      // small detail "human" icon
      ctx.fillStyle = '#300';
      ctx.fillRect(ob.x + ob.w/2 - 2, ob.y + 4, 4, 6);
    });

    // particles
    for (let i = state.particles.length-1;i>=0;i--){
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= 8;
      ctx.fillStyle = 'rgba(80,80,80,0.8)';
      ctx.fillRect(p.x, p.y, 2,2);
      if (p.life <= 0) state.particles.splice(i,1);
    }
  }

  // init
  function init(){
    applyUpgrades();
    // double-jump if jump upgrade high enough
    player.maxJumps = upgrades.jump >= 3 ? 2 : 1;
    // listen UI for buys updates if storage changed externally
    window.addEventListener('storage', ()=> {
      const other = JSON.parse(localStorage.getItem('mos_upgrades')||'null');
      if (other) Object.assign(upgrades, other);
      applyUpgrades();
    });
    requestAnimationFrame(loop);
  }

  // start
  init();
})();

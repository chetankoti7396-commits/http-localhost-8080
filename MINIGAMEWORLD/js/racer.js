/**
 * Chetan GameVerse - Hyper Dash 2D Racing
 * Neon Arcade Cyber Highway Racer
 */

class RacerGame {
  constructor() {
    this.canvas = document.getElementById('racer-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.width = 360;
    this.height = 540;

    // Player car state
    this.player = {
      x: 180,
      y: 440,
      width: 44,
      height: 72,
      targetX: 180,
      speedX: 0,
      color: '#00f0ff'
    };

    this.roadOffset = 0;
    this.speed = 5;
    this.distance = 0;
    this.score = 0;
    this.highScore = 0;

    this.traffic = [];
    this.collectibles = [];
    this.particles = [];

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.animFrameId = null;

    this.keyState = { left: false, right: false };
    this.lastSpawnTime = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.highScore = window.storage ? window.storage.getRacerBest() : 0;
    this.updateScoreUI();
    this.bindEvents();
    this.drawIntro();
  }

  bindEvents() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      const arena = document.getElementById('modal-racer');
      if (!arena || arena.classList.contains('hidden')) return;

      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        this.keyState.left = true;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        this.keyState.right = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keyState.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keyState.right = false;
    });

    // Touch / UI buttons
    const btnLeft = document.getElementById('racer-btn-left');
    const btnRight = document.getElementById('racer-btn-right');

    if (btnLeft) {
      btnLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); this.keyState.left = true; });
      btnLeft.addEventListener('pointerup', (e) => { e.preventDefault(); this.keyState.left = false; });
      btnLeft.addEventListener('pointerleave', (e) => { this.keyState.left = false; });
    }

    if (btnRight) {
      btnRight.addEventListener('pointerdown', (e) => { e.preventDefault(); this.keyState.right = true; });
      btnRight.addEventListener('pointerup', (e) => { e.preventDefault(); this.keyState.right = false; });
      btnRight.addEventListener('pointerleave', (e) => { this.keyState.right = false; });
    }

    // UI Buttons
    const startBtn = document.getElementById('racer-start-btn');
    if (startBtn) startBtn.addEventListener('click', () => this.start());

    const pauseBtn = document.getElementById('racer-pause-btn');
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());

    const overlayRestart = document.getElementById('racer-overlay-restart');
    if (overlayRestart) overlayRestart.addEventListener('click', () => this.start());
  }

  start() {
    cancelAnimationFrame(this.animFrameId);
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  reset() {
    this.player.x = this.width / 2;
    this.player.y = 440;
    this.speed = 5.5;
    this.distance = 0;
    this.score = 0;
    this.traffic = [];
    this.collectibles = [];
    this.particles = [];
    this.isGameOver = false;
    this.isPaused = false;
    this.lastSpawnTime = Date.now();

    this.highScore = window.storage ? window.storage.getRacerBest() : 0;
    this.updateScoreUI();
    this.hideOverlay();
  }

  togglePause() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('racer-pause-btn');
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
    }
    if (!this.isPaused) {
      this.loop();
    }
  }

  spawnTraffic() {
    const lanes = [75, 180, 285]; // 3 lanes
    const colors = ['#ff0055', '#ff9900', '#b026ff', '#00ff88'];
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];

    // Prevent traffic overlapping closely
    const tooClose = this.traffic.some(car => Math.abs(car.x - chosenLane) < 40 && car.y < 120);
    if (!tooClose) {
      this.traffic.push({
        x: chosenLane,
        y: -90,
        width: 42,
        height: 68,
        speed: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Occasional energy orb (collectible)
    if (Math.random() < 0.35) {
      const openLane = lanes[Math.floor(Math.random() * lanes.length)];
      this.collectibles.push({
        x: openLane,
        y: -60,
        radius: 12,
        pulse: 0
      });
    }
  }

  loop() {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.draw();

    if (!this.isGameOver) {
      this.animFrameId = requestAnimationFrame(() => this.loop());
    }
  }

  update() {
    // Player steering
    const moveSpeed = 5.2;
    if (this.keyState.left) this.player.x -= moveSpeed;
    if (this.keyState.right) this.player.x += moveSpeed;

    // Constrain to road boundaries (curbs at x=40 and x=320)
    const minX = 40 + this.player.width / 2;
    const maxX = (this.width - 40) - this.player.width / 2;
    this.player.x = Math.max(minX, Math.min(maxX, this.player.x));

    // Road scroll
    this.roadOffset = (this.roadOffset + this.speed) % 40;
    this.distance += Math.round(this.speed / 2);
    this.score = this.distance;

    // Gradual difficulty ramp up
    if (this.distance > 0 && this.distance % 500 === 0 && this.speed < 11) {
      this.speed += 0.4;
    }

    // Spawn traffic
    const now = Date.now();
    const spawnInterval = Math.max(800, 1600 - (this.speed * 80));
    if (now - this.lastSpawnTime > spawnInterval) {
      this.spawnTraffic();
      this.lastSpawnTime = now;
    }

    // Update traffic
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      car.y += this.speed - car.speed;

      // Near miss particle or passed
      if (car.y > this.height + 100) {
        this.traffic.splice(i, 1);
        continue;
      }

      // Check collision with player car
      if (this.checkCarCollision(this.player, car)) {
        this.crash();
        return;
      }
    }

    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.y += this.speed;
      item.pulse += 0.1;

      // Collect check
      const dist = Math.hypot(this.player.x - item.x, (this.player.y) - item.y);
      if (dist < 32) {
        this.score += 150;
        this.distance += 150;
        this.createSparks(item.x, item.y, '#ffd700', 16);
        if (window.sounds) window.sounds.playEat();
        this.collectibles.splice(i, 1);
        continue;
      }

      if (item.y > this.height + 50) {
        this.collectibles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Engine exhaust particles behind player
    if (Math.random() < 0.6) {
      this.particles.push({
        x: this.player.x - 10 + Math.random() * 20,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 3 + Math.random() * 2,
        color: '#00f0ff',
        life: 0.6
      });
    }

    this.updateScoreUI();
  }

  checkCarCollision(p, c) {
    // Snug bounding box for fair hitboxes
    const pLeft = p.x - p.width * 0.42;
    const pRight = p.x + p.width * 0.42;
    const pTop = p.y - p.height * 0.45;
    const pBottom = p.y + p.height * 0.45;

    const cLeft = c.x - c.width * 0.42;
    const cRight = c.x + c.width * 0.42;
    const cTop = c.y - c.height * 0.45;
    const cBottom = c.y + c.height * 0.45;

    return !(pLeft > cRight || pRight < cLeft || pTop > cBottom || pBottom < cTop);
  }

  crash() {
    this.isGameOver = true;
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);

    if (window.sounds) window.sounds.playCrash();
    this.createSparks(this.player.x, this.player.y, '#ff0055', 30);
    this.draw(); // draw final collision frame

    let isNewHigh = false;
    if (window.storage) {
      isNewHigh = window.storage.saveRacerScore(this.score);
      this.highScore = window.storage.getRacerBest();
    }

    this.updateScoreUI();
    this.showOverlay(isNewHigh);
  }

  createSparks(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 1.0
      });
    }
  }

  updateScoreUI() {
    const curElem = document.getElementById('racer-score');
    const bestElem = document.getElementById('racer-high-score');
    const spdElem = document.getElementById('racer-speed');

    if (curElem) curElem.textContent = `${this.score}m`;
    if (bestElem) bestElem.textContent = `${this.highScore}m`;
    if (spdElem) spdElem.textContent = `${Math.round(this.speed * 18)} km/h`;
  }

  showOverlay(isNewHigh) {
    const overlay = document.getElementById('racer-overlay');
    const title = document.getElementById('racer-overlay-title');
    const scoreVal = document.getElementById('racer-overlay-score');
    const badge = document.getElementById('racer-overlay-badge');

    if (overlay) overlay.classList.remove('hidden');
    if (title) title.textContent = isNewHigh ? '🏆 RECORD BROKEN!' : '💥 ROAD CRASH';
    if (scoreVal) scoreVal.textContent = `${this.score} METERS`;
    if (badge) {
      badge.textContent = isNewHigh ? 'NEW ALL-TIME RECORD!' : `Personal Best: ${this.highScore}m`;
      badge.className = isNewHigh ? 'stat-badge gold' : 'stat-badge';
    }
  }

  hideOverlay() {
    const overlay = document.getElementById('racer-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background (Dark Cyber City)
    ctx.fillStyle = '#070913';
    ctx.fillRect(0, 0, w, h);

    // Road asphalt
    ctx.fillStyle = '#0f1224';
    ctx.fillRect(30, 0, w - 60, h);

    // Road side neon borders
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(30, h);
    ctx.moveTo(w - 30, 0); ctx.lineTo(w - 30, h);
    ctx.stroke();
    ctx.restore();

    // Road lane markings (scrolling dashes)
    ctx.save();
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -this.roadOffset;

    // Lane divider 1
    ctx.beginPath();
    ctx.moveTo(130, 0); ctx.lineTo(130, h);
    ctx.stroke();

    // Lane divider 2
    ctx.beginPath();
    ctx.moveTo(230, 0); ctx.lineTo(230, h);
    ctx.stroke();
    ctx.restore();

    // Draw Collectible Orbs
    this.collectibles.forEach(item => {
      ctx.save();
      const glow = Math.sin(item.pulse) * 4 + 10;
      ctx.shadowBlur = glow;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.fill();

      // Energy icon inside
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', item.x, item.y);
      ctx.restore();
    });

    // Draw Traffic Cars
    this.traffic.forEach(car => {
      this.drawCar(car.x, car.y, car.width, car.height, car.color, true);
    });

    // Draw Player Car
    this.drawCar(this.player.x, this.player.y, this.player.width, this.player.height, this.player.color, false);

    // Draw Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawCar(cx, cy, cw, ch, mainColor, isOpponent) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);

    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-cw / 2, -ch / 2 + 5, cw, ch);

    // Car Body
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = mainColor;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 8);
    ctx.fill();
    ctx.restore();

    // Dark windshield / cockpit
    ctx.fillStyle = '#060814';
    const windY = isOpponent ? -ch * 0.1 : -ch * 0.2;
    ctx.beginPath();
    ctx.roundRect(-cw * 0.35, windY, cw * 0.7, ch * 0.35, 4);
    ctx.fill();

    // Cyber roof stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-2, -ch * 0.38, 4, ch * 0.76);

    // Headlights & Taillights
    if (isOpponent) {
      // Opponent driving down: Headlights at bottom, red taillights at top
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(-cw / 2 + 4, -ch / 2, 8, 4);
      ctx.fillRect(cw / 2 - 12, -ch / 2, 8, 4);

      ctx.fillStyle = '#ffff66';
      ctx.fillRect(-cw / 2 + 4, ch / 2 - 4, 8, 4);
      ctx.fillRect(cw / 2 - 12, ch / 2 - 4, 8, 4);
    } else {
      // Player driving UP: Bright cyan headlights at top
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f0ff';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-cw / 2 + 4, -ch / 2, 8, 4);
      ctx.fillRect(cw / 2 - 12, -ch / 2, 8, 4);
      ctx.restore();

      // Taillights at bottom (neon magenta)
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-cw / 2 + 4, ch / 2 - 4, 8, 4);
      ctx.fillRect(cw / 2 - 12, ch / 2 - 4, 8, 4);
    }

    ctx.restore();
  }

  drawIntro() {
    this.draw();
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(7, 9, 19, 0.65)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = 'bold 20px "Orbitron", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HYPER DASH 2D', this.width / 2, this.height / 2 - 20);

    this.ctx.fillStyle = '#b026ff';
    this.ctx.font = '13px "Inter", sans-serif';
    this.ctx.fillText('Press "Start Highway" to race!', this.width / 2, this.height / 2 + 15);
  }
}

window.RacerGame = RacerGame;

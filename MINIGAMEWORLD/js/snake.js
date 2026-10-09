/**
 * Chetan GameVerse - Snake Challenge
 * Premium Cyberpunk Neon Snake with WASD/Arrow Controls, Touch/Swipe,
 * Dynamic Speed Scaling, Particle FX, and Local Record Persistence.
 */

class SnakeGame {
  constructor() {
    this.canvas = document.getElementById('snake-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.gridSize = 20;   // 20px per grid cell
    this.tileCount = 20;  // 20x20 tile grid (400x400 canvas)

    // Snake segments {x, y}
    this.snake = [];
    this.dx = 1;
    this.dy = 0;
    this.inputQueue = []; // Direction queue for responsive turning

    // Food object {x, y, isBonus, pulse}
    this.food = { x: 15, y: 10, isBonus: false };
    this.bonusTimer = 0;
    this.score = 0;
    this.highScore = 0;
    this.gameLoop = null;
    this.animFrameId = null;

    // Speeds (ms per tick)
    this.baseSpeed = 120;
    this.currentSpeed = 120;
    this.minSpeed = 55;

    // States
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;

    // Visual FX
    this.particles = [];
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;

    // Ensure internal resolution is 400x400
    this.canvas.width = 400;
    this.canvas.height = 400;

    // Read stored best score
    this.highScore = window.storage ? window.storage.getSnakeBest() : 0;
    this.updateScoreUI();

    this.setupListeners();
    this.setupTouchControls();
    this.reset();
  }

  /* ==========================================================================
     CONTROLS & EVENT LISTENERS (Keyboard, D-Pad, Canvas Swipe)
     ========================================================================== */
  setupListeners() {
    // Keyboard Controls: Arrow Keys + WASD + Space (Pause) + Enter (Restart)
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modal-snake');
      // Only process input if Snake arena is active/visible
      if (!modal || modal.classList.contains('hidden')) return;

      const key = (e.key || '').toLowerCase();
      const code = e.code || '';

      // Prevent window scrolling on arrow keys & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) ||
          ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }

      // Spacebar toggles pause or restarts on game over
      if (code === 'Space' || key === ' ') {
        if (this.isGameOver) {
          this.start();
        } else {
          this.togglePause();
        }
        return;
      }

      // Enter key restarts if game over
      if (code === 'Enter' || key === 'enter') {
        if (this.isGameOver) {
          this.start();
          return;
        }
      }

      // 'R' key restarts
      if (code === 'KeyR' || key === 'r') {
        this.start();
        return;
      }

      // Direction inputs (Arrow Keys & WASD)
      if (code === 'ArrowUp' || code === 'KeyW' || key === 'arrowup' || key === 'w') {
        this.queueDirection(0, -1);
      } else if (code === 'ArrowDown' || code === 'KeyS' || key === 'arrowdown' || key === 's') {
        this.queueDirection(0, 1);
      } else if (code === 'ArrowLeft' || code === 'KeyA' || key === 'arrowleft' || key === 'a') {
        this.queueDirection(-1, 0);
      } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'arrowright' || key === 'd') {
        this.queueDirection(1, 0);
      }
    });

    // Touch / Virtual D-Pad Buttons
    const dpadMap = [
      { id: 'snake-btn-up', dx: 0, dy: -1 },
      { id: 'snake-btn-down', dx: 0, dy: 1 },
      { id: 'snake-btn-left', dx: -1, dy: 0 },
      { id: 'snake-btn-right', dx: 1, dy: 0 }
    ];

    dpadMap.forEach(({ id, dx, dy }) => {
      const btn = document.getElementById(id);
      if (btn) {
        // Use pointerdown for 0ms instantaneous mobile response
        const handleDpadPress = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.queueDirection(dx, dy);
        };
        btn.addEventListener('pointerdown', handleDpadPress);
        btn.addEventListener('click', (e) => e.preventDefault());
      }
    });

    // HUD Action Buttons (Pause & Restart)
    const restartBtn = document.getElementById('snake-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.start());
    }

    const pauseBtn = document.getElementById('snake-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }

    // Game Over Overlay Restart Button
    const overlayRestart = document.getElementById('snake-overlay-restart');
    if (overlayRestart) {
      overlayRestart.addEventListener('click', () => this.start());
    }
  }

  setupTouchControls() {
    if (!this.canvas) return;

    // Canvas swipe gesture controls for mobile players
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isRunning || this.isPaused || this.isGameOver) return;
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - this.touchStartX;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        const minSwipeDist = 24;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > minSwipeDist) {
            this.queueDirection(1, 0); // Right
          } else if (deltaX < -minSwipeDist) {
            this.queueDirection(-1, 0); // Left
          }
        } else {
          // Vertical swipe
          if (deltaY > minSwipeDist) {
            this.queueDirection(0, 1); // Down
          } else if (deltaY < -minSwipeDist) {
            this.queueDirection(0, -1); // Up
          }
        }
      }
    }, { passive: true });
  }

  /**
   * Enqueue a new direction into the input buffer.
   * Prevents instant reverse suicide and ensures rapid cornering turns are never dropped.
   */
  queueDirection(newDx, newDy) {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    // Check against the last queued direction or current direction
    const last = this.inputQueue.length > 0
      ? this.inputQueue[this.inputQueue.length - 1]
      : { dx: this.dx, dy: this.dy };

    // Prevent 180° reverse direction into self
    if (newDx !== -last.dx && newDy !== -last.dy) {
      // Disallow redundant direction duplicate
      if (newDx !== last.dx || newDy !== last.dy) {
        if (this.inputQueue.length < 2) {
          this.inputQueue.push({ dx: newDx, dy: newDy });
          if (window.sounds) window.sounds.playMove();
        }
      }
    }
  }

  /* ==========================================================================
     GAME LIFECYCLE (Reset, Start, Pause, Game Over)
     ========================================================================== */
  reset() {
    // Initial 3-segment snake starting horizontally
    this.snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];

    this.dx = 1;
    this.dy = 0;
    this.inputQueue = [];

    this.score = 0;
    this.currentSpeed = this.baseSpeed;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRunning = false;
    this.particles = [];

    this.spawnFood();
    this.updateScoreUI();
    this.hideOverlay();
    this.updatePauseBtnText();
    this.draw();
  }

  start() {
    clearInterval(this.gameLoop);
    this.reset();
    this.isRunning = true;
    this.gameLoop = setInterval(() => this.tick(), this.currentSpeed);
  }

  togglePause() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.updatePauseBtnText();

    if (this.isPaused) {
      clearInterval(this.gameLoop);
      this.draw();
      this.drawPauseScreen();
    } else {
      this.gameLoop = setInterval(() => this.tick(), this.currentSpeed);
    }
  }

  updatePauseBtnText() {
    const pauseBtn = document.getElementById('snake-pause-btn');
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
    }
  }

  /* ==========================================================================
     FOOD GENERATION (Safe, collision-free coordinate picker)
     ========================================================================== */
  spawnFood() {
    // Build set of occupied snake coordinates
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    const emptyCells = [];

    for (let x = 0; x < this.tileCount; x++) {
      for (let y = 0; y < this.tileCount; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      // Board completely filled! Player wins!
      this.gameOver(true);
      return;
    }

    const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    // 22% chance of spawning a rare golden bonus crystal once score >= 20
    const isBonus = this.score >= 20 && Math.random() < 0.22;

    this.food = {
      x: chosen.x,
      y: chosen.y,
      isBonus: isBonus
    };
  }

  /* ==========================================================================
     TICK & COLLISION DETECTION
     ========================================================================== */
  tick() {
    if (this.isPaused || this.isGameOver || !this.isRunning) return;

    // Dequeue next queued direction if available
    if (this.inputQueue.length > 0) {
      const nextDir = this.inputQueue.shift();
      this.dx = nextDir.dx;
      this.dy = nextDir.dy;
    }

    // New prospective head position
    const head = {
      x: this.snake[0].x + this.dx,
      y: this.snake[0].y + this.dy
    };

    // 1. Wall Collision Detection
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.createCollisionBurst(this.snake[0].x, this.snake[0].y);
      this.gameOver();
      return;
    }

    // 2. Self Collision Detection
    // Check against current body segments (tail moves forward unless food is eaten)
    const isEatingFood = (head.x === this.food.x && head.y === this.food.y);
    const bodyToCheck = isEatingFood ? this.snake : this.snake.slice(0, -1);

    if (bodyToCheck.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.createCollisionBurst(this.snake[0].x, this.snake[0].y);
      this.gameOver();
      return;
    }

    // Advance snake head
    this.snake.unshift(head);

    // 3. Food Consumption
    if (isEatingFood) {
      const pts = this.food.isBonus ? 30 : 10;
      this.score += pts;

      // Burst of glowing cyber sparks
      this.createBurst(this.food.x, this.food.y, this.food.isBonus ? '#ffd700' : '#00f0ff');

      if (window.sounds) {
        if (this.food.isBonus) {
          window.sounds.playScore();
        } else {
          window.sounds.playEat();
        }
      }

      // Dynamic Speed Progression: increase speed every 30 points
      if (this.score % 30 === 0 && this.currentSpeed > this.minSpeed) {
        this.currentSpeed = Math.max(this.minSpeed, this.currentSpeed - 6);
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.tick(), this.currentSpeed);
      }

      this.spawnFood();
      this.updateScoreUI();
    } else {
      // Remove tail
      this.snake.pop();
    }

    this.draw();
  }

  gameOver(isVictory = false) {
    this.isGameOver = true;
    this.isRunning = false;
    clearInterval(this.gameLoop);

    if (window.sounds) {
      if (isVictory) {
        window.sounds.playWin();
      } else {
        window.sounds.playGameOver();
      }
    }

    // Persist score locally
    let isNewHigh = false;
    if (window.storage) {
      isNewHigh = window.storage.saveSnakeScore(this.score);
      this.highScore = window.storage.getSnakeBest();
    }

    this.updateScoreUI();
    this.showOverlay(isNewHigh, isVictory);
  }

  /* ==========================================================================
     UI & OVERLAY
     ========================================================================== */
  updateScoreUI() {
    const curElem = document.getElementById('snake-score');
    const bestElem = document.getElementById('snake-high-score');
    if (curElem) curElem.textContent = this.score;
    if (bestElem) bestElem.textContent = this.highScore;
  }

  showOverlay(isNewHigh, isVictory = false) {
    const overlay = document.getElementById('snake-overlay');
    const title = document.getElementById('snake-overlay-title');
    const scoreVal = document.getElementById('snake-overlay-score');
    const badge = document.getElementById('snake-overlay-badge');

    if (overlay) overlay.classList.remove('hidden');

    if (title) {
      if (isVictory) {
        title.textContent = '🌟 MATRIX CLEARED!';
      } else if (isNewHigh) {
        title.textContent = '🏆 NEW HIGH SCORE!';
      } else {
        title.textContent = '💥 GAME OVER';
      }
    }

    if (scoreVal) scoreVal.textContent = this.score;

    if (badge) {
      if (isNewHigh) {
        badge.textContent = 'NEW PERSONAL BEST SAVED!';
        badge.className = 'stat-badge gold';
      } else {
        badge.textContent = `All-Time Best: ${this.highScore} pts`;
        badge.className = 'stat-badge';
      }
    }
  }

  hideOverlay() {
    const overlay = document.getElementById('snake-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  /* ==========================================================================
     VISUAL EFFECTS & RENDERING (Dark Neon Cyberpunk Theme)
     ========================================================================== */
  createBurst(x, y, color) {
    const px = (x + 0.5) * this.gridSize;
    const py = (y + 0.5) * this.gridSize;
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 / 14) * i;
      const speed = Math.random() * 2.5 + 1.2;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.04
      });
    }
  }

  createCollisionBurst(x, y) {
    const px = (x + 0.5) * this.gridSize;
    const py = (y + 0.5) * this.gridSize;
    const colors = ['#00f0ff', '#ff007f', '#b026ff', '#ffffff'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.5;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  draw() {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Deep Cyber Navy Background
    this.ctx.fillStyle = '#060a1f';
    this.ctx.fillRect(0, 0, w, h);

    // 2. Subtle Coordinate Grid Lines
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y <= h; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // 3. Draw Food (Cyan Energy Orb or Golden Power Core)
    const fx = this.food.x * this.gridSize;
    const fy = this.food.y * this.gridSize;
    const foodCenter = this.gridSize / 2;

    this.ctx.save();
    if (this.food.isBonus) {
      // Golden Power Core with Pulsing Halo
      this.ctx.shadowBlur = 18;
      this.ctx.shadowColor = '#ffd700';

      // Outer glow ring
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(fx + foodCenter, fy + foodCenter, foodCenter + 1, 0, Math.PI * 2);
      this.ctx.stroke();

      // Golden diamond core
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.moveTo(fx + foodCenter, fy + 2);
      this.ctx.lineTo(fx + this.gridSize - 2, fy + foodCenter);
      this.ctx.lineTo(fx + foodCenter, fy + this.gridSize - 2);
      this.ctx.lineTo(fx + 2, fy + foodCenter);
      this.ctx.closePath();
      this.ctx.fill();

      // White inner glint
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(fx + foodCenter, fy + foodCenter, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Cyan Energy Orb with Electric Halo
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.beginPath();
      this.ctx.arc(fx + foodCenter, fy + foodCenter, foodCenter - 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner specular light highlight
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(fx + foodCenter - 2, fy + foodCenter - 2, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 4. Draw Snake Body & Cyber Head
    const len = this.snake.length;
    this.snake.forEach((seg, index) => {
      const sx = seg.x * this.gridSize;
      const sy = seg.y * this.gridSize;

      this.ctx.save();
      if (index === 0) {
        // Neon Cyan Cyber Helmet Head
        this.ctx.shadowBlur = 16;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.beginPath();
        this.ctx.roundRect(sx + 1, sy + 1, this.gridSize - 2, this.gridSize - 2, 6);
        this.ctx.fill();

        // Cyber Visor / Eye Sensors
        this.ctx.fillStyle = '#040718';
        const eyeOffset = 4;
        if (this.dx === 1) { // Moving Right
          this.ctx.fillRect(sx + 12, sy + eyeOffset, 3, 3);
          this.ctx.fillRect(sx + 12, sy + this.gridSize - eyeOffset - 3, 3, 3);
        } else if (this.dx === -1) { // Moving Left
          this.ctx.fillRect(sx + 5, sy + eyeOffset, 3, 3);
          this.ctx.fillRect(sx + 5, sy + this.gridSize - eyeOffset - 3, 3, 3);
        } else if (this.dy === 1) { // Moving Down
          this.ctx.fillRect(sx + eyeOffset, sy + 12, 3, 3);
          this.ctx.fillRect(sx + this.gridSize - eyeOffset - 3, sy + 12, 3, 3);
        } else { // Moving Up
          this.ctx.fillRect(sx + eyeOffset, sy + 5, 3, 3);
          this.ctx.fillRect(sx + this.gridSize - eyeOffset - 3, sy + 5, 3, 3);
        }
      } else {
        // Body Segments: Gradient purple into neon magenta towards the tail
        const progress = index / len;
        const alpha = Math.max(0.55, 1 - progress * 0.4);

        this.ctx.shadowBlur = 9;
        this.ctx.shadowColor = 'rgba(176, 38, 255, 0.7)';

        // Dual-tone color shift (electric purple to neon pink)
        this.ctx.fillStyle = index % 2 === 0
          ? `rgba(176, 38, 255, ${alpha})`
          : `rgba(215, 38, 255, ${alpha})`;

        this.ctx.beginPath();
        this.ctx.roundRect(sx + 2, sy + 2, this.gridSize - 4, this.gridSize - 4, 4);
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    // 5. Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        this.ctx.save();
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  drawPauseScreen() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(5, 9, 26, 0.75)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = 'bold 24px "Orbitron", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 5);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#b026ff';
    this.ctx.font = '700 13px "Rajdhani", sans-serif';
    this.ctx.letterSpacing = '1px';
    this.ctx.fillText('PRESS SPACE OR CLICK RESUME', this.canvas.width / 2, this.canvas.height / 2 + 28);
  }
}

// Global Export
window.SnakeGame = SnakeGame;

/**
 * Chetan GameVerse - Neon Memory Match
 * 16-card 3D flip card memory game with timer, move counter, and record tracking.
 */

class MemoryGame {
  constructor() {
    this.icons = ['⚡', '🚀', '💎', '👾', '🤖', '🛡️', '🎮', '🔮'];
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 8;
    this.moves = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.isLocked = false;
    this.hasStarted = false;

    this.init();
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.updateStatsUI();
    this.reset();
  }

  cacheDom() {
    this.grid = document.getElementById('memory-grid');
    this.movesDisplay = document.getElementById('memory-moves');
    this.timeDisplay = document.getElementById('memory-time');
    this.bestDisplay = document.getElementById('memory-best');
    this.restartBtn = document.getElementById('memory-restart-btn');
    this.overlay = document.getElementById('memory-overlay');
    this.overlayTitle = document.getElementById('memory-overlay-title');
    this.overlayStats = document.getElementById('memory-overlay-stats');
    this.overlayStars = document.getElementById('memory-overlay-stars');
    this.overlayRestart = document.getElementById('memory-overlay-restart');
  }

  bindEvents() {
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.reset());
    }
    if (this.overlayRestart) {
      this.overlayRestart.addEventListener('click', () => this.reset());
    }
  }

  reset() {
    this.stopTimer();
    this.timer = 0;
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.isLocked = false;
    this.hasStarted = false;

    this.updateStatsUI();
    this.hideOverlay();
    this.generateCards();
  }

  startTimer() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.updateTimeDisplay();
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  updateTimeDisplay() {
    if (!this.timeDisplay) return;
    const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
    const secs = (this.timer % 60).toString().padStart(2, '0');
    this.timeDisplay.textContent = `${mins}:${secs}`;
  }

  updateStatsUI() {
    if (this.movesDisplay) this.movesDisplay.textContent = this.moves;
    this.updateTimeDisplay();

    if (this.bestDisplay && window.storage) {
      const best = window.storage.getMemoryBest();
      if (best.bestMoves !== null) {
        this.bestDisplay.textContent = `${best.bestMoves} moves (${best.bestTime}s)`;
      } else {
        this.bestDisplay.textContent = '--';
      }
    }
  }

  generateCards() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    // Create 8 duplicate pairs and shuffle
    const deck = [...this.icons, ...this.icons];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.cards = deck.map((icon, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.dataset.index = idx;
      cardEl.dataset.icon = icon;

      cardEl.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <span class="cyber-chip">✦</span>
          </div>
          <div class="card-back">
            <span class="card-symbol">${icon}</span>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => this.handleCardClick(cardEl, icon));
      this.grid.appendChild(cardEl);
      return cardEl;
    });
  }

  handleCardClick(cardEl, icon) {
    if (this.isLocked) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    if (!this.hasStarted) {
      this.startTimer();
    }

    // Flip card
    cardEl.classList.add('flipped');
    if (window.sounds) window.sounds.playClick();
    this.flippedCards.push({ cardEl, icon });

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateStatsUI();
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLocked = true;
    const [card1, card2] = this.flippedCards;

    if (card1.icon === card2.icon) {
      // It's a match!
      setTimeout(() => {
        card1.cardEl.classList.add('matched');
        card2.cardEl.classList.add('matched');
        if (window.sounds) window.sounds.playMatch();
        this.matchedPairs++;
        this.flippedCards = [];
        this.isLocked = false;

        if (this.matchedPairs === this.totalPairs) {
          this.handleVictory();
        }
      }, 350);
    } else {
      // No match, flip back
      setTimeout(() => {
        card1.cardEl.classList.remove('flipped');
        card2.cardEl.classList.remove('flipped');
        this.flippedCards = [];
        this.isLocked = false;
      }, 900);
    }
  }

  handleVictory() {
    this.stopTimer();
    if (window.sounds) window.sounds.playWin();

    let isNewRecord = false;
    if (window.storage) {
      isNewRecord = window.storage.saveMemoryScore(this.moves, this.timer);
    }

    let stars = '⭐⭐⭐';
    if (this.moves > 18) stars = '⭐';
    else if (this.moves > 13) stars = '⭐⭐';

    if (this.overlayTitle) {
      this.overlayTitle.textContent = isNewRecord ? '🏆 NEW RECORD RECORDED!' : '🎉 MEMORY MATRIX CLEARED!';
    }
    if (this.overlayStats) {
      this.overlayStats.textContent = `Completed in ${this.moves} moves and ${this.timer} seconds!`;
    }
    if (this.overlayStars) {
      this.overlayStars.textContent = stars;
    }

    this.showOverlay();
    this.updateStatsUI();
  }

  showOverlay() {
    if (this.overlay) this.overlay.classList.remove('hidden');
  }

  hideOverlay() {
    if (this.overlay) this.overlay.classList.add('hidden');
  }
}

window.MemoryGame = MemoryGame;

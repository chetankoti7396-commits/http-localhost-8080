/**
 * Chetan GameVerse - Cyber Tic-Tac-Toe
 * Single Player (Smart AI) & Local 2-Player modes with glowing neon aesthetics.
 */

class TicTacToeGame {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X'; // X starts
    this.gameMode = 'ai'; // 'ai' or 'pvp'
    this.aiDifficulty = 'smart'; // 'smart' or 'easy'
    this.isGameOver = false;
    this.isAiThinking = false;

    this.winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    this.init();
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.updateStatsUI();
    this.render();
  }

  cacheDom() {
    this.cells = document.querySelectorAll('.ttt-cell');
    this.statusText = document.getElementById('ttt-status');
    this.modeSelect = document.getElementById('ttt-mode-select');
    this.restartBtn = document.getElementById('ttt-restart-btn');
    this.scoreWins = document.getElementById('ttt-score-wins');
    this.scoreLosses = document.getElementById('ttt-score-losses');
    this.scoreDraws = document.getElementById('ttt-score-draws');
    this.winOverlay = document.getElementById('ttt-overlay');
    this.winTitle = document.getElementById('ttt-overlay-title');
    this.winSubtitle = document.getElementById('ttt-overlay-sub');
    this.overlayRestart = document.getElementById('ttt-overlay-restart');
  }

  bindEvents() {
    if (this.cells) {
      this.cells.forEach(cell => {
        cell.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index, 10);
          this.handleCellClick(index);
        });
      });
    }

    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', (e) => {
        this.gameMode = e.target.value;
        this.resetGame();
      });
    }

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.resetGame());
    }

    if (this.overlayRestart) {
      this.overlayRestart.addEventListener('click', () => this.resetGame());
    }
  }

  handleCellClick(index) {
    if (this.isGameOver || this.isAiThinking || this.board[index]) return;

    this.makeMove(index, this.currentPlayer);

    if (this.checkGameStatus()) return;

    if (this.gameMode === 'ai' && this.currentPlayer === 'O') {
      this.isAiThinking = true;
      if (this.statusText) this.statusText.textContent = 'Cyber AI is thinking...';

      setTimeout(() => {
        this.makeAiMove();
        this.isAiThinking = false;
        this.checkGameStatus();
      }, 400);
    }
  }

  makeMove(index, player) {
    this.board[index] = player;
    if (window.sounds) window.sounds.playClick();
    this.currentPlayer = player === 'X' ? 'O' : 'X';
    this.render();
  }

  makeAiMove() {
    if (this.isGameOver) return;
    let chosenIndex;

    // Check if AI can win immediately
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = 'O';
        if (this.checkWin('O')) {
          this.board[i] = null;
          chosenIndex = i;
          break;
        }
        this.board[i] = null;
      }
    }

    // Check if AI needs to block player X
    if (chosenIndex === undefined) {
      for (let i = 0; i < 9; i++) {
        if (!this.board[i]) {
          this.board[i] = 'X';
          if (this.checkWin('X')) {
            this.board[i] = null;
            chosenIndex = i;
            break;
          }
          this.board[i] = null;
        }
      }
    }

    // Smart heuristic: take center
    if (chosenIndex === undefined && !this.board[4]) {
      chosenIndex = 4;
    }

    // Smart heuristic: take corners
    if (chosenIndex === undefined) {
      const corners = [0, 2, 6, 8].filter(i => !this.board[i]);
      if (corners.length > 0) {
        chosenIndex = corners[Math.floor(Math.random() * corners.length)];
      }
    }

    // Fallback: take any open space
    if (chosenIndex === undefined) {
      const open = [];
      this.board.forEach((v, i) => { if (!v) open.push(i); });
      if (open.length > 0) {
        chosenIndex = open[Math.floor(Math.random() * open.length)];
      }
    }

    if (chosenIndex !== undefined) {
      this.makeMove(chosenIndex, 'O');
    }
  }

  checkWin(player) {
    return this.winPatterns.some(pattern =>
      pattern.every(index => this.board[index] === player)
    );
  }

  getWinningPattern(player) {
    return this.winPatterns.find(pattern =>
      pattern.every(index => this.board[index] === player)
    );
  }

  checkGameStatus() {
    // Check if X won
    const xPattern = this.getWinningPattern('X');
    if (xPattern) {
      this.endGame('X', xPattern);
      return true;
    }

    // Check if O won
    const oPattern = this.getWinningPattern('O');
    if (oPattern) {
      this.endGame('O', oPattern);
      return true;
    }

    // Check draw
    if (this.board.every(cell => cell !== null)) {
      this.endGame('draw');
      return true;
    }

    // Update status text for next turn
    if (this.statusText) {
      if (this.gameMode === 'ai') {
        this.statusText.textContent = this.currentPlayer === 'X' ? 'Your Turn (X)' : 'Cyber AI Turn (O)';
      } else {
        this.statusText.textContent = `Player ${this.currentPlayer}'s Turn`;
      }
    }
    return false;
  }

  endGame(winner, pattern = null) {
    this.isGameOver = true;

    if (pattern && this.cells) {
      pattern.forEach(idx => {
        this.cells[idx].classList.add('win-cell');
      });
    }

    if (winner === 'draw') {
      if (window.sounds) window.sounds.playScore();
      if (window.storage) window.storage.recordTTTResult('draw');
      this.showOverlay('STALEMATE!', 'A battle of equal minds. No winner this round.');
    } else if (winner === 'X') {
      if (window.sounds) window.sounds.playWin();
      if (window.storage) window.storage.recordTTTResult('win');
      const text = this.gameMode === 'ai' ? 'You breached the Cyber AI!' : 'Player X reigns victorious!';
      this.showOverlay('VICTORY!', text);
    } else {
      if (this.gameMode === 'ai') {
        if (window.sounds) window.sounds.playGameOver();
        if (window.storage) window.storage.recordTTTResult('loss');
        this.showOverlay('DEFEATED', 'The Cyber AI anticipated every move.');
      } else {
        if (window.sounds) window.sounds.playWin();
        this.showOverlay('VICTORY!', 'Player O reigns victorious!');
      }
    }

    this.updateStatsUI();
  }

  showOverlay(title, subtitle) {
    if (this.winOverlay) this.winOverlay.classList.remove('hidden');
    if (this.winTitle) this.winTitle.textContent = title;
    if (this.winSubtitle) this.winSubtitle.textContent = subtitle;
  }

  hideOverlay() {
    if (this.winOverlay) this.winOverlay.classList.add('hidden');
  }

  updateStatsUI() {
    if (!window.storage) return;
    const stats = window.storage.getTTTStats();
    if (this.scoreWins) this.scoreWins.textContent = stats.wins;
    if (this.scoreLosses) this.scoreLosses.textContent = stats.losses;
    if (this.scoreDraws) this.scoreDraws.textContent = stats.draws;
  }

  render() {
    if (!this.cells) return;
    this.cells.forEach((cell, i) => {
      cell.classList.remove('x', 'o');
      const val = this.board[i];
      if (val === 'X') {
        cell.textContent = '✕';
        cell.classList.add('x');
      } else if (val === 'O') {
        cell.textContent = '○';
        cell.classList.add('o');
      } else {
        cell.textContent = '';
      }
    });

    if (!this.isGameOver && this.statusText) {
      if (this.gameMode === 'ai') {
        this.statusText.textContent = this.currentPlayer === 'X' ? 'Your Turn (X)' : 'Cyber AI Turn (O)';
      } else {
        this.statusText.textContent = `Player ${this.currentPlayer}'s Turn`;
      }
    }
  }

  resetGame() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.isGameOver = false;
    this.isAiThinking = false;

    if (this.cells) {
      this.cells.forEach(cell => {
        cell.classList.remove('win-cell', 'x', 'o');
        cell.textContent = '';
      });
    }

    this.hideOverlay();
    this.render();
  }
}

window.TicTacToeGame = TicTacToeGame;

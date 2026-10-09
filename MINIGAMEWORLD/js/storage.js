/**
 * Chetan GameVerse - LocalStorage Manager
 * Persists personal best scores and statistics across browser sessions.
 */

const STORAGE_KEYS = {
  SNAKE_BEST: 'mgw_snake_best',
  SNAKE_GAMES: 'mgw_snake_games',
  TTT_WINS: 'mgw_ttt_wins',
  TTT_LOSSES: 'mgw_ttt_losses',
  TTT_DRAWS: 'mgw_ttt_draws',
  MEMORY_BEST_MOVES: 'mgw_memory_best_moves',
  MEMORY_BEST_TIME: 'mgw_memory_best_time',
  RACER_BEST: 'mgw_racer_best',
  RACER_GAMES: 'mgw_racer_games'
};

class StorageManager {
  // Snake
  getSnakeBest() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.SNAKE_BEST) || '0', 10);
  }

  saveSnakeScore(score) {
    const current = this.getSnakeBest();
    const games = parseInt(localStorage.getItem(STORAGE_KEYS.SNAKE_GAMES) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEYS.SNAKE_GAMES, games);

    if (score > current) {
      localStorage.setItem(STORAGE_KEYS.SNAKE_BEST, score);
      this.notifyUpdate();
      return true; // New record
    }
    return false;
  }

  // Tic-Tac-Toe
  getTTTStats() {
    return {
      wins: parseInt(localStorage.getItem(STORAGE_KEYS.TTT_WINS) || '0', 10),
      losses: parseInt(localStorage.getItem(STORAGE_KEYS.TTT_LOSSES) || '0', 10),
      draws: parseInt(localStorage.getItem(STORAGE_KEYS.TTT_DRAWS) || '0', 10)
    };
  }

  recordTTTResult(result) {
    // result: 'win', 'loss', 'draw'
    if (result === 'win') {
      const wins = parseInt(localStorage.getItem(STORAGE_KEYS.TTT_WINS) || '0', 10) + 1;
      localStorage.setItem(STORAGE_KEYS.TTT_WINS, wins);
    } else if (result === 'loss') {
      const losses = parseInt(localStorage.getItem(STORAGE_KEYS.TTT_LOSSES) || '0', 10) + 1;
      localStorage.setItem(STORAGE_KEYS.TTT_LOSSES, losses);
    } else if (result === 'draw') {
      const draws = parseInt(localStorage.getItem(STORAGE_KEYS.TTT_DRAWS) || '0', 10) + 1;
      localStorage.setItem(STORAGE_KEYS.TTT_DRAWS, draws);
    }
    this.notifyUpdate();
  }

  // Memory Match
  getMemoryBest() {
    const moves = localStorage.getItem(STORAGE_KEYS.MEMORY_BEST_MOVES);
    const time = localStorage.getItem(STORAGE_KEYS.MEMORY_BEST_TIME);
    return {
      bestMoves: moves !== null ? parseInt(moves, 10) : null,
      bestTime: time !== null ? parseInt(time, 10) : null
    };
  }

  saveMemoryScore(moves, timeSeconds) {
    const current = this.getMemoryBest();
    let isNewRecord = false;

    if (current.bestMoves === null || moves < current.bestMoves) {
      localStorage.setItem(STORAGE_KEYS.MEMORY_BEST_MOVES, moves);
      isNewRecord = true;
    }

    if (current.bestTime === null || timeSeconds < current.bestTime) {
      localStorage.setItem(STORAGE_KEYS.MEMORY_BEST_TIME, timeSeconds);
      isNewRecord = true;
    }

    if (isNewRecord) this.notifyUpdate();
    return isNewRecord;
  }

  // 2D Racer
  getRacerBest() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.RACER_BEST) || '0', 10);
  }

  saveRacerScore(score) {
    const current = this.getRacerBest();
    const games = parseInt(localStorage.getItem(STORAGE_KEYS.RACER_GAMES) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEYS.RACER_GAMES, games);

    if (score > current) {
      localStorage.setItem(STORAGE_KEYS.RACER_BEST, score);
      this.notifyUpdate();
      return true; // New record
    }
    return false;
  }

  // Leaderboard data compiler
  getLeaderboardData() {
    const snakeScore = this.getSnakeBest();
    const ttt = this.getTTTStats();
    const mem = this.getMemoryBest();
    const racerScore = this.getRacerBest();

    return [
      {
        id: 'snake',
        name: 'Snake Challenge',
        category: 'Arcade Classic',
        record: snakeScore > 0 ? `${snakeScore} pts` : 'No games played yet',
        numericScore: snakeScore,
        badge: snakeScore >= 200 ? 'CYBER MASTER' : (snakeScore >= 100 ? 'PRO PILOT' : (snakeScore > 0 ? 'CHALLENGER' : 'ROOKIE')),
        icon: '🐍'
      },
      {
        id: 'racer',
        name: 'Hyper Dash 2D',
        category: 'Highway Speed',
        record: racerScore > 0 ? `${racerScore} m` : 'No games played yet',
        numericScore: racerScore,
        badge: racerScore >= 1500 ? 'SPEED DEMON' : (racerScore >= 600 ? 'DRIFT KING' : (racerScore > 0 ? 'RACER' : 'ROOKIE')),
        icon: '🏎️'
      },
      {
        id: 'memory',
        name: 'Neon Memory Match',
        category: 'Mind Matrix',
        record: mem.bestMoves !== null ? `${mem.bestMoves} moves (${mem.bestTime}s)` : 'No games played yet',
        numericScore: mem.bestMoves !== null ? Math.max(1, 200 - mem.bestMoves * 5 - mem.bestTime) : 0,
        badge: mem.bestMoves !== null && mem.bestMoves <= 14 ? 'CYBER ORACLE' : (mem.bestMoves !== null ? 'SYNCED' : 'LOCKED'),
        icon: '🧠'
      },
      {
        id: 'tictactoe',
        name: 'Cyber Tic-Tac-Toe',
        category: 'Neural Tactics',
        record: `${ttt.wins}W / ${ttt.losses}L / ${ttt.draws}D`,
        numericScore: ttt.wins * 50,
        badge: ttt.wins >= 10 ? 'GRANDMASTER' : (ttt.wins >= 3 ? 'TACTICIAN' : 'INITIATE'),
        icon: '⭕'
      }
    ];
  }

  resetAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.notifyUpdate();
  }

  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('mgw_scores_updated'));
  }
}

window.storage = new StorageManager();

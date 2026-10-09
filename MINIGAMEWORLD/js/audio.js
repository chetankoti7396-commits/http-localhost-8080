/**
 * Chetan GameVerse - Audio Engine
 * Uses the Web Audio API to synthesize retro 8-bit sound effects.
 * No external audio files or downloads required!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('mgw_sound_muted') === 'true';
    this.initContext();
  }

  initContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('mgw_sound_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Helper to play synthesized tone
  playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
    if (this.muted) return;
    try {
      this.initContext();
      this.resume();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration);
    } catch (e) {
      // Audio fallback silent fail
    }
  }

  playClick() {
    this.playTone(800, 'sine', 0.05, 0, 0.1);
  }

  playMove() {
    this.playTone(440, 'triangle', 0.06, 0, 0.08);
  }

  playEat() {
    // Pleasant 2-note pickup for snake eating food
    this.playTone(523.25, 'sine', 0.08, 0, 0.15); // C5
    this.playTone(659.25, 'sine', 0.12, 0.06, 0.15); // E5
  }

  playScore() {
    // Quick rising score blip
    this.playTone(587.33, 'triangle', 0.07, 0, 0.12);
    this.playTone(880.00, 'sine', 0.15, 0.07, 0.15);
  }

  playMatch() {
    // Memory card pair matched
    this.playTone(523.25, 'triangle', 0.08, 0, 0.15);
    this.playTone(659.25, 'triangle', 0.08, 0.07, 0.15);
    this.playTone(783.99, 'sine', 0.2, 0.14, 0.18);
  }

  playWin() {
    // Victorious retro fanfare
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.15, idx * 0.1, 0.18);
    });
  }

  playGameOver() {
    // Classic 8-bit descending loss
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.18, idx * 0.11, 0.12);
    });
  }

  playCrash() {
    // Retro explosion / crash buzz
    if (this.muted) return;
    try {
      this.initContext();
      this.resume();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

// Global Sound Instance
window.sounds = new SoundEngine();

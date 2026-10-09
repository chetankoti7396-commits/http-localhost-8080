/**
 * Chetan GameVerse - Main Application Controller
 * Premium Futuristic 3D Cyberpunk Gaming Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Game instances
  let snakeInstance = null;
  let tttInstance = null;
  let memoryInstance = null;
  let racerInstance = null;

  // Reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize UI systems
  initBackgroundCanvas();
  initNavigation();
  initAudioToggle();
  initGameCardsTilt();
  initGameTabs();
  initGameModals();
  initCabinetRotator();
  initLeaderboard();
  initContactForm();

  // Handle URL hash on initial load (e.g. #snake, #racer)
  handleUrlHash();
  window.addEventListener('hashchange', handleUrlHash);

  // Synchronize UI upon score updates
  window.addEventListener('mgw_scores_updated', () => {
    updateLeaderboardUI();
    updateCardBests();
  });

  // Initial score population
  updateCardBests();

  /* ==========================================================================
     1. BACKGROUND CANVAS ANIMATION
     ========================================================================== */
  function initBackgroundCanvas() {
    const canvas = document.getElementById('cyber-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Generate neon star particles
    const particleCount = prefersReducedMotion ? 25 : 75;
    const stars = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.6,
      speed: Math.random() * 0.4 + 0.12,
      color: Math.random() > 0.45 ? '#00f0ff' : (Math.random() > 0.5 ? '#b026ff' : '#ff007f'),
      alpha: Math.random() * 0.7 + 0.3,
      pulseSpeed: Math.random() * 0.02 + 0.01
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);

      stars.forEach(star => {
        if (!prefersReducedMotion) {
          star.y -= star.speed;
          if (star.y < 0) {
            star.y = height;
            star.x = Math.random() * width;
          }
        }

        ctx.save();
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ==========================================================================
     2. NAVIGATION & MOBILE DRAWER
     ========================================================================== */
  function initNavigation() {
    const menuBtn = document.getElementById('nav-toggle-btn');
    const navLinks = document.getElementById('nav-links');
    const navBackdrop = document.getElementById('nav-backdrop');
    const header = document.getElementById('site-header');

    function closeMobileMenu() {
      if (!navLinks) return;
      navLinks.classList.remove('open');
      if (menuBtn) {
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
      if (navBackdrop) navBackdrop.classList.remove('visible');
      document.body.classList.remove('nav-open');
    }

    function toggleMobileMenu() {
      if (!navLinks) return;
      const isOpen = navLinks.classList.toggle('open');
      if (menuBtn) {
        menuBtn.classList.toggle('active', isOpen);
        menuBtn.setAttribute('aria-expanded', isOpen.toString());
      }
      if (navBackdrop) {
        navBackdrop.classList.toggle('visible', isOpen);
      }
      document.body.classList.toggle('nav-open', isOpen);
      if (window.sounds) window.sounds.playClick();
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', toggleMobileMenu);
    }

    if (navBackdrop) {
      navBackdrop.addEventListener('click', closeMobileMenu);
    }

    // Close when clicking any nav link
    if (navLinks) {
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          closeMobileMenu();
        });
      });
    }

    // Escape closes mobile nav
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
        closeMobileMenu();
      }
    });

    // Header scroll background effect
    window.addEventListener('scroll', () => {
      if (header) {
        if (window.scrollY > 35) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });
  }

  /* ==========================================================================
     3. AUDIO TOGGLE BUTTON
     ========================================================================== */
  function initAudioToggle() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (!audioBtn || !window.sounds) return;

    function renderAudioBtn() {
      const isMuted = window.sounds.isMuted();
      audioBtn.innerHTML = isMuted
        ? '<span class="icon">🔇</span><span class="btn-text">Muted</span>'
        : '<span class="icon">🔊</span><span class="btn-text">Sound ON</span>';
      audioBtn.classList.toggle('muted', isMuted);
      audioBtn.setAttribute('title', isMuted ? 'Sound Muted - Click to Enable' : 'Sound Active - Click to Mute');
    }

    renderAudioBtn();

    audioBtn.addEventListener('click', () => {
      window.sounds.toggleMute();
      renderAudioBtn();
      if (!window.sounds.isMuted()) {
        window.sounds.playScore();
      }
    });
  }

  /* ==========================================================================
     4. 3D CARD HOVER TILT & SPECULAR GLARE
     ========================================================================== */
  function initGameCardsTilt() {
    if (prefersReducedMotion) return;

    // Apply tilt to game cards, featured cards, and hero cabinet
    const tiltElements = document.querySelectorAll('.game-card, .featured-card, .hologram-cabinet');

    tiltElements.forEach(card => {
      const glare = card.querySelector('.card-glare');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;

        if (glare) {
          glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.22) 0%, transparent 60%)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  /* ==========================================================================
     5. HERO CABINET ROTATOR
     ========================================================================== */
  function initCabinetRotator() {
    const cabinet = document.getElementById('hero-cabinet');
    const chipItems = document.querySelectorAll('.screen-chips .chip-item');
    if (!cabinet || !chipItems.length) return;

    const gameIds = ['snake', 'racer', 'tictactoe', 'memory'];
    let activeIndex = 0;

    setInterval(() => {
      if (document.hidden) return;
      activeIndex = (activeIndex + 1) % gameIds.length;
      chipItems.forEach((chip, idx) => {
        if (idx === activeIndex) {
          chip.style.borderColor = 'var(--neon-cyan)';
          chip.style.background = 'rgba(0, 240, 255, 0.25)';
          chip.style.color = '#fff';
        } else {
          chip.style.borderColor = 'rgba(0, 240, 255, 0.3)';
          chip.style.background = 'rgba(0, 240, 255, 0.08)';
          chip.style.color = 'var(--neon-cyan)';
        }
      });
    }, 2800);
  }

  /* ==========================================================================
     6. GAME CATEGORY FILTER TABS
     ========================================================================== */
  function initGameTabs() {
    const tabBtns = document.querySelectorAll('.filter-tab-btn');
    const cards = document.querySelectorAll('.game-card');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (window.sounds) window.sounds.playClick();
        const category = btn.dataset.filter;

        cards.forEach(card => {
          if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden-card');
          } else {
            card.classList.add('hidden-card');
          }
        });
      });
    });
  }

  /* ==========================================================================
     7. GAME MODALS & ARENAS LIFECYCLE
     ========================================================================== */
  function initGameModals() {
    // Universal play button triggers (Hero, Featured, Cards, Cabinet, Leaderboard)
    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-open-game]');
      if (targetBtn) {
        e.preventDefault();
        const gameId = targetBtn.getAttribute('data-open-game');
        openGameModal(gameId);
      }
    });

    // Close buttons and backdrop triggers
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        closeAllModals();
      });
    });

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  function openGameModal(gameId) {
    if (window.sounds) window.sounds.playClick();
    closeAllModals(false);

    const modal = document.getElementById(`modal-${gameId}`);
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    // Update URL hash without jumping page
    history.replaceState(null, null, `#${gameId}`);

    // Initialize or start game instance
    if (gameId === 'snake') {
      if (!snakeInstance) {
        snakeInstance = new window.SnakeGame();
      }
      snakeInstance.start();
    } else if (gameId === 'tictactoe') {
      if (!tttInstance) {
        tttInstance = new window.TicTacToeGame();
      } else {
        tttInstance.resetGame();
      }
    } else if (gameId === 'memory') {
      if (!memoryInstance) {
        memoryInstance = new window.MemoryGame();
      } else {
        memoryInstance.reset();
      }
    } else if (gameId === 'racer') {
      if (!racerInstance) {
        racerInstance = new window.RacerGame();
      }
      racerInstance.start();
    }
  }

  function closeAllModals(clearHash = true) {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.add('hidden'));
    document.body.classList.remove('modal-open');

    // Pause/stop active game loops safely
    if (snakeInstance && snakeInstance.isRunning) {
      snakeInstance.togglePause();
    }
    if (racerInstance && racerInstance.isRunning) {
      racerInstance.togglePause();
    }
    if (memoryInstance) {
      memoryInstance.stopTimer();
    }

    if (clearHash && window.location.hash) {
      const activeHash = window.location.hash.replace('#', '');
      if (['snake', 'tictactoe', 'memory', 'racer'].includes(activeHash)) {
        history.replaceState(null, null, ' ');
      }
    }
  }

  function handleUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (['snake', 'tictactoe', 'memory', 'racer'].includes(hash)) {
      openGameModal(hash);
    }
  }

  /* ==========================================================================
     8. LEADERBOARD & STATS SYNCHRONIZATION
     ========================================================================== */
  function initLeaderboard() {
    updateLeaderboardUI();

    const resetBtn = document.getElementById('leaderboard-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your personal best scores? This cannot be undone.')) {
          if (window.storage) window.storage.resetAll();
          if (window.sounds) window.sounds.playGameOver();
          alert('Leaderboard reset. Ready for new records!');
        }
      });
    }
  }

  function updateLeaderboardUI() {
    if (!window.storage) return;
    const records = window.storage.getLeaderboardData();
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by rank score descending
    records.sort((a, b) => b.numericScore - a.numericScore);

    // Determine top pilot tier
    let topTier = 'ROOKIE';
    const topTiers = records.map(r => r.badge).filter(b => b !== 'ROOKIE' && b !== 'LOCKED' && b !== 'INITIATE');
    if (topTiers.length > 0) {
      topTier = topTiers[0];
    }
    const summaryTier = document.getElementById('summary-top-tier');
    if (summaryTier) summaryTier.textContent = topTier;

    records.forEach((rec, idx) => {
      const row = document.createElement('tr');
      const rankNum = idx + 1;
      const rankIcon = rankNum === 1 ? '🥇' : (rankNum === 2 ? '🥈' : (rankNum === 3 ? '🥉' : `#${rankNum}`));

      row.innerHTML = `
        <td class="col-rank"><span class="rank-badge rank-${rankNum}">${rankIcon}</span></td>
        <td class="col-game">
          <div class="game-meta">
            <span class="game-icon">${rec.icon}</span>
            <div>
              <div class="game-title">${rec.name}</div>
              <div class="game-category">${rec.category}</div>
            </div>
          </div>
        </td>
        <td class="col-score"><strong class="highlight-cyan">${rec.record}</strong></td>
        <td class="col-tier"><span class="tier-badge">${rec.badge}</span></td>
        <td class="col-action">
          <button class="btn-play-mini" data-open-game="${rec.id}">Launch</button>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  function updateCardBests() {
    if (!window.storage) return;

    // Snake (All Games Card & Featured Card)
    const snakeBest = document.getElementById('card-best-snake');
    const featSnakeBest = document.getElementById('featured-best-snake');
    const s = window.storage.getSnakeBest();
    const snakeText = s > 0 ? `${s} pts` : '--';
    if (snakeBest) snakeBest.textContent = snakeText;
    if (featSnakeBest) featSnakeBest.textContent = snakeText;

    // Tic-Tac-Toe
    const tttBest = document.getElementById('card-best-ttt');
    if (tttBest) {
      const t = window.storage.getTTTStats();
      tttBest.textContent = (t.wins > 0 || t.losses > 0 || t.draws > 0) ? `${t.wins}W - ${t.losses}L - ${t.draws}D` : '--';
    }

    // Memory
    const memBest = document.getElementById('card-best-memory');
    if (memBest) {
      const m = window.storage.getMemoryBest();
      memBest.textContent = m.bestMoves !== null ? `${m.bestMoves} moves (${m.bestTime}s)` : '--';
    }

    // Racer (All Games Card & Featured Card)
    const racerBest = document.getElementById('card-best-racer');
    const featRacerBest = document.getElementById('featured-best-racer');
    const r = window.storage.getRacerBest();
    const racerText = r > 0 ? `${r}m` : '--';
    if (racerBest) racerBest.textContent = racerText;
    if (featRacerBest) featRacerBest.textContent = racerText;
  }

  /* ==========================================================================
     9. CONTACT TRANSMISSION FORM
     ========================================================================== */
  function initContactForm() {
    const form = document.getElementById('cyber-contact-form');
    const feedback = document.getElementById('contact-feedback');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
          alert('Please fill out all fields before transmitting.');
          return;
        }

        if (window.sounds) window.sounds.playWin();

        if (feedback) {
          feedback.classList.remove('hidden');
          feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        form.reset();

        setTimeout(() => {
          if (feedback) feedback.classList.add('hidden');
        }, 6000);
      });
    }
  }
});

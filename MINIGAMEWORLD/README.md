# 🕹️ Chetan GameVerse — Free Online Games

A premium futuristic 3D cyberpunk arcade gaming portal built with **pure HTML5, modern CSS3, and vanilla JavaScript**. Play More. Explore More. Game On!

Featuring a deep navy background with vibrant cyan and purple neon lighting, 3D CSS perspective card tilt with specular glare, glowing action buttons, a dedicated Featured Games showcase, a live Leaderboard terminal, synthesized retro 8-bit Web Audio, and persistent high scores stored in browser `localStorage`.

---

## ✨ Features & Upgrades

1. **Deep Navy & Cyberpunk Lighting**:
   * Rich deep navy base (`#050818`, `#070d24`, `#0c1536`) with multi-layered radial neon glows (electric cyan `#00f0ff`, vibrant purple `#b026ff`, and magenta `#ff007f`).
   * Subtle ambient cyber grid and canvas particle dust.

2. **Large Hero Section**:
   * Immense **"ENTER THE GAMEVERSE"** title featuring metallic cyan and neon ultraviolet gradients with multi-layer glow text shadows.
   * Interactive 3D Holographic Arcade Cabinet with CRT scanlines, arcade controls, and game preview chip rotator.
   * Live quick metrics bar (4 Active Games, 0 Installs, 100% Free, 0ms Client Latency).

3. **Ultra-Glow "Play Now" Button**:
   * High-intensity cyan-to-purple gradient with pulsing neon aura keyframe animation (`heroBtnPulse`).
   * Continuous angled light-shimmer sweep reflection across the button face.
   * Satisfying 3D hover elevation and tactile audio feedback.

4. **Featured Games Spotlight**:
   * Dedicated spotlight showcase highlighting **Hyper Dash 2D** (Speed Demon) and **Snake Challenge** (Arcade Legend).
   * 3D perspective scenes: synthwave outrun highway grid with glowing racer car, and 3D matrix grid with segmented neon serpent.
   * Feature badges, gameplay tags, personal best indicators, and direct launch buttons.

5. **Attractive 3D-Style Game Cards**:
   * True CSS 3D perspective (`perspective: 1200px`) and `transform-style: preserve-3d`.
   * Real-time cursor tracking tilt with specular glare lighting (`.card-glare`).
   * Multi-layer glowing neon borders with dual-tone gradient accents.
   * Layered 3D element elevation (`translateZ`) for badges, titles, and action buttons.
   * Filterable category tabs: *All Games*, *Arcade*, *Strategy*, *Puzzle*, *Action*.

6. **Pilot Status Terminal (Leaderboard)**:
   * Quick pilot metrics cards (Current Top Pilot Tier, Arenas Online, Persistent Storage Sync).
   * High-tech cyber terminal table with rank medals (🥇 Gold, 🥈 Silver, 🥉 Bronze), Game, Personal Best, dynamic Pilot Tier badges (`CYBER MASTER`, `SPEED DEMON`, `CYBER ORACLE`, `GRANDMASTER`, `PRO PILOT`), and direct launch actions.
   * Clear records action with confirmation safety check.

7. **Responsive & Mobile Navigation**:
   * Animated hamburger icon smoothly morphing into an 'X' close button.
   * Full glassmorphic deep navy drawer with high-contrast, touch-friendly links.
   * Touch-to-close backdrop overlay and Escape key support.
   * Compact audio toggle button for phones and tablets.

8. **Zero Dependencies & Lightweight Performance**:
   * Pure CSS animations and HTML5 2D Canvas—no heavy external 3D libraries or paid APIs.
   * Full `@media (prefers-reduced-motion: reduce)` accessibility support.
   * Web Audio API 8-bit sound synthesis directly generated client-side.

---

## 🎮 Included Games (All Fully Playable)

### 1. 🐍 Snake Challenge
* **Category**: Arcade Classic
* **Objective**: Pilot the digital serpent across the cyber grid, consume glowing power orbs and golden bonus crystals, and achieve the highest score without crashing into walls or yourself.
* **Controls**:
  * Desktop: `W`, `A`, `S`, `D` or `Arrow Keys`
  * Mobile: Responsive on-screen touch D-Pad
  * Pause: `Spacebar` or Pause button

### 2. ⭕ Cyber Tic-Tac-Toe
* **Category**: Neural Strategy
* **Modes**:
  * **vs Cyber AI**: Smart tactical Minimax computer opponent
  * **2-Player Pass & Play**: Challenge a friend locally on the same device
* **Features**: Glowing animated moves, win-strike detection, draw detection, win/loss streak tracker.

### 3. 🧠 Neon Memory Match
* **Category**: Puzzle & Focus
* **Objective**: Flip 3D holographic cards and match all 8 cyberpunk symbol pairs with the fewest moves and fastest time.
* **Features**: Smooth 3D CSS card flip, live timer, move counter, star rating system (⭐ to ⭐⭐⭐), and best record saving.

### 4. 🏎️ Hyper Dash 2D
* **Category**: Highway Action
* **Objective**: Pilot a neon cyber racer down an infinite highway. Dodge traffic, collect golden energy cells for score boosts, and survive escalating speeds.
* **Controls**:
  * Desktop: `Left` / `Right` Arrow keys or `A` / `D`
  * Mobile: On-screen "Steer Left" and "Steer Right" touch pads
  * Pause: `Spacebar` or Pause button

---

## 🚀 How to Run the Website Locally

### Method 1: Python HTTP Server (Recommended)
Open PowerShell in this folder and run:
```powershell
py -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

### Method 2: Direct Browser Launch
Double-click `index.html` in Windows File Explorer. It opens instantly in your default browser.

### Method 3: VS Code Live Server
Right-click `index.html` in VS Code and select **Open with Live Server**.

---

## 🌐 Publish to GitHub Pages (100% Free)

1. Create a new repository on GitHub (e.g. `chetan-gameverse`).
2. Run in this directory:
   ```powershell
   git init
   git add .
   git commit -m "Chetan GameVerse - Premium Futuristic 3D Gaming Portal"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git
   git push -u origin main
   ```
3. In your GitHub repository, go to **Settings > Pages > Source**, choose `main` branch root, and click **Save**. Your portal will be live globally!

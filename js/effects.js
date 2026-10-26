/**
 * Effects Module — Ambient particles, emoji trail, click bursts
 * Optimized for performance
 */
const Effects = (() => {
  let canvas, ctx;
  let particles = [];
  let enabled = true;
  let config = {};
  let lastSpawn = 0;
  let rafId = null;
  let isLowPerf = false;
  let ambientTimer = 0;

  function init() {
    canvas = document.getElementById('effects-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      isLowPerf = true;
    }

    const data = Storage.load();
    config = data.effects || {};
    enabled = config.emojiTrail !== false || config.particles !== false ||
              config.hearts || config.stars || config.snow || config.musicNotes;

    if (enabled) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onTouch, { passive: true });
      document.addEventListener('click', onClick);
      document.addEventListener('touchstart', onClick, { passive: true });
      // Seed some ambient particles
      for (let i = 0; i < (isLowPerf ? 8 : 16); i++) {
        spawnAmbient();
      }
      loop();
    }
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function updateConfig(newConfig) {
    config = { ...config, ...newConfig };
    enabled = config.emojiTrail !== false || config.particles !== false ||
              config.hearts || config.stars || config.snow || config.musicNotes;
  }

  function getEmojis() {
    if (config.emojis && config.emojis.length) return config.emojis;
    const list = [];
    if (config.hearts) list.push('❤️', '💕', '💗', '✨');
    if (config.stars) list.push('⭐', '✨', '🌟', '✦');
    if (config.snow) list.push('❄', '❅', '❆', '•');
    if (config.musicNotes) list.push('🎵', '🎶', '♪', '♫');
    if (list.length === 0) list.push('✨', '•', '◦', '★', '✦', '✧');
    return list;
  }

  function onMove(e) {
    if (!enabled || isLowPerf || config.emojiTrail === false) return;
    const now = Date.now();
    if (now - lastSpawn < (isLowPerf ? 80 : 35) / (config.density || 0.6)) return;
    lastSpawn = now;
    spawn(e.clientX, e.clientY);
  }

  function onTouch(e) {
    if (!enabled || !e.touches[0] || config.emojiTrail === false) return;
    const t = e.touches[0];
    const now = Date.now();
    if (now - lastSpawn < 45) return;
    lastSpawn = now;
    spawn(t.clientX, t.clientY);
  }

  function onClick(e) {
    if (!enabled || config.click === false) return;
    const x = e.clientX || (e.touches && e.touches[0]?.clientX);
    const y = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (x == null) return;
    const count = isLowPerf ? 4 : 8;
    for (let i = 0; i < count; i++) {
      spawn(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, true);
    }
  }

  function spawn(x, y, burst = false) {
    if (particles.length > (isLowPerf ? 50 : 100)) return;
    const emojis = getEmojis();
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const speed = config.speed || 1;
    particles.push({
      x, y,
      emoji,
      vx: (Math.random() - 0.5) * (burst ? 5 : 1.8) * speed,
      vy: (-Math.random() * 2.5 - 0.8) * speed,
      life: 1,
      decay: (0.01 + Math.random() * 0.012) * speed,
      size: (12 + Math.random() * 12) * (config.size || 1),
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      ambient: false
    });
  }

  function spawnAmbient() {
    if (particles.length > (isLowPerf ? 40 : 70)) return;
    if (config.particles === false && !config.hearts && !config.stars && !config.snow && !config.musicNotes) return;
    const emojis = getEmojis();
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const fromBottom = Math.random() > 0.4;
    particles.push({
      x: Math.random() * (canvas?.width || window.innerWidth),
      y: fromBottom ? (canvas?.height || window.innerHeight) + 10 : Math.random() * (canvas?.height || window.innerHeight),
      emoji,
      vx: (Math.random() - 0.5) * 0.6 * (config.speed || 1),
      vy: fromBottom ? -(0.3 + Math.random() * 0.8) * (config.speed || 1) : (Math.random() - 0.5) * 0.4,
      life: 0.4 + Math.random() * 0.6,
      decay: 0.0015 + Math.random() * 0.002,
      size: (8 + Math.random() * 14) * (config.size || 1),
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 3,
      ambient: true
    });
  }

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ambient spawn
    ambientTimer++;
    const ambientRate = isLowPerf ? 25 : 12;
    if (ambientTimer % ambientRate === 0 && (config.particles !== false || config.hearts || config.stars || config.snow || config.musicNotes)) {
      spawnAmbient();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (!p.ambient) p.vy -= 0.015;
      p.life -= p.decay;
      p.rot += p.rotSpeed;
      if (p.life <= 0 || p.y < -40 || p.y > canvas.height + 40) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 1.2);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }
    rafId = requestAnimationFrame(loop);
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onTouch);
    document.removeEventListener('click', onClick);
    document.removeEventListener('touchstart', onClick);
  }

  return { init, updateConfig, destroy, spawn };
})();

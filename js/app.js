/**
 * Main public app — orbit layout (glass UI)
 * Data comes from Storage (Admin LocalStorage, or config.js for public visitors).
 */
(function () {
  const ICON_MAP = {
    telegram: 'fab fa-telegram', tiktok: 'fab fa-tiktok', facebook: 'fab fa-facebook',
    instagram: 'fab fa-instagram', youtube: 'fab fa-youtube', whatsapp: 'fab fa-whatsapp',
    messenger: 'fab fa-facebook-messenger', discord: 'fab fa-discord', x: 'fab fa-x-twitter',
    github: 'fab fa-github', spotify: 'fab fa-spotify', website: 'fas fa-globe', music: 'fas fa-music',
    link: 'fas fa-link', phone: 'fas fa-mobile-alt', wallet: 'fas fa-wallet',
    transfer: 'fas fa-exchange-alt', card: 'fas fa-credit-card', document: 'fas fa-file-alt',
    download: 'fas fa-download'
  };
  /* glow colour (r,g,b) per brand */
  const BRAND = {
    telegram: '41,169,235', tiktok: '255,64,110', facebook: '66,133,244', instagram: '236,72,153',
    youtube: '255,64,64', whatsapp: '52,211,120', messenger: '0,132,255', discord: '112,128,255',
    x: '200,210,225', github: '200,210,225', spotify: '30,215,96'
  };
  const DEFAULT_VIDEO = 'assets/background/bg.mp4';
  const DEFAULT_POSTER = 'assets/background/poster.jpg';

  const $ = id => document.getElementById(id);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  let data = null;
  let logoClicks = 0, logoTimer = null;

  async function init() {
    // Prefer async so we can load remote config URL if set
    data = (typeof Storage.loadAsync === 'function')
      ? await Storage.loadAsync()
      : Storage.load();
    applySettings();
    startLoading();
  }

  /* ---------- settings ---------- */
  function applySettings() {
    const s = data.settings || {};
    document.title = s.title || data.profile?.name || 'Premium Bio';
    const meta = document.querySelector('meta[name="description"]');
    if (meta && s.seoDescription) meta.content = s.seoDescription;
    if (s.disableTextSelection) document.body.classList.add('no-select');
    if (s.disableRightClick) document.addEventListener('contextmenu', e => e.preventDefault());
  }

  /* ---------- loading -> reveal ---------- */
  function startLoading() {
    const img = $('loader-logo');
    if (img && data.profile?.logo) {
      img.src = data.profile.logo;
      img.onerror = () => { img.style.display = 'none'; };
    }
    const ms = data.settings?.loadingDuration || 2000;
    const bar = document.querySelector('.ld-bar i');
    if (bar) bar.style.animationDuration = ms + 'ms';
    setTimeout(() => {
      const loader = $('loading-screen');
      loader?.classList.add('out');
      setTimeout(() => { loader?.classList.add('hidden'); }, 700);
      showMain();
    }, ms);
  }

  function showMain() {
    if (data.settings?.maintenanceMode) {
      $('maintenance-screen')?.classList.remove('hidden');
      return;
    }
    renderProfile();
    renderBackground();
    renderLinks();
    layout();
    document.body.classList.add('ready');

    Effects.init();
    MusicPlayer.init();
    Popup.init();
    Analytics.trackVisit();

    $('logo')?.addEventListener('click', onLogoClick);
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); });
    setupSparks();
  }

  /* ---------- profile ---------- */
  function renderProfile() {
    const p = data.profile || {};
    const title = $('site-title');
    if (p.name) { title.textContent = p.name; title.classList.remove('hidden'); }

    const bio = $('profile-bio');
    if (p.bio) { bio.textContent = p.bio; bio.classList.remove('hidden'); }

    if (p.status) {
      $('status-text').textContent = p.status;
      $('profile-status').classList.remove('hidden');
    }
    if (p.badge) {
      $('profile-badge').textContent = p.badge;
      $('profile-badge').classList.remove('hidden');
    }

    const logo = $('profile-logo'), ph = $('logo-placeholder');
    if (p.logo) {
      logo.src = p.logo;
      logo.classList.remove('hidden');
      ph.classList.add('hidden');
      const cover = $('m-cover'); if (cover) cover.src = p.logo;
    } else {
      logo.classList.add('hidden');
      ph.classList.remove('hidden');
    }
  }

  /* ---------- links: orbit + dock ---------- */
  function enabledLinks() { return (data.links || []).filter(l => l.enabled !== false); }

  function iconHtml(link) {
    if (link.customIcon) return `<img src="${escAttr(link.customIcon)}" alt="">`;
    return `<i class="${ICON_MAP[link.icon] || ICON_MAP.link}"></i>`;
  }
  /* Join straight away in the same tab, unless a link is explicitly set to open in a new tab */
  const targetOf = link => (link.newTab === true ? '_blank' : '_self');

  function renderLinks() {
    const links = enabledLinks();
    const rotor = $('links-container');
    rotor.innerHTML = '';
    links.forEach((link, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.innerHTML = `
        <a class="bead" style="--i:${i};--b:${BRAND[link.icon] || '90,209,255'}"
           href="${escAttr(link.url)}" target="${targetOf(link)}" rel="noopener noreferrer"
           aria-label="${escAttr(link.name)}" data-id="${escAttr(link.id)}">${iconHtml(link)}</a>
        <span class="tag">${esc(link.name)}</span>`;
      slot.querySelector('a').addEventListener('click', () => Analytics.trackClick(link.id));
      rotor.appendChild(slot);
    });
    /* restart the orbit so the rotor and every slot's counter-rotation begin in the same frame (keeps name tags upright) */
    rotor.style.animation = 'none'; void rotor.offsetWidth; rotor.style.animation = '';

    const dock = $('bottom-dock');
    if (!links.length) { dock.classList.add('hidden'); return; }
    dock.classList.remove('hidden');
    dock.innerHTML = '';
    links.forEach(link => {
      const a = document.createElement('a');
      a.className = 'dk';
      a.style.setProperty('--b', BRAND[link.icon] || '90,209,255');
      a.href = link.url; a.target = targetOf(link); a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', link.name);
      a.innerHTML = `<span class="ic">${iconHtml(link)}</span><small>${esc(link.name)}</small>`;
      a.addEventListener('click', () => Analytics.trackClick(link.id));
      dock.appendChild(a);
    });
  }

  /* place the beads on the orbit track */
  function layout() {
    const stage = $('stage'), rotor = $('links-container');
    if (!stage || !rotor) return;
    const S = stage.clientWidth;
    const bead = clamp(Math.round(S * .145), 46, 60);
    const wanted = data.profile?.logoSize;
    const logo = clamp(Math.round(wanted ? Math.min(wanted, S * .30) : S * .27), 76, 150);
    const label = 30;                                   /* room for the name tag under each bead */
    let r = S / 2 - bead / 2 - label;
    r = Math.max(r, logo / 2 + bead / 2 + 46);          /* keep logo and name tags apart */
    stage.style.setProperty('--bead', bead + 'px');
    stage.style.setProperty('--logo', logo + 'px');
    stage.style.setProperty('--r', r + 'px');
    const slots = rotor.querySelectorAll('.slot'), n = slots.length, c = S / 2;
    slots.forEach((el, i) => {
      const a = -Math.PI / 2 + i * (2 * Math.PI / n);
      el.style.left = (c + r * Math.cos(a) - bead / 2) + 'px';
      el.style.top = (c + r * Math.sin(a) - bead / 2) + 'px';
    });
  }

  /* ---------- background ---------- */
  function renderBackground() {
    const bg = data.background || {};
    const mobile = innerWidth <= 768;
    const img = $('bg-image'), vid = $('bg-video'), poster = $('poster'), overlay = $('bg-overlay');
    img.classList.add('hidden'); vid.classList.add('hidden'); poster.style.backgroundImage = '';

    if (bg.type === 'image') {
      const src = (mobile && bg.mobileImage) ? bg.mobileImage : bg.image;
      if (src) {
        img.src = src; img.classList.remove('hidden');
        img.style.opacity = bg.opacity ?? 1;
        img.style.filter = `brightness(${bg.brightness ?? 1})`;
        img.style.transform = `scale(${bg.scale ?? 1})`;
        img.style.objectPosition = bg.position || 'center';
      }
    } else if (bg.type === 'video') {
      const src = (mobile && bg.mobileVideo) ? bg.mobileVideo : bg.video;
      if (src) {
        /* a still of the default video drifts slowly while the video loads / if autoplay is blocked */
        if (src === DEFAULT_VIDEO) poster.style.backgroundImage = `url(${DEFAULT_POSTER})`;
        vid.classList.remove('hidden');
        vid.style.setProperty('--bgo', bg.opacity ?? 1);
        vid.style.filter = `brightness(${bg.brightness ?? 1}) saturate(1.08) contrast(1.03)`;
        vid.style.transform = `scale(${(bg.scale ?? 1) * 1.04})`;
        vid.style.objectPosition = bg.position || 'center';
        vid.loop = bg.loop !== false;
        vid.muted = true; vid.defaultMuted = true;
        vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', '');
        vid.src = src;
        vid.addEventListener('playing', () => vid.classList.add('on'));
        if (bg.autoplay !== false) {
          const kick = () => { if (vid.paused) vid.play().catch(() => {}); };
          kick();
          vid.addEventListener('canplay', kick);
          ['pointerdown', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, kick, { passive: true }));
          document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
        }
      }
    }
    if (overlay) {
      const ov = bg.overlay ?? 0;
      overlay.style.background = `rgba(0,0,0,${ov * 0.6})`;
      overlay.style.backdropFilter = bg.blur ? `blur(${bg.blur}px)` : '';
    }
  }

  /* ---------- tap sparks ---------- */
  function setupSparks() {
    const cv = $('fx'); if (!cv) return;
    const cx = cv.getContext('2d');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let parts = [], raf = 0;
    const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
    fit(); addEventListener('resize', fit);
    function tick() {
      cx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter(p => p.life > 0);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vx *= .96; p.vy = p.vy * .96 + .05; p.life -= .022;
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283);
        cx.fillStyle = `rgba(${p.c},${Math.max(p.life, 0)})`;
        cx.shadowColor = `rgba(${p.c},.9)`; cx.shadowBlur = 8; cx.fill();
      }
      raf = parts.length ? requestAnimationFrame(tick) : 0;
      if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
    }
    addEventListener('pointerdown', e => {
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * 6.283, s = 1.2 + Math.random() * 2.6;
        parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s - .6, life: 1,
          r: 1.4 + Math.random() * 2.2, c: Math.random() < .7 ? '186,230,255' : '255,217,138' });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------- hidden admin: tap the logo 5 times ---------- */
  function onLogoClick() {
    logoClicks++;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => { logoClicks = 0; }, 2500);
    if (logoClicks >= 5) { logoClicks = 0; showAdminLogin(); }
  }

  function showAdminLogin() {
    const modal = $('admin-login'), input = $('admin-password'), err = $('login-error');
    modal.classList.remove('hidden');
    input.value = ''; input.focus();
    err.classList.add('hidden');
    const go = () => {
      if (Storage.verifyPassword(input.value)) {
        sessionStorage.setItem('admin_auth', '1');
        window.location.href = 'admin.html';
      } else {
        err.classList.remove('hidden');
      }
    };
    $('admin-login-btn').onclick = go;
    input.onkeydown = e => {
      if (e.key === 'Enter') go();
      if (e.key === 'Escape') modal.classList.add('hidden');
    };
    modal.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };
  }

  /* ---------- helpers ---------- */
  function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
  function escAttr(str) { return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

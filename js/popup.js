/**
 * Popup / Announcement Module
 */
const Popup = (() => {
  function init() {
    const data = Storage.load();
    const p = data.popup;
    if (!p || !p.enabled || !p.title) return;

    const mode = p.mode || 'session';
    if (mode === 'session' && sessionStorage.getItem('popup_shown')) return;
    if (mode === 'day') {
      const today = new Date().toDateString();
      if (localStorage.getItem('popup_day') === today) return;
    }

    show(p);
  }

  function show(p) {
    const overlay = document.getElementById('popup-overlay');
    if (!overlay) return;
    document.getElementById('popup-title').textContent = p.title || '';
    document.getElementById('popup-desc').textContent = p.description || '';
    const img = document.getElementById('popup-image');
    if (p.image) {
      img.src = p.image;
      img.classList.remove('hidden');
    } else {
      img.classList.add('hidden');
    }
    const btn = document.getElementById('popup-btn');
    if (p.buttonText && p.buttonLink) {
      btn.textContent = p.buttonText;
      btn.href = p.buttonLink;
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
    overlay.classList.remove('hidden');

    document.getElementById('popup-close')?.addEventListener('click', close, { once: true });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    }, { once: true });

    if (p.mode === 'session') sessionStorage.setItem('popup_shown', '1');
    if (p.mode === 'day') localStorage.setItem('popup_day', new Date().toDateString());
  }

  function close() {
    document.getElementById('popup-overlay')?.classList.add('hidden');
  }

  return { init, show, close };
})();

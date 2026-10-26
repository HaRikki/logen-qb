/**
 * Storage Module — LocalStorage management for Premium Bio
 * Architecture ready for future Backend / Cloud Storage integration
 */
const Storage = (() => {
  const KEY = 'premium_bio_data_v1';

  const DEFAULTS = {
    profile: {
      name: '',
      bio: '',
      status: 'Online',
      badge: '',
      logo: 'assets/logo/logo.jpg',
      logoSize: 120,
      logoAnimation: true
    },
    links: [
      { id: 'l1', name: 'LG Admin', url: 'https://t.me/AhGa78', icon: 'telegram', customIcon: '', enabled: true, newTab: false, animation: true },
      { id: 'l2', name: 'LG BOT SMM', url: 'https://t.me/AngKer_smm_Bot', icon: 'telegram', customIcon: '', enabled: true, newTab: false, animation: true },
      { id: 'l3', name: 'LG Channel', url: 'https://t.me/harikki_Channel', icon: 'telegram', customIcon: '', enabled: true, newTab: false, animation: true }
    ],
    music: [
      { id: 'local-1', title: 'No Surprises', artist: 'Radiohead', src: 'assets/music/no-surprises.mp3', type: 'audio', enabled: true },
      { id: 'local-2', title: 'Unconditionally', artist: 'Katy Perry', src: 'assets/music/unconditionally.mp3', type: 'audio', enabled: true },
      { id: 'local-3', title: 'Intro', artist: 'Unknown', src: 'assets/music/intro.mp3', type: 'audio', enabled: true },
      { id: 'local-4', title: 'Starboy', artist: 'The Weeknd', src: 'assets/music/starboy.mp3', type: 'audio', enabled: true }
    ],
    background: {
      type: 'video', // none | image | video
      image: '',
      video: 'assets/background/bg.mp4',
      mobileImage: '',
      mobileVideo: '',
      overlay: 0.35,
      brightness: 1,
      blur: 0,
      opacity: 1,
      scale: 1,
      position: 'center',
      loop: true,
      autoplay: true
    },
    appearance: {
      theme: 'dark',
      font: 'system',
      fontSize: 16,
      buttonSize: 58,
      borderRadius: 50,
      glow: true,
      shadow: true,
      animationSpeed: 1
    },
    effects: {
      emojiTrail: true,
      particles: true,
      cursor: true,
      touch: true,
      click: true,
      hearts: true,
      stars: true,
      snow: false,
      musicNotes: false,
      density: 0.7,
      speed: 1,
      size: 1,
      emojis: ['✨', '⭐', '❤️', '💫', '✦', '✧', '•']
    },
    popup: {
      enabled: false,
      title: '',
      description: '',
      image: '',
      buttonText: '',
      buttonLink: '',
      mode: 'session' // every | session | day
    },
    settings: {
      title: '',
      favicon: '',
      loadingDuration: 2000,
      autoPlayMusic: true,
      autoNext: true,
      defaultVolume: 70,
      soundEffects: false,
      maintenanceMode: false,
      customCursor: false,
      disableTextSelection: false,
      disableRightClick: false,
      seoDescription: ''
    },
    security: {
      passwordHash: '', // will be set on first load
      autoLogout: false,
      sessionTimeout: 30, // minutes
      loginAttempts: 0,
      maxAttempts: 5,
      locked: false
    },
    analytics: {
      totalClicks: 0,
      linkClicks: {},
      musicPlays: {},
      visits: 0
    },
    media: {
      images: [],
      videos: [],
      audio: [],
      logos: [],
      icons: []
    }
  };

  // Simple hash for demo (not production secure)
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return 'h' + Math.abs(h).toString(36);
  }

  function isAdminContext() {
    try {
      return /admin\.html$/i.test(location.pathname) || sessionStorage.getItem('admin_auth') === '1';
    } catch (e) { return false; }
  }

  /* Public visitors read config.js (if filled in) or remote URL; admins always read their own LocalStorage. */
  function load() {
    // Admin always uses local storage
    if (isAdminContext()) return loadLocal();

    // 1) Inline remote config from config.js (highest priority for public)
    const remote = window.__REMOTE_CONFIG__;
    if (remote && typeof remote === 'object') {
      return mergeRemote(remote);
    }

    // 2) Fallback to local (first visit / no config yet)
    return loadLocal();
  }

  /* Async version — supports fetching from a public JSON URL (no redeploy needed after Admin edit) */
  async function loadAsync() {
    if (isAdminContext()) return loadLocal();

    // Prefer inline config if present
    const remote = window.__REMOTE_CONFIG__;
    if (remote && typeof remote === 'object') {
      return mergeRemote(remote);
    }

    // Optional: fetch from a public URL set in config.js
    // Example: window.__REMOTE_CONFIG_URL__ = 'https://raw.githubusercontent.com/you/repo/main/config.json';
    const url = window.__REMOTE_CONFIG_URL__;
    if (url && typeof url === 'string' && url.startsWith('http')) {
      try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), {
          cache: 'no-store'
        });
        if (res.ok) {
          const json = await res.json();
          if (json && typeof json === 'object') {
            return mergeRemote(json);
          }
        }
      } catch (e) {
        console.warn('Remote config fetch failed, using local', e);
      }
    }

    return loadLocal();
  }

  function mergeRemote(remote) {
    const merged = deepMerge(structuredClone(DEFAULTS), structuredClone(remote));
    const local = loadLocal();
    // Keep password hash + analytics from this browser
    merged.security = Object.assign({}, merged.security, {
      passwordHash: merged.security.passwordHash || local.security?.passwordHash
    });
    merged.analytics = local.analytics || merged.analytics;
    return merged;
  }

  /* Generate the exact code to paste into config.js so all visitors see the current settings */
  function getPublishCode() {
    const data = loadLocal();
    // Remove heavy analytics / security noise for public config (optional cleanup)
    const pub = structuredClone(data);
    if (pub.analytics) {
      pub.analytics = { totalClicks: 0, linkClicks: {}, musicPlays: {}, visits: 0 };
    }
    // Keep passwordHash so Admin password still works after publish
    return 'window.__REMOTE_CONFIG__ = ' + JSON.stringify(pub, null, 2) + ';';
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const data = structuredClone(DEFAULTS);
        data.security.passwordHash = simpleHash('789789');
        save(data);
        return data;
      }
      const data = JSON.parse(raw);
      // Merge with defaults for missing keys
      return deepMerge(structuredClone(DEFAULTS), data);
    } catch (e) {
      console.warn('Storage load error', e);
      return structuredClone(DEFAULTS);
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Storage save error (quota?)', e);
      return false;
    }
  }

  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function exportData() {
    const data = load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `premium-bio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      save(data);
      return true;
    } catch {
      return false;
    }
  }

  function reset() {
    localStorage.removeItem(KEY);
    const data = structuredClone(DEFAULTS);
    data.security.passwordHash = simpleHash('789789');
    save(data);
    return data;
  }

  function verifyPassword(pw) {
    const data = loadLocal();
    return (data.security.passwordHash || simpleHash('789789')) === simpleHash(pw);
  }

  function setPassword(pw) {
    const data = loadLocal();
    data.security.passwordHash = simpleHash(pw);
    data.security.loginAttempts = 0;
    data.security.locked = false;
    save(data);
  }

  return {
    load, loadAsync, loadLocal, save, exportData, importData, reset,
    verifyPassword, setPassword, simpleHash, getPublishCode, DEFAULTS, KEY
  };
})();

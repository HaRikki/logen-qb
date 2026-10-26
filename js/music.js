/**
 * Music Player — YouTube (hidden audio) + local files
 * Mini Prev / Play / Next only
 * Supports background playback via Media Session API
 */
const MusicPlayer = (() => {
  let audio, playlist = [], currentIndex = -1;
  let isPlaying = false, isShuffle = false, isRepeat = false;
  let settings = {};
  let ytPlayer = null;
  let ytReady = false;
  let mode = 'audio';
  let unlocked = false;
  let pendingPlay = false;

  function init() {
    audio = document.getElementById('audio-player');
    const data = Storage.load();
    settings = data.settings || {};
    playlist = (data.music || []).filter(s => s.enabled !== false);

    // No default songs — playlist starts empty until user adds new tracks


    if (audio) {
      audio.volume = (settings.defaultVolume || 80) / 100;
      // Keep playing even when page is backgrounded / tab switched
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.addEventListener('ended', onEnded);
      // Prevent browser from pausing on visibility change for HTML5 audio
      audio.addEventListener('pause', () => {
        // If we intentionally paused, isPlaying is already false
        // If browser auto-paused while we want to play, resume
        if (isPlaying && mode === 'audio' && unlocked) {
          setTimeout(() => {
            if (isPlaying && audio.paused) {
              audio.play().catch(() => {});
            }
          }, 100);
        }
      });
    }

    loadYTApi();
    renderMiniControls();
    bindUnlock();
    setupMediaSession();
    bindVisibility();

    // Prepare first song (don't force play until user gesture)
    if (playlist.length > 0) {
      setTimeout(() => {
        loadSong(0);
        // Try autoplay; if blocked, unlock on next tap
        pendingPlay = true;
        play();
      }, 2200);
    }
  }

  function bindUnlock() {
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      if (pendingPlay || !isPlaying) {
        pendingPlay = false;
        play();
      }
    };
    document.addEventListener('click', unlock, { passive: true });
    document.addEventListener('touchstart', unlock, { passive: true });
  }

  /* Keep music playing when user switches tab / minimizes (as long as page is not fully closed) */
  function bindVisibility() {
    const resumeIfNeeded = () => {
      if (!isPlaying || !unlocked) return;
      if (mode === 'audio' && audio && audio.paused) {
        audio.play().catch(() => {});
      } else if (mode === 'youtube' && ytPlayer) {
        try {
          if (ytPlayer.playVideo) ytPlayer.playVideo();
        } catch (_) {}
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab hidden — try keep YT alive (browser may still throttle)
        if (isPlaying && mode === 'youtube' && ytPlayer) {
          try { if (ytPlayer.playVideo) ytPlayer.playVideo(); } catch (_) {}
        }
        return;
      }
      resumeIfNeeded();
    });

    // Some mobile browsers fire these when switching apps
    window.addEventListener('pagehide', () => {
      if (isPlaying && mode === 'youtube' && ytPlayer) {
        try { if (ytPlayer.playVideo) ytPlayer.playVideo(); } catch (_) {}
      }
    });
    window.addEventListener('pageshow', resumeIfNeeded);
    window.addEventListener('focus', resumeIfNeeded);
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => { unlocked = true; play(); });
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
    } catch (_) {}
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const song = playlist[currentIndex >= 0 ? currentIndex : 0];
    if (!song) return;
    try {
      const artwork = [];
      const cover = document.getElementById('m-cover');
      if (cover && cover.src) {
        artwork.push({ src: cover.src, sizes: '512x512', type: 'image/jpeg' });
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title || 'Music',
        artist: song.artist || '',
        album: 'Premium Bio',
        artwork: artwork
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (_) {}
  }

  function setupControls() {
    document.getElementById('mini-prev')?.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
    document.getElementById('mini-next')?.addEventListener('click', (e) => { e.stopPropagation(); next(); });
    document.getElementById('mini-play')?.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
  }

  const ICONS = {
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2.5v14H6zM20 5v14L9.5 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M15.5 5H18v14h-2.5zM4 5l10.5 7L4 19z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>'
  };
  let controlsBound = false;

  function renderMiniControls() {
    const box = document.getElementById('music');
    if (!box) return;
    if (!controlsBound) {
      document.getElementById('mini-prev').innerHTML = ICONS.prev;
      document.getElementById('mini-next').innerHTML = ICONS.next;
      setupControls();
      controlsBound = true;
    }
    box.classList.toggle('hidden', playlist.length === 0);
    updateMeta();
    updatePlayIcon();
  }

  function updateMeta() {
    const song = playlist[currentIndex >= 0 ? currentIndex : 0];
    const t = document.getElementById('m-title');
    const a = document.getElementById('m-artist');
    if (t) t.textContent = song ? (song.title || '—') : '—';
    if (a) a.textContent = song ? (song.artist || '') : '';
    updateMediaSession();
  }

  function loadYTApi() {
    if (window.YT && window.YT.Player) { ytReady = true; return; }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      ytReady = true;
      if (currentIndex >= 0 && isYoutube(playlist[currentIndex])) {
        createYTPlayer(extractYTId(playlist[currentIndex].src));
      }
    };
  }

  function isYoutube(song) {
    if (!song) return false;
    const s = String(song.src || '');
    return song.type === 'youtube' || s.startsWith('youtube:') ||
      s.includes('youtube.com') || s.includes('youtu.be');
  }

  function extractYTId(src) {
    if (!src) return '';
    if (src.startsWith('youtube:')) return src.slice(8).trim();
    const m = String(src).match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : src;
  }

  function createYTPlayer(videoId) {
    let host = document.getElementById('yt-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'yt-host';
      // Keep player in DOM but invisible (YT needs some size)
      host.style.cssText = 'position:fixed;left:0;bottom:0;width:120px;height:70px;opacity:0.01;pointer-events:none;z-index:-1;overflow:hidden;';
      document.body.appendChild(host);
    }
    host.innerHTML = '<div id="yt-player-el"></div>';

    if (!window.YT || !window.YT.Player) {
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(check);
          createYTPlayer(videoId);
        }
      }, 250);
      setTimeout(() => clearInterval(check), 15000);
      return;
    }

    try {
      if (ytPlayer && ytPlayer.destroy) {
        try { ytPlayer.destroy(); } catch (_) {}
        ytPlayer = null;
      }
    } catch (_) {}

    ytPlayer = new YT.Player('yt-player-el', {
      height: '70',
      width: '120',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: location.origin || undefined
      },
      events: {
        onReady: (e) => {
          try { e.target.setVolume(settings.defaultVolume || 80); } catch (_) {}
          if (isPlaying || pendingPlay) {
            pendingPlay = false;
            try { e.target.playVideo(); } catch (_) {}
          }
        },
        onStateChange: (e) => {
          if (!window.YT) return;
          if (e.data === YT.PlayerState.ENDED) onEnded();
          if (e.data === YT.PlayerState.PLAYING) {
            isPlaying = true;
            pendingPlay = false;
            updatePlayIcon();
          }
          if (e.data === YT.PlayerState.PAUSED) {
            isPlaying = false;
            updatePlayIcon();
          }
        },
        onError: (e) => {
          console.warn('YT error', e.data);
          // Try next song
          setTimeout(() => next(), 500);
        }
      }
    });
  }

  function loadSong(idx) {
    if (idx < 0 || idx >= playlist.length) return;
    currentIndex = idx;
    const song = playlist[idx];
    updateMeta();

    if (audio) {
      try { audio.pause(); } catch (_) {}
      audio.removeAttribute('src');
    }
    if (ytPlayer) {
      try { ytPlayer.stopVideo(); } catch (_) {}
    }

    if (isYoutube(song)) {
      mode = 'youtube';
      const id = extractYTId(song.src);
      if (ytPlayer && ytPlayer.loadVideoById) {
        try {
          ytPlayer.loadVideoById(id);
        } catch (_) {
          createYTPlayer(id);
        }
      } else {
        createYTPlayer(id);
      }
    } else {
      mode = 'audio';
      if (audio) {
        audio.src = song.src || song.file || '';
        audio.load();
      }
    }
    try { Analytics.trackPlay(song.id || idx); } catch (_) {}
  }

  function togglePlay() {
    unlocked = true;
    if (currentIndex < 0 && playlist.length > 0) loadSong(0);
    if (isPlaying) pause();
    else play();
  }

  function play() {
    isPlaying = true;
    updatePlayIcon();
    if (mode === 'youtube') {
      if (ytPlayer && ytPlayer.playVideo) {
        try {
          ytPlayer.unMute && ytPlayer.unMute();
          ytPlayer.setVolume && ytPlayer.setVolume(settings.defaultVolume || 80);
          ytPlayer.playVideo();
        } catch (err) {
          console.warn('YT play failed', err);
          pendingPlay = true;
        }
      } else {
        pendingPlay = true;
        if (currentIndex >= 0 && playlist[currentIndex]) {
          createYTPlayer(extractYTId(playlist[currentIndex].src));
        }
      }
    } else if (audio && audio.src) {
      audio.play().then(() => {
        pendingPlay = false;
      }).catch(() => {
        pendingPlay = true;
        isPlaying = false;
        updatePlayIcon();
      });
    }
  }

  function pause() {
    isPlaying = false;
    pendingPlay = false;
    updatePlayIcon();
    if (mode === 'youtube' && ytPlayer) {
      try { ytPlayer.pauseVideo(); } catch (_) {}
    }
    if (audio) try { audio.pause(); } catch (_) {}
  }

  function updatePlayIcon() {
    const btn = document.getElementById('mini-play');
    if (!btn) return;
    btn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    btn.classList.toggle('playing', isPlaying);
    document.getElementById('music')?.classList.toggle('playing', isPlaying);
    updateMediaSession();
  }

  function prev() {
    unlocked = true;
    if (playlist.length === 0) return;
    let idx = currentIndex - 1;
    if (idx < 0) idx = playlist.length - 1;
    loadSong(idx);
    play();
  }

  function next() {
    unlocked = true;
    if (playlist.length === 0) return;
    let idx = isShuffle
      ? Math.floor(Math.random() * playlist.length)
      : (currentIndex + 1) % playlist.length;
    loadSong(idx);
    play();
  }

  function onEnded() {
    if (isRepeat) {
      if (mode === 'youtube' && ytPlayer) {
        try { ytPlayer.seekTo(0); ytPlayer.playVideo(); } catch (_) {}
      } else if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } else if (settings.autoNext !== false) {
      next();
    } else {
      isPlaying = false;
      updatePlayIcon();
    }
  }

  function reload() {
    const data = Storage.load();
    settings = data.settings || {};
    playlist = (data.music || []).filter(s => s.enabled !== false);
    renderMiniControls();
  }

  return { init, reload, play, pause, next, prev };
})();

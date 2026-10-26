/**
 * Admin Panel Logic
 */
(function () {
  const ICON_LIST = [
    { id: 'telegram', icon: 'fab fa-telegram' },
    { id: 'tiktok', icon: 'fab fa-tiktok' },
    { id: 'facebook', icon: 'fab fa-facebook' },
    { id: 'instagram', icon: 'fab fa-instagram' },
    { id: 'youtube', icon: 'fab fa-youtube' },
    { id: 'whatsapp', icon: 'fab fa-whatsapp' },
    { id: 'messenger', icon: 'fab fa-facebook-messenger' },
    { id: 'discord', icon: 'fab fa-discord' },
    { id: 'x', icon: 'fab fa-x-twitter' },
    { id: 'github', icon: 'fab fa-github' },
    { id: 'spotify', icon: 'fab fa-spotify' },
    { id: 'website', icon: 'fas fa-globe' },
    { id: 'music', icon: 'fas fa-music' },
    { id: 'link', icon: 'fas fa-link' }
  ];

  let data = null;
  let currentPage = 'dashboard';
  let dragSrc = null;

  // Auth check
  function checkAuth() {
    if (sessionStorage.getItem('admin_auth') === '1') {
      showApp();
      return;
    }
    document.getElementById('auth-btn').onclick = () => {
      const pw = document.getElementById('auth-pw').value;
      if (Storage.verifyPassword(pw)) {
        sessionStorage.setItem('admin_auth', '1');
        showApp();
      } else {
        document.getElementById('auth-err').classList.remove('hidden');
      }
    };
    document.getElementById('auth-pw').onkeydown = e => {
      if (e.key === 'Enter') document.getElementById('auth-btn').click();
    };
  }

  function showApp() {
    document.getElementById('auth-check').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    data = Storage.load();
    setupNav();
    renderPage('dashboard');
    document.getElementById('save-btn').onclick = saveAll;
    document.getElementById('logout-btn').onclick = () => {
      sessionStorage.removeItem('admin_auth');
      window.location.href = 'index.html';
    };
    document.getElementById('menu-toggle').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };
  }

  function setupNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.onclick = e => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        renderPage(el.dataset.page);
        document.getElementById('sidebar').classList.remove('open');
      };
    });
  }

  function renderPage(page) {
    currentPage = page;
    const titles = {
      dashboard: 'Dashboard', profile: 'Profile', links: 'Links', music: 'Music',
      media: 'Media Library', background: 'Background', appearance: 'Appearance',
      effects: 'Effects', popup: 'Popup / Announcement', analytics: 'Analytics',
      backup: 'Backup & Restore', security: 'Security', settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[page] || page;
    const container = document.getElementById('pages');
    const renderers = {
      dashboard: renderDashboard,
      profile: renderProfile,
      links: renderLinks,
      music: renderMusic,
      media: renderMedia,
      background: renderBackground,
      appearance: renderAppearance,
      effects: renderEffects,
      popup: renderPopup,
      analytics: renderAnalytics,
      backup: renderBackup,
      security: renderSecurity,
      settings: renderSettings
    };
    container.innerHTML = '';
    (renderers[page] || (() => {}))(container);
  }

  // ===== DASHBOARD =====
  function renderDashboard(c) {
    const links = data.links || [];
    const music = data.music || [];
    const stats = Analytics.getStats();
    c.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="val">${links.length}</div><div class="lbl">Total Links</div></div>
        <div class="stat-card"><div class="val">${links.filter(l => l.enabled !== false).length}</div><div class="lbl">Active Links</div></div>
        <div class="stat-card"><div class="val">${music.length}</div><div class="lbl">Total Songs</div></div>
        <div class="stat-card"><div class="val">${music.filter(s => s.enabled !== false).length}</div><div class="lbl">Active Songs</div></div>
        <div class="stat-card"><div class="val">${stats.totalClicks}</div><div class="lbl">Total Clicks</div></div>
        <div class="stat-card"><div class="val">${stats.visits}</div><div class="lbl">Visits</div></div>
        <div class="stat-card"><div class="val">${(data.background?.type || 'none')}</div><div class="lbl">Background</div></div>
        <div class="stat-card"><div class="val">${data.settings?.maintenanceMode ? 'OFF' : 'ON'}</div><div class="lbl">Website Status</div></div>
      </div>
      <div class="card">
        <h3><i class="fas fa-info-circle"></i> Quick Info</h3>
        <p style="font-size:0.9rem;color:rgba(255,255,255,0.6);line-height:1.6">
          Click <strong>Save Changes</strong> after editing any section.<br>
          Use <strong>Preview Website</strong> to see public view.<br>
          Data is stored in browser LocalStorage (static hosting limitation).
        </p>
      </div>
    `;
  }

  // ===== PROFILE =====
  function renderProfile(c) {
    const p = data.profile || {};
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-user"></i> Profile Settings</h3>
        <div class="form-group">
          <label>Logo</label>
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.8rem">
            <div style="width:70px;height:70px;border-radius:50%;background:rgba(168,85,247,0.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.8rem">
              ${p.logo ? `<img src="${esc(p.logo)}" style="width:100%;height:100%;object-fit:cover">` : '✨'}
            </div>
            <label class="file-label"><i class="fas fa-upload"></i> Upload Logo
              <input type="file" id="logo-file" accept="image/*">
            </label>
            ${p.logo ? `<button class="btn btn-danger" id="del-logo"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </div>
        <div class="form-group"><label>Name</label><input id="pf-name" value="${esc(p.name)}"></div>
        <div class="form-group"><label>Bio</label><textarea id="pf-bio" rows="3">${esc(p.bio)}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Status</label><input id="pf-status" value="${esc(p.status)}"></div>
          <div class="form-group"><label>Badge</label><input id="pf-badge" value="${esc(p.badge)}"></div>
        </div>
        <div class="form-group"><label>Logo Size (px)</label><input type="number" id="pf-size" value="${p.logoSize || 110}" min="60" max="200"></div>
        <div class="toggle-row"><span>Logo Animation</span><div class="toggle ${p.logoAnimation !== false ? 'on' : ''}" id="pf-anim"></div></div>
      </div>
    `;
    document.getElementById('logo-file')?.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        data.profile.logo = reader.result;
        renderPage('profile');
      };
      reader.readAsDataURL(f);
    });
    document.getElementById('del-logo')?.addEventListener('click', () => {
      data.profile.logo = '';
      renderPage('profile');
    });
    document.getElementById('pf-anim')?.addEventListener('click', function () {
      this.classList.toggle('on');
    });
  }

  function collectProfile() {
    data.profile.name = val('pf-name') || data.profile.name;
    data.profile.bio = val('pf-bio') ?? data.profile.bio;
    data.profile.status = val('pf-status') ?? data.profile.status;
    data.profile.badge = val('pf-badge') ?? data.profile.badge;
    data.profile.logoSize = parseInt(val('pf-size')) || 110;
    data.profile.logoAnimation = document.getElementById('pf-anim')?.classList.contains('on');
  }

  // ===== LINKS =====
  function renderLinks(c) {
    const links = data.links || [];
    c.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-primary" id="add-link"><i class="fas fa-plus"></i> Add Link</button>
      </div>
      <div id="links-list"></div>
    `;
    const list = document.getElementById('links-list');
    links.forEach((link, i) => {
      const el = document.createElement('div');
      el.className = 'list-item';
      el.draggable = true;
      el.dataset.idx = i;
      el.innerHTML = `
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <div class="info">
          <div class="name">${esc(link.name)} ${link.enabled === false ? '<span style="color:#f87171;font-size:0.7rem">(disabled)</span>' : ''}</div>
          <div class="sub">${esc(link.url)}</div>
        </div>
        <div class="actions">
          <button data-act="edit" title="Edit"><i class="fas fa-edit"></i></button>
          <button data-act="dup" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button data-act="toggle" title="Enable/Disable"><i class="fas fa-${link.enabled !== false ? 'eye' : 'eye-slash'}"></i></button>
          <button data-act="del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      `;
      el.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => linkAction(btn.dataset.act, i);
      });
      // Drag
      el.ondragstart = e => { dragSrc = i; e.dataTransfer.effectAllowed = 'move'; };
      el.ondragover = e => { e.preventDefault(); };
      el.ondrop = e => {
        e.preventDefault();
        const to = parseInt(el.dataset.idx);
        if (dragSrc === null || dragSrc === to) return;
        const item = data.links.splice(dragSrc, 1)[0];
        data.links.splice(to, 0, item);
        renderPage('links');
      };
      list.appendChild(el);
    });
    document.getElementById('add-link').onclick = () => openLinkModal();
  }

  function linkAction(act, idx) {
    const link = data.links[idx];
    if (act === 'edit') openLinkModal(link, idx);
    else if (act === 'dup') {
      const copy = { ...link, id: 'l' + Date.now() };
      data.links.splice(idx + 1, 0, copy);
      renderPage('links');
    } else if (act === 'toggle') {
      link.enabled = link.enabled === false ? true : false;
      renderPage('links');
    } else if (act === 'del') {
      if (confirm('Delete this link?')) {
        data.links.splice(idx, 1);
        renderPage('links');
      }
    }
  }

  function openLinkModal(link = null, idx = -1) {
    const isEdit = !!link;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${isEdit ? 'Edit Link' : 'Add Link'}</h3>
        <div class="form-group"><label>Name</label><input id="lm-name" value="${esc(link?.name || '')}"></div>
        <div class="form-group"><label>URL</label><input id="lm-url" value="${esc(link?.url || '')}" placeholder="https://"></div>
        <div class="form-group">
          <label>Icon</label>
          <div class="icon-grid" id="lm-icons"></div>
        </div>
        <div class="form-group"><label>Custom Icon URL (optional)</label><input id="lm-custom" value="${esc(link?.customIcon || '')}"></div>
        <div class="toggle-row"><span>Open in New Tab</span><div class="toggle ${link?.newTab === true ? 'on' : ''}" id="lm-newtab"></div></div>
        <div class="toggle-row"><span>Enabled</span><div class="toggle ${link?.enabled !== false ? 'on' : ''}" id="lm-enabled"></div></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="lm-cancel">Cancel</button>
          <button class="btn btn-primary" id="lm-save">${isEdit ? 'Update' : 'Add'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    let selectedIcon = link?.icon || 'link';
    const grid = overlay.querySelector('#lm-icons');
    ICON_LIST.forEach(ic => {
      const d = document.createElement('div');
      d.className = 'icon-opt' + (ic.id === selectedIcon ? ' selected' : '');
      d.innerHTML = `<i class="${ic.icon}"></i>`;
      d.onclick = () => {
        grid.querySelectorAll('.icon-opt').forEach(o => o.classList.remove('selected'));
        d.classList.add('selected');
        selectedIcon = ic.id;
      };
      grid.appendChild(d);
    });
    overlay.querySelectorAll('.toggle').forEach(t => t.onclick = () => t.classList.toggle('on'));
    overlay.querySelector('#lm-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#lm-save').onclick = () => {
      const obj = {
        id: link?.id || 'l' + Date.now(),
        name: overlay.querySelector('#lm-name').value || 'Link',
        url: overlay.querySelector('#lm-url').value || '#',
        icon: selectedIcon,
        customIcon: overlay.querySelector('#lm-custom').value,
        newTab: overlay.querySelector('#lm-newtab').classList.contains('on'),
        enabled: overlay.querySelector('#lm-enabled').classList.contains('on'),
        animation: true
      };
      if (isEdit) data.links[idx] = obj;
      else data.links.push(obj);
      overlay.remove();
      renderPage('links');
    };
  }

  // ===== MUSIC =====
  function renderMusic(c) {
    const songs = data.music || [];
    c.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-primary" id="add-song"><i class="fas fa-plus"></i> Add Song</button>
      </div>
      <div id="songs-list"></div>
      <div class="card" style="margin-top:1rem">
        <h3>Music Settings</h3>
        <div class="toggle-row"><span>Auto Play Music</span><div class="toggle ${data.settings?.autoPlayMusic ? 'on' : ''}" id="ms-autoplay"></div></div>
        <div class="toggle-row"><span>Auto Next</span><div class="toggle ${data.settings?.autoNext !== false ? 'on' : ''}" id="ms-autonext"></div></div>
        <div class="form-group"><label>Default Volume (0-100)</label><input type="number" id="ms-vol" value="${data.settings?.defaultVolume || 70}" min="0" max="100"></div>
      </div>
    `;
    const list = document.getElementById('songs-list');
    songs.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'list-item';
      el.draggable = true;
      el.dataset.idx = i;
      el.innerHTML = `
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <div class="info">
          <div class="name">${esc(s.title)} ${s.enabled === false ? '<span style="color:#f87171;font-size:0.7rem">(off)</span>' : ''}</div>
          <div class="sub">${esc(s.artist || '')}</div>
        </div>
        <div class="actions">
          <button data-act="edit"><i class="fas fa-edit"></i></button>
          <button data-act="toggle"><i class="fas fa-${s.enabled !== false ? 'eye' : 'eye-slash'}"></i></button>
          <button data-act="del"><i class="fas fa-trash"></i></button>
        </div>
      `;
      el.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => songAction(btn.dataset.act, i);
      });
      el.ondragstart = e => { dragSrc = i; };
      el.ondragover = e => e.preventDefault();
      el.ondrop = e => {
        e.preventDefault();
        const to = parseInt(el.dataset.idx);
        if (dragSrc === null || dragSrc === to) return;
        const item = data.music.splice(dragSrc, 1)[0];
        data.music.splice(to, 0, item);
        renderPage('music');
      };
      list.appendChild(el);
    });
    document.getElementById('add-song').onclick = () => openSongModal();
    document.querySelectorAll('#ms-autoplay, #ms-autonext').forEach(t => t.onclick = () => t.classList.toggle('on'));
  }

  function songAction(act, idx) {
    if (act === 'edit') openSongModal(data.music[idx], idx);
    else if (act === 'toggle') {
      data.music[idx].enabled = data.music[idx].enabled === false ? true : false;
      renderPage('music');
    } else if (act === 'del') {
      if (confirm('Delete this song?')) {
        data.music.splice(idx, 1);
        renderPage('music');
      }
    }
  }

  function openSongModal(song = null, idx = -1) {
    const isEdit = !!song;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${isEdit ? 'Edit Song' : 'Add Song'}</h3>
        <div class="form-group"><label>Title</label><input id="sm-title" value="${esc(song?.title || '')}"></div>
        <div class="form-group"><label>Artist</label><input id="sm-artist" value="${esc(song?.artist || '')}"></div>
        <div class="form-group">
          <label>YouTube URL or Video ID</label>
          <input id="sm-youtube" value="${esc((song?.type==='youtube' || (song?.src||'').startsWith('youtube:')) ? (song.src||'').replace('youtube:','') : '')}" placeholder="https://youtu.be/... or video ID">
        </div>
        <div class="form-group">
          <label>Or Upload Audio File</label>
          <label class="file-label"><i class="fas fa-upload"></i> Upload Audio
            <input type="file" id="sm-file" accept="audio/*,video/*">
          </label>
          <div id="sm-file-name" style="font-size:0.8rem;color:#aaa;margin-top:0.3rem">${song?.src && song?.type!=='youtube' ? 'File loaded' : ''}</div>
        </div>
        <div class="form-group"><label>Cover Image URL (optional)</label><input id="sm-cover" value="${esc(song?.cover || '')}"></div>
        <div class="toggle-row"><span>Enabled</span><div class="toggle ${song?.enabled !== false ? 'on' : ''}" id="sm-enabled"></div></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="sm-cancel">Cancel</button>
          <button class="btn btn-primary" id="sm-save">${isEdit ? 'Update' : 'Add'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    let fileData = (song?.type !== 'youtube' ? song?.src : '') || '';
    let songType = song?.type || 'audio';
    overlay.querySelector('#sm-file').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        fileData = reader.result;
        songType = 'audio';
        overlay.querySelector('#sm-file-name').textContent = f.name;
        overlay.querySelector('#sm-youtube').value = '';
      };
      reader.readAsDataURL(f);
    };
    overlay.querySelector('#sm-enabled').onclick = function () { this.classList.toggle('on'); };
    overlay.querySelector('#sm-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#sm-save').onclick = () => {
      const ytRaw = (overlay.querySelector('#sm-youtube').value || '').trim();
      let src = fileData || song?.src || '';
      let type = songType;
      if (ytRaw) {
        let id = ytRaw;
        const m = ytRaw.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
        if (m) id = m[1];
        else if (/^[a-zA-Z0-9_-]{11}$/.test(ytRaw)) id = ytRaw;
        src = 'youtube:' + id;
        type = 'youtube';
      }
      if (!src && !isEdit) { alert('Please enter YouTube URL or upload audio'); return; }
      const obj = {
        id: song?.id || 's' + Date.now(),
        title: overlay.querySelector('#sm-title').value || 'Untitled',
        artist: overlay.querySelector('#sm-artist').value || '',
        src: src,
        type: type,
        cover: overlay.querySelector('#sm-cover').value,
        enabled: overlay.querySelector('#sm-enabled').classList.contains('on')
      };
      if (isEdit) data.music[idx] = obj;
      else data.music.push(obj);
      overlay.remove();
      renderPage('music');
    };
  }

  function collectMusicSettings() {
    if (document.getElementById('ms-autoplay')) {
      data.settings.autoPlayMusic = document.getElementById('ms-autoplay').classList.contains('on');
      data.settings.autoNext = document.getElementById('ms-autonext').classList.contains('on');
      data.settings.defaultVolume = parseInt(val('ms-vol')) || 70;
    }
  }

  // ===== MEDIA =====
  function renderMedia(c) {
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-photo-video"></i> Media Library</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:1rem">
          Upload files here for reuse. Files are stored as Base64 in LocalStorage (size limited by browser quota ~5MB).
          For production, connect to cloud storage.
        </p>
        <label class="file-label"><i class="fas fa-upload"></i> Upload File
          <input type="file" id="media-upload" accept="image/*,video/*,audio/*">
        </label>
        <div id="media-list" style="margin-top:1rem"></div>
      </div>
    `;
    const media = data.media || { images: [], videos: [], audio: [], logos: [], icons: [] };
    const all = [...(media.images || []), ...(media.videos || []), ...(media.audio || []), ...(media.logos || []), ...(media.icons || [])];
    const list = document.getElementById('media-list');
    if (all.length === 0) {
      list.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.9rem">No media uploaded yet.</p>';
    } else {
      all.forEach((m, i) => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.innerHTML = `
          <div class="info"><div class="name">${esc(m.name)}</div><div class="sub">${m.type} · ${formatSize(m.size)}</div></div>
          <div class="actions"><button data-del="${i}"><i class="fas fa-trash"></i></button></div>
        `;
        list.appendChild(el);
      });
    }
    document.getElementById('media-upload').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { alert('File too large (max 2MB for LocalStorage)'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const type = f.type.startsWith('image') ? 'images' : f.type.startsWith('video') ? 'videos' : f.type.startsWith('audio') ? 'audio' : 'images';
        if (!data.media[type]) data.media[type] = [];
        data.media[type].push({ name: f.name, type, size: f.size, data: reader.result, id: 'm' + Date.now() });
        Storage.save(data);
        renderPage('media');
        toast('Uploaded');
      };
      reader.readAsDataURL(f);
    };
  }

  // ===== BACKGROUND =====
  function renderBackground(c) {
    const bg = data.background || {};
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-image"></i> Background</h3>
        <div class="form-group">
          <label>Type</label>
          <select id="bg-type">
            <option value="none" ${bg.type === 'none' ? 'selected' : ''}>None</option>
            <option value="image" ${bg.type === 'image' ? 'selected' : ''}>Image</option>
            <option value="video" ${bg.type === 'video' ? 'selected' : ''}>Video</option>
          </select>
        </div>
        <div class="form-group">
          <label>Upload Image</label>
          <label class="file-label"><i class="fas fa-upload"></i> Choose Image
            <input type="file" id="bg-img-file" accept="image/*">
          </label>
          ${bg.image ? '<span style="font-size:0.8rem;color:#4ade80;margin-left:0.5rem">✓ Image set</span>' : ''}
        </div>
        <div class="form-group">
          <label>Upload Video</label>
          <label class="file-label"><i class="fas fa-upload"></i> Choose Video
            <input type="file" id="bg-vid-file" accept="video/*">
          </label>
          ${bg.video ? '<span style="font-size:0.8rem;color:#4ade80;margin-left:0.5rem">✓ Video set</span>' : ''}
        </div>
        <div class="form-row">
          <div class="form-group"><label>Overlay (0-1)</label><input type="number" id="bg-overlay" value="${bg.overlay ?? 0.45}" min="0" max="1" step="0.05"></div>
          <div class="form-group"><label>Brightness (0.5-1.5)</label><input type="number" id="bg-bright" value="${bg.brightness ?? 1}" min="0.5" max="1.5" step="0.05"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Blur (px)</label><input type="number" id="bg-blur" value="${bg.blur ?? 0}" min="0" max="20"></div>
          <div class="form-group"><label>Opacity (0-1)</label><input type="number" id="bg-opacity" value="${bg.opacity ?? 1}" min="0" max="1" step="0.05"></div>
        </div>
        <div class="toggle-row"><span>Video Loop</span><div class="toggle ${bg.loop !== false ? 'on' : ''}" id="bg-loop"></div></div>
        <div class="toggle-row"><span>Video Autoplay</span><div class="toggle ${bg.autoplay !== false ? 'on' : ''}" id="bg-autoplay"></div></div>
        <button class="btn btn-danger" id="bg-clear" style="margin-top:0.8rem"><i class="fas fa-trash"></i> Clear Background</button>
      </div>
    `;
    document.getElementById('bg-img-file').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) { alert('Max 3MB'); return; }
      const reader = new FileReader();
      reader.onload = () => { data.background.image = reader.result; data.background.type = 'image'; renderPage('background'); };
      reader.readAsDataURL(f);
    };
    document.getElementById('bg-vid-file').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { alert('Max 4MB for video in LocalStorage'); return; }
      const reader = new FileReader();
      reader.onload = () => { data.background.video = reader.result; data.background.type = 'video'; renderPage('background'); };
      reader.readAsDataURL(f);
    };
    document.getElementById('bg-loop').onclick = function () { this.classList.toggle('on'); };
    document.getElementById('bg-autoplay').onclick = function () { this.classList.toggle('on'); };
    document.getElementById('bg-clear').onclick = () => {
      data.background.image = '';
      data.background.video = '';
      data.background.type = 'none';
      renderPage('background');
    };
  }

  function collectBackground() {
    if (!document.getElementById('bg-type')) return;
    data.background.type = val('bg-type');
    data.background.overlay = parseFloat(val('bg-overlay')) || 0.45;
    data.background.brightness = parseFloat(val('bg-bright')) || 1;
    data.background.blur = parseInt(val('bg-blur')) || 0;
    data.background.opacity = parseFloat(val('bg-opacity')) || 1;
    data.background.loop = document.getElementById('bg-loop')?.classList.contains('on');
    data.background.autoplay = document.getElementById('bg-autoplay')?.classList.contains('on');
  }

  // ===== APPEARANCE =====
  function renderAppearance(c) {
    const a = data.appearance || {};
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-palette"></i> Appearance</h3>
        <div class="form-group"><label>Button Size (px)</label><input type="number" id="ap-btnsize" value="${a.buttonSize || 58}" min="40" max="80"></div>
        <div class="form-group"><label>Animation Speed (0.5-2)</label><input type="number" id="ap-speed" value="${a.animationSpeed || 1}" min="0.5" max="2" step="0.1"></div>
        <div class="toggle-row"><span>Glow Effects</span><div class="toggle ${a.glow !== false ? 'on' : ''}" id="ap-glow"></div></div>
        <div class="toggle-row"><span>Shadows</span><div class="toggle ${a.shadow !== false ? 'on' : ''}" id="ap-shadow"></div></div>
      </div>
    `;
    document.querySelectorAll('#ap-glow, #ap-shadow').forEach(t => t.onclick = () => t.classList.toggle('on'));
  }

  function collectAppearance() {
    if (!document.getElementById('ap-btnsize')) return;
    data.appearance.buttonSize = parseInt(val('ap-btnsize')) || 58;
    data.appearance.animationSpeed = parseFloat(val('ap-speed')) || 1;
    data.appearance.glow = document.getElementById('ap-glow')?.classList.contains('on');
    data.appearance.shadow = document.getElementById('ap-shadow')?.classList.contains('on');
  }

  // ===== EFFECTS =====
  function renderEffects(c) {
    const e = data.effects || {};
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-magic"></i> Effects</h3>
        <div class="toggle-row"><span>Emoji Trail</span><div class="toggle ${e.emojiTrail !== false ? 'on' : ''}" id="ef-trail"></div></div>
        <div class="toggle-row"><span>Click Effect</span><div class="toggle ${e.click !== false ? 'on' : ''}" id="ef-click"></div></div>
        <div class="toggle-row"><span>Touch Effect</span><div class="toggle ${e.touch !== false ? 'on' : ''}" id="ef-touch"></div></div>
        <div class="form-group"><label>Density (0.2-1)</label><input type="number" id="ef-density" value="${e.density || 0.6}" min="0.2" max="1" step="0.1"></div>
        <div class="form-group"><label>Speed (0.5-2)</label><input type="number" id="ef-speed" value="${e.speed || 1}" min="0.5" max="2" step="0.1"></div>
        <div class="form-group"><label>Emojis (comma separated)</label><input id="ef-emojis" value="${(e.emojis || []).join(',')}"></div>
      </div>
    `;
    document.querySelectorAll('#ef-trail, #ef-click, #ef-touch').forEach(t => t.onclick = () => t.classList.toggle('on'));
  }

  function collectEffects() {
    if (!document.getElementById('ef-trail')) return;
    data.effects.emojiTrail = document.getElementById('ef-trail').classList.contains('on');
    data.effects.click = document.getElementById('ef-click').classList.contains('on');
    data.effects.touch = document.getElementById('ef-touch').classList.contains('on');
    data.effects.density = parseFloat(val('ef-density')) || 0.6;
    data.effects.speed = parseFloat(val('ef-speed')) || 1;
    data.effects.emojis = (val('ef-emojis') || '❤️,✨,⭐').split(',').map(s => s.trim()).filter(Boolean);
  }

  // ===== POPUP =====
  function renderPopup(c) {
    const p = data.popup || {};
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-bullhorn"></i> Popup / Announcement</h3>
        <div class="toggle-row"><span>Enable Popup</span><div class="toggle ${p.enabled ? 'on' : ''}" id="pp-enabled"></div></div>
        <div class="form-group"><label>Title</label><input id="pp-title" value="${esc(p.title || '')}"></div>
        <div class="form-group"><label>Description</label><textarea id="pp-desc" rows="3">${esc(p.description || '')}</textarea></div>
        <div class="form-group"><label>Image URL</label><input id="pp-image" value="${esc(p.image || '')}"></div>
        <div class="form-group"><label>Button Text</label><input id="pp-btntext" value="${esc(p.buttonText || '')}"></div>
        <div class="form-group"><label>Button Link</label><input id="pp-btnlink" value="${esc(p.buttonLink || '')}"></div>
        <div class="form-group">
          <label>Display Mode</label>
          <select id="pp-mode">
            <option value="every" ${p.mode === 'every' ? 'selected' : ''}>Every Visit</option>
            <option value="session" ${p.mode === 'session' || !p.mode ? 'selected' : ''}>Once per Session</option>
            <option value="day" ${p.mode === 'day' ? 'selected' : ''}>Once per Day</option>
          </select>
        </div>
      </div>
    `;
    document.getElementById('pp-enabled').onclick = function () { this.classList.toggle('on'); };
  }

  function collectPopup() {
    if (!document.getElementById('pp-enabled')) return;
    data.popup.enabled = document.getElementById('pp-enabled').classList.contains('on');
    data.popup.title = val('pp-title');
    data.popup.description = val('pp-desc');
    data.popup.image = val('pp-image');
    data.popup.buttonText = val('pp-btntext');
    data.popup.buttonLink = val('pp-btnlink');
    data.popup.mode = val('pp-mode');
  }

  // ===== ANALYTICS =====
  function renderAnalytics(c) {
    const stats = Analytics.getStats();
    const links = data.links || [];
    let linkRows = Object.entries(stats.linkClicks || {}).map(([id, cnt]) => {
      const link = links.find(l => l.id === id);
      return `<div class="list-item"><div class="info"><div class="name">${esc(link?.name || id)}</div></div><div style="font-weight:700;color:#c084fc">${cnt}</div></div>`;
    }).join('') || '<p style="color:rgba(255,255,255,0.4)">No clicks yet</p>';
    c.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="val">${stats.totalClicks}</div><div class="lbl">Total Clicks</div></div>
        <div class="stat-card"><div class="val">${stats.visits}</div><div class="lbl">Visits</div></div>
      </div>
      <div class="card"><h3>Clicks per Link</h3>${linkRows}</div>
      <div class="card">
        <h3>Note</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.5)">
          These are local browser analytics only. For real visitor analytics (unique visitors, countries, devices),
          connect a backend or third-party service (e.g. Plausible, Umami, Google Analytics).
        </p>
      </div>
    `;
  }

  // ===== BACKUP =====
  function renderBackup(c) {
    c.innerHTML = `
      <div class="card" style="border:1px solid rgba(168,85,247,0.4)">
        <h3><i class="fas fa-globe"></i> Publish សម្រាប់ភ្ញៀវទាំងអស់</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.65);margin-bottom:0.75rem;line-height:1.5">
          ការកែក្នុង Admin រក្សាទុកតែក្នុង browser របស់អ្នក។ ដើម្បីឱ្យ Chrome / Telegram / ទូរស័ព្ទផ្សេងឃើញប៊ូតុង និងការកំណត់ថ្មី៖
        </p>
        <ol style="font-size:0.85rem;color:rgba(255,255,255,0.55);margin:0 0 1rem 1.2rem;line-height:1.6">
          <li>ចុច <b>Copy Publish Code</b> ខាងក្រោម</li>
          <li>បើកឯកសារ <code>config.js</code> → លុប <code>null</code> ហើយបិទភ្ជាប់ code ដែល copy</li>
          <li>Deploy ឡើងវិញ (git push / Vercel / Render)</li>
        </ol>
        <button class="btn btn-primary" id="publish-copy-btn"><i class="fas fa-copy"></i> Copy Publish Code</button>
        <p id="publish-copy-msg" style="font-size:0.8rem;color:#4ade80;margin-top:0.6rem;display:none">Copied! Paste into config.js then redeploy.</p>
      </div>
      <div class="card">
        <h3><i class="fas fa-download"></i> Export</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:1rem">Download all settings as JSON backup.</p>
        <button class="btn btn-secondary" id="export-btn"><i class="fas fa-download"></i> Export Data</button>
      </div>
      <div class="card">
        <h3><i class="fas fa-upload"></i> Import</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:1rem">Restore from a previously exported JSON file.</p>
        <label class="file-label"><i class="fas fa-upload"></i> Import JSON
          <input type="file" id="import-file" accept=".json,application/json">
        </label>
      </div>
      <div class="card">
        <h3><i class="fas fa-exclamation-triangle"></i> Reset Website</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:1rem">This will reset ALL settings to default. Cannot be undone.</p>
        <button class="btn btn-danger" id="reset-btn"><i class="fas fa-trash-alt"></i> Reset Website</button>
      </div>
    `;
    document.getElementById('publish-copy-btn').onclick = () => {
      try {
        const code = Storage.getPublishCode();
        navigator.clipboard.writeText(code).then(() => {
          const msg = document.getElementById('publish-copy-msg');
          if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 4000); }
          toast('Publish code copied!');
        }).catch(() => {
          // Fallback for older browsers
          prompt('Copy this code and paste into config.js:', code);
        });
      } catch (e) {
        alert('Could not generate publish code');
      }
    };
    document.getElementById('export-btn').onclick = () => Storage.exportData();
    document.getElementById('import-file').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (Storage.importData(reader.result)) {
          data = Storage.load();
          toast('Imported successfully');
          renderPage('dashboard');
        } else {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(f);
    };
    document.getElementById('reset-btn').onclick = () => {
      if (confirm('Are you sure you want to reset all website settings?\n\nThis cannot be undone.')) {
        if (confirm('Final confirmation: Reset everything?')) {
          data = Storage.reset();
          toast('Website reset');
          renderPage('dashboard');
        }
      }
    };
  }

  // ===== SECURITY =====
  function renderSecurity(c) {
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-key"></i> Change Password</h3>
        <div class="form-group"><label>Current Password</label><input type="password" id="sec-current"></div>
        <div class="form-group"><label>New Password</label><input type="password" id="sec-new"></div>
        <div class="form-group"><label>Confirm New Password</label><input type="password" id="sec-confirm"></div>
        <button class="btn btn-primary" id="sec-change">Change Password</button>
      </div>
      <div class="card">
        <h3>Session</h3>
        <button class="btn btn-secondary" id="sec-clear"><i class="fas fa-sign-out-alt"></i> Clear Admin Session</button>
      </div>
      <div class="card">
        <h3>Note on Security</h3>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);line-height:1.6">
          Default password is <strong>789789</strong>. Password is stored as a simple hash for this static demo.
          For production, use a real backend with proper authentication (bcrypt/argon2 + sessions/JWT).
        </p>
      </div>
    `;
    document.getElementById('sec-change').onclick = () => {
      const cur = val('sec-current');
      const nw = val('sec-new');
      const conf = val('sec-confirm');
      if (!Storage.verifyPassword(cur)) { alert('Current password incorrect'); return; }
      if (nw.length < 4) { alert('New password too short'); return; }
      if (nw !== conf) { alert('Passwords do not match'); return; }
      Storage.setPassword(nw);
      toast('Password changed');
      document.getElementById('sec-current').value = '';
      document.getElementById('sec-new').value = '';
      document.getElementById('sec-confirm').value = '';
    };
    document.getElementById('sec-clear').onclick = () => {
      sessionStorage.removeItem('admin_auth');
      window.location.href = 'index.html';
    };
  }

  // ===== SETTINGS =====
  function renderSettings(c) {
    const s = data.settings || {};
    c.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-cog"></i> General Settings</h3>
        <div class="form-group"><label>Website Title</label><input id="st-title" value="${esc(s.title || '')}"></div>
        <div class="form-group"><label>SEO Description</label><textarea id="st-seo" rows="2">${esc(s.seoDescription || '')}</textarea></div>
        <div class="form-group"><label>Loading Duration (ms)</label><input type="number" id="st-load" value="${s.loadingDuration || 2000}" min="500" max="5000" step="100"></div>
        <div class="toggle-row"><span>Maintenance Mode</span><div class="toggle ${s.maintenanceMode ? 'on' : ''}" id="st-maint"></div></div>
        <div class="toggle-row"><span>Disable Text Selection</span><div class="toggle ${s.disableTextSelection ? 'on' : ''}" id="st-noselect"></div></div>
        <div class="toggle-row"><span>Disable Right Click</span><div class="toggle ${s.disableRightClick ? 'on' : ''}" id="st-noright"></div></div>
      </div>
    `;
    document.querySelectorAll('#st-maint, #st-noselect, #st-noright').forEach(t => t.onclick = () => t.classList.toggle('on'));
  }

  function collectSettings() {
    if (!document.getElementById('st-title')) return;
    data.settings.title = val('st-title') || 'Premium Bio';
    data.settings.seoDescription = val('st-seo');
    data.settings.loadingDuration = parseInt(val('st-load')) || 2000;
    data.settings.maintenanceMode = document.getElementById('st-maint')?.classList.contains('on');
    data.settings.disableTextSelection = document.getElementById('st-noselect')?.classList.contains('on');
    data.settings.disableRightClick = document.getElementById('st-noright')?.classList.contains('on');
  }

  // ===== SAVE =====
  function saveAll() {
    // Collect from current page
    if (currentPage === 'profile') collectProfile();
    if (currentPage === 'music') collectMusicSettings();
    if (currentPage === 'background') collectBackground();
    if (currentPage === 'appearance') collectAppearance();
    if (currentPage === 'effects') collectEffects();
    if (currentPage === 'popup') collectPopup();
    if (currentPage === 'settings') collectSettings();

    Storage.save(data);
    toast('Saved successfully');
  }

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2500);
  }

  function val(id) {
    return document.getElementById(id)?.value ?? '';
  }
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
  function formatSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  // Start
  checkAuth();
})();

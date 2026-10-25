/* Zone — application shell: navigation, top bar, router, universal search, mini-player, ambience panel. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;

  App.NAV = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'reading', label: 'Reading', icon: 'book' },
    { id: 'videos', label: 'Videos', icon: 'video' },
    { id: 'games', label: 'Games', icon: 'games' },
    { id: 'chess', label: 'Chess', icon: 'chess' },
    { id: 'music', label: 'Music', icon: 'music' },
    { id: 'all', label: 'All', icon: 'all' },
  ];

  /* ---------------- sidebar + bottom nav ---------------- */
  function renderNav() {
    const sb = $('#sidebar');
    sb.innerHTML = `
      <a class="brand" href="#/home" aria-label="Zone home">
        <span class="brand-pip">${App.pip('idle', { size: 40 })}</span>
        <span class="brand-text"><b>Zone</b><small>get in the zone</small></span>
      </a>
      <ul class="nav-list">
        ${App.NAV.map((n, i) => `<li><a class="nav-item" href="#/${n.id}" data-nav="${n.id}">${icon(n.icon)}<span class="nav-label">${n.label}${App.sketch.scribbleUnder(10 + i)}</span></a></li>`).join('')}
      </ul>
      <div class="nav-foot">
        <a class="nav-item" href="#/favorites" data-nav="favorites">${icon('heart')}<span class="nav-label">Favorites${App.sketch.scribbleUnder(30)}</span></a>
        <a class="nav-item" href="#/settings" data-nav="settings">${icon('settings')}<span class="nav-label">Settings${App.sketch.scribbleUnder(31)}</span></a>
        <div class="nav-note hand">made by hand, kept warm</div>
      </div>`;
    $('#bottom-nav').innerHTML = App.NAV.map((n) => `<a class="bn-item" href="#/${n.id}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span></a>`).join('');
  }
  function markNav(page) {
    $$('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === page;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------------- top bar ---------------- */
  const THEME_ICON = { auto: 'auto', light: 'sun', dark: 'moon' };
  function renderTopbar() {
    const mode = App.settings.get('theme');
    $('#topbar').innerHTML = `
      <a class="tb-brand" href="#/home" aria-label="Zone home">${App.pip('idle', { size: 30 })}<b>Zone</b></a>
      <button class="search-trigger" type="button" data-act="search" aria-label="Search everything (press / )">
        ${icon('search')}<span>Search books, videos, games, music…</span><kbd>/</kbd>
      </button>
      <div class="tb-actions">
        <button class="icon-btn tb-search-sm" type="button" data-act="search" aria-label="Search">${icon('search')}</button>
        <button class="icon-btn amb-btn ${App.ambient.anyOn() || App.focus.running ? 'is-on' : ''}" type="button" data-act="ambient" aria-label="Ambience and focus timer" aria-expanded="false">${icon('rain')}<span class="amb-dot" aria-hidden="true"></span></button>
        <button class="icon-btn" type="button" data-act="theme" aria-label="Theme: ${mode}. Click to change">${icon(THEME_ICON[mode] || 'auto')}</button>
        <a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a>
      </div>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !b.closest('#topbar')) return;
    const act = b.dataset.act;
    if (act === 'search') openSearch();
    if (act === 'ambient') toggleAmbient(b);
    if (act === 'theme') {
      const order = ['auto', 'light', 'dark'], cur = App.settings.get('theme'), next = order[(order.indexOf(cur) + 1) % 3];
      App.settings.set('theme', next);
      App.toast(next === 'auto' ? `Theme: Automatic (light ${App.settings.get('dayStart')}:00–${App.settings.get('nightStart')}:00)` : `Theme: ${next}`);
    }
  });
  App.on('settings', renderTopbar);
  App.on('ambient', () => { const b = $('.amb-btn'); if (b) b.classList.toggle('is-on', App.ambient.anyOn() || App.focus.running); });

  /* ---------------- router ---------------- */
  let cleanup = null, currentPage = null;
  App.route = () => {
    const raw = (location.hash || '#/home').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean).map(decodeURIComponent);
    let page = parts[0] || 'home';
    if (!App.pages[page]) page = 'notfound';
    return { page, params: parts.slice(1) };
  };
  App.go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
  function render() {
    const { page, params } = App.route();
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    const view = $('#view');
    const samePage = currentPage === page;
    currentPage = page;
    document.body.dataset.page = page;
    markNav(page);
    view.classList.remove('enter');
    view.innerHTML = '';
    try {
      const mod = App.pages[page];
      cleanup = mod.render(view, params) || null;
      document.title = (typeof mod.title === 'function' ? mod.title(params) : mod.title) + ' · Zone';
    } catch (e) {
      console.error(e);
      view.innerHTML = App.ui.errorState('Something went wrong opening this page.', 'Try going back home.');
    }
    void view.offsetWidth; view.classList.add('enter');
    if (!samePage || !params.length) window.scrollTo(0, 0);
    const h = view.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    updateMini();
  }
  App.rerender = render;
  App.currentPage = () => currentPage;
  window.addEventListener('hashchange', render);

  App.pages.notfound = {
    title: 'Not found',
    render(root) { root.innerHTML = `<section class="page">${App.ui.empty('curious', 'This corner of the zone is empty', 'The page you were looking for does not exist.', '<a class="btn btn-primary" href="#/home">Go home</a>')}</section>`; },
  };

  /* ---------------- shared UI snippets ---------------- */
  App.ui = {
    empty(pose, title, text, actions = '') {
      return `<div class="empty"><div class="empty-art">${App.pip(pose, { size: 84 })}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actions ? `<div class="empty-actions">${actions}</div>` : ''}</div>`;
    },
    emptyDoodle(doodle, title, text, actions = '') {
      return `<div class="empty"><div class="empty-art doodle-wrap">${App.doodle[doodle]()}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actions ? `<div class="empty-actions">${actions}</div>` : ''}</div>`;
    },
    errorState(title, text) { return `<section class="page"><div class="empty error">${App.pip('curious', { size: 80 })}<h3>${esc(title)}</h3><p>${esc(text)}</p><a class="btn btn-primary" href="#/home">Home</a></div></section>`; },
    favBtn(type, id, title, cls = '') {
      const on = App.fav.has(type, id);
      return `<button type="button" class="icon-btn fav-btn ${on ? 'on' : ''} ${cls}" data-fav="${esc(type)}|${esc(id)}|${esc(title)}" aria-pressed="${on}" aria-label="${on ? 'Remove from' : 'Add to'} favorites: ${esc(title)}">${icon('heart')}</button>`;
    },
    sectionHead(title, link, linkLabel = 'See all', seed = 2) {
      return `<div class="sec-head"><h2>${esc(title)}<span class="sec-scribble">${App.sketch.scribbleUnder(seed)}</span></h2>${link ? `<a class="link-more" href="${link}">${esc(linkLabel)} ${icon('right')}</a>` : ''}</div>`;
    },
    progress(p, label) { const v = Math.round(App.clamp(p || 0, 0, 1) * 100); return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}" aria-label="${esc(label || 'Progress')}"><span style="width:${v}%"></span></div>`; },
    chips(list, active, attr = 'data-chip') {
      return `<div class="chips" role="toolbar" aria-label="Filters">${list.map((c) => `<button type="button" class="chip ${c.id === active ? 'on' : ''}" ${attr}="${esc(c.id)}" aria-pressed="${c.id === active}">${esc(c.label)}</button>`).join('')}</div>`;
    },
  };
  /* global favorite toggles */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const [type, id, ...t] = b.dataset.fav.split('|');
    const on = App.fav.toggle({ type, id, title: t.join('|') });
    $$(`[data-fav^="${CSS.escape(type + '|' + id + '|')}"]`).forEach((x) => { x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop'); });
  });

  /* ---------------- universal search ---------------- */
  const TYPE_LABEL = { book: 'Books', article: 'Articles', video: 'Videos', game: 'Games', chess: 'Chess', track: 'Music', page: 'Pages' };
  const TYPE_ICON = { book: 'book', article: 'edit', video: 'video', game: 'games', chess: 'chess', track: 'music', page: 'right' };
  App.searchIndex = () => {
    const C = App.content, out = [];
    C.allBooks().forEach((b) => out.push({ type: b.kind === 'article' ? 'article' : 'book', id: b.id, title: b.title, sub: b.author || 'Your text', text: [b.blurb, b.cat, b.author].join(' '), route: '#/reading/read/' + b.id }));
    C.allVideos().forEach((v) => out.push({ type: 'video', id: v.id, title: v.title, sub: v.credit || 'Your video', text: [v.desc, v.cat, v.credit].join(' '), route: '#/videos/watch/' + v.id }));
    C.games.filter((g) => g.id !== 'chess').forEach((g) => out.push({ type: 'game', id: g.id, title: g.title, sub: g.cats.map((c) => (C.gameCats.find((x) => x.id === c) || {}).label).join(' · '), text: g.blurb + ' ' + g.cats.join(' '), route: '#/games/play/' + g.id }));
    out.push({ type: 'chess', id: 'ai', title: 'Play chess vs Snailfish', sub: 'Computer opponent · easy to hard', text: 'chess computer ai bot engine', route: '#/chess' });
    out.push({ type: 'chess', id: 'pvp', title: 'Two-player chess', sub: 'Pass and play on one board', text: 'chess human friend local', route: '#/chess/pvp' });
    out.push({ type: 'chess', id: 'rules', title: 'Chess rules', sub: 'How the pieces move', text: 'chess rules castling en passant promotion', route: '#/chess/rules' });
    C.allTracks().forEach((t) => out.push({ type: 'track', id: t.id, title: t.title, sub: t.artist, text: [t.category, t.mood, (C.musicCats.find((c) => c.id === t.category) || {}).label].join(' '), route: '#/music' }));
    App.store.get('playlists', []).forEach((p) => out.push({ type: 'track', id: 'pl:' + p.id, title: p.name, sub: 'Your playlist · ' + p.tracks.length + ' tracks', text: 'playlist', route: '#/music/playlist/' + p.id }));
    [['Settings', '#/settings', 'theme dark light motion accent'], ['Meet Pip — mascot expressions', '#/pip', 'pip mascot character expressions faces download svg png'], ['Favorites', '#/favorites', 'saved hearts'], ['Ambience & focus timer', null, 'rain fire wind pomodoro timer']].forEach(([t, r, x]) => out.push({ type: 'page', id: t, title: t, sub: 'Zone', text: x, route: r }));
    return out;
  };
  App.searchRun = (q, type = 'all', sort = 'rel') => {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    let res = App.searchIndex().filter((x) => type === 'all' || x.type === type);
    if (toks.length) {
      res = res.map((x) => {
        const t = x.title.toLowerCase(), o = (x.sub + ' ' + x.text).toLowerCase(); let s = 0;
        for (const k of toks) { if (t.startsWith(k)) s += 6; else if (t.includes(' ' + k)) s += 4; else if (t.includes(k)) s += 3; else if (o.includes(k)) s += 1; else return null; }
        return Object.assign({ score: s }, x);
      }).filter(Boolean);
    }
    if (sort === 'az') res.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'type') res.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
    else res.sort((a, b) => (b.score || 0) - (a.score || 0));
    return res;
  };

  let searchState = { q: '', type: 'all', sort: 'rel', active: 0 }, lastFocus = null;
  function openSearch(prefill) {
    const ov = $('#search-overlay');
    lastFocus = document.activeElement;
    if (typeof prefill === 'string') searchState.q = prefill;
    const types = [{ id: 'all', label: 'Everything' }].concat(['book', 'article', 'video', 'game', 'chess', 'track'].map((t) => ({ id: t, label: TYPE_LABEL[t] })));
    ov.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search">
        <div class="search-row">
          ${icon('search')}
          <input id="search-input" type="search" placeholder="Search the whole zone…" autocomplete="off" value="${esc(searchState.q)}" aria-label="Search" aria-controls="search-results">
          <button class="icon-btn" type="button" data-sclose aria-label="Close search">${icon('x')}</button>
        </div>
        <div class="search-tools">
          ${App.ui.chips(types, searchState.type, 'data-stype')}
          <label class="sort-sel"><span class="sr-only">Sort</span><select id="search-sort" aria-label="Sort results">
            <option value="rel">Best match</option><option value="az">A–Z</option><option value="type">By type</option></select></label>
        </div>
        <div id="search-results" class="search-results" role="listbox"></div>
        <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </div>`;
    ov.hidden = false;
    document.body.classList.add('no-scroll');
    $('#search-sort').value = searchState.sort;
    const input = $('#search-input');
    input.focus(); input.select();
    drawResults();
    input.addEventListener('input', () => { searchState.q = input.value; searchState.active = 0; drawResults(); });
    $('#search-sort').addEventListener('change', (e) => { searchState.sort = e.target.value; drawResults(); });
    ov.onclick = (e) => {
      if (e.target === ov || e.target.closest('[data-sclose]')) return closeSearch();
      const c = e.target.closest('[data-stype]');
      if (c) { searchState.type = c.dataset.stype; $$('[data-stype]', ov).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); searchState.active = 0; drawResults(); input.focus(); }
      const r = e.target.closest('[data-route]');
      if (r) openResult(r.dataset.route);
    };
    ov.onkeydown = (e) => {
      const items = $$('.sr-item', ov);
      if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); searchState.active = Math.min(items.length - 1, searchState.active + 1); hl(items); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); searchState.active = Math.max(0, searchState.active - 1); hl(items); }
      else if (e.key === 'Enter' && document.activeElement === input && items[searchState.active]) { e.preventDefault(); openResult(items[searchState.active].dataset.route); }
      else if (e.key === 'Tab') { // keep focus inside the panel
        const f = $$('input, button, select, [data-route]', ov).filter((x) => !x.disabled);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
  }
  function hl(items) { items.forEach((x, i) => { x.classList.toggle('active', i === searchState.active); x.setAttribute('aria-selected', i === searchState.active); }); if (items[searchState.active]) items[searchState.active].scrollIntoView({ block: 'nearest' }); }
  function openResult(route) {
    closeSearch();
    if (route === 'null' || !route) { toggleAmbient($('.amb-btn')); return; }
    App.go(route);
  }
  function drawResults() {
    const box = $('#search-results'); if (!box) return;
    const res = App.searchRun(searchState.q, searchState.type, searchState.sort);
    if (!res.length) { box.innerHTML = App.ui.empty('curious', 'Nothing found', searchState.q ? `No matches for “${searchState.q}”. Try a shorter word or another filter.` : 'Nothing in this category yet.'); return; }
    const groups = {};
    res.forEach((r) => (groups[r.type] = groups[r.type] || []).push(r));
    let i = 0;
    const order = searchState.sort === 'rel' && searchState.q ? [...new Set(res.map((r) => r.type))] : Object.keys(groups);
    box.innerHTML = order.map((t) => `<div class="sr-group"><h3>${TYPE_LABEL[t]} <span>${groups[t].length}</span></h3>${groups[t].slice(0, 30).map((r) => {
      const html = `<div class="sr-item ${i === searchState.active ? 'active' : ''}" role="option" tabindex="0" aria-selected="${i === searchState.active}" data-route="${esc(r.route)}"><span class="sr-ico">${icon(TYPE_ICON[r.type])}</span><span class="sr-txt"><b>${esc(r.title)}</b><small>${esc(r.sub || '')}</small></span>${icon('right', 'sr-go')}</div>`;
      i++; return html;
    }).join('')}</div>`).join('');
    $$('.sr-item', box).forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openResult(el.dataset.route); }));
  }
  function closeSearch() {
    const ov = $('#search-overlay'); ov.hidden = true; ov.innerHTML = '';
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  App.openSearch = openSearch;
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      if (App.currentPage() === 'games' && App.route().params[0] === 'play') return; // don't steal keys from games
      e.preventDefault(); openSearch();
    }
  });

  /* ---------------- ambience + focus panel ---------------- */
  let ambOpen = false;
  function toggleAmbient(btn) {
    const p = $('#ambient-panel');
    ambOpen = !ambOpen;
    if (btn) btn.setAttribute('aria-expanded', ambOpen);
    if (!ambOpen) { p.hidden = true; return; }
    drawAmbient(); p.hidden = false;
    const first = p.querySelector('button'); if (first) first.focus();
  }
  App.toggleAmbient = () => toggleAmbient($('.amb-btn'));
  function drawAmbient() {
    const p = $('#ambient-panel'), F = App.focus;
    p.innerHTML = `
      <div class="amb-head"><h2>Ambience</h2><button class="icon-btn" type="button" data-amb-close aria-label="Close ambience panel">${icon('x')}</button></div>
      <p class="amb-note">Tap a sound or drag its slider to play it. Nothing starts on its own.</p>
      <div class="amb-grid">${Object.entries(App.ambient.sounds).map(([id, s]) => `
        <div class="amb-item ${App.ambient.isOn(id) ? 'on' : ''}">
          <button type="button" class="amb-toggle" data-amb="${id}" aria-pressed="${App.ambient.isOn(id)}">${icon(s.icon)}<span>${s.label}</span><span class="amb-state">${App.ambient.isOn(id) ? '<i class="amb-meter"><b></b><b></b><b></b></i>playing' : 'off'}</span></button>
          <input type="range" min="0" max="1" step="0.01" value="${App.ambient.volume(id)}" data-ambvol="${id}" aria-label="${s.label} volume">
        </div>`).join('')}</div>
      <div class="amb-focus">
        <div class="amb-head"><h2>Focus timer</h2><span class="hand focus-label">${esc(F.label)}</span></div>
        <div class="focus-time" aria-live="off">${App.fmtTime(F.left)}</div>
        ${App.ui.progress(1 - F.left / F.total, 'Focus timer progress')}
        <div class="focus-presets">${[[25, 'Focus'], [50, 'Deep work'], [5, 'Short break'], [15, 'Long break']].map(([m, l]) => `<button type="button" class="chip" data-focus-preset="${m}" data-label="${l}">${m} min</button>`).join('')}</div>
        <div class="focus-ctrl">
          <button type="button" class="btn btn-primary" data-focus="toggle">${F.running ? icon('pause') + 'Pause' : icon('play') + 'Start'}</button>
          <button type="button" class="btn btn-ghost" data-focus="reset">${icon('refresh')}Reset</button>
        </div>
      </div>
      <button type="button" class="btn btn-ghost btn-sm amb-stop" data-amb-stop>Stop all sounds</button>`;
  }
  $('#ambient-panel').addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-amb-close]')) return toggleAmbient($('.amb-btn'));
    const a = t.closest('[data-amb]'); if (a) { App.ambient.toggle(a.dataset.amb); drawAmbient(); return; }
    if (t.closest('[data-amb-stop]')) { App.ambient.stopAll(); drawAmbient(); return; }
    const pr = t.closest('[data-focus-preset]'); if (pr) { App.focus.pause(); App.focus.total = App.focus.left = +pr.dataset.focusPreset * 60; App.focus.label = pr.dataset.label; drawAmbient(); return; }
    const fc = t.closest('[data-focus]');
    if (fc) { if (fc.dataset.focus === 'toggle') (App.focus.running ? App.focus.pause() : App.focus.start()); else App.focus.reset(); drawAmbient(); App.emit('ambient'); }
  });
  $('#ambient-panel').addEventListener('input', (e) => {
    const v = e.target.closest('[data-ambvol]'); if (!v) return;
    const id = v.dataset.ambvol, val = +v.value;
    App.ambient.setVolume(id, val);
    // dragging a slider up starts that sound; dragging it to zero stops it
    if (val > 0.02 && !App.ambient.isOn(id)) { App.ambient.toggle(id); refreshAmbState(); }
    else if (val <= 0.02 && App.ambient.isOn(id)) { App.ambient.toggle(id); refreshAmbState(); }
  });
  function refreshAmbState() {
    $$('#ambient-panel .amb-item').forEach((it) => {
      const b = it.querySelector('[data-amb]'), id = b.dataset.amb, on = App.ambient.isOn(id);
      it.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.querySelector('.amb-state').innerHTML = on ? '<i class="amb-meter"><b></b><b></b><b></b></i>playing' : 'off';
    });
  }
  $('#ambient-panel').addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleAmbient($('.amb-btn')); });
  document.addEventListener('click', (e) => {
    // ignore clicks on elements the panel just redrew (they're detached) and clicks inside the panel
    if (!ambOpen || !document.contains(e.target) || e.composedPath().includes($('#ambient-panel'))) return;
    if (!e.target.closest('.amb-btn') && !e.target.closest('[data-open-ambient]')) toggleAmbient($('.amb-btn'));
  });
  App.on('focus', (F) => {
    const el = $('#ambient-panel .focus-time'); if (el) { el.textContent = App.fmtTime(F.left); const bar = $('#ambient-panel .progress span'); if (bar) bar.style.width = (1 - F.left / F.total) * 100 + '%'; }
    const chip = $('.focus-chip'); if (chip) chip.textContent = App.fmtTime(F.left);
  });

  /* ---------------- mini-player ---------------- */
  function updateMini() {
    const mp = $('#mini-player'), P = App.player, t = P.current();
    const show = !!t && App.currentPage() !== 'music';
    mp.hidden = !show;
    document.body.classList.toggle('has-mini', show);
    if (!show) return;
    const playing = P.state.playing;
    mp.classList.toggle('playing', playing);
    mp.innerHTML = `
      <div class="mp-seek" data-mp-seek title="Seek"><span style="width:${(P.position() / (P.duration() || 1)) * 100}%"></span></div>
      <a class="mp-info" href="#/music" aria-label="Open music: ${esc(t.title)}">
        <span class="mp-art">${App.trackArt(t)}<span class="mp-notes" aria-hidden="true">${icon('note')}</span></span>
        <span class="mp-txt"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></span>
      </a>
      <div class="mp-ctrl">
        <button class="icon-btn" type="button" data-mp="prev" aria-label="Previous">${icon('prev')}</button>
        <button class="icon-btn mp-play" type="button" data-mp="toggle" aria-label="${playing ? 'Pause' : 'Play'}">${icon(playing ? 'pause' : 'play')}</button>
        <button class="icon-btn" type="button" data-mp="next" aria-label="Next">${icon('next')}</button>
      </div>
      <div class="mp-time">${App.fmtTime(P.position())} / ${App.fmtTime(P.duration())}</div>
      <label class="mp-vol">${icon('volume')}<input type="range" min="0" max="1" step="0.01" value="${P.state.volume}" data-mp-vol aria-label="Volume"></label>`;
  }
  App.updateMini = updateMini;
  $('#mini-player').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mp]');
    if (b) { const a = b.dataset.mp; if (a === 'toggle') App.player.toggle(); if (a === 'next') App.player.next(); if (a === 'prev') App.player.prev(); }
    const s = e.target.closest('[data-mp-seek]');
    if (s) { const r = s.getBoundingClientRect(); App.player.seek(((e.clientX - r.left) / r.width) * App.player.duration()); }
  });
  $('#mini-player').addEventListener('input', (e) => { if (e.target.matches('[data-mp-vol]')) App.player.setVolume(+e.target.value); });
  App.on('player', updateMini);
  App.on('player-time', () => {
    const mp = $('#mini-player'); if (mp.hidden) return;
    const P = App.player, bar = $('.mp-seek span', mp), tm = $('.mp-time', mp);
    if (bar) bar.style.width = (P.position() / (P.duration() || 1)) * 100 + '%';
    if (tm) tm.textContent = `${App.fmtTime(P.position())} / ${App.fmtTime(P.duration())}`;
  });

  /* ---------------- boot ---------------- */
  App.bootShell = () => { renderNav(); renderTopbar(); render(); };
})();

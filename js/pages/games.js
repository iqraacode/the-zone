/* Zone — Games: the cozy arcade (library, filters, favorites, bests) and the game launcher.
   Built-in games register on App.games[id] with mount(stage, api). External games (your own) load from games/<id>/index.html. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;

  /* ---------- small doodle art per game ---------- */
  const ART = {
    mine: '<circle cx="50" cy="56" r="20" class="d-fill-ink d-ink"/><path d="M62 40l8-8M70 32c4-2 6 1 9-2" class="d-ink"/><path d="M78 24l3-4M82 30l4 1M76 18l-1-4" class="d-accent"/><circle cx="43" cy="50" r="4" fill="#fffaf1"/>',
    arcade: '<rect x="20" y="40" width="60" height="38" rx="10" class="d-fill-a d-ink"/><path d="M50 40V24" class="d-ink"/><circle cx="50" cy="20" r="7" class="d-fill-c d-ink"/><circle cx="36" cy="59" r="5" class="d-fill-b d-ink"/><circle cx="64" cy="54" r="3.5" class="d-fill-paper d-ink"/><circle cx="68" cy="64" r="3.5" class="d-fill-paper d-ink"/>',
    golf: '<path d="M18 74c14-8 50-8 64 0" class="d-fill-a d-ink"/><path d="M58 70V24l18 7-18 7" class="d-ink"/><path d="M58 24l18 7-18 7z" class="d-fill-c d-ink"/><circle cx="34" cy="66" r="5" class="d-fill-paper d-ink"/>',
    racers: '<path d="M20 60l8-16h40l10 16v10H20z" class="d-fill-c d-ink"/><path d="M34 44l4-8h22l4 8" class="d-ink"/><circle cx="32" cy="70" r="7" class="d-fill-ink d-ink"/><circle cx="68" cy="70" r="7" class="d-fill-ink d-ink"/>',
    jump: '<path d="M14 80h72" class="d-ink"/><path d="M60 80V64h16v16M64 64v-6h8v6" class="d-fill-b d-ink"/><circle cx="34" cy="38" r="12" class="d-fill-b d-ink"/><path d="M28 50l-6 10M40 50l6 10" class="d-ink"/><path d="M50 30q8-8 16 0" class="d-ink d-thin" stroke-dasharray="3 4"/>',
    darts: '<circle cx="50" cy="52" r="30" class="d-fill-paper d-ink"/><circle cx="50" cy="52" r="19" class="d-fill-c d-ink"/><circle cx="50" cy="52" r="8" class="d-fill-a d-ink"/><path d="M50 52l26-26M72 22l6 4-2 6" class="d-ink"/>',
    dots: '<circle cx="26" cy="26" r="3.5" class="d-fill-ink"/><circle cx="50" cy="26" r="3.5" class="d-fill-ink"/><circle cx="74" cy="26" r="3.5" class="d-fill-ink"/><circle cx="26" cy="50" r="3.5" class="d-fill-ink"/><circle cx="50" cy="50" r="3.5" class="d-fill-ink"/><circle cx="74" cy="50" r="3.5" class="d-fill-ink"/><circle cx="26" cy="74" r="3.5" class="d-fill-ink"/><circle cx="50" cy="74" r="3.5" class="d-fill-ink"/><circle cx="74" cy="74" r="3.5" class="d-fill-ink"/><path d="M26 26h24v24H26z" class="d-fill-b d-ink"/><path d="M50 50h24" class="d-ink"/>',
    mochi: '<path d="M18 22v56l10 10h44l10-10V22" class="d-ink"/><path d="M26 80c-4-10 2-20 12-20s14 8 12 18c-1 4-6 6-12 6s-10-1-12-4z" class="d-fill-c d-ink"/><path d="M50 78c-2-12 6-22 16-20 9 2 10 14 6 22-2 3-20 4-22-2z" class="d-fill-a d-ink"/><path d="M40 56c-4-8 2-15 9-14 7 1 9 9 6 14-3 3-12 4-15 0z" class="d-fill-b d-ink"/><text x="38" y="78" class="ga-t" style="font-size:10px">8</text><text x="62" y="74" class="ga-t" style="font-size:10px">16</text><text x="47" y="54" class="ga-t" style="font-size:9px">4</text>',
    grid: '<rect x="18" y="18" width="30" height="30" rx="6" class="d-fill-b d-ink"/><rect x="52" y="18" width="30" height="30" rx="6" class="d-fill-c d-ink"/><rect x="18" y="52" width="30" height="30" rx="6" class="d-fill-a d-ink"/><rect x="52" y="52" width="30" height="30" rx="6" class="d-fill-paper d-ink"/><text x="33" y="39" class="ga-t">2</text><text x="67" y="39" class="ga-t">4</text><text x="33" y="73" class="ga-t">8</text>',
    cards: '<rect x="20" y="22" width="34" height="48" rx="6" class="d-fill-a d-ink" transform="rotate(-10 37 46)"/><rect x="46" y="26" width="34" height="48" rx="6" class="d-fill-paper d-ink" transform="rotate(8 63 50)"/><path d="M63 40c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9z" class="d-fill-b d-ink d-thin" transform="rotate(8 63 50)"/>',
    ttt: '<path d="M40 18c-1 22 1 44-1 66M62 17c1 22-1 44 1 66M16 40c22-1 46 1 68-1M17 62c22 1 45-1 67 1" class="d-ink"/><path d="M20 20l12 13M32 20l-12 13" class="d-accent"/><path d="M73 69a8 8 0 1 1-1-9" class="d-ink"/>',
    knight: '<path d="M36 82h30M39 82c0-9 3-13 8-17-6 1-10 2-13 1-3-2-2-6 1-8l9-10-2-10 6 4c10 1 16 9 14 21l-2 19" class="d-ink"/><circle cx="51" cy="40" r="1.6" class="d-fill-ink"/>',
    sudoku: '<path d="M18 18h64v64H18zM39 18v64M61 18v64M18 39h64M18 61h64" class="d-ink d-thin"/><text x="28" y="34" class="ga-t">5</text><text x="72" y="56" class="ga-t">3</text><text x="50" y="76" class="ga-t">9</text>',
    snake: '<path d="M18 70c10 0 10-16 20-16s10 16 20 16 10-30 24-30" class="d-ink" stroke-width="7"/><circle cx="82" cy="40" r="6" class="d-fill-a d-ink"/><circle cx="24" cy="30" r="5" class="d-fill-c d-ink"/>',
    words: '<rect x="14" y="36" width="22" height="26" rx="4" class="d-fill-a d-ink"/><rect x="39" y="36" width="22" height="26" rx="4" class="d-fill-b d-ink"/><rect x="64" y="36" width="22" height="26" rx="4" class="d-fill-paper d-ink"/><text x="25" y="55" class="ga-t">N</text><text x="50" y="55" class="ga-t">O</text><text x="75" y="55" class="ga-t">K</text>',
  };
  App.gameArt = (id) => { const g = App.content.game(id); return `<svg class="doodle game-art" viewBox="0 0 100 100" aria-hidden="true">${ART[g ? g.doodle : 'grid'] || ART.grid}</svg>`; };

  /* ---------- scores ---------- */
  App.scores = {
    all: () => App.store.get('gameScores', {}),
    get(id) { return this.all()[id] || {}; },
    /* lowerBetter: times/moves. returns 'first' (first record), 'best' (beat the record) or false */
    submit(id, key, value, lowerBetter) {
      let result = false;
      App.store.update('gameScores', {}, (all) => {
        const s = (all[id] = all[id] || {}); const cur = s[key];
        if (cur == null || (lowerBetter ? value < cur : value > cur)) { s[key] = value; result = cur == null ? 'first' : 'best'; }
      });
      return result;
    },
    bump(id, key, n = 1) { App.store.update('gameScores', {}, (all) => { const s = (all[id] = all[id] || {}); s[key] = (s[key] || 0) + n; }); },
  };
  const bestText = (g) => {
    const s = App.scores.get(g.id);
    if (g.id === 'minesweeper') return s['best-easy'] != null ? `Best ${App.fmtTime(s['best-easy'])} (easy)` : '';
    if (g.id === '2048') return s.best ? `Best ${s.best.toLocaleString()}` : '';
    if (g.id === 'memory') return s['best-16'] != null ? `Best ${s['best-16']} moves (4×4)` : '';
    if (g.id === 'tictactoe') return s.wins ? `${s.wins} win${s.wins === 1 ? '' : 's'} vs Pip` : '';
    if (g.id === 'chess') { const c = App.store.get('chessStats', { w: 0 }); return c.w ? `${c.w} win${c.w === 1 ? '' : 's'} vs Snailfish` : ''; }
    return '';
  };

  function celebrate(stage, title, text) {
    const host = stage.closest('.game-view') || stage;
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="cel-card">${App.pip('celebrate', { size: 96 })}<span class="cel-stars">${App.doodle.star('s1')}${App.doodle.star('s2')}${App.doodle.star('s3')}</span><h3>${esc(title)}</h3><p>${esc(text || '')}</p><button type="button" class="btn btn-primary btn-sm">Lovely</button></div>`;
    host.appendChild(el);
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); };
    el.querySelector('button').addEventListener('click', close);
    el.querySelector('button').focus({ preventScroll: true });
    setTimeout(close, 5000);
  }

  /* ---------- library ---------- */
  function library(root) {
    let cat = App.store.get('gamePrefs', { cat: 'all' }).cat || 'all', q = '';
    root.innerHTML = `
    <section class="page games-page">
      <div class="page-head">
        <div class="head-title"><span class="doodle-wrap has-doodle">${App.doodle.controller()}</span>
          <div><h1>The little arcade</h1><p>Small games for short breaks. Your best scores are kept on this device.</p></div></div>
      </div>
      <div class="lib-tools">
        <div class="search-box">${icon('search')}<input class="input" type="search" id="g-q" placeholder="Search games…" aria-label="Search games"></div>
        ${App.ui.chips([{ id: 'all', label: 'All' }, { id: 'fav', label: 'Favorites' }].concat(App.content.gameCats), cat, 'data-gcat')}
      </div>
      <div id="g-body"></div>
    </section>`;
    const body = $('#g-body', root);
    const card = (g, i) => `
      <article class="game-card has-ring has-doodle ${g.external && !g.club ? 'is-slot' : ''}">
        ${App.sketch.ring(80 + i)}
        <a class="gc-link" href="${g.route || '#/games/play/' + g.id}" aria-label="Play ${esc(g.title)}">
          <span class="gc-art">${App.gameArt(g.id)}</span>
          <span class="gc-body"><b>${esc(g.title)}</b><small>${esc(g.blurb)}</small>
            <span class="gc-tags">${g.cats.map((c) => `<span class="badge">${esc((App.content.gameCats.find((x) => x.id === c) || {}).label)}</span>`).join('')}${g.club ? '<span class="badge">1–3 players</span>' : ''}</span>
            ${bestText(g) ? `<span class="gc-best">${icon('trophy')}${esc(bestText(g))}</span>` : ''}</span>
        </a>
        ${App.ui.favBtn('game', g.id, g.title, 'gc-fav')}
      </article>`;
    const draw = () => {
      const t = q.toLowerCase();
      const list = App.content.games.filter((g) => (cat === 'all' || (cat === 'fav' ? App.fav.has('game', g.id) : g.cats.includes(cat))) && (!t || [g.title, g.blurb, g.cats.join(' ')].join(' ').toLowerCase().includes(t)));
      const recent = App.activity.list(['game']).map((x) => App.content.game(x.id)).filter(Boolean).slice(0, 4);
      let html = '';
      if (!q && cat === 'all' && recent.length) html += App.ui.sectionHead('Recently played', null, '', 3) + `<div class="grid game-grid">${recent.map(card).join('')}</div>`;
      html += App.ui.sectionHead(q ? 'Results' : cat === 'all' ? 'All games' : cat === 'fav' ? 'Favorite games' : (App.content.gameCats.find((c) => c.id === cat) || {}).label, null, '', 4);
      html += list.length ? `<div class="grid game-grid">${list.map(card).join('')}</div>`
        : App.ui.emptyDoodle('controller', cat === 'fav' ? 'No favorite games yet' : 'No games here', cat === 'fav' ? 'Tap the heart on a game to pin it here.' : 'Try another search or category.', '<button type="button" class="btn btn-ghost" data-gcat="all">Show all games</button>');
      body.innerHTML = html;
    };
    draw();
    $('#g-q', root).addEventListener('input', App.debounce((e) => { q = e.target.value.trim(); draw(); }, 120));
    root.addEventListener('click', (e) => {
      const c = e.target.closest('[data-gcat]');
      if (c) { cat = c.dataset.gcat; App.store.set('gamePrefs', { cat }); $$('.chips [data-gcat]', root).forEach((x) => { x.classList.toggle('on', x.dataset.gcat === cat); x.setAttribute('aria-pressed', x.dataset.gcat === cat); }); draw(); }
    });
  }

  /* ---------- launcher ---------- */
  function play(root, id) {
    const g = App.content.game(id);
    if (!g) { root.innerHTML = `<section class="page">${App.ui.emptyDoodle('controller', 'Game not found', 'This game is not in the arcade.', '<a class="btn btn-primary" href="#/games">Back to games</a>')}</section>`; return; }
    if (g.route) { App.go(g.route); return; }
    App.activity.log({ type: 'game', id: g.id, title: g.title, sub: 'Game' });
    App.scores.bump(g.id, 'plays');
    root.innerHTML = `
    <section class="game-view" data-game="${esc(g.id)}">
      <header class="gv-bar">
        <a class="icon-btn" href="#/games" aria-label="Back to games">${icon('left')}</a>
        <h1 class="gv-title">${esc(g.title)}</h1>
        <div class="gv-status" aria-live="polite"></div>
        <div class="gv-actions">
          ${App.ui.favBtn('game', g.id, g.title)}
          ${g.club ? `<button type="button" class="icon-btn" data-gv="help" aria-label="How to play">${icon('help')}</button><button type="button" class="icon-btn" data-gv="sound" aria-label="Sound on or off">${icon('volume')}</button>` : ''}
          <button type="button" class="icon-btn" data-gv="pause" aria-label="Pause" ${g.club ? '' : 'hidden'}>${icon('pause')}</button>
          <button type="button" class="icon-btn" data-gv="restart" aria-label="Restart" ${g.external && !g.club ? 'hidden' : ''}>${icon('refresh')}</button>
          <button type="button" class="icon-btn" data-gv="full" aria-label="Full screen">${icon('maximize')}</button>
        </div>
      </header>
      <div class="gv-stage"></div>
      <p class="gv-help muted"></p>
    </section>`;
    const view = $('.game-view', root), stage = $('.gv-stage', view);
    let inst = null;
    const api = {
      status: (html) => { $('.gv-status', view).innerHTML = html; },
      help: (txt) => { $('.gv-help', view).textContent = txt; },
      celebrate: (t, x) => celebrate(stage, t, x),
      canPause: (on) => { $('[data-gv="pause"]', view).hidden = !on; },
      setPaused: (p) => { const b = $('[data-gv="pause"]', view); b.innerHTML = icon(p ? 'play' : 'pause'); b.setAttribute('aria-label', p ? 'Resume' : 'Pause'); },
      scores: App.scores, id: g.id,
    };
    if (g.external) mountExternal(stage, g, api);
    else if (App.games[g.id]) { try { inst = App.games[g.id].mount(stage, api); } catch (e) { console.error(e); stage.innerHTML = App.ui.errorState('This game failed to start.', 'Try restarting it.'); } }
    view.addEventListener('click', (e) => {
      const b = e.target.closest('[data-gv]'); if (!b) return;
      const a = b.dataset.gv;
      const frame = view.querySelector('.ext-game.club');
      if (frame && ['pause', 'restart', 'help', 'sound'].includes(a)) { frame.contentWindow.postMessage({ source: 'nook', type: a }, location.origin); frame.focus(); if (a === 'sound') { b.classList.toggle('off'); b.innerHTML = icon(b.classList.contains('off') ? 'mute' : 'volume'); } return; }
      if (a === 'restart' && inst && inst.restart) inst.restart();
      if (a === 'pause' && inst && inst.togglePause) inst.togglePause();
      if (a === 'full') {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (view.requestFullscreen) view.requestFullscreen().catch(() => App.toast('Full screen is not available here.'));
        else App.toast('Full screen is not available here.');
      }
    });
    const onFs = () => { const b = $('[data-gv="full"]', view); if (b) b.innerHTML = icon(document.fullscreenElement ? 'minimize' : 'maximize'); };
    document.addEventListener('fullscreenchange', onFs);
    const onMsg = (e) => {
      if (e.origin !== location.origin || !e.data || e.data.source !== 'arcade') return;
      if (e.data.type === 'leave') App.go('#/games');
      if (e.data.type === 'result') {
        App.scores.bump(g.id, 'plays');
        if (e.data.tone === 'lose') App.toast('Good game! Try another round?');
        else api.celebrate(e.data.title || 'Nice one!', e.data.sub || 'Pip is cheering for you.');
      }
    };
    window.addEventListener('message', onMsg);
    const onVis = () => { if (document.hidden && inst && inst.pause) inst.pause(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('message', onMsg); document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('visibilitychange', onVis); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); if (inst && inst.destroy) inst.destroy(); };
  }

  /* your own game, served from games/<id>/index.html */
  function mountExternal(stage, g, api) {
    api.help('');
    const load = () => {
      stage.innerHTML = `<iframe class="ext-game ${g.club ? 'club' : ''}" src="${esc(g.external)}" title="${esc(g.title)}" allow="fullscreen; autoplay" loading="eager"></iframe>`;
      const fr = stage.querySelector('iframe');
      fr.addEventListener('load', () => { try { fr.focus(); fr.contentWindow.focus(); } catch (e) {} });
      api.help(g.club ? '' : 'Running your own game from ' + g.external);
    };
    const slot = () => {
      stage.innerHTML = `<div class="slot-empty">
        <div class="slot-art">${App.gameArt(g.id)}</div>
        <h2>Your ${esc(g.title)} goes here</h2>
        <p>This is a plug-in slot for the ${esc(g.title)} game you already have. Zone didn't build a copy — drop yours in and it will open right here.</p>
        <ol class="slot-steps">
          <li>Copy your game folder into <code>games/${esc(g.id)}/</code> inside the Zone project.</li>
          <li>Make sure its start page is <code>games/${esc(g.id)}/index.html</code>.</li>
          <li>Reload this page.</li>
        </ol>
        <button type="button" class="btn btn-ghost btn-sm" data-tryload>${icon('refresh')}Try loading it anyway</button>
      </div>`;
      $('[data-tryload]', stage).addEventListener('click', load);
    };
    stage.innerHTML = `<div class="slot-loading">${App.doodle.scribble()}<span>Looking for your game…</span></div>`;
    fetch(g.external, { method: 'GET', cache: 'no-store' }).then((r) => (r.ok ? load() : slot())).catch(slot);
  }

  App.pages.games = {
    title: (p) => (p[0] === 'play' && App.content.game(p[1]) ? App.content.game(p[1]).title : 'Games'),
    render(root, params) { return params[0] === 'play' ? play(root, params[1]) : library(root); },
  };
})();

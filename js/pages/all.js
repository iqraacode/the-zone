/* Zone — All (unified explorer) and Favorites. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;
  const FILTERS = [{ id: 'all', label: 'Everything' }, { id: 'book', label: 'Books' }, { id: 'article', label: 'Articles' }, { id: 'video', label: 'Videos' }, { id: 'game', label: 'Games' }, { id: 'chess', label: 'Chess' }, { id: 'track', label: 'Music' }];

  function universe() {
    const C = App.content, out = [];
    C.allBooks().forEach((b) => out.push([b.kind === 'article' ? 'article' : 'book', b.id]));
    C.allVideos().forEach((v) => out.push(['video', v.id]));
    C.games.filter((g) => g.id !== 'chess').forEach((g) => out.push(['game', g.id]));
    C.allTracks().forEach((t) => out.push(['track', t.id]));
    return out;
  }

  App.pages.all = {
    title: 'All',
    render(root) {
      const pref = App.store.get('allPrefs', { filter: 'all' });
      let q = '', filter = pref.filter || 'all', discoverSeed = Math.floor(Math.random() * 1e6);

      root.innerHTML = `
      <section class="page all-page">
        <div class="page-head">
          <div class="head-title"><span class="doodle-wrap">${App.doodle.map()}</span>
            <div><h1>Everything in one place</h1><p>Search and wander across books, films, games, chess and music.</p></div></div>
        </div>
        <div class="all-search">
          <div class="search-box">${icon('search')}<input class="input" id="all-q" type="search" placeholder="Search everything…" aria-label="Search everything"></div>
          ${App.ui.chips(FILTERS, filter, 'data-af')}
        </div>
        <div id="all-body"></div>
      </section>`;
      const body = $('#all-body', root);

      const draw = () => {
        if (q || filter !== 'all') {
          const res = App.searchRun(q, filter).filter((r) => r.type !== 'page' && !String(r.id).startsWith('pl:'));
          const cards = res.map((r) => App.ui.itemCard(r.type, r.id)).filter(Boolean);
          body.innerHTML = `<p class="muted result-count">${cards.length} result${cards.length === 1 ? '' : 's'}${q ? ` for “${esc(q)}”` : ''}</p>` +
            (cards.length ? `<div class="grid grid-cards">${cards.join('')}</div>` : App.ui.empty('curious', 'Nothing matched', 'Try a different word, or choose another filter.'));
          return;
        }
        const recent = App.activity.list();
        const journey = App.activity.list().filter((x) => { const p = App.ui.progressOf(x.type, x.id); return (p > 0.01 && p < 0.98) || x.type === 'track' || x.type === 'chess'; }).slice(0, 6);
        const favs = App.fav.list();
        const seen = new Set(recent.map((x) => x.type + x.id));
        const fresh = App.shuffle(universe().filter(([t, id]) => !seen.has(t + id)), App.rng(discoverSeed)).slice(0, 4);
        const chessStats = App.store.get('chessStats', { w: 0, l: 0, d: 0 });
        const pls = App.store.get('playlists', []);
        const sec = (title, link, inner, seed) => App.ui.sectionHead(title, link, 'Open', seed) + inner;
        const row = (items) => `<div class="hscroll">${items.join('')}</div>`;

        body.innerHTML = [
          sec('Continue your journey', null, journey.length ? row(journey.map((x) => App.ui.itemCard(x.type, x.id, { when: x.at }))) : App.ui.empty('wave', 'Your journey starts anywhere', 'Things you are partway through will gather here.'), 2),
          sec('Reading corner', '#/reading', row(App.content.allBooks().slice(0, 6).map((b) => App.ui.itemCard(b.kind === 'article' ? 'article' : 'book', b.id))), 3),
          sec('Watch something', '#/videos', row(App.content.allVideos().slice(0, 6).map((v) => App.ui.itemCard('video', v.id))), 4),
          sec('Play a game', '#/games', row(App.content.games.filter((g) => g.id !== 'chess' && g.id !== 'arcade-club').map((g) => App.ui.itemCard('game', g.id))), 5),
          sec('Chess corner', '#/chess', `<div class="chess-corner card">
              <span class="cc-art">${App.doodle.knight()}</span>
              <div class="cc-txt"><b>The monochrome chess room</b><span>vs Snailfish: ${chessStats.w} won · ${chessStats.l} lost · ${chessStats.d} drawn</span></div>
              <div class="cc-act"><a class="btn btn-primary" href="#/chess">${icon('cpu')}Play Snailfish</a><a class="btn btn-ghost" href="#/chess/pvp">${icon('users')}Two players</a></div>
            </div>`, 6),
          sec('Your soundtrack', '#/music', row(App.content.allTracks().slice(0, 6).map((t) => App.ui.itemCard('track', t.id)).concat(pls.map((p) => `<a class="item-card pl-card" href="#/music/playlist/${esc(p.id)}"><span class="ic-link"><span class="ic-art ic-square">${App.doodle.record()}</span><span class="ic-body"><span class="ic-kicker">Playlist</span><b class="ic-title">${esc(p.name)}</b><span class="ic-sub">${p.tracks.length} tracks</span></span></span></a>`))), 7),
          sec('Your favorites', favs.length ? '#/favorites' : null, favs.length ? row(favs.slice(0, 8).map((f) => App.ui.itemCard(f.type, f.id))) : App.ui.empty('curious', 'No favorites yet', 'Tap the heart on anything you love and it will live here.'), 8),
          sec('Recently used', null, recent.length ? row(recent.slice(0, 10).map((x) => App.ui.itemCard(x.type, x.id, { when: x.at }))) : App.ui.emptyDoodle('mug', 'Nothing used yet', 'Your recent activity will appear here — it stays on this device.'), 9),
          App.ui.sectionHead('Discover something new', null, '', 10) + `<div class="discover-row"><button type="button" class="btn btn-ghost btn-sm" data-reshuffle>${icon('shuffle')}Shuffle picks</button></div>` +
            (fresh.length ? `<div class="grid grid-cards">${fresh.map(([t, id]) => App.ui.itemCard(t, id)).join('')}</div>` : App.ui.empty('happy', 'You have explored everything!', 'Every item in the zone has been opened at least once.')),
        ].join('');
      };
      draw();

      const input = $('#all-q', root);
      input.addEventListener('input', App.debounce(() => { q = input.value.trim(); draw(); }, 120));
      root.addEventListener('click', (e) => {
        const c = e.target.closest('[data-af]');
        if (c) { filter = c.dataset.af; App.store.set('allPrefs', { filter }); $$('[data-af]', root).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); draw(); }
        if (e.target.closest('[data-reshuffle]')) { discoverSeed++; draw(); }
      });
    },
  };

  App.pages.favorites = {
    title: 'Favorites',
    render(root) {
      let filter = 'all';
      root.innerHTML = `
      <section class="page">
        <div class="page-head"><div class="head-title"><span class="doodle-wrap">${App.doodle.bookmark()}</span>
          <div><h1>Favorites</h1><p>Everything you have hearted, sorted by kind. Saved on this device only.</p></div></div></div>
        ${App.ui.chips(FILTERS, filter, 'data-ff')}
        <div id="fav-body" class="fav-body"></div>
      </section>`;
      const body = $('#fav-body', root);
      const draw = () => {
        const list = App.fav.list().filter((f) => filter === 'all' || f.type === filter).filter((f) => App.content.resolve(f.type, f.id));
        if (!list.length) { body.innerHTML = App.ui.empty('curious', filter === 'all' ? 'No favorites yet' : 'Nothing saved in this category', 'Look for the heart button on books, videos, games and tracks.', '<a class="btn btn-primary" href="#/all">Explore everything</a>'); return; }
        const groups = {};
        list.forEach((f) => (groups[f.type] = groups[f.type] || []).push(f));
        body.innerHTML = Object.entries(groups).map(([t, arr]) => `${App.ui.sectionHead((FILTERS.find((x) => x.id === t) || {}).label || t, null, '', t.length)}
          <div class="grid grid-cards">${arr.map((f) => App.ui.itemCard(f.type, f.id, { fav: false, remove: true })).join('')}</div>`).join('');
      };
      draw();
      root.addEventListener('click', (e) => {
        const c = e.target.closest('[data-ff]');
        if (c) { filter = c.dataset.ff; $$('[data-ff]', root).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); draw(); }
        const r = e.target.closest('[data-remove]');
        if (r) { e.preventDefault(); const [t, id] = r.dataset.remove.split('|'); App.fav.remove(t, id); App.toast('Removed from favorites'); draw(); }
      });
    },
  };
})();

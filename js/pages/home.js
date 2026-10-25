/* Zone — Home: greeting, clock, hero room, quick access, continue/recent, relaxation picks. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon } = App;

  /* ---------- shared item cards (also used by All / Favorites) ---------- */
  App.ui.art = (type, id) => {
    const r = App.content.resolve(type, id); if (!r) return '';
    const it = r.item;
    if (type === 'book' || type === 'article') return `<span class="ic-art ic-cover">${App.cover(it.title, '', it.color || 0, it.motif || 'star')}</span>`;
    if (type === 'video') return `<span class="ic-art ic-thumb">${it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ''}<span class="ic-play">${icon('play')}</span></span>`;
    if (type === 'track') return `<span class="ic-art ic-square">${App.trackArt(it)}</span>`;
    if (type === 'game') return `<span class="ic-art ic-square ic-game">${App.gameArt ? App.gameArt(id) : ''}</span>`;
    if (type === 'chess') return `<span class="ic-art ic-square ic-chess">${App.doodle.knight()}</span>`;
    return '';
  };
  App.ui.progressOf = (type, id) => {
    if (type === 'book' || type === 'article') { const p = App.store.get('readProgress', {})[id]; return p ? p.pct || 0 : 0; }
    if (type === 'video') { const p = App.store.get('videoProgress', {})[id]; return p && p.d ? p.t / p.d : 0; }
    return 0;
  };
  const TYPE_WORD = { book: 'Book', article: 'Article', video: 'Video', track: 'Music', game: 'Game', chess: 'Chess' };
  App.ui.itemCard = (type, id, opts = {}) => {
    const r = App.content.resolve(type, id); if (!r) return '';
    const p = opts.progress !== false ? App.ui.progressOf(type, id) : 0;
    const playable = type === 'track';
    return `<article class="item-card ${opts.cls || ''}">
      <a class="ic-link" href="${esc(r.route)}" ${playable ? `data-play-track="${esc(id)}"` : ''}>
        ${App.ui.art(type, id)}
        <span class="ic-body">
          <span class="ic-kicker">${TYPE_WORD[type] || ''}${opts.when ? ', ' + esc(App.timeAgo(opts.when)) : ''}</span>
          <b class="ic-title">${esc(r.title)}</b>
          <span class="ic-sub">${esc(opts.sub || r.sub || '')}</span>
          ${p > 0.01 && p < 0.995 ? App.ui.progress(p, 'Progress for ' + r.title) : ''}
        </span>
      </a>
      ${opts.fav !== false ? App.ui.favBtn(type, id, r.title, 'ic-fav') : ''}
      ${opts.remove ? `<button type="button" class="icon-btn ic-remove" data-remove="${esc(type)}|${esc(id)}" aria-label="Remove ${esc(r.title)}">${icon('x')}</button>` : ''}
    </article>`;
  };
  /* tracks in cards start playback instead of navigating */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-play-track]');
    if (!a || e.target.closest('[data-fav]')) return;
    e.preventDefault();
    const id = a.dataset.playTrack;
    const t = App.content.track(id);
    if (!t) return App.toast('That track is no longer available.');
    App.player.play(id, App.content.allTracks().filter((x) => x.category === t.category).map((x) => x.id));
    App.toast('Playing “' + t.title + '”', { action: 'Open player', onAction: () => App.go('#/music') });
  });

  const PICKS = {
    morning: [['track', 'index-cards'], ['article', 'read-slowly'], ['game', '2048'], ['video', 'yt-eKFTSSKCzWA']],
    afternoon: [['track', 'deep-work'], ['game', 'minesweeper'], ['article', 'doodle-guide'], ['video', 'yt-e-P5IFTqB98']],
    evening: [['track', 'window-seat'], ['book', 'lamp-late-hours'], ['video', 'yt-mPZkdNFkNps'], ['chess', 'ai']],
    night: [['track', 'down-comforter'], ['book', 'small-hours'], ['video', 'yt-L_LUpnjgPso'], ['track', 'skylight-rain']],
  };
  const SUB = {
    morning: 'The kettle is on. Pick something gentle to start the day.',
    afternoon: 'A quiet corner for focus, a puzzle, or a short break.',
    evening: 'The lamp is warm. Settle in with a story, a game or a slow song.',
    night: 'Rain on the window. Something soft before sleep?',
  };

  App.pages.home = {
    title: 'Home',
    render(root) {
      const pod = App.partOfDay(), name = App.settings.get('name');
      const greet = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Hello, night owl' }[pod];
      const recent = App.activity.list();
      const last = recent[0];
      const reading = App.content.allBooks().filter((b) => { const p = App.ui.progressOf('book', b.id); return p > 0.01 && p < 0.98; })
        .sort((a, b) => ((App.store.get('readProgress', {})[b.id] || {}).at || 0) - ((App.store.get('readProgress', {})[a.id] || {}).at || 0));
      const played = recent.filter((x) => ['game', 'track', 'video', 'chess'].includes(x.type)).slice(0, 8);

      const quick = [
        ['reading', 'Reading', 'book', 'Your library and saved pages'],
        ['videos', 'Videos', 'screen', 'Open films, nature and music'],
        ['games', 'Games', 'controller', 'A small cozy arcade'],
        ['chess', 'Chess', 'knight', 'The monochrome chess room'],
        ['music', 'Music', 'headphones', 'Generative lo-fi, jazz and rain'],
      ];

      root.innerHTML = `
      <section class="page home">
        <div class="hero card">
          <div class="hero-text">
            <span class="hero-kicker hand">${esc(pod === 'night' ? 'the lamp is still on' : 'welcome back to your zone')}</span>
            <h1>${esc(greet)}${name ? ', ' + esc(name) : ''}.</h1>
            <p class="hero-sub">${esc(SUB[pod])}</p>
            <button type="button" class="hero-search" data-open-search>${icon('search')}<span>What would you like to do?</span><kbd>/</kbd></button>
            <div class="hero-meta">
              <div class="clock" aria-label="Current time"><b class="clock-time"></b><span class="clock-date"></span></div>
              <a class="btn btn-ghost btn-sm" href="#/favorites">${icon('heart')}Favorites</a>
              <a class="btn btn-ghost btn-sm" href="#/settings">${icon('settings')}Settings</a>
            </div>
          </div>
          <div class="hero-art">${App.heroRoom()}</div>
        </div>

        <div class="quick-grid">
          ${quick.map(([id, label, d, sub], i) => `
            <a class="quick-card has-doodle has-ring q-${id}" href="#/${id}">
              ${App.sketch.ring(60 + i)}
              <span class="qc-art">${App.doodle[d]()}</span>
              <span class="qc-txt"><b>${label}</b><small>${sub}</small></span>
            </a>`).join('')}
        </div>

        ${App.ui.sectionHead('Continue where you left off', recent.length ? '#/all' : null, 'Your journey', 4)}
        ${last ? `<div class="continue-hero">${App.ui.itemCard(last.type, last.id, { cls: 'big', when: last.at })}</div>`
          : App.ui.empty('wave', 'Your zone is fresh and quiet', 'Open a book, start a song or play a game — whatever you do will be waiting here next time.', '<a class="btn btn-primary" href="#/reading">Open the library</a><a class="btn btn-ghost" href="#/music">Play some music</a>')}

        ${App.ui.sectionHead('Continue reading', '#/reading', 'Library', 6)}
        ${reading.length ? `<div class="hscroll">${reading.map((b) => App.ui.itemCard(b.kind === 'article' ? 'article' : 'book', b.id)).join('')}</div>`
          : App.ui.emptyDoodle('bookmark', 'No books in progress', 'Start reading anything and your place will be saved automatically.', '<a class="btn btn-ghost" href="#/reading">Browse the library</a>')}

        ${App.ui.sectionHead('Recently played', played.length ? '#/all' : null, 'See all', 8)}
        ${played.length ? `<div class="hscroll">${played.map((x) => App.ui.itemCard(x.type, x.id, { when: x.at })).join('')}</div>`
          : App.ui.emptyDoodle('controller', 'Nothing played yet', 'Games, songs, videos and chess matches you start will appear here.', '<a class="btn btn-ghost" href="#/games">Visit the arcade</a>')}

        ${App.ui.sectionHead('Pick up your relaxation', null, '', 9)}
        <p class="muted small-note"><span class="sample-note">${icon('sparkle')}Sample picks for the ${pod}</span></p>
        <div class="grid grid-cards picks">${PICKS[pod].map(([t, id]) => App.ui.itemCard(t, id, { progress: false })).join('')}</div>
      </section>`;

      root.querySelector('[data-open-search]').addEventListener('click', () => App.openSearch(''));
      const tEl = root.querySelector('.clock-time'), dEl = root.querySelector('.clock-date');
      const tick = () => {
        const d = new Date();
        tEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !App.settings.get('clock24') });
        dEl.textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      };
      tick();
      const iv = setInterval(tick, 10000);
      const off = App.on('fav', () => {}); // fav buttons update themselves
      return () => { clearInterval(iv); off(); };
    },
  };
})();

/* Zone — Music: now playing, visualiser, queue, browsing, playlists, favorites, your own audio. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;
  const P = () => App.player;
  const playlists = () => App.store.get('playlists', []).filter((p) => p && p.id && Array.isArray(p.tracks));
  const catLabel = (id) => (App.content.musicCats.find((c) => c.id === id) || { label: 'Your audio' }).label;

  function row(t, i, ctx) {
    const cur = P().current(), isCur = cur && cur.id === t.id, playing = isCur && P().state.playing;
    return `<li class="track-row ${isCur ? 'current' : ''}" data-tid="${esc(t.id)}">
      <button type="button" class="tr-play" data-play="${esc(t.id)}" data-ctx="${esc(ctx)}" aria-label="${playing ? 'Pause' : 'Play'} ${esc(t.title)}">
        <span class="tr-art">${App.trackArt(t)}</span><span class="tr-icon">${icon(playing ? 'pause' : 'play')}</span>
      </button>
      <span class="tr-txt"><b>${esc(t.title)}</b><small>${esc(catLabel(t.category))}, ${esc(t.artist || '')}</small></span>
      <span class="tr-dur">${t.duration ? App.fmtTime(t.duration) : '—'}</span>
      <span class="tr-act">
        ${App.ui.favBtn('track', t.id, t.title)}
        <button type="button" class="icon-btn" data-enqueue="${esc(t.id)}" aria-label="Add ${esc(t.title)} to queue">${icon('queue')}</button>
        <button type="button" class="icon-btn" data-topl="${esc(t.id)}" aria-label="Add ${esc(t.title)} to a playlist">${icon('plus')}</button>
        ${ctx.startsWith('pl:') ? `<button type="button" class="icon-btn" data-plrm="${esc(t.id)}" aria-label="Remove from playlist">${icon('x')}</button>` : ''}
        ${t.url && ctx === 'yours' ? `<button type="button" class="icon-btn" data-deltrack="${esc(t.id)}" aria-label="Delete ${esc(t.title)}">${icon('trash')}</button>` : ''}
      </span>
    </li>`;
  }
  function ctxList(ctx) {
    const C = App.content;
    if (ctx.startsWith('pl:')) { const p = playlists().find((x) => x.id === ctx.slice(3)); return p ? p.tracks.map((id) => C.track(id)).filter(Boolean) : []; }
    if (ctx === 'fav') return C.allTracks().filter((t) => App.fav.has('track', t.id));
    if (ctx === 'recent') return App.store.get('musicRecent', []).map((id) => C.track(id)).filter(Boolean);
    if (ctx === 'yours') return C.userTracks().concat(C.sessionTracks);
    if (ctx === 'all') return C.allTracks();
    return C.allTracks().filter((t) => t.category === ctx);
  }

  function addToPlaylistDialog(tid, after) {
    const t = App.content.track(tid);
    App.modal({
      title: 'Add to playlist',
      body: `<p>Add <b>${esc(t ? t.title : '')}</b> to:</p><div class="pl-pick">${playlists().map((p) => `<label class="pl-opt"><input type="checkbox" data-plid="${esc(p.id)}" ${p.tracks.includes(tid) ? 'checked' : ''}><span>${esc(p.name)}</span><small>${p.tracks.length}</small></label>`).join('') || '<p class="muted">No playlists yet.</p>'}</div>
        <div class="field"><label for="npl">New playlist</label><input class="input" id="npl" maxlength="60" placeholder="e.g. Rainy study"></div>`,
      actions: [{ label: 'Cancel' }, { label: 'Save', primary: true, onClick(dlg) {
        const name = $('#npl', dlg).value.trim();
        App.store.update('playlists', [], (all) => {
          $$('[data-plid]', dlg).forEach((c) => { const p = all.find((x) => x.id === c.dataset.plid); if (!p) return; const has = p.tracks.includes(tid); if (c.checked && !has) p.tracks.push(tid); if (!c.checked && has) p.tracks = p.tracks.filter((x) => x !== tid); });
          if (name) all.push({ id: 'pl-' + App.uid(), name, tracks: [tid] });
        });
        App.toast('Playlists updated'); after && after();
      } }],
    });
  }
  function addAudioDialog(after) {
    App.modal({
      title: 'Add your own audio',
      body: `<p>Play audio you have the rights to. A <b>URL</b> is saved in this browser; a <b>local file</b> plays for this visit only.</p>
        <div class="field"><label for="au-url">Audio URL (.mp3, .ogg, .wav, .m4a)</label><input class="input" id="au-url" type="url" placeholder="https://…/song.mp3"></div>
        <div class="field"><label for="au-title">Title</label><input class="input" id="au-title" maxlength="100"></div>
        <div class="field"><span class="lbl">…or choose a local file</span><input type="file" id="au-file" accept="audio/*"></div>
        <p class="fine-print">Some servers block playback from other sites; if so, Zone will tell you.</p>`,
      actions: [{ label: 'Cancel' }, { label: 'Add', primary: true, onClick(dlg) {
        const file = $('#au-file', dlg).files[0], url = $('#au-url', dlg).value.trim(), title = $('#au-title', dlg).value.trim();
        if (file) {
          const t = { id: 'lf-' + App.uid(), title: title || file.name.replace(/\.[^.]+$/, ''), artist: 'Local file (this visit)', category: 'user', url: URL.createObjectURL(file) };
          App.content.sessionTracks.push(t); App.toast('Added for this visit'); after && after(); return;
        }
        let u; try { u = new URL(url); } catch (e) { App.toast('Add a valid audio URL or choose a file.'); return false; }
        if (!/^https?:$/.test(u.protocol)) { App.toast('Only http(s) links are supported.'); return false; }
        App.store.update('userTracks', [], (a) => { a.push({ id: 'ut-' + App.uid(), title: title || decodeURIComponent(u.pathname.split('/').pop()) || 'Audio', artist: u.hostname, category: 'user', url }); });
        App.toast('Audio added'); after && after();
      } }],
    });
  }

  App.pages.music = {
    title: 'Music',
    render(root, params) {
      const plView = params[0] === 'playlist' ? params[1] : null;
      let cat = App.store.get('musicPrefs', { cat: 'all' }).cat || 'all', q = '';
      root.innerHTML = `
      <section class="page music-page">
        <div class="page-head">
          <div class="head-title"><span class="doodle-wrap has-doodle">${App.doodle.headphones()}</span>
            <div><h1>Sound sanctuary</h1><p>Original generative music, composed live in your browser — lo-fi, jazz, piano, rain and more.</p></div></div>
          <button type="button" class="btn btn-ghost btn-sketch" data-addaudio>${icon('upload')}Add your audio</button>
        </div>
        <div class="music-top">
          <div class="now-playing card" id="np"></div>
          <div class="queue card" id="queue"></div>
        </div>
        <div id="m-body"></div>
        <p class="fine-print">${icon('info')} Zone tracks are synthesised in real time with the Web Audio API from a seed — no streaming service, no licensing limits. Audio you add plays directly from its source.</p>
      </section>`;

      const np = $('#np', root), qu = $('#queue', root), body = $('#m-body', root);
      let raf = 0, canvas = null;
      const drawNP = () => {
        const t = P().current(), st = P().state;
        if (!t) {
          np.innerHTML = `<div class="np-empty">${App.pip('curious', { size: 80 })}<div><h2>Nothing playing yet</h2><p class="muted">Pick a track below — Pip suggests “Window Seat” for a first listen.</p>
            <button type="button" class="btn btn-primary" data-play="window-seat" data-ctx="lofi">${icon('play')}Play Window Seat</button></div></div>`;
          return;
        }
        np.classList.toggle('is-playing', st.playing);
        np.innerHTML = `
          <div class="np-art">${App.doodle.record()}<span class="np-cover">${App.trackArt(t)}</span>
            <span class="np-notes" aria-hidden="true"><i>${icon('note')}</i><i>${icon('note')}</i><i>${icon('note')}</i></span></div>
          <div class="np-main">
            <span class="np-kicker hand">${st.playing ? 'now playing' : 'paused'}</span>
            <h2>${esc(t.title)}</h2><p class="muted">${esc(catLabel(t.category))} by ${esc(t.artist)}</p>
            <canvas class="np-viz" height="64" aria-hidden="true"></canvas>
            <div class="np-seek"><span class="np-cur">${App.fmtTime(P().position())}</span>
              <input type="range" min="0" max="${Math.max(1, Math.floor(P().duration()))}" step="1" value="${Math.floor(P().position())}" data-seek aria-label="Seek">
              <span class="np-dur">${App.fmtTime(P().duration())}</span></div>
            <div class="np-ctrl">
              <button type="button" class="icon-btn ${st.shuffle ? 'on' : ''}" data-pc="shuffle" aria-pressed="${st.shuffle}" aria-label="Shuffle">${icon('shuffle')}</button>
              <button type="button" class="icon-btn" data-pc="prev" aria-label="Previous">${icon('prev')}</button>
              <button type="button" class="np-play" data-pc="toggle" aria-label="${st.playing ? 'Pause' : 'Play'}">${icon(st.playing ? 'pause' : 'play')}</button>
              <button type="button" class="icon-btn" data-pc="next" aria-label="Next">${icon('next')}</button>
              <button type="button" class="icon-btn ${st.repeat !== 'off' ? 'on' : ''}" data-pc="repeat" aria-label="Repeat: ${st.repeat}">${icon('repeat')}${st.repeat === 'one' ? '<span class="rep1">1</span>' : ''}</button>
            </div>
            <div class="np-foot">
              <label class="np-vol">${icon(st.volume > 0 ? 'volume' : 'mute')}<input type="range" min="0" max="1" step="0.01" value="${st.volume}" data-vol aria-label="Volume"></label>
              ${App.ui.favBtn('track', t.id, t.title)}
              <button type="button" class="icon-btn" data-topl="${esc(t.id)}" aria-label="Add to playlist">${icon('plus')}</button>
            </div>
          </div>`;
        canvas = $('.np-viz', np);
        loop();
      };
      const loop = () => {
        cancelAnimationFrame(raf);
        if (!canvas) return;
        const c = canvas, g = c.getContext('2d');
        const w = (c.width = c.clientWidth * (window.devicePixelRatio || 1)), h = (c.height = 64 * (window.devicePixelRatio || 1));
        const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e26d5c';
        const N = 36, seeds = Array.from({ length: N }, (_, i) => (App.hash('b' + i) % 100) / 100);
        let tt = 0;
        const frame = () => {
          tt += 0.016;
          g.clearRect(0, 0, w, h);
          const playing = P().state.playing, lv = playing && !(P().current() || {}).url ? App.audio.levels(N) : null;
          const bw = w / N;
          g.fillStyle = color;
          for (let i = 0; i < N; i++) {
            let v = lv ? Math.min(1, lv[i] * 1.5) : playing ? 0.25 + 0.2 * Math.sin(tt * 3 + i * 0.6 + seeds[i] * 6) : 0.06;
            const bh = Math.max(3, v * h * 0.95), x = i * bw + bw * 0.2, y = (h - bh) / 2;
            g.beginPath(); g.roundRect ? g.roundRect(x, y, bw * 0.6, bh, bw * 0.3) : g.rect(x, y, bw * 0.6, bh); g.fill();
          }
          if (playing && !App.reducedMotion()) raf = requestAnimationFrame(frame);
        };
        frame();
      };
      const drawQueue = () => {
        const st = P().state, list = st.queue.map((id) => App.content.track(id));
        qu.innerHTML = `<div class="q-head"><h2>Queue</h2>${list.length > 1 ? '<button type="button" class="btn btn-ghost btn-sm" data-qclear>Clear</button>' : ''}</div>` +
          (list.length ? `<ol class="q-list">${list.map((t, i) => t ? `<li class="${i === st.index ? 'current' : i < st.index ? 'past' : ''}"><button type="button" data-qplay="${i}"><span class="q-n">${i === st.index && st.playing ? App.doodle.scribble() : i + 1}</span><span class="q-t"><b>${esc(t.title)}</b><small>${esc(catLabel(t.category))}</small></span></button>${i !== st.index ? `<button type="button" class="icon-btn" data-qrm="${i}" aria-label="Remove ${esc(t.title)} from queue">${icon('x')}</button>` : ''}</li>` : '').join('')}</ol>`
            : `<div class="q-empty">${App.doodle.record()}<p>The queue is empty. Add tracks with the ${icon('queue')} button.</p></div>`);
      };
      const drawBody = () => {
        if (plView) {
          const p = playlists().find((x) => x.id === plView);
          if (!p) { body.innerHTML = App.ui.empty('curious', 'Playlist not found', 'It may have been deleted.', '<a class="btn btn-primary" href="#/music">Back to music</a>'); return; }
          const list = ctxList('pl:' + p.id);
          body.innerHTML = `<div class="sec-head"><div><a class="link-more back-link" href="#/music">${icon('left')} All music</a><h2 class="pl-title">${esc(p.name)}</h2><small class="muted">${list.length} tracks</small></div>
            <div class="ph-act">${list.length ? `<button type="button" class="btn btn-primary" data-playall="pl:${esc(p.id)}">${icon('play')}Play all</button>` : ''}<button type="button" class="btn btn-ghost" data-renpl="${esc(p.id)}">${icon('edit')}Rename</button><button type="button" class="btn btn-danger" data-delpl="${esc(p.id)}">${icon('trash')}Delete</button></div></div>` +
            (list.length ? `<ul class="track-list">${list.map((t, i) => row(t, i, 'pl:' + p.id)).join('')}</ul>` : App.ui.empty('curious', 'This playlist is empty', 'Add tracks with the + button on any track.'));
          return;
        }
        const t = q.toLowerCase();
        const list = ctxList(cat).filter((x) => !t || [x.title, x.artist, x.category, x.mood].join(' ').toLowerCase().includes(t));
        const pls = playlists(), rec = ctxList('recent').slice(0, 6), favs = ctxList('fav');
        body.innerHTML = `
          <div class="music-cols">
            <div>
              <div class="lib-tools">
                <div class="search-box">${icon('search')}<input class="input" type="search" id="m-q" value="${esc(q)}" placeholder="Search tracks, moods…" aria-label="Search music"></div>
                ${App.ui.chips([{ id: 'all', label: 'All' }].concat(App.content.musicCats, [{ id: 'fav', label: 'Liked' }, { id: 'yours', label: 'Your audio' }]), cat, 'data-mcat')}
              </div>
              ${list.length ? `<div class="list-head"><span>${list.length} tracks</span><button type="button" class="btn btn-ghost btn-sm" data-playall="${esc(cat)}">${icon('play')}Play these</button></div><ul class="track-list">${list.map((x, i) => row(x, i, cat)).join('')}</ul>`
                : cat === 'yours' ? App.ui.emptyDoodle('headphones', 'No audio of your own yet', 'Add an audio URL or pick a local file to play it with the Zone player.', '<button type="button" class="btn btn-primary" data-addaudio>Add audio</button>')
                : cat === 'fav' ? App.ui.empty('curious', 'No liked tracks', 'Tap the heart on a track to keep it here.') : App.ui.empty('curious', 'No tracks found', 'Try another word or category.')}
            </div>
            <aside class="music-side">
              <div class="card side-card"><div class="q-head"><h2>Your playlists</h2><button type="button" class="btn btn-ghost btn-sm" data-newpl>${icon('plus')}New</button></div>
                ${pls.length ? `<ul class="pl-list">${pls.map((p) => `<li><a href="#/music/playlist/${esc(p.id)}"><span class="pl-ico">${App.doodle.record()}</span><span><b>${esc(p.name)}</b><small>${p.tracks.length} tracks</small></span></a></li>`).join('')}</ul>` : `<p class="muted small">Make a playlist for studying, sleep, or Sunday mornings.</p>`}
              </div>
              <div class="card side-card"><h2>Recently played</h2>
                ${rec.length ? `<ul class="mini-list">${rec.map((x) => `<li><button type="button" data-play="${esc(x.id)}" data-ctx="recent">${App.trackArt(x)}<span><b>${esc(x.title)}</b><small>${esc(catLabel(x.category))}</small></span></button></li>`).join('')}</ul>` : '<p class="muted small">Tracks you play will be listed here.</p>'}
              </div>
              <div class="card side-card"><h2>Liked</h2>${favs.length ? `<ul class="mini-list">${favs.slice(0, 5).map((x) => `<li><button type="button" data-play="${esc(x.id)}" data-ctx="fav">${App.trackArt(x)}<span><b>${esc(x.title)}</b><small>${esc(catLabel(x.category))}</small></span></button></li>`).join('')}</ul>` : '<p class="muted small">No liked tracks yet.</p>'}</div>
            </aside>
          </div>`;
        const qi = $('#m-q', body);
        if (qi) qi.addEventListener('input', App.debounce(() => { q = qi.value.trim(); const pos = qi.selectionStart; drawBody(); const n = $('#m-q', body); n.focus(); n.setSelectionRange(pos, pos); }, 180));
      };
      drawNP(); drawQueue(); drawBody();

      let lastTid = P().current() && P().current().id;
      const offP = App.on('player', () => { drawNP(); drawQueue(); const tid = P().current() && P().current().id; if (tid !== lastTid) { lastTid = tid; if (!body.contains(document.activeElement)) drawBody(); } $$('.track-row', body).forEach((r) => { const cur = P().current(), is = cur && cur.id === r.dataset.tid; r.classList.toggle('current', !!is); const b = $('.tr-icon', r); if (b) b.innerHTML = icon(is && P().state.playing ? 'pause' : 'play'); }); });
      const offT = App.on('player-time', () => {
        const s = $('[data-seek]', np); if (!s || s.matches(':active')) return;
        s.max = Math.max(1, Math.floor(P().duration())); s.value = Math.floor(P().position());
        $('.np-cur', np).textContent = App.fmtTime(P().position()); $('.np-dur', np).textContent = App.fmtTime(P().duration());
      });
      const offF = App.on('fav', () => {});

      root.addEventListener('click', async (e) => {
        const T = e.target;
        const pl = T.closest('[data-play]');
        if (pl) {
          const id = pl.dataset.play, cur = P().current();
          if (cur && cur.id === id) return P().toggle();
          P().play(id, ctxList(pl.dataset.ctx || 'all').map((x) => x.id)); return;
        }
        const pc = T.closest('[data-pc]');
        if (pc) { const a = pc.dataset.pc; ({ toggle: P().toggle, next: () => P().next(), prev: P().prev, shuffle: P().toggleShuffle, repeat: P().cycleRepeat })[a](); return; }
        const pa = T.closest('[data-playall]');
        if (pa) { const l = ctxList(pa.dataset.playall); if (l.length) P().play(l[0].id, l.map((x) => x.id)); return; }
        const en = T.closest('[data-enqueue]'); if (en) return P().enqueue(en.dataset.enqueue);
        const tp = T.closest('[data-topl]'); if (tp) return addToPlaylistDialog(tp.dataset.topl, drawBody);
        const qp = T.closest('[data-qplay]'); if (qp) { const i = +qp.dataset.qplay; if (i === P().state.index) P().toggle(); else P().play(P().state.queue[i]); return; }
        const qr = T.closest('[data-qrm]'); if (qr) return P().removeAt(+qr.dataset.qrm);
        if (T.closest('[data-qclear]')) return P().clearQueue();
        const mc = T.closest('[data-mcat]'); if (mc) { cat = mc.dataset.mcat; App.store.set('musicPrefs', { cat }); drawBody(); return; }
        if (T.closest('[data-addaudio]')) return addAudioDialog(() => { cat = 'yours'; drawBody(); });
        if (T.closest('[data-newpl]')) {
          App.modal({ title: 'New playlist', body: '<div class="field"><label for="pln">Name</label><input class="input" id="pln" maxlength="60" placeholder="e.g. Late-night reading"></div>', onOpen: (d) => $('#pln', d).focus(),
            actions: [{ label: 'Cancel' }, { label: 'Create', primary: true, onClick(d) { const n = $('#pln', d).value.trim(); if (!n) return false; App.store.update('playlists', [], (a) => { a.push({ id: 'pl-' + App.uid(), name: n, tracks: [] }); }); drawBody(); App.toast('Playlist created'); } }] });
          return;
        }
        const rm = T.closest('[data-plrm]'); if (rm) { App.store.update('playlists', [], (a) => { const p = a.find((x) => x.id === plView); if (p) p.tracks = p.tracks.filter((x) => x !== rm.dataset.plrm); }); drawBody(); return; }
        const dp = T.closest('[data-delpl]'); if (dp && await App.confirm('Delete playlist?', 'The tracks stay in your library.', 'Delete', true)) { App.store.update('playlists', [], (a) => a.filter((x) => x.id !== dp.dataset.delpl)); App.go('#/music'); return; }
        const rn = T.closest('[data-renpl]');
        if (rn) { const p = playlists().find((x) => x.id === rn.dataset.renpl); App.modal({ title: 'Rename playlist', body: `<div class="field"><label for="rnp">Name</label><input class="input" id="rnp" maxlength="60" value="${esc(p.name)}"></div>`, actions: [{ label: 'Cancel' }, { label: 'Save', primary: true, onClick(d) { const n = $('#rnp', d).value.trim(); if (!n) return false; App.store.update('playlists', [], (a) => { a.find((x) => x.id === p.id).name = n; }); drawBody(); } }] }); return; }
        const dt = T.closest('[data-deltrack]');
        if (dt) {
          const id = dt.dataset.deltrack;
          if (await App.confirm('Remove this audio?', 'It will be removed from your library.', 'Remove', true)) {
            if (P().current() && P().current().id === id) P().pause();
            App.store.update('userTracks', [], (a) => a.filter((x) => x.id !== id));
            App.content.sessionTracks = App.content.sessionTracks.filter((x) => x.id !== id);
            drawBody();
          }
        }
      });
      root.addEventListener('input', (e) => {
        if (e.target.matches('[data-vol]')) P().setVolume(+e.target.value);
      });
      root.addEventListener('change', (e) => { if (e.target.matches('[data-seek]')) P().seek(+e.target.value); });
      return () => { cancelAnimationFrame(raf); offP(); offT(); offF(); };
    },
  };
})();

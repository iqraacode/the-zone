/* Zone — Videos: discovery, watch later, playlists, continue watching, and a clean player.
   Everything plays through YouTube's embedded player (IFrame API), so progress can be saved and resumed. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;
  const vprog = () => App.store.get('videoProgress', {});
  const later = () => App.store.get('watchLater', []);
  const playlists = () => App.store.get('videoPlaylists', []).filter((p) => p && p.id && Array.isArray(p.items));
  const ytId = (url) => { const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); return m ? m[1] : null; };

  /* load YouTube's IFrame API once */
  App.ytApi = () => App._ytP || (App._ytP = new Promise((res, rej) => {
    if (window.YT && window.YT.Player) return res(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(window.YT); };
    const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.async = true;
    sc.onerror = () => { App._ytP = null; rej(new Error('YouTube API failed to load')); };
    document.head.appendChild(sc);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { App._ytP = null; rej(new Error('timeout')); } }, 9000);
  }));

  function card(v, opts = {}) {
    const p = vprog()[v.id], pct = p && p.d ? p.t / p.d : 0, wl = later().includes(v.id);
    const href = '#/videos/watch/' + v.id + (opts.pl ? '/' + opts.pl : '');
    return `<article class="video-card">
      <a href="${href}" class="vc-link has-doodle" aria-label="Watch ${esc(v.title)}">
        <span class="vc-thumb">
          ${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : `<span class="vc-fallback">${App.doodle.film()}</span>`}
          <span class="vc-play"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="${App.sketch.circle(30, 30, 24, 24, App.hash(v.id) % 99, 0.05, 0.4)}" class="vc-ring"/><path d="M24 19l17 11-17 11z" class="vc-tri"/></svg></span>
          ${v.duration ? `<span class="vc-dur">${App.fmtTime(v.duration)}</span>` : ''}
          ${v.live ? '<span class="vc-dur vc-yt">● LIVE</span>' : ''}
          ${pct > 0.01 && pct < 0.98 ? `<span class="vc-prog"><span style="width:${pct * 100}%"></span></span>` : ''}
        </span>
        <span class="vc-body"><b>${esc(v.title)}</b><small>${esc(v.credit || 'Your video')}${v.license ? ' · ' + esc(v.license) : ''}</small></span>
      </a>
      <div class="vc-actions">
        ${App.ui.favBtn('video', v.id, v.title)}
        <button type="button" class="icon-btn ${wl ? 'on' : ''}" data-later="${esc(v.id)}" aria-pressed="${wl}" aria-label="${wl ? 'Remove from' : 'Add to'} watch later">${icon('clock')}</button>
        <button type="button" class="icon-btn" data-addpl="${esc(v.id)}" aria-label="Add to playlist">${icon('queue')}</button>
        ${opts.removePl ? `<button type="button" class="icon-btn" data-rmpl="${esc(v.id)}" aria-label="Remove from playlist">${icon('x')}</button>` : ''}
        ${!v.sample && !opts.removePl ? `<button type="button" class="icon-btn" data-delvid="${esc(v.id)}" aria-label="Delete ${esc(v.title)}">${icon('trash')}</button>` : ''}
      </div>
    </article>`;
  }

  /* shared actions for any videos view */
  async function handleCommon(e, redraw) {
    const l = e.target.closest('[data-later]');
    if (l) {
      const id = l.dataset.later; let on;
      App.store.update('watchLater', [], (a) => { const i = a.indexOf(id); if (i >= 0) { a.splice(i, 1); on = false; } else { a.unshift(id); on = true; } });
      App.toast(on ? 'Saved to Watch later' : 'Removed from Watch later'); redraw && redraw(); return true;
    }
    const a = e.target.closest('[data-addpl]');
    if (a) { playlistDialog(a.dataset.addpl, redraw); return true; }
    const d = e.target.closest('[data-delvid]');
    if (d) {
      const v = App.content.video(d.dataset.delvid);
      if (v && await App.confirm('Remove this video?', `“${v.title}” will be removed from your videos.`, 'Remove', true)) { App.store.update('userVideos', [], (x) => x.filter((y) => y.id !== v.id)); App.fav.remove('video', v.id); redraw && redraw(); }
      return true;
    }
    return false;
  }
  function playlistDialog(vid, after) {
    const v = App.content.video(vid);
    App.modal({
      title: 'Add to playlist',
      body: `<p>Add <b>${esc(v ? v.title : '')}</b> to a collection.</p>
        <div class="pl-pick">${playlists().map((p) => `<label class="pl-opt"><input type="checkbox" data-plid="${esc(p.id)}" ${p.items.includes(vid) ? 'checked' : ''}><span>${esc(p.name)}</span><small>${p.items.length}</small></label>`).join('') || '<p class="muted">No playlists yet — create one below.</p>'}</div>
        <div class="field"><label for="new-pl">New playlist</label><input class="input" id="new-pl" maxlength="60" placeholder="e.g. Sunday films"></div>`,
      actions: [{ label: 'Cancel' }, {
        label: 'Save', primary: true, onClick(dlg) {
          const name = $('#new-pl', dlg).value.trim();
          App.store.update('videoPlaylists', [], (all) => {
            $$('[data-plid]', dlg).forEach((c) => { const p = all.find((x) => x.id === c.dataset.plid); if (!p) return; const has = p.items.includes(vid); if (c.checked && !has) p.items.push(vid); if (!c.checked && has) p.items = p.items.filter((x) => x !== vid); });
            if (name) all.push({ id: 'vp-' + App.uid(), name, items: [vid] });
          });
          App.toast('Playlists updated'); after && after();
        },
      }],
    });
  }
  function addVideoDialog(after) {
    App.modal({
      title: 'Add a video',
      body: `<p>Paste any <b>YouTube</b> link (video or Shorts). It will be saved in this browser.</p>
        <div class="field"><label for="av-url">Video URL</label><input class="input" id="av-url" type="url" placeholder="https://www.youtube.com/watch?v=…"></div>
        <div class="field"><label for="av-title">Title</label><input class="input" id="av-title" maxlength="120"></div>
        <div class="field"><label for="av-cat">Category</label><select class="input" id="av-cat">${App.content.videoCats.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}</select></div>
        <p class="fine-print">Plays through YouTube's privacy-enhanced player. Some videos don't allow embedding — YouTube will say so in the player.</p>`,
      actions: [{ label: 'Cancel' }, {
        label: 'Add video', primary: true, onClick(dlg) {
          const url = $('#av-url', dlg).value.trim(), title = $('#av-title', dlg).value.trim();
          let u; try { u = new URL(url); } catch (e) { App.toast('That does not look like a valid link.'); return false; }
          if (!/^https?:$/.test(u.protocol)) { App.toast('Only http(s) links are supported.'); return false; }
          const yid = ytId(url);
          if (!yid) { App.toast('Please paste a YouTube link (youtube.com/watch?v=… or youtu.be/…).'); return false; }
          const v = { id: 'uv-' + App.uid(), title: title || (yid ? 'YouTube video' : decodeURIComponent(u.pathname.split('/').pop())), cat: $('#av-cat', dlg).value, credit: yid ? 'YouTube' : u.hostname, src: yid ? 'yt:' + yid : url, yt: yid || null, thumb: yid ? `https://i.ytimg.com/vi/${yid}/hqdefault.jpg` : '' };
          App.store.update('userVideos', [], (a) => { a.push(v); });
          App.toast('Video added'); after && after();
        },
      }],
    });
  }

  function library(root) {
    let cat = App.store.get('videoPrefs', { cat: 'all' }).cat || 'all', q = '';
    root.innerHTML = `
    <section class="page videos-page">
      <div class="page-head">
        <div class="head-title"><span class="doodle-wrap has-doodle">${App.doodle.screen()}</span>
          <div><h1>The lounge</h1><p>Open films, nature and music performances — dim the lights and press play.</p></div></div>
        <button type="button" class="btn btn-ghost btn-sketch" data-addvid>${icon('link')}Add a video</button>
      </div>
      <div id="v-featured"></div>
      <div class="lib-tools">
        <div class="search-box">${icon('search')}<input class="input" type="search" id="v-q" placeholder="Search videos…" aria-label="Search videos"></div>
        ${App.ui.chips([{ id: 'all', label: 'All' }].concat(App.content.videoCats, [{ id: 'yours', label: 'Your videos' }]), cat, 'data-vcat')}
      </div>
      <div id="v-body"></div>
      <p class="fine-print">${icon('info')} Videos play from YouTube through its embedded player — the creator and channel are credited on every video.</p>
    </section>`;
    const body = $('#v-body', root);
    const draw = () => {
      const all = App.content.allVideos(), P = vprog();
      const cont = all.filter((v) => P[v.id] && P[v.id].d && P[v.id].t / P[v.id].d > 0.01 && P[v.id].t / P[v.id].d < 0.98).sort((a, b) => P[b.id].at - P[a.id].at);
      const feat = cont[0] || all.find((v) => v.id === 'yt-Z4C82eyhwgU') || all[0];
      $('#v-featured', root).innerHTML = feat ? `
        <div class="v-feature card">
          <a href="#/videos/watch/${esc(feat.id)}" class="vf-img" aria-label="Watch ${esc(feat.title)}">${feat.thumb ? `<img src="${esc(feat.thumb)}" alt="" decoding="async" onerror="this.remove()">` : ''}<span class="vf-play">${icon('play')}</span></a>
          <div class="vf-txt"><span class="hand vf-kicker">${cont[0] ? 'continue watching' : 'tonight’s pick'}</span><h2>${esc(feat.title)}</h2><p>${esc(feat.desc || '')}</p>
            <div class="vf-act"><a class="btn btn-primary" href="#/videos/watch/${esc(feat.id)}">${icon('play')}${cont[0] ? 'Resume' : 'Play'}</a>${App.ui.favBtn('video', feat.id, feat.title)}<button type="button" class="icon-btn" data-later="${esc(feat.id)}" aria-label="Watch later">${icon('clock')}</button></div>
            <small class="muted">${esc(feat.credit || '')}${feat.license ? ' · ' + esc(feat.license) : ''}</small></div>
        </div>` : '';
      const wl = later().map((id) => App.content.video(id)).filter(Boolean);
      const favs = all.filter((v) => App.fav.has('video', v.id));
      const recent = App.activity.list(['video']).map((x) => App.content.video(x.id)).filter(Boolean).slice(0, 8);
      const pls = playlists();
      const t = q.toLowerCase();
      const list = all.filter((v) => (cat === 'all' || (cat === 'yours' ? !v.sample : v.cat === cat)) && (!t || [v.title, v.desc, v.credit, v.cat].join(' ').toLowerCase().includes(t)));
      const row = (title, items, seed, empty) => App.ui.sectionHead(title, null, '', seed) + (items.length ? `<div class="hscroll v-row">${items.map((v) => card(v)).join('')}</div>` : empty || '');
      let html = '';
      if (!q && cat === 'all') {
        if (cont.length) html += row('Continue watching', cont, 2);
        html += row('Watch later', wl, 3, App.ui.emptyDoodle('mug', 'Nothing saved for later', 'Tap the clock on any video to keep it here for a quiet evening.'));
        if (favs.length) html += row('Favorites', favs, 4);
        if (recent.length) html += row('Recently watched', recent, 5);
        html += App.ui.sectionHead('Playlists', null, '', 6) + (pls.length ? `<div class="pl-grid">${pls.map((p) => { const first = App.content.video(p.items[0]); return `<a class="pl-tile card" href="#/videos/playlist/${esc(p.id)}"><span class="pl-thumb">${first && first.thumb ? `<img src="${esc(first.thumb)}" alt="" loading="lazy" onerror="this.remove()">` : App.doodle.film()}</span><span><b>${esc(p.name)}</b><small>${p.items.length} video${p.items.length === 1 ? '' : 's'}</small></span></a>`; }).join('')}</div>`
          : App.ui.emptyDoodle('film', 'No playlists yet', 'Use the list button on a video to start a collection.'));
      }
      html += App.ui.sectionHead(q ? 'Results' : cat === 'all' ? 'All videos' : ([...App.content.videoCats, { id: 'yours', label: 'Your videos' }].find((c) => c.id === cat) || {}).label, null, '', 7);
      html += list.length ? `<div class="grid v-grid">${list.map((v) => card(v)).join('')}</div>`
        : App.ui.emptyDoodle('screen', cat === 'yours' ? 'You haven’t added any videos' : 'No videos found', cat === 'yours' ? 'Add a YouTube link or a direct video file URL.' : 'Try another search or category.', cat === 'yours' ? '<button type="button" class="btn btn-primary" data-addvid>Add a video</button>' : '');
      body.innerHTML = html;
    };
    draw();
    $('#v-q', root).addEventListener('input', App.debounce((e) => { q = e.target.value.trim(); draw(); }, 120));
    root.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-vcat]');
      if (c) { cat = c.dataset.vcat; App.store.set('videoPrefs', { cat }); $$('[data-vcat]', root).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); draw(); return; }
      if (e.target.closest('[data-addvid]')) return addVideoDialog(draw);
      await handleCommon(e, draw);
    });
  }

  function playlistView(root, plId) {
    const draw = () => {
      const p = playlists().find((x) => x.id === plId);
      if (!p) { root.innerHTML = `<section class="page">${App.ui.emptyDoodle('film', 'Playlist not found', 'It may have been deleted.', '<a class="btn btn-primary" href="#/videos">Back to videos</a>')}</section>`; return; }
      const vids = p.items.map((id) => App.content.video(id)).filter(Boolean);
      root.innerHTML = `<section class="page">
        <div class="page-head"><div><a class="link-more back-link" href="#/videos">${icon('left')} Videos</a><h1>${esc(p.name)}</h1><p>${vids.length} video${vids.length === 1 ? '' : 's'} · plays in order</p></div>
          <div class="ph-act">${vids.length ? `<a class="btn btn-primary" href="#/videos/watch/${esc(vids[0].id)}/${esc(p.id)}">${icon('play')}Play all</a>` : ''}
          <button type="button" class="btn btn-ghost" data-renpl>${icon('edit')}Rename</button><button type="button" class="btn btn-danger" data-delpl>${icon('trash')}Delete</button></div></div>
        ${vids.length ? `<div class="grid v-grid">${vids.map((v) => card(v, { pl: p.id, removePl: true })).join('')}</div>` : App.ui.empty('curious', 'This playlist is empty', 'Add videos with the list button on any video card.', '<a class="btn btn-primary" href="#/videos">Browse videos</a>')}
      </section>`;
    };
    draw();
    root.addEventListener('click', async (e) => {
      const rm = e.target.closest('[data-rmpl]');
      if (rm) { App.store.update('videoPlaylists', [], (all) => { const p = all.find((x) => x.id === plId); if (p) p.items = p.items.filter((x) => x !== rm.dataset.rmpl); }); draw(); return; }
      if (e.target.closest('[data-delpl]')) { if (await App.confirm('Delete playlist?', 'The videos themselves stay in your library.', 'Delete', true)) { App.store.update('videoPlaylists', [], (all) => all.filter((x) => x.id !== plId)); App.go('#/videos'); } return; }
      if (e.target.closest('[data-renpl]')) {
        const p = playlists().find((x) => x.id === plId);
        App.modal({ title: 'Rename playlist', body: `<div class="field"><label for="rn">Name</label><input class="input" id="rn" maxlength="60" value="${esc(p.name)}"></div>`, actions: [{ label: 'Cancel' }, { label: 'Save', primary: true, onClick(dlg) { const n = $('#rn', dlg).value.trim(); if (!n) return false; App.store.update('videoPlaylists', [], (all) => { all.find((x) => x.id === plId).name = n; }); draw(); } }] });
        return;
      }
      await handleCommon(e, draw);
    });
  }

  function watch(root, id, plId) {
    const v = App.content.video(id);
    if (!v) { root.innerHTML = `<section class="page">${App.ui.emptyDoodle('screen', 'Video not found', 'It may have been removed.', '<a class="btn btn-primary" href="#/videos">Back to videos</a>')}</section>`; return; }
    const pl = plId ? playlists().find((p) => p.id === plId) : null;
    const queue = pl ? pl.items.map((x) => App.content.video(x)).filter(Boolean) : App.content.allVideos().filter((x) => x.cat === v.cat && x.id !== v.id).concat(App.content.allVideos().filter((x) => x.cat !== v.cat)).slice(0, 8);
    const upNext = pl ? queue.slice(queue.findIndex((x) => x.id === v.id) + 1) : queue;
    App.activity.log({ type: 'video', id: v.id, title: v.title, sub: v.credit });
    let theater = false;
    root.innerHTML = `
    <section class="page watch-page">
      <a class="link-more back-link" href="${pl ? '#/videos/playlist/' + esc(pl.id) : '#/videos'}">${icon('left')} ${pl ? esc(pl.name) : 'All videos'}</a>
      <div class="watch-layout">
        <div class="watch-main">
          <div class="player-frame">
            ${v.yt ? `<div id="yt-player" class="yt-slot"><span class="yt-loading">${App.doodle.scribble()}</span></div>`
              : `<video controls playsinline preload="metadata" ${v.thumb ? `poster="${esc(v.thumb)}"` : ''} ${v.loop ? 'loop' : ''} src="${esc(v.src)}"><p>Your browser cannot play this video. <a href="${esc(v.page || v.src)}">Open the source</a>.</p></video>`}
            <div class="player-error" hidden>${App.pip('curious', { size: 70 })}<b>This video couldn't load.</b><span>The source may be offline or blocked on this network.</span>${v.page || v.src ? `<a class="btn btn-ghost btn-sm" href="${esc(v.page || v.src)}" target="_blank" rel="noopener">Open the source page</a>` : ''}</div>
          </div>
          <div class="watch-info">
            <div class="wi-top"><div><h1>${esc(v.title)}</h1><p class="muted">${esc(v.credit || '')}${v.license ? ' · ' + esc(v.license) : ''}</p></div>
              <div class="wi-act">
                ${App.ui.favBtn('video', v.id, v.title)}
                <button type="button" class="icon-btn" data-later="${esc(v.id)}" aria-label="Watch later">${icon('clock')}</button>
                <button type="button" class="icon-btn" data-addpl="${esc(v.id)}" aria-label="Add to playlist">${icon('queue')}</button>
                <button type="button" class="btn btn-ghost btn-sm" data-theater>${icon('maximize')}<span>Theater</span></button>
              </div></div>
            <p>${esc(v.desc || '')}</p>
            ${v.yt ? `<p class="fine-print">Playing from YouTube${v.live ? ' (live stream)' : ' — your place is saved so you can continue later'}. <a class="btn-link" href="https://www.youtube.com/watch?v=${esc(v.yt)}" target="_blank" rel="noopener">Watch on YouTube</a></p>` : ''}
          </div>
        </div>
        <aside class="up-next"><h2>${pl ? 'Next in playlist' : 'Up next'}</h2>
          ${upNext.length ? upNext.map((x) => `<a class="un-item" href="#/videos/watch/${esc(x.id)}${pl ? '/' + esc(pl.id) : ''}"><span class="un-thumb">${x.thumb ? `<img src="${esc(x.thumb)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span><span><b>${esc(x.title)}</b><small>${esc(x.credit || '')}</small></span></a>`).join('') : '<p class="muted">That was the last one.</p>'}
        </aside>
      </div>
    </section>`;

    const video = $('video', root);
    const setTheater = (on) => { theater = on; document.body.classList.toggle('theater', on); const b = $('[data-theater] span', root); if (b) b.textContent = on ? 'Exit theater' : 'Theater'; };
    const onKey = (e) => { if (e.key === 'Escape' && theater) setTheater(false); };
    document.addEventListener('keydown', onKey);
    if (video) {
      const P = vprog()[v.id];
      video.addEventListener('loadedmetadata', () => {
        if (P && P.t > 5 && P.d && P.t < P.d - 5 && !v.loop) {
          video.currentTime = P.t;
          App.toast('Resumed at ' + App.fmtTime(P.t), { action: 'Start over', onAction: () => { video.currentTime = 0; } });
        }
      }, { once: true });
      const save = App.throttle(() => { if (video.duration && isFinite(video.duration)) App.store.update('videoProgress', {}, (a) => { a[v.id] = { t: video.currentTime, d: video.duration, at: Date.now() }; }); }, 3000);
      video.addEventListener('timeupdate', save);
      video.addEventListener('pause', () => { if (video.duration) App.store.update('videoProgress', {}, (a) => { a[v.id] = { t: video.currentTime, d: video.duration, at: Date.now() }; }); });
      video.addEventListener('play', () => { if (App.player.state.playing) { App.player.pause(); App.toast('Music paused while the video plays'); } });
      video.addEventListener('ended', () => {
        App.store.update('videoProgress', {}, (a) => { a[v.id] = { t: video.duration, d: video.duration, at: Date.now() }; });
        if (pl && upNext[0]) { App.toast('Next: ' + upNext[0].title); setTimeout(() => App.go('#/videos/watch/' + upNext[0].id + '/' + pl.id), 1200); }
      });
      video.addEventListener('error', () => { $('.player-error', root).hidden = false; video.style.visibility = 'hidden'; });
    }
    /* YouTube: IFrame Player API, so we can resume, save progress and pause the music */
    let ytPlayer = null, ytTimer = null;
    const saveYT = () => {
      if (!ytPlayer || !ytPlayer.getDuration || v.live) return;
      const d = ytPlayer.getDuration(), t = ytPlayer.getCurrentTime();
      if (d > 0 && t > 0) App.store.update('videoProgress', {}, (a) => { a[v.id] = { t, d, at: Date.now() }; });
    };
    if (v.yt) {
      const P = vprog()[v.id];
      const start = !v.live && P && P.t > 5 && P.d && P.t < P.d - 5 ? Math.floor(P.t) : 0;
      App.ytApi().then((YT) => {
        if (!$('#yt-player', root)) return;
        ytPlayer = new YT.Player('yt-player', {
          videoId: v.yt, host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, playsinline: 1, start, modestbranding: 1 },
          events: {
            onReady: () => { if (start) App.toast('Resumed at ' + App.fmtTime(start), { action: 'Start over', onAction: () => ytPlayer.seekTo(0, true) }); },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING && App.player.state.playing) { App.player.pause(); App.toast('Music paused while the video plays'); }
              if (e.data === YT.PlayerState.PAUSED) saveYT();
              if (e.data === YT.PlayerState.ENDED) {
                const d = ytPlayer.getDuration(); if (d && !v.live) App.store.update('videoProgress', {}, (a) => { a[v.id] = { t: d, d, at: Date.now() }; });
                if (pl && upNext[0]) { App.toast('Next: ' + upNext[0].title); setTimeout(() => App.go('#/videos/watch/' + upNext[0].id + '/' + pl.id), 1200); }
              }
            },
          },
        });
        ytTimer = setInterval(saveYT, 3000);
      }).catch(() => {
        const slot = $('#yt-player', root);
        if (slot) slot.outerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.yt)}?rel=0${start ? '&start=' + start : ''}" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      });
    }
    root.addEventListener('click', async (e) => {
      if (e.target.closest('[data-theater]')) return setTheater(!theater);
      await handleCommon(e);
    });
    return () => {
      document.removeEventListener('keydown', onKey); document.body.classList.remove('theater');
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      saveYT(); clearInterval(ytTimer); if (ytPlayer && ytPlayer.destroy) { try { ytPlayer.destroy(); } catch (err) {} }
    };
  }

  App.pages.videos = {
    title: (p) => (p[0] === 'watch' && App.content.video(p[1]) ? App.content.video(p[1]).title : 'Videos'),
    render(root, params) {
      if (params[0] === 'watch') return watch(root, params[1], params[2]);
      if (params[0] === 'playlist') return playlistView(root, params[1]);
      return library(root);
    },
  };
})();

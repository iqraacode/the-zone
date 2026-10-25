/* Zone — Reading: library shelves, your own texts, and a calm reader with saved position, bookmarks, focus mode and a timer. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;
  const PREFS = { size: 19, line: 1.75, width: 680, theme: 'app', font: 'serif' };
  const prefs = () => App.store.get('readPrefs', PREFS);
  const dayKey = () => new Date().toISOString().slice(0, 10);
  const getProg = (id) => App.store.get('readProgress', {})[id];
  const setProg = (id, p) => App.store.update('readProgress', {}, (all) => { all[id] = Object.assign(all[id] || {}, p, { at: Date.now() }); });
  const typeOf = (b) => (b.kind === 'article' ? 'article' : 'book');

  function bookCard(b) {
    const p = getProg(b.id), pct = p ? p.pct || 0 : 0;
    return `<article class="book-card">
      <a href="#/reading/read/${esc(b.id)}" class="bc-link has-ring" aria-label="Read ${esc(b.title)}">
        <span class="bc-cover">${App.cover(b.title, b.author, b.color || 0, b.motif || 'star')}${p && p.done ? `<span class="bc-done hand">finished ✓</span>` : ''}</span>
        <b class="bc-title">${esc(b.title)}</b>
        <span class="bc-meta">${esc(b.author || 'Your text')} · ${b.minutes || Math.max(1, Math.round(wordCount(b) / 230))} min</span>
        ${pct > 0.01 ? App.ui.progress(pct, 'Reading progress') : ''}
      </a>
      <div class="bc-actions">
        ${App.ui.favBtn(typeOf(b), b.id, b.title)}
        ${b.sample ? '<span class="badge">Sample</span>' : `<button type="button" class="icon-btn" data-del-book="${esc(b.id)}" aria-label="Delete ${esc(b.title)}">${icon('trash')}</button>`}
      </div>
    </article>`;
  }
  const wordCount = (b) => b.chapters.reduce((n, c) => n + c.text.split(/\s+/).length, 0);

  function statsBlock() {
    const s = App.store.get('readingStats', { seconds: 0, sessions: 0, days: {} });
    const done = Object.values(App.store.get('readProgress', {})).filter((p) => p && p.done).length;
    let streak = 0; const d = new Date();
    for (;;) { const k = d.toISOString().slice(0, 10); if ((s.days || {})[k] > 30) { streak++; d.setDate(d.getDate() - 1); } else break; }
    return `<div class="read-stats">
      <div><b>${App.fmtMinutes((s.days || {})[dayKey()] || 0)}</b><span>today</span></div>
      <div><b>${App.fmtMinutes(s.seconds)}</b><span>total reading</span></div>
      <div><b>${s.sessions}</b><span>sessions</span></div>
      <div><b>${done}</b><span>finished</span></div>
      <div><b>${streak}</b><span>day streak</span></div>
    </div>`;
  }

  function library(root) {
    let cat = 'all', q = '';
    root.innerHTML = `
    <section class="page reading-page">
      <div class="page-head">
        <div class="head-title"><span class="doodle-wrap has-doodle">${App.doodle.book()}</span>
          <div><h1>The library</h1><p>A quiet shelf of stories, essays and notes. Your place is saved as you read.</p></div></div>
        <button type="button" class="btn btn-primary btn-sketch" data-add-text>${icon('plus')}Add your own text</button>
      </div>
      ${statsBlock()}
      <div class="lib-tools">
        <div class="search-box">${icon('search')}<input class="input" type="search" id="lib-q" placeholder="Search titles, authors, topics…" aria-label="Search the library"></div>
        ${App.ui.chips([{ id: 'all', label: 'All' }].concat(App.content.readingCats), cat, 'data-cat')}
      </div>
      <div id="lib-body"></div>
      <p class="fine-print">${icon('info')} Sample texts are original short pieces written for Zone. Texts you add are stored only in this browser.</p>
    </section>`;
    const body = $('#lib-body', root);
    const draw = () => {
      const all = App.content.allBooks();
      const prog = App.store.get('readProgress', {});
      const inProg = all.filter((b) => prog[b.id] && prog[b.id].pct > 0.01 && !prog[b.id].done).sort((a, b) => prog[b.id].at - prog[a.id].at);
      const favs = all.filter((b) => App.fav.has(typeOf(b), b.id));
      const recentIds = App.activity.list(['book', 'article']).map((x) => x.id);
      const recent = recentIds.map((id) => all.find((b) => b.id === id)).filter(Boolean).slice(0, 6);
      const toks = q.toLowerCase();
      const list = all.filter((b) => (cat === 'all' || (cat === 'yours' ? !b.sample : b.cat === cat)) && (!toks || [b.title, b.author, b.blurb, b.cat].join(' ').toLowerCase().includes(toks)));
      const shelf = (title, items, seed) => items.length ? App.ui.sectionHead(title, null, '', seed) + `<div class="shelf grid grid-books">${items.map(bookCard).join('')}</div>` : '';
      let html = '';
      if (!q && cat === 'all') html += shelf('Continue reading', inProg, 3) + shelf('Recently opened', recent.filter((b) => !inProg.includes(b)), 4) + shelf('Favorites & bookmarks', favs, 5);
      html += App.ui.sectionHead(q ? 'Results' : cat === 'all' ? 'Whole library' : (App.content.readingCats.find((c) => c.id === cat) || {}).label, null, '', 6);
      html += list.length ? `<div class="shelf grid grid-books">${list.map(bookCard).join('')}</div>`
        : cat === 'yours' ? App.ui.emptyDoodle('pencil', 'No texts of your own yet', 'Paste an article, a story or notes — or import a .txt / .md file — to read it here.', '<button class="btn btn-primary" type="button" data-add-text>Add a text</button>')
          : App.ui.emptyDoodle('book', 'Nothing on this shelf', q ? `No titles match “${q}”.` : 'This category is empty for now.');
      const bm = App.store.get('bookmarks', {});
      const bmList = Object.entries(bm).flatMap(([id, arr]) => (arr || []).map((m) => Object.assign({ id }, m))).filter((m) => App.content.book(m.id)).sort((a, b) => b.at - a.at).slice(0, 6);
      if (!q && cat === 'all') html += App.ui.sectionHead('Your bookmarks', null, '', 7) + (bmList.length
        ? `<ul class="bm-list">${bmList.map((m) => `<li><a href="#/reading/read/${esc(m.id)}/${m.chapter}/${m.frac.toFixed(4)}">${icon('bookmark')}<span><b>${esc(App.content.book(m.id).title)}</b><small>“${esc(m.snippet)}…”</small></span></a></li>`).join('')}</ul>`
        : App.ui.emptyDoodle('bookmark', 'No bookmarks yet', 'Use the bookmark button while reading to mark a passage you want to return to.'));
      body.innerHTML = html;
    };
    draw();
    $('#lib-q', root).addEventListener('input', App.debounce((e) => { q = e.target.value.trim(); draw(); }, 120));
    root.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-cat]');
      if (c) { cat = c.dataset.cat; $$('[data-cat]', root).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); draw(); }
      if (e.target.closest('[data-add-text]')) addTextDialog(draw);
      const d = e.target.closest('[data-del-book]');
      if (d) {
        const b = App.content.book(d.dataset.delBook);
        if (b && await App.confirm('Delete this text?', `“${b.title}” will be removed from this browser.`, 'Delete', true)) {
          App.store.update('userBooks', [], (a) => a.filter((x) => x.id !== b.id)); App.fav.remove(typeOf(b), b.id); App.toast('Text deleted'); draw();
        }
      }
    });
  }

  function addTextDialog(after) {
    App.modal({
      title: 'Add your own text', className: 'wide',
      body: `<div class="field"><label for="ut-title">Title</label><input class="input" id="ut-title" maxlength="120" placeholder="e.g. Letters from the coast"></div>
        <div class="field"><label for="ut-author">Author (optional)</label><input class="input" id="ut-author" maxlength="80"></div>
        <div class="field"><label for="ut-kind">Kind</label><select class="input" id="ut-kind"><option value="article">Article</option><option value="book">Book</option></select></div>
        <div class="field"><label for="ut-text">Text</label><textarea class="input" id="ut-text" rows="8" placeholder="Paste text here. Blank lines start new paragraphs. Lines starting with '# ' start new chapters."></textarea></div>
        <div class="field"><span class="lbl">…or import a file</span><input type="file" id="ut-file" accept=".txt,.md,text/plain,text/markdown"></div>
        <p class="fine-print">Stored only in this browser (local storage, a few MB at most).</p>`,
      onOpen(dlg) {
        $('#ut-file', dlg).addEventListener('change', (e) => {
          const file = e.target.files[0]; if (!file) return;
          if (file.size > 1.5e6) { App.toast('That file is too large for browser storage (max ~1.5 MB).'); return; }
          const fr = new FileReader();
          fr.onload = () => { $('#ut-text', dlg).value = String(fr.result); if (!$('#ut-title', dlg).value) $('#ut-title', dlg).value = file.name.replace(/\.(txt|md)$/i, ''); };
          fr.onerror = () => App.toast('Could not read that file.');
          fr.readAsText(file);
        });
      },
      actions: [{ label: 'Cancel' }, {
        label: 'Add to library', primary: true, onClick(dlg) {
          const title = $('#ut-title', dlg).value.trim(), text = $('#ut-text', dlg).value.trim();
          if (!title || text.length < 20) { App.toast('Please add a title and at least a few sentences.'); return false; }
          const parts = text.split(/^#\s+/m).filter((x) => x.trim());
          const chapters = parts.length > 1 ? parts.map((p) => { const [h, ...rest] = p.split('\n'); return { title: h.trim(), text: rest.join('\n').trim() }; }) : [{ title, text }];
          const b = { id: 'u-' + App.uid(), kind: $('#ut-kind', dlg).value, cat: 'yours', title, author: $('#ut-author', dlg).value.trim() || 'You', color: Math.floor(Math.random() * 6), motif: ['leaf', 'star', 'moon', 'pencil'][Math.floor(Math.random() * 4)], blurb: text.slice(0, 120), chapters };
          const ok = App.store.update('userBooks', [], (a) => { a.push(b); });
          if (ok) { App.toast('Added to your library'); after && after(); }
        },
      }],
    });
  }

  /* ---------------- reader ---------------- */
  function reader(root, id, chArg, fracArg) {
    const b = App.content.book(id);
    if (!b) { root.innerHTML = `<section class="page">${App.ui.emptyDoodle('book', 'This text could not be found', 'It may have been deleted from this browser.', '<a class="btn btn-primary" href="#/reading">Back to the library</a>')}</section>`; return; }
    const saved = getProg(id) || {};
    let chapter = chArg != null && !isNaN(chArg) ? App.clamp(+chArg, 0, b.chapters.length - 1) : App.clamp(saved.chapter || 0, 0, b.chapters.length - 1);
    let restoreFrac = fracArg != null && !isNaN(fracArg) ? +fracArg : saved.chapter === chapter ? saved.frac || 0 : 0;
    let p = prefs(), focus = false, sessionStart = Date.now(), counted = 0, countdown = null;
    App.activity.log({ type: typeOf(b), id: b.id, title: b.title, sub: b.author });
    App.store.update('readingStats', { seconds: 0, sessions: 0, days: {} }, (s) => { s.sessions++; });

    root.innerHTML = `
    <div class="reader" data-rtheme="${p.theme}">
      <div class="reader-progress"><span></span></div>
      <header class="reader-bar">
        <a class="icon-btn" href="#/reading" aria-label="Back to library">${icon('left')}</a>
        <div class="rb-title"><b>${esc(b.title)}</b><small class="rb-ch"></small></div>
        <div class="rb-actions">
          <button type="button" class="rb-timer chip" data-timer aria-label="Reading timer">${icon('timer')}<span class="rt-val">0:00</span></button>
          ${b.chapters.length > 1 ? `<button type="button" class="icon-btn" data-toc aria-label="Chapters">${icon('list')}</button>` : ''}
          <button type="button" class="icon-btn" data-bookmark aria-label="Add bookmark here">${icon('bookmark')}</button>
          <button type="button" class="icon-btn" data-bmlist aria-label="Show bookmarks">${icon('star')}</button>
          <button type="button" class="icon-btn" data-textset aria-label="Text settings" aria-expanded="false">${icon('type')}</button>
          <button type="button" class="icon-btn" data-focus aria-label="Focus mode">${icon('eye')}</button>
          ${App.ui.favBtn(typeOf(b), b.id, b.title)}
        </div>
      </header>
      <div class="text-settings" hidden>
        <div class="ts-row"><span>Size</span><button class="icon-btn" data-size="-1" aria-label="Smaller text">${icon('minus')}</button><output class="ts-size"></output><button class="icon-btn" data-size="1" aria-label="Larger text">${icon('plus')}</button></div>
        <div class="ts-row"><label for="ts-line">Spacing</label><input type="range" id="ts-line" min="1.4" max="2.2" step="0.05"></div>
        <div class="ts-row"><label for="ts-width">Width</label><input type="range" id="ts-width" min="480" max="900" step="20"></div>
        <div class="ts-row"><span>Font</span><div class="chips">${['serif', 'sans'].map((f) => `<button class="chip" data-font="${f}">${f === 'serif' ? 'Serif' : 'Sans'}</button>`).join('')}</div></div>
        <div class="ts-row"><span>Paper</span><div class="chips">${[['app', 'Match app'], ['cream', 'Cream'], ['sepia', 'Sepia'], ['dark', 'Dark'], ['black', 'Black']].map(([k, l]) => `<button class="chip" data-rth="${k}">${l}</button>`).join('')}</div></div>
      </div>
      <article class="reader-text" lang="en"></article>
      <nav class="reader-nav"></nav>
      <button type="button" class="btn btn-ghost focus-exit" data-focus hidden>${icon('minimize')}Exit focus</button>
    </div>`;
    const R = $('.reader', root), art = $('.reader-text', R), bar = $('.reader-progress span', R);

    const applyPrefs = () => {
      R.style.setProperty('--r-size', p.size + 'px'); R.style.setProperty('--r-line', p.line); R.style.setProperty('--r-width', p.width + 'px');
      R.dataset.rtheme = p.theme; R.dataset.rfont = p.font;
      $('.ts-size', R).textContent = p.size + 'px'; $('#ts-line', R).value = p.line; $('#ts-width', R).value = p.width;
      $$('[data-font]', R).forEach((x) => x.classList.toggle('on', x.dataset.font === p.font));
      $$('[data-rth]', R).forEach((x) => x.classList.toggle('on', x.dataset.rth === p.theme));
      App.store.set('readPrefs', p);
    };
    const drawChapter = () => {
      const ch = b.chapters[chapter];
      $('.rb-ch', R).textContent = b.chapters.length > 1 ? `${ch.title} · ${chapter + 1} of ${b.chapters.length}` : `${b.author || ''}`;
      const paras = ch.text.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
      const isPoem = b.cat === 'poetry';
      art.innerHTML = `<header class="rt-head"><span class="rt-kicker hand">${esc(b.chapters.length > 1 ? 'chapter ' + (chapter + 1) : b.cat)}</span><h1>${esc(ch.title)}</h1>${chapter === 0 && b.author ? `<p class="rt-author">${esc(b.author)}</p>` : ''}</header>` +
        paras.map((t) => isPoem ? `<p class="poem">${esc(t).replace(/\n/g, '<br>')}</p>` : `<p>${esc(t).replace(/\n/g, ' ')}</p>`).join('') +
        `<div class="rt-end" aria-hidden="true">${App.doodle.star()}</div>`;
      $('.reader-nav', R).innerHTML = `
        ${chapter > 0 ? `<button class="btn btn-ghost" data-ch="${chapter - 1}">${icon('left')}Previous chapter</button>` : '<span></span>'}
        ${chapter < b.chapters.length - 1 ? `<button class="btn btn-primary" data-ch="${chapter + 1}">Next chapter${icon('right')}</button>` : `<a class="btn btn-primary" href="#/reading">${icon('check')}Back to the library</a>`}`;
    };
    const geom = () => { const top = art.getBoundingClientRect().top + window.scrollY, h = art.offsetHeight, vh = window.innerHeight, maxScroll = document.documentElement.scrollHeight - vh; return { top, span: Math.max(1, Math.min(h - vh * 0.6, maxScroll - top + vh * 0.25)) }; };
    const fracNow = () => { const g = geom(); return App.clamp((window.scrollY - g.top + window.innerHeight * 0.25) / g.span, 0, 1); };
    const restore = (fr) => requestAnimationFrame(() => { const g = geom(); window.scrollTo(0, fr > 0.001 ? g.top + fr * g.span - window.innerHeight * 0.25 : 0); onScroll(); });
    const save = App.debounce(() => {
      const frac = fracNow(), pct = (chapter + frac) / b.chapters.length;
      const prev = getProg(id) || {};
      setProg(id, { chapter, frac, pct: Math.max(pct, prev.done ? 1 : 0), done: prev.done || (chapter === b.chapters.length - 1 && frac > 0.97) });
      if (chapter === b.chapters.length - 1 && frac > 0.97 && !prev.done) App.toast('Finished! Pip is proud of you.');
    }, 400);
    const onScroll = () => { bar.style.width = ((chapter + fracNow()) / b.chapters.length) * 100 + '%'; save(); };

    applyPrefs(); drawChapter(); restore(restoreFrac);
    window.addEventListener('scroll', onScroll, { passive: true });

    /* reading time, counted only while visible */
    const statTimer = setInterval(() => {
      const el = Math.floor((Date.now() - sessionStart) / 1000);
      $('.rt-val', R).textContent = countdown ? App.fmtTime(Math.max(0, (countdown - Date.now()) / 1000)) : App.fmtTime(el);
      if (countdown && Date.now() >= countdown) { countdown = null; $('.rb-timer', R).classList.remove('on'); App.toast('Reading timer finished — a good place to pause.', { duration: 6000 }); }
      if (!document.hidden) {
        counted++;
        if (counted % 15 === 0) App.store.update('readingStats', { seconds: 0, sessions: 0, days: {} }, (s) => { s.seconds += 15; s.days = s.days || {}; s.days[dayKey()] = (s.days[dayKey()] || 0) + 15; });
      }
    }, 1000);

    const setFocus = (on) => {
      focus = on; document.body.classList.toggle('focus-mode', on);
      $('.focus-exit', R).hidden = !on;
      if (on) App.toast('Focus mode — press Esc to exit');
    };
    const onKey = (e) => { if (e.key === 'Escape' && focus && !document.querySelector('dialog[open]')) setFocus(false); };
    document.addEventListener('keydown', onKey);

    R.addEventListener('click', (e) => {
      const t = e.target;
      const ch = t.closest('[data-ch]'); if (ch) { save.flush && save.flush(); chapter = +ch.dataset.ch; drawChapter(); restore(0); setProg(id, { chapter, frac: 0, pct: chapter / b.chapters.length }); return; }
      if (t.closest('[data-focus]')) return setFocus(!focus);
      if (t.closest('[data-textset]')) { const ts = $('.text-settings', R); ts.hidden = !ts.hidden; t.closest('[data-textset]').setAttribute('aria-expanded', !ts.hidden); return; }
      const sz = t.closest('[data-size]'); if (sz) { p.size = App.clamp(p.size + +sz.dataset.size, 14, 28); applyPrefs(); return; }
      const fo = t.closest('[data-font]'); if (fo) { p.font = fo.dataset.font; applyPrefs(); return; }
      const th = t.closest('[data-rth]'); if (th) { p.theme = th.dataset.rth; applyPrefs(); return; }
      if (t.closest('[data-bookmark]')) {
        const vis = $$('p', art).find((x) => x.getBoundingClientRect().bottom > 90) || $('p', art);
        const snippet = (vis ? vis.textContent : '').slice(0, 80);
        App.store.update('bookmarks', {}, (all) => { all[id] = (all[id] || []).concat({ chapter, frac: fracNow(), snippet, at: Date.now() }).slice(-30); });
        const btn = t.closest('[data-bookmark]'); btn.classList.add('pop', 'on'); setTimeout(() => btn.classList.remove('pop'), 400);
        App.toast('Bookmark added'); return;
      }
      if (t.closest('[data-bmlist]')) {
        const list = (App.store.get('bookmarks', {})[id] || []).slice().reverse();
        App.modal({
          title: 'Bookmarks', body: list.length ? `<ul class="bm-list">${list.map((m, i) => `<li><button type="button" data-go="${i}">${icon('bookmark')}<span><b>${b.chapters.length > 1 ? esc(b.chapters[m.chapter].title) : Math.round(m.frac * 100) + '% in'}</b><small>“${esc(m.snippet)}…”</small></span></button><button type="button" class="icon-btn" data-delbm="${i}" aria-label="Delete bookmark">${icon('trash')}</button></li>`).join('')}</ul>`
            : '<p>No bookmarks in this text yet. Use the bookmark button to save a passage.</p>',
          onOpen(dlg, close) {
            dlg.addEventListener('click', (ev) => {
              const g = ev.target.closest('[data-go]');
              if (g) { const m = list[+g.dataset.go]; chapter = m.chapter; drawChapter(); restore(m.frac); close(); }
              const d = ev.target.closest('[data-delbm]');
              if (d) { const m = list[+d.dataset.delbm]; App.store.update('bookmarks', {}, (all) => { all[id] = (all[id] || []).filter((x) => x.at !== m.at); }); d.closest('li').remove(); }
            });
          },
        });
        return;
      }
      if (t.closest('[data-toc]')) {
        App.modal({
          title: 'Chapters', body: `<ol class="toc">${b.chapters.map((c, i) => `<li><button type="button" class="${i === chapter ? 'on' : ''}" data-tc="${i}">${esc(c.title)}</button></li>`).join('')}</ol>`,
          onOpen(dlg, close) { dlg.addEventListener('click', (ev) => { const x = ev.target.closest('[data-tc]'); if (x) { chapter = +x.dataset.tc; drawChapter(); restore(0); close(); } }); },
        });
        return;
      }
      if (t.closest('[data-timer]')) {
        App.modal({
          title: 'Reading timer', body: `<p>Set a gentle countdown. You'll get a quiet note when it's done.</p><div class="chips">${[10, 20, 30, 45].map((m) => `<button type="button" class="chip" data-cd="${m}">${m} min</button>`).join('')}<button type="button" class="chip" data-cd="0">No timer</button></div>`,
          onOpen(dlg, close) { dlg.addEventListener('click', (ev) => { const x = ev.target.closest('[data-cd]'); if (x) { const m = +x.dataset.cd; countdown = m ? Date.now() + m * 60000 : null; $('.rb-timer', R).classList.toggle('on', !!m); if (m) App.toast(`Timer set for ${m} minutes`); close(); } }); },
        });
      }
    });
    R.addEventListener('input', (e) => {
      if (e.target.id === 'ts-line') { p.line = +e.target.value; applyPrefs(); }
      if (e.target.id === 'ts-width') { p.width = +e.target.value; applyPrefs(); }
    });
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); clearInterval(statTimer); document.body.classList.remove('focus-mode'); };
  }

  App.pages.reading = {
    title: (params) => (params[0] === 'read' && App.content.book(params[1]) ? App.content.book(params[1]).title : 'Reading'),
    render(root, params) {
      if (params[0] === 'read') return reader(root, params[1], params[2], params[3]);
      return library(root);
    },
  };
})();

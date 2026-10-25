/* Minesweeper — first click is always safe; right-click / long-press / flag mode to flag; click a number to chord. */
(function () {
  'use strict';
  const App = window.App;
  const { icon, $ } = App;
  const LEVELS = { easy: { w: 9, h: 9, m: 10, label: 'Easy' }, medium: { w: 16, h: 16, m: 40, label: 'Medium' }, hard: { w: 30, h: 16, m: 99, label: 'Hard' } };

  App.games.minesweeper = {
    mount(stage, api) {
      let level = App.store.get('msPrefs', { level: 'easy' }).level;
      if (!LEVELS[level]) level = 'easy';
      let cells, W, H, M, started, over, opened, flags, t0, elapsed, timer, flagMode = false, paused = false, focusIdx = 0;
      api.canPause(true);
      api.help('Click to reveal · right-click, long-press or Flag mode to flag · click a number to clear around it · arrows + Enter / F on keyboard');

      stage.innerHTML = `
        <div class="ms-wrap">
          <div class="game-toolbar">
            <div class="chips" role="radiogroup" aria-label="Difficulty">${Object.entries(LEVELS).map(([k, v]) => `<button type="button" class="chip" data-lv="${k}" role="radio">${v.label}</button>`).join('')}</div>
            <button type="button" class="chip ms-flagmode" data-flagmode aria-pressed="false">${icon('flag')}Flag mode</button>
          </div>
          <div class="ms-scroll"><div class="ms-board" role="grid" aria-label="Minefield"></div></div>
          <div class="game-paused" hidden><p>Paused</p><button type="button" class="btn btn-primary" data-resume>${icon('play')}Resume</button></div>
        </div>`;
      const board = $('.ms-board', stage), pausedEl = $('.game-paused', stage);

      const nb = (i) => { const x = i % W, y = (i / W) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); } return out; };
      const status = () => api.status(`<span class="gs">${icon('mine')}${M - flags}</span><span class="gs">${icon('clock')}${App.fmtTime(elapsed)}</span>`);

      function newGame() {
        const L = LEVELS[level]; W = L.w; H = L.h; M = L.m;
        cells = Array.from({ length: W * H }, () => ({ mine: false, open: false, flag: false, n: 0 }));
        started = over = false; opened = flags = 0; elapsed = 0; paused = false; clearInterval(timer);
        stage.querySelectorAll('[data-lv]').forEach((b) => { const on = b.dataset.lv === level; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
        board.style.setProperty('--cols', W);
        board.classList.toggle('wide', W > 16);
        board.innerHTML = cells.map((_, i) => `<button type="button" class="ms-cell" role="gridcell" data-i="${i}" tabindex="${i === 0 ? 0 : -1}" aria-label="Hidden"></button>`).join('');
        focusIdx = 0; pausedEl.hidden = true; api.setPaused(false);
        status();
      }
      function plant(safe) {
        const banned = new Set([safe, ...nb(safe)]);
        let placed = 0;
        while (placed < M) { const i = Math.floor(Math.random() * W * H); if (!cells[i].mine && !banned.has(i)) { cells[i].mine = true; placed++; } }
        cells.forEach((c, i) => { c.n = nb(i).filter((j) => cells[j].mine).length; });
        started = true; t0 = Date.now();
        timer = setInterval(() => { if (!paused && !over) { elapsed = Math.floor((Date.now() - t0) / 1000); status(); } }, 250);
      }
      const el = (i) => board.children[i];
      function paint(i) {
        const c = cells[i], b = el(i);
        b.className = 'ms-cell' + (c.open ? ' open n' + c.n : '') + (c.flag ? ' flag' : '') + (c.open && c.mine ? ' mine' : '');
        b.innerHTML = c.flag ? icon('flag') : c.open && c.mine ? icon('mine') : c.open && c.n ? c.n : '';
        b.setAttribute('aria-label', c.flag ? 'Flagged' : !c.open ? 'Hidden' : c.mine ? 'Mine' : c.n ? c.n + ' mines nearby' : 'Empty');
      }
      function open(i) {
        if (over || paused) return;
        if (!started) plant(i);
        const c = cells[i];
        if (c.flag) return;
        if (c.open) { // chord
          const ns = nb(i); if (c.n && ns.filter((j) => cells[j].flag).length === c.n) ns.forEach((j) => { if (!cells[j].open && !cells[j].flag) reveal(j); });
        } else reveal(i);
        check();
      }
      function reveal(i) {
        const stack = [i];
        while (stack.length) {
          const k = stack.pop(), c = cells[k];
          if (c.open || c.flag) continue;
          c.open = true; paint(k);
          if (c.mine) { lose(k); return; }
          opened++;
          if (c.n === 0) nb(k).forEach((j) => { if (!cells[j].open) stack.push(j); });
        }
      }
      function flag(i) {
        if (over || paused) return;
        const c = cells[i]; if (c.open) return;
        c.flag = !c.flag; flags += c.flag ? 1 : -1; paint(i); status();
        if (navigator.vibrate) navigator.vibrate(12);
      }
      function lose(hit) {
        over = true; clearInterval(timer);
        cells.forEach((c, i) => { if (c.mine && !c.flag) { c.open = true; paint(i); } else if (c.flag && !c.mine) el(i).classList.add('wrong'); });
        el(hit).classList.add('hit');
        App.scores.bump('minesweeper', 'losses');
        api.status(`<span class="gs lose">Boom — try again?</span>`);
      }
      function check() {
        if (over || opened !== W * H - M) return;
        over = true; clearInterval(timer);
        elapsed = Math.floor((Date.now() - t0) / 1000);
        cells.forEach((c, i) => { if (c.mine && !c.flag) { c.flag = true; paint(i); } });
        App.scores.bump('minesweeper', 'wins');
        const r = App.scores.submit('minesweeper', 'best-' + level, elapsed, true);
        api.status(`<span class="gs win">${icon('check')}Cleared in ${App.fmtTime(elapsed)}</span>`);
        api.celebrate(r === 'best' ? 'New personal best!' : 'Field cleared!', `${LEVELS[level].label} in ${App.fmtTime(elapsed)}${r === 'first' ? ' — your first record.' : ''}`);
      }
      function setPause(p) {
        if (over || !started) { paused = false; return; }
        if (p && !paused) { paused = true; elapsed = Math.floor((Date.now() - t0) / 1000); }
        else if (!p && paused) { paused = false; t0 = Date.now() - elapsed * 1000; }
        pausedEl.hidden = !paused; board.classList.toggle('blur', paused); api.setPaused(paused);
      }

      /* input */
      let pressTimer = null, longPressed = false;
      board.addEventListener('contextmenu', (e) => { e.preventDefault(); const b = e.target.closest('.ms-cell'); if (b) flag(+b.dataset.i); });
      board.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('.ms-cell'); if (!b || e.pointerType === 'mouse') return;
        longPressed = false; clearTimeout(pressTimer);
        pressTimer = setTimeout(() => { longPressed = true; flag(+b.dataset.i); }, 420);
      });
      const cancelPress = () => clearTimeout(pressTimer);
      board.addEventListener('pointerup', cancelPress); board.addEventListener('pointercancel', cancelPress); board.addEventListener('pointerleave', cancelPress);
      board.addEventListener('click', (e) => {
        const b = e.target.closest('.ms-cell'); if (!b) return;
        if (longPressed) { longPressed = false; return; }
        const i = +b.dataset.i; focusIdx = i;
        flagMode && !cells[i].open ? flag(i) : open(i);
      });
      board.addEventListener('keydown', (e) => {
        const b = e.target.closest('.ms-cell'); if (!b) return;
        let i = +b.dataset.i, x = i % W, y = (i / W) | 0;
        const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (mv) { e.preventDefault(); x = App.clamp(x + mv[0], 0, W - 1); y = App.clamp(y + mv[1], 0, H - 1); const n = y * W + x; el(i).tabIndex = -1; el(n).tabIndex = 0; el(n).focus(); focusIdx = n; }
        else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); flag(i); }
      });
      stage.addEventListener('click', (e) => {
        const lv = e.target.closest('[data-lv]'); if (lv) { level = lv.dataset.lv; App.store.set('msPrefs', { level }); newGame(); }
        const fm = e.target.closest('[data-flagmode]'); if (fm) { flagMode = !flagMode; fm.classList.toggle('on', flagMode); fm.setAttribute('aria-pressed', flagMode); }
        if (e.target.closest('[data-resume]')) setPause(false);
      });
      newGame();
      return {
        restart: newGame,
        togglePause: () => setPause(!paused),
        pause: () => setPause(true),
        destroy: () => clearInterval(timer),
      };
    },
  };
})();

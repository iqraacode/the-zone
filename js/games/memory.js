/* Memory Match — flip hand-drawn cards, find all pairs in as few moves as possible. */
(function () {
  'use strict';
  const App = window.App;
  const { icon, $, $$ } = App;
  const SYMBOLS = ['star', 'moon', 'leaf', 'coffee', 'book', 'note', 'rain', 'heart', 'sun', 'tree', 'fire', 'sparkle', 'waves', 'bell', 'puzzle', 'chess'];
  const SIZES = { 16: { cols: 4, label: '4 × 4' }, 20: { cols: 5, label: '5 × 4' }, 24: { cols: 6, label: '6 × 4' } };
  const TINTS = ['m-a', 'm-b', 'm-c', 'm-d'];

  App.games.memory = {
    mount(stage, api) {
      let size = String(App.store.get('memPrefs', { size: 16 }).size); if (!SIZES[size]) size = '16';
      let deck, flipped, matched, moves, lock, t0, elapsed, timer, started, paused = false;
      api.canPause(true);
      api.help('Flip two cards at a time and find every matching pair · keyboard: Tab to a card, Enter to flip');
      stage.innerHTML = `
        <div class="mem-wrap">
          <div class="game-toolbar"><div class="chips" role="radiogroup" aria-label="Board size">${Object.entries(SIZES).map(([k, v]) => `<button type="button" class="chip" data-size="${k}" role="radio">${v.label}</button>`).join('')}</div></div>
          <div class="mem-board"></div>
          <div class="game-paused" hidden><p>Paused</p><button type="button" class="btn btn-primary" data-resume>${icon('play')}Resume</button></div>
        </div>`;
      const board = $('.mem-board', stage), pausedEl = $('.game-paused', stage);
      const status = () => api.status(`<span class="gs">Moves <b>${moves}</b></span><span class="gs">${icon('clock')}${App.fmtTime(elapsed)}</span><span class="gs">Pairs <b>${matched}/${deck.length / 2}</b></span>`);

      function newGame() {
        const n = +size, syms = App.shuffle(SYMBOLS).slice(0, n / 2);
        deck = App.shuffle(syms.concat(syms)).map((s, i) => ({ s, tint: TINTS[SYMBOLS.indexOf(s) % 4], i, done: false }));
        flipped = []; matched = 0; moves = 0; lock = false; elapsed = 0; started = false; paused = false; clearInterval(timer);
        $$('[data-size]', stage).forEach((b) => { const on = b.dataset.size === size; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
        board.style.setProperty('--cols', SIZES[size].cols);
        board.innerHTML = deck.map((c, i) => `
          <button type="button" class="mem-card" data-i="${i}" aria-label="Card ${i + 1}, face down">
            <span class="mem-inner">
              <span class="mem-back"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="${App.sketch.circle(30, 30, 14, 14, i + 3, 0.08, 0.5)}" class="mem-scrib"/></svg></span>
              <span class="mem-face ${c.tint}">${icon(c.s, 'mem-ico')}</span>
            </span>
          </button>`).join('');
        pausedEl.hidden = true; board.classList.remove('blur'); api.setPaused(false);
        status();
      }
      function flip(i) {
        const c = deck[i]; if (lock || paused || c.done || flipped.includes(i)) return;
        if (!started) { started = true; t0 = Date.now(); timer = setInterval(() => { if (!paused) { elapsed = Math.floor((Date.now() - t0) / 1000); status(); } }, 500); }
        const el = board.children[i];
        el.classList.add('up'); el.setAttribute('aria-label', `Card ${i + 1}, ${c.s}`);
        flipped.push(i);
        if (flipped.length === 2) {
          moves++;
          const [a, b] = flipped;
          if (deck[a].s === deck[b].s) {
            deck[a].done = deck[b].done = true; matched++;
            [a, b].forEach((k) => { board.children[k].classList.add('done'); board.children[k].setAttribute('aria-label', `Card ${k + 1}, ${deck[k].s}, matched`); });
            flipped = [];
            if (matched === deck.length / 2) win();
          } else {
            lock = true;
            setTimeout(() => {
              [a, b].forEach((k) => { board.children[k].classList.remove('up'); board.children[k].setAttribute('aria-label', `Card ${k + 1}, face down`); });
              flipped = []; lock = false;
            }, App.reducedMotion() ? 650 : 850);
          }
        }
        status();
      }
      function win() {
        clearInterval(timer); elapsed = Math.floor((Date.now() - t0) / 1000); status();
        const r = App.scores.submit('memory', 'best-' + size, moves, true);
        App.scores.submit('memory', 'time-' + size, elapsed, true);
        App.scores.bump('memory', 'wins');
        setTimeout(() => api.celebrate(r === 'best' ? 'Fewest moves yet!' : 'All pairs found!', `${moves} moves in ${App.fmtTime(elapsed)}.`), 350);
      }
      function setPause(p) {
        if (!started || matched === deck.length / 2) return;
        if (p && !paused) { paused = true; elapsed = Math.floor((Date.now() - t0) / 1000); }
        else if (!p && paused) { paused = false; t0 = Date.now() - elapsed * 1000; }
        pausedEl.hidden = !paused; board.classList.toggle('blur', paused); api.setPaused(paused);
      }
      stage.addEventListener('click', (e) => {
        const c = e.target.closest('.mem-card'); if (c) flip(+c.dataset.i);
        const s = e.target.closest('[data-size]'); if (s) { size = s.dataset.size; App.store.set('memPrefs', { size: +size }); newGame(); }
        if (e.target.closest('[data-resume]')) setPause(false);
      });
      newGame();
      return { restart: newGame, togglePause: () => setPause(!paused), pause: () => setPause(true), destroy: () => clearInterval(timer) };
    },
  };
})();

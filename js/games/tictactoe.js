/* Tic-tac-toe — against Pip (easy / perfect) or a friend on the same device. Marks are drawn by hand. */
(function () {
  'use strict';
  const App = window.App;
  const { icon, $, $$ } = App;
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winner = (b) => { for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { p: b[l[0]], line: l }; return b.every(Boolean) ? { p: 'draw' } : null; };
  function minimax(b, me, turn, depth) {
    const w = winner(b);
    if (w) return { s: w.p === 'draw' ? 0 : w.p === me ? 10 - depth : depth - 10 };
    let best = { s: turn === me ? -99 : 99, i: -1 };
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = turn; const r = minimax(b, me, turn === 'X' ? 'O' : 'X', depth + 1); b[i] = null;
      if (turn === me ? r.s > best.s : r.s < best.s) best = { s: r.s, i };
    }
    return best;
  }
  const xPath = (seed) => `${App.sketch.line(24, 24, 76, 76, seed, 3)}${App.sketch.line(76, 24, 24, 76, seed + 7, 3)}`;
  const oPath = (seed) => App.sketch.circle(50, 50, 27, 27, seed, 0.06, 0.4);

  App.games.tictactoe = {
    mount(stage, api) {
      const prefs = App.store.get('tttPrefs', { mode: 'ai', level: 'easy', pipFirst: false });
      let board, turn, done, startWith = 'X';
      api.help('Get three in a row. Play against Pip, or pass the device to a friend.');
      stage.innerHTML = `
        <div class="ttt-wrap">
          <div class="game-toolbar">
            <div class="chips" role="radiogroup" aria-label="Opponent">
              <button type="button" class="chip" data-mode="ai" role="radio">${icon('cpu')}vs Pip</button>
              <button type="button" class="chip" data-mode="pvp" role="radio">${icon('users')}Two players</button>
            </div>
            <div class="chips ttt-level" role="radiogroup" aria-label="Pip's level">
              <button type="button" class="chip" data-level="easy" role="radio">Relaxed</button>
              <button type="button" class="chip" data-level="hard" role="radio">Unbeatable</button>
            </div>
          </div>
          <div class="ttt-stage">
            <div class="ttt-board" role="grid" aria-label="Tic-tac-toe board">
              <svg class="ttt-grid" viewBox="0 0 300 300" aria-hidden="true"><path d="${App.sketch.line(100, 8, 100, 292, 3, 3)}${App.sketch.line(200, 8, 200, 292, 4, 3)}${App.sketch.line(8, 100, 292, 100, 5, 3)}${App.sketch.line(8, 200, 292, 200, 6, 3)}"/></svg>
              ${Array.from({ length: 9 }, (_, i) => `<button type="button" class="ttt-cell" data-i="${i}" aria-label="Square ${i + 1}, empty"></button>`).join('')}
              <svg class="ttt-win" viewBox="0 0 300 300" aria-hidden="true"><path pathLength="1"/></svg>
            </div>
            <div class="ttt-side">
              <div class="ttt-turn" aria-live="polite"></div>
              <div class="ttt-score"></div>
              <button type="button" class="btn btn-primary" data-again>${icon('refresh')}New round</button>
            </div>
          </div>
        </div>`;
      const boardEl = $('.ttt-board', stage), turnEl = $('.ttt-turn', stage), winEl = $('.ttt-win path', stage);
      const sync = () => {
        $$('[data-mode]', stage).forEach((b) => { const on = b.dataset.mode === prefs.mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
        $$('[data-level]', stage).forEach((b) => { const on = b.dataset.level === prefs.level; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
        $('.ttt-level', stage).style.visibility = prefs.mode === 'ai' ? 'visible' : 'hidden';
        App.store.set('tttPrefs', prefs);
        const s = App.scores.get('tictactoe');
        $('.ttt-score', stage).innerHTML = prefs.mode === 'ai'
          ? `<div><b>${s.wins || 0}</b><span>You</span></div><div><b>${s.draws || 0}</b><span>Draws</span></div><div><b>${s.losses || 0}</b><span>Pip</span></div>`
          : `<div><b>${s.pvpX || 0}</b><span>✕ wins</span></div><div><b>${s.pvpD || 0}</b><span>Draws</span></div><div><b>${s.pvpO || 0}</b><span>◯ wins</span></div>`;
      };
      const say = (txt, pose = 'idle') => { turnEl.innerHTML = `${prefs.mode === 'ai' ? App.pip(pose, { size: 54 }) : ''}<span class="hand">${txt}</span>`; };

      function newRound() {
        board = Array(9).fill(null); done = false; turn = startWith;
        $$('.ttt-cell', boardEl).forEach((c, i) => { c.innerHTML = ''; c.disabled = false; c.setAttribute('aria-label', `Square ${i + 1}, empty`); c.classList.remove('win'); });
        winEl.setAttribute('d', ''); winEl.parentNode.classList.remove('on');
        sync();
        if (prefs.mode === 'ai' && turn === 'O') { say('My turn first…', 'curious'); setTimeout(aiMove, 450); }
        else say(prefs.mode === 'ai' ? 'Your move — you are ✕' : `${turn === 'X' ? '✕' : '◯'} to play`);
        api.status(prefs.mode === 'ai' ? `<span class="gs">vs Pip · ${prefs.level === 'hard' ? 'Unbeatable' : 'Relaxed'}</span>` : '<span class="gs">Two players</span>');
      }
      function place(i, p) {
        board[i] = p;
        const c = boardEl.children[i + 1];
        c.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true" class="mark ${p === 'X' ? 'mx' : 'mo'}"><path d="${p === 'X' ? xPath(i * 13 + 1) : oPath(i * 7 + 2)}" pathLength="1"/></svg>`;
        c.disabled = true; c.setAttribute('aria-label', `Square ${i + 1}, ${p === 'X' ? 'cross' : 'nought'}`);
        const w = winner(board);
        if (w) return finish(w);
        turn = p === 'X' ? 'O' : 'X';
        if (prefs.mode === 'ai' && turn === 'O') { say('Hmm, let me think…', 'curious'); setTimeout(aiMove, 380 + Math.random() * 300); }
        else say(prefs.mode === 'ai' ? 'Your move' : `${turn === 'X' ? '✕' : '◯'} to play`);
      }
      function aiMove() {
        if (done) return;
        let i;
        const empties = board.map((v, k) => (v ? -1 : k)).filter((k) => k >= 0);
        if (prefs.level === 'hard' || Math.random() < 0.55) i = minimax(board.slice(), 'O', 'O', 0).i;
        if (i == null || i < 0 || board[i]) i = empties[Math.floor(Math.random() * empties.length)];
        place(i, 'O');
      }
      function finish(w) {
        done = true;
        $$('.ttt-cell', boardEl).forEach((c) => (c.disabled = true));
        if (w.line) {
          const ctr = (k) => [(k % 3) * 100 + 50, Math.floor(k / 3) * 100 + 50];
          const [a, b] = [ctr(w.line[0]), ctr(w.line[2])];
          const ext = [(b[0] - a[0]) * 0.18, (b[1] - a[1]) * 0.18];
          winEl.setAttribute('d', App.sketch.line(a[0] - ext[0], a[1] - ext[1], b[0] + ext[0], b[1] + ext[1], 9, 4));
          winEl.parentNode.classList.add('on');
          w.line.forEach((k) => boardEl.children[k + 1].classList.add('win'));
        }
        if (prefs.mode === 'ai') {
          if (w.p === 'X') { App.scores.bump('tictactoe', 'wins'); say('You win! Well played.', 'happy'); api.celebrate('You beat Pip!', prefs.level === 'hard' ? 'Wait… that should be impossible.' : 'Three in a row.'); }
          else if (w.p === 'O') { App.scores.bump('tictactoe', 'losses'); say('I got three! Again?', 'happy'); }
          else { App.scores.bump('tictactoe', 'draws'); say('A draw — cozy.', 'sleepy'); }
        } else {
          App.scores.bump('tictactoe', w.p === 'X' ? 'pvpX' : w.p === 'O' ? 'pvpO' : 'pvpD');
          say(w.p === 'draw' ? 'A draw!' : `${w.p === 'X' ? '✕' : '◯'} wins!`);
        }
        startWith = startWith === 'X' ? 'O' : 'X'; // alternate who starts
        sync();
      }
      stage.addEventListener('click', (e) => {
        const c = e.target.closest('.ttt-cell');
        if (c && !done && !board[+c.dataset.i] && !(prefs.mode === 'ai' && turn === 'O')) place(+c.dataset.i, turn);
        const m = e.target.closest('[data-mode]'); if (m) { prefs.mode = m.dataset.mode; startWith = 'X'; newRound(); }
        const l = e.target.closest('[data-level]'); if (l) { prefs.level = l.dataset.level; newRound(); }
        if (e.target.closest('[data-again]')) newRound();
      });
      newRound();
      return { restart: newRound };
    },
  };
})();

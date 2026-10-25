/* ==========================================================================
   GAME 3 — TIC TAC TRIP  (1–3 players)
   1P: vs 1 CPU on 3×3, or vs 2 CPUs on the 4×4 trio board.
   2P: classic 3×3.   3P: 4×4 board, three in a row wins.
   Optional "first to 3" match with a new-round button between rounds.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h;

  function linesFor(N, K) {
    var L = [], r, c, k, line;
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) dirs.forEach(function (d) {
      line = [];
      for (k = 0; k < K; k++) {
        var rr = r + d[0] * k, cc = c + d[1] * k;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) return;
        line.push(rr * N + cc);
      }
      L.push(line);
    });
    return L;
  }
  function winnerOf(board, lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i], v = board[l[0]];
      if (v < 0) continue;
      var ok = true;
      for (var j = 1; j < l.length; j++) if (board[l[j]] !== v) { ok = false; break; }
      if (ok) return { p: v, line: l };
    }
    return null;
  }
  function empties(board) { var e = []; board.forEach(function (v, i) { if (v < 0) e.push(i); }); return e; }
  function winningMove(board, lines, p) {
    var e = empties(board);
    for (var i = 0; i < e.length; i++) { board[e[i]] = p; var w = winnerOf(board, lines); board[e[i]] = -1; if (w) return e[i]; }
    return -1;
  }
  // perfect play for 2 players on 3×3
  function minimax(board, lines, me, toMove, nP, depth) {
    var w = winnerOf(board, lines);
    if (w) return { s: w.p === me ? 10 - depth : depth - 10 };
    var e = empties(board);
    if (!e.length) return { s: 0 };
    var best = null;
    for (var i = 0; i < e.length; i++) {
      board[e[i]] = toMove;
      var r = minimax(board, lines, me, (toMove + 1) % nP, nP, depth + 1);
      board[e[i]] = -1;
      if (!best || (toMove === me ? r.s > best.s : r.s < best.s)) best = { s: r.s, i: e[i] };
    }
    return best;
  }
  function heuristic(board, lines, N, me, nP) {
    var e = empties(board), scored = [];
    e.forEach(function (i) {
      var sc = 0;
      lines.forEach(function (l) {
        if (l.indexOf(i) < 0) return;
        var mine = 0, other = -1, mixed = false, theirs = 0;
        l.forEach(function (j) {
          var v = board[j];
          if (v < 0) return;
          if (v === me) mine++;
          else { if (other >= 0 && other !== v) mixed = true; other = v; theirs++; }
        });
        if (!theirs) sc += Math.pow(6, mine);
        else if (!mine && !mixed) sc += 0.7 * Math.pow(6, theirs);
      });
      var rr = Math.floor(i / N), cc = i % N, mid = (N - 1) / 2;
      sc += 1.5 - (Math.abs(rr - mid) + Math.abs(cc - mid)) * 0.3;
      scored.push({ i: i, s: sc });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored;
  }
  function botMove(board, lines, N, me, nP, level) {
    var w = winningMove(board, lines, me);
    if (w >= 0) return w;
    var e = empties(board);
    if (level === 'easy' && Math.random() < 0.45) return A.pick(e);
    // block: next players first
    for (var k = 1; k < nP; k++) {
      var b = winningMove(board, lines, (me + k) % nP);
      if (b >= 0 && (level === 'hard' || Math.random() < 0.7)) return b;
    }
    if (nP === 2 && N === 3 && level === 'hard') return minimax(board.slice(), lines, me, me, 2, 0).i;
    var s = heuristic(board, lines, N, me, nP);
    return level === 'hard' ? s[0].i : A.pick(s.slice(0, 3)).i;
  }

  A.register({
    id: 'tictac',
    title: 'Tic Tac Trip',
    tagline: 'Quick three-in-a-row with stars, balls and sails.',
    description: 'Line up three of your symbols to win. Two players use the classic 3×3 board; three players battle on a 4×4 board.',
    color: '#A88AA0',
    players: [1, 2, 3],
    cats: ['quick', 'multiplayer'],
    modes: { 1: 'vs CPU', 2: 'Classic 3×3', 3: '4×4 trio board' },
    pausable: false,
    options: function (n) {
      var o = [];
      if (n === 1) {
        o.push({ id: 'cpus', label: 'Opponents', def: 1, choices: [{ v: 1, label: '1 CPU · 3×3' }, { v: 2, label: '2 CPUs · 4×4' }] });
        o.push({ id: 'level', label: 'CPU skill', def: 'hard', choices: [{ v: 'easy', label: 'Relaxed' }, { v: 'hard', label: 'Sharp' }] });
      }
      o.push({ id: 'match', label: 'Match', def: 1, choices: [{ v: 1, label: 'Single round' }, { v: 3, label: 'First to 3' }] });
      return o;
    },
    rules: function (cfg) {
      var trio = cfg.players === 3 || (cfg.players === 1 && cfg.opts.cpus === 2);
      return [trio ? 'Three players share a 4×4 board.' : 'Two players share a 3×3 board.',
        'Take turns placing your symbol in an empty square.',
        'First to get three in a row (across, down or diagonal) wins the round.',
        'If the board fills up with no winner, the round is a draw.',
        cfg.opts.match === 3 ? 'First to win 3 rounds wins the match. The starting player rotates each round.' : 'Play again any time for a new round.'];
    },
    controls: function () { return [['Click / Tap', 'Place your symbol'], ['Arrow keys', 'Move between squares'], ['Enter / Space', 'Place on the focused square']]; },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var w = A.store.record('tictac', 'wins');
      return w ? 'Matches won against the CPU: ' + w : null;
    },

    create: function (ctx) {
      var cfg = ctx.cfg;
      var cpus = cfg.players === 1 ? (cfg.opts.cpus || 1) : 0;
      var roster = A.makeRoster(cfg.players, cpus);
      var nP = roster.length, N = nP === 3 ? 4 : 3, K = 3;
      var lines = linesFor(N, K);
      var level = cfg.opts.level || 'hard', target = cfg.opts.match || 1;
      var wins = roster.map(function () { return 0; });
      var board, turn, starter = 0, roundOver = false, busy = false, round = 0, draws = 0;

      var grid = h('div', { class: 'arc-ttt-grid', role: 'grid', 'aria-label': 'Tic Tac Trip board', style: { '--n': N } });
      var lineSvg = A.s('svg', { class: 'arc-ttt-win', viewBox: '0 0 ' + N * 100 + ' ' + N * 100, 'aria-hidden': 'true' });
      var nextBtn = h('button', { type: 'button', class: 'arc-btn arc-btn-primary', hidden: true, onclick: function () { newRound(); } }, 'Next round');
      var banner = h('div', { class: 'arc-ttt-banner', hidden: true });
      var boardEl = h('div', { class: 'arc-ttt-board' }, grid, lineSvg);
      var wrap = h('div', { class: 'arc-ttt' }, boardEl, h('div', { class: 'arc-ttt-foot' }, banner, nextBtn));
      var cells = [];
      for (var i = 0; i < N * N; i++) (function (i) {
        var b = h('button', { type: 'button', class: 'arc-ttt-cell', role: 'gridcell', onclick: function () { humanPlay(i); } });
        cells.push(b); grid.appendChild(b);
      })(i);
      grid.addEventListener('keydown', function (e) {
        var i = cells.indexOf(document.activeElement);
        var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: N, ArrowUp: -N }[e.key];
        if (i < 0 || !d) return;
        e.preventDefault();
        var j = i + d;
        if (j >= 0 && j < cells.length) cells[j].focus();
      });

      function label(i) {
        var r = Math.floor(i / N) + 1, c = i % N + 1, v = board[i];
        cells[i].setAttribute('aria-label', 'Row ' + r + ', column ' + c + ', ' + (v < 0 ? 'empty' : roster[v].name + ' ' + roster[v].symbol));
        cells[i].setAttribute('aria-disabled', v < 0 && !roundOver ? 'false' : 'true');
      }
      function refresh() {
        var p = roster[turn];
        boardEl.style.setProperty('--cur', p.color);
        boardEl.classList.toggle('is-human', !p.isBot && !roundOver);
        ctx.setScores(wins);
        ctx.setTurn(roundOver || ctx.over ? -1 : turn);
        var st = [['Round', round]];
        if (target > 1) st.push(['First to', target]);
        ctx.setStats(st);
        if (!roundOver) ctx.setStatus(p.isBot ? p.name + ' is thinking…' : (cfg.players === 1 ? 'Your move.' : p.name + "'s move."));
      }
      function newRound() {
        board = []; for (var i = 0; i < N * N; i++) board.push(-1);
        round++;
        turn = starter; starter = (starter + 1) % nP;
        roundOver = false; busy = false;
        A.clear(lineSvg);
        cells.forEach(function (c, i) { A.clear(c); c.className = 'arc-ttt-cell'; label(i); });
        nextBtn.hidden = true; banner.hidden = true;
        boardEl.classList.remove('is-done');
        refresh();
        if (!roster[turn].isBot) cells[Math.floor(N * N / 2)].focus({ preventScroll: true });
        botTurn();
      }
      function humanPlay(i) {
        if (ctx.over || roundOver || busy || roster[turn].isBot || board[i] >= 0) return;
        place(i);
      }
      function place(i) {
        if (board[i] >= 0) return; // occupied cells can never be chosen
        var p = roster[turn];
        board[i] = turn;
        var mark = h('span', { class: 'arc-ttt-mark' }, A.symbolSVG(p, 64));
        cells[i].appendChild(mark);
        cells[i].classList.add('is-filled');
        label(i);
        ctx.sfx('place');
        var w = winnerOf(board, lines);
        if (w) return roundEnd(w);
        if (!empties(board).length) return roundEnd(null);
        turn = (turn + 1) % nP;
        refresh();
        botTurn();
      }
      function botTurn() {
        if (ctx.over || roundOver || !roster[turn].isBot) return;
        busy = true;
        ctx.timeout(function () {
          busy = false;
          if (ctx.over || roundOver) return;
          place(botMove(board.slice(), lines, N, turn, nP, level));
        }, A.reducedMotion() ? 200 : A.randInt(380, 650));
      }
      function roundEnd(w) {
        roundOver = true;
        boardEl.classList.add('is-done');
        cells.forEach(function (c, i) { label(i); });
        var msg;
        if (w) {
          wins[w.p]++;
          w.line.forEach(function (i) { cells[i].classList.add('is-win'); });
          var a = w.line[0], b = w.line[w.line.length - 1];
          var ctr = function (i) { return [(i % N) * 100 + 50, Math.floor(i / N) * 100 + 50]; };
          var p1 = ctr(a), p2 = ctr(b);
          lineSvg.appendChild(A.s('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: A.OUTLINE, 'stroke-width': 22, 'stroke-linecap': 'round' }));
          lineSvg.appendChild(A.s('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: roster[w.p].color, 'stroke-width': 12, 'stroke-linecap': 'round' }));
          msg = roster[w.p].name === 'You' ? 'You win the round!' : roster[w.p].name + ' wins the round!';
          ctx.sfx('match');
        } else { draws++; msg = "It's a draw!"; ctx.sfx('bad'); }
        refresh();
        ctx.setStatus(msg);
        var champ = wins.indexOf(Math.max.apply(null, wins));
        if (target === 1 || wins[champ] >= target) {
          var rows = A.rank(roster, wins).map(function (r) { r.label = r.score + (r.score === 1 ? ' win' : ' wins'); return r; });
          var humanWon = w && !roster[w.p].isBot;
          var recs = [];
          if (cfg.players === 1 && humanWon) recs.push('Matches won vs CPU: ' + A.store.add('tictac', 'wins'));
          var title = w ? (target === 1 ? msg.replace(' the round', '') : A.winnerTitle(rows)) : "It's a draw!";
          ctx.finish({
            title: title, subtitle: target > 1 ? 'Match over after ' + round + ' rounds.' : (w ? 'Three in a row!' : 'Nobody lined up three this time.'),
            rows: rows, stats: target > 1 ? [['Rounds', round], ['Draws', draws]] : [], records: recs,
            tone: cfg.players === 1 && !humanWon ? 'lose' : 'win'
          });
        } else {
          banner.textContent = msg + ' Next up: ' + roster[starter].name + '.';
          banner.hidden = false; nextBtn.hidden = false;
          nextBtn.focus({ preventScroll: true });
        }
      }
      function layout() {
        var W = ctx.stage.clientWidth, H = ctx.stage.clientHeight - 70;
        var size = Math.max(200, Math.min(W - 20, H - 10, 560));
        boardEl.style.width = size + 'px';
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          layout();
          ctx.listen(window, 'resize', layout);
          newRound();
        },
        destroy: function () {}
      };
    }
  });
})();

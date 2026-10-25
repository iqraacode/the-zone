/* ==========================================================================
   GAME 7 — COLOR CLASH  (1–3 players, territory strategy)
   Rules (understood in seconds):
   • You start in a corner.
   • On your turn pick a neutral tile that touches your territory.
   • You paint it AND every tile connected to it with the same pattern.
   • When nobody can move (or the round limit is reached) the biggest territory wins.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h;

  var TERRAIN = ['Sand', 'Bloom', 'Sea', 'Leaf'];
  var SIZES = { s: { n: 7, label: 'Small 7×7' }, m: { n: 9, label: 'Medium 9×9' }, l: { n: 11, label: 'Large 11×11' } };

  function makeTerrain(n) {
    var t = [], i, k;
    for (i = 0; i < n * n; i++) t.push(A.randInt(0, 3));
    for (k = 0; k < 1; k++) {
      var nt = t.slice();
      for (i = 0; i < n * n; i++) {
        if (Math.random() < 0.5) continue;
        var cnt = [0, 0, 0, 0];
        nbrs(i, n).forEach(function (j) { cnt[t[j]]++; });
        var best = cnt.indexOf(Math.max.apply(null, cnt));
        if (cnt[best] >= 2) nt[i] = best;
      }
      t = nt;
    }
    return t;
  }
  function nbrs(i, n) {
    var r = Math.floor(i / n), c = i % n, out = [];
    if (r > 0) out.push(i - n); if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1); if (c < n - 1) out.push(i + 1);
    return out;
  }
  // region of same-terrain neutral cells connected to i, with BFS depth
  function region(i, owner, terrain, n) {
    var seen = {}, out = [], q = [[i, 0]];
    seen[i] = true;
    while (q.length) {
      var cur = q.shift();
      out.push(cur);
      nbrs(cur[0], n).forEach(function (j) {
        if (!seen[j] && owner[j] < 0 && terrain[j] === terrain[i]) { seen[j] = true; q.push([j, cur[1] + 1]); }
      });
    }
    return out;
  }
  function legalMoves(p, owner, n) {
    var out = [];
    for (var i = 0; i < owner.length; i++) {
      if (owner[i] >= 0) continue;
      if (nbrs(i, n).some(function (j) { return owner[j] === p; })) out.push(i);
    }
    return out;
  }

  A.register({
    id: 'clash',
    title: 'Color Clash',
    tagline: 'Paint patterned tiles and grow the biggest territory.',
    description: 'Grow from your corner by painting patterned tiles. Each move grabs a whole patch of matching tiles. Biggest territory wins!',
    color: '#FBECC9',
    players: [1, 2, 3],
    cats: ['puzzle', 'multiplayer'],
    modes: { 1: 'vs CPU', 2: 'Take turns', 3: 'Take turns' },
    pausable: false,
    options: function (n) {
      var o = [
        { id: 'size', label: 'Board', def: 'm', choices: [{ v: 's', label: SIZES.s.label }, { v: 'm', label: SIZES.m.label }, { v: 'l', label: SIZES.l.label }] },
        { id: 'limit', label: 'Length', def: 0, choices: [{ v: 0, label: 'Until the board fills' }, { v: 8, label: 'Quick · 8 rounds' }] }
      ];
      if (n === 1) {
        o.push({ id: 'cpus', label: 'Opponents', def: 1, choices: [{ v: 1, label: '1 CPU' }, { v: 2, label: '2 CPUs' }] });
        o.push({ id: 'level', label: 'CPU skill', def: 'hard', choices: [{ v: 'easy', label: 'Relaxed' }, { v: 'hard', label: 'Sharp' }] });
      }
      return o;
    },
    rules: function (cfg) {
      return ['Everyone starts with one corner tile.',
        'On your turn, pick a neutral tile that touches your territory (glowing tiles).',
        'You paint it plus every connected tile with the same pattern. Bigger patches = bigger jumps!',
        "If you can't reach any neutral tile, your turn is skipped.",
        cfg.opts.limit ? 'After ' + cfg.opts.limit + ' rounds, the biggest territory wins.' : 'When nobody can move, the biggest territory wins.'];
    },
    controls: function () { return [['Click / Tap', 'Paint a glowing tile'], ['Hover / Focus', 'Preview the patch you will grab'], ['Arrow keys', 'Move between tiles'], ['Enter / Space', 'Paint the focused tile']]; },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var w = A.store.record('clash', 'wins');
      return w ? 'Wins against the CPU: ' + w : null;
    },

    create: function (ctx) {
      var cfg = ctx.cfg, n = (SIZES[cfg.opts.size] || SIZES.m).n;
      var cpus = cfg.players === 1 ? (cfg.opts.cpus || 1) : 0;
      var level = cfg.opts.level || 'hard', limit = cfg.opts.limit || 0;
      var roster = A.makeRoster(cfg.players, cpus), nP = roster.length;
      var terrain = makeTerrain(n), owner = [];
      for (var i = 0; i < n * n; i++) owner.push(-1);
      var corners = [0, n * n - 1, n - 1, n * (n - 1)];
      roster.forEach(function (p, k) { owner[corners[k]] = k; });
      var turn = 0, round = 1, moved = 0, busy = false, legal = [], cells = [];

      var grid = h('div', { class: 'arc-clash-grid', role: 'grid', 'aria-label': 'Color Clash board', style: { '--n': n } });
      var boardEl = h('div', { class: 'arc-clash-board' }, grid);
      var legend = h('div', { class: 'arc-clash-legend', 'aria-hidden': 'true' }, TERRAIN.map(function (t, k) { return h('span', null, h('i', { class: 'arc-clash-t' + k }), t); }));
      var wrap = h('div', { class: 'arc-clash' }, boardEl, legend);

      for (i = 0; i < n * n; i++) (function (i) {
        var c = h('button', {
          type: 'button', class: 'arc-clash-cell arc-clash-t' + terrain[i], role: 'gridcell',
          onclick: function () { humanPlay(i); },
          onmouseenter: function () { preview(i); }, onmouseleave: function () { preview(-1); },
          onfocus: function () { preview(i); }, onblur: function () { preview(-1); }
        }, h('span', { class: 'arc-clash-sym' }));
        cells.push(c); grid.appendChild(c);
      })(i);
      grid.addEventListener('keydown', function (e) {
        var i = cells.indexOf(document.activeElement);
        var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: n, ArrowUp: -n }[e.key];
        if (i < 0 || !d) return;
        e.preventDefault();
        var j = i + d;
        if (j >= 0 && j < cells.length && !(d === 1 && j % n === 0) && !(d === -1 && i % n === 0)) cells[j].focus();
      });

      function paint(i, delay) {
        var p = roster[owner[i]], c = cells[i];
        c.classList.add('is-owned');
        c.style.setProperty('--pc', p.color);
        c.style.setProperty('--d', (delay || 0) + 'ms');
        var sym = c.firstChild;
        A.clear(sym).appendChild(A.symbolSVG(p, 16, p.light));
      }
      function scores() { return roster.map(function (p, k) { return owner.filter(function (o) { return o === k; }).length; }); }
      function label(i) {
        var r = Math.floor(i / n) + 1, cc = i % n + 1, txt = 'Row ' + r + ', column ' + cc + ', ';
        if (owner[i] >= 0) txt += 'owned by ' + roster[owner[i]].name;
        else txt += TERRAIN[terrain[i]] + ' tile' + (legal.indexOf(i) >= 0 ? ', playable' : '');
        cells[i].setAttribute('aria-label', txt);
      }
      function refresh() {
        var p = roster[turn];
        legal = ctx.over ? [] : legalMoves(turn, owner, n);
        var human = !p.isBot && !ctx.over;
        boardEl.style.setProperty('--cur', p.color);
        cells.forEach(function (c, i) {
          c.classList.toggle('is-legal', human && legal.indexOf(i) >= 0);
          c.setAttribute('aria-disabled', human && legal.indexOf(i) >= 0 ? 'false' : 'true');
          label(i);
        });
        ctx.setScores(scores());
        ctx.setTurn(ctx.over ? -1 : turn);
        var free = owner.filter(function (o) { return o < 0; }).length;
        ctx.setStats([['Round', limit ? round + '/' + limit : round], ['Free tiles', free]]);
        if (!ctx.over) ctx.setStatus(p.isBot ? p.name + ' is choosing a patch…' : (cfg.players === 1 ? 'Your turn: pick a glowing tile.' : p.name + "'s turn: pick a glowing tile."));
      }
      function preview(i) {
        cells.forEach(function (c) { c.classList.remove('is-preview'); });
        if (i < 0 || ctx.over || roster[turn].isBot || legal.indexOf(i) < 0) return;
        region(i, owner, terrain, n).forEach(function (r) { cells[r[0]].classList.add('is-preview'); });
      }
      function humanPlay(i) {
        if (ctx.over || busy || roster[turn].isBot || legal.indexOf(i) < 0) return;
        play(i);
      }
      function play(i) {
        if (owner[i] >= 0 || legalMoves(turn, owner, n).indexOf(i) < 0) return; // enforce rules for everyone
        var reg = region(i, owner, terrain, n);
        reg.forEach(function (r) { owner[r[0]] = turn; paint(r[0], A.reducedMotion() ? 0 : r[1] * 70); });
        preview(-1);
        ctx.sfx(reg.length >= 4 ? 'match' : 'place');
        advance();
      }
      function advance() {
        moved++;
        // find next player with a legal move
        for (var k = 1; k <= nP; k++) {
          var nt = (turn + k) % nP;
          if (legalMoves(nt, owner, n).length) {
            if (nt <= turn) round++; // wrapped past the end of the turn order
            turn = nt;
            if (limit && round > limit) { round = limit; return end('limit'); }
            refresh();
            return botTurn();
          }
        }
        end('full');
      }
      function botTurn() {
        if (ctx.over || !roster[turn].isBot) return;
        busy = true;
        ctx.timeout(function () {
          busy = false;
          if (ctx.over) return;
          play(chooseBot());
        }, A.reducedMotion() ? 250 : A.randInt(450, 750));
      }
      function chooseBot() {
        var moves = legalMoves(turn, owner, n);
        if (level === 'easy' && Math.random() < 0.3) return A.pick(moves);
        var scored = moves.map(function (m) {
          var reg = region(m, owner, terrain, n), sim = owner.slice();
          reg.forEach(function (r) { sim[r[0]] = turn; });
          var mobility = legalMoves(turn, sim, n).length;
          var contested = reg.filter(function (r) { return nbrs(r[0], n).some(function (j) { return owner[j] >= 0 && owner[j] !== turn; }); }).length;
          // cells next to the captured patch that opponents could otherwise reach
          return { m: m, s: reg.length * 2 + mobility * 0.35 + contested * 1.2 + Math.random() * 0.2 };
        });
        scored.sort(function (a, b) { return b.s - a.s; });
        return level === 'hard' ? scored[0].m : A.pick(scored.slice(0, 4)).m;
      }
      function end(why) {
        var sc = scores();
        var rows = A.rank(roster, sc).map(function (r) { r.label = r.score + ' tiles'; return r; });
        var humanWon = rows.filter(function (r) { return r.place === 1; }).length === 1 && !rows[0].player.isBot;
        var recs = [];
        if (cfg.players === 1 && humanWon) recs.push('CPU wins so far: ' + A.store.add('clash', 'wins'));
        var free = owner.filter(function (o) { return o < 0; }).length;
        ctx.setStatus(why === 'limit' ? 'Round limit reached!' : 'No more moves!');
        ctx.finish({
          title: A.winnerTitle(rows),
          subtitle: (why === 'limit' ? 'Finished after ' + limit + ' rounds.' : 'Nobody can reach a neutral tile.') + (free ? ' ' + free + ' tiles stayed neutral.' : ''),
          rows: rows, records: recs, stats: [['Moves', moved]],
          tone: cfg.players === 1 && !humanWon ? 'lose' : 'win'
        });
        refresh();
      }
      function layout() {
        var W = ctx.stage.clientWidth - 12, H = ctx.stage.clientHeight - 46;
        boardEl.style.width = Math.max(220, Math.min(W, H, 640)) + 'px';
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          owner.forEach(function (o, i) { if (o >= 0) paint(i, 0); });
          layout();
          ctx.listen(window, 'resize', layout);
          refresh();
          botTurn();
          if (!roster[turn].isBot && legal.length) cells[legal[0]].focus({ preventScroll: true });
        },
        destroy: function () {}
      };
    }
  });
})();

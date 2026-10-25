/* ==========================================================================
   GAME 2 — DOT BEACH  (1–3 players + optional CPU opponents)
   Classic dots and boxes. Close a box to claim it and move again.
   CPU: always takes free boxes, avoids handing out boxes, and when it must
   give some away it picks the move that gives away the fewest.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, s = A.s;

  var SIZES = { s: { r: 3, c: 3, label: 'Small 3×3' }, m: { r: 4, c: 4, label: 'Medium 4×4' }, l: { r: 5, c: 6, label: 'Large 5×6' } };

  /* ------------------------------------------------------------ model */
  function Board(R, C) {
    this.R = R; this.C = C;
    this.lines = [];
    var r, c;
    for (r = 0; r <= R; r++) for (c = 0; c < C; c++) this.lines.push({ t: 'h', r: r, c: c, owner: -1 });
    for (r = 0; r < R; r++) for (c = 0; c <= C; c++) this.lines.push({ t: 'v', r: r, c: c, owner: -1 });
    this.lines.forEach(function (l, i) { l.i = i; });
    this.boxes = [];
    for (r = 0; r < R; r++) for (c = 0; c < C; c++) this.boxes.push({ r: r, c: c, owner: -1 });
  }
  Board.prototype.hIdx = function (r, c) { return r * this.C + c; };
  Board.prototype.vIdx = function (r, c) { return (this.R + 1) * this.C + r * (this.C + 1) + c; };
  Board.prototype.boxLines = function (r, c) { return [this.hIdx(r, c), this.hIdx(r + 1, c), this.vIdx(r, c), this.vIdx(r, c + 1)]; };
  Board.prototype.boxesOf = function (l) {
    var out = [];
    if (l.t === 'h') { if (l.r > 0) out.push([l.r - 1, l.c]); if (l.r < this.R) out.push([l.r, l.c]); }
    else { if (l.c > 0) out.push([l.r, l.c - 1]); if (l.c < this.C) out.push([l.r, l.c]); }
    return out;
  };
  Board.prototype.sides = function (r, c, taken) {
    return this.boxLines(r, c).filter(function (i) { return taken[i]; }).length;
  };

  /* --------------------------------------------------------------- bot */
  function takenArr(b) { return b.lines.map(function (l) { return l.owner >= 0; }); }
  function completes(b, taken, i) {
    var n = 0, self = b;
    b.boxesOf(b.lines[i]).forEach(function (bx) { if (self.sides(bx[0], bx[1], taken) === 3) n++; });
    return n;
  }
  function givesAway(b, taken, i) {
    // does drawing line i leave a box with 3 sides (for the next player)?
    var t = taken.slice(); t[i] = true;
    var bad = false, self = b;
    b.boxesOf(b.lines[i]).forEach(function (bx) { if (self.sides(bx[0], bx[1], t) === 3) bad = true; });
    return bad;
  }
  function chainGiven(b, taken, i) {
    // play i, then greedily let the opponent take every box they can; count them
    var t = taken.slice(); t[i] = true;
    var count = 0, progress = true;
    while (progress) {
      progress = false;
      for (var k = 0; k < b.lines.length; k++) {
        if (t[k]) continue;
        var n = completes(b, t, k);
        if (n > 0) { t[k] = true; count += n; progress = true; }
      }
    }
    return count;
  }
  function botMove(b, level) {
    var taken = takenArr(b);
    var free = b.lines.filter(function (l) { return l.owner < 0; }).map(function (l) { return l.i; });
    var scoring = free.filter(function (i) { return completes(b, taken, i) > 0; });
    if (scoring.length && (level === 'hard' || Math.random() < 0.75)) {
      scoring.sort(function (x, y) { return completes(b, taken, y) - completes(b, taken, x); });
      return scoring[0];
    }
    var safe = free.filter(function (i) { return !givesAway(b, taken, i); });
    if (level === 'easy' && Math.random() < 0.35) return A.pick(free);
    if (safe.length) return A.pick(safe);
    // forced to give something away: give the smallest chain
    var best = null;
    free.forEach(function (i) {
      var g = chainGiven(b, taken, i);
      if (!best || g < best.g) best = { i: i, g: g };
    });
    return best.i;
  }

  A.register({
    id: 'dots',
    title: 'Dot Beach',
    tagline: 'Connect the dots and claim the most sandy boxes.',
    description: 'Take turns drawing lines between dots. Close a box to claim it, then draw again. Most boxes wins.',
    color: '#F7D98A',
    players: [1, 2, 3],
    cats: ['puzzle', 'multiplayer'],
    modes: { 1: 'vs CPU', 2: 'Take turns', 3: 'Take turns' },
    pausable: false,
    options: function (n) {
      var o = [{ id: 'size', label: 'Board', def: 'm', choices: [{ v: 's', label: SIZES.s.label }, { v: 'm', label: SIZES.m.label }, { v: 'l', label: SIZES.l.label }] }];
      if (n === 1) {
        o.push({ id: 'cpus', label: 'Opponents', def: 1, choices: [{ v: 1, label: '1 CPU' }, { v: 2, label: '2 CPUs' }] });
        o.push({ id: 'level', label: 'CPU skill', def: 'hard', choices: [{ v: 'easy', label: 'Relaxed' }, { v: 'hard', label: 'Sharp' }] });
      }
      return o;
    },
    rules: function () {
      return ['On your turn, draw one line between two neighbouring dots.', 'Close the fourth side of a box to claim it. You score a point and draw again.',
        'Careful: drawing the third side of a box lets the next player grab it.', 'When every box is claimed, the most boxes wins.'];
    },
    controls: function () { return [['Click / Tap', 'Draw a line'], ['Tab / Arrow keys', 'Move between lines'], ['Enter / Space', 'Draw the focused line']]; },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var w = A.store.record('dots', 'wins');
      return w ? 'Wins against the CPU: ' + w : null;
    },

    create: function (ctx) {
      var cfg = ctx.cfg, sz = SIZES[cfg.opts.size] || SIZES.m;
      var cpus = cfg.players === 1 ? (cfg.opts.cpus || 1) : 0;
      var level = cfg.opts.level || 'hard';
      var roster = A.makeRoster(cfg.players, cpus);
      var B = new Board(sz.r, sz.c);
      var scores = roster.map(function () { return 0; });
      var turn = 0, busy = false;

      var G = 100, P = 34;
      var W = sz.c * G + P * 2, H = sz.r * G + P * 2;
      var svg = s('svg', { class: 'arc-dots-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': 'Dot Beach board' });
      var boardRect = s('rect', { class: 'arc-dots-board', x: 6, y: 6, width: W - 12, height: H - 12, rx: 28 });
      svg.appendChild(s('rect', { x: 10, y: 14, width: W - 12, height: H - 12, rx: 28, fill: 'rgba(0,0,0,.2)' }));
      svg.appendChild(boardRect);
      svg.appendChild(s('rect', { class: 'arc-dots-ring', x: 16, y: 16, width: W - 32, height: H - 32, rx: 20 }));
      var gBoxes = s('g'), gLines = s('g'), gDots = s('g', { 'pointer-events': 'none' });
      svg.appendChild(gBoxes); svg.appendChild(gLines); svg.appendChild(gDots);

      function X(c) { return P + c * G; }
      function Y(r) { return P + r * G; }

      B.boxes.forEach(function (bx) {
        bx.el = s('g', { class: 'arc-dots-box' });
        bx.rect = s('rect', { x: X(bx.c) + 6, y: Y(bx.r) + 6, width: G - 12, height: G - 12, rx: 10, fill: 'transparent' });
        bx.el.appendChild(bx.rect);
        gBoxes.appendChild(bx.el);
      });
      B.lines.forEach(function (l) {
        var x1 = X(l.c), y1 = Y(l.r), x2 = l.t === 'h' ? X(l.c + 1) : x1, y2 = l.t === 'v' ? Y(l.r + 1) : y1;
        l.mid = [(x1 + x2) / 2, (y1 + y2) / 2];
        var lab = (l.t === 'h' ? 'Horizontal' : 'Vertical') + ' line, row ' + (l.r + 1) + ', column ' + (l.c + 1);
        l.el = s('g', { class: 'arc-dots-line', tabindex: 0, role: 'button', 'aria-label': lab });
        l.el.appendChild(s('line', { class: 'hit', x1: x1, y1: y1, x2: x2, y2: y2 }));
        l.el.appendChild(s('line', { class: 'ghost', x1: x1 + (l.t === 'h' ? 14 : 0), y1: y1 + (l.t === 'v' ? 14 : 0), x2: x2 - (l.t === 'h' ? 14 : 0), y2: y2 - (l.t === 'v' ? 14 : 0) }));
        l.out = s('line', { class: 'out', x1: x1, y1: y1, x2: x2, y2: y2 });
        l.vis = s('line', { class: 'vis', x1: x1, y1: y1, x2: x2, y2: y2 });
        l.el.appendChild(l.out); l.el.appendChild(l.vis);
        l.el.addEventListener('click', function () { humanPlay(l.i); });
        l.el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); humanPlay(l.i); return; }
          var dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
          if (!dir) return;
          e.preventDefault();
          var best = null;
          B.lines.forEach(function (o) {
            if (o === l) return;
            var dx = o.mid[0] - l.mid[0], dy = o.mid[1] - l.mid[1];
            var along = dx * dir[0] + dy * dir[1];
            if (along <= 1) return;
            var d = along + Math.abs(dx * dir[1] + dy * dir[0]) * 2;
            if (!best || d < best.d) best = { d: d, o: o };
          });
          if (best) best.o.el.focus();
        });
        gLines.appendChild(l.el);
      });
      for (var r = 0; r <= sz.r; r++) for (var c = 0; c <= sz.c; c++) {
        gDots.appendChild(s('circle', { cx: X(c) + 2, cy: Y(r) + 3, r: 9, fill: 'rgba(0,0,0,.18)' }));
        gDots.appendChild(s('circle', { class: 'arc-dots-dot', cx: X(c), cy: Y(r), r: 9 }));
      }

      var wrap = h('div', { class: 'arc-dots' }, svg);

      function refresh() {
        var p = roster[turn];
        svg.style.setProperty('--cur', p.color);
        svg.classList.toggle('is-human', !p.isBot && !ctx.over);
        ctx.setScores(scores);
        ctx.setTurn(ctx.over ? -1 : turn);
        var left = B.boxes.filter(function (b) { return b.owner < 0; }).length;
        ctx.setStats([['Boxes left', left]]);
        if (!ctx.over) ctx.setStatus(p.isBot ? p.name + ' is thinking…' : (cfg.players === 1 ? 'Your turn: draw a line.' : p.name + "'s turn: draw a line."));
      }

      function humanPlay(i) {
        if (ctx.over || busy || roster[turn].isBot || B.lines[i].owner >= 0) return;
        play(i);
      }
      function play(i) {
        var l = B.lines[i];
        if (l.owner >= 0) return; // never re-draw a line
        l.owner = turn;
        l.el.classList.add('is-taken');
        l.el.setAttribute('aria-disabled', 'true');
        l.el.setAttribute('aria-label', l.el.getAttribute('aria-label') + ', drawn by ' + roster[turn].name);
        l.vis.style.stroke = roster[turn].color;
        gLines.querySelectorAll('.is-last').forEach(function (e) { e.classList.remove('is-last'); });
        l.el.classList.add('is-last');
        gLines.appendChild(l.el); // drawn lines on top of empty ones
        var gained = 0, taken = takenArr(B);
        B.boxesOf(l).forEach(function (bx) {
          var box = B.boxes[bx[0] * B.C + bx[1]];
          if (box.owner < 0 && B.sides(bx[0], bx[1], taken) === 4) {
            box.owner = turn; gained++;
            var p = roster[turn];
            box.rect.setAttribute('fill', p.light);
            box.el.classList.add('is-claimed');
            var sym = s('g', { class: 'arc-dots-sym' }, s('path', { d: A.symbolPath(p.symbol), transform: 'translate(' + (X(bx[1]) + G / 2 - 22) + ' ' + (Y(bx[0]) + G / 2 - 22) + ') scale(.44)', fill: p.color, stroke: A.OUTLINE, 'stroke-width': 9, 'stroke-linejoin': 'round' }));
            box.el.appendChild(sym);
          }
        });
        if (gained) { scores[turn] += gained; ctx.sfx('point'); } else ctx.sfx('place');
        if (B.boxes.every(function (b) { return b.owner >= 0; })) { end(); refresh(); return; }
        if (!gained) turn = (turn + 1) % roster.length;
        refresh();
        next();
      }
      function next() {
        if (ctx.over || !roster[turn].isBot) return;
        busy = true;
        ctx.timeout(function () {
          busy = false;
          if (ctx.over) return;
          play(botMove(B, level));
        }, A.reducedMotion() ? 250 : A.randInt(420, 700));
      }
      function end() {
        var rows = A.rank(roster, scores).map(function (r) { r.label = r.score + (r.score === 1 ? ' box' : ' boxes'); return r; });
        var humanWon = rows.some(function (r) { return r.place === 1 && !r.player.isBot; }) && rows.filter(function (r) { return r.place === 1; }).length === 1;
        var recs = [];
        if (cfg.players === 1 && humanWon) { var w = A.store.add('dots', 'wins'); recs.push('CPU wins so far: ' + w); }
        ctx.setStatus('Every box is claimed!');
        ctx.finish({
          title: A.winnerTitle(rows), subtitle: (sz.r * sz.c) + ' boxes claimed.', rows: rows, records: recs,
          tone: cfg.players === 1 && !humanWon ? 'lose' : 'win'
        });
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          refresh();
          var first = B.lines[0].el; first.focus({ preventScroll: true });
        },
        destroy: function () {}
      };
    }
  });
})();

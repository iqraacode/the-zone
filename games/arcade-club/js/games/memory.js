/* ==========================================================================
   GAME 1 — MEMORY SPLASH  (1–3 players, turn-based)
   Flip two cards per turn. A pair scores a point and you go again.
   Solo: beat your best moves and time for each board size.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h;

  var SIZES = { easy: { pairs: 6, label: 'Small · 12 cards' }, medium: { pairs: 8, label: 'Medium · 16 cards' }, hard: { pairs: 12, label: 'Large · 24 cards' } };

  A.register({
    id: 'memory',
    title: 'Memory Splash',
    tagline: 'Flip cards and find matching beach pairs.',
    description: 'Flip two cards a turn and remember where every beach treasure hides. Most pairs wins!',
    color: '#7FA8BE',
    players: [1, 2, 3],
    cats: ['puzzle', 'quick'],
    modes: { 1: 'Beat the clock', 2: 'Take turns', 3: 'Take turns' },
    pausable: true,
    options: function () {
      return [{ id: 'size', label: 'Board', def: 'easy', choices: [{ v: 'easy', label: SIZES.easy.label }, { v: 'medium', label: SIZES.medium.label }, { v: 'hard', label: SIZES.hard.label }] }];
    },
    rules: function (cfg) {
      var r = ['Flip two cards on your turn.', 'If they match, you keep the pair, score a point and go again.', "If they don't match, they flip back and the next player goes."];
      r.push(cfg.players === 1 ? 'Clear the board in as few moves and as little time as you can.' : 'When every pair is found, the player with the most pairs wins.');
      return r;
    },
    controls: function () { return [['Click / Tap', 'Flip a card'], ['Arrow keys', 'Move between cards'], ['Enter / Space', 'Flip the focused card']]; },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var s = cfg.opts.size || 'easy';
      var m = A.store.record('memory', 'moves-' + s), t = A.store.record('memory', 'time-' + s);
      if (m === null) return null;
      return 'Your best on this board: ' + m + ' moves · ' + A.fmtTime(t);
    },

    create: function (ctx) {
      var cfg = ctx.cfg, size = cfg.opts.size || 'easy', nPairs = SIZES[size].pairs;
      var roster = A.makeRoster(cfg.players, 0);
      var solo = cfg.players === 1;
      var scores = roster.map(function () { return 0; });
      var turn = 0, moves = 0, elapsed = 0, started = false, flipped = [], lock = false, found = 0;
      var cards = [], cols = 4;

      var symbols = A.shuffle(A.cardArt).slice(0, nPairs);
      var deck = A.shuffle(symbols.concat(symbols).map(function (s, i) { return { sym: s, id: i }; }));

      var grid = h('div', { class: 'arc-mem-grid', role: 'grid', 'aria-label': 'Memory cards' });
      var wrap = h('div', { class: 'arc-mem' }, grid);

      deck.forEach(function (d, i) {
        var face = h('span', { class: 'arc-mem-face' }, A.svg(d.sym.svg));
        var back = h('span', { class: 'arc-mem-back' }, h('span', { class: 'arc-mem-back-dot' }));
        var badge = h('span', { class: 'arc-mem-owner' });
        var el = h('button', {
          type: 'button', class: 'arc-mem-card', role: 'gridcell', 'aria-label': 'Card ' + (i + 1) + ', face down', style: { '--d': (i * 18) + 'ms' },
          onclick: function () { flip(i); }
        }, h('span', { class: 'arc-mem-inner' }, back, face), badge);
        cards.push({ data: d, el: el, badge: badge, up: false, matched: false });
        grid.appendChild(el);
      });

      grid.addEventListener('keydown', function (e) {
        var i = cards.map(function (c) { return c.el; }).indexOf(document.activeElement);
        if (i < 0) return;
        var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
        if (!d) return;
        e.preventDefault();
        var j = i + d;
        if (j >= 0 && j < cards.length) cards[j].el.focus();
      });

      function layout() {
        var W = ctx.stage.clientWidth - 16, H = ctx.stage.clientHeight - 16, n = cards.length, gap = W < 520 ? 7 : 12;
        var best = null;
        for (var c = 2; c <= n; c++) {
          if (n % c) continue;
          var r = n / c;
          var cw = Math.min((W - gap * (c - 1)) / c, ((H - gap * (r - 1)) / r) * 0.78);
          if (!best || cw > best.cw) best = { c: c, cw: cw };
        }
        cols = best.c;
        var cw = Math.max(40, Math.floor(Math.min(best.cw, 150)));
        grid.style.setProperty('--cols', cols);
        grid.style.setProperty('--cw', cw + 'px');
        grid.style.setProperty('--gap', gap + 'px');
      }

      function hud() {
        ctx.setScores(scores);
        ctx.setTurn(solo ? -1 : turn);
        var stats = [['Pairs', found + '/' + nPairs], ['Moves', moves]];
        if (solo) stats.push(['Time', A.fmtTime(elapsed)]);
        ctx.setStats(stats);
      }
      function status() {
        if (ctx.over) return;
        ctx.setStatus(solo ? (flipped.length === 1 ? 'Now find its partner.' : 'Flip two cards and find every pair.') :
          roster[turn].name + "'s turn" + (flipped.length === 1 ? ': pick a second card.' : ': flip two cards.'));
      }
      function label(c, i) {
        var t = 'Card ' + (i + 1) + ', ';
        if (c.matched) t += c.data.sym.name + ', matched' + (solo ? '' : ' by ' + roster[c.owner].name);
        else t += c.up ? c.data.sym.name : 'face down';
        c.el.setAttribute('aria-label', t);
      }

      function flip(i) {
        var c = cards[i];
        if (ctx.over || ctx.paused || lock || c.up || c.matched) return;
        if (!started) started = true;
        c.up = true;
        c.el.classList.add('is-up');
        label(c, i);
        ctx.sfx('flip');
        flipped.push(i);
        if (flipped.length < 2) { status(); return; }

        moves++;
        var a = cards[flipped[0]], b = cards[flipped[1]];
        if (a.data.sym === b.data.sym) {
          lock = true;
          ctx.timeout(function () {
            [a, b].forEach(function (cc) {
              cc.matched = true; cc.owner = turn;
              cc.el.classList.add('is-matched');
              cc.el.style.setProperty('--pc', roster[turn].color);
              if (!solo) A.clear(cc.badge).appendChild(A.symbolSVG(roster[turn], 18));
              label(cc, cards.indexOf(cc));
            });
            scores[turn]++; found++;
            flipped = []; lock = false;
            ctx.sfx('match');
            hud();
            if (found === nPairs) end(); else status();
          }, 280);
        } else {
          lock = true;
          ctx.timeout(function () {
            [a, b].forEach(function (cc) { cc.up = false; cc.el.classList.remove('is-up'); cc.el.classList.add('is-miss'); label(cc, cards.indexOf(cc)); });
            ctx.timeout(function () { a.el.classList.remove('is-miss'); b.el.classList.remove('is-miss'); }, 400);
            flipped = []; lock = false;
            if (!solo) turn = (turn + 1) % roster.length;
            hud(); status();
          }, 950);
        }
        hud();
      }

      function end() {
        var result;
        if (solo) {
          var rm = A.store.submit('memory', 'moves-' + size, moves, 'low');
          var rt = A.store.submit('memory', 'time-' + size, Math.round(elapsed * 10) / 10, 'low');
          var recs = [];
          if (rm.isNew && rm.prev !== null) recs.push('New best: fewest moves!');
          if (rt.isNew && rt.prev !== null) recs.push('New best time!');
          if (rm.prev === null) recs.push('First clear on this board. Now beat it!');
          result = {
            title: 'Board cleared!', subtitle: 'You found all ' + nPairs + ' pairs.',
            stats: [['Moves', moves], ['Time', A.fmtTime(elapsed)], ['Best moves', A.store.record('memory', 'moves-' + size)], ['Best time', A.fmtTime(A.store.record('memory', 'time-' + size))]],
            records: recs
          };
        } else {
          var rows = A.rank(roster, scores).map(function (r) { r.label = r.score + (r.score === 1 ? ' pair' : ' pairs'); return r; });
          result = { title: A.winnerTitle(rows), subtitle: 'All ' + nPairs + ' pairs found in ' + moves + ' moves.', rows: rows };
        }
        ctx.setStatus('All pairs found!');
        ctx.finish(result);
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          layout();
          ctx.listen(window, 'resize', layout);
          hud(); status();
          ctx.loop(function (dt) {
            if (started && !ctx.over && dt > 0) {
              elapsed += dt;
              if (solo) ctx.setStats([['Time', A.fmtTime(elapsed)]]);
            }
          });
          cards[0].el.focus({ preventScroll: true });
        },
        pause: function () { wrap.classList.add('is-paused'); },
        resume: function () { wrap.classList.remove('is-paused'); },
        destroy: function () {}
      };
    }
  });
})();

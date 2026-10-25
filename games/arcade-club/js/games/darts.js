/* ==========================================================================
   GAME 12 — BEACH DARTS  (1–3 players, take turns; 1P vs CPU)
   Count down from 101 or 301. Three darts per turn.
   Land on exactly 0 to win. Going below 0 is a BUST (turn doesn't count).
   Your aim wobbles a little, like a real hand. After the round limit,
   lowest score left wins.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var S = 600, C = 300;
  var ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  var R_BULL = 11, R_OUTER = 26, R_T0 = 130, R_T1 = 146, R_D0 = 214, R_D1 = 230, R_NUM = 262;

  function scoreAt(x, y) {
    var dx = x - C, dy = y - C, d = Math.hypot(dx, dy);
    if (d > R_D1) return { pts: 0, label: 'Miss' };
    if (d <= R_BULL) return { pts: 50, label: 'Bullseye!' };
    if (d <= R_OUTER) return { pts: 25, label: 'Outer bull' };
    var deg = Math.atan2(dy, dx) * 180 / Math.PI;
    var idx = Math.floor((((deg + 90 + 9) % 360) + 360) % 360 / 18);
    var n = ORDER[idx];
    if (d >= R_T0 && d <= R_T1) return { pts: n * 3, label: 'Triple ' + n };
    if (d >= R_D0) return { pts: n * 2, label: 'Double ' + n };
    return { pts: n, label: String(n) };
  }
  function segPoint(n, radius) {
    var a = (-90 + ORDER.indexOf(n) * 18) * Math.PI / 180;
    return { x: C + Math.cos(a) * radius, y: C + Math.sin(a) * radius };
  }
  function gauss() { var u = Math.random() || 1e-9, v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  A.register({
    id: 'darts',
    title: 'Beach Darts',
    tagline: 'Count down to exactly zero on a seaside dartboard.',
    description: 'Throw three darts a turn and count down to exactly zero. Overshoot and you bust!',
    color: '#5A4D40',
    ink: '#FBF6EF',
    players: [1, 2, 3],
    cats: ['action', 'multiplayer'],
    modes: { 1: 'vs CPU', 2: 'Take turns', 3: 'Take turns' },
    pausable: true,
    options: function (n) {
      var o = [
        { id: 'start', label: 'Game', def: 101, choices: [{ v: 101, label: 'Quick 101' }, { v: 301, label: 'Classic 301' }] },
        { id: 'rounds', label: 'Round limit', def: 10, choices: [{ v: 6, label: '6 rounds' }, { v: 10, label: '10 rounds' }] }
      ];
      if (n === 1) o.push({ id: 'level', label: 'CPU skill', def: 'normal', choices: [{ v: 'easy', label: 'Wobbly' }, { v: 'normal', label: 'Steady' }, { v: 'hard', label: 'Sharp' }] });
      return o;
    },
    rules: function (cfg) {
      return ['Everyone starts at ' + (cfg.opts.start || 101) + '. Each turn you throw 3 darts and subtract what you hit.',
        'Outer ring = double, inner ring = triple, centre = 25 or 50.',
        'Hit exactly 0 to win. Go below 0 and you BUST: that turn’s darts don’t count.',
        'Your aim wobbles slightly, so time your throw. After ' + (cfg.opts.rounds || 10) + ' rounds, the lowest score left wins.'];
    },
    controls: function () {
      return [['Move mouse', 'Aim'], ['Click', 'Throw'], ['Drag & release', 'Aim and throw (touch)'], ['Arrow keys', 'Aim'], ['Space / Enter', 'Throw'], ['Esc', 'Pause']];
    },
    best: function (cfg) {
      var t = A.store.record('darts', 'turn'), w = A.store.record('darts', 'wins');
      var parts = [];
      if (t !== null) parts.push('Best 3-dart turn: ' + t);
      if (cfg.players === 1 && w) parts.push('wins vs CPU: ' + w);
      return parts.length ? parts.join(' · ') : null;
    },

    create: function (ctx) {
      var cfg = ctx.cfg, start = cfg.opts.start || 101, maxRounds = cfg.opts.rounds || 10, level = cfg.opts.level || 'normal';
      var roster = A.makeRoster(cfg.players, cfg.players === 1 ? 1 : 0);
      var left = roster.map(function () { return start; });
      var cur = 0, round = 1, dartN = 0, turnStart = start, turnPts = 0, darts = [], phase = 'aim', t = 0, best = 0;
      var aim = { x: C, y: C - 100 }, keys = {}, drag = null, flying = null, popup = null;
      var sigma = { easy: 42, normal: 26, hard: 15 }[level];
      var wob = 12;

      var view = A.makeCanvas(ctx, S, S);
      var g = view.g, board = null;
      var wrap = h('div', { class: 'arc-golf' }, view.canvas);

      function hud() {
        ctx.setScores(left);
        ctx.setTurn(phase === 'done' ? -1 : cur);
        ctx.setStats([['Round', round + '/' + maxRounds], ['Dart', Math.min(3, dartN + 1) + '/3'], ['This turn', turnPts]]);
      }
      function say() {
        var p = roster[cur];
        if (p.isBot) { ctx.setStatus(p.name + ' is aiming… (' + left[cur] + ' to go)'); return; }
        var who = cfg.players === 1 ? 'You' : p.name;
        ctx.setStatus(who + ': ' + left[cur] + ' to go. ' + (A.isTouch() ? 'Drag to aim, let go to throw.' : 'Aim with the mouse or arrows, click or Space to throw.'));
      }
      function wobble() {
        var k = roster[cur].isBot ? 0 : wob;
        return { x: (Math.sin(t * 1.7) + 0.5 * Math.sin(t * 2.9 + 1)) * k, y: (Math.cos(t * 1.3) + 0.4 * Math.sin(t * 3.7)) * k };
      }
      function throwDart(tx, ty) {
        if (phase !== 'aim' || ctx.over || ctx.paused) return;
        phase = 'fly';
        flying = { x0: C + A.rand(-40, 40), y0: S + 40, x: tx, y: ty, t: 0 };
        ctx.sfx('jump');
      }
      function landed() {
        var d = { x: flying.x, y: flying.y, owner: cur };
        flying = null;
        darts.push(d);
        var r = scoreAt(d.x, d.y);
        dartN++;
        var after = left[cur] - r.pts;
        ctx.sfx(r.pts === 0 ? 'bad' : r.pts >= 40 ? 'match' : 'hit');
        if (after < 0) {
          popup = { text: 'BUST!', t: 0, x: d.x, y: d.y };
          left[cur] = turnStart; turnPts = 0;
          ctx.sfx('lose');
          return endTurn('bust');
        }
        left[cur] = after; turnPts += r.pts;
        popup = { text: r.label + (r.pts ? ' · ' + r.pts : ''), t: 0, x: d.x, y: d.y };
        hud();
        if (after === 0) return endTurn('win');
        if (dartN >= 3) return endTurn('done');
        phase = 'aim'; say();
        if (roster[cur].isBot) botTurn();
      }
      function endTurn(why) {
        phase = 'wait';
        if (!roster[cur].isBot && why !== 'bust') {
          var r = A.store.submit('darts', 'turn', turnPts, 'high');
          if (r.isNew && r.prev !== null && turnPts > 0) best = turnPts;
        }
        ctx.setStatus(why === 'bust' ? roster[cur].name + ' busted! Back to ' + left[cur] + '.' : why === 'win' ? roster[cur].name + ' checked out!' : roster[cur].name + ' scored ' + turnPts + '. ' + left[cur] + ' left.');
        hud();
        ctx.timeout(function () {
          if (ctx.over) return;
          if (why === 'win') return finish(cur);
          darts = []; dartN = 0; turnPts = 0;
          cur = (cur + 1) % roster.length;
          if (cur === 0) round++;
          if (round > maxRounds) { round = maxRounds; return finish(-1); }
          turnStart = left[cur];
          phase = 'aim'; aim = { x: C, y: C - 100 };
          hud(); say();
          if (roster[cur].isBot) botTurn();
        }, why === 'done' ? 1300 : 1600);
      }
      function finish(winner) {
        phase = 'done';
        var rows;
        if (winner >= 0) {
          rows = roster.map(function (p, i) { return { player: p, score: left[i] }; });
          rows.sort(function (a, b) { return (a.player.index === winner ? -1 : b.player.index === winner ? 1 : a.score - b.score); });
          rows.forEach(function (r, i) { r.place = i === 0 ? 1 : (i > 1 && r.score === rows[i - 1].score ? rows[i - 1].place : i + 1); r.label = r.score === 0 ? 'Checked out!' : r.score + ' left'; });
        } else {
          rows = A.rank(roster, left, true).map(function (r) { r.label = r.score + ' left'; return r; });
        }
        var top = rows.filter(function (r) { return r.place === 1; });
        var humanWon = top.length === 1 && !top[0].player.isBot;
        var recs = [];
        if (cfg.players === 1 && humanWon) recs.push('Wins vs CPU: ' + A.store.add('darts', 'wins'));
        if (best) recs.push('New best turn: ' + best);
        ctx.finish({
          title: top.length > 1 ? "It's a tie!" : (top[0].player.name === 'You' ? 'You win!' : top[0].player.name + ' wins!'),
          subtitle: winner >= 0 ? 'Checked out to exactly zero from ' + start + '.' : 'Round limit reached: lowest score wins.',
          rows: rows, tone: cfg.players === 1 && !humanWon ? 'lose' : 'win', records: recs
        });
      }
      function botTurn() {
        phase = 'botaim';
        var r = left[cur], tgt;
        if (r === 50) tgt = { x: C, y: C };
        else if (r === 25) tgt = { x: C, y: C - 18 };
        else if (r <= 20) tgt = segPoint(r, 175);
        else if (r <= 40 && r % 2 === 0) tgt = segPoint(r / 2, 222);
        else if (r <= 60 && r % 3 === 0) tgt = segPoint(r / 3, 138);
        else if (r > 60) tgt = level === 'easy' ? segPoint(20, 175) : segPoint(20, 138);
        else tgt = segPoint(Math.min(20, r - 20 > 0 ? r - 20 : r), 175);
        var target = { x: tgt.x + gauss() * sigma, y: tgt.y + gauss() * sigma };
        // glide the visible aim towards the target, then throw
        var from = { x: aim.x, y: aim.y }, k = 0;
        var step = function () {
          if (ctx.over || phase !== 'botaim') return;
          if (ctx.paused) return ctx.timeout(step, 100);
          k = Math.min(1, k + 0.1);
          aim.x = from.x + (target.x - from.x) * k; aim.y = from.y + (target.y - from.y) * k;
          if (k < 1) ctx.timeout(step, 40);
          else ctx.timeout(function () { phase = 'aim'; throwDart(target.x, target.y); }, 260);
        };
        ctx.timeout(step, 500);
      }
      function humanThrow() {
        if (roster[cur].isBot) return;
        var w = wobble();
        throwDart(aim.x + w.x + gauss() * 3, aim.y + w.y + gauss() * 3);
      }

      /* -------------------------------------------------------- render */
      function buildBoard() {
        board = document.createElement('canvas');
        board.width = Math.round(S * view.px); board.height = Math.round(S * view.px);
        var b = board.getContext('2d');
        b.scale(view.px, view.px);
        b.fillStyle = '#6FB5A5'; b.fillRect(0, 0, S, S);
        b.fillStyle = '#29B3A6';
        for (var k = 0; k < 7; k++) { b.beginPath(); b.arc((k * 97) % S, (k * 173) % S, 60 + k * 6, 0, 7); b.fill(); }
        b.fillStyle = 'rgba(0,0,0,.22)'; b.beginPath(); b.arc(C + 6, C + 10, R_NUM + 14, 0, 7); b.fill();
        b.fillStyle = '#C98048'; b.beginPath(); b.arc(C, C, R_NUM + 14, 0, 7); b.fill(); b.strokeStyle = O; b.lineWidth = 5; b.stroke();
        b.fillStyle = O; b.beginPath(); b.arc(C, C, R_NUM + 2, 0, 7); b.fill();
        for (var i = 0; i < 20; i++) {
          var a0 = (-99 + i * 18) * Math.PI / 180, a1 = a0 + Math.PI / 10;
          var dark = i % 2 === 0;
          var ring = function (r0, r1, col) { b.fillStyle = col; b.beginPath(); b.arc(C, C, r1, a0, a1); b.arc(C, C, r0, a1, a0, true); b.closePath(); b.fill(); };
          ring(R_OUTER, R_D1, dark ? '#6B5C50' : '#FBF6EF');
          ring(R_T0, R_T1, dark ? '#E26D5C' : '#8FA968');
          ring(R_D0, R_D1, dark ? '#E26D5C' : '#8FA968');
        }
        b.strokeStyle = 'rgba(27,21,48,.7)'; b.lineWidth = 1.5;
        for (i = 0; i < 20; i++) { var a = (-99 + i * 18) * Math.PI / 180; b.beginPath(); b.moveTo(C + Math.cos(a) * R_OUTER, C + Math.sin(a) * R_OUTER); b.lineTo(C + Math.cos(a) * R_D1, C + Math.sin(a) * R_D1); b.stroke(); }
        [R_T0, R_T1, R_D0, R_D1].forEach(function (r) { b.beginPath(); b.arc(C, C, r, 0, 7); b.stroke(); });
        b.fillStyle = '#8FA968'; b.beginPath(); b.arc(C, C, R_OUTER, 0, 7); b.fill(); b.stroke();
        b.fillStyle = '#E26D5C'; b.beginPath(); b.arc(C, C, R_BULL, 0, 7); b.fill(); b.stroke();
        b.fillStyle = '#FBF6EF'; b.font = '700 22px ' + getComputedStyle(ctx.stage).fontFamily; b.textAlign = 'center'; b.textBaseline = 'middle';
        ORDER.forEach(function (n, k) { var p = segPoint(n, (R_D1 + R_NUM + 2) / 2 + 1); b.fillText(String(n), p.x, p.y + 1); });
      }
      function drawDart(x, y, owner, scale) {
        var p = roster[owner];
        g.save(); g.translate(x, y); g.scale(scale || 1, scale || 1); g.rotate(-0.5);
        g.strokeStyle = O; g.lineWidth = 3; g.lineCap = 'round';
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(3, 4, 4, 0, 7); g.fill();
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.stroke();
        g.fillStyle = '#DDE3EE'; g.beginPath(); if (g.roundRect) g.roundRect(-4, 8, 8, 16, 3); else g.rect(-4, 8, 8, 16); g.fill(); g.stroke();
        g.fillStyle = p.color; g.beginPath(); g.moveTo(0, 26); g.lineTo(-10, 44); g.lineTo(0, 40); g.lineTo(10, 44); g.closePath(); g.fill(); g.lineWidth = 2.5; g.stroke();
        g.fillStyle = O; g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill();
        g.restore();
      }
      function render() {
        view.begin();
        if (!board) buildBoard();
        g.drawImage(board, 0, 0, S, S);
        darts.forEach(function (d) { drawDart(d.x, d.y, d.owner); });
        if (flying) {
          var k = Math.min(1, flying.t / 0.28), e = 1 - Math.pow(1 - k, 2);
          drawDart(flying.x0 + (flying.x - flying.x0) * e, flying.y0 + (flying.y - flying.y0) * e, cur, 1.8 - 0.8 * e);
        }
        // aim reticle
        if ((phase === 'aim' || phase === 'botaim') && !ctx.over) {
          var w = wobble(), x = aim.x + w.x, y = aim.y + w.y, col = roster[cur].color;
          g.lineWidth = 6; g.strokeStyle = O; g.beginPath(); g.arc(x, y, 16, 0, 7); g.stroke();
          g.lineWidth = 3; g.strokeStyle = col; g.beginPath(); g.arc(x, y, 16, 0, 7); g.stroke();
          g.lineWidth = 3; g.strokeStyle = O; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x - 8, y); g.moveTo(x + 8, y); g.lineTo(x + 26, y); g.moveTo(x, y - 26); g.lineTo(x, y - 8); g.moveTo(x, y + 8); g.lineTo(x, y + 26); g.stroke();
          g.fillStyle = col; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
        }
        if (popup) {
          var a = Math.min(1, 2 - popup.t * 2);
          g.globalAlpha = Math.max(0, a);
          g.font = '700 28px ' + getComputedStyle(ctx.stage).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle';
          var px = A.clamp(popup.x, 110, S - 110), py = A.clamp(popup.y - 50 - popup.t * 20, 30, S - 30);
          g.lineWidth = 6; g.strokeStyle = O; g.strokeText(popup.text, px, py);
          g.fillStyle = popup.text === 'BUST!' ? '#E26D5C' : '#F0BD5E'; g.fillText(popup.text, px, py);
          g.globalAlpha = 1;
        }
      }

      /* --------------------------------------------------------- input */
      function human() { return phase === 'aim' && !roster[cur].isBot && !ctx.over; }
      function onKey(e, down) {
        if (ctx.shell.overlay) { keys = {}; return; }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) >= 0) { e.preventDefault(); keys[e.key] = down; }
        if (down && !e.repeat && (e.code === 'Space' || e.key === 'Enter') && human()) { e.preventDefault(); humanThrow(); }
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.onResize = function () { board = null; };
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Dartboard. Move the aim with the arrow keys and press Space to throw.');
          ctx.listen(view.canvas, 'pointermove', function (e) {
            if (!human()) return;
            if (e.pointerType === 'mouse' && !drag) { var p = view.toGame(e); aim.x = p.x; aim.y = p.y; }
            else if (drag && e.pointerId === drag.id) {
              var q = view.toGame(e);
              aim.x = A.clamp(drag.ax + (q.x - drag.x) * 1.2, 0, S); aim.y = A.clamp(drag.ay + (q.y - drag.y) * 1.2, 0, S);
            }
          });
          ctx.listen(view.canvas, 'pointerdown', function (e) {
            if (!human()) return;
            e.preventDefault(); A.sound.unlock();
            if (e.pointerType === 'mouse') { var p = view.toGame(e); aim.x = p.x; aim.y = p.y; humanThrow(); return; }
            var q = view.toGame(e);
            drag = { id: e.pointerId, x: q.x, y: q.y, ax: aim.x, ay: aim.y };
            try { view.canvas.setPointerCapture(e.pointerId); } catch (er) { /* */ }
          });
          ctx.listen(view.canvas, 'pointerup', function (e) { if (drag && e.pointerId === drag.id) { drag = null; if (human()) humanThrow(); } });
          ctx.listen(view.canvas, 'pointercancel', function () { drag = null; });
          ctx.listen(window, 'keydown', function (e) { onKey(e, true); });
          ctx.listen(window, 'keyup', function (e) { onKey(e, false); });
          hud(); say();
          if (roster[cur].isBot) botTurn();
          ctx.loop(function (dt) {
            if (dt > 0) {
              t += dt;
              if (human()) {
                var sp = 260 * dt;
                if (keys.ArrowLeft) aim.x -= sp; if (keys.ArrowRight) aim.x += sp;
                if (keys.ArrowUp) aim.y -= sp; if (keys.ArrowDown) aim.y += sp;
                aim.x = A.clamp(aim.x, 0, S); aim.y = A.clamp(aim.y, 0, S);
              }
              if (flying) { flying.t += dt; if (flying.t >= 0.28) landed(); }
              if (popup) { popup.t += dt; if (popup.t > 1.2) popup = null; }
            }
            render();
          });
        },
        pause: function () { keys = {}; drag = null; },
        destroy: function () {}
      };
    }
  });
})();

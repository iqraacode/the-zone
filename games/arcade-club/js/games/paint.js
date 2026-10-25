/* ==========================================================================
   GAME 11 — PAINT PARTY  (1–3 players + CPU painters, simultaneous)
   Paint rollers glide around the floor on their own; you steer left/right.
   Everything you roll over becomes your colour (and pattern), even other
   players' paint. Grab paint buckets for a big splash.
   Most floor painted when the timer ends wins.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var LW = 800, LH = 512, CELL = 16, GW = 50, GH = 32, R = 19, SPEED = 165, TURN = 3.3, BRUSH = 21;
  var KEYS = [{ l: 'KeyA', r: 'KeyD', label: 'A / D' }, { l: 'ArrowLeft', r: 'ArrowRight', label: '← / →' }, { l: 'KeyJ', r: 'KeyL', label: 'J / L' }];
  var STARTS = [[120, 120, 0.5], [680, 392, Math.PI + 0.5], [680, 120, Math.PI - 0.5], [120, 392, -0.5]];

  function makePattern(p, kind) {
    var c = document.createElement('canvas'); c.width = c.height = 16;
    var g = c.getContext('2d');
    g.fillStyle = p.color; g.fillRect(0, 0, 16, 16);
    g.fillStyle = 'rgba(255,255,255,.32)'; g.strokeStyle = 'rgba(255,255,255,.32)'; g.lineWidth = 2.5;
    if (kind === 0) { g.beginPath(); g.arc(4, 4, 2.2, 0, 7); g.arc(12, 12, 2.2, 0, 7); g.fill(); }
    else if (kind === 1) { g.beginPath(); g.moveTo(-2, 10); g.lineTo(10, -2); g.moveTo(6, 18); g.lineTo(18, 6); g.stroke(); }
    else if (kind === 2) { g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); }
    else { g.fillRect(0, 6, 16, 4); }
    return c;
  }

  A.register({
    id: 'paint',
    title: 'Paint Party',
    tagline: 'Roll your colour across the floor and cover the most.',
    description: 'Steer your paint roller and cover the floor in your colour. Paint over rivals and grab buckets for big splashes!',
    color: '#E8B45A',
    players: [1, 2, 3],
    cats: ['quick', 'action', 'multiplayer'],
    modes: { 1: 'vs CPU painters', 2: 'Paint-off', 3: 'Paint-off' },
    pausable: true,
    options: function (n) {
      var cp = [];
      for (var k = (n === 1 ? 1 : 0); k <= 4 - n; k++) cp.push({ v: k, label: k === 0 ? 'No CPUs' : k + ' CPU' + (k > 1 ? 's' : '') });
      return [
        { id: 'time', label: 'Round length', def: 45, choices: [{ v: 30, label: '30 seconds' }, { v: 45, label: '45 seconds' }, { v: 60, label: '60 seconds' }] },
        { id: 'cpus', label: 'CPU painters', def: Math.min(n === 1 ? 2 : 1, 4 - n), choices: cp },
        { id: 'level', label: 'CPU skill', def: 'normal', choices: [{ v: 'easy', label: 'Messy' }, { v: 'normal', label: 'Tidy' }, { v: 'hard', label: 'Pro' }] }
      ];
    },
    rules: function () {
      return ['Your roller keeps moving by itself. You only steer left and right.', 'Every tile you roll over turns your colour, even if someone else painted it first.',
        'Roll into a paint bucket for a big splash. Bump the edges and you bounce off.', 'When time runs out, whoever covers the most floor wins.'];
    },
    controls: function (cfg) {
      var c = [];
      if (cfg.players === 1) c.push(['A / D / ← / →', 'Steer']);
      else for (var i = 0; i < cfg.players; i++) c.push([KEYS[i].label, 'Player ' + (i + 1) + ' steers']);
      c.push(['Touch ◀ ▶', 'Steer (hold)']);
      c.push(['Esc', 'Pause']);
      return c;
    },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var b = A.store.record('paint', 'best'), w = A.store.record('paint', 'wins');
      if (b === null) return null;
      return 'Best coverage: ' + b + '%' + (w ? ' · wins: ' + w : '');
    },

    create: function (ctx) {
      var cfg = ctx.cfg, D = cfg.opts.time || 45, level = cfg.opts.level || 'normal';
      var cpus = typeof cfg.opts.cpus === 'number' ? cfg.opts.cpus : (cfg.players === 1 ? 2 : 1);
      if (cfg.players === 1 && cpus < 1) cpus = 1;
      cpus = Math.min(cpus, 4 - cfg.players);
      var roster = A.makeRoster(cfg.players, cpus);
      var touch = A.isTouch();
      var grid = new Int8Array(GW * GH).fill(-1), counts = roster.map(function () { return 0; });
      var rollers = roster.map(function (p, i) {
        var s = STARTS[i];
        return { p: p, x: s[0], y: s[1], a: s[2], bot: p.isBot ? { tx: s[0], ty: s[1], retarget: 0, wander: Math.random() * 6 } : null, bump: 0 };
      });
      var keys = {}, buckets = [], bucketT = 3, splashes = [], left = D, phase = 'count', cd = 3.2, lastBeep = 4, t = 0;
      var skill = { easy: 0.55, normal: 0.85, hard: 1 }[level];

      var pads = A.steerPads(ctx, roster);
      pads.el.hidden = !touch;
      var view = A.makeCanvas(ctx, LW, LH, { rotateWhenTall: true, reserve: function () { return pads.el.hidden ? 0 : pads.el.offsetHeight + 10; } });
      var g = view.g, layer = null, lg = null, patterns = [];
      var wrap = h('div', { class: 'arc-race' }, h('div', { class: 'arc-race-view' }, view.canvas), pads.el);

      /* ------------------------------------------------- paint layer */
      function buildLayer() {
        layer = document.createElement('canvas');
        layer.width = Math.round(LW * view.px); layer.height = Math.round(LH * view.px);
        lg = layer.getContext('2d');
        lg.scale(view.px, view.px);
        patterns = roster.map(function (p, i) { return lg.createPattern(makePattern(p, i), 'repeat'); });
        lg.fillStyle = '#FBECC9'; lg.fillRect(0, 0, LW, LH);
        for (var k = 0; k < grid.length; k++) drawCell(k);
      }
      function drawCell(k) {
        var x = (k % GW) * CELL, y = Math.floor(k / GW) * CELL, o = grid[k];
        if (o < 0) {
          lg.fillStyle = '#FBECC9'; lg.fillRect(x, y, CELL, CELL);
          lg.fillStyle = 'rgba(185,130,26,.12)'; lg.fillRect(x, y, CELL, 1); lg.fillRect(x, y, 1, CELL);
        } else { lg.fillStyle = patterns[o]; lg.fillRect(x, y, CELL, CELL); }
      }
      function paintCircle(i, cx, cy, r) {
        var x0 = Math.max(0, Math.floor((cx - r) / CELL)), x1 = Math.min(GW - 1, Math.floor((cx + r) / CELL));
        var y0 = Math.max(0, Math.floor((cy - r) / CELL)), y1 = Math.min(GH - 1, Math.floor((cy + r) / CELL));
        for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) {
          var mx = gx * CELL + CELL / 2, my = gy * CELL + CELL / 2;
          if ((mx - cx) * (mx - cx) + (my - cy) * (my - cy) > r * r) continue;
          var k = gy * GW + gx, o = grid[k];
          if (o === i) continue;
          if (o >= 0) counts[o]--;
          grid[k] = i; counts[i]++;
          if (lg) drawCell(k);
        }
      }

      /* ------------------------------------------------------ control */
      function steerFor(i) {
        var r = rollers[i];
        if (r.bot) return botSteer(r, i);
        var k = KEYS[i], s = 0;
        if (keys[k.l] || (cfg.players === 1 && (keys.ArrowLeft || keys.KeyA))) s -= 1;
        if (keys[k.r] || (cfg.players === 1 && (keys.ArrowRight || keys.KeyD))) s += 1;
        var ps = pads.state[i];
        if (ps) { if (ps.left.size) s -= 1; if (ps.right.size) s += 1; }
        return A.clamp(s, -1, 1);
      }
      function botSteer(r, i) {
        var b = r.bot;
        b.retarget -= 1 / 60;
        var near = buckets.filter(function (bk) { return Math.hypot(bk.x - r.x, bk.y - r.y) < 220; })[0];
        if (near && Math.random() < skill) { b.tx = near.x; b.ty = near.y; }
        else if (b.retarget <= 0 || Math.hypot(b.tx - r.x, b.ty - r.y) < 30) {
          var best = null;
          for (var k = 0; k < 14; k++) {
            var x = A.rand(60, LW - 60), y = A.rand(60, LH - 60), gain = 0;
            for (var dy = -3; dy <= 3; dy++) for (var dx = -3; dx <= 3; dx++) {
              var gx = Math.floor(x / CELL) + dx, gy = Math.floor(y / CELL) + dy;
              if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) continue;
              var o = grid[gy * GW + gx];
              gain += o === i ? 0 : o < 0 ? 1 : 1.3;   // stealing is worth a little more
            }
            var sc = gain * skill - Math.hypot(x - r.x, y - r.y) * 0.04 + Math.random() * (1 - skill) * 30;
            if (!best || sc > best.s) best = { x: x, y: y, s: sc };
          }
          b.tx = best.x; b.ty = best.y; b.retarget = A.rand(1.2, 2.2);
        }
        var want = Math.atan2(b.ty - r.y, b.tx - r.x), d = want - r.a;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        return A.clamp(d * 2.5, -1, 1) * (0.7 + 0.3 * skill);
      }

      /* -------------------------------------------------------- update */
      function update(dt) {
        t += dt;
        if (phase === 'count') {
          cd -= dt;
          var n = Math.ceil(cd - 0.5);
          if (n < lastBeep && n >= 1 && cd < 3) { lastBeep = n; ctx.sfx('beep'); }
          if (cd <= 0.5) { phase = 'play'; ctx.sfx('go'); ctx.setStatus(touch ? 'Hold ◀ ▶ to steer!' : cfg.players === 1 ? 'Steer with A / D or the arrow keys!' : roster.filter(function (p) { return !p.isBot; }).map(function (p, k) { return p.short + ': ' + KEYS[k].label; }).join(' · ')); }
          return;
        }
        if (phase !== 'play') return;
        left -= dt;
        bucketT -= dt;
        if (bucketT <= 0 && buckets.length < 2) { buckets.push({ x: A.rand(70, LW - 70), y: A.rand(70, LH - 70), t: 0 }); bucketT = A.rand(4, 6.5); }
        buckets.forEach(function (bk) { bk.t += dt; });
        rollers.forEach(function (r, i) {
          r.a += steerFor(i) * TURN * dt;
          r.x += Math.cos(r.a) * SPEED * dt; r.y += Math.sin(r.a) * SPEED * dt;
          // bounce off the edges
          if (r.x < R) { r.x = R; r.a = Math.PI - r.a; wall(r); }
          if (r.x > LW - R) { r.x = LW - R; r.a = Math.PI - r.a; wall(r); }
          if (r.y < R) { r.y = R; r.a = -r.a; wall(r); }
          if (r.y > LH - R) { r.y = LH - R; r.a = -r.a; wall(r); }
          r.bump = Math.max(0, r.bump - dt * 3);
          paintCircle(i, r.x, r.y, BRUSH);
          buckets = buckets.filter(function (bk) {
            if (Math.hypot(bk.x - r.x, bk.y - r.y) < 30) {
              paintCircle(i, bk.x, bk.y, 74);
              splashes.push({ x: bk.x, y: bk.y, t: 0, c: r.p.color });
              ctx.sfx('splash');
              return false;
            }
            return true;
          });
        });
        // rollers bump each other
        for (var i = 0; i < rollers.length; i++) for (var j = i + 1; j < rollers.length; j++) {
          var a = rollers[i], b = rollers[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < R * 2 && d > 0.01) {
            var push = (R * 2 - d) / 2, nx = dx / d, ny = dy / d;
            a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
            a.a = Math.atan2(-ny, -nx) + A.rand(-0.4, 0.4); b.a = Math.atan2(ny, nx) + A.rand(-0.4, 0.4);
            a.bump = b.bump = 1; ctx.sfx('bump');
          }
        }
        splashes = splashes.filter(function (s) { s.t += dt * 2; return s.t < 1; });
        ctx.setScores(counts.map(function (c) { return Math.round(c / (GW * GH) * 100); }), function (v) { return v + '%'; });
        ctx.setStats([['Time', Math.max(0, Math.ceil(left)) + 's']]);
        if (left <= 0) end();
      }
      function wall(r) { r.bump = 1; }
      function end() {
        if (ctx.over) return;
        phase = 'done';
        var pct = counts.map(function (c) { return Math.round(c / (GW * GH) * 1000) / 10; });
        var rows = A.rank(roster, counts).map(function (r) { r.label = pct[r.player.index] + '%'; return r; });
        var top = rows.filter(function (r) { return r.place === 1; });
        var humanWon = top.length === 1 && !top[0].player.isBot;
        var recs = [];
        if (cfg.players === 1) {
          var rb = A.store.submit('paint', 'best', pct[0], 'high');
          if (rb.isNew && rb.prev !== null) recs.push('New best coverage: ' + pct[0] + '%');
          if (humanWon) recs.push('Wins so far: ' + A.store.add('paint', 'wins'));
        }
        ctx.setStatus("Brushes down! Time's up.");
        ctx.finish({ title: A.winnerTitle(rows), subtitle: 'Floor painted: ' + Math.round(pct.reduce(function (s, v) { return s + v; }, 0)) + '%', rows: rows, records: recs, tone: cfg.players === 1 && !humanWon ? 'lose' : 'win' });
      }

      /* -------------------------------------------------------- render */
      function drawRoller(r) {
        var p = r.p;
        g.save(); g.translate(r.x, r.y); g.rotate(r.a);
        var wob = r.bump ? Math.sin(t * 50) * 2 * r.bump : 0;
        g.lineCap = 'round'; g.lineJoin = 'round';
        // handle trailing behind
        g.strokeStyle = O; g.lineWidth = 8; g.beginPath(); g.moveTo(-4, 0); g.lineTo(-24, 0); g.lineTo(-24, 12); g.lineTo(-40, 12); g.stroke();
        g.strokeStyle = '#EDE7F5'; g.lineWidth = 3.5; g.stroke();
        g.fillStyle = '#5A4D40'; g.strokeStyle = O; g.lineWidth = 3;
        g.beginPath(); if (g.roundRect) g.roundRect(-62, 6, 24, 12, 5); else g.rect(-62, 6, 24, 12); g.fill(); g.stroke();
        // roller drum
        g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); if (g.roundRect) g.roundRect(-5, -R - 1 + 4, 16, R * 2 + 2, 7); else g.rect(-5, -R + 3, 16, R * 2 + 2); g.fill();
        g.fillStyle = p.color; g.beginPath(); if (g.roundRect) g.roundRect(-8 + wob, -R - 1, 16, R * 2 + 2, 7); else g.rect(-8, -R - 1, 16, R * 2 + 2); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(27,21,48,.3)'; g.lineWidth = 2.5;
        for (var k = -R + 6; k < R; k += 9) { g.beginPath(); g.moveTo(-6 + wob, k); g.lineTo(6 + wob, k + 5); g.stroke(); }
        g.restore();
        A.drawSymbol(g, p, r.x - Math.cos(r.a) * 24 + Math.cos(r.a + Math.PI / 2) * 12, r.y - Math.sin(r.a) * 24 + Math.sin(r.a + Math.PI / 2) * 12, 7, 1.6);
      }
      function render() {
        view.begin();
        if (!layer) buildLayer();
        g.drawImage(layer, 0, 0, LW, LH);
        g.strokeStyle = O; g.lineWidth = 6; g.strokeRect(3, 3, LW - 6, LH - 6);
        buckets.forEach(function (bk) {
          var bob = Math.sin(bk.t * 5) * 3;
          g.save(); g.translate(bk.x, bk.y + bob);
          g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(2, 18 - bob, 18, 6, 0, 0, 7); g.fill();
          g.strokeStyle = O; g.lineWidth = 3; g.lineJoin = 'round';
          g.fillStyle = '#B9C3D6'; g.beginPath(); g.moveTo(-16, -10); g.lineTo(16, -10); g.lineTo(12, 16); g.lineTo(-12, 16); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#E9A194'; g.beginPath(); g.ellipse(0, -10, 16, 6, 0, 0, 7); g.fill(); g.stroke();
          g.beginPath(); g.arc(0, -12, 16, Math.PI, 0); g.lineWidth = 2.5; g.stroke();
          g.restore();
        });
        splashes.forEach(function (s) {
          g.strokeStyle = s.c; g.globalAlpha = 1 - s.t; g.lineWidth = 8;
          g.beginPath(); g.arc(s.x, s.y, 20 + s.t * 70, 0, 7); g.stroke(); g.globalAlpha = 1;
        });
        rollers.forEach(drawRoller);
        if (phase === 'count') {
          view.screen();
          var W = view.rotated ? LH : LW, H = view.rotated ? LW : LH;
          var txt = cd > 2.6 ? 'Ready?' : String(Math.max(1, Math.ceil(cd - 0.5)));
          g.font = '700 64px ' + getComputedStyle(ctx.stage).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle';
          var tw = g.measureText(txt).width + 50;
          g.fillStyle = '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 5;
          g.beginPath(); if (g.roundRect) g.roundRect(W / 2 - tw / 2, H / 2 - 46, tw, 92, 22); else g.rect(W / 2 - tw / 2, H / 2 - 46, tw, 92); g.fill(); g.stroke();
          g.fillStyle = O; g.fillText(txt, W / 2, H / 2 + 3);
        }
      }

      function onKey(e, down) {
        var codes = ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyL'];
        if (codes.indexOf(e.code) < 0) return;
        if (ctx.shell.overlay) { keys = {}; return; }
        e.preventDefault();
        keys[e.code] = down;
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.onResize = function () { layer = null; };
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Paint floor. Each player has their own colour and pattern.');
          rollers.forEach(function (r, i) { paintCircle(i, r.x, r.y, BRUSH + 8); });
          ctx.listen(window, 'keydown', function (e) { onKey(e, true); });
          ctx.listen(window, 'keyup', function (e) { onKey(e, false); });
          ctx.listen(window, 'blur', function () { keys = {}; });
          ctx.setScores(counts.map(function () { return 0; }), function (v) { return v + '%'; });
          ctx.setStatus('Get your rollers ready!');
          ctx.loop(function (dt) { if (dt > 0) update(dt); render(); });
        },
        pause: function () { keys = {}; pads.clear(); },
        destroy: function () {}
      };
    }
  });
})();

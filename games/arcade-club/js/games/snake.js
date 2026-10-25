/* ==========================================================================
   GAME 13 — EEL DUEL  (1–3 players + CPU eels, simultaneous)
   Grid snake battle in a coral reef. Eat fish to grow. Crash into a wall,
   yourself or another eel and you're out. Last eel swimming wins
   (ties broken by length). Solo with no CPUs = classic score mode.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var GW = 30, GH = 20, CELL = 26, LW = GW * CELL, LH = GH * CELL;
  var KEYS = [
    { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', label: 'W A S D' },
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', label: 'Arrow keys' },
    { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', label: 'I J K L' }
  ];
  var STARTS = [[4, 4, 1, 0], [25, 15, -1, 0], [4, 15, 1, 0], [25, 4, -1, 0]];

  A.register({
    id: 'snake',
    title: 'Eel Duel',
    tagline: 'Grow your eel and be the last one swimming.',
    description: 'Eat fish to grow longer and trap your rivals. Bump into anything and you’re out. Last eel swimming wins!',
    color: '#8FA968',
    players: [1, 2, 3],
    cats: ['action', 'multiplayer'],
    modes: { 1: 'Classic or vs CPU', 2: 'Last eel wins', 3: 'Last eel wins' },
    pausable: true,
    options: function (n) {
      var cp = [];
      for (var k = 0; k <= 4 - n && k <= 2; k++) cp.push({ v: k, label: k === 0 ? (n === 1 ? 'Classic (no CPUs)' : 'No CPUs') : k + ' CPU' + (k > 1 ? 's' : '') });
      var o = [{ id: 'cpus', label: 'CPU eels', def: n === 1 ? 1 : 0, choices: cp },
        { id: 'speed', label: 'Speed', def: 'normal', choices: [{ v: 'slow', label: 'Chill' }, { v: 'normal', label: 'Normal' }, { v: 'fast', label: 'Zoomy' }] }];
      o.push({ id: 'level', label: 'CPU skill', def: 'normal', choices: [{ v: 'easy', label: 'Dozy' }, { v: 'normal', label: 'Clever' }] });
      return o;
    },
    rules: function (cfg) {
      var vs = cfg.players > 1 || cfg.opts.cpus > 0;
      return ['Your eel swims on its own. Change direction to steer it.', 'Eat fish to grow (+1). Golden starfish are worth +3.',
        'Hitting a wall, your own tail or another eel knocks you out. Head-on crashes knock out both eels.',
        vs ? 'Last eel swimming wins. If the last eels crash together, the longest wins.' : 'Classic mode: eat as many fish as you can before you crash.'];
    },
    controls: function (cfg) {
      var c = [];
      if (cfg.players === 1) c.push(['W A S D / Arrow keys', 'Steer']);
      else for (var i = 0; i < cfg.players; i++) c.push([KEYS[i].label, 'Player ' + (i + 1) + ' steers']);
      c.push(['Touch ◀ ▶', 'Turn left / right']);
      if (cfg.players === 1) c.push(['Swipe', 'Steer (on the reef)']);
      c.push(['Esc', 'Pause']);
      return c;
    },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var b = A.store.record('snake', 'classic');
      return b === null ? null : 'Classic best: ' + b + ' points';
    },

    create: function (ctx) {
      var cfg = ctx.cfg, level = cfg.opts.level || 'normal';
      var cpus = typeof cfg.opts.cpus === 'number' ? Math.min(cfg.opts.cpus, 4 - cfg.players) : (cfg.players === 1 ? 1 : 0);
      var roster = A.makeRoster(cfg.players, cpus);
      var classic = roster.length === 1, touch = A.isTouch();
      var baseTick = { slow: 0.17, normal: 0.13, fast: 0.095 }[cfg.opts.speed || 'normal'];
      var eels = roster.map(function (p, i) {
        var s = STARTS[i], body = [];
        for (var k = 0; k < 4; k++) body.push({ x: s[0] - s[2] * k, y: s[1] - s[3] * k });
        return { p: p, body: body, dir: { x: s[2], y: s[3] }, queue: [], alive: true, grow: 0, eaten: 0, outAt: null, fade: 1 };
      });
      var food = [], tickT = 0, t = 0, phase = 'count', cd = 3.2, lastBeep = 4, deaths = 0, ending = null, keys = {};

      var pads = A.steerPads(ctx, roster, function (i, side) { turnRel(i, side === 'left' ? -1 : 1); });
      pads.el.hidden = !touch;
      var view = A.makeCanvas(ctx, LW, LH, { rotateWhenTall: true, reserve: function () { return pads.el.hidden ? 0 : pads.el.offsetHeight + 10; } });
      var g = view.g, bg = null;
      var wrap = h('div', { class: 'arc-race' }, h('div', { class: 'arc-race-view' }, view.canvas), pads.el);

      function occupied(x, y) { return eels.some(function (e) { return e.alive && e.body.some(function (b) { return b.x === x && b.y === y; }); }); }
      function addFood() {
        for (var k = 0; k < 200; k++) {
          var x = A.randInt(1, GW - 2), y = A.randInt(1, GH - 2);
          if (!occupied(x, y) && !food.some(function (f) { return f.x === x && f.y === y; })) { food.push({ x: x, y: y, gold: Math.random() < 0.12, t: 0 }); return; }
        }
      }
      function lastDir(e) { return e.queue.length ? e.queue[e.queue.length - 1] : e.dir; }
      function setDir(i, x, y) {
        var e = eels[i];
        if (!e || !e.alive || phase !== 'play' || ctx.paused) return;
        var ld = lastDir(e);
        if ((ld.x === -x && ld.y === -y) || (ld.x === x && ld.y === y)) return; // no reversing
        if (e.queue.length < 2) e.queue.push({ x: x, y: y });
      }
      function turnRel(i, s) {
        var ld = lastDir(eels[i] || { dir: { x: 1, y: 0 }, queue: [] });
        setDir(i, s < 0 ? ld.y : -ld.y, s < 0 ? -ld.x : ld.x);
      }

      /* ------------------------------------------------------------ bot */
      function free(x, y, heads) {
        if (x < 0 || y < 0 || x >= GW || y >= GH) return false;
        if (heads && heads[x + ',' + y]) return false;
        return !eels.some(function (e) {
          if (!e.alive) return false;
          var n = e.body.length - (e.grow ? 0 : 1); // tail moves away this tick
          for (var k = 0; k < n; k++) if (e.body[k].x === x && e.body[k].y === y) return true;
          return false;
        });
      }
      function space(x, y, limit) {
        var seen = {}, q = [[x, y]], n = 0;
        seen[x + ',' + y] = 1;
        while (q.length && n < limit) {
          var c = q.shift(); n++;
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
            var nx = c[0] + d[0], ny = c[1] + d[1], k = nx + ',' + ny;
            if (!seen[k] && free(nx, ny)) { seen[k] = 1; q.push([nx, ny]); }
          });
        }
        return n;
      }
      function botChoose(e, i) {
        var hd = e.body[0], opts = [e.dir, { x: e.dir.y, y: -e.dir.x }, { x: -e.dir.y, y: e.dir.x }];
        // cells other heads might move into next
        var danger = {};
        eels.forEach(function (o, j) {
          if (j === i || !o.alive) return;
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { danger[(o.body[0].x + d[0]) + ',' + (o.body[0].y + d[1])] = 1; });
        });
        var scored = opts.map(function (d) {
          var nx = hd.x + d.x, ny = hd.y + d.y;
          if (!free(nx, ny)) return { d: d, s: -1e6 };
          var room = space(nx, ny, 80);
          var near = food.reduce(function (m, f) { return Math.min(m, Math.abs(f.x - nx) + Math.abs(f.y - ny) - (f.gold ? 2 : 0)); }, 99);
          var s = -near * 2 + Math.min(room, 40) * 1.5 - (danger[nx + ',' + ny] ? 25 : 0);
          if (room < e.body.length + 2) s -= 200;
          return { d: d, s: s + Math.random() };
        });
        scored.sort(function (a, b) { return b.s - a.s; });
        if (level === 'easy' && Math.random() < 0.2) {
          var ok = scored.filter(function (x) { return x.s > -1e5; });
          if (ok.length) return A.pick(ok).d;
        }
        return scored[0].d;
      }

      /* ----------------------------------------------------------- tick */
      function tick() {
        eels.forEach(function (e, i) {
          if (!e.alive) return;
          if (e.p.isBot) e.dir = botChoose(e, i);
          else if (e.queue.length) e.dir = e.queue.shift();
        });
        var heads = eels.map(function (e) { return e.alive ? { x: e.body[0].x + e.dir.x, y: e.body[0].y + e.dir.y } : null; });
        // move
        eels.forEach(function (e, i) {
          if (!e.alive) return;
          e.body.unshift(heads[i]);
          if (e.grow > 0) e.grow--; else e.body.pop();
        });
        // collisions
        var dying = [];
        eels.forEach(function (e, i) {
          if (!e.alive) return;
          var hd = heads[i];
          var out = hd.x < 0 || hd.y < 0 || hd.x >= GW || hd.y >= GH;
          if (!out) out = eels.some(function (o, j) {
            if (!o.alive) return false;
            return o.body.some(function (b, k) { return b.x === hd.x && b.y === hd.y && !(j === i && k === 0); });
          });
          if (out) dying.push(i);
        });
        // head swap (passing through each other)
        eels.forEach(function (e, i) {
          eels.forEach(function (o, j) {
            if (j <= i || !e.alive || !o.alive) return;
            if (e.body[0].x === o.body[1].x && e.body[0].y === o.body[1].y && o.body[0].x === e.body[1].x && o.body[0].y === e.body[1].y) { dying.push(i); dying.push(j); }
          });
        });
        if (dying.length) {
          deaths++;
          dying.forEach(function (i) { var e = eels[i]; if (e.alive) { e.alive = false; e.outAt = t; e.order = deaths; } });
          ctx.sfx('crash');
          var names = dying.filter(function (v, k, a) { return a.indexOf(v) === k; }).map(function (i) { return eels[i].p.name; });
          ctx.setStatus(names.join(' & ') + (names.length > 1 ? ' crashed!' : ' is out!'));
        }
        // eat
        eels.forEach(function (e) {
          if (!e.alive) return;
          food = food.filter(function (f) {
            if (f.x === e.body[0].x && f.y === e.body[0].y) {
              var v = f.gold ? 3 : 1;
              e.grow += v; e.eaten += v;
              ctx.sfx(f.gold ? 'coin' : 'point');
              return false;
            }
            return true;
          });
        });
        while (food.length < (roster.length > 2 ? 4 : 3)) addFood();
        // end?
        var alive = eels.filter(function (e) { return e.alive; });
        var humansAlive = alive.some(function (e) { return !e.p.isBot; });
        if (!ending && (classic ? !alive.length : (alive.length <= 1 || (cfg.players === 1 && !humansAlive)))) ending = t + 0.9;
        hud();
      }
      function score(e) { return e.eaten; }
      function hud() {
        ctx.setScores(eels.map(score), function (v, i) { return eels[i].alive ? String(eels[i].body.length) : 'out'; });
        ctx.setStats([['Time', A.fmtTime(t).replace(/\.\d$/, '')]]);
      }
      function end() {
        if (ctx.over) return;
        phase = 'done';
        if (classic) {
          var e0 = eels[0], r = A.store.submit('snake', 'classic', e0.eaten, 'high');
          ctx.finish({ title: 'Splat!', subtitle: 'Your eel grew to ' + e0.body.length + ' long.', stats: [['Score', e0.eaten], ['Length', e0.body.length], ['Survived', A.fmtTime(e0.outAt || t)], ['Best', A.store.record('snake', 'classic')]], records: r.isNew && r.prev !== null ? ['New classic best!'] : [] });
          return;
        }
        // rank: survivors first, then later knock-outs, ties by length
        var sorted = eels.slice().sort(function (a, b) {
          var oa = a.alive ? 99 : a.order, ob = b.alive ? 99 : b.order;
          return ob - oa || b.body.length - a.body.length;
        });
        var rows = sorted.map(function (e, i) {
          var prev = sorted[i - 1];
          var same = prev && (prev.alive ? 99 : prev.order) === (e.alive ? 99 : e.order) && prev.body.length === e.body.length;
          return { player: e.p, score: e.body.length, place: 0, same: same, label: (e.alive ? 'Survived' : 'Out at ' + A.fmtTime(e.outAt).replace(/\.\d$/, '')) + ' · length ' + e.body.length };
        });
        rows.forEach(function (r, i) { r.place = r.same ? rows[i - 1].place : i + 1; });
        var top = rows.filter(function (r) { return r.place === 1; });
        var humanWon = top.length === 1 && !top[0].player.isBot;
        ctx.finish({ title: A.winnerTitle(rows), subtitle: 'The reef has a champion.', rows: rows, stats: [['Match time', A.fmtTime(t)]], tone: cfg.players === 1 && !humanWon ? 'lose' : 'win' });
      }

      /* --------------------------------------------------------- render */
      function buildBg() {
        bg = document.createElement('canvas');
        bg.width = Math.round(LW * view.px); bg.height = Math.round(LH * view.px);
        var b = bg.getContext('2d');
        b.scale(view.px, view.px);
        b.fillStyle = '#1F6FB2'; b.fillRect(0, 0, LW, LH);
        b.fillStyle = 'rgba(255,255,255,.08)';
        for (var y = 0; y < GH; y++) for (var x = 0; x < GW; x++) { b.beginPath(); b.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 2, 0, 7); b.fill(); }
        var cols = ['#E9A194', '#D4A373', '#C9B2A6'];
        for (var k = 0; k < 12; k++) {
          var cx = (k * 211) % LW, cy = k % 2 ? 6 : LH - 6;
          b.fillStyle = cols[k % 3]; b.globalAlpha = 0.35; b.beginPath(); b.arc(cx, cy, 22, 0, 7); b.fill(); b.globalAlpha = 1;
        }
        b.strokeStyle = O; b.lineWidth = 6; b.strokeRect(3, 3, LW - 6, LH - 6);
      }
      function drawEel(e, k) {
        var p = e.p, alpha = e.alive ? 1 : Math.max(0.25, 1 - (t - e.outAt) * 1.2);
        g.globalAlpha = alpha;
        g.lineCap = 'round'; g.lineJoin = 'round';
        var pts = e.body.map(function (b) { return [b.x * CELL + CELL / 2, b.y * CELL + CELL / 2]; });
        var path = function () { g.beginPath(); pts.forEach(function (q, j) { if (j) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); };
        g.strokeStyle = O; g.lineWidth = CELL - 2; path(); g.stroke();
        g.strokeStyle = e.alive ? p.color : '#A0958C'; g.lineWidth = CELL - 9; path(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.setLineDash([4, 10]); path(); g.stroke(); g.setLineDash([]);
        // head
        var hd = pts[0], d = e.dir;
        g.fillStyle = e.alive ? p.color : '#A0958C'; g.strokeStyle = O; g.lineWidth = 3.5;
        g.beginPath(); g.arc(hd[0], hd[1], CELL / 2 + 1, 0, 7); g.fill(); g.stroke();
        var ex = -d.y, ey = d.x;
        [-1, 1].forEach(function (s) {
          var x = hd[0] + d.x * 4 + ex * s * 6, y = hd[1] + d.y * 4 + ey * s * 6;
          g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 4.2, 0, 7); g.fill(); g.lineWidth = 1.8; g.stroke();
          g.fillStyle = O; g.beginPath(); if (e.alive) g.arc(x + d.x * 1.5, y + d.y * 1.5, 2, 0, 7); else { g.moveTo(x - 2, y - 2); g.lineTo(x + 2, y + 2); g.moveTo(x + 2, y - 2); g.lineTo(x - 2, y + 2); g.stroke(); } g.fill();
        });
        if (pts.length > 2) A.drawSymbol(g, p, pts[2][0], pts[2][1], 6, 1.4);
        g.globalAlpha = 1;
      }
      function render() {
        view.begin();
        if (!bg) buildBg();
        g.drawImage(bg, 0, 0, LW, LH);
        food.forEach(function (f) {
          var x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2 + Math.sin(t * 4 + f.x) * 1.5;
          g.strokeStyle = O; g.lineWidth = 2.5;
          if (f.gold) {
            g.fillStyle = '#F0BD5E'; g.beginPath();
            for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 4.5 : 11; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
            g.closePath(); g.fill(); g.stroke();
          } else {
            g.fillStyle = '#D4A373';
            g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 11, y - 6); g.lineTo(x + 11, y + 6); g.closePath(); g.fill(); g.stroke();
            g.beginPath(); g.ellipse(x - 2, y, 9, 6.5, 0, 0, 7); g.fill(); g.stroke();
            g.fillStyle = O; g.beginPath(); g.arc(x - 6, y - 1.5, 1.6, 0, 7); g.fill();
          }
        });
        eels.filter(function (e) { return !e.alive; }).forEach(drawEel);
        eels.filter(function (e) { return e.alive; }).forEach(drawEel);
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

      /* ---------------------------------------------------------- input */
      function onKey(e) {
        if (ctx.shell.overlay) return;
        for (var i = 0; i < cfg.players; i++) {
          var k = KEYS[i], solo = cfg.players === 1;
          // solo players can use WASD or the arrow keys
          var hit = function (name) { return e.code === k[name] || (solo && e.code === KEYS[1][name]); };
          var d = hit('up') ? [0, -1] : hit('down') ? [0, 1] : hit('left') ? [-1, 0] : hit('right') ? [1, 0] : null;
          if (d) {
            e.preventDefault();
            // when the reef is rotated on a tall phone, map screen arrows to grid directions
            if (view.rotated) d = [-d[1], d[0]];
            setDir(i, d[0], d[1]);
            return;
          }
        }
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.onResize = function () { bg = null; };
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Coral reef arena. Steer your eel with your keys.');
          while (food.length < 3) addFood();
          ctx.listen(window, 'keydown', onKey);
          if (cfg.players === 1) {
            var sw = null;
            ctx.listen(view.canvas, 'pointerdown', function (e) { sw = { x: e.clientX, y: e.clientY }; A.sound.unlock(); });
            ctx.listen(view.canvas, 'pointerup', function (e) {
              if (!sw) return;
              var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
              if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
              var d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
              if (view.rotated) d = [-d[1], d[0]];
              setDir(0, d[0], d[1]);
            });
          }
          hud();
          ctx.setStatus('Get ready to swim!');
          ctx.loop(function (dt) {
            if (dt > 0) {
              t += phase === 'play' ? dt : 0;
              if (phase === 'count') {
                cd -= dt;
                var n = Math.ceil(cd - 0.5);
                if (n < lastBeep && n >= 1 && cd < 3) { lastBeep = n; ctx.sfx('beep'); }
                if (cd <= 0.5) { phase = 'play'; ctx.sfx('go'); ctx.setStatus(touch ? 'Tap ◀ ▶ to turn!' : cfg.players === 1 ? 'Steer with WASD or the arrow keys.' : roster.filter(function (p) { return !p.isBot; }).map(function (p, k) { return p.short + ': ' + KEYS[k].label; }).join(' · ')); }
              } else if (phase === 'play') {
                tickT += dt;
                var tick_ = Math.max(baseTick * 0.65, baseTick - t * 0.0012);
                while (tickT >= tick_ && !ending) { tickT -= tick_; tick(); }
                if (ending && t >= ending) end();
              }
            }
            render();
          });
        },
        pause: function () { pads.clear(); },
        destroy: function () {}
      };
    }
  });
})();

/* ==========================================================================
   GAME 9 — HIPPO LAGOON  (1–3 players + CPU hippos, simultaneous)
   Four hippos sit in the corners of a lagoon. Pearls roll around; press
   your button (or tap your corner) to lunge and gobble any pearl in reach.
   A lunge takes a moment to recover, so timing beats mashing.
   White pearl = 1 point, golden pearl = 3 points. Most points wins.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var S = 600, C = 300, PAD = 16, MR = 11, HEAD_R = 44;
  var REACH0 = 92, REACH = 128;         // head distance from corner: resting / extra when lunging
  var T_OUT = 0.13, T_HOLD = 0.07, T_BACK = 0.24;
  // seats: bottom-left, top-right, bottom-right, top-left
  var SEATS = [[PAD, S - PAD], [S - PAD, PAD], [S - PAD, S - PAD], [PAD, PAD]];

  A.register({
    id: 'hippos',
    title: 'Hippo Lagoon',
    tagline: 'Chomp rolling pearls before the other hippos do.',
    description: 'Four hungry hippos, one lagoon full of rolling pearls. Time your chomps and gobble the most!',
    color: '#557F9A',
    ink: '#FBF6EF',
    players: [1, 2, 3],
    cats: ['quick', 'action', 'multiplayer'],
    modes: { 1: 'vs CPU hippos', 2: 'Chomp off', 3: 'Chomp off' },
    pausable: true,
    options: function (n) {
      var cp = [];
      for (var k = (n === 1 ? 1 : 0); k <= 4 - n; k++) cp.push({ v: k, label: k === 0 ? 'No CPUs' : k + ' CPU' + (k > 1 ? 's' : '') });
      return [
        { id: 'pearls', label: 'Pearls', def: 36, choices: [{ v: 24, label: 'Snack · 24' }, { v: 36, label: 'Feast · 36' }, { v: 60, label: 'Banquet · 60' }] },
        { id: 'cpus', label: 'CPU hippos', def: 4 - n, choices: cp },
        { id: 'level', label: 'CPU appetite', def: 'normal', choices: [{ v: 'easy', label: 'Sleepy' }, { v: 'normal', label: 'Hungry' }, { v: 'hard', label: 'Starving' }] }
      ];
    },
    rules: function () {
      return ['Pearls roll around the lagoon and bounce off the walls.',
        'Press your button (or tap your corner of the lagoon) to lunge forward and gobble every pearl in front of you.',
        'After a lunge your hippo needs a moment to pull back, so time it well.',
        'White pearls are worth 1, golden pearls 3. When the lagoon is empty, most points wins.'];
    },
    controls: function (cfg) {
      var c = [];
      if (cfg.players === 1) c.push(['Space / Q', 'Chomp']);
      else for (var i = 0; i < cfg.players; i++) c.push([A.BUZZ_KEYS[i].label, 'Player ' + (i + 1) + ' chomps']);
      c.push(['Tap', 'Your corner of the lagoon or your button']);
      c.push(['Esc', 'Pause']);
      return c;
    },
    best: function (cfg) {
      var w = A.store.record('hippos', 'wins');
      return cfg.players === 1 && w ? 'Wins against CPU hippos: ' + w : null;
    },

    create: function (ctx) {
      var cfg = ctx.cfg, total = cfg.opts.pearls || 36, level = cfg.opts.level || 'normal';
      var cpus = typeof cfg.opts.cpus === 'number' ? cfg.opts.cpus : 4 - cfg.players;
      if (cfg.players === 1 && cpus < 1) cpus = 1;
      cpus = Math.min(cpus, 4 - cfg.players);
      var roster = A.makeRoster(cfg.players, cpus);
      var skill = { easy: { react: 0.28, miss: 0.45 }, normal: { react: 0.14, miss: 0.2 }, hard: { react: 0.06, miss: 0.05 } }[level];
      var scores = roster.map(function () { return 0; });
      var hippos = roster.map(function (p, i) {
        var b = SEATS[i], dx = C - b[0], dy = C - b[1], d = Math.hypot(dx, dy);
        return { p: p, bx: b[0], by: b[1], dx: dx / d, dy: dy / d, state: 'idle', st: 0, e: 0, think: 0, gulp: 0 };
      });
      var pearls = [], spawned = 0, spawnT = 0.6, t = 0, phase = 'count', cd = 2.6, lastBeep = 4, fx = [];

      var view = A.makeCanvas(ctx, S, S, { reserve: function () { return buzz.el.offsetHeight + 12; } });
      var g = view.g;
      var buzz = A.buzzers(ctx, roster, function (i) { chomp(i); }, { action: 'chomp' });
      var wrap = h('div', { class: 'arc-hippo' }, view.canvas, buzz.el);
      var waves = null;

      function head(hp) {
        var r = REACH0 + hp.e * REACH;
        return { x: hp.bx + hp.dx * r, y: hp.by + hp.dy * r };
      }
      function chomp(i) {
        var hp = hippos[i];
        if (!hp || phase !== 'play' || ctx.paused || ctx.over || hp.state !== 'idle') return;
        hp.state = 'out'; hp.st = 0;
        ctx.sfx('hit');
      }
      function spawn() {
        var a = Math.random() * Math.PI * 2, sp = A.rand(150, 220) + t * 1.5;
        var gold = Math.random() < 0.13;
        pearls.push({ x: C + A.rand(-20, 20), y: C + A.rand(-20, 20), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, gold: gold, born: t });
        spawned++;
      }
      function hud() {
        ctx.setScores(scores);
        ctx.setStats([['Pearls left', total - spawned + pearls.length]]);
      }

      function update(dt) {
        t += dt;
        if (phase === 'count') {
          cd -= dt;
          var n = Math.ceil(cd - 0.4);
          if (n < lastBeep && n >= 1) { lastBeep = n; ctx.sfx('beep'); }
          if (cd <= 0.4) { phase = 'play'; ctx.sfx('go'); ctx.setStatus(cfg.players === 1 ? 'Chomp with Space or tap your corner!' : roster.filter(function (p) { return !p.isBot; }).map(function (p, k) { return p.short + ': ' + A.buzzKeyFor(roster, k).label; }).join(' · ')); }
          return;
        }
        if (phase !== 'play') return;
        // release pearls from the centre
        spawnT -= dt;
        if (spawned < total && spawnT <= 0 && pearls.length < 8) { spawn(); spawnT = A.rand(0.35, 0.75); }
        // hippos
        hippos.forEach(function (hp, i) {
          hp.st += dt;
          if (hp.state === 'out') { hp.e = Math.min(1, hp.st / T_OUT); if (hp.st >= T_OUT) { hp.state = 'hold'; hp.st = 0; } }
          else if (hp.state === 'hold') { hp.e = 1; if (hp.st >= T_HOLD) { hp.state = 'back'; hp.st = 0; } }
          else if (hp.state === 'back') { hp.e = Math.max(0, 1 - hp.st / T_BACK); if (hp.st >= T_BACK) { hp.state = 'idle'; hp.e = 0; } }
          if (hp.gulp > 0) hp.gulp -= dt;
          if (hp.state === 'out' || hp.state === 'hold') eat(hp, i);
          if (hp.p.isBot) botThink(hp, i, dt);
        });
        // pearls
        pearls.forEach(function (m) {
          // a gentle whirlpool current carries pearls past every corner
          var rx = m.x - C, ry = m.y - C, rd = Math.hypot(rx, ry) || 1;
          m.vx += (-ry / rd) * 55 * dt; m.vy += (rx / rd) * 55 * dt;
          // pearls that linger drift towards the nearest hippo
          if (t - m.born > 14) {
            var hp0 = hippos.reduce(function (a, b) { return Math.hypot(b.bx - m.x, b.by - m.y) < Math.hypot(a.bx - m.x, a.by - m.y) ? b : a; });
            m.vx += (hp0.bx - m.x) * 0.25 * dt; m.vy += (hp0.by - m.y) * 0.25 * dt;
          }
          m.x += m.vx * dt; m.y += m.vy * dt;
          var lo = PAD + 10 + MR, hi = S - PAD - 10 - MR, bounced = false;
          if (m.x < lo) { m.x = lo; m.vx = Math.abs(m.vx); bounced = true; }
          if (m.x > hi) { m.x = hi; m.vx = -Math.abs(m.vx); bounced = true; }
          if (m.y < lo) { m.y = lo; m.vy = Math.abs(m.vy); bounced = true; }
          if (m.y > hi) { m.y = hi; m.vy = -Math.abs(m.vy); bounced = true; }
          if (bounced) { var ja = A.rand(-0.3, 0.3), c = Math.cos(ja), s = Math.sin(ja), vx = m.vx; m.vx = vx * c - m.vy * s; m.vy = vx * s + m.vy * c; }
          // bounce off hippo heads and necks
          hippos.forEach(function (hp) {
            var hd = head(hp), dx = m.x - hd.x, dy = m.y - hd.y, d = Math.hypot(dx, dy), min = HEAD_R + MR;
            if (d < min && d > 0.01 && hp.state !== 'out' && hp.state !== 'hold') {
              var nx = dx / d, ny = dy / d, vn = m.vx * nx + m.vy * ny;
              m.x = hd.x + nx * min; m.y = hd.y + ny * min;
              if (vn < 0) { m.vx -= 2 * vn * nx; m.vy -= 2 * vn * ny; }
            }
          });
          // keep a lively (but capped) speed
          var sp = Math.hypot(m.vx, m.vy), want = 170 + Math.min(80, t * 1.5);
          if (sp < want * 0.8) { m.vx *= 1.02; m.vy *= 1.02; }
          if (sp > want * 1.5) { m.vx *= 0.98; m.vy *= 0.98; }
        });
        fx = fx.filter(function (f) { f.t += dt * 2; return f.t < 1; });
        hud();
        if (spawned >= total && !pearls.length) end();
      }
      function eat(hp, i) {
        var hd = head(hp), mx = hd.x + hp.dx * 18, my = hd.y + hp.dy * 18;
        pearls = pearls.filter(function (m) {
          if (Math.hypot(m.x - mx, m.y - my) < HEAD_R + MR - 4) {
            var pts = m.gold ? 3 : 1;
            scores[i] += pts; hp.gulp = 0.25;
            fx.push({ x: m.x, y: m.y, t: 0, txt: '+' + pts, col: hp.p.color });
            ctx.sfx(m.gold ? 'coin' : 'point');
            return false;
          }
          return true;
        });
      }
      function botThink(hp, i, dt) {
        if (hp.state !== 'idle') return;
        hp.think -= dt;
        if (hp.think > 0) return;
        hp.think = 0.05;
        // would a lunge starting after my reaction time catch a pearl?
        var lead = skill.react + T_OUT * 0.7, full = { x: hp.bx + hp.dx * (REACH0 + REACH + 18), y: hp.by + hp.dy * (REACH0 + REACH + 18) };
        var target = pearls.some(function (m) {
          var px = m.x + m.vx * lead, py = m.y + m.vy * lead;
          return Math.hypot(px - full.x, py - full.y) < HEAD_R + 6;
        });
        if (target) {
          if (Math.random() < skill.miss) { hp.think = 0.35; return; }
          hp.think = skill.react;
          ctx.timeout(function () { chomp(i); }, skill.react * 1000);
        }
      }
      function end() {
        if (ctx.over) return;
        phase = 'done';
        var rows = A.rank(roster, scores).map(function (r) { r.label = r.score + ' pts'; return r; });
        var top = rows.filter(function (r) { return r.place === 1; });
        var humanWon = top.length === 1 && !top[0].player.isBot;
        var recs = [];
        if (cfg.players === 1 && humanWon) recs.push('Wins against CPU hippos: ' + A.store.add('hippos', 'wins'));
        ctx.setStatus('The lagoon is empty!');
        ctx.finish({ title: A.winnerTitle(rows), subtitle: total + ' pearls gobbled.', rows: rows, records: recs, tone: cfg.players === 1 && !humanWon ? 'lose' : 'win' });
      }

      /* -------------------------------------------------------- render */
      function makeWaves() {
        var c = document.createElement('canvas');
        c.width = Math.round(S * view.px); c.height = Math.round(S * view.px);
        var w = c.getContext('2d');
        w.scale(view.px, view.px);
        w.fillStyle = '#557F9A'; w.fillRect(0, 0, S, S);
        w.strokeStyle = '#557F9A'; w.lineWidth = 14; w.lineCap = 'round';
        for (var y = 40; y < S; y += 70) {
          w.beginPath();
          for (var x = -40; x < S + 40; x += 80) { w.moveTo(x, y); w.quadraticCurveTo(x + 20, y - 18, x + 40, y); w.quadraticCurveTo(x + 60, y + 18, x + 80, y); }
          w.stroke();
        }
        w.strokeStyle = O; w.lineWidth = 6; w.strokeRect(PAD + 2, PAD + 2, S - PAD * 2 - 4, S - PAD * 2 - 4);
        // centre spout
        w.fillStyle = '#4C7189'; w.beginPath(); w.arc(C, C, 34, 0, 7); w.fill();
        w.strokeStyle = 'rgba(255,255,255,.35)'; w.lineWidth = 4; w.beginPath(); w.arc(C, C, 22, 0, 7); w.stroke();
        return c;
      }
      function drawHippo(hp) {
        var p = hp.p, hd = head(hp), a = Math.atan2(hp.dy, hp.dx), open = hp.state === 'out' || hp.state === 'hold' ? 1 : hp.state === 'back' ? hp.e : 0;
        // neck
        g.lineCap = 'round';
        g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 62; g.beginPath(); g.moveTo(hp.bx - hp.dx * 40 + 5, hp.by - hp.dy * 40 + 7); g.lineTo(hd.x + 5, hd.y + 7); g.stroke();
        g.strokeStyle = O; g.lineWidth = 60; g.beginPath(); g.moveTo(hp.bx - hp.dx * 40, hp.by - hp.dy * 40); g.lineTo(hd.x, hd.y); g.stroke();
        g.strokeStyle = p.color; g.lineWidth = 52; g.stroke();
        g.save(); g.translate(hd.x, hd.y); g.rotate(a);
        g.lineJoin = 'round'; g.strokeStyle = O; g.lineWidth = 4;
        // ears
        g.fillStyle = p.color;
        [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(-30, s * 30, 9, 11, 0, 0, 7); g.fill(); g.stroke(); });
        // head
        g.beginPath(); g.ellipse(-6, 0, 40, 40, 0, 0, 7); g.fill(); g.stroke();
        // mouth: upper & lower jaw split when open
        var gap = 2 + open * 14;
        g.fillStyle = '#8E3F3A';
        if (open > 0.05) { g.beginPath(); g.ellipse(26, 0, 30, gap + 6, 0, 0, 7); g.fill(); g.stroke(); }
        g.fillStyle = p.color;
        [-1, 1].forEach(function (s) {
          g.beginPath(); g.ellipse(28, s * (gap * 0.9 + 12), 30, 18, 0, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#fff'; g.beginPath(); g.rect(40, s > 0 ? gap * 0.9 - 2 : -gap * 0.9 - 6, 8, 8); g.fill(); g.lineWidth = 2; g.stroke(); g.lineWidth = 4;
          g.fillStyle = p.color;
        });
        // nostrils
        g.fillStyle = O;
        g.beginPath(); g.ellipse(44, -(gap * 0.9 + 16), 3.5, 2.5, 0, 0, 7); g.ellipse(44, gap * 0.9 + 16, 3.5, 2.5, 0, 0, 7); g.fill();
        // eyes
        [-1, 1].forEach(function (s) {
          g.fillStyle = '#fff'; g.beginPath(); g.arc(-8, s * 16, 9, 0, 7); g.fill(); g.lineWidth = 2.5; g.stroke();
          g.fillStyle = O; g.beginPath(); g.arc(-4, s * 15, 4, 0, 7); g.fill();
        });
        g.restore();
        // identity badge on the neck
        var bx = hp.bx + hp.dx * 52, by = hp.by + hp.dy * 52;
        A.drawSymbol(g, p, bx, by, 13, 2.4);
      }
      function render() {
        view.begin();
        if (!waves) waves = makeWaves();
        g.drawImage(waves, 0, 0, S, S);
        pearls.forEach(function (m) {
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(m.x + 2, m.y + 3, MR, 0, 7); g.fill();
          g.fillStyle = m.gold ? '#F0BD5E' : '#fff'; g.beginPath(); g.arc(m.x, m.y, MR, 0, 7); g.fill();
          g.strokeStyle = O; g.lineWidth = 3; g.stroke();
          g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(m.x - 3, m.y - 3, 3, 0, 7); g.fill();
        });
        hippos.forEach(drawHippo);
        g.font = '700 22px ' + getComputedStyle(ctx.stage).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle';
        fx.forEach(function (f) {
          g.globalAlpha = 1 - f.t;
          g.lineWidth = 4; g.strokeStyle = O; g.strokeText(f.txt, f.x, f.y - f.t * 30);
          g.fillStyle = '#fff'; g.fillText(f.txt, f.x, f.y - f.t * 30);
          g.globalAlpha = 1;
        });
        if (phase === 'count') {
          var txt = cd > 2.2 ? 'Ready?' : String(Math.max(1, Math.ceil(cd - 0.4)));
          g.font = '700 64px ' + getComputedStyle(ctx.stage).fontFamily;
          var tw = g.measureText(txt).width + 50;
          g.fillStyle = '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 5;
          g.beginPath(); if (g.roundRect) g.roundRect(C - tw / 2, C - 46, tw, 92, 22); else g.rect(C - tw / 2, C - 46, tw, 92); g.fill(); g.stroke();
          g.fillStyle = O; g.fillText(txt, C, C + 3);
        }
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.onResize = function () { waves = null; };
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Lagoon with hippos in each corner. Tap your corner or press your key to chomp.');
          ctx.listen(view.canvas, 'pointerdown', function (e) {
            e.preventDefault(); A.sound.unlock();
            var p = view.toGame(e), best = -1, bd = Infinity;
            hippos.forEach(function (hp, i) { var d = Math.hypot(p.x - hp.bx, p.y - hp.by); if (d < bd) { bd = d; best = i; } });
            if (best >= 0 && !hippos[best].p.isBot) chomp(best);
          });
          ctx.setStatus('Get ready to chomp!');
          hud();
          ctx.loop(function (dt) { if (dt > 0) update(dt); render(); });
        },
        destroy: function () {}
      };
    }
  });
})();

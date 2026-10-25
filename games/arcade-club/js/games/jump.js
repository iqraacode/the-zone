/* ==========================================================================
   GAME 8 — SUNNY JUMP  (1–3 players, take turns)
   Endless beach runner. Tap / Space to jump (hold for a higher jump).
   Hop sandcastles, crabs and beach balls, dodge low-flying gulls,
   grab golden shells. Score = distance + 10 per shell.
   Forgiving touches: small hitboxes, coyote time and jump buffering.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var LW = 640, LH = 360, GROUND = 292, PX = 120, BODY = 21;
  var GRAV = 2300, JUMP_V = 790, HOLD_T = 0.2;

  function rr(g, x, y, w, hh, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, hh, r); else g.rect(x, y, w, hh); }

  A.register({
    id: 'jump',
    title: 'Sunny Jump',
    tagline: 'Hop sandcastles and crabs on an endless beach run.',
    description: 'Help Sunny run the beach! Jump over castles, crabs and beach balls, duck under gulls by staying low, and grab golden shells.',
    color: '#A9C7D4',
    players: [1, 2, 3],
    cats: ['quick', 'action'],
    modes: { 1: 'High score', 2: 'Take turns', 3: 'Take turns' },
    pausable: true,
    rules: function (cfg) {
      return ['Sunny runs on his own. Jump to clear sandcastles, crabs and bouncing beach balls.',
        'Tap quickly for a small hop, hold for a big jump. Gulls fly low: don’t jump into them!',
        'Grab golden shells for +10 each. Distance adds points too.',
        'The beach gets faster the longer you last. One bump ends the run.',
        cfg.players === 1 ? 'Beat your high score!' : 'Each player gets one run, then the scores are compared.'];
    },
    controls: function () { return [['Space / ↑ / W', 'Jump (hold = higher)'], ['Tap / Click', 'Jump (hold = higher)'], ['Esc', 'Pause']]; },
    best: function () {
      var b = A.store.record('jump', 'best');
      return b === null ? null : 'Beach record: ' + b + ' points';
    },

    create: function (ctx) {
      var cfg = ctx.cfg;
      var roster = A.makeRoster(cfg.players, 0);
      var results = roster.map(function () { return null; });
      var runner = 0, phase = 'ready', t = 0, speed, dist, shells, obstacles, coins, parts, nextObs, nextCoin;
      var me, held = false, buffer = 0, crashT = 0, scroll = 0, sunR = 0;

      var view = A.makeCanvas(ctx, LW, LH, { maxScale: 2.4 });
      var g = view.g;
      var ready = h('div', { class: 'arc-jump-ready' });
      var wrap = h('div', { class: 'arc-jump' }, view.canvas, ready);

      function resetRun() {
        t = 0; speed = 280; dist = 0; shells = 0; obstacles = []; coins = []; parts = [];
        nextObs = 520; nextCoin = 320; buffer = 0; held = false;
        me = { y: GROUND - BODY, vy: 0, onGround: true, coyote: 0, holdT: 0, squash: 0, run: 0 };
      }
      function score() { return Math.floor(dist / 12) + shells * 10; }
      function hud() {
        ctx.setScores(roster.map(function (p, i) { return i === runner && phase === 'run' ? score() : results[i] === null ? 0 : results[i].score; }));
        ctx.setTurn(phase === 'done' ? -1 : runner);
        var st = [['Shells', shells], ['Distance', Math.floor(dist / 12) + 'm']];
        if (cfg.players > 1) st.unshift(['Run', (runner + 1) + '/' + roster.length]);
        ctx.setStats(st);
      }
      function showReady() {
        phase = 'ready';
        resetRun();
        A.clear(ready);
        var p = roster[runner];
        ready.appendChild(h('div', { class: 'arc-jump-card', style: { '--pc': p.color } },
          A.symbolSVG(p, 40),
          h('h3', null, cfg.players === 1 ? 'Ready to run?' : p.name + ', get ready!'),
          h('p', null, A.isTouch() ? 'Tap to jump. Hold for a bigger jump.' : 'Press Space (or tap) to jump. Hold for a bigger jump.'),
          h('button', { type: 'button', class: 'arc-btn arc-btn-primary arc-btn-big', onclick: function () { startRun(); } }, 'Start run')));
        ready.hidden = false;
        ready.querySelector('button').focus({ preventScroll: true });
        ctx.setStatus(cfg.players === 1 ? 'Press Start run when you are ready.' : p.name + "'s run is next.");
        hud();
      }
      function startRun() {
        if (phase !== 'ready' || ctx.over) return;
        A.sound.unlock();
        ready.hidden = true;
        phase = 'run';
        ctx.sfx('go');
        ctx.setStatus((cfg.players === 1 ? '' : roster[runner].name + ' is running! ') + 'Jump with Space or tap.');
        view.canvas.focus({ preventScroll: true });
        hud();
      }

      function spawnObstacle() {
        var hard = A.clamp(t / 40, 0, 1), types = ['castle', 'crab', 'castle'];
        if (t > 8) types.push('ball');
        if (t > 14) types.push('gull');
        if (t > 22) types.push('wide');
        var k = A.pick(types), o = { kind: k, x: LW + 40, t: 0 };
        if (k === 'castle') { o.w = 34; o.h = 42; }
        else if (k === 'wide') { o.w = 72; o.h = 36; }
        else if (k === 'crab') { o.w = 40; o.h = 24; o.extra = 45 + hard * 40; }
        else if (k === 'ball') { o.w = 38; o.h = 38; o.phase = Math.random() * 3; }
        else { o.w = 46; o.h = 22; o.y = GROUND - 128; o.extra = 60; }
        obstacles.push(o);
        var gap = A.rand(speed * 0.85, speed * 1.65) * (1.45 - 0.45 * hard) + o.w;
        nextObs = gap;
        // shells: a little arc between obstacles sometimes
        if (Math.random() < 0.55) {
          var high = Math.random() < 0.5;
          var n = A.randInt(3, 5), start = LW + 40 + gap * 0.45;
          for (var i = 0; i < n; i++) coins.push({ x: start + i * 30, y: high ? GROUND - 120 - Math.sin(i / (n - 1) * Math.PI) * 40 : GROUND - 34, got: false });
        }
      }
      function obsBox(o) {
        if (o.kind === 'ball') { var by = GROUND - o.h - Math.abs(Math.sin(o.t * 4 + o.phase)) * 55; return { x: o.x + 5, y: by + 5, w: o.w - 10, h: o.h - 10 }; }
        if (o.kind === 'gull') return { x: o.x + 6, y: o.y + 4, w: o.w - 12, h: o.h - 8 };
        return { x: o.x + 4, y: GROUND - o.h + 4, w: o.w - 8, h: o.h - 4 };
      }
      function hits(b) {
        // player circle (slightly smaller than drawn) vs box
        var cx = A.clamp(PX, b.x, b.x + b.w), cy = A.clamp(me.y, b.y, b.y + b.h);
        return Math.hypot(PX - cx, me.y - cy) < BODY - 5;
      }

      function update(dt) {
        sunR += dt * 0.3;
        if (phase === 'crash') { crashT -= dt; parts.forEach(function (p) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); if (crashT <= 0) afterRun(); return; }
        if (phase !== 'run') { scroll += 40 * dt; return; }
        t += dt;
        speed = Math.min(640, 280 + t * 9);
        var dx = speed * dt;
        dist += dx; scroll += dx;
        // jump physics
        if (buffer > 0) buffer -= dt;
        if (me.onGround) me.coyote = 0.08; else me.coyote -= dt;
        if (buffer > 0 && me.coyote > 0) { me.vy = -JUMP_V; me.onGround = false; me.coyote = 0; me.holdT = 0; buffer = 0; me.squash = -0.25; ctx.sfx('jump'); }
        var gmul = 1;
        if (!me.onGround && me.vy < 0 && held && me.holdT < HOLD_T) { gmul = 0.42; me.holdT += dt; }
        if (!me.onGround && me.vy < 0 && !held) gmul = 1.6; // short hop when released early
        me.vy += GRAV * gmul * dt;
        me.y += me.vy * dt;
        if (me.y >= GROUND - BODY) { if (!me.onGround) me.squash = 0.3; me.y = GROUND - BODY; me.vy = 0; me.onGround = true; }
        me.squash *= Math.pow(0.0001, dt);
        me.run += dt * speed / 40;
        // world
        nextObs -= dx;
        if (nextObs <= 0) spawnObstacle();
        obstacles.forEach(function (o) { o.t += dt; o.x -= dx + (o.extra || 0) * dt; });
        obstacles = obstacles.filter(function (o) { return o.x > -100; });
        coins.forEach(function (c) { c.x -= dx; if (!c.got && Math.hypot(c.x - PX, c.y - me.y) < BODY + 9) { c.got = true; shells++; ctx.sfx('coin'); parts.push({ x: c.x, y: c.y, vx: 0, vy: -80, life: 0.5, kind: 'plus' }); } });
        coins = coins.filter(function (c) { return c.x > -30 && !c.got; });
        parts = parts.filter(function (p) { p.life -= dt; p.y += p.vy * dt; return p.life > 0; });
        for (var i = 0; i < obstacles.length; i++) if (hits(obsBox(obstacles[i]))) return crash();
        hud();
      }
      function crash() {
        phase = 'crash'; crashT = 1.1;
        ctx.sfx('crash');
        for (var i = 0; i < 12; i++) parts.push({ x: PX, y: me.y, vx: A.rand(-220, 220), vy: A.rand(-420, -120), life: 2, kind: 'star', c: A.pick(['#F0BD5E', '#E26D5C', '#fff']) });
        results[runner] = { score: score(), shells: shells, dist: Math.floor(dist / 12) };
        ctx.setStatus('Bonk! ' + roster[runner].name + ' scored ' + score() + '.');
        hud();
      }
      function afterRun() {
        if (runner < roster.length - 1) { runner++; showReady(); return; }
        phase = 'done';
        var recs = [], top = Math.max.apply(null, results.map(function (r) { return r.score; }));
        var rec = A.store.submit('jump', 'best', top, 'high');
        if (rec.isNew && rec.prev !== null) recs.push('New beach record: ' + top + '!');
        if (cfg.players === 1) {
          var r = results[0];
          ctx.finish({
            title: rec.isNew && rec.prev !== null ? 'New high score!' : 'Nice run!', subtitle: 'You scored ' + r.score + ' points.',
            stats: [['Score', r.score], ['Distance', r.dist + 'm'], ['Shells', r.shells], ['Record', A.store.record('jump', 'best')]], records: recs
          });
        } else {
          var rows = A.rank(roster, results.map(function (r) { return r.score; })).map(function (x) {
            var r = results[x.player.index]; x.label = x.score + ' pts · ' + r.dist + 'm · ' + r.shells + ' shells'; return x;
          });
          ctx.finish({ title: A.winnerTitle(rows), subtitle: 'Everyone had one run on the beach.', rows: rows, records: recs });
        }
      }

      /* ---------------------------------------------------------- render */
      function render() {
        view.begin();
        // sky
        g.fillStyle = '#A9C7D4'; g.fillRect(0, 0, LW, LH);
        // sun
        g.save(); g.translate(560, 62); g.rotate(sunR);
        g.fillStyle = '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 3;
        g.beginPath(); for (var k = 0; k < 20; k++) { var a = k * Math.PI / 10, r = k % 2 ? 30 : 42; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
        g.restore();
        g.fillStyle = '#F6D58E'; g.beginPath(); g.arc(560, 62, 24, 0, 7); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
        // clouds (parallax)
        g.fillStyle = '#fff';
        [[60, 60, 1], [300, 40, 0.8], [470, 110, 0.7]].forEach(function (c) {
          var x = ((c[0] - scroll * 0.08 * c[2]) % (LW + 160) + LW + 160) % (LW + 160) - 80;
          g.beginPath(); g.ellipse(x, c[1], 34 * c[2], 13 * c[2], 0, 0, 7); g.ellipse(x + 20 * c[2], c[1] - 8 * c[2], 22 * c[2], 13 * c[2], 0, 0, 7); g.fill();
        });
        // sea
        g.fillStyle = '#6F9FB8'; g.fillRect(0, 196, LW, 70);
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.lineCap = 'round';
        for (var row = 0; row < 2; row++) {
          var off = (scroll * (0.25 + row * 0.15)) % 60;
          g.beginPath();
          for (var x = -off; x < LW + 60; x += 60) { g.moveTo(x, 214 + row * 24); g.quadraticCurveTo(x + 15, 206 + row * 24, x + 30, 214 + row * 24); }
          g.stroke();
        }
        // far palms
        for (var pi = 0; pi < 4; pi++) {
          var px = ((pi * 210 - scroll * 0.45) % 840 + 840) % 840 - 60;
          drawPalm(px, 262);
        }
        // sand
        g.fillStyle = '#F4CE7A'; g.fillRect(0, 252, LW, LH - 252);
        g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 252); g.lineTo(LW, 252); g.stroke();
        g.fillStyle = '#E8B95C'; g.fillRect(0, GROUND, LW, LH - GROUND);
        g.beginPath(); g.moveTo(0, GROUND); g.lineTo(LW, GROUND); g.stroke();
        g.fillStyle = 'rgba(185,130,26,.45)';
        for (var d = 0; d < 26; d++) { var sx = ((d * 53 - scroll) % LW + LW) % LW; g.beginPath(); g.arc(sx, GROUND + 14 + (d * 17) % 50, 2.2, 0, 7); g.fill(); }
        // shells
        coins.forEach(function (c) { drawShell(c.x, c.y); });
        // obstacles
        obstacles.forEach(drawObstacle);
        // player
        if (phase !== 'crash' || Math.floor(crashT * 10) % 2) drawSunny();
        // particles
        parts.forEach(function (p) {
          if (p.kind === 'plus') { g.font = '700 16px ' + getComputedStyle(ctx.stage).fontFamily; g.fillStyle = O; g.textAlign = 'center'; g.fillText('+10', p.x, p.y); }
          else { g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 4, 0, 7); g.fill(); }
        });
        // live score
        if (phase === 'run' || phase === 'crash') {
          g.font = '700 26px ' + getComputedStyle(ctx.stage).fontFamily; g.textAlign = 'left'; g.textBaseline = 'top';
          g.lineWidth = 5; g.strokeStyle = O; g.strokeText(String(score()), 16, 14); g.fillStyle = '#fff'; g.fillText(String(score()), 16, 14);
        }
      }
      function drawPalm(x, y) {
        g.strokeStyle = O; g.lineWidth = 7; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 6, y - 40, x + 6, y - 74); g.stroke();
        g.strokeStyle = '#B5713C'; g.lineWidth = 3.5; g.stroke();
        g.fillStyle = '#7D9A5C'; g.strokeStyle = O; g.lineWidth = 2.5;
        [[-34, -6], [34, -4], [-24, 14], [26, 16]].forEach(function (l) {
          g.beginPath(); g.moveTo(x + 6, y - 74); g.quadraticCurveTo(x + 6 + l[0] * 0.5, y - 92 + l[1] * 0.3, x + 6 + l[0], y - 74 + l[1]); g.quadraticCurveTo(x + 6 + l[0] * 0.5, y - 80 + l[1] * 0.5, x + 6, y - 74); g.fill(); g.stroke();
        });
      }
      function drawShell(x, y) {
        g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(x + 2, y + 3, 9, 0, 7); g.fill();
        g.fillStyle = '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(x, y + 9); g.lineTo(x - 10, y - 2); g.quadraticCurveTo(x, y - 14, x + 10, y - 2); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = '#B9821A'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x, y - 9); g.moveTo(x, y + 8); g.lineTo(x - 5, y - 6); g.moveTo(x, y + 8); g.lineTo(x + 5, y - 6); g.stroke();
      }
      function drawObstacle(o) {
        var b = obsBox(o);
        g.lineJoin = 'round'; g.strokeStyle = O; g.lineWidth = 3;
        if (o.kind === 'castle' || o.kind === 'wide') {
          var x = o.x, y = GROUND - o.h, w = o.w;
          g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 4, y + 4, w, o.h);
          g.fillStyle = '#E8A94A';
          g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x, y + 8); var step = w / 4;
          for (var i = 0; i < 4; i++) { g.lineTo(x + i * step, y); g.lineTo(x + i * step + step * 0.5, y); g.lineTo(x + i * step + step * 0.5, y + 8); g.lineTo(x + (i + 1) * step, y + 8); }
          g.lineTo(x + w, GROUND); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = O; rr(g, x + w / 2 - 5, GROUND - 16, 10, 16, 5); g.fill();
          g.strokeStyle = O; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y - 14); g.stroke();
          g.fillStyle = '#E26D5C'; g.beginPath(); g.moveTo(x + w / 2, y - 14); g.lineTo(x + w / 2 + 12, y - 10); g.lineTo(x + w / 2, y - 6); g.closePath(); g.fill(); g.lineWidth = 1.8; g.stroke();
        } else if (o.kind === 'crab') {
          var cx = o.x + o.w / 2, cy = GROUND - 12, leg = Math.sin(o.t * 22) * 3;
          g.strokeStyle = O; g.lineWidth = 2.5; g.beginPath();
          for (var l = -1; l <= 1; l += 2) for (var j = 0; j < 3; j++) { g.moveTo(cx + l * (6 + j * 5), cy + 4); g.lineTo(cx + l * (12 + j * 5), GROUND + (j % 2 ? leg : -leg)); }
          g.stroke();
          g.fillStyle = '#C8574A'; g.lineWidth = 3;
          g.beginPath(); g.ellipse(cx, cy, 18, 11, 0, 0, 7); g.fill(); g.stroke();
          g.beginPath(); g.arc(cx - 20, cy - 10, 6, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(cx + 20, cy - 10, 6, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 6, cy - 12, 4, 0, 7); g.arc(cx + 6, cy - 12, 4, 0, 7); g.fill(); g.lineWidth = 2; g.stroke();
          g.fillStyle = O; g.beginPath(); g.arc(cx - 7, cy - 12, 1.8, 0, 7); g.arc(cx + 5, cy - 12, 1.8, 0, 7); g.fill();
        } else if (o.kind === 'ball') {
          var bx = b.x + b.w / 2, by = b.y + b.h / 2, r = o.h / 2;
          g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(bx, GROUND + 2, r * 0.8, 4, 0, 0, 7); g.fill();
          g.save(); g.translate(bx, by); g.rotate(-o.t * 6);
          var cols = ['#E26D5C', '#fff', '#6F9FB8', '#fff', '#F0BD5E', '#fff'];
          for (var s = 0; s < 6; s++) { g.fillStyle = cols[s]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, s * Math.PI / 3, (s + 1) * Math.PI / 3); g.closePath(); g.fill(); }
          g.beginPath(); g.arc(0, 0, r, 0, 7); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
          g.restore();
        } else {
          var gx = o.x + o.w / 2, gy = o.y + o.h / 2, flap = Math.sin(o.t * 14) * 9;
          g.fillStyle = '#fff'; g.strokeStyle = O; g.lineWidth = 2.6;
          g.beginPath(); g.moveTo(gx - 4, gy); g.quadraticCurveTo(gx - 16, gy - 10 - flap, gx - 26, gy - 4 - flap); g.quadraticCurveTo(gx - 14, gy - 2, gx - 4, gy + 2); g.fill(); g.stroke();
          g.beginPath(); g.ellipse(gx, gy + 2, 15, 8, 0, 0, 7); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(gx + 4, gy); g.quadraticCurveTo(gx + 16, gy - 10 - flap, gx + 26, gy - 4 - flap); g.quadraticCurveTo(gx + 14, gy - 2, gx + 4, gy + 2); g.fill(); g.stroke();
          g.fillStyle = '#F0BD5E'; g.beginPath(); g.moveTo(gx - 14, gy); g.lineTo(gx - 22, gy + 3); g.lineTo(gx - 14, gy + 5); g.closePath(); g.fill(); g.lineWidth = 1.8; g.stroke();
          g.fillStyle = O; g.beginPath(); g.arc(gx - 9, gy - 1, 1.8, 0, 7); g.fill();
        }
      }
      function drawSunny() {
        var y = me.y, sq = me.squash, p = roster[runner];
        // shadow
        var hgt = GROUND - BODY - y;
        g.fillStyle = 'rgba(0,0,0,' + (0.22 - Math.min(0.15, hgt / 800)) + ')';
        g.beginPath(); g.ellipse(PX, GROUND + 2, BODY * (1 - Math.min(0.5, hgt / 300)), 5, 0, 0, 7); g.fill();
        g.save(); g.translate(PX, y);
        g.scale(1 + sq * 0.5, 1 - sq * 0.5);
        // feet
        g.strokeStyle = O; g.lineWidth = 4; g.lineCap = 'round';
        var step = me.onGround ? Math.sin(me.run) * 6 : 3;
        g.beginPath(); g.moveTo(-7, BODY - 4); g.lineTo(-7 + step, BODY + 6); g.moveTo(7, BODY - 4); g.lineTo(7 - step, BODY + 6); g.stroke();
        // body
        g.fillStyle = '#F0BD5E'; g.lineWidth = 3.2;
        g.beginPath(); g.arc(0, 0, BODY, 0, 7); g.fill(); g.stroke();
        // cheek
        g.fillStyle = '#E9A194'; g.beginPath(); g.arc(10, 7, 4, 0, 7); g.fill();
        // sunglasses
        g.fillStyle = O; rr(g, -3, -6, 11, 8, 3); g.fill(); rr(g, 10, -6, 10, 8, 3); g.fill();
        g.fillRect(-12, -4, 10, 2.5);
        g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, -4, 3, 2); g.fillRect(12, -4, 3, 2);
        // smile
        g.strokeStyle = O; g.lineWidth = 2.2; g.beginPath(); g.arc(9, 7, 5, 0.2, Math.PI - 0.6); g.stroke();
        // hat in the runner's colour
        g.fillStyle = p.color; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-16, -12); g.quadraticCurveTo(0, -36, 16, -12); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(-24, -12); g.lineTo(26, -12); g.stroke();
        g.restore();
        A.drawSymbol(g, p, PX - 1, y - 21, 5, 1.4);
      }

      /* ----------------------------------------------------------- input */
      function press() {
        if (phase === 'ready') return;
        if (phase !== 'run' || ctx.paused) return;
        held = true; buffer = 0.12;
      }
      function release() { held = false; }
      function onKey(e, down) {
        if (['Space', 'ArrowUp', 'KeyW'].indexOf(e.code) < 0) return;
        if (ctx.shell.overlay) return;
        if (phase === 'ready') { if (down && e.code === 'Space' && document.activeElement && document.activeElement.tagName === 'BUTTON') return; if (down && !e.repeat) { e.preventDefault(); startRun(); } return; }
        e.preventDefault();
        if (down && !e.repeat) press(); else if (!down) release();
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.resize();
          view.canvas.setAttribute('tabindex', '-1');
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Beach runner. Press Space to jump.');
          ctx.listen(window, 'keydown', function (e) { onKey(e, true); });
          ctx.listen(window, 'keyup', function (e) { onKey(e, false); });
          ctx.listen(view.canvas, 'pointerdown', function (e) { e.preventDefault(); A.sound.unlock(); if (phase === 'ready') startRun(); else press(); });
          ctx.listen(window, 'pointerup', release);
          ctx.listen(window, 'pointercancel', release);
          showReady();
          ctx.loop(function (dt) { if (dt > 0) update(dt); render(); });
        },
        pause: function () { held = false; buffer = 0; },
        destroy: function () {}
      };
    }
  });
})();

/* ==========================================================================
   GAME 10 — SKEWER SPIN  (1–3 players)
   A tiki log spins in the middle. Throw skewers into it.
   Hit a skewer that's already stuck and yours bounces off.
   Solo: clear level after level; one bounce ends the run.
   2–3 players: everyone throws from their own side at once for 45 s.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var S = 600, C = 300, TR = 104, SK = 92, GAP = 0.15, FLY = 1600;
  // throw positions for players 1–3 (bottom, top, left)
  var SEATS = [{ x: C, y: S - 34 }, { x: C, y: 34 }, { x: 34, y: C }];

  function angDiff(a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); }

  A.register({
    id: 'skewer',
    title: 'Skewer Spin',
    tagline: 'Stick skewers in a spinning log without hitting the others.',
    description: 'Time your throws into a spinning tiki log. Hit the fruit for bonus points, but never hit another skewer!',
    color: '#9C766E',
    ink: '#FBF6EF',
    players: [1, 2, 3],
    cats: ['quick', 'action'],
    modes: { 1: 'Level challenge', 2: 'Throw-off', 3: 'Throw-off' },
    pausable: true,
    rules: function (cfg) {
      if (cfg.players === 1) return ['Throw all your skewers into the spinning log to clear the level.',
        'Hit a fruit on the edge for +3. Each skewer that sticks is +1, each cleared level +5.',
        'If your skewer hits one that is already stuck, the run is over.', 'The log spins faster (and changes direction) as you go.'];
      return ['Everyone throws from their own side at the same time.', 'A skewer that sticks scores +1; spearing a fruit scores +3.',
        'Hit a skewer that is already stuck and you lose 2 points and wobble for a second.', 'When the log is full it pops clean. Highest score after 45 seconds wins.'];
    },
    controls: function (cfg) {
      var c = [];
      if (cfg.players === 1) { c.push(['Space / Q', 'Throw']); c.push(['Tap', 'Throw (anywhere on the board)']); }
      else for (var i = 0; i < cfg.players; i++) c.push([A.BUZZ_KEYS[i].label, 'Player ' + (i + 1) + ' throws']);
      c.push(['Esc', 'Pause']);
      return c;
    },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var s = A.store.record('skewer', 'best'), l = A.store.record('skewer', 'level');
      return s === null ? null : 'Best run: ' + s + ' points (level ' + l + ')';
    },

    create: function (ctx) {
      var cfg = ctx.cfg, solo = cfg.players === 1;
      var roster = A.makeRoster(cfg.players, 0);
      var scores = roster.map(function () { return 0; });
      var stuck = [], fruits = [], flying = [], falling = [], parts = [];
      var rot = 0, w = 1.5, t = 0, dirT = 5, level = 1, left = 0, timeLeft = 45, phase = 'count', cd = 2.4, lastBeep = 4, banner = '', bannerT = 0;
      var throwers = roster.map(function () { return { ready: 0, stun: 0, wob: 0 }; });
      var stats = { stuck: 0, fruit: 0, bounced: 0 };

      var view = A.makeCanvas(ctx, S, S, { reserve: function () { return buzz.el.offsetHeight + 12; } });
      var g = view.g;
      var buzz = A.buzzers(ctx, roster, function (i) { throwSkewer(i); }, { action: 'throw' });
      var wrap = h('div', { class: 'arc-skewer' }, view.canvas, buzz.el);

      function seat(i) { return solo ? SEATS[0] : SEATS[i]; }
      // where a waiting skewer's tip sits (pulled back a little while reloading)
      function readyTip(i, back) {
        var s = seat(i), a = Math.atan2(s.y - C, s.x - C);
        return { x: s.x - Math.cos(a) * (SK - 24 - back), y: s.y - Math.sin(a) * (SK - 24 - back), a: a };
      }
      function freeAngle(minGap) {
        for (var k = 0; k < 60; k++) {
          var a = Math.random() * Math.PI * 2;
          if (stuck.every(function (s) { return angDiff(a, s.a) > minGap; }) && fruits.every(function (f) { return angDiff(a, f.a) > 0.5; })) return a;
        }
        return Math.random() * Math.PI * 2;
      }
      function setupLevel() {
        stuck = []; fruits = []; flying = [];
        if (solo) {
          left = Math.min(13, 5 + level);
          for (var k = 0; k < Math.min(level - 1, 5); k++) stuck.push({ a: freeAngle(0.6), owner: -1 });
          for (k = 0; k < 1 + (level % 3); k++) fruits.push({ a: freeAngle(0.5), kind: k % 2 });
          w = (1.3 + level * 0.14) * (Math.random() < 0.5 ? 1 : -1);
        } else {
          for (k = 0; k < 3; k++) fruits.push({ a: freeAngle(0.5), kind: k % 2 });
          w = 1.6;
        }
        hud();
      }
      function hud() {
        ctx.setScores(scores);
        ctx.setTurn(-1);
        if (solo) ctx.setStats([['Level', level], ['Skewers left', left]]);
        else ctx.setStats([['Time', Math.max(0, Math.ceil(timeLeft)) + 's']]);
      }
      function throwSkewer(i) {
        if (phase !== 'play' || ctx.paused || ctx.over) return;
        var th = throwers[i];
        if (th.ready > 0 || th.stun > 0) return;
        if (solo && (left <= 0 || flying.length)) return;
        var tip = readyTip(i, 0);
        flying.push({ owner: i, x: tip.x, y: tip.y, dx: (C - tip.x) / Math.hypot(C - tip.x, C - tip.y), dy: (C - tip.y) / Math.hypot(C - tip.x, C - tip.y) });
        th.ready = solo ? 0.12 : 0.28;
        if (solo) left--;
        ctx.sfx('jump');
        hud();
      }
      function land(f) {
        var world = Math.atan2(-f.dy, -f.dx);          // direction from centre towards thrower
        var local = world - rot;
        var hit = stuck.some(function (s) { return angDiff(local, s.a) < GAP; });
        if (hit) {
          stats.bounced++;
          falling.push({ x: C + Math.cos(world) * (TR + SK / 2), y: C + Math.sin(world) * (TR + SK / 2), a: world, vx: A.rand(-120, 120), vy: -260, va: A.rand(-12, 12), owner: f.owner, t: 0 });
          ctx.sfx('crash');
          if (solo) { phase = 'fail'; ctx.timeout(end, 1100); ctx.setStatus('Clang! You hit a skewer.'); return; }
          scores[f.owner] = Math.max(0, scores[f.owner] - 2); throwers[f.owner].stun = 1.0;
          buzz.flash(roster[f.owner].index, 'is-bad', '−2 clang!');
          hud(); return;
        }
        stuck.push({ a: local, owner: f.owner, wob: 1 });
        stats.stuck++;
        var pts = 1;
        fruits = fruits.filter(function (fr) {
          if (angDiff(local, fr.a) < 0.24) {
            pts += 3; stats.fruit++;
            for (var k = 0; k < 10; k++) parts.push({ x: C + Math.cos(world) * TR, y: C + Math.sin(world) * TR, vx: A.rand(-200, 200), vy: A.rand(-260, 60), t: 0, c: fr.kind ? '#D4A373' : '#C8574A' });
            return false;
          }
          return true;
        });
        scores[f.owner] += pts;
        ctx.sfx(pts > 1 ? 'coin' : 'place');
        if (!solo) {
          buzz.flash(roster[f.owner].index, 'is-good', '+' + pts);
          while (fruits.length < 3) fruits.push({ a: freeAngle(0.4), kind: Math.random() < 0.5 ? 1 : 0 });
          if (stuck.length >= 18) { popLog(); }
        } else if (left <= 0) {
          scores[0] += 5;
          phase = 'clear';
          popLog();
          banner = 'Level ' + level + ' cleared!'; bannerT = 1.2;
          ctx.sfx('match');
          ctx.timeout(function () { if (ctx.over) return; level++; setupLevel(); phase = 'play'; ctx.setStatus('Level ' + level + ': ' + left + ' skewers.'); }, 1200);
        }
        hud();
      }
      function popLog() {
        for (var k = 0; k < 18; k++) { var a = Math.random() * Math.PI * 2; parts.push({ x: C + Math.cos(a) * TR * 0.6, y: C + Math.sin(a) * TR * 0.6, vx: Math.cos(a) * A.rand(120, 320), vy: Math.sin(a) * A.rand(120, 320) - 80, t: 0, c: k % 2 ? '#C98048' : '#E8B378' }); }
        stuck.forEach(function (s) { falling.push({ x: C + Math.cos(s.a + rot) * (TR + SK / 2), y: C + Math.sin(s.a + rot) * (TR + SK / 2), a: s.a + rot, vx: A.rand(-150, 150), vy: -200, va: A.rand(-8, 8), owner: s.owner, t: 0 }); });
        stuck = [];
        if (!solo) ctx.sfx('match');
      }

      function update(dt) {
        t += dt;
        if (bannerT > 0) bannerT -= dt;
        falling = falling.filter(function (f) { f.t += dt; f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.va * dt; return f.t < 1.6; });
        parts = parts.filter(function (p) { p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.t < 1; });
        if (phase === 'count') {
          cd -= dt;
          var n = Math.ceil(cd - 0.4);
          if (n < lastBeep && n >= 1) { lastBeep = n; ctx.sfx('beep'); }
          if (cd <= 0.4) { phase = 'play'; ctx.sfx('go'); ctx.setStatus(solo ? 'Level 1: ' + left + ' skewers. Press Space or tap to throw.' : roster.map(function (p, k) { return p.short + ': ' + A.buzzKeyFor(roster, k).label; }).join(' · ')); }
        }
        // spin with gentle speed changes and the odd reversal
        dirT -= dt;
        if (dirT <= 0 && (!solo || level >= 3)) { w = -w; dirT = A.rand(3, 6); }
        var wobble = 1 + 0.45 * Math.sin(t * 1.3);
        rot += w * wobble * dt;
        stuck.forEach(function (s) { if (s.wob) s.wob = Math.max(0, s.wob - dt * 4); });
        throwers.forEach(function (th) { th.ready = Math.max(0, th.ready - dt); th.stun = Math.max(0, th.stun - dt); });
        flying = flying.filter(function (f) {
          f.x += f.dx * FLY * dt; f.y += f.dy * FLY * dt;
          if (Math.hypot(f.x - C, f.y - C) <= TR) { land(f); return false; }
          return true;
        });
        if (!solo && phase === 'play') {
          timeLeft -= dt;
          hud();
          if (timeLeft <= 0) { phase = 'done'; end(); }
        }
      }
      function end() {
        if (ctx.over) return;
        if (solo) {
          var r = A.store.submit('skewer', 'best', scores[0], 'high');
          var rl = A.store.submit('skewer', 'level', level, 'high');
          var recs = [];
          if (r.isNew && r.prev !== null) recs.push('New best score!');
          if (rl.isNew && rl.prev !== null) recs.push('New furthest level!');
          ctx.finish({ title: 'Run over!', subtitle: 'You reached level ' + level + '.', stats: [['Score', scores[0]], ['Level', level], ['Fruit speared', stats.fruit], ['Best', A.store.record('skewer', 'best')]], records: recs, tone: 'win' });
        } else {
          var rows = A.rank(roster, scores).map(function (x) { x.label = x.score + ' pts'; return x; });
          ctx.finish({ title: A.winnerTitle(rows), subtitle: '45 seconds of skewer chaos.', rows: rows, stats: [['Skewers stuck', stats.stuck], ['Fruit speared', stats.fruit], ['Clangs', stats.bounced]] });
        }
      }

      /* ---------------------------------------------------------- render */
      function drawSkewer(x, y, a, owner, alpha) {
        g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = alpha === undefined ? 1 : alpha;
        // a points from tip (at 0) outward along +x
        g.lineCap = 'round'; g.strokeStyle = O; g.lineWidth = 9; g.beginPath(); g.moveTo(4, 0); g.lineTo(SK, 0); g.stroke();
        g.strokeStyle = '#E8C48A'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(4, 0); g.lineTo(SK, 0); g.stroke();
        g.fillStyle = '#DDE3EE'; g.strokeStyle = O; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-6, 0); g.lineTo(10, -5); g.lineTo(10, 5); g.closePath(); g.fill(); g.stroke();
        var col = owner >= 0 ? roster[owner].color : '#8F857C';
        g.fillStyle = col; g.lineWidth = 3; g.beginPath(); if (g.roundRect) g.roundRect(SK - 34, -7, 34, 14, 6); else g.rect(SK - 34, -7, 34, 14); g.fill(); g.stroke();
        g.restore();
        if (owner >= 0) A.drawSymbol(g, roster[owner], x + Math.cos(a) * (SK - 17), y + Math.sin(a) * (SK - 17), 5, 1.2);
      }
      function drawFruit(fr) {
        var a = fr.a + rot, x = C + Math.cos(a) * (TR + 10), y = C + Math.sin(a) * (TR + 10);
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
        g.strokeStyle = O; g.lineWidth = 3;
        if (fr.kind) { g.fillStyle = '#D4A373'; g.beginPath(); g.arc(0, -6, 15, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#8FA968'; g.beginPath(); g.ellipse(6, -22, 7, 4, 0.5, 0, 7); g.fill(); g.lineWidth = 2; g.stroke(); }
        else {
          g.fillStyle = '#C8574A'; g.beginPath(); g.moveTo(0, 10); g.quadraticCurveTo(-18, -2, -12, -16); g.quadraticCurveTo(0, -22, 12, -16); g.quadraticCurveTo(18, -2, 0, 10); g.fill(); g.stroke();
          g.fillStyle = '#8FA968'; g.beginPath(); g.moveTo(-10, -16); g.lineTo(0, -26); g.lineTo(10, -16); g.closePath(); g.fill(); g.lineWidth = 2; g.stroke();
          g.fillStyle = '#F6D58E'; [[-5, -6], [5, -6], [0, 2], [-6, -12], [6, -12]].forEach(function (s) { g.beginPath(); g.arc(s[0], s[1], 1.6, 0, 7); g.fill(); });
        }
        g.restore();
      }
      function render() {
        view.begin();
        g.fillStyle = '#8A6676'; g.fillRect(0, 0, S, S);
        g.fillStyle = '#946F80'; g.beginPath(); g.ellipse(C, C, 270, 230, 0.3, 0, 7); g.fill();
        // log
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(C + 6, C + 9, TR + 6, 0, 7); g.fill();
        g.save(); g.translate(C, C); g.rotate(rot);
        g.fillStyle = '#6B3B22'; g.beginPath(); g.arc(0, 0, TR + 6, 0, 7); g.fill(); g.strokeStyle = O; g.lineWidth = 5; g.stroke();
        g.fillStyle = '#C98048'; g.beginPath(); g.arc(0, 0, TR - 8, 0, 7); g.fill();
        g.strokeStyle = 'rgba(107,59,34,.45)'; g.lineWidth = 3;
        [72, 50, 28].forEach(function (r) { g.beginPath(); g.arc(4, 2, r, 0, 7); g.stroke(); });
        g.fillStyle = '#6B3B22'; g.beginPath(); g.arc(4, 2, 7, 0, 7); g.fill();
        // tiki face so you can see it spin
        g.fillStyle = 'rgba(70,35,18,.55)';
        g.beginPath(); g.ellipse(-26, -20, 10, 14, 0, 0, 7); g.ellipse(30, -20, 10, 14, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(2, 34, 26, 10, 0, 0, 7); g.fill();
        g.restore();
        fruits.forEach(drawFruit);
        stuck.forEach(function (s) {
          var a = s.a + rot, jig = s.wob ? Math.sin(t * 60) * s.wob * 0.06 : 0;
          drawSkewer(C + Math.cos(a) * TR, C + Math.sin(a) * TR, a + jig, s.owner);
        });
        flying.forEach(function (f) { drawSkewer(f.x, f.y, Math.atan2(-f.dy, -f.dx), f.owner); });
        falling.forEach(function (f) { drawSkewer(f.x, f.y, f.a, f.owner, Math.max(0, 1 - f.t / 1.6)); });
        parts.forEach(function (p) { g.fillStyle = p.c; g.globalAlpha = 1 - p.t; g.beginPath(); g.arc(p.x, p.y, 5, 0, 7); g.fill(); g.globalAlpha = 1; });
        // ready skewers at each seat
        roster.forEach(function (p, i) {
          var th = throwers[i];
          if (solo && (left <= 0 || flying.length || phase !== 'play')) return;
          var tip = readyTip(i, th.ready > 0 ? 18 : 0), wob = th.stun > 0 ? Math.sin(t * 40) * 0.25 : 0;
          drawSkewer(tip.x, tip.y, tip.a + wob, i, th.stun > 0 ? 0.5 : 1);
        });
        // solo: remaining skewers
        if (solo) {
          for (var k = 0; k < left; k++) {
            g.fillStyle = k === left - 1 ? '#F0BD5E' : 'rgba(255,246,228,.85)'; g.strokeStyle = O; g.lineWidth = 2;
            g.beginPath(); if (g.roundRect) g.roundRect(18, S - 40 - k * 20, 40, 10, 5); else g.rect(18, S - 40 - k * 20, 40, 10); g.fill(); g.stroke();
          }
        }
        var txt = phase === 'count' ? (cd > 2 ? 'Ready?' : String(Math.max(1, Math.ceil(cd - 0.4)))) : bannerT > 0 ? banner : '';
        if (txt) {
          g.font = '700 ' + (txt.length > 4 ? 36 : 60) + 'px ' + getComputedStyle(ctx.stage).fontFamily;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          var tw = g.measureText(txt).width + 44;
          g.fillStyle = '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 5;
          g.beginPath(); if (g.roundRect) g.roundRect(C - tw / 2, C - 40, tw, 80, 20); else g.rect(C - tw / 2, C - 40, tw, 80); g.fill(); g.stroke();
          g.fillStyle = O; g.fillText(txt, C, C + 3);
        }
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Spinning log target. Press your key to throw a skewer.');
          if (solo) ctx.listen(view.canvas, 'pointerdown', function (e) { e.preventDefault(); A.sound.unlock(); throwSkewer(0); });
          setupLevel();
          ctx.setStatus('Get ready to throw!');
          ctx.loop(function (dt) { if (dt > 0) update(dt); render(); });
        },
        destroy: function () {}
      };
    }
  });
})();

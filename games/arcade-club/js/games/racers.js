/* ==========================================================================
   GAME 5 — TINY RACERS  (1–3 local players + CPU racers)
   Top-down arcade racing on a seaside loop. Walls keep you on the road,
   laps are counted by progress along the track (no shortcuts possible),
   CPUs follow the racing line and brake for corners.
   Keyboard: P1 WASD · P2 Arrows · P3 IJKL.  Touch: auto-gas, ◀ ▶ to steer.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var LW = 960, LH = 600, HALF = 46, CAR_R = 12, N = 420;
  var CTRL = [[310, 96], [500, 84], [800, 112], [884, 296], [800, 478], [580, 510], [500, 362], [320, 352], [252, 502], [112, 474], [74, 292], [150, 118]];
  var ACC = 430, BRAKE = 650, REV = 190, DRAG = 0.55, MAXS = 305, GRIP = 7.5, TURN = 3.2;
  var KEYS = [
    { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', label: 'W A S D' },
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', label: 'Arrow keys' },
    { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', label: 'I J K L' }
  ];

  /* ------------------------------------------------------------- track */
  var TRACK = (function () {
    var dense = [], n = CTRL.length, i, s;
    for (i = 0; i < n; i++) {
      var p0 = CTRL[(i - 1 + n) % n], p1 = CTRL[i], p2 = CTRL[(i + 1) % n], p3 = CTRL[(i + 2) % n];
      for (s = 0; s < 40; s++) {
        var t = s / 40, t2 = t * t, t3 = t2 * t;
        dense.push([0, 1].map(function (k) {
          return 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        }));
      }
    }
    var cum = [0];
    for (i = 1; i <= dense.length; i++) {
      var a = dense[i - 1], b = dense[i % dense.length];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    var total = cum[cum.length - 1], pts = [], j = 0;
    for (i = 0; i < N; i++) {
      var target = i * total / N;
      while (cum[j + 1] < target) j++;
      var f = (target - cum[j]) / (cum[j + 1] - cum[j]);
      var A0 = dense[j], B0 = dense[(j + 1) % dense.length];
      pts.push({ x: A0[0] + (B0[0] - A0[0]) * f, y: A0[1] + (B0[1] - A0[1]) * f });
    }
    pts.forEach(function (p, k) {
      var nx = pts[(k + 1) % N], pv = pts[(k - 1 + N) % N];
      p.ang = Math.atan2(nx.y - pv.y, nx.x - pv.x);
      p.nx = -Math.sin(p.ang); p.ny = Math.cos(p.ang);   // left-hand normal
    });
    return { pts: pts, length: total };
  })();

  function wrapAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function wrapIdx(d) { if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; }
  function nearest(x, y, hint) {
    var P = TRACK.pts, best = -1, bd = Infinity, i, k;
    var from = hint === undefined ? 0 : hint - 30, to = hint === undefined ? N : hint + 30;
    for (i = from; i < to; i++) {
      k = (i + N) % N;
      var d = (P[k].x - x) * (P[k].x - x) + (P[k].y - y) * (P[k].y - y);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  function distFromCenter(x, y, k) {
    // signed lateral distance using the local tangent
    var p = TRACK.pts[k];
    return (x - p.x) * p.nx + (y - p.y) * p.ny;
  }
  function minDistToTrack(x, y) {
    var bd = Infinity;
    TRACK.pts.forEach(function (p) { bd = Math.min(bd, Math.hypot(p.x - x, p.y - y)); });
    return bd;
  }

  /* --------------------------------------------------------- drawing */
  function rr(g, x, y, w, hh, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, hh, r); else g.rect(x, y, w, hh); }
  function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function buildBackground(px) {
    var c = document.createElement('canvas');
    c.width = Math.round(LW * px); c.height = Math.round(LH * px);
    var g = c.getContext('2d');
    g.scale(px, px);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // grass
    g.fillStyle = '#6CC24A'; g.fillRect(0, 0, LW, LH);
    var rnd = seeded(7), i;
    g.fillStyle = '#62B541';
    for (i = 0; i < 260; i++) { g.beginPath(); g.arc(rnd() * LW, rnd() * LH, 2 + rnd() * 4, 0, 7); g.fill(); }
    // beach + sea strip along the bottom right
    g.fillStyle = '#F4CE7A';
    g.beginPath(); g.moveTo(LW, LH - 70); g.quadraticCurveTo(LW - 120, LH - 40, LW - 200, LH); g.lineTo(LW, LH); g.closePath(); g.fill();
    g.fillStyle = '#6F9FB8';
    g.beginPath(); g.moveTo(LW, LH - 40); g.quadraticCurveTo(LW - 80, LH - 20, LW - 130, LH); g.lineTo(LW, LH); g.closePath(); g.fill();
    // infield pond
    var pond = [640, 250, 78, 48];
    if (minDistToTrack(pond[0], pond[1]) > HALF + pond[2] + 6) {
      g.fillStyle = '#F4CE7A'; g.beginPath(); g.ellipse(pond[0], pond[1], pond[2] + 10, pond[3] + 10, 0, 0, 7); g.fill();
      g.fillStyle = '#6F9FB8'; g.beginPath(); g.ellipse(pond[0], pond[1], pond[2], pond[3], 0, 0, 7); g.fill();
      g.strokeStyle = O; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(600, 240); g.quadraticCurveTo(612, 232, 624, 240); g.moveTo(650, 266); g.quadraticCurveTo(662, 258, 674, 266); g.stroke();
    }
    // road: outline, kerbs, asphalt, centre dashes
    var P = TRACK.pts;
    function path() { g.beginPath(); g.moveTo(P[0].x, P[0].y); for (var k = 1; k < N; k++) g.lineTo(P[k].x, P[k].y); g.closePath(); }
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = HALF * 2 + 22; g.save(); g.translate(3, 5); path(); g.stroke(); g.restore();
    g.strokeStyle = O; g.lineWidth = HALF * 2 + 18; path(); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = HALF * 2 + 11; path(); g.stroke();
    g.strokeStyle = '#E26D5C'; g.setLineDash([16, 16]); path(); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#4A4560'; g.lineWidth = HALF * 2; path(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.setLineDash([18, 22]); path(); g.stroke(); g.setLineDash([]);
    // finish line (checkered) at index 0
    var s0 = P[0];
    g.save(); g.translate(s0.x, s0.y); g.rotate(s0.ang);
    var cells = 8, cs = HALF * 2 / cells;
    for (i = 0; i < cells; i++) for (var j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? O : '#fff';
      g.fillRect(-cs + j * cs, -HALF + i * cs, cs, cs);
    }
    g.restore();
    // trees & umbrellas away from the road
    var placed = 0, tries = 0;
    while (placed < 26 && tries < 600) {
      tries++;
      var x = 20 + rnd() * (LW - 40), y = 20 + rnd() * (LH - 40), r = 13 + rnd() * 10;
      if (minDistToTrack(x, y) < HALF + r + 14) continue;
      if (Math.hypot(x - pond[0], y - pond[1]) < pond[2] + r + 16) continue;
      if (x > LW - 210 && y > LH - 80) continue;
      placed++;
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(x + 3, y + 4, r, 0, 7); g.fill();
      if (placed % 5 === 0) {
        // beach umbrella
        g.fillStyle = '#F0BD5E'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.fillStyle = '#E26D5C';
        for (var q = 0; q < 6; q += 2) { g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, q * Math.PI / 3, (q + 1) * Math.PI / 3); g.closePath(); g.fill(); }
        g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
        g.fillStyle = O; g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill();
      } else {
        g.fillStyle = placed % 3 ? '#6C874D' : '#7D9A5C'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.strokeStyle = O; g.lineWidth = 3; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, 7); g.fill();
      }
    }
    return c;
  }

  function drawCar(g, car) {
    var p = car.player, d = car.design;
    g.save();
    g.translate(car.x, car.y); g.rotate(car.a);
    g.lineJoin = 'round';
    // shadow
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -16, -8, 34, 20, 7); g.fill();
    // wheels
    g.fillStyle = O;
    var wy = d === 2 ? 12 : 10.5, wl = d === 2 ? 9 : 8;
    [[-12, -wy - 2.5], [6, -wy - 2.5], [-12, wy - 2.5], [6, wy - 2.5]].forEach(function (w) { rr(g, w[0], w[1], wl, 5, 2); g.fill(); });
    // body
    g.fillStyle = p.color; g.strokeStyle = O; g.lineWidth = 2.6;
    if (d === 0) { rr(g, -17, -9.5, 34, 19, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-15, -2, 30, 4); }
    else if (d === 1) { rr(g, -18, -10, 36, 20, 4); g.fill(); g.stroke(); g.strokeStyle = 'rgba(27,21,48,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-12, -6); g.lineTo(-12, 6); g.moveTo(-7, -6); g.lineTo(-7, 6); g.stroke(); }
    else if (d === 2) { g.beginPath(); g.moveTo(-15, -8); g.lineTo(12, -6); g.quadraticCurveTo(18, 0, 12, 6); g.lineTo(-15, 8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = O; rr(g, -20, -11, 5, 22, 2); g.fill(); }
    else { g.beginPath(); g.ellipse(0, 0, 17, 10, 0, 0, 7); g.fill(); g.stroke(); }
    // windshield
    g.fillStyle = '#BFE6FA'; g.strokeStyle = O; g.lineWidth = 2;
    rr(g, d === 1 ? 7 : 3, -6, 6, 12, 2); g.fill(); g.stroke();
    g.restore();
    // roof badge: player symbol (never colour alone)
    A.drawSymbol(g, p, car.x - Math.cos(car.a) * 6, car.y - Math.sin(car.a) * 6, 5.2, 1.6);
    if (car.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + car.flash + ')'; g.beginPath(); g.arc(car.x, car.y, 16, 0, 7); g.fill(); }
  }

  /* ------------------------------------------------------------------ */
  A.register({
    id: 'racers',
    title: 'Tiny Racers',
    tagline: 'Zippy top-down races around a seaside loop.',
    description: 'Race tiny cars around a seaside loop. Stay on the road, bump your rivals and cross the line first!',
    color: '#E26D5C',
    ink: '#2E2620',
    players: [1, 2, 3],
    cats: ['action', 'multiplayer'],
    modes: { 1: 'vs CPU racers', 2: 'Race together', 3: 'Race together' },
    pausable: true,
    options: function (n) {
      var cp = [];
      for (var k = (n === 1 ? 1 : 0); k <= 4 - n && k <= 3; k++) cp.push({ v: k, label: k === 0 ? 'No CPUs' : k + ' CPU' + (k > 1 ? 's' : '') });
      return [
        { id: 'laps', label: 'Laps', def: 3, choices: [{ v: 2, label: '2 laps' }, { v: 3, label: '3 laps' }, { v: 5, label: '5 laps' }] },
        { id: 'cpus', label: 'Computer racers', def: Math.min(2, 4 - n), choices: cp },
        { id: 'level', label: 'CPU speed', def: 'normal', choices: [{ v: 'easy', label: 'Cruisy' }, { v: 'normal', label: 'Speedy' }, { v: 'hard', label: 'Turbo' }] }
      ];
    },
    rules: function (cfg) {
      return ['Wait for the countdown, then race!', 'Walls keep you on the road. Bumping them (or other cars) slows you down.',
        'Complete ' + (cfg.opts.laps || 3) + ' laps. Your lap counter only goes up when you drive the full loop.',
        'First across the line after the last lap wins.', 'On touch screens your car accelerates on its own: steer with ◀ ▶ and hold both to brake.'];
    },
    controls: function (cfg) {
      var c = [];
      for (var i = 0; i < cfg.players; i++) c.push([cfg.players === 1 ? 'W A S D / Arrow keys' : KEYS[i].label, (cfg.players === 1 ? 'Drive' : 'Player ' + (i + 1) + ': gas, brake, steer')]);
      c.push(['Touch ◀ ▶', 'Steer (auto gas, both = brake)']);
      c.push(['Esc', 'Pause']);
      return c;
    },
    best: function () {
      var b = A.store.record('racers', 'bestlap');
      return b === null ? null : 'Fastest lap on this track: ' + A.fmtTime(b);
    },

    create: function (ctx) {
      var cfg = ctx.cfg, laps = cfg.opts.laps || 3, level = cfg.opts.level || 'normal';
      var cpus = cfg.opts.cpus;
      if (typeof cpus !== 'number') cpus = Math.min(2, 4 - cfg.players);
      if (cfg.players === 1 && cpus < 1) cpus = 1;
      cpus = Math.min(cpus, 4 - cfg.players);
      var roster = A.makeRoster(cfg.players, cpus);
      var touch = A.isTouch();
      var speedMul = { easy: 0.78, normal: 0.9, hard: 0.98 }[level];
      var cars = [], keys = {}, padState = [], raceT = 0, phase = 'countdown', cd = 3.6, lastBeep = 4, firstFinishT = null, fx = [], bumpT = 0;
      var bg = null, finishOrder = [], bestLap = null, endTimer = null;

      var view = A.makeCanvas(ctx, LW, LH, { rotateWhenTall: true, reserve: function () { return pads.hidden ? 0 : pads.offsetHeight + 10; } });
      var g = view.g;
      view.onResize = function () { bg = buildBackground(view.px); };

      // touch pads
      var pads = h('div', { class: 'arc-race-pads', hidden: !touch });
      roster.forEach(function (p, i) {
        if (p.isBot) return;
        padState[i] = { left: new Set(), right: new Set() };
        function btn(side) {
          var b = h('button', { type: 'button', class: 'arc-race-btn', 'aria-label': p.name + ' steer ' + side },
            A.svg(side === 'left' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'));
          var set = padState[i][side];
          var on = function (e) { e.preventDefault(); A.sound.unlock(); set.add(e.pointerId); b.classList.add('is-down'); try { b.setPointerCapture(e.pointerId); } catch (er) { /* */ } };
          var off = function (e) { set.delete(e.pointerId); if (!set.size) b.classList.remove('is-down'); };
          ctx.listen(b, 'pointerdown', on); ctx.listen(b, 'pointerup', off); ctx.listen(b, 'pointercancel', off); ctx.listen(b, 'lostpointercapture', off);
          ctx.listen(b, 'contextmenu', function (e) { e.preventDefault(); });
          return b;
        }
        pads.appendChild(h('div', { class: 'arc-race-pad', style: { '--pc': p.color } }, btn('left'), h('span', { class: 'arc-race-who' }, A.symbolSVG(p, 22), p.short), btn('right')));
      });
      var wrap = h('div', { class: 'arc-race' }, h('div', { class: 'arc-race-view' }, view.canvas), pads);

      // grid positions: two abreast behind the line
      var slots = [[N - 7, 18], [N - 7, -18], [N - 19, 18], [N - 19, -18]];
      roster.forEach(function (p, i) {
        var s = slots[i], P = TRACK.pts[s[0]];
        cars.push({
          player: p, design: i, x: P.x + P.nx * s[1], y: P.y + P.ny * s[1], a: P.ang, vx: 0, vy: 0,
          idx: s[0], prog: s[0] - N, lapsDone: 0, lapStart: 0, best: null, finished: false, time: null,
          bot: p.isBot ? { offset: A.rand(-16, 16), skill: speedMul * A.rand(0.97, 1.03), stuck: 0, reverse: 0, phase: Math.random() * 6 } : null,
          flash: 0
        });
      });

      function input(i) {
        var car = cars[i];
        if (car.bot) return botInput(car);
        var k = KEYS[i], thr = 0, steer = 0;
        var up = keys[k.up] || (cfg.players === 1 && keys.ArrowUp), dn = keys[k.down] || (cfg.players === 1 && keys.ArrowDown);
        var lf = keys[k.left] || (cfg.players === 1 && keys.ArrowLeft), rt = keys[k.right] || (cfg.players === 1 && keys.ArrowRight);
        if (up) thr = 1; if (dn) thr = -1;
        if (lf) steer -= 1; if (rt) steer += 1;
        var ps = padState[i];
        if (ps && (ps.left.size || ps.right.size)) {
          if (ps.left.size && ps.right.size) { thr = -1; steer = 0; } else { steer = ps.left.size ? -1 : 1; thr = 1; }
        } else if (touch && !up && !dn && !lf && !rt) thr = 1; // auto-gas on touch
        return { thr: thr, steer: steer, mul: 1 };
      }
      function botInput(car) {
        var b = car.bot, P = TRACK.pts;
        var fwd = car.vx * Math.cos(car.a) + car.vy * Math.sin(car.a);
        if (b.reverse > 0) return { thr: -1, steer: b.revSteer, mul: b.skill };
        var look = Math.round(9 + Math.max(0, fwd) * 0.05);
        var ti = (car.idx + look) % N, off = b.offset + Math.sin(raceT * 0.4 + b.phase) * 8;
        var tx = P[ti].x + P[ti].nx * off, ty = P[ti].y + P[ti].ny * off;
        var diff = wrapAng(Math.atan2(ty - car.y, tx - car.x) - car.a);
        var ahead = P[(car.idx + look * 2 + 6) % N];
        var curve = Math.abs(wrapAng(ahead.ang - P[car.idx].ang));
        var thr = curve > 0.85 && fwd > MAXS * 0.62 ? -0.35 : curve > 0.55 && fwd > MAXS * 0.78 ? 0 : 1;
        if (fwd < 25 && phase === 'race') { b.stuck += 1 / 60; if (b.stuck > 1.1) { b.reverse = 0.7; b.revSteer = diff > 0 ? -1 : 1; b.stuck = 0; } } else b.stuck = 0;
        return { thr: thr, steer: A.clamp(diff * 2.4, -1, 1), mul: b.skill };
      }

      function physics(car, inp, dt) {
        var ca = Math.cos(car.a), sa = Math.sin(car.a);
        var vf = car.vx * ca + car.vy * sa, vl = -car.vx * sa + car.vy * ca;
        if (car.finished) inp = { thr: 0, steer: 0, mul: 1 };
        if (inp.thr > 0) vf += ACC * inp.thr * dt;
        else if (inp.thr < 0) vf -= (vf > 20 ? BRAKE : REV) * -inp.thr * dt;
        vf -= vf * DRAG * dt;
        if (car.finished) vf -= vf * 1.5 * dt;
        vf = A.clamp(vf, -95, MAXS * inp.mul);
        vl *= Math.exp(-GRIP * dt);
        car.a = wrapAng(car.a + inp.steer * TURN * dt * A.clamp(vf / 130, -1, 1));
        ca = Math.cos(car.a); sa = Math.sin(car.a);
        car.vx = ca * vf - sa * vl; car.vy = sa * vf + ca * vl;
        car.x += car.vx * dt; car.y += car.vy * dt;
        // walls
        car.idx = nearest(car.x, car.y, car.idx);
        var P = TRACK.pts[car.idx], lat = distFromCenter(car.x, car.y, car.idx), lim = HALF - 8;
        if (Math.abs(lat) > lim) {
          var sgn = lat > 0 ? 1 : -1;
          car.x -= P.nx * (Math.abs(lat) - lim) * sgn; car.y -= P.ny * (Math.abs(lat) - lim) * sgn;
          var vn = car.vx * P.nx * sgn + car.vy * P.ny * sgn;
          if (vn > 0) {
            car.vx -= 1.3 * vn * P.nx * sgn; car.vy -= 1.3 * vn * P.ny * sgn;
            car.vx *= 0.93; car.vy *= 0.93;
            if (vn > 60) { bump(car, vn); }
          }
        }
      }
      function bump(car, force) {
        if (raceT - bumpT > 0.12) { bumpT = raceT; ctx.sfx('bump'); }
        car.flash = Math.min(0.6, force / 300);
        if (fx.length < 40) for (var k = 0; k < 3; k++) fx.push({ x: car.x, y: car.y, vx: A.rand(-60, 60), vy: A.rand(-60, 60), t: 0 });
      }
      function collideCars() {
        for (var i = 0; i < cars.length; i++) for (var j = i + 1; j < cars.length; j++) {
          var a = cars[i], b = cars[j];
          if (a.finished || b.finished) continue;
          var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d >= CAR_R * 2 || d < 0.01) continue;
          var nx = dx / d, ny = dy / d, push = (CAR_R * 2 - d) / 2;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            var imp = -rv * 0.8;
            a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp;
            if (-rv > 40) { bump(a, -rv); b.flash = a.flash; }
          }
        }
      }
      function laps_(car, prevIdx) {
        car.prog += wrapIdx(car.idx - prevIdx);
        var done = Math.floor(car.prog / N);
        if (done > car.lapsDone && !car.finished) {
          car.lapsDone = done;
          var lapTime = raceT - car.lapStart;
          car.lapStart = raceT;
          if (done >= 1) {
            if (car.best === null || lapTime < car.best) car.best = lapTime;
            if (!car.player.isBot && (bestLap === null || lapTime < bestLap)) bestLap = lapTime;
          }
          if (done >= laps) {
            car.finished = true; car.time = raceT; finishOrder.push(car);
            if (!car.player.isBot) ctx.sfx('win'); else ctx.sfx('beep');
            if (firstFinishT === null) firstFinishT = raceT;
            ctx.setStatus(car.player.name + ' finished ' + ordinal(finishOrder.length) + '!');
          } else if (!car.player.isBot) {
            ctx.sfx('coin');
            ctx.setStatus(car.player.name + ': lap ' + (done + 1) + ' of ' + laps + (done + 1 === laps ? ' — final lap!' : ''));
          }
        }
      }
      function ordinal(n) { return n + (['th', 'st', 'nd', 'rd'][n] || 'th'); }
      function standings() {
        return cars.slice().sort(function (a, b) {
          if (a.finished && b.finished) return a.time - b.time;
          if (a.finished) return -1; if (b.finished) return 1;
          return b.prog - a.prog;
        });
      }
      function hud() {
        var st = standings();
        ctx.setScores(cars.map(function (c) {
          var pos = st.indexOf(c) + 1;
          return c.finished ? ordinal(pos) + ' ✓' : ordinal(pos) + ' · L' + Math.min(laps, Math.max(1, c.lapsDone + 1));
        }));
        var stats = [['Laps', laps], ['Time', A.fmtTime(raceT)]];
        ctx.setStats(stats);
      }

      function end() {
        if (ctx.over) return;
        phase = 'done';
        var st = standings();
        var rows = st.map(function (c, i) {
          return { player: c.player, score: i, place: i + 1, label: c.finished ? A.fmtTime(c.time) : 'DNF · lap ' + Math.max(1, Math.min(laps, c.lapsDone + 1)) };
        });
        var recs = [];
        if (bestLap !== null) { var r = A.store.submit('racers', 'bestlap', Math.round(bestLap * 10) / 10, 'low'); if (r.isNew) recs.push('New fastest lap: ' + A.fmtTime(bestLap)); }
        var humanTop = !rows[0].player.isBot;
        ctx.finish({
          title: rows[0].player.name === 'You' ? 'You win the race!' : rows[0].player.name + ' wins the race!',
          subtitle: laps + ' laps around the seaside loop.',
          rows: rows, stats: [['Best lap', bestLap === null ? '–' : A.fmtTime(bestLap)], ['Race time', A.fmtTime(raceT)]], records: recs,
          tone: cfg.players === 1 && !humanTop ? 'lose' : 'win'
        });
      }

      function update(dt) {
        if (phase === 'countdown') {
          cd -= dt;
          var n = Math.ceil(cd - 0.6);
          if (n < lastBeep && n >= 1) { lastBeep = n; ctx.sfx('beep'); }
          if (cd <= 0.6 && lastBeep > 0) { lastBeep = 0; ctx.sfx('go'); phase = 'race'; ctx.setStatus(touch ? 'GO! Steer with ◀ ▶' : 'GO!'); }
          return;
        }
        if (phase !== 'race') return;
        raceT += dt;
        var sub = 2, h2 = dt / sub;
        for (var s = 0; s < sub; s++) {
          cars.forEach(function (c, i) {
            var prev = c.idx;
            if (c.bot && c.bot.reverse > 0) c.bot.reverse -= h2;
            physics(c, input(i), h2);
            laps_(c, prev);
          });
          collideCars();
        }
        cars.forEach(function (c) { if (c.flash > 0) c.flash = Math.max(0, c.flash - dt * 2); });
        fx = fx.filter(function (f) { f.t += dt * 2; f.x += f.vx * dt; f.y += f.vy * dt; return f.t < 1; });
        hud();
        var humans = cars.filter(function (c) { return !c.player.isBot; });
        var allHumansDone = humans.every(function (c) { return c.finished; });
        var allDone = cars.every(function (c) { return c.finished; });
        if (endTimer === null && (allDone || allHumansDone || (firstFinishT !== null && raceT - firstFinishT > 20))) endTimer = raceT + (allDone ? 0.8 : 1.6);
        if (endTimer !== null && raceT >= endTimer) end();
      }

      function render() {
        view.begin();
        if (bg) g.drawImage(bg, 0, 0, LW, LH);
        fx.forEach(function (f) { g.fillStyle = 'rgba(255,255,255,' + (1 - f.t) * 0.8 + ')'; g.beginPath(); g.arc(f.x, f.y, 3 + f.t * 4, 0, 7); g.fill(); });
        cars.slice().sort(function (a, b) { return a.finished - b.finished; }).forEach(function (c) { drawCar(g, c); });
        // countdown / labels in screen space
        if (phase === 'countdown' || (phase === 'race' && raceT < 0.7)) {
          view.screen();
          var W = view.rotated ? LH : LW, H = view.rotated ? LW : LH;
          var txt = phase === 'race' ? 'GO!' : String(Math.max(1, Math.ceil(cd - 0.6)));
          if (cd > 3.2) txt = 'Ready?';
          g.font = '700 ' + (txt.length > 3 ? 54 : 84) + 'px ' + getComputedStyle(ctx.stage).fontFamily;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          var tw = g.measureText(txt).width + 60;
          g.fillStyle = phase === 'race' ? '#8FA968' : '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 5;
          rr(g, W / 2 - tw / 2, H / 2 - 56, tw, 112, 26); g.fill(); g.stroke();
          g.fillStyle = O; g.fillText(txt, W / 2, H / 2 + 4);
        }
      }

      function onKey(e, down) {
        var codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyI', 'KeyJ', 'KeyK', 'KeyL'];
        if (codes.indexOf(e.code) < 0) return;
        if (ctx.shell.overlay) { keys = {}; return; }
        e.preventDefault();
        keys[e.code] = down;
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Race track. ' + roster.filter(function (p) { return !p.isBot; }).map(function (p, i) { return p.name + ' drives with ' + (cfg.players === 1 ? 'W A S D or the arrow keys' : KEYS[i].label); }).join('. ') + '.');
          ctx.listen(window, 'keydown', function (e) { onKey(e, true); });
          ctx.listen(window, 'keyup', function (e) { onKey(e, false); });
          ctx.listen(window, 'blur', function () { keys = {}; });
          ctx.setStatus(touch ? 'Get ready! Your car drives itself forward. Steer with ◀ ▶.' : (cfg.players === 1 ? 'Get ready! Drive with WASD or the arrow keys.' : roster.filter(function (p) { return !p.isBot; }).map(function (p, i) { return p.short + ': ' + KEYS[i].label; }).join(' · ')));
          hud();
          ctx.loop(function (dt) { if (dt > 0) update(dt); render(); });
        },
        pause: function () { keys = {}; padState.forEach(function (p) { if (p) { p.left.clear(); p.right.clear(); } }); pads.querySelectorAll('.is-down').forEach(function (b) { b.classList.remove('is-down'); }); },
        destroy: function () {}
      };
    }
  });
})();

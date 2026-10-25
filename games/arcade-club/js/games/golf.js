/* ==========================================================================
   GAME 4 — MINI GOLF GETAWAY  (1–3 players, take turns per hole)
   Pull back and release to putt. Real friction + collision physics:
   walls, bumpers, sand (slow), water (+1 penalty, back to last spot) and
   a sliding gate. Lowest total strokes wins.
   Course space is 400×640 (portrait); it rotates on wide screens.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h, O = A.OUTLINE;

  var CW = 400, CH = 640, B = 24;          // course size and border thickness
  var R = 8, HOLE_R = 12.5, MAXV = 950, SINK_V = 430;

  // [x, y, w, h] rectangles; bumpers [x, y, r]
  var COURSE = [
    { name: 'Palm Path', par: 2, tee: [200, 565], hole: [200, 110],
      walls: [[130, 300, 140, 24]], sand: [[54, 150, 70, 64]], water: [], bumpers: [], movers: [] },
    { name: 'Dogleg Dunes', par: 3, tee: [92, 560], hole: [74, 112],
      walls: [[24, 200, 236, 232]], sand: [[288, 486, 88, 80]], water: [], bumpers: [[318, 210, 16]], movers: [] },
    { name: 'Bumper Bay', par: 3, tee: [200, 580], hole: [200, 88],
      walls: [[24, 150, 92, 22], [284, 150, 92, 22]], sand: [], water: [],
      bumpers: [[118, 330, 26], [282, 330, 26], [200, 238, 24], [200, 436, 24]], movers: [] },
    { name: 'Lagoon Leap', par: 3, tee: [200, 582], hole: [302, 102],
      walls: [[150, 172, 226, 22]], sand: [[40, 420, 70, 60]], water: [[24, 290, 146, 82], [230, 290, 146, 82]], bumpers: [], movers: [] },
    { name: 'Windmill Wiggle', par: 4, tee: [330, 578], hole: [300, 80],
      walls: [[24, 470, 232, 22], [24, 300, 130, 26], [246, 300, 130, 26], [146, 150, 230, 22]], sand: [[40, 530, 80, 60]], water: [], bumpers: [],
      movers: [{ y: 300, w: 58, h: 26, x0: 154, x1: 188, speed: 1.6 }] }
  ];
  var BOUNDS = [[0, 0, CW, B], [0, CH - B, CW, B], [0, 0, B, CH], [CW - B, 0, B, CH]];

  function inRect(x, y, r) { return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]; }
  function hitRect(b, r, rest) {
    var cx = A.clamp(b.x, r[0], r[0] + r[2]), cy = A.clamp(b.y, r[1], r[1] + r[3]);
    var dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy, nx, ny;
    if (d2 >= R * R) return 0;
    var d = Math.sqrt(d2);
    if (d < 1e-6) {
      var l = b.x - r[0], rt = r[0] + r[2] - b.x, t = b.y - r[1], bt = r[1] + r[3] - b.y, m = Math.min(l, rt, t, bt);
      if (m === l) { nx = -1; ny = 0; b.x = r[0] - R; } else if (m === rt) { nx = 1; ny = 0; b.x = r[0] + r[2] + R; }
      else if (m === t) { nx = 0; ny = -1; b.y = r[1] - R; } else { nx = 0; ny = 1; b.y = r[1] + r[3] + R; }
    } else { nx = dx / d; ny = dy / d; b.x = cx + nx * R; b.y = cy + ny * R; }
    var vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= (1 + rest) * vn * nx; b.vy -= (1 + rest) * vn * ny; return -vn; }
    return 0.001;
  }
  function hitCircle(b, c) {
    var dx = b.x - c[0], dy = b.y - c[1], d = Math.sqrt(dx * dx + dy * dy), min = R + c[2];
    if (d >= min || d < 1e-6) return 0;
    var nx = dx / d, ny = dy / d;
    b.x = c[0] + nx * min; b.y = c[1] + ny * min;
    var vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; b.vx += nx * 70; b.vy += ny * 70; return -vn; }
    return 0.001;
  }
  function moverRect(m, t) { return [m.x0 + (m.x1 - m.x0) * (0.5 - 0.5 * Math.cos(t * m.speed)), m.y, m.w, m.h]; }

  /**
   * Pure physics for one frame (no drawing, no sound).
   * Moves `ball` {x,y,vx,vy} on hole `c` at course time t.
   * Returns { impact, bump, result: null | 'water' | 'sunk' | 'stop' }.
   */
  function physicsStep(ball, c, t, dt) {
    var ev = { impact: 0, bump: 0, result: null };
    var sub = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 3));
    var h2 = dt / sub, i;
    for (var s = 0; s < sub; s++) {
      ball.x += ball.vx * h2; ball.y += ball.vy * h2;
      for (i = 0; i < BOUNDS.length; i++) ev.impact = Math.max(ev.impact, hitRect(ball, BOUNDS[i], 0.7));
      for (i = 0; i < c.walls.length; i++) ev.impact = Math.max(ev.impact, hitRect(ball, c.walls[i], 0.72));
      for (i = 0; i < c.movers.length; i++) ev.impact = Math.max(ev.impact, hitRect(ball, moverRect(c.movers[i], t), 0.75));
      for (i = 0; i < c.bumpers.length; i++) ev.bump = Math.max(ev.bump, hitCircle(ball, c.bumpers[i]));
      for (i = 0; i < c.water.length; i++) if (inRect(ball.x, ball.y, c.water[i])) { ev.result = 'water'; return ev; }
      var dx = c.hole[0] - ball.x, dy = c.hole[1] - ball.y, d = Math.hypot(dx, dy);
      if (d < HOLE_R) {
        if (Math.hypot(ball.vx, ball.vy) < SINK_V) {
          ball.x = c.hole[0]; ball.y = c.hole[1]; ball.vx = ball.vy = 0;
          ev.result = 'sunk'; return ev;
        }
        ball.vx += dx / (d + 0.01) * 1400 * h2; ball.vy += dy / (d + 0.01) * 1400 * h2; // lip pull
      }
    }
    // rolling friction (sand is sticky)
    var sp = Math.hypot(ball.vx, ball.vy);
    if (sp > 0) {
      var inSand = c.sand.some(function (sr) { return inRect(ball.x, ball.y, sr); });
      var nv = Math.max(0, sp - (sp * (inSand ? 3.6 : 0.9) + (inSand ? 160 : 70)) * dt);
      ball.vx *= nv / sp; ball.vy *= nv / sp;
      if (nv < 7) { ball.vx = ball.vy = 0; ev.result = 'stop'; }
    } else ev.result = 'stop';
    return ev;
  }

  /* ------------------------------------------------------------ drawing */
  function rr(g, x, y, w, hh, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, hh, r) : g.rect(x, y, w, hh); }
  function drawCourse(g, c, t, flagColor, upright) {
    // sea around the course
    g.fillStyle = '#6FB5A5'; g.fillRect(0, 0, CW, CH);
    // fairway with mowing stripes
    g.fillStyle = '#8BD05A'; g.fillRect(B, B, CW - 2 * B, CH - 2 * B);
    g.fillStyle = '#80C850';
    for (var y = B; y < CH - B; y += 80) g.fillRect(B, y, CW - 2 * B, 40);
    // wooden rail
    g.lineJoin = 'round';
    g.fillStyle = '#B5713C';
    [[0, 0, CW, B], [0, CH - B, CW, B], [0, 0, B, CH], [CW - B, 0, B, CH]].forEach(function (r) { g.fillRect(r[0], r[1], r[2], r[3]); });
    g.strokeStyle = O; g.lineWidth = 4;
    g.strokeRect(2, 2, CW - 4, CH - 4);
    g.strokeRect(B, B, CW - 2 * B, CH - 2 * B);
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2;
    for (var k = 30; k < CH; k += 46) { g.beginPath(); g.moveTo(4, k); g.lineTo(B - 4, k); g.moveTo(CW - B + 4, k); g.lineTo(CW - 4, k); g.stroke(); }
    // water
    c.water.forEach(function (w) {
      g.fillStyle = '#6F9FB8'; rr(g, w[0], w[1], w[2], w[3], 6); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2.5; g.lineCap = 'round';
      for (var yy = w[1] + 18; yy < w[1] + w[3] - 8; yy += 22) {
        g.beginPath();
        for (var xx = w[0] + 10; xx < w[0] + w[2] - 18; xx += 22) { g.moveTo(xx, yy + Math.sin(t * 2 + xx) * 2); g.quadraticCurveTo(xx + 5, yy - 5, xx + 11, yy + Math.sin(t * 2 + xx) * 2); }
        g.stroke();
      }
      g.strokeStyle = O; g.lineWidth = 3; rr(g, w[0], w[1], w[2], w[3], 6); g.stroke();
    });
    // sand
    c.sand.forEach(function (s) {
      g.fillStyle = '#F4CE7A'; rr(g, s[0], s[1], s[2], s[3], 22); g.fill();
      g.fillStyle = 'rgba(185,130,26,.45)';
      for (var i = 0; i < 9; i++) { g.beginPath(); g.arc(s[0] + 12 + (i * 37) % (s[2] - 20), s[1] + 12 + (i * 23) % (s[3] - 20), 2, 0, 7); g.fill(); }
      g.strokeStyle = O; g.lineWidth = 3; rr(g, s[0], s[1], s[2], s[3], 22); g.stroke();
    });
    // walls: thin ones are wood, chunky ones are garden beds
    c.walls.forEach(function (w) { drawBlock(g, w); });
    // bumpers
    c.bumpers.forEach(function (b) {
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(b[0] + 2, b[1] + 3, b[2], 0, 7); g.fill();
      g.fillStyle = '#E26D5C'; g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill();
      g.strokeStyle = O; g.lineWidth = 3.5; g.stroke();
      g.strokeStyle = '#FFD9D2'; g.lineWidth = 3; g.beginPath(); g.arc(b[0], b[1], b[2] * 0.55, 0, 7); g.stroke();
    });
    // tee pad
    g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, c.tee[0] - 18, c.tee[1] - 10, 36, 20, 6); g.fill();
    // hole + flag
    g.fillStyle = '#5DA83A'; g.beginPath(); g.ellipse(c.hole[0], c.hole[1] + 1, HOLE_R + 5, HOLE_R + 4, 0, 0, 7); g.fill();
    g.fillStyle = O; g.beginPath(); g.ellipse(c.hole[0], c.hole[1], HOLE_R, HOLE_R - 1.5, 0, 0, 7); g.fill();
    // flag always points "up" on screen, even when the course is rotated
    var wave = Math.sin(t * 3) * 2;
    g.save();
    g.translate(c.hole[0], c.hole[1]);
    if (upright) g.rotate(Math.PI / 2);
    g.strokeStyle = O; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -44); g.stroke();
    g.fillStyle = flagColor;
    g.beginPath(); g.moveTo(0, -44); g.quadraticCurveTo(12, -40 + wave, 24, -37 + wave); g.lineTo(0, -30); g.closePath(); g.fill();
    g.lineWidth = 2.6; g.stroke();
    g.restore();
  }
  function drawBlock(g, w) {
    var chunky = w[2] > 50 && w[3] > 50;
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, w[0] + 2, w[1] + 4, w[2], w[3], chunky ? 16 : 6); g.fill();
    g.fillStyle = chunky ? '#6C874D' : '#C98048'; rr(g, w[0], w[1], w[2], w[3], chunky ? 16 : 6); g.fill();
    if (chunky) {
      // bushes & flowers
      var cols = ['#E9A194', '#F0BD5E', '#fff'];
      for (var i = 0; i < 12; i++) {
        var x = w[0] + 22 + (i * 53) % (w[2] - 44), y = w[1] + 22 + (i * 37) % (w[3] - 44);
        g.fillStyle = '#7D9A5C'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
        g.strokeStyle = 'rgba(27,21,48,.35)'; g.lineWidth = 2; g.stroke();
        g.fillStyle = cols[i % 3]; g.beginPath(); g.arc(x + 4, y - 3, 3.5, 0, 7); g.fill();
      }
    } else {
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2;
      g.beginPath();
      if (w[2] > w[3]) for (var xx = w[0] + 22; xx < w[0] + w[2]; xx += 28) { g.moveTo(xx, w[1] + 4); g.lineTo(xx, w[1] + w[3] - 4); }
      else for (var yy = w[1] + 22; yy < w[1] + w[3]; yy += 28) { g.moveTo(w[0] + 4, yy); g.lineTo(w[0] + w[2] - 4, yy); }
      g.stroke();
    }
    g.strokeStyle = O; g.lineWidth = 3.5; rr(g, w[0], w[1], w[2], w[3], chunky ? 16 : 6); g.stroke();
  }

  A.register({
    id: 'golf',
    title: 'Mini Golf Getaway',
    tagline: 'Putt around palms, bumpers and lagoons.',
    description: 'Pull back, aim and putt your way around a seaside course. Fewest strokes wins!',
    color: '#6FB5A5',
    players: [1, 2, 3],
    cats: ['action'],
    physics: { course: COURSE, step: physicsStep, maxSpeed: MAXV },
    modes: { 1: 'Beat par', 2: 'Take turns', 3: 'Take turns' },
    pausable: true,
    options: function () {
      return [{ id: 'holes', label: 'Course', def: 3, choices: [{ v: 3, label: 'Front 3 holes' }, { v: 5, label: 'Full 5 holes' }] }];
    },
    rules: function (cfg) {
      return ['Drag back anywhere on the course and let go to putt. Longer drag = harder shot.',
        'Bounce off walls and bumpers. Sand slows you down. Water costs 1 stroke and puts you back.',
        'Each player finishes the hole in turn. A hole ends after par + 4 strokes at most.',
        cfg.players === 1 ? 'Try to finish the course at or under par.' : 'Lowest total strokes wins.'];
    },
    controls: function () {
      return [['Drag & release', 'Aim and putt (mouse or touch)'], ['← / →', 'Aim'], ['↑ / ↓', 'Power'], ['Space / Enter', 'Putt'], ['Esc', 'Pause']];
    },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var b = A.store.record('golf', 'best-' + (cfg.opts.holes || 3));
      if (b === null) return null;
      var par = COURSE.slice(0, cfg.opts.holes || 3).reduce(function (s, c) { return s + c.par; }, 0);
      return 'Your best round: ' + b + ' strokes (par ' + par + ')';
    },

    create: function (ctx) {
      var cfg = ctx.cfg, nHoles = cfg.opts.holes || 3;
      var holes = COURSE.slice(0, nHoles);
      var roster = A.makeRoster(cfg.players, 0);
      var card = roster.map(function () { return holes.map(function () { return null; }); });
      var hi = 0, pi = 0, strokes = 0, phase = 'intro', t = 0;
      var ball = { x: 0, y: 0, vx: 0, vy: 0 }, lastPos = { x: 0, y: 0 };
      var aim = { a: -Math.PI / 2, p: 0.45, touched: false }, drag = null, keys = {};
      var fx = [], banner = null, bannerT = 0, lastHit = 0;

      var view = A.makeCanvas(ctx, CW, CH, { rotateWhenWide: true });
      var g = view.g;
      var scoreBox = h('div', { class: 'arc-golf-card', hidden: true });
      var wrap = h('div', { class: 'arc-golf' }, view.canvas, scoreBox);

      function hole() { return holes[hi]; }
      function totals() { return card.map(function (row) { return row.reduce(function (s, v) { return s + (v || 0); }, 0); }); }
      function parSoFar(upTo) { return holes.slice(0, upTo).reduce(function (s, c) { return s + c.par; }, 0); }
      function maxStrokes() { return hole().par + 4; }

      function hud() {
        ctx.setScores(totals());
        ctx.setTurn(phase === 'aim' || phase === 'roll' ? pi : -1);
        ctx.setStats([['Hole', (hi + 1) + '/' + nHoles], ['Par', hole().par], ['Strokes', strokes]]);
      }
      function say() {
        if (ctx.over) return;
        var who = cfg.players === 1 ? '' : roster[pi].name + ': ';
        if (phase === 'aim') ctx.setStatus(who + (A.isTouch() ? 'Drag back and release to putt.' : 'Drag back and release, or aim with arrow keys and press Space.'));
        else if (phase === 'roll') ctx.setStatus(who + 'Rolling…');
      }
      function startHole() {
        pi = 0;
        phase = 'intro';
        showBanner('Hole ' + (hi + 1) + ' · Par ' + hole().par);
        ctx.setStatus(hole().name);
        placeBall();
        hud();
      }
      function placeBall() {
        ball.x = hole().tee[0]; ball.y = hole().tee[1]; ball.vx = ball.vy = 0; ball.sunk = false; ball.scale = 1;
        lastPos = { x: ball.x, y: ball.y };
        strokes = 0;
        var dx = hole().hole[0] - ball.x, dy = hole().hole[1] - ball.y;
        aim.a = Math.atan2(dy, dx); aim.p = 0.45; aim.touched = false;
      }
      function showBanner(text) { banner = text; bannerT = 1.5; }

      function shoot() {
        if (phase !== 'aim' || ctx.over || ctx.paused) return;
        if (aim.p < 0.04) return;
        lastPos = { x: ball.x, y: ball.y };
        ball.vx = Math.cos(aim.a) * aim.p * MAXV; ball.vy = Math.sin(aim.a) * aim.p * MAXV;
        strokes++;
        phase = 'roll';
        ctx.sfx('hit');
        hud(); say();
      }
      function holeDone(score, why) {
        card[pi][hi] = score;
        phase = 'wait';
        hud();
        var who = cfg.players === 1 ? 'You' : roster[pi].name;
        var diff = score - hole().par;
        var word = why === 'max' ? 'picked up at ' + score : score === 1 ? 'HOLE IN ONE!' : diff <= -2 ? 'Eagle!' : diff === -1 ? 'Birdie!' : diff === 0 ? 'Par' : diff === 1 ? 'Bogey' : '+' + diff;
        ctx.setStatus(who + ': ' + word + (why === 'max' ? '' : ' (' + score + ')'));
        ctx.timeout(function () {
          if (pi < roster.length - 1) {
            pi++; placeBall(); phase = 'aim';
            showBanner(roster[pi].name + "'s turn");
            hud(); say();
          } else showCard();
        }, 1100);
      }
      function showCard() {
        phase = 'card';
        hud();
        var last = hi === holes.length - 1;
        A.clear(scoreBox);
        var head = h('tr', null, h('th', null, 'Player'), holes.map(function (c, i) { return h('th', { class: i === hi ? 'is-cur' : '' }, String(i + 1)); }), h('th', null, 'Total'));
        var parRow = h('tr', { class: 'is-par' }, h('td', null, 'Par'), holes.map(function (c) { return h('td', null, String(c.par)); }), h('td', null, String(parSoFar(holes.length))));
        var rows = roster.map(function (p, k) {
          return h('tr', null, h('td', null, h('span', { class: 'arc-golf-who' }, A.symbolSVG(p, 18), p.name)),
            holes.map(function (c, i) { return h('td', { class: i === hi ? 'is-cur' : '' }, card[k][i] === null ? '–' : String(card[k][i])); }),
            h('td', null, h('strong', null, String(totals()[k]))));
        });
        var btn = h('button', { type: 'button', class: 'arc-btn arc-btn-primary', onclick: function () {
          scoreBox.hidden = true;
          if (last) return end();
          hi++; startHole();
        } }, last ? 'See results' : 'Next hole');
        scoreBox.appendChild(h('h3', null, 'Hole ' + (hi + 1) + ' done'));
        scoreBox.appendChild(h('div', { class: 'arc-golf-table' }, h('table', null, h('thead', null, head), h('tbody', null, parRow, rows))));
        scoreBox.appendChild(btn);
        scoreBox.hidden = false;
        btn.focus({ preventScroll: true });
        ctx.setStatus(last ? 'Course complete!' : 'Ready for hole ' + (hi + 2) + '?');
      }
      function end() {
        var tot = totals(), par = parSoFar(holes.length);
        var fmt = function (v) { var d = v - par; return v + ' (' + (d === 0 ? 'E' : (d > 0 ? '+' : '') + d) + ')'; };
        if (cfg.players === 1) {
          var r = A.store.submit('golf', 'best-' + nHoles, tot[0], 'low');
          var d = tot[0] - par;
          ctx.finish({
            title: d < 0 ? 'Under par!' : d === 0 ? 'Right on par!' : 'Course complete!',
            subtitle: 'You finished ' + holes.length + ' holes in ' + tot[0] + ' strokes.',
            stats: [['Strokes', tot[0]], ['Par', par], ['Vs par', d === 0 ? 'E' : (d > 0 ? '+' : '') + d], ['Best', A.store.record('golf', 'best-' + nHoles)]],
            records: r.isNew && r.prev !== null ? ['New personal best!'] : r.prev === null ? ['First round recorded!'] : []
          });
        } else {
          var rows = A.rank(roster, tot, true).map(function (x) { x.label = fmt(x.score); return x; });
          ctx.finish({ title: A.winnerTitle(rows), subtitle: holes.length + ' holes · par ' + par, rows: rows });
        }
      }

      /* -------------------------------------------------------- physics */
      function step(dt) {
        var ev = physicsStep(ball, hole(), t, dt);
        if ((ev.impact > 60 || ev.bump > 30) && t - lastHit > 0.08) { lastHit = t; ctx.sfx(ev.bump ? 'point' : 'bump'); }
        if (ev.result === 'water') {
          fx.push({ kind: 'splash', x: ball.x, y: ball.y, t: 0 });
          ctx.sfx('splash');
          strokes++;
          ball.x = lastPos.x; ball.y = lastPos.y; ball.vx = ball.vy = 0;
          ctx.setStatus('Splash! +1 stroke. Back to your last spot.');
          hud();
          settle();
        } else if (ev.result === 'sunk') {
          ball.sunk = true;
          for (var k = 0; k < 10; k++) fx.push({ kind: 'spark', x: ball.x, y: ball.y, a: k / 10 * Math.PI * 2, t: 0, col: A.PLAYERS[k % 3].color });
          ctx.sfx('sink');
          holeDone(strokes, 'sunk');
        } else if (ev.result === 'stop') settle();
      }
      function settle() {
        if (phase !== 'roll') return;
        if (strokes >= maxStrokes()) return holeDone(maxStrokes(), 'max');
        phase = 'aim';
        var dx = hole().hole[0] - ball.x, dy = hole().hole[1] - ball.y;
        if (!aim.touched) aim.a = Math.atan2(dy, dx);
        hud(); say();
      }

      /* ---------------------------------------------------------- render */
      function render() {
        var c = hole();
        view.begin();
        drawCourse(g, c, t, '#E26D5C', view.rotated);
        c.movers.forEach(function (m) { drawBlock(g, moverRect(m, t)); });
        // aim guide
        if (phase === 'aim' && !ctx.over) {
          var len = 34 + aim.p * 120, ex = ball.x + Math.cos(aim.a) * len, ey = ball.y + Math.sin(aim.a) * len;
          g.save();
          g.lineCap = 'round';
          g.strokeStyle = 'rgba(27,21,48,.55)'; g.lineWidth = 7; g.setLineDash([2, 12]);
          g.beginPath(); g.moveTo(ball.x, ball.y); g.lineTo(ex, ey); g.stroke();
          g.strokeStyle = '#fff'; g.lineWidth = 4;
          g.beginPath(); g.moveTo(ball.x, ball.y); g.lineTo(ex, ey); g.stroke();
          g.setLineDash([]);
          g.translate(ex, ey); g.rotate(aim.a);
          g.fillStyle = '#fff'; g.strokeStyle = O; g.lineWidth = 3;
          g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -9); g.lineTo(-6, 9); g.closePath(); g.fill(); g.stroke();
          g.restore();
          // power ring
          var pc = aim.p < 0.5 ? '#8FA968' : aim.p < 0.8 ? '#F0BD5E' : '#E26D5C';
          g.lineWidth = 5; g.strokeStyle = 'rgba(27,21,48,.35)';
          g.beginPath(); g.arc(ball.x, ball.y, R + 9, 0, Math.PI * 2); g.stroke();
          g.strokeStyle = pc; g.beginPath(); g.arc(ball.x, ball.y, R + 9, -Math.PI / 2, -Math.PI / 2 + aim.p * Math.PI * 2); g.stroke();
        }
        // ball
        if (!ball.sunk) {
          var p = roster[pi];
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(ball.x + 2, ball.y + 3, R, 0, 7); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, R, 0, 7); g.fill();
          g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
          g.fillStyle = p.color; g.beginPath(); g.arc(ball.x, ball.y, R * 0.45, 0, 7); g.fill();
        }
        // effects
        fx.forEach(function (f) {
          if (f.kind === 'splash') {
            g.strokeStyle = 'rgba(255,255,255,' + (1 - f.t) + ')'; g.lineWidth = 3;
            g.beginPath(); g.arc(f.x, f.y, 6 + f.t * 30, 0, 7); g.stroke();
          } else {
            var r = 6 + f.t * 40;
            g.fillStyle = f.col; g.globalAlpha = 1 - f.t;
            g.beginPath(); g.arc(f.x + Math.cos(f.a) * r, f.y + Math.sin(f.a) * r, 4, 0, 7); g.fill();
            g.globalAlpha = 1;
          }
        });
        // banner (screen-space so it is never sideways)
        if (banner && bannerT > 0) {
          view.screen();
          var W = view.rotated ? CH : CW, Hh = view.rotated ? CW : CH;
          var a = Math.min(1, bannerT * 2);
          g.globalAlpha = a;
          g.font = '700 30px ' + getComputedStyle(ctx.stage).fontFamily;
          var tw = g.measureText(banner).width + 44;
          g.fillStyle = '#F0BD5E'; g.strokeStyle = O; g.lineWidth = 4;
          rr(g, W / 2 - tw / 2, Hh / 2 - 30, tw, 60, 18); g.fill(); g.stroke();
          g.fillStyle = O; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(banner, W / 2, Hh / 2 + 1);
          g.globalAlpha = 1;
        }
      }

      /* ----------------------------------------------------------- input */
      function onDown(e) {
        if (phase !== 'aim' || ctx.over || ctx.paused) return;
        e.preventDefault();
        A.sound.unlock();
        drag = { start: view.toGame(e), id: e.pointerId };
        try { view.canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      }
      function onMove(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var p = view.toGame(e), vx = drag.start.x - p.x, vy = drag.start.y - p.y, d = Math.hypot(vx, vy);
        if (d > 4) { aim.a = Math.atan2(vy, vx); aim.p = A.clamp(d / 150, 0, 1); aim.touched = true; }
        else aim.p = 0;
      }
      function onUp(e) {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        if (aim.p >= 0.04) shoot(); else aim.p = 0.45;
      }
      function onKey(e, down) {
        var k = e.key;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].indexOf(k) < 0) return;
        if (ctx.shell.overlay || !scoreBox.hidden) return;
        e.preventDefault();
        keys[k] = down;
        if (down && (k === ' ' || k === 'Enter') && !e.repeat) shoot();
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          view.resize();
          view.canvas.setAttribute('role', 'img');
          view.canvas.setAttribute('aria-label', 'Mini golf course. Use the arrow keys to aim and set power, Space to putt.');
          ctx.listen(view.canvas, 'pointerdown', onDown);
          ctx.listen(view.canvas, 'pointermove', onMove);
          ctx.listen(view.canvas, 'pointerup', onUp);
          ctx.listen(view.canvas, 'pointercancel', function () { drag = null; });
          ctx.listen(window, 'keydown', function (e) { onKey(e, true); });
          ctx.listen(window, 'keyup', function (e) { onKey(e, false); });
          startHole();
          ctx.loop(function (dt) {
            if (dt > 0) {
              t += dt;
              if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0 && phase === 'intro') { phase = 'aim'; hud(); say(); } }
              if (phase === 'aim') {
                if (keys.ArrowLeft) { aim.a -= 1.8 * dt; aim.touched = true; }
                if (keys.ArrowRight) { aim.a += 1.8 * dt; aim.touched = true; }
                if (keys.ArrowUp) aim.p = Math.min(1, aim.p + 0.7 * dt);
                if (keys.ArrowDown) aim.p = Math.max(0.05, aim.p - 0.7 * dt);
              }
              if (phase === 'roll') step(dt);
              fx = fx.filter(function (f) { f.t += dt * 1.6; return f.t < 1; });
            }
            render();
          });
        },
        pause: function () { drag = null; keys = {}; },
        destroy: function () {}
      };
    }
  });
})();

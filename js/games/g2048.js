/* Mochi 2048 — drop squishy number blobs into the jar; equal numbers that touch merge into the next power of two.
   Soft-body look: each blob is a circle in the physics, but it's drawn as a shape that flattens against its
   neighbours and the walls (a power-diagram clip), plus a little wobble when it lands or merges.
   Sounds are WAV files synthesised offline with Python (tools/make_sfx.py → assets/sfx/). */
(function () {
  'use strict';
  const App = window.App;
  const { icon, $, esc } = App;

  /* ---------- world ---------- */
  const W = 600, H = 760;
  const L = 36, R = 564, T = 30, B = 730, CH = 66;            // inner surface of the jar
  const QUEUE_Y = 62, DROP_Y = 152;
  // the two round side buttons: if the pile presses both fully in at once (for a moment), the game is lost
  const BY = 330, BR = 36, BOUT = 26, PRESS_LIMIT = 1.6;
  const WALLS = [[L, T, L, B - CH], [L, B - CH, L + CH, B], [L + CH, B, R - CH, B], [R - CH, B, R, B - CH], [R, B - CH, R, T]];
  const LINES = WALLS.map(([x1, y1, x2, y2]) => {           // inward normals for the convex jar
    let nx = -(y2 - y1), ny = x2 - x1; const len = Math.hypot(nx, ny); nx /= len; ny /= len;
    if (nx * (300 - x1) + ny * (400 - y1) < 0) { nx = -nx; ny = -ny; }
    return { x1, y1, x2, y2, nx, ny, c: nx * x1 + ny * y1 };
  });
  const G = 1900, SUB = 1 / 240, DAMP = 0.9985, SOFT = 0.93, GAP = 3.2, RAYS = 34;
    const COLORS = { 1: '#d4566e', 2: '#66c2b4', 4: '#8f9ba3', 8: '#5aaecb', 16: '#c9587a', 32: '#8a6fc9', 64: '#6cc5b5', 128: '#99a5ad', 256: '#d65864', 512: '#5fb0a3', 1024: '#4f86b6', 2048: '#6f7d8a', 4096: '#e0b04f', 8192: '#e26d5c' };
  const radiusOf = (v) => 28 + Math.log2(v) * 8.8;
  const colorOf = (v) => COLORS[v] || '#e0b04f';
  const FONT = '"Righteous", "Lexend", system-ui, sans-serif';

  /* ---------- sound (Python-made WAVs, played through Web Audio) ---------- */
  const SFX_NAMES = ['drop', 'land', 'combo', 'gameover', 'newbest', 'click', 'start'].concat(Array.from({ length: 13 }, (_, i) => 'merge-' + String(i + 1).padStart(2, '0')));
  const sfx = { buf: {}, loading: null };
  function loadSfx() {
    if (sfx.loading) return sfx.loading;
    const ctx = App.audio.init(); if (!ctx) return Promise.resolve();
    sfx.loading = Promise.all(SFX_NAMES.map((n) => fetch('assets/sfx/' + n + '.wav').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej))).then((b) => { sfx.buf[n] = b; }).catch(() => {})));
    return sfx.loading;
  }
  function play(name, rate = 1, gain = 1) {
    const prefs = App.store.get('mochiPrefs', { muted: false });
    const ctx = App.audio.ctx(), b = sfx.buf[name];
    if (prefs.muted || !ctx || !b) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = rate * (0.985 + Math.random() * 0.03); g.gain.value = 0.75 * gain;
    s.connect(g); g.connect(ctx.destination); s.start();
  }

  App.games['2048'] = {
    mount(stage, api) {
      api.canPause(true);
      api.help('Move to aim · click, tap or Space to drop · equal numbers merge · never let the pile press both round side buttons in at the same time');
      const prefs = App.store.get('mochiPrefs', { muted: false });
      stage.innerHTML = `
        <div class="mochi">
          <div class="mochi-title" aria-hidden="true">mochi</div>
          <div class="mochi-jar">
            <canvas class="mochi-canvas" aria-label="Mochi 2048 jar. Move to aim, press Space or click to drop a blob." role="img"></canvas>
            <div class="mochi-over" hidden></div>
            <div class="mochi-paused" hidden><b>paused</b><button type="button" class="mochi-btn" data-m="resume">resume</button></div>
            <button type="button" class="mochi-back" data-m="results" hidden>back to results</button>
          </div>
          <div class="mochi-side">
            <div class="mochi-score" aria-live="polite">0</div>
            <div class="mochi-pip"></div>
            <button type="button" class="mochi-mute" data-m="mute" aria-pressed="${prefs.muted}" aria-label="${prefs.muted ? 'Unmute' : 'Mute'} sounds">${icon(prefs.muted ? 'mute' : 'volume')}</button>
          </div>
        </div>`;
      const root = $('.mochi', stage), canvas = $('.mochi-canvas', stage), ctx2 = canvas.getContext('2d');
      const overEl = $('.mochi-over', stage), pausedEl = $('.mochi-paused', stage), backEl = $('.mochi-back', stage);
      const scoreEl = $('.mochi-score', stage), pipEl = $('.mochi-pip', stage);

      let blobs, queue, current, aimX = W / 2, score, best = App.scores.get('2048').best || 0, startBest, cooldown, danger, over, paused, raf = 0;
      let lastT = 0, acc = 0, particles = [], popups = [], combo = 0, lastMerge = 0, uid = 1, saveTick = 0, maxV = 1, pipPose = '', pipUntil = 0, clock = 0;
      let keys = {}, scale = 1, dpr = 1;

      /* ---------- helpers ---------- */
      const nextValue = () => {
        const pool = [[1, 30], [2, 28], [4, 22], [8, 13], [16, 7]].filter(([v]) => v <= Math.max(4, maxV / 4));
        let r = Math.random() * pool.reduce((s, p) => s + p[1], 0);
        for (const [v, w] of pool) { if ((r -= w) <= 0) return v; }
        return 1;
      };
      const makeBlob = (x, y, v, r) => ({ id: uid++, x, y, px: x, py: y, v, r: r || radiusOf(v), tr: radiusOf(v), born: clock, landed: false, jig: 0, jdir: 0, a: (Math.random() - 0.5) * 0.6, av: 0, ...shapeOf(), dropped: true });
      // every blob gets its own lumpy, potato-ish outline (low harmonics) so it reads as a soft blob, not a ball
      const shapeOf = () => ({ s1: Math.random() * 6.28, s2: Math.random() * 6.28, s3: Math.random() * 6.28, h2: 0.05 + Math.random() * 0.05, h3: 0.03 + Math.random() * 0.03 });
      let btnL = 0, btnR = 0, pressT = 0, touchL = false, touchR = false;
      const btnX = (side) => (side < 0 ? L - BR + BOUT * (1 - btnL) : R + BR - BOUT * (1 - btnR));
      const setPip = (pose, ms) => { pipPose = pose; pipUntil = ms ? clock + ms / 1000 : 0; drawPip(); };
      let shownPose = '';
      function drawPip() {
        const want = over ? (score > startBest && startBest > 0 ? 'celebrate' : 'sad') : paused ? 'sleepy' : (pipUntil && clock < pipUntil) ? pipPose : danger > 0.6 ? 'surprised' : danger > 0 ? 'thinking' : 'focused';
        if (want !== shownPose) { shownPose = want; pipEl.innerHTML = App.pip(want, { size: 84, cls: 'keep' }); }
      }
      const showScore = () => { scoreEl.textContent = score; api.status(`<span class="gs">Score <b>${score.toLocaleString()}</b></span><span class="gs">Best <b>${Math.max(best, score).toLocaleString()}</b></span>`); };

      function newGame() {
        blobs = []; queue = [1, 2, 1, 4].map((v) => v); current = 1; score = 0; startBest = best; cooldown = 0; danger = 0; over = false; paused = false;
        particles = []; popups = []; combo = 0; maxV = 1; aimX = W / 2; btnL = btnR = pressT = 0;
        overEl.hidden = true; pausedEl.hidden = true; backEl.hidden = true; api.setPaused(false);
        App.store.remove('mochiGame');
        showScore(); setPip('focused'); play('start', 1, 0.6);
        start();
      }
      function start() { cancelAnimationFrame(raf); lastT = performance.now(); raf = requestAnimationFrame(frame); }

      /* ---------- physics ---------- */
      function substep() {
        for (const b of blobs) {
          let vx = (b.x - b.px) * DAMP, vy = (b.y - b.py) * DAMP;
          const sp = Math.hypot(vx, vy); if (sp > 9) { vx *= 9 / sp; vy *= 9 / sp; }
          b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + G * SUB * SUB;
          if (b.y < b.r * 0.5) { b.y = b.r * 0.5; if (b.py < b.y) b.py = b.y; }   // soft ceiling: nothing escapes the jar
          b.a += b.av; b.av *= 0.985; b.touch = false;
        }
        const merges = [];
        for (let it = 0; it < 3; it++) {
          for (let i = 0; i < blobs.length; i++) {
            const a = blobs[i];
            for (let j = i + 1; j < blobs.length; j++) {
              const b = blobs[j];
              const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * SOFT;
              if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue;
              const d2 = dx * dx + dy * dy; if (d2 >= rr * rr) continue;
              const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d;
              if (a.v === b.v && !a.merging && !b.merging) { a.merging = b.merging = true; merges.push([a, b]); continue; }
              const ma = a.r * a.r, mb = b.r * b.r, ov = (rr - d) * 0.5;
              const wa = mb / (ma + mb), wb = ma / (ma + mb);
              a.x -= nx * ov * wa; a.y -= ny * ov * wa; b.x += nx * ov * wb; b.y += ny * ov * wb;
              a.px -= nx * ov * wa * 0.75; a.py -= ny * ov * wa * 0.75; b.px += nx * ov * wb * 0.75; b.py += ny * ov * wb * 0.75;
              roll(a, -nx, -ny); roll(b, nx, ny);
              if (it === 0) { landCheck(a, -nx, -ny); landCheck(b, nx, ny); }
            }
          }
          for (const b of blobs) { walls(b, it === 0); buttons(b); }
        }
        btnL += ((touchL ? 1 : 0) - btnL) * 0.03; btnR += ((touchR ? 1 : 0) - btnR) * 0.03;   // slide in while leaned on, spring back out when free
        touchL = touchR = false;
        merges.forEach(([a, b]) => merge(a, b));
      }
      // rolling: tangential motion along a contact spins the blob a little (so its number tilts, like a real soft body)
      function roll(b, nx, ny) {
        b.touch = true;
        const vx = b.x - b.px, vy = b.y - b.py, vt = vx * -ny + vy * nx;
        b.av += ((vt / b.r) - b.av) * 0.12;
      }
      function buttons(b) {
        for (const side of [-1, 1]) {
          const cx = btnX(side), dx = b.x - cx, dy = b.y - BY, d = Math.hypot(dx, dy), min = BR + b.r * 0.965;
          if (d < min + 5 && clock - b.born > 0.8) { if (side < 0) touchL = true; else touchR = true; }   // a resting blob leans on it
          if (d >= min || d < 0.01) continue;
          const ov = min - d, nx = dx / d, ny = dy / d;
          b.x += nx * ov * 0.8; b.y += ny * ov * 0.8; b.px += nx * ov * 0.6; b.py += ny * ov * 0.6;
        }
      }
      function landCheck(b, nx, ny) {
        if (b.landed) return;
        const sp = Math.hypot(b.x - b.px, b.y - b.py);
        b.landed = true;
        if (sp > 1.2) { play('land', 1.15 - Math.min(0.4, b.r / 300), Math.min(1, sp / 8)); b.jig = Math.min(0.13, sp * 0.03); b.jdir = Math.atan2(ny, nx); }
      }
      function walls(b, first) {
        const rr = b.r * 0.965;
        for (const w of LINES) {
          const ex = w.x2 - w.x1, ey = w.y2 - w.y1, l2 = ex * ex + ey * ey;
          let t = ((b.x - w.x1) * ex + (b.y - w.y1) * ey) / l2; t = Math.max(0, Math.min(1, t));
          const cx = w.x1 + ex * t, cy = w.y1 + ey * t;
          let dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
          const inside = w.nx * b.x + w.ny * b.y - w.c;
          if (inside < 0) { dx = w.nx; dy = w.ny; d = -inside; b.x += w.nx * (rr - inside); b.y += w.ny * (rr - inside); }
          else if (d < rr) {
            const nx = dx / (d || 1), ny = dy / (d || 1), push = rr - d;
            b.x += nx * push; b.y += ny * push;
            // friction + low restitution against the jar
            const vx = b.x - b.px, vy = b.y - b.py, vn = vx * nx + vy * ny;
            const tx = vx - vn * nx, ty = vy - vn * ny;
            const nvn = vn < 0 ? -vn * 0.08 : vn;
            b.px = b.x - (tx * 0.9 + nvn * nx); b.py = b.y - (ty * 0.9 + nvn * ny);
            roll(b, nx, ny);
            if (first) landCheck(b, nx, ny);
          }
        }
      }
      function merge(a, b) {
        if (!blobs.includes(a) || !blobs.includes(b)) return;
        const ma = a.r * a.r, mb = b.r * b.r, x = (a.x * ma + b.x * mb) / (ma + mb), y = (a.y * ma + b.y * mb) / (ma + mb);
        const v = a.v * 2, nb = makeBlob(x, y, v, Math.max(a.r, b.r));
        nb.px = x - ((a.x - a.px) + (b.x - b.px)) * 0.25; nb.py = y - ((a.y - a.py) + (b.y - b.py)) * 0.25 + 0.6;
        nb.a = Math.abs(a.r - b.r) < 1 ? (a.a + b.a) / 2 : (a.r > b.r ? a.a : b.a); nb.landed = true; nb.jig = 0.16; nb.jdir = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2; nb.born = clock - 5;
        blobs = blobs.filter((o) => o !== a && o !== b); blobs.push(nb);
        score += v; maxV = Math.max(maxV, v);
        const k = Math.log2(v);
        combo = clock - lastMerge < 1.1 ? combo + 1 : 0; lastMerge = clock;
        play('merge-' + String(Math.min(13, k)).padStart(2, '0'), 1, 0.9);
        if (combo >= 1) { const steps = [1, 1.125, 1.25, 1.5, 1.667, 2]; play('combo', steps[Math.min(combo - 1, 5)], 0.5); }
        burst(x, y, colorOf(v), nb.tr);
        popups.push({ x, y: y - nb.tr * 0.2, txt: '+' + v + (combo >= 1 ? '  ×' + (combo + 1) : ''), t: 0 });
        if (v >= 2048 && !App.store.get('mochiMade2048', false)) { App.store.set('mochiMade2048', true); api.celebrate('You made 2048!', 'A mochi the size of a moon.'); setPip('celebrate', 3000); }
        else if (k >= 7 || combo >= 2) setPip(combo >= 2 ? 'laugh' : 'happy', 1400);
        if (score > best) { best = score; App.scores.submit('2048', 'best', score); }
        showScore();
      }
      function burst(x, y, color, r) {
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4, s = 120 + Math.random() * 160; particles.push({ x: x + Math.cos(a) * r * 0.6, y: y + Math.sin(a) * r * 0.6, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, r: 4 + Math.random() * 5, color, t: 0 }); }
        particles.push({ ring: true, x, y, r: r * 0.7, t: 0 });
      }
      function drop() {
        if (over || paused || cooldown > 0) return;
        App.audio.init(); loadSfx();
        const r = radiusOf(current), x = App.clamp(aimX, L + r, R - r);
        const b = makeBlob(x, DROP_Y, current); b.py = DROP_Y - 1.2; b.landed = false;
        blobs.push(b);
        play('drop', 1 + (5 - Math.min(5, Math.log2(current))) * 0.04, 0.7);
        current = queue.shift(); queue.push(nextValue());
        cooldown = 0.42;
      }

      /* ---------- loop ---------- */
      function frame(now) {
        const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
        if (!paused && !over) {
          clock += dt; acc += dt;
          if (keys.ArrowLeft || keys.a) aimX -= 420 * dt;
          if (keys.ArrowRight || keys.d) aimX += 420 * dt;
          aimX = App.clamp(aimX, L, R);
          cooldown = Math.max(0, cooldown - dt);
          while (acc >= SUB) { substep(); acc -= SUB; }
          for (const b of blobs) { b.r += (b.tr - b.r) * Math.min(1, dt * 14); b.jig *= Math.pow(0.02, dt); b.merging = false; }
          // danger: any settled blob poking above the line
          const both = btnL > 0.95 && btnR > 0.95;
          pressT = both ? pressT + dt : Math.max(0, pressT - dt * 1.5);
          danger = Math.min(1, Math.max(pressT / PRESS_LIMIT, Math.min(btnL, btnR) * 0.55));
          if (pressT >= PRESS_LIMIT) gameOver();
          saveTick += dt; if (saveTick > 2) { saveTick = 0; save(); }
        }
        particles.forEach((p) => { p.t += dt; if (!p.ring) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; } });
        particles = particles.filter((p) => p.t < (p.ring ? 0.45 : 0.7));
        popups.forEach((p) => { p.t += dt; p.y -= 40 * dt; }); popups = popups.filter((p) => p.t < 1);
        drawPip();
        render();
        if (!paused && !(over && !particles.length && !popups.length)) raf = requestAnimationFrame(frame);
      }

      /* ---------- drawing ---------- */
      function blobPath(b, list, time, rOverride) {
        const r = rOverride || b.r, pts = [];
        for (let k = 0; k < RAYS; k++) {
          const th = (k / RAYS) * Math.PI * 2, ux = Math.cos(th), uy = Math.sin(th), lt = th - (b.a || 0);
          let len = r * (1 + (b.h2 || 0.06) * Math.cos(2 * lt + b.s1) + (b.h3 || 0.04) * Math.sin(3 * lt + b.s2) + 0.02 * Math.sin(5 * lt + (b.s3 || 0)) + 0.008 * Math.sin(time * 1.6 + b.s1 + th * 2));
          if (b.jig > 0.002) len *= 1 + b.jig * Math.cos(2 * (th - b.jdir)) * Math.cos(time * 22);
          if (list) {
            for (const o of list) {
              if (o === b) continue;
              const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
              if (d >= r + o.r || d < 0.01) continue;
              const c = (ux * dx + uy * dy) / d; if (c <= 0.02) continue;
              const a = (d * d + r * r - o.r * o.r) / (2 * d);
              len = Math.min(len, Math.max(r * 0.25, (a - GAP / 2) / c));
            }
            for (const side of [-1, 1]) {   // flatten against the side buttons too
              const dx = btnX(side) - b.x, dy = BY - b.y, d = Math.hypot(dx, dy);
              if (d >= r + BR) continue;
              const c = (ux * dx + uy * dy) / d; if (c <= 0.02) continue;
              len = Math.min(len, Math.max(r * 0.25, (d - BR - GAP) / c));
            }
            for (const w of LINES) {
              const dn = w.nx * ux + w.ny * uy; if (dn >= 0) continue;
              const dc = w.nx * b.x + w.ny * b.y - w.c;
              len = Math.min(len, Math.max(4, (dc - 1.5) / -dn));
            }
          }
          pts.push([b.x + ux * len, b.y + uy * len]);
        }
        const p = new Path2D(), n = pts.length, g = (i) => pts[(i + n) % n];
        p.moveTo(pts[0][0], pts[0][1]);
        for (let i = 0; i < n; i++) {
          const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
          p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
        }
        p.closePath();
        return p;
      }
      function label(x, y, v, r, alpha = 1, ang = 0) {
        ctx2.save(); ctx2.translate(x, y); ctx2.rotate(ang); x = 0; y = 0;
        const size = Math.max(11, Math.min(46, r * (v >= 1000 ? 0.36 : 0.44)));
        ctx2.font = `${size}px ${FONT}`; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
        ctx2.fillStyle = r < 26 ? `rgba(20,22,26,${0.5 * alpha})` : `rgba(20,22,26,${0.82 * alpha})`;
        ctx2.fillText(String(v), x, y + size * 0.04);
        ctx2.restore();
      }
      function jarPath(inset) {
        const p = new Path2D();
        p.moveTo(L - inset, T - inset); p.lineTo(L - inset, B - CH + inset * 0.41); p.lineTo(L + CH - inset * 0.41, B + inset);
        p.lineTo(R - CH + inset * 0.41, B + inset); p.lineTo(R + inset, B - CH + inset * 0.41); p.lineTo(R + inset, T - inset); p.closePath();
        return p;
      }
      function render() {
        const c = ctx2;
        c.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#121315'; c.fill(jarPath(0));
        // the side buttons (drawn inside the jar, pushed in by the pile)
        c.save(); c.clip(jarPath(0));
        [[-1, btnL], [1, btnR]].forEach(([side, p]) => {
          const hot = p > 0.9;
          c.fillStyle = hot ? '#ff6f8a' : '#d4566e'; c.strokeStyle = '#63c2b8'; c.lineWidth = 5;
          c.beginPath(); c.arc(btnX(side), BY, BR, 0, Math.PI * 2); c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(btnX(side) - side * 4, BY - 10, 6, 0, Math.PI * 2); c.fill();
        });
        c.restore();
        // aim guide + held piece
        if (!over) {
          const r = radiusOf(current), x = App.clamp(aimX, L + r, R - r);
          c.save(); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 2; c.setLineDash([3, 9]);
          c.beginPath(); c.moveTo(x, DROP_Y + r + 6); c.lineTo(x, B - 8); c.stroke(); c.restore();
          c.globalAlpha = cooldown > 0 ? 0.35 : 1;
          const ghost = { x, y: DROP_Y, r, v: current, s1: 1.2, s2: 2.4, s3: 0.7, h2: 0.07, h3: 0.04, a: 0, jig: 0, jdir: 0 };
          c.fillStyle = colorOf(current); c.fill(blobPath(ghost, null, clock)); label(x, DROP_Y, current, r);
          c.globalAlpha = 1;
        }
        // blobs
        for (const b of blobs) {
          c.fillStyle = colorOf(b.v); c.fill(blobPath(b, blobs, clock));
          label(b.x, b.y, b.v, b.r, 1, b.a);
        }
        // particles + popups
        for (const p of particles) {
          if (p.ring) { const k = p.t / 0.45; c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.r + k * 40, 0, Math.PI * 2); c.stroke(); continue; }
          c.globalAlpha = 1 - p.t / 0.7; c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.r * (1 - p.t / 1.4), 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
        }
        c.textAlign = 'center';
        for (const p of popups) { c.globalAlpha = 1 - p.t; c.font = `22px ${FONT}`; c.fillStyle = '#f2efe9'; c.fillText(p.txt, p.x, p.y); c.globalAlpha = 1; }
        // queue of upcoming blobs
        const q = queue.slice(0, 4); let qx = W / 2 - q.reduce((s, v) => s + Math.max(14, radiusOf(v) * 0.5) * 2 + 10, -10) / 2;
        q.forEach((v, i) => {
          const r = Math.max(14, radiusOf(v) * 0.5); qx += r;
          c.globalAlpha = 1 - i * 0.16; c.fillStyle = colorOf(v);
          c.fill(blobPath({ x: qx, y: QUEUE_Y, r, v, s1: i * 1.7, s2: i * 2.3, s3: i, h2: 0.08, h3: 0.04, a: 0, jig: 0 }, null, clock));
          label(qx, QUEUE_Y, v, r, 0.9); c.globalAlpha = 1; qx += r + 10;
        });
        // the jar frame (drawn last so it sits on top)
        c.lineJoin = 'round'; c.lineCap = 'round';
        c.strokeStyle = '#63c2b8'; c.lineWidth = 14; c.stroke(jarPath(7));
        c.beginPath(); c.moveTo(L - 7, T - 7); c.lineTo(R + 7, T - 7); c.stroke();
        // danger meters in the lid
        [[L + 14, L + 170], [R - 170, R - 14]].forEach(([a, b2], i) => {
          c.strokeStyle = '#121315'; c.lineWidth = 7; c.beginPath(); c.moveTo(a, T - 7); c.lineTo(b2, T - 7); c.stroke();
          const f = Math.min(1, danger); if (f > 0.01) { c.strokeStyle = '#d4566e'; c.beginPath(); if (i === 0) { c.moveTo(a, T - 7); c.lineTo(a + (b2 - a) * f, T - 7); } else { c.moveTo(b2, T - 7); c.lineTo(b2 - (b2 - a) * f, T - 7); } c.stroke(); }
        });
        // lid ticks and combo lamps
        c.fillStyle = 'rgba(99,194,184,.55)'; [0.3, 0.43, 0.57, 0.7].forEach((f) => { c.beginPath(); c.arc(L + (R - L) * f, T + 4, 2.4, 0, Math.PI * 2); c.fill(); });
        [[L - 7, btnL], [R + 7, btnR]].forEach(([x, p]) => {   // slot in the wall that the button slides into
          c.fillStyle = '#121315'; c.fillRect(x - 3.5, BY - BR - 14, 7, BR * 2 + 28);
          c.fillStyle = p > 0.9 ? '#ff6f8a' : 'rgba(212,86,110,.55)'; c.fillRect(x - 3.5, BY + BR + 14 - (BR * 2 + 28) * p, 7, (BR * 2 + 28) * p);
        });
      }

      /* ---------- game over / results ---------- */
      function gameOver() {
        over = true; danger = 1; App.store.remove('mochiGame');
        App.scores.bump('2048', 'plays');
        const list = App.store.update('mochiScores', [], (a) => { a.push({ s: score, at: Date.now(), max: maxV }); a.sort((x, y) => y.s - x.s); return a.slice(0, 10); });
        const isBest = score > startBest && startBest > 0;
        play(isBest ? 'newbest' : 'gameover', 1, 0.8);
        results(isBest, list);
      }
      function results(isBest, list) {
        overEl.hidden = false; backEl.hidden = true;
        overEl.innerHTML = `
          <div class="mo-inner">
            <span class="mo-label">${isBest ? 'new best!' : 'final score'}</span>
            <b class="mo-score">${score}</b>
            <span class="mo-sub">biggest mochi: ${maxV}</span>
            <div class="mo-btns">
              <button type="button" class="mochi-btn" data-m="new">new game</button>
              <button type="button" class="mochi-btn" data-m="view">view</button>
              <button type="button" class="mochi-btn alt" data-m="scores">scores</button>
              <button type="button" class="mochi-btn alt" data-m="menu">menu</button>
            </div>
          </div>`;
        overEl.querySelector('button').focus({ preventScroll: true });
        drawPip();
      }
      function scoresView() {
        const list = App.store.get('mochiScores', []);
        overEl.innerHTML = `<div class="mo-inner"><span class="mo-label">top scores</span>
          <ol class="mo-list">${list.length ? list.map((x, i) => `<li><span>${i + 1}</span><b>${x.s}</b><small>${esc(new Date(x.at).toLocaleDateString())} · ${x.max}</small></li>`).join('') : '<li class="mo-none">no games yet</li>'}</ol>
          <div class="mo-btns"><button type="button" class="mochi-btn" data-m="results">back</button></div></div>`;
      }

      /* ---------- pause / save / restore ---------- */
      function setPause(p) {
        if (over) return;
        paused = p; pausedEl.hidden = !p; api.setPaused(p);
        if (p) { save(); cancelAnimationFrame(raf); drawPip(); render(); } else start();
      }
      function save() { if (!over && blobs.length) App.store.set('mochiGame', { blobs: blobs.map((b) => ({ x: Math.round(b.x), y: Math.round(b.y), v: b.v })), score, queue, current, maxV }); }
      function restore() {
        const s = App.store.get('mochiGame', null);
        if (!s || !Array.isArray(s.blobs) || !s.blobs.length) return false;
        newGameState();
        blobs = s.blobs.filter((b) => b && COLORS[b.v] && b.x > L && b.x < R && b.y < B).map((b) => { const n = makeBlob(b.x, b.y, b.v); n.landed = true; n.born = -10; return n; });
        score = +s.score || 0; queue = Array.isArray(s.queue) && s.queue.length === 4 ? s.queue : [1, 2, 1, 4]; current = s.current || 1; maxV = s.maxV || 1;
        showScore(); start(); return true;
      }
      function newGameState() { btnL = btnR = pressT = 0; blobs = []; particles = []; popups = []; danger = 0; over = false; paused = false; cooldown = 0; startBest = best; overEl.hidden = true; }

      /* ---------- sizing ---------- */
      const jar = $('.mochi-jar', stage);
      const fit = () => {
        const rect = jar.getBoundingClientRect();
        const maxH = Math.max(320, window.innerHeight - (window.innerWidth < 760 ? 250 : 210));
        const w = Math.min(rect.width, maxH * (W / H));
        dpr = Math.min(2, window.devicePixelRatio || 1); scale = w / W;
        canvas.style.width = w + 'px'; canvas.style.height = w * (H / W) + 'px';
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * (H / W) * dpr);
        if (blobs) render();
      };
      let lastW = 0;
      const ro = new ResizeObserver(() => requestAnimationFrame(() => { const w = jar.getBoundingClientRect().width; if (Math.abs(w - lastW) > 1) { lastW = w; fit(); } })); ro.observe(jar);

      /* ---------- input ---------- */
      const toWorld = (e) => { const r = canvas.getBoundingClientRect(); return (e.clientX - r.left) / scale; };
      let pressing = false;
      canvas.addEventListener('pointermove', (e) => { aimX = toWorld(e); });
      canvas.addEventListener('pointerdown', (e) => { pressing = true; aimX = toWorld(e); App.audio.init(); loadSfx(); canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointerup', (e) => { if (!pressing) return; pressing = false; aimX = toWorld(e); drop(); });
      canvas.addEventListener('pointercancel', () => { pressing = false; });
      const onKey = (e) => {
        if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
        if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) { keys[e.key] = e.type === 'keydown'; e.preventDefault(); }
        if (e.type === 'keydown' && [' ', 'ArrowDown', 'Enter'].includes(e.key) && !e.target.closest('button')) { e.preventDefault(); drop(); }
        if (e.type === 'keydown' && (e.key === 'p' || e.key === 'P')) setPause(!paused);
      };
      document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKey);
      stage.addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]'); if (!b) return;
        const a = b.dataset.m;
        play('click', 1, 0.5);
        if (a === 'new') newGame();
        if (a === 'resume') setPause(false);
        if (a === 'view') { overEl.hidden = true; backEl.hidden = false; }
        if (a === 'results') results(score > startBest && startBest > 0, null);
        if (a === 'scores') scoresView();
        if (a === 'menu') App.go('#/games');
        if (a === 'mute') {
          const m = !App.store.get('mochiPrefs', { muted: false }).muted; App.store.set('mochiPrefs', { muted: m });
          b.innerHTML = icon(m ? 'mute' : 'volume'); b.setAttribute('aria-pressed', m); b.setAttribute('aria-label', (m ? 'Unmute' : 'Mute') + ' sounds');
        }
      });

      (document.fonts && document.fonts.load ? document.fonts.load(`40px Righteous`).catch(() => {}) : Promise.resolve()).then(() => { if (blobs) render(); });
      fit();
      if (!restore()) newGame();
      loadSfx();
      return {
        restart: newGame,
        togglePause: () => setPause(!paused),
        pause: () => setPause(true),
        destroy: () => { cancelAnimationFrame(raf); save(); ro.disconnect(); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey); },
      };
    },
  };
})();

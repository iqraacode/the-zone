/* Zone — audio: a small generative music engine (Web Audio), the persistent player,
   the ambient sound mixer and the focus timer.
   Every catalogue track is composed live from a seed, so playback is real, original and licence-free. */
(function () {
  'use strict';
  const App = window.App;
  const A = (App.audio = {});
  let ctx = null, master, musicBus, ambientBus, analyser, ambAnalyser, impulseBuf;
  const noise = {};
  const AMB_BOOST = 3.2;   // ambience beds are soft noise; lift them so they're clearly audible (the compressor catches peaks)

  /* ---------------- context + shared buffers ---------------- */
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    master.connect(comp); comp.connect(ctx.destination);
    analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.82;
    musicBus = ctx.createGain(); musicBus.connect(analyser); analyser.connect(master);
    ambientBus = ctx.createGain(); ambAnalyser = ctx.createAnalyser(); ambAnalyser.fftSize = 512; ambientBus.connect(ambAnalyser); ambAnalyser.connect(master);
    const sr = ctx.sampleRate;
    const mk = (sec, fill) => { const b = ctx.createBuffer(1, sr * sec, sr); fill(b.getChannelData(0)); return b; };
    noise.white = mk(2, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    noise.pink = mk(4, (d) => { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; } });
    noise.brown = mk(4, (d) => { let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } });
    impulseBuf = ctx.createBuffer(2, sr * 3, sr);
    for (let c = 0; c < 2; c++) { const d = impulseBuf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6); }
    A.setVolume(App.player ? App.player.state.volume : 0.8);
    ambientBus.gain.value = App.settings.get('ambientVolume') * AMB_BOOST;
    return ctx;
  }
  A.init = init;
  A.ctx = () => ctx;
  A.setVolume = (v) => { if (musicBus) musicBus.gain.setTargetAtTime(v * v, ctx.currentTime, 0.05); };
  A.setAmbientMaster = (v) => { if (ambientBus) ambientBus.gain.setTargetAtTime(v * AMB_BOOST, ctx.currentTime, 0.05); };
  /* loudness of the ambience mix (0..1) — drives the little meter on active sounds */
  A.ambientLevel = () => {
    if (!ambAnalyser) return 0;
    const d = new Float32Array(ambAnalyser.fftSize); ambAnalyser.getFloatTimeDomainData(d);
    let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
    return Math.min(1, Math.sqrt(sum / d.length) * 4);
  };
  A.levels = (n) => {
    if (!analyser) return null;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    // spread bars on a curved scale so treble gets its share; lift higher bands a little
    const out = [], L = data.length * 0.8;
    for (let i = 0; i < n; i++) {
      const a = Math.floor(L * Math.pow(i / n, 1.8)), b = Math.max(a + 1, Math.floor(L * Math.pow((i + 1) / n, 1.8)));
      let s = 0; for (let j = a; j < b; j++) s += data[j];
      out.push(Math.min(1, (s / (b - a) / 255) * (1 + i / n * 1.6)));
    }
    return out;
  };

  /* ---------------- synthesis primitives ---------------- */
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function osc(type, f, t, dest, stop) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(stop); return o; }
  function env(dest, t, a, peak, dec, sus, hold, rel) {
    const g = ctx.createGain(), p = Math.max(0.0002, peak), s = Math.max(0.0001, p * sus), h = Math.max(a + dec, hold);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(p, t + a);
    g.gain.exponentialRampToValueAtTime(s, t + a + dec);
    g.gain.setValueAtTime(s, t + h);
    g.gain.exponentialRampToValueAtTime(0.0001, t + h + rel);
    g.connect(dest);
    return { g, end: t + h + rel + 0.05 };
  }
  function filt(type, f, dest, q) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; b.connect(dest); return b; }
  function noiseSrc(kind, t, dest, stop, loop) { const s = ctx.createBufferSource(); s.buffer = noise[kind]; s.loop = !!loop; s.connect(dest); s.start(t, Math.random() * 1.5); if (stop) s.stop(stop); return s; }

  const V = {
    epiano(d, f, t, dur, v) {
      const lp = filt('lowpass', 2300, d);
      const e = env(lp, t, 0.006, v, 0.55, 0.4, dur, 0.55);
      osc('sine', f, t, e.g, e.end);
      const g2 = ctx.createGain(); g2.gain.value = 0.22; g2.connect(e.g); osc('triangle', f, t, g2, e.end);
      const e3 = env(lp, t, 0.003, v * 0.25, 0.12, 0.01, 0.15, 0.05); osc('sine', f * 4, t, e3.g, e3.end);
    },
    piano(d, f, t, dur, v) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.connect(d);
      lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.2), t + 1.2);
      const tail = Math.min(3.2, 0.9 + 160 / f);
      const e = env(lp, t, 0.004, v, tail, 0.02, Math.min(dur, tail), 0.25);
      osc('triangle', f, t, e.g, e.end);
      const g2 = ctx.createGain(); g2.gain.value = 0.35; g2.connect(e.g); osc('sine', f * 2, t, g2, e.end);
      const g3 = ctx.createGain(); g3.gain.value = 0.08; g3.connect(e.g); osc('sine', f * 3.01, t, g3, e.end);
    },
    bell(d, f, t, v) {
      const e = env(d, t, 0.005, v, 2.8, 0.01, 2.8, 0.4); osc('sine', f, t, e.g, e.end);
      const e2 = env(d, t, 0.003, v * 0.3, 0.9, 0.01, 0.9, 0.2); osc('sine', f * 2.76, t, e2.g, e2.end);
    },
    pluck(d, f, t, v, bright = 1600) {
      const lp = filt('lowpass', bright, d, 2);
      const e = env(lp, t, 0.004, v, 0.28, 0.05, 0.3, 0.12); osc('triangle', f, t, e.g, e.end); osc('square', f * 0.5, t, (() => { const g = ctx.createGain(); g.gain.value = 0.12; g.connect(e.g); return g; })(), e.end);
    },
    pad(d, notes, t, dur, v, soft) {
      const lp = filt('lowpass', soft ? 700 : 1100, d, 0.4);
      const e = env(lp, t, Math.min(1.6, dur * 0.35), v, 0.6, 0.85, dur, 1.8);
      notes.forEach((n) => { const f = mtof(n); osc(soft ? 'triangle' : 'sawtooth', f, t, e.g, e.end).detune.value = 7; osc(soft ? 'sine' : 'sawtooth', f, t, e.g, e.end).detune.value = -7; });
    },
    bass(d, f, t, dur, v) {
      const lp = filt('lowpass', 520, d);
      const e = env(lp, t, 0.012, v, 0.25, 0.65, dur, 0.12);
      osc('sine', f, t, e.g, e.end);
      const g = ctx.createGain(); g.gain.value = 0.35; g.connect(e.g); osc('triangle', f, t, g, e.end);
    },
    kick(d, t, v) {
      const g = ctx.createGain(); g.connect(d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); o.connect(g); o.start(t); o.stop(t + 0.4);
    },
    snare(d, t, v) {
      const lp = filt('lowpass', 3200, d); const bp = filt('bandpass', 1800, lp, 0.7);
      const e = env(bp, t, 0.002, v, 0.16, 0.01, 0.16, 0.05); noiseSrc('white', t, e.g, e.end);
      const e2 = env(lp, t, 0.002, v * 0.4, 0.08, 0.01, 0.08, 0.03); osc('triangle', 185, t, e2.g, e2.end);
    },
    hat(d, t, v, open) { const hp = filt('highpass', 7200, d); const e = env(hp, t, 0.001, v, open ? 0.24 : 0.045, 0.01, open ? 0.24 : 0.045, 0.02); noiseSrc('white', t, e.g, e.end); },
    ride(d, t, v) { const bp = filt('bandpass', 6200, d, 2.5); const e = env(bp, t, 0.001, v, 0.5, 0.05, 0.5, 0.1); noiseSrc('white', t, e.g, e.end); const e2 = env(d, t, 0.001, v * 0.06, 0.4, 0.05, 0.4, 0.1); osc('square', 3920, t, e2.g, e2.end); },
    brush(d, t, v) { const bp = filt('bandpass', 3000, d, 0.6); const e = env(bp, t, 0.03, v, 0.22, 0.05, 0.22, 0.08); noiseSrc('white', t, e.g, e.end); },
    click(d, t, v) { const hp = filt('highpass', 2500, d); const e = env(hp, t, 0.0005, v, 0.004, 0.01, 0.004, 0.003); noiseSrc('white', t, e.g, e.end); },
    drop(d, t, v) { const g = ctx.createGain(); g.connect(d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.06); const o = ctx.createOscillator(); const f = 1800 + Math.random() * 2400; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.05); o.connect(g); o.start(t); o.stop(t + 0.07); },
    chirp(d, t, v) {
      const n = 2 + Math.floor(Math.random() * 4), base = 2600 + Math.random() * 2200;
      for (let i = 0; i < n; i++) { const tt = t + i * (0.08 + Math.random() * 0.06); const g = ctx.createGain(); g.connect(d); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07); const o = ctx.createOscillator(); o.frequency.setValueAtTime(base * (1 + Math.random() * 0.2), tt); o.frequency.exponentialRampToValueAtTime(base * (0.7 + Math.random() * 0.6), tt + 0.06); o.connect(g); o.start(tt); o.stop(tt + 0.08); }
    },
    crackle(d, t, v) { const bp = filt('bandpass', 1500 + Math.random() * 3500, d, 1.2); const len = 0.004 + Math.random() * 0.02; const e = env(bp, t, 0.0008, v, len, 0.01, len, 0.01); noiseSrc('white', t, e.g, e.end); },
    clink(d, t, v) { const f = 2600 + Math.random() * 1600; const e = env(d, t, 0.001, v, 0.35, 0.01, 0.35, 0.1); osc('sine', f, t, e.g, e.end); const e2 = env(d, t, 0.001, v * 0.5, 0.2, 0.01, 0.2, 0.1); osc('sine', f * 2.4, t, e2.g, e2.end); },
  };

  /* continuous noise beds (return a stopper) */
  function lfo(rate, depth, param, base) { const o = ctx.createOscillator(); o.frequency.value = rate; const g = ctx.createGain(); g.gain.value = depth; o.connect(g); g.connect(param); if (base != null) param.value = base; o.start(); return o; }
  const BEDS = {
    rain(d, lvl) { const g = ctx.createGain(); g.gain.value = 0.55 * lvl; g.connect(d); const hp = filt('highpass', 350, g); const lp = filt('lowpass', 5200, hp); const a = noiseSrc('pink', ctx.currentTime, lp, 0, true); const g2 = ctx.createGain(); g2.gain.value = 0.35 * lvl; g2.connect(d); const b = noiseSrc('brown', ctx.currentTime, filt('lowpass', 700, g2), 0, true); return [a, b]; },
    wind(d, lvl) { const g = ctx.createGain(); g.gain.value = 0.9 * lvl; g.connect(d); const bp = filt('bandpass', 420, g, 0.8); const s = noiseSrc('brown', ctx.currentTime, bp, 0, true); const l1 = lfo(0.07, 260, bp.frequency, 460); const l2 = lfo(0.045, 0.35 * lvl, g.gain, 0.85 * lvl); return [s, l1, l2]; },
    ocean(d, lvl) { const g = ctx.createGain(); g.connect(d); const lp = filt('lowpass', 1100, g); const s = noiseSrc('pink', ctx.currentTime, lp, 0, true); const l = lfo(0.085, 0.42 * lvl, g.gain, 0.5 * lvl); const l2 = lfo(0.085, 500, lp.frequency, 1100); return [s, l, l2]; },
    stream(d, lvl) { const g = ctx.createGain(); g.connect(d); const bp = filt('bandpass', 2300, g, 0.6); const s = noiseSrc('white', ctx.currentTime, bp, 0, true); const l = lfo(0.33, 0.08 * lvl, g.gain, 0.26 * lvl); return [s, l]; },
    fire(d, lvl) { const g = ctx.createGain(); g.gain.value = 0.7 * lvl; g.connect(d); const s = noiseSrc('brown', ctx.currentTime, filt('lowpass', 380, g), 0, true); return [s]; },
    cafe(d, lvl) { const g = ctx.createGain(); g.connect(d); const bp = filt('bandpass', 620, g, 0.5); const s = noiseSrc('brown', ctx.currentTime, bp, 0, true); const l = lfo(0.21, 0.2 * lvl, g.gain, 0.7 * lvl); return [s, l]; },
    vinyl(d, lvl) { const g = ctx.createGain(); g.gain.value = 0.025 * lvl; g.connect(d); const s = noiseSrc('white', ctx.currentTime, filt('highpass', 1800, g), 0, true); return [s]; },
  };

  /* ---------------- music theory helpers ---------------- */
  const Q = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], sus: [0, 5, 7, 14], maj: [0, 4, 7], min: [0, 3, 7], m7b5: [0, 3, 6, 10] };
  const PENTA = [0, 2, 4, 7, 9], MAJOR = [0, 2, 4, 5, 7, 9, 11], HMINOR = [0, 2, 3, 5, 7, 8, 11];
  const voicing = (root, q, lo) => { let n = Q[q].map((i) => root + i); while (n[0] < lo) n = n.map((x) => x + 12); while (n[0] >= lo + 12) n = n.map((x) => x - 12); return n; };
  const low = (m, lo = 36) => { while (m < lo) m += 12; while (m >= lo + 12) m -= 12; return m; };
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const PROGS = {
    lofi: [[[2, 'm9'], [7, 'dom7'], [0, 'maj9'], [9, 'm7']], [[5, 'maj7'], [4, 'm7'], [9, 'm7'], [7, 'dom7']], [[0, 'maj7'], [9, 'm7'], [2, 'm7'], [7, 'dom7']]],
    ambient: [[[0, 'maj9'], [5, 'maj7'], [9, 'm9'], [7, 'sus']], [[0, 'sus'], [8, 'maj7'], [5, 'maj9'], [3, 'maj7']]],
    jazz: [[[2, 'm7'], [7, 'dom7'], [0, 'maj7'], [0, 'maj7'], [4, 'm7'], [9, 'dom7'], [2, 'm7'], [7, 'dom7']]],
    focus: [[[0, 'm7'], [8, 'maj7'], [3, 'maj7'], [10, 'dom7']], [[0, 'm9'], [5, 'm7'], [8, 'maj7'], [7, 'm7']]],
    sleep: [[[0, 'maj9'], [5, 'maj9'], [0, 'sus'], [7, 'sus']]],
  };

  /* ---------------- composers: one bar at a time, deterministic per (seed, bar) ---------------- */
  const COMPOSE = {
    lofi(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 7919 + bar * 131), [deg, q] = s.prog[bar % s.prog.length], root = s.root + deg;
      const intro = bar < 2, outro = bar >= s.bars - 2, drop = bar % 16 === 15;
      voicing(root, q, 52).forEach((n, i) => V.epiano(s.in, mtof(n), t + i * 0.016 + r() * 0.01, B * 1.9, 0.085));
      if (r() < 0.55) voicing(root, q, 55).slice(1).forEach((n, i) => V.epiano(s.in, mtof(n), t + B * 2.5 + i * 0.014, B * 1.1, 0.055));
      if (!intro) {
        V.bass(s.in, mtof(low(root)), t, B * 1.4, 0.3);
        if (r() < 0.7) V.bass(s.in, mtof(low(root)), t + B * 2.5, B * 0.45, 0.22);
        if (r() < 0.4) V.bass(s.in, mtof(low(root + 7)), t + B * 3.25, B * 0.4, 0.18);
      }
      if (!intro && !drop && !outro) {
        V.kick(s.in, t, 0.7); if (r() < 0.6) V.kick(s.in, t + B * 1.75, 0.45); V.kick(s.in, t + B * 2.5, 0.55);
        V.snare(s.in, t + B, 0.3); V.snare(s.in, t + B * 3, 0.33);
        for (let i = 0; i < 8; i++) V.hat(s.in, t + B * (Math.floor(i / 2) + (i % 2 ? 0.6 : 0)), i % 2 ? 0.05 + r() * 0.03 : 0.08 + r() * 0.03, i === 7 && r() < 0.3);
      }
      if (bar >= 8 && bar % 8 >= 4 && !outro) {
        const pr = App.rng(s.seed * 31 + Math.floor(bar / 8)), half = (bar % 8) % 2;
        for (let k = 0; k < 16; k++) { const hit = pr() < 0.32, note = s.root + 12 + PENTA[Math.floor(pr() * 5)] + (pr() < 0.3 ? 12 : 0); if (hit && Math.floor(k / 8) === half) V.epiano(s.in, mtof(note), t + B * ((k % 8) * 0.5 + (k % 2 ? 0.1 : 0)), B * 0.9, 0.06); }
      }
      for (let k = 0, n = 2 + Math.floor(r() * 5); k < n; k++) V.click(s.in, t + r() * B * 4, 0.03 + r() * 0.05);
    },
    ambient(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 6007 + bar * 17);
      if (bar % 2 === 0) { const [deg, q] = s.prog[(bar / 2) % s.prog.length]; V.pad(s.in, voicing(s.root + deg, q, 50), t, B * 8 + 1, 0.045); }
      if (bar % 4 === 0) V.bass(s.in, mtof(low(s.root + s.prog[(bar / 2) % s.prog.length][0], 33)), t, B * 15, 0.16);
      for (let k = 0, n = Math.floor(r() * 3); k < n; k++) V.bell(s.in, mtof(s.root + 24 + PENTA[Math.floor(r() * 5)]), t + r() * B * 4, 0.05);
    },
    sleep(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 4421 + bar * 7);
      if (bar % 2 === 0) { const [deg, q] = s.prog[(bar / 2) % s.prog.length]; V.pad(s.in, voicing(s.root + deg, q, 48), t, B * 8 + 1.5, 0.05, true); }
      if (r() < 0.35) V.bell(s.in, mtof(s.root + 19 + PENTA[Math.floor(r() * 5)]), t + r() * B * 4, 0.025);
    },
    classical(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 1013 + bar * 29);
      const prog = [0, 9, 5, 7, 0, 5, 7, 0], deg = prog[bar % 8], q = deg === 9 || deg === 2 || deg === 4 ? 'min' : 'maj';
      const tri = voicing(s.root + deg, q, 48), [a, b, c] = tri; const alb = [a, c, b, c, a, c, b, c];
      const outro = bar >= s.bars - 1;
      alb.forEach((n, i) => V.piano(s.in, mtof(n), t + i * B * 0.5 + r() * 0.008, B * 0.5, i % 4 === 0 ? 0.07 : 0.045));
      if (!outro) {
        const chordPcs = Q[q].map((x) => (s.root + deg + x) % 12);
        const rhythm = pick(r, [[0, 1, 2, 3], [0, 1.5, 2, 3], [0, 2, 3, 3.5], [0, 0.5, 1, 2]]);
        rhythm.forEach((pos, i) => {
          let m = s.last || s.root + 16;
          if (i === 0 || r() < 0.4) { let best = m, bd = 99; for (let x = m - 5; x <= m + 5; x++) if (chordPcs.includes(((x % 12) + 12) % 12) && Math.abs(x - m) < bd && x !== m) { best = x; bd = Math.abs(x - m); } m = best; }
          else { const step = r() < 0.5 ? 1 : -1; let x = m + step; while (!MAJOR.includes((((x - s.root) % 12) + 12) % 12)) x += step; m = x; }
          m = Math.max(s.root + 9, Math.min(s.root + 28, m)); s.last = m;
          const next = rhythm[i + 1] != null ? rhythm[i + 1] : 4;
          V.piano(s.in, mtof(m), t + pos * B, (next - pos) * B, 0.09);
        });
      } else V.piano(s.in, mtof(s.root + 24), t, B * 4, 0.08);
    },
    nocturne(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 991 + bar * 23);
      const prog = [[0, 'min'], [5, 'min'], [7, 'maj'], [0, 'min'], [8, 'maj'], [5, 'min'], [7, 'dom7'], [0, 'min']];
      const [deg, q] = prog[bar % 8], root = low(s.root + deg, 36), Qx = Q[q];
      const arp = [root, root + 7, root + 12 + Qx[1], root + 12 + Qx[2], root + 24, root + 12 + Qx[2]];
      for (let i = 0; i < 12; i++) V.piano(s.in, mtof(arp[i % 6]), t + (i * B) / 3 + r() * 0.01, B / 3, i % 6 === 0 ? 0.06 : 0.035);
      if (bar < s.bars - 1) {
        const pcs = Qx.map((x) => (s.root + deg + x) % 12);
        const n = r() < 0.5 ? 2 : 3;
        for (let k = 0; k < n; k++) {
          let m = s.last || s.root + 19; const dir = r() < 0.5 ? -1 : 1;
          let x = m + dir; for (let g = 0; g < 6 && !HMINOR.includes((((x - s.root) % 12) + 12) % 12); g++) x += dir;
          if (k === 0) { for (let y = m - 4; y <= m + 4; y++) if (pcs.includes(((y % 12) + 12) % 12)) { x = y; if (r() < 0.5) break; } }
          m = Math.max(s.root + 12, Math.min(s.root + 31, x)); s.last = m;
          const pos = k === 0 ? 0 : k === 1 ? (n === 2 ? 2 : 1.5) : 3;
          if (r() < 0.25 && k === 0) V.piano(s.in, mtof(m + 2), t - 0.09, 0.09, 0.05);
          V.piano(s.in, mtof(m), t + pos * B, B * 2, 0.085);
        }
      }
    },
    jazz(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 3571 + bar * 59), sw = 0.66;
      const [deg, q] = s.prog[bar % s.prog.length], root = s.root + deg, nextDeg = s.prog[(bar + 1) % s.prog.length][0];
      const tones = Q[q].map((x) => low(root + x, 36));
      const nextRoot = low(s.root + nextDeg, 36);
      const walk = [low(root, 36), pick(r, tones.slice(1)), pick(r, tones), nextRoot + (r() < 0.5 ? 1 : -1)];
      walk.forEach((m, i) => V.bass(s.in, mtof(m), t + i * B, B * 0.9, 0.28));
      [0, 1, 1 + sw, 2, 3, 3 + sw].forEach((p, i) => V.ride(s.in, t + p * B, i === 1 || i === 4 ? 0.09 : 0.06));
      V.hat(s.in, t + B, 0.05); V.hat(s.in, t + B * 3, 0.05);
      if (r() < 0.6) V.brush(s.in, t + (r() < 0.5 ? 1 : 3) * B, 0.05);
      const shell = [Q[q][1], Q[q][3] != null ? Q[q][3] : 7, 14].map((x) => root + x);
      const vo = voicing(root, q, 55).slice(1).concat([shell[2]]);
      const spots = pick(r, [[sw], [1 + sw, 3], [0, 2 + sw], [2], [sw, 2 + sw]]);
      spots.forEach((p) => vo.forEach((n, i) => V.epiano(s.in, mtof(n), t + p * B + i * 0.01, B * 0.7, 0.05)));
      if (bar >= 8 && bar % 8 < 4 && bar < s.bars - 2) {
        const pr = App.rng(s.seed * 77 + bar), scale = [0, 2, 3, 4, 7, 9, 10];
        for (let k = 0; k < 8; k++) if (pr() < 0.45) { const m = s.root + 12 + scale[Math.floor(pr() * scale.length)] + (pr() < 0.2 ? 12 : 0); V.epiano(s.in, mtof(m), t + (Math.floor(k / 2) + (k % 2 ? sw : 0)) * B, B * 0.5, 0.07); }
      }
    },
    focus(s, bar, t) {
      const B = s.beat, r = App.rng(s.seed * 2203 + bar * 41), [deg, q] = s.prog[Math.floor(bar / 2) % s.prog.length], root = s.root + deg;
      const ch = voicing(root, q, 57), seq = [0, 1, 2, 1, 3, 2, 1, 2, 0, 2, 1, 3, 2, 1, 2, 3];
      const bright = 900 + 900 * (0.5 + 0.5 * Math.sin(bar / 3));
      for (let i = 0; i < 16; i++) V.pluck(s.in, mtof(ch[seq[i] % ch.length] + (i >= 12 && r() < 0.3 ? 12 : 0)), t + (i * B) / 4, i % 4 === 0 ? 0.08 : 0.05, bright);
      if (bar % 2 === 0) V.pad(s.in, voicing(root, q, 45).slice(0, 3), t, B * 8, 0.03, true);
      if (bar >= 2 && bar < s.bars - 1) { V.kick(s.in, t, 0.4); V.kick(s.in, t + B * 2, 0.35); for (let i = 0; i < 4; i++) V.hat(s.in, t + B * (i + 0.5), 0.035); }
      V.bass(s.in, mtof(low(root, 36)), t, B * 3.5, 0.18);
    },
    rain(s, bar, t) { const r = App.rng(s.seed + bar * 3); for (let k = 0; k < 6; k++) if (r() < 0.6) V.drop(s.in, t + r() * 2, 0.012 + r() * 0.02); },
    forest(s, bar, t) { const r = App.rng(s.seed + bar * 5); if (r() < 0.45) V.chirp(s.in, t + r() * 2, 0.02 + r() * 0.02); if (r() < 0.1) V.chirp(s.in, t + r() * 2, 0.012); },
    ocean() {},
  };
  const BEDS_FOR = { lofi: [['vinyl', 1]], rain: [['rain', 1]], forest: [['stream', 0.8], ['wind', 0.25]], ocean: [['ocean', 1]], sleep: [['ocean', 0.12]] };

  /* ---------------- a playback session for one generative track ---------------- */
  function Session(track, offset, onEnd) {
    const s = this;
    s.track = track; s.seed = track.seed; s.root = track.root;
    s.beat = 60 / track.bpm;
    s.barDur = ['rain', 'forest', 'ocean'].includes(track.style) ? 2 : s.beat * 4;
    s.bars = Math.floor(track.duration / s.barDur);
    const pr = App.rng(track.seed);
    s.prog = PROGS[track.style] ? PROGS[track.style][Math.floor(pr() * PROGS[track.style].length)] : PROGS.lofi[0];
    s.out = ctx.createGain(); s.out.connect(musicBus);
    s.in = ctx.createGain();
    const tone = filt('lowpass', track.style === 'sleep' ? 1600 : track.style === 'lofi' ? 3600 : 9000, s.out);
    s.in.connect(tone);
    const send = ctx.createGain(); send.gain.value = { ambient: 0.7, sleep: 0.7, classical: 0.35, nocturne: 0.45, jazz: 0.2, lofi: 0.18, focus: 0.3 }[track.style] || 0.1;
    const verb = ctx.createConvolver(); verb.buffer = impulseBuf; s.in.connect(send); send.connect(verb); verb.connect(s.out);
    const now = ctx.currentTime + 0.06;
    s.t0 = now - offset;
    s.out.gain.setValueAtTime(0.0001, now); s.out.gain.exponentialRampToValueAtTime(1, now + 0.5);
    const end = s.t0 + track.duration;
    if (end - 4 > now) { s.out.gain.setValueAtTime(1, end - 4); s.out.gain.linearRampToValueAtTime(0.0001, end); }
    s.nextBar = Math.ceil(offset / s.barDur - 0.001);
    s.loops = [];
    (BEDS_FOR[track.style] || []).forEach(([b, lvl]) => (s.loops = s.loops.concat(BEDS[b](s.in, lvl))));
    s.tick = () => {
      const ahead = document.hidden ? 1.6 : 0.4;
      while (s.nextBar < s.bars && s.t0 + s.nextBar * s.barDur < ctx.currentTime + ahead) {
        try { COMPOSE[track.style](s, s.nextBar, Math.max(ctx.currentTime, s.t0 + s.nextBar * s.barDur)); } catch (e) { console.error(e); }
        s.nextBar++;
      }
      if (ctx.currentTime - s.t0 >= track.duration) { s.stop(0); onEnd && onEnd(); }
    };
    s.timer = setInterval(s.tick, 100);
    s.tick();
  }
  Session.prototype.position = function () { return Math.max(0, Math.min(this.track.duration, ctx.currentTime - this.t0)); };
  Session.prototype.stop = function (fade = 0.25) {
    clearInterval(this.timer);
    const t = ctx.currentTime;
    try { this.out.gain.cancelScheduledValues(t); this.out.gain.setValueAtTime(this.out.gain.value, t); this.out.gain.linearRampToValueAtTime(0.0001, t + fade + 0.01); } catch (e) {}
    const out = this.out, loops = this.loops;
    setTimeout(() => { loops.forEach((n) => { try { n.stop(); } catch (e) {} }); try { out.disconnect(); } catch (e) {} }, (fade + 0.1) * 1000);
  };

  /* ======================= the player ======================= */
  const saved = App.store.get('player', { queue: [], index: -1, shuffle: false, repeat: 'off', volume: 0.8, position: 0 });
  const P = (App.player = {
    state: Object.assign({ playing: false, loading: false }, saved),
    session: null, el: null,
  });
  P.state.playing = false;
  const persist = App.throttle(() => {
    const st = P.state;
    App.store.set('player', { queue: st.queue, index: st.index, shuffle: st.shuffle, repeat: st.repeat, volume: st.volume, position: P.position() });
  }, 2000);
  const changed = () => { App.emit('player', P.state); persist(); updateMediaSession(); };
  P.current = () => App.content.track(P.state.queue[P.state.index]);
  P.duration = () => { const t = P.current(); if (!t) return 0; if (t.url) return P.el && isFinite(P.el.duration) ? P.el.duration : t.duration || 0; return t.duration; };
  P.position = () => { const t = P.current(); if (!t) return 0; if (t.url) return P.el ? P.el.currentTime : 0; return P.session ? P.session.position() : P.state.position || 0; };

  function stopAll() {
    if (P.session) { P.session.stop(); P.session = null; }
    if (P.el) { P.el.pause(); }
  }
  function start(offset) {
    const t = P.current(); if (!t) return;
    stopAll();
    if (t.url) {
      if (!P.el) {
        P.el = new Audio(); P.el.preload = 'metadata';
        P.el.addEventListener('ended', onEnded);
        P.el.addEventListener('error', () => { App.toast('That audio source could not be played. It may be offline or block playback.'); P.state.playing = false; changed(); });
        P.el.addEventListener('timeupdate', () => App.emit('player-time'));
        P.el.addEventListener('loadedmetadata', () => App.emit('player-time'));
      }
      if (P.el.src !== t.url) P.el.src = t.url;
      P.el.volume = P.state.volume;
      try { P.el.currentTime = offset || 0; } catch (e) {}
      P.el.play().catch(() => { App.toast('Playback was blocked or the source is unavailable.'); P.state.playing = false; changed(); });
    } else {
      if (!init()) { App.toast('Your browser does not support Web Audio, so generative tracks cannot play.'); return; }
      P.session = new Session(t, Math.min(offset || 0, t.duration - 1), onEnded);
    }
    P.state.playing = true;
    App.activity.log({ type: 'track', id: t.id, title: t.title, sub: t.artist });
    App.store.update('musicRecent', [], (a) => [t.id].concat(a.filter((x) => x !== t.id)).slice(0, 30));
    changed();
  }
  function onEnded() {
    P.session = null;
    if (P.state.repeat === 'one') return start(0);
    if (P.state.index < P.state.queue.length - 1 || P.state.repeat === 'all' || P.state.shuffle) return P.next(true);
    P.state.playing = false; P.state.position = 0; changed();
  }
  P.play = (id, queueIds) => {
    if (queueIds && queueIds.length) { P.state.queue = queueIds.slice(); P.state.index = Math.max(0, queueIds.indexOf(id)); }
    else { const i = P.state.queue.indexOf(id); if (i >= 0) P.state.index = i; else { P.state.queue.splice(P.state.index + 1, 0, id); P.state.index++; } }
    P.state.position = 0;
    start(0);
  };
  P.pause = () => { if (!P.state.playing) return; P.state.position = P.position(); stopAll(); P.state.playing = false; changed(); };
  P.resume = () => { if (P.state.playing || !P.current()) return; start(P.state.position || 0); };
  P.toggle = () => (P.state.playing ? P.pause() : P.resume());
  P.next = (auto) => {
    const st = P.state; if (!st.queue.length) return;
    if (st.shuffle && st.queue.length > 1) { let n; do n = Math.floor(Math.random() * st.queue.length); while (n === st.index); st.index = n; }
    else if (st.index < st.queue.length - 1) st.index++;
    else if (st.repeat === 'all' || auto !== true) st.index = 0;
    else { st.playing = false; changed(); return; }
    st.position = 0; start(0);
  };
  P.prev = () => {
    const st = P.state; if (!st.queue.length) return;
    if (P.position() > 4) return P.seek(0);
    st.index = st.index > 0 ? st.index - 1 : st.queue.length - 1; st.position = 0; start(0);
  };
  P.seek = (sec) => {
    const d = P.duration(); sec = App.clamp(sec, 0, Math.max(0, d - 0.5));
    P.state.position = sec;
    if (P.state.playing) start(sec); else { if (P.el && P.current() && P.current().url) P.el.currentTime = sec; changed(); }
    App.emit('player-time');
  };
  P.setVolume = (v) => { P.state.volume = App.clamp(v, 0, 1); A.setVolume(P.state.volume); if (P.el) P.el.volume = P.state.volume; persist(); App.emit('player-volume', P.state.volume); };
  P.toggleShuffle = () => { P.state.shuffle = !P.state.shuffle; changed(); App.toast(P.state.shuffle ? 'Shuffle on' : 'Shuffle off'); };
  P.cycleRepeat = () => { const o = ['off', 'all', 'one']; P.state.repeat = o[(o.indexOf(P.state.repeat) + 1) % 3]; changed(); App.toast('Repeat: ' + P.state.repeat); };
  P.enqueue = (id) => { if (!P.state.queue.length) { P.state.queue = [id]; P.state.index = 0; P.state.position = 0; changed(); App.toast('Added to queue — press play'); return; } P.state.queue.push(id); changed(); App.toast('Added to queue'); };
  P.playNext = (id) => { if (!P.state.queue.length) return P.play(id, [id]); P.state.queue.splice(P.state.index + 1, 0, id); changed(); App.toast('Plays next'); };
  P.removeAt = (i) => {
    const st = P.state; if (i === st.index) return;
    st.queue.splice(i, 1); if (i < st.index) st.index--; changed();
  };
  P.clearQueue = () => { const cur = P.state.queue[P.state.index]; P.state.queue = cur ? [cur] : []; P.state.index = cur ? 0 : -1; changed(); };
  // drop queue entries that no longer exist (e.g. a removed user track)
  P.state.queue = P.state.queue.filter((id) => App.content.track(id));
  if (P.state.index >= P.state.queue.length) P.state.index = P.state.queue.length - 1;
  setInterval(() => { if (P.state.playing) { App.emit('player-time'); persist(); } }, 500);

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const t = P.current();
    try {
      if (t && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'Zone' });
      navigator.mediaSession.playbackState = P.state.playing ? 'playing' : 'paused';
    } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    const h = { play: P.resume, pause: P.pause, nexttrack: () => P.next(), previoustrack: P.prev, seekto: (d) => P.seek(d.seekTime) };
    Object.keys(h).forEach((k) => { try { navigator.mediaSession.setActionHandler(k, h[k]); } catch (e) {} });
  }

  /* ======================= ambient mixer ======================= */
  const AMB = {
    rain: { label: 'Rain', icon: 'rain', beds: [['rain', 1]], ev: (d, t) => { if (Math.random() < 0.7) V.drop(d, t + Math.random(), 0.015); } },
    fire: { label: 'Fireplace', icon: 'fire', beds: [['fire', 1]], ev: (d, t) => { for (let k = 0; k < 6; k++) if (Math.random() < 0.6) V.crackle(d, t + Math.random(), 0.04 + Math.random() * 0.08); } },
    wind: { label: 'Wind', icon: 'wind', beds: [['wind', 1]] },
    forest: { label: 'Forest', icon: 'tree', beds: [['stream', 0.7]], ev: (d, t) => { if (Math.random() < 0.35) V.chirp(d, t + Math.random(), 0.02); } },
    waves: { label: 'Waves', icon: 'waves', beds: [['ocean', 1]] },
    cafe: { label: 'Café', icon: 'coffee', beds: [['cafe', 1]], ev: (d, t) => { if (Math.random() < 0.18) V.clink(d, t + Math.random(), 0.02); } },
  };
  const ambActive = {};
  const ambVol = App.store.get('ambientMix', { rain: 0.7, fire: 0.6, wind: 0.5, forest: 0.6, waves: 0.6, cafe: 0.5 });
  /* ambience = pre-rendered loops (tools/make_ambience.py → assets/ambience/*.wav), played as wide stereo.
     If a file can't load (e.g. opened from file://), the live synth beds above are used instead. */
  const ambBuf = {}, ambLoading = {};
  const loadAmb = (id) => {
    if (ambBuf[id]) return Promise.resolve(ambBuf[id]);
    if (!ambLoading[id]) {
      ambLoading[id] = fetch('assets/ambience/' + id + '.wav')
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
        .then((b) => (ambBuf[id] = b))
        .catch(() => { ambLoading[id] = null; return null; });
    }
    return ambLoading[id];
  };
  function startLoop(id, buf, g) {
    // two copies half a loop apart, panned apart → a wide, natural stereo field from one mono file
    const nodes = [];
    [[-0.7, 0], [0.7, buf.duration / 2]].forEach(([pan, off]) => {
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const sg = ctx.createGain(); sg.gain.value = 0.42;
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      src.connect(sg); if (p) { p.pan.value = pan; sg.connect(p); p.connect(g); } else sg.connect(g);
      src.start(ctx.currentTime + 0.02, off); nodes.push(src);
    });
    return nodes;
  }
  function startSynth(id, g) {
    let nodes = []; AMB[id].beds.forEach(([b, l]) => (nodes = nodes.concat(BEDS[b](g, l))));
    const timer = AMB[id].ev ? setInterval(() => AMB[id].ev(g, ctx.currentTime + 0.05), 1000) : null;
    return { nodes, timer };
  }
  App.ambient = {
    sounds: AMB,
    isOn: (id) => !!ambActive[id],
    anyOn: () => Object.keys(ambActive).length > 0,
    volume: (id) => (ambVol[id] != null ? ambVol[id] : 0.6),
    toggle(id) {
      if (ambActive[id]) {
        const a = ambActive[id]; delete ambActive[id];
        a.stopped = true; clearInterval(a.timer); a.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
        setTimeout(() => { a.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); try { a.g.disconnect(); } catch (e) {} }, 1200);
      } else {
        if (!init()) return App.toast('Web Audio is not supported in this browser.');
        const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(ambientBus);
        g.gain.setTargetAtTime(this.volume(id), ctx.currentTime, 0.5);
        const a = (ambActive[id] = { g, nodes: [], timer: null });
        loadAmb(id).then((buf) => {
          if (a.stopped) return;
          if (buf) a.nodes = startLoop(id, buf, g);
          else { const sy = startSynth(id, g); a.nodes = sy.nodes; a.timer = sy.timer; }
        });
      }
      App.emit('ambient');
    },
    setVolume(id, v) { ambVol[id] = v; App.store.set('ambientMix', ambVol); if (ambActive[id]) ambActive[id].g.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.1); },
    stopAll() { Object.keys(ambActive).forEach((id) => this.toggle(id)); },
  };

  /* ======================= focus timer ======================= */
  const F = (App.focus = { running: false, total: 25 * 60, left: 25 * 60, label: 'Focus', timer: null });
  F.start = (min, label) => {
    if (min) { F.total = F.left = Math.round(min * 60); }
    if (label) F.label = label;
    F.running = true; F.endAt = Date.now() + F.left * 1000;
    clearInterval(F.timer);
    F.timer = setInterval(() => {
      F.left = Math.max(0, Math.round((F.endAt - Date.now()) / 1000));
      if (F.left <= 0) { F.done(); }
      App.emit('focus', F);
    }, 1000);
    App.emit('focus', F);
  };
  F.pause = () => { F.running = false; clearInterval(F.timer); App.emit('focus', F); };
  F.reset = () => { F.pause(); F.left = F.total; App.emit('focus', F); };
  F.done = () => {
    F.pause(); F.left = 0;
    App.toast(`${F.label} session complete — time for a little stretch.`, { duration: 6000 });
    if (ctx) { const t = ctx.currentTime + 0.05; [72, 76, 79].forEach((m, i) => V.bell(master, mtof(m), t + i * 0.25, 0.08)); }
    if (App.settings.get('notifications') && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification('Zone', { body: `${F.label} session complete.` }); } catch (e) {}
    }
    App.store.update('focusStats', { sessions: 0, seconds: 0 }, (s) => { s.sessions++; s.seconds += F.total; });
  };
})();

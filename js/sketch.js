/* Zone — hand-drawn visual language: functional icons, sketchy path helpers, doodles, the mascot "Pip", the hero room, generated covers. */
(function () {
  'use strict';
  const App = window.App;
  const f = (n) => Math.round(n * 10) / 10;

  /* ================= functional icons (24px, stroke, round caps) ================= */
  const I = {
    home: 'M3.5 11 12 4l8.5 7M5.5 9.5V20h5v-5.5h3V20h5V9.5',
    book: 'M4 5.5c2.5-1 5.5-1 8 .5 2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5',
    video: 'M3.5 6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM10 8.5v5l4.5-2.5zM8 20.5h8',
    games: 'M7 8h10a4 4 0 0 1 4 4v1.5a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1 1.3A3 3 0 0 1 3 13.5V12a4 4 0 0 1 4-4zM7.5 10.5v3M6 12h3M15.5 11.2h.01M17.5 12.8h.01',
    chess: 'M7.5 20.5h10M9 20.5c0-3 1-4.6 2.6-6.1-2 .6-3.6 1-4.6.4-1-.6-.7-2 .3-2.8L11 8.6l-.6-3.8 2.3 1.8c3.5.4 5.5 3.3 5 7.6l-.6 6.3M13.4 9.6h.01',
    music: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15a1.5 1.5 0 0 1 1.5-1.5H7a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 18.5zM20 15a1.5 1.5 0 0 0-1.5-1.5H17a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1h1.5a1.5 1.5 0 0 0 1.5-1.5z',
    all: 'M4.5 4.5h5.5V10H4.5zM14 4.5h5.5V10H14zM4.5 14H10v5.5H4.5zM14 14h5.5v5.5H14z',
    heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
    settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5',
    search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
    moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
    auto: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 4v16M12 8l3.5-3M12 12.5l6-5M12 17l7-5.5',
    rain: 'M7 15.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.4 3.3 3.3 0 0 1 .4 6.6zM8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2',
    x: 'M6 6l12 12M18 6 6 18',
    menu: 'M4 7h16M4 12h16M4 17h16',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.2-2.5 3.8M12 17h.01',
    undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
    flag: 'M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    list: 'M4 6.5h16M4 12h16M4 17.5h10',
    left: 'M15 5l-7 7 7 7',
    right: 'M9 5l7 7-7 7',
    down: 'M5 9l7 7 7-7',
    up: 'M5 15l7-7 7 7',
    play: 'M7.5 5v14l11.5-7z',
    pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
    next: 'M6 5.5l9 6.5-9 6.5zM17 5.5h2v13h-2z',
    prev: 'M18 5.5 9 12l9 6.5zM5 5.5h2v13H5z',
    shuffle: 'M3.5 7h3c4 0 6 10 10.5 10h3.5M3.5 17h3c1.6 0 2.8-1.5 3.8-3.3M13.7 10.3C14.7 8.5 15.9 7 17.5 7h3M18 4.5 20.5 7 18 9.5M18 14.5l2.5 2.5-2.5 2.5',
    repeat: 'M17 3.5 20 6.5l-3 3M4 11.5v-1a4 4 0 0 1 4-4h12M7 20.5l-3-3 3-3M20 12.5v1a4 4 0 0 1-4 4H4',
    volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
    mute: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5',
    bookmark: 'M6.5 4h11v16.5L12 16.5l-5.5 4z',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
    maximize: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
    minimize: 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5',
    refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
    trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    type: 'M4 7V5h10v2M9 5v14M7 19h4M14 12v-1.5h6V12M17 10.5V19M15.5 19h3',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    timer: 'M12 21a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM12 9.5v4M9.5 2.5h5M18.5 6.5 20 5',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z',
    trophy: 'M8 4.5h8v5a4 4 0 0 1-8 0zM8 6.5H5a3 3 0 0 0 3 4M16 6.5h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20.5h7M9.5 20.5l.5-3.5h4l.5 3.5',
    queue: 'M4 6.5h11M4 11.5h11M4 16.5h7M17 14v6M14 17h6',
    upload: 'M12 15.5v-11M7.5 9 12 4.5 16.5 9M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15',
    download: 'M12 4.5v11M7.5 11 12 15.5 16.5 11M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    fire: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.5-5.3 3.5-8.3 1.5 1.2 2 2.7 2 4 1-1.8 2.8-3.7 3-7 3 2.5 5 6.3 5 10.6 0 4-3 6.9-7 6.9zM12 21c-1.7 0-2.8-1.2-2.8-2.8 0-1.8 1.6-2.7 2.3-4.2 1.4 1.1 3.3 2.2 3.3 4.4 0 1.5-1.2 2.6-2.8 2.6z',
    wind: 'M3.5 9h11A2.5 2.5 0 1 0 12 6.5M3.5 13h15a2.5 2.5 0 1 1-2.5 2.5M3.5 17h7',
    leaf: 'M5 19C5 10 10 5 19.5 4.5 19.5 14 15 19 6.5 19M5 19l7-7',
    tree: 'M12 3.5 6.5 11h3L6 16h12l-3.5-5h3zM12 16v4.5',
    waves: 'M3 9c2 0 2-1.5 4.5-1.5S9.5 9 12 9s2.5-1.5 4.5-1.5S19 9 21 9M3 14c2 0 2-1.5 4.5-1.5S9.5 14 12 14s2.5-1.5 4.5-1.5S19 14 21 14M3 19c2 0 2-1.5 4.5-1.5S9.5 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19',
    coffee: 'M5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14.5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3',
    sparkle: 'M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5zM18.5 15.5c.2 1.4.8 2 2 2.2-1.2.2-1.8.8-2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2z',
    dots: 'M6 12h.01M12 12h.01M18 12h.01',
    flip: 'M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6h.01',
    bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6',
    cpu: 'M7 7h10v10H7zM10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5',
    mine: 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
    puzzle: 'M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H5v-4a2 2 0 1 0 0-4z',
    note: 'M9 18V5.5l10-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  };
  const FILLED = new Set(['play', 'pause', 'next', 'prev']);
  App.icon = (name, cls = '') => {
    const d = I[name] || I.dots;
    const fill = FILLED.has(name);
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${name === 'dots' ? 3 : 1.7}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  };

  /* ================= sketchy path helpers ================= */
  const S = (App.sketch = {});
  S.smooth = (pts, closed) => {
    const n = pts.length;
    const g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  };
  /* hand-drawn circle: wobbly radius, overshoots its start like a real pen loop */
  S.circle = (cx, cy, rx, ry, seed = 1, wob = 0.05, over = 0.35) => {
    const r = App.rng(seed), a0 = r() * Math.PI * 2, steps = 14, pts = [];
    const total = Math.PI * 2 + over;
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (total * i) / steps, k = 1 + (r() - 0.5) * wob * 2 + (i / steps) * wob;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return S.smooth(pts, false);
  };
  S.blob = (cx, cy, rx, ry, seed = 1, wob = 0.05, n = 10) => {
    const r = App.rng(seed), pts = [];
    for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n - Math.PI / 2, k = 1 + (r() - 0.5) * wob * 2; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return S.smooth(pts, true);
  };
  S.line = (x1, y1, x2, y2, seed = 1, j = 1.2) => {
    const r = App.rng(seed), jr = () => (r() - 0.5) * j * 2;
    const mx = (x1 + x2) / 2 + jr(), my = (y1 + y2) / 2 + jr();
    return `M${f(x1 + jr())} ${f(y1 + jr())}Q${f(mx)} ${f(my)} ${f(x2 + jr())} ${f(y2 + jr())}`;
  };
  S.rect = (x, y, w, h, seed = 1, j = 1.2) => {
    const o = 2;
    return [S.line(x - o, y, x + w + o, y, seed, j), S.line(x + w, y - o, x + w, y + h + o, seed + 1, j),
      S.line(x + w + o, y + h, x - o, y + h, seed + 2, j), S.line(x, y + h + o, x, y - o, seed + 3, j)].join('');
  };
  S.underline = (w, seed = 3) => {
    const r = App.rng(seed);
    return `M2 ${f(6 + r() * 2)}C${f(w * 0.3)} ${f(2 + r() * 3)} ${f(w * 0.62)} ${f(7 + r() * 3)} ${f(w - 2)} ${f(3 + r() * 2)}`;
  };
  /* inline hand-drawn underline used under headings / selected items */
  S.scribbleUnder = (seed = 3) => `<svg class="scribble-under" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="${S.underline(120, seed)}" pathLength="1"/></svg>`;
  S.ring = (seed = 5) => `<svg class="sketch-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${S.circle(50, 50, 46, 44, seed, 0.04, 0.45)}" pathLength="1"/></svg>`;

  /* ================= the mascot: Pip, a living ink-blot with a sprout ================= */
  const PIP_A = S.blob(60, 74, 37, 34, 11, 0.06, 11);
  const PIP_B = S.blob(60, 74, 37, 34, 23, 0.06, 11);
  const EYE = (x, y, rx = 4.2, ry = 5.6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="pip-eye"/>`;
  const SHINE = (x, y) => `<circle cx="${x}" cy="${y}" r="1.4" class="pip-shine"/>`;
  const HEART = (x, y, s = 1) => `<path d="M${x} ${y + 4 * s}c-5-3.4-7-6-7-8.6a3.6 3.6 0 0 1 7-1.2 3.6 3.6 0 0 1 7 1.2c0 2.6-2 5.2-7 8.6z" class="pip-heart"/>`;
  const ARMS = {
    rest: '<path d="M26 82q-7 5-5 11M94 82q7 5 5 11" class="pip-ink" fill="none"/>',
    up: '<path d="M27 74q-10-6-12-18M93 74q10-6 12-18" class="pip-ink" fill="none"/>',
    chin: '<path d="M26 82q-7 5-5 11" class="pip-ink" fill="none"/><path d="M93 84q-6 4-20 2" class="pip-ink" fill="none"/>',
    shy: '<path d="M27 84q9 9 22 6M93 84q-9 9-22 6" class="pip-ink" fill="none"/>',
    hips: '<path d="M27 80q-9 2-6 10 4 2 7-2M93 80q9 2 6 10-4 2-7-2" class="pip-ink" fill="none"/>',
    read: '<path d="M29 84q8 8 16 9M91 84q-8 8-16 9" class="pip-ink" fill="none"/>',
  };
  /* each expression: eyes, mouth, arms and optional extras (all hand-drawn on the same 120×130 grid) */
  const POSES = {
    idle: { eyes: `<g class="pip-eyes">${EYE(47, 69)}${EYE(73, 69)}</g>`, mouth: '<path d="M55 80q5 5 10 0" class="pip-ink" fill="none"/>' },
    wave: { eyes: `<g class="pip-eyes">${EYE(47, 69)}${EYE(73, 69)}</g>`, mouth: '<path d="M54 80q6 6 12 0" class="pip-ink" fill="none"/>', arms: '<path d="M26 82q-7 5-5 11" class="pip-ink" fill="none"/><g class="pip-wave"><path d="M94 76q9-6 11-17" class="pip-ink" fill="none"/><circle cx="105.5" cy="57" r="3.6" class="pip-fill pip-ink"/></g>' },
    happy: { eyes: '<path d="M41 70q6-7 12 0M67 70q6-7 12 0" class="pip-ink" fill="none"/>', mouth: '<path d="M52 79q8 10 16 0z" class="pip-mouth"/>' },
    laugh: { eyes: '<path d="M41 66l8 4-8 4M79 66l-8 4 8 4" class="pip-ink" fill="none"/>', mouth: '<path d="M50 78q10 15 20 0z" class="pip-mouth"/><path d="M55 85q5-3 10 0" class="pip-tongue"/>', arms: ARMS.rest, extra: '<g class="pip-shake"><path d="M14 58l-6-3M12 68h-7M104 58l6-3M106 68h7" class="pip-ink pip-thin"/></g>' },
    celebrate: { eyes: '<path d="M41 70q6-7 12 0M67 70q6-7 12 0" class="pip-ink" fill="none"/>', mouth: '<path d="M52 79q8 10 16 0z" class="pip-mouth"/>', arms: ARMS.up, extra: '<g class="pip-confetti"><path d="M12 44l3 3M18 38l-2 4M104 40l3-4M110 48l-4 1" class="pip-ink"/></g>' },
    love: { eyes: `${HEART(47, 66, 0.95)}${HEART(73, 66, 0.95)}`, mouth: '<path d="M53 80q7 7 14 0" class="pip-ink" fill="none"/>', arms: ARMS.shy, extra: `<g class="pip-float">${HEART(98, 34, 0.8)}</g>` },
    wink: { eyes: `<g>${EYE(47, 69)}${SHINE(48.5, 66.5)}</g><path d="M67 70q6-6 12 0" class="pip-ink" fill="none"/>`, mouth: '<path d="M53 79q8 8 15-1" class="pip-ink" fill="none"/><path d="M61 82.5q3 4 5 0" class="pip-tongue"/>', arms: ARMS.rest, extra: '<path class="pip-spark" d="M98 46c.6 3.4 2 4.8 5.4 5.4-3.4.6-4.8 2-5.4 5.4-.6-3.4-2-4.8-5.4-5.4 3.4-.6 4.8-2 5.4-5.4z"/>' },
    surprised: { eyes: `<g>${EYE(46, 68, 5.4, 6.6)}${EYE(74, 68, 5.4, 6.6)}${SHINE(47.8, 65.2)}${SHINE(75.8, 65.2)}</g><path d="M39 56q6-5 13-2M68 54q7-3 13 2" class="pip-ink" fill="none"/>`, mouth: '<ellipse cx="60" cy="84" rx="4.6" ry="5.6" class="pip-mouth"/>', arms: ARMS.up, extra: '<path d="M60 8v-2M50 10l-2-2M70 10l2-2" class="pip-ink pip-thin pip-pop"/>' },
    curious: { eyes: `<g class="pip-eyes">${EYE(49, 69)}${EYE(75, 69)}</g><path d="M70 58q6-4 11 0" class="pip-ink" fill="none"/>`, mouth: '<path d="M57 82q4-2 8 0" class="pip-ink" fill="none"/>' },
    thinking: { eyes: `<g class="pip-eyes">${EYE(44, 66, 4, 5.2)}${EYE(70, 66, 4, 5.2)}</g><path d="M38 57q6-3 12-1M64 56q6-2 12 1" class="pip-ink" fill="none"/>`, mouth: '<path d="M54 83q4-1 9 1" class="pip-ink" fill="none"/>', arms: ARMS.chin, extra: '<g class="pip-dots"><circle cx="92" cy="40" r="2.2"/><circle cx="100" cy="31" r="3"/><circle cx="110" cy="20" r="4"/></g>' },
    shy: { eyes: `<g class="pip-eyes">${EYE(46, 72, 3.6, 4.6)}${EYE(70, 72, 3.6, 4.6)}</g>`, mouth: '<path d="M54 84q3-2 6 0t6 0" class="pip-ink" fill="none"/>', arms: ARMS.shy, blush: true },
    sad: { eyes: '<path d="M42 66q5 7 11 1M67 67q6 6 11-1" class="pip-ink" fill="none"/><path d="M40 58q6 1 12-3M68 55q6 4 12 3" class="pip-ink" fill="none"/>', mouth: '<path d="M54 85q6-6 12 0" class="pip-ink" fill="none"/>', arms: ARMS.rest, extra: '<path class="pip-tear" d="M44 72c-2 4-3 6-1 7.5 2 1.2 4-.6 3.2-2.8z"/>' },
    grumpy: { eyes: `<g>${EYE(47, 70, 4.2, 3.6)}${EYE(73, 70, 4.2, 3.6)}</g><path d="M39 60l13 5M81 60l-13 5" class="pip-ink" fill="none"/>`, mouth: '<path d="M54 84h12" class="pip-ink" fill="none"/>', arms: ARMS.hips, extra: '<path d="M94 30c3 0 3 3 6 3s3-3 6-3" class="pip-ink pip-thin"/>' },
    focused: { eyes: `<g class="pip-eyes">${EYE(47, 69, 4, 5)}${EYE(73, 69, 4, 5)}</g><path d="M40 59l11 3M80 59l-11 3" class="pip-ink" fill="none"/>`, mouth: '<path d="M55 82q5 2 10 0" class="pip-ink" fill="none"/>', arms: ARMS.rest, extra: '<path class="pip-sweat" d="M90 50c-2 4-3 6-1 7.5 2 1.2 4-.6 3.2-2.8z"/>' },
    dizzy: { eyes: '<path d="M47 69m-5 0a5 5 0 1 0 5-5 3.5 3.5 0 1 0 3.5 3.5 2 2 0 1 0-2 2M73 69m-5 0a5 5 0 1 0 5-5 3.5 3.5 0 1 0 3.5 3.5 2 2 0 1 0-2 2" class="pip-ink pip-thin" fill="none"/>', mouth: '<path d="M52 84q2-3 4 0t4 0 4 0 4 0" class="pip-ink" fill="none"/>', arms: ARMS.rest, extra: '<g class="pip-orbit"><path d="M30 34l1.4 3.6 3.6 1.4-3.6 1.4L30 44l-1.4-3.6L25 39l3.6-1.4zM92 30l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" class="pip-starfill"/></g>' },
    sleepy: { eyes: '<path d="M41 70q6 4 12 0M67 70q6 4 12 0" class="pip-ink" fill="none"/>', mouth: '<ellipse cx="60" cy="83" rx="3" ry="2.4" class="pip-mouth"/>', extra: '<g class="pip-zzz"><text x="92" y="40">z</text><text x="101" y="28" font-size="11">z</text></g>' },
    read: { eyes: `<g class="pip-eyes">${EYE(47, 72, 4, 4.6)}${EYE(73, 72, 4, 4.6)}</g>`, mouth: '<path d="M55 82q5 4 10 0" class="pip-ink" fill="none"/>', arms: ARMS.read, extra: '<g class="pip-book"><path d="M38 92q11-6 22 0q11-6 22 0v14q-11-6-22 0q-11-6-22 0z" class="pip-page pip-ink"/><path d="M60 92v14" class="pip-ink"/></g>' },
  };
  App.PIP_POSES = {
    idle: 'Content', wave: 'Hello', happy: 'Happy', laugh: 'Laughing', celebrate: 'Celebrating', love: 'In love', wink: 'Wink',
    surprised: 'Surprised', curious: 'Curious', thinking: 'Thinking', shy: 'Shy', sad: 'Sad', grumpy: 'Grumpy',
    focused: 'Focused', dizzy: 'Dizzy', sleepy: 'Sleepy', read: 'Reading',
  };
  App.pip = (pose = 'idle', opts = {}) => {
    const P = POSES[pose] || POSES.idle;
    const size = opts.size || 96;
    const label = opts.label ? `role="img" aria-label="${App.esc(opts.label)}"` : 'aria-hidden="true"';
    const cheeks = P.blush
      ? '<ellipse cx="36" cy="80" rx="8" ry="4.4" class="pip-cheek pip-blush"/><ellipse cx="84" cy="80" rx="8" ry="4.4" class="pip-cheek pip-blush"/>'
      : '<ellipse cx="37" cy="80" rx="5.5" ry="3.2" class="pip-cheek"/><ellipse cx="83" cy="80" rx="5.5" ry="3.2" class="pip-cheek"/>';
    return `<svg class="pip pose-${pose} ${opts.cls || ''}" width="${size}" height="${Math.round(size * 1.08)}" viewBox="0 0 120 130" ${label}>${opts.style || ''}
      <g class="pip-sprout"><path d="M60 41C59 31 61 25 60 17" class="pip-ink" fill="none"/>
        <path d="M60 25C53 17 46 19 47 24c4 3 9 3 13 1z" class="pip-leaf pip-ink"/>
        <path d="M60 20c6-8 14-7 13-2-4 4-9 4-13 2z" class="pip-leaf pip-ink"/></g>
      <g class="pip-body">
        <ellipse cx="46" cy="109" rx="9" ry="5" class="pip-fill pip-ink"/><ellipse cx="74" cy="109" rx="9" ry="5" class="pip-fill pip-ink"/>
        <path d="${PIP_A}" class="pip-fill pip-ink pip-boil-a"/><path d="${PIP_B}" class="pip-fill pip-ink pip-boil-b"/>
        ${cheeks}${P.eyes}${P.mouth}${P.arms || ARMS.rest}${P.extra || ''}
      </g></svg>`;
  };

  /* a self-contained SVG file of Pip (colours + gentle animation baked in) for use outside Zone */
  App.pipStandalone = (pose, theme = 'light', animate = true) => {
    const c = theme === 'dark'
      ? { ink: '#1b1f2a', fill: '#d99b7f', leaf: '#c9cba3', cheek: '#a56f63', heart: '#e26d5c', soft: 'rgba(240,217,196,.6)', star: '#ffe1a8' }
      : { ink: '#3a2e28', fill: '#ffe1a8', leaf: '#c9cba3', cheek: '#e26d5c', heart: '#e26d5c', soft: 'rgba(74,58,49,.55)', star: '#ffe1a8' };
    const css = `<style>
      .pip-ink{stroke:${c.ink};stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.pip-thin{stroke-width:2}
      .pip-fill{fill:${c.fill}}.pip-leaf{fill:${c.leaf}}.pip-eye,.pip-mouth{fill:${c.ink}}.pip-cheek{fill:${c.cheek};opacity:${theme === 'dark' ? 0.7 : 0.45}}.pip-blush{opacity:.65}
      .pip-shine{fill:#fffaf1}.pip-page{fill:#fffaf1}.pip-heart{fill:${c.heart};stroke:${c.ink};stroke-width:1.6}.pip-tongue{fill:#e9978a}
      .pip-tear,.pip-sweat{fill:#9ccbe0;stroke:${c.ink};stroke-width:1.2}.pip-dots circle{fill:${c.soft}}.pip-starfill,.pip-spark{fill:${c.star};stroke:${c.ink};stroke-width:1.2}
      .pip-zzz text{font-family:'Comic Sans MS',cursive;font-size:16px;fill:${c.soft};font-weight:700}.pip-boil-b{opacity:0}
      ${animate ? `.pip-body,.pip-sprout,.pip-wave{transform-box:fill-box;transform-origin:50% 100%}.pip-wave{transform-origin:0 100%}.pip-eyes{transform-box:fill-box;transform-origin:center}
      .pip-body{animation:b 4.2s ease-in-out infinite}.pip-eyes{animation:k 5.6s infinite}.pip-sprout{animation:s 3.6s ease-in-out infinite}.pip-wave{animation:w 2.4s ease-in-out infinite}
      .pip-boil-a{animation:ba .9s steps(1) infinite}.pip-boil-b{animation:bb .9s steps(1) infinite}
      @keyframes b{50%{transform:scale(1.012,1.03)}}@keyframes k{0%,92%,100%{transform:scaleY(1)}94%{transform:scaleY(.1)}}
      @keyframes s{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes w{0%,60%,100%{transform:rotate(0)}15%{transform:rotate(-16deg)}30%{transform:rotate(8deg)}45%{transform:rotate(-12deg)}}
      @keyframes ba{0%{opacity:1}50%{opacity:0}}@keyframes bb{0%{opacity:0}50%{opacity:1}}` : ''}
    </style>`;
    return App.pip(pose, { size: 240, style: css, label: 'Pip, ' + (App.PIP_POSES[pose] || pose) })
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(/\s+class="pip pose-[^"]*"/, '');
  };

  /* ================= doodles (decorative, aria-hidden) ================= */
  const D = (App.doodle = {});
  const wrap = (vb, inner, cls = '') => `<svg class="doodle ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
  D.book = () => wrap('0 0 120 90', `
    <path d="M14 22q23-9 46 4 23-13 46-4v52q-23-8-46 4-23-12-46-4z" class="d-fill-a d-ink"/>
    <path d="M60 26v52" class="d-ink"/>
    <path d="M22 34q15-4 30 2M22 44q15-4 30 2M22 54q12-3 24 1M68 36q15-6 30-2M68 46q15-6 30-2" class="d-ink d-thin"/>
    <path class="d-page d-ink" d="M60 26q14-9 30-6v48q-16-3-30 6z"/>`, 'd-book');
  D.screen = () => wrap('0 0 120 90', `
    <path d="${S.rect(16, 14, 88, 56, 7, 1.4)}" class="d-ink"/>
    <path d="M20 18h80v48H20z" class="d-fill-b" stroke="none"/>
    <path d="M52 30v24l20-12z" class="d-fill-c d-ink d-play"/>
    <path d="M46 80h28M60 70v10" class="d-ink"/>`, 'd-screen');
  D.controller = () => wrap('0 0 120 90', `
    <path d="M34 28h52c12 0 20 10 20 24 0 10-6 16-13 16-6 0-9-4-12-8H39c-3 4-6 8-12 8-7 0-13-6-13-16 0-14 8-24 20-24z" class="d-fill-a d-ink"/>
    <path d="M34 42v14M27 49h14" class="d-ink"/>
    <circle cx="80" cy="44" r="3.4" class="d-fill-c d-ink"/><circle cx="90" cy="53" r="3.4" class="d-fill-c d-ink"/>
    <path d="M58 20q2-8 8-10" class="d-ink d-thin d-wire"/>`, 'd-controller');
  D.knight = () => wrap('0 0 120 90', `
    <path d="M42 80h40M46 80c0-10 4-15 10-20-7 2-12 3-15 1-3-2-2-7 1-9l11-12-2-12 7 5c12 1 19 11 17 26l-2 21" class="d-mono"/>
    <path d="M60 37h.1" class="d-mono" stroke-width="4"/>
    <path d="M30 84h60" class="d-mono d-thin"/>`, 'd-knight');
  D.headphones = () => wrap('0 0 120 90', `
    <path d="M30 60V48a30 30 0 0 1 60 0v12" class="d-ink"/>
    <rect x="22" y="54" width="16" height="24" rx="6" class="d-fill-c d-ink"/>
    <rect x="82" y="54" width="16" height="24" rx="6" class="d-fill-c d-ink"/>
    <g class="d-notes"><path d="M100 30v-12l8-2v10M100 30a3 3 0 1 1-3-3M108 26a3 3 0 1 1-3-3" class="d-ink d-thin"/>
    <path d="M14 26V16l6-1.5M14 26a2.6 2.6 0 1 1-2.6-2.6" class="d-ink d-thin"/></g>`, 'd-headphones');
  D.lamp = () => wrap('0 0 120 120', `
    <ellipse cx="60" cy="62" rx="40" ry="34" class="d-glow"/>
    <path d="M40 46h40l-9-26H49z" class="d-fill-b d-ink"/>
    <path d="M60 46v52M42 102h36" class="d-ink"/>`, 'd-lamp');
  D.mug = () => wrap('0 0 100 100', `
    <g class="d-steam"><path d="M40 34c-5-6 5-10 0-17" class="d-ink d-thin"/><path d="M54 32c-5-6 5-10 0-17" class="d-ink d-thin"/></g>
    <path d="M26 42h46v26a16 16 0 0 1-16 16H42a16 16 0 0 1-16-16z" class="d-fill-c d-ink"/>
    <path d="M72 50h6a8 8 0 0 1 0 16h-6" class="d-ink"/>`, 'd-mug');
  D.plant = () => wrap('0 0 100 110', `
    <g class="d-sway"><path d="M50 70C48 50 52 40 50 26" class="d-ink"/><path d="M50 46c-12-10-22-6-22 0 8 6 15 5 22 0z" class="d-fill-a d-ink"/><path d="M50 36c10-12 22-10 22-4-6 6-14 7-22 4z" class="d-fill-a d-ink"/><path d="M50 58c10-6 18-3 18 2-6 4-12 3-18-2z" class="d-fill-a d-ink"/></g>
    <path d="M32 70h36l-5 30H37z" class="d-fill-c d-ink"/>`, 'd-plant');
  D.bookmark = () => wrap('0 0 100 100', `<path d="M34 16h32v68L50 72 34 84z" class="d-fill-c d-ink"/><path d="M40 28h20" class="d-ink d-thin"/>`, 'd-bookmark');
  D.star = (cls = '') => wrap('0 0 40 40', `<path d="M20 4c1.4 9 6 13.5 15 15-9 1.4-13.6 6-15 15-1.4-9-6-13.6-15-15 9-1.5 13.6-6 15-15z" class="d-fill-b d-ink d-thin"/>`, 'd-star ' + cls);
  D.cloud = () => wrap('0 0 120 70', `<path d="M28 56a16 16 0 0 1-2-32 22 22 0 0 1 42-6 16 16 0 0 1 26 10 14 14 0 0 1-2 28z" class="d-fill-paper d-ink"/>`, 'd-cloud');
  D.record = () => wrap('0 0 100 100', `<g class="d-spin"><circle cx="50" cy="50" r="38" class="d-fill-ink d-ink"/><path d="${S.circle(50, 50, 28, 28, 9, 0.03, 0.2)}M50 30a20 20 0 0 1 20 20" class="d-groove"/><circle cx="50" cy="50" r="10" class="d-fill-c d-ink"/><circle cx="50" cy="50" r="2" class="d-fill-ink"/></g>`, 'd-record');
  D.pencil = () => wrap('0 0 120 40', `<path d="M10 28l14-8h80v16H24z" class="d-fill-b d-ink"/><path d="M24 20v16M94 20v16" class="d-ink d-thin"/><path d="M10 28l14-8v16z" class="d-fill-ink"/><path class="d-trace d-ink" d="M8 38q20 4 40-2t40 0" pathLength="1"/>`, 'd-pencil');
  D.map = () => wrap('0 0 120 90', `<path d="M14 18l28-8 36 10 28-8v62l-28 8-36-10-28 8z" class="d-fill-a d-ink"/><path d="M42 10v62M78 20v62" class="d-ink d-thin"/><path d="M24 50q14-20 30-6t32-10" class="d-ink d-thin" stroke-dasharray="4 5"/><path d="M88 32l6 6M94 32l-6 6" class="d-accent"/>`, 'd-map');
  D.scribble = () => wrap('0 0 120 40', `<path class="d-ink d-scribble" pathLength="1" d="M6 24c8-16 14 14 22-2s14 12 22-4 14 14 22-2 14 12 22-4 12 10 20 0"/>`, 'd-loading');
  D.trophy = () => wrap('0 0 100 100', `<path d="M32 18h36v20a18 18 0 0 1-36 0z" class="d-fill-b d-ink"/><path d="M32 24H20a12 12 0 0 0 14 16M68 24h12a12 12 0 0 1-14 16M50 56v14M36 84h28M40 84l2-14h16l2 14" class="d-ink"/>`, 'd-trophy');
  D.film = () => wrap('0 0 120 90', `<path d="${S.rect(18, 20, 84, 52, 31, 1.2)}" class="d-ink"/><path d="M22 24h76v44H22z" class="d-fill-a" stroke="none"/><path d="M30 20v52M90 20v52" class="d-ink d-thin"/><path d="M52 34v24l18-12z" class="d-fill-c d-ink"/>`, 'd-film');

  /* ================= the hero room (day sun / night rain) ================= */
  App.heroRoom = () => {
    const books = [
      [356, 66, 12, 30, 'b1', -2], [370, 60, 14, 36, 'b2', 0], [386, 64, 10, 32, 'b3', 1], [398, 58, 15, 38, 'b4', 0], [420, 70, 12, 28, 'b1', 14],
    ].map(([x, y, w, h, c, rot], i) => `<path d="M${x} ${y}h${w}v${h}h-${w}z" class="hr-${c} d-ink" transform="rotate(${rot} ${x + w / 2} ${y + h})"/><path d="M${x + 2} ${y + 6}h${w - 4}" class="d-ink d-thin" transform="rotate(${rot} ${x + w / 2} ${y + h})"/>`).join('');
    return `<svg class="hero-room" viewBox="0 0 520 340" role="img" aria-label="A hand-drawn cozy room: a window, a desk lamp, a stack of books and Pip the mascot">
      <defs>
        <clipPath id="hr-win"><rect x="66" y="36" width="188" height="150" rx="6"/></clipPath>
        <radialGradient id="hr-glow" cx="50%" cy="40%" r="60%"><stop offset="0" class="hr-glow-a"/><stop offset="1" class="hr-glow-b"/></radialGradient>
        <linearGradient id="hr-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hr-cone-a"/><stop offset="1" class="hr-cone-b"/></linearGradient>
      </defs>
      <!-- window -->
      <g clip-path="url(#hr-win)">
        <rect x="60" y="30" width="200" height="160" class="hr-sky"/>
        <g class="day-only">
          <circle cx="210" cy="78" r="18" class="hr-sun"/>
          <g class="hr-cloud drift-a"><path d="M92 92a10 10 0 0 1 2-20 14 14 0 0 1 26-4 10 10 0 0 1 14 12 8 8 0 0 1-2 12z" class="d-fill-paper d-ink d-thin"/></g>
          <g class="hr-cloud drift-b"><path d="M168 140a8 8 0 0 1 1-16 11 11 0 0 1 21-3 8 8 0 0 1 11 9 6 6 0 0 1-1 10z" class="d-fill-paper d-ink d-thin"/></g>
        </g>
        <g class="night-only">
          <path d="M218 62a18 18 0 1 0 14 28 15 15 0 0 1-14-28z" class="hr-moon"/>
          <g class="twinkle"><path d="M100 60l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" class="hr-starfill"/></g>
          <g class="twinkle t2"><path d="M150 90l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" class="hr-starfill"/></g>
          
        </g>
        <g class="hr-rain-wrap"><path class="hr-rain" d="M80 20l-14 40M110 10l-14 40M140 24l-14 40M170 8l-14 40M200 22l-14 40M230 12l-14 40M260 26l-14 40M92 80l-14 40M122 70l-14 40M152 84l-14 40M182 68l-14 40M212 82l-14 40M242 72l-14 40M100 140l-14 40M130 130l-14 40M160 144l-14 40M190 128l-14 40M220 142l-14 40M250 132l-14 40"/><path class="hr-rain hr-rain-2" transform="translate(14 -26)" d="M80 20l-14 40M110 10l-14 40M140 24l-14 40M170 8l-14 40M200 22l-14 40M230 12l-14 40M260 26l-14 40M92 80l-14 40M122 70l-14 40M152 84l-14 40M182 68l-14 40M212 82l-14 40M242 72l-14 40M100 140l-14 40M130 130l-14 40M160 144l-14 40M190 128l-14 40M220 142l-14 40M250 132l-14 40"/></g>
      </g>
      <path d="${S.rect(66, 36, 188, 150, 41, 1.3)}" class="d-ink hr-frame"/>
      <path d="${S.line(160, 36, 160, 186, 44, 1)}${S.line(66, 110, 254, 110, 45, 1)}" class="d-ink"/>
      <path d="M54 186h212v10H54z" class="hr-sill d-ink"/>
      <path d="M58 30c14 40 4 90 22 156H50V30z" class="hr-curtain d-ink"/>
      <!-- shelf with books -->
      <path d="${S.line(338, 98, 472, 98, 51, 1)}" class="d-ink"/>${books}
      <!-- plant on sill -->
      <g transform="translate(190 118) scale(.62)"><g class="d-sway"><path d="M50 70C48 50 52 40 50 26" class="d-ink"/><path d="M50 46c-12-10-22-6-22 0 8 6 15 5 22 0z" class="d-fill-a d-ink"/><path d="M50 36c10-12 22-10 22-4-6 6-14 7-22 4z" class="d-fill-a d-ink"/></g><path d="M32 70h36l-5 30H37z" class="d-fill-c d-ink"/></g>
      <!-- lamp light -->
      <path d="M368 206L326 300h120l-42-94z" fill="url(#hr-cone)" class="glow-pulse"/>
      <circle cx="388" cy="200" r="70" fill="url(#hr-glow)" class="glow-pulse"/>
      <!-- desk -->
      <path d="${S.line(20, 300, 500, 300, 61, 1.2)}${S.line(28, 306, 492, 306, 62, 1)}" class="d-ink"/>
      <path d="M44 306v30M476 306v30" class="d-ink"/>
      <!-- lamp -->
      <path d="M440 298a18 6 0 0 0-36 0z" class="d-fill-ink d-ink"/>
      <path d="M422 294L430 236 400 206" class="d-ink hr-lamp-arm"/>
      <path d="M364 210l26-28 22 24z" class="d-fill-b d-ink hr-shade"/>
      <!-- mug with steam -->
      <g class="d-steam"><path d="M150 248c-5-6 5-10 0-17" class="d-ink d-thin"/><path d="M164 246c-5-6 5-10 0-17" class="d-ink d-thin"/></g>
      <path d="M138 256h36v26a12 12 0 0 1-12 12h-12a12 12 0 0 1-12-12z" class="d-fill-c d-ink"/>
      <path d="M174 264h5a7 7 0 0 1 0 14h-5" class="d-ink"/>
      <!-- book stack -->
      <path d="M226 278h120v20H226z" class="hr-b2 d-ink"/><path d="M236 260h104v18H236z" class="hr-b4 d-ink"/><path d="M230 244h110v16H230z" class="hr-b1 d-ink"/>
      <path d="M232 286h108M242 268h92M236 251h98" class="d-ink d-thin"/>
      <!-- headphones -->
      <path d="M76 296c0-26 46-26 46 0" class="d-ink"/><rect x="68" y="282" width="14" height="16" rx="5" class="d-fill-c d-ink"/><rect x="116" y="282" width="14" height="16" rx="5" class="d-fill-c d-ink"/>
      <!-- Pip -->
      <g transform="translate(240 116)">${App.pip('wave', { size: 92, cls: 'hero-pip day-only' })}${App.pip('read', { size: 92, cls: 'hero-pip night-only' })}</g>
      <g class="twinkle t3"><path d="M344 140l1.8 4.6 4.6 1.8-4.6 1.8-1.8 4.6-1.8-4.6-4.6-1.8 4.6-1.8z" class="hr-starfill"/></g>
    </svg>`;
  };

  /* ================= generated covers & art ================= */
  const MOTIFS = {
    lamp: '<path d="M38 50h24l-6-16H44zM50 50v26M40 78h20" class="cv-ink"/>',
    rain: '<path d="M30 54a10 10 0 0 1-1-20 14 14 0 0 1 27-4 10 10 0 0 1 14 12 8 8 0 0 1-2 12z" class="cv-ink"/><path d="M36 62l-3 7M48 62l-3 7M60 62l-3 7" class="cv-ink"/>',
    map: '<path d="M22 36l18-6 20 6 18-6v40l-18 6-20-6-18 6z" class="cv-ink"/><path d="M40 30v40M60 36v40" class="cv-ink"/>',
    tea: '<path d="M30 46h32v14a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12zM62 50h4a6 6 0 0 1 0 12h-4M42 40c-3-4 3-6 0-10M52 40c-3-4 3-6 0-10" class="cv-ink"/>',
    train: '<path d="M28 32h44v32H28zM28 50h44M36 64l-4 8M64 64l4 8M22 74h56" class="cv-ink"/><circle cx="38" cy="58" r="2" class="cv-dot"/><circle cx="62" cy="58" r="2" class="cv-dot"/>',
    pencil: '<path d="M26 64l6-14 32-32 8 8-32 32z M32 50l8 8" class="cv-ink"/><path d="M24 76q20-6 52 0" class="cv-ink"/>',
    moon: '<path d="M60 30a20 20 0 1 0 12 30 16 16 0 0 1-12-30z" class="cv-ink"/>',
    leaf: '<path d="M28 72c0-26 14-40 44-42 0 28-14 42-40 42M28 72l22-22" class="cv-ink"/>',
    star: '<path d="M50 26c2 13 8 19 21 21-13 2-19 8-21 21-2-13-8-19-21-21 13-2 19-8 21-21z" class="cv-ink"/>',
  };
  App.cover = (title, author, colorIdx = 0, motif = 'lamp', cls = '') => {
    const pal = ['cv-sage', 'cv-butter', 'cv-tan', 'cv-coral', 'cv-slate', 'cv-rose'][colorIdx % 6];
    return `<svg class="cover ${pal} ${cls}" viewBox="0 0 100 140" role="img" aria-label="Cover: ${App.esc(title)}">
      <rect width="100" height="140" rx="4" class="cv-bg"/><rect width="7" height="140" class="cv-spine"/>
      <g transform="translate(2 4)">${MOTIFS[motif] || MOTIFS.star}</g>
      <foreignObject x="12" y="88" width="80" height="48"><div xmlns="http://www.w3.org/1999/xhtml" class="cv-text"><b>${App.esc(title)}</b><span>${App.esc(author || '')}</span></div></foreignObject>
    </svg>`;
  };
  const TRACK_MOTIF = {
    lofi: '<g class="d-spin"><circle cx="50" cy="50" r="26" class="ta-disc"/><circle cx="50" cy="50" r="18" class="ta-groove"/><circle cx="50" cy="50" r="7" class="ta-label"/></g>',
    ambient: '<path d="M18 56c10-12 20-12 32 0s22 12 32 0M18 68c10-12 20-12 32 0s22 12 32 0" class="ta-line"/><circle cx="66" cy="32" r="8" class="ta-label"/>',
    classical: '<path d="M20 36h60v32H20z" class="ta-line"/><path d="M28 36v20M36 36v20M48 36v20M56 36v20M64 36v20M72 36v20" class="ta-line"/>',
    jazz: '<path d="M60 22v34a10 10 0 1 1-6-9" class="ta-line"/><path d="M60 22c8 2 12 6 14 14" class="ta-line"/><path d="M30 70h40" class="ta-line"/>',
    nature: '<path d="M30 46a9 9 0 0 1-1-18 12 12 0 0 1 23-4 9 9 0 0 1 12 10 7 7 0 0 1-2 12z" class="ta-line"/><path d="M34 56l-3 8M46 56l-3 8M58 56l-3 8" class="ta-line"/>',
    focus: '<circle cx="50" cy="50" r="24" class="ta-line"/><circle cx="50" cy="50" r="12" class="ta-line"/><circle cx="50" cy="50" r="3" class="ta-label"/>',
    sleep: '<path d="M58 26a22 22 0 1 0 16 34 18 18 0 0 1-16-34z" class="ta-line"/><path d="M28 30l1.4 3.6 3.6 1.4-3.6 1.4L28 40l-1.4-3.6L23 35l3.6-1.4z" class="ta-label"/>',
    user: '<path d="M42 64V32l22-5v31" class="ta-line"/><circle cx="36" cy="64" r="6" class="ta-line"/><circle cx="58" cy="58" r="6" class="ta-line"/>',
  };
  App.trackArt = (track, cls = '') => {
    const cat = track.category || 'user';
    const motif = TRACK_MOTIF[cat === 'rain' || cat === 'nature' ? 'nature' : cat] || TRACK_MOTIF.user;
    const hue = ['ta-a', 'ta-b', 'ta-c', 'ta-d'][App.hash(track.id || track.title) % 4];
    return `<svg class="track-art ${hue} ${cls}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="12" class="ta-bg"/>${motif}</svg>`;
  };
})();

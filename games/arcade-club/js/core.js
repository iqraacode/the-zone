/* ==========================================================================
   ARCADE CLUB — core
   Namespace, safe DOM helpers, storage, sound, player identities and the
   per-game lifecycle context (timers, listeners, animation loop, cleanup).
   Everything lives on window.ArcadeClub so nothing leaks into the global
   scope of the host website.
   ========================================================================== */
(function () {
  'use strict';

  var A = (window.ArcadeClub = window.ArcadeClub || {});
  A.games = [];
  A.register = function (def) { A.games.push(def); };

  /* ------------------------------------------------------------------ DOM */
  var SVGNS = 'http://www.w3.org/2000/svg';

  function applyAttrs(el, attrs, isSvg) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') {
        Object.keys(v).forEach(function (p) {
          if (p.slice(0, 2) === '--') el.style.setProperty(p, String(v[p])); else el.style[p] = v[p];
        });
      }
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (!isSvg && (k === 'disabled' || k === 'hidden' || k === 'checked')) el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : String(v));
    });
  }
  function append(el, children) {
    children.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) append(el, c);
      else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
  }
  /** Create an HTML element. h('button', {class:'x', onclick: fn}, 'Label') */
  A.h = function (tag, attrs) {
    var el = document.createElement(tag);
    applyAttrs(el, attrs, false);
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  };
  /** Create an SVG element. */
  A.s = function (tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    applyAttrs(el, attrs, true);
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  };
  /** Turn a trusted, static SVG string authored in this codebase into a node.
      Never call this with user-provided text. */
  var parser = new DOMParser();
  A.svg = function (markup, cls) {
    var doc = parser.parseFromString(markup, 'image/svg+xml');
    var node = document.importNode(doc.documentElement, true);
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    if (cls) node.setAttribute('class', cls);
    return node;
  };
  A.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /* ---------------------------------------------------------------- utils */
  A.rand = function (a, b) { return a + Math.random() * (b - a); };
  A.randInt = function (a, b) { return Math.floor(A.rand(a, b + 1)); };
  A.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  A.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  A.clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  A.fmtTime = function (sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60), s = sec - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  };
  A.reducedMotion = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  A.isTouch = function () {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
  };

  /* -------------------------------------------------------------- players */
  // Identity = colour + symbol + label, so players never rely on colour alone.
  A.PLAYERS = [
    { slot: 0, color: '#E26D5C', dark: '#B73A2C', light: '#FFD9D2', symbol: 'star', colorName: 'Coral' },
    { slot: 1, color: '#6F9FB8', dark: '#1D6FA6', light: '#D2ECFF', symbol: 'circle', colorName: 'Sky' },
    { slot: 2, color: '#8FA968', dark: '#4A8A25', light: '#E0F4CF', symbol: 'triangle', colorName: 'Lime' },
    { slot: 3, color: '#E8B45A', dark: '#B9821A', light: '#FFF0C7', symbol: 'diamond', colorName: 'Sunny' }
  ];
  A.OUTLINE = '#2E2620';

  /** Build a roster: humans first, then computer players. */
  A.makeRoster = function (humans, cpus) {
    var list = [];
    var total = humans + (cpus || 0);
    for (var i = 0; i < total; i++) {
      var base = A.PLAYERS[i];
      var isBot = i >= humans;
      var name = isBot ? (cpus > 1 ? 'CPU ' + (i - humans + 1) : 'CPU') : (humans === 1 ? 'You' : 'Player ' + (i + 1));
      list.push(Object.assign({}, base, {
        index: i, isBot: isBot, name: name,
        short: isBot ? 'CPU' : (humans === 1 ? 'YOU' : 'P' + (i + 1))
      }));
    }
    return list;
  };

  /** Symbol path data in a 0..100 box (used by SVG and canvas). */
  A.symbolPath = function (symbol) {
    switch (symbol) {
      case 'star': return 'M50 8 L61.8 35.2 L91.4 38.2 L69.2 58 L75.6 87 L50 72 L24.4 87 L30.8 58 L8.6 38.2 L38.2 35.2 Z';
      case 'triangle': return 'M50 10 L90 84 L10 84 Z';
      case 'diamond': return 'M50 6 L90 50 L50 94 L10 50 Z';
      default: return 'M50 12 A38 38 0 1 1 49.99 12 Z';
    }
  };
  /** Small SVG badge of a player's symbol. */
  A.symbolSVG = function (player, size, fill) {
    var svg = A.s('svg', { viewBox: '-6 -6 112 112', width: size || 22, height: size || 22, 'aria-hidden': 'true', focusable: 'false', class: 'arc-sym' });
    svg.appendChild(A.s('path', { d: A.symbolPath(player.symbol), fill: fill || player.color, stroke: A.OUTLINE, 'stroke-width': 10, 'stroke-linejoin': 'round' }));
    return svg;
  };
  /** Draw a player's symbol on a canvas, centred on x,y with radius r. */
  A.drawSymbol = function (ctx, player, x, y, r, lw) {
    var p = new Path2D(A.symbolPath(player.symbol));
    ctx.save();
    ctx.translate(x - r, y - r);
    ctx.scale(r / 50, r / 50);
    ctx.fillStyle = player.color;
    ctx.fill(p);
    ctx.lineJoin = 'round';
    ctx.lineWidth = (lw || 3) * 50 / r;
    ctx.strokeStyle = A.OUTLINE;
    ctx.stroke(p);
    ctx.restore();
  };

  /* -------------------------------------------------------------- storage */
  var KEY = 'arcadeClub:v1';
  var defaults = function () {
    return { v: 1, sound: true, players: 1, favs: [], played: {}, records: {}, settings: {} };
  };
  var isObj = function (o) { return o && typeof o === 'object' && !Array.isArray(o); };
  var data = defaults();
  var storageOK = true;
  (function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      var p = JSON.parse(raw);
      if (!isObj(p) || p.v !== 1) return;          // unknown / outdated shape → start fresh
      data.sound = typeof p.sound === 'boolean' ? p.sound : true;
      data.players = [1, 2, 3].indexOf(p.players) >= 0 ? p.players : 1;
      data.favs = Array.isArray(p.favs) ? p.favs.filter(function (x) { return typeof x === 'string'; }) : [];
      data.played = isObj(p.played) ? p.played : {};
      data.records = isObj(p.records) ? p.records : {};
      data.settings = isObj(p.settings) ? p.settings : {};
    } catch (e) { storageOK = false; data = defaults(); }
  })();
  function save() {
    if (!storageOK) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* quota / private mode */ }
  }
  A.store = {
    get: function (k) { return data[k]; },
    set: function (k, v) { data[k] = v; save(); },
    isFav: function (id) { return data.favs.indexOf(id) >= 0; },
    toggleFav: function (id) {
      var i = data.favs.indexOf(id);
      if (i >= 0) data.favs.splice(i, 1); else data.favs.push(id);
      save();
      return i < 0;
    },
    playedCount: function (id) { var n = data.played[id]; return typeof n === 'number' && n > 0 ? n : 0; },
    markPlayed: function (id) { data.played[id] = A.store.playedCount(id) + 1; save(); },
    settingsFor: function (id) { return isObj(data.settings[id]) ? data.settings[id] : {}; },
    saveSettings: function (id, s) { data.settings[id] = s; save(); },
    /** Read a numeric record. */
    record: function (game, key) {
      var g = data.records[game];
      var v = isObj(g) ? g[key] : undefined;
      return typeof v === 'number' && isFinite(v) ? v : null;
    },
    /** Submit a value; returns {isNew, prev}. better: 'high' | 'low' */
    submit: function (game, key, value, better) {
      if (typeof value !== 'number' || !isFinite(value)) return { isNew: false, prev: null };
      if (!isObj(data.records[game])) data.records[game] = {};
      var prev = A.store.record(game, key);
      var isNew = prev === null || (better === 'low' ? value < prev : value > prev);
      if (isNew) { data.records[game][key] = value; save(); }
      return { isNew: isNew, prev: prev };
    },
    add: function (game, key, n) {
      if (!isObj(data.records[game])) data.records[game] = {};
      var prev = A.store.record(game, key) || 0;
      data.records[game][key] = prev + (n || 1);
      save();
      return prev + (n || 1);
    }
  };

  /* ---------------------------------------------------------------- sound */
  // Tiny Web Audio synth: no files to load, nothing plays before a user gesture.
  var actx = null, master = null, noiseBuf = null;
  function ensureAudio() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return actx; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try {
      actx = new C();
      master = actx.createGain();
      master.gain.value = 0.35;
      master.connect(actx.destination);
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
      var ch = noiseBuf.getChannelData(0);
      for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    } catch (e) { actx = null; }
    return actx;
  }
  function tone(f, dur, type, when, vol, slideTo) {
    var t = actx.currentTime + (when || 0);
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, when, vol, freq) {
    var t = actx.currentTime + (when || 0);
    var src = actx.createBufferSource(); src.buffer = noiseBuf;
    var f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    var g = actx.createGain();
    g.gain.setValueAtTime(vol || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur);
  }
  var SFX = {
    click: function () { tone(660, 0.06, 'triangle', 0, 0.3); },
    select: function () { tone(520, 0.08, 'triangle', 0, 0.35); tone(780, 0.1, 'triangle', 0.06, 0.35); },
    flip: function () { tone(400, 0.07, 'sine', 0, 0.3, 620); },
    match: function () { tone(660, 0.1, 'triangle', 0, 0.4); tone(880, 0.1, 'triangle', 0.08, 0.4); tone(1320, 0.16, 'triangle', 0.16, 0.35); },
    point: function () { tone(880, 0.09, 'square', 0, 0.18); tone(1175, 0.12, 'square', 0.07, 0.18); },
    place: function () { tone(330, 0.08, 'triangle', 0, 0.4, 440); },
    bad: function () { tone(220, 0.18, 'sawtooth', 0, 0.22, 140); },
    bump: function () { noise(0.08, 0, 0.35, 600); tone(120, 0.08, 'sine', 0, 0.4); },
    hit: function () { tone(500, 0.04, 'square', 0, 0.15); },
    jump: function () { tone(360, 0.14, 'square', 0, 0.15, 720); },
    coin: function () { tone(988, 0.06, 'square', 0, 0.16); tone(1319, 0.14, 'square', 0.06, 0.16); },
    splash: function () { noise(0.35, 0, 0.35, 900); },
    sink: function () { tone(523, 0.1, 'triangle', 0, 0.4); tone(659, 0.1, 'triangle', 0.09, 0.4); tone(784, 0.1, 'triangle', 0.18, 0.4); tone(1047, 0.25, 'triangle', 0.27, 0.4); },
    beep: function () { tone(440, 0.15, 'square', 0, 0.2); },
    go: function () { tone(880, 0.35, 'square', 0, 0.22); },
    win: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'triangle', i * 0.11, 0.4); }); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.22, 'triangle', i * 0.16, 0.35); }); },
    crash: function () { noise(0.3, 0, 0.5, 500); tone(160, 0.3, 'sawtooth', 0, 0.2, 60); }
  };
  A.sound = {
    get enabled() { return !!data.sound; },
    set: function (on) { A.store.set('sound', !!on); if (on) ensureAudio(); },
    /** Call from a user gesture to unlock audio. */
    unlock: function () { if (data.sound) ensureAudio(); },
    play: function (name) {
      if (!data.sound || !SFX[name]) return;
      if (!ensureAudio()) return;
      try { SFX[name](); } catch (e) { /* audio is optional */ }
    }
  };

  /* ------------------------------------------------------ ranking helper */
  /** Rank players by score. Returns [{player, score, place}] with shared places for ties. */
  A.rank = function (roster, scores, lowerIsBetter) {
    var rows = roster.map(function (p, i) { return { player: p, score: scores[i] }; });
    rows.sort(function (a, b) { return lowerIsBetter ? a.score - b.score : b.score - a.score; });
    rows.forEach(function (r, i) {
      r.place = i > 0 && r.score === rows[i - 1].score ? rows[i - 1].place : i + 1;
    });
    return rows;
  };
  /** Title text for a ranking: "Coral wins!" / "It's a tie!" */
  A.winnerTitle = function (rows) {
    var top = rows.filter(function (r) { return r.place === 1; });
    if (top.length > 1) return "It's a tie!";
    var p = top[0].player;
    if (p.name === 'You') return 'You win!';
    return p.name + ' wins!';
  };

  /* ------------------------------------------------------- canvas helper */
  /**
   * A crisp canvas that fits the stage while keeping a fixed logical size.
   * opts.rotateWhenWide: for portrait layouts, rotate 90° on landscape screens.
   * opts.rotateWhenTall: for landscape layouts, rotate 90° on portrait screens.
   * opts.reserve: px to keep free below the canvas (for on-screen controls).
   */
  A.makeCanvas = function (ctx, LW, LH, opts) {
    opts = opts || {};
    var canvas = A.h('canvas', { class: 'arc-canvas' });
    var g = canvas.getContext('2d');
    var view = { canvas: canvas, g: g, LW: LW, LH: LH, scale: 1, rotated: false, onResize: null };
    view.resize = function () {
      var aw = Math.max(100, ctx.stage.clientWidth - 12), ah = Math.max(100, ctx.stage.clientHeight - 12 - (opts.reserve ? opts.reserve() : 0));
      var rot = (!!opts.rotateWhenWide && aw / ah > 1.15) || (!!opts.rotateWhenTall && aw / ah < 0.8);
      view.rotated = rot;
      var w = rot ? LH : LW, hgt = rot ? LW : LH;
      var sc = Math.min(aw / w, ah / hgt, opts.maxScale || 2.2);
      view.scale = sc;
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.style.width = Math.round(w * sc) + 'px';
      canvas.style.height = Math.round(hgt * sc) + 'px';
      canvas.width = Math.round(w * sc * dpr);
      canvas.height = Math.round(hgt * sc * dpr);
      view.px = sc * dpr;
      if (view.onResize) view.onResize();
    };
    /** Set the transform so drawing uses logical (game) coordinates. */
    view.begin = function () {
      g.setTransform(view.px, 0, 0, view.px, 0, 0);
      if (view.rotated) { g.translate(0, LW); g.rotate(-Math.PI / 2); }
    };
    /** Plain screen-space transform (unrotated logical pixels). */
    view.screen = function () { g.setTransform(view.px, 0, 0, view.px, 0, 0); };
    /** Convert a pointer event to logical game coordinates. */
    view.toGame = function (e) {
      var r = canvas.getBoundingClientRect();
      var sx = (e.clientX - r.left) / view.scale, sy = (e.clientY - r.top) / view.scale;
      return view.rotated ? { x: LW - sy, y: sx } : { x: sx, y: sy };
    };
    ctx.listen(window, 'resize', view.resize);
    return view;
  };

  /* ------------------------------------------------ shared player inputs */
  // Buzzer keys for simultaneous "one button" games (solo players use Space).
  A.BUZZ_KEYS = [{ code: 'KeyQ', label: 'Q' }, { code: 'KeyP', label: 'P' }, { code: 'Space', label: 'Space' }];
  A.buzzKeyFor = function (roster, k) {
    var humans = roster.filter(function (p) { return !p.isBot; });
    return humans.length === 1 ? { code: 'Space', label: 'Space' } : A.BUZZ_KEYS[k];
  };
  /**
   * Big coloured buttons, one per human player, plus their keyboard keys.
   * onPress(playerIndex) fires on pointerdown / keydown (no key-repeat).
   * Returns { el, buttons, flash(index, 'is-good'|'is-bad', text) }.
   */
  A.buzzers = function (ctx, roster, onPress, opts) {
    opts = opts || {};
    var humans = roster.filter(function (p) { return !p.isBot; });
    var solo = humans.length === 1;
    var row = A.h('div', { class: 'arc-buzzers', style: { '--n': humans.length } });
    var buttons = {};
    humans.forEach(function (p, k) {
      var key = A.buzzKeyFor(roster, k);
      var b = A.h('button', {
        type: 'button', class: 'arc-buzz', style: { '--pc': p.color, '--pl': p.light },
        'aria-label': p.name + ' ' + (opts.action || 'button') + ' (key ' + key.label + ')'
      }, A.symbolSVG(p, 26, p.light), A.h('span', { class: 'arc-buzz-name' }, p.name), A.h('kbd', null, key.label));
      ctx.listen(b, 'pointerdown', function (e) { e.preventDefault(); A.sound.unlock(); onPress(p.index); });
      ctx.listen(b, 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onPress(p.index); } });
      ctx.listen(b, 'contextmenu', function (e) { e.preventDefault(); });
      buttons[p.index] = b;
      row.appendChild(b);
    });
    ctx.listen(window, 'keydown', function (e) {
      if (ctx.shell.overlay || e.repeat) return;
      humans.forEach(function (p, k) {
        var hit = solo ? (e.code === 'Space' || e.code === 'KeyQ') : e.code === A.BUZZ_KEYS[k].code;
        if (hit) { e.preventDefault(); onPress(p.index); }
      });
    });
    return {
      el: row, buttons: buttons,
      flash: function (i, cls, text) {
        var b = buttons[i];
        if (!b) return;
        b.classList.remove('is-good', 'is-bad'); void b.offsetWidth; b.classList.add(cls);
        if (text) {
          var pop = A.h('span', { class: 'arc-buzz-pop ' + cls }, text);
          b.appendChild(pop);
          ctx.timeout(function () { pop.remove(); }, 750);
        }
      }
    };
  };

  /**
   * Touch steering pads (◀ ▶) for each human player.
   * state[i].left / .right are Sets of active pointers (hold to steer);
   * onTap(i, 'left'|'right') fires on each press (for grid games).
   */
  A.steerPads = function (ctx, roster, onTap) {
    var state = [];
    var el = A.h('div', { class: 'arc-race-pads' });
    var arrow = function (d) {
      return A.svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="' + (d === 'left' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19') + '" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    };
    roster.forEach(function (p, i) {
      if (p.isBot) return;
      state[i] = { left: new Set(), right: new Set() };
      var mk = function (side) {
        var b = A.h('button', { type: 'button', class: 'arc-race-btn', 'aria-label': p.name + ' turn ' + side }, arrow(side));
        var set = state[i][side];
        var on = function (e) {
          e.preventDefault(); A.sound.unlock();
          set.add(e.pointerId); b.classList.add('is-down');
          try { b.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
          if (onTap) onTap(i, side);
        };
        var off = function (e) { set.delete(e.pointerId); if (!set.size) b.classList.remove('is-down'); };
        ctx.listen(b, 'pointerdown', on); ctx.listen(b, 'pointerup', off);
        ctx.listen(b, 'pointercancel', off); ctx.listen(b, 'lostpointercapture', off);
        ctx.listen(b, 'contextmenu', function (e) { e.preventDefault(); });
        return b;
      };
      el.appendChild(A.h('div', { class: 'arc-race-pad', style: { '--pc': p.color } },
        mk('left'), A.h('span', { class: 'arc-race-who' }, A.symbolSVG(p, 22), p.short), mk('right')));
    });
    return {
      el: el, state: state,
      clear: function () {
        state.forEach(function (s) { if (s) { s.left.clear(); s.right.clear(); } });
        el.querySelectorAll('.is-down').forEach(function (b) { b.classList.remove('is-down'); });
      }
    };
  };

  /** Ordinal text: 1st, 2nd, 3rd, 4th… */
  A.ordinal = function (n) { return n + (['th', 'st', 'nd', 'rd'][n] || 'th'); };

  /* ------------------------------------------------- game lifecycle context */
  /**
   * Every game instance gets a Context. All timers, listeners and the
   * animation loop go through it, so destroy() leaves nothing running.
   */
  A.Context = function (shell, def, cfg, stage) {
    this.shell = shell;
    this.def = def;
    this.cfg = cfg;
    this.stage = stage;
    this.over = false;
    this.paused = false;
    this.destroyed = false;
    this._timers = [];
    this._listeners = [];
    this._raf = 0;
    this._loopFn = null;
    this._last = 0;
  };
  var CP = A.Context.prototype;
  CP.listen = function (target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this._listeners.push([target, type, fn, opts]);
    return fn;
  };
  CP.timeout = function (fn, ms) {
    var self = this;
    var id = setTimeout(function () {
      self._timers = self._timers.filter(function (t) { return t !== id; });
      if (!self.destroyed) fn();
    }, ms);
    this._timers.push(id);
    return id;
  };
  CP.clearTimers = function () { this._timers.forEach(clearTimeout); this._timers = []; };
  /** Start the single animation loop for this game. fn(dt, now). Calling twice is a no-op. */
  CP.loop = function (fn) {
    if (this._raf || this.destroyed) return;
    var self = this;
    this._loopFn = fn;
    this._last = performance.now();
    var tick = function (now) {
      if (self.destroyed) return;
      self._raf = requestAnimationFrame(tick);
      var dt = Math.min(0.05, (now - self._last) / 1000);
      self._last = now;
      self._loopFn(self.paused ? 0 : dt, now);
    };
    this._raf = requestAnimationFrame(tick);
  };
  CP.stopLoop = function () { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; };
  CP.destroy = function () {
    this.destroyed = true;
    this.stopLoop();
    this.clearTimers();
    this._listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    this._listeners = [];
  };
  // UI hooks forwarded to the shell
  CP.setPlayers = function (roster, opts) { this.shell.hud.setPlayers(roster, opts); };
  CP.setScores = function (scores, fmt) { this.shell.hud.setScores(scores, fmt); };
  CP.setTurn = function (i) { this.shell.hud.setTurn(i); };
  CP.setStatus = function (text) { this.shell.hud.setStatus(text); };
  CP.setStats = function (pairs) { this.shell.hud.setStats(pairs); };
  CP.sfx = function (name) { A.sound.play(name); };
  /** End the round with a real result. Further input must be ignored (check ctx.over). */
  CP.finish = function (result) {
    if (this.over || this.destroyed) return;
    this.over = true;
    A.store.markPlayed(this.def.id);
    this.shell.showResults(result);
  };
})();

/* ==========================================================================
   ARCADE CLUB — shell
   Home screen (grid, filters, search, player selector, favourites) and the
   shared play screen (top bar, HUD, setup / pause / help / results dialogs).
   Routing uses the URL hash (#play/<game-id>) so the browser Back button
   leaves a game just like the on-screen back control.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub;
  var h = A.h;

  var CATS = [
    { id: 'all', label: 'All Games' },
    { id: 'quick', label: 'Quick' },
    { id: 'puzzle', label: 'Puzzle' },
    { id: 'action', label: 'Action' },
    { id: 'multiplayer', label: 'Multiplayer' },
    { id: 'favs', label: 'Favorites' }
  ];

  function icon(name, cls) { return A.svg(A.icons[name], 'arc-ico' + (cls ? ' ' + cls : '')); }
  function range(def) { var p = def.players; return p[0] === p[p.length - 1] ? String(p[0]) : p[0] + '–' + p[p.length - 1]; }

  function Shell(root) {
    this.root = root;
    this.homeHref = root.getAttribute('data-home-href') || '/';
    this.homeLabel = root.getAttribute('data-home-label') || 'Back to site';
    this.filter = { cat: 'all', q: '' };
    this.cur = null;            // { def, cfg, ctx, inst }
    this.overlay = null;        // current overlay kind
    this.build();
    this.route();
    var self = this;
    window.addEventListener('hashchange', function () { self.route(); });
    window.addEventListener('popstate', function () { self.route(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && self.cur && self.cur.inst && !self.overlay) self.pause();
    });
  }
  var S = Shell.prototype;

  /* =================================================================== build */
  /* ---- Nook bridge: when Nook embeds a game, Nook's own header drives it and "leave" returns to Nook ---- */
  var IN_NOOK = document.documentElement.classList.contains('in-nook');
  var BACK_LABEL = IN_NOOK ? 'Back to games' : BACK_LABEL;
  function toNook(msg) { if (IN_NOOK && window.parent) { msg.source = 'arcade'; window.parent.postMessage(msg, location.origin); } }

  S.build = function () {
    var self = this;
    A.clear(this.root);
    this.root.classList.add('arc');
    if (A.reducedMotion()) this.root.classList.add('arc-reduced');

    /* ---- home ---- */
    var letters = 'ARCADE CLUB'.split('').map(function (ch, i) {
      return ch === ' ' ? h('span', { class: 'arc-brand-gap' }, ' ') : h('span', { class: 'arc-brand-l', style: { '--i': i } }, ch);
    });
    this.soundBtnHome = this.soundButton();
    var header = h('header', { class: 'arc-header' },
      h('a', { class: 'arc-btn arc-btn-ghost arc-back-site', href: this.homeHref }, icon('back'), h('span', null, this.homeLabel)),
      h('div', { class: 'arc-brand' },
        h('h1', { class: 'arc-brand-title', 'aria-label': 'Arcade Club' }, letters),
        h('p', { class: 'arc-brand-sub' }, 'Little games. Big fun.')),
      this.soundBtnHome);

    // player selector
    this.playerBtns = [1, 2, 3].map(function (n) {
      var people = [];
      for (var i = 0; i < n; i++) people.push(icon('person', 'arc-person arc-person-' + i));
      return h('button', {
        type: 'button', class: 'arc-seg', role: 'radio', 'aria-checked': 'false', dataset: { n: n },
        onclick: function () { A.sound.unlock(); A.sound.play('click'); self.setPlayers(n); }
      }, h('span', { class: 'arc-people' }, people), h('span', null, n + (n === 1 ? ' Player' : ' Players')));
    });
    var playerGroup = h('div', { class: 'arc-players', role: 'radiogroup', 'aria-label': 'Number of players', onkeydown: function (e) { self.radioKeys(e, self.playerBtns, function (b) { self.setPlayers(+b.dataset.n); }); } }, this.playerBtns);

    this.search = h('input', {
      class: 'arc-search-input', type: 'search', placeholder: 'Search games', 'aria-label': 'Search games', autocomplete: 'off',
      oninput: function () { self.filter.q = self.search.value.trim().toLowerCase(); self.applyFilter(); }
    });
    this.catBtns = CATS.map(function (c) {
      return h('button', {
        type: 'button', class: 'arc-chip', 'aria-pressed': c.id === 'all' ? 'true' : 'false', dataset: { cat: c.id },
        onclick: function () { A.sound.play('click'); self.filter.cat = c.id; self.applyFilter(); }
      }, c.id === 'favs' ? icon('heart', 'arc-ico-sm') : null, c.label);
    });
    var controls = h('section', { class: 'arc-controls', 'aria-label': 'Arcade options' },
      h('div', { class: 'arc-controls-row' }, playerGroup,
        h('label', { class: 'arc-search' }, icon('search'), this.search)),
      h('div', { class: 'arc-cats', role: 'group', 'aria-label': 'Categories' }, this.catBtns));

    this.grid = h('ul', { class: 'arc-grid', 'aria-label': 'Games' });
    this.tiles = {};
    A.games.forEach(function (def) { self.grid.appendChild(self.buildTile(def)); });
    this.empty = h('p', { class: 'arc-empty', hidden: true }, 'No games match. Try another search or category.');
    this.liveHome = h('p', { class: 'arc-sr', 'aria-live': 'polite' });

    this.home = h('div', { class: 'arc-home' }, header, controls, h('main', { class: 'arc-main' }, this.grid, this.empty), this.liveHome,
      h('footer', { class: 'arc-foot' }, 'All games are local: pass the device around or share the keyboard. Scores are saved on this device only.'));

    /* ---- game view ---- */
    this.gTitle = h('h2', { class: 'arc-g-title' });
    this.gArt = h('span', { class: 'arc-g-art' });
    this.btnPause = h('button', { type: 'button', class: 'arc-icon-btn', 'aria-label': 'Pause', title: 'Pause (Esc)', onclick: function () { self.pause(); } }, icon('pause'));
    this.btnRestart = h('button', { type: 'button', class: 'arc-icon-btn', 'aria-label': 'Restart round', title: 'Restart', onclick: function () { A.sound.play('click'); self.restart(); } }, icon('restart'));
    this.btnHelp = h('button', { type: 'button', class: 'arc-icon-btn', 'aria-label': 'How to play', title: 'How to play', onclick: function () { A.sound.play('click'); self.showHelp(); } }, icon('help'));
    this.soundBtnGame = this.soundButton();
    var top = h('div', { class: 'arc-g-top' },
      h('button', { type: 'button', class: 'arc-btn arc-btn-ghost arc-g-back', onclick: function () { A.sound.play('click'); self.leave(); } }, icon('back'), h('span', null, 'Arcade')),
      h('div', { class: 'arc-g-name' }, this.gArt, this.gTitle),
      h('div', { class: 'arc-g-actions' }, this.btnHelp, this.soundBtnGame, this.btnPause, this.btnRestart));
    this.hudPlayers = h('ol', { class: 'arc-hud-players', 'aria-label': 'Scores' });
    this.hudStats = h('div', { class: 'arc-hud-stats' });
    this.status = h('p', { class: 'arc-status', 'aria-live': 'polite' });
    this.stage = h('div', { class: 'arc-stage', tabindex: '-1' });
    this.overlayBox = h('div', { class: 'arc-dialog', role: 'dialog', tabindex: '-1' });
    if (IN_NOOK) window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || e.data.source !== 'nook' || !self.cur) return;
      var t = e.data.type;
      if (t === 'pause') { if (self.overlay === 'pause') self.resume(); else if (!self.overlay) self.pause(); }
      if (t === 'restart') { A.sound.play('click'); self.restart(); }
      if (t === 'help') { if (self.overlay === 'help') self.resume(); else { A.sound.play('click'); self.showHelp(); } }
      if (t === 'sound' && self.soundBtnGame) self.soundBtnGame.click();
    });
    this.overlayEl = h('div', { class: 'arc-overlay', hidden: true, onkeydown: function (e) { self.trapFocus(e); } }, this.overlayBox);
    this.game = h('div', { class: 'arc-game', hidden: true },
      top, h('div', { class: 'arc-hud' }, this.hudPlayers, this.hudStats), this.status,
      h('div', { class: 'arc-stage-wrap' }, this.stage, this.overlayEl));

    this.root.appendChild(this.home);
    this.root.appendChild(this.game);

    document.addEventListener('keydown', function (e) {
      if (!self.cur || self.game.hidden) return;
      if (e.key === 'Escape') {
        if (self.overlay === 'pause' || self.overlay === 'help') { e.preventDefault(); self.resume(); }
        else if (self.overlay === 'setup') { e.preventDefault(); self.leave(); }
        else if (!self.overlay && self.cur.inst) { e.preventDefault(); if (self.cur.def.pausable) self.pause(); else self.showHelp(); }
      }
    });

    this.hud = this.makeHud();
    this.setPlayers(A.store.get('players'), true);
    this.applyFilter();
    this.syncSound();
  };

  S.buildTile = function (def) {
    var self = this;
    var badge = h('span', { class: 'arc-tile-badge' }, icon('person', 'arc-ico-xs'), range(def));
    var isNew = A.store.playedCount(def.id) === 0;
    var mode = h('span', { class: 'arc-tile-mode' });
    var btn = h('button', {
      type: 'button', class: 'arc-tile', style: { '--tile': def.color, '--tile-ink': def.ink || '#2E2620' },
      onclick: function () { A.sound.unlock(); A.sound.play('select'); self.open(def.id); }
    },
      h('span', { class: 'arc-tile-frame' },
        h('span', { class: 'arc-tile-art' }, A.svg(A.thumbs[def.art || def.id]), isNew ? h('span', { class: 'arc-tile-new' }, 'New') : null),
        h('span', { class: 'arc-tile-strip' }, h('span', { class: 'arc-tile-name' }, def.title))),
      badge,
      mode);
    var fav = h('button', {
      type: 'button', class: 'arc-fav', 'aria-label': 'Favorite ' + def.title,
      'aria-pressed': A.store.isFav(def.id) ? 'true' : 'false',
      onclick: function () {
        var on = A.store.toggleFav(def.id);
        fav.setAttribute('aria-pressed', on ? 'true' : 'false');
        A.sound.play(on ? 'point' : 'click');
        if (self.filter.cat === 'favs') self.applyFilter();
      }
    }, icon('heart'));
    var li = h('li', { class: 'arc-cell' }, btn, fav);
    this.tiles[def.id] = { li: li, btn: btn, mode: mode, def: def };
    return li;
  };

  S.soundButton = function () {
    var self = this;
    var b = h('button', {
      type: 'button', class: 'arc-icon-btn arc-sound', 'aria-pressed': 'true', 'aria-label': 'Sound',
      onclick: function () { A.sound.set(!A.sound.enabled); self.syncSound(); A.sound.play('click'); }
    });
    return b;
  };
  S.syncSound = function () {
    var on = A.sound.enabled;
    [this.soundBtnHome, this.soundBtnGame].forEach(function (b) {
      A.clear(b).appendChild(icon(on ? 'soundOn' : 'soundOff'));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('title', on ? 'Sound on' : 'Sound off');
    });
  };

  S.radioKeys = function (e, btns, act) {
    var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    var enabled = btns.filter(function (b) { return !b.disabled; });
    var i = enabled.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var nb = enabled[(i + keys[e.key] + enabled.length) % enabled.length];
    nb.focus(); act(nb);
  };

  S.setPlayers = function (n, silent) {
    if ([1, 2, 3].indexOf(n) < 0) n = 1;
    this.players = n;
    if (!silent) A.store.set('players', n);
    this.playerBtns.forEach(function (b) {
      var on = +b.dataset.n === n;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    var self = this;
    Object.keys(this.tiles).forEach(function (id) {
      var t = self.tiles[id], d = t.def, ok = d.players.indexOf(n) >= 0;
      t.mode.textContent = ok ? d.modes[n] : 'Needs ' + range(d) + ' players';
      t.li.classList.toggle('is-unavailable', !ok);
      t.btn.setAttribute('aria-label', d.title + '. ' + range(d) + ' players. ' + (ok ? n + ' player mode: ' + d.modes[n] + '. ' : 'Not available for ' + n + ' players. ') + d.tagline);
    });
    if (!silent) this.liveHome.textContent = n + (n === 1 ? ' player' : ' players') + ' selected.';
  };

  S.applyFilter = function () {
    var self = this, f = this.filter, shown = 0;
    this.catBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === f.cat ? 'true' : 'false'); });
    Object.keys(this.tiles).forEach(function (id) {
      var t = self.tiles[id], d = t.def;
      var catOk = f.cat === 'all' || (f.cat === 'favs' ? A.store.isFav(id) : d.cats.indexOf(f.cat) >= 0);
      var qOk = !f.q || (d.title + ' ' + d.tagline + ' ' + d.cats.join(' ')).toLowerCase().indexOf(f.q) >= 0;
      t.li.hidden = !(catOk && qOk);
      if (catOk && qOk) shown++;
    });
    this.empty.hidden = shown > 0;
    if (f.cat === 'favs' && shown === 0) this.empty.textContent = 'No favorites yet. Tap the heart on a game to pin it here.';
    else this.empty.textContent = 'No games match. Try another search or category.';
  };

  /* ================================================================ routing */
  S.route = function () {
    var m = /^#play\/([\w-]+)$/.exec(location.hash);
    var def = m && A.games.filter(function (g) { return g.id === m[1]; })[0];
    if (def) { if (!this.cur || this.cur.def !== def) this.openGame(def); }
    else if (this.cur) this.closeGame();
  };
  S.open = function (id) {
    // Remember (in the history entry itself) that we came from the arcade grid.
    history.pushState({ arcFromHome: true }, '', '#play/' + id);
    this.route();
  };
  S.leave = function () {
    if (IN_NOOK) { toNook({ type: 'leave' }); return; }
    if (history.state && history.state.arcFromHome) history.back();
    else {
      // Arrived directly on a game URL: replace the entry instead of leaving the site.
      history.replaceState(null, '', location.pathname + location.search);
      this.closeGame();
    }
  };

  /* ============================================================== game view */
  S.openGame = function (def) {
    if (this.cur) this.destroyInstance();
    var saved = A.store.settingsFor(def.id);
    var n = def.players.indexOf(this.players) >= 0 ? this.players : (def.players.indexOf(saved.players) >= 0 ? saved.players : def.players[0]);
    this.cur = { def: def, cfg: { players: n, opts: Object.assign({}, saved.opts || {}) }, ctx: null, inst: null };
    this.gTitle.textContent = def.title;
    A.clear(this.gArt).appendChild(A.svg(A.thumbs[def.art || def.id]));
    this.game.style.setProperty('--tile', def.color);
    this.home.hidden = true;
    this.game.hidden = false;
    document.documentElement.classList.add('arc-lock');
    this.btnPause.hidden = !def.pausable;
    this.hud.reset();
    A.clear(this.stage);
    this.stage.appendChild(h('div', { class: 'arc-stage-art' }, A.svg(A.thumbs[def.art || def.id])));
    this.showSetup();
  };
  S.closeGame = function () {
    var id = this.cur && this.cur.def.id;
    this.destroyInstance();
    this.cur = null;
    this.hideOverlay();
    this.game.hidden = true;
    this.home.hidden = false;
    document.documentElement.classList.remove('arc-lock');
    if (id && this.tiles[id]) {
      // refresh "new" badge
      var nb = this.tiles[id].btn.querySelector('.arc-tile-new');
      if (nb && A.store.playedCount(id) > 0) nb.remove();
      this.tiles[id].btn.focus({ preventScroll: false });
    }
  };
  S.destroyInstance = function () {
    if (!this.cur) return;
    if (this.cur.inst && this.cur.inst.destroy) { try { this.cur.inst.destroy(); } catch (e) { console.error(e); } }
    if (this.cur.ctx) this.cur.ctx.destroy();
    this.cur.inst = null; this.cur.ctx = null;
  };

  S.startGame = function () {
    var cur = this.cur;
    if (!cur) return;
    this.destroyInstance();
    A.store.saveSettings(cur.def.id, { players: cur.cfg.players, opts: cur.cfg.opts });
    this.hud.reset();
    this.hideOverlay();
    A.clear(this.stage);
    var ctx = new A.Context(this, cur.def, cur.cfg, this.stage);
    cur.ctx = ctx;
    try {
      cur.inst = cur.def.create(ctx);
      cur.inst.start();
    } catch (e) {
      console.error(e);
      this.hud.setStatus('Something went wrong starting this game. Please go back and try again.');
    }
    if (!this.stage.contains(document.activeElement)) this.stage.focus({ preventScroll: true });
  };
  S.restart = function () { if (this.cur) this.startGame(); };

  S.pause = function () {
    var cur = this.cur;
    if (!cur || !cur.inst || !cur.def.pausable || cur.ctx.over || this.overlay) return;
    cur.ctx.paused = true;
    if (cur.inst.pause) cur.inst.pause();
    A.sound.play('click');
    var self = this;
    this.showOverlay('pause', [
      h('h3', { class: 'arc-d-title' }, 'Paused'),
      h('p', { class: 'arc-d-sub' }, 'Take a breather. The round is frozen.'),
      h('div', { class: 'arc-d-actions' },
        h('button', { type: 'button', class: 'arc-btn arc-btn-primary', onclick: function () { self.resume(); } }, 'Resume'),
        h('button', { type: 'button', class: 'arc-btn', onclick: function () { self.restart(); } }, 'Restart'),
        h('button', { type: 'button', class: 'arc-btn arc-btn-ghost-dark', onclick: function () { self.leave(); } }, BACK_LABEL))
    ]);
  };
  S.resume = function () {
    var cur = this.cur;
    var kind = this.overlay;
    this.hideOverlay();
    if (cur && cur.ctx && cur.ctx.paused) {
      cur.ctx.paused = false;
      if (cur.inst && cur.inst.resume) cur.inst.resume();
    }
    if (kind) this.stage.focus({ preventScroll: true });
  };
  S.showHelp = function () {
    var cur = this.cur;
    if (!cur || this.overlay) return;
    if (cur.inst && cur.def.pausable && !cur.ctx.over) { cur.ctx.paused = true; if (cur.inst.pause) cur.inst.pause(); }
    var self = this;
    this.showOverlay('help', [
      h('h3', { class: 'arc-d-title' }, 'How to play'),
      this.rulesBlock(cur.def, cur.cfg),
      h('div', { class: 'arc-d-actions' }, h('button', { type: 'button', class: 'arc-btn arc-btn-primary', onclick: function () { self.resume(); } }, 'Got it'))
    ]);
  };

  S.rulesBlock = function (def, cfg) {
    var rules = def.rules(cfg), ctrls = def.controls(cfg);
    return h('div', { class: 'arc-rules' },
      h('ul', { class: 'arc-rule-list' }, rules.map(function (r) { return h('li', null, r); })),
      ctrls.length ? h('div', { class: 'arc-ctrls' },
        h('h4', null, 'Controls'),
        h('dl', null, ctrls.map(function (c) {
          return [h('dt', null, c[0].split(' / ').map(function (k, i) { return [i ? h('span', { class: 'arc-or' }, 'or') : null, h('kbd', null, k)]; })), h('dd', null, c[1])];
        }))) : null);
  };

  /* ---------------------------------------------------------------- setup */
  S.showSetup = function () {
    var self = this, cur = this.cur, def = cur.def, cfg = cur.cfg;
    function rebuild() { self.hideOverlay(true); self.showSetup(); }

    // players
    var pBtns = [1, 2, 3].map(function (n) {
      var ok = def.players.indexOf(n) >= 0;
      return h('button', {
        type: 'button', class: 'arc-seg arc-seg-sm', role: 'radio', 'aria-checked': cfg.players === n ? 'true' : 'false',
        tabindex: cfg.players === n ? 0 : -1, disabled: !ok, dataset: { n: n },
        onclick: function () { A.sound.play('click'); cfg.players = n; self.setPlayers(n); rebuild(); setTimeout(function () { var b = self.overlayBox.querySelector('.arc-setup-players [aria-checked="true"]'); if (b) b.focus(); }, 0); }
      }, h('strong', null, n + 'P'), h('small', null, ok ? def.modes[n] : 'Not available'));
    });
    var unsupported = [1, 2, 3].filter(function (n) { return def.players.indexOf(n) < 0; });

    // options
    var opts = def.options ? def.options(cfg.players) : [];
    opts.forEach(function (o) {
      var valid = o.choices.some(function (c) { return c.v === cfg.opts[o.id]; });
      if (!valid) cfg.opts[o.id] = o.def;
    });
    var optEls = opts.map(function (o) {
      var btns = o.choices.map(function (c) {
        var on = cfg.opts[o.id] === c.v;
        return h('button', {
          type: 'button', class: 'arc-seg arc-seg-sm', role: 'radio', 'aria-checked': on ? 'true' : 'false', tabindex: on ? 0 : -1, dataset: { v: String(c.v) },
          onclick: function () { A.sound.play('click'); cfg.opts[o.id] = c.v; btns.forEach(function (b) { var on2 = b === this; b.setAttribute('aria-checked', on2 ? 'true' : 'false'); b.tabIndex = on2 ? 0 : -1; }, this); if (o.rebuild) rebuild(); self.updateBest(); }
        }, c.label);
      });
      return h('div', { class: 'arc-field' },
        h('span', { class: 'arc-field-label', id: 'arc-opt-' + o.id }, o.label),
        h('div', { class: 'arc-segs', role: 'radiogroup', 'aria-labelledby': 'arc-opt-' + o.id, onkeydown: function (e) { self.radioKeys(e, btns, function (b) { b.click(); }); } }, btns));
    });

    this.bestEl = h('p', { class: 'arc-best' });
    var startBtn = h('button', {
      type: 'button', class: 'arc-btn arc-btn-primary arc-btn-big',
      onclick: function () { if (startBtn.disabled) return; startBtn.disabled = true; A.sound.unlock(); A.sound.play('select'); self.startGame(); }
    }, 'Start game');

    this.showOverlay('setup', [
      h('div', { class: 'arc-setup-head' },
        h('span', { class: 'arc-setup-art' }, A.svg(A.thumbs[def.art || def.id])),
        h('div', null, h('h3', { class: 'arc-d-title' }, def.title), h('p', { class: 'arc-d-sub' }, def.description))),
      h('div', { class: 'arc-field' },
        h('span', { class: 'arc-field-label', id: 'arc-opt-players' }, 'Players'),
        h('div', { class: 'arc-segs arc-setup-players', role: 'radiogroup', 'aria-labelledby': 'arc-opt-players', onkeydown: function (e) { self.radioKeys(e, pBtns, function (b) { b.click(); }); } }, pBtns),
        unsupported.length ? h('p', { class: 'arc-note' }, 'This game supports ' + range(def) + ' players.') : null),
      optEls,
      h('details', { class: 'arc-how', open: A.store.playedCount(def.id) === 0 },
        h('summary', null, 'How to play'), this.rulesBlock(def, cfg)),
      this.bestEl,
      h('div', { class: 'arc-d-actions' }, startBtn,
        h('button', { type: 'button', class: 'arc-btn arc-btn-ghost-dark', onclick: function () { self.leave(); } }, BACK_LABEL))
    ], startBtn);
    this.updateBest();
  };
  S.updateBest = function () {
    if (!this.cur || !this.bestEl) return;
    var txt = this.cur.def.best ? this.cur.def.best(this.cur.cfg) : null;
    A.clear(this.bestEl);
    if (txt) { this.bestEl.appendChild(icon('trophy', 'arc-ico-sm')); this.bestEl.appendChild(document.createTextNode(' ' + txt)); }
    this.bestEl.hidden = !txt;
  };

  /* -------------------------------------------------------------- results */
  S.showResults = function (r) {
    var self = this;
    toNook({ type: 'result', game: this.cur && this.cur.def.id, title: r.title, tone: r.tone || 'win', sub: r.subtitle || '' });
    A.sound.play(r.tone === 'lose' ? 'lose' : 'win');
    this.hud.setTurn(-1);
    var medals = ['1st', '2nd', '3rd', '4th'];
    var rows = (r.rows || []).map(function (row) {
      return h('li', { class: 'arc-res-row' + (row.place === 1 ? ' is-first' : ''), style: { '--pc': row.player.color } },
        h('span', { class: 'arc-res-place' }, medals[row.place - 1] || row.place + 'th'),
        A.symbolSVG(row.player, 26, row.place === 1 ? row.player.light : null),
        h('span', { class: 'arc-res-name' }, row.player.name),
        h('span', { class: 'arc-res-val' }, row.label !== undefined ? row.label : String(row.score)));
    });
    var stats = (r.stats || []).map(function (s) { return h('div', { class: 'arc-res-stat' }, h('span', null, s[0]), h('strong', null, String(s[1]))); });
    var recs = (r.records || []).map(function (t) { return h('p', { class: 'arc-res-rec' }, icon('trophy', 'arc-ico-sm'), ' ' + t); });
    var again = h('button', { type: 'button', class: 'arc-btn arc-btn-primary arc-btn-big', onclick: function () { A.sound.play('select'); self.startGame(); } }, 'Play again');
    var delay = A.reducedMotion() ? 0 : 650;
    this.cur.ctx.timeout(function () {
      self.showOverlay('results', [
        h('div', { class: 'arc-res-burst', 'aria-hidden': 'true' }),
        h('h3', { class: 'arc-d-title arc-res-title' }, r.title),
        r.subtitle ? h('p', { class: 'arc-d-sub' }, r.subtitle) : null,
        rows.length ? h('ol', { class: 'arc-res-list' }, rows) : null,
        stats.length ? h('div', { class: 'arc-res-stats' }, stats) : null,
        recs,
        h('div', { class: 'arc-d-actions' }, again,
          h('button', { type: 'button', class: 'arc-btn', onclick: function () { A.sound.play('click'); self.destroyInstance(); self.hideOverlay(true); self.hud.reset(); self.showSetup(); } }, 'Change setup'),
          h('button', { type: 'button', class: 'arc-btn arc-btn-ghost-dark', onclick: function () { self.leave(); } }, BACK_LABEL))
      ], again);
      // Ignore a few hundred ms of leftover button-mashing so nobody restarts by accident.
      var acts = self.overlayBox.querySelectorAll('.arc-d-actions .arc-btn');
      acts.forEach(function (b) { b.disabled = true; b.classList.add('is-cooling'); });
      setTimeout(function () {
        if (self.overlay !== 'results') return;
        acts.forEach(function (b) { b.disabled = false; b.classList.remove('is-cooling'); });
        again.focus({ preventScroll: true });
      }, 800);
    }, delay);
  };

  /* -------------------------------------------------------------- overlay */
  S.showOverlay = function (kind, children, focusEl) {
    this.overlay = kind;
    var box = A.clear(this.overlayBox);
    box.className = 'arc-dialog arc-dialog-' + kind;
    box.setAttribute('aria-label', kind === 'setup' ? this.cur.def.title + ' setup' : kind === 'results' ? 'Results' : kind === 'pause' ? 'Paused' : 'How to play');
    var wrap = h('div', { class: 'arc-dialog-inner' }, children);
    box.appendChild(wrap);
    this.overlayEl.hidden = false;
    this.overlayEl.scrollTop = 0;
    box.scrollTop = 0;
    (focusEl || box.querySelector('.arc-btn-primary') || box).focus({ preventScroll: true });
  };
  S.hideOverlay = function () {
    this.overlayEl.hidden = true;
    A.clear(this.overlayBox);
    this.overlay = null;
  };
  S.trapFocus = function (e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(this.overlayBox.querySelectorAll('button, [href], input, summary, [tabindex]:not([tabindex="-1"])'), function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ------------------------------------------------------------------ HUD */
  S.makeHud = function () {
    var self = this, chips = [], statEls = {};
    return {
      reset: function () {
        A.clear(self.hudPlayers); A.clear(self.hudStats); chips = []; statEls = {};
        self.status.textContent = '';
      },
      setPlayers: function (roster) {
        A.clear(self.hudPlayers); chips = [];
        roster.forEach(function (p) {
          var score = h('span', { class: 'arc-chip-score' }, '0');
          var li = h('li', { class: 'arc-pchip', style: { '--pc': p.color, '--pl': p.light } },
            A.symbolSVG(p, 20), h('span', { class: 'arc-pchip-name' }, p.name), score,
            h('span', { class: 'arc-pchip-turn' }, 'Turn'));
          chips.push({ li: li, score: score, val: null });
          self.hudPlayers.appendChild(li);
        });
      },
      setScores: function (scores, fmt) {
        scores.forEach(function (s, i) {
          var c = chips[i]; if (!c) return;
          var txt = fmt ? fmt(s, i) : String(s);
          if (c.val !== txt) {
            c.score.textContent = txt;
            if (c.val !== null) { c.li.classList.remove('is-bump'); void c.li.offsetWidth; c.li.classList.add('is-bump'); }
            c.val = txt;
          }
        });
      },
      setTurn: function (i) {
        chips.forEach(function (c, j) {
          c.li.classList.toggle('is-turn', j === i);
          if (j === i) c.li.setAttribute('aria-current', 'true'); else c.li.removeAttribute('aria-current');
        });
      },
      setStatus: function (t) { if (self.status.textContent !== t) self.status.textContent = t; },
      setStats: function (pairs) {
        pairs.forEach(function (p) {
          var e = statEls[p[0]];
          if (!e) {
            e = statEls[p[0]] = { v: h('strong', null, '') };
            self.hudStats.appendChild(h('span', { class: 'arc-stat' }, h('span', null, p[0]), e.v));
          }
          var t = String(p[1]);
          if (e.v.textContent !== t) e.v.textContent = t;
        });
      }
    };
  };

  /* ================================================================== boot */
  A.boot = function (root) {
    root = root || document.querySelector('[data-arcade-club]') || document.getElementById('arcade-club');
    if (!root) return null;
    // Preferred display order; any game not listed keeps its load order at the end.
    var order = ['memory', 'hippos', 'dots', 'tictac', 'skewer', 'golf', 'racers', 'paint', 'reflex', 'darts', 'clash', 'snake', 'jump', 'math'];
    var loaded = A.games.slice();
    var rank = function (g) { var i = order.indexOf(g.id); return i < 0 ? order.length + loaded.indexOf(g) : i; };
    A.games.sort(function (a, b) { return rank(a) - rank(b); });
    A.shell = new Shell(root);
    return A.shell;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { A.boot(); });
  else A.boot();
})();

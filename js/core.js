/* Zone — core utilities: storage, events, settings, theme, favorites, activity, toasts, modals. */
(function () {
  'use strict';
  const App = (window.App = window.App || {});
  App.pages = {};
  App.games = {};

  /* ---------- tiny helpers ---------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  App.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  App.$ = (sel, root) => (root || document).querySelector(sel);
  App.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  App.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  App.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  App.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  App.throttle = (fn, ms) => { let last = 0; return (...a) => { const n = Date.now(); if (n - last >= ms) { last = n; fn(...a); } }; };
  App.fmtTime = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
  };
  App.fmtMinutes = (s) => {
    const m = Math.round((s || 0) / 60);
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  };
  App.timeAgo = (ts) => {
    const d = (Date.now() - ts) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return Math.floor(d / 60) + ' min ago';
    if (d < 86400) return Math.floor(d / 3600) + ' h ago';
    if (d < 86400 * 7) return Math.floor(d / 86400) + ' d ago';
    return new Date(ts).toLocaleDateString();
  };
  /* deterministic pseudo-random generator (mulberry32) */
  App.rng = (seed) => {
    let a = (seed >>> 0) || 1;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  App.hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  App.shuffle = (arr, rand = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- storage (safe against missing / malformed data) ---------- */
  const NS = 'nook:';
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const store = (App.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(NS + key);
        if (raw == null) return clone(fallback);
        const v = JSON.parse(raw);
        if (fallback !== undefined && fallback !== null && typeof fallback === 'object') {
          if (v === null || typeof v !== 'object' || Array.isArray(fallback) !== Array.isArray(v)) return clone(fallback);
          if (!Array.isArray(fallback)) return Object.assign(clone(fallback), v);
        }
        return v;
      } catch (e) {
        return clone(fallback);
      }
    },
    set(key, val) {
      try { localStorage.setItem(NS + key, JSON.stringify(val)); return true; }
      catch (e) { console.warn('[zone] could not save', key, e); App.toast && App.toast('Could not save — browser storage may be full or blocked.'); return false; }
    },
    update(key, fallback, fn) { const v = store.get(key, fallback); const r = fn(v); const out = r === undefined ? v : r; store.set(key, out); return out; },
    remove(key) { try { localStorage.removeItem(NS + key); } catch (e) {} },
    clearAll() { try { Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} },
    exportAll() { const o = {}; try { Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => (o[k] = localStorage.getItem(k))); } catch (e) {} return o; },
  });
  const SCHEMA = 1;
  if (store.get('schema', 0) !== SCHEMA) store.set('schema', SCHEMA);

  /* ---------- event bus ---------- */
  const listeners = {};
  App.on = (evt, fn) => { (listeners[evt] = listeners[evt] || new Set()).add(fn); return () => listeners[evt].delete(fn); };
  App.emit = (evt, data) => { (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- settings ---------- */
  const DEFAULTS = {
    theme: 'auto', dayStart: 7, nightStart: 19, accent: 'ember', motion: 'system', anim: 'full',
    textScale: 100, name: '', mascot: true, notifications: false, ambientVolume: 0.7, clock24: false,
  };
  App.settings = {
    all() { return store.get('settings', DEFAULTS); },
    get(k) { return this.all()[k]; },
    set(k, v) { const s = this.all(); s[k] = v; store.set('settings', s); App.applyPrefs(); App.emit('settings', { key: k, value: v }); },
    defaults: DEFAULTS,
  };

  /* ---------- theme + motion ---------- */
  const sysReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  App.effectiveTheme = () => {
    const s = App.settings.all();
    if (s.theme === 'light' || s.theme === 'dark') return s.theme;
    const h = new Date().getHours();
    return h >= s.dayStart && h < s.nightStart ? 'light' : 'dark';
  };
  App.motionLevel = () => {
    const s = App.settings.all();
    if (s.motion === 'reduce' || (s.motion === 'system' && sysReduce && sysReduce.matches)) return 'reduce';
    return s.anim || 'full';
  };
  App.reducedMotion = () => App.motionLevel() === 'reduce' || App.motionLevel() === 'off';
  App.applyPrefs = () => {
    const d = document.documentElement, s = App.settings.all();
    const theme = App.effectiveTheme();
    if (d.getAttribute('data-theme') !== theme) {
      d.classList.add('theme-shift');
      d.setAttribute('data-theme', theme);
      clearTimeout(App._tt); App._tt = setTimeout(() => d.classList.remove('theme-shift'), 700);
      App.emit('theme', theme);
    }
    d.setAttribute('data-accent', s.accent);
    d.setAttribute('data-motion', App.motionLevel());
    d.style.setProperty('--text-scale', String((s.textScale || 100) / 100));
    d.classList.toggle('no-mascot', !s.mascot);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1a1918' : '#f5f4ed');
  };
  if (sysReduce && sysReduce.addEventListener) sysReduce.addEventListener('change', App.applyPrefs);
  setInterval(App.applyPrefs, 60 * 1000); // Automatic mode follows the clock
  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('is-hidden', document.hidden));

  /* ---------- favorites ---------- */
  App.fav = {
    list(type) { const a = store.get('favorites', []).filter((x) => x && x.type && x.id); return type ? a.filter((x) => x.type === type) : a; },
    has(type, id) { return this.list().some((x) => x.type === type && x.id === id); },
    toggle(item) {
      let on = false;
      store.update('favorites', [], (a) => {
        const i = a.findIndex((x) => x.type === item.type && x.id === item.id);
        if (i >= 0) a.splice(i, 1); else { a.unshift({ type: item.type, id: item.id, title: item.title, at: Date.now() }); on = true; }
      });
      App.emit('fav', { item, on });
      App.toast(on ? 'Saved to favorites' : 'Removed from favorites');
      return on;
    },
    remove(type, id) { store.update('favorites', [], (a) => a.filter((x) => !(x.type === type && x.id === id))); App.emit('fav', {}); },
  };

  /* ---------- recent activity ---------- */
  App.activity = {
    log(entry) {
      if (!entry || !entry.type || !entry.id) return;
      store.update('recent', [], (a) => {
        const i = a.findIndex((x) => x.type === entry.type && x.id === entry.id);
        const prev = i >= 0 ? a.splice(i, 1)[0] : {};
        a.unshift(Object.assign(prev, entry, { at: Date.now() }));
        return a.slice(0, 60);
      });
      App.emit('activity', entry);
    },
    list(types) { const a = store.get('recent', []).filter((x) => x && x.type && x.id); return types ? a.filter((x) => types.includes(x.type)) : a; },
    clear() { store.set('recent', []); App.emit('activity', {}); },
  };

  /* ---------- toasts ---------- */
  App.toast = (msg, opts = {}) => {
    const host = document.getElementById('toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${App.esc(msg)}</span>` + (opts.action ? `<button class="toast-btn" type="button">${App.esc(opts.action)}</button>` : '');
    if (opts.action) el.querySelector('button').addEventListener('click', () => { opts.onAction && opts.onAction(); remove(); });
    host.appendChild(el);
    while (host.children.length > 3) host.firstChild.remove();
    const remove = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); };
    setTimeout(remove, opts.duration || 3200);
  };

  /* ---------- modal dialogs (native <dialog> for focus handling) ---------- */
  App.modal = (opts) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'modal ' + (opts.className || '');
    dlg.setAttribute('aria-labelledby', 'm-title');
    const acts = (opts.actions || []).map((a, i) =>
      `<button type="button" class="btn ${a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-ghost'}" data-i="${i}">${App.esc(a.label)}</button>`).join('');
    dlg.innerHTML = `
      <div class="modal-head">
        <h2 id="m-title" class="modal-title">${App.esc(opts.title || '')}</h2>
        <button type="button" class="icon-btn modal-x" aria-label="Close">${App.icon('x')}</button>
      </div>
      <div class="modal-body">${opts.body || ''}</div>
      ${acts ? `<div class="modal-actions">${acts}</div>` : ''}`;
    document.body.appendChild(dlg);
    const close = (val) => {
      if (!dlg.isConnected) return;
      dlg.classList.add('closing');
      setTimeout(() => { try { dlg.close(); } catch (e) {} dlg.remove(); opts.onClose && opts.onClose(val); }, App.reducedMotion() ? 0 : 160);
    };
    dlg.querySelector('.modal-x').addEventListener('click', () => close());
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); if (!opts.locked) close(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg && !opts.locked) close(); });
    App.$$('.modal-actions button', dlg).forEach((b) => b.addEventListener('click', () => {
      const a = opts.actions[+b.dataset.i];
      const r = a.onClick ? a.onClick(dlg) : undefined;
      if (r !== false) close(a.value);
    }));
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
    opts.onOpen && opts.onOpen(dlg, close);
    return close;
  };
  App.confirm = (title, body, okLabel = 'Confirm', danger = false) => new Promise((res) => {
    let done = false;
    App.modal({
      title, body: `<p>${App.esc(body)}</p>`,
      actions: [{ label: 'Cancel', onClick: () => { done = true; res(false); } }, { label: okLabel, primary: !danger, danger, onClick: () => { done = true; res(true); } }],
      onClose: () => { if (!done) res(false); },
    });
  });

  /* ---------- greeting / time of day ---------- */
  App.partOfDay = (d = new Date()) => {
    const h = d.getHours();
    if (h < 5) return 'night';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'evening';
    return 'night';
  };

  /* ---------- global error guard: keep the app usable ---------- */
  window.addEventListener('error', (e) => { console.error('[zone]', e.error || e.message); });
  window.addEventListener('unhandledrejection', (e) => { console.error('[zone] promise', e.reason); });
})();

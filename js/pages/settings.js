/* Zone — Settings: theme (auto/light/dark + schedule), accent, motion, text size, mascot, ambience, notifications, data. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $ } = App;

  App.pages.settings = {
    title: 'Settings',
    render(root) {
      const draw = () => {
        const s = App.settings.all(), eff = App.effectiveTheme();
        const seg = (key, opts) => `<div class="seg" role="radiogroup" aria-label="${key}">${opts.map(([v, l, ic]) => `<button type="button" class="seg-btn ${String(s[key]) === String(v) ? 'on' : ''}" role="radio" aria-checked="${String(s[key]) === String(v)}" data-key="${key}" data-val="${v}">${ic ? icon(ic) : ''}${l}</button>`).join('')}</div>`;
        const hours = (key) => `<select class="input sel-sm" data-key="${key}" aria-label="${key}">${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${s[key] === h ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select>`;
        const accents = eff === 'dark' ? [['ember', 'Clay', '#d97757'], ['honey', 'Sky', '#6a9bcc'], ['moss', 'Olive', '#788c5d'], ['rose', 'Fig', '#c46686']] : [['ember', 'Clay', '#d97757'], ['honey', 'Sky', '#6a9bcc'], ['moss', 'Olive', '#788c5d'], ['rose', 'Fig', '#c46686']];
        const notif = 'Notification' in window ? Notification.permission : 'unsupported';
        root.innerHTML = `
        <section class="page settings-page">
          <div class="page-head"><div class="head-title"><span class="doodle-wrap">${App.pip('curious', { size: 76 })}</span>
            <div><h1>Settings</h1><p>Make the zone yours. Everything here is saved in this browser.</p></div></div></div>

          <div class="settings-grid">
            <div class="panel set-card">
              <h2>${icon('sun')}Appearance</h2>
              <div class="set-row"><div><b>Theme</b><small>Currently ${eff}.</small></div>${seg('theme', [['auto', 'Auto', 'auto'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']])}</div>
              <div class="set-row ${s.theme !== 'auto' ? 'dim' : ''}"><div><b>Automatic schedule</b><small>Auto uses your device clock: light from ${String(s.dayStart).padStart(2, '0')}:00, dark from ${String(s.nightStart).padStart(2, '0')}:00. A manual choice always wins.</small></div>
                <div class="hours"><label>Day ${hours('dayStart')}</label><label>Night ${hours('nightStart')}</label></div></div>
              <div class="set-row"><div><b>Accent colour</b><small>Picked from the zone's palette.</small></div>
                <div class="swatches">${accents.map(([v, l, c]) => `<button type="button" class="swatch ${s.accent === v ? 'on' : ''}" data-key="accent" data-val="${v}" aria-label="${l}" aria-pressed="${s.accent === v}" style="--sw:${c}"><span></span>${l}</button>`).join('')}</div></div>
              <div class="set-row"><div><b>Text size</b><small>${s.textScale}% of normal.</small></div><input type="range" min="85" max="125" step="5" value="${s.textScale}" data-key="textScale" aria-label="Text size"></div>
              <div class="set-row"><div><b>24-hour clock</b><small>Used on the home page.</small></div>${seg('clock24', [[false, 'Off'], [true, 'On']])}</div>
            </div>

            <div class="panel set-card">
              <h2>${icon('sparkle')}Motion & character</h2>
              <div class="set-row"><div><b>Reduced motion</b><small>System follows your device setting${App.motionLevel() === 'reduce' ? ' (reduced right now)' : ''}.</small></div>${seg('motion', [['system', 'System'], ['reduce', 'Reduce'], ['allow', 'Allow']])}</div>
              <div class="set-row ${App.motionLevel() === 'reduce' ? 'dim' : ''}"><div><b>Decorative animation</b><small>Full: gentle loops everywhere. Calm: only responses to what you do. Off: still drawings.</small></div>${seg('anim', [['full', 'Full'], ['calm', 'Calm'], ['off', 'Off']])}</div>
              <div class="set-row"><div><b>Pip the mascot</b><small>Shows up in quiet corners, never over content. <a class="btn-link" href="#/pip">See all of Pip's expressions</a></small></div>${seg('mascot', [[true, 'Visible'], [false, 'Hidden']])}</div>
              <div class="set-row"><div><b>Your name</b><small>For the greeting on Home. Optional.</small></div><input class="input sel-sm" type="text" maxlength="30" value="${esc(s.name)}" data-key="name" placeholder="e.g. Sam" aria-label="Your name"></div>
            </div>

            <div class="panel set-card">
              <h2>${icon('rain')}Sound & focus</h2>
              <div class="set-row"><div><b>Ambience volume</b><small>Master level for rain, fire, wind and friends. Sounds never start on their own.</small></div><input type="range" min="0" max="1" step="0.05" value="${s.ambientVolume}" data-key="ambientVolume" aria-label="Ambience volume"></div>
              <div class="set-row"><div><b>Ambience & focus timer</b><small>Open the mixer to start sounds or a timer.</small></div><button type="button" class="btn btn-ghost btn-sm" data-open-ambient>${icon('rain')}Open mixer</button></div>
              <div class="set-row"><div><b>Focus timer notifications</b><small>${notif === 'unsupported' ? 'Not supported in this browser — an in-app note will show instead.' : notif === 'denied' ? 'Blocked in your browser settings — an in-app note will show instead.' : 'A system notification when a focus session ends.'}</small></div>${seg('notifications', [[false, 'Off'], [true, 'On']])}</div>
              <div class="set-row"><div><b>Focus stats</b><small>${(() => { const f = App.store.get('focusStats', { sessions: 0, seconds: 0 }); return `${f.sessions} sessions · ${App.fmtMinutes(f.seconds)}`; })()}</small></div></div>
            </div>

            <div class="panel set-card">
              <h2>${icon('download')}Your data</h2>
              <p class="muted small">Favorites, progress, scores, playlists and preferences live in this browser's local storage. Nothing is sent anywhere.</p>
              <div class="set-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-export>${icon('download')}Export as JSON</button>
                <button type="button" class="btn btn-ghost btn-sm" data-clear-recent>${icon('clock')}Clear recent activity</button>
                <button type="button" class="btn btn-danger btn-sm" data-reset>${icon('trash')}Reset everything</button>
              </div>
            </div>

            <div class="panel set-card about">
              <h2>${icon('info')}About Zone</h2>
              <p class="muted small">Sample reading is original writing. Videos play from YouTube. Music is generated live in your browser. Sudoku, Snake and Word Puzzle are slots for your own games (see README).</p>
              <p class="hand about-sig">— drawn by hand, kept warm ✶</p>
            </div>
          </div>
        </section>`;
      };
      draw();
      const parse = (el) => { let v = el.dataset.val != null ? el.dataset.val : el.value; if (v === 'true') v = true; else if (v === 'false') v = false; else if (el.type === 'range' || el.tagName === 'SELECT') v = +v; return v; };
      root.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-key][data-val]');
        if (b) {
          const k = b.dataset.key, v = parse(b);
          if (k === 'notifications' && v === true && 'Notification' in window && Notification.permission === 'default') {
            try { await Notification.requestPermission(); } catch (err) {}
          }
          App.settings.set(k, v); draw(); return;
        }
        if (e.target.closest('[data-open-ambient]')) { e.stopPropagation(); App.toggleAmbient(); return; }
        if (e.target.closest('[data-export]')) {
          const blob = new Blob([JSON.stringify(App.store.exportAll(), null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nook-data.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          return;
        }
        if (e.target.closest('[data-clear-recent]')) { App.activity.clear(); App.toast('Recent activity cleared'); return; }
        if (e.target.closest('[data-reset]')) {
          if (await App.confirm('Reset everything?', 'This deletes favorites, progress, scores, playlists, your texts and all preferences from this browser.', 'Reset', true)) {
            App.player.pause(); App.ambient.stopAll(); App.store.clearAll(); location.hash = '#/home'; location.reload();
          }
        }
      });
      root.addEventListener('change', (e) => {
        const el = e.target.closest('[data-key]'); if (!el || el.dataset.val != null) return;
        const k = el.dataset.key;
        App.settings.set(k, k === 'name' ? el.value.trim().slice(0, 30) : parse(el));
        if (k === 'ambientVolume') App.audio.setAmbientMaster(+el.value);
        if (k !== 'name') draw();
      });
      root.addEventListener('input', (e) => { if (e.target.dataset.key === 'ambientVolume') App.audio.setAmbientMaster(+e.target.value); });
    },
  };
})();

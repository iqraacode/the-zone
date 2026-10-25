/* Zone — Meet Pip: the mascot's expression sheet, with SVG / PNG downloads for use in your own games. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;

  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function toPNG(pose, theme, size) {
    const svg = App.pipStandalone(pose, theme, false).replace(/width="\d+" height="\d+"/, `width="${size}" height="${Math.round(size * 1.08)}"`);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = size; c.height = Math.round(size * 1.08);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? download(`pip-${pose}-${theme}.png`, b) : App.toast('PNG export is not supported in this browser.')), 'image/png');
    };
    img.onerror = () => App.toast('Could not render the PNG.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  App.pages.pip = {
    title: 'Meet Pip',
    render(root) {
      let theme = App.effectiveTheme();
      const draw = () => {
        root.innerHTML = `
        <section class="page pip-page">
          <div class="page-head">
            <div class="head-title"><span class="doodle-wrap">${App.pip('wave', { size: 84, cls: 'keep' })}</span>
              <div><h1>Meet Pip</h1><p>A living ink-blot with a sprout. Here are all of Pip's expressions. Download them for your own games: SVG files keep the gentle animation, PNGs are still images.</p></div></div>
            <div class="seg" role="radiogroup" aria-label="Colour version">
              <button type="button" class="seg-btn ${theme === 'light' ? 'on' : ''}" data-th="light" role="radio" aria-checked="${theme === 'light'}">${icon('sun')}Day</button>
              <button type="button" class="seg-btn ${theme === 'dark' ? 'on' : ''}" data-th="dark" role="radio" aria-checked="${theme === 'dark'}">${icon('moon')}Night</button>
            </div>
          </div>
          <div class="pip-sheet pip-sheet-${theme}">
            ${Object.entries(App.PIP_POSES).map(([pose, name]) => `
              <figure class="pip-card">
                <div class="pip-stage"><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(App.pipStandalone(pose, theme))}" alt="Pip, ${esc(name)}" width="160" height="173" decoding="async"></div>
                <figcaption><b>${esc(name)}</b><code>${esc(pose)}</code></figcaption>
                <div class="pip-dl">
                  <button type="button" class="btn btn-ghost btn-sm" data-svg="${pose}" aria-label="Download ${esc(name)} as SVG">${icon('download')}SVG</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-png="${pose}" aria-label="Download ${esc(name)} as PNG">${icon('download')}PNG</button>
                </div>
              </figure>`).join('')}
          </div>
          <p class="fine-print">${icon('info')} The same files are already in the project at <code>assets/pip/light/</code> and <code>assets/pip/dark/</code>. Regenerate them with <code>node tools/export_pip.js</code>. PNGs export at 512 px wide.</p>
        </section>`;
      };
      draw();
      root.addEventListener('click', (e) => {
        const t = e.target.closest('[data-th]'); if (t) { theme = t.dataset.th; draw(); return; }
        const s = e.target.closest('[data-svg]'); if (s) { download(`pip-${s.dataset.svg}-${theme}.svg`, new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + App.pipStandalone(s.dataset.svg, theme)], { type: 'image/svg+xml' })); return; }
        const p = e.target.closest('[data-png]'); if (p) toPNG(p.dataset.png, theme, 512);
      });
    },
  };
})();

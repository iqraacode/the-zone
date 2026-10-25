// Writes every Pip expression as a standalone SVG (light + dark) into assets/pip/.
// Usage (from the project folder):  node tools/export_pip.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

global.window = { App: {} };
const App = window.App;
App.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
App.rng = (seed) => { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
App.hash = () => 0;
eval(fs.readFileSync(path.join(root, 'js/sketch.js'), 'utf8'));

for (const theme of ['light', 'dark']) {
  const dir = path.join(root, 'assets/pip', theme);
  fs.mkdirSync(dir, { recursive: true });
  for (const pose of Object.keys(App.PIP_POSES)) {
    fs.writeFileSync(path.join(dir, `pip-${pose}.svg`), '<?xml version="1.0" encoding="UTF-8"?>\n' + App.pipStandalone(pose, theme) + '\n');
  }
}
console.log('Exported', Object.keys(App.PIP_POSES).length, 'expressions × 2 themes to assets/pip/');

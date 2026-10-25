# Games folder

`arcade-club/` is your Arcade Club (14 party games). Zone opens each game straight from here in a frame.

Zone-specific changes in this copy (your original project is untouched):
- `css/nook-skin.css` — Zone's sketchbook look (paper, ink outlines, Kalam + Atkinson fonts, palette, wobble/boil), loaded after `arcade.css`.
- `index.html` — follows Zone's light/dark/motion settings, hides "Back to site" inside Zone, loads Zone's fonts.
- Game drawing colours in `js/` were softened toward Zone's palette.

- `js/shell.js` — a small "Zone bridge": inside Zone the arcade's own top bar is hidden, Zone's header buttons (help, sound, pause, restart) control the game, "Back to games" returns to Zone's library, and results trigger Pip's celebration in Zone.

If you replace this folder with a fresh copy of your project, these changes need re-applying (ask Claude).

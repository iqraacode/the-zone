# Arcade Club 🎮

Fourteen original, fully playable mini-games for 1–3 players, built with plain HTML, CSS and JavaScript.
No framework, no build step, no backend, no external images.

## Run it

Open `index.html` in any modern browser (double-clicking works; no server needed).

## Files

```
arcade-club/
├── index.html            Page shell: loads the font, CSS and scripts
├── css/arcade.css        All styles, every selector scoped under .arc
└── js/
    ├── core.js           Namespace, safe DOM helpers, storage, sound, canvas helper, buzzers, steering pads, game lifecycle
    ├── art.js            Original vector art: 14 thumbnails, 12 memory cards, 6 fruits, icons
    ├── shell.js          Arcade home + shared play screen (HUD, setup, pause, help, results, routing)
    └── games/
        ├── memory.js     Memory Splash
        ├── dots.js       Dot Beach
        ├── tictac.js     Tic Tac Trip
        ├── golf.js       Mini Golf Getaway
        ├── racers.js     Tiny Racers
        ├── reflex.js     Fruit Reflex
        ├── clash.js      Color Clash
        ├── jump.js       Sunny Jump
        ├── hippos.js     Hippo Lagoon
        ├── skewer.js     Skewer Spin
        ├── paint.js      Paint Party
        ├── darts.js      Beach Darts
        ├── snake.js      Eel Duel
        └── math.js       Sum Splash
```

## Add it to your website

1. Copy the `arcade-club` folder into your project (e.g. next to your other pages).
2. **Option A — its own page (easiest):** link to it from your nav:
   `<a href="arcade-club/index.html">Arcade</a>`
   Then edit `data-home-href` in `arcade-club/index.html` so “Back to site” points at your homepage, e.g. `data-home-href="../index.html"`.
3. **Option B — inside one of your existing pages:**
   - In `<head>`: add the Fredoka font link and `<link rel="stylesheet" href="arcade-club/css/arcade.css">`.
   - Where the arcade should appear: `<div data-arcade-club data-home-href="index.html" data-home-label="Back to site"></div>`
   - Before `</body>`, add the scripts **in this order**: `core.js`, `art.js`, the 14 files in `games/`, then `shell.js` (paths prefixed with `arcade-club/`).

Notes for integration:
- Styles are scoped under `.arc`, and scripts only create one global: `window.ArcadeClub`. Your site's CSS/JS won't be touched.
- Games open in a full-screen play view and use the URL hash (`#play/golf`) so the browser Back button works. If your page already uses hash routing, prefer Option A.
- Saved data lives in `localStorage` under a single key, `arcadeClub:v1`.
- Change the look in one place: the colour variables at the top of `css/arcade.css`.

## The games

| Game | Players | Solo mode | How it works |
|---|---|---|---|
| Memory Splash | 1–3 | Beat your best moves & time | Turn-based; pairs score and give another turn. 3 board sizes. |
| Dot Beach | 1–3 | vs 1–2 CPUs | Dots & boxes. CPU takes free boxes, avoids giving any, sacrifices the smallest chain. 3 sizes. |
| Tic Tac Trip | 1–3 | vs CPU (3×3) or 2 CPUs (4×4) | 2P classic 3×3; 3P on 4×4, three in a row wins. Hard CPU on 3×3 plays perfectly. Single round or first-to-3. |
| Mini Golf Getaway | 1–3 | Beat par / your best | Real friction & collision physics, 5 holes with walls, bumpers, sand, water, a sliding gate. Turn-based per hole. |
| Tiny Racers | 1–3 + 0–3 CPUs | vs CPU racers | Simultaneous. Keys: P1 WASD, P2 Arrows, P3 IJKL. Touch: auto-gas, ◀ ▶ steer, both = brake. Countdown, laps, podium. |
| Fruit Reflex | 1–3 | Score challenge | Simultaneous. Keys: P1 Q, P2 P, P3 Space (solo: Space). Big tap buttons on touch. Decoys, false starts and misses cost points. |
| Color Clash | 1–3 | vs 1–2 CPUs | Grow from a corner; each move paints a whole patch of same-pattern tiles. Biggest territory wins. |
| Sunny Jump | 1–3 | High score | Endless runner; tap/Space to jump, hold for higher. Players take turns, then compare. |
| Hippo Lagoon | 1–3 + CPU hippos | vs CPU hippos | Simultaneous. Keys Q / P / Space or tap your corner. Lunge to gobble rolling pearls (gold = 3). Most points wins. |
| Skewer Spin | 1–3 | Level challenge | Throw skewers into a spinning log; hitting another skewer bounces off. Solo: clear levels, one clang ends the run. 2–3P: everyone throws at once for 45 s. |
| Paint Party | 1–3 + CPU painters | vs CPU painters | Simultaneous. Steer your roller (A/D, ←/→, J/L or touch ◀ ▶); paint over rivals, grab buckets for splashes. Each colour has its own pattern. |
| Beach Darts | 1–3 | vs CPU | 101 or 301 countdown, exact zero to win, busts reset the turn. Wobbly aim; CPU plans checkouts. |
| Eel Duel | 1–3 + CPU eels | Classic or vs CPU | Grid snake battle: eat fish to grow, crash and you're out, last eel wins. Keys WASD / Arrows / IJKL, touch ◀ ▶ or swipe. |
| Sum Splash | 1–3 | 60-second sprint | Solo: answer as many sums as you can. 2–3P: buzz in (Q / P / Space), then pick the answer (1–4). First to the target wins. |

## Testing done (headless Chromium, automated)

- Every game played through to its results screen in each mode tested (1, 2 and 3 players, CPU levels and board sizes); score totals checked against the board (e.g. boxes / tiles always add up).
- Every one of the 14 games was played automatically to its results screen in 1P and multiplayer modes, with no script errors.
- Mini golf: a brute-force shot solver confirmed every hole can be sunk under par.
- 5 restarts in a row still run exactly one animation loop; leaving a game (Back button or on-screen back) stops all loops.
- Pause freezes real-time games; resume continues.
- Preferences (players, sound, favourites) persist across reloads; four kinds of corrupted saved data load without errors.
- Search, categories and favourites filter correctly; keyboard-only play works; reduced-motion mode works.
- Desktop (1280–1440 px), tablet (820 px) and phone (390 px, touch) layouts screenshotted and checked.

## Known limitations

- Multiplayer is local (same device). There is no online play.
- Testing was automated in Chromium; Safari and Firefox weren't run here. Everything uses standard APIs, but a quick manual check on an iPhone/iPad is worth doing.
- Sound was not audible in testing (headless); it is generated with the Web Audio API and only starts after the first tap/click.
- The Fredoka font loads from Google Fonts; offline, a rounded system font is used instead.
- Tiny Racers on a phone with 3 players gives each player a fairly narrow control pad; a tablet is more comfortable.

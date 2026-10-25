# Zone — a cozy digital sanctuary

A calm place to read, watch, play, listen and rest, with hand-drawn doodles and slow looping animation. Written in plain HTML, CSS and JavaScript: there is no build step, no framework and no backend.

## Run it

Open the folder in VS Code and start **Live Server** on `index.html`, or use any static server:

```bash
python3 -m http.server 8130
```

Then visit <http://localhost:8130>. Opening `index.html` straight from the file system (`file://`) mostly works too. The plug-in game slots need a server, though, because the browser won't let the page check whether those files exist.

## What's inside

| Area | What it does |
| --- | --- |
| **Home** | A greeting that changes with the time of day, a clock, and the hand-drawn room (sun and drifting clouds by day, rain and a reading Pip at night). Also quick access, *Continue where you left off*, *Continue reading*, *Recently played*, and picks for the time of day. |
| **Reading** | Library shelves, search, categories, favorites, bookmarks, reading stats and saved position. The reader has text size, spacing, width, serif/sans, five paper colours, focus mode (Esc exits) and a reading timer. You can add your own text by pasting it or importing a `.txt`/`.md` file. |
| **Videos** | YouTube only: 27 checked videos (Blender open movies, Kurzgesagt, relaxing ambience, Lofi Girl live streams, classical piano). They play through YouTube's IFrame player, so continue-watching progress is saved. Also has watch later, favorites, playlists and theater mode, and you can add any YouTube link. |
| **Games** | **Mochi 2048** (drop lumpy, rolling number blobs into a jar; equal numbers merge. You lose if the pile presses both round side buttons fully in at the same time. Has combos, an end screen and a top-10 list), plus Minesweeper, Memory Match and Tic-tac-toe. All have saved best scores, pause and full screen. **Sudoku, Snake and Word Puzzle are plug-in slots for your own games** (see below). |
| **Meet Pip** | `#/pip`: all 17 of the mascot's expressions (content, hello, happy, laughing, celebrating, in love, wink, surprised, curious, thinking, shy, sad, grumpy, focused, dizzy, sleepy, reading), each downloadable as an animated SVG or a 512 px PNG. The same files are in `assets/pip/light/` and `assets/pip/dark/`. |
| **Chess** | A monochrome board that follows the reference design. It has full rules (castling, en passant, promotion, check/mate, stalemate, threefold repetition, the 50-move rule, insufficient material), SAN move history, undo, resign, captured pieces, and drag or tap to move. You can play two-player or against **Snailfish**, an alpha-beta engine (Easy / Medium / Hard) that runs in a Web Worker. Board styles are Paper, Graphite and Ink, pieces are Classic or Sketch, and the game is saved automatically. |
| **Music** | 16 original **generative** tracks synthesised live with the Web Audio API (lo-fi, ambient, classical, nocturne, jazz, rain/forest/ocean, focus, sleep). Includes queue, shuffle, repeat, seek, volume, playlists, likes, recently played, a visualiser, a mini-player that keeps playing as you move between pages, and lock-screen controls. You can also add your own audio URLs or local files. |
| **All** | A single explorer across every content type, with filters, favorites, recent activity and *Discover something new*. |
| **Search** | Press `/` or `⌘K` / `Ctrl+K` anywhere. Results are grouped by type, with filters, sorting and keyboard navigation. |
| **Ambience** | The cloud button in the top bar opens rain, fireplace, wind, forest, waves and café sounds (all generated, never autoplayed), plus a focus timer. |
| **Settings** | Auto / Light / Dark theme (Auto is light from 07:00 to 19:00 by default and you can change the hours), accent colour, reduced motion, decorative animation level (Full / Calm / Off), text size, mascot on/off, ambience volume, focus-timer notifications, data export and reset. |

## Sounds (made with Python)

Mochi 2048's sounds (merge pops on a pentatonic scale, drops, landings, combos, new best, game over, clicks) are WAV files in `assets/sfx/`. `tools/make_sfx.py` synthesised them using only Python's standard library, so no installs are needed. To tweak and regenerate them:

```bash
python3 tools/make_sfx.py
```

Pip's SVG files can be regenerated with `node tools/export_pip.js`.

## Plugging in your own Sudoku, Snake and Word games

Each slot loads a normal web page in an iframe:

```
games/sudoku/index.html
games/snake/index.html
games/words/index.html
```

Copy your game folder into place, make sure its start page is called `index.html`, and reload. The game will then open inside the arcade, with favorites, recently played and full screen working for it. Until a game is there, its card opens a friendly page with these same steps. Zone does not fake a copy of the game.

To rename a slot or add another one, edit the `C.games` list in `js/content.js`.

## Project structure

```
index.html           shell + theme-before-paint script
css/base.css         design tokens, both themes, shell, components, doodle & motion language
css/pages.css        home, cards, all, reading, reader, videos, music, settings
css/games.css        arcade + game surfaces
css/chess.css        the monochrome chess room
css/handmade.css     the sketchbook layer (loaded last): dotted paper, marker-ink outlines, tape, sticky notes, highlighter
js/core.js           storage (safe against bad data), events, settings, theme, favorites, activity, toasts, modals
js/sketch.js         icons, sketchy path helpers, doodles, Pip the mascot, hero room, covers
js/content.js        books (original samples), videos (Commons), games registry, generative track list
js/audio.js          generative music engine, player, ambient mixer, focus timer
js/shell.js          navigation, router, universal search, mini-player, ambience panel
js/chess-engine.js   chess rules + Snailfish search (self-contained, also runs in a worker)
js/pages/*.js        one file per destination
js/games/*.js        the built-in games
```

## Data and privacy

Everything is stored in this browser's `localStorage` under keys starting with `nook:`: favorites, progress, bookmarks, scores, playlists, preferences and your added texts and links. Nothing is sent anywhere. Settings → *Your data* lets you export or reset it.

## Honest limits

- Videos need an internet connection to reach YouTube. A few uploads don't allow embedding, and YouTube's player says so when that happens.
- Local audio files you pick play only for the current visit, because browsers can't store them in `localStorage`.
- Fonts load from Google Fonts. Without a connection the app falls back to system fonts.
- There are no accounts and no syncing across devices. That would need a backend.

## Credits

- Sample reading: original short pieces written for Zone.
- Videos: played from YouTube. The channel is credited on every video.
- Illustrations, the mascot Pip, the chess pieces and the music are original to this project.

/* Zone — the monochrome chess room. Layout follows the reference: menu + help, move badge,
   opponent row, board, "You · your move" row, and a Moves / Rules / Undo / Resign / New toolbar. */
(function () {
  'use strict';
  const App = window.App;
  const { esc, icon, $, $$ } = App;

  /* ---------------- pieces (original SVG drawings) ---------------- */
  const SHAPES = {
    p: '<circle cx="22.5" cy="12" r="5.2"/><path d="M18.3 19.6h8.4M18.8 21c0 4.8-2.3 8.6-5.3 12.4h18c-3-3.8-5.3-7.6-5.3-12.4z"/><rect x="11.5" y="33.4" width="22" height="5" rx="2"/>',
    r: '<path d="M11.5 9h4.6v3.6h3.5V9h5.8v3.6h3.5V9h4.6v7h-22z"/><path d="M14 16h17l-2 3H16z"/><path d="M16 19h13v12H16z"/><path d="M14 31h17l2 3H12z"/><rect x="10.5" y="34" width="24" height="4.6" rx="1.5"/>',
    n: '<path d="M23 8.8c7.6.5 13 6.6 12.6 15.6L35.2 34.6H15.4c0-4.6 2-7.6 5.9-10.1 2.2-1.5 3-3.6 2.4-5.6-2 1.8-3.8 2.5-6.4 3.5-1.6.7-2.4 2.6-4.4 2.4-2-.3-3.5-1.8-3.1-3.7.4-2.4 3.8-5.8 6.3-8.7 1.5-1.7 2.4-3.6 3-5.6l1.4-2.6 1.6 2.4z"/><rect x="12.5" y="34" width="24.5" height="4.6" rx="1.5"/>',
    b: '<circle cx="22.5" cy="7.6" r="2.7"/><path d="M22.5 10.4c-6.2 4.1-8.2 10.2-6.1 15.2h12.2c2.1-5 .1-11.1-6.1-15.2z"/><rect x="15.4" y="25.6" width="14.2" height="3.3" rx="1.6"/><path d="M18.4 28.9h8.2l1 3.1H17.4z"/><path d="M8.5 37.2c4.6 0 9.2-1.2 14-4.9 4.8 3.7 9.4 4.9 14 4.9v1.8c-5 0-9.6-1-14-3.6-4.4 2.6-9 3.6-14 3.6z"/>',
    q: '<circle cx="7.6" cy="12.6" r="2.4"/><circle cx="15" cy="9.2" r="2.4"/><circle cx="22.5" cy="7.8" r="2.4"/><circle cx="30" cy="9.2" r="2.4"/><circle cx="37.4" cy="12.6" r="2.4"/><path d="M9 15l4 14h19l4-14-6.5 10-1-13.5-6 12.5-6-12.5-1 13.5z"/><path d="M13 29c4 1.5 15 1.5 19 0l-1 3.5c-4 1.5-13 1.5-17 0z"/><path d="M12.4 34.2c5.6 1.6 14.6 1.6 20.2 0l.5 3.8c-6.1 1.6-15.1 1.6-21.2 0z"/>',
    k: '<path d="M21.3 3.4h2.4v3h3v2.4h-3V12h-2.4V8.8h-3V6.4h3z"/><path d="M22.5 13c2.7 0 4.1 2 3.9 4.3-.2 2.5-1.7 4.8-3.9 8.2-2.2-3.4-3.7-5.7-3.9-8.2-.2-2.3 1.2-4.3 3.9-4.3z"/><path d="M22.5 25.6c3.5-7.6 11.6-10.1 15.1-5.6 3.2 4.3-1 9.1-4.6 10.6H12c-3.6-1.5-7.8-6.3-4.6-10.6 3.5-4.5 11.6-2 15.1 5.6z"/><path d="M12 30.6c5 1.5 16 1.5 21 0l-.8 3.5c-5 1.4-14.4 1.4-19.4 0z"/><path d="M11.8 35c5.6 1.5 15.8 1.5 21.4 0l.5 3.5c-6.1 1.6-16.3 1.6-22.4 0z"/>',
  };
  const DETAIL = {
    p: '', r: 'M12.5 16h20M16.5 19.2h12M16.5 30.8h12M12.5 34h20',
    n: 'M26.5 11.5c3.6 2.6 6.1 7.2 6.1 13.4M18.6 14.6h.1M11.4 22.3h.1',
    b: 'M22.5 14.8v6.2M19.4 17.9h6.2',
    q: 'M13.6 29.6c4 1.2 13.8 1.2 17.8 0M14.2 32.8c4 1.3 12.6 1.3 16.6 0',
    k: 'M13 31.2c5 1.2 14 1.2 19 0M13 34c5 1.2 14 1.2 19 0',
  };
  const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  /* the cute set (default): chunky, round, thick outline, flat two-tone cartoon shading */
  const CUTE = {
    p: '<circle cx="22.5" cy="12.6" r="5.6"/><path d="M17 33c0-6 2.4-9.6 4-12.2h3c1.6 2.6 4 6.2 4 12.2z"/><rect x="18" y="18.2" width="9" height="3.4" rx="1.7"/><rect x="12.5" y="31.6" width="20" height="6" rx="3"/>',
    r: '<path d="M14.5 15.5h16l-.8 16.5H15.3z"/><path d="M12.5 8.6q0-.9.9-.9h3.9q.9 0 .9.9v2.6h2.2V8.6q0-.9.9-.9h3.4q.9 0 .9.9v2.6h2.2V8.6q0-.9.9-.9h3.9q.9 0 .9.9v6.4q0 1.2-1.2 1.2H13.7q-1.2 0-1.2-1.2z"/><rect x="11.5" y="31" width="22" height="6.6" rx="3"/>',
    n: '<path d="M26.8 8c6.8 1 8.8 8 7.4 16.4L33.4 31H16.2c0-4.2 1.8-6.8 5.4-8.8-2.2.1-5 1-7.4 1-2.6 0-3.8-2.5-2.8-4.6 1.4-3 5.4-5.4 7.8-8l.6-3.6 3 2.1z"/><rect x="13.5" y="30.4" width="21.5" height="6.8" rx="3"/>',
    b: '<circle cx="22.5" cy="7.6" r="2.5"/><path d="M22.5 10c6.4 4.3 8 11.4 5 17H17.5c-3-5.6-1.4-12.7 5-17z"/><rect x="16" y="26.4" width="13" height="3.8" rx="1.9"/><rect x="12.5" y="31.4" width="20" height="6.2" rx="3"/>',
    q: '<path d="M11.4 14.2L15 27h15l3.6-12.8-5.6 7.6-5.5-10.4-5.5 10.4z"/><circle cx="11" cy="12.6" r="2.5"/><circle cx="16.6" cy="10.4" r="2.3"/><circle cx="22.5" cy="9.2" r="2.5"/><circle cx="28.4" cy="10.4" r="2.3"/><circle cx="34" cy="12.6" r="2.5"/><rect x="14.2" y="26.4" width="16.6" height="4.4" rx="2.2"/><rect x="12" y="31.2" width="21" height="6.4" rx="3"/>',
    k: '<path d="M21.3 4.6h2.4v2.9h2.9v2.4h-2.9v3.4h-2.4V9.9h-2.9V7.5h2.9z"/><path d="M13.2 26c-4.2-4-3-11 2.4-11 3 0 5 2 6.9 4.6 1.9-2.6 3.9-4.6 6.9-4.6 5.4 0 6.6 7 2.4 11z"/><path d="M19.4 17.4c-.2-3.6 6.4-3.6 6.2 0"/><rect x="14" y="25.4" width="17" height="4.4" rx="2.2"/><rect x="12" y="30.8" width="21" height="6.8" rx="3"/>',
  };
  const CUTE_DETAIL = {
    p: '', r: '<path class="pc-line" d="M15 16.4h15"/>',
    n: '<circle class="pc-eye" cx="21.8" cy="14.2" r="1.5"/><circle class="pc-dot" cx="13.6" cy="20" r=".8"/><path class="pc-line" d="M27.6 10.2c3.4 2.4 4.8 6.8 4.4 11.8"/>',
    b: '<path class="pc-line" d="M24.6 13.6l-4 5.6"/>', q: '', k: '',
  };
  /* gradients (cel shading) and two "boil" filters live once on the page */
  function ensureDefs() {
    if (document.getElementById('nook-pc-defs')) return;
    const d = document.createElement('div');
    d.innerHTML = `<svg id="nook-pc-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <linearGradient id="nook-pc-w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#ffffff"/><stop offset=".62" stop-color="#d7d7d7"/><stop offset="1" stop-color="#cbcbcb"/></linearGradient>
      <linearGradient id="nook-pc-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3c3c3c"/><stop offset=".2" stop-color="#3c3c3c"/><stop offset=".2" stop-color="#6c6c6c"/><stop offset=".36" stop-color="#6c6c6c"/><stop offset=".36" stop-color="#3c3c3c"/><stop offset="1" stop-color="#353535"/></linearGradient>
      <filter id="nook-boil-a" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="1" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.3"/></filter>
      <filter id="nook-boil-b" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="1" seed="9"/><feDisplacementMap in="SourceGraphic" scale="1.3"/></filter>
    </defs></svg>`;
    document.body.appendChild(d.firstChild);
  }
  function pieceSVG(p, style) {
    const t = p.toLowerCase(), white = p !== t;
    if (style === 'classic') {   // the cute set
      return `<svg class="pc pc-cute ${white ? 'pc-w' : 'pc-b'}" viewBox="0 0 45 45" aria-hidden="true">
        <ellipse class="pc-shadow" cx="24.4" cy="38.4" rx="11" ry="2.3"/>
        <g class="pc-body" fill="url(#${white ? 'nook-pc-w' : 'nook-pc-b'})">${CUTE[t]}${CUTE_DETAIL[t]}</g></svg>`;
    }
    const st = style === 'flat' ? 'classic' : style;
    return `<svg class="pc ${white ? 'pc-w' : 'pc-b'} pc-${st}" viewBox="0 0 45 45" aria-hidden="true">
      ${st === 'sketch' && !white ? '<defs><pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="#fff"/><path d="M0 0v3" stroke="#111" stroke-width="2.2"/></pattern></defs>' : ''}
      <g class="pc-body">${SHAPES[t]}</g>${DETAIL[t] ? `<path class="pc-detail" d="${DETAIL[t]}"/>` : ''}</svg>`;
  }

  const DEFAULTS = { mode: 'ai', level: 'medium', color: 'w', colorPref: 'w', board: 'paper', pieces: 'classic', hints: true, flipped: false };
  const LEVEL_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const RULES = `
    <div class="rules">
      <p><b>Goal.</b> Checkmate the opposing king: attack it so it has no legal escape.</p>
      <ul>
        <li><b>King</b> — one square any direction. Never into check.</li>
        <li><b>Queen</b> — any distance in straight lines and diagonals.</li>
        <li><b>Rook</b> — any distance along ranks and files.</li>
        <li><b>Bishop</b> — any distance diagonally.</li>
        <li><b>Knight</b> — an L-shape, jumping over pieces.</li>
        <li><b>Pawn</b> — forward one square (two from its first square), captures diagonally.</li>
      </ul>
      <p><b>Castling.</b> King moves two squares toward a rook, which hops over it. Allowed only if neither has moved, the squares between are empty, and the king is not in, through or into check.</p>
      <p><b>En passant.</b> A pawn that advances two squares can be captured by an enemy pawn beside it, as if it had moved one — only on the very next move.</p>
      <p><b>Promotion.</b> A pawn reaching the last rank becomes a queen, rook, bishop or knight.</p>
      <p><b>Draws.</b> Stalemate, threefold repetition, the fifty-move rule, or too little material to mate.</p>
      <p class="fine-print">Tap a piece to see its legal moves, then tap a destination — or drag it. Keyboard: arrow keys move around the board, Enter selects.</p>
    </div>`;

  App.pages.chess = {
    title: 'Chess',
    render(root, params) {
      const core = App.chessCore;
      let S = Object.assign({}, DEFAULTS, App.store.get('chessPrefs', {}));
      let game, record, result = null, selected = -1, legal = [], thinking = false, token = 0, focusSq = 52, dragging = null, lastMove = null;
      const saveRecord = () => App.store.set('chessGame', { mode: S.mode, level: S.level, color: S.color, moves: record, result });
      const savePrefs = () => App.store.set('chessPrefs', S);
      const humanTurn = () => S.mode === 'pvp' || game.turn === S.color;

      root.innerHTML = `
      <section class="chess-page">
        <div class="cz-top">
          <button type="button" class="icon-btn cz-ic" data-cz="menu" aria-label="Game menu" aria-expanded="false">${icon('menu')}</button>
          <button type="button" class="icon-btn cz-ic" data-cz="help" aria-label="Chess rules">${icon('help')}</button>
        </div>
        <div class="cz-layout">
          <div class="cz-main">
            <div class="cz-badge-row"><span class="cz-badge" aria-label="Move number">1.</span></div>
            <div class="cz-player cz-opp"></div>
            <div class="cz-board-wrap">
              <div class="cz-board" role="grid" aria-label="Chess board"></div>
              <svg class="cz-annot" viewBox="0 0 800 800" aria-hidden="true"></svg>
            </div>
            <div class="cz-player cz-me"></div>
            <nav class="cz-toolbar" aria-label="Game controls">
              <button type="button" data-cz="moves">${icon('list')}<span>Moves</span></button>
              <button type="button" data-cz="rules">${icon('help')}<span>Rules</span></button>
              <button type="button" data-cz="undo">${icon('undo')}<span>Undo</span></button>
              <button type="button" data-cz="resign">${icon('flag')}<span>Resign</span></button>
              <button type="button" data-cz="new">${icon('plus')}<span>New</span></button>
            </nav>
          </div>
          <aside class="cz-side" aria-label="Move history">
            <div class="cz-side-head"><h2>Moves</h2><span class="cz-result"></span></div>
            <ol class="cz-moves"></ol>
            <div class="cz-side-foot"><button type="button" class="cz-link" data-cz="flip">${icon('flip')}Flip board</button><button type="button" class="cz-link" data-cz="menu">${icon('settings')}Game settings</button></div>
          </aside>
        </div>
        <div class="cz-drawer" hidden></div>
        <div class="cz-sheet" hidden></div>
      </section>`;
      ensureDefs();
      const page = $('.chess-page', root), boardEl = $('.cz-board', page), annot = $('.cz-annot', page);
      // overlays live on <body> so the page's enter animation can never trap them
      const drawerEl = $('.cz-drawer', page), sheetEl = $('.cz-sheet', page);
      drawerEl.classList.add('cz-overlay'); sheetEl.classList.add('cz-overlay');
      document.body.append(drawerEl, sheetEl);

      /* -------- board construction -------- */
      const sqOrder = () => { const a = []; for (let i = 0; i < 64; i++) a.push(S.flipped ? 63 - i : i); return a; };
      function buildBoard() {
        boardEl.innerHTML = sqOrder().map((sq, idx) => {
          const r = sq >> 3, f = sq & 7, light = (r + f) % 2 === 0, col = idx % 8, row = idx >> 3;
          return `<button type="button" class="sq ${light ? 'l' : 'd'}" data-sq="${sq}" role="gridcell" tabindex="${sq === focusSq ? 0 : -1}">
            ${col === 0 ? `<span class="co co-r">${8 - r}</span>` : ''}${row === 7 ? `<span class="co co-f">${'abcdefgh'[f]}</span>` : ''}<span class="pw"></span></button>`;
        }).join('');
        page.dataset.board = S.board;
      }
      const sqEl = (sq) => boardEl.querySelector(`[data-sq="${sq}"]`);
      function paint() {
        const check = game.inCheck() ? game.kingSq(game.turn) : -1;
        for (let sq = 0; sq < 64; sq++) {
          const el = sqEl(sq), p = game.board[sq];
          const pw = el.querySelector('.pw');
          const want = p ? p + S.pieces : '';
          if (pw.dataset.p !== want) { pw.innerHTML = p ? pieceSVG(p, S.pieces) : ''; pw.dataset.p = want; }
          const isLegal = S.hints && legal.some((m) => m.to === sq);
          el.classList.toggle('sel', sq === selected);
          el.classList.toggle('last', !!lastMove && (lastMove.from === sq || lastMove.to === sq));
          el.classList.toggle('dot', isLegal && !p && !legal.some((m) => m.to === sq && m.flag === 'e'));
          el.classList.toggle('cap', isLegal && (!!p || legal.some((m) => m.to === sq && m.flag === 'e')));
          el.classList.toggle('chk', sq === check);
          const name = p ? `${p === p.toUpperCase() ? 'white' : 'black'} ${NAMES[p.toLowerCase()]}` : 'empty';
          el.setAttribute('aria-label', `${core.sqName(sq)}, ${name}${sq === selected ? ', selected' : ''}${isLegal ? ', legal move' : ''}`);
        }
        drawAnnotations(check);
        drawPlayers(); drawMoves();
        $('.cz-badge', page).textContent = game.full + '.';
        $('[data-cz="undo"]', page).classList.toggle('is-off', !record.length);
      }
      /* hand-drawn annotations: a sketch ring on the selection and around a checked king */
      function drawAnnotations(check) {
        const pos = (sq) => { let f = sq & 7, r = sq >> 3; if (S.flipped) { f = 7 - f; r = 7 - r; } return [f * 100 + 50, r * 100 + 50]; };
        let out = '';
        if (selected >= 0) { const [x, y] = pos(selected); out += `<path class="an-ring" pathLength="1" d="${App.sketch.circle(x, y, 44, 42, selected + 11, 0.05, 0.5)}"/>`; }
        if (check >= 0) { const [x, y] = pos(check); out += `<path class="an-check" pathLength="1" d="${App.sketch.circle(x, y, 46, 45, 77, 0.06, 0.6)}"/><path class="an-check" d="${App.sketch.circle(x, y, 40, 40, 78, 0.05, 0.3)}"/>`; }
        annot.innerHTML = out;
      }

      /* -------- players, captured pieces, history -------- */
      function captured() {
        const caps = { w: [], b: [] }; // pieces captured BY each side
        game.stack.forEach((u) => { if (u.m.cap) caps[core.colorOf(u.m.p)].push(u.m.cap); });
        const v = { p: 1, n: 3, b: 3, r: 5, q: 9 }; const sum = (a) => a.reduce((n, p) => n + v[p.toLowerCase()], 0);
        const ord = 'qrbnp'; const sort = (a) => a.slice().sort((x, y) => ord.indexOf(x.toLowerCase()) - ord.indexOf(y.toLowerCase()));
        return { w: sort(caps.w), b: sort(caps.b), diff: sum(caps.w) - sum(caps.b) };
      }
      function drawPlayers() {
        const me = S.mode === 'pvp' ? (S.flipped ? 'b' : 'w') : S.color, opp = me === 'w' ? 'b' : 'w', cap = captured();
        const capHtml = (side) => { const d = side === 'w' ? cap.diff : -cap.diff; return `<span class="cz-caps">${cap[side].map((p) => `<span class="cz-cap">${pieceSVG(p, 'classic')}</span>`).join('')}${d > 0 ? `<b class="cz-adv">+${d}</b>` : ''}</span>`; };
        const colorName = (c) => (c === 'w' ? 'White' : 'Black');
        const turnTxt = (c) => {
          if (result) return '';
          if (game.turn !== c) return '';
          if (S.mode === 'ai' && c === opp) return thinking ? ' · <span class="cz-think">thinking' + `<span class="cz-scrib">${App.doodle.scribble()}</span></span>` : '';
          return ` · <b>${S.mode === 'ai' ? 'your move' : 'to move'}</b>`;
        };
        const oppName = S.mode === 'ai' ? `Snailfish <span class="cz-dim">(${LEVEL_LABEL[S.level]})</span>` : `${colorName(opp)}`;
        const meName = S.mode === 'ai' ? `You <span class="cz-dim">(${colorName(me)})</span>` : `${colorName(me)}`;
        $('.cz-opp', page).innerHTML = `<span class="cz-av cz-av-solid">${S.mode === 'ai' ? 'S' : opp === 'w' ? 'W' : 'B'}</span><div class="cz-pinfo"><div class="cz-name">${oppName}${turnTxt(opp)}</div>${capHtml(opp)}</div>`;
        $('.cz-me', page).innerHTML = `<span class="cz-av cz-av-line">${S.mode === 'ai' ? 'You' : me === 'w' ? 'W' : 'B'}</span><div class="cz-pinfo"><div class="cz-name">${meName}${turnTxt(me)}</div>${capHtml(me)}</div>`;
        const ttl = result ? resultText() : '';
        $('.cz-result', page).textContent = ttl;
      }
      function sanList() {
        const g = new core.Game(); const out = [];
        record.forEach((mv) => { const m = g.moves().find((x) => x.from === mv.from && x.to === mv.to && (x.promo || null) === (mv.promo || null)); if (!m) return; out.push(g.san(m)); g.make(m); });
        return out;
      }
      function movesHtml() {
        const sans = sanList(); let html = '';
        for (let i = 0; i < sans.length; i += 2) html += `<li><span class="mn">${i / 2 + 1}.</span><span class="mv ${i === sans.length - 1 ? 'cur' : ''}">${esc(sans[i])}</span><span class="mv ${i + 1 === sans.length - 1 ? 'cur' : ''}">${esc(sans[i + 1] || '')}</span></li>`;
        return html || '<li class="cz-none">No moves yet — White to play.</li>';
      }
      function drawMoves() {
        const ol = $('.cz-moves', page); ol.innerHTML = movesHtml(); ol.scrollTop = ol.scrollHeight;
        const sh = sheetEl; if (!sh.hidden) { const l = $('.cz-moves', sh); if (l) l.innerHTML = movesHtml(); }
      }
      function resultText() {
        if (!result) return '';
        const who = result.result === '1-0' ? 'White wins' : result.result === '0-1' ? 'Black wins' : 'Draw';
        return `${who} · ${result.reason}`;
      }

      /* -------- game flow -------- */
      function newGame(opts = {}) {
        token++; thinking = false;
        Object.assign(S, opts);
        if (S.mode === 'ai') S.color = S.colorPref === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : S.colorPref === 'b' ? 'b' : 'w';
        if (S.mode === 'ai') S.flipped = S.color === 'b';
        savePrefs();
        game = new core.Game(); record = []; result = null; selected = -1; legal = []; lastMove = null;
        buildBoard(); paint(); saveRecord();
        App.activity.log({ type: 'chess', id: S.mode === 'ai' ? 'ai' : 'pvp', title: S.mode === 'ai' ? 'Chess vs Snailfish' : 'Chess · two players', sub: S.mode === 'ai' ? LEVEL_LABEL[S.level] : 'Pass and play' });
        maybeAI();
      }
      function loadSaved() {
        const g = App.store.get('chessGame', null);
        game = new core.Game(); record = []; result = null;
        if (g && Array.isArray(g.moves)) {
          S.mode = g.mode === 'pvp' ? 'pvp' : 'ai'; S.level = LEVEL_LABEL[g.level] ? g.level : S.level; S.color = g.color === 'b' ? 'b' : 'w';
          for (const mv of g.moves) { const m = game.moves().find((x) => x.from === mv.from && x.to === mv.to && (x.promo || null) === (mv.promo || null)); if (!m) break; game.make(m); record.push({ from: m.from, to: m.to, promo: m.promo || null }); lastMove = m; }
          result = g.result || null;
        }
      }
      function applyMove(m, animate = true) {
        const from = m.from, to = m.to, before = sqEl(from).getBoundingClientRect();
        game.make(m); record.push({ from, to, promo: m.promo || null }); lastMove = m;
        selected = -1; legal = [];
        paint();
        if (animate && !App.reducedMotion()) {
          const animatePiece = (fsq, tsq, rect0) => {
            const pw = sqEl(tsq).querySelector('.pw'); const r1 = sqEl(tsq).getBoundingClientRect();
            pw.style.transition = 'none'; pw.style.transform = `translate(${rect0.left - r1.left}px, ${rect0.top - r1.top}px)`; pw.style.zIndex = 5;
            requestAnimationFrame(() => { pw.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)'; pw.style.transform = ''; setTimeout(() => { pw.style.zIndex = ''; pw.classList.remove('landed'); void pw.offsetWidth; pw.classList.add('landed'); setTimeout(() => pw.classList.remove('landed'), 400); }, 230); });
          };
          if (!dragging) animatePiece(from, to, before);
          if (m.flag === 'k' || m.flag === 'q') { const rf = m.flag === 'k' ? to + 1 : to - 2, rt = m.flag === 'k' ? to - 1 : to + 1; animatePiece(rf, rt, sqEl(rf).getBoundingClientRect()); }
        }
        const st = game.status();
        if (st.over) finish(st);
        saveRecord();
        if (!st.over) maybeAI();
      }
      function finish(st) {
        result = { result: st.result, reason: st.reason };
        paint(); saveRecord();
        if (S.mode === 'ai') {
          const won = (st.result === '1-0' && S.color === 'w') || (st.result === '0-1' && S.color === 'b');
          const k = st.result === '1/2-1/2' ? 'd' : won ? 'w' : 'l';
          App.store.update('chessStats', { w: 0, l: 0, d: 0 }, (s) => { s[k]++; });
        }
        setTimeout(() => {
          const won = S.mode === 'ai' && ((st.result === '1-0' && S.color === 'w') || (st.result === '0-1' && S.color === 'b'));
          App.modal({
            title: st.reason === 'checkmate' ? 'Checkmate' : st.reason === 'resignation' ? 'Resigned' : 'Draw',
            className: 'cz-modal',
            body: `<div class="cz-over"><svg viewBox="0 0 220 60" class="cz-over-scrib" aria-hidden="true"><path pathLength="1" d="${App.sketch.underline(220, 5)}"/></svg><p class="cz-over-res">${esc(resultText())}</p><p>${S.mode === 'ai' ? (won ? 'Snailfish tips its tiny hat to you.' : st.result === '1/2-1/2' ? 'An honourable draw.' : 'Snailfish wins this one. Rematch?') : 'Good game.'}</p></div>`,
            actions: [{ label: 'Review board' }, { label: 'New game', primary: true, onClick: () => newGame() }],
          });
        }, App.reducedMotion() ? 50 : 420);
      }
      function maybeAI() {
        if (S.mode !== 'ai' || result || game.turn === S.color) return;
        thinking = true; drawPlayers();
        const my = ++token, t0 = Date.now(), fen = game.fen();
        App.chessThink(fen, S.level).then((mv) => {
          if (my !== token || !mv) return;
          const wait = Math.max(0, 380 - (Date.now() - t0));
          setTimeout(() => {
            if (my !== token) return;
            thinking = false;
            const m = game.moves().find((x) => x.from === mv.from && x.to === mv.to && (x.promo || null) === (mv.promo || null));
            if (m) applyMove(m); else drawPlayers();
          }, wait);
        });
      }
      function tryMove(from, to) {
        const cands = game.moves({ from }).filter((m) => m.to === to);
        if (!cands.length) return false;
        if (cands.length > 1 && cands[0].promo) { promotionDialog(cands); return true; }
        applyMove(cands[0], true);
        return true;
      }
      function promotionDialog(cands) {
        const white = game.turn === 'w';
        App.modal({
          title: 'Promote pawn', className: 'cz-modal',
          body: `<div class="cz-promo">${['q', 'r', 'b', 'n'].map((p) => `<button type="button" data-pr="${p}" aria-label="${NAMES[p]}">${pieceSVG(white ? p.toUpperCase() : p, S.pieces)}<span>${NAMES[p]}</span></button>`).join('')}</div>`,
          onOpen(dlg, close) { dlg.addEventListener('click', (e) => { const b = e.target.closest('[data-pr]'); if (b) { close(); applyMove(cands.find((m) => m.promo === b.dataset.pr), true); } }); },
          onClose: () => { selected = -1; legal = []; paint(); },
        });
      }
      function select(sq) {
        if (result || thinking || !humanTurn()) return;
        const p = game.board[sq];
        if (selected >= 0 && legal.some((m) => m.to === sq)) { tryMove(selected, sq); return; }
        if (p && core.colorOf(p) === game.turn) { selected = sq === selected ? -1 : sq; legal = selected >= 0 ? game.moves({ from: sq }) : []; }
        else { selected = -1; legal = []; }
        paint();
      }
      function undo() {
        if (!record.length) return App.toast('Nothing to undo yet.');
        token++; thinking = false; result = null;
        let n = 1;
        if (S.mode === 'ai' && game.turn === S.color && record.length >= 2) n = 2;
        else if (S.mode === 'ai' && game.turn !== S.color) n = 1;
        for (let i = 0; i < n; i++) { game.undo(); record.pop(); }
        lastMove = game.stack.length ? game.stack[game.stack.length - 1].m : null;
        selected = -1; legal = []; paint(); saveRecord();
        maybeAI();
      }

      /* -------- menus / sheets -------- */
      function drawer(open) {
        const d = drawerEl;
        if (!open) { d.hidden = true; $$('[data-cz="menu"]', page).forEach((b) => b.setAttribute('aria-expanded', 'false')); return; }
        const opt = (k, v, label) => `<button type="button" class="cz-opt ${S[k] === v ? 'on' : ''}" data-set="${k}" data-val="${v}" aria-pressed="${S[k] === v}">${label}</button>`;
        d.innerHTML = `
          <div class="cz-drawer-panel" role="dialog" aria-label="Game menu">
            <div class="cz-dh"><h2>Game</h2><button type="button" class="icon-btn" data-cz="close-menu" aria-label="Close menu">${icon('x')}</button></div>
            <div class="cz-group"><span>Opponent</span><div>${opt('mode', 'ai', 'Snailfish')}${opt('mode', 'pvp', 'A friend')}</div></div>
            <div class="cz-group ${S.mode === 'pvp' ? 'off' : ''}"><span>Difficulty</span><div>${opt('level', 'easy', 'Easy')}${opt('level', 'medium', 'Medium')}${opt('level', 'hard', 'Hard')}</div></div>
            <div class="cz-group ${S.mode === 'pvp' ? 'off' : ''}"><span>Play as</span><div>${opt('colorPref', 'w', 'White')}${opt('colorPref', 'b', 'Black')}${opt('colorPref', 'random', 'Random')}</div></div>
            <button type="button" class="cz-primary" data-cz="apply">Start new game</button>
            <hr>
            <div class="cz-group"><span>Board</span><div>${opt('board', 'paper', 'Paper')}${opt('board', 'graphite', 'Graphite')}${opt('board', 'ink', 'Ink')}</div></div>
            <div class="cz-group"><span>Pieces</span><div>${opt('pieces', 'classic', 'Cute')}${opt('pieces', 'flat', 'Flat')}${opt('pieces', 'sketch', 'Sketch')}</div></div>
            <div class="cz-group"><span>Move hints</span><div>${opt('hints', true, 'Show')}${opt('hints', false, 'Hide')}</div></div>
            <button type="button" class="cz-link" data-cz="flip">${icon('flip')}Flip board</button>
            <a class="cz-link" href="#/home">${icon('home')}Back to Zone</a>
          </div>`;
        d.hidden = false;
        $$('[data-cz="menu"]', page).forEach((b) => b.setAttribute('aria-expanded', 'true'));
        d.querySelector('button').focus();
      }
      function sheet(kind) {
        const sh = sheetEl;
        if (!kind) { sh.hidden = true; return; }
        sh.innerHTML = `<div class="cz-sheet-panel" role="dialog" aria-label="Moves"><div class="cz-dh"><h2>Moves</h2><button type="button" class="icon-btn" data-cz="close-sheet" aria-label="Close">${icon('x')}</button></div>${result ? `<p class="cz-result">${esc(resultText())}</p>` : ''}<ol class="cz-moves">${movesHtml()}</ol></div>`;
        sh.hidden = false;
      }
      const rules = () => App.modal({ title: 'How chess works', body: RULES, className: 'wide cz-modal' });

      const onClick = async (e) => {
        const T = e.target;
        if (T.classList.contains('cz-drawer')) return drawer(false);
        if (T.classList.contains('cz-sheet')) return sheet(false);
        const set = T.closest('[data-set]');
        if (set) {
          const k = set.dataset.set; let v = set.dataset.val; if (v === 'true') v = true; if (v === 'false') v = false;
          S[k] = v;
          if (k === 'board') page.dataset.board = v;
          if (k === 'pieces' || k === 'hints') paint();
          savePrefs(); drawer(true); return;
        }
        const b = T.closest('[data-cz]');
        if (b) {
          const a = b.dataset.cz;
          if (a === 'menu') return drawer(drawerEl.hidden);
          if (a === 'close-menu') return drawer(false);
          if (a === 'close-sheet') return sheet(false);
          if (a === 'help' || a === 'rules') return rules();
          if (a === 'moves') return window.matchMedia('(min-width: 1000px)').matches ? $('.cz-moves', page).scrollIntoView({ block: 'nearest' }) : sheet('moves');
          if (a === 'undo') return undo();
          if (a === 'flip') { S.flipped = !S.flipped; savePrefs(); buildBoard(); paint(); return; }
          if (a === 'apply') { drawer(false); return newGame(); }
          if (a === 'resign') {
            if (result) return App.toast('This game is already over.');
            if (!record.length) return App.toast('No moves have been played yet.');
            if (await App.confirm('Resign this game?', S.mode === 'ai' ? 'Snailfish will be credited with the win.' : `${game.turn === 'w' ? 'White' : 'Black'} resigns.`, 'Resign', true)) {
              token++; thinking = false;
              const loser = S.mode === 'ai' ? S.color : game.turn;
              finish({ over: true, result: loser === 'w' ? '0-1' : '1-0', reason: 'resignation' });
            }
            return;
          }
          if (a === 'new') {
            if (record.length && !result && !(await App.confirm('Start a new game?', 'The current game will be abandoned.', 'New game'))) return;
            return newGame();
          }
        }
        const sq = T.closest('.sq');
        if (sq && !dragMoved) { focusSq = +sq.dataset.sq; select(+sq.dataset.sq); }
      };
      page.addEventListener('click', onClick); drawerEl.addEventListener('click', onClick); sheetEl.addEventListener('click', onClick);

      /* drag and drop with pointer events */
      let dragMoved = false;
      boardEl.addEventListener('pointerdown', (e) => {
        const sqB = e.target.closest('.sq'); if (!sqB || e.button > 0) return;
        const sq = +sqB.dataset.sq, p = game.board[sq];
        dragMoved = false;
        if (!p || core.colorOf(p) !== game.turn || result || thinking || !humanTurn()) return;
        const pw = sqB.querySelector('.pw'), r = sqB.getBoundingClientRect();
        dragging = { sq, pw, x0: e.clientX, y0: e.clientY, r, started: false, pid: e.pointerId };
      });
      boardEl.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragging.x0, dy = e.clientY - dragging.y0;
        if (!dragging.started && Math.hypot(dx, dy) < 6) return;
        if (!dragging.started) { dragging.started = true; dragMoved = true; try { boardEl.setPointerCapture(dragging.pid); } catch (err) {} if (selected !== dragging.sq) { selected = dragging.sq; legal = game.moves({ from: selected }); paint(); } dragging.pw = sqEl(dragging.sq).querySelector('.pw'); dragging.pw.classList.add('dragging'); }
        dragging.pw.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      });
      const endDrag = (e) => {
        if (!dragging) return;
        const d = dragging;
        if (d.started) {
          d.pw.classList.remove('dragging'); d.pw.style.transform = '';
          const el = document.elementFromPoint(e.clientX, e.clientY), target = el && el.closest('.sq');
          const to = target ? +target.dataset.sq : -1;
          if (to >= 0 && to !== d.sq && legal.some((m) => m.to === to)) tryMove(d.sq, to);
          dragging = null;
          setTimeout(() => { dragMoved = false; }, 0);
          return;
        }
        dragging = null;
      };
      boardEl.addEventListener('pointerup', endDrag);
      boardEl.addEventListener('pointercancel', () => { if (dragging) { dragging.pw.classList.remove('dragging'); dragging.pw.style.transform = ''; dragging = null; } });

      /* keyboard navigation over the board */
      boardEl.addEventListener('keydown', (e) => {
        const b = e.target.closest('.sq'); if (!b) return;
        const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }[e.key];
        if (mv != null) {
          e.preventDefault();
          let sq = +b.dataset.sq; const step = S.flipped ? -mv : mv;
          const f = sq & 7, n = sq + step;
          if (n < 0 || n > 63 || (Math.abs(step) === 1 && (n >> 3) !== (sq >> 3))) return;
          b.tabIndex = -1; focusSq = n; const t = sqEl(n); t.tabIndex = 0; t.focus(); void f;
        } else if (e.key === 'Escape') { selected = -1; legal = []; paint(); }
      });
      const onKey = (e) => { if (e.key === 'Escape') { drawer(false); sheet(false); } };
      document.addEventListener('keydown', onKey);

      /* -------- start -------- */
      loadSaved();
      if (params[0] === 'pvp' && S.mode !== 'pvp') { newGame({ mode: 'pvp', flipped: false }); App.toast('Two-player game — pass the device after each move.'); }
      else { buildBoard(); paint(); if (!result) maybeAI(); }
      if (params[0] === 'rules') setTimeout(rules, 100);
      if (!record.length) App.activity.log({ type: 'chess', id: S.mode === 'ai' ? 'ai' : 'pvp', title: S.mode === 'ai' ? 'Chess vs Snailfish' : 'Chess · two players', sub: S.mode === 'ai' ? LEVEL_LABEL[S.level] : 'Pass and play' });
      return () => { token++; document.removeEventListener('keydown', onKey); drawerEl.remove(); sheetEl.remove(); };
    },
  };
})();

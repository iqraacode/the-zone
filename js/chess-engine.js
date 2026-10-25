/* Zone — chess rules + "Snailfish", a small alpha-beta engine.
   ChessCore is fully self-contained so the same source can run inside a Web Worker. */
function ChessCore() {
  'use strict';
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const isW = (p) => p !== null && p === p.toUpperCase();
  const colorOf = (p) => (p ? (isW(p) ? 'w' : 'b') : null);
  const sqName = (sq) => 'abcdefgh'[sq & 7] + (8 - (sq >> 3));
  const parseSq = (s) => (8 - parseInt(s[1], 10)) * 8 + 'abcdefgh'.indexOf(s[0]);
  const on = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;

  function Game(fen) { this.load(fen || START); }
  Game.prototype.load = function (fen) {
    const [pos, turn, cast, ep, half, full] = fen.trim().split(/\s+/);
    this.board = new Array(64).fill(null);
    let sq = 0;
    for (const ch of pos) { if (ch === '/') continue; if (/\d/.test(ch)) sq += +ch; else this.board[sq++] = ch; }
    this.turn = turn || 'w';
    this.castling = { K: cast.includes('K'), Q: cast.includes('Q'), k: cast.includes('k'), q: cast.includes('q') };
    this.ep = ep && ep !== '-' ? parseSq(ep) : -1;
    this.half = +half || 0; this.full = +full || 1;
    this.stack = []; this.keys = [this.key()];
  };
  Game.prototype.fen = function () {
    let s = '';
    for (let r = 0; r < 8; r++) { let e = 0; for (let f = 0; f < 8; f++) { const p = this.board[r * 8 + f]; if (!p) e++; else { if (e) s += e; e = 0; s += p; } } if (e) s += e; if (r < 7) s += '/'; }
    const c = (this.castling.K ? 'K' : '') + (this.castling.Q ? 'Q' : '') + (this.castling.k ? 'k' : '') + (this.castling.q ? 'q' : '');
    return `${s} ${this.turn} ${c || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
  };
  Game.prototype.key = function () { return this.board.map((p) => p || '.').join('') + this.turn + (this.castling.K ? 1 : 0) + (this.castling.Q ? 1 : 0) + (this.castling.k ? 1 : 0) + (this.castling.q ? 1 : 0) + this.ep; };
  Game.prototype.attacked = function (sq, by) {
    const b = this.board, r = sq >> 3, f = sq & 7;
    const pr = by === 'w' ? r + 1 : r - 1, pawn = by === 'w' ? 'P' : 'p';
    if (on(pr, f - 1) && b[pr * 8 + f - 1] === pawn) return true;
    if (on(pr, f + 1) && b[pr * 8 + f + 1] === pawn) return true;
    const kn = by === 'w' ? 'N' : 'n', kg = by === 'w' ? 'K' : 'k';
    for (const [dr, df] of KN) if (on(r + dr, f + df) && b[(r + dr) * 8 + f + df] === kn) return true;
    for (const [dr, df] of KG) if (on(r + dr, f + df) && b[(r + dr) * 8 + f + df] === kg) return true;
    const bq = by === 'w' ? 'BQ' : 'bq', rq = by === 'w' ? 'RQ' : 'rq';
    for (const [dr, df] of DIAG) { let rr = r + dr, ff = f + df; while (on(rr, ff)) { const p = b[rr * 8 + ff]; if (p) { if (bq.includes(p)) return true; break; } rr += dr; ff += df; } }
    for (const [dr, df] of ORTH) { let rr = r + dr, ff = f + df; while (on(rr, ff)) { const p = b[rr * 8 + ff]; if (p) { if (rq.includes(p)) return true; break; } rr += dr; ff += df; } }
    return false;
  };
  Game.prototype.kingSq = function (c) { const k = c === 'w' ? 'K' : 'k'; return this.board.indexOf(k); };
  Game.prototype.inCheck = function (c) { c = c || this.turn; const k = this.kingSq(c); return k >= 0 && this.attacked(k, c === 'w' ? 'b' : 'w'); };

  Game.prototype.pseudo = function (capsOnly) {
    const b = this.board, c = this.turn, out = [], enemy = c === 'w' ? 'b' : 'w';
    const add = (from, to, p, cap, flag) => {
      const tr = to >> 3;
      if ((p === 'P' && tr === 0) || (p === 'p' && tr === 7)) { for (const pr of ['q', 'r', 'b', 'n']) out.push({ from, to, p, cap, flag: flag || 'n', promo: pr }); }
      else out.push({ from, to, p, cap, flag: flag || 'n' });
    };
    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq]; if (!p || colorOf(p) !== c) continue;
      const r = sq >> 3, f = sq & 7, t = p.toLowerCase();
      if (t === 'p') {
        const dir = c === 'w' ? -1 : 1, startR = c === 'w' ? 6 : 1, one = sq + dir * 8;
        if (!capsOnly && on(r + dir, f) && !b[one]) {
          add(sq, one, p, null);
          if (r === startR && !b[one + dir * 8]) add(sq, one + dir * 8, p, null, 'd');
        }
        if (capsOnly && on(r + dir, f) && !b[one] && ((c === 'w' && r + dir === 0) || (c === 'b' && r + dir === 7))) add(sq, one, p, null);
        for (const df of [-1, 1]) {
          if (!on(r + dir, f + df)) continue;
          const to = (r + dir) * 8 + f + df, q = b[to];
          if (q && colorOf(q) === enemy) add(sq, to, p, q);
          else if (to === this.ep) add(sq, to, p, c === 'w' ? 'p' : 'P', 'e');
        }
      } else if (t === 'n' || t === 'k') {
        for (const [dr, df] of t === 'n' ? KN : KG) {
          if (!on(r + dr, f + df)) continue;
          const to = (r + dr) * 8 + f + df, q = b[to];
          if (!q) { if (!capsOnly) add(sq, to, p, null); } else if (colorOf(q) === enemy) add(sq, to, p, q);
        }
        if (t === 'k' && !capsOnly) {
          const row = c === 'w' ? 7 : 0, base = row * 8, R = c === 'w' ? 'R' : 'r';
          if (sq === base + 4 && !this.attacked(sq, enemy)) {
            if (this.castling[c === 'w' ? 'K' : 'k'] && b[base + 7] === R && !b[base + 5] && !b[base + 6] && !this.attacked(base + 5, enemy) && !this.attacked(base + 6, enemy)) out.push({ from: sq, to: base + 6, p, cap: null, flag: 'k' });
            if (this.castling[c === 'w' ? 'Q' : 'q'] && b[base] === R && !b[base + 1] && !b[base + 2] && !b[base + 3] && !this.attacked(base + 3, enemy) && !this.attacked(base + 2, enemy)) out.push({ from: sq, to: base + 2, p, cap: null, flag: 'q' });
          }
        }
      } else {
        const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
        for (const [dr, df] of dirs) {
          let rr = r + dr, ff = f + df;
          while (on(rr, ff)) {
            const to = rr * 8 + ff, q = b[to];
            if (!q) { if (!capsOnly) add(sq, to, p, null); }
            else { if (colorOf(q) === enemy) add(sq, to, p, q); break; }
            rr += dr; ff += df;
          }
        }
      }
    }
    return out;
  };
  Game.prototype.moves = function (opts) {
    opts = opts || {};
    const me = this.turn, res = [];
    for (const m of this.pseudo(opts.capsOnly)) {
      if (opts.from != null && m.from !== opts.from) continue;
      this.make(m, true);
      if (!this.inCheck(me)) res.push(m);
      this.undo(true);
    }
    return res;
  };
  Game.prototype.make = function (m, fast) {
    const b = this.board, c = this.turn;
    this.stack.push({ m, castling: Object.assign({}, this.castling), ep: this.ep, half: this.half, full: this.full, fast });
    b[m.to] = b[m.from]; b[m.from] = null;
    if (m.flag === 'e') b[(m.from & ~7) + (m.to & 7)] = null;
    if (m.promo) b[m.to] = c === 'w' ? m.promo.toUpperCase() : m.promo;
    if (m.flag === 'k') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = null; }
    if (m.flag === 'q') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = null; }
    if (m.p === 'K') this.castling.K = this.castling.Q = false;
    if (m.p === 'k') this.castling.k = this.castling.q = false;
    for (const s of [m.from, m.to]) { if (s === 63) this.castling.K = false; if (s === 56) this.castling.Q = false; if (s === 7) this.castling.k = false; if (s === 0) this.castling.q = false; }
    this.ep = m.flag === 'd' ? (m.from + m.to) >> 1 : -1;
    this.half = m.p === 'P' || m.p === 'p' || m.cap ? 0 : this.half + 1;
    if (c === 'b') this.full++;
    this.turn = c === 'w' ? 'b' : 'w';
    if (!fast) this.keys.push(this.key());
  };
  Game.prototype.undo = function () {
    const u = this.stack.pop(); if (!u) return null;
    const m = u.m, b = this.board;
    this.turn = this.turn === 'w' ? 'b' : 'w';
    b[m.from] = m.p; b[m.to] = null;
    if (m.flag === 'e') b[(m.from & ~7) + (m.to & 7)] = m.cap; else if (m.cap) b[m.to] = m.cap;
    if (m.flag === 'k') { b[m.to + 1] = b[m.to - 1]; b[m.to - 1] = null; }
    if (m.flag === 'q') { b[m.to - 2] = b[m.to + 1]; b[m.to + 1] = null; }
    this.castling = u.castling; this.ep = u.ep; this.half = u.half; this.full = u.full;
    if (!u.fast) this.keys.pop();
    return m;
  };
  Game.prototype.insufficient = function () {
    const pcs = []; this.board.forEach((p, sq) => { if (p && p.toLowerCase() !== 'k') pcs.push([p.toLowerCase(), sq]); });
    if (!pcs.length) return true;
    if (pcs.length === 1 && (pcs[0][0] === 'n' || pcs[0][0] === 'b')) return true;
    if (pcs.every(([t]) => t === 'b')) { const shade = (sq) => ((sq >> 3) + (sq & 7)) & 1; return pcs.every(([, sq]) => shade(sq) === shade(pcs[0][1])); }
    return false;
  };
  Game.prototype.status = function () {
    const legal = this.moves();
    const check = this.inCheck();
    if (!legal.length) return check ? { over: true, result: this.turn === 'w' ? '0-1' : '1-0', reason: 'checkmate', check } : { over: true, result: '1/2-1/2', reason: 'stalemate' };
    if (this.half >= 100) return { over: true, result: '1/2-1/2', reason: 'fifty-move rule' };
    if (this.insufficient()) return { over: true, result: '1/2-1/2', reason: 'insufficient material' };
    const k = this.keys[this.keys.length - 1];
    if (this.keys.filter((x) => x === k).length >= 3) return { over: true, result: '1/2-1/2', reason: 'threefold repetition' };
    return { over: false, check };
  };
  Game.prototype.san = function (m) {
    let s;
    if (m.flag === 'k') s = 'O-O';
    else if (m.flag === 'q') s = 'O-O-O';
    else {
      const t = m.p.toUpperCase(), to = sqName(m.to);
      if (t === 'P') s = (m.cap ? sqName(m.from)[0] + 'x' : '') + to + (m.promo ? '=' + m.promo.toUpperCase() : '');
      else {
        const others = this.moves().filter((o) => o.p === m.p && o.to === m.to && o.from !== m.from);
        let dis = '';
        if (others.length) {
          const sameFile = others.some((o) => (o.from & 7) === (m.from & 7)), sameRank = others.some((o) => o.from >> 3 === m.from >> 3);
          dis = !sameFile ? sqName(m.from)[0] : !sameRank ? sqName(m.from)[1] : sqName(m.from);
        }
        s = t + dis + (m.cap ? 'x' : '') + to;
      }
    }
    this.make(m);
    const st = this.status();
    this.undo();
    return s + (st.reason === 'checkmate' ? '#' : st.check ? '+' : '');
  };

  /* ---------------- evaluation ---------------- */
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
  };
  function evaluate(g) {
    let s = 0, nonPawn = 0;
    for (const p of g.board) if (p && 'nbrqNBRQ'.includes(p)) nonPawn += VAL[p.toLowerCase()];
    const endgame = nonPawn <= 1300;
    for (let sq = 0; sq < 64; sq++) {
      const p = g.board[sq]; if (!p) continue;
      const t = p.toLowerCase(), w = p !== t, idx = w ? sq : sq ^ 56;
      const v = VAL[t] + (t === 'k' && endgame ? PST.ke : PST[t])[idx];
      s += w ? v : -v;
    }
    return g.turn === 'w' ? s : -s;
  }

  /* ---------------- search ---------------- */
  const MATE = 100000;
  function order(moves, best) {
    for (const m of moves) m.o = (best && m.from === best.from && m.to === best.to && m.promo === best.promo ? 1e6 : 0) + (m.cap ? 10 * VAL[m.cap.toLowerCase()] - VAL[m.p.toLowerCase()] + 1000 : 0) + (m.promo === 'q' ? 900 : 0);
    return moves.sort((a, b) => b.o - a.o);
  }
  function search(g, level) {
    const L = level === 'easy' ? { depth: 1, time: 300, noise: 90, blunder: 0.22 } : level === 'hard' ? { depth: 5, time: 2600, noise: 0, blunder: 0 } : { depth: 3, time: 1400, noise: 18, blunder: 0.03 };
    const t0 = Date.now(); let nodes = 0, stop = false;
    const root = g.moves();
    if (!root.length) return null;
    if (Math.random() < L.blunder) return { move: root[Math.floor(Math.random() * root.length)], score: 0 };
    function qs(alpha, beta, ply) {
      nodes++;
      const stand = evaluate(g);
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (ply > 6) return alpha;
      for (const m of order(g.moves({ capsOnly: true }))) {
        g.make(m, true); const sc = -qs(-beta, -alpha, ply + 1); g.undo();
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    function ab(depth, alpha, beta, ply) {
      if ((++nodes & 1023) === 0 && Date.now() - t0 > L.time) stop = true;
      if (stop) return 0;
      if (depth <= 0) return qs(alpha, beta, 0);
      const ms = g.moves();
      if (!ms.length) return g.inCheck() ? -MATE + ply : 0;
      if (g.half >= 100) return 0;
      for (const m of order(ms)) {
        g.make(m, true); const sc = -ab(depth - 1, -beta, -alpha, ply + 1); g.undo();
        if (stop) return 0;
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    let best = null, bestScore = -Infinity;
    for (let d = 1; d <= L.depth; d++) {
      let curBest = null, curScore = -Infinity, alpha = -Infinity;
      for (const m of order(root.slice(), best)) {
        g.make(m, true);
        // noisy levels search every root move with a full window so the noise compares true scores, not bounds
        let sc = -ab(d - 1, -Infinity, L.noise ? Infinity : -alpha, 1);
        if (L.noise && Math.abs(sc) < MATE - 1000) sc += (Math.random() - 0.5) * L.noise * 2;
        g.undo();
        if (stop) break;
        if (sc > curScore) { curScore = sc; curBest = m; }
        if (sc > alpha) alpha = sc;
      }
      if (stop && !curBest) break;
      if (curBest) { best = curBest; bestScore = curScore; }
      if (stop || Math.abs(bestScore) > MATE - 100) break;
    }
    return { move: best || root[0], score: bestScore, nodes };
  }

  return { Game, search, START, sqName, parseSq, colorOf };
}

(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.App) return;
  const App = window.App;
  const core = ChessCore();
  let worker = null, reqId = 0;
  const pending = {};
  try {
    const glue = `const core=(${ChessCore.toString()})();self.onmessage=(e)=>{const g=new core.Game(e.data.fen);(e.data.keys||[]).forEach(()=>{});const r=core.search(g,e.data.level);self.postMessage({id:e.data.id,move:r&&{from:r.move.from,to:r.move.to,promo:r.move.promo||null}});};`;
    worker = new Worker(URL.createObjectURL(new Blob([glue], { type: 'text/javascript' })));
    worker.onmessage = (e) => { const p = pending[e.data.id]; if (p) { delete pending[e.data.id]; p(e.data.move); } };
    worker.onerror = () => { worker = null; };
  } catch (e) { worker = null; }
  App.chessCore = core;
  /* ask Snailfish for a move; resolves to {from,to,promo} */
  App.chessThink = (fen, level) => new Promise((resolve) => {
    if (worker) { const id = ++reqId; pending[id] = resolve; worker.postMessage({ id, fen, level }); setTimeout(() => { if (pending[id]) { delete pending[id]; fallback(); } }, 8000); }
    else fallback();
    function fallback() { setTimeout(() => { const g = new core.Game(fen); const r = core.search(g, level === 'hard' ? 'medium' : level); resolve(r && { from: r.move.from, to: r.move.to, promo: r.move.promo || null }); }, 30); }
  });
})();

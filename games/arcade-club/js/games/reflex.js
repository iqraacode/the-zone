/* ==========================================================================
   GAME 6 — FRUIT REFLEX  (1–3 players, simultaneous)
   A "wanted" fruit is shown. Fruits pop up one at a time:
   • Hit your button on the wanted fruit first  → +1 (+1 more if under 0.45 s)
   • Hit on a different fruit                   → −1
   • Hit when nothing is showing                → −1
   • Solo only: letting a wanted fruit escape   → −1
   Scores never drop below 0. Gets faster as the clock runs down.
   All timing runs on the game loop, so pausing freezes everything.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h;

  var FRUITS = ['watermelon', 'lemon', 'cherry', 'strawberry', 'orange', 'grapes'];
  var LOOKALIKE = { watermelon: ['strawberry', 'cherry'], strawberry: ['cherry', 'watermelon'], cherry: ['strawberry', 'watermelon'], lemon: ['orange'], orange: ['lemon'], grapes: ['cherry'] };
  var KEYMAP = [{ code: 'KeyQ', label: 'Q' }, { code: 'KeyP', label: 'P' }, { code: 'Space', label: 'Space' }];

  A.register({
    id: 'reflex',
    title: 'Fruit Reflex',
    tagline: 'Slap your button the moment the right fruit pops up.',
    description: 'Watch for the wanted fruit and hit your button first. Decoys and jumpy fingers cost points!',
    color: '#F0BD5E',
    players: [1, 2, 3],
    cats: ['quick', 'action', 'multiplayer'],
    modes: { 1: 'Score challenge', 2: 'Head to head', 3: 'Three-way' },
    pausable: true,
    options: function () {
      return [{ id: 'time', label: 'Round length', def: 45, choices: [{ v: 30, label: '30 seconds' }, { v: 45, label: '45 seconds' }, { v: 60, label: '60 seconds' }] }];
    },
    rules: function (cfg) {
      var r = ['Look at the WANTED fruit at the top. It changes every few pops.',
        'When the wanted fruit pops up, hit your button: first hit scores +1, and a lightning-fast hit (under 0.45 s) scores +2.',
        'Hitting a different fruit, or hitting when nothing is there, costs 1 point.'];
      r.push(cfg.players === 1 ? 'If a wanted fruit disappears before you hit it, you lose 1 point.' : 'Only the first player to hit the wanted fruit scores it.');
      r.push('It speeds up as time runs out. Highest score wins!');
      return r;
    },
    controls: function (cfg) {
      if (cfg.players === 1) return [['Space / Q', 'Hit'], ['Click / Tap', 'Your big button'], ['Esc', 'Pause']];
      var c = [];
      for (var i = 0; i < cfg.players; i++) c.push([KEYMAP[i].label, 'Player ' + (i + 1) + ' hits']);
      c.push(['Tap', 'Your coloured button']);
      return c;
    },
    best: function (cfg) {
      var s = cfg.players === 1 ? A.store.record('reflex', 'best-' + (cfg.opts.time || 45)) : null;
      var rt = A.store.record('reflex', 'fastest');
      var parts = [];
      if (s !== null) parts.push('Best solo score: ' + s);
      if (rt !== null) parts.push('Fastest reaction: ' + Math.round(rt) + ' ms');
      return parts.length ? parts.join(' · ') : null;
    },

    create: function (ctx) {
      var cfg = ctx.cfg, D = cfg.opts.time || 45, solo = cfg.players === 1;
      var roster = A.makeRoster(cfg.players, 0);
      var scores = roster.map(function () { return 0; });
      var reacts = roster.map(function () { return []; });
      var stats = { hits: 0, wrong: 0, missed: 0 };
      var phase = 'countdown', cd = 3.5, lastBeep = 4, left = D, wanted = A.pick(FRUITS), popsUntilSwap = A.randInt(5, 7);
      var item = null, nextIn = 1.0, swapPause = 0, now = 0, lastClaim = -9, pausedAt = 0;

      var wantedArt = h('span', { class: 'arc-fr-wanted-art' });
      var wantedName = h('strong', null, '');
      var wantedBox = h('div', { class: 'arc-fr-wanted', 'aria-live': 'polite' }, h('span', { class: 'arc-fr-wanted-tag' }, 'Wanted'), wantedArt, wantedName);
      var timer = h('div', { class: 'arc-fr-timer' }, h('span', { class: 'arc-fr-timer-fill' }));
      var spot = h('div', { class: 'arc-fr-spot' });
      var plate = h('div', { class: 'arc-fr-plate' }, spot);
      var countEl = h('div', { class: 'arc-banner', hidden: true });
      var btns = roster.map(function (p, i) {
        var b = h('button', {
          type: 'button', class: 'arc-fr-btn', style: { '--pc': p.color, '--pl': p.light },
          'aria-label': p.name + ' hit button' + (solo ? '' : ' (key ' + KEYMAP[i].label + ')')
        }, A.symbolSVG(p, 30), h('span', { class: 'arc-fr-btn-name' }, p.name), h('kbd', null, solo ? 'Space' : KEYMAP[i].label));
        ctx.listen(b, 'pointerdown', function (e) { e.preventDefault(); A.sound.unlock(); press(i); });
        ctx.listen(b, 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); press(i); } });
        return b;
      });
      var wrap = h('div', { class: 'arc-fr', style: { '--n': roster.length } },
        h('div', { class: 'arc-fr-top' }, wantedBox, timer), plate, h('div', { class: 'arc-fr-btns' }, btns), countEl);

      function setWanted(f) {
        wanted = f;
        A.clear(wantedArt).appendChild(A.svg(A.fruits[f].svg));
        wantedName.textContent = A.fruits[f].name;
        wantedBox.classList.remove('is-swap'); void wantedBox.offsetWidth; wantedBox.classList.add('is-swap');
      }
      function difficulty() { return A.clamp(1 - left / D, 0, 1); }
      function spawn() {
        var p = difficulty();
        var valid = Math.random() < 0.42;
        var f = wanted;
        if (!valid) {
          var look = LOOKALIKE[wanted];
          f = Math.random() < 0.3 + 0.5 * p ? A.pick(look) : A.pick(FRUITS.filter(function (x) { return x !== wanted; }));
        }
        var life = 1.55 - 0.8 * p;
        var el = h('span', { class: 'arc-fr-item' }, A.svg(A.fruits[f].svg), h('span', { class: 'arc-fr-ring' }));
        el.style.setProperty('--x', A.randInt(-22, 22) + '%');
        el.style.setProperty('--y', A.randInt(-14, 14) + '%');
        el.style.setProperty('--r', A.randInt(-18, 18) + 'deg');
        A.clear(spot).appendChild(el);
        item = { fruit: f, valid: f === wanted, born: now, bornMs: performance.now(), life: life, el: el, claimed: false, wrong: {} };
        spot.setAttribute('aria-label', A.fruits[f].name);
        ctx.sfx('click');
      }
      function clearItem(delay) {
        var it = item;
        item = null;
        if (!it) return;
        it.el.classList.add('is-out');
        ctx.timeout(function () { if (it.el.parentNode) it.el.remove(); }, delay || 220);
        var p = difficulty();
        nextIn = A.rand(1.0 - 0.45 * p, 2.0 - 0.8 * p);
        popsUntilSwap--;
        if (popsUntilSwap <= 0) {
          popsUntilSwap = A.randInt(5, 7);
          setWanted(A.pick(FRUITS.filter(function (x) { return x !== wanted; })));
          swapPause = 1.1;
          ctx.setStatus('New wanted fruit: ' + A.fruits[wanted].name + '!');
          ctx.sfx('select');
        }
      }
      function flashBtn(i, cls, text) {
        var b = btns[i];
        b.classList.remove('is-good', 'is-bad'); void b.offsetWidth; b.classList.add(cls);
        var pop = h('span', { class: 'arc-fr-pop ' + cls }, text);
        b.appendChild(pop);
        ctx.timeout(function () { pop.remove(); }, 700);
      }
      function addScore(i, d) { scores[i] = Math.max(0, scores[i] + d); ctx.setScores(scores); }
      function press(i) {
        if (phase !== 'play' || ctx.over || ctx.paused || i >= roster.length) return;
        if (!item || item.claimed) {
          if ((item && item.claimed) || now - lastClaim < 0.5) return; // just taken by someone else: no penalty
          addScore(i, -1); stats.wrong++; flashBtn(i, 'is-bad', '−1 too early'); ctx.sfx('bad');
          return;
        }
        if (!item.valid) {
          if (item.wrong[i]) return;
          item.wrong[i] = true;
          addScore(i, -1); stats.wrong++; flashBtn(i, 'is-bad', '−1 wrong fruit'); ctx.sfx('bad');
          return;
        }
        // precise wall-clock reaction time (paused time is excluded in resume())
        var rt = Math.max(1, performance.now() - item.bornMs);
        reacts[i].push(rt);
        var fast = rt < 450;
        addScore(i, fast ? 2 : 1); stats.hits++;
        flashBtn(i, 'is-good', (fast ? '+2 fast! ' : '+1 ') + Math.round(rt) + ' ms');
        ctx.sfx(fast ? 'match' : 'point');
        item.claimed = true;
        lastClaim = now;
        item.el.classList.add('is-hit');
        item.el.style.setProperty('--pc', roster[i].color);
        item.el.appendChild(h('span', { class: 'arc-fr-claim' }, A.symbolSVG(roster[i], 40)));
        clearItem(380);
      }

      function update(dt) {
        now += dt;
        if (phase === 'countdown') {
          cd -= dt;
          var n = Math.ceil(cd - 0.5);
          countEl.hidden = false;
          countEl.textContent = n >= 1 ? (cd > 3.1 ? 'Ready?' : String(n)) : 'Go!';
          if (n < lastBeep && n >= 1 && cd <= 3.1) { lastBeep = n; ctx.sfx('beep'); }
          if (cd <= 0) { phase = 'play'; countEl.hidden = true; ctx.sfx('go'); ctx.setStatus(solo ? 'Hit Space (or your button) when the wanted fruit appears!' : roster.map(function (p, i) { return p.short + ': ' + KEYMAP[i].label; }).join(' · ')); }
          return;
        }
        if (phase !== 'play') return;
        left -= dt;
        timer.firstChild.style.transform = 'scaleX(' + Math.max(0, left / D) + ')';
        timer.classList.toggle('is-low', left < 10);
        if (item && !item.claimed) {
          var age = now - item.born, frac = age / item.life;
          item.el.style.setProperty('--t', String(Math.min(1, frac)));
          if (frac >= 1) {
            if (item.valid && solo) { addScore(0, -1); stats.missed++; flashBtn(0, 'is-bad', '−1 missed'); ctx.sfx('bad'); }
            else if (item.valid) stats.missed++;
            clearItem();
          }
        } else if (!item) {
          if (swapPause > 0) swapPause -= dt;
          else { nextIn -= dt; if (nextIn <= 0 && left > 0.4) spawn(); }
        }
        ctx.setStats([['Time', Math.max(0, Math.ceil(left)) + 's']]);
        if (left <= 0) end();
      }
      function avg(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; }
      function end() {
        phase = 'done';
        if (item) { item.el.remove(); item = null; }
        var all = [].concat.apply([], reacts), fastest = all.length ? Math.min.apply(null, all) : null;
        var recs = [];
        if (fastest !== null) { var rf = A.store.submit('reflex', 'fastest', Math.round(fastest), 'low'); if (rf.isNew && rf.prev !== null) recs.push('New fastest reaction: ' + Math.round(fastest) + ' ms'); }
        if (solo) {
          var rb = A.store.submit('reflex', 'best-' + D, scores[0], 'high');
          if (rb.isNew && rb.prev !== null) recs.push('New best score!');
          var a0 = avg(reacts[0]);
          ctx.finish({
            title: "Time's up!", subtitle: 'You scored ' + scores[0] + ' point' + (scores[0] === 1 ? '' : 's') + ' in ' + D + ' seconds.',
            stats: [['Score', scores[0]], ['Best', A.store.record('reflex', 'best-' + D)], ['Avg reaction', a0 === null ? '–' : Math.round(a0) + ' ms'], ['Fastest', fastest === null ? '–' : Math.round(fastest) + ' ms'], ['Wrong taps', stats.wrong], ['Missed', stats.missed]],
            records: recs
          });
        } else {
          var rows = A.rank(roster, scores).map(function (r) {
            var a = avg(reacts[r.player.index]);
            r.label = r.score + ' pts' + (a === null ? '' : ' · ' + Math.round(a) + ' ms avg');
            return r;
          });
          ctx.finish({ title: A.winnerTitle(rows), subtitle: D + ' seconds of fruity chaos.', rows: rows, stats: [['Fastest reaction', fastest === null ? '–' : Math.round(fastest) + ' ms'], ['Wrong taps', stats.wrong]], records: recs });
        }
      }
      function onKey(e) {
        if (ctx.shell.overlay || e.repeat) return;
        var i = -1;
        if (solo) { if (e.code === 'Space' || e.code === 'KeyQ') i = 0; }
        else KEYMAP.forEach(function (k, j) { if (k.code === e.code && j < roster.length) i = j; });
        if (i < 0) return;
        e.preventDefault();
        press(i);
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          ctx.setScores(scores);
          setWanted(wanted);
          ctx.setStatus('Get ready! Learn the wanted fruit.');
          ctx.listen(window, 'keydown', onKey);
          ctx.loop(function (dt) { if (dt > 0) update(dt); });
        },
        pause: function () { pausedAt = performance.now(); },
        resume: function () { if (item && pausedAt) item.bornMs += performance.now() - pausedAt; pausedAt = 0; },
        destroy: function () {}
      };
    }
  });
})();

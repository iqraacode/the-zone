/* ==========================================================================
   GAME 14 — SUM SPLASH  (1–3 players)
   Solo: answer as many sums as you can in 60 seconds (wrong = −3 s).
   2–3 players: buzz in first, then pick the answer.
     right → +1 · wrong → −1 and you sit out that question.
   First to the target score wins.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub, h = A.h;

  function makeQuestion(diff) {
    var a, b, op, ans, r = A.randInt;
    var ops = diff === 'easy' ? ['+', '−'] : diff === 'medium' ? ['+', '−', '×'] : ['×', '÷', '+', '−'];
    op = A.pick(ops);
    if (op === '+') { a = r(diff === 'easy' ? 1 : 8, diff === 'hard' ? 99 : diff === 'medium' ? 50 : 12); b = r(1, diff === 'hard' ? 99 : diff === 'medium' ? 40 : 9); ans = a + b; }
    else if (op === '−') { a = r(diff === 'easy' ? 3 : 15, diff === 'hard' ? 120 : diff === 'medium' ? 60 : 20); b = r(1, a - 1); ans = a - b; }
    else if (op === '×') { a = r(2, diff === 'hard' ? 12 : 10); b = r(2, diff === 'hard' ? 15 : 10); ans = a * b; }
    else { b = r(2, 12); ans = r(2, 12); a = b * ans; }
    var set = {}; set[ans] = 1;
    var choices = [ans];
    var tries = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, op === '×' ? ans + a : ans + 3, op === '×' ? ans - b : ans - 3, ans + 5];
    tries = A.shuffle(tries);
    for (var k = 0; k < tries.length && choices.length < 4; k++) {
      var v = tries[k];
      if (v >= 0 && !set[v]) { set[v] = 1; choices.push(v); }
    }
    return { text: a + ' ' + op + ' ' + b, answer: ans, choices: A.shuffle(choices) };
  }

  A.register({
    id: 'math',
    title: 'Sum Splash',
    tagline: 'Race to answer quick sums like 5 × 11.',
    description: 'Quick-fire sums! Solo, beat the clock. With friends, buzz in first and pick the right answer.',
    color: '#8E5F5A',
    ink: '#FBF6EF',
    players: [1, 2, 3],
    cats: ['quick', 'puzzle', 'multiplayer'],
    modes: { 1: '60-second sprint', 2: 'Buzzer race', 3: 'Buzzer race' },
    pausable: true,
    options: function (n) {
      var o = [{ id: 'diff', label: 'Sums', def: 'medium', choices: [{ v: 'easy', label: 'Easy + −' }, { v: 'medium', label: 'Medium + − ×' }, { v: 'hard', label: 'Tricky × ÷' }] }];
      if (n > 1) o.push({ id: 'target', label: 'First to', def: 7, choices: [{ v: 5, label: '5 points' }, { v: 7, label: '7 points' }, { v: 10, label: '10 points' }] });
      return o;
    },
    rules: function (cfg) {
      if (cfg.players === 1) return ['Pick the right answer to each sum as fast as you can.', 'Every right answer scores a point. A wrong answer costs 3 seconds.', 'Get 3 in a row for a streak bonus of +1. You have 60 seconds.'];
      return ['A sum appears. Hit your buzzer first to answer it.', 'Then choose the answer (tap it or press 1–4). You have 5 seconds.',
        'Right answer: +1. Wrong answer: −1 and you can’t buzz again on that sum.', 'First to ' + (cfg.opts.target || 7) + ' points wins.'];
    },
    controls: function (cfg) {
      var c = [];
      if (cfg.players > 1) for (var i = 0; i < cfg.players; i++) c.push([A.BUZZ_KEYS[i].label, 'Player ' + (i + 1) + ' buzzes']);
      c.push(['1 2 3 4', 'Choose an answer'], ['Click / Tap', 'Choose an answer']);
      c.push(['Esc', 'Pause']);
      return c;
    },
    best: function (cfg) {
      if (cfg.players !== 1) return null;
      var b = A.store.record('math', 'best-' + (cfg.opts.diff || 'medium'));
      return b === null ? null : 'Best sprint on this level: ' + b + ' points';
    },

    create: function (ctx) {
      var cfg = ctx.cfg, solo = cfg.players === 1, diff = cfg.opts.diff || 'medium', target = cfg.opts.target || 7;
      var roster = A.makeRoster(cfg.players, 0);
      var scores = roster.map(function () { return 0; });
      var q = null, state = 'count', cd = 3.2, lastBeep = 4, timeLeft = 60, answering = -1, ansT = 0, locked = {}, qT = 0, streak = 0, asked = 0, right = 0, wrong = 0;

      var qText = h('div', { class: 'arc-math-q', 'aria-live': 'assertive' }, '');
      var bar = h('div', { class: 'arc-math-bar' }, h('span', null));
      var who = h('div', { class: 'arc-math-who' }, '');
      var choiceBtns = [0, 1, 2, 3].map(function (k) {
        return h('button', { type: 'button', class: 'arc-math-choice', onclick: function () { choose(k); } }, h('kbd', null, String(k + 1)), h('span', null, ''));
      });
      var card = h('div', { class: 'arc-math-card' }, qText, who, bar);
      var buzz = solo ? null : A.buzzers(ctx, roster, function (i) { buzzIn(i); }, { action: 'buzzer' });
      var wrap = h('div', { class: 'arc-math' }, card, h('div', { class: 'arc-math-choices' }, choiceBtns), buzz ? buzz.el : null, h('div', { class: 'arc-banner', hidden: true }));
      var countEl = wrap.lastChild;

      function next() {
        q = makeQuestion(diff); asked++;
        qT = 0; answering = -1; locked = {};
        qText.textContent = q.text + ' = ?';
        qText.classList.remove('is-new'); void qText.offsetWidth; qText.classList.add('is-new');
        choiceBtns.forEach(function (b, k) {
          b.lastChild.textContent = String(q.choices[k]);
          b.className = 'arc-math-choice';
          b.disabled = !solo;
          b.style.removeProperty('--pc');
          b.setAttribute('aria-label', 'Answer ' + (k + 1) + ': ' + q.choices[k]);
        });
        who.textContent = solo ? '' : 'Buzz in!';
        card.style.removeProperty('--pc');
        state = 'open';
        hud();
      }
      function hud() {
        ctx.setScores(scores);
        ctx.setTurn(answering);
        if (solo) ctx.setStats([['Time', Math.max(0, Math.ceil(timeLeft)) + 's'], ['Streak', streak]]);
        else ctx.setStats([['First to', target], ['Sum', asked]]);
      }
      function buzzIn(i) {
        if (state !== 'open' || ctx.paused || ctx.over || locked[i]) { if (state === 'open' && locked[i]) buzz.flash(i, 'is-bad', 'locked out'); return; }
        answering = i; ansT = 5; state = 'answer';
        ctx.sfx('select');
        var p = roster[i];
        who.textContent = p.name + ', pick the answer!';
        card.style.setProperty('--pc', p.color);
        choiceBtns.forEach(function (b) { b.disabled = false; b.style.setProperty('--pc', p.color); b.classList.add('is-armed'); });
        buzz.flash(i, 'is-good', 'Buzz!');
        hud();
      }
      function choose(k) {
        if (ctx.over || ctx.paused) return;
        if (solo ? state !== 'open' : state !== 'answer') return;
        var val = q.choices[k], ok = val === q.answer, b = choiceBtns[k];
        if (solo) {
          if (ok) {
            streak++; scores[0] += streak % 3 === 0 ? 2 : 1; right++;
            b.classList.add('is-right'); ctx.sfx(streak % 3 === 0 ? 'match' : 'point');
            state = 'pause'; ctx.timeout(function () { if (!ctx.over) next(); }, 280);
          } else {
            streak = 0; timeLeft -= 3; wrong++;
            b.classList.add('is-wrong'); b.disabled = true; ctx.sfx('bad');
          }
          hud(); return;
        }
        var i = answering;
        if (ok) {
          scores[i]++; right++;
          b.classList.add('is-right'); ctx.sfx('match');
          who.textContent = roster[i].name + ' got it! +1';
          buzz.flash(i, 'is-good', '+1');
          state = 'pause'; hud();
          if (scores[i] >= target) { ctx.timeout(end, 900); return; }
          ctx.timeout(function () { if (!ctx.over) next(); }, 1100);
        } else {
          scores[i] = Math.max(0, scores[i] - 1); wrong++;
          b.classList.add('is-wrong'); ctx.sfx('bad');
          buzz.flash(i, 'is-bad', '−1');
          wrongOut(i, roster[i].name + ' missed it!');
        }
      }
      function wrongOut(i, msg) {
        locked[i] = true; answering = -1; state = 'open';
        choiceBtns.forEach(function (b) { b.classList.remove('is-armed'); b.disabled = true; });
        card.style.removeProperty('--pc');
        var open = roster.filter(function (p) { return !locked[p.index]; }).length;
        who.textContent = msg + (open ? ' Anyone else? Buzz in!' : '');
        hud();
        if (!open) reveal();
      }
      function reveal() {
        state = 'pause';
        choiceBtns.forEach(function (b, k) { if (q.choices[k] === q.answer) b.classList.add('is-right'); });
        who.textContent = 'The answer was ' + q.answer + '.';
        ctx.timeout(function () { if (!ctx.over) next(); }, 1500);
      }
      function update(dt) {
        if (state === 'count') {
          cd -= dt;
          var n = Math.ceil(cd - 0.5);
          countEl.hidden = false;
          countEl.textContent = cd > 2.9 ? 'Ready?' : n >= 1 ? String(n) : 'Go!';
          if (n < lastBeep && n >= 1 && cd <= 2.9) { lastBeep = n; ctx.sfx('beep'); }
          if (cd <= 0) { countEl.hidden = true; ctx.sfx('go'); next(); ctx.setStatus(solo ? 'Tap the answer or press 1–4.' : roster.map(function (p, k) { return p.short + ' buzzes with ' + A.BUZZ_KEYS[k].label; }).join(' · ')); }
          return;
        }
        if (state === 'done') return;
        qT += dt;
        if (solo) {
          timeLeft -= dt;
          bar.firstChild.style.transform = 'scaleX(' + Math.max(0, timeLeft / 60) + ')';
          if (timeLeft <= 0) { hud(); return end(); }
          hud();
        } else if (state === 'answer') {
          ansT -= dt;
          bar.firstChild.style.transform = 'scaleX(' + Math.max(0, ansT / 5) + ')';
          if (ansT <= 0) { scores[answering] = Math.max(0, scores[answering] - 1); buzz.flash(answering, 'is-bad', 'too slow −1'); ctx.sfx('bad'); wrongOut(answering, roster[answering].name + ' ran out of time!'); }
        } else if (state === 'open') {
          bar.firstChild.style.transform = 'scaleX(1)';
          if (qT > 12) { who.textContent = 'Nobody buzzed!'; reveal(); }
          if (asked > 40) end();
        }
      }
      function end() {
        if (ctx.over) return;
        state = 'done';
        if (solo) {
          var r = A.store.submit('math', 'best-' + diff, scores[0], 'high');
          ctx.finish({ title: "Time's up!", subtitle: 'You scored ' + scores[0] + ' in 60 seconds.', stats: [['Score', scores[0]], ['Right', right], ['Wrong', wrong], ['Best', A.store.record('math', 'best-' + diff)]], records: r.isNew && r.prev !== null ? ['New best sprint!'] : [] });
        } else {
          var rows = A.rank(roster, scores).map(function (x) { x.label = x.score + ' pts'; return x; });
          ctx.finish({ title: A.winnerTitle(rows), subtitle: asked + ' sums asked.', rows: rows, stats: [['Right answers', right], ['Wrong answers', wrong]] });
        }
      }
      function onKey(e) {
        if (ctx.shell.overlay || e.repeat) return;
        var m = /^(Digit|Numpad)([1-4])$/.exec(e.code);
        if (m) { e.preventDefault(); choose(+m[2] - 1); }
      }

      return {
        start: function () {
          A.clear(ctx.stage).appendChild(wrap);
          ctx.setPlayers(roster);
          choiceBtns.forEach(function (b) { b.disabled = true; b.lastChild.textContent = '?'; });
          qText.textContent = '? + ? = ?';
          who.textContent = solo ? 'Get ready…' : 'Get your buzzers ready…';
          ctx.listen(window, 'keydown', onKey);
          hud();
          ctx.setStatus('Warm up your brain!');
          ctx.loop(function (dt) { if (dt > 0) update(dt); });
        },
        pause: function () { wrap.classList.add('is-paused'); },
        resume: function () { wrap.classList.remove('is-paused'); },
        destroy: function () {}
      };
    }
  });
})();

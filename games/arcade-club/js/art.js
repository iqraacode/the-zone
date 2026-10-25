/* ==========================================================================
   ARCADE CLUB — illustrations
   Original vector art: game thumbnails, memory-card symbols and fruits.
   Style: flat colour, chunky dark outline, offset soft shadow.
   All strings here are static, authored markup (never user input).
   ========================================================================== */
(function () {
  'use strict';
  var A = window.ArcadeClub;
  var O = A.OUTLINE;

  /* style helpers ------------------------------------------------------- */
  // st(sh, fill, sw): attributes for a shape; sh=true renders the shadow pass.
  function st(sh, fill, sw) {
    sw = sw || 3;
    return sh
      ? 'fill="#000" stroke="#000" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round"'
      : 'fill="' + fill + '" stroke="' + O + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round"';
  }
  // shadow(fn): draws fn(true) offset & translucent, then fn(false) on top.
  function shadow(fn, dx, dy) {
    return '<g transform="translate(' + (dx || 2.4) + ' ' + (dy || 2.8) + ')" opacity=".2">' + fn(true) + '</g>' + fn(false);
  }
  function starPts(cx, cy, R, r, n, rot) {
    n = n || 5; rot = rot === undefined ? -90 : rot;
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R;
      pts.push((cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr).toFixed(2));
    }
    return pts.join(' ');
  }
  function sym(name, cx, cy, size, color, sw) {
    var s = size / 100;
    return '<path d="' + A.symbolPath(name) + '" transform="translate(' + (cx - size / 2) + ' ' + (cy - size / 2) + ') scale(' + s + ')" fill="' + color + '" stroke="' + O + '" stroke-width="' + ((sw || 2.6) / s) + '" stroke-linejoin="round"/>';
  }
  function svgWrap(vb, bg, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' +
      (bg ? '<rect x="-5" y="-5" width="110" height="110" fill="' + bg + '"/>' : '') + inner + '</svg>';
  }
  function sparkle(x, y, s, c) {
    return '<polygon points="' + starPts(x, y, s, s * 0.32, 4, -90) + '" fill="' + (c || '#fff') + '"/>';
  }
  A.art = { starPts: starPts, st: st, shadow: shadow };

  /* ===================================================== thumbnails ===== */
  var T = {};

  T.memory = svgWrap('0 0 100 100', '#7FA8BE',
    '<path d="M0 76 Q12 69 25 76 T50 76 T75 76 T100 76 V100 H0Z" fill="#3597CF"/>' +
    '<path d="M0 89 Q12 83 25 89 T50 89 T75 89 T100 89 V100 H0Z" fill="#2A84BC"/>' +
    sparkle(85, 16, 6) + sparkle(14, 18, 3.5) +
    '<g transform="rotate(-13 31 50)"><g class="arc-a-wob">' +
      shadow(function (sh) { return '<rect x="15" y="29" width="32" height="42" rx="6" ' + st(sh, '#E26D5C') + '/>'; }) +
      '<rect x="21" y="35" width="20" height="30" rx="3" fill="none" stroke="#FFD9D2" stroke-width="2" stroke-dasharray="3.5 3"/>' +
      '<circle cx="31" cy="50" r="4.5" fill="#FFD9D2"/>' +
    '</g></g>' +
    '<g transform="rotate(11 66 47)"><g class="arc-a-flip">' +
      shadow(function (sh) { return '<rect x="50" y="26" width="32" height="42" rx="6" ' + st(sh, '#FBF6EF') + '/>'; }) +
      '<polygon points="' + starPts(66, 47, 12, 5.4) + '" fill="#D4A373" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<circle cx="66" cy="47" r="1.6" fill="#FFD9A0"/><circle cx="66" cy="40.5" r="1.1" fill="#FFD9A0"/><circle cx="71.5" cy="45.5" r="1.1" fill="#FFD9A0"/><circle cx="60.5" cy="45.5" r="1.1" fill="#FFD9A0"/>' +
    '</g></g>');

  T.dots = (function () {
    var xs = [20, 40, 60, 80], ys = [44, 62, 80], dots = '';
    ys.forEach(function (y) { xs.forEach(function (x) { dots += '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="' + O + '"/>'; }); });
    function ln(x1, y1, x2, y2, c) {
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + O + '" stroke-width="6.5" stroke-linecap="round"/>' +
        '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>';
    }
    return svgWrap('0 0 100 100', '#F7D98A',
      '<path d="M0 0 H100 V22 Q88 28 75 22 T50 22 T25 22 T0 22Z" fill="#4FB6E8"/>' +
      '<path d="M0 22 Q12 28 25 22 T50 22 T75 22 T100 22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="12" cy="92" r="1.4" fill="#D9AE52"/><circle cx="88" cy="35" r="1.4" fill="#D9AE52"/><circle cx="50" cy="94" r="1.4" fill="#D9AE52"/>' +
      '<rect x="20" y="44" width="20" height="18" fill="#FFB3A6"/>' + sym('star', 30, 53, 12, '#E26D5C', 2.2) +
      '<rect x="60" y="62" width="20" height="18" fill="#B5DDF8"/>' + sym('circle', 70, 71, 11, '#6F9FB8', 2.2) +
      '<g class="arc-a-bob">' + ln(20, 44, 40, 44, '#E26D5C') + ln(20, 44, 20, 62, '#E26D5C') + ln(40, 44, 40, 62, '#E26D5C') + ln(20, 62, 40, 62, '#E26D5C') + '</g>' +
      ln(60, 62, 80, 62, '#6F9FB8') + ln(80, 62, 80, 80, '#6F9FB8') + ln(60, 62, 60, 80, '#6F9FB8') + ln(60, 80, 80, 80, '#6F9FB8') +
      ln(60, 44, 80, 44, '#8FA968') + ln(40, 80, 40, 62, '#8FA968') + dots);
  })();

  T.tictac = (function () {
    var x0 = 17, c = 21.5, inner = '';
    function cx(i) { return x0 + c * (i + 0.5); }
    for (var i = 1; i < 3; i++) {
      inner += '<line x1="' + (x0 + c * i) + '" y1="' + (x0 + 4) + '" x2="' + (x0 + c * i) + '" y2="' + (x0 + c * 3 - 4) + '" stroke="#C9B2A6" stroke-width="3" stroke-linecap="round"/>';
      inner += '<line x1="' + (x0 + 4) + '" y1="' + (x0 + c * i) + '" x2="' + (x0 + c * 3 - 4) + '" y2="' + (x0 + c * i) + '" stroke="#C9B2A6" stroke-width="3" stroke-linecap="round"/>';
    }
    return svgWrap('0 0 100 100', '#5A4D40',
      '<path d="M-10 30 L30 -10 M-10 70 L70 -10 M-10 110 L110 -10 M30 110 L110 30 M70 110 L110 70" stroke="#694A9C" stroke-width="9"/>' +
      shadow(function (sh) { return '<rect x="' + x0 + '" y="' + x0 + '" width="' + c * 3 + '" height="' + c * 3 + '" rx="8" ' + st(sh, '#FBF6EF') + '/>'; }) +
      inner +
      '<g class="arc-a-pop">' + sym('star', cx(0), cx(0), 16, '#E26D5C') + '</g>' +
      sym('circle', cx(1), cx(1), 14, '#6F9FB8') +
      sym('triangle', cx(2), cx(0), 14, '#8FA968') +
      sym('star', cx(1), cx(2), 16, '#E26D5C') +
      sym('circle', cx(2), cx(2), 14, '#6F9FB8') +
      sym('star', cx(2), cx(1), 16, '#E26D5C') +
      '<g class="arc-a-bob">' + shadow(function (sh) { return '<path d="M70 92 L96 80 L82 96 L80 89 Z" ' + st(sh, '#fff', 2.4) + '/>'; }) + '</g>');
  })();

  T.golf = svgWrap('0 0 100 100', '#6FB5A5',
    '<circle cx="12" cy="14" r="6" fill="#47D4C6"/><circle cx="90" cy="88" r="9" fill="#47D4C6"/>' +
    '<g transform="rotate(-8 50 52)">' +
      shadow(function (sh) { return '<rect x="14" y="16" width="72" height="72" rx="14" ' + st(sh, '#B5713C', 3) + '/>'; }) +
      '<rect x="20" y="22" width="60" height="60" rx="9" fill="#8BD05A" stroke="' + O + '" stroke-width="2.4"/>' +
      '<path d="M20 40 H80 M20 60 H80" stroke="#8FA968" stroke-width="9"/>' +
      '<rect x="20" y="22" width="60" height="60" rx="9" fill="none" stroke="' + O + '" stroke-width="2.4"/>' +
      '<rect x="44" y="50" width="22" height="7" rx="3" fill="#B5713C" stroke="' + O + '" stroke-width="2.4"/>' +
    '</g>' +
    '<ellipse cx="64" cy="34" rx="6.5" ry="4.5" fill="' + O + '"/>' +
    '<path d="M36 70 L60 38" stroke="#fff" stroke-width="2.4" stroke-dasharray="2 4" stroke-linecap="round"/>' +
    '<g class="arc-a-wave"><line x1="64" y1="34" x2="64" y2="9" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M64 9 L80 14 L64 19 Z" ' + st(false, '#E26D5C', 2.6) + '/></g>' +
    '<g class="arc-a-bob">' + shadow(function (sh) { return '<circle cx="33" cy="73" r="6" ' + st(sh, '#fff', 2.8) + '/>'; }) +
      '<circle cx="31.5" cy="71.5" r="1.2" fill="#D6D2E0"/><circle cx="34.5" cy="74" r="1.2" fill="#D6D2E0"/></g>');

  function carSVG(cx, cy, rot, body, sh2) {
    return '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot + ')">' +
      shadow(function (sh) {
        return (sh ? '' : '<rect x="-11" y="-10" width="6" height="4" rx="1.5" fill="' + O + '"/><rect x="5" y="-10" width="6" height="4" rx="1.5" fill="' + O + '"/>' +
          '<rect x="-11" y="6" width="6" height="4" rx="1.5" fill="' + O + '"/><rect x="5" y="6" width="6" height="4" rx="1.5" fill="' + O + '"/>') +
          '<rect x="-13" y="-7.5" width="26" height="15" rx="5" ' + st(sh, body, 2.6) + '/>';
      }, sh2 || 2, 2.5) +
      '<rect x="0" y="-5" width="6" height="10" rx="2" fill="#BFE6FA" stroke="' + O + '" stroke-width="2"/>' +
      '<rect x="-10" y="-1.5" width="8" height="3" rx="1.5" fill="#fff" opacity=".8"/>' +
      '</g>';
  }
  A.art.car = carSVG;

  T.racers = svgWrap('0 0 100 100', '#6CC24A',
    '<circle cx="14" cy="16" r="8" fill="#5AAE3B"/><circle cx="86" cy="86" r="10" fill="#5AAE3B"/>' +
    '<path d="M-6 74 C 22 74, 26 34, 56 34 S 108 46, 108 14" fill="none" stroke="' + O + '" stroke-width="31" stroke-linecap="round"/>' +
    '<path d="M-6 74 C 22 74, 26 34, 56 34 S 108 46, 108 14" fill="none" stroke="#4A4560" stroke-width="25" stroke-linecap="round"/>' +
    '<path d="M-6 74 C 22 74, 26 34, 56 34 S 108 46, 108 14" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="5 6"/>' +
    '<g transform="translate(17 63) rotate(-58)"><rect x="-12" y="-5" width="24" height="10" fill="#fff" stroke="' + O + '" stroke-width="2"/>' +
      '<rect x="-12" y="-5" width="4" height="5" fill="' + O + '"/><rect x="-4" y="-5" width="4" height="5" fill="' + O + '"/><rect x="4" y="-5" width="4" height="5" fill="' + O + '"/>' +
      '<rect x="-8" y="0" width="4" height="5" fill="' + O + '"/><rect x="0" y="0" width="4" height="5" fill="' + O + '"/><rect x="8" y="0" width="4" height="5" fill="' + O + '"/></g>' +
    shadow(function (sh) { return '<circle cx="82" cy="68" r="8" ' + st(sh, '#6C874D', 2.6) + '/>'; }) +
    shadow(function (sh) { return '<circle cx="24" cy="88" r="6" ' + st(sh, '#6C874D', 2.6) + '/>'; }) +
    '<g class="arc-a-zoom">' + carSVG(58, 36, -4, '#E26D5C') + '</g>' +
    '<path d="M36 33 H26 M38 40 H30" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>');

  T.reflex = svgWrap('0 0 100 100', '#F0BD5E',
    '<g class="arc-a-spin"><polygon points="' + starPts(50, 52, 62, 30, 10) + '" fill="#FFDA6B"/></g>' +
    '<g transform="rotate(-16 50 56)"><g class="arc-a-pop">' +
      shadow(function (sh) { return '<path d="M18 46 A32 32 0 0 0 82 46 Z" ' + st(sh, '#7D9A5C', 3) + '/>'; }) +
      '<path d="M23.5 46 A26.5 26.5 0 0 0 76.5 46 Z" fill="#C8F09A"/>' +
      '<path d="M27 46 A23 23 0 0 0 73 46 Z" fill="#D7776A" stroke="' + O + '" stroke-width="2"/>' +
      '<path d="M18 46 H82" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="40" cy="54" rx="1.7" ry="2.8" fill="' + O + '"/><ellipse cx="50" cy="60" rx="1.7" ry="2.8" fill="' + O + '"/><ellipse cx="60" cy="54" rx="1.7" ry="2.8" fill="' + O + '"/><ellipse cx="45" cy="50" rx="1.5" ry="2.4" fill="' + O + '"/><ellipse cx="56" cy="50" rx="1.5" ry="2.4" fill="' + O + '"/>' +
    '</g></g>' +
    '<path d="M16 20 L24 27 M30 12 L32 22 M8 34 L18 36" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
    '<g transform="translate(76 18)">' +
      '<path d="M0 0 Q-6 8 -9 16 M0 0 Q4 9 6 16" fill="none" stroke="#4A8A25" stroke-width="2.4" stroke-linecap="round"/>' +
      shadow(function (sh) { return '<circle cx="-9" cy="18" r="5.5" ' + st(sh, '#C8574A', 2.4) + '/><circle cx="6" cy="18" r="5.5" ' + st(sh, '#C8574A', 2.4) + '/>'; }, 1.8, 2) +
      '<path d="M0 0 Q6 -6 12 -3 Q6 2 0 0Z" fill="#8FA968" stroke="' + O + '" stroke-width="2"/></g>');

  T.clash = (function () {
    var n = 5, s = 14.4, x0 = 14, g = '';
    var map = [
      'aaab.', 'aab..', 'a.b.c', '..bcc', '.bccc'
    ];
    var col = { a: '#E26D5C', b: '#6F9FB8', c: '#8FA968', '.': '#F2E0B8' };
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var k = map[r][c];
      g += '<rect x="' + (x0 + c * s + 1) + '" y="' + (x0 + r * s + 1) + '" width="' + (s - 2) + '" height="' + (s - 2) + '" rx="3" fill="' + col[k] + '" stroke="' + O + '" stroke-width="1.8"/>';
    }
    return svgWrap('0 0 100 100', '#FBECC9',
      '<path d="M-10 18 Q30 4 60 24 T120 30 V-10 H-10Z" fill="#E8B45A"/>' +
      '<path d="M-10 108 Q40 78 70 92 T120 80 V120 H-10Z" fill="#E26D5C" opacity=".9"/>' +
      shadow(function (sh) { return '<rect x="' + (x0 - 3) + '" y="' + (x0 - 3) + '" width="' + (n * s + 6) + '" height="' + (n * s + 6) + '" rx="7" ' + st(sh, '#fff', 2.8) + '/>'; }) +
      g + sym('star', x0 + s * 0.5, x0 + s * 0.5, 9, '#FFD9D2', 1.6) + sym('circle', x0 + s * 2.5, x0 + s * 1.5, 8, '#D2ECFF', 1.6) + sym('triangle', x0 + s * 3.5, x0 + s * 3.5, 8, '#E0F4CF', 1.6) +
      '<g transform="translate(72 70) rotate(-38)"><g class="arc-a-wob">' +
        shadow(function (sh) {
          return '<path d="M0 6 V14 H-14 V24" fill="none" stroke="' + (sh ? '#000' : O) + '" stroke-width="' + (sh ? 5.6 : 2.6) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
            (sh ? '' : '<path d="M0 6 V14 H-14 V24" fill="none" stroke="#fff" stroke-width="0" />') +
            '<rect x="-12" y="-8" width="24" height="12" rx="4" ' + st(sh, '#6F9FB8', 2.6) + '/>' +
            '<rect x="-18" y="22" width="8" height="17" rx="3" ' + st(sh, '#5A4D40', 2.6) + '/>';
        }) +
        '<path d="M-6 -8 L-10 4 M2 -8 L-2 4 M10 -8 L6 4" stroke="#1D6FA6" stroke-width="2.2" opacity=".5"/>' +
      '</g></g>');
  })();

  T.jump = svgWrap('0 0 100 100', '#A9C7D4',
    '<g class="arc-a-spin">' + '<polygon points="' + starPts(82, 18, 16, 11, 10) + '" fill="#F0BD5E" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/></g>' +
    '<circle cx="82" cy="18" r="9" fill="#F6D58E" stroke="' + O + '" stroke-width="2.4"/>' +
    '<ellipse cx="22" cy="20" rx="12" ry="5" fill="#fff" opacity=".9"/><ellipse cx="30" cy="16" rx="8" ry="5" fill="#fff" opacity=".9"/>' +
    '<path d="M-5 80 Q25 74 50 80 T105 78 V105 H-5Z" fill="#F4CE7A" stroke="' + O + '" stroke-width="3"/>' +
    shadow(function (sh) {
      return '<path d="M60 80 V62 H64 V58 H68 V62 H72 V58 H76 V62 H80 V80 Z" ' + st(sh, '#E8A94A', 2.6) + '/>';
    }) +
    '<rect x="67" y="70" width="6" height="10" rx="3" fill="' + O + '"/>' +
    '<circle cx="46" cy="30" r="3.6" fill="#F0BD5E" stroke="' + O + '" stroke-width="2"/><circle cx="58" cy="26" r="3.6" fill="#F0BD5E" stroke="' + O + '" stroke-width="2"/><circle cx="70" cy="30" r="3.6" fill="#F0BD5E" stroke="' + O + '" stroke-width="2"/>' +
    '<path d="M14 58 H6 M16 64 H8 M14 70 H9" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
    '<g class="arc-a-hop">' +
      shadow(function (sh) {
        return '<path d="M24 62 L22 70 M36 62 L38 70" stroke="' + (sh ? '#000' : O) + '" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="30" cy="50" r="13" ' + st(sh, '#F0BD5E', 3) + '/>' +
          '<path d="M18 42 Q30 30 42 42 Z" ' + st(sh, '#E26D5C', 2.6) + '/>';
      }) +
      '<rect x="21" y="46" width="8" height="5" rx="2.5" fill="' + O + '"/><rect x="31" y="46" width="8" height="5" rx="2.5" fill="' + O + '"/><path d="M29 48 H31" stroke="' + O + '" stroke-width="2"/>' +
      '<path d="M25 56 Q30 60 35 56" fill="none" stroke="' + O + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M14 42 H46" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round"/>' +
    '</g>');

  /* ---------- second wave of games ---------- */
  function waveRows(col) {
    var out = '';
    for (var y = 14; y < 110; y += 22) out += '<path d="M-10 ' + y + ' q10 -7 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="' + col + '" stroke-width="6" stroke-linecap="round"/>';
    return out;
  }

  T.hippos = svgWrap('0 0 100 100', '#557F9A',
    waveRows('#557F9A') +
    // coral hippo peeking from the top-right corner
    '<g transform="translate(96 4) rotate(135)">' + shadow(function (sh) {
      return '<path d="M-10 0 H16" stroke="' + (sh ? '#000' : O) + '" stroke-width="20" stroke-linecap="round"/>' +
        '<ellipse cx="22" cy="0" rx="13" ry="12" ' + st(sh, '#E26D5C') + '/>';
    }) + '<circle cx="18" cy="-5" r="2.6" fill="#fff" stroke="' + O + '" stroke-width="1.4"/><circle cx="18" cy="5" r="2.6" fill="#fff" stroke="' + O + '" stroke-width="1.4"/></g>' +
    // big lime hippo lunging from bottom-left
    '<g transform="translate(8 92) rotate(-45)"><g class="arc-a-zoom">' + shadow(function (sh) {
      return '<path d="M-14 0 H30" stroke="' + (sh ? '#000' : O) + '" stroke-width="27" stroke-linecap="round"/>' +
        (sh ? '' : '<path d="M-14 0 H30" stroke="#8FA968" stroke-width="20" stroke-linecap="round"/>') +
        '<circle cx="36" cy="0" r="17" ' + st(sh, '#8FA968') + '/>' +
        '<ellipse cx="55" cy="-9" rx="13" ry="8" ' + st(sh, '#8FA968') + '/><ellipse cx="55" cy="9" rx="13" ry="8" ' + st(sh, '#8FA968') + '/>';
    }) +
      '<ellipse cx="54" cy="0" rx="10" ry="3.2" fill="#8E3F3A"/>' +
      '<rect x="60" y="-3" width="3.5" height="3.5" fill="#fff" stroke="' + O + '" stroke-width="1.2"/><rect x="60" y="0" width="3.5" height="3.5" fill="#fff" stroke="' + O + '" stroke-width="1.2"/>' +
      '<circle cx="33" cy="-7" r="4" fill="#fff" stroke="' + O + '" stroke-width="1.6"/><circle cx="33" cy="7" r="4" fill="#fff" stroke="' + O + '" stroke-width="1.6"/>' +
      '<circle cx="35" cy="-7" r="1.8" fill="' + O + '"/><circle cx="35" cy="7" r="1.8" fill="' + O + '"/>' +
    '</g></g>' +
    [[62, 44, '#fff'], [76, 64, '#fff'], [48, 24, '#F0BD5E'], [84, 36, '#fff'], [70, 82, '#fff']].map(function (m) {
      return '<circle cx="' + (m[0] + 1.6) + '" cy="' + (m[1] + 2) + '" r="5" fill="rgba(0,0,0,.25)"/><circle cx="' + m[0] + '" cy="' + m[1] + '" r="5" fill="' + m[2] + '" stroke="' + O + '" stroke-width="2.2"/>';
    }).join(''));

  T.skewer = svgWrap('0 0 100 100', '#8A6676',
    '<ellipse cx="50" cy="48" rx="46" ry="38" fill="#946F80"/>' +
    '<g class="arc-a-wob"><g>' +
      shadow(function (sh) { return '<circle cx="50" cy="44" r="25" ' + st(sh, '#6B3B22', 3) + '/>'; }) +
      '<circle cx="50" cy="44" r="19" fill="#C98048"/>' +
      '<circle cx="51" cy="45" r="13" fill="none" stroke="rgba(107,59,34,.5)" stroke-width="2"/><circle cx="51" cy="45" r="7" fill="none" stroke="rgba(107,59,34,.5)" stroke-width="2"/>' +
      // stuck skewers
      '<g transform="rotate(-40 50 44)"><path d="M50 19 V2" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/><path d="M50 19 V2" stroke="#E8C48A" stroke-width="2.4" stroke-linecap="round"/><rect x="46.5" y="0" width="7" height="9" rx="2.5" fill="#6F9FB8" stroke="' + O + '" stroke-width="1.8"/></g>' +
      '<g transform="rotate(70 50 44)"><path d="M50 19 V2" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/><path d="M50 19 V2" stroke="#E8C48A" stroke-width="2.4" stroke-linecap="round"/><rect x="46.5" y="0" width="7" height="9" rx="2.5" fill="#8FA968" stroke="' + O + '" stroke-width="1.8"/></g>' +
      '<g transform="rotate(150 50 44)"><path d="M50 22 Q41 12 46 6 Q50 3 54 6 Q59 12 50 22Z" fill="#C8574A" stroke="' + O + '" stroke-width="2"/><path d="M46 6 L50 1 L54 6Z" fill="#8FA968" stroke="' + O + '" stroke-width="1.6"/></g>' +
    '</g></g>' +
    // flying skewer from below
    '<g class="arc-a-bob"><path d="M50 72 V98" stroke="' + O + '" stroke-width="5.5" stroke-linecap="round"/><path d="M50 72 V98" stroke="#E8C48A" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M50 68 L46.5 75 H53.5Z" fill="#DDE3EE" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/><rect x="46" y="86" width="8" height="12" rx="2.5" fill="#E26D5C" stroke="' + O + '" stroke-width="2"/></g>' +
    '<path d="M40 80 V92 M60 80 V92" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>');

  T.paint = svgWrap('0 0 100 100', '#FBECC9',
    '<path d="M-10 18 Q30 -2 60 16 T120 8 V-10 H-10Z" fill="#57BDE9"/>' +
    '<path d="M-10 40 Q20 20 46 34 Q70 48 110 26" fill="none" stroke="#E26D5C" stroke-width="16" stroke-linecap="round"/>' +
    '<path d="M70 110 Q64 74 84 58 Q96 50 110 54" fill="none" stroke="#8BC853" stroke-width="16" stroke-linecap="round"/>' +
    '<path d="M-10 86 Q20 70 44 82" fill="none" stroke="#E8B45A" stroke-width="16" stroke-linecap="round"/>' +
    '<g transform="translate(44 60) rotate(-28)"><g class="arc-a-wob">' + shadow(function (sh) {
      return '<path d="M0 6 V14 H-12 V24" fill="none" stroke="' + (sh ? '#000' : O) + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="-15" y="-10" width="30" height="14" rx="5" ' + st(sh, '#E8B45A', 2.8) + '/>' +
        '<rect x="-16" y="22" width="8" height="15" rx="3" ' + st(sh, '#E26D5C', 2.6) + '/>';
    }) + '<path d="M0 6 V14 H-12 V24" fill="none" stroke="#EDE7F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M-8 -10 L-12 4 M0 -10 L-4 4 M8 -10 L4 4" stroke="#B9821A" stroke-width="2" opacity=".55"/></g></g>');

  T.darts = (function () {
    var segs = '';
    for (var i = 0; i < 20; i++) {
      var a0 = (-99 + i * 18) * Math.PI / 180, a1 = a0 + Math.PI / 10, r = 34, cx = 54, cy = 52;
      var p = function (a, rr) { return (cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2); };
      segs += '<path d="M' + cx + ' ' + cy + ' L' + p(a0, r) + ' A' + r + ' ' + r + ' 0 0 1 ' + p(a1, r) + 'Z" fill="' + (i % 2 ? '#FBF6EF' : '#6B5C50') + '"/>';
    }
    return svgWrap('0 0 100 100', '#5A4D40',
      '<path d="M-10 70 L40 -10 M20 110 L110 -10" stroke="#694A9C" stroke-width="10"/>' +
      shadow(function (sh) { return '<circle cx="54" cy="52" r="40" ' + st(sh, '#C98048', 3) + '/>'; }) +
      '<circle cx="54" cy="52" r="35" fill="' + O + '"/>' + segs +
      '<circle cx="54" cy="52" r="32" fill="none" stroke="#E26D5C" stroke-width="3.5" stroke-dasharray="5.6 5.6"/>' +
      '<circle cx="54" cy="52" r="19" fill="none" stroke="#8FA968" stroke-width="3.5" stroke-dasharray="3.3 3.3"/>' +
      '<circle cx="54" cy="52" r="6" fill="#8FA968" stroke="' + O + '" stroke-width="1.8"/><circle cx="54" cy="52" r="2.6" fill="#E26D5C"/>' +
      '<g class="arc-a-pop"><g transform="translate(54 52) rotate(-35)">' +
        '<path d="M0 0 V-26" stroke="' + O + '" stroke-width="3.5" stroke-linecap="round"/>' +
        '<rect x="-3.5" y="-24" width="7" height="12" rx="2.5" fill="#DDE3EE" stroke="' + O + '" stroke-width="1.8"/>' +
        '<path d="M0 -26 L-8 -40 L0 -36 L8 -40Z" fill="#F0BD5E" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/></g></g>' +
      sparkle(18, 20, 5) + sparkle(88, 88, 4));
  })();

  T.snake = svgWrap('0 0 100 100', '#1F6FB2',
    '<circle cx="12" cy="96" r="12" fill="#E9A194" opacity=".4"/><circle cx="90" cy="6" r="14" fill="#C9B2A6" opacity=".4"/>' +
    shadow(function (sh) {
      return '<path d="M10 22 H44 Q54 22 54 32 V44" fill="none" stroke="' + (sh ? '#000' : O) + '" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M92 82 H64 Q54 82 54 72 V66" fill="none" stroke="' + (sh ? '#000' : O) + '" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>';
    }) +
    '<path d="M10 22 H44 Q54 22 54 32 V44" fill="none" stroke="#8FA968" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M92 82 H64 Q54 82 54 72 V66" fill="none" stroke="#E26D5C" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g class="arc-a-bob"><circle cx="54" cy="46" r="8.5" fill="#8FA968" stroke="' + O + '" stroke-width="2.6"/>' +
      '<circle cx="50.5" cy="48" r="2.4" fill="#fff" stroke="' + O + '" stroke-width="1.2"/><circle cx="57.5" cy="48" r="2.4" fill="#fff" stroke="' + O + '" stroke-width="1.2"/>' +
      '<circle cx="50.8" cy="49" r="1.1" fill="' + O + '"/><circle cx="57.8" cy="49" r="1.1" fill="' + O + '"/></g>' +
    '<circle cx="54" cy="64" r="8.5" fill="#E26D5C" stroke="' + O + '" stroke-width="2.6"/>' +
    '<circle cx="50.5" cy="62" r="2.4" fill="#fff" stroke="' + O + '" stroke-width="1.2"/><circle cx="57.5" cy="62" r="2.4" fill="#fff" stroke="' + O + '" stroke-width="1.2"/>' +
    '<circle cx="50.8" cy="61" r="1.1" fill="' + O + '"/><circle cx="57.8" cy="61" r="1.1" fill="' + O + '"/>' +
    '<g transform="translate(80 40)"><path d="M4 0 L11 -6 V6Z" fill="#D4A373" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/><ellipse cx="-2" cy="0" rx="8" ry="5.5" fill="#D4A373" stroke="' + O + '" stroke-width="2"/><circle cx="-6" cy="-1" r="1.3" fill="' + O + '"/></g>' +
    '<polygon points="' + starPts(22, 66, 8, 3.5) + '" fill="#F0BD5E" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>');

  T.math = svgWrap('0 0 100 100', '#8E5F5A',
    '<circle cx="84" cy="84" r="18" fill="#9C5C7C"/><circle cx="12" cy="12" r="12" fill="#9C5C7C"/>' +
    '<g class="arc-a-pop"><text x="50" y="58" text-anchor="middle" font-family="Kalam, Atkinson Hyperlegible, sans-serif" font-weight="700" font-size="25" fill="#F0BD5E" stroke="' + O + '" stroke-width="5" paint-order="stroke" stroke-linejoin="round">7×8=?</text></g>' +
    '<g transform="translate(78 26) rotate(12)">' + shadow(function (sh) { return '<rect x="-9" y="-9" width="18" height="18" rx="5" ' + st(sh, '#8FA968', 2.4) + '/>'; }, 1.6, 2) +
      '<path d="M-4 0 L-1 3.5 L5 -3.5" fill="none" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>' +
    '<g transform="translate(22 80) rotate(-10)">' + shadow(function (sh) { return '<rect x="-12" y="-9" width="24" height="18" rx="5" ' + st(sh, '#FBF6EF', 2.4) + '/>'; }, 1.6, 2) +
      '<text x="0" y="5" text-anchor="middle" font-family="Kalam, Atkinson Hyperlegible, sans-serif" font-weight="700" font-size="13" fill="' + O + '">56</text></g>');

  A.thumbs = T;

  /* ================================================ memory card symbols */
  // viewBox 0 0 60 60. Each has a name for accessibility.
  var M = [];
  function card(name, inner) { M.push({ name: name, svg: svgWrap('0 0 60 60', null, inner) }); }

  card('Sun',
    (function () {
      var r = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        r += '<line x1="' + (30 + Math.cos(a) * 17) + '" y1="' + (30 + Math.sin(a) * 17) + '" x2="' + (30 + Math.cos(a) * 24) + '" y2="' + (30 + Math.sin(a) * 24) + '" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/>' +
          '<line x1="' + (30 + Math.cos(a) * 17) + '" y1="' + (30 + Math.sin(a) * 17) + '" x2="' + (30 + Math.cos(a) * 24) + '" y2="' + (30 + Math.sin(a) * 24) + '" stroke="#D4A373" stroke-width="3" stroke-linecap="round"/>';
      }
      return r + shadow(function (sh) { return '<circle cx="30" cy="30" r="13" ' + st(sh, '#F0BD5E') + '/>'; }, 1.6, 1.8) +
        '<circle cx="25" cy="29" r="1.8" fill="' + O + '"/><circle cx="35" cy="29" r="1.8" fill="' + O + '"/><path d="M25 34 Q30 38 35 34" fill="none" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>';
    })());

  card('Palm tree',
    shadow(function (sh) {
      return '<path d="M30 52 Q27 36 33 22" fill="none" stroke="' + (sh ? '#000' : O) + '" stroke-width="9" stroke-linecap="round"/>' +
        (sh ? '' : '<path d="M30 52 Q27 36 33 22" fill="none" stroke="#B5713C" stroke-width="4.5" stroke-linecap="round"/>') +
        '<path d="M33 22 Q20 12 8 20 Q20 18 33 22Z" ' + st(sh, '#7D9A5C', 2.4) + '/>' +
        '<path d="M33 22 Q46 10 56 20 Q44 17 33 22Z" ' + st(sh, '#7D9A5C', 2.4) + '/>' +
        '<path d="M33 22 Q24 24 16 36 Q26 28 33 22Z" ' + st(sh, '#8FA968', 2.4) + '/>' +
        '<path d="M33 22 Q44 24 50 36 Q41 28 33 22Z" ' + st(sh, '#8FA968', 2.4) + '/>';
    }, 1.6, 1.8) +
    '<circle cx="30" cy="25" r="3.2" fill="#8A4A2E" stroke="' + O + '" stroke-width="1.8"/><circle cx="36" cy="26" r="3.2" fill="#8A4A2E" stroke="' + O + '" stroke-width="1.8"/>' +
    '<path d="M14 53 Q30 47 46 53" fill="none" stroke="#E8A94A" stroke-width="4" stroke-linecap="round"/>');

  card('Shell',
    shadow(function (sh) {
      return '<path d="M30 50 L12 26 Q30 2 48 26 Z" ' + st(sh, '#E9A194') + '/>' +
        '<path d="M24 50 H36 L34 54 H26 Z" ' + st(sh, '#E9A194', 2.4) + '/>';
    }, 1.6, 1.8) +
    '<path d="M30 48 L30 12 M30 48 L20 18 M30 48 L40 18 M30 48 L15 24 M30 48 L45 24" stroke="#D9577A" stroke-width="2" stroke-linecap="round"/>');

  card('Crab',
    shadow(function (sh) {
      return '<path d="M12 22 Q6 14 12 8 L16 14 L20 10 Q22 20 14 24 Z" ' + st(sh, '#C8574A', 2.4) + '/>' +
        '<path d="M48 22 Q54 14 48 8 L44 14 L40 10 Q38 20 46 24 Z" ' + st(sh, '#C8574A', 2.4) + '/>' +
        '<path d="M14 24 L22 32 M46 24 L38 32 M16 44 L10 50 M20 46 L16 53 M44 44 L50 50 M40 46 L44 53" stroke="' + (sh ? '#000' : O) + '" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="30" cy="38" rx="17" ry="11" ' + st(sh, '#C8574A') + '/>';
    }, 1.6, 1.8) +
    '<path d="M25 28 V21 M35 28 V21" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="25" cy="20" r="3.5" fill="#fff" stroke="' + O + '" stroke-width="2"/><circle cx="35" cy="20" r="3.5" fill="#fff" stroke="' + O + '" stroke-width="2"/>' +
    '<circle cx="25.5" cy="20.5" r="1.4" fill="' + O + '"/><circle cx="35.5" cy="20.5" r="1.4" fill="' + O + '"/>' +
    '<path d="M25 40 Q30 44 35 40" fill="none" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>');

  card('Starfish',
    shadow(function (sh) { return '<polygon points="' + starPts(30, 32, 25, 11) + '" ' + st(sh, '#D4A373') + '/>'; }, 1.6, 1.8) +
    '<circle cx="30" cy="32" r="2.4" fill="#FFD9A0"/><circle cx="30" cy="20" r="1.8" fill="#FFD9A0"/><circle cx="40" cy="29" r="1.8" fill="#FFD9A0"/><circle cx="20" cy="29" r="1.8" fill="#FFD9A0"/><circle cx="36" cy="41" r="1.8" fill="#FFD9A0"/><circle cx="24" cy="41" r="1.8" fill="#FFD9A0"/>');

  card('Beach umbrella',
    shadow(function (sh) {
      return '<path d="M31 26 L24 54" stroke="' + (sh ? '#000' : O) + '" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M8 28 Q14 6 34 6 Q52 8 56 28 Q48 22 40 28 Q34 20 26 28 Q18 21 8 28 Z" ' + st(sh, '#E26D5C') + '/>';
    }, 1.6, 1.8) +
    '<path d="M26 28 Q26 12 34 6 Q40 14 40 28 Q34 20 26 28Z" fill="#fff" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M14 54 Q30 48 44 54" fill="none" stroke="#E8A94A" stroke-width="4" stroke-linecap="round"/>');

  card('Ice cream',
    shadow(function (sh) {
      return '<path d="M18 30 L30 56 L42 30 Z" ' + st(sh, '#E8A94A') + '/>' +
        '<circle cx="24" cy="26" r="9" ' + st(sh, '#E9A194') + '/><circle cx="36" cy="26" r="9" ' + st(sh, '#8FE0D8') + '/><circle cx="30" cy="17" r="9" ' + st(sh, '#FBF6EF') + '/>';
    }, 1.6, 1.8) +
    '<path d="M22 36 L36 42 M24 42 L34 36 M27 48 L33 44" stroke="#B5713C" stroke-width="1.8" stroke-linecap="round"/>' +
    '<circle cx="30" cy="8" r="3.6" fill="#C8574A" stroke="' + O + '" stroke-width="2"/>');

  card('Sunglasses',
    shadow(function (sh) {
      return '<path d="M6 24 H54" stroke="' + (sh ? '#000' : O) + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M8 22 H27 V30 Q27 40 17 40 Q8 40 8 30 Z" ' + st(sh, '#5A4D40') + '/>' +
        '<path d="M33 22 H52 V30 Q52 40 43 40 Q33 40 33 30 Z" ' + st(sh, '#5A4D40') + '/>';
    }, 1.6, 1.8) +
    '<path d="M12 27 L18 27 M37 27 L43 27" stroke="#C9B2A6" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M27 25 Q30 22 33 25" fill="none" stroke="' + O + '" stroke-width="3"/>');

  card('Flip-flop',
    shadow(function (sh) {
      return '<path d="M30 6 Q44 6 44 22 Q44 34 40 46 Q36 56 28 56 Q18 56 18 44 Q18 34 20 22 Q20 6 30 6Z" ' + st(sh, '#6F9FB8') + '/>';
    }, 1.6, 1.8) +
    '<path d="M24 12 Q30 8 36 12 Q34 22 31 24 Q27 22 24 12Z" fill="#9AD4F6"/>' +
    '<path d="M31 16 L21 34 M31 16 L41 34" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M31 16 L21 34 M31 16 L41 34" stroke="#E8B45A" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="31" cy="16" r="3" fill="#E8B45A" stroke="' + O + '" stroke-width="2"/>');

  card('Anchor',
    shadow(function (sh) {
      var c = sh ? '#000' : O;
      return '<circle cx="30" cy="12" r="5" fill="none" stroke="' + c + '" stroke-width="7"/>' +
        '<path d="M30 17 V52 M20 26 H40 M10 36 Q12 52 30 52 Q48 52 50 36" fill="none" stroke="' + c + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
    }, 1.6, 1.8) +
    '<circle cx="30" cy="12" r="5" fill="none" stroke="#5B6BD8" stroke-width="3"/>' +
    '<path d="M30 17 V52 M20 26 H40 M10 36 Q12 52 30 52 Q48 52 50 36" fill="none" stroke="#5B6BD8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M6 40 L10 34 L15 39 M54 40 L50 34 L45 39" fill="none" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');

  card('Sailboat',
    shadow(function (sh) {
      return '<path d="M30 6 V42" stroke="' + (sh ? '#000' : O) + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M32 8 L50 38 H32 Z" ' + st(sh, '#fff', 2.6) + '/>' +
        '<path d="M28 14 L14 38 H28 Z" ' + st(sh, '#E8B45A', 2.6) + '/>' +
        '<path d="M8 42 H52 L46 52 H14 Z" ' + st(sh, '#E26D5C') + '/>';
    }, 1.6, 1.8) +
    '<path d="M4 56 Q12 52 20 56 T36 56 T52 56" fill="none" stroke="#6F9FB8" stroke-width="3" stroke-linecap="round"/>');

  card('Fish',
    shadow(function (sh) {
      return '<path d="M40 30 L56 18 V42 Z" ' + st(sh, '#5C9D8F') + '/>' +
        '<path d="M6 30 Q20 12 42 30 Q20 48 6 30Z" ' + st(sh, '#6FB5A5') + '/>' +
        '<path d="M20 20 Q26 12 32 22" ' + st(sh, '#5C9D8F', 2.4) + '/>';
    }, 1.6, 1.8) +
    '<circle cx="15" cy="28" r="2.6" fill="#fff" stroke="' + O + '" stroke-width="1.6"/><circle cx="15.4" cy="28.2" r="1.1" fill="' + O + '"/>' +
    '<path d="M24 24 Q28 30 24 36 M30 25 Q34 30 30 35" fill="none" stroke="#5C9D8F" stroke-width="2" stroke-linecap="round"/>');

  A.cardArt = M;

  /* ========================================================== fruits === */
  var F = {};
  F.watermelon = { name: 'Watermelon', color: '#D7776A', svg: svgWrap('0 0 100 100', null,
    '<g transform="rotate(-10 50 50)">' +
    shadow(function (sh) { return '<path d="M10 40 A40 40 0 0 0 90 40 Z" ' + st(sh, '#7D9A5C', 4) + '/>'; }, 3, 3.5) +
    '<path d="M16 40 A34 34 0 0 0 84 40 Z" fill="#C8F09A"/>' +
    '<path d="M21 40 A29 29 0 0 0 79 40 Z" fill="#D7776A" stroke="' + O + '" stroke-width="3"/>' +
    '<path d="M10 40 H90" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="36" cy="50" rx="2.4" ry="4" fill="' + O + '"/><ellipse cx="50" cy="58" rx="2.4" ry="4" fill="' + O + '"/><ellipse cx="64" cy="50" rx="2.4" ry="4" fill="' + O + '"/><ellipse cx="43" cy="46" rx="2.2" ry="3.4" fill="' + O + '"/><ellipse cx="57" cy="46" rx="2.2" ry="3.4" fill="' + O + '"/></g>') };
  F.lemon = { name: 'Lemon', color: '#F0BD5E', svg: svgWrap('0 0 100 100', null,
    shadow(function (sh) { return '<path d="M12 50 Q14 40 22 36 Q36 18 60 22 Q78 26 86 40 Q92 46 88 52 Q84 70 62 78 Q38 84 22 66 Q14 60 12 50Z" ' + st(sh, '#F0BD5E', 4) + '/>'; }, 3, 3.5) +
    '<path d="M30 38 Q40 30 52 31" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>' +
    '<path d="M62 22 Q66 12 76 12 Q72 22 62 22Z" fill="#8FA968" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>') };
  F.cherry = { name: 'Cherries', color: '#C8574A', svg: svgWrap('0 0 100 100', null,
    '<path d="M54 12 Q40 32 32 58 M54 12 Q62 36 70 60" fill="none" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M54 12 Q40 32 32 58 M54 12 Q62 36 70 60" fill="none" stroke="#7D9A5C" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M54 12 Q66 2 80 8 Q68 18 54 12Z" fill="#8FA968" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>' +
    shadow(function (sh) { return '<circle cx="30" cy="68" r="17" ' + st(sh, '#C8574A', 4) + '/><circle cx="70" cy="70" r="17" ' + st(sh, '#C8574A', 4) + '/>'; }, 3, 3.5) +
    '<path d="M22 62 Q24 57 29 56 M62 64 Q64 59 69 58" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>') };
  F.strawberry = { name: 'Strawberry', color: '#C8574A', svg: svgWrap('0 0 100 100', null,
    shadow(function (sh) { return '<path d="M50 90 Q20 70 18 44 Q18 28 34 26 Q50 24 50 30 Q50 24 66 26 Q82 28 82 44 Q80 70 50 90Z" ' + st(sh, '#C8574A', 4) + '/>'; }, 3, 3.5) +
    '<g fill="#F6D58E"><ellipse cx="36" cy="44" rx="2" ry="3"/><ellipse cx="50" cy="42" rx="2" ry="3"/><ellipse cx="64" cy="44" rx="2" ry="3"/><ellipse cx="42" cy="58" rx="2" ry="3"/><ellipse cx="58" cy="58" rx="2" ry="3"/><ellipse cx="50" cy="72" rx="2" ry="3"/><ellipse cx="30" cy="54" rx="2" ry="3"/><ellipse cx="70" cy="54" rx="2" ry="3"/></g>' +
    '<path d="M50 30 L36 18 L46 22 L50 10 L54 22 L64 18 Z" fill="#7D9A5C" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>') };
  F.orange = { name: 'Orange', color: '#D4A373', svg: svgWrap('0 0 100 100', null,
    shadow(function (sh) { return '<circle cx="50" cy="54" r="34" ' + st(sh, '#D4A373', 4) + '/>'; }, 3, 3.5) +
    '<circle cx="38" cy="46" r="1.6" fill="#B98255"/><circle cx="60" cy="64" r="1.6" fill="#B98255"/><circle cx="62" cy="44" r="1.6" fill="#B98255"/><circle cx="44" cy="68" r="1.6" fill="#B98255"/>' +
    '<path d="M30 40 Q36 30 46 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>' +
    '<path d="M50 20 Q58 8 72 12 Q62 22 50 20Z" fill="#8FA968" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M50 20 V26" stroke="' + O + '" stroke-width="3.4" stroke-linecap="round"/>') };
  F.grapes = { name: 'Grapes', color: '#A56F63', svg: svgWrap('0 0 100 100', null,
    '<path d="M50 20 V8" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M52 14 Q66 4 78 12 Q64 22 52 14Z" fill="#8FA968" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>' +
    shadow(function (sh) {
      var out = '', pts = [[34, 30], [50, 28], [66, 30], [42, 46], [58, 46], [30, 46], [70, 46], [50, 62], [38, 62], [62, 62], [50, 78], [44, 76], [56, 76]];
      pts.slice(0, 10).forEach(function (p) { out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="10" ' + st(sh, '#A56F63', 3.4) + '/>'; });
      out += '<circle cx="50" cy="77" r="10" ' + st(sh, '#A56F63', 3.4) + '/>';
      return out;
    }, 3, 3.5) +
    '<path d="M30 26 Q32 23 35 23 M46 42 Q48 39 51 39 M34 58 Q36 55 39 55" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>') };
  A.fruits = F;

  /* ===================================================== misc icons ===== */
  A.icons = {
    back: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    soundOn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 9 Q18 12 16 15 M18.5 6.5 Q22.5 12 18.5 17.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    soundOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M16.5 9.5 L21.5 14.5 M21.5 9.5 L16.5 14.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    pause: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>',
    restart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 12 A7 7 0 1 1 16.5 6.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M17.5 2.5 V7.5 H12.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 9 Q9 5.5 12 5.5 Q15 5.5 15 8.5 Q15 10.5 12.5 11.5 Q12 12 12 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18.5" r="1.7" fill="currentColor"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 20 L4.5 12.5 Q1.5 9 4 6 Q7 3.5 10 6 L12 8 L14 6 Q17 3.5 20 6 Q22.5 9 19.5 12.5 Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 15 L20 20" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
    person: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4" fill="currentColor"/><path d="M4 21 Q4 13 12 13 Q20 13 20 21 Z" fill="currentColor"/></svg>',
    trophy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 4 H17 V9 Q17 14 12 14 Q7 14 7 9 Z" fill="currentColor"/><path d="M7 6 H4 Q4 10 7.5 10.5 M17 6 H20 Q20 10 16.5 10.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 14 V18 M8 20 H16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'
  };
})();

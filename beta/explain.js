'use strict';
/* Вывод решения в 3 столбца (ТЗ_3_stolbca.md). Использует глобальные функции engine.js. */
var WHY = {
  '6.9': { name: 'cos a = cos b · cos c + sin b · sin c · cos A (6.9) — формула косинуса стороны',
    why: 'Связывает три стороны и угол между двумя из них. Выводится проецированием радиус-векторов вершин на оси (или из скалярного произведения векторов OB·OC). Даёт искомый элемент независимо от других искомых. Через cos четверть определяется однозначно: + — меньше 90°, − — больше 90°.' },
  '6.9t1': 'Можно и по полупериметру (tg A/2), но учебник для типа 1 рекомендует (6.9).',
  '6.10': { name: 'cos A = − cos B · cos C + sin B · sin C · cos a (6.10) — формула косинуса угла',
    why: 'Это (6.9), записанная для полярного треугольника (a′ = 180° − A, A′ = 180° − a). Подходит для типа 2 и для третьего угла в типе 4.' },
  '6.11': { name: 'ctg a · sin b = cos b · cos C + sin C · ctg A (6.11) — формула котангенсов',
    why: 'Четыре рядом лежащих элемента: два крайних и два средних. Выводится делением формулы пяти элементов на формулу синусов. Даёт угол через tg, четверть однозначна, в формулу входят только данные элементы. Альтернатива: tg A = sin C / (sin b · ctg a − cos C · cos b).' },
  '6.12': { name: 'tg[(A ± B)/2] = cos или sin[(a ∓ b)/2] / cos или sin[(a + b)/2] · ctg(C/2) (6.12) — аналогии Непера для углов',
    why: 'Выводятся из формул Деламбра — Гаусса делением. Дают полусумму и полуразность искомых через tg, только по данным элементам. Полусумма лежит в той же четверти, что полусумма данных (свойство Эйлера 6.5), отсюда поправка +180°. Затем A = полусумма + полуразность, B = полусумма − полуразность.' },
  '6.13': { name: 'tg[(a ± b)/2] = cos или sin[(A ∓ B)/2] / cos или sin[(A + B)/2] · tg(c/2) (6.13) — аналогии Непера для сторон',
    why: 'Двойственны (6.12) — получены для полярного треугольника. Дают полусумму и полуразность сторон только по данным элементам; четверть полусуммы — по свойству (6.5).' },
  '6.14': { name: 'sin²(c/2) = sin²[(a − b)/2] + sin a · sin b · sin²(C/2) (6.14) — преобразованная формула косинуса стороны',
    why: 'Получается из (6.9) заменой cos x = 1 − 2 sin²(x/2). Удобна, когда сторона мала или близка к 0°/180°, где косинус меняется медленно.' },
  '6.8': { name: 'sin a / sin A = sin b / sin B = sin c / sin C (6.8) — формула синусов',
    why: 'Самая простая, но синус не различает x и 180° − x. Поэтому проверяются оба значения по свойствам Эйлера и правилу «против большей стороны больший угол».' },
  'neper': { name: 'Правило Модюи — Непера (6.15), (6.16)',
    why: 'Пять элементов прямоугольного треугольника (без прямого угла, катеты — дополнениями 90° − b, 90° − c) ставятся по кругу. I: cos среднего = произведению sin несмежных. II: cos среднего = произведению ctg смежных. Пример: cos(90° − c) = ctg(90° − B) · ctg(90° − b) ⇒ sin c = tg b · ctg B.' },
  'quad': { name: 'Переход к полярному треугольнику',
    why: 'Каждый элемент заменяем на 180° − x, стороны ↔ углы. Полярный к четвертному (a = 90°) — прямоугольный (A′ = 180° − 90° = 90°), а все формулы сферической тригонометрии справедливы для любого треугольника, поэтому решение полярного однозначно возвращается к исходному.' }
};
var TYPE_NAMES = ['', 'три стороны', 'три угла', 'две стороны и угол между ними', 'два угла и сторона между ними',
  'две стороны и угол, противолежащий одной из них', 'два угла и сторона, противолежащая одному из них'];

function xType(g) {
  var s = SIDES.filter(function (k) { return k in g; }), A = ANGS.filter(function (k) { return k in g; });
  if (s.length === 3) return 1;
  if (A.length === 3) return 2;
  if (s.length === 2) { var m = SIDES.filter(function (k) { return s.indexOf(k) < 0; })[0]; return A[0].toLowerCase() === m ? 3 : 5; }
  var mA = ANGS.filter(function (k) { return A.indexOf(k) < 0; })[0];
  return s[0].toUpperCase() === mA ? 4 : 6;
}
function near90(v) { return Math.abs(v - 90) < 1e-4; }
function rightInfo(g) {
  var R = ANGS.filter(function (k) { return k in g && near90(g[k]); })[0];
  var Q = SIDES.filter(function (k) { return k in g && near90(g[k]); })[0];
  var info = { right: R, quad: Q };
  if (R) {
    var m = permTo(R), inv = invPerm(m);
    var ks = Object.keys(g).filter(function (k) { return k !== R; }).map(function (k) { return inv[k]; }).sort().join(',');
    var P = { 'b,c': 'два катета', 'a,b': 'гипотенуза и катет', 'a,c': 'гипотенуза и катет', 'B,a': 'гипотенуза и прилежащий угол',
      'C,a': 'гипотенуза и прилежащий угол', 'C,b': 'катет и прилежащий угол', 'B,c': 'катет и прилежащий угол',
      'B,C': 'два косых угла', 'B,b': 'катет и противолежащий угол', 'C,c': 'катет и противолежащий угол' };
    info.pair = P[ks] || ''; info.m = m; info.key = ks;
  }
  if (Q) info.qm = permTo(Q.toUpperCase());
  return info;
}
function V(k, v) { return k + ' = ' + fmt(v); }
var OK = '<b class="ok">✓</b>', BAD = '<b class="bad">✗</b>';
function mk(c) { return c ? OK : BAD; }

/* ---------- Чертёж ---------- */
var PTS = { A: [150, 28], C: [26, 196], B: [274, 196] };
function arcMid(p, q, bulge) {
  var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, cx = 150, cy = 140;
  var dx = mx - cx, dy = my - cy, L = Math.hypot(dx, dy) || 1;
  return [mx + dx / L * bulge, my + dy / L * bulge];
}
function drawTri(g, e, showAns) {
  var info = rightInfo(g);
  var sides = { a: ['C', 'B'], b: ['A', 'C'], c: ['A', 'B'] };
  var o = '<svg class="tri" viewBox="-20 -10 340 278" role="img" aria-label="Чертёж треугольника">';
  Object.keys(sides).forEach(function (k) {
    var p = PTS[sides[k][0]], q = PTS[sides[k][1]], c = arcMid(p, q, 26);
    var given = k in g, q90 = given && near90(g[k]);
    o += '<path d="M' + p + ' Q' + c + ' ' + q + '" fill="none" stroke="' + (given ? '#1f4e79' : '#556') + '" stroke-width="' + (given ? 4 : 2) + '"' + (q90 ? ' stroke-dasharray="9 5"' : '') + '/>';
  });
  function label(k, x, y, lx, ly) {
    var given = k in g;
    o += given ? '<circle cx="' + x + '" cy="' + y + '" r="12" fill="#e6eef6" stroke="#1f4e79" stroke-width="2"/>' : '';
    o += '<text x="' + x + '" y="' + (y + 6) + '" text-anchor="middle" class="lt' + (given ? ' g' : '') + '">' + k + '</text>';
    var t = given ? k + ' = ' + (near90(g[k]) ? '90°' : fmt(g[k])) : (showAns && e ? k + ' = ' + fmt(e[k]) : k + ' — ?');
    var w = t.length * 7.4 + 14;
    o += '<rect x="' + (lx - w / 2) + '" y="' + (ly - 13) + '" width="' + w + '" height="20" rx="10" fill="' + (given ? '#1f4e79' : '#fff') + '" stroke="' + (given ? '#1f4e79' : '#aab') + '"/>';
    o += '<text x="' + lx + '" y="' + (ly + 2) + '" text-anchor="middle" class="pill' + (given ? ' g' : (showAns && e ? ' ans' : '')) + '">' + t + '</text>';
  }
  var ma = arcMid(PTS.C, PTS.B, 26), mb = arcMid(PTS.A, PTS.C, 26), mc = arcMid(PTS.A, PTS.B, 26);
  label('a', ma[0], ma[1] - 16, ma[0], ma[1] + 26);
  label('b', mb[0] + 16, mb[1], mb[0] - 4, mb[1] - 34);
  label('c', mc[0] - 22, mc[1] + 4, mc[0] + 4, mc[1] - 34);
  label('A', 150, 62, 150, 6);
  label('C', 58, 182, 40, 228);
  label('B', 242, 182, 260, 228);
  if (info.right) {
    var p = PTS[info.right];
    var dx = info.right === 'A' ? 0 : info.right === 'C' ? 1 : -1, dy = info.right === 'A' ? 1 : -0.4;
    o += '<path d="M' + (p[0] - 10 * (dx === 0 ? 1 : 0) + 12 * dx) + ',' + (p[1] + 14 * dy) + ' l' + (dx === 0 ? 10 : 0) + ',' + (dx === 0 ? 8 : -10) + ' l10,' + (dx === 0 ? -8 : 2) + '" fill="none" stroke="#8b2e32" stroke-width="2"/>';
  }
  return o + '</svg>';
}
function drawNeper(g, e, info) {
  var items, cen;
  if (info.right) {
    var m = info.m;
    items = [['90° − ' + m.c, m.c], [m.B, m.B], [m.a, m.a], [m.C, m.C], ['90° − ' + m.b, m.b]];
    cen = m.A + ' = 90°';
  } else {
    var q = info.qm; // q.A — вершина против стороны 90°
    items = [['90° − ' + q.C, q.C], [q.b, q.b], ['180° − ' + q.A, q.A], [q.c, q.c], ['90° − ' + q.B, q.B]];
    cen = q.a + ' = 90°';
  }
  var o = '<svg class="nep" viewBox="0 0 220 220" role="img" aria-label="Круг Непера"><circle cx="110" cy="110" r="96" fill="#fff" stroke="#556" stroke-width="1.5"/>';
  for (var i = 0; i < 5; i++) {
    var an = (-90 + 36 + i * 72) * Math.PI / 180;
    o += '<line x1="110" y1="110" x2="' + (110 + 96 * Math.cos(an)) + '" y2="' + (110 + 96 * Math.sin(an)) + '" stroke="#556"/>';
    var am = (-90 + i * 72) * Math.PI / 180, x = 110 + 62 * Math.cos(am), y = 110 + 62 * Math.sin(am);
    var k = items[i][1], given = k in g;
    if (given) o += '<ellipse cx="' + x + '" cy="' + y + '" rx="34" ry="15" fill="#e6eef6" stroke="#1f4e79" stroke-width="2"/>';
    o += '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" class="nt' + (given ? ' g' : '') + '">' + items[i][0] + (given ? '' : ' ?') + '</text>';
  }
  o += '<circle cx="110" cy="110" r="20" fill="#f3e6e6" stroke="#8b2e32"/><text x="110" y="114" text-anchor="middle" class="nc">' + cen + '</text>';
  return o + '</svg>';
}

/* ---------- Условия существования ---------- */
function rows(e, full) {
  var r = [];
  var ks = function (L) { return L.every(function (k) { return k in e; }); };
  if (ks(SIDES)) {
    var S = e.a + e.b + e.c;
    r.push(['(6.1)', '0° < a + b + c = ' + fmt(S) + ' < 360°', S > 0 && S < 360]);
    [['a', 'b', 'c'], ['b', 'a', 'c'], ['c', 'a', 'b']].forEach(function (t) {
      r.push(['(6.2)', t[0] + ' = ' + fmt(e[t[0]]) + ' < ' + t[1] + ' + ' + t[2] + ' = ' + fmt(e[t[1]] + e[t[2]]), e[t[0]] < e[t[1]] + e[t[2]]]);
      r.push(['(6.2)', t[0] + ' = ' + fmt(e[t[0]]) + ' > |' + t[1] + ' − ' + t[2] + '| = ' + fmt(Math.abs(e[t[1]] - e[t[2]])), e[t[0]] > Math.abs(e[t[1]] - e[t[2]])]);
    });
  }
  if (ks(ANGS)) {
    var T = e.A + e.B + e.C;
    r.push(['(6.3)', '180° < A + B + C = ' + fmt(T) + ' < 540°; ε = ' + fmt(T - 180), T > 180 && T < 540]);
    [['A', 'B', 'C'], ['B', 'A', 'C'], ['C', 'A', 'B']].forEach(function (t) {
      r.push(['(6.4)', t[1] + ' + ' + t[2] + ' = ' + fmt(e[t[1]] + e[t[2]]) + ' < 180° + ' + t[0] + ' = ' + fmt(180 + e[t[0]]), e[t[1]] + e[t[2]] < 180 + e[t[0]]]);
    });
  }
  if (full) {
    [['a', 'b'], ['a', 'c'], ['b', 'c']].forEach(function (p) {
      var x = p[0], y = p[1], X = x.toUpperCase(), Y = y.toUpperCase();
      var s1 = Math.sign(Math.round((e[x] + e[y] - 180) * 6000)), s2 = Math.sign(Math.round((e[X] + e[Y] - 180) * 6000));
      r.push(['(6.5)', x + ' + ' + y + ' = ' + fmt(e[x] + e[y]) + ' ' + rel(s1) + ' 180° ⇔ ' + X + ' + ' + Y + ' = ' + fmt(e[X] + e[Y]) + ' ' + rel(s2) + ' 180°', s1 === s2]);
      var d1 = Math.sign(Math.round((e[x] - e[y]) * 6000)), d2 = Math.sign(Math.round((e[X] - e[Y]) * 6000));
      r.push([d1 === 0 ? '(6.6)' : '(6.7)', x + ' ' + rel(d1) + ' ' + y + ' ⇔ ' + X + ' = ' + fmt(e[X]) + ' ' + rel(d2) + ' ' + Y + ' = ' + fmt(e[Y]), d1 === d2]);
    });
  }
  return r;
}
function rel(s) { return s < 0 ? '<' : s > 0 ? '>' : '='; }
function rowsHtml(r) {
  return '<table class="cond">' + r.map(function (x) {
    return '<tr class="' + (x[2] ? '' : 'viol') + '"><td>' + x[0] + '</td><td>' + x[1] + '</td><td>' + mk(x[2]) + '</td></tr>';
  }).join('') + '</table>';
}
function sinCond(g, T) {
  // |sin| ≤ 1 для типов 5, 6 и прямоугольного «катет + противолежащий угол»
  var s = SIDES.filter(function (k) { return k in g; }), A = ANGS.filter(function (k) { return k in g; });
  if (T === 5) {
    var ang = A[0], o = ang.toLowerCase(), oth = s.filter(function (k) { return k !== o; })[0];
    var v = sin(g[oth]) * sin(g[ang]) / sin(g[o]);
    return { k: oth.toUpperCase(), v: v, txt: 'sin ' + oth.toUpperCase() + ' = sin ' + oth + ' · sin ' + ang + ' / sin ' + o + ' = ' + n5(sin(g[oth])) + ' · ' + n5(sin(g[ang])) + ' / ' + n5(sin(g[o])) + ' = ' + n5(v) };
  }
  if (T === 6) {
    var sd = s[0], Op = sd.toUpperCase(), Ot = A.filter(function (k) { return k !== Op; })[0];
    var w = sin(g[sd]) * sin(g[Ot]) / sin(g[Op]);
    return { k: Ot.toLowerCase(), v: w, txt: 'sin ' + Ot.toLowerCase() + ' = sin ' + sd + ' · sin ' + Ot + ' / sin ' + Op + ' = ' + n5(sin(g[sd])) + ' · ' + n5(sin(g[Ot])) + ' / ' + n5(sin(g[Op])) + ' = ' + n5(w) };
  }
  return null;
}
function candidates(g, T, res) {
  // Для типов 5, 6: два кандидата по синусу и причина отбрасывания
  var sc = sinCond(g, T); if (!sc || sc.v > 1) return null;
  var x1 = asin(Math.min(1, sc.v)), x2 = 180 - x1, k = sc.k;
  var sols = res && res.solutions ? res.solutions : [];
  return [x1, x2].map(function (x, i) {
    var hit = sols.filter(function (s) { return Math.abs(s.e[k] - x) < 1e-4; })[0];
    var why = '';
    if (!hit) {
      var e = {}; Object.keys(g).forEach(function (q) { e[q] = g[q]; }); e[k] = x;
      // пара (данный противолежащий элемент, кандидат) — проверка (6.5)/(6.7)
      var isSide = k === k.toLowerCase();
      var pk = isSide ? SIDES.filter(function (q) { return q in g && q !== k; }) : ANGS.filter(function (q) { return q in g && q !== k; });
      pk.forEach(function (p) {
        var P = isSide ? p.toUpperCase() : p.toLowerCase(), K = isSide ? k.toUpperCase() : k.toLowerCase();
        if (!(P in g) || !(K in g)) return;
        var d1 = Math.sign(Math.round((e[p] - e[k]) * 6000)), d2 = Math.sign(Math.round((e[P] - e[K]) * 6000));
        var s1 = Math.sign(Math.round((e[p] + e[k] - 180) * 6000)), s2 = Math.sign(Math.round((e[P] + e[K] - 180) * 6000));
        if (d1 !== d2) why = 'нарушает (6.7): ' + p + ' ' + rel(d1) + ' ' + k + ', но ' + P + ' ' + rel(d2) + ' ' + K;
        else if (s1 !== s2) why = 'нарушает (6.5): ' + p + ' + ' + k + ' = ' + fmt(e[p] + e[k]) + ' ' + rel(s1) + ' 180°, но ' + P + ' + ' + K + ' = ' + fmt(e[P] + e[K]) + ' ' + rel(s2) + ' 180°';
      });
      if (!why) why = 'не даёт треугольника: третий элемент по аналогиям Непера выходит за пределы 0°…180° (нарушаются (6.1)–(6.4))';
    }
    return { name: k + (i + 1 === 1 ? '₁' : '₂'), x: x, ok: !!hit, why: why };
  });
}

/* ---------- Оценка по свойствам ---------- */
function estimate(g) {
  var out = [], exp = [];
  [['a', 'b'], ['a', 'c'], ['b', 'c'], ['A', 'B'], ['A', 'C'], ['B', 'C']].forEach(function (p) {
    var x = p[0], y = p[1];
    if (!(x in g && y in g)) return;
    var isS = x === x.toLowerCase(), X = isS ? x.toUpperCase() : x.toLowerCase(), Y = isS ? y.toUpperCase() : y.toLowerCase();
    var d = Math.sign(Math.round((g[x] - g[y]) * 6000)), s = Math.sign(Math.round((g[x] + g[y] - 180) * 6000));
    if (!(X in g && Y in g)) {
      out.push(x + ' ' + rel(d) + ' ' + y + ' ⇒ ' + X + ' ' + rel(d) + ' ' + Y + ' (6.' + (d ? 7 : 6) + ')');
      exp.push({ t: X + ' ' + rel(d) + ' ' + Y, f: function (e) { return Math.sign(Math.round((e[X] - e[Y]) * 6000)) === d; } });
      out.push(x + ' + ' + y + ' = ' + fmt(g[x] + g[y]) + ' ' + rel(s) + ' 180° ⇒ ' + X + ' + ' + Y + ' ' + rel(s) + ' 180° (6.5)');
      exp.push({ t: X + ' + ' + Y + ' ' + rel(s) + ' 180°', f: function (e) { return Math.sign(Math.round((e[X] + e[Y] - 180) * 6000)) === s; } });
      if (s !== 0 && X in g === false && Y in g) {}
    }
    if (isS) {
      var z = SIDES.filter(function (q) { return q !== x && q !== y; })[0];
      if (!(z in g)) {
        var lo = Math.abs(g[x] - g[y]), hi = Math.min(g[x] + g[y], 360 - g[x] - g[y]);
        out.push('|' + x + ' − ' + y + '| = ' + fmt(lo) + ' < ' + z + ' < ' + fmt(hi) + ' (6.1), (6.2)');
        exp.push({ t: fmt(lo) + ' < ' + z + ' < ' + fmt(hi), f: function (e) { return e[z] > lo && e[z] < hi; } });
      }
    }
  });
  return { lines: out, exp: exp };
}

/* ---------- Контроль Гаусса ---------- */
function gauss(e) {
  var l = sin((e.A + e.B) / 2) * cos(e.c / 2), r = cos((e.a - e.b) / 2) * cos(e.C / 2);
  var t1 = tg((e.a + e.b) / 2) / tg((e.a - e.b) / 2), t2 = tg((e.A + e.B) / 2) / tg((e.A - e.B) / 2);
  var s = '<div class="f">sin[(A + B)/2] · cos(c/2) = ' + n5(sin((e.A + e.B) / 2)) + ' · ' + n5(cos(e.c / 2)) + ' = ' + n5(l) + '</div>' +
    '<div class="f">cos[(a − b)/2] · cos(C/2) = ' + n5(cos((e.a - e.b) / 2)) + ' · ' + n5(cos(e.C / 2)) + ' = ' + n5(r) + '</div>';
  if (Math.abs(e.a - e.b) > 0.01 && Math.abs(e.A - e.B) > 0.01 && isFinite(t1) && isFinite(t2))
    s += '<div class="f">tg[(a+b)/2] / tg[(a−b)/2] = ' + n5(t1) + ';   tg[(A+B)/2] / tg[(A−B)/2] = ' + n5(t2) + '</div>';
  var d = Math.abs(l - r);
  return s + '<div class="p">Расхождение ' + n5(d) + (d < 2e-5 ? ' — в последнем знаке, решение верно ' + OK : ' ' + BAD) + '</div>';
}


/* ---------- Контроль по теореме синусов (основной) ---------- */
var SINE_TOL = 5e-5;
function sineCheck(e) {
  var r = [], rows = '';
  [['a', 'A'], ['b', 'B'], ['c', 'C']].forEach(function (p) {
    var ss = sin(e[p[0]]), sa = sin(e[p[1]]);
    var q = Math.abs(sa) < 1e-9 ? NaN : ss / sa;
    r.push(q);
    rows += '<div class="f">sin ' + p[0] + ' / sin ' + p[1] + ' = sin ' + fmt(e[p[0]]) + ' / sin ' + fmt(e[p[1]]) + ' = ' + n5(ss) + ' / ' + n5(sa) + ' = ' + (isFinite(q) ? n5(q) : '— (sin ' + p[1] + ' = 0)') + '</div>';
  });
  var ok = r.every(isFinite), d = ok ? Math.max(Math.abs(r[0] - r[1]), Math.abs(r[0] - r[2]), Math.abs(r[1] - r[2])) : NaN;
  var pass = ok && d <= SINE_TOL;
  return { ratios: r, d: d, pass: pass, html: '<p>Формула синусов (6.8): sin a / sin A = sin b / sin B = sin c / sin C. Подставляем все шесть элементов — данные и найденные.</p>' + rows +
    '<div class="f">Отношения: ' + r.map(function (x) { return isFinite(x) ? n5(x) : '—'; }).join(';   ') + '</div>' +
    '<div class="p">Наибольшее расхождение: ' + (ok ? n5(d) : '—') + ' (допуск ' + n5(SINE_TOL) + ', последний знак) ' + (pass ? '— решение верно ' + OK : '— контроль не сошёлся ' + BAD) + '</div>' };
}

/* ---------- Сборка ---------- */
function formulaChoice(T, info) {
  if (info.right) return { text: 'Прямоугольный треугольник (' + info.pair + '): по табл. 6.1 решаем по правилу Модюи — Непера, каждый искомый — через данные.', keys: ['neper'].concat(info.key === 'B,b' || info.key === 'C,c' ? ['6.8'] : []) };
  if (info.quad) return { text: 'Четвертной треугольник: переходим к полярному прямоугольному и решаем его по правилу Модюи — Непера.', keys: ['quad', 'neper'] };
  return [null,
    { text: 'Тип 1: все три угла — по формуле косинуса стороны (6.9), каждый независимо от других. ' + WHY['6.9t1'], keys: ['6.9'] },
    { text: 'Тип 2: все три стороны — по формуле косинуса угла (6.10).', keys: ['6.10'] },
    { text: 'Тип 3: третья сторона — по (6.9), углы — по аналогиям Непера (6.12). В формулы подставляются только данные элементы. Альтернатива для углов — (6.11), для малой стороны — (6.14).', keys: ['6.9', '6.12', '6.11', '6.14'] },
    { text: 'Тип 4: стороны — по аналогиям Непера (6.13), третий угол — по (6.10). Подставляются только данные элементы.', keys: ['6.13', '6.10'] },
    { text: 'Тип 5: противолежащий угол — по формуле синусов (6.8), два кандидата; затем третья сторона и угол — по аналогиям Непера (6.12)/(6.13). Здесь без найденного по синусу угла не обойтись — это особенность типа 5. Альтернатива по учебнику — (6.11).', keys: ['6.8', '6.12', '6.11'] },
    { text: 'Тип 6: противолежащая сторона — по формуле синусов (6.8), два кандидата; затем остальное — по аналогиям Непера (6.13)/(6.12). Без найденной по синусу стороны не обойтись.', keys: ['6.8', '6.13', '6.12'] }][T];
}
function card(title, body) { return '<div class="xcard"><div class="xh">' + title + '</div>' + body + '</div>'; }

function buildColumns(g, res, idx, showAns, mode) {
  idx = idx || 0; mode = mode || { ang: '6.12', side: 'auto' };
  var T = xType(g), info = rightInfo(g), sols = res.solutions || [], sol = sols[idx];
  var unknown = NAMES.filter(function (k) { return !(k in g); });
  // Столбец 1
  var c1 = '<p><b>Тип ' + T + ' по табл. 6.1</b> — ' + TYPE_NAMES[T] + '.</p>';
  if (info.right) c1 += '<p>Прямоугольный (' + info.right + ' = 90°), пара данных: ' + info.pair + '.</p>';
  if (info.quad) c1 += '<p>Четвертной (' + info.quad + ' = 90°).</p>';
  c1 += '<p><b>Дано:</b> ' + NAMES.filter(function (k) { return k in g; }).map(function (k) { return V(k, g[k]); }).join('; ') + '.</p>';
  c1 += '<p><b>Найти:</b> ' + unknown.join(', ') + '.</p>';
  c1 += drawTri(g, sol && sol.e, showAns);
  if (sol) c1 += '<label class="tog"><input type="checkbox" id="xans"' + (showAns ? ' checked' : '') + '> на чертеже: с ответом</label>';
  if (info.right || info.quad) c1 += '<p class="muted">Круг Непера' + (info.quad ? ' (через полярный треугольник)' : '') + ':</p>' + drawNeper(g, sol && sol.e, info);
  // Столбец 3
  var full = sol ? sol.e : null;
  var kindName = { oblique: 'косоугольный — ни одного прямого угла и стороны 90°', right: 'прямоугольный — один из углов 90°', quad: 'четвертной — одна из сторон 90°', both: 'прямоугольный и четвертной — есть и угол 90°, и сторона 90°' };
  var c3 = '<p><b>Вид:</b> ' + (sol ? kindName[sol.kind] + (sol.small ? '; малый (все стороны ≤ 6°)' : '') : (info.right ? kindName.right : info.quad ? kindName.quad : 'косоугольный (по данным)')) + '.</p>';
  c3 += '<p><b>Тип задания:</b> ' + T + ' — ' + TYPE_NAMES[T] + '. Проверяются: ' + ['', '(6.1), (6.2)', '(6.3), (6.4)', 'существует всегда', 'существует всегда', '|sin| ≤ 1, (6.5)–(6.7)', '|sin| ≤ 1, (6.5)–(6.7)'][T] + '.</p>';
  var pre = rows(g, false), violated = null;
  if (T === 3 || T === 4) c3 += '<p>Три рядом лежащих элемента — треугольник существует всегда ' + OK + '</p>';
  var sc = sinCond(g, T);
  if (sc) pre.push(['|sin| ≤ 1', sc.txt, sc.v <= 1 + 1e-12]);
  if (pre.length) c3 += '<div class="xh2">До решения (по данным)</div>' + rowsHtml(pre);
  pre.forEach(function (x) { if (!x[2] && !violated) violated = x; });
  if (full) {
    c3 += '<div class="xh2">После решения (все шесть элементов)</div>' + rowsHtml(rows(full, true));
    if (sol.kind === 'right' || sol.kind === 'both') {
      var n = SIDES.filter(function (k) { return full[k] > 90 + 1e-6; }).length;
      c3 += '<p>п. 7: сторон больше 90° — ' + n + ' (в прямоугольном 0 или 2) ' + mk(n % 2 === 0 || sol.kind === 'both') + '</p>';
      var R = ANGS.filter(function (k) { return Math.abs(full[k] - 90) < 0.02; })[0], m = permTo(R);
      [[m.b, m.B], [m.c, m.C]].forEach(function (p) {
        var same = (full[p[0]] - 90) * (full[p[1]] - 90) >= -1e-6;
        c3 += '<p>п. 9: катет ' + V(p[0], full[p[0]]) + ' и противолежащий ' + V(p[1], full[p[1]]) + ' — в одной четверти ' + mk(same) + '</p>';
      });
    }
    if (sol.kind === 'quad' || sol.kind === 'both') {
      var nA = ANGS.filter(function (k) { return full[k] > 90 + 1e-6; }).length;
      c3 += '<p>п. 8: углов больше 90° — ' + nA + ' (в четвертном 1 или 3) ' + mk(nA % 2 === 1 || sol.kind === 'both') + '</p>';
    }
  }
  var cand = (T === 5 || T === 6) && !info.right && !info.quad ? candidates(g, T, res) : null;
  c3 += '<div class="xh2">Сколько решений и почему</div>';
  if (!sols.length) c3 += '<p class="bad">Решения нет: ' + (violated ? 'нарушено условие ' + violated[0] + ': ' + violated[1] : (res.error || 'данные противоречат условиям существования')) + '.</p>';
  else if (cand) c3 += '<p>' + sc.txt + ' ≤ 1 → кандидаты ' + cand.map(function (c) { return c.name + ' = ' + fmt(c.x); }).join(', ') + '.</p>' +
    cand.map(function (c) { return '<p>' + c.name + ' ' + (c.ok ? 'проходит (6.1)–(6.7) ' + OK : c.why + ' ' + BAD) + '</p>'; }).join('') +
    '<p>' + (sols.length === 2 ? 'Оба кандидата удовлетворяют всем условиям — решений два.' : 'Решение одно.') + '</p>';
  else c3 += '<p>' + (sols.length === 2 ? 'Решений два: оба значения по синусу удовлетворяют всем условиям (катет и противолежащий угол в одной четверти).' : 'Решение одно: ' + (T === 3 || T === 4 ? 'три рядом лежащих элемента определяют треугольник однозначно.' : 'все искомые найдены через cos/tg, четверть однозначна.')) + '</p>';
  if (res.nearLimit) c3 += '<p class="w">' + res.nearLimit + '</p>';
  var est = estimate(g);
  if (full && est.exp.length) c3 += '<div class="xh2">Сверка оценки</div>' + est.exp.map(function (x) { return '<p>ожидали ' + x.t + ' — ' + (x.f(full) ? 'подтвердилось ' + OK : 'не подтвердилось ' + BAD) + '</p>'; }).join('');
  // Столбец 2
  var c2 = '';
  if (sols.length > 1) c2 += '<div class="xtabs">' + sols.map(function (s, i) { return '<button data-i="' + i + '" class="' + (i === idx ? 'on' : '') + '">Решение ' + (i + 1) + '</button>'; }).join('') + '</div>';
  if (!sol) c2 += '<p class="bad">Решения нет: нарушено условие ' + (violated ? violated[0] : '(6.1)–(6.4)') + ', см. справа.</p>';
  else {
    c2 += card('0. Оценка по свойствам', est.lines.length ? est.lines.map(function (l) { return '<div class="f">' + l + '</div>'; }).join('') + '<p>Ожидаем: ' + est.exp.map(function (x) { return x.t; }).join('; ') + '.</p>' : '<p>Для этого набора данных пары «сторона — противолежащий угол» неизвестны целиком; оценка — по (6.1)–(6.4), см. справа.</p>');
    var ch = formulaChoice(T, info);
    c2 += card('1. Выбор формул', '<p>' + ch.text + '</p>' + ch.keys.map(function (k) { return '<div class="why"><b>' + WHY[k].name + '</b><br>Откуда и почему: ' + WHY[k].why + '</div>'; }).join(''));
    if (cand) c2 += card('Выбор четверти', cand.map(function (c) { return '<p>' + c.name + ' = ' + fmt(c.x) + (c.ok ? ' — принят ' + OK : ' — отброшен: ' + c.why + ' ' + BAD) + '</p>'; }).join(''));
    if ((T === 3 || T === 4) && !info.right && !info.quad) c2 += '<div class="xmode">Углы/стороны: <select id="xang"><option value="6.12"' + (mode.ang === '6.12' ? ' selected' : '') + '>' + (T === 3 ? '(6.12)' : '(6.13)') + ' аналогии Непера</option><option value="6.11"' + (mode.ang === '6.11' ? ' selected' : '') + '>(6.11) котангенсы</option></select>' +
      (T === 3 ? ' Третья сторона: <select id="xside"><option value="auto"' + (mode.side === 'auto' ? ' selected' : '') + '>авто</option><option value="6.9"' + (mode.side === '6.9' ? ' selected' : '') + '>(6.9)</option><option value="6.14"' + (mode.side === '6.14' ? ' selected' : '') + '>(6.14)</option></select>' : '') + '</div>';
    if (info.right || info.quad) c2 += card('Круг Модюи — Непера ' + (info.right ? '(6.15)' : '(6.16)'), drawNeper(g, sol.e, info) + neperRulesHtml(info));
    sol.multi = sols.length > 1;
    buildElementCards(g, sol, res, mode).forEach(function (ec, i) { c2 += renderElementCard(ec, i); });
    c2 += '<details class="xcard"><summary>Краткий ход решения (как в прежней версии)</summary>' + (typeof renderSteps === 'function' ? renderSteps(sol.steps) : '') + '</details>';
    c2 += '<div class="xcard sine">' + '<div class="xh">3. Контроль по теореме синусов (основной)</div>' + sineCheck(sol.e).html + '</div>';
    c2 += card('4. Дополнительный контроль по формуле Гаусса (Деламбра)', gauss(sol.e));
    if (sol.small && sol.plane) c2 += '<p><b>Плоский ответ:</b> ' + sol.unknown.map(function (k) { return k + ' = ' + fmt2(sol.plane[k]); }).join('; ') + '.</p>';
    if (est.exp.length) c2 += '<p><b>Сверка с оценкой (шаг 0):</b> ' + est.exp.map(function (x) { return x.t + ' ' + (x.f(sol.e) ? OK : BAD); }).join('; ') + '. Оценка ' + (est.exp.every(function (x) { return x.f(sol.e); }) ? 'подтвердилась ' + OK : 'не подтвердилась ' + BAD) + '</p>';
  }
  function col(t, b) { return '<details class="xcol" open><summary>' + t + '</summary><div class="xb">' + b + '</div></details>'; }
  return '<div class="cols3">' + col('1. Дано и чертёж', c1) + col('2. Решение', c2) + col('3. Тип треугольника и условия существования', c3) + '</div>';
}
function showColumns(host, g, res) {
  var st = { i: 0, ans: false, mode: { ang: '6.12', side: 'auto' } };
  function draw() {
    host.innerHTML = '<div class="hr"></div>' + buildColumns(g, res, st.i, st.ans, st.mode);
    var sa = host.querySelector('#xang'); if (sa) sa.onchange = function () { st.mode.ang = sa.value; draw(); };
    var ss = host.querySelector('#xside'); if (ss) ss.onchange = function () { st.mode.side = ss.value; draw(); };
    Array.prototype.forEach.call(host.querySelectorAll('.xtabs button'), function (b) { b.onclick = function () { st.i = +b.dataset.i; draw(); }; });
    var t = host.querySelector('#xans'); if (t) t.onchange = function () { st.ans = t.checked; draw(); };
  }
  draw();
}

/* ===================== Карточки по каждому искомому (ТЗ §3, §3.2, §3.3) ===================== */
/* Данные карточек — структурные объекты {column, type, what, formula, why, calc:[{type,text}], val}; вёрстка — renderElementCard. */
var WHY_CARD = {
  t1: 'По трём сторонам угол находится сразу и независимо от других искомых. ' + WHY['6.9t1'],
  t2: 'По трём углам сторона находится сразу (полярный аналог (6.9)), независимо от других искомых.',
  t3side69: 'Сторона против данного угла по двум данным сторонам и углу между ними — прямо (6.9); входят только данные элементы.',
  t3side614: 'Сторона или данный угол между сторонами мал (близок к 0°/180°): cos меняется медленно и (6.9) теряет точность, поэтому, как в примере 7.1в учебника (C = 22°06,2′), берём (6.14). ',
  t3nep: 'По умолчанию — аналогии Непера (6.12), как в примере 7.1в: оба угла через tg только по данным. Альтернатива — (6.11) котангенсы, как в примере 7.1а (переключатель сверху).',
  t3cot: 'Выбрана формула котангенсов (6.11), как в примере 7.1а: угол через tg, четверть однозначна, только данные элементы. Альтернатива — аналогии Непера (6.12).',
  t4nep: 'По табл. 6.1 и примеру 7.1б стороны — по вторым аналогиям Непера (6.13), только по данным. Альтернатива — (6.11).',
  t4cot: 'Выбрана формула котангенсов (6.11) для четырёх рядом лежащих элементов: сторона через tg, только данные. Альтернатива — аналогии Непера (6.13).',
  t4ang: 'Третий угол по двум углам и стороне между ними — косинус угла (6.10), только данные элементы.',
  t56sin: 'Пара «элемент — противолежащий» известна целиком, поэтому проще всего (6.8). Синус даёт два значения x и 180° − x — проверяем оба по (6.5)–(6.7).',
  t56rest: 'Для типов 5 и 6 по табл. 6.1 без элемента, найденного по синусу, не обойтись — это сказано прямо. Берём аналогию Непера (она даёт tg половины, четверть однозначна). Альтернатива по учебнику — (6.11).',
  neper: 'Правило Модюи — Непера: I — косинус среднего элемента равен произведению синусов несмежных; II — косинус среднего равен произведению котангенсов смежных. Выбираем ту тройку, где искомый и оба данных элемента.',
  quad: 'Для четвертного круг строится прямо (6.16): смежные со стороной 90° углы заменяются на 90° − B, 90° − C, противолежащий угол — на 180° − A. (Эквивалентно решению полярного прямоугольного треугольника, см. краткий ход.)'
};
function F_(sol) { return sol && sol.small ? fmt2 : fmt; }
function qCos(X, v, F, x) { return 'cos ' + X + ' ' + (v >= 0 ? '> 0 ⇒ ' + X + ' < 90°' : '< 0 ⇒ ' + X + ' > 90°') + ';   ' + X + ' = ' + F(x) + '.'; }
function qTg(X, v, F) {
  var x0 = atan(v);
  if (v >= 0) return { x: x0, t: 'tg ' + X + ' > 0 ⇒ ' + X + ' < 90°;   ' + X + ' = ' + F(x0) + '.' };
  return { x: x0 + 180, t: 'tg ' + X + ' = ' + n5(v) + ' < 0 ⇒ ' + X + ' = ' + F(x0) + ' + 180° = ' + F(x0 + 180) + '.' };
}
function C_(what, formula, why, calc, val, key) { return { column: 2, type: 'card', what: what, formula: formula, why: why, calc: calc, val: val, key: key }; }
function cf(t) { return { type: 'f', text: t }; }
function cp(t) { return { type: 'p', text: t }; }
function nm(k) { return (k === k.toLowerCase() ? 'Сторона ' : 'Угол ') + k; }
function other3(L, a, b) { return L.filter(function (k) { return k !== a && k !== b; })[0]; }

function obliqueCards(g, sol, res, mode) {
  var e = sol.e, F = F_(sol), T = xType(g), out = [];
  var sd = SIDES.filter(function (k) { return k in g; }), an = ANGS.filter(function (k) { return k in g; });
  if (T === 1 || T === 2) {
    var S = T === 1;
    (S ? ANGS : SIDES).forEach(function (X) {
      var x = X.toLowerCase() === X ? X.toUpperCase() : X.toLowerCase(); // противолежащий данный
      var L = S ? SIDES : ANGS, y = other3(L, x, null), z = L.filter(function (k) { return k !== x && k !== y; })[0];
      var num = S ? cos(g[x]) - cos(g[y]) * cos(g[z]) : cos(g[x]) + cos(g[y]) * cos(g[z]), den = sin(g[y]) * sin(g[z]), v = num / den, r = acos(v);
      out.push(C_(nm(X), S ? 'cos ' + X + ' = (cos ' + x + ' − cos ' + y + ' · cos ' + z + ') / (sin ' + y + ' · sin ' + z + ') (6.9) — косинус стороны'
        : 'cos ' + X + ' = (cos ' + x + ' + cos ' + y + ' · cos ' + z + ') / (sin ' + y + ' · sin ' + z + ') (6.10) — косинус угла', (S ? WHY['6.9'].why + ' ' + WHY_CARD.t1 : WHY['6.10'].why + ' ' + WHY_CARD.t2),
        [cf('cos ' + X + ' = (' + n5(cos(g[x])) + (S ? ' − ' : ' + ') + '(' + n5(cos(g[y])) + ') · (' + n5(cos(g[z])) + ')) / (' + n5(sin(g[y])) + ' · ' + n5(sin(g[z])) + ')'),
         cf('= ' + n5(num) + ' / ' + n5(den) + ' = ' + n5(v)), cf(qCos(X, v, F, e[X]))], r, X));
    });
    return out;
  }
  if (T === 3) {
    var s1 = sd[0], s2 = sd[1], G = an[0], m = G.toLowerCase(), O1 = s1.toUpperCase(), O2 = s2.toUpperCase();
    var x1 = g[s1], x2 = g[s2], gg = g[G];
    var use614 = mode.side === '6.14' || (mode.side !== '6.9' && (e[m] < 30 || e[m] > 150 || gg < 30 || gg > 150 || sol.small));
    if (use614) {
      var v14 = Math.pow(sin((x1 - x2) / 2), 2) + sin(x1) * sin(x2) * Math.pow(sin(gg / 2), 2), r14 = 2 * asin(Math.sqrt(v14));
      out.push(C_(nm(m), 'sin²(' + m + '/2) = sin²[(' + s1 + ' − ' + s2 + ')/2] + sin ' + s1 + ' · sin ' + s2 + ' · sin²(' + G + '/2) (6.14) — преобразованная формула косинуса стороны',
        WHY_CARD.t3side614 + WHY['6.14'].why + ' Альтернатива — (6.9).',
        [cf('(' + s1 + ' − ' + s2 + ')/2 = ' + F((x1 - x2) / 2) + ';   ' + G + '/2 = ' + F(gg / 2)),
         cf('sin²(' + m + '/2) = (' + n5(sin((x1 - x2) / 2)) + ')² + ' + n5(sin(x1)) + ' · ' + n5(sin(x2)) + ' · (' + n5(sin(gg / 2)) + ')² = ' + n5(v14)),
         cf('sin(' + m + '/2) = √' + n5(v14) + ' = ' + n5(Math.sqrt(v14)) + ';   ' + m + '/2 всегда в I четверти (0°…90°) ⇒ ' + m + '/2 = ' + F(r14 / 2)),
         cf(m + ' = ' + F(e[m]) + '.')], r14, m));
    } else {
      var v9 = cos(x1) * cos(x2) + sin(x1) * sin(x2) * cos(gg);
      out.push(C_(nm(m), 'cos ' + m + ' = cos ' + s1 + ' · cos ' + s2 + ' + sin ' + s1 + ' · sin ' + s2 + ' · cos ' + G + ' (6.9) — косинус стороны',
        WHY['6.9'].why + ' ' + WHY_CARD.t3side69 + ' Если сторона мала или близка к 0°/180°, берётся (6.14).',
        [cf('cos ' + m + ' = ' + n5(cos(x1)) + ' · ' + n5(cos(x2)) + ' + ' + n5(sin(x1)) + ' · ' + n5(sin(x2)) + ' · ' + n5(cos(gg)) + ' = ' + n5(v9)), cf(qCos(m, v9, F, e[m]))], acos(v9), m));
    }
    if (mode.ang === '6.11') {
      [[O1, s1, s2], [O2, s2, s1]].forEach(function (q) {
        var den = sin(g[q[2]]) * ctg(g[q[1]]) - cos(gg) * cos(g[q[2]]), v = sin(gg) / den, r = qTg(q[0], v, F);
        out.push(C_(nm(q[0]), 'tg ' + q[0] + ' = sin ' + G + ' / (sin ' + q[2] + ' · ctg ' + q[1] + ' − cos ' + G + ' · cos ' + q[2] + ') (6.11) — котангенсы',
          WHY['6.11'].why + ' ' + WHY_CARD.t3cot,
          [cf('tg ' + q[0] + ' = ' + n5(sin(gg)) + ' / (' + n5(sin(g[q[2]])) + ' · ' + n5(ctg(g[q[1]])) + ' − ' + n5(cos(gg)) + ' · ' + n5(cos(g[q[2]])) + ')'),
           cf('= ' + n5(sin(gg)) + ' / ' + n5(den) + ' = ' + n5(v)), cf(r.t)], r.x, q[0]));
      });
    } else {
      var np = napierPair(x1, x2, gg, true);
      var ts = cos((x1 - x2) / 2) / cos((x1 + x2) / 2) * ctg(gg / 2), td = sin((x1 - x2) / 2) / sin((x1 + x2) / 2) * ctg(gg / 2);
      var base = [cf('(' + s1 + ' + ' + s2 + ')/2 = ' + F((x1 + x2) / 2) + ';   (' + s1 + ' − ' + s2 + ')/2 = ' + F((x1 - x2) / 2) + ';   ' + G + '/2 = ' + F(gg / 2)),
        cf('tg[(' + O1 + ' + ' + O2 + ')/2] = ' + n5(cos((x1 - x2) / 2)) + ' / ' + n5(cos((x1 + x2) / 2)) + ' · ' + n5(ctg(gg / 2)) + ' = ' + n5(ts)),
        cf('tg[(' + O1 + ' − ' + O2 + ')/2] = ' + n5(sin((x1 - x2) / 2)) + ' / ' + n5(sin((x1 + x2) / 2)) + ' · ' + n5(ctg(gg / 2)) + ' = ' + n5(td)),
        cp(ts < 0 ? 'tg полусуммы < 0, а (' + s1 + ' + ' + s2 + ')/2 > 90° ⇒ по (6.5) и полусумма углов > 90°: (' + O1 + ' + ' + O2 + ')/2 = ' + F(atan(ts)) + ' + 180° = ' + F(np.hs) + '.'
          : 'tg полусуммы > 0 ⇒ (' + O1 + ' + ' + O2 + ')/2 = ' + F(np.hs) + ' < 90° (та же четверть, что у полусуммы сторон, (6.5)).'),
        cf('(' + O1 + ' − ' + O2 + ')/2 = ' + F(np.hd) + ' (полуразность всегда между −90° и 90°).')];
      var fN = 'tg[(' + O1 + ' ± ' + O2 + ')/2] = cos или sin[(' + s1 + ' − ' + s2 + ')/2] / cos или sin[(' + s1 + ' + ' + s2 + ')/2] · ctg(' + G + '/2) (6.12) — аналогии Непера';
      out.push(C_(nm(O1), fN, WHY['6.12'].why + ' ' + WHY_CARD.t3nep, base.concat([cf(O1 + ' = ' + joinAdd(np.hs, np.hd) + ' = ' + F(e[O1]) + '.')]), np.first, O1));
      out.push(C_(nm(O2), fN, 'Из той же пары аналогий, что и ' + O1 + ' (сложение «столбиком»): разность полусуммы и полуразности. ' + WHY_CARD.t3nep,
        [cf('(' + O1 + ' + ' + O2 + ')/2 = ' + F(np.hs) + ';   (' + O1 + ' − ' + O2 + ')/2 = ' + F(np.hd)), cf(O2 + ' = ' + joinAdd(np.hs, -np.hd) + ' = ' + F(e[O2]) + '.')], np.second, O2));
    }
    return out;
  }
  if (T === 4) {
    var A1 = an[0], A2 = an[1], c0 = sd[0], M = c0.toUpperCase(), l1 = A1.toLowerCase(), l2 = A2.toLowerCase();
    var g1 = g[A1], g2 = g[A2], cc = g[c0];
    if (mode.ang === '6.11') {
      [[l1, A1, A2], [l2, A2, A1]].forEach(function (q) {
        var den = cos(cc) * cos(g[q[2]]) + sin(g[q[2]]) * ctg(g[q[1]]), v = sin(cc) / den, r = qTg(q[0], v, F);
        out.push(C_(nm(q[0]), 'tg ' + q[0] + ' = sin ' + c0 + ' / (cos ' + c0 + ' · cos ' + q[2] + ' + sin ' + q[2] + ' · ctg ' + q[1] + ') (6.11) — котангенсы',
          WHY['6.11'].why + ' ' + WHY_CARD.t4cot,
          [cf('tg ' + q[0] + ' = ' + n5(sin(cc)) + ' / (' + n5(cos(cc)) + ' · ' + n5(cos(g[q[2]])) + ' + ' + n5(sin(g[q[2]])) + ' · ' + n5(ctg(g[q[1]])) + ')'),
           cf('= ' + n5(sin(cc)) + ' / ' + n5(den) + ' = ' + n5(v)), cf(r.t)], r.x, q[0]));
      });
    } else {
      var np2 = napierPair(g1, g2, cc, false);
      var ts2 = cos((g1 - g2) / 2) / cos((g1 + g2) / 2) * tg(cc / 2), td2 = sin((g1 - g2) / 2) / sin((g1 + g2) / 2) * tg(cc / 2);
      var b2 = [cf('(' + A1 + ' + ' + A2 + ')/2 = ' + F((g1 + g2) / 2) + ';   (' + A1 + ' − ' + A2 + ')/2 = ' + F((g1 - g2) / 2) + ';   ' + c0 + '/2 = ' + F(cc / 2)),
        cf('tg[(' + l1 + ' + ' + l2 + ')/2] = ' + n5(cos((g1 - g2) / 2)) + ' / ' + n5(cos((g1 + g2) / 2)) + ' · ' + n5(tg(cc / 2)) + ' = ' + n5(ts2)),
        cf('tg[(' + l1 + ' − ' + l2 + ')/2] = ' + n5(sin((g1 - g2) / 2)) + ' / ' + n5(sin((g1 + g2) / 2)) + ' · ' + n5(tg(cc / 2)) + ' = ' + n5(td2)),
        cp(ts2 < 0 ? 'tg полусуммы < 0, (' + A1 + ' + ' + A2 + ')/2 > 90° ⇒ по (6.5) полусумма сторон > 90°: ' + F(atan(ts2)) + ' + 180° = ' + F(np2.hs) + '.'
          : 'tg полусуммы > 0 ⇒ (' + l1 + ' + ' + l2 + ')/2 = ' + F(np2.hs) + ' < 90° (по (6.5) та же четверть, что у полусуммы углов).'),
        cf('(' + l1 + ' − ' + l2 + ')/2 = ' + F(np2.hd) + '.')];
      var fN2 = 'tg[(' + l1 + ' ± ' + l2 + ')/2] = cos или sin[(' + A1 + ' − ' + A2 + ')/2] / cos или sin[(' + A1 + ' + ' + A2 + ')/2] · tg(' + c0 + '/2) (6.13) — аналогии Непера';
      out.push(C_(nm(l1), fN2, WHY['6.13'].why + ' ' + WHY_CARD.t4nep, b2.concat([cf(l1 + ' = ' + joinAdd(np2.hs, np2.hd) + ' = ' + F(e[l1]) + '.')]), np2.first, l1));
      out.push(C_(nm(l2), fN2, 'Из той же пары аналогий, что и ' + l1 + ': полусумма минус полуразность. ' + WHY_CARD.t4nep,
        [cf('(' + l1 + ' + ' + l2 + ')/2 = ' + F(np2.hs) + ';   (' + l1 + ' − ' + l2 + ')/2 = ' + F(np2.hd)), cf(l2 + ' = ' + joinAdd(np2.hs, -np2.hd) + ' = ' + F(e[l2]) + '.')], np2.second, l2));
    }
    var v10 = -cos(g1) * cos(g2) + sin(g1) * sin(g2) * cos(cc);
    out.push(C_(nm(M), 'cos ' + M + ' = − cos ' + A1 + ' · cos ' + A2 + ' + sin ' + A1 + ' · sin ' + A2 + ' · cos ' + c0 + ' (6.10) — косинус угла', WHY['6.10'].why + ' ' + WHY_CARD.t4ang,
      [cf('cos ' + M + ' = − ' + '(' + n5(cos(g1)) + ') · (' + n5(cos(g2)) + ') + ' + n5(sin(g1)) + ' · ' + n5(sin(g2)) + ' · ' + n5(cos(cc)) + ' = ' + n5(v10)), cf(qCos(M, v10, F, e[M]))], acos(v10), M));
    return out;
  }
  // Типы 5 и 6
  var isT5 = T === 5, P, Q, K, opp, k2, rest, third, thirdOpp;
  if (isT5) { P = an[0]; opp = P.toLowerCase(); Q = sd.filter(function (k) { return k !== opp; })[0]; K = Q.toUpperCase(); }
  else { opp = sd[0]; P = opp.toUpperCase(); var Qa = an.filter(function (k) { return k !== P; })[0]; Q = Qa; K = Qa.toLowerCase(); }
  // T5: данные opp (сторона), Q (сторона), P (угол против opp); ищем K (угол против Q) по синусу.
  // T6: данные opp (сторона), P (угол против opp), Q (угол); ищем K (сторона против Q).
  var sK = sin(g[Q]) * sin(g[P]) / sin(g[opp]);
  var cand = candidates(g, T, res) || [];
  var calc = [cf('sin ' + K + ' = sin ' + Q + ' · sin ' + P + ' / sin ' + opp + ' = ' + n5(sin(g[Q])) + ' · ' + n5(sin(g[P])) + ' / ' + n5(sin(g[opp])) + ' = ' + n5(sK))];
  if (cand.length && Math.abs(sK - 1) > 1e-6) {
    calc.push(cf(K + '₁ = arcsin ' + n5(sK) + ' = ' + F(cand[0].x) + ';   ' + K + '₂ = 180° − ' + K + '₁ = ' + F(cand[1].x)));
    cand.forEach(function (c) {
      var mine = Math.abs(c.x - e[K]) < 1e-3;
      calc.push(cp(c.name + ' = ' + F(c.x) + ': ' + (c.ok ? (mine ? 'принят — проходит (6.5)–(6.7) ' + OK : 'тоже проходит — это другое решение (вкладка сверху)') : 'отброшен — ' + c.why + ' ' + BAD)));
    });
  } else calc.push(cp('sin ' + K + ' = 1 ⇒ ' + K + ' = 90° (единственное значение).'));
  calc.push(cf(K + ' = ' + F(e[K]) + '.'));
  out.push(C_(nm(K), 'sin ' + opp + ' / sin ' + P + ' = sin ' + Q + ' / sin ' + K + ' (6.8) — формула синусов', WHY['6.8'].why + ' ' + WHY_CARD.t56sin, calc, e[K], K));
  // третья сторона и третий угол по аналогиям Непера (как в движке)
  var sides2 = isT5 ? [opp, Q] : [opp, K], angs2 = isT5 ? [P, K] : [P, Q];
  var ms = other3(SIDES, sides2[0], sides2[1]), MA = ms.toUpperCase();
  var sa = e[sides2[0]], sb = e[sides2[1]], A_ = e[angs2[0]], B_ = e[angs2[1]];
  var useSin = Math.abs(sin((A_ - B_) / 2)) >= Math.abs(cos((A_ - B_) / 2));
  var t = useSin ? tg((sa - sb) / 2) * sin((A_ + B_) / 2) / sin((A_ - B_) / 2) : tg((sa + sb) / 2) * cos((A_ + B_) / 2) / cos((A_ - B_) / 2);
  var fs = useSin ? 'tg(' + ms + '/2) = tg[(' + sides2[0] + ' − ' + sides2[1] + ')/2] · sin[(' + angs2[0] + ' + ' + angs2[1] + ')/2] / sin[(' + angs2[0] + ' − ' + angs2[1] + ')/2]'
    : 'tg(' + ms + '/2) = tg[(' + sides2[0] + ' + ' + sides2[1] + ')/2] · cos[(' + angs2[0] + ' + ' + angs2[1] + ')/2] / cos[(' + angs2[0] + ' − ' + angs2[1] + ')/2]';
  out.push(C_(nm(ms), fs + ' (6.13) — аналогия Непера (обращённая)', WHY_CARD.t56rest + (useSin ? '' : ' Здесь ' + angs2[0] + ' ≈ ' + angs2[1] + ' (равнобедренный): sin[(' + angs2[0] + ' − ' + angs2[1] + ')/2] = 0, поэтому берём вторую аналогию.'),
    [cf('tg(' + ms + '/2) = ' + (useSin ? n5(tg((sa - sb) / 2)) + ' · ' + n5(sin((A_ + B_) / 2)) + ' / ' + n5(sin((A_ - B_) / 2)) : n5(tg((sa + sb) / 2)) + ' · ' + n5(cos((A_ + B_) / 2)) + ' / ' + n5(cos((A_ - B_) / 2))) + ' = ' + n5(t)),
     cp(ms + '/2 лежит в 0°…90°, tg > 0 ⇒ ' + ms + '/2 = ' + F(atan(t))), cf(ms + ' = ' + F(e[ms]) + '.')], 2 * atan(t), ms));
  var cot = tg((A_ + B_) / 2) * cos((sa + sb) / 2) / cos((sa - sb) / 2), rC = 2 * Math.atan2(1, cot) / D;
  out.push(C_(nm(MA), 'ctg(' + MA + '/2) = tg[(' + angs2[0] + ' + ' + angs2[1] + ')/2] · cos[(' + sides2[0] + ' + ' + sides2[1] + ')/2] / cos[(' + sides2[0] + ' − ' + sides2[1] + ')/2] (6.12) — аналогия Непера (обращённая)',
    WHY_CARD.t56rest,
    [cf('ctg(' + MA + '/2) = ' + n5(tg((A_ + B_) / 2)) + ' · ' + n5(cos((sa + sb) / 2)) + ' / ' + n5(cos((sa - sb) / 2)) + ' = ' + n5(cot)),
     cp(MA + '/2 лежит в 0°…90° ⇒ ' + MA + '/2 = ' + F(rC / 2)), cf(MA + ' = ' + F(e[MA]) + '.')], rC, MA));
  return out;
}

/* ---- Круг Модюи — Непера: общий решатель для прямоугольного и четвертного ---- */
function neperParts(info) {
  // порядок по кругу; kind: 'c90' — 90° − x, 'c180' — 180° − x, 'id' — сам элемент
  if (info.right) { var m = info.m; return [[m.c, 'c90'], [m.B, 'id'], [m.a, 'id'], [m.C, 'id'], [m.b, 'c90']]; }
  var q = info.qm; return [[q.C, 'c90'], [q.b, 'id'], [q.A, 'c180'], [q.c, 'id'], [q.B, 'c90']];
}
function partName(p) { return p[1] === 'c90' ? '(90° − ' + p[0] + ')' : p[1] === 'c180' ? '(180° − ' + p[0] + ')' : p[0]; }
// упрощение: внешняя функция fn от части → {s: знак, fn, el}
function simp(fn, p) {
  if (p[1] === 'id') return { s: 1, fn: fn, el: p[0] };
  if (p[1] === 'c90') return { s: 1, fn: { sin: 'cos', cos: 'sin', ctg: 'tg', tg: 'ctg' }[fn], el: p[0] };
  return { s: fn === 'sin' ? 1 : -1, fn: fn, el: p[0] };
}
function fv(fn, x) { return { sin: sin, cos: cos, tg: tg, ctg: ctg }[fn](x); }
function termS(t) { return t.fn + ' ' + t.el; }
function neperCards(g, sol, info) {
  var e = sol.e, F = F_(sol), P = neperParts(info), out = [];
  var known = P.filter(function (p) { return p[0] in g; }).map(function (p) { return p[0]; });
  var idx = function (k) { for (var i = 0; i < 5; i++) if (P[i][0] === k) return i; return -1; };
  var num = '(6.' + (info.right ? 15 : 16) + ')';
  P.forEach(function (p) {
    var X = p[0]; if (X in g) return;
    var ids = [idx(X), idx(known[0]), idx(known[1])];
    if (ids.some(function (i) { return i < 0; })) return;
    // ищем средний: элемент, у которого два других — оба смежные (II) или оба несмежные (I)
    var mid = null, rule = null;
    ids.forEach(function (i) {
      var o = ids.filter(function (j) { return j !== i; });
      var adj = o.map(function (j) { var d = Math.abs(i - j); return d === 1 || d === 4; });
      if (adj[0] && adj[1]) { mid = i; rule = 'II'; } else if (!adj[0] && !adj[1] && mid === null) { mid = i; rule = 'I'; }
    });
    var oth = ids.filter(function (j) { return j !== mid; });
    var ofn = rule === 'II' ? 'ctg' : 'sin';
    var Lt = simp('cos', P[mid]), R1 = simp(ofn, P[oth[0]]), R2 = simp(ofn, P[oth[1]]);
    var raw = 'cos ' + partName(P[mid]) + ' = ' + ofn + ' ' + partName(P[oth[0]]) + ' · ' + ofn + ' ' + partName(P[oth[1]]);
    var sg = Lt.s * R1.s * R2.s; // L = sg · R1·R2 в упрощённом виде (знаки вынесены)
    var simpl = termS(Lt) + ' = ' + (sg < 0 ? '− ' : '') + termS(R1) + ' · ' + termS(R2);
    var calc = [], v, fnX, expr;
    var val = function (t) { return fv(t.fn, g[t.el]); };
    if (P[mid][0] === X) {
      fnX = Lt.fn; v = sg * val(R1) * val(R2);
      expr = fnX + ' ' + X + ' = ' + (sg < 0 ? '− ' : '') + termS(R1) + ' · ' + termS(R2);
      calc.push(cf(fnX + ' ' + X + ' = ' + (sg < 0 ? '− ' : '') + '(' + n5(val(R1)) + ') · (' + n5(val(R2)) + ') = ' + n5(v)));
    } else {
      var RX = R1.el === X ? R1 : R2, Ro = R1.el === X ? R2 : R1;
      fnX = RX.fn; v = sg * fv(Lt.fn, g[Lt.el]) / val(Ro);
      if (fnX === 'ctg') { fnX = 'tg'; v = 1 / v; expr = 'tg ' + X + ' = ' + (sg < 0 ? '− ' : '') + termS(Ro) + ' / ' + termS(Lt); calc.push(cf(expr.replace(termS(Ro), '(' + n5(val(Ro)) + ')').replace(termS(Lt), '(' + n5(fv(Lt.fn, g[Lt.el])) + ')') + ' = ' + n5(v))); }
      else { expr = fnX + ' ' + X + ' = ' + (sg < 0 ? '− ' : '') + termS(Lt) + ' / ' + termS(Ro); calc.push(cf(fnX + ' ' + X + ' = ' + (sg < 0 ? '− ' : '') + '(' + n5(fv(Lt.fn, g[Lt.el])) + ') / (' + n5(val(Ro)) + ') = ' + n5(v))); }
    }
    var r;
    if (fnX === 'cos') { r = acos(v); calc.push(cf(qCos(X, v, F, e[X]))); }
    else if (fnX === 'tg') { var qq = qTg(X, v, F); r = qq.x; calc.push(cf(qq.t)); }
    else if (fnX === 'ctg') { var q2 = qTg(X, 1 / v, F); r = q2.x; calc.push(cf('tg ' + X + ' = 1 / ' + n5(v) + ' = ' + n5(1 / v))); calc.push(cf(q2.t)); }
    else { // sin — два кандидата
      var x1 = asin(v), x2 = 180 - x1; r = Math.abs(x1 - e[X]) < Math.abs(x2 - e[X]) ? x1 : x2;
      if (Math.abs(v - 1) < 1e-6) calc.push(cp('sin ' + X + ' = 1 ⇒ ' + X + ' = 90°.'));
      else {
        calc.push(cf(X + '₁ = ' + F(x1) + ';   ' + X + '₂ = 180° − ' + X + '₁ = ' + F(x2)));
        var multi = sol.multi;
        calc.push(cp(multi ? 'Оба значения возможны (данные — катет и противолежащий угол): в этом решении ' + X + ' = ' + F(e[X]) + ', другое — на соседней вкладке.'
          : 'Выбор по п. 9 и (6.5)–(6.7): ' + X + ' = ' + F(r) + ' согласуется с остальными элементами; ' + X + (r === x1 ? '₂ = ' + F(x2) : '₁ = ' + F(x1)) + ' отброшен — с ним нарушается п. 9 (элемент и противолежащий — в одной четверти) или (6.7).'));
      }
    }
    if (fnX === 'sin') calc.push(cf(X + ' = ' + F(e[X]) + '.'));
    var adjL = [(idx(X) + 1) % 5, (idx(X) + 4) % 5].map(function (i) { return partName(P[i]); }), nadjL = [(idx(X) + 2) % 5, (idx(X) + 3) % 5].map(function (i) { return partName(P[i]); });
    out.push(C_(nm(X), 'Правило ' + rule + ': ' + raw + ' ⇒ ' + simpl + (expr !== simpl ? ' ⇒ ' + expr : '') + ' ' + num,
      'В круге у ' + partName(P[idx(X)]) + ' смежные: ' + adjL.join(', ') + '; несмежные: ' + nadjL.join(', ') + '. Средний элемент тройки (искомый + два данных) — ' + partName(P[mid]) + ', остальные ему ' + (rule === 'II' ? 'смежные ⇒ правило II (котангенсы смежных)' : 'несмежные ⇒ правило I (синусы несмежных)') + '. В формулу входят только данные. ' + (info.right ? '' : WHY_CARD.quad),
      calc, r, X));
  });
  return out;
}
function neperRulesHtml(info) {
  var P = neperParts(info);
  return '<div class="f">По кругу: ' + P.map(partName).join(' → ') + ' → (снова) ' + partName(P[0]) + '</div>' +
    '<p>I: косинус среднего = произведению синусов несмежных. II: косинус среднего = произведению котангенсов смежных.</p>' +
    P.map(function (p, i) {
      var a1 = P[(i + 1) % 5], a2 = P[(i + 4) % 5], n1 = P[(i + 2) % 5], n2 = P[(i + 3) % 5];
      return '<div class="f">cos ' + partName(p) + ' = sin ' + partName(n1) + ' · sin ' + partName(n2) + ' = ctg ' + partName(a1) + ' · ctg ' + partName(a2) + '</div>';
    }).join('');
}
function buildElementCards(g, sol, res, mode) {
  var info = rightInfo(g);
  if (info.right || info.quad) return neperCards(g, sol, info);
  return obliqueCards(g, sol, res, mode || { ang: '6.12', side: 'auto' });
}
function renderElementCard(c, i) {
  return '<div class="xcard ecard"><div class="xh">2.' + (i + 1) + '. ' + c.what + '</div>' +
    '<div class="erow"><b>Что ищем:</b> ' + c.what + '</div>' +
    '<div class="erow"><b>Формула:</b> <span class="f">' + c.formula + '</span></div>' +
    '<div class="erow why"><b>Почему она:</b> ' + c.why + '</div>' +
    '<div class="erow"><b>Подстановка и счёт:</b>' + c.calc.map(function (s) { return '<div class="' + s.type + '">' + s.text + '</div>'; }).join('') + '</div></div>';
}

if (typeof module !== 'undefined' && module.exports) module.exports = { buildColumns: buildColumns, sineCheck: sineCheck, buildElementCards: buildElementCards };

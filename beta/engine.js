'use strict';
var D = Math.PI / 180;
var NAMES = ['a', 'b', 'c', 'A', 'B', 'C'];
var SIDES = ['a', 'b', 'c'];
var ANGS = ['A', 'B', 'C'];

function clamp(x) { return Math.max(-1, Math.min(1, x)); }
function sin(x) { return Math.sin(x * D); }
function cos(x) { return Math.cos(x * D); }
function tg(x) { return Math.tan(x * D); }
function ctg(x) { return 1 / Math.tan(x * D); }
function acos(x) { return Math.acos(clamp(x)) / D; }
function asin(x) { return Math.asin(clamp(x)) / D; }
function atan(x) { return Math.atan(x) / D; }
function n180(x) { return x < 0 ? x + 180 : x; }

function fmt(x) {
  if (x === null || x === undefined || !isFinite(x)) return '—';
  var neg = x < 0; x = Math.abs(x);
  var t = Math.round(x * 600);
  var d = Math.floor(t / 600), m = (t - 600 * d) / 10;
  return (neg ? '−' : '') + d + '°' + (m < 10 ? '0' : '') + m.toFixed(1).replace('.', ',') + '′';
}
function fmt2(x) {
  if (!isFinite(x)) return '—';
  var neg = x < 0; x = Math.abs(x);
  var t = Math.round(x * 6000);
  var d = Math.floor(t / 6000), m = (t - 6000 * d) / 100;
  return (neg ? '−' : '') + d + '°' + (m < 10 ? '0' : '') + m.toFixed(2).replace('.', ',') + '′';
}
function n5(x) {
  if (!isFinite(x) || Math.abs(x) > 1e6) return '—';
  return x.toFixed(5).replace('.', ',').replace('-', '−');
}
function showNum(sol, k) { return (sol.small ? fmt2 : fmt)(sol.e[k]); }

function fromSides(a, b, c) {
  return {
    a: a, b: b, c: c,
    A: acos((cos(a) - cos(b) * cos(c)) / (sin(b) * sin(c))),
    B: acos((cos(b) - cos(a) * cos(c)) / (sin(a) * sin(c))),
    C: acos((cos(c) - cos(a) * cos(b)) / (sin(a) * sin(b)))
  };
}
function fromAngles(A, B, C) {
  var p = fromSides(180 - A, 180 - B, 180 - C);
  return { a: 180 - p.A, b: 180 - p.B, c: 180 - p.C, A: A, B: B, C: C };
}
function sidesOk(a, b, c, m) {
  m = m || 0;
  return Math.min(a, b, c) > m && Math.max(a, b, c) < 180 - m &&
    a + b > c + m && a + c > b + m && b + c > a + m && a + b + c < 360 - m;
}
function anglesOk(A, B, C, m) {
  m = m || 0;
  return Math.min(A, B, C) > m && Math.max(A, B, C) < 180 - m &&
    A + B + C > 180 + m && A + B + C < 540 - m &&
    A + B < C + 180 - m && A + C < B + 180 - m && B + C < A + 180 - m;
}
function triangleKind(e) {
  var EPS = 0.02;
  var right = ANGS.some(function (k) { return Math.abs(e[k] - 90) < EPS; });
  var quad = SIDES.some(function (k) { return Math.abs(e[k] - 90) < EPS; });
  var kind = right && quad ? 'both' : right ? 'right' : quad ? 'quad' : 'oblique';
  return { kind: kind, small: Math.max(e.a, e.b, e.c) <= 6.001 };
}
function kindText(sol) {
  var map = {
    oblique: 'косоугольный',
    right: 'прямоугольный',
    quad: 'четвертной',
    both: 'прямоугольный и четвертной'
  };
  var t = map[sol.kind] || sol.kind;
  if (sol.small) t += '; стороны не больше 6° — допустимо и плоское решение';
  return t;
}

function Steps() { this.items = []; }
Steps.prototype.h = function (s) { this.items.push({ t: 'h', s: s }); return this; };
Steps.prototype.p = function (s) { this.items.push({ t: 'p', s: s }); return this; };
Steps.prototype.w = function (s) { this.items.push({ t: 'w', s: s }); return this; };
Steps.prototype.f = function (s) { this.items.push({ t: 'f', s: s }); return this; };
Steps.prototype.r = function (s) { this.items.push({ t: 'r', s: s }); return this; };

function permTo(R) {
  var V = ['A', 'B', 'C'], i = V.indexOf(R);
  var o1 = V[(i + 1) % 3], o2 = V[(i + 2) % 3];
  return { A: R, B: o1, C: o2, a: R.toLowerCase(), b: o1.toLowerCase(), c: o2.toLowerCase() };
}
function invPerm(m) {
  var r = {};
  Object.keys(m).forEach(function (k) { r[m[k]] = k; });
  return r;
}
function applyPerm(e, inv) {
  var r = {};
  NAMES.forEach(function (k) { r[k] = e[inv[k]]; });
  return r;
}
function dedupe(list) {
  var out = [];
  list.forEach(function (e) {
    var same = out.some(function (u) {
      return NAMES.every(function (k) { return Math.abs(u[k] - e[k]) < 1e-5; });
    });
    if (!same) out.push(e);
  });
  return out;
}
function hasNan(e) {
  return NAMES.some(function (k) { return !isFinite(e[k]) || e[k] <= 0 || e[k] >= 180; });
}

function finishRight(b, c) {
  if (!(b > 0.02 && b < 179.98 && c > 0.02 && c < 179.98)) return null;
  var a = acos(cos(b) * cos(c));
  if (!sidesOk(a, b, c, 0.0001)) return null;
  var e = fromSides(a, b, c);
  e.A = 90; e.a = a; e.b = b; e.c = c;
  if (hasNan(e)) return null;
  return e;
}
function matches(e, spec) {
  var ks = Object.keys(spec);
  for (var i = 0; i < ks.length; i++) {
    if (Math.abs(e[ks[i]] - spec[ks[i]]) > 0.05) return false;
  }
  return true;
}

function rightPair(spec, words) {
  words = words || {
    leg: 'Катет и противолежащий угол',
    sin: 'синус катета больше синуса противолежащего угла',
    both: 'Катет и противолежащий угол равны 90°: треугольник не определяется однозначно.'
  };
  var ks = Object.keys(spec).filter(function (k) { return k !== 'A'; });
  if (ks.length !== 2) return { error: 'Для прямоугольного треугольника нужны прямой угол и ещё два элемента.' };
  var key = ks.slice().sort().join(',');
  var list = [];
  function take(b, c) {
    var e = finishRight(b, c);
    if (!e || !matches(e, spec)) return;
    list.push(e);
  }
  function val(k) { return spec[k]; }

  if (key === 'b,c') take(val('b'), val('c'));
  else if (key === 'a,b' || key === 'a,c') {
    var hyp = val('a'), leg = val(key === 'a,b' ? 'b' : 'c');
    if (Math.abs(cos(leg)) < 1e-10) return { error: 'Треугольник с такими элементами не существует.' };
    var t = cos(hyp) / cos(leg);
    if (Math.abs(t) > 1) return { error: 'Треугольник с такими элементами не существует.' };
    if (key === 'a,b') take(leg, acos(t)); else take(acos(t), leg);
  } else if (key === 'B,a' || key === 'C,a') {
    var a3 = val('a'), ang = val(key === 'B,a' ? 'B' : 'C');
    var side = n180(atan(cos(ang) * tg(a3)));
    if (Math.abs(cos(side)) < 1e-12) return { error: 'Треугольник с такими элементами не существует.' };
    var tb = cos(a3) / cos(side);
    if (Math.abs(tb) > 1) return { error: 'Треугольник с такими элементами не существует.' };
    if (key === 'B,a') take(acos(tb), side); else take(side, acos(tb));
  } else if (key === 'C,b' || key === 'B,c') {
    var knownLeg = val(key === 'C,b' ? 'b' : 'c');
    var knownAng = val(key === 'C,b' ? 'C' : 'B');
    var other = n180(atan(sin(knownLeg) * tg(knownAng)));
    if (key === 'C,b') take(knownLeg, other); else take(other, knownLeg);
  } else if (key === 'B,C') {
    var B7 = val('B'), C7 = val('C');
    if (Math.abs(sin(B7)) < 1e-10 || Math.abs(sin(C7)) < 1e-10) return { error: 'Треугольник с такими элементами не существует.' };
    var cb = cos(B7) / sin(C7), cc = cos(C7) / sin(B7);
    if (Math.abs(cb) > 1 || Math.abs(cc) > 1) return { error: 'Треугольник с такими элементами не существует.' };
    take(acos(cb), acos(cc));
  } else if (key === 'B,b' || key === 'C,c') {
    var legK = key === 'B,b' ? 'b' : 'c';
    var angK = key === 'B,b' ? 'B' : 'C';
    var legV = val(legK), angV = val(angK);
    if ((legV - 90) * (angV - 90) < -1e-6)
      return { error: words.leg + ' лежат в разных четвертях: треугольника нет.' };
    if (sin(legV) > sin(angV) + 1e-7)
      return { error: 'Треугольник не существует: ' + words.sin + '.' };
    if (Math.abs(legV - 90) < 1e-3 && Math.abs(angV - 90) < 1e-3)
      return { error: words.both };
    var s = sin(legV) / sin(angV);
    var as = s >= 1 - 1e-13 ? [90] : [asin(s), 180 - asin(s)];
    as.forEach(function (a) {
      if (Math.abs(cos(legV)) < 1e-12) return;
      var tc = cos(a) / cos(legV);
      if (Math.abs(tc) > 1) return;
      var other = acos(tc);
      if (legK === 'b') take(legV, other); else take(other, legV);
    });
  } else return { error: 'Такая пара элементов не разобрана.' };

  list = dedupe(list).sort(function (p, q) { return p.a - q.a; });
  if (!list.length) return { error: 'Треугольник с такими элементами не существует: проверьте исходные данные.' };
  return { list: list, key: key };
}

function lin(st, formula, expr, name, val) {
  if (expr === null || !isFinite(expr) || Math.abs(expr) > 1e5) st.f(formula + ';   ' + name + ' = ' + fmt(val));
  else st.f(formula + ' = ' + n5(expr) + ';   ' + name + ' = ' + fmt(val));
}

function stepsRightBody(st, L, key, ce, multi) {
  if (multi && (key === 'B,b' || key === 'C,c'))
    st.p('Ниже — одно из двух решений, с гипотенузой ' + L.a + ' = ' + fmt(ce.a) + '.');

  if (key === 'b,c') {
    st.p('Два катета. Правило I даёт гипотенузу, правило II — углы при катетах.');
    lin(st, 'cos ' + L.a + ' = cos ' + L.b + ' · cos ' + L.c + ' = ' + n5(cos(ce.b)) + ' · ' + n5(cos(ce.c)), cos(ce.b) * cos(ce.c), L.a, ce.a);
    lin(st, 'cos ' + L.B + ' = ctg ' + L.a + ' · tg ' + L.c, ctg(ce.a) * tg(ce.c), L.B, ce.B);
    lin(st, 'cos ' + L.C + ' = ctg ' + L.a + ' · tg ' + L.b, ctg(ce.a) * tg(ce.b), L.C, ce.C);
  } else if (key === 'a,b' || key === 'a,c') {
    var leg = key === 'a,b' ? 'b' : 'c';
    var oth = leg === 'b' ? 'c' : 'b';
    var oAng = leg === 'b' ? 'C' : 'B';
    var lAng = leg === 'b' ? 'B' : 'C';
    st.p('Гипотенуза и катет. Второй катет — из теоремы Пифагора.');
    lin(st, 'cos ' + L[oth] + ' = cos ' + L.a + ' / cos ' + L[leg], cos(ce.a) / cos(ce[leg]), L[oth], ce[oth]);
    lin(st, 'cos ' + L[lAng] + ' = ctg ' + L.a + ' · tg ' + L[oth], ctg(ce.a) * tg(ce[oth]), L[lAng], ce[lAng]);
    lin(st, 'cos ' + L[oAng] + ' = ctg ' + L.a + ' · tg ' + L[leg], ctg(ce.a) * tg(ce[leg]), L[oAng], ce[oAng]);
  } else if (key === 'B,a' || key === 'C,a') {
    var ang = key === 'B,a' ? 'B' : 'C';
    var near = key === 'B,a' ? 'c' : 'b';
    var far = key === 'B,a' ? 'b' : 'c';
    var farA = key === 'B,a' ? 'C' : 'B';
    st.p('Гипотенуза и острый угол. Правило II: cos ' + L[ang] + ' = ctg ' + L.a + ' · tg ' + L[near] + '.');
    lin(st, 'tg ' + L[near] + ' = cos ' + L[ang] + ' · tg ' + L.a, cos(ce[ang]) * tg(ce.a), L[near], ce[near]);
    lin(st, 'cos ' + L[far] + ' = cos ' + L.a + ' / cos ' + L[near], cos(ce.a) / cos(ce[near]), L[far], ce[far]);
    lin(st, 'cos ' + L[farA] + ' = ctg ' + L.a + ' · tg ' + L[far], ctg(ce.a) * tg(ce[far]), L[farA], ce[farA]);
  } else if (key === 'C,b' || key === 'B,c') {
    var lg = key === 'C,b' ? 'b' : 'c';
    var ag = key === 'C,b' ? 'C' : 'B';
    var ot = lg === 'b' ? 'c' : 'b';
    var oa = lg === 'b' ? 'B' : 'C';
    st.p('Катет и прилежащий угол. Из sin ' + L[lg] + ' = ctg ' + L[ag] + ' · tg ' + L[ot] + '.');
    lin(st, 'tg ' + L[ot] + ' = sin ' + L[lg] + ' · tg ' + L[ag], sin(ce[lg]) * tg(ce[ag]), L[ot], ce[ot]);
    lin(st, 'cos ' + L.a + ' = cos ' + L.b + ' · cos ' + L.c, cos(ce.b) * cos(ce.c), L.a, ce.a);
    lin(st, 'cos ' + L[oa] + ' = ctg ' + L.a + ' · tg ' + L[ot], ctg(ce.a) * tg(ce[ot]), L[oa], ce[oa]);
  } else if (key === 'B,C') {
    st.p('Два угла при катетах. Из cos B = sin C · cos b и cos C = sin B · cos c.');
    lin(st, 'cos ' + L.b + ' = cos ' + L.B + ' / sin ' + L.C, cos(ce.B) / sin(ce.C), L.b, ce.b);
    lin(st, 'cos ' + L.c + ' = cos ' + L.C + ' / sin ' + L.B, cos(ce.C) / sin(ce.B), L.c, ce.c);
    lin(st, 'cos ' + L.a + ' = cos ' + L.b + ' · cos ' + L.c, cos(ce.b) * cos(ce.c), L.a, ce.a);
  } else if (key === 'B,b' || key === 'C,c') {
    var leg = key === 'B,b' ? 'b' : 'c';
    var ang = key === 'B,b' ? 'B' : 'C';
    var other = leg === 'b' ? 'c' : 'b';
    var otherA = leg === 'b' ? 'C' : 'B';
    var s = sin(ce[leg]) / sin(ce[ang]);
    var a1 = asin(Math.min(1, Math.max(0, s)));
    st.p('Катет и противолежащий угол. Синус гипотенузы один, сама гипотенуза — нет.');
    st.f('sin ' + L.a + ' = sin ' + L[leg] + ' / sin ' + L[ang] + ' = ' + n5(s) + '.');
    if (Math.abs(s - 1) < 1e-6) st.p('Синус равен 1, поэтому ' + L.a + ' = 90°.');
    else {
      st.f(L.a + '₁ = ' + fmt(a1) + ';   ' + L.a + '₂ = ' + fmt(180 - a1) + '.');
      st.p(multi
        ? 'Оба значения дают треугольник. Здесь взято ' + L.a + ' = ' + fmt(ce.a) + '.'
        : 'Условиям существования отвечает ' + L.a + ' = ' + fmt(ce.a) + '.');
    }
    lin(st, 'cos ' + L[other] + ' = cos ' + L.a + ' / cos ' + L[leg], cos(ce.a) / cos(ce[leg]), L[other], ce[other]);
    var prod = ctg(ce.a) * tg(ce[leg]);
    if (isFinite(prod) && Math.abs(prod - cos(ce[otherA])) < 0.002)
      lin(st, 'cos ' + L[otherA] + ' = ctg ' + L.a + ' · tg ' + L[leg], prod, L[otherA], ce[otherA]);
    else
      st.f('cos ' + L[otherA] + ' = ctg ' + L.a + ' · tg ' + L[leg] + ';   ' + L[otherA] + ' = ' + fmt(ce[otherA]) + '.');
  }
  st.p('Знак косинуса даёт четверть: плюс — меньше 90°, минус — больше.');
}

function sineControl(st, e) {
  var r1 = sin(e.a) / sin(e.A), r2 = sin(e.b) / sin(e.B), r3 = sin(e.c) / sin(e.C);
  var d = Math.max(Math.abs(r1 - r2), Math.abs(r1 - r3), Math.abs(r2 - r3));
  st.h('Контроль по формуле синусов');
  st.f('sin a / sin A = ' + n5(r1) + ';   sin b / sin B = ' + n5(r2) + ';   sin c / sin C = ' + n5(r3) + '.');
  if (d < 5e-5) st.p('Три отношения совпали до пяти знаков после запятой.');
  else st.p('Наибольшее расхождение отношений — ' + d.toFixed(5).replace('.', ',') + '.');
}

function planeSolve(given) {
  var sd = SIDES.filter(function (k) { return k in given; });
  var an = ANGS.filter(function (k) { return k in given; });
  var p = {};
  Object.keys(given).forEach(function (k) { p[k] = given[k]; });
  function byCosineSides() {
    var ok = true;
    ANGS.forEach(function (X) {
      var o = X.toLowerCase();
      var r = SIDES.filter(function (s) { return s !== o; });
      var cs = (p[r[0]] * p[r[0]] + p[r[1]] * p[r[1]] - p[o] * p[o]) / (2 * p[r[0]] * p[r[1]]);
      if (Math.abs(cs) > 1) ok = false;
      else p[X] = Math.acos(clamp(cs)) / D;
    });
    return ok;
  }
  if (an.length === 2 && sd.length === 1) {
    var miss = ANGS.filter(function (k) { return !(k in p); })[0];
    p[miss] = 180 - p[an[0]] - p[an[1]];
    if (p[miss] <= 0.01) return null;
    var K = p[sd[0]] / Math.sin(p[sd[0].toUpperCase()] * D);
    SIDES.forEach(function (s) { if (!(s in p)) p[s] = K * Math.sin(p[s.toUpperCase()] * D); });
    return p;
  }
  if (sd.length === 3) {
    if (!byCosineSides()) return null;
    return p;
  }
  if (sd.length === 2 && an.length === 1) {
    var missS = SIDES.filter(function (s) { return !(s in p); })[0];
    if (an[0].toLowerCase() === missS) {
      var side2 = p[sd[0]] * p[sd[0]] + p[sd[1]] * p[sd[1]] - 2 * p[sd[0]] * p[sd[1]] * cos(p[an[0]]);
      if (side2 <= 0) return null;
      p[missS] = Math.sqrt(side2);
      if (!byCosineSides()) return null;
      p[an[0]] = given[an[0]];
      return p;
    }
    var opp = an[0].toLowerCase(), oth = sd[0] === opp ? sd[1] : sd[0];
    var K3 = p[opp] / sin(p[an[0]]);
    var q2 = p[oth] / K3;
    if (Math.abs(q2) > 1) return null;
    var Bang = asin(q2);
    if (p[oth] > p[opp] + 1e-9 && Bang + 1e-6 < p[an[0]] && 180 - Bang + p[an[0]] < 179.9) Bang = 180 - Bang;
    p[oth.toUpperCase()] = Bang;
    var m3 = ANGS.filter(function (X) { return !(X in p); })[0];
    p[m3] = 180 - p[an[0]] - Bang;
    if (p[m3] <= 0.01) return null;
    p[m3.toLowerCase()] = K3 * sin(p[m3]);
    return p;
  }
  return null;
}

function smallNote(given, e, st, plane) {
  st.h('Плоское решение');
  st.p('Все стороны не больше 6°, поэтому рядом с точным решением считают плоский треугольник с теми же данными. Сумма его углов 180°. Источник расхождения — избыток ε.');
  if (!plane) {
    st.p('По этим данным плоский треугольник не строится.');
    return;
  }
  var unknown = NAMES.filter(function (k) { return !(k in given); });
  st.f('Плоское:   ' + unknown.map(function (k) { return k + ' = ' + fmt2(plane[k]); }).join(';   ') + '.');
  st.f('Точное:   ' + unknown.map(function (k) { return k + ' = ' + fmt2(e[k]); }).join(';   ') + '.');
  st.f('Расхождение:   ' + unknown.map(function (k) {
    return 'Δ' + k + ' = ' + ((e[k] - plane[k]) * 60).toFixed(2).replace('.', ',').replace('-', '−') + '′';
  }).join(';   ') + '.');
  st.f('ε = A + B + C − 180° = ' + ((e.A + e.B + e.C - 180) * 60).toFixed(2).replace('.', ',') + '′.');
}

function finishSolution(e, st, given) {
  var meta = triangleKind(e);
  var gaveRight = ANGS.some(function (k) { return (k in given) && Math.abs(given[k] - 90) < 1e-3; });
  var gaveQuad = SIDES.some(function (k) { return (k in given) && Math.abs(given[k] - 90) < 1e-3; });
  if (meta.kind === 'right' && !gaveRight)
    st.p('Один из углов получился 90°, хотя в данных прямого угла не было: треугольник прямоугольный.');
  if ((meta.kind === 'quad' || meta.kind === 'both') && !gaveQuad)
    st.p('Одна из сторон получилась 90°, хотя в данных её не было: треугольник четвертной.');
  var plane = meta.small ? planeSolve(given) : null;
  if (meta.small) smallNote(given, e, st, plane);
  sineControl(st, e);
  var unknown = NAMES.filter(function (k) { return !(k in given); });
  var fmtv = meta.small ? fmt2 : fmt;
  st.h('Ответ');
  st.r(unknown.map(function (k) { return k + ' = ' + fmtv(e[k]); }).join(';   ') + '.');
  return { e: e, kind: meta.kind, small: meta.small, steps: st.items, unknown: unknown, plane: plane };
}

function solveRight(given, vertex) {
  var m = permTo(vertex), inv = invPerm(m), can = {};
  Object.keys(given).forEach(function (k) {
    if (k !== vertex) can[inv[k]] = given[k];
  });
  var solved = rightPair(can);
  if (solved.error) return solved;
  var L = m;
  var solutions = solved.list.map(function (ce) {
    var e = applyPerm(ce, inv);
    Object.keys(given).forEach(function (k) { e[k] = given[k]; });
    e[vertex] = 90;
    var st = new Steps();
    st.h('1. Вид треугольника');
    st.p('Угол ' + vertex + ' = 90°: треугольник прямоугольный. Гипотенуза — ' + L.a + ', катеты — ' + L.b + ' и ' + L.c + ', углы при катетах — ' + L.B + ' и ' + L.C + '.');
    st.h('2. Круг Непера');
    st.p('Порядок: (90° − ' + L.c + '), ' + L.B + ', ' + L.a + ', ' + L.C + ', (90° − ' + L.b + '). Прямой угол пропускается, катеты входят дополнениями до 90°.');
    st.p('Правило I — косинус отдельно стоящего равен произведению синусов несмежных. Правило II — косинус среднего из трёх соседних равен произведению котангенсов крайних.');
    st.h('3. Вычисления');
    stepsRightBody(st, L, solved.key, ce, solved.list.length > 1);
    return finishSolution(e, st, given);
  });
  return { solutions: solutions };
}

function solveQuad(given, side) {
  var vertex = side.toUpperCase();
  var m = permTo(vertex), inv = invPerm(m), can = {};
  Object.keys(given).forEach(function (k) {
    if (k !== side) can[inv[k]] = given[k];
  });
  var mapQ = { A: 'a', b: 'B', c: 'C', B: 'b', C: 'c' };
  var pol = { A: 90 };
  Object.keys(can).forEach(function (k) { pol[mapQ[k]] = 180 - can[k]; });
  var solved = rightPair(pol, {
    leg: 'В полярном треугольнике катет и противолежащий угол',
    sin: 'в полярном треугольнике синус катета больше синуса противолежащего угла',
    both: 'Сторона и противолежащий угол равны 90°: треугольник не определяется однозначно.'
  });
  if (solved.error) return { error: solved.error };
  var fromL = { a: m.A, b: m.B, c: m.C, A: m.a, B: m.b, C: m.c };
  var Lp = { a: 'a<sub>п</sub>', b: 'b<sub>п</sub>', c: 'c<sub>п</sub>', A: 'A<sub>п</sub>', B: 'B<sub>п</sub>', C: 'C<sub>п</sub>' };
  var solutions = solved.list.map(function (pe) {
    var ce = { a: 90, A: 180 - pe.a, b: 180 - pe.B, c: 180 - pe.C, B: 180 - pe.b, C: 180 - pe.c };
    var e = applyPerm(ce, inv);
    Object.keys(given).forEach(function (k) { e[k] = given[k]; });
    e[side] = 90;
    var st = new Steps();
    st.h('1. Вид треугольника');
    st.p('Сторона ' + side + ' = 90°: треугольник четвертной. Он полярен прямоугольному, поэтому сначала решается полярный прямоугольный треугольник.');
    st.h('2. Полярный прямоугольный треугольник');
    st.p('Элемент полярного треугольника равен 180° минус элемент исходного, сторона и угол меняются местами. A<sub>п</sub> = 90°.');
    Object.keys(pol).forEach(function (k) {
      if (k === 'A') return;
      st.f(Lp[k] + ' = 180° − ' + fromL[k] + ' = ' + fmt(pol[k]) + '.');
    });
    stepsRightBody(st, Lp, solved.key, pe, solved.list.length > 1);
    st.h('3. Возврат к четвертному треугольнику');
    st.f(m.A + ' = 180° − a<sub>п</sub> = ' + fmt(ce.A) + ';   ' + m.b + ' = 180° − B<sub>п</sub> = ' + fmt(ce.b) + ';   ' + m.c + ' = 180° − C<sub>п</sub> = ' + fmt(ce.c) + '.');
    st.f(m.B + ' = 180° − b<sub>п</sub> = ' + fmt(ce.B) + ';   ' + m.C + ' = 180° − c<sub>п</sub> = ' + fmt(ce.C) + '.');
    st.p('Круг Непера четвертного треугольника: (90° − ' + m.C + '), ' + m.b + ', (180° − ' + m.A + '), ' + m.c + ', (90° − ' + m.B + ').');
    return finishSolution(e, st, given);
  });
  return { solutions: solutions };
}

function napierPair(x1, x2, G, cotMode) {
  var factor = cotMode ? ctg(G / 2) : tg(G / 2);
  var denS = cos((x1 + x2) / 2), denD = sin((x1 + x2) / 2);
  var hs = Math.abs(denS) < 1e-10 ? 90 : n180(atan(cos((x1 - x2) / 2) * factor / denS));
  var hd = Math.abs(denD) < 1e-10 ? 0 : atan(sin((x1 - x2) / 2) * factor / denD);
  return { hs: hs, hd: hd, first: hs + hd, second: hs - hd };
}
function joinAdd(x, y) {
  if (y < -1e-8) return fmt(x) + ' − ' + fmt(-y);
  return fmt(x) + ' + ' + fmt(y);
}

function thirdByNapier(a, b, A, B) {
  // Две аналогии Непера для tg(c/2); берём ту, у которой знаменатель дальше от нуля
  // (при a = b, A = B sin[(A − B)/2] = 0 — тогда работает вторая).
  var den1 = sin((A - B) / 2), den2 = cos((A - B) / 2), t;
  if (Math.abs(den1) >= Math.abs(den2)) t = tg((a - b) / 2) * sin((A + B) / 2) / den1;
  else t = tg((a + b) / 2) * cos((A + B) / 2) / den2;
  if (!(t > 0) || !isFinite(t)) return null;
  var c = 2 * atan(t);
  if (!(c > 0.02 && c < 179.98)) return null;
  return c;
}

function collectSSA(sOpp, sOth, ang, given) {
  var aa = given[sOpp], bb = given[sOth], AA = given[ang];
  var Ob = sOth.toUpperCase();
  var mm = SIDES.filter(function (k) { return k !== sOpp && k !== sOth; })[0];
  var sB = sin(bb) * sin(AA) / sin(aa);
  if (!isFinite(sB) || sB > 1 + 1e-8) return { error: 'Треугольник не существует: синус искомого угла больше 1.' };
  if (sB < 0) return { error: 'Треугольник с такими элементами не существует.' };
  var Bs = sB >= 1 - 1e-13 ? [90] : [asin(sB), 180 - asin(sB)];
  var list = [];
  Bs.forEach(function (B) {
    var c = thirdByNapier(aa, bb, AA, B);
    if (c === null) return;
    var sd = {}; sd[sOpp] = aa; sd[sOth] = bb; sd[mm] = c;
    if (!sidesOk(sd.a, sd.b, sd.c, 0.001)) return;
    var e = fromSides(sd.a, sd.b, sd.c);
    if (Math.abs(e[ang] - AA) > 0.08 || Math.abs(e[Ob] - B) > 0.08) return;
    if (!anglesOk(e.A, e.B, e.C, 0)) return;
    e[sOpp] = aa; e[sOth] = bb; e[ang] = AA;
    list.push(e);
  });
  return { list: dedupe(list) };
}

function stepsSSA(st, sOpp, sOth, ang, given, e, multi) {
  var aa = given[sOpp], bb = given[sOth], AA = given[ang];
  var Ob = sOth.toUpperCase();
  var missA = ANGS.filter(function (k) { return k !== ang && k !== Ob; })[0];
  var mm = SIDES.filter(function (k) { return k !== sOpp && k !== sOth; })[0];
  var sB = sin(bb) * sin(AA) / sin(aa);
  var B1 = asin(Math.min(1, sB));
  st.h('1. Вид треугольника');
  st.p('Две стороны и угол против одной из них. Треугольник косоугольный.');
  st.h('2. Формула синусов');
  st.p('Угол ' + Ob + ' находится по синусу. Синус не различает острый и тупой угол, поэтому проверяются оба значения.');
  st.f('sin ' + Ob + ' = sin ' + sOth + ' · sin ' + ang + ' / sin ' + sOpp + ' = ' + n5(sin(bb)) + ' · ' + n5(sin(AA)) + ' / ' + n5(sin(aa)) + ' = ' + n5(sB) + '.');
  if (Math.abs(sB - 1) > 1e-6) st.f(Ob + '₁ = ' + fmt(B1) + ';   ' + Ob + '₂ = ' + fmt(180 - B1) + '.');
  st.p(multi
    ? 'Оба значения дают треугольник. Здесь ' + Ob + ' = ' + fmt(e[Ob]) + '.'
    : 'Условиям существования отвечает ' + Ob + ' = ' + fmt(e[Ob]) + '.');
  st.h('3. Аналогии Непера');
  st.w('Дальше в формулы входит уже найденный угол ' + Ob + '. Для этой пары данных без него не обойтись.');
  var B = e[Ob];
  var useSin = Math.abs(sin((AA - B) / 2)) >= Math.abs(cos((AA - B) / 2));
  var t = useSin ? tg((aa - bb) / 2) * sin((AA + B) / 2) / sin((AA - B) / 2) : tg((aa + bb) / 2) * cos((AA + B) / 2) / cos((AA - B) / 2);
  var c = 2 * atan(t);
  if (useSin) st.f('tg(' + mm + ' / 2) = tg[(' + sOpp + ' − ' + sOth + ') / 2] · sin[(' + ang + ' + ' + Ob + ') / 2] / sin[(' + ang + ' − ' + Ob + ') / 2] = ' + n5(t) + '.');
  else {
    st.w('Здесь ' + ang + ' ≈ ' + Ob + ' (равнобедренный треугольник): sin[(' + ang + ' − ' + Ob + ') / 2] = 0, поэтому берём вторую аналогию Непера.');
    st.f('tg(' + mm + ' / 2) = tg[(' + sOpp + ' + ' + sOth + ') / 2] · cos[(' + ang + ' + ' + Ob + ') / 2] / cos[(' + ang + ' − ' + Ob + ') / 2] = ' + n5(t) + '.');
  }
  st.f(mm + ' / 2 = ' + fmt(c / 2) + ';   ' + mm + ' = ' + fmt(c) + '.');
  var cotC = tg((AA + B) / 2) * cos((aa + bb) / 2) / cos((aa - bb) / 2);
  var C = 2 * Math.atan2(1, cotC) / D;
  st.f('ctg(' + missA + ' / 2) = tg[(' + ang + ' + ' + Ob + ') / 2] · cos[(' + sOpp + ' + ' + sOth + ') / 2] / cos[(' + sOpp + ' − ' + sOth + ') / 2] = ' + n5(cotC) + '.');
  st.f(missA + ' = ' + fmt(C) + '.');
}

function solveOblique(given) {
  var sides = SIDES.filter(function (k) { return k in given; });
  var angs = ANGS.filter(function (k) { return k in given; });
  var st, e, list;

  if (sides.length === 3) {
    var a = given.a, b = given.b, c = given.c;
    if (!sidesOk(a, b, c, 0.001))
      return { error: 'Условия для сторон не выполнены: каждая сторона меньше суммы двух других, сумма сторон меньше 360°.' };
    e = fromSides(a, b, c);
    if (!anglesOk(e.A, e.B, e.C, 0)) return { error: 'Треугольник с такими сторонами не существует.' };
    st = new Steps();
    st.h('1. Вид треугольника');
    st.p('Заданы три стороны. Сумма сторон ' + fmt(a + b + c) + ' меньше 360°, каждая сторона меньше суммы двух других.');
    st.h('2. Формула косинуса стороны');
    st.p('Углы находятся независимо, только по заданным сторонам.');
    st.f('cos A = (cos a − cos b · cos c) / (sin b · sin c);');
    st.f('cos B = (cos b − cos a · cos c) / (sin a · sin c);');
    st.f('cos C = (cos c − cos a · cos b) / (sin a · sin b).');
    st.h('3. Вычисления');
    [['A', a, b, c], ['B', b, a, c], ['C', c, a, b]].forEach(function (q) {
      var num = cos(q[1]) - cos(q[2]) * cos(q[3]), den = sin(q[2]) * sin(q[3]);
      st.f('cos ' + q[0] + ' = ' + n5(num) + ' / ' + n5(den) + ' = ' + n5(num / den) + ';   ' + q[0] + ' = ' + fmt(e[q[0]]));
    });
    return { solutions: [finishSolution(e, st, given)] };
  }

  if (angs.length === 3) {
    var A = given.A, B = given.B, C = given.C;
    if (!anglesOk(A, B, C, 0.001))
      return { error: 'Условия для углов не выполнены: сумма между 180° и 540°, сумма любых двух меньше 180° плюс третий.' };
    e = fromAngles(A, B, C);
    if (hasNan(e) || !sidesOk(e.a, e.b, e.c, 0)) return { error: 'Треугольник с такими углами не существует.' };
    st = new Steps();
    st.h('1. Вид треугольника');
    st.p('Заданы три угла. Сумма ' + fmt(A + B + C) + ', избыток ε = ' + fmt(A + B + C - 180) + '.');
    st.h('2. Формула косинуса угла');
    st.f('cos a = (cos A + cos B · cos C) / (sin B · sin C);');
    st.f('cos b = (cos B + cos A · cos C) / (sin A · sin C);');
    st.f('cos c = (cos C + cos A · cos B) / (sin A · sin B).');
    st.h('3. Вычисления');
    [['a', A, B, C], ['b', B, A, C], ['c', C, A, B]].forEach(function (q) {
      var num = cos(q[1]) + cos(q[2]) * cos(q[3]), den = sin(q[2]) * sin(q[3]);
      st.f('cos ' + q[0] + ' = ' + n5(num) + ' / ' + n5(den) + ' = ' + n5(num / den) + ';   ' + q[0] + ' = ' + fmt(e[q[0]]));
    });
    return { solutions: [finishSolution(e, st, given)] };
  }

  if (sides.length === 2 && angs.length === 1) {
    var s1 = sides[0], s2 = sides[1], ang = angs[0];
    var missing = SIDES.filter(function (k) { return k !== s1 && k !== s2; })[0];
    if (ang.toLowerCase() === missing) {
      var x1 = given[s1], x2 = given[s2], Cg = given[ang];
      var third = acos(cos(x1) * cos(x2) + sin(x1) * sin(x2) * cos(Cg));
      var sd = {}; sd[s1] = x1; sd[s2] = x2; sd[missing] = third;
      if (!sidesOk(sd.a, sd.b, sd.c, 0.001)) return { error: 'Треугольник с такими элементами не существует.' };
      e = fromSides(sd.a, sd.b, sd.c);
      e[s1] = x1; e[s2] = x2; e[ang] = Cg;
      var O1 = s1.toUpperCase(), O2 = s2.toUpperCase();
      var nap = napierPair(x1, x2, Cg, true);
      st = new Steps();
      st.h('1. Вид треугольника');
      st.p('Две стороны и угол между ними. Треугольник косоугольный.');
      st.h('2. Аналогии Непера и косинус стороны');
      st.p('Углы ' + O1 + ' и ' + O2 + ' — по первой паре аналогий, сторона ' + missing + ' — по косинусу. В формулы входят только заданные элементы.');
      st.f('tg[(' + O1 + ' + ' + O2 + ') / 2] = cos[(' + s1 + ' − ' + s2 + ') / 2] / cos[(' + s1 + ' + ' + s2 + ') / 2] · ctg(' + ang + ' / 2);');
      st.f('tg[(' + O1 + ' − ' + O2 + ') / 2] = sin[(' + s1 + ' − ' + s2 + ') / 2] / sin[(' + s1 + ' + ' + s2 + ') / 2] · ctg(' + ang + ' / 2).');
      st.h('3. Вычисления');
      st.f('(' + s1 + ' + ' + s2 + ') / 2 = ' + fmt((x1 + x2) / 2) + ';   (' + s1 + ' − ' + s2 + ') / 2 = ' + fmt((x1 - x2) / 2) + ';   ' + ang + ' / 2 = ' + fmt(Cg / 2) + '.');
      st.f('(' + O1 + ' + ' + O2 + ') / 2 = ' + fmt(nap.hs) + ';   (' + O1 + ' − ' + O2 + ') / 2 = ' + fmt(nap.hd) + '.');
      if ((x1 + x2) / 2 > 90)
        st.w('Полусумма сторон больше 90°, значит и полусумма углов больше 90°. Арктангенс дал отрицательное значение, к нему прибавлено 180°.');
      else
        st.p('Полусумма сторон меньше 90°, поправка 180° не нужна.');
      st.f(O1 + ' = ' + joinAdd(nap.hs, nap.hd) + ' = ' + fmt(e[O1]) + ';   ' + O2 + ' = ' + joinAdd(nap.hs, -nap.hd) + ' = ' + fmt(e[O2]) + '.');
      st.f('cos ' + missing + ' = cos ' + s1 + ' · cos ' + s2 + ' + sin ' + s1 + ' · sin ' + s2 + ' · cos ' + ang + ' = ' + n5(cos(third)) + ';   ' + missing + ' = ' + fmt(third) + '.');
      return { solutions: [finishSolution(e, st, given)] };
    }
    var got = collectSSA(ang.toLowerCase(), (ang.toLowerCase() === s1 ? s2 : s1), ang, given);
    if (got.error) return got;
    if (!got.list.length) return { error: 'Треугольник с такими элементами не существует.' };
    list = got.list.map(function (ee) {
      var st2 = new Steps();
      var sOpp = ang.toLowerCase();
      var sOth = sOpp === s1 ? s2 : s1;
      stepsSSA(st2, sOpp, sOth, ang, given, ee, got.list.length > 1);
      return finishSolution(ee, st2, given);
    });
    return { solutions: list };
  }

  if (angs.length === 2 && sides.length === 1) {
    var A1 = angs[0], A2 = angs[1], sd0 = sides[0];
    var missA = ANGS.filter(function (k) { return k !== A1 && k !== A2; })[0];
    if (sd0.toUpperCase() === missA) {
      var g1 = given[A1], g2 = given[A2], cg = given[sd0];
      var Cc = acos(-cos(g1) * cos(g2) + sin(g1) * sin(g2) * cos(cg));
      var ang3 = {}; ang3[A1] = g1; ang3[A2] = g2; ang3[missA] = Cc;
      if (!anglesOk(ang3.A, ang3.B, ang3.C, 0.001)) return { error: 'Треугольник с такими элементами не существует.' };
      e = fromAngles(ang3.A, ang3.B, ang3.C);
      e[A1] = g1; e[A2] = g2; e[sd0] = cg;
      var l1 = A1.toLowerCase(), l2 = A2.toLowerCase();
      var nap2 = napierPair(g1, g2, cg, false);
      st = new Steps();
      st.h('1. Вид треугольника');
      st.p('Два угла и сторона между ними. Треугольник косоугольный.');
      st.h('2. Аналогии Непера и косинус угла');
      st.p('Стороны ' + l1 + ' и ' + l2 + ' — по второй паре аналогий, угол ' + missA + ' — по косинусу угла.');
      st.f('tg[(' + l1 + ' + ' + l2 + ') / 2] = cos[(' + A1 + ' − ' + A2 + ') / 2] / cos[(' + A1 + ' + ' + A2 + ') / 2] · tg(' + sd0 + ' / 2);');
      st.f('tg[(' + l1 + ' − ' + l2 + ') / 2] = sin[(' + A1 + ' − ' + A2 + ') / 2] / sin[(' + A1 + ' + ' + A2 + ') / 2] · tg(' + sd0 + ' / 2).');
      st.h('3. Вычисления');
      st.f('(' + A1 + ' + ' + A2 + ') / 2 = ' + fmt((g1 + g2) / 2) + ';   (' + A1 + ' − ' + A2 + ') / 2 = ' + fmt((g1 - g2) / 2) + ';   ' + sd0 + ' / 2 = ' + fmt(cg / 2) + '.');
      st.f('(' + l1 + ' + ' + l2 + ') / 2 = ' + fmt(nap2.hs) + ';   (' + l1 + ' − ' + l2 + ') / 2 = ' + fmt(nap2.hd) + '.');
      if ((g1 + g2) / 2 > 90)
        st.w('Полусумма углов больше 90°, значит и полусумма сторон больше 90°: к арктангенсу прибавлено 180°.');
      st.f(l1 + ' = ' + joinAdd(nap2.hs, nap2.hd) + ' = ' + fmt(e[l1]) + ';   ' + l2 + ' = ' + joinAdd(nap2.hs, -nap2.hd) + ' = ' + fmt(e[l2]) + '.');
      st.f('cos ' + missA + ' = − cos ' + A1 + ' · cos ' + A2 + ' + sin ' + A1 + ' · sin ' + A2 + ' · cos ' + sd0 + ' = ' + n5(cos(Cc)) + ';   ' + missA + ' = ' + fmt(Cc) + '.');
      return { solutions: [finishSolution(e, st, given)] };
    }
    var Aa = sd0.toUpperCase() === A1 ? A1 : A2;
    var Ab = Aa === A1 ? A2 : A1;
    var va = given[Aa], vb = given[Ab], vs = given[sd0];
    var sb = sin(vs) * sin(vb) / sin(va);
    if (!isFinite(sb) || sb > 1 + 1e-8) return { error: 'Треугольник не существует: синус искомой стороны больше 1.' };
    var bs = sb >= 1 - 1e-13 ? [90] : [asin(sb), 180 - asin(sb)];
    var lb = Ab.toLowerCase();
    var mc = SIDES.filter(function (k) { return k !== sd0 && k !== lb; })[0];
    list = [];
    bs.forEach(function (b) {
      var c = thirdByNapier(vs, b, va, vb);
      if (c === null) return;
      var sd2 = {}; sd2[sd0] = vs; sd2[lb] = b; sd2[mc] = c;
      if (!sidesOk(sd2.a, sd2.b, sd2.c, 0.001)) return;
      var ee = fromSides(sd2.a, sd2.b, sd2.c);
      if (Math.abs(ee[Aa] - va) > 0.08 || Math.abs(ee[Ab] - vb) > 0.08) return;
      if (!anglesOk(ee.A, ee.B, ee.C, 0)) return;
      ee[Aa] = va; ee[Ab] = vb; ee[sd0] = vs;
      list.push(ee);
    });
    list = dedupe(list);
    if (!list.length) return { error: 'Треугольник с такими элементами не существует.' };
    var sols = list.map(function (ee) {
      var st3 = new Steps();
      var B1 = asin(Math.min(1, sb));
      st3.h('1. Вид треугольника');
      st3.p('Два угла и сторона против одного из них. Треугольник косоугольный.');
      st3.h('2. Формула синусов');
      st3.f('sin ' + lb + ' = sin ' + sd0 + ' · sin ' + Ab + ' / sin ' + Aa + ' = ' + n5(sb) + '.');
      if (Math.abs(sb - 1) > 1e-6) st3.f(lb + '₁ = ' + fmt(B1) + ';   ' + lb + '₂ = ' + fmt(180 - B1) + '.');
      st3.p(list.length > 1
        ? 'Оба значения дают треугольник. Здесь ' + lb + ' = ' + fmt(ee[lb]) + '.'
        : 'Условиям существования отвечает ' + lb + ' = ' + fmt(ee[lb]) + '.');
      st3.h('3. Аналогии Непера');
      st3.w('Дальше используется уже найденная сторона ' + lb + '.');
      var us3 = Math.abs(sin((va - vb) / 2)) >= Math.abs(cos((va - vb) / 2));
      var t3 = us3 ? tg((vs - ee[lb]) / 2) * sin((va + vb) / 2) / sin((va - vb) / 2) : tg((vs + ee[lb]) / 2) * cos((va + vb) / 2) / cos((va - vb) / 2);
      if (us3) st3.f('tg(' + mc + ' / 2) = tg[(' + sd0 + ' − ' + lb + ') / 2] · sin[(' + Aa + ' + ' + Ab + ') / 2] / sin[(' + Aa + ' − ' + Ab + ') / 2] = ' + n5(t3) + ';   ' + mc + ' = ' + fmt(ee[mc]) + '.');
      else {
        st3.w(Aa + ' ≈ ' + Ab + ' (равнобедренный): sin[(' + Aa + ' − ' + Ab + ') / 2] = 0, берём вторую аналогию Непера.');
        st3.f('tg(' + mc + ' / 2) = tg[(' + sd0 + ' + ' + lb + ') / 2] · cos[(' + Aa + ' + ' + Ab + ') / 2] / cos[(' + Aa + ' − ' + Ab + ') / 2] = ' + n5(t3) + ';   ' + mc + ' = ' + fmt(ee[mc]) + '.');
      }
      var miss = ANGS.filter(function (k) { return k !== Aa && k !== Ab; })[0];
      var cot3 = tg((va + vb) / 2) * cos((vs + ee[lb]) / 2) / cos((vs - ee[lb]) / 2);
      st3.f('ctg(' + miss + ' / 2) = ' + n5(cot3) + ';   ' + miss + ' = ' + fmt(ee[miss]) + '.');
      return finishSolution(ee, st3, given);
    });
    return { solutions: sols };
  }
  return { error: 'Нужно задать ровно три элемента.' };
}

function solve(given) {
  var keys = Object.keys(given);
  if (keys.length !== 3) return { error: 'Нужно задать ровно три разных элемента.' };
  for (var i = 0; i < keys.length; i++) {
    var v = given[keys[i]];
    if (!isFinite(v) || v <= 0 || v >= 180) return { error: 'Каждый элемент должен быть больше 0° и меньше 180°.' };
  }
  var EPS = 1e-4;
  var rightAt = ANGS.filter(function (k) { return (k in given) && Math.abs(given[k] - 90) < EPS; })[0];
  var quadAt = SIDES.filter(function (k) { return (k in given) && Math.abs(given[k] - 90) < EPS; })[0];
  var res = rightAt ? solveRight(given, rightAt) : quadAt ? solveQuad(given, quadAt) : solveOblique(given);
  if (res.error) return res;
  res.solutions = (res.solutions || []).filter(function (s) { return !hasNan(s.e); });
  if (res.solutions.length === 2 && NAMES.every(function (k) { return Math.abs(res.solutions[0].e[k] - res.solutions[1].e[k]) < 0.1; }))
    res.nearLimit = 'Данные близки к предельному случаю (искомый элемент около 90°): два решения почти совпадают.';
  if (!res.solutions.length) return { error: 'Треугольник с такими элементами не существует.' };
  return res;
}

function targetsOf(solutions) {
  var t = [];
  solutions.forEach(function (s, i) {
    t.push({
      sol: s, e: s.e,
      label: solutions.length > 1 ? ('точным решением ' + (i + 1)) : 'точным решением',
      tol: (s.small ? 0.05 : 0.2) / 60
    });
  });
  var pl = solutions[0].plane;
  if (solutions[0].small && pl && solutions[0].unknown.every(function (k) { return isFinite(pl[k]); })) {
    t.push({ sol: solutions[0], e: pl, label: 'плоским решением', tol: 0.05 / 60, plane: true });
  }
  return t;
}
function scoreTarget(tg, answers) {
  var marks = {}, ok = 0;
  tg.sol.unknown.forEach(function (k) {
    marks[k] = Math.abs(answers[k] - tg.e[k]) <= tg.tol + 1e-9;
    if (marks[k]) ok++;
  });
  return { marks: marks, ok: ok, all: ok === tg.sol.unknown.length, tg: tg };
}
function bestScore(solutions, answers) {
  var best = null;
  targetsOf(solutions).forEach(function (tg) {
    var sc = scoreTarget(tg, answers);
    if (!best || sc.ok > best.ok) best = sc;
  });
  return best;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { solve: solve, fmt: fmt, fromSides: fromSides };
  if (typeof require !== 'undefined' && require.main === module && process.argv[2]) {
    console.log(JSON.stringify(solve(JSON.parse(process.argv[2]))));
  }
}

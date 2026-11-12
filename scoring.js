// Shared by admin.js and tv.js
const POOLS = ['A', 'B', 'C', 'D'], GN = ["Men's Doubles", "Women's Doubles", 'Mixed Doubles', 'Mixed Doubles 2', 'Mixed Doubles 3'];
const S = { teams: {}, scores: {}, tv: { mode: 'title' }, settings: {} };
function listen(cb) {
  db.collection('teams').onSnapshot(s => { S.teams = {}; s.forEach(d => S.teams[d.id] = { id: d.id, ...d.data() }); cb(); });
  db.collection('scores').onSnapshot(s => { S.scores = {}; s.forEach(d => S.scores[d.id] = d.data()); cb(); });
  db.doc('tournament/settings').onSnapshot(d => { S.settings = d.data() || {}; cb(); });
  db.doc('tournament/tv').onSnapshot(d => { S.tv = d.data() || { mode: 'title' }; cb(); });
}
const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
const poolTeams = p => Object.values(S.teams).filter(t => (t.pool || '') === p).sort(byOrder);
const tn = id => (S.teams[id] || {}).name || '?';
if (typeof esc === 'undefined') window.esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const gid = (x, y) => [x, y].sort().join('_');
// Match result from a score sheet. need = game wins required (2 in pool/QF/SF, 3 in the final)
function res(sc, need) {
  let a = 0, b = 0, pa = 0, pb = 0;
  for (let k = 0; k < 5; k++) { const r = sc && sc['g' + k]; if (r && Number.isFinite(r.a) && Number.isFinite(r.b)) { pa += r.a; pb += r.b; if (r.a > r.b) a++; else if (r.b > r.a) b++; } }
  const done = a >= need || b >= need; return { a, b, pa, pb, done, win: done ? (a > b ? 'a' : 'b') : null };
}
// score sheet of match `id`, seen from team x's side
function sc(id, x) {
  const d = S.scores[id]; if (!d) return null; if (d.a === x) return d.g;
  const o = {}; for (const k in d.g) o[k] = { a: d.g[k].b, b: d.g[k].a }; return o;
}
// single round robin (circle method): returns [{a,b,r}]
function fixtures(ids) {
  const t = ids.slice(); if (t.length % 2) t.push(null); const n = t.length, out = [];
  for (let r = 0; r < n - 1; r++) { for (let i = 0; i < n / 2; i++) { const a = t[i], b = t[n - 1 - i]; if (a && b) out.push({ a, b, r: r + 1 }); } t.splice(1, 0, t.pop()); }
  return out;
}
function allGames() {
  const out = []; POOLS.forEach(p => fixtures(poolTeams(p).map(t => t.id)).forEach(f => out.push({ ...f, pool: p, id: gid(f.a, f.b) })));
  out.sort((x, y) => ('CD'.includes(x.pool) - 'CD'.includes(y.pool)) || x.r - y.r || x.pool.localeCompare(y.pool)); return out.map((g, i) => ({ ...g, no: i + 1 }));
}
// Rank: match wins, then game wins, then point differential, then points for
function standings(p) {
  const ids = poolTeams(p).map(t => t.id), R = {}; ids.forEach(i => R[i] = { id: i, W: 0, L: 0, GW: 0, GL: 0, PF: 0, PA: 0 });
  let n = 0, d = 0;
  fixtures(ids).forEach(f => {
    n++; const r = res(sc(gid(f.a, f.b), f.a), 2); if (!r.done) return; d++;
    const A = R[f.a], B = R[f.b]; A.GW += r.a; A.GL += r.b; B.GW += r.b; B.GL += r.a; A.PF += r.pa; A.PA += r.pb; B.PF += r.pb; B.PA += r.pa;
    if (r.win === 'a') { A.W++; B.L++; } else { B.W++; A.L++; }
  });
  const rows = Object.values(R); rows.forEach(r => r.D = r.PF - r.PA);
  rows.sort((x, y) => y.W - x.W || y.GW - x.GW || y.D - x.D || y.PF - x.PF);
  return { rows, done: n > 0 && d === n };
}
// Playoffs. Top 2 of each pool are known only once the whole pool is finished.
function bracket() {
  const st = {}; POOLS.forEach(p => st[p] = standings(p));
  const seed = (p, k) => st[p].done ? st[p].rows[k].id : null, M = [];
  const add = (id, a, b, la, lb, need) => { const m = { id, a, b, la, lb, need, pid: 'PO-' + id }; const r = a && b ? res(sc(m.pid, a), need) : { done: false }; m.r = r; m.win = r.done ? (r.win === 'a' ? a : b) : null; m.lose = r.done ? (r.win === 'a' ? b : a) : null; M.push(m); return m; };
  const q1 = add('QF1', seed('A', 0), seed('C', 1), 'Top 1 · Bracket A', 'Top 2 · Bracket C', 2), q2 = add('QF2', seed('B', 0), seed('D', 1), 'Top 1 · Bracket B', 'Top 2 · Bracket D', 2);
  const q3 = add('QF3', seed('C', 0), seed('A', 1), 'Top 1 · Bracket C', 'Top 2 · Bracket A', 2), q4 = add('QF4', seed('D', 0), seed('B', 1), 'Top 1 · Bracket D', 'Top 2 · Bracket B', 2);
  const s1 = add('SF1', q1.win, q2.win, 'Winner QF1', 'Winner QF2', 2), s2 = add('SF2', q3.win, q4.win, 'Winner QF3', 'Winner QF4', 2);
  add('F', s1.win, s2.win, 'Winner SF1', 'Winner SF2', 3); add('B3', s1.lose, s2.lose, 'Loser SF1', 'Loser SF2', 2); return M;
}

// Schedule plan: Day 1 = pools A+B first, then C+D. Day 2 = quarterfinals, semifinals, battle for 3rd, final.
const DEF = { d1: { date: '2026-11-18', start: '08:00', min: 20, courts: 4, brk: false, brkTime: '12:00', brkMin: 60 }, d2: { date: '2026-11-19', start: '08:00', min: 20, courts: 4, brk: false, brkTime: '12:00', brkMin: 60 } };
const cfg = () => ({ d1: { ...DEF.d1, ...(S.settings.d1 || {}) }, d2: { ...DEF.d2, ...(S.settings.d2 || {}) } });
const tm = (s, add) => { const [h, m] = s.split(':').map(Number), t = h * 60 + m + add, H = Math.floor(t / 60) % 24; return `${H % 12 || 12}:${String(t % 60).padStart(2, '0')} ${H < 12 ? 'AM' : 'PM'}`; };
// minutes after the first game for time slot number s. The break (e.g. lunch) is inserted before the first slot that would start at or after the break time.
function slotOff(c, s) {
  const [h, m] = c.start.split(':').map(Number), [bh, bm] = (c.brkTime || '12:00').split(':').map(Number), st = h * 60 + m; let t = 0, used = false;
  for (let i = 0; i < s; i++) { t += c.min; if (c.brk && !used && st + t >= bh * 60 + bm) { t += c.brkMin; used = true; } }
  return t;
}
function plan() {
  const c = cfg(), out = [];
  // Day 1: no team can be in two games in the same time slot (checked per slot, first slot with a free court wins).
  const slots = [], K = c.d1.courts, G = allGames();
  const put = (g, from) => { for (let i = from; ; i++) { if (i === slots.length) slots.push({ n: 0, t: new Set() }); const z = slots[i]; if (z.n < K && !z.t.has(g.a) && !z.t.has(g.b)) { z.n++; z.t.add(g.a); z.t.add(g.b); return { slot: i, court: z.n }; } } };
  const ab = G.filter(g => 'AB'.includes(g.pool)).map(g => ({ g, ...put(g, 0) })), from = slots.length, cd = G.filter(g => !'AB'.includes(g.pool)).map(g => ({ g, ...put(g, from) }));
  [...ab, ...cd].sort((x, y) => x.slot - y.slot || x.court - y.court).forEach(({ g, slot, court }) => out.push({ id: g.id, pid: g.id, a: g.a, b: g.b, day: 1, label: 'G' + g.no, pool: g.pool, need: 2, n: 3, time: tm(c.d1.start, slotOff(c.d1, slot)), court, slot }));
  let slot = 0; const M = bracket();
  [[0, 4], [4, 6], [7, 8], [6, 7]].forEach(([s, e]) => { M.slice(s, e).forEach((m, i) => out.push({ id: m.id, pid: m.pid, a: m.a, b: m.b, la: m.la, lb: m.lb, day: 2, label: m.id === 'B3' ? '3RD' : m.id, pool: '', need: m.need, n: m.id === 'F' ? 5 : 3, time: tm(c.d2.start, slotOff(c.d2, slot + Math.floor(i / c.d2.courts))), court: i % c.d2.courts + 1, slot: slot + Math.floor(i / c.d2.courts) })); slot += Math.ceil((e - s) / c.d2.courts); });
  return out;
}

// Lists every team that is scheduled in two games at the same time (should always be empty).
function planIssues(P) {
  const seen = {}, bad = [];
  P.forEach(g => [g.a, g.b].filter(Boolean).forEach(t => { const k = g.day + '|' + g.slot + '|' + t; if (seen[k]) bad.push(`${tn(t)} is in ${seen[k]} and ${g.label} at ${g.time}`); else seen[k] = g.label; }));
  return bad;
}

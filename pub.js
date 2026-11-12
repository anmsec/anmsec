const $ = s => document.querySelector(s), page = document.body.dataset.page;
const tmh = id => { const t = S.teams[id]; return `<span class="tm">${t && t.logo ? `<img src="${esc(t.logo)}" alt="">` : ''}${esc(t ? t.name : '?')}</span>`; };

/* ---------- schedule filters ---------- */
const stg = g => g.id.startsWith('QF') ? 'QF' : g.id.startsWith('SF') ? 'SF' : g.id;
const STAGE = { QF: 'Quarterfinals', SF: 'Semifinals', B3: 'Battle for 3rd', F: 'Finals' }, ONE = { QF: 'Quarterfinal', SF: 'Semifinal', B3: 'Battle for 3rd', F: 'Final' };
const fdate = d => new Date(d + 'T00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
const F = { q: '', day: '', pool: '', court: '', st: '' };
let barBuilt = false;
const gstat = r => r.win ? 'done' : r.a + r.b > 0 ? 'live' : 'up';
function buildBar(P) {
  const bar = $('#bar'); if (!bar) return; barBuilt = true;
  const courts = [...new Set(P.map(g => String(g.court)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const sel = (id, label, opts) => `<label class="f"><span>${label}</span><select id="${id}">${opts.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></label>`;
  bar.innerHTML = `<div class="fbar">
    <div class="fs"><input id="fq" type="search" placeholder="Search team name" autocomplete="off" aria-label="Search team name"><button type="button" id="fgo">Search</button></div>
    ${sel('fday', 'Round', [['', 'All rounds'], ['1', 'Elimination round'], ['2', 'Playoffs']])}
    ${sel('fpool', 'Bracket', [['', 'All brackets'], ...POOLS.map(p => [p, 'Bracket ' + p])])}
    ${sel('fcourt', 'Court', [['', 'All courts'], ...courts.map(c => [c, 'Court ' + c])])}
    ${sel('fst', 'Status', [['', 'All'], ['up', 'Upcoming'], ['live', 'In progress'], ['done', 'Finished']])}
    <button type="button" class="ghost" id="fclear">Clear</button></div><p class="sub" id="fcnt"></p>`;
  const apply = () => { F.q = $('#fq').value; paintSchedule(); };
  $('#fq').addEventListener('input', apply);
  $('#fq').addEventListener('keydown', e => { if (e.key === 'Enter') { apply(); e.target.blur(); } });
  $('#fgo').addEventListener('click', apply);
  [['fday', 'day'], ['fpool', 'pool'], ['fcourt', 'court'], ['fst', 'st']].forEach(([id, k]) => $('#' + id).addEventListener('change', e => { F[k] = e.target.value; paintSchedule(); }));
  $('#fclear').addEventListener('click', () => {
    Object.assign(F, { q: '', day: '', pool: '', court: '', st: '' });
    $('#fq').value = ''; ['fday', 'fpool', 'fcourt', 'fst'].forEach(id => { $('#' + id).value = ''; }); paintSchedule();
  });
}
function paintSchedule() {
  const c = cfg(), P = plan();
  if (!barBuilt) buildBar(P);
  const q = F.q.trim().toLowerCase();
  const ok = g => {
    const r = res(g.a && sc(g.pid, g.a), g.need);
    if (F.day && String(g.day) !== F.day) return false;
    if (F.pool && g.pool !== F.pool) return false;
    if (F.court && String(g.court) !== F.court) return false;
    if (F.st && gstat(r) !== F.st) return false;
    if (q && ![g.a, g.b].map(id => id ? tn(id) : '').join(' ').toLowerCase().includes(q)) return false;
    return true;
  };
  const shown = P.filter(ok), cnt = $('#fcnt'); if (cnt) cnt.textContent = `Showing ${shown.length} of ${P.length} games`;
  const row = g => {
    const r = res(g.a && sc(g.pid, g.a), g.need), has = r.a + r.b > 0;
    return `<div class="gr"><div><b>${esc(g.label)}</b><br><small>${g.pool ? 'Bracket ' + g.pool : ONE[stg(g)]}</small></div><div>${g.time}<br><small>Court ${g.court}</small></div><div><div class="${r.win === 'a' ? 'w' : ''}">${g.a ? tmh(g.a) : esc(g.la)}</div><div class="${r.win === 'b' ? 'w' : ''}">${g.b ? tmh(g.b) : esc(g.lb)}</div></div><div class="sc"><div>${has ? r.a : ''}</div><div>${has ? r.b : ''}</div></div></div>`;
  };
  const el = shown.filter(g => g.pool), po = shown.filter(g => !g.pool);
  let html = '';
  if (el.length) html += `<section class="round"><div class="rh"><h2 class="s">Elimination round</h2><span class="when">${fdate(c['d' + el[0].day].date)}</span></div><div class="box">${el.map(row).join('')}</div></section>`;
  if (po.length) html += `<section class="round pl"><div class="rh"><h2 class="s">Playoffs</h2><span class="when">${fdate(c['d' + po[0].day].date)}</span></div>` + ['QF', 'SF', 'B3', 'F'].map(k => { const l = po.filter(g => stg(g) === k); return l.length ? `<h3 class="st">${STAGE[k]}</h3><div class="box">${l.map(row).join('')}</div>` : ''; }).join('') + '</section>';
  $('#out').innerHTML = html || '<p class="sub" style="margin-top:24px">No games match your search or filters.</p>';
}
function paintStandings() {
  const pools = POOLS.map(p => `<div class="box"><h3>Bracket ${p}</h3><table class="t"><tr><th>#</th><th style="text-align:left">Team</th><th>W</th><th>L</th><th>GW-GL</th><th>PF</th><th>PA</th><th>+/-</th></tr>` + standings(p).rows.map((r, i) => `<tr class="${i < 2 ? 'q' : ''}"><td>${i + 1}</td><td class="n">${tmh(r.id)}</td><td>${r.W}</td><td>${r.L}</td><td>${r.GW}-${r.GL}</td><td>${r.PF}</td><td>${r.PA}</td><td>${r.D > 0 ? '+' : ''}${r.D}</td></tr>`).join('') + '</table></div>').join('');
  const M = bracket(), col = (h, sub, s, e) => `<div class="box"><h3>${h}</h3><div class="sub">${sub}</div>` + M.slice(s, e).map(m => { const sh = m.r.a + m.r.b > 0, row = (k, id, l) => `<div class="${m.win && m.win === id ? 'w' : ''}"><span>${id ? esc(tn(id)) : esc(l)}</span><span>${sh ? m.r[k] : ''}</span></div>`; return `<div class="m"><small>${m.id === 'B3' ? '3RD' : m.id}</small>${row('a', m.a, m.la)}${row('b', m.b, m.lb)}</div>`; }).join('') + '</div>';
  $('#out').innerHTML = `<section class="round"><div class="rh"><h2 class="s">Elimination round</h2></div><p class="sub">Top 2 of each bracket (highlighted) advance to the quarterfinals. Rank: match wins, then games won, then point differential.</p><div class="pools">${pools}</div></section><section class="round pl"><div class="rh"><h2 class="s">Playoffs</h2></div><p class="sub">Knockout rounds. Match-ups fill in automatically as results come in.</p><div class="po">${col('Quarterfinals', 'Knockout · 3 categories, win 2', 0, 4)}${col('Semifinals', 'Knockout · best of 3', 4, 6)}${col('Battle for 3rd', 'Best of 3', 7, 8)}${col('Finals', 'Best of 5', 6, 7)}</div></section>`;
}
listen(() => page === 'schedule' ? paintSchedule() : paintStandings());
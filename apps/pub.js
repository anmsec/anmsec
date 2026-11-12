const $ = s => document.querySelector(s), page = document.body.dataset.page;
const tmh = id => { const t = S.teams[id]; return `<span class="tm">${t && t.logo ? `<img src="${esc(t.logo)}" alt="">` : ''}${esc(t ? t.name : '?')}</span>`; };

/* ---------- schedule filters ---------- */
const F = { q: '', day: '', pool: '', court: '', st: '' };
let barBuilt = false;
const gstat = r => r.win ? 'done' : r.a + r.b > 0 ? 'live' : 'up';
function buildBar(P) {
  const bar = $('#bar'); if (!bar) return; barBuilt = true;
  const courts = [...new Set(P.map(g => String(g.court)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const sel = (id, label, opts) => `<label class="f"><span>${label}</span><select id="${id}">${opts.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></label>`;
  bar.innerHTML = `<div class="fbar">
    <div class="fs"><input id="fq" type="search" placeholder="Search team name" autocomplete="off" aria-label="Search team name"><button type="button" id="fgo">Search</button></div>
    ${sel('fday', 'Day', [['', 'All days'], ['1', 'Day 1'], ['2', 'Day 2']])}
    ${sel('fpool', 'Pool', [['', 'All pools'], ...POOLS.map(p => [p, 'Pool ' + p]), ['PO', 'Playoffs']])}
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
    if (F.pool === 'PO' ? g.pool : F.pool && g.pool !== F.pool) return false;
    if (F.court && String(g.court) !== F.court) return false;
    if (F.st && gstat(r) !== F.st) return false;
    if (q && ![g.a, g.b].map(id => id ? tn(id) : '').join(' ').toLowerCase().includes(q)) return false;
    return true;
  };
  const shown = P.filter(ok);
  const cnt = $('#fcnt'); if (cnt) cnt.textContent = `Showing ${shown.length} of ${P.length} games`;
  const html = [1, 2].map(day => {
    const list = shown.filter(x => x.day === day); if (!list.length) return '';
    return `<h2 class="s">Day ${day} · ${new Date(c['d' + day].date + 'T00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</h2><div class="box">` + list.map(g => {
      const r = res(g.a && sc(g.pid, g.a), g.need), has = r.a + r.b > 0;
      return `<div class="gr"><div><b>${g.label}</b><br><small>${g.pool ? 'Pool ' + g.pool : ''}</small></div><div>${g.time}<br><small>Court ${g.court}</small></div><div><div class="${r.win === 'a' ? 'w' : ''}">${g.a ? tmh(g.a) : esc(g.la)}</div><div class="${r.win === 'b' ? 'w' : ''}">${g.b ? tmh(g.b) : esc(g.lb)}</div></div><div class="sc"><div>${has ? r.a : ''}</div><div>${has ? r.b : ''}</div></div></div>`;
    }).join('') + '</div>';
  }).join('');
  $('#out').innerHTML = html || '<p class="sub" style="margin-top:24px">No games match your search or filters.</p>';
}
function paintStandings() {
  const pools = POOLS.map(p => `<div class="box"><h3>Pool ${p}</h3><table class="t"><tr><th>#</th><th style="text-align:left">Team</th><th>W</th><th>L</th><th>GW-GL</th><th>PF</th><th>PA</th><th>+/-</th></tr>` + standings(p).rows.map((r, i) => `<tr class="${i < 2 ? 'q' : ''}"><td>${i + 1}</td><td class="n">${tmh(r.id)}</td><td>${r.W}</td><td>${r.L}</td><td>${r.GW}-${r.GL}</td><td>${r.PF}</td><td>${r.PA}</td><td>${r.D > 0 ? '+' : ''}${r.D}</td></tr>`).join('') + '</table></div>').join('');
  const M = bracket(), col = (h, s, e) => `<div class="box"><h3>${h}</h3>` + M.slice(s, e).map(m => { const sh = m.r.a + m.r.b > 0, row = (k, id, l) => `<div class="${m.win && m.win === id ? 'w' : ''}"><span>${id ? esc(tn(id)) : esc(l)}</span><span>${sh ? m.r[k] : ''}</span></div>`; return `<div class="m">${row('a', m.a, m.la)}${row('b', m.b, m.lb)}</div>`; }).join('') + '</div>';
  $('#out').innerHTML = `<h2 class="s">Pool standings</h2><p class="sub">Top 2 of each pool (green) advance. Rank: match wins, then games won, then point differential.</p><div class="pools">${pools}</div><h2 class="s">Playoffs</h2><div class="po">${col('Quarterfinals', 0, 4)}${col('Semifinals', 4, 6)}${col('Final', 6, 7)}</div>`;
}
listen(() => page === 'schedule' ? paintSchedule() : paintStandings());
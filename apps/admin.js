const $ = s => document.querySelector(s), mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
let editId = null, logo = null, cur = null;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2000); };
function resize(file, max = 400) {
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/png')); };
    img.onerror = () => rej(new Error('Not a readable image')); img.src = u;
  });
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + b.dataset.p));
}));
$('#tvBtns').addEventListener('click', e => { const m = e.target.dataset.m; if (m) db.doc('tournament/tv').set({ mode: m }); });

/* teams: drag between pool columns, drop on a team to insert before it */
function place(id, pool, beforeId) {
  const ids = poolTeams(pool).map(t => t.id).filter(x => x !== id); ids.splice(beforeId ? ids.indexOf(beforeId) : ids.length, 0, id);
  const b = db.batch(); ids.forEach((x, i) => b.update(db.collection('teams').doc(x), { pool, order: i })); b.commit();
}
function dz(el, fn) {
  el.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); el.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); if (S.teams[id]) fn(id); });
}
function renderTeams() {
  const n = Object.keys(S.teams).length; $('#count').textContent = `${n} of ${TEAM_COUNT} teams`;
  const box = $('#cols'); box.replaceChildren();
  ['', ...POOLS].forEach(p => {
    const c = mk('div', 'card col'), list = poolTeams(p);
    c.append(mk('h2', '', (p ? 'Pool ' + p : 'Unassigned') + ` (${list.length}${p ? '/6' : ''})`));
    list.forEach(t => {
      const d = mk('div', 'tc'); d.draggable = true;
      if (t.logo) { const i = mk('img'); i.alt = ''; i.src = t.logo; d.append(i); }
      d.append(mk('span', '', t.name)); const e = mk('button', 'ghost', 'Edit'); e.addEventListener('click', () => openDlg(t.id)); d.append(e);
      d.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', t.id));
      dz(d, id => id !== t.id && place(id, p, t.id)); c.append(d);
    });
    dz(c, id => place(id, p)); box.append(c);
  });
}
function openDlg(id) {
  editId = id; logo = null; const t = id ? S.teams[id] : {};
  $('#dt').textContent = id ? 'Edit team' : 'Add team'; $('#name').value = t.name || ''; $('#logoIn').value = '';
  $('#preview').hidden = !t.logo; if (t.logo) $('#preview').src = t.logo;
  const arr = [(t.men || [])[0], (t.women || [])[0], (t.men || [])[1], (t.women || [])[1], (t.men || [])[2], (t.women || [])[2]];
  document.querySelectorAll('.m1').forEach((m, i) => { m.value = arr[i] || ''; });
  $('#del').hidden = !id; $('#dlg').showModal(); $('#name').focus();
}
$('#addTeam').addEventListener('click', () => { if (Object.keys(S.teams).length >= TEAM_COUNT) return toast(`Limit is ${TEAM_COUNT} teams`); openDlg(null); });
$('#cancel').addEventListener('click', () => $('#dlg').close());
$('#logoIn').addEventListener('change', async e => { if (!e.target.files[0]) return; try { logo = await resize(e.target.files[0]); $('#preview').src = logo; $('#preview').hidden = false; } catch (x) { toast(x.message); } });
$('#save').addEventListener('click', async () => {
  const name = $('#name').value.trim(); if (!name) return toast('Enter a team name');
  const v = [...document.querySelectorAll('.m1')].map(i => i.value.trim()), men = [v[0], v[2], v[4]], women = [v[1], v[3], v[5]];
  try {
    if (editId) { const u = { name, men, women }; if (logo) u.logo = logo; await db.collection('teams').doc(editId).update(u); }
    else await db.collection('teams').add({ name, logo: logo || '', men, women, pool: '', order: Date.now() });
    $('#dlg').close(); toast('Saved');
  } catch (e) { toast('Save failed: ' + e.message); }
});
$('#del').addEventListener('click', async () => { if (confirm(`Delete ${S.teams[editId].name}?`)) { await db.collection('teams').doc(editId).delete(); $('#dlg').close(); } });

/* score sheet */
(() => { const tab = $('#sTab'); GN.forEach((n, k) => { const tr = mk('tr', ''), td = mk('td', '', n); td.id = 'gn' + k; tr.id = 'gr' + k; tr.append(td); ['a', 'b'].forEach(x => { const c = mk('td'), i = mk('input'); i.type = 'number'; i.min = 0; i.id = `s${x}${k}`; i.addEventListener('input', sheetSum); c.append(i); tr.append(c); }); tab.append(tr); }); })();
function sheetVals() {
  const o = {}; let bad = false;
  for (let k = 0; k < 5; k++) { const a = $('#sa' + k).value, b = $('#sb' + k).value; if (a === '' && b === '') continue; if (a === '' || b === '') { bad = true; continue; } o['g' + k] = { a: +a, b: +b }; }
  return { o, bad };
}
function sheetSum() { const r = res(sheetVals().o, cur.need); $('#sRes').textContent = `Games ${r.a}-${r.b}, points ${r.pa}-${r.pb}` + (r.done ? '. Match finished.' : `. Not finished (needs ${cur.need} game wins).`); }
function openScore(g) {
  cur = g; const sh = sc(g.pid, g.a) || {};
  $('#sTitle').textContent = g.title; $('#sA').textContent = tn(g.a); $('#sB').textContent = tn(g.b);
  for (let k = 0; k < 5; k++) { $('#gr' + k).hidden = k >= g.games; const r = sh['g' + k]; $('#sa' + k).value = r ? r.a : ''; $('#sb' + k).value = r ? r.b : ''; }
  const A = S.teams[g.a] || {}, B = S.teams[g.b] || {}, nm = (t, i) => (t.men || [])[i] || (t.women || [])[i] || '';
  $('#gn0').textContent = `${GN[0]}`; sheetSum(); $('#sdlg').showModal();
}
$('#sCancel').addEventListener('click', () => $('#sdlg').close());
$('#sClear').addEventListener('click', async () => { if (confirm('Clear scores of this match?')) { await db.collection('scores').doc(cur.pid).delete(); $('#sdlg').close(); } });
$('#sSave').addEventListener('click', async () => {
  const { o, bad } = sheetVals(); if (bad) return toast('Fill both scores or leave both empty');
  try { await (Object.keys(o).length ? db.collection('scores').doc(cur.pid).set({ a: cur.a, b: cur.b, g: o }) : db.collection('scores').doc(cur.pid).delete()); $('#sdlg').close(); toast('Saved'); } catch (e) { toast('Save failed: ' + e.message); }
});

function renderSched() {
  const box = $('#sched'); box.replaceChildren(); const games = allGames();
  POOLS.forEach(p => {
    const c = mk('div', 'card'); c.append(mk('h2', '', 'Pool ' + p));
    games.filter(g => g.pool === p).forEach(g => {
      const r = res(sc(g.id, g.a), 2), d = mk('div', 'g');
      d.append(mk('b', '', 'G' + g.no), mk('span', '', `${tn(g.a)} vs ${tn(g.b)}`), mk('em', '', r.done ? `${r.a}-${r.b}` : ''));
      const b = mk('button', 'ghost', 'Score'); b.addEventListener('click', () => openScore({ pid: g.id, a: g.a, b: g.b, need: 2, games: 3, title: `Game ${g.no} · Pool ${p}` })); d.append(b); c.append(d);
    });
    if (!poolTeams(p).length) c.append(mk('p', 'hint', 'No teams in this pool yet.')); box.append(c);
  });
}
function renderStand() {
  const box = $('#stand'); box.replaceChildren();
  POOLS.forEach(p => {
    const c = mk('div', 'card'), t = mk('table'); c.append(mk('h2', '', 'Pool ' + p));
    t.innerHTML = '<tr><th>#</th><th style="text-align:left">Team</th><th>W</th><th>L</th><th>GW-GL</th><th>PF</th><th>PA</th><th>+/-</th></tr>';
    standings(p).rows.forEach((r, i) => { const tr = mk('tr', i < 2 ? 'q' : ''); [i + 1, tn(r.id), r.W, r.L, `${r.GW}-${r.GL}`, r.PF, r.PA, (r.D > 0 ? '+' : '') + r.D].forEach((v, j) => tr.append(mk('td', j === 1 ? 'n' : '', v))); t.append(tr); });
    c.append(t); box.append(c);
  });
}
function renderPO() {
  const box = $('#po'); box.replaceChildren(); const M = bracket();
  [['Quarterfinals', 0, 4], ['Semifinals', 4, 6], ['Battle for 3rd', 7, 8], ['Final (first to 3 of 5)', 6, 7]].forEach(([h, s, e]) => {
    const c = mk('div', 'card'); c.append(mk('h2', '', h));
    M.slice(s, e).forEach(m => {
      const d = mk('div', 'm'), a = mk('div'), b = mk('div'); a.append(mk('span', m.win && m.win === m.a ? 'w' : '', m.a ? tn(m.a) : m.la), mk('span', '', m.r.done || m.r.a + m.r.b ? m.r.a : ''));
      b.append(mk('span', m.win && m.win === m.b ? 'w' : '', m.b ? tn(m.b) : m.lb), mk('span', '', m.r.done || m.r.a + m.r.b ? m.r.b : '')); d.append(mk('small', 'hint', m.id), a, b);
      const bt = mk('button', 'ghost', 'Score'); bt.disabled = !(m.a && m.b); bt.style.marginTop = '6px';
      bt.addEventListener('click', () => openScore({ pid: m.pid, a: m.a, b: m.b, need: m.need, games: m.id === 'F' ? 5 : 3, title: m.id === 'F' ? 'Final' : m.id === 'B3' ? 'Battle for 3rd' : m.id })); d.append(bt); c.append(d);
    });
    box.append(c);
  });
}
function render() { renderTeams(); renderSched(); renderStand(); renderPO(); document.querySelectorAll('#tvBtns [data-m]').forEach(b => b.classList.toggle('on', S.tv.mode === b.dataset.m)); }
listen(render);

/* ---------- login check, roles, scorers ---------- */
const SUPERS = ['ton.quinton@gmail.com', 'pmsea.pickleball@gmail.com', 'cklatiza@gmail.com'], ROOTS = SUPERS.slice(0, 2), auth = firebase.auth();
let scorers = [], unsubSc = null;
auth.onAuthStateChanged(async u => {
  if (unsubSc) { unsubSc(); unsubSc = null; }
  $('#who').replaceChildren(); $('#tabSc').hidden = true;
  if (!u) return location.replace('login.html');
  const mail = (u.email || '').toLowerCase(), g = u.providerData.some(p => p.providerId === 'google.com'); let role = null, label = mail;
  try {
    if (g && u.emailVerified) { if (ROOTS.includes(mail)) role = 'root'; else if (SUPERS.includes(mail) || (await db.collection('admins').doc(mail).get()).exists) role = 'super'; else if ((await db.collection('scorers').doc(mail).get()).exists) role = 'scorer'; }
    else if (!g) { const d = await db.collection('users').doc(u.uid).get(); if (d.exists && d.data().active === true) { role = d.data().role === 'admin' ? 'super' : 'scorer'; label = d.data().username || label; } }
  } catch (e) {}
  if (!role) { await auth.signOut(); return location.replace('login.html?reason=denied'); }
  if (role === 'scorer') return location.replace('scorers.html');
  if (role === 'root') { const l = mk('a', '', 'Superadmin'); l.href = 'superadmin.html'; l.style.cssText = 'padding:9px 14px;border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--gd)'; $('#who').append(l); }
  const so = mk('button', 'ghost', `${label} · Sign out`); so.addEventListener('click', () => auth.signOut()); $('#who').append(so);
  if (role !== 'scorer') { $('#tabSc').hidden = false; unsubSc = db.collection('scorers').onSnapshot(s => { scorers = s.docs.map(d => d.id).sort(); renderScorers(); }); }
});
function renderScorers() {
  const box = $('#scList'); box.replaceChildren();
  scorers.forEach(m => { const d = mk('div', 'g'); d.append(mk('span', '', m)); const b = mk('button', 'ghost', 'Remove'); b.addEventListener('click', () => confirm(`Remove ${m}?`) && db.collection('scorers').doc(m).delete()); d.append(b); box.append(d); });
  if (!scorers.length) box.append(mk('p', 'hint', 'No scorers yet.'));
}
$('#scAdd').addEventListener('click', async () => {
  const m = $('#scMail').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(m)) return toast('Enter a valid email');
  try { await db.collection('scorers').doc(m).set({ added: Date.now() }); $('#scMail').value = ''; toast('Scorer added'); } catch (e) { toast(e.message); }
});

/* ---------- schedule maker + scoresheets (replaces the simple schedule list) ---------- */
(() => {
  const p = $('#p-sched'), bar = mk('div', 'row'); p.prepend(bar);
  bar.innerHTML = '<button class="ghost" id="cfgBtn" title="Schedule settings" aria-label="Schedule settings" style="font-size:20px;padding:6px 12px">⚙</button><button class="ghost" id="pr1">Print Day 1 scoresheets</button><button class="ghost" id="pr2">Print Day 2 scoresheets</button><span class="hint">Day 1: Pool A+B first, then C+D. Day 2: quarterfinals, semifinals, battle for 3rd, final. Scoresheets: 4 per A4 page.</span>';
  const dl = mk('dialog'); dl.id = 'cdlg';
  dl.innerHTML = '<h2>Schedule settings</h2><div id="cgrid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;margin-top:10px"></div><div class="row" style="margin-top:14px"><button id="cfgSave">Save</button><button class="ghost" id="cfgCancel">Cancel</button></div>';
  document.body.append(dl);
  const g = $('#cgrid');
  [['d1', 'Day 1'], ['d2', 'Day 2']].forEach(([d, n]) => {
    const col = mk('div'); col.style.cssText = 'display:grid;gap:8px;align-content:start'; col.append(mk('h2', '', n));
    [['date', 'Date', 'date'], ['start', 'First game starts', 'time'], ['min', 'Duration per game (minutes)', 'number'], ['courts', 'Number of games at the same time (courts)', 'number']].forEach(([k, l, t]) => { const w = mk('label', 'hint', l), i = mk('input'); i.type = t; i.id = `c-${d}-${k}`; if (t === 'number') i.min = 1; w.append(i); col.append(w); });
    const bw = mk('label', 'row'), bc = mk('input'); bc.type = 'checkbox'; bc.id = `c-${d}-brk`; bc.style.width = 'auto'; bw.append(bc, document.createTextNode(' Lunch break')); col.append(bw);
    [['brkTime', 'Break starts at', 'time'], ['brkMin', 'Break length (minutes)', 'number']].forEach(([k, l, t]) => { const w = mk('label', 'hint', l), i = mk('input'); i.type = t; i.id = `c-${d}-${k}`; w.append(i); col.append(w); });
    g.append(col);
  });
  const fill = () => { const c = cfg(); ['d1', 'd2'].forEach(d => { ['date', 'start', 'min', 'courts', 'brkTime', 'brkMin'].forEach(k => { $(`#c-${d}-${k}`).value = c[d][k]; }); $(`#c-${d}-brk`).checked = !!c[d].brk; }); };
  $('#cfgBtn').addEventListener('click', () => { fill(); dl.showModal(); }); $('#cfgCancel').addEventListener('click', () => dl.close());
  $('#cfgSave').addEventListener('click', async () => {
    const o = {}; ['d1', 'd2'].forEach(d => o[d] = { date: $(`#c-${d}-date`).value, start: $(`#c-${d}-start`).value || '08:00', min: Math.max(1, +$(`#c-${d}-min`).value || 20), courts: Math.max(1, +$(`#c-${d}-courts`).value || 1), brk: $(`#c-${d}-brk`).checked, brkTime: $(`#c-${d}-brkTime`).value || '12:00', brkMin: Math.max(1, +$(`#c-${d}-brkMin`).value || 60) });
    try { await db.doc('tournament/settings').set(o); dl.close(); toast('Settings saved'); } catch (e) { toast(e.message); }
  });
  $('#pr1').addEventListener('click', () => printSheets(1)); $('#pr2').addEventListener('click', () => printSheets(2));
  $('#sched').className = '';
})();
const fillCfg = () => {};
function renderSched() {
  fillCfg(); const box = $('#sched'); box.replaceChildren(); const c = cfg();
  { const bad = planIssues(plan()), h = mk('p', 'hint', bad.length ? 'Team conflicts: ' + bad.join('; ') : 'No team conflicts: no team plays two games at the same time.'); if (bad.length) h.style.color = '#c0392b'; box.append(h); }
  [1, 2].forEach(day => {
    const card = mk('div', 'card'); card.style.marginTop = '10px'; card.append(mk('h2', '', `Day ${day} · ${c['d' + day].date}`));
    plan().filter(x => x.day === day).forEach(g => {
      const r = res(g.a && sc(g.pid, g.a), g.need), d = mk('div', 'g'), has = r.a + r.b > 0;
      d.append(mk('b', '', g.label), mk('span', '', `${g.time} · Court ${g.court}${g.pool ? ' · Pool ' + g.pool : ''}  —  ${g.a ? tn(g.a) : g.la} vs ${g.b ? tn(g.b) : g.lb}`), mk('em', '', has ? `${r.a}-${r.b}` : ''));
      const b = mk('button', 'ghost', 'Score'); b.disabled = !(g.a && g.b); b.addEventListener('click', () => openScore({ pid: g.pid, a: g.a, b: g.b, need: g.need, games: g.n, title: `${g.label} · ${g.time} · Court ${g.court}` })); d.append(b); card.append(d);
    });
    box.append(card);
  });
}
function printSheets(day) {
  const c = cfg()['d' + day], EV = '72nd ANMSEC Mine and Dink Team Tournament Open 2026', logo = new URL('logo.png', location.href).href;
  const roster = (t, i) => { const T = S.teams[t] || {}; return [[(T.men || [])[0], (T.men || [])[1]], [(T.women || [])[0], (T.women || [])[1]], [(T.men || [])[2], (T.women || [])[2]]][i] || []; };
  const nm = (id, l) => esc(id ? tn(id) : l), w = window.open('', '_blank'); if (!w) return toast('Allow pop-ups to print');
  const sh = plan().filter(x => x.day === day).map(g => {
    const rows = GN.slice(0, g.n).map((n, k) => `<tr><td class="l">${n}</td><td>${k < 3 ? esc(roster(g.a, k).filter(Boolean).join(' / ')) : ''}</td><td class="s"></td><td class="s"></td><td>${k < 3 ? esc(roster(g.b, k).filter(Boolean).join(' / ')) : ''}</td></tr>`).join('');
    return `<div class="sh"><div class="hd"><img src="${logo}" alt="" onerror="this.remove()"><b>${EV}</b><span>${g.label}${g.pool ? ' · Pool ' + g.pool : ''} · ${c.date} · ${g.time} · Court ${g.court}</span></div><div class="t"><b>${nm(g.a, g.la)}</b><i>vs</i><b>${nm(g.b, g.lb)}</b></div><div class="tw"><table><tr><th>Category</th><th>Players</th><th>Score</th><th>Score</th><th>Players</th></tr>${rows}<tr><td class="l" colspan="2">Games won</td><td class="s"></td><td class="s"></td><td></td></tr></table></div><p><span>Winner: ______________</span><span>Referee: ______________</span><span>Captains: ____________ / ____________</span></p></div>`;
  });
  let pages = ''; for (let i = 0; i < sh.length; i += 4) pages += `<div class="pg">${sh.slice(i, i + 4).join('')}</div>`;
  w.document.write(`<html><head><title>Scoresheets Day ${day}</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}.pg{width:210mm;height:297mm;display:grid;grid-template-columns:210mm;grid-template-rows:repeat(4,74.25mm);page-break-after:always;overflow:hidden}.sh{height:74.25mm;padding:3mm 6mm;border-bottom:.3mm dashed #999;overflow:hidden;display:flex;flex-direction:column;gap:2mm}.hd{display:flex;align-items:center;gap:8px}.hd img{height:11mm}.hd b{font-size:14px}.hd span{font-size:11px;color:#333;margin-left:auto;text-align:right}.t{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:17px}.t i{color:#666;font-size:11px}.tw{flex:1;min-height:0}table{width:100%;height:100%;border-collapse:collapse}td,th{border:1px solid #333;padding:0 4px;font-size:12px;text-align:center}td.l{text-align:left;font-weight:700;white-space:nowrap}td.s{width:24mm}th{background:#eee}p{font-size:11px;margin:0;display:flex;justify-content:space-between}</style></head><body>${pages}</body></html>`);
  w.document.close(); setTimeout(() => w.print(), 500);
}
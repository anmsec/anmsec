const $ = s => document.querySelector(s), mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const auth = firebase.auth(), SUPERS = ['ton.quinton@gmail.com', 'pmsea.pickleball@gmail.com', 'cklatiza@gmail.com'];
let cur = null;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2000); };
$('#out').onclick = () => auth.signOut();
auth.onAuthStateChanged(async u => {
  if (!u) return location.replace('login.html');
  const mail = (u.email || '').toLowerCase(), g = u.providerData.some(p => p.providerId === 'google.com'); let ok = false, label = mail;
  try {
    if (g && u.emailVerified) ok = SUPERS.includes(mail) || (await db.collection('admins').doc(mail).get()).exists || (await db.collection('scorers').doc(mail).get()).exists;
    else if (!g) { const d = await db.collection('users').doc(u.uid).get(); ok = d.exists && d.data().active === true; if (ok) label = d.data().username; }
  } catch (e) {}
  if (!ok) { await auth.signOut(); return location.replace('login.html?reason=denied'); }
  $('#who').textContent = label; listen(render);
});
['#fd', '#fc', '#fp'].forEach(s => $(s).addEventListener('change', render));
function render() {
  const P = plan(), fc = $('#fc'), n = Math.max(cfg().d1.courts, cfg().d2.courts), v = fc.value || '0';
  if (fc.options.length !== n + 1) { fc.replaceChildren(new Option('All courts', '0'), ...Array.from({ length: n }, (_, i) => new Option('Court ' + (i + 1), i + 1))); fc.value = v; }
  const box = $('#list'); box.replaceChildren(); const d = +$('#fd').value, c = +fc.value;
  P.filter(x => (!d || x.day === d) && (!c || x.court === c)).forEach(g => {
    const r = res(g.a && sc(g.pid, g.a), g.need), has = r.a + r.b > 0; if ($('#fp').checked && r.done) return;
    const row = mk('div', 'g'), t = mk('div', 'tms'), a = mk('div', r.win === 'a' ? 'w' : '', g.a ? tn(g.a) : g.la), b = mk('div', r.win === 'b' ? 'w' : '', g.b ? tn(g.b) : g.lb); t.append(a, b);
    const bt = mk('button', r.done ? 'ghost' : '', has ? 'Edit' : 'Score'); bt.disabled = !(g.a && g.b); bt.addEventListener('click', () => open({ pid: g.pid, a: g.a, b: g.b, need: g.need, games: g.n, title: `${g.label} · Day ${g.day} · ${g.time} · Court ${g.court}` }));
    row.append(mk('b', '', g.label), mk('span', 'hint', `${g.time} · C${g.court}`), t, mk('em', '', has ? `${r.a}-${r.b}` : ''), bt); box.append(row);
  });
  if (!box.children.length) box.append(mk('p', 'hint', 'No games to show.'));
}
(() => { const tab = $('#sTab'); GN.forEach((n, k) => { const tr = mk('tr'); tr.id = 'gr' + k; tr.append(mk('td', '', n)); ['a', 'b'].forEach(x => { const c = mk('td'), i = mk('input'); i.type = 'number'; i.min = 0; i.id = `s${x}${k}`; i.addEventListener('input', sum); c.append(i); tr.append(c); }); tab.append(tr); }); })();
function vals() { const o = {}; let bad = false; for (let k = 0; k < 5; k++) { const a = $('#sa' + k).value, b = $('#sb' + k).value; if (a === '' && b === '') continue; if (a === '' || b === '') { bad = true; continue; } o['g' + k] = { a: +a, b: +b }; } return { o, bad }; }
function sum() { const r = res(vals().o, cur.need); $('#sRes').textContent = `Games ${r.a}-${r.b}, points ${r.pa}-${r.pb}` + (r.done ? '. Match finished.' : `. Not finished (needs ${cur.need} game wins).`); }
function open(g) { cur = g; const sh = sc(g.pid, g.a) || {}; $('#sTitle').textContent = g.title; $('#sA').textContent = tn(g.a); $('#sB').textContent = tn(g.b); for (let k = 0; k < 5; k++) { $('#gr' + k).hidden = k >= g.games; const r = sh['g' + k]; $('#sa' + k).value = r ? r.a : ''; $('#sb' + k).value = r ? r.b : ''; } sum(); $('#sdlg').showModal(); }
$('#sCancel').onclick = () => $('#sdlg').close();
$('#sClear').onclick = async () => { if (confirm('Clear scores of this match?')) { try { await db.collection('scores').doc(cur.pid).delete(); $('#sdlg').close(); } catch (e) { toast(e.message); } } };
$('#sSave').onclick = async () => { const { o, bad } = vals(); if (bad) return toast('Fill both scores or leave both empty'); try { await (Object.keys(o).length ? db.collection('scores').doc(cur.pid).set({ a: cur.a, b: cur.b, g: o }) : db.collection('scores').doc(cur.pid).delete()); $('#sdlg').close(); toast('Saved'); } catch (e) { toast('Save failed: ' + e.message); } };

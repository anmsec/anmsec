const $ = s => document.querySelector(s), ROOTS = ['ton.quinton@gmail.com', 'pmsea.pickleball@gmail.com'], DOM = '@anmsec.app';
const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const second = firebase.initializeApp(firebaseConfig, 'second');   // creating an account here does not sign the superadmin out
const list = (col, box) => db.collection(col).onSnapshot(s => { const el = $(box); el.replaceChildren(); s.docs.map(d => d.id).sort().forEach(m => { const d = mk('div', 'g'), b = mk('button', 'ghost', 'Remove'); b.onclick = () => confirm('Remove ' + m + '?') && db.collection(col).doc(m).delete(); d.append(mk('span', '', m), b); el.append(d); }); });
const add = (col, inp) => async () => { const m = $(inp).value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(m)) return; await db.collection(col).doc(m).set({ added: Date.now() }); $(inp).value = ''; };
async function wipe(cols) { for (const c of cols) { const s = await db.collection(c).get(); for (let i = 0; i < s.docs.length; i += 400) { const b = db.batch(); s.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); } } alert('Done'); }
$('#mk').onclick = async () => {
  const n = $('#nu').value.trim().toLowerCase(), p = $('#np').value, name = $('#nn').value.trim(), role = $('#nr').value;
  if (!/^[a-z0-9._-]{3,30}$/.test(n)) return ($('#cm').textContent = 'Username: 3-30 letters, numbers, . _ -');
  if (p.length < 6) return ($('#cm').textContent = 'Password needs 6+ characters.');
  $('#mk').disabled = true; $('#cm').textContent = '';
  try {
    const c = await firebase.auth(second).createUserWithEmailAndPassword(n + DOM, p); await firebase.auth(second).signOut();
    await db.collection('users').doc(c.user.uid).set({ username: n, name, role, active: true, created: Date.now() });
    $('#nu').value = $('#np').value = $('#nn').value = ''; $('#cm').textContent = `Created ${n}. Give them the username and password.`;
  } catch (e) { $('#cm').textContent = e.code === 'auth/email-already-in-use' ? 'That username is taken.' : e.code === 'auth/operation-not-allowed' ? 'Enable Email/Password in Firebase Authentication.' : e.message; }
  $('#mk').disabled = false;
};
function users() {
  db.collection('users').onSnapshot(s => {
    const el = $('#uList'); el.replaceChildren();
    s.docs.sort((a, b) => a.data().username.localeCompare(b.data().username)).forEach(d => {
      const u = d.data(), r = mk('div', 'g'), t = mk('button', 'ghost', u.active ? 'Deactivate' : 'Activate'), x = mk('button', 'ghost', 'Delete');
      t.onclick = () => d.ref.update({ active: !u.active }); x.onclick = () => confirm('Delete ' + u.username + '?') && d.ref.delete();
      r.append(mk('span', '', `${u.username}${u.name ? ' · ' + u.name : ''} · ${u.role}${u.active ? '' : ' (inactive)'}`), t, x); el.append(r);
    });
  });
}
firebase.auth().onAuthStateChanged(u => {
  if (!u) return location.replace('login.html');
  const ok = u.emailVerified && ROOTS.includes((u.email || '').toLowerCase());
  $('#main').hidden = !ok; $('#me').textContent = u.email || ''; $('#msg').textContent = ok ? '' : 'Only ton.quinton@gmail.com and pmsea.pickleball@gmail.com can open this page.';
  if (!ok) return;
  users(); list('admins', '#admList'); list('scorers', '#scList');
  $('#admAdd').onclick = add('admins', '#adm'); $('#scAdd').onclick = add('scorers', '#sc');
  $('#clrScores').onclick = () => confirm('Delete ALL scores?') && wipe(['scores']);
  $('#clrTeams').onclick = () => confirm('Delete ALL teams and scores?') && wipe(['scores', 'teams']);
});

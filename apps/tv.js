const $ = s => document.querySelector(s);
const side = id => { const t = S.teams[id]; return `<div class="tm">${t && t.logo ? `<img src="${esc(t.logo)}" alt="">` : ''}<span>${esc(t ? t.name : '?')}</span></div>`; };
function paint() {
  const m = S.tv.mode || 'title', ids = ['title', 'pools', 'schedule', 'standings', 'bracket', 'blank'], id = ids.includes(m) ? m : 'title';
  document.querySelectorAll('.v').forEach(v => v.classList.toggle('on', v.id === id));
  if (id === 'pools') $('#poolG').innerHTML = POOLS.map(p => `<div class="pool"><h2>Pool ${p}</h2>${poolTeams(p).map(t => side(t.id)).join('')}</div>`).join('');
  if (id === 'schedule') { const gs = allGames(), P = Object.fromEntries(plan().map(x => [x.id, x])); $('#schG').innerHTML = POOLS.map(p => `<div class="pool"><h2>Pool ${p}</h2>` + gs.filter(g => g.pool === p).map(g => { const r = res(sc(g.id, g.a), 2), has = r.a + r.b > 0; return `<div class="gm"><b>G${g.no}<br><small>${P[g.id].time} · C${P[g.id].court}</small></b><div><div class="${r.win === 'a' ? 'w' : ''}">${esc(tn(g.a))}</div><div class="${r.win === 'b' ? 'w' : ''}">${esc(tn(g.b))}</div></div><div class="s"><div>${has ? r.a : ''}</div><div>${has ? r.b : ''}</div></div></div>`; }).join('') + '</div>').join(''); }
  if (id === 'standings') $('#stG').innerHTML = POOLS.map(p => `<div class="pool"><h2>Pool ${p}</h2><table class="st"><tr><th>#</th><th style="text-align:left">Team</th><th>W</th><th>L</th><th>GW-GL</th><th>+/-</th></tr>` + standings(p).rows.map((r, i) => `<tr class="${i < 2 ? 'q' : ''}"><td>${i + 1}</td><td class="n">${side(r.id)}</td><td>${r.W}</td><td>${r.L}</td><td>${r.GW}-${r.GL}</td><td>${r.D > 0 ? '+' : ''}${r.D}</td></tr>`).join('') + '</table></div>').join('');
  if (id === 'bracket') {
    const M = bracket(), col = (h, s, e) => `<div><h2>${h}</h2>` + M.slice(s, e).map(x => { const sh = x.r.a + x.r.b > 0, row = (k, id, l) => `<div class="r ${x.win && x.win === id ? 'w' : ''}"><span>${esc(id ? tn(id) : l)}</span><span>${sh ? x.r[k] : ''}</span></div>`; return `<div class="m">${row('a', x.a, x.la)}${row('b', x.b, x.lb)}</div>`; }).join('') + '</div>';
    const f = M[6]; $('#brG').innerHTML = col('Quarterfinals', 0, 4) + col('Semifinals', 4, 6) + col('Final', 6, 7) + (f.win ? '' : '');
  }
}
listen(paint);

/**
 * PMSEA Pickleball Cup email webhook (Google Apps Script). One Web App; deploy as: Execute as ME, access: Anyone.
 * Actions: submitted (public, auto) | invite | rejection | emailStats | test
 * SECURITY: no shared secret. Admin actions need a Firebase ID token from a signed-in admin (verified here).
 * Email text, sender name and the site link are read from Firestore ({slug}-settings/config), edited in superadmin.html.
 */
const CONFIG = {
  PROJECT_ID: 'picklemanager-fc0e2',
  API_KEY: 'AIzaSyDX1T0sFa9yWksFg-uxrCf0CtElB9GnFi4', // public web key (same as apiKey in tournament.config.js), used only to verify ID tokens
  SLUG: 'pmsea2026',                                  // same as tournament.config.js
  ADMIN_EMAILS: ['ton.quinton@gmail.com'],        // superadmins + admins allowed to send (lowercase)
  SITE_URL: '',                                   // fallback only. The real link is set in superadmin.html > Event > Site link
  BCC: [],                                        // organizer emails (each adds 1 to the Gmail quota per email)
  DAILY_LIMIT: 90, HARD_STOP: true,               // recipients/day (free Gmail ~100)
  PUBLIC_DAILY_CAP: 60                            // max automatic "received" emails per day
};
const FALLBACK = {
  subjSubmitted: 'We received your registration - {title}', bodySubmitted: 'Hi {captain}, we received your registration for {title} (team {team}).\n\nYour team code is {code}. Keep it safe. You can check your status anytime at {portalUrl}?code={code}\n\nYour slot is not yet confirmed. The committee will review your registration and we will email you again.\n\nImportant!\nPlease reply to this email with the company IDs of the players for verification purposes.',
  subjInvite: 'You are accepted! Please confirm your slot - {title}', bodyInvite: 'Hi {captain}, your registration for {title} was accepted in {finalCategory}.\n\nPlease accept or decline before {deadline}.\n\nYour team code: {code}\nConfirm here: {confirmUrl}',
  subjRejected: 'Registration update - {title}', bodyRejected: 'Hi {captain}, we are sorry. Your registration for {title} was not accepted.\n\nReason: {reason}'
};
function doGet() { return out_({ ok: true, service: 'Tournament email webhook' }); }

function doPost(e) {
  let d = {};
  try {
    d = JSON.parse(e.postData.contents);
    const cfg = loadCfg_(), cache = CacheService.getScriptCache();
    if (d.action === 'submitted') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email || ''))) return out_({ ok: false, error: 'Invalid email' });
      const k = 'sub:' + String(d.email).toLowerCase(), day = 'cap:' + today_();
      if (cache.get(k)) return out_({ ok: true, skipped: 'duplicate' });
      if (+(cache.get(day) || 0) >= CONFIG.PUBLIC_DAILY_CAP) return out_({ ok: false, error: 'Daily cap reached' });
      cache.put(k, '1', 600); cache.put(day, String(+(cache.get(day) || 0) + 1), 86400);
      return send_('submitted', d, cfg);
    }
    const who = verify_(d.idToken);
    if (!who) return out_({ ok: false, error: 'Unauthorized: sign in as an admin' });
    if (d.action === 'emailStats') return out_({ ok: true, tracker: stats_() });
    if (d.action === 'test') d = Object.assign({}, d, { email: who, team: 'Test Team', captain: 'Test Captain', code: 'A7K2QX', category: 'Test Category', finalCategory: 'Test Category', deadlineMs: Date.now() + 48 * 3600000, action: 'invite', _test: 1 });
    if (['invite', 'rejection'].indexOf(d.action) < 0) return out_({ ok: false, error: 'Unknown action' });
    return send_(d.action, d, cfg);
  } catch (err) { return out_({ ok: false, error: String(err) }); }
}

/* ---------- auth + config ---------- */
function verify_(t) {
  if (!t) return '';
  const r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + CONFIG.API_KEY,
    { method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: t }), muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return '';
  const u = (JSON.parse(r.getContentText()).users || [])[0];
  const m = u && u.emailVerified && String(u.email || '').toLowerCase();
  return m && CONFIG.ADMIN_EMAILS.map(function (x) { return x.toLowerCase(); }).indexOf(m) >= 0 ? m : '';
}
function loadCfg_() {
  const r = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + CONFIG.PROJECT_ID + '/databases/(default)/documents/' + CONFIG.SLUG + '-settings/config', { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Could not read settings (' + r.getResponseCode() + '). Run superadmin.html > Save settings once.');
  return dec_({ mapValue: JSON.parse(r.getContentText()) });
}
function dec_(v) {
  if ('stringValue' in v) return v.stringValue; if ('integerValue' in v) return +v.integerValue; if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue; if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec_);
  if ('mapValue' in v) { const o = {}, f = v.mapValue.fields || {}; for (const k in f) o[k] = dec_(f[k]); return o; } return null;
}
function base_(cfg) {
  let u = String(cfg.siteUrl || CONFIG.SITE_URL || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '') + '/';
}

/* ---------- sending ---------- */
function send_(action, d, cfg) {
  const em = cfg.email || {}, st = stats_(), n = 1 + CONFIG.BCC.length;
  if (CONFIG.HARD_STOP && st.used + n > CONFIG.DAILY_LIMIT) { log_(action, d, 0, 'Blocked', 'Daily limit'); return out_({ ok: false, error: 'Daily email limit reached' }); }
  const base = base_(cfg), code = /^[A-Z0-9]{6}$/.test(String(d.code || '')) ? d.code : '';
  if (action === 'invite' && !base) throw new Error('Site link is not set. Open superadmin.html > Event > Site link, then Save settings.');
  const cat = d.finalCategory || d.category, portal = base + 'status.html', confirmUrl = base + 'confirm.html?code=' + code;
  const deadline = d.deadlineMs ? Utilities.formatDate(new Date(+d.deadlineMs), 'Asia/Manila', 'MMM d, yyyy h:mm a') + ' (PH time)' : '';
  const vars = { title: cfg.title, team: d.team, captain: d.captain || d.team, company: d.company || '', players: d.captain || d.team, code: code, category: cat, finalCategory: cat, portalUrl: portal, confirmUrl: confirmUrl, hours: cfg.confirmHours || 48, deadline: deadline, reason: d.rejectReason || '' };
  const fill = function (s) { return String(s || '').replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? m : String(vars[k]); }); };
  const K = { submitted: ['subjSubmitted', 'bodySubmitted'], invite: ['subjInvite', 'bodyInvite'], rejection: ['subjRejected', 'bodyRejected'] }[action];
  const subject = em[K[0]] || FALLBACK[K[0]], body = em[K[1]] || FALLBACK[K[1]];
  let rows = [['Team', d.team], ['Company / Affiliation', d.company], ['Category', cat]], extra = '';
  if (action === 'submitted' || action === 'invite') rows.push(['Team code', code]);
  if (action === 'invite') {
    rows.push(['Respond by', deadline]);
    extra = '<p style="text-align:center;margin:22px 0"><a href="' + esc_(confirmUrl) + '" style="background:#111;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:8px;display:inline-block">Accept or decline your slot</a></p>';
  }
  const html = '<div style="background:#eef3f0;padding:20px 0;font-family:Arial,sans-serif;color:#222"><table role="presentation" align="center" width="560" style="max-width:96%;background:#fff;border-radius:12px;overflow:hidden"><tr><td style="background:#111;padding:20px 24px;color:#fff;font-size:20px;font-weight:700">' + esc_(cfg.title) + '</td></tr><tr><td style="padding:22px 24px;font-size:15px;line-height:1.55">' +
    fill(body).split(/\n\n?/).map(function (p) { return '<p>' + esc_(p) + '</p>'; }).join('') + box_(rows) + extra +
    ((cfg.date || cfg.venue) ? '<hr style="border:0;border-top:1px solid #ddd">' + box_([['Date', cfg.date], ['Venue', cfg.venue]]) : '') + '<p>- ' + esc_(em.senderName || cfg.title) + '</p></td></tr></table></div>';
  const o = { to: d.email, subject: fill(subject), body: fill(body), htmlBody: html, name: em.senderName || cfg.title };
  if (em.replyTo || (cfg.contact && cfg.contact.email)) o.replyTo = em.replyTo || cfg.contact.email;
  if (CONFIG.BCC.length) o.bcc = CONFIG.BCC.join(',');
  MailApp.sendEmail(o); log_(d._test ? 'test' : action, d, n, 'Sent', ''); return out_({ ok: true, tracker: stats_() });
}

/* ---------- tracker log (Script Properties) ---------- */
function today_() { return Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd'); }
function log_(action, d, n, status, note) {
  const p = PropertiesService.getScriptProperties(), L = JSON.parse(p.getProperty('log') || '[]'), D = JSON.parse(p.getProperty('days') || '{}'), k = today_();
  L.unshift({ ts: Utilities.formatDate(new Date(), 'Asia/Manila', 'MMM d HH:mm'), action: action, to: d.email, team: d.team || '', n: n, status: status, note: note });
  if (status === 'Sent') { D[k] = D[k] || { emails: 0, used: 0 }; D[k].emails++; D[k].used += n; }
  const keys = Object.keys(D).sort().slice(-14), D2 = {}; keys.forEach(function (x) { D2[x] = D[x]; });
  p.setProperty('log', JSON.stringify(L.slice(0, 40))); p.setProperty('days', JSON.stringify(D2));
}
function stats_() {
  const p = PropertiesService.getScriptProperties(), D = JSON.parse(p.getProperty('days') || '{}'), k = today_(), t = D[k] || { emails: 0, used: 0 };
  return { date: k, used: t.used, emails: t.emails, limit: CONFIG.DAILY_LIMIT, hardStop: CONFIG.HARD_STOP, perEmail: 1 + CONFIG.BCC.length, remaining: MailApp.getRemainingDailyQuota(),
    days: Object.keys(D).sort().reverse().map(function (x) { return { date: x, emails: D[x].emails, used: D[x].used }; }), log: JSON.parse(p.getProperty('log') || '[]') };
}

/* ---------- helpers ---------- */
function box_(rows) { return '<table style="width:100%;border-collapse:collapse;font-size:14px">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<tr><td style="padding:5px 8px;color:#666;width:34%;border-bottom:1px solid #eee">' + esc_(r[0]) + '</td><td style="padding:5px 8px;border-bottom:1px solid #eee"><b>' + esc_(r[1]) + '</b></td></tr>'; }).join('') + '</table>'; }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* Status engine shared by status.html, confirm.html and the superadmin preview. Load after firebase-init.js. */
const STATUS_COLORS = {info:"#4f63d2", success:"#16a34a", warn:"#b45309", danger:"#e11d48", neutral:"#64748b"};
const STATUS_FIELDS = {state:["pending","verification","accepted","invited","confirmed","declined","expired","rejected"], categoryChanged:["yes","no"]};
const STATUS_FIELD_LABELS = {state:"Registration state", categoryChanged:"Category changed"};
const STATUS_PLACEHOLDERS = "{team} {category} {finalCategory} {reason} {code} {title} {deadline} {hours} {confirmUrl} {contactPerson} {contactPhone} {contactEmail}";
const _st = (badge, headline, lines, color, when, x) => Object.assign({id:"s" + Math.random().toString(36).slice(2, 7), badge, headline, lines, color, when, showReason:false, ctaLabel:"", ctaUrl:"", note:""}, x || {});
const STATUS_PRESETS = {default: [
  _st("Not accepted", "We are sorry.", ["Your registration was not accepted."], "danger", [{f:"state", v:"rejected"}], {showReason:true}),
  _st("Declined", "Slot declined.", ["You declined this slot, so it has been released."], "neutral", [{f:"state", v:"declined"}]),
  _st("Expired", "Response time ended.", ["We did not receive your response within {hours} hours, so your slot was released.", "Please contact the organizers if you still want to play."], "warn", [{f:"state", v:"expired"}]),
  _st("Confirmed", "You're in!", ["You are in: {finalCategory}.", "See you on the court!"], "success", [{f:"state", v:"confirmed"}], {note:"To cancel, please contact the organizer at least 48 hours before the tournament. Failure to show up may prohibit you from joining other tournaments."}),
  _st("Action needed", "You've been accepted!", ["You are accepted to play in {finalCategory}.", "Please accept or decline your slot before {deadline}."], "warn", [{f:"state", v:"invited"}], {ctaLabel:"Respond now", ctaUrl:"{confirmUrl}"}),
  _st("Accepted", "Accepted!", ["Your registration has been accepted for {finalCategory}.", "Watch your email: we will send an invitation to confirm your slot."], "success", [{f:"state", v:"accepted"}]),
  _st("For verification", "Wait! Hold on.", ["We are still reviewing your skills and category level.", "Please expect a call from us."], "warn", [{f:"state", v:"verification"}]),
  _st("Registration received", "Registration received!", ["This is not guaranteed. We will be reviewing your registration.", "You will receive an email or a call regarding the results."], "info", [])
]};
DEFAULT_CONFIG.status = {title:"Registration Status", subtitle:"Enter the 6-character code from your email.", inputLabel:"Your code", buttonText:"Check status",
  notFound:"We couldn't find that code. Please check it and try again.", lockMsg:"Too many wrong attempts. Please try again in {minutes} minute(s).", error:"We couldn't check right now. Please try again in a moment.",
  footer:"Lost your code? Check your confirmation email or contact the organizers.", maxTries:5, lockMinutes:5,
  stages:JSON.parse(JSON.stringify(STATUS_PRESETS.default))};

const toMs = v => v && v.toMillis ? v.toMillis() : (+v || 0);
/* one public status doc -> one state. Works even if no admin has the dashboard open (expiry is computed from the deadline). */
function stateOf(d){
  if (d.rejected || d.decision === "Rejected" || d.status === "Rejected") return d.rejectKind === "player" ? "declined" : d.rejectKind === "expired" ? "expired" : "rejected";
  if (d.response === "declined") return "declined";
  if (d.response === "accepted" || d.status === "Confirmed") return "confirmed";
  if (d.invited || d.status === "Invited"){ const e = toMs(d.expiresAt); return e && Date.now() > e ? "expired" : "invited"; }
  if (d.decision === "Accepted") return "accepted";
  if (d.decision === "For Verification") return "verification";
  return "pending";
}
function statusFacts(d){ return {state:stateOf(d), categoryChanged:(d.finalCategory && d.category && d.finalCategory !== d.category) ? "yes" : "no"}; }
function pickStage(cfg, d){ const f = statusFacts(d); return ((cfg.status || {}).stages || []).find(s => (s.when || []).every(c => String(f[c.f]) === String(c.v))) || null; }
function fillStatus(str, d, cfg){ const c = cfg.contact || {}, e = toMs(d.expiresAt);
  const m = {team:d.team, category:d.category, finalCategory:d.finalCategory || d.category, reason:d.rejectReason, code:d._code, title:cfg.title, hours:cfg.confirmHours || 48,
    deadline:e ? new Date(e).toLocaleString("en-PH", {timeZone:"Asia/Manila", dateStyle:"medium", timeStyle:"short"}) + " (PH time)" : "", confirmUrl:confirmUrl(cfg, d._code),
    contactPerson:c.person, contactPhone:c.phone, contactEmail:c.email};
  return String(str || "").replace(/\{(\w+)\}/g, (x, k) => k in m ? (m[k] == null ? "" : String(m[k])) : x); }
const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
function renderStatusCard(cfg, d){
  const st = pickStage(cfg, d), card = mk("div", "sc-card"), F = s => fillStatus(s, d, cfg);
  if (!st){ card.append(mk("p", "", "No message is set for this status.")); return card; }
  card.style.setProperty("--c", STATUS_COLORS[st.color] || STATUS_COLORS.info);
  card.append(mk("div", "sc-team", "Team"), mk("div", "sc-tn", d.team || "—"), mk("span", "sc-badge", F(st.badge)), mk("h2", "", F(st.headline)));
  (st.lines || []).map(F).filter(x => x.trim()).forEach(l => card.appendChild(mk("p", "", l)));
  if (st.showReason && d.rejectReason){ const r = mk("div", "sc-reason"); r.append(mk("b", "", "Reason"), document.createTextNode(d.rejectReason)); card.appendChild(r); }
  if (st.note && F(st.note).trim()) card.appendChild(mk("p", "sc-note", F(st.note)));
  if (st.ctaLabel && /^(https?:|mailto:|tel:)/i.test(F(st.ctaUrl).trim())){ const a = mk("a", "sc-cta", F(st.ctaLabel)); a.href = F(st.ctaUrl).trim(); a.rel = "noopener"; card.appendChild(a); }
  return card; }
(function(){ const s = document.createElement("style"); s.textContent =
 ".sc-card{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-top:6px solid var(--c);border-radius:16px;padding:22px 20px;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.25)}" +
 ".sc-team{font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:600}.sc-tn{font:800 1.6rem/1.15 'Barlow Condensed',sans-serif;margin:2px 0 12px;word-break:break-word}" +
 ".sc-badge{display:inline-block;font:700 .78rem Barlow,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--c);border:1.5px solid var(--c);padding:3px 12px;border-radius:99px}" +
 ".sc-card h2{font:800 1.45rem/1.15 'Barlow Condensed',sans-serif;margin:12px 0 8px;color:var(--c);text-transform:none}.sc-card p{margin:0 0 10px;line-height:1.5}" +
 ".sc-reason{background:color-mix(in srgb,var(--c) 14%,transparent);border-left:4px solid var(--c);border-radius:8px;padding:10px 12px;margin-top:6px;white-space:pre-wrap;word-break:break-word}.sc-reason b{display:block;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--c);margin-bottom:2px}" +
 ".sc-note{color:var(--mute);font-size:.9rem}.sc-cta{display:inline-block;margin-top:6px;background:var(--c);color:#fff;text-decoration:none;font-weight:700;padding:10px 20px;border-radius:10px;border:0;cursor:pointer;font:700 1rem Barlow,sans-serif}.sc-cta.ghost{background:transparent;color:var(--c);border:2px solid var(--c)}.sc-cta:disabled{opacity:.5;cursor:not-allowed}" +
 ".cf-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.cf-dl{font-weight:700;margin:6px 0 10px}";
 document.head.appendChild(s); })();

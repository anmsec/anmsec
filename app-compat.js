/* Bridge: lets the legacy pages (index/adminpro) read the new tournament config. Load AFTER firebase-init.js. */
const REG = COL.registrations, SET = SETDOC;
let CFG = merge(DEFAULT_CONFIG, {});
const MPO_CATS = [], MPO_WEBHOOK = T.webhookUrl || "", MPO_WEBHOOK_SECRET = "";
const MPO_STATUSES = ["Submitted","Invited","Confirmed","Rejected"];
const mpoEsc = esc;
function cfgToSettings(c){
  return {date:c.date, venue:c.venue, open:c.regOpen, close:c.regClose, mode:c.mode, contact:c.contact.person, phone:c.contact.phone, email:c.contact.email, title:c.title};
}
const CFG_READY = getConfig().then(c => { CFG = c; MPO_CATS.splice(0, MPO_CATS.length, ...c.categories.map(x => x.name));
  applyThemeCfg(c); document.title = document.title.replace(/MPO Cup 2026/g, c.title); return c; });
const MPO_DEF = cfgToSettings(CFG);
async function mpoSettings(){ CFG = await getConfig(); return cfgToSettings(CFG); }
async function mpoSave(o){ const p = {}; ["date","venue","mode"].forEach(k => { if (o[k] !== undefined) p[k] = o[k]; });
  if (o.open !== undefined) p.regOpen = o.open; if (o.close !== undefined) p.regClose = o.close;
  p.contact = {person:o.contact || "", phone:o.phone || "", email:o.email || ""};
  await SETDOC.set(p, {merge:true}); }
const mpoFmt = (iso, o) => new Date(iso + "T12:00:00+08:00").toLocaleDateString("en-PH", {timeZone:"Asia/Manila", ...o});
function mpoState(s){ if (s.mode === "open") return "open"; if (s.mode === "closed") return "closed"; if (!s.open || !s.close) return "open";
  const n = Date.now(), a = Date.parse(s.open + "T" + (CFG.openTime || "12:00") + ":00+08:00"), b = Date.parse(s.close + "T23:59:59+08:00"); return n < a ? "soon" : n > b ? "closed" : "open"; }
function mpoStatusText(s, st){ return st === "open" ? "Registration is open" + (s.close ? " until " + mpoFmt(s.close, {month:"long", day:"numeric", year:"numeric"}) : "") + "."
  : st === "soon" ? "Registration opens " + mpoFmt(s.open, {weekday:"long", month:"long", day:"numeric", year:"numeric"}) + " at " + CFG.openTime + " (PH time)." : "Registration is closed."; }
/* new 6-char code made in the browser (the registration doc id = the code, so Firestore itself rejects duplicates) */
function newCode(){ const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for (const n of crypto.getRandomValues(new Uint32Array(6))) c += A[n % A.length]; return c; }
/* 6-char unique code (skips look-alikes) */
async function mpoGenCode(col){ const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let t = 0; t < 20; t++){ let c = ""; for (const n of crypto.getRandomValues(new Uint32Array(6))) c += A[n % A.length];
    if (!(await col.where("code", "==", c).limit(1).get()).size) return c; }
  throw new Error("Could not generate a unique code"); }

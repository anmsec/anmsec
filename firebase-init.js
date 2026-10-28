/* Load order: firebase app/auth/firestore -> tournament.config.js -> firebase-init.js */
firebase.initializeApp(T.firebase);
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;
const COL = {}; ["registrations","settings","status","users","audit"].forEach(n => COL[n] = T.slug + "-" + ((T.names && T.names[n]) || n));
const SETDOC = db.collection(COL.settings).doc("config");

const FEATURES = [
  ["registration","Team registration form"],["statusChecker","Public status checker (6-char code)"],["adminReview","Admin review (accept / reject)"],
  ["emailTracker","Email tracker"],["countdown","Countdown before registration opens"],["auditLog","Audit log"]
];
const THEMES = {
  emerald:  {name:"Emerald Classic", bg:"#04130d",bg2:"#071c14",panel:"#0b2a1e",line:"rgba(120,255,200,.15)",ink:"#eef8f2",mute:"#8fb5a2",mint:"#3ef0b0",em:"#12a36b",gold:"#e8b84a"},
  midnight: {name:"Midnight Gold",   bg:"#0a0d14",bg2:"#10141f",panel:"#161b29",line:"rgba(232,184,74,.18)",ink:"#f3f1ea",mute:"#9a9db0",mint:"#e8b84a",em:"#b8860b",gold:"#f2d388"},
  ivory:    {name:"Ivory & Navy", base:"light", alt:{bg:"#0b1220",bg2:"#101a2e",panel:"#16233d",line:"rgba(143,176,240,.18)",ink:"#eef2fb",mute:"#9aa9c6",mint:"#8fb0f0",em:"#5f86d6",gold:"#d9b56a"},    bg:"#f7f4ec",bg2:"#efe9db",panel:"#ffffff",line:"rgba(16,35,66,.14)",ink:"#10233f",mute:"#5d6b82",mint:"#1f3a68",em:"#16305a",gold:"#85661a"},
  slate:    {name:"Slate & Rose",    bg:"#12141a",bg2:"#181b23",panel:"#1f232d",line:"rgba(255,255,255,.1)",ink:"#f2f3f7",mute:"#9aa0b2",mint:"#e58ca1",em:"#c4506b",gold:"#d8b98a"},
  /* Flat palettes (from the supplied palette sheet) */
  "noir-emerald": {name:"Noir Emerald", pal:["#000000", "#1aa758", "#16834a", "#4f4955", "#3c2e48"], bg:"#120b19",bg2:"#1c1125",panel:"#261832",line:"rgba(26,167,88,.18)",ink:"#f6f3f9",mute:"#9f91ac",mint:"#1aa758",em:"#147d42",gold:"#53bd82"},
  "amber-ember": {name:"Amber Ember", pal:["#353a34", "#715a31", "#ec9e00", "#d45542", "#a63e3f"], bg:"#19140b",bg2:"#251e11",panel:"#322918",line:"rgba(236,158,0,.18)",ink:"#f9f7f3",mute:"#aca391",mint:"#ec9e00",em:"#d45542",gold:"#f1b640"},
  "signal-slate": {name:"Signal Slate", pal:["#4a525f", "#acb8b8", "#f3c500", "#ee9748", "#eb4c36"], bg:"#19160b",bg2:"#252111",panel:"#322d18",line:"rgba(243,197,0,.18)",ink:"#f9f8f3",mute:"#aca791",mint:"#f3c500",em:"#eb4c36",gold:"#ee9748"},
  "deep-lagoon": {name:"Deep Lagoon", pal:["#1e1e28", "#242333", "#02a9a2", "#008479", "#004845"], bg:"#0c0b19",bg2:"#121125",panel:"#1a1832",line:"rgba(2,169,162,.18)",ink:"#f4f3f9",mute:"#9291ac",mint:"#02a9a2",em:"#027f7a",gold:"#41beb9"},
  "sunset-indigo": {name:"Sunset Indigo", pal:["#3b519d", "#674ab4", "#d44465", "#d74142", "#eb7e21"], bg:"#19110b",bg2:"#251a11",panel:"#322418",line:"rgba(235,126,33,.18)",ink:"#f9f6f3",mute:"#ac9d91",mint:"#eb7e21",em:"#d74142",gold:"#f09e58"},
  "tropic-market": {name:"Tropic Market", pal:["#fdb53f", "#3598dc", "#1bbc9b", "#fe7877", "#f15928"], bg:"#190e0b",bg2:"#251611",panel:"#321e18",line:"rgba(241,89,40,.18)",ink:"#f9f5f3",mute:"#ac9791",mint:"#f15928",em:"#3598dc",gold:"#fdb53f"},
  "harbor-sand": {name:"Harbor Sand", pal:["#4a7a88", "#5a97a9", "#505050", "#ad8255", "#d9a56b"], bg:"#19120b",bg2:"#251b11",panel:"#322618",line:"rgba(217,165,107,.18)",ink:"#f9f6f3",mute:"#ac9f91",mint:"#d9a56b",em:"#5a97a9",gold:"#e2bc90"},
  "wild-berry": {name:"Wild Berry", pal:["#dc044d", "#b6ba01", "#7e7323", "#3c2249", "#1b0c43"], bg:"#0f0b19",bg2:"#161125",panel:"#1f1832",line:"rgba(182,186,1,.18)",ink:"#f5f3f9",mute:"#9891ac",mint:"#b6ba01",em:"#dc044d",gold:"#c8cb40"},
  "carnival-aqua": {name:"Carnival Aqua", pal:["#775995", "#fd7a20", "#f8cf63", "#2ad2bb", "#2a7980"], bg:"#19110b",bg2:"#251911",panel:"#322318",line:"rgba(253,122,32,.18)",ink:"#f9f6f3",mute:"#ac9c91",mint:"#fd7a20",em:"#2ad2bb",gold:"#f8cf63"},
  "copper-mint": {name:"Copper Mint", pal:["#b85e20", "#f67d2c", "#ec9e00", "#f0ba02", "#49bfa5"], bg:"#19160b",bg2:"#252011",panel:"#322c18",line:"rgba(240,186,2,.18)",ink:"#f9f8f3",mute:"#aca691",mint:"#f0ba02",em:"#49bfa5",gold:"#ec9e00"},
  "orchid-pop": {name:"Orchid Pop", pal:["#bfbfbf", "#78c6d3", "#f11a77", "#aa1a71", "#571c56"], bg:"#190b18",bg2:"#251125",panel:"#321831",line:"rgba(120,198,211,.18)",ink:"#f9f3f9",mute:"#ac91ab",mint:"#78c6d3",em:"#f11a77",gold:"#bfbfbf"},
  "spice-route": {name:"Spice Route", pal:["#5b5147", "#e95c2f", "#edca54", "#48b07b", "#775683"], bg:"#190e0b",bg2:"#251611",panel:"#321e18",line:"rgba(233,92,47,.18)",ink:"#f9f5f3",mute:"#ac9791",mint:"#e95c2f",em:"#edca54",gold:"#48b07b"},
  "parchment-red": {name:"Parchment & Red", pal:["#c1333f", "#cec6bb", "#ebe3d6", "#3c3c3c", "#2e2e2e"], bg:"#190b0c",bg2:"#251112",panel:"#32181a",line:"rgba(235,227,214,.18)",ink:"#f9f3f4",mute:"#ac9193",mint:"#ebe3d6",em:"#c1333f",gold:"#cec6bb"},
  "neon-citrus": {name:"Neon Citrus", pal:["#7ffef3", "#57bec7", "#86ff93", "#fffc95", "#fe5335"], bg:"#190d0b",bg2:"#251411",panel:"#321c18",line:"rgba(254,83,53,.18)",ink:"#f9f4f3",mute:"#ac9591",mint:"#fe5335",em:"#7ffef3",gold:"#86ff93"},
  "coral-crimson": {name:"Coral Crimson", pal:["#ff6a66", "#d85253", "#e24348", "#c93237", "#ad262d"], bg:"#190b0b",bg2:"#251111",panel:"#321819",line:"rgba(255,106,102,.18)",ink:"#f9f3f4",mute:"#ac9191",mint:"#ff6a66",em:"#bf504d",gold:"#ff8f8c"},
  "heritage-primary": {name:"Heritage Primary", pal:["#2172aa", "#179d54", "#c7941f", "#bd493c", "#70757b"], bg:"#19150b",bg2:"#251f11",panel:"#322a18",line:"rgba(199,148,31,.18)",ink:"#f9f7f3",mute:"#aca391",mint:"#c7941f",em:"#2172aa",gold:"#d5af57"},
  "fireside": {name:"Fireside", pal:["#be1103", "#ff5601", "#906538", "#ceb283", "#1a1a1a"], bg:"#19100b",bg2:"#251711",panel:"#322118",line:"rgba(255,86,1,.18)",ink:"#f9f5f3",mute:"#ac9a91",mint:"#ff5601",em:"#bf4001",gold:"#ceb283"},
  "desert-dusk": {name:"Desert Dusk", pal:["#ea7e33", "#e5c554", "#b8a773", "#999999", "#667ea0"], bg:"#19110b",bg2:"#251911",panel:"#322318",line:"rgba(234,126,51,.18)",ink:"#f9f6f3",mute:"#ac9c91",mint:"#ea7e33",em:"#b05e26",gold:"#e5c554"},
  "garden-fresh": {name:"Garden Fresh", pal:["#2dbd78", "#128ac6", "#ff9e01", "#f96908", "#f15942"], bg:"#19130b",bg2:"#251d11",panel:"#322818",line:"rgba(255,158,1,.18)",ink:"#f9f7f3",mute:"#aca191",mint:"#ff9e01",em:"#128ac6",gold:"#f96908"},
  "woodland": {name:"Woodland", pal:["#274334", "#336157", "#af8f69", "#948d61", "#fbd58a"], bg:"#0b1911",bg2:"#11251a",panel:"#183224",line:"rgba(251,213,138,.18)",ink:"#f3f9f6",mute:"#91ac9d",mint:"#fbd58a",em:"#bca068",gold:"#af8f69"},
  "graphite-flame": {name:"Graphite Flame", pal:["#535353", "#d9322a", "#f69129", "#f2b620", "#adadad"], bg:"#19150b",bg2:"#251f11",panel:"#322b18",line:"rgba(242,182,32,.18)",ink:"#f9f7f3",mute:"#aca491",mint:"#f2b620",em:"#d9322a",gold:"#f69129"},
  "plum-sunrise": {name:"Plum Sunrise", pal:["#442142", "#6d3655", "#b05c6b", "#dd8472", "#fcae88"], bg:"#190b18",bg2:"#251124",panel:"#321830",line:"rgba(252,174,136,.18)",ink:"#f9f3f8",mute:"#ac91aa",mint:"#fcae88",em:"#b05c6b",gold:"#dd8472"},
  "flat-jewel": {name:"Flat Jewel", pal:["#4a525f", "#01a187", "#1aaf5d", "#217fbc", "#8f3fae"], bg:"#0b1916",bg2:"#112522",panel:"#18322e",line:"rgba(26,175,93,.18)",ink:"#f3f9f8",mute:"#91aca7",mint:"#1aaf5d",em:"#217fbc",gold:"#53c385"},
  "navy-coral": {name:"Navy Coral", pal:["#092d3d", "#ff6563", "#dadfe3", "#ffffff", "#444444"], bg:"#0b1419",bg2:"#111f25",panel:"#182a32",line:"rgba(255,101,99,.18)",ink:"#f3f7f9",mute:"#91a3ac",mint:"#ff6563",em:"#bf4c4a",gold:"#dadfe3"},
  "rosewood-fern": {name:"Rosewood Fern", pal:["#b95754", "#e66b64", "#818181", "#1c6547", "#237e5b"], bg:"#0b1913",bg2:"#11251d",panel:"#183227",line:"rgba(232,120,113,.18)",ink:"#f3f9f7",mute:"#91aca1",mint:"#e87871",em:"#237e5b",gold:"#ee9995"},
  /* Generated from 3-4 colors (dark + light derived automatically) */
  "graphite-brass": {name:"Graphite & Brass", gen:["#c9a45c","#2b2b2e","#e6cf9a","#8a6d34"], pal:["#2b2b2e","#8a6d34","#c9a45c","#e6cf9a"]},
  "obsidian-champagne": {name:"Obsidian & Champagne", gen:["#e6d3a3","#121212","#c9b27a","#8c7a4d"], pal:["#121212","#8c7a4d","#e6d3a3","#c9b27a"]},
  "espresso-cream": {name:"Espresso & Cream", gen:["#f0e2c8","#3b2a20","#d9a066","#a0673a"], pal:["#3b2a20","#a0673a","#f0e2c8","#d9a066"]},
  "volt-court": {name:"Volt Court", gen:["#c6f432","#0f1b3d","#ffffff","#2f6bff"], pal:["#0f1b3d","#2f6bff","#c6f432","#ffffff"]},
  "clay-court": {name:"Clay Court", gen:["#d9714a","#3a2016","#f2c9a0","#a94f2c"], pal:["#3a2016","#a94f2c","#d9714a","#f2c9a0"]},
  "grass-court": {name:"Grass Court", gen:["#b9e36b","#0e2a18","#f4f7ea","#2f8f4e"], pal:["#0e2a18","#2f8f4e","#b9e36b","#f4f7ea"]},
  "burgundy-gold": {name:"Burgundy & Gold", gen:["#e0b455","#4a0f23","#f0d18a","#7b1e3a"], pal:["#4a0f23","#7b1e3a","#e0b455","#f0d18a"]},
  "sapphire-silver": {name:"Sapphire & Silver", gen:["#c3ccd8","#12224d","#7fa2ff","#2f5fd0"], pal:["#12224d","#2f5fd0","#c3ccd8","#7fa2ff"]},
  "amethyst-mint": {name:"Amethyst & Mint", gen:["#7be3c4","#2a1a4d","#b79bf5","#8d6fd6"], pal:["#2a1a4d","#8d6fd6","#7be3c4","#b79bf5"]},
  "sage-sand": {name:"Sage & Sand", gen:["#8fae8b","#1c2a20","#d8c3a0","#5f7f5b"], pal:["#1c2a20","#5f7f5b","#8fae8b","#d8c3a0"]},
  "blush-charcoal": {name:"Blush & Charcoal", gen:["#e3a6b0","#222226","#f3d4d9","#b4707c"], pal:["#222226","#b4707c","#e3a6b0","#f3d4d9"]},
  "ocean-mist": {name:"Ocean Mist", gen:["#a8dccf","#12282f","#6fa3b8","#3f7f96"], pal:["#12282f","#3f7f96","#a8dccf","#6fa3b8"]},
  "custom": {name:"Custom (pick your own colors)"}
};
const DEFAULT_CONFIG = {
  title:"PMSEA Pickleball Cup", tagline:"PMSEA Team Tournament", date:"[Date(s)]", venue:"[Venue]", logoUrl:"logo.png", posterUrl:"",
  siteUrl:"", confirmHours:48,
  regOpen:"", regClose:"", openTime:"12:00", mode:"auto",
  feeMode:"free", defaultFee:0, earlyBird:{enabled:false,fee:0,until:""}, promoNote:"",
  categories:[{id:"team",name:"Team Tournament",slots:20,fee:null,first:"",second:"",third:"",prizeNote:""}],
  features:{registration:true,statusChecker:true,adminReview:true,emailTracker:true,countdown:false,auditLog:true},
  theme:"emerald", themeMode:"dark", customTheme:{accent:"#3ef0b0",tint:"#0b2a1e",highlight:"#e8b84a"},
  contact:{person:"",phone:"",email:"",facebook:""},
  rulesText:"", faqText:"", scheduleText:"",
  email:{senderName:"PMSEA Organizers",replyTo:"",
    subjSubmitted:"We received your registration - {title}",
    bodySubmitted:"Hi {captain}, we received your registration for {title} (team {team}).\n\nYour team code is {code}. Keep it safe. You can check your status anytime at {portalUrl}?code={code}\n\nYour slot is not yet confirmed. The committee will review your registration and we will email you again.",
    subjInvite:"You're accepted! Please confirm your slot - {title}",
    bodyInvite:"Hi {captain}, good news! Your registration for {title} has been accepted in {finalCategory}.\n\nPlease accept or decline your slot before {deadline}. If we do not hear from you within {hours} hours, your slot will be released to another team.\n\nYour team code: {code}\nConfirm your slot here: {confirmUrl}",
    subjRejected:"Registration update - {title}",
    bodyRejected:"Hi {captain}, we are sorry. Your registration for {title} was not accepted.\n\nReason: {reason}"},
  confirm:{title:"Confirm your slot", subtitle:"Please accept or decline your slot before the deadline.", inputLabel:"Your code", lookup:"Continue",
    invitedTitle:"You've been accepted!", invitedMsg:"You are accepted to play in {finalCategory}.\nPlease accept or decline your slot before the deadline.", deadlineLabel:"Respond by",
    accept:"Accept slot", decline:"Decline slot",
    acceptPrompt:"Confirm that your team will play in {finalCategory}? Your answer is final and cannot be changed afterwards.",
    declinePrompt:"Decline this slot? It will be released to another team and this cannot be undone.",
    yesAccept:"Yes, confirm my slot", yesDecline:"Yes, decline", back:"Go back",
    acceptedTitle:"You're confirmed!", acceptedMsg:"Your slot in {finalCategory} is confirmed. See you on the court!",
    lockNote:"This response is final. To cancel, please contact the organizer at least 48 hours before the tournament. Failure to show up may prohibit you from joining other tournaments.",
    declinedTitle:"Slot declined", declinedMsg:"You declined this slot. It has been released to another team.",
    expiredTitle:"Response time ended", expiredMsg:"We did not receive your response within {hours} hours, so your slot was released.\nPlease contact the organizers if you still want to play.",
    rejectedMsg:"This registration was not accepted.",
    notInvitedMsg:"Your invitation is not ready yet. We will email you once your registration is accepted. You can follow your progress on the status page.",
    notFound:"We couldn't find that code. Please check it and try again.", error:"Something went wrong. Please try again in a moment."}
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isObj = o => o && typeof o === "object" && !Array.isArray(o);
const merge = (a, b) => { const o = {...a}; for (const k in b) o[k] = isObj(a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k]; return o; };
async function getConfig(){ try { const s = await SETDOC.get(); return merge(DEFAULT_CONFIG, s.exists ? s.data() : {}); } catch(e){ return merge(DEFAULT_CONFIG, {}); } }
/* site link helpers: base URL of this site (from superadmin > Event > Site link) */
const siteBase = cfg => { let u = String((cfg && cfg.siteUrl) || "").trim(); if (!u) u = location.origin + location.pathname.replace(/[^\/]*$/, ""); else if (!/^https?:\/\//i.test(u)) u = "https://" + u; return u.replace(/\/+$/, "") + "/"; };
const confirmUrl = (cfg, code) => siteBase(cfg) + "confirm.html?code=" + encodeURIComponent(code || "");
const feature = (cfg, k) => !!(cfg.features && cfg.features[k]);          // hide UI when false
/* ---------- color engine: dark/light/auto for every theme + custom ---------- */
const _h2r = h => [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const _r2h = r => "#" + r.map(v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, "0")).join("");
const _lin = c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
const _lum = r => .2126 * _lin(r[0]) + .7152 * _lin(r[1]) + .0722 * _lin(r[2]);
const _cr = (a, b) => { const x = _lum(a), y = _lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function _hsl(r){ const R = r[0], G = r[1], B = r[2], mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn; let h = 0, s = 0;
  if (d){ s = d / (1 - Math.abs(2 * l - 1)); h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s, l]; }
function _rgb(h, s, l){ h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const p = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [p[0] + m, p[1] + m, p[2] + m]; }
const _mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
function _lighten(c, bg, min){ const q = _hsl(c); let l = q[2]; while (_cr(c, bg) < min && l < .97){ l += .02; c = _rgb(q[0], q[1], l); } return c; }
function _darken(c, bg, min){ const q = _hsl(c); let l = q[2]; while (_cr(c, bg) < min && l > .03){ l -= .02; c = _rgb(q[0], q[1], l); } return c; }
const _rgba = (r, a) => "rgba(" + r.map(v => Math.round(v * 255)).join(",") + "," + a + ")";
function buildDark(accent, tint, hl, em){
  const q = _hsl(_h2r(tint)), h = q[0], sat = Math.min(.4, Math.max(.04, q[1] * .9));
  const bg = _rgb(h, sat, .07), bg2 = _rgb(h, sat, .105), panel = _rgb(h, sat * .92, .145), mint = _lighten(_h2r(accent), panel, 4.5);
  return {bg:_r2h(bg), bg2:_r2h(bg2), panel:_r2h(panel), line:_rgba(mint, .18), ink:_r2h(_mix([1,1,1], _rgb(h, Math.min(.3, sat), .9), .35)),
    mute:_r2h(_lighten(_rgb(h, Math.min(.14, sat), .62), bg, 5)), mint:_r2h(mint), em:_r2h(em ? _h2r(em) : _mix(mint, [0,0,0], .25)), gold:_r2h(_lighten(_h2r(hl), panel, 4.5))}; }
function deriveLight(d){
  const q = _hsl(_h2r(d.bg)), h = q[0], sat = q[1] < .08 ? 0 : Math.min(.4, q[1]);
  const bg = _rgb(h, sat * .9, .965), bg2 = _rgb(h, sat * .8, .93), panel = _rgb(h, sat * .4, .995), ink = _rgb(h, Math.min(.4, sat), .11);
  return {bg:_r2h(bg), bg2:_r2h(bg2), panel:_r2h(panel), line:_rgba(ink, .14), ink:_r2h(ink), mute:_r2h(_darken(_rgb(h, Math.min(.12, sat), .4), bg, 5)),
    mint:_r2h(_darken(_h2r(d.mint), bg2, 4.5)), em:_r2h(_darken(_h2r(d.em), bg2, 3)), gold:_r2h(_darken(_h2r(d.gold), bg2, 4.5))}; }
function themeResolve(name, mode, custom){
  const t = THEMES[name] || THEMES.emerald; let dark, light; custom = custom || DEFAULT_CONFIG.customTheme;
  const gen = name === "custom" ? [custom.accent, custom.tint, custom.highlight, null] : t.gen;
  if (gen) dark = buildDark(gen[0], gen[1], gen[2], gen[3]); else if (t.base === "light"){ light = t; dark = t.alt; } else dark = t;
  if (!light) light = deriveLight(dark);
  const scheme = mode === "auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : (mode === "light" ? "light" : "dark");
  return {scheme, v:scheme === "dark" ? dark : light, dark}; }
function paintTheme(name, mode, custom){
  const R = themeResolve(name, mode, custom), v = R.v, d = R.dark, light = R.scheme === "light", vars = {};
  ["bg","bg2","panel","line","ink","mute","mint","em","gold"].forEach(k => vars[k] = v[k]);
  const mint = _h2r(v.mint), q = _hsl(mint), onOf = c => _cr(c, [1,1,1]) >= _cr(c, [.04,.1,.08]) ? "#ffffff" : "#0a1a14";
  const brand = light ? _rgb(q[0], Math.min(.6, q[1]), .22) : mint;
  vars.on = onOf(mint); vars.brand = _r2h(brand); vars.brand2 = v.mint; vars.obr = onOf(brand);
  vars.soft = _r2h(light ? _mix(mint, [1,1,1], .88) : _mix(mint, _h2r(v.panel), .82)); vars.bd = _r2h(_mix(_h2r(v.ink), _h2r(v.bg), light ? .5 : .62));
  vars.sb = d.panel; vars.sbink = _r2h(_mix(_h2r(d.ink), _h2r(d.panel), .1)); vars.sbmute = d.mute; vars.sbac = d.mint; vars.sbon = onOf(_h2r(d.mint));
  const r = document.documentElement; for (const k in vars) r.style.setProperty("--" + k, vars[k]);
  r.style.colorScheme = R.scheme; r.dataset.mode = R.scheme;
  try { localStorage.setItem("tpl-cache-" + T.slug, JSON.stringify({vars, scheme:R.scheme})); } catch(e){} }
const IS_ADMIN_PAGE = /adminpro|superadmin/i.test(location.pathname);
let _tc = null, _mql = null;
function applyThemeCfg(c){
  _tc = c; let mode = c.themeMode || "dark";
  if (IS_ADMIN_PAGE) { try { mode = localStorage.getItem("tpl-mode") || mode; } catch(e){} }
  paintTheme(c.theme, mode, c.customTheme);
  if (!_mql){ _mql = matchMedia("(prefers-color-scheme: dark)"); _mql.addEventListener && _mql.addEventListener("change", () => _tc && applyThemeCfg(_tc)); }
  if (IS_ADMIN_PAGE && !document.getElementById("tplMode")){ const b = document.createElement("button"); b.id = "tplMode"; b.type = "button";
    b.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:9998;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:8px 14px;font:600 .85rem Barlow,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)";
    b.onclick = () => { let m = "dark"; try { m = localStorage.getItem("tpl-mode") || (_tc.themeMode || "dark"); } catch(e){}
      const n = {dark:"light", light:"auto", auto:"dark"}[m] || "dark"; try { localStorage.setItem("tpl-mode", n); } catch(e){} applyThemeCfg(_tc); };
    document.body.appendChild(b); }
  const bb = document.getElementById("tplMode"); if (bb){ let m = mode; bb.textContent = {dark:"☾ Dark", light:"☀ Light", auto:"◐ Auto"}[m] || "☾ Dark"; } }
function applyTheme(name){ paintTheme(name, "dark", DEFAULT_CONFIG.customTheme); }
/* apply last-used theme instantly (no flash) while the config loads */
try { const c = JSON.parse(localStorage.getItem("tpl-cache-" + T.slug) || "null"); if (c){ for (const k in c.vars) document.documentElement.style.setProperty("--" + k, c.vars[k]); document.documentElement.style.colorScheme = c.scheme; } } catch(e){}

/* fee for a category, honoring free / per-category / early-bird */
function feeFor(cfg, cat){ if (cfg.feeMode === "free") return 0;
  let f = cfg.feeMode === "per_category" && cat && cat.fee != null ? +cat.fee : +cfg.defaultFee;
  const e = cfg.earlyBird; if (e && e.enabled && e.until && Date.now() <= Date.parse(e.until + "T23:59:59+08:00")) f = +e.fee; return f; }

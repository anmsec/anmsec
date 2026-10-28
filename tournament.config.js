/* ONE FILE PER TOURNAMENT COPY. Edit this first, then log in at superadmin.html for everything else.
   Firebase web config is PUBLIC by design (anyone can View Source). Real protection = firestore.rules + Google login. */
window.T = {
  slug: "pmsea2026",                    // prefix for all collections -> pmsea2026-registrations, pmsea2026-settings ...
  names: {},                             // optional overrides, e.g. { registrations: "teams" } -> my-tournament-teams
  firebase: {
    apiKey: "AIzaSyDX1T0sFa9yWksFg-uxrCf0CtElB9GnFi4", authDomain: "picklemanager-fc0e2.firebaseapp.com", projectId: "picklemanager-fc0e2",
    storageBucket: "picklemanager-fc0e2.firebasestorage.app", messagingSenderId: "77638250972", appId: "1:77638250972:web:f81ac71c2b3b08b66f9f19"
  },
  superEmails: ["ton.quinton@gmail.com"],        // bootstrap superadmins. MUST match the list in firestore.rules
  webhookUrl: "https://script.google.com/macros/s/AKfycbwWKCEw0OMUHc42zYrApsBVxo6cx0xOU1DCKpjUzdrmFaVLqnXHEqdB9-BooH8QR8Ev/exec"                         // Apps Script web app URL (email). Empty = test mode. NO secret here, see Code.gs.
};

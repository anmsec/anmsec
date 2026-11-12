/* Applies the theme chosen in superadmin. Scores live in a different Firebase project (firebase-config.js),
   so the theme code from firebase-init.js is run in its own scope against the registration project. */
(async () => {
  try {
    const src = await (await fetch('firebase-init.js')).text();
    const patched = src.replace('firebase.initializeApp(T.firebase);', 'firebase.initializeApp(T.firebase, "reg");').replace('firebase.firestore();', 'firebase.app("reg").firestore();');
    const api = new Function('firebase', 'T', patched + '\n;return { getConfig, applyThemeCfg };')(firebase, window.T);
    api.applyThemeCfg(await api.getConfig());
  } catch (e) { /* keep the cached or default theme */ }
})();
// Firestore. In Firebase console: Build > Firestore Database > Create, then set Rules so this app can read/write.
const firebaseConfig = {
  apiKey: "AIzaSyA-PZJ5cj9zmHv4ev2oCWH3TCWdaL2x-Ng",
  authDomain: "anmsec.firebaseapp.com",
  projectId: "anmsec",
  storageBucket: "anmsec.firebasestorage.app",
  messagingSenderId: "566765781633",
  appId: "1:566765781633:web:3833ef65181af820344380"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const TEAM_COUNT = 24;
// Collections: teams/{id}={name,logo,pool,order,men[3],women[3]}  scores/{gameId}={a,b,g:{g0:{a,b}..g4}}  tournament/tv={mode}

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const app = initializeApp({
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  measurementId: config.measurementId
});

export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  // Enforce domain selection in the Google prompt, though true verification happens in rules/code
  hd: "gerchik.team"
});

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

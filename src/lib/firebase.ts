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

let isLoggingIn = false;

export const loginWithGoogle = async () => {
  if (isLoggingIn) return;
  isLoggingIn = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Login failed:", error);
    if (error.code === 'auth/unauthorized-domain') {
      alert("Ошибка: Домен не авторизован в Firebase. Пожалуйста, добавьте этот домен (вероятно vercel.app) в список авторизованных доменов в Firebase Console -> Authentication -> Settings -> Authorized domains.");
    } else if (error.code === 'auth/operation-not-allowed') {
      alert("Ошибка: Провайдер Google не включен. Зайдите в Firebase Console -> Authentication -> Sign-in method и включите Google.");
    } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User closed the popup or clicked multiple times, ignore or show mild warning
    } else {
      alert("Ошибка авторизации: " + (error.message || error.code));
    }
  } finally {
    isLoggingIn = false;
  }
};
export const logout = () => signOut(auth);

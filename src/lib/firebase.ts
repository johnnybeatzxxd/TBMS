import { Platform } from "react-native";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const LOG = "[Firebase]";

/**
 * geames-finder — same project for Auth, Storage, FCM.
 * Android native build: use Android app credentials from google-services.json.
 * iOS / web / Expo dev: use web app credentials.
 */
const shared = {
  authDomain: "geames-finder.firebaseapp.com",
  projectId: "geames-finder",
  storageBucket: "geames-finder.firebasestorage.app",
  messagingSenderId: "370565861912",
};

const webFirebaseConfig = {
  ...shared,
  apiKey: "AIzaSyAPD6bJ28nsQ1wJeKecg2ePKqrNWRU6St8",
  appId: "1:370565861912:web:bd60d8000cffd7d7dfa96d",
  measurementId: "G-Z6T501KWVR",
};

/** From ./google-services.json (Android app in Firebase Console) */
const androidFirebaseConfig = {
  ...shared,
  apiKey: "AIzaSyBXpbAg3jmZs82b09mi8JCm7_MX5xbXB6c",
  appId: "1:370565861912:android:fb596cdcd71c6679dfa96d",
};

export const firebaseConfig =
  Platform.OS === "android" ? androidFirebaseConfig : webFirebaseConfig;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseApp = app;
export const firebaseAuth = getAuth(app);
export const firebaseStorage = getStorage(app);

console.log(LOG, "Firebase initialized", {
  platform: Platform.OS,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
  storageBucket: firebaseConfig.storageBucket,
});

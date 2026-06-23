import { initializeApp } from "firebase/app";
import { 
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const cleanEnvVar = (val: any): string | undefined => {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === '""' || trimmed === "''") {
    return undefined;
  }
  return trimmed;
};

const getEnvVal = (key: string, fallback: string): string => {
  let envVal = (import.meta as any).env?.[key];
  if (key.startsWith("VITE_")) {
    const apexKey = key.replace("VITE_", "APEX_");
    const apexVal = (import.meta as any).env?.[apexKey];
    if (apexVal !== undefined && cleanEnvVar(apexVal) !== undefined) {
      envVal = apexVal;
    }
  }
  const cleaned = cleanEnvVar(envVal);
  return cleaned !== undefined ? cleaned : fallback;
};

const firebaseConfig = {
  apiKey: getEnvVal("VITE_FIREBASE_API_KEY", firebaseAppletConfig.apiKey || ""),
  authDomain: getEnvVal("VITE_FIREBASE_AUTH_DOMAIN", firebaseAppletConfig.authDomain || ""),
  projectId: getEnvVal("VITE_FIREBASE_PROJECT_ID", firebaseAppletConfig.projectId || ""),
  storageBucket: getEnvVal("VITE_FIREBASE_STORAGE_BUCKET", firebaseAppletConfig.storageBucket || ""),
  messagingSenderId: getEnvVal("VITE_FIREBASE_MESSAGING_SENDER_ID", firebaseAppletConfig.messagingSenderId || ""),
  appId: getEnvVal("VITE_FIREBASE_APP_ID", firebaseAppletConfig.appId || "")
};

const app = initializeApp(firebaseConfig);

// Resilient auth initialization with graceful browser persistence fallbacks.
// We try the standard getAuth first, which is highly compatible. If that fails (e.g. storage restriction in iframe), 
// we fall back to initializeAuth in-memory and browser storage persistence.
let authInstance;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn("Failed standard getAuth initialization, trying initializeAuth fallback:", e);
  try {
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
    });
  } catch (e2) {
    console.error("Critical error: Firebase initializeAuth fallback also failed:", e2);
    // Absolute fallback
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId);

export { 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
};

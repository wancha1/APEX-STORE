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

const cleanEnvVar = (val: any): string | undefined => {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === '""' || trimmed === "''") {
    return undefined;
  }
  return trimmed;
};

const getEnvVal = (key: string, fallback: string): string => {
  const envVal = (import.meta as any).env?.[key];
  const cleaned = cleanEnvVar(envVal);
  return cleaned !== undefined ? cleaned : fallback;
};

const firebaseConfig = {
  apiKey: getEnvVal("VITE_FIREBASE_API_KEY", "AIzaSyBD8pHCfAFB9v5CVld1xJ68PsF02Bk83g4"),
  authDomain: getEnvVal("VITE_FIREBASE_AUTH_DOMAIN", "electric-tesla-497514-r1.firebaseapp.com"),
  projectId: getEnvVal("VITE_FIREBASE_PROJECT_ID", "electric-tesla-497514-r1"),
  storageBucket: getEnvVal("VITE_FIREBASE_STORAGE_BUCKET", "electric-tesla-497514-r1.firebasestorage.app"),
  messagingSenderId: getEnvVal("VITE_FIREBASE_MESSAGING_SENDER_ID", "612717024838"),
  appId: getEnvVal("VITE_FIREBASE_APP_ID", "1:612717024838:web:7455548b2871888d269c47")
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

export { 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
};

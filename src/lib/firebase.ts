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

const firebaseConfig = {
  apiKey: ((import.meta as any).env?.VITE_FIREBASE_API_KEY) || "AIzaSyBD8pHCfAFB9v5CVld1xJ68PsF02Bk83g4",
  authDomain: ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || "electric-tesla-497514-r1.firebaseapp.com",
  projectId: ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || "electric-tesla-497514-r1",
  storageBucket: ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || "electric-tesla-497514-r1.firebasestorage.app",
  messagingSenderId: ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "612717024838",
  appId: ((import.meta as any).env?.VITE_FIREBASE_APP_ID) || "1:612717024838:web:7455548b2871888d269c47"
};

const app = initializeApp(firebaseConfig);

// Resilient auth initialization with graceful browser persistence fallbacks
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch (e) {
  authInstance = getAuth(app);
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

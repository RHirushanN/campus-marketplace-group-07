import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  initializeFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDILg4h07TTdW_iBhgtZlBVUHNeCCxROZ0",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "campus-marketplace-6aa01.firebaseapp.com",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    "campus-marketplace-6aa01",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "campus-marketplace-6aa01.firebasestorage.app",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "720748790434",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:720748790434:web:370580a1f1e02e84aa8dfb",
};

export const firebaseConfigured =
  Object.values(firebaseConfig).every(Boolean);

export const firebaseApp = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp
  ? getAuth(firebaseApp)
  : null;

function createFirestore() {
  if (!firebaseApp) return null;
  try {
    return initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db = createFirestore();

export const listingsCollection = db
  ? collection(db, "listings")
  : null;

export const usersCollection = db
  ? collection(db, "users")
  : null;

export const listingDocument = (id: string) =>
  db
    ? doc(db, "listings", id)
    : null;
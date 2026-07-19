import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton — safe to call in Client Components and Server Components
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 20 &&
  firebaseConfig.apiKey !== "your-api-key";

if (!getApps().length) {
  app = initializeApp(isConfigured ? firebaseConfig : { apiKey: "AIzaSyDummyKeyForLocalDevelopmentNotReal", projectId: "dummy-project" });
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
} catch (error) {
  console.warn("[Firebase Client] Auth initialization failed. Check your API key.");
  auth = {} as Auth; // Mock to prevent crashes before UI loads
}

try {
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("[Firebase Client] Firestore/Storage initialization failed.");
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

export { app, auth, db, storage, isConfigured };

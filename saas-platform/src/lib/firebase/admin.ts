import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

// Admin SDK is server-only — never imported in client components
// Credentials come from environment variables, never committed

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;
let adminStorage: Storage;

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"|"$/g, "")
  : undefined;

// Only initialize if credentials are present.
// In local dev without .env.local filled in, this will be a stub.
const isConfigured = Boolean(projectId && clientEmail && privateKey);

if (!getApps().length) {
  if (isConfigured) {
    try {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error("[Firebase Admin] Failed to initialize. Check your FIREBASE_ADMIN_PRIVATE_KEY format.", error);
      adminApp = initializeApp({ projectId: "unconfigured-dev-placeholder" });
    }
  } else {
    // Initialize with a placeholder so getApps() is non-empty and the app doesn't crash on import.
    // API routes should check `isAdminConfigured()` before attempting Firestore calls.
    adminApp = initializeApp({ projectId: "unconfigured-dev-placeholder" });
    console.warn(
      "[Firebase Admin] Not configured — set FIREBASE_ADMIN_* env variables in .env.local"
    );
  }
} else {
  adminApp = getApps()[0];
}

adminDb = getFirestore(adminApp);
adminAuth = getAuth(adminApp);
adminStorage = getStorage(adminApp);

/** Returns true when Admin SDK has real credentials. */
export function isAdminConfigured(): boolean {
  return isConfigured;
}

export { adminApp, adminDb, adminAuth, adminStorage };

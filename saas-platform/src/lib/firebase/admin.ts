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
let rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

console.log("[Firebase Admin] Diagnostics:");
console.log(`- Project ID present: ${!!projectId} (${projectId})`);
console.log(`- Client Email present: ${!!clientEmail} (${clientEmail})`);
console.log(`- Private Key present: ${!!rawPrivateKey}`);
if (rawPrivateKey) {
  console.log(`- Private Key length: ${rawPrivateKey.length}`);
  console.log(`- Private Key starts with: ${rawPrivateKey.substring(0, 30)}...`);
  console.log(`- Private Key ends with: ...${rawPrivateKey.substring(rawPrivateKey.length - 30)}`);
  console.log(`- Contains literal \\n: ${rawPrivateKey.includes("\\n")}`);
  console.log(`- Contains actual newlines: ${rawPrivateKey.includes("\n")}`);
}

const privateKey = rawPrivateKey
  ? rawPrivateKey.replace(/\\n/g, "\n").replace(/^"|"$/g, "")
  : undefined;

// Only initialize if credentials are present.
// In local dev without .env.local filled in, this will be a stub.
const isConfigured = Boolean(projectId && clientEmail && privateKey);

if (!getApps().length) {
  if (isConfigured) {
    try {
      console.log("[Firebase Admin] Attempting to initialize with cert...");
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("[Firebase Admin] Successfully initialized.");
    } catch (error: any) {
      console.error("[Firebase Admin] Failed to initialize. Check your FIREBASE_ADMIN_PRIVATE_KEY format.");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Initialize with a placeholder so it doesn't crash module evaluation,
      // but we log the error loudly.
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

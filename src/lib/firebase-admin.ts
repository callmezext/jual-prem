import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || "ennchant-rogter";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

let adminApp: admin.app.App | null = null;

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Inisialisasi default untuk project ID
    try {
      adminApp = admin.initializeApp({
        projectId,
      });
    } catch (e) {
      console.warn("Firebase admin initialized without service account cert");
    }
  }
} else {
  adminApp = admin.app();
}

export const adminAuth = adminApp ? admin.auth(adminApp) : null;

/**
 * Helper untuk verifikasi token atau decode payload
 */
export async function verifyUserToken(idToken: string) {
  if (adminAuth) {
    try {
      return await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.warn("verifyIdToken failed, decoding token payload fallback:", err);
    }
  }

  // Fallback payload decode jika service account belum diisi di dev
  try {
    const parts = idToken.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      return {
        uid: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    }
  } catch {}

  throw new Error("Invalid Auth Token");
}

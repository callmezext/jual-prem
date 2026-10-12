import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAri_aIsnfiCosT3B0Dqq42fki5cHrmecs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ennchant-rogter.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ennchant-rogter",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ennchant-rogter.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "272395562120",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:272395562120:web:b6882f2c7253634569833d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-TLSQEPDTLK",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const token = await res.user.getIdToken();
  return { user: res.user, token };
}

export async function loginWithEmail(email: string, pass: string) {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  const token = await res.user.getIdToken();
  return { user: res.user, token };
}

export async function registerWithEmail(email: string, pass: string, name?: string) {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && res.user) {
    try {
      await updateProfile(res.user, { displayName: name });
    } catch (e) {
      console.warn("Could not set displayName on registration:", e);
    }
  }
  const token = await res.user.getIdToken();
  return { user: res.user, token };
}

export async function logoutUser() {
  await signOut(auth);
}

export { onAuthStateChanged, type User };

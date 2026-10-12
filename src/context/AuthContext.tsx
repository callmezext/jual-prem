"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  loginWithGoogle as fbLoginGoogle,
  loginWithEmail as fbLoginEmail,
  registerWithEmail as fbRegisterEmail,
  logoutUser as fbLogout,
  onAuthStateChanged,
  User as FirebaseUser,
} from "@/lib/firebase-client";
import axios from "axios";

export interface UserMembershipInfo {
  id: string;
  planName: string;
  totalQuota: number;
  remainingQuota: number;
  usedQuota: number;
  durationMonths: number;
  expiresAt: string;
  status: string;
}

export interface DbUserInfo {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  role: "customer" | "admin";
  apiKey?: string;
  balance: number;
  activeMembership?: UserMembershipInfo | null;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: DbUserInfo | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  loginGoogle: () => Promise<DbUserInfo | null>;
  loginEmail: (email: string, pass: string) => Promise<DbUserInfo | null>;
  registerEmail: (email: string, pass: string, name?: string) => Promise<DbUserInfo | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  dbUser: null,
  loading: true,
  isAuthModalOpen: false,
  authModalMode: "login",
  openAuthModal: () => {},
  closeAuthModal: () => {},
  loginGoogle: async () => null,
  loginEmail: async () => null,
  registerEmail: async () => null,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const syncUserWithBackend = async (fUser: FirebaseUser): Promise<DbUserInfo | null> => {
    try {
      const idToken = await fUser.getIdToken();
      const res = await axios.post("/api/auth/sync", {
        idToken,
        email: fUser.email,
        displayName: fUser.displayName,
        photoUrl: fUser.photoURL,
      });
      if (res.data?.success) {
        setDbUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.error("Gagal sinkronisasi user ke backend:", err);
    }
    return null;
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await syncUserWithBackend(auth.currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        await syncUserWithBackend(fUser);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginGoogle = async (): Promise<DbUserInfo | null> => {
    try {
      setLoading(true);
      const { user } = await fbLoginGoogle();
      const synced = await syncUserWithBackend(user);
      setIsAuthModalOpen(false);
      return synced;
    } catch (err: any) {
      console.error("Error login google:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginEmail = async (email: string, pass: string): Promise<DbUserInfo | null> => {
    try {
      setLoading(true);
      const { user } = await fbLoginEmail(email, pass);
      const synced = await syncUserWithBackend(user);
      setIsAuthModalOpen(false);
      return synced;
    } catch (err: any) {
      console.error("Error login email:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerEmail = async (
    email: string,
    pass: string,
    name?: string
  ): Promise<DbUserInfo | null> => {
    try {
      setLoading(true);
      const { user } = await fbRegisterEmail(email, pass, name);
      const synced = await syncUserWithBackend(user);
      setIsAuthModalOpen(false);
      return synced;
    } catch (err: any) {
      console.error("Error register email:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbLogout();
      setFirebaseUser(null);
      setDbUser(null);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error("Error logout:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginGoogle,
        loginEmail,
        registerEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

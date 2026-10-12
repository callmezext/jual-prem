"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Mail,
  Lock,
  User,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Globe,
} from "lucide-react";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    loginGoogle,
    loginEmail,
    registerEmail,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setConfirmPassword("");
    setErrorMsg("");
  };

  const handleSwitchMode = (mode: "login" | "register") => {
    setErrorMsg("");
    openAuthModal(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !email.includes("@")) {
      setErrorMsg("Masukkan alamat email yang valid.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal terdiri dari 6 karakter.");
      return;
    }

    if (authModalMode === "register" && password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      setSubmitting(true);
      if (authModalMode === "login") {
        await loginEmail(email.trim(), password);
      } else {
        await registerEmail(email.trim(), password, displayName.trim() || undefined);
      }
      resetForm();
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setErrorMsg("Email atau kata sandi yang Anda masukkan salah.");
      } else if (code === "auth/email-already-in-use") {
        setErrorMsg("Email ini sudah terdaftar. Silakan gunakan tab Masuk Akun.");
      } else if (code === "auth/weak-password") {
        setErrorMsg("Kata sandi terlalu lemah. Gunakan minimal 6 karakter.");
      } else if (code === "auth/too-many-requests") {
        setErrorMsg("Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.");
      } else {
        setErrorMsg(err.message || "Gagal memproses autentikasi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      setErrorMsg("");
      await loginGoogle();
      resetForm();
    } catch (err: any) {
      console.error("Firebase Google Auth error:", err);
      const code = err.code || "";
      if (code === "auth/popup-closed-by-user") {
        // User sengaja menutup popup, tidak perlu tampilkan error mengganggu
      } else if (code === "auth/unauthorized-domain") {
        setErrorMsg(
          "Domain belum diizinkan di Firebase Console. Tambahkan domain 'jual-am.vercel.app' ke menu Authentication > Settings > Authorized domains di console.firebase.google.com."
        );
      } else if (code === "auth/popup-blocked") {
        setErrorMsg("Jendela pop-up diblokir oleh browser Anda. Harap izinkan pop-up untuk situs ini lalu coba lagi.");
      } else if (code === "auth/cancelled-popup-request") {
        // Pop-up request dibatalkan karena ada popup lain
      } else {
        setErrorMsg(err.message || "Gagal masuk dengan Google. Silakan coba kembali.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#121215] border border-[#27272a] shadow-2xl space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Tombol Tutup */}
        <button
          onClick={closeAuthModal}
          aria-label="Tutup jendela autentikasi"
          className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher: Masuk vs Daftar */}
        <div className="space-y-2">
          <div className="flex border-b border-[#27272a]">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                authModalMode === "login"
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("register")}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                authModalMode === "register"
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>
          <p id="auth-modal-title" className="text-xs text-zinc-400 pt-1">
            {authModalMode === "login"
              ? "Masuk ke akun Anda untuk mengakses dashboard dan mengelola lisensi."
              : "Daftar akun baru untuk mulai memesan kuota reseller atau lisensi resmi."}
          </p>
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulir Email & Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Nama Lengkap</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama atau Toko Anda"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Alamat Email <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Kata Sandi <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
              />
            </div>
          </div>

          {authModalMode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Konfirmasi Kata Sandi <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>{authModalMode === "login" ? "Masuk ke Akun" : "Daftar Akun Sekarang"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#27272a] w-full" />
          <span className="bg-[#121215] px-3 text-[11px] font-mono text-zinc-500 uppercase tracking-wider relative">
            atau opsi lain
          </span>
        </div>

        {/* Opsi Masuk Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full py-2.5 px-4 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2.5 min-h-[44px]"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Lanjutkan dengan Akun Google</span>
        </button>

        {/* Bantuan Teks Footer */}
        <div className="text-center pt-1 text-xs text-zinc-400">
          {authModalMode === "login" ? (
            <p>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("register")}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Daftar sekarang
              </button>
            </p>
          ) : (
            <p>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Masuk di sini
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

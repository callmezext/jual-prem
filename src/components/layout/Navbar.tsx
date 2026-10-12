"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Shield,
  Key,
  User,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  Zap,
  Package,
  Code2,
  Home,
  CheckCircle2,
} from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

export default function Navbar() {
  const { firebaseUser, dbUser, logout, openAuthModal } = useAuth();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    axios
      .get("/api/ampro/status")
      .then((res) => setServerOnline(res.data?.status === "online"))
      .catch(() => setServerOnline(false));
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur border-b border-[#27272a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo (Kiri) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
            <span className="font-mono font-bold text-sm tracking-tight">AM</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Enchant Store
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#18181b] text-zinc-400 font-mono border border-[#27272a]">
                v1.0
              </span>
            </span>
            <span className="text-[11px] text-zinc-400">Alight Motion Activator</span>
          </div>
        </Link>

        {/* Bagian Kanan: User Profile & Tombol Hamburger Menu (HANYA MUNCUL JIKA SUDAH LOGIN) */}
        <div className="flex items-center gap-3">
          {firebaseUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121215] hover:bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 transition-colors"
              >
                <UserAvatar
                  src={dbUser?.photoUrl || firebaseUser.photoURL}
                  name={dbUser?.displayName || firebaseUser.displayName || firebaseUser.email}
                  size="xs"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-medium leading-tight">
                    {dbUser?.displayName || firebaseUser.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                    {dbUser?.activeMembership
                      ? `${dbUser.activeMembership.planName} (${
                          dbUser.activeMembership.remainingQuota === -1
                            ? "Unlimited"
                            : `${dbUser.activeMembership.remainingQuota} kuota`
                        })`
                      : "Akun Reguler"}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Keluar dari Akun"
                aria-label="Keluar dari Akun"
                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Tombol Hamburger Menu: Khusus Pengguna yang Sudah Login */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#121215] border border-[#27272a] text-zinc-200 hover:text-white hover:bg-[#18181b] transition-colors ml-1"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            /* Jika Belum Login: Tombol Daftar & Masuk Akun (Tanpa Hamburger) */
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("register")}
                className="hidden sm:inline-flex px-3.5 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white font-medium text-xs transition-colors min-h-[40px] items-center"
              >
                <span>Daftar Akun</span>
              </button>
              <button
                onClick={() => openAuthModal("login")}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm min-h-[40px]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Menu Navigasi (Hanya terbuka jika pengguna sudah login dan menuOpen aktif) */}
      {firebaseUser && menuOpen && (
        <div className="border-t border-[#27272a] bg-[#09090b] px-4 sm:px-6 py-5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Status Server */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] text-xs font-mono">
              <span className="text-zinc-400">Status Server Ampro:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    serverOnline === null
                      ? "bg-zinc-500"
                      : serverOnline
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
                <span className={serverOnline ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {serverOnline === null ? "Memeriksa" : serverOnline ? "Aktif & Online" : "Offline"}
                </span>
              </div>
            </div>

            {/* Menu Navigasi Lengkap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm text-zinc-200 hover:bg-[#18181b] hover:text-white transition-colors border border-transparent hover:border-[#27272a] min-h-[44px]"
              >
                <Home className="w-4 h-4 text-zinc-400" />
                <span>Beranda & Sambutan</span>
              </Link>

              {/* Tautan Khusus Dashboard Aktivasi */}
              <Link
                href="/aktivasi"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Dashboard Aktivasi</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <Link
                href="/#membership"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm text-zinc-200 hover:bg-[#18181b] hover:text-white transition-colors border border-transparent hover:border-[#27272a] min-h-[44px]"
              >
                <Package className="w-4 h-4 text-zinc-400" />
                <span>Paket Kuota Reseller</span>
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm text-zinc-200 hover:bg-[#18181b] hover:text-white transition-colors border border-transparent hover:border-[#27272a] min-h-[44px]"
              >
                <User className="w-4 h-4 text-zinc-400" />
                <span>Dashboard Akun & Riwayat</span>
              </Link>

              <Link
                href="/developer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-lg text-sm text-zinc-200 hover:bg-[#18181b] hover:text-white transition-colors border border-transparent hover:border-[#27272a] min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Code2 className="w-4 h-4 text-zinc-400" />
                  <span>Dokumentasi API</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </Link>

              {dbUser?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium text-purple-300 bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/30 transition-colors min-h-[44px]"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Panel Administrator</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

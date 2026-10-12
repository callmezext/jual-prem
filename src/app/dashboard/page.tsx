"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  User,
  Key,
  Copy,
  Clock,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import UserAvatar from "@/components/ui/UserAvatar";

export default function UserDashboardPage() {
  const { firebaseUser, dbUser, loading, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!dbUser?.id) return;

    axios
      .get(`/api/user/history?userId=${dbUser.id}`)
      .then((res) => {
        if (res.data?.success) {
          setOrders(res.data.orders);
          setActivations(res.data.activations);
        }
      })
      .catch((err) => console.error("Gagal memuat riwayat:", err))
      .finally(() => setLoadingData(false));
  }, [dbUser?.id]);

  const copyKey = () => {
    if (!dbUser?.apiKey) return;
    navigator.clipboard.writeText(dbUser.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!firebaseUser || !dbUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-xl bg-[#121215] border border-[#27272a] text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#27272a] mx-auto flex items-center justify-center text-zinc-400">
          <User className="w-5 h-5" />
        </div>
        <h1 className="text-base font-bold text-white">Login Diperlukan</h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Silakan masuk atau daftar akun untuk melihat riwayat aktivasi, kuota membership, dan API Key Anda.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors min-h-[44px]"
        >
          Masuk ke Akun / Daftar
        </button>
      </div>
    );
  }

  const m = dbUser.activeMembership;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* 1. PROFILE & MEMBERSHIP OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Profil Akun</span>
          <div className="flex items-center gap-3">
            <UserAvatar
              src={dbUser.photoUrl || firebaseUser?.photoURL}
              name={dbUser.displayName || firebaseUser?.displayName}
              size="lg"
            />
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white truncate">{dbUser.displayName}</h2>
              <p className="text-xs text-zinc-400 font-mono truncate">{dbUser.email}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-300 font-mono">
                Peran: {dbUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Membership Status Card */}
        <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23] mb-3">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Status Membership
              </span>
              <Link
                href="/#membership"
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
              >
                <span>Lihat Pilihan Paket</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {m ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <span className="text-[11px] text-zinc-400 block">Paket Aktif</span>
                  <span className="text-sm font-bold text-white">{m.planName}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <span className="text-[11px] text-zinc-400 block">Sisa Kuota</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {m.remainingQuota === -1 ? "Unlimited" : `${m.remainingQuota} aktivasi`}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <span className="text-[11px] text-zinc-400 block">Masa Berlaku</span>
                  <span className="text-xs font-semibold text-zinc-200">
                    {new Date(m.expiresAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Belum Berlangganan Paket Reseller</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Pilih paket kuota atau unlimited untuk mendapatkan harga aktivasi grosir dan akses Developer API.
                  </p>
                </div>
                <Link
                  href="/#membership"
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shrink-0"
                >
                  Beli Paket Kuota
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. DEVELOPER API KEY CARD */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Developer REST API Key</h2>
          </div>
          <Link
            href="/developer"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Dokumentasi API</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
          Gunakan API Key ini pada bot WhatsApp, Telegram, atau server backend Anda untuk aktivasi otomatis.
          Permintaan aktivasi akan memotong kuota paket aktif Anda secara otomatis.
        </p>

        <div className="flex items-center gap-2 max-w-xl pt-1">
          <input
            type="text"
            readOnly
            value={dbUser.apiKey || "amp_loading..."}
            className="flex-1 px-3.5 py-2 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-emerald-400 select-all"
          />
          <button
            onClick={copyKey}
            className="px-3.5 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? "Disalin" : "Salin Key"}</span>
          </button>
        </div>
      </div>

      {/* 3. RIWAYAT TRANSAKSI & AKTIVASI */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white">Riwayat Transaksi Pesanan</h2>

        {loadingData ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            Memuat data transaksi...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#121215] border border-[#27272a] text-center text-xs text-zinc-500 font-mono">
            Belum ada pesanan transaksi yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#27272a]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Target / Paket</th>
                  <th className="px-4 py-3">Nominal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23] bg-[#121215]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{ord.invoiceNumber}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {ord.orderType === "SINGLE_VERIFY" ? "Satuan (1x)" : "Membership"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {ord.targetEmail || ord.planName}
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">
                      {formatRupiah(ord.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          ord.status === "COMPLETED"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                            : ord.status === "WAITING_LINK"
                            ? "bg-sky-950/60 text-sky-400 border border-sky-800/60"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/60"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/order/${ord.invoiceNumber}`}
                        className="text-zinc-300 hover:text-white underline text-[11px]"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

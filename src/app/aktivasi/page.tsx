"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Send,
  Loader2,
  Lock,
  ExternalLink,
  HelpCircle,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Sparkles,
  RefreshCw,
  QrCode,
  Key,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

export default function AktivasiPage() {
  const { firebaseUser, dbUser, loading, openAuthModal } = useAuth();
  const router = useRouter();

  // Mode Tab: 'ORDER' (Beli Satuan), 'VERIFY' (Tempel Magic Link), 'MEMBER' (Aktivasi Kuota)
  const [activeTab, setActiveTab] = useState<"ORDER" | "VERIFY" | "MEMBER">("ORDER");

  // Price & Server Status
  const [singlePrice, setSinglePrice] = useState(1000);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Form State: Order Satuan (QRIS)
  const [targetEmail, setTargetEmail] = useState("");
  const [targetNickname, setTargetNickname] = useState("");
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const [singleError, setSingleError] = useState("");

  // Form State: Verifikasi Link (Tempel Magic Link)
  const [verifyInvoice, setVerifyInvoice] = useState("");
  const [verifyLinkInput, setVerifyLinkInput] = useState("");
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
    data?: any;
  }>({ type: "idle", message: "" });

  // Form State: Kuota Member Reseller
  const [memberTargetEmail, setMemberTargetEmail] = useState("");
  const [memberMagicLink, setMemberMagicLink] = useState("");
  const [memberNickname, setMemberNickname] = useState("");
  const [memberSending, setMemberSending] = useState(false);
  const [memberActivating, setMemberActivating] = useState(false);
  const [memberNotice, setMemberNotice] = useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  useEffect(() => {
    // Ambil harga satuan
    axios
      .get("/api/membership/plans")
      .then((res) => {
        if (res.data?.singlePrice !== undefined) setSinglePrice(res.data.singlePrice);
      })
      .catch((err) => console.error("Gagal load harga:", err))
      .finally(() => setLoadingPrice(false));

    // Ambil status server
    axios
      .get("/api/ampro/status")
      .then((res) => setServerOnline(res.data?.status === "online"))
      .catch(() => setServerOnline(false));
  }, []);

  // Switch default to MEMBER if user has active quota
  useEffect(() => {
    if (dbUser?.activeMembership && dbUser.activeMembership.remainingQuota !== 0) {
      setActiveTab("MEMBER");
    }
  }, [dbUser]);

  // Handler: Checkout Lisensi Satuan
  const handleBuySingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError("");

    if (!targetEmail || !targetEmail.includes("@")) {
      setSingleError("Masukkan alamat email Alight Motion yang valid.");
      return;
    }

    try {
      setIsSubmittingSingle(true);
      const res = await axios.post("/api/orders/create", {
        userId: dbUser?.id || undefined,
        orderType: "SINGLE_VERIFY",
        targetEmail: targetEmail.trim(),
        targetNickname: targetNickname.trim() || undefined,
      });

      if (res.data?.order?.invoiceNumber) {
        router.push(`/order/${res.data.order.invoiceNumber}`);
      } else {
        throw new Error("Gagal membuat pesanan.");
      }
    } catch (err: any) {
      setSingleError(err.response?.data?.error || err.message || "Gagal membuat invoice.");
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // Handler: Verifikasi Link Pembeli Satuan
  const handleVerifyInvoiceLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyStatus({ type: "idle", message: "" });

    if (!verifyInvoice.trim()) {
      setVerifyStatus({ type: "error", message: "Nomor invoice wajib diisi." });
      return;
    }
    if (!verifyLinkInput.trim()) {
      setVerifyStatus({ type: "error", message: "Magic link dari email Alight Motion wajib diisi." });
      return;
    }

    try {
      setIsVerifyingLink(true);
      const res = await axios.post("/api/orders/activate", {
        invoiceNumber: verifyInvoice.trim(),
        magicLink: verifyLinkInput.trim(),
      });

      if (res.data?.success) {
        setVerifyStatus({
          type: "success",
          message: "Lisensi Alight Motion Pro 1 Tahun berhasil diaktifkan pada akun Anda.",
          data: res.data.data,
        });
      } else {
        throw new Error(res.data?.error || "Gagal memverifikasi lisensi.");
      }
    } catch (err: any) {
      setVerifyStatus({
        type: "error",
        message: err.response?.data?.error || err.message || "Gagal memproses verifikasi link.",
      });
    } finally {
      setIsVerifyingLink(false);
    }
  };

  // Handler: Kirim Magic Link via Kuota Member
  const handleMemberSendLink = async () => {
    setMemberNotice({ type: "idle", text: "" });
    if (!memberTargetEmail || !memberTargetEmail.includes("@")) {
      setMemberNotice({ type: "error", text: "Masukkan email penerima yang valid." });
      return;
    }

    try {
      setMemberSending(true);
      const res = await axios.post("/api/ampro/send-link", {
        email: memberTargetEmail.trim(),
      });
      if (res.data?.success) {
        setMemberNotice({
          type: "success",
          text: `Magic link berhasil dikirim oleh server ke ${memberTargetEmail}. Cek inbox atau folder spam email Anda.`,
        });
      } else {
        throw new Error(res.data?.message || "Gagal mengirim link aktivasi.");
      }
    } catch (err: any) {
      setMemberNotice({
        type: "error",
        text: err.response?.data?.error || err.message || "Gagal mengirim link ke email.",
      });
    } finally {
      setMemberSending(false);
    }
  };

  // Handler: Submit Aktivasi Potong Kuota Member
  const handleMemberActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberNotice({ type: "idle", text: "" });

    if (!memberMagicLink || !memberMagicLink.includes("alightcreative.com")) {
      setMemberNotice({
        type: "error",
        text: "Masukkan URL magic link valid yang berasal dari alightcreative.com.",
      });
      return;
    }

    try {
      setMemberActivating(true);
      const res = await axios.post("/api/orders/activate", {
        magicLink: memberMagicLink.trim(),
        targetEmail: memberTargetEmail.trim() || undefined,
        nickname: memberNickname.trim() || undefined,
      });

      if (res.data?.success) {
        setMemberNotice({
          type: "success",
          text: `Aktivasi Pro 1 Tahun berhasil. Sisa kuota membership Anda: ${
            res.data?.remainingQuota === -1 ? "Tak Terbatas" : res.data?.remainingQuota
          }.`,
        });
        setMemberMagicLink("");
      } else {
        throw new Error(res.data?.error || "Gagal aktivasi kuota member.");
      }
    } catch (err: any) {
      setMemberNotice({
        type: "error",
        text: err.response?.data?.error || err.message || "Gagal memproses aktivasi member.",
      });
    } finally {
      setMemberActivating(false);
    }
  };

  // Auto pre-fill target email from logged-in user
  useEffect(() => {
    if (firebaseUser?.email && !targetEmail) {
      setTargetEmail(firebaseUser.email);
    }
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Auth Guard: Unauthenticated users MUST NOT access the activation dashboard
  if (!firebaseUser) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="p-8 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white">Login Diperlukan</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Untuk mengakses Dashboard Aktivasi, mencatat riwayat transaksi, dan mengamankan lisensi Anda, silakan masuk atau daftar akun terlebih dahulu.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => openAuthModal("login")}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <User className="w-4 h-4" />
              <span>Masuk ke Akun / Daftar</span>
            </button>
            <Link
              href="/"
              className="w-full py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 font-medium text-xs transition-colors block text-center min-h-[44px] flex items-center justify-center"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header Dashboard Aktivasi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>DASHBOARD AKTIVASI MANDIRI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Aktivasi Alight Motion Pro 1 Tahun
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Pusat pemesanan lisensi eceran, verifikasi magic link, dan aktivasi kuota reseller langsung ke API resmi.
          </p>
        </div>

        {/* Server status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121215] border border-[#27272a] text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              serverOnline === null
                ? "bg-zinc-500"
                : serverOnline
                ? "bg-emerald-500"
                : "bg-rose-500"
            }`}
          />
          <span className="text-zinc-400">
            Node Server:{" "}
            <span className={serverOnline ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {serverOnline === null ? "Memeriksa" : serverOnline ? "Aktif & Siap" : "Gangguan"}
            </span>
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3" role="tablist">
        <button
          onClick={() => setActiveTab("ORDER")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
            activeTab === "ORDER"
              ? "bg-emerald-500 text-black shadow-sm"
              : "bg-[#121215] text-zinc-300 hover:text-white border border-[#27272a]"
          }`}
          role="tab"
          aria-selected={activeTab === "ORDER"}
        >
          <QrCode className="w-4 h-4" />
          <span>1. Beli Lisensi Satuan (QRIS)</span>
        </button>

        <button
          onClick={() => setActiveTab("VERIFY")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
            activeTab === "VERIFY"
              ? "bg-emerald-500 text-black shadow-sm"
              : "bg-[#121215] text-zinc-300 hover:text-white border border-[#27272a]"
          }`}
          role="tab"
          aria-selected={activeTab === "VERIFY"}
        >
          <Key className="w-4 h-4" />
          <span>2. Tempel Magic Link (Verifikasi)</span>
        </button>

        <button
          onClick={() => setActiveTab("MEMBER")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
            activeTab === "MEMBER"
              ? "bg-emerald-500 text-black shadow-sm"
              : "bg-[#121215] text-zinc-300 hover:text-white border border-[#27272a]"
          }`}
          role="tab"
          aria-selected={activeTab === "MEMBER"}
        >
          <Zap className="w-4 h-4" />
          <span>3. Kuota Reseller Member</span>
          {dbUser?.activeMembership && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-black/20 text-black font-mono">
              {dbUser.activeMembership.remainingQuota === -1
                ? "Unlimited"
                : `${dbUser.activeMembership.remainingQuota} sisa`}
            </span>
          )}
        </button>
      </div>

      {/* Main Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: BELI SATUAN */}
          {activeTab === "ORDER" && (
            <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">Form Pemesanan Lisensi Satuan</h2>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    {loadingPrice ? "Memuat..." : formatRupiah(singlePrice)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Pembayaran otomatis via QRIS MustikaPay. Lisensi aktif selama 1 Tahun penuh pada akun pribadi.
                </p>
              </div>

              <form onSubmit={handleBuySingle} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Email Akun Alight Motion <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Pastikan email ini terdaftar atau digunakan login pada aplikasi Alight Motion Anda.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Catatan / Nama Pembeli (Opsional)
                  </label>
                  <input
                    type="text"
                    value={targetNickname}
                    onChange={(e) => setTargetNickname(e.target.value)}
                    placeholder="Contoh: Budi Studio"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
                  />
                </div>

                {singleError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{singleError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingSingle}
                    className="w-full py-3 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isSubmittingSingle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat Tagihan QRIS...</span>
                      </>
                    ) : (
                      <>
                        <span>Lanjut Bayar QRIS ({formatRupiah(singlePrice)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: VERIFIKASI MAGIC LINK */}
          {activeTab === "VERIFY" && (
            <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white">Verifikasi Magic Link Lisensi</h2>
                <p className="text-xs text-zinc-400">
                  Masukkan nomor invoice pembayaran dan tautan verifikasi yang dikirimkan oleh Alight Motion ke email Anda.
                </p>
              </div>

              <form onSubmit={handleVerifyInvoiceLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Nomor Invoice Pembayaran <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyInvoice}
                    onChange={(e) => setVerifyInvoice(e.target.value.toUpperCase())}
                    placeholder="INV-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm font-mono text-emerald-400 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Nomor tagihan yang Anda dapatkan saat checkout QRIS.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Tautan Magic Link dari Email <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={verifyLinkInput}
                    onChange={(e) => setVerifyLinkInput(e.target.value)}
                    placeholder="https://alightcreative.com/auth/action?mode=signIn&oobCode=..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Salin URL tautan dari tombol Masuk di inbox email Alight Motion Anda.
                  </p>
                </div>

                {verifyStatus.type !== "idle" && (
                  <div
                    className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 ${
                      verifyStatus.type === "success"
                        ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300"
                        : "bg-rose-950/40 border border-rose-800/60 text-rose-300"
                    }`}
                  >
                    {verifyStatus.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{verifyStatus.message}</p>
                      {verifyStatus.data && (
                        <p className="text-[11px] text-emerald-400/80 font-mono mt-1">
                          Kedaluwarsa: {verifyStatus.data.expiresAt || "1 Tahun Penuh"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifyingLink}
                    className="w-full py-3 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isVerifyingLink ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Aktivasi Lisensi...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Aktivasi Lisensi Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: KUOTA RESELLER MEMBER */}
          {activeTab === "MEMBER" && (
            <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-5">
              {!firebaseUser ? (
                <div className="text-center py-8 space-y-3">
                  <Lock className="w-8 h-8 text-zinc-500 mx-auto" />
                  <h3 className="text-base font-semibold text-white">Login Diperlukan</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Masuk dengan akun Google Anda untuk mengakses kuota paket reseller membership.
                  </p>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="px-4 py-2.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors min-h-[44px]"
                  >
                    Masuk ke Akun / Daftar
                  </button>
                </div>
              ) : !dbUser?.activeMembership ? (
                <div className="text-center py-8 space-y-3">
                  <Zap className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="text-base font-semibold text-white">Belum Memiliki Paket Reseller</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Akun Anda saat ini belum memiliki paket membership aktif. Beli paket reseller untuk mengaktifkan lisensi tanpa bayar per transaksi.
                  </p>
                  <button
                    onClick={() => router.push("/#membership")}
                    className="px-4 py-2.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors min-h-[44px]"
                  >
                    Lihat Pilihan Paket Reseller
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-zinc-400 block">Paket Aktif:</span>
                      <span className="text-xs font-bold text-white">
                        {dbUser.activeMembership.planName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400 block">Sisa Kuota:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {dbUser.activeMembership.remainingQuota === -1
                          ? "Tak Terbatas"
                          : `${dbUser.activeMembership.remainingQuota} Lisensi`}
                      </span>
                    </div>
                  </div>

                  {/* Step A: Kirim Link */}
                  <div className="space-y-3 border-b border-[#27272a] pb-5">
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Langkah A: Kirim Magic Link ke Email Buyer
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={memberTargetEmail}
                        onChange={(e) => setMemberTargetEmail(e.target.value)}
                        placeholder="buyer@gmail.com"
                        className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={handleMemberSendLink}
                        disabled={memberSending}
                        className="px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-emerald-400 flex items-center gap-1.5 min-h-[44px]"
                      >
                        {memberSending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Kirim Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Step B: Eksekusi Aktivasi Potong Kuota */}
                  <form onSubmit={handleMemberActivate} className="space-y-4">
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Langkah B: Tempel Magic Link & Potong Kuota
                    </span>
                    <textarea
                      required
                      rows={2}
                      value={memberMagicLink}
                      onChange={(e) => setMemberMagicLink(e.target.value)}
                      placeholder="Tempel tautan https://alightcreative.com/... di sini"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />

                    {memberNotice.type !== "idle" && (
                      <div
                        className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                          memberNotice.type === "success"
                            ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300"
                            : "bg-rose-950/40 border border-rose-800/60 text-rose-300"
                        }`}
                      >
                        {memberNotice.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <span>{memberNotice.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={memberActivating}
                      className="w-full py-3 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {memberActivating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengaktifkan Akun...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Aktifkan Pro (Potong 1 Kuota)</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Panduan Ringkas & Info Teknis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="flex items-center gap-2 text-zinc-200">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Cara Mengambil Magic Link
              </h3>
            </div>
            <ol className="text-xs text-zinc-400 space-y-2.5 list-decimal pl-4">
              <li>
                Buka aplikasi <strong className="text-zinc-200">Alight Motion</strong> pada perangkat Android/iOS Anda.
              </li>
              <li>
                Masuk ke menu <strong className="text-zinc-200">Profil Akun</strong> &rarr; pilih metode <strong className="text-zinc-200">Masuk dengan Email</strong>.
              </li>
              <li>
                Masukkan alamat email yang Anda daftarkan di form aktivasi.
              </li>
              <li>
                Buka pesan masuk email dari Alight Motion, <strong className="text-zinc-200">salin tautan</strong> (copy link address) dari tombol login.
              </li>
              <li>
                Tempel link tersebut di form Tab 2 (Verifikasi) lalu klik tombol Aktivasi.
              </li>
            </ol>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="flex items-center gap-2 text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Garansi Lisensi Resmi
              </h3>
            </div>
            <ul className="text-xs text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>Lisensi langsung terhubung ke server resmi Alight Motion, bukan modifikasi aplikasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>Berlaku 1 Tahun penuh dengan dukungan login multi-device.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>Bebas watermark dan dapat mengekspor video resolusi 4K 60FPS.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

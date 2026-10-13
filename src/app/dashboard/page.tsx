"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
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
  ShieldCheck,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Eye,
  EyeOff,
  Send,
  Printer,
  X,
  CreditCard,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import UserAvatar from "@/components/ui/UserAvatar";

type TabType = "overview" | "orders" | "reseller" | "api";

export default function UserDashboardPage() {
  const { firebaseUser, dbUser, loading, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");

  // Copy states
  const [copiedKey, setCopiedKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  // Orders filter & search
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // Struk Modal state
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Reseller Message Generator State
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [selectedTemplateType, setSelectedTemplateType] = useState<"request_link" | "success_receipt" | "login_guide">("request_link");

  // Reseller Direct Activation State
  const [directEmail, setDirectEmail] = useState("");
  const [directMagicLink, setDirectMagicLink] = useState("");
  const [directSendingLink, setDirectSendingLink] = useState(false);
  const [directActivating, setDirectActivating] = useState(false);
  const [directNotice, setDirectNotice] = useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  // Escape key handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedReceiptOrder(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadUserData = () => {
    if (!dbUser?.id) return;
    setLoadingData(true);
    setDataError("");

    axios
      .get(`/api/user/history?userId=${dbUser.id}`)
      .then((res) => {
        if (res.data?.success) {
          setOrders(res.data.orders || []);
          setActivations(res.data.activations || []);
        } else {
          setDataError("Gagal memuat data riwayat pengguna.");
        }
      })
      .catch((err) => {
        console.error("Gagal memuat riwayat:", err);
        setDataError("Terjadi kendala saat menyinkronkan data riwayat.");
      })
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    loadUserData();
  }, [dbUser?.id]);

  const copyKey = () => {
    if (!dbUser?.apiKey) return;
    navigator.clipboard.writeText(dbUser.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        orderSearch.trim() === "" ||
        ord.invoiceNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.targetEmail?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.planName?.toLowerCase().includes(orderSearch.toLowerCase());

      const matchStatus =
        orderStatusFilter === "ALL" || ord.status === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Reseller WhatsApp Template Text Generator
  const generatedWhatsAppMessage = useMemo(() => {
    const nameStr = buyerName.trim() || "[Nama Pembeli]";
    const emailStr = buyerEmail.trim() || "[Email Alight Motion Pembeli]";
    const storeName = "Enchant Store";

    if (selectedTemplateType === "request_link") {
      return (
        `Halo kak ${nameStr},\n\n` +
        `Terima kasih telah memesan Alight Motion Pro 1 Tahun di ${storeName}.\n\n` +
        `Berikut instruksi untuk proses aktivasi lisensi:\n` +
        `1. Buka kotak masuk email (${emailStr}) atau cek folder Spam.\n` +
        `2. Cari email masuk dari Alight Creative dengan subjek verifikasi login.\n` +
        `3. JANGAN KLIK langsung link di dalam email.\n` +
        `4. Salin (Copy link address) tautan yang ada pada tombol verifikasi email tersebut.\n` +
        `5. Kirimkan tautan tersebut kembali ke chat ini untuk kami proses dalam 1 menit.\n\n` +
        `Jika email belum masuk, mohon beri tahu kami.`
      );
    }

    if (selectedTemplateType === "success_receipt") {
      const dateStr = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return (
        `BUKTI AKTIVASI ALIGHT MOTION PRO\n` +
        `Penyedia: ${storeName}\n` +
        `Tanggal: ${dateStr}\n\n` +
        `Halo kak ${nameStr},\n` +
        `Akun Alight Motion Anda telah BERHASIL diaktifkan ke paket Pro 1 Tahun resmi.\n\n` +
        `Rincian Akun:\n` +
        `Email Akun: ${emailStr}\n` +
        `Durasi: 1 Tahun Penuh (Tanpa Watermark, Fitur Pro Terbuka)\n` +
        `Status Garansi: Aktif (Garansi Resmi Penggantian Akun)\n\n` +
        `Catatan Penting:\n` +
        `- Pastikan login di aplikasi resmi Alight Motion menggunakan email di atas.\n` +
        `- Simpan pesan ini sebagai bukti jaminan layanan kami.\n\n` +
        `Terima kasih atas kepercayaannya.`
      );
    }

    if (selectedTemplateType === "login_guide") {
      return (
        `PANDUAN LOGIN ALIGHT MOTION PRO\n\n` +
        `Halo kak ${nameStr}, berikut langkah login ke aplikasi:\n` +
        `1. Buka aplikasi Alight Motion di perangkat Anda.\n` +
        `2. Klik ikon Akun di pojok kanan atas.\n` +
        `3. Pilih Masuk / Sign In dengan Email.\n` +
        `4. Masukkan email: ${emailStr}\n` +
        `5. Buka email Anda, klik tautan konfirmasi masuk.\n` +
        `6. Buka kembali Alight Motion, status akan otomatis berubah menjadi Member Pro.\n\n` +
        `Selamat berkarya tanpa watermark.`
      );
    }

    return "";
  }, [buyerName, buyerEmail, selectedTemplateType]);

  const copyTemplateText = () => {
    navigator.clipboard.writeText(generatedWhatsAppMessage);
    setCopiedTemplate(selectedTemplateType);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  // Generate Receipt Text from Order
  const generateReceiptText = (ord: any) => {
    if (!ord) return "";
    const createdDate = ord.createdAt
      ? new Date(ord.createdAt).toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    return (
      `STRUK TRANSAKSI DIGITAL ENCHANT STORE\n` +
      `Nomor Invoice: ${ord.invoiceNumber}\n` +
      `Tanggal: ${createdDate}\n` +
      `Tipe Layanan: ${ord.orderType === "SINGLE_VERIFY" ? "Lisensi Satuan Alight Motion Pro 1 Tahun" : `Paket Reseller (${ord.planName || "Membership"})`}\n` +
      `Target Akun: ${ord.targetEmail || ord.planName || "-"}\n` +
      `Total Pembayaran: ${formatRupiah(ord.amount)}\n` +
      `Status Transaksi: ${ord.status}\n` +
      `Metode: QRIS Otomatis\n\n` +
      `Jaminan: Lisensi resmi durasi 1 tahun dengan dukungan garansi penuh.\n` +
      `Tautan Verifikasi: https://jual-am.vercel.app/order/${ord.invoiceNumber}`
    );
  };

  const copyReceiptText = (ord: any) => {
    const text = generateReceiptText(ord);
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  // Handler: Reseller Direct Send Magic Link
  const handleDirectSendLink = async () => {
    setDirectNotice({ type: "idle", text: "" });
    if (!directEmail || !directEmail.includes("@")) {
      setDirectNotice({
        type: "error",
        text: "Masukkan alamat email penerima yang valid.",
      });
      return;
    }

    try {
      setDirectSendingLink(true);
      const res = await axios.post("/api/ampro/send-link", {
        email: directEmail.trim(),
      });
      if (res.data?.success) {
        setDirectNotice({
          type: "success",
          text: `Magic link berhasil dikirim oleh server ke ${directEmail}. Minta pembeli untuk menyalin tautan dari email tanpa mengkliknya.`,
        });
      } else {
        throw new Error(res.data?.message || "Gagal mengirim link verifikasi.");
      }
    } catch (err: any) {
      setDirectNotice({
        type: "error",
        text: err.response?.data?.error || err.message || "Gagal memproses pengiriman link ke email.",
      });
    } finally {
      setDirectSendingLink(false);
    }
  };

  // Handler: Reseller Direct Activate
  const handleDirectActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectNotice({ type: "idle", text: "" });

    if (!directEmail || !directEmail.includes("@")) {
      setDirectNotice({
        type: "error",
        text: "Masukkan alamat email Alight Motion target.",
      });
      return;
    }

    if (!directMagicLink || !directMagicLink.includes("alightcreative.com")) {
      setDirectNotice({
        type: "error",
        text: "Tautan harus berasal dari domain resmi alightcreative.com.",
      });
      return;
    }

    if (!dbUser?.apiKey) {
      setDirectNotice({
        type: "error",
        text: "Akun Anda belum memiliki paket reseller aktif atau API Key.",
      });
      return;
    }

    try {
      setDirectActivating(true);
      const res = await axios.post(
        "/api/v1/activate",
        {
          email: directEmail.trim(),
          magicLink: directMagicLink.trim(),
        },
        {
          headers: {
            "x-api-key": dbUser.apiKey,
          },
        }
      );

      if (res.data?.success) {
        setDirectNotice({
          type: "success",
          text: `Aktivasi Pro 1 Tahun berhasil. Sisa kuota membership: ${
            res.data?.quota?.isUnlimited ? "Tak Terbatas" : res.data?.quota?.remaining
          }.`,
        });
        setDirectMagicLink("");
        loadUserData();
      } else {
        throw new Error(res.data?.error || "Aktivasi tidak dapat diproses.");
      }
    } catch (err: any) {
      setDirectNotice({
        type: "error",
        text: err.response?.data?.error || err.message || "Gagal mengaktifkan lisensi kuota.",
      });
    } finally {
      setDirectActivating(false);
    }
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
          Silakan masuk atau daftar akun untuk melihat riwayat aktivasi, kuota membership, alat reseller, dan API Key Anda.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors min-h-[44px]"
        >
          Masuk ke Akun atau Daftar
        </button>
      </div>
    );
  }

  const m = dbUser.activeMembership;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 1. TOP HEADER & NAVIGATION TABS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Portal Pengguna & Reseller</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Kelola status lisensi Alight Motion Pro, kuota membership, riwayat struk pesanan, dan integrasi API.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/aktivasi"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Zap className="w-4 h-4" />
              <span>Aktivasi Instan</span>
            </Link>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#1f1f23]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "overview"
                ? "bg-[#18181b] text-white border border-[#27272a]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <User className="w-4 h-4 text-emerald-400" />
            <span>Ikhtisar Akun</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "orders"
                ? "bg-[#18181b] text-white border border-[#27272a]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CreditCard className="w-4 h-4 text-sky-400" />
            <span>Riwayat Pesanan</span>
            <span className="px-1.5 py-0.2 rounded bg-[#27272a] text-[10px] text-zinc-300 font-mono">
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("reseller")}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "reseller"
                ? "bg-[#18181b] text-white border border-[#27272a]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Alat Reseller (Format Chat)</span>
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === "api"
                ? "bg-[#18181b] text-white border border-[#27272a]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Integrasi API</span>
          </button>
        </div>
      </div>

      {/* 2. TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Profile & Membership Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Profile Card */}
            <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Profil Pengguna
              </span>
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={dbUser.photoUrl || firebaseUser?.photoURL}
                  name={dbUser.displayName || firebaseUser?.displayName}
                  size="lg"
                />
                <div className="overflow-hidden">
                  <h2 className="text-sm font-bold text-white truncate">
                    {dbUser.displayName || "Pelanggan Terdaftar"}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono truncate">{dbUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-300 font-mono">
                      Peran: {dbUser.role}
                    </span>
                    {dbUser.role === "admin" && (
                      <Link
                        href="/admin"
                        className="text-[10px] text-emerald-400 hover:underline font-mono"
                      >
                        Buka Admin
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Status Card */}
            <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23] mb-3">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                    Status Paket Membership
                  </span>
                  <Link
                    href="/#membership"
                    className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>Pilihan Paket Reseller</span>
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
                        {m.remainingQuota === -1 ? "Tak Terbatas (Unlimited)" : `${m.remainingQuota} aktivasi`}
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
                        Dapatkan harga grosir aktivasi dan akses Developer REST API otomatis dengan berlangganan paket kuota.
                      </p>
                    </div>
                    <Link
                      href="/#membership"
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shrink-0 min-h-[44px] flex items-center"
                    >
                      Beli Paket Reseller
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
              <span className="text-[11px] text-zinc-500 font-mono uppercase">Total Pesanan</span>
              <p className="text-lg font-bold text-white font-mono">{orders.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
              <span className="text-[11px] text-zinc-500 font-mono uppercase">Aktivasi Selesai</span>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                {orders.filter((o) => o.status === "COMPLETED").length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
              <span className="text-[11px] text-zinc-500 font-mono uppercase">Sisa Kuota Member</span>
              <p className="text-lg font-bold text-sky-400 font-mono">
                {m ? (m.remainingQuota === -1 ? "Tak Terbatas" : m.remainingQuota) : 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
              <span className="text-[11px] text-zinc-500 font-mono uppercase">Status API Key</span>
              <p className="text-sm font-semibold text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>{dbUser.apiKey ? "Siap Digunakan" : "Belum Dibuat"}</span>
              </p>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Pesanan Terbaru
              </h2>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua Pesanan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] text-center text-xs text-zinc-500 font-mono">
                Belum ada transaksi pesanan yang dibuat.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {orders.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">
                          {ord.invoiceNumber}
                        </span>
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
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 truncate">
                        {ord.targetEmail || ord.planName || "Aktivasi Satuan"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#1f1f23]">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatRupiah(ord.amount)}
                      </span>
                      <Link
                        href={`/order/${ord.invoiceNumber}`}
                        className="text-xs text-zinc-300 hover:text-white underline"
                      >
                        Buka Invoice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB: RIWAYAT PESANAN */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#121215] border border-[#27272a]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nomor invoice, email target, atau paket..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              >
                <option value="ALL">Semua Status</option>
                <option value="COMPLETED">Selesai (COMPLETED)</option>
                <option value="WAITING_LINK">Menunggu Link (WAITING_LINK)</option>
                <option value="PENDING">Menunggu Bayar (PENDING)</option>
                <option value="EXPIRED">Kadaluarsa (EXPIRED)</option>
                <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
              </select>
            </div>
          </div>

          {loadingData ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-mono flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Memuat data riwayat transaksi pesanan...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#121215] border border-[#27272a] text-center space-y-2">
              <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold text-zinc-300">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-zinc-500">
                {orderSearch || orderStatusFilter !== "ALL"
                  ? "Coba ubah kata kunci pencarian atau filter status pesanan."
                  : "Anda belum pernah melakukan pemesanan aktivasi atau paket kuota."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-[#27272a]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Target Akun / Paket</th>
                      <th className="px-4 py-3">Nominal</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f23] bg-[#121215]">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#18181b]/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{ord.invoiceNumber}</td>
                        <td className="px-4 py-3 text-zinc-300">
                          {ord.orderType === "SINGLE_VERIFY" ? "Satuan (1x)" : "Membership"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 truncate max-w-[200px]">
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
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-[11px] transition-colors"
                          >
                            Struk
                          </button>
                          <Link
                            href={`/order/${ord.invoiceNumber}`}
                            className="px-2.5 py-1 rounded bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-400 text-[11px] transition-colors"
                          >
                            Buka
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW (Responsive R-03: No horizontal scroll on phone) */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">
                        {ord.invoiceNumber}
                      </span>
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
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Tipe:</span>
                        <span className="text-zinc-200">
                          {ord.orderType === "SINGLE_VERIFY" ? "Satuan (1x)" : "Membership"}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Target:</span>
                        <span className="text-zinc-200 truncate max-w-[180px]">
                          {ord.targetEmail || ord.planName}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400 font-mono">
                        <span>Nominal:</span>
                        <span className="text-emerald-400 font-bold">
                          {formatRupiah(ord.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#1f1f23]">
                      <button
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="flex-1 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Struk</span>
                      </button>
                      <Link
                        href={`/order/${ord.invoiceNumber}`}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <span>Buka Invoice</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. TAB: ALAT RESELLER (CHAT GENERATOR & DIRECT ACTIVATION) */}
      {activeTab === "reseller" && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Alat Bantu Reseller & Format Pesan Otomatis
              </h2>
              <p className="text-xs text-zinc-400">
                Gunakan template percakapan instan untuk melayani konsumen WhatsApp atau Telegram dengan cepat dan rapi.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-zinc-400">Sisa Kuota:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono text-xs font-bold">
                {m ? (m.remainingQuota === -1 ? "Tak Terbatas" : `${m.remainingQuota}x`) : "0x"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: WhatsApp Message Generator */}
            <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1f1f23]">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Generator Format Chat WhatsApp
                </h3>
              </div>

              {/* Template Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateType("request_link")}
                  className={`p-2 rounded-lg text-[11px] font-medium border text-center transition-colors min-h-[44px] flex flex-col items-center justify-center ${
                    selectedTemplateType === "request_link"
                      ? "bg-emerald-950/40 border-emerald-600 text-emerald-300"
                      : "bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>Minta Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateType("success_receipt")}
                  className={`p-2 rounded-lg text-[11px] font-medium border text-center transition-colors min-h-[44px] flex flex-col items-center justify-center ${
                    selectedTemplateType === "success_receipt"
                      ? "bg-emerald-950/40 border-emerald-600 text-emerald-300"
                      : "bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>Bukti Sukses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateType("login_guide")}
                  className={`p-2 rounded-lg text-[11px] font-medium border text-center transition-colors min-h-[44px] flex flex-col items-center justify-center ${
                    selectedTemplateType === "login_guide"
                      ? "bg-emerald-950/40 border-emerald-600 text-emerald-300"
                      : "bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>Panduan Login</span>
                </button>
              </div>

              {/* Dynamic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400">Nama Pembeli:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400">Email Akun Pembeli:</label>
                  <input
                    type="email"
                    placeholder="contoh@gmail.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Hasil Format Pesan:</span>
                  <button
                    onClick={copyTemplateText}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium min-h-[32px]"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTemplate ? "Berhasil Disalin" : "Salin Pesan"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={9}
                  value={generatedWhatsAppMessage}
                  className="w-full p-3 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 focus:outline-none select-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right: Quick Direct Activation Form */}
            <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1f1f23]">
                <Zap className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Aktivasi Kuota Reseller Cepat
                </h3>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Aktifkan akun konsumen langsung dari portal ini tanpa berpindah halaman. Kuota membership Anda akan dipotong 1 aktivasi per transaksi.
              </p>

              {directNotice.text && (
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    directNotice.type === "success"
                      ? "bg-emerald-950/40 border border-emerald-800/80 text-emerald-300"
                      : "bg-red-950/40 border border-red-800/80 text-red-300"
                  }`}
                >
                  {directNotice.text}
                </div>
              )}

              <form onSubmit={handleDirectActivate} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400">
                    1. Alamat Email Akun Target:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="emailtarget@gmail.com"
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={handleDirectSendLink}
                      disabled={directSendingLink || !directEmail}
                      className="px-3.5 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 min-h-[44px]"
                    >
                      {directSendingLink ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Kirim Link</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400">
                    2. Tempelkan Magic Link (alightcreative.com):
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="https://alightcreative.com/action/auth/verify?..."
                    value={directMagicLink}
                    onChange={(e) => setDirectMagicLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={directActivating || !directMagicLink || !m || m.remainingQuota === 0}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {directActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Aktivasi Lisensi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aktifkan Pro 1 Tahun Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: DEVELOPER API KEY */}
      {activeTab === "api" && (
        <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1f1f23]">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Developer REST API Key</h2>
            </div>
            <Link
              href="/developer"
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors min-h-[32px]"
            >
              <span>Dokumentasi Lengkap API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Gunakan API Key ini pada bot WhatsApp, bot Telegram, atau backend Anda untuk aktivasi otomatis.
            Setiap pemanggilan endpoint aktivasi akan memotong 1 kuota paket aktif Anda secara otomatis.
          </p>

          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-mono text-zinc-400">API Key Anda:</span>
            <div className="flex items-center gap-2">
              <input
                type={showApiKey ? "text" : "password"}
                readOnly
                value={dbUser.apiKey || "amp_belum_dibuat"}
                className="flex-1 px-3.5 py-2 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-emerald-400 select-all min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                title={showApiKey ? "Sembunyikan Key" : "Tampilkan Key"}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={copyKey}
                className="px-3.5 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-colors shrink-0 min-h-[44px]"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? "Disalin" : "Salin Key"}</span>
              </button>
            </div>
          </div>

          {/* Quick Snippets */}
          <div className="space-y-3 pt-4 border-t border-[#1f1f23]">
            <span className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider block">
              Contoh Pemanggilan Endpoint Aktivasi (cURL)
            </span>
            <pre className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`curl -X POST https://jual-am.vercel.app/api/v1/activate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${dbUser.apiKey || "amp_your_api_key_here"}" \\
  -d '{
    "email": "customer@gmail.com",
    "magicLink": "https://alightcreative.com/action/auth/verify?..."
  }'`}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL: STRUK DIGITAL TRANSAKSI (Accessible & R-32 Keyboard Escape) */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-[#121215] border border-[#27272a] p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-[#18181b] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                Struk Transaksi Resmi
              </span>
              <h3 className="text-base font-bold text-white font-mono">
                {selectedReceiptOrder.invoiceNumber}
              </h3>
            </div>

            <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Tanggal:</span>
                <span className="text-zinc-200">
                  {new Date(selectedReceiptOrder.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tipe Layanan:</span>
                <span className="text-zinc-200">
                  {selectedReceiptOrder.orderType === "SINGLE_VERIFY"
                    ? "Satuan Pro 1 Tahun"
                    : "Paket Reseller"}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Target Akun:</span>
                <span className="text-zinc-200 truncate max-w-[180px]">
                  {selectedReceiptOrder.targetEmail || selectedReceiptOrder.planName || "-"}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedReceiptOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-[#27272a]">
                <span className="font-bold text-white">Total Bayar:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatRupiah(selectedReceiptOrder.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => copyReceiptText(selectedReceiptOrder)}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                {copiedReceipt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedReceipt ? "Teks Struk Berhasil Disalin" : "Salin Rincian Struk untuk Konsumen"}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

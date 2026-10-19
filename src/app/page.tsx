"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  Zap,
  Package,
  Layers,
  HelpCircle,
  Copy,
  Terminal,
  ExternalLink,
  Sparkles,
  Smartphone,
  Video,
  Clock,
  ChevronRight,
  Code2,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { createClientQris } from "@/lib/mustikapay-client";

interface MembershipPlanItem {
  id: string;
  slug: string;
  name: string;
  quota: number;
  durationMonths: number;
  price: number;
  description: string;
  badgeText?: string;
}

export default function HomePage() {
  const { firebaseUser, dbUser, openAuthModal } = useAuth();
  const router = useRouter();

  const [singlePrice, setSinglePrice] = useState(1500);
  const [instantPrice, setInstantPrice] = useState(1000);
  const [plans, setPlans] = useState<MembershipPlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeLang, setActiveLang] = useState<"curl" | "node" | "python">("curl");

  // Fetch plans & prices
  useEffect(() => {
    axios
      .get("/api/membership/plans")
      .then((res) => {
        if (res.data?.singlePrice !== undefined) setSinglePrice(res.data.singlePrice);
        if (res.data?.instantPrice !== undefined) setInstantPrice(res.data.instantPrice);
        if (res.data?.plans) setPlans(res.data.plans);
      })
      .catch((err) => console.error("Gagal memuat paket:", err))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleBuyPlan = async (planSlug: string) => {
    if (!firebaseUser) {
      openAuthModal("login");
      return;
    }

    try {
      const selectedPlan = plans.find((p) => p.slug === planSlug);
      const qrisData = selectedPlan ? await createClientQris(selectedPlan.price) : null;

      const res = await axios.post("/api/orders/create", {
        userId: dbUser?.id || undefined,
        firebaseUid: firebaseUser.uid,
        userEmail: firebaseUser.email,
        userDisplayName: firebaseUser.displayName || undefined,
        orderType: "MEMBERSHIP",
        planSlug,
        qrisData: qrisData || undefined,
      });
      if (res.data?.order?.invoiceNumber) {
        router.push(`/order/${res.data.order.invoiceNumber}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal membuat invoice paket");
    }
  };

  const copyCurl = () => {
    const text = `curl -X POST https://enchant-store.com/api/v1/activate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"magicLink": "https://alightcreative.com/auth/action?mode=signIn&oobCode=..."}'`;
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO / SAMBUTAN UTAMA */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Selamat Datang di Enchant Store Resmi</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Aktivasi Lisensi Resmi <br className="hidden sm:inline" />
          <span className="text-emerald-400">Alight Motion Pro 1 Tahun</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Platform otomatis untuk kreator konten dan reseller. Nikmati akun pribadi resmi Alight Motion Pro 1 Tahun penuh tanpa modifikasi aplikasi, bebas watermark, dan ekspor 4K 60FPS.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {firebaseUser ? (
            <Link
              href="/aktivasi"
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Buka Dashboard Aktivasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal("login")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Masuk untuk Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <a
            href="#membership"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Lihat Paket Reseller</span>
          </a>
        </div>

        {/* Stats & Key Highlights */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block">Tarif Mulai</span>
            <span className="text-base font-bold text-emerald-400">{formatRupiah(instantPrice)}</span>
            <span className="text-[10px] text-zinc-400 block">Akun Siap Pakai Pro 1 Tahun</span>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block">Waktu Proses</span>
            <span className="text-base font-bold text-white">&lt; 60 Detik</span>
            <span className="text-[10px] text-zinc-400 block">Otomatisasi API Ampro</span>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block">Metode Bayar</span>
            <span className="text-base font-bold text-white">QRIS Instan</span>
            <span className="text-[10px] text-zinc-400 block">Didukung seluruh e-wallet</span>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block">Jenis Akun</span>
            <span className="text-base font-bold text-white">Pribadi / Web</span>
            <span className="text-[10px] text-zinc-400 block">Bukan akun sharing</span>
          </div>
        </div>
      </section>

      {/* 2. KEUNGGULAN LAYANAN KAMI */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Mengapa Menggunakan Enchant Store?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Standar lisensi premium resmi yang aman, stabil, dan siap pakai untuk kebutuhan profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Lisensi Resmi Server AM</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bukan aplikasi modifikasi (APK Mod) yang rentan malware atau banned. Akun Anda diverifikasi langsung melalui server resmi Alight Creative.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Fitur Pro Lengkap</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bebas watermark Alight Motion, akses penuh ke semua efek premium, preset XML, font kustom, serta ekspor video hingga resolusi 4K pada 60 FPS.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Device Support</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dapat digunakan di Android dan iPhone/iPad. Lisensi terikat pada alamat email Anda dan dapat dipindahkan antar perangkat dengan mudah.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ALUR KERJA AKTIVASI (4 LANGKAH SEDERHANA) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-zinc-400 text-xs font-mono">
            <span>PANDUAN OPERASIONAL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            4 Langkah Mudah Aktivasi Lisensi
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Proses verifikasi dilakukan langsung secara instan tanpa perlu menunggu admin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#18181b] border border-[#27272a] text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
              01
            </span>
            <h3 className="text-sm font-semibold text-white">Pilih Jenis Akun</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pilih Akun Siap Pakai (@enchant.id) hanya {formatRupiah(instantPrice)} atau gunakan email Gmail pribadi Anda.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#18181b] border border-[#27272a] text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
              02
            </span>
            <h3 className="text-sm font-semibold text-white">Bayar Tagihan QRIS</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Scan QRIS resmi menggunakan BCA, Mandiri, BRI, GoPay, OVO, atau Dana dengan verifikasi pembayaran instan.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#18181b] border border-[#27272a] text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
              03
            </span>
            <h3 className="text-sm font-semibold text-white">Buka Aplikasi Alight</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Buka aplikasi Alight Motion di HP, masukkan email Anda, dan minta link login. Pesan verifikasi masuk otomatis terdeteksi di web.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#18181b] border border-[#27272a] text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
              04
            </span>
            <h3 className="text-sm font-semibold text-white">Klik Tombol & Login</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cukup tekan tombol &ldquo;Buka &amp; Login ke Alight Motion&rdquo; untuk langsung masuk ke aplikasi dengan status VIP Pro 1 Tahun aktif.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/aktivasi"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Mulai aktivasi sekarang di Dashboard Aktivasi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. PAKET KEMITRAAN & MEMBERSHIP RESELLER */}
      <section id="membership" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-emerald-400 text-xs font-mono">
            <Package className="w-3.5 h-3.5" />
            <span>KEMITRAAN & RESELLER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Pilihan Paket Kuota Reseller
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Dapatkan harga modal lebih hemat per unit dan integrasikan ke website atau bot jualan Anda dengan API.
          </p>
        </div>

        {loadingPlans ? (
          <div className="text-center py-12 text-zinc-500 font-mono text-xs">
            Memuat daftar paket membership...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const unitCost =
                plan.quota > 0 ? Math.round(plan.price / plan.quota) : null;

              return (
                <div
                  key={plan.id}
                  className="flex flex-col justify-between p-6 rounded-xl bg-[#121215] border border-[#27272a] hover:border-zinc-700 transition-colors space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        {plan.durationMonths} Bulan Aktif
                      </span>
                      {plan.badgeText && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          {plan.badgeText}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono text-white">
                          {formatRupiah(plan.price)}
                        </span>
                      </div>
                      {unitCost && (
                        <span className="text-[11px] font-mono text-emerald-400/80 block mt-0.5">
                          HPP: {formatRupiah(unitCost)} per unit
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-[#27272a]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {plan.quota === -1 ? "Aktivasi Tak Terbatas" : `${plan.quota} Kuota Lisensi`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Durasi {plan.durationMonths} Bulan Masa Aktif</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Akses API Developer Key</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Potong Kuota Instan di Dashboard</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBuyPlan(plan.slug)}
                    className="w-full py-2.5 rounded-lg bg-[#18181b] hover:bg-emerald-500 hover:text-black border border-[#27272a] hover:border-emerald-500 text-xs font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Pilih Paket Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. INTEGRASI DEVELOPER REST API PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121215] border border-[#27272a] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-zinc-300 text-xs font-mono mb-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>INTEGRASI WEBSITE TOKO / BOT</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Otomatisasi Pembelian dengan REST API
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Bagi pemilik web top up atau bot WhatsApp, gunakan API Key akun reseller Anda untuk mengaktifkan lisensi pelanggan secara instan via endpoint JSON.
              </p>
            </div>

            <Link
              href="/developer"
              className="px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-emerald-400 flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <span>Dokumentasi Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Terminal Snippet */}
          <div className="rounded-xl bg-[#09090b] border border-[#27272a] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#27272a] flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>POST /api/v1/activate</span>
              </span>
              <button
                onClick={copyCurl}
                className="hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSnippet ? "Tersalin" : "Salin cURL"}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              <code>{`curl -X POST https://enchant-store.com/api/v1/activate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"magicLink": "https://alightcreative.com/auth/action?mode=signIn&oobCode=..."}'`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* 6. FAQ (PERTANYAAN UMUM) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Hal-hal mendasar seputar lisensi Alight Motion Pro di Enchant Store.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
            <h3 className="text-sm font-semibold text-white">Apakah ini aplikasi modifikasi (Mod APK)?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bukan. Ini adalah lisensi resmi yang diproses langsung ke server Alight Creative. Anda mengunduh aplikasi Alight Motion resmi langsung dari Google Play Store atau Apple App Store.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
            <h3 className="text-sm font-semibold text-white">Berapa lama masa aktif lisensi?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Lisensi aktif selama 1 Tahun (365 hari) penuh pada akun email pribadi yang Anda daftarkan saat proses aktivasi.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
            <h3 className="text-sm font-semibold text-white">Apakah bisa dipakai di iOS dan Android sekaligus?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ya, lisensi terikat pada akun email Anda. Anda dapat login dengan akun yang sama di perangkat iOS maupun Android Anda.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
            <h3 className="text-sm font-semibold text-white">Bagaimana cara kerja paket reseller?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reseller membeli kuota grosir dengan harga lebih terjangkau. Kuota tersebut dapat digunakan untuk aktivasi email pembeli kapan saja melalui Dashboard Aktivasi atau API otomatis tanpa harus bayar per transaksi lagi.
            </p>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM BANNER SAMBUTAN PENUTUP */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 rounded-2xl bg-gradient-to-b from-[#18181b] to-[#121215] border border-[#27272a] text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Siap Mengaktifkan Akun Alight Motion Anda?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Gunakan Dashboard Aktivasi sekarang untuk pemesanan satuan atau hubungkan API reseller Anda.
          </p>
          <div className="pt-2">
            {firebaseUser ? (
              <Link
                href="/aktivasi"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors min-h-[44px]"
              >
                <Zap className="w-4 h-4" />
                <span>Buka Dashboard Aktivasi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors min-h-[44px]"
              >
                <Zap className="w-4 h-4" />
                <span>Masuk Akun & Buka Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

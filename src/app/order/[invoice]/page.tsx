"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoice = params?.invoice as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [magicLink, setMagicLink] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [simulatingPay, setSimulatingPay] = useState(false);

  // Polling data order setiap 3 detik jika status PENDING atau WAITING_LINK
  useEffect(() => {
    if (!invoice) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${invoice}`);
        if (res.data?.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error("Gagal load order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [invoice]);

  // Handle Submit Activate Magic Link (Khusus Single Verify)
  const handleActivateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivateError("");

    if (!magicLink.trim()) {
      setActivateError("Tempelkan link login lengkap dari email Alight Motion Anda.");
      return;
    }

    try {
      setActivating(true);
      const res = await axios.post("/api/orders/activate", {
        invoiceNumber: invoice,
        magicLink: magicLink.trim(),
      });

      if (res.data?.success) {
        const updated = await axios.get(`/api/orders/${invoice}`);
        setOrder(updated.data.order);
      }
    } catch (err: any) {
      setActivateError(err.response?.data?.error || err.message || "Gagal verifikasi link lisensi.");
    } finally {
      setActivating(false);
    }
  };

  // Handle Resend Link
  const handleResendLink = async () => {
    if (!order?.targetEmail) return;
    try {
      setResending(true);
      setResendNotice("");
      const res = await axios.post("/api/ampro/send-link", { email: order.targetEmail });
      if (res.data?.success) {
        setResendNotice("Link login baru telah dikirim ke email. Periksa inbox atau folder spam.");
      }
    } catch (err: any) {
      setResendNotice(err.response?.data?.error || "Gagal mengirim ulang link.");
    } finally {
      setResending(false);
    }
  };

  // Handle Simulasi Bayar Lunas (Dev & Testing Mode)
  const handleSimulatePayment = async () => {
    try {
      setSimulatingPay(true);
      const res = await axios.post("/api/orders/simulate-pay", { invoiceNumber: invoice });
      if (res.data?.success) {
        const updated = await axios.get(`/api/orders/${invoice}`);
        setOrder(updated.data.order);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal simulasi bayar");
    } finally {
      setSimulatingPay(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Memeriksa status pesanan...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-xl bg-[#121215] border border-[#27272a] text-center space-y-4">
        <h2 className="text-base font-bold text-white">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-400">Nomor invoice {invoice} tidak terdaftar di sistem.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-medium border border-[#27272a]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";
  const isWaitingLink = order.status === "WAITING_LINK";
  const isCompleted = order.status === "COMPLETED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {/* HEADER STATUS PESANAN */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Invoice:</span>
            <span className="text-xs font-mono font-bold text-white">{order.invoiceNumber}</span>
            <button
              onClick={() => copyToClipboard(order.invoiceNumber)}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
              title="Salin Invoice"
              aria-label="Salin nomor invoice"
            >
              {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h1 className="text-base font-bold text-white mt-1">
            {order.orderType === "SINGLE_VERIFY"
              ? "Aktivasi Lisensi Satuan Alight Motion Pro (1 Tahun)"
              : `Paket Membership: ${order.planName}`}
          </h1>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-zinc-400 block">Total Tagihan</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {formatRupiah(order.amount)}
          </span>
        </div>
      </div>

      {/* KONDISI 1: PENDING (TAMPILAN QRIS) */}
      {isPending && (
        <div className="p-6 md:p-8 rounded-xl bg-[#121215] border border-[#27272a] text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Pembayaran QRIS</span>
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">Pindai Kode QRIS untuk Menyelesaikan Pembayaran</h2>
            <p className="text-xs text-zinc-400">
              Gunakan m-Banking atau e-wallet (BCA, Mandiri, BRI, GoPay, OVO, Dana) Anda.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="inline-block p-4 rounded-xl bg-white shadow-md">
            {order.qrString ? (
              <QRCodeSVG
                value={order.qrString}
                size={200}
                level="M"
                includeMargin={false}
              />
            ) : order.qrImageUrl ? (
              <img src={order.qrImageUrl} alt="QRIS Code" className="w-[200px] h-[200px]" />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-black">
                Memuat QRIS...
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>Sistem memeriksa status pembayaran otomatis setiap 3 detik.</span>
            </p>

            {/* Tombol Simulasi Bayar untuk Pengujian Lokal */}
            <div className="pt-4 border-t border-[#1f1f23] max-w-xs mx-auto">
              <button
                onClick={handleSimulatePayment}
                disabled={simulatingPay}
                className="w-full py-2 px-3 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-zinc-700 text-zinc-300 text-xs font-mono transition-colors flex items-center justify-center gap-2"
              >
                {simulatingPay ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Simulasi Bayar Lunas (Testing Mode)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KONDISI 2: WAITING_LINK (KHUSUS SINGLE VERIFY: TAMPILAN PASTE MAGIC LINK) */}
      {isWaitingLink && (
        <div className="p-6 md:p-8 rounded-xl bg-[#121215] border border-emerald-900/60 space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pembayaran Berhasil: Langkah Terakhir Aktivasi</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Masukkan Magic Link Login dari Email</h2>
            <p className="text-xs text-zinc-300">
              Sistem telah mengirimkan tautan login resmi ke email:{" "}
              <strong className="text-emerald-400 font-mono">{order.targetEmail}</strong>.
            </p>
          </div>

          {/* Panduan 3 Langkah Jujur */}
          <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] space-y-2 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded bg-[#27272a] text-zinc-300 font-mono flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <span>Buka aplikasi Gmail atau email Anda, periksa folder Inbox atau Spam.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded bg-[#27272a] text-zinc-300 font-mono flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <span>Cari email dari Alight Motion / Firebase, lalu salin URL tombol login (magic link).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded bg-[#27272a] text-zinc-300 font-mono flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <span>Tempel tautan tersebut pada formulir di bawah ini dan tekan tombol Verifikasi.</span>
            </div>
          </div>

          {/* Form Input Magic Link */}
          <form onSubmit={handleActivateLink} className="space-y-4">
            <div>
              <label htmlFor="magiclink-input" className="block text-xs font-medium text-zinc-200 mb-1.5">
                Magic Link dari Email
              </label>
              <textarea
                id="magiclink-input"
                rows={3}
                required
                placeholder="https://alightcreative.com?ui_sid=...&oobCode=..."
                value={magicLink}
                onChange={(e) => setMagicLink(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#16161a] border border-[#27272a] text-xs text-white font-mono placeholder-zinc-500 focus:border-emerald-500 resize-none transition-colors"
              />
            </div>

            {activateError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
                {activateError}
              </div>
            )}

            <button
              type="submit"
              disabled={activating}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Mendaftarkan Lisensi ke Server Alight...</span>
                </>
              ) : (
                <span>Aktifkan Lisensi Premium 1 Tahun Sekarang</span>
              )}
            </button>
          </form>

          {/* Tombol Kirim Ulang Link */}
          <div className="pt-4 border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-400">
            <span>Email belum masuk ke inbox atau spam?</span>
            <button
              onClick={handleResendLink}
              disabled={resending}
              className="text-emerald-400 hover:underline flex items-center gap-1.5 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>Kirim Ulang Link</span>
            </button>
          </div>

          {resendNotice && (
            <p className="text-xs text-zinc-300 bg-[#18181b] p-2.5 rounded border border-[#27272a]">
              {resendNotice}
            </p>
          )}
        </div>
      )}

      {/* KONDISI 3: COMPLETED (SUKSES VIP AKTIF) */}
      {isCompleted && (
        <div className="p-6 md:p-8 rounded-xl bg-[#121215] border border-emerald-900/60 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-400">
            <Check className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">
              {order.orderType === "SINGLE_VERIFY"
                ? "Lisensi Alight Motion Pro Berhasil Diaktifkan"
                : "Paket Membership Berhasil Diaktifkan"}
            </h2>
            <p className="text-xs text-zinc-300">
              {order.orderType === "SINGLE_VERIFY"
                ? "Akun Anda telah terdaftar sebagai Annual VIP Pro resmi selama 1 tahun penuh."
                : `Paket ${order.planName} Anda aktif dan siap digunakan untuk aktivasi kuota serta API.`}
            </p>
          </div>

          {/* Rincian Lisensi Sukses */}
          {order.orderType === "SINGLE_VERIFY" && order.activations?.[0] && (
            <div className="max-w-md mx-auto p-4 rounded-lg bg-[#18181b] border border-[#27272a] text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-[#27272a] pb-1.5">
                <span className="text-zinc-400">Email Target:</span>
                <span className="text-white font-medium">{order.activations[0].targetEmail}</span>
              </div>
              <div className="flex justify-between border-b border-[#27272a] pb-1.5">
                <span className="text-zinc-400">Status Lisensi:</span>
                <span className="text-emerald-400 font-medium">PREMIUM_ACTIVE (VIP Pro)</span>
              </div>
              <div className="flex justify-between border-b border-[#27272a] pb-1.5">
                <span className="text-zinc-400">Masa Berlaku:</span>
                <span className="text-white font-medium">{order.activations[0].validUntil}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-zinc-400">Order ID Alight:</span>
                <span className="text-zinc-300 text-[11px]">{order.activations[0].amOrderId}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Kembali ke Beranda
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-white font-medium text-xs border border-[#27272a] transition-colors"
            >
              Lihat Dashboard Saya
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

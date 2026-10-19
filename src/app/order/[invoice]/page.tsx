"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  ExternalLink,
  Download,
  XCircle,
  AlertTriangle,
  Timer,
  Mail,
  Sparkles,
  Inbox,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { createClientQris, checkClientQrisStatus } from "@/lib/mustikapay-client";
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [fetchingInbox, setFetchingInbox] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const attachingQrisRef = useRef(false);
  const verifyingRef = useRef(false);

  // Keyboard escape for cancel modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCancelModal) {
        setShowCancelModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCancelModal]);

  // Fungsi verifikasi langsung dari browser client ke MustikaPay Gateway
  const verifyGatewayDirectly = useCallback(async (targetRefId: string) => {
    if (!targetRefId || verifyingRef.current) return;
    try {
      verifyingRef.current = true;
      const check = await checkClientQrisStatus(targetRefId);
      if (check.isPaid) {
        const verifyRes = await axios.post(`/api/orders/${invoice}/verify`, {
          gatewayRefId: targetRefId,
          gatewayData: {
            isPaid: true,
            ref_no: targetRefId,
            status: check.status,
            raw: check.raw,
            receiptUrl: check.receiptUrl,
          },
        });
        if (verifyRes.data?.success && verifyRes.data.order) {
          setOrder(verifyRes.data.order);
          setPaymentNotice("Pembayaran berhasil diverifikasi secara otomatis!");
        }
      }
    } catch (err) {
      console.warn("Client direct gateway verification error:", err);
    } finally {
      verifyingRef.current = false;
    }
  }, [invoice]);

  // Polling data order setiap 3 detik hanya jika status PENDING, WAITING_LINK, atau ACTIVATING
  useEffect(() => {
    if (!invoice) return;
    if (order?.status && !["PENDING", "WAITING_LINK", "ACTIVATING"].includes(order.status)) {
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${invoice}`);
        if (res.data?.success && res.data.order) {
          const ord = res.data.order;
          setOrder(ord);

          // Auto-verify: jika masih PENDING dan ada gatewayRefId, verifikasi langsung dari browser pengguna!
          if (ord.status === "PENDING" && ord.gatewayRefId && !ord.gatewayRefId.startsWith("QR_INV")) {
            verifyGatewayDirectly(ord.gatewayRefId);
          }

          // Self-heal: jika order PENDING tapi belum ada qrString, generate langsung dari browser!
          if (ord.status === "PENDING" && !ord.qrString && ord.amount > 0 && !attachingQrisRef.current) {
            attachingQrisRef.current = true;
            createClientQris(ord.amount, invoice)
              .then(async (qris) => {
                if (qris) {
                  const patch = await axios.post("/api/orders/attach-qris", {
                    invoiceNumber: invoice,
                    ...qris,
                  });
                  if (patch.data?.success) {
                    setOrder(patch.data.order);
                  }
                }
              })
              .finally(() => {
                attachingQrisRef.current = false;
              });
          }
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
  }, [invoice, order?.status, verifyGatewayDirectly]);

  // Handler tombol manual: Saya Sudah Bayar
  const handleManualCheckPayment = async () => {
    if (!order || checkingPayment) return;
    setCheckingPayment(true);
    setPaymentNotice(null);

    try {
      // 1. Verifikasi langsung dari browser client ke API Gateway
      if (order.gatewayRefId && !order.gatewayRefId.startsWith("QR_INV")) {
        const check = await checkClientQrisStatus(order.gatewayRefId);
        if (check.isPaid) {
          const verifyRes = await axios.post(`/api/orders/${invoice}/verify`, {
            gatewayRefId: order.gatewayRefId,
            gatewayData: {
              isPaid: true,
              ref_no: order.gatewayRefId,
              status: check.status,
              raw: check.raw,
              receiptUrl: check.receiptUrl,
            },
          });
          if (verifyRes.data?.success && verifyRes.data.order) {
            setOrder(verifyRes.data.order);
            setPaymentNotice("Pembayaran berhasil diverifikasi!");
            return;
          }
        }
      }

      // 2. Cek juga ke server database kita
      const res = await axios.get(`/api/orders/${invoice}`);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
        if (res.data.order.status !== "PENDING") {
          setPaymentNotice("Pembayaran berhasil terdeteksi!");
          return;
        }
      }

      setPaymentNotice("Pembayaran belum masuk. Jika baru saja transfer, mohon tunggu 5-10 detik lalu tekan tombol ini lagi.");
    } catch (err) {
      console.warn("Manual check error:", err);
      setPaymentNotice("Sedang memeriksa antrean gateway. Silakan klik lagi dalam beberapa detik.");
    } finally {
      setCheckingPayment(false);
    }
  };

  // Fetch inbox tempmail untuk INSTANT_ACCOUNT
  const fetchInbox = useCallback(async () => {
    if (!invoice) return;
    try {
      setFetchingInbox(true);
      const res = await axios.get(`/api/orders/${invoice}/messages`);
      if (res.data?.success && Array.isArray(res.data.messages)) {
        setInboxMessages(res.data.messages);
      }
    } catch (err) {
      console.warn("Gagal load pesan tempmail:", err);
    } finally {
      setFetchingInbox(false);
    }
  }, [invoice]);

  // Polling pesan masuk secara realtime jika pesanan INSTANT_ACCOUNT sudah COMPLETED
  useEffect(() => {
    if (!order || order.status !== "COMPLETED") return;
    const isInstant = order.orderType === "INSTANT_ACCOUNT" || order.targetEmail?.endsWith("@enchant.id");
    if (!isInstant) return;

    fetchInbox();
    const interval = setInterval(fetchInbox, 3500);
    return () => clearInterval(interval);
  }, [order?.status, order?.orderType, order?.targetEmail, fetchInbox]);

  // Hitung mundur kadaluarsa 10 menit (600 detik) untuk status PENDING
  useEffect(() => {
    if (!order?.createdAt || order.status !== "PENDING") {
      setTimeLeft(null);
      return;
    }

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const createdTime = new Date(order.createdAt).getTime();
    const expiresAt = createdTime + TEN_MINUTES_MS;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((expiresAt - now) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        // Tandai kadaluarsa ke backend
        axios
          .patch(`/api/orders/${invoice}`, { action: "EXPIRE" })
          .then((res) => {
            if (res.data?.success) setOrder(res.data.order);
          })
          .catch(() => {});
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [order?.createdAt, order?.status, invoice]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Handler: Batalkan Pesanan (Gak Jadi Pesan)
  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const res = await axios.post("/api/orders/cancel", { invoiceNumber: invoice });
      if (res.data?.success) {
        setOrder(res.data.order);
        setShowCancelModal(false);
      }
    } catch (err: any) {
      console.error("Gagal membatalkan pesanan:", err);
      alert(err.response?.data?.error || "Gagal membatalkan pesanan.");
    } finally {
      setCancelling(false);
    }
  };

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


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const downloadCleanQR = () => {
    const svg = document.getElementById("clean-qris-svg");
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `QRIS-${invoice}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error("Gagal unduh QR:", e);
    }
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

  const copyReceiptText = () => {
    if (!order) return;
    const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const receipt = 
      `STRUK DIGITAL ENCHANT STORE\n` +
      `Nomor Invoice: ${order.invoiceNumber}\n` +
      `Tanggal: ${dateStr}\n` +
      `Layanan: ${order.orderType === "INSTANT_ACCOUNT" ? "Akun Siap Pakai Alight Motion Pro 1 Tahun" : order.orderType === "SINGLE_VERIFY" ? "Aktivasi Lisensi Satuan Alight Motion Pro 1 Tahun" : `Membership ${order.planName}`}\n` +
      `Akun Target: ${order.targetEmail || order.planName || "-"}\n` +
      `Total: ${formatRupiah(order.amount)}\n` +
      `Status: SUKSES AKTIF\n` +
      `Garansi: 1 Tahun Resmi\n` +
      `Verifikasi: https://jual-am.vercel.app/order/${order.invoiceNumber}`;

    navigator.clipboard.writeText(receipt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const isPending = order.status === "PENDING";
  const isWaitingLink = order.status === "WAITING_LINK";
  const isActivating = order.status === "ACTIVATING";
  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";
  const isExpired = order.status === "EXPIRED";
  const isInstantAccount = order.orderType === "INSTANT_ACCOUNT";

  // Stepper Stage Calculation (1 to 4)
  const currentStep = isCompleted
    ? 4
    : isWaitingLink || isActivating
    ? 3
    : isPending
    ? 2
    : 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {/* 1. VISUAL PROGRESS STEPPER */}
      <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Step 1: Buat Pesanan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-400 block">
              1. Pesanan
            </span>
          </div>

          {/* Step 2: Bayar QRIS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center">
              <span
                className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                  currentStep > 2
                    ? "bg-emerald-950/80 border border-emerald-500 text-emerald-400"
                    : currentStep === 2
                    ? "bg-amber-950/80 border border-amber-500 text-amber-300"
                    : "bg-[#18181b] border border-[#27272a] text-zinc-500"
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </span>
            </div>
            <span
              className={`text-[11px] font-medium block ${
                currentStep > 2
                  ? "text-emerald-400"
                  : currentStep === 2
                  ? "text-amber-300"
                  : "text-zinc-500"
              }`}
            >
              2. Bayar QRIS
            </span>
          </div>

          {/* Step 3: Magic Link / Akun Aktif */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center">
              <span
                className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                  currentStep > 3
                    ? "bg-emerald-950/80 border border-emerald-500 text-emerald-400"
                    : currentStep === 3
                    ? "bg-sky-950/80 border border-sky-500 text-sky-300"
                    : "bg-[#18181b] border border-[#27272a] text-zinc-500"
                }`}
              >
                {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : "3"}
              </span>
            </div>
            <span
              className={`text-[11px] font-medium block ${
                currentStep > 3
                  ? "text-emerald-400"
                  : currentStep === 3
                  ? "text-sky-300"
                  : "text-zinc-500"
              }`}
            >
              {isInstantAccount ? "3. Akun Aktif" : "3. Verifikasi Link"}
            </span>
          </div>

          {/* Step 4: Pro Aktif / Login App */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center">
              <span
                className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                  currentStep === 4
                    ? "bg-emerald-950/80 border border-emerald-500 text-emerald-400"
                    : "bg-[#18181b] border border-[#27272a] text-zinc-500"
                }`}
              >
                {currentStep === 4 ? <Check className="w-3.5 h-3.5" /> : "4"}
              </span>
            </div>
            <span
              className={`text-[11px] font-medium block ${
                currentStep === 4 ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {isInstantAccount ? "4. Login App" : "4. Pro Aktif"}
            </span>
          </div>
        </div>
      </div>

      {/* HEADER STATUS PESANAN */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Invoice:</span>
            <span className="text-xs font-mono font-bold text-white">{order.invoiceNumber}</span>
            <button
              onClick={() => copyToClipboard(order.invoiceNumber)}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Salin Invoice"
              aria-label="Salin nomor invoice"
            >
              {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isCancelled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800 text-rose-300">
                <XCircle className="w-3 h-3" />
                Dibatalkan
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300">
                <Clock className="w-3 h-3" />
                Kadaluarsa
              </span>
            )}
          </div>
          <h1 className="text-base font-bold text-white mt-1">
            {order.orderType === "INSTANT_ACCOUNT"
              ? "Akun Siap Pakai Alight Motion Pro (1 Tahun)"
              : order.orderType === "SINGLE_VERIFY"
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
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Menunggu Pembayaran QRIS</span>
            </div>
            {timeLeft !== null && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all ${
                  timeLeft < 120
                    ? "bg-rose-950/70 border-rose-700/80 text-rose-300 animate-pulse shadow-sm shadow-rose-900/30"
                    : "bg-zinc-900 border-zinc-700/70 text-amber-300"
                }`}
              >
                <Timer className={`w-3.5 h-3.5 ${timeLeft < 120 ? "text-rose-400" : "text-amber-400"}`} />
                <span>Kadaluarsa dalam: {formatCountdown(timeLeft)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">Pindai Kode QRIS untuk Menyelesaikan Pembayaran</h2>
            <p className="text-xs text-zinc-400">
              Gunakan m-Banking atau e-wallet (BCA, Mandiri, BRI, GoPay, OVO, Dana) Anda.
            </p>
          </div>

          {/* Kotak Putih Khusus QR Murni Tanpa Watermark / Tanpa Editan */}
          <div className="max-w-[340px] mx-auto bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 text-black space-y-4">
            <div className="flex items-center justify-center p-2 bg-white rounded-2xl">
              {order.qrString ? (
                <QRCodeSVG
                  id="clean-qris-svg"
                  value={order.qrString}
                  size={270}
                  level="M"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[270px] h-[270px] flex flex-col items-center justify-center gap-3 text-zinc-500 font-mono text-center px-4">
                  <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                  <span className="text-xs font-sans text-zinc-700 font-medium">
                    Menyiapkan Kode QRIS...
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (order?.amount && invoice) {
                        const qris = await createClientQris(order.amount, invoice);
                        if (qris) {
                          const patch = await axios.post("/api/orders/attach-qris", {
                            invoiceNumber: invoice,
                            ...qris,
                          });
                          if (patch.data?.success) {
                            setOrder(patch.data.order);
                          }
                        }
                      }
                    }}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 underline font-sans font-semibold cursor-pointer"
                  >
                    Muat Ulang QRIS
                  </button>
                </div>
              )}
            </div>

            {/* Info Total Tagihan */}
            <div className="border-t border-zinc-100 pt-3 text-center space-y-0.5">
              <span className="text-[11px] font-medium text-zinc-500 block uppercase tracking-wider">
                Total Tagihan
              </span>
              <span className="text-2xl font-black font-mono text-zinc-900 block">
                {formatRupiah(order.amount)}
              </span>
            </div>
          </div>

          {/* Tombol Utama: Cek Status Pembayaran Langsung */}
          <div className="max-w-md mx-auto w-full space-y-3 pt-2">
            <button
              type="button"
              onClick={handleManualCheckPayment}
              disabled={checkingPayment}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 min-h-[48px]"
            >
              {checkingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span>Memverifikasi Pembayaran ke Gateway...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 text-black" />
                  <span>Saya Sudah Bayar (Cek Otomatis Sekarang)</span>
                </>
              )}
            </button>

            {paymentNotice && (
              <div className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-center text-zinc-300 font-sans shadow-inner">
                {paymentNotice}
              </div>
            )}
          </div>

          {/* Tombol Aksi Tambahan */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {order.gatewayRefId && !order.gatewayRefId.startsWith("QR_INV") && (
              <a
                href={`https://mustikapayment.com/pay/${order.gatewayRefId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition-colors min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Buka Link Gateway</span>
              </a>
            )}
            <button
              type="button"
              onClick={downloadCleanQR}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-200 border border-[#27272a] font-medium text-xs transition-colors min-h-[44px]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Kode QR</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 border border-rose-900/40 hover:border-rose-800/60 font-medium text-xs transition-colors min-h-[44px]"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Batalkan Pesanan</span>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>Sistem memeriksa status pembayaran otomatis setiap 3 detik.</span>
            </p>
          </div>
        </div>
      )}

      {/* KONDISI: CANCELLED (PESANAN DIBATALKAN) */}
      {isCancelled && (
        <div className="p-6 md:p-8 rounded-xl bg-[#121215] border border-rose-900/40 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-700/60 mx-auto flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">Pesanan Telah Dibatalkan</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Pesanan #{order.invoiceNumber} telah dibatalkan dan kode pembayaran QRIS sudah dinonaktifkan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={order.orderType === "SINGLE_VERIFY" ? "/aktivasi" : "/#pricing"}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Buat Pesanan Baru
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-medium text-xs border border-[#27272a] transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      )}

      {/* KONDISI: EXPIRED (WAKTU 10 MENIT HABIS) */}
      {isExpired && (
        <div className="p-6 md:p-8 rounded-xl bg-[#121215] border border-amber-900/40 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-700/60 mx-auto flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">Waktu Pembayaran Telah Habis</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Batas waktu pembayaran 10 menit untuk invoice #{order.invoiceNumber} telah berakhir. Kode QRIS sudah dinonaktifkan demi keamanan. Silakan buat pesanan baru untuk melanjutkan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={order.orderType === "SINGLE_VERIFY" ? "/aktivasi" : "/#pricing"}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Pesan Ulang Sekarang
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-medium text-xs border border-[#27272a] transition-colors"
            >
              Kembali ke Beranda
            </Link>
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

      {/* KONDISI 3A: INSTANT_ACCOUNT COMPLETED (AKUN SIAP PAKAI + INBOX REALTIME & MAGIC BUTTON) */}
      {isCompleted && order.orderType === "INSTANT_ACCOUNT" && (
        <div className="p-6 md:p-8 rounded-xl bg-[#121215] border border-emerald-900/60 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">
              Akun Alight Motion Pro Siap Digunakan
            </h2>
            <p className="text-xs text-zinc-300 max-w-lg mx-auto">
              Akun resmi Anda telah otomatis aktif sebagai VIP Pro 1 Tahun penuh. Silakan login ke aplikasi Alight Motion dengan email berikut.
            </p>
          </div>

          {/* KARTU KREDENSIAL AKUN */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#18181b] border border-[#27272a] text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Alamat Email Akun Pro Anda</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                VIP Pro 1 Tahun
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#121215] border border-[#27272a]">
              <span className="text-sm font-mono font-bold text-white truncate">
                {order.targetEmail}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(order.targetEmail || "");
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2000);
                }}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 min-h-[36px]"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmail ? "Tersalin" : "Salin Email"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded bg-[#121215] border border-[#27272a]">
                <span className="text-zinc-500 text-[10px] block">Masa Berlaku</span>
                <span className="text-white font-medium text-[11px]">
                  {order.activations?.[0]?.validUntil || "1 Tahun Penuh"}
                </span>
              </div>
              <div className="p-2 rounded bg-[#121215] border border-[#27272a]">
                <span className="text-zinc-500 text-[10px] block">Metode Masuk</span>
                <span className="text-emerald-400 font-medium text-[11px]">
                  Email Link (Tanpa Password)
                </span>
              </div>
            </div>
          </div>

          {/* PANDUAN LANGKAH LOGIN */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#18181b] border border-[#27272a] text-left space-y-2.5">
            <span className="text-xs font-semibold text-white block">
              Cara Masuk ke Aplikasi Alight Motion:
            </span>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-[#27272a] text-emerald-400 font-mono flex items-center justify-center shrink-0 text-[11px] font-bold">
                  1
                </span>
                <span>Buka aplikasi <strong>Alight Motion</strong> di HP Anda, pilih <strong>Masuk dengan Email</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-[#27272a] text-emerald-400 font-mono flex items-center justify-center shrink-0 text-[11px] font-bold">
                  2
                </span>
                <span>Masukkan email <strong>{order.targetEmail}</strong> dan klik tombol minta tautan masuk.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-[#27272a] text-emerald-400 font-mono flex items-center justify-center shrink-0 text-[11px] font-bold">
                  3
                </span>
                <span>Pesan dari Alight Motion akan otomatis muncul di bawah ini. Klik <strong>Buka & Login ke Alight Motion</strong> untuk masuk langsung!</span>
              </div>
            </div>
          </div>

          {/* KOTAK MASUK VERIFIKASI REALTIME (INBOX & DIRECT BUTTON) */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#18181b] border border-emerald-900/40 text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-white">
                  Kotak Masuk Verifikasi Alight Motion
                </span>
              </div>
              <button
                type="button"
                onClick={fetchInbox}
                disabled={fetchingInbox}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${fetchingInbox ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {inboxMessages.length === 0 ? (
              <div className="p-6 rounded-lg bg-[#121215] border border-[#27272a] text-center space-y-2">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs font-medium text-white">
                  Menunggu Email Verifikasi Masuk...
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Kirim tautan masuk dari aplikasi Alight Motion sekarang. Halaman ini mendeteksi email masuk secara otomatis setiap beberapa detik.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inboxMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className="p-4 rounded-lg bg-[#121215] border border-emerald-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-[#27272a] pb-2">
                      <span className="text-emerald-400 font-bold truncate max-w-[200px]">
                        {msg.from || "Alight Creative"}
                      </span>
                      <span>
                        {msg.receivedAt ? new Date(msg.receivedAt).toLocaleTimeString("id-ID") : "Baru saja"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {msg.subject || "Masuk ke Alight Motion"}
                      </h4>
                    </div>

                    {/* TOMBOL UTAMA: DIRECT MAGIC BUTTON */}
                    {msg.loginLink ? (
                      <div className="space-y-2 pt-1">
                        <a
                          href={msg.loginLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all min-h-[44px]"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Buka & Login ke Alight Motion Sekarang</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.loginLink);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? "Tautan Login Berhasil Disalin" : "Salin Tautan Login"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                        {msg.text ? msg.text.substring(0, 150) + "..." : "Pesan diterima"}
                      </div>
                    )}

                    {/* KODE OTP JIKA ADA */}
                    {msg.otp && (
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-mono">Kode Verifikasi (OTP)</span>
                          <span className="text-lg font-mono font-black text-emerald-400 tracking-wider">
                            {msg.otp}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.otp);
                            setCopiedOtp(msg.otp);
                            setTimeout(() => setCopiedOtp(null), 2000);
                          }}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium flex items-center gap-1 min-h-[32px]"
                        >
                          {copiedOtp === msg.otp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedOtp === msg.otp ? "Disalin" : "Salin"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KARTU GARANSI & STRUK */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#18181b] border border-[#27272a] text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Kartu Garansi & Struk Transaksi</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                1 Tahun Resmi
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Lisensi Anda dilindungi garansi penggantian resmi. Simpan nomor invoice ini sebagai tanda bukti kepemilikan lisensi akun Anda.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={copyReceiptText}
                className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                {copiedReceipt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReceipt ? "Teks Struk Disalin" : "Salin Bukti Struk"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-lg bg-[#121215] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Cetak Bukti</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-medium text-xs border border-[#27272a] transition-colors min-h-[44px] flex items-center justify-center"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/aktivasi"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 font-medium text-xs transition-colors min-h-[44px] flex items-center justify-center"
            >
              Buat Pesanan Baru
            </Link>
          </div>
        </div>
      )}

      {/* KONDISI 3B: SINGLE_VERIFY & MEMBERSHIP COMPLETED (SUKSES VIP AKTIF) */}
      {isCompleted && order.orderType !== "INSTANT_ACCOUNT" && (
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

          {/* Kartu Struk Digital & Garansi Resmi */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#18181b] border border-[#27272a] text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Kartu Garansi & Struk Transaksi</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                1 Tahun Resmi
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Lisensi Anda dilindungi garansi penggantian resmi. Simpan nomor invoice dan tautan verifikasi ini sebagai tanda bukti kepemilikan lisensi.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={copyReceiptText}
                className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                {copiedReceipt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReceipt ? "Teks Struk Disalin" : "Salin Bukti Struk"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-lg bg-[#121215] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Cetak Bukti</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-medium text-xs border border-[#27272a] transition-colors min-h-[44px] flex items-center justify-center"
            >
              Kembali ke Beranda
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 font-medium text-xs transition-colors min-h-[44px] flex items-center justify-center"
            >
              Buka Dashboard Pengguna
            </Link>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BATALKAN PESANAN */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-sm w-full bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-400 mx-auto flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Batalkan Pesanan?</h3>
              <p className="text-xs text-zinc-400">
                Apakah Anda yakin ingin membatalkan tagihan QRIS ini? Kode QR tidak akan dapat digunakan lagi.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 text-xs font-medium border border-[#27272a] transition-colors"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

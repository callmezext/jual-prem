"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Shield,
  Save,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Zap,
  ArrowRight,
  Sliders,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

export default function AdminPage() {
  const { firebaseUser, dbUser, loading } = useAuth();

  const [singlePrice, setSinglePrice] = useState<number>(1000);
  const [plans, setPlans] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoadingData(true);
      const [settingsRes, ordersRes] = await Promise.all([
        axios.get("/api/admin/settings"),
        axios.get("/api/admin/orders"),
      ]);

      if (settingsRes.data?.success) {
        setSinglePrice(settingsRes.data.singlePrice);
        setPlans(settingsRes.data.plans || []);
      }

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
      }
    } catch (err) {
      console.error("Gagal load admin data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await axios.post("/api/admin/settings", {
        singlePrice,
        plans,
      });
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const updatePlanField = (index: number, field: string, value: any) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Admin Guard: Must be logged in and have admin role
  if (!firebaseUser || dbUser?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="p-8 rounded-2xl bg-[#121215] border border-rose-900/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Akses Terbatas Administrator</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Halaman ini hanya dapat diakses oleh akun yang memiliki peran administrator resmi.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-zinc-200 min-h-[44px]"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-mono font-medium mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>KONTROL SISTEM ADMINISTRATOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Kelola Harga & Sistem Toko
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Konfigurasi tarif aktivasi per unit, kuota membership reseller, dan pemantauan transaksi seluruh toko.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Konfigurasi harga dan paket membership berhasil disimpan ke database.</span>
        </div>
      )}

      {/* FORM PENGATURAN HARGA */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Pengaturan Harga Satuan */}
        <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Tarif Aktivasi Satuan (Per Transaksi)</h2>
              <p className="text-xs text-zinc-400">
                Tarif publik yang dibayar pembeli eceran untuk 1 lisensi Alight Motion Pro 1 Tahun via QRIS otomatis.
              </p>
            </div>
          </div>

          <div className="max-w-sm pt-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Nominal Satuan (IDR):</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-mono text-zinc-500">Rp</span>
              <input
                type="number"
                min={500}
                step={500}
                required
                value={singlePrice}
                onChange={(e) => setSinglePrice(parseInt(e.target.value, 10) || 0)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Nilai saat ini: {formatRupiah(singlePrice)} per aktivasi sukses.
            </p>
          </div>
        </div>

        {/* 2. Pengaturan Paket Membership */}
        <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Paket Membership & Kuota Reseller</h2>
                <p className="text-xs text-zinc-400">
                  Konfigurasi harga langganan, jatah aktivasi, dan masa aktif untuk reseller.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className="p-5 rounded-lg bg-[#18181b] border border-[#27272a] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => updatePlanField(idx, "name", e.target.value)}
                    className="bg-transparent font-semibold text-sm text-white focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 rounded bg-[#121215] border border-[#27272a]">
                    {plan.slug}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Harga Paket (Rp):</label>
                    <input
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePlanField(idx, "price", parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#27272a] font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Kuota (-1 = Tak Terbatas):
                    </label>
                    <input
                      type="number"
                      value={plan.quota}
                      onChange={(e) => updatePlanField(idx, "quota", parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#27272a] font-mono text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Durasi (Bulan):</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={plan.durationMonths}
                      onChange={(e) => updatePlanField(idx, "durationMonths", parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#27272a] font-mono text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Label Tag:</label>
                    <input
                      type="text"
                      value={plan.badgeText || ""}
                      onChange={(e) => updatePlanField(idx, "badgeText", e.target.value)}
                      placeholder="Contoh: BEST VALUE"
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#27272a] text-white text-xs focus:outline-none focus:border-emerald-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="pt-2 text-[11px] font-mono text-zinc-500 border-t border-[#27272a] flex justify-between">
                  <span>HPP per unit kuota:</span>
                  <span className="text-zinc-300 font-bold">
                    {plan.quota > 0 ? formatRupiah(Math.round(plan.price / plan.quota)) : "Sesuai durasi"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Perubahan Pengaturan Harga</span>
          </button>
        </div>
      </form>

      {/* 3. MONITOR TRANSAKSI SELURUH TOKO */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Semua Transaksi Masuk ({orders.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272a]">
              <tr>
                <th className="px-4 py-3.5">Invoice</th>
                <th className="px-4 py-3.5">Akun Pembeli</th>
                <th className="px-4 py-3.5">Jenis</th>
                <th className="px-4 py-3.5">Target / Paket</th>
                <th className="px-4 py-3.5">Nominal</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Belum ada riwayat transaksi yang tercatat.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{ord.invoiceNumber}</td>
                    <td className="px-4 py-3 text-zinc-300">{ord.user?.email || "Guest"}</td>
                    <td className="px-4 py-3 text-zinc-400">{ord.orderType}</td>
                    <td className="px-4 py-3 text-zinc-400">{ord.targetEmail || ord.planName || "N/A"}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{formatRupiah(ord.amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ord.status === "COMPLETED"
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : ord.status === "WAITING_LINK"
                            ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                            : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/order/${ord.invoiceNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <span>Lihat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

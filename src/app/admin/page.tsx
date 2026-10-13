"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Shield,
  BarChart3,
  ShoppingCart,
  Zap,
  Package,
  Users,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  RotateCcw,
  DollarSign,
  ExternalLink,
  Save,
  AlertTriangle,
  Loader2,
  Clock,
  TrendingUp,
  UserCheck,
  Key,
  Copy,
  Check,
  Send,
  Link2,
  Power,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

type TabType = "overview" | "orders" | "activator" | "plans" | "users" | "settings";

export default function AdminPage() {
  const { firebaseUser, dbUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Global Alert / Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // TAB 1: OVERVIEW STATE
  // ---------------------------------------------------------------------------
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await axios.get("/api/admin/overview");
      if (res.data?.success) {
        setOverviewStats(res.data.stats);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (err: any) {
      console.error("Gagal load overview:", err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // TAB 2: ORDERS STATE
  // ---------------------------------------------------------------------------
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatus, setOrdersStatus] = useState("ALL");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const res = await axios.get("/api/admin/orders", {
        params: {
          search: ordersSearch,
          status: ordersStatus,
          page: ordersPage,
          limit: 15,
        },
      });
      if (res.data?.success) {
        setOrders(res.data.orders);
        setOrdersTotalPages(res.data.totalPages);
        setOrdersTotalCount(res.data.total);
      }
    } catch (err: any) {
      console.error("Gagal load orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersSearch, ordersStatus, ordersPage]);

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      setActionLoading(true);
      const res = await axios.patch("/api/admin/orders", { orderId, action });
      if (res.data?.success) {
        showToast(res.data.message, "success");
        fetchOrders();
        fetchOverview();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal memproses aksi pesanan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 3: DIRECT ACTIVATOR STATE
  // ---------------------------------------------------------------------------
  const [actEmail, setActEmail] = useState("");
  const [actNickname, setActNickname] = useState("");
  const [actMagicLink, setActMagicLink] = useState("");
  const [actStep, setActStep] = useState<"send" | "verify">("send");
  const [actLoading, setActLoading] = useState(false);
  const [actResult, setActResult] = useState<any>(null);

  const [activationsLog, setActivationsLog] = useState<any[]>([]);
  const [actLogLoading, setActLogLoading] = useState(false);
  const [actLogSearch, setActLogSearch] = useState("");
  const [actLogPage, setActLogPage] = useState(1);
  const [actLogTotalPages, setActLogTotalPages] = useState(1);

  const fetchActivationsLog = useCallback(async () => {
    try {
      setActLogLoading(true);
      const res = await axios.get("/api/admin/activations", {
        params: { search: actLogSearch, page: actLogPage, limit: 15 },
      });
      if (res.data?.success) {
        setActivationsLog(res.data.activations);
        setActLogTotalPages(res.data.totalPages);
      }
    } catch (err: any) {
      console.error("Gagal load activations:", err);
    } finally {
      setActLogLoading(false);
    }
  }, [actLogSearch, actLogPage]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actEmail) return;
    try {
      setActLoading(true);
      setActResult(null);
      const res = await axios.post("/api/admin/activations", {
        action: "send_link",
        email: actEmail,
      });
      if (res.data?.success) {
        showToast(res.data.message || "Link berhasil dikirim ke email", "success");
        setActStep("verify");
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal mengirim link ke email", "error");
    } finally {
      setActLoading(false);
    }
  };

  const handleVerifyLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actEmail || !actMagicLink) return;
    try {
      setActLoading(true);
      const res = await axios.post("/api/admin/activations", {
        action: "verify_link",
        email: actEmail,
        magicLink: actMagicLink,
        nickname: actNickname,
        adminUserId: dbUser?.id,
      });
      if (res.data?.success) {
        showToast(res.data.message, "success");
        setActResult(res.data.data);
        fetchActivationsLog();
        fetchOverview();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal verifikasi lisensi", "error");
    } finally {
      setActLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 4: PLANS (CRUD) STATE
  // ---------------------------------------------------------------------------
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    quota: 20,
    durationMonths: 1,
    price: 15000,
    description: "",
    badgeText: "",
    isActive: true,
  });

  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const res = await axios.get("/api/admin/plans");
      if (res.data?.success) {
        setPlans(res.data.plans);
      }
    } catch (err: any) {
      console.error("Gagal load plans:", err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const openAddPlanModal = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      slug: "",
      quota: 20,
      durationMonths: 1,
      price: 15000,
      description: "",
      badgeText: "",
      isActive: true,
    });
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      quota: plan.quota,
      durationMonths: plan.durationMonths,
      price: plan.price,
      description: plan.description || "",
      badgeText: plan.badgeText || "",
      isActive: plan.isActive,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      if (editingPlan) {
        const res = await axios.put(`/api/admin/plans/${editingPlan.id}`, planForm);
        if (res.data?.success) {
          showToast(res.data.message, "success");
          setShowPlanModal(false);
          fetchPlans();
        }
      } else {
        const res = await axios.post("/api/admin/plans", planForm);
        if (res.data?.success) {
          showToast(res.data.message, "success");
          setShowPlanModal(false);
          fetchPlans();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal menyimpan paket", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePlanActive = async (plan: any) => {
    try {
      const res = await axios.put(`/api/admin/plans/${plan.id}`, {
        isActive: !plan.isActive,
      });
      if (res.data?.success) {
        showToast(`Status paket ${plan.name} berhasil diubah`, "success");
        fetchPlans();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal update status paket", "error");
    }
  };

  const handleDeletePlan = async (plan: any) => {
    if (!confirm(`Hapus atau nonaktifkan paket "${plan.name}"?`)) return;
    try {
      const res = await axios.delete(`/api/admin/plans/${plan.id}`);
      if (res.data?.success) {
        showToast(res.data.message, "success");
        fetchPlans();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal menghapus paket", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 5: USERS (CRUD) STATE
  // ---------------------------------------------------------------------------
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModalType, setUserModalType] = useState<"role" | "balance" | "membership" | null>(null);

  // Form states inside user modal
  const [newRole, setNewRole] = useState("customer");
  const [balanceAmount, setBalanceAmount] = useState(10000);
  const [balanceMode, setBalanceMode] = useState<"add" | "set">("add");
  const [grantPlanId, setGrantPlanId] = useState("");
  const [grantQuota, setGrantQuota] = useState(20);
  const [grantDuration, setGrantDuration] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await axios.get("/api/admin/users", {
        params: { search: usersSearch, role: usersRole },
      });
      if (res.data?.success) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      console.error("Gagal load users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [usersSearch, usersRole]);

  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await axios.patch("/api/admin/users", {
        userId: selectedUser.id,
        action: "update_role",
        role: newRole,
      });
      if (res.data?.success) {
        showToast(res.data.message, "success");
        setUserModalType(null);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal mengubah role", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await axios.patch("/api/admin/users", {
        userId: selectedUser.id,
        action: "adjust_balance",
        amount: balanceAmount,
        mode: balanceMode,
      });
      if (res.data?.success) {
        showToast(res.data.message, "success");
        setUserModalType(null);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal menyesuaikan saldo", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetApiKey = async (user: any) => {
    if (!confirm(`Reset API Key untuk ${user.email}? API Key lama tidak akan bisa dipakai lagi.`)) return;
    try {
      setActionLoading(true);
      const res = await axios.patch("/api/admin/users", {
        userId: user.id,
        action: "reset_api_key",
      });
      if (res.data?.success) {
        showToast(res.data.message, "success");
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal reset API key", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantMembership = async () => {
    if (!selectedUser || !grantPlanId) return;
    try {
      setActionLoading(true);
      const res = await axios.patch("/api/admin/users", {
        userId: selectedUser.id,
        action: "grant_membership",
        planId: grantPlanId,
        quota: grantQuota,
        durationMonths: grantDuration,
      });
      if (res.data?.success) {
        showToast(res.data.message, "success");
        setUserModalType(null);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal memberikan membership", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 6: SETTINGS STATE
  // ---------------------------------------------------------------------------
  const [singlePrice, setSinglePrice] = useState(1000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [waNumber, setWaNumber] = useState("628123456789");
  const [waMessage, setWaMessage] = useState("Halo admin, saya butuh bantuan aktivasi Alight Motion.");
  const [announcementText, setAnnouncementText] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/settings");
      if (res.data?.success) {
        setSinglePrice(res.data.singlePrice || 1000);
        const s = res.data.settings || {};
        setMaintenanceMode(s.maintenance_mode === "true");
        setWaNumber(s.whatsapp_number || "628123456789");
        setWaMessage(s.whatsapp_message || "Halo admin, saya butuh bantuan aktivasi Alight Motion.");
        setAnnouncementText(s.announcement_banner || "");
        setExpiryMinutes(parseInt(s.expiry_countdown_minutes, 10) || 10);
      }
    } catch (err: any) {
      console.error("Gagal load settings:", err);
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await axios.post("/api/admin/settings", {
        singlePrice,
        settings: {
          maintenance_mode: maintenanceMode ? "true" : "false",
          whatsapp_number: waNumber.trim(),
          whatsapp_message: waMessage.trim(),
          announcement_banner: announcementText.trim(),
          expiry_countdown_minutes: String(expiryMinutes),
        },
      });
      if (res.data?.success) {
        showToast(res.data.message || "Pengaturan berhasil disimpan", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal menyimpan pengaturan", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // ---------------------------------------------------------------------------
  // INITIAL FETCH & TAB SWITCH DISPATCH
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (firebaseUser && dbUser?.role === "admin") {
      fetchOverview();
      fetchOrders();
      fetchPlans();
      fetchSettings();
    }
  }, [firebaseUser, dbUser, fetchOverview, fetchOrders, fetchPlans, fetchSettings]);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "activator") fetchActivationsLog();
    if (activeTab === "plans") fetchPlans();
    if (activeTab === "users") fetchUsers();
  }, [activeTab, fetchOrders, fetchActivationsLog, fetchPlans, fetchUsers]);

  // Keyboard accessibility: Close modals on Escape key (R-32)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedOrder(null);
        setShowPlanModal(false);
        setUserModalType(null);
        setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // AUTH GUARD
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border text-xs flex items-center gap-3 transition-all max-w-md ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/90 border-rose-500/50 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="flex-1 font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-white p-1 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>PANEL PUSAT ADMINISTRATOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Kontrol & Manajemen Sistem Toko
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Pantau performa penjualan, atur transaksi, eksekusi aktivasi manual, dan konfigurasi paket toko.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOverview();
              if (activeTab === "orders") fetchOrders();
              if (activeTab === "activator") fetchActivationsLog();
              if (activeTab === "plans") fetchPlans();
              if (activeTab === "users") fetchUsers();
              if (activeTab === "settings") fetchSettings();
              showToast("Data berhasil dimuat ulang", "success");
            }}
            className="px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-2 min-h-[44px]"
            title="Refresh semua data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar (Using Crisp Icons, No Emojis) */}
      <nav
        aria-label="Admin Navigation Tabs"
        className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#27272a]"
      >
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] whitespace-nowrap ${
            activeTab === "overview"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ringkasan</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] whitespace-nowrap ${
            activeTab === "orders"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Pesanan & Transaksi</span>
          {overviewStats?.pendingOrders > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
              {overviewStats.pendingOrders}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("activator")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] whitespace-nowrap ${
            activeTab === "activator"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Aktivasi Manual</span>
        </button>

        <button
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] whitespace-nowrap ${
            activeTab === "plans"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Paket Membership</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] whitespace-nowrap ${
            activeTab === "users"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengguna & Reseller</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] whitespace-nowrap ${
            activeTab === "settings"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Toko</span>
        </button>
      </nav>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW CONTENT */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {loadingOverview ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Total Omset Lunas</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                    {formatRupiah(overviewStats?.totalRevenue || 0)}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Dari {overviewStats?.completedOrders || 0} pesanan berhasil
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Total Pesanan Masuk</span>
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {overviewStats?.totalOrders || 0}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Semua riwayat transaksi di toko
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Pesanan Perlu Tindakan</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                    {overviewStats?.pendingOrders || 0}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Status PENDING atau WAITING_LINK
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Total Akun Terdaftar</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {overviewStats?.totalUsers || 0}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {overviewStats?.totalActivations || 0} lisensi sukses diaktifkan
                  </p>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>5 Transaksi Terkini</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Lihat Semua Pesanan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                      <tr>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Pembeli</th>
                        <th className="px-4 py-3">Tipe</th>
                        <th className="px-4 py-3">Nominal</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                            Belum ada transaksi terkini.
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#18181b]/50">
                            <td className="px-4 py-3 font-semibold text-white">{ord.invoiceNumber}</td>
                            <td className="px-4 py-3 text-zinc-300">{ord.user?.email || "Guest"}</td>
                            <td className="px-4 py-3 text-zinc-400">{ord.orderType}</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">{formatRupiah(ord.amount)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  ord.status === "COMPLETED"
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                    : ord.status === "WAITING_LINK"
                                    ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                                    : ord.status === "CANCELLED"
                                    ? "bg-zinc-800 border border-zinc-700 text-zinc-400"
                                    : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                }`}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setActiveTab("orders");
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ORDERS CONTENT (SEARCH, FILTER, PAGINATION, MANUAL ACTIONS) */}
      {/* ===================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor invoice atau email..."
                value={ordersSearch}
                onChange={(e) => {
                  setOrdersSearch(e.target.value);
                  setOrdersPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {["ALL", "PENDING", "WAITING_LINK", "COMPLETED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setOrdersStatus(st);
                    setOrdersPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium min-h-[36px] transition-colors whitespace-nowrap ${
                    ordersStatus === st
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-[#18181b] text-zinc-400 hover:text-zinc-200 border border-[#27272a]"
                  }`}
                >
                  {st === "ALL" ? "Semua Status" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
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
                  <th className="px-4 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Memuat daftar pesanan...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                      Tidak ada pesanan yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#18181b]/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="hover:underline text-emerald-400 font-bold"
                        >
                          {ord.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{ord.user?.email || "Guest"}</td>
                      <td className="px-4 py-3 text-zinc-400">{ord.orderType}</td>
                      <td className="px-4 py-3 text-zinc-400 truncate max-w-[160px]">
                        {ord.targetEmail || ord.planName || "-"}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{formatRupiah(ord.amount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ord.status === "COMPLETED"
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              : ord.status === "WAITING_LINK"
                              ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                              : ord.status === "CANCELLED"
                              ? "bg-zinc-800 border border-zinc-700 text-zinc-400"
                              : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-[11px]">
                        {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-2.5 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white text-[11px] min-h-[32px]"
                            title="Buka panel detail pesanan"
                          >
                            Kelola
                          </button>
                          <a
                            href={`/order/${ord.invoiceNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded hover:bg-[#27272a] text-zinc-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Buka halaman invoice publik"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 px-1">
            <span>
              Total: {ordersTotalCount} pesanan (Halaman {ordersPage} dari {ordersTotalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={ordersPage <= 1}
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-[#121215] border border-[#27272a] disabled:opacity-40 hover:bg-[#18181b] min-h-[36px] flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                disabled={ordersPage >= ordersTotalPages}
                onClick={() => setOrdersPage((p) => p + 1)}
                className="px-3 py-1.5 rounded bg-[#121215] border border-[#27272a] disabled:opacity-40 hover:bg-[#18181b] min-h-[36px] flex items-center gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DETAIL & AKSI PESANAN (MANUAL OVERRIDE) */}
      {/* ===================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#121215] border border-[#27272a] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span>Detail Pesanan {selectedOrder.invoiceNumber}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Dibuat pada {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded text-zinc-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                <div>
                  <span className="text-zinc-500 block text-[10px]">STATUS</span>
                  <span className="text-white font-bold">{selectedOrder.status}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">TOTAL HARGA</span>
                  <span className="text-emerald-400 font-bold">{formatRupiah(selectedOrder.amount)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">TIPE ORDER</span>
                  <span className="text-zinc-300">{selectedOrder.orderType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">PEMBELI</span>
                  <span className="text-zinc-300 truncate block">{selectedOrder.user?.email || "Guest"}</span>
                </div>
              </div>

              {selectedOrder.targetEmail && (
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <span className="text-zinc-500 block text-[10px]">TARGET EMAIL ALIGHT MOTION</span>
                  <span className="text-white font-semibold">{selectedOrder.targetEmail}</span>
                </div>
              )}

              {selectedOrder.planName && (
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <span className="text-zinc-500 block text-[10px]">PAKET MEMBERSHIP</span>
                  <span className="text-white font-semibold">{selectedOrder.planName}</span>
                </div>
              )}

              {selectedOrder.gatewayRefId && (
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <span className="text-zinc-500 block text-[10px]">GATEWAY REFERENCE ID</span>
                  <span className="text-zinc-300">{selectedOrder.gatewayRefId}</span>
                </div>
              )}
            </div>

            {/* Tombol Aksi Manual Pesanan */}
            <div className="space-y-2 border-t border-[#27272a] pt-4">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                Tindakan Administrator Manual:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={actionLoading || selectedOrder.status === "COMPLETED"}
                  onClick={() => handleOrderAction(selectedOrder.id, "mark_paid")}
                  className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tandai Lunas & Kirim</span>
                </button>

                <button
                  disabled={actionLoading || selectedOrder.status === "CANCELLED"}
                  onClick={() => handleOrderAction(selectedOrder.id, "cancel")}
                  className="py-2.5 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 disabled:opacity-40 text-rose-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Batalkan Pesanan</span>
                </button>
              </div>

              <div className="pt-2">
                <a
                  href={`/order/${selectedOrder.invoiceNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Halaman Checkout Pelanggan</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DIRECT ACTIVATOR & ACTIVATION LOG */}
      {/* ===================================================================== */}
      {activeTab === "activator" && (
        <div className="space-y-6">
          {/* Direct Activator Form */}
          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  Aktivasi Lisensi Manual Darurat
                </h2>
                <p className="text-xs text-zinc-400">
                  Eksekusi pengiriman link dan aktivasi lisensi Alight Motion Pro langsung tanpa membuat invoice pembayaran.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Form Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Email Akun Alight Motion:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contoh: user@gmail.com"
                    value={actEmail}
                    onChange={(e) => setActEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Nama / Nickname (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Nama tampilan di Alight Motion"
                    value={actNickname}
                    onChange={(e) => setActNickname(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={actLoading || !actEmail}
                    onClick={handleSendLink}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold text-xs flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {actLoading && actStep === "send" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Kirim Magic Link ke Email</span>
                  </button>
                </div>

                {/* Section Verify Magic Link */}
                <div className="pt-4 border-t border-[#27272a] space-y-3">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Input Magic Link (Link dari email pelanggan):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tempelkan link verifikasi yang dikirimkan Alight Motion..."
                    value={actMagicLink}
                    onChange={(e) => setActMagicLink(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={actLoading || !actEmail || !actMagicLink}
                    onClick={handleVerifyLink}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {actLoading && actStep === "verify" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Verifikasi & Aktifkan Lisensi VIP</span>
                  </button>
                </div>
              </div>

              {/* Status & Hasil Aktivasi */}
              <div className="p-5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-3 flex flex-col justify-center">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Informasi Hasil Eksekusi:
                </span>
                {actResult ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Aktivasi Berhasil!</span>
                      </p>
                    </div>
                    <div className="space-y-1 text-zinc-300 pt-1">
                      <p>
                        <span className="text-zinc-500">Email:</span> {actResult.email}
                      </p>
                      <p>
                        <span className="text-zinc-500">Nama:</span> {actResult.displayName || "-"}
                      </p>
                      <p>
                        <span className="text-zinc-500">UID:</span> {actResult.uid}
                      </p>
                      <p>
                        <span className="text-zinc-500">Masa Aktif:</span> {actResult.validUntil}
                      </p>
                      <p>
                        <span className="text-zinc-500">Status:</span> {actResult.membershipStatus}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    <p>Masukkan email dan kirim magic link untuk memulai proses aktivasi langsung.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activation Log Table */}
          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Riwayat Aktivasi Sukses</span>
              </h3>

              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari email target atau UID..."
                  value={actLogSearch}
                  onChange={(e) => {
                    setActLogSearch(e.target.value);
                    setActLogPage(1);
                  }}
                  className="pl-9 pr-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[36px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                  <tr>
                    <th className="px-4 py-3">Email Target</th>
                    <th className="px-4 py-3">Sumber</th>
                    <th className="px-4 py-3">AM UID</th>
                    <th className="px-4 py-3">Berlaku Hingga</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {actLogLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                        Memuat riwayat aktivasi...
                      </td>
                    </tr>
                  ) : activationsLog.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                        Belum ada riwayat aktivasi yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    activationsLog.map((act) => (
                      <tr key={act.id} className="hover:bg-[#18181b]/50">
                        <td className="px-4 py-3 font-semibold text-white">{act.targetEmail}</td>
                        <td className="px-4 py-3 text-zinc-400">{act.source}</td>
                        <td className="px-4 py-3 text-zinc-400 truncate max-w-[140px]">{act.amUid || "-"}</td>
                        <td className="px-4 py-3 text-emerald-400">{act.validUntil || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {act.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-[11px]">
                          {new Date(act.createdAt).toLocaleDateString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: MEMBERSHIP PLANS (CRUD) */}
      {/* ===================================================================== */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Paket Membership & Kuota Reseller ({plans.length})</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kelola paket berlangganan aktivator yang ditampilkan pada katalog pelanggan.
              </p>
            </div>

            <button
              onClick={openAddPlanModal}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Paket Baru</span>
            </button>
          </div>

          {/* Grid Plans */}
          {plansLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-5 rounded-xl bg-[#121215] border transition-colors space-y-4 ${
                    p.isActive ? "border-[#27272a]" : "border-rose-950/40 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between border-b border-[#27272a] pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white">{p.name}</h3>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{p.slug}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        p.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Harga:</span>
                      <span className="text-emerald-400 font-bold">{formatRupiah(p.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Kuota:</span>
                      <span className="text-white">{p.quota === -1 ? "Tak Terbatas" : `${p.quota}x`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Durasi:</span>
                      <span className="text-white">{p.durationMonths} Bulan</span>
                    </div>
                    {p.badgeText && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Badge:</span>
                        <span className="text-purple-400 font-medium">{p.badgeText}</span>
                      </div>
                    )}
                    {p._count && (
                      <div className="flex justify-between pt-1 border-t border-[#27272a]">
                        <span className="text-zinc-500">Pelanggan Aktif:</span>
                        <span className="text-zinc-300">{p._count.userMemberships} user</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#27272a]">
                    <button
                      onClick={() => openEditPlanModal(p)}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 min-h-[38px]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleTogglePlanActive(p)}
                      className={`p-2 rounded-lg border min-h-[38px] min-w-[38px] flex items-center justify-center ${
                        p.isActive
                          ? "bg-amber-950/40 text-amber-400 border-amber-900/60 hover:bg-amber-900/40"
                          : "bg-emerald-950/40 text-emerald-400 border-emerald-900/60 hover:bg-emerald-900/40"
                      }`}
                      title={p.isActive ? "Nonaktifkan paket" : "Aktifkan paket"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeletePlan(p)}
                      className="p-2 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-900/60 hover:bg-rose-900/40 min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Hapus paket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PAKET */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#121215] border border-[#27272a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>{editingPlan ? "Edit Paket Membership" : "Tambah Paket Membership Baru"}</span>
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Tutup form paket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-zinc-300 font-medium block mb-1">Nama Paket:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gold Activator (50x)"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Slug Unik:</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    placeholder="contoh: pro_50"
                    value={planForm.slug}
                    onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white disabled:opacity-50 focus:outline-none focus:border-emerald-500 font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Harga (IDR):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">
                    Kuota (-1 = Tak Terbatas):
                  </label>
                  <input
                    type="number"
                    required
                    value={planForm.quota}
                    onChange={(e) => setPlanForm({ ...planForm, quota: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white font-mono focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Durasi (Bulan):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={planForm.durationMonths}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, durationMonths: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white font-mono focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-zinc-300 font-medium block mb-1">Badge Promo (Opsional):</label>
                  <input
                    type="text"
                    placeholder="Contoh: BEST VALUE"
                    value={planForm.badgeText}
                    onChange={(e) => setPlanForm({ ...planForm, badgeText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-medium min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold min-h-[44px] flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Paket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: USERS & RESELLERS (CRUD) */}
      {/* ===================================================================== */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Cari email pengguna, nama, atau API key..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "customer", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setUsersRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium min-h-[36px] transition-colors ${
                    usersRole === r
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-[#18181b] text-zinc-400 hover:text-zinc-200 border border-[#27272a]"
                  }`}
                >
                  {r === "ALL" ? "Semua Role" : r}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                <tr>
                  <th className="px-4 py-3.5">Pengguna</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Saldo</th>
                  <th className="px-4 py-3.5">Membership Aktif</th>
                  <th className="px-4 py-3.5">API Key</th>
                  <th className="px-4 py-3.5">Total Order</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                      Memuat daftar pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                      Tidak ada pengguna yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const activeMem = u.memberships?.[0];
                    return (
                      <tr key={u.id} className="hover:bg-[#18181b]/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{u.email}</div>
                          <div className="text-zinc-500 text-[11px]">{u.displayName || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              u.role === "admin"
                                ? "bg-purple-500/10 border border-purple-500/30 text-purple-400"
                                : "bg-zinc-800 border border-zinc-700 text-zinc-300"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{formatRupiah(u.balance)}</td>
                        <td className="px-4 py-3 text-zinc-300">
                          {activeMem ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-white">{activeMem.planName}</span>
                              <div className="text-[10px] text-zinc-500">
                                Sisa: {activeMem.remainingQuota === -1 ? "Unlimited" : `${activeMem.remainingQuota}x`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-500">Tidak Ada</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.apiKey ? (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400 text-[10px]">
                                {u.apiKey.slice(0, 8)}...
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(u.apiKey);
                                  setCopiedKey(u.id);
                                  setTimeout(() => setCopiedKey(null), 2000);
                                }}
                                className="p-1 rounded text-zinc-500 hover:text-white"
                                title="Salin API Key"
                              >
                                {copiedKey === u.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{u._count?.orders || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRole(u.role);
                                setUserModalType("role");
                              }}
                              className="px-2 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[11px] text-zinc-300"
                              title="Ubah Role"
                            >
                              Role
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setBalanceAmount(10000);
                                setUserModalType("balance");
                              }}
                              className="px-2 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[11px] text-emerald-400"
                              title="Sesuaikan Saldo"
                            >
                              Saldo
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setGrantPlanId(plans[0]?.id || "");
                                setUserModalType("membership");
                              }}
                              className="px-2 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[11px] text-blue-400"
                              title="Beri Kuota Membership"
                            >
                              +Kuota
                            </button>
                            <button
                              onClick={() => handleResetApiKey(u)}
                              className="p-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-400 hover:text-white"
                              title="Reset API Key"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER ACTION MODALS */}
      {selectedUser && userModalType === "role" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#121215] border border-[#27272a] p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Ubah Role Pengguna</span>
            </h3>
            <p className="text-xs text-zinc-400">Akun: {selectedUser.email}</p>
            <div className="space-y-2">
              <label className="text-xs text-zinc-300 font-medium block">Pilih Role Baru:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
              >
                <option value="customer">customer (Pengguna Reguler / Reseller)</option>
                <option value="admin">admin (Administrator Sistem Penuh)</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setUserModalType(null)}
                className="px-4 py-2 rounded bg-[#18181b] text-zinc-300 text-xs min-h-[40px]"
              >
                Batal
              </button>
              <button
                disabled={actionLoading}
                onClick={handleUpdateUserRole}
                className="px-4 py-2 rounded bg-emerald-500 text-black font-semibold text-xs min-h-[40px]"
              >
                Simpan Role
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && userModalType === "balance" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#121215] border border-[#27272a] p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Sesuaikan Saldo Reseller</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Akun: {selectedUser.email} (Saldo saat ini: {formatRupiah(selectedUser.balance)})
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">Metode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceMode("add")}
                    className={`py-2 text-xs rounded border ${
                      balanceMode === "add" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : "bg-[#18181b] text-zinc-400 border-[#27272a]"
                    }`}
                  >
                    + Tambah Saldo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceMode("set")}
                    className={`py-2 text-xs rounded border ${
                      balanceMode === "set" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : "bg-[#18181b] text-zinc-400 border-[#27272a]"
                    }`}
                  >
                    Atur Nominal Tetap
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">Nominal (IDR):</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-emerald-400 font-mono font-bold text-sm min-h-[44px]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setUserModalType(null)}
                className="px-4 py-2 rounded bg-[#18181b] text-zinc-300 text-xs min-h-[40px]"
              >
                Batal
              </button>
              <button
                disabled={actionLoading}
                onClick={handleAdjustBalance}
                className="px-4 py-2 rounded bg-emerald-500 text-black font-semibold text-xs min-h-[40px]"
              >
                Perbarui Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && userModalType === "membership" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#121215] border border-[#27272a] p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Beri Kuota Membership Langsung</span>
            </h3>
            <p className="text-xs text-zinc-400">Akun: {selectedUser.email}</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Pilih Paket:</label>
                <select
                  value={grantPlanId}
                  onChange={(e) => setGrantPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white min-h-[44px]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.quota}x aktivasi)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Jatah Kuota Aktivasi:</label>
                <input
                  type="number"
                  value={grantQuota}
                  onChange={(e) => setGrantQuota(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Masa Aktif (Bulan):</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white font-mono min-h-[44px]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setUserModalType(null)}
                className="px-4 py-2 rounded bg-[#18181b] text-zinc-300 text-xs min-h-[40px]"
              >
                Batal
              </button>
              <button
                disabled={actionLoading || !grantPlanId}
                onClick={handleGrantMembership}
                className="px-4 py-2 rounded bg-emerald-500 text-black font-semibold text-xs min-h-[40px]"
              >
                Aktifkan Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: SETTINGS (SYSTEM & STORE CONFIG) */}
      {/* ===================================================================== */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Harga Satuan Eceran */}
          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Tarif Aktivasi Eceran (Per-Pcs)</h2>
                <p className="text-xs text-zinc-400">
                  Harga publik yang dibayar pembeli satuan via QRIS otomatis di halaman checkout.
                </p>
              </div>
            </div>

            <div className="max-w-xs space-y-1">
              <label className="text-xs text-zinc-300 font-medium">Nominal Harga (IDR):</label>
              <input
                type="number"
                min={500}
                step={500}
                required
                value={singlePrice}
                onChange={(e) => setSinglePrice(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
              <p className="text-[11px] text-zinc-500 font-mono">
                Saat ini: {formatRupiah(singlePrice)} per lisensi 1 tahun
              </p>
            </div>
          </div>

          {/* Mode Pemeliharaan & Countdown */}
          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Power className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Status Operasional & Waktu Bayar</h2>
                <p className="text-xs text-zinc-400">
                  Kontrol status toko dan batas waktu pembayaran QRIS pelanggan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Mode Pemeliharaan (Maintenance)</span>
                  <span className="text-[11px] text-zinc-400">
                    Tutup proses checkout sementara jika server sedang perbaikan
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors ${
                    maintenanceMode
                      ? "bg-rose-500 text-white"
                      : "bg-[#121215] border border-[#27272a] text-zinc-400"
                  }`}
                >
                  {maintenanceMode ? "Aktif (Toko Tutup)" : "Nonaktif (Toko Buka)"}
                </button>
              </div>

              <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] space-y-1">
                <label className="text-xs font-semibold text-white block">
                  Batas Waktu Countdown QRIS (Menit):
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#27272a] text-xs text-white font-mono min-h-[40px]"
                />
                <span className="text-[10px] text-zinc-500">
                  Pesanan otomatis dibatalkan jika belum dibayar melewati batas ini.
                </span>
              </div>
            </div>
          </div>

          {/* Kontak Dukungan WhatsApp & Pengumuman */}
          <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Kontak Customer Service & Banner Pengumuman</h2>
                <p className="text-xs text-zinc-400">
                  Nomor WhatsApp resmi dan teks berjalan yang tampil di halaman utama toko.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Nomor WhatsApp CS (Format 62):</label>
                <input
                  type="text"
                  placeholder="628123456789"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Pesan Pembuka Bantuan WhatsApp:</label>
                <input
                  type="text"
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white min-h-[44px]"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1">
                  Teks Pengumuman Banner Berjalan (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Server aktivator normal dan siap proses otomatis 24 jam."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white placeholder-zinc-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs flex items-center justify-center gap-2 min-h-[44px]"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Semua Pengaturan Toko</span>
          </button>
        </form>
      )}
    </div>
  );
}

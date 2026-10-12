"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Key, Copy, Terminal, Check, Play, Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function DeveloperDocsPage() {
  const { dbUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"curl" | "node" | "python">("curl");

  // Playground state
  const [testEmail, setTestEmail] = useState("");
  const [testMagicLink, setTestMagicLink] = useState("");
  const [testNickname, setTestNickname] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const copyApiKey = () => {
    if (!dbUser?.apiKey) return;
    navigator.clipboard.writeText(dbUser.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestApi = async () => {
    if (!dbUser?.apiKey) {
      alert("Silakan masuk dengan Google dan miliki paket kuota untuk mencoba API.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post(
        "/api/v1/activate",
        {
          email: testEmail.trim(),
          magicLink: testMagicLink.trim(),
          nickname: testNickname.trim() || undefined,
        },
        {
          headers: {
            "x-api-key": dbUser.apiKey,
          },
        }
      );
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult(err.response?.data || { error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const apiKeyDisplay = dbUser?.apiKey || "amp_YOUR_API_KEY_HERE";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Back button & Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Dokumentasi REST API Activator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Gunakan API ini untuk menghubungkan bot WhatsApp, bot Telegram, atau sistem backend Anda.
            Setiap permintaan aktivasi yang berhasil akan memotong kuota paket membership Anda secara otomatis.
          </p>
        </div>
      </div>

      {/* API Key Box */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
            API Key Akun Anda
          </span>
          {dbUser?.activeMembership ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#18181b] text-emerald-400 font-mono border border-emerald-900/60">
              Kuota: {dbUser.activeMembership.remainingQuota === -1 ? "Unlimited" : `${dbUser.activeMembership.remainingQuota}x`}
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#18181b] text-amber-400 font-mono border border-amber-900/60">
              Memerlukan Membership Aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={apiKeyDisplay}
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#16161a] border border-[#27272a] text-xs text-emerald-400 font-mono select-all"
          />
          <button
            onClick={copyApiKey}
            className="px-3.5 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Disalin" : "Salin Key"}</span>
          </button>
        </div>
      </div>

      {/* ENDPOINT 1: SEND LINK */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-[#18181b] text-sky-400 font-mono font-bold text-xs border border-[#27272a]">
            POST
          </span>
          <code className="text-sm font-mono font-bold text-white">/api/v1/send-link</code>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Mengirimkan magic link login resmi Alight Motion ke email target. Endpoint ini tidak memotong kuota membership.
        </p>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-zinc-400 block">Header Request:</span>
          <pre className="p-3 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto">
{`Content-Type: application/json
x-api-key: ${apiKeyDisplay}`}
          </pre>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-zinc-400 block">Body Request (JSON):</span>
          <pre className="p-3 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "email": "customer@gmail.com"
}`}
          </pre>
        </div>
      </div>

      {/* ENDPOINT 2: VERIFY LINK & ACTIVATE */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-[#18181b] text-emerald-400 font-mono font-bold text-xs border border-[#27272a]">
            POST
          </span>
          <code className="text-sm font-mono font-bold text-white">/api/v1/activate</code>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Memvalidasi magic link, mengatur nickname (opsional), mendaftarkan lisensi VIP 1 Tahun ke akun, dan memotong 1 kuota paket aktif Anda.
        </p>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-zinc-400 block">Body Request (JSON):</span>
          <pre className="p-3 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "email": "customer@gmail.com",
  "magicLink": "https://alightcreative.com?ui_sid=...&oobCode=ab12cd...",
  "nickname": "Nama Pengguna"
}`}
          </pre>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-zinc-400 block">Contoh Response Sukses (200 OK):</span>
          <pre className="p-3 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "success": true,
  "message": "Aktivasi via Developer API Berhasil!",
  "quota": {
    "isUnlimited": false,
    "remaining": 49,
    "expiresAt": "2026-11-11T00:00:00.000Z"
  },
  "data": {
    "email": "customer@gmail.com",
    "displayName": "Nama Pengguna",
    "planName": "Alight Motion Pro / Member",
    "subscriptionType": "Yearly VIP License",
    "validUntil": "11 September 2027",
    "orderId": "GPA.ENCH-3974-4453-52315"
  }
}`}
          </pre>
        </div>
      </div>

      {/* CODE EXAMPLES (Tabs: cURL, Node.js, Python) */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
          <h2 className="text-sm font-bold text-white">Contoh Kode Integrasi</h2>
          <div className="flex gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
            {(["curl", "node", "python"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeCodeTab === tab
                    ? "bg-[#27272a] text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab === "curl" ? "cURL" : tab === "node" ? "Node.js" : "Python"}
              </button>
            ))}
          </div>
        </div>

        {activeCodeTab === "curl" && (
          <pre className="p-3.5 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`curl -X POST https://yourdomain.com/api/v1/activate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeyDisplay}" \\
  -d '{
    "email": "customer@gmail.com",
    "magicLink": "PASTE_MAGIC_LINK_HERE",
    "nickname": "Editor Pro"
  }'`}
          </pre>
        )}

        {activeCodeTab === "node" && (
          <pre className="p-3.5 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`import axios from "axios";

async function activateLicense(email, magicLink, nickname) {
  const response = await axios.post(
    "https://yourdomain.com/api/v1/activate",
    { email, magicLink, nickname },
    {
      headers: {
        "x-api-key": "${apiKeyDisplay}",
      },
    }
  );
  return response.data;
}`}
          </pre>
        )}

        {activeCodeTab === "python" && (
          <pre className="p-3.5 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`import requests

def activate_license(email, magic_link, nickname="Editor Pro"):
    url = "https://yourdomain.com/api/v1/activate"
    headers = {"x-api-key": "${apiKeyDisplay}"}
    payload = {
        "email": email,
        "magicLink": magic_link,
        "nickname": nickname
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()`}
          </pre>
        )}
      </div>

      {/* Interactive Testing Playground */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Uji Coba Langsung Endpoint API</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Jalankan pengujian langsung ke <code className="text-zinc-200">/api/v1/activate</code> menggunakan API Key akun Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="email"
            placeholder="Email Target (contoh: user@gmail.com)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-[#16161a] border border-[#27272a] text-xs text-white placeholder-zinc-500"
          />
          <input
            type="text"
            placeholder="Nickname (Opsional)"
            value={testNickname}
            onChange={(e) => setTestNickname(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-[#16161a] border border-[#27272a] text-xs text-white placeholder-zinc-500"
          />
        </div>

        <input
          type="text"
          placeholder="Magic link lengkap dari email..."
          value={testMagicLink}
          onChange={(e) => setTestMagicLink(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-white placeholder-zinc-500"
        />

        <button
          onClick={handleTestApi}
          disabled={testing}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Jalankan Pengujian API</span>
        </button>

        {testResult && (
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-mono text-zinc-400 block">Response Server:</span>
            <pre className="p-3.5 rounded-lg bg-[#16161a] border border-[#27272a] text-xs font-mono text-zinc-300 overflow-x-auto max-h-60">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

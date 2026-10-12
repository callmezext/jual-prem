import Link from "next/link";
import { MessageSquare, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const csWa = process.env.NEXT_PUBLIC_CS_WHATSAPP || "6285704625361";
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Enchant Store";

  return (
    <footer className="border-t border-[#27272a] bg-[#09090b] mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 pb-10 border-b border-[#27272a]">
          <div className="space-y-2 max-w-sm">
            <span className="font-bold text-sm text-white">
              {storeName} Alight Motion Activator
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Layanan aktivasi resmi lisensi Annual VIP Alight Motion ke email pribadi pelanggan.
              Didukung gerbang pembayaran otomatis QRIS dan integrasi REST API bagi pemilik bot.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs text-zinc-400">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Layanan</span>
              <Link href="/aktivasi" className="hover:text-emerald-400 font-medium transition-colors">
                Dashboard Aktivasi Lisensi
              </Link>
              <Link href="/#membership" className="hover:text-white transition-colors">
                Paket Reseller & Kuota
              </Link>
              <Link href="/developer" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Dokumentasi API</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Bantuan</span>
              <a
                href={`https://wa.me/${csWa}?text=Halo%20Admin%20${storeName}%20saya%20butuh%20bantuan%20aktivasi%20AM%20Pro`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Admin: +{csWa}</span>
              </a>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Garansi Masa Aktif 1 Tahun</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {storeName}. Hak cipta dilindungi.</p>
          <p className="font-mono text-[11px]">
            Direct QRIS & Firebase Magic Link System
          </p>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";

export const metadata: Metadata = {
  title: "Enchant Store | Alight Motion Premium Activator & Reseller Portal",
  description:
    "Aktivasi lisensi Alight Motion Pro 1 Tahun resmi akun pribadi secara otomatis dengan API Ampro dan QRIS Mustika Payment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#09090b] text-zinc-100 flex flex-col min-h-screen selection:bg-emerald-500/20 selection:text-emerald-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

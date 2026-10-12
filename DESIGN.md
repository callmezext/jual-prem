# DESIGN DIRECTION — ENCHANT AM PRO ACTIVATOR

> **Dial: ENERGY 1 / RHYTHM 2 / MOTION 1**  
> **Filter:** Anti-Slop System (`antislop-ui`, `antislop-copywriting`, `antislop-layoutmobile`, `antislop-human`)

---

## 1. Identitas & Nilai Produk
- **Produk:** Layanan aktivasi mandiri lisensi Alight Motion Pro resmi 1 Tahun via QRIS & portal reseller (Developer API).
- **Karakter:** Utilitarian, presisi, transparan, cepat, berorientasi fungsi (bukan landing page template AI).
- **Target Pengguna:** Kreator video mobile dan pemilik bot WhatsApp/Telegram yang membutuhkan aktivasi lisensi tanpa ribet.

---

## 2. Palet Warna (Maksimal 2 Warna Inti + 1 Aksen Terarah)
- **Base Canvas:** `#09090b` (Zinc 950 — hitam arang matte, bukan ungu neon)
- **Surface Layer:** `#121215` (Surface kartu solid, tanpa glassmorphism berlebihan)
- **Border / Garis Pemisah:** `#27272a` (Zinc 800 — kontras 1px yang tegas)
- **Teks Utama:** `#f4f4f5` (Zinc 100 — kontras WCAG AAA)
- **Teks Pendukung:** `#a1a1aa` (Zinc 400 — kontras > 5:1, WCAG AA)
- **Aksen Tunggal:** `#10b981` (Emerald — hanya untuk status aktif dan tombol aksi utama)
- **Aksen Sekunder:** `#38bdf8` (Sky blue — khusus untuk penanda dokumentasi/API)

---

## 3. Tipografi & Tata Letak
- **Font Display & Body:** System Sans-serif modern (Inter / Segoe UI / Roboto).
- **Font Data/Kode:** Monospace (`ui-monospace`, `monospace`) untuk invoice, API Key, dan cURL endpoint.
- **Rhythm (Irama Bagian):**
  - Menggunakan layout asimetris fungsional: Hero atas berisi Workbench (dua tab: Beli Langsung & Aktivasi Cepat).
  - Katalog grosir berbasis tabel/tier kartu terstruktur dengan rincian harga per unit.
  - Dokumentasi API yang ringkas dan siap uji coba.
  - Tidak ada bento-grid generic, tidak ada terminal palsu dengan dot lampu merah-kuning-hijau.
- **Hierarki Radius:** `rounded-lg` (8px) untuk input dan tombol; `rounded-xl` (12px) untuk kartu kontainer. Tidak ada pill button berlebihan di setiap elemen.

---

## 4. Larangan Tegas (Anti-Slop Hard Gates)
1. **Dilarang Emoji:** Nol emoji di seluruh teks, heading, badge, tombol, dan notifikasi. Gunakan icon Lucide spesifik.
2. **Dilarang Em Dash (`—`):** Gunakan koma, titik, tanda kurung, atau titik dua sesuai aturan R-02.
3. **Dilarang Animasi Berulang Tanpa Henti:** Tidak ada `animate-ping` atau `animate-pulse` tak berujung. Titik status server adalah titik hijau solid yang stabil.
4. **Dilarang Data Palsu / Testimonial Fiktif:** Tidak ada statistik 10K+ users atau review palsu. Hanya tampilkan data sistem real.
5. **Dilarang Glow Berlebihan:** Hapus `shadow-neon-glow`, glow border, dan ambient neon blur.

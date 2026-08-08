# CATATAN PROYEK B2B RETAIL

## 1. Tautan Aplikasi (Vercel Deployments)
- **Panel Admin:** https://projectn2ndaf.vercel.app
- **Mobile App (Web Version):** https://dist-red-two-azquh6aik0.vercel.app
*(Gunakan link Mobile App di atas pada PWABuilder jika Anda ingin mengekspornya menjadi APK Android/Native app).*

## 2. Kredensial Login (Supabase Auth)
**Akun Admin Panel:**
- Email: admin@b2b.com
- Password: admin123

**Akun Mobile App (User/Dealer):**
- Email: dealer@b2b.com
- Password: dealer123

## 3. Database & Supabase
- **Dashboard Data:** Sebagian besar data (Daftar Produk, Dealer, Order, Region, Kategori) sudah menggunakan tabel yang ada di Supabase. Data-data ini dapat dikelola langsung dari panel Supabase atau panel admin.
- **Tabel Tambahan (Banner & Notifikasi):** 
  Untuk membuat Banner dan Notifikasi di mobile app menjadi dinamis, Anda perlu menambahkan tabel tersebut. Saya telah membuat script-nya di dalam file `add_tables.sql`.
  **Cara menjalankannya:** 
  1. Buka folder proyek ini dan buka file `add_tables.sql`.
  2. Copy seluruh teks di dalamnya.
  3. Buka dashboard Supabase Anda -> menu **SQL Editor**.
  4. Paste kode tersebut, dan klik tombol "Run" / jalankan.
- **Data Real-time Dashboard Admin:** Perhitungan Total Penjualan, Total Dealer, dan Order Hari Ini sekarang sudah otomatis terhubung ke database.

## 4. Repositori GitHub
- Proyek ini tersimpan pada repositori GitHub Anda: `https://github.com/hagiaya/projectb2bdaf.git`
- Setiap pembaruan yang dipush ke branch `main` pada repositori ini akan memicu Vercel untuk mem-build dan me-deploy ulang kedua aplikasi secara otomatis.

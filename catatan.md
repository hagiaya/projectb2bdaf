# CATATAN PROYEK B2B RETAIL & PROGRESS HARIAN

## 1. Aturan & Cara Menjalankan Aplikasi (PENTING)
- **Eksekusi Otomatis:** Asisten bekerja mandiri dan langsung memilih solusi terbaik dari awal sampai akhir tanpa meminta klik/konfirmasi berulang.
- **Admin Web:**
  ```bash
  cd admin-web && npm run dev
  ```
  *(Berjalan di http://localhost:3000)*
- **Mobile App (Expo):**
  ```bash
  cd mobile-app && npx expo start
  ```
  *(DILARANG menggunakan flag `--web`. Buka via aplikasi Expo Go di smartphone).*

---

## 2. Fitur Baru yang Selesai Dikerjakan Hari Ini

### A. Role Sales & Toko Binaan (Selesai Penuh)
1. **Presensi Harian Sales:**
   - Jam kerja 10:00 - 19:00 WIB dengan deteksi otomatis status Terlambat (*LATE*).
   - Check-in dan Check-out dengan validasi GPS & foto selfie.
2. **Kunjungan Toko / Outlet Binaan:**
   - Timer countdown minimal 30 menit per kunjungan.
   - Cooldown kunjungan 2 hari.
   - Input catatan hasil meeting toko & foto bukti visitasi.
3. **Mekanisme Toko Binaan:**
   - Toko otomatis terikat menjadi toko binaan saat calon dealer mendaftar di aplikasi dan memilih **"Didaftarkan oleh Sales (Nama Akun Sales)"**.
   - Kolom `dealers.sales_id` otomatis terisi dengan ID sales yang dipilih.
4. **Detailed Order Toko Binaan (Bukan Input Order Sales):**
   - Sales tidak menginput pesanan canvassing, melainkan memantau **Detailed Order** toko binaannya.
   - Filter per toko binaan, status transaksi, rincian produk/harga, serta tombol follow-up WhatsApp langsung ke toko.
5. **Permohonan Izin & Cuti:**
   - Form pengajuan cuti/sakit dengan upload surat dokter.
   - Approval/Reject di panel admin monitoring sales dengan catatan admin.
6. **Admin Master & Monitoring Sales:**
   - Halaman `/sales` untuk KPI sales, target bulanan, dan assign wilayah kerja.
   - Halaman `/monitoring` untuk presensi harian, GPS log visitasi, dan approval cuti.

### B. Program Target & Reward Dealer (Selesai Penuh)
1. **Admin Menentukan Program (`/programs`):**
   - Admin membuat target omset belanja (Rp) dengan 3 kategori:
     - 🎁 **Target Pengajuan Barang Support** (Etalase Kaca Display DAP, Neon Box, Rak Aksesoris).
     - ✈️ **Target Trip Liburan** (Tour Eksklusif Bangkok 4D3N, Bali, dsb).
     - 💰 **Target Program Cashback** (Cashback tunai 5% langsung cair ke rekening).
   - Admin memantau progres omset seluruh toko dan menyetujui klaim hadiah (*Approval & No Resi / Bukti Transfer*).
2. **Dealer Mengikuti Program (`/(dealer)/programs`):**
   - Dealer dapat memilih dan menekan tombol **"Ikuti Program Ini"**.
   - **Live Progress Bar**: Akumulasi belanja pesanan selesai (*orders COMPLETED*) otomatis dihitung terhadap target.
   - **Klaim Hadiah 100%**: Tombol emas klaim hadiah aktif saat target tembus untuk mengirim data penerima hadiah.
   - Menu **Program** aktif di Menu Utama dan banner carousel beranda dealer.

---

## 3. Skrip Migrasi SQL untuk Supabase
Jalankan file SQL berikut di **Supabase Dashboard > SQL Editor**:
1. `sales_complete_migration.sql` – Seluruh tabel & RLS untuk Sales, Presensi, Visitasi, Cuti, dan Toko Binaan.
2. `add_dealer_programs.sql` – Tabel `dealer_programs`, `dealer_program_participants`, RLS, dan 3 program awal siap pakai.

---

## 4. Tautan & Akses Cepat Lokal
- **Admin Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Admin Master Sales:** [http://localhost:3000/sales](http://localhost:3000/sales)
- **Admin Monitoring Sales:** [http://localhost:3000/monitoring](http://localhost:3000/monitoring)
- **Admin Program Dealer:** [http://localhost:3000/programs](http://localhost:3000/programs)
- **Admin Master Dealer:** [http://localhost:3000/dealers](http://localhost:3000/dealers)
- **Mobile Metro Bundler:** [http://localhost:8081](http://localhost:8081) / Expo Go

---

## 5. Rencana Lanjutan untuk Sesi Besok
- Menguji integrasi end-to-end setelah menjalankan kedua file SQL di Supabase.
- Memeriksa fitur lanjutan dealer/admin yang ingin ditambahkan berikutnya.

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
1. **Aturan 1 Program Aktif:**
   - Dealer hanya dapat mengikuti **1 program reward aktif** dalam satu periode.
   - Program lain tetap bisa dilihat detailnya (hadiah, deskripsi, ketentuan), namun tombol pendaftarannya otomatis terkunci dengan badge status: *"Terkunci (Sedang Mengikuti 1 Program)"*.
   - Saat dealer mencoba memilih program lain, sistem memberikan penjelasan informatif dan mencegah pendaftaran ganda.

2. **Katalog Produk Support (Etalase & Display DAP):**
   - Sesuai poster resmi **KATALOG PROGRAM SUPPORT DAP**, terdapat 10 item pilihan dengan syarat minimal akumulasi belanja:
     1. `DLP13`: **KURSI PLASTIK DAP** – Min. Pembelian Rp 500.000
     2. `DLP16`: **RAK MINI** (Smart Accessories Center Meja Kasir) – Min. Pembelian Rp 2.500.000
     3. `LOGO GANTUNG`: **LOGO GANTUNG DAP LED** (120cm x 30.5cm) – Min. Pembelian Rp 3.500.000
     4. `DLP30`: **RAK PUTAR AKSESORIS** (Multi-Sisi 360°) – Min. Pembelian Rp 4.500.000
     5. `DLP09`: **RAK DINDING TOKO** (100cm x 100cm) – Min. Pembelian Rp 5.000.000
     6. `DLP01`: **RAK BESAR 220cm** – Min. Pembelian Rp 6.000.000
     7. `DLP14`: **RUNNING TEXT** (NOW OPEN DAP LED 130cm x 20cm) – Min. Pembelian Rp 6.000.000
     8. `DLP17`: **RAK JUMBO 240cm** – Min. Pembelian Rp 8.000.000
     9. `DLP18`: **RAK TENGAH ISLAND 5 TINGKAT** (128cm x 90cm) – Min. Pembelian Rp 10.000.000
     10. `ETALASE`: **ETALASE SHOWCASE DISPLAY** (110cm x 120cm x 50cm Kaca Mewah) – Min. Pembelian Rp 25.000.000
   - **Fitur untuk Admin (`/programs`):**
     - Tombol *"Kelola Katalog Support"* pada program Barang Support.
     - Admin dapat mengedit syarat minimal pembelian, menambah item display baru, atau menghapus item.
     - Tabel partisipan dealer menampilkan badge item yang dipilih oleh toko, target khusus item, progres persen, dan verifikasi klaim hadiah.
   - **Fitur untuk Dealer (`/(dealer)/programs`):**
     - Saat memilih program Barang Support, dealer disajikan modal interaktif untuk memilih 1 dari 10 item reward display yang ingin dikejar.
     - Target akumulasi belanja toko otomatis disesuaikan dengan minimal pembelian item yang dipilih.
     - Tersedia tombol *"Lihat Poster Brosur Resmi DAP"* untuk melihat poster asli DAP resolusi tinggi lengkap dengan dimensi ukuran.
     - Progres akumulasi belanja otomatis menghitung persen terhadap target item pilihan tersebut.

### C. Popup Peringatan & Konfirmasi Order Sebelum Diproses (Mobile App)
1. **Pencegahan Human Error & Pesanan Tidak Sengaja:**
   - Di layar `Checkout` (`/(dealer)/checkout.tsx`), tombol *"Konfirmasi Transfer & Buat Pesanan"* / *"Buat Pesanan (COD Bayar)"* kini tidak langsung memproses transaksi ke database.
   - Sistem menampilkan **Modal Popup Peringatan & Verifikasi Pesanan** yang elegan dan interaktif.
2. **Detail Komponen Popup:**
   - **Badge Peringatan & Info:** Icon peringatan amber dengan pesan ketegasan bahwa pesanan yang diproses langsung masuk ke operasional gudang dan tidak dapat dibatalkan secara sepihak.
   - **Rincian Alamat Outlet:** Nama toko dan alamat pengiriman terdaftar.
   - **Rincian Produk:** Total kuantitas (pcs), variasi produk, nama item, kuantitas per produk, dan subtotal harga.
   - **Metode Pembayaran:** Rincian Transfer Bank Manual (+ Kode Unik) atau COD, serta indikator status apakah bukti pembayaran sudah dilampirkan atau belum.
   - **Total Tagihan Akhir:** Nominal akhir yang harus dibayarkan.
   - **Dua Tombol Aksi:**
     - *"Cek Kembali"*: Menutup popup untuk memeriksa/mengubah pesanan.
     - *"Ya, Proses Pesanan"*: Mengeksekusi pembuatan pesanan dengan animasi loading spinner.

### D. Pengaturan Urutan Kategori & Prioritas Produk (Admin Web & Mobile App)
1. **Urutan Kategori (`/categories`):**
   - Admin dapat menentukan urutan kategori mana yang tampil lebih dahulu di mobile app.
   - Setiap kartu kategori memiliki **Badge Nomor Urut** (misal: `#1`, `#2`) dan tombol panah **▲ / ▼** untuk menaikkan/menurunkan posisi secara instan.
   - Form Tambah & Edit Kategori dilengkapi input **Urutan Tampilan (Prioritas)** (nomor 1 = paling depan).
   - Tersedia tombol modal **"Atur Urutan Tampilan"** untuk menyusun seluruh daftar kategori secara fleksibel dan menyimpan seluruh urutan sekaligus.
   - Di mobile app (`catalog.tsx`), kategori otomatis diurutkan berdasarkan prioritas admin (`sort_order ASC, name ASC`).

2. **Urutan Prioritas Produk (`/products`):**
   - Admin dapat menentukan prioritas produk unggulan yang tampil lebih awal di etalase mobile app.
   - Tabel produk memiliki kolom **Prioritas** lengkap dengan badge nomor urut dan tombol panah **▲ / ▼** untuk menaikkan/menurunkan prioritas.
   - Filter tabel dilengkapi pilihan pengurutan: **Urutan Prioritas Admin (Default)**, Nama (A-Z), Harga Termurah, Harga Termahal, Stok Terbanyak, dan Terbaru Ditambahkan.
   - Form Tambah & Edit Produk memiliki input **Urutan Tampilan / Prioritas Produk**.
   - Tersedia tombol modal **"Atur Prioritas Produk"** lengkap dengan filter per kategori untuk menyusun produk mana yang tampil di urutan atas dalam kategori tersebut.
   - Di mobile app (`category/[id].tsx` dan `home.tsx`), produk ditampilkan sesuai urutan prioritas admin (`sort_order ASC`).

### E. Popup Peringatan Khusus Data Transfer Bank (Mobile App)
1. **Validasi & Peringatan di Halaman Checkout (`checkout.tsx`):**
   - Saat dealer memilih metode pembayaran **Transfer Bank Manual** dan menekan *"Konfirmasi Transfer & Buat Pesanan"*, sistem menampilkan **Popup Peringatan Data Transfer**.
   - **Informasi Krusial yang Ditampilkan:**
     - **Rekening Tujuan Resmi:** Bank BCA `829-019-8821` a.n. `PT DISTRIBUSI AKSESORIS PRIMA`.
     - **Nominal Transfer Wajib Tepat:** Total pembayaran termasuk 3 digit kode unik (misal: `+Rp 482`). Ditegaskan **DILARANG MEMBULATKAN NOMINAL** agar verifikasi otomatis berhasil.
     - **Struk Bukti Pembayaran:** Pengguna diingatkan menyimpan struk ATM / screenshot m-banking yang jelas.
     - **Rincian Pembayaran:** Subtotal, kode unik, dan nominal transfer akhir.
     - **Tombol Aksi:** *"Cek Kembali Data"* (batal/tutup modal) dan *"Data Sesuai, Lanjutkan"* (memproses pesanan).
2. **Validasi & Peringatan di Riwayat Pesanan (`orders.tsx`):**
   - Saat dealer menekan tombol *"Upload Bukti"* atau *"Ganti Bukti"* pada pesanan berstatus Transfer, muncul popup peringatan verifikasi data transfer sebelum galeri foto dibuka.
   - Memastikan dealer mengecek nomor rekening dan nominal transfer yang tercantum pada struk sebelum diunggah.

### F. Mode List & Grid Produk di Aplikasi Mobile (`category/[id].tsx` & `catalog.tsx`)
1. **Pilihan Tampilan Fleksibel (Grid / List):**
   - Dealer dapat bebas memilih mode tampilan produk sesuai kenyamanan mereka:
     - **Mode Grid (2 Kolom):** Tampilan kartu visual 2 sisi yang estetik, menampilkan foto besar, badge status (NEW / HABIS), nama SKU, bintang rating, harga, dan tombol cepat `+`.
     - **Mode List (1 Kolom Horizontal):** Tampilan daftar baris yang lebih informatif dan mudah dipindai, menampilkan thumbnail produk, badge kategori & status, judul lengkap SKU, rating & jumlah terjual, harga, stok persis, serta tombol aksi beli `+ Keranjang`.
2. **Toolbar & Tombol Switch Modern:**
   - Ditempatkan tepat di bawah bilah pencarian, menampilkan ringkasan jumlah produk (misal: *"24 Produk"*) dan segmented toggle button berikon Grid & List.
   - Status aktif memiliki highlight warna hijau lembut dengan shadow kartu modern.
3. **Penyimpanan Preferensi Otomatis (`AsyncStorage`):**
   - Pilihan mode tampilan pengguna disimpan ke memori lokal HP (`AsyncStorage`).
   - Saat pengguna keluar dari aplikasi atau berpindah kategori, mode pilihan terakhir akan otomatis tetap digunakan tanpa harus memilih ulang.
4. **Dukungan Seragam pada Katalog Kategori (`catalog.tsx`):**
   - Fitur toggle Grid dan List juga disematkan pada halaman penjelajahan kategori produk, memberikan pengalaman belanja yang konsisten dan mulus di seluruh aplikasi.

### G. Restok Produk & Manajemen Stok Terhubung Master Produk (Admin Web)
1. **Halaman Restok Produk (`/inventory?tab=restock`):**
   - **Filter Kategori Dinamis:** Admin dapat memfilter produk yang ingin direstok berdasarkan kategori spesifik atau melihat seluruh kategori.
   - **Filter Status Stok:** Filter cepat untuk melihat produk dengan status `Butuh Restok Segera (≤ 20)`, `Stok Menipis (21-50)`, `Stok Aman (> 50)`, atau `Stok Kosong (0)`.
   - **Pengelompokan Produk Berdasarkan Kategori:**
     - Tampilan dapat dikelompokkan rapi per kategori (*Grouped Accordion Cards*) dengan header kategori, jumlah item, dan peringatan berapa produk yang butuh restok.
     - Setiap kelompok kategori dapat di-expand/collapse secara interaktif.
     - Tersedia juga toggle untuk berpindah ke tampilan tabel terpadu satu lembar (*Unified Table View*).
     - Pada setiap baris produk, tersedia tombol cepat `+ Restok` dan input preset `+10, +25, +50, +100` dengan catatan mutasi restok.
2. **Manajemen Stok Terhubung Live ke Master Produk (`/inventory` & `/products`):**
   - **Sinkronisasi 100% Realtime:** Data stok di Manajemen Stok terhubung langsung dengan tabel `products` di Master Produk. Setiap penyesuaian (tambah restok, pengurangan, atau koreksi) otomatis meng-update stok master dan tercermin di aplikasi mobile dealer seketika.
   - **Pemantauan Riwayat Perubahan Stok per Produk:**
     - Tersedia tombol `Riwayat` pada setiap produk di Manajemen Stok dan Master Produk.
     - Membuka modal **"Riwayat Perubahan Stok"** yang menampilkan:
       - Info produk lengkap (SKU, Nama, Kategori, Harga, Sisa Stok Saat Ini).
       - Form input restok cepat langsung dari dalam modal riwayat.
       - Log mutasi kronologis: Waktu/Tanggal, Jenis (`RESTOCK`, `REDUCTION`, `ADJUSTMENT`), Jumlah mutasi (+/-), Stok Sebelum ➔ Stok Sesudah, Catatan/Keterangan, dan Admin pencatat.
3. **Akses Cepat di Sidebar Navigasi:**
   - Ditambahkan menu **Restok Produk** (`/inventory?tab=restock`) dan **Manajemen Stok** (`/inventory`) di sidebar admin untuk alur kerja yang cepat dan efisien.

### H. Pengaturan Termin COD & Sistem Credit Limit Dealer
1. **Pengaturan Kebijakan & Termin COD Perusahaan (Admin Web - `/dealers?tab=cod_settings`):**
   - **Fleksibilitas Penuh Kebijakan Perusahaan:** Admin dapat mengontrol status metode COD (aktif/nonaktif) secara global.
   - **Kustomisasi Label Termin COD:** Admin dapat menetapkan termin pembayaran, misalnya `Bayar Saat Terima Barang (H+0)`, `H+1`, `H+3`, atau `H+7`.
   - **Batas Maksimal Nominal Transaksi COD:** Menetapkan plafon maksimal nilai transaksi belanja dengan COD (misal: Rp 10.000.000) untuk memitigasi risiko keamanan kurir dan pengiriman.
   - **Syarat & Ketentuan Tertulis:** Input kustomisasi teks kebijakan COD resmi perusahaan yang langsung disinkronkan dan dapat dibaca oleh dealer di aplikasi mobile sebelum menyelesaikan pesanan.
2. **Sistem Credit Limit & Hak Akses Kredit Dealer (Admin Web - `/dealers`):**
   - **Hak Akses Eksklusif Mitra:** Fasilitas kredit / tempo (TOP) hanya dapat dinikmati oleh dealer mitra yang disetujui admin (*hanya untuk beberapa yang disetting oleh admin, dealer lain tetap berstatus Reguler tanpa akses tempo*).
   - **Manajemen Plafon Kredit & Tenor:**
     - **Naikkan Limit (`INCREASE`):** Menambah batas plafon kredit dealer dengan nominal tertentu.
     - **Kurangi Limit (`DECREASE`):** Menurunkan atau memangkas batas kredit dealer.
     - **Set Plafon Baru (`SET`):** Menetapkan plafon kredit baru secara langsung.
     - **Nonaktifkan / Cabut Akses Kredit (`DISABLE`):** Mencabut hak akses tempo dealer kembali menjadi akun biasa/reguler.
     - **Tenor Fleksibel (TOP):** Pilihan tenor jatuh tempo 7, 14, 30, 45, hingga 60 hari.
     - **Catatan Persetujuan:** Setiap perubahan plafon mewajibkan alasan/keterangan persetujuan admin untuk akuntabilitas.
   - **Audit Trail Mutasi Limit Kredit (`credit_limit_logs`):** Modal kelola kredit menampilkan riwayat mutasi kredit per dealer (aksi, nominal perubahan, limit sebelum & sesudah, catatan, dan nama admin pengubah).
   - **Indikator Visual Plafon Realtime:** Tabel dealer menampilkan kolom Plafon Kredit, Outstanding (Terpakai), dan Sisa Limit dengan visual progress bar rasio pemakaian serta filter status kredit (`Semua`, `Berhak Kredit`, `Reguler`).
3. **Penyempurnaan Checkout di Mobile App (`checkout.tsx`):**
   - **Pilihan Metode Pembayaran Sesuai Hak Akses:**
     - **Dealer Berhak Kredit:** Menampilkan opsi metode pembayaran **Kredit / Tempo (TOP)** lengkap dengan rincian tenor (`Tempo X Hari`), total plafon, saldo terpakai, dan sisa limit kredit yang siap digunakan.
     - **Dealer Reguler (Biasa):** Pilihan kredit tampil dalam status terkunci (`🔒 Khusus Mitra`) dengan label *"Fasilitas tempo hanya untuk mitra terpilih yang disetujui admin."*
   - **Validasi Cerdas:**
     - Validasi transaksi kredit agar tidak melebihi sisa plafon yang tersedia.
     - Validasi transaksi COD agar tidak melampaui batas maksimal nominal COD perusahaan.
   - **Kebijakan COD Dinamis:** Menampilkan label termin COD aktual perusahaan serta accordion syarat & ketentuan COD.
   - **Pencatatan Otomatis:** Saat checkout dengan kredit, pesanan otomatis berstatus pembayaran `tempo_berjalan`, dan nilai tagihan otomatis menambah `outstanding_balance` dealer secara realtime.
4. **Integrasi Status Pesanan Admin (`/orders`):**
   - Pesanan dengan metode kredit / tempo ditandai dengan badge khusus ungu `Kredit / Tempo (TOP)` baik di tabel pesanan maupun di modal detail rincian pesanan.

### I. Fitur Dealer Khusus & Pilihan Termin Kredit (15 Hari / 30 Hari)
1. **Ketentuan Dealer Khusus (Harga, Kredit, Limit, & Hak Akses):**
   - **Status Kemitraan Khusus:** Admin dapat menetapkan toko tertentu sebagai **Dealer Khusus** (Tier: *VIP Partner*, *Priority Store*, atau *Exclusive Distributor*).
   - **Ketentuan Harga & Diskon Khusus:**
     - Admin dapat menentukan persentase potongan harga khusus (misal: 5%, 10%, 15%) yang berlaku otomatis saat checkout.
     - Kolom catatan ketentuan harga / MoU (misal: *"Harga Grosir Tier 1 + Garansi Retur Cepat"*).
   - **Hak Akses & Privilege Khusus (Toggleable):**
     - ⚡ **Prioritas Alokasi Stok Gudang:** Pesanan dealer khusus diprioritaskan saat stok rebutan/terbatas.
     - ✨ **Bebas Minimal Order (No MOQ):** Bebas checkout berapapun tanpa batasan minimum kuantitas.
     - 🏷️ **Akses Katalog Distributor:** Akses ke harga dan SKU eksklusif distributor.
     - 🎁 **Prioritas Promo & Hadiah Tambahan.**
   - **Filter & Statistik di Admin Web (`/dealers`):**
     - Filter cepat: `Semua Kemitraan` | `⭐ Dealer Khusus Saja` | `⚪ Dealer Reguler Saja`.
     - Stat Card khusus: **Dealer Khusus (VIP)** yang menghitung jumlah mitra berstatus khusus secara realtime.
     - Badge khusus warna amber `⭐ DEALER KHUSUS (VIP)` dan rincian diskon/ketentuan langsung pada tabel.

2. **Pilihan Termin Kredit (15 Hari & 30 Hari):**
   - **Pengaturan Termin Berdasarkan Dealer:**
     - Admin dapat mengatur durasi jatuh tempo kredit per dealer sesuai profil risiko dan performa pembayaran.
     - **Pilihan Utama 1-Klik:** Pilihan cepat dan tegas untuk **⏱️ 15 Hari** dan **📅 30 Hari** (serta opsi kustom 45 atau 60 hari jika dibutuhkan).
     - Dapat diatur langsung saat pendaftaran dealer baru maupun melalui modal *Kelola Khusus & Kredit*.
   - **Penerapan di Mobile App Dealer (`checkout.tsx`):**
     - Opsi pembayaran Kredit menampilkan durasi termin dealer bersangkutan: misal **Tempo 15 Hari** atau **Tempo 30 Hari**.
     - Penjelasan jatuh tempo: *"Jatuh tempo pelunasan: 15 / 30 hari sejak barang dikirim"*.
     - Modal konfirmasi pesanan menampilkan peringatan jatuh tempo sesuai termin dealer (15 atau 30 hari).

3. **Banner Eksklusif & Diskon Otomatis di Mobile App Dealer (`checkout.tsx`):**
   - **Banner Dealer Khusus:** Dealer dengan status khusus mendapatkan kartu apresiasi emas di bagian atas checkout yang menerangkan status VIP dan hak istimewa yang dimiliki.
   - **Perhitungan Potongan Harga Otomatis:**
     - Subtotal produk dipotong diskon khusus dealer.
     - Baris *"Diskon Khusus (X%)"* ditampilkan transparan pada Rincian Pembayaran dan Modal Konfirmasi.
     - Total tagihan kredit atau transfer disesuaikan setelah diskon, sehingga dealer berbelanja dengan pagu kredit yang lebih hemat.

### J. Pencapaian Sales, Penggajian & Slip Gaji Digital Terintegrasi (Poin 21, 22, 23, 24)
1. **Target & Pencapaian Sales & SPV (`/targets` - Poin 21):**
   - **Target Bulanan Sales:** Setiap sales memiliki target omzet bulanan yang dapat ditentukan oleh Admin atau SPV.
   - **Perbandingan Target vs Realisasi Penjualan:**
     - Menampilkan Target, Realisasi Penjualan Aktual (dari order masuk), Sisa Target, dan % Pencapaian (progress bar interaktif).
     - Filter data fleksibel berdasarkan Bulan & Tahun.
   - **Pencapaian Akumulasi Tim SPV:**
     - Target SPV otomatis mengakumulasikan target seluruh sales di bawah binaannya (`Team Target Amount`).
     - SPV dapat memantau perbandingan target vs realisasi seluruh sales timnya secara bulanan.

2. **Penjualan SPV di Luar Coverage Sales (`/targets?tab=coverage_management` - Poin 23):**
   - **Pemisahan Status Wilayah:** Sistem membedakan wilayah yang sudah memiliki Sales (`COVERED`) dan wilayah bebas (`UNCOVERED`).
   - **Penjualan Langsung SPV:** Penjualan di area `UNCOVERED` dicatat eksklusif sebagai **Penjualan Langsung SPV** (`is_spv_direct_sale = true`) dan TIDAK masuk ke pencapaian sales lain.
   - **Tampilan 3 Metrik Terpisah untuk SPV:**
     1. Akumulasi Target Tim Sales.
     2. Penjualan Langsung SPV (Hak komisi 1%).
     3. Total Akumulasi Pencapaian SPV.

3. **Sistem Check-in & Target Visit Sales (`/targets` & `/payroll` - Poin 24):**
   - **Target Visit Harian & Bulanan:**
     - Target visit harian (default 6 toko/hari) × hari kerja (26 hari) = **156 visit/bulan**.
   - **Perhitungan Gaji Pokok Berdasarkan Visit:**
     - $\text{Nilai per Visit} = \text{Gaji Pokok (Rp 4.500.000)} \div 156 \approx \text{Rp } 28.846/\text{visit}$.
     - Realisasi visit dicatat otomatis dari aktivitas check-in toko (`sales_visits` status `COMPLETED`).
     - Gaji Pokok yang diperoleh = $\text{Realisasi Visit} \times \text{Nilai per Visit}$.
   - **Skema Insentif Berdasarkan Target Omzet Penjualan:**
     - $\ge 90\% \rightarrow 1.00\%$ dari total omzet realisasi.
     - $80\% - 89\% \rightarrow 0.75\%$ dari total omzet realisasi.
     - $70\% - 79\% \rightarrow 0.25\%$ dari total omzet realisasi.
     - $< 70\% \rightarrow 0\%$ (tidak mendapatkan insentif).
   - **Formula Penggajian Keseluruhan:**
     $$\text{Total Gaji Diterima} = \text{Gaji Pokok Visit} + \text{Insentif Omzet} + \text{Bonus/Komisi} - \text{Potongan}$$

4. **Fitur Penggajian Sales & Slip Gaji Digital Resmi (`/payroll` - Poin 22):**
   - **Tabel Riwayat Penggajian:** Menyimpan riwayat payroll per periode bulan & tahun lengkap dengan status (`DRAFT`, `APPROVED`, `PAID`).
   - **Tombol "⚡ Hitung Otomatis (Generate Payroll)":** Menarik otomatis data check-in visit dan omzet aktual, menghitung gaji visit, insentif tier omzet, dan komisi direct sales SPV.
   - **Modal Edit Komponen:** Admin dapat menyesuaikan bonus tambahan (THR, reward) dan potongan (kasbon, keterlambatan) dengan catatan.
   - **Slip Gaji Digital Resmi DAP:**
     - Kop surat resmi PT DISTRIBUSI AKSESORIS PRIMA.
     - Nomor Slip unik: `SLIP/DAP/YYYYMM/XXXX`.
     - Rincian Penerimaan (Gaji Visit, Insentif Omzet, Komisi Direct SPV, Bonus).
     - Rincian Potongan & Total Gaji Bersih (*Take Home Pay*).
     - Kolom Tanda Tangan Karyawan & HRD/Finance.
     - Tombol **Cetak Slip Gaji (Window Print / PDF)** dengan tampilan dokumen profesional.

---

## 3. Skrip Migrasi SQL untuk Supabase
Jalankan file SQL berikut di **Supabase Dashboard > SQL Editor**:
1. `sales_complete_migration.sql` – Seluruh tabel & RLS untuk Sales, Presensi, Visitasi, Cuti, dan Toko Binaan.
2. `add_dealer_programs.sql` – Tabel `dealer_programs`, `dealer_program_participants`, RLS, dan 3 program awal siap pakai.
3. `fix_regions_rls.sql` – **(PENTING)** Membuka izin RLS untuk Master Wilayah (`regions`) dan `promos` agar admin dapat menambah/edit/hapus wilayah tanpa error 403.
4. `update_program_support_catalog.sql` – Kolom `support_items` di `dealer_programs` dan kolom item reward di `dealer_program_participants`.
5. `add_sort_order.sql` – Menambahkan kolom `sort_order` pada tabel `categories` dan `products` untuk mengatur urutan prioritas kategori dan produk.
6. `create_stock_logs.sql` – Membuat tabel `stock_logs` untuk mencatat setiap mutasi, restok, dan pengurangan stok produk secara kronologis per produk.
7. `setup_cod_and_credit_limit.sql` – Menambahkan kolom kredit (`is_credit_eligible`, `credit_term_days`, `credit_status`, `credit_notes`) pada tabel `dealers`, membuat tabel `payment_settings` (kebijakan & termin COD/kredit), dan tabel `credit_limit_logs` (audit trail mutasi limit dealer).
8. `setup_special_dealers.sql` – Menambahkan kolom ketentuan Dealer Khusus (`is_special_dealer`, `special_dealer_tier`, `special_discount_percentage`, `special_pricing_notes`, `special_access_permissions`, `special_dealer_notes`), pengaturan `credit_term_days` (15 hari / 30 hari), dan kolom `discount_amount` pada pesanan.
9. `setup_sales_payroll_and_targets.sql` – **(BARU)** Menambahkan tabel `sales_targets`, `sales_payrolls`, perluasan kolom SPV & coverage wilayah (`is_spv`, `spv_id`, `base_salary`, `daily_visit_target`, `coverage_status`, `is_spv_direct_sale`), serta RLS security policy.

---

## 4. Tautan & Akses Cepat Lokal & Online Tester
- **Portal Online User (Dealer & Sales - Mobile Web):**
  - **URL:** [https://spokesman-ppc-pas-admission.trycloudflare.com](https://spokesman-ppc-pas-admission.trycloudflare.com)
  - *(Dapat dibuka langsung di browser HP/Laptop dengan tombol Quick Login 1-Klik untuk Sales & Dealer).*
- **Portal Online Admin Web:**
  - **URL:** [https://brass-fork-exist-chambers.trycloudflare.com](https://brass-fork-exist-chambers.trycloudflare.com)
  - **Login:** [https://brass-fork-exist-chambers.trycloudflare.com/login](https://brass-fork-exist-chambers.trycloudflare.com/login)
  - **Email:** `ditoapp@atomicmail.io` | **Password:** `admin123`
- **Akses Lokal:**
  - Admin Web: [http://localhost:3000](http://localhost:3000) (LAN: `http://192.168.0.94:3000`)
  - Mobile App: [http://localhost:8081](http://localhost:8081) / Expo Go: `exp://192.168.0.94:8081`

---

## 5. Rencana Lanjutan untuk Sesi Besok
- Menguji integrasi end-to-end setelah menjalankan file SQL `setup_cod_and_credit_limit.sql` di Supabase.
- Memeriksa fitur lanjutan dealer/admin yang ingin ditambahkan berikutnya.


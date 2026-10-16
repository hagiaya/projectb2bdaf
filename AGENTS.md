# Project Guidelines & Rules

## Autonomy & Execution Principle (PENTING)
- **Eksekusi Penuh & Otomatis**: Setiap kali user memberikan perintah/instruksi, AI asisten **wajib langsung mengerjakannya secara tuntas dari hulu ke hilir (end-to-end)**.
- **Pilih Opsi Terbaik**: Pilih pendekatan dan solusi arsitektur/teknis terbaik secara mandiri dan langsung implementasikan.
- **Tanpa Menunggu Konfirmasi/Klik Berulang**: Jangan meminta user mengklik konfirmasi atau tombol approval berulang kali jika arah instruksi sudah jelas; langsung selesaikan kode, uji coba/verifikasi, dan laporkan hasilnya secara rapi.

## Mobile App (Expo)
- **Dilarang keras menjalankan Expo dengan `--web`** (misal: `npx expo start --web` atau `expo start -w`). Mode web sangat berat dan memakan banyak memori/CPU.
- Selalu jalankan Expo menggunakan standar:
  ```bash
  npx expo start
  ```
  atau `npm start` di dalam direktori `mobile-app`.
- Berlaku untuk semua project.

## Deployment & Version Control (PENTING)
- **Jangan Deploy ke OTA & GitHub Otomatis**:
  - **Dilarang keras melakukan publikasi OTA update (EAS Update)** secara otomatis, kecuali jika user secara eksplisit meminta untuk deploy/update OTA.
  - **Dilarang melakukan `git push` ke GitHub** secara otomatis, kecuali jika user secara eksplisit memintanya.
  - Selesaikan seluruh pengerjaan kode, lakukan pengujian/verifikasi lokal (`tsc --noEmit`, build, dsb.), dan laporkan hasilnya secara rapi tanpa melakukan push atau OTA release.
- Jika user secara spesifik meminta deploy OTA, gunakan:
  ```bash
  export $(xargs < .env) && export EAS_SKIP_AUTO_FINGERPRINT=1 && npx --yes eas-cli update --channel production --environment production --message "Deskripsi update" --non-interactive
  ```

## Admin Web
- Jalankan admin web menggunakan:
  ```bash
  npm run dev
  ```
  di dalam direktori `admin-web`.

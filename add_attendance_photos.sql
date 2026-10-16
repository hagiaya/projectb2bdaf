-- Migration: Tambahkan kolom foto selfie check-in dan check-out untuk presensi seluruh karyawan
ALTER TABLE public.sales_attendance
ADD COLUMN IF NOT EXISTS check_in_selfie_url TEXT,
ADD COLUMN IF NOT EXISTS check_out_selfie_url TEXT;

-- Pastikan indeks dan hak akses
GRANT SELECT, INSERT, UPDATE ON public.sales_attendance TO anon, authenticated, service_role;

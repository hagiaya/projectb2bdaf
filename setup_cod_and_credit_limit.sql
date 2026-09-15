-- ====================================================================
-- SQL Migration: Pengaturan Termin COD & Sistem Credit Limit Dealer
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Tambahkan kolom pendukung kredit & termin pada tabel dealers
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS is_credit_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credit_term_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS credit_status VARCHAR(50) DEFAULT 'DISABLED',
ADD COLUMN IF NOT EXISTS credit_notes TEXT;

-- 2. Buat Tabel Pengaturan Kebijakan Pembayaran Perusahaan (Termin COD & Kredit)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    cod_enabled BOOLEAN DEFAULT true,
    cod_term_days INTEGER DEFAULT 0,
    cod_term_label VARCHAR(150) DEFAULT 'Bayar Saat Terima Barang (H+0)',
    cod_max_amount DECIMAL(15, 2) DEFAULT 10000000.00,
    cod_policy_terms TEXT DEFAULT 'Ketentuan Pembayaran COD (Cash on Delivery):
1. Pembayaran wajib diserahkan kepada kurir pengantar saat barang tiba di alamat toko/outlet.
2. Pembayaran dapat berupa uang tunai pas atau konfirmasi transfer langsung ke rekening resmi kurir/perusahaan.
3. Maksimal nilai transaksi per pesanan COD disesuaikan dengan limit kebijakan perusahaan.
4. Jika pembayaran belum siap saat kurir tiba, pihak DAP berhak menunda serah terima barang atau menjadwalkan pengantaran ulang sesuai kesepakatan.',
    credit_enabled BOOLEAN DEFAULT true,
    credit_default_term_days INTEGER DEFAULT 30,
    credit_policy_terms TEXT DEFAULT 'Ketentuan Fasilitas Kredit & Tempo (TOP):
1. Fasilitas kredit hanya diberikan kepada dealer mitra terpilih yang telah disetujui Admin.
2. Dealer wajib melunasi tagihan sebelum tanggal jatuh tempo tenor (TOP) berakhir.
3. Pemesanan baru akan ditangguhkan jika total tagihan melebihi plafon credit limit yang ditentukan.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Masukkan data default pengaturan jika belum ada
INSERT INTO public.payment_settings (id, cod_enabled, cod_term_days, cod_term_label, cod_max_amount, cod_policy_terms)
VALUES (
    'default', 
    true, 
    0, 
    'Bayar Saat Terima Barang (H+0)', 
    10000000.00, 
    'Ketentuan Pembayaran COD (Cash on Delivery):
1. Pembayaran wajib diserahkan kepada kurir pengantar saat barang tiba di alamat toko/outlet.
2. Pembayaran dapat berupa uang tunai pas atau konfirmasi transfer langsung ke rekening resmi kurir/perusahaan.
3. Maksimal nilai transaksi per pesanan COD disesuaikan dengan limit kebijakan perusahaan.
4. Jika pembayaran belum siap saat kurir tiba, pihak DAP berhak menunda serah terima barang atau menjadwalkan pengantaran ulang sesuai kesepakatan.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Buat Tabel Log Mutasi Credit Limit Dealer
CREATE TABLE IF NOT EXISTS public.credit_limit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INCREASE', 'DECREASE', 'SET', 'ENABLE', 'DISABLE')),
    amount_changed DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    previous_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    current_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    notes TEXT,
    changed_by VARCHAR(255) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index untuk efisiensi
CREATE INDEX IF NOT EXISTS idx_credit_limit_logs_dealer_id ON public.credit_limit_logs(dealer_id);
CREATE INDEX IF NOT EXISTS idx_credit_limit_logs_created_at ON public.credit_limit_logs(created_at DESC);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_limit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all to read payment_settings" ON public.payment_settings;
CREATE POLICY "Allow all to read payment_settings"
ON public.payment_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to update payment_settings" ON public.payment_settings;
CREATE POLICY "Allow admin to update payment_settings"
ON public.payment_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all to read credit_limit_logs" ON public.credit_limit_logs;
CREATE POLICY "Allow all to read credit_limit_logs"
ON public.credit_limit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all to insert credit_limit_logs" ON public.credit_limit_logs;
CREATE POLICY "Allow all to insert credit_limit_logs"
ON public.credit_limit_logs FOR ALL USING (true) WITH CHECK (true);

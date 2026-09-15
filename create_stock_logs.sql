-- =========================================================
-- SQL Migration: Tabel Riwayat Perubahan Stok (Stock Logs)
-- Jalankan skrip ini di Supabase SQL Editor
-- =========================================================

-- 1. Buat Tabel stock_logs
CREATE TABLE IF NOT EXISTS public.stock_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('RESTOCK', 'REDUCTION', 'ADJUSTMENT', 'SALE', 'RETURN')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    notes TEXT,
    created_by VARCHAR(255) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buat Index untuk Performa Query
CREATE INDEX IF NOT EXISTS idx_stock_logs_product_id ON public.stock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON public.stock_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_logs_type ON public.stock_logs(type);

-- 3. Aktifkan Row Level Security (RLS) & Berikan Akses Penuh ke Admin
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to stock_logs" ON public.stock_logs;
CREATE POLICY "Allow all access to stock_logs"
ON public.stock_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Notifikasi status
COMMENT ON TABLE public.stock_logs IS 'Mencatat setiap mutasi, penambahan restok, dan pengurangan stok produk secara kronologis';

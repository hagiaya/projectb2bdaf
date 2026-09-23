-- ==============================================================================
-- MIGRATION: HARGA PROMO PER PRODUK
-- Tambahkan kolom promo_price ke tabel products
-- Jalankan di Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Tambah kolom promo_price dan promo_label ke tabel products
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS promo_price DECIMAL(15, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_label VARCHAR(100) DEFAULT NULL;

-- 2. Aktifkan realtime untuk tabel products
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 3. Pastikan RLS policy untuk products mengizinkan baca publik
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
CREATE POLICY "Allow public read products"
ON public.products FOR SELECT
USING (true);

-- Selesai! Sekarang setiap produk bisa memiliki harga promo terpisah.

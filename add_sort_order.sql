-- =========================================================================
-- MIGRATION: Menambahkan Kolom sort_order untuk Urutan Kategori & Produk
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- =========================================================================

-- 1. Tambahkan kolom sort_order ke tabel categories (jika belum ada)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Tambahkan kolom sort_order ke tabel products (jika belum ada)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Beri nomor urut awal (1, 2, 3...) pada kategori yang masih 0 / NULL berdasarkan abjad
WITH ranked_categories AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) AS rn
    FROM public.categories
)
UPDATE public.categories c
SET sort_order = rc.rn
FROM ranked_categories rc
WHERE c.id = rc.id AND (c.sort_order IS NULL OR c.sort_order = 0);

-- 4. Beri nomor urut awal (1, 2, 3...) pada produk yang masih 0 / NULL berdasarkan tanggal dibuat / nama
WITH ranked_products AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC, name ASC) AS rn
    FROM public.products
)
UPDATE public.products p
SET sort_order = rp.rn
FROM ranked_products rp
WHERE p.id = rp.id AND (p.sort_order IS NULL OR p.sort_order = 0);

-- 5. Buat index untuk mempercepat query pengurutan
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order ASC);

-- 6. Reload Schema Cache PostgREST Supabase agar API langsung mengenali kolom baru
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- MIGRATION: FLASH SALE & KREDIT TEMPO (TOP)
-- Jalankan file ini di Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Tambah kolom payment_due_date pada tabel orders
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP WITH TIME ZONE;

-- 2. Tambah kolom is_flash_sale dan flash_sale_price pada tabel products
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_sale_price DECIMAL(15, 2);

-- 3. Update Policy RLS jika diperlukan (Admin dapat update products, sudah ada biasanya)

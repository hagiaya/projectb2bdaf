-- ==============================================================================
-- MIGRATION: Tambah kolom pcs_per_box dan unit_name pada tabel products
-- Jalankan file ini di Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS pcs_per_box INTEGER;

ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50) DEFAULT 'Box';

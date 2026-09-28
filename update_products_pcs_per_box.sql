-- ==============================================================================
-- MIGRATION: Tambah kolom pcs_per_box pada tabel products
-- Jalankan file ini di Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS pcs_per_box INTEGER;

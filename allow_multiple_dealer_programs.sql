-- ==============================================================================
-- MIGRATION: DUKUNGAN MULTI-PROGRAM & MULTI-ITEM BARANG SUPPORT
-- Menghapus batasan 1 program per dealer agar dealer dapat mengikuti
-- lebih dari 1 program / item barang support secara bersamaan dengan progres terpisah.
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Hapus constraint UNIQUE (program_id, dealer_id) jika ada pada tabel dealer_program_participants
ALTER TABLE IF EXISTS public.dealer_program_participants 
DROP CONSTRAINT IF EXISTS dealer_program_participants_program_id_dealer_id_key;

-- 2. Pastikan seluruh kolom pendukung detail item support dan dokumentasi tersedia
ALTER TABLE IF EXISTS public.dealer_program_participants
ADD COLUMN IF NOT EXISTS selected_item_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS selected_item_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS selected_item_qty INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS custom_target_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS photo_before_url TEXT,
ADD COLUMN IF NOT EXISTS photo_after_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_receipt_no TEXT,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP WITH TIME ZONE;

-- 3. Reload cache schema PostgREST Supabase
NOTIFY pgrst, 'reload schema';

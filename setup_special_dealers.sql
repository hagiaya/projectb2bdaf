-- ====================================================================
-- SQL Migration: Fitur Dealer Khusus & Pengaturan Termin Kredit
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Tambahkan kolom status Dealer Khusus, Harga Khusus, Termin Kredit, dan Akses Tertentu
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS is_special_dealer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS special_dealer_tier VARCHAR(50) DEFAULT 'REGULAR',
ADD COLUMN IF NOT EXISTS special_discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS special_pricing_notes TEXT,
ADD COLUMN IF NOT EXISTS special_access_permissions JSONB DEFAULT '{"priority_stock": true, "waive_min_order": true, "exclusive_catalog": false, "vip_support": true}'::jsonb,
ADD COLUMN IF NOT EXISTS special_dealer_notes TEXT,
ADD COLUMN IF NOT EXISTS credit_term_days INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS is_credit_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credit_status VARCHAR(50) DEFAULT 'DISABLED',
ADD COLUMN IF NOT EXISTS credit_notes TEXT;

-- 2. Buat Index untuk mempercepat query Dealer Khusus
CREATE INDEX IF NOT EXISTS idx_dealers_is_special_dealer ON public.dealers(is_special_dealer);
CREATE INDEX IF NOT EXISTS idx_dealers_credit_term_days ON public.dealers(credit_term_days);

-- 3. Update orders table to ensure discount_amount column exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0.00;

-- 4. Komentar dokumentasi
COMMENT ON COLUMN public.dealers.is_special_dealer IS 'Menandakan apakah toko merupakan Dealer Khusus dengan privilege ekstra';
COMMENT ON COLUMN public.dealers.special_dealer_tier IS 'Tingkatan Dealer Khusus: REGULAR, VIP, PRIORITY, DISTRIBUTOR';
COMMENT ON COLUMN public.dealers.special_discount_percentage IS 'Persentase diskon harga khusus untuk dealer ini (%)';
COMMENT ON COLUMN public.dealers.special_pricing_notes IS 'Catatan kebijakan harga khusus dealer';
COMMENT ON COLUMN public.dealers.credit_term_days IS 'Termin kredit jatuh tempo per dealer: 15 hari, 30 hari, dll';
COMMENT ON COLUMN public.dealers.special_access_permissions IS 'Izin akses khusus: prioritas stok, bebas min order, akses eksklusif, vip support';

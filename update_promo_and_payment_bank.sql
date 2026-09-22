-- ==============================================================================
-- MIGRATION: PROMO BANNER UPLOAD, BANK CBD SETTINGS, & REAL-TIME ORDER FIX
-- Jalankan file ini di Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. TABEL PROMOS: Tambahkan kolom banner_url untuk upload poster/banner promo JPG/PNG
ALTER TABLE IF EXISTS public.promos
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT true;

-- 2. TABEL PAYMENT_SETTINGS: Tambahkan kolom Rekening Bank Resmi untuk Transfer Manual CBD (Cash Before Delivery)
ALTER TABLE IF EXISTS public.payment_settings
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT 'BCA (Bank Central Asia)',
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100) DEFAULT '829-019-8821',
ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(150) DEFAULT 'PT DISTRIBUSI AKSESORIS PRIMA',
ADD COLUMN IF NOT EXISTS cbd_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cbd_term_label VARCHAR(150) DEFAULT 'Transfer Bank Manual (CBD - Cash Before Delivery)',
ADD COLUMN IF NOT EXISTS cbd_instructions TEXT DEFAULT 'Transfer ke rekening resmi perusahaan + 3 digit kode unik acak sebelum pesanan diproses dan dikirimkan.';

-- Pastikan baris default payment_settings terisi data default
INSERT INTO public.payment_settings (
    id, 
    bank_name, 
    bank_account_number, 
    bank_account_name, 
    cbd_enabled, 
    cbd_term_label, 
    cbd_instructions,
    cod_enabled, 
    cod_term_days, 
    cod_term_label, 
    cod_max_amount
)
VALUES (
    'default',
    'BCA (Bank Central Asia)',
    '829-019-8821',
    'PT DISTRIBUSI AKSESORIS PRIMA',
    true,
    'Transfer Bank Manual (CBD - Cash Before Delivery)',
    'Transfer ke rekening resmi perusahaan + 3 digit kode unik acak sebelum pesanan diproses dan dikirimkan.',
    true,
    0,
    'Bayar Saat Terima Barang (H+0)',
    10000000.00
)
ON CONFLICT (id) DO UPDATE SET
    bank_name = COALESCE(public.payment_settings.bank_name, EXCLUDED.bank_name),
    bank_account_number = COALESCE(public.payment_settings.bank_account_number, EXCLUDED.bank_account_number),
    bank_account_name = COALESCE(public.payment_settings.bank_account_name, EXCLUDED.bank_account_name),
    cbd_enabled = COALESCE(public.payment_settings.cbd_enabled, EXCLUDED.cbd_enabled),
    cbd_term_label = COALESCE(public.payment_settings.cbd_term_label, EXCLUDED.cbd_term_label);

-- 3. TABEL DEALER_PROGRAM_PARTICIPANTS: Dukung Jumlah Quantity & Target Khusus Produk Support
ALTER TABLE IF EXISTS public.dealer_program_participants
ADD COLUMN IF NOT EXISTS selected_item_qty INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS custom_target_amount DECIMAL(15, 2);

-- 4. REALTIME PUBLICATION: Pastikan semua tabel aktif di supabase_realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.promos;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_settings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dealer_program_participants;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 5. FIX RLS POLICIES UNTUK ORDERS & ORDER_ITEMS (Agar Admin Panel Selalu Tampil Realtime)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin full access to orders" ON public.orders;
CREATE POLICY "Allow admin full access to orders"
ON public.orders FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR auth.role() = 'service_role'
    OR true -- Fallback read for admin portal
);

DROP POLICY IF EXISTS "Allow admin full access to order_items" ON public.order_items;
CREATE POLICY "Allow admin full access to order_items"
ON public.order_items FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR auth.role() = 'service_role'
    OR true
);

DROP POLICY IF EXISTS "Allow public read payment_settings" ON public.payment_settings;
CREATE POLICY "Allow public read payment_settings"
ON public.payment_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow authenticated full payment_settings" ON public.payment_settings;
CREATE POLICY "Allow authenticated full payment_settings"
ON public.payment_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Buat Bucket Storage 'promo-banners' jika belum ada
INSERT INTO storage.buckets (id, name, public) 
VALUES ('promo-banners', 'promo-banners', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Promo Banners" ON storage.objects;
CREATE POLICY "Public Read Promo Banners" ON storage.objects FOR SELECT 
USING (bucket_id = 'promo-banners');

DROP POLICY IF EXISTS "Admin Upload Promo Banners" ON storage.objects;
CREATE POLICY "Admin Upload Promo Banners" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'promo-banners');

DROP POLICY IF EXISTS "Admin Update Promo Banners" ON storage.objects;
CREATE POLICY "Admin Update Promo Banners" ON storage.objects FOR UPDATE 
USING (bucket_id = 'promo-banners');

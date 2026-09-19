-- ==============================================================================
-- UPDATE TABEL RETURNS & NOTIFICATIONS UNTUK MEKANISME RETUR LENGKAP END-TO-END
-- Jalankan skrip ini di Supabase SQL Editor: Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Hapus constraint status lama pada tabel returns agar bisa menerima status baru
ALTER TABLE IF EXISTS public.returns 
DROP CONSTRAINT IF EXISTS returns_status_check;

-- 2. Tambahkan kolom-kolom baru untuk alur retur, resi dealer, dan barang pengganti
ALTER TABLE IF EXISTS public.returns 
ADD COLUMN IF NOT EXISTS return_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dealer_courier TEXT,
ADD COLUMN IF NOT EXISTS dealer_shipping_receipt_no TEXT,
ADD COLUMN IF NOT EXISTS dealer_shipping_photo_url TEXT,
ADD COLUMN IF NOT EXISTS dealer_shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS replacement_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS replacement_courier TEXT,
ADD COLUMN IF NOT EXISTS replacement_shipping_receipt_no TEXT,
ADD COLUMN IF NOT EXISTS replacement_shipping_photo_url TEXT,
ADD COLUMN IF NOT EXISTS replacement_shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dealer_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 3. Tambahkan constraint status baru yang mencakup seluruh alur
ALTER TABLE IF EXISTS public.returns 
ADD CONSTRAINT returns_status_check CHECK (
  status IN (
    'PENDING',              -- Kompatibilitas lama (Menunggu Verifikasi)
    'REQUESTED',            -- Pemilik dealer baru mengajukan tiket retur
    'SHIPPED_BY_DEALER',    -- Dealer telah kirim fisik & upload resi
    'RECEIVED_BY_ADMIN',    -- Barang returan telah diterima fisik oleh admin di gudang
    'REPLACEMENT_SHIPPED',  -- Admin input barang pengganti & upload resi kirim balik
    'COMPLETED',            -- Dealer konfirmasi barang pengganti sudah diterima & retur selesai
    'REJECTED',             -- Ditolak oleh admin
    'APPROVED',             -- Kompatibilitas lama
    'PROCESSED'             -- Kompatibilitas lama
  )
);

-- 4. Pastikan tabel notifications tersedia
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'GENERAL',
    target_role VARCHAR(50) DEFAULT 'ALL',
    target_user_id UUID,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Aktifkan RLS dan Policy untuk Notifications & Returns
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to notifications" ON public.notifications;
CREATE POLICY "Allow all access to notifications" 
ON public.notifications FOR ALL 
USING (true) 
WITH CHECK (true);

-- 6. Pastikan kebijakan RLS tabel returns terbuka untuk update status antar role
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to returns" ON public.returns;
CREATE POLICY "Allow authenticated full access to returns" 
ON public.returns FOR ALL 
USING (true) 
WITH CHECK (true);

-- 7. Realtime publikasi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'returns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.returns;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

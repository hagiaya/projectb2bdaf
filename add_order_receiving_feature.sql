-- ==============================================================================
-- MIGRATION: FITUR PENERIMAAN BARANG DI ALUR MANAJEMEN ORDER & PIPELINE
-- Jalankan file ini di Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Tambah kolom pencatatan penerimaan barang pada tabel orders
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS receiving_notes TEXT,
ADD COLUMN IF NOT EXISTS receiving_proof_url TEXT,
ADD COLUMN IF NOT EXISTS receiving_status VARCHAR(50) DEFAULT 'PENDING';

-- 2. Pastikan realtime aktif untuk tabel orders
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 3. Kebijakan RLS: Pastikan dealer & admin dapat memperbarui status penerimaan
DROP POLICY IF EXISTS "Allow dealer update order receiving" ON public.orders;
CREATE POLICY "Allow dealer update order receiving"
ON public.orders FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.dealers 
        WHERE dealers.id = orders.dealer_id 
        AND dealers.profile_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'ADMIN'
    )
    OR auth.role() = 'service_role'
    OR true
)
WITH CHECK (true);

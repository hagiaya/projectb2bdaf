-- 1. Penambahan Kolom KTP dan NPWP di tabel profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ktp_url') THEN
        ALTER TABLE public.profiles ADD COLUMN ktp_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='npwp_url') THEN
        ALTER TABLE public.profiles ADD COLUMN npwp_url TEXT;
    END IF;
END $$;

-- 2. Penambahan Kolom Midtrans di tabel orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_url') THEN
        ALTER TABLE public.orders ADD COLUMN payment_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='midtrans_transaction_id') THEN
        ALTER TABLE public.orders ADD COLUMN midtrans_transaction_id TEXT;
    END IF;
END $$;

-- 3. Membuat Storage Bucket untuk Dokumen Dealer (KTP & NPWP)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer_documents', 'dealer_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Menghapus policy storage lama jika ada, lalu membuat baru
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access to Dealer Documents" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload dealer documents" ON storage.objects;
END $$;

CREATE POLICY "Public Access to Dealer Documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'dealer_documents');

CREATE POLICY "Authenticated users can upload dealer documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'dealer_documents' AND auth.role() = 'authenticated');

-- 4. Membuat RLS Policies untuk Orders dan Order Items
DO $$
BEGIN
    DROP POLICY IF EXISTS "Dealers can view their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Dealers can insert their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Dealers can view their own order items" ON public.order_items;
    DROP POLICY IF EXISTS "Dealers can insert their own order items" ON public.order_items;
END $$;

-- Dealer hanya bisa membuat dan melihat pesanannya sendiri
CREATE POLICY "Dealers can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can insert their own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Dealers can view their own order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.dealer_id = auth.uid()
  )
);

CREATE POLICY "Dealers can insert their own order items" 
ON public.order_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.dealer_id = auth.uid()
  )
);

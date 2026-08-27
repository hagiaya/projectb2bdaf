-- 1. Penambahan Kolom KTP dan NPWP di tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN ktp_url TEXT,
ADD COLUMN npwp_url TEXT;

-- 2. Penambahan Kolom Midtrans di tabel orders
ALTER TABLE public.orders 
ADD COLUMN payment_url TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN midtrans_transaction_id TEXT;

-- 3. Membuat Storage Bucket untuk Dokumen Dealer (KTP & NPWP)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer_documents', 'dealer_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Membuat RLS Policies untuk Bucket dealer_documents
CREATE POLICY "Public Access to Dealer Documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'dealer_documents');

CREATE POLICY "Authenticated users can upload dealer documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'dealer_documents' AND auth.role() = 'authenticated');

-- 4. Membuat RLS Policies untuk Orders dan Order Items
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

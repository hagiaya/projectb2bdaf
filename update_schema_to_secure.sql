-- 1. Tambahkan kolom image_urls jika belum ada
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- 2. Hapus policy lama yang tidak aman (jika ada)
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.products;
DROP POLICY IF EXISTS "Enable update for everyone" ON public.products;
DROP POLICY IF EXISTS "Enable delete for everyone" ON public.products;
DROP POLICY IF EXISTS "Enable all for categories" ON public.categories;

-- 3. Buat policy baru yang AMAN (Hanya ADMIN yang bisa mengubah)
CREATE POLICY "Admin full access to products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin full access to categories" ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

-- 4. Buat Storage Bucket untuk foto (jika belum ada)
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- 5. Hapus policy lama di storage (jika ada)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

-- 6. Buat policy storage yang AMAN
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin Insert Access" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin Update Access" ON storage.objects FOR UPDATE USING (
    bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin Delete Access" ON storage.objects FOR DELETE USING (
    bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

-- 7. Muat ulang cache skema API Supabase
NOTIFY pgrst, 'reload schema';

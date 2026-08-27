-- 1. Tambahkan kolom image_url ke tabel categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Buat bucket baru untuk category-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy untuk admin bisa upload
CREATE POLICY "Admin can upload category images" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'category-images' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);

-- Policy untuk admin bisa edit/hapus gambar
CREATE POLICY "Admin can update category images" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'category-images' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);

CREATE POLICY "Admin can delete category images" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'category-images' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);

-- Policy untuk semua orang bisa melihat gambar
CREATE POLICY "Public can view category images" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'category-images'
);

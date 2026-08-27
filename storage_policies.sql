-- Create policies for dealer_documents bucket
BEGIN;

-- Izinkan siapa saja membaca (karena ini public read kalau dibutuhkan)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'dealer_documents' );

-- Izinkan user terautentikasi untuk mengunggah dokumen mereka sendiri
DROP POLICY IF EXISTS "Auth Uploads" ON storage.objects;
CREATE POLICY "Auth Uploads" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK ( bucket_id = 'dealer_documents' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Izinkan user memperbarui dokumen mereka sendiri
DROP POLICY IF EXISTS "Auth Updates" ON storage.objects;
CREATE POLICY "Auth Updates" 
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'dealer_documents' AND (storage.foldername(name))[1] = auth.uid()::text );

COMMIT;

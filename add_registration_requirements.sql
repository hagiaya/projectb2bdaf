-- 1. Tambah kolom KTP dan NPWP di tabel dealers
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS ktp_url TEXT,
ADD COLUMN IF NOT EXISTS npwp_url TEXT;

-- 2. Buat bucket baru untuk menyimpan dokumen pendaftaran dealer
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer-docs', 'dealer-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy untuk mengizinkan siapapun (publik/anon) untuk mengupload dokumen ke bucket ini
-- (Karena saat registrasi, user belum login)
CREATE POLICY "Public can upload dealer docs" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'dealer-docs'
);

-- Policy untuk mengizinkan publik (termasuk admin) untuk membaca dokumen
CREATE POLICY "Public can view dealer docs" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'dealer-docs'
);

-- 4. Buat Trigger Auth untuk otomatis membuat Profile dan Dealer saat user Mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert ke tabel profiles
  INSERT INTO public.profiles (id, role, full_name, phone_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'DEALER'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number'
  );

  -- Jika role-nya DEALER, insert juga ke tabel dealers
  IF new.raw_user_meta_data->>'role' = 'DEALER' THEN
    INSERT INTO public.dealers (
        profile_id, 
        store_name, 
        address, 
        latitude, 
        longitude, 
        status, 
        ktp_url, 
        npwp_url
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'store_name',
      new.raw_user_meta_data->>'address',
      -- Konversi text lat lng ke numeric, set null jika kosong
      NULLIF(new.raw_user_meta_data->>'lat', '')::numeric,
      NULLIF(new.raw_user_meta_data->>'lng', '')::numeric,
      'PENDING',
      new.raw_user_meta_data->>'ktp_url',
      new.raw_user_meta_data->>'npwp_url'
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger lama jika ada, lalu buat yang baru
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

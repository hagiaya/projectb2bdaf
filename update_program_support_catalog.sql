-- ==============================================================================
-- MIGRATION: KATALOG PROGRAM SUPPORT & DOKUMENTASI BEFORE & AFTER
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Tambahkan kolom support_items ke tabel dealer_programs
ALTER TABLE public.dealer_programs 
ADD COLUMN IF NOT EXISTS support_items JSONB DEFAULT '[]'::jsonb;

-- 2. Tambahkan kolom pilihan item reward support & dokumentasi foto ke dealer_program_participants
ALTER TABLE public.dealer_program_participants 
ADD COLUMN IF NOT EXISTS selected_item_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS selected_item_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS selected_item_details JSONB,
ADD COLUMN IF NOT EXISTS custom_target_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS photo_before_url TEXT,
ADD COLUMN IF NOT EXISTS photo_after_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_receipt_no TEXT,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS applicant_name TEXT,
ADD COLUMN IF NOT EXISTS applicant_store_name TEXT,
ADD COLUMN IF NOT EXISTS applicant_location TEXT,
ADD COLUMN IF NOT EXISTS applicant_phone TEXT;

-- 3. Storage bucket dealer_documents public read & upload policy
INSERT INTO storage.buckets (id, name, public)
VALUES ('dealer_documents', 'dealer_documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy upload storage
CREATE POLICY "Public Upload to dealer_documents"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'dealer_documents');

CREATE POLICY "Public Read from dealer_documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dealer_documents');

-- 4. Update data Program Support (BARANG_SUPPORT) dengan 10 Katalog Resmi DAP DAY DAY UP
UPDATE public.dealer_programs
SET 
  title = 'Katalog Program Support DAP (Etalase & Display Toko)',
  description = 'Program bantuan fasilitas display dan etalase toko resmi DAP DAY DAY UP! Dealer dapat memilih sendiri produk etalase atau display support yang diinginkan sesuai target minimal pembelian belanja akumulasi Anda.',
  reward_description = 'Pilihan 10 Item Support Toko DAP (Etalase Showcase 25 Jt, Rak Jumbo 8 Jt, Running Text LED 6 Jt, Kursi Plastik 500 Rb, dll)',
  banner_url = '/katalog-program-support.png',
  target_amount = 500000.00,
  support_items = '[
    {
      "id": "dlp13",
      "code": "DLP13",
      "name": "KURSI PLASTIK DAP",
      "min_purchase": 500000,
      "dimensions": "Standar Kursi Plastik Toko",
      "category": "Fasilitas Toko",
      "description": "Kursi plastik hijau branding DAP resmi untuk kenyamanan ruang tunggu pelanggan toko Anda."
    },
    {
      "id": "dlp16",
      "code": "DLP16",
      "name": "RAK MINI (Smart Accessories Center)",
      "min_purchase": 2500000,
      "dimensions": "Display Meja Kasir Akrilik",
      "category": "Display Meja",
      "description": "Rak display meja akrilik hijau DAP untuk gantungan aksesoris kabel, charger, dan earphone di depan kasir."
    },
    {
      "id": "logo-gantung",
      "code": "LOGO GANTUNG",
      "name": "LOGO GANTUNG DAP",
      "min_purchase": 3500000,
      "dimensions": "120cm x 30.5cm",
      "category": "Signage Plafon",
      "description": "Signage gantung akrilik resmi DAP Accessories berlampu untuk digantung di langit-langit toko."
    },
    {
      "id": "dlp30",
      "code": "DLP30",
      "name": "RAK PUTAR",
      "min_purchase": 4500000,
      "dimensions": "Rak Putar Multi-Sisi Portable",
      "category": "Display Lantai",
      "description": "Rak display putar modern untuk gantungan produk handsfree, case, dan tempered glass dengan rotasi 360 derajat."
    },
    {
      "id": "dlp09",
      "code": "DLP09",
      "name": "RAK DINDING",
      "min_purchase": 5000000,
      "dimensions": "Tinggi 100cm x Lebar 100cm",
      "category": "Display Dinding",
      "description": "Panel besi ram hitam kokoh dengan header hijau DAP untuk menempel rapi di dinding toko."
    },
    {
      "id": "dlp01",
      "code": "DLP01",
      "name": "RAK BESAR",
      "min_purchase": 6000000,
      "dimensions": "Tinggi 220cm x Lebar 100cm",
      "category": "Display Lantai",
      "description": "Rak display floorstanding 220cm dengan ram besi gantung, papan ambalan bawah, dan header DAP."
    },
    {
      "id": "dlp14",
      "code": "DLP14",
      "name": "RUNNING TEXT (NOW OPEN DAP LED)",
      "min_purchase": 6000000,
      "dimensions": "130cm x 20cm",
      "category": "Signage Digital",
      "description": "Layar display running text digital LED merah terang 130cm x 20cm bertuliskan NOW OPEN & DAP DAY DAY UP."
    },
    {
      "id": "dlp17",
      "code": "DLP17",
      "name": "RAK JUMBO",
      "min_purchase": 8000000,
      "dimensions": "Tinggi 240cm x Lebar 100cm",
      "category": "Display Lantai",
      "description": "Rak display jumbo tertinggi 240cm dengan kapasitas display aksesoris terlengkap dan ambalan display produk."
    },
    {
      "id": "dlp18",
      "code": "DLP18",
      "name": "RAK TENGAH",
      "min_purchase": 10000000,
      "dimensions": "1280mm x 900mm x 750mm",
      "category": "Display Island",
      "description": "Gondola display island tingkat 5 mewah untuk diletakkan di tengah toko dengan branding DAP."
    },
    {
      "id": "etalase-showcase",
      "code": "ETALASE SHOWCASE",
      "name": "ETALASE SHOWCASE DAP",
      "min_purchase": 25000000,
      "dimensions": "110cm x 120cm x 50cm",
      "category": "Etalase Showcase",
      "description": "Etalase kaca display showcase mewah resmi DAP berlogo akrilik hijau dengan lampu LED display dan kunci pengaman."
    }
  ]'::jsonb
WHERE program_type = 'BARANG_SUPPORT';

-- 5. Reload cache schema PostgREST Supabase
NOTIFY pgrst, 'reload schema';

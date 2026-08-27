-- Jalankan script ini di SQL Editor pada Supabase Dashboard Anda
-- Ini akan menambahkan kolom image_urls untuk menampung banyak foto produk
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Wajib dijalankan agar API Supabase (PostgREST) mengenali kolom baru tanpa error
NOTIFY pgrst, 'reload schema';

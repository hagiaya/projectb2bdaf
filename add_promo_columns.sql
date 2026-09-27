-- Tambahkan kolom promo_price dan promo_label jika belum ada
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promo_price numeric,
ADD COLUMN IF NOT EXISTS promo_label text;

-- (Opsional) Refresh schema cache agar Supabase API mengenali kolom baru
NOTIFY pgrst, 'reload schema';

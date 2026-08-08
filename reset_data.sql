-- Reset Data Script
-- Peringatan: Script ini akan MENGHAPUS SEMUA DATA produk, kategori, region, dealer, dan order!
-- Data user/profil tetap dipertahankan.

TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.regions CASCADE;
TRUNCATE TABLE public.dealers CASCADE;

-- Catatan: CASCADE digunakan agar jika ada data yang saling terhubung, semuanya akan ikut terhapus otomatis.

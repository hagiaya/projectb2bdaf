-- 1. Kosongkan kembali kategori untuk produk yang terlanjur masuk ke 'AKSESORIS LAINNYA'
UPDATE products 
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%AKSESORIS LAINNYA%'
);

-- 2. Hapus kategori 'AKSESORIS LAINNYA' agar tidak muncul lagi
DELETE FROM categories 
WHERE name ILIKE '%AKSESORIS LAINNYA%';

-- 3. Coba masukkan produk bernama 'WIRED' ke kategori 'Headset' (karena biasanya wired earphone/headset)
-- (Jika Anda ingin biarkan kosong, Anda bisa menghapus bagian ini sebelum dijalankan)
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Headset' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%WIRED%';

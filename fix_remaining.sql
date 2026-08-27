-- 1. Kabel HDMI, VGA, Power PC -> Masukkan ke Aksesoris Komputer
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%HDMI%' OR 
  name ILIKE '%VGA%' OR 
  name ILIKE '%POWER PC%' OR
  sku ILIKE 'DH%'
);

-- 2. Produk yang bernama 'nan' kemungkinan adalah kabel (berdasarkan SKU DH12 NEW atau DGM01)
-- Karena tidak ada namanya, kita set nama sementaranya menjadi SKU-nya agar tidak membingungkan, 
-- dan kita masukkan ke Aksesoris Komputer (atau biarkan Anda ubah manual nanti)
UPDATE products 
SET name = 'Produk ' || sku,
    category_id = (SELECT id FROM categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
WHERE name = 'nan';

-- 3. Untuk produk 'WIRED' yang sebelumnya, mari kita masukkan ke Headset
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Headset' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%WIRED%';

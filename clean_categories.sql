-- 1. Standarisasi nama (kapitalisasi awal kata, bukan semuanya huruf besar)
UPDATE categories SET name = 'Kabel Data' WHERE name = 'KABEL DATA';
UPDATE categories SET name = 'Adaptor Charger' WHERE name = 'ADAPTOR CHARGER';
UPDATE categories SET name = 'Charger Set' WHERE name = 'CHARGER SET';
UPDATE categories SET name = 'Mouse Pad' WHERE name = 'MOUSE PAD';

-- 2. Gabungkan kategori yang memiliki nama ganda (duplicates)
-- Pindahkan produk dari kategori duplikat ke kategori utama (kita ambil 1 ID per nama)
UPDATE products 
SET category_id = (
  SELECT c2.id FROM categories c2 
  WHERE c2.name = (SELECT c3.name FROM categories c3 WHERE c3.id = products.category_id) 
  ORDER BY c2.id ASC LIMIT 1
)
WHERE category_id IS NOT NULL;

-- 3. Hapus kategori yang sudah kosong (karena duplikat dan produknya sudah dipindah)
DELETE FROM categories c1
WHERE c1.id NOT IN (
  SELECT (
    SELECT c2.id FROM categories c2 
    WHERE c2.name = c_group.name 
    ORDER BY c2.id ASC LIMIT 1
  ) 
  FROM categories c_group 
  GROUP BY c_group.name
);

-- 4. Setel ulang gambar untuk kategori (ambil dari produk)
UPDATE categories
SET image_url = subquery.image_url
FROM (
  SELECT category_id, MIN(image_url) as image_url
  FROM products
  WHERE image_url IS NOT NULL
  GROUP BY category_id
) AS subquery
WHERE categories.id = subquery.category_id;

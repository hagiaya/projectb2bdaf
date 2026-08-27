-- Update gambar kategori secara otomatis menggunakan gambar dari salah satu produk di dalamnya
UPDATE categories
SET image_url = subquery.image_url
FROM (
  SELECT category_id, MIN(image_url) as image_url
  FROM products
  WHERE image_url IS NOT NULL
  GROUP BY category_id
) AS subquery
WHERE categories.id = subquery.category_id;

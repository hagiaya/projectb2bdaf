-- Power bank
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Power Bank' LIMIT 1) WHERE name ILIKE '%mAh%';

-- Headset Bluetooth / TWS
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Headset Bluetooth' LIMIT 1) WHERE name ILIKE '%TWS%' OR name ILIKE '%SPORT%';

-- Antigores & Back Stiker
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Antigores & Back Stiker' LIMIT 1) WHERE name ILIKE '%ANTIGORES%' OR name ILIKE '%MESIN PEMOTONG%' OR name ILIKE '%BACK STICKER%';

-- Kabel Data
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Kabel Data' LIMIT 1) WHERE name ILIKE '%CTL%';

-- CCTV Kamera
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'CCTV Kamera' LIMIT 1) WHERE name ILIKE '%CCTV%';

-- Micro SD
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Micro SD' LIMIT 1) WHERE name ILIKE '%SD CARD ADAPTER%';

-- Mouse Komputer
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Mouse Komputer' LIMIT 1) WHERE name ILIKE '%WIRELESS%' AND sku ILIKE 'DM%';

-- Speaker Multimedia
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Speaker Multimedia' LIMIT 1) WHERE name ILIKE '%SPEAKER FOR PC%';

-- Update Category Images
UPDATE categories
SET image_url = subquery.image_url
FROM (
  SELECT category_id, MIN(image_url) as image_url
  FROM products
  WHERE image_url IS NOT NULL
  GROUP BY category_id
) AS subquery
WHERE categories.id = subquery.category_id;

-- 1. Insert Categories (Mengabaikan jika sudah ada nama yang sama)
INSERT INTO categories (id, name, description) VALUES
  (gen_random_uuid(), 'KABEL DATA', 'Kabel Data'),
  (gen_random_uuid(), 'ADAPTOR CHARGER', 'Adaptor Charger'),
  (gen_random_uuid(), 'CHARGER SET', 'Charger Set'),
  (gen_random_uuid(), 'EARPHONE', 'Earphone'),
  (gen_random_uuid(), 'MOUSE PAD', 'Mouse Pad'),
  (gen_random_uuid(), 'AKSESORIS LAINNYA', 'Aksesoris Lainnya')
ON CONFLICT DO NOTHING;

-- 2. Update products KABEL DATA
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'KABEL DATA' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%MICRO%' OR 
  name ILIKE '%TYPE-C%' OR 
  name ILIKE '%LIGHTNING%' OR 
  name ILIKE '%CTC%' OR
  sku ILIKE 'DN%' OR
  sku ILIKE 'DD%' OR
  sku ILIKE 'DJ%'
);

-- 3. Update products ADAPTOR CHARGER
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'ADAPTOR CHARGER' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%ADAPTOR%' OR 
  name ILIKE '%USB%' OR 
  name ILIKE '%20W%' OR 
  name ILIKE '%65W%' OR
  sku ILIKE 'DA%'
);

-- 4. Update products CHARGER SET
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'CHARGER SET' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%SET%' OR
  sku ILIKE 'DS%'
);

-- 5. Update products MOUSE PAD
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'MOUSE PAD' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%MOUSE PAD%';

-- 6. Update products EARPHONE
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'EARPHONE' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%EARPHONE%' OR name ILIKE '%HEADSET%' OR name ILIKE '%WIRED%');

-- 7. Sisanya masukkan ke AKSESORIS LAINNYA
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'AKSESORIS LAINNYA' LIMIT 1)
WHERE category_id IS NULL;

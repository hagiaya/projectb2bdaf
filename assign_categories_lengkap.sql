-- 1. Insert Categories Lengkap (Mengabaikan jika sudah ada)
INSERT INTO categories (id, name, description) VALUES
  (gen_random_uuid(), 'Kabel Data', 'Kabel Data'),
  (gen_random_uuid(), 'Adaptor Charger', 'Adaptor Charger'),
  (gen_random_uuid(), 'Charger Set', 'Charger Set'),
  (gen_random_uuid(), 'Car Charger', 'Car Charger'),
  (gen_random_uuid(), 'Power Bank', 'Power Bank'),
  (gen_random_uuid(), 'Headset Bluetooth', 'Headset Bluetooth'),
  (gen_random_uuid(), 'Antigores & Back Stiker', 'Antigores & Back Stiker'),
  (gen_random_uuid(), 'Microphone Wireless', 'Microphone Wireless'),
  (gen_random_uuid(), 'Speaker Bluetooth', 'Speaker Bluetooth'),
  (gen_random_uuid(), 'Car Holder', 'Car Holder'),
  (gen_random_uuid(), 'Headphone Gaming', 'Headphone Gaming'),
  (gen_random_uuid(), 'Phone Holder Stand', 'Phone Holder Stand'),
  (gen_random_uuid(), 'Headset', 'Headset'),
  (gen_random_uuid(), 'Kipas Mini / Kipas Mini Turbo', 'Kipas Mini / Kipas Mini Turbo'),
  (gen_random_uuid(), 'Tripod / Tongsis', 'Tripod / Tongsis'),
  (gen_random_uuid(), 'Converter / OTG / Card Reader', 'Converter / OTG / Card Reader'),
  (gen_random_uuid(), 'Mic Karaoke Bluetooth', 'Mic Karaoke Bluetooth'),
  (gen_random_uuid(), 'Kabel Audio', 'Kabel Audio'),
  (gen_random_uuid(), 'Speaker Multimedia', 'Speaker Multimedia'),
  (gen_random_uuid(), 'CCTV Kamera', 'CCTV Kamera'),
  (gen_random_uuid(), 'Audio Adapter / Converter', 'Audio Adapter / Converter'),
  (gen_random_uuid(), 'Micro SD', 'Micro SD'),
  (gen_random_uuid(), 'Flashdisk', 'Flashdisk'),
  (gen_random_uuid(), 'Smartwatch', 'Smartwatch'),
  (gen_random_uuid(), 'Sarung Jari Gaming', 'Sarung Jari Gaming'),
  (gen_random_uuid(), 'Flashdisk Type-C', 'Flashdisk Type-C'),
  (gen_random_uuid(), 'Aksesoris Komputer', 'Aksesoris Komputer'),
  (gen_random_uuid(), 'Flashdisk Micro', 'Flashdisk Micro'),
  (gen_random_uuid(), 'Mouse Komputer', 'Mouse Komputer'),
  (gen_random_uuid(), 'Pengikat Kabel Data', 'Pengikat Kabel Data'),
  (gen_random_uuid(), 'Bantal Leher', 'Bantal Leher'),
  (gen_random_uuid(), 'Keyboard Komputer', 'Keyboard Komputer'),
  (gen_random_uuid(), 'Fan Cooler Gaming', 'Fan Cooler Gaming')
ON CONFLICT DO NOTHING;

-- 2. Auto-Update Products Berdasarkan Kata Kunci Nama / SKU
-- Kabel Data
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Kabel Data' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%MICRO %' OR 
  name ILIKE '%TYPE-C %' OR 
  name ILIKE '%LIGHTNING%' OR 
  name ILIKE '%CTC%' OR
  name ILIKE '%KABEL DATA%' OR
  sku ILIKE 'DN%' OR sku ILIKE 'DD%' OR sku ILIKE 'DJ%'
);

-- Adaptor Charger
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Adaptor Charger' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%ADAPTOR%' OR 
  name ILIKE '%20W%' OR 
  name ILIKE '%65W%' OR
  sku ILIKE 'DA%'
);

-- Charger Set
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Charger Set' LIMIT 1)
WHERE category_id IS NULL AND (
  name ILIKE '%SET%' OR
  sku ILIKE 'DS%'
);

-- Mouse Komputer
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Mouse Komputer' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%MOUSE%' AND name NOT ILIKE '%PAD%';

-- Mouse Pad
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Mouse Pad' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%MOUSE PAD%';

-- Headset (General)
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Headset' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%EARPHONE%' OR name ILIKE '%HEADSET%') AND name NOT ILIKE '%BLUETOOTH%';

-- Headset Bluetooth
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Headset Bluetooth' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%HEADSET BLUETOOTH%' OR name ILIKE '%TWS%');

-- Keyboard Komputer
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Keyboard Komputer' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%KEYBOARD%';

-- Car Charger
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Car Charger' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%CAR CHARGER%';

-- Power Bank
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Power Bank' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%POWER BANK%';

-- Speaker Bluetooth
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Speaker Bluetooth' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%SPEAKER BLUETOOTH%';

-- Flashdisk
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Flashdisk' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%FLASHDISK%';

-- Micro SD
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Micro SD' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%MICRO SD%';

-- Car Holder
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Car Holder' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%CAR HOLDER%';

-- Phone Holder Stand
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Phone Holder Stand' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%PHONE HOLDER%' OR name ILIKE '%STAND HOLDER%');

-- Tripod / Tongsis
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Tripod / Tongsis' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%TRIPOD%' OR name ILIKE '%TONGSIS%');

-- Smartwatch
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Smartwatch' LIMIT 1)
WHERE category_id IS NULL AND name ILIKE '%SMARTWATCH%';

-- Kipas Mini
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Kipas Mini / Kipas Mini Turbo' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%KIPAS%' OR name ILIKE '%FAN%') AND name NOT ILIKE '%COOLER GAMING%';

-- Fan Cooler Gaming
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Fan Cooler Gaming' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%COOLER%' OR name ILIKE '%FAN GAMING%');

-- Converter
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
WHERE category_id IS NULL AND (name ILIKE '%CONVERTER%' OR name ILIKE '%OTG%' OR name ILIKE '%CARD READER%') AND name NOT ILIKE '%AUDIO%';

-- Add is_new column to products table to allow marking products as NEW explicitly
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- (Optional) Update existing products to have is_new = true if their SKU or name contains 'NEW'
UPDATE public.products
SET is_new = true
WHERE (sku ILIKE '%NEW%') OR (name ILIKE '%NEW%');

-- Seed Initial Data for B2B E-Commerce

INSERT INTO public.regions (code, name, manager_name) VALUES 
('REG-001', 'Jawa Timur', 'Ahmad Dani'),
('REG-002', 'Jawa Tengah', 'Budi Santoso')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, description) VALUES
('Material', 'Semen, Pasir, dll'),
('Besi', 'Besi Beton, Kawat'),
('Cat', 'Cat Tembok, Kayu'),
('Keramik', 'Lantai, Dinding'),
('Pipa', 'PVC, Besi')
ON CONFLICT DO NOTHING;

-- Note: In PostgreSQL, if you use a subquery like this, ensure categories actually exist or the IDs match.
DO $$ 
DECLARE
    cat_material UUID;
    cat_besi UUID;
    cat_cat UUID;
    cat_keramik UUID;
    cat_pipa UUID;
BEGIN
    SELECT id INTO cat_material FROM public.categories WHERE name = 'Material' LIMIT 1;
    SELECT id INTO cat_besi FROM public.categories WHERE name = 'Besi' LIMIT 1;
    SELECT id INTO cat_cat FROM public.categories WHERE name = 'Cat' LIMIT 1;
    SELECT id INTO cat_keramik FROM public.categories WHERE name = 'Keramik' LIMIT 1;
    SELECT id INTO cat_pipa FROM public.categories WHERE name = 'Pipa' LIMIT 1;

    INSERT INTO public.products (category_id, name, sku, price, stock, status) VALUES
    (cat_material, 'Semen Gresik 40kg', 'SG-40', 55000, 1250, 'ACTIVE'),
    (cat_besi, 'Besi Beton 10mm', 'BB-10', 78000, 500, 'ACTIVE'),
    (cat_cat, 'Cat Tembok Dulux 5kg', 'CT-D5', 145000, 85, 'ACTIVE'),
    (cat_keramik, 'Keramik Roman 40x40', 'KR-40', 95000, 200, 'ACTIVE'),
    (cat_pipa, 'Pipa PVC Wavin 3/4"', 'PP-W34', 42000, 350, 'ACTIVE')
    ON CONFLICT (sku) DO NOTHING;
END $$;

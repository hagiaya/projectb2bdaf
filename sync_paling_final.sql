-- SQL Script to Sync Products from paling final.xlsx
BEGIN;

INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNM200', 
        'MICRO 3A 2M', 
        486000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNT200', 
        'TYPE-C 3A 2M', 
        530000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNL200', 
        'LIGHTNING 3A 2M', 
        546000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPL25', 
        'LIGHTNING 2.4A 25CM', 
        647000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAL100', 
        'TYPE-C 2.4A 1M', 
        327000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DYL100', 
        'LIGHTNING 2.4A 1M', 
        876000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPL100', 
        'LIGHTNING 2.4A 1M', 
        536000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DDM100', 
        'MICRO 3A 1.1M', 
        177000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNM100 (HABIS)', 
        'MICRO 3A 1M', 
        456000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNT100', 
        'TYPE-C 3A 1M', 
        527000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNL100', 
        'LIGHTNING 3A 1M', 
        546000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNM300 NEW', 
        'MICRO 3A 3M', 
        572000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DNL300 NEW', 
        'LIGHTNING 3A 3M', 
        612000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DIM100', 
        'MICRO 3A 1M', 
        278000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DIT100', 
        'TYPE-C 3A 1.1M', 
        325000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DIL100', 
        'LIGHTNING 3A 1.1M', 
        351000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DIC100', 
        'CTC 65W 1.1M', 
        338000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ01M', 
        'MICRO 2.4A 1M', 
        138000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ01T', 
        'TYPE-C 2.4A 1M', 
        176000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ01L', 
        'LIGHTNING 2.4A 1M', 
        218000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ02C MASSAGER', 
        'CTC MASSAGER 1.4M', 
        231000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ03C NEW', 
        'CTC 65W 25CM', 
        18000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ04T NEW', 
        'TYPE-C 3A 1M', 
        322000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ04M NEW', 
        'MICRO 3A 1M', 
        267000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ04L NEW', 
        'LIGHTNING 3A 1M', 
        384000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ05T NEW', 
        'TYPE-C 6A 1M', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ05C NEW', 
        'CTC 3.3A 1M', 
        32000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ06M NEW', 
        'MICRO 3A 1M', 
        481000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ06T NEW', 
        'TYPE-C 3A 1M', 
        520000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ07T NEW', 
        'TYPE-C 1M', 
        390000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ07CC NEW', 
        'CTC 66W 1M', 
        455000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DJ07CL NEW', 
        'CTL 30W 1M', 
        602000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB02L', 
        'LIGHTNING 2.4A 1M', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB02M', 
        'MICRO 2.4A 1M', 
        25000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS20L', 
        'LIGHTNING 3A 1M', 
        588000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DG100 NEW', 
        'CTC 65W 1M', 
        38000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DG200 NEW', 
        'CTC 65W 2M', 
        47000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM30', 
        'MICRO 2.4A 30CM', 
        17000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM100', 
        'MICRO 2.4A 1M', 
        23000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM200', 
        'MICRO 2.4A 2M', 
        31000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCT100', 
        'TYPE-C 60W 1M', 
        30000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL30', 
        'LIGHTNING 2.4A 30CM', 
        18500.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL100', 
        'LIGHTNING 2.4A 1M', 
        27000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT30', 
        'TYPE-C 2.4A 30CM', 
        25000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT100', 
        'TYPE-C 2.4A 1M', 
        32000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT200', 
        'TYPE-C 2.4A 2M', 
        41000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL01M', 
        'MICRO 2.4A 1M', 
        20000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL01T', 
        'TYPE-C 2.4A 1M', 
        22000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL02M', 
        'MICRO 2.4A 1M', 
        27000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL02T', 
        'TYPE-C 2.4A 1.2M', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL02L', 
        'LIGHTNING 2.4A 1.2M', 
        30000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL03M', 
        'MICRO 2.4A 1M', 
        41000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL03T', 
        'TYPE-C 2.4A 1M', 
        43000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL03L', 
        'LIGHTNING 2.4A 1M', 
        44000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL04L', 
        'LIGHTNING 3A 1.2M', 
        43000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL04M', 
        'C TO MICRO 3A 1.2M', 
        32000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DL04T', 
        'CTC 3A 1.2M', 
        36000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DC1M', 
        'C TO MICRO 3A 1M', 
        273000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCBT100', 
        'TYPE-C 2.4A 1M', 
        17000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC110', 
        'CTC 65W 1.1M', 
        292000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCM110', 
        'MICRO 3A 1.1M', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCT110', 
        'TYPE-C 4.5A 1.1M', 
        31000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCL110', 
        'LIGHTNING 3A 1M', 
        37000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DEM100N', 
        'MICRO 3A 1M', 
        19000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DET100N', 
        'TYPE-C 3A 1M', 
        21000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DEL100N', 
        'LIGHTNING 3A 1M', 
        23000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DBM100N', 
        'MICRO 3A 1M', 
        19000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DBL100N', 
        'LIGHTNING 3A 1M', 
        23000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHM100', 
        'MICRO 3A 1M', 
        244000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHT100', 
        'TYPE-C 3A 1M', 
        287000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC100', 
        'CTC 3A 1M', 
        332000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC120', 
        'CTC 3A 60W 1.2M', 
        38000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCL120 BRAIDED', 
        'CTL 3A 1.2M', 
        49000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DX120M', 
        'MICRO 3A 1.2M', 
        34000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DX120T', 
        'TYPE-C 3A 1.2M', 
        36000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DX120L', 
        'LIGHTNING 3A 1.2M', 
        38000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DETT120N', 
        'CTC 60W 1.2M', 
        30000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DETL120N', 
        'CTL 3A 1.2M', 
        41000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DBTL120N', 
        'CTL 3A 1.2M', 
        43000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS10L NEW', 
        'LIGHTNING 3A 2M', 
        403000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS10M NEW', 
        'MICRO 3A 2M', 
        364000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS10T NEW', 
        'TYPE-C 3A 2M', 
        377000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DYCC100 NEW', 
        'CTC 3A 1M', 
        273000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DYCL100 NEW', 
        'CTL 3A 1M', 
        328000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DYM100-15 NEW', 
        'MICRO 2.4A 1M', 
        140000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DYT100-15 NEW', 
        'TYPE-C 2.4A 1M', 
        218000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DYL100-15 NEW', 
        'LIGHTNING 2.4A 1M', 
        254000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Kabel Data' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT01', 
        'TWS', 
        172000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT02', 
        'TWS', 
        125000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT03 NEW', 
        'TWS', 
        99000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT04', 
        'TWS', 
        157000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT06 SPORT NEW', 
        'TWS SPORT', 
        215000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT07', 
        'TWS SPORT', 
        238000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT08', 
        'TWS', 
        175000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT08 ANC NEW', 
        'TWS', 
        175000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT08N NEW', 
        'TWS', 
        223000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT09N', 
        'TWS', 
        277000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT10', 
        'TWS', 
        170000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT11', 
        'TWS', 
        149000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT12N NEW', 
        'TWS', 
        117000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT13N NEW', 
        'TWS', 
        134000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT14', 
        'TWS', 
        190000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT15', 
        'TWS', 
        137000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT20N NEW', 
        'TWS', 
        175000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT21', 
        'TWS', 
        215000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DT22', 
        'TWS', 
        187000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset bluetooth (TWS)' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY3T', 
        'nan', 
        156000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY6', 
        'nan', 
        377000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY7N NEW', 
        'nan', 
        199000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY8N NEW', 
        'nan', 
        225000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY9 NEW', 
        'nan', 
        325000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY10 NEW', 
        'nan', 
        260000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY11', 
        'nan', 
        250000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY17N NEW', 
        'nan', 
        126000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY19N NEW', 
        'nan', 
        288000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY23N NEW', 
        'nan', 
        89000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY20', 
        'nan', 
        2165000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY22 NEW', 
        'nan', 
        1560000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'speaker bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF36', 
        'USB & JACK 3.5MM', 
        272000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Headphone Gaming' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF37', 
        'USB & JACK 3.5MM', 
        313000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Headphone Gaming' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF2', 
        'JACK 3.5MM', 
        18000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF3', 
        'JACK 3.5MM', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF4', 
        'JACK 3.5MM', 
        503000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF4N', 
        'JACK 3.5MM', 
        455000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF9', 
        'JACK 3.5MM', 
        39000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF10', 
        'JACK 3.5MM', 
        42000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF11', 
        'JACK 3.5MM', 
        45000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF13', 
        'JACK 3.5MM', 
        30000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF14', 
        'JACK 3.5MM', 
        21000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF15', 
        'JACK 3.5MM', 
        22000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF18', 
        'LIGHTNING', 
        65000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF19', 
        'JACK 3.5MM', 
        43000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF20', 
        'JACK 3.5MM', 
        65000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF21', 
        'JACK 3.5MM', 
        78000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF23', 
        'JACK 3.5MM', 
        17000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHF24', 
        'JACK 3.5MM', 
        64000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'headset' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY24', 
        'nan', 
        177000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Mic Karaoke Bluetooth' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY1', 
        'SPEAKER UNTUK PC', 
        173000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Speaker Multimedia' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DVY2', 
        'SPEAKER UNTUK PC', 
        106000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Speaker Multimedia' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTV01 NEW', 
        'CCTV INDOOR', 
        306000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'CCTV Camera' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF04N 4GB', 
        'WITH SD CARD ADAPTER', 
        124000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF08N 8GB', 
        'WITH SD CARD ADAPTER', 
        130000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF16N 16GB', 
        'WITH SD CARD ADAPTER', 
        175000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF32N 32GB', 
        'WITH SD CARD ADAPTER', 
        198000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF64N 64GB', 
        'WITH SD CARD ADAPTER', 
        316000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF128 128GB', 
        'WITH SD CARD ADAPTER', 
        360000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF256 256GB', 
        'WITH SD CARD ADAPTER', 
        522000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DTF512 512GB', 
        'WITH SD CARD ADAPTER', 
        1185000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'micro sd' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DU04 4GB', 
        'nan', 
        78000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk USB' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DU08 8GB', 
        'nan', 
        88000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk USB' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DU16 16GB', 
        'nan', 
        103000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk USB' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DU32 32GB', 
        'nan', 
        146000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk USB' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DU64 64GB', 
        'nan', 
        186000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk USB' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUT08 8GB', 
        'USB & TYPE-C (2IN1)', 
        184000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk type-c' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUT16 16GB', 
        'USB & TYPE-C (2IN1)', 
        209000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk type-c' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUT32 32GB', 
        'USB & TYPE-C (2IN1)', 
        250000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk type-c' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUT64 64GB', 
        'USB & TYPE-C (2IN1)', 
        299000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk type-c' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUT128 128GB', 
        'USB & TYPE-C (2IN1)', 
        374000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk type-c' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUT256 256GB', 
        'USB & TYPE-C (2IN1)', 
        489000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Flashdisk type-c' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUM08 8GB', 
        'USB & MICRO (2IN1)', 
        80000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'flasdisk micro' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUM16 16GB', 
        'USB & MICRO (2IN1)', 
        96000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'flasdisk micro' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUM32 32GB', 
        'USB & MICRO (2IN1)', 
        113000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'flasdisk micro' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DUM64 64GB', 
        'USB & MICRO (2IN1)', 
        130000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'flasdisk micro' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM01', 
        'WIRELESS', 
        70000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM03', 
        'WIRELESS', 
        52000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM04Y', 
        'WIRED', 
        28000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM05Y', 
        'WIRED', 
        28000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM07Y', 
        'WIRED', 
        49000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM08 NEW', 
        'WIRELESS', 
        54000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM09 NEW', 
        'WIRELESS', 
        57000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM10 NEW', 
        'WIRELESS', 
        74000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DM11 NEW', 
        'WIRELESS', 
        85000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'MP021', 
        'ALAS MOUSE', 
        13000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'MP022', 
        'ALAS MOUSE', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'mouse komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DK01', 
        'WIRED', 
        110000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'keyboard komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DK02', 
        'WIRED', 
        77000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'keyboard komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DK03', 
        'WIRED', 
        76000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'keyboard komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA3', 
        '1 USB 5V/2.1A', 
        243000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA4N', 
        '2 USB 5V/2.4A', 
        449000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA13', 
        '2 USB 5V/2.4A', 
        34000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA15', 
        '1 USB 5V/2.4A', 
        25000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP0', 
        'DUAL USB-C', 
        56000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP3 NEW', 
        '1 USB-C 20W', 
        54000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP8', 
        '2 USB & 1 USB-C', 
        82000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP10 NEW', 
        '1 USB & 1 USB-C 20W', 
        66000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP11 NEW', 
        'DUAL USB-C 20W&45W', 
        131000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP12 NEW', 
        '1 USB & 1 USB-C', 
        468000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP19 NEW', 
        '1 USB-C 30W', 
        56000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP20 NEW', 
        '1 USB & 1 USB-C 20W', 
        375000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ5', 
        '1 USB 25W', 
        741000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ7', 
        '1 USB 18W', 
        48000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ9', 
        '1 USB 30W', 
        84000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAT1', 
        '2 USB 5V/2.4A', 
        426000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAT4', 
        '1 USB 5V/3A', 
        642000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAT5 (HABIS)', 
        '1 USB 5V/2.4A', 
        515000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Adaptor Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA3T', 
        'TYPE-C CABLE 2.4A', 
        49000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA2M', 
        'MICRO CABLE 2.4A', 
        47000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA5M', 
        'MICRO CABLE 2A', 
        40000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA6M', 
        'MICRO CABLE 2.4A', 
        43000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA6T', 
        'TYPE-C CABLE 2.4A', 
        48000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA6L', 
        'LIGHTNING CABLE 2.4A', 
        59000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA12M', 
        'MICRO CABLE 2A', 
        35000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DA18T', 
        'TYPE-C CABLE', 
        61000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP1C', 
        'CTC CABLE PD 30W', 
        70000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP1L', 
        'CTL CABLE PD 30W', 
        84000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP4', 
        'TYPE-C CABLE 66W', 
        135000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP9C', 
        'CTC CABLE 60W', 
        98000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP9L', 
        'CTL CABLE PD 30W', 
        112000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP11C', 
        'CTC CABLE 65W', 
        156000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP16', 
        'CTC CABLE GAN 45W', 
        149000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP17', 
        'CTC CABLE GAN 45W', 
        159000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP21 NEW', 
        'CTC CABLE 100W', 
        102000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP22 NEW', 
        'TYPE-C CABLE 36W', 
        88000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP23 NEW', 
        'BUILT-IN TYPE-C 60W', 
        160000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAP24 NEW', 
        'CTC CABLE GAN 140W', 
        153000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ2', 
        'TYPE-C CABLE 18W', 
        57000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ3T', 
        'TYPE-C CABLE 18W', 
        84000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ4C', 
        'TYPE-C CABLE 25W', 
        68000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ6', 
        'MICRO CABLE', 
        58000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ9C', 
        'TYPE-C CABLE 55W', 
        107000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ7C NEW', 
        'TYPE-C CABLE 30W', 
        64000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAQ7L NEW', 
        'LIGHTNING CABLE 30W', 
        70000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC1N', 
        '2 USB 5V/2.4A', 
        429000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC2N', 
        '2 USB + MICRO CABLE', 
        45000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC4', 
        '2 USB 5V/2.4A', 
        160000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC5', 
        '2 USB 5V/2.4A', 
        29000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC6T NEW', 
        '2 USB + TYPE-C CABLE', 
        85000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP0', 
        '1 USB 18W', 
        40000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP1', 
        '4 USB 38W', 
        87000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP2', 
        '1 USB & 1 USB-C 38W', 
        83000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP3', 
        '2 USB 36W', 
        47000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP4 NEW', 
        '3 USB-C 66W', 
        64000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP5', 
        '1 USB & 1 USB-C 38W', 
        83000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP6', 
        '1 USB & 1 USB-C 38W', 
        53000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP7', 
        '2 USB & 1 USB-C CAR FM', 
        82000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP8 NEW', 
        '2 USB & 1 USB-C 30W', 
        82000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP8T NEW', 
        '2 USB & 1 USB-C + TYPE-C CABLE', 
        94000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP9 NEW', 
        '2 USB & 2 USB-C + CTC CABLE', 
        94000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP10 NEW', 
        '3 USB-C + CTC CABLE', 
        86000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCCP11 NEW', 
        '2 USB & USB-C + BUILT-IN CABLE TYPE-C & LIGHTNING (5IN1)', 
        182000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC2T', 
        '2 USB + TYPE-C CABLE', 
        42000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC45', 
        '2 USB-C + CTC CABLE', 
        87000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCC10M', 
        '2 USB & 1 USB-C + MICRO CABLE', 
        87000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DC3.0', 
        '2 USB & 1 USB-C', 
        69000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Charger' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB101B', 
        '10000mAh', 
        135000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB101W', 
        '10000mAh', 
        135000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB050G', 
        '5000mAh', 
        89000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB053', 
        '5000mAh', 
        98000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB053G', 
        '5000mAh', 
        98000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB053W', 
        '5000mAh', 
        98000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB053B', 
        '5000mAh', 
        98000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPB201 NEW', 
        '20000mAh', 
        259000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD051S', 
        '5000mAh WIRELESS', 
        221000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD052L', 
        '5000mAh WIRELESS', 
        244000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD101', 
        '10000mAh', 
        180000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD101P', 
        '10000mAh', 
        180000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD101W', 
        '10000mAh', 
        180000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD102BO', 
        '10000mAh', 
        240000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD103W', 
        '10000mAh', 
        169000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD103B', 
        '10000mAh', 
        169000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD105B NEW', 
        '10000mAh', 
        248000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD105S NEW', 
        '10000mAh', 
        248000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD301B NEW', 
        '30000mAh', 
        404000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DPD401B NEW', 
        '40000mAh', 
        732000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Power Bank' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS01N', 
        'MESIN PEMOTONG', 
        7800000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS14 NEW', 
        'MESIN PEMOTONG', 
        8100000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS13', 
        'CLEAR HD UNTUK TABLET', 
        600000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS15', 
        'CLEAR HD', 
        1100000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS16', 
        'CLEAR & BURAM (EFEK ES)', 
        1100000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS17', 
        'CLEAR & ANTI BLUE LIGHT', 
        1250000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS18', 
        'PRIVACY & MATTE', 
        390000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS19', 
        'CLEAR & ANTI COLLLISION', 
        625000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS20', 
        'CLEAR & SELF HEALING', 
        281000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS21 NEW', 
        'PRIVACY 360 DERAJAT', 
        569000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS06', 
        'BACK STICKER', 
        1050000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS09', 
        'BACK STICKER', 
        1050000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS10', 
        'BACK STICKER', 
        1050000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS22 NEW', 
        'CLEAR & SELF HEALING UNTUK TABLET', 
        513000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS23 NEW', 
        'CLEAR & SELF HEALING', 
        234000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS24 NEW', 
        'CLEAR & BURAM (EFEK ES)', 
        281000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS25 NEW', 
        'CLEAR & ANTI BLUE LIGHT', 
        281000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS26 NEW', 
        'PRIVACY & MATTE', 
        313000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS27 NEW', 
        'CLEAR, ANTI PECAH & TAHAN LEDAKAN/PERCIKAN API', 
        406000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DS28 NEW', 
        'CLEAR & SELF HEALING', 
        235000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Antigores & Back Stiker' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ1', 
        'nan', 
        65000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ3', 
        'nan', 
        48000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ10', 
        'nan', 
        77000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ11', 
        'nan', 
        70000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ12', 
        'nan', 
        88000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ14', 
        'nan', 
        58000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ16', 
        '(HABIS)', 
        62000.0, 
        0,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ17 NEW', 
        'nan', 
        66000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ18 NEW', 
        'nan', 
        83000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ19 NEW', 
        'nan', 
        59000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ20 NEW', 
        'nan', 
        55000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ21 NEW', 
        'nan', 
        117000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ22 NEW', 
        'nan', 
        50000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Car Holder' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ13', 
        'nan', 
        34000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'phone holder stand' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCZ15S NEW', 
        'nan', 
        40000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'phone holder stand' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB04', 
        'KIPAS DESKTOP', 
        225000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB05', 
        'KIPAS DESKTOP', 
        152000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB07', 
        'KIPAS MINI TURBO', 
        233000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB08 NEW', 
        'KIPAS MINI TURBO', 
        173000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB09 NEW', 
        'KIPAS MINI TURBO', 
        93000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB10 NEW', 
        'KIPAS DESKTOP', 
        325000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DB11 NEW', 
        'KIPAS MINI TURBO', 
        79000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kipas desktop/ kipas mini turbo' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHP01 NEW', 
        'TRIPOD & TONGSIS 70CM', 
        75000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'tripod / tongsis' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHP02 NEW', 
        'TRIPOD & TONGSIS 185CM', 
        245000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'tripod / tongsis' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHP04 NEW', 
        'GIMBAL & TRIPOD 192CM', 
        509000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'tripod / tongsis' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHP05 NEW', 
        'TRIPOD & TONGSIS 90CM', 
        200000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'tripod / tongsis' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DHP06 NEW', 
        'TRIPOD & TONGSIS 208CM', 
        170000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'tripod / tongsis' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'M01C', 
        'CONVERTER MICRO TO C', 
        18000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'M02L', 
        'CONVERTER MICRO TO L', 
        20000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'OTG1C', 
        'OTG TYPE-C', 
        21000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'OTG2N', 
        'OTG MICRO', 
        13000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCR01', 
        'CARD READER TYPE-C', 
        38000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCR02', 
        'CARD READER USB + C', 
        136000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCR03', 
        'CARD READER LIGHTNING', 
        96000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCR04', 
        'CARD READER TYPE-C', 
        86000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DCR05', 
        'C TO HDMI FEMALE', 
        132000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Converter / OTG / Card Reader' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU01', 
        'KABEL AUX JACK 3.5MM', 
        16000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU02', 
        'KABEL AUX JACK 3.5MM', 
        364000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU03', 
        'KABEL AUX JACK 3.5MM', 
        23000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU06', 
        'JACK 3.5MM TO RCA', 
        28000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU07', 
        'JACK 3.5MM TO RCA', 
        34000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU08', 
        'JACK 3.5MM TO RCA2', 
        33000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU09', 
        'JACK 3.5MM TO RCA3', 
        30000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'kabe audio' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU04N', 
        'TYPE-C TO 3.5MM', 
        41000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU10', 
        'LIGHTNING TO TYPE-C', 
        39000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU11', 
        'LIGHTNING TO 3.5MM + C', 
        56000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU12', 
        'TYPE-C TO 3.5MM', 
        42000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU13', 
        'LIGHTNING TO 3.5MM', 
        49000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU14', 
        'LIGHTNING TO 3.5MM', 
        45000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU15', 
        'TYPE-C TO 3.5MM + C', 
        73000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU16', 
        'TYPE-C TO C + C', 
        63000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU18', 
        'LIGHTNING TO 3.5MM + C', 
        219000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU19', 
        'RCA3 TO RCA3 1.5M', 
        40000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU20', 
        'RCA3 TO RCA3 3M', 
        54000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DAU21', 
        'USB TO JACK 3.5MM', 
        49000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'audio adapter' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DSW04 NEW', 
        'nan', 
        374000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'smartwatch' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DGM01', 
        'nan', 
        8000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'sarung jari gaming' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH01', 
        'KABEL HDMI 1.5M', 
        40000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH02', 
        'KABEL VGA', 
        56000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH03', 
        'KABEL POWER PC', 
        38000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH04', 
        'POWER STRIP / HUB USB', 
        112000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH05', 
        'HUB USB 4IN1 15CM', 
        38000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH06', 
        'HUB USB 4IN1 100CM', 
        42000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH07', 
        'USB TO ETHERNET RJ45', 
        60000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH08', 
        'KABEL HDMI 2M', 
        34000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH09', 
        'KABEL HDMI 3M', 
        43000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH10', 
        'KABEL HDMI 5M', 
        59000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DH11 NEW', 
        'KABEL TYPE-C TO HDMI', 
        129000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'Aksesoris Komputer' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DV01', 
        'nan', 
        1500.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'pengikat kabel' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DV02', 
        'nan', 
        8000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'pengikat kabel' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DLP22', 
        'nan', 
        78000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'bantal leher' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        'DLP23', 
        'nan', 
        48000.0, 
        100,
        (SELECT id FROM public.categories WHERE name = 'bantal leher' LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;

COMMIT;
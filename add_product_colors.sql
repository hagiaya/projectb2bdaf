ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS selected_color TEXT;

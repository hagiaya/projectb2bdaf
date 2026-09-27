ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;

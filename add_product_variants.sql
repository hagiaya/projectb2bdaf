ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

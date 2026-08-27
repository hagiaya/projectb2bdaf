-- Menambahkan kolom yang mungkin terlewat di tabel orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_cost') THEN
        ALTER TABLE public.orders ADD COLUMN shipping_cost DECIMAL(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_url') THEN
        ALTER TABLE public.orders ADD COLUMN payment_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='midtrans_transaction_id') THEN
        ALTER TABLE public.orders ADD COLUMN midtrans_transaction_id TEXT;
    END IF;
END $$;

-- Memaksa API Supabase untuk memuat ulang daftar kolom (Schema Cache)
NOTIFY pgrst, 'reload schema';

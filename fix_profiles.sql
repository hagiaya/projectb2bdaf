-- Memastikan kolom address, lat, dan lng ada di tabel profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lat') THEN
        ALTER TABLE public.profiles ADD COLUMN lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lng') THEN
        ALTER TABLE public.profiles ADD COLUMN lng DOUBLE PRECISION;
    END IF;
END $$;

-- Memaksa API Supabase untuk memuat ulang daftar kolom (Schema Cache)
NOTIFY pgrst, 'reload schema';

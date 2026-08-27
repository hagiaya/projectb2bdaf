-- Memastikan SELURUH kolom yang dibutuhkan ada di tabel profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'dealer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_name') THEN
        ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lat') THEN
        ALTER TABLE public.profiles ADD COLUMN lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lng') THEN
        ALTER TABLE public.profiles ADD COLUMN lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='approval_status') THEN
        ALTER TABLE public.profiles ADD COLUMN approval_status TEXT DEFAULT 'PENDING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ktp_url') THEN
        ALTER TABLE public.profiles ADD COLUMN ktp_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='npwp_url') THEN
        ALTER TABLE public.profiles ADD COLUMN npwp_url TEXT;
    END IF;
END $$;

-- Memaksa API Supabase untuk memuat ulang daftar kolom (Schema Cache)
NOTIFY pgrst, 'reload schema';

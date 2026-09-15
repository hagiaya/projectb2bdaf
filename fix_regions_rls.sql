-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) FOR REGIONS & PROMOS
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. TABEL REGIONS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow read access to all users for regions" ON public.regions;
DROP POLICY IF EXISTS "Public can view active regions" ON public.regions;
DROP POLICY IF EXISTS "Admin full access to regions" ON public.regions;
DROP POLICY IF EXISTS "Enable all access for admins on regions" ON public.regions;
DROP POLICY IF EXISTS "Public can read regions" ON public.regions;

-- A. Izinkan SEMUA user (anon & authenticated) untuk membaca data wilayah (untuk pendaftaran dealer & filter)
CREATE POLICY "Allow read access to all users for regions" ON public.regions
    FOR SELECT 
    USING (true);

-- B. Izinkan Admin (role ADMIN di profiles) melakukan INSERT, UPDATE, DELETE
CREATE POLICY "Admin full access to regions" ON public.regions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- C. Alternatif tercepat jika ingin akses bebas tanpa RLS untuk data master:
-- ALTER TABLE public.regions DISABLE ROW LEVEL SECURITY;


-- 2. TABEL PROMOS (Pastikan Admin juga bisa kelola promo tanpa RLS 403)
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to promos" ON public.promos;
DROP POLICY IF EXISTS "Admin full access to promos" ON public.promos;

CREATE POLICY "Allow public read access to promos" ON public.promos
    FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access to promos" ON public.promos
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- 3. Reload cache schema PostgREST Supabase
NOTIFY pgrst, 'reload schema';

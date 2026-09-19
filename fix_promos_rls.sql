-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) FOR PROMOS TABLE
-- ==============================================================================

-- 1. Enable RLS on promos
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Allow public read access to promos" ON public.promos;
DROP POLICY IF EXISTS "Admin full access to promos" ON public.promos;
DROP POLICY IF EXISTS "Allow authenticated full access to promos" ON public.promos;
DROP POLICY IF EXISTS "Allow all for promos" ON public.promos;

-- 3. Policy: Anyone (anon + authenticated) can view active promos
CREATE POLICY "Allow public read access to promos" 
ON public.promos FOR SELECT 
USING (true);

-- 4. Policy: Authenticated users (Admin) can insert, update, and delete promos
CREATE POLICY "Allow authenticated full access to promos" 
ON public.promos FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Alternative (if unrestricted access is desired):
-- ALTER TABLE public.promos DISABLE ROW LEVEL SECURITY;

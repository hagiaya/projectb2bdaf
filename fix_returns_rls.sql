-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) FOR RETURNS TABLE
-- Jalankan di: Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow authenticated full access to returns" ON public.returns;
DROP POLICY IF EXISTS "Allow public read access to returns" ON public.returns;
DROP POLICY IF EXISTS "Allow all access to returns" ON public.returns;
DROP POLICY IF EXISTS "Dealers can view own returns" ON public.returns;
DROP POLICY IF EXISTS "Dealers can insert returns" ON public.returns;

-- 3. Policy: Allow all users to read returns
CREATE POLICY "Allow public read access to returns" 
ON public.returns FOR SELECT 
USING (true);

-- 4. Policy: Allow authenticated users (Dealers, Sales, Admin) full access to create & update returns
CREATE POLICY "Allow authenticated full access to returns" 
ON public.returns FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Policy: Allow insert from anon if user session is restoring
CREATE POLICY "Allow insert to returns" 
ON public.returns FOR INSERT 
WITH CHECK (true);

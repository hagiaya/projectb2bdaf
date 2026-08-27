-- Enable RLS just in case it isn't
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
DROP POLICY IF EXISTS "Enable read access for all users on categories" ON categories;
CREATE POLICY "Enable read access for all users on categories" ON categories FOR SELECT USING (true);

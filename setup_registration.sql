-- 1. Add approval_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Allow users to view their own profile (important for login check)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow everyone to view profiles for now (since admin web needs to list them without issues, or we can use service_role there)
-- Actually admin-web uses anon key, so we need admins to be able to see profiles.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' );

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_region_id UUID;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, role, full_name, phone_number, approval_status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'DEALER'), 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unnamed User'),
    new.raw_user_meta_data->>'phone_number',
    'PENDING'
  );

  -- Only create dealer if role is DEALER
  IF COALESCE(new.raw_user_meta_data->>'role', 'DEALER') = 'DEALER' THEN
    -- Find a default region (or insert one if none)
    SELECT id INTO v_region_id FROM public.regions LIMIT 1;
    
    INSERT INTO public.dealers (
      profile_id, 
      region_id,
      store_name, 
      address, 
      latitude, 
      longitude, 
      status
    )
    VALUES (
      new.id,
      v_region_id,
      COALESCE(new.raw_user_meta_data->>'store_name', 'Unnamed Store'),
      new.raw_user_meta_data->>'address',
      CAST(NULLIF(new.raw_user_meta_data->>'lat', '') AS DECIMAL),
      CAST(NULLIF(new.raw_user_meta_data->>'lng', '') AS DECIMAL),
      'PENDING' 
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Also ensure dealers can be updated by Admins
DROP POLICY IF EXISTS "Admins can update dealers" ON public.dealers;
CREATE POLICY "Admins can update dealers" ON public.dealers
    FOR UPDATE USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' );

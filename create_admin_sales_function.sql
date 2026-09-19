-- ==============================================================================
-- 1. PASTIKAN KOLOM-KOLOM KOMPENSASI TERSEDIA DI TABEL SALES & SALES_PAYROLLS
-- ==============================================================================
ALTER TABLE IF EXISTS public.sales 
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(15, 2) DEFAULT 500000.00,
ADD COLUMN IF NOT EXISTS is_spv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spv_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15, 2) DEFAULT 4500000.00,
ADD COLUMN IF NOT EXISTS direct_commission_pct DECIMAL(5, 2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS team_bonus_pct DECIMAL(5, 2) DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS daily_visit_target INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS work_days_per_month INTEGER DEFAULT 26;

ALTER TABLE IF EXISTS public.sales_payrolls 
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(15, 2) DEFAULT 500000.00;

-- ==============================================================================
-- 2. FUNGSI DAFTARKAN AKUN SALES & SPV DARI ADMIN PANEL (BYPASS EMAIL RATE LIMIT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_create_sales_account(
  p_full_name text,
  p_phone_number text,
  p_email text,
  p_password text,
  p_role text DEFAULT 'SALES',
  p_region_id uuid DEFAULT NULL,
  p_spv_id uuid DEFAULT NULL,
  p_base_salary numeric DEFAULT 4500000,
  p_direct_commission_pct numeric DEFAULT 1.0,
  p_team_bonus_pct numeric DEFAULT 0.25,
  p_transport_allowance numeric DEFAULT 500000,
  p_daily_visit_target integer DEFAULT 6,
  p_work_days_per_month integer DEFAULT 26
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  v_email text;
  v_clean_phone text;
  v_is_spv boolean;
  new_sales_id uuid;
BEGIN
  -- 1. Normalisasi nomor HP
  v_clean_phone := regexp_replace(p_phone_number, '\D', '', 'g');
  IF v_clean_phone LIKE '62%' THEN
    v_clean_phone := '0' || substring(v_clean_phone from 3);
  END IF;
  IF NOT v_clean_phone LIKE '0%' THEN
    v_clean_phone := '0' || v_clean_phone;
  END IF;

  -- 2. Format Email Login
  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    v_email := lower(trim(p_email));
  ELSE
    v_email := v_clean_phone || '@sales.b2b.app';
  END IF;

  -- 3. Cek duplikasi nomor HP di profiles atau auth.users
  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone_number = v_clean_phone) THEN
    SELECT id INTO new_user_id FROM public.profiles WHERE phone_number = v_clean_phone LIMIT 1;
  ELSE
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      SELECT id INTO new_user_id FROM auth.users WHERE email = v_email LIMIT 1;
    ELSE
      -- Buat akun baru di auth.users dengan password ter-enkripsi
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin
      )
      VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('role', upper(p_role), 'full_name', p_full_name, 'phone_number', v_clean_phone)::jsonb,
        FALSE
      );

      -- Buat data identity agar bisa login dengan password
      INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        id
      )
      VALUES (
        new_user_id::text,
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id::text, v_email)::jsonb,
        'email',
        now(),
        now(),
        gen_random_uuid()
      );
    END IF;
  END IF;

  v_is_spv := (upper(p_role) = 'SPV');

  -- 4. Upsert Profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
    UPDATE public.profiles
    SET role = upper(p_role),
        full_name = p_full_name,
        phone_number = v_clean_phone,
        approval_status = 'APPROVED'
    WHERE id = new_user_id;
  ELSE
    INSERT INTO public.profiles (
      id,
      role,
      full_name,
      phone_number,
      approval_status,
      created_at
    )
    VALUES (
      new_user_id,
      upper(p_role),
      p_full_name,
      v_clean_phone,
      'APPROVED',
      now()
    );
  END IF;

  -- 5. Upsert Sales Record (tanpa mengandalkan constraint ON CONFLICT)
  SELECT id INTO new_sales_id FROM public.sales WHERE profile_id = new_user_id LIMIT 1;

  IF new_sales_id IS NOT NULL THEN
    UPDATE public.sales
    SET region_id = p_region_id,
        spv_id = CASE WHEN v_is_spv THEN NULL ELSE p_spv_id END,
        status = 'ACTIVE',
        is_spv = v_is_spv,
        base_salary = CASE WHEN v_is_spv THEN 0 ELSE p_base_salary END,
        direct_commission_pct = p_direct_commission_pct,
        team_bonus_pct = p_team_bonus_pct,
        transport_allowance = CASE WHEN v_is_spv THEN 0 ELSE p_transport_allowance END,
        daily_visit_target = CASE WHEN v_is_spv THEN 0 ELSE p_daily_visit_target END,
        work_days_per_month = CASE WHEN v_is_spv THEN 0 ELSE p_work_days_per_month END
    WHERE id = new_sales_id;
  ELSE
    INSERT INTO public.sales (
      profile_id,
      region_id,
      spv_id,
      status,
      is_spv,
      base_salary,
      direct_commission_pct,
      team_bonus_pct,
      transport_allowance,
      daily_visit_target,
      work_days_per_month,
      balance,
      created_at
    )
    VALUES (
      new_user_id,
      p_region_id,
      CASE WHEN v_is_spv THEN NULL ELSE p_spv_id END,
      'ACTIVE',
      v_is_spv,
      CASE WHEN v_is_spv THEN 0 ELSE p_base_salary END,
      p_direct_commission_pct,
      p_team_bonus_pct,
      CASE WHEN v_is_spv THEN 0 ELSE p_transport_allowance END,
      CASE WHEN v_is_spv THEN 0 ELSE p_daily_visit_target END,
      CASE WHEN v_is_spv THEN 0 ELSE p_work_days_per_month END,
      0,
      now()
    )
    RETURNING id INTO new_sales_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'sales_id', new_sales_id,
    'email', v_email,
    'role', upper(p_role)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Beri izin akses pemanggilan RPC
GRANT EXECUTE ON FUNCTION public.admin_create_sales_account TO anon, authenticated, service_role;

-- ==============================================================================
-- 3. PERBAIKAN AKSES RLS UNTUK PROMOS & RETURNS
-- ==============================================================================
ALTER TABLE IF EXISTS public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to promos" ON public.promos;
DROP POLICY IF EXISTS "Allow authenticated full access to promos" ON public.promos;
DROP POLICY IF EXISTS "Allow all for promos" ON public.promos;

CREATE POLICY "Allow public read access to promos" ON public.promos FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to promos" ON public.promos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for promos" ON public.promos FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to returns" ON public.returns;
DROP POLICY IF EXISTS "Allow authenticated full access to returns" ON public.returns;

CREATE POLICY "Allow public read access to returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to returns" ON public.returns FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. RLS & FUNGSI APPROVE SALES & PROFILES DARI ADMIN
-- ==============================================================================
ALTER TABLE IF EXISTS public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for sales" ON public.sales;
CREATE POLICY "Allow all for sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;
CREATE POLICY "Allow all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.admin_approve_sales_account(
  p_sales_id uuid,
  p_profile_id uuid,
  p_status text DEFAULT 'ACTIVE',
  p_role text DEFAULT 'SALES'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_sales_id IS NOT NULL THEN
    UPDATE public.sales
    SET status = p_status
    WHERE id = p_sales_id;
  END IF;

  IF p_profile_id IS NOT NULL THEN
    UPDATE public.sales
    SET status = p_status
    WHERE profile_id = p_profile_id;

    UPDATE public.profiles
    SET approval_status = CASE WHEN p_status = 'ACTIVE' THEN 'APPROVED' ELSE 'PENDING' END,
        role = upper(p_role)
    WHERE id = p_profile_id;
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_sales_account TO anon, authenticated, service_role;

-- Bersihkan data duplikat sales jika ada, sisakan 1 record teraktif per profile_id
DELETE FROM public.sales s1
WHERE s1.id NOT IN (
  SELECT DISTINCT ON (profile_id) id
  FROM public.sales
  ORDER BY profile_id, (status = 'ACTIVE') DESC, created_at DESC
);


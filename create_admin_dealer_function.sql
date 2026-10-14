-- ==============================================================================
-- FUNGSI DAFTARKAN AKUN DEALER DARI ADMIN PANEL (BYPASS EMAIL RATE LIMIT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_create_dealer_account(
  p_store_name text,
  p_owner_name text,
  p_phone_number text,
  p_email text,
  p_password text,
  p_region_id uuid,
  p_sales_id uuid DEFAULT NULL,
  p_address text DEFAULT '',
  p_ktp_url text DEFAULT NULL,
  p_npwp_url text DEFAULT NULL,
  p_credit_limit numeric DEFAULT 0,
  p_is_credit_eligible boolean DEFAULT false,
  p_credit_term_days integer DEFAULT 15,
  p_is_special_dealer boolean DEFAULT false,
  p_special_tier text DEFAULT 'REGULAR',
  p_special_discount numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  v_email text;
  v_clean_phone text;
  new_dealer_id uuid;
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
    v_email := v_clean_phone || '@b2b-app.local';
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
        is_super_admin,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
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
        json_build_object('role', 'DEALER', 'full_name', p_owner_name, 'phone_number', v_clean_phone, 'store_name', p_store_name)::jsonb,
        FALSE,
        '',
        '',
        '',
        ''
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

  -- 4. Upsert Profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
    UPDATE public.profiles
    SET role = 'DEALER',
        full_name = p_owner_name,
        phone_number = v_clean_phone,
        company_name = p_store_name,
        address = COALESCE(p_address, address),
        approval_status = 'APPROVED',
        ktp_url = COALESCE(p_ktp_url, ktp_url),
        npwp_url = COALESCE(p_npwp_url, npwp_url)
    WHERE id = new_user_id;
  ELSE
    INSERT INTO public.profiles (
      id,
      role,
      full_name,
      phone_number,
      company_name,
      address,
      approval_status,
      ktp_url,
      npwp_url,
      created_at
    )
    VALUES (
      new_user_id,
      'DEALER',
      p_owner_name,
      v_clean_phone,
      p_store_name,
      COALESCE(p_address, ''),
      'APPROVED',
      p_ktp_url,
      p_npwp_url,
      now()
    );
  END IF;

  -- 5. Upsert Dealer Record
  SELECT id INTO new_dealer_id FROM public.dealers WHERE profile_id = new_user_id LIMIT 1;

  IF new_dealer_id IS NOT NULL THEN
    UPDATE public.dealers
    SET store_name = p_store_name,
        region_id = p_region_id,
        sales_id = p_sales_id,
        address = COALESCE(p_address, address),
        credit_limit = CASE WHEN p_is_credit_eligible THEN p_credit_limit ELSE 0 END,
        is_credit_eligible = p_is_credit_eligible,
        credit_status = CASE WHEN p_is_credit_eligible THEN 'ACTIVE' ELSE 'DISABLED' END,
        credit_term_days = p_credit_term_days,
        is_special_dealer = p_is_special_dealer,
        special_dealer_tier = CASE WHEN p_is_special_dealer THEN p_special_tier ELSE 'REGULAR' END,
        special_discount_percentage = CASE WHEN p_is_special_dealer THEN p_special_discount ELSE 0 END,
        status = 'ACTIVE'
    WHERE id = new_dealer_id;
  ELSE
    INSERT INTO public.dealers (
      profile_id,
      store_name,
      region_id,
      sales_id,
      address,
      credit_limit,
      is_credit_eligible,
      credit_status,
      credit_term_days,
      is_special_dealer,
      special_dealer_tier,
      special_discount_percentage,
      status,
      created_at
    )
    VALUES (
      new_user_id,
      p_store_name,
      p_region_id,
      p_sales_id,
      COALESCE(p_address, ''),
      CASE WHEN p_is_credit_eligible THEN p_credit_limit ELSE 0 END,
      p_is_credit_eligible,
      CASE WHEN p_is_credit_eligible THEN 'ACTIVE' ELSE 'DISABLED' END,
      p_credit_term_days,
      p_is_special_dealer,
      CASE WHEN p_is_special_dealer THEN p_special_tier ELSE 'REGULAR' END,
      CASE WHEN p_is_special_dealer THEN p_special_discount ELSE 0 END,
      'ACTIVE',
      now()
    )
    RETURNING id INTO new_dealer_id;
  END IF;

  -- 6. Insert initial credit limit log if applicable
  IF p_is_credit_eligible AND p_credit_limit > 0 THEN
    INSERT INTO public.credit_limit_logs (
      dealer_id,
      action,
      amount_changed,
      previous_limit,
      current_limit,
      notes,
      changed_by
    )
    VALUES (
      new_dealer_id,
      'SET',
      p_credit_limit,
      0,
      p_credit_limit,
      'Plafon awal saat pendaftaran manual dealer oleh admin',
      'Admin Panel'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'dealer_id', new_dealer_id,
    'email', v_email,
    'role', 'DEALER'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Beri izin akses pemanggilan RPC
GRANT EXECUTE ON FUNCTION public.admin_create_dealer_account TO anon, authenticated, service_role;

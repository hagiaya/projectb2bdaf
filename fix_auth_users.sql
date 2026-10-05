-- Fix existing corrupted auth.users rows that were manually inserted
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '');

-- Update the RPC to use '' instead of NULL for tokens if it inserts manually
-- But actually, we should modify the admin_create_sales_account to include these
CREATE OR REPLACE FUNCTION public.admin_create_sales_account(
  p_full_name text,
  p_phone_number text,
  p_email text,
  p_password text,
  p_role text,
  p_region_id uuid DEFAULT NULL,
  p_spv_id uuid DEFAULT NULL,
  p_base_salary numeric DEFAULT 0,
  p_direct_commission_pct numeric DEFAULT 0,
  p_team_bonus_pct numeric DEFAULT 0,
  p_transport_allowance numeric DEFAULT 0,
  p_daily_visit_target integer DEFAULT 6,
  p_work_days_per_month integer DEFAULT 26
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_clean_phone text;
  v_email text;
  v_is_spv boolean;
  new_sales_id uuid;
BEGIN
  v_clean_phone := regexp_replace(p_phone_number, '\D', '', 'g');
  IF v_clean_phone LIKE '62%' THEN v_clean_phone := '0' || substring(v_clean_phone from 3); END IF;
  IF NOT v_clean_phone LIKE '0%' THEN v_clean_phone := '0' || v_clean_phone; END IF;

  IF p_email IS NOT NULL AND trim(p_email) != '' THEN v_email := lower(trim(p_email));
  ELSE v_email := v_clean_phone || '@sales.b2b.app'; END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone_number = v_clean_phone) THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE phone_number = v_clean_phone LIMIT 1;
  ELSE
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;
    ELSE
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
        confirmation_token, recovery_token, email_change_token_new, email_change
      )
      VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        v_email, crypt(p_password, gen_salt('bf')), now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('role', upper(p_role), 'full_name', p_full_name, 'phone_number', v_clean_phone)::jsonb,
        FALSE,
        '', '', '', ''
      );

      INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, id)
      VALUES (v_user_id::text, v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb, 'email', now(), now(), gen_random_uuid());
    END IF;
  END IF;

  v_is_spv := (upper(p_role) = 'SPV');

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles SET role = upper(p_role), full_name = p_full_name, phone_number = v_clean_phone, approval_status = 'APPROVED' WHERE id = v_user_id;
  ELSE
    INSERT INTO public.profiles (id, role, full_name, phone_number, approval_status, created_at)
    VALUES (v_user_id, upper(p_role), p_full_name, v_clean_phone, 'APPROVED', now());
  END IF;

  SELECT id INTO new_sales_id FROM public.sales WHERE profile_id = v_user_id LIMIT 1;

  IF new_sales_id IS NOT NULL THEN
    UPDATE public.sales
    SET region_id = p_region_id, spv_id = CASE WHEN v_is_spv THEN NULL ELSE p_spv_id END, status = 'ACTIVE', is_spv = v_is_spv,
        base_salary = CASE WHEN v_is_spv THEN 0 ELSE p_base_salary END, direct_commission_pct = p_direct_commission_pct,
        team_bonus_pct = p_team_bonus_pct, transport_allowance = CASE WHEN v_is_spv THEN 0 ELSE p_transport_allowance END,
        daily_visit_target = CASE WHEN v_is_spv THEN 0 ELSE p_daily_visit_target END, work_days_per_month = CASE WHEN v_is_spv THEN 0 ELSE p_work_days_per_month END
    WHERE id = new_sales_id;
  ELSE
    INSERT INTO public.sales (profile_id, region_id, spv_id, status, is_spv, base_salary, direct_commission_pct, team_bonus_pct, transport_allowance, daily_visit_target, work_days_per_month, balance, created_at)
    VALUES (v_user_id, p_region_id, CASE WHEN v_is_spv THEN NULL ELSE p_spv_id END, 'ACTIVE', v_is_spv, CASE WHEN v_is_spv THEN 0 ELSE p_base_salary END, p_direct_commission_pct, p_team_bonus_pct, CASE WHEN v_is_spv THEN 0 ELSE p_transport_allowance END, CASE WHEN v_is_spv THEN 0 ELSE p_daily_visit_target END, CASE WHEN v_is_spv THEN 0 ELSE p_work_days_per_month END, 0, now())
    RETURNING id INTO new_sales_id;
  END IF;

  RETURN json_build_object('success', true, 'user_id', v_user_id, 'sales_id', new_sales_id, 'email', v_email, 'role', upper(p_role));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Script to Create Demo Sales Account
-- Copy and run this in Supabase SQL Editor

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  demo_phone text := '081234567890';
  demo_email text := '081234567890@sales.b2b.app';
  demo_pass text := 'password123';
BEGIN
  -- 1. Insert into auth.users (Supabase Authentication)
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
    phone
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    demo_email,
    crypt(demo_pass, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    NULL
  );

  -- 2. Insert into auth.identities
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
    format('{"sub":"%s","email":"%s"}', new_user_id::text, demo_email)::jsonb,
    'email',
    now(),
    now(),
    gen_random_uuid()
  );

  -- 3. Insert into public.profiles (Application Profile)
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    role,
    approval_status
  )
  VALUES (
    new_user_id,
    'Demo Sales',
    demo_phone,
    'SALES',
    'APPROVED'
  );

  -- 4. Insert into public.sales (Sales Specific Data)
  INSERT INTO public.sales (
    profile_id,
    ktp_number,
    status
  )
  VALUES (
    new_user_id,
    '1234567890123456',
    'ACTIVE'
  );

END $$;

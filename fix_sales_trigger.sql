CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert ke tabel profiles
  INSERT INTO public.profiles (id, role, full_name, phone_number, approval_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'DEALER'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    'PENDING'
  );

  -- Jika role-nya DEALER, insert juga ke tabel dealers
  IF new.raw_user_meta_data->>'role' = 'DEALER' OR new.raw_user_meta_data->>'role' IS NULL THEN
    INSERT INTO public.dealers (
        profile_id, 
        store_name, 
        address, 
        latitude, 
        longitude, 
        status, 
        ktp_url, 
        npwp_url
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'store_name',
      new.raw_user_meta_data->>'address',
      NULLIF(new.raw_user_meta_data->>'lat', '')::numeric,
      NULLIF(new.raw_user_meta_data->>'lng', '')::numeric,
      'PENDING',
      new.raw_user_meta_data->>'ktp_url',
      new.raw_user_meta_data->>'npwp_url'
    );
  END IF;

  -- Jika role-nya SALES, insert ke tabel sales
  IF new.raw_user_meta_data->>'role' = 'SALES' THEN
    INSERT INTO public.sales (
        profile_id,
        ktp_number,
        status
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'ktp_number',
      'PENDING'
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

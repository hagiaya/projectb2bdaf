-- 1. Tambahkan kolom city_name dan district_name ke tabel regions jika belum ada
ALTER TABLE public.regions
ADD COLUMN IF NOT EXISTS city_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);

-- 2. Buat fungsi RPC untuk mengupdate profil dan password personil
CREATE OR REPLACE FUNCTION public.admin_update_sales_profile(
  p_profile_id uuid,
  p_full_name text,
  p_phone_number text,
  p_password text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Update nama dan nomor telepon di tabel profiles
  -- (Kolom updated_at dihilangkan karena tidak semua skema profiles memilikinya)
  UPDATE public.profiles
  SET full_name = p_full_name,
      phone_number = p_phone_number
  WHERE id = p_profile_id;

  -- Jika password diisi, update password di auth.users (TIDAK PERLU Service Role Key)
  IF p_password IS NOT NULL AND p_password != '' THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_profile_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

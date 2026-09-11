-- Function to check user role securely bypassing RLS
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.check_user_role(p_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS and run with admin privileges
AS $$
DECLARE
  v_role text;
  v_approval_status text;
BEGIN
  SELECT role, approval_status INTO v_role, v_approval_status
  FROM public.profiles
  WHERE phone_number = p_phone
  LIMIT 1;
  
  IF v_role IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN json_build_object(
    'role', v_role, 
    'approval_status', v_approval_status
  );
END;
$$;

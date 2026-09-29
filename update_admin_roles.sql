-- update_admin_roles.sql
-- Menambahkan role SUPER_ADMIN ke dalam ENUM user_role (jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'SUPER_ADMIN') THEN
        ALTER TYPE public.user_role ADD VALUE 'SUPER_ADMIN';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Mengubah seluruh pengguna yang saat ini berstatus ADMIN menjadi SUPER_ADMIN
UPDATE public.profiles
SET role = 'SUPER_ADMIN'
WHERE role = 'ADMIN';

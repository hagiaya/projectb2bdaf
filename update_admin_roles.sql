-- Perintah ini akan memastikan bahwa profil Admin dibuat secara paksa dan dihubungkan ke email Anda.
-- Berguna jika akun baru tersebut tidak sengaja terhapus profilnya atau profil gagal dibuat otomatis.

INSERT INTO public.profiles (id, full_name, role)
SELECT id, 'Admin Operasional (DAP)', 'ADMIN'
FROM auth.users 
WHERE email = 'admin@dap.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'ADMIN', full_name = 'Admin Operasional (DAP)';

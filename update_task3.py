import re

with open('/Users/rezalatandrang/.gemini/antigravity-ide/brain/b7f31e2d-c93c-4866-8068-f0846b0845c5/task.md', 'r') as f:
    content = f.read()

content = content.replace("- [ ] Install expo-location", "- [x] Install expo-location")
content = content.replace("- [ ] Tambah toggle tipe akun (Personal / Perusahaan) di register.tsx", "- [x] Tambah toggle tipe akun (Personal / Perusahaan) di register.tsx")
content = content.replace("- [ ] Update validasi NPWP berdasarkan tipe akun", "- [x] Update validasi NPWP berdasarkan tipe akun")
content = content.replace("- [ ] Tambah tombol Deteksi Lokasi Otomatis", "- [x] Tambah tombol Deteksi Lokasi Otomatis")

with open('/Users/rezalatandrang/.gemini/antigravity-ide/brain/b7f31e2d-c93c-4866-8068-f0846b0845c5/task.md', 'w') as f:
    f.write(content)

import re

with open('/Users/rezalatandrang/.gemini/antigravity-ide/brain/b7f31e2d-c93c-4866-8068-f0846b0845c5/task.md', 'r') as f:
    content = f.read()

content += "\n\n## Form Registrasi & Auto Lokasi\n"
content += "- [ ] Install expo-location\n"
content += "- [ ] Tambah toggle tipe akun (Personal / Perusahaan) di register.tsx\n"
content += "- [ ] Update validasi NPWP berdasarkan tipe akun\n"
content += "- [ ] Tambah tombol Deteksi Lokasi Otomatis\n"

with open('/Users/rezalatandrang/.gemini/antigravity-ide/brain/b7f31e2d-c93c-4866-8068-f0846b0845c5/task.md', 'w') as f:
    f.write(content)

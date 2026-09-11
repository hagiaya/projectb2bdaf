import re

with open('/Users/rezalatandrang/.gemini/antigravity-ide/brain/b7f31e2d-c93c-4866-8068-f0846b0845c5/task.md', 'r') as f:
    content = f.read()

content = content.replace("- [ ] Hapus tulisan NEW pada produk dan ubah menjadi label UI", "- [x] Hapus tulisan NEW pada produk dan ubah menjadi label UI")
content = content.replace("- [ ] Pastikan wishlist menggunakan real data (cek harga & stok terbaru)", "- [x] Pastikan wishlist menggunakan real data (cek harga & stok terbaru)")

with open('/Users/rezalatandrang/.gemini/antigravity-ide/brain/b7f31e2d-c93c-4866-8068-f0846b0845c5/task.md', 'w') as f:
    f.write(content)

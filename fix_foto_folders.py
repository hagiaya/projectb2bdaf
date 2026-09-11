import os
import shutil

# Folder utama
base_dir = "foto_produk"
# Folder 'FOTO PRODUK' yang ada di dalamnya
sub_dir = os.path.join(base_dir, "FOTO PRODUK")

if os.path.exists(sub_dir):
    print(f"Memindahkan folder-folder SKU dari '{sub_dir}' ke '{base_dir}'...")
    
    # Ambil semua folder SKU di dalam 'FOTO PRODUK'
    for item in os.listdir(sub_dir):
        src = os.path.join(sub_dir, item)
        dst = os.path.join(base_dir, item)
        
        # Pindahkan jika belum ada
        if not os.path.exists(dst):
            shutil.move(src, dst)
            print(f"Memindahkan: {item}")
        else:
            print(f"Melewati {item} karena sudah ada di folder tujuan.")
            
    # Hapus folder 'FOTO PRODUK' yang sudah kosong
    try:
        os.rmdir(sub_dir)
        print("\nFolder 'FOTO PRODUK' yang kosong telah dihapus.")
    except OSError:
        print("\nFolder 'FOTO PRODUK' tidak bisa dihapus (mungkin masih ada file tersisa).")
        
    print("\nSelesai! Semua folder SKU sekarang berada langsung di dalam 'foto_produk/'.")
else:
    print(f"Folder '{sub_dir}' tidak ditemukan. Mungkin sudah dipindahkan?")

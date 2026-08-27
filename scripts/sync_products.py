import os
import sys
import pandas as pd
from supabase import create_client, Client
import math

# Pastikan Anda mengatur variabel environment ini, atau isi langsung (TIDAK DISARANKAN untuk production)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://rbezcgrxokzhtslrxuta.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZXpjZ3J4b2t6aHRzbHJ4dXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTkxODksImV4cCI6MjEwMTY3NTE4OX0.y6QCTPMsFnWHX5jxt4C0xXmIHoRUS4sMA6eI2_GSrSI") 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Folder tempat foto diekstrak
PHOTOS_DIR = "../FOTO PRODUK"
PRICELIST_FILE = "../Daftar_Produk_DAP_08-08-2026.xlsx"

def upload_image_to_storage(file_path, product_code, filename):
    bucket_name = 'product-images'
    storage_path = f"{product_code}/{filename}"
    
    try:
        with open(file_path, 'rb') as f:
            # Upload to supabase storage
            res = supabase.storage.from_(bucket_name).upload(
                file=f,
                path=storage_path,
                file_options={"cacheControl": "3600", "upsert": "true"}
            )
            # Get public URL
            public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
            return public_url
    except Exception as e:
        print(f"Gagal mengunggah {file_path}: {e}")
        return None

def main():
    if not os.path.exists(PRICELIST_FILE):
        print(f"File {PRICELIST_FILE} tidak ditemukan!")
        return
        
    if not os.path.exists(PHOTOS_DIR):
        print(f"Folder {PHOTOS_DIR} tidak ditemukan! Silakan ekstrak file ZIP dari Google Drive ke folder ini.")
        return

    print("Membaca file Excel...")
    try:
        df = pd.read_excel(PRICELIST_FILE)
    except Exception as e:
        print(f"Error membaca excel: {e}. Pastikan file tersebut berformat .xlsx atau .csv (gunakan pd.read_csv)")
        return
        
    print(f"Berhasil membaca {len(df)} baris data produk.")

    # Ambil semua data produk yang ada di database
    db_products = supabase.table('products').select('*').execute()
    db_products_map = {p['sku']: p for p in db_products.data} if db_products.data else {}

    for index, row in df.iterrows():
        sku = str(row.get('Kode/Nama Produk', '')).strip()
        name = str(row.get('Keterangan', str(row.get('Kode/Nama Produk', '')))).strip()
        price = row.get('Harga', 0)
        
        if pd.isna(price) or not sku:
            continue
            
        print(f"Memproses {sku} - {name}...")
        
        # Cari folder foto untuk SKU ini secara rekursif
        product_photo_folder = None
        for root, dirs, files in os.walk(PHOTOS_DIR):
            for dir_name in dirs:
                if sku.lower() in dir_name.lower():
                    product_photo_folder = os.path.join(root, dir_name)
                    break
            if product_photo_folder:
                break
                
        image_urls = []
        if product_photo_folder and os.path.isdir(product_photo_folder):
            print(f"  Ditemukan folder foto: {product_photo_folder}")
            for filename in os.listdir(product_photo_folder):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    file_path = os.path.join(product_photo_folder, filename)
                    url = upload_image_to_storage(file_path, sku, filename)
                    if url:
                        image_urls.append(url)
        else:
            print(f"  Peringatan: Folder foto untuk SKU {sku} tidak ditemukan.")
            
        # Update atau insert ke Supabase
        product_data = {
            'sku': sku,
            'name': name,
            'price': float(price),
            'image_urls': image_urls,
            'status': 'ACTIVE'
        }
        
        # Set first image as primary image_url for backwards compatibility
        if image_urls:
            product_data['image_url'] = image_urls[0]

        try:
            if sku in db_products_map:
                # Update
                supabase.table('products').update(product_data).eq('sku', sku).execute()
                print(f"  -> Diperbarui di database.")
            else:
                supabase.table('products').insert(product_data).execute()
                print(f"  -> Ditambahkan ke database.")
        except Exception as e:
            print(f"  Error menyimpan {sku}: {e}")

    print("Sinkronisasi selesai!")

if __name__ == "__main__":
    main()

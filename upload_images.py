import os
import requests
import json
import glob
import re

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

# 1. Fetch products
res_prod = requests.get(f"{url}/rest/v1/products?select=id,name,sku,image_url", headers=headers)
products = res_prod.json()

base_dir = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/drive_photos/FOTO PRODUK"
folders = os.listdir(base_dir)

def normalize_sku(sku):
    return re.sub(r'[^A-Z0-9]', '', sku.upper())

print(f"Found {len(products)} products in DB.")

for prod in products:
    if prod.get("image_url"):
        print(f"Skipping {prod['sku']} - already has image")
        continue
        
    sku_norm = normalize_sku(prod['sku'])
    if not sku_norm:
        continue
        
    # Find matching folder
    matched_folder = None
    for folder in folders:
        folder_path = os.path.join(base_dir, folder)
        if not os.path.isdir(folder_path): continue
        
        # Check if sku_norm is in the normalized folder name
        # Folder might be "D-S02", "D-S03,S04,S05"
        folder_norm = normalize_sku(folder)
        if sku_norm in folder_norm or sku_norm in folder.replace('-', '').replace(' ', '').upper():
            matched_folder = folder_path
            break
            
    if matched_folder:
        # Get first image
        images = [f for f in os.listdir(matched_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if images:
            images.sort()
            img_path = os.path.join(matched_folder, images[0])
            img_name = f"{sku_norm}.jpg"
            
            # Upload to Supabase Storage
            with open(img_path, 'rb') as f:
                upload_res = requests.post(
                    f"{url}/storage/v1/object/product-images/{img_name}",
                    headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "image/jpeg"},
                    data=f
                )
            
            if upload_res.status_code in [200, 201] or "duplicate" in upload_res.text:
                # Update product URL
                public_url = f"{url}/storage/v1/object/public/product-images/{img_name}"
                patch_res = requests.patch(
                    f"{url}/rest/v1/products?id=eq.{prod['id']}", 
                    headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                    json={"image_url": public_url, "image_urls": [public_url]}
                )
                if patch_res.status_code in [200, 204]:
                    print(f"Uploaded and linked image for {prod['sku']}")
                else:
                    print(f"Failed to link DB for {prod['sku']}")
            else:
                print(f"Failed to upload image for {prod['sku']}: {upload_res.text}")
        else:
            print(f"No images found in folder {matched_folder} for SKU {prod['sku']}")
    else:
        print(f"No matching folder for SKU {prod['sku']}")

print("Image upload complete!")

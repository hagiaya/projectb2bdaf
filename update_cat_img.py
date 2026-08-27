import os
import requests

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Fetch all products with images
res = requests.get(f"{url}/rest/v1/products?select=category_id,image_url&image_url=not.is.null", headers=headers)
prods = res.json()

# Map category_id -> first image_url found
cat_images = {}
for p in prods:
    cid = p.get('category_id')
    img = p.get('image_url')
    if cid and img and cid not in cat_images:
        cat_images[cid] = img

# Update categories
for cid, img in cat_images.items():
    requests.patch(f"{url}/rest/v1/categories?id=eq.{cid}", headers=headers, json={"image_url": img})

print(f"Updated images for {len(cat_images)} categories!")

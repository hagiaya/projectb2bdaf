import os
import csv
import json
import requests
import re

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

CSV_PATH = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/pricelist_new.csv"

def title_case(s):
    # Capitalize the first letter of each word (like Title Case)
    return " ".join([word.capitalize() for word in s.split()])

# 1. Read CSV
rows = []
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

print(f"Read {len(rows)} rows from CSV.")

# 2. Get existing categories
res_cat = requests.get(f"{url}/rest/v1/categories?select=id,name", headers=headers)
categories = {c['name'].lower().strip(): c['id'] for c in res_cat.json()}

# 3. Create missing categories
for row in rows:
    cat_name_raw = row.get("KATEGORI", "").strip()
    if not cat_name_raw:
        continue
    
    # Let's standardize the name to Title Case
    cat_name = title_case(cat_name_raw)
    cat_key = cat_name.lower()
    
    if cat_key not in categories:
        print(f"Creating new category: {cat_name}")
        post_res = requests.post(
            f"{url}/rest/v1/categories",
            headers={**headers, "Prefer": "return=representation"},
            json={"name": cat_name}
        )
        if post_res.status_code in [200, 201]:
            new_cat = post_res.json()[0]
            categories[cat_key] = new_cat['id']
        else:
            print(f"Failed to create category {cat_name}: {post_res.text}")

# 4. Get existing products
res_prod = requests.get(f"{url}/rest/v1/products?select=id,sku", headers=headers)
existing_products = {p['sku'].strip().upper(): p['id'] for p in res_prod.json() if p.get('sku')}

# 5. Upsert products
updates = []
inserts = []

for row in rows:
    cat_name_raw = row.get("KATEGORI", "").strip()
    sku = row.get("KODE", "").strip().upper()
    price_str = row.get("HARGA", "0").replace(".", "").replace(",", "").strip()
    unit = row.get("SATUAN", "").strip()
    name = row.get("KETERANGAN", "").strip()
    
    if not sku:
        continue
        
    try:
        price = float(price_str)
    except:
        price = 0
        
    cat_id = None
    if cat_name_raw:
        cat_key = title_case(cat_name_raw).lower()
        cat_id = categories.get(cat_key)
        
    prod_data = {
        "sku": sku,
        "name": name,
        "price": price,
        "category_id": cat_id
    }
    
    if sku in existing_products:
        prod_data["id"] = existing_products[sku]
        updates.append(prod_data)
    else:
        prod_data["stock"] = 3 # Default stock for new products
        inserts.append(prod_data)

print(f"Preparing to update {len(updates)} products and insert {len(inserts)} products.")

# Perform Inserts (bulk)
if inserts:
    res = requests.post(f"{url}/rest/v1/products", headers=headers, json=inserts)
    if res.status_code in [200, 201]:
        print("Successfully inserted new products.")
    else:
        print(f"Error inserting products: {res.text}")

# Perform Updates (Supabase bulk update requires upsert)
if updates:
    headers_upsert = {**headers, "Prefer": "resolution=merge-duplicates"}
    # Supabase allows upserting by primary key (id)
    res = requests.post(f"{url}/rest/v1/products", headers=headers_upsert, json=updates)
    if res.status_code in [200, 201, 204]:
        print("Successfully updated existing products.")
    else:
        print(f"Error updating products: {res.text}")

print("Sync completed!")

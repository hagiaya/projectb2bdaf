import os
import requests

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Define categories to create
categories = [
    "KABEL DATA",
    "ADAPTOR CHARGER",
    "CHARGER SET",
    "MOUSE PAD",
    "AKSESORIS LAINNYA"
]

cat_ids = {}

# 1. Create categories
for cat in categories:
    res = requests.post(f"{url}/rest/v1/categories", headers=headers, json={"name": cat, "description": cat})
    if res.status_code in [200, 201]:
        cat_ids[cat] = res.json()[0]["id"]
        print(f"Created category: {cat}")
    else:
        # If exists, fetch it
        res_exist = requests.get(f"{url}/rest/v1/categories?name=eq.{cat}", headers=headers)
        if res_exist.status_code == 200 and len(res_exist.json()) > 0:
            cat_ids[cat] = res_exist.json()[0]["id"]
            print(f"Category {cat} already exists.")

# 2. Fetch all products
res_prod = requests.get(f"{url}/rest/v1/products?select=id,name,sku", headers=headers)
products = res_prod.json()

# 3. Auto categorize
for prod in products:
    name = prod["name"].upper()
    sku = prod["sku"].upper()
    
    cat_to_assign = "AKSESORIS LAINNYA"
    
    if "MICRO" in name or "TYPE-C" in name or "LIGHTNING" in name or "CTC" in name or sku.startswith("DN") or sku.startswith("DD") or sku.startswith("DJ"):
        cat_to_assign = "KABEL DATA"
    elif "ADAPTOR" in name or "USB" in name or "20W" in name or "65W" in name or sku.startswith("DA"):
        cat_to_assign = "ADAPTOR CHARGER"
    elif "SET" in name:
        cat_to_assign = "CHARGER SET"
    elif "MOUSE PAD" in name:
        cat_to_assign = "MOUSE PAD"

    # Update product
    cat_id = cat_ids.get(cat_to_assign)
    if cat_id:
        patch_res = requests.patch(
            f"{url}/rest/v1/products?id=eq.{prod['id']}", 
            headers=headers, 
            json={"category_id": cat_id}
        )
        if patch_res.status_code in [200, 204]:
            print(f"Assigned {prod['name']} (SKU: {prod['sku']}) -> {cat_to_assign}")
        else:
            print(f"Failed to assign {prod['name']}: {patch_res.text}")

print("Auto-categorization complete!")

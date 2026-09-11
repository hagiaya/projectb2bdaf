import requests
import json
from datetime import datetime, timezone

url = "https://mvpwgzkvmadtsspewxtu.supabase.co"
key = "sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Fetch all products
res = requests.get(f"{url}/rest/v1/products", headers=headers)
products = res.json()

new_products = []
for p in products:
    name = p.get('name', '') or ''
    sku = p.get('sku', '') or ''
    if "new" in name.lower() or "new" in sku.lower():
        new_products.append(p)

print(f"Found {len(new_products)} products with 'NEW'.")
for p in new_products:
    print(f"- {p['sku']}: {p['name']}")


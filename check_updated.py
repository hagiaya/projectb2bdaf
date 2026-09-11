import requests
import json

url = "https://mvpwgzkvmadtsspewxtu.supabase.co"
key = "sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

res = requests.get(f"{url}/rest/v1/products?created_at=gte.2026-08-28T06:56:00Z", headers=headers)
products = res.json()
print(f"Found {len(products)} products updated recently.")
if len(products) > 0:
    for p in products[:5]:
        print(p['sku'], p['created_at'])

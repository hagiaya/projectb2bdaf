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

print(f"Updating {len(new_products)} products...")
now_iso = datetime.now(timezone.utc).isoformat()

for p in new_products:
    name = p.get('name', '') or ''
    sku = p.get('sku', '') or ''
    
    # Remove " NEW" or "NEW " or "NEW" case insensitively
    # Simple replace is enough since it's exactly " NEW" in most cases, e.g., "DJ03C NEW"
    new_sku = sku.replace(" NEW", "").replace("NEW", "").strip()
    new_name = name.replace(" NEW", "").replace("NEW", "").strip()
    
    patch_res = requests.patch(
        f"{url}/rest/v1/products?id=eq.{p['id']}",
        headers=headers,
        json={
            "sku": new_sku,
            "name": new_name,
            "created_at": now_iso
        }
    )
    if patch_res.status_code in [200, 204]:
        print(f"Updated {sku} -> {new_sku}")
    else:
        print(f"Failed {sku}: {patch_res.text}")

print("Done!")

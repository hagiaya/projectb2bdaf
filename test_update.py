import requests
import json

url = "https://mvpwgzkvmadtsspewxtu.supabase.co"
key = "sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Fetch one product to test
res = requests.get(f"{url}/rest/v1/products?limit=1", headers=headers)
product = res.json()[0]
print("Before:", product['name'])

# Try to update it to the exact same value
patch_res = requests.patch(
    f"{url}/rest/v1/products?id=eq.{product['id']}",
    headers=headers,
    json={"name": product['name']}
)
print("Update status:", patch_res.status_code)
print("Update text:", patch_res.text)

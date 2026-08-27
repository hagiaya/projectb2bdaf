import os
import requests
import json

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Get categories
res_cat = requests.get(f"{url}/rest/v1/categories?select=*", headers=headers)
print("CATEGORIES:")
print(json.dumps(res_cat.json(), indent=2))

# Get products (limit 10)
res_prod = requests.get(f"{url}/rest/v1/products?select=id,name,sku,category_id&limit=20", headers=headers)
print("\nPRODUCTS:")
print(json.dumps(res_prod.json(), indent=2))

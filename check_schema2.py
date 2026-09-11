import requests
import json

url = "https://mvpwgzkvmadtsspewxtu.supabase.co"
key = "sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

res = requests.get(f"{url}/rest/v1/products?limit=1", headers=headers)
print(json.dumps(res.json(), indent=2))

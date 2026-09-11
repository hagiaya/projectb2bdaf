import requests
import json

url = "https://mvpwgzkvmadtsspewxtu.supabase.co"
key = "sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

res = requests.get(f"{url}/rest/v1/profiles?limit=1", headers=headers)
print("Profiles schema:", list(res.json()[0].keys()) if res.json() else "empty")

res2 = requests.get(f"{url}/rest/v1/dealers?limit=1", headers=headers)
print("Dealers schema:", list(res2.json()[0].keys()) if res2.json() else "empty")

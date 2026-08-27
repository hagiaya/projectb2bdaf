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

res = requests.get(f"{url}/storage/v1/bucket", headers=headers)
print("BUCKETS:")
print(json.dumps(res.json(), indent=2))

import os
import requests

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
user_id = "6f00338c-e375-4e38-8be8-d98e95926f02"

prof_payload = {
    "id": user_id,
    "role": "DEALER",
    "full_name": "Demo Dealer",
    "phone_number": "081234567890"
}
requests.post(f"{url}/rest/v1/profiles", headers=headers, json=prof_payload)

dealer_payload = {
    "profile_id": user_id,
    "store_name": "Toko Demo B2B",
    "address": "Jl. Demo No. 123",
    "status": "ACTIVE"
}
requests.post(f"{url}/rest/v1/dealers", headers=headers, json=dealer_payload)
print("Selesai insert profil dan dealer")

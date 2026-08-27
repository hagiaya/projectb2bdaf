import os
import requests

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

if not url or not key:
    print("Error: SUPABASE_URL atau SUPABASE_SECRET_KEY tidak ditemukan di environment variables")
    exit(1)

auth_url = f"{url}/auth/v1/admin/users"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
payload = {
    "email": "demo@dealer.com",
    "password": "password123",
    "email_confirm": True,
    "user_metadata": {
        "role": "DEALER",
        "full_name": "Demo Dealer",
        "phone_number": "081234567890",
        "store_name": "Toko Demo B2B"
    }
}

try:
    print("Mencoba membuat user demo...")
    res = requests.post(auth_url, headers=headers, json=payload)
    if res.status_code == 201:
        user_id = res.json().get('id')
        print(f"Berhasil membuat user di Auth. ID: {user_id}")
        
        import time
        time.sleep(2)
        
        res_prof = requests.get(f"{url}/rest/v1/profiles?id=eq.{user_id}", headers=headers)
        if len(res_prof.json()) == 0:
            print("Trigger belum berjalan, memasukkan data secara manual...")
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
            print("Berhasil menyimpan profil dan dealer!")
        else:
            print("Profil otomatis dibuat oleh trigger!")
            
    else:
        print(f"Gagal membuat user: {res.text}")
except Exception as e:
    print(f"Error: {e}")

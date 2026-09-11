import os
import requests
import json

url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL") or "https://mvpwgzkvmadtsspewxtu.supabase.co"
key = os.environ.get("SUPABASE_SECRET_KEY") or "sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj"

# wait, I don't have the secret key for this new project? The anon key is in .env
# Let me read the anon key. If RLS is enabled, maybe I can't update without the service role key.
# But wait, earlier I updated products using a python script `sync_new_pricelist.py`!

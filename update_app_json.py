import json

with open('mobile-app/app.json', 'r') as f:
    app_data = json.load(f)

# Ensure expo-location is in plugins
plugins = app_data.get('expo', {}).get('plugins', [])
has_location = False
for p in plugins:
    if isinstance(p, str) and p == "expo-location":
        has_location = True
    elif isinstance(p, list) and p[0] == "expo-location":
        has_location = True

if not has_location:
    plugins.append([
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Aplikasi ini membutuhkan lokasi Anda untuk menetapkan alamat toko secara akurat."
        }
    ])
    app_data['expo']['plugins'] = plugins

with open('mobile-app/app.json', 'w') as f:
    json.dump(app_data, f, indent=2)


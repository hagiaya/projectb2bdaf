import json

with open('mobile-app/app.json', 'r') as f:
    app_data = json.load(f)

app_data['expo']['slug'] = 'mobile-app'

with open('mobile-app/app.json', 'w') as f:
    json.dump(app_data, f, indent=2)


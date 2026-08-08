import os

target_dir = 'mobile-app/src/app'
replacements = {
    '#16a34a': '#8ec44a', # Primary Green
    '#22c55e': '#8ec44a', # Primary Green Alternative
    '#15803d': '#7eb33a', # Darker green for Free Ongkir etc
    '#14532d': '#4a6b22', # Text dark green
    '#dcfce7': '#f0f7e6', # Light background 1
    '#bbf7d0': '#dcf0c3', # Border light green
    '#f0fdf4': '#f6fbf0', # Background lightest green
}

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            modified = False
            for old, new in replacements.items():
                if old in content:
                    content = content.replace(old, new)
                    modified = True
            
            if modified:
                with open(path, 'w') as f:
                    f.write(content)
                print(f"Updated {path}")

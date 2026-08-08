from PIL import Image
import collections
import os

img_path = '/Users/rezalatandrang/.gemini/antigravity-ide/brain/33dfd2f3-0034-4937-8568-51136f307755/media__1786114301014.png'
out_dir = './mobile-app/assets/'

img = Image.open(img_path).convert('RGB')

# Resize for icon (1024x1024) - padding with black if necessary, or crop to square
w, h = img.size
size = max(w, h)
icon = Image.new('RGB', (size, size), (0, 0, 0)) # black background
icon.paste(img, ((size - w) // 2, (size - h) // 2))
icon = icon.resize((1024, 1024), Image.LANCZOS)
icon.save(os.path.join(out_dir, 'icon.png'))
icon.save(os.path.join(out_dir, 'adaptive-icon.png'))

# Splash screen
splash = Image.new('RGB', (1242, 2436), (0, 0, 0))
# resize img so it fits in the splash screen width or height with some padding
ratio = min(1242 / w, 2436 / h) * 0.5 # use 50% of the screen
new_w, new_h = int(w * ratio), int(h * ratio)
img_resized = img.resize((new_w, new_h), Image.LANCZOS)
splash.paste(img_resized, ((1242 - new_w) // 2, (2436 - new_h) // 2))
splash.save(os.path.join(out_dir, 'splash.png'))

# Find dominant color
colors = img.getcolors(w * h)
# filter out black (or near black) and white
valid_colors = []
for count, (r, g, b) in colors:
    if r > 20 or g > 20 or b > 20:
        valid_colors.append((count, (r, g, b)))

valid_colors.sort(key=lambda x: x[0], reverse=True)
dominant_color = valid_colors[0][1]

hex_color = "#{:02x}{:02x}{:02x}".format(*dominant_color)
print(f"DOMINANT_COLOR={hex_color}")

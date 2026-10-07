import sys
from PIL import Image
from collections import Counter

img = Image.open(sys.argv[1]).convert('RGB')
pixels = list(img.getdata())
# Filter out black/dark pixels
green_pixels = [p for p in pixels if p[1] > 100 and p[0] < p[1] and p[2] < p[1]]
most_common = Counter(green_pixels).most_common(1)
print(most_common)

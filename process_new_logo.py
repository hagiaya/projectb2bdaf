import sys
from PIL import Image

def pad_to_square(image_path, output_path, size, bg_color=(0, 0, 0, 255)):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        width, height = img.size
        
        # Determine the scaling factor to fit the image inside the target size
        # We want to leave some padding around the logo. Let's make the logo take 70% of the square.
        target_content_size = int(size * 0.7)
        scale = min(target_content_size / width, target_content_size / height)
        
        new_w = int(width * scale)
        new_h = int(height * scale)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Create a new square image with the background color
        new_img = Image.new("RGBA", (size, size), bg_color)
        
        # Paste the resized image into the center
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        new_img.paste(img_resized, (offset_x, offset_y), img_resized)
        
        new_img.save(output_path, "PNG")
        print(f"Successfully generated {output_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

if __name__ == "__main__":
    source_img = "/Users/rezalatandrang/.gemini/antigravity-ide/brain/33dfd2f3-0034-4937-8568-51136f307755/media__1786161488864.png"
    assets_dir = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/mobile-app/assets"
    
    pad_to_square(source_img, f"{assets_dir}/icon.png", 1024)
    pad_to_square(source_img, f"{assets_dir}/adaptive-icon.png", 1024)
    pad_to_square(source_img, f"{assets_dir}/splash.png", 2048)

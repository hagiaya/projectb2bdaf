import sys
import shutil
from PIL import Image

def pad_to_square(image_path, output_path, size, bg_color):
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
    source_img = "/Users/rezalatandrang/.gemini/antigravity-ide/brain/2424786f-9153-4066-9928-e20b5c7f7a24/media__1787619697229.png"
    assets_dir = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/mobile-app/assets"
    
    # Get the background color from the top left pixel
    img = Image.open(source_img).convert('RGB')
    bg_color_rgb = img.getpixel((0,0))
    bg_color = (bg_color_rgb[0], bg_color_rgb[1], bg_color_rgb[2], 255)
    print(f"Using background color: {bg_color}")
    
    pad_to_square(source_img, f"{assets_dir}/icon.png", 1024, bg_color)
    pad_to_square(source_img, f"{assets_dir}/adaptive-icon.png", 1024, bg_color)
    pad_to_square(source_img, f"{assets_dir}/splash.png", 2048, bg_color)
    
    # Copy source image to admin-web public folder as well
    admin_logo = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/admin-web/public/logo.png"
    shutil.copy(source_img, admin_logo)
    print(f"Successfully copied source to {admin_logo}")

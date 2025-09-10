import os
from PIL import Image

# Define the image paths
image1_path = r"C:\Users\nismo\Desktop\PanoramaSite\uploads\1\2e8ab158ed85415c958c883ebd27267a_panorama-09.jpg"
image2_path = r"C:\Users\nismo\Desktop\PanoramaSite\uploads\1\b3ba322760454a78b28c9c044fb30de2_panorama-13.jpg"

print("Checking image files...")

# Check if files exist
print(f"Image 1 exists: {os.path.exists(image1_path)}")
print(f"Image 2 exists: {os.path.exists(image2_path)}")

# Try to open and check image 1
try:
    img1 = Image.open(image1_path)
    print(f"Image 1 size: {img1.size}")
    print(f"Image 1 mode: {img1.mode}")
    print("Image 1 loaded successfully")
except Exception as e:
    print(f"Error loading Image 1: {e}")

# Try to open and check image 2
try:
    img2 = Image.open(image2_path)
    print(f"Image 2 size: {img2.size}")
    print(f"Image 2 mode: {img2.mode}")
    print("Image 2 loaded successfully")
except Exception as e:
    print(f"Error loading Image 2: {e}")
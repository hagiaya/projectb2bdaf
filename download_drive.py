import gdown
import os

folder_url = "https://drive.google.com/drive/folders/1CVf0tScJ7vd4kRnHy-p_mpTQvnmDEDwV"
print("Downloading folder...")
# gdown.download_folder returns a list of files downloaded
filenames = gdown.download_folder(url=folder_url, quiet=False, use_cookies=False)

if filenames:
    print(f"Downloaded {len(filenames)} files.")
    print("Sample file:", filenames[0])
else:
    print("No files downloaded.")

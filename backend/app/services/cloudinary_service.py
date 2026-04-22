import os

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


def upload_image(file_obj):
    result = cloudinary.uploader.upload(file_obj, folder="products")
    return result["secure_url"]
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name="ddxe4vrjm",
    api_key="734824412581168",
    api_secret="69hF9q5kRxH4SdUkhVMuz4lpXuk"
)

def upload_image(file):
    result = cloudinary.uploader.upload(file)
    return result["secure_url"]
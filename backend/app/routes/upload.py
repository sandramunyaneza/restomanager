from fastapi import APIRouter, File, UploadFile

from app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/upload-image")
async def upload_image_route(file: UploadFile = File(...)):
    url = upload_image(file.file)
    return {"url": url}

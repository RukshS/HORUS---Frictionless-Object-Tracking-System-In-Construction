from fastapi import APIRouter
from app.detection.video_processor import run_detection

router = APIRouter()

@router.get("/start")
def start_detection():
    run_detection()
    return {"message": "Detection run completed"}

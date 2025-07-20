from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.detection.yolo_reid_stream import generate_camera1_frames, generate_camera2_frames, generate_camera3_frames

router = APIRouter()

@router.get("/video_feed1")
def video_feed():
    return StreamingResponse(
        generate_camera1_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/video_feed2")
def video_feed2():
    return StreamingResponse(
        generate_camera2_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/video_feed3")
def video_feed3():
    return StreamingResponse(
        generate_camera3_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.detection.yolo_reid_stream import (
    generate_camera1_frames, 
    generate_camera2_frames, 
    generate_camera3_frames,
    get_cross_camera_detections,
    stop_all_processing
)

router = APIRouter()

@router.get("/video_feed1")
def video_feed():
    """Stream video feed from camera 1 with parallel processing"""
    return StreamingResponse(
        generate_camera1_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/video_feed2")
def video_feed2():
    """Stream video feed from camera 2 with parallel processing"""
    return StreamingResponse(
        generate_camera2_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/video_feed3")
def video_feed3():
    """Stream video feed from camera 3 with parallel processing"""
    return StreamingResponse(
        generate_camera3_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/cross_camera_detections")
def get_cross_camera_data():
    """Get recent detections from all cameras for cross-camera analysis"""
    return {
        "status": "success",
        "detections": get_cross_camera_detections(),
        "message": "Recent detections from all cameras"
    }

@router.post("/stop_processing")
def stop_processing():
    """Stop all camera processing"""
    stop_all_processing()
    return {
        "status": "success",
        "message": "All camera processing stopped"
    }

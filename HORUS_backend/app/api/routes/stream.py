from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.detection.yolo_reid_stream import (
    generate_camera1_frames, 
    generate_camera2_frames, 
    generate_camera3_frames,
    get_cross_camera_detections,
    get_violation_status,
    get_confirmed_violations_from_db,
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

@router.get("/violation_status")
def get_current_violations():
    """Get current violation status with validation logic"""
    return {
        "status": "success",
        "data": get_violation_status(),
        "message": "Current violation status with frame validation"
    }

@router.get("/confirmed_violations")
def get_confirmed_violations(limit: int = Query(50, ge=1, le=200)):
    """Get confirmed violations from database"""
    violations = get_confirmed_violations_from_db(limit)
    return {
        "status": "success",
        "violations": violations,
        "count": len(violations),
        "message": f"Retrieved {len(violations)} confirmed violations"
    }

@router.post("/stop_processing")
def stop_processing():
    """Stop all camera processing"""
    stop_all_processing()
    return {
        "status": "success",
        "message": "All camera processing stopped"
    }

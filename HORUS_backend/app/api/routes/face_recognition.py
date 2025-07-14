from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from app.api.controllers import FaceRecognitionController

router = APIRouter(prefix="/api/face-recognition", tags=["face recognition"])
face_recognition_controller = FaceRecognitionController()

# Response Models
class RecognizedFace:
    def __init__(self, user_id: Optional[str] = None, name: str = "", type: Optional[str] = None, 
                 confidence: float = 0.0, location: Optional[Dict] = None):
        self.user_id = user_id
        self.name = name
        self.type = type
        self.confidence = confidence
        self.location = location or {"top": 0, "right": 0, "bottom": 0, "left": 0}

# API Endpoints
@router.post("/register-face")
async def register_face(
    org_email: str = Query(..., description="Organization email address"),
    name: str = Query(..., description="Full name of the person"),
    employee_type: str = Query(..., description="Employee type (e.g., Manager, Employee)"),
    file: UploadFile = File(..., description="Image file containing the face to register")
):
    """Register a new face in the system for a specific organization"""
    return await face_recognition_controller.register_face(org_email, name, employee_type, file)

@router.post("/recognize-face")
async def recognize_face(
    org_email: str = Query(..., description="Organization email address"),
    file: UploadFile = File(..., description="Image file to recognize faces in")
):
    """Recognize faces in an uploaded image for a specific organization"""
    return await face_recognition_controller.recognize_face(org_email, file)

@router.post("/mark-attendance")
async def mark_attendance(
    org_email: str = Query(..., description="Organization email address"),
    user_id: str = Query(..., description="User ID to mark attendance for")
):
    """Mark attendance for a user in a specific organization"""
    return await face_recognition_controller.mark_attendance(org_email, user_id)

@router.get("/registered-users")
async def get_registered_users(org_email: str = Query(..., description="Organization email address")):
    """Get all registered users for a specific organization"""
    return await face_recognition_controller.get_registered_users(org_email)

@router.get("/attendance/{date}")
async def get_attendance_by_date(
    date: str,
    org_email: str = Query(..., description="Organization email address")
):
    """Get attendance records for a specific date and organization (YYYY-MM-DD format)"""
    return await face_recognition_controller.get_attendance_by_date(date, org_email)

@router.get("/attendance")
async def get_today_attendance(org_email: str = Query(..., description="Organization email address")):
    """Get attendance records for today for a specific organization"""
    return await face_recognition_controller.get_today_attendance(org_email)

@router.delete("/user/{user_id}")
async def delete_user(
    user_id: str,
    org_email: str = Query(..., description="Organization email address")
):
    """Delete a registered user from a specific organization"""
    return await face_recognition_controller.delete_user(user_id, org_email)

@router.post("/recognize-and-mark-attendance")
async def recognize_and_mark_attendance(
    org_email: str = Query(..., description="Organization email address"),
    file: UploadFile = File(..., description="Image file to recognize and mark attendance")
):
    """Recognize faces and automatically mark attendance for recognized users in a specific organization"""
    return await face_recognition_controller.recognize_and_mark_attendance(org_email, file)

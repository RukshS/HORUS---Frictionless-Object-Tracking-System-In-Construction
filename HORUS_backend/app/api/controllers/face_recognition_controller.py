from fastapi import HTTPException, UploadFile
from typing import Dict, Any, Optional, List
import os
import pickle
import cv2
import face_recognition
import numpy as np
import datetime
import csv
import io
from PIL import Image
import uuid

class FaceRecognitionController:
    """Controller class for handling face recognition operations"""

    def __init__(self):
        self.BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))  # Go to HORUS_backend/
        self.FACERECOGNIZER_DIR = os.path.join(self.BASE_DIR, "app", "facerecognizer")

    def get_organization_paths(self, org_email: str) -> dict:
        """Get organization-specific directory paths based on email"""
        # Sanitize email for use in file paths
        safe_email = org_email.replace("@", "_at_").replace(".", "_dot_").replace("/", "_").replace("\\", "_")
        
        org_dir = os.path.join(self.FACERECOGNIZER_DIR, "organizations", safe_email)
        encodings_dir = os.path.join(org_dir, "encodings")
        attendance_dir = os.path.join(org_dir, "attendance")
        
        # Ensure directories exist
        os.makedirs(encodings_dir, exist_ok=True)
        os.makedirs(attendance_dir, exist_ok=True)
        
        return {
            "org_dir": org_dir,
            "encodings_dir": encodings_dir,
            "attendance_dir": attendance_dir,
            "encodings_file": os.path.join(encodings_dir, "face_encodings.pkl")
        }

    def load_face_database(self, org_email: str) -> Dict[str, Any]:
        """Load the face encodings database for a specific organization"""
        paths = self.get_organization_paths(org_email)
        encodings_file = paths["encodings_file"]
        
        if os.path.exists(encodings_file):
            with open(encodings_file, 'rb') as f:
                database = pickle.load(f)
            
            for user_id in list(database.keys()):
                entry = database[user_id]
                if "encoding" in entry and "encodings" not in entry:
                    database[user_id]["encodings"] = [entry["encoding"]]
                    del database[user_id]["encoding"]
            
            return database
        return {}

    def save_face_database(self, database: Dict[str, Any], org_email: str) -> None:
        """Save the face encodings database for a specific organization"""
        paths = self.get_organization_paths(org_email)
        encodings_file = paths["encodings_file"]
        
        with open(encodings_file, 'wb') as f:
            pickle.dump(database, f)

    def get_attendance_file(self, org_email: str, date: Optional[str] = None) -> str:
        """Get attendance file path for a specific organization and date"""
        if date is None:
            date = datetime.datetime.now().strftime('%Y-%m-%d')
        
        paths = self.get_organization_paths(org_email)
        return os.path.join(paths["attendance_dir"], f"attendance_{date}.csv")

    def process_image_file(self, file: UploadFile) -> np.ndarray:
        """Process uploaded image file and return as numpy array"""
        try:
            # Read image file
            contents = file.file.read()
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(contents))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            
            return image_array
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    def find_best_match(self, face_encoding: np.ndarray, database: Dict[str, Any], tolerance: float = 0.45) -> tuple:
        """Find the best matching user for a face encoding"""
        best_match = None
        min_distance = float('inf')
        
        for user_id, user_data in database.items():
            encodings = user_data.get("encodings", [])
            
            for known_encoding in encodings:
                distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
                if distance < tolerance and distance < min_distance:
                    min_distance = distance
                    best_match = {
                        "user_id": user_id,
                        "name": user_data["name"],
                        "type": user_data["type"],
                        "confidence": 1 - distance,
                        "distance": distance
                    }
        
        return best_match, min_distance

    def is_attendance_marked_today(self, name: str, org_email: str, date: Optional[str] = None) -> bool:
        """Check if attendance is already marked for a user today in the organization"""
        if date is None:
            date = datetime.datetime.now().strftime('%Y-%m-%d')
        
        attendance_file = self.get_attendance_file(org_email, date)
        
        if not os.path.exists(attendance_file):
            return False
        
        try:
            with open(attendance_file, 'r', newline='') as f:
                reader = csv.reader(f)
                next(reader, None)  # Skip header
                for row in reader:
                    if len(row) >= 1 and row[0] == name:
                        return True
        except Exception:
            pass
        
        return False

    async def register_face(self, org_email: str, name: str, employee_type: str, file: UploadFile):
        """Register a new face in the system for a specific organization"""
        
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        try:
            # Process the image
            image_array = self.process_image_file(file)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(image_array)
            
            if len(face_locations) == 0:
                raise HTTPException(status_code=400, detail="No face detected in the image")
            
            if len(face_locations) > 1:
                raise HTTPException(status_code=400, detail="Multiple faces detected. Please use an image with only one face")
            
            # Get face encoding
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            face_encoding = face_encodings[0]
            
            # Load existing database for this organization
            database = self.load_face_database(org_email)
            
            # Check for existing similar face within this organization
            match, distance = self.find_best_match(face_encoding, database, tolerance=0.4)
            if match:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Face already registered for user: {match['name']} (similarity: {match['confidence']:.2f})"
                )
            
            # Generate unique user ID
            user_id = f"{name.replace(' ', '_')}_{len(database) + 1}"
            
            # Add to database
            database[user_id] = {
                "name": name,
                "type": employee_type,
                "encodings": [face_encoding]  # Keep as numpy array for compatibility
            }
            
            # Save database for this organization
            self.save_face_database(database, org_email)
            
            return {
                "message": "Face registered successfully",
                "user_id": user_id,
                "name": name,
                "type": employee_type,
                "organization": org_email
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    async def recognize_face(self, org_email: str, file: UploadFile):
        """Recognize faces in an uploaded image for a specific organization"""
        
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        try:
            # Process the image
            image_array = self.process_image_file(file)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(image_array)
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            # Load database for this organization
            database = self.load_face_database(org_email)
            
            recognized_faces = []
            
            for i, (face_encoding, face_location) in enumerate(zip(face_encodings, face_locations)):
                # Convert face location to the expected format (top, right, bottom, left)
                top, right, bottom, left = face_location
                location = {
                    "top": int(top),
                    "right": int(right),
                    "bottom": int(bottom),
                    "left": int(left)
                }
                
                # Find matching user within this organization
                match, distance = self.find_best_match(face_encoding, database)
                
                if match:
                    recognized_faces.append({
                        "user_id": match["user_id"],
                        "name": match["name"],
                        "type": match["type"],
                        "confidence": float(match["confidence"]),
                        "location": location
                    })
                else:
                    recognized_faces.append({
                        "user_id": None,
                        "name": "Unknown",
                        "type": None,
                        "confidence": 0.0,
                        "location": location
                    })
            
            return {
                "faces_detected": len(face_locations),
                "recognized_faces": recognized_faces,
                "organization": org_email,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")

    async def mark_attendance(self, org_email: str, user_id: str):
        """Mark attendance for a user in a specific organization"""
        
        try:
            # Load database for this organization
            database = self.load_face_database(org_email)
            
            if user_id not in database:
                raise HTTPException(status_code=404, detail="User not found in this organization")
            
            user = database[user_id]
            name = user["name"]
            emp_type = user["type"]
            timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            today = datetime.datetime.now().strftime('%Y-%m-%d')
            
            # Check if already marked today for this organization
            if self.is_attendance_marked_today(name, org_email, today):
                return {
                    "message": "Attendance already marked for today",
                    "user_id": user_id,
                    "name": name,
                    "type": emp_type,
                    "organization": org_email,
                    "already_marked": True
                }
            
            # Get attendance file for today for this organization
            attendance_file = self.get_attendance_file(org_email, today)
            
            # Create file with headers if it doesn't exist
            if not os.path.exists(attendance_file):
                with open(attendance_file, 'w', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow(["Name", "Type", "Timestamp"])
            
            # Mark attendance
            with open(attendance_file, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([name, emp_type, timestamp])
            
            return {
                "message": "Attendance marked successfully",
                "user_id": user_id,
                "name": name,
                "type": emp_type,
                "organization": org_email,
                "timestamp": timestamp,
                "already_marked": False
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to mark attendance: {str(e)}")

    async def get_registered_users(self, org_email: str):
        """Get all registered users for a specific organization"""
        
        try:
            database = self.load_face_database(org_email)
            
            users = []
            for user_id, user_data in database.items():
                encodings_count = len(user_data.get("encodings", []))
                users.append({
                    "user_id": user_id,
                    "name": user_data["name"],
                    "type": user_data["type"],
                    "encodings_count": encodings_count
                })
                
            return {
                "total_users": len(users),
                "users": users,
                "organization": org_email
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

    async def get_attendance_by_date(self, date: str, org_email: str):
        """Get attendance records for a specific date and organization (YYYY-MM-DD format)"""
        
        try:
            # Validate date format
            try:
                datetime.datetime.strptime(date, '%Y-%m-%d')
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
            attendance_file = self.get_attendance_file(org_email, date)
            
            if not os.path.exists(attendance_file):
                return {
                    "date": date,
                    "total_attendance": 0,
                    "records": [],
                    "organization": org_email
                }
            
            records = []
            try:
                with open(attendance_file, 'r', newline='') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        records.append({
                            "name": row.get("Name", ""),
                            "type": row.get("Type", ""),
                            "timestamp": row.get("Timestamp", "")
                        })
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error reading attendance file: {str(e)}")
            
            return {
                "date": date,
                "total_attendance": len(records),
                "records": records,
                "organization": org_email
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch attendance: {str(e)}")

    async def get_today_attendance(self, org_email: str):
        """Get attendance records for today for a specific organization"""
        
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        return await self.get_attendance_by_date(today, org_email)

    async def delete_user(self, user_id: str, org_email: str):
        """Delete a registered user from a specific organization"""
        
        try:
            database = self.load_face_database(org_email)
            
            if user_id not in database:
                raise HTTPException(status_code=404, detail="User not found in this organization")
            
            deleted_user_name = database[user_id]["name"]
            
            # Remove user from database
            del database[user_id]
            
            # Save updated database for this organization
            self.save_face_database(database, org_email)
            
            return {
                "message": "User deleted successfully",
                "user_id": user_id,
                "deleted_user": deleted_user_name,
                "organization": org_email
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

    async def recognize_and_mark_attendance(self, org_email: str, file: UploadFile):
        """Recognize faces and automatically mark attendance for recognized users in a specific organization"""
        
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        try:
            # Process the image
            image_array = self.process_image_file(file)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(image_array)
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            # Load database for this organization
            database = self.load_face_database(org_email)
            
            results = []
            
            for face_encoding, face_location in zip(face_encodings, face_locations):
                top, right, bottom, left = face_location
                location = {
                    "top": int(top),
                    "right": int(right),
                    "bottom": int(bottom),
                    "left": int(left)
                }
                
                # Find matching user within this organization
                match, distance = self.find_best_match(face_encoding, database)
                
                if match:
                    user_id = match["user_id"]
                    name = match["name"]
                    emp_type = match["type"]
                    
                    # Check if attendance already marked for this organization
                    already_marked = self.is_attendance_marked_today(name, org_email)
                    
                    attendance_result = {
                        "user_id": user_id,
                        "name": name,
                        "type": emp_type,
                        "confidence": float(match["confidence"]),
                        "location": location,
                        "attendance_marked": False,
                        "already_marked": already_marked,
                        "message": ""
                    }
                    
                    if not already_marked:
                        # Mark attendance for this organization
                        try:
                            timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                            today = datetime.datetime.now().strftime('%Y-%m-%d')
                            attendance_file = self.get_attendance_file(org_email, today)
                            
                            # Create file with headers if it doesn't exist
                            if not os.path.exists(attendance_file):
                                with open(attendance_file, 'w', newline='') as f:
                                    writer = csv.writer(f)
                                    writer.writerow(["Name", "Type", "Timestamp"])
                            
                            # Mark attendance
                            with open(attendance_file, 'a', newline='') as f:
                                writer = csv.writer(f)
                                writer.writerow([name, emp_type, timestamp])
                            
                            attendance_result["attendance_marked"] = True
                            attendance_result["timestamp"] = timestamp
                            attendance_result["message"] = f"Attendance marked for {name}"
                            
                        except Exception as e:
                            attendance_result["message"] = f"Failed to mark attendance: {str(e)}"
                    else:
                        attendance_result["message"] = f"Attendance already marked for {name} today"
                    
                    results.append(attendance_result)
                else:
                    results.append({
                        "user_id": None,
                        "name": "Unknown",
                        "type": None,
                        "confidence": 0.0,
                        "location": location,
                        "attendance_marked": False,
                        "already_marked": False,
                        "message": "Unknown face detected"
                    })
            
            return {
                "faces_detected": len(face_locations),
                "recognition_results": results,
                "organization": org_email,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Recognition and attendance marking failed: {str(e)}")

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, UploadFile
import json
import base64
import cv2
import numpy as np
from typing import Dict
import asyncio
from datetime import datetime
from app.api.controllers.face_recognition_controller import FaceRecognitionController
import io
from PIL import Image

router = APIRouter(prefix="/ws", tags=["websocket"])
face_controller = FaceRecognitionController()

class MockUploadFile:
    """Mock UploadFile class for WebSocket frame processing"""
    def __init__(self, file_data: bytes, filename: str = "frame.jpg"):
        self.file = io.BytesIO(file_data)
        self.filename = filename
        self.content_type = "image/jpeg"
        self.size = len(file_data)
    
    def read(self):
        return self.file.read()
    
    def seek(self, position):
        return self.file.seek(position)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.streaming_sessions: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, client_id: str, org_email: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.streaming_sessions[client_id] = {
            "org_email": org_email,
            "is_streaming": False,
            "frame_count": 0
        }
        print(f"Mobile client {client_id} connected for org: {org_email}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.streaming_sessions:
            del self.streaming_sessions[client_id]
        print(f"Mobile client {client_id} disconnected")

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)

    async def process_video_frame(self, client_id: str, frame_data: str):
        try:
            # Validate frame data
            if not frame_data or not frame_data.startswith('data:image'):
                await self.send_personal_message({
                    "type": "error",
                    "message": "Invalid frame data format"
                }, client_id)
                return

            # Decode base64 frame
            try:
                frame_bytes = base64.b64decode(frame_data.split(',')[1])
                if len(frame_bytes) == 0:
                    return
                
                # Convert to PIL Image
                image = Image.open(io.BytesIO(frame_bytes))
            except Exception as e:
                await self.send_personal_message({
                    "type": "error",
                    "message": f"Invalid image data: {str(e)}"
                }, client_id)
                return
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array for OpenCV
            frame_array = np.array(image)
            
            if frame_array is None or frame_array.size == 0:
                await self.send_personal_message({
                    "type": "error",
                    "message": "Invalid frame array"
                }, client_id)
                return

            # Get session info
            session = self.streaming_sessions.get(client_id)
            if not session:
                await self.send_personal_message({
                    "type": "error", 
                    "message": "Session not found"
                }, client_id)
                return

            session["frame_count"] += 1
            
            # Process every 30th frame to avoid overload
            if session["frame_count"] % 30 == 0:
                try:
                    # Convert frame back to JPEG bytes for face recognition
                    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(frame_array, cv2.COLOR_RGB2BGR))
                    frame_file_bytes = buffer.tobytes()
                    
                    # Process the image directly since we already have numpy array
                    # Skip the UploadFile conversion and call face recognition directly
                    try:
                        # Use the frame_array directly for face recognition
                        import face_recognition
                        
                        # Find face locations and encodings
                        face_locations = face_recognition.face_locations(frame_array)
                        face_encodings = face_recognition.face_encodings(frame_array, face_locations)
                        
                        # Load database for this organization
                        database = face_controller.load_face_database(session["org_email"])
                        print(f"Loaded database for {session['org_email']}: {len(database)} users")
                        
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
                            match, distance = face_controller.find_best_match(face_encoding, database)
                            
                            if match:
                                # match is a dictionary with user_id, name, type
                                print(f"Face recognized: {match['name']} in org {session['org_email']}")
                                recognized_faces.append({
                                    "user_id": match["user_id"],
                                    "name": match["name"],
                                    "type": match["type"],
                                    "confidence": float(1 - distance),  # Convert distance to confidence
                                    "location": location
                                })
                            else:
                                print(f"No face match found in org {session['org_email']}")
                                recognized_faces.append({
                                    "user_id": None,
                                    "name": "Unknown",
                                    "type": None,
                                    "confidence": 0.0,
                                    "location": location
                                })
                        
                        # Create result in the expected format
                        result = {
                            "faces_detected": len(face_locations),
                            "recognized_faces": recognized_faces,
                            "organization": session["org_email"],
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        # Send recognition result
                        await self.send_personal_message({
                            "type": "recognition_result",
                            "data": result,
                            "frame_count": session["frame_count"]
                        }, client_id)
                        
                        # Auto-mark attendance if face recognized
                        if (result.get("faces_detected", 0) > 0 and 
                            result.get("recognized_faces") and 
                            len(result["recognized_faces"]) > 0):
                            
                            recognized_face = result["recognized_faces"][0]
                            if recognized_face.get("name") != "Unknown" and recognized_face.get("user_id"):
                                try:
                                    attendance_result = await face_controller.mark_attendance(
                                        session["org_email"],
                                        recognized_face["user_id"]
                                    )
                                    
                                    await self.send_personal_message({
                                        "type": "attendance_marked",
                                        "data": attendance_result,
                                        "user": recognized_face
                                    }, client_id)
                                    
                                except Exception as e:
                                    await self.send_personal_message({
                                        "type": "attendance_error",
                                        "message": str(e)
                                    }, client_id)
                    
                    except Exception as face_error:
                        print(f"Face recognition error: {face_error}")
                        await self.send_personal_message({
                            "type": "error",
                            "message": f"Face recognition error: {str(face_error)}"
                        }, client_id)

                except Exception as frame_error:
                    print(f"Frame encoding error: {frame_error}")
                    await self.send_personal_message({
                        "type": "error",
                        "message": f"Frame encoding error: {str(frame_error)}"
                    }, client_id)

        except Exception as e:
            await self.send_personal_message({
                "type": "error",
                "message": f"Frame processing error: {str(e)}"
            }, client_id)

manager = ConnectionManager()

@router.websocket("/stream/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    client_id: str,
    org_email: str = Query(..., description="Organization email")
):
    await manager.connect(websocket, client_id, org_email)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "video_frame":
                await manager.process_video_frame(client_id, message["data"])
            elif message["type"] == "start_streaming":
                manager.streaming_sessions[client_id]["is_streaming"] = True
                await manager.send_personal_message({
                    "type": "streaming_started",
                    "message": "Video streaming started"
                }, client_id)
            elif message["type"] == "stop_streaming":
                manager.streaming_sessions[client_id]["is_streaming"] = False
                await manager.send_personal_message({
                    "type": "streaming_stopped", 
                    "message": "Video streaming stopped"
                }, client_id)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(client_id)

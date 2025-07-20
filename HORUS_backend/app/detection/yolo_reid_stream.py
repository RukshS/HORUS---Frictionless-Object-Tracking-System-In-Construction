# File: HORUS_backend/app/detection/yolo_reid_stream.py

import cv2
import numpy as np
import torch
from ultralytics import YOLO
from app.detection.sort import Sort
import torchreid
import ssl
from datetime import datetime
import os
from PIL import Image
from torchvision import transforms
from pymongo import MongoClient
import threading
import queue
import time
from concurrent.futures import ThreadPoolExecutor
import logging

ssl._create_default_https_context = ssl._create_unverified_context

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB Atlas connection
client = MongoClient("mongodb+srv://hansamalkodithuwakku:ma2xvfV7vpDzkZuT@horus2.wxp0jqi.mongodb.net/?retryWrites=true&w=majority&appName=Horus2")
db = client["helmet_detection"]
collection = db["detections_log"]

# Load YOLO model
yolo = YOLO("/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/models/yolo/Model1/weights/best.pt")
class_names = ['with_helmet_and_vest', 'without_helmet', 'without_vest']

# Create separate SORT trackers for each camera to avoid conflicts
trackers = {
    1: Sort(max_age=40, min_hits=1, iou_threshold=0.3),
    2: Sort(max_age=40, min_hits=1, iou_threshold=0.3),
    3: Sort(max_age=40, min_hits=1, iou_threshold=0.3)
}

# Load ReID model
reid_model = torchreid.models.build_model("osnet_x1_0", num_classes=1000)
torchreid.utils.load_pretrained_weights(
    reid_model,
    "/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/models/reid/Model1/model.pth.tar-60"
)
reid_model.eval()

# Transform for ReID model
transform = transforms.Compose([
    transforms.Resize((256, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load reference embeddings
reference_embeddings = {}
reference_path = "/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/reference_images"

for person_name in os.listdir(reference_path):
    person_folder = os.path.join(reference_path, person_name)
    if not os.path.isdir(person_folder):
        continue
    embeddings = []
    for img_name in os.listdir(person_folder):
        img_path = os.path.join(person_folder, img_name)
        img = Image.open(img_path).convert("RGB")
        img_tensor = transform(img).unsqueeze(0)
        with torch.no_grad():
            embedding = reid_model(img_tensor).squeeze().numpy()
        embeddings.append(embedding)
    reference_embeddings[person_name] = embeddings

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-6)

def process_frame(frame, camera_id):
    """Process frame with camera-specific tracker"""
    results = yolo(frame, conf=0.1)
    detections = []
    detection_info = []

    for box in results[0].boxes:
        if box.conf.item() > 0.5:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls_id = int(box.cls.item())
            class_name = class_names[cls_id] if cls_id < len(class_names) else "unknown"
            conf = box.conf.item()
            detections.append([x1, y1, x2, y2, conf])
            detection_info.append({"bbox": (x1, y1, x2, y2), "class_name": class_name})

    if len(detections) == 0:
        return frame

    dets_for_sort = np.array(detections)
    tracked_objects = trackers[camera_id].update(dets_for_sort)

    for obj in tracked_objects:
        x1, y1, x2, y2, track_id = map(int, obj)
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        crop_img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
        crop_tensor = transform(crop_img).unsqueeze(0)

        with torch.no_grad():
            embedding = reid_model(crop_tensor).squeeze().numpy()

        class_name = "unknown"
        for det in detection_info:
            dx1, dy1, dx2, dy2 = det["bbox"]
            if abs(x1 - dx1) < 10 and abs(y1 - dy1) < 10:
                class_name = det["class_name"]
                break

        best_match_name = "Unknown"
        best_similarity = 0.0

        for name, embeddings_list in reference_embeddings.items():
            for ref_emb in embeddings_list:
                similarity = cosine_similarity(embedding, ref_emb)
                if similarity > best_similarity and similarity > 0.5:
                    best_similarity = similarity
                    best_match_name = name

        person_id = track_id
        label = f"ID: {person_id} ({best_match_name}, {class_name})"
        color = (0, 255, 0) if best_match_name != "Unknown" else (0, 0, 255)

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

# Shared data structures for cross-camera tracking
shared_detections = {}
detection_lock = threading.Lock()

# Violation tracking system
violation_history = {}  # Track violations per person per camera
violation_lock = threading.Lock()
VIOLATION_CONFIRMATION_FRAMES = 10  # Number of consecutive frames to confirm violation
VIOLATION_THRESHOLD = 0.9  # 90% of frames must show violation to confirm

# Frame processing queues for parallel processing
frame_queues = {1: queue.Queue(maxsize=3), 2: queue.Queue(maxsize=3), 3: queue.Queue(maxsize=3)}
processed_queues = {1: queue.Queue(maxsize=3), 2: queue.Queue(maxsize=3), 3: queue.Queue(maxsize=3)}

def is_violation(class_name):
    """Check if a class represents a safety violation"""
    violation_classes = ['without_helmet', 'without_vest']
    return class_name in violation_classes

def update_violation_history(person_id, camera_id, class_name, person_name):
    """Update violation history for a person and determine if violation should be logged"""
    with violation_lock:
        # Create unique key for person-camera combination
        key = f"{person_id}_{camera_id}"
        
        # Initialize history if not exists
        if key not in violation_history:
            violation_history[key] = {
                "frames": [],
                "person_name": person_name,
                "camera_id": camera_id,
                "person_id": person_id,
                "last_logged_violation": None
            }
        
        # Add current frame result
        violation_history[key]["frames"].append({
            "class_name": class_name,
            "is_violation": is_violation(class_name),
            "timestamp": datetime.now()
        })
        
        # Keep only recent frames (sliding window)
        violation_history[key]["frames"] = violation_history[key]["frames"][-VIOLATION_CONFIRMATION_FRAMES:]
        
        # Check if we have enough frames to make a decision
        if len(violation_history[key]["frames"]) >= VIOLATION_CONFIRMATION_FRAMES:
            violation_count = sum(1 for frame in violation_history[key]["frames"] if frame["is_violation"])
            violation_ratio = violation_count / len(violation_history[key]["frames"])
            
            # If violation threshold is met and we haven't logged this violation recently
            if violation_ratio >= VIOLATION_THRESHOLD:
                last_logged = violation_history[key]["last_logged_violation"]
                current_time = datetime.now()
                
                # Only log if we haven't logged a violation for this person in the last 30 seconds
                if last_logged is None or (current_time - last_logged).total_seconds() > 30:
                    violation_history[key]["last_logged_violation"] = current_time
                    
                    # Get the most common violation type in recent frames
                    violation_types = [frame["class_name"] for frame in violation_history[key]["frames"] if frame["is_violation"]]
                    if violation_types:
                        most_common_violation = max(set(violation_types), key=violation_types.count)
                        return True, most_common_violation
        
        return False, class_name

def cleanup_violation_history():
    """Cleanup old violation history entries"""
    with violation_lock:
        current_time = datetime.now()
        to_remove = []
        
        for key, history in violation_history.items():
            # Remove entries older than 30 seconds with no recent activity
            if history["frames"]:
                last_activity = max(frame["timestamp"] for frame in history["frames"])
                if (current_time - last_activity).total_seconds() > 30:
                    to_remove.append(key)
        
        for key in to_remove:
            del violation_history[key]

def log_detection_async(timestamp, camera_id, person_id, person_name, class_name, similarity, is_confirmed_violation=False):
    """Asynchronously log detection to MongoDB with violation status"""
    try:
        document = {
            "timestamp": timestamp,
            "camera_id": int(camera_id),
            "person_id": int(person_id),
            "person_name": str(person_name),
            "class_name": str(class_name),
            "similarity": float(similarity),
            "is_violation": is_violation(class_name),
            "is_confirmed_violation": is_confirmed_violation,
            "violation_severity": "HIGH" if is_confirmed_violation else ("MEDIUM" if is_violation(class_name) else "NONE")
        }
        
        # Use different collections for violations vs regular detections
        if is_confirmed_violation:
            violations_collection = db["confirmed_violations"]
            violations_collection.insert_one(document)
            logger.warning(f"CONFIRMED VIOLATION: {person_name} - {class_name} at Camera {camera_id}")
        
        # Always log to main detections collection
        collection.insert_one(document)
        
    except Exception as e:
        logger.error(f"Error logging to MongoDB: {e}")

def process_frame_parallel(frame, camera_id):
    """Enhanced process frame with parallel capabilities"""
    try:
        results = yolo(frame, conf=0.1)
        detections = []
        detection_info = []

        for box in results[0].boxes:
            if box.conf.item() > 0.5:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls_id = int(box.cls.item())
                class_name = class_names[cls_id] if cls_id < len(class_names) else "unknown"
                conf = box.conf.item()
                detections.append([x1, y1, x2, y2, conf])
                detection_info.append({"bbox": (x1, y1, x2, y2), "class_name": class_name})

        if len(detections) == 0:
            return frame

        dets_for_sort = np.array(detections)
        tracked_objects = trackers[camera_id].update(dets_for_sort)

        for obj in tracked_objects:
            x1, y1, x2, y2, track_id = map(int, obj)
            crop = frame[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            crop_img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
            crop_tensor = transform(crop_img).unsqueeze(0)

            with torch.no_grad():
                embedding = reid_model(crop_tensor).squeeze().numpy()

            class_name = "unknown"
            for det in detection_info:
                dx1, dy1, dx2, dy2 = det["bbox"]
                if abs(x1 - dx1) < 10 and abs(y1 - dy1) < 10:
                    class_name = det["class_name"]
                    break

            best_match_name = "Unknown"
            best_similarity = 0.0

            for name, embeddings_list in reference_embeddings.items():
                for ref_emb in embeddings_list:
                    similarity = cosine_similarity(embedding, ref_emb)
                    if similarity > best_similarity and similarity > 0.5:
                        best_similarity = similarity
                        best_match_name = name

            # Update shared detections for cross-camera tracking
            global_person_id = f"{best_match_name}_{camera_id}_{track_id}" if best_match_name != "Unknown" else f"Unknown_{camera_id}_{track_id}"
            
            with detection_lock:
                shared_detections[global_person_id] = {
                    "timestamp": datetime.now(),
                    "camera_id": camera_id,
                    "person_name": best_match_name,
                    "embedding": embedding,
                    "similarity": best_similarity,
                    "bbox": (x1, y1, x2, y2)
                }

            # Check violation with validation logic
            should_log_violation, confirmed_class = update_violation_history(
                track_id, camera_id, class_name, best_match_name
            )

            person_id = track_id
            
            # Enhanced color coding and labeling
            if should_log_violation and is_violation(confirmed_class):
                color = (0, 0, 255)  # Red for confirmed violation
                label = f"ID: {person_id} ({best_match_name}, VIOLATION: {confirmed_class})"
                
                # Log confirmed violation to MongoDB
                threading.Thread(target=log_detection_async, args=(
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    camera_id, person_id, best_match_name, confirmed_class, best_similarity, True  # True indicates confirmed violation
                ), daemon=True).start()
                
            elif is_violation(class_name):
                # Check how many violation frames we have so far
                with violation_lock:
                    key = f"{track_id}_{camera_id}"
                    if key in violation_history and len(violation_history[key]["frames"]) > 0:
                        recent_violations = sum(1 for frame in violation_history[key]["frames"] if frame["is_violation"])
                        total_frames = len(violation_history[key]["frames"])
                        violation_ratio = recent_violations / total_frames
                        
                        if violation_ratio >= 0.5:  # Show orange if over 50% violation rate
                            color = (0, 165, 255)  # Orange for potential violation
                            label = f"ID: {person_id} ({best_match_name}, CHECKING: {class_name} [{recent_violations}/{total_frames}])"
                        else:
                            color = (0, 255, 255)  # Yellow for minor concern
                            label = f"ID: {person_id} ({best_match_name}, {class_name})"
                    else:
                        color = (0, 255, 255)  # Yellow for first-time detection
                        label = f"ID: {person_id} ({best_match_name}, {class_name})"
            else:
                color = (0, 255, 0)  # Green for safe/compliant
                label = f"ID: {person_id} ({best_match_name}, {class_name})"

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            # Only log NON-VIOLATION detections for tracking purposes
            # Violations are ONLY logged when confirmed (red boxes) - handled above
            if not should_log_violation and not is_violation(class_name):  # Only log safe detections
                threading.Thread(target=log_detection_async, args=(
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    camera_id, person_id, best_match_name, class_name, best_similarity, False  # False indicates regular detection
                ), daemon=True).start()

        return frame
    
    except Exception as e:
        logger.error(f"Error processing frame for camera {camera_id}: {e}")
        return frame

# Parallel processing control
processing_active = {1: False, 2: False, 3: False}
processing_threads = {}

def start_camera_processing(camera_id, video_path):
    """Start parallel processing for a specific camera"""
    if processing_active[camera_id]:
        return  # Already running
    
    processing_active[camera_id] = True
    
    def read_and_process():
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open camera {camera_id} video file: {video_path}")
            processing_active[camera_id] = False
            return
        
        logger.info(f"Started processing for camera {camera_id}")
        
        while processing_active[camera_id]:
            ret, frame = cap.read()
            if not ret:
                # Loop the video by resetting
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Process frame
            processed_frame = process_frame_parallel(frame, camera_id)
            
            try:
                # Add to processed queue (non-blocking)
                processed_queues[camera_id].put_nowait(processed_frame)
            except queue.Full:
                # Drop oldest frame if queue is full
                try:
                    processed_queues[camera_id].get_nowait()
                    processed_queues[camera_id].put_nowait(processed_frame)
                except queue.Empty:
                    pass
            
            # Control frame rate (~30 FPS)
            time.sleep(0.033)
        
        cap.release()
        logger.info(f"Stopped processing for camera {camera_id}")
    
    # Start processing thread
    thread = threading.Thread(target=read_and_process, daemon=True)
    thread.start()
    processing_threads[camera_id] = thread

def generate_parallel_frames(camera_id, video_path):
    """Generate frames for a specific camera with true parallel processing"""
    # Start processing if not already active
    if not processing_active[camera_id]:
        start_camera_processing(camera_id, video_path)
        time.sleep(1)  # Give it a moment to start
    
    while True:
        try:
            # Get processed frame from queue
            frame = processed_queues[camera_id].get(timeout=1.0)
            _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        except queue.Empty:
            # If no frame available, yield a placeholder
            logger.debug(f"No frame available for camera {camera_id}, sending placeholder")
            placeholder = np.ones((480, 640, 3), dtype=np.uint8) * 50  # Dark gray
            cv2.putText(placeholder, f"Camera {camera_id} Loading...", (200, 240), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            _, jpeg = cv2.imencode('.jpg', placeholder)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        except Exception as e:
            logger.error(f"Error generating frames for camera {camera_id}: {e}")
            break

# Separate camera feed generators with parallel processing

def generate_camera1_frames():
    """Generate frames for camera 1 with parallel processing"""
    video_path = "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam1.mov"
    return generate_parallel_frames(1, video_path)

def generate_camera2_frames():
    """Generate frames for camera 2 with parallel processing"""
    video_path = "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam2.mov"
    return generate_parallel_frames(2, video_path)

def generate_camera3_frames():
    """Generate frames for camera 3 with parallel processing"""
    video_path = "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam3.mov"
    return generate_parallel_frames(3, video_path)

def stop_camera_processing(camera_id):
    """Stop processing for a specific camera"""
    processing_active[camera_id] = False
    if camera_id in processing_threads:
        processing_threads[camera_id].join(timeout=2)

def stop_all_processing():
    """Stop all camera processing"""
    for camera_id in [1, 2, 3]:
        stop_camera_processing(camera_id)

# Cross-camera tracking utilities
def get_cross_camera_detections():
    """Get recent detections from all cameras for cross-camera analysis"""
    with detection_lock:
        current_time = datetime.now()
        recent_detections = {}
        
        for person_id, detection in shared_detections.items():
            # Only include detections from last 5 seconds
            if (current_time - detection["timestamp"]).total_seconds() < 5:
                recent_detections[person_id] = detection
        
        return recent_detections

def get_violation_status():
    """Get current violation status and history"""
    with violation_lock:
        current_time = datetime.now()
        active_violations = {}
        
        for key, history in violation_history.items():
            if history["frames"]:
                # Check if currently in violation state
                recent_frames = [f for f in history["frames"] if (current_time - f["timestamp"]).total_seconds() < 5]
                if recent_frames:
                    violation_count = sum(1 for frame in recent_frames if frame["is_violation"])
                    if violation_count > 0:
                        active_violations[key] = {
                            "person_name": history["person_name"],
                            "camera_id": history["camera_id"],
                            "person_id": history["person_id"],
                            "violation_ratio": violation_count / len(recent_frames),
                            "frames_checked": len(recent_frames),
                            "is_confirmed": violation_count / len(recent_frames) >= VIOLATION_THRESHOLD,
                            "last_violation_time": max(f["timestamp"] for f in recent_frames if f["is_violation"]).isoformat() if any(f["is_violation"] for f in recent_frames) else None
                        }
        
        return {
            "active_violations": active_violations,
            "violation_threshold": VIOLATION_THRESHOLD,
            "confirmation_frames": VIOLATION_CONFIRMATION_FRAMES,
            "total_tracked_persons": len(violation_history)
        }

def get_confirmed_violations_from_db(limit=50):
    """Get recent confirmed violations from database"""
    try:
        violations_collection = db["confirmed_violations"]
        recent_violations = list(violations_collection.find().sort("timestamp", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for violation in recent_violations:
            violation["_id"] = str(violation["_id"])
        
        return recent_violations
    except Exception as e:
        logger.error(f"Error fetching violations from database: {e}")
        return []

def cleanup_old_detections():
    """Cleanup old detections from shared memory"""
    with detection_lock:
        current_time = datetime.now()
        to_remove = []
        
        for person_id, detection in shared_detections.items():
            # Remove detections older than 10 seconds
            if (current_time - detection["timestamp"]).total_seconds() > 10:
                to_remove.append(person_id)
        
        for person_id in to_remove:
            del shared_detections[person_id]

# Start cleanup thread
def start_cleanup_thread():
    """Start background cleanup thread"""
    def cleanup_loop():
        while True:
            cleanup_old_detections()
            cleanup_violation_history()  # Also cleanup violation history
            time.sleep(5)  # Run cleanup every 5 seconds
    
    cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
    cleanup_thread.start()

# Initialize cleanup thread
start_cleanup_thread()

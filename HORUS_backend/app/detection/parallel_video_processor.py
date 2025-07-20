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
    "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/models/reid/Model1/model.pth.tar-60"
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
reference_path = "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/reference_images"

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

# Shared data structures for cross-camera tracking
shared_detections = {}
detection_lock = threading.Lock()

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-6)

def process_frame(frame, camera_id):
    """Process frame with camera-specific tracker"""
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

            # Global person ID based on best match and similarity
            global_person_id = f"{best_match_name}_{camera_id}_{track_id}" if best_match_name != "Unknown" else f"Unknown_{camera_id}_{track_id}"
            
            # Update shared detections for cross-camera tracking
            with detection_lock:
                shared_detections[global_person_id] = {
                    "timestamp": datetime.now(),
                    "camera_id": camera_id,
                    "person_name": best_match_name,
                    "embedding": embedding,
                    "similarity": best_similarity,
                    "bbox": (x1, y1, x2, y2)
                }

            label = f"ID: {track_id} ({best_match_name}, {class_name})"
            color = (0, 255, 0) if best_match_name != "Unknown" else (0, 0, 255)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            # Log to MongoDB asynchronously
            threading.Thread(target=log_detection_async, args=(
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                camera_id, track_id, best_match_name, class_name, best_similarity
            ), daemon=True).start()

        return frame
    
    except Exception as e:
        logger.error(f"Error processing frame for camera {camera_id}: {e}")
        return frame

def log_detection_async(timestamp, camera_id, person_id, person_name, class_name, similarity):
    """Asynchronously log detection to MongoDB"""
    try:
        collection.insert_one({
            "timestamp": timestamp,
            "camera_id": int(camera_id),
            "person_id": int(person_id),
            "person_name": str(person_name),
            "class_name": str(class_name),
            "similarity": float(similarity)
        })
    except Exception as e:
        logger.error(f"Error logging to MongoDB: {e}")

class ParallelVideoProcessor:
    """Parallel video processor for multiple camera streams"""
    
    def __init__(self):
        self.frame_queues = {1: queue.Queue(maxsize=5), 2: queue.Queue(maxsize=5), 3: queue.Queue(maxsize=5)}
        self.processed_queues = {1: queue.Queue(maxsize=5), 2: queue.Queue(maxsize=5), 3: queue.Queue(maxsize=5)}
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=6)
        
    def read_frames(self, camera_id, video_path):
        """Continuously read frames from video source"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open camera {camera_id} video file: {video_path}")
            return
            
        logger.info(f"Started reading frames for camera {camera_id}")
        
        while self.running:
            ret, frame = cap.read()
            if not ret:
                # Loop the video by resetting
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            try:
                # Non-blocking put, drop frame if queue is full
                self.frame_queues[camera_id].put_nowait(frame)
            except queue.Full:
                # Drop the oldest frame and add new one
                try:
                    self.frame_queues[camera_id].get_nowait()
                    self.frame_queues[camera_id].put_nowait(frame)
                except queue.Empty:
                    pass
                    
            time.sleep(0.033)  # ~30 FPS
            
        cap.release()
        logger.info(f"Stopped reading frames for camera {camera_id}")
    
    def process_frames(self, camera_id):
        """Process frames for a specific camera"""
        logger.info(f"Started processing frames for camera {camera_id}")
        
        while self.running:
            try:
                frame = self.frame_queues[camera_id].get(timeout=1.0)
                processed_frame = process_frame(frame, camera_id)
                
                try:
                    self.processed_queues[camera_id].put_nowait(processed_frame)
                except queue.Full:
                    # Drop the oldest processed frame
                    try:
                        self.processed_queues[camera_id].get_nowait()
                        self.processed_queues[camera_id].put_nowait(processed_frame)
                    except queue.Empty:
                        pass
                        
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing frame for camera {camera_id}: {e}")
                
        logger.info(f"Stopped processing frames for camera {camera_id}")
    
    def start_parallel_processing(self):
        """Start parallel processing for all cameras"""
        self.running = True
        
        # Camera configurations
        cameras = {
            1: "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam1.mov",
            2: "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam2.mov",
            3: "/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam3.mov"
        }
        
        # Start frame reading threads
        for camera_id, video_path in cameras.items():
            self.executor.submit(self.read_frames, camera_id, video_path)
        
        # Start frame processing threads
        for camera_id in cameras.keys():
            self.executor.submit(self.process_frames, camera_id)
            
        logger.info("Started parallel video processing for all cameras")
    
    def stop_parallel_processing(self):
        """Stop parallel processing"""
        self.running = False
        self.executor.shutdown(wait=True)
        logger.info("Stopped parallel video processing")

# Create global processor instance
video_processor = ParallelVideoProcessor()

def generate_camera_frames(camera_id):
    """Generate frames for a specific camera with parallel processing"""
    if not video_processor.running:
        video_processor.start_parallel_processing()
    
    while True:
        try:
            frame = video_processor.processed_queues[camera_id].get(timeout=1.0)
            _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        except queue.Empty:
            # If no frame available, yield a black frame to keep connection alive
            black_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            _, jpeg = cv2.imencode('.jpg', black_frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        except Exception as e:
            logger.error(f"Error generating frames for camera {camera_id}: {e}")
            break

# Individual camera generators
def generate_camera1_frames():
    """Generate frames for camera 1"""
    return generate_camera_frames(1)

def generate_camera2_frames():
    """Generate frames for camera 2"""
    return generate_camera_frames(2)

def generate_camera3_frames():
    """Generate frames for camera 3"""
    return generate_camera_frames(3)

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
            time.sleep(5)  # Run cleanup every 5 seconds
    
    cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
    cleanup_thread.start()

# Initialize cleanup thread
start_cleanup_thread()

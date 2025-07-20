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

ssl._create_default_https_context = ssl._create_unverified_context

# MongoDB Atlas connection
client = MongoClient("mongodb+srv://hansamalkodithuwakku:ma2xvfV7vpDzkZuT@horus2.wxp0jqi.mongodb.net/?retryWrites=true&w=majority&appName=Horus2")
db = client["helmet_detection"]
collection = db["detections_log"]

# Load YOLO model
yolo = YOLO("/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/models/yolo/Model1/weights/best.pt")
class_names = ['with_helmet_and_vest', 'without_helmet', 'without_vest']

# SORT tracker
tracker = Sort(max_age=40, min_hits=1, iou_threshold=0.3)

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
    tracked_objects = tracker.update(dets_for_sort)

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

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        collection.insert_one({
            "timestamp": timestamp,
            "camera_id": int(camera_id),
            "person_id": int(person_id),
            "person_name": str(best_match_name),
            "class_name": str(class_name),
            "similarity": float(best_similarity)
        })

    return frame

# Separate camera feed generators

def generate_camera1_frames():
    cap = cv2.VideoCapture("/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam1.mov")
    if not cap.isOpened():
        print("Error: Could not open camera 1 video file")
        # Fallback to webcam if video file doesn't exist
        cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            # Loop the video by resetting the capture
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        frame = process_frame(frame, camera_id=1)
        _, jpeg = cv2.imencode('.jpg', frame)
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()
    cv2.destroyAllWindows()

def generate_camera2_frames():
    cap = cv2.VideoCapture("/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/cam2.mov")
    if not cap.isOpened():
        print("Error: Could not open camera 2 video file")
        # Fallback to webcam if video file doesn't exist
        cap = cv2.VideoCapture(1)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            # Loop the video by resetting the capture
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        frame = process_frame(frame, camera_id=2)
        _, jpeg = cv2.imencode('.jpg', frame)
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()
    cv2.destroyAllWindows()

def generate_camera3_frames():
    cap = cv2.VideoCapture("/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/IMG_0714.MOV")
    if not cap.isOpened():
        print("Error: Could not open camera 3 video file")
        # Fallback to webcam if video file doesn't exist
        cap = cv2.VideoCapture(2)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            # Loop the video by resetting the capture
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        frame = process_frame(frame, camera_id=3)
        _, jpeg = cv2.imencode('.jpg', frame)
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()
    cv2.destroyAllWindows()

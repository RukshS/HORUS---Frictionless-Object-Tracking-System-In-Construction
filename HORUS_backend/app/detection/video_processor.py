import cv2
import numpy as np
from datetime import datetime
from PIL import Image
import torch

from app.detection.yolo_detector import yolo, class_names
from app.detection.tracker import tracker
from app.detection.reid import reid_model, transform, reference_embeddings
from app.detection.utils import cosine_similarity
from app.database.mongodb import log_to_mongodb

# Load video streams
cap1 = cv2.VideoCapture("/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/IMG_5652.MOV")
cap2 = cv2.VideoCapture("/Users/rashmithahansamal/Documents/Hansa/projects/HORUS/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/videos/IMG_5653.MOV")

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
        log_to_mongodb(timestamp, camera_id, person_id, best_match_name, class_name, round(best_similarity, 3))

    return frame

def run_detection():
    while True:
        ret1, frame1 = cap1.read()
        ret2, frame2 = cap2.read()
        if not ret1 or not ret2:
            break

        frame1 = process_frame(frame1, camera_id=1)
        frame2 = process_frame(frame2, camera_id=2)

        cv2.imshow("Camera 1", frame1)
        cv2.imshow("Camera 2", frame2)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap1.release()
    cap2.release()
    cv2.destroyAllWindows()

import cv2
import numpy as np
import torch
from ultralytics import YOLO
from HORUS_backend.app.detection.sort import Sort
import torchreid
import ssl
import csv
from datetime import datetime
import os
from PIL import Image
from torchvision import transforms
from pymongo import MongoClient

# Fix SSL issues (for Torchreid pretrained models)
ssl._create_default_https_context = ssl._create_unverified_context

# MongoDB Atlas connection
client = MongoClient("mongodb+srv://hansamalkodithuwakku:ma2xvfV7vpDzkZuT@horus2.wxp0jqi.mongodb.net/?retryWrites=true&w=majority&appName=Horus2")
db = client["helmet_detection"]
collection = db["detections_log"]

# Load YOLO model
yolo = YOLO("/Users/rashmithahansamal/PycharmProjects/hours/hoursdataset/hoursv1model/weights/best.pt")
class_names = ['with_helmet_and_vest', 'without_helmet', 'without_vest']

# SORT tracker
tracker = Sort(max_age=40, min_hits=1, iou_threshold=0.3)

# Load ReID model
reid_model = torchreid.models.build_model("osnet_x1_0", num_classes=1000)
torchreid.utils.load_pretrained_weights(
    reid_model,
    "/Users/rashmithahansamal/Downloads/untitled folder/model.pth.tar-60"
)
reid_model.eval()

# Transform for ReID model
transform = transforms.Compose([
    transforms.Resize((256, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# Load reference embeddings
reference_embeddings = {}  # {name: [emb1, emb2, ...]}
reference_path = "/Users/rashmithahansamal/PycharmProjects/deep-person-reid/YoloDetection/reference_images"

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
    print(f"Loaded {len(embeddings)} embeddings for {person_name}")

# Video streams
cap1 = cv2.VideoCapture('/Users/rashmithahansamal/PycharmProjects/hours/hoursdataset/video/IMG_5397.MOV')
cap2 = cv2.VideoCapture('/Users/rashmithahansamal/PycharmProjects/hours/hoursdataset/video/IMG_5653.MOV')

# # CSV Logging
# csv_file = open("detections_log2.csv", mode="w", newline="")
# csv_writer = csv.writer(csv_file)
# csv_writer.writerow(["timestamp", "camera_id", "person_id", "person_name", "class_name", "similarity"])

# MongoDB Logging Setup
def log_to_mongodb(timestamp, camera_id, person_id, person_name, class_name, similarity):
    collection.insert_one({
        "timestamp": timestamp,
        "camera_id": int(camera_id),
        "person_id": int(person_id),
        "person_name": str(person_name),
        "class_name": str(class_name),
        "similarity": float(similarity)
    }

)


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
        # csv_writer.writerow([timestamp, camera_id, person_id, best_match_name, class_name, round(best_similarity, 3)])
        log_to_mongodb(timestamp, camera_id, person_id, best_match_name, class_name, round(best_similarity, 3))

    return frame

# Main loop
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
# csv_file.close()
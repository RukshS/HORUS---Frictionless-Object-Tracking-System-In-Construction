from pymongo import MongoClient
from app.core.config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["HORUS_database"]
collection = db["detections_log"]

def log_to_mongodb(timestamp, camera_id, person_id, person_name, class_name, similarity):
    collection.insert_one({
        "timestamp": timestamp,
        "camera_id": int(camera_id),
        "person_id": int(person_id),
        "person_name": str(person_name),
        "class_name": str(class_name),
        "similarity": float(similarity)
    })

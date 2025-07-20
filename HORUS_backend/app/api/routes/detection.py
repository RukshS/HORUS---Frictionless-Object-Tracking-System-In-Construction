from fastapi import APIRouter
from app.detection.video_processor import run_detection
from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter()

# MongoDB connection for fetching violations
client = MongoClient("mongodb+srv://hansamalkodithuwakku:ma2xvfV7vpDzkZuT@horus2.wxp0jqi.mongodb.net/?retryWrites=true&w=majority&appName=Horus2")
db = client["helmet_detection"]
collection = db["detections_log"]

@router.get("/start")
def start_detection():
    run_detection()
    return {"message": "Detection run completed"}

@router.get("/violations")
def get_violations():
    """Fetch recent violations from the database"""
    try:
        # Get violations from the last 24 hours
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        
        # Query for violations (without_helmet or without_vest) excluding Unknown persons
        violations_cursor = collection.find({
            "class_name": {"$in": ["without_helmet", "without_vest"]},
            "timestamp": {"$gte": twenty_four_hours_ago.strftime("%Y-%m-%d %H:%M:%S")},
            "person_name": {"$ne": "Unknown"}  # Exclude Unknown persons
        }).sort("timestamp", -1).limit(100)  # Get more to filter duplicates
        
        # Filter out duplicate violations (same person, same violation type within 5 minutes)
        unique_violations = []
        seen_violations = {}
        
        for violation in violations_cursor:
            person_name = violation.get("person_name", "")
            violation_type = violation["class_name"]
            timestamp_str = violation["timestamp"]
            camera_id = violation.get("camera_id", "Unknown")
            
            # Create a unique key for this violation
            violation_key = f"{person_name}_{violation_type}_{camera_id}"
            
            # Parse timestamp
            try:
                violation_time = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except:
                continue
            
            # Check if we've seen this violation recently (within 5 minutes)
            should_add = True
            if violation_key in seen_violations:
                last_time = seen_violations[violation_key]
                time_diff = abs((violation_time - last_time).total_seconds())
                if time_diff < 300:  # 5 minutes = 300 seconds
                    should_add = False
            
            if should_add:
                seen_violations[violation_key] = violation_time
                unique_violations.append({
                    "id": str(violation["_id"]),
                    "timestamp": violation["timestamp"],
                    "camera_id": violation.get("camera_id", "Unknown"),
                    "person_name": violation.get("person_name", "Unknown"),
                    "violation_type": "No Helmet" if violation["class_name"] == "without_helmet" else "No Safety Vest",
                    "class_name": violation["class_name"],
                    "similarity": violation.get("similarity", 0.0)
                })
        
        # Limit to 50 most recent unique violations
        unique_violations = unique_violations[:50]
        
        return {"violations": unique_violations, "count": len(unique_violations)}
    
    except Exception as e:
        return {"error": str(e), "violations": [], "count": 0}

@router.get("/violations/recent")
def get_recent_violations(limit: int = 10):
    """Fetch most recent violations with filtering"""
    try:
        # Query for violations excluding Unknown persons
        violations_cursor = collection.find({
            "class_name": {"$in": ["without_helmet", "without_vest"]},
            "person_name": {"$ne": "Unknown"}  # Exclude Unknown persons
        }).sort("timestamp", -1).limit(limit * 3)  # Get more to filter duplicates
        
        # Filter out duplicate violations (same person, same violation type within 5 minutes)
        unique_violations = []
        seen_violations = {}
        
        for violation in violations_cursor:
            if len(unique_violations) >= limit:
                break
                
            person_name = violation.get("person_name", "")
            violation_type = violation["class_name"]
            timestamp_str = violation["timestamp"]
            camera_id = violation.get("camera_id", "Unknown")
            
            # Skip if person name is still Unknown or empty
            if not person_name or person_name == "Unknown":
                continue
            
            # Create a unique key for this violation
            violation_key = f"{person_name}_{violation_type}_{camera_id}"
            
            # Parse timestamp
            try:
                violation_time = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except:
                continue
            
            # Check if we've seen this violation recently (within 5 minutes)
            should_add = True
            if violation_key in seen_violations:
                last_time = seen_violations[violation_key]
                time_diff = abs((violation_time - last_time).total_seconds())
                if time_diff < 300:  # 5 minutes = 300 seconds
                    should_add = False
            
            if should_add:
                seen_violations[violation_key] = violation_time
                unique_violations.append({
                    "id": str(violation["_id"]),
                    "timestamp": violation["timestamp"],
                    "camera_id": violation.get("camera_id", "Unknown"),
                    "person_name": violation.get("person_name", "Unknown"),
                    "violation_type": "No Helmet" if violation["class_name"] == "without_helmet" else "No Safety Vest",
                    "class_name": violation["class_name"]
                })
        
        return {"violations": unique_violations}
    
    except Exception as e:
        return {"error": str(e), "violations": []}

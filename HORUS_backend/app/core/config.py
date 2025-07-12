import os

YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/models/yolo/Model1/weights/best.pt")
REID_MODEL_PATH = os.getenv("REID_MODEL_PATH","/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/models/reid/Model1/model.pth.tar-60")
REFERENCE_IMAGES_PATH = os.getenv("REFERENCE_IMAGES_PATH","/Users/rashmithahansamal/Documents/Projects/HoursConstruction/HORUS---Frictionless-Object-Tracking-System-In-Construction/HORUS_backend/app/reference_images")
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://hansamalkodithuwakku:ma2xvfV7vpDzkZuT@horus2.wxp0jqi.mongodb.net/?retryWrites=true&w=majority&appName=Horus2")

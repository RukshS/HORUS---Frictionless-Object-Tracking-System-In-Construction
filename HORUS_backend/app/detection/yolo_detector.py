from ultralytics import YOLO
from app.core.config import YOLO_MODEL_PATH

yolo = YOLO(YOLO_MODEL_PATH)
class_names = ['with_helmet_and_vest', 'without_helmet', 'without_vest']

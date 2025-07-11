from app.detection.sort import Sort

tracker = Sort(max_age=40, min_hits=1, iou_threshold=0.3)

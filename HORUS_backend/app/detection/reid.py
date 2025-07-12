import torch
import torchreid
from torchvision import transforms
from PIL import Image
import os
from app.core.config import REID_MODEL_PATH, REFERENCE_IMAGES_PATH

reid_model = torchreid.models.build_model("osnet_x1_0", num_classes=1000)
torchreid.utils.load_pretrained_weights(reid_model, REID_MODEL_PATH)
reid_model.eval()

transform = transforms.Compose([
    transforms.Resize((256, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

reference_embeddings = {}

for person_name in os.listdir(REFERENCE_IMAGES_PATH):
    person_folder = os.path.join(REFERENCE_IMAGES_PATH, person_name)
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

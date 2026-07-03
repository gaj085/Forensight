import sys
import os
import json
import numpy as np
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Match default settings from app.py
MODEL = os.getenv("FACE_MODEL", "Facenet")
DETECTOR = os.getenv("FACE_DETECTOR", "opencv")
ENFORCE_DETECTION = os.getenv("ENFORCE_DETECTION", "false").lower() == "true"

def get_embedding(image_path):
    try:
        from deepface import DeepFace

        # Open image using PIL to convert/verify format
        img = np.array(Image.open(image_path).convert("RGB"))

        reps = DeepFace.represent(
            img_path=img,
            model_name=MODEL,
            detector_backend=DETECTOR,
            enforce_detection=ENFORCE_DETECTION,
        )

        if not reps:
            return None

        # Extract and normalize the embedding vector
        emb = np.array(reps[0]["embedding"], dtype=np.float32)
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb.tolist()

    except Exception as e:
        print(f"Error computing embedding: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    embedding = get_embedding(image_path)
    if embedding is None:
        print(json.dumps({"error": "Face not detected or extraction failed"}))
        sys.exit(1)

    print(json.dumps({"embedding": embedding}))

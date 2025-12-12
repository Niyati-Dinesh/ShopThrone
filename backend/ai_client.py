import requests
import os
from dotenv import load_dotenv

load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = "google/vit-base-patch16-224"  # or another model

headers = {"Authorization": f"Bearer {HF_API_KEY}"}

def analyze_image_from_bytes(image_bytes: bytes):
    url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    
    response = requests.post(
        url,
        headers=headers,
        data=image_bytes
    )

    if response.status_code != 200:
        return [{"label": "Unknown", "confidence": 0, "source": "hf-fallback"}]

    data = response.json()

    results = []
    for item in data:
        results.append({
            "label": item["label"],
            "confidence": round(item["score"] * 100, 2),
            "source": "huggingface"
        })

    return results

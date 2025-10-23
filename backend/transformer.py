from transformers import pipeline
from PIL import Image, ImageEnhance
import io

# Load the model once when the server starts
try:
    clf = pipeline("image-classification", model="google/vit-base-patch16-224")
    print("✅ AI Model loaded successfully.")
except Exception as e:
    print(f"🚨 Could not load AI model: {e}")
    clf = None

def analyze_image_from_bytes(image_bytes: bytes):
    if clf is None:
        raise RuntimeError("AI model is not available.")
        
    """Improve image quality and run prediction"""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Resize image to optimal size for the model
    image = image.resize((224, 224))
    
    # Enhance contrast and sharpness
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.2)
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.1)
    
    # Get top prediction
    preds = clf(image, top_k=1)
    return preds
# backend/app/services/embedding.py

from sentence_transformers import SentenceTransformer

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model

def get_embedding(text: str):
    model = get_model()
    embedding = model.encode(text)
    return embedding.tolist()
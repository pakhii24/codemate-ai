# backend/app/services/embedding.py

from fastembed import TextEmbedding

model = None

def get_model():
    global model
    if model is None:
        model = TextEmbedding("BAAI/bge-small-en-v1.5")
    return model

def get_embedding(text: str):
    model = get_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()
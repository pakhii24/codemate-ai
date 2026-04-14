from fastapi import APIRouter, UploadFile, File
from app.services.embedding import get_embedding
from app.db.qdrant import client, COLLECTION_NAME
from qdrant_client.models import VectorParams, Distance, PointStruct
import uuid

router = APIRouter()

try:
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
except Exception:
    pass

@router.post("/embed")
def embed_text(request: dict):
    text = request.get("text", "")
    vector = get_embedding(text)
    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={"text": text}
    )
    client.upsert(collection_name=COLLECTION_NAME, points=[point])
    return {"message": "Text embedded successfully"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    chunk_size = 500
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    chunks = [c.strip() for c in chunks if len(c.strip()) > 50]
    points = []
    for chunk in chunks:
        vector = get_embedding(chunk)
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={"text": chunk, "source": file.filename}
        ))
    client.upsert(collection_name=COLLECTION_NAME, points=points)
    return {"message": f"Indexed {len(points)} chunks from {file.filename}"}
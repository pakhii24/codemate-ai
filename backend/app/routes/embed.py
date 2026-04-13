# backend/app/routes/embed.py

from fastapi import APIRouter
from app.models.schemas import EmbedRequest
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
def embed_text(request: EmbedRequest):
    vector = get_embedding(request.text)

    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={"text": request.text}
    )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[point]
    )

    return {"message": "Text embedded successfully"}
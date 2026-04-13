# backend/app/services/retrieval.py

from app.services.embedding import get_embedding
from app.db.qdrant import client, COLLECTION_NAME

def retrieve_similar(text: str, limit: int = 3):
    query_vector = get_embedding(text)

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit
    )

    return [point.payload["text"] for point in results.points]
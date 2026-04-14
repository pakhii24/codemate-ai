from app.services.embedding import get_embedding
from app.db.qdrant import client, COLLECTION_NAME

def retrieve_similar(text: str, limit: int = 5):
    try:
        query_vector = get_embedding(text)
        results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit,
            with_payload=True
        )
        scored = sorted(results.points, key=lambda x: x.score, reverse=True)
        filtered = [p for p in scored if p.score > 0.3]
        return [
            {'text': p.payload['text'], 'score': round(p.score, 3)}
            for p in filtered[:3]
        ]
    except Exception:
        return []

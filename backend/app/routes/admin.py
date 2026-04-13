# backend/app/routes/admin.py

from fastapi import APIRouter
from app.database import SessionLocal
from app.models.db_models import Query
from sqlalchemy import func

router = APIRouter()

@router.get("/admin/stats")
def get_stats():
    db = SessionLocal()
    total_queries = db.query(func.count(Query.id)).scalar()
    db.close()
    return {"total_queries": total_queries}


@router.get("/admin/avg-response-time")
def avg_response_time():
    db = SessionLocal()
    avg_time = db.query(func.avg(Query.response_time)).scalar()
    db.close()
    return {"avg_response_time": avg_time}


@router.get("/admin/top-topics")
def top_topics():
    db = SessionLocal()
    queries = db.query(Query.question).all()
    db.close()

    topic_count = {}
    for (q,) in queries:
        words = q.lower().split()
        for word in words:
            if len(word) > 4:
                topic_count[word] = topic_count.get(word, 0) + 1

    sorted_topics = sorted(
        topic_count.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]

    return [{"topic": t, "count": c} for t, c in sorted_topics]
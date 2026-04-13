# backend/app/routes/ask.py

from fastapi import APIRouter
from app.models.schemas import AskRequest
from app.services.rag import generate_answer
from app.database import SessionLocal
from app.models.db_models import Query
import time

router = APIRouter()

@router.post("/ask")
def ask_question(request: AskRequest):
    start_time = time.time()

    answer = generate_answer(request.question)

    end_time = time.time()
    response_time = end_time - start_time

    db = SessionLocal()
    new_query = Query(
        question=request.question,
        answer=answer,
        response_time=response_time
    )
    db.add(new_query)
    db.commit()
    db.refresh(new_query)
    db.close()

    return {
        "answer": answer,
        "query_id": new_query.id
    }


@router.get("/history")
def get_history():
    from app.services.rag import chat_history

    history = []
    for q, a in chat_history:
        history.append({"type": "user", "text": q})
        history.append({
            "type": "bot",
            "text": a,
            "query_id": None
        })

    return history
from fastapi import APIRouter
from app.database import SessionLocal
from app.models.db_models import Feedback
from app.models.schemas import FeedbackRequest

router = APIRouter()

@router.post("/feedback")
def give_feedback(request: FeedbackRequest):
    db = SessionLocal()
    new_feedback = Feedback(
        query_id=request.query_id,
        is_positive=request.is_positive
    )
    db.add(new_feedback)
    db.commit()
    db.close()
    return {"message": "Feedback saved"}
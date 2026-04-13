# backend/app/models/schemas.py

from pydantic import BaseModel

class EmbedRequest(BaseModel):
    text: str

class AskRequest(BaseModel):
    question: str

class FeedbackRequest(BaseModel):
    query_id: int
    is_positive: bool
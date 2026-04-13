# backend/app/models/db_models.py

from sqlalchemy import Column, Integer, Text, Float, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    answer = Column(Text)
    response_time = Column(Float)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer)
    is_positive = Column(Boolean)
    created_at = Column(TIMESTAMP, server_default=func.now())
# backend/test_rag.py

from app.services.rag import generate_answer

query = "How to reverse a linked list?"

answer = generate_answer(query)

print("Answer:\n", answer)
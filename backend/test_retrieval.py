# backend/test_retrieval.py

from app.services.retrieval import retrieve_similar

query = "How to reverse a linked list?"

results = retrieve_similar(query)

print("Results:")
for r in results:
    print("-", r)
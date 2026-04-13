from app.services.embedding import get_embedding

text = "How to reverse a linked list in Python?"

embedding = get_embedding(text)

print("Vector length:", len(embedding))
print("First 5 values:", embedding[:5])
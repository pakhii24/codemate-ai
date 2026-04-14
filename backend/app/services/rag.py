```python
# backend/app/services/rag.py

from groq import Groq
from app.config import GROQ_API_KEY
from app.services.retrieval import retrieve_similar

client = Groq(api_key=GROQ_API_KEY)

chat_history = []

def generate_answer(query: str):
    global chat_history

    context = retrieve_similar(query)
    context_text = "\n".join(context)

    messages = []

    for q, a in chat_history:
        messages.append({"role": "user", "content": q})
        messages.append({"role": "assistant", "content": a})

    messages.append({
        "role": "user",
        "content": f"""
You are a coding assistant.

Use the following context to answer the question.

Context:
{context_text}

Question:
{query}

Answer clearly and concisely.
"""
    })

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages
    )

    answer = response.choices[0].message.content

    chat_history.append((query, answer))

    if len(chat_history) > 5:
        chat_history.pop(0)

    return answer
```
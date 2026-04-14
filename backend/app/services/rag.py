# backend/app/services/rag.py

from groq import Groq
from app.config import GROQ_API_KEY
from app.services.retrieval import retrieve_similar

client = Groq(api_key=GROQ_API_KEY)

chat_history = []

SYSTEM_PROMPT = """You are CodeMate AI 🤖 — a smart, friendly coding assistant!

Your personality:
- Use emojis naturally in responses 🎯
- Be encouraging and enthusiastic about coding 💪
- Break down complex topics clearly

Your rules:
- ALWAYS use the provided context to answer. If context is relevant, use it.
- If the context has no useful info, answer from your own knowledge but say so.
- Never say "I don't have context" — just answer helpfully.
- Format code examples in proper markdown code blocks.
- Keep answers clear, concise and beginner-friendly.
"""

def generate_answer(query: str):
    global chat_history

    context = retrieve_similar(query)
    context_text = "\n".join(context) if context else "No specific context found — answering from general knowledge."

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for q, a in chat_history:
        messages.append({"role": "user", "content": q})
        messages.append({"role": "assistant", "content": a})

    messages.append({
        "role": "user",
        "content": f"""Context:
{context_text}

Question: {query}"""
    })

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
        max_tokens=1024
    )

    answer = response.choices[0].message.content

    chat_history.append((query, answer))

    if len(chat_history) > 10:
        chat_history.pop(0)

    return answer
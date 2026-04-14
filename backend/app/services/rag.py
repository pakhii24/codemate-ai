from groq import Groq
from app.config import GROQ_API_KEY
from app.services.retrieval import retrieve_similar

client = Groq(api_key=GROQ_API_KEY)
chat_history = []

def generate_answer(query: str):
    global chat_history
    context_items = retrieve_similar(query)
    if context_items:
        context_text = '
'.join([f'[Source {i+1}] (relevance: {item["score"]}): {item["text"]}' for i, item in enumerate(context_items)])
        sources = [f'Source {i+1} (score: {item["score"]})' for i, item in enumerate(context_items)]
    else:
        context_text = 'No context available.'
        sources = []
    messages = []
    for q, a in chat_history:
        messages.append({'role': 'user', 'content': q})
        messages.append({'role': 'assistant', 'content': a})
    messages.append({'role': 'user', 'content': f'You are a coding assistant. Use the following context to answer the question. If you use information from the context, mention which source you used.\n\nContext:\n{context_text}\n\nQuestion:\n{query}\n\nAnswer clearly and concisely.'})
    response = client.chat.completions.create(model='llama-3.1-8b-instant', messages=messages)
    answer = response.choices[0].message.content
    chat_history.append((query, answer))
    if len(chat_history) > 5:
        chat_history.pop(0)
    return {'answer': answer, 'sources': sources}

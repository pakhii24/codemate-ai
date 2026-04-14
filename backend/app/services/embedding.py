from fastembed import TextEmbedding

model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def get_embedding(text: str):
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()

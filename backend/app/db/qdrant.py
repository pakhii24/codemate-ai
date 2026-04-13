# backend/app/db/qdrant.py

from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv

load_dotenv()

COLLECTION_NAME = "codemate"

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
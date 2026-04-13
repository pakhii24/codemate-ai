from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv
load_dotenv()

COLLECTION_NAME = 'codemate'

QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
client = QdrantClient(url=QDRANT_URL)

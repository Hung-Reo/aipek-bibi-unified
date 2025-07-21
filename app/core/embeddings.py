from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
import os
import logging
from app.config import OPENAI_API_KEY, USE_OPENAI_EMBEDDINGS, HF_EMBEDDING_MODEL
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            self.embedder = OpenAIEmbeddings(api_key=openai_api_key)
            print("✅ Đã khởi tạo OpenAI Embeddings thành công")
        else:
            print("❌ Không tìm thấy OPENAI_API_KEY")
            raise ValueError("Could not initialize any embeddings service")

    def get_text_embedding(self, text):
        """Tạo embedding cho một văn bản"""
        try:
            return self.embedder.embed_query(text)
        except Exception as e:
            logger.error(f"Error creating embedding: {e}")
            raise

    def get_documents_embeddings(self, documents):
        """Tạo embeddings cho nhiều văn bản"""
        try:
            return self.embedder.embed_documents(documents)
        except Exception as e:
            logger.error(f"Error creating document embeddings: {e}")
            raise


# Singleton instance
embedding_service = EmbeddingService()

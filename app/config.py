import os
from dotenv import load_dotenv
from pathlib import Path

# Tải biến môi trường từ file .env
load_dotenv()

# Thư mục gốc của dự án
BASE_DIR = Path(__file__).resolve().parent.parent

# Cấu hình OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")
OPENAI_MODEL_ADVANCED = os.getenv("OPENAI_MODEL_ADVANCED", "gpt-4.1")
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.5"))

# Cấu hình Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
BIBI_PINECONE_INDEX = os.getenv("BIBI_PINECONE_INDEX", "bibi-chatbot-k12")

# Cấu hình Vector Store
VECTOR_STORE_TYPE = os.getenv("VECTOR_STORE_TYPE", "pinecone")
VECTOR_STORE_PATH = os.path.join(BASE_DIR, "vector_store")
ENABLE_BACKUP = os.getenv("ENABLE_BACKUP", "false").lower() == "true"

# Cấu hình Embeddings
USE_OPENAI_EMBEDDINGS = os.getenv("USE_OPENAI_EMBEDDINGS", "true").lower() == "true"
HF_EMBEDDING_MODEL = os.getenv("HF_EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Cấu hình xử lý tài liệu
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))
CHUNK_SEPARATORS = os.getenv("CHUNK_SEPARATORS", "\n").split(",")

# Cấu hình đường dẫn
DOCUMENT_STORE_PATH = os.getenv("DOCUMENT_STORE_PATH", "document_store")
TEMP_PDF_PATH = os.getenv("TEMP_PDF_PATH", "temp_pdf")
SAMPLE_PDF_PATH = os.getenv("SAMPLE_PDF_PATH", "sample_pdf")

# Định nghĩa các giá trị namespace trước
BIBI_GRAMMAR_NS = "bibi_grammar"

# Định nghĩa namespace cho các loại tài liệu
NAMESPACE_DEFAULT = BIBI_GRAMMAR_NS  # Namespace mặc định
NAMESPACE_SGK = "bibi_sgk"           # Sách giáo khoa Bộ GD
NAMESPACE_CTGD = "bibi_ctgd"         # Chương trình giáo dục 2018
NAMESPACE_OTHERS = "bibi_others"     # Tài liệu đặc trưng Trường

# Cấu hình BiBi - Sử dụng lại cùng giá trị
BIBI_NAMESPACE = BIBI_GRAMMAR_NS
SCHOOL_NAME = "BiBi - Trợ lý AI Giáo dục K12"

# Để tương thích với code
INDEX_DIRECTORY = VECTOR_STORE_PATH

# Mật khẩu admin
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "bibi2025")

# Đảm bảo các thư mục cần thiết tồn tại
os.makedirs(VECTOR_STORE_PATH, exist_ok=True)
os.makedirs(DOCUMENT_STORE_PATH, exist_ok=True)
os.makedirs(TEMP_PDF_PATH, exist_ok=True)
os.makedirs(SAMPLE_PDF_PATH, exist_ok=True)

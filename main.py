# main.py - Unified FastAPI server for BiBi (Backend + Frontend)
# ✅ STRATEGY: Keep 100% of proven backend logic + Add static serving

import sys
import os
import json
import traceback
import uvicorn
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import List, Optional, Dict, Any
from fastapi.responses import StreamingResponse
import openai
from pydantic import BaseModel, Field
from routes.tts import router as tts_router

# Thêm thư mục gốc vào sys.path để import được các module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

# Định nghĩa các namespace mặc định
BIBI_NAMESPACE = "bibi_grammar"
AVAILABLE_NAMESPACES = ["bibi_grammar", "bibi_sgk", "bibi_ctgd", "bibi_others"]

# Import retriever_service từ đường dẫn chính xác
try:
    from app.core.retriever import retriever_service
    from app.config import BIBI_PINECONE_INDEX

    print(f"✅ Đã kết nối thành công với dịch vụ RAG - Pinecone index: {BIBI_PINECONE_INDEX}")
except ImportError as e:
    print(f"❌ Lỗi import retriever_service: {str(e)}")
    raise

# Model cho request từ frontend
class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    model: str = "gpt-4.1"
    temperature: float = 0.7
    max_tokens: int = 2000
    stream: bool = True

# Kiểm tra phiên bản OpenAI
try:
    OPENAI_VERSION = int(openai.__version__.split('.')[0])
    print(f"📌 Đã phát hiện OpenAI API phiên bản: {openai.__version__} (Chính: {OPENAI_VERSION})")
except (ImportError, AttributeError, ValueError):
    OPENAI_VERSION = 0
    print("⚠️ Không thể xác định phiên bản OpenAI API, giả định phiên bản cũ")

# ✅ UNIFIED: Tạo FastAPI app với static serving
app = FastAPI(
    title="BiBi Unified API",
    version="2.0.0",
    description="Unified API cho BiBi - Trợ lý AI Giáo dục K12 (Backend + Frontend)"
)

# ✅ UNIFIED: Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ UNIFIED: Setup templates directory
templates = Jinja2Templates(directory="templates")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Length"],
    max_age=600,
)

# Mount TTS routes
app.include_router(tts_router, prefix="/api/tts", tags=["tts"])

# ===============================
# ✅ STATIC FILE SERVING ROUTES
# ===============================

@app.get("/", response_class=HTMLResponse)
async def serve_home(request: Request):
    """Serve homepage with chatbot selection"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/index.html", response_class=HTMLResponse)
async def serve_index(request: Request):
    """Serve index page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/bots/bibi_lesson_plan.html", response_class=HTMLResponse)
async def serve_lesson_plan(request: Request):
    """Serve lesson plan page"""
    return templates.TemplateResponse("bibi_lesson_plan.html", {"request": request})

@app.get("/bots/bibi_grammar.html", response_class=HTMLResponse)
async def serve_grammar_bot(request: Request):
    """Serve grammar bot page"""
    return templates.TemplateResponse("bibi_grammar.html", {"request": request})

@app.get("/bots/bibi_feedback_admin.html", response_class=HTMLResponse)
async def serve_feedback_admin(request: Request):
    """Serve feedback admin page"""
    return templates.TemplateResponse("bibi_feedback_admin.html", {"request": request})

# ===============================
# ✅ API ENDPOINTS (100% PRESERVED)
# ===============================

@app.get("/api/health")
async def health_check():
    """Kiểm tra trạng thái API và kết nối Pinecone"""
    try:
        # Kiểm tra kết nối đến Pinecone nhưng không trả về object phức tạp
        try:
            vector_count = retriever_service.get_vector_count()
            is_connected = True
        except Exception as e:
            vector_count = 0
            is_connected = False

        return {
            "status": "ok",
            "message": "BiBi RAG API đang hoạt động",
            "version": "2.0.0",
            "mode": "unified",
            "pinecone_index": BIBI_PINECONE_INDEX,
            "default_namespace": BIBI_NAMESPACE,
            "pinecone_stats": {
                "is_connected": is_connected,
                "vector_count": vector_count,
                "namespaces": AVAILABLE_NAMESPACES
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Lỗi kết nối Pinecone: {str(e)}"
        }

@app.get("/api/rag")
async def search_documents(
    query: str = Query(..., description="Search query"),
    namespace: str = Query(BIBI_NAMESPACE, description="Namespace to search in"),
    top_k: int = Query(5, description="Number of results to return"),
    search_all: bool = Query(False, description="Search all namespaces")
):
    """Tìm kiếm tài liệu với truy vấn"""
    try:
        print(f"🔍 API Search: query='{query}', namespace={namespace}, top_k={top_k}")
        
        if search_all:
            print(f"🔄 Tìm kiếm trên tất cả namespace: {AVAILABLE_NAMESPACES}")
            docs = retriever_service.search_multiple_namespaces(
                query,
                namespaces=AVAILABLE_NAMESPACES,
                top_k=top_k
            )
        else:
            print(f"🔄 Tìm kiếm trong namespace: {namespace}")
            docs = retriever_service.search(query, top_k=top_k, namespace=namespace)

        # Nếu không có kết quả, thử tìm trong tất cả các namespace
        if not docs and not search_all:
            print(f"⚠️ Không tìm thấy kết quả trong namespace {namespace}. Thử tìm trong tất cả namespace.")
            docs = retriever_service.search_multiple_namespaces(
                query,
                namespaces=AVAILABLE_NAMESPACES,
                top_k=top_k
            )

        # Chuyển đổi kết quả
        results = []
        for doc in docs:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata
            })

        print(f"✅ Tìm thấy {len(results)} kết quả cho '{query}'")

        return JSONResponse(
            content={
                "status": "success",
                "query": query,
                "namespace": namespace,
                "results": results
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"❌ Lỗi: {str(e)}")
        print(error_trace)

        return {
            "status": "error",
            "message": str(e),
            "traceback": error_trace
        }

@app.post("/api/chat")
async def chat_stream(request: Request):
    """
    API endpoint xử lý streaming response từ OpenAI
    Hỗ trợ cả hai phiên bản API (cũ và mới)
    """
    try:
        # Đọc dữ liệu từ request
        body = await request.json()
        messages = body.get("messages", [])
        model = body.get("model", "gpt-4")
        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("max_tokens", 2000)

        print(f"📨 Nhận yêu cầu API chat với: model={model}, messages={len(messages)}")

        # Đảm bảo API key được thiết lập
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("⚠️ OPENAI_API_KEY không được thiết lập trong biến môi trường")
            raise ValueError("API key không được cấu hình")

        def stream_generator():
            try:
                print(f"🔄 Sử dụng OpenAI API phiên bản: {'mới (v1)' if OPENAI_VERSION >= 1 else 'cũ'}")

                if OPENAI_VERSION >= 1:  # Phiên bản mới (v1)
                    # Khởi tạo client theo cách mới
                    client = openai.OpenAI(api_key=api_key)
                    response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True
                    )

                    print("✅ Bắt đầu streaming từ OpenAI (phiên bản mới)...")

                    # Xử lý stream phiên bản mới
                    for chunk in response:
                        if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"
                else:  # Phiên bản cũ
                    # Thiết lập API key theo cách cũ
                    openai.api_key = api_key
                    # DEPRECATED: Old API no longer needed
                    # Use new API syntax instead
                    client = openai.OpenAI(api_key=api_key)
                    response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True
                    )

                    print("✅ Bắt đầu streaming từ OpenAI (phiên bản cũ)...")

                    # Xử lý stream phiên bản cũ
                    for chunk in response:
                        if "choices" in chunk and len(chunk["choices"]) > 0:
                            if "delta" in chunk["choices"][0] and "content" in chunk["choices"][0]["delta"]:
                                content = chunk["choices"][0]["delta"]["content"]
                                if content:
                                    yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"

                # Kết thúc stream
                yield "data: [DONE]\n\n"
                print("✅ Streaming hoàn tất")

            except Exception as e:
                print(f"❌ Lỗi streaming từ OpenAI: {str(e)}")
                error_json = json.dumps({"error": {"message": str(e)}})
                yield f"data: {error_json}\n\n"
                yield "data: [DONE]\n\n"

        # Trả về streaming response
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Ngăn Nginx buffer response
            }
        )

    except Exception as e:
        print(f"❌ Lỗi xử lý request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e)
            }
        )

# Chỉ chạy khi gọi trực tiếp file này
if __name__ == "__main__":
    # ✅ UNIFIED: Chạy trên port từ environment hoặc default 8000
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Khởi động BiBi Unified server trên cổng {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

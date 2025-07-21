# app/core/streaming_direct.py
import logging
import traceback
import time
import os
import threading
from typing import List, Dict, Any, Callable, Optional
from openai import OpenAI  # Cách import mới cho OpenAI v1
from langchain.schema import Document
from app.core.prompt_manager import prompt_manager  # Import prompt manager
from app.config import SCHOOL_NAME  # Import tên trường từ config

logger = logging.getLogger(__name__)


class DirectOpenAIStreamer:
    """Lớp xử lý streaming trực tiếp qua OpenAI API, không qua LangChain."""

    def __init__(self, openai_api_key: str, model: str = "gpt-4.1"):
        """Khởi tạo với API key và model."""
        self.openai_api_key = openai_api_key
        self.model = model
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Khởi tạo DirectOpenAIStreamer với model {model}")

        # Tạo client OpenAI (cách mới)
        self.client = OpenAI(api_key=openai_api_key)

    def format_docs(self, docs: List[Document]) -> str:
        """Format danh sách documents thành text."""
        # Sử dụng prompt_manager để format docs
        return prompt_manager.format_docs_context(docs, "Vietnamese")

    def stream(self, question: str, docs: List[Document], callback: Callable[[str], None],
               stop_event: Optional[threading.Event] = None) -> None:
        """Stream phản hồi từ OpenAI API trực tiếp."""
        try:
            self.logger.info(f"Bắt đầu streaming trực tiếp cho câu hỏi: {question}")

            # Import prompt_manager
            from app.core.prompt_manager import prompt_manager
            from app.config import SCHOOL_NAME

            # Phát hiện ngôn ngữ với phương thức cải tiến
            language = prompt_manager.detect_language(question)
            self.logger.info(f"Phát hiện ngôn ngữ câu hỏi: {language}")
            self.logger.info(f"Text câu hỏi: '{question}'")

            # Thêm kiểm tra đặc biệt cho các từ khóa tiếng Anh cụ thể
            english_keywords = ["make", "summary", "information", "explain", "tell me about"]
            if any(keyword in question.lower() for keyword in english_keywords) and "Vietnamese" == language:
                self.logger.warning(f"Phát hiện từ khóa tiếng Anh nhưng ngôn ngữ được xác định là tiếng Việt")
                self.logger.warning(f"Ghi đè ngôn ngữ thành tiếng Anh")
                language = "English"

            # Format context
            context = self.format_docs(docs)
            self.logger.info(f"Đã tạo context, độ dài: {len(context)}")

            # Lấy system prompt từ prompt_manager
            system_content = prompt_manager.get_system_prompt(language, SCHOOL_NAME)

            # Tạo prompt
            prompt = prompt_manager.format_docs_context(docs, language) + f"\n\nCâu hỏi: {question}\n\nCâu trả lời:"

            # Gửi thông báo đang xử lý
            callback("Đang tìm kiếm thông tin...")

            # Tạo completion request sử dụng OpenAI API v1.0
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                stream=True
            )

            # Xử lý kết quả streaming
            for chunk in stream:
                # Kiểm tra nếu cần dừng
                if stop_event and stop_event.is_set():
                    self.logger.info("Nhận tín hiệu dừng streaming")
                    break

                if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    self.logger.debug(f"Nhận được token: '{token}'")
                    callback(token)

            # Gửi token kết thúc nếu chưa bị dừng
            if not (stop_event and stop_event.is_set()):
                callback("[DONE]")
                self.logger.info("Streaming hoàn tất")

        except Exception as e:
            self.logger.error(f"Lỗi trong streaming trực tiếp: {e}")
            self.logger.error(traceback.format_exc())
            callback(f"[ERROR] {str(e)}")
            callback("[DONE]")

# app/core/prompt_manager.py
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class PromptManager:
    """Lớp quản lý tập trung các prompt cho chatbot."""

    @staticmethod
    def get_system_prompt(language: str = "Vietnamese", school_name: str = "Petrus Ký") -> str:
        """
        Trả về system prompt dựa trên ngôn ngữ và tên trường.

        Args:
            language: Ngôn ngữ của prompt ("Vietnamese" hoặc "English")
            school_name: Tên trường để đưa vào prompt

        Returns:
            Chuỗi prompt hoàn chỉnh
        """
        if language == "English":
            return (
                f"You are an information assistant for {school_name} School. You ONLY answer questions related to the school. "
                f"You MUST NOT answer any questions unrelated to the school like weather, news, etc. "
                f"You ONLY use information provided in the documents, DO NOT add external information. "
                f"If the documents don't have enough information to answer, ALWAYS guide the user "
                f"to visit the school's official website at: https://pek.edu.vn/vi/ "
                f"or the contact page at: https://pek.edu.vn/vi/contact/ for the most accurate information."
                f"YOU MUST FOLLOW THIS FORMATTING IN ALL RESPONSES: "
                f"1. Start with a friendly greeting with emoji 👋 or 🙋‍♂️ "
                f"2. Use '## Heading' for main sections in your response with appropriate emojis: "
                f"   - General school information: 🏫 "
                f"   - Curriculum/Programs: 📚 "
                f"   - Tuition/Fees: 💰 "
                f"   - Admissions: 📝 "
                f"   - Facilities: 🏢 "
                f"   - Extracurricular activities: 🎭 "
                f"   - Academic achievements: 🏆 "
                f"   - Teaching staff: 👨‍🏫 "
                f"   - Schedule/Timing: ⏰ "
                f"   - Transportation: 🚌 "
                f"   - Meals/Nutrition: 🍽️ "
                f"   - Boarding/Accommodation: 🏠 "
                f"3. Use **bold** for ALL important keywords "
                f"4. Use bullet points (- or *) to list ALL related items "
                f"5. End with a friendly closing with emoji 😊 or 👍 "
                f"ABSOLUTELY DO NOT respond with plain text without formatting! "
                f"IMPORTANT: You MUST respond in English."
            )
        else:  # Vietnamese
            return (
                f"Bạn là trợ lý thông tin của Trường {school_name}. Bạn CHỈ trả lời các câu hỏi liên quan đến trường học. "
                f"Bạn KHÔNG được trả lời bất kỳ câu hỏi nào không liên quan đến trường như thời tiết, tin tức, v.v. "
                f"Bạn CHỈ sử dụng thông tin có trong tài liệu được cung cấp, KHÔNG thêm thông tin từ bên ngoài. "
                f"Nếu tài liệu không có thông tin đủ để trả lời, hãy LUÔN LUÔN hướng dẫn người dùng "
                f"truy cập website chính thức của trường tại: https://pek.edu.vn/vi/ "
                f"hoặc trang liên hệ tại: https://pek.edu.vn/vi/contact/ để có thông tin chính xác nhất. "
                f"BẮT BUỘC PHẢI TUÂN THỦ ĐỊNH DẠNG SAU ĐÂY TRONG MỌI CÂU TRẢ LỜI: "
                f"1. Bắt đầu bằng lời chào thân thiện với emoji 👋 hoặc 🙋‍♂️ "
                f"2. Sử dụng '## Tiêu đề' cho các phần chính trong câu trả lời và thêm emoji phù hợp theo chủ đề: "
                f"   - Thông tin chung về trường: 🏫 "
                f"   - Chương trình học: 📚 "
                f"   - Học phí/tài chính: 💰 "
                f"   - Tuyển sinh/nhập học: 📝 "
                f"   - Cơ sở vật chất: 🏢 "
                f"   - Hoạt động ngoại khóa: 🎭 "
                f"   - Thành tích học tập: 🏆 "
                f"   - Đội ngũ giáo viên: 👨‍🏫 "
                f"   - Lịch học/thời gian: ⏰ "
                f"   - Xe đưa rước: 🚌 "
                f"   - Ăn uống/dinh dưỡng: 🍽️ "
                f"   - Nội/bán trú: 🏠 "
                f"3. Dùng **in đậm** cho TẤT CẢ các từ khóa quan trọng "
                f"4. Dùng dấu gạch đầu dòng (- hoặc *) để liệt kê TẤT CẢ các điểm liên quan "
                f"5. Kết thúc bằng lời chào hoặc lời nhắn thân thiện với emoji 😊 hoặc 👍 "
                f"TUYỆT ĐỐI KHÔNG được trả lời dạng văn bản thông thường không có định dạng! "
                f"QUAN TRỌNG: Bạn PHẢI trả lời bằng tiếng Việt."
            )

    @staticmethod
    def format_docs_context(docs, language: str = "Vietnamese") -> str:
        """
        Định dạng danh sách documents thành context để đưa vào prompt.

        Args:
            docs: Danh sách document từ retriever
            language: Ngôn ngữ của prompt

        Returns:
            Chuỗi context đã định dạng
        """
        if language == "English":
            header = "Below is information from the school's documents:\n\n"
        else:
            header = "Dưới đây là thông tin từ tài liệu của trường:\n\n"

        formatted = "\n\n".join(
            f"Extract {i + 1}:\n{doc.page_content}\nSource: {doc.metadata.get('source', 'Unknown')}"
            if language == "English" else
            f"Trích đoạn {i + 1}:\n{doc.page_content}\nNguồn: {doc.metadata.get('source', 'Không rõ')}"
            for i, doc in enumerate(docs)
        )

        return header + formatted

    @staticmethod
    def detect_language(text: str) -> str:
        """
        Phát hiện ngôn ngữ của văn bản đầu vào - phiên bản cải tiến.

        Args:
            text: Văn bản cần phát hiện ngôn ngữ

        Returns:
            "English" hoặc "Vietnamese"
        """
        # Kiểm tra tiếng Anh bằng từ điển mở rộng
        english_words = ["the", "is", "are", "what", "where", "when", "how", "why", "who", "which", "school",
                         "have", "about", "please", "can", "you", "tell", "me", "your", "do", "make", "summary",
                         "information", "help", "get", "need", "want", "know", "learn", "provide", "give", "show",
                         "explain", "detail", "for", "to", "of", "in", "on", "with", "by", "at", "from", "as", "an",
                         "and", "or", "but", "if", "this", "that", "these", "those", "my", "our", "their", "his",
                         "her", "its"]

        # Kiểm tra tiếng Việt bằng ký tự đặc trưng
        vietnamese_chars = ['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư', 'á', 'à', 'ả', 'ã', 'ạ', 'é', 'è', 'ẻ', 'ẽ', 'ẹ',
                            'í', 'ì', 'ỉ', 'ĩ', 'ị', 'ó', 'ò', 'ỏ', 'õ', 'ọ', 'ú', 'ù', 'ủ', 'ũ', 'ụ', 'ý', 'ỳ',
                            'ỷ', 'ỹ', 'ỵ']

        vietnamese_count = sum(1 for char in text if char.lower() in vietnamese_chars)
        english_count = sum(1 for word in text.lower().split() if word in english_words)

        # Quyết định ngôn ngữ với logic cải tiến
        if vietnamese_count > 0:
            # Nếu có ký tự tiếng Việt đặc trưng, cao khả năng là tiếng Việt
            return "Vietnamese"
        elif english_count >= 1 and len(text.split()) >= 3 and vietnamese_count == 0:
            # Nếu có ít nhất 1 từ tiếng Anh phổ biến, tổng độ dài ít nhất 3 từ,
            # và không có ký tự tiếng Việt đặc trưng
            return "English"
        else:
            # Phân tích cấu trúc câu
            text_lower = text.lower()
            # Các mẫu cấu trúc câu tiếng Anh phổ biến
            english_patterns = [
                "can you", "could you", "please", "what is", "how to", "where is", "when is",
                "why is", "who is", "which", "tell me", "explain", "describe", "show me", "help me",
                "i want", "i need", "summary", "information about", "details on", "make"
            ]

            if any(pattern in text_lower for pattern in english_patterns):
                return "English"
            else:
                # Kiểm tra tỷ lệ từ tiếng Anh
                words = text_lower.split()
                if len(words) > 0:
                    english_word_ratio = english_count / len(words)
                    if english_word_ratio > 0.3:  # Nếu hơn 30% từ là tiếng Anh phổ biến
                        return "English"
                    else:
                        return "Vietnamese"  # Mặc định là tiếng Việt
                else:
                    return "Vietnamese"

# Tạo instance singleton để sử dụng trong toàn bộ ứng dụng
prompt_manager = PromptManager()

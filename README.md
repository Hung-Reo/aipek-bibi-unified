# 🎓 BiBi - Trợ lý AI Giáo dục (Phiên bản Tích hợp)

## 📋 Tổng quan Dự án

**BiBi** là trợ lý giáo dục được hỗ trợ bởi AI, được thiết kế đặc biệt cho việc giảng dạy tiếng Anh K12 tại Việt Nam. Phiên bản tích hợp này kết hợp cả dịch vụ frontend và backend thành một ứng dụng FastAPI duy nhất, giảm chi phí triển khai và độ phức tạp.

### 🎯 Tính năng Chính

- **📚 Tạo Giáo án**: Tự động tạo giáo án tiếng Anh chi tiết cho lớp 6
- **📖 Nội dung Bổ sung**: Bài tập và hoạt động bổ sung để củng cố kỹ năng
- **📝 Bài Ôn tập**: Tài liệu ôn tập toàn diện bao gồm nhiều unit
- **🎭 Hoạt động Ngoại khóa**: Hoạt động sáng tạo ngoài nội dung sách giáo khoa
- **🧪 Tạo Đề kiểm tra**: Tạo đề kiểm tra động với thành phần âm thanh
- **🎵 Chuyển Văn bản thành Giọng nói**: Tạo âm thanh chuyên nghiệp sử dụng OpenAI TTS
- **📤 Chức năng Xuất file**: Xuất Word/PDF với định dạng chuyên nghiệp
- **🔍 Tích hợp RAG**: Tăng cường truy xuất nội dung từ 3 cơ sở tri thức

## 🏗️ Kiến trúc

### **Ứng dụng FastAPI Tích hợp**
- **Backend**: Python FastAPI với hệ thống RAG
- **Frontend**: HTML/CSS/JS tĩnh được phục vụ bởi FastAPI
- **Cơ sở dữ liệu**: Cơ sở dữ liệu vector Pinecone (3 namespace)
- **Dịch vụ AI**: Tích hợp OpenAI GPT + TTS
- **Quản lý File**: Hệ thống dọn dẹp âm thanh tự động

### **Cấu trúc Dự án**
```
📁 BiBi_Unified/
├── 📄 main.py                    # 🚀 Máy chủ FastAPI chính
├── 📄 requirements.txt           # 📦 Dependencies
├── 📄 Procfile                   # 🚀 Cấu hình triển khai
├── 📄 .env                       # 🔐 Biến môi trường
├── 📁 app/                       # 🧠 Ứng dụng cốt lõi
│   ├── 📁 core/                  # ⚙️ Tiện ích cốt lõi
│   ├── 📁 services/              # 🔧 Dịch vụ nghiệp vụ
│   └── 📁 models/                # 📊 Mô hình dữ liệu
├── 📁 routes/                    # 🛣️ Routes API
│   └── 📄 tts.py                 # 🎵 Endpoints TTS
├── 📁 static/                    # 🎨 Tài nguyên Frontend
│   ├── 📁 css/                   # 🎨 Stylesheets
│   ├── 📁 js/                    # 🧠 JavaScript
│   └── 📁 images/                # 🖼️ Hình ảnh tĩnh
└── 📁 templates/                 # 📄 Templates HTML
```

## 🚀 Bắt đầu Nhanh

### **Yêu cầu Trước**
- Python 3.11+
- OpenAI API Key
- Pinecone API Key

### **Phát triển Cục bộ**
```bash
# 1. Clone repository
git clone https://github.com/Hung-Reo/aipek-bibi-unified.git
cd aipek-bibi-unified

# 2. Tạo môi trường ảo
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate

# 3. Cài đặt dependencies
pip install -r requirements.txt

# 4. Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn

# 5. Chạy máy chủ phát triển
uvicorn main:app --reload --port 8000
```

### **Biến Môi trường**
```bash
OPENAI_API_KEY=sk-proj-your-key-here
PINECONE_API_KEY=pcsk_your-key-here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=bibi-chatbot-k12
PORT=8000
```

## 🌐 Triển khai Production

### **Triển khai Render.com**
```bash
# Lệnh Build
pip install -r requirements.txt

# Lệnh Start
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### **Thiết lập Môi trường**
1. Thêm tất cả biến môi trường trong dashboard Render
2. Bật auto-deploy từ nhánh main
3. Cấu hình domain tùy chỉnh (tùy chọn)

## 🎯 API Endpoints

### **Tạo Nội dung**
- `POST /api/generate` - Tạo giáo án
- `POST /api/generate_supplementary` - Tạo nội dung bổ sung
- `POST /api/generate_review` - Tạo bài ôn tập
- `POST /api/generate_extracurricular` - Tạo hoạt động ngoại khóa

### **Tạo Đề kiểm tra**
- `POST /api/generate_test` - Tạo đề kiểm tra động
- `POST /api/tts/generate` - Tạo file âm thanh
- `GET /api/tts/voices` - Liệt kê giọng có sẵn

### **Tiện ích**
- `GET /api/health` - Kiểm tra tình trạng
- `POST /api/rag/status` - Trạng thái hệ thống RAG
- `GET /api/export/{format}` - Xuất nội dung

## 🔧 Công nghệ Chính

### **Stack Backend**
- **FastAPI**: Framework web Python hiện đại
- **Langchain**: Framework ứng dụng LLM
- **Pinecone**: Cơ sở dữ liệu vector cho RAG
- **OpenAI**: Dịch vụ GPT-4 + TTS
- **Pydantic**: Xác thực dữ liệu

### **Stack Frontend**
- **Vanilla JavaScript**: Modules ES6
- **Bootstrap**: Framework UI
- **Chart.js**: Trực quan hóa dữ liệu
- **CSS Tùy chỉnh**: Thiết kế responsive hiện đại

### **Stack AI/ML**
- **Hệ thống RAG**: 3 cơ sở tri thức (SGK, Chương trình, Templates)
- **Tạo Nội dung**: Prompts phù hợp chương trình
- **Hệ thống TTS**: Tạo âm thanh chuyên nghiệp
- **Kiểm soát Chất lượng**: Xác thực nội dung tự động

## 📊 Chỉ số Hiệu suất

### **Thời gian Phản hồi**
- **Tạo Nội dung**: 25-30s (tối ưu từ 122s)
- **Tỷ lệ Thành công RAG**: 95%+ (tăng từ 33%)
- **Tạo Âm thanh**: 10-15s mỗi đoạn hội thoại
- **Tốc độ Xuất**: <5s cho Word/PDF

### **Tối ưu Chi phí**
- **Trước đây**: $14/tháng (2 dịch vụ riêng biệt)
- **Hiện tại**: $7/tháng (dịch vụ tích hợp)
- **Tiết kiệm**: Giảm 50% chi phí

## 🎓 Giá trị Giáo dục

### **Dành cho Giáo viên**
- ⏰ **Tiết kiệm Thời gian**: 2+ giờ → 30 phút chuẩn bị bài
- 📚 **Nội dung Chất lượng**: Tài liệu chuyên nghiệp, phù hợp chương trình
- 🎵 **Tài liệu Âm thanh**: Bài tập nghe sẵn sàng sử dụng
- 📄 **Sẵn sàng Xuất**: Word/PDF để sử dụng ngay trong lớp

### **Dành cho Học sinh**
- 🎯 **Phù hợp Lứa tuổi**: Nội dung được điều chỉnh cho lớp 6
- 🎧 **Học Âm thanh**: Ví dụ phát âm chuyên nghiệp
- 📝 **Độ khó Tăng dần**: Phương pháp học có bậc
- 🎮 **Hoạt động Hấp dẫn**: Bài tập tương tác và sáng tạo

## 🔒 Bảo mật & Quyền riêng tư

- **Bảo vệ API Key**: Cấu hình biến môi trường
- **Quyền riêng tư Dữ liệu**: Không lưu trữ dữ liệu học sinh
- **Triển khai An toàn**: Bắt buộc HTTPS
- **Giới hạn Tỷ lệ**: Ngăn chặn lạm dụng API

## 📈 Giám sát & Phân tích

### **Giám sát Tình trạng**
- Trạng thái hệ thống RAG theo thời gian thực
- Theo dõi thời gian phản hồi API
- Giám sát tỷ lệ lỗi
- Phân tích sử dụng tài nguyên

### **Chỉ số Chất lượng**
- Xác thực độ dài nội dung (15,000+ ký tự)
- Chấm điểm phù hợp chương trình
- Tích hợp phản hồi người dùng
- Đo lường hiệu suất

## 🛠️ Hướng dẫn Phát triển

### **Tiêu chuẩn Chất lượng Code**
- **Giới hạn Kích thước File**: <500 dòng mỗi file
- **Kiến trúc Modular**: Tách biệt rõ ràng
- **Kiểm thử Toàn diện**: Unit + integration tests
- **Tài liệu**: Comments inline + docs bên ngoài

## 📞 Hỗ trợ & Liên hệ

### **Tư vấn Giáo dục**
- **Đào tạo**: Chương trình đào tạo giáo viên có sẵn
- **Triển khai**: Hỗ trợ triển khai toàn trường
- **Tùy chỉnh**: Điều chỉnh theo môn học cụ thể

## 🙏 Lời cảm ơn

- **Bộ Giáo dục Việt Nam**: Tiêu chuẩn và hướng dẫn chương trình
- **OpenAI**: Dịch vụ GPT-4 và TTS
- **Pinecone**: Cơ sở hạ tầng cơ sở dữ liệu vector
- **Đối tác Giáo dục**: Giáo viên và trường học cung cấp phản hồi

---

**🎯 Sẵn sàng cho Production | 📚 Xuất sắc Giáo dục | 🚀 Đổi mới được Hỗ trợ AI**

*Được xây dựng với ❤️ cho Giáo dục K12 Việt Nam*
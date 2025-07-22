# 🎓 BiBi - AI Educational Assistant (Unified Version)

## 📋 Project Overview

**BiBi** is an AI-powered educational assistant specifically designed for K12 English teaching in Vietnam. This unified version combines both frontend and backend services into a single FastAPI application, reducing deployment costs and complexity.

### 🎯 Key Features

- **📚 Lesson Plan Generation**: Automated creation of detailed English lesson plans for Grade 6
- **📖 Supplementary Content**: Additional exercises and activities for skill reinforcement  
- **📝 Review Lessons**: Comprehensive review materials covering multiple units
- **🎭 Extracurricular Activities**: Creative activities beyond textbook content
- **🧪 Test Generation**: Dynamic test creation with audio components
- **🎵 Text-to-Speech**: Professional audio generation using OpenAI TTS
- **📤 Export Functions**: Word/PDF export with professional formatting
- **🔍 RAG Integration**: Enhanced content retrieval from 3 knowledge bases

## 🏗️ Architecture

### **Unified FastAPI Application**
- **Backend**: Python FastAPI with RAG system
- **Frontend**: Static HTML/CSS/JS served by FastAPI
- **Database**: Pinecone vector database (3 namespaces)
- **AI Services**: OpenAI GPT + TTS integration
- **File Management**: Automated audio cleanup system

### **Project Structure**
```
📁 BiBi_Unified/
├── 📄 main.py                    # 🚀 Main FastAPI server
├── 📄 requirements.txt           # 📦 Dependencies
├── 📄 Procfile                   # 🚀 Deployment config
├── 📄 .env                       # 🔐 Environment variables
├── 📁 app/                       # 🧠 Core application
│   ├── 📁 core/                  # ⚙️ Core utilities
│   ├── 📁 services/              # 🔧 Business services
│   └── 📁 models/                # 📊 Data models
├── 📁 routes/                    # 🛣️ API routes
│   └── 📄 tts.py                 # 🎵 TTS endpoints
├── 📁 static/                    # 🎨 Frontend assets
│   ├── 📁 css/                   # 🎨 Stylesheets
│   ├── 📁 js/                    # 🧠 JavaScript
│   └── 📁 images/                # 🖼️ Static images
└── 📁 templates/                 # 📄 HTML templates
```

## 🚀 Quick Start

### **Prerequisites**
- Python 3.11+
- OpenAI API Key
- Pinecone API Key

### **Local Development**
```bash
# 1. Clone repository
git clone https://github.com/Hung-Reo/aipek-bibi-unified.git
cd aipek-bibi-unified

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. Run development server
uvicorn main:app --reload --port 8000
```

### **Environment Variables**
```bash
OPENAI_API_KEY=sk-proj-your-key-here
PINECONE_API_KEY=pcsk_your-key-here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=bibi-chatbot-k12
PORT=8000
```

## 🌐 Production Deployment

### **Render.com Deployment**
```bash
# Build Command
pip install -r requirements.txt

# Start Command  
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### **Environment Setup**
1. Add all environment variables in Render dashboard
2. Enable auto-deploy from main branch
3. Configure custom domain (optional)

## 🎯 API Endpoints

### **Content Generation**
- `POST /api/generate` - Generate lesson plans
- `POST /api/generate_supplementary` - Generate supplementary content
- `POST /api/generate_review` - Generate review lessons
- `POST /api/generate_extracurricular` - Generate extracurricular activities

### **Test Generation**
- `POST /api/generate_test` - Generate dynamic tests
- `POST /api/tts/generate` - Generate audio files
- `GET /api/tts/voices` - List available voices

### **Utilities**
- `GET /api/health` - Health check
- `POST /api/rag/status` - RAG system status
- `GET /api/export/{format}` - Export content

## 🔧 Key Technologies

### **Backend Stack**
- **FastAPI**: Modern Python web framework
- **Langchain**: LLM application framework
- **Pinecone**: Vector database for RAG
- **OpenAI**: GPT-4.1 + TTS services
- **Pydantic**: Data validation

### **Frontend Stack**
- **Vanilla JavaScript**: ES6 modules
- **Bootstrap**: UI framework
- **Chart.js**: Data visualization
- **Custom CSS**: Modern responsive design

### **AI/ML Stack**
- **RAG System**: 3 knowledge bases (SGK, Curriculum, Templates)
- **Content Generation**: Curriculum-aligned prompts
- **TTS System**: Professional audio generation
- **Quality Control**: Automated content validation

## 📊 Performance Metrics

### **Response Times**
- **Content Generation**: 25-30s (optimized from 122s)
- **RAG Success Rate**: 95%+ (up from 33%)
- **Audio Generation**: 10-15s per dialogue
- **Export Speed**: <5s for Word/PDF

## 🎓 Educational Value

### **For Teachers**
- ⏰ **Time Saving**: 3+ hours → 30 minutes lesson prep
- 📚 **Quality Content**: Professional, curriculum-aligned materials
- 🎵 **Audio Materials**: Ready-to-use listening exercises
- 📄 **Export Ready**: Word/PDF for immediate classroom use

### **For Students**
- 🎯 **Grade-Appropriate**: Content tailored for Grade 6 level
- 🎧 **Audio Learning**: Professional pronunciation examples
- 📝 **Progressive Difficulty**: Scaffolded learning approach
- 🎮 **Engaging Activities**: Interactive and creative exercises

## 🔒 Security & Privacy

- **API Key Protection**: Environment variable configuration
- **Data Privacy**: No student data storage
- **Secure Deployment**: HTTPS enforcement
- **Rate Limiting**: API abuse prevention

## 📈 Monitoring & Analytics

### **Health Monitoring**
- Real-time RAG system status
- API response time tracking
- Error rate monitoring
- Resource usage analytics

### **Quality Metrics**
- Content length validation (15,000+ characters)
- Curriculum alignment scoring
- User feedback integration
- Performance benchmarking

## 🛠️ Development Guidelines

### **Contributing**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support & Contact

### **Educational Inquiry**
- **Training**: Teacher training programs available
- **Implementation**: School-wide deployment support
- **Customization**: Subject-specific adaptations

## 📄 License

This is public PJT and tried to work with LLM Claude to generated codes as Viber coding, and this is working. This can be used for everyone interesting in specially for Vietnam Teacher focus with RAG based from VN education purposes only.

## 🙏 Acknowledgments

- **Ministry of Education Vietnam**: Curriculum standards and guidelines
- **OpenAI**: GPT-4.1 and TTS services
- **Pinecone**: Vector database infrastructure
- **Educational Partners**: Teachers and schools providing feedback

---

**🎯 Ready for Production | 📚 Educational Excellence | 🚀 AI-Powered Innovation**

*Built with ❤️ for Vietnamese K12 Education*
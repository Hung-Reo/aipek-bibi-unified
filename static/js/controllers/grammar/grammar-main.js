// Thêm vào cuối file grammar-main.js
// Biến toàn cục để kiểm soát cache
window.bibiSkipCache = localStorage.getItem('bibi_skip_cache') === 'true';

// Hàm để bật/tắt cache từ console
window.toggleBiBiCache = function() {
  window.bibiSkipCache = !window.bibiSkipCache;
  localStorage.setItem('bibi_skip_cache', window.bibiSkipCache);
  console.log(`Cache đã được ${window.bibiSkipCache ? 'TẮT' : 'BẬT'}`);
  return `Cache hiện đang ${window.bibiSkipCache ? 'TẮT' : 'BẬT'}`;
};

console.log(`Để bật/tắt cache, mở console và gõ: toggleBiBiCache()`);

// Module chính điều phối tất cả
import { GRAMMAR_PROMPTS } from './grammar-prompts.js';
import { GrammarCache } from './grammar-cache.js';
import { GrammarUI } from './grammar-ui.js';
import { GrammarAPI } from './grammar-api.js';
// Thêm import feedback vào phần đầu file
import { FeedbackManager } from '../feedback.js';

// SỬA: Thay thế import trực tiếp bằng biến và import động
// TRƯỚC: import { GrammarChat } from '../static/js/controllers/grammar-chat.js';
// Khai báo biến GrammarChat để sử dụng sau
let GrammarChat;

// Thử tải GrammarChat từ window hoặc từ import động
try {
  setTimeout(() => {
    if (window.GrammarChat) {
      GrammarChat = window.GrammarChat;
      console.log('✅ Đã nhận GrammarChat từ window');
    }
  }, 500);
} catch (e) {
  console.warn('⚠️ Lỗi khi kiểm tra GrammarChat:', e);
}

export class GrammarController {
  constructor() {
    // Khởi tạo các thành phần
    console.log('🔧 GrammarController khởi tạo thành công');
    
    // Xác định chế độ UI
    this.uiMode = window.uiModeManager ? window.uiModeManager.getCurrentMode() : 'modern';
    console.log(`🎨 UI Mode: ${this.uiMode}`);
    
    // Khởi tạo UI với thông tin về chế độ giao diện
    this.ui = new GrammarUI('grammar-output', 'loading-indicator', this.uiMode);
    this.api = new GrammarAPI();
    this.selectedLanguage = 'vi';
    this.lastTopic = null; // Thêm biến lưu trữ chủ đề cuối cùng
    
    // Lấy tham chiếu đến các phần tử DOM
    this.grammarTopic = document.getElementById('grammar-topic');
    this.grammarQuery = document.getElementById('grammar-query');
    this.langViBtn = document.getElementById('lang-vi');
    this.langEnBtn = document.getElementById('lang-en');
    this.langBothBtn = document.getElementById('lang-both');
    
    // Khởi tạo FeedbackManager và gán vào window
    window.feedbackManager = new FeedbackManager();
    console.log('🔄 FeedbackManager đã được khởi tạo');

    // Sửa phần khởi tạo GrammarChat
    try {
      // Thử khởi tạo ngay
      if (typeof GrammarChat !== 'undefined') {
        this.chat = new GrammarChat(this, { maxQuestions: 5 });
        console.log('🗨️ Chat feature initialized immediately');
      } else {
        // Chờ một chút và thử lại (đề phòng module được tải sau)
        console.log('⏳ Waiting for GrammarChat module...');
        setTimeout(() => {
          if (typeof GrammarChat !== 'undefined' || window.GrammarChat) {
            const ChatClass = GrammarChat || window.GrammarChat;
            this.chat = new ChatClass(this, { maxQuestions: 5 });
            console.log('🗨️ Chat feature initialized after delay');
          } else {
            console.warn('⚠️ GrammarChat module not found after waiting, chat feature disabled');
          }
        }, 2000); // Đợi 2 giây
      }
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
    }
    
    // Khởi tạo event listeners
    this.initEventListeners();

    // Kiểm tra và cập nhật trạng thái RAG
    this.checkRAGStatus();
  }

  // Thêm phương thức mới để kiểm tra trạng thái RAG
  async checkRAGStatus() {
    // Tìm phần tử hiển thị trạng thái RAG
    const ragIndicator = document.getElementById('rag-indicator');
    if (!ragIndicator) return;
    
    const ragStatusText = ragIndicator.querySelector('.rag-status-text');
    if (!ragStatusText) return;
    
    // Hiển thị trạng thái đang kiểm tra
    ragStatusText.textContent = 'RAG: Đang kiểm tra...';
    
    try {
      // Kiểm tra trạng thái RAG
      const isAvailable = await this.api.updateRAGStatus();
      
      // Cập nhật UI dựa trên kết quả
      if (isAvailable) {
        ragIndicator.classList.add('active');
        ragIndicator.classList.remove('inactive');
        ragStatusText.textContent = 'RAG: Kết nối';
        
        // Lưu trạng thái vào localStorage để giảm số lần kiểm tra
        localStorage.setItem('bibi-rag-status', 'connected');
        localStorage.setItem('bibi-rag-checked', Date.now().toString());
      } else {
        ragIndicator.classList.add('inactive');
        ragIndicator.classList.remove('active');
        ragStatusText.textContent = 'RAG: Không kết nối';
        
        // Lưu trạng thái vào localStorage
        localStorage.setItem('bibi-rag-status', 'disconnected');
        localStorage.setItem('bibi-rag-checked', Date.now().toString());
      }
    } catch (error) {
      console.error('Lỗi kiểm tra RAG:', error);
      ragIndicator.classList.add('inactive');
      ragStatusText.textContent = 'RAG: Lỗi kết nối';
      
      // Lưu lỗi vào localStorage
      localStorage.setItem('bibi-rag-status', 'error');
      localStorage.setItem('bibi-rag-error', error.message);
      localStorage.setItem('bibi-rag-checked', Date.now().toString());
    }
  }

  // Thiết lập các event listener
  initEventListeners() {
    // Định nghĩa các xử lý cho từng loại nội dung - SỬA Ở ĐÂY để giữ nguyên context của "this"
    const self = this; // Lưu tham chiếu đến đối tượng hiện tại
    
    const actions = {
      explain: function() { self.handleGrammarRequest('explain', 'giải thích chi tiết', '📝', 'Giải thích về'); },
      examples: function() { self.handleGrammarRequest('examples', 'tạo ví dụ minh họa', '📋', 'Ví dụ về'); },
      exercises: function() { self.handleGrammarRequest('exercises', 'tạo bài tập', '✏️', 'Bài tập về'); },
      mistakes: function() { self.handleGrammarRequest('mistakes', 'phân tích lỗi thường gặp', '⚠️', 'Lỗi thường gặp về'); }
    };
    
    // Liên kết các tab header với các hàm xử lý tương ứng
    document.getElementById('explain-tab').addEventListener('click', actions.explain);
    document.getElementById('examples-tab').addEventListener('click', actions.examples);
    document.getElementById('exercises-tab').addEventListener('click', actions.exercises);
    document.getElementById('mistakes-tab').addEventListener('click', actions.mistakes);
    
    // Giữ nút giải thích chính
    document.getElementById('explain-grammar-btn').addEventListener('click', actions.explain);
    
    // Các nút ngôn ngữ
    if (this.langViBtn) this.langViBtn.addEventListener('click', () => this.setLanguage('vi'));
    if (this.langEnBtn) this.langEnBtn.addEventListener('click', () => this.setLanguage('en'));
    if (this.langBothBtn) this.langBothBtn.addEventListener('click', () => this.setLanguage('both'));
    
    // Xử lý input fields
    this.grammarTopic.addEventListener('change', () => {
      if (this.grammarTopic.value) {
        this.grammarQuery.value = '';
      }
    });
    
    this.grammarQuery.addEventListener('input', () => {
      if (this.grammarQuery.value.trim()) {
        this.grammarTopic.value = '';
      }
    });
    
    // Xử lý chuyển tab khi click
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Lấy loại tab từ ID của nút (ví dụ: "explain-tab" -> "explain")
        const tabType = btn.id.replace('-tab', '');
        
        // Bỏ active class khỏi tất cả tabs
        tabButtons.forEach(tab => tab.classList.remove('active'));
        
        // Thêm active class cho tab đang click
        btn.classList.add('active');
        
        // Bỏ active class khỏi tất cả nội dung tab
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Thêm active class cho nội dung tab tương ứng
        const activeContent = document.getElementById(`${tabType}-content`);
        if (activeContent) {
          activeContent.classList.add('active');
          
          // Nếu nội dung tab trống, tự động kích hoạt chức năng tương ứng
          if (!activeContent.querySelector('.grammar-card') && this.grammarTopic.value) {
            // Kích hoạt chức năng tương ứng
            switch(tabType) {
              case 'explain':
                this.handleGrammarRequest('explain', 'giải thích chi tiết', '📝', 'Giải thích về');
                break;
              case 'examples':
                this.handleGrammarRequest('examples', 'tạo ví dụ minh họa', '📋', 'Ví dụ về');
                break;
              case 'exercises':
                this.handleGrammarRequest('exercises', 'tạo bài tập', '✏️', 'Bài tập về');
                break;
              case 'mistakes':
                this.handleGrammarRequest('mistakes', 'phân tích lỗi thường gặp', '⚠️', 'Lỗi thường gặp về');
                break;
            }
          }
        }
      });
    });
  }

  // Lấy chủ đề ngữ pháp đã chọn
  getSelectedGrammarTopic() {
    const topic = this.grammarTopic.value;
    const query = this.grammarQuery.value.trim();
    
    if (!topic && !query) {
      alert('Vui lòng chọn chủ đề hoặc nhập câu hỏi ngữ pháp');
      return null;
    }
    
    return topic || query;
  }

  // Thiết lập ngôn ngữ hiển thị
  setLanguage(lang) {
    this.selectedLanguage = lang;
    
    // Cập nhật trạng thái active
    this.langViBtn.classList.toggle('active', lang === 'vi');
    this.langEnBtn.classList.toggle('active', lang === 'en');
    this.langBothBtn.classList.toggle('active', lang === 'both');
    
    // Nếu đã có kết quả, cần gọi lại API để cập nhật ngôn ngữ
    const outputArea = document.getElementById('grammar-output');
    if (outputArea.querySelector('.grammar-card')) {
      const lastAction = outputArea.querySelector('h3').dataset.action;
      if (lastAction) {
        const actions = {
          'explain': () => this.handleGrammarRequest('explain', 'giải thích chi tiết', '📝', 'Giải thích về'),
          'examples': () => this.handleGrammarRequest('examples', 'tạo ví dụ minh họa', '📋', 'Ví dụ về'),
          'exercises': () => this.handleGrammarRequest('exercises', 'tạo bài tập', '✏️', 'Bài tập về'),
          'mistakes': () => this.handleGrammarRequest('mistakes', 'phân tích lỗi thường gặp', '⚠️', 'Lỗi thường gặp về')
        };
        
        if (actions[lastAction]) {
          actions[lastAction]();
        }
      }
    }
  }

  // Thay thế hàm handleGrammarRequest trong class GrammarController
  async handleGrammarRequest(promptType, actionVerb, iconEmoji, titlePrefix) {
    const selectedTopic = this.getSelectedGrammarTopic();
    if (!selectedTopic) return;
    
    // Lưu chủ đề hiện tại (THÊM DÒNG NÀY)
    this.lastTopic = selectedTopic;
    
    // Reset chat khi chuyển chủ đề (THÊM DÒNG NÀY)
    if (this.chat) this.chat.resetChat();
    
    // Thêm thông tin tab vào query khi chuyển tab
    let ragQuery = selectedTopic;
    if (promptType === 'examples') ragQuery = 'examples_tab ' + selectedTopic;
    if (promptType === 'exercises') ragQuery = 'exercises_tab ' + selectedTopic;
    if (promptType === 'mistakes') ragQuery = 'mistakes_tab ' + selectedTopic;
    
    // Tạo cache key
    const cacheKey = GrammarCache.getCacheKey(promptType, selectedTopic, this.selectedLanguage);
    
    // Kiểm tra cache
    const cachedContent = GrammarCache.getFromCache(cacheKey);
    if (cachedContent) {
        document.getElementById('grammar-output').innerHTML = cachedContent;
        return;
    }
    
    this.ui.showLoading();
    
    try {
        // Chuẩn bị hướng dẫn ngôn ngữ
        let languageInstruction;
        switch(this.selectedLanguage) {
        case 'vi':
            languageInstruction = "Trả lời hoàn toàn bằng tiếng Việt.";
            break;
        case 'en':
            languageInstruction = "Respond completely in English.";
            break;
        case 'both':
            languageInstruction = "Trả lời song ngữ: mỗi phần có cả tiếng Việt và tiếng Anh (tiếng Anh trong ngoặc).";
            break;
        }
        
        // Chuẩn bị prompt
        const messages = [
        {
            role: "system",
            content: `${GRAMMAR_PROMPTS[promptType]}\n\n${languageInstruction}`
        },
        {
            role: "user",
            content: `Hãy ${actionVerb} về chủ đề ngữ pháp: "${selectedTopic}" cho học sinh lớp 6.`
        }
        ];
        
        // Ẩn loading và khởi tạo UI streaming
        this.ui.hideLoading();
        const title = `${iconEmoji} ${titlePrefix} ${selectedTopic}`;

        // Xác định container đầu ra dựa trên loại prompt
        let outputAreaId = 'grammar-output';
        if (promptType === 'examples') outputAreaId = 'examples-output';
        if (promptType === 'exercises') outputAreaId = 'exercises-output';
        if (promptType === 'mistakes') outputAreaId = 'mistakes-output';

        // Khởi tạo UI streaming với container phù hợp
        const streamingContentElement = this.ui.initStreamingUI(title, promptType, outputAreaId);
        
        // Gọi API streaming - truyền thêm ragQuery cho RAG
        const response = await this.api.streamBiBiResponse(messages, 
          (chunk, fullContent, ragInfo) => {
              // Cập nhật UI khi nhận được từng phần nội dung, thêm truyền ragInfo
              this.ui.updateStreamingContent(streamingContentElement, chunk, fullContent, ragInfo);
          }, {
              ragQuery: ragQuery, // Truyền ragQuery với preffix tab nếu có
              skipCache: window.bibiSkipCache || false // Thêm tùy chọn bỏ qua cache
          });
        
        // Tách nội dung và thông tin RAG từ kết quả trả về
        const fullResponse = response.content;
        const ragInfo = response.ragInfo;
        
        // Hoàn thiện và lưu cache - bây giờ truyền thêm ragInfo
        this.ui.finalizeStreamingContent(streamingContentElement, fullResponse, ragInfo);
        GrammarCache.saveToCache(cacheKey, document.getElementById('grammar-output').innerHTML);
        
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
        this.ui.hideLoading();
        this.ui.showError(error);
    }
  }  
}
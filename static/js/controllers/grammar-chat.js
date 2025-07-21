/**
 * GrammarChat - Module quản lý tính năng hỏi thêm cho BiBi Grammar
 * Phiên bản: 1.0.0
 */

// Đảm bảo xuất class ra ngoài module
export class GrammarChat {
    constructor(grammarController, options = {}) {
      console.log('🗨️ Initializing GrammarChat...');
      
      // Tham chiếu đến controller chính
      this.grammarController = grammarController;
      
      // Các tùy chọn
      this.maxQuestions = options.maxQuestions || 5;
        this.currentTopic = null;
        this.questionCount = parseInt(localStorage.getItem('bibi-question-count') || '0');

        // Thêm try-catch cho toàn bộ quá trình khởi tạo
        try {
        // Kiểm tra xem có chủ đề nào đã lưu không
        const savedTopic = localStorage.getItem('bibi-current-topic');
        if (savedTopic) {
            this.currentTopic = savedTopic;
            console.log(`🔄 Đã khôi phục chủ đề lưu trữ: "${this.currentTopic}"`);
        }
        } catch (error) {
        console.error('Lỗi khi khôi phục chủ đề:', error);
        }
      
      // Khởi tạo phần tử DOM
      this.chatContainer = document.getElementById('follow-up-chat');
      this.messagesContainer = document.getElementById('chat-messages');
      this.chatInput = document.getElementById('chat-input');
      this.sendButton = document.getElementById('send-chat');
      this.closeButton = document.getElementById('close-chat');
      this.chatOverlay = document.getElementById('chat-overlay');
      this.counterElement = document.getElementById('chat-count');
      this.suggestedQuestions = document.getElementById('suggested-questions');
      
      // Kiểm tra xem các phần tử có tồn tại không
      if (!this.chatContainer || !this.messagesContainer || !this.chatInput || 
          !this.sendButton || !this.closeButton || !this.chatOverlay || !this.counterElement) {
        console.error("❌ Không tìm thấy đủ phần tử DOM cho tính năng chat");
        return;
      }
      
      // Khởi tạo các event listener
      this.initEventListeners();
      
      console.log('✅ GrammarChat đã khởi tạo thành công');
    }
    
    // Thiết lập các event listener
    initEventListeners() {
        // Sự kiện khi người dùng gửi tin nhắn
        if (this.sendButton) {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Kiểm tra nút gửi khác (nếu có)
        const otherSendButton = document.getElementById('send-chat-btn');
        if (otherSendButton && otherSendButton !== this.sendButton) {
        otherSendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Xử lý phím Enter
        if (this.chatInput) {
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
            }
        });
        }
        
        // Sự kiện đóng chat
        if (this.closeButton) {
        this.closeButton.addEventListener('click', () => this.hideChat());
        }
        
        if (this.chatOverlay) {
        this.chatOverlay.addEventListener('click', () => this.hideChat());
        }
        
        // Thêm nút chat vào các kết quả ngữ pháp
        this.addChatButtonsToResults();
        // Theo dõi thay đổi ngôn ngữ
        const langButtons = document.querySelectorAll('.lang-btn');
        if (langButtons.length > 0) {
            langButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Lưu chủ đề hiện tại trước khi reset
                    const currentTopic = this.currentTopic;
                    
                    // Reset chat khi đổi ngôn ngữ nhưng giữ nguyên chủ đề
                    setTimeout(() => {
                        this.resetChat();
                        this.currentTopic = currentTopic; // Khôi phục chủ đề
                        console.log(`🔄 Đã reset chat khi đổi ngôn ngữ, giữ chủ đề: ${this.currentTopic}`);
                    }, 500);
                });
            });
        }
        
        // Theo dõi thay đổi tab nội dung
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons.length > 0) {
            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Không reset chat hoàn toàn, chỉ cập nhật chủ đề
                    this.updateCurrentTopic();
                });
            });
        }
    }
    
    // Hiển thị chat
    showChat() {
      // Cập nhật chủ đề hiện tại từ controller
      this.updateCurrentTopic();
      
      // Hiển thị chat và overlay
      this.chatContainer.style.display = 'flex';
      this.chatOverlay.style.display = 'block';
      
      // Focus vào ô nhập liệu
      setTimeout(() => {
        this.chatInput.focus();
      }, 100);
      
      // Cập nhật số lượng câu hỏi còn lại
      this.updateQuestionCounter();
      
      // Tạo câu hỏi gợi ý dựa trên chủ đề
      this.generateSuggestedQuestions();
    }
    
    // Ẩn chat
    hideChat() {
      this.chatContainer.style.display = 'none';
      this.chatOverlay.style.display = 'none';
    }
    
    // Thêm nút chat vào kết quả ngữ pháp
    addChatButtonsToResults() {
        console.log('💬 Đảm bảo chỉ có một nút chat toàn cục');
        
        // Xóa tất cả các nút chat trong grammar card
        const removeAllChatButtons = () => {
            // Xóa tất cả các nút chat đã được thêm trước đó
            document.querySelectorAll('.grammar-card-actions, .chat-btn, .follow-up-container').forEach(el => {
                if (el.id !== 'chat-overlay-toggle' && el.id !== 'follow-up-chat') {
                    el.remove();
                }
            });
        };
        
        // Xóa ngay lập tức
        removeAllChatButtons();
        
        // Đảm bảo nút chat toàn cục hoạt động
        const chatButton = document.getElementById('chat-overlay-toggle');
        if (chatButton) {
            // Xóa tất cả event listeners hiện tại
            const newButton = chatButton.cloneNode(true);
            chatButton.parentNode.replaceChild(newButton, chatButton);
            
            // Thêm event listener mới
            newButton.addEventListener('click', () => {
                console.log('🖱️ Nút chat toàn cục được nhấp');
                this.showChat();
            });
        }
        
        // Đặt MutationObserver mạnh mẽ hơn
        const observer = new MutationObserver((mutations) => {
            removeAllChatButtons();
        });
        
        // Quan sát toàn bộ document
        observer.observe(document.documentElement, { 
            childList: true, 
            subtree: true 
        });
    }
    
    // Cập nhật chủ đề hiện tại
    updateCurrentTopic() {
        // Lưu chủ đề hiện tại trước khi cập nhật
        const oldTopic = this.currentTopic;
        
        // Lấy chủ đề từ tiêu đề hoặc từ controller
        const h3Element = document.querySelector('.grammar-card h3');
        if (h3Element) {
        // Loại bỏ phần emoji và các badge khỏi tiêu đề
        const fullTitle = h3Element.textContent || '';
        this.currentTopic = fullTitle
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D/g, '') // Loại bỏ emoji
          .replace(/RAG|AI/g, '') // Loại bỏ các badge
          .replace(/^\s*[📝✏️📋⚠️]\s*/, '') // Loại bỏ emoji đầu tiên nếu có
          .replace(/Giải thích về|Ví dụ về|Bài tập về|Lỗi thường gặp về/g, '')
          .trim();
        
        console.log(`🔍 Đã xác định chủ đề hiện tại: "${this.currentTopic}"`);
        if (oldTopic !== this.currentTopic) {
            this.resetQuotaForNewTopic(this.currentTopic);
          }
        } else if (this.grammarController.lastTopic) {
          const newTopic = this.grammarController.lastTopic;
          if (oldTopic !== newTopic) {
            this.currentTopic = newTopic;
            this.resetQuotaForNewTopic(newTopic);
          }
        } else {
          this.currentTopic = this.grammarController.getSelectedGrammarTopic() || "ngữ pháp";
        }
    }
    
    // Tạo tin nhắn người dùng
    addUserMessage(message) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageElement = document.createElement('div');
      messageElement.className = 'user-message';
      messageElement.innerHTML = `
        ${message}
        <div class="message-time">${time}</div>
      `;
      this.messagesContainer.appendChild(messageElement);
      this.scrollToBottom();
    }
    
    // Tạo tin nhắn bot
    addBotMessage(message) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageElement = document.createElement('div');
      messageElement.className = 'bot-message';
      messageElement.innerHTML = `
        ${message}
        <div class="message-time">${time}</div>
      `;
      this.messagesContainer.appendChild(messageElement);
      this.scrollToBottom();
    }
    
    // Thêm tin nhắn hệ thống
    addSystemMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'system-message';
      messageElement.textContent = message;
      this.messagesContainer.appendChild(messageElement);
      this.scrollToBottom();
    }
    
    // Hiển thị đang nhập
    showTypingIndicator() {
      const typingElement = document.createElement('div');
      typingElement.className = 'typing-indicator';
      typingElement.id = 'typing-indicator';
      typingElement.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
      `;
      this.messagesContainer.appendChild(typingElement);
      this.scrollToBottom();
    }
    
    // Ẩn đang nhập
    hideTypingIndicator() {
      const typingElement = document.getElementById('typing-indicator');
      if (typingElement) {
        typingElement.remove();
      }
    }
    
    // Cuộn xuống dưới cùng
    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    // Gửi tin nhắn và xử lý
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Kiểm tra số lượng câu hỏi còn lại
        if (this.questionCount >= this.maxQuestions) {
        this.addSystemMessage("Bạn đã sử dụng hết số lượng câu hỏi cho phép.");
        return;
        }
        
        // Thêm tin nhắn người dùng vào chat
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        // Tăng số lượng câu hỏi đã sử dụng
        this.questionCount++;
        this.updateQuestionCounter();
        
        // Hiển thị đang nhập
        this.showTypingIndicator();
        
        try {
        // Tạo prompt với context về chủ đề hiện tại
        const promptWithContext = `Trả lời câu hỏi sau đây về chủ đề "${this.currentTopic}": ${message}`;
        
        // Chuẩn bị messages cho API
        const messages = [
            {
              role: "system",
              content: `Bạn là trợ lý AI dành riêng cho GIÁO VIÊN TIẾNG ANH lớp 6, chỉ hỗ trợ việc GIẢNG DẠY NGỮ PHÁP chủ đề: "${this.currentTopic}".
          
          ⚠️ QUY TẮC BẮT BUỘC:
          1. Chỉ trả lời các câu hỏi liên quan đến VIỆC DẠY hoặc HỌC chủ đề "${this.currentTopic}" trong tiếng Anh lớp 6.
          2. TỪ CHỐI mọi câu hỏi ngoài chủ đề "${this.currentTopic}" — bao gồm cả các chủ đề ngữ pháp khác hoặc các lĩnh vực khác ngoài việc giảng dạy.
          3. Nếu câu hỏi KHÔNG liên quan, trả lời đúng theo mẫu:
             "Xin lỗi, tôi chỉ hỗ trợ về giảng dạy và học chủ đề '${this.currentTopic}'. Vui lòng hỏi về phương pháp giảng dạy, bài tập, ví dụ hoặc cách giải thích điểm ngữ pháp này."
          4. Không trả lời dài dòng — luôn giới hạn độ dài trong **150-200 từ**.
          
          🎯 Mục tiêu: Giúp giáo viên hiểu sâu và dễ dàng truyền đạt điểm ngữ pháp "${this.currentTopic}" một cách rõ ràng, có ví dụ, ngắn gọn.`
            },
            {
              role: "user",
              content: `Câu hỏi của giáo viên liên quan đến chủ đề "${this.currentTopic}": ${message}`
            }
          ];          
        
        // Gọi API từ grammar-api để lấy câu trả lời
        try {
            const response = await this.grammarController.api.streamBiBiResponse(
            messages,
            (chunk, fullContent) => {
                // Cập nhật tin nhắn bot đang hiển thị
                this.hideTypingIndicator();
                const formattedContent = this.grammarController.ui.formatContent(fullContent);
                
                const existingMessage = document.querySelector('.bot-message:last-child');
                if (existingMessage) {
                // Cập nhật nội dung, giữ nguyên thời gian
                const timeElement = existingMessage.querySelector('.message-time');
                if (timeElement) {
                    const time = timeElement.textContent;
                    existingMessage.innerHTML = `${formattedContent}<div class="message-time">${time}</div>`;
                } else {
                    existingMessage.innerHTML = formattedContent;
                }
                } else {
                this.addBotMessage(formattedContent);
                }
            },
            {
                skipCache: true,   // Không cache câu hỏi chat
                useRAG: true,      // Sử dụng RAG nếu có thể
                temperature: 0.8    // Nhiệt độ cao hơn cho câu trả lời sáng tạo
            }
            );
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            this.hideTypingIndicator();
            this.addSystemMessage("Có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.");
        }
        
        // Cập nhật câu hỏi gợi ý mới
        this.generateSuggestedQuestions();
        } catch (error) {
        console.error("Lỗi khi xử lý câu hỏi:", error);
        this.hideTypingIndicator();
        this.addSystemMessage("Có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.");
        }
    }
    
    // Cập nhật số lượng câu hỏi còn lại
    updateQuestionCounter() {
        const remaining = Math.max(0, this.maxQuestions - this.questionCount);
        this.counterElement.textContent = remaining;
        
        // Lưu lại số câu hỏi đã sử dụng
        localStorage.setItem('bibi-question-count', this.questionCount.toString());
        
        // Cập nhật phong cách của counter dựa trên số lượng còn lại
        if (remaining <= 1) {
          this.counterElement.parentElement.style.backgroundColor = 'rgba(255,0,0,0.2)';
        } else if (remaining <= 2) {
          this.counterElement.parentElement.style.backgroundColor = 'rgba(255,165,0,0.2)';
        } else {
          this.counterElement.parentElement.style.backgroundColor = 'rgba(255,255,255,0.2)';
        }
        
        // Ẩn hiện phần gợi ý câu hỏi
        const suggestionsElement = document.getElementById('suggested-questions');
        if (suggestionsElement) {
          // Ẩn gợi ý khi hết câu hỏi
          suggestionsElement.style.display = remaining > 0 ? 'block' : 'none';
        }
        
        // THÊM CODE XỬ LÝ THÔNG BÁO
        if (remaining <= 0) {
          // Xóa các thông báo "hết quota" cũ nếu có
          const oldMessages = this.messagesContainer.querySelectorAll('.system-message.quota-message');
          oldMessages.forEach(msg => msg.remove());
          
          // Thêm thông báo mới
          const messageElement = document.createElement('div');
          messageElement.className = 'system-message quota-message';
          messageElement.textContent = "Bạn đã sử dụng hết số lượng câu hỏi cho phép.";
          this.messagesContainer.appendChild(messageElement);
          this.scrollToBottom();
        }
      }
      
      // Thêm hàm resetQuotaForNewTopic:
      resetQuotaForNewTopic(newTopic) {
        // Nếu chủ đề mới khác hoặc không có chủ đề cũ, reset quota
        if (newTopic && (this.currentTopic === null || newTopic !== this.currentTopic)) {
          console.log(`🔄 Chuyển sang chủ đề mới "${newTopic}", reset quota câu hỏi`);
          this.questionCount = 0;
          localStorage.setItem('bibi-question-count', '0');
          this.updateQuestionCounter();
          
          // Cập nhật thông báo hệ thống
          const systemMsg = document.createElement('div');
          systemMsg.className = 'system-message';
          systemMsg.textContent = `Đã chuyển sang chủ đề "${newTopic}". Bạn có thể hỏi thêm 5 câu hỏi mới.`;
          this.messagesContainer.appendChild(systemMsg);
          this.scrollToBottom();
        }
      }
      
    
    
    // Tạo và hiển thị câu hỏi gợi ý
    generateSuggestedQuestions() {
        if (!this.suggestedQuestions) return;
        
        // Làm sạch container câu hỏi gợi ý
        const buttonsContainer = this.suggestedQuestions.querySelector('.suggest-buttons');
        if (buttonsContainer) {
          buttonsContainer.innerHTML = '';
        } else {
          return;
        }
        
        // Tạo câu hỏi gợi ý dựa trên chủ đề hiện tại
        const suggestedQs = this.getSuggestedQuestions(this.currentTopic);
        
        // Tạo nút gợi ý rút gọn
        const compactButton = document.createElement('button');
        compactButton.className = 'suggest-compact-btn';
        compactButton.innerHTML = '<i class="fas fa-lightbulb"></i> Xem gợi ý';
        compactButton.addEventListener('click', (e) => {
          e.preventDefault();
          const dropdown = document.getElementById('suggest-dropdown');
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        buttonsContainer.appendChild(compactButton);
        
        // Tạo dropdown chứa các câu hỏi gợi ý
        const dropdown = document.createElement('div');
        dropdown.id = 'suggest-dropdown';
        dropdown.className = 'suggest-dropdown';
        dropdown.style.display = 'none';
        
        // Thêm các câu hỏi gợi ý vào dropdown
        suggestedQs.forEach(question => {
          const item = document.createElement('div');
          item.className = 'suggest-item';
          item.textContent = question;
          item.addEventListener('click', () => {
            this.chatInput.value = question;
            dropdown.style.display = 'none';
            this.sendMessage();
          });
          dropdown.appendChild(item);
        });
        
        buttonsContainer.appendChild(dropdown);
    }
    
    // Danh sách câu hỏi gợi ý dựa trên chủ đề
    getSuggestedQuestions(topic) {
        // Câu hỏi chung cho mọi chủ đề - cụ thể hơn cho giáo viên
        const generalQuestions = [
            `Phương pháp dạy "${topic}" phù hợp với học sinh lớp 6?`,
            `Bài tập về "${topic}" phổ biến trong SGK lớp 6?`,
            `Cách giải thích "${topic}" đơn giản cho học sinh?`,
            `Kỹ thuật kiểm tra hiểu biết về "${topic}"?`
        ];
        
        // Câu hỏi đặc thù cho từng chủ đề
        const topicKeywords = {
            'present simple': [
                "Khi nào thêm -s/-es cho động từ hiện tại đơn?",
                "Quy tắc học thuộc về động từ đặc biệt?",
                "Cách phân biệt hiện tại đơn vs hiện tại tiếp diễn?"
            ],
            'present continuous': [
                "Quy tắc thêm -ing cho động từ đặc biệt?",
                "Những động từ cấm dùng với thì tiếp diễn?",
                "Trường hợp nhầm lẫn giữa hiện tại đơn và tiếp diễn?"
            ],
            'past simple': [
                "Bảng động từ bất quy tắc quan trọng cho lớp 6?",
                "Bài tập về quá khứ đơn phù hợp lớp 6?",
                "Cách giải thích did, didn't, was, were dễ hiểu?"
            ],
            'article': [
                "Quy tắc dễ nhớ về a/an cho học sinh lớp 6?",
                "Trường hợp sử dụng the/không dùng the?",
                "Bài tập hay về mạo từ cho lớp 6?"
            ]
        };
        
        // Tìm chủ đề phù hợp
        let specificQuestions = [];
        const topicLower = topic.toLowerCase();
        
        for (const [keyword, questions] of Object.entries(topicKeywords)) {
            if (topicLower.includes(keyword)) {
                specificQuestions = questions;
                break;
            }
        }
        
        // Kết hợp câu hỏi đặc thù và chung
        const combined = [...specificQuestions, ...generalQuestions];
        
        // Lấy tối đa 4 câu hỏi
        return combined.slice(0, 4);
    }
    
    // Reset chat khi chuyển chủ đề
    resetChat() {
      this.questionCount = 0;
      this.updateQuestionCounter();
      
      // Xóa tất cả tin nhắn trừ tin nhắn hệ thống đầu tiên
      const messages = this.messagesContainer.querySelectorAll('.user-message, .bot-message');
      messages.forEach(msg => msg.remove());
      
      // Cập nhật chủ đề mới
      this.updateCurrentTopic();
      
      // Cập nhật câu hỏi gợi ý
      this.generateSuggestedQuestions();
            // Đảm bảo phần gợi ý luôn hiển thị ngay trên khung nhập liệu
            const chatInputContainer = document.querySelector('.chat-input-container');
            const suggestedQuestions = document.getElementById('suggested-questions');
            if (chatInputContainer && suggestedQuestions) {
                // Di chuyển phần gợi ý trước khung nhập
                chatInputContainer.parentNode.insertBefore(suggestedQuestions, chatInputContainer);
                // Đảm bảo nó hiển thị
                suggestedQuestions.style.display = 'block';
            }
        }
    }
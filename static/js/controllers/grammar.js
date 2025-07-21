// grammar.js - Khởi tạo cho trang ngữ pháp
import { GrammarController } from '/static/js/controllers/grammar/grammar-main.js';
import { UIModeManager } from '/static/js/controllers/ui-mode-manager.js';
// Import được thêm tự động qua các import trong các file khác
// GrammarRAG được import trong grammar-api.js

// Chỉ khởi tạo controller khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Grammar.js loaded successfully');
    console.log('📚 RAG Integration: Enabled');
    
    // Khởi tạo quản lý chế độ giao diện
    window.uiModeManager = new UIModeManager();
    
    // Khởi tạo controller chính
    window.grammarController = new GrammarController();
    
    // Thiết lập UI tabs
    setupTabEffects();
    setupTopicSearch();
    setupThemeToggle();
    
    // THÊM DÒNG NÀY
    setupChatButton(); // Thiết lập nút Hỏi thêm
    // Thêm đoạn này vào cuối hàm DOMContentLoaded
    setTimeout(() => {
        // Kiểm tra và khởi tạo GrammarChat nếu chưa tồn tại
        if (window.grammarController) {
            if (!window.grammarController.chat) {
                console.log('⚠️ GrammarChat chưa được khởi tạo, đang khởi tạo...');
                // Giả sử GrammarChat được import từ file chat.js
                import('/static/js/controllers/grammar/grammar-chat.js')
                    .then(module => {
                        const GrammarChat = module.default || module.GrammarChat;
                        window.grammarController.chat = new GrammarChat(window.grammarController);
                        console.log('✅ Đã khởi tạo GrammarChat thành công');
                        
                        // Cập nhật nút chat
                        const chatButton = document.getElementById('chat-overlay-toggle');
                        if (chatButton) {
                            chatButton.disabled = false;
                            chatButton.classList.remove('disabled');
                        }
                    })
                    .catch(err => {
                        console.error('❌ Lỗi khởi tạo GrammarChat:', err);
                    });
            } else {
                console.log('✅ GrammarChat đã được khởi tạo');
            }
        } else {
            console.error('❌ grammarController chưa được khởi tạo');
        }
    }, 2000);
    });

// Hàm thiết lập hiệu ứng chuyển tab (chỉ hiệu ứng, không xử lý logic)
function setupTabEffects() {
    // Hiệu ứng khi click vào tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Xóa trạng thái active từ tất cả các tab buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm trạng thái active cho tab được chọn
            button.classList.add('active');
            
            // Hiển thị nội dung tương ứng
            const tabId = button.id.replace('-tab', '-content');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Kích hoạt chức năng tương ứng nếu tab chưa có nội dung
            if (window.grammarController) {
                if (button.id === 'examples-tab') {
                    const outputArea = document.getElementById('examples-output');
                    if (outputArea && outputArea.innerHTML.trim() === '') {
                        document.getElementById('generate-examples-btn').click();
                    }
                } else if (button.id === 'exercises-tab') {
                    const outputArea = document.getElementById('exercises-output');
                    if (outputArea && outputArea.innerHTML.trim() === '') {
                        document.getElementById('generate-exercises-btn').click();
                    }
                } else if (button.id === 'mistakes-tab') {
                    const outputArea = document.getElementById('mistakes-output');
                    if (outputArea && outputArea.innerHTML.trim() === '') {
                        document.getElementById('common-mistakes-btn').click();
                    }
                }
            }
            
            // Hiển thị trạng thái tab trong URL
            history.replaceState(null, null, `#${button.id}`);
        });
    });
    
    // Kiểm tra URL khi tải trang để chọn tab phù hợp
    if (window.location.hash) {
        const tabId = window.location.hash.substring(1);
        const tabButton = document.getElementById(tabId);
        if (tabButton) {
            tabButton.click();
        }
    }
}

// Thiết lập chức năng tìm kiếm chủ đề
function setupTopicSearch() {
    const searchInput = document.getElementById('topic-search');
    if (!searchInput) return;
    
    const topicSelect = document.getElementById('grammar-topic');
    if (!topicSelect) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) return;
        
        // Nếu tìm thấy kết quả khớp, chọn option đầu tiên
        let foundMatch = false;
        
        for (let i = 0; i < topicSelect.options.length; i++) {
            const optionText = topicSelect.options[i].text.toLowerCase();
            
            if (optionText.includes(searchTerm)) {
                topicSelect.selectedIndex = i;
                foundMatch = true;
                break;
            }
        }
        
        // Nếu tìm không thấy, chuyển nội dung vào ô input
        if (!foundMatch && searchTerm !== '') {
            const queryInput = document.getElementById('grammar-query');
            if (queryInput) {
                queryInput.value = searchInput.value;
            }
        }
    });
}

// Thiết lập chức năng chuyển đổi giao diện sáng/tối
function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    
    const icon = themeBtn.querySelector('i');
    if (!icon) return;
    
    // Kiểm tra theme đã lưu
    const savedTheme = localStorage.getItem('bibi-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('bibi-theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('bibi-theme', 'light');
        }
    });
}

// Thêm ngay sau hàm setupThemeToggle() trong file grammar.js
function setupChatButton() {
    const chatButton = document.getElementById('chat-overlay-toggle');
    if (!chatButton) return;
    
    // Gỡ bỏ tất cả event listeners cũ bằng cách tạo bản sao
    const newButton = chatButton.cloneNode(true);
    chatButton.parentNode.replaceChild(newButton, chatButton);
    
    // Thêm event listener mới
    newButton.addEventListener('click', () => {
        console.log('🗨️ Nút Hỏi thêm được nhấp');
        if (window.grammarController && window.grammarController.chat) {
            window.grammarController.chat.showChat();
        }
    });
}